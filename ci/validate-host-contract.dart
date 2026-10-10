import 'dart:io';

import 'package:reaprime/src/plugins/plugin_package.dart';

/// Runs from a pinned Decaid checkout so the real host parser validates this
/// repository's manifest and package root.
void main(List<String> args) {
  if (args.length != 1) {
    stderr.writeln('usage: validate-host-contract.dart PLUGIN_ROOT');
    exitCode = 64;
    return;
  }

  final package = resolvePluginPackage(Directory(args.single));
  final permissions = (package.manifestJson['permissions'] as List).cast<String>();
  final drivers = (package.manifestJson['drivers'] as List).cast<Map>();
  final driver = drivers.single;
  final surfaces = (driver['surfaces'] as List).cast<Map>();
  final capabilities = (driver['capabilities'] as List).cast<String>();
  if (package.manifest.id != 'skale.reaplugin' ||
      !permissions.contains('transport.ble') ||
      !permissions.contains('api') ||
      !permissions.contains('pluginStorage') ||
      driver['type'] != 'scale' ||
      !capabilities.contains('battery') ||
      !capabilities.contains('tare') ||
      surfaces.length != 1 ||
      surfaces.single['role'] != 'settings' ||
      surfaces.single['endpoint'] != 'device-settings') {
    throw StateError('Skale manifest is incompatible with the pinned Decaid host');
  }
  stdout.writeln('validated ${package.manifest.id} ${package.manifest.version}');
}
