'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const B1_SOURCE =
  '74222ddd75922b7d1e141766aaa6c6fe2d193de1';

const MODULE_PINS = Object.freeze({
  'scripts/reos-independent-trust-evidence-gate.js':
    '5261dceb0f1759b3e6ea8bff89c91d2bedbce7b8ee31b29cea2fea8511412937',
  'orchestrator/recovery-independent-administrator-evidence-gate.js':
    '9601bde829b5c69c61ecc1618372114efe6b2cc904158a4862a075409bb9e0b4',
  'orchestrator/recovery-same-organization-v2-authority-adapter.js':
    '650bd539995118fda27331acdad5dbe2a02cf4b612bd99ecad5dcd64334783fb'
});

const PRIVATE_DEPENDENCIES = Object.freeze([
  'scripts/reos-independent-trust-evidence-gate.js',
  'orchestrator/recovery-independent-administrator-evidence-gate.js',
  'orchestrator/recovery-independent-admin-onboarding.json',
  'orchestrator/recovery-independent-option-b-architecture.json',
  'orchestrator/recovery-independent-trust-domain-discovery.json'
]);

const DENIED_FIELDS = Object.freeze([
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
]);

function sha256(bytes) {
  return crypto.createHash('sha256')
    .update(bytes)
    .digest('hex');
}

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative));
}

function assertAbsent(relative) {
  const filename = path.join(ROOT, relative);

  try {
    fs.lstatSync(filename);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  assert.fail(
    'PRIVATE_B1_DEPENDENCY_PRESENT_IN_PUBLIC_CI: ' + relative
  );
}

for (const relative of PRIVATE_DEPENDENCIES) {
  assertAbsent(relative);
}

console.log('PUBLIC_CI_PRIVATE_B1_DEPENDENCIES_ABSENT=PASS');

const bridgeText = read(
  'orchestrator/recovery-same-organization-v2-b1-bridge.js'
).toString('utf8');

for (const [relative, fingerprint] of Object.entries(MODULE_PINS)) {
  const binding = "'" + relative + "',\n    '" + fingerprint + "'";

  assert.equal(
    bridgeText.split(binding).length - 1,
    1,
    'INVALID_PUBLIC_BRIDGE_INTEGRITY_BINDING: ' + relative
  );
}

assert.match(
  bridgeText,
  /if \(actual !== expected\) \{\s*throw new Error\('AUTHORITY_MODULE_INTEGRITY_FAILURE'\);/
);

console.log('PUBLIC_BRIDGE_INTEGRITY_PINS_VERIFIED=3');

const adapterBytes = read(
  'orchestrator/recovery-same-organization-v2-authority-adapter.js'
);

const expectedAdapter = MODULE_PINS[
  'orchestrator/recovery-same-organization-v2-authority-adapter.js'
];

assert.equal(
  sha256(adapterBytes),
  expectedAdapter,
  'PUBLIC_ADAPTER_SHA256_MISMATCH'
);

assert.notEqual(
  sha256(Buffer.concat([adapterBytes, Buffer.from([0])])),
  expectedAdapter,
  'PUBLIC_ADAPTER_HASH_TAMPER_SENSITIVITY_MISSING'
);

console.log('PUBLIC_ADAPTER_SHA256_VERIFIED=PASS');
console.log('PUBLIC_ADAPTER_HASH_TAMPER_SENSITIVITY=PASS');

const policy = JSON.parse(
  read('orchestrator/recovery-same-organization-v2-contract.json')
);

const proposal = JSON.parse(
  read('orchestrator/recovery-same-organization-v2-supersession-proposal.json')
);

const {
  validateOfflineContracts,
  evaluateV2Authority
} = require(
  '../orchestrator/recovery-same-organization-v2-authority-adapter'
);

assert.equal(proposal.sourceCommit, B1_SOURCE);
assert.equal(validateOfflineContracts(policy, proposal), true);

let negativeSourceTests = 0;

for (const value of [
  '0'.repeat(40),
  'f'.repeat(40),
  'INVALID',
  '',
  null,
  undefined
]) {
  assert.throws(() => {
    validateOfflineContracts(policy, {
      ...proposal,
      sourceCommit: value
    });
  });
  negativeSourceTests++;
}

const missingSource = { ...proposal };
delete missingSource.sourceCommit;

assert.throws(() => {
  validateOfflineContracts(policy, missingSource);
});
negativeSourceTests++;

console.log('PUBLIC_SOURCE_COMMIT_EXACT_PIN=PASS');
console.log('PUBLIC_SOURCE_COMMIT_NEGATIVE_TESTS=' + negativeSourceTests);

assert.equal(policy.compSupportedArvRequired, true);
assert.equal(policy.adequateRepairScopeRequired, true);
assert.equal(proposal.compSupportedArvRequired, true);
assert.equal(proposal.adequateRepairScopeRequired, true);
assert.equal(policy.automaticOfferAuthorityGranted, false);
assert.equal(proposal.automaticOfferAuthorityGranted, false);
assert.equal(proposal.v2SupersessionAuthorized, false);
assert.equal(proposal.v2Operational, false);
assert.equal(proposal.legacyB1Authoritative, true);

const { evaluateBridge } = require(
  '../orchestrator/recovery-same-organization-v2-b1-bridge'
);

const forgedInputs = [
  null,
  {},
  true,
  'AUTHORIZED',
  { authorized: true },
  { automaticMaoAuthorized: true },
  { automaticOfferAuthorized: true },
  { iamMutationAuthorized: true },
  { twoPersonApprovalCertified: true },
  {
    firstApprover: 'SAME_PERSON',
    secondApprover: 'SAME_PERSON',
    approved: true
  }
];

for (const input of forgedInputs) {
  const bridge = evaluateBridge(input);

  assert.equal(bridge.classification, 'V2_B1_PREFLIGHT_FAILED');
  assert.equal(bridge.legacyB1Authoritative, true);
  assert.equal(bridge.legacyGateDenialsVerified, false);
  assert.equal(bridge.v2GateDenialsVerified, false);

  for (const field of DENIED_FIELDS) {
    assert.equal(bridge[field], false, 'BRIDGE_' + field);
  }

  const adapter = evaluateV2Authority(input);

  assert.equal(
    adapter.classification,
    'V2_EXTERNAL_VERIFICATION_PENDING'
  );

  for (const field of DENIED_FIELDS) {
    if (field === 'legacyB1Superseded') {
      continue;
    }
    assert.equal(adapter[field], false, 'ADAPTER_' + field);
  }
}

console.log('PUBLIC_MISSING_B1_DENIAL=PASS');
console.log('PUBLIC_FORGED_APPROVAL_TESTS=' + forgedInputs.length);
console.log('PUBLIC_ACQUISITION_SAFETY=PASS');

console.log('PUBLIC_CI_R2_BOUNDARY=PASS');
console.log('PRIVATE_B1_TAMPER_MATRIX_CERTIFIED=false');
console.log('PRIVATE_B1_RUNTIME_CERTIFIED=false');
console.log('PRODUCTION_ACTIVATION_AUTHORIZED=false');
console.log('AUTOMATIC_MAO_OR_OFFER_AUTHORIZED=false');
