#!/usr/bin/env node

'use strict';

const fs = require('fs');
const assert = require('assert');

console.log(
  '=== COUNTY PARTIAL-PAGE CHECKPOINT CERTIFICATION ==='
);

const path =
  'build/apps-script-brand/CountyProductionScheduler.js';

const source = fs.readFileSync(path, 'utf8');

/*
 * V18 checkpoint-integrity contract.
 *
 * A source page is not checkpoint-safe merely because the adapter
 * returned a nextCursor.
 *
 * If CountyRuntimeBridge.sync() reports record-level failures, the
 * scheduler must not persist the returned nextCursor as completed
 * page authority.
 *
 * The existing page cursor must remain retry authority so that the
 * same source page is replayed. Successful records on that replay
 * are expected to be idempotently updated by CountyConnectorSDK,
 * while previously failed records receive another persistence
 * attempt.
 */

const syncStart = source.indexOf(
  'REOS.CountyRuntimeBridge.sync('
);

assert.notStrictEqual(
  syncStart,
  -1,
  'scheduler invokes CountyRuntimeBridge.sync'
);

const checkpointStart = source.indexOf(
  'if (nextCursor)',
  syncStart
);

assert.notStrictEqual(
  checkpointStart,
  -1,
  'scheduler contains non-terminal cursor checkpoint handling'
);

const checkpointSection = source.slice(
  syncStart,
  checkpointStart + 900
);

/*
 * RED on V17:
 *
 * Before accepting nextCursor, scheduler authority must inspect the
 * runtime result for record-level failure evidence.
 */
const checksFailedStats =
  /result\s*&&\s*result\.stats\s*&&[\s\S]{0,300}result\.stats\.failed/.test(
    checkpointSection
  ) ||
  /stats\.failed/.test(checkpointSection);

assert(
  checksFailedStats,
  'scheduler checks stats.failed before advancing page cursor'
);

/*
 * A partial page must be represented as a failure/degraded outcome,
 * not successful In Progress checkpoint advancement.
 */
const hasPartialPageFailurePolicy =
  /partial|record.*fail|page.*fail|stats\.failed/i.test(
    checkpointSection
  );

assert(
  hasPartialPageFailurePolicy,
  'scheduler defines partial-page failure policy'
);

/*
 * The scheduler must retain/reuse the incoming page cursor when
 * persistence is incomplete. It must not write nextCursor first and
 * discover the failure afterward.
 */
const setNextCursorIndex = checkpointSection.indexOf(
  "props.setProperty(\n            CURRENT_FEED_CURSOR,\n            nextCursor"
);

const failedCheckIndex = checkpointSection.search(
  /stats\.failed/
);

assert(
  failedCheckIndex !== -1 &&
    (
      setNextCursorIndex === -1 ||
      failedCheckIndex < setNextCursorIndex
    ),
  'partial-page failure is evaluated before nextCursor is persisted'
);

console.log(
  'PASS: partial pages cannot advance durable county cursor'
);

console.log();
console.log(
  'County partial-page checkpoint certification PASSED.'
);

/*
 * Behavioral certification.
 *
 * Execute the real CountyProductionScheduler in an isolated VM.
 *
 * Starting authority:
 *   feedIndex = 1
 *   CURRENT_FEED_CURSOR = 100
 *
 * First execution:
 *   runtime reports one failed record and nextCursor 150
 *   scheduler must remain Degraded at cursor 100
 *
 * Retry:
 *   runtime succeeds for the same cursor 100
 *   scheduler may then checkpoint cursor 150
 */

const vm = require('vm');

function createBehaviorHarness() {
  const state = {
    REOS_COUNTY_SCHEDULER_CYCLE_ID:
      'COUNTY-BEHAVIOR-TEST',
    REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT:
      '2026-08-21T00:00:00.000Z',
    REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX:
      '1',
    REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR:
      '100',
    REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON:
      JSON.stringify([
        {
          connectorId: 'PA-PHILADELPHIA',
          dataset: 'tax_delinquent',
          ok: true,
          result: {
            ok: true
          }
        }
      ])
  };

  const syncCalls = [];
  let syncAttempt = 0;

  const props = {
    getProperty: function (key) {
      return Object.prototype.hasOwnProperty.call(
        state,
        key
      )
        ? state[key]
        : null;
    },

    setProperty: function (key, value) {
      state[key] = String(value);
      return props;
    },

    deleteProperty: function (key) {
      delete state[key];
      return props;
    }
  };

  const trigger = {
    getHandlerFunction: function () {
      return 'reosCountyProductionSchedulerRun';
    },
    getEventType: function () {
      return 'CLOCK';
    },
    getTriggerSource: function () {
      return 'CLOCK';
    },
    getUniqueId: function () {
      return 'BEHAVIOR-TRIGGER';
    }
  };

  const lock = {
    tryLock: function () {
      return true;
    },
    releaseLock: function () {}
  };

  const sandbox = {
    console: console,
    Date: Date,
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Math: Math,
    JSON: JSON,
    RegExp: RegExp,
    Error: Error,
    isNaN: isNaN,
    isFinite: isFinite,

    PropertiesService: {
      getScriptProperties: function () {
        return props;
      }
    },

    LockService: {
      getScriptLock: function () {
        return lock;
      }
    },

    ScriptApp: {
      getProjectTriggers: function () {
        return [trigger];
      }
    },

    REOS: {
      Security: {
        requireAdmin: function () {}
      },

      CountyRuntimeBridge: {
        sync: function (
          connectorId,
          dataset,
          options
        ) {
          syncCalls.push({
            connectorId: connectorId,
            dataset: dataset,
            cursor: String(options.cursor || '')
          });

          syncAttempt += 1;

          if (syncAttempt === 1) {
            return {
              ok: true,
              connectorId: connectorId,
              dataset: dataset,
              nextCursor: '150',
              stats: {
                fetched: 50,
                valid: 50,
                inserted: 41,
                updated: 8,
                skipped: 0,
                failed: 1
              },
              recordErrors: [
                {
                  index: 11,
                  sourceRecordId: 62,
                  address: '180 Sparks St',
                  error: 'simulated persistence failure'
                }
              ]
            };
          }

          return {
            ok: true,
            connectorId: connectorId,
            dataset: dataset,
            nextCursor: '150',
            stats: {
              fetched: 50,
              valid: 50,
              inserted: 0,
              updated: 50,
              skipped: 0,
              failed: 0
            },
            recordErrors: []
          };
        }
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  return {
    scheduler:
      sandbox.REOS.CountyProductionScheduler,
    state: state,
    syncCalls: syncCalls
  };
}

const behavior = createBehaviorHarness();

const first = behavior.scheduler.run();

assert.strictEqual(
  first.ok,
  false,
  'partial page returns non-success scheduler result'
);

assert.strictEqual(
  first.status,
  'Degraded',
  'partial page is represented as Degraded'
);

assert.strictEqual(
  first.cursor,
  '100',
  'partial page reports incoming cursor as retry authority'
);

assert.strictEqual(
  behavior.state[
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ],
  '100',
  'partial page preserves durable cursor 100'
);

assert.strictEqual(
  behavior.state[
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ],
  '1',
  'partial page does not advance feed index'
);

assert.strictEqual(
  behavior.syncCalls[0].cursor,
  '100',
  'first execution reads source page at cursor 100'
);

console.log(
  'PASS: failed page preserves durable cursor 100'
);

const second = behavior.scheduler.run();

assert.strictEqual(
  behavior.syncCalls.length,
  2,
  'retry executes exactly one additional runtime sync'
);

assert.strictEqual(
  behavior.syncCalls[1].cursor,
  '100',
  'retry replays the same source page'
);

assert.strictEqual(
  second.ok,
  true,
  'successful retry returns success'
);

assert.strictEqual(
  second.status,
  'In Progress',
  'successful non-terminal retry remains In Progress'
);

assert.strictEqual(
  second.cursor,
  '150',
  'successful retry advances returned cursor to 150'
);

assert.strictEqual(
  behavior.state[
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ],
  '150',
  'successful retry advances durable cursor to 150'
);

assert.strictEqual(
  behavior.state[
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ],
  '1',
  'non-terminal successful retry remains on same feed'
);

console.log(
  'PASS: retry replays cursor 100 and advances to 150 only after complete persistence'
);

console.log();
console.log(
  'County partial-page behavioral certification PASSED.'
);
