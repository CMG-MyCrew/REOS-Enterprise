/**
 * REOS Enterprise
 * Absentee-Owner Classification Evidence Store Certified Orphan Adoption v1
 *
 * Incident-specific recovery surface for adopting the single preserved,
 * certified evidence-store workbook created by the outcome-uncertain
 * provisioning attempt.
 *
 * Sole persistent mutation authority:
 *
 *   publish REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID
 *
 * This module cannot create, edit, rename, share, delete, clear, or otherwise
 * mutate a spreadsheet. It grants no persistence, bounded-rollout, ARV,
 * repair-scope, MAO, or offer authority.
 */
var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption =
(function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;

  var CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_ =
    '4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce';

  var PROPERTY_KEY_ =
    'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

  var WORKBOOK_NAME_ =
    'REOS Absentee Owner Classification Evidence';

  var SHEET_NAME_ =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE';

  var CERTIFIED_SHEET_ID_ = 0;

  var MODE_ =
    'ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION';

  var PRECONDITION_FAILED_ =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_PRECONDITION_FAILED';

  var OUTCOME_UNCERTAIN_ =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_OUTCOME_UNCERTAIN';

  var VERIFIED_ =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_VERIFIED';

  var HEADERS_ = Object.freeze([
    'Evidence Event ID',
    'Observed At UTC',
    'Persistence Contract Version',
    'Classification Contract Version',
    'Distress Lead ID',
    'Canonical Property Key',
    'Physical Row Number',
    'Classification Outcome',
    'Classification Basis',
    'Upstream Comparison Outcome',
    'Differing Components JSON',
    'Normalized Property Address JSON',
    'Normalized Mailing Address JSON',
    'Source Agency',
    'Source Dataset',
    'Source Table',
    'Source Endpoint',
    'Classifier Result SHA-256',
    'Previous Evidence SHA-256',
    'Evidence Event SHA-256'
  ]);

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function safeText_(value) {
    return (
      typeof value === 'string' &&
      value !== '' &&
      !/[\u0000-\u001F\u007F]/.test(value) &&
      !/^[=+\-@]/.test(value)
    );
  }

  function isPlainObject_(value) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return false;
    }

    var prototype =
      Object.getPrototypeOf(value);

    return (
      prototype === Object.prototype ||
      prototype === null
    );
  }

  function exactKeys_(object, expected) {
    if (!isPlainObject_(object)) {
      return false;
    }

    var actual =
      Object.keys(object)
        .slice()
        .sort();

    var allowed =
      expected
        .slice()
        .sort();

    return (
      actual.length === allowed.length &&
      actual.every(function (key, index) {
        return key === allowed[index];
      })
    );
  }

  function requireAdmin_() {
    if (
      !REOS ||
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'Orphan-adoption admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
  }

  function requireUtilities_() {
    if (
      typeof Utilities === 'undefined' ||
      !Utilities ||
      !Utilities.DigestAlgorithm ||
      !Utilities.Charset ||
      typeof Utilities.computeDigest !== 'function'
    ) {
      throw new Error(
        'Orphan-adoption SHA-256 support is unavailable.'
      );
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

    if (!Array.isArray(digest)) {
      throw new Error(
        'Orphan-adoption SHA-256 result is malformed.'
      );
    }

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

  function requireWorkbookId_(value) {
    var workbookId =
      text_(value);

    if (
      !safeText_(workbookId) ||
      !/^[A-Za-z0-9_-]+$/.test(
        workbookId
      )
    ) {
      throw new Error(
        'Supplied orphan workbook ID is malformed.'
      );
    }

    return workbookId;
  }

  function activeSpreadsheet_() {
    if (
      typeof SpreadsheetApp === 'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp.getActiveSpreadsheet !== 'function'
    ) {
      throw new Error(
        'Active REOS spreadsheet access is unavailable.'
      );
    }

    var active =
      SpreadsheetApp.getActiveSpreadsheet();

    if (
      !active ||
      typeof active.getId !== 'function'
    ) {
      throw new Error(
        'Active REOS spreadsheet identity is unavailable.'
      );
    }

    var activeId =
      text_(
        active.getId()
      );

    if (!safeText_(activeId)) {
      throw new Error(
        'Active REOS spreadsheet identity is unsafe.'
      );
    }

    return {
      workbook: active,
      id: activeId
    };
  }

  function properties_() {
    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService.getScriptProperties !== 'function'
    ) {
      throw new Error(
        'Script Properties support is unavailable.'
      );
    }

    var properties =
      PropertiesService.getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !== 'function' ||
      typeof properties.setProperty !== 'function'
    ) {
      throw new Error(
        'Script Properties exact read/write support is unavailable.'
      );
    }

    return properties;
  }

  function userEmail_(user) {
    if (
      !user ||
      typeof user.getEmail !== 'function'
    ) {
      throw new Error(
        'Workbook user identity support is unavailable.'
      );
    }

    var email =
      text_(
        user.getEmail()
      ).toLowerCase();

    if (!email) {
      throw new Error(
        'Workbook user identity is empty.'
      );
    }

    return email;
  }

  function validSheetId_(value) {
    return (
      typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 0
    );
  }

  function verifyAccess_(workbook) {
    if (
      typeof workbook.getOwner !== 'function' ||
      typeof workbook.getEditors !== 'function' ||
      typeof workbook.getViewers !== 'function'
    ) {
      throw new Error(
        'Certified orphan workbook access inspection is unavailable.'
      );
    }

    if (
      typeof Session === 'undefined' ||
      !Session ||
      typeof Session.getEffectiveUser !== 'function'
    ) {
      throw new Error(
        'Effective recovery-user identity is unavailable.'
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
      ownerEmail !==
      effectiveEmail
    ) {
      throw new Error(
        'Effective recovery operator is not the certified orphan workbook owner.'
      );
    }

    var editors =
      workbook.getEditors();

    var viewers =
      workbook.getViewers();

    if (!Array.isArray(editors)) {
      throw new Error(
        'Certified orphan workbook editor inspection is malformed.'
      );
    }

    if (!Array.isArray(viewers)) {
      throw new Error(
        'Certified orphan workbook viewer inspection is malformed.'
      );
    }

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

    if (additionalEditors.length !== 0) {
      throw new Error(
        'Certified orphan workbook has additional editors.'
      );
    }

    if (additionalViewers.length !== 0) {
      throw new Error(
        'Certified orphan workbook has additional viewers.'
      );
    }

    return true;
  }

  function verifyWorkbook_(
    workbook,
    suppliedWorkbookId,
    activeId
  ) {
    if (
      !workbook ||
      typeof workbook.getId !== 'function' ||
      typeof workbook.getName !== 'function' ||
      typeof workbook.getSheets !== 'function' ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      throw new Error(
        'Certified orphan workbook APIs are unavailable.'
      );
    }

    var workbookId =
      text_(
        workbook.getId()
      );

    if (
      workbookId !== suppliedWorkbookId ||
      workbookId === activeId
    ) {
      throw new Error(
        'Certified orphan workbook identity is invalid or unsafe.'
      );
    }

    if (
      workbook.getName() !==
      WORKBOOK_NAME_
    ) {
      throw new Error(
        'Certified orphan workbook name is invalid.'
      );
    }

    var sheets =
      workbook.getSheets();

    if (
      !Array.isArray(sheets) ||
      sheets.length !== 1
    ) {
      throw new Error(
        'Certified orphan workbook must contain exactly one sheet.'
      );
    }

    var positionalSheet =
      sheets[0];

    var namedSheet =
      workbook.getSheetByName(
        SHEET_NAME_
      );

    if (
      !positionalSheet ||
      !namedSheet ||
      typeof positionalSheet.getSheetId !== 'function' ||
      typeof namedSheet.getSheetId !== 'function' ||
      typeof namedSheet.getName !== 'function' ||
      namedSheet.getName() !== SHEET_NAME_ ||
      typeof namedSheet.getLastRow !== 'function' ||
      typeof namedSheet.getLastColumn !== 'function' ||
      typeof namedSheet.getRange !== 'function'
    ) {
      throw new Error(
        'Certified orphan evidence-sheet identity is invalid.'
      );
    }

    var positionalSheetId =
      positionalSheet.getSheetId();

    var namedSheetId =
      namedSheet.getSheetId();

    if (
      !validSheetId_(positionalSheetId) ||
      !validSheetId_(namedSheetId) ||
      positionalSheetId !== namedSheetId ||
      namedSheetId !== CERTIFIED_SHEET_ID_
    ) {
      throw new Error(
        'Certified orphan stable sheet identity is invalid.'
      );
    }

    var lastRow =
      namedSheet.getLastRow();

    var lastColumn =
      namedSheet.getLastColumn();

    if (
      lastRow !== 1 ||
      lastColumn !== HEADERS_.length
    ) {
      throw new Error(
        'Certified orphan evidence-sheet geometry is invalid.'
      );
    }

    var range =
      namedSheet.getRange(
        1,
        1,
        1,
        HEADERS_.length
      );

    if (
      !range ||
      typeof range.getValues !== 'function' ||
      typeof range.getFormulas !== 'function'
    ) {
      throw new Error(
        'Certified orphan evidence schema inspection is unavailable.'
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
      values[0].length !== HEADERS_.length ||
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      !Array.isArray(formulas[0]) ||
      formulas[0].length !== HEADERS_.length
    ) {
      throw new Error(
        'Certified orphan evidence schema inspection is malformed.'
      );
    }

    HEADERS_.forEach(function (header, index) {
      if (values[0][index] !== header) {
        throw new Error(
          'Certified orphan evidence header mismatch at column ' +
          (index + 1) +
          '.'
        );
      }

      if (formulas[0][index] !== '') {
        throw new Error(
          'Certified orphan evidence headers must not contain formulas.'
        );
      }
    });

    verifyAccess_(
      workbook
    );

    return {
      workbookSeparationVerified: true,
      schemaExact: true,
      accessBindingVerified: true,
      evidenceRowCount: 0,
      stableSheetIdVerified: true
    };
  }

  function failureResponse_(
    classification,
    message,
    propertyWriteExecuted
  ) {
    return {
      ok: false,
      mode: MODE_,
      classification: classification,
      contractVersion: CONTRACT_VERSION_,
      message: text_(message),
      certifiedOrphanWorkbookIdSha256:
        CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_,
      propertyKey: PROPERTY_KEY_,
      sheetName: SHEET_NAME_,
      certifiedSheetId: CERTIFIED_SHEET_ID_,
      schemaFieldCount: HEADERS_.length,
      propertyWriteExecuted:
        propertyWriteExecuted === true,
      workbookCreated: false,
      workbookMutated: false,
      provisioningRetryExecuted: false,
      persistenceAuthorized: false,
      boundedRolloutAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function successResponse_() {
    return {
      ok: true,
      mode: MODE_,
      classification: VERIFIED_,
      contractVersion: CONTRACT_VERSION_,
      certifiedOrphanWorkbookIdSha256:
        CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_,
      propertyKey: PROPERTY_KEY_,
      sheetName: SHEET_NAME_,
      certifiedSheetId: CERTIFIED_SHEET_ID_,
      schemaFieldCount: HEADERS_.length,
      schemaExact: true,
      propertyReadbackVerified: true,
      workbookSeparationVerified: true,
      accessBindingVerified: true,
      stableSheetIdVerified: true,
      evidenceRowCount: 0,
      propertyWriteExecuted: true,
      workbookCreated: false,
      workbookMutated: false,
      provisioningRetryExecuted: false,
      persistenceAuthorized: false,
      boundedRolloutAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function adoptCertifiedOrphan(options) {
    var lock = null;
    var lockAcquired = false;
    var publicationBoundaryEntered = false;
    var response = null;

    try {
      requireAdmin_();

      if (
        !exactKeys_(
          options,
          [
            'confirmAdoption',
            'orphanWorkbookId',
            'expectedOrphanWorkbookIdSha256',
            'expectedActiveReosSpreadsheetId',
            'expectedPropertyState'
          ]
        )
      ) {
        throw new Error(
          'Orphan-adoption options must contain exactly the required fields.'
        );
      }

      if (
        options.confirmAdoption !==
          'ADOPT_CERTIFIED_ORPHAN'
      ) {
        throw new Error(
          'Explicit certified-orphan adoption confirmation is required.'
        );
      }

      if (
        options.expectedOrphanWorkbookIdSha256 !==
          CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_
      ) {
        throw new Error(
          'Expected orphan workbook SHA-256 does not match certified incident authority.'
        );
      }

      if (
        !safeText_(
          options.expectedActiveReosSpreadsheetId
        ) ||
        options.expectedPropertyState !== 'ABSENT'
      ) {
        throw new Error(
          'Expected orphan-adoption production state is invalid.'
        );
      }

      var workbookId =
        requireWorkbookId_(
          options.orphanWorkbookId
        );

      if (
        sha256_(workbookId) !==
        CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256_
      ) {
        throw new Error(
          'Supplied orphan workbook ID does not match certified incident authority.'
        );
      }

      if (
        typeof LockService === 'undefined' ||
        !LockService ||
        typeof LockService.getScriptLock !== 'function'
      ) {
        throw new Error(
          'ScriptLock support is unavailable.'
        );
      }

      lock =
        LockService.getScriptLock();

      if (
        !lock ||
        typeof lock.tryLock !== 'function' ||
        typeof lock.releaseLock !== 'function'
      ) {
        throw new Error(
          'ScriptLock APIs are unavailable.'
        );
      }

      lockAcquired =
        lock.tryLock(1000) === true;

      if (!lockAcquired) {
        throw new Error(
          'Orphan-adoption ScriptLock is contended.'
        );
      }

      if (
        typeof lock.hasLock === 'function' &&
        lock.hasLock() !== true
      ) {
        throw new Error(
          'Orphan-adoption ScriptLock ownership could not be verified.'
        );
      }

      requireAdmin_();

      var active =
        activeSpreadsheet_();

      if (
        active.id !==
        options.expectedActiveReosSpreadsheetId
      ) {
        throw new Error(
          'Active REOS spreadsheet identity changed.'
        );
      }

      if (
        workbookId ===
        active.id
      ) {
        throw new Error(
          'Certified orphan workbook collides with the active REOS spreadsheet.'
        );
      }

      var properties =
        properties_();

      var propertyPrestate =
        text_(
          properties.getProperty(
            PROPERTY_KEY_
          )
        );

      if (propertyPrestate !== '') {
        throw new Error(
          'Evidence-store Script Property is already configured.'
        );
      }

      if (
        typeof SpreadsheetApp.openById !== 'function'
      ) {
        throw new Error(
          'Spreadsheet open-by-ID support is unavailable.'
        );
      }

      var workbook =
        SpreadsheetApp.openById(
          workbookId
        );

      verifyWorkbook_(
        workbook,
        workbookId,
        active.id
      );

      publicationBoundaryEntered = true;

      properties.setProperty(
        PROPERTY_KEY_,
        workbookId
      );

      var propertyReadback =
        text_(
          properties.getProperty(
            PROPERTY_KEY_
          )
        );

      if (
        propertyReadback !==
        workbookId
      ) {
        throw new Error(
          'Evidence-store Script Property readback is ambiguous; do not retry automatically.'
        );
      }

      var reopened =
        SpreadsheetApp.openById(
          propertyReadback
        );

      verifyWorkbook_(
        reopened,
        workbookId,
        active.id
      );

      response =
        successResponse_();
    } catch (error) {
      response =
        failureResponse_(
          publicationBoundaryEntered
            ? OUTCOME_UNCERTAIN_
            : PRECONDITION_FAILED_,
          error && error.message
            ? error.message
            : error,
          publicationBoundaryEntered
        );
    } finally {
      if (lockAcquired) {
        try {
          lock.releaseLock();
        } catch (releaseError) {
          response =
            failureResponse_(
              publicationBoundaryEntered
                ? OUTCOME_UNCERTAIN_
                : PRECONDITION_FAILED_,
              'ScriptLock release failed: ' +
                (
                  releaseError &&
                  releaseError.message
                    ? releaseError.message
                    : releaseError
                ),
              publicationBoundaryEntered
            );
        }
      }
    }

    return response;
  }

  return Object.freeze({
    adoptCertifiedOrphan:
      adoptCertifiedOrphan
  });
}());

function reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan(
  options
) {
  return REOS
    .AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption
    .adoptCertifiedOrphan(
      options
    );
}
