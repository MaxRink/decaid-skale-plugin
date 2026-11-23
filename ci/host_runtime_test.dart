import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:reaprime/src/models/device/scale.dart';
import 'package:reaprime/src/plugins/plugin_manager.dart';
import 'package:reaprime/src/plugins/plugin_manifest.dart';
import 'package:reaprime/src/plugins/plugin_scale.dart';
import 'package:reaprime/src/plugins/plugin_ble_matcher.dart';
import 'package:reaprime/src/plugins/plugin_ble_registry.dart';
import 'package:reaprime/src/plugins/plugin_ble_session.dart';

import '../helpers/plugin_ble_fixture.dart';
import 'plugin_test_helpers.dart';

const _service = '0000ff08-0000-1000-8000-00805f9b34fb';
const _batteryService = '0000180f-0000-1000-8000-00805f9b34fb';
const _infoService = '0000180a-0000-1000-8000-00805f9b34fb';
const _weight = '0000ef81-0000-1000-8000-00805f9b34fb';
const _button = '0000ef82-0000-1000-8000-00805f9b34fb';
const _battery = '00002a19-0000-1000-8000-00805f9b34fb';
const _firmware = '00002a26-0000-1000-8000-00805f9b34fb';

class _SkaleTransport extends PluginBleFixtureTransport {
  _SkaleTransport(super.physicalId)
    : super(services: const [_service, _batteryService, _infoService]);

  bool failNextWrite = false;

  void emitButton(int value) => subscribers[_button]?.call(Uint8List.fromList([value]));

  void emitWeight() => subscribers[_weight]?.call(
    Uint8List.fromList(const [0, 10, 0, 0]),
  );

  @override
  Future<void> write(
    String service,
    String characteristic,
    Uint8List data, {
    bool withResponse = true,
    Duration? timeout,
  }) async {
    if (failNextWrite) {
      failNextWrite = false;
      throw StateError('simulated Skale write failure');
    }
    await super.write(
      service,
      characteristic,
      data,
      withResponse: withResponse,
      timeout: timeout,
    );
  }

  @override
  Future<void> subscribe(
    String service,
    String characteristic,
    void Function(Uint8List) callback,
  ) async {
    subscribers[characteristic] = callback;
    operations.add('subscribe:$service:$characteristic');
  }
}

class _DelayedStore extends FakeKeyValueStoreService {
  final delays = <String, Duration>{};

  @override
  Future<void> set({
    String namespace = 'default',
    required String key,
    required Object value,
  }) async {
    final delay = delays[key];
    if (delay != null) await Future<void>.delayed(delay);
    await super.set(namespace: namespace, key: key, value: value);
  }
}

Future<Map<String, dynamic>> _request(
  PluginManager manager,
  String pluginId,
  String requestId,
  Map<String, dynamic> payload,
) async {
  final response = manager.registerPendingHttp(pluginId, requestId);
  manager.dispatchEvent(pluginId, 'httpRequest', {
    'requestId': requestId,
    ...payload,
  });
  return response;
}

void main() {
  test('published Skale package connects through the real host BLE bridge', () async {
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(
      kvStore: FakeKeyValueStoreService(),
      bleRegistry: PluginBleRegistry(activeBindingLimit: 4),
    );
    addTearDown(manager.dispose);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );

    final transports = <_SkaleTransport>[];
    final evidence = BleAdvertisementEvidence(name: 'Skale2', serviceUuids: const [_service]);
    Future<Scale> candidate(String id) async => await manager.bleService
          .createCandidate(
            driver: manager.bleService.registry.decide(evidence).drivers.single,
            physicalId: id,
            evidence: evidence,
            admit: () => true,
            createTransport: () {
              final transport = _SkaleTransport(id);
              transport.queueRead(_battery, Uint8List.fromList(const [87]));
              transport.queueRead(_firmware, Uint8List.fromList(utf8.encode('R-$id')));
              transports.add(transport);
              return transport;
            },
          ) as Scale;

    final first = await candidate('AA:01');
    final second = await candidate('BB:02');
    final firstConnect = first.onConnect();
    final secondConnect = second.onConnect();
    (first as ScaleSnapshotHandoff).activateSnapshots();
    (second as ScaleSnapshotHandoff).activateSnapshots();
    final firstTransport = transports[0];
    final secondTransport = transports[1];
    final firstSnapshot = first.currentSnapshot.first;
    final secondSnapshot = second.currentSnapshot.first;
    final weightPump = Timer.periodic(const Duration(milliseconds: 100), (_) {
      firstTransport.emitWeight();
      secondTransport.emitWeight();
    });
    try {
      await Future.wait([firstConnect, secondConnect]);
    } finally {
      weightPump.cancel();
    }
    expect((await firstSnapshot).weight, 1);
    expect((await secondSnapshot).weight, 1);
    expect((first as PluginScale).currentDeviceInformation?.firmwareVersion, 'R-AA:01');
    expect((second as PluginScale).currentDeviceInformation?.firmwareVersion, 'R-BB:02');
    await first.tare();
    expect(firstTransport.writes.last.data, Uint8List.fromList(const [0x10]));
    expect(secondTransport.writes.where((write) => write.data.length == 1 && write.data.first == 0x10), isEmpty);
    expect(firstTransport.operations, contains('subscribe:$_service:$_button'));
    expect(secondTransport.operations, contains('subscribe:$_service:$_button'));
    final beforeButtons = firstTransport.writes.length;
    firstTransport.emitButton(2);
    firstTransport.emitButton(0xff);
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(firstTransport.writes.length, beforeButtons);
    firstTransport.emitButton(1);
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(firstTransport.writes.length, beforeButtons + 1);
    expect(firstTransport.writes.last.data, Uint8List.fromList(const [0x10]));
    final secondBeforeButton = secondTransport.writes.length;
    secondTransport.emitButton(1);
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(secondTransport.writes.length, secondBeforeButton + 1);
    expect(secondTransport.writes.last.data, Uint8List.fromList(const [0x10]));
    await first.startTimer();
    await first.stopTimer();
    await first.resetTimer();
    await first.sleepDisplay();
    await first.wakeDisplay();
    expect(firstTransport.writes.map((write) => write.data.last), containsAllInOrder([0xdd, 0xd1, 0xd0, 0xee, 0xed, 0xec]));
    firstTransport.failNextWrite = true;
    await expectLater(first.tare(), throwsA(anything));
    await first.disconnect();
    final firstAfterDisconnect = firstTransport.writes.length;
    firstTransport.emitWeight();
    firstTransport.emitButton(1);
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(firstTransport.writes.length, firstAfterDisconnect);
    expect(manager.bleService.registry.activeBindingCount, 1);
    await second.disconnect();
  });

  test('name matcher owns Skales and releases other devices without service lists', () async {
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(kvStore: FakeKeyValueStoreService());
    addTearDown(manager.dispose);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    PluginBleOwnership decide(String? name, {bool nameComplete = true}) =>
        manager.bleService.registry
            .decide(BleAdvertisementEvidence(
              name: name,
              nameComplete: nameComplete,
              servicesComplete: false,
            ))
            .kind;
    expect(decide('Skale2'), PluginBleOwnership.plugin);
    expect(decide('Skale'), PluginBleOwnership.plugin);
    expect(decide('DE1'), PluginBleOwnership.native);
    expect(decide(null), PluginBleOwnership.native);
    expect(decide(null, nameComplete: false), PluginBleOwnership.pending);
  });

  test('settings surface uses host storage and survives plugin reload', () async {
    final store = FakeKeyValueStoreService();
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(kvStore: store);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    final initial = await _request(manager, manifest.id, 'settings-get-1', {
      'method': 'GET',
      'query': {'deviceId': 'AA:01'},
    });
    expect(initial['status'], 200);
    expect(jsonDecode(initial['body'] as String), {'deviceId': 'AA:01', 'usbPower': false, 'squareButtonShot': false, 'firstConnect': true});
    final invalid = await _request(manager, manifest.id, 'settings-post-invalid', {
      'method': 'POST',
      'query': {'deviceId': 'AA:01'},
      'body': {'usbPower': 'yes'},
    });
    expect(invalid['status'], 400);
    final saved = await _request(manager, manifest.id, 'settings-post-1', {
      'method': 'POST',
      'query': {'deviceId': 'AA:01'},
      'body': {'usbPower': true},
    });
    expect(saved['status'], 200);
    expect(jsonDecode(saved['body'] as String), {'deviceId': 'AA:01', 'usbPower': true, 'squareButtonShot': false});
    final ui = await _request(manager, manifest.id, 'settings-ui', {
      'method': 'GET',
      'query': {'ui': '1'},
    });
    expect(ui['status'], 200);
    expect(ui['body'], contains('Skale settings'));
    expect(ui['body'], contains('<body class="pu">'));
    await manager.dispose();

    final reloaded = PluginManager(kvStore: store);
    addTearDown(reloaded.dispose);
    await reloaded.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    final persisted = await _request(reloaded, manifest.id, 'settings-get-2', {
      'method': 'GET',
      'query': {'deviceId': 'AA:01'},
    });
    expect(persisted['status'], 200);
    expect(jsonDecode(persisted['body'] as String), {'deviceId': 'AA:01', 'usbPower': true, 'squareButtonShot': false});
  });

  test('serializes storage writes across devices before acknowledging each request', () async {
    final store = _DelayedStore()
      ..delays['skale.reaplugin.device.AA:01'] = const Duration(milliseconds: 80)
      ..delays['skale.reaplugin.device.BB:02'] = Duration.zero;
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(kvStore: store);
    addTearDown(manager.dispose);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    final first = _request(manager, manifest.id, 'settings-post-a', {
      'method': 'POST',
      'query': {'deviceId': 'AA:01'},
      'body': {'usbPower': true},
    });
    final second = _request(manager, manifest.id, 'settings-post-b', {
      'method': 'POST',
      'query': {'deviceId': 'BB:02'},
      'body': {'usbPower': true},
    });
    var firstDone = false;
    var secondDone = false;
    first.then((_) => firstDone = true);
    second.then((_) => secondDone = true);
    await Future<void>.delayed(const Duration(milliseconds: 20));
    expect(firstDone, isFalse);
    expect(secondDone, isFalse);
    expect((await first)['status'], 200);
    expect((await second)['status'], 200);
  });

  test('square button reads the host API and reports an ungranted machine write', () async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 8080);
    addTearDown(() => server.close(force: true));
    final requests = <String>[];
    var role = 'auxiliary';
    late String deviceId;
    server.listen((request) async {
      if (request.uri.path.startsWith('/api/v1/')) {
        requests.add('${request.method} ${request.uri.path}');
      }
      final body = switch (request.uri.path) {
        '/api/v1/devices' => [{'id': deviceId, 'connectionRole': role}],
        '/api/v1/machine/state' => {'state': {'state': 'idle', 'substate': 'idle'}},
        '/api/v1/machine/info' => {'GHC': false},
        _ => {
          'error': 'Plugin skale.reaplugin is not allowed to control the machine',
          'code': 'machine_control_not_granted',
        },
      };
      request.response.statusCode = request.method == 'PUT' ? HttpStatus.forbidden : HttpStatus.ok;
      request.response.write(jsonEncode(body));
      await request.response.close();
    });
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(
      kvStore: FakeKeyValueStoreService(),
      bleRegistry: PluginBleRegistry(activeBindingLimit: 4),
    );
    addTearDown(manager.dispose);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    final evidence = BleAdvertisementEvidence(name: 'Skale2', serviceUuids: const [_service]);
    late _SkaleTransport transport;
    final scale = await manager.bleService.createCandidate(
      driver: manager.bleService.registry.decide(evidence).drivers.single,
      physicalId: 'DD:04',
      evidence: evidence,
      admit: () => true,
      createTransport: () {
        transport = _SkaleTransport('DD:04');
        transport.queueRead(_battery, Uint8List.fromList(const [87]));
        transport.queueRead(_firmware, Uint8List.fromList(utf8.encode('R-DD')));
        return transport;
      },
    ) as Scale;
    deviceId = scale.deviceId;
    final connect = scale.onConnect();
    (scale as ScaleSnapshotHandoff).activateSnapshots();
    final weightPump = Timer.periodic(const Duration(milliseconds: 100), (_) {
      transport.emitWeight();
    });
    try {
      await connect;
    } finally {
      weightPump.cancel();
    }
    Future<void> press() async {
      transport.emitButton(2);
      await Future<void>.delayed(const Duration(milliseconds: 1200));
    }

    await press();
    expect(requests, isEmpty);
    final enabled = await _request(manager, manifest.id, 'square-on', {
      'method': 'POST',
      'query': {'deviceId': deviceId},
      'body': {'usbPower': false, 'squareButtonShot': true},
    });
    expect(enabled['status'], 200);
    await press();
    expect(requests, ['GET /api/v1/devices']);
    requests.clear();
    role = 'primary';
    final writesBefore = transport.writes.length;
    await press();
    expect(requests.take(3), [
      'GET /api/v1/devices',
      'GET /api/v1/machine/state',
      'GET /api/v1/machine/info',
    ]);
    expect(requests.skip(3), anyOf(isEmpty, ['PUT /api/v1/machine/state/espresso']));
    expect(transport.writes.length, writesBefore);
    final settings = await _request(manager, manifest.id, 'square-status', {
      'method': 'GET',
      'query': {'deviceId': deviceId},
    });
    expect(
      jsonDecode(settings['body'] as String)['machineControlMessage'],
      'Allow machine control for the Skale plugin in Decaid Settings > Plugins',
    );
    await scale.disconnect();
    requests.clear();
    await press();
    expect(requests, isEmpty);
  });

  test('a refused BLE admission fails connect before the plugin runs', () async {
    // Mirrors the live watch-reconnect failure: the host's admit() refuses the
    // candidate, so onConnect throws stale_session before the plugin's connect
    // is invoked and before any GATT transport is created.
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(
      kvStore: FakeKeyValueStoreService(),
      bleRegistry: PluginBleRegistry(activeBindingLimit: 4),
    );
    addTearDown(manager.dispose);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    final evidence = BleAdvertisementEvidence(name: 'Skale2', serviceUuids: const [_service]);
    var transports = 0;
    var admitted = true;
    final scale = await manager.bleService.createCandidate(
      driver: manager.bleService.registry.decide(evidence).drivers.single,
      physicalId: 'EE:05',
      evidence: evidence,
      admit: () => admitted,
      createTransport: () {
        transports++;
        return _SkaleTransport('EE:05');
      },
    ) as Scale;
    // Sighted and admitted, then the watch stops and admission is refused.
    admitted = false;
    await expectLater(
      scale.onConnect(),
      throwsA(isA<PluginBleException>().having((e) => e.code, 'code', 'stale_session')),
    );
    expect(transports, 0);
  });

  test('square press on a GHC machine posts one notice and starts nothing', () async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 8080);
    addTearDown(() => server.close(force: true));
    final requests = <String>[];
    late String deviceId;
    server.listen((request) async {
      requests.add('${request.method} ${request.uri.path}');
      final body = switch (request.uri.path) {
        '/api/v1/devices' => [{'id': deviceId, 'connectionRole': 'primary'}],
        '/api/v1/machine/state' => {'state': {'state': 'idle', 'substate': 'idle'}},
        '/api/v1/machine/info' => {'model': 'DE1XXL', 'version': '1358', 'GHC': true},
        _ => <String, dynamic>{},
      };
      request.response.write(jsonEncode(body));
      await request.response.close();
    });
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(
      kvStore: FakeKeyValueStoreService(),
      bleRegistry: PluginBleRegistry(activeBindingLimit: 4),
    );
    addTearDown(manager.dispose);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    final evidence = BleAdvertisementEvidence(name: 'Skale2', serviceUuids: const [_service]);
    late _SkaleTransport transport;
    final scale = await manager.bleService.createCandidate(
      driver: manager.bleService.registry.decide(evidence).drivers.single,
      physicalId: 'FF:06',
      evidence: evidence,
      admit: () => true,
      createTransport: () {
        transport = _SkaleTransport('FF:06');
        transport.queueRead(_battery, Uint8List.fromList(const [87]));
        transport.queueRead(_firmware, Uint8List.fromList(utf8.encode('R-FF')));
        return transport;
      },
    ) as Scale;
    deviceId = scale.deviceId;
    final connect = scale.onConnect();
    (scale as ScaleSnapshotHandoff).activateSnapshots();
    final weightPump = Timer.periodic(const Duration(milliseconds: 100), (_) {
      transport.emitWeight();
    });
    try {
      await connect;
    } finally {
      weightPump.cancel();
    }
    final enabled = await _request(manager, manifest.id, 'ghc-square-on', {
      'method': 'POST',
      'query': {'deviceId': deviceId},
      'body': {'usbPower': false, 'squareButtonShot': true},
    });
    expect(enabled['status'], 200);
    for (var i = 0; i < 2; i++) {
      transport.emitButton(2);
      await Future<void>.delayed(const Duration(milliseconds: 1200));
    }
    expect(requests.where((request) => request.startsWith('PUT')), isEmpty);
    final notices = manager.notifications.value
        .where((notice) => notice.sourceId == manifest.id)
        .toList();
    expect(notices, hasLength(1));
    expect(notices.single.id, 'group-head-controller');
    expect(notices.single.message, contains('group head controller'));
    await scale.disconnect();
  });

  test('invalid battery and firmware reads publish nullable metadata', () async {
    final root = Platform.environment['SKALE_PLUGIN_ROOT'] ?? '.';
    final manifest = PluginManifest.fromJson(
      jsonDecode(File('$root/manifest.json').readAsStringSync())
          as Map<String, dynamic>,
    );
    final manager = PluginManager(
      kvStore: FakeKeyValueStoreService(),
      bleRegistry: PluginBleRegistry(activeBindingLimit: 4),
    );
    addTearDown(manager.dispose);
    await manager.loadPlugin(
      id: manifest.id,
      manifest: manifest,
      settings: const {},
      jsCode: File('$root/plugin.js').readAsStringSync(),
    );
    final evidence = BleAdvertisementEvidence(name: 'Skale2', serviceUuids: const [_service]);
    late _SkaleTransport transport;
    final scale = await manager.bleService.createCandidate(
      driver: manager.bleService.registry.decide(evidence).drivers.single,
      physicalId: 'CC:03',
      evidence: evidence,
      admit: () => true,
      createTransport: () {
        transport = _SkaleTransport('CC:03');
        transport.queueRead(_battery, Uint8List.fromList(const [101]));
        transport.queueRead(_firmware, Uint8List.fromList(const [0xff]));
        return transport;
      },
    ) as Scale;
    final connect = scale.onConnect();
    (scale as ScaleSnapshotHandoff).activateSnapshots();
    final snapshot = scale.currentSnapshot.first;
    final weightPump = Timer.periodic(const Duration(milliseconds: 100), (_) {
      transport.emitWeight();
    });
    try {
      await connect;
    } finally {
      weightPump.cancel();
    }
    expect((await snapshot).weight, 1);
    expect((scale as PluginScale).currentDeviceInformation?.firmwareVersion, isNull);
    expect((scale as PluginScale).currentDeviceInformation?.batteryLevel, isNull);
    await scale.disconnect();
  });

}
