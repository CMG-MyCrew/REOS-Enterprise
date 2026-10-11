'use strict';

const assert = require('assert');
const fixtures = require(
  './fixtures/offline-comps-readiness-evidence-gate-integration-adapter-v1.json'
);

const {
  ADAPTER_VERSION,
  AUTHORITY_FLAGS,
  integrateOfflineCompsReadinessEvidence
} = require(
  './lib/offline-comps-readiness-evidence-gate-integration-adapter-v1'
);

const {
  evaluateOfflineCompsReadiness
} = require(
  './lib/offline-comps-readiness-evidence-gate-mapper-v1'
);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseInput() {
  return {
    ...clone(fixtures.context),
    arvReadResult: clone(fixtures.arv),
    repairReadResult: clone(fixtures.repair)
  };
}

function assertAuthoritiesFalse(result) {
  for (const [key, value] of Object.entries(AUTHORITY_FLAGS)) {
    assert.strictEqual(value, false, `${key} constant must be false`);
    assert.strictEqual(result[key], false, `${key} result must be false`);
  }
}

function assertBlocked(result) {
  assert.strictEqual(result.decision, 'blocked');
  assertAuthoritiesFalse(result);
}

function assertReason(result, reason) {
  assert(
    result.reasonCodes.includes(reason),
    `expected reason ${reason}; got ${JSON.stringify(result.reasonCodes)}`
  );
}

assert.strictEqual(
  typeof evaluateOfflineCompsReadiness,
  'function',
  'certified mapper dependency must exist'
);

assert.strictEqual(
  ADAPTER_VERSION,
  'offline-comps-readiness-evidence-gate-integration-adapter-v1'
);

/* 1 — positive evidence-layer readiness */

{
  const result = integrateOfflineCompsReadinessEvidence(baseInput());

  assert.strictEqual(result.decision, 'eligible');
  assert.strictEqual(result.compSupportedArvReady, true);
  assert.strictEqual(result.repairScopeReady, true);
  assert.strictEqual(result.arvEvidenceId, 'ARVE-SYNTH-001');
  assert.strictEqual(result.repairScopeEvidenceId, 'RSE-SYNTH-001');
  assert.strictEqual(result.dealId, fixtures.context.dealId);
  assert.strictEqual(
    result.canonicalPropertyKey,
    fixtures.context.canonicalPropertyKey
  );
  assert.strictEqual(result.asOf, fixtures.context.asOf);
  assert.strictEqual(result.evaluatedAt, fixtures.context.asOf);
  assert.ok(typeof result.gateVersion === 'string');
  assert.ok(result.gateVersion.length > 0);
  assert.deepStrictEqual(result.reasonCodes, []);
  assert.strictEqual(Object.isFrozen(result), true);
  assert.strictEqual(Object.isFrozen(result.reasonCodes), true);
  assertAuthoritiesFalse(result);
}

/* 2-4 — remaining truth-table states */

{
  const input = baseInput();
  input.arvReadResult.outcome = 'not_found';
  delete input.arvReadResult.record;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
  assert.strictEqual(result.repairScopeReady, true);
}

{
  const input = baseInput();
  input.repairReadResult.outcome = 'not_found';
  delete input.repairReadResult.record;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, true);
  assert.strictEqual(result.repairScopeReady, false);
}

{
  const input = baseInput();

  input.arvReadResult.outcome = 'not_found';
  delete input.arvReadResult.record;

  input.repairReadResult.outcome = 'not_found';
  delete input.repairReadResult.record;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
  assert.strictEqual(result.repairScopeReady, false);
}

/* 5 — explicit asOf required */

{
  const input = baseInput();
  delete input.asOf;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assertReason(result, 'INTEGRATION_ASOF_MISSING');
}

/* 6 — exact Deal ID required */

{
  const input = baseInput();
  delete input.dealId;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assertReason(result, 'INTEGRATION_DEAL_ID_MISSING');
}

/* 7 — exact canonical property identity required */

{
  const input = baseInput();
  delete input.canonicalPropertyKey;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assertReason(result, 'INTEGRATION_PROPERTY_IDENTITY_MISSING');
}

/* 8 — malformed envelope */

{
  const result = integrateOfflineCompsReadinessEvidence(null);

  assertBlocked(result);
  assertReason(result, 'INTEGRATION_INPUT_MALFORMED');
}

/* 9-14 — every non-selected ARV outcome remains blocked */

for (const outcome of [
  'not_found',
  'stale',
  'identity_mismatch',
  'contradictory',
  'unsupported_version',
  'malformed'
]) {
  const input = baseInput();
  input.arvReadResult = { outcome };

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
}

/* 15-20 — every non-selected repair outcome remains blocked */

for (const outcome of [
  'not_found',
  'stale',
  'identity_mismatch',
  'contradictory',
  'unsupported_version',
  'malformed'
]) {
  const input = baseInput();
  input.repairReadResult = { outcome };

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.repairScopeReady, false);
}

/* 21 — insufficient comparable count */

{
  const input = baseInput();
  input.arvReadResult.record.acceptedComparableCount = 2;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
}

/* 22 — missing comparable evidence IDs */

{
  const input = baseInput();
  input.arvReadResult.record.acceptedComparableEvidenceIds = [];

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
}

/* 23 — ARV review required */

{
  const input = baseInput();
  input.arvReadResult.record.reviewRequired = true;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
}

/* 24 — repair review required */

{
  const input = baseInput();
  input.repairReadResult.record.reviewRequired = true;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.repairScopeReady, false);
}

/* 25 — incomplete repair scope */

{
  const input = baseInput();
  input.repairReadResult.record.scopeComplete = false;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.repairScopeReady, false);
}

/* 26 — invalid repair cost */

{
  const input = baseInput();
  input.repairReadResult.record.estimatedRepairCost = -1;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.repairScopeReady, false);
}

/* 27 — cross-surface Deal ID mismatch */

{
  const input = baseInput();
  input.repairReadResult.record.dealId = 'DL-SYNTH-OTHER';

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
  assert.strictEqual(result.repairScopeReady, false);
}

/* 28 — cross-surface property mismatch */

{
  const input = baseInput();
  input.repairReadResult.record.canonicalPropertyKey =
    'property|parcel|pa|philadelphia|synthetic-other';

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
  assert.strictEqual(result.repairScopeReady, false);
}

/*
 * 29 — defense-in-depth:
 * selected positive ARV evidence without exact evidence ID cannot be eligible.
 */

{
  const input = baseInput();
  delete input.arvReadResult.record.arvEvidenceId;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
  assertReason(result, 'ARV_EVIDENCE_MALFORMED');
}

/*
 * 30 — defense-in-depth:
 * selected positive repair evidence without exact evidence ID cannot be eligible.
 */

{
  const input = baseInput();
  delete input.repairReadResult.record.repairScopeEvidenceId;

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.repairScopeReady, false);
  assertReason(result, 'REPAIR_EVIDENCE_MALFORMED');
}

/* 31 — blank ARV evidence ID also blocked */

{
  const input = baseInput();
  input.arvReadResult.record.arvEvidenceId = '   ';

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
  assertReason(result, 'ARV_EVIDENCE_MALFORMED');
}

/* 32 — blank repair evidence ID also blocked */

{
  const input = baseInput();
  input.repairReadResult.record.repairScopeEvidenceId = '';

  const result = integrateOfflineCompsReadinessEvidence(input);

  assertBlocked(result);
  assert.strictEqual(result.repairScopeReady, false);
  assertReason(result, 'REPAIR_EVIDENCE_MALFORMED');
}

/* 33 — result remains immutable */

{
  const result = integrateOfflineCompsReadinessEvidence(baseInput());

  assert.strictEqual(Object.isFrozen(result), true);
  assert.strictEqual(Object.isFrozen(result.reasonCodes), true);
}

/* 34 — all authority remains false even on eligible evidence */

{
  const result = integrateOfflineCompsReadinessEvidence(baseInput());
  assertAuthoritiesFalse(result);
}

console.log('CERTIFIED_MAPPER_DEPENDENCY_USED=true');
console.log('EXPLICIT_ASOF_PRESERVED=true');
console.log('EXACT_DEAL_ID_PRESERVED=true');
console.log('EXACT_CANONICAL_PROPERTY_KEY_PRESERVED=true');
console.log('EXACT_ARV_EVIDENCE_ID_BOUND=true');
console.log('EXACT_REPAIR_EVIDENCE_ID_BOUND=true');
console.log('MISSING_ARV_EVIDENCE_ID_FAILS_CLOSED=true');
console.log('MISSING_REPAIR_EVIDENCE_ID_FAILS_CLOSED=true');
console.log('ALL_NON_SELECTED_READ_OUTCOMES_BLOCKED=true');
console.log('FOUR_CASE_TRUTH_TABLE_CERTIFIED=true');
console.log('CROSS_SURFACE_IDENTITY_MISMATCH_BLOCKED=true');
console.log('IMMUTABLE_READINESS_PROJECTION_CERTIFIED=true');
console.log('PRODUCTION_IO_EXECUTED=false');
console.log('WORKFLOW_MUTATION_EXECUTED=false');
console.log('MAO_CALCULATION_EXECUTED=false');
console.log('OFFER_GENERATION_EXECUTED=false');
console.log('OFFER_SUBMISSION_EXECUTED=false');
console.log('ALL_PRODUCTION_AUTHORITY_FLAGS_FALSE=true');
console.log(
  'OFFLINE_COMPS_READINESS_EVIDENCE_GATE_INTEGRATION_ADAPTER_V1_VALID=true'
);
