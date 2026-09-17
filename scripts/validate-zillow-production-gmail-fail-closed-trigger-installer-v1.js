#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const vm =
  require('node:vm');

const ROOT =
  path.resolve(__dirname, '..');

const IMPL =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'ZillowGmailFailClosedTriggerInstaller.js'
  );

const source =
  fs.readFileSync(
    IMPL,
    'utf8'
  );

const HANDLER =
  'reosZillowGmailScheduledSync';

const CADENCE = 15;
const LOCK_WAIT = 5000;

function trigger(handler) {
  return {
    getHandlerFunction() {
      return handler;
    }
  };
}

function harness(options) {
  const config =
    Object.assign(
      {
        lockAcquired: true,
        handlers: [],
        inventoryThrowsAt: 0,
        createThrows: false,
        createAdds: 1
      },
      options || {}
    );

  const state = {
    events: [],
    triggers:
      config.handlers.map(trigger),

    inventoryReads: 0,
    created: 0,
    deleted: 0,
    releaseCount: 0,

    newTriggerHandler: null,
    cadence: null
  };

  const lock = {
    tryLock(milliseconds) {
      state.events.push(
        'lock.tryLock:' +
        milliseconds
      );

      return config.lockAcquired;
    },

    releaseLock() {
      state.events.push(
        'lock.releaseLock'
      );

      state.releaseCount += 1;
    }
  };

  const ScriptApp = {
    getProjectTriggers() {
      state.events.push(
        'script.getProjectTriggers'
      );

      state.inventoryReads += 1;

      if (
        config.inventoryThrowsAt ===
        state.inventoryReads
      ) {
        throw new Error(
          'synthetic inventory failure'
        );
      }

      return state.triggers.slice();
    },

    newTrigger(handlerName) {
      state.events.push(
        'script.newTrigger:' +
        handlerName
      );

      state.newTriggerHandler =
        handlerName;

      return {
        timeBased() {
          state.events.push(
            'builder.timeBased'
          );

          return {
            everyMinutes(minutes) {
              state.events.push(
                'builder.everyMinutes:' +
                minutes
              );

              state.cadence =
                minutes;

              return {
                create() {
                  state.events.push(
                    'builder.create'
                  );

                  if (
                    config.createThrows
                  ) {
                    throw new Error(
                      'synthetic create failure'
                    );
                  }

                  state.created += 1;

                  for (
                    let i = 0;
                    i < config.createAdds;
                    i += 1
                  ) {
                    state.triggers.push(
                      trigger(
                        handlerName
                      )
                    );
                  }

                  return trigger(
                    handlerName
                  );
                }
              };
            }
          };
        }
      };
    },

    deleteTrigger() {
      state.deleted += 1;

      throw new Error(
        'deleteTrigger must never be called'
      );
    }
  };

  const context = {
    REOS: {},

    LockService: {
      getScriptLock() {
        state.events.push(
          'lock.getScriptLock'
        );

        return lock;
      }
    },

    ScriptApp: ScriptApp
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    source,
    context,
    {
      filename: IMPL
    }
  );

  return {
    state: state,

    api:
      context
        .REOS
        .ZillowGmailFailClosedTriggerInstaller,

    rpc:
      context
        .reosZillowGmailInstallTriggerFailClosed
  };
}

function assertLockBeforeInventory(state) {
  const lockIndex =
    state.events.indexOf(
      'lock.tryLock:' +
      LOCK_WAIT
    );

  const inventoryIndex =
    state.events.indexOf(
      'script.getProjectTriggers'
    );

  assert.ok(
    lockIndex >= 0,
    'script lock must be attempted'
  );

  assert.ok(
    inventoryIndex > lockIndex,
    'trigger inventory must be read under the acquired lock'
  );
}

let staticChecks = 0;
let behaviorCases = 0;

assert.match(
  source,
  /var HANDLER = 'reosZillowGmailScheduledSync';/
);
staticChecks += 1;

assert.match(
  source,
  /var CADENCE_MINUTES = 15;/
);
staticChecks += 1;

assert.match(
  source,
  /LockService\.getScriptLock\(\)/
);
staticChecks += 1;

assert.match(
  source,
  /lock\.tryLock\(\s*LOCK_WAIT_MILLISECONDS\s*\)/
);
staticChecks += 1;

assert.match(
  source,
  /ScriptApp\.getProjectTriggers\(\)/
);
staticChecks += 1;

assert.match(
  source,
  /ScriptApp\.newTrigger\(\s*HANDLER\s*\)/
);
staticChecks += 1;

assert.match(
  source,
  /\.everyMinutes\(\s*CADENCE_MINUTES\s*\)/
);
staticChecks += 1;

assert.doesNotMatch(
  source,
  /deleteTrigger\s*\(/
);
staticChecks += 1;

assert.doesNotMatch(
  source,
  /reosZillowGmailRemoveTriggers/
);
staticChecks += 1;

assert.doesNotMatch(
  source,
  /reosZillowGmailInstallDefaultTrigger/
);
staticChecks += 1;

assert.doesNotMatch(
  source,
  /GmailApp/
);
staticChecks += 1;

assert.doesNotMatch(
  source,
  /AcquisitionConnectorManager/
);
staticChecks += 1;

assert.equal(
  (
    source.match(
      /ScriptApp\.newTrigger\s*\(/g
    ) || []
  ).length,
  1
);
staticChecks += 1;

/*
 * CASE 1:
 * Lock contention -> no inventory read and no mutation.
 */
{
  const { state, api } =
    harness({
      lockAcquired: false
    });

  const result =
    api.install();

  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.status,
    'LOCK_BUSY'
  );

  assert.equal(
    state.inventoryReads,
    0
  );

  assert.equal(
    state.created,
    0
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    0
  );

  behaviorCases += 1;
}

/*
 * CASE 2:
 * Exactly one handler already exists -> strict no-op.
 */
{
  const { state, api } =
    harness({
      handlers: [
        'unrelatedHandler',
        HANDLER
      ]
    });

  const before =
    state.triggers.length;

  const result =
    api.install();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.status,
    'ALREADY_PRESENT'
  );

  assert.equal(
    result.existingTriggerCount,
    1
  );

  assert.equal(
    result.createdTriggerCount,
    0
  );

  assert.equal(
    result.triggerMutationExecuted,
    false
  );

  assert.equal(
    state.triggers.length,
    before
  );

  assert.equal(
    state.created,
    0
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    1
  );

  assertLockBeforeInventory(
    state
  );

  behaviorCases += 1;
}

/*
 * CASE 3:
 * Duplicate handlers -> fail closed, no cleanup mutation.
 */
{
  const { state, api } =
    harness({
      handlers: [
        HANDLER,
        HANDLER
      ]
    });

  const before =
    state.triggers.length;

  const result =
    api.install();

  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.status,
    'DUPLICATE_PRESENT'
  );

  assert.equal(
    result.existingTriggerCount,
    2
  );

  assert.equal(
    result.triggerMutationExecuted,
    false
  );

  assert.equal(
    state.triggers.length,
    before
  );

  assert.equal(
    state.created,
    0
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    1
  );

  assertLockBeforeInventory(
    state
  );

  behaviorCases += 1;
}

/*
 * CASE 4:
 * Zero matching handlers -> create exactly one at 15 minutes,
 * re-read under lock, leave unrelated trigger untouched.
 */
{
  const { state, rpc } =
    harness({
      handlers: [
        'unrelatedHandler'
      ]
    });

  assert.equal(
    typeof rpc,
    'function'
  );

  const unrelatedBefore =
    state.triggers.filter(
      item =>
        item.getHandlerFunction() ===
        'unrelatedHandler'
    ).length;

  const result =
    rpc();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.status,
    'CREATED'
  );

  assert.equal(
    result.handler,
    HANDLER
  );

  assert.equal(
    result.cadenceMinutes,
    CADENCE
  );

  assert.equal(
    result.createdTriggerCount,
    1
  );

  assert.equal(
    result.triggerMutationExecuted,
    true
  );

  assert.equal(
    result.triggerDeleteExecuted,
    false
  );

  assert.equal(
    state.newTriggerHandler,
    HANDLER
  );

  assert.equal(
    state.cadence,
    CADENCE
  );

  assert.equal(
    state.created,
    1
  );

  assert.equal(
    state.inventoryReads,
    2
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    1
  );

  assert.equal(
    state.triggers.filter(
      item =>
        item.getHandlerFunction() ===
        HANDLER
    ).length,
    1
  );

  assert.equal(
    state.triggers.filter(
      item =>
        item.getHandlerFunction() ===
        'unrelatedHandler'
    ).length,
    unrelatedBefore
  );

  assertLockBeforeInventory(
    state
  );

  behaviorCases += 1;
}

/*
 * CASE 5:
 * Inventory read failure -> no create, lock released.
 */
{
  const { state, api } =
    harness({
      inventoryThrowsAt: 1
    });

  assert.throws(
    () => api.install(),
    /synthetic inventory failure/
  );

  assert.equal(
    state.created,
    0
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    1
  );

  behaviorCases += 1;
}

/*
 * CASE 6:
 * Create failure propagates and never attempts cleanup.
 */
{
  const { state, api } =
    harness({
      createThrows: true
    });

  assert.throws(
    () => api.install(),
    /synthetic create failure/
  );

  assert.equal(
    state.created,
    0
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    1
  );

  assertLockBeforeInventory(
    state
  );

  behaviorCases += 1;
}

/*
 * CASE 7:
 * Synthetic post-create duplicate anomaly -> no delete/reconciliation.
 */
{
  const { state, api } =
    harness({
      createAdds: 2
    });

  assert.throws(
    () => api.install(),
    /Post-create Zillow trigger invariant failed; reconcile live trigger state before any retry\. observed=2/
  );

  assert.equal(
    state.created,
    1
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    1
  );

  behaviorCases += 1;
}

/*
 * CASE 8:
 * Unreadable live inventory -> fail closed before mutation.
 */
{
  const { state, api } =
    harness();

  state.triggers.push({});

  assert.throws(
    () => api.install(),
    /Project trigger inventory contains an unreadable trigger/
  );

  assert.equal(
    state.created,
    0
  );

  assert.equal(
    state.deleted,
    0
  );

  assert.equal(
    state.releaseCount,
    1
  );

  behaviorCases += 1;
}

console.log(
  'ZILLOW_GMAIL_FAIL_CLOSED_TRIGGER_INSTALLER_VALIDATED=true'
);

console.log(
  'TARGET_HANDLER=' +
  HANDLER
);

console.log(
  'CADENCE_MINUTES=' +
  CADENCE
);

console.log(
  'LOCK_WAIT_MILLISECONDS=' +
  LOCK_WAIT
);

console.log(
  'STATIC_CHECKS=' +
  staticChecks
);

console.log(
  'BEHAVIOR_CASES=' +
  behaviorCases
);

console.log(
  'DELETE_TRIGGER_SURFACE_PRESENT=false'
);

console.log(
  'REAL_APPS_SCRIPT_EXECUTION=false'
);

console.log(
  'PRODUCTION_TRIGGER_MUTATION_EXECUTED=false'
);
