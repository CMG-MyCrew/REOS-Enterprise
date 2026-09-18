'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const FILE =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentExecutor.js';

const source = fs.readFileSync(FILE, 'utf8');

function clone(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    return value.map(clone);
  }

  if (value && typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(key => {
      out[key] = clone(value[key]);
    });
    return out;
  }

  return value;
}

function canonical(value) {
  if (value === '') return {type: 'blank'};

  if (typeof value === 'string') {
    return {type: 'string', value};
  }

  if (typeof value === 'number') {
    return {
      type: 'number',
      value: String(value)
    };
  }

  if (typeof value === 'boolean') {
    return {type: 'boolean', value};
  }

  if (value instanceof Date) {
    return {
      type: 'date',
      value: value.toISOString()
    };
  }

  throw new Error('HARNESS_UNSUPPORTED_VALUE');
}

function request(overrides = {}) {
  const row = [
    'DL-100',
    'CPK-100',
    '',
    '',
    '',
    'preserve'
  ];

  const base = {
    ok: true,
    version: 1,
    targetTable: 'DISTRESS_LEADS',

    identity: {
      'Distress Lead ID': 'DL-100',
      'Canonical Property Key': 'CPK-100'
    },

    semanticPatch: {
      'Owner Name': 'Jane Owner',
      'Owner Mailing Address': '10 Main St'
    },

    expectedSpreadsheetId: 'SPREADSHEET-1',
    expectedSheetName: 'DISTRESS_LEADS',
    expectedSheetId: 12345,
    expectedRowNumber: 2,
    phase1fRowNumberEvidence: 2,

    expectedLastRow: 2,
    expectedLastColumn: 6,
    expectedMaxRows: 1000,
    expectedMaxColumns: 26,

    expectedHeaders: [
      'Distress Lead ID',
      'Canonical Property Key',
      'Owner Name',
      'Owner Mailing Address',
      'Updated At',
      'Other'
    ],

    expectedRowValues: row.map(canonical),
    expectedRowFormulas:
      ['', '', '', '', '', ''],

    persistenceExecutionAuthorized: false,
    databaseUpdateAuthorized: false,
    databaseInsertAuthorized: false,
    databaseUpsertAuthorized: false,
    dealCreationAuthorized: false,
    maoGenerationAuthorized: false,
    automaticOfferAuthorityGranted: false,
    schedulerAuthority: false,
    productionMutationAuthority: false
  };

  Object.keys(overrides).forEach(key => {
    base[key] = overrides[key];
  });

  return base;
}

function makeHarness(options = {}) {
  const headers = clone(options.headers || [
    'Distress Lead ID',
    'Canonical Property Key',
    'Owner Name',
    'Owner Mailing Address',
    'Updated At',
    'Other'
  ]);

  const rows = clone(options.rows || [[
    'DL-100',
    'CPK-100',
    '',
    '',
    '',
    'preserve'
  ]]);

  const formulas = clone(options.formulas || [[
    '', '', '', '', '', ''
  ]]);

  const writes = [];
  const events = [];

  let active = false;
  let context = null;
  let flushCount = 0;
  let assertionCount = 0;

  function getRange(
    row,
    column,
    rowCount = 1,
    columnCount = 1
  ) {
    return {
      getValues() {
        const out = [];

        for (let r = 0; r < rowCount; r += 1) {
          const physical = row + r;
          const sourceRow =
            physical === 1
              ? headers
              : rows[physical - 2];

          const result = [];

          for (let c = 0; c < columnCount; c += 1) {
            result.push(
              sourceRow
                ? clone(sourceRow[column - 1 + c])
                : ''
            );
          }

          out.push(result);
        }

        return out;
      },

      getFormulas() {
        const out = [];

        for (let r = 0; r < rowCount; r += 1) {
          const physical = row + r;

          if (physical === 1) {
            out.push(new Array(columnCount).fill(''));
            continue;
          }

          const sourceRow =
            formulas[physical - 2] || [];

          const result = [];

          for (let c = 0; c < columnCount; c += 1) {
            result.push(
              sourceRow[column - 1 + c] || ''
            );
          }

          out.push(result);
        }

        return out;
      },

      setValue(value) {
        events.push(['write', row, column]);

        if (!active) {
          throw new Error('WRITE_WITHOUT_LOCK');
        }

        writes.push({
          row,
          column,
          value: clone(value)
        });

        if (
          options.throwOnWriteNumber &&
          writes.length === options.throwOnWriteNumber
        ) {
          throw new Error('INJECTED_WRITE_FAILURE');
        }

        rows[row - 2][column - 1] = clone(value);

        if (
          options.corruptAfterWriteNumber &&
          writes.length === options.corruptAfterWriteNumber
        ) {
          const corruptColumn =
            options.corruptColumn || column;

          rows[row - 2][corruptColumn - 1] =
            options.corruptValue === undefined
              ? 'CORRUPTED'
              : clone(options.corruptValue);
        }

        return this;
      },

      setValues() {
        throw new Error('FULL_ROW_WRITE_FORBIDDEN');
      }
    };
  }

  const sheet = {
    getSheetId() {
      return options.sheetId === undefined
        ? 12345
        : options.sheetId;
    },

    getLastRow() {
      return options.lastRow === undefined
        ? rows.length + 1
        : options.lastRow;
    },

    getLastColumn() {
      return options.lastColumn === undefined
        ? headers.length
        : options.lastColumn;
    },

    getMaxRows() {
      return options.maxRows || 1000;
    },

    getMaxColumns() {
      return options.maxColumns || 26;
    },

    getRange
  };

  const spreadsheet = {
    getId() {
      return options.spreadsheetId ||
        'SPREADSHEET-1';
    },

    getSheetByName(name) {
      if (
        options.missingSheet ||
        name !== 'DISTRESS_LEADS'
      ) {
        return null;
      }

      return sheet;
    }
  };

  const Database = {
    withScriptLockContext(work) {
      events.push(['lock-enter']);

      if (options.lockFailure) {
        throw new Error('INJECTED_LOCK_FAILURE');
      }

      context = Object.freeze({
        capability: 'TEST'
      });

      active = true;

      let result;
      let callbackError;

      try {
        result = work(context);
      } catch (error) {
        callbackError = error;
      } finally {
        active = false;
        events.push(['lock-exit']);
      }

      events.push(['wrapper-flush']);

      if (options.wrapperFlushFailure) {
        throw new Error('INJECTED_WRAPPER_FLUSH_FAILURE');
      }

      if (callbackError) {
        throw callbackError;
      }

      return result;
    },

    assertScriptLockContext(candidate) {
      assertionCount += 1;
      events.push(['lock-assert', assertionCount]);

      if (
        options.failAssertionNumber === assertionCount ||
        !active ||
        candidate !== context
      ) {
        throw new Error('INJECTED_LOCK_ASSERTION_FAILURE');
      }

      return true;
    }
  };

  const sandbox = {
    console,
    Date,
    Number,
    Object,
    Array,
    String,
    Boolean,
    Error,
    JSON,
    Math,

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return spreadsheet;
      },

      flush() {
        flushCount += 1;
        events.push(['flush']);

        if (options.flushFailure) {
          throw new Error('INJECTED_FLUSH_FAILURE');
        }
      }
    },

    REOS: {
      Database
    }
  };

  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);

  vm.runInContext(source, sandbox, {
    filename: FILE
  });

  return {
    api:
      sandbox.REOS
        .AbsenteeOwnerEnrichmentExecutor,
    writes,
    events,
    rows,
    formulas,
    get flushCount() {
      return flushCount;
    }
  };
}

const PRECONDITION =
  'ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED';

const UNCERTAIN =
  'ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN';

const VERIFIED =
  'ABSENTEE_OWNER_EXECUTION_VERIFIED';

function expectFailure(fn, expected) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert.ok(error, 'Expected classified failure.');

  assert.strictEqual(
    error.classification,
    expected,
    error && error.stack
  );

  return error;
}

/*
 * Verified execution.
 */
{
  const h = makeHarness();
  const result = h.api.execute(request());

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.classification, VERIFIED);

  assert.strictEqual(h.writes.length, 3);
  assert.strictEqual(h.rows[0][2], 'Jane Owner');
  assert.strictEqual(h.rows[0][3], '10 Main St');
  assert.ok(h.rows[0][4] instanceof Date);
  assert.strictEqual(h.rows[0][5], 'preserve');
  assert.strictEqual(h.flushCount, 1);

  assert.deepStrictEqual(
    Array.from(result.patchedHeaders),
    [
      'Owner Name',
      'Owner Mailing Address',
      'Updated At'
    ]
  );

  [
    'persistenceExecutionAuthorized',
    'databaseUpdateAuthorized',
    'databaseInsertAuthorized',
    'databaseUpsertAuthorized',
    'dealCreationAuthorized',
    'maoGenerationAuthorized',
    'automaticOfferAuthorityGranted',
    'schedulerAuthority',
    'productionMutationAuthority'
  ].forEach(field => {
    assert.strictEqual(result[field], false);
  });
}

/*
 * One-field semantic patch does not manufacture the
 * absent second enrichment write.
 */
{
  const h = makeHarness();

  const result = h.api.execute(request({
    semanticPatch: {
      'Owner Name': 'Jane Owner'
    }
  }));

  assert.strictEqual(result.classification, VERIFIED);
  assert.strictEqual(h.writes.length, 2);
  assert.strictEqual(h.rows[0][2], 'Jane Owner');
  assert.strictEqual(h.rows[0][3], '');
  assert.ok(h.rows[0][4] instanceof Date);
  assert.strictEqual(h.rows[0][5], 'preserve');
}

/*
 * Complete preimage drift => definite no-write.
 */
{
  const h = makeHarness({
    rows: [[
      'DL-100',
      'CPK-100',
      'DRIFT',
      '',
      '',
      'preserve'
    ]]
  });

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * Formula drift => definite no-write.
 */
{
  const h = makeHarness({
    formulas: [[
      '', '', '=A1', '', '', ''
    ]]
  });

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * Spreadsheet identity drift => definite no-write.
 */
{
  const h = makeHarness({
    spreadsheetId: 'WRONG'
  });

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * Sheet identity drift => definite no-write.
 */
{
  const h = makeHarness({
    sheetId: 999
  });

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * Duplicate Distress Lead ID => definite no-write.
 */
{
  const h = makeHarness({
    rows: [
      [
        'DL-100',
        'CPK-100',
        '',
        '',
        '',
        'a'
      ],
      [
        'DL-100',
        'CPK-X',
        '',
        '',
        '',
        'b'
      ]
    ]
  });

  expectFailure(
    () => h.api.execute(request({
      expectedLastRow: 3
    })),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * Dual identity split across rows => definite no-write.
 */
{
  const h = makeHarness({
    rows: [
      [
        'DL-100',
        'CPK-X',
        '',
        '',
        '',
        'a'
      ],
      [
        'DL-X',
        'CPK-100',
        '',
        '',
        '',
        'b'
      ]
    ]
  });

  expectFailure(
    () => h.api.execute(request({
      expectedLastRow: 3
    })),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * Authority escalation => definite no-write.
 */
[
  'persistenceExecutionAuthorized',
  'databaseUpdateAuthorized',
  'databaseInsertAuthorized',
  'databaseUpsertAuthorized',
  'dealCreationAuthorized',
  'maoGenerationAuthorized',
  'automaticOfferAuthorityGranted',
  'schedulerAuthority',
  'productionMutationAuthority'
].forEach(field => {
  const h = makeHarness();
  const value = request();
  value[field] = true;

  expectFailure(
    () => h.api.execute(value),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
});

/*
 * Updated At cannot be supplied by semantic patch.
 */
{
  const h = makeHarness();

  expectFailure(
    () => h.api.execute(request({
      semanticPatch: {
        'Owner Name': 'Jane',
        'Updated At': 'FORBIDDEN'
      }
    })),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * Final pre-write lock assertion failure => definite
 * no-write. Assertion #1 is the initial lock check;
 * assertion #2 is the final no-write boundary.
 */
{
  const h = makeHarness({
    failAssertionNumber: 2
  });

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * First write invocation failure => uncertain.
 */
{
  const h = makeHarness({
    throwOnWriteNumber: 1
  });

  expectFailure(
    () => h.api.execute(request()),
    UNCERTAIN
  );

  assert.strictEqual(h.writes.length, 1);
}

/*
 * Partial mutation => uncertain.
 */
{
  const h = makeHarness({
    throwOnWriteNumber: 2
  });

  expectFailure(
    () => h.api.execute(request()),
    UNCERTAIN
  );

  assert.strictEqual(h.writes.length, 2);
}

/*
 * Flush failure => uncertain.
 */
{
  const h = makeHarness({
    flushFailure: true
  });

  expectFailure(
    () => h.api.execute(request()),
    UNCERTAIN
  );

  assert.strictEqual(h.writes.length, 3);
}

/*
 * Post-write lock assertion failure => uncertain.
 */
{
  const h = makeHarness({
    failAssertionNumber: 3
  });

  expectFailure(
    () => h.api.execute(request()),
    UNCERTAIN
  );

  assert.strictEqual(h.writes.length, 3);
}

/*
 * Replay after verified execution => stale frozen
 * preimage, therefore definite no-write on replay.
 */
{
  const h = makeHarness();
  const value = request();

  assert.strictEqual(
    h.api.execute(value).classification,
    VERIFIED
  );

  const count = h.writes.length;

  expectFailure(
    () => h.api.execute(value),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, count);
}


/*
 * HARDENING: reverse semanticPatch insertion order.
 * Physical writes must remain physical-column ordered.
 */
{
  const h = makeHarness();

  const reversed = {};
  reversed['Owner Mailing Address'] = '10 Main St';
  reversed['Owner Name'] = 'Jane Owner';

  const result = h.api.execute(request({
    semanticPatch: reversed
  }));

  assert.strictEqual(result.classification, VERIFIED);

  assert.deepStrictEqual(
    h.writes.map(write => write.column),
    [3, 4, 5]
  );

  assert.deepStrictEqual(
    Array.from(result.patchedHeaders),
    [
      'Owner Name',
      'Owner Mailing Address',
      'Updated At'
    ]
  );

  assert.strictEqual(h.rows[0][2], 'Jane Owner');
  assert.strictEqual(h.rows[0][3], '10 Main St');
  assert.ok(h.rows[0][4] instanceof Date);
  assert.strictEqual(h.rows[0][5], 'preserve');
}

/*
 * HARDENING: duplicate Canonical Property Key independently
 * fails before physical mutation.
 */
{
  const h = makeHarness({
    rows: [
      [
        'DL-100',
        'CPK-100',
        '',
        '',
        '',
        'a'
      ],
      [
        'DL-X',
        'CPK-100',
        '',
        '',
        '',
        'b'
      ]
    ]
  });

  expectFailure(
    () => h.api.execute(request({
      expectedLastRow: 3
    })),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * HARDENING: every geometry dimension independently fails
 * before mutation.
 */
[
  {lastRow: 3},
  {lastColumn: 7},
  {maxRows: 1001},
  {maxColumns: 27}
].forEach(options => {
  const h = makeHarness(options);

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
});

/*
 * HARDENING: ordered header-vector drift fails before write.
 */
{
  const h = makeHarness({
    headers: [
      'Distress Lead ID',
      'Canonical Property Key',
      'Owner Mailing Address',
      'Owner Name',
      'Updated At',
      'Other'
    ]
  });

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
}

/*
 * HARDENING: formula drift independently protects
 * Owner Name, Owner Mailing Address and Updated At.
 */
[2, 3, 4].forEach(index => {
  const formulaRow = ['', '', '', '', '', ''];
  formulaRow[index] = '=A1';

  const h = makeHarness({
    formulas: [formulaRow]
  });

  expectFailure(
    () => h.api.execute(request()),
    PRECONDITION
  );

  assert.strictEqual(h.writes.length, 0);
});

/*
 * HARDENING: unrelated-cell corruption after physical writes
 * must fail complete postimage verification as UNCERTAIN.
 */
{
  const h = makeHarness({
    corruptAfterWriteNumber: 3,
    corruptColumn: 6,
    corruptValue: 'CORRUPTED'
  });

  expectFailure(
    () => h.api.execute(request()),
    UNCERTAIN
  );

  assert.strictEqual(h.writes.length, 3);
}

/*
 * HARDENING: assertion #4 is the final postimage lock
 * assertion. Mutation has already begun.
 */
{
  const h = makeHarness({
    failAssertionNumber: 4
  });

  expectFailure(
    () => h.api.execute(request()),
    UNCERTAIN
  );

  assert.strictEqual(h.writes.length, 3);
}

/*
 * HARDENING: actual Database wrapper lifecycle can fail during
 * its post-callback flush after executor writes have completed.
 * Executor must classify that escaped failure as UNCERTAIN.
 */
{
  const h = makeHarness({
    wrapperFlushFailure: true
  });

  expectFailure(
    () => h.api.execute(request()),
    UNCERTAIN
  );

  assert.strictEqual(h.writes.length, 3);

  assert.strictEqual(
    h.events.filter(
      event => event[0] === 'wrapper-flush'
    ).length,
    1
  );

  assert.strictEqual(h.rows[0][2], 'Jane Owner');
  assert.strictEqual(h.rows[0][3], '10 Main St');
  assert.ok(h.rows[0][4] instanceof Date);
  assert.strictEqual(h.rows[0][5], 'preserve');
}

/*
 * HARDENING: mailing-address-only semantic patch must not
 * manufacture Owner Name.
 */
{
  const h = makeHarness();

  const result = h.api.execute(request({
    semanticPatch: {
      'Owner Mailing Address': '10 Main St'
    }
  }));

  assert.strictEqual(result.classification, VERIFIED);

  assert.deepStrictEqual(
    h.writes.map(write => write.column),
    [4, 5]
  );

  assert.deepStrictEqual(
    Array.from(result.patchedHeaders),
    [
      'Owner Mailing Address',
      'Updated At'
    ]
  );

  assert.strictEqual(h.rows[0][2], '');
  assert.strictEqual(h.rows[0][3], '10 Main St');
  assert.ok(h.rows[0][4] instanceof Date);
  assert.strictEqual(h.rows[0][5], 'preserve');
}

console.log(
  'PASS: semantic patch insertion order cannot control physical write order.'
);
console.log(
  'PASS: duplicate Canonical Property Key fails before mutation.'
);
console.log(
  'PASS: geometry and ordered-header drift fail before mutation.'
);
console.log(
  'PASS: all writable target formula columns independently fail closed.'
);
console.log(
  'PASS: complete postimage corruption is classified uncertain.'
);
console.log(
  'PASS: final postimage lock failure is classified uncertain.'
);
console.log(
  'PASS: Database wrapper post-callback flush failure is classified uncertain.'
);
console.log(
  'PASS: mailing-only patch does not manufacture Owner Name.'
);

console.log(
  'PASS: bounded executor writes only certified enrichment cells plus Updated At.'
);
console.log(
  'PASS: absent semantic enrichment field is not manufactured.'
);
console.log(
  'PASS: complete preimage and dual identity drift fail before write.'
);
console.log(
  'PASS: final lock assertion is a definite no-write boundary.'
);
console.log(
  'PASS: first-write, partial-write, flush and post-write lock failures are uncertain.'
);
console.log(
  'PASS: verified execution requires complete postimage equality.'
);
console.log(
  'PASS: replay against stale frozen preimage fails closed.'
);
console.log(
  'PASS: acquisition, MAO and automatic offer authority remain false.'
);
