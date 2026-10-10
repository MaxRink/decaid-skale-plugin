# Decaid Skale plugin

This repository packages the opt-in Skale BLE scale driver for Decaid's
runtime-v2 plugin API. The host bundle contains `manifest.json` and
root-level `plugin.js`. Use the ZIP produced by `npm run package` for
installation.

The plugin supports the current host contract:

- host-owned BLE with up to four independently fenced bindings;
- one primary brewing scale and runtime-only auxiliary scales, with no driver
  role assignment or persisted dosing role;
- 4-byte fixed point and 5/9-byte signed mantissa/exponent weight frames;
- nullable firmware and battery publication through `context.publishInfo`;
- tare, timer and display commands;
- a validated `role: "settings"` surface backed by the namespaced
  `pluginStorage` KV store.

USB power is a manual, default-off declaration. It suppresses battery reads and
publishes `batteryLevel: null`; it is not sensed power. Physical brew-button
actions are intentionally absent and remain subject to the held host action
review (#845/#853).

## Development

```sh
npm test
npm run package
```

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

The source references were inspected at Decaid main `af4e99524ad7731dbdb7db4540cd272bc91da038`
and PR #859 head `4816cf02a42b6c9b0f2aea897054044afb8d360e` on 2026-10-10.

## Limitations

No physical hardware run is included. Host platform trust and plugin transport
permissions still apply. Self-signed TLS is unrelated to this BLE plugin and
must be solved in the host/E64 plugin separately.
