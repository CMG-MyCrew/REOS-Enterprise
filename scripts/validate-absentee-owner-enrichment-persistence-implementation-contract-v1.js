'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const target = path.resolve(
  __dirname,
  '../build/apps-script-brand/AbsenteeOwnerEnrichmentPersistenceAdapter.js'
);

const text = fs.readFileSync(target, 'utf8');

let checks = 0;

function check(fn) {
  fn();
  checks += 1;
}

[
  "TARGET_TABLE = 'DISTRESS_LEADS'",
  "'Owner Name'",
  "'Owner Mailing Address'",
  "'Distress Lead ID'",
  "'Canonical Property Key'",
  "result.outcome !== 'MATCHED'",
  'distressMatches.length !== 1',
  'canonicalMatches.length !== 1',
  'IDENTITY_DIMENSIONS_RESOLVE_TO_DIFFERENT_RECORDS',
  'WRITE_KEY_NOT_ALLOWED:',
  'EMPTY_OWNER_PATCH',
  'persistenceExecutionAuthorized: false',
  'databaseUpdateAuthorized: false',
  'databaseInsertAuthorized: false',
  'databaseUpsertAuthorized: false',
  'dealCreationAuthorized: false',
  'maoGenerationAuthorized: false',
  'automaticOfferAuthorityGranted: false'
].forEach(token => {
  check(() => {
    assert.ok(
      text.includes(token),
      'missing required token: ' + token
    );
  });
});

[
  'REOS.Database.update(',
  'REOS.Database.insert(',
  'REOS.Database.upsert(',
  '.appendRow(',
  '.setValue(',
  '.setValues(',
  'UrlFetchApp',
  'SpreadsheetApp',
  'LockService',
  'PropertiesService',
  'GmailApp',
  'DriveApp',
  'ScriptApp',
  'google.script.run',
  'reosConnectorHandleAbsenteeOwners'
].forEach(token => {
  check(() => {
    assert.ok(
      !text.includes(token),
      'forbidden execution surface: ' + token
    );
  });
});

check(() => {
  assert.ok(
    !/persistenceExecutionAuthorized\s*:\s*true/.test(text)
  );
});

check(() => {
  assert.ok(
    !/databaseUpdateAuthorized\s*:\s*true/.test(text)
  );
});

check(() => {
  assert.ok(
    !/databaseInsertAuthorized\s*:\s*true/.test(text)
  );
});

check(() => {
  assert.ok(
    !/databaseUpsertAuthorized\s*:\s*true/.test(text)
  );
});

check(() => {
  assert.ok(
    !/automaticOfferAuthorityGranted\s*:\s*true/.test(text)
  );
});

assert.ok(
  text.includes(
    "result.dealCreationAuthorized !== false"
  ),
  'Adapter must require explicit false deal creation authority.'
);

assert.ok(
  text.includes(
    "'SANITIZER_DEAL_CREATION_AUTHORITY_INVALID'"
  ),
  'Adapter must fail closed on invalid deal creation authority.'
);

assert.ok(
  text.includes(
    '!Number.isInteger(distressRow)'
  ),
  'Adapter must require integer distress physical row.'
);

assert.ok(
  text.includes(
    '!Number.isInteger(canonicalRow)'
  ),
  'Adapter must require integer canonical physical row.'
);

assert.ok(
  text.includes(
    'distressRow < 2'
  ),
  'Adapter must reject non-data distress rows.'
);

assert.ok(
  text.includes(
    'canonicalRow < 2'
  ),
  'Adapter must reject non-data canonical rows.'
);

assert.ok(
  text.includes(
    "'PHYSICAL_ROW_NUMBER_INVALID'"
  ),
  'Adapter must fail closed on invalid physical row evidence.'
);

console.log(
  'ABSENTEE_OWNER_ENRICHMENT_PERSISTENCE_IMPLEMENTATION_CONTRACT_V1_VALID=true'
);
console.log('CHECKS=' + checks);
console.log('PERSISTENCE_EXECUTION_AUTHORIZED=false');
console.log('DATABASE_UPDATE_AUTHORIZED=false');
console.log('DATABASE_INSERT_AUTHORIZED=false');
console.log('DATABASE_UPSERT_AUTHORIZED=false');
console.log('PRODUCTION_MUTATION=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
