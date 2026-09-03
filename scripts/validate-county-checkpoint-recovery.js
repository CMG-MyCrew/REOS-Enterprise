#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const source = fs.readFileSync(
  'build/apps-script-brand/CountyCheckpointRecovery.js',
  'utf8'
);

console.log(
  '=== COUNTY CHECKPOINT RECOVERY CONTRACT ==='
);

assert(
  !/CountyRuntimeBridge\s*\.\s*(sync|run)/.test(source),
  'recovery module must contain no county execution authority'
);

assert(
  !/Database\s*\./.test(source),
  'recovery module must contain no database authority'
);

assert(
  !/newTrigger\s*\(/.test(source),
  'recovery module must contain no trigger-install authority'
);

assert(
  !/deleteProperty\s*\(/.test(source),
  'recovery module must not retire/delete checkpoint authority'
);

assert(
  !/Offer|MAO|DraftOffer/.test(source),
  'recovery module must contain no offer authority'
);

console.log(
  'PASS: static recovery mutation surface is checkpoint-only'
);

const properties = new Map([
  [
    'REOS_COUNTY_SCHEDULER_CYCLE_ID',
    'COUNTY-20260902222607805'
  ],
  [
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT',
    '2026-09-02T22:26:07.805Z'
  ],
  [
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
    '1'
  ],
  [
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
    ''
  ],
  [
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON',
    JSON.stringify([
      {
        dataset: 'code_violations',
        error:
          'ArcGIS API error: {"code":400,"message":"Cannot perform query. Invalid query parameters.","details":["Unable to perform query. Please check your parameters."]}',
        connectorId: 'PA-PHILADELPHIA',
        ok: false
      }
    ])
  ]
]);

let adminCalls = 0;
let triggerCount = 0;
let lockAvailable = true;
let lockHeld = false;
let setCalls = [];

const props = {
  getProperty(key) {
    return properties.has(key)
      ? properties.get(key)
      : null;
  },
  setProperty(key, value) {
    setCalls.push([key, String(value)]);
    properties.set(key, String(value));
    return props;
  }
};

const lock = {
  tryLock() {
    if (!lockAvailable) return false;
    lockHeld = true;
    return true;
  },
  hasLock() {
    return lockHeld;
  },
  releaseLock() {
    lockHeld = false;
  }
};

const context = {
  console,
  REOS: {
    Security: {
      requireAdmin() {
        adminCalls++;
      }
    }
  },
  PropertiesService: {
    getScriptProperties() {
      return props;
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
  LockService: {
    getScriptLock() {
      return lock;
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

const inspect =
  context.reosCountyCheckpointRecoveryInspect();

assert.strictEqual(inspect.readOnly, true);
assert.strictEqual(
  inspect.recoveryAuthorityGranted,
  false
);
assert.strictEqual(inspect.eligible, true);
assert.strictEqual(setCalls.length, 0);

console.log(
  'PASS: inspection is read-only and grants no mutation authority'
);

assert.throws(
  () =>
    context.reosCountyCheckpointRecoveryExecute(
      false
    ),
  /confirmation is required/
);

assert.strictEqual(setCalls.length, 0);

console.log(
  'PASS: missing explicit confirmation fails before mutation'
);

triggerCount = 1;

assert.throws(
  () =>
    context.reosCountyCheckpointRecoveryExecute(
      true
    ),
  /requires zero managed scheduler triggers/
);

assert.strictEqual(setCalls.length, 0);

console.log(
  'PASS: managed scheduler authority fails before mutation'
);

triggerCount = 0;
lockAvailable = false;

assert.throws(
  () =>
    context.reosCountyCheckpointRecoveryExecute(
      true
    ),
  /lock contention/
);

assert.strictEqual(setCalls.length, 0);

console.log(
  'PASS: lock contention fails before mutation'
);

lockAvailable = true;

properties.set(
  'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
  '2'
);

assert.throws(
  () =>
    context.reosCountyCheckpointRecoveryExecute(
      true
    ),
  /feed-index authority mismatch/
);

assert.strictEqual(setCalls.length, 0);

console.log(
  'PASS: corrupt-state drift fails closed under lock'
);

properties.set(
  'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
  '1'
);

const result =
  context.reosCountyCheckpointRecoveryExecute(
    true
  );

assert.strictEqual(result.ok, true);
assert.strictEqual(result.recovered, true);
assert.strictEqual(result.nextFeedIndex, 0);
assert.strictEqual(result.completedFeeds, 0);

assert.strictEqual(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_ID'
  ),
  'COUNTY-20260902222607805'
);

assert.strictEqual(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT'
  ),
  '2026-09-02T22:26:07.805Z'
);

assert.strictEqual(
  properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ),
  '0'
);

assert.strictEqual(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ),
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1764720000000|586498'
);

assert.strictEqual(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  ),
  '[]'
);

assert.deepStrictEqual(
  setCalls.map(call => call[0]),
  [
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  ]
);

console.log(
  'PASS: recovery performs exactly three bounded checkpoint writes'
);

console.log(
  'PASS: recovery restores exact certified page-22 authority'
);

console.log(
  'PASS: cycle identity and original start authority are preserved'
);

console.log(
  'PASS: completed-feed evidence is removed'
);

console.log(
  'PASS: county checkpoint recovery contract validation PASSED.'
);
