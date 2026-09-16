'use strict';

const fs = require('fs');
const assert = require('assert');

const doc = fs.readFileSync(
  'docs/absentee-owner-enrichment-execution-contract-v1.md',
  'utf8'
);

const fixture = JSON.parse(
  fs.readFileSync(
    'scripts/fixtures/absentee-owner-enrichment-execution-contract-v1.json',
    'utf8'
  )
);

let checks = 0;

function check(condition, message) {
  checks += 1;
  assert.ok(condition, message);
}

check(
  fixture.targetTable === 'DISTRESS_LEADS',
  'target must be DISTRESS_LEADS'
);

check(
  JSON.stringify(fixture.requiredIdentity) ===
    JSON.stringify([
      'Distress Lead ID',
      'Canonical Property Key'
    ]),
  'dual identity must remain exact'
);

check(
  JSON.stringify(fixture.ownedSemanticFields) ===
    JSON.stringify([
      'Owner Name',
      'Owner Mailing Address'
    ]),
  'owned semantic writeset changed'
);

check(
  JSON.stringify(fixture.allowedPhysicalConsequences) ===
    JSON.stringify(['Updated At']),
  'Updated At must be the only physical consequence'
);

check(
  JSON.stringify(fixture.maximumPhysicalMutationFields) ===
    JSON.stringify([
      'Owner Name',
      'Owner Mailing Address',
      'Updated At'
    ]),
  'maximum physical mutation set changed'
);

check(
  fixture.requiresCallerOwnedScriptLock === true,
  'caller-owned ScriptLock must be required'
);

check(
  fixture.requiresDualIdentityRevalidation === true,
  'dual identity revalidation must be required'
);

check(
  fixture.requiresCompletePreimage === true,
  'complete preimage verification must be required'
);

check(
  fixture.requiresCompletePostimage === true,
  'complete postimage verification must be required'
);

check(
  fixture.allowsInsert === false &&
    fixture.allowsUpsert === false,
  'insert/upsert must remain forbidden'
);

check(
  fixture.allowsDealCreation === false &&
    fixture.allowsMaoGeneration === false &&
    fixture.allowsAutomaticOfferAuthority === false,
  'acquisition authority must remain false'
);

check(
  fixture.authorizesProductionExecution === false,
  'contract must not authorize production execution'
);

check(
  fixture.existingPhysicalPatchPrimitiveDirectlyAuthorized === false,
  'existing specialized physical patch primitive must not be directly authorized'
);

[
  'ABSENTEE_OWNER_EXECUTION_VERIFIED',
  'ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN'
].forEach((classification) => {
  check(
    doc.includes(classification),
    `missing outcome classification ${classification}`
  );
});

[
  '`Distress Lead ID`',
  '`Canonical Property Key`',
  '`Owner Name`',
  '`Owner Mailing Address`',
  '`Updated At`'
].forEach((token) => {
  check(
    doc.includes(token),
    `missing contract token ${token}`
  );
});

[
  'REOS.Database.update()',
  'insert()',
  'upsert()',
  'patchPhysicalRowCellsExact()'
].forEach((token) => {
  check(
    doc.includes(token),
    `missing database-boundary token ${token}`
  );
});

check(
  /not directly authorized/i.test(doc),
  'existing physical patch primitive must remain unauthorized'
);

check(
  fixture.requiresDualIdentityRevalidation === true &&
    JSON.stringify(fixture.requiredIdentity) ===
      JSON.stringify([
        'Distress Lead ID',
        'Canonical Property Key'
      ]) &&
    /both values[\s\S]*resolve uniquely to the same existing[\s\S]*physical row/i.test(
      doc.replace(/\s+/g, ' ')
    ),
  'same-row dual identity invariant missing'
);

check(
  /first physical write/i.test(doc),
  'definite no-write boundary missing'
);

check(
  /complete verified postimage/i.test(doc),
  'verified postimage success boundary missing'
);

check(
  /independent of county scheduler operation/i.test(doc),
  'scheduler isolation missing'
);

check(
  /Persistence execution remains unauthorized/i.test(doc),
  'execution must remain unauthorized'
);

console.log(
  'ABSENTEE_OWNER_PHASE1G_EXECUTION_CONTRACT_VALID=true'
);
console.log(`CHECKS=${checks}`);
console.log(
  'PRODUCTION_EXECUTION_AUTHORIZED=false'
);
console.log(
  'DATABASE_UPDATE_AUTHORIZED=false'
);
console.log(
  'DATABASE_INSERT_AUTHORIZED=false'
);
console.log(
  'DATABASE_UPSERT_AUTHORIZED=false'
);
console.log(
  'DEAL_CREATION_AUTHORIZED=false'
);
console.log(
  'MAO_AUTHORIZED=false'
);
console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
