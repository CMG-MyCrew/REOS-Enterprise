#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const databasePath =
  'build/apps-script-brand/Database.js';

const countyPath =
  'build/apps-script-brand/CountyConnectorSDK.js';

const databaseSource =
  fs.readFileSync(
    databasePath,
    'utf8'
  );

const countySource =
  fs.readFileSync(
    countyPath,
    'utf8'
  );

console.log(
  '=== DATABASE SPARSE-ROW INTEGRITY CONTRACT ==='
);

const failures = [];

function check(
  name,
  work
) {
  try {
    work();

    console.log(
      'PASS: ' + name
    );
  } catch (error) {
    failures.push({
      name,
      error
    });

    console.error(
      'FAIL: ' + name
    );

    console.error(
      '      ' +
      String(
        error &&
        error.message
          ? error.message
          : error
      )
    );
  }
}

function isolate(
  source,
  startMarker,
  endMarker
) {
  const start =
    source.indexOf(
      startMarker
    );

  const end =
    source.indexOf(
      endMarker,
      start
    );

  assert.ok(
    start >= 0 &&
    end > start,
    'Unable to isolate source block: ' +
      startMarker
  );

  return source.slice(
    start,
    end
  );
}


/*
 * Static mutation-authority contract.
 *
 * findRowById() must resolve a physical sheet row directly.
 * It must not inherit row authority through a compacted
 * getAll()/findById() result.
 */
const findRowBlock =
  isolate(
    databaseSource,
    'function findRowById(sheetName, idField, idValue)',
    'function beginLockObservation_('
  );

check(
  'findRowById does not derive mutation authority from findById',
  () => {
    assert.equal(
      /\bfindById\s*\(/.test(
        findRowBlock
      ),
      false,
      'findRowById still delegates to findById/getAll'
    );
  }
);


/*
 * Runtime harness with deliberately sparse physical rows:
 *
 * row 1 = headers
 * row 2 = A
 * row 3 = BLANK
 * row 4 = B
 * row 5 = BLANK
 * row 6 = C
 *
 * Logical filtering may hide rows 3 and 5, but physical
 * mutation authority must remain 2, 4, and 6.
 */
function createHarness() {
  const headers = [
    'Record ID',
    'Value',
    'Updated At'
  ];

  const physicalRows = [
    headers.slice(),          // row 1
    ['A', 'alpha', ''],       // row 2
    ['', '', ''],             // row 3
    ['B', 'beta', ''],        // row 4
    ['', '', ''],             // row 5
    ['C', 'gamma', '']        // row 6
  ];

  const state = {
    waitCalls: [],
    releaseCalls: 0,
    writes: []
  };

  const lock = {
    waitLock(timeout) {
      state.waitCalls.push(
        timeout
      );
    },

    tryLock() {
      return true;
    },

    hasLock() {
      return true;
    },

    releaseLock() {
      state.releaseCalls += 1;
    }
  };

  function normalizedRow_(
    row,
    width
  ) {
    const copy =
      (row || []).slice();

    while (
      copy.length <
      width
    ) {
      copy.push('');
    }

    return copy.slice(
      0,
      width
    );
  }

  const sheet = {
    getLastRow() {
      return physicalRows.length;
    },

    getLastColumn() {
      return headers.length;
    },

    getRange(
      row,
      column,
      rowCount,
      columnCount
    ) {
      assert.equal(
        column,
        1,
        'Harness only supports column 1 reads/writes'
      );

      return {
        getValues() {
          const result = [];

          for (
            let offset = 0;
            offset < rowCount;
            offset++
          ) {
            result.push(
              normalizedRow_(
                physicalRows[
                  row - 1 + offset
                ],
                columnCount
              )
            );
          }

          return result;
        },

        setValues(values) {
          assert.equal(
            values.length,
            rowCount
          );

          values.forEach(
            (
              valueRow,
              offset
            ) => {
              physicalRows[
                row - 1 + offset
              ] =
                normalizedRow_(
                  valueRow,
                  columnCount
                );

              state.writes.push({
                row:
                  row + offset,

                values:
                  normalizedRow_(
                    valueRow,
                    columnCount
                  )
              });
            }
          );
        }
      };
    },

    appendRow(row) {
      physicalRows.push(
        normalizedRow_(
          row,
          headers.length
        )
      );
    }
  };

  const spreadsheet = {
    getSheetByName(
      sheetName
    ) {
      assert.equal(
        sheetName,
        'TEST'
      );

      return sheet;
    }
  };

  const sandbox = {
    REOS: {
      Logger: null,

      generateId_() {
        return 'TEST-ID';
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return spreadsheet;
      },

      flush() {}
    },

    LockService: {
      getScriptLock() {
        return lock;
      }
    },

    console,
    Date,
    Math,
    Number,
    Object,
    Array,
    String,
    Boolean,
    JSON,
    Error,
    isNaN,
    isFinite
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    databaseSource,
    sandbox
  );

  return {
    db:
      sandbox.REOS.Database,

    physicalRows,
    state
  };
}


const h =
  createHarness();


check(
  'getAll preserves physical row numbers across blank rows',
  () => {
    const rows =
      h.db.getAll(
        'TEST'
      );

    assert.deepStrictEqual(
      rows.map(
        (row) =>
          String(
            row['Record ID']
          )
      ),
      [
        'A',
        'B',
        'C'
      ]
    );

    assert.deepStrictEqual(
      rows.map(
        (row) =>
          Number(
            row._rowNumber
          )
      ),
      [
        2,
        4,
        6
      ],
      'Expected physical rows 2,4,6'
    );
  }
);


check(
  'findRowById returns physical row 6 for record C',
  () => {
    assert.equal(
      h.db.findRowById(
        'TEST',
        'Record ID',
        'C'
      ),
      6
    );
  }
);


check(
  'Database.update changes only the physical target row',
  () => {
    const beforeRow4 =
      h.physicalRows[3]
        .slice();

    const result =
      h.db.update(
        'TEST',
        'Record ID',
        'C',
        {
          Value:
            'changed'
        }
      );

    assert.equal(
      result[
        'Record ID'
      ],
      'C',
      'Update returned the wrong physical record'
    );

    assert.equal(
      result.Value,
      'changed'
    );

    assert.equal(
      h.physicalRows[3][0],
      beforeRow4[0],
      'Physical row 4 ID was changed'
    );

    assert.equal(
      h.physicalRows[3][1],
      beforeRow4[1],
      'Physical row 4 value was changed'
    );

    assert.equal(
      h.physicalRows[5][0],
      'C'
    );

    assert.equal(
      h.physicalRows[5][1],
      'changed'
    );

    assert.deepStrictEqual(
      h.state.writes.map(
        (entry) =>
          entry.row
      ),
      [6],
      'Update wrote to a row other than physical row 6'
    );
  }
);


/*
 * County observation duplicate contract.
 *
 * An exact observation identity must have zero or one persisted
 * match. Multiple exact matches are corruption evidence and must
 * fail closed rather than selecting Array.find()'s first row.
 */
const countyFindExistingBlock =
  isolate(
    countySource,
    'function findExisting_(',
    'function normalizeLead_('
  );

check(
  'county exact-observation lookup does not silently select first duplicate',
  () => {
    assert.equal(
      /\brows\s*\.\s*find\s*\(/.test(
        countyFindExistingBlock
      ),
      false,
      'findExisting_ still silently chooses the first exact match'
    );

    assert.match(
      countyFindExistingBlock,
      /\.filter\s*\(/,
      'findExisting_ must collect all exact matches'
    );

    assert.match(
      countyFindExistingBlock,
      /length\s*>\s*1/,
      'findExisting_ must explicitly detect multiple matches'
    );

    assert.match(
      countyFindExistingBlock,
      /throw\s+new\s+Error/,
      'findExisting_ must fail closed on duplicate observation identity'
    );
  }
);


console.log();

if (
  failures.length
) {
  console.error(
    'Database sparse-row integrity validation FAILED.'
  );

  console.error(
    'Failures: ' +
      failures.length
  );

  failures.forEach(
    (
      failure,
      index
    ) => {
      console.error(
        String(
          index + 1
        ) +
        '. ' +
        failure.name
      );
    }
  );

  process.exit(1);
}

console.log(
  'Database sparse-row integrity validation PASSED.'
);
