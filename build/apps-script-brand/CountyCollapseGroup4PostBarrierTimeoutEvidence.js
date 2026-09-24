/**
 * REOS Enterprise - Group 4 Post-Barrier Timeout Evidence v1
 *
 * Incident-bounded READ ONLY evidence for operation
 * 9c3f6f20-340b-47fb-a2c9-175fcbfbd88d.
 *
 * No journal, county-data, maintenance, scheduler, checkpoint, executor,
 * physical-delete, row-recreation, MAO, or automatic-offer authority.
 */
var REOS = REOS || {};

REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;
  var MODE_ =
    'READ_ONLY_GROUP4_POSTBARRIER_TIMEOUT_EVIDENCE_V1';

  var TABLE_ = 'DISTRESS_LEADS';
  var SOURCE_ = 'PA-PHILADELPHIA';
  var DATASET_ = 'code_violations';

  var OPERATION_ID_ =
    '9c3f6f20-340b-47fb-a2c9-175fcbfbd88d';
  var GROUP_NUMBER_ = 4;
  var WINNER_ID_ = 'DL-20260820195113-7700';
  var TARGET_ID_ = 'DL-20260820195131-0566';
  var VIOLATION_ = 'VI-2026-045398';
  var EXECUTOR_VERSION_ = 'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1';

  var OPERATION_CREATED_AT_ = '2026-09-23T20:00:32.284Z';
  var BARRIER_AT_ = '2026-09-23T20:03:06.562Z';

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

  var PROPOSED_DURABLE_KEY_ =
    'pa-philadelphia|code_violations|vi-2026-045398';
  var CANONICAL_PROPERTY_KEY_ =
    'property|address|pa|philadelphia|19125-4508|1145 n delaware ave';

  var RECONCILIATION_VERSION_ =
    'GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_V1';
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
      'County collapse Group 4 post-barrier timeout evidence: ' +
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

  function exactFields_(value, expected, label) {
    if (!plainObject_(value)) {
      fail_(label + ' must be an object.');
    }

    var actual = Object.keys(value).slice().sort();
    expected = expected.slice().sort();

    if (actual.length !== expected.length) {
      fail_(label + ' fields are not exact.');
    }

    for (var index = 0; index < expected.length; index++) {
      if (actual[index] !== expected[index]) {
        fail_(label + ' fields are not exact.');
      }
    }
  }

  function exactStringArray_(actual, expected, label) {
    if (
      !Array.isArray(actual) ||
      actual.length !== expected.length
    ) {
      fail_(label + ' does not match expected values.');
    }

    for (var index = 0; index < expected.length; index++) {
      if (text_(actual[index]) !== expected[index]) {
        fail_(label + ' does not match expected values.');
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
      typeof REOS.Database.getAll !== 'function'
    ) {
      fail_('Read-only Database.getAll support is required.');
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity.resolve !== 'function'
    ) {
      fail_('Canonical property identity support is required.');
    }

    var authority =
      REOS.CountyCodeViolationCollapseDirectKeepExecutionAuthority;

    if (
      !authority ||
      typeof authority.metadata !== 'function' ||
      typeof authority.catalog !== 'function'
    ) {
      fail_('Immutable direct-keep authority is required.');
    }

    var referenceAudit = REOS.CountyIdentityReferenceAudit;

    if (
      !referenceAudit ||
      typeof referenceAudit.audit !== 'function'
    ) {
      fail_('Downstream reference audit support is required.');
    }

    var scheduler = REOS.CountyProductionScheduler;

    if (
      !scheduler ||
      typeof scheduler.getCheckpoint !== 'function'
    ) {
      fail_('County checkpoint read support is required.');
    }

    if (
      typeof ScriptApp === 'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !== 'function'
    ) {
      fail_('Installable-trigger read authority is required.');
    }

    var store = REOS.CountyCollapseOperationIntentStore;

    if (
      !store ||
      typeof store.listOperationIds !== 'function' ||
      typeof store.read !== 'function' ||
      typeof store.recover !== 'function'
    ) {
      fail_('Strict operation-intent read/recovery support is required.');
    }

    return {
      authority: authority,
      referenceAudit: referenceAudit,
      scheduler: scheduler,
      store: store
    };
  }

  function assertBaseManifest_(event, expected) {
    if (!event || !event.manifest) {
      fail_(expected.label + ' manifest is unavailable.');
    }

    var manifest = event.manifest;

    if (
      text_(manifest.operationId) !== OPERATION_ID_ ||
      Number(manifest.eventSequence) !== expected.sequence ||
      manifest.eventType !== expected.type ||
      text_(manifest.eventTimestampUtc) !== expected.timestamp ||
      Number(manifest.operationIntentContractVersion) !== 1 ||
      text_(manifest.executorImplementationVersion) !== EXECUTOR_VERSION_ ||
      Number(manifest.groupNumber) !== GROUP_NUMBER_ ||
      text_(manifest.winnerDistressLeadId) !== WINNER_ID_ ||
      text_(manifest.targetDeleteDistressLeadId) !== TARGET_ID_ ||
      text_(manifest.payloadSha256) !== expected.payloadSha256 ||
      text_(manifest.previousEventSha256) !== expected.previousEventSha256 ||
      text_(manifest.eventSha256) !== expected.eventSha256
    ) {
      fail_(expected.label + ' manifest drift.');
    }
  }

  function assertDynamicEnvelope_(event, sequence, type, label) {
    if (!event || !event.manifest || !event.payload) {
      fail_(label + ' is unavailable.');
    }

    var manifest = event.manifest;
    var payload = event.payload;

    if (
      text_(manifest.operationId) !== OPERATION_ID_ ||
      Number(manifest.eventSequence) !== sequence ||
      manifest.eventType !== type ||
      Number(manifest.operationIntentContractVersion) !== 1 ||
      text_(manifest.executorImplementationVersion) !== EXECUTOR_VERSION_ ||
      Number(manifest.groupNumber) !== GROUP_NUMBER_ ||
      text_(manifest.winnerDistressLeadId) !== WINNER_ID_ ||
      text_(manifest.targetDeleteDistressLeadId) !== TARGET_ID_ ||
      !text_(manifest.payloadSha256) ||
      !text_(manifest.eventSha256) ||
      !text_(manifest.eventTimestampUtc)
    ) {
      fail_(label + ' manifest drift.');
    }

    if (
      payload.operationId !== OPERATION_ID_ ||
      Number(payload.eventSequence) !== sequence ||
      payload.eventType !== type ||
      payload.eventTimestampUtc !== manifest.eventTimestampUtc ||
      Number(payload.operationIntentContractVersion) !== 1 ||
      payload.executorImplementationVersion !== EXECUTOR_VERSION_ ||
      Number(payload.groupNumber) !== GROUP_NUMBER_ ||
      payload.winnerDistressLeadId !== WINNER_ID_ ||
      payload.targetDeleteDistressLeadId !== TARGET_ID_ ||
      payload.operationCreatedTimestampUtc !== OPERATION_CREATED_AT_ ||
      !plainObject_(payload.data)
    ) {
      fail_(label + ' payload envelope drift.');
    }
  }

  function assertCheckpoint_(checkpoint, label) {
    if (
      !checkpoint ||
      text_(checkpoint.id) !== CHECKPOINT_ID_ ||
      Number(checkpoint.nextFeedIndex) !== 0 ||
      text_(checkpoint.currentFeedCursor) !== CHECKPOINT_CURSOR_ ||
      Number(checkpoint.completedFeeds) !== 0 ||
      Number(checkpoint.totalFeeds) !== 4 ||
      Number(checkpoint.resultCount) !== 0
    ) {
      fail_(label + ' does not match frozen checkpoint authority.');
    }
  }

  function assertPostdeleteData_(data) {
    var fields = [
      'automaticMaintenanceClosePermitted',
      'automaticRetryPermitted',
      'authoritySha256',
      'canonicalPropertyKey',
      'checkpoint',
      'deleteBarrierEventSha256',
      'deleteBarrierPayloadSha256',
      'downstreamReferenceAudit',
      'groupNumber',
      'incidentOperationId',
      'journalMutationLimitedToTerminalization',
      'maintenanceCapability',
      'originalExecutorRpcError',
      'originalPrimitiveResultAvailable',
      'originalPrimitiveResultPersisted',
      'physicalDeleteExecutedByReconciliation',
      'preparedEventSha256',
      'preparedPayloadSha256',
      'reconciliationContractVersion',
      'reconciliationImplementationVersion',
      'reconciliationReason',
      'rowRecreationPermitted',
      'scheduler',
      'secondPhysicalDeleteExecuted',
      'targetAbsentIndependentlyVerified',
      'targetDeleteDistressLeadId',
      'verificationBasis',
      'violationNumber',
      'winnerCurrentRowNumber',
      'winnerDistressLeadId',
      'winnerPlanFingerprintSha256',
      'winnerPresentExactlyOnce'
    ];

    exactFields_(data, fields, 'POSTDELETE_VERIFIED data');

    if (
      Number(data.reconciliationContractVersion) !== CONTRACT_VERSION_ ||
      data.reconciliationImplementationVersion !== RECONCILIATION_VERSION_ ||
      data.reconciliationReason !== RECONCILIATION_REASON_ ||
      data.incidentOperationId !== OPERATION_ID_ ||
      Number(data.groupNumber) !== GROUP_NUMBER_ ||
      data.winnerDistressLeadId !== WINNER_ID_ ||
      data.targetDeleteDistressLeadId !== TARGET_ID_ ||
      data.violationNumber !== VIOLATION_ ||
      data.authoritySha256 !== AUTHORITY_SHA256_ ||
      data.winnerPlanFingerprintSha256 !== WINNER_PLAN_SHA256_ ||
      data.preparedEventSha256 !== PREPARED_EVENT_SHA256_ ||
      data.preparedPayloadSha256 !== PREPARED_PAYLOAD_SHA256_ ||
      data.deleteBarrierEventSha256 !== BARRIER_EVENT_SHA256_ ||
      data.deleteBarrierPayloadSha256 !== BARRIER_PAYLOAD_SHA256_ ||
      data.originalExecutorRpcError !== ORIGINAL_EXECUTOR_ERROR_ ||
      data.originalPrimitiveResultAvailable !== false ||
      data.originalPrimitiveResultPersisted !== false ||
      data.secondPhysicalDeleteExecuted !== false ||
      data.physicalDeleteExecutedByReconciliation !== false ||
      data.targetAbsentIndependentlyVerified !== true ||
      data.winnerPresentExactlyOnce !== true ||
      !Number.isInteger(Number(data.winnerCurrentRowNumber)) ||
      Number(data.winnerCurrentRowNumber) < 2 ||
      data.canonicalPropertyKey !== CANONICAL_PROPERTY_KEY_ ||
      data.verificationBasis !== VERIFICATION_BASIS_ ||
      data.automaticRetryPermitted !== false ||
      data.rowRecreationPermitted !== false ||
      data.automaticMaintenanceClosePermitted !== false ||
      data.journalMutationLimitedToTerminalization !== true
    ) {
      fail_('POSTDELETE_VERIFIED data drift.');
    }

    exactFields_(
      data.downstreamReferenceAudit,
      [
        'matchCount',
        'matchesTruncated',
        'referenceSurface',
        'scanComplete',
        'scannedSheetCount',
        'targetDistressLeadId'
      ],
      'POSTDELETE_VERIFIED downstream reference audit'
    );

    if (
      data.downstreamReferenceAudit.targetDistressLeadId !== TARGET_ID_ ||
      Number(data.downstreamReferenceAudit.matchCount) !== 0 ||
      data.downstreamReferenceAudit.scanComplete !== true ||
      data.downstreamReferenceAudit.matchesTruncated !== false ||
      !Number.isInteger(Number(data.downstreamReferenceAudit.scannedSheetCount)) ||
      Number(data.downstreamReferenceAudit.scannedSheetCount) < 0 ||
      !text_(data.downstreamReferenceAudit.referenceSurface)
    ) {
      fail_('POSTDELETE_VERIFIED downstream reference audit drift.');
    }

    exactFields_(
      data.scheduler,
      ['handler', 'triggerCount'],
      'POSTDELETE_VERIFIED scheduler'
    );

    if (
      data.scheduler.handler !== SCHEDULER_HANDLER_ ||
      Number(data.scheduler.triggerCount) !== 0
    ) {
      fail_('POSTDELETE_VERIFIED scheduler drift.');
    }

    exactFields_(
      data.checkpoint,
      [
        'completedFeeds',
        'currentFeedCursor',
        'id',
        'nextFeedIndex',
        'resultCount',
        'totalFeeds'
      ],
      'POSTDELETE_VERIFIED checkpoint'
    );

    assertCheckpoint_(data.checkpoint, 'POSTDELETE_VERIFIED checkpoint');

    exactFields_(
      data.maintenanceCapability,
      [
        'authorityGeneration',
        'gateId',
        'leaseId',
        'manualExternalWritersQuiescentCertified',
        'rawTokenPersisted'
      ],
      'POSTDELETE_VERIFIED maintenance capability'
    );

    if (
      !text_(data.maintenanceCapability.gateId) ||
      !text_(data.maintenanceCapability.leaseId) ||
      data.maintenanceCapability.authorityGeneration !== 'CURRENT' ||
      data.maintenanceCapability.manualExternalWritersQuiescentCertified !== true ||
      data.maintenanceCapability.rawTokenPersisted !== false
    ) {
      fail_('POSTDELETE_VERIFIED maintenance capability drift.');
    }
  }

  function assertTerminalData_(data, postdelete) {
    var fields = [
      'automaticMaintenanceClosePermitted',
      'automaticRetryPermitted',
      'authoritySha256',
      'canonicalPropertyKey',
      'deleteBarrierEventSha256',
      'groupNumber',
      'incidentOperationId',
      'maintenanceCapability',
      'originalPrimitiveResultAvailable',
      'physicalDeleteExecutedByReconciliation',
      'postdeleteEventSha256',
      'postdeletePayloadSha256',
      'reconciliationContractVersion',
      'reconciliationImplementationVersion',
      'rowRecreationPermitted',
      'secondPhysicalDeleteExecuted',
      'targetAbsentIndependentlyVerified',
      'targetDeleteDistressLeadId',
      'terminalReason',
      'verificationBasis',
      'verifiedPostdeleteEvidenceReadback',
      'violationNumber',
      'winnerDistressLeadId',
      'winnerPlanFingerprintSha256',
      'winnerPresentExactlyOnce'
    ];

    exactFields_(data, fields, 'COLLAPSE_DELETE_VERIFIED data');

    if (
      Number(data.reconciliationContractVersion) !== CONTRACT_VERSION_ ||
      data.reconciliationImplementationVersion !== RECONCILIATION_VERSION_ ||
      data.terminalReason !== TERMINAL_REASON_ ||
      data.incidentOperationId !== OPERATION_ID_ ||
      Number(data.groupNumber) !== GROUP_NUMBER_ ||
      data.winnerDistressLeadId !== WINNER_ID_ ||
      data.targetDeleteDistressLeadId !== TARGET_ID_ ||
      data.violationNumber !== VIOLATION_ ||
      data.authoritySha256 !== AUTHORITY_SHA256_ ||
      data.winnerPlanFingerprintSha256 !== WINNER_PLAN_SHA256_ ||
      data.deleteBarrierEventSha256 !== BARRIER_EVENT_SHA256_ ||
      data.postdeleteEventSha256 !== postdelete.manifest.eventSha256 ||
      data.postdeletePayloadSha256 !== postdelete.manifest.payloadSha256 ||
      data.canonicalPropertyKey !== CANONICAL_PROPERTY_KEY_ ||
      data.verificationBasis !== VERIFICATION_BASIS_ ||
      data.originalPrimitiveResultAvailable !== false ||
      data.secondPhysicalDeleteExecuted !== false ||
      data.physicalDeleteExecutedByReconciliation !== false ||
      data.targetAbsentIndependentlyVerified !== true ||
      data.winnerPresentExactlyOnce !== true ||
      data.verifiedPostdeleteEvidenceReadback !== true ||
      data.automaticRetryPermitted !== false ||
      data.rowRecreationPermitted !== false ||
      data.automaticMaintenanceClosePermitted !== false
    ) {
      fail_('COLLAPSE_DELETE_VERIFIED data drift.');
    }

    exactFields_(
      data.maintenanceCapability,
      [
        'authorityGeneration',
        'gateId',
        'leaseId',
        'manualExternalWritersQuiescentCertified',
        'rawTokenPersisted'
      ],
      'COLLAPSE_DELETE_VERIFIED maintenance capability'
    );

    if (
      !text_(data.maintenanceCapability.gateId) ||
      !text_(data.maintenanceCapability.leaseId) ||
      data.maintenanceCapability.authorityGeneration !== 'CURRENT' ||
      data.maintenanceCapability.manualExternalWritersQuiescentCertified !== true ||
      data.maintenanceCapability.rawTokenPersisted !== false
    ) {
      fail_('COLLAPSE_DELETE_VERIFIED maintenance capability drift.');
    }
  }

  function validateHistory_(history, recovery) {
    if (
      !history ||
      history.found !== true ||
      text_(history.operationId) !== OPERATION_ID_ ||
      text_(history.operationCreatedTimestampUtc) !== OPERATION_CREATED_AT_ ||
      !history.identity ||
      text_(history.identity.executorImplementationVersion) !== EXECUTOR_VERSION_ ||
      Number(history.identity.groupNumber) !== GROUP_NUMBER_ ||
      text_(history.identity.winnerDistressLeadId) !== WINNER_ID_ ||
      text_(history.identity.targetDeleteDistressLeadId) !== TARGET_ID_ ||
      !Array.isArray(history.events)
    ) {
      fail_('Incident operation history identity drift.');
    }

    if (
      history.events.length < 2 ||
      history.events.length > 4
    ) {
      fail_('Incident operation history event count is unsupported.');
    }

    assertBaseManifest_(history.events[0], {
      label: 'Prepared event',
      sequence: 1,
      type: 'INTENT_PREPARED',
      timestamp: OPERATION_CREATED_AT_,
      payloadSha256: PREPARED_PAYLOAD_SHA256_,
      previousEventSha256: 'GENESIS',
      eventSha256: PREPARED_EVENT_SHA256_
    });

    assertBaseManifest_(history.events[1], {
      label: 'Delete barrier event',
      sequence: 2,
      type: 'DELETE_INVOCATION_STARTED',
      timestamp: BARRIER_AT_,
      payloadSha256: BARRIER_PAYLOAD_SHA256_,
      previousEventSha256: PREPARED_EVENT_SHA256_,
      eventSha256: BARRIER_EVENT_SHA256_
    });

    var phase;
    var postdelete = null;
    var terminal = null;

    if (history.events.length === 2) {
      phase = 'BARRIER_ONLY';
    } else {
      postdelete = history.events[2];
      assertDynamicEnvelope_(
        postdelete,
        3,
        'POSTDELETE_VERIFIED',
        'POSTDELETE_VERIFIED event'
      );

      if (
        text_(postdelete.manifest.previousEventSha256) !==
          BARRIER_EVENT_SHA256_
      ) {
        fail_('POSTDELETE_VERIFIED previous-event hash drift.');
      }

      assertPostdeleteData_(postdelete.payload.data);

      if (history.events.length === 3) {
        phase = 'POSTDELETE_VERIFIED_RESUME';
      } else {
        terminal = history.events[3];
        assertDynamicEnvelope_(
          terminal,
          4,
          'COLLAPSE_DELETE_VERIFIED',
          'COLLAPSE_DELETE_VERIFIED event'
        );

        if (
          text_(terminal.manifest.previousEventSha256) !==
            text_(postdelete.manifest.eventSha256)
        ) {
          fail_('COLLAPSE_DELETE_VERIFIED previous-event hash drift.');
        }

        assertTerminalData_(terminal.payload.data, postdelete);
        phase = 'VERIFIED_SUCCESS';
      }
    }

    if (!recovery || recovery.found !== true) {
      fail_('Incident recovery evidence is unavailable.');
    }

    if (
      recovery.automaticRetryPermitted !== false ||
      recovery.rowRecreationPermitted !== false ||
      recovery.journalMutationExecuted !== false
    ) {
      fail_('Incident recovery grants forbidden authority.');
    }

    if (
      phase === 'VERIFIED_SUCCESS'
        ? (
            recovery.classification !== 'VERIFIED_SUCCESS_JOURNAL' ||
            Number(recovery.eventCount) !== 4 ||
            text_(recovery.terminalEventSha256) !==
              text_(terminal.manifest.eventSha256)
          )
        : (
            recovery.classification !==
              'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL' ||
            Number(recovery.eventCount) !== history.events.length
          )
    ) {
      fail_('Incident recovery classification drift.');
    }

    return {
      phase: phase,
      eventCount: history.events.length,
      eventTypes: history.events.map(function (event) {
        return event.manifest.eventType;
      }),
      postdelete: postdelete,
      terminal: terminal
    };
  }

  function assertTargetBoundHistory_(store) {
    var operationIds = store.listOperationIds();

    if (!Array.isArray(operationIds)) {
      fail_('Operation-intent enumeration is malformed.');
    }

    var previous = '';
    var targetBound = [];

    for (var index = 0; index < operationIds.length; index++) {
      var operationId = text_(operationIds[index]);

      if (!operationId || (previous && operationId <= previous)) {
        fail_('Operation-intent enumeration is not strict deterministic order.');
      }

      previous = operationId;

      var history = store.read(operationId);

      if (
        !history ||
        history.found !== true ||
        !Array.isArray(history.events) ||
        history.events.length < 1 ||
        !history.events[0] ||
        !history.events[0].manifest
      ) {
        fail_('Enumerated operation history is unavailable or malformed.');
      }

      if (
        text_(history.events[0].manifest.targetDeleteDistressLeadId) ===
          TARGET_ID_
      ) {
        targetBound.push(operationId);
      }
    }

    exactStringArray_(
      targetBound,
      [OPERATION_ID_],
      'Target-bound operation IDs'
    );

    return targetBound;
  }

  function directKeepAuthority_(authority) {
    var metadata = authority.metadata();
    var catalog = authority.catalog();

    if (
      !metadata ||
      metadata.authoritySha256 !== AUTHORITY_SHA256_ ||
      metadata.winnerPlanFingerprintSha256 !== WINNER_PLAN_SHA256_ ||
      Number(metadata.directKeepGroupCount) !== 14 ||
      Number(metadata.directKeepDeleteCandidateCount) !== 16 ||
      !Array.isArray(catalog)
    ) {
      fail_('Immutable direct-keep authority drift.');
    }

    var matches = catalog.filter(function (entry) {
      return Number(entry.groupNumber) === GROUP_NUMBER_;
    });

    if (matches.length !== 1) {
      fail_('Group 4 direct-keep authority is missing or ambiguous.');
    }

    var entry = matches[0];

    if (
      text_(entry.violationNumber) !== VIOLATION_ ||
      text_(entry.proposedDurableKey) !== PROPOSED_DURABLE_KEY_ ||
      text_(entry.canonicalPropertyKey) !== CANONICAL_PROPERTY_KEY_ ||
      text_(entry.winnerDistressLeadId) !== WINNER_ID_
    ) {
      fail_('Group 4 immutable authority identity drift.');
    }

    exactStringArray_(
      entry.deleteCandidateDistressLeadIds,
      [TARGET_ID_],
      'Group 4 delete-candidate authority'
    );

    return {
      violationNumber: VIOLATION_,
      proposedDurableKey: PROPOSED_DURABLE_KEY_,
      canonicalPropertyKey: CANONICAL_PROPERTY_KEY_
    };
  }

  function liveIdentity_() {
    var rows = REOS.Database.getAll(TABLE_);

    if (!Array.isArray(rows)) {
      fail_('DISTRESS_LEADS read result is malformed.');
    }

    var winnerRows = [];
    var targetRows = [];

    rows.forEach(function (row) {
      var id = text_(row && row['Distress Lead ID']);

      if (id === WINNER_ID_) {
        winnerRows.push(row);
      } else if (id === TARGET_ID_) {
        targetRows.push(row);
      }
    });

    if (winnerRows.length !== 1) {
      fail_('Current winner identity is missing or ambiguous.');
    }

    if (targetRows.length !== 0) {
      fail_('Target row is present; post-barrier reconciliation is not eligible.');
    }

    var winner = winnerRows[0];
    var rowNumber = Number(winner._rowNumber || 0);

    if (!Number.isInteger(rowNumber) || rowNumber < 2) {
      fail_('Current winner physical row evidence is invalid.');
    }

    if (
      text_(winner.Source) !== SOURCE_ ||
      text_(winner['Source Dataset']) !== DATASET_ ||
      text_(winner['Violation Number']) !== VIOLATION_
    ) {
      fail_('Current winner source identity drift.');
    }

    if (
      text_(winner['Canonical Property Key']) &&
      text_(winner['Canonical Property Key']) !== CANONICAL_PROPERTY_KEY_
    ) {
      fail_('Stored current winner canonical property drift.');
    }

    var derived = REOS.CanonicalPropertyIdentity.resolve(
      Object.assign({}, winner)
    );

    if (
      !derived ||
      text_(derived.canonicalPropertyKey) !== CANONICAL_PROPERTY_KEY_ ||
      !text_(derived.sourceObservationKey)
    ) {
      fail_('Derived current winner canonical identity drift.');
    }

    return {
      winnerCurrentRowNumber: rowNumber,
      winnerCanonicalPropertyKey: CANONICAL_PROPERTY_KEY_,
      targetCertifiedCanonicalPropertyKey: CANONICAL_PROPERTY_KEY_
    };
  }

  function schedulerSnapshot_() {
    var triggers = ScriptApp.getProjectTriggers();

    if (!Array.isArray(triggers)) {
      fail_('Installable-trigger inventory is malformed.');
    }

    var managed = triggers.filter(function (trigger) {
      return (
        trigger &&
        typeof trigger.getHandlerFunction === 'function' &&
        text_(trigger.getHandlerFunction()) === SCHEDULER_HANDLER_
      );
    });

    if (managed.length !== 0) {
      fail_('County production scheduler is not frozen.');
    }

    return {
      handler: SCHEDULER_HANDLER_,
      triggerCount: managed.length
    };
  }

  function checkpoint_(scheduler) {
    var value = scheduler.getCheckpoint();

    var checkpoint = {
      id: text_(value && value.id),
      nextFeedIndex: Number(value && value.nextFeedIndex),
      currentFeedCursor: text_(value && value.currentFeedCursor),
      completedFeeds: Number(value && value.completedFeeds),
      totalFeeds: Number(value && value.totalFeeds),
      resultCount:
        value && Array.isArray(value.results)
          ? value.results.length
          : -1
    };

    assertCheckpoint_(checkpoint, 'Current checkpoint');
    return checkpoint;
  }

  function sameCheckpoint_(left, right) {
    return (
      left.id === right.id &&
      left.nextFeedIndex === right.nextFeedIndex &&
      left.currentFeedCursor === right.currentFeedCursor &&
      left.completedFeeds === right.completedFeeds &&
      left.totalFeeds === right.totalFeeds &&
      left.resultCount === right.resultCount
    );
  }

  function referenceClear_(audit) {
    var result = audit.audit({
      distressLeadIds: [TARGET_ID_],
      maxMatches: 1000,
      readBatchSize: 1000
    });

    if (
      !result ||
      result.ok !== true ||
      result.scanComplete !== true ||
      result.matchesTruncated === true ||
      result.truncated === true ||
      Number(result.matchCount) !== 0 ||
      !Array.isArray(result.unmatchedIds) ||
      result.unmatchedIds.length !== 1 ||
      result.unmatchedIds[0] !== TARGET_ID_
    ) {
      fail_('Complete downstream-reference clearance failed.');
    }

    return {
      referenceSurface: text_(result.referenceSurface),
      scannedSheetCount: Number(result.scannedSheetCount),
      matchCount: 0,
      scanComplete: true,
      matchesTruncated: false,
      targetDistressLeadId: TARGET_ID_
    };
  }

  function status() {
    if (arguments.length !== 0) {
      fail_('Status takes no caller-defined authority.');
    }

    var dependencies = requireDependencies_();
    REOS.Security.requireAdmin();

    var schedulerBefore = schedulerSnapshot_();
    var checkpointBefore = checkpoint_(dependencies.scheduler);

    var authority = directKeepAuthority_(dependencies.authority);
    var targetBoundOperationIds = assertTargetBoundHistory_(dependencies.store);
    var history = dependencies.store.read(OPERATION_ID_);
    var recovery = dependencies.store.recover(OPERATION_ID_);
    var journal = validateHistory_(history, recovery);
    var live = liveIdentity_();
    var referenceAudit = referenceClear_(dependencies.referenceAudit);

    var checkpointAfter = checkpoint_(dependencies.scheduler);
    var schedulerAfter = schedulerSnapshot_();

    if (!sameCheckpoint_(checkpointBefore, checkpointAfter)) {
      fail_('County checkpoint changed during incident evidence read.');
    }

    if (
      schedulerBefore.triggerCount !== schedulerAfter.triggerCount ||
      schedulerBefore.handler !== schedulerAfter.handler
    ) {
      fail_('County scheduler changed during incident evidence read.');
    }

    return Object.freeze({
      ok: true,
      mode: MODE_,
      contractVersion: CONTRACT_VERSION_,
      operationId: OPERATION_ID_,
      groupNumber: GROUP_NUMBER_,
      winnerDistressLeadId: WINNER_ID_,
      targetDeleteDistressLeadId: TARGET_ID_,
      violationNumber: authority.violationNumber,
      proposedDurableKey: authority.proposedDurableKey,
      canonicalPropertyKey: authority.canonicalPropertyKey,
      authoritySha256: AUTHORITY_SHA256_,
      winnerPlanFingerprintSha256: WINNER_PLAN_SHA256_,
      operationCreatedTimestampUtc: OPERATION_CREATED_AT_,
      preparedEventSha256: PREPARED_EVENT_SHA256_,
      preparedPayloadSha256: PREPARED_PAYLOAD_SHA256_,
      deleteBarrierEventSha256: BARRIER_EVENT_SHA256_,
      deleteBarrierPayloadSha256: BARRIER_PAYLOAD_SHA256_,
      journalPhase: journal.phase,
      journalEventCount: journal.eventCount,
      journalEventTypes: journal.eventTypes.slice(),
      postdeleteEventSha256:
        journal.postdelete ? text_(journal.postdelete.manifest.eventSha256) : '',
      postdeletePayloadSha256:
        journal.postdelete ? text_(journal.postdelete.manifest.payloadSha256) : '',
      terminalEventSha256:
        journal.terminal ? text_(journal.terminal.manifest.eventSha256) : '',
      terminalPayloadSha256:
        journal.terminal ? text_(journal.terminal.manifest.payloadSha256) : '',
      recoveryClassification: recovery.classification,
      targetBoundOperationIds: targetBoundOperationIds.slice(),
      winnerPresent: true,
      winnerPresentExactlyOnce: true,
      targetPresent: false,
      targetMatchCount: 0,
      winnerCurrentRowNumber: live.winnerCurrentRowNumber,
      winnerCanonicalPropertyKey: live.winnerCanonicalPropertyKey,
      targetCertifiedCanonicalPropertyKey:
        live.targetCertifiedCanonicalPropertyKey,
      downstreamReferenceAudit: referenceAudit,
      schedulerBefore: schedulerBefore,
      schedulerAfter: schedulerAfter,
      checkpointBefore: checkpointBefore,
      checkpointAfter: checkpointAfter,
      schedulerFrozen: true,
      checkpointFrozen: true,
      journalMutationExecuted: false,
      automaticRetryPermitted: false,
      executorRetryAuthorityGranted: false,
      secondExecutorInvocationAuthorityGranted: false,
      physicalDeleteAuthorityGranted: false,
      rowRecreationPermitted: false,
      productionDataMutationAuthorityGranted: false,
      maintenanceMutationAuthorityGranted: false,
      schedulerMutationAuthorityGranted: false,
      checkpointMutationAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      automaticMaoAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    });
  }

  return Object.freeze({
    status: status
  });
})();

function reosCountyCollapseGroup4PostBarrierTimeoutEvidenceStatus() {
  if (arguments.length !== 0) {
    throw new Error(
      'Group 4 post-barrier timeout evidence status takes no arguments.'
    );
  }

  return REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status();
}
