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
    'CountyPage23ArcGisRuntimeDiagnostic.js'
  );

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

console.log(
  '=== COUNTY PAGE-23 ARCGIS RUNTIME DIAGNOSTIC CONTRACT ==='
);

/*
 * Static containment.
 */
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
  ),
  'diagnostic must exercise production ArcGIS adapter'
);

assert(
  source.includes(
    'reosCountyPage23ArcGisRuntimeDiagnostic'
  ),
  'public diagnostic RPC missing'
);

console.log(
  'PASS: static diagnostic surface is read-only and adapter-bound'
);

let adminCalls = 0;
let triggerCount = 0;
let fetchCalls = [];

const certifiedEndpoint =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

const properties = {
  endpoint:
    certifiedEndpoint
};

function records(
  count,
  firstDate,
  firstId,
  lastDate,
  lastId
) {
  if (!count) {
    return [];
  }

  const result =
    Array.from(
      { length: count },
      (_, index) => ({
        violationdate:
          firstDate + index,
        objectid:
          firstId + index
      })
    );

  result[0] = {
    violationdate:
      firstDate,
    objectid:
      firstId
  };

  result[count - 1] = {
    violationdate:
      lastDate,
    objectid:
      lastId
  };

  return result;
}

const sameRecords =
  records(
    4,
    1764720000000,
    586880,
    1764720000000,
    586927
  );

const laterRecords =
  records(
    46,
    1764741017000,
    587153,
    1764929768000,
    587896
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

          if (fetchCalls.length === 1) {
            return {
              records:
                sameRecords,

              metadata: {
                status: 200,
                exceededTransferLimit:
                  false
              }
            };
          }

          if (fetchCalls.length === 2) {
            return {
              records:
                laterRecords,

              metadata: {
                status: 200,
                exceededTransferLimit:
                  true
              }
            };
          }

          throw new Error(
            'unexpected third ArcGIS request'
          );
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
  String
};

vm.createContext(context);
vm.runInContext(source, context);

/*
 * Scheduler gate.
 */
triggerCount = 1;

assert.throws(
  () =>
    context
      .reosCountyPage23ArcGisRuntimeDiagnostic(),
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

/*
 * Endpoint gate.
 */
properties.endpoint =
  'https://example.invalid/query';

assert.throws(
  () =>
    context
      .reosCountyPage23ArcGisRuntimeDiagnostic(),
  /endpoint authority mismatch/
);

assert.strictEqual(
  fetchCalls.length,
  0
);

console.log(
  'PASS: endpoint drift fails closed before network execution'
);

properties.endpoint =
  certifiedEndpoint;

/*
 * Successful exact page-23 runtime contract.
 */
const result =
  context
    .reosCountyPage23ArcGisRuntimeDiagnostic();

assert.strictEqual(
  result.ok,
  true
);

assert.strictEqual(
  result.readOnly,
  true
);

assert.strictEqual(
  result.combinedCount,
  50
);

assert.strictEqual(
  result.sameTimestamp.count,
  4
);

assert.strictEqual(
  result.laterTimestamp.count,
  46
);

assert.strictEqual(
  fetchCalls.length,
  2
);

assert.strictEqual(
  fetchCalls[0].endpoint,
  certifiedEndpoint
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
    "violationdate = TIMESTAMP '2025-12-03 00:00:00'"
  )
);

assert(
  fetchCalls[0].where.includes(
    'objectid > 586498'
  )
);

assert.strictEqual(
  fetchCalls[1].context.limit,
  46
);

assert.strictEqual(
  fetchCalls[1].maxLimit,
  46
);

assert.strictEqual(
  fetchCalls[1].orderByFields,
  'violationdate ASC, objectid ASC'
);

assert(
  fetchCalls[1].where.includes(
    "violationdate > TIMESTAMP '2025-12-03 00:00:00'"
  )
);

assert.strictEqual(
  result.observedPage23Cursor,
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1764929768000|587896'
);

assert.strictEqual(
  result.expectedPage23Cursor,
  result.observedPage23Cursor
);

assert.strictEqual(
  result.matchesExpectedPage23Cursor,
  true
);

assert.strictEqual(
  result.connectorExecutionAuthorityGranted,
  false
);

assert.strictEqual(
  result.schedulerAuthorityGranted,
  false
);

assert.strictEqual(
  result.checkpointMutationAuthorityGranted,
  false
);

assert.strictEqual(
  result.productionDataMutationAuthorityGranted,
  false
);

assert.strictEqual(
  result.automaticOfferAuthorityGranted,
  false
);

console.log(
  'PASS: diagnostic issues exactly two bounded ArcGIS adapter reads'
);

console.log(
  'PASS: same-timestamp request preserves the certified page-22 tie boundary'
);

console.log(
  'PASS: later request consumes only the remaining 46-record page capacity'
);

console.log(
  'PASS: observed page-23 cursor matches independent live-source evidence'
);

console.log(
  'PASS: no connector, scheduler, checkpoint, database, or offer authority is granted'
);

console.log(
  'PASS: county page-23 ArcGIS runtime diagnostic contract validation PASSED.'
);
