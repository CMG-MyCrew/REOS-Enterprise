#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const PREFLIGHT_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const RETIRED_BLOCKER =
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE';

const RESIDUAL_BLOCKER =
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY';

const CURRENT_FP =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const CURRENT_AUTH =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const CURRENT_CYCLE =
  'COUNTY-20260902222607805';

const CURRENT_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const source =
  fs.readFileSync(
    PREFLIGHT_FILE,
    'utf8'
  );

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function harness(options = {}) {
  const state = {
    adminCalls:
      0,
    metadataCalls:
      0,
    residualCalls:
      0,
    checkpointCalls:
      0,
    triggerReads:
      0,
    deleteCalls:
      0
  };

  const checkpoint = {
    id:
      CURRENT_CYCLE,
    nextFeedIndex:
      0,
    currentFeedCursor:
      CURRENT_CURSOR,
    completedFeeds:
      0,
    totalFeeds:
      4,
    results:
      []
  };

  const REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls++;
        return true;
      }
    },

    Database: {
      deletePhysicalRowExact() {
        state.deleteCalls++;
        throw new Error(
          'READ_ONLY_PREFLIGHT_MUST_NOT_DELETE'
        );
      }
    },

    CountyCodeViolationCollapseDirectKeepExecutionAuthority: {
      metadata() {
        state.metadataCalls++;

        return {
          authoritySha256:
            options.badAuthority
              ? 'BAD'
              : CURRENT_AUTH,
          winnerPlanFingerprintSha256:
            CURRENT_FP,
          directKeepGroupCount:
            14,
          directKeepDeleteCandidateCount:
            16
        };
      }
    },

    CountyCodeViolationCollapseResidualEvidence: {
      read() {
        state.residualCalls++;

        return {
          ok:
            true,
          authoritySha256:
            CURRENT_AUTH,
          winnerPlanFingerprintSha256:
            CURRENT_FP,
          certifiedRowCount:
            44,
          currentCertifiedRowCount:
            44,
          verifiedDeletedCount:
            0,
          remainingDirectKeepDeleteCandidateCount:
            16,
          executionBlocked:
            options.executionBlocked === true,
          uncertainOperationIds:
            options.executionBlocked === true
              ? ['UNCERTAIN-1']
              : []
        };
      }
    },

    CountyProductionScheduler: {
      getCheckpoint() {
        state.checkpointCalls++;

        const value =
          clone(
            checkpoint
          );

        if (
          options.badCheckpoint === true
        ) {
          value.currentFeedCursor =
            'DRIFTED';
        }

        return value;
      }
    }
  };

  const ScriptApp = {
    getProjectTriggers() {
      state.triggerReads++;

      if (
        options.schedulerRunning === true
      ) {
        return [
          {
            getHandlerFunction() {
              return 'reosCountyProductionSchedulerRun';
            },

            getUniqueId() {
              return 'TRIGGER-1';
            }
          }
        ];
      }

      return [];
    }
  };

  const sandbox = {
    REOS,
    ScriptApp,
    console,
    Object,
    Array,
    JSON,
    Number,
    String,
    Boolean,
    Date,
    Math,
    Error
  };

  const context =
    vm.createContext(
      sandbox
    );

  vm.runInContext(
    source,
    context,
    {
      filename:
        PREFLIGHT_FILE
    }
  );

  return {
    state,
    preflight:
      context.REOS
        .CountyCodeViolationCollapseExecutionPreflightV2
        .preflight
  };
}

let count = 0;

function test(number, name, work) {
  assert.equal(
    number,
    count + 1
  );

  work();

  count++;

  console.log(
    'PASS ' +
    String(number)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

console.log(
  '=== COLLAPSE EXECUTOR BLOCKER-RETIREMENT RUNTIME V1 ==='
);

test(
  1,
  'retired availability blocker is absent from production successor preflight source',
  () => {
    assert.equal(
      source.includes(
        RETIRED_BLOCKER
      ),
      false
    );

    assert.ok(
      source.includes(
        'var blockers = [];'
      )
    );

    assert.ok(
      source.includes(
        'collapseExecutionReady:\n' +
        '          blockers.length === 0'
      )
    );

    assert.ok(
      source.includes(
        RESIDUAL_BLOCKER
      )
    );
  }
);

test(
  2,
  'clean residual state yields no blockers and source readiness true',
  () => {
    const h =
      harness();

    const result =
      h.preflight({});

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      JSON.stringify(
        Array.from(
          result.executionBlockers
        )
      ),
      '[]'
    );

    assert.equal(
      result.collapseExecutionReady,
      true
    );

    assert.equal(
      result.schedulerFrozen,
      true
    );

    assert.equal(
      result.checkpointFrozen,
      true
    );

    assert.equal(
      result.physicalDeletePrimitiveAvailable,
      true
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  3,
  'unresolved durable operation history remains fail-closed',
  () => {
    const h =
      harness({
        executionBlocked:
          true
      });

    const result =
      h.preflight({});

    assert.equal(
      JSON.stringify(
        Array.from(
          result.executionBlockers
        )
      ),
      JSON.stringify([
        RESIDUAL_BLOCKER
      ])
    );

    assert.equal(
      result.collapseExecutionReady,
      false
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  4,
  'retirement changes readiness only and grants no mutation authority',
  () => {
    const h =
      harness();

    const result =
      h.preflight({});

    [
      'executionAuthorityGranted',
      'winnerSelectionAuthorityGranted',
      'collapseAuthorityGranted',
      'deleteAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'productionDataMutationAuthorityGranted',
      'repairAuthorityGranted',
      'migrationAuthorityGranted',
      'connectorExecutionAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'schedulerAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(key => {
      assert.equal(
        result[key],
        false,
        key
      );
    });

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  5,
  'caller-defined authority remains prohibited',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.preflight({
          authorize:
            true
        }),
      /Caller-defined collapse execution authority is prohibited/
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  6,
  'running county scheduler remains fail-closed',
  () => {
    const h =
      harness({
        schedulerRunning:
          true
      });

    assert.throws(
      () =>
        h.preflight({}),
      /County production scheduler is not frozen/
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  7,
  'checkpoint drift remains fail-closed',
  () => {
    const h =
      harness({
        badCheckpoint:
          true
      });

    assert.throws(
      () =>
        h.preflight({}),
      /Frozen county checkpoint authority changed/
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  8,
  'direct-keep authority drift remains fail-closed',
  () => {
    const h =
      harness({
        badAuthority:
          true
      });

    assert.throws(
      () =>
        h.preflight({}),
      /Immutable direct-keep authority changed/
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

console.log('');
console.log(
  'BLOCKER_RETIREMENT_RUNTIME_BEHAVIOR_CASES=' +
  count
);

console.log(
  'EXECUTOR_BLOCKER_RETIREMENT_RUNTIME_VALIDATION_PASSED=true'
);

console.log(
  'CERTIFIED_EXECUTOR_AVAILABILITY_BLOCKER_RETIRED=true'
);

console.log(
  'UNRESOLVED_OPERATION_HISTORY_BLOCKER_RETAINED=true'
);

console.log(
  'CLEAN_SOURCE_PREFLIGHT_READINESS=true'
);

console.log(
  'PREFLIGHT_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_EXECUTION_AUTHORIZED=false'
);
