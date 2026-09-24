/**
 * REOS Enterprise - Group 4 Post-Barrier Timeout Terminal Reconciliation v1
 *
 * Incident-bounded journal terminalization only.
 *
 * This module never invokes the collapse executor, never calls the physical
 * delete primitive, never recreates a row, and never closes maintenance.
 */
var REOS = REOS || {};

REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;
  var MODE_ =
    'GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_V1';

  var CONFIRM_TOKEN_ =
    'CONFIRM_GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_V1';

  var OPERATION_ID_ =
    '9c3f6f20-340b-47fb-a2c9-175fcbfbd88d';
  var GROUP_NUMBER_ = 4;
  var WINNER_ID_ = 'DL-20260820195113-7700';
  var TARGET_ID_ = 'DL-20260820195131-0566';
  var VIOLATION_ = 'VI-2026-045398';

  var PREPARED_EVENT_SHA256_ =
    '41869f2955b69423bc02292a126049cacb523df545d4535471a5972c36b6c788';
  var PREPARED_PAYLOAD_SHA256_ =
    'c417ee900580a965090f95eddffeb6220e77385188900e740483617d41e7af12';
  var BARRIER_EVENT_SHA256_ =
    '6f925e2042904e756375b06c2e0b0ba321517dd2e95a909fdc6f75f4df66fd86';
  var BARRIER_PAYLOAD_SHA256_ =
    'ddf06e64cfd987044b048317170b9b23367444993ae7999cbfec4dcb202f8f5d';

  var AUTHORITY_SHA256_ =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';
  var WINNER_PLAN_SHA256_ =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var CANONICAL_PROPERTY_KEY_ =
    'property|address|pa|philadelphia|19125-4508|1145 n delaware ave';

  var RECONCILIATION_REASON_ =
    'CERTIFIED_GROUP4_POSTBARRIER_EXECUTOR_TIMEOUT';
  var TERMINAL_REASON_ =
    'CERTIFIED_GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION';
  var VERIFICATION_BASIS_ =
    'INCIDENT_BOUNDED_POST_BARRIER_TIMEOUT_LIVE_RECONCILIATION';
  var ORIGINAL_EXECUTOR_ERROR_ = 'Exceeded maximum execution time';

  var SCHEDULER_HANDLER_ = 'reosCountyProductionSchedulerRun';
  var CHECKPOINT_ID_ = 'COUNTY-20260902222607805';
  var CHECKPOINT_CURSOR_ =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

  function fail_(message) {
    throw new Error(
      'County collapse Group 4 post-barrier timeout terminal reconciliation: ' +
      message
    );
  }

  function text_(value) {
    return String(
      value === undefined || value === null ? '' : value
    ).trim();
  }

  function plainObject_(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  function exactFields_(value, fields, label) {
    if (!plainObject_(value)) {
      fail_(label + ' must be an object.');
    }

    var actual = Object.keys(value).slice().sort();
    var expected = fields.slice().sort();

    if (actual.length !== expected.length) {
      fail_(label + ' fields are not exact.');
    }

    for (var index = 0; index < expected.length; index++) {
      if (actual[index] !== expected[index]) {
        fail_(label + ' fields are not exact.');
      }
    }
  }

  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      fail_('Admin security support is required.');
    }

    if (
      !REOS.Database ||
      typeof REOS.Database.withScriptLockContext !== 'function'
    ) {
      fail_('Database ScriptLock context support is required.');
    }

    var evidence = REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence;

    if (!evidence || typeof evidence.status !== 'function') {
      fail_('Certified Group 4 post-barrier evidence support is required.');
    }

    var maintenance = REOS.CountyCodeViolationCollapseMaintenanceGate;

    if (!maintenance || typeof maintenance.assertReady !== 'function') {
      fail_('Certified collapse maintenance readiness support is required.');
    }

    var store = REOS.CountyCollapseOperationIntentStore;

    if (
      !store ||
      typeof store.append !== 'function' ||
      typeof store.read !== 'function' ||
      typeof store.recover !== 'function'
    ) {
      fail_('Append-only operation-intent store support is required.');
    }

    return {
      evidence: evidence,
      maintenance: maintenance,
      store: store
    };
  }

  function validateRequest_(request) {
    exactFields_(
      request,
      [
        'confirmReconciliation',
        'expectedAuthoritySha256',
        'expectedDeleteBarrierEventSha256',
        'expectedMaintenanceGateId',
        'expectedMaintenanceLeaseId',
        'expectedPreparedEventSha256',
        'expectedTargetDeleteDistressLeadId',
        'expectedWinnerDistressLeadId',
        'expectedWinnerPlanFingerprintSha256',
        'groupNumber',
        'maintenanceToken',
        'operationId'
      ],
      'Reconciliation request'
    );

    if (request.confirmReconciliation !== CONFIRM_TOKEN_) {
      fail_('Exact reconciliation confirmation token is required.');
    }

    if (
      request.operationId !== OPERATION_ID_ ||
      Number(request.groupNumber) !== GROUP_NUMBER_ ||
      request.expectedWinnerDistressLeadId !== WINNER_ID_ ||
      request.expectedTargetDeleteDistressLeadId !== TARGET_ID_ ||
      request.expectedPreparedEventSha256 !== PREPARED_EVENT_SHA256_ ||
      request.expectedDeleteBarrierEventSha256 !== BARRIER_EVENT_SHA256_ ||
      request.expectedAuthoritySha256 !== AUTHORITY_SHA256_ ||
      request.expectedWinnerPlanFingerprintSha256 !== WINNER_PLAN_SHA256_
    ) {
      fail_('Incident-bounded reconciliation request identity drift.');
    }

    if (
      typeof request.maintenanceToken !== 'string' ||
      request.maintenanceToken === '' ||
      typeof request.expectedMaintenanceLeaseId !== 'string' ||
      request.expectedMaintenanceLeaseId === '' ||
      typeof request.expectedMaintenanceGateId !== 'string' ||
      request.expectedMaintenanceGateId === ''
    ) {
      fail_('Fresh maintenance capability fields are required.');
    }
  }

  function assertEvidence_(evidence, allowedPhases, label) {
    if (
      !evidence ||
      evidence.ok !== true ||
      evidence.mode !== 'READ_ONLY_GROUP4_POSTBARRIER_TIMEOUT_EVIDENCE_V1' ||
      Number(evidence.contractVersion) !== CONTRACT_VERSION_ ||
      evidence.operationId !== OPERATION_ID_ ||
      Number(evidence.groupNumber) !== GROUP_NUMBER_ ||
      evidence.winnerDistressLeadId !== WINNER_ID_ ||
      evidence.targetDeleteDistressLeadId !== TARGET_ID_ ||
      evidence.violationNumber !== VIOLATION_ ||
      evidence.canonicalPropertyKey !== CANONICAL_PROPERTY_KEY_ ||
      evidence.authoritySha256 !== AUTHORITY_SHA256_ ||
      evidence.winnerPlanFingerprintSha256 !== WINNER_PLAN_SHA256_ ||
      evidence.preparedEventSha256 !== PREPARED_EVENT_SHA256_ ||
      evidence.preparedPayloadSha256 !== PREPARED_PAYLOAD_SHA256_ ||
      evidence.deleteBarrierEventSha256 !== BARRIER_EVENT_SHA256_ ||
      evidence.deleteBarrierPayloadSha256 !== BARRIER_PAYLOAD_SHA256_ ||
      allowedPhases.indexOf(evidence.journalPhase) === -1 ||
      evidence.winnerPresent !== true ||
      evidence.winnerPresentExactlyOnce !== true ||
      evidence.targetPresent !== false ||
      Number(evidence.targetMatchCount) !== 0 ||
      !Number.isInteger(Number(evidence.winnerCurrentRowNumber)) ||
      Number(evidence.winnerCurrentRowNumber) < 2 ||
      evidence.winnerCanonicalPropertyKey !== CANONICAL_PROPERTY_KEY_ ||
      evidence.targetCertifiedCanonicalPropertyKey !== CANONICAL_PROPERTY_KEY_ ||
      evidence.schedulerFrozen !== true ||
      evidence.checkpointFrozen !== true ||
      !Array.isArray(evidence.targetBoundOperationIds) ||
      evidence.targetBoundOperationIds.length !== 1 ||
      evidence.targetBoundOperationIds[0] !== OPERATION_ID_ ||
      evidence.journalMutationExecuted !== false ||
      evidence.automaticRetryPermitted !== false ||
      evidence.executorRetryAuthorityGranted !== false ||
      evidence.secondExecutorInvocationAuthorityGranted !== false ||
      evidence.physicalDeleteAuthorityGranted !== false ||
      evidence.rowRecreationPermitted !== false ||
      evidence.maintenanceMutationAuthorityGranted !== false ||
      evidence.schedulerMutationAuthorityGranted !== false ||
      evidence.checkpointMutationAuthorityGranted !== false ||
      evidence.automaticMaoAuthorityGranted !== false ||
      evidence.automaticOfferAuthorityGranted !== false
    ) {
      fail_(label + ' evidence drift.');
    }

    if (
      !evidence.downstreamReferenceAudit ||
      Number(evidence.downstreamReferenceAudit.matchCount) !== 0 ||
      evidence.downstreamReferenceAudit.scanComplete !== true ||
      evidence.downstreamReferenceAudit.matchesTruncated !== false ||
      evidence.downstreamReferenceAudit.targetDistressLeadId !== TARGET_ID_
    ) {
      fail_(label + ' downstream-reference evidence drift.');
    }

    return evidence;
  }

  function assertCheckpoint_(checkpoint, label) {
    if (
      !checkpoint ||
      text_(checkpoint.cycleId || checkpoint.id) !== CHECKPOINT_ID_ ||
      Number(checkpoint.nextFeedIndex) !== 0 ||
      text_(checkpoint.currentFeedCursor) !== CHECKPOINT_CURSOR_ ||
      Number(checkpoint.completedFeeds) !== 0 ||
      Number(checkpoint.totalFeeds) !== 4 ||
      (
        Array.isArray(checkpoint.results)
          ? checkpoint.results.length
          : Number(checkpoint.resultCount)
      ) !== 0
    ) {
      fail_(label + ' checkpoint drift.');
    }
  }

  function maintenanceReady_(maintenance, request, lockContext) {
    var ready = maintenance.assertReady({
      maintenanceToken: request.maintenanceToken,
      expectedLeaseId: request.expectedMaintenanceLeaseId,
      expectedGateId: request.expectedMaintenanceGateId,
      lockContext: lockContext
    });

    if (
      !ready ||
      ready.ok !== true ||
      ready.ready !== true ||
      ready.maintenanceReady !== true ||
      ready.gateMode !== 'CODE_VIOLATION_COLLAPSE' ||
      ready.authorityGeneration !== 'CURRENT' ||
      ready.gateId !== request.expectedMaintenanceGateId ||
      ready.leaseId !== request.expectedMaintenanceLeaseId ||
      ready.manualExternalWritersQuiescentCertified !== true ||
      ready.schedulerHandler !== SCHEDULER_HANDLER_ ||
      !ready.authority ||
      ready.authority.winnerPlanFingerprintSha256 !== WINNER_PLAN_SHA256_ ||
      ready.authority.collapseAuthoritySha256 !== AUTHORITY_SHA256_
    ) {
      fail_('Maintenance readiness did not match exact fresh capability.');
    }

    assertCheckpoint_(ready.checkpoint, 'Maintenance readiness');

    return ready;
  }

  function maintenancePayload_(ready) {
    return {
      gateId: ready.gateId,
      leaseId: ready.leaseId,
      authorityGeneration: ready.authorityGeneration,
      rawTokenPersisted: false,
      manualExternalWritersQuiescentCertified: true
    };
  }

  function checkpointPayload_(evidence) {
    return {
      id: evidence.checkpointAfter.id,
      nextFeedIndex: evidence.checkpointAfter.nextFeedIndex,
      currentFeedCursor: evidence.checkpointAfter.currentFeedCursor,
      completedFeeds: evidence.checkpointAfter.completedFeeds,
      totalFeeds: evidence.checkpointAfter.totalFeeds,
      resultCount: evidence.checkpointAfter.resultCount
    };
  }

  function schedulerPayload_(evidence) {
    return {
      handler: evidence.schedulerAfter.handler,
      triggerCount: evidence.schedulerAfter.triggerCount
    };
  }

  function referencePayload_(evidence) {
    return {
      referenceSurface: evidence.downstreamReferenceAudit.referenceSurface,
      scannedSheetCount: evidence.downstreamReferenceAudit.scannedSheetCount,
      matchCount: evidence.downstreamReferenceAudit.matchCount,
      scanComplete: true,
      matchesTruncated: false,
      targetDistressLeadId: TARGET_ID_
    };
  }

  function postdeletePayload_(evidence, ready) {
    return {
      reconciliationContractVersion: CONTRACT_VERSION_,
      reconciliationImplementationVersion: MODE_,
      reconciliationReason: RECONCILIATION_REASON_,
      incidentOperationId: OPERATION_ID_,
      groupNumber: GROUP_NUMBER_,
      winnerDistressLeadId: WINNER_ID_,
      targetDeleteDistressLeadId: TARGET_ID_,
      violationNumber: VIOLATION_,
      authoritySha256: AUTHORITY_SHA256_,
      winnerPlanFingerprintSha256: WINNER_PLAN_SHA256_,
      preparedEventSha256: PREPARED_EVENT_SHA256_,
      preparedPayloadSha256: PREPARED_PAYLOAD_SHA256_,
      deleteBarrierEventSha256: BARRIER_EVENT_SHA256_,
      deleteBarrierPayloadSha256: BARRIER_PAYLOAD_SHA256_,
      originalExecutorRpcError: ORIGINAL_EXECUTOR_ERROR_,
      originalPrimitiveResultAvailable: false,
      originalPrimitiveResultPersisted: false,
      secondPhysicalDeleteExecuted: false,
      physicalDeleteExecutedByReconciliation: false,
      targetAbsentIndependentlyVerified: true,
      winnerPresentExactlyOnce: true,
      winnerCurrentRowNumber: Number(evidence.winnerCurrentRowNumber),
      canonicalPropertyKey: CANONICAL_PROPERTY_KEY_,
      downstreamReferenceAudit: referencePayload_(evidence),
      scheduler: schedulerPayload_(evidence),
      checkpoint: checkpointPayload_(evidence),
      maintenanceCapability: maintenancePayload_(ready),
      verificationBasis: VERIFICATION_BASIS_,
      automaticRetryPermitted: false,
      rowRecreationPermitted: false,
      automaticMaintenanceClosePermitted: false,
      journalMutationLimitedToTerminalization: true
    };
  }

  function terminalPayload_(evidence, ready) {
    if (
      evidence.journalPhase !== 'POSTDELETE_VERIFIED_RESUME' ||
      !text_(evidence.postdeleteEventSha256) ||
      !text_(evidence.postdeletePayloadSha256)
    ) {
      fail_('Verified post-delete journal evidence is required before terminal append.');
    }

    return {
      reconciliationContractVersion: CONTRACT_VERSION_,
      reconciliationImplementationVersion: MODE_,
      terminalReason: TERMINAL_REASON_,
      incidentOperationId: OPERATION_ID_,
      groupNumber: GROUP_NUMBER_,
      winnerDistressLeadId: WINNER_ID_,
      targetDeleteDistressLeadId: TARGET_ID_,
      violationNumber: VIOLATION_,
      authoritySha256: AUTHORITY_SHA256_,
      winnerPlanFingerprintSha256: WINNER_PLAN_SHA256_,
      deleteBarrierEventSha256: BARRIER_EVENT_SHA256_,
      postdeleteEventSha256: evidence.postdeleteEventSha256,
      postdeletePayloadSha256: evidence.postdeletePayloadSha256,
      canonicalPropertyKey: CANONICAL_PROPERTY_KEY_,
      verificationBasis: VERIFICATION_BASIS_,
      originalPrimitiveResultAvailable: false,
      secondPhysicalDeleteExecuted: false,
      physicalDeleteExecutedByReconciliation: false,
      targetAbsentIndependentlyVerified: true,
      winnerPresentExactlyOnce: true,
      verifiedPostdeleteEvidenceReadback: true,
      maintenanceCapability: maintenancePayload_(ready),
      automaticRetryPermitted: false,
      rowRecreationPermitted: false,
      automaticMaintenanceClosePermitted: false
    };
  }

  function assertAppend_(result, expectedSequence, expectedType, label) {
    if (
      !result ||
      result.operationId !== OPERATION_ID_ ||
      Number(result.eventSequence) !== expectedSequence ||
      result.eventType !== expectedType ||
      !text_(result.eventSha256) ||
      !text_(result.payloadSha256) ||
      result.readbackVerified !== true
    ) {
      fail_(label + ' append/readback verification failed.');
    }

    return result;
  }

  function reconcile(request) {
    var dependencies = requireDependencies_();
    validateRequest_(request);
    REOS.Security.requireAdmin();

    var beforeLock = assertEvidence_(
      dependencies.evidence.status(),
      ['BARRIER_ONLY', 'POSTDELETE_VERIFIED_RESUME', 'VERIFIED_SUCCESS'],
      'Pre-lock'
    );

    if (beforeLock.journalPhase === 'VERIFIED_SUCCESS') {
      fail_('Incident is already terminal; no additional journal mutation is permitted.');
    }

    return REOS.Database.withScriptLockContext(function (lockContext) {
      var firstReady = maintenanceReady_(
        dependencies.maintenance,
        request,
        lockContext
      );

      var locked = assertEvidence_(
        dependencies.evidence.status(),
        [beforeLock.journalPhase],
        'Under-lock'
      );

      var appendedPostdelete = false;
      var postdeleteResult = null;

      if (locked.journalPhase === 'BARRIER_ONLY') {
        /*
         * Revalidate maintenance and the exact incident immediately before
         * the first journal append. No county-data mutation occurs here.
         */
        firstReady = maintenanceReady_(
          dependencies.maintenance,
          request,
          lockContext
        );

        locked = assertEvidence_(
          dependencies.evidence.status(),
          ['BARRIER_ONLY'],
          'Immediate pre-POSTDELETE_VERIFIED'
        );

        postdeleteResult = assertAppend_(
          dependencies.store.append(
            {
              operationId: OPERATION_ID_,
              eventType: 'POSTDELETE_VERIFIED',
              payload: postdeletePayload_(locked, firstReady)
            },
            {
              lockContext: lockContext
            }
          ),
          3,
          'POSTDELETE_VERIFIED',
          'POSTDELETE_VERIFIED'
        );

        appendedPostdelete = true;
      }

      var postdeleteEvidence = assertEvidence_(
        dependencies.evidence.status(),
        ['POSTDELETE_VERIFIED_RESUME'],
        'Post-delete readback'
      );

      /*
       * Freshly revalidate maintenance and live evidence immediately before
       * the terminal append. A resumed three-event incident follows this same
       * path without writing a duplicate POSTDELETE_VERIFIED event.
       */
      var terminalReady = maintenanceReady_(
        dependencies.maintenance,
        request,
        lockContext
      );

      postdeleteEvidence = assertEvidence_(
        dependencies.evidence.status(),
        ['POSTDELETE_VERIFIED_RESUME'],
        'Immediate pre-terminal'
      );

      var terminalResult = assertAppend_(
        dependencies.store.append(
          {
            operationId: OPERATION_ID_,
            eventType: 'COLLAPSE_DELETE_VERIFIED',
            payload: terminalPayload_(postdeleteEvidence, terminalReady)
          },
          {
            lockContext: lockContext
          }
        ),
        4,
        'COLLAPSE_DELETE_VERIFIED',
        'COLLAPSE_DELETE_VERIFIED'
      );

      var finalEvidence = assertEvidence_(
        dependencies.evidence.status(),
        ['VERIFIED_SUCCESS'],
        'Final terminal readback'
      );

      var recovery = dependencies.store.recover(OPERATION_ID_);

      if (
        !recovery ||
        recovery.found !== true ||
        recovery.classification !== 'VERIFIED_SUCCESS_JOURNAL' ||
        Number(recovery.eventCount) !== 4 ||
        recovery.terminalEventSha256 !== terminalResult.eventSha256 ||
        recovery.automaticRetryPermitted !== false ||
        recovery.rowRecreationPermitted !== false ||
        recovery.journalMutationExecuted !== false
      ) {
        fail_('Final verified-success recovery readback failed.');
      }

      return Object.freeze({
        ok: true,
        mode: MODE_,
        contractVersion: CONTRACT_VERSION_,
        operationId: OPERATION_ID_,
        groupNumber: GROUP_NUMBER_,
        winnerDistressLeadId: WINNER_ID_,
        targetDeleteDistressLeadId: TARGET_ID_,
        startedFromPhase: beforeLock.journalPhase,
        postdeleteEventAppended: appendedPostdelete,
        postdeleteEventSha256: finalEvidence.postdeleteEventSha256,
        postdeletePayloadSha256: finalEvidence.postdeletePayloadSha256,
        terminalEventAppended: true,
        terminalEventSha256: terminalResult.eventSha256,
        terminalPayloadSha256: terminalResult.payloadSha256,
        finalRecoveryClassification: recovery.classification,
        finalJournalEventCount: finalEvidence.journalEventCount,
        maintenanceGateId: terminalReady.gateId,
        maintenanceLeaseId: terminalReady.leaseId,
        maintenanceAuthorityGeneration: terminalReady.authorityGeneration,
        maintenanceTokenPersisted: false,
        executorInvocationExecuted: false,
        secondPhysicalDeleteExecuted: false,
        physicalDeleteExecutedByReconciliation: false,
        rowRecreationExecuted: false,
        automaticRetryPermitted: false,
        automaticMaintenanceCloseExecuted: false,
        schedulerRestorationExecuted: false,
        checkpointMutationExecuted: false,
        automaticMaoAuthorityGranted: false,
        automaticOfferAuthorityGranted: false
      });
    });
  }

  return Object.freeze({
    reconcile: reconcile,
    confirmationToken: function () {
      return CONFIRM_TOKEN_;
    }
  });
})();

function reosCountyCollapseGroup4PostBarrierTimeoutTerminalReconcile(request) {
  return REOS
    .CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation
    .reconcile(request || {});
}
