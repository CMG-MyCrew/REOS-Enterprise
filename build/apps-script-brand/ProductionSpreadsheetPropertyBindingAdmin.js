/**
 * REOS production spreadsheet property binding administrator v1.
 *
 * Administrative capability only.
 *
 * This module authorizes no automatic invocation.
 * It must be invoked only under a separately certified bounded
 * production execution authorization.
 *
 * Authorized mutation surface:
 *   REOS_PRODUCTION_SPREADSHEET_ID
 *
 * The module does NOT authorize:
 * - any other Script Property mutation
 * - property deletion
 * - spreadsheet mutation
 * - sheet creation or repair
 * - evidence persistence
 * - provisioning
 * - readiness-gate consumer wiring
 * - Qualified Deal Queue mutation
 * - acquisition lifecycle mutation
 * - MAO authority
 * - offer generation/submission
 */

var REOS_PRODUCTION_SPREADSHEET_PROPERTY_BINDING_ADMIN_V1 =
    (function () {
  'use strict';

  var VERSION = 'v1';

  var PROPERTY_NAME =
      'REOS_PRODUCTION_SPREADSHEET_ID';

  var AUTHORIZED_SPREADSHEET_ID =
      '1N_5Saw8paJbUZ3FYWr2LmqMDV5qcHSNHda6RoxyqNTU';

  var PRIMARY_SHEET = 'DISTRESS_LEADS';
  var SECONDARY_SHEET = 'DEALS';

  var PRIMARY_REQUIRED_FIELDS = [
    'Distress Lead ID',
    'Address',
    'City',
    'State',
    'Zip',
    'County',
    'Source',
    'Source Dataset',
    'Parcel ID',
    'Source Record ID',
    'Source Record Key',
    'Source Observation Key',
    'Canonical Property Key'
  ];

  var SECONDARY_REQUIRED_FIELDS = [
    'Deal ID',
    'Address',
    'Deal Status'
  ];

  function normalize_(value) {
    return String(value || '').trim();
  }

  function defaultRuntime_() {
    return {
      getProperty: function (name) {
        return PropertiesService
          .getScriptProperties()
          .getProperty(name);
      },

      setProperty: function (name, value) {
        PropertiesService
          .getScriptProperties()
          .setProperty(name, value);
      },

      openSpreadsheetById: function (spreadsheetId) {
        return SpreadsheetApp.openById(spreadsheetId);
      }
    };
  }

  function resolveRuntime_(runtime) {
    var rt = runtime || defaultRuntime_();

    if (
      !rt ||
      typeof rt.getProperty !== 'function' ||
      typeof rt.setProperty !== 'function' ||
      typeof rt.openSpreadsheetById !== 'function'
    ) {
      throw new Error('INVALID_RUNTIME');
    }

    return rt;
  }

  function getHeaders_(sheet) {
    var lastColumn = sheet.getLastColumn();

    if (lastColumn < 1) {
      return [];
    }

    return sheet
      .getRange(1, 1, 1, lastColumn)
      .getDisplayValues()[0]
      .map(function (value) {
        return normalize_(value);
      });
  }

  function inspectMarker_(spreadsheet, sheetName, requiredFields) {
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return {
        sheetName: sheetName,
        present: false,
        requiredFieldsPresent: false,
        missingFields: requiredFields.slice()
      };
    }

    var headers = getHeaders_(sheet);
    var present = {};

    headers.forEach(function (header) {
      present[header] = true;
    });

    var missing = requiredFields.filter(function (field) {
      return present[field] !== true;
    });

    return {
      sheetName: sheetName,
      present: true,
      requiredFieldsPresent: missing.length === 0,
      missingFields: missing
    };
  }

  function execute(candidateSpreadsheetId, options, runtime) {
    var candidate = normalize_(candidateSpreadsheetId);
    var opts = options || {};

    if (opts.authorized !== true) {
      return {
        version: VERSION,
        certified: false,
        mutationExecuted: false,
        reason: 'EXPLICIT_AUTHORIZATION_REQUIRED'
      };
    }

    if (candidate !== AUTHORIZED_SPREADSHEET_ID) {
      return {
        version: VERSION,
        certified: false,
        mutationExecuted: false,
        reason: 'UNAUTHORIZED_CANDIDATE'
      };
    }

    var rt = resolveRuntime_(runtime);

    var before =
        normalize_(rt.getProperty(PROPERTY_NAME));

    if (before && before !== candidate) {
      return {
        version: VERSION,
        certified: false,
        mutationExecuted: false,

        propertyName: PROPERTY_NAME,
        propertyBefore: before,
        propertyAfter: before,
        propertyMatchesCandidate: false,

        candidateSpreadsheetId: candidate,
        openedSpreadsheetId: '',

        primary: null,
        secondary: null,

        reason: 'PREEXISTING_PROPERTY_MISMATCH'
      };
    }

    var mutationExecuted = false;

    if (!before) {
      rt.setProperty(PROPERTY_NAME, candidate);
      mutationExecuted = true;
    }

    var after =
        normalize_(rt.getProperty(PROPERTY_NAME));

    if (after !== candidate) {
      return {
        version: VERSION,
        certified: false,
        mutationExecuted: mutationExecuted,

        propertyName: PROPERTY_NAME,
        propertyBefore: before,
        propertyAfter: after,
        propertyMatchesCandidate: false,

        candidateSpreadsheetId: candidate,
        openedSpreadsheetId: '',

        primary: null,
        secondary: null,

        reason: 'POST_WRITE_PROPERTY_MISMATCH'
      };
    }

    var spreadsheet =
        rt.openSpreadsheetById(candidate);

    if (
      !spreadsheet ||
      typeof spreadsheet.getId !== 'function' ||
      typeof spreadsheet.getSheetByName !== 'function'
    ) {
      throw new Error('INVALID_SPREADSHEET_HANDLE');
    }

    var openedSpreadsheetId =
        normalize_(spreadsheet.getId());

    if (openedSpreadsheetId !== candidate) {
      return {
        version: VERSION,
        certified: false,
        mutationExecuted: mutationExecuted,

        propertyName: PROPERTY_NAME,
        propertyBefore: before,
        propertyAfter: after,
        propertyMatchesCandidate: true,

        candidateSpreadsheetId: candidate,
        openedSpreadsheetId: openedSpreadsheetId,

        primary: null,
        secondary: null,

        reason: 'OPENED_SPREADSHEET_ID_MISMATCH'
      };
    }

    var primary = inspectMarker_(
      spreadsheet,
      PRIMARY_SHEET,
      PRIMARY_REQUIRED_FIELDS
    );

    var secondary = inspectMarker_(
      spreadsheet,
      SECONDARY_SHEET,
      SECONDARY_REQUIRED_FIELDS
    );

    var certified =
        primary.requiredFieldsPresent === true &&
        secondary.requiredFieldsPresent === true;

    return {
      version: VERSION,
      certified: certified,
      mutationExecuted: mutationExecuted,

      propertyName: PROPERTY_NAME,
      propertyBefore: before,
      propertyAfter: after,
      propertyMatchesCandidate: true,

      candidateSpreadsheetId: candidate,
      openedSpreadsheetId: openedSpreadsheetId,

      primary: primary,
      secondary: secondary,

      reason:
          certified
            ? 'BOUND_AND_CERTIFIED'
            : 'BOUND_BUT_MARKERS_NOT_CERTIFIED'
    };
  }

  return {
    VERSION: VERSION,
    PROPERTY_NAME: PROPERTY_NAME,
    AUTHORIZED_SPREADSHEET_ID: AUTHORIZED_SPREADSHEET_ID,

    execute: execute
  };
})();


function reosBindProductionSpreadsheetIdAndVerifyV1(
    candidateSpreadsheetId,
    options
) {
  return REOS_PRODUCTION_SPREADSHEET_PROPERTY_BINDING_ADMIN_V1
    .execute(
      candidateSpreadsheetId,
      options
    );
}
