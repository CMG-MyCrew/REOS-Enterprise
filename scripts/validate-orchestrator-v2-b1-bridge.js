'use strict';

const assert = require('node:assert/strict');

const {
  evaluateBridge
} = require('../orchestrator/recovery-same-organization-v2-b1-bridge');

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
    'V2_B1_OFFLINE_DENIED'
  );

  assert.equal(result.legacyB1Authoritative, true);
  assert.equal(result.legacyGateDenialsVerified, true);
  assert.equal(result.v2GateDenialsVerified, true);
  assert.equal(
    result.separateLegalOrganizationRequired,
    false
  );

  for (const key of forbidden) {
    assert.equal(result[key], false, key);
  }

  tests++;
}

console.log('=== REOS V2/B1 BRIDGE CERTIFICATION ===');
console.log('V2_B1_BRIDGE_VALIDATION=PASS');
console.log('FORGED_APPROVAL_DENIAL_TESTS=' + tests);
console.log('LEGACY_B1_DENIALS_VERIFIED=true');
console.log('V2_DENIALS_VERIFIED=true');
console.log('SEPARATE_ORGANIZATION_REQUIRED_V2=false');
console.log('B1_AUTHORITY_SUPERSEDED=false');
console.log('V2_RUNTIME_INTEGRATED=false');
console.log('PRODUCTION_ACTIVATION_AUTHORIZED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
