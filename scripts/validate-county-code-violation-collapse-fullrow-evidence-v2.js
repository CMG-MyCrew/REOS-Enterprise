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
  'Notes',
  'Source Record Key', 'Parcel ID', 'Address', 'City', 'State', 'Zip', 'County'
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

// Synthetic fixtures reconstructed from catalog keys; not live evidence.
function identityInputs(record) {
  const parts = record.canonicalPropertyKey.split('|');
  assert.strictEqual(parts[0], 'property');
  if (parts[1] === 'address') {
    assert.strictEqual(parts.length, 6);
    return {
      State: parts[2], City: parts[3], County: parts[3],
      Zip: parts[4], Address: parts[5], 'Parcel ID': ''
    };
  }
  assert.strictEqual(parts[1], 'parcel');
  assert.strictEqual(parts.length, 5);
  return {
    State: parts[2], County: parts[3], City: '',
    Zip: '', Address: '', 'Parcel ID': parts[4]
  };
}

function persistedRows() {
  return authorityRecords.map(record => ({
    ...identityInputs(record),
    'Source Record Key': record.legacyObservationKey,
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
    fs.readFileSync('build/apps-script-brand/CanonicalPropertyIdentity.js', 'utf8'),
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

for (const blankFields of [
  ['Canonical Property Key'],
  ['Source Observation Key'],
  ['Canonical Property Key', 'Source Observation Key']
]) {
  const rows = persistedRows();
  rows.forEach(row => blankFields.forEach(field => { row[field] = ''; }));
  const before = JSON.stringify(rows);
  const output = execute(rows, {});
  assert.strictEqual(output.returnedRowCount, 46);
  assert.strictEqual(JSON.stringify(rows), before);
  output.rows.forEach(entry => {
    const expected = authorityRecords.find(record =>
      record.distressLeadId === entry.distressLeadId);
    blankFields.forEach(field => assert.strictEqual(entry.values[field], ''));
    assert.strictEqual(entry.derivedIdentity.canonicalPropertyKey,
      expected.canonicalPropertyKey);
    assert.strictEqual(entry.derivedIdentity.sourceObservationKey,
      expected.legacyObservationKey);
  });
}

// Matching stored identity must not hide independently derived drift.
expectDrift(row => { row.Address = '999 synthetic drift street'; },
  /Derived Canonical Property Key mismatch/);

// Blank identity does not excuse an invalid address.
expectDrift(row => {
  row['Canonical Property Key'] = '';
  row['Source Observation Key'] = '';
  row.Address = '';
}, /Canonical property identity requires/);

expectDrift(row => {
  row['Source Record Key'] = 'conflicting-legacy-key';
}, /Source Record Key mismatch/);

{
  const rows = persistedRows();
  const parcelRow = rows.find(row => row['Parcel ID']);
  assert(parcelRow);
  parcelRow['Parcel ID'] = '999999999';
  assert.throws(() => execute(rows, {}),
    /Derived Canonical Property Key mismatch/);
}

{
  const rows = persistedRows();
  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      row['Canonical Property Key'] = '';
      row['Source Observation Key'] = '';
    }
  });
  assert.strictEqual(execute(rows, {}).returnedRowCount, 46);
}

for (const field of ['Canonical Property Key', 'Source Observation Key']) {
  const index = headers.indexOf(field);
  headers.splice(index, 1);
  try {
    assert.throws(() => execute(persistedRows(), {}),
      /Required header must occur exactly once/);
  } finally {
    headers.splice(index, 0, field);
  }
  headers.push(field);
  try {
    assert.throws(() => execute(persistedRows(), {}),
      /Required header must occur exactly once/);
  } finally {
    headers.pop();
  }
}

console.log('PASS: blank, populated, and mixed stored identity remains raw');
console.log('PASS: actual resolver independently verifies every catalog member');
console.log('PASS: stored conflicts and derived address/parcel drift fail closed');
console.log('PASS: identity header absence and duplication fail closed');
