/**
 * REOS Enterprise
 *
 * Philadelphia Code Violations - Direct-Keep Collapse Executor v1
 *
 * Source implementation only.
 *
 * Production execution remains blocked by
 * CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE in the separately certified
 * successor preflight.
 *
 * One invocation targets one direct-keep group and one delete candidate.
 * There is exactly one physical-delete call site.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseExecutor =
(function () {
  'use strict';

  var TABLE =
    'DISTRESS_LEADS';

  var VERSION =
    'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1';

  var CONFIRM_TOKEN =
    'CONFIRM_DIRECT_KEEP_COLLAPSE_EXECUTION_V1';

  var CURRENT_WINNER_FINGERPRINT =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var CURRENT_AUTHORITY_SHA =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

  var GROUP2_HISTORY_EXCEPTION_MARKER_ =
    'GROUP2_CERTIFIED_POST_TERMINAL_HISTORY_EXCEPTION_V1';

  var GROUP2_INCIDENT_OPERATION_ID_ =
    '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

  var GROUP2_INCIDENT_GROUP_NUMBER_ = 2;

  var GROUP2_INCIDENT_WINNER_ID_ =
    'DL-20260820181645-7130';

  var GROUP2_INCIDENT_TARGET_ID_ =
    'DL-20260820181652-6183';

  var GROUP2_INCIDENT_OPERATION_CREATED_AT_ =
    '2026-09-20T23:49:45.327Z';

  var GROUP2_PREPARED_EVENT_SHA256_ =
    '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

  var GROUP2_PREPARED_PAYLOAD_SHA256_ =
    '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

  var GROUP2_TERMINAL_EVENT_SHA256_ =
    '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89';

  var GROUP2_TERMINAL_PAYLOAD_SHA256_ =
    '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2';

  var GROUP2_RECOVERY_CLASSIFICATION_ =
    'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

  var GROUP2_POST_TERMINAL_MODE_ =
    'READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1';

  var REQUEST_FIELDS = [
    'confirmExecution',
    'groupNumber',
    'deleteDistressLeadId',
    'expectedWinnerDistressLeadId',
    'expectedPlanFingerprintSha256',
    'expectedAuthoritySha256',
    'maintenanceToken',
    'expectedMaintenanceLeaseId',
    'expectedMaintenanceGateId'
  ];

  function fail_(message) {
    throw new Error(
      'County collapse executor: ' +
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

  function exactObject_(
    value,
    fields,
    label
  ) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      fail_(
        label +
        ' must be an object.'
      );
    }

    var actual =
      Object.keys(value)
        .slice()
        .sort();

    var expected =
      fields
        .slice()
        .sort();

    if (
      actual.length !==
      expected.length
    ) {
      fail_(
        label +
        ' has missing or unknown fields.'
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
          ' has missing or unknown fields.'
        );
      }
    }
  }

  function canonicalCell_(value) {
    if (value === '') {
      return {
        type:
          'blank'
      };
    }

    if (typeof value === 'string') {
      return {
        type:
          'string',
        value:
          value
      };
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        fail_(
          'Non-finite spreadsheet value.'
        );
      }

      return {
        type:
          'number',
        value:
          Object.is(value, -0)
            ? '0'
            : String(value)
      };
    }

    if (typeof value === 'boolean') {
      return {
        type:
          'boolean',
        value:
          value
      };
    }

    if (
      Object.prototype
        .toString
        .call(value) ===
        '[object Date]' &&
      Number.isFinite(
        value.getTime()
      )
    ) {
      return {
        type:
          'date',
        value:
          value.toISOString()
      };
    }

    fail_(
      'Unsupported spreadsheet value type.'
    );
  }

  function canonicalJson_(value) {
    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return (
        '[' +
        value
          .map(canonicalJson_)
          .join(',') +
        ']'
      );
    }

    if (typeof value === 'object') {
      var keys =
        Object.keys(value)
          .slice()
          .sort();

      return (
        '{' +
        keys
          .map(function (key) {
            return (
              JSON.stringify(key) +
              ':' +
              canonicalJson_(
                value[key]
              )
            );
          })
          .join(',') +
        '}'
      );
    }

    return JSON.stringify(value);
  }

  function same_(left, right) {
    return (
      canonicalJson_(left) ===
      canonicalJson_(right)
    );
  }

  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      fail_(
        'Admin security authority is required.'
      );
    }

    if (
      !REOS.Database ||
      typeof REOS.Database.withScriptLockContext !==
        'function' ||
      typeof REOS.Database.deletePhysicalRowExact !==
        'function'
    ) {
      fail_(
        'Certified Database lock/delete APIs are required.'
      );
    }

    if (
      !REOS.CountyCodeViolationCollapseMaintenanceGate ||
      typeof REOS
        .CountyCodeViolationCollapseMaintenanceGate
        .assertReady !==
        'function'
    ) {
      fail_(
        'Certified collapse maintenance gate is required.'
      );
    }

    if (
      !REOS.CountyCodeViolationCollapseDirectKeepExecutionAuthority ||
      typeof REOS
        .CountyCodeViolationCollapseDirectKeepExecutionAuthority
        .catalog !==
        'function' ||
      typeof REOS
        .CountyCodeViolationCollapseDirectKeepExecutionAuthority
        .metadata !==
        'function'
    ) {
      fail_(
        'Immutable direct-keep authority is required.'
      );
    }

    if (
      !REOS.CountyCodeViolationCollapseResidualEvidence ||
      typeof REOS
        .CountyCodeViolationCollapseResidualEvidence
        .read !==
        'function'
    ) {
      fail_(
        'Current residual evidence is required.'
      );
    }

    if (
      !REOS.CountyCodeViolationCollapseExecutionPreflightV2 ||
      typeof REOS
        .CountyCodeViolationCollapseExecutionPreflightV2
        .preflight !==
        'function'
    ) {
      fail_(
        'Successor execution preflight is required.'
      );
    }

    if (
      !REOS.CountyCollapseOperationIntentStore ||
      typeof REOS
        .CountyCollapseOperationIntentStore
        .prepare !==
        'function' ||
      typeof REOS
        .CountyCollapseOperationIntentStore
        .append !==
        'function' ||
      typeof REOS
        .CountyCollapseOperationIntentStore
        .read !==
        'function' ||
      typeof REOS
        .CountyCollapseOperationIntentStore
        .listOperationIds !==
        'function'
    ) {
      fail_(
        'Durable operation-intent store is required.'
      );
    }

    if (
      !REOS.CountyIdentityReferenceAudit ||
      typeof REOS
        .CountyIdentityReferenceAudit
        .audit !==
        'function'
    ) {
      fail_(
        'Complete downstream-reference audit is required.'
      );
    }

    if (
      typeof SpreadsheetApp ===
        'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp
        .getActiveSpreadsheet !==
        'function'
    ) {
      fail_(
        'Spreadsheet physical evidence support is required.'
      );
    }
  }

  function validateRequest_(request) {
    exactObject_(
      request,
      REQUEST_FIELDS,
      'Executor request'
    );

    if (
      request.confirmExecution !==
      CONFIRM_TOKEN
    ) {
      fail_(
        'Exact execution confirmation token is required.'
      );
    }

    if (
      !Number.isInteger(
        request.groupNumber
      ) ||
      request.groupNumber < 1
    ) {
      fail_(
        'Group number is invalid.'
      );
    }

    [
      'deleteDistressLeadId',
      'expectedWinnerDistressLeadId',
      'maintenanceToken',
      'expectedMaintenanceLeaseId',
      'expectedMaintenanceGateId'
    ].forEach(function (field) {
      if (!text_(request[field])) {
        fail_(
          'Required request field is empty: ' +
          field
        );
      }
    });

    if (
      request.expectedPlanFingerprintSha256 !==
      CURRENT_WINNER_FINGERPRINT
    ) {
      fail_(
        'Winner-plan fingerprint does not match current authority.'
      );
    }

    if (
      request.expectedAuthoritySha256 !==
      CURRENT_AUTHORITY_SHA
    ) {
      fail_(
        'Collapse authority SHA does not match current authority.'
      );
    }
  }

  function selectAuthority_(request) {
    var authority =
      REOS
        .CountyCodeViolationCollapseDirectKeepExecutionAuthority;

    var metadata =
      authority.metadata();

    var catalog =
      authority.catalog();

    if (
      !metadata ||
      metadata.authoritySha256 !==
        CURRENT_AUTHORITY_SHA ||
      metadata.winnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT ||
      Number(
        metadata.directKeepGroupCount
      ) !== 14 ||
      Number(
        metadata.directKeepDeleteCandidateCount
      ) !== 16 ||
      !Array.isArray(catalog) ||
      catalog.length !== 14
    ) {
      fail_(
        'Immutable direct-keep authority drift.'
      );
    }

    var selected =
      catalog.filter(
        function (entry) {
          return (
            Number(
              entry.groupNumber
            ) ===
            request.groupNumber
          );
        }
      );

    if (selected.length !== 1) {
      fail_(
        'Requested group is outside direct-keep authority.'
      );
    }

    selected =
      selected[0];

    if (
      text_(
        selected.winnerDistressLeadId
      ) !==
      request.expectedWinnerDistressLeadId
    ) {
      fail_(
        'Requested winner does not match immutable authority.'
      );
    }

    if (
      !Array.isArray(
        selected
          .deleteCandidateDistressLeadIds
      ) ||
      selected
        .deleteCandidateDistressLeadIds
        .map(text_)
        .indexOf(
          request.deleteDistressLeadId
        ) === -1
    ) {
      fail_(
        'Requested delete candidate is outside immutable authority.'
      );
    }

    return selected;
  }

  function requirePreflightReady_() {
    var preflight =
      REOS
        .CountyCodeViolationCollapseExecutionPreflightV2
        .preflight({});

    if (
      !preflight ||
      preflight.ok !== true ||
      preflight.authoritySha256 !==
        CURRENT_AUTHORITY_SHA ||
      preflight.winnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT ||
      preflight.schedulerFrozen !== true ||
      preflight.checkpointFrozen !== true ||
      preflight.physicalDeletePrimitiveAvailable !==
        true
    ) {
      fail_(
        'Successor execution preflight changed.'
      );
    }

    if (
      !Array.isArray(
        preflight.executionBlockers
      )
    ) {
      fail_(
        'Successor preflight blocker surface is malformed.'
      );
    }

    if (
      preflight.executionBlockers
        .indexOf(
          'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
        ) !== -1 ||
      preflight.collapseExecutionReady !==
        true ||
      preflight.executionBlockers.length !==
        0
    ) {
      fail_(
        'Certified successor preflight has not granted execution readiness.'
      );
    }

    return preflight;
  }

  function residualSelection_(
    selection,
    request
  ) {
    var residual =
      REOS
        .CountyCodeViolationCollapseResidualEvidence
        .read({});

    if (
      !residual ||
      residual.ok !== true ||
      residual.authoritySha256 !==
        CURRENT_AUTHORITY_SHA ||
      residual.winnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT ||
      residual.executionBlocked === true ||
      !Array.isArray(
        residual.currentRows
      ) ||
      !Array.isArray(
        residual.verifiedDeletes
      ) ||
      !Array.isArray(
        residual.uncertainOperationIds
      ) ||
      residual.uncertainOperationIds.length !==
        0
    ) {
      fail_(
        'Residual execution evidence is not clean.'
      );
    }

    var verified = {};

    residual.verifiedDeletes
      .forEach(function (entry) {
        verified[
          text_(
            entry
              .targetDeleteDistressLeadId
          )
        ] = true;
      });

    if (
      verified[
        request.deleteDistressLeadId
      ]
    ) {
      fail_(
        'Requested delete candidate is already verified deleted.'
      );
    }

    var expectedIds = [
      text_(
        selection.winnerDistressLeadId
      )
    ];

    selection
      .deleteCandidateDistressLeadIds
      .forEach(function (id) {
        id = text_(id);

        if (!verified[id]) {
          expectedIds.push(id);
        }
      });

    expectedIds.sort();

    var current =
      residual.currentRows
        .filter(function (entry) {
          return (
            Number(
              entry.groupNumber
            ) ===
            Number(
              selection.groupNumber
            )
          );
        })
        .slice();

    var actualIds =
      current
        .map(function (entry) {
          return text_(
            entry.distressLeadId
          );
        })
        .sort();

    if (
      JSON.stringify(actualIds) !==
      JSON.stringify(expectedIds)
    ) {
      fail_(
        'Current direct-keep group membership does not match residual authority.'
      );
    }

    var winnerRows =
      current.filter(
        function (entry) {
          return (
            text_(
              entry.distressLeadId
            ) ===
            request.expectedWinnerDistressLeadId
          );
        }
      );

    var targetRows =
      current.filter(
        function (entry) {
          return (
            text_(
              entry.distressLeadId
            ) ===
            request.deleteDistressLeadId
          );
        }
      );

    if (
      winnerRows.length !== 1 ||
      targetRows.length !== 1
    ) {
      fail_(
        'Winner or target identity is missing or ambiguous.'
      );
    }

    return {
      residual:
        residual,
      currentGroupRows:
        current
    };
  }

  function certifiedGroup2HistoryExceptionRequest_(
    request
  ) {
    return (
      Number(
        request.groupNumber
      ) ===
        GROUP2_INCIDENT_GROUP_NUMBER_ &&
      text_(
        request.expectedWinnerDistressLeadId
      ) ===
        GROUP2_INCIDENT_WINNER_ID_ &&
      text_(
        request.deleteDistressLeadId
      ) ===
        GROUP2_INCIDENT_TARGET_ID_
    );
  }

  function assertCertifiedGroup2HistoryExceptionHistory_(
    store,
    operationId,
    history,
    request
  ) {
    if (
      operationId !==
        GROUP2_INCIDENT_OPERATION_ID_ ||
      !certifiedGroup2HistoryExceptionRequest_(
        request
      ) ||
      !history ||
      history.found !== true ||
      text_(
        history.operationId
      ) !==
        GROUP2_INCIDENT_OPERATION_ID_ ||
      !Array.isArray(
        history.events
      ) ||
      history.events.length !== 2
    ) {
      fail_(
        'Certified Group 2 history-exception durable history changed.'
      );
    }

    var prepared =
      history.events[0] &&
      history.events[0].manifest;

    var terminal =
      history.events[1] &&
      history.events[1].manifest;

    if (
      !prepared ||
      !terminal
    ) {
      fail_(
        'Certified Group 2 history-exception durable history is malformed.'
      );
    }

    if (
      text_(
        prepared.operationId
      ) !==
        GROUP2_INCIDENT_OPERATION_ID_ ||
      Number(
        prepared.eventSequence
      ) !== 1 ||
      prepared.eventType !==
        'INTENT_PREPARED' ||
      Number(
        prepared.operationIntentContractVersion
      ) !== 1 ||
      text_(
        prepared.executorImplementationVersion
      ) !== VERSION ||
      Number(
        prepared.groupNumber
      ) !==
        GROUP2_INCIDENT_GROUP_NUMBER_ ||
      text_(
        prepared.winnerDistressLeadId
      ) !==
        GROUP2_INCIDENT_WINNER_ID_ ||
      text_(
        prepared.targetDeleteDistressLeadId
      ) !==
        GROUP2_INCIDENT_TARGET_ID_ ||
      text_(
        prepared.payloadSha256
      ) !==
        GROUP2_PREPARED_PAYLOAD_SHA256_ ||
      text_(
        prepared.previousEventSha256
      ) !==
        'GENESIS' ||
      text_(
        prepared.eventSha256
      ) !==
        GROUP2_PREPARED_EVENT_SHA256_
    ) {
      fail_(
        'Certified Group 2 prepared history evidence changed.'
      );
    }

    if (
      text_(
        terminal.operationId
      ) !==
        GROUP2_INCIDENT_OPERATION_ID_ ||
      Number(
        terminal.eventSequence
      ) !== 2 ||
      terminal.eventType !==
        'COLLAPSE_EXECUTOR_PRECONDITION_FAILED' ||
      Number(
        terminal.operationIntentContractVersion
      ) !== 1 ||
      text_(
        terminal.executorImplementationVersion
      ) !== VERSION ||
      Number(
        terminal.groupNumber
      ) !==
        GROUP2_INCIDENT_GROUP_NUMBER_ ||
      text_(
        terminal.winnerDistressLeadId
      ) !==
        GROUP2_INCIDENT_WINNER_ID_ ||
      text_(
        terminal.targetDeleteDistressLeadId
      ) !==
        GROUP2_INCIDENT_TARGET_ID_ ||
      text_(
        terminal.payloadSha256
      ) !==
        GROUP2_TERMINAL_PAYLOAD_SHA256_ ||
      text_(
        terminal.previousEventSha256
      ) !==
        GROUP2_PREPARED_EVENT_SHA256_ ||
      text_(
        terminal.eventSha256
      ) !==
        GROUP2_TERMINAL_EVENT_SHA256_
    ) {
      fail_(
        'Certified Group 2 terminal history evidence changed.'
      );
    }

    if (
      typeof store.recover !==
        'function'
    ) {
      fail_(
        'Strict operation recovery is required for the certified Group 2 history exception.'
      );
    }

    var recovery =
      store.recover(
        operationId
      );

    if (
      !recovery ||
      recovery.found !== true ||
      text_(
        recovery.operationId
      ) !==
        GROUP2_INCIDENT_OPERATION_ID_ ||
      recovery.classification !==
        GROUP2_RECOVERY_CLASSIFICATION_ ||
      Number(
        recovery.eventCount
      ) !== 2 ||
      recovery.automaticRetryPermitted !==
        false ||
      recovery.rowRecreationPermitted !==
        false ||
      recovery.journalMutationExecuted !==
        false
    ) {
      fail_(
        'Certified Group 2 history-exception recovery evidence changed.'
      );
    }
  }

  function assertFreshCertifiedGroup2HistoryExceptionEvidence_(
    request
  ) {
    if (
      !certifiedGroup2HistoryExceptionRequest_(
        request
      )
    ) {
      fail_(
        'Certified Group 2 history-exception request identity changed.'
      );
    }

    var reader =
      REOS
        .CountyCollapseGroup2PostTerminalReconciliation;

    if (
      !reader ||
      typeof reader.status !==
        'function'
    ) {
      fail_(
        'Certified Group 2 post-terminal evidence reader is required.'
      );
    }

    var evidence =
      reader.status();

    if (
      !evidence ||
      evidence.ok !== true ||
      evidence.mode !==
        GROUP2_POST_TERMINAL_MODE_ ||
      Number(
        evidence.contractVersion
      ) !== 1 ||
      text_(
        evidence.operationId
      ) !==
        GROUP2_INCIDENT_OPERATION_ID_ ||
      Number(
        evidence.groupNumber
      ) !==
        GROUP2_INCIDENT_GROUP_NUMBER_ ||
      text_(
        evidence.winnerDistressLeadId
      ) !==
        GROUP2_INCIDENT_WINNER_ID_ ||
      text_(
        evidence.targetDeleteDistressLeadId
      ) !==
        GROUP2_INCIDENT_TARGET_ID_ ||
      text_(
        evidence.operationCreatedTimestampUtc
      ) !==
        GROUP2_INCIDENT_OPERATION_CREATED_AT_ ||
      text_(
        evidence.preparedEventSha256
      ) !==
        GROUP2_PREPARED_EVENT_SHA256_ ||
      text_(
        evidence.preparedPayloadSha256
      ) !==
        GROUP2_PREPARED_PAYLOAD_SHA256_ ||
      text_(
        evidence.terminalEventSha256
      ) !==
        GROUP2_TERMINAL_EVENT_SHA256_ ||
      text_(
        evidence.terminalPayloadSha256
      ) !==
        GROUP2_TERMINAL_PAYLOAD_SHA256_ ||
      evidence.journalReadbackDecoded !==
        true ||
      Number(
        evidence.journalEventCount
      ) !== 2 ||
      !same_(
        evidence.journalEventTypes,
        [
          'INTENT_PREPARED',
          'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
        ]
      ) ||
      evidence.recoveryClassification !==
        GROUP2_RECOVERY_CLASSIFICATION_ ||
      evidence.winnerPresent !== true ||
      evidence.targetPresent !== true ||
      evidence.deleteBarrierPresent !==
        false ||
      evidence.verifiedDeletePresent !==
        false ||
      evidence.schedulerFrozen !== true ||
      evidence.checkpointFrozen !== true ||
      evidence.residualExecutionBlocked !==
        false ||
      evidence.postTerminalReconciliationComplete !==
        true ||
      evidence.executorHistoryExceptionEvidenceEligible !==
        true ||
      evidence.journalMutationExecuted !==
        false ||
      evidence.automaticRetryPermitted !==
        false ||
      evidence.executorRetryAuthorityGranted !==
        false ||
      evidence.executorHistoryExceptionImplementationAuthorityGranted !==
        false ||
      evidence.successorExecutionAuthorityGranted !==
        false ||
      evidence.collapseExecutionAuthorityGranted !==
        false ||
      evidence.physicalDeleteAuthorityGranted !==
        false ||
      evidence.productionDataMutationAuthorityGranted !==
        false ||
      evidence.maintenanceMutationAuthorityGranted !==
        false ||
      evidence.schedulerMutationAuthorityGranted !==
        false ||
      evidence.checkpointMutationAuthorityGranted !==
        false ||
      evidence.connectorExecutionAuthorityGranted !==
        false ||
      evidence.rowRecreationPermitted !==
        false ||
      evidence.automaticMaoAuthorityGranted !==
        false ||
      evidence.automaticOfferAuthorityGranted !==
        false
    ) {
      fail_(
        'Fresh certified Group 2 post-terminal evidence changed.'
      );
    }
  }

  function assertNoTargetBoundOperationHistory_(
    store,
    request
  ) {
    var operationIds =
      store.listOperationIds();

    if (!Array.isArray(operationIds)) {
      fail_(
        'Operation-intent enumeration is malformed.'
      );
    }

    var previousOperationId =
      '';

    var certifiedIncidentExceptionApplied =
      false;

    for (
      var index = 0;
      index < operationIds.length;
      index++
    ) {
      var operationId =
        text_(
          operationIds[index]
        );

      if (
        !operationId ||
        (
          previousOperationId &&
          operationId <=
            previousOperationId
        )
      ) {
        fail_(
          'Operation-intent enumeration is not strict deterministic order.'
        );
      }

      previousOperationId =
        operationId;

      var history =
        store.read(
          operationId
        );

      if (
        !history ||
        history.found !== true ||
        !Array.isArray(
          history.events
        ) ||
        history.events.length < 1 ||
        !history.events[0] ||
        !history.events[0].manifest
      ) {
        fail_(
          'Enumerated operation history is unavailable or malformed.'
        );
      }

      var targetBound =
        text_(
          history
            .events[0]
            .manifest
            .targetDeleteDistressLeadId
        ) ===
        text_(
          request.deleteDistressLeadId
        );

      if (
        operationId ===
          GROUP2_INCIDENT_OPERATION_ID_ &&
        certifiedGroup2HistoryExceptionRequest_(
          request
        )
      ) {
        if (
          certifiedIncidentExceptionApplied
        ) {
          fail_(
            'Existing durable operation history already binds requested delete candidate.'
          );
        }

        assertCertifiedGroup2HistoryExceptionHistory_(
          store,
          operationId,
          history,
          request
        );

        assertFreshCertifiedGroup2HistoryExceptionEvidence_(
          request
        );

        certifiedIncidentExceptionApplied =
          true;

        continue;
      }

      if (targetBound) {
        fail_(
          'Existing durable operation history already binds requested delete candidate.'
        );
      }
    }
  }

  function captureSheetEvidence_(
    currentGroupRows
  ) {
    var spreadsheet =
      SpreadsheetApp
        .getActiveSpreadsheet();

    if (
      !spreadsheet ||
      typeof spreadsheet.getId !==
        'function' ||
      typeof spreadsheet.getSheetByName !==
        'function'
    ) {
      fail_(
        'Active spreadsheet identity is unavailable.'
      );
    }

    var sheet =
      spreadsheet
        .getSheetByName(TABLE);

    if (!sheet) {
      fail_(
        'DISTRESS_LEADS sheet is unavailable.'
      );
    }

    var lastRow =
      Number(
        sheet.getLastRow()
      );

    var lastColumn =
      Number(
        sheet.getLastColumn()
      );

    var maxRows =
      Number(
        sheet.getMaxRows()
      );

    var maxColumns =
      Number(
        sheet.getMaxColumns()
      );

    if (
      !Number.isInteger(lastRow) ||
      !Number.isInteger(lastColumn) ||
      !Number.isInteger(maxRows) ||
      !Number.isInteger(maxColumns) ||
      lastRow < 2 ||
      lastColumn < 1 ||
      maxRows < lastRow ||
      maxColumns < lastColumn
    ) {
      fail_(
        'DISTRESS_LEADS physical geometry is invalid.'
      );
    }

    var headers =
      sheet
        .getRange(
          1,
          1,
          1,
          lastColumn
        )
        .getValues()[0];

    var idIndexes = [];

    headers.forEach(
      function (header, index) {
        if (
          text_(header) ===
          'Distress Lead ID'
        ) {
          idIndexes.push(index);
        }
      }
    );

    if (idIndexes.length !== 1) {
      fail_(
        'Distress Lead ID header is missing or ambiguous.'
      );
    }

    var idIndex =
      idIndexes[0];

    var idValues =
      sheet
        .getRange(
          2,
          idIndex + 1,
          lastRow - 1,
          1
        )
        .getValues();

    var idRows = {};

    idValues.forEach(
      function (row, index) {
        var id =
          text_(row[0]);

        if (!id) {
          return;
        }

        idRows[id] =
          idRows[id] || [];

        idRows[id]
          .push(index + 2);
      }
    );

    var groupPreimages =
      currentGroupRows
        .map(function (entry) {
          var id =
            text_(
              entry.distressLeadId
            );

          var physical =
            idRows[id] || [];

          if (
            physical.length !== 1 ||
            physical[0] !==
              Number(
                entry.currentRowNumber
              )
          ) {
            fail_(
              'Current physical identity moved or became ambiguous: ' +
              id
            );
          }

          var range =
            sheet.getRange(
              physical[0],
              1,
              1,
              lastColumn
            );

          var values =
            range.getValues()[0];

          var formulas =
            range.getFormulas()[0];

          if (
            values.length !==
              lastColumn ||
            formulas.length !==
              lastColumn
          ) {
            fail_(
              'Complete row preimage is unavailable: ' +
              id
            );
          }

          return {
            distressLeadId:
              id,
            rowNumber:
              physical[0],
            values:
              values.map(
                canonicalCell_
              ),
            formulas:
              formulas.slice()
          };
        })
        .sort(function (a, b) {
          return (
            a.rowNumber -
            b.rowNumber
          );
        });

    return {
      spreadsheetId:
        text_(
          spreadsheet.getId()
        ),
      sheetId:
        Number(
          sheet.getSheetId()
        ),
      sheetName:
        TABLE,
      lastRow:
        lastRow,
      lastColumn:
        lastColumn,
      maxRows:
        maxRows,
      maxColumns:
        maxColumns,
      headers:
        headers.slice(),
      idColumnNumber:
        idIndex + 1,
      groupPreimages:
        groupPreimages
    };
  }

  function targetPreimage_(
    sheetEvidence,
    request
  ) {
    var matches =
      sheetEvidence
        .groupPreimages
        .filter(function (entry) {
          return (
            entry.distressLeadId ===
            request.deleteDistressLeadId
          );
        });

    if (matches.length !== 1) {
      fail_(
        'Target preimage is missing or ambiguous.'
      );
    }

    return matches[0];
  }

  function buildPrimitiveRequest_(
    sheetEvidence,
    request
  ) {
    var target =
      targetPreimage_(
        sheetEvidence,
        request
      );

    return {
      spreadsheetId:
        sheetEvidence.spreadsheetId,
      sheetId:
        sheetEvidence.sheetId,
      expectedRowNumber:
        target.rowNumber,
      idField:
        'Distress Lead ID',
      idValue:
        request.deleteDistressLeadId,
      expectedLastRow:
        sheetEvidence.lastRow,
      expectedLastColumn:
        sheetEvidence.lastColumn,
      expectedMaxRows:
        sheetEvidence.maxRows,
      expectedMaxColumns:
        sheetEvidence.maxColumns,
      expectedHeaders:
        sheetEvidence.headers.slice(),
      expectedRowValues:
        target.values.slice(),
      expectedRowFormulas:
        target.formulas.slice()
    };
  }

  function referenceClear_(targetId) {
    var audit =
      REOS
        .CountyIdentityReferenceAudit
        .audit({
          distressLeadIds: [
            targetId
          ],
          maxMatches:
            1000,
          readBatchSize:
            1000
        });

    if (
      !audit ||
      audit.ok !== true ||
      audit.scanComplete !== true ||
      audit.matchesTruncated === true ||
      audit.truncated === true ||
      Number(
        audit.matchCount
      ) !== 0 ||
      !Array.isArray(
        audit.unmatchedIds
      ) ||
      audit.unmatchedIds.length !== 1 ||
      audit.unmatchedIds[0] !==
        targetId
    ) {
      fail_(
        'Complete downstream-reference clearance failed.'
      );
    }

    return {
      referenceSurface:
        audit.referenceSurface,
      scannedSheetCount:
        Number(
          audit.scannedSheetCount
        ),
      matchCount:
        Number(
          audit.matchCount
        ),
      scanComplete:
        true,
      matchesTruncated:
        false,
      targetDistressLeadId:
        targetId
    };
  }

  function maintenanceReady_(
    request,
    lockContext
  ) {
    var ready =
      REOS
        .CountyCodeViolationCollapseMaintenanceGate
        .assertReady({
          maintenanceToken:
            request.maintenanceToken,
          expectedLeaseId:
            request
              .expectedMaintenanceLeaseId,
          expectedGateId:
            request
              .expectedMaintenanceGateId,
          lockContext:
            lockContext
        });

    if (
      !ready ||
      ready.ready !== true ||
      ready.maintenanceReady !==
        true ||
      ready.authorityGeneration !==
        'CURRENT' ||
      ready.leaseId !==
        request.expectedMaintenanceLeaseId ||
      ready.gateId !==
        request.expectedMaintenanceGateId ||
      ready
        .manualExternalWritersQuiescentCertified !==
        true
    ) {
      fail_(
        'Maintenance capability is not ready under the executor lock.'
      );
    }

    return ready;
  }

  function intentPayload_(
    selection,
    request,
    preflight,
    maintenance,
    sheetEvidence,
    referenceAudit,
    primitiveRequest
  ) {
    return {
      authoritySha256:
        CURRENT_AUTHORITY_SHA,
      winnerPlanFingerprintSha256:
        CURRENT_WINNER_FINGERPRINT,
      groupNumber:
        Number(
          selection.groupNumber
        ),
      violationNumber:
        text_(
          selection.violationNumber
        ),
      proposedDurableKey:
        text_(
          selection.proposedDurableKey
        ),
      canonicalPropertyKey:
        text_(
          selection.canonicalPropertyKey
        ),
      winnerDistressLeadId:
        request
          .expectedWinnerDistressLeadId,
      targetDeleteDistressLeadId:
        request
          .deleteDistressLeadId,
      maintenanceCapability:
        {
          gateId:
            maintenance.gateId,
          leaseId:
            maintenance.leaseId,
          authorityGeneration:
            maintenance.authorityGeneration,
          rawTokenPersisted:
            false
        },
      scheduler:
        preflight.schedulerAfter,
      checkpoint:
        preflight.checkpointAfter,
      spreadsheet:
        {
          spreadsheetId:
            sheetEvidence.spreadsheetId,
          sheetId:
            sheetEvidence.sheetId,
          sheetName:
            sheetEvidence.sheetName,
          lastRow:
            sheetEvidence.lastRow,
          lastColumn:
            sheetEvidence.lastColumn,
          maxRows:
            sheetEvidence.maxRows,
          maxColumns:
            sheetEvidence.maxColumns,
          headers:
            sheetEvidence.headers,
          groupPreimages:
            sheetEvidence.groupPreimages
        },
      downstreamReferenceAudit:
        referenceAudit,
      physicalDeleteRequest:
        primitiveRequest,
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false,
      automaticMaintenanceClosePermitted:
        false
    };
  }

  function postDeleteVerify_(
    before,
    request
  ) {
    var spreadsheet =
      SpreadsheetApp
        .getActiveSpreadsheet();

    if (
      text_(
        spreadsheet.getId()
      ) !==
      before.spreadsheetId
    ) {
      fail_(
        'Spreadsheet identity changed after deletion.'
      );
    }

    var sheet =
      spreadsheet
        .getSheetByName(TABLE);

    if (
      !sheet ||
      Number(
        sheet.getSheetId()
      ) !==
        before.sheetId
    ) {
      fail_(
        'Sheet identity changed after deletion.'
      );
    }

    if (
      Number(
        sheet.getLastRow()
      ) !==
        before.lastRow - 1 ||
      Number(
        sheet.getLastColumn()
      ) !==
        before.lastColumn ||
      Number(
        sheet.getMaxRows()
      ) !==
        before.maxRows - 1 ||
      Number(
        sheet.getMaxColumns()
      ) !==
        before.maxColumns
    ) {
      fail_(
        'Post-delete physical geometry is not exact.'
      );
    }

    var headers =
      sheet
        .getRange(
          1,
          1,
          1,
          before.lastColumn
        )
        .getValues()[0];

    if (
      !same_(
        headers,
        before.headers
      )
    ) {
      fail_(
        'Header row changed after deletion.'
      );
    }

    var idValues =
      sheet
        .getRange(
          2,
          before.idColumnNumber,
          before.lastRow - 2,
          1
        )
        .getValues();

    var idRows = {};

    idValues.forEach(
      function (row, index) {
        var id =
          text_(row[0]);

        if (!id) {
          return;
        }

        idRows[id] =
          idRows[id] || [];

        idRows[id]
          .push(index + 2);
      }
    );

    if (
      idRows[
        request.deleteDistressLeadId
      ]
    ) {
      fail_(
        'Deleted Distress Lead ID remains physically present.'
      );
    }

    var survivors = [];

    before.groupPreimages
      .forEach(function (preimage) {
        if (
          preimage.distressLeadId ===
          request.deleteDistressLeadId
        ) {
          return;
        }

        var physical =
          idRows[
            preimage.distressLeadId
          ] || [];

        if (physical.length !== 1) {
          fail_(
            'Residual group survivor is missing or ambiguous: ' +
            preimage.distressLeadId
          );
        }

        var range =
          sheet.getRange(
            physical[0],
            1,
            1,
            before.lastColumn
          );

        var values =
          range
            .getValues()[0]
            .map(
              canonicalCell_
            );

        var formulas =
          range
            .getFormulas()[0];

        if (
          !same_(
            values,
            preimage.values
          ) ||
          !same_(
            formulas,
            preimage.formulas
          )
        ) {
          fail_(
            'Residual group survivor changed: ' +
            preimage.distressLeadId
          );
        }

        survivors.push({
          distressLeadId:
            preimage.distressLeadId,
          currentRowNumber:
            physical[0]
        });
      });

    var references =
      referenceClear_(
        request.deleteDistressLeadId
      );

    return {
      targetAbsent:
        true,
      survivors:
        survivors,
      downstreamReferenceAudit:
        references,
      postDeleteLastRow:
        before.lastRow - 1,
      postDeleteMaxRows:
        before.maxRows - 1
    };
  }

  function failureResult_(
    classification,
    operationId,
    error
  ) {
    return Object.freeze({
      ok:
        false,
      classification:
        classification,
      operationId:
        operationId || '',
      error:
        String(
          error &&
          error.message
            ? error.message
            : error
        ),
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false,
      automaticMaintenanceClosePermitted:
        false,
      collapseExecutionAuthorityGranted:
        false,
      schedulerMutationAuthorityGranted:
        false,
      checkpointMutationAuthorityGranted:
        false,
      connectorExecutionAuthorityGranted:
        false,
      automaticOfferAuthorityGranted:
        false
    });
  }

  function execute(request) {
    requireDependencies_();
    REOS.Security.requireAdmin();

    validateRequest_(
      request
    );

    var initialSelection =
      selectAuthority_(
        request
      );

    requirePreflightReady_();

    residualSelection_(
      initialSelection,
      request
    );

    return REOS.Database
      .withScriptLockContext(
        function (lockContext) {
          var store =
            REOS
              .CountyCollapseOperationIntentStore;

          var operationId =
            '';

          var barrierPersisted =
            false;

          try {
            var maintenance =
              maintenanceReady_(
                request,
                lockContext
              );

            var preflight =
              requirePreflightReady_();

            var selection =
              selectAuthority_(
                request
              );

            var residual =
              residualSelection_(
                selection,
                request
              );

            var sheetEvidence =
              captureSheetEvidence_(
                residual.currentGroupRows
              );

            var references =
              referenceClear_(
                request
                  .deleteDistressLeadId
              );

            var primitiveRequest =
              buildPrimitiveRequest_(
                sheetEvidence,
                request
              );

            assertNoTargetBoundOperationHistory_(
              store,
              request
            );

            var prepared =
              store.prepare(
                {
                  executorImplementationVersion:
                    VERSION,
                  groupNumber:
                    Number(
                      selection.groupNumber
                    ),
                  winnerDistressLeadId:
                    request
                      .expectedWinnerDistressLeadId,
                  targetDeleteDistressLeadId:
                    request
                      .deleteDistressLeadId,
                  payload:
                    intentPayload_(
                      selection,
                      request,
                      preflight,
                      maintenance,
                      sheetEvidence,
                      references,
                      primitiveRequest
                    )
                },
                {
                  lockContext:
                    lockContext
                }
              );

            if (
              !prepared ||
              prepared.readbackVerified !==
                true ||
              !text_(
                prepared.operationId
              )
            ) {
              fail_(
                'Durable operation intent readback failed.'
              );
            }

            operationId =
              prepared.operationId;

            var readback =
              store.read(
                operationId
              );

            if (
              !readback ||
              readback.found !== true ||
              !Array.isArray(
                readback.events
              ) ||
              readback.events.length !==
                1 ||
              readback
                .events[0]
                .manifest
                .eventType !==
                'INTENT_PREPARED'
            ) {
              fail_(
                'Prepared operation journal is not exact.'
              );
            }

            maintenanceReady_(
              request,
              lockContext
            );

            requirePreflightReady_();

            var residualAgain =
              residualSelection_(
                selection,
                request
              );

            var sheetAgain =
              captureSheetEvidence_(
                residualAgain
                  .currentGroupRows
              );

            var referencesAgain =
              referenceClear_(
                request
                  .deleteDistressLeadId
              );

            var primitiveAgain =
              buildPrimitiveRequest_(
                sheetAgain,
                request
              );

            if (
              !same_(
                primitiveAgain,
                primitiveRequest
              ) ||
              !same_(
                referencesAgain,
                references
              )
            ) {
              fail_(
                'Pre-delete evidence changed after intent persistence.'
              );
            }

            requirePreflightReady_();

            maintenanceReady_(
              request,
              lockContext
            );

            var barrier =
              store.append(
                {
                  operationId:
                    operationId,
                  eventType:
                    'DELETE_INVOCATION_STARTED',
                  payload:
                    {
                      physicalDeleteRequest:
                        primitiveRequest,
                      downstreamReferenceAudit:
                        referencesAgain,
                      sameOuterDatabaseLock:
                        true,
                      automaticRetryPermitted:
                        false
                    }
                },
                {
                  lockContext:
                    lockContext
                }
              );

            if (
              !barrier ||
              barrier.readbackVerified !==
                true
            ) {
              fail_(
                'Delete invocation barrier was not durably verified.'
              );
            }

            barrierPersisted =
              true;

            var deleted =
              REOS.Database
                .deletePhysicalRowExact(
                  TABLE,
                  primitiveRequest,
                  {
                    lockContext:
                      lockContext
                  }
                );

            if (
              !deleted ||
              deleted.classification !==
                'DELETED_VERIFIED' ||
              deleted.idValue !==
                request
                  .deleteDistressLeadId
            ) {
              fail_(
                'Physical delete did not return exact verified success.'
              );
            }

            var postdelete =
              postDeleteVerify_(
                sheetEvidence,
                request
              );

            var postEvent =
              store.append(
                {
                  operationId:
                    operationId,
                  eventType:
                    'POSTDELETE_VERIFIED',
                  payload:
                    {
                      primitiveResult:
                        deleted,
                      residualVerification:
                        postdelete,
                      automaticRetryPermitted:
                        false,
                      rowRecreationPermitted:
                        false
                    }
                },
                {
                  lockContext:
                    lockContext
                }
              );

            if (
              !postEvent ||
              postEvent.readbackVerified !==
                true
            ) {
              fail_(
                'Post-delete verification journal event was not durable.'
              );
            }

            var terminal =
              store.append(
                {
                  operationId:
                    operationId,
                  eventType:
                    'COLLAPSE_DELETE_VERIFIED',
                  payload:
                    {
                      targetDeleteDistressLeadId:
                        request
                          .deleteDistressLeadId,
                      winnerDistressLeadId:
                        request
                          .expectedWinnerDistressLeadId,
                      physicalDeleteClassification:
                        'DELETED_VERIFIED',
                      residualVerified:
                        true,
                      downstreamReferencesClear:
                        true,
                      automaticRetryPermitted:
                        false,
                      rowRecreationPermitted:
                        false,
                      automaticMaintenanceClosePermitted:
                        false
                    }
                },
                {
                  lockContext:
                    lockContext
                }
              );

            if (
              !terminal ||
              terminal.readbackVerified !==
                true
            ) {
              fail_(
                'Verified terminal operation event was not durable.'
              );
            }

            return Object.freeze({
              ok:
                true,
              classification:
                'COLLAPSE_DELETE_VERIFIED',
              operationId:
                operationId,
              groupNumber:
                request.groupNumber,
              winnerDistressLeadId:
                request
                  .expectedWinnerDistressLeadId,
              deletedDistressLeadId:
                request
                  .deleteDistressLeadId,
              physicalDeleteCalls:
                1,
              automaticRetryPermitted:
                false,
              rowRecreationPermitted:
                false,
              automaticMaintenanceClosePermitted:
                false,
              collapseExecutionAuthorityGranted:
                false,
              schedulerMutationAuthorityGranted:
                false,
              checkpointMutationAuthorityGranted:
                false,
              connectorExecutionAuthorityGranted:
                false,
              automaticOfferAuthorityGranted:
                false
            });
          } catch (error) {
            if (!operationId) {
              throw error;
            }

            if (!barrierPersisted) {
              try {
                store.append(
                  {
                    operationId:
                      operationId,
                    eventType:
                      'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
                    payload:
                      {
                        reason:
                          String(
                            error &&
                            error.message
                              ? error.message
                              : error
                          ),
                        automaticRetryPermitted:
                          false,
                        rowRecreationPermitted:
                          false,
                        automaticMaintenanceClosePermitted:
                          false
                      }
                  },
                  {
                    lockContext:
                      lockContext
                  }
                );
              } catch (journalError) {
                throw error;
              }

              return failureResult_(
                'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
                operationId,
                error
              );
            }

            try {
              store.append(
                {
                  operationId:
                    operationId,
                  eventType:
                    'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN',
                  payload:
                    {
                      reason:
                        String(
                          error &&
                          error.message
                            ? error.message
                            : error
                        ),
                      primitiveClassification:
                        text_(
                          error &&
                          error.classification
                        ),
                      automaticRetryPermitted:
                        false,
                      rowRecreationPermitted:
                        false,
                      automaticMaintenanceClosePermitted:
                        false
                    }
                },
                {
                  lockContext:
                    lockContext
                }
              );
            } catch (journalError) {
              /* Existing barrier remains durable uncertain evidence. */
            }

            return failureResult_(
              'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN',
              operationId,
              error
            );
          }
        }
      );
  }

  return Object.freeze({
    execute:
      execute
  });
})();

function reosCountyCodeViolationCollapseExecute(request) {
  if (arguments.length !== 1) {
    throw new Error(
      'Collapse executor RPC requires exactly one request.'
    );
  }

  return REOS
    .CountyCodeViolationCollapseExecutor
    .execute(request);
}
