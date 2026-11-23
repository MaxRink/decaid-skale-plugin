/* plugin-ui:begin */
const PLUGIN_UI = {"version":1,"sha256":{"css":"e725294a0884b0db871d778596bf065dda587f38d2c8130c5d37dce9950134ec","js":"749c8fd79583c4fdebc357cfcf1532a13bb61f7b495ed40dd323550f8e32b676"},"css":":root{--pu-bg:#fff;--pu-surface:#f6f8fa;--pu-text:#121212;--pu-muted:#5f6368;--pu-border:#c9c9c9;--pu-accent:#385a92;--pu-link:#385a92;--pu-on-accent:#fff;--pu-scheme:light;--pu-ok:#0a8a6c;--pu-warn:#b26a00;--pu-danger:#c62828;--pu-radius:12px;--pu-tap:56px;--pu-row:48px}\n:root[data-theme=dark]{--pu-bg:#101217;--pu-surface:#17191e;--pu-text:#e8e8e8;--pu-muted:#959595;--pu-border:#3d4255;--pu-accent:#415996;--pu-link:#9db4ee;--pu-scheme:dark;--pu-ok:#0ca581;--pu-warn:#e0a030;--pu-danger:#ef5350}\n@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--pu-bg:#101217;--pu-surface:#17191e;--pu-text:#e8e8e8;--pu-muted:#959595;--pu-border:#3d4255;--pu-accent:#415996;--pu-link:#9db4ee;--pu-scheme:dark;--pu-ok:#0ca581;--pu-warn:#e0a030;--pu-danger:#ef5350}}\n*,*::before,*::after{box-sizing:border-box}\nbody.pu{margin:0;background:var(--pu-bg);color:var(--pu-text);font:18px/1.4 system-ui,\"Inter\",-apple-system,\"Segoe UI\",Roboto,sans-serif;-webkit-text-size-adjust:100%}\n[data-embed] body.pu{background:transparent}\n.pu [hidden]{display:none!important}\n.pu-page{max-width:46rem;margin:0 auto;padding:16px;background:var(--pu-bg);border-radius:var(--pu-radius)}\n.pu h1{font-size:24px;margin:0}.pu h2{font-size:20px;margin:0 0 8px}.pu p{margin:0 0 12px}\n.pu a{color:var(--pu-link)}\n.pu-muted,.pu-hint{color:var(--pu-muted);font-size:16px}\n.pu-header{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:var(--pu-tap);margin-bottom:12px}\n[data-embed] [data-pu-done]{display:none}\n.pu-card{background:var(--pu-surface);border:1px solid var(--pu-border);border-radius:var(--pu-radius);padding:16px;margin:0 0 16px}\n.pu-row{display:grid;gap:4px 16px;align-items:center;min-height:var(--pu-row);padding:8px 0;border-top:1px solid var(--pu-border)}\n.pu-row:first-child{border-top:0}\n@media (min-width:600px){.pu-row{grid-template-columns:minmax(10rem,1fr) minmax(0,1.4fr)}.pu-row>.pu-hint{grid-column:1/-1}}\n.pu label{font-weight:600}\n.pu input:not([type=checkbox]):not([type=radio]),.pu select,.pu textarea{width:100%;min-height:var(--pu-row);padding:10px 12px;font:inherit;color:var(--pu-text);background:var(--pu-bg);border:1px solid var(--pu-border);border-radius:8px;color-scheme:var(--pu-scheme)}\n.pu textarea{min-height:8rem;font-family:ui-monospace,monospace;font-size:15px}\n.pu :focus-visible{outline:3px solid var(--pu-accent);outline-offset:2px}\n.pu-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:var(--pu-tap);padding:0 28px;font:inherit;font-weight:700;border-radius:999px;border:2px solid var(--pu-accent);background:var(--pu-accent);color:var(--pu-on-accent);cursor:pointer;text-decoration:none}\n.pu-btn.pu-secondary{background:transparent;color:var(--pu-link)}\n.pu-btn.pu-danger{background:var(--pu-danger);border-color:var(--pu-danger)}\n.pu-btn:disabled{opacity:.45;cursor:not-allowed}\n.pu-actions{display:flex;flex-wrap:wrap;gap:12px;justify-content:flex-end;padding:12px 0}\n.pu-actions.pu-sticky{position:sticky;bottom:0;background:var(--pu-bg);border-top:1px solid var(--pu-border)}\n.pu-switch{appearance:none;flex:none;width:72px;height:40px;margin:8px 0;border-radius:999px;background:var(--pu-border);position:relative;cursor:pointer;transition:background .15s}\n.pu-switch::after{content:\"\";position:absolute;top:4px;left:4px;width:32px;height:32px;border-radius:50%;background:#fff;transition:transform .15s}\n.pu-switch:checked{background:var(--pu-accent)}.pu-switch:checked::after{transform:translateX(32px)}\n.pu-choice{display:grid;gap:12px;margin:0;padding:0;border:0}\n.pu-choice label{display:flex;gap:12px;align-items:flex-start;min-height:var(--pu-tap);padding:14px 16px;border:2px solid var(--pu-border);border-radius:var(--pu-radius);cursor:pointer;font-weight:400}\n.pu-choice label:has(input:checked){border-color:var(--pu-accent)}\n.pu-choice label:has(input:disabled){opacity:.5;cursor:not-allowed}\n.pu-choice input{width:24px;height:24px;margin:2px 0 0;accent-color:var(--pu-accent);color-scheme:var(--pu-scheme);flex:none}\n.pu-choice b{display:block}\n.pu-stepper{display:flex;align-items:center;gap:8px;margin:0 0 16px;color:var(--pu-muted);font-size:16px}\n.pu-stepper i{width:10px;height:10px;border-radius:50%;background:var(--pu-border)}\n.pu-stepper i.on{background:var(--pu-accent)}\n.pu-pill{display:inline-flex;align-items:center;min-height:32px;padding:2px 12px;border-radius:999px;font-size:15px;font-weight:600;border:1px solid currentColor;color:var(--pu-muted)}\n.pu-pill.pu-ok{color:var(--pu-ok)}.pu-pill.pu-warn{color:var(--pu-warn)}.pu-pill.pu-error{color:var(--pu-danger)}\n.pu-alert{padding:12px 16px;margin:0 0 16px;border-radius:var(--pu-radius);border-left:6px solid var(--pu-accent);background:var(--pu-surface)}\n.pu-alert.pu-ok{border-color:var(--pu-ok)}.pu-alert.pu-warn{border-color:var(--pu-warn)}.pu-alert.pu-error{border-color:var(--pu-danger)}\n.pu-code{display:block;padding:12px;font:15px/1.6 ui-monospace,monospace;background:var(--pu-bg);border:1px solid var(--pu-border);border-radius:8px;overflow-wrap:anywhere}\n.pu-secure{display:flex;gap:8px}.pu-secure input{flex:1}.pu-secure .pu-btn{padding:0 16px}\ndetails.pu-details{margin:0 0 16px}details.pu-details>summary{min-height:var(--pu-row);display:flex;align-items:center;cursor:pointer;font-weight:600;color:var(--pu-link)}\n@media (prefers-reduced-motion:reduce){.pu *{transition:none!important}}\n","js":"(function () {\n  \"use strict\";\n  var q = new URLSearchParams(location.search), root = document.documentElement;\n  var lang = (q.get(\"lang\") || \"en\").toLowerCase().split(\"-\")[0];\n  var strings = {de: {Back: \"Zurück\", Next: \"Weiter\", Done: \"Fertig\", Show: \"Anzeigen\", Hide: \"Verbergen\", \"Step {n} of {m}\": \"Schritt {n} von {m}\"}};\n  var embedded = q.get(\"embed\") === \"1\", fit = false;\n  var parentPost = function (msg) { if (window.parent !== window) window.parent.postMessage(msg, \"*\"); };\n  var pu = {\n    lang: lang, embedded: embedded, params: q,\n    t: function (key, vars) {\n      var s = (strings[lang] && strings[lang][key]) || key;\n      return s.replace(/\\{(\\w+)\\}/g, function (_, k) { return vars && k in vars ? vars[k] : \"{\" + k + \"}\"; });\n    },\n    init: function (opts) {\n      opts = opts || {};\n      Object.keys(opts.strings || {}).forEach(function (l) { strings[l] = Object.assign(strings[l] || {}, opts.strings[l]); });\n      document.querySelectorAll(\"[data-pu-t]\").forEach(function (el) { el.textContent = pu.t(el.getAttribute(\"data-pu-t\")); });\n      fit = Boolean(opts.fit) && embedded;\n      parentPost({type: \"streamline:ready\"});\n      if (fit) { pu.size(); if (window.ResizeObserver) new ResizeObserver(pu.size).observe(document.querySelector(\".pu-page\") || document.body); }\n    },\n    size: function () {\n      if (!fit) return;\n      var r = (document.querySelector(\".pu-page\") || document.body).getBoundingClientRect();\n      parentPost({type: \"streamline:size\", width: Math.ceil(r.width), height: Math.ceil(r.height)});\n    },\n    done: async function () {\n      if (window.parent !== window) return parentPost({type: \"streamline:close\"});\n      var bridge = window.flutter_inappwebview;\n      if (bridge && bridge.callHandler) return bridge.callHandler(\"pluginSurface\", {type: \"close\"});\n      var target = q.get(\"returnTo\"), skin = null, path = q.get(\"return\");\n      try {\n        if (!target && path && /^\\/(?![\\/\\\\])/.test(path)) {\n          var s = await (await fetch(\"/api/v1/webui/server/status\")).json();\n          if (s.serving && Number.isInteger(s.port)) { skin = new URL(location.href); skin.port = String(s.port); target = new URL(path, skin.origin).href; }\n        }\n        if (target) {\n          var u = new URL(target);\n          if (/^https?:$/.test(u.protocol) && u.hostname === location.hostname && !u.username && !u.password && (!skin || u.origin === skin.origin)) return location.assign(u.href);\n        }\n      } catch (e) { target = null; }\n      history.back();\n    },\n    api: async function (path, opts) {\n      opts = opts || {};\n      var res = await fetch(path, {method: opts.method || (opts.body === undefined ? \"GET\" : \"POST\"),\n        headers: opts.body === undefined ? {} : {\"Content-Type\": \"application/json\"},\n        body: opts.body === undefined ? undefined : JSON.stringify(opts.body)});\n      var data = null; try { data = await res.json(); } catch (e) { data = null; }\n      if (!res.ok) { var err = new Error((data && data.error) || \"HTTP \" + res.status); err.status = res.status; err.data = data; throw err; }\n      return data;\n    },\n    secureValue: function (input, wasSet) {\n      if (input.value) return input.value;\n      return wasSet ? {isSet: true} : undefined;\n    },\n    fingerprint: function (hex) {\n      return String(hex).replace(/[^0-9a-f]/gi, \"\").toUpperCase().replace(/(..)(?!$)/g, \"$1:\");\n    },\n    wizard: function (container, onNext) {\n      var steps = Array.prototype.slice.call(container.querySelectorAll(\"[data-pu-step]\")), i = 0;\n      var back = container.querySelector(\"[data-pu-back]\"), next = container.querySelector(\"[data-pu-next]\"), bar = container.querySelector(\"[data-pu-stepper]\");\n      function show(n) {\n        i = n;\n        steps.forEach(function (s, k) { s.hidden = k !== i; });\n        if (back) back.disabled = i === 0;\n        if (next) next.hidden = i === steps.length - 1;\n        if (bar) bar.innerHTML = steps.map(function (_, k) { return \"<i class=\\\"\" + (k <= i ? \"on\" : \"\") + \"\\\"></i>\"; }).join(\"\") + \"<span></span>\";\n        if (bar) bar.lastChild.textContent = pu.t(\"Step {n} of {m}\", {n: i + 1, m: steps.length});\n        var h = steps[i].querySelector(\"h2\"); if (h) { h.tabIndex = -1; h.focus(); }\n        pu.size();\n      }\n      if (back) back.addEventListener(\"click\", function () { if (i > 0) show(i - 1); });\n      if (next) next.addEventListener(\"click\", async function () {\n        next.disabled = true;\n        try { if (!onNext || (await onNext(i, steps[i])) !== false) show(Math.min(i + 1, steps.length - 1)); } finally { next.disabled = false; }\n      });\n      show(0);\n      return {show: show, get index() { return i; }};\n    }\n  };\n  var theme = q.get(\"theme\");\n  if (theme === \"light\" || theme === \"dark\") root.setAttribute(\"data-theme\", theme);\n  if (embedded) root.setAttribute(\"data-embed\", \"\");\n  root.lang = lang;\n  document.addEventListener(\"click\", function (e) {\n    var b = e.target.closest && e.target.closest(\"[data-pu-reveal]\");\n    if (b) {\n      var input = b.parentNode.querySelector(\"input\");\n      var hidden = input.type === \"password\";\n      input.type = hidden ? \"text\" : \"password\";\n      b.textContent = pu.t(hidden ? \"Hide\" : \"Show\");\n      b.setAttribute(\"aria-pressed\", String(hidden));\n    }\n    if (e.target.closest && e.target.closest(\"[data-pu-done]\")) pu.done();\n  });\n  window.pu = pu;\n})();\n"};
/* plugin-ui:end */

function createPlugin(host) {
  const service = "0000ff08-0000-1000-8000-00805f9b34fb";
  const weightCharacteristic = "0000ef81-0000-1000-8000-00805f9b34fb";
  const commandCharacteristic = "0000ef80-0000-1000-8000-00805f9b34fb";
  const buttonCharacteristic = "0000ef82-0000-1000-8000-00805f9b34fb";
  const batteryService = "0000180f-0000-1000-8000-00805f9b34fb";
  const batteryCharacteristic = "00002a19-0000-1000-8000-00805f9b34fb";
  const deviceInformationService = "0000180a-0000-1000-8000-00805f9b34fb";
  const firmwareCharacteristic = "00002a26-0000-1000-8000-00805f9b34fb";
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const initStepDelay = 1000;
  const batteryRefreshInterval = 30 * 60 * 1000;
  const deviceSettings = new Map();
  const settingsOperations = new Map();
  const instanceControls = new Map();
  const pendingStorageReads = new Map();
  const pendingStorageWrites = [];
  const failedStorageReads = new Set();
  const unconfiguredDevices = new Set();
  // Host storage is asynchronous (Hive/open-box and put); keep the deadline
  // bounded without treating a normal slow disk as an unrecoverable fault.
  const storageAckTimeout = 5000;
  const hostApi = "http://localhost:8080/api/v1";
  const squareDebounce = 1000;
  const machineControlHint =
    "Allow machine control for the Skale plugin in Decaid Settings > Plugins";
  let squareInFlight = false;
  let lastSquarePress = -Infinity;
  let machineControlMessage = null;
  let storageWriteQueue = Promise.resolve();
  let storageWriteFailure = null;
  let unloaded = false;

  function settingKey(deviceId) {
    return "skale.reaplugin.device." + deviceId;
  }

  function jsonResponse(status, body) {
    return {
      status,
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body),
    };
  }

  function htmlResponse(status, body) {
    return {
      status,
      headers: {"Content-Type": "text/html; charset=utf-8"},
      body,
    };
  }

  const settingsPage = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Skale settings</title>
<style>${PLUGIN_UI.css}</style>
<body class="pu">
<main class="pu-page">
  <header class="pu-header">
    <h1>Skale</h1>
    <button type="button" class="pu-btn pu-secondary" data-pu-done>Done</button>
  </header>
  <p class="pu-muted">Device: <span id="deviceLabel"></span></p>
  <section id="welcome" class="pu-alert" hidden>
    <h2>Set up your Skale</h2>
    <p>This plugin connects your Skale to Decaid. It reports weight, tares the scale with
    the circle button, runs the timer and reads the battery. Choose how it should behave,
    then save.</p>
  </section>
  <form id="settings">
    <div class="pu-card">
      <div class="pu-row">
        <label for="usbPower">USB powered</label>
        <input id="usbPower" class="pu-switch" type="checkbox" role="switch">
        <p class="pu-hint">Turn on if the Skale is always on USB power. Decaid then stops
        reading the battery.</p>
      </div>
      <div class="pu-row">
        <label for="squareButtonShot">Square button starts and stops a shot</label>
        <input id="squareButtonShot" class="pu-switch" type="checkbox" role="switch">
        <p class="pu-hint">Starts espresso only when this is the primary scale, the machine is
        idle and no group head controller is present; stops a running shot. Never wakes the
        machine.</p>
      </div>
    </div>
    <section id="machineControl" class="pu-alert" hidden>
      <p id="machineControlText"></p>
      <div id="grantStart" class="pu-actions" hidden>
        <button type="button" id="grant" class="pu-btn">Allow in Decaid</button>
      </div>
      <div id="grantConfirm" hidden>
        <p>Allow the Skale plugin to start and stop shots on your machine? You can turn this
        off again in Decaid Settings &gt; Plugins.</p>
        <div class="pu-actions">
          <button type="button" id="grantCancel" class="pu-btn pu-secondary">Cancel</button>
          <button type="button" id="grantConfirmButton" class="pu-btn">Allow machine control</button>
        </div>
      </div>
    </section>
    <div class="pu-actions">
      <button id="save" class="pu-btn" disabled>Save</button>
    </div>
    <output id="status" role="status"></output>
  </form>
</main>
<script>${PLUGIN_UI.js}</script>
<script>
pu.init();
const params = new URLSearchParams(location.search);
const deviceId = params.get("deviceId") || "";
const deviceLabel = document.getElementById("deviceLabel");
const welcome = document.getElementById("welcome");
const form = document.getElementById("settings");
const usbPower = document.getElementById("usbPower");
const squareButtonShot = document.getElementById("squareButtonShot");
const save = document.getElementById("save");
const status = document.getElementById("status");
const inputs = [save, usbPower, squareButtonShot];
const pluginId = "skale.reaplugin";
let loaded = false;
deviceLabel.textContent = params.get("deviceName") || deviceId || "Unavailable";
async function load() {
  for (const input of inputs) input.disabled = true;
  if (!deviceId) {
    status.textContent = "Device unavailable";
    return;
  }
  status.textContent = "Loading...";
  try {
    const response = await fetch("device-settings?deviceId=" + encodeURIComponent(deviceId));
    if (!response.ok) throw new Error("Settings could not be loaded");
    const value = await response.json();
    usbPower.checked = value.usbPower === true;
    squareButtonShot.checked = value.squareButtonShot === true;
    welcome.hidden = value.firstConnect !== true;
    loaded = true;
    for (const input of inputs) input.disabled = false;
    status.textContent = value.machineControlMessage || "";
  } catch (error) {
    status.textContent = error.message;
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!loaded) return;
  status.textContent = "";
  for (const input of inputs) input.disabled = true;
  try {
    const response = await fetch("device-settings?deviceId=" + encodeURIComponent(deviceId), {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({usbPower: usbPower.checked, squareButtonShot: squareButtonShot.checked}),
    });
    if (!response.ok) throw new Error("Settings could not be saved");
    welcome.hidden = true;
    status.textContent = "Saved";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    for (const input of inputs) input.disabled = !loaded;
  }
});

const machineControl = document.getElementById("machineControl");
const machineControlText = document.getElementById("machineControlText");
const grantStart = document.getElementById("grantStart");
const grantConfirm = document.getElementById("grantConfirm");
function showMachineControl(granted) {
  machineControl.hidden = false;
  machineControl.className = "pu-alert " + (granted ? "pu-ok" : "pu-warn");
  machineControlText.textContent = granted
    ? "Decaid allows the Skale plugin to control the machine."
    : "To start shots from the scale, Decaid must allow this plugin to control the machine.";
  grantStart.hidden = granted;
  grantConfirm.hidden = true;
}
async function loadMachineControl() {
  try {
    const plugin = (await pu.api("/api/v1/plugins")).find(entry => entry.id === pluginId);
    if (plugin && typeof plugin.machineControl === "boolean") showMachineControl(plugin.machineControl);
  } catch (_) {}
}
document.getElementById("grant").addEventListener("click", () => {
  grantStart.hidden = true;
  grantConfirm.hidden = false;
});
document.getElementById("grantCancel").addEventListener("click", () => showMachineControl(false));
document.getElementById("grantConfirmButton").addEventListener("click", async event => {
  event.target.disabled = true;
  try {
    const result = await pu.api("/api/v1/plugins/" + pluginId + "/machine-control", {
      method: "PUT", body: {granted: true},
    });
    showMachineControl(result && result.machineControl === true);
  } catch (error) {
    showMachineControl(false);
    machineControlText.textContent = error.status === 401 || error.status === 403
      ? "Decaid's extension protection is on. ${machineControlHint}."
      : "Machine control could not be allowed: " + error.message;
  } finally {
    event.target.disabled = false;
  }
});
load();
loadMachineControl();
</script>
</body>
</html>`;

  function requestDeviceId(request) {
    const deviceId = request.query && request.query.deviceId;
    return typeof deviceId === "string" && deviceId.length > 0 && deviceId.length <= 256
      ? deviceId
      : null;
  }

  function queueSettings(deviceId, operation) {
    const previous = settingsOperations.get(deviceId) || Promise.resolve();
    const next = previous.catch(() => {}).then(operation);
    settingsOperations.set(deviceId, next);
    return next.finally(() => {
      if (settingsOperations.get(deviceId) === next) {
        settingsOperations.delete(deviceId);
      }
    });
  }

  function storageError(message) {
    return new Error("Skale storage unavailable: " + message);
  }

  function failCachedSettings() {
    for (const deviceId of deviceSettings.keys()) {
      failedStorageReads.add(settingKey(deviceId));
    }
    deviceSettings.clear();
  }

  async function loadSettings(deviceId) {
    return queueSettings(deviceId, async () => {
      if (unloaded) return {value: null, known: false};
      const key = settingKey(deviceId);
      if (failedStorageReads.has(key)) {
        return {value: null, known: false};
      }
      if (deviceSettings.has(deviceId)) {
        return {value: deviceSettings.get(deviceId), known: true};
      }
      try {
        const stored = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            pendingStorageReads.delete(key);
            failedStorageReads.add(key);
            reject(storageError("read acknowledgement timed out"));
          }, storageAckTimeout);
          pendingStorageReads.set(key, {resolve, reject, timer});
          try { host.storage({type: "read", key}); } catch (error) {
            clearTimeout(timer);
            pendingStorageReads.delete(key);
            failedStorageReads.add(key);
            reject(error);
          }
        });
        if (stored == null) {
          const value = {usbPower: false, squareButtonShot: false};
          deviceSettings.set(deviceId, value);
          unconfiguredDevices.add(deviceId);
          return {value, known: true};
        }
        const squareButtonShot = stored.squareButtonShot === undefined
          ? false
          : stored.squareButtonShot;
        if (typeof stored.usbPower !== "boolean" || typeof squareButtonShot !== "boolean") {
          return {value: null, known: false};
        }
        const value = {
          usbPower: stored.usbPower,
          squareButtonShot,
        };
        deviceSettings.set(deviceId, value);
        return {value, known: true};
      } catch (_) {
        return {value: null, known: false};
      }
    });
  }

  async function saveSettings(deviceId, value) {
    return queueSettings(deviceId, async () => {
      if (unloaded) throw storageError("plugin unloaded; create a new instance to retry");
      if (storageWriteFailure) throw storageWriteFailure;
      const write = storageWriteQueue.catch(() => {}).then(() => {
        if (storageWriteFailure) throw storageWriteFailure;
        return new Promise((resolve, reject) => {
        const key = settingKey(deviceId);
        const pending = {deviceId, resolve, reject, timer: null};
        pending.timer = setTimeout(() => {
          const index = pendingStorageWrites.indexOf(pending);
          if (index >= 0) pendingStorageWrites.splice(index, 1);
          const error = storageError("write acknowledgement timed out");
          storageWriteFailure = error;
          failCachedSettings();
          failedStorageReads.add(settingKey(deviceId));
          while (pendingStorageWrites.length > 0) {
            const abandoned = pendingStorageWrites.shift();
            failedStorageReads.add(settingKey(abandoned.deviceId));
            clearTimeout(abandoned.timer);
            abandoned.reject(error);
          }
          reject(error);
        }, storageAckTimeout);
        pendingStorageWrites.push(pending);
        try { host.storage({type: "write", key, data: value}); } catch (error) {
          clearTimeout(pending.timer);
          const index = pendingStorageWrites.indexOf(pending);
          if (index >= 0) pendingStorageWrites.splice(index, 1);
          storageWriteFailure = error;
          failCachedSettings();
          failedStorageReads.add(key);
          reject(error);
        }
        });
      });
      storageWriteQueue = write.catch(() => {});
      await write;
      deviceSettings.set(deviceId, value);
      unconfiguredDevices.delete(deviceId);
    });
  }

  function decodeBase64(data) {
    if (typeof data !== "string" || data.length % 4 !== 0) return null;
    const bytes = [];
    for (let i = 0; i < data.length; i += 4) {
      const a = alphabet.indexOf(data[i]);
      const b = alphabet.indexOf(data[i + 1]);
      const c = data[i + 2] === "=" ? 0 : alphabet.indexOf(data[i + 2]);
      const d = data[i + 3] === "=" ? 0 : alphabet.indexOf(data[i + 3]);
      if (a < 0 || b < 0 || c < 0 || d < 0) return null;
      bytes.push((a << 2) | (b >> 4));
      if (data[i + 2] !== "=") bytes.push(((b & 15) << 4) | (c >> 2));
      if (data[i + 3] !== "=") bytes.push(((c & 3) << 6) | d);
    }
    return bytes;
  }

  function encode(bytes) {
    return btoa(String.fromCharCode(...bytes));
  }

  function decodeWeight(data) {
    const bytes = decodeBase64(data);
    if (!bytes) return null;
    if (bytes.length === 4) {
      const raw = (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24));
      return raw / 2560;
    }
    if (bytes.length !== 5 && bytes.length !== 9) return null;
    let mantissa = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16);
    if ((mantissa & 0x800000) !== 0) mantissa -= 0x1000000;
    const exponent = bytes[4] >= 0x80 ? bytes[4] - 0x100 : bytes[4];
    const weight = mantissa * Math.pow(10, exponent);
    return Number.isFinite(weight) ? weight : null;
  }

  function decodeBattery(data) {
    const bytes = decodeBase64(data);
    return bytes && bytes.length === 1 && bytes[0] <= 100 ? bytes[0] : null;
  }

  function decodeFirmware(data) {
    const bytes = decodeBase64(data);
    if (!bytes || bytes.length === 0) return null;
    let encoded = "";
    for (const byte of bytes) encoded += "%" + byte.toString(16).padStart(2, "0");
    let value;
    try {
      value = decodeURIComponent(encoded).replace(/\0+$/, "").trim();
    } catch (_) {
      return null;
    }
    if (value.length === 0) return null;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      if (code < 0x20 || code === 0x7f) return null;
    }
    return value;
  }

  async function getJson(path) {
    const response = await fetch(hostApi + path);
    return response.ok ? response.json() : null;
  }

  async function requestMachineState(next) {
    const response = await fetch(hostApi + "/machine/state/" + next, {method: "PUT"});
    if (response.ok) {
      machineControlMessage = null;
    } else if (response.status === 403) {
      const body = await response.json().catch(() => null);
      if (body && body.code === "machine_control_not_granted") {
        machineControlMessage = machineControlHint;
      }
    }
  }

  async function squarePressed(deviceId, isCurrent) {
    const now = Date.now();
    const settings = deviceSettings.get(deviceId);
    if (!settings || settings.squareButtonShot !== true) return;
    if (squareInFlight || now - lastSquarePress < squareDebounce) return;
    lastSquarePress = now;
    squareInFlight = true;
    try {
      const devices = await getJson("/devices");
      const primary = Array.isArray(devices) && devices.some(entry =>
        entry && entry.id === deviceId && entry.connectionRole === "primary");
      if (!primary || !isCurrent()) return;
      const snapshot = await getJson("/machine/state");
      const machineState = snapshot && snapshot.state && snapshot.state.state;
      if (!isCurrent()) return;
      if (machineState === "espresso") {
        await requestMachineState("idle");
      } else if (machineState === "idle") {
        const info = await getJson("/machine/info");
        if (info && info.GHC === false && isCurrent()) await requestMachineState("espresso");
      }
    } catch (_) {
      // Machine reads are best effort; a failed press does nothing.
    } finally {
      squareInFlight = false;
    }
  }

  function delay() {
    return new Promise(resolve => setTimeout(resolve, initStepDelay));
  }

  return {
    id: "skale.reaplugin",
    onEvent(event) {
      if (unloaded) return;
      if (event.name === "storageRead") {
        const pending = pendingStorageReads.get(event.payload.key);
        if (pending) {
          pendingStorageReads.delete(event.payload.key);
          clearTimeout(pending.timer);
          pending.resolve(event.payload.value);
        }
      } else if (event.name === "storageWrite") {
        if (storageWriteFailure) return;
        const pending = pendingStorageWrites.shift();
        if (pending) {
          clearTimeout(pending.timer);
          pending.resolve();
        }
      }
    },
    onLoad() {
      unloaded = false;
      return host.devices.bindDriver("skale", {
        create(device) {
          const deviceId = device && typeof device.id === "string" ? device.id : "";
          let active = null;

          async function applySettings(nextSettings) {
            const state = active;
            if (!isActive(state)) return;
            const enabled = nextSettings.usbPower === true;
            const pendingBatteryRead = state.batteryReadPromise;
            if (state.usbPowerKnown && state.usbPower === enabled) return;
            state.settingsEpoch++;
            state.usbPowerKnown = true;
            state.usbPower = enabled;
            clearTimeout(state.batteryTimer);
            state.batteryTimer = null;
            state.battery = null;
            state.session.publishInfo({batteryLevel: null}).catch(() => {});
            if (pendingBatteryRead) await pendingBatteryRead.catch(() => {});
            if (!enabled && state.services.includes(batteryService)) {
              while (state.batteryReadInFlight) {
                await state.batteryReadPromise;
              }
              await readBattery(state);
              if (isActive(state)) scheduleBatteryRefresh(state);
            }
          }

          function isActive(state) {
            return state != null && active === state && !state.stopped;
          }

          function stop(state) {
            if (!state || state.stopped) return;
            state.stopped = true;
            state.settingsEpoch++;
            clearTimeout(state.batteryTimer);
            if (instanceControls.get(deviceId) === applySettings) {
              instanceControls.delete(deviceId);
            }
            if (!state.settled) {
              state.settled = true;
              state.reject(new Error("Skale session stopped"));
            }
          }

          function fail(state, error) {
            if (!state.settled) {
              state.settled = true;
              state.reject(error);
            }
          }

          async function readBattery(state) {
            if (!isActive(state) || !state.usbPowerKnown || state.usbPower) return;
            if (state.batteryReadInFlight) return state.batteryReadPromise;
            state.batteryReadInFlight = true;
            const readEpoch = state.settingsEpoch;
            state.batteryReadPromise = (async () => {
              let value = null;
              try {
                value = decodeBattery(await state.session.gatt.read(
                  batteryService,
                  batteryCharacteristic,
                ));
              } catch (_) {
                value = null;
              }
              if (!isActive(state) || readEpoch !== state.settingsEpoch || state.usbPower) return;
              state.battery = value;
              state.session.publishInfo({batteryLevel: value}).catch(() => {});
            })();
            try {
              await state.batteryReadPromise;
            } finally {
              state.batteryReadInFlight = false;
              state.batteryReadPromise = null;
            }
          }

          async function publishInfo(state, services) {
            if (!isActive(state) || !services.includes(deviceInformationService)) return;
            const firmwareRead = state.session.gatt.read(
              deviceInformationService,
              firmwareCharacteristic,
            ).then(decodeFirmware).catch(() => null);
            const batteryRead = services.includes(batteryService)
              ? readBattery(state)
              : Promise.resolve();
            const firmwareVersion = await firmwareRead;
            await batteryRead;
            state.firmwareVersion = firmwareVersion;
            if (isActive(state)) {
              await state.session.publishInfo({
                firmwareVersion,
                batteryLevel: state.battery,
              });
            }
          }

          function scheduleBatteryRefresh(state) {
            clearTimeout(state.batteryTimer);
            if (!state.usbPowerKnown || state.usbPower) return;
            state.batteryTimer = setTimeout(async () => {
              if (!isActive(state) || !state.usbPowerKnown || state.usbPower) return;
              await readBattery(state);
              if (isActive(state)) scheduleBatteryRefresh(state);
            }, batteryRefreshInterval);
          }

          function command(bytes) {
            const state = active;
            if (!isActive(state)) {
              return Promise.reject(new Error("Skale session is not connected"));
            }
            return state.session.gatt.writeWithoutResponse(
              service,
              commandCharacteristic,
              encode(bytes),
            );
          }

          return {
            async connect(session) {
              const state = {
                session,
                deviceId,
                services: [],
                stopped: false,
                settled: false,
                batteryTimer: null,
                batteryReadInFlight: false,
                batteryReadPromise: null,
                battery: null,
                firmwareVersion: null,
                usbPower: false,
                usbPowerKnown: false,
                settingsEpoch: 0,
                readyForWeight: false,
                resolve: null,
                reject: null,
              };
              active = state;
              instanceControls.set(deviceId, applySettings);
              const firstWeight = new Promise((resolve, reject) => {
                state.resolve = resolve;
                state.reject = reject;
              });
              firstWeight.catch(() => {});
              try {
                const services = await session.gatt.discoverServices();
                state.services = services;
                if (!services.includes(service)) {
                  throw new Error("Skale service unavailable");
                }
                const usbSetting = await loadSettings(deviceId);
                if (!usbSetting.known) {
                  throw new Error("Skale settings unavailable");
                }
                state.usbPower = usbSetting.value.usbPower;
                state.usbPowerKnown = true;
                session.gatt.onDisconnect(() => {
                  if (!isActive(state)) return;
                  stop(state);
                  fail(state, new Error("Skale disconnected before readiness"));
                });
                await session.gatt.writeWithoutResponse(service, commandCharacteristic, encode([0xed]));
                await session.gatt.writeWithoutResponse(service, commandCharacteristic, encode([0xec]));
                await delay();
                await session.gatt.subscribe(service, weightCharacteristic, async (data, sample) => {
                  if (!isActive(state)) return;
                  if (!state.readyForWeight) return;
                  const weight = decodeWeight(data);
                  if (weight === null) return;
                  try {
                    await session.publish({weight, battery: state.battery}, sample);
                    if (!state.settled && isActive(state)) {
                      state.settled = true;
                      state.resolve();
                    }
                  } catch (_) {
                    if (isActive(state)) fail(state, new Error("Skale weight publication failed"));
                  }
                });
                try {
                  await session.gatt.subscribe(service, buttonCharacteristic, async data => {
                    const button = decodeBase64(data);
                    if (!isActive(state) || !button || button.length !== 1) return;
                    if (button[0] === 0x02) {
                      squarePressed(deviceId, () => isActive(state) && !unloaded);
                      return;
                    }
                    if (button[0] !== 0x01) return;
                    try {
                      await command([0x10]);
                    } catch (error) {
                      if (isActive(state)) fail(state, error);
                      throw error;
                    }
                  });
                } catch (_) {
                  // Older firmware may omit the button characteristic; weight remains usable.
                }
                await delay();
                if (!isActive(state)) throw new Error("Skale session retired");
                await session.gatt.writeWithoutResponse(service, commandCharacteristic, encode([0xed]));
                await session.gatt.writeWithoutResponse(service, commandCharacteristic, encode([0xec]));
                await session.gatt.writeWithoutResponse(service, commandCharacteristic, encode([0x03]));
                state.readyForWeight = true;
                if (services.includes(deviceInformationService)) {
                  publishInfo(state, services).catch(() => {});
                } else if (services.includes(batteryService) && state.usbPowerKnown &&
                           !state.usbPower) {
                  readBattery(state).catch(() => {});
                }
                if (services.includes(batteryService) && state.usbPowerKnown &&
                    !state.usbPower) {
                  scheduleBatteryRefresh(state);
                }
                await firstWeight;
              } catch (error) {
                stop(state);
                fail(state, error);
                throw error;
              }
            },
            async disconnect(context) {
              const state = active;
              stop(state);
              if (context && context.gatt) {
                try {
                  await context.gatt.writeWithoutResponse(service, commandCharacteristic, encode([0xee]));
                } catch (_) {}
              }
            },
            tare() { return command([0x10]); },
            startTimer() { return command([0xdd]); },
            stopTimer() { return command([0xd1]); },
            resetTimer() { return command([0xd0]); },
            sleepDisplay() { return command([0xee]); },
            async wakeDisplay() {
              await command([0xed]);
              await command([0xec]);
            },
          };
        }
      });
    },
    handleHttpRequest(request) {
      if (request.method === "GET" && request.query && request.query.ui === "1") {
        return htmlResponse(200, settingsPage);
      }
      const deviceId = requestDeviceId(request);
      if (!deviceId) return jsonResponse(400, {error: "deviceId is required"});
      if (request.method === "GET") {
        return loadSettings(deviceId).then(setting => setting.known
          ? jsonResponse(200, {
            deviceId,
            ...setting.value,
            ...(unconfiguredDevices.has(deviceId) ? {firstConnect: true} : {}),
            ...(machineControlMessage ? {machineControlMessage} : {}),
          })
          : jsonResponse(503, {error: "settings unavailable"}));
      }
      const body = request.body;
      if (request.method !== "POST" || !body ||
          typeof body.usbPower !== "boolean" ||
          !["boolean", "undefined"].includes(typeof body.squareButtonShot) ||
          Object.keys(body).some(key => key !== "usbPower" && key !== "squareButtonShot")) {
        return jsonResponse(400, {
          error: "usbPower must be a boolean; squareButtonShot is an optional boolean",
        });
      }
      const squareButtonShot = typeof body.squareButtonShot === "boolean"
        ? Promise.resolve(body.squareButtonShot)
        : loadSettings(deviceId).then(setting => setting.known && setting.value.squareButtonShot);
      let settings;
      return squareButtonShot.then(square => {
        settings = {usbPower: body.usbPower, squareButtonShot: square};
        return saveSettings(deviceId, settings);
      }).then(async () => {
        const update = instanceControls.get(deviceId);
        if (update) await update(settings);
        return jsonResponse(200, {
          deviceId,
          ...settings,
        });
      }).catch(() => jsonResponse(502, {error: "settings persistence failed"}));
    },
    onUnload() {
      unloaded = true;
      machineControlMessage = null;
      instanceControls.clear();
      deviceSettings.clear();
      unconfiguredDevices.clear();
      settingsOperations.clear();
      for (const pending of pendingStorageReads.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error("Skale plugin unloaded"));
      }
      for (const pending of pendingStorageWrites) {
        clearTimeout(pending.timer);
        pending.reject(new Error("Skale plugin unloaded"));
      }
      pendingStorageReads.clear();
      pendingStorageWrites.length = 0;
      failedStorageReads.clear();
      storageWriteFailure = storageError("plugin unloaded; create a new instance to retry");
      storageWriteQueue = Promise.resolve();
    },
  };
}

// Keep the host entry point and a Node-testable export in the same artifact.
if (typeof module !== "undefined") module.exports = {createPlugin};
