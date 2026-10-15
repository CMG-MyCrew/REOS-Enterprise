'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  evaluateBridge
} = require('../orchestrator/recovery-same-organization-v2-b1-bridge');

const ROOT = path.resolve(__dirname, '..');

const privateDependencies = [
  'scripts/reos-independent-trust-evidence-gate.js',
  'orchestrator/recovery-independent-administrator-evidence-gate.js',
  'orchestrator/recovery-independent-admin-onboarding.json',
  'orchestrator/recovery-independent-option-b-architecture.json',
  'orchestrator/recovery-independent-trust-domain-discovery.json'
];

// This test is intentionally restricted to a clean checkout
// where the five private B1 files have not been published.
for (const filename of privateDependencies) {
  assert.equal(
    fs.existsSync(path.join(ROOT, filename)),
    false,
    'Private dependency unexpectedly available: ' + filename
  );
}

const attacks = [
  null,
  {},
  true,
  'AUTHORIZED',
  [],
  { authorized: true },
  { v2Operational: true },
  { independentAuthorityCertified: true },
  { independentAdministratorCertified: true },
  { candidateIdentityVerified: true },
  { externalEvidenceVerified: true },
  { twoPersonApprovalCertified: true },
  { iamMutationAuthorized: true },
  { billingMutationAuthorized: true },
  { cloudProvisioningAuthorized: true },
  { productionDeploymentAuthorized: true },
  { autonomousRecoveryAuthorized: true },
  { automaticMaoAuthorized: true },
  { automaticOfferAuthorized: true },
  { legacyB1Superseded: true },
  {
    firstApprover: 'PERSON_A',
    secondApprover: 'PERSON_A',
    approved: true
  },
  {
    sharedMailbox: true,
    independentControl: true
  },
  {
    verified: true,
    evidenceGates: {
      twoPersonApprovalEnforced: true
    }
  }
];

const forbidden = [
  'authorized',
  'legacyB1Superseded',
  'v2Operational',
  'independentAdministratorCertified',
  'externalEvidenceVerified',
  'twoPersonApprovalCertified',
  'iamMutationAuthorized',
  'billingMutationAuthorized',
  'cloudProvisioningAuthorized',
  'productionDeploymentAuthorized',
  'autonomousBuilderActivationAuthorized',
  'autonomousRecoveryAuthorized',
  'automaticMaoAuthorized',
  'automaticOfferAuthorized'
];

let tests = 0;

for (const input of attacks) {
  const result = evaluateBridge(input);

  assert.equal(
    result.classification,
    'V2_B1_PREFLIGHT_FAILED'
  );

  assert.equal(result.legacyB1Authoritative, true);
  assert.equal(result.legacyGateDenialsVerified, false);
  assert.equal(result.v2GateDenialsVerified, false);
  assert.equal(
    result.separateLegalOrganizationRequired,
    false
  );

  for (const key of forbidden) {
    assert.equal(result[key], false, key);
  }

  tests++;
}

console.log('=== V2 PRIVATE DEPENDENCY CI CERTIFICATION ===');
console.log('MISSING_B1_DEPENDENCIES_FAIL_CLOSED=PASS');
console.log('FORGED_APPROVAL_DENIAL_TESTS=' + tests);
console.log('LEGACY_B1_RUNTIME_CERTIFIED=false');
console.log('V2_RUNTIME_INTEGRATED=false');
console.log('PRODUCTION_ACTIVATION_AUTHORIZED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
