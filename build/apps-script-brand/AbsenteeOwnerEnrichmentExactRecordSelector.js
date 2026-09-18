var REOS = REOS || {};

REOS.AbsenteeOwnerEnrichmentExactRecordSelector = (function () {
  'use strict';

  var TABLE = 'DISTRESS_LEADS';
  var DISTRESS_ID = 'Distress Lead ID';
  var CANONICAL_KEY = 'Canonical Property Key';
  var PHASE = 'absentee_owner_exact_record_evidence';

  function fail_(code, message) {
    return {
      ok: false,
      mode: 'READ_ONLY',
      phase: PHASE,
      code: code,
      message: message,
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

  function cleanString_(value) {
    return String(value == null ? '' : value).trim();
  }

  function validateInput_(options) {
    var input = options || {};
    var rowNumber = input.rowNumber;
    var identity = input.identity;

    if (
      typeof rowNumber !== 'number' ||
      !isFinite(rowNumber) ||
      Math.floor(rowNumber) !== rowNumber
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_ROW_NUMBER',
          'rowNumber must be a finite integer.'
        )
      };
    }

    if (!identity || typeof identity !== 'object' || Array.isArray(identity)) {
      return {
        ok: false,
        result: fail_(
          'INVALID_IDENTITY',
          'identity must be an object.'
        )
      };
    }

    var distressLeadId = cleanString_(identity[DISTRESS_ID]);
    var canonicalPropertyKey = cleanString_(identity[CANONICAL_KEY]);

    if (!distressLeadId) {
      return {
        ok: false,
        result: fail_(
          'MISSING_DISTRESS_LEAD_ID',
          'Expected persisted Distress Lead ID is required.'
        )
      };
    }

    if (!canonicalPropertyKey) {
      return {
        ok: false,
        result: fail_(
          'MISSING_CANONICAL_PROPERTY_KEY',
          'Expected persisted Canonical Property Key is required.'
        )
      };
    }

    return {
      ok: true,
      rowNumber: rowNumber,
      identity: {
        distressLeadId: distressLeadId,
        canonicalPropertyKey: canonicalPropertyKey
      }
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

  function recordFromRow_(headers, values) {
    var record = {};

    headers.forEach(function (header, index) {
      var key = cleanString_(header);

      if (key) {
        record[key] = values[index];
      }
    });

    return record;
  }

  function evidence_(rowNumber, identity, record) {
    return {
      ok: true,
      mode: 'READ_ONLY',
      phase: PHASE,
      target: {
        table: TABLE,
        rowNumber: rowNumber
      },
      identity: {
        'Distress Lead ID': identity.distressLeadId,
        'Canonical Property Key': identity.canonicalPropertyKey
      },
      record: record,
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

  function exactRecordEvidence(options) {
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
      typeof lastColumn !== 'number' ||
      !isFinite(lastColumn) ||
      lastRow < 1 ||
      lastColumn < 1
    ) {
      return fail_(
        'INVALID_SHEET_GEOMETRY',
        'DISTRESS_LEADS sheet geometry is invalid.'
      );
    }

    if (
      validated.rowNumber <= 1 ||
      validated.rowNumber > lastRow
    ) {
      return fail_(
        'ROW_NUMBER_OUT_OF_RANGE',
        'rowNumber does not identify a current DISTRESS_LEADS data row.'
      );
    }

    /*
     * Bounded physical read #1:
     * exactly the current header row.
     */
    var headers = sheet
      .getRange(1, 1, 1, lastColumn)
      .getValues()[0];

    var distressHeader = uniqueHeaderIndex_(headers, DISTRESS_ID);

    if (!distressHeader.ok) {
      return distressHeader.result;
    }

    var canonicalHeader = uniqueHeaderIndex_(headers, CANONICAL_KEY);

    if (!canonicalHeader.ok) {
      return canonicalHeader.result;
    }

    /*
     * Bounded physical read #2:
     * exactly one caller-specified target data row.
     */
    var values = sheet
      .getRange(validated.rowNumber, 1, 1, lastColumn)
      .getValues()[0];

    var persistedDistressLeadId =
      cleanString_(values[distressHeader.index]);

    var persistedCanonicalPropertyKey =
      cleanString_(values[canonicalHeader.index]);

    if (!persistedDistressLeadId) {
      return fail_(
        'BLANK_PERSISTED_DISTRESS_LEAD_ID',
        'Persisted Distress Lead ID is blank.'
      );
    }

    if (!persistedCanonicalPropertyKey) {
      return fail_(
        'BLANK_PERSISTED_CANONICAL_PROPERTY_KEY',
        'Persisted Canonical Property Key is blank.'
      );
    }

    if (
      persistedDistressLeadId !==
      validated.identity.distressLeadId
    ) {
      return fail_(
        'DISTRESS_LEAD_ID_MISMATCH',
        'Persisted Distress Lead ID does not match expected identity.'
      );
    }

    if (
      persistedCanonicalPropertyKey !==
      validated.identity.canonicalPropertyKey
    ) {
      return fail_(
        'CANONICAL_PROPERTY_KEY_MISMATCH',
        'Persisted Canonical Property Key does not match expected identity.'
      );
    }

    return evidence_(
      validated.rowNumber,
      {
        distressLeadId: persistedDistressLeadId,
        canonicalPropertyKey: persistedCanonicalPropertyKey
      },
      recordFromRow_(headers, values)
    );
  }

  return {
    exactRecordEvidence: exactRecordEvidence
  };
})();

function reosAbsenteeOwnerEnrichmentExactRecordEvidence(options) {
  return REOS
    .AbsenteeOwnerEnrichmentExactRecordSelector
    .exactRecordEvidence(options);
}
