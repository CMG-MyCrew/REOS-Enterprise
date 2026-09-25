#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerEnrichmentCandidateDiscovery.js'
);

const source = fs.readFileSync(FILE, 'utf8');

function rowFromObject(headers, value) {
  return headers.map(header =>
    Object.prototype.hasOwnProperty.call(value, header)
      ? value[header]
      : ''
  );
}

function createHarness(options) {
  const config = Object.assign({
    adminDenied: false,
    activeSpreadsheet: true,
    sheetPresent: true,
    headers: [
      'Distress Lead ID',
      'Other Field',
      'Canonical Property Key'
    ],
    lastRow: 10,
    lastColumn: null,
    rows: {}
  }, options || {});

  const state = {
    adminCalls: 0,
    spreadsheetCalls: 0,
    sheetLookups: [],
    rangeCalls: [],
    getValuesCalls: 0,
    mutationCalls: 0,
    flushCalls: 0
  };

  const lastColumn = config.lastColumn == null
    ? config.headers.length
    : config.lastColumn;

  function valuesForRange(row, column, numRows, numColumns) {
    const output = [];

    for (let offset = 0; offset < numRows; offset++) {
      const physicalRow = row + offset;
      let sourceRow;

      if (physicalRow === 1) {
        sourceRow = config.headers.slice();
      } else {
        sourceRow = (config.rows[physicalRow] || []).slice();
      }

      while (sourceRow.length < lastColumn) {
        sourceRow.push('');
      }

      const selected = sourceRow.slice(
        column - 1,
        column - 1 + numColumns
      );

      while (selected.length < numColumns) {
        selected.push('');
      }

      output.push(selected);
    }

    return output;
  }

  const sheet = {
    getLastRow() {
      return config.lastRow;
    },

    getLastColumn() {
      return lastColumn;
    },

    getRange(row, column, numRows, numColumns) {
      state.rangeCalls.push({
        row,
        column,
        numRows,
        numColumns
      });

      return {
        getValues() {
          state.getValuesCalls++;
          return valuesForRange(
            row,
            column,
            numRows,
            numColumns
          );
        },

        setValue() {
          state.mutationCalls++;
        },

        setValues() {
          state.mutationCalls++;
        }
      };
    },

    appendRow() {
      state.mutationCalls++;
    },

    deleteRow() {
      state.mutationCalls++;
    }
  };

  const spreadsheet = {
    getSheetByName(name) {
      state.sheetLookups.push(name);

      if (!config.sheetPresent) {
        return null;
      }

      return sheet;
    }
  };

  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    Date,
    Error,
    RegExp,
    Set,
    Map,
    Infinity,
    NaN,
    isFinite
  };

  context.REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls++;

        if (config.adminDenied) {
          throw new Error('ADMIN_DENIED');
        }
      }
    }
  };

  context.SpreadsheetApp = {
    getActiveSpreadsheet() {
      state.spreadsheetCalls++;

      if (!config.activeSpreadsheet) {
        return null;
      }

      return spreadsheet;
    },

    flush() {
      state.flushCalls++;
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  return {
    context,
    state,
    call(input) {
      return context
        .reosAbsenteeOwnerEnrichmentCandidateDiscovery(input);
    }
  };
}

function expectThrow(fn, pattern) {
  let thrown = null;

  try {
    fn();
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, 'expected function to throw');

  if (pattern) {
    assert.match(String(thrown.message || thrown), pattern);
  }
}

function assertAuthorityFalse(result) {
  [
    'productionDataMutationAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(key => {
    assert.strictEqual(
      result[key],
      false,
      key + ' must remain false'
    );
  });
}

let count = 0;

function test(name, fn) {
  fn();
  count++;
  console.log('PASS ' + count + ': ' + name);
}

test(
  'admin denial occurs before spreadsheet access',
  () => {
    const h = createHarness({adminDenied: true});

    expectThrow(
      () => h.call({startRow: 2, maxRows: 1}),
      /ADMIN_DENIED/
    );

    assert.equal(h.state.adminCalls, 1);
    assert.equal(h.state.spreadsheetCalls, 0);
    assert.equal(h.state.rangeCalls.length, 0);
  }
);

test(
  'missing options fail before spreadsheet access',
  () => {
    const h = createHarness();
    const out = h.call();

    assert.equal(out.ok, false);
    assert.equal(out.code, 'INVALID_OPTIONS');
    assert.equal(h.state.spreadsheetCalls, 0);
    assertAuthorityFalse(out);
  }
);

test(
  'unexpected options fail before spreadsheet access',
  () => {
    const h = createHarness();

    const out = h.call({
      startRow: 2,
      maxRows: 1,
      query: 'scan-all'
    });

    assert.equal(out.ok, false);
    assert.equal(out.code, 'UNEXPECTED_OPTIONS');
    assert.equal(h.state.spreadsheetCalls, 0);
  }
);

test(
  'startRow below data-row minimum fails closed',
  () => {
    const h = createHarness();
    const out = h.call({startRow: 1, maxRows: 1});

    assert.equal(out.ok, false);
    assert.equal(out.code, 'INVALID_START_ROW');
    assert.equal(h.state.spreadsheetCalls, 0);
  }
);

test(
  'maxRows above hard limit fails closed',
  () => {
    const h = createHarness();
    const out = h.call({startRow: 2, maxRows: 51});

    assert.equal(out.ok, false);
    assert.equal(out.code, 'INVALID_MAX_ROWS');
    assert.equal(h.state.spreadsheetCalls, 0);
  }
);

test(
  'missing active spreadsheet fails closed',
  () => {
    const h = createHarness({activeSpreadsheet: false});
    const out = h.call({startRow: 2, maxRows: 1});

    assert.equal(out.ok, false);
    assert.equal(out.code, 'ACTIVE_SPREADSHEET_UNAVAILABLE');
    assert.equal(h.state.rangeCalls.length, 0);
    assertAuthorityFalse(out);
  }
);

test(
  'missing DISTRESS_LEADS sheet fails closed',
  () => {
    const h = createHarness({sheetPresent: false});
    const out = h.call({startRow: 2, maxRows: 1});

    assert.equal(out.ok, false);
    assert.equal(out.code, 'DISTRESS_LEADS_SHEET_MISSING');
    assert.deepEqual(h.state.sheetLookups, ['DISTRESS_LEADS']);
    assert.equal(h.state.rangeCalls.length, 0);
  }
);

test(
  'invalid sheet geometry fails before range reads',
  () => {
    const h = createHarness({lastRow: 0});
    const out = h.call({startRow: 2, maxRows: 1});

    assert.equal(out.ok, false);
    assert.equal(out.code, 'INVALID_SHEET_GEOMETRY');
    assert.equal(h.state.rangeCalls.length, 0);
  }
);

test(
  'missing required identity header fails closed',
  () => {
    const h = createHarness({
      headers: [
        'Distress Lead ID',
        'Other Field'
      ],
      lastColumn: 2
    });

    const out = h.call({startRow: 2, maxRows: 1});

    assert.equal(out.ok, false);
    assert.equal(out.code, 'MISSING_REQUIRED_HEADER');
    assert.equal(h.state.rangeCalls.length, 1);
  }
);

test(
  'duplicate required identity header fails closed',
  () => {
    const h = createHarness({
      headers: [
        'Distress Lead ID',
        'Canonical Property Key',
        'Canonical Property Key'
      ]
    });

    const out = h.call({startRow: 2, maxRows: 1});

    assert.equal(out.ok, false);
    assert.equal(out.code, 'DUPLICATE_REQUIRED_HEADER');
    assert.equal(h.state.rangeCalls.length, 1);
  }
);

test(
  'future startRow returns exhausted without candidate data read',
  () => {
    const h = createHarness({lastRow: 5});
    const out = h.call({startRow: 9, maxRows: 50});

    assert.equal(out.ok, true);
    assert.equal(out.rowsInspected, 0);
    assert.equal(out.candidateCount, 0);
    assert.equal(out.exhausted, true);
    assert.equal(out.nextStartRow, null);

    assert.equal(h.state.rangeCalls.length, 1);
    assert.deepEqual(
      h.state.rangeCalls[0],
      {row: 1, column: 1, numRows: 1, numColumns: 3}
    );

    assertAuthorityFalse(out);
  }
);

test(
  'hard 50-row window is physically bounded',
  () => {
    const h = createHarness({lastRow: 100});
    const out = h.call({startRow: 2, maxRows: 50});

    assert.equal(out.ok, true);
    assert.equal(out.rowsInspected, 50);
    assert.equal(out.exhausted, false);
    assert.equal(out.nextStartRow, 52);

    assert.equal(h.state.rangeCalls.length, 3);

    const dataReads = h.state.rangeCalls.slice(1);

    dataReads.forEach(call => {
      assert.equal(call.row, 2);
      assert.equal(call.numRows, 50);
      assert.equal(call.numColumns, 1);
    });

    assert.equal(h.state.getValuesCalls, 3);
    assert.equal(h.state.mutationCalls, 0);
    assert.equal(h.state.flushCalls, 0);
  }
);

test(
  'only rows with both persisted identity values become candidates',
  () => {
    const headers = [
      'Distress Lead ID',
      'Other Field',
      'Canonical Property Key'
    ];

    const h = createHarness({
      headers,
      lastRow: 5,
      rows: {
        2: rowFromObject(headers, {
          'Distress Lead ID': 'DL-2',
          'Other Field': 'ignore me',
          'Canonical Property Key': 'property|2'
        }),
        3: rowFromObject(headers, {
          'Distress Lead ID': 'DL-3',
          'Canonical Property Key': ''
        }),
        4: rowFromObject(headers, {
          'Distress Lead ID': '',
          'Canonical Property Key': 'property|4'
        }),
        5: rowFromObject(headers, {
          'Distress Lead ID': '  DL-5  ',
          'Canonical Property Key': '  property|5  '
        })
      }
    });

    const out = h.call({startRow: 2, maxRows: 4});

    assert.equal(out.ok, true);
    assert.equal(out.rowsInspected, 4);
    assert.equal(out.candidateCount, 2);
    assert.equal(out.exhausted, true);
    assert.equal(out.nextStartRow, null);

    assert.deepEqual(
      JSON.parse(JSON.stringify(out.candidates)),
      [
        {
          rowNumber: 2,
          'Distress Lead ID': 'DL-2',
          'Canonical Property Key': 'property|2'
        },
        {
          rowNumber: 5,
          'Distress Lead ID': 'DL-5',
          'Canonical Property Key': 'property|5'
        }
      ]
    );

    out.candidates.forEach(candidate => {
      assert.deepEqual(
        Object.keys(candidate).sort(),
        [
          'Canonical Property Key',
          'Distress Lead ID',
          'rowNumber'
        ]
      );
    });

    assertAuthorityFalse(out);
  }
);

test(
  'candidate reads touch only the two identity columns',
  () => {
    const headers = [
      'Other A',
      'Canonical Property Key',
      'Other B',
      'Distress Lead ID',
      'Other C'
    ];

    const h = createHarness({
      headers,
      lastRow: 8
    });

    h.call({startRow: 3, maxRows: 2});

    assert.equal(h.state.rangeCalls.length, 3);

    const dataReads = h.state.rangeCalls.slice(1);

    assert.deepEqual(
      dataReads.map(x => x.column).sort((a, b) => a - b),
      [2, 4]
    );

    dataReads.forEach(call => {
      assert.equal(call.numRows, 2);
      assert.equal(call.numColumns, 1);
    });
  }
);

test(
  'discovery does not automatically continue into another window',
  () => {
    const h = createHarness({lastRow: 10});

    const out = h.call({
      startRow: 2,
      maxRows: 2
    });

    assert.equal(out.rowsInspected, 2);
    assert.equal(out.exhausted, false);
    assert.equal(out.nextStartRow, 4);

    assert.equal(h.state.rangeCalls.length, 3);

    h.state.rangeCalls.slice(1).forEach(call => {
      assert.equal(call.row, 2);
      assert.equal(call.numRows, 2);
    });
  }
);

test(
  'last physical data row is handled as an exhausted one-row window',
  () => {
    const headers = [
      'Distress Lead ID',
      'Other Field',
      'Canonical Property Key'
    ];

    const h = createHarness({
      headers,
      lastRow: 10,
      rows: {
        10: rowFromObject(headers, {
          'Distress Lead ID': 'DL-10',
          'Canonical Property Key': 'property|10'
        })
      }
    });

    const out = h.call({
      startRow: 10,
      maxRows: 50
    });

    assert.equal(out.rowsInspected, 1);
    assert.equal(out.candidateCount, 1);
    assert.equal(out.exhausted, true);
    assert.equal(out.nextStartRow, null);
    assert.equal(out.candidates[0].rowNumber, 10);
  }
);

assert.equal(count, 16);

console.log(
  'ABSENTEE_OWNER_BOUNDED_CANDIDATE_DISCOVERY_BEHAVIOR_CASES=' +
  count
);
console.log('ADMIN_PRECEDES_SPREADSHEET_ACCESS=true');
console.log('INVALID_INPUT_PRECEDES_SPREADSHEET_ACCESS=true');
console.log('MAX_ROWS_50_PHYSICALLY_BOUNDED=true');
console.log('EXHAUSTED_WINDOW_HAS_NO_CANDIDATE_DATA_READ=true');
console.log('IDENTITY_COLUMNS_ONLY=true');
console.log('DUAL_PERSISTED_IDENTITY_REQUIRED=true');
console.log('COMPLETE_ROW_READ_EXECUTED=false');
console.log('AUTOMATIC_MULTIWINDOW_SCAN_EXECUTED=false');
console.log('PRODUCTION_MUTATION_EXECUTED=false');
console.log('CANONICAL_IDENTITY_REPAIR_EXECUTED=false');
console.log('COUNTY_EXECUTION_OCCURRED=false');
console.log('SCHEDULER_MUTATION_EXECUTED=false');
console.log('TRIGGER_MUTATION_EXECUTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
console.log(
  'ABSENTEE_OWNER_BOUNDED_CANDIDATE_DISCOVERY_BEHAVIOR_VALID=true'
);
