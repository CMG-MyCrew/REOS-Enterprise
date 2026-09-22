#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const vm =
  require('node:vm');

const BASE =
  '17d398d028312952c8b7038611ee4874d404f3ea';

const BASE_TREE =
  'dd3f5fdb54554e006a4188b782e41109dac2c3c5';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const SELF =
  'scripts/validate-county-collapse-group2-executor-history-exception-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const AUTH_DOC =
  'docs/county-collapse-group2-executor-history-exception-authorization-v1.md';

const AUTH_DOC_SHA =
  '62b2ef5eca236330c2e09ea6c1e79a71bb3a8cc07f531a750eb53aeb97cdb439';

const EXPECTED_EXECUTOR_SHA =
  'dd1d04f6c16dc127d1c5380cd7a92f325724bf37640a6ff4459a056ce87a78f4';

const EXPECTED_WORKFLOW_SHA =
  '5715ddca7d6cdc33d38dab7ccc66252ea68d07dc657de8e17b4eb5c54f2bb232';

const EXPECTED_INTEGRATION_SHA =
  'f703ab59019802e61e88b55f73a70e86b7e148a544e2d93c1b8e8a3f0caa297e';

const INCIDENT =
  '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

const WINNER =
  'DL-20260820181645-7130';

const TARGET =
  'DL-20260820181652-6183';

const PREPARED_EVENT_SHA =
  '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

const PREPARED_PAYLOAD_SHA =
  '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

const TERMINAL_EVENT_SHA =
  '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89';

const TERMINAL_PAYLOAD_SHA =
  '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2';

const RECOVERY =
  'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

const MODE =
  'READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1';

const EXECUTOR_VERSION =
  'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1';

const OPERATION_CREATED_AT =
  '2026-09-20T23:49:45.327Z';

const EXPECTED_SCOPE = [
  EXECUTOR,
  SELF,
  WORKFLOW,
  INTEGRATION
].sort();

const PROTECTED = [
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js',
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js',
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js',
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js',
  'build/apps-script-brand/CountyMutationExclusionLease.js',
  'build/apps-script-brand/Database.js'
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

function sha256(path) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(path)
    )
    .digest('hex');
}

function clone(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

console.log(
  '=== GROUP 2 EXECUTOR-HISTORY EXCEPTION IMPLEMENTATION V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Implementation branch must descend from exact authorization merge.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Implementation base tree changed.'
);

assert.equal(
  sha256(AUTH_DOC),
  AUTH_DOC_SHA,
  'Merged authorization document changed.'
);

assert.equal(
  sha256(EXECUTOR),
  EXPECTED_EXECUTOR_SHA,
  'Executor implementation bytes changed.'
);

assert.equal(
  sha256(WORKFLOW),
  EXPECTED_WORKFLOW_SHA,
  'Workflow implementation bytes changed.'
);

assert.equal(
  sha256(INTEGRATION),
  EXPECTED_INTEGRATION_SHA,
  'Runtime integration implementation bytes changed.'
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
    'Protected runtime surface changed: ' +
      path
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
  Array.from(effective).sort(),
  EXPECTED_SCOPE,
  'Implementation increment must remain exactly four files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Implementation candidate must remain unstaged during local certification.'
);

const executorSource =
  fs.readFileSync(
    EXECUTOR,
    'utf8'
  );

const workflowSource =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

const integrationSource =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

[
  'GROUP2_CERTIFIED_POST_TERMINAL_HISTORY_EXCEPTION_V1',
  INCIDENT,
  WINNER,
  TARGET,
  PREPARED_EVENT_SHA,
  PREPARED_PAYLOAD_SHA,
  TERMINAL_EVENT_SHA,
  TERMINAL_PAYLOAD_SHA,
  RECOVERY,
  MODE,
  'function certifiedGroup2HistoryExceptionRequest_(',
  'function assertCertifiedGroup2HistoryExceptionHistory_(',
  'function assertFreshCertifiedGroup2HistoryExceptionEvidence_(',
  'function assertNoTargetBoundOperationHistory_('
].forEach(marker => {
  assert.ok(
    executorSource.includes(marker),
    'Executor missing certified history-exception marker: ' +
      marker
  );
});

const guardCall =
  executorSource.indexOf(
    'assertNoTargetBoundOperationHistory_(\n' +
    '              store,\n' +
    '              request\n' +
    '            );'
  );

const prepareCall =
  executorSource.indexOf(
    'store.prepare('
  );

assert.ok(
  guardCall >= 0 &&
  prepareCall > guardCall,
  'History exception guard must remain before durable prepare.'
);

assert.equal(
  (
    executorSource.match(
      /\.deletePhysicalRowExact\s*\(/g
    ) || []
  ).length,
  1,
  'Executor must retain exactly one physical-delete call site.'
);

assert.ok(
  workflowSource.includes(
    'Validate certified Group 2 executor-history exception authorization v1'
  ),
  'Completed authorization validator must transition to certified replay.'
);

assert.ok(
  workflowSource.includes(
    'git worktree add --detach "$wt" ' +
      BASE
  ),
  'Authorization replay must pin the exact certified merge.'
);

assert.ok(
  workflowSource.includes(
    `test "$(git rev-parse 'HEAD^{tree}')" = "${BASE_TREE}"`
  ),
  'Authorization replay must pin the exact certified tree.'
);

assert.ok(
  workflowSource.includes(
    'Validate Group 2 executor-history exception v1'
  ),
  'Current implementation validator workflow step is missing.'
);

assert.equal(
  workflowSource.includes(
    '      - name: Validate Group 2 executor-history exception authorization v1\n' +
    '        run: node scripts/validate-county-collapse-group2-executor-history-exception-authorization-v1.js'
  ),
  false,
  'Completed authorization validator must not run directly against implementation source.'
);

assert.equal(
  integrationSource
    .split(
      "'validate-county-collapse-group2-executor-history-exception-v1.js'"
    ).length - 1,
  1,
  'Runtime integration must register the implementation validator exactly once.'
);

const runtimeReturn =
  "  return Object.freeze({\n" +
  "    execute:\n" +
  "      execute\n" +
  "  });\n" +
  "})();";

assert.equal(
  executorSource
    .split(runtimeReturn)
    .length - 1,
  1,
  'Executor public return boundary changed.'
);

const exposedReturn =
  "  return Object.freeze({\n" +
  "    execute:\n" +
  "      execute,\n" +
  "    __testHistoryGuard:\n" +
  "      assertNoTargetBoundOperationHistory_,\n" +
  "    __testRequestFields:\n" +
  "      REQUEST_FIELDS.slice()\n" +
  "  });\n" +
  "})();";

const testSource =
  executorSource.replace(
    runtimeReturn,
    exposedReturn
  );

function baseStatus() {
  return {
    ok:
      true,
    mode:
      MODE,
    contractVersion:
      1,
    operationId:
      INCIDENT,
    groupNumber:
      2,
    winnerDistressLeadId:
      WINNER,
    targetDeleteDistressLeadId:
      TARGET,
    operationCreatedTimestampUtc:
      OPERATION_CREATED_AT,
    preparedEventSha256:
      PREPARED_EVENT_SHA,
    preparedPayloadSha256:
      PREPARED_PAYLOAD_SHA,
    terminalEventSha256:
      TERMINAL_EVENT_SHA,
    terminalPayloadSha256:
      TERMINAL_PAYLOAD_SHA,
    journalReadbackDecoded:
      true,
    journalEventCount:
      2,
    journalEventTypes:
      [
        'INTENT_PREPARED',
        'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
      ],
    recoveryClassification:
      RECOVERY,
    winnerPresent:
      true,
    targetPresent:
      true,
    deleteBarrierPresent:
      false,
    verifiedDeletePresent:
      false,
    schedulerFrozen:
      true,
    checkpointFrozen:
      true,
    residualExecutionBlocked:
      false,
    postTerminalReconciliationComplete:
      true,
    executorHistoryExceptionEvidenceEligible:
      true,
    journalMutationExecuted:
      false,
    automaticRetryPermitted:
      false,
    executorRetryAuthorityGranted:
      false,
    executorHistoryExceptionImplementationAuthorityGranted:
      false,
    successorExecutionAuthorityGranted:
      false,
    collapseExecutionAuthorityGranted:
      false,
    physicalDeleteAuthorityGranted:
      false,
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
    rowRecreationPermitted:
      false,
    automaticMaoAuthorityGranted:
      false,
    automaticOfferAuthorityGranted:
      false
  };
}

function exactHistory(
  operationId = INCIDENT,
  target = TARGET
) {
  return {
    found:
      true,
    operationId,
    events: [
      {
        manifest: {
          operationId,
          eventSequence:
            1,
          eventType:
            'INTENT_PREPARED',
          operationIntentContractVersion:
            1,
          executorImplementationVersion:
            EXECUTOR_VERSION,
          groupNumber:
            2,
          winnerDistressLeadId:
            WINNER,
          targetDeleteDistressLeadId:
            target,
          payloadSha256:
            PREPARED_PAYLOAD_SHA,
          previousEventSha256:
            'GENESIS',
          eventSha256:
            PREPARED_EVENT_SHA
        }
      },
      {
        manifest: {
          operationId,
          eventSequence:
            2,
          eventType:
            'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
          operationIntentContractVersion:
            1,
          executorImplementationVersion:
            EXECUTOR_VERSION,
          groupNumber:
            2,
          winnerDistressLeadId:
            WINNER,
          targetDeleteDistressLeadId:
            target,
          payloadSha256:
            TERMINAL_PAYLOAD_SHA,
          previousEventSha256:
            PREPARED_EVENT_SHA,
          eventSha256:
            TERMINAL_EVENT_SHA
        }
      }
    ]
  };
}

function exactRecovery(
  operationId = INCIDENT
) {
  return {
    operationId,
    found:
      true,
    classification:
      RECOVERY,
    automaticRetryPermitted:
      false,
    rowRecreationPermitted:
      false,
    journalMutationExecuted:
      false,
    eventCount:
      2
  };
}

function baseRequest() {
  return {
    confirmExecution:
      'CONFIRM_DIRECT_KEEP_COLLAPSE_EXECUTION_V1',
    groupNumber:
      2,
    deleteDistressLeadId:
      TARGET,
    expectedWinnerDistressLeadId:
      WINNER,
    expectedPlanFingerprintSha256:
      '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce',
    expectedAuthoritySha256:
      '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7',
    maintenanceToken:
      'TOKEN',
    expectedMaintenanceLeaseId:
      'LEASE',
    expectedMaintenanceGateId:
      'GATE'
  };
}

function scenario(options = {}) {
  const histories = {};

  if (options.noIncident !== true) {
    histories[INCIDENT] =
      exactHistory();
  }

  if (options.mutateHistory) {
    options.mutateHistory(
      histories[INCIDENT]
    );
  }

  Object.assign(
    histories,
    options.extraHistories || {}
  );

  const recovery =
    exactRecovery();

  if (options.mutateRecovery) {
    options.mutateRecovery(
      recovery
    );
  }

  const status =
    baseStatus();

  if (options.mutateStatus) {
    options.mutateStatus(
      status
    );
  }

  const state = {
    statusCalls:
      0,
    recoveryCalls:
      0
  };

  const REOS = {};

  if (!options.missingStatusModule) {
    REOS.CountyCollapseGroup2PostTerminalReconciliation = {
      status() {
        state.statusCalls++;

        if (options.statusThrows) {
          throw new Error(
            'POST_TERMINAL_STATUS_FAILED'
          );
        }

        return clone(
          status
        );
      }
    };
  }

  const sandbox = {
    REOS,
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
    testSource,
    context,
    {
      filename:
        EXECUTOR
    }
  );

  const api =
    context.REOS
      .CountyCodeViolationCollapseExecutor;

  const request =
    Object.assign(
      baseRequest(),
      options.request || {}
    );

  const operationIds =
    options.operationIds !==
      undefined
      ? clone(
          options.operationIds
        )
      : Object.keys(
          histories
        ).sort();

  const store = {
    listOperationIds() {
      return clone(
        operationIds
      );
    },

    read(operationId) {
      if (
        options.malformedReadOperationId ===
          operationId
      ) {
        return {
          found:
            true,
          operationId,
          events:
            []
        };
      }

      return clone(
        histories[operationId]
      );
    },

    recover(operationId) {
      state.recoveryCalls++;

      return Object.assign(
        {},
        clone(recovery),
        {
          operationId
        }
      );
    }
  };

  if (options.removeRecover) {
    delete store.recover;
  }

  return {
    api,
    request,
    state,
    invoke() {
      return api
        .__testHistoryGuard(
          store,
          request
        );
    }
  };
}

let count = 0;

function test(name, work) {
  work();

  count++;

  console.log(
    'PASS CASE ' +
    String(count)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

function blocked(options) {
  const h =
    scenario(options);

  assert.throws(
    () =>
      h.invoke()
  );

  return h;
}

test(
  'exact certified incident is non-blocking with fresh evidence',
  () => {
    const h =
      scenario();

    h.invoke();

    assert.equal(
      h.state.recoveryCalls,
      1
    );

    assert.equal(
      h.state.statusCalls,
      1
    );
  }
);

test(
  'zero prior operation history remains normal non-blocking behavior',
  () => {
    const h =
      scenario({
        noIncident:
          true
      });

    h.invoke();

    assert.equal(
      h.state.statusCalls,
      0
    );
  }
);

test(
  'unrelated non-target history remains non-blocking',
  () => {
    const h =
      scenario({
        noIncident:
          true,
        extraHistories: {
          'OTHER-1':
            exactHistory(
              'OTHER-1',
              'OTHER-TARGET'
            )
        }
      });

    h.invoke();

    assert.equal(
      h.state.statusCalls,
      0
    );
  }
);

test(
  'wrong operation ID target-bound history fails closed',
  () => {
    blocked({
      noIncident:
        true,
      extraHistories: {
        '7bad0000-0000-0000-0000-000000000000':
          exactHistory(
            '7bad0000-0000-0000-0000-000000000000'
          )
      }
    });
  }
);

test(
  'wrong group cannot consume the incident exception',
  () => {
    blocked({
      request: {
        groupNumber:
          4
      }
    });
  }
);

test(
  'wrong winner cannot consume the incident exception',
  () => {
    blocked({
      request: {
        expectedWinnerDistressLeadId:
          'WRONG-WINNER'
      }
    });
  }
);

test(
  'wrong incident target identity fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[0]
          .manifest
          .targetDeleteDistressLeadId =
            'WRONG-TARGET';
      }
    });
  }
);

test(
  'wrong prepared event SHA fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[0]
          .manifest
          .eventSha256 =
            'BAD';
      }
    });
  }
);

test(
  'wrong prepared payload SHA fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[0]
          .manifest
          .payloadSha256 =
            'BAD';
      }
    });
  }
);

test(
  'wrong terminal event SHA fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .eventSha256 =
            'BAD';
      }
    });
  }
);

test(
  'wrong terminal payload SHA fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .payloadSha256 =
            'BAD';
      }
    });
  }
);

test(
  'wrong terminal previous-event SHA fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .previousEventSha256 =
            'BAD';
      }
    });
  }
);

test(
  'prepared-only history fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events =
          history.events.slice(
            0,
            1
          );
      }
    });
  }
);

test(
  'third event fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events.push(
          clone(
            history.events[1]
          )
        );
      }
    });
  }
);

test(
  'wrong first event sequence fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[0]
          .manifest
          .eventSequence =
            2;
      }
    });
  }
);

test(
  'wrong terminal event sequence fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .eventSequence =
            3;
      }
    });
  }
);

test(
  'delete-barrier event cannot qualify',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .eventType =
            'DELETE_INVOCATION_STARTED';
      }
    });
  }
);

test(
  'post-delete verified event cannot qualify',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .eventType =
            'POSTDELETE_VERIFIED';
      }
    });
  }
);

test(
  'verified-delete terminal cannot qualify',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .eventType =
            'COLLAPSE_DELETE_VERIFIED';
      }
    });
  }
);

test(
  'uncertain terminal cannot qualify',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .eventType =
            'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN';
      }
    });
  }
);

test(
  'executor implementation version drift fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[0]
          .manifest
          .executorImplementationVersion =
            'WRONG';
      }
    });
  }
);

test(
  'durable history group drift fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[0]
          .manifest
          .groupNumber =
            3;
      }
    });
  }
);

test(
  'durable history winner drift fails closed',
  () => {
    blocked({
      mutateHistory(history) {
        history.events[1]
          .manifest
          .winnerDistressLeadId =
            'WRONG';
      }
    });
  }
);

test(
  'wrong recovery classification fails closed',
  () => {
    blocked({
      mutateRecovery(recovery) {
        recovery.classification =
          'WRONG';
      }
    });
  }
);

test(
  'wrong recovery event count fails closed',
  () => {
    blocked({
      mutateRecovery(recovery) {
        recovery.eventCount =
          3;
      }
    });
  }
);

test(
  'automatic-retry recovery state fails closed',
  () => {
    blocked({
      mutateRecovery(recovery) {
        recovery.automaticRetryPermitted =
          true;
      }
    });
  }
);

test(
  'row-recreation recovery state fails closed',
  () => {
    blocked({
      mutateRecovery(recovery) {
        recovery.rowRecreationPermitted =
          true;
      }
    });
  }
);

test(
  'journal-mutation recovery state fails closed',
  () => {
    blocked({
      mutateRecovery(recovery) {
        recovery.journalMutationExecuted =
          true;
      }
    });
  }
);

test(
  'missing strict recovery API fails closed',
  () => {
    blocked({
      removeRecover:
        true
    });
  }
);

test(
  'missing post-terminal evidence reader fails closed',
  () => {
    blocked({
      missingStatusModule:
        true
    });
  }
);

test(
  'post-terminal reader failure fails closed',
  () => {
    blocked({
      statusThrows:
        true
    });
  }
);

test(
  'post-terminal mode drift fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.mode =
          'WRONG';
      }
    });
  }
);

test(
  'evidence-ineligible post-terminal result fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.executorHistoryExceptionEvidenceEligible =
          false;
      }
    });
  }
);

test(
  'post-terminal production-mutation authority fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.productionDataMutationAuthorityGranted =
          true;
      }
    });
  }
);

test(
  'post-terminal executor-retry authority fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.executorRetryAuthorityGranted =
          true;
      }
    });
  }
);

test(
  'post-terminal physical-delete authority fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.physicalDeleteAuthorityGranted =
          true;
      }
    });
  }
);

test(
  'post-terminal implementation-authority drift fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.executorHistoryExceptionImplementationAuthorityGranted =
          true;
      }
    });
  }
);

test(
  'post-terminal delete-barrier evidence fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.deleteBarrierPresent =
          true;
      }
    });
  }
);

test(
  'post-terminal verified-delete evidence fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.verifiedDeletePresent =
          true;
      }
    });
  }
);

test(
  'scheduler unfrozen evidence fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.schedulerFrozen =
          false;
      }
    });
  }
);

test(
  'checkpoint unfrozen evidence fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.checkpointFrozen =
          false;
      }
    });
  }
);

test(
  'journal event-order drift fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.journalEventTypes =
          [
            'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
            'INTENT_PREPARED'
          ];
      }
    });
  }
);

test(
  'post-terminal operation identity drift fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.operationId =
          'WRONG';
      }
    });
  }
);

test(
  'winner absence in fresh evidence fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.winnerPresent =
          false;
      }
    });
  }
);

test(
  'target absence in fresh evidence fails closed',
  () => {
    blocked({
      mutateStatus(status) {
        status.targetPresent =
          false;
      }
    });
  }
);

test(
  'second target-bound operation fails closed',
  () => {
    blocked({
      extraHistories: {
        '7fffffff-ffff-ffff-ffff-ffffffffffff':
          exactHistory(
            '7fffffff-ffff-ffff-ffff-ffffffffffff'
          )
      }
    });
  }
);

test(
  'non-Group-2 target-bound history remains blocked',
  () => {
    blocked({
      noIncident:
        true,
      request: {
        groupNumber:
          4
      },
      extraHistories: {
        '70000000-0000-0000-0000-000000000000':
          exactHistory(
            '70000000-0000-0000-0000-000000000000'
          )
      }
    });
  }
);

test(
  'malformed operation enumeration fails closed',
  () => {
    blocked({
      operationIds:
        null
    });
  }
);

test(
  'non-strict operation ordering fails closed',
  () => {
    blocked({
      operationIds: [
        INCIDENT,
        INCIDENT
      ]
    });
  }
);

test(
  'malformed enumerated history fails closed',
  () => {
    blocked({
      malformedReadOperationId:
        INCIDENT
    });
  }
);

test(
  'executor request schema remains unchanged and caller-bypass-free',
  () => {
    const h =
      scenario({
        noIncident:
          true
      });

    const fields =
      Array.from(
        h.api.__testRequestFields
      );

    assert.deepEqual(
      fields,
      [
        'confirmExecution',
        'groupNumber',
        'deleteDistressLeadId',
        'expectedWinnerDistressLeadId',
        'expectedPlanFingerprintSha256',
        'expectedAuthoritySha256',
        'maintenanceToken',
        'expectedMaintenanceLeaseId',
        'expectedMaintenanceGateId'
      ]
    );

    assert.equal(
      fields.some(
        field =>
          /history|exception|bypass|retry/i.test(
            field
          )
      ),
      false
    );
  }
);

const normalSandbox = {
  REOS: {},
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

const normalContext =
  vm.createContext(
    normalSandbox
  );

vm.runInContext(
  executorSource,
  normalContext,
  {
    filename:
      EXECUTOR
  }
);

assert.deepEqual(
  Object.keys(
    normalContext
      .REOS
      .CountyCodeViolationCollapseExecutor
  ).sort(),
  [
    'execute'
  ]
);

assert.ok(
  count >= 30,
  'Implementation validator must contain at least 30 behavior cases.'
);

[
  EXECUTOR,
  SELF,
  WORKFLOW,
  INTEGRATION
].forEach(path => {
  fs.readFileSync(
    path,
    'utf8'
  )
    .split('\n')
    .forEach((line, index) => {
      assert.equal(
        /[ \t]+$/.test(line),
        false,
        'Trailing whitespace: ' +
          path +
          ':' +
          String(index + 1)
      );
    });
});

const diffCheck =
  git([
    'diff',
    '--check'
  ]);

assert.equal(
  diffCheck.status,
  0,
  String(diffCheck.stderr || '')
);

console.log('');
console.log(
  'HISTORY_EXCEPTION_RUNTIME_BEHAVIOR_CASES=' +
  count
);

console.log(
  'EXACT_INCIDENT_EXCEPTION_DEFINED=true'
);

console.log(
  'EXACT_TWO_EVENT_HISTORY_REQUIRED=true'
);

console.log(
  'FRESH_POST_TERMINAL_EVIDENCE_REQUIRED=true'
);

console.log(
  'SECOND_TARGET_BOUND_OPERATION_FAILS_CLOSED=true'
);

console.log(
  'CALLER_CONTROLLED_BYPASS_PROHIBITED=true'
);

console.log(
  'GENERIC_TERMINAL_BYPASS_PROHIBITED=true'
);

console.log(
  'UNCERTAIN_OPERATION_BYPASS_PROHIBITED=true'
);

console.log(
  'VERIFIED_DELETE_BYPASS_PROHIBITED=true'
);

console.log(
  'REQUEST_SCHEMA_UNCHANGED=true'
);

console.log(
  'PHYSICAL_DELETE_CALL_SITES=1'
);

console.log(
  'GROUP2_EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_VALIDATION_PASSED=true'
);

console.log(
  'EXECUTOR_RETRY_AUTHORIZED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'RPC_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
