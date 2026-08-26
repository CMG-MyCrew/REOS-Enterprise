#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log(
  '=== COUNTY MANUAL CERTIFICATION BEHAVIOR ==='
);

const source = fs.readFileSync(
  'build/apps-script-brand/CountyProductionScheduler.js',
  'utf8'
);

function makeHarness(options) {
  options = options || {};

  const state = {
    REOS_COUNTY_SCHEDULER_CYCLE_ID:
      'COUNTY-BEHAVIOR-MANUAL',
    REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT:
      '2026-08-26T00:00:00.000Z',
    REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX:
      '0',
    REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR:
      '1250',
    REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON:
      '[]'
  };

  const syncCalls = [];
  let adminCalls = 0;
  let lockReleases = 0;

  const props = {
    getProperty(key) {
      return Object.prototype.hasOwnProperty.call(
        state,
        key
      )
        ? state[key]
        : null;
    },

    setProperty(key, value) {
      state[key] = String(value);
      return props;
    },

    deleteProperty(key) {
      delete state[key];
      return props;
    }
  };

  function trigger_(id) {
    return {
      getHandlerFunction() {
        return 'reosCountyProductionSchedulerRun';
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

  const triggerCount =
    Number(options.triggerCount || 0);

  const triggers = [];

  for (let i = 0; i < triggerCount; i++) {
    triggers.push(
      trigger_('TRIGGER-' + (i + 1))
    );
  }

  const lock = {
    tryLock() {
      return true;
    },

    hasLock() {
      return true;
    },

    releaseLock() {
      lockReleases++;
    }
  };

  const sandbox = {
    console,
    Date,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    JSON,
    RegExp,
    Error,
    isNaN,
    isFinite,

    PropertiesService: {
      getScriptProperties() {
        return props;
      }
    },

    LockService: {
      getScriptLock() {
        return lock;
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return triggers.slice();
      },

      deleteTrigger() {},

      newTrigger() {
        throw new Error(
          'newTrigger must not be called by behavior test'
        );
      }
    },

    REOS: {
      Security: {
        requireAdmin() {
          adminCalls++;
        }
      },

      CountyRuntimeBridge: {
        sync(connectorId, dataset, syncOptions) {
          syncCalls.push({
            connectorId,
            dataset,
            confirmLive: syncOptions.confirmLive,
            limit: syncOptions.limit,
            cursor: String(
              syncOptions.cursor || ''
            )
          });

          return {
            ok: true,
            connectorId,
            dataset,
            mode: 'LIVE',
            runId: 'CCR-BEHAVIOR',
            nextCursor: '1300',
            stats: {
              fetched: 50,
              valid: 50,
              skipped: 0,
              failed: 0,
              inserted: 25,
              updated: 25
            },
            validationErrors: [],
            recordErrors: []
          };
        }
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  return {
    sandbox,
    state,
    syncCalls,
    getAdminCalls() {
      return adminCalls;
    },
    getLockReleases() {
      return lockReleases;
    }
  };
}

function checkpoint(h) {
  return h.sandbox
    .reosCountyProductionSchedulerCheckpoint();
}

/*
 * 1. Scheduled execution still requires exactly one trigger.
 */
{
  const h = makeHarness({
    triggerCount: 0
  });

  const before = checkpoint(h);

  const result =
    h.sandbox.reosCountyProductionSchedulerRun();

  const after = checkpoint(h);

  assert.strictEqual(
    result.ok,
    false,
    'scheduled zero-trigger run fails closed'
  );

  assert.strictEqual(
    result.status,
    'Unhealthy'
  );

  assert.strictEqual(
    h.syncCalls.length,
    0,
    'scheduled zero-trigger run performs no sync'
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(after)),
    JSON.parse(JSON.stringify(before)),
    'scheduled authority failure preserves checkpoint'
  );

  console.log(
    'PASS: scheduled execution rejects triggerCount=0'
  );
}

/*
 * 2. Manual execution requires scheduler frozen at zero triggers.
 */
{
  const h = makeHarness({
    triggerCount: 1
  });

  const result =
    h.sandbox
      .reosCountyProductionSchedulerRunManualCertification(
        'COUNTY-BEHAVIOR-MANUAL',
        0,
        '1250'
      );

  assert.strictEqual(
    result.ok,
    false
  );

  assert.strictEqual(
    result.status,
    'Unhealthy'
  );

  assert.strictEqual(
    h.syncCalls.length,
    0,
    'manual run with live trigger performs no sync'
  );

  console.log(
    'PASS: manual execution rejects triggerCount=1'
  );
}

/*
 * 3. Wrong authority must fail before CountyRuntimeBridge.sync().
 */
[
  {
    name: 'cycle',
    args: [
      'WRONG-CYCLE',
      0,
      '1250'
    ]
  },
  {
    name: 'feed',
    args: [
      'COUNTY-BEHAVIOR-MANUAL',
      1,
      '1250'
    ]
  },
  {
    name: 'cursor',
    args: [
      'COUNTY-BEHAVIOR-MANUAL',
      0,
      '1200'
    ]
  }
].forEach(function (test) {
  const h = makeHarness({
    triggerCount: 0
  });

  const before = checkpoint(h);

  const result =
    h.sandbox
      .reosCountyProductionSchedulerRunManualCertification(
        test.args[0],
        test.args[1],
        test.args[2]
      );

  const after = checkpoint(h);

  assert.strictEqual(
    result.ok,
    false,
    test.name + ' authority mismatch fails'
  );

  assert.strictEqual(
    result.status,
    'Unhealthy'
  );

  assert.strictEqual(
    h.syncCalls.length,
    0,
    test.name + ' mismatch performs no sync'
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(after)),
    JSON.parse(JSON.stringify(before)),
    test.name + ' mismatch preserves checkpoint'
  );

  console.log(
    'PASS: wrong ' +
      test.name +
      ' authority cannot invoke sync'
  );
});

/*
 * 4. Exact frozen authority executes exactly one bounded page.
 */
{
  const h = makeHarness({
    triggerCount: 0
  });

  const result =
    h.sandbox
      .reosCountyProductionSchedulerRunManualCertification(
        'COUNTY-BEHAVIOR-MANUAL',
        0,
        '1250'
      );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.status,
    'In Progress'
  );

  assert.strictEqual(
    result.feedIndex,
    0
  );

  assert.strictEqual(
    result.completedFeeds,
    0
  );

  assert.strictEqual(
    String(result.cursor),
    '1300'
  );

  assert.strictEqual(
    h.syncCalls.length,
    1,
    'manual certification executes one sync only'
  );

  assert.deepStrictEqual(
    h.syncCalls[0],
    {
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'code_violations',
      confirmLive: true,
      limit: 50,
      cursor: '1250'
    }
  );

  const after = checkpoint(h);

  assert.strictEqual(
    String(after.currentFeedCursor),
    '1300'
  );

  assert.strictEqual(
    after.nextFeedIndex,
    0
  );

  assert.strictEqual(
    after.completedFeeds,
    0
  );

  assert.strictEqual(
    h.getAdminCalls(),
    1,
    'manual certification requires admin'
  );

  assert.strictEqual(
    h.getLockReleases(),
    1,
    'manual certification releases project lock'
  );

  console.log(
    'PASS: exact frozen authority executes exactly one page'
  );
}

console.log();
console.log(
  'County manual certification behavioral contract PASSED.'
);
