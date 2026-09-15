#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const SOURCE =
  'build/apps-script-brand/CountyCheckpointRecovery.js';

const WRITER_ID =
  'COUNTY_CHECKPOINT_RECOVERY';

const source =
  fs.readFileSync(SOURCE, 'utf8');

const KEYS = {
  cycleId:
    'REOS_COUNTY_SCHEDULER_CYCLE_ID',
  startedAt:
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT',
  nextFeedIndex:
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
  cursor:
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
  results:
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
};

const EXPECTED_CYCLE =
  'COUNTY-20260902222607805';

const EXPECTED_STARTED =
  '2026-09-02T22:26:07.805Z';

const RECOVERY_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1764720000000|586498';

let cases = 0;

function test(name, work) {
  work();
  cases++;
  console.log('PASS: ' + name);
}

function corruptProperties() {
  return {
    [KEYS.cycleId]:
      EXPECTED_CYCLE,
    [KEYS.startedAt]:
      EXPECTED_STARTED,
    [KEYS.nextFeedIndex]:
      '1',
    [KEYS.cursor]:
      '',
    [KEYS.results]:
      JSON.stringify([
        {
          connectorId:
            'PA-PHILADELPHIA',
          dataset:
            'code_violations',
          ok: false,
          error:
            'ArcGIS API error: Invalid query parameters'
        }
      ])
  };
}

function makeRuntime(options) {
  options = options || {};

  const store =
    new Map(
      Object.entries(
        options.properties ||
        corruptProperties()
      )
    );

  const effects = {
    adminCalls: 0,
    lockRequests: 0,
    lockAttempts: 0,
    lockReleases: 0,
    guardCalls: 0,
    guardHeld: [],
    guardOptions: [],
    propertySets: [],
    triggerReads: 0,
    sequence: []
  };

  let held = false;

  const lock = {
    tryLock(waitMs) {
      effects.lockAttempts++;

      assert.equal(
        waitMs,
        5000
      );

      if (options.lockAcquired === false) {
        return false;
      }

      held = true;
      effects.sequence.push('lock-acquired');
      return true;
    },

    hasLock() {
      return held;
    },

    releaseLock() {
      assert.equal(
        held,
        true,
        'release requires held ScriptLock'
      );

      held = false;
      effects.lockReleases++;
      effects.sequence.push('lock-released');
    }
  };

  const props = {
    getProperty(key) {
      return store.has(key)
        ? store.get(key)
        : null;
    },

    setProperty(key, value) {
      effects.propertySets.push([
        key,
        String(value)
      ]);

      effects.sequence.push(
        'set:' + key
      );

      if (
        options.sabotageSetKey === key
      ) {
        store.set(
          key,
          'SABOTAGED'
        );
      } else {
        store.set(
          key,
          String(value)
        );
      }

      return this;
    }
  };

  function currentTriggerCount() {
    const configured =
      options.triggerCounts;

    if (Array.isArray(configured)) {
      const index =
        Math.min(
          effects.triggerReads,
          configured.length - 1
        );

      return configured[index];
    }

    return options.triggerCount || 0;
  }

  const ScriptApp = {
    getProjectTriggers() {
      const count =
        currentTriggerCount();

      effects.triggerReads++;

      return Array.from(
        { length: count },
        (_, index) => ({
          getHandlerFunction() {
            return index === 0
              ? 'reosCountyProductionSchedulerRun'
              : 'otherHandler';
          }
        })
      );
    }
  };

  const REOS = {
    Security: {
      requireAdmin() {
        effects.adminCalls++;
      }
    }
  };

  if (options.includeLease !== false) {
    REOS.CountyMutationExclusionLease = {
      assertWriterAllowed(callOptions) {
        effects.guardCalls++;
        effects.guardHeld.push(held);
        effects.guardOptions.push(
          callOptions
        );
        effects.sequence.push('guard');

        assert.equal(
          Object.keys(callOptions)
            .sort()
            .join(','),
          'writerId'
        );

        assert.equal(
          callOptions.writerId,
          WRITER_ID
        );

        if (options.guardThrows) {
          throw new Error(
            'County mutation-exclusion lease: ' +
            'Active collapse lease blocks protected writer: ' +
            WRITER_ID
          );
        }

        return {
          ok: true,
          allowed: true,
          writerId: WRITER_ID,
          blockedByLease: false
        };
      }
    };
  }

  const context = {
    REOS,

    PropertiesService: {
      getScriptProperties() {
        return props;
      }
    },

    ScriptApp,

    LockService: {
      getScriptLock() {
        effects.lockRequests++;
        return lock;
      }
    },

    JSON,
    String,
    Number,
    Object,
    Array,
    Math,
    Date,
    Error,
    console
  };

  vm.createContext(context);

  vm.runInContext(
    source,
    context,
    {
      filename: SOURCE
    }
  );

  return {
    context,
    effects,
    store,
    isHeld() {
      return held;
    }
  };
}

function mutationCount(runtime) {
  return runtime.effects
    .propertySets.length;
}

test(
  'source contains exact fail-closed lease guard and writer ID',
  () => {
    assert.ok(
      source.includes(
        'REOS.CountyMutationExclusionLease.assertWriterAllowed'
      )
    );

    assert.ok(
      source.includes(
        "'COUNTY_CHECKPOINT_RECOVERY'"
      )
    );

    assert.equal(
      source.includes('.assertOwnerReady('),
      false
    );

    assert.equal(
      source.includes('.openExclusive('),
      false
    );
  }
);

test(
  'public recovery module API remains unchanged',
  () => {
    const runtime =
      makeRuntime();

    assert.deepEqual(
      Object.keys(
        runtime.context
          .REOS
          .CountyCheckpointRecovery
      ).sort(),
      [
        'execute',
        'inspect'
      ]
    );
  }
);

test(
  'inspect remains read-only and does not acquire writer lock or guard',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 0
      });

    const result =
      runtime.context
        .REOS
        .CountyCheckpointRecovery
        .inspect();

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.readOnly,
      true
    );

    assert.equal(
      result.recoveryAuthorityGranted,
      false
    );

    assert.equal(
      runtime.effects.lockRequests,
      0
    );

    assert.equal(
      runtime.effects.guardCalls,
      0
    );

    assert.equal(
      mutationCount(runtime),
      0
    );
  }
);

test(
  'explicit confirmation remains required before lock or guard',
  () => {
    const runtime =
      makeRuntime();

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(false),
      /Explicit county checkpoint recovery confirmation is required/
    );

    assert.equal(
      runtime.effects.lockRequests,
      0
    );

    assert.equal(
      runtime.effects.guardCalls,
      0
    );

    assert.equal(
      mutationCount(runtime),
      0
    );
  }
);

test(
  'managed scheduler trigger blocks before lock or guard',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true),
      /requires zero managed scheduler triggers/
    );

    assert.equal(
      runtime.effects.lockRequests,
      0
    );

    assert.equal(
      runtime.effects.guardCalls,
      0
    );

    assert.equal(
      mutationCount(runtime),
      0
    );
  }
);

test(
  'ScriptLock contention performs no guard or protected mutation',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 0,
        lockAcquired: false
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true),
      /lock contention/
    );

    assert.equal(
      runtime.effects.guardCalls,
      0
    );

    assert.equal(
      mutationCount(runtime),
      0
    );

    assert.equal(
      runtime.effects.lockReleases,
      0
    );
  }
);

test(
  'missing lease guard fails closed under held ScriptLock',
  () => {
    const runtime =
      makeRuntime({
        triggerCounts: [0, 0],
        includeLease: false
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true),
      /lease writer guard is required/
    );

    assert.equal(
      mutationCount(runtime),
      0
    );

    assert.equal(
      runtime.effects.lockRequests,
      1
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );

    assert.equal(
      runtime.isHeld(),
      false
    );
  }
);

test(
  'active lease blocks under the same ScriptLock before checkpoint mutation',
  () => {
    const runtime =
      makeRuntime({
        triggerCounts: [0, 0],
        guardThrows: true
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true),
      /Active collapse lease blocks protected writer/
    );

    assert.equal(
      runtime.effects.guardCalls,
      1
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );

    assert.equal(
      mutationCount(runtime),
      0
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );

    assert.equal(
      runtime.isHeld(),
      false
    );
  }
);

test(
  'scheduler authority is rechecked under lock before lease guard',
  () => {
    const runtime =
      makeRuntime({
        triggerCounts: [0, 1]
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true),
      /scheduler authority changed under lock/
    );

    assert.equal(
      runtime.effects.guardCalls,
      0
    );

    assert.equal(
      mutationCount(runtime),
      0
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );
  }
);

test(
  'corrupt checkpoint authority is revalidated after guard and before writes',
  () => {
    const properties =
      corruptProperties();

    properties[
      KEYS.nextFeedIndex
    ] = '99';

    const runtime =
      makeRuntime({
        triggerCounts: [0, 0],
        properties
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true),
      /feed-index authority mismatch/
    );

    assert.equal(
      runtime.effects.guardCalls,
      1
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );

    assert.equal(
      mutationCount(runtime),
      0
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );
  }
);

test(
  'allowed recovery guards once under lock before first checkpoint write',
  () => {
    const runtime =
      makeRuntime({
        triggerCounts: [0, 0]
      });

    const result =
      runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true);

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.recovered,
      true
    );

    assert.equal(
      runtime.effects.guardCalls,
      1
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );

    assert.equal(
      runtime.effects.propertySets.length,
      3
    );

    const guardIndex =
      runtime.effects.sequence
        .indexOf('guard');

    const firstWriteIndex =
      runtime.effects.sequence
        .findIndex(
          item =>
            item.startsWith('set:')
        );

    assert.ok(guardIndex >= 0);
    assert.ok(firstWriteIndex > guardIndex);
  }
);

test(
  'allowed recovery writes only the exact certified checkpoint values',
  () => {
    const runtime =
      makeRuntime({
        triggerCounts: [0, 0]
      });

    const result =
      runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true);

    assert.deepEqual(
      runtime.effects.propertySets,
      [
        [
          KEYS.nextFeedIndex,
          '0'
        ],
        [
          KEYS.cursor,
          RECOVERY_CURSOR
        ],
        [
          KEYS.results,
          '[]'
        ]
      ]
    );

    assert.equal(
      result.cycleId,
      EXPECTED_CYCLE
    );

    assert.equal(
      result.nextFeedIndex,
      0
    );

    assert.equal(
      result.completedFeeds,
      0
    );

    assert.equal(
      result.currentFeedCursor,
      RECOVERY_CURSOR
    );

    assert.deepEqual(
      Array.from(result.results),
      []
    );
  }
);

test(
  'post-write verification failure still releases the held ScriptLock',
  () => {
    const runtime =
      makeRuntime({
        triggerCounts: [0, 0],
        sabotageSetKey:
          KEYS.cursor
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyCheckpointRecovery
        .execute(true),
      /post-write verification failed/
    );

    assert.equal(
      runtime.effects.guardCalls,
      1
    );

    assert.equal(
      runtime.effects.propertySets.length,
      3
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );

    assert.equal(
      runtime.isHeld(),
      false
    );
  }
);

test(
  'successful recovery uses exactly one native ScriptLock and releases it',
  () => {
    const runtime =
      makeRuntime({
        triggerCounts: [0, 0]
      });

    runtime.context
      .REOS
      .CountyCheckpointRecovery
      .execute(true);

    assert.equal(
      runtime.effects.lockRequests,
      1
    );

    assert.equal(
      runtime.effects.lockAttempts,
      1
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );

    assert.equal(
      runtime.effects.guardCalls,
      1
    );

    assert.equal(
      runtime.effects.guardOptions[0]
        .writerId,
      WRITER_ID
    );

    assert.equal(
      runtime.isHeld(),
      false
    );
  }
);

console.log(
  'checkpoint_recovery_cases=' + cases
);

assert.equal(
  cases,
  14
);

console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_COUNTY_CHECKPOINT_RECOVERY_VALIDATION_PASSED=true'
);
