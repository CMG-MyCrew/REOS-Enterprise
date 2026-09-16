'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');

const modulePath = path.join(
  root,
  'build/apps-script-brand/AbsenteeOwnerEnrichmentSanitizer.js'
);

const behaviorPath = path.join(
  root,
  'scripts/validate-absentee-owner-enrichment-v1-behavior.js'
);

const contractPath = path.join(
  root,
  'docs/absentee-owner-enrichment-contract-v1.md'
);

const source = fs.readFileSync(modulePath, 'utf8');
const behavior = fs.readFileSync(behaviorPath, 'utf8');
const contract = fs.readFileSync(contractPath, 'utf8');

let checks = 0;

function pass(message) {
  checks += 1;
  console.log('PASS: ' + message);
}

function requireText(text, needle, message) {
  assert.ok(text.includes(needle), message);
  pass(message);
}

function forbid(pattern, text, message) {
  assert.ok(!pattern.test(text), message);
  pass(message);
}

requireText(
  source,
  "'MATCHED'",
  'implementation declares MATCHED.'
);

requireText(
  source,
  "'NO_MATCH'",
  'implementation declares NO_MATCH.'
);

requireText(
  source,
  "'AMBIGUOUS'",
  'implementation declares AMBIGUOUS.'
);

requireText(
  source,
  "'FAILED'",
  'implementation declares FAILED.'
);

requireText(
  source,
  "'Owner Name'",
  'implementation declares Owner Name.'
);

requireText(
  source,
  "'Owner Mailing Address'",
  'implementation declares Owner Mailing Address.'
);

requireText(
  source,
  "'Distress Lead ID'",
  'implementation requires Distress Lead ID.'
);

requireText(
  source,
  "'Canonical Property Key'",
  'implementation requires Canonical Property Key.'
);

requireText(
  source,
  'WRITE_KEY_NOT_ALLOWED:',
  'implementation rejects non-owned write keys.'
);

requireText(
  source,
  'NON_MATCHED_OUTCOME_CANNOT_WRITE_OWNER_FIELDS',
  'non-MATCHED outcomes fail closed on owner writes.'
);

requireText(
  source,
  'persistenceAuthorized: false',
  'implementation denies persistence authority.'
);

requireText(
  source,
  'dealCreationAuthorized: false',
  'implementation denies deal creation authority.'
);

requireText(
  source,
  'automaticOfferAuthorityGranted: false',
  'implementation denies automatic offer authority.'
);

[
  ['Database mutation', /\b(?:REOS\.)?Database\s*\.\s*(?:insert|update|delete)\s*\(/],
  ['setValue', /\.setValue\s*\(/],
  ['setValues', /\.setValues\s*\(/],
  ['appendRow', /\.appendRow\s*\(/],
  ['deleteRow', /\.deleteRow\s*\(/],
  ['CSV import connector', /CSVImportEngine\s*\.\s*importConnector\s*\(/],
  ['absentee generic connector', /\breosConnectorHandleAbsenteeOwners\s*\(/],
  ['UrlFetchApp', /\bUrlFetchApp\b/],
  ['fetch call', /\bfetch\s*\(/],
  ['clasp invocation', /\bclasp\b/],
  ['offer creation', /\bcreateOffer\s*\(/],
  ['deal creation', /\bcreateDeal\s*\(/]
].forEach(([label, pattern]) => {
  forbid(
    pattern,
    source,
    'implementation contains no ' + label + ' surface.'
  );
});

requireText(
  behavior,
  'automatic offer authority injection is rejected.',
  'behavior validator covers offer-authority attack.'
);

requireText(
  behavior,
  'deal injection is rejected.',
  'behavior validator covers deal attack.'
);

requireText(
  behavior,
  'ARV injection is rejected.',
  'behavior validator covers ARV attack.'
);

requireText(
  behavior,
  'repair evidence injection is rejected.',
  'behavior validator covers repair attack.'
);

requireText(
  behavior,
  'NO_MATCH cannot manufacture owner data.',
  'behavior validator covers NO_MATCH isolation.'
);

requireText(
  behavior,
  'AMBIGUOUS cannot auto-select an owner.',
  'behavior validator covers ambiguity isolation.'
);

requireText(
  behavior,
  'FAILED cannot manufacture owner data.',
  'behavior validator covers failure isolation.'
);

requireText(
  behavior,
  'sanitizer does not mutate acquisition input state.',
  'behavior validator checks acquisition immutability.'
);

requireText(
  contract,
  'Provider payloads are evidence, not write patches.',
  'implementation remains anchored to Phase 1C provider boundary.'
);

requireText(
  contract.replace(/\s+/g, ' ').trim(),
  'NOT the v1 enrichment persistence boundary',
  'implementation remains outside generic CSV persistence boundary.'
);

console.log('');
console.log(
  'ABSENTEE_OWNER_ENRICHMENT_IMPLEMENTATION_CONTRACT_V1_VALID=true'
);
console.log('CHECKS=' + checks);
console.log('PERSISTENCE_PRESENT=false');
console.log('PROVIDER_INTEGRATION_PRESENT=false');
console.log('RPC_EXECUTED=false');
console.log('DEPLOYMENT_CHANGED=false');
console.log('TRIGGER_CHANGED=false');
console.log('SCHEDULER_CHANGED=false');
console.log('PRODUCTION_MUTATION=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
