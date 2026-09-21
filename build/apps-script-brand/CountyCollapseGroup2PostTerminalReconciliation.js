/**
 * REOS Enterprise
 *
 * Group 2 post-terminal reconciliation v1.
 *
 * READ ONLY.
 * INCIDENT BOUNDED.
 *
 * Reconciles the exact certified two-event Group 2 operation after
 * prepared-operation retirement.
 *
 * This module:
 *   - reads journal evidence only;
 *   - reads current residual evidence only;
 *   - reads successor preflight only for frozen scheduler/checkpoint evidence;
 *   - performs no journal mutation;
 *   - performs no county-data mutation;
 *   - grants no executor retry or physical-delete authority.
 */

var REOS = REOS || {};

REOS.CountyCollapseGroup2PostTerminalReconciliation =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;

  var MODE_ =
    'READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1';

  var OPERATION_ID_ =
    '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

  var GROUP_NUMBER_ = 2;

  var WINNER_ID_ =
    'DL-20260820181645-7130';

  var TARGET_ID_ =
    'DL-20260820181652-6183';

  var EXECUTOR_VERSION_ =
    'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1';

  var OPERATION_CREATED_AT_ =
    '2026-09-20T23:49:45.327Z';

  var PREPARED_EVENT_SHA256_ =
    '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

  var PREPARED_PAYLOAD_SHA256_ =
    '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

  var TERMINAL_EVENT_SHA256_ =
    '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89';

  var TERMINAL_PAYLOAD_SHA256_ =
    '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2';

  var LIVE_V2_RAW_SHA256_ =
    '99d049d2364a470c44827ac8aeaa1228e17b521fa5044565a3a71ee1aeccbd8b';

  var LIVE_V2_JSON_SHA256_ =
    '330c2ee6392a4d396213da868765f3c0321982ea17763f4c585a8ee2c61ddeb6';

  var AUTHORITY_SHA256_ =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

  var WINNER_PLAN_SHA256_ =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var RECOVERY_CLASSIFICATION_ =
    'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

  var SCHEDULER_HANDLER_ =
    'reosCountyProductionSchedulerRun';

  var CHECKPOINT_ID_ =
    'COUNTY-20260902222607805';

  var CHECKPOINT_CURSOR_ =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

  function fail_(message) {
    throw new Error(
      'County collapse Group 2 post-terminal reconciliation: ' +
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
      fail_(label + ' must be an object.');
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
      fail_(label + ' fields are not exact.');
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
        fail_(label + ' fields are not exact.');
      }
    }
  }

  function exactSingleValue_(
    values,
    expected,
    label
  ) {
    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      text_(values[0]) !== expected
    ) {
      fail_(
        label +
        ' must contain exactly the incident operation.'
      );
    }
  }

  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      fail_('Admin security support is unavailable.');
    }

    var store =
      REOS.CountyCollapseOperationIntentStore;

    if (
      !store ||
      typeof store.listOperationIds !== 'function' ||
      typeof store.read !== 'function' ||
      typeof store.recover !== 'function'
    ) {
      fail_(
        'Strict operation-intent read/recovery support is unavailable.'
      );
    }

    var residual =
      REOS.CountyCodeViolationCollapseResidualEvidence;

    if (
      !residual ||
      typeof residual.read !==
        'function'
    ) {
      fail_(
        'Read-only residual evidence support is unavailable.'
      );
    }

    var preflight =
      REOS.CountyCodeViolationCollapseExecutionPreflightV2;

    if (
      !preflight ||
      typeof preflight.preflight !==
        'function'
    ) {
      fail_(
        'Read-only successor preflight support is unavailable.'
      );
    }

    return {
      store: store,
      residual: residual,
      preflight: preflight
    };
  }

  function validateRetirementData_(data) {
    var expected = {
      retirementContractVersion:
        1,

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

    exactFields_(
      data,
      Object.keys(expected),
      'Retirement terminal payload'
    );

    Object.keys(expected)
      .forEach(function (field) {
        if (
          data[field] !==
          expected[field]
        ) {
          fail_(
            'Retirement terminal payload drift: ' +
            field
          );
        }
      });
  }

  function validateHistory_(history) {
    if (
      !history ||
      history.found !== true ||
      history.operationId !==
        OPERATION_ID_ ||
      history.operationCreatedTimestampUtc !==
        OPERATION_CREATED_AT_ ||
      !history.identity ||
      history.identity.executorImplementationVersion !==
        EXECUTOR_VERSION_ ||
      Number(history.identity.groupNumber) !==
        GROUP_NUMBER_ ||
      history.identity.winnerDistressLeadId !==
        WINNER_ID_ ||
      history.identity.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      !Array.isArray(history.events) ||
      history.events.length !== 2
    ) {
      fail_(
        'Post-terminal operation history identity drift.'
      );
    }

    var prepared =
      history.events[0];

    var terminal =
      history.events[1];

    if (
      !prepared ||
      !prepared.manifest ||
      Number(
        prepared.manifest.eventSequence
      ) !== 1 ||
      prepared.manifest.eventType !==
        'INTENT_PREPARED' ||
      prepared.manifest.eventTimestampUtc !==
        OPERATION_CREATED_AT_ ||
      Number(
        prepared.manifest.operationIntentContractVersion
      ) !== 1 ||
      prepared.manifest.executorImplementationVersion !==
        EXECUTOR_VERSION_ ||
      Number(
        prepared.manifest.groupNumber
      ) !== GROUP_NUMBER_ ||
      prepared.manifest.winnerDistressLeadId !==
        WINNER_ID_ ||
      prepared.manifest.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      prepared.manifest.payloadSha256 !==
        PREPARED_PAYLOAD_SHA256_ ||
      prepared.manifest.eventSha256 !==
        PREPARED_EVENT_SHA256_ ||
      prepared.manifest.previousEventSha256 !==
        'GENESIS'
    ) {
      fail_('Prepared event drift.');
    }

    if (
      !terminal ||
      !terminal.manifest ||
      Number(
        terminal.manifest.eventSequence
      ) !== 2 ||
      terminal.manifest.eventType !==
        'COLLAPSE_EXECUTOR_PRECONDITION_FAILED' ||
      Number(
        terminal.manifest.operationIntentContractVersion
      ) !== 1 ||
      terminal.manifest.executorImplementationVersion !==
        EXECUTOR_VERSION_ ||
      Number(
        terminal.manifest.groupNumber
      ) !== GROUP_NUMBER_ ||
      terminal.manifest.winnerDistressLeadId !==
        WINNER_ID_ ||
      terminal.manifest.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      terminal.manifest.previousEventSha256 !==
        PREPARED_EVENT_SHA256_ ||
      terminal.manifest.eventSha256 !==
        TERMINAL_EVENT_SHA256_ ||
      terminal.manifest.payloadSha256 !==
        TERMINAL_PAYLOAD_SHA256_
    ) {
      fail_('Terminal event drift.');
    }

    if (
      typeof terminal.canonicalPayload !==
        'string' ||
      terminal.canonicalPayload === ''
    ) {
      fail_(
        'Terminal canonical payload is unavailable.'
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
        'Terminal canonical payload cannot be decoded.'
      );
    }

    if (
      !envelope ||
      envelope.operationId !==
        OPERATION_ID_ ||
      Number(
        envelope.eventSequence
      ) !== 2 ||
      envelope.eventType !==
        'COLLAPSE_EXECUTOR_PRECONDITION_FAILED' ||
      envelope.executorImplementationVersion !==
        EXECUTOR_VERSION_ ||
      Number(
        envelope.groupNumber
      ) !== GROUP_NUMBER_ ||
      envelope.winnerDistressLeadId !==
        WINNER_ID_ ||
      envelope.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      envelope.operationCreatedTimestampUtc !==
        OPERATION_CREATED_AT_ ||
      !plainObject_(
        envelope.data
      )
    ) {
      fail_(
        'Terminal canonical payload envelope drift.'
      );
    }

    validateRetirementData_(
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
        'Journal event ordering drift.'
      );
    }

    if (
      types.indexOf(
        'DELETE_INVOCATION_STARTED'
      ) !== -1 ||
      types.indexOf(
        'POSTDELETE_VERIFIED'
      ) !== -1 ||
      types.indexOf(
        'COLLAPSE_DELETE_VERIFIED'
      ) !== -1
    ) {
      fail_(
        'Delete-barrier or verified-delete history appeared.'
      );
    }

    return {
      prepared:
        prepared,
      terminal:
        terminal,
      eventTypes:
        types
    };
  }

  function validateRecovery_(recovery) {
    if (
      !recovery ||
      recovery.operationId !==
        OPERATION_ID_ ||
      recovery.found !== true ||
      recovery.classification !==
        RECOVERY_CLASSIFICATION_ ||
      recovery.automaticRetryPermitted !==
        false ||
      recovery.rowRecreationPermitted !==
        false ||
      recovery.journalMutationExecuted !==
        false ||
      Number(
        recovery.eventCount
      ) !== 2
    ) {
      fail_(
        'Post-terminal recovery classification drift.'
      );
    }
  }

  function validateResidual_(residual) {
    if (
      !residual ||
      residual.ok !== true ||
      residual.authoritySha256 !==
        AUTHORITY_SHA256_ ||
      residual.winnerPlanFingerprintSha256 !==
        WINNER_PLAN_SHA256_ ||
      residual.executionBlocked !==
        false
    ) {
      fail_(
        'Current residual authority drift.'
      );
    }

    exactSingleValue_(
      residual.operationIds,
      OPERATION_ID_,
      'Residual operation IDs'
    );

    if (
      !Array.isArray(
        residual.uncertainOperationIds
      ) ||
      residual.uncertainOperationIds.length !==
        0 ||
      !Array.isArray(
        residual.executionBlockers
      ) ||
      residual.executionBlockers.length !==
        0 ||
      !Array.isArray(
        residual.verifiedDeletes
      ) ||
      residual.verifiedDeletes.length !==
        0 ||
      !Array.isArray(
        residual.currentRows
      )
    ) {
      fail_(
        'Current residual classification drift.'
      );
    }

    var groupRows =
      residual.currentRows
        .filter(function (row) {
          return (
            Number(
              row.groupNumber
            ) ===
            GROUP_NUMBER_
          );
        });

    if (
      groupRows.length !== 2
    ) {
      fail_(
        'Current Group 2 population is not exactly two rows.'
      );
    }

    var byId = {};

    groupRows.forEach(function (row) {
      var id =
        text_(
          row.distressLeadId
        );

      var currentRow =
        Number(
          row.currentRowNumber
        );

      if (
        !id ||
        byId[id] ||
        !Number.isInteger(
          currentRow
        ) ||
        currentRow < 2
      ) {
        fail_(
          'Current Group 2 row evidence is invalid or duplicated.'
        );
      }

      byId[id] =
        currentRow;
    });

    if (
      !byId[WINNER_ID_] ||
      !byId[TARGET_ID_] ||
      Object.keys(byId).length !== 2 ||
      byId[WINNER_ID_] ===
        byId[TARGET_ID_]
    ) {
      fail_(
        'Current Group 2 winner/target membership drift.'
      );
    }

    [
      'collapseExecutionAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'productionDataMutationAuthorityGranted',
      'schedulerMutationAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'connectorExecutionAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(function (field) {
      if (
        residual[field] !==
        false
      ) {
        fail_(
          'Residual evidence unexpectedly grants authority: ' +
          field
        );
      }
    });

    return {
      winnerCurrentRowNumber:
        byId[WINNER_ID_],

      targetCurrentRowNumber:
        byId[TARGET_ID_]
    };
  }

  function exactCheckpoint_(
    checkpoint,
    label
  ) {
    if (
      !checkpoint ||
      checkpoint.id !==
        CHECKPOINT_ID_ ||
      Number(
        checkpoint.nextFeedIndex
      ) !== 0 ||
      checkpoint.currentFeedCursor !==
        CHECKPOINT_CURSOR_ ||
      Number(
        checkpoint.completedFeeds
      ) !== 0 ||
      Number(
        checkpoint.totalFeeds
      ) !== 4 ||
      Number(
        checkpoint.resultCount
      ) !== 0
    ) {
      fail_(
        label +
        ' does not match the frozen checkpoint.'
      );
    }
  }

  function validatePreflight_(preflight) {
    if (
      !preflight ||
      preflight.ok !== true ||
      preflight.mode !==
        'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT_V2' ||
      preflight.authoritySha256 !==
        AUTHORITY_SHA256_ ||
      preflight.winnerPlanFingerprintSha256 !==
        WINNER_PLAN_SHA256_ ||
      preflight.schedulerFrozen !==
        true ||
      preflight.checkpointFrozen !==
        true ||
      !preflight.schedulerBefore ||
      preflight.schedulerBefore.handler !==
        SCHEDULER_HANDLER_ ||
      Number(
        preflight.schedulerBefore.triggerCount
      ) !== 0 ||
      !preflight.schedulerAfter ||
      preflight.schedulerAfter.handler !==
        SCHEDULER_HANDLER_ ||
      Number(
        preflight.schedulerAfter.triggerCount
      ) !== 0
    ) {
      fail_(
        'Frozen scheduler/preflight evidence drift.'
      );
    }

    exactCheckpoint_(
      preflight.checkpointBefore,
      'checkpointBefore'
    );

    exactCheckpoint_(
      preflight.checkpointAfter,
      'checkpointAfter'
    );

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
    ].forEach(function (field) {
      if (
        preflight[field] !==
        false
      ) {
        fail_(
          'Preflight unexpectedly grants authority: ' +
          field
        );
      }
    });
  }

  function status() {
    if (
      arguments.length !== 0
    ) {
      fail_(
        'Status takes no caller-defined authority.'
      );
    }

    var dependencies =
      requireDependencies_();

    REOS.Security
      .requireAdmin();

    var operationIds =
      dependencies.store
        .listOperationIds();

    exactSingleValue_(
      operationIds,
      OPERATION_ID_,
      'Journal operation IDs'
    );

    var history =
      dependencies.store
        .read(
          OPERATION_ID_
        );

    var journal =
      validateHistory_(
        history
      );

    var recovery =
      dependencies.store
        .recover(
          OPERATION_ID_
        );

    validateRecovery_(
      recovery
    );

    var residual =
      dependencies.residual
        .read({});

    var live =
      validateResidual_(
        residual
      );

    var preflight =
      dependencies.preflight
        .preflight({});

    validatePreflight_(
      preflight
    );

    return Object.freeze({
      ok:
        true,

      mode:
        MODE_,

      contractVersion:
        CONTRACT_VERSION_,

      operationId:
        OPERATION_ID_,

      groupNumber:
        GROUP_NUMBER_,

      winnerDistressLeadId:
        WINNER_ID_,

      targetDeleteDistressLeadId:
        TARGET_ID_,

      operationCreatedTimestampUtc:
        OPERATION_CREATED_AT_,

      preparedEventSha256:
        PREPARED_EVENT_SHA256_,

      preparedPayloadSha256:
        PREPARED_PAYLOAD_SHA256_,

      terminalEventSha256:
        TERMINAL_EVENT_SHA256_,

      terminalPayloadSha256:
        TERMINAL_PAYLOAD_SHA256_,

      journalReadbackDecoded:
        true,

      journalEventCount:
        2,

      journalEventTypes:
        journal.eventTypes.slice(),

      recoveryClassification:
        RECOVERY_CLASSIFICATION_,

      winnerPresent:
        true,

      targetPresent:
        true,

      winnerCurrentRowNumber:
        live.winnerCurrentRowNumber,

      targetCurrentRowNumber:
        live.targetCurrentRowNumber,

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
    });
  }

  return Object.freeze({
    status:
      status
  });
})();


function reosCountyCollapseGroup2PostTerminalReconciliationStatus() {
  if (
    arguments.length !== 0
  ) {
    throw new Error(
      'Group 2 post-terminal reconciliation status takes no arguments.'
    );
  }

  return REOS
    .CountyCollapseGroup2PostTerminalReconciliation
    .status();
}
