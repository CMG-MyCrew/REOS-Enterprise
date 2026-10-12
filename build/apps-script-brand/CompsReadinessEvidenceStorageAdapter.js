/**
 * REOS Live Production Comps Readiness Evidence Storage Adapter v1
 *
 * Storage-only adapter for the certified append-oriented comps readiness
 * evidence persistence module.
 *
 * IMPORTANT:
 * - This file defines the adapter but does not invoke it automatically.
 * - It does not create sheets.
 * - It does not repair headers.
 * - It does not generate evidence IDs.
 * - It does not calculate ARV, repairs, readiness, MAO, or offers.
 * - It does not wire acquisition workflow authority.
 * - It does not perform an external provider request.
 */

var REOS_COMPS_READINESS_EVIDENCE_STORAGE_ADAPTER_V1 =
  (function () {
    'use strict';

    var TABLES = Object.freeze({
      DEAL_ARV_EVIDENCE: 'DEAL_ARV_EVIDENCE',
      DEAL_REPAIR_SCOPE_EVIDENCE: 'DEAL_REPAIR_SCOPE_EVIDENCE',
      DEAL_OFFER_READINESS_EVIDENCE: 'DEAL_OFFER_READINESS_EVIDENCE'
    });

    var SCHEMAS = Object.freeze({
      DEAL_ARV_EVIDENCE: Object.freeze([
        ['arvEvidenceId', 'ARV Evidence ID', 'string'],
        ['schemaVersion', 'Schema Version', 'string'],
        ['dealId', 'Deal ID', 'string'],
        ['canonicalPropertyKey', 'Canonical Property Key', 'string'],
        ['evidenceStatus', 'Evidence Status', 'string'],
        ['confidenceStatus', 'Confidence Status', 'string'],
        ['estimatedArv', 'Estimated ARV', 'number'],
        [
          'acceptedComparableEvidenceIds',
          'Accepted Comparable Evidence IDs JSON',
          'json'
        ],
        ['acceptedComparableCount', 'Accepted Comparable Count', 'number'],
        ['minimumComparableCount', 'Minimum Comparable Count', 'number'],
        ['valuationMethod', 'Valuation Method', 'string'],
        ['valuationInputs', 'Valuation Inputs JSON', 'json'],
        ['supportedLowValue', 'Supported Low Value', 'nullableNumber'],
        ['supportedHighValue', 'Supported High Value', 'nullableNumber'],
        ['reviewRequired', 'Review Required', 'boolean'],
        ['reasonCodes', 'Reason Codes JSON', 'json'],
        ['evidenceGeneratedAt', 'Evidence Generated At', 'string'],
        ['persistedAt', 'Persisted At', 'string'],
        ['sourceEngine', 'Source Engine', 'string'],
        ['sourceEngineVersion', 'Source Engine Version', 'string'],
        ['provenance', 'Provenance JSON', 'json'],
        ['idempotencyKey', 'Idempotency Key', 'string'],
        ['supersedesEvidenceId', 'Supersedes Evidence ID', 'nullableString']
      ]),

      DEAL_REPAIR_SCOPE_EVIDENCE: Object.freeze([
        ['repairScopeEvidenceId', 'Repair Scope Evidence ID', 'string'],
        ['schemaVersion', 'Schema Version', 'string'],
        ['dealId', 'Deal ID', 'string'],
        ['canonicalPropertyKey', 'Canonical Property Key', 'string'],
        ['scopeStatus', 'Scope Status', 'string'],
        ['scopeComplete', 'Scope Complete', 'boolean'],
        ['estimatedRepairCost', 'Estimated Repair Cost', 'number'],
        ['reviewRequired', 'Review Required', 'boolean'],
        ['reasonCodes', 'Reason Codes JSON', 'json'],
        ['scopeInputs', 'Scope Inputs JSON', 'json'],
        ['evidenceGeneratedAt', 'Evidence Generated At', 'string'],
        ['persistedAt', 'Persisted At', 'string'],
        ['sourceEngine', 'Source Engine', 'string'],
        ['sourceEngineVersion', 'Source Engine Version', 'string'],
        ['provenance', 'Provenance JSON', 'json'],
        ['idempotencyKey', 'Idempotency Key', 'string'],
        ['supersedesEvidenceId', 'Supersedes Evidence ID', 'nullableString']
      ]),

      DEAL_OFFER_READINESS_EVIDENCE: Object.freeze([
        ['readinessEvidenceId', 'Readiness Evidence ID', 'string'],
        ['schemaVersion', 'Schema Version', 'string'],
        ['dealId', 'Deal ID', 'string'],
        ['canonicalPropertyKey', 'Canonical Property Key', 'string'],
        ['arvEvidenceId', 'ARV Evidence ID', 'string'],
        ['repairScopeEvidenceId', 'Repair Scope Evidence ID', 'string'],
        ['decision', 'Decision', 'string'],
        ['compSupportedArvReady', 'Comp Supported ARV Ready', 'boolean'],
        ['repairScopeReady', 'Repair Scope Ready', 'boolean'],
        ['reasonCodes', 'Reason Codes JSON', 'json'],
        ['evaluatedAt', 'Evaluated At', 'string'],
        ['persistedAt', 'Persisted At', 'string'],
        ['gateVersion', 'Gate Version', 'string'],
        ['idempotencyKey', 'Idempotency Key', 'string'],
        ['supersedesEvidenceId', 'Supersedes Evidence ID', 'nullableString']
      ])
    });

    function own(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key);
    }

    function fail(code, detail) {
      var error = new Error(code + (detail ? ': ' + detail : ''));
      error.code = code;
      throw error;
    }

    function requireTable(tableName) {
      if (!own(SCHEMAS, tableName)) {
        fail('UNSUPPORTED_EVIDENCE_TABLE', String(tableName));
      }

      return SCHEMAS[tableName];
    }

    function headersFor(schema) {
      return schema.map(function (field) {
        return field[1];
      });
    }

    function normalizeHeader(value) {
      if (value === null || value === undefined) {
        return '';
      }

      return String(value).trim();
    }

    function assertExactHeaders(tableName, actualHeaders, schema) {
      var expected = headersFor(schema);

      if (actualHeaders.length !== expected.length) {
        fail(
          'EVIDENCE_HEADER_COUNT_MISMATCH',
          tableName +
            ' expected=' +
            expected.length +
            ' actual=' +
            actualHeaders.length
        );
      }

      for (var i = 0; i < expected.length; i += 1) {
        if (normalizeHeader(actualHeaders[i]) !== expected[i]) {
          fail(
            'EVIDENCE_HEADER_MISMATCH',
            tableName +
              ' column=' +
              (i + 1) +
              ' expected=' +
              expected[i] +
              ' actual=' +
              normalizeHeader(actualHeaders[i])
          );
        }
      }
    }

    function stableJson(value) {
      function normalize(input) {
        if (Array.isArray(input)) {
          return input.map(normalize);
        }

        if (
          input !== null &&
          typeof input === 'object' &&
          !(input instanceof Date)
        ) {
          var result = {};

          Object.keys(input)
            .sort()
            .forEach(function (key) {
              result[key] = normalize(input[key]);
            });

          return result;
        }

        return input;
      }

      return JSON.stringify(normalize(value));
    }

    function serializeValue(value, type, fieldName) {
      if (type === 'json') {
        if (value === undefined) {
          fail('EVIDENCE_FIELD_MISSING', fieldName);
        }

        return stableJson(value);
      }

      if (type === 'boolean') {
        if (value !== true && value !== false) {
          fail('EVIDENCE_BOOLEAN_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'number') {
        if (
          typeof value !== 'number' ||
          !isFinite(value)
        ) {
          fail('EVIDENCE_NUMBER_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'nullableNumber') {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return '';
        }

        if (
          typeof value !== 'number' ||
          !isFinite(value)
        ) {
          fail('EVIDENCE_NUMBER_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'nullableString') {
        if (
          value === null ||
          value === undefined ||
          value === ''
        ) {
          return '';
        }

        if (typeof value !== 'string') {
          fail('EVIDENCE_STRING_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'string') {
        if (typeof value !== 'string') {
          fail('EVIDENCE_STRING_INVALID', fieldName);
        }

        return value;
      }

      fail('EVIDENCE_TYPE_UNSUPPORTED', type);
    }

    function parseJson(value, fieldName) {
      if (typeof value !== 'string') {
        fail('EVIDENCE_JSON_CELL_INVALID', fieldName);
      }

      try {
        return JSON.parse(value);
      } catch (error) {
        fail('EVIDENCE_JSON_CELL_INVALID', fieldName);
      }
    }

    function deserializeValue(value, type, fieldName) {
      if (type === 'json') {
        return parseJson(value, fieldName);
      }

      if (type === 'boolean') {
        if (value !== true && value !== false) {
          fail('EVIDENCE_BOOLEAN_CELL_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'number') {
        if (
          typeof value !== 'number' ||
          !isFinite(value)
        ) {
          fail('EVIDENCE_NUMBER_CELL_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'nullableNumber') {
        if (
          value === '' ||
          value === null ||
          value === undefined
        ) {
          return null;
        }

        if (
          typeof value !== 'number' ||
          !isFinite(value)
        ) {
          fail('EVIDENCE_NUMBER_CELL_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'nullableString') {
        if (
          value === '' ||
          value === null ||
          value === undefined
        ) {
          return null;
        }

        if (typeof value !== 'string') {
          fail('EVIDENCE_STRING_CELL_INVALID', fieldName);
        }

        return value;
      }

      if (type === 'string') {
        if (typeof value !== 'string') {
          fail('EVIDENCE_STRING_CELL_INVALID', fieldName);
        }

        return value;
      }

      fail('EVIDENCE_TYPE_UNSUPPORTED', type);
    }

    function recordToRow(tableName, record) {
      var schema = requireTable(tableName);

      if (
        record === null ||
        typeof record !== 'object' ||
        Array.isArray(record)
      ) {
        fail('EVIDENCE_RECORD_INVALID', tableName);
      }

      return schema.map(function (field) {
        return serializeValue(
          record[field[0]],
          field[2],
          field[0]
        );
      });
    }

    function rowToRecord(tableName, row) {
      var schema = requireTable(tableName);

      if (!Array.isArray(row)) {
        fail('EVIDENCE_ROW_INVALID', tableName);
      }

      if (row.length !== schema.length) {
        fail(
          'EVIDENCE_ROW_WIDTH_MISMATCH',
          tableName +
            ' expected=' +
            schema.length +
            ' actual=' +
            row.length
        );
      }

      var record = {};

      schema.forEach(function (field, index) {
        record[field[0]] = deserializeValue(
          row[index],
          field[2],
          field[0]
        );
      });

      return Object.freeze(record);
    }

    function isBlankRow(row) {
      return row.every(function (value) {
        return (
          value === '' ||
          value === null ||
          value === undefined
        );
      });
    }

    function getSpreadsheet() {
      /*
       * Reuse the repository's established production spreadsheet
       * convention. No alternate spreadsheet ID or fallback datastore is
       * introduced here.
       */
      if (
        typeof SpreadsheetApp === 'undefined' ||
        typeof SpreadsheetApp.getActiveSpreadsheet !== 'function'
      ) {
        fail('EVIDENCE_SPREADSHEET_UNAVAILABLE');
      }

      var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

      if (!spreadsheet) {
        fail('EVIDENCE_SPREADSHEET_UNAVAILABLE');
      }

      return spreadsheet;
    }

    function requireSheet(tableName, spreadsheet) {
      requireTable(tableName);

      var sheet = spreadsheet.getSheetByName(tableName);

      if (!sheet) {
        fail('EVIDENCE_SHEET_MISSING', tableName);
      }

      return sheet;
    }

    function readHeaders(tableName, sheet, schema) {
      var expectedCount = schema.length;

      if (sheet.getLastColumn() !== expectedCount) {
        fail(
          'EVIDENCE_HEADER_COUNT_MISMATCH',
          tableName +
            ' expected=' +
            expectedCount +
            ' actual=' +
            sheet.getLastColumn()
        );
      }

      if (sheet.getLastRow() < 1) {
        fail('EVIDENCE_HEADER_ROW_MISSING', tableName);
      }

      var headers = sheet
        .getRange(1, 1, 1, expectedCount)
        .getValues()[0];

      assertExactHeaders(
        tableName,
        headers,
        schema
      );

      return headers;
    }

    function readAll(tableName) {
      var schema = requireTable(tableName);
      var spreadsheet = getSpreadsheet();
      var sheet = requireSheet(tableName, spreadsheet);

      readHeaders(tableName, sheet, schema);

      var lastRow = sheet.getLastRow();

      if (lastRow <= 1) {
        return Object.freeze([]);
      }

      var rows = sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          schema.length
        )
        .getValues();

      var records = [];

      rows.forEach(function (row) {
        if (isBlankRow(row)) {
          return;
        }

        records.push(
          rowToRecord(tableName, row)
        );
      });

      return Object.freeze(records);
    }

    function acquireAppendLock() {
      if (
        typeof LockService === 'undefined' ||
        typeof LockService.getScriptLock !== 'function'
      ) {
        fail('EVIDENCE_LOCK_UNAVAILABLE');
      }

      var lock = LockService.getScriptLock();

      if (!lock) {
        fail('EVIDENCE_LOCK_UNAVAILABLE');
      }

      if (!lock.tryLock(30000)) {
        fail('EVIDENCE_LOCK_TIMEOUT');
      }

      return lock;
    }

    function append(tableName, record) {
      var schema = requireTable(tableName);
      var row = recordToRow(tableName, record);
      var lock = acquireAppendLock();

      try {
        var spreadsheet = getSpreadsheet();
        var sheet = requireSheet(tableName, spreadsheet);

        readHeaders(tableName, sheet, schema);

        var targetRow = sheet.getLastRow() + 1;

        /*
         * Exactly one already-validated evidence record is written.
         * No sheet creation, header repair, update, overwrite, or
         * multi-table transaction is performed.
         */
        sheet
          .getRange(
            targetRow,
            1,
            1,
            schema.length
          )
          .setValues([row]);

        SpreadsheetApp.flush();

        return Object.freeze({
          appended: true,
          tableName: tableName,
          rowNumber: targetRow
        });
      } finally {
        lock.releaseLock();
      }
    }

    function createStorageAdapter() {
      return Object.freeze({
        readAll: readAll,
        append: append
      });
    }

    return Object.freeze({
      TABLES: TABLES,
      SCHEMAS: SCHEMAS,
      createStorageAdapter: createStorageAdapter,
      recordToRow: recordToRow,
      rowToRecord: rowToRecord
    });
  })();

if (
  typeof module !== 'undefined' &&
  module.exports
) {
  module.exports =
    REOS_COMPS_READINESS_EVIDENCE_STORAGE_ADAPTER_V1;
}
