#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js';

const source =
  fs.readFileSync(FILE, 'utf8');

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

const rows = [
  {
    _rowNumber: 12,
    'Distress Lead ID': 'DL-B',
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Source Record ID': '20',
    'Violation Number': 'VI-20',
    'Canonical Property Key': 'property|parcel|pa|philadelphia|20',
    'Source Observation Key': 'legacy|20',
    Notes: 'second'
  },
  {
    _rowNumber: 8,
    'Distress Lead ID': 'DL-A',
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Source Record ID': '10',
    'Violation Number': 'VI-10',
    'Canonical Property Key': 'property|parcel|pa|philadelphia|10',
    'Source Observation Key': 'legacy|10',
    Notes: 'first'
  },
  {
    _rowNumber: 30,
    'Distress Lead ID': 'DL-OTHER',
    Source: 'OTHER',
    'Source Dataset': 'other',
    'Source Record ID': '30'
  }
];

const sandbox = {
  REOS: {
    Database: {
      getHeaders(table) {
        assert.strictEqual(table, 'DISTRESS_LEADS');
        return headers.slice();
      },

      getAll(table) {
        assert.strictEqual(table, 'DISTRESS_LEADS');
        return rows.map(row => Object.assign({}, row));
      }
    },

    Security: {
      requireAdmin() {
        return true;
      }
    }
  },

  console
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const api =
  sandbox.REOS.CountyCodeViolationCollapseFullRowEvidence;

assert(api);
assert.strictEqual(typeof api.exportEvidence, 'function');

const result =
  api.exportEvidence({
    distressLeadIds: [
      'DL-B',
      'DL-A',
      'DL-A',
      'DL-MISSING'
    ]
  });

assert.strictEqual(result.ok, true);
assert.strictEqual(
  result.mode,
  'READ_ONLY_CODE_VIOLATION_COLLAPSE_FULL_ROW_EVIDENCE'
);

assert.strictEqual(result.table, 'DISTRESS_LEADS');
assert.strictEqual(result.scope.connectorId, 'PA-PHILADELPHIA');
assert.strictEqual(result.scope.dataset, 'code_violations');

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(result.requestedIds)),
  ['DL-B', 'DL-A', 'DL-MISSING']
);

assert.strictEqual(result.requestedIdCount, 3);
assert.strictEqual(result.returnedRowCount, 2);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(result.missingIds)),
  ['DL-MISSING']
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(result.headers)),
  headers
);

assert.deepStrictEqual(
  JSON.parse(JSON.stringify(
    result.rows.map(row => row.rowNumber)
  )),
  [8, 12]
);

assert.strictEqual(
  result.rows[0].distressLeadId,
  'DL-A'
);

assert.strictEqual(
  result.rows[0].values.Notes,
  'first'
);

assert.strictEqual(
  result.rows[1].values.Notes,
  'second'
);

headers.forEach(header => {
  assert.ok(
    Object.prototype.hasOwnProperty.call(
      result.rows[0].values,
      header
    ),
    'missing persisted header: ' + header
  );
});

[
  'productionDataMutationAuthorityGranted',
  'collapseAuthorityGranted',
  'winnerAuthorityGranted',
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

assert.throws(
  () => api.exportEvidence({}),
  /At least one Distress Lead ID is required/
);

assert.throws(
  () => api.exportEvidence({
    distressLeadIds:
      Array.from(
        { length: 47 },
        (_, i) => 'DL-' + i
      )
  }),
  /limited to 46 Distress Lead IDs/
);

assert.throws(
  () => api.exportEvidence({
    distressLeadIds: ['DL-OTHER']
  }),
  /outside certified scope/
);

[
  /setValues\s*\(/,
  /setValue\s*\(/,
  /appendRow\s*\(/,
  /deleteRow\s*\(/,
  /insertRow\s*\(/,
  /Database\.update\s*\(/,
  /Database\.insert\s*\(/,
  /Database\.upsert\s*\(/
].forEach(pattern => {
  assert.strictEqual(
    pattern.test(source),
    false,
    'mutation primitive detected: ' + pattern
  );
});

console.log(
  'PASS: exact Philadelphia code_violations scope'
);
console.log(
  'PASS: explicit ID selection and deduplication'
);
console.log(
  'PASS: maximum 46-ID evidence boundary'
);
console.log(
  'PASS: full persisted header/value preservation'
);
console.log(
  'PASS: deterministic physical-row ordering'
);
console.log(
  'PASS: missing requested IDs are reported'
);
console.log(
  'PASS: out-of-scope requested rows fail closed'
);
console.log(
  'PASS: all mutation and authority flags remain false'
);
console.log(
  'PASS: no mutation primitives present'
);
console.log('');
console.log(
  'Collapse full-row evidence validator PASSED.'
);
