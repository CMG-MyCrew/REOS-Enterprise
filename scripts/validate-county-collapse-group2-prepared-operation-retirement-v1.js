#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const cp =
  require('node:child_process');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const BASE =
  '15d7b3a7af56806c2d147b27b28dab4b20492c65';

const BASE_TREE =
  '1cf40cdf1169aa448ab1ceb610348edffa4b3c55';

const MODULE =
  'build/apps-script-brand/CountyCollapseGroup2PreparedOperationRetirement.js';

const SELF =
  'scripts/validate-county-collapse-group2-prepared-operation-retirement-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const AUTH_DOC =
  'docs/county-collapse-group2-prepared-operation-retirement-authorization-v1.md';

const AUTH_VALIDATOR =
  'scripts/validate-county-collapse-group2-prepared-operation-retirement-authorization-v1.js';

const AUTH_DOC_SHA =
  'e4914071daac58b2f3abd4d262a68931025282dccd52e4aea7cdd51f717e8dbf';

const AUTH_VALIDATOR_SHA =
  'abd39b81493a21f27afe255b04f4a30bff85309246287951c2e475d4878921c1';

const STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const RECON =
  'build/apps-script-brand/CountyCollapseGroup2StrandedOperationReconciliation.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const MAINT_OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const OPERATION_ID =
  '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

const WINNER =
  'DL-20260820181645-7130';

const TARGET =
  'DL-20260820181652-6183';

const PREPARED_EVENT_SHA =
  '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

const PREPARED_PAYLOAD_SHA =
  '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

const CONFIRM =
  'CONFIRM_GROUP2_PREPARED_OPERATION_RETIREMENT_V1';

const CHECKPOINT_ID =
  'COUNTY-20260902222607805';

const CHECKPOINT_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const TERMINAL_EVENT_SHA =
  'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const TERMINAL_PAYLOAD_SHA =
  'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';

const EXPECTED_SCOPE = [
  MODULE,
  SELF,
  WORKFLOW,
  INTEGRATION
].sort();

const PROTECTED = [
  AUTH_DOC,
  AUTH_VALIDATOR,
  STORE,
  EXECUTOR,
  RESIDUAL,
  RECON,
  PREFLIGHT,
  MAINT_GATE,
  MAINT_OPERATOR,
  DATABASE
];

function git(args) {
  return cp.spawnSync(
    'git',
    args,
    {
      encoding:
        'utf8'
    }
  );
}

function gitText(args) {
  const result =
    git(args);

  assert.equal(
    result.status,
    0,
    'git ' +
      args.join(' ') +
      ' failed\n' +
      String(result.stderr || '')
  );

  return String(
    result.stdout || ''
  ).trim();
}

function lines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(path)
    )
    .digest('hex');
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function incident() {
  return {
    ok: true,
    mode:
      'READ_ONLY_GROUP2_STRANDED_OPERATION_RECONCILIATION_V2',
    contractVersion: 2,
    operationId: OPERATION_ID,
    groupNumber: 2,
    winnerDistressLeadId: WINNER,
    targetDeleteDistressLeadId: TARGET,
    operationCreatedTimestampUtc:
      '2026-09-20T23:49:45.327Z',
    preparedEventSha256:
      PREPARED_EVENT_SHA,
    preparedPayloadSha256:
      PREPARED_PAYLOAD_SHA,
    preparedPayloadUtf8Bytes: 9239,
    preparedPayloadChunkCount: 1,
    journalReadbackDecoded: true,
    journalEventCount: 1,
    journalEventType:
      'INTENT_PREPARED',
    recoveryClassification:
      'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
    deleteBarrierPresent: false,
    verifiedDeletePresent: false,
    winnerPresent: true,
    targetPresent: true,
    winnerCurrentRowNumber: 766,
    targetCurrentRowNumber: 770,
    residualExecutionBlocked: false,
    residualExecutionBlockers: [],
    targetBoundPreparedOperationHistoryPresent:
      true,
    liveReadOnlyReconciliationRequired:
      true,
    automaticRetryPermitted: false,
    executorRetryAuthorityGranted: false,
    rowRecreationPermitted: false,
    journalMutationExecuted: false,
    collapseExecutionAuthorityGranted: false,
    physicalDeleteAuthorityGranted: false,
    productionDataMutationAuthorityGranted:
      false,
    maintenanceMutationAuthorityGranted:
      false,
    schedulerMutationAuthorityGranted:
      false,
    checkpointMutationAuthorityGranted:
      false,
    connectorExecutionAuthorityGranted:
      false,
    automaticMaoAuthorityGranted: false,
    automaticOfferAuthorityGranted: false
  };
}

function checkpoint() {
  return {
    id:
      CHECKPOINT_ID,
    nextFeedIndex:
      0,
    currentFeedCursor:
      CHECKPOINT_CURSOR,
    completedFeeds:
      0,
    totalFeeds:
      4,
    resultCount:
      0
  };
}

function preflight() {
  return {
    ok: true,
    mode:
      'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT_V2',

    schedulerBefore: {
      handler:
        'reosCountyProductionSchedulerRun',
      triggerCount:
        0,
      triggerIds:
        []
    },

    schedulerAfter: {
      handler:
        'reosCountyProductionSchedulerRun',
      triggerCount:
        0,
      triggerIds:
        []
    },

    checkpointBefore:
      checkpoint(),

    checkpointAfter:
      checkpoint(),

    schedulerFrozen: true,
    checkpointFrozen: true,
    uncertainOperationIds: [],
    executionBlockers: [],
    collapseExecutionReady: true,
    executionAuthorityGranted: false,
    collapseAuthorityGranted: false,
    deleteAuthorityGranted: false,
    physicalDeleteAuthorityGranted: false,
    productionDataMutationAuthorityGranted:
      false,
    connectorExecutionAuthorityGranted:
      false,
    checkpointMutationAuthorityGranted:
      false,
    schedulerAuthorityGranted:
      false,
    automaticOfferAuthorityGranted:
      false
  };
}

function terminalPayload() {
  return {
    retirementContractVersion:
      1,

    retirementReason:
      'CERTIFIED_PREBARRIER_GROUP2_PREPARED_OPERATION_RETIREMENT',

    incidentOperationId:
      OPERATION_ID,

    groupNumber:
      2,

    winnerDistressLeadId:
      WINNER,

    targetDeleteDistressLeadId:
      TARGET,

    preparedEventSha256:
      PREPARED_EVENT_SHA,

    preparedPayloadSha256:
      PREPARED_PAYLOAD_SHA,

    certifiedLiveV2RawSha256:
      '99d049d2364a470c44827ac8aeaa1228e17b521fa5044565a3a71ee1aeccbd8b',

    certifiedLiveV2JsonSha256:
      '330c2ee6392a4d396213da868765f3c0321982ea17763f4c585a8ee2c61ddeb6',

    originalExecutorAttemptFailedBeforeDurableDeleteBarrier:
      true,

    liveV2WinnerPresent:
      true,

    liveV2TargetPresent:
      true,

    noPhysicalDeleteClaim:
      true,

    automaticRetryPermitted:
      false,

    rowRecreationPermitted:
      false,

    successorExecutionAuthorityGranted:
      false,

    automaticMaintenanceClosePermitted:
      false
  };
}

function request() {
  return {
    confirmRetirement:
      CONFIRM,

    expectedGateId:
      'GATE-1',

    expectedLeaseId:
      'LEASE-1',

    maintenanceToken:
      'TOKEN-1',

    operationId:
      OPERATION_ID,

    preparedEventSha256:
      PREPARED_EVENT_SHA,

    preparedPayloadSha256:
      PREPARED_PAYLOAD_SHA
  };
}

function createHarness() {
  const state = {
    activeLock: false,
    adminCalls: 0,
    lockCalls: 0,
    appendCalls: 0,
    maintenanceCalls: 0,
    incidentCalls: 0,
    preflightCalls: 0,
    terminal: false,
    appendReadback: true,
    maintenanceFails: false,
    incidentMutator: null,
    preflightMutator: null,
    postHistoryMutator: null,
    postRecoveryMutator: null,
    appendedPayload: null
  };

  function preparedEvent() {
    return {
      manifest: {
        operationId:
          OPERATION_ID,
        eventSequence:
          1,
        eventType:
          'INTENT_PREPARED',
        eventSha256:
          PREPARED_EVENT_SHA,
        payloadSha256:
          PREPARED_PAYLOAD_SHA
      },
      canonicalPayload:
        '{}'
    };
  }

  function terminalEvent() {
    const envelope = {
      data:
        clone(
          state.appendedPayload ||
          terminalPayload()
        )
    };

    return {
      manifest: {
        operationId:
          OPERATION_ID,
        eventSequence:
          2,
        eventType:
          'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
        operationIntentContractVersion:
          1,
        executorImplementationVersion:
          'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',
        groupNumber:
          2,
        winnerDistressLeadId:
          WINNER,
        targetDeleteDistressLeadId:
          TARGET,
        previousEventSha256:
          PREPARED_EVENT_SHA,
        eventSha256:
          TERMINAL_EVENT_SHA,
        payloadSha256:
          TERMINAL_PAYLOAD_SHA
      },
      canonicalPayload:
        JSON.stringify(envelope)
    };
  }

  const REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls += 1;
      }
    },

    Database: {
      withScriptLockContext(work) {
        state.lockCalls += 1;

        assert.equal(
          state.activeLock,
          false
        );

        state.activeLock =
          true;

        const context = {
          capability:
            'LOCK-CONTEXT'
        };

        try {
          return work(
            context
          );
        } finally {
          state.activeLock =
            false;
        }
      },

      assertScriptLockContext(context) {
        assert.equal(
          state.activeLock,
          true
        );

        assert.deepEqual(
          context,
          {
            capability:
              'LOCK-CONTEXT'
          }
        );

        return true;
      }
    },

    CountyCollapseGroup2StrandedOperationReconciliation: {
      status() {
        state.incidentCalls += 1;

        if (
          state.terminal
        ) {
          throw new Error(
            'V2 incident is no longer prepared-only.'
          );
        }

        let value =
          incident();

        if (
          typeof state.incidentMutator ===
            'function'
        ) {
          value =
            state.incidentMutator(
              state.incidentCalls,
              value
            ) || value;
        }

        return value;
      }
    },

    CountyCodeViolationCollapseExecutionPreflightV2: {
      preflight(options) {
        assert.equal(
          JSON.stringify(options),
          '{}'
        );

        state.preflightCalls += 1;

        let value =
          preflight();

        if (
          typeof state.preflightMutator ===
            'function'
        ) {
          value =
            state.preflightMutator(
              state.preflightCalls,
              value
            ) || value;
        }

        return value;
      }
    },

    CountyCodeViolationCollapseMaintenanceGate: {
      assertReady(options) {
        state.maintenanceCalls += 1;

        assert.equal(
          state.activeLock,
          true
        );

        if (
          state.maintenanceFails
        ) {
          throw new Error(
            'MAINTENANCE_NOT_READY'
          );
        }

        assert.equal(
          options.maintenanceToken,
          'TOKEN-1'
        );

        assert.equal(
          options.expectedLeaseId,
          'LEASE-1'
        );

        assert.equal(
          options.expectedGateId,
          'GATE-1'
        );

        return {
          ok: true,
          ready: true,
          maintenanceReady: true,
          authorityGeneration:
            'CURRENT',
          gateId:
            'GATE-1',
          leaseId:
            'LEASE-1',
          schedulerHandler:
            'reosCountyProductionSchedulerRun',
          manualExternalWritersQuiescentCertified:
            true,
          checkpoint: {
            cycleId:
              CHECKPOINT_ID,
            nextFeedIndex:
              0,
            currentFeedCursor:
              CHECKPOINT_CURSOR,
            completedFeeds:
              0,
            totalFeeds:
              4,
            results:
              []
          }
        };
      }
    },

    CountyCollapseOperationIntentStore: {
      append(value) {
        assert.equal(
          state.activeLock,
          true
        );

        state.appendCalls += 1;

        assert.equal(
          value.operationId,
          OPERATION_ID
        );

        assert.equal(
          value.eventType,
          'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
        );

        assert.equal(
          JSON.stringify(value.payload),
          JSON.stringify(
            terminalPayload()
          )
        );

        state.appendedPayload =
          clone(
            value.payload
          );

        state.terminal =
          true;

        return {
          operationId:
            OPERATION_ID,
          eventSequence:
            2,
          eventType:
            'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
          eventSha256:
            TERMINAL_EVENT_SHA,
          payloadSha256:
            TERMINAL_PAYLOAD_SHA,
          readbackVerified:
            state.appendReadback
        };
      },

      read() {
        let value = {
          found:
            true,
          operationId:
            OPERATION_ID,
          operationCreatedTimestampUtc:
            '2026-09-20T23:49:45.327Z',
          events:
            state.terminal
              ? [
                preparedEvent(),
                terminalEvent()
              ]
              : [
                preparedEvent()
              ]
        };

        if (
          state.terminal &&
          typeof state.postHistoryMutator ===
            'function'
        ) {
          value =
            state.postHistoryMutator(
              value
            ) || value;
        }

        return value;
      },

      recover() {
        let value =
          state.terminal
            ? {
              operationId:
                OPERATION_ID,
              found:
                true,
              classification:
                'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
              automaticRetryPermitted:
                false,
              rowRecreationPermitted:
                false,
              journalMutationExecuted:
                false,
              eventCount:
                2
            }
            : {
              operationId:
                OPERATION_ID,
              found:
                true,
              classification:
                'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
              automaticRetryPermitted:
                false,
              rowRecreationPermitted:
                false,
              journalMutationExecuted:
                false,
              eventCount:
                1
            };

        if (
          state.terminal &&
          typeof state.postRecoveryMutator ===
            'function'
        ) {
          value =
            state.postRecoveryMutator(
              value
            ) || value;
        }

        return value;
      }
    }
  };

  const context = {
    REOS,
    console,
    Object,
    Array,
    Number,
    String,
    JSON,
    Error,
    RegExp
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    fs.readFileSync(
      MODULE,
      'utf8'
    ),
    context,
    {
      filename:
        MODULE
    }
  );

  return {
    state,
    context,
    retire:
      context
        .REOS
        .CountyCollapseGroup2PreparedOperationRetirement
        .retire
  };
}

let casesPassed = 0;

function test(name, work) {
  work();

  casesPassed += 1;

  console.log(
    'PASS CASE ' +
    String(casesPassed).padStart(2, '0') +
    ': ' +
    name
  );
}

console.log(
  '=== GROUP 2 PREPARED-OPERATION RETIREMENT V1 OFFLINE HARNESS ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE
);

assert.equal(
  sha256File(AUTH_DOC),
  AUTH_DOC_SHA
);

assert.equal(
  sha256File(AUTH_VALIDATOR),
  AUTH_VALIDATOR_SHA
);

PROTECTED.forEach(path => {
  assert.equal(
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]).status,
    0,
    'Protected source changed: ' +
      path
  );
});

test(
  'exact certified prepared-only incident retires with one terminal append',
  () => {
    const h =
      createHarness();

    const result =
      h.retire(
        request()
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.retirementExecuted,
      true
    );

    assert.equal(
      result.journalMutationExecuted,
      true
    );

    assert.equal(
      result.terminalEventSha256,
      TERMINAL_EVENT_SHA
    );

    assert.equal(
      result.recoveryClassification,
      'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'
    );

    assert.equal(
      result.executorRetryAuthorityGranted,
      false
    );

    assert.equal(
      result.physicalDeleteAuthorityGranted,
      false
    );

    assert.equal(
      result.postTerminalReadOnlyReconciliationRequired,
      true
    );

    assert.equal(
      h.state.appendCalls,
      1
    );

    assert.equal(
      h.state.lockCalls,
      1
    );

    assert.equal(
      h.state.maintenanceCalls,
      1
    );
  }
);

test(
  'wrong confirmation token fails before lock and append',
  () => {
    const h =
      createHarness();

    const r =
      request();

    r.confirmRetirement =
      'WRONG';

    assert.throws(
      () =>
        h.retire(r),
      /invocation authority mismatch/i
    );

    assert.equal(
      h.state.lockCalls,
      0
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'wrong incident operation fails before lock and append',
  () => {
    const h =
      createHarness();

    const r =
      request();

    r.operationId =
      'wrong-operation';

    assert.throws(
      () =>
        h.retire(r),
      /invocation authority mismatch/i
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'wrong prepared event hash fails before lock and append',
  () => {
    const h =
      createHarness();

    const r =
      request();

    r.preparedEventSha256 =
      '0'.repeat(64);

    assert.throws(
      () =>
        h.retire(r),
      /invocation authority mismatch/i
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'pre-lock delete-barrier drift fails closed',
  () => {
    const h =
      createHarness();

    h.state.incidentMutator =
      (call, value) => {
        if (call === 1) {
          value.deleteBarrierPresent =
            true;
        }

        return value;
      };

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /prepared-only incident state/i
    );

    assert.equal(
      h.state.lockCalls,
      0
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'pre-lock scheduler thaw fails closed',
  () => {
    const h =
      createHarness();

    h.state.preflightMutator =
      (call, value) => {
        if (call === 1) {
          value.schedulerBefore.triggerCount =
            1;
        }

        return value;
      };

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /frozen successor preflight/i
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'incident row drift between pre-lock and under-lock evidence blocks append',
  () => {
    const h =
      createHarness();

    h.state.incidentMutator =
      (call, value) => {
        if (call === 2) {
          value.targetCurrentRowNumber =
            771;
        }

        return value;
      };

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /changed incident field/i
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'CURRENT maintenance failure blocks append',
  () => {
    const h =
      createHarness();

    h.state.maintenanceFails =
      true;

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /MAINTENANCE_NOT_READY/
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'final incident drift after maintenance blocks append',
  () => {
    const h =
      createHarness();

    h.state.incidentMutator =
      (call, value) => {
        if (call === 3) {
          value.winnerCurrentRowNumber =
            765;
        }

        return value;
      };

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /changed incident field/i
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'final frozen checkpoint drift blocks append',
  () => {
    const h =
      createHarness();

    h.state.preflightMutator =
      (call, value) => {
        if (call === 3) {
          value.checkpointAfter.currentFeedCursor =
            'DRIFT';
        }

        return value;
      };

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /frozen county checkpoint/i
    );

    assert.equal(
      h.state.appendCalls,
      0
    );
  }
);

test(
  'terminal append readback failure does not produce success',
  () => {
    const h =
      createHarness();

    h.state.appendReadback =
      false;

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /not durably verified/i
    );

    assert.equal(
      h.state.appendCalls,
      1
    );
  }
);

test(
  'post-append history mismatch fails closed with no second append',
  () => {
    const h =
      createHarness();

    h.state.postHistoryMutator =
      value => {
        value.events[1]
          .manifest
          .previousEventSha256 =
            '0'.repeat(64);

        return value;
      };

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /terminal manifest readback drift/i
    );

    assert.equal(
      h.state.appendCalls,
      1
    );
  }
);

test(
  'post-append recovery-classification mismatch fails closed',
  () => {
    const h =
      createHarness();

    h.state.postRecoveryMutator =
      value => {
        value.classification =
          'WRONG';

        return value;
      };

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /recovery classification drift/i
    );

    assert.equal(
      h.state.appendCalls,
      1
    );
  }
);

test(
  'completed retirement cannot be automatically invoked a second time',
  () => {
    const h =
      createHarness();

    h.retire(
      request()
    );

    assert.throws(
      () =>
        h.retire(
          request()
        ),
      /no longer prepared-only/i
    );

    assert.equal(
      h.state.appendCalls,
      1
    );
  }
);

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

[
  'deletePhysicalRowExact(',
  'replacePhysicalRowExact(',
  'patchPhysicalRowCellsExact(',
  'ScriptApp.newTrigger',
  '.close(',
  'store.prepare(',
  'RECONCILIATION_NOTE',
  'appendRow(',
  'setValue(',
  'setValues('
].forEach(forbidden => {
  assert.equal(
    source.includes(
      forbidden
    ),
    false,
    'Forbidden implementation surface: ' +
      forbidden
  );
});

assert.equal(
  (
    source.match(
      /\.append\s*\(/g
    ) || []
  ).length,
  1,
  'Retirement module must contain exactly one journal append call.'
);

[
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
  'withScriptLockContext',
  'assertScriptLockContext',
  'CountyCollapseGroup2StrandedOperationReconciliation',
  'CountyCodeViolationCollapseExecutionPreflightV2',
  'CountyCodeViolationCollapseMaintenanceGate',
  'postTerminalReadOnlyReconciliationRequired',
  'executorHistoryExceptionImplementationAuthorityGranted'
].forEach(required => {
  assert.ok(
    source.includes(
      required
    ),
    'Required retirement marker missing: ' +
      required
  );
});

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

[
  'node --check ' + MODULE,
  'node --check ' + SELF,
  'Validate certified Group 2 prepared-operation retirement authorization v1',
  'git worktree add --detach "$wt" ' + BASE,
  'test "$(git rev-parse HEAD)" = "' + BASE + '"',
  'test "$(git rev-parse \'HEAD^{tree}\')" = "' + BASE_TREE + '"',
  'node ' + AUTH_VALIDATOR,
  'Validate Group 2 prepared-operation retirement v1',
  'run: node ' + SELF
].forEach(marker => {
  assert.ok(
    workflow.includes(
      marker
    ),
    'Workflow implementation lifecycle marker missing: ' +
      marker
  );
});

assert.equal(
  workflow.includes(
    '      - name: Validate Group 2 prepared-operation retirement authorization v1\n' +
    '        run: node ' +
    AUTH_VALIDATOR +
    '\n\n'
  ),
  false,
  'Completed authorization validator must no longer run directly on cumulative head.'
);

const integration =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

[
  "'validate-county-collapse-group2-prepared-operation-retirement-v1.js'",
  'const expectedCountyCollapseGroup2PreparedOperationRetirementFiles = new Set([',
  "'" + MODULE + "'",
  '...expectedCountyCollapseGroup2PreparedOperationRetirementFiles',
  'expected Group 2 prepared-operation retirement inventory must contain exactly 1 file',
  'expected reconciled production inventory must contain 144 files'
].forEach(marker => {
  assert.ok(
    integration.includes(
      marker
    ),
    'Runtime integration marker missing: ' +
      marker
  );
});

const effective =
  new Set();

[
  gitText([
    'diff',
    '--name-only',
    BASE,
    'HEAD'
  ]),
  gitText([
    'diff',
    '--name-only'
  ]),
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  gitText([
    'ls-files',
    '--others',
    '--exclude-standard'
  ])
].forEach(value => {
  lines(value)
    .forEach(path => {
      effective.add(path);
    });
});

assert.deepEqual(
  Array.from(
    effective
  ).sort(),
  EXPECTED_SCOPE,
  'Retirement implementation increment must remain exactly four files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Local retirement candidate must remain unstaged.'
);

console.log(
  'GROUP2_PREPARED_OPERATION_RETIREMENT_BEHAVIOR_CASES=' +
  casesPassed
);

assert.equal(
  casesPassed,
  14
);

console.log(
  'PASS: one exact pre-barrier terminal append is the only mutable journal path.'
);

console.log(
  'PASS: scheduler/checkpoint evidence is revalidated before and under lock.'
);

console.log(
  'PASS: CURRENT maintenance readiness is asserted under the same Database ScriptLock.'
);

console.log(
  'PASS: store-owned append/flush/readback remains the only journal persistence path.'
);

console.log(
  'PASS: no physical-delete or executor-retry path exists.'
);

console.log(
  'PASS: executor-history exception remains outside this implementation.'
);

console.log(
  'module_sha256=' +
    sha256File(MODULE)
);

console.log(
  'validator_sha256=' +
    sha256File(SELF)
);

console.log(
  'GROUP2_PREPARED_OPERATION_RETIREMENT_VALIDATION_PASSED=true'
);

console.log(
  'RETIREMENT_IMPLEMENTATION_LOCAL_CERTIFIED=true'
);

console.log(
  'RETIREMENT_RPC_EXECUTION_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_RETRY_AUTHORIZED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
