const {test, expect} = require('@playwright/test');
const http = require('node:http');
const {createPlugin} = require('../plugin.js');

const service = '0000ff08-0000-1000-8000-00805f9b34fb';
const weight = '0000ef81-0000-1000-8000-00805f9b34fb';
const command = '0000ef80-0000-1000-8000-00805f9b34fb';
const button = '0000ef82-0000-1000-8000-00805f9b34fb';
const battery = '0000180f-0000-1000-8000-00805f9b34fb';
const info = '0000180a-0000-1000-8000-00805f9b34fb';
const b64 = bytes => Buffer.from(bytes).toString('base64');
let bridge;
let baseUrl;
let plugin;
let adapter;
let session;
let weightCallback;
let buttonCallback;
const store = new Map();
const state = {weight: null, infos: [], writes: []};

function response(res, status, body, headers = {'content-type': 'application/json'}) {
  res.writeHead(status, headers);
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

test.beforeAll(async () => {
  const host = {
    devices: {bindDriver(_id, driver) { host.driver = driver; }},
    storage(request) {
      queueMicrotask(() => plugin.onEvent({name: request.type === 'read' ? 'storageRead' : 'storageWrite', payload: {key: request.key, value: store.get(request.key)}}));
      if (request.type === 'write') store.set(request.key, request.data);
    },
  };
  plugin = createPlugin(host);
  plugin.onLoad();
  adapter = host.driver.create({id: 'scale-1'});
  let disconnect;
  session = {
    gatt: {
      async discoverServices() { return [service, battery, info]; },
      async writeWithoutResponse(_service, _command, data) { state.writes.push(data); },
      async subscribe(_service, characteristic, callback) { if (characteristic === weight) weightCallback = callback; if (characteristic === button) buttonCallback = callback; },
      async read(_service, characteristic) { return characteristic === '00002a19-0000-1000-8000-00805f9b34fb' ? b64([87]) : b64([...Buffer.from('R-test')]); },
      onDisconnect(callback) { disconnect = callback; },
    },
    async publish(value) { state.weight = value; },
    async publishInfo(value) { state.infos.push(value); },
  };
  const connected = adapter.connect(session);
  await new Promise(resolve => setTimeout(resolve, 2200));
  await weightCallback(b64([0, 10, 0, 0]), {at: Date.now()});
  await connected;
  bridge = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let body = ''; for await (const chunk of req) body += chunk;
    const query = Object.fromEntries(url.searchParams);
    if (url.pathname === '/scale/state') return response(res, 200, state);
    if (url.pathname === '/scale/control') {
      const value = body ? JSON.parse(body) : {};
      if (value.action === 'weight') await weightCallback(b64([0, 25, 0, 0]), {at: Date.now()});
      if (value.action === 'tare') await adapter.tare();
      if (value.action === 'button') await buttonCallback(b64([1]));
      return response(res, 200, state);
    }
    const request = {method: req.method, query};
    if (body) request.body = JSON.parse(body);
    if (url.pathname === '/settings' || url.pathname === '/device-settings') return writePluginResponse(res, await plugin.handleHttpRequest(request));
    return response(res, 404, {error: 'not found'});
  });
  await new Promise(resolve => bridge.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${bridge.address().port}`;
  void disconnect;
});

function writePluginResponse(res, result) { return response(res, result.status, result.body, result.headers); }

test.afterAll(async () => {
  await adapter?.disconnect(session);
  plugin?.onUnload();
  await new Promise(resolve => bridge?.close(resolve));
});

test('renders settings, reloads persisted USB power, and saves it', async ({page, request}) => {
  await page.goto(`${baseUrl}/settings?ui=1&deviceId=scale-1&deviceName=Scale%20One`);
  await expect(page).toHaveTitle('Skale settings');
  await expect(page.locator('#deviceLabel')).toHaveText('Scale One');
  await expect(page.locator('#save')).toBeEnabled();
  await page.locator('#usbPower').check();
  await page.locator('#save').click();
  await expect(page.locator('#status')).toHaveText('Saved');
  await expect((await request.get(`${baseUrl}/settings?deviceId=scale-1`)).json()).resolves.toMatchObject({usbPower: true});
  await page.reload();
  await expect(page.locator('#usbPower')).toBeChecked();
});

test('publishes weight and handles tare plus circle-button commands', async ({request}) => {
  await request.post(`${baseUrl}/scale/control`, {data: {action: 'weight'}});
  await expect.poll(() => request.get(`${baseUrl}/scale/state`).then(result => result.json())).toMatchObject({weight: {weight: 2.5}});
  const before = state.writes.length;
  await request.post(`${baseUrl}/scale/control`, {data: {action: 'tare'}});
  await request.post(`${baseUrl}/scale/control`, {data: {action: 'button'}});
  expect(state.writes.length).toBeGreaterThan(before);
});

test('rejects malformed settings values', async ({request}) => {
  const rejected = await request.post(`${baseUrl}/settings?deviceId=scale-1`, {data: {usbPower: 'yes'}});
  expect(rejected.status()).toBe(400);
});
