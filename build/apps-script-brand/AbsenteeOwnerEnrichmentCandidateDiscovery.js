var REOS = REOS || {};

REOS.AbsenteeOwnerEnrichmentCandidateDiscovery = (function () {
  'use strict';

  var TABLE = 'DISTRESS_LEADS';
  var DISTRESS_ID = 'Distress Lead ID';
  var CANONICAL_KEY = 'Canonical Property Key';
  var PHASE = 'absentee_owner_candidate_discovery';
  var MAX_ROWS = 50;

  function authority_() {
    return {
      productionDataMutationAuthorityGranted: false,
      canonicalIdentityRepairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      triggerAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      certificationMutationAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function fail_(code, message) {
    var result = {
      ok: false,
      mode: 'READ_ONLY',
      phase: PHASE,
      code: code,
      message: message
    };

    var authority = authority_();

    Object.keys(authority).forEach(function (key) {
      result[key] = authority[key];
    });

    return result;
  }

  function cleanString_(value) {
    return String(value == null ? '' : value).trim();
  }

  function validateInput_(options) {
    if (
      !options ||
      typeof options !== 'object' ||
      Array.isArray(options)
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_OPTIONS',
          'options must be an object.'
        )
      };
    }

    var keys = Object.keys(options).slice().sort();

    if (
      keys.length !== 2 ||
      keys[0] !== 'maxRows' ||
      keys[1] !== 'startRow'
    ) {
      return {
        ok: false,
        result: fail_(
          'UNEXPECTED_OPTIONS',
          'Only startRow and maxRows are permitted.'
        )
      };
    }

    var startRow = options.startRow;
    var maxRows = options.maxRows;

    if (
      typeof startRow !== 'number' ||
      !isFinite(startRow) ||
      Math.floor(startRow) !== startRow ||
      startRow < 2
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_START_ROW',
          'startRow must be a finite integer greater than or equal to 2.'
        )
      };
    }

    if (
      typeof maxRows !== 'number' ||
      !isFinite(maxRows) ||
      Math.floor(maxRows) !== maxRows ||
      maxRows < 1 ||
      maxRows > MAX_ROWS
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_MAX_ROWS',
          'maxRows must be a finite integer from 1 through 50.'
        )
      };
    }

    return {
      ok: true,
      startRow: startRow,
      maxRows: maxRows
    };
  }

  function uniqueHeaderIndex_(headers, name) {
    var indexes = [];

    headers.forEach(function (header, index) {
      if (cleanString_(header) === name) {
        indexes.push(index);
      }
    });

    if (indexes.length === 0) {
      return {
        ok: false,
        result: fail_(
          'MISSING_REQUIRED_HEADER',
          'Missing required header: ' + name
        )
      };
    }

    if (indexes.length !== 1) {
      return {
        ok: false,
        result: fail_(
          'DUPLICATE_REQUIRED_HEADER',
          'Required header must occur exactly once: ' + name
        )
      };
    }

    return {
      ok: true,
      index: indexes[0]
    };
  }

  function validColumnMatrix_(values, expectedRows) {
    if (
      !Array.isArray(values) ||
      values.length !== expectedRows
    ) {
      return false;
    }

    for (var index = 0; index < values.length; index++) {
      if (
        !Array.isArray(values[index]) ||
        values[index].length !== 1
      ) {
        return false;
      }
    }

    return true;
  }

  function success_(
    startRow,
    rowsInspected,
    lastRow,
    nextStartRow,
    exhausted,
    candidates
  ) {
    var result = {
      ok: true,
      mode: 'READ_ONLY',
      phase: PHASE,
      startRow: startRow,
      rowsInspected: rowsInspected,
      lastRow: lastRow,
      nextStartRow: nextStartRow,
      exhausted: exhausted,
      candidateCount: candidates.length,
      candidates: candidates
    };

    var authority = authority_();

    Object.keys(authority).forEach(function (key) {
      result[key] = authority[key];
    });

    return result;
  }

  function discover(options) {
    REOS.Security.requireAdmin();

    var validated = validateInput_(options);

    if (!validated.ok) {
      return validated.result;
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (!spreadsheet) {
      return fail_(
        'ACTIVE_SPREADSHEET_UNAVAILABLE',
        'Active spreadsheet is unavailable.'
      );
    }

    var sheet = spreadsheet.getSheetByName(TABLE);

    if (!sheet) {
      return fail_(
        'DISTRESS_LEADS_SHEET_MISSING',
        'DISTRESS_LEADS sheet does not exist.'
      );
    }

    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();

    if (
      typeof lastRow !== 'number' ||
      !isFinite(lastRow) ||
      Math.floor(lastRow) !== lastRow ||
      typeof lastColumn !== 'number' ||
      !isFinite(lastColumn) ||
      Math.floor(lastColumn) !== lastColumn ||
      lastRow < 1 ||
      lastColumn < 1
    ) {
      return fail_(
        'INVALID_SHEET_GEOMETRY',
        'DISTRESS_LEADS sheet geometry is invalid.'
      );
    }

    /*
     * Bounded physical read #1:
     * exactly the current header row.
     */
    var headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0];

    if (
      !Array.isArray(headers) ||
      headers.length !== lastColumn
    ) {
      return fail_(
        'INVALID_HEADER_READ',
        'DISTRESS_LEADS header read is invalid.'
      );
    }

    var distressHeader = uniqueHeaderIndex_(headers, DISTRESS_ID);

    if (!distressHeader.ok) {
      return distressHeader.result;
    }

    var canonicalHeader = uniqueHeaderIndex_(
      headers,
      CANONICAL_KEY
    );

    if (!canonicalHeader.ok) {
      return canonicalHeader.result;
    }

    /*
     * An out-of-range future start row is a bounded exhausted result.
     * No candidate data-range read occurs.
     */
    if (validated.startRow > lastRow) {
      return success_(
        validated.startRow,
        0,
        lastRow,
        null,
        true,
        []
      );
    }

    var rowsToInspect = Math.min(
      validated.maxRows,
      lastRow - validated.startRow + 1
    );

    /*
     * Bounded physical reads #2 and #3:
     * only the two persisted identity columns for this one window.
     *
     * No complete DISTRESS_LEADS data row is read.
     */
    var distressValues = sheet
      .getRange(
        validated.startRow,
        distressHeader.index + 1,
        rowsToInspect,
        1
      )
      .getValues();

    var canonicalValues = sheet
      .getRange(
        validated.startRow,
        canonicalHeader.index + 1,
        rowsToInspect,
        1
      )
      .getValues();

    if (
      !validColumnMatrix_(distressValues, rowsToInspect) ||
      !validColumnMatrix_(canonicalValues, rowsToInspect)
    ) {
      return fail_(
        'INVALID_BOUNDED_READ',
        'Bounded persisted-identity read is invalid.'
      );
    }

    var candidates = [];

    for (var offset = 0; offset < rowsToInspect; offset++) {
      var distressLeadId = cleanString_(
        distressValues[offset][0]
      );

      var canonicalPropertyKey = cleanString_(
        canonicalValues[offset][0]
      );

      if (
        !distressLeadId ||
        !canonicalPropertyKey
      ) {
        continue;
      }

      candidates.push({
        rowNumber: validated.startRow + offset,
        'Distress Lead ID': distressLeadId,
        'Canonical Property Key': canonicalPropertyKey
      });
    }

    var lastInspectedRow =
      validated.startRow + rowsToInspect - 1;

    var exhausted = lastInspectedRow >= lastRow;

    return success_(
      validated.startRow,
      rowsToInspect,
      lastRow,
      exhausted ? null : lastInspectedRow + 1,
      exhausted,
      candidates
    );
  }

  return {
    discover: discover
  };
})();

function reosAbsenteeOwnerEnrichmentCandidateDiscovery(options) {
  return REOS
    .AbsenteeOwnerEnrichmentCandidateDiscovery
    .discover(options);
}
