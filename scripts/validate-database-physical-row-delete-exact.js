'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const databasePath = 'build/apps-script-brand/Database.js';
const source = fs.readFileSync(databasePath, 'utf8');

const EXPECT_ABSENT = process.argv.includes('--expect-absent');
const HARNESS_SELF_TEST = process.argv.includes('--harness-self-test');

function pass(message) {
  console.log('PASS: ' + message);
}

function expectThrow(fn, pattern) {
  let error = null;
  try {
    fn();
  } catch (caught) {
    error = caught;
  }
  assert.ok(error, 'Expected operation to throw');
  assert.match(String(error.message || error), pattern);
  return error;
}

function loadDatabase(sandbox) {
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'Database.js' });
  return sandbox.REOS.Database;
}

console.log('=== DATABASE PHYSICAL ROW DELETE EXACT VALIDATOR ===');

assert.ok(source.includes('function withScriptLockContext(work)'));
assert.ok(source.includes('function validateLockContext_(context)'));

const hasImplementation =
  /function\s+deletePhysicalRowExact\s*\(/.test(source) ||
  /deletePhysicalRowExact\s*:/.test(source);

if (EXPECT_ABSENT) {
  assert.equal(hasImplementation, false, 'Primitive unexpectedly exists before implementation gate');
  pass('physical-row delete primitive is absent before implementation');
  console.log('PREIMPLEMENTATION_SENTINEL=PASS');
  process.exit(0);
}

if (HARNESS_SELF_TEST === false) {
  assert.equal(
    hasImplementation,
    true,
    'PRIMITIVE_IMPLEMENTATION_REQUIRED'
  );
}


function clone2d(matrix) {
  return matrix.map((row) => row.slice());
}

function createSheetModel(options = {}) {
  const values = clone2d(options.values || [
    ['Record ID', 'Value', 'Computed'],
    ['A-1', 'alpha', 10],
    ['B-2', 'beta', 20],
    ['C-3', 'gamma', 30]
  ]);

  const formulas = clone2d(options.formulas || [
    ['', '', ''],
    ['', '', '=5+5'],
    ['', '', '=10+10'],
    ['', '', '=15+15']
  ]);

  assert.equal(values.length, formulas.length);
  assert.ok(values.length >= 2);

  const width = values[0].length;

  values.forEach((row) => assert.equal(row.length, width));
  formulas.forEach((row) => assert.equal(row.length, width));

  let maxRows = options.maxRows || 12;
  let maxColumns = options.maxColumns || width;

  assert.ok(maxRows >= values.length);
  assert.ok(maxColumns >= width);

  const state = {
    getRangeCalls: [],
    valueReads: 0,
    formulaReads: 0,
    deleteRowCalls: []
  };

  function readMatrix(matrix, row, column, rowCount, columnCount) {
    const result = [];

    for (let r = 0; r < rowCount; r += 1) {
      const out = [];

      for (let c = 0; c < columnCount; c += 1) {
        const sourceRow = matrix[row - 1 + r];
        const value =
          sourceRow && sourceRow[column - 1 + c] !== undefined
            ? sourceRow[column - 1 + c]
            : '';

        out.push(value);
      }

      result.push(out);
    }

    return result;
  }

  const sheet = {
    getName() {
      return options.sheetName || 'TEST';
    },

    getSheetId() {
      return options.sheetId === undefined ? 4242 : options.sheetId;
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

    getRange(row, column, rowCount, columnCount) {
      assert.ok(Number.isInteger(row) && row > 0);
      assert.ok(Number.isInteger(column) && column > 0);
      assert.ok(Number.isInteger(rowCount) && rowCount > 0);
      assert.ok(Number.isInteger(columnCount) && columnCount > 0);

      state.getRangeCalls.push({
        row,
        column,
        rowCount,
        columnCount
      });

      return {
        getValues() {
          state.valueReads += 1;
          return readMatrix(values, row, column, rowCount, columnCount);
        },

        getFormulas() {
          state.formulaReads += 1;
          return readMatrix(formulas, row, column, rowCount, columnCount);
        }
      };
    },

    deleteRow(rowNumber) {
      state.deleteRowCalls.push(rowNumber);

      if (options.deleteThrowsBeforeMutation === true) {
        throw new Error('injected delete failure before mutation');
      }

      assert.ok(Number.isInteger(rowNumber));
      assert.ok(rowNumber > 1);
      assert.ok(rowNumber <= values.length);

      values.splice(rowNumber - 1, 1);
      formulas.splice(rowNumber - 1, 1);
      maxRows -= 1;

      if (options.deleteThrowsAfterMutation === true) {
        throw new Error('injected delete failure after mutation');
      }
    }
  };

  return {
    sheet,
    state,
    values,
    formulas,
    snapshot() {
      return {
        values: clone2d(values),
        formulas: clone2d(formulas),
        maxRows,
        maxColumns
      };
    }
  };
}

function createRuntimeHarness(options = {}) {
  const model = createSheetModel(options);

  const state = {
    events: [],
    tryCalls: [],
    waitCalls: [],
    hasLockCalls: 0,
    releaseCalls: 0,
    flushCalls: 0,
    getScriptLockCalls: 0,
    getActiveSpreadsheetCalls: 0,
    getSheetByNameCalls: []
  };

  let held = false;

  const lock = {
    waitLock(timeout) {
      state.waitCalls.push(timeout);
      state.events.push("wait:" + timeout);
      held = true;
    },

    tryLock(timeout) {
      state.tryCalls.push(timeout);
      state.events.push("try:" + timeout);

      if (options.lockAvailable === false) {
        return false;
      }

      held = true;
      return true;
    },

    hasLock() {
      state.hasLockCalls += 1;
      return held;
    },

    releaseLock() {
      state.releaseCalls += 1;
      state.events.push("release");
      held = false;
    }
  };

  const spreadsheet = {
    getId() {
      return options.spreadsheetId || "SPREADSHEET-1";
    },

    getSheetByName(name) {
      state.getSheetByNameCalls.push(name);
      state.events.push("sheet:" + name);

      if (name !== model.sheet.getName()) {
        return null;
      }

      return model.sheet;
    }
  };

  const sandbox = {
    REOS: {
      generateId_() {
        return "TEST-ID";
      },

      Logger: null
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        state.getActiveSpreadsheetCalls += 1;
        state.events.push("activeSpreadsheet");
        return spreadsheet;
      },

      flush() {
        state.flushCalls += 1;
        state.events.push("flush");

        if (options.flushThrows === true) {
          throw new Error("injected flush failure");
        }
      }
    },

    LockService: {
      getScriptLock() {
        state.getScriptLockCalls += 1;
        state.events.push("getScriptLock");
        return lock;
      }
    },

    console
  };

  const db = loadDatabase(sandbox);

  return {
    db,
    sandbox,
    spreadsheet,
    sheet: model.sheet,
    model,
    state,
    lock,

    forceLockLoss() {
      held = false;
    },

    forceLockHeld() {
      held = true;
    },

    lockIsHeld() {
      return held;
    }
  };
}

function runHarnessModelSelfTests() {
  {
    const model = createSheetModel();

    assert.equal(model.sheet.getLastRow(), 4);
    assert.equal(model.sheet.getLastColumn(), 3);
    assert.equal(model.sheet.getMaxRows(), 12);
    assert.equal(model.sheet.getMaxColumns(), 3);

    const values = model.sheet.getRange(2, 1, 2, 3).getValues();
    const formulas = model.sheet.getRange(2, 1, 2, 3).getFormulas();

    assert.deepEqual(values, [
      ["A-1", "alpha", 10],
      ["B-2", "beta", 20]
    ]);

    assert.deepEqual(formulas, [
      ["", "", "=5+5"],
      ["", "", "=10+10"]
    ]);

    assert.equal(model.state.valueReads, 1);
    assert.equal(model.state.formulaReads, 1);
  }

  pass("raw values and formulas are independently modeled");

  {
    const model = createSheetModel();

    model.sheet.deleteRow(3);

    assert.deepEqual(model.state.deleteRowCalls, [3]);
    assert.equal(model.sheet.getLastRow(), 3);
    assert.equal(model.sheet.getMaxRows(), 11);

    assert.deepEqual(model.values, [
      ["Record ID", "Value", "Computed"],
      ["A-1", "alpha", 10],
      ["C-3", "gamma", 30]
    ]);

    assert.deepEqual(model.formulas, [
      ["", "", ""],
      ["", "", "=5+5"],
      ["", "", "=15+15"]
    ]);
  }

  pass("physical delete shifts values and formulas together");

  {
    const model = createSheetModel({
      deleteThrowsBeforeMutation: true
    });

    const before = model.snapshot();

    expectThrow(
      () => model.sheet.deleteRow(3),
      /before mutation/
    );

    assert.deepEqual(model.snapshot(), before);
    assert.deepEqual(model.state.deleteRowCalls, [3]);
  }

  pass("injected pre-mutation delete failure preserves physical state");

  {
    const model = createSheetModel({
      deleteThrowsAfterMutation: true
    });

    expectThrow(
      () => model.sheet.deleteRow(3),
      /after mutation/
    );

    assert.equal(model.sheet.getLastRow(), 3);
    assert.equal(model.sheet.getMaxRows(), 11);
    assert.equal(model.values[2][0], "C-3");
  }

  pass("injected post-mutation failure preserves uncertain mutated state");

  {
    const h = createRuntimeHarness();

    assert.equal(h.spreadsheet.getId(), "SPREADSHEET-1");
    assert.equal(h.sheet.getName(), "TEST");
    assert.equal(h.sheet.getSheetId(), 4242);

    let seenContext = null;

    h.db.withScriptLockContext((lockContext) => {
      seenContext = lockContext;

      assert.equal(Object.isFrozen(lockContext), true);
      assert.equal(h.lockIsHeld(), true);

      const resolved = h.db.getSheet("TEST");
      assert.strictEqual(resolved, h.sheet);
    });

    assert.ok(seenContext);
    assert.deepEqual(h.state.tryCalls, [1000]);
    assert.deepEqual(h.state.waitCalls, []);
    assert.equal(h.state.getScriptLockCalls, 1);
    assert.equal(h.state.getActiveSpreadsheetCalls, 1);
    assert.deepEqual(h.state.getSheetByNameCalls, ["TEST"]);
    assert.equal(h.state.flushCalls, 1);
    assert.equal(h.state.releaseCalls, 1);
    assert.equal(h.lockIsHeld(), false);
  }

  pass("runtime sandbox models caller-owned lock and spreadsheet identity");

  {
    const h = createRuntimeHarness();

    h.forceLockHeld();
    assert.equal(h.lockIsHeld(), true);

    h.forceLockLoss();
    assert.equal(h.lockIsHeld(), false);
  }

  pass("runtime sandbox can inject lock loss");
}

if (HARNESS_SELF_TEST) {
  runHarnessModelSelfTests();
  console.log("HARNESS_MODEL_SELF_TEST=PASS");
}

function canonicalizeHarnessValue(value) {
  if (value === '') {
    return { type: 'blank' };
  }

  if (typeof value === 'string') {
    return { type: 'string', value };
  }

  if (typeof value === 'number') {
    assert.equal(Number.isFinite(value), true);

    return {
      type: 'number',
      value: Object.is(value, -0) ? "0" : String(value)
    };
  }

  if (typeof value === 'boolean') {
    return { type: 'boolean', value };
  }

  if (
    Object.prototype.toString.call(value) === "[object Date]" &&
    Number.isFinite(value.getTime())
  ) {
    return {
      type: 'date',
      value: value.toISOString()
    };
  }

  throw new Error('UNSUPPORTED_HARNESS_CELL_VALUE');
}

function buildDeleteRequest(h, rowNumber, idField) {
  const sheet = h.sheet;
  const lastColumn = sheet.getLastColumn();

  const headers =
    sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  const idColumn =
    headers.indexOf(idField) + 1;

  assert.ok(idColumn > 0);

  const rowValues =
    sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];

  const rowFormulas =
    sheet.getRange(rowNumber, 1, 1, lastColumn).getFormulas()[0];

  return {
    spreadsheetId: h.spreadsheet.getId(),
    sheetId: sheet.getSheetId(),
    expectedRowNumber: rowNumber,
    idField,
    idValue: String(rowValues[idColumn - 1]),
    expectedLastRow: sheet.getLastRow(),
    expectedLastColumn: lastColumn,
    expectedMaxRows: sheet.getMaxRows(),
    expectedMaxColumns: sheet.getMaxColumns(),
    expectedHeaders: headers.slice(),
    expectedRowValues: rowValues.map(canonicalizeHarnessValue),
    expectedRowFormulas: rowFormulas.slice()
  };
}

function cloneRequest(request) {
  return {
    spreadsheetId: request.spreadsheetId,
    sheetId: request.sheetId,
    expectedRowNumber: request.expectedRowNumber,
    idField: request.idField,
    idValue: request.idValue,
    expectedLastRow: request.expectedLastRow,
    expectedLastColumn: request.expectedLastColumn,
    expectedMaxRows: request.expectedMaxRows,
    expectedMaxColumns: request.expectedMaxColumns,
    expectedHeaders: request.expectedHeaders.slice(),
    expectedRowValues: request.expectedRowValues.map((value) => ({ ...value })),
    expectedRowFormulas: request.expectedRowFormulas.slice()
  };
}

function runRequestBuilderSelfTests() {
  assert.deepEqual(
    canonicalizeHarnessValue(""),
    { type: 'blank' }
  );

  assert.deepEqual(
    canonicalizeHarnessValue("alpha"),
    { type: 'string', value: 'alpha' }
  );

  assert.deepEqual(
    canonicalizeHarnessValue(20),
    { type: 'number', value: '20' }
  );

  assert.deepEqual(
    canonicalizeHarnessValue(-0),
    { type: 'number', value: '0' }
  );

  assert.deepEqual(
    canonicalizeHarnessValue(true),
    { type: 'boolean', value: true }
  );

  assert.deepEqual(
    canonicalizeHarnessValue(false),
    { type: 'boolean', value: false }
  );

  assert.deepEqual(
    canonicalizeHarnessValue(
      new Date('2026-09-14T00:00:00.000Z')
    ),
    {
      type: 'date',
      value: '2026-09-14T00:00:00.000Z'
    }
  );

  expectThrow(
    () => canonicalizeHarnessValue({}),
    /UNSUPPORTED_HARNESS_CELL_VALUE/
  );

  pass("independent canonical value builder covers allowed types");

  const h = createRuntimeHarness();
  const request = buildDeleteRequest(h, 3, "Record ID");

  const expectedKeys = [
    'expectedHeaders',
    'expectedLastColumn',
    'expectedLastRow',
    'expectedMaxColumns',
    'expectedMaxRows',
    'expectedRowFormulas',
    'expectedRowNumber',
    'expectedRowValues',
    'idField',
    'idValue',
    'sheetId',
    'spreadsheetId'
  ];

  assert.deepEqual(
    Object.keys(request).sort(),
    expectedKeys.slice().sort()
  );

  assert.equal(request.spreadsheetId, "SPREADSHEET-1");
  assert.equal(request.sheetId, 4242);
  assert.equal(request.expectedRowNumber, 3);
  assert.equal(request.idField, "Record ID");
  assert.equal(request.idValue, "B-2");
  assert.equal(request.expectedLastRow, 4);
  assert.equal(request.expectedLastColumn, 3);
  assert.equal(request.expectedMaxRows, 12);
  assert.equal(request.expectedMaxColumns, 3);

  assert.deepEqual(request.expectedHeaders, [
    "Record ID",
    "Value",
    "Computed"
  ]);

  assert.deepEqual(request.expectedRowValues, [
    { type: 'string', value: 'B-2' },
    { type: 'string', value: 'beta' },
    { type: 'number', value: '20' }
  ]);

  assert.deepEqual(request.expectedRowFormulas, [
    "",
    "",
    "=10+10"
  ]);

  pass("request builder emits exact twelve-field contract");

  const cloned = cloneRequest(request);

  cloned.expectedHeaders[0] = "Changed";
  cloned.expectedRowValues[0].value = 'changed';
  cloned.expectedRowFormulas[2] = "=0";

  assert.equal(request.expectedHeaders[0], "Record ID");
  assert.equal(request.expectedRowValues[0].value, "B-2");
  assert.equal(request.expectedRowFormulas[2], "=10+10");

  pass("request mutation helper preserves independent baseline evidence");
}

if (HARNESS_SELF_TEST) {
  runRequestBuilderSelfTests();
  console.log("REQUEST_BUILDER_SELF_TEST=PASS");
}

const PRECONDITION_CLASSIFICATION = 'PHYSICAL_DELETE_PRECONDITION_FAILED';

function buildPreconditionMatrix() {
  return [
    { id: 'REQUEST_NULL', category: 'structure' },
    { id: 'OPTIONS_NULL', category: 'structure' },
    { id: 'UNKNOWN_REQUEST_FIELD', category: 'structure' },
    { id: 'MISSING_REQUEST_FIELD', category: 'structure' },
    { id: 'EXPECTED_ROW_HEADER', category: 'structure' },
    { id: 'EXPECTED_ARRAY_LENGTH_MISMATCH', category: 'structure' },

    { id: 'FORGED_LOCK_CONTEXT', category: 'lock' },
    { id: 'RELEASED_LOCK_CONTEXT', category: 'lock' },
    { id: 'REPLAYED_LOCK_CONTEXT', category: 'lock' },
    { id: 'LOCK_LOST_BEFORE_MUTATION', category: 'lock' },

    { id: 'WRONG_SPREADSHEET_ID', category: 'identity' },
    { id: 'MISSING_SHEET', category: 'identity' },
    { id: 'WRONG_SHEET_ID', category: 'identity' },
    { id: 'RESOLVED_SHEET_NAME_DRIFT', category: 'identity' },

    { id: 'LAST_ROW_DRIFT', category: 'geometry' },
    { id: 'LAST_COLUMN_DRIFT', category: 'geometry' },
    { id: 'MAX_ROWS_DRIFT', category: 'geometry' },
    { id: 'MAX_COLUMNS_DRIFT', category: 'geometry' },

    { id: 'HEADER_VALUE_DRIFT', category: 'header' },
    { id: 'BLANK_HEADER', category: 'header' },
    { id: 'DUPLICATE_HEADER_CASEFOLD', category: 'header' },
    { id: 'ID_FIELD_MISSING', category: 'header' },

    { id: 'ID_VALUE_BLANK', category: 'identity-column' },
    { id: 'ID_ZERO_MATCH', category: 'identity-column' },
    { id: 'ID_DUPLICATE_MATCH', category: 'identity-column' },
    { id: 'PHYSICAL_ROW_MISMATCH', category: 'identity-column' },

    { id: 'ROW_VALUE_DRIFT', category: 'row-evidence' },
    { id: 'FORMULA_DRIFT', category: 'row-evidence' },
    { id: 'UNKNOWN_CANONICAL_TYPE', category: 'row-evidence' },
    { id: 'INVALID_CANONICAL_NUMBER', category: 'row-evidence' },
    { id: 'FORMULA_ENTRY_NONSTRING', category: 'row-evidence' },
    { id: 'UNSUPPORTED_RAW_CELL_TYPE', category: 'row-evidence' }
  ].map((entry) => ({
    ...entry,
    classification: PRECONDITION_CLASSIFICATION,
    expectedDeleteCalls: 0
  }));
}

function runPreconditionMatrixDefinitionSelfTests() {
  const matrix = buildPreconditionMatrix();

  assert.equal(matrix.length, 32);

  const ids = matrix.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);

  matrix.forEach((entry) => {
    assert.equal(entry.classification, PRECONDITION_CLASSIFICATION);
    assert.equal(entry.expectedDeleteCalls, 0);
    assert.match(entry.id, /^[A-Z0-9_]+$/);
    assert.equal(typeof entry.category, "string");
    assert.ok(entry.category.length > 0);
  });

  const requiredCategories = [
    'structure',
    'lock',
    'identity',
    'geometry',
    'header',
    'identity-column',
    'row-evidence'
  ];

  const actualCategories =
    Array.from(new Set(matrix.map((entry) => entry.category))).sort();

  assert.deepEqual(actualCategories, requiredCategories.slice().sort());

  const requiredIds = [
    'UNKNOWN_REQUEST_FIELD',
    'FORGED_LOCK_CONTEXT',
    'RELEASED_LOCK_CONTEXT',
    'REPLAYED_LOCK_CONTEXT',
    'LOCK_LOST_BEFORE_MUTATION',
    'WRONG_SPREADSHEET_ID',
    'WRONG_SHEET_ID',
    'LAST_ROW_DRIFT',
    'LAST_COLUMN_DRIFT',
    'MAX_ROWS_DRIFT',
    'MAX_COLUMNS_DRIFT',
    'BLANK_HEADER',
    'DUPLICATE_HEADER_CASEFOLD',
    'ID_ZERO_MATCH',
    'ID_DUPLICATE_MATCH',
    'PHYSICAL_ROW_MISMATCH',
    'ROW_VALUE_DRIFT',
    'FORMULA_DRIFT',
    'UNKNOWN_CANONICAL_TYPE',
    'UNSUPPORTED_RAW_CELL_TYPE'
  ];

  requiredIds.forEach((id) => {
    assert.equal(ids.includes(id), true, "Missing matrix case: " + id);
  });

  pass("precondition matrix contains 32 unique fail-closed cases");
  pass("all precondition cases require zero physical delete calls");
  pass("structure/lock/identity/geometry/header/ID/row evidence are covered");
}

if (HARNESS_SELF_TEST) {
  runPreconditionMatrixDefinitionSelfTests();
  console.log("PRECONDITION_MATRIX_SELF_TEST=PASS");
}

function preparePreconditionCase(caseId) {
  const h = createRuntimeHarness();
  const request = buildDeleteRequest(h, 3, "Record ID");

  const prepared = {
    id: caseId,
    h,
    sheetName: "TEST",
    request: cloneRequest(request),
    optionsMode: "OWNER_CONTEXT",
    expectedDeleteCalls: 0
  };

  switch (caseId) {
    case 'REQUEST_NULL':
      prepared.request = null;
      break;

    case 'OPTIONS_NULL':
      prepared.optionsMode = "NULL_OPTIONS";
      break;

    case 'UNKNOWN_REQUEST_FIELD':
      prepared.request.unexpectedField = true;
      break;

    case 'MISSING_REQUEST_FIELD':
      delete prepared.request.expectedRowFormulas;
      break;

    case 'EXPECTED_ROW_HEADER':
      prepared.request.expectedRowNumber = 1;
      break;

    case 'EXPECTED_ARRAY_LENGTH_MISMATCH':
      prepared.request.expectedRowValues.pop();
      break;

    case 'FORGED_LOCK_CONTEXT':
      prepared.optionsMode = "FORGED_CONTEXT";
      break;

    case 'RELEASED_LOCK_CONTEXT':
      prepared.optionsMode = "RELEASED_CONTEXT";
      break;

    case 'REPLAYED_LOCK_CONTEXT':
      prepared.optionsMode = "REPLAYED_CONTEXT";
      break;

    case 'LOCK_LOST_BEFORE_MUTATION':
      prepared.optionsMode = "LOSE_LOCK_BEFORE_MUTATION";
      break;

    case 'WRONG_SPREADSHEET_ID':
      prepared.request.spreadsheetId = "WRONG-SPREADSHEET";
      break;

    case 'MISSING_SHEET':
      prepared.sheetName = "MISSING";
      break;

    case 'WRONG_SHEET_ID':
      prepared.request.sheetId += 1;
      break;

    case 'RESOLVED_SHEET_NAME_DRIFT':
      h.spreadsheet.getSheetByName = () => h.sheet;
      h.sheet.getName = () => "RENAMED";
      break;

    case 'LAST_ROW_DRIFT':
      h.model.values.push(["D-4", "delta", 40]);
      h.model.formulas.push(["", "", "=20+20"]);
      break;

    case 'LAST_COLUMN_DRIFT': {
      const original = h.sheet.getLastColumn.bind(h.sheet);
      h.sheet.getLastColumn = () => original() + 1;
      break;
    }

    case 'MAX_ROWS_DRIFT': {
      const original = h.sheet.getMaxRows.bind(h.sheet);
      h.sheet.getMaxRows = () => original() + 1;
      break;
    }

    case 'MAX_COLUMNS_DRIFT': {
      const original = h.sheet.getMaxColumns.bind(h.sheet);
      h.sheet.getMaxColumns = () => original() + 1;
      break;
    }

    case 'HEADER_VALUE_DRIFT':
      h.model.values[0][1] = "Changed Header";
      break;

    case 'BLANK_HEADER':
      h.model.values[0][1] = " ";
      break;

    case 'DUPLICATE_HEADER_CASEFOLD':
      h.model.values[0][1] = " record id ";
      break;

    case 'ID_FIELD_MISSING':
      prepared.request.idField = "Missing ID";
      break;

    case 'ID_VALUE_BLANK':
      prepared.request.idValue = "";
      break;

    case 'ID_ZERO_MATCH':
      prepared.request.idValue = "NOT-PRESENT";
      break;

    case 'ID_DUPLICATE_MATCH':
      h.model.values[1][0] = "B-2";
      break;

    case 'PHYSICAL_ROW_MISMATCH':
      prepared.request.expectedRowNumber = 2;
      break;

    case 'ROW_VALUE_DRIFT':
      prepared.request.expectedRowValues[1].value = 'changed';
      break;

    case 'FORMULA_DRIFT':
      prepared.request.expectedRowFormulas[2] = "=999";
      break;

    case 'UNKNOWN_CANONICAL_TYPE':
      prepared.request.expectedRowValues[1] = {
        type: 'mystery',
        value: 'beta'
      };
      break;

    case 'INVALID_CANONICAL_NUMBER':
      prepared.request.expectedRowValues[2] = {
        type: 'number',
        value: 'Infinity'
      };
      break;

    case 'FORMULA_ENTRY_NONSTRING':
      prepared.request.expectedRowFormulas[2] = 42;
      break;

    case 'UNSUPPORTED_RAW_CELL_TYPE':
      h.model.values[2][1] = { unsupported: true };
      break;

    default:
      throw new Error("UNKNOWN_PRECONDITION_CASE:" + caseId);
  }

  return prepared;
}

function summarizePreparedCase(prepared) {
  return {
    id: prepared.id,
    sheetName: prepared.sheetName,
    optionsMode: prepared.optionsMode,
    requestIsNull: prepared.request === null,
    expectedDeleteCalls: prepared.expectedDeleteCalls
  };
}

function runPreparedCaseDefinitionSelfTests() {
  const matrix = buildPreconditionMatrix();

  const prepared =
    matrix.map((entry) => preparePreconditionCase(entry.id));

  assert.equal(prepared.length, 32);

  assert.deepEqual(
    prepared.map((entry) => entry.id),
    matrix.map((entry) => entry.id)
  );

  prepared.forEach((entry) => {
    assert.equal(entry.expectedDeleteCalls, 0);
    assert.ok(entry.h);
    assert.ok(entry.sheetName);
    assert.ok(entry.optionsMode);
  });

  const byId =
    Object.fromEntries(prepared.map((entry) => [entry.id, entry]));

  assert.equal(byId.REQUEST_NULL.request, null);
  assert.equal(byId.OPTIONS_NULL.optionsMode, "NULL_OPTIONS");
  assert.equal(byId.FORGED_LOCK_CONTEXT.optionsMode, "FORGED_CONTEXT");
  assert.equal(byId.RELEASED_LOCK_CONTEXT.optionsMode, "RELEASED_CONTEXT");
  assert.equal(byId.REPLAYED_LOCK_CONTEXT.optionsMode, "REPLAYED_CONTEXT");
  assert.equal(
    byId.LOCK_LOST_BEFORE_MUTATION.optionsMode,
    "LOSE_LOCK_BEFORE_MUTATION"
  );

  assert.equal(
    byId.WRONG_SPREADSHEET_ID.request.spreadsheetId,
    "WRONG-SPREADSHEET"
  );

  assert.equal(byId.MISSING_SHEET.sheetName, "MISSING");

  assert.equal(
    byId.RESOLVED_SHEET_NAME_DRIFT.h.sheet.getName(),
    "RENAMED"
  );

  assert.equal(
    byId.LAST_ROW_DRIFT.h.sheet.getLastRow(),
    5
  );

  assert.equal(
    byId.ID_DUPLICATE_MATCH.h.model.values[1][0],
    "B-2"
  );

  assert.equal(
    byId.ID_DUPLICATE_MATCH.h.model.values[2][0],
    "B-2"
  );

  assert.equal(
    byId.FORMULA_ENTRY_NONSTRING.request.expectedRowFormulas[2],
    42
  );

  assert.deepEqual(
    byId.UNSUPPORTED_RAW_CELL_TYPE.h.model.values[2][1],
    { unsupported: true }
  );

  prepared.forEach((entry) => {
    assert.deepEqual(
      entry.h.model.state.deleteRowCalls,
      [],
      entry.id + " setup mutated physical rows"
    );
  });

  pass("all 32 precondition IDs bind to executable setup state");
  pass("lock cases bind to explicit future invocation modes");
  pass("case preparation performs zero physical deletions");
}

if (HARNESS_SELF_TEST) {
  runPreparedCaseDefinitionSelfTests();
  console.log("PRECONDITION_BINDING_SELF_TEST=PASS");
}

function captureReleasedContext(h) {
  let released = null;

  h.db.withScriptLockContext((lockContext) => {
    released = lockContext;
  });

  assert.ok(released);
  assert.equal(h.lockIsHeld(), false);

  return released;
}

function withReacquiredLockEpoch(h, work) {
  let stale = null;

  h.db.withScriptLockContext((lockContext) => {
    stale = lockContext;
  });

  assert.ok(stale);
  assert.equal(h.lockIsHeld(), false);

  return h.db.withScriptLockContext((fresh) => {
    assert.ok(fresh);
    assert.notStrictEqual(fresh, stale);
    assert.equal(h.lockIsHeld(), true);

    return work({
      stale,
      fresh
    });
  });
}

function installLockLossBeforeMutation(prepared) {
  const h = prepared.h;
  const request = prepared.request;
  const originalGetRange = h.sheet.getRange.bind(h.sheet);
  let armed = true;

  h.sheet.getRange = function (
    row,
    column,
    rowCount,
    columnCount
  ) {
    const range = originalGetRange(
      row,
      column,
      rowCount,
      columnCount
    );

    if (
      armed === true &&
      request &&
      row === request.expectedRowNumber &&
      column === 1 &&
      rowCount === 1 &&
      columnCount === request.expectedLastColumn
    ) {
      const originalGetFormulas =
        range.getFormulas.bind(range);

      range.getFormulas = function () {
        const result = originalGetFormulas();

        if (armed === true) {
          armed = false;
          h.state.events.push("forcedLockLossAfterFormulaRead");
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

function finalizePreparedCaseForExecution(prepared) {
  if (
    prepared.id === "BLANK_HEADER" &&
    prepared.request
  ) {
    prepared.request.expectedHeaders[1] = " ";
  }

  if (
    prepared.id === "DUPLICATE_HEADER_CASEFOLD" &&
    prepared.request
  ) {
    prepared.request.expectedHeaders[1] = " record id ";
  }

  return prepared;
}

function callPhysicalDeletePrimitive(prepared, options) {
  const primitive =
    prepared.h.db.deletePhysicalRowExact;

  if (typeof primitive !== "function") {
    throw new Error(
      "PRIMITIVE_NOT_AVAILABLE_TO_RUN_CASE"
    );
  }

  return primitive(
    prepared.sheetName,
    prepared.request,
    options
  );
}

function executePreparedCase(prepared) {
  finalizePreparedCaseForExecution(prepared);

  const h = prepared.h;

  switch (prepared.optionsMode) {
    case "NULL_OPTIONS":
      return callPhysicalDeletePrimitive(
        prepared,
        null
      );

    case "FORGED_CONTEXT":
      return callPhysicalDeletePrimitive(
        prepared,
        {
          lockContext: {
            lock: h.lock
          }
        }
      );

    case "RELEASED_CONTEXT": {
      const released =
        captureReleasedContext(h);

      return callPhysicalDeletePrimitive(
        prepared,
        {
          lockContext: released
        }
      );
    }

    case "REPLAYED_CONTEXT":
      return withReacquiredLockEpoch(
        h,
        ({ stale }) =>
          callPhysicalDeletePrimitive(
            prepared,
            {
              lockContext: stale
            }
          )
      );

    case "LOSE_LOCK_BEFORE_MUTATION":
      installLockLossBeforeMutation(prepared);

      return h.db.withScriptLockContext(
        (lockContext) =>
          callPhysicalDeletePrimitive(
            prepared,
            { lockContext }
          )
      );

    case "OWNER_CONTEXT":
      return h.db.withScriptLockContext(
        (lockContext) =>
          callPhysicalDeletePrimitive(
            prepared,
            { lockContext }
          )
      );

    default:
      throw new Error(
        "UNKNOWN_OPTIONS_MODE:" +
        prepared.optionsMode
      );
  }
}

function runInvocationMachinerySelfTests() {
  {
    const h = createRuntimeHarness();
    const released = captureReleasedContext(h);

    assert.equal(Object.isFrozen(released), true);
    assert.equal(h.lockIsHeld(), false);

    expectThrow(
      () =>
        h.db.insert(
          "TEST",
          { Value: "released" },
          { lockContext: released }
        ),
      /lock context|no longer owns ScriptLock/i
    );
  }

  pass("released lock context is genuinely revoked");

  {
    const h = createRuntimeHarness();

    withReacquiredLockEpoch(
      h,
      ({ stale, fresh }) => {
        assert.equal(h.lockIsHeld(), true);
        assert.notStrictEqual(stale, fresh);

        expectThrow(
          () =>
            h.db.insert(
              "TEST",
              { Value: "stale-replay" },
              { lockContext: stale }
            ),
          /lock context|no longer owns ScriptLock/i
        );
      }
    );

    assert.deepEqual(h.state.tryCalls, [1000, 1000]);
    assert.equal(h.state.flushCalls, 2);
    assert.equal(h.state.releaseCalls, 2);
    assert.equal(h.lockIsHeld(), false);
  }

  pass("reacquiring same ScriptLock does not revive stale context");

  {
    const prepared =
      preparePreconditionCase(
        "LOCK_LOST_BEFORE_MUTATION"
      );

    const hook =
      installLockLossBeforeMutation(prepared);

    prepared.h.forceLockHeld();
    assert.equal(prepared.h.lockIsHeld(), true);

    prepared.h.sheet
      .getRange(
        prepared.request.expectedRowNumber,
        1,
        1,
        prepared.request.expectedLastColumn
      )
      .getFormulas();

    assert.equal(hook.isArmed(), false);
    assert.equal(prepared.h.lockIsHeld(), false);
    assert.equal(
      prepared.h.state.events.includes(
        "forcedLockLossAfterFormulaRead"
      ),
      true
    );
    assert.deepEqual(
      prepared.h.model.state.deleteRowCalls,
      []
    );
  }

  pass("lock loss can be injected after formula evidence and before delete");

  {
    const blank =
      preparePreconditionCase("BLANK_HEADER");

    finalizePreparedCaseForExecution(blank);

    assert.equal(blank.h.model.values[0][1], " ");
    assert.equal(blank.request.expectedHeaders[1], " ");

    const duplicate =
      preparePreconditionCase(
        "DUPLICATE_HEADER_CASEFOLD"
      );

    finalizePreparedCaseForExecution(duplicate);

    assert.equal(
      duplicate.h.model.values[0][1],
      " record id "
    );
    assert.equal(
      duplicate.request.expectedHeaders[1],
      " record id "
    );
  }

  pass("blank/duplicate header cases reach semantic header checks");

  {
    const prepared =
      preparePreconditionCase(
        "WRONG_SPREADSHEET_ID"
      );

    const primitiveAvailable =
      typeof prepared.h.db
        .deletePhysicalRowExact ===
      "function";

    const expectedFailure =
      primitiveAvailable
        ? /PHYSICAL_DELETE_PRECONDITION_FAILED/
        : /PRIMITIVE_NOT_AVAILABLE_TO_RUN_CASE/;

    expectThrow(
      () => executePreparedCase(prepared),
      expectedFailure
    );

    assert.deepEqual(
      prepared.h.model.state.deleteRowCalls,
      []
    );
  }

  pass(
    "common runner rejects invalid case before mutation across implementation states"
  );
}

if (HARNESS_SELF_TEST) {
  runInvocationMachinerySelfTests();
  console.log("INVOCATION_MACHINERY_SELF_TEST=PASS");
}

function observableClassificationText(value) {
  const parts = [];

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    parts.push(value);
  }

  if (typeof value === "object") {
    [
      "classification",
      "outcome",
      "status",
      "code",
      "name",
      "message"
    ].forEach((key) => {
      if (
        Object.prototype.hasOwnProperty.call(value, key) &&
        value[key] !== null &&
        value[key] !== undefined
      ) {
        parts.push(String(value[key]));
      }
    });
  }

  parts.push(String(value));

  return parts.join(" | ");
}

function assertObservableClassification(value, expected) {
  const observable = observableClassificationText(value);

  assert.equal(
    observable.includes(expected),
    true,
    "Missing observable classification " +
      expected +
      " in: " +
      observable
  );
}

function captureThrown(fn) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert.ok(error, "Expected operation to throw");
  return error;
}

function assertPreconditionExecution(caseId) {
  const prepared =
    preparePreconditionCase(caseId);

  const before =
    prepared.h.model.snapshot();

  const error =
    captureThrown(() =>
      executePreparedCase(prepared)
    );

  assertObservableClassification(
    error,
    PRECONDITION_CLASSIFICATION
  );

  assert.equal(
    prepared.h.model.state.deleteRowCalls.length,
    0,
    caseId + " invoked physical deletion"
  );

  assert.deepEqual(
    prepared.h.model.snapshot(),
    before,
    caseId + " changed physical sheet state"
  );

  return {
    caseId,
    error
  };
}

function runExecutablePreconditionMatrix() {
  const matrix = buildPreconditionMatrix();

  matrix.forEach((entry) => {
    const result =
      assertPreconditionExecution(entry.id);

    assert.equal(result.caseId, entry.id);
  });

  pass("all 32 precondition cases execute fail-closed");
  pass("all 32 precondition cases perform zero physical deletions");
  pass("all 32 precondition cases preserve physical sheet state");

  console.log("PRECONDITION_EXECUTION_MATRIX=PASS");
}

function runClassificationEngineSelfTests() {
  assertObservableClassification(
    new Error(
      "PHYSICAL_DELETE_PRECONDITION_FAILED: sample"
    ),
    "PHYSICAL_DELETE_PRECONDITION_FAILED"
  );

  assertObservableClassification(
    {
      classification:
        "PHYSICAL_DELETE_PRECONDITION_FAILED"
    },
    "PHYSICAL_DELETE_PRECONDITION_FAILED"
  );

  assertObservableClassification(
    {
      outcome:
        "PHYSICAL_DELETE_OUTCOME_UNCERTAIN"
    },
    "PHYSICAL_DELETE_OUTCOME_UNCERTAIN"
  );

  assertObservableClassification(
    {
      status: "DELETED_VERIFIED"
    },
    "DELETED_VERIFIED"
  );

  expectThrow(
    () =>
      assertObservableClassification(
        new Error("unclassified"),
        "PHYSICAL_DELETE_PRECONDITION_FAILED"
      ),
    /Missing observable classification/
  );

  pass("classification assertion is transport-field agnostic");
  pass("classification tokens remain externally observable");
}

if (HARNESS_SELF_TEST) {
  runClassificationEngineSelfTests();
  console.log("CLASSIFICATION_ENGINE_SELF_TEST=PASS");
}

if (
  HARNESS_SELF_TEST === false &&
  EXPECT_ABSENT === false
) {
  runExecutablePreconditionMatrix();
}

const VERIFIED_CLASSIFICATION = 'DELETED_VERIFIED';
const UNCERTAIN_CLASSIFICATION = 'PHYSICAL_DELETE_OUTCOME_UNCERTAIN';

function createValidDeleteCase(options = {}) {
  const h = createRuntimeHarness(options);

  return {
    id: "VALID_DELETE",
    h,
    sheetName: "TEST",
    request: buildDeleteRequest(h, 3, "Record ID"),
    optionsMode: "OWNER_CONTEXT",
    expectedDeleteCalls: 1
  };
}

function collectScalarLeaves(value, output = []) {
  if (
    value === null ||
    value === undefined
  ) {
    return output;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) =>
      collectScalarLeaves(entry, output)
    );
    return output;
  }

  if (typeof value === "object") {
    Object.keys(value).forEach((key) =>
      collectScalarLeaves(value[key], output)
    );
  }

  return output;
}

function assertSuccessIdentification(result) {
  assert.ok(result && typeof result === "object");

  const leaves = collectScalarLeaves(result);

  [
    "SPREADSHEET-1",
    "TEST",
    "Record ID",
    "B-2"
  ].forEach((value) => {
    assert.equal(
      leaves.includes(value),
      true,
      "Success result does not identify " + value
    );
  });

  [
    4242,
    3,
    4,
    12,
    11
  ].forEach((value) => {
    assert.equal(
      leaves.includes(value),
      true,
      "Success result missing required numeric evidence " + value
    );
  });
}

function installPostDeleteGeometryFailure(prepared) {
  const h = prepared.h;
  const original =
    h.sheet.getMaxRows.bind(h.sheet);

  h.sheet.getMaxRows = function () {
    const actual = original();

    if (
      h.model.state.deleteRowCalls.length > 0
    ) {
      return actual + 1;
    }

    return actual;
  };
}

function runOutcomeMachinerySelfTests() {
  {
    const prepared = createValidDeleteCase();

    assert.equal(prepared.request.idValue, "B-2");
    assert.equal(prepared.request.expectedRowNumber, 3);
    assert.equal(prepared.request.expectedLastRow, 4);
    assert.equal(prepared.request.expectedMaxRows, 12);
    assert.deepEqual(
      prepared.h.model.state.deleteRowCalls,
      []
    );
  }

  pass("valid outcome case begins from exact B-2 row preimage");

  {
    const prepared = createValidDeleteCase();

    installPostDeleteGeometryFailure(prepared);

    assert.equal(prepared.h.sheet.getMaxRows(), 12);

    prepared.h.sheet.deleteRow(3);

    assert.equal(prepared.h.model.snapshot().maxRows, 11);
    assert.equal(prepared.h.sheet.getMaxRows(), 12);
  }

  pass("post-delete verification failure can be injected after mutation");

  {
    const prepared = createValidDeleteCase({
      deleteThrowsBeforeMutation: true
    });

    const before = prepared.h.model.snapshot();

    expectThrow(
      () => prepared.h.sheet.deleteRow(3),
      /before mutation/
    );

    assert.deepEqual(
      prepared.h.model.state.deleteRowCalls,
      [3]
    );
    assert.deepEqual(prepared.h.model.snapshot(), before);
  }

  pass("delete invocation can fail with unchanged physical state");

  {
    const prepared = createValidDeleteCase({
      deleteThrowsAfterMutation: true
    });

    expectThrow(
      () => prepared.h.sheet.deleteRow(3),
      /after mutation/
    );

    assert.deepEqual(
      prepared.h.model.state.deleteRowCalls,
      [3]
    );
    assert.equal(prepared.h.sheet.getLastRow(), 3);
    assert.equal(prepared.h.model.values[2][0], "C-3");
  }

  pass("delete invocation can fail after physical mutation");
}

function runVerifiedDeleteCase() {
  const prepared = createValidDeleteCase();

  const result = executePreparedCase(prepared);

  assertObservableClassification(
    result,
    VERIFIED_CLASSIFICATION
  );

  assertSuccessIdentification(result);

  assert.deepEqual(
    prepared.h.model.state.deleteRowCalls,
    [3]
  );

  assert.equal(prepared.h.sheet.getLastRow(), 3);
  assert.equal(prepared.h.sheet.getLastColumn(), 3);
  assert.equal(prepared.h.sheet.getMaxRows(), 11);
  assert.equal(prepared.h.sheet.getMaxColumns(), 3);

  assert.deepEqual(
    prepared.h.model.values.map((row) => row[0]),
    ["Record ID", "A-1", "C-3"]
  );

  assert.equal(prepared.h.state.flushCalls, 1);
  assert.equal(prepared.h.state.releaseCalls, 1);
  assert.equal(prepared.h.lockIsHeld(), false);

  pass("valid exact preimage yields one DELETED_VERIFIED deletion");
}

function runDeleteThrowBeforeMutationCase() {
  const prepared = createValidDeleteCase({
    deleteThrowsBeforeMutation: true
  });

  const before = prepared.h.model.snapshot();

  const error = captureThrown(() =>
    executePreparedCase(prepared)
  );

  assertObservableClassification(
    error,
    UNCERTAIN_CLASSIFICATION
  );

  assert.deepEqual(
    prepared.h.model.state.deleteRowCalls,
    [3]
  );

  assert.deepEqual(
    prepared.h.model.snapshot(),
    before
  );

  pass("deleteRow exception before modeled mutation is still uncertain");
}

function runDeleteThrowAfterMutationCase() {
  const prepared = createValidDeleteCase({
    deleteThrowsAfterMutation: true
  });

  const error = captureThrown(() =>
    executePreparedCase(prepared)
  );

  assertObservableClassification(
    error,
    UNCERTAIN_CLASSIFICATION
  );

  assert.deepEqual(
    prepared.h.model.state.deleteRowCalls,
    [3]
  );

  assert.equal(prepared.h.sheet.getLastRow(), 3);
  assert.equal(prepared.h.sheet.getMaxRows(), 11);
  assert.equal(prepared.h.model.values[2][0], "C-3");

  pass("deleteRow exception after mutation is uncertain");
}

function runPostDeleteVerificationFailureCase() {
  const prepared = createValidDeleteCase();

  installPostDeleteGeometryFailure(prepared);

  const error = captureThrown(() =>
    executePreparedCase(prepared)
  );

  assertObservableClassification(
    error,
    UNCERTAIN_CLASSIFICATION
  );

  assert.deepEqual(
    prepared.h.model.state.deleteRowCalls,
    [3]
  );

  assert.equal(prepared.h.model.snapshot().maxRows, 11);
  assert.equal(prepared.h.sheet.getLastRow(), 3);
  assert.equal(prepared.h.model.values[2][0], "C-3");

  pass("failed post-delete verification is uncertain");
}

function runExecutableOutcomeCases() {
  runVerifiedDeleteCase();
  runDeleteThrowBeforeMutationCase();
  runDeleteThrowAfterMutationCase();
  runPostDeleteVerificationFailureCase();

  console.log("OUTCOME_EXECUTION_MATRIX=PASS");
}

if (HARNESS_SELF_TEST) {
  runOutcomeMachinerySelfTests();
  console.log("OUTCOME_MACHINERY_SELF_TEST=PASS");
}

if (
  HARNESS_SELF_TEST === false &&
  EXPECT_ABSENT === false
) {
  runExecutableOutcomeCases();
}

function assertPrimitiveStaticTopology(db) {
  assert.equal(
    typeof db.deletePhysicalRowExact,
    'function',
    'deletePhysicalRowExact must be exported'
  );

  const primitiveSource =
    Function.prototype.toString.call(
      db.deletePhysicalRowExact
    );

  const deleteRowMatches =
    primitiveSource.match(
      /\.deleteRow\s*\(/g
    ) || [];

  assert.equal(
    deleteRowMatches.length,
    1,
    'Primitive must contain exactly one deleteRow call site'
  );

  assert.match(
    primitiveSource,
    /sheet\.deleteRow\s*\(\s*request\.expectedRowNumber\s*\)/
  );

  [
    /\.deleteRows\s*\(/,
    /\.deleteCells\s*\(/,
    /\.clearContent\s*\(/,
    /\.clear\s*\(/,
    /\.appendRow\s*\(/,
    /\.setValue\s*\(/,
    /\.setValues\s*\(/,
    /\.insertRow/,
    /\.insertRows/
  ].forEach((pattern) => {
    assert.equal(
      pattern.test(primitiveSource),
      false,
      'Primitive contains prohibited mutation surface: ' +
        pattern
    );
  });

  [
    /LockService/,
    /\.waitLock\s*\(/,
    /\.tryLock\s*\(/,
    /\.releaseLock\s*\(/,
    /withScriptLockContext\s*\(/,
    /SpreadsheetApp\.flush\s*\(/
  ].forEach((pattern) => {
    assert.equal(
      pattern.test(primitiveSource),
      false,
      'Primitive must not own ScriptLock lifecycle: ' +
        pattern
    );
  });

  const lockValidationMatches =
    primitiveSource.match(
      /validateLockContext_\s*\(/g
    ) || [];

  assert.ok(
    lockValidationMatches.length >= 2,
    'Primitive must validate caller lock context at least twice'
  );

  const deleteIndex =
    primitiveSource.search(
      /sheet\.deleteRow\s*\(\s*request\.expectedRowNumber\s*\)/
    );

  const lastLockValidationIndex =
    primitiveSource.lastIndexOf(
      'validateLockContext_'
    );

  assert.ok(
    lastLockValidationIndex >= 0 &&
    lastLockValidationIndex < deleteIndex,
    'Final lock validation must precede deleteRow'
  );

  return primitiveSource;
}

function runStaticTopologyCheckerSelfTests() {
  const validLike = {
    deletePhysicalRowExact:
      function deletePhysicalRowExact(
        sheetName,
        request,
        options
      ) {
        validateLockContext_(options.lockContext);
        const sheet = {};
        validateLockContext_(options.lockContext);
        sheet.deleteRow(request.expectedRowNumber);
      }
  };

  assertPrimitiveStaticTopology(validLike);

  const nestedLock = {
    deletePhysicalRowExact:
      function deletePhysicalRowExact(
        sheetName,
        request,
        options
      ) {
        validateLockContext_(options.lockContext);
        const sheet = {};
        LockService.getScriptLock();
        validateLockContext_(options.lockContext);
        sheet.deleteRow(request.expectedRowNumber);
      }
  };

  expectThrow(
    () =>
      assertPrimitiveStaticTopology(
        nestedLock
      ),
    /must not own ScriptLock lifecycle/
  );

  const bulkDelete = {
    deletePhysicalRowExact:
      function deletePhysicalRowExact(
        sheetName,
        request,
        options
      ) {
        validateLockContext_(options.lockContext);
        const sheet = {};
        validateLockContext_(options.lockContext);
        sheet.deleteRows(
          request.expectedRowNumber,
          1
        );
      }
  };

  expectThrow(
    () =>
      assertPrimitiveStaticTopology(
        bulkDelete
      ),
    /exactly one deleteRow call site/
  );

  const missingSecondValidation = {
    deletePhysicalRowExact:
      function deletePhysicalRowExact(
        sheetName,
        request,
        options
      ) {
        const sheet = {};
        validateLockContext_(options.lockContext);
        sheet.deleteRow(request.expectedRowNumber);
      }
  };

  expectThrow(
    () =>
      assertPrimitiveStaticTopology(
        missingSecondValidation
      ),
    /at least twice/
  );

  pass(
    'static topology checker accepts exact one-row mutation surface'
  );

  pass(
    'static topology checker rejects nested lock ownership'
  );

  pass(
    'static topology checker rejects bulk/prohibited mutation surfaces'
  );

  pass(
    'static topology checker requires repeated lock validation'
  );
}

if (HARNESS_SELF_TEST) {
  runStaticTopologyCheckerSelfTests();
  console.log(
    'STATIC_TOPOLOGY_SELF_TEST=PASS'
  );
}

if (
  HARNESS_SELF_TEST === false &&
  EXPECT_ABSENT === false
) {
  const topologyHarness =
    createRuntimeHarness();

  assertPrimitiveStaticTopology(
    topologyHarness.db
  );

  console.log(
    'STATIC_PRIMITIVE_TOPOLOGY=PASS'
  );
}
