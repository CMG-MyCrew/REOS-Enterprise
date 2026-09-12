#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');

const FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js';

const EXPECTED_SOURCE_SHA =
  '762abd7c1ffebec3e1e15a205a93b6ef4d564ccf8020d08fd315ccb4a9c49e49';

const EXPECTED_AUTHORITY_SHA =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const source = fs.readFileSync(FILE, 'utf8');

const sandbox = {
  REOS: {},
  Object,
  console
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const api =
  sandbox.REOS.CountyCodeViolationCollapseOnlyEvidenceAuthority;

assert(api);
assert.strictEqual(typeof api.records, 'function');
assert.strictEqual(typeof api.metadata, 'function');

const metadata =
  JSON.parse(JSON.stringify(api.metadata()));

const records =
  JSON.parse(JSON.stringify(api.records()));

assert.strictEqual(
  metadata.sourceEvidenceSha256,
  EXPECTED_SOURCE_SHA
);

assert.strictEqual(
  metadata.authoritySha256,
  EXPECTED_AUTHORITY_SHA
);

assert.strictEqual(metadata.groupCount, 22);
assert.strictEqual(metadata.rowCount, 46);

assert.strictEqual(records.length, 46);

const ids =
  records.map(record => record.distressLeadId);

const rows =
  records.map(record => record.rowNumber);

const groups =
  records.map(record => record.groupNumber);

const durableKeys =
  records.map(record => record.proposedDurableKey);

assert.strictEqual(new Set(ids).size, 46);
assert.strictEqual(new Set(rows).size, 46);
assert.strictEqual(new Set(groups).size, 22);
assert.strictEqual(new Set(durableKeys).size, 22);

records.forEach(record => {
  assert(Number.isInteger(record.groupNumber));
  assert(record.groupNumber >= 1);
  assert(record.groupNumber <= 22);

  assert(Number.isInteger(record.rowNumber));
  assert(record.rowNumber >= 2);

  assert.strictEqual(
    typeof record.distressLeadId,
    'string'
  );

  assert.strictEqual(
    typeof record.sourceRecordId,
    'string'
  );

  assert.strictEqual(
    typeof record.violationNumber,
    'string'
  );

  assert.strictEqual(
    typeof record.canonicalPropertyKey,
    'string'
  );

  assert.strictEqual(
    typeof record.legacyObservationKey,
    'string'
  );

  assert.strictEqual(
    typeof record.proposedDurableKey,
    'string'
  );

  const expectedDurable =
    'pa-philadelphia|code_violations|' +
    record.violationNumber.trim().toLowerCase();

  assert.strictEqual(
    record.proposedDurableKey,
    expectedDurable
  );
});

const groupMap = new Map();

records.forEach(record => {
  if (!groupMap.has(record.groupNumber)) {
    groupMap.set(record.groupNumber, []);
  }

  groupMap
    .get(record.groupNumber)
    .push(record);
});

assert.strictEqual(groupMap.size, 22);

let twoRowGroups = 0;
let threeRowGroups = 0;

groupMap.forEach(groupRecords => {
  if (groupRecords.length === 2) {
    twoRowGroups += 1;
  } else if (groupRecords.length === 3) {
    threeRowGroups += 1;
  } else {
    assert.fail(
      'unexpected group size: ' +
      groupRecords.length
    );
  }

  assert.strictEqual(
    new Set(
      groupRecords.map(
        record =>
          record.proposedDurableKey
      )
    ).size,
    1
  );

  assert.strictEqual(
    new Set(
      groupRecords.map(
        record =>
          record.canonicalPropertyKey
      )
    ).size,
    1
  );
});

assert.strictEqual(twoRowGroups, 20);
assert.strictEqual(threeRowGroups, 2);

const normalized =
  records
    .slice()
    .sort(
      (a, b) =>
        a.rowNumber - b.rowNumber
    );

assert.deepStrictEqual(
  records,
  normalized,
  'authority records must remain physical-row ordered'
);

const payload =
  JSON.stringify(
    records.map(record => {
      const ordered = {};

      Object.keys(record)
        .sort()
        .forEach(key => {
          ordered[key] =
            record[key];
        });

      return ordered;
    })
  );

const actualAuthoritySha =
  crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');

assert.strictEqual(
  actualAuthoritySha,
  EXPECTED_AUTHORITY_SHA
);

[
  'collapseAuthorityGranted',
  'winnerSelectionAuthorityGranted',
  'deleteAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.strictEqual(
    metadata[field],
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
    pattern.test(source),
    false,
    'forbidden authority surface: ' +
    pattern
  );
});

console.log(
  'PASS: source evidence SHA is exact'
);
console.log(
  'PASS: authority SHA is exact'
);
console.log(
  'PASS: exact 22-group / 46-row population'
);
console.log(
  'PASS: 46 unique Distress Lead IDs'
);
console.log(
  'PASS: 46 unique physical rows'
);
console.log(
  'PASS: 22 unique durable observation keys'
);
console.log(
  'PASS: each group has exactly one durable key'
);
console.log(
  'PASS: each group has exactly one canonical property'
);
console.log(
  'PASS: group-size distribution is 20x2 + 2x3'
);
console.log(
  'PASS: durable keys derive exactly from Violation Number'
);
console.log(
  'PASS: authority records remain physical-row ordered'
);
console.log(
  'PASS: no mutation or scheduler surface exists'
);
console.log(
  'PASS: all collapse/winner/delete/offer authority remains false'
);
console.log('');
console.log(
  'Collapse-only evidence authority validation PASSED.'
);
