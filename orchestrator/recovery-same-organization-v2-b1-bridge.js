'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');

const MODULES = Object.freeze({
  trust: [
    'scripts/reos-independent-trust-evidence-gate.js',
    '5261dceb0f1759b3e6ea8bff89c91d2bedbce7b8ee31b29cea2fea8511412937'
  ],
  admin: [
    'orchestrator/recovery-independent-administrator-evidence-gate.js',
    '9601bde829b5c69c61ecc1618372114efe6b2cc904158a4862a075409bb9e0b4'
  ],
  v2: [
    'orchestrator/recovery-same-organization-v2-authority-adapter.js',
    'd907d1a255369981ee29aec2b0b64a6a3f7f1903b6ca394c4ad773b52345e879'
  ]
});

const DENIED = Object.freeze({
  authorized: false,
  legacyB1Superseded: false,
  v2Operational: false,
  independentAdministratorCertified: false,
  externalEvidenceVerified: false,
  twoPersonApprovalCertified: false,
  iamMutationAuthorized: false,
  billingMutationAuthorized: false,
  cloudProvisioningAuthorized: false,
  productionDeploymentAuthorized: false,
  autonomousBuilderActivationAuthorized: false,
  autonomousRecoveryAuthorized: false,
  automaticMaoAuthorized: false,
  automaticOfferAuthorized: false
});

function trustedModule(record) {
  const [relative, expected] = record;
  const filename = path.join(ROOT, relative);

  const actual = crypto.createHash('sha256')
    .update(fs.readFileSync(filename))
    .digest('hex');

  if (actual !== expected) {
    throw new Error('AUTHORITY_MODULE_INTEGRITY_FAILURE');
  }

  return require(filename);
}

function requireFalse(value, name) {
  if (value !== false) {
    throw new Error('AUTHORITY_DENIAL_MISSING_' + name);
  }
}

function evaluateBridge(untrustedInput = null) {
  // Caller evidence is never promoted into authority.
  void untrustedInput;

  let classification = 'V2_B1_PREFLIGHT_FAILED';
  let legacyGateDenialsVerified = false;
  let v2GateDenialsVerified = false;

  try {
    const trust = trustedModule(MODULES.trust);
    const admin = trustedModule(MODULES.admin);
    const v2 = trustedModule(MODULES.v2);

    const policy = JSON.parse(fs.readFileSync(
      path.join(
        ROOT,
        'orchestrator/recovery-same-organization-v2-contract.json'
      ),
      'utf8'
    ));

    const proposal = JSON.parse(fs.readFileSync(
      path.join(
        ROOT,
        'orchestrator/recovery-same-organization-v2-supersession-proposal.json'
      ),
      'utf8'
    ));

    v2.validateOfflineContracts(policy, proposal);

    // Evaluate actual legacy exports, never mock approval.
    const b1Trust = trust.evaluateCurrentReadiness();
    const b1Admin = admin.evaluateAdministratorAuthority({});

    requireFalse(
      b1Trust.independentAuthorityCertified,
      'B1_TRUST'
    );
    requireFalse(
      b1Trust.autonomousRecoveryAuthorized,
      'B1_RECOVERY'
    );
    requireFalse(
      b1Admin.authorized,
      'B1_ADMIN'
    );
    requireFalse(
      b1Admin.implementationAuthorized,
      'B1_IMPLEMENTATION'
    );
    requireFalse(
      b1Admin.autonomousRecoveryAuthorized,
      'B1_ADMIN_RECOVERY'
    );

    legacyGateDenialsVerified = true;

    const v2Decision = v2.evaluateV2Authority();

    const v2Denials = [
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

    for (const key of v2Denials) {
      requireFalse(v2Decision[key], 'V2_' + key);
    }

    v2GateDenialsVerified = true;
    classification = 'V2_B1_OFFLINE_DENIED';

  } catch (_) {
    // Missing evidence, invalid contracts, runtime errors
    // or unexpected approvals always remain denied.
    classification = 'V2_B1_PREFLIGHT_FAILED';
  }

  return Object.freeze({
    classification,
    architecture:
      'SINGLE_ORGANIZATION_SEGREGATED_ADMINISTRATION',
    separateLegalOrganizationRequired: false,
    legacyB1Authoritative: true,
    legacyGateDenialsVerified,
    v2GateDenialsVerified,
    ...DENIED
  });
}

module.exports = Object.freeze({ evaluateBridge });

if (require.main === module) {
  const result = evaluateBridge();
  for (const [key, value] of Object.entries(result)) {
    console.log(key + '=' + value);
  }
}
