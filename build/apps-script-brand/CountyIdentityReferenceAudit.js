/**
 * REOS Enterprise - County Identity Reference Audit
 *
 * Read-only forensic diagnostic for downstream Distress Lead ID references.
 *
 * Read-only by construction:
 * - enumerates existing workbook sheets
 * - excludes authoritative DISTRESS_LEADS from downstream reference scanning
 * - reads existing cell values only
 * - searches for exact Distress Lead ID references
 * - returns bounded deterministic evidence
 *
 * This module does not create sheets, modify cells, persist rows,
 * execute connectors, access county sources, modify scheduler state,
 * create triggers, or grant repair/migration authority.
 */
var REOS = REOS || {};

REOS.CountyIdentityReferenceAudit = (function () {
  var AUTHORITATIVE_TABLE = 'DISTRESS_LEADS';
  var DEFAULT_MAX_MATCHES = 250;
  var MAX_MATCHES = 1000;
  var DEFAULT_MAX_IDS = 100;
  var MAX_IDS = 500;

  function text_(value) {
    return String(
      value === undefined || value === null ? '' : value
    ).trim();
  }

  function boundedInteger_(value, fallback, maximum) {
    var number = Number(value || fallback);

    if (!isFinite(number) || number < 1) {
      number = fallback;
    }

    return Math.min(Math.floor(number), maximum);
  }

  function normalizeIds_(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    var seen = {};

    return value
      .map(text_)
      .filter(function (id) {
        if (!id || seen[id]) {
          return false;
        }

        seen[id] = true;
        return true;
      })
      .slice(0, MAX_IDS);
  }

  function normalizeOptions_(options) {
    options = options || {};

    return {
      distressLeadIds:
        normalizeIds_(options.distressLeadIds),

      maxMatches:
        boundedInteger_(
          options.maxMatches,
          DEFAULT_MAX_MATCHES,
          MAX_MATCHES
        )
    };
  }

  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'Admin security authority is required.'
      );
    }

    if (
      typeof SpreadsheetApp === 'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp.getActiveSpreadsheet !== 'function'
    ) {
      throw new Error(
        'Spreadsheet read authority is required.'
      );
    }
  }

  function audit(options) {
    requireDependencies_();
    REOS.Security.requireAdmin();

    options = normalizeOptions_(options);

    if (!options.distressLeadIds.length) {
      throw new Error(
        'At least one Distress Lead ID is required.'
      );
    }

    var wanted = {};
    options.distressLeadIds.forEach(function (id) {
      wanted[id] = true;
    });

    var spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    var sheets =
      spreadsheet.getSheets();

    var matches = [];
    var matchedIds = {};
    var scannedSheets = [];
    var truncated = false;

    sheets.forEach(function (sheet) {
      if (truncated) {
        return;
      }

      var sheetName = text_(sheet.getName());

      if (
        !sheetName ||
        sheetName === AUTHORITATIVE_TABLE
      ) {
        return;
      }

      var lastRow = Number(sheet.getLastRow() || 0);
      var lastColumn = Number(sheet.getLastColumn() || 0);

      scannedSheets.push({
        sheet: sheetName,
        rows: lastRow,
        columns: lastColumn
      });

      if (lastRow < 1 || lastColumn < 1) {
        return;
      }

      var values =
        sheet
          .getRange(
            1,
            1,
            lastRow,
            lastColumn
          )
          .getValues();

      for (
        var rowIndex = 0;
        rowIndex < values.length;
        rowIndex++
      ) {
        for (
          var columnIndex = 0;
          columnIndex < values[rowIndex].length;
          columnIndex++
        ) {
          var value =
            text_(values[rowIndex][columnIndex]);

          if (!wanted[value]) {
            continue;
          }

          matchedIds[value] = true;

          matches.push({
            distressLeadId: value,
            sheet: sheetName,
            rowNumber: rowIndex + 1,
            columnNumber: columnIndex + 1
          });

          if (
            matches.length >= options.maxMatches
          ) {
            truncated = true;
            break;
          }
        }

        if (truncated) {
          break;
        }
      }
    });

    var unmatchedIds =
      options.distressLeadIds.filter(
        function (id) {
          return !matchedIds[id];
        }
      );

    return {
      ok: true,
      mode: 'READ_ONLY',
      phase: 'downstream_reference_audit',

      repairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      repairPlanAuthorityGranted: false,

      authoritativeTable:
        AUTHORITATIVE_TABLE,

      requestedIds:
        options.distressLeadIds.slice(),

      requestedIdCount:
        options.distressLeadIds.length,

      scannedSheetCount:
        scannedSheets.length,

      scannedSheets:
        scannedSheets,

      matchCount:
        matches.length,

      matchedIdCount:
        Object.keys(matchedIds).length,

      unmatchedIds:
        unmatchedIds,

      matches:
        matches,

      truncated:
        truncated,

      maxMatches:
        options.maxMatches
    };
  }

  return {
    audit: audit
  };
})();


/*
 * Controlled admin-only read entry point.
 */
function reosCountyIdentityReferenceAudit(options) {
  return REOS.CountyIdentityReferenceAudit.audit(
    options || {}
  );
}
