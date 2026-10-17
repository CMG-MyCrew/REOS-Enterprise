'use strict';
// R5 SYNTHETIC-ONLY TEST LIBRARY. Never import into production or accept its receipts as authority.
const crypto = require('node:crypto');
const { evaluateTwoHumanOffline } = require('../orchestrator/recovery-same-organization-v2-two-human-offline-evaluator');

const DENIED = Object.freeze({
  authorized: false, legacyB1Superseded: false, v2Operational: false,
  independentAdministratorCertified: false, externalEvidenceVerified: false,
  twoPersonApprovalCertified: false, iamMutationAuthorized: false,
  billingMutationAuthorized: false, cloudProvisioningAuthorized: false,
  productionDeploymentAuthorized: false, autonomousBuilderActivationAuthorized: false,
  autonomousRecoveryAuthorized: false, automaticMaoAuthorized: false,
  automaticOfferAuthorized: false, productionAuthorityGranted: false
});

function answer(classification, syntheticCryptographyPassed = false, testReceipt = null) {
  return Object.freeze({
    classification, syntheticTestOnly: true, realWorldIdentityVerified: false,
    accountRecoveryIndependenceCertified: false, persistentReplayPreventionCertified: false,
    productionAuditImmutabilityCertified: false, preProductionDryRunCertified: false,
    legacyB1Authoritative: true, syntheticCryptographyPassed, testReceipt,
    ...DENIED
  });
}

function evaluateSynthetic(input) {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return answer('R5_SYNTHETIC_DENIED');
    const allowed = ['request', 'approvals', 'context', 'revokedKeyIds'];
    if (Object.keys(input).some(k => !allowed.includes(k))) return answer('R5_SYNTHETIC_DENIED');
    const { request, approvals, context, revokedKeyIds = [] } = input;
    if (!context || context.testOnly !== true || !Array.isArray(approvals)) return answer('R5_SYNTHETIC_DENIED');
    if (!Array.isArray(revokedKeyIds) || !revokedKeyIds.every(x => typeof x === 'string') ||
        new Set(revokedKeyIds).size !== revokedKeyIds.length) return answer('R5_SYNTHETIC_DENIED');
    if (approvals.some(a => !a || typeof a !== 'object' || revokedKeyIds.includes(a.keyId)))
      return answer('R5_SYNTHETIC_DENIED');
    const r3 = evaluateTwoHumanOffline(request, approvals, context);
    if (!r3 || r3.authorized !== false || r3.legacyB1Superseded !== false ||
        r3.productionDeploymentAuthorized !== false || r3.automaticOfferAuthorized !== false ||
        r3.syntheticTestOnly !== true || r3.legacyB1Authoritative !== true)
      return answer('R5_SYNTHETIC_DENIED');
    if (!r3.testPassed) return answer('R5_SYNTHETIC_DENIED');
    if (!r3.testReceipt || r3.testReceipt.productionAuthorityGranted !== false ||
        r3.testReceipt.replayLedgerUpdated !== false)
      return answer('R5_SYNTHETIC_DENIED');
    return answer('R5_SYNTHETIC_CRYPTO_VALID_NONAUTHORITATIVE', true, r3.testReceipt);
  } catch (_) {
    return answer('R5_SYNTHETIC_DENIED');
  }
}

// In-memory serial model ONLY; neither atomic cross-process nor persistent in reality.
function createVolatileLedger() {
  return { approvalIds: new Set(), nonces: new Set(), version: 0 };
}
function serialMockClaim(ledger, receipt) {
  if (!ledger || !(ledger.approvalIds instanceof Set) || !(ledger.nonces instanceof Set) ||
      !receipt || !Array.isArray(receipt.approvalIds) || !Array.isArray(receipt.nonces) ||
      receipt.approvalIds.length !== 2 || receipt.nonces.length !== 2 ||
      !receipt.approvalIds.every(x => typeof x === 'string') ||
      !receipt.nonces.every(x => typeof x === 'string') ||
      new Set(receipt.approvalIds).size !== 2 || new Set(receipt.nonces).size !== 2)
    return false;
  if (receipt.approvalIds.some(x => ledger.approvalIds.has(x)) ||
      receipt.nonces.some(x => ledger.nonces.has(x))) return false;
  receipt.approvalIds.forEach(x => ledger.approvalIds.add(x));
  receipt.nonces.forEach(x => ledger.nonces.add(x));
  ledger.version++;
  return true;
}
// Deliberately unsafe two-reader snapshot: demonstrates the lost-update race.
function naiveConcurrentSnapshotModel(ledger, receipt) {
  const snapshotIds = new Set(ledger.approvalIds);
  const snapshotNonces = new Set(ledger.nonces);
  const possible = !receipt.approvalIds.some(x => snapshotIds.has(x)) &&
    !receipt.nonces.some(x => snapshotNonces.has(x));
  return Object.freeze({ readerOneWouldAccept: possible, readerTwoWouldAccept: possible,
    concurrentSafetyCertified: false, persistenceCertified: false });
}

function auditEvent(sequence, previousHash, eventType, payloadDigest) {
  const event = { sequence, previousHash, eventType, payloadDigest };
  const hash = crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex');
  return Object.freeze({ ...event, hash });
}
function verifySyntheticAudit(chain, trustedHead) {
  if (!Array.isArray(chain) || chain.length === 0 ||
      typeof trustedHead !== 'string' || !/^[0-9a-f]{64}$/.test(trustedHead)) return false;
  let previousHash = '0'.repeat(64);
  for (let i = 0; i < chain.length; i++) {
    const event = chain[i];
    if (!event || event.sequence !== i || event.previousHash !== previousHash ||
        !Number.isInteger(event.sequence) || typeof event.eventType !== 'string' ||
        typeof event.payloadDigest !== 'string' ||
        !/^[0-9a-f]{64}$/.test(event.payloadDigest)) return false;
    const check = auditEvent(event.sequence, event.previousHash, event.eventType, event.payloadDigest);
    if (check.hash !== event.hash) return false;
    previousHash = event.hash;
  }
  return previousHash === trustedHead;
}

// No actual B1 integration, system imports, IO, or production adapter.
function simulateB1Boundary({b1DependencyPresent = false, sourcePinValid = false,
                             callerProvidedAuthorization = false} = {}) {
  void b1DependencyPresent; void sourcePinValid; void callerProvidedAuthorization;
  return answer('R5_B1_RUNTIME_BOUNDARY_NOT_CERTIFIED');
}
function rejectSyntheticReceiptAsAuthority(_receipt) {
  return answer('R5_SYNTHETIC_RECEIPT_HAS_NO_AUTHORITY');
}
function routeMockAcquisition({compSupportedArv = false, adequateRepairScope = false,
                               compsAreCurrent = false} = {}) {
  const readyForManualReview = compSupportedArv === true && adequateRepairScope === true &&
    compsAreCurrent === true;
  return Object.freeze({
    routing: readyForManualReview ? 'MANUAL_REVIEW_ONLY' : 'RESEARCH_REVIEW_REQUIRED',
    syntheticTestOnly: true, compSupportedArvEvidenceCertified: false,
    repairScopeEvidenceCertified: false, ...DENIED
  });
}
module.exports = Object.freeze({DENIED, evaluateSynthetic, createVolatileLedger, serialMockClaim,
  naiveConcurrentSnapshotModel, auditEvent, verifySyntheticAudit, simulateB1Boundary,
  rejectSyntheticReceiptAsAuthority, routeMockAcquisition});
