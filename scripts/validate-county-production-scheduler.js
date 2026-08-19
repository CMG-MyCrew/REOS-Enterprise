#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(
  ROOT,
  'build/apps-script-brand/CountyProductionScheduler.js'
);

function fail(message) {
  console.error('FAIL: ' + message);
  process.exit(1);
}

function pass(message) {
  console.log('PASS: ' + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
  pass(message);
}

if (!fs.existsSync(SOURCE)) {
  fail('CountyProductionScheduler.js is present');
}

const source = fs.readFileSync(SOURCE, 'utf8');

console.log(
  '=== COUNTY PRODUCTION SCHEDULER CERTIFICATION ==='
);

assert(
  source.includes('REOS.CountyProductionScheduler'),
  'CountyProductionScheduler namespace is present'
);

assert(
  source.includes(
    "const HANDLER = 'reosCountyProductionSchedulerRun'"
  ),
  'dedicated county scheduler handler is present'
);

assert(
  source.includes('const STALE_HOURS = 48'),
  '48-hour stale-health contract is explicit'
);

assert(
  source.includes('LockService.getScriptLock()') &&
  source.includes('tryLock(LOCK_WAIT_MS)'),
  'scheduler has lock / overlap protection'
);

assert(
  !/CountyRuntimeBridge\.runAll\s*\(/.test(source),
  'scheduler cannot invoke CountyRuntimeBridge.runAll'
);

const requiredPairs = [
  ['PA-PHILADELPHIA', 'tax_delinquent'],
  ['PA-PHILADELPHIA', 'code_violations'],
  ['PA-PHILADELPHIA', 'vacant_properties'],
  ['PA-PHILADELPHIA', 'sheriff_tax_sales'],
  ['PA-PHILADELPHIA', 'sheriff_mortgage_sales'],
  ['PA-BUCKS', 'tax_delinquent']
];

for (const [connectorId, dataset] of requiredPairs) {
  assert(
    source.includes(`connectorId: '${connectorId}'`) &&
    source.includes(`dataset: '${dataset}'`),
    `allowlist contains ${connectorId} / ${dataset}`
  );
}

for (const forbidden of [
  'property_assessment',
  'parcel_inventory',
  'probate',
  'absentee_owner',
  'absentee_owners'
]) {
  const allowlistBlock =
    source.match(
      /const ALLOWLIST = Object\.freeze\(\[([\s\S]*?)\]\);/
    );

  assert(
    allowlistBlock &&
    !allowlistBlock[1].includes(`dataset: '${forbidden}'`),
    `allowlist excludes ${forbidden}`
  );
}

assert(
  source.includes('confirmLive: true'),
  'scheduled county execution explicitly confirms live mode'
);

assert(
  source.includes('.everyHours(6)'),
  'scheduler cadence is bounded to every six hours'
);

assert(
  source.includes('REOS.Security.requireAdmin()'),
  'scheduler management/status controls require admin authority'
);

assert(
  source.includes('REOS_COUNTY_SCHEDULER_LAST_ATTEMPT_AT') &&
  source.includes('REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT') &&
  source.includes('REOS_COUNTY_SCHEDULER_LAST_FAILURE_AT') &&
  source.includes('REOS_COUNTY_SCHEDULER_LAST_FAILURE_MESSAGE') &&
  source.includes('REOS_COUNTY_SCHEDULER_LAST_RESULT_JSON'),
  'bounded scheduler telemetry is present'
);

/*
 * Runtime certification with Apps Script service doubles.
 */
const properties = new Map();
let triggers = [];
let triggerSeq = 0;
let lockAvailable = true;
let adminCalls = 0;
let syncCalls = [];
let failingDataset = '';

function makeTrigger(handler) {
  const id = 'trigger-' + (++triggerSeq);

  return {
    getHandlerFunction() {
      return handler;
    },
    getEventType() {
      return 'CLOCK';
    },
    getTriggerSource() {
      return 'CLOCK';
    },
    getUniqueId() {
      return id;
    }
  };
}

const context = {
  console,
  Date,
  JSON,
  Object,
  String,
  Error,
  isNaN,

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) {
          return properties.has(key)
            ? properties.get(key)
            : null;
        },
        setProperty(key, value) {
          properties.set(key, String(value));
          return this;
        },
        deleteProperty(key) {
          properties.delete(key);
          return this;
        }
      };
    }
  },

  ScriptApp: {
    getProjectTriggers() {
      return triggers.slice();
    },
    deleteTrigger(trigger) {
      triggers = triggers.filter(
        item => item !== trigger
      );
    },
    newTrigger(handler) {
      return {
        timeBased() {
          return this;
        },
        everyHours(hours) {
          if (hours !== 6) {
            throw new Error(
              'Unexpected scheduler cadence: ' + hours
            );
          }
          return this;
        },
        create() {
          const trigger = makeTrigger(handler);
          triggers.push(trigger);
          return trigger;
        }
      };
    }
  },

  LockService: {
    getScriptLock() {
      let held = false;

      return {
        tryLock() {
          if (!lockAvailable) return false;
          held = true;
          return true;
        },
        hasLock() {
          return held;
        },
        releaseLock() {
          held = false;
        }
      };
    }
  },

  REOS: {
    Security: {
      requireAdmin() {
        adminCalls++;
      }
    },

    CountyRuntimeBridge: {
      sync(connectorId, dataset, options) {
        syncCalls.push({
          connectorId,
          dataset,
          options
        });

        if (dataset === failingDataset) {
          throw new Error(
            'Synthetic failure for ' + dataset
          );
        }

        return {
          ok: true,
          connectorId,
          dataset
        };
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

const scheduler = context.REOS.CountyProductionScheduler;

assert(
  scheduler &&
  typeof scheduler.installScheduler === 'function' &&
  typeof scheduler.removeScheduler === 'function' &&
  typeof scheduler.getStatus === 'function' &&
  typeof scheduler.run === 'function',
  'public county scheduler API is complete'
);

assert(
  typeof context.reosCountyProductionSchedulerInstall ===
    'function' &&
  typeof context.reosCountyProductionSchedulerRemove ===
    'function' &&
  typeof context.reosCountyProductionSchedulerStatus ===
    'function' &&
  typeof context.reosCountyProductionSchedulerRun ===
    'function',
  'controlled Apps Script entry points are present'
);

/* Install must touch only its own handler. */
const foreignTrigger =
  makeTrigger('reosProductionOperationsHeartbeat');
triggers.push(foreignTrigger);

context.reosCountyProductionSchedulerInstall();

assert(
  triggers.length === 2 &&
  triggers.includes(foreignTrigger) &&
  triggers.filter(
    trigger =>
      trigger.getHandlerFunction() ===
      'reosCountyProductionSchedulerRun'
  ).length === 1,
  'scheduler installation is trigger-isolated'
);

context.reosCountyProductionSchedulerInstall();

assert(
  triggers.length === 2 &&
  triggers.includes(foreignTrigger) &&
  triggers.filter(
    trigger =>
      trigger.getHandlerFunction() ===
      'reosCountyProductionSchedulerRun'
  ).length === 1,
  'scheduler installation is idempotent'
);

/* Healthy run must execute exactly the six approved pairs. */
syncCalls = [];
failingDataset = '';

const healthy =
  context.reosCountyProductionSchedulerRun();

assert(
  healthy.ok === true &&
  healthy.status === 'Healthy' &&
  syncCalls.length === 6,
  'healthy scheduled run executes exactly six feeds'
);

const actualPairs = syncCalls.map(
  call => call.connectorId + '/' + call.dataset
);

for (const [connectorId, dataset] of requiredPairs) {
  assert(
    actualPairs.includes(connectorId + '/' + dataset),
    `runtime executes ${connectorId} / ${dataset}`
  );
}

assert(
  syncCalls.every(
    call =>
      call.options &&
      call.options.confirmLive === true
  ),
  'every scheduled feed explicitly confirms live execution'
);

assert(
  !syncCalls.some(
    call =>
      [
        'property_assessment',
        'parcel_inventory',
        'probate',
        'absentee_owner',
        'absentee_owners'
      ].includes(call.dataset)
  ),
  'runtime cannot schedule reference/deferred datasets'
);

const firstSuccessAt =
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  );

assert(
  Boolean(firstSuccessAt),
  'successful complete run advances freshness'
);

/* One feed failure must remain visible but not stop later feeds. */
syncCalls = [];
failingDataset = 'code_violations';

const degraded =
  context.reosCountyProductionSchedulerRun();

assert(
  degraded.ok === false &&
  degraded.status === 'Unhealthy',
  'feed failure makes scheduler unhealthy'
);

assert(
  syncCalls.length === 6,
  'one feed failure does not prevent remaining feeds from being attempted'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  ) === firstSuccessAt,
  'partial failure does not advance complete-workload freshness'
);

assert(
  Boolean(
    properties.get(
      'REOS_COUNTY_SCHEDULER_LAST_FAILURE_AT'
    )
  ) &&
  /1 failed dataset/.test(
    properties.get(
      'REOS_COUNTY_SCHEDULER_LAST_FAILURE_MESSAGE'
    ) || ''
  ),
  'scheduler failure telemetry is persisted'
);

const resultJson = JSON.parse(
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_RESULT_JSON'
  )
);

assert(
  resultJson.failed === 1 &&
  resultJson.succeeded === 5 &&
  resultJson.results.some(
    result =>
      result.dataset === 'code_violations' &&
      result.ok === false
  ),
  'per-feed failure remains visible in bounded result telemetry'
);

/* Duplicate managed authority must fail closed. */
failingDataset = '';
triggers.push(
  makeTrigger('reosCountyProductionSchedulerRun')
);

const duplicateAuthority =
  context.reosCountyProductionSchedulerRun();

assert(
  duplicateAuthority.ok === false &&
  /expected 1 trigger, found 2/.test(
    duplicateAuthority.error || ''
  ),
  'duplicate managed scheduler authority fails closed'
);

/* Restore one managed trigger for contention test. */
triggers = triggers.filter(
  trigger =>
    trigger.getHandlerFunction() !==
    'reosCountyProductionSchedulerRun'
);
triggers.push(
  makeTrigger('reosCountyProductionSchedulerRun')
);

lockAvailable = false;

const contended =
  context.reosCountyProductionSchedulerRun();

assert(
  contended.ok === false &&
  contended.skipped === true &&
  contended.status === 'Contended',
  'overlapping county scheduler execution fails closed as Contended'
);

lockAvailable = true;

/* Status surface must be callable through admin authority. */
const status =
  context.reosCountyProductionSchedulerStatus();

assert(
  status &&
  status.scheduler &&
  status.scheduler.triggerCount === 1,
  'scheduler status surface reports managed trigger state'
);

/* Removal must preserve foreign trigger. */
context.reosCountyProductionSchedulerRemove();

assert(
  triggers.length === 1 &&
  triggers[0] === foreignTrigger,
  'scheduler removal is idempotent and trigger-isolated'
);

context.reosCountyProductionSchedulerRemove();

assert(
  triggers.length === 1 &&
  triggers[0] === foreignTrigger,
  'repeated scheduler removal remains isolated'
);

assert(
  adminCalls >= 5,
  'scheduler install/remove/status surface is admin-protected'
);

console.log();
console.log(
  'County production scheduler certification PASSED.'
);
