'use strict';

// R3 synthetic cryptographic test harness. NEVER an authority grant.
const crypto = require('node:crypto');

const DOMAIN = 'REOS-R3-TWO-HUMAN-OFFLINE-V1';
const ACTIONS = new Set([
  'IAM_MUTATION', 'BILLING_MUTATION', 'CLOUD_PROVISIONING',
  'PRODUCTION_DEPLOYMENT', 'AUTONOMOUS_RECOVERY',
  'AUTOMATIC_MAO', 'AUTOMATIC_OFFER'
]);
const REQUEST_FIELDS = ['requestId', 'action', 'resource', 'builderHumanId', 'issuedAt', 'expiresAt'];
const APPROVAL_FIELDS = ['approvalId', 'humanId', 'keyId', 'nonce', 'decision', 'signedAt', 'signatureBase64'];
const IDENTITY_FIELDS = ['humanId', 'role', 'syntheticIdentityAssured', 'syntheticAccountControlAssured'];
const KEY_FIELDS = ['keyId', 'humanId', 'publicKeyPem'];
const CONTEXT_FIELDS = ['testOnly', 'nowMs', 'identities', 'keys', 'usedApprovalIds', 'usedNonces'];
const ID_PATTERN = /^[A-Z][A-Z0-9_-]{7,63}$/;
const RESOURCE_PATTERN = /^[A-Za-z0-9:/._-]{1,256}$/;
const MAX_WINDOW_MS = 10 * 60 * 1000;
const DENIED = Object.freeze({
  authorized: false, legacyB1Superseded: false, v2Operational: false,
  independentAdministratorCertified: false, externalEvidenceVerified: false,
  twoPersonApprovalCertified: false, iamMutationAuthorized: false,
  billingMutationAuthorized: false, cloudProvisioningAuthorized: false,
  productionDeploymentAuthorized: false, autonomousBuilderActivationAuthorized: false,
  autonomousRecoveryAuthorized: false, automaticMaoAuthorized: false,
  automaticOfferAuthorized: false
});

function check(ok, code) {
  if (!ok) throw new Error(code);
}
function exactObject(value, fields, code) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), code);
  check(Object.keys(value).sort().join('|') === [...fields].sort().join('|'), code);
}
function validId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}
function validMs(value) {
  return Number.isSafeInteger(value) && value > 0;
}
function signingPayload(request, unsignedApproval) {
  exactObject(request, REQUEST_FIELDS, 'INVALID_REQUEST_SHAPE');
  const fields = APPROVAL_FIELDS.filter(f => f !== 'signatureBase64');
  exactObject(unsignedApproval, fields, 'INVALID_APPROVAL_SHAPE');
  return Buffer.from(DOMAIN + '\n' + JSON.stringify([
    request.requestId, request.action, request.resource,
    request.builderHumanId, request.issuedAt, request.expiresAt,
    unsignedApproval.approvalId, unsignedApproval.humanId,
    unsignedApproval.keyId, unsignedApproval.nonce,
    unsignedApproval.decision, unsignedApproval.signedAt
  ]), 'utf8');
}
function hash(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}
function result(testPassed, receipt = null) {
  return Object.freeze({
    classification: testPassed ? 'R3_CRYPTOGRAPHIC_TEST_PASSED' : 'R3_OFFLINE_DENIED',
    syntheticTestOnly: true,
    syntheticIdentityAssuranceOnly: true,
    realWorldIdentityVerified: false,
    persistentReplayPreventionCertified: false,
    legacyB1Authoritative: true,
    testPassed,
    testReceipt: receipt,
    ...DENIED
  });
}
function evaluateTwoHumanOffline(request, approvals, context) {
  try {
    exactObject(request, REQUEST_FIELDS, 'INVALID_REQUEST_SHAPE');
    exactObject(context, CONTEXT_FIELDS, 'INVALID_CONTEXT_SHAPE');
    check(context.testOnly === true, 'NOT_TEST_ONLY');
    check(validId(request.requestId) && ACTIONS.has(request.action), 'INVALID_REQUEST');
    check(typeof request.resource === 'string' && RESOURCE_PATTERN.test(request.resource), 'INVALID_RESOURCE');
    check(validId(request.builderHumanId), 'INVALID_BUILDER');
    check(validMs(request.issuedAt) && validMs(request.expiresAt) && validMs(context.nowMs), 'INVALID_TIMESTAMPS');
    check(request.issuedAt < request.expiresAt && request.expiresAt - request.issuedAt <= MAX_WINDOW_MS, 'INVALID_WINDOW');
    check(context.nowMs >= request.issuedAt && context.nowMs < request.expiresAt, 'REQUEST_NOT_CURRENT');
    check(Array.isArray(approvals) && approvals.length === 2, 'TWO_APPROVALS_REQUIRED');
    check(Array.isArray(context.identities) && context.identities.length >= 3 && context.identities.length <= 20, 'INVALID_IDENTITIES');
    check(Array.isArray(context.keys) && context.keys.length >= 2 && context.keys.length <= 40, 'INVALID_KEYS');
    check(Array.isArray(context.usedApprovalIds) && Array.isArray(context.usedNonces), 'REPLAY_LEDGER_REQUIRED');
    check(context.usedApprovalIds.length <= 10000 && context.usedNonces.length <= 10000, 'LEDGER_TOO_LARGE');
    check(context.usedApprovalIds.every(validId) && context.usedNonces.every(validId), 'INVALID_LEDGER');
    check(new Set(context.usedApprovalIds).size === context.usedApprovalIds.length, 'INVALID_LEDGER');
    check(new Set(context.usedNonces).size === context.usedNonces.length, 'INVALID_LEDGER');

    const identities = new Map();
    for (const identity of context.identities) {
      exactObject(identity, IDENTITY_FIELDS, 'INVALID_IDENTITY');
      check(validId(identity.humanId) && ['BUILDER', 'APPROVER'].includes(identity.role), 'INVALID_IDENTITY');
      check(!identities.has(identity.humanId), 'DUPLICATE_IDENTITY');
      check(identity.syntheticIdentityAssured === true && identity.syntheticAccountControlAssured === true, 'SYNTHETIC_IDENTITY_NOT_ASSURED');
      identities.set(identity.humanId, identity);
    }
    check(identities.get(request.builderHumanId)?.role === 'BUILDER', 'INVALID_BUILDER_BINDING');

    const keys = new Map();
    const uniquePubkeys = new Set();
    for (const binding of context.keys) {
      exactObject(binding, KEY_FIELDS, 'INVALID_KEY_BINDING');
      check(validId(binding.keyId) && validId(binding.humanId) && typeof binding.publicKeyPem === 'string', 'INVALID_KEY_BINDING');
      check(!keys.has(binding.keyId) && identities.has(binding.humanId), 'DUPLICATE_OR_UNKNOWN_KEY');
      const publicKey = crypto.createPublicKey(binding.publicKeyPem);
      check(publicKey.asymmetricKeyType === 'ed25519', 'NON_ED25519_KEY');
      const fingerprint = hash(publicKey.export({ type: 'spki', format: 'der' }));
      check(!uniquePubkeys.has(fingerprint), 'REUSED_PUBLIC_KEY');
      uniquePubkeys.add(fingerprint);
      keys.set(binding.keyId, { humanId: binding.humanId, publicKey });
    }

    const humanIds = new Set(), keyIds = new Set(), approvalIds = new Set(), nonces = new Set();
    const pastApprovals = new Set(context.usedApprovalIds), pastNonces = new Set(context.usedNonces);
    const recorded = [];
    for (const approval of approvals) {
      exactObject(approval, APPROVAL_FIELDS, 'INVALID_APPROVAL_SHAPE');
      check(validId(approval.approvalId) && validId(approval.humanId) && validId(approval.keyId) && validId(approval.nonce), 'INVALID_APPROVAL_ID');
      check(approval.decision === 'APPROVE' && validMs(approval.signedAt), 'INVALID_DECISION');
      check(approval.signedAt >= request.issuedAt && approval.signedAt <= context.nowMs && approval.signedAt < request.expiresAt, 'INVALID_APPROVAL_TIME');
      check(approval.humanId !== request.builderHumanId, 'SELF_APPROVAL');
      check(!humanIds.has(approval.humanId) && !keyIds.has(approval.keyId), 'DUPLICATE_APPROVER');
      check(!approvalIds.has(approval.approvalId) && !nonces.has(approval.nonce), 'DUPLICATE_APPROVAL_ID');
      check(!pastApprovals.has(approval.approvalId) && !pastNonces.has(approval.nonce), 'REPLAY_DETECTED');
      check(identities.get(approval.humanId)?.role === 'APPROVER', 'APPROVER_NOT_BOUND');
      const key = keys.get(approval.keyId);
      check(key && key.humanId === approval.humanId, 'WRONG_SIGNING_KEY');
      check(typeof approval.signatureBase64 === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(approval.signatureBase64), 'INVALID_SIGNATURE_ENCODING');
      const signature = Buffer.from(approval.signatureBase64, 'base64');
      check(signature.length === 64 && signature.toString('base64') === approval.signatureBase64, 'INVALID_SIGNATURE_ENCODING');
      const unsigned = { ...approval };
      delete unsigned.signatureBase64;
      check(crypto.verify(null, signingPayload(request, unsigned), key.publicKey, signature), 'SIGNATURE_INVALID');
      humanIds.add(approval.humanId);
      keyIds.add(approval.keyId);
      approvalIds.add(approval.approvalId);
      nonces.add(approval.nonce);
      recorded.push(approval);
    }
    const receipt = Object.freeze({
      requestDigest: hash(Buffer.from(JSON.stringify([
        request.requestId, request.action, request.resource,
        request.builderHumanId, request.issuedAt, request.expiresAt
      ]))),
      approvalIds: Object.freeze(recorded.map(a => a.approvalId)),
      nonces: Object.freeze(recorded.map(a => a.nonce)),
      // No durable ledger is written. Caller must independently persist a ledger
      // before any future enforcement design could claim replay resistance.
      replayLedgerUpdated: false,
      productionAuthorityGranted: false
    });
    return result(true, receipt);
  } catch (_) {
    return result(false);
  }
}

module.exports = Object.freeze({ signingPayload, evaluateTwoHumanOffline });
