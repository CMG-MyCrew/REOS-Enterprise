/**
 * REOS Enterprise - Code Violation Collapse Full-Row Evidence
 *
 * Read-only forensic export for certified same-property
 * durable-identity duplicate groups.
 *
 * This module:
 * - reads DISTRESS_LEADS only
 * - scopes only PA-PHILADELPHIA / code_violations
 * - accepts explicit Distress Lead IDs
 * - returns complete persisted row values and physical row numbers
 *
 * It does NOT grant collapse, winner, delete, repair, migration,
 * scheduler, checkpoint, connector, or offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseFullRowEvidence = (function () {
  var TABLE = 'DISTRESS_LEADS';
  var CONNECTOR = 'PA-PHILADELPHIA';
  var DATASET = 'code_violations';
  var MAX_IDS = 46;

  function text_(value) {
    return String(
      value === undefined || value === null ? '' : value
    ).trim();
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
      });
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getHeaders !== 'function' ||
      typeof REOS.Database.getAll !== 'function'
    ) {
      throw new Error(
        'Read-only Database APIs are required.'
      );
    }

    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'Admin security authority is required.'
      );
    }
  }

  function exportEvidence(options) {
    requireDependencies_();
    REOS.Security.requireAdmin();

    options = options || {};

    var ids =
      normalizeIds_(options.distressLeadIds);

    if (!ids.length) {
      throw new Error(
        'At least one Distress Lead ID is required.'
      );
    }

    if (ids.length > MAX_IDS) {
      throw new Error(
        'Collapse full-row evidence is limited to ' +
        MAX_IDS +
        ' Distress Lead IDs.'
      );
    }

    var wanted = {};
    ids.forEach(function (id) {
      wanted[id] = true;
    });

    var headers =
      REOS.Database.getHeaders(TABLE);

    var rows =
      REOS.Database.getAll(TABLE);

    var evidence = [];

    rows.forEach(function (row) {
      var id =
        text_(row['Distress Lead ID']);

      if (!wanted[id]) {
        return;
      }

      if (
        text_(row.Source) !== CONNECTOR ||
        text_(row['Source Dataset']) !== DATASET
      ) {
        throw new Error(
          'Requested Distress Lead ID is outside certified scope: ' +
          id
        );
      }

      var values = {};

      headers.forEach(function (header) {
        values[header] =
          row[header] === undefined
            ? ''
            : row[header];
      });

      evidence.push({
        rowNumber:
          Number(row._rowNumber || 0),
        distressLeadId:
          id,
        values:
          values
      });
    });

    evidence.sort(function (a, b) {
      return a.rowNumber - b.rowNumber;
    });

    var found = {};

    evidence.forEach(function (entry) {
      found[entry.distressLeadId] = true;
    });

    var missingIds =
      ids.filter(function (id) {
        return !found[id];
      });

    return {
      ok: true,
      mode:
        'READ_ONLY_CODE_VIOLATION_COLLAPSE_FULL_ROW_EVIDENCE',

      table:
        TABLE,

      scope: {
        connectorId:
          CONNECTOR,
        dataset:
          DATASET
      },

      requestedIds:
        ids.slice(),

      requestedIdCount:
        ids.length,

      returnedRowCount:
        evidence.length,

      missingIds:
        missingIds,

      headers:
        headers.slice(),

      rows:
        evidence,

      productionDataMutationAuthorityGranted:
        false,

      collapseAuthorityGranted:
        false,

      winnerAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      connectorExecutionAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  return {
    exportEvidence:
      exportEvidence
  };
})();

function reosCountyCodeViolationCollapseFullRowEvidence(options) {
  return REOS
    .CountyCodeViolationCollapseFullRowEvidence
    .exportEvidence(options || {});
}
