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
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const EXCLUDED_IDS = new Set([
  'DL-20260820181647-4170',
  'ZIL-20260820193920-1756'
]);

const EXPECTED_GROUPS = [
  1, 2,
  4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16,
  17, 18, 19, 20, 21, 22
];

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const sandbox = {
  REOS: {},
  Object,
  console
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const api =
  sandbox.REOS
    .CountyCodeViolationCollapseOnlyEvidenceAuthority;

assert(api);

const metadata =
  JSON.parse(
    JSON.stringify(
      api.metadata()
    )
  );

const records =
  JSON.parse(
    JSON.stringify(
      api.records()
    )
  );

assert.strictEqual(
  metadata.sourceEvidenceSha256,
  EXPECTED_SOURCE_SHA
);

assert.strictEqual(
  metadata.authoritySha256,
  EXPECTED_AUTHORITY_SHA
);

assert.strictEqual(
  metadata.groupCount,
  21
);

assert.strictEqual(
  metadata.rowCount,
  44
);

assert.strictEqual(
  records.length,
  44
);

const ids =
  records.map(
    record =>
      record.distressLeadId
  );

const rows =
  records.map(
    record =>
      Number(record.rowNumber)
  );

const groups =
  Array.from(
    new Set(
      records.map(
        record =>
          Number(record.groupNumber)
      )
    )
  ).sort(
    (a, b) =>
      a - b
  );

assert.deepStrictEqual(
  groups,
  EXPECTED_GROUPS
);

assert.strictEqual(
  new Set(ids).size,
  44
);

assert.strictEqual(
  new Set(rows).size,
  44
);

EXCLUDED_IDS.forEach(id => {
  assert.strictEqual(
    ids.includes(id),
    false,
    'Historical Group 3 ID must remain excluded: ' +
      id
  );
});

assert.strictEqual(
  records.some(
    record =>
      Number(record.groupNumber) === 3
  ),
  false
);

const groupMap =
  new Map();

records.forEach(record => {
  assert.ok(
    Number.isInteger(
      record.groupNumber
    )
  );

  assert.ok(
    Number.isInteger(
      record.rowNumber
    )
  );

  const expectedDurable =
    'pa-philadelphia|code_violations|' +
    record.violationNumber
      .trim()
      .toLowerCase();

  assert.strictEqual(
    record.proposedDurableKey,
    expectedDurable
  );

  if (
    !groupMap.has(
      record.groupNumber
    )
  ) {
    groupMap.set(
      record.groupNumber,
      []
    );
  }

  groupMap
    .get(record.groupNumber)
    .push(record);
});

assert.strictEqual(
  groupMap.size,
  21
);

let twoRowGroups = 0;
let threeRowGroups = 0;

for (
  const [
    groupNumber,
    members
  ] of groupMap
) {
  if (
    members.length === 2
  ) {
    twoRowGroups++;
  } else if (
    members.length === 3
  ) {
    threeRowGroups++;
  } else {
    assert.fail(
      'Unexpected group size ' +
      groupNumber +
      '=' +
      members.length
    );
  }

  assert.strictEqual(
    new Set(
      members.map(
        record =>
          record.proposedDurableKey
      )
    ).size,
    1
  );

  assert.strictEqual(
    new Set(
      members.map(
        record =>
          record.canonicalPropertyKey
      )
    ).size,
    1
  );
}

assert.strictEqual(
  twoRowGroups,
  19
);

assert.strictEqual(
  threeRowGroups,
  2
);

const normalized =
  records
    .slice()
    .sort(
      (a, b) =>
        Number(a.rowNumber) -
        Number(b.rowNumber)
    );

assert.deepStrictEqual(
  records,
  normalized,
  'Authority must remain physical-row ordered.'
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

const actualSha =
  crypto
    .createHash('sha256')
    .update(payload, 'utf8')
    .digest('hex');

assert.strictEqual(
  actualSha,
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
    field
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
    'Forbidden authority surface: ' +
      pattern
  );
});

console.log(
  'POST_RESTORATION_AUTHORITY_VALIDATOR_PASS=true'
);

console.log(
  'POST_RESTORATION_GROUP_COUNT=21'
);

console.log(
  'POST_RESTORATION_ROW_COUNT=44'
);

console.log(
  'POST_RESTORATION_GROUP3_EXCLUDED=true'
);

console.log(
  'POST_RESTORATION_AUTHORITY_SHA256=' +
  actualSha
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
