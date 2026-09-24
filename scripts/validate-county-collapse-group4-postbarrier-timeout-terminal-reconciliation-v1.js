'use strict';

const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const vm = require('vm');

const MAIN = '81fce4df21b1f4ac56efa039989c70e4f3a91654';
const MAIN_TREE = '1cb8dfe32cf1825170892b5b61ca862777ab5567';
const EVIDENCE_FILE = 'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutEvidence.js';
const RECONCILIATION_FILE = 'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.js';
const SELF = 'scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-v1.js';
const WORKFLOW = '.github/workflows/county-collapse-offline.yml';
const DESIGN = 'docs/county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.md';

const PROTECTED = [
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js',
  'build/apps-script-brand/Database.js',
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js',
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js',
  'build/apps-script-brand/CountyMutationExclusionLease.js'
];

const EXPECTED_SCOPE = [
  EVIDENCE_FILE,
  RECONCILIATION_FILE,
  SELF,
  WORKFLOW
].sort();

function git(args) {
  return cp.spawnSync('git', args, {encoding: 'utf8'});
}

function gitText(args) {
  const result = git(args);
  assert.equal(result.status, 0, 'git ' + args.join(' ') + ' failed\n' + String(result.stderr || ''));
  return String(result.stdout || '').trim();
}

function gitRaw(args) {
  const result = git(args);
  assert.equal(result.status, 0, 'git ' + args.join(' ') + ' failed\n' + String(result.stderr || ''));
  return String(result.stdout || '');
}

function lines(value) {
  return String(value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
}

assert.equal(gitText(['rev-parse', MAIN]), MAIN, 'Certified main is unavailable.');
assert.equal(gitText(['rev-parse', MAIN + '^{tree}']), MAIN_TREE, 'Certified main tree drift.');

PROTECTED.forEach(path => {
  const committed = git(['diff', '--quiet', MAIN, 'HEAD', '--', path]);
  assert.equal(committed.status, 0, 'Protected committed source changed: ' + path);
  const working = git(['diff', '--quiet', '--', path]);
  assert.equal(working.status, 0, 'Protected working source changed: ' + path);
  const staged = git(['diff', '--cached', '--quiet', '--', path]);
  assert.equal(staged.status, 0, 'Protected staged source changed: ' + path);
});

const effective = new Set();
[
  gitText(['diff', '--name-only', MAIN, 'HEAD']),
  gitText(['diff', '--name-only']),
  gitText(['diff', '--cached', '--name-only']),
  gitText(['ls-files', '--others', '--exclude-standard'])
].forEach(value => lines(value).forEach(path => effective.add(path)));

assert.deepEqual(Array.from(effective).sort(), EXPECTED_SCOPE, 'Implementation increment must remain exactly four files.');
assert.equal(gitText(['diff', '--cached', '--name-only']), '', 'Implementation candidate must remain unstaged.');

const evidenceSource = fs.readFileSync(EVIDENCE_FILE, 'utf8');
const reconciliationSource = fs.readFileSync(RECONCILIATION_FILE, 'utf8');
const designSource = fs.readFileSync(DESIGN, 'utf8');
const workflow = fs.readFileSync(WORKFLOW, 'utf8');

assert.ok(evidenceSource.includes('READ_ONLY_GROUP4_POSTBARRIER_TIMEOUT_EVIDENCE_V1'));
assert.ok(evidenceSource.includes('UNCERTAIN_DELETE_BARRIER_OR_TERMINAL'));
assert.ok(evidenceSource.includes('VERIFIED_SUCCESS_JOURNAL'));
assert.ok(!/\.append\s*\(/.test(evidenceSource), 'Read-only evidence module must not append journal events.');
assert.ok(!/deletePhysicalRowExact\s*\(/.test(evidenceSource));

assert.ok(reconciliationSource.includes('POSTDELETE_VERIFIED'));
assert.ok(reconciliationSource.includes('COLLAPSE_DELETE_VERIFIED'));
assert.ok(reconciliationSource.includes('withScriptLockContext'));
assert.ok(reconciliationSource.includes('.assertReady({'));
assert.ok(!/deletePhysicalRowExact\s*\(/.test(reconciliationSource), 'Reconciliation must not call physical delete.');
assert.ok(!/CountyCodeViolationCollapseExecutor/.test(reconciliationSource), 'Reconciliation must not invoke executor surface.');
assert.ok(!/\.close\s*\(/.test(reconciliationSource), 'Reconciliation must not close maintenance automatically.');

[
  'FRESH_MAINTENANCE_REQUIRED_FOR_FUTURE_REPAIR=true',
  'REPAIR_MUST_NOT_CALL_DELETE_PHYSICAL_ROW_EXACT=true',
  'REPAIR_MUST_NOT_FABRICATE_ORIGINAL_PRIMITIVE_RESULT=true',
  'REPAIR_MUST_BE_RESUME_SAFE=true'
].forEach(marker => assert.ok(designSource.includes(marker), 'Design marker missing: ' + marker));

const baseWorkflow = gitRaw(['show', MAIN + ':' + WORKFLOW]);
const syntaxAnchor =
  '          node --check scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.js\n';
const syntaxAddition = syntaxAnchor +
  '          node --check build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutEvidence.js\n' +
  '          node --check build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.js\n' +
  '          node --check scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-v1.js\n';
assert.equal(baseWorkflow.split(syntaxAnchor).length - 1, 1, 'Group 4 design syntax anchor changed.');

const stepAnchor =
  '      - name: Validate Group 4 post-barrier timeout terminal-reconciliation design v1\n' +
  '        run: node scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.js\n\n';
const stepAddition =
  '      - name: Validate certified Group 4 post-barrier timeout terminal-reconciliation design v1\n' +
  '        run: |\n' +
  '          root="$(mktemp -d)"\n' +
  '          wt="$root/certified"\n' +
  '          cleanup() {\n' +
  '            git worktree remove --force "$wt" >/dev/null 2>&1 || true\n' +
  '            rm -rf "$root"\n' +
  '          }\n' +
  '          trap cleanup EXIT\n\n' +
  '          git worktree add --detach "$wt" ' + MAIN + '\n\n' +
  '          (\n' +
  '            cd "$wt"\n' +
  '            test "$(git rev-parse HEAD)" = "' + MAIN + '"\n' +
  '            test "$(git rev-parse \'HEAD^{tree}\')" = "' + MAIN_TREE + '"\n' +
  '            node scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.js\n' +
  '          )\n\n' +
  '      - name: Validate Group 4 post-barrier timeout terminal reconciliation v1\n' +
  '        run: node scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-v1.js\n\n';
assert.equal(baseWorkflow.split(stepAnchor).length - 1, 1, 'Group 4 design validation step anchor changed.');

let expectedWorkflow = baseWorkflow.replace(syntaxAnchor, syntaxAddition);
expectedWorkflow = expectedWorkflow.replace(stepAnchor, stepAddition);
assert.equal(workflow, expectedWorkflow, 'Workflow changed outside exact Group 4 implementation registration.');

[EVIDENCE_FILE, RECONCILIATION_FILE, SELF, WORKFLOW].forEach(path => {
  fs.readFileSync(path, 'utf8').split('\n').forEach((line, index) => {
    assert.equal(/[ \t]+$/.test(line), false, 'Trailing whitespace in ' + path + ' line ' + String(index + 1));
  });
});

const OP='9c3f6f20-340b-47fb-a2c9-175fcbfbd88d';
const WIN='DL-20260820195113-7700';
const TARGET='DL-20260820195131-0566';
const PREP='41869f2955b69423bc02292a126049cacb523df545d4535471a5972c36b6c788';
const PREPP='c417ee900580a965090f95eddffeb6220e77385188900e740483617d41e7af12';
const BAR='6f925e2042904e756375b06c2e0b0ba321517dd2e95a909fdc6f75f4df66fd86';
const BARP='ddf06e64cfd987044b048317170b9b23367444993ae7999cbfec4dcb202f8f5d';
const AUTH='8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';
const PLAN='9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';
const CPK='property|address|pa|philadelphia|19125-4508|1145 n delaware ave';
const DKEY='pa-philadelphia|code_violations|vi-2026-045398';
const CURSOR='AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';
const MODE='GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_V1';

function deep(v){ return JSON.parse(JSON.stringify(v)); }
function baseEvents(){
  return [
    {manifest:{operationId:OP,eventSequence:1,eventType:'INTENT_PREPARED',eventTimestampUtc:'2026-09-23T20:00:32.284Z',operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,payloadSha256:PREPP,previousEventSha256:'GENESIS',eventSha256:PREP}},
    {manifest:{operationId:OP,eventSequence:2,eventType:'DELETE_INVOCATION_STARTED',eventTimestampUtc:'2026-09-23T20:03:06.562Z',operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,payloadSha256:BARP,previousEventSha256:PREP,eventSha256:BAR}}
  ];
}
function maintenancePayload(gate='gate',lease='lease'){
  return {gateId:gate,leaseId:lease,authorityGeneration:'CURRENT',rawTokenPersisted:false,manualExternalWritersQuiescentCertified:true};
}
function postData(){
 return {
  reconciliationContractVersion:1,reconciliationImplementationVersion:MODE,reconciliationReason:'CERTIFIED_GROUP4_POSTBARRIER_EXECUTOR_TIMEOUT',incidentOperationId:OP,groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,violationNumber:'VI-2026-045398',authoritySha256:AUTH,winnerPlanFingerprintSha256:PLAN,preparedEventSha256:PREP,preparedPayloadSha256:PREPP,deleteBarrierEventSha256:BAR,deleteBarrierPayloadSha256:BARP,originalExecutorRpcError:'Exceeded maximum execution time',originalPrimitiveResultAvailable:false,originalPrimitiveResultPersisted:false,secondPhysicalDeleteExecuted:false,physicalDeleteExecutedByReconciliation:false,targetAbsentIndependentlyVerified:true,winnerPresentExactlyOnce:true,winnerCurrentRowNumber:771,canonicalPropertyKey:CPK,downstreamReferenceAudit:{referenceSurface:'CELL_VALUES_ONLY',scannedSheetCount:5,matchCount:0,scanComplete:true,matchesTruncated:false,targetDistressLeadId:TARGET},scheduler:{handler:'reosCountyProductionSchedulerRun',triggerCount:0},checkpoint:{id:'COUNTY-20260902222607805',nextFeedIndex:0,currentFeedCursor:CURSOR,completedFeeds:0,totalFeeds:4,resultCount:0},maintenanceCapability:maintenancePayload(),verificationBasis:'INCIDENT_BOUNDED_POST_BARRIER_TIMEOUT_LIVE_RECONCILIATION',automaticRetryPermitted:false,rowRecreationPermitted:false,automaticMaintenanceClosePermitted:false,journalMutationLimitedToTerminalization:true
 };
}
function event3(){
 const data=postData();
 return {manifest:{operationId:OP,eventSequence:3,eventType:'POSTDELETE_VERIFIED',eventTimestampUtc:'2026-09-23T21:00:00.000Z',operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,payloadSha256:'post-payload',previousEventSha256:BAR,eventSha256:'post-event'},payload:{operationId:OP,eventSequence:3,eventType:'POSTDELETE_VERIFIED',eventTimestampUtc:'2026-09-23T21:00:00.000Z',operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,operationCreatedTimestampUtc:'2026-09-23T20:00:32.284Z',data}};
}
function event4(){
 const p=event3();
 const data={reconciliationContractVersion:1,reconciliationImplementationVersion:MODE,terminalReason:'CERTIFIED_GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION',incidentOperationId:OP,groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,violationNumber:'VI-2026-045398',authoritySha256:AUTH,winnerPlanFingerprintSha256:PLAN,deleteBarrierEventSha256:BAR,postdeleteEventSha256:p.manifest.eventSha256,postdeletePayloadSha256:p.manifest.payloadSha256,canonicalPropertyKey:CPK,verificationBasis:'INCIDENT_BOUNDED_POST_BARRIER_TIMEOUT_LIVE_RECONCILIATION',originalPrimitiveResultAvailable:false,secondPhysicalDeleteExecuted:false,physicalDeleteExecutedByReconciliation:false,targetAbsentIndependentlyVerified:true,winnerPresentExactlyOnce:true,verifiedPostdeleteEvidenceReadback:true,maintenanceCapability:maintenancePayload(),automaticRetryPermitted:false,rowRecreationPermitted:false,automaticMaintenanceClosePermitted:false};
 return {manifest:{operationId:OP,eventSequence:4,eventType:'COLLAPSE_DELETE_VERIFIED',eventTimestampUtc:'2026-09-23T21:01:00.000Z',operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,payloadSha256:'terminal-payload',previousEventSha256:p.manifest.eventSha256,eventSha256:'terminal-event'},payload:{operationId:OP,eventSequence:4,eventType:'COLLAPSE_DELETE_VERIFIED',eventTimestampUtc:'2026-09-23T21:01:00.000Z',operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,operationCreatedTimestampUtc:'2026-09-23T20:00:32.284Z',data}};
}
function createHarness(opts={}){
 const state={history:{found:true,operationId:OP,operationCreatedTimestampUtc:'2026-09-23T20:00:32.284Z',identity:{executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET},events:baseEvents()},extraHistories:{},rows:[{_rowNumber:771,'Distress Lead ID':WIN,Source:'PA-PHILADELPHIA','Source Dataset':'code_violations','Violation Number':'VI-2026-045398','Canonical Property Key':CPK,_derivedCanonicalPropertyKey:CPK}],refMatchCount:0,schedulerFrozen:true,checkpointId:'COUNTY-20260902222607805',checkpointCursor:CURSOR,maintenanceReady:true,maintenanceAuthorityGeneration:'CURRENT',maintenanceGateReturned:'gate',maintenanceLeaseReturned:'lease',appendTypes:[],appendReadback:{POSTDELETE_VERIFIED:true,COLLAPSE_DELETE_VERIFIED:true},finalRecoveryOverride:null,deleteCalls:0,executorCalls:0,schedulerMutationCalls:0,checkpointMutationCalls:0};
 Object.assign(state, opts);
 const ctx={console,JSON,Object,Array,String,Number,Boolean,Math,Date,Error,RegExp,Set,Map,Infinity,NaN,isFinite};
 ctx.REOS={};
 ctx.REOS.Security={requireAdmin(){}};
 ctx.REOS.CanonicalPropertyIdentity={resolve(row){return {canonicalPropertyKey:row._derivedCanonicalPropertyKey||CPK,sourceObservationKey:'obs-key'};}};
 ctx.REOS.CountyCodeViolationCollapseDirectKeepExecutionAuthority={metadata(){return {authoritySha256:AUTH,winnerPlanFingerprintSha256:PLAN,directKeepGroupCount:14,directKeepDeleteCandidateCount:16};},catalog(){return [{groupNumber:4,violationNumber:'VI-2026-045398',proposedDurableKey:DKEY,canonicalPropertyKey:CPK,winnerDistressLeadId:WIN,deleteCandidateDistressLeadIds:[TARGET]}];}};
 ctx.REOS.CountyIdentityReferenceAudit={audit(){return {ok:true,scanComplete:true,matchesTruncated:false,truncated:false,matchCount:state.refMatchCount,unmatchedIds:state.refMatchCount===0?[TARGET]:[],referenceSurface:'CELL_VALUES_ONLY',scannedSheetCount:5};}};
 ctx.REOS.CountyProductionScheduler={getCheckpoint(){return {id:state.checkpointId,nextFeedIndex:0,currentFeedCursor:state.checkpointCursor,completedFeeds:0,totalFeeds:4,results:[]};}};
 ctx.ScriptApp={getProjectTriggers(){return state.schedulerFrozen?[]:[{getHandlerFunction(){return 'reosCountyProductionSchedulerRun';}}];}};
 function recovery(){
   if(state.finalRecoveryOverride && state.history.events.length===4){return {operationId:OP,found:true,classification:state.finalRecoveryOverride,automaticRetryPermitted:false,rowRecreationPermitted:false,journalMutationExecuted:false,eventCount:4,terminalEventSha256:state.history.events[3].manifest.eventSha256};}
   const ev=state.history.events;
   if(ev.length===4 && ev[3].manifest.eventType==='COLLAPSE_DELETE_VERIFIED') return {operationId:OP,found:true,classification:'VERIFIED_SUCCESS_JOURNAL',automaticRetryPermitted:false,rowRecreationPermitted:false,journalMutationExecuted:false,eventCount:4,terminalEventSha256:ev[3].manifest.eventSha256};
   return {operationId:OP,found:true,classification:'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL',automaticRetryPermitted:false,rowRecreationPermitted:false,journalMutationExecuted:false,eventCount:ev.length};
 }
 ctx.REOS.CountyCollapseOperationIntentStore={
  listOperationIds(){return Object.keys(Object.assign({[OP]:true},state.extraHistories)).sort();},
  read(id){if(id===OP)return state.history; return state.extraHistories[id];},
  recover(id){if(id!==OP)return {operationId:id,found:true,classification:'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',automaticRetryPermitted:false,rowRecreationPermitted:false,journalMutationExecuted:false,eventCount:1}; return recovery();},
  append(req,options){
    assert(options&&options.lockContext,'lock required');
    state.appendTypes.push(req.eventType);
    const seq=state.history.events.length+1;
    const prev=state.history.events[state.history.events.length-1].manifest.eventSha256;
    const hash=req.eventType==='POSTDELETE_VERIFIED'?'post-event':'terminal-event';
    const phash=req.eventType==='POSTDELETE_VERIFIED'?'post-payload':'terminal-payload';
    const ts=req.eventType==='POSTDELETE_VERIFIED'?'2026-09-23T21:00:00.000Z':'2026-09-23T21:01:00.000Z';
    const ev={manifest:{operationId:OP,eventSequence:seq,eventType:req.eventType,eventTimestampUtc:ts,operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,payloadSha256:phash,previousEventSha256:prev,eventSha256:hash},payload:{operationId:OP,eventSequence:seq,eventType:req.eventType,eventTimestampUtc:ts,operationIntentContractVersion:1,executorImplementationVersion:'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',groupNumber:4,winnerDistressLeadId:WIN,targetDeleteDistressLeadId:TARGET,operationCreatedTimestampUtc:'2026-09-23T20:00:32.284Z',data:deep(req.payload)}};
    state.history.events.push(ev);
    return {operationId:OP,eventSequence:seq,eventType:req.eventType,eventSha256:hash,payloadSha256:phash,readbackVerified:state.appendReadback[req.eventType]!==false};
  }
 };
 ctx.REOS.Database={getAll(){return state.rows;},withScriptLockContext(fn){return fn({lock:'mock'});},deletePhysicalRowExact(){state.deleteCalls++;}};
 ctx.REOS.CountyCodeViolationCollapseExecutor={execute(){state.executorCalls++;}};
 ctx.REOS.CountyCodeViolationCollapseMaintenanceGate={assertReady(o){
  if(o.maintenanceToken!=='fresh-token') throw new Error('Lease token does not match.');
  if(!state.maintenanceReady) return {ok:true,ready:false,maintenanceReady:false};
  return {ok:true,ready:true,maintenanceReady:true,gateMode:'CODE_VIOLATION_COLLAPSE',authorityGeneration:state.maintenanceAuthorityGeneration,gateId:state.maintenanceGateReturned,leaseId:state.maintenanceLeaseReturned,manualExternalWritersQuiescentCertified:true,schedulerHandler:'reosCountyProductionSchedulerRun',authority:{winnerPlanFingerprintSha256:PLAN,collapseAuthoritySha256:AUTH},checkpoint:{cycleId:'COUNTY-20260902222607805',nextFeedIndex:0,currentFeedCursor:CURSOR,completedFeeds:0,totalFeeds:4,results:[]}};
 }};
 vm.createContext(ctx); vm.runInContext(evidenceSource,ctx); vm.runInContext(reconciliationSource,ctx);
 return {ctx,state};
}
function request(over={}){return Object.assign({confirmReconciliation:'CONFIRM_GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_V1',operationId:OP,groupNumber:4,expectedWinnerDistressLeadId:WIN,expectedTargetDeleteDistressLeadId:TARGET,expectedPreparedEventSha256:PREP,expectedDeleteBarrierEventSha256:BAR,expectedAuthoritySha256:AUTH,expectedWinnerPlanFingerprintSha256:PLAN,maintenanceToken:'fresh-token',expectedMaintenanceLeaseId:'lease',expectedMaintenanceGateId:'gate'},over);}
function seed3(h){h.state.history.events.push(event3());}
function seed4(h){h.state.history.events.push(event3());h.state.history.events.push(event4());}
function expectThrow(fn){let threw=false;try{fn();}catch(e){threw=true;}assert(threw);}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+count+': '+name);}

test('exact two-event incident is recognized',()=>{const h=createHarness();assert.equal(h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status().journalPhase,'BARRIER_ONLY');});
test('wrong operation ID fails',()=>{const h=createHarness();h.state.history.operationId='wrong';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('wrong Group fails',()=>{const h=createHarness();h.state.history.identity.groupNumber=5;expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('wrong winner fails',()=>{const h=createHarness();h.state.history.identity.winnerDistressLeadId='wrong';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('wrong target fails',()=>{const h=createHarness();h.state.history.identity.targetDeleteDistressLeadId='wrong';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('prepared event SHA drift fails',()=>{const h=createHarness();h.state.history.events[0].manifest.eventSha256='bad';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('prepared payload SHA drift fails',()=>{const h=createHarness();h.state.history.events[0].manifest.payloadSha256='bad';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('barrier event SHA drift fails',()=>{const h=createHarness();h.state.history.events[1].manifest.eventSha256='bad';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('barrier payload SHA drift fails',()=>{const h=createHarness();h.state.history.events[1].manifest.payloadSha256='bad';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('previous-event SHA drift fails',()=>{const h=createHarness();h.state.history.events[1].manifest.previousEventSha256='bad';expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('unexpected third event fails',()=>{const h=createHarness();const e=event3();e.manifest.eventType='RECONCILIATION_NOTE';e.payload.eventType='RECONCILIATION_NOTE';h.state.history.events.push(e);expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('unrelated target-bound operation fails',()=>{const h=createHarness();h.state.extraHistories['00000000-0000-0000-0000-000000000001']={found:true,events:[{manifest:{targetDeleteDistressLeadId:TARGET}}]};expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('winner missing fails',()=>{const h=createHarness({rows:[]});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('duplicate winner fails',()=>{const row={_rowNumber:771,'Distress Lead ID':WIN,Source:'PA-PHILADELPHIA','Source Dataset':'code_violations','Violation Number':'VI-2026-045398','Canonical Property Key':CPK,_derivedCanonicalPropertyKey:CPK};const h=createHarness({rows:[row,Object.assign({},row,{_rowNumber:772})]});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('target present fails',()=>{const h=createHarness();h.state.rows.push({_rowNumber:772,'Distress Lead ID':TARGET});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('downstream reference drift fails',()=>{const h=createHarness({refMatchCount:1});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('scheduler thaw fails',()=>{const h=createHarness({schedulerFrozen:false});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('checkpoint drift fails',()=>{const h=createHarness({checkpointCursor:'bad'});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutEvidence.status());});
test('stale authority generation fails',()=>{const h=createHarness({maintenanceAuthorityGeneration:'STALE'});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));});
test('missing maintenance readiness fails',()=>{const h=createHarness({maintenanceReady:false});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));});
test('wrong maintenance gate fails',()=>{const h=createHarness({maintenanceGateReturned:'wrong'});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));});
test('wrong maintenance lease fails',()=>{const h=createHarness({maintenanceLeaseReturned:'wrong'});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));});
test('wrong maintenance token fails',()=>{const h=createHarness();expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request({maintenanceToken:'wrong'})));});
test('no physical-delete primitive is called',()=>{const h=createHarness();h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(h.state.deleteCalls,0);});
test('executor is never invoked',()=>{const h=createHarness();h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(h.state.executorCalls,0);});
test('exact post-delete event appends once',()=>{const h=createHarness();h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(h.state.appendTypes.filter(x=>x==='POSTDELETE_VERIFIED').length,1);});
test('post-delete readback failure fails closed',()=>{const h=createHarness();h.state.appendReadback.POSTDELETE_VERIFIED=false;expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));});
test('exact three-event resume state is accepted',()=>{const h=createHarness();seed3(h);const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.startedFromPhase,'POSTDELETE_VERIFIED_RESUME');assert.equal(out.postdeleteEventAppended,false);});
test('duplicate post-delete append is forbidden',()=>{const h=createHarness();seed3(h);h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(h.state.appendTypes.filter(x=>x==='POSTDELETE_VERIFIED').length,0);});
test('terminal append occurs only after post-delete evidence',()=>{const h=createHarness();h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.deepEqual(h.state.appendTypes,['POSTDELETE_VERIFIED','COLLAPSE_DELETE_VERIFIED']);});
test('terminal readback failure fails closed',()=>{const h=createHarness();h.state.appendReadback.COLLAPSE_DELETE_VERIFIED=false;expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));});
test('verified-success recovery is required after terminal',()=>{const h=createHarness({finalRecoveryOverride:'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL'});expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));});
test('second verified terminal is forbidden',()=>{const h=createHarness();seed4(h);expectThrow(()=>h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request()));assert.equal(h.state.appendTypes.length,0);});
test('row recreation remains forbidden',()=>{const h=createHarness();const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.rowRecreationExecuted,false);});
test('automatic retry remains false',()=>{const h=createHarness();const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.automaticRetryPermitted,false);});
test('automatic maintenance close remains false',()=>{const h=createHarness();const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.automaticMaintenanceCloseExecuted,false);});
test('no scheduler restoration occurs',()=>{const h=createHarness();const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.schedulerRestorationExecuted,false);assert.equal(h.state.schedulerMutationCalls,0);});
test('no checkpoint mutation occurs',()=>{const h=createHarness();const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.checkpointMutationExecuted,false);assert.equal(h.state.checkpointMutationCalls,0);});
test('no automatic MAO authority is granted',()=>{const h=createHarness();const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.automaticMaoAuthorityGranted,false);});
test('no automatic offer authority is granted',()=>{const h=createHarness();const out=h.ctx.REOS.CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.reconcile(request());assert.equal(out.automaticOfferAuthorityGranted,false);});


assert.equal(count, 40);
console.log('GROUP4_TERMINAL_RECONCILIATION_BEHAVIOR_CASES=' + count);
console.log('PASS: exact four-file implementation scope.');
console.log('PASS: protected runtime files remain unchanged.');
console.log('PASS: read-only evidence module cannot append journal events.');
console.log('PASS: reconciliation cannot invoke executor or physical-delete primitive.');
console.log('PASS: exact two-event and safe three-event resume paths are covered.');
console.log('PASS: fresh maintenance and ScriptLock are required before journal mutation.');
console.log('GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_IMPLEMENTATION_VALIDATION_PASSED=true');
console.log('PRODUCTION_REPAIR_EXECUTION_AUTHORIZED=false');
console.log('EXECUTOR_RETRY_AUTHORIZED=false');
console.log('PHYSICAL_DELETE_AUTHORIZED=false');
console.log('ROW_RECREATION_AUTHORIZED=false');
console.log('DEPLOYMENT_AUTHORIZED=false');
console.log('RPC_EXECUTION_AUTHORIZED=false');
