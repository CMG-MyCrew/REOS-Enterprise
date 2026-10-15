'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const filename = path.join(
  __dirname,
  '../orchestrator/recovery-same-organization-v2-supersession-proposal.json'
);

const record = JSON.parse(fs.readFileSync(filename, 'utf8'));

const requiredTrue = [
  'sameOrganizationPermitted',
  'distinctAdministratorIdentityRequired',
  'twoDistinctHumanApproversRequired',
  'selfApprovalProhibited',
  'compSupportedArvRequired',
  'adequateRepairScopeRequired',
  'legacyB1Authoritative'
];

const requiredFalse = [
  'separateLegalOrganizationRequired',
  'legacyB1Retired',
  'v2SupersessionAuthorized',
  'v2Operational',
  'iamMutationAuthorized',
  'cloudProvisioningAuthorized',
  'billingMutationAuthorized',
  'productionDeploymentAuthorized',
  'autonomousRecoveryAuthorized',
  'automaticOfferAuthorityGranted'
];

const evidence = [
  'candidateIdentityVerified',
  'distinctHumanApproversVerified',
  'distinctPrivilegedAccountsVerified',
  'phishingResistantMfaVerified',
  'accountRecoverySeparationVerified',
  'twoPersonApprovalEnforced',
  'auditTrailVerified',
  'privilegeBoundaryTested',
  'humanArchitectureApprovalRecorded',
  'organizationRiskAcceptanceRecorded',
  'legacyValidatorMigrationCertified',
  'preProductionDryRunCertified'
];

function validate(p) {
  assert.equal(p.schemaVersion, 1);
  assert.equal(p.status, 'OFFLINE_PROPOSAL_ONLY');
  assert.equal(p.legacyArchitecture, 'B1');
  assert.equal(
    p.proposedArchitecture,
    'SINGLE_ORGANIZATION_SEGREGATED_ADMINISTRATION'
  );

  assert.match(p.sourceCommit, /^[a-f0-9]{40}$/);

  for (const key of requiredTrue) {
    assert.equal(p[key], true, key);
  }

  for (const key of requiredFalse) {
    assert.equal(p[key], false, key);
  }

  assert.deepEqual(
    Object.keys(p.evidenceGates).sort(),
    [...evidence].sort()
  );

  for (const key of evidence) {
    assert.equal(p.evidenceGates[key], false, key);
  }
}

validate(record);

let negativeTests = 0;

for (const key of requiredTrue) {
  assert.throws(
    () => validate({ ...record, [key]: false })
  );
  negativeTests++;
}

for (const key of requiredFalse) {
  assert.throws(
    () => validate({ ...record, [key]: true })
  );
  negativeTests++;
}

for (const key of evidence) {
  const changed = {
    ...record,
    evidenceGates: { ...record.evidenceGates, [key]: true }
  };
  assert.throws(() => validate(changed));
  negativeTests++;
}

for (const [key, value] of [
  ['schemaVersion', 2],
  ['status', 'ACTIVE'],
  ['legacyArchitecture', 'RETIRED'],
  ['proposedArchitecture', 'UNCONTROLLED_ADMIN'],
  ['sourceCommit', 'INVALID']
]) {
  assert.throws(
    () => validate({ ...record, [key]: value })
  );
  negativeTests++;
}

console.log('V2_SUPERSESSION_PROPOSAL_VALIDATION=PASS');
console.log('NEGATIVE_TESTS_PASSED=' + negativeTests);
console.log('SEPARATE_ORGANIZATION_REQUIRED=false');
console.log('LEGACY_B1_AUTHORITY_UNCHANGED=true');
console.log('V2_SUPERSESSION_AUTHORIZED=false');
console.log('PRODUCTION_DEPLOYMENT_AUTHORIZED=false');
console.log('AUTONOMOUS_RECOVERY_AUTHORIZED=false');
