/**
 * REOS Enterprise
 * County Collapse Operation-Intent Exact Orphan Binding Recovery v1
 *
 * Incident-specific recovery surface for binding the single certified
 * operation-intent workbook orphan created by the failed production
 * prerequisite-provisioning attempt.
 *
 * This module may perform exactly one persistent mutation:
 *
 *   bind REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID
 *   to the certified orphan workbook ID through one Script Property write.
 *
 * It cannot create, edit, replace, share, delete, or otherwise mutate a
 * spreadsheet and grants no collapse/data/scheduler/checkpoint/offer authority.
 */
var REOS = REOS || {};

REOS.CountyCollapseOperationIntentOrphanBindingRecovery =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;

  var CURRENT_WINNER_FINGERPRINT_ =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var CURRENT_AUTHORITY_SHA_ =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

  var CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_ =
    '36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c';

  var PROPERTY_KEY_ =
    'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID';

  var WORKBOOK_NAME_ =
    'REOS County Collapse Operation Intent Journal';

  var EVENT_SHEET_ =
    'COUNTY_COLLAPSE_OPERATION_INTENTS';

  var CHUNK_SHEET_ =
    'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS';

  var EVENT_HEADERS_ = [
    'Operation ID',
    'Event Sequence',
    'Event Type',
    'Event Timestamp UTC',
    'Operation Intent Contract Version',
    'Executor Implementation Version',
    'Group Number',
    'Winner Distress Lead ID',
    'Target Delete Distress Lead ID',
    'Payload SHA-256',
    'Payload UTF-8 Bytes',
    'Payload Chunk Count',
    'Previous Event SHA-256',
    'Event SHA-256'
  ];

  var CHUNK_HEADERS_ = [
    'Operation ID',
    'Event Sequence',
    'Chunk Index',
    'Chunk UTF-8 Bytes',
    'Chunk SHA-256',
    'Chunk Data'
  ];

  function fail_(message) {
    throw new Error(
      'County collapse operation-intent orphan binding recovery: ' +
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

  function exactOptions_(options) {
    var required = [
      'confirmRecovery',
      'orphanWorkbookId',
      'expectedOrphanWorkbookIdSha256',
      'expectedWinnerPlanFingerprintSha256',
      'expectedAuthoritySha256'
    ];

    if (
      !options ||
      typeof options !== 'object' ||
      Array.isArray(options)
    ) {
      fail_('Recovery options must be an object.');
    }

    Object.keys(options).forEach(function (key) {
      if (required.indexOf(key) === -1) {
        fail_(
          'Recovery options contain unsupported field: ' +
          key
        );
      }
    });

    required.forEach(function (key) {
      if (
        !Object.prototype.hasOwnProperty.call(
          options,
          key
        )
      ) {
        fail_(
          'Recovery options are missing required field: ' +
          key
        );
      }
    });
  }

  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      fail_('Admin authority support is required.');
    }

    REOS.Security.requireAdmin();
  }

  function requireUtilities_() {
    if (
      typeof Utilities === 'undefined' ||
      !Utilities ||
      typeof Utilities.computeDigest !== 'function'
    ) {
      fail_('SHA-256 support is required.');
    }
  }

  function sha256_(value) {
    requireUtilities_();

    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        text_(value),
        Utilities.Charset.UTF_8
      );

    return digest.map(function (byte) {
      var normalized =
        byte < 0
          ? byte + 256
          : byte;

      return (
        normalized < 16
          ? '0'
          : ''
      ) + normalized.toString(16);
    }).join('');
  }

  function authorityFree_(value) {
    return Object.assign(
      {},
      value,
      {
        collapseExecutionAuthorityGranted: false,
        productionDataMutationAuthorityGranted: false,
        countyDataMutationAuthorityGranted: false,
        physicalDeleteAuthorityGranted: false,
        insertAuthorityGranted: false,
        updateAuthorityGranted: false,
        deleteAuthorityGranted: false,
        schedulerMutationAuthorityGranted: false,
        checkpointMutationAuthorityGranted: false,
        connectorExecutionAuthorityGranted: false,
        maintenanceLeaseOpenAuthorityGranted: false,
        maintenanceLeaseCloseAuthorityGranted: false,
        automaticOfferAuthorityGranted: false
      }
    );
  }

  function prerequisiteStatus_() {
    var prerequisite =
      REOS.CountyCollapseRuntimePrerequisiteCertification;

    if (
      !prerequisite ||
      typeof prerequisite.status !== 'function'
    ) {
      fail_(
        'Certified runtime-prerequisite status support is required.'
      );
    }

    var status =
      prerequisite.status();

    if (
      !status ||
      typeof status !== 'object'
    ) {
      fail_(
        'Runtime-prerequisite status result is malformed.'
      );
    }

    return status;
  }

  function assertNoAuthority_(status) {
    [
      'collapseExecutionAuthorityGranted',
      'productionDataMutationAuthorityGranted',
      'countyDataMutationAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'insertAuthorityGranted',
      'updateAuthorityGranted',
      'deleteAuthorityGranted',
      'schedulerMutationAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'connectorExecutionAuthorityGranted',
      'maintenanceLeaseOpenAuthorityGranted',
      'maintenanceLeaseCloseAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(function (field) {
      if (status[field] !== false) {
        fail_(
          'Runtime prerequisite unexpectedly grants authority: ' +
          field
        );
      }
    });
  }

  function assertPreRecoveryStatus_(
    status,
    options
  ) {
    if (
      status.ok !== true ||
      status.mode !==
        'READ_ONLY_RUNTIME_PREREQUISITE_STATUS' ||
      status.contractVersion !== 1
    ) {
      fail_(
        'Runtime-prerequisite status is not certified.'
      );
    }

    if (
      options.expectedWinnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT_ ||
      status.currentWinnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT_
    ) {
      fail_(
        'Winner-plan fingerprint does not match current certified authority.'
      );
    }

    if (
      options.expectedAuthoritySha256 !==
        CURRENT_AUTHORITY_SHA_ ||
      status.currentCollapseAuthoritySha256 !==
        CURRENT_AUTHORITY_SHA_
    ) {
      fail_(
        'Collapse authority SHA does not match current certified authority.'
      );
    }

    if (
      status.leaseState !== 'ABSENT' ||
      text_(status.leaseAuthorityGeneration) !== '' ||
      status.leaseTransitionSafe !== true
    ) {
      fail_(
        'Production lease state is not the exact certified ABSENT recovery prestate.'
      );
    }

    if (
      status.operationIntentConfigured !== false ||
      text_(
        status.operationIntentWorkbookIdSha256
      ) !== '' ||
      status.operationIntentSchemaCertified !== false ||
      status.operationIntentAccessBindingCertified !== false ||
      Number(
        status.operationIntentEventDataRowCount
      ) !== 0 ||
      Number(
        status.operationIntentChunkDataRowCount
      ) !== 0 ||
      status.operationIntentInitialEmptyStoreCertified !==
        false ||
      text_(
        status.operationIntentBindingError
      ) !== '' ||
      status.prerequisitesReadyForExecutorImplementation !==
        false
    ) {
      fail_(
        'Operation-intent prerequisite state no longer matches the certified unbound recovery prestate.'
      );
    }

    assertNoAuthority_(
      status
    );
  }

  function requireWorkbookId_(value) {
    var workbookId =
      text_(value);

    if (
      !workbookId ||
      !/^[A-Za-z0-9_-]+$/.test(
        workbookId
      )
    ) {
      fail_(
        'Supplied orphan workbook ID is malformed.'
      );
    }

    return workbookId;
  }

  function spreadsheetSupport_() {
    if (
      typeof SpreadsheetApp === 'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp.getActiveSpreadsheet !==
        'function' ||
      typeof SpreadsheetApp.openById !==
        'function'
    ) {
      fail_(
        'Spreadsheet read support is required.'
      );
    }
  }

  function activeWorkbookId_() {
    spreadsheetSupport_();

    var active =
      SpreadsheetApp.getActiveSpreadsheet();

    if (
      !active ||
      typeof active.getId !== 'function'
    ) {
      fail_(
        'Active county-data workbook identity is unavailable.'
      );
    }

    var id =
      text_(
        active.getId()
      );

    if (!id) {
      fail_(
        'Active county-data workbook ID is empty.'
      );
    }

    return id;
  }

  function userEmail_(user) {
    if (
      !user ||
      typeof user.getEmail !== 'function'
    ) {
      fail_(
        'Workbook user identity support is unavailable.'
      );
    }

    var email =
      text_(
        user.getEmail()
      ).toLowerCase();

    if (!email) {
      fail_(
        'Workbook user identity is empty.'
      );
    }

    return email;
  }

  function exactHeaders_(
    sheet,
    expected,
    label
  ) {
    if (
      !sheet ||
      typeof sheet.getLastColumn !== 'function' ||
      typeof sheet.getRange !== 'function'
    ) {
      fail_(
        label +
        ' journal sheet API is unavailable.'
      );
    }

    if (
      sheet.getLastColumn() !==
        expected.length
    ) {
      fail_(
        label +
        ' journal header width mismatch.'
      );
    }

    var range =
      sheet.getRange(
        1,
        1,
        1,
        expected.length
      );

    if (
      !range ||
      typeof range.getValues !== 'function' ||
      typeof range.getFormulas !== 'function'
    ) {
      fail_(
        label +
        ' journal header inspection is unavailable.'
      );
    }

    var values =
      range.getValues();

    var formulas =
      range.getFormulas();

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      !Array.isArray(values[0]) ||
      values[0].length !== expected.length ||
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      !Array.isArray(formulas[0]) ||
      formulas[0].length !== expected.length
    ) {
      fail_(
        label +
        ' journal header inspection is malformed.'
      );
    }

    expected.forEach(function (
      value,
      index
    ) {
      if (
        values[0][index] !== value
      ) {
        fail_(
          label +
          ' journal header mismatch.'
        );
      }

      if (
        formulas[0][index] !== ''
      ) {
        fail_(
          label +
          ' journal header contains a formula.'
        );
      }
    });
  }

  function verifyAccess_(workbook) {
    if (
      typeof workbook.getOwner !== 'function' ||
      typeof workbook.getEditors !== 'function' ||
      typeof workbook.getViewers !== 'function'
    ) {
      fail_(
        'Workbook access inspection is unavailable.'
      );
    }

    if (
      typeof Session === 'undefined' ||
      !Session ||
      typeof Session.getEffectiveUser !==
        'function'
    ) {
      fail_(
        'Effective-user identity support is required.'
      );
    }

    var ownerEmail =
      userEmail_(
        workbook.getOwner()
      );

    var effectiveEmail =
      userEmail_(
        Session.getEffectiveUser()
      );

    if (
      ownerEmail !== effectiveEmail
    ) {
      fail_(
        'Effective recovery operator is not the certified orphan workbook owner.'
      );
    }

    var editors =
      workbook.getEditors();

    var viewers =
      workbook.getViewers();

    if (
      !Array.isArray(editors) ||
      editors.length !== 0
    ) {
      fail_(
        'Certified orphan workbook has additional editors.'
      );
    }

    if (
      !Array.isArray(viewers) ||
      viewers.length !== 0
    ) {
      fail_(
        'Certified orphan workbook has additional viewers.'
      );
    }
  }

  function verifyWorkbook_(workbookId) {
    spreadsheetSupport_();

    if (
      workbookId ===
        activeWorkbookId_()
    ) {
      fail_(
        'Certified orphan workbook collides with the active county-data workbook.'
      );
    }

    var workbook =
      SpreadsheetApp.openById(
        workbookId
      );

    if (
      !workbook ||
      typeof workbook.getId !== 'function' ||
      typeof workbook.getName !== 'function' ||
      typeof workbook.getSheets !== 'function' ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      fail_(
        'Certified orphan workbook cannot be verified.'
      );
    }

    if (
      text_(workbook.getId()) !==
        workbookId
    ) {
      fail_(
        'Certified orphan workbook identity changed.'
      );
    }

    if (
      workbook.getName() !==
        WORKBOOK_NAME_
    ) {
      fail_(
        'Certified orphan workbook name changed.'
      );
    }

    var sheets =
      workbook.getSheets();

    if (
      !Array.isArray(sheets) ||
      sheets.length !== 2
    ) {
      fail_(
        'Certified orphan workbook must contain exactly two journal sheets.'
      );
    }

    var names =
      sheets.map(function (sheet) {
        if (
          !sheet ||
          typeof sheet.getName !== 'function'
        ) {
          fail_(
            'Certified orphan workbook contains an invalid sheet.'
          );
        }

        return sheet.getName();
      }).sort();

    var expectedNames =
      [
        EVENT_SHEET_,
        CHUNK_SHEET_
      ].sort();

    if (
      names[0] !== expectedNames[0] ||
      names[1] !== expectedNames[1]
    ) {
      fail_(
        'Certified orphan workbook journal sheet set changed.'
      );
    }

    var eventSheet =
      workbook.getSheetByName(
        EVENT_SHEET_
      );

    var chunkSheet =
      workbook.getSheetByName(
        CHUNK_SHEET_
      );

    if (
      !eventSheet ||
      !chunkSheet
    ) {
      fail_(
        'Certified orphan journal sheets are missing.'
      );
    }

    exactHeaders_(
      eventSheet,
      EVENT_HEADERS_,
      'Event'
    );

    exactHeaders_(
      chunkSheet,
      CHUNK_HEADERS_,
      'Chunk'
    );

    if (
      typeof eventSheet.getLastRow !== 'function' ||
      typeof chunkSheet.getLastRow !== 'function'
    ) {
      fail_(
        'Certified orphan journal row-count inspection is unavailable.'
      );
    }

    var eventRows =
      Math.max(
        Number(
          eventSheet.getLastRow()
        ) - 1,
        0
      );

    var chunkRows =
      Math.max(
        Number(
          chunkSheet.getLastRow()
        ) - 1,
        0
      );

    if (
      eventRows !== 0 ||
      chunkRows !== 0
    ) {
      fail_(
        'Certified orphan journal is no longer empty.'
      );
    }

    verifyAccess_(
      workbook
    );

    return {
      orphanWorkbookIdSha256:
        sha256_(
          workbookId
        ),

      schemaCertified:
        true,

      accessBindingCertified:
        true,

      eventDataRowCount:
        eventRows,

      chunkDataRowCount:
        chunkRows,

      initialEmptyStoreCertified:
        true
    };
  }

  function properties_() {
    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService.getScriptProperties !==
        'function'
    ) {
      fail_(
        'Script Properties support is required.'
      );
    }

    var properties =
      PropertiesService.getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !== 'function' ||
      typeof properties.setProperty !== 'function'
    ) {
      fail_(
        'Script Properties exact read/write support is required.'
      );
    }

    return properties;
  }

  function recover(options) {
    exactOptions_(
      options
    );

    if (
      options.confirmRecovery !== true
    ) {
      fail_(
        'Explicit orphan-binding recovery confirmation is required.'
      );
    }

    requireAdmin_();
    requireUtilities_();

    if (
      options.expectedOrphanWorkbookIdSha256 !==
        CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_
    ) {
      fail_(
        'Expected orphan workbook SHA-256 does not match certified incident authority.'
      );
    }

    var workbookId =
      requireWorkbookId_(
        options.orphanWorkbookId
      );

    if (
      sha256_(
        workbookId
      ) !==
        CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_
    ) {
      fail_(
        'Supplied orphan workbook ID does not match the certified incident hash.'
      );
    }

    var preStatus =
      prerequisiteStatus_();

    assertPreRecoveryStatus_(
      preStatus,
      options
    );

    var preverified =
      verifyWorkbook_(
        workbookId
      );

    if (
      preverified.orphanWorkbookIdSha256 !==
        CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_ ||
      preverified.schemaCertified !== true ||
      preverified.accessBindingCertified !== true ||
      preverified.initialEmptyStoreCertified !== true
    ) {
      fail_(
        'Certified orphan workbook pre-write verification failed.'
      );
    }

    var properties =
      properties_();

    var existing =
      text_(
        properties.getProperty(
          PROPERTY_KEY_
        )
      );

    if (existing) {
      fail_(
        'Operation-intent binding appeared before recovery write; existing binding cannot be replaced.'
      );
    }

    /*
     * Sole persistent mutation in this recovery module.
     */
    properties.setProperty(
      PROPERTY_KEY_,
      workbookId
    );

    var rebound =
      text_(
        properties.getProperty(
          PROPERTY_KEY_
        )
      );

    if (
      rebound !== workbookId
    ) {
      fail_(
        'Recovered operation-intent property readback is ambiguous; do not retry automatically.'
      );
    }

    var postverified =
      verifyWorkbook_(
        rebound
      );

    if (
      postverified.orphanWorkbookIdSha256 !==
        CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_ ||
      postverified.schemaCertified !== true ||
      postverified.accessBindingCertified !== true ||
      postverified.eventDataRowCount !== 0 ||
      postverified.chunkDataRowCount !== 0 ||
      postverified.initialEmptyStoreCertified !== true
    ) {
      fail_(
        'Recovered operation-intent binding failed post-write verification; do not retry automatically.'
      );
    }

    return authorityFree_(
      Object.assign(
        {
          ok: true,
          mode:
            'EXACT_ORPHAN_OPERATION_INTENT_BINDING_RECOVERED',
          contractVersion:
            CONTRACT_VERSION_,
          propertyWriteExecuted:
            true,
          workbookCreated:
            false,
          provisioningExecuted:
            false,
          orphanRecoveryExecuted:
            true
        },
        postverified
      )
    );
  }

  return {
    recover:
      recover
  };
})();

function reosCountyCollapseOperationIntentOrphanBindingRecover(
  options
) {
  return REOS
    .CountyCollapseOperationIntentOrphanBindingRecovery
    .recover(options);
}
