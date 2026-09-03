#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT =
  path.resolve(__dirname, '..');

const FILE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyArcGisKeysetBoundaryDiagnostic.js'
  );

const source =
  fs.readFileSync(FILE, 'utf8');

console.log(
  '=== COUNTY ARCGIS KEYSET BOUNDARY DIAGNOSTIC CONTRACT ==='
);

[
  /CountyRuntimeBridge\s*\.\s*(sync|run)\s*\(/,
  /CountyConnectorSDK\s*\.\s*get\s*\(/,
  /REOS\s*\.\s*Database\s*\./,
  /ScriptApp\s*\.\s*newTrigger\s*\(/,
  /ScriptApp\s*\.\s*deleteTrigger\s*\(/,
  /\.\s*setProperty\s*\(/,
  /\.\s*setProperties\s*\(/,
  /\.\s*deleteProperty\s*\(/,
  /\.\s*deleteAllProperties\s*\(/,
  /upsertDraftOffer\s*\(/,
  /createDraftOffer\s*\(/,
  /automaticOfferAuthorityGranted\s*:\s*true/
].forEach(pattern => {
  assert(
    !pattern.test(source),
    'forbidden mutation/execution surface: ' +
      pattern
  );
});

assert(
  source.includes(
    'REOS.CountyAdapters.ArcGIS.fetch'
  )
);

assert(
  source.includes(
    'reosCountyArcGisKeysetBoundaryDiagnostic'
  )
);

console.log(
  'PASS: diagnostic surface is read-only and adapter-bound'
);

let adminCalls = 0;
let triggerCount = 0;
let fetchCalls = [];
let failPhase = '';

const endpoint =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

const properties = {
  endpoint: endpoint
};

const cursor =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1775731235000|614849';

const sameRecords = [
  {
    violationdate: 1775731235000,
    objectid: 614900
  },
  {
    violationdate: 1775731235000,
    objectid: 614901
  }
];

const laterRecords =
  Array.from(
    { length: 48 },
    (_, index) => ({
      violationdate:
        1775731236000 + index * 1000,
      objectid:
        615000 + index
    })
  );

const context = {
  console,

  REOS: {
    Security: {
      requireAdmin() {
        adminCalls++;
      }
    },

    CountyAdapters: {
      ArcGIS: {
        fetch(options) {
          fetchCalls.push(options);

          const phase =
            fetchCalls.length === 1
              ? 'SAME_TIMESTAMP'
              : 'LATER_TIMESTAMP';

          if (failPhase === phase) {
            throw new Error(
              'synthetic ' +
              phase +
              ' ArcGIS failure'
            );
          }

          return {
            records:
              phase === 'SAME_TIMESTAMP'
                ? sameRecords
                : laterRecords,

            metadata: {
              status: 200,
              exceededTransferLimit: false
            }
          };
        }
      }
    }
  },

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) {
          if (
            key ===
            'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL'
          ) {
            return properties.endpoint;
          }

          return null;
        }
      };
    }
  },

  ScriptApp: {
    getProjectTriggers() {
      return Array.from(
        { length: triggerCount },
        () => ({
          getHandlerFunction() {
            return 'reosCountyProductionSchedulerRun';
          }
        })
      );
    }
  },

  Array,
  Boolean,
  Date,
  Error,
  JSON,
  Math,
  Number,
  Object,
  String,
  isFinite
};

vm.createContext(context);
vm.runInContext(source, context);

triggerCount = 1;

assert.throws(
  () =>
    context
      .reosCountyArcGisKeysetBoundaryDiagnostic(
        cursor
      ),
  /requires zero managed scheduler triggers/
);

assert.strictEqual(
  fetchCalls.length,
  0
);

console.log(
  'PASS: active scheduler fails closed before network execution'
);

triggerCount = 0;

properties.endpoint =
  'https://example.invalid/query';

assert.throws(
  () =>
    context
      .reosCountyArcGisKeysetBoundaryDiagnostic(
        cursor
      ),
  /endpoint authority mismatch/
);

assert.strictEqual(
  fetchCalls.length,
  0
);

properties.endpoint =
  endpoint;

assert.throws(
  () =>
    context
      .reosCountyArcGisKeysetBoundaryDiagnostic(
        'AK1|FOREIGN|1775731235000|614849'
      ),
  /cursor domain mismatch/
);

assert.strictEqual(
  fetchCalls.length,
  0
);

console.log(
  'PASS: endpoint and cursor-domain drift fail closed before network execution'
);

fetchCalls = [];
failPhase = '';

const result =
  context
    .reosCountyArcGisKeysetBoundaryDiagnostic(
      cursor
    );

assert.strictEqual(result.ok, true);
assert.strictEqual(result.readOnly, true);
assert.strictEqual(result.failedPhase, '');
assert.strictEqual(result.sameTimestamp.count, 2);
assert.strictEqual(result.remainingCapacity, 48);
assert.strictEqual(result.laterTimestamp.count, 48);
assert.strictEqual(result.combinedCount, 50);
assert.strictEqual(result.fullPage, true);

assert.strictEqual(
  fetchCalls.length,
  2
);

assert.strictEqual(
  fetchCalls[0].context.limit,
  50
);

assert.strictEqual(
  fetchCalls[0].maxLimit,
  50
);

assert.strictEqual(
  fetchCalls[0].orderByFields,
  'objectid ASC'
);

assert(
  fetchCalls[0].where.includes(
    "violationdate = TIMESTAMP '2026-04-09 10:40:35'"
  )
);

assert(
  fetchCalls[0].where.includes(
    'objectid > 614849'
  )
);

assert.strictEqual(
  fetchCalls[1].context.limit,
  48
);

assert.strictEqual(
  fetchCalls[1].maxLimit,
  48
);

assert.strictEqual(
  fetchCalls[1].orderByFields,
  'violationdate ASC, objectid ASC'
);

assert(
  fetchCalls[1].where.includes(
    "violationdate > TIMESTAMP '2026-04-09 10:40:35'"
  )
);

assert.strictEqual(
  result.observedCursor,
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1775731283000|615047'
);

[
  'connectorExecutionAuthorityGranted',
  'schedulerAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(key => {
  assert.strictEqual(
    result[key],
    false
  );
});

console.log(
  'PASS: successful boundary reproduces production two-part keyset read'
);

fetchCalls = [];
failPhase = 'SAME_TIMESTAMP';

const sameFailure =
  context
    .reosCountyArcGisKeysetBoundaryDiagnostic(
      cursor
    );

assert.strictEqual(
  sameFailure.ok,
  false
);

assert.strictEqual(
  sameFailure.failedPhase,
  'SAME_TIMESTAMP'
);

assert.strictEqual(
  fetchCalls.length,
  1
);

assert(
  sameFailure
    .sameTimestamp
    .error
    .includes(
      'synthetic SAME_TIMESTAMP ArcGIS failure'
    )
);

console.log(
  'PASS: same-timestamp transport failure is isolated without second request'
);

fetchCalls = [];
failPhase = 'LATER_TIMESTAMP';

const laterFailure =
  context
    .reosCountyArcGisKeysetBoundaryDiagnostic(
      cursor
    );

assert.strictEqual(
  laterFailure.ok,
  false
);

assert.strictEqual(
  laterFailure.failedPhase,
  'LATER_TIMESTAMP'
);

assert.strictEqual(
  fetchCalls.length,
  2
);

assert.strictEqual(
  laterFailure.sameTimestamp.ok,
  true
);

assert(
  laterFailure
    .laterTimestamp
    .error
    .includes(
      'synthetic LATER_TIMESTAMP ArcGIS failure'
    )
);

console.log(
  'PASS: later-timestamp transport failure is isolated after successful boundary read'
);

console.log(
  'PASS: no connector, scheduler, checkpoint, database, or offer authority is granted'
);

console.log(
  'PASS: county ArcGIS keyset boundary diagnostic contract validation PASSED.'
);
