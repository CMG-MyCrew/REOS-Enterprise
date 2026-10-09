var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin =
(function () {
  'use strict';

  var PROPERTY_KEY =
    'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

  var V1_SHEET_NAME =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE';

  var V2_SHEET_NAME =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2';

  var MODE_INSPECT =
    'ADMIN_EVIDENCE_STORE_V2_PROVISIONING_INSPECTION';

  var MODE_PROVISION =
    'ADMIN_EVIDENCE_STORE_V2_PROVISIONING';

  var UNCONFIGURED =
    'SHARED_EVIDENCE_WORKBOOK_UNCONFIGURED';

  var UNSAFE_ALIAS =
    'UNSAFE_ACTIVE_REOS_ALIAS';

  var UNOPENABLE =
    'CONFIGURED_WORKBOOK_UNOPENABLE';

  var V1_MISSING =
    'V1_SHEET_MISSING';

  var V1_INVALID =
    'V1_SCHEMA_INVALID';

  var UNEXPECTED_SHEETS =
    'UNEXPECTED_WORKBOOK_SHEET_SET';

  var V2_REQUIRED =
    'V2_PROVISIONING_REQUIRED';

  var V2_INVALID =
    'V2_SCHEMA_INVALID';

  var V2_ALREADY =
    'V2_ALREADY_PROVISIONED';

  var PRECONDITION_FAILED =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRECONDITION_FAILED';

  var OUTCOME_UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_OUTCOME_UNCERTAIN';

  var VERIFIED =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_VERIFIED';

  var V1_HEADERS = Object.freeze([
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

  var V2_HEADERS = Object.freeze([
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
    'Owner Evidence Lookup Mode',
    'Certified OPA Account',
    'Property Source Identity Certification Basis',
    'Property Source Identity Certification SHA-256',
    'Normal Lookup Evidence SHA-256',
    'Owner Evidence Result SHA-256',
    'Comparison Result SHA-256',
    'Classifier Result SHA-256',
    'Previous Evidence SHA-256',
    'Evidence Event SHA-256'
  ]);

  function text_(value) {
    return String(
      value === undefined || value === null
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
      Object.keys(object).slice().sort();

    var allowed =
      expected.slice().sort();

    return (
      actual.length === allowed.length &&
      actual.every(function (key, index) {
        return key === allowed[index];
      })
    );
  }

  function validSheetId_(value) {
    return (
      typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 0
    );
  }

  function requireAdmin_() {
    if (
      !REOS ||
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'V2 provisioning admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
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

    var workbook =
      SpreadsheetApp.getActiveSpreadsheet();

    if (
      !workbook ||
      typeof workbook.getId !== 'function'
    ) {
      throw new Error(
        'Active REOS spreadsheet identity is unavailable.'
      );
    }

    var id =
      text_(workbook.getId());

    if (!safeText_(id)) {
      throw new Error(
        'Active REOS spreadsheet identity is unsafe.'
      );
    }

    return {
      workbook: workbook,
      id: id
    };
  }

  function scriptProperties_() {
    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService.getScriptProperties !== 'function'
    ) {
      throw new Error(
        'Script Properties are unavailable.'
      );
    }

    var properties =
      PropertiesService.getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !== 'function'
    ) {
      throw new Error(
        'Script Properties read access is unavailable.'
      );
    }

    return properties;
  }

  function schemaState_(
    sheet,
    expectedName,
    headers
  ) {
    var result = {
      valid: false,
      sheetId: null,
      lastRow: null,
      lastColumn: null,
      evidenceRowCount: null,
      headerFormulasPresent: null
    };

    try {
      if (
        !sheet ||
        typeof sheet.getName !== 'function' ||
        typeof sheet.getSheetId !== 'function' ||
        typeof sheet.getLastRow !== 'function' ||
        typeof sheet.getLastColumn !== 'function' ||
        typeof sheet.getRange !== 'function'
      ) {
        return result;
      }

      if (
        sheet.getName() !==
        expectedName
      ) {
        return result;
      }

      var sheetId =
        sheet.getSheetId();

      if (!validSheetId_(sheetId)) {
        return result;
      }

      var lastRow =
        sheet.getLastRow();

      var lastColumn =
        sheet.getLastColumn();

      result.sheetId = sheetId;
      result.lastRow = lastRow;
      result.lastColumn = lastColumn;
      result.evidenceRowCount =
        typeof lastRow === 'number' && lastRow >= 1
          ? lastRow - 1
          : null;

      if (
        typeof lastRow !== 'number' ||
        !isFinite(lastRow) ||
        Math.floor(lastRow) !== lastRow ||
        lastRow < 1 ||
        lastColumn !== headers.length
      ) {
        return result;
      }

      var range =
        sheet.getRange(
          1,
          1,
          1,
          headers.length
        );

      if (
        !range ||
        typeof range.getValues !== 'function' ||
        typeof range.getFormulas !== 'function'
      ) {
        return result;
      }

      var values =
        range.getValues();

      var formulas =
        range.getFormulas();

      if (
        !Array.isArray(values) ||
        values.length !== 1 ||
        !Array.isArray(values[0]) ||
        values[0].length !== headers.length ||
        !Array.isArray(formulas) ||
        formulas.length !== 1 ||
        !Array.isArray(formulas[0]) ||
        formulas[0].length !== headers.length
      ) {
        return result;
      }

      result.headerFormulasPresent =
        formulas[0].some(function (formula) {
          return formula !== '';
        });

      if (result.headerFormulasPresent) {
        return result;
      }

      var exact =
        headers.every(function (header, index) {
          return values[0][index] === header;
        });

      if (!exact) {
        return result;
      }

      result.valid = true;
      return result;
    } catch (error) {
      return result;
    }
  }

  function workbookSheets_(workbook) {
    if (
      !workbook ||
      typeof workbook.getSheets !== 'function' ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      throw new Error(
        'Configured evidence workbook sheet APIs are unavailable.'
      );
    }

    var sheets =
      workbook.getSheets();

    if (!Array.isArray(sheets)) {
      throw new Error(
        'Configured evidence workbook sheet set is malformed.'
      );
    }

    return sheets;
  }

  function positionalIds_(sheets) {
    return sheets.map(function (sheet) {
      if (
        !sheet ||
        typeof sheet.getSheetId !== 'function'
      ) {
        return null;
      }

      var value =
        sheet.getSheetId();

      return validSheetId_(value)
        ? value
        : null;
    });
  }

  function exactIdentitySet_(
    sheets,
    expectedIds
  ) {
    var actual =
      positionalIds_(sheets);

    if (
      actual.some(function (value) {
        return value === null;
      })
    ) {
      return false;
    }

    actual = actual.slice().sort(function (a, b) {
      return a - b;
    });

    expectedIds =
      expectedIds.slice().sort(function (a, b) {
        return a - b;
      });

    return (
      actual.length === expectedIds.length &&
      actual.every(function (value, index) {
        return value === expectedIds[index];
      })
    );
  }

  function inspectResponse_(
    classification,
    activeId,
    configuredId,
    v1,
    v2
  ) {
    var ready =
      classification === V2_REQUIRED ||
      classification === V2_ALREADY;

    return {
      ok: ready,
      mode: MODE_INSPECT,
      classification: classification,

      activeReosSpreadsheetId:
        activeId || '',

      propertyKey:
        PROPERTY_KEY,

      propertyPresent:
        !!configuredId,

      configuredWorkbookId:
        configuredId || '',

      configuredWorkbookOpenable:
        classification !== UNCONFIGURED &&
        classification !== UNSAFE_ALIAS &&
        classification !== UNOPENABLE,

      configuredWorkbookDiffersFromActiveReos:
        !!configuredId &&
        configuredId !== activeId,

      v1SheetName:
        V1_SHEET_NAME,

      v1SheetId:
        v1 && validSheetId_(v1.sheetId)
          ? v1.sheetId
          : null,

      v1SheetPresent:
        !!v1,

      v1SchemaExact:
        !!(v1 && v1.valid),

      v1EvidenceRowCount:
        v1 && v1.evidenceRowCount !== null
          ? v1.evidenceRowCount
          : null,

      v2SheetName:
        V2_SHEET_NAME,

      v2SheetId:
        v2 && validSheetId_(v2.sheetId)
          ? v2.sheetId
          : null,

      v2SheetPresent:
        !!v2,

      v2SchemaExact:
        !!(v2 && v2.valid),

      v2EvidenceRowCount:
        v2 && v2.evidenceRowCount !== null
          ? v2.evidenceRowCount
          : null,

      v2ProvisioningRequired:
        classification === V2_REQUIRED,

      v2ProvisioningAuthorized: false,
      v2PersistenceAuthorized: false,
      v2BoundedRolloutAuthorized: false,
      v2OrchestratorAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function inspect(options) {
    requireAdmin_();

    if (
      options !== undefined &&
      (
        !isPlainObject_(options) ||
        Object.keys(options).length !== 0
      )
    ) {
      throw new Error(
        'V2 provisioning inspection options must be absent or an exact empty object.'
      );
    }

    var active =
      activeSpreadsheet_();

    var properties =
      scriptProperties_();

    var configuredId =
      text_(
        properties.getProperty(
          PROPERTY_KEY
        )
      );

    if (!configuredId) {
      return inspectResponse_(
        UNCONFIGURED,
        active.id,
        '',
        null,
        null
      );
    }

    if (!safeText_(configuredId)) {
      return inspectResponse_(
        UNOPENABLE,
        active.id,
        configuredId,
        null,
        null
      );
    }

    if (configuredId === active.id) {
      return inspectResponse_(
        UNSAFE_ALIAS,
        active.id,
        configuredId,
        null,
        null
      );
    }

    var workbook;

    try {
      if (
        typeof SpreadsheetApp.openById !== 'function'
      ) {
        throw new Error(
          'Spreadsheet open-by-ID support is unavailable.'
        );
      }

      workbook =
        SpreadsheetApp.openById(
          configuredId
        );
    } catch (error) {
      return inspectResponse_(
        UNOPENABLE,
        active.id,
        configuredId,
        null,
        null
      );
    }

    var sheets;

    try {
      sheets =
        workbookSheets_(workbook);
    } catch (error) {
      return inspectResponse_(
        UNEXPECTED_SHEETS,
        active.id,
        configuredId,
        null,
        null
      );
    }

    var v1Sheet =
      workbook.getSheetByName(
        V1_SHEET_NAME
      );

    if (!v1Sheet) {
      return inspectResponse_(
        V1_MISSING,
        active.id,
        configuredId,
        null,
        null
      );
    }

    var v1 =
      schemaState_(
        v1Sheet,
        V1_SHEET_NAME,
        V1_HEADERS
      );

    if (!v1.valid) {
      return inspectResponse_(
        V1_INVALID,
        active.id,
        configuredId,
        v1,
        null
      );
    }

    var v2Sheet =
      workbook.getSheetByName(
        V2_SHEET_NAME
      );

    if (sheets.length === 1) {
      if (
        v2Sheet ||
        !exactIdentitySet_(
          sheets,
          [v1.sheetId]
        )
      ) {
        return inspectResponse_(
          UNEXPECTED_SHEETS,
          active.id,
          configuredId,
          v1,
          null
        );
      }

      return inspectResponse_(
        V2_REQUIRED,
        active.id,
        configuredId,
        v1,
        null
      );
    }

    if (sheets.length !== 2) {
      return inspectResponse_(
        UNEXPECTED_SHEETS,
        active.id,
        configuredId,
        v1,
        null
      );
    }

    if (!v2Sheet) {
      return inspectResponse_(
        UNEXPECTED_SHEETS,
        active.id,
        configuredId,
        v1,
        null
      );
    }

    var v2 =
      schemaState_(
        v2Sheet,
        V2_SHEET_NAME,
        V2_HEADERS
      );

    if (
      !v2.valid ||
      v1.sheetId === v2.sheetId
    ) {
      return inspectResponse_(
        V2_INVALID,
        active.id,
        configuredId,
        v1,
        v2
      );
    }

    if (
      !exactIdentitySet_(
        sheets,
        [
          v1.sheetId,
          v2.sheetId
        ]
      )
    ) {
      return inspectResponse_(
        UNEXPECTED_SHEETS,
        active.id,
        configuredId,
        v1,
        v2
      );
    }

    return inspectResponse_(
      V2_ALREADY,
      active.id,
      configuredId,
      v1,
      v2
    );
  }

  function failureResponse_(
    classification,
    message,
    mutationAttempted
  ) {
    return {
      ok: false,
      mode: MODE_PROVISION,
      classification: classification,
      message: text_(message),

      propertyKey:
        PROPERTY_KEY,

      v1SheetName:
        V1_SHEET_NAME,

      v2SheetName:
        V2_SHEET_NAME,

      schemaFieldCount:
        V2_HEADERS.length,

      v2SheetMutationAttempted:
        mutationAttempted === true,

      workbookCreated: false,
      scriptPropertyWriteExecuted: false,
      v1MutationExecuted: false,
      migrationExecuted: false,

      v2ProvisioningVerified: false,
      v2PersistenceAuthorized: false,
      v2BoundedRolloutAuthorized: false,
      v2OrchestratorAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function successResponse_(
    configuredWorkbookId,
    v1SheetId,
    v2SheetId,
    v1EvidenceRowCount
  ) {
    return {
      ok: true,
      mode: MODE_PROVISION,
      classification: VERIFIED,

      propertyKey:
        PROPERTY_KEY,

      configuredWorkbookId:
        configuredWorkbookId,

      v1SheetName:
        V1_SHEET_NAME,

      v1SheetId:
        v1SheetId,

      v1EvidenceRowCount:
        v1EvidenceRowCount,

      v2SheetName:
        V2_SHEET_NAME,

      v2SheetId:
        v2SheetId,

      schemaFieldCount:
        V2_HEADERS.length,

      schemaExact: true,
      v2EvidenceRowCount: 0,

      workbookCreated: false,
      scriptPropertyWriteExecuted: false,
      v1MutationExecuted: false,
      migrationExecuted: false,

      v2ProvisioningVerified: true,
      v2PersistenceAuthorized: false,
      v2BoundedRolloutAuthorized: false,
      v2OrchestratorAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function provision(options) {
    requireAdmin_();

    var lock = null;
    var lockAcquired = false;
    var mutationBoundaryEntered = false;
    var response = null;

    try {
      if (
        !exactKeys_(
          options,
          [
            'confirmProvisioning',
            'expectedActiveReosSpreadsheetId',
            'expectedConfiguredWorkbookId',
            'expectedV1SheetId',
            'expectedV2State'
          ]
        )
      ) {
        throw new Error(
          'V2 provisioning options must contain exactly the required fields.'
        );
      }

      if (
        options.confirmProvisioning !==
        'PROVISION_V2_EVIDENCE_SHEET'
      ) {
        throw new Error(
          'Explicit V2 evidence-sheet provisioning confirmation is required.'
        );
      }

      if (
        !safeText_(
          options.expectedActiveReosSpreadsheetId
        ) ||
        !safeText_(
          options.expectedConfiguredWorkbookId
        ) ||
        !validSheetId_(
          options.expectedV1SheetId
        ) ||
        options.expectedV2State !== 'ABSENT'
      ) {
        throw new Error(
          'V2 provisioning expected state is invalid.'
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
          'V2 provisioning ScriptLock is contended.'
        );
      }

      if (
        typeof lock.hasLock === 'function' &&
        lock.hasLock() !== true
      ) {
        throw new Error(
          'V2 provisioning ScriptLock ownership could not be verified.'
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

      var properties =
        scriptProperties_();

      var configuredId =
        text_(
          properties.getProperty(
            PROPERTY_KEY
          )
        );

      if (
        !safeText_(configuredId) ||
        configuredId !==
          options.expectedConfiguredWorkbookId
      ) {
        throw new Error(
          'Configured evidence workbook identity changed.'
        );
      }

      if (configuredId === active.id) {
        throw new Error(
          'Configured evidence workbook aliases active REOS.'
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
          configuredId
        );

      var sheets =
        workbookSheets_(workbook);

      if (sheets.length !== 1) {
        throw new Error(
          'V2 provisioning requires exactly one pre-existing V1 sheet.'
        );
      }

      var v1Sheet =
        workbook.getSheetByName(
          V1_SHEET_NAME
        );

      if (!v1Sheet) {
        throw new Error(
          'Existing V1 evidence sheet is missing.'
        );
      }

      var v1 =
        schemaState_(
          v1Sheet,
          V1_SHEET_NAME,
          V1_HEADERS
        );

      if (
        !v1.valid ||
        v1.sheetId !==
          options.expectedV1SheetId ||
        !exactIdentitySet_(
          sheets,
          [v1.sheetId]
        )
      ) {
        throw new Error(
          'Existing V1 evidence sheet identity or schema changed.'
        );
      }

      if (
        workbook.getSheetByName(
          V2_SHEET_NAME
        )
      ) {
        throw new Error(
          'V2 evidence sheet already exists.'
        );
      }

      if (
        typeof workbook.insertSheet !== 'function'
      ) {
        throw new Error(
          'V2 sheet insertion API is unavailable.'
        );
      }

      if (
        typeof SpreadsheetApp.flush !== 'function'
      ) {
        throw new Error(
          'Spreadsheet flush API is unavailable.'
        );
      }

      var v1Snapshot = {
        sheetId: v1.sheetId,
        lastRow: v1.lastRow,
        lastColumn: v1.lastColumn,
        evidenceRowCount:
          v1.evidenceRowCount
      };

      mutationBoundaryEntered = true;

      var newV2Sheet =
        workbook.insertSheet(
          V2_SHEET_NAME
        );

      if (
        !newV2Sheet ||
        typeof newV2Sheet.getName !== 'function' ||
        typeof newV2Sheet.getSheetId !== 'function' ||
        typeof newV2Sheet.getRange !== 'function' ||
        newV2Sheet.getName() !== V2_SHEET_NAME
      ) {
        throw new Error(
          'Created V2 evidence sheet identity is invalid.'
        );
      }

      var newV2SheetId =
        newV2Sheet.getSheetId();

      if (
        !validSheetId_(newV2SheetId) ||
        newV2SheetId ===
          v1Snapshot.sheetId
      ) {
        throw new Error(
          'Created V2 evidence sheet stable identity is invalid.'
        );
      }

      var headerRange =
        newV2Sheet.getRange(
          1,
          1,
          1,
          V2_HEADERS.length
        );

      if (
        !headerRange ||
        typeof headerRange.setValues !== 'function'
      ) {
        throw new Error(
          'V2 header write API is unavailable.'
        );
      }

      headerRange.setValues([
        V2_HEADERS.slice()
      ]);

      SpreadsheetApp.flush();

      var propertyReadback =
        text_(
          properties.getProperty(
            PROPERTY_KEY
          )
        );

      if (
        propertyReadback !==
        configuredId
      ) {
        throw new Error(
          'Evidence workbook Script Property changed during V2 provisioning.'
        );
      }

      var reopened =
        SpreadsheetApp.openById(
          propertyReadback
        );

      var reopenedSheets =
        workbookSheets_(reopened);

      if (reopenedSheets.length !== 2) {
        throw new Error(
          'V2 provisioning did not produce exactly two evidence sheets.'
        );
      }

      var reopenedV1Sheet =
        reopened.getSheetByName(
          V1_SHEET_NAME
        );

      var reopenedV2Sheet =
        reopened.getSheetByName(
          V2_SHEET_NAME
        );

      if (
        !reopenedV1Sheet ||
        !reopenedV2Sheet
      ) {
        throw new Error(
          'Post-provisioning evidence sheet set is incomplete.'
        );
      }

      var reopenedV1 =
        schemaState_(
          reopenedV1Sheet,
          V1_SHEET_NAME,
          V1_HEADERS
        );

      var reopenedV2 =
        schemaState_(
          reopenedV2Sheet,
          V2_SHEET_NAME,
          V2_HEADERS
        );

      if (
        !reopenedV1.valid ||
        reopenedV1.sheetId !==
          v1Snapshot.sheetId ||
        reopenedV1.lastRow !==
          v1Snapshot.lastRow ||
        reopenedV1.lastColumn !==
          v1Snapshot.lastColumn ||
        reopenedV1.evidenceRowCount !==
          v1Snapshot.evidenceRowCount
      ) {
        throw new Error(
          'V1 evidence geometry or schema changed during V2 provisioning.'
        );
      }

      if (
        !reopenedV2.valid ||
        reopenedV2.sheetId !==
          newV2SheetId ||
        reopenedV2.lastRow !== 1 ||
        reopenedV2.lastColumn !==
          V2_HEADERS.length ||
        reopenedV2.evidenceRowCount !== 0
      ) {
        throw new Error(
          'V2 evidence sheet verification failed.'
        );
      }

      if (
        !exactIdentitySet_(
          reopenedSheets,
          [
            reopenedV1.sheetId,
            reopenedV2.sheetId
          ]
        )
      ) {
        throw new Error(
          'Post-provisioning stable sheet identity set is invalid.'
        );
      }

      response =
        successResponse_(
          configuredId,
          reopenedV1.sheetId,
          reopenedV2.sheetId,
          reopenedV1.evidenceRowCount
        );
    } catch (error) {
      response =
        failureResponse_(
          mutationBoundaryEntered
            ? OUTCOME_UNCERTAIN
            : PRECONDITION_FAILED,
          error && error.message
            ? error.message
            : error,
          mutationBoundaryEntered
        );
    } finally {
      if (lockAcquired) {
        try {
          lock.releaseLock();
        } catch (releaseError) {
          response =
            failureResponse_(
              mutationBoundaryEntered
                ? OUTCOME_UNCERTAIN
                : PRECONDITION_FAILED,
              'V2 provisioning ScriptLock release failed: ' +
                text_(
                  releaseError &&
                  releaseError.message
                    ? releaseError.message
                    : releaseError
                ),
              mutationBoundaryEntered
            );
        }
      }
    }

    return response;
  }

  return Object.freeze({
    inspect: inspect,
    provision: provision,

    v1Headers:
      function () {
        return V1_HEADERS.slice();
      },

    v2Headers:
      function () {
        return V2_HEADERS.slice();
      }
  });
}());

function reosAbsenteeOwnerClassificationEvidenceStoreV2ProvisioningInspect(
  options
) {
  return REOS
    .AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin
    .inspect(
      options
    );
}

function reosAbsenteeOwnerClassificationEvidenceStoreV2Provision(
  options
) {
  return REOS
    .AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin
    .provision(
      options
    );
}
