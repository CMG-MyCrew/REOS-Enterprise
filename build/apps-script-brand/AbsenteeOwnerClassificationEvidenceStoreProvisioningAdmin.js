var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin = (function () {
  'use strict';

  var PROPERTY_KEY =
    'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

  var WORKBOOK_NAME =
    'REOS Absentee Owner Classification Evidence';

  var SHEET_NAME =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE';

  var MODE_INSPECT =
    'ADMIN_EVIDENCE_STORE_PROVISIONING_INSPECTION';

  var MODE_PROVISION =
    'ADMIN_EVIDENCE_STORE_PROVISIONING';

  var UNPROVISIONED =
    'UNPROVISIONED';

  var ALREADY_PROVISIONED =
    'ALREADY_PROVISIONED';

  var UNSAFE_ACTIVE_REOS_ALIAS =
    'UNSAFE_ACTIVE_REOS_ALIAS';

  var CONFIGURED_WORKBOOK_UNOPENABLE =
    'CONFIGURED_WORKBOOK_UNOPENABLE';

  var CONFIGURED_SHEET_MISSING =
    'CONFIGURED_SHEET_MISSING';

  var CONFIGURED_SCHEMA_INVALID =
    'CONFIGURED_SCHEMA_INVALID';

  var PRECONDITION_FAILED =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_PRECONDITION_FAILED';

  var OUTCOME_UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN';

  var VERIFIED =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED';

  var HEADERS = Object.freeze([
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

  function safeText_(value) {
    return (
      typeof value === 'string' &&
      value !== '' &&
      !/[\u0000-\u001F\u007F]/.test(value) &&
      !/^[=+\-@]/.test(value)
    );
  }

  function requireAdmin_() {
    if (
      !REOS ||
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'Provisioning admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
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

  function activeSpreadsheet_() {
    if (
      typeof SpreadsheetApp === 'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp.getActiveSpreadsheet !== 'function'
    ) {
      throw new Error(
        'Active spreadsheet access is unavailable.'
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
      String(active.getId() || '').trim();

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

  function inspectSchema_(workbook) {
    if (
      !workbook ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      return {
        sheetPresent: false,
        schemaExact: false,
        headerFormulasPresent: null
      };
    }

    var sheet =
      workbook.getSheetByName(
        SHEET_NAME
      );

    if (!sheet) {
      return {
        sheetPresent: false,
        schemaExact: false,
        headerFormulasPresent: null
      };
    }

    if (
      typeof sheet.getLastRow !== 'function' ||
      typeof sheet.getLastColumn !== 'function' ||
      typeof sheet.getRange !== 'function'
    ) {
      return {
        sheetPresent: true,
        schemaExact: false,
        headerFormulasPresent: null
      };
    }

    var lastRow;
    var lastColumn;
    var values;
    var formulas;

    try {
      lastRow = sheet.getLastRow();
      lastColumn = sheet.getLastColumn();

      if (
        lastRow < 1 ||
        lastColumn !== HEADERS.length
      ) {
        return {
          sheetPresent: true,
          schemaExact: false,
          headerFormulasPresent: null
        };
      }

      var range =
        sheet.getRange(
          1,
          1,
          1,
          HEADERS.length
        );

      values = range.getValues();
      formulas = range.getFormulas();
    } catch (error) {
      return {
        sheetPresent: true,
        schemaExact: false,
        headerFormulasPresent: null
      };
    }

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      !Array.isArray(values[0]) ||
      values[0].length !== HEADERS.length ||
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      !Array.isArray(formulas[0]) ||
      formulas[0].length !== HEADERS.length
    ) {
      return {
        sheetPresent: true,
        schemaExact: false,
        headerFormulasPresent: null
      };
    }

    var headersExact =
      HEADERS.every(function (header, index) {
        return values[0][index] === header;
      });

    var formulasPresent =
      formulas[0].some(function (formula) {
        return formula !== '';
      });

    return {
      sheetPresent: true,
      schemaExact:
        headersExact &&
        formulasPresent === false,
      headerFormulasPresent:
        formulasPresent
    };
  }

  function inspectionResponse_(
    classification,
    activeId,
    propertyPresent,
    configuredWorkbookId,
    configuredWorkbookOpenable,
    configuredWorkbookDiffersFromActiveReos,
    sheetPresent,
    schemaExact,
    headerFormulasPresent
  ) {
    return {
      ok: true,
      mode: MODE_INSPECT,
      classification: classification,
      activeReosSpreadsheetId: activeId,
      propertyKey: PROPERTY_KEY,
      propertyPresent: propertyPresent,
      configuredWorkbookId: configuredWorkbookId,
      configuredWorkbookOpenable:
        configuredWorkbookOpenable,
      configuredWorkbookDiffersFromActiveReos:
        configuredWorkbookDiffersFromActiveReos,
      sheetName: SHEET_NAME,
      sheetPresent: sheetPresent,
      schemaFieldCount: HEADERS.length,
      schemaExact: schemaExact,
      headerFormulasPresent:
        headerFormulasPresent,
      provisioningRequired:
        classification === UNPROVISIONED,
      provisioningAuthorized: false,
      persistenceAuthorized: false,
      boundedRolloutAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function inspect(options) {
    requireAdmin_();

    if (
      options !== undefined &&
      !exactKeys_(options, [])
    ) {
      throw new Error(
        'Inspection options must be absent or an exact empty object.'
      );
    }

    var active =
      activeSpreadsheet_();

    var properties =
      scriptProperties_();

    var configuredWorkbookId =
      String(
        properties.getProperty(
          PROPERTY_KEY
        ) ||
        ''
      ).trim();

    if (!configuredWorkbookId) {
      return inspectionResponse_(
        UNPROVISIONED,
        active.id,
        false,
        '',
        false,
        null,
        false,
        false,
        null
      );
    }

    if (configuredWorkbookId === active.id) {
      return inspectionResponse_(
        UNSAFE_ACTIVE_REOS_ALIAS,
        active.id,
        true,
        configuredWorkbookId,
        true,
        false,
        false,
        false,
        null
      );
    }

    if (
      typeof SpreadsheetApp.openById !== 'function'
    ) {
      return inspectionResponse_(
        CONFIGURED_WORKBOOK_UNOPENABLE,
        active.id,
        true,
        configuredWorkbookId,
        false,
        true,
        false,
        false,
        null
      );
    }

    var workbook;

    try {
      workbook =
        SpreadsheetApp.openById(
          configuredWorkbookId
        );
    } catch (error) {
      return inspectionResponse_(
        CONFIGURED_WORKBOOK_UNOPENABLE,
        active.id,
        true,
        configuredWorkbookId,
        false,
        true,
        false,
        false,
        null
      );
    }

    if (!workbook) {
      return inspectionResponse_(
        CONFIGURED_WORKBOOK_UNOPENABLE,
        active.id,
        true,
        configuredWorkbookId,
        false,
        true,
        false,
        false,
        null
      );
    }

    var schema =
      inspectSchema_(workbook);

    if (!schema.sheetPresent) {
      return inspectionResponse_(
        CONFIGURED_SHEET_MISSING,
        active.id,
        true,
        configuredWorkbookId,
        true,
        true,
        false,
        false,
        null
      );
    }

    if (!schema.schemaExact) {
      return inspectionResponse_(
        CONFIGURED_SCHEMA_INVALID,
        active.id,
        true,
        configuredWorkbookId,
        true,
        true,
        true,
        false,
        schema.headerFormulasPresent
      );
    }

    return inspectionResponse_(
      ALREADY_PROVISIONED,
      active.id,
      true,
      configuredWorkbookId,
      true,
      true,
      true,
      true,
      false
    );
  }

  function failureResponse_(
    classification,
    message,
    activeId,
    workbookId
  ) {
    return {
      ok: false,
      mode: MODE_PROVISION,
      classification: classification,
      message: String(message || ''),
      activeReosSpreadsheetId:
        String(activeId || ''),
      evidenceWorkbookId:
        String(workbookId || ''),
      propertyKey: PROPERTY_KEY,
      sheetName: SHEET_NAME,
      schemaFieldCount: HEADERS.length,
      persistenceAuthorized: false,
      boundedRolloutAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function successResponse_(
    activeId,
    workbookId
  ) {
    return {
      ok: true,
      mode: MODE_PROVISION,
      classification: VERIFIED,
      activeReosSpreadsheetId: activeId,
      evidenceWorkbookId: workbookId,
      propertyKey: PROPERTY_KEY,
      sheetName: SHEET_NAME,
      schemaFieldCount: HEADERS.length,
      schemaExact: true,
      propertyReadbackVerified: true,
      workbookSeparationVerified: true,
      evidenceRowCount: 0,
      persistenceAuthorized: false,
      boundedRolloutAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function verifyProvisionedWorkbook_(
    workbook,
    activeId,
    expectedWorkbookId
  ) {
    if (
      !workbook ||
      typeof workbook.getId !== 'function' ||
      typeof workbook.getSheets !== 'function' ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      throw new Error(
        'Provisioned workbook APIs are unavailable.'
      );
    }

    var workbookId =
      String(workbook.getId() || '').trim();

    if (
      !safeText_(workbookId) ||
      workbookId === activeId ||
      (
        expectedWorkbookId &&
        workbookId !== expectedWorkbookId
      )
    ) {
      throw new Error(
        'Provisioned workbook identity is invalid or unsafe.'
      );
    }

    var sheets =
      workbook.getSheets();

    if (
      !Array.isArray(sheets) ||
      sheets.length !== 1
    ) {
      throw new Error(
        'Provisioned workbook must contain exactly one sheet.'
      );
    }

    var sheet =
      workbook.getSheetByName(
        SHEET_NAME
      );

    if (
      !sheet ||
      typeof sheet.getName !== 'function' ||
      sheet.getName() !== SHEET_NAME ||
      sheets[0] !== sheet ||
      typeof sheet.getLastRow !== 'function' ||
      typeof sheet.getLastColumn !== 'function' ||
      typeof sheet.getRange !== 'function'
    ) {
      throw new Error(
        'Provisioned evidence sheet identity is invalid.'
      );
    }

    if (
      sheet.getLastRow() !== 1 ||
      sheet.getLastColumn() !== HEADERS.length
    ) {
      throw new Error(
        'Provisioned evidence sheet geometry is invalid.'
      );
    }

    var range =
      sheet.getRange(
        1,
        1,
        1,
        HEADERS.length
      );

    var values =
      range.getValues();

    var formulas =
      range.getFormulas();

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      !Array.isArray(values[0]) ||
      values[0].length !== HEADERS.length ||
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      !Array.isArray(formulas[0]) ||
      formulas[0].length !== HEADERS.length
    ) {
      throw new Error(
        'Provisioned evidence schema readback is invalid.'
      );
    }

    HEADERS.forEach(function (header, index) {
      if (values[0][index] !== header) {
        throw new Error(
          'Provisioned evidence header mismatch at column ' +
          (index + 1) +
          '.'
        );
      }
    });

    if (
      formulas[0].some(function (formula) {
        return formula !== '';
      })
    ) {
      throw new Error(
        'Provisioned evidence headers must not contain formulas.'
      );
    }

    return {
      workbookId: workbookId,
      sheet: sheet
    };
  }

  function provision(options) {
    requireAdmin_();

    var activeId = '';
    var createdWorkbookId = '';
    var lock = null;
    var lockAcquired = false;
    var lockReleaseAttempted = false;
    var mutationStarted = false;

    try {
      if (
        !exactKeys_(
          options,
          [
            'expectedActiveReosSpreadsheetId',
            'expectedPropertyState'
          ]
        )
      ) {
        return failureResponse_(
          PRECONDITION_FAILED,
          'Provisioning options must contain exactly the required fields.',
          activeId,
          createdWorkbookId
        );
      }

      if (
        !safeText_(
          options.expectedActiveReosSpreadsheetId
        ) ||
        options.expectedPropertyState !== 'ABSENT'
      ) {
        return failureResponse_(
          PRECONDITION_FAILED,
          'Provisioning expected state is invalid.',
          activeId,
          createdWorkbookId
        );
      }

      if (
        typeof LockService === 'undefined' ||
        !LockService ||
        typeof LockService.getScriptLock !== 'function'
      ) {
        return failureResponse_(
          PRECONDITION_FAILED,
          'ScriptLock support is unavailable.',
          activeId,
          createdWorkbookId
        );
      }

      lock =
        LockService.getScriptLock();

      if (
        !lock ||
        typeof lock.tryLock !== 'function' ||
        typeof lock.releaseLock !== 'function'
      ) {
        return failureResponse_(
          PRECONDITION_FAILED,
          'ScriptLock APIs are unavailable.',
          activeId,
          createdWorkbookId
        );
      }

      lockAcquired =
        lock.tryLock(1000) === true;

      if (!lockAcquired) {
        return failureResponse_(
          PRECONDITION_FAILED,
          'Provisioning ScriptLock is contended.',
          activeId,
          createdWorkbookId
        );
      }

      if (
        typeof lock.hasLock === 'function' &&
        lock.hasLock() !== true
      ) {
        throw new Error(
          'Provisioning ScriptLock ownership could not be verified.'
        );
      }

      requireAdmin_();

      var active =
        activeSpreadsheet_();

      activeId =
        active.id;

      if (
        activeId !==
        options.expectedActiveReosSpreadsheetId
      ) {
        throw new Error(
          'Active REOS spreadsheet identity changed.'
        );
      }

      var properties =
        scriptProperties_();

      if (
        typeof properties.setProperty !== 'function'
      ) {
        throw new Error(
          'Script Properties write access is unavailable.'
        );
      }

      var propertyPrestate =
        String(
          properties.getProperty(
            PROPERTY_KEY
          ) ||
          ''
        ).trim();

      if (propertyPrestate !== '') {
        throw new Error(
          'Evidence-store Script Property is already configured.'
        );
      }

      if (
        typeof SpreadsheetApp.create !== 'function' ||
        typeof SpreadsheetApp.openById !== 'function' ||
        typeof SpreadsheetApp.flush !== 'function'
      ) {
        throw new Error(
          'Provisioning Spreadsheet APIs are unavailable.'
        );
      }

      mutationStarted = true;

      var workbook =
        SpreadsheetApp.create(
          WORKBOOK_NAME
        );

      if (
        !workbook ||
        typeof workbook.getId !== 'function' ||
        typeof workbook.getSheets !== 'function'
      ) {
        throw new Error(
          'Created evidence workbook is invalid.'
        );
      }

      createdWorkbookId =
        String(
          workbook.getId() ||
          ''
        ).trim();

      if (
        !safeText_(createdWorkbookId) ||
        createdWorkbookId === activeId
      ) {
        throw new Error(
          'Created evidence workbook identity is unsafe.'
        );
      }

      var sheets =
        workbook.getSheets();

      if (
        !Array.isArray(sheets) ||
        sheets.length !== 1
      ) {
        throw new Error(
          'Created evidence workbook must contain exactly one initial sheet.'
        );
      }

      var sheet =
        sheets[0];

      if (
        !sheet ||
        typeof sheet.setName !== 'function' ||
        typeof sheet.getRange !== 'function'
      ) {
        throw new Error(
          'Initial evidence sheet APIs are unavailable.'
        );
      }

      sheet.setName(
        SHEET_NAME
      );

      var headerRange =
        sheet.getRange(
          1,
          1,
          1,
          HEADERS.length
        );

      if (
        !headerRange ||
        typeof headerRange.setValues !== 'function'
      ) {
        throw new Error(
          'Evidence header write surface is unavailable.'
        );
      }

      headerRange.setValues([
        HEADERS.slice()
      ]);

      SpreadsheetApp.flush();

      verifyProvisionedWorkbook_(
        workbook,
        activeId,
        createdWorkbookId
      );

      properties.setProperty(
        PROPERTY_KEY,
        createdWorkbookId
      );

      var propertyReadback =
        String(
          properties.getProperty(
            PROPERTY_KEY
          ) ||
          ''
        ).trim();

      if (
        propertyReadback !==
        createdWorkbookId
      ) {
        throw new Error(
          'Evidence-store Script Property readback failed.'
        );
      }

      var reopened =
        SpreadsheetApp.openById(
          propertyReadback
        );

      verifyProvisionedWorkbook_(
        reopened,
        activeId,
        createdWorkbookId
      );

      if (
        typeof lock.hasLock === 'function' &&
        lock.hasLock() !== true
      ) {
        throw new Error(
          'Provisioning ScriptLock was lost before completion.'
        );
      }

      try {
        lockReleaseAttempted = true;
        lock.releaseLock();
        lockAcquired = false;
      } catch (releaseError) {
        throw new Error(
          'Provisioning ScriptLock release failed: ' +
          releaseError.message
        );
      }

      return successResponse_(
        activeId,
        createdWorkbookId
      );
    } catch (error) {
      return failureResponse_(
        mutationStarted
          ? OUTCOME_UNCERTAIN
          : PRECONDITION_FAILED,
        error && error.message
          ? error.message
          : error,
        activeId,
        createdWorkbookId
      );
    } finally {
      if (
        lockAcquired &&
        !lockReleaseAttempted &&
        lock &&
        typeof lock.releaseLock === 'function'
      ) {
        try {
          lock.releaseLock();
        } catch (ignoredReleaseError) {
          // No rollback or cleanup authority is granted here.
        }
      }
    }
  }

  return {
    inspect: inspect,
    provision: provision
  };
})();

function reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(options) {
  return REOS
    .AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin
    .inspect(options);
}

function reosAbsenteeOwnerClassificationEvidenceStoreProvision(options) {
  return REOS
    .AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin
    .provision(options);
}
