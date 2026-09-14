'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const databasePath =
  'build/apps-script-brand/Database.js';

const source =
  fs.readFileSync(
    databasePath,
    'utf8'
  );

function pass(message) {
  console.log('PASS: ' + message);
}

function captureThrow(work) {
  let error = null;

  try {
    work();
  } catch (caught) {
    error = caught;
  }

  assert.ok(
    error,
    'Expected operation to throw'
  );

  return error;
}

function clone2d(matrix) {
  return matrix.map(
    (row) => row.slice()
  );
}

function canonicalize(value) {
  if (value === '') {
    return {
      type: 'blank'
    };
  }

  if (typeof value === 'string') {
    return {
      type: 'string',
      value
    };
  }

  if (typeof value === 'number') {
    assert.equal(
      Number.isFinite(value),
      true
    );

    return {
      type: 'number',
      value:
        Object.is(value, -0)
          ? '0'
          : String(value)
    };
  }

  if (typeof value === 'boolean') {
    return {
      type: 'boolean',
      value
    };
  }

  if (
    Object.prototype
      .toString
      .call(value) === '[object Date]' &&
    Number.isFinite(
      value.getTime()
    )
  ) {
    return {
      type: 'date',
      value:
        value.toISOString()
    };
  }

  throw new Error(
    'UNSUPPORTED_HARNESS_VALUE'
  );
}

function cloneCanonical(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function loadDatabase(sandbox) {
  vm.createContext(sandbox);

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'Database.js'
    }
  );

  return sandbox.REOS.Database;
}

function createSheetModel(options = {}) {
  const values =
    clone2d(
      options.values || [
        [
          'Record ID',
          'Updated At',
          'Last Seen At',
          'Connector Run ID',
          'Untouched'
        ],
        [
          'A-1',
          '2026-09-13T12:00:00.000Z',
          '2026-09-13T12:30:00.000Z',
          'RUN-OLD',
          2
        ],
        [
          'B-2',
          '2026-09-13T13:00:00.000Z',
          '2026-09-13T13:30:00.000Z',
          'RUN-B',
          4
        ]
      ]
    );

  const formulas =
    clone2d(
      options.formulas || [
        ['', '', '', '', ''],
        ['', '', '', '', '=1+1'],
        ['', '', '', '', '=2+2']
      ]
    );

  assert.equal(
    values.length,
    formulas.length
  );

  const width =
    values[0].length;

  values.forEach(
    (row) =>
      assert.equal(
        row.length,
        width
      )
  );

  formulas.forEach(
    (row) =>
      assert.equal(
        row.length,
        width
      )
  );

  let maxRows =
    options.maxRows || 20;

  let maxColumns =
    options.maxColumns || width;

  const state = {
    getRangeCalls: [],
    valueReads: 0,
    formulaReads: 0,
    setValueCalls: []
  };

  function readMatrix(
    matrix,
    row,
    column,
    rowCount,
    columnCount
  ) {
    const result = [];

    for (
      let r = 0;
      r < rowCount;
      r += 1
    ) {
      const output = [];

      for (
        let c = 0;
        c < columnCount;
        c += 1
      ) {
        const sourceRow =
          matrix[
            row - 1 + r
          ];

        output.push(
          sourceRow &&
          sourceRow[
            column - 1 + c
          ] !== undefined
            ? sourceRow[
                column - 1 + c
              ]
            : ''
        );
      }

      result.push(output);
    }

    return result;
  }

  const sheet = {
    getName() {
      return (
        options.sheetName ||
        'TEST'
      );
    },

    getSheetId() {
      return (
        options.sheetId === undefined
          ? 4242
          : options.sheetId
      );
    },

    getLastRow() {
      return values.length;
    },

    getLastColumn() {
      return width;
    },

    getMaxRows() {
      return maxRows;
    },

    getMaxColumns() {
      return maxColumns;
    },

    getRange(
      row,
      column,
      rowCount,
      columnCount
    ) {
      assert.ok(
        Number.isInteger(row) &&
        row > 0
      );

      assert.ok(
        Number.isInteger(column) &&
        column > 0
      );

      assert.ok(
        Number.isInteger(rowCount) &&
        rowCount > 0
      );

      assert.ok(
        Number.isInteger(columnCount) &&
        columnCount > 0
      );

      state.getRangeCalls.push({
        row,
        column,
        rowCount,
        columnCount
      });

      return {
        getValues() {
          state.valueReads += 1;

          return readMatrix(
            values,
            row,
            column,
            rowCount,
            columnCount
          );
        },

        getFormulas() {
          state.formulaReads += 1;

          return readMatrix(
            formulas,
            row,
            column,
            rowCount,
            columnCount
          );
        },

        setValue(value) {
          assert.equal(
            rowCount,
            1
          );

          assert.equal(
            columnCount,
            1
          );

          const callNumber =
            state
              .setValueCalls
              .length + 1;

          state.setValueCalls.push({
            callNumber,
            row,
            column,
            value
          });

          if (
            options
              .setValueThrowsBeforeCall ===
            callNumber
          ) {
            throw new Error(
              'injected setValue failure before mutation'
            );
          }

          values[
            row - 1
          ][
            column - 1
          ] = value;

          formulas[
            row - 1
          ][
            column - 1
          ] = '';

          if (
            options
              .driftUntouchedAfterCall ===
            callNumber
          ) {
            values[1][4] =
              999;
          }

          if (
            options
              .driftFormulaAfterCall ===
            callNumber
          ) {
            formulas[1][4] =
              '=999';
          }

          if (
            options
              .driftGeometryAfterCall ===
            callNumber
          ) {
            maxRows += 1;
          }

          if (
            options
              .duplicateIdAfterCall ===
            callNumber
          ) {
            values[2][0] =
              values[1][0];
          }

          if (
            options
              .setValueThrowsAfterCall ===
            callNumber
          ) {
            throw new Error(
              'injected setValue failure after mutation'
            );
          }

          return this;
        }
      };
    }
  };

  return {
    sheet,
    state,
    values,
    formulas,

    snapshot() {
      return {
        values:
          clone2d(values),

        formulas:
          clone2d(formulas),

        maxRows,
        maxColumns
      };
    }
  };
}

function createRuntimeHarness(
  options = {}
) {
  const model =
    createSheetModel(options);

  const state = {
    tryCalls: [],
    waitCalls: [],
    releaseCalls: 0,
    flushCalls: 0,
    getScriptLockCalls: 0,
    getActiveSpreadsheetCalls: 0
  };

  let held = false;

  const lock = {
    waitLock(timeout) {
      state.waitCalls.push(
        timeout
      );

      held = true;
    },

    tryLock(timeout) {
      state.tryCalls.push(
        timeout
      );

      if (
        options.lockAvailable ===
        false
      ) {
        return false;
      }

      held = true;
      return true;
    },

    hasLock() {
      return held;
    },

    releaseLock() {
      state.releaseCalls += 1;
      held = false;
    }
  };

  const spreadsheet = {
    getId() {
      return (
        options.spreadsheetId ||
        'SPREADSHEET-1'
      );
    },

    getSheetByName(name) {
      if (
        name !==
        model.sheet.getName()
      ) {
        return null;
      }

      return model.sheet;
    }
  };

  const sandbox = {
    REOS: {
      generateId_() {
        return 'TEST-ID';
      },

      Logger: null
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        state
          .getActiveSpreadsheetCalls +=
          1;

        return spreadsheet;
      },

      flush() {
        state.flushCalls += 1;

        if (
          options.flushThrowsOnCall ===
          state.flushCalls
        ) {
          throw new Error(
            'injected flush failure'
          );
        }
      }
    },

    LockService: {
      getScriptLock() {
        state
          .getScriptLockCalls +=
          1;

        return lock;
      }
    },

    console
  };

  const db =
    loadDatabase(sandbox);

  return {
    db,
    model,
    sheet: model.sheet,
    spreadsheet,
    state,

    forceLockHeld() {
      held = true;
    },

    forceLockLoss() {
      held = false;
    }
  };
}

function buildPatchRequest(h) {
  const rowNumber = 2;

  const lastColumn =
    h.sheet.getLastColumn();

  const headers =
    h.sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];

  const rowValues =
    h.sheet
      .getRange(
        rowNumber,
        1,
        1,
        lastColumn
      )
      .getValues()[0];

  const rowFormulas =
    h.sheet
      .getRange(
        rowNumber,
        1,
        1,
        lastColumn
      )
      .getFormulas()[0];

  const postValues =
    rowValues.slice();

  postValues[
    headers.indexOf(
      'Updated At'
    )
  ] =
    '2026-09-14T19:00:00.000Z';

  postValues[
    headers.indexOf(
      'Last Seen At'
    )
  ] =
    '2026-09-14T19:01:00.000Z';

  postValues[
    headers.indexOf(
      'Connector Run ID'
    )
  ] =
    'RUN-NEW';

  const expectedRowValues =
    rowValues.map(
      canonicalize
    );

  const expectedPostRowValues =
    postValues.map(
      canonicalize
    );

  function patchFor(header) {
    const columnNumber =
      headers.indexOf(header) + 1;

    return {
      rowNumber,
      columnNumber,
      header,

      expectedValue:
        cloneCanonical(
          expectedRowValues[
            columnNumber - 1
          ]
        ),

      expectedFormula:
        rowFormulas[
          columnNumber - 1
        ],

      replacementValue:
        cloneCanonical(
          expectedPostRowValues[
            columnNumber - 1
          ]
        ),

      replacementFormula:
        ''
    };
  }

  return {
    spreadsheetId:
      h.spreadsheet.getId(),

    sheetId:
      h.sheet.getSheetId(),

    expectedRowNumber:
      rowNumber,

    idField:
      'Record ID',

    idValue:
      String(rowValues[0]),

    expectedLastRow:
      h.sheet.getLastRow(),

    expectedLastColumn:
      lastColumn,

    expectedMaxRows:
      h.sheet.getMaxRows(),

    expectedMaxColumns:
      h.sheet.getMaxColumns(),

    expectedHeaders:
      headers.slice(),

    expectedRowValues,

    expectedRowFormulas:
      rowFormulas.slice(),

    /*
     * Intentionally reverse physical order.
     * The primitive must sort these before mutation.
     */
    patches: [
      patchFor(
        'Connector Run ID'
      ),
      patchFor(
        'Last Seen At'
      ),
      patchFor(
        'Updated At'
      )
    ],

    expectedPostRowValues,

    expectedPostRowFormulas:
      rowFormulas.slice()
  };
}

function cloneRequest(request) {
  return JSON.parse(
    JSON.stringify(request)
  );
}

console.log(
  '=== DATABASE PHYSICAL ROW PATCH EXACT VALIDATOR ==='
);

const start =
  source.indexOf(
    'function patchPhysicalRowCellsExact('
  );

const end =
  source.indexOf(
    'function deletePhysicalRowExact('
  );

assert.ok(
  start !== -1,
  'patchPhysicalRowCellsExact implementation missing'
);

assert.ok(
  end > start,
  'Patch primitive boundary missing'
);

const primitive =
  source.slice(
    start,
    end
  );

assert.equal(
  (
    primitive.match(
      /\.setValue\s*\(/g
    ) || []
  ).length,
  1,
  'Patch primitive must contain exactly one setValue call site'
);

assert.equal(
  (
    primitive.match(
      /\.setValues\s*\(/g
    ) || []
  ).length,
  0
);

assert.equal(
  (
    primitive.match(
      /\.deleteRow\s*\(/g
    ) || []
  ).length,
  0
);

assert.equal(
  (
    primitive.match(
      /\.deleteRows\s*\(/g
    ) || []
  ).length,
  0
);

assert.equal(
  (
    primitive.match(
      /LockService\.getScriptLock/g
    ) || []
  ).length,
  0
);

assert.ok(
  primitive.includes(
    'validateLockContext_('
  )
);

assert.ok(
  primitive.includes(
    'SpreadsheetApp.flush()'
  )
);

assert.ok(
  primitive.includes(
    "'PHYSICAL_PATCH_VERIFIED'"
  )
);

assert.ok(
  primitive.includes(
    "'PHYSICAL_PATCH_PRECONDITION_FAILED'"
  )
);

assert.ok(
  primitive.includes(
    "'PHYSICAL_PATCH_OUTCOME_UNCERTAIN'"
  )
);

assert.equal(
  (
    source.match(
      /patchPhysicalRowCellsExact:\s*patchPhysicalRowCellsExact/g
    ) || []
  ).length,
  1
);

pass(
  'static primitive topology is exact'
);

console.log(
  'PATCH_STATIC_PRIMITIVE_TOPOLOGY=PASS'
);

let preconditionCases = 0;

function runPreconditionCase(
  name,
  mutator,
  options = {},
  invocation = {}
) {
  const h =
    createRuntimeHarness(options);

  const request =
    buildPatchRequest(h);

  if (mutator) {
    mutator(
      request,
      h
    );
  }

  const before =
    h.model.snapshot();

  let error;

  if (
    invocation.invalidLock ===
    true
  ) {
    error =
      captureThrow(
        () =>
          h.db
            .patchPhysicalRowCellsExact(
              invocation.sheetName ||
                'TEST',
              request,
              {
                lockContext: {}
              }
            )
      );
  } else {
    h.db.withScriptLockContext(
      (lockContext) => {
        const patchOptions =
          invocation.extraOption ===
          true
            ? {
                lockContext,
                unexpected: true
              }
            : {
                lockContext
              };

        error =
          captureThrow(
            () =>
              h.db
                .patchPhysicalRowCellsExact(
                  invocation.sheetName ||
                    'TEST',
                  request,
                  patchOptions
                )
          );
      }
    );
  }

  assert.equal(
    error.classification,
    'PHYSICAL_PATCH_PRECONDITION_FAILED',
    name
  );

  assert.equal(
    h.model.state
      .setValueCalls.length,
    0,
    name
  );

  assert.deepStrictEqual(
    h.model.snapshot(),
    before,
    name
  );

  preconditionCases += 1;

  pass(
    'PRECONDITION ' +
      String(
        preconditionCases
      ).padStart(2, '0') +
      ': ' +
      name
  );
}

runPreconditionCase(
  'missing request field',
  (r) => {
    delete r.expectedMaxColumns;
  }
);

runPreconditionCase(
  'unknown request field',
  (r) => {
    r.unexpected = true;
  }
);

runPreconditionCase(
  'patch cardinality below three',
  (r) => {
    r.patches.pop();
  }
);

runPreconditionCase(
  'duplicate target column',
  (r) => {
    r.patches[1].columnNumber =
      r.patches[0].columnNumber;
  }
);

runPreconditionCase(
  'duplicate target header',
  (r) => {
    r.patches[1].header =
      r.patches[0].header;
  }
);

runPreconditionCase(
  'patch targets wrong row',
  (r) => {
    r.patches[0].rowNumber =
      3;
  }
);

runPreconditionCase(
  'patch targets unauthorized header',
  (r) => {
    r.patches[0].header =
      'Untouched';
  }
);

runPreconditionCase(
  'target expected formula is nonblank',
  (r) => {
    r.patches[0].expectedFormula =
      '=1';
  }
);

runPreconditionCase(
  'replacement formula is nonblank',
  (r) => {
    r.patches[0].replacementFormula =
      '=1';
  }
);

runPreconditionCase(
  'replacement canonical value is invalid',
  (r) => {
    r.patches[0].replacementValue = {
      type: 'number',
      value: '01'
    };
  }
);

runPreconditionCase(
  'untouched postimage value differs',
  (r) => {
    r.expectedPostRowValues[4] = {
      type: 'number',
      value: '999'
    };
  }
);

runPreconditionCase(
  'untouched postimage formula differs',
  (r) => {
    r.expectedPostRowFormulas[4] =
      '=999';
  }
);

runPreconditionCase(
  'target replacement and postimage disagree',
  (r) => {
    r.expectedPostRowValues[1] = {
      type: 'string',
      value: 'WRONG'
    };
  }
);

runPreconditionCase(
  'spreadsheet identity drift',
  (r) => {
    r.spreadsheetId =
      'WRONG-SPREADSHEET';
  }
);

runPreconditionCase(
  'sheet identity drift',
  (r) => {
    r.sheetId =
      9999;
  }
);

runPreconditionCase(
  'header-row target prohibited',
  (r) => {
    r.expectedRowNumber =
      1;
  }
);

runPreconditionCase(
  'geometry authority drift',
  (r) => {
    r.expectedMaxRows +=
      1;
  }
);

runPreconditionCase(
  'expected header vector drift',
  (r) => {
    r.expectedHeaders[4] =
      'Changed';
  }
);

runPreconditionCase(
  'expected preimage value drift',
  (r) => {
    r.expectedRowValues[4] = {
      type: 'number',
      value: '999'
    };
  }
);

runPreconditionCase(
  'expected preimage formula drift',
  (r) => {
    r.expectedRowFormulas[4] =
      '=999';
  }
);

runPreconditionCase(
  'ID field missing',
  (r) => {
    r.idField =
      'Missing ID';
  }
);

runPreconditionCase(
  'ID value missing from physical sheet',
  (r) => {
    r.idValue =
      'MISSING';
  }
);

runPreconditionCase(
  'physical header drift',
  (r, h) => {
    h.model.values[0][1] =
      'Updated Drift';
  }
);

runPreconditionCase(
  'physical row value drift',
  (r, h) => {
    h.model.values[1][4] =
      999;
  }
);

runPreconditionCase(
  'physical row formula drift',
  (r, h) => {
    h.model.formulas[1][4] =
      '=999';
  }
);

runPreconditionCase(
  'physical ID becomes ambiguous',
  (r, h) => {
    h.model.values[2][0] =
      h.model.values[1][0];
  }
);

runPreconditionCase(
  'unknown options field',
  null,
  {},
  {
    extraOption: true
  }
);

runPreconditionCase(
  'wrong sheet name',
  null,
  {},
  {
    sheetName:
      'WRONG'
  }
);

runPreconditionCase(
  'forged lock context',
  null,
  {},
  {
    invalidLock: true
  }
);

console.log(
  'PATCH_PRECONDITION_CASES_PASSED=' +
    preconditionCases
);

console.log(
  'PATCH_PRECONDITION_EXECUTION_MATRIX=PASS'
);

{
  const h =
    createRuntimeHarness();

  const request =
    buildPatchRequest(h);

  const before =
    h.model.snapshot();

  let result;

  h.db.withScriptLockContext(
    (lockContext) => {
      result =
        h.db
          .patchPhysicalRowCellsExact(
            'TEST',
            request,
            {
              lockContext
            }
          );
    }
  );

  assert.equal(
    result.classification,
    'PHYSICAL_PATCH_VERIFIED'
  );

  assert.equal(
    result.rowNumber,
    2
  );

  assert.deepStrictEqual(
    h.model.state
      .setValueCalls
      .map(
        (call) =>
          call.column
      ),
    [2, 3, 4]
  );

  assert.equal(
    h.model.state
      .setValueCalls.length,
    3
  );

  assert.equal(
    h.model.values[1][0],
    before.values[1][0]
  );

  assert.equal(
    h.model.values[1][1],
    '2026-09-14T19:00:00.000Z'
  );

  assert.equal(
    h.model.values[1][2],
    '2026-09-14T19:01:00.000Z'
  );

  assert.equal(
    h.model.values[1][3],
    'RUN-NEW'
  );

  assert.equal(
    h.model.values[1][4],
    before.values[1][4]
  );

  assert.equal(
    h.model.formulas[1][4],
    before.formulas[1][4]
  );

  /*
   * One primitive flush plus one outer lock-owner
   * finalization flush.
   */
  assert.equal(
    h.state.flushCalls,
    2
  );

  pass(
    'valid request performs exactly three ascending 1x1 writes and verifies complete postimage'
  );
}

let outcomeCases = 0;

function runUncertainCase(
  name,
  options,
  verify
) {
  const h =
    createRuntimeHarness(
      options
    );

  const request =
    buildPatchRequest(h);

  let error;

  h.db.withScriptLockContext(
    (lockContext) => {
      error =
        captureThrow(
          () =>
            h.db
              .patchPhysicalRowCellsExact(
                'TEST',
                request,
                {
                  lockContext
                }
              )
        );
    }
  );

  assert.equal(
    error.classification,
    'PHYSICAL_PATCH_OUTCOME_UNCERTAIN',
    name
  );

  if (verify) {
    verify(h);
  }

  outcomeCases += 1;

  pass(
    'OUTCOME ' +
      String(
        outcomeCases
      ).padStart(2, '0') +
      ': ' +
      name
  );
}

runUncertainCase(
  'first setValue invocation throws before modeled mutation',
  {
    setValueThrowsBeforeCall:
      1
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      1
    );

    assert.equal(
      h.model.values[1][1],
      '2026-09-13T12:00:00.000Z'
    );
  }
);

runUncertainCase(
  'first setValue throws after mutation',
  {
    setValueThrowsAfterCall:
      1
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      1
    );

    assert.equal(
      h.model.values[1][1],
      '2026-09-14T19:00:00.000Z'
    );
  }
);

runUncertainCase(
  'second setValue invocation fails',
  {
    setValueThrowsBeforeCall:
      2
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      2
    );

    assert.equal(
      h.model.values[1][1],
      '2026-09-14T19:00:00.000Z'
    );

    assert.equal(
      h.model.values[1][2],
      '2026-09-13T12:30:00.000Z'
    );
  }
);

runUncertainCase(
  'third setValue invocation fails',
  {
    setValueThrowsBeforeCall:
      3
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      3
    );

    assert.equal(
      h.model.values[1][1],
      '2026-09-14T19:00:00.000Z'
    );

    assert.equal(
      h.model.values[1][2],
      '2026-09-14T19:01:00.000Z'
    );

    assert.equal(
      h.model.values[1][3],
      'RUN-OLD'
    );
  }
);

runUncertainCase(
  'explicit primitive flush fails after three writes',
  {
    flushThrowsOnCall:
      1
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      3
    );

    assert.equal(
      h.state.flushCalls,
      2
    );
  }
);

runUncertainCase(
  'untouched value drifts after write barrier',
  {
    driftUntouchedAfterCall:
      3
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      3
    );
  }
);

runUncertainCase(
  'untouched formula drifts after write barrier',
  {
    driftFormulaAfterCall:
      3
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      3
    );
  }
);

runUncertainCase(
  'geometry drifts after write barrier',
  {
    driftGeometryAfterCall:
      3
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      3
    );
  }
);

runUncertainCase(
  'ID becomes ambiguous after write barrier',
  {
    duplicateIdAfterCall:
      3
  },
  (h) => {
    assert.equal(
      h.model.state
        .setValueCalls.length,
      3
    );
  }
);

console.log(
  'PATCH_OUTCOME_CASES_PASSED=' +
    outcomeCases
);

console.log(
  'PATCH_OUTCOME_EXECUTION_MATRIX=PASS'
);

console.log(
  'DATABASE_PHYSICAL_ROW_PATCH_EXACT_VALIDATION_PASSED=true'
);
