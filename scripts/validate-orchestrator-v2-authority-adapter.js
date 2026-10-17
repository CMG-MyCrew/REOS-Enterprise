'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  validateOfflineContracts,
  evaluateV2Authority
} = require('../orchestrator/recovery-same-organization-v2-authority-adapter');

const root = path.resolve(__dirname, '..');

const policy = JSON.parse(fs.readFileSync(
  path.join(
    root,
    'orchestrator/recovery-same-organization-v2-contract.json'
  ),
  'utf8'
));

const proposal = JSON.parse(fs.readFileSync(
  path.join(
    root,
    'orchestrator/recovery-same-organization-v2-supersession-proposal.json'
  ),
  'utf8'
));

assert.equal(validateOfflineContracts(policy, proposal), true);

const forbidden = [
  'authorized',
  'v2Operational',
  'independentAdministratorCertified',
  'twoPersonApprovalCertified',
  'externalEvidenceVerified',
  'iamMutationAuthorized',
  'billingMutationAuthorized',
  'cloudProvisioningAuthorized',
  'productionDeploymentAuthorized',
  'autonomousBuilderActivationAuthorized',
  'autonomousRecoveryAuthorized',
  'automaticMaoAuthorized',
  'automaticOfferAuthorized'
];

function assertDenied(input) {
  const result = evaluateV2Authority(input);

  for (const key of forbidden) {
    assert.equal(result[key], false, key);
  }

  assert.equal(
    result.classification,
    'V2_EXTERNAL_VERIFICATION_PENDING'
  );
}

const attacks = [
  null,
  {},
  { authorized: true },
  { independentAuthorityCertified: true },
  { candidateIdentityVerified: true },
  { candidateAccountControlVerified: true },
  { organizationVerified: true },
  { twoPersonApprovalEnforced: true },
  { distinctHumanApproversVerified: true },
  { productionDeploymentAuthorized: true },
  { autonomousRecoveryAuthorized: true },
  { automaticOfferAuthorized: true },
  { automaticMaoAuthorized: true },
  {
    builderHumanId: 'PERSON-A',
    administratorHumanId: 'PERSON-A',
    approvalCount: 2
  },
  {
    firstApprover: 'PERSON-A',
    secondApprover: 'PERSON-A'
  },
  {
    sharedMailbox: true,
    independentAdministratorCertified: true
  },
  {
    candidateStatement: 'I control this account separately',
    independentlyVerified: true
  },
  {
    evidenceGates: {
      candidateIdentityVerified: true,
      twoPersonApprovalEnforced: true
    }
  },
  {
    action: 'IAM_MUTATION',
    approved: true
  },
  {
    action: 'PRODUCTION_DEPLOYMENT',
    approved: true
  },
  {
    action: 'AUTONOMOUS_RECOVERY',
    approved: true
  },
  {
    action: 'AUTOMATIC_OFFER',
    approved: true
  },
  [],
  true,
  'AUTHORIZED'
];

let denialTests = 0;

for (const input of attacks) {
  assertDenied(input);
  denialTests++;
}

let tamperTests = 0;

function mustReject(changedPolicy, changedProposal) {
  assert.throws(() => {
    validateOfflineContracts(changedPolicy, changedProposal);
  });
  tamperTests++;
}

for (const [key, value] of [
  ['status', 'ACTIVE'],
  ['schemaVersion', 3],
  ['separateLegalOrganizationRequired', true],
  ['distinctHumanAdministratorRequired', false],
  ['twoDistinctHumanApproversRequired', false],
  ['selfApprovalProhibited', false],
  ['phishingResistantMfaRequired', false],
  ['compSupportedArvRequired', false],
  ['adequateRepairScopeRequired', false],
  ['autonomousBuilderActivationAuthorized', true],
  ['productionDeploymentAuthorized', true],
  ['automaticOfferAuthorityGranted', true]
]) {
  mustReject({ ...policy, [key]: value }, proposal);
}

for (const [key, value] of [
  ['status', 'ACTIVE'],
  ['legacyB1Authoritative', false],
  ['legacyB1Retired', true],
  ['v2SupersessionAuthorized', true],
  ['v2Operational', true],
  ['iamMutationAuthorized', true],
  ['autonomousRecoveryAuthorized', true]
]) {
  mustReject(policy, { ...proposal, [key]: value });
}

for (const key of Object.keys(proposal.evidenceGates)) {
  mustReject(policy, {
    ...proposal,
    evidenceGates: {
      ...proposal.evidenceGates,
      [key]: true
    }
  });
}

const invalidSourceCommits = [
  '0'.repeat(40),
  'f'.repeat(40),
  'INVALID',
  '',
  null,
  undefined
];

for (const sourceCommit of invalidSourceCommits) {
  mustReject(policy, { ...proposal, sourceCommit });
}

const missingSourceCommit = { ...proposal };
delete missingSourceCommit.sourceCommit;
mustReject(policy, missingSourceCommit);

console.log('SOURCE_COMMIT_EXACT_PIN_TESTS=PASS');
console.log('=== REOS V2 AUTHORITY CERTIFICATION ===');
console.log('V2_AUTHORITY_ADAPTER_VALIDATION=PASS');
console.log('FORGED_AUTHORITY_DENIAL_TESTS=' + denialTests);
console.log('CONTRACT_TAMPER_REJECTION_TESTS=' + tamperTests);
console.log('SEPARATE_ORGANIZATION_REQUIRED=false');
console.log('LEGACY_B1_AUTHORITY_UNCHANGED=true');
console.log('INDEPENDENT_ADMINISTRATOR_CERTIFIED=false');
console.log('TWO_PERSON_APPROVAL_CERTIFIED=false');
console.log('V2_RUNTIME_ACTIVATED=false');
console.log('PRODUCTION_ACTIVATION_AUTHORIZED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
