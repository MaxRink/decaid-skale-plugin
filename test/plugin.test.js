const test = require("node:test");
const assert = require("node:assert/strict");
const {createPlugin} = require("../plugin.js");

const service = "0000ff08-0000-1000-8000-00805f9b34fb";
const weightCharacteristic = "0000ef81-0000-1000-8000-00805f9b34fb";
const commandCharacteristic = "0000ef80-0000-1000-8000-00805f9b34fb";
const batteryService = "0000180f-0000-1000-8000-00805f9b34fb";
const batteryCharacteristic = "00002a19-0000-1000-8000-00805f9b34fb";
const infoService = "0000180a-0000-1000-8000-00805f9b34fb";
const firmwareCharacteristic = "00002a26-0000-1000-8000-00805f9b34fb";
const buttonCharacteristic = "0000ef82-0000-1000-8000-00805f9b34fb";

const b64 = bytes => Buffer.from(bytes).toString("base64");

function fakeSession(id) {
  const writes = [];
  const publications = [];
  const samples = [];
  const infos = [];
  let onWeight;
  let onButton;
  let disconnected;
  const session = {
    writes, publications, samples, infos,
    gatt: {
      async discoverServices() {
        return [service, batteryService, infoService];
      },
      async writeWithoutResponse(s, characteristic, data) {
        writes.push([s, characteristic, data]);
      },
      async subscribe(s, characteristic, callback) {
        assert.equal(s, service);
        if (characteristic === buttonCharacteristic) onButton = callback;
        else {
          assert.equal(characteristic, weightCharacteristic);
          onWeight = callback;
        }
      },
      async read(s, characteristic) {
        if (s === batteryService && characteristic === batteryCharacteristic) return b64([id === "a" ? 87 : 63]);
        if (s === infoService && characteristic === firmwareCharacteristic) return b64([...Buffer.from(`R-${id}`)]);
        throw new Error("unexpected read");
      },
      onDisconnect(callback) { disconnected = callback; },
    },
    async publish(value, sample) { publications.push(value); samples.push(sample); },
    async publishInfo(value) { infos.push(value); },
  };
  session.emitWeight = async (bytes = [0, 10, 0, 0], sample = {at: Date.now()}) => onWeight(b64(bytes), sample);
  session.emitButton = value => onButton(b64([value]));
  session.disconnect = () => disconnected?.();
  return session;
}

function harness({ackReads = true, ackWrites = true} = {}) {
  let driver;
  const store = new Map();
  const storageCalls = [];
  let plugin;
  const host = {
    devices: {bindDriver(id, value) { assert.equal(id, "skale"); driver = value; }},
    storage(command) {
      storageCalls.push(command);
      if (command.type === "write") store.set(command.key, command.data);
      if ((command.type === "read" && ackReads) ||
          (command.type === "write" && ackWrites)) {
        queueMicrotask(() => plugin.onEvent({
          name: command.type === "read" ? "storageRead" : "storageWrite",
          payload: {key: command.key, value: store.get(command.key)},
        }));
      }
    },
  };
  plugin = createPlugin(host);
  plugin.onLoad();
  return {plugin, driver, store, storageCalls};
}

test("registers current settings surface and keeps two bindings independent", async () => {
  const oldFetch = global.fetch;
  global.fetch = async url => ({ok: false, status: 404, async json() { return {}; }});
  try {
    const {driver} = harness();
    const a = fakeSession("a");
    const b = fakeSession("b");
    const aAdapter = driver.create({id: "a"});
    const bAdapter = driver.create({id: "b"});
    try {
      const aConnect = aAdapter.connect(a);
      const bConnect = bAdapter.connect(b);
      await new Promise(resolve => setTimeout(resolve, 2150));
      await Promise.all([a.emitWeight(), b.emitWeight(), aConnect, bConnect]);
      assert.deepEqual(a.publications, [{weight: 1, battery: 87}]);
      assert.deepEqual(b.publications, [{weight: 1, battery: 63}]);
      assert.deepEqual(a.infos, [{batteryLevel: 87}, {firmwareVersion: "R-a", batteryLevel: 87}]);
      assert.deepEqual(b.infos, [{batteryLevel: 63}, {firmwareVersion: "R-b", batteryLevel: 63}]);
      await aAdapter.tare();
      assert.equal(a.writes.at(-1)[2], b64([0x10]));
      assert.notEqual(a.writes, b.writes);
      const weightCases = [
        {bytes: [0, 0, 0, 0], value: 0},
        {bytes: [0, 0, 0, 1], value: 0x01000000 / 2560},
        {bytes: [0xff, 0xff, 0xff, 0xff], value: -1 / 2560},
        {bytes: [0, 0xff, 0xff, 0xff, 0], value: -1},
        {bytes: [0, 0x2a, 0, 0, 0], value: 42},
        {bytes: [0, 0xff, 0xff, 0xff, 0, 0, 0, 0, 0], value: -1},
        {bytes: [0, 0x2a, 0, 0, 0, 0, 0, 0, 0], value: 42},
        {bytes: [0, 123, 0, 0, 0xff], value: 12.3},
        {bytes: [0, 123, 0, 0, 1], value: 1230},
      ];
      for (const sample of weightCases) {
        await a.emitWeight(sample.bytes);
        assert.equal(a.publications.at(-1).weight, sample.value);
      }
      const publicationCount = a.publications.length;
      await a.emitWeight([0, 1]);
      await a.emitWeight([0, 1, 2, 3, 4, 5]);
      assert.equal(a.publications.length, publicationCount);
      const sampleToken = {token: "sample-token"};
      await a.emitWeight([0, 10, 0, 0], sampleToken);
      assert.strictEqual(a.samples.at(-1), sampleToken);
    } finally {
      await Promise.all([aAdapter.disconnect(a), bAdapter.disconnect(b)]);
    }
  } finally {
    global.fetch = oldFetch;
  }
});

test("settings endpoint rejects malformed values and applies valid USB declaration", async () => {
  const oldFetch = global.fetch;
  const stored = new Map();
  global.fetch = async (url, options = {}) => {
    const key = decodeURIComponent(url.split("/").at(-1));
    if (!options.method) return stored.has(key)
      ? {ok: true, status: 200, async json() { return stored.get(key); }}
      : {ok: false, status: 404, async json() { return {}; }};
    stored.set(key, JSON.parse(options.body));
    return {ok: true, status: 200, async json() { return {}; }};
  };
  try {
    const {plugin} = harness();
    const bad = await plugin.handleHttpRequest({method: "POST", query: {deviceId: "scale-1"}, body: {usbPower: "yes"}});
    assert.equal(bad.status, 400);
    const good = await plugin.handleHttpRequest({method: "POST", query: {deviceId: "scale-1"}, body: {usbPower: true}});
    assert.equal(good.status, 200);
    assert.deepEqual(JSON.parse(good.body), {deviceId: "scale-1", usbPower: true, squareButtonShot: false});
    const square = await plugin.handleHttpRequest({method: "POST", query: {deviceId: "scale-1"}, body: {usbPower: true, squareButtonShot: true}});
    assert.deepEqual(JSON.parse(square.body), {deviceId: "scale-1", usbPower: true, squareButtonShot: true});
    const preserved = await plugin.handleHttpRequest({method: "POST", query: {deviceId: "scale-1"}, body: {usbPower: false}});
    assert.deepEqual(JSON.parse(preserved.body), {deviceId: "scale-1", usbPower: false, squareButtonShot: true});
    for (const body of [{usbPower: true, squareButtonShot: "yes"}, {usbPower: true, extra: 1}]) {
      assert.equal((await plugin.handleHttpRequest({method: "POST", query: {deviceId: "scale-1"}, body})).status, 400);
    }
  } finally {
    global.fetch = oldFetch;
  }
});

test("storage write timeout fails closed and ignores a late uncorrelated acknowledgement", async () => {
  const {plugin} = harness({ackWrites: false});
  const initial = await plugin.handleHttpRequest({
    method: "GET", query: {deviceId: "scale-1"},
  });
  assert.equal(initial.status, 200);
  const first = await plugin.handleHttpRequest({
    method: "POST", query: {deviceId: "scale-1"}, body: {usbPower: true},
  });
  assert.equal(first.status, 502);
  plugin.onEvent({name: "storageWrite", payload: {value: "late"}});
  const second = await plugin.handleHttpRequest({
    method: "POST", query: {deviceId: "scale-2"}, body: {usbPower: false},
  });
  assert.equal(second.status, 502);
  const stale = await plugin.handleHttpRequest({
    method: "GET", query: {deviceId: "scale-1"},
  });
  assert.equal(stale.status, 503);
  plugin.onUnload();
});

test("storage read timeout blocks reconnect until plugin reload", async () => {
  const {plugin} = harness({ackReads: false});
  const first = await plugin.handleHttpRequest({
    method: "GET", query: {deviceId: "scale-1"},
  });
  assert.equal(first.status, 503);
  plugin.onEvent({
    name: "storageRead",
    payload: {key: "skale.reaplugin.device.scale-1", value: {usbPower: true}},
  });
  const second = await plugin.handleHttpRequest({
    method: "GET", query: {deviceId: "scale-1"},
  });
  assert.equal(second.status, 503);
  plugin.onUnload();
});

test("unload rejects queued reads without issuing another host request", async () => {
  const {plugin, storageCalls} = harness({ackReads: false});
  const pending = plugin.handleHttpRequest({
    method: "GET", query: {deviceId: "scale-1"},
  });
  await new Promise(resolve => setImmediate(resolve));
  plugin.onUnload();
  assert.equal((await pending).status, 503);
  const callsAfterUnload = storageCalls.length;
  assert.equal((await plugin.handleHttpRequest({
    method: "GET", query: {deviceId: "scale-1"},
  })).status, 503);
  assert.equal(storageCalls.length, callsAfterUnload);
  plugin.onEvent({
    name: "storageRead",
    payload: {key: "skale.reaplugin.device.scale-1", value: {usbPower: true}},
  });
});

test("stored settings default square button off and reject malformed values", async () => {
  const {plugin, store} = harness();
  store.set("skale.reaplugin.device.legacy", {usbPower: true});
  store.set("skale.reaplugin.device.bad", {usbPower: true, squareButtonShot: "yes"});
  const legacy = await plugin.handleHttpRequest({method: "GET", query: {deviceId: "legacy"}});
  assert.deepEqual(JSON.parse(legacy.body), {deviceId: "legacy", usbPower: true, squareButtonShot: false});
  const fresh = await plugin.handleHttpRequest({method: "GET", query: {deviceId: "fresh"}});
  assert.deepEqual(JSON.parse(fresh.body), {deviceId: "fresh", usbPower: false, squareButtonShot: false});
  assert.equal((await plugin.handleHttpRequest({method: "GET", query: {deviceId: "bad"}})).status, 503);
  plugin.onUnload();
});

test("square button starts and stops shots only for the opted-in primary scale", async () => {
  const oldFetch = global.fetch;
  const realNow = Date.now;
  const api = {role: "primary", state: "idle", info: {GHC: false}, putStatus: 200, putBody: null, putError: null, hold: null};
  const calls = [];
  global.fetch = async (url, options = {}) => {
    const path = url.replace("http://localhost:8080/api/v1", "");
    calls.push(`${options.method || "GET"} ${path}`);
    const reply = (status, body) => ({status, ok: status >= 200 && status < 300, async json() { return body; }});
    if (path === "/devices") {
      if (api.hold) await api.hold;
      return reply(200, [{id: "other", connectionRole: "auxiliary"}, {id: "a", connectionRole: api.role}]);
    }
    if (path === "/machine/state") return reply(200, {state: {state: api.state, substate: "idle"}});
    if (path === "/machine/info") return api.info ? reply(200, api.info) : reply(404, {error: "not connected"});
    if (options.method === "PUT") {
      if (api.putError) throw new Error(api.putError);
      return reply(api.putStatus, api.putBody);
    }
    return reply(404, {});
  };
  const {plugin, driver} = harness();
  const a = fakeSession("a");
  const adapter = driver.create({id: "a"});
  const flush = () => new Promise(resolve => setImmediate(resolve));
  let clock = 1e9;
  const press = async () => {
    clock += 5000;
    await a.emitButton(2);
    await flush();
  };
  const puts = () => calls.filter(call => call.startsWith("PUT"));
  const settings = async () => JSON.parse((await plugin.handleHttpRequest({method: "GET", query: {deviceId: "a"}})).body);
  try {
    const connected = adapter.connect(a);
    await new Promise(resolve => setTimeout(resolve, 2150));
    await Promise.all([a.emitWeight(), connected]);
    Date.now = () => clock;

    await press();
    assert.deepEqual(calls, [], "default off makes no host requests");
    const writesBefore = a.writes.length;

    const enabled = await plugin.handleHttpRequest({method: "POST", query: {deviceId: "a"}, body: {usbPower: false, squareButtonShot: true}});
    assert.equal(enabled.status, 200);
    await press();
    assert.deepEqual(calls, ["GET /devices", "GET /machine/state", "GET /machine/info", "PUT /machine/state/espresso"]);
    assert.equal(a.writes.length, writesBefore, "square never sends a scale command");

    api.state = "espresso";
    await press();
    assert.deepEqual(puts(), ["PUT /machine/state/espresso", "PUT /machine/state/idle"]);

    for (const change of [{state: "sleeping"}, {state: "steam"}, {state: "idle", info: {GHC: true}},
      {state: "idle", info: {}}, {state: "idle", info: null}]) {
      Object.assign(api, change);
      await press();
    }
    assert.equal(puts().length, 2, "sleeping, other states and GHC true/unknown are ignored");

    api.info = {GHC: false};
    api.role = "auxiliary";
    calls.length = 0;
    await press();
    assert.deepEqual(calls, ["GET /devices"], "auxiliary binding never reads or controls the machine");
    api.role = "primary";

    calls.length = 0;
    await press();
    await a.emitButton(2);
    await flush();
    assert.deepEqual(puts(), ["PUT /machine/state/espresso"], "presses inside the debounce window are ignored");

    calls.length = 0;
    let release;
    api.hold = new Promise(resolve => { release = resolve; });
    clock += 5000;
    await a.emitButton(2);
    await press();
    assert.deepEqual(calls, ["GET /devices"], "no second request while one is in flight");
    api.hold = null;
    release();
    await flush();
    assert.deepEqual(puts(), ["PUT /machine/state/espresso"]);

    calls.length = 0;
    api.putStatus = 403;
    api.putBody = {
      error: "Plugin skale.reaplugin is not allowed to control the machine; the user can allow it in Settings > Plugins",
      code: "machine_control_not_granted",
    };
    await press();
    assert.deepEqual(puts(), ["PUT /machine/state/espresso"], "403 is not retried");
    assert.equal((await settings()).machineControlMessage,
      "Allow machine control for the Skale plugin in Decaid Settings > Plugins");
    api.putStatus = 200;
    api.putBody = null;
    api.putError = "network down";
    await press();
    assert.ok((await settings()).machineControlMessage, "a failed request keeps the last hint");
    api.putError = null;
    await press();
    assert.equal((await settings()).machineControlMessage, undefined, "a successful request clears the message");
    api.putStatus = 403;
    api.putBody = {error: "other", code: "something_else"};
    await press();
    assert.equal((await settings()).machineControlMessage, undefined, "only machine_control_not_granted shows the hint");
    api.putStatus = 200;
    api.putBody = null;

    calls.length = 0;
    api.hold = new Promise(resolve => { release = resolve; });
    clock += 5000;
    await a.emitButton(2);
    a.disconnect();
    api.hold = null;
    release();
    await flush();
    assert.deepEqual(puts(), [], "a session retired mid-request does not control the machine");
  } finally {
    Date.now = realNow;
    global.fetch = oldFetch;
    await adapter.disconnect(a);
    plugin.onUnload();
  }
});
