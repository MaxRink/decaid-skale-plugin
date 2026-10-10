# Decaid Skale plugin

This repository packages the opt-in Skale BLE scale driver for Decaid's
runtime-v2 plugin API. The host bundle contains `manifest.json` and
root-level `plugin.js`. Use the ZIP produced by `npm run package` for
installation.

## Installation

This plugin requires a Decaid build containing the runtime-v2 plugin contract:
BLE `bindDriver`, four-binding admission, session `publishInfo`, validated
driver `surfaces`, and `pluginStorage`. The contract was present on Decaid
main at `af4e99524ad7731dbdb7db4540cd272bc91da038` (2026-10-10). The stable
`0.8.8` release predates the final settings-surface and Scale metadata pieces;
use a newer host build and check its plugin documentation before installing.

Decaid can install this repository directly from its GitHub branch installer:

```text
Repository: MaxRink/decaid-skale-plugin
Branch:     main
```

That installer downloads the branch archive, finds the single directory that
contains `manifest.json` and `plugin.js`, validates the manifest, and records
the resolved commit as the plugin source. A local install can use
`dist/decaid-skale-plugin-0.2.0.zip` through the local ZIP installer. The ZIP
has those two required files at its root. There is currently no GitHub release
asset; the release installer should only be used after a semver-matching ZIP
release is published.

The plugin id is `skale.reaplugin`. After installation, enable it in Decaid's
plugin management UI and grant the requested BLE, API, and plugin-storage
permissions. The settings action is provided by the declared `settings`
surface; its `deviceId` and optional display name are supplied by Decaid's
device-management authority.

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
