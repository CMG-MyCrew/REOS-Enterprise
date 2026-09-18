(function (root, factory) {
  'use strict';

  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.REOS = root.REOS || {};
  root.REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder = api;
}(
  typeof globalThis !== 'undefined' ? globalThis : this,
  function () {
    'use strict';

    var TARGET_TABLE = 'DISTRESS_LEADS';

    var REQUIRED_HEADERS = Object.freeze([
      'Distress Lead ID',
      'Canonical Property Key',
      'Owner Name',
      'Owner Mailing Address',
      'Updated At'
    ]);

    var IDENTITY_FIELDS = Object.freeze([
      'Distress Lead ID',
      'Canonical Property Key'
    ]);

    var PATCH_FIELDS = Object.freeze([
      'Owner Name',
      'Owner Mailing Address'
    ]);

    var FORMULA_TARGET_FIELDS = Object.freeze([
      'Owner Name',
      'Owner Mailing Address',
      'Updated At'
    ]);

    function fail_(message) {
      throw new Error(message);
    }

    function isPlainObject_(value) {
      return !!value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date);
    }

    function requiredString_(value, field) {
      if (typeof value !== 'string' || value.trim() === '') {
        fail_('IDENTITY_INVALID:' + field);
      }
      return value.trim();
    }

    function canonicalValue_(value) {
      if (value === '') {
        return { type: 'blank' };
      }

      if (typeof value === 'string') {
        return {
          type: 'string',
          value: value
        };
      }

      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          fail_('PHYSICAL_VALUE_NON_FINITE_NUMBER');
        }

        return {
          type: 'number',
          value: String(value)
        };
      }

      if (typeof value === 'boolean') {
        return {
          type: 'boolean',
          value: value
        };
      }

      if (value instanceof Date) {
        if (!Number.isFinite(value.getTime())) {
          fail_('PHYSICAL_VALUE_INVALID_DATE');
        }

        return {
          type: 'date',
          value: value.toISOString()
        };
      }

      fail_('PHYSICAL_VALUE_UNSUPPORTED_TYPE');
    }

    function validatePlan_(plan) {
      if (!isPlainObject_(plan)) {
        fail_('PHASE1F_PLAN_INVALID');
      }

      if (plan.ok !== true) {
        fail_('PHASE1F_PLAN_NOT_CERTIFIED');
      }

      if (!isPlainObject_(plan.identity)) {
        fail_('PHASE1F_IDENTITY_INVALID');
      }

      if (!Number.isInteger(plan.rowNumber) || plan.rowNumber < 2) {
        fail_('PHASE1F_ROW_NUMBER_INVALID');
      }

      [
        'persistenceExecutionAuthorized',
        'databaseUpdateAuthorized',
        'databaseInsertAuthorized',
        'databaseUpsertAuthorized',
        'dealCreationAuthorized',
        'maoGenerationAuthorized',
        'automaticOfferAuthorityGranted'
      ].forEach(function (field) {
        if (plan[field] !== false) {
          fail_('PHASE1F_AUTHORITY_INVALID:' + field);
        }
      });

      var identity = {};

      IDENTITY_FIELDS.forEach(function (field) {
        identity[field] =
          requiredString_(plan.identity[field], field);
      });

      if (!isPlainObject_(plan.patch)) {
        fail_('PHASE1F_PATCH_INVALID');
      }

      var patchKeys = Object.keys(plan.patch);

      if (patchKeys.length === 0) {
        fail_('PHASE1F_PATCH_EMPTY');
      }

      patchKeys.forEach(function (field) {
        if (PATCH_FIELDS.indexOf(field) === -1) {
          fail_('PATCH_FIELD_NOT_ALLOWED:' + field);
        }

        if (typeof plan.patch[field] !== 'string') {
          fail_('PATCH_VALUE_INVALID_TYPE:' + field);
        }
      });

      var patch = {};

      PATCH_FIELDS.forEach(function (field) {
        if (
          Object.prototype.hasOwnProperty.call(
            plan.patch,
            field
          )
        ) {
          patch[field] = plan.patch[field];
        }
      });

      return {
        identity: identity,
        rowNumber: plan.rowNumber,
        patch: patch
      };
    }

    function uniqueHeaderMap_(headers) {
      var positions = {};

      headers.forEach(function (header, index) {
        if (typeof header !== 'string') {
          fail_('HEADER_INVALID_TYPE');
        }

        if (!positions[header]) {
          positions[header] = [];
        }

        positions[header].push(index);
      });

      REQUIRED_HEADERS.forEach(function (header) {
        if (!positions[header]) {
          fail_('REQUIRED_HEADER_MISSING:' + header);
        }

        if (positions[header].length !== 1) {
          fail_('REQUIRED_HEADER_AMBIGUOUS:' + header);
        }
      });

      var map = {};

      REQUIRED_HEADERS.forEach(function (header) {
        map[header] = positions[header][0];
      });

      return map;
    }

    function matchingRows_(
      sheet,
      lastRow,
      columnNumber,
      expected
    ) {
      if (lastRow < 2) {
        return [];
      }

      var values = sheet
        .getRange(
          2,
          columnNumber,
          lastRow - 1,
          1
        )
        .getValues();

      var rows = [];

      values.forEach(function (row, offset) {
        var value = row[0];

        if (
          typeof value === 'string' &&
          value.trim() === expected
        ) {
          rows.push(offset + 2);
        }
      });

      return rows;
    }

    function requireUniqueIdentityRow_(
      rows,
      field
    ) {
      if (rows.length === 0) {
        fail_('IDENTITY_NOT_FOUND:' + field);
      }

      if (rows.length !== 1) {
        fail_('IDENTITY_AMBIGUOUS:' + field);
      }

      return rows[0];
    }

    function prepare(plan) {
      var certified = validatePlan_(plan);

      if (
        typeof SpreadsheetApp === 'undefined' ||
        !SpreadsheetApp ||
        typeof SpreadsheetApp.getActiveSpreadsheet !==
          'function'
      ) {
        fail_('SPREADSHEET_APP_UNAVAILABLE');
      }

      var spreadsheet =
        SpreadsheetApp.getActiveSpreadsheet();

      if (!spreadsheet) {
        fail_('ACTIVE_SPREADSHEET_UNAVAILABLE');
      }

      var sheet =
        spreadsheet.getSheetByName(TARGET_TABLE);

      if (!sheet) {
        fail_('TARGET_SHEET_MISSING');
      }

      var spreadsheetId = spreadsheet.getId();
      var sheetId = sheet.getSheetId();
      var lastRow = Number(sheet.getLastRow());
      var lastColumn = Number(sheet.getLastColumn());
      var maxRows = Number(sheet.getMaxRows());
      var maxColumns = Number(sheet.getMaxColumns());

      if (
        typeof spreadsheetId !== 'string' ||
        spreadsheetId === ''
      ) {
        fail_('SPREADSHEET_ID_INVALID');
      }

      if (!Number.isInteger(sheetId)) {
        fail_('SHEET_ID_INVALID');
      }

      if (
        !Number.isInteger(lastRow) ||
        lastRow < 1 ||
        !Number.isInteger(lastColumn) ||
        lastColumn < 1 ||
        !Number.isInteger(maxRows) ||
        maxRows < lastRow ||
        !Number.isInteger(maxColumns) ||
        maxColumns < lastColumn
      ) {
        fail_('SHEET_GEOMETRY_INVALID');
      }

      var headers = sheet
        .getRange(1, 1, 1, lastColumn)
        .getValues()[0];

      if (
        !Array.isArray(headers) ||
        headers.length !== lastColumn
      ) {
        fail_('HEADER_READ_INCOMPLETE');
      }

      var headerMap = uniqueHeaderMap_(headers);

      var distressRows = matchingRows_(
        sheet,
        lastRow,
        headerMap['Distress Lead ID'] + 1,
        certified.identity['Distress Lead ID']
      );

      var canonicalRows = matchingRows_(
        sheet,
        lastRow,
        headerMap['Canonical Property Key'] + 1,
        certified.identity['Canonical Property Key']
      );

      var distressRow =
        requireUniqueIdentityRow_(
          distressRows,
          'Distress Lead ID'
        );

      var canonicalIdentityRow =
        requireUniqueIdentityRow_(
          canonicalRows,
          'Canonical Property Key'
        );

      if (distressRow !== canonicalIdentityRow) {
        fail_('DUAL_IDENTITY_ROW_MISMATCH');
      }

      if (distressRow !== certified.rowNumber) {
        fail_('PHASE1F_ROW_EVIDENCE_MISMATCH');
      }

      var rawRow = sheet
        .getRange(
          distressRow,
          1,
          1,
          lastColumn
        )
        .getValues()[0];

      var formulas = sheet
        .getRange(
          distressRow,
          1,
          1,
          lastColumn
        )
        .getFormulas()[0];

      if (
        !Array.isArray(rawRow) ||
        rawRow.length !== lastColumn
      ) {
        fail_('PHYSICAL_ROW_READ_INCOMPLETE');
      }

      if (
        !Array.isArray(formulas) ||
        formulas.length !== lastColumn
      ) {
        fail_('FORMULA_VECTOR_INCOMPLETE');
      }

      var canonicalRowValues = rawRow.map(canonicalValue_);

      FORMULA_TARGET_FIELDS.forEach(function (field) {
        var formula = formulas[headerMap[field]];

        if (
          typeof formula !== 'string' ||
          formula !== ''
        ) {
          fail_('TARGET_FORMULA_NOT_BLANK:' + field);
        }
      });

      return {
        ok: true,
        version: 1,
        targetTable: TARGET_TABLE,

        identity: {
          'Distress Lead ID':
            certified.identity['Distress Lead ID'],
          'Canonical Property Key':
            certified.identity['Canonical Property Key']
        },

        semanticPatch: certified.patch,

        expectedSpreadsheetId: spreadsheetId,
        expectedSheetName: TARGET_TABLE,
        expectedSheetId: sheetId,
        expectedRowNumber: distressRow,

        phase1fRowNumberEvidence:
          certified.rowNumber,

        expectedLastRow: lastRow,
        expectedLastColumn: lastColumn,
        expectedMaxRows: maxRows,
        expectedMaxColumns: maxColumns,

        expectedHeaders: headers.slice(),
        expectedRowValues: canonicalRowValues,
        expectedRowFormulas: formulas.slice(),

        persistenceExecutionAuthorized: false,
        databaseUpdateAuthorized: false,
        databaseInsertAuthorized: false,
        databaseUpsertAuthorized: false,
        dealCreationAuthorized: false,
        maoGenerationAuthorized: false,
        automaticOfferAuthorityGranted: false,

        schedulerAuthority: false,
        productionMutationAuthority: false
      };
    }

    return Object.freeze({
      prepare: prepare
    });
  }
));
