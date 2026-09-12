#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const AUTH_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js';

const READER_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js';

const authoritySource =
  fs.readFileSync(AUTH_FILE, 'utf8');

const readerSource =
  fs.readFileSync(READER_FILE, 'utf8');

const headers = [
  'Distress Lead ID',
  'Source',
  'Source Dataset',
  'Source Record ID',
  'Violation Number',
  'Canonical Property Key',
  'Source Observation Key',
  'Notes'
];

function loadAuthorityRecords() {
  const sandbox = {
    REOS: {},
    Object,
    console
  };

  vm.createContext(sandbox);
  vm.runInContext(authoritySource, sandbox);

  return JSON.parse(JSON.stringify(
    sandbox.REOS
      .CountyCodeViolationCollapseOnlyEvidenceAuthority
      .records()
  ));
}

const authorityRecords =
  loadAuthorityRecords();

assert.strictEqual(authorityRecords.length, 46);

function persistedRows() {
  return authorityRecords.map(record => ({
    _rowNumber: record.rowNumber,
    'Distress Lead ID': record.distressLeadId,
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Source Record ID': record.sourceRecordId,
    'Violation Number': record.violationNumber,
    'Canonical Property Key':
      record.canonicalPropertyKey,
    'Source Observation Key':
      record.legacyObservationKey,
    Notes:
      'full-row-' + record.rowNumber
  }));
}

function execute(rows, options) {
  const sandbox = {
    REOS: {
      Database: {
        getHeaders(table) {
          assert.strictEqual(
            table,
            'DISTRESS_LEADS'
          );
          return headers.slice();
        },

        getAll(table) {
          assert.strictEqual(
            table,
            'DISTRESS_LEADS'
          );

          return rows.map(
            row => Object.assign({}, row)
          );
        }
      },

      Security: {
        requireAdmin() {
          return true;
        }
      }
    },

    Object,
    console
  };

  vm.createContext(sandbox);

  vm.runInContext(
    authoritySource,
    sandbox
  );

  vm.runInContext(
    readerSource,
    sandbox
  );

  return sandbox.REOS
    .CountyCodeViolationCollapseFullRowEvidence
    .exportEvidence(options || {});
}

const result =
  execute(persistedRows(), {});

assert.strictEqual(result.ok, true);

assert.strictEqual(
  result.mode,
  'READ_ONLY_CERTIFIED_CODE_VIOLATION_COLLAPSE_FULL_ROW_EVIDENCE'
);

assert.strictEqual(
  result.table,
  'DISTRESS_LEADS'
);

assert.strictEqual(
  result.scope.connectorId,
  'PA-PHILADELPHIA'
);

assert.strictEqual(
  result.scope.dataset,
  'code_violations'
);

assert.strictEqual(
  result.authoritySha256,
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee'
);

assert.strictEqual(
  result.sourceEvidenceSha256,
  '762abd7c1ffebec3e1e15a205a93b6ef4d564ccf8020d08fd315ccb4a9c49e49'
);

assert.strictEqual(
  result.certifiedGroupCount,
  22
);

assert.strictEqual(
  result.certifiedRowCount,
  46
);

assert.strictEqual(
  result.returnedRowCount,
  46
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(result.headers)),
  headers
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(
    result.rows.map(row => row.rowNumber)
  )),
  authorityRecords
    .map(record => record.rowNumber)
    .sort((a, b) => a - b)
);

result.rows.forEach(entry => {
  const expected =
    authorityRecords.find(
      record =>
        record.distressLeadId ===
        entry.distressLeadId
    );

  assert(expected);

  assert.strictEqual(
    entry.groupNumber,
    expected.groupNumber
  );

  assert.strictEqual(
    entry.rowNumber,
    expected.rowNumber
  );

  assert.strictEqual(
    entry.proposedDurableKey,
    expected.proposedDurableKey
  );

  assert.strictEqual(
    entry.canonicalPropertyKey,
    expected.canonicalPropertyKey
  );

  headers.forEach(header => {
    assert.ok(
      Object.prototype.hasOwnProperty.call(
        entry.values,
        header
      ),
      'missing full-row header: ' + header
    );
  });
});

assert.throws(
  () => execute(
    persistedRows(),
    {
      distressLeadIds: [
        authorityRecords[0].distressLeadId
      ]
    }
  ),
  /Caller-defined Distress Lead ID authority is prohibited/
);

function expectDrift(mutator, pattern) {
  const rows = persistedRows();

  mutator(rows[0]);

  assert.throws(
    () => execute(rows, {}),
    pattern
  );
}

expectDrift(
  row => {
    row._rowNumber += 1;
  },
  /physical row mismatch/
);

expectDrift(
  row => {
    row.Source = 'OTHER';
  },
  /Source mismatch/
);

expectDrift(
  row => {
    row['Source Dataset'] = 'other';
  },
  /Source Dataset mismatch/
);

expectDrift(
  row => {
    row['Source Record ID'] = 'DRIFT';
  },
  /Source Record ID mismatch/
);

expectDrift(
  row => {
    row['Violation Number'] = 'VI-DRIFT';
  },
  /Violation Number mismatch/
);

expectDrift(
  row => {
    row['Canonical Property Key'] =
      'property|drift';
  },
  /Canonical Property Key mismatch/
);

expectDrift(
  row => {
    row['Source Observation Key'] =
      'pa-philadelphia|code_violations|drift';
  },
  /Source Observation Key mismatch/
);

{
  const rows = persistedRows();
  rows.pop();

  assert.throws(
    () => execute(rows, {}),
    /Certified collapse cohort is incomplete/
  );
}

{
  const rows = persistedRows();

  rows.push(
    Object.assign({}, rows[0])
  );

  assert.throws(
    () => execute(rows, {}),
    /duplicate persisted Distress Lead ID/
  );
}

[
  'productionDataMutationAuthorityGranted',
  'collapseAuthorityGranted',
  'winnerSelectionAuthorityGranted',
  'deleteAuthorityGranted',
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.strictEqual(
    result[field],
    false,
    field + ' must remain false'
  );
});

[
  /setValues\s*\(/,
  /setValue\s*\(/,
  /appendRow\s*\(/,
  /deleteRow\s*\(/,
  /deleteRows\s*\(/,
  /insertRow\s*\(/,
  /insertRows\s*\(/,
  /Database\.update\s*\(/,
  /Database\.insert\s*\(/,
  /Database\.upsert\s*\(/,
  /ScriptApp\.newTrigger\s*\(/
].forEach(pattern => {
  assert.strictEqual(
    pattern.test(readerSource),
    false,
    'forbidden reader surface: ' +
      pattern
  );
});

console.log(
  'PASS: exact certified 22-group / 46-row cohort succeeds'
);
console.log(
  'PASS: complete persisted header/value surface is returned'
);
console.log(
  'PASS: caller-defined population authority is prohibited'
);
console.log(
  'PASS: physical-row drift fails closed'
);
console.log(
  'PASS: connector scope drift fails closed'
);
console.log(
  'PASS: dataset scope drift fails closed'
);
console.log(
  'PASS: Source Record ID drift fails closed'
);
console.log(
  'PASS: Violation Number drift fails closed'
);
console.log(
  'PASS: canonical-property drift fails closed'
);
console.log(
  'PASS: certified legacy observation-key drift fails closed'
);
console.log(
  'PASS: missing certified row fails closed'
);
console.log(
  'PASS: duplicate certified Distress Lead ID fails closed'
);
console.log(
  'PASS: all mutation/collapse/winner/delete/offer authority remains false'
);
console.log('');
console.log(
  'Certified collapse full-row evidence v2 behavior validation PASSED.'
);
