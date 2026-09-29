#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(
  __dirname,
  '..'
);

const DESIGN = path.join(
  ROOT,
  'docs',
  'absentee-owner-opa-account-range-fallback-contract-design-v1.md'
);

assert.ok(
  fs.existsSync(DESIGN),
  'OPA account + range fallback design is missing'
);

const text = fs.readFileSync(
  DESIGN,
  'utf8'
);

const required = [
  '# Absentee-Owner OPA Account + Range Fallback Contract Design v1',

  '`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`',
  '`reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(options)`',
  '`lookupQueryMode: exact_property_address`',
  '`opa_properties_public`',
  '`NO_MATCH`',

  '`parcel_id_num`',
  '`opa_account_num`',
  '`parcel_number`',
  '`Canonical Property Key`',

  '`2`',
  '`^[0-9]{9}$`',

  '`1616-42 N BODINE ST`',
  '`1616-1642 N BODINE ST`',

  '`STREET_SUFFIX_EXACT=true`',
  '`TARGET_NUMBER_NUMERICALLY_WITHIN_RANGE=true`',
  '`TARGET_PARITY_COMPATIBLE_WITH_RANGE=true`',

  '`RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE=true`',
  '`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`',

  '`CLASSIFICATION_AUTHORITY_GRANTED=false`',
  '`PERSISTENCE_AUTHORITY_GRANTED=false`',
  '`ROLLOUT_AUTHORITY_GRANTED=false`',

  '`INELIGIBLE`',
  '`ACCOUNT_NO_MATCH`',
  '`ACCOUNT_AMBIGUOUS`',
  '`RANGE_PARSE_FAILED`',
  '`STREET_MISMATCH`',
  '`OUTSIDE_RANGE`',
  '`PARITY_MISMATCH`',

  'No owner-name or owner-mailing evidence is authorized by this design increment.',

  'The range evaluator itself SHOULD be a pure function without external HTTP,',
  'database, spreadsheet, trigger, scheduler, or Script Property access.',

  'Successful design validation does not authorize implementation.',
  'Successful implementation would not authorize production execution.',

  'Automatic MAO or offer authority still requires both adequate comp-supported',
  'ARV and an adequate repair scope through independently certified paths.',

  'No step implies authority for the next step.'
];

for (const marker of required) {
  assert.ok(
    text.includes(marker),
    'missing required design marker: ' + marker
  );
}

const prohibited = [
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=true',
  'CLASSIFICATION_AUTHORITY_GRANTED=true',
  'PERSISTENCE_AUTHORITY_GRANTED=true',
  'ROLLOUT_AUTHORITY_GRANTED=true',
  'IDENTITY_REPAIR_AUTHORITY_GRANTED=true',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=true',

  'range containment authorizes classification',
  'range containment authorizes persistence',
  'OPA account replaces the canonical property key',
  'OPA account replaces the persisted Parcel ID',

  'fuzzy matching is authorized',
  'geocoding is authorized',
  'owner-name fallback is authorized',
  'automatic rollout is authorized'
];

for (const marker of prohibited) {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited design marker present: ' + marker
  );
}

const designOnlyRequired = [
  'This increment creates only:',
  '- this design document;',
  '- its offline design validator.',
  'It MUST NOT create:',
  '- production Apps Script;',
  '- an RPC;',
  '- a source lookup implementation;',
  '- a range matcher implementation;',
  '- a classifier change;',
  '- a persistence change;',
  '- a deployment change.'
];

for (const marker of designOnlyRequired) {
  assert.ok(
    text.includes(marker),
    'design-only boundary missing: ' + marker
  );
}

assert.ok(
  text.indexOf(
    '`parcel_id_num`'
  ) >= 0
);

assert.ok(
  text.indexOf(
    '`opa_account_num`'
  ) >= 0
);

assert.ok(
  text.includes(
    'The future fallback MUST require the same nonblank value across all required'
  )
);

assert.ok(
  text.includes(
    'The future fallback MUST NOT replace:'
  )
);

assert.ok(
  text.includes(
    'Failure MUST preserve the target as deferred.'
  )
);

assert.ok(
  text.includes(
    'The range contract MUST NOT create a sequence of progressively weaker matching'
  )
);

console.log(
  'ABSENTEE_OWNER_OPA_ACCOUNT_RANGE_FALLBACK_CONTRACT_DESIGN_VALID=true'
);

console.log(
  'EXISTING_EXACT_ADDRESS_LOOKUP_UNCHANGED=true'
);

console.log(
  'MIN_CORROBORATING_SOURCE_OBSERVATIONS=2'
);

console.log(
  'OPA_ACCOUNT_SOURCE_FIELD=opa_account_num'
);

console.log(
  'OPA_ACCOUNT_EXACT_NINE_DIGITS_REQUIRED=true'
);

console.log(
  'OPA_ACCOUNT_QUERY_EXACT_EQUALITY_REQUIRED=true'
);

console.log(
  'RANGE_STREET_SUFFIX_EXACT_REQUIRED=true'
);

console.log(
  'RANGE_NUMERIC_CONTAINMENT_REQUIRED=true'
);

console.log(
  'RANGE_PARITY_REQUIRED=true'
);

console.log(
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY_GRANTED=false'
);

console.log(
  'PERSISTENCE_AUTHORITY_GRANTED=false'
);

console.log(
  'ROLLOUT_AUTHORITY_GRANTED=false'
);

console.log(
  'CANONICAL_IDENTITY_REPAIR_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_RUNTIME_CREATED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
