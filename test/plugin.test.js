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

const b64 = bytes => Buffer.from(bytes).toString("base64");

function fakeSession(id) {
  const writes = [];
  const publications = [];
  const samples = [];
  const infos = [];
  let onWeight;
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
        assert.equal(characteristic, weightCharacteristic);
        onWeight = callback;
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
    assert.deepEqual(JSON.parse(good.body), {deviceId: "scale-1", usbPower: true});
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
