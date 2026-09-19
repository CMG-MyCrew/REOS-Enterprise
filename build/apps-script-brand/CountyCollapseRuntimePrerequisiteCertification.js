/**
 * REOS Enterprise
 * County Collapse Runtime Prerequisite Certification v1
 *
 * Bounded operator surface for:
 *   1. authority-free prerequisite status; and
 *   2. one-time provisioning of the dedicated collapse operation-intent
 *      evidence workbook.
 *
 * This module grants no collapse execution, county-data mutation,
 * physical-delete, scheduler, checkpoint, connector, repair, migration,
 * MAO, or automatic-offer authority.
 */
var REOS = REOS || {};

REOS.CountyCollapseRuntimePrerequisiteCertification =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;

  var CURRENT_WINNER_FINGERPRINT_ =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var CURRENT_AUTHORITY_SHA_ =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

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
      'County collapse runtime prerequisite certification: ' +
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

  function exactOptions_(options, required, label) {
    if (
      !options ||
      typeof options !== 'object' ||
      Array.isArray(options)
    ) {
      fail_(label + ' must be an object.');
    }

    Object.keys(options).forEach(function (key) {
      if (required.indexOf(key) === -1) {
        fail_(label + ' contains unsupported field: ' + key);
      }
    });

    required.forEach(function (key) {
      if (
        !Object.prototype.hasOwnProperty.call(options, key)
      ) {
        fail_(label + ' is missing required field: ' + key);
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

  function properties_(writeRequired) {
    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService.getScriptProperties !== 'function'
    ) {
      fail_('Script Properties support is required.');
    }

    var properties =
      PropertiesService.getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !== 'function'
    ) {
      fail_('Script Properties read access is required.');
    }

    if (
      writeRequired &&
      typeof properties.setProperty !== 'function'
    ) {
      fail_('Script Properties write access is required.');
    }

    return properties;
  }

  function lease_() {
    var lease =
      REOS.CountyMutationExclusionLease;

    if (
      !lease ||
      typeof lease.status !== 'function'
    ) {
      fail_(
        'Certified county mutation-exclusion lease status support is required.'
      );
    }

    return lease;
  }

  function leaseStatus_() {
    var status =
      lease_().status();

    if (
      !status ||
      typeof status !== 'object'
    ) {
      fail_('Lease status result is malformed.');
    }

    return status;
  }

  function leaseTransitionSafe_(status) {
    if (
      !status ||
      status.ok !== true
    ) {
      return false;
    }

    if (status.state === 'ABSENT') {
      return true;
    }

    if (
      status.state !== 'CLOSED' &&
      status.state !== 'EXPIRED'
    ) {
      return false;
    }

    return (
      status.authorityGeneration === 'CURRENT' ||
      status.authorityGeneration === 'HISTORICAL'
    );
  }

  function spreadsheetSupport_(createRequired) {
    if (
      typeof SpreadsheetApp === 'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp.getActiveSpreadsheet !== 'function' ||
      typeof SpreadsheetApp.openById !== 'function'
    ) {
      fail_('Spreadsheet storage support is required.');
    }

    if (
      createRequired &&
      typeof SpreadsheetApp.create !== 'function'
    ) {
      fail_('Spreadsheet creation support is required.');
    }
  }

  function activeWorkbookId_() {
    spreadsheetSupport_(false);

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

    var activeId =
      text_(active.getId());

    if (!activeId) {
      fail_('Active county-data workbook ID is empty.');
    }

    return activeId;
  }

  function requireWorkbookId_(value) {
    var workbookId =
      text_(value);

    if (
      !workbookId ||
      !/^[A-Za-z0-9_-]+$/.test(workbookId)
    ) {
      fail_(
        'Configured operation-intent workbook ID is malformed.'
      );
    }

    return workbookId;
  }

  function exactHeaders_(sheet, expected, label) {
    if (
      !sheet ||
      typeof sheet.getLastColumn !== 'function' ||
      typeof sheet.getRange !== 'function'
    ) {
      fail_(label + ' sheet API is unavailable.');
    }

    if (
      sheet.getLastColumn() !== expected.length
    ) {
      fail_(label + ' header width mismatch.');
    }

    var range =
      sheet.getRange(
        1,
        1,
        1,
        expected.length
      );

    var values =
      range.getValues();

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      !Array.isArray(values[0]) ||
      values[0].length !== expected.length
    ) {
      fail_(label + ' header row is malformed.');
    }

    for (
      var index = 0;
      index < expected.length;
      index++
    ) {
      if (
        values[0][index] !== expected[index]
      ) {
        fail_(label + ' header mismatch.');
      }
    }

    if (
      typeof range.getFormulas !== 'function'
    ) {
      fail_(label + ' formula inspection is unavailable.');
    }

    var formulas =
      range.getFormulas();

    if (
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      !Array.isArray(formulas[0]) ||
      formulas[0].length !== expected.length
    ) {
      fail_(label + ' formula inspection is malformed.');
    }

    if (
      formulas[0].some(function (formula) {
        return formula !== '';
      })
    ) {
      fail_(label + ' headers contain formulas.');
    }
  }

  function userEmail_(user) {
    if (
      !user ||
      typeof user.getEmail !== 'function'
    ) {
      fail_('Workbook user identity support is unavailable.');
    }

    var email =
      text_(user.getEmail()).toLowerCase();

    if (!email) {
      fail_('Workbook user identity is empty.');
    }

    return email;
  }

  function verifyAccess_(workbook, requireEffectiveOwner) {
    if (
      typeof workbook.getOwner !== 'function' ||
      typeof workbook.getEditors !== 'function' ||
      typeof workbook.getViewers !== 'function'
    ) {
      fail_('Workbook access inspection is unavailable.');
    }

    var ownerEmail =
      userEmail_(workbook.getOwner());

    var editors =
      workbook.getEditors();

    var viewers =
      workbook.getViewers();

    if (
      !Array.isArray(editors)
    ) {
      fail_(
        'Operation-intent workbook editor inspection is malformed.'
      );
    }

    if (
      !Array.isArray(viewers)
    ) {
      fail_(
        'Operation-intent workbook viewer inspection is malformed.'
      );
    }

    /*
     * Apps Script access lists can include the workbook owner even when
     * there are no additional Drive permissions. The certified access
     * invariant is zero users other than the already-verified owner.
     */
    var additionalEditors =
      editors.filter(function (user) {
        return (
          userEmail_(user) !==
          ownerEmail
        );
      });

    var additionalViewers =
      viewers.filter(function (user) {
        return (
          userEmail_(user) !==
          ownerEmail
        );
      });

    if (
      additionalEditors.length !== 0
    ) {
      fail_(
        'Operation-intent workbook has additional editors.'
      );
    }

    if (
      additionalViewers.length !== 0
    ) {
      fail_(
        'Operation-intent workbook has additional viewers.'
      );
    }

    if (requireEffectiveOwner) {
      if (
        typeof Session === 'undefined' ||
        !Session ||
        typeof Session.getEffectiveUser !== 'function'
      ) {
        fail_(
          'Effective-user identity support is required.'
        );
      }

      var effectiveEmail =
        userEmail_(
          Session.getEffectiveUser()
        );

      if (
        effectiveEmail !== ownerEmail
      ) {
        fail_(
          'Creating production operator is not the workbook owner.'
        );
      }
    }

    return true;
  }

  function verifyWorkbookId_(workbookIdValue, requireEffectiveOwner) {
    spreadsheetSupport_(false);

    var workbookId =
      requireWorkbookId_(
        workbookIdValue
      );

    if (
      workbookId === activeWorkbookId_()
    ) {
      fail_(
        'Operation-intent workbook must differ from the active county-data workbook.'
      );
    }

    var workbook =
      SpreadsheetApp.openById(
        workbookId
      );

    if (
      !workbook ||
      typeof workbook.getId !== 'function' ||
      text_(workbook.getId()) !== workbookId ||
      typeof workbook.getSheets !== 'function' ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      fail_(
        'Configured operation-intent workbook identity could not be verified.'
      );
    }

    var sheets =
      workbook.getSheets();

    if (
      !Array.isArray(sheets) ||
      sheets.length !== 2
    ) {
      fail_(
        'Operation-intent workbook must contain exactly two journal sheets.'
      );
    }

    var names =
      sheets.map(function (sheet) {
        if (
          !sheet ||
          typeof sheet.getName !== 'function'
        ) {
          fail_(
            'Operation-intent workbook contains an invalid sheet.'
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
        'Operation-intent workbook journal sheet set is invalid.'
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
        'Operation-intent workbook journal sheets are missing.'
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
        'Journal row-count inspection is unavailable.'
      );
    }

    var eventRows =
      Math.max(
        Number(eventSheet.getLastRow()) - 1,
        0
      );

    var chunkRows =
      Math.max(
        Number(chunkSheet.getLastRow()) - 1,
        0
      );

    verifyAccess_(
      workbook,
      requireEffectiveOwner === true
    );

    return {
      workbookIdSha256:
        sha256_(workbookId),

      schemaCertified:
        true,

      accessBindingCertified:
        true,

      eventDataRowCount:
        eventRows,

      chunkDataRowCount:
        chunkRows,

      initialEmptyStoreCertified:
        (
          eventRows === 0 &&
          chunkRows === 0
        )
    };
  }

  function bindingStatus_() {
    var properties =
      properties_(false);

    var workbookId =
      text_(
        properties.getProperty(
          PROPERTY_KEY_
        )
      );

    if (!workbookId) {
      return {
        configured: false,
        valid: false,
        workbookIdSha256: '',
        schemaCertified: false,
        accessBindingCertified: false,
        eventDataRowCount: 0,
        chunkDataRowCount: 0,
        initialEmptyStoreCertified: false,
        error: ''
      };
    }

    try {
      var verified =
        verifyWorkbookId_(
          workbookId,
          false
        );

      return Object.assign(
        {
          configured: true,
          valid: true,
          error: ''
        },
        verified
      );
    } catch (error) {
      return {
        configured: true,
        valid: false,
        workbookIdSha256:
          sha256_(workbookId),
        schemaCertified: false,
        accessBindingCertified: false,
        eventDataRowCount: 0,
        chunkDataRowCount: 0,
        initialEmptyStoreCertified: false,
        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
      };
    }
  }

  function requireCurrentAuthority_(options) {
    if (
      options.expectedWinnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT_
    ) {
      fail_(
        'Winner-plan fingerprint does not match current certified authority.'
      );
    }

    if (
      options.expectedAuthoritySha256 !==
        CURRENT_AUTHORITY_SHA_
    ) {
      fail_(
        'Collapse authority SHA does not match current certified authority.'
      );
    }
  }

  function status() {
    requireAdmin_();
    requireUtilities_();

    var leaseStatus =
      leaseStatus_();

    var binding =
      bindingStatus_();

    var leaseSafe =
      leaseTransitionSafe_(
        leaseStatus
      );

    var bindingReady =
      (
        binding.configured === true &&
        binding.valid === true &&
        binding.schemaCertified === true &&
        binding.accessBindingCertified === true &&
        binding.initialEmptyStoreCertified === true
      );

    return authorityFree_({
      ok:
        (
          leaseStatus.ok === true &&
          (
            binding.configured === false ||
            binding.valid === true
          )
        ),

      mode:
        'READ_ONLY_RUNTIME_PREREQUISITE_STATUS',

      contractVersion:
        CONTRACT_VERSION_,

      currentWinnerPlanFingerprintSha256:
        CURRENT_WINNER_FINGERPRINT_,

      currentCollapseAuthoritySha256:
        CURRENT_AUTHORITY_SHA_,

      leaseState:
        text_(
          leaseStatus.state
        ),

      leaseAuthorityGeneration:
        text_(
          leaseStatus.authorityGeneration
        ),

      leaseTransitionSafe:
        leaseSafe,

      operationIntentConfigured:
        binding.configured,

      operationIntentWorkbookIdSha256:
        binding.workbookIdSha256,

      operationIntentSchemaCertified:
        binding.schemaCertified,

      operationIntentAccessBindingCertified:
        binding.accessBindingCertified,

      operationIntentEventDataRowCount:
        binding.eventDataRowCount,

      operationIntentChunkDataRowCount:
        binding.chunkDataRowCount,

      operationIntentInitialEmptyStoreCertified:
        binding.initialEmptyStoreCertified,

      operationIntentBindingError:
        binding.error,

      prerequisitesReadyForExecutorImplementation:
        (
          leaseSafe &&
          bindingReady
        )
    });
  }

  function provision(options) {
    exactOptions_(
      options,
      [
        'confirmProvision',
        'expectedWinnerPlanFingerprintSha256',
        'expectedAuthoritySha256'
      ],
      'provision options'
    );

    if (
      options.confirmProvision !== true
    ) {
      fail_(
        'Explicit provisioning confirmation is required.'
      );
    }

    requireAdmin_();
    requireUtilities_();
    requireCurrentAuthority_(options);

    var leaseStatus =
      leaseStatus_();

    if (
      !leaseTransitionSafe_(leaseStatus)
    ) {
      fail_(
        'Current production lease state is not safe for prerequisite provisioning.'
      );
    }

    var properties =
      properties_(true);

    var existingId =
      text_(
        properties.getProperty(
          PROPERTY_KEY_
        )
      );

    if (existingId) {
      var existing =
        verifyWorkbookId_(
          existingId,
          false
        );

      return authorityFree_(
        Object.assign(
          {
            ok: true,
            mode:
              'EXISTING_BINDING_READ_ONLY_IDEMPOTENT',
            contractVersion:
              CONTRACT_VERSION_,
            workbookCreated: false,
            propertyWriteExecuted: false,
            provisioningExecuted: false,
            existingBinding: true
          },
          existing
        )
      );
    }

    spreadsheetSupport_(true);

    var created =
      SpreadsheetApp.create(
        WORKBOOK_NAME_
      );

    if (
      !created ||
      typeof created.getId !== 'function' ||
      typeof created.getSheets !== 'function' ||
      typeof created.insertSheet !== 'function'
    ) {
      fail_(
        'Created operation-intent workbook is malformed.'
      );
    }

    var createdId =
      requireWorkbookId_(
        created.getId()
      );

    if (
      createdId === activeWorkbookId_()
    ) {
      fail_(
        'Created operation-intent workbook collides with active county-data workbook.'
      );
    }

    var createdSheets =
      created.getSheets();

    if (
      !Array.isArray(createdSheets) ||
      createdSheets.length !== 1 ||
      !createdSheets[0] ||
      typeof createdSheets[0].setName !== 'function'
    ) {
      fail_(
        'New workbook does not expose one renameable default sheet.'
      );
    }

    var eventSheet =
      createdSheets[0];

    eventSheet.setName(
      EVENT_SHEET_
    );

    var chunkSheet =
      created.insertSheet(
        CHUNK_SHEET_
      );

    if (
      !chunkSheet ||
      typeof eventSheet.getRange !== 'function' ||
      typeof chunkSheet.getRange !== 'function'
    ) {
      fail_(
        'Journal sheet creation failed.'
      );
    }

    eventSheet
      .getRange(
        1,
        1,
        1,
        EVENT_HEADERS_.length
      )
      .setValues([
        EVENT_HEADERS_.slice()
      ]);

    chunkSheet
      .getRange(
        1,
        1,
        1,
        CHUNK_HEADERS_.length
      )
      .setValues([
        CHUNK_HEADERS_.slice()
      ]);

    if (
      typeof SpreadsheetApp.flush !== 'function'
    ) {
      fail_(
        'Spreadsheet flush support is required.'
      );
    }

    SpreadsheetApp.flush();

    var beforeBinding =
      verifyWorkbookId_(
        createdId,
        true
      );

    if (
      beforeBinding.initialEmptyStoreCertified !== true
    ) {
      fail_(
        'New operation-intent workbook is not empty after header provisioning.'
      );
    }

    properties.setProperty(
      PROPERTY_KEY_,
      createdId
    );

    var rebound =
      text_(
        properties.getProperty(
          PROPERTY_KEY_
        )
      );

    if (
      rebound !== createdId
    ) {
      fail_(
        'Operation-intent workbook property readback is ambiguous.'
      );
    }

    var afterBinding =
      verifyWorkbookId_(
        rebound,
        true
      );

    if (
      afterBinding.initialEmptyStoreCertified !== true
    ) {
      fail_(
        'Bound operation-intent workbook is no longer empty.'
      );
    }

    return authorityFree_(
      Object.assign(
        {
          ok: true,
          mode:
            'ONE_TIME_OPERATION_INTENT_PROVISIONED',
          contractVersion:
            CONTRACT_VERSION_,
          workbookCreated: true,
          propertyWriteExecuted: true,
          provisioningExecuted: true,
          existingBinding: false
        },
        afterBinding
      )
    );
  }

  return {
    status:
      status,

    provision:
      provision
  };
})();

function reosCountyCollapseRuntimePrerequisiteStatus() {
  return REOS
    .CountyCollapseRuntimePrerequisiteCertification
    .status();
}

function reosCountyCollapseOperationIntentProvision(options) {
  return REOS
    .CountyCollapseRuntimePrerequisiteCertification
    .provision(options);
}
