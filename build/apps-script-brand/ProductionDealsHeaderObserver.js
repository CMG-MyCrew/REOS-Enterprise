/**
 * REOS Production DEALS Header Observer v1
 *
 * Purpose:
 *   Perform one bounded, read-only observation of row 1 from the exact
 *   production DEALS sheet using an explicit spreadsheet ID.
 *
 * Safety:
 *   - no getActiveSpreadsheet()
 *   - no PropertiesService mutation
 *   - no sheet creation/deletion
 *   - no header repair
 *   - no append/persistence
 *   - no locks
 *   - no triggers/providers
 *   - no automatic invocation
 *   - no MAO/offer authority
 */
var REOS_PRODUCTION_DEALS_HEADER_OBSERVER_V1 = (function () {
  'use strict';

  var VERSION = 'v1';

  var AUTHORIZED_SPREADSHEET_ID =
    '1N_5Saw8paJbUZ3FYWr2LmqMDV5qcHSNHda6RoxyqNTU';

  var SHEET_NAME = 'DEALS';

  var MAX_HEADER_COLUMNS = 256;

  function normalize_(value) {
    return String(value == null ? '' : value).trim();
  }

  function copyArray_(values) {
    return Array.prototype.slice.call(values || []);
  }

  function defaultRuntime_() {
    return {
      openSpreadsheetById: function (spreadsheetId) {
        return SpreadsheetApp.openById(spreadsheetId);
      }
    };
  }

  function resolveRuntime_(runtime) {
    runtime = runtime || defaultRuntime_();

    if (
      !runtime ||
      typeof runtime.openSpreadsheetById !== 'function'
    ) {
      throw new Error(
        'READ_ONLY_RUNTIME_OPEN_BY_ID_REQUIRED'
      );
    }

    return runtime;
  }

  function observe(spreadsheetId, runtime) {
    var candidate = normalize_(spreadsheetId);

    var result = {
      version: VERSION,
      readOnly: true,
      mutationExecuted: false,
      candidateSpreadsheetId: candidate,
      openedSpreadsheetId: '',
      sheetName: SHEET_NAME,
      sheetPresent: false,
      lastColumn: 0,
      observedColumnCount: 0,
      headers: [],
      reason: '',
      certifiedObservation: false
    };

    if (!candidate) {
      result.reason = 'SPREADSHEET_ID_REQUIRED';
      return result;
    }

    if (candidate !== AUTHORIZED_SPREADSHEET_ID) {
      result.reason = 'SPREADSHEET_ID_NOT_AUTHORIZED';
      return result;
    }

    var rt;

    try {
      rt = resolveRuntime_(runtime);
    } catch (error) {
      result.reason = 'RUNTIME_INVALID';
      return result;
    }

    var spreadsheet;

    try {
      spreadsheet = rt.openSpreadsheetById(candidate);
    } catch (error) {
      result.reason = 'OPEN_BY_ID_FAILED';
      return result;
    }

    if (
      !spreadsheet ||
      typeof spreadsheet.getId !== 'function' ||
      typeof spreadsheet.getSheetByName !== 'function'
    ) {
      result.reason = 'SPREADSHEET_INTERFACE_INVALID';
      return result;
    }

    result.openedSpreadsheetId =
      normalize_(spreadsheet.getId());

    if (result.openedSpreadsheetId !== candidate) {
      result.reason = 'OPENED_SPREADSHEET_ID_MISMATCH';
      return result;
    }

    var sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      result.reason = 'DEALS_SHEET_MISSING';
      return result;
    }

    result.sheetPresent = true;

    if (
      typeof sheet.getLastColumn !== 'function' ||
      typeof sheet.getRange !== 'function'
    ) {
      result.reason = 'SHEET_INTERFACE_INVALID';
      return result;
    }

    var lastColumn = Number(sheet.getLastColumn());

    if (
      !isFinite(lastColumn) ||
      lastColumn < 0 ||
      Math.floor(lastColumn) !== lastColumn
    ) {
      result.reason = 'LAST_COLUMN_INVALID';
      return result;
    }

    result.lastColumn = lastColumn;

    if (lastColumn === 0) {
      result.reason = 'DEALS_HEADER_EMPTY';
      return result;
    }

    if (lastColumn > MAX_HEADER_COLUMNS) {
      result.reason = 'DEALS_HEADER_BOUND_EXCEEDED';
      return result;
    }

    var range = sheet.getRange(
      1,
      1,
      1,
      lastColumn
    );

    if (
      !range ||
      typeof range.getDisplayValues !== 'function'
    ) {
      result.reason = 'HEADER_RANGE_INTERFACE_INVALID';
      return result;
    }

    var rows = range.getDisplayValues();

    if (
      !rows ||
      !rows.length ||
      !Array.isArray(rows[0])
    ) {
      result.reason = 'HEADER_READ_INVALID';
      return result;
    }

    var headers = copyArray_(rows[0]).map(normalize_);

    result.headers = headers;
    result.observedColumnCount = headers.length;

    if (headers.length !== lastColumn) {
      result.reason = 'HEADER_WIDTH_MISMATCH';
      return result;
    }

    result.reason = 'OBSERVED';
    result.certifiedObservation = true;

    return result;
  }

  return {
    version: VERSION,
    authorizedSpreadsheetId: AUTHORIZED_SPREADSHEET_ID,
    sheetName: SHEET_NAME,
    maxHeaderColumns: MAX_HEADER_COLUMNS,
    observe: observe
  };
})();

function reosObserveProductionDealsHeaderV1(spreadsheetId) {
  return REOS_PRODUCTION_DEALS_HEADER_OBSERVER_V1.observe(
    spreadsheetId
  );
}
