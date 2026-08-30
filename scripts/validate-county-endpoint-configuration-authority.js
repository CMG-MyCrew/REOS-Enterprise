#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const FILE =
  'build/apps-script-brand/CountyEndpointConfigurationAuthority.js';

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const CERTIFIED_ENDPOINT =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

const PROPERTY =
  'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

function test(name, fn) {
  fn();
  console.log(`PASS: ${name}`);
}

test(
  'authority surface is limited to one exact endpoint property',
  () => {
    assert(
      source.includes(
        `'${PROPERTY}'`
      )
    );

    assert(
      source.includes(
        `'${CERTIFIED_ENDPOINT}'`
      )
    );

    assert.strictEqual(
      (
        source.match(
          /\.setProperty\s*\(/g
        ) || []
      ).length,
      1
    );
  }
);

test(
  'no production data mutation APIs are present',
  () => {
    const forbidden = [
      'REOS.Database.insert',
      'REOS.Database.update',
      'REOS.Database.delete',
      'REOS.Database.upsert',
      'setValues(',
      'appendRow(',
      'deleteRow(',
      'insertRow',
      'CountyConnectorSDK.run(',
      'CountyRuntimeBridge.sync(',
      'REOS_COUNTY_RUNTIME_SYNC('
    ];

    forbidden.forEach(
      token => {
        assert(
          !source.includes(token),
          `forbidden mutation token: ${token}`
        );
      }
    );
  }
);

test(
  'configuration is fail-closed and scheduler-quiescent',
  () => {
    [
      'confirmEndpointUpdate',
      'expectedCurrentEndpointSha256',
      'requireAdmin',
      'tryLock',
      'reosCountyProductionSchedulerRun',
      'County scheduler must remain frozen'
    ].forEach(
      token => {
        assert(
          source.includes(token),
          `missing authority token: ${token}`
        );
      }
    );
  }
);

test(
  'preflight is bound to exact 1601-1700 source window',
  () => {
    [
      "var CERTIFIED_CURSOR =\n    '1600';",
      'var CERTIFIED_LIMIT =\n    100;',
      'var FIRST_SOURCE_ID =\n    1601;',
      'var LAST_SOURCE_ID =\n    1700;',
      "dryRun:\n        true",
      "config: {\n        endpoint:\n          CERTIFIED_ENDPOINT"
    ].forEach(
      token => {
        assert(
          source.includes(token),
          `missing preflight contract: ${token}`
        );
      }
    );
  }
);

test(
  'status and preflight grant no endpoint configuration authority',
  () => {
    assert(
      source.includes(
        "mode:\n          'READ_ONLY_ENDPOINT_STATUS'"
      )
    );

    assert(
      source.includes(
        "mode:\n          'READ_ONLY_ENDPOINT_PREFLIGHT'"
      )
    );

    assert(
      source.includes(
        'endpointConfigurationAuthorityGranted:\n          false'
      )
    );
  }
);

test(
  'data, repair, scheduler and offer authority remain false',
  () => {
    [
      'productionDataMutationExecuted',
      'distressLeadMutationAuthorityGranted',
      'repairAuthorityGranted',
      'insertAuthorityGranted',
      'updateAuthorityGranted',
      'deleteAuthorityGranted',
      'schedulerAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(
      field => {
        assert(
          source.includes(field),
          `missing safety field: ${field}`
        );
      }
    );
  }
);

function fakeDigest(bytes) {
  const input =
    String(bytes);

  const out =
    new Array(32)
      .fill(0);

  for (
    let i = 0;
    i < input.length;
    i += 1
  ) {
    out[
      i % out.length
    ] =
      (
        out[
          i % out.length
        ] +
        input.charCodeAt(i)
      ) % 256;
  }

  return out.map(
    value =>
      value > 127
        ? value - 256
        : value
  );
}

function makeRuntime(
  currentEndpoint
) {
  let propertyValue =
    currentEndpoint;

  let setCalls =
    0;

  const records =
    Array.from(
      { length: 100 },
      (_, index) => ({
        objectid:
          1601 + index,

        address:
          `${1601 + index} Test St`
      })
    );

  const context = {
    console,
    Utilities: {
      DigestAlgorithm: {
        SHA_256:
          'SHA_256'
      },
      Charset: {
        UTF_8:
          'UTF_8'
      },
      computeDigest(
        algorithm,
        value
      ) {
        return fakeDigest(
          String(value)
        );
      }
    },
    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return propertyValue;
          },
          setProperty(
            key,
            value
          ) {
            assert.strictEqual(
              key,
              PROPERTY
            );
            propertyValue =
              value;
            setCalls += 1;
          }
        };
      }
    },
    ScriptApp: {
      getProjectTriggers() {
        return [];
      }
    },
    LockService: {
      getScriptLock() {
        return {
          tryLock() {
            return true;
          },
          releaseLock() {}
        };
      }
    },
    REOS: {
      Security: {
        requireAdmin() {}
      },
      CountyRuntimeBridge: {
        registerConnectors() {}
      },
      CountyConnectorSDK: {
        get() {
          return {
            fetch() {
              return {
                records,
                nextCursor:
                  '1700'
              };
            },
            normalize(raw) {
              return {
                Address:
                  raw.address,
                Source:
                  'PA-PHILADELPHIA',
                'Source Dataset':
                  'code_violations',
                'Source Record ID':
                  String(
                    raw.objectid
                  )
              };
            }
          };
        }
      }
    }
  };

  context.global =
    context;

  vm.createContext(
    context
  );

  vm.runInContext(
    source,
    context,
    {
      filename:
        FILE
    }
  );

  return {
    context,
    getProperty:
      () => propertyValue,
    getSetCalls:
      () => setCalls
  };
}

test(
  'status performs no Script Property write',
  () => {
    const runtime =
      makeRuntime(
        'https://invalid.example/query'
      );

    const result =
      runtime.context
        .reosCountyEndpointConfigurationStatus();

    assert.strictEqual(
      result.mode,
      'READ_ONLY_ENDPOINT_STATUS'
    );

    assert.strictEqual(
      runtime.getSetCalls(),
      0
    );
  }
);

test(
  'preflight proves exact source window without Script Property write',
  () => {
    const runtime =
      makeRuntime(
        'https://invalid.example/query'
      );

    const result =
      runtime.context
        .reosCountyEndpointConfigurationPreflight();

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.sourceRecordCount,
      100
    );

    assert.strictEqual(
      result.firstSourceRecordId,
      '1601'
    );

    assert.strictEqual(
      result.lastSourceRecordId,
      '1700'
    );

    assert.strictEqual(
      runtime.getSetCalls(),
      0
    );
  }
);

test(
  'configuration rejects incorrect current-endpoint fingerprint before write',
  () => {
    const runtime =
      makeRuntime(
        'https://invalid.example/query'
      );

    assert.throws(
      () =>
        runtime.context
          .reosCountyEndpointConfigurationApply({
            confirmEndpointUpdate:
              true,
            endpoint:
              CERTIFIED_ENDPOINT,
            expectedCurrentEndpointSha256:
              '0'.repeat(64)
          }),
      /Current endpoint SHA-256 differs/
    );

    assert.strictEqual(
      runtime.getSetCalls(),
      0
    );
  }
);

test(
  'configuration accepts only certified endpoint and performs one property write',
  () => {
    const runtime =
      makeRuntime(
        'https://invalid.example/query'
      );

    const status =
      runtime.context
        .reosCountyEndpointConfigurationStatus();

    const result =
      runtime.context
        .reosCountyEndpointConfigurationApply({
          confirmEndpointUpdate:
            true,
          endpoint:
            CERTIFIED_ENDPOINT,
          expectedCurrentEndpointSha256:
            status.currentEndpointSha256
        });

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.mode,
      'CONTROLLED_ENDPOINT_CONFIGURATION'
    );

    assert.strictEqual(
      result.endpointConfigurationExecuted,
      true
    );

    assert.strictEqual(
      runtime.getSetCalls(),
      1
    );

    assert.strictEqual(
      runtime.getProperty(),
      CERTIFIED_ENDPOINT
    );

    assert.strictEqual(
      result.productionDataMutationExecuted,
      false
    );

    assert.strictEqual(
      result.repairAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.schedulerAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.automaticOfferAuthorityGranted,
      false
    );
  }
);

console.log(
  'County endpoint configuration authority validation PASSED.'
);
