'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const DATABASE_PATH =
  'build/apps-script-brand/Database.js';

const source =
  fs.readFileSync(
    DATABASE_PATH,
    'utf8'
  );

const PRECONDITION =
  'PHYSICAL_REPLACE_PRECONDITION_FAILED';

const UNCERTAIN =
  'PHYSICAL_REPLACE_OUTCOME_UNCERTAIN';

const VERIFIED =
  'PHYSICAL_REPLACE_VERIFIED';

function pass(message) {
  console.log(
    'PASS: ' + message
  );
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
      .call(value) ===
      '[object Date]' &&
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

function cloneRequest(request) {
  return JSON.parse(
    JSON.stringify(request)
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

function createSheetModel(
  options = {}
) {
  const values =
    clone2d(
      options.values || [
        [
          'Record ID',
          'Name',
          'Updated At',
          'Last Seen At',
          'Connector Run ID',
          'Computed',
          'Flag'
        ],
        [
          'A-1',
          'Alpha',
          '2026-09-17T00:00:00.000Z',
          '2026-09-17T00:01:00.000Z',
          'RUN-OLD',
          2,
          true
        ],
        [
          'B-2',
          'Bravo',
          '2026-09-17T01:00:00.000Z',
          '2026-09-17T01:01:00.000Z',
          'RUN-B',
          4,
          false
        ]
      ]
    );

  const formulas =
    clone2d(
      options.formulas || [
        ['', '', '', '', '', '', ''],
        ['', '', '', '', '', '=1+1', ''],
        ['', '', '', '', '', '=2+2', '']
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

  let currentSheetId =
    options.sheetId === undefined
      ? 4242
      : options.sheetId;

  let currentSheetName =
    options.sheetName || 'TEST';

  const state = {
    getRangeCalls: [],
    valueReads: 0,
    formulaReads: 0,
    setValuesCalls: [],
    setValueCalls: [],
    setFormulasCalls: [],
    appendRowCalls: [],
    deleteRowCalls: [],
    deleteRowsCalls: [],
    clearCalls: [],
    afterSetValues: null
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
      return currentSheetName;
    },

    getSheetId() {
      return currentSheetId;
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

        setValues(payload) {
          state.setValuesCalls.push({
            row,
            column,
            rowCount,
            columnCount,
            payload:
              clone2d(payload)
          });

          if (
            options
              .setValuesThrowsBeforeMutation ===
            true
          ) {
            throw new Error(
              'injected setValues failure before mutation'
            );
          }

          assert.equal(
            rowCount,
            1
          );

          assert.equal(
            payload.length,
            1
          );

          assert.equal(
            payload[0].length,
            columnCount
          );

          const previousValues =
            values[
              row - 1
            ].slice();

          const previousFormulas =
            formulas[
              row - 1
            ].slice();

          for (
            let index = 0;
            index < columnCount;
            index += 1
          ) {
            const targetColumn =
              column - 1 + index;

            const incoming =
              payload[0][index];

            if (
              typeof incoming ===
                'string' &&
              incoming.indexOf('=') ===
                0
            ) {
              formulas[
                row - 1
              ][
                targetColumn
              ] =
                incoming;

              if (
                previousFormulas[
                  targetColumn
                ] ===
                incoming
              ) {
                values[
                  row - 1
                ][
                  targetColumn
                ] =
                  previousValues[
                    targetColumn
                  ];
              } else {
                values[
                  row - 1
                ][
                  targetColumn
                ] =
                  '';
              }
            } else {
              values[
                row - 1
              ][
                targetColumn
              ] =
                incoming;

              formulas[
                row - 1
              ][
                targetColumn
              ] =
                '';
            }
          }

          if (
            options.postValueDrift ===
            true
          ) {
            values[1][1] =
              'POST-DRIFT';
          }

          if (
            options.postFormulaDrift ===
            true
          ) {
            formulas[1][5] =
              '=9+9';
          }

          if (
            options.postGeometryDrift ===
            true
          ) {
            maxRows += 1;
          }

          if (
            options.postDuplicateId ===
            true
          ) {
            values[2][0] =
              values[1][0];
          }

          if (
            options.postMoveId ===
            true
          ) {
            const originalId =
              values[1][0];

            values[1][0] =
              'MOVED-ID';

            values[2][0] =
              originalId;
          }

          if (
            options.postHeaderDrift ===
            true
          ) {
            values[0][1] =
              'Changed Header';
          }

          if (
            options.postSheetIdDrift ===
            true
          ) {
            currentSheetId += 1;
          }

          if (
            typeof state.afterSetValues ===
            'function'
          ) {
            state.afterSetValues();
          }

          if (
            options
              .setValuesThrowsAfterMutation ===
            true
          ) {
            throw new Error(
              'injected setValues failure after mutation'
            );
          }

          return this;
        },

        setValue(value) {
          state.setValueCalls.push({
            row,
            column,
            value
          });

          throw new Error(
            'UNAUTHORIZED_SET_VALUE'
          );
        },

        setFormulas(payload) {
          state.setFormulasCalls.push({
            row,
            column,
            payload
          });

          throw new Error(
            'UNAUTHORIZED_SET_FORMULAS'
          );
        },

        clear() {
          state.clearCalls.push(
            'clear'
          );

          throw new Error(
            'UNAUTHORIZED_CLEAR'
          );
        },

        clearContent() {
          state.clearCalls.push(
            'clearContent'
          );

          throw new Error(
            'UNAUTHORIZED_CLEAR_CONTENT'
          );
        }
      };
    },

    appendRow(row) {
      state.appendRowCalls.push(
        row
      );

      throw new Error(
        'UNAUTHORIZED_APPEND_ROW'
      );
    },

    deleteRow(rowNumber) {
      state.deleteRowCalls.push(
        rowNumber
      );

      throw new Error(
        'UNAUTHORIZED_DELETE_ROW'
      );
    },

    deleteRows(
      rowNumber,
      howMany
    ) {
      state.deleteRowsCalls.push({
        rowNumber,
        howMany
      });

      throw new Error(
        'UNAUTHORIZED_DELETE_ROWS'
      );
    },

    insertRowAfter() {
      throw new Error(
        'UNAUTHORIZED_INSERT_ROW'
      );
    },

    insertRows() {
      throw new Error(
        'UNAUTHORIZED_INSERT_ROWS'
      );
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
        maxColumns,
        sheetId:
          currentSheetId,
        sheetName:
          currentSheetName
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

  let currentSpreadsheetId =
    options.spreadsheetId ||
    'SPREADSHEET-1';

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
      return currentSpreadsheetId;
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

  if (
    options.postSpreadsheetIdDrift ===
    true
  ) {
    model.state.afterSetValues =
      function () {
        currentSpreadsheetId =
          'DRIFTED-SPREADSHEET';
      };
  }

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
    sheet:
      model.sheet,
    spreadsheet,
    state,
    lock,

    forceLockHeld() {
      held = true;
    },

    forceLockLoss() {
      held = false;
    },

    lockIsHeld() {
      return held;
    },

    getSpreadsheetId() {
      return currentSpreadsheetId;
    }
  };
}

function buildReplaceRequest(h) {
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

  postValues[1] =
    'Beta';

  postValues[2] =
    '2026-09-17T04:00:00.000Z';

  postValues[3] =
    '2026-09-17T04:01:00.000Z';

  postValues[4] =
    'RUN-NEW';

  postValues[6] =
    false;

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

    expectedRowValues:
      rowValues.map(
        canonicalize
      ),

    expectedRowFormulas:
      rowFormulas.slice(),

    expectedPostRowValues:
      postValues.map(
        canonicalize
      ),

    expectedPostRowFormulas:
      rowFormulas.slice()
  };
}

function callOwnerContext(
  h,
  sheetName,
  request
) {
  return h.db
    .withScriptLockContext(
      (lockContext) =>
        h.db
          .replacePhysicalRowExact(
            sheetName,
            request,
            {
              lockContext
            }
          )
    );
}

function installLockLossBeforeWrite(
  h,
  request
) {
  const originalGetRange =
    h.sheet
      .getRange
      .bind(h.sheet);

  let armed = true;

  h.sheet.getRange =
    function (
      row,
      column,
      rowCount,
      columnCount
    ) {
      const range =
        originalGetRange(
          row,
          column,
          rowCount,
          columnCount
        );

      if (
        armed &&
        row ===
          request.expectedRowNumber &&
        column === 1 &&
        rowCount === 1 &&
        columnCount ===
          request.expectedLastColumn
      ) {
        const originalGetFormulas =
          range
            .getFormulas
            .bind(range);

        range.getFormulas =
          function () {
            const result =
              originalGetFormulas();

            if (armed) {
              armed = false;
              h.forceLockLoss();
            }

            return result;
          };
      }

      return range;
    };

  return {
    isArmed() {
      return armed;
    }
  };
}

function executePrepared(
  prepared
) {
  const {
    h,
    sheetName,
    request,
    mode
  } = prepared;

  if (
    mode ===
    'NULL_OPTIONS'
  ) {
    return h.db
      .replacePhysicalRowExact(
        sheetName,
        request,
        null
      );
  }

  if (
    mode ===
    'FORGED_CONTEXT'
  ) {
    return h.db
      .replacePhysicalRowExact(
        sheetName,
        request,
        {
          lockContext: {
            lock:
              h.lock
          }
        }
      );
  }

  if (
    mode ===
    'REPLAYED_CONTEXT'
  ) {
    let stale = null;

    h.db
      .withScriptLockContext(
        (context) => {
          stale = context;
        }
      );

    assert.ok(stale);
    assert.equal(
      h.lockIsHeld(),
      false
    );

    return h.db
      .withScriptLockContext(
        (fresh) => {
          assert.ok(fresh);
          assert.notStrictEqual(
            fresh,
            stale
          );

          return h.db
            .replacePhysicalRowExact(
              sheetName,
              request,
              {
                lockContext:
                  stale
              }
            );
        }
      );
  }

  if (
    mode ===
    'LOCK_LOST'
  ) {
    const hook =
      installLockLossBeforeWrite(
        h,
        request
      );

    const result =
      callOwnerContext(
        h,
        sheetName,
        request
      );

    assert.equal(
      hook.isArmed(),
      false
    );

    return result;
  }

  return callOwnerContext(
    h,
    sheetName,
    request
  );
}

function assertNoWrites(h) {
  assert.equal(
    h.model.state
      .setValuesCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .setValueCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .setFormulasCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .appendRowCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .deleteRowCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .deleteRowsCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .clearCalls.length,
    0
  );
}

function runPreconditionCase(
  id,
  setup
) {
  const h =
    createRuntimeHarness();

  const prepared = {
    id,
    h,
    sheetName:
      'TEST',
    request:
      buildReplaceRequest(h),
    mode:
      'OWNER'
  };

  setup(
    prepared
  );

  const before =
    h.model.snapshot();

  const error =
    captureThrow(
      () =>
        executePrepared(
          prepared
        )
    );

  assert.equal(
    error.classification,
    PRECONDITION,
    id
  );

  assertNoWrites(h);

  assert.deepEqual(
    h.model.snapshot(),
    before,
    id +
      ' changed physical sheet state'
  );

  pass(
    id +
    ' fails before write'
  );
}

console.log(
  '=== DATABASE PHYSICAL ROW REPLACE EXACT IMPLEMENTATION VALIDATOR ==='
);

const topologyHarness =
  createRuntimeHarness();

assert.equal(
  typeof topologyHarness
    .db
    .replacePhysicalRowExact,
  'function',
  'replacePhysicalRowExact must be exported'
);

const primitiveSource =
  Function.prototype
    .toString
    .call(
      topologyHarness
        .db
        .replacePhysicalRowExact
    );

assert.equal(
  (
    primitiveSource.match(
      /\.setValues\s*\(/g
    ) || []
  ).length,
  1,
  'replace primitive must contain exactly one setValues call site'
);

[
  /\.setValue\s*\(/,
  /\.setFormulas\s*\(/,
  /\.appendRow\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.clear\s*\(/,
  /\.clearContent\s*\(/,
  /\.insertRow/,
  /\.insertRows/
].forEach(
  (pattern) => {
    assert.equal(
      pattern.test(
        primitiveSource
      ),
      false,
      'prohibited mutation surface: ' +
        pattern
    );
  }
);

[
  /LockService/,
  /\.waitLock\s*\(/,
  /\.tryLock\s*\(/,
  /\.releaseLock\s*\(/,
  /withScriptLockContext\s*\(/,
  /REOS\.Security/,
  /CountyMutationExclusion/
].forEach(
  (pattern) => {
    assert.equal(
      pattern.test(
        primitiveSource
      ),
      false,
      'primitive owns prohibited authority: ' +
        pattern
    );
  }
);

assert.equal(
  (
    primitiveSource.match(
      /SpreadsheetApp\.flush\s*\(/g
    ) || []
  ).length,
  1,
  'replace primitive must flush exactly once after write'
);

assert.ok(
  (
    primitiveSource.match(
      /validateLockContext_\s*\(/g
    ) || []
  ).length >= 4,
  'replace primitive must repeatedly validate caller lock context'
);

[
  PRECONDITION,
  UNCERTAIN,
  VERIFIED,
  'candidateRange.setValues',
  'replacementRow'
].forEach(
  (token) =>
    assert.equal(
      primitiveSource.includes(
        token
      ),
      true,
      'primitive missing token: ' +
        token
    )
);

const patchHeadersMatch =
  source.match(
    /\bvar\s+PHYSICAL_PATCH_HEADERS_\s*=\s*\[([\s\S]*?)\];/
  );

assert.ok(
  patchHeadersMatch,
  'PHYSICAL_PATCH_HEADERS_ missing'
);

const patchHeaders =
  Array.from(
    patchHeadersMatch[1]
      .matchAll(
        /'([^']*)'/g
      ),
    (match) => match[1]
  );

assert.deepEqual(
  patchHeaders,
  [
    'Updated At',
    'Last Seen At',
    'Connector Run ID'
  ]
);

pass(
  'static one-write topology and patch corridor are exact'
);

const preconditionCases = [
  [
    'REQUEST_NULL',
    (p) => {
      p.request = null;
    }
  ],
  [
    'OPTIONS_NULL',
    (p) => {
      p.mode =
        'NULL_OPTIONS';
    }
  ],
  [
    'UNKNOWN_REQUEST_FIELD',
    (p) => {
      p.request
        .unexpectedField =
        true;
    }
  ],
  [
    'MISSING_REQUEST_FIELD',
    (p) => {
      delete p.request
        .expectedPostRowFormulas;
    }
  ],
  [
    'WRONG_SPREADSHEET_ID',
    (p) => {
      p.request
        .spreadsheetId =
        'WRONG-SPREADSHEET';
    }
  ],
  [
    'WRONG_SHEET_ID',
    (p) => {
      p.request
        .sheetId += 1;
    }
  ],
  [
    'GEOMETRY_DRIFT',
    (p) => {
      const original =
        p.h.sheet
          .getMaxRows
          .bind(p.h.sheet);

      p.h.sheet.getMaxRows =
        () => original() + 1;
    }
  ],
  [
    'HEADER_DRIFT',
    (p) => {
      p.h.model
        .values[0][1] =
        'Changed Name';
    }
  ],
  [
    'AMBIGUOUS_HEADERS',
    (p) => {
      p.h.model
        .values[0][1] =
        ' record id ';

      p.request
        .expectedHeaders[1] =
        ' record id ';
    }
  ],
  [
    'ID_ZERO_MATCH',
    (p) => {
      p.h.model
        .values[1][0] =
        'NOT-A-1';
    }
  ],
  [
    'ID_DUPLICATE_MATCH',
    (p) => {
      p.h.model
        .values[2][0] =
        'A-1';
    }
  ],
  [
    'ID_MOVED',
    (p) => {
      p.h.model
        .values[1][0] =
        'MOVED';

      p.h.model
        .values[2][0] =
        'A-1';
    }
  ],
  [
    'VALUE_PREIMAGE_DRIFT',
    (p) => {
      p.h.model
        .values[1][1] =
        'DRIFT';
    }
  ],
  [
    'FORMULA_PREIMAGE_DRIFT',
    (p) => {
      p.h.model
        .formulas[1][5] =
        '=99';
    }
  ],
  [
    'ATTEMPTED_ID_MUTATION',
    (p) => {
      p.request
        .expectedPostRowValues[0] = {
          type:
            'string',
          value:
            'CHANGED-ID'
        };
    }
  ],
  [
    'ATTEMPTED_FORMULA_MUTATION',
    (p) => {
      p.request
        .expectedPostRowFormulas[5] =
        '=9+9';
    }
  ],
  [
    'UNSAFE_LEADING_EQUALS_LITERAL',
    (p) => {
      p.request
        .expectedPostRowValues[1] = {
          type:
            'string',
          value:
            '=unsafe'
        };
    }
  ],
  [
    'FORGED_LOCK_CONTEXT',
    (p) => {
      p.mode =
        'FORGED_CONTEXT';
    }
  ],
  [
    'REPLAYED_LOCK_CONTEXT',
    (p) => {
      p.mode =
        'REPLAYED_CONTEXT';
    }
  ],
  [
    'LOCK_LOST_BEFORE_WRITE',
    (p) => {
      p.mode =
        'LOCK_LOST';
    }
  ]
];

preconditionCases
  .forEach(
    ([id, setup]) =>
      runPreconditionCase(
        id,
        setup
      )
  );

console.log(
  'PRECONDITION_EXECUTION_CASES=' +
  preconditionCases.length
);

{
  const h =
    createRuntimeHarness();

  const request =
    buildReplaceRequest(h);

  const result =
    callOwnerContext(
      h,
      'TEST',
      request
    );

  assert.equal(
    result.classification,
    VERIFIED
  );

  assert.equal(
    result.spreadsheetId,
    'SPREADSHEET-1'
  );

  assert.equal(
    result.sheetName,
    'TEST'
  );

  assert.equal(
    result.sheetId,
    4242
  );

  assert.equal(
    result.rowNumber,
    2
  );

  assert.equal(
    result.idField,
    'Record ID'
  );

  assert.equal(
    result.idValue,
    'A-1'
  );

  assert.equal(
    h.model.state
      .setValuesCalls.length,
    1
  );

  const write =
    h.model.state
      .setValuesCalls[0];

  assert.deepEqual(
    {
      row:
        write.row,
      column:
        write.column,
      rowCount:
        write.rowCount,
      columnCount:
        write.columnCount
    },
    {
      row: 2,
      column: 1,
      rowCount: 1,
      columnCount:
        request.expectedLastColumn
    }
  );

  assert.equal(
    write.payload.length,
    1
  );

  assert.equal(
    write.payload[0].length,
    request.expectedLastColumn
  );

  assert.equal(
    write.payload[0][5],
    '=1+1'
  );

  assert.equal(
    h.model.values[1][0],
    'A-1'
  );

  assert.equal(
    h.model.values[1][1],
    'Beta'
  );

  assert.equal(
    h.model.values[1][4],
    'RUN-NEW'
  );

  assert.equal(
    h.model.values[1][5],
    2
  );

  assert.equal(
    h.model.values[1][6],
    false
  );

  assert.equal(
    h.model.formulas[1][5],
    '=1+1'
  );

  assert.equal(
    h.model.state
      .setValueCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .setFormulasCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .appendRowCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .deleteRowCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .deleteRowsCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .clearCalls.length,
    0
  );

  assert.equal(
    h.state.flushCalls,
    2
  );

  assert.equal(
    h.state.releaseCalls,
    1
  );

  assert.equal(
    h.lockIsHeld(),
    false
  );

  pass(
    'verified success performs exactly one full-width setValues write'
  );

  pass(
    'existing formula text and evaluated value are preserved exactly'
  );
}

function runUncertainCase(
  id,
  options,
  verify
) {
  const h =
    createRuntimeHarness(
      options
    );

  const request =
    buildReplaceRequest(h);

  const before =
    h.model.snapshot();

  const error =
    captureThrow(
      () =>
        callOwnerContext(
          h,
          'TEST',
          request
        )
    );

  assert.equal(
    error.classification,
    UNCERTAIN,
    id
  );

  assert.equal(
    h.model.state
      .setValuesCalls.length,
    1,
    id +
      ' must invoke setValues exactly once'
  );

  assert.equal(
    h.model.state
      .setValueCalls.length,
    0
  );

  assert.equal(
    h.model.state
      .setFormulasCalls.length,
    0
  );

  if (verify) {
    verify(
      h,
      before,
      request
    );
  }

  pass(
    id +
    ' is conservatively uncertain with no retry'
  );
}

runUncertainCase(
  'SETVALUES_THROW_BEFORE_MODELED_MUTATION',
  {
    setValuesThrowsBeforeMutation:
      true
  },
  (h, before) => {
    assert.deepEqual(
      h.model.snapshot(),
      before
    );
  }
);

runUncertainCase(
  'SETVALUES_THROW_AFTER_MUTATION',
  {
    setValuesThrowsAfterMutation:
      true
  },
  (h) => {
    assert.equal(
      h.model.values[1][1],
      'Beta'
    );

    assert.equal(
      h.model.formulas[1][5],
      '=1+1'
    );
  }
);

runUncertainCase(
  'FLUSH_FAILURE',
  {
    flushThrowsOnCall:
      1
  }
);

runUncertainCase(
  'POST_VALUE_MISMATCH',
  {
    postValueDrift:
      true
  }
);

runUncertainCase(
  'POST_FORMULA_MISMATCH',
  {
    postFormulaDrift:
      true
  }
);

runUncertainCase(
  'POST_GEOMETRY_MISMATCH',
  {
    postGeometryDrift:
      true
  }
);

runUncertainCase(
  'POST_DUPLICATE_ID',
  {
    postDuplicateId:
      true
  }
);

runUncertainCase(
  'POST_MOVED_ID',
  {
    postMoveId:
      true
  }
);

runUncertainCase(
  'POST_HEADER_DRIFT',
  {
    postHeaderDrift:
      true
  }
);

runUncertainCase(
  'POST_SHEET_ID_DRIFT',
  {
    postSheetIdDrift:
      true
  }
);

runUncertainCase(
  'POST_SPREADSHEET_ID_DRIFT',
  {
    postSpreadsheetIdDrift:
      true
  }
);

console.log(
  'UNCERTAIN_EXECUTION_CASES=11'
);

console.log(
  'DATABASE_PHYSICAL_ROW_REPLACE_EXACT_IMPLEMENTATION_VALIDATOR_PASS=true'
);

console.log(
  'EXACTLY_ONE_FULL_ROW_SETVALUES_WRITE_VERIFIED=true'
);

console.log(
  'FORMULA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'FORMULA_PRESERVATION_VERIFIED=true'
);

console.log(
  'IDENTITY_IMMUTABILITY_VERIFIED=true'
);

console.log(
  'PREWRITE_FAILURES_ZERO_WRITE_VERIFIED=true'
);

console.log(
  'POSTWRITE_FAILURES_UNCERTAIN_VERIFIED=true'
);

console.log(
  'AUTOMATIC_RETRY_PRESENT=false'
);

console.log(
  'AUTOMATIC_ROLLBACK_PRESENT=false'
);

console.log(
  'EXISTING_PATCH_PRIMITIVE_REMAINS_EXACT_THREE_HEADERS=true'
);
