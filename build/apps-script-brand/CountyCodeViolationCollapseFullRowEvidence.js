/**
 * REOS Enterprise - Code Violation Collapse Full-Row Evidence
 *
 * Read-only forensic export for the exact certified 22-group /
 * 46-row same-property durable-identity duplicate cohort.
 *
 * Caller-defined population authority is prohibited.
 *
 * Every certified row must match its preserved authority record
 * before any full-row evidence is returned.
 *
 * No collapse, winner, delete, repair, migration, scheduler,
 * checkpoint, connector, or offer authority is granted.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseFullRowEvidence = (function () {
  var TABLE = 'DISTRESS_LEADS';
  var CONNECTOR = 'PA-PHILADELPHIA';
  var DATASET = 'code_violations';

  var EXPECTED_GROUP_COUNT = 22;
  var EXPECTED_ROW_COUNT = 46;

  var EXPECTED_AUTHORITY_SHA256 =
    '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

  function text_(value) {
    return String(
      value === undefined || value === null ? '' : value
    ).trim();
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

    if (
      !REOS.CountyCodeViolationCollapseOnlyEvidenceAuthority ||
      typeof REOS.CountyCodeViolationCollapseOnlyEvidenceAuthority.records !==
        'function' ||
      typeof REOS.CountyCodeViolationCollapseOnlyEvidenceAuthority.metadata !==
        'function'
    ) {
      throw new Error(
        'Certified collapse-only evidence authority is required.'
      );
    }
  }

  function assertEqual_(actual, expected, label, id) {
    if (text_(actual) !== text_(expected)) {
      throw new Error(
        'Certified collapse cohort drift: ' +
        label +
        ' mismatch for ' +
        id
      );
    }
  }

  function exportEvidence(options) {
    requireDependencies_();
    REOS.Security.requireAdmin();

    options = options || {};

    if (
      Object.prototype.hasOwnProperty.call(
        options,
        'distressLeadIds'
      )
    ) {
      throw new Error(
        'Caller-defined Distress Lead ID authority is prohibited.'
      );
    }

    var authority =
      REOS.CountyCodeViolationCollapseOnlyEvidenceAuthority;

    var metadata =
      authority.metadata();

    var certified =
      authority.records();

    if (
      metadata.authoritySha256 !==
      EXPECTED_AUTHORITY_SHA256
    ) {
      throw new Error(
        'Certified collapse authority SHA mismatch.'
      );
    }

    if (
      metadata.groupCount !== EXPECTED_GROUP_COUNT ||
      metadata.rowCount !== EXPECTED_ROW_COUNT ||
      certified.length !== EXPECTED_ROW_COUNT
    ) {
      throw new Error(
        'Certified collapse authority population mismatch.'
      );
    }

    var certifiedById = {};
    var certifiedRows = {};
    var certifiedGroups = {};

    certified.forEach(function (record) {
      var id = text_(record.distressLeadId);
      var rowNumber = Number(record.rowNumber);
      var groupNumber = Number(record.groupNumber);

      if (
        !id ||
        !rowNumber ||
        certifiedById[id] ||
        certifiedRows[rowNumber]
      ) {
        throw new Error(
          'Certified collapse authority membership is invalid.'
        );
      }

      certifiedById[id] = record;
      certifiedRows[rowNumber] = true;
      certifiedGroups[groupNumber] = true;
    });

    if (
      Object.keys(certifiedById).length !==
        EXPECTED_ROW_COUNT ||
      Object.keys(certifiedRows).length !==
        EXPECTED_ROW_COUNT ||
      Object.keys(certifiedGroups).length !==
        EXPECTED_GROUP_COUNT
    ) {
      throw new Error(
        'Certified collapse authority uniqueness mismatch.'
      );
    }

    var headers =
      REOS.Database.getHeaders(TABLE);

    var rows =
      REOS.Database.getAll(TABLE);

    var evidence = [];
    var found = {};

    rows.forEach(function (row) {
      var id =
        text_(row['Distress Lead ID']);

      var expected =
        certifiedById[id];

      if (!expected) {
        return;
      }

      if (found[id]) {
        throw new Error(
          'Certified collapse cohort contains duplicate persisted Distress Lead ID: ' +
          id
        );
      }

      var rowNumber =
        Number(row._rowNumber || 0);

      if (
        rowNumber !== Number(expected.rowNumber)
      ) {
        throw new Error(
          'Certified collapse cohort drift: physical row mismatch for ' +
          id
        );
      }

      assertEqual_(
        row.Source,
        CONNECTOR,
        'Source',
        id
      );

      assertEqual_(
        row['Source Dataset'],
        DATASET,
        'Source Dataset',
        id
      );

      assertEqual_(
        row['Source Record ID'],
        expected.sourceRecordId,
        'Source Record ID',
        id
      );

      assertEqual_(
        row['Violation Number'],
        expected.violationNumber,
        'Violation Number',
        id
      );

      assertEqual_(
        row['Canonical Property Key'],
        expected.canonicalPropertyKey,
        'Canonical Property Key',
        id
      );

      assertEqual_(
        row['Source Observation Key'],
        expected.legacyObservationKey,
        'Source Observation Key',
        id
      );

      var values = {};

      headers.forEach(function (header) {
        values[header] =
          row[header] === undefined
            ? ''
            : row[header];
      });

      evidence.push({
        groupNumber:
          Number(expected.groupNumber),

        rowNumber:
          rowNumber,

        distressLeadId:
          id,

        proposedDurableKey:
          expected.proposedDurableKey,

        canonicalPropertyKey:
          expected.canonicalPropertyKey,

        values:
          values
      });

      found[id] = true;
    });

    var missingIds =
      certified
        .filter(function (record) {
          return !found[record.distressLeadId];
        })
        .map(function (record) {
          return record.distressLeadId;
        });

    if (missingIds.length) {
      throw new Error(
        'Certified collapse cohort is incomplete; missing ' +
        missingIds.length +
        ' Distress Lead ID(s).'
      );
    }

    if (evidence.length !== EXPECTED_ROW_COUNT) {
      throw new Error(
        'Certified collapse cohort returned unexpected row count.'
      );
    }

    evidence.sort(function (a, b) {
      return a.rowNumber - b.rowNumber;
    });

    return {
      ok: true,

      mode:
        'READ_ONLY_CERTIFIED_CODE_VIOLATION_COLLAPSE_FULL_ROW_EVIDENCE',

      table:
        TABLE,

      scope: {
        connectorId:
          CONNECTOR,
        dataset:
          DATASET
      },

      authoritySha256:
        metadata.authoritySha256,

      sourceEvidenceSha256:
        metadata.sourceEvidenceSha256,

      certifiedGroupCount:
        EXPECTED_GROUP_COUNT,

      certifiedRowCount:
        EXPECTED_ROW_COUNT,

      returnedRowCount:
        evidence.length,

      headers:
        headers.slice(),

      rows:
        evidence,

      productionDataMutationAuthorityGranted:
        false,

      collapseAuthorityGranted:
        false,

      winnerSelectionAuthorityGranted:
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

  return Object.freeze({
    exportEvidence:
      exportEvidence
  });
})();

function reosCountyCodeViolationCollapseFullRowEvidence(options) {
  return REOS
    .CountyCodeViolationCollapseFullRowEvidence
    .exportEvidence(options || {});
}
