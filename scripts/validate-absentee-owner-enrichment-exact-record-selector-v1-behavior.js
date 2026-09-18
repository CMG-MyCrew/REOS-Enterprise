'use strict';

const fs = require('fs');
const vm = require('vm');

const implementationPath =
  'build/apps-script-brand/AbsenteeOwnerEnrichmentExactRecordSelector.js';

const source = fs.readFileSync(implementationPath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeHarness(config) {
  config = config || {};

  const headers = config.headers || [
    'Distress Lead ID',
    'Canonical Property Key',
    'Owner Name',
    'Owner Mailing Address',
    'Updated At'
  ];

  const row = config.row || [
    'DL-100',
    'CPK-100',
    '',
    '',
    new Date('2026-09-18T12:00:00Z')
  ];

  const lastRow =
    Object.prototype.hasOwnProperty.call(config, 'lastRow')
      ? config.lastRow
      : 25;

  const lastColumn =
    Object.prototype.hasOwnProperty.call(config, 'lastColumn')
      ? config.lastColumn
      : headers.length;

  const rangeReads = [];
  const writes = [];
  let adminCalls = 0;
  let sheetLookups = 0;

  const sheet = {
    getLastRow: function () {
      return lastRow;
    },

    getLastColumn: function () {
      return lastColumn;
    },

    getRange: function (r, c, nr, nc) {
      rangeReads.push({
        row: r,
        column: c,
        numRows: nr,
        numColumns: nc
      });

      return {
        getValues: function () {
          if (r === 1) {
            return [headers.slice()];
          }

          return [row.slice()];
        },

        setValue: function () {
          writes.push('setValue');
        },

        setValues: function () {
          writes.push('setValues');
        }
      };
    }
  };

  const spreadsheet = {
    getSheetByName: function (name) {
      sheetLookups += 1;

      if (config.missingSheet) {
        return null;
      }

      assert(
        name === 'DISTRESS_LEADS',
        'Unexpected sheet requested: ' + name
      );

      return sheet;
    }
  };

  const context = {
    console: console,
    Date: Date,
    JSON: JSON,
    Math: Math,
    isFinite: isFinite,

    REOS: {
      Security: {
        requireAdmin: function () {
          adminCalls += 1;

          if (config.rejectAdmin) {
            throw new Error('ADMIN_REJECTED');
          }
        }
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet: function () {
        if (config.missingSpreadsheet) {
          return null;
        }

        return spreadsheet;
      },

      flush: function () {
        writes.push('flush');
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  return {
    context: context,
    rangeReads: rangeReads,
    writes: writes,
    adminCalls: function () {
      return adminCalls;
    },
    sheetLookups: function () {
      return sheetLookups;
    }
  };
}

function invoke(harness, options) {
  return harness
    .context
    .reosAbsenteeOwnerEnrichmentExactRecordEvidence(options);
}

function validOptions() {
  return {
    rowNumber: 7,
    identity: {
      'Distress Lead ID': 'DL-100',
      'Canonical Property Key': 'CPK-100'
    }
  };
}

let cases = 0;

function test(name, fn) {
  fn();
  cases += 1;
  console.log('PASS ' + name);
}

test('successful exact persisted dual identity', function () {
  const h = makeHarness();
  const result = invoke(h, validOptions());

  assert(result.ok === true, 'Expected success.');
  assert(result.mode === 'READ_ONLY', 'Expected READ_ONLY.');
  assert(
    result.target.table === 'DISTRESS_LEADS',
    'Unexpected table.'
  );
  assert(result.target.rowNumber === 7, 'Unexpected row number.');
  assert(
    result.identity['Distress Lead ID'] === 'DL-100',
    'Distress Lead ID not preserved.'
  );
  assert(
    result.identity['Canonical Property Key'] === 'CPK-100',
    'Canonical Property Key not preserved.'
  );
  assert(
    result.record['Distress Lead ID'] === 'DL-100',
    'Complete row evidence missing distress ID.'
  );
  assert(
    result.record['Canonical Property Key'] === 'CPK-100',
    'Complete row evidence missing canonical key.'
  );

  assert(h.adminCalls() === 1, 'Admin must be required once.');
  assert(h.sheetLookups() === 1, 'Expected one sheet lookup.');
  assert(h.rangeReads.length === 2, 'Expected exactly two reads.');

  assert(
    JSON.stringify(h.rangeReads[0]) ===
      JSON.stringify({
        row: 1,
        column: 1,
        numRows: 1,
        numColumns: 5
      }),
    'Header read boundary incorrect.'
  );

  assert(
    JSON.stringify(h.rangeReads[1]) ===
      JSON.stringify({
        row: 7,
        column: 1,
        numRows: 1,
        numColumns: 5
      }),
    'Target read boundary incorrect.'
  );

  assert(h.writes.length === 0, 'No writes permitted.');

  [
    'productionDataMutationAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(function (key) {
    assert(result[key] === false, key + ' must be false.');
  });
});

test('admin rejection occurs before spreadsheet read', function () {
  const h = makeHarness({ rejectAdmin: true });
  let threw = false;

  try {
    invoke(h, validOptions());
  } catch (error) {
    threw = true;
    assert(
      String(error.message) === 'ADMIN_REJECTED',
      'Unexpected admin error.'
    );
  }

  assert(threw, 'Expected admin rejection.');
  assert(h.rangeReads.length === 0, 'Read occurred before admin.');
  assert(h.sheetLookups() === 0, 'Sheet lookup occurred before admin.');
  assert(h.writes.length === 0, 'Write occurred.');
});

test('invalid row type fails before physical range read', function () {
  const h = makeHarness();
  const options = validOptions();
  options.rowNumber = '7';

  const result = invoke(h, options);

  assert(result.ok === false, 'Expected failure.');
  assert(result.code === 'INVALID_ROW_NUMBER', 'Wrong failure.');
  assert(h.rangeReads.length === 0, 'Unexpected range read.');
  assert(h.writes.length === 0, 'Unexpected write.');
});

test('row zero fails before physical range read', function () {
  const h = makeHarness();
  const options = validOptions();
  options.rowNumber = 0;

  const result = invoke(h, options);

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'ROW_NUMBER_OUT_OF_RANGE',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 0, 'Unexpected range read.');
});

test('row beyond last row fails before physical range read', function () {
  const h = makeHarness({ lastRow: 6 });
  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'ROW_NUMBER_OUT_OF_RANGE',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 0, 'Unexpected range read.');
});

test('missing expected distress id fails before sheet read', function () {
  const h = makeHarness();
  const options = validOptions();
  options.identity['Distress Lead ID'] = '';

  const result = invoke(h, options);

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'MISSING_DISTRESS_LEAD_ID',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 0, 'Unexpected range read.');
});

test('missing expected canonical key fails before sheet read', function () {
  const h = makeHarness();
  const options = validOptions();
  options.identity['Canonical Property Key'] = '';

  const result = invoke(h, options);

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'MISSING_CANONICAL_PROPERTY_KEY',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 0, 'Unexpected range read.');
});

test('missing required header fails after header read only', function () {
  const h = makeHarness({
    headers: [
      'Distress Lead ID',
      'Owner Name',
      'Owner Mailing Address'
    ],
    row: ['DL-100', '', '']
  });

  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'MISSING_REQUIRED_HEADER',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 1, 'Only header may be read.');
  assert(h.rangeReads[0].numRows === 1, 'Header read not bounded.');
});

test('duplicate required header fails after header read only', function () {
  const h = makeHarness({
    headers: [
      'Distress Lead ID',
      'Canonical Property Key',
      'Canonical Property Key'
    ],
    row: ['DL-100', 'CPK-100', 'CPK-100']
  });

  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'DUPLICATE_REQUIRED_HEADER',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 1, 'Only header may be read.');
});

test('blank persisted distress id fails closed', function () {
  const h = makeHarness({
    row: ['', 'CPK-100', '', '', '']
  });

  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'BLANK_PERSISTED_DISTRESS_LEAD_ID',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 2, 'Unexpected read count.');
  assert(h.writes.length === 0, 'Unexpected write.');
});

test('blank persisted canonical key fails closed', function () {
  const h = makeHarness({
    row: ['DL-100', '', '', '', '']
  });

  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'BLANK_PERSISTED_CANONICAL_PROPERTY_KEY',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 2, 'Unexpected read count.');
  assert(h.writes.length === 0, 'Unexpected write.');
});

test('distress id mismatch does not scan another row', function () {
  const h = makeHarness({
    row: ['DL-OTHER', 'CPK-100', '', '', '']
  });

  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'DISTRESS_LEAD_ID_MISMATCH',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 2, 'Fallback scan detected.');
});

test('canonical key mismatch does not scan another row', function () {
  const h = makeHarness({
    row: ['DL-100', 'CPK-OTHER', '', '', '']
  });

  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'CANONICAL_PROPERTY_KEY_MISMATCH',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 2, 'Fallback scan detected.');
});

test('missing spreadsheet fails without range read', function () {
  const h = makeHarness({ missingSpreadsheet: true });
  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'ACTIVE_SPREADSHEET_UNAVAILABLE',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 0, 'Unexpected range read.');
});

test('missing sheet fails without range read', function () {
  const h = makeHarness({ missingSheet: true });
  const result = invoke(h, validOptions());

  assert(result.ok === false, 'Expected failure.');
  assert(
    result.code === 'DISTRESS_LEADS_SHEET_MISSING',
    'Wrong failure.'
  );
  assert(h.rangeReads.length === 0, 'Unexpected range read.');
});

console.log(
  'ABSENTEE_OWNER_EXACT_SELECTOR_BEHAVIOR_VALIDATION_OK'
);
console.log('BEHAVIOR_CASES=' + cases);
console.log('SUCCESS_PHYSICAL_READ_COUNT=2');
console.log('SUCCESS_HEADER_READ_HEIGHT=1');
console.log('SUCCESS_TARGET_READ_HEIGHT=1');
console.log('FALLBACK_SCAN_OBSERVED=false');
console.log('WRITE_COUNT=0');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('CANONICAL_IDENTITY_REPAIR_AUTHORITY=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('CERTIFICATION_MUTATION_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
