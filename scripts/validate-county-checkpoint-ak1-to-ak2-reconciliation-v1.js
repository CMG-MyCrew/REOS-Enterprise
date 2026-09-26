#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const FILE =
  'build/apps-script-brand/CountyCheckpointAk1ToAk2Reconciliation.js';

const OLD_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const NEW_CURSOR =
  'AK2|PHL-CODE-HIGH-DURABLE-20250901-VIOLATIONNUMBER-V1|1782545296000|VI-2026-047721';

const CYCLE_ID =
  'COUNTY-20260902222607805';

const STARTED_AT =
  '2026-09-02T22:26:07.805Z';

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

console.log(
  '=== COUNTY CHECKPOINT AK1 TO AK2 RECONCILIATION V1 ==='
);

/*
 * Static containment.
 */
assert.equal(
  /CountyRuntimeBridge\s*\./.test(source),
  false,
  'reconciler must contain no connector-execution authority'
);

assert.equal(
  /REOS\.Database\s*\./.test(source),
  false,
  'reconciler must contain no database mutation authority'
);

assert.equal(
  /newTrigger\s*\(/.test(source),
  false,
  'reconciler must contain no scheduler-install authority'
);

assert.equal(
  /deleteTrigger\s*\(/.test(source),
  false,
  'reconciler must contain no scheduler-removal authority'
);

assert.equal(
  /deleteProperty\s*\(/.test(source),
  false,
  'reconciler must contain no checkpoint-retirement authority'
);

assert.equal(
  /UrlFetchApp\s*\./.test(source),
  false,
  'reconciler must contain no network authority'
);

/*
 * Reject positive or executable offer/MAO authority without treating
 * explicit fail-closed denial metadata as authority.
 *
 * The production module intentionally returns
 * automaticOfferAuthorityGranted:false. A broad /Offer/ test would
 * incorrectly reject that safety declaration.
 */
const prohibitedOfferAuthorityPatterns = [
  /REOS\s*\.\s*(?:Offer|DraftOffer|MAO)\b/,
  /\b(?:create|generate|submit|send|draft|calculate|compute)(?:Offer|MAO)\b/i,
  /\bautomaticOfferAuthorityGranted\s*:\s*true\b/,
  /\bofferAuthorityGranted\s*:\s*true\b/,
  /\bmaoAuthorityGranted\s*:\s*true\b/
];

prohibitedOfferAuthorityPatterns.forEach(
  pattern => {
    assert.equal(
      pattern.test(source),
      false,
      'reconciler must contain no positive offer or MAO authority: ' +
        String(pattern)
    );
  }
);

assert.equal(
  /automaticOfferAuthorityGranted\s*:\s*false/.test(source),
  true,
  'reconciler must explicitly deny automatic-offer authority'
);

const propertyWrites =
  source.match(
    /props\.setProperty\s*\(/g
  ) || [];

assert.equal(
  propertyWrites.length,
  1,
  'reconciler must contain exactly one Script Property write'
);

assert.ok(
  source.includes(
    "props.setProperty(\n        CURRENT_FEED_CURSOR,\n        RECONCILED_AK2_CURSOR"
  ),
  'the sole write must target CURRENT_FEED_CURSOR'
);

assert.ok(
  source.includes(
    "const WRITER_ID =\n    'COUNTY_CHECKPOINT_RECOVERY';"
  ),
  'reconciler must reuse the protected checkpoint-recovery writer identity'
);

assert.ok(
  source.includes(OLD_CURSOR),
  'exact historical AK1 authority missing'
);

assert.ok(
  source.includes(NEW_CURSOR),
  'exact durable AK2 authority missing'
);

console.log(
  'PASS: static authority is exactly one checkpoint cursor write.'
);


/*
 * Behavioral harness.
 */
function makeHarness() {
  const values = new Map([
    [
      'REOS_COUNTY_SCHEDULER_CYCLE_ID',
      CYCLE_ID
    ],
    [
      'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT',
      STARTED_AT
    ],
    [
      'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
      '0'
    ],
    [
      'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
      OLD_CURSOR
    ],
    [
      'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON',
      '[]'
    ],
    [
      'UNRELATED_PROPERTY',
      'PRESERVE-ME'
    ]
  ]);

  let adminCalls = 0;
  let triggerCount = 0;
  let lockAvailable = true;
  let lockHeld = false;
  let setTriggerAfterLock = false;
  let leaseAllowed = true;
  let leaseGuardCalls = 0;
  let setCalls = [];

  const props = {
    getProperty(key) {
      return values.has(key)
        ? values.get(key)
        : null;
    },

    setProperty(key, value) {
      setCalls.push([
        key,
        String(value)
      ]);

      values.set(
        key,
        String(value)
      );

      return props;
    }
  };

  const lock = {
    tryLock() {
      if (!lockAvailable) {
        return false;
      }

      lockHeld = true;

      if (setTriggerAfterLock) {
        triggerCount = 1;
      }

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
      },

      CountyMutationExclusionLease: {
        assertWriterAllowed(options) {
          leaseGuardCalls++;

          assert.equal(
            lockHeld,
            true,
            'lease writer guard must execute while ScriptLock is held'
          );

          assert.deepEqual(
            Object.keys(options),
            ['writerId']
          );

          assert.equal(
            options.writerId,
            'COUNTY_CHECKPOINT_RECOVERY'
          );

          if (!leaseAllowed) {
            throw new Error(
              'Synthetic active lease.'
            );
          }

          return {
            ok: true,
            allowed: true,
            writerId:
              'COUNTY_CHECKPOINT_RECOVERY',
            blockedByLease: false
          };
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
          {
            length:
              triggerCount
          },
          function () {
            return {
              getHandlerFunction() {
                return (
                  'reosCountyProductionSchedulerRun'
                );
              }
            };
          }
        );
      }
    },

    LockService: {
      getScriptLock() {
        return lock;
      }
    }
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    source,
    context,
    {
      filename: FILE
    }
  );

  function resetExactPrestate() {
    values.set(
      'REOS_COUNTY_SCHEDULER_CYCLE_ID',
      CYCLE_ID
    );

    values.set(
      'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT',
      STARTED_AT
    );

    values.set(
      'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
      '0'
    );

    values.set(
      'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
      OLD_CURSOR
    );

    values.set(
      'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON',
      '[]'
    );

    values.set(
      'UNRELATED_PROPERTY',
      'PRESERVE-ME'
    );

    triggerCount = 0;
    lockAvailable = true;
    lockHeld = false;
    setTriggerAfterLock = false;
    leaseAllowed = true;
    setCalls = [];
  }

  return {
    context,
    values,

    inspect() {
      return context
        .reosCountyCheckpointAk1ToAk2ReconciliationInspect();
    },

    execute(value) {
      return context
        .reosCountyCheckpointAk1ToAk2ReconciliationExecute(
          value
        );
    },

    resetExactPrestate,

    setTriggerCount(value) {
      triggerCount = value;
    },

    setLockAvailable(value) {
      lockAvailable = value;
    },

    setTriggerAfterLock(value) {
      setTriggerAfterLock = value;
    },

    setLeaseAllowed(value) {
      leaseAllowed = value;
    },

    get setCalls() {
      return setCalls.slice();
    },

    get leaseGuardCalls() {
      return leaseGuardCalls;
    },

    get adminCalls() {
      return adminCalls;
    }
  };
}


const h =
  makeHarness();


/*
 * Inspection is read-only.
 */
const inspection =
  h.inspect();

assert.equal(
  inspection.ok,
  true
);

assert.equal(
  inspection.readOnly,
  true
);

assert.equal(
  inspection.eligible,
  true
);

assert.equal(
  inspection.reconciliationAuthorityGranted,
  false
);

assert.equal(
  inspection.boundary.expectedAk1Cursor,
  OLD_CURSOR
);

assert.equal(
  inspection.boundary.reconciledAk2Cursor,
  NEW_CURSOR
);

assert.equal(
  h.setCalls.length,
  0
);

console.log(
  'PASS: inspect is read-only and exact-boundary aware.'
);


/*
 * Explicit confirmation.
 */
assert.throws(
  () => h.execute(false),
  /confirmation is required/
);

assert.equal(
  h.setCalls.length,
  0
);

console.log(
  'PASS: missing confirmation fails before mutation.'
);


/*
 * Scheduler must already be frozen.
 */
h.setTriggerCount(1);

assert.throws(
  () => h.execute(true),
  /requires zero managed scheduler triggers/
);

assert.equal(
  h.setCalls.length,
  0
);

console.log(
  'PASS: live scheduler trigger blocks before mutation.'
);

h.resetExactPrestate();


/*
 * ScriptLock contention.
 */
h.setLockAvailable(false);

assert.throws(
  () => h.execute(true),
  /lock contention/
);

assert.equal(
  h.setCalls.length,
  0
);

console.log(
  'PASS: ScriptLock contention fails before mutation.'
);

h.resetExactPrestate();


/*
 * Scheduler authority is rechecked after lock acquisition.
 */
h.setTriggerAfterLock(true);

assert.throws(
  () => h.execute(true),
  /scheduler authority changed under lock/
);

assert.equal(
  h.setCalls.length,
  0
);

console.log(
  'PASS: scheduler drift under lock fails before mutation.'
);

h.resetExactPrestate();


/*
 * Lease denial occurs while the native ScriptLock is held.
 */
h.setLeaseAllowed(false);

assert.throws(
  () => h.execute(true),
  /Synthetic active lease/
);

assert.equal(
  h.setCalls.length,
  0
);

console.log(
  'PASS: mutation-exclusion lease denial fails before mutation.'
);

h.resetExactPrestate();


/*
 * Exact checkpoint drift matrix.
 */
const driftCases = [
  [
    'REOS_COUNTY_SCHEDULER_CYCLE_ID',
    'COUNTY-WRONG',
    /cycle authority mismatch/
  ],
  [
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT',
    '2026-09-02T22:26:07.806Z',
    /start authority mismatch/
  ],
  [
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
    '1',
    /feed-index authority mismatch/
  ],
  [
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
    'AK1|WRONG|1782545296000|2281',
    /cursor authority mismatch/
  ],
  [
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON',
    '[{"unexpected":true}]',
    /result authority mismatch/
  ]
];

driftCases.forEach(
  function (entry) {
    h.resetExactPrestate();

    h.values.set(
      entry[0],
      entry[1]
    );

    assert.throws(
      () => h.execute(true),
      entry[2]
    );

    assert.equal(
      h.setCalls.length,
      0
    );
  }
);

console.log(
  'PASS: every certified checkpoint prestate field fails closed on drift.'
);

h.resetExactPrestate();


/*
 * Exact successful transition.
 */
const before = {
  cycleId:
    h.values.get(
      'REOS_COUNTY_SCHEDULER_CYCLE_ID'
    ),

  startedAt:
    h.values.get(
      'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT'
    ),

  nextFeedIndex:
    h.values.get(
      'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
    ),

  resultsJson:
    h.values.get(
      'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
    ),

  unrelated:
    h.values.get(
      'UNRELATED_PROPERTY'
    )
};

const result =
  h.execute(true);

assert.equal(
  result.ok,
  true
);

assert.equal(
  result.reconciled,
  true
);

assert.equal(
  result.checkpointMutationExecuted,
  true
);

assert.equal(
  result.checkpointPropertyWriteCount,
  1
);

assert.equal(
  result.previousCursor,
  OLD_CURSOR
);

assert.equal(
  result.currentFeedCursor,
  NEW_CURSOR
);

assert.deepEqual(
  h.setCalls,
  [
    [
      'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
      NEW_CURSOR
    ]
  ]
);

assert.equal(
  h.values.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_ID'
  ),
  before.cycleId
);

assert.equal(
  h.values.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT'
  ),
  before.startedAt
);

assert.equal(
  h.values.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ),
  before.nextFeedIndex
);

assert.equal(
  h.values.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  ),
  before.resultsJson
);

assert.equal(
  h.values.get(
    'UNRELATED_PROPERTY'
  ),
  before.unrelated
);

assert.equal(
  h.values.get(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ),
  NEW_CURSOR
);

assert.ok(
  h.leaseGuardCalls >= 1
);

console.log(
  'PASS: successful reconciliation performs exactly one AK1→AK2 cursor write.'
);

console.log(
  'PASS: cycle ID, start, feed index, results, and unrelated properties are byte-preserved.'
);


/*
 * Replay is prohibited because exact AK1 prestate is consumed.
 */
const writesAfterSuccess =
  h.setCalls.length;

assert.throws(
  () => h.execute(true),
  /cursor authority mismatch/
);

assert.equal(
  h.setCalls.length,
  writesAfterSuccess
);

console.log(
  'PASS: successful transition cannot be replayed automatically.'
);

console.log('');
console.log(
  'COUNTY_CHECKPOINT_AK1_TO_AK2_RECONCILIATION_V1_PASSED=true'
);
