(function (global) {
  'use strict';

  var REOS = global.REOS = global.REOS || {};

  REOS.AbsenteeOwnerEnrichmentExecutor = (function () {
    var TARGET_TABLE = 'DISTRESS_LEADS';

    var DISTRESS_ID = 'Distress Lead ID';
    var PROPERTY_KEY = 'Canonical Property Key';
    var OWNER_NAME = 'Owner Name';
    var OWNER_MAILING = 'Owner Mailing Address';
    var UPDATED_AT = 'Updated At';

    var SEMANTIC_FIELDS = [
      OWNER_NAME,
      OWNER_MAILING
    ];

    var REQUIRED_HEADERS = [
      DISTRESS_ID,
      PROPERTY_KEY,
      OWNER_NAME,
      OWNER_MAILING,
      UPDATED_AT
    ];

    var AUTHORITY_FIELDS = [
      'persistenceExecutionAuthorized',
      'databaseUpdateAuthorized',
      'databaseInsertAuthorized',
      'databaseUpsertAuthorized',
      'dealCreationAuthorized',
      'maoGenerationAuthorized',
      'automaticOfferAuthorityGranted',
      'schedulerAuthority',
      'productionMutationAuthority'
    ];

    var PRECONDITION =
      'ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED';

    var UNCERTAIN =
      'ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN';

    var VERIFIED =
      'ABSENTEE_OWNER_EXECUTION_VERIFIED';

    function executionError_(classification, code, cause) {
      var error = new Error(classification + ': ' + code);
      error.classification = classification;
      error.code = code;

      if (cause !== undefined && cause !== null) {
        error.cause = cause;
      }

      return error;
    }

    function precondition_(code, cause) {
      throw executionError_(PRECONDITION, code, cause);
    }

    function uncertain_(code, cause) {
      throw executionError_(UNCERTAIN, code, cause);
    }

    function own_(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key);
    }

    function isPlainObject_(value) {
      return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      );
    }

    function requiredString_(value, code) {
      if (typeof value !== 'string' || value.trim() === '') {
        precondition_(code);
      }

      return value.trim();
    }

    function requiredInteger_(value, code) {
      if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        Math.floor(value) !== value
      ) {
        precondition_(code);
      }

      return value;
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
          precondition_('PHYSICAL_VALUE_NON_FINITE_NUMBER');
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
          precondition_('PHYSICAL_VALUE_INVALID_DATE');
        }

        return {
          type: 'date',
          value: value.toISOString()
        };
      }

      precondition_('PHYSICAL_VALUE_UNSUPPORTED_TYPE');
    }

    function validateCanonicalValue_(value) {
      if (!isPlainObject_(value)) {
        precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
      }

      var keys = Object.keys(value).sort();

      if (value.type === 'blank') {
        if (keys.length !== 1 || keys[0] !== 'type') {
          precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
        }
        return;
      }

      if (value.type === 'string') {
        if (
          keys.length !== 2 ||
          keys[0] !== 'type' ||
          keys[1] !== 'value' ||
          typeof value.value !== 'string'
        ) {
          precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
        }
        return;
      }

      if (value.type === 'number') {
        if (
          keys.length !== 2 ||
          keys[0] !== 'type' ||
          keys[1] !== 'value' ||
          typeof value.value !== 'string' ||
          value.value.trim() === '' ||
          !Number.isFinite(Number(value.value))
        ) {
          precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
        }
        return;
      }

      if (value.type === 'boolean') {
        if (
          keys.length !== 2 ||
          keys[0] !== 'type' ||
          keys[1] !== 'value' ||
          typeof value.value !== 'boolean'
        ) {
          precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
        }
        return;
      }

      if (value.type === 'date') {
        if (
          keys.length !== 2 ||
          keys[0] !== 'type' ||
          keys[1] !== 'value' ||
          typeof value.value !== 'string'
        ) {
          precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
        }

        var parsed = new Date(value.value);

        if (
          !Number.isFinite(parsed.getTime()) ||
          parsed.toISOString() !== value.value
        ) {
          precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
        }
        return;
      }

      precondition_('EXPECTED_CANONICAL_VALUE_INVALID');
    }

    function arrayEqual_(left, right) {
      return JSON.stringify(left) === JSON.stringify(right);
    }

    function uniqueHeaderMap_(headers) {
      var positions = {};

      headers.forEach(function (header, index) {
        if (typeof header !== 'string') {
          precondition_('HEADER_INVALID_TYPE');
        }

        if (!positions[header]) {
          positions[header] = [];
        }

        positions[header].push(index);
      });

      REQUIRED_HEADERS.forEach(function (header) {
        var found = positions[header] || [];

        if (found.length === 0) {
          precondition_('REQUIRED_HEADER_MISSING:' + header);
        }

        if (found.length !== 1) {
          precondition_('REQUIRED_HEADER_AMBIGUOUS:' + header);
        }
      });

      return positions;
    }

    function validateRequest_(request) {
      if (!isPlainObject_(request)) {
        precondition_('PHASE1H_REQUEST_INVALID');
      }

      if (
        request.ok !== true ||
        request.version !== 1 ||
        request.targetTable !== TARGET_TABLE
      ) {
        precondition_('PHASE1H_REQUEST_NOT_CERTIFIED_SHAPE');
      }

      AUTHORITY_FIELDS.forEach(function (field) {
        if (!own_(request, field) || request[field] !== false) {
          precondition_('PHASE1H_AUTHORITY_INVALID:' + field);
        }
      });

      if (!isPlainObject_(request.identity)) {
        precondition_('IDENTITY_INVALID');
      }

      var identity = {};
      identity[DISTRESS_ID] = requiredString_(
        request.identity[DISTRESS_ID],
        'IDENTITY_INVALID:' + DISTRESS_ID
      );
      identity[PROPERTY_KEY] = requiredString_(
        request.identity[PROPERTY_KEY],
        'IDENTITY_INVALID:' + PROPERTY_KEY
      );

      if (!isPlainObject_(request.semanticPatch)) {
        precondition_('SEMANTIC_PATCH_INVALID');
      }

      var patchKeys = Object.keys(request.semanticPatch);

      if (patchKeys.length < 1 || patchKeys.length > 2) {
        precondition_('SEMANTIC_PATCH_INVALID');
      }

      var patch = {};

      patchKeys.forEach(function (field) {
        if (SEMANTIC_FIELDS.indexOf(field) === -1) {
          precondition_('PATCH_FIELD_NOT_ALLOWED:' + field);
        }

        patch[field] = request.semanticPatch[field];
      });

      requiredString_(
        request.expectedSpreadsheetId,
        'EXPECTED_SPREADSHEET_ID_INVALID'
      );

      if (request.expectedSheetName !== TARGET_TABLE) {
        precondition_('EXPECTED_SHEET_NAME_INVALID');
      }

      requiredInteger_(
        request.expectedSheetId,
        'EXPECTED_SHEET_ID_INVALID'
      );

      requiredInteger_(
        request.expectedRowNumber,
        'EXPECTED_ROW_NUMBER_INVALID'
      );

      requiredInteger_(
        request.phase1fRowNumberEvidence,
        'PHASE1F_ROW_EVIDENCE_INVALID'
      );

      if (
        request.expectedRowNumber !==
        request.phase1fRowNumberEvidence
      ) {
        precondition_('PHASE1F_ROW_EVIDENCE_MISMATCH');
      }

      [
        'expectedLastRow',
        'expectedLastColumn',
        'expectedMaxRows',
        'expectedMaxColumns'
      ].forEach(function (field) {
        requiredInteger_(
          request[field],
          field.toUpperCase() + '_INVALID'
        );
      });

      if (
        !Array.isArray(request.expectedHeaders) ||
        request.expectedHeaders.length !== request.expectedLastColumn
      ) {
        precondition_('EXPECTED_HEADERS_INVALID');
      }

      var expectedHeaderMap =
        uniqueHeaderMap_(request.expectedHeaders);

      if (
        !Array.isArray(request.expectedRowValues) ||
        request.expectedRowValues.length !== request.expectedLastColumn
      ) {
        precondition_('EXPECTED_ROW_VALUES_INVALID');
      }

      request.expectedRowValues.forEach(validateCanonicalValue_);

      if (
        !Array.isArray(request.expectedRowFormulas) ||
        request.expectedRowFormulas.length !== request.expectedLastColumn
      ) {
        precondition_('EXPECTED_ROW_FORMULAS_INVALID');
      }

      request.expectedRowFormulas.forEach(function (formula) {
        if (typeof formula !== 'string') {
          precondition_('EXPECTED_ROW_FORMULA_INVALID');
        }
      });

      [OWNER_NAME, OWNER_MAILING, UPDATED_AT].forEach(
        function (field) {
          var index = expectedHeaderMap[field][0];

          if (request.expectedRowFormulas[index] !== '') {
            precondition_('TARGET_FORMULA_NOT_BLANK:' + field);
          }
        }
      );

      return {
        request: request,
        identity: identity,
        patch: patch
      };
    }

    function capturePhysicalState_(request, identity) {
      var spreadsheet =
        SpreadsheetApp.getActiveSpreadsheet();

      if (
        !spreadsheet ||
        typeof spreadsheet.getId !== 'function'
      ) {
        precondition_('ACTIVE_SPREADSHEET_UNAVAILABLE');
      }

      if (spreadsheet.getId() !== request.expectedSpreadsheetId) {
        precondition_('SPREADSHEET_ID_DRIFT');
      }

      var sheet = spreadsheet.getSheetByName(TARGET_TABLE);

      if (!sheet) {
        precondition_('TARGET_SHEET_MISSING');
      }

      if (sheet.getSheetId() !== request.expectedSheetId) {
        precondition_('SHEET_ID_DRIFT');
      }

      if (
        sheet.getLastRow() !== request.expectedLastRow ||
        sheet.getLastColumn() !== request.expectedLastColumn ||
        sheet.getMaxRows() !== request.expectedMaxRows ||
        sheet.getMaxColumns() !== request.expectedMaxColumns
      ) {
        precondition_('SHEET_GEOMETRY_DRIFT');
      }

      var headers = sheet
        .getRange(1, 1, 1, request.expectedLastColumn)
        .getValues()[0];

      if (!arrayEqual_(headers, request.expectedHeaders)) {
        precondition_('HEADER_VECTOR_DRIFT');
      }

      var headerMap = uniqueHeaderMap_(headers);
      var dataRowCount = request.expectedLastRow - 1;

      var distressValues = sheet
        .getRange(
          2,
          headerMap[DISTRESS_ID][0] + 1,
          dataRowCount,
          1
        )
        .getValues();

      var propertyValues = sheet
        .getRange(
          2,
          headerMap[PROPERTY_KEY][0] + 1,
          dataRowCount,
          1
        )
        .getValues();

      var distressMatches = [];
      var propertyMatches = [];

      distressValues.forEach(function (row, index) {
        if (
          String(row[0]).trim() === identity[DISTRESS_ID]
        ) {
          distressMatches.push(index + 2);
        }
      });

      propertyValues.forEach(function (row, index) {
        if (
          String(row[0]).trim() === identity[PROPERTY_KEY]
        ) {
          propertyMatches.push(index + 2);
        }
      });

      if (distressMatches.length !== 1) {
        precondition_(
          distressMatches.length === 0
            ? 'IDENTITY_NOT_FOUND:' + DISTRESS_ID
            : 'IDENTITY_AMBIGUOUS:' + DISTRESS_ID
        );
      }

      if (propertyMatches.length !== 1) {
        precondition_(
          propertyMatches.length === 0
            ? 'IDENTITY_NOT_FOUND:' + PROPERTY_KEY
            : 'IDENTITY_AMBIGUOUS:' + PROPERTY_KEY
        );
      }

      if (distressMatches[0] !== propertyMatches[0]) {
        precondition_('DUAL_IDENTITY_ROW_MISMATCH');
      }

      if (distressMatches[0] !== request.expectedRowNumber) {
        precondition_('PHYSICAL_ROW_DRIFT');
      }

      var rowNumber = distressMatches[0];

      var rowRange = sheet.getRange(
        rowNumber,
        1,
        1,
        request.expectedLastColumn
      );

      return {
        spreadsheetId: spreadsheet.getId(),
        sheet: sheet,
        sheetId: sheet.getSheetId(),
        headers: headers,
        headerMap: headerMap,
        rowNumber: rowNumber,
        canonicalValues:
          rowRange.getValues()[0].map(canonicalValue_),
        formulas:
          rowRange.getFormulas()[0]
      };
    }

    function verifyPreimage_(certified, state) {
      var request = certified.request;

      if (
        !arrayEqual_(
          state.canonicalValues,
          request.expectedRowValues
        )
      ) {
        precondition_('PHYSICAL_ROW_VALUE_DRIFT');
      }

      if (
        !arrayEqual_(
          state.formulas,
          request.expectedRowFormulas
        )
      ) {
        precondition_('PHYSICAL_ROW_FORMULA_DRIFT');
      }

      [OWNER_NAME, OWNER_MAILING, UPDATED_AT].forEach(
        function (field) {
          var index = state.headerMap[field][0];

          if (state.formulas[index] !== '') {
            precondition_('TARGET_FORMULA_NOT_BLANK:' + field);
          }
        }
      );
    }

    function cloneCanonicalVector_(vector) {
      return vector.map(function (value) {
        var copy = {};

        Object.keys(value).forEach(function (key) {
          copy[key] = value[key];
        });

        return copy;
      });
    }

    function expectedPostimage_(
      certified,
      state,
      updatedAt
    ) {
      var values =
        cloneCanonicalVector_(
          certified.request.expectedRowValues
        );

      Object.keys(certified.patch).forEach(
        function (field) {
          values[state.headerMap[field][0]] =
            canonicalValue_(certified.patch[field]);
        }
      );

      values[state.headerMap[UPDATED_AT][0]] =
        canonicalValue_(updatedAt);

      return {
        values: values,
        formulas:
          certified.request.expectedRowFormulas.slice()
      };
    }

    function execute(request) {
      var certified = validateRequest_(request);

      if (
        !REOS.Database ||
        typeof REOS.Database.withScriptLockContext !== 'function' ||
        typeof REOS.Database.assertScriptLockContext !== 'function'
      ) {
        precondition_('DATABASE_LOCK_API_UNAVAILABLE');
      }

      var writeStarted = false;

      try {
        return REOS.Database.withScriptLockContext(
          function (lockContext) {
            REOS.Database.assertScriptLockContext(lockContext);

            var prestate =
              capturePhysicalState_(
                certified.request,
                certified.identity
              );

            verifyPreimage_(certified, prestate);

            var updatedAt = new Date();

            if (!Number.isFinite(updatedAt.getTime())) {
              precondition_('UPDATED_AT_INVALID');
            }

            var expectedPost =
              expectedPostimage_(
                certified,
                prestate,
                updatedAt
              );

            /*
             * Final definite no-write boundary.
             */
            REOS.Database.assertScriptLockContext(lockContext);

            var physicalWrites = [];

            Object.keys(certified.patch).forEach(
              function (field) {
                physicalWrites.push({
                  field: field,
                  column:
                    prestate.headerMap[field][0] + 1,
                  value: certified.patch[field]
                });
              }
            );

            physicalWrites.push({
              field: UPDATED_AT,
              column:
                prestate.headerMap[UPDATED_AT][0] + 1,
              value: updatedAt
            });

            physicalWrites.sort(function (left, right) {
              return left.column - right.column;
            });

            /*
             * Physical mutation order is certified-column order,
             * never semanticPatch insertion order.
             */
            physicalWrites.forEach(function (write) {
              /*
               * This assignment is the uncertain-outcome boundary:
               * it occurs immediately before write invocation.
               */
              writeStarted = true;

              prestate.sheet
                .getRange(
                  prestate.rowNumber,
                  write.column
                )
                .setValue(write.value);
            });

            /*
             * Required explicit flush while the caller-owned
             * lock context is still active.
             */
            SpreadsheetApp.flush();

            REOS.Database.assertScriptLockContext(lockContext);

            var poststate =
              capturePhysicalState_(
                certified.request,
                certified.identity
              );

            if (
              !arrayEqual_(
                poststate.canonicalValues,
                expectedPost.values
              ) ||
              !arrayEqual_(
                poststate.formulas,
                expectedPost.formulas
              )
            ) {
              uncertain_('POSTIMAGE_MISMATCH');
            }

            REOS.Database.assertScriptLockContext(lockContext);

            return {
              ok: true,
              version: 1,
              classification: VERIFIED,
              targetTable: TARGET_TABLE,
              spreadsheetId: poststate.spreadsheetId,
              sheetId: poststate.sheetId,
              sheetName: TARGET_TABLE,
              rowNumber: poststate.rowNumber,

              identity: {
                'Distress Lead ID':
                  certified.identity[DISTRESS_ID],
                'Canonical Property Key':
                  certified.identity[PROPERTY_KEY]
              },

              patchedHeaders:
                physicalWrites.map(function (write) {
                  return write.field;
                }),

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
        );
      } catch (error) {
        if (writeStarted) {
          if (
            error &&
            error.classification === UNCERTAIN
          ) {
            throw error;
          }

          uncertain_(
            'EXECUTION_FAILED_AFTER_FIRST_WRITE',
            error
          );
        }

        if (
          error &&
          error.classification === PRECONDITION
        ) {
          throw error;
        }

        precondition_(
          'EXECUTION_PRECONDITION_FAILED',
          error
        );
      }
    }

    return {
      execute: execute
    };
  }());
}(globalThis));
