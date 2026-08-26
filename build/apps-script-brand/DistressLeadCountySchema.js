/**
 * REOS Enterprise - DISTRESS_LEADS County Schema Bridge
 *
 * Adds county-runtime persistence fields to the existing Enterprise
 * DISTRESS_LEADS table without changing Database.ensureTable behavior,
 * removing legacy columns, reordering columns, or rewriting existing rows.
 */
var REOS = REOS || {};

REOS.DistressLeadCountySchema = (function () {
  var TABLE = 'DISTRESS_LEADS';

  /*
   * Existing Enterprise CSVImportEngine schema.
   * The order of these fields is protected.
   */
  var BASE_HEADERS = [
    'Distress Lead ID',
    'Address',
    'City',
    'State',
    'Zip',
    'Owner Name',
    'Owner Mailing Address',
    'Distress Type',
    'Distress Score',
    'Estimated Value',
    'Estimated Repairs',
    'Suggested Offer',
    'Lead Source',
    'Status',
    'Notes',
    'Imported Deal ID',
    'Created At',
    'Updated At'
  ];

  /*
   * Additive fields required by the native county runtime and generated
   * county connector normalization contract.
   */
  var COUNTY_HEADERS = [
    'County',
    'Source',
    'Source Dataset',
    'Connector Run ID',
    'Parcel ID',
    'Source Record ID',
    'Source Record Key',
    'Source Observation Key',
    'Canonical Property Key',
    'Last Seen At',
    'Source Updated At',
    'Co-Owner Name',
    'Estimated Debt',
    'Assessment Value',
    'Year Built',
    'Land Acres',
    'Living Area',
    'Last Sale Date',
    'Last Sale Price',
    'Tax Delinquent Amount',
    'Tax Principal',
    'Tax Interest',
    'Tax Penalty',
    'Violation Amount',
    'Violation Number',
    'Violation Type',
    'Violation Status',
    'Vacancy Status',
    'Vacancy Rank',
    'Sheriff Auction ID',
    'Book/Writ',
    'Sale Type',
    'Sale Status',
    'Sale Date'
  ];

  function requiredHeaders() {
    return BASE_HEADERS.concat(COUNTY_HEADERS);
  }

  function normalizeHeader_(value) {
    return String(value || '').trim().toLowerCase();
  }

  function validateCurrentHeaders_(headers) {
    var seen = {};

    headers.forEach(function (header) {
      var value = String(header || '').trim();

      if (!value) {
        return;
      }

      var key = normalizeHeader_(value);

      if (seen[key]) {
        throw new Error(
          'DISTRESS_LEADS contains duplicate or conflicting headers: "' +
          seen[key] +
          '" and "' +
          value +
          '".'
        );
      }

      seen[key] = value;
    });

    requiredHeaders().forEach(function (required) {
      var key = normalizeHeader_(required);
      var existing = seen[key];

      if (existing && existing !== required) {
        throw new Error(
          'DISTRESS_LEADS header casing conflicts with required county ' +
          'schema: expected "' +
          required +
          '", found "' +
          existing +
          '".'
        );
      }
    });

    return true;
  }

  function inspect() {
    var headers = REOS.Database.getHeaders(TABLE);

    validateCurrentHeaders_(headers);

    var existing = {};

    headers.forEach(function (header) {
      if (header) {
        existing[header] = true;
      }
    });

    var missing = requiredHeaders().filter(function (header) {
      return !existing[header];
    });

    return {
      ok: missing.length === 0,
      table: TABLE,
      headers: headers.slice(),
      missingHeaders: missing,
      missingCount: missing.length,
      requiredCount: requiredHeaders().length
    };
  }

  function ensure() {
    if (
      !REOS.Database ||
      typeof REOS.Database.ensureTable !== 'function' ||
      typeof REOS.Database.getHeaders !== 'function' ||
      typeof REOS.Database.getSheet !== 'function'
    ) {
      throw new Error(
        'REOS.Database table/header APIs are required for ' +
        'DISTRESS_LEADS county schema migration.'
      );
    }

    /*
     * For a missing or completely empty table, ensureTable creates the
     * complete schema. For an existing table it intentionally does nothing
     * to the headers; missing county columns are appended below.
     */
    REOS.Database.ensureTable(
      TABLE,
      requiredHeaders()
    );

    var current = REOS.Database.getHeaders(TABLE);

    validateCurrentHeaders_(current);

    var existing = {};

    current.forEach(function (header) {
      if (header) {
        existing[header] = true;
      }
    });

    var missing = requiredHeaders().filter(function (header) {
      return !existing[header];
    });

    if (missing.length) {
      var sheet = REOS.Database.getSheet(TABLE);
      var startColumn = current.length + 1;
      var range = sheet.getRange(
        1,
        startColumn,
        1,
        missing.length
      );

      range.setValues([missing]);

      if (typeof range.setFontWeight === 'function') {
        range.setFontWeight('bold');
      }

      if (typeof range.setWrap === 'function') {
        range.setWrap(true);
      }

      if (typeof sheet.autoResizeColumns === 'function') {
        sheet.autoResizeColumns(
          startColumn,
          missing.length
        );
      }
    }

    return {
      ok: true,
      table: TABLE,
      addedHeaders: missing.slice(),
      addedCount: missing.length,
      headers: current.concat(missing),
      requiredCount: requiredHeaders().length
    };
  }

  return {
    tableName: function () {
      return TABLE;
    },

    baseHeaders: function () {
      return BASE_HEADERS.slice();
    },

    countyHeaders: function () {
      return COUNTY_HEADERS.slice();
    },

    requiredHeaders: requiredHeaders,
    inspect: inspect,
    ensure: ensure
  };
})();
