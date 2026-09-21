/**
 * REOS Enterprise
 * Group 2 stranded collapse-operation reconciliation v2
 *
 * READ ONLY.
 *
 * This incident-bounded diagnostic:
 *   - reads exactly one known stranded operation;
 *   - requires strict operation-intent readback to succeed;
 *   - requires the no-delete-barrier recovery classification;
 *   - reconciles current Group 2 residual evidence;
 *   - grants no retry, journal, delete, scheduler, checkpoint,
 *     maintenance, connector, MAO, offer, or county-data authority.
 */

var REOS = REOS || {};

REOS.CountyCollapseGroup2StrandedOperationReconciliation =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 2;

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

  var PAYLOAD_SHA256_ =
    '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

  var EVENT_SHA256_ =
    '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

  var PAYLOAD_UTF8_BYTES_ = 9239;
  var PAYLOAD_CHUNK_COUNT_ = 1;

  var AUTHORITY_SHA256_ =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

  var WINNER_PLAN_SHA256_ =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var RECOVERY_CLASSIFICATION_ =
    'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

  function fail_(message) {
    throw new Error(
      'County collapse Group 2 stranded-operation reconciliation: ' +
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
      fail_(
        'Admin security authority is unavailable.'
      );
    }

    var store =
      REOS.CountyCollapseOperationIntentStore;

    if (
      !store ||
      typeof store.listOperationIds !==
        'function' ||
      typeof store.read !==
        'function' ||
      typeof store.recover !==
        'function'
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

    return {
      store: store,
      residual: residual
    };
  }

  function validateHistory_(
    history
  ) {
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
      Number(
        history.identity.groupNumber
      ) !==
        GROUP_NUMBER_ ||
      history.identity.winnerDistressLeadId !==
        WINNER_ID_ ||
      history.identity.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      !Array.isArray(history.events) ||
      history.events.length !== 1
    ) {
      fail_(
        'Stranded operation history identity drift.'
      );
    }

    var event =
      history.events[0];

    if (
      !event ||
      !event.manifest ||
      event.manifest.operationId !==
        OPERATION_ID_ ||
      Number(
        event.manifest.eventSequence
      ) !==
        1 ||
      event.manifest.eventType !==
        'INTENT_PREPARED' ||
      event.manifest.eventTimestampUtc !==
        OPERATION_CREATED_AT_ ||
      Number(
        event.manifest.operationIntentContractVersion
      ) !==
        1 ||
      event.manifest.executorImplementationVersion !==
        EXECUTOR_VERSION_ ||
      Number(
        event.manifest.groupNumber
      ) !==
        GROUP_NUMBER_ ||
      event.manifest.winnerDistressLeadId !==
        WINNER_ID_ ||
      event.manifest.targetDeleteDistressLeadId !==
        TARGET_ID_ ||
      event.manifest.payloadSha256 !==
        PAYLOAD_SHA256_ ||
      Number(
        event.manifest.payloadUtf8Bytes
      ) !==
        PAYLOAD_UTF8_BYTES_ ||
      Number(
        event.manifest.payloadChunkCount
      ) !==
        PAYLOAD_CHUNK_COUNT_ ||
      event.manifest.eventSha256 !==
        EVENT_SHA256_
    ) {
      fail_(
        'Prepared-event manifest drift.'
      );
    }

    if (
      typeof event.canonicalPayload !==
        'string' ||
      event.canonicalPayload === ''
    ) {
      fail_(
        'Canonical prepared payload was not decoded.'
      );
    }

    if (
      !Array.isArray(event.chunks) ||
      event.chunks.length !== 1
    ) {
      fail_(
        'Prepared-event chunk geometry drift.'
      );
    }

    var chunk =
      event.chunks[0];

    if (
      chunk.operationId !==
        OPERATION_ID_ ||
      Number(
        chunk.eventSequence
      ) !==
        1 ||
      Number(
        chunk.chunkIndex
      ) !==
        0 ||
      Number(
        chunk.chunkUtf8Bytes
      ) !==
        PAYLOAD_UTF8_BYTES_ ||
      chunk.chunkSha256 !==
        PAYLOAD_SHA256_
    ) {
      fail_(
        'Prepared-event chunk identity drift.'
      );
    }

    return event;
  }

  function validateRecovery_(
    recovery
  ) {
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
      ) !==
        1
    ) {
      fail_(
        'Stranded operation recovery classification drift.'
      );
    }
  }

  function validateResidual_(
    residual
  ) {
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
        'Current residual authority is not the incident-bound prepared-only state.'
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
        0
    ) {
      fail_(
        'Prepared-only residual must not be classified as uncertain operation history.'
      );
    }

    if (
      !Array.isArray(
        residual.executionBlockers
      ) ||
      residual.executionBlockers.length !==
        0
    ) {
      fail_(
        'Prepared-only residual must not expose residual execution blockers.'
      );
    }

    if (
      !Array.isArray(
        residual.verifiedDeletes
      ) ||
      residual.verifiedDeletes.length !==
        0
    ) {
      fail_(
        'Verified-delete state changed before incident reconciliation.'
      );
    }

    if (
      !Array.isArray(
        residual.currentRows
      )
    ) {
      fail_(
        'Residual current rows are unavailable.'
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

    groupRows.forEach(
      function (row) {
        var id =
          text_(
            row.distressLeadId
          );

        if (
          !id ||
          byId[id]
        ) {
          fail_(
            'Current Group 2 identity is missing or duplicated.'
          );
        }

        var rowNumber =
          Number(
            row.currentRowNumber
          );

        if (
          !Number.isInteger(
            rowNumber
          ) ||
          rowNumber < 2
        ) {
          fail_(
            'Current Group 2 physical row evidence is invalid.'
          );
        }

        byId[id] =
          rowNumber;
      }
    );

    if (
      !byId[WINNER_ID_] ||
      !byId[TARGET_ID_] ||
      Object.keys(byId).length !== 2
    ) {
      fail_(
        'Current Group 2 winner/target membership drift.'
      );
    }

    if (
      byId[WINNER_ID_] ===
      byId[TARGET_ID_]
    ) {
      fail_(
        'Current Group 2 physical identities collide.'
      );
    }

    [
      'collapseExecutionAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'productionDataMutationAuthorityGranted',
      'schedulerMutationAuthorityGranted',
      'checkpointMutationAuthorityGranted',
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

    var preparedEvent =
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

    return Object.freeze({
      ok: true,

      mode:
        'READ_ONLY_GROUP2_STRANDED_OPERATION_RECONCILIATION_V2',

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
        preparedEvent
          .manifest
          .eventSha256,

      preparedPayloadSha256:
        preparedEvent
          .manifest
          .payloadSha256,

      preparedPayloadUtf8Bytes:
        preparedEvent
          .manifest
          .payloadUtf8Bytes,

      preparedPayloadChunkCount:
        preparedEvent
          .manifest
          .payloadChunkCount,

      journalReadbackDecoded:
        true,

      journalEventCount:
        1,

      journalEventType:
        'INTENT_PREPARED',

      recoveryClassification:
        RECOVERY_CLASSIFICATION_,

      deleteBarrierPresent:
        false,

      verifiedDeletePresent:
        false,

      winnerPresent:
        true,

      targetPresent:
        true,

      winnerCurrentRowNumber:
        live.winnerCurrentRowNumber,

      targetCurrentRowNumber:
        live.targetCurrentRowNumber,

      residualExecutionBlocked:
        false,

      residualExecutionBlockers:
        [],

      targetBoundPreparedOperationHistoryPresent:
        true,

      liveReadOnlyReconciliationRequired:
        true,

      automaticRetryPermitted:
        false,

      executorRetryAuthorityGranted:
        false,

      rowRecreationPermitted:
        false,

      journalMutationExecuted:
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



function reosCountyCollapseGroup2StrandedOperationReconciliationStatus() {
  throw new Error(
    'Group 2 stranded-operation reconciliation V1 RPC is retired after its single production invocation. Use reosCountyCollapseGroup2StrandedOperationReconciliationStatusV2.'
  );
}


function reosCountyCollapseGroup2StrandedOperationReconciliationStatusV2() {
  if (
    arguments.length !== 0
  ) {
    throw new Error(
      'Group 2 stranded-operation reconciliation V2 RPC takes no arguments.'
    );
  }

  return REOS
    .CountyCollapseGroup2StrandedOperationReconciliation
    .status();
}
