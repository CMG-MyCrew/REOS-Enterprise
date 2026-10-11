'use strict';

const assert = require('assert');
const path = require('path');

const root = path.resolve(__dirname, '..');

const {
  evaluateOfflineCompsReadiness,
  GATE_VERSION
} = require(
  path.join(
    root,
    'scripts/lib/offline-comps-readiness-evidence-gate-mapper-v1.js'
  )
);

const fixture = require(
  path.join(
    root,
    'scripts/fixtures/offline-comps-readiness-evidence-gate-mapper-v1.json'
  )
);

const context = fixture.context;

function selected(record) {
  return { outcome: 'selected', record };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function evaluate(arvReadResult, repairReadResult) {
  return evaluateOfflineCompsReadiness({
    ...context,
    arvReadResult,
    repairReadResult
  });
}

function assertBlocked(result) {
  assert.strictEqual(result.decision, 'blocked');
}

function assertNoAuthority(result) {
  assert.strictEqual(
    result.productionPersistenceAuthorityGranted,
    false
  );
  assert.strictEqual(
    result.productionComparableAcceptanceAuthorityGranted,
    false
  );
  assert.strictEqual(result.productionArvAuthorityGranted, false);
  assert.strictEqual(result.repairScopeAuthorityGranted, false);
  assert.strictEqual(result.qualifiedDealQueueAuthorityGranted, false);
  assert.strictEqual(result.acquisitionLifecycleAuthorityGranted, false);
  assert.strictEqual(result.maoAuthorityGranted, false);
  assert.strictEqual(result.offerGenerationAuthorityGranted, false);
  assert.strictEqual(result.offerSubmissionAuthorityGranted, false);
  assert.strictEqual(result.automaticOfferAuthorityGranted, false);
}

const valid = evaluate(
  selected(fixture.validArv),
  selected(fixture.validRepair)
);

assert.strictEqual(valid.decision, 'eligible');
assert.strictEqual(valid.compSupportedArvReady, true);
assert.strictEqual(valid.repairScopeReady, true);
assert.strictEqual(valid.arvEvidenceId, 'ARVE-SYNTH-001');
assert.strictEqual(valid.repairScopeEvidenceId, 'RSE-SYNTH-001');
assert.strictEqual(valid.evaluatedAt, context.asOf);
assert.strictEqual(valid.gateVersion, GATE_VERSION);
assert.deepStrictEqual(valid.reasonCodes, []);
assertNoAuthority(valid);

const arvBlocked = evaluate(
  { outcome: 'not_found' },
  selected(fixture.validRepair)
);

assertBlocked(arvBlocked);
assert.strictEqual(arvBlocked.compSupportedArvReady, false);
assert.strictEqual(arvBlocked.repairScopeReady, true);
assert(
  arvBlocked.reasonCodes.includes('ARV_EVIDENCE_NOT_FOUND')
);
assertNoAuthority(arvBlocked);

const repairBlocked = evaluate(
  selected(fixture.validArv),
  { outcome: 'not_found' }
);

assertBlocked(repairBlocked);
assert.strictEqual(repairBlocked.compSupportedArvReady, true);
assert.strictEqual(repairBlocked.repairScopeReady, false);
assert(
  repairBlocked.reasonCodes.includes('REPAIR_EVIDENCE_NOT_FOUND')
);
assertNoAuthority(repairBlocked);

const bothBlocked = evaluate(
  { outcome: 'not_found' },
  { outcome: 'not_found' }
);

assertBlocked(bothBlocked);
assert.strictEqual(bothBlocked.compSupportedArvReady, false);
assert.strictEqual(bothBlocked.repairScopeReady, false);
assertNoAuthority(bothBlocked);

const arvOutcomeReasons = {
  not_found: 'ARV_EVIDENCE_NOT_FOUND',
  stale: 'ARV_EVIDENCE_STALE',
  identity_mismatch: 'ARV_IDENTITY_MISMATCH',
  contradictory: 'ARV_EVIDENCE_CONTRADICTORY',
  unsupported_version: 'ARV_UNSUPPORTED_VERSION',
  malformed: 'ARV_EVIDENCE_MALFORMED'
};

for (const [outcome, reason] of Object.entries(arvOutcomeReasons)) {
  const result = evaluate(
    { outcome },
    selected(fixture.validRepair)
  );

  assertBlocked(result);
  assert.strictEqual(result.compSupportedArvReady, false);
  assert(result.reasonCodes.includes(reason));
  assertNoAuthority(result);
}

const repairOutcomeReasons = {
  not_found: 'REPAIR_EVIDENCE_NOT_FOUND',
  stale: 'REPAIR_EVIDENCE_STALE',
  identity_mismatch: 'REPAIR_IDENTITY_MISMATCH',
  contradictory: 'REPAIR_EVIDENCE_CONTRADICTORY',
  unsupported_version: 'REPAIR_UNSUPPORTED_VERSION',
  malformed: 'REPAIR_EVIDENCE_MALFORMED'
};

for (const [outcome, reason] of Object.entries(repairOutcomeReasons)) {
  const result = evaluate(
    selected(fixture.validArv),
    { outcome }
  );

  assertBlocked(result);
  assert.strictEqual(result.repairScopeReady, false);
  assert(result.reasonCodes.includes(reason));
  assertNoAuthority(result);
}

const insufficientComps = clone(fixture.validArv);
insufficientComps.acceptedComparableCount = 2;

let result = evaluate(
  selected(insufficientComps),
  selected(fixture.validRepair)
);

assertBlocked(result);
assert.strictEqual(result.compSupportedArvReady, false);
assert(
  result.reasonCodes.includes(
    'ARV_COMPARABLE_COUNT_INSUFFICIENT'
  )
);

const missingComparableIds = clone(fixture.validArv);
missingComparableIds.acceptedComparableEvidenceIds = [];

result = evaluate(
  selected(missingComparableIds),
  selected(fixture.validRepair)
);

assertBlocked(result);
assert(
  result.reasonCodes.includes(
    'ARV_COMPARABLE_EVIDENCE_MISSING'
  )
);

const arvReview = clone(fixture.validArv);
arvReview.reviewRequired = true;

result = evaluate(
  selected(arvReview),
  selected(fixture.validRepair)
);

assertBlocked(result);
assert(result.reasonCodes.includes('ARV_REVIEW_REQUIRED'));

const repairReview = clone(fixture.validRepair);
repairReview.reviewRequired = true;

result = evaluate(
  selected(fixture.validArv),
  selected(repairReview)
);

assertBlocked(result);
assert(
  result.reasonCodes.includes('REPAIR_REVIEW_REQUIRED')
);

const incompleteRepair = clone(fixture.validRepair);
incompleteRepair.scopeComplete = false;

result = evaluate(
  selected(fixture.validArv),
  selected(incompleteRepair)
);

assertBlocked(result);
assert(
  result.reasonCodes.includes('REPAIR_SCOPE_INCOMPLETE')
);

const invalidRepairCost = clone(fixture.validRepair);
invalidRepairCost.estimatedRepairCost = -1;

result = evaluate(
  selected(fixture.validArv),
  selected(invalidRepairCost)
);

assertBlocked(result);
assert(result.reasonCodes.includes('REPAIR_COST_INVALID'));

const crossDealRepair = clone(fixture.validRepair);
crossDealRepair.dealId = 'DL-SYNTH-OTHER';

result = evaluate(
  selected(fixture.validArv),
  selected(crossDealRepair)
);

assertBlocked(result);
assert(
  result.reasonCodes.includes('REPAIR_IDENTITY_MISMATCH')
);
assert(
  result.reasonCodes.includes(
    'CROSS_SURFACE_DEAL_ID_MISMATCH'
  )
);

const crossPropertyRepair = clone(fixture.validRepair);
crossPropertyRepair.canonicalPropertyKey =
  'property|parcel|pa|philadelphia|synthetic-other';

result = evaluate(
  selected(fixture.validArv),
  selected(crossPropertyRepair)
);

assertBlocked(result);
assert(
  result.reasonCodes.includes('REPAIR_IDENTITY_MISMATCH')
);
assert(
  result.reasonCodes.includes(
    'CROSS_SURFACE_PROPERTY_IDENTITY_MISMATCH'
  )
);

assert.throws(
  () =>
    evaluateOfflineCompsReadiness({
      dealId: context.dealId,
      canonicalPropertyKey: context.canonicalPropertyKey,
      arvReadResult: selected(fixture.validArv),
      repairReadResult: selected(fixture.validRepair)
    }),
  /explicit asOf is required/
);

console.log('OFFLINE_ELIGIBLE_PATH_CERTIFIED=true');
console.log('EXACT_FOUR_CASE_TRUTH_TABLE_CERTIFIED=true');
console.log('ALL_NON_SELECTED_ARV_OUTCOMES_BLOCK=true');
console.log('ALL_NON_SELECTED_REPAIR_OUTCOMES_BLOCK=true');
console.log('EXPLICIT_ASOF_REQUIRED=true');
console.log('ARV_IDENTITY_ENFORCED=true');
console.log('REPAIR_IDENTITY_ENFORCED=true');
console.log('CROSS_SURFACE_IDENTITY_ENFORCED=true');
console.log('INSUFFICIENT_COMPS_BLOCK=true');
console.log('MISSING_COMPARABLE_EVIDENCE_BLOCK=true');
console.log('ARV_REVIEW_REQUIRED_BLOCK=true');
console.log('REPAIR_REVIEW_REQUIRED_BLOCK=true');
console.log('INCOMPLETE_REPAIR_SCOPE_BLOCK=true');
console.log('INVALID_REPAIR_COST_BLOCK=true');
console.log('EXACT_EVIDENCE_REFERENCE_BINDING_CERTIFIED=true');
console.log('PRODUCTION_PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('PRODUCTION_ARV_AUTHORITY_GRANTED=false');
console.log('REPAIR_SCOPE_AUTHORITY_GRANTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_GENERATION_AUTHORITY_GRANTED=false');
console.log('OFFER_SUBMISSION_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
console.log(
  'OFFLINE_COMPS_READINESS_EVIDENCE_GATE_MAPPER_V1_VALID=true'
);
