var REOS = REOS || {};

REOS.CountyCodeViolationTwoRowRawEvidence = (function () {
  var TABLE = 'DISTRESS_LEADS';

  var TARGETS = [
    { rowNumber: 764, distressLeadId: 'DL-20260820181640-2063' },
    { rowNumber: 768, distressLeadId: 'DL-20260820181649-9792' }
  ];

  var REQUIRED_HEADERS = [
    'Distress Lead ID',
    'Source',
    'Source Dataset',
    'Source Record ID',
    'Violation Number',
    'Parcel ID',
    'Source Record Key',
    'Source Observation Key',
    'Canonical Property Key',
    'Address',
    'City',
    'State',
    'Zip',
    'County'
  ];

  function text_(value) {
    return String(
      value === undefined || value === null ? '' : value
    ).trim();
  }

  function requireDependencies_() {
    if (!REOS.Database || typeof REOS.Database.getSheet !== 'function') {
      throw new Error('Read-only physical-sheet access is required.');
    }

    if (!REOS.Security || typeof REOS.Security.requireAdmin !== 'function') {
      throw new Error('Admin security authority is required.');
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity.resolve !== 'function'
    ) {
      throw new Error('Canonical identity resolver is required.');
    }

    if (
      typeof ScriptApp === 'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !== 'function'
    ) {
      throw new Error('Trigger inventory authority is required.');
    }
  }

  function requireFrozenCountyScheduler_() {
    var count = ScriptApp.getProjectTriggers().filter(function (trigger) {
      return (
        trigger &&
        typeof trigger.getHandlerFunction === 'function' &&
        trigger.getHandlerFunction() === 'reosCountyProductionSchedulerRun'
      );
    }).length;

    if (count !== 0) {
      throw new Error(
        'Two-row raw evidence requires zero managed county scheduler triggers.'
      );
    }
  }

  function bindHeaders_(headers) {
    return REQUIRED_HEADERS.map(function (requiredHeader) {
      var matches = [];

      headers.forEach(function (header, index) {
        if (text_(header) === requiredHeader) {
          matches.push(index);
        }
      });

      if (matches.length !== 1) {
        throw new Error(
          'Required header must occur exactly once: ' +
          requiredHeader +
          '; found ' +
          matches.length
        );
      }

      return {
        header: requiredHeader,
        columnNumber: matches[0] + 1,
        rawHeaderValue: headers[matches[0]]
      };
    });
  }

  function rowRecord_(headers, values, rowNumber) {
    var record = { _rowNumber: rowNumber };

    headers.forEach(function (header, index) {
      if (text_(header)) {
        record[text_(header)] = values[index];
      }
    });

    return record;
  }

  function readTarget_(sheet, headers, bindings, target) {
    var range = sheet.getRange(target.rowNumber, 1, 1, headers.length);
    var values = range.getValues()[0];
    var displayValues = range.getDisplayValues()[0];
    var indexes = {};

    bindings.forEach(function (binding) {
      indexes[binding.header] = binding.columnNumber - 1;
    });

    if (
      text_(values[indexes['Distress Lead ID']]) !== target.distressLeadId
    ) {
      throw new Error(
        'Target physical row does not contain its certified Distress Lead ID: row ' +
        target.rowNumber
      );
    }

    var identity = REOS.CanonicalPropertyIdentity.resolve(
      rowRecord_(headers, values, target.rowNumber)
    );

    return {
      rowNumber: target.rowNumber,
      distressLeadId: target.distressLeadId,
      rawCells: bindings.map(function (binding) {
        var index = binding.columnNumber - 1;

        return {
          header: binding.header,
          columnNumber: binding.columnNumber,
          rawValue: values[index],
          displayValue: displayValues[index]
        };
      }),
      derivedIdentity: {
        sourceObservationKey: text_(identity.sourceObservationKey),
        canonicalPropertyKey: text_(identity.canonicalPropertyKey)
      }
    };
  }

  function read(options) {
    requireDependencies_();
    REOS.Security.requireAdmin();

    options = options || {};

    if (
      typeof options !== 'object' ||
      Array.isArray(options) ||
      Object.keys(options).length !== 0
    ) {
      throw new Error('Caller-defined diagnostic authority is prohibited.');
    }

    requireFrozenCountyScheduler_();

    var sheet = REOS.Database.getSheet(TABLE);
    var lastColumn = Math.max(Number(sheet.getLastColumn() || 0), 1);
    var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    var bindings = bindHeaders_(headers);
    var rows = TARGETS.map(function (target) {
      return readTarget_(sheet, headers, bindings, target);
    });

    requireFrozenCountyScheduler_();

    return {
      ok: true,
      mode: 'READ_ONLY_TWO_ROW_RAW_EVIDENCE',
      table: TABLE,
      headerCount: headers.length,
      requiredHeaderBindings: bindings,
      rows: rows,
      comparisons: {
        sameDerivedSourceObservationKey:
          rows[0].derivedIdentity.sourceObservationKey ===
          rows[1].derivedIdentity.sourceObservationKey,
        sameDerivedCanonicalPropertyKey:
          rows[0].derivedIdentity.canonicalPropertyKey ===
          rows[1].derivedIdentity.canonicalPropertyKey
      },
      productionDataMutationAuthorityGranted: false,
      repairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      collapseAuthorityGranted: false,
      winnerSelectionAuthorityGranted: false,
      deleteAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      checkpointMutationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  return Object.freeze({ read: read });
})();

function reosCountyCodeViolationTwoRowRawEvidence(options) {
  return REOS.CountyCodeViolationTwoRowRawEvidence.read(options || {});
}
