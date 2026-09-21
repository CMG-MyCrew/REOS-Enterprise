#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const MODULE =
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js';

const OPERATION =
  '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

const WINNER =
  'DL-20260820181645-7130';

const TARGET =
  'DL-20260820181652-6183';

const PREPARED_EVENT =
  '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

const PREPARED_PAYLOAD =
  '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

const TERMINAL_EVENT =
  '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89';

const TERMINAL_PAYLOAD =
  '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2';

const AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const WINNER_PLAN =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const CREATED =
  '2026-09-20T23:49:45.327Z';

const CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function retirementData() {
  return {
    retirementContractVersion: 1,
    retirementReason:
      'CERTIFIED_PREBARRIER_GROUP2_PREPARED_OPERATION_RETIREMENT',
    incidentOperationId: OPERATION,
    groupNumber: 2,
    winnerDistressLeadId: WINNER,
    targetDeleteDistressLeadId: TARGET,
    preparedEventSha256: PREPARED_EVENT,
    preparedPayloadSha256: PREPARED_PAYLOAD,
    certifiedLiveV2RawSha256:
      '99d049d2364a470c44827ac8aeaa1228e17b521fa5044565a3a71ee1aeccbd8b',
    certifiedLiveV2JsonSha256:
      '330c2ee6392a4d396213da868765f3c0321982ea17763f4c585a8ee2c61ddeb6',
    originalExecutorAttemptFailedBeforeDurableDeleteBarrier:
      true,
    liveV2WinnerPresent: true,
    liveV2TargetPresent: true,
    noPhysicalDeleteClaim: true,
    automaticRetryPermitted: false,
    rowRecreationPermitted: false,
    successorExecutionAuthorityGranted: false,
    automaticMaintenanceClosePermitted: false
  };
}

function historyFixture() {
  const terminalEnvelope = {
    data: retirementData(),
    eventSequence: 2,
    eventTimestampUtc:
      '2026-09-21T10:56:00.000Z',
    eventType:
      'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
    executorImplementationVersion:
      'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',
    groupNumber: 2,
    operationCreatedTimestampUtc: CREATED,
    operationId: OPERATION,
    operationIntentContractVersion: 1,
    targetDeleteDistressLeadId: TARGET,
    winnerDistressLeadId: WINNER
  };

  return {
    found: true,
    operationId: OPERATION,
    operationCreatedTimestampUtc: CREATED,
    identity: {
      executorImplementationVersion:
        'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',
      groupNumber: 2,
      winnerDistressLeadId: WINNER,
      targetDeleteDistressLeadId: TARGET
    },
    events: [
      {
        manifest: {
          operationId: OPERATION,
          eventSequence: 1,
          eventType: 'INTENT_PREPARED',
          eventTimestampUtc: CREATED,
          operationIntentContractVersion: 1,
          executorImplementationVersion:
            'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',
          groupNumber: 2,
          winnerDistressLeadId: WINNER,
          targetDeleteDistressLeadId: TARGET,
          payloadSha256: PREPARED_PAYLOAD,
          payloadUtf8Bytes: 9239,
          payloadChunkCount: 1,
          previousEventSha256: 'GENESIS',
          eventSha256: PREPARED_EVENT
        },
        canonicalPayload: '{}',
        chunks: []
      },
      {
        manifest: {
          operationId: OPERATION,
          eventSequence: 2,
          eventType:
            'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
          eventTimestampUtc:
            '2026-09-21T10:56:00.000Z',
          operationIntentContractVersion: 1,
          executorImplementationVersion:
            'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',
          groupNumber: 2,
          winnerDistressLeadId: WINNER,
          targetDeleteDistressLeadId: TARGET,
          payloadSha256: TERMINAL_PAYLOAD,
          payloadUtf8Bytes: 1024,
          payloadChunkCount: 1,
          previousEventSha256: PREPARED_EVENT,
          eventSha256: TERMINAL_EVENT
        },
        canonicalPayload:
          JSON.stringify(terminalEnvelope),
        chunks: []
      }
    ]
  };
}

function recoveryFixture() {
  return {
    operationId: OPERATION,
    found: true,
    classification:
      'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
    automaticRetryPermitted: false,
    rowRecreationPermitted: false,
    journalMutationExecuted: false,
    eventCount: 2
  };
}

function residualFixture() {
  return {
    ok: true,
    authoritySha256: AUTHORITY,
    winnerPlanFingerprintSha256:
      WINNER_PLAN,

    currentRows: [
      {
        groupNumber: 2,
        distressLeadId: WINNER,
        currentRowNumber: 766
      },
      {
        groupNumber: 2,
        distressLeadId: TARGET,
        currentRowNumber: 770
      }
    ],

    verifiedDeletes: [],
    operationIds: [OPERATION],
    uncertainOperationIds: [],
    executionBlocked: false,
    executionBlockers: [],

    collapseExecutionAuthorityGranted: false,
    physicalDeleteAuthorityGranted: false,
    productionDataMutationAuthorityGranted: false,
    schedulerMutationAuthorityGranted: false,
    checkpointMutationAuthorityGranted: false,
    connectorExecutionAuthorityGranted: false,
    automaticOfferAuthorityGranted: false
  };
}

function checkpointFixture() {
  return {
    id: 'COUNTY-20260902222607805',
    nextFeedIndex: 0,
    currentFeedCursor: CURSOR,
    completedFeeds: 0,
    totalFeeds: 4,
    resultCount: 0
  };
}

function preflightFixture() {
  return {
    ok: true,
    mode:
      'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT_V2',

    authoritySha256: AUTHORITY,
    winnerPlanFingerprintSha256:
      WINNER_PLAN,

    schedulerBefore: {
      handler:
        'reosCountyProductionSchedulerRun',
      triggerCount: 0,
      triggerIds: []
    },

    schedulerAfter: {
      handler:
        'reosCountyProductionSchedulerRun',
      triggerCount: 0,
      triggerIds: []
    },

    checkpointBefore:
      checkpointFixture(),

    checkpointAfter:
      checkpointFixture(),

    schedulerFrozen: true,
    checkpointFrozen: true,

    uncertainOperationIds: [],
    executionBlockers: [],
    collapseExecutionReady: true,

    executionAuthorityGranted: false,
    winnerSelectionAuthorityGranted: false,
    collapseAuthorityGranted: false,
    deleteAuthorityGranted: false,
    physicalDeleteAuthorityGranted: false,
    productionDataMutationAuthorityGranted: false,
    repairAuthorityGranted: false,
    migrationAuthorityGranted: false,
    connectorExecutionAuthorityGranted: false,
    checkpointMutationAuthorityGranted: false,
    schedulerAuthorityGranted: false,
    automaticOfferAuthorityGranted: false
  };
}

function makeHarness(mutator) {
  const state = {
    operationIds:
      [OPERATION],
    history:
      historyFixture(),
    recovery:
      recoveryFixture(),
    residual:
      residualFixture(),
    preflight:
      preflightFixture(),
    adminAllowed:
      true
  };

  if (mutator) {
    mutator(state);
  }

  const sandbox = {
    console,
    REOS: {}
  };

  vm.createContext(sandbox);

  vm.runInContext(
    source,
    sandbox,
    {
      filename: MODULE
    }
  );

  sandbox.REOS.Security = {
    requireAdmin() {
      if (!state.adminAllowed) {
        throw new Error(
          'ADMIN_DENIED'
        );
      }
    }
  };

  sandbox.REOS.CountyCollapseOperationIntentStore = {
    listOperationIds() {
      return clone(
        state.operationIds
      );
    },

    read() {
      return clone(
        state.history
      );
    },

    recover() {
      return clone(
        state.recovery
      );
    }
  };

  sandbox.REOS.CountyCodeViolationCollapseResidualEvidence = {
    read(options) {
      assert.equal(
        options !== null &&
        typeof options === 'object' &&
        !Array.isArray(options),
        true
      );

      assert.equal(
        Object.keys(options).length,
        0
      );

      return clone(
        state.residual
      );
    }
  };

  sandbox.REOS.CountyCodeViolationCollapseExecutionPreflightV2 = {
    preflight(options) {
      assert.equal(
        options !== null &&
        typeof options === 'object' &&
        !Array.isArray(options),
        true
      );

      assert.equal(
        Object.keys(options).length,
        0
      );

      return clone(
        state.preflight
      );
    }
  };

  return sandbox;
}

let cases = 0;

function pass(name) {
  cases++;
  console.log(
    'PASS CASE ' +
    String(cases).padStart(2, '0') +
    ': ' +
    name
  );
}

function expectFailure(
  name,
  mutator,
  pattern
) {
  const sandbox =
    makeHarness(mutator);

  assert.throws(
    () => sandbox
      .REOS
      .CountyCollapseGroup2PostTerminalReconciliation
      .status(),
    pattern
  );

  pass(name);
}

console.log(
  '=== GROUP 2 POST-TERMINAL RECONCILIATION V1 OFFLINE HARNESS ==='
);

[
  'READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1',
  OPERATION,
  PREPARED_EVENT,
  PREPARED_PAYLOAD,
  TERMINAL_EVENT,
  TERMINAL_PAYLOAD,
  'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
  'reosCountyCollapseGroup2PostTerminalReconciliationStatus'
].forEach(value => {
  assert.ok(
    source.includes(value),
    'module missing certified literal: ' +
      value
  );
});

[
  /\.append\s*\(/,
  /\.prepare\s*\(/,
  /deletePhysicalRowExact\s*\(/,
  /withScriptLockContext\s*\(/,
  /LockService/,
  /appendRow\s*\(/,
  /deleteRow\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/
].forEach(forbidden => {
  assert.equal(
    forbidden.test(source),
    false,
    'read-only module exposes forbidden mutation surface: ' +
      forbidden
  );
});

pass(
  'static surface is incident-bound and contains no journal/data mutation path'
);

{
  const sandbox =
    makeHarness();

  const result =
    sandbox
      .REOS
      .CountyCollapseGroup2PostTerminalReconciliation
      .status();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.mode,
    'READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1'
  );

  assert.equal(
    result.contractVersion,
    1
  );

  assert.equal(
    result.operationId,
    OPERATION
  );

  assert.equal(
    result.preparedEventSha256,
    PREPARED_EVENT
  );

  assert.equal(
    result.terminalEventSha256,
    TERMINAL_EVENT
  );

  assert.equal(
    result.terminalPayloadSha256,
    TERMINAL_PAYLOAD
  );

  assert.deepEqual(
    Array.from(
      result.journalEventTypes
    ),
    [
      'INTENT_PREPARED',
      'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
    ]
  );

  assert.equal(
    result.journalEventCount,
    2
  );

  assert.equal(
    result.winnerPresent,
    true
  );

  assert.equal(
    result.targetPresent,
    true
  );

  assert.equal(
    result.winnerCurrentRowNumber,
    766
  );

  assert.equal(
    result.targetCurrentRowNumber,
    770
  );

  assert.equal(
    result.deleteBarrierPresent,
    false
  );

  assert.equal(
    result.verifiedDeletePresent,
    false
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
    result.postTerminalReconciliationComplete,
    true
  );

  assert.equal(
    result.executorHistoryExceptionEvidenceEligible,
    true
  );

  [
    'journalMutationExecuted',
    'automaticRetryPermitted',
    'executorRetryAuthorityGranted',
    'executorHistoryExceptionImplementationAuthorityGranted',
    'successorExecutionAuthorityGranted',
    'collapseExecutionAuthorityGranted',
    'physicalDeleteAuthorityGranted',
    'productionDataMutationAuthorityGranted',
    'maintenanceMutationAuthorityGranted',
    'schedulerMutationAuthorityGranted',
    'checkpointMutationAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'rowRecreationPermitted',
    'automaticMaoAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(field => {
    assert.equal(
      result[field],
      false,
      field
    );
  });

  pass(
    'exact two-event post-terminal incident reconciles read-only with no authority'
  );
}

{
  const sandbox =
    makeHarness();

  assert.throws(
    () => sandbox
      .reosCountyCollapseGroup2PostTerminalReconciliationStatus(
        {}
      ),
    /takes no arguments/
  );

  pass(
    'public RPC accepts no caller-defined authority'
  );
}

expectFailure(
  'Admin denial fails before evidence result',
  state => {
    state.adminAllowed = false;
  },
  /ADMIN_DENIED/
);

expectFailure(
  'operation inventory drift fails closed',
  state => {
    state.operationIds.push(
      'unexpected-operation'
    );
  },
  /exactly the incident operation/
);

expectFailure(
  'prepared event hash drift fails closed',
  state => {
    state.history.events[0]
      .manifest
      .eventSha256 =
        '0'.repeat(64);
  },
  /Prepared event drift/
);

expectFailure(
  'terminal event hash drift fails closed',
  state => {
    state.history.events[1]
      .manifest
      .eventSha256 =
        '1'.repeat(64);
  },
  /Terminal event drift/
);

expectFailure(
  'terminal payload hash drift fails closed',
  state => {
    state.history.events[1]
      .manifest
      .payloadSha256 =
        '2'.repeat(64);
  },
  /Terminal event drift/
);

expectFailure(
  'terminal previous-event hash drift fails closed',
  state => {
    state.history.events[1]
      .manifest
      .previousEventSha256 =
        '3'.repeat(64);
  },
  /Terminal event drift/
);

expectFailure(
  'third journal event fails closed',
  state => {
    state.history.events.push(
      clone(
        state.history.events[1]
      )
    );
  },
  /identity drift/
);

expectFailure(
  'recovery classification drift fails closed',
  state => {
    state.recovery.classification =
      'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';
  },
  /recovery classification drift/
);

expectFailure(
  'verified-delete residual drift fails closed',
  state => {
    state.residual.verifiedDeletes = [
      {
        targetDeleteDistressLeadId:
          TARGET
      }
    ];
  },
  /residual classification drift/
);

expectFailure(
  'missing target live row fails closed',
  state => {
    state.residual.currentRows =
      state.residual.currentRows.filter(
        row =>
          row.distressLeadId !==
          TARGET
      );
  },
  /not exactly two rows/
);

expectFailure(
  'duplicate live identity fails closed',
  state => {
    state.residual.currentRows[1]
      .distressLeadId =
        WINNER;
  },
  /winner\/target membership drift|invalid or duplicated/
);

expectFailure(
  'scheduler thaw fails closed',
  state => {
    state.preflight.schedulerAfter
      .triggerCount = 1;
  },
  /scheduler\/preflight evidence drift/
);

expectFailure(
  'checkpoint drift fails closed',
  state => {
    state.preflight.checkpointAfter
      .currentFeedCursor =
        'DRIFT';
  },
  /frozen checkpoint/
);

expectFailure(
  'terminal retirement payload drift fails closed',
  state => {
    const parsed =
      JSON.parse(
        state.history.events[1]
          .canonicalPayload
      );

    parsed.data.noPhysicalDeleteClaim =
      false;

    state.history.events[1]
      .canonicalPayload =
        JSON.stringify(parsed);
  },
  /terminal payload drift/
);

expectFailure(
  'collapse authority drift fails closed',
  state => {
    state.residual.authoritySha256 =
      '4'.repeat(64);
  },
  /residual authority drift/
);

console.log('');
console.log(
  'GROUP2_POST_TERMINAL_RECONCILIATION_BEHAVIOR_CASES=' +
  cases
);

console.log(
  'GROUP2_POST_TERMINAL_RECONCILIATION_VALIDATION_PASSED=true'
);

console.log(
  'POST_TERMINAL_RECONCILIATION_READ_ONLY=true'
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
