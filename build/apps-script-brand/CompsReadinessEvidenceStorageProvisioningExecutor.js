(function (root) {
  'use strict';

  var VERSION = 'v1';
  var EXPECTED_SPREADSHEET_PROPERTY =
    'REOS_PRODUCTION_SPREADSHEET_ID';
  var LOCK_TIMEOUT_MS = 30000;

  function isNonBlankString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function freeze(value) {
    if (
      value &&
      typeof value === 'object' &&
      !Object.isFrozen(value)
    ) {
      Object.freeze(value);
    }

    return value;
  }

  function result(outcome, extra) {
    var value = {
      outcome: outcome,
      version: VERSION
    };

    Object.keys(extra || {}).forEach(function (key) {
      value[key] = extra[key];
    });

    return freeze(value);
  }

  function requireRuntime(runtime) {
    if (!runtime || typeof runtime !== 'object') {
      throw new Error('Executor runtime is required.');
    }

    [
      'openSpreadsheetById',
      'getExpectedSpreadsheetIdentity',
      'getSheetByName',
      'insertSheet',
      'getScriptLock',
      'flush'
    ].forEach(function (name) {
      if (typeof runtime[name] !== 'function') {
        throw new Error(
          'Missing executor runtime dependency: ' + name
        );
      }
    });

    return runtime;
  }

  function defaultRuntime() {
    return {
      openSpreadsheetById: function (spreadsheetId) {
        return SpreadsheetApp.openById(spreadsheetId);
      },

      getExpectedSpreadsheetIdentity: function () {
        return PropertiesService
          .getScriptProperties()
          .getProperty(EXPECTED_SPREADSHEET_PROPERTY);
      },

      getSheetByName: function (spreadsheet, sheetName) {
        return spreadsheet.getSheetByName(sheetName);
      },

      insertSheet: function (spreadsheet, sheetName) {
        return spreadsheet.insertSheet(sheetName);
      },

      getScriptLock: function () {
        return LockService.getScriptLock();
      },

      flush: function () {
        SpreadsheetApp.flush();
      }
    };
  }

  function requireProvisioningApi(api) {
    if (
      !api ||
      typeof api !== 'object' ||
      typeof api.preflightProductionEvidenceStorage !==
        'function' ||
      typeof api.provisionProductionEvidenceStorage !==
        'function'
    ) {
      throw new Error(
        'Certified comps readiness evidence storage ' +
        'provisioning API is required.'
      );
    }

    return api;
  }

  function readExactHeaders(sheet) {
    var lastColumn = sheet.getLastColumn();
    var lastRow = sheet.getLastRow();

    if (lastColumn < 1 || lastRow < 1) {
      return [];
    }

    return sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0]
      .map(function (value) {
        return String(value);
      });
  }

  function createDependencies(
    requestedSpreadsheetIdentity,
    runtime
  ) {
    runtime = requireRuntime(runtime);

    var spreadsheet = null;

    function resolveSpreadsheetIdentity() {
      if (!isNonBlankString(requestedSpreadsheetIdentity)) {
        return null;
      }

      spreadsheet = runtime.openSpreadsheetById(
        requestedSpreadsheetIdentity
      );

      if (
        !spreadsheet ||
        typeof spreadsheet.getId !== 'function'
      ) {
        return null;
      }

      var resolved = spreadsheet.getId();

      if (!isNonBlankString(resolved)) {
        return null;
      }

      return resolved;
    }

    function getExpectedSpreadsheetIdentity() {
      var expected =
        runtime.getExpectedSpreadsheetIdentity();

      return isNonBlankString(expected)
        ? expected
        : null;
    }

    function requireBoundSpreadsheet() {
      if (!spreadsheet) {
        throw new Error(
          'Production spreadsheet is not explicitly bound.'
        );
      }

      return spreadsheet;
    }

    function getSheetHeaders(tableName) {
      var bound = requireBoundSpreadsheet();
      var sheet = runtime.getSheetByName(
        bound,
        tableName
      );

      if (!sheet) {
        return null;
      }

      return readExactHeaders(sheet);
    }

    function createSheetWithHeaders(
      tableName,
      expectedHeaders
    ) {
      var bound = requireBoundSpreadsheet();

      if (
        !Array.isArray(expectedHeaders) ||
        expectedHeaders.length < 1
      ) {
        throw new Error(
          'Expected headers are required.'
        );
      }

      if (runtime.getSheetByName(bound, tableName)) {
        throw new Error(
          'Sheet already exists: ' + tableName
        );
      }

      var sheet = runtime.insertSheet(
        bound,
        tableName
      );

      if (!sheet) {
        throw new Error(
          'Sheet creation failed: ' + tableName
        );
      }

      sheet
        .getRange(
          1,
          1,
          1,
          expectedHeaders.length
        )
        .setValues([expectedHeaders.slice()]);

      runtime.flush();
    }

    function acquireLock() {
      var lock = runtime.getScriptLock();

      if (
        !lock ||
        typeof lock.tryLock !== 'function'
      ) {
        return null;
      }

      return lock.tryLock(LOCK_TIMEOUT_MS)
        ? lock
        : null;
    }

    function releaseLock(lock) {
      if (
        lock &&
        typeof lock.releaseLock === 'function'
      ) {
        lock.releaseLock();
      }
    }

    return freeze({
      resolveSpreadsheetIdentity:
        resolveSpreadsheetIdentity,
      getExpectedSpreadsheetIdentity:
        getExpectedSpreadsheetIdentity,
      getSheetHeaders:
        getSheetHeaders,
      createSheetWithHeaders:
        createSheetWithHeaders,
      acquireLock:
        acquireLock,
      releaseLock:
        releaseLock
    });
  }

  function preflight(options, runtime, provisioningApi) {
    options = options || {};

    if (!isNonBlankString(options.spreadsheetIdentity)) {
      return result(
        'rejected_spreadsheet_identity',
        {
          ready: false,
          spreadsheetIdentityVerified: false
        }
      );
    }

    runtime = runtime || defaultRuntime();

    var deps = createDependencies(
      options.spreadsheetIdentity,
      runtime
    );

    provisioningApi = requireProvisioningApi(
      provisioningApi ||
      root.REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_V1
    );

    return provisioningApi
      .preflightProductionEvidenceStorage(
        {
          explicit: true
        },
        deps
      );
  }

  function execute(options, runtime, provisioningApi) {
    options = options || {};

    if (options.authorized !== true) {
      return result(
        'rejected_authorization',
        {
          provisioned: false,
          ready: false
        }
      );
    }

    if (!isNonBlankString(options.spreadsheetIdentity)) {
      return result(
        'rejected_spreadsheet_identity',
        {
          provisioned: false,
          ready: false,
          spreadsheetIdentityVerified: false
        }
      );
    }

    runtime = runtime || defaultRuntime();

    var deps = createDependencies(
      options.spreadsheetIdentity,
      runtime
    );

    provisioningApi = requireProvisioningApi(
      provisioningApi ||
      root.REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_V1
    );

    return provisioningApi
      .provisionProductionEvidenceStorage(
        {
          authorized: true
        },
        deps
      );
  }

  var api = Object.freeze({
    VERSION: VERSION,
    EXPECTED_SPREADSHEET_PROPERTY:
      EXPECTED_SPREADSHEET_PROPERTY,
    LOCK_TIMEOUT_MS: LOCK_TIMEOUT_MS,
    createDependencies: createDependencies,
    preflight: preflight,
    execute: execute
  });

  root.REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_EXECUTOR_V1 =
    api;

  if (
    typeof module !== 'undefined' &&
    module.exports
  ) {
    module.exports = api;
  }
}(
  typeof globalThis !== 'undefined'
    ? globalThis
    : this
));
