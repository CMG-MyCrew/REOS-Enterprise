'use strict';

const assert = require('assert');
const sanitizer = require(
  '../build/apps-script-brand/AbsenteeOwnerEnrichmentSanitizer.js'
);

let checks = 0;

function pass(message) {
  checks += 1;
  console.log('PASS: ' + message);
}

function expectThrow(fn, pattern, message) {
  assert.throws(fn, pattern);
  pass(message);
}

function baseIdentity() {
  return {
    'Distress Lead ID': 'DL-ABS-0001',
    'Canonical Property Key': '123 MAIN ST|PHILADELPHIA|PA|19103'
  };
}

function sanitize(outcome, attemptedPatch, identity) {
  return sanitizer.sanitize({
    outcome,
    identity: identity === undefined ? baseIdentity() : identity,
    attemptedPatch
  });
}

assert.deepStrictEqual(
  Array.from(sanitizer.OUTCOMES),
  ['MATCHED', 'NO_MATCH', 'AMBIGUOUS', 'FAILED']
);
pass('terminal outcome set is exact.');

assert.deepStrictEqual(
  Array.from(sanitizer.OWNED_FIELDS),
  ['Owner Name', 'Owner Mailing Address']
);
pass('owned field set is exact.');

const matched = sanitize('MATCHED', {
  'Owner Name': '  Jane Owner  ',
  'Owner Mailing Address': '  50 Market St  '
});

assert.deepStrictEqual(matched.patch, {
  'Owner Name': 'Jane Owner',
  'Owner Mailing Address': '50 Market St'
});
pass('MATCHED creates only normalized owner enrichment patch.');

assert.strictEqual(matched.persistenceAuthorized, false);
pass('MATCHED does not authorize persistence.');

assert.strictEqual(matched.dealCreationAuthorized, false);
pass('MATCHED does not authorize deal creation.');

assert.strictEqual(matched.automaticOfferAuthorityGranted, false);
pass('MATCHED does not grant automatic offer authority.');

assert.deepStrictEqual(
  sanitize('NO_MATCH', {}).patch,
  {}
);
pass('NO_MATCH produces no owner write patch.');

assert.deepStrictEqual(
  sanitize('AMBIGUOUS', {}).patch,
  {}
);
pass('AMBIGUOUS produces no owner write patch.');

assert.deepStrictEqual(
  sanitize('FAILED', {}).patch,
  {}
);
pass('FAILED produces no owner write patch.');

expectThrow(
  () => sanitize('UNKNOWN', {}),
  /OUTCOME_NOT_ALLOWED/,
  'unknown outcome fails closed.'
);

expectThrow(
  () => sanitize('MATCHED', {}, {
    'Canonical Property Key': 'PK-1'
  }),
  /IDENTITY_FIELD_REQUIRED:Distress Lead ID/,
  'missing Distress Lead ID fails closed.'
);

expectThrow(
  () => sanitize('MATCHED', {}, {
    'Distress Lead ID': 'DL-1'
  }),
  /IDENTITY_FIELD_REQUIRED:Canonical Property Key/,
  'missing Canonical Property Key fails closed.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Distress Lead ID': 'ATTACK'
  }),
  /WRITE_KEY_NOT_ALLOWED:Distress Lead ID/,
  'Distress Lead ID injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Canonical Property Key': 'ATTACK'
  }),
  /WRITE_KEY_NOT_ALLOWED:Canonical Property Key/,
  'canonical property identity injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Lead Source': 'ATTACK'
  }),
  /WRITE_KEY_NOT_ALLOWED:Lead Source/,
  'source injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Status': 'CLOSED'
  }),
  /WRITE_KEY_NOT_ALLOWED:Status/,
  'lifecycle/status injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Imported Deal ID': 'DEAL-ATTACK'
  }),
  /WRITE_KEY_NOT_ALLOWED:Imported Deal ID/,
  'deal injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'ARV': 999999
  }),
  /WRITE_KEY_NOT_ALLOWED:ARV/,
  'ARV injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Estimated Repairs': 0
  }),
  /WRITE_KEY_NOT_ALLOWED:Estimated Repairs/,
  'repair evidence injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Suggested Offer': 999999
  }),
  /WRITE_KEY_NOT_ALLOWED:Suggested Offer/,
  'Suggested Offer injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'MAO': 999999
  }),
  /WRITE_KEY_NOT_ALLOWED:MAO/,
  'MAO injection is rejected.'
);

expectThrow(
  () => sanitize('MATCHED', {
    automaticOfferAuthorityGranted: true
  }),
  /WRITE_KEY_NOT_ALLOWED:automaticOfferAuthorityGranted/,
  'automatic offer authority injection is rejected.'
);

expectThrow(
  () => sanitize('NO_MATCH', {
    'Owner Name': 'Manufactured Owner'
  }),
  /NON_MATCHED_OUTCOME_CANNOT_WRITE_OWNER_FIELDS/,
  'NO_MATCH cannot manufacture owner data.'
);

expectThrow(
  () => sanitize('AMBIGUOUS', {
    'Owner Name': 'Auto Selected Owner'
  }),
  /NON_MATCHED_OUTCOME_CANNOT_WRITE_OWNER_FIELDS/,
  'AMBIGUOUS cannot auto-select an owner.'
);

expectThrow(
  () => sanitize('FAILED', {
    'Owner Mailing Address': 'Manufactured Address'
  }),
  /NON_MATCHED_OUTCOME_CANNOT_WRITE_OWNER_FIELDS/,
  'FAILED cannot manufacture owner data.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Owner Name': { malicious: true }
  }),
  /OWNER_VALUE_INVALID_TYPE/,
  'malformed owner name fails closed.'
);

expectThrow(
  () => sanitize('MATCHED', {
    'Owner Mailing Address': ['malicious']
  }),
  /OWNER_VALUE_INVALID_TYPE/,
  'malformed mailing address fails closed.'
);

const acquisition = {
  'Distress Lead ID': 'DL-ORIGINAL',
  'Canonical Property Key': 'PK-ORIGINAL',
  'Address': '123 Main St',
  'Lead Source': 'County',
  'Status': 'Research',
  'Imported Deal ID': '',
  'Estimated Value': '',
  'Estimated Repairs': '',
  'Suggested Offer': '',
  'ARV': '',
  'MAO': '',
  automaticOfferAuthorityGranted: false
};

const acquisitionBefore = JSON.stringify(acquisition);

sanitizer.sanitize({
  outcome: 'MATCHED',
  identity: {
    'Distress Lead ID': acquisition['Distress Lead ID'],
    'Canonical Property Key': acquisition['Canonical Property Key']
  },
  attemptedPatch: {
    'Owner Name': 'Jane Owner',
    'Owner Mailing Address': '50 Market St'
  }
});

assert.strictEqual(JSON.stringify(acquisition), acquisitionBefore);
pass('sanitizer does not mutate acquisition input state.');

const attempted = {
  'Owner Name': '  Jane Owner  '
};

const attemptedBefore = JSON.stringify(attempted);

sanitize('MATCHED', attempted);

assert.strictEqual(JSON.stringify(attempted), attemptedBefore);
pass('sanitizer does not mutate attempted patch.');

const result = sanitize('MATCHED', {
  'Owner Name': 'Jane Owner'
});

result.patch['Owner Name'] = 'Changed Outside';

const result2 = sanitize('MATCHED', {
  'Owner Name': 'Jane Owner'
});

assert.strictEqual(result2.patch['Owner Name'], 'Jane Owner');
pass('returned patch does not retain mutable cross-call state.');

console.log('');
console.log('ABSENTEE_OWNER_ENRICHMENT_V1_BEHAVIOR_VALID=true');
console.log('CHECKS=' + checks);
console.log('PERSISTENCE_PRESENT=false');
console.log('PROVIDER_CALL_EXECUTED=false');
console.log('RPC_EXECUTED=false');
console.log('DEPLOYMENT_CHANGED=false');
console.log('TRIGGER_CHANGED=false');
console.log('SCHEDULER_CHANGED=false');
console.log('PRODUCTION_MUTATION=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
