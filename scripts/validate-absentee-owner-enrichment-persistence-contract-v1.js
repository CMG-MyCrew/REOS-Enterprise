#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CONTRACT_PATH = path.join(
  ROOT,
  'docs/absentee-owner-enrichment-persistence-contract-v1.md'
);

const FIXTURE_PATH = path.join(
  ROOT,
  'scripts/fixtures/absentee-owner-enrichment-persistence-contract-v1.json'
);

let checks = 0;

function check(value, message) {
  checks += 1;
  assert.ok(value, message);
}

function equal(actual, expected, message) {
  checks += 1;
  assert.deepStrictEqual(actual, expected, message);
}

const contract = fs.readFileSync(CONTRACT_PATH, 'utf8');
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));
const normalizedContract = contract.replace(/\s+/g, ' ').trim();

equal(fixture.contractVersion, 1, 'contractVersion must remain 1');

equal(
  fixture.targetTable,
  'DISTRESS_LEADS',
  'target table must remain DISTRESS_LEADS'
);

equal(
  fixture.requiredIdentity,
  ['Distress Lead ID', 'Canonical Property Key'],
  'required identity must remain exact'
);

equal(
  fixture.acceptedWriteOutcome,
  'MATCHED',
  'only MATCHED may become eligible for future persistence'
);

equal(
  fixture.ownedSemanticFields,
  ['Owner Name', 'Owner Mailing Address'],
  'owned semantic fields must remain exact'
);

equal(
  fixture.persistenceExecutionAuthorized,
  false,
  'Phase 1E must not authorize persistence execution'
);

equal(
  fixture.databaseUpdateAuthorized,
  false,
  'Phase 1E must not authorize Database.update execution'
);

equal(
  fixture.databaseInsertAuthorized,
  false,
  'Phase 1E must not authorize Database.insert execution'
);

equal(
  fixture.databaseUpsertAuthorized,
  false,
  'Phase 1E must not authorize Database.upsert execution'
);

equal(
  fixture.dealCreationAuthorized,
  false,
  'Phase 1E must not authorize deal creation'
);

equal(
  fixture.maoGenerationAuthorized,
  false,
  'Phase 1E must not authorize MAO generation'
);

equal(
  fixture.automaticOfferAuthorityGranted,
  false,
  'Phase 1E must not grant automatic offer authority'
);

const requiredProtectedFields = [
  'Distress Lead ID',
  'Canonical Property Key',
  'Address',
  'City',
  'State',
  'Zip',
  'Distress Type',
  'Distress Score',
  'Estimated Value',
  'Estimated Repairs',
  'Suggested Offer',
  'Lead Source',
  'Status',
  'Notes',
  'Imported Deal ID',
  'Created At',
  'ARV',
  'MAO',
  'automaticOfferAuthorityGranted'
];

for (const field of requiredProtectedFields) {
  check(
    fixture.protectedFields.includes(field),
    `protected field missing: ${field}`
  );

  check(
    !fixture.ownedSemanticFields.includes(field),
    `protected field classified as owned: ${field}`
  );
}

const requiredFixtureIds = [
  'matched-existing-record',
  'missing-distress-lead-id',
  'missing-canonical-property-key',
  'record-not-found',
  'duplicate-distress-lead-id',
  'ambiguous-canonical-property-key',
  'identity-dimensions-resolve-to-different-records',
  'no-match-owner-write-attempt',
  'ambiguous-owner-write-attempt',
  'failed-owner-write-attempt',
  'protected-distress-lead-id-injection',
  'protected-lead-source-injection',
  'protected-status-injection',
  'protected-imported-deal-id-injection',
  'protected-arv-injection',
  'protected-repair-injection',
  'protected-suggested-offer-injection',
  'protected-mao-injection',
  'automatic-offer-authority-injection',
  'unknown-field-injection',
  'raw-provider-row-as-patch',
  'generic-csv-row-as-patch',
  'malformed-sanitized-result'
];

const fixtureIds = fixture.fixtures.map(item => item.id);

equal(
  fixtureIds,
  requiredFixtureIds,
  'fixture declaration set/order changed'
);

equal(
  fixture.fixtures[0].expected,
  'ELIGIBLE_FOR_FUTURE_PERSISTENCE',
  'MATCHED fixture must not claim persistence already occurred'
);

for (const item of fixture.fixtures.slice(1)) {
  equal(
    item.expected,
    'REJECT',
    `fixture ${item.id} must fail closed`
  );
}

const requiredContractPhrases = [
  'Absentee-owner enrichment is subordinate evidence',
  'Raw provider rows are not persistence input.',
  'Generic CSV-import payloads are not persistence input.',
  'The adapter must update an existing record only.',
  'It must never create or upsert a missing acquisition record.',
  '`Distress Lead ID`',
  '`Canonical Property Key`',
  'Both supplied values must resolve to the same existing acquisition record.',
  'Only:',
  '`MATCHED`',
  '`Owner Name`',
  '`Owner Mailing Address`',
  'No other semantic acquisition field is writable through this boundary.',
  'A future persistence adapter must construct a fresh patch',
  'This contract itself grants no database-write authority.',
  'The historical generic absentee-owner CSV connector is not the v1 enrichment persistence boundary.',
  'No automatic MAO or offer authority may exist unless both comp-supported ARV and an adequate repair scope are independently present.',
  'Phase 1E is contract-only.',
  'persistence adapter implementation;',
  '`REOS.Database.update()` execution;',
  'production mutation;',
  'automatic offer authority.'
];

for (const phrase of requiredContractPhrases) {
  check(
    normalizedContract.includes(phrase),
    `contract phrase missing: ${phrase}`
  );
}

const forbiddenPositiveGrants = [
  'databaseUpdateAuthorized: true',
  'databaseInsertAuthorized: true',
  'databaseUpsertAuthorized: true',
  'persistenceExecutionAuthorized: true',
  'dealCreationAuthorized: true',
  'maoGenerationAuthorized: true',
  'automaticOfferAuthorityGranted: true'
];

for (const grant of forbiddenPositiveGrants) {
  check(
    !contract.includes(grant),
    `forbidden authority grant present: ${grant}`
  );
}

check(
  !fixture.ownedSemanticFields.includes('Updated At'),
  'Updated At must not become an enrichment-owned semantic field'
);

check(
  normalizedContract.includes(
    'It is not an enrichment-owned semantic field'
  ),
  'Updated At consequence rule missing'
);

console.log('ABSENTEE_OWNER_ENRICHMENT_PERSISTENCE_CONTRACT_V1_VALID=true');
console.log(`CHECKS=${checks}`);
console.log('TARGET_TABLE=DISTRESS_LEADS');
console.log('OWNED_SEMANTIC_FIELDS=Owner Name|Owner Mailing Address');
console.log('PERSISTENCE_EXECUTION_AUTHORIZED=false');
console.log('DATABASE_UPDATE_AUTHORIZED=false');
console.log('DATABASE_INSERT_AUTHORIZED=false');
console.log('DATABASE_UPSERT_AUTHORIZED=false');
console.log('DEAL_CREATION_AUTHORIZED=false');
console.log('MAO_GENERATION_AUTHORIZED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
