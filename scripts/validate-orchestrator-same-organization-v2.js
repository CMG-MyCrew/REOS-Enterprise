'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const filename = path.join(
  __dirname,
  '../orchestrator/recovery-same-organization-v2-contract.json'
);

const policy = JSON.parse(fs.readFileSync(filename, 'utf8'));

const requiredTrue = [
  'legacyB1AuthorityUnchanged',
  'distinctHumanAdministratorRequired',
  'individuallyAssignedNonSharedIdentityRequired',
  'independentBuilderAndAdministratorAccountsRequired',
  'separatelyControlledRecoveryRequired',
  'phishingResistantMfaRequired',
  'twoDistinctHumanApproversRequired',
  'selfApprovalProhibited',
  'timeBoundPrivilegedAccessRequired',
  'immutableAuditEvidenceRequired',
  'productionHumanReviewRequired',
  'compSupportedArvRequired',
  'adequateRepairScopeRequired'
];

const requiredFalse = [
  'separateLegalOrganizationRequired',
  'sharedMailboxEstablishesIndependentIdentity',
  'candidateIdentityVerified',
  'candidateAccountControlVerified',
  'operationalSeparationCertified',
  'dualApprovalControlsCertified',
  'organizationalRiskAccepted',
  'organizationWideCompromiseRecoveryCertified',
  'iamMutationAuthorized',
  'billingMutationAuthorized',
  'cloudProvisioningAuthorized',
  'productionDeploymentAuthorized',
  'autonomousBuilderActivationAuthorized',
  'autonomousRecoveryAuthorized',
  'automaticOfferAuthorityGranted'
];

function validate(p) {
  assert.equal(p.schemaVersion, 2);
  assert.equal(p.policyId, 'REOS-AUTONOMOUS-BUILDER-TRUST-V2');
  assert.equal(p.status, 'PROPOSED_OFFLINE_ONLY');
  assert.equal(
    p.model,
    'SINGLE_ORGANIZATION_SEGREGATED_ADMINISTRATION'
  );

  for (const key of requiredTrue) {
    assert.equal(p[key], true, key);
  }

  for (const key of requiredFalse) {
    assert.equal(p[key], false, key);
  }
}

validate(policy);

let negativeTests = 0;

for (const key of requiredTrue) {
  const changed = { ...policy, [key]: false };
  assert.throws(() => validate(changed), key);
  negativeTests++;
}

for (const key of requiredFalse) {
  const changed = { ...policy, [key]: true };
  assert.throws(() => validate(changed), key);
  negativeTests++;
}

for (const [key, value] of [
  ['schemaVersion', 3],
  ['policyId', 'UNAUTHORIZED_POLICY'],
  ['status', 'ACTIVE'],
  ['model', 'UNCONTROLLED_SINGLE_ADMIN']
]) {
  const changed = { ...policy, [key]: value };
  assert.throws(() => validate(changed), key);
  negativeTests++;
}

console.log('TRUST_V2_CONTRACT_VALIDATION=PASS');
console.log('TRUST_V2_NEGATIVE_TESTS=' + negativeTests);
console.log('SEPARATE_ORGANIZATION_REQUIRED=false');
console.log('DISTINCT_ADMINISTRATOR_REQUIRED=true');
console.log('TWO_PERSON_APPROVAL_REQUIRED=true');
console.log('LEGACY_B1_AUTHORITY_UNCHANGED=true');
console.log('PRODUCTION_ACTIVATION_AUTHORIZED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
