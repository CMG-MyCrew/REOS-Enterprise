'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const POLICY_PATH = path.join(
  ROOT,
  'orchestrator/recovery-same-organization-v2-contract.json'
);

const PROPOSAL_PATH = path.join(
  ROOT,
  'orchestrator/recovery-same-organization-v2-supersession-proposal.json'
);

const POLICY_TRUE = Object.freeze([
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
]);

const POLICY_FALSE = Object.freeze([
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
]);

const PROPOSAL_TRUE = Object.freeze([
  'sameOrganizationPermitted',
  'distinctAdministratorIdentityRequired',
  'twoDistinctHumanApproversRequired',
  'selfApprovalProhibited',
  'compSupportedArvRequired',
  'adequateRepairScopeRequired',
  'legacyB1Authoritative'
]);

const PROPOSAL_FALSE = Object.freeze([
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
]);

const EVIDENCE_GATES = Object.freeze([
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
]);

function requireObject(value, name) {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new Error('INVALID_' + name);
  }
}

function requireExact(value, expected, name) {
  if (value !== expected) {
    throw new Error('INVALID_' + name);
  }
}

function validateOfflineContracts(policy, proposal) {
  requireObject(policy, 'POLICY');
  requireObject(proposal, 'PROPOSAL');

  requireExact(policy.schemaVersion, 2, 'POLICY_VERSION');
  requireExact(
    policy.policyId,
    'REOS-AUTONOMOUS-BUILDER-TRUST-V2',
    'POLICY_ID'
  );
  requireExact(
    policy.status,
    'PROPOSED_OFFLINE_ONLY',
    'POLICY_STATUS'
  );
  requireExact(
    policy.model,
    'SINGLE_ORGANIZATION_SEGREGATED_ADMINISTRATION',
    'POLICY_MODEL'
  );

  for (const key of POLICY_TRUE) {
    requireExact(policy[key], true, 'POLICY_' + key);
  }

  for (const key of POLICY_FALSE) {
    requireExact(policy[key], false, 'POLICY_' + key);
  }

  requireExact(proposal.schemaVersion, 1, 'PROPOSAL_VERSION');
  requireExact(
    proposal.status,
    'OFFLINE_PROPOSAL_ONLY',
    'PROPOSAL_STATUS'
  );
  requireExact(proposal.legacyArchitecture, 'B1', 'LEGACY');
  requireExact(
    proposal.proposedArchitecture,
    'SINGLE_ORGANIZATION_SEGREGATED_ADMINISTRATION',
    'PROPOSED_MODEL'
  );

  if (
    typeof proposal.sourceCommit !== 'string' ||
    !/^[a-f0-9]{40}$/.test(proposal.sourceCommit)
  ) {
    throw new Error('INVALID_SOURCE_COMMIT');
  }

  for (const key of PROPOSAL_TRUE) {
    requireExact(proposal[key], true, 'PROPOSAL_' + key);
  }

  for (const key of PROPOSAL_FALSE) {
    requireExact(proposal[key], false, 'PROPOSAL_' + key);
  }

  requireObject(proposal.evidenceGates, 'EVIDENCE_GATES');

  const actualKeys = Object.keys(proposal.evidenceGates).sort();
  const requiredKeys = [...EVIDENCE_GATES].sort();

  if (JSON.stringify(actualKeys) !== JSON.stringify(requiredKeys)) {
    throw new Error('EVIDENCE_GATE_SCHEMA_MISMATCH');
  }

  for (const key of EVIDENCE_GATES) {
    requireExact(
      proposal.evidenceGates[key],
      false,
      'EVIDENCE_' + key
    );
  }

  return true;
}

function deny(classification) {
  return Object.freeze({
    classification,
    authorized: false,
    architecture:
      'SINGLE_ORGANIZATION_SEGREGATED_ADMINISTRATION',
    v2Operational: false,
    legacyB1AuthorityUnchanged: true,
    independentAdministratorCertified: false,
    twoPersonApprovalCertified: false,
    externalEvidenceVerified: false,
    iamMutationAuthorized: false,
    billingMutationAuthorized: false,
    cloudProvisioningAuthorized: false,
    productionDeploymentAuthorized: false,
    autonomousBuilderActivationAuthorized: false,
    autonomousRecoveryAuthorized: false,
    automaticMaoAuthorized: false,
    automaticOfferAuthorized: false
  });
}

/*
 * Untrusted candidate statements, self-attestations, emails,
 * local JSON records, and caller-supplied approval claims
 * are never elevated to independent verification.
 *
 * This adapter is offline-only. It does not replace B1,
 * create IAM permissions, or authorize production actions.
 */
function evaluateV2Authority(untrustedInput = null) {
  void untrustedInput;

  try {
    const policy = JSON.parse(
      fs.readFileSync(POLICY_PATH, 'utf8')
    );

    const proposal = JSON.parse(
      fs.readFileSync(PROPOSAL_PATH, 'utf8')
    );

    validateOfflineContracts(policy, proposal);

    return deny('V2_EXTERNAL_VERIFICATION_PENDING');
  } catch (_) {
    return deny('V2_CONTRACT_PREFLIGHT_FAILED');
  }
}

module.exports = Object.freeze({
  validateOfflineContracts,
  evaluateV2Authority
});

if (require.main === module) {
  const result = evaluateV2Authority();

  console.log('=== REOS V2 AUTHORITY ADAPTER ===');

  for (const [key, value] of Object.entries(result)) {
    console.log(key + '=' + value);
  }
}
