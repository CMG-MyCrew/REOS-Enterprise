#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const SOURCE =
  'build/apps-script-brand/CountyProductionScheduler.js';

const WRITER_ID =
  'COUNTY_PRODUCTION_SCHEDULER';

const HANDLER =
  'reosCountyProductionSchedulerRun';

const source =
  fs.readFileSync(SOURCE, 'utf8');

let cases = 0;

function test(name, work) {
  work();
  cases++;
  console.log('PASS: ' + name);
}

function trigger(id) {
  return {
    getHandlerFunction() {
      return HANDLER;
    },
    getEventType() {
      return 'CLOCK';
    },
    getTriggerSource() {
      return 'CLOCK';
    },
    getUniqueId() {
      return id || 'trigger-1';
    }
  };
}

function makeRuntime(options) {
  options = options || {};

  const store =
    new Map(
      Object.entries(
        options.properties || {}
      )
    );

  const triggers = [];

  for (
    let index = 0;
    index < (options.triggerCount || 0);
    index++
  ) {
    triggers.push(
      trigger('trigger-' + (index + 1))
    );
  }

  const effects = {
    propertySets: [],
    propertyDeletes: [],
    triggerCreates: 0,
    triggerDeletes: 0,
    guardCalls: 0,
    guardHeld: [],
    guardOptions: [],
    lockRequests: 0,
    lockAttempts: 0,
    lockReleases: 0,
    syncCalls: 0,
    adminCalls: 0,
    contentionCalls: 0,
    beginCalls: 0,
    endCalls: 0
  };

  let held = false;

  const lock = {
    tryLock() {
      effects.lockAttempts++;

      if (options.lockAcquired === false) {
        return false;
      }

      held = true;
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

      store.set(
        key,
        String(value)
      );

      return this;
    },

    deleteProperty(key) {
      effects.propertyDeletes.push(key);
      store.delete(key);
      return this;
    }
  };

  const REOS = {
    Security: {
      requireAdmin() {
        effects.adminCalls++;
      }
    },

    CountyMutationExclusionLease: {
      assertWriterAllowed(callOptions) {
        effects.guardCalls++;
        effects.guardHeld.push(held);
        effects.guardOptions.push(callOptions);

        assert.equal(
          Object.keys(callOptions).sort().join(','),
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
    },

    CountyRuntimeBridge: {
      sync() {
        effects.syncCalls++;

        if (options.syncThrows) {
          throw new Error('synthetic sync failure');
        }

        return options.syncResult || {
          stats: {
            failed: 0
          },
          nextCursor: 'NEXT-CURSOR'
        };
      }
    },

    ScriptLockObservability: {
      contention() {
        effects.contentionCalls++;
      },

      begin() {
        effects.beginCalls++;
        return {
          id: 'observation-1'
        };
      },

      end() {
        effects.endCalls++;
      }
    }
  };

  const ScriptApp = {
    getProjectTriggers() {
      return triggers.slice();
    },

    deleteTrigger(item) {
      const index =
        triggers.indexOf(item);

      if (index !== -1) {
        triggers.splice(index, 1);
      }

      effects.triggerDeletes++;
    },

    newTrigger(handler) {
      assert.equal(handler, HANDLER);

      return {
        timeBased() {
          return this;
        },

        everyHours(hours) {
          assert.equal(hours, 6);
          return this;
        },

        create() {
          effects.triggerCreates++;

          triggers.push(
            trigger(
              'created-' +
              effects.triggerCreates
            )
          );

          return triggers[
            triggers.length - 1
          ];
        }
      };
    }
  };

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
    console,
    Date,
    JSON,
    String,
    Number,
    Object,
    Array,
    Math,
    isNaN
  };

  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: SOURCE
  });

  return {
    context,
    effects,
    store,
    triggers,
    isHeld() {
      return held;
    }
  };
}

function mutationCount(effects) {
  return (
    effects.propertySets.length +
    effects.propertyDeletes.length +
    effects.triggerCreates +
    effects.triggerDeletes +
    effects.syncCalls
  );
}

test(
  'source contains exact lease guard and certified writer ID',
  () => {
    assert.ok(
      source.includes(
        'REOS.CountyMutationExclusionLease.assertWriterAllowed'
      )
    );

    assert.ok(
      source.includes(
        "'COUNTY_PRODUCTION_SCHEDULER'"
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
  'public scheduler API remains unchanged',
  () => {
    const runtime =
      makeRuntime();

    assert.deepEqual(
      Object.keys(
        runtime.context
          .REOS
          .CountyProductionScheduler
      ).sort(),
      [
        'getCheckpoint',
        'getProvenance',
        'getStatus',
        'getTaxDelinquentEndpoint',
        'installScheduler',
        'preflight',
        'removeScheduler',
        'retireCheckpoint',
        'run',
        'runManualCertification'
      ].sort()
    );
  }
);

test(
  'read-only status does not acquire mutation lock or lease guard',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1
      });

    runtime.context
      .REOS
      .CountyProductionScheduler
      .getStatus();

    assert.equal(
      runtime.effects.lockRequests,
      0
    );

    assert.equal(
      runtime.effects.guardCalls,
      0
    );

    assert.equal(
      mutationCount(runtime.effects),
      0
    );
  }
);

test(
  'run lock contention performs no protected mutation',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1,
        lockAcquired: false
      });

    const result =
      runtime.context
        .REOS
        .CountyProductionScheduler
        .run();

    assert.equal(
      result.status,
      'Contended'
    );

    assert.equal(
      result.skipped,
      true
    );

    assert.equal(
      runtime.effects.guardCalls,
      0
    );

    assert.equal(
      mutationCount(runtime.effects),
      0
    );

    assert.equal(
      runtime.effects.lockReleases,
      0
    );
  }
);

test(
  'active lease blocks scheduled run before any protected mutation',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1,
        guardThrows: true
      });

    const result =
      runtime.context
        .REOS
        .CountyProductionScheduler
        .run();

    assert.equal(
      result.status,
      'Blocked'
    );

    assert.equal(
      result.skipped,
      true
    );

    assert.equal(
      runtime.effects.guardCalls,
      1
    );

    assert.equal(
      mutationCount(runtime.effects),
      0
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
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
  'active lease blocks manual certification before mutation',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 0,
        guardThrows: true
      });

    const result =
      runtime.context
        .REOS
        .CountyProductionScheduler
        .runManualCertification(
          'COUNTY-X',
          0,
          ''
        );

    assert.equal(
      result.status,
      'Blocked'
    );

    assert.equal(
      runtime.effects.syncCalls,
      0
    );

    assert.equal(
      mutationCount(runtime.effects),
      0
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );
  }
);

test(
  'active lease blocks scheduler installation atomically',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 0,
        guardThrows: true
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyProductionScheduler
        .installScheduler(),
      /Active collapse lease blocks protected writer/
    );

    assert.equal(
      mutationCount(runtime.effects),
      0
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );
  }
);

test(
  'active lease blocks scheduler removal atomically',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1,
        guardThrows: true
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyProductionScheduler
        .removeScheduler(),
      /Active collapse lease blocks protected writer/
    );

    assert.equal(
      mutationCount(runtime.effects),
      0
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );
  }
);

test(
  'active lease blocks checkpoint retirement atomically',
  () => {
    const runtime =
      makeRuntime({
        guardThrows: true,
        properties: {
          REOS_COUNTY_SCHEDULER_CYCLE_ID:
            'COUNTY-X',
          REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT:
            '2026-09-15T00:00:00.000Z',
          REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX:
            '0',
          REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON:
            '[]'
        }
      });

    assert.throws(
      () => runtime.context
        .REOS
        .CountyProductionScheduler
        .retireCheckpoint(
          'COUNTY-X'
        ),
      /Active collapse lease blocks protected writer/
    );

    assert.equal(
      mutationCount(runtime.effects),
      0
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );
  }
);

test(
  'allowed scheduled run guards under lock before mutation and sync',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1
      });

    const result =
      runtime.context
        .REOS
        .CountyProductionScheduler
        .run();

    assert.equal(
      result.status,
      'In Progress'
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
      runtime.effects.syncCalls,
      1
    );

    assert.ok(
      runtime.effects.propertySets
        .some(
          ([key]) =>
            key ===
            'REOS_COUNTY_SCHEDULER_LAST_ATTEMPT_AT'
        )
    );

    assert.ok(
      runtime.effects.propertySets
        .some(
          ([key]) =>
            key ===
            'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
        )
    );

    assert.equal(
      runtime.effects.lockRequests,
      1
    );

    assert.equal(
      runtime.effects.lockReleases,
      1
    );
  }
);

test(
  'allowed installation uses exactly one guarded ScriptLock',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 0
      });

    const result =
      runtime.context
        .REOS
        .CountyProductionScheduler
        .installScheduler();

    assert.equal(result.ok, true);
    assert.equal(
      runtime.effects.guardCalls,
      1
    );
    assert.equal(
      runtime.effects.guardHeld[0],
      true
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
      runtime.effects.triggerCreates,
      1
    );
  }
);

test(
  'allowed removal uses exactly one guarded ScriptLock',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1
      });

    const result =
      runtime.context
        .REOS
        .CountyProductionScheduler
        .removeScheduler();

    assert.equal(result.ok, true);
    assert.equal(result.removed, 1);
    assert.equal(
      runtime.effects.guardCalls,
      1
    );
    assert.equal(
      runtime.effects.guardHeld[0],
      true
    );
    assert.equal(
      runtime.effects.triggerDeletes,
      1
    );
    assert.equal(
      runtime.effects.lockRequests,
      1
    );
    assert.equal(
      runtime.effects.lockReleases,
      1
    );
  }
);

test(
  'allowed checkpoint retirement is guarded under one ScriptLock',
  () => {
    const runtime =
      makeRuntime({
        properties: {
          REOS_COUNTY_SCHEDULER_CYCLE_ID:
            'COUNTY-X',
          REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT:
            '2026-09-15T00:00:00.000Z',
          REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX:
            '0',
          REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON:
            '[]'
        }
      });

    const result =
      runtime.context
        .REOS
        .CountyProductionScheduler
        .retireCheckpoint(
          'COUNTY-X'
        );

    assert.equal(result.ok, true);
    assert.equal(result.retired, true);

    assert.equal(
      runtime.effects.guardCalls,
      1
    );

    assert.equal(
      runtime.effects.guardHeld[0],
      true
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
      runtime.store.has(
        'REOS_COUNTY_SCHEDULER_CYCLE_ID'
      ),
      false
    );
  }
);

test(
  'all guard invocations use only the exact certified writer ID',
  () => {
    const runtime =
      makeRuntime({
        triggerCount: 1
      });

    runtime.context
      .REOS
      .CountyProductionScheduler
      .run();

    runtime.context
      .REOS
      .CountyProductionScheduler
      .removeScheduler();

    assert.ok(
      runtime.effects.guardOptions.length >= 2
    );

    runtime.effects.guardOptions
      .forEach(options => {
        assert.equal(
          Object.keys(options).sort().join(','),
          'writerId'
        );

        assert.equal(
          options.writerId,
          WRITER_ID
        );
      });

    runtime.effects.guardHeld
      .forEach(value => {
        assert.equal(value, true);
      });
  }
);

test(
  'retrofit introduces no generic lease RPC',
  () => {
    const runtime =
      makeRuntime();

    assert.equal(
      typeof runtime.context
        .reosCountyMutationExclusionLease,
      'undefined'
    );

    assert.equal(
      source.includes(
        'function reosCountyMutationExclusionLease'
      ),
      false
    );
  }
);

console.log('scheduler_cases=' + cases);
assert.equal(cases, 15);

console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_COUNTY_PRODUCTION_SCHEDULER_VALIDATION_PASSED=true'
);
