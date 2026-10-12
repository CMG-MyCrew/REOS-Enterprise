/**
 * REOS Production Spreadsheet Identity Certification V1.
 *
 * Read-only administrative identity surface.
 *
 * This module does not authorize:
 * - spreadsheet mutation
 * - script-property mutation
 * - provisioning
 * - persistence
 * - trigger/provider execution
 * - readiness-gate wiring
 * - MAO or offer authority
 *
 * Production identity must be supplied explicitly by the caller and must
 * independently match the existing REOS_PRODUCTION_SPREADSHEET_ID script
 * property and the two certified production sheet/schema markers.
 */

var REOS_PRODUCTION_SPREADSHEET_IDENTITY_CERTIFICATION_V1 =
    (function () {
  'use strict';

  var VERSION = 'v1';

  var PROPERTY_NAME =
      'REOS_PRODUCTION_SPREADSHEET_ID';

  var PRIMARY_SHEET =
      'DISTRESS_LEADS';

  var SECONDARY_SHEET =
      'DEALS';

  var PRIMARY_REQUIRED_FIELDS =
      ["Distress Lead ID", "Address", "City", "State", "Zip", "County", "Source", "Source Dataset", "Parcel ID", "Source Record ID", "Source Record Key", "Source Observation Key", "Canonical Property Key"];

  var SECONDARY_REQUIRED_FIELDS =
      ["ARV", "Analysis ID", "Cap Rate %", "Cash Required", "Closed", "Closing", "Comparable Analysis", "Created At", "DEALS", "DSCR", "Deal ID", "Disposition", "Due Diligence", "Flip Profit", "Grade", "Initial Analysis", "Lead", "MAO", "NOI", "Negotiation", "Offer Amount", "Offer Generation", "Offer ID", "Offer Submitted", "Property Review", "Purchase Price", "ROI %", "Recommendation", "Risk Level", "Score", "Score ID", "Source", "Status", "Summary JSON", "Under Contract", "Updated At"];

  function copyArray_(values) {
    return values.slice();
  }

  function normalizeCandidate_(value) {
    if (typeof value !== 'string') {
      throw new Error(
        'candidateSpreadsheetId must be a nonempty string'
      );
    }

    var normalized = value.trim();

    if (!normalized) {
      throw new Error(
        'candidateSpreadsheetId must be a nonempty string'
      );
    }

    return normalized;
  }

  function defaultRuntime_() {
    return {
      readScriptProperty: function (name) {
        return PropertiesService
          .getScriptProperties()
          .getProperty(name);
      },

      openSpreadsheetById: function (spreadsheetId) {
        return SpreadsheetApp.openById(spreadsheetId);
      }
    };
  }

  function resolveRuntime_(runtime) {
    var resolved = runtime || defaultRuntime_();

    if (
      !resolved ||
      typeof resolved.readScriptProperty !== 'function' ||
      typeof resolved.openSpreadsheetById !== 'function'
    ) {
      throw new Error(
        'read-only identity runtime dependencies are required'
      );
    }

    return resolved;
  }

  function readHeader_(spreadsheet, sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      return {
        sheetName: sheetName,
        present: false,
        header: [],
        missingRequiredFields: []
      };
    }

    var lastColumn = Number(sheet.getLastColumn()) || 0;
    var header = [];

    if (lastColumn > 0) {
      header = sheet
        .getRange(1, 1, 1, lastColumn)
        .getDisplayValues()[0]
        .map(function (value) {
          return String(value == null ? '' : value).trim();
        });
    }

    return {
      sheetName: sheetName,
      present: true,
      header: header
    };
  }

  function certifyRequiredFields_(
      spreadsheet,
      sheetName,
      requiredFields
  ) {
    var result = readHeader_(spreadsheet, sheetName);

    var present = {};

    result.header.forEach(function (field) {
      if (field) {
        present[field] = true;
      }
    });

    var missing = requiredFields.filter(function (field) {
      return !present[field];
    });

    return {
      sheetName: sheetName,
      present: result.present,
      headerColumnCount: result.header.length,
      requiredFieldCount: requiredFields.length,
      requiredFields: copyArray_(requiredFields),
      missingRequiredFields: missing,
      requiredFieldsPresent:
          result.present && missing.length === 0
    };
  }

  function certify(candidateSpreadsheetId, runtime) {
    var candidate =
        normalizeCandidate_(candidateSpreadsheetId);

    var rt = resolveRuntime_(runtime);

    var propertyValue =
        rt.readScriptProperty(PROPERTY_NAME);

    var propertyPresent =
        typeof propertyValue === 'string' &&
        propertyValue.trim().length > 0;

    var normalizedProperty =
        propertyPresent
          ? propertyValue.trim()
          : '';

    var propertyMatchesCandidate =
        propertyPresent &&
        normalizedProperty === candidate;

    /*
     * Fail closed before opening any workbook when the existing
     * production binding is absent or disagrees with the explicit
     * candidate.
     */
    if (!propertyMatchesCandidate) {
      return {
        version: VERSION,
        certified: false,

        propertyName: PROPERTY_NAME,
        propertyPresent: propertyPresent,
        propertyValue: normalizedProperty,
        propertyMatchesCandidate: false,

        candidateSpreadsheetId: candidate,
        openedSpreadsheetId: '',

        primary: null,
        secondary: null,

        mutationExecuted: false,
        reason:
            propertyPresent
              ? 'PROPERTY_CANDIDATE_MISMATCH'
              : 'PROPERTY_MISSING'
      };
    }

    var spreadsheet =
        rt.openSpreadsheetById(candidate);

    if (
      !spreadsheet ||
      typeof spreadsheet.getId !== 'function' ||
      typeof spreadsheet.getSheetByName !== 'function'
    ) {
      throw new Error(
        'openSpreadsheetById returned invalid spreadsheet'
      );
    }

    var openedSpreadsheetId =
        String(spreadsheet.getId() || '').trim();

    if (openedSpreadsheetId !== candidate) {
      return {
        version: VERSION,
        certified: false,

        propertyName: PROPERTY_NAME,
        propertyPresent: true,
        propertyValue: normalizedProperty,
        propertyMatchesCandidate: true,

        candidateSpreadsheetId: candidate,
        openedSpreadsheetId: openedSpreadsheetId,

        primary: null,
        secondary: null,

        mutationExecuted: false,
        reason: 'OPENED_SPREADSHEET_ID_MISMATCH'
      };
    }

    var primary = certifyRequiredFields_(
      spreadsheet,
      PRIMARY_SHEET,
      PRIMARY_REQUIRED_FIELDS
    );

    var secondary = certifyRequiredFields_(
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

      propertyName: PROPERTY_NAME,
      propertyPresent: true,
      propertyValue: normalizedProperty,
      propertyMatchesCandidate: true,

      candidateSpreadsheetId: candidate,
      openedSpreadsheetId: openedSpreadsheetId,

      primary: primary,
      secondary: secondary,

      mutationExecuted: false,

      reason:
          certified
            ? 'CERTIFIED'
            : 'REQUIRED_PRODUCTION_MARKER_MISMATCH'
    };
  }

  return {
    VERSION: VERSION,
    PROPERTY_NAME: PROPERTY_NAME,
    PRIMARY_SHEET: PRIMARY_SHEET,
    SECONDARY_SHEET: SECONDARY_SHEET,

    getPrimaryRequiredFields: function () {
      return copyArray_(PRIMARY_REQUIRED_FIELDS);
    },

    getSecondaryRequiredFields: function () {
      return copyArray_(SECONDARY_REQUIRED_FIELDS);
    },

    certify: certify
  };
})();


function reosProductionSpreadsheetIdentityCertificationV1(
    candidateSpreadsheetId
) {
  return REOS_PRODUCTION_SPREADSHEET_IDENTITY_CERTIFICATION_V1
    .certify(candidateSpreadsheetId);
}
