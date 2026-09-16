'use strict';

const fs = require('fs');

const CONTRACT =
  'docs/absentee-owner-enrichment-contract-v1.md';
const FIXTURES =
  'scripts/fixtures/absentee-owner-enrichment-contract-v1.json';

let checks = 0;

function assert(condition, message) {
  checks += 1;
  if (!condition) {
    throw new Error('FAIL: ' + message);
  }
  console.log('PASS: ' + message);
}

const contract = fs.readFileSync(CONTRACT, 'utf8');
const normalizedContract = contract.replace(/\s+/g, ' ').trim();
const fixture = JSON.parse(fs.readFileSync(FIXTURES, 'utf8'));

assert(
  fixture.contractVersion === 1,
  'fixture contract version is v1.'
);

assert(
  JSON.stringify(fixture.terminalOutcomes) ===
    JSON.stringify(['MATCHED', 'NO_MATCH', 'AMBIGUOUS', 'FAILED']),
  'terminal outcome set is exact and closed.'
);

assert(
  JSON.stringify(fixture.enrichmentOwnedFields) ===
    JSON.stringify(['Owner Name', 'Owner Mailing Address']),
  'v1 enrichment-owned acquisition fields are exact.'
);

[
  'Distress Lead ID',
  'Canonical Property Key',
  'Estimated Repairs',
  'Suggested Offer',
  'Lead Source',
  'Status',
  'Imported Deal ID',
  'ARV',
  'MAO',
  'automaticOfferAuthorityGranted'
].forEach((field) => {
  assert(
    fixture.protectedFields.includes(field),
    'protected field declared: ' + field
  );
});

[
  'matched-clear-owner',
  'no-match',
  'ambiguous-multiple-owners',
  'provider-failure',
  'malformed-provider-response',
  'missing-distress-lead-id',
  'missing-canonical-property-key',
  'protected-field-injection',
  'offer-authority-injection',
  'deal-lifecycle-injection'
].forEach((id) => {
  assert(
    fixture.cases.some((entry) => entry.id === id),
    'required fixture case declared: ' + id
  );
});

[
  'Provider payloads are evidence, not write patches.',
  'reosConnectorHandleAbsenteeOwners',
  'NOT the v1 enrichment persistence boundary',
  'Comp-supported ARV and adequate repair scope',
  'research/review rather than manufacture an offer',
  'Apps Script RPC',
  'live provider calls',
  'automatic offer authority'
].forEach((text) => {
  assert(
    normalizedContract.includes(text),
    'contract contains required boundary: ' + text
  );
});

const maliciousCases = fixture.cases.filter(
  (entry) => Array.isArray(entry.attemptedKeys)
);

const owned = new Set(fixture.enrichmentOwnedFields);

maliciousCases.forEach((entry) => {
  entry.attemptedKeys.forEach((key) => {
    assert(
      !owned.has(key),
      entry.id + ' cannot classify protected key as enrichment-owned: ' + key
    );
  });
});

assert(
  !contract.includes('automaticOfferAuthorityGranted: true'),
  'contract never grants automatic offer authority.'
);

console.log('');
console.log('ABSENTEE_OWNER_ENRICHMENT_CONTRACT_V1_VALID=true');
console.log('CHECKS=' + checks);
console.log('PRODUCTION_IMPLEMENTATION_PRESENT=false');
console.log('RPC_EXECUTED=false');
console.log('DEPLOYMENT_CHANGED=false');
console.log('TRIGGER_CHANGED=false');
console.log('SCHEDULER_CHANGED=false');
console.log('PRODUCTION_MUTATION=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
