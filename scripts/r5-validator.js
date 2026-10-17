'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { signingPayload } = require('../orchestrator/recovery-same-organization-v2-two-human-offline-evaluator');
const {
  DENIED, evaluateSynthetic, createVolatileLedger, serialMockClaim,
  naiveConcurrentSnapshotModel, auditEvent, verifySyntheticAudit, simulateB1Boundary,
  rejectSyntheticReceiptAsAuthority, routeMockAcquisition
} = require('./r5-simulator');

const NOW = 1760000000000;
const keys = Array.from({length: 4}, () => crypto.generateKeyPairSync('ed25519'));
const humans = ['HUMAN_BUILDER_SYN', 'HUMAN_REVIEWER_B_SYN', 'HUMAN_REVIEWER_C_SYN'];
const keyIds = ['KEY_BUILDER_SYN', 'KEY_REVIEWER_B_SYN', 'KEY_REVIEWER_C_SYN', 'KEY_REVIEWER_B_ALT'];
const identities = humans.map((humanId, i) => ({humanId, role: i ? 'APPROVER' : 'BUILDER',
  syntheticIdentityAssured: true, syntheticAccountControlAssured: true}));
const bindings = keys.map((pair, i) => ({
  keyId: keyIds[i], humanId: humans[i === 3 ? 1 : i],
  publicKeyPem: pair.publicKey.export({format:'pem',type:'spki'}).toString()
}));
const request = Object.freeze({requestId:'REQUEST_R5_000001', action:'IAM_MUTATION',
  resource:'offline/reos/synthetic', builderHumanId:humans[0],
  issuedAt:NOW, expiresAt:NOW+120000});
const context = Object.freeze({testOnly:true,nowMs:NOW+5000,identities,keys:bindings,
  usedApprovalIds:[],usedNonces:[]});
function sign(i, changes={}, keyIndex=i, req=request) {
  const unsigned = {
    approvalId:'APPROVAL_R5_0000'+i, humanId:humans[i], keyId:keyIds[i],
    nonce:'NONCE_R5_000000'+i, decision:'APPROVE', signedAt:NOW+1000+i,...changes
  };
  const signatureBase64 = crypto.sign(null,signingPayload(req,unsigned),keys[keyIndex].privateKey).toString('base64');
  return Object.freeze({...unsigned,signatureBase64});
}
const approvals = [sign(1),sign(2)];
const input = {request,approvals,context,revokedKeyIds:[]};
const allPermissionKeys = Object.keys(DENIED);
function denied(r) {
  assert.equal(r.syntheticTestOnly,true);
  for (const k of allPermissionKeys) assert.equal(r[k],false,k);
}
function reject(r) {
  denied(r);
  assert.equal(r.syntheticCryptographyPassed,false);
  assert.equal(r.testReceipt,null);
}
let testCount=0, negativeCount=0;
function test(name, callback, isNegative=false) {
  callback();
  testCount++;
  if (isNegative) negativeCount++;
  console.log('R5_CASE='+name+'|PASS');
}
const positive = evaluateSynthetic(input);
test('two_real_synthetic_signatures_never_authorize',()=>{
  denied(positive);
  assert.equal(positive.syntheticCryptographyPassed,true);
  assert.equal(positive.classification,'R5_SYNTHETIC_CRYPTO_VALID_NONAUTHORITATIVE');
  assert.equal(positive.testReceipt.replayLedgerUpdated,false);
  assert.equal(positive.testReceipt.productionAuthorityGranted,false);
  assert(Object.isFrozen(positive));
});
function failure(name, replace) {
  test(name,()=>reject(evaluateSynthetic({...input,...replace})),true);
}
failure('missing_test_flag',{context:{...context,testOnly:false}});
failure('missing_one_approval',{approvals:[approvals[0]]});
failure('forged_request_resource',{request:{...request,resource:'prod/resources'}});
failure('forged_action',{request:{...request,action:'PRODUCTION_DEPLOYMENT'}});
failure('forged_request_id',{request:{...request,requestId:'REQUEST_R5_000002'}});
failure('forged_request_expiration',{request:{...request,expiresAt:NOW+60000}});
failure('expired_request',{context:{...context,nowMs:NOW+120000}});
failure('request_not_yet_issued',{context:{...context,nowMs:NOW-1}});
failure('approval_future_clock',{approvals:[sign(1,{signedAt:NOW+11000}),approvals[1]]});
failure('self_approval',{approvals:[sign(0),approvals[1]]});
failure('one_human_two_keys',{approvals:[approvals[0],sign(1,{keyId:keyIds[3],approvalId:'APPROVAL_R5_ALT0001',nonce:'NONCE_R5_ALT000001'},3)]});
failure('wrong_signer_key',{approvals:[sign(1,{},2),approvals[1]]});
failure('corrupted_signature',{approvals:[{...approvals[0],signatureBase64:approvals[1].signatureBase64},approvals[1]]});
failure('revoked_approver_key',{revokedKeyIds:[keyIds[1]]});
failure('both_approvers_revoked',{revokedKeyIds:[keyIds[1],keyIds[2]]});
failure('malformed_revocation_list',{revokedKeyIds:'KEY_REVIEWER_B_SYN'});
failure('duplicated_revocation_ids',{revokedKeyIds:[keyIds[1],keyIds[1]]});
failure('duplicate_approval_id',{approvals:[approvals[0],sign(2,{approvalId:approvals[0].approvalId})]});
failure('duplicate_approval_nonce',{approvals:[approvals[0],sign(2,{nonce:approvals[0].nonce})]});
failure('replayed_approval_id',{context:{...context,usedApprovalIds:[approvals[0].approvalId]}});
failure('replayed_approval_nonce',{context:{...context,usedNonces:[approvals[1].nonce]}});
failure('identity_assertion_missing',{context:{...context,identities:identities.map(i=>i.humanId===humans[1]?{...i,syntheticIdentityAssured:false}:i)}});
failure('account_control_assertion_missing',{context:{...context,identities:identities.map(i=>i.humanId===humans[1]?{...i,syntheticAccountControlAssured:false}:i)}});
failure('tampered_public_key_binding',{context:{...context,keys:bindings.map(k=>k.keyId===keyIds[1]?{...k,humanId:humans[2]}:k)}});
failure('extra_request_field',{request:{...request,authorized:true}});
failure('caller_injects_authorized_flag',{authorized:true});
failure('missing_replay_ledger',{context:{...context,usedNonces:undefined}});
test('unrelated_revocation_still_only_synthetic',()=>{
  const r=evaluateSynthetic({...input,revokedKeyIds:[keyIds[0]]});denied(r);
  assert.equal(r.syntheticCryptographyPassed,true);
});
test('volatile_ledger_first_claim',()=>{
  const ledger=createVolatileLedger();
  assert.equal(serialMockClaim(ledger,positive.testReceipt),true);
  assert.equal(ledger.version,1);
  assert.equal(serialMockClaim(ledger,positive.testReceipt),false);
});
test('volatile_ledger_replay_rejection',()=>{
  const ledger=createVolatileLedger();
  assert.equal(serialMockClaim(ledger,positive.testReceipt),true);
  assert.equal(serialMockClaim(ledger,{...positive.testReceipt,approvalIds:['APPROVAL_R5_ANOTHER1',positive.testReceipt.approvalIds[1]]}),false);
  assert.equal(serialMockClaim(ledger,{...positive.testReceipt,nonces:['NONCE_R5_ANOTHER01',positive.testReceipt.nonces[1]]}),false);
},true);
test('naive_snapshot_race_exposed_not_certified',()=>{
  const ledger=createVolatileLedger();
  const r=naiveConcurrentSnapshotModel(ledger,positive.testReceipt);
  assert.equal(r.readerOneWouldAccept,true);
  assert.equal(r.readerTwoWouldAccept,true);
  assert.equal(r.concurrentSafetyCertified,false);
},true);
test('sequential_mock_claim_cannot_certify_atomicity',()=>{
  const ledger=createVolatileLedger();
  const first=serialMockClaim(ledger,positive.testReceipt);
  const second=serialMockClaim(ledger,positive.testReceipt);
  assert.equal(first,true);assert.equal(second,false);
},true);
test('ledger_is_not_durable',()=>{
  const ledger=createVolatileLedger();serialMockClaim(ledger,positive.testReceipt);
  const restarted=createVolatileLedger();
  assert.equal(serialMockClaim(restarted,positive.testReceipt),true);
  assert.equal(positive.persistentReplayPreventionCertified,false);
},true);
test('synthetic_receipt_forgery_never_authorizes',()=>{
  const forged={...positive.testReceipt,authorized:true,productionAuthorityGranted:true};
  reject(rejectSyntheticReceiptAsAuthority(forged));
},true);
test('missing_b1_dependency_stays_denied',()=>{
  reject(simulateB1Boundary({b1DependencyPresent:false,sourcePinValid:true}));
},true);
test('b1_present_is_not_integration_certification',()=>{
  reject(simulateB1Boundary({b1DependencyPresent:true,sourcePinValid:true}));
},true);
test('forged_b1_source_pin_stays_denied',()=>{
  reject(simulateB1Boundary({b1DependencyPresent:true,sourcePinValid:false,callerProvidedAuthorization:true}));
},true);
test('missing_comp_arv_routes_to_research',()=>{
  const v=routeMockAcquisition({adequateRepairScope:true,compsAreCurrent:true});denied({...v,syntheticTestOnly:true});
  assert.equal(v.routing,'RESEARCH_REVIEW_REQUIRED');
},true);
test('missing_repair_scope_routes_to_research',()=>{
  const v=routeMockAcquisition({compSupportedArv:true,compsAreCurrent:true});denied({...v,syntheticTestOnly:true});
  assert.equal(v.routing,'RESEARCH_REVIEW_REQUIRED');
},true);
test('stale_comps_route_to_research',()=>{
  const v=routeMockAcquisition({compSupportedArv:true,adequateRepairScope:true});denied({...v,syntheticTestOnly:true});
  assert.equal(v.routing,'RESEARCH_REVIEW_REQUIRED');
},true);
test('complete_mock_evidence_still_no_offer',()=>{
  const v=routeMockAcquisition({compSupportedArv:true,adequateRepairScope:true,compsAreCurrent:true});
  denied({...v,syntheticTestOnly:true});assert.equal(v.routing,'MANUAL_REVIEW_ONLY');
});
test('forged_comp_gate_is_not_sufficient',()=>{
  const v=routeMockAcquisition({compSupportedArv:'true',adequateRepairScope:true,compsAreCurrent:true});
  assert.equal(v.routing,'RESEARCH_REVIEW_REQUIRED');denied({...v,syntheticTestOnly:true});
},true);
const payloadDigest=crypto.createHash('sha256').update('SYNTHETIC-NO-PRODUCTION-PAYLOAD').digest('hex');
const e0=auditEvent(0,'0'.repeat(64),'MOCK_REQUEST_CREATED',payloadDigest);
const e1=auditEvent(1,e0.hash,'MOCK_APPROVAL_A',payloadDigest);
const e2=auditEvent(2,e1.hash,'MOCK_APPROVAL_B',payloadDigest);
const chain=[e0,e1,e2];
test('mock_audit_chain_valid_with_trusted_head',()=>assert.equal(verifySyntheticAudit(chain,e2.hash),true));
test('mock_audit_mutation_detected',()=>assert.equal(verifySyntheticAudit([e0,{...e1,eventType:'TAMPERED'},e2],e2.hash),false),true);
test('mock_audit_reorder_detected',()=>assert.equal(verifySyntheticAudit([e1,e0,e2],e2.hash),false),true);
test('mock_audit_deletion_detected',()=>assert.equal(verifySyntheticAudit([e0,e2],e2.hash),false),true);
test('mock_audit_truncation_detected_with_anchored_head',()=>assert.equal(verifySyntheticAudit([e0,e1],e2.hash),false),true);
test('mock_audit_recomputed_chain_without_trusted_anchor_not_certified',()=>{
  const a=auditEvent(0,'0'.repeat(64),'FORGED_0',payloadDigest);
  const b=auditEvent(1,a.hash,'FORGED_1',payloadDigest);
  assert.equal(verifySyntheticAudit([a,b],b.hash),true);
  assert.equal(verifySyntheticAudit([a,b],e2.hash),false);
},true);
assert.equal(testCount,49); // update only when intentionally adding/removing tests
console.log('=== R5 SYNTHETIC-ONLY TEST RESULTS ===');
console.log('R5_SYNTHETIC_TEST_CASES=' + testCount);
console.log('R5_SYNTHETIC_NEGATIVE_AND_RISK_CASES=' + negativeCount);
console.log('R5_NAIVE_CONCURRENT_REPLAY_RACE_EXPOSED=true');
console.log('R5_MODEL_LEVEL_SERIAL_CLAIM_TEST=PASS');
console.log('R5_SYNTHETIC_AUDIT_TAMPER_CASES=PASS');
console.log('R5_SYNTHETIC_ACQUISITION_GATE_CASES=PASS');
console.log('R5_B1_RUNTIME_INTEGRATION_CERTIFIED=false');
console.log('R5_PERSISTENT_REPLAY_PROTECTION_CERTIFIED=false');
console.log('R5_REAL_WORLD_ACCOUNT_CONTROL_CERTIFIED=false');
console.log('R5_AUDIT_IMMUTABILITY_CERTIFIED=false');
console.log('R5_NONPRODUCTION_DRY_RUN_CERTIFIED=false');
console.log('R5_AUTOMATIC_MAO_OR_OFFER_AUTHORIZED=false');
console.log('R5_SYNTHETIC_SUITE=PASS');
