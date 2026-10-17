'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { signingPayload, evaluateTwoHumanOffline } = require('../orchestrator/recovery-same-organization-v2-two-human-offline-evaluator');

const BASE_TIME = 1760000000000;
const keys = Array.from({length: 4}, () => crypto.generateKeyPairSync('ed25519'));
const humanIds = ['HUMAN_BUILDER_A', 'HUMAN_SECURITY_B', 'HUMAN_SECURITY_C'];
const keyIds = ['KEY_BUILDER_A', 'KEY_SECURITY_B', 'KEY_SECURITY_C', 'KEY_SECURITY_B_ALT'];
const identities = humanIds.map((humanId, i) => ({
  humanId, role: i === 0 ? 'BUILDER' : 'APPROVER',
  syntheticIdentityAssured: true, syntheticAccountControlAssured: true
}));
const keyBindings = keys.map((pair, i) => ({
  keyId: keyIds[i], humanId: humanIds[i === 3 ? 1 : i],
  publicKeyPem: pair.publicKey.export({ format: 'pem', type: 'spki' }).toString()
}));
const request = Object.freeze({
  requestId: 'REQ-R3-00000001', action: 'IAM_MUTATION',
  resource: 'projects/reos/test-only', builderHumanId: humanIds[0],
  issuedAt: BASE_TIME, expiresAt: BASE_TIME + 120000
});
function unsigned(index, change = {}) {
  return {
    approvalId: 'APPROVAL_R3_000' + index,
    humanId: humanIds[index],
    keyId: keyIds[index],
    nonce: 'NONCE_R3_00000' + index,
    decision: 'APPROVE',
    signedAt: BASE_TIME + 1000 + index,
    ...change
  };
}
function signed(index, change = {}, signerIndex = index, signedRequest = request) {
  const record = unsigned(index, change);
  return {
    ...record,
    signatureBase64: crypto.sign(null, signingPayload(signedRequest, record), keys[signerIndex].privateKey).toString('base64')
  };
}
const approvals = [signed(1), signed(2)];
const context = {
  testOnly: true, nowMs: BASE_TIME + 3000,
  identities, keys: keyBindings,
  usedApprovalIds: [], usedNonces: []
};
const OPERATIONAL_DENIALS = [
  'authorized', 'legacyB1Superseded', 'v2Operational',
  'independentAdministratorCertified', 'externalEvidenceVerified',
  'twoPersonApprovalCertified', 'iamMutationAuthorized',
  'billingMutationAuthorized', 'cloudProvisioningAuthorized',
  'productionDeploymentAuthorized', 'autonomousBuilderActivationAuthorized',
  'autonomousRecoveryAuthorized', 'automaticMaoAuthorized', 'automaticOfferAuthorized'
];
function checkDenials(result) {
  for (const field of OPERATIONAL_DENIALS) assert.equal(result[field], false, field);
  assert.equal(result.legacyB1Authoritative, true);
  assert.equal(result.realWorldIdentityVerified, false);
  assert.equal(result.persistentReplayPreventionCertified, false);
  assert.equal(result.syntheticTestOnly, true);
  assert.equal(result.syntheticIdentityAssuranceOnly, true);
  assert(Object.isFrozen(result));
}
const passed = evaluateTwoHumanOffline(request, approvals, context);
checkDenials(passed);
assert.equal(passed.classification, 'R3_CRYPTOGRAPHIC_TEST_PASSED');
assert.equal(passed.testPassed, true);
assert(passed.testReceipt && Object.isFrozen(passed.testReceipt));
assert.equal(passed.testReceipt.replayLedgerUpdated, false);
assert.equal(passed.testReceipt.productionAuthorityGranted, false);
assert.deepEqual(passed.testReceipt.approvalIds, approvals.map(x => x.approvalId));
assert.deepEqual(passed.testReceipt.nonces, approvals.map(x => x.nonce));
console.log('PASS=synthetic_two_distinct_signatures');

let rejected = 0;
function reject(label, requestArg = request, approvalArg = approvals, contextArg = context) {
  const result = evaluateTwoHumanOffline(requestArg, approvalArg, contextArg);
  checkDenials(result);
  assert.equal(result.classification, 'R3_OFFLINE_DENIED', label);
  assert.equal(result.testPassed, false, label);
  assert.equal(result.testReceipt, null, label);
  rejected++;
  console.log('REJECTED=' + label);
}
function withApprovals(a, b = approvals[1]) { return [a, b]; }
reject('missing_approvals', request, []);
reject('one_approval', request, [approvals[0]]);
reject('three_approvals', request, [approvals[0], approvals[1], approvals[0]]);
reject('same_approver_same_key', request, [approvals[0], approvals[0]]);
reject('same_human_different_keys', request, [approvals[0], signed(1, {approvalId:'APPROVAL_R3_09999',nonce:'NONCE_R3_099999',keyId:keyIds[3]}, 3)]);
reject('builder_self_approval', request, [signed(0), approvals[1]]);
reject('invalid_signature', request, withApprovals({...approvals[0],signatureBase64:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='}));
reject('approval_signed_by_wrong_key', request, withApprovals(signed(1, {}, 2)));
reject('resource_changed', {...request,resource:'projects/reos/other'}, approvals);
reject('action_changed', {...request,action:'PRODUCTION_DEPLOYMENT'}, approvals);
reject('request_id_changed', {...request,requestId:'REQ-R3-00000002'}, approvals);
reject('expiration_changed', {...request,expiresAt:BASE_TIME+60000}, approvals);
reject('expired_request', request, approvals, {...context,nowMs:BASE_TIME+120000});
reject('not_yet_valid_request', request, approvals, {...context,nowMs:BASE_TIME-1});
reject('approval_not_yet_valid', request, withApprovals(signed(1,{signedAt:BASE_TIME-1})));
reject('future_approval', request, withApprovals(signed(1,{signedAt:BASE_TIME+60000})));
reject('duplicate_approval_id', request, withApprovals(approvals[0], signed(2,{approvalId:approvals[0].approvalId})));
reject('duplicate_nonce', request, withApprovals(approvals[0], signed(2,{nonce:approvals[0].nonce})));
reject('replayed_approval_id', request, approvals, {...context,usedApprovalIds:[approvals[0].approvalId]});
reject('replayed_nonce', request, approvals, {...context,usedNonces:[approvals[1].nonce]});
reject('missing_synthetic_identity_assurance', request, approvals, {...context,identities:identities.map(i => i.humanId === humanIds[1] ? {...i, syntheticIdentityAssured:false} : i)});
reject('missing_synthetic_account_control', request, approvals, {...context,identities:identities.map(i => i.humanId === humanIds[1] ? {...i, syntheticAccountControlAssured:false} : i)});
reject('missing_approver_identity', request, approvals, {...context,identities:identities.filter(i => i.humanId !== humanIds[2])});
reject('missing_signing_key', request, approvals, {...context,keys:keyBindings.filter(k => k.keyId !== keyIds[2])});
reject('forged_key_binding', request, approvals, {...context,keys:keyBindings.map(k => k.keyId === keyIds[1] ? {...k,humanId:humanIds[2]} : k)});
reject('duplicate_identity_registry', request, approvals, {...context,identities:[...identities,identities[1]]});
reject('reused_public_key', request, approvals, {...context,keys:keyBindings.map(k => k.keyId === keyIds[2] ? {...k,publicKeyPem:keyBindings[1].publicKeyPem} : k)});
reject('malformed_signature_encoding', request, withApprovals({...approvals[0],signatureBase64:'NOT BASE64'}));
reject('caller_not_test_only', request, approvals, {...context,testOnly:false});
reject('excess_window', {...request,expiresAt:BASE_TIME+600001}, approvals);
reject('rejected_decision', request, withApprovals(signed(1,{decision:'REJECT'})));
reject('request_extra_field', {...request,approved:true}, approvals);
reject('approval_extra_field', request, withApprovals({...approvals[0],authorized:true}));
reject('missing_replay_ledger', request, approvals, (()=>{const c={...context};delete c.usedNonces;return c;})());
reject('replayed_after_receipt_consumption', request, approvals, {
  ...context,
  usedApprovalIds:[...passed.testReceipt.approvalIds],
  usedNonces:[...passed.testReceipt.nonces]
});
assert.equal(rejected, 35);
console.log('=== R3 OFFLINE TWO-HUMAN CERTIFICATION ===');
console.log('R3_SYNTHETIC_SIGNATURE_TEST=PASS');
console.log('R3_NEGATIVE_TESTS=' + rejected);
console.log('R3_SYNTHETIC_REPLAY_LEDGER_TEST=PASS');
console.log('R3_OFFLINE_TEST_MATRIX=PASS');
console.log('REAL_WORLD_IDENTITY_CERTIFIED=false');
console.log('PERSISTENT_REPLAY_PREVENTION_CERTIFIED=false');
console.log('TWO_HUMAN_OPERATIONAL_APPROVAL_CERTIFIED=false');
console.log('PRODUCTION_ACTIVATION_AUTHORIZED=false');
console.log('AUTOMATIC_MAO_OR_OFFER_AUTHORIZED=false');
