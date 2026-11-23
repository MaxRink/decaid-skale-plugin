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
let deferWriteAcks = false;
const deferredWriteAcks = [];
const state = {weight: null, infos: [], writes: []};
let pluginsList = null;
let machineInfo = {model: 'DE1', GHC: false};
let grantStatus = 200;
const grantRequests = [];

function response(res, status, body, headers = {'content-type': 'application/json'}) {
  res.writeHead(status, headers);
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

test.beforeAll(async () => {
  const host = {
    devices: {bindDriver(_id, driver) { host.driver = driver; }},
    storage(request) {
      if (request.type === 'write') store.set(request.key, request.data);
      const acknowledge = () => queueMicrotask(() => plugin.onEvent({name: request.type === 'read' ? 'storageRead' : 'storageWrite', payload: {key: request.key, value: store.get(request.key)}}));
      if (request.type === 'write' && deferWriteAcks) deferredWriteAcks.push(acknowledge);
      else acknowledge();
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
    if (url.pathname === '/api/v1/machine/info') return machineInfo ? response(res, 200, machineInfo) : response(res, 404, {error: 'No DE1 connected'});
    if (url.pathname === '/api/v1/plugins') return pluginsList ? response(res, 200, pluginsList) : response(res, 404, {error: 'not found'});
    if (url.pathname === '/api/v1/plugins/skale.reaplugin/machine-control' && req.method === 'PUT') {
      grantRequests.push(JSON.parse(body));
      if (grantStatus !== 200) return response(res, grantStatus, {error: 'Extension management requires a token'});
      pluginsList = pluginsList.map(entry => entry.id === 'skale.reaplugin' ? {...entry, machineControl: true} : entry);
      return response(res, 200, {id: 'skale.reaplugin', machineControl: true});
    }
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
  await expect(page.locator('#squareButtonShot')).not.toBeChecked();
  await page.locator('#usbPower').check();
  await page.locator('#squareButtonShot').check();
  await page.locator('#save').click();
  await expect(page.locator('#status')).toHaveText('Saved');
  await expect((await request.get(`${baseUrl}/settings?deviceId=scale-1`)).json()).resolves.toMatchObject({usbPower: true, squareButtonShot: true});
  await page.reload();
  await expect(page.locator('#usbPower')).toBeChecked();
  await expect(page.locator('#squareButtonShot')).toBeChecked();
});

test('publishes weight and handles tare plus circle-button commands', async ({request}) => {
  await request.post(`${baseUrl}/scale/control`, {data: {action: 'weight'}});
  await expect.poll(() => request.get(`${baseUrl}/scale/state`).then(result => result.json())).toMatchObject({weight: {weight: 2.5}});
  const before = state.writes.length;
  await request.post(`${baseUrl}/scale/control`, {data: {action: 'tare'}});
  await request.post(`${baseUrl}/scale/control`, {data: {action: 'button'}});
  expect(state.writes.length).toBeGreaterThan(before);
});

test('locks the checkbox while a settings save is awaiting host acknowledgement', async ({page}) => {
  await page.goto(`${baseUrl}/settings?ui=1&deviceId=scale-1`);
  await expect(page.locator('#save')).toBeEnabled();
  deferWriteAcks = true;
  await page.locator('#save').click();
  await expect(page.locator('#usbPower')).toBeDisabled();
  await expect(page.locator('#squareButtonShot')).toBeDisabled();
  await expect(page.locator('#save')).toBeDisabled();
  await expect.poll(() => deferredWriteAcks.length).toBe(1);
  const acknowledge = deferredWriteAcks.shift();
  acknowledge();
  await expect(page.locator('#status')).toHaveText('Saved');
  await expect(page.locator('#usbPower')).toBeEnabled();
  deferWriteAcks = false;
});

test('shows the machine-control grant message after a denied square press', async ({page}) => {
  const oldFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    const reply = (status, body) => ({status, ok: status < 300, async json() { return body; }});
    if (url.endsWith('/devices')) return reply(200, [{id: 'scale-1', connectionRole: 'primary'}]);
    if (url.endsWith('/machine/state')) return reply(200, {state: {state: 'idle'}});
    if (url.endsWith('/machine/info')) return reply(200, {GHC: false});
    return options.method === 'PUT'
      ? reply(403, {error: 'Plugin skale.reaplugin is not allowed to control the machine', code: 'machine_control_not_granted'})
      : reply(404, null);
  };
  try {
    await plugin.handleHttpRequest({method: 'POST', query: {deviceId: 'scale-1'}, body: {usbPower: true, squareButtonShot: true}});
    await buttonCallback(b64([2]));
    await new Promise(resolve => setImmediate(resolve));
  } finally {
    global.fetch = oldFetch;
  }
  await page.goto(`${baseUrl}/settings?ui=1&deviceId=scale-1`);
  await expect(page.locator('#status')).toHaveText('Allow machine control for the Skale plugin in Decaid Settings > Plugins');
});

test('hides the machine-control row on stock hosts and shows the fork grant state', async ({page}) => {
  pluginsList = null;
  await page.goto(`${baseUrl}/settings?ui=1&deviceId=scale-1`);
  await expect(page.locator('#save')).toBeEnabled();
  await expect(page.locator('#machineControl')).toBeHidden();
  pluginsList = [{id: 'skale.reaplugin', loaded: true}];
  await page.reload();
  await expect(page.locator('#save')).toBeEnabled();
  await expect(page.locator('#machineControl')).toBeHidden();
  pluginsList = [{id: 'other.reaplugin', machineControl: false}, {id: 'skale.reaplugin', machineControl: true}];
  await page.reload();
  await expect(page.locator('#machineControlText')).toHaveText('Decaid allows the Skale plugin to control the machine.');
  await expect(page.locator('#grant')).toBeHidden();
  pluginsList = null;
});

test('allows machine control only after the user confirms on the page', async ({page}) => {
  grantRequests.length = 0;
  grantStatus = 200;
  pluginsList = [{id: 'skale.reaplugin', machineControl: false}];
  await page.goto(`${baseUrl}/settings?ui=1&deviceId=scale-1`);
  await expect(page.locator('#machineControlText')).toHaveText('To start or stop shots from the scale, Decaid must allow this plugin to control the machine.');
  await expect(page.locator('#machineControl')).toHaveClass(/pu-warn/);
  await page.locator('#grant').click();
  await expect(page.locator('#grantConfirm')).toBeVisible();
  await page.locator('#grantCancel').click();
  await expect(page.locator('#grantConfirm')).toBeHidden();
  expect(grantRequests).toEqual([]);
  await page.locator('#grant').click();
  await page.locator('#grantConfirmButton').click();
  await expect(page.locator('#machineControlText')).toHaveText('Decaid allows the Skale plugin to control the machine.');
  await expect(page.locator('#machineControl')).toHaveClass(/pu-ok/);
  expect(grantRequests).toEqual([{granted: true}]);

  grantStatus = 401;
  pluginsList = [{id: 'skale.reaplugin', machineControl: false}];
  await page.reload();
  await page.locator('#grant').click();
  await page.locator('#grantConfirmButton').click();
  await expect(page.locator('#machineControlText')).toHaveText("Decaid's extension protection is on. Allow machine control for the Skale plugin in Decaid Settings > Plugins.");
  expect(grantRequests).toHaveLength(2);
  grantStatus = 200;
  pluginsList = null;
});

test('explains the square button for machines with and without a group head controller', async ({page}) => {
  const label = page.locator('#squareLabel');
  const hint = page.locator('#squareHint');
  await page.goto(`${baseUrl}/settings?ui=1&deviceId=scale-1`);
  await expect(label).toHaveText('Square button starts and stops a shot');
  await expect(hint).toContainText('starts espresso while the machine is idle');
  await expect(hint).not.toContainText('not connected');

  machineInfo = {model: 'DE1XXL', version: '1358', GHC: true};
  await page.reload();
  await expect(label).toHaveText('Square button stops a shot');
  await expect(hint).toContainText('Your DE1 has a group head controller, so start espresso on the group head.');
  await expect(hint).toContainText('stops a running shot');

  machineInfo = null;
  await page.reload();
  await expect(label).toHaveText('Square button starts and stops a shot');
  await expect(hint).toContainText('Decaid is not connected to the machine right now.');
  await expect(page.locator('#save')).toBeEnabled();
  machineInfo = {model: 'DE1', GHC: false};
});

test('shows the first-connect header until the device settings are saved', async ({page}) => {
  await page.goto(`${baseUrl}/settings?ui=1&deviceId=new-skale&deviceName=New`);
  await expect(page.locator('#welcome')).toBeVisible();
  await expect(page.locator('#welcome h2')).toHaveText('Set up your Skale');
  await page.locator('#save').click();
  await expect(page.locator('#status')).toHaveText('Saved');
  await expect(page.locator('#welcome')).toBeHidden();
  await page.reload();
  await expect(page.locator('#save')).toBeEnabled();
  await expect(page.locator('#welcome')).toBeHidden();
});

for (const theme of ['light', 'dark']) {
  for (const width of [412, 1280]) {
    test(`renders the kit at ${width}px in the ${theme} theme`, async ({page}) => {
      pluginsList = [{id: 'skale.reaplugin', machineControl: false}];
      await page.setViewportSize({width, height: 900});
      await page.goto(`${baseUrl}/settings?ui=1&deviceId=fresh-${theme}-${width}&theme=${theme}`);
      await expect(page.locator('#save')).toBeEnabled();
      await expect(page.locator('#machineControl')).toBeVisible();
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        theme: document.documentElement.dataset.theme,
        scheme: getComputedStyle(document.documentElement).colorScheme,
        background: getComputedStyle(document.querySelector('.pu-page')).backgroundColor,
        buttons: [...document.querySelectorAll('button')].filter(b => b.offsetParent).map(b => b.getBoundingClientRect().height),
        rows: [...document.querySelectorAll('.pu-row')].map(r => r.getBoundingClientRect().height),
      }));
      expect(layout.overflow).toBe(false);
      expect(layout.theme).toBe(theme);
      expect(layout.scheme).not.toBe('dark');
      expect(layout.background).toBe(theme === 'dark' ? 'rgb(16, 18, 23)' : 'rgb(255, 255, 255)');
      expect(Math.min(...layout.buttons)).toBeGreaterThanOrEqual(56);
      expect(Math.min(...layout.rows)).toBeGreaterThanOrEqual(48);
      pluginsList = null;
    });
  }
}

test('follows the embedding skin theme and works framed like the Streamline dialog', async ({page}) => {
  const url = theme => `${baseUrl}/device-settings?ui=1&deviceId=scale-1&deviceName=Skale&embed=1&theme=${theme}`;
  const look = () => page.evaluate(() => ({
    scheme: getComputedStyle(document.documentElement).colorScheme,
    page: getComputedStyle(document.querySelector('.pu-page')).backgroundColor,
    body: getComputedStyle(document.body).backgroundColor,
    done: getComputedStyle(document.querySelector('[data-pu-done]')).display,
  }));
  await page.goto(url('dark'));
  expect(await look()).toEqual({scheme: 'normal', page: 'rgb(16, 18, 23)', body: 'rgba(0, 0, 0, 0)', done: 'none'});
  await page.goto(url('light'));
  expect(await look()).toEqual({scheme: 'normal', page: 'rgb(255, 255, 255)', body: 'rgba(0, 0, 0, 0)', done: 'none'});

  const hostUrl = page.url();
  await page.setContent(`<iframe sandbox="allow-scripts allow-same-origin allow-forms" src="${url('dark')}" style="width:800px;height:600px;border:0;background:#fff"></iframe>`);
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('#deviceLabel')).toHaveText('Skale');
  await expect(frame.locator('#save')).toBeEnabled();
  await expect(frame.locator('#usbPower')).toBeVisible();
  const square = frame.locator('#squareButtonShot');
  await expect(square).toBeVisible();
  await square.setChecked(!(await square.isChecked()));
  const expected = await square.isChecked();
  await frame.locator('#save').click();
  await expect(frame.locator('#status')).toHaveText('Saved');
  expect(page.url()).toBe(hostUrl);
  await expect(page.locator('iframe')).toHaveCount(1);
  expect(JSON.parse(JSON.stringify(await plugin.handleHttpRequest({method: 'GET', query: {deviceId: 'scale-1'}}))).body)
    .toContain(`"squareButtonShot":${expected}`);
});

test('rejects malformed settings values', async ({request}) => {
  const rejected = await request.post(`${baseUrl}/settings?deviceId=scale-1`, {data: {usbPower: 'yes'}});
  expect(rejected.status()).toBe(400);
});
