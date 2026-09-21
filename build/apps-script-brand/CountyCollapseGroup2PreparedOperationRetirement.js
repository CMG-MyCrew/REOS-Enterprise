/**
 * REOS Enterprise
 *
 * Group 2 prepared-operation retirement v1.
 *
 * INCIDENT BOUNDED.
 *
 * This module may append exactly one pre-barrier
 * COLLAPSE_EXECUTOR_PRECONDITION_FAILED terminal to the certified
 * stranded Group 2 operation.
 *
 * It does not delete county data, retry the executor, close maintenance,
 * restore the scheduler, mutate the checkpoint, or grant MAO/offer authority.
 */

var REOS = REOS || {};

REOS.CountyCollapseGroup2PreparedOperationRetirement =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;

  var MODE_ =
    'GROUP2_PREPARED_OPERATION_RETIREMENT_V1';

  var CONFIRM_TOKEN_ =
    'CONFIRM_GROUP2_PREPARED_OPERATION_RETIREMENT_V1';

  var OPERATION_ID_ =
    '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

  var GROUP_NUMBER_ = 2;

  var WINNER_ID_ =
    'DL-20260820181645-7130';

  var TARGET_ID_ =
    'DL-20260820181652-6183';

  var OPERATION_CREATED_AT_ =
    '2026-09-20T23:49:45.327Z';

  var PREPARED_EVENT_SHA256_ =
    '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

  var PREPARED_PAYLOAD_SHA256_ =
    '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

  var LIVE_V2_RAW_SHA256_ =
    '99d049d2364a470c44827ac8aeaa1228e17b521fa5044565a3a71ee1aeccbd8b';

  var LIVE_V2_JSON_SHA256_ =
    '330c2ee6392a4d396213da868765f3c0321982ea17763f4c585a8ee2c61ddeb6';

  var PRE_RECOVERY_ =
    'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

  var POST_RECOVERY_ =
    'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

  var CHECKPOINT_ID_ =
    'COUNTY-20260902222607805';

  var CHECKPOINT_CURSOR_ =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

  var SCHEDULER_HANDLER_ =
    'reosCountyProductionSchedulerRun';

  var INVOCATION_FIELDS_ = [
    'confirmRetirement',
    'expectedGateId',
    'expectedLeaseId',
    'maintenanceToken',
    'operationId',
    'preparedEventSha256',
    'preparedPayloadSha256'
  ];

  function fail_(message) {
    throw new Error(
      'County collapse Group 2 prepared-operation retirement: ' +
      message
    );
  }

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function plainObject_(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  function exactFields_(
    value,
    expected,
    label
  ) {
    if (!plainObject_(value)) {
      fail_(
        label +
        ' must be an object.'
      );
    }

    var actual =
      Object.keys(value)
        .slice()
        .sort();

    expected =
      expected
        .slice()
        .sort();

    if (
      actual.length !==
      expected.length
    ) {
      fail_(
        label +
        ' fields are not exact.'
      );
    }

    for (
      var index = 0;
      index < expected.length;
      index++
    ) {
      if (
        actual[index] !==
        expected[index]
      ) {
        fail_(
          label +
          ' fields are not exact.'
        );
      }
    }
  }

  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      fail_(
        'Admin authority support is unavailable.'
      );
    }

    if (
      !REOS.Database ||
      typeof REOS.Database.withScriptLockContext !==
        'function' ||
      typeof REOS.Database.assertScriptLockContext !==
        'function'
    ) {
      fail_(
        'Certified Database ScriptLock support is unavailable.'
      );
    }

    var store =
      REOS.CountyCollapseOperationIntentStore;

    if (
      !store ||
      typeof store.append !==
        'function' ||
      typeof store.read !==
        'function' ||
      typeof store.recover !==
        'function'
    ) {
      fail_(
        'Certified operation-intent store support is unavailable.'
      );
    }

    var reconciliation =
      REOS
        .CountyCollapseGroup2StrandedOperationReconciliation;

    if (
      !reconciliation ||
      typeof reconciliation.status !==
        'function'
    ) {
      fail_(
        'Certified Group 2 V2 reconciliation support is unavailable.'
      );
    }

    var preflight =
      REOS
        .CountyCodeViolationCollapseExecutionPreflightV2;

    if (
      !preflight ||
      typeof preflight.preflight !==
        'function'
    ) {
      fail_(
        'Certified successor preflight support is unavailable.'
      );
    }

    var maintenance =
      REOS
        .CountyCodeViolationCollapseMaintenanceGate;

    if (
      !maintenance ||
      typeof maintenance.assertReady !==
        'function'
    ) {
      fail_(
        'Certified CURRENT maintenance readiness support is unavailable.'
      );
    }

    return {
      store:
        store,
      reconciliation:
        reconciliation,
      preflight:
        preflight,
      maintenance:
        maintenance
    };
  }

  function requireInvocation_(options) {
    exactFields_(
      options,
      INVOCATION_FIELDS_,
      'Retirement invocation'
    );

    if (
      options.confirmRetirement !==
        CONFIRM_TOKEN_ ||
      text_(
        options.operationId
      ) !==
        OPERATION_ID_ ||
      text_(
        options.preparedEventSha256
      ) !==
        PREPARED_EVENT_SHA256_ ||
      text_(
        options.preparedPayloadSha256
      ) !==
        PREPARED_PAYLOAD_SHA256_ ||
      text_(
        options.maintenanceToken
      ) ===
        '' ||
      text_(
        options.expectedLeaseId
      ) ===
        '' ||
      text_(
        options.expectedGateId
      ) ===
        ''
    ) {
      fail_(
        'Retirement invocation authority mismatch.'
      );
    }
  }

  function validateIncident_(
    value,
    label
  ) {
    if (
      !value ||
      value.ok !== true ||
      value.mode !==
        'READ_ONLY_GROUP2_STRANDED_OPERATION_RECONCILIATION_V2' ||
      Number(
        value.contractVersion
      ) !==
        2 ||
      value.operationId !==
        OPERATION_ID_ ||
      Number(
        value.groupNumber
      ) !==
        GROUP_NUMBER_ ||
      value.winnerDistressLeadId !==
        WINNER_ID_ ||
      value.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      value.operationCreatedTimestampUtc !==
        OPERATION_CREATED_AT_ ||
      value.preparedEventSha256 !==
        PREPARED_EVENT_SHA256_ ||
      value.preparedPayloadSha256 !==
        PREPARED_PAYLOAD_SHA256_ ||
      value.journalReadbackDecoded !==
        true ||
      Number(
        value.journalEventCount
      ) !==
        1 ||
      value.journalEventType !==
        'INTENT_PREPARED' ||
      value.recoveryClassification !==
        PRE_RECOVERY_ ||
      value.deleteBarrierPresent !==
        false ||
      value.verifiedDeletePresent !==
        false ||
      value.winnerPresent !==
        true ||
      value.targetPresent !==
        true ||
      value.residualExecutionBlocked !==
        false ||
      !Array.isArray(
        value.residualExecutionBlockers
      ) ||
      value.residualExecutionBlockers.length !==
        0 ||
      value.targetBoundPreparedOperationHistoryPresent !==
        true ||
      value.liveReadOnlyReconciliationRequired !==
        true ||
      value.automaticRetryPermitted !==
        false ||
      value.executorRetryAuthorityGranted !==
        false ||
      value.rowRecreationPermitted !==
        false ||
      value.journalMutationExecuted !==
        false ||
      value.collapseExecutionAuthorityGranted !==
        false ||
      value.physicalDeleteAuthorityGranted !==
        false ||
      value.productionDataMutationAuthorityGranted !==
        false ||
      value.maintenanceMutationAuthorityGranted !==
        false ||
      value.schedulerMutationAuthorityGranted !==
        false ||
      value.checkpointMutationAuthorityGranted !==
        false ||
      value.connectorExecutionAuthorityGranted !==
        false ||
      value.automaticMaoAuthorityGranted !==
        false ||
      value.automaticOfferAuthorityGranted !==
        false
    ) {
      fail_(
        label +
        ' is not the exact certified prepared-only incident state.'
      );
    }

    var winnerRow =
      Number(
        value.winnerCurrentRowNumber
      );

    var targetRow =
      Number(
        value.targetCurrentRowNumber
      );

    if (
      !Number.isInteger(
        winnerRow
      ) ||
      winnerRow < 2 ||
      !Number.isInteger(
        targetRow
      ) ||
      targetRow < 2 ||
      winnerRow === targetRow
    ) {
      fail_(
        label +
        ' contains invalid current physical row evidence.'
      );
    }

    return {
      winnerRow:
        winnerRow,
      targetRow:
        targetRow
    };
  }

  function exactFrozenCheckpoint_(
    checkpoint,
    fieldName
  ) {
    if (
      !checkpoint ||
      checkpoint.id !==
        CHECKPOINT_ID_ ||
      Number(
        checkpoint.nextFeedIndex
      ) !==
        0 ||
      checkpoint.currentFeedCursor !==
        CHECKPOINT_CURSOR_ ||
      Number(
        checkpoint.completedFeeds
      ) !==
        0 ||
      Number(
        checkpoint.totalFeeds
      ) !==
        4 ||
      Number(
        checkpoint.resultCount
      ) !==
        0
    ) {
      fail_(
        fieldName +
        ' does not match the frozen county checkpoint.'
      );
    }
  }

  function validatePreflight_(
    value,
    label
  ) {
    if (
      !value ||
      value.ok !== true ||
      value.mode !==
        'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT_V2' ||
      value.schedulerFrozen !==
        true ||
      value.checkpointFrozen !==
        true ||
      !value.schedulerBefore ||
      Number(
        value.schedulerBefore.triggerCount
      ) !==
        0 ||
      value.schedulerBefore.handler !==
        SCHEDULER_HANDLER_ ||
      !value.schedulerAfter ||
      Number(
        value.schedulerAfter.triggerCount
      ) !==
        0 ||
      value.schedulerAfter.handler !==
        SCHEDULER_HANDLER_ ||
      !Array.isArray(
        value.executionBlockers
      ) ||
      value.executionBlockers.length !==
        0 ||
      !Array.isArray(
        value.uncertainOperationIds
      ) ||
      value.uncertainOperationIds.length !==
        0 ||
      value.collapseExecutionReady !==
        true ||
      value.executionAuthorityGranted !==
        false ||
      value.collapseAuthorityGranted !==
        false ||
      value.deleteAuthorityGranted !==
        false ||
      value.physicalDeleteAuthorityGranted !==
        false ||
      value.productionDataMutationAuthorityGranted !==
        false ||
      value.connectorExecutionAuthorityGranted !==
        false ||
      value.checkpointMutationAuthorityGranted !==
        false ||
      value.schedulerAuthorityGranted !==
        false ||
      value.automaticOfferAuthorityGranted !==
        false
    ) {
      fail_(
        label +
        ' is not exact frozen successor preflight evidence.'
      );
    }

    exactFrozenCheckpoint_(
      value.checkpointBefore,
      label + ' checkpointBefore'
    );

    exactFrozenCheckpoint_(
      value.checkpointAfter,
      label + ' checkpointAfter'
    );

    return value;
  }

  function exactMaintenanceCheckpoint_(
    checkpoint
  ) {
    if (
      !checkpoint ||
      checkpoint.cycleId !==
        CHECKPOINT_ID_ ||
      Number(
        checkpoint.nextFeedIndex
      ) !==
        0 ||
      checkpoint.currentFeedCursor !==
        CHECKPOINT_CURSOR_ ||
      Number(
        checkpoint.completedFeeds
      ) !==
        0 ||
      Number(
        checkpoint.totalFeeds
      ) !==
        4 ||
      !Array.isArray(
        checkpoint.results
      ) ||
      checkpoint.results.length !==
        0
    ) {
      fail_(
        'Maintenance checkpoint binding changed.'
      );
    }
  }

  function validateMaintenance_(
    value,
    options
  ) {
    if (
      !value ||
      value.ok !== true ||
      value.ready !==
        true ||
      value.maintenanceReady !==
        true ||
      value.authorityGeneration !==
        'CURRENT' ||
      value.gateId !==
        options.expectedGateId ||
      value.leaseId !==
        options.expectedLeaseId ||
      value.schedulerHandler !==
        SCHEDULER_HANDLER_ ||
      value.manualExternalWritersQuiescentCertified !==
        true
    ) {
      fail_(
        'CURRENT maintenance readiness changed.'
      );
    }

    exactMaintenanceCheckpoint_(
      value.checkpoint
    );

    return value;
  }

  function assertSameIncident_(
    before,
    after,
    label
  ) {
    var fields = [
      'operationId',
      'winnerDistressLeadId',
      'targetDeleteDistressLeadId',
      'preparedEventSha256',
      'preparedPayloadSha256',
      'journalEventCount',
      'journalEventType',
      'recoveryClassification',
      'winnerCurrentRowNumber',
      'targetCurrentRowNumber',
      'deleteBarrierPresent',
      'verifiedDeletePresent'
    ];

    fields.forEach(function (field) {
      if (
        before[field] !==
        after[field]
      ) {
        fail_(
          label +
          ' changed incident field: ' +
          field
        );
      }
    });
  }

  function assertSamePreflight_(
    before,
    after,
    label
  ) {
    if (
      JSON.stringify(
        before.checkpointBefore
      ) !==
        JSON.stringify(
          after.checkpointBefore
        ) ||
      JSON.stringify(
        before.checkpointAfter
      ) !==
        JSON.stringify(
          after.checkpointAfter
        ) ||
      Number(
        before.schedulerBefore.triggerCount
      ) !==
        Number(
          after.schedulerBefore.triggerCount
        ) ||
      Number(
        before.schedulerAfter.triggerCount
      ) !==
        Number(
          after.schedulerAfter.triggerCount
        )
    ) {
      fail_(
        label +
        ' changed scheduler/checkpoint authority.'
      );
    }
  }

  function retirementPayload_() {
    return {
      retirementContractVersion:
        CONTRACT_VERSION_,

      retirementReason:
        'CERTIFIED_PREBARRIER_GROUP2_PREPARED_OPERATION_RETIREMENT',

      incidentOperationId:
        OPERATION_ID_,

      groupNumber:
        GROUP_NUMBER_,

      winnerDistressLeadId:
        WINNER_ID_,

      targetDeleteDistressLeadId:
        TARGET_ID_,

      preparedEventSha256:
        PREPARED_EVENT_SHA256_,

      preparedPayloadSha256:
        PREPARED_PAYLOAD_SHA256_,

      certifiedLiveV2RawSha256:
        LIVE_V2_RAW_SHA256_,

      certifiedLiveV2JsonSha256:
        LIVE_V2_JSON_SHA256_,

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

  function validateTerminalPayload_(
    data
  ) {
    var expected =
      retirementPayload_();

    exactFields_(
      data,
      Object.keys(expected),
      'Persisted retirement payload'
    );

    Object.keys(expected)
      .forEach(function (field) {
        if (
          data[field] !==
          expected[field]
        ) {
          fail_(
            'Persisted retirement payload drift: ' +
            field
          );
        }
      });
  }

  function validateTerminalHistory_(
    history,
    appendResult
  ) {
    if (
      !history ||
      history.found !==
        true ||
      history.operationId !==
        OPERATION_ID_ ||
      history.operationCreatedTimestampUtc !==
        OPERATION_CREATED_AT_ ||
      !Array.isArray(
        history.events
      ) ||
      history.events.length !==
        2
    ) {
      fail_(
        'Post-retirement history is not exactly two events.'
      );
    }

    var prepared =
      history.events[0];

    var terminal =
      history.events[1];

    if (
      !prepared ||
      !prepared.manifest ||
      prepared.manifest.eventType !==
        'INTENT_PREPARED' ||
      Number(
        prepared.manifest.eventSequence
      ) !==
        1 ||
      prepared.manifest.eventSha256 !==
        PREPARED_EVENT_SHA256_ ||
      prepared.manifest.payloadSha256 !==
        PREPARED_PAYLOAD_SHA256_
    ) {
      fail_(
        'Original prepared event changed during retirement.'
      );
    }

    if (
      !terminal ||
      !terminal.manifest ||
      terminal.manifest.operationId !==
        OPERATION_ID_ ||
      Number(
        terminal.manifest.eventSequence
      ) !==
        2 ||
      terminal.manifest.eventType !==
        'COLLAPSE_EXECUTOR_PRECONDITION_FAILED' ||
      Number(
        terminal.manifest.groupNumber
      ) !==
        GROUP_NUMBER_ ||
      terminal.manifest.winnerDistressLeadId !==
        WINNER_ID_ ||
      terminal.manifest.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      terminal.manifest.previousEventSha256 !==
        PREPARED_EVENT_SHA256_ ||
      terminal.manifest.eventSha256 !==
        appendResult.eventSha256 ||
      terminal.manifest.payloadSha256 !==
        appendResult.payloadSha256
    ) {
      fail_(
        'Retirement terminal manifest readback drift.'
      );
    }

    if (
      typeof terminal.canonicalPayload !==
        'string' ||
      terminal.canonicalPayload ===
        ''
    ) {
      fail_(
        'Retirement terminal canonical payload is unavailable.'
      );
    }

    var envelope;

    try {
      envelope =
        JSON.parse(
          terminal.canonicalPayload
        );
    } catch (error) {
      fail_(
        'Retirement terminal canonical payload is invalid JSON.'
      );
    }

    if (
      !envelope ||
      !plainObject_(
        envelope.data
      )
    ) {
      fail_(
        'Retirement terminal payload envelope is invalid.'
      );
    }

    validateTerminalPayload_(
      envelope.data
    );

    var types =
      history.events.map(
        function (event) {
          return event.manifest.eventType;
        }
      );

    if (
      JSON.stringify(types) !==
        JSON.stringify([
          'INTENT_PREPARED',
          'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
        ])
    ) {
      fail_(
        'Unexpected event appeared in retirement history.'
      );
    }

    return terminal;
  }

  function validatePostRecovery_(
    recovery
  ) {
    if (
      !recovery ||
      recovery.operationId !==
        OPERATION_ID_ ||
      recovery.found !==
        true ||
      recovery.classification !==
        POST_RECOVERY_ ||
      recovery.automaticRetryPermitted !==
        false ||
      recovery.rowRecreationPermitted !==
        false ||
      recovery.journalMutationExecuted !==
        false ||
      Number(
        recovery.eventCount
      ) !==
        2
    ) {
      fail_(
        'Post-retirement recovery classification drift.'
      );
    }
  }

  function authorityFreeResult_(
    value
  ) {
    return Object.freeze(
      Object.assign(
        {},
        value,
        {
          automaticRetryPermitted:
            false,

          executorRetryAuthorityGranted:
            false,

          successorExecutionAuthorityGranted:
            false,

          collapseExecutionAuthorityGranted:
            false,

          physicalDeleteAuthorityGranted:
            false,

          productionDataMutationAuthorityGranted:
            false,

          schedulerMutationAuthorityGranted:
            false,

          checkpointMutationAuthorityGranted:
            false,

          connectorExecutionAuthorityGranted:
            false,

          rowRecreationPermitted:
            false,

          maintenanceLeaseCloseAuthorityGranted:
            false,

          automaticMaintenanceClosePermitted:
            false,

          automaticMaoAuthorityGranted:
            false,

          automaticOfferAuthorityGranted:
            false
        }
      )
    );
  }

  function retire(options) {
    var dependencies =
      requireDependencies_();

    REOS.Security
      .requireAdmin();

    requireInvocation_(
      options
    );

    var preIncident =
      dependencies
        .reconciliation
        .status();

    var preRows =
      validateIncident_(
        preIncident,
        'Pre-lock V2 reconciliation'
      );

    var prePreflight =
      dependencies
        .preflight
        .preflight({});

    validatePreflight_(
      prePreflight,
      'Pre-lock successor preflight'
    );

    return REOS.Database
      .withScriptLockContext(
        function (lockContext) {
          REOS.Database
            .assertScriptLockContext(
              lockContext
            );

          var lockedIncident =
            dependencies
              .reconciliation
              .status();

          validateIncident_(
            lockedIncident,
            'Under-lock V2 reconciliation'
          );

          assertSameIncident_(
            preIncident,
            lockedIncident,
            'Pre-lock to under-lock reconciliation'
          );

          var lockedPreflight =
            dependencies
              .preflight
              .preflight({});

          validatePreflight_(
            lockedPreflight,
            'Under-lock successor preflight'
          );

          assertSamePreflight_(
            prePreflight,
            lockedPreflight,
            'Pre-lock to under-lock preflight'
          );

          var maintenance =
            dependencies
              .maintenance
              .assertReady({
                maintenanceToken:
                  options.maintenanceToken,

                expectedLeaseId:
                  options.expectedLeaseId,

                expectedGateId:
                  options.expectedGateId,

                lockContext:
                  lockContext
              });

          validateMaintenance_(
            maintenance,
            options
          );

          REOS.Database
            .assertScriptLockContext(
              lockContext
            );

          var finalIncident =
            dependencies
              .reconciliation
              .status();

          validateIncident_(
            finalIncident,
            'Final V2 reconciliation'
          );

          assertSameIncident_(
            lockedIncident,
            finalIncident,
            'Under-lock final reconciliation'
          );

          var finalPreflight =
            dependencies
              .preflight
              .preflight({});

          validatePreflight_(
            finalPreflight,
            'Final successor preflight'
          );

          assertSamePreflight_(
            lockedPreflight,
            finalPreflight,
            'Under-lock final preflight'
          );

          REOS.Database
            .assertScriptLockContext(
              lockContext
            );

          var appended =
            dependencies
              .store
              .append(
                {
                  operationId:
                    OPERATION_ID_,

                  eventType:
                    'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',

                  payload:
                    retirementPayload_()
                },
                {
                  lockContext:
                    lockContext
                }
              );

          if (
            !appended ||
            appended.operationId !==
              OPERATION_ID_ ||
            Number(
              appended.eventSequence
            ) !==
              2 ||
            appended.eventType !==
              'COLLAPSE_EXECUTOR_PRECONDITION_FAILED' ||
            appended.readbackVerified !==
              true ||
            !/^[0-9a-f]{64}$/.test(
              text_(
                appended.eventSha256
              )
            ) ||
            !/^[0-9a-f]{64}$/.test(
              text_(
                appended.payloadSha256
              )
            )
          ) {
            fail_(
              'Retirement terminal append was not durably verified.'
            );
          }

          REOS.Database
            .assertScriptLockContext(
              lockContext
            );

          var history =
            dependencies
              .store
              .read(
                OPERATION_ID_
              );

          var terminal =
            validateTerminalHistory_(
              history,
              appended
            );

          var recovery =
            dependencies
              .store
              .recover(
                OPERATION_ID_
              );

          validatePostRecovery_(
            recovery
          );

          REOS.Database
            .assertScriptLockContext(
              lockContext
            );

          return authorityFreeResult_({
            ok:
              true,

            mode:
              MODE_,

            contractVersion:
              CONTRACT_VERSION_,

            retirementExecuted:
              true,

            journalMutationExecuted:
              true,

            operationId:
              OPERATION_ID_,

            groupNumber:
              GROUP_NUMBER_,

            winnerDistressLeadId:
              WINNER_ID_,

            targetDeleteDistressLeadId:
              TARGET_ID_,

            winnerCurrentRowNumber:
              preRows.winnerRow,

            targetCurrentRowNumber:
              preRows.targetRow,

            preparedEventSha256:
              PREPARED_EVENT_SHA256_,

            preparedPayloadSha256:
              PREPARED_PAYLOAD_SHA256_,

            terminalEventSha256:
              terminal
                .manifest
                .eventSha256,

            terminalPayloadSha256:
              terminal
                .manifest
                .payloadSha256,

            journalEventCount:
              2,

            terminalEventType:
              'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',

            recoveryClassification:
              POST_RECOVERY_,

            deleteBarrierPresent:
              false,

            verifiedDeletePresent:
              false,

            maintenanceGateId:
              maintenance.gateId,

            maintenanceLeaseId:
              maintenance.leaseId,

            maintenanceReadyAtAppend:
              true,

            schedulerFrozenAtAppend:
              true,

            checkpointFrozenAtAppend:
              true,

            maintenanceWindowLeftOpen:
              true,

            postTerminalReadOnlyReconciliationRequired:
              true,

            executorHistoryExceptionImplementationAuthorityGranted:
              false
          });
        }
      );
  }

  return Object.freeze({
    retire:
      retire
  });
})();


function reosCountyCollapseGroup2PreparedOperationRetire(
  options
) {
  return REOS
    .CountyCollapseGroup2PreparedOperationRetirement
    .retire(
      options
    );
}
