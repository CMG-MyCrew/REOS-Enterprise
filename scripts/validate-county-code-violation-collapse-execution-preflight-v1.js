'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const path = require('path');
const source = fs.readFileSync(path.resolve(__dirname,
  '../build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js'), 'utf8');
assert.strictEqual(crypto.createHash('sha256').update(source).digest('hex'),
  '49cd64a7a32f2734a5d02e467bf751593247435409f8340fe243b9591ceffd3f');
// Supplemental lexical checks; not a general side-effect proof.
for (const re of [
  /\.\s*(?:setValues?|setFormulas?|appendRow|deleteRows?|insertRows?\w*|clear\w*)\s*\(/,
  /Database\s*\.\s*(?:insert|update|upsert|softDelete|delete|remove|ensureTable)\s*\(/,
  /\.\s*(?:newTrigger|deleteTrigger|setCheckpoint|saveCheckpoint|resetCheckpoint)\s*\(/,
  /\.\s*(?:setProperty|setProperties|deleteProperty|deleteAllProperties)\s*\(/
]) assert.ok(!re.test(source), 'Forbidden surface: ' + re);
const flags = [
  'winnerSelectionAuthorityGranted', 'collapseAuthorityGranted',
  'deleteAuthorityGranted', 'productionDataMutationAuthorityGranted',
  'repairAuthorityGranted', 'migrationAuthorityGranted',
  'connectorExecutionAuthorityGranted', 'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted', 'automaticOfferAuthorityGranted'
];
const copy = x => JSON.parse(JSON.stringify(x));
let tests = 0;
function fixture() {
  const plan = {
    ok: true, mode: 'READ_ONLY_CODE_VIOLATION_COLLAPSE_WINNER_PLAN',
    authoritySha256: '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee',
    planFingerprintSha256: '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9',
    eligibleGroupCount: 20, eligibleRowCount: 42, directKeepGroupCount: 14,
    observationMergeGroupCount: 6, deleteCandidateRowCount: 22, blockedGroupCount: 2,
    plans: Array.from({length: 22}, (_, i) => ({groupNumber: i + 1}))
      .filter(x => ![1, 3].includes(x.groupNumber)),
    blockedGroups: [{groupNumber: 1}, {groupNumber: 3}]
  };
  flags.forEach(k => { plan[k] = false; });
  const checkpoint = {
    id: 'COUNTY-20260902222607805', nextFeedIndex: 0,
    currentFeedCursor: 'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281',
    completedFeeds: 0, totalFeeds: 4, results: []
  };
  const calls = [];
  const context = {REOS: {
    Security: {requireAdmin() { calls.push('admin'); }},
    Database: {deletePhysicalRowExact() {
      calls.push('physical-delete');
      throw Error('PREFLIGHT_MUST_NOT_CALL_PHYSICAL_DELETE');
    }},
    CountyCodeViolationCollapseWinnerPlan: {buildPlan(o) {
      calls.push('plan'); assert.strictEqual(Object.keys(o).length, 0);
      return copy(plan);
    }},
    CountyProductionScheduler: {getCheckpoint() {
      calls.push('checkpoint'); return copy(checkpoint);
    }}
  }, ScriptApp: {getProjectTriggers() { calls.push('triggers'); return []; }}};
  vm.createContext(context);
  vm.runInContext(source, context, {timeout: 1000});
  return {context, plan, checkpoint, calls};
}
function run(f, options = {}) {
  f.context.options = options;
  return vm.runInContext('reosCountyCodeViolationCollapseExecutionPreflight(options)',
    f.context, {timeout: 1000});
}
function rejects(edit, pattern) {
  const f = fixture(); edit(f);
  assert.throws(() => run(f), pattern); tests++;
}
const f = fixture();
const before = JSON.stringify([f.plan, f.checkpoint]);
const r = run(f);
assert.strictEqual(r.ok, true);
assert.strictEqual(r.mode, 'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT');
for (const k of [...flags, 'executionAuthorityGranted',
  'collapseExecutionReady'])
  assert.strictEqual(r[k], false, k);
assert.strictEqual(
  r.physicalDeletePrimitiveAvailable,
  true,
  'physicalDeletePrimitiveAvailable'
);
assert.strictEqual(JSON.stringify(r.executionBlockers),
  '["CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE"]');
for (const k of ['schedulerFrozen', 'checkpointFrozen', 'winnerPlanCertified'])
  assert.strictEqual(r[k], true);
assert.strictEqual(JSON.stringify(r.checkpointBefore), JSON.stringify(r.checkpointAfter));
assert.strictEqual(JSON.stringify(r.schedulerBefore), JSON.stringify(r.schedulerAfter));
assert.strictEqual(JSON.stringify([f.plan, f.checkpoint]), before);
assert.deepStrictEqual(f.calls,
  ['admin', 'triggers', 'checkpoint', 'plan', 'checkpoint', 'triggers']);
assert.ok(Object.isFrozen(r)); tests++;
const opt = fixture();
assert.throws(() => run(opt, {execute: true}), /Caller-defined/);
assert.deepStrictEqual(opt.calls, ['admin']); tests++;
rejects(f => { f.context.REOS.Security.requireAdmin = () => {
  throw Error('DENIED');
}; }, /DENIED/);
for (const [key, method, pattern] of [
  ['Security', 'requireAdmin', /requires Admin/],
  ['Database', 'deletePhysicalRowExact', /physical-row delete primitive is required/],
  ['CountyCodeViolationCollapseWinnerPlan', 'buildPlan', /winner plan is required/],
  ['CountyProductionScheduler', 'getCheckpoint', /checkpoint read authority/]
]) {
  rejects(f => { delete f.context.REOS[key]; }, pattern);
  rejects(f => { f.context.REOS[key][method] = null; }, pattern);
}
rejects(f => { delete f.context.ScriptApp; }, /Installable-trigger/);
rejects(f => { delete f.context.ScriptApp.getProjectTriggers; }, /Installable-trigger/);
for (const [key, value, pattern] of [
  ['ok', false, /ok=true/], ['mode', 'DRIFT', /mode changed/],
  ['authoritySha256', 'DRIFT', /authority SHA changed/],
  ['planFingerprintSha256', 'DRIFT', /fingerprint changed/]
]) rejects(f => { f.plan[key] = value; }, pattern);
for (const key of ['eligibleGroupCount', 'eligibleRowCount', 'directKeepGroupCount',
  'observationMergeGroupCount', 'deleteCandidateRowCount', 'blockedGroupCount'])
  rejects(f => { f.plan[key]++; }, /population changed/);
for (const key of flags) for (const value of [true, undefined])
  rejects(f => { f.plan[key] = value; }, /unexpectedly grants authority/);
rejects(f => { f.plan.plans.pop(); }, /eligible-group array changed/);
rejects(f => { f.plan.blockedGroups.pop(); }, /blocked-group array changed/);
rejects(f => { f.plan.plans[0].groupNumber = 1; }, /Blocked collapse group entered/);
rejects(f => { f.plan.blockedGroups[0].groupNumber = 2; }, /Expected blocked/);
for (const key of ['id', 'nextFeedIndex', 'currentFeedCursor',
  'completedFeeds', 'totalFeeds', 'results'])
  rejects(f => { f.checkpoint[key] = key === 'results' ? [{}] : 'DRIFT'; },
    /Frozen county checkpoint/);
rejects(f => {
  const build = f.context.REOS.CountyCodeViolationCollapseWinnerPlan.buildPlan;
  f.context.REOS.CountyCodeViolationCollapseWinnerPlan.buildPlan = o => {
    const p = build(o); f.checkpoint.currentFeedCursor = 'DRIFT'; return p;
  };
}, /Frozen county checkpoint/);
for (const after of [false, true]) rejects(f => {
  let reads = 0;
  f.context.ScriptApp.getProjectTriggers = () =>
    (++reads === 1 && after) ? [] : [{
      getHandlerFunction() { return 'reosCountyProductionSchedulerRun'; }
    }];
}, /scheduler is not frozen/);
const wrapper = fixture(), args = [], sentinel = {};
wrapper.context.REOS.CountyCodeViolationCollapseExecutionPreflight = {
  preflight(o) { args.push(o); return sentinel; }
};
const supplied = {probe: true};
assert.strictEqual(run(wrapper, supplied), sentinel);
assert.strictEqual(args[0], supplied);
assert.strictEqual(run(wrapper, null), sentinel);
assert.strictEqual(Object.keys(args[1]).length, 0);
assert.deepStrictEqual(wrapper.calls, []); tests++;
console.log('SOURCE_SHA256_VERIFIED=true');
console.log('STATIC_READ_ONLY_CHECKS_PASSED=true');
console.log('OFFLINE_PREFLIGHT_CASES_PASSED=' + tests);
console.log('RPC_WRAPPER_DELEGATION_VERIFIED=true');
console.log('PREFLIGHT_VALIDATOR_PASSED=true');
console.log('LIVE_PRODUCTION_STATE_NOT_CHECKED=true');
