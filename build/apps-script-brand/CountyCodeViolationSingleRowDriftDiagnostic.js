/**
 * REOS Enterprise - Code Violation Single-Row Drift Diagnostic
 *
 * Read-only forensic diagnostic for exactly one certified failing
 * DISTRESS_LEADS record.
 *
 * No caller-defined population authority.
 * No repair, migration, collapse, winner, delete, connector,
 * checkpoint, scheduler, or offer authority is granted.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationSingleRowDriftDiagnostic = (function () {
  var TABLE = 'DISTRESS_LEADS';

  var TARGET_ID =
    'DL-20260820181640-2063';

  var EXPECTED_ROW_NUMBER = 764;

  function text_(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).trim();
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
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

  function read(options) {
    requireDependencies_();
    REOS.Security.requireAdmin();

    options = options || {};

    if (Object.keys(options).length !== 0) {
      throw new Error(
        'Caller-defined diagnostic authority is prohibited.'
      );
    }

    var rows =
      REOS.Database.getAll(TABLE);

    var matches =
      rows.filter(function (row) {
        return (
          text_(row['Distress Lead ID']) ===
          TARGET_ID
        );
      });

    if (matches.length !== 1) {
      throw new Error(
        'Expected exactly one persisted target row; found ' +
        matches.length
      );
    }

    var row = matches[0];

    var rowNumber =
      Number(row._rowNumber || 0);

    if (rowNumber !== EXPECTED_ROW_NUMBER) {
      throw new Error(
        'Target physical row drift: expected ' +
        EXPECTED_ROW_NUMBER +
        ', found ' +
        rowNumber
      );
    }

    return {
      ok: true,
      mode: 'READ_ONLY',
      table: TABLE,

      target: {
        rowNumber:
          rowNumber,

        distressLeadId:
          text_(row['Distress Lead ID']),

        source:
          text_(row.Source),

        sourceDataset:
          text_(row['Source Dataset']),

        sourceRecordId:
          text_(row['Source Record ID']),

        violationNumber:
          text_(row['Violation Number']),

        parcelId:
          text_(row['Parcel ID']),

        sourceRecordKey:
          text_(row['Source Record Key']),

        sourceObservationKey:
          text_(row['Source Observation Key']),

        canonicalPropertyKey:
          text_(row['Canonical Property Key'])
      },

      repairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      collapseAuthorityGranted:
        false,

      winnerAuthorityGranted:
        false,

      deleteAuthorityGranted:
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
    read: read
  });
})();

function reosCountyCodeViolationSingleRowDriftDiagnostic(options) {
  return REOS
    .CountyCodeViolationSingleRowDriftDiagnostic
    .read(options || {});
}
