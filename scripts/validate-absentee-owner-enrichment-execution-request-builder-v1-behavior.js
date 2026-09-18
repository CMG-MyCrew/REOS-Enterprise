'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const FILE =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentExecutionRequestBuilder.js';

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

function makeHarness(options = {}) {
  const headers = clone(options.headers || [
    'Distress Lead ID',
    'Canonical Property Key',
    'Owner Name',
    'Owner Mailing Address',
    'Updated At',
    'Other'
  ]);

  const rows = clone(options.rows || [
    [
      'DL-100',
      'CPK-100',
      '',
      '',
      '',
      'preserve'
    ]
  ]);

  const formulas = clone(options.formulas || [
    ['', '', '', '', '', '']
  ]);

  const writes = [];

  function range(row, column, rowCount, columnCount) {
    return {
      getValues() {
        const out = [];

        for (let r = 0; r < rowCount; r += 1) {
          const physicalRow = row + r;
          const sourceRow =
            physicalRow === 1
              ? headers
              : rows[physicalRow - 2];

          const resultRow = [];

          for (let c = 0; c < columnCount; c += 1) {
            resultRow.push(
              sourceRow
                ? clone(sourceRow[column - 1 + c])
                : ''
            );
          }

          out.push(resultRow);
        }

        return out;
      },

      getFormulas() {
        const out = [];

        for (let r = 0; r < rowCount; r += 1) {
          const physicalRow = row + r;

          if (physicalRow === 1) {
            out.push(
              new Array(columnCount).fill('')
            );
            continue;
          }

          const sourceRow =
            formulas[physicalRow - 2] || [];

          const resultRow = [];

          for (let c = 0; c < columnCount; c += 1) {
            resultRow.push(
              sourceRow[column - 1 + c] || ''
            );
          }

          out.push(resultRow);
        }

        return out;
      },

      setValue(value) {
        writes.push(['setValue', value]);
      },

      setValues(value) {
        writes.push(['setValues', value]);
      },

      clearContent() {
        writes.push(['clearContent']);
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
      return rows.length + 1;
    },

    getLastColumn() {
      return headers.length;
    },

    getMaxRows() {
      return options.maxRows || 1000;
    },

    getMaxColumns() {
      return options.maxColumns || 26;
    },

    getRange(row, column, rowCount, columnCount) {
      return range(row, column, rowCount, columnCount);
    },

    appendRow(value) {
      writes.push(['appendRow', value]);
    },

    deleteRow(value) {
      writes.push(['deleteRow', value]);
    }
  };

  const spreadsheet = {
    getId() {
      return options.spreadsheetId || 'SPREADSHEET-1';
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
        writes.push(['flush']);
      }
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
        .AbsenteeOwnerEnrichmentExecutionRequestBuilder,
    writes
  };
}

function plan(overrides = {}) {
  const base = {
    ok: true,
    identity: {
      'Distress Lead ID': 'DL-100',
      'Canonical Property Key': 'CPK-100'
    },
    rowNumber: 2,
    patch: {
      'Owner Name': 'Jane Owner',
      'Owner Mailing Address': '10 Main St'
    },
    persistenceExecutionAuthorized: false,
    databaseUpdateAuthorized: false,
    databaseInsertAuthorized: false,
    databaseUpsertAuthorized: false,
    dealCreationAuthorized: false,
    maoGenerationAuthorized: false,
    automaticOfferAuthorityGranted: false
  };

  Object.keys(overrides).forEach(key => {
    base[key] = overrides[key];
  });

  return base;
}

function expectThrow(fn, pattern) {
  assert.throws(fn, pattern);
}

{
  const harness = makeHarness();
  const result = harness.api.prepare(plan());

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.version, 1);
  assert.strictEqual(result.targetTable, 'DISTRESS_LEADS');

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.identity)),
    {
      'Distress Lead ID': 'DL-100',
      'Canonical Property Key': 'CPK-100'
    }
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.semanticPatch)),
    {
      'Owner Name': 'Jane Owner',
      'Owner Mailing Address': '10 Main St'
    }
  );

  assert.strictEqual(
    result.expectedSpreadsheetId,
    'SPREADSHEET-1'
  );
  assert.strictEqual(result.expectedSheetId, 12345);
  assert.strictEqual(result.expectedRowNumber, 2);
  assert.strictEqual(result.phase1fRowNumberEvidence, 2);
  assert.strictEqual(result.expectedLastRow, 2);
  assert.strictEqual(result.expectedLastColumn, 6);
  assert.strictEqual(result.expectedMaxRows, 1000);
  assert.strictEqual(result.expectedMaxColumns, 26);

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.expectedHeaders)),
    [
      'Distress Lead ID',
      'Canonical Property Key',
      'Owner Name',
      'Owner Mailing Address',
      'Updated At',
      'Other'
    ]
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.expectedRowValues)),
    [
      {type: 'string', value: 'DL-100'},
      {type: 'string', value: 'CPK-100'},
      {type: 'blank'},
      {type: 'blank'},
      {type: 'blank'},
      {type: 'string', value: 'preserve'}
    ]
  );

  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(result.expectedRowFormulas)),
    ['', '', '', '', '', '']
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

  assert.deepStrictEqual(harness.writes, []);
}

{
  const harness = makeHarness({
    rows: [
      ['DL-100', 'CPK-X', '', '', '', 'a'],
      ['DL-X', 'CPK-100', '', '', '', 'b']
    ],
    formulas: [
      ['', '', '', '', '', ''],
      ['', '', '', '', '', '']
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /DUAL_IDENTITY_ROW_MISMATCH/
  );

  assert.deepStrictEqual(harness.writes, []);
}

{
  const harness = makeHarness({
    rows: [
      ['DL-100', 'CPK-100', '', '', '', 'a'],
      ['DL-100', 'CPK-X', '', '', '', 'b']
    ],
    formulas: [
      ['', '', '', '', '', ''],
      ['', '', '', '', '', '']
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /IDENTITY_AMBIGUOUS:Distress Lead ID/
  );
}

{
  const harness = makeHarness();

  expectThrow(
    () => harness.api.prepare(
      plan({rowNumber: 7})
    ),
    /PHASE1F_ROW_EVIDENCE_MISMATCH/
  );
}

{
  const harness = makeHarness({
    headers: [
      'Distress Lead ID',
      'Canonical Property Key',
      'Owner Name',
      'Owner Name',
      'Owner Mailing Address',
      'Updated At'
    ],
    rows: [
      [
        'DL-100',
        'CPK-100',
        '',
        '',
        '',
        ''
      ]
    ],
    formulas: [
      ['', '', '', '', '', '']
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /REQUIRED_HEADER_AMBIGUOUS:Owner Name/
  );
}

{
  const harness = makeHarness({
    formulas: [
      ['', '', '=A1', '', '', '']
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /TARGET_FORMULA_NOT_BLANK:Owner Name/
  );
}

{
  const harness = makeHarness({
    rows: [
      [
        'DL-100',
        'CPK-100',
        '',
        '',
        '',
        NaN
      ]
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /PHYSICAL_VALUE_NON_FINITE_NUMBER/
  );
}


{
  const harness = makeHarness({
    rows: [
      ['DL-100', 'CPK-100', '', '', '', null]
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /PHYSICAL_VALUE_UNSUPPORTED_TYPE/
  );
}

{
  const harness = makeHarness({
    rows: [
      ['DL-100', 'CPK-100', '', '', '', undefined]
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /PHYSICAL_VALUE_UNSUPPORTED_TYPE/
  );
}

{
  const harness = makeHarness({
    rows: [
      ['DL-100', 'CPK-100', '', '', '', {bad: true}]
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /PHYSICAL_VALUE_UNSUPPORTED_TYPE/
  );
}

{
  const harness = makeHarness({
    rows: [
      ['DL-100', 'CPK-100', '', '', '', ['bad']]
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /PHYSICAL_VALUE_UNSUPPORTED_TYPE/
  );
}

{
  const harness = makeHarness({
    rows: [
      [
        'DL-100',
        'CPK-100',
        '',
        '',
        '',
        new Date(NaN)
      ]
    ]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    /PHYSICAL_VALUE_INVALID_DATE/
  );
}

[
  {index: 2, field: 'Owner Name'},
  {index: 3, field: 'Owner Mailing Address'},
  {index: 4, field: 'Updated At'}
].forEach(testCase => {
  const formulaRow = ['', '', '', '', '', ''];
  formulaRow[testCase.index] = '=A1';

  const harness = makeHarness({
    formulas: [formulaRow]
  });

  expectThrow(
    () => harness.api.prepare(plan()),
    new RegExp(
      'TARGET_FORMULA_NOT_BLANK:' + testCase.field
    )
  );

  assert.deepStrictEqual(harness.writes, []);
});

[
  'persistenceExecutionAuthorized',
  'databaseUpdateAuthorized',
  'databaseInsertAuthorized',
  'databaseUpsertAuthorized',
  'dealCreationAuthorized',
  'maoGenerationAuthorized',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  const value = plan();
  value[field] = true;

  const harness = makeHarness();

  expectThrow(
    () => harness.api.prepare(value),
    new RegExp(
      'PHASE1F_AUTHORITY_INVALID:' + field
    )
  );

  assert.deepStrictEqual(harness.writes, []);
});

{
  const harness = makeHarness();

  expectThrow(
    () => harness.api.prepare(
      plan({
        patch: {
          'Owner Name': 'Jane',
          'Updated At': 'ATTACK'
        }
      })
    ),
    /PATCH_FIELD_NOT_ALLOWED:Updated At/
  );
}

console.log(
  'PASS: valid Phase 1F plan binds to exact physical row.'
);
console.log(
  'PASS: dual identity is independently unique and same-row bound.'
);
console.log(
  'PASS: Phase 1F row number remains corroborating evidence only.'
);
console.log(
  'PASS: complete headers, geometry, values and formulas are captured.'
);
console.log(
  'PASS: target formulas fail closed.'
);
console.log(
  'PASS: unsupported physical values fail closed.'
);
console.log(
  'PASS: execution and acquisition authority cannot escalate.'
);
console.log(
  'PASS: behavior harness observed zero spreadsheet writes.'
);
