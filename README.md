# Decaid Skale plugin

This repository packages the opt-in Skale BLE scale driver for Decaid's
runtime-v2 plugin API. The host bundle contains `manifest.json` and
root-level `plugin.js`. Use the ZIP produced by `npm run package` for
installation.

## Installation

This plugin requires a Decaid build containing the runtime-v2 plugin contract:
BLE `bindDriver`, four-binding admission, session `publishInfo`, validated
driver `surfaces`, and `pluginStorage`. The contract was present on Decaid
main at `bafa9b3f2b90e65334e990b0b9601a9965cf979b` (2026-10-13). The stable
`0.8.8` release predates the final settings-surface and Scale metadata pieces;
use a newer host build and check its plugin documentation before installing.

Decaid can install this repository directly from its GitHub branch installer:

```text
Repository: MaxRink/decaid-skale-plugin
Branch:     main
```

That installer downloads the branch archive, finds the single directory that
contains `manifest.json` and `plugin.js`, validates the manifest, and records
the resolved commit as the plugin source. For stable installs, select the latest
[GitHub release](https://github.com/MaxRink/decaid-skale-plugin/releases), whose
single ZIP matches the manifest version. A local build can use
`dist/decaid-skale-plugin-<version>.zip` through the local ZIP installer. The ZIP
has the required runtime files and licence notices at its root.

The plugin id is `skale.reaplugin`. After installation, enable it in Decaid's
plugin management UI and grant the requested BLE, API, and plugin-storage
permissions. The settings action is provided by the declared `settings`
surface; its `deviceId` and optional display name are supplied by Decaid's
device-management authority.

The plugin supports the current host contract:

- host-owned BLE with up to four independently fenced bindings, claimed by a
  case-insensitive advertised-name `prefix: "Skale"` matcher;
- one primary brewing scale and runtime-only auxiliary scales, with no driver
  role assignment or persisted dosing role;
- 4-byte fixed point and 5/9-byte signed mantissa/exponent weight frames;
- nullable firmware and battery publication through `context.publishInfo`;
- tare, timer and display commands;
- a validated `role: "settings"` surface backed by the namespaced
  `pluginStorage` KV store.

The BLE matcher is name-only. Skale and DE1 advertisements often omit a complete
service list, and Decaid combines name and service predicates with AND, so a
`serviceUuids` predicate left every unproven device, the DE1 included,
indeterminate. That kept ownership pending at the scan deadline, so the native
Skale2 driver kept the scale and native DE1 reconnects could be blocked. A
present advertised name now decides ownership: `Skale`/`Skale2` match, any other
name (for example `DE1`) is a definite non-match and stays native. A device that
advertises no name stays indeterminate until a name is observed. A device whose
name starts with `Skale` but lacks the Skale service fails `connect` with
"Skale service unavailable".

USB power is a manual, default-off declaration. It suppresses battery reads and
publishes `batteryLevel: null`; it is not sensed power. The Skale circle button
notification (`ef82`, payload `0x01`) performs a local scale tare and is fenced to
that BLE session. Unknown or malformed button payloads are ignored. Button command
write failures propagate through the host BLE session; missing button subscription
is tolerated so weight remains usable.

### Square button shot start/stop

The per-device setting **Square button starts/stops a shot** is off by default.
When it is on, a square press (`0x02`) follows the
`BLE notification -> Skale plugin -> Decaid HTTP API -> machine action` path of
decentespresso/decaid#715, with no Skale-specific code in Decaid:

1. `GET /api/v1/devices` must list this binding with `connectionRole: "primary"`.
   Auxiliary bindings never act.
2. `GET /api/v1/machine/state` is read at press time. `espresso` sends
   `PUT /api/v1/machine/state/idle` (stop).
3. `idle` sends `PUT /api/v1/machine/state/espresso` only when
   `GET /api/v1/machine/info` reports `GHC: false`. GHC `true` or unknown does
   nothing, because a group head controller starts shots on the machine itself.
4. Every other state, including `sleeping`, does nothing. The plugin never wakes
   the machine.

Presses within one second of the last accepted press, or while a previous press
is still talking to Decaid, are ignored. A press from a retired session, or a
session retired while its requests are in flight, does nothing.

Decaid builds with plugin machine-control hardening answer the `PUT` with `403`
and `code: "machine_control_not_granted"` until the user allows it. The plugin
does not retry; the settings page shows "Allow machine control for the Skale
plugin in Decaid Settings > Plugins" until a later press succeeds. Stock Decaid
accepts the `PUT` without a grant.
No new manifest permission is required: the plugin uses its existing `api`
permission.

The setting is stored with the USB power setting in the plugin's namespaced
`pluginStorage` and survives plugin reload. Decaid's `/api/v1/data/export`
currently omits plugin storage namespaces (its `store.json` section lists only
the REST key-value store), so this setting, like USB power, is not carried by a
Decaid backup. Re-enable it after restoring onto a new device.

## Settings page

The `device-settings` surface uses the shared
[`plugin-ui` kit](https://github.com/MaxRink/streamline-js/tree/f814285874bc2c7a6e8790fae5ce3762dffbf8bb/docs/plugin-ui),
vendored into `plugin.js` between the `plugin-ui:begin`/`plugin-ui:end` markers.
It follows the host's `theme=light|dark` (otherwise the system preference) and,
with `embed=1`, hides its Done button and keeps its background transparent so it
works inside a Streamline dialog or Decaid's surface sheet.

- **First connect.** Until settings are saved for a device, the page opens with a
  "Set up your Skale" header that says what the plugin does.
- **USB powered** and **Square button starts and stops a shot** are switches with
  a plain-language description each. Both are off by default.
- **Machine control.** When `GET /api/v1/plugins` reports a boolean
  `machineControl` for `skale.reaplugin` (Decaid builds with the machine-control
  grant), the page shows whether it is allowed. If it is not, **Allow in Decaid**
  asks for confirmation on the page, and only the confirm button sends
  `PUT /api/v1/plugins/skale.reaplugin/machine-control` with `{"granted": true}`.
  This is an extension-management route: with Decaid's extension protection on,
  the page says to allow it in Decaid Settings > Plugins instead. Stock hosts
  report no `machineControl`, and the row stays hidden.

Change the kit in streamline-js, never in `plugin.js`, then re-vendor it:

```sh
node <streamline-js>/docs/plugin-ui/vendor.mjs inject plugin.js \
  https://raw.githubusercontent.com/MaxRink/streamline-js/<commit>/docs/plugin-ui
```

CI checks the vendored copy against the pinned kit with `vendor.mjs check`.

## Development

```sh
npm test
npm run package
```

Browser contract checks use a fake GATT session and Playwright Chromium; they do
not require a physical scale:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:browser
```

The browser suite covers the settings page, persisted USB-power and square-button
reload, the first-connect header, the machine-control hint, the grant row (hidden
on stock hosts, confirm-before-grant, protection refusal), light and dark themes
at 412px and 1280px (touch-target sizes, no horizontal overflow), the framed
`embed=1` dialog, malformed settings rejection, weight publication, tare, and
circle-button tare.
CI runs it on Node 24 alongside the native Node matrix.

GitHub Actions runs the protocol/session suite and package-root checks on Node
22 and 24 LTS plus Node 26 Current. A focused host-contract job runs Decaid's
real package resolver and manifest parser against both a GitHub-style source
archive and the generated local ZIP, then runs `ci/host_runtime_test.dart` inside
the pinned host QuickJS runtime with fake GATT transports. It covers multi-binding
isolation, settings/pluginStorage persistence, nullable metadata, commands, circle
tare, ignored unknown buttons, the square-button host API path (default off,
auxiliary ignored, `machine_control_not_granted` hint), write failures, and
late-event fencing. The square-button case binds a fake host API on
`localhost:8080` for the duration of the test.
The host is pinned to revision `bafa9b3f2b90e65334e990b0b9601a9965cf979b`.

The package is a ZIP containing only the manifest, plugin source, README and
GPL-3.0 license. The generated ZIP is not a release or a hardware-validation
claim.

## Provenance and license

The protocol implementation and focused fixture behavior were ported from the
closed Decaid PRs #846 (`feature/skale-plugin-review`) and #859
(`feature/skale-multiple-scales`), authored by Maximilian Rink. The source was
reworked to use the accepted current `surfaces` contract and retains the
original copyright and contribution history in `NOTICE`. The Decaid host is
GPL-3.0-or-later; this plugin is distributed under the same license.

The source references were inspected at Decaid main `bafa9b3f2b90e65334e990b0b9601a9965cf979b`
and the closed PR #859 head `4816cf02a42b6c9b0f2aea897054044afb8d360e` on 2026-10-10;
the current main pin above is the contract used by CI.

## Limitations

No physical hardware run is included. Host platform trust and plugin transport
permissions still apply. Self-signed TLS is unrelated to this BLE plugin and
must be solved in the host/E64 plugin separately.

## Releases

Install the latest [GitHub release](https://github.com/MaxRink/decaid-skale-plugin/releases)
through Decaid’s plugin installer. Each release has exactly one flat ZIP with the
manifest, runtime plugin and licence notices. The tag must match the manifest
version. Subsequent releases require a version bump in the manifest, package and
lockfile.

The tag-triggered release workflow reruns the complete repository CI and publishes
the tested archive only after all jobs pass. `npm run package` produces a
deterministic archive under `dist/`; documentation, mocks and CI fixtures remain
in the repository. CI proves synthetic software behavior, not physical hardware
or firmware compatibility.
