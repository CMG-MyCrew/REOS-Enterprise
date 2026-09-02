#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(
  ROOT,
  'build/apps-script-brand/CountyProductionScheduler.js'
);

const PHILADELPHIA_CONNECTOR_SOURCE = path.join(
  ROOT,
  'build/apps-script-brand/PAPhiladelphiaCountyConnector.js'
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

if (!fs.existsSync(PHILADELPHIA_CONNECTOR_SOURCE)) {
  fail('PAPhiladelphiaCountyConnector.js is present');
}

const philadelphiaConnectorSource =
  fs.readFileSync(
    PHILADELPHIA_CONNECTOR_SOURCE,
    'utf8'
  );

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
  ['PA-PHILADELPHIA', 'code_violations'],
  ['PA-PHILADELPHIA', 'vacant_properties'],
  ['PA-PHILADELPHIA', 'sheriff_tax_sales'],
  ['PA-PHILADELPHIA', 'sheriff_mortgage_sales']
];

for (const [connectorId, dataset] of requiredPairs) {
  assert(
    source.includes(`connectorId: '${connectorId}'`) &&
    source.includes(`dataset: '${dataset}'`),
    `allowlist contains ${connectorId} / ${dataset}`
  );
}

const codeViolationsStart =
  philadelphiaConnectorSource.indexOf(
    '      code_violations: {'
  );

const vacantPropertiesStart =
  philadelphiaConnectorSource.indexOf(
    '      vacant_properties: {',
    codeViolationsStart
  );

assert(
  codeViolationsStart !== -1 &&
    vacantPropertiesStart !== -1,
  'scheduled Philadelphia code_violations definition is present'
);

const codeViolationsBlock =
  philadelphiaConnectorSource.slice(
    codeViolationsStart,
    vacantPropertiesStart
  );

assert(
  codeViolationsBlock.includes(
    'adapter: "arcgis"'
  ),
  'scheduled code_violations uses ArcGIS pagination'
);

assert(
  codeViolationsBlock.includes(
    'orderByFields: "violationdate ASC, objectid ASC"'
  ),
  'scheduled code_violations uses deterministic composite keyset ordering'
);

assert(
  codeViolationsBlock.includes(
    'type: "arcgis-date-objectid-v1"'
  ) &&
    codeViolationsBlock.includes(
      'id: "PHL-CODE-HIGH-SEED-20250901-OID636638-V1"'
    ) &&
    codeViolationsBlock.includes(
      'dateField: "violationdate"'
    ) &&
    codeViolationsBlock.includes(
      'objectIdField: "objectid"'
    ),
  'scheduled code_violations preserves certified composite cursor domain'
);

assert(
  philadelphiaConnectorSource.includes(
    'if (definition.orderByFields)'
  ) &&
    philadelphiaConnectorSource.includes(
      'adapterOptions.orderByFields'
    ),
  'Philadelphia ArcGIS fetch path propagates deterministic ordering'
);

assert(
  !source.includes("connectorId: 'PA-BUCKS'"),
  'scheduler excludes disabled PA-BUCKS / tax_delinquent'
);

for (const forbidden of [
  'tax_delinquent',
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

/*
 * Synthetic page cursors returned by CountyRuntimeBridge.sync().
 * Each dataset may provide a sequence of nextCursor values.
 * An empty cursor means the current feed reached terminal completion.
 */
let pageCursorResponses = {};
let pageCursorResponseIndexes = {};

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

        const cursorResponses =
          pageCursorResponses[dataset] || [''];

        const responseIndex =
          pageCursorResponseIndexes[dataset] || 0;

        const nextCursor =
          responseIndex < cursorResponses.length
            ? cursorResponses[responseIndex]
            : '';

        pageCursorResponseIndexes[dataset] =
          responseIndex + 1;

        return {
          ok: true,
          connectorId,
          dataset,
          nextCursor: nextCursor
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


/*
 * Pagination contract.
 *
 * A scheduler invocation owns at most one county feed page.
 * A non-empty nextCursor keeps the same feed active and must not
 * create completed-feed evidence or complete-workload freshness.
 */
syncCalls = [];
failingDataset = '';
pageCursorResponses = {
  code_violations: ['50', '100', '']
};
pageCursorResponseIndexes = {};

const paginationFreshnessBefore =
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  ) || '';

const page1 =
  context.reosCountyProductionSchedulerRun();

assert(
  syncCalls.length === 1,
  'paginated invocation 1 executes exactly one page'
);

assert(
  syncCalls[0].connectorId === 'PA-PHILADELPHIA' &&
  syncCalls[0].dataset === 'code_violations',
  'paginated invocation 1 executes code_violations'
);

assert(
  syncCalls[0].options &&
  syncCalls[0].options.confirmLive === true &&
  syncCalls[0].options.limit === 50,
  'scheduled live page is explicitly bounded to 50 records'
);

assert(
  page1.ok === true &&
  page1.status === 'In Progress',
  'non-terminal page remains In Progress'
);

assert(
  (
    properties.get(
      'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
    ) || ''
  ) === paginationFreshnessBefore,
  'non-terminal page cannot advance complete-workload freshness'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ) === '0',
  'non-terminal page does not advance feed index'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ) === '50',
  'non-terminal page persists cursor 50'
);

assert(
  JSON.parse(
    properties.get(
      'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
    ) || '[]'
  ).length === 0,
  'non-terminal page creates no completed-feed evidence'
);

const page2 =
  context.reosCountyProductionSchedulerRun();

assert(
  syncCalls.length === 2,
  'paginated invocation 2 executes exactly one additional page'
);

assert(
  syncCalls[1].dataset === 'code_violations',
  'paginated invocation 2 remains on code_violations'
);

assert(
  syncCalls[1].options &&
  syncCalls[1].options.confirmLive === true &&
  syncCalls[1].options.limit === 50 &&
  String(syncCalls[1].options.cursor || '') === '50',
  'paginated invocation 2 replays cursor 50 with limit 50'
);

assert(
  page2.ok === true &&
  page2.status === 'In Progress',
  'second non-terminal page remains In Progress'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ) === '100',
  'second non-terminal page persists cursor 100'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ) === '0',
  'second non-terminal page still does not advance feed index'
);

assert(
  JSON.parse(
    properties.get(
      'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
    ) || '[]'
  ).length === 0,
  'multiple non-terminal pages still create no completed-feed evidence'
);

const page3 =
  context.reosCountyProductionSchedulerRun();

assert(
  syncCalls.length === 3,
  'terminal pagination invocation executes exactly one page'
);

assert(
  syncCalls[2].dataset === 'code_violations' &&
  syncCalls[2].options &&
  String(syncCalls[2].options.cursor || '') === '100',
  'terminal page resumes code_violations from cursor 100'
);

assert(
  page3.ok === true &&
  page3.status === 'In Progress',
  'terminal first-feed page leaves overall cycle In Progress'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ) === '1',
  'terminal cursor advances to the next feed'
);

assert(
  !properties.get(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ),
  'terminal cursor clears current feed cursor'
);

const paginationCompletedResults = JSON.parse(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  ) || '[]'
);

assert(
  paginationCompletedResults.length === 1 &&
  paginationCompletedResults[0].dataset ===
    'code_violations' &&
  paginationCompletedResults[0].ok === true,
  'terminal cursor creates exactly one completed-feed result'
);

assert(
  (
    properties.get(
      'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
    ) || ''
  ) === paginationFreshnessBefore,
  'terminal first feed still cannot advance complete-cycle freshness'
);

/*
 * Reset active pagination checkpoint before exercising the existing
 * healthy/degraded-cycle contract. This is test isolation only.
 */
[
  'REOS_COUNTY_SCHEDULER_CYCLE_ID',
  'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT',
  'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
  'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
  'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
].forEach(key => properties.delete(key));

syncCalls = [];
failingDataset = '';
pageCursorResponses = {};
pageCursorResponseIndexes = {};

/* A healthy cycle must execute exactly one approved feed per invocation. */
syncCalls = [];
failingDataset = '';

const healthyCycleRuns = [];

for (let index = 0; index < requiredPairs.length; index += 1) {
  const beforeCount = syncCalls.length;

  const result =
    context.reosCountyProductionSchedulerRun();

  healthyCycleRuns.push(result);

  assert(
    syncCalls.length === beforeCount + 1,
    `bounded invocation ${index + 1} executes exactly one feed`
  );

  const [connectorId, dataset] = requiredPairs[index];
  const call = syncCalls[index];

  assert(
    call.connectorId === connectorId &&
    call.dataset === dataset,
    `bounded invocation ${index + 1} executes ${connectorId} / ${dataset}`
  );

  assert(
    call.options &&
    call.options.confirmLive === true,
    `bounded invocation ${index + 1} explicitly confirms live execution`
  );

  if (index < requiredPairs.length - 1) {
    assert(
      result.ok === true &&
      result.status === 'In Progress' &&
      !properties.get(
        'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
      ),
      `bounded invocation ${index + 1} preserves incomplete-cycle freshness`
    );
  }
}

const healthy =
  healthyCycleRuns[healthyCycleRuns.length - 1];

assert(
  healthy.ok === true &&
  healthy.status === 'Healthy' &&
  syncCalls.length === requiredPairs.length,
  'four bounded invocations complete exactly one healthy four-feed cycle'
);

const actualPairs = syncCalls.map(
  call => call.connectorId + '/' + call.dataset
);

for (const [connectorId, dataset] of requiredPairs) {
  assert(
    actualPairs.includes(connectorId + '/' + dataset),
    `completed cycle executes ${connectorId} / ${dataset}`
  );
}

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
  'only successful complete cycle advances freshness'
);

assert(
  !properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_ID'
  ) &&
  !properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT'
  ) &&
  !properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ) &&
  !properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  ),
  'successful complete cycle clears checkpoint state'
);

/*
 * A failed feed must remain visible while later bounded invocations
 * continue the same cycle. The degraded cycle must not advance
 * complete-workload freshness.
 */
syncCalls = [];
failingDataset = '';

const degradedFirst =
  context.reosCountyProductionSchedulerRun();

assert(
  syncCalls.length === 1 &&
  degradedFirst.ok === true &&
  degradedFirst.status === 'In Progress',
  'degraded-cycle setup executes first feed only'
);

failingDataset = 'vacant_properties';

const degradedFailure =
  context.reosCountyProductionSchedulerRun();

assert(
  syncCalls.length === 2 &&
  degradedFailure.ok === false &&
  degradedFailure.status === 'Degraded',
  'failed bounded feed marks active cycle degraded'
);

assert(
  syncCalls[1].dataset === 'vacant_properties',
  'configured bounded failure occurs on vacant_properties'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  ) === firstSuccessAt,
  'failed bounded feed does not advance complete-workload freshness'
);

/*
 * Scheduler-level failure authority is complete-cycle telemetry.
 * The active checkpoint carries the individual failed-feed evidence
 * until the remaining bounded invocations complete the workload.
 */
assert(
  !properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_FAILURE_AT'
  ),
  'active degraded cycle does not publish complete-cycle failure authority'
);

const activeDegradedResults = JSON.parse(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  )
);

assert(
  activeDegradedResults.length === 2 &&
  activeDegradedResults.some(
    result =>
      result.dataset === 'vacant_properties' &&
      result.ok === false
  ),
  'active degraded cycle preserves failed-feed checkpoint evidence'
);

failingDataset = '';

for (let index = 2; index < requiredPairs.length; index += 1) {
  const beforeCount = syncCalls.length;

  context.reosCountyProductionSchedulerRun();

  assert(
    syncCalls.length === beforeCount + 1,
    `degraded cycle continues with exactly one feed at invocation ${index + 1}`
  );
}

assert(
  syncCalls.length === requiredPairs.length,
  'one failed feed does not prevent later bounded feeds from being attempted'
);

assert(
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  ) === firstSuccessAt,
  'degraded complete cycle does not advance complete-workload freshness'
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
  'completed degraded cycle publishes scheduler failure telemetry'
);

const resultJson = JSON.parse(
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_RESULT_JSON'
  )
);

assert(
  resultJson.failed === 1 &&
  resultJson.succeeded === 3 &&
  resultJson.results.length === 4 &&
  resultJson.results.some(
    result =>
      result.dataset === 'vacant_properties' &&
      result.ok === false
  ),
  'failed feed remains visible in completed bounded-cycle telemetry'
);

assert(
  !properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_ID'
  ) &&
  !properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT'
  ) &&
  !properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ) &&
  !properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  ),
  'completed degraded cycle clears active checkpoint state'
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
