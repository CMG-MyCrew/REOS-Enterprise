'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const LIB_PATH = path.join(
  ROOT,
  'scripts/lib/offline-comps-readiness-evidence-persistence-model-v1.js'
);

const FIXTURE_PATH = path.join(
  ROOT,
  'scripts/fixtures/offline-comps-readiness-evidence-persistence-model-v1.json'
);

const DOC_PATH = path.join(
  ROOT,
  'docs/offline-comps-readiness-evidence-persistence-model-v1.md'
);

const source = fs.readFileSync(LIB_PATH, 'utf8');
const doc = fs.readFileSync(DOC_PATH, 'utf8');
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

const {
  ARV_FIELDS,
  REPAIR_FIELDS,
  READINESS_FIELDS,
  createOfflinePersistenceModel
} = require(LIB_PATH);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function status(result, expected) {
  assert.strictEqual(result.status, expected);
}

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'DriveApp',
  'DocumentApp',
  'PropertiesService',
  'Jdbc',
  'advanceStage',
  'calculateMAO',
  'generateOffer',
  'submitOffer'
].forEach(function (token) {
  assert.strictEqual(
    source.includes(token),
    false,
    'Forbidden offline-model token: ' + token
  );
});

assert.ok(doc.includes('Evidence history is append-only.'));
assert.ok(doc.includes('idempotent_existing'));
assert.ok(doc.includes('rejected_idempotency_conflict'));
assert.ok(doc.includes('explicit `asOf`'));
assert.ok(doc.includes('contradictory'));
assert.ok(doc.includes('unsupported_version'));

assert.deepStrictEqual(Object.keys(fixture.arv), ARV_FIELDS);
assert.deepStrictEqual(Object.keys(fixture.repair), REPAIR_FIELDS);
assert.deepStrictEqual(Object.keys(fixture.readiness), READINESS_FIELDS);

const model = createOfflinePersistenceModel();

status(model.appendDealArvEvidence(fixture.arv), 'appended');
status(model.appendDealRepairScopeEvidence(fixture.repair), 'appended');
status(
  model.appendDealOfferReadinessEvidence(fixture.readiness),
  'appended'
);

let snapshot = model.snapshot();

assert.strictEqual(snapshot.arv.length, 1);
assert.strictEqual(snapshot.repair.length, 1);
assert.strictEqual(snapshot.readiness.length, 1);

assert.strictEqual(Object.isFrozen(snapshot.arv[0]), true);
assert.strictEqual(Object.isFrozen(snapshot.repair[0]), true);
assert.strictEqual(Object.isFrozen(snapshot.readiness[0]), true);

status(
  model.appendDealArvEvidence(clone(fixture.arv)),
  'idempotent_existing'
);

assert.strictEqual(model.snapshot().arv.length, 1);

const idemConflict = clone(fixture.arv);
idemConflict['ARV Evidence ID'] = 'ARVE-IDEM-CONFLICT';
idemConflict['Estimated ARV'] = 999999;

status(
  model.appendDealArvEvidence(idemConflict),
  'rejected_idempotency_conflict'
);

assert.strictEqual(model.snapshot().arv.length, 1);

const successor = clone(fixture.arv);
successor['ARV Evidence ID'] = 'ARVE-SYNTH-002';
successor['Estimated ARV'] = 255000;
successor['Supported Low Value'] = 240000;
successor['Supported High Value'] = 270000;
successor['Evidence Generated At'] = '2026-10-03T11:00:00.000Z';
successor['Persisted At'] = '2026-10-03T11:01:00.000Z';
successor['Idempotency Key'] = 'idem-arv-synth-002';
successor['Supersedes Evidence ID'] = 'ARVE-SYNTH-001';

status(
  model.appendDealArvEvidence(successor),
  'appended'
);

snapshot = model.snapshot();

assert.strictEqual(snapshot.arv.length, 2);
assert.strictEqual(
  snapshot.arv[0]['ARV Evidence ID'],
  'ARVE-SYNTH-001'
);
assert.strictEqual(
  snapshot.arv[1]['ARV Evidence ID'],
  'ARVE-SYNTH-002'
);

status(
  model.getDealArvEvidenceById('ARVE-SYNTH-001'),
  'selected'
);

const historical = model.getCurrentDealArvEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  '2026-10-03T10:30:00.000Z'
);

status(historical, 'selected');
assert.strictEqual(
  historical.record['ARV Evidence ID'],
  'ARVE-SYNTH-001'
);

const current = model.getCurrentDealArvEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  fixture.asOf
);

status(current, 'selected');
assert.strictEqual(
  current.record['ARV Evidence ID'],
  'ARVE-SYNTH-002'
);

status(
  model.getCurrentDealArvEvidence(
    'DEAL-NOT-PRESENT',
    fixture.canonicalPropertyKey,
    fixture.asOf
  ),
  'not_found'
);

status(
  model.getCurrentDealArvEvidence(
    fixture.dealId,
    'property|wrong',
    fixture.asOf
  ),
  'identity_mismatch'
);

status(
  model.getCurrentDealArvEvidence(
    fixture.dealId,
    fixture.canonicalPropertyKey,
    ''
  ),
  'malformed'
);

const futureModel = createOfflinePersistenceModel();
const future = clone(fixture.arv);

future['Evidence Generated At'] = '2026-10-04T10:00:00.000Z';
future['Persisted At'] = '2026-10-04T10:01:00.000Z';

status(
  futureModel.appendDealArvEvidence(future),
  'appended'
);

status(
  futureModel.getCurrentDealArvEvidence(
    fixture.dealId,
    fixture.canonicalPropertyKey,
    fixture.asOf
  ),
  'not_found'
);

const contradictionModel = createOfflinePersistenceModel();

const readinessA = clone(fixture.readiness);
readinessA['Readiness Evidence ID'] = 'ORE-CONTRADICT-A';
readinessA['Idempotency Key'] = 'idem-contradict-a';

const readinessB = clone(fixture.readiness);
readinessB['Readiness Evidence ID'] = 'ORE-CONTRADICT-B';
readinessB['Decision'] = 'blocked';
readinessB['Comp Supported ARV Ready'] = false;
readinessB['Reason Codes JSON'] = '["SYNTHETIC_BLOCKED"]';
readinessB['Idempotency Key'] = 'idem-contradict-b';

status(
  contradictionModel.appendDealOfferReadinessEvidence(readinessA),
  'appended'
);

status(
  contradictionModel.appendDealOfferReadinessEvidence(readinessB),
  'appended'
);

const contradictory =
  contradictionModel.getCurrentDealOfferReadinessEvidence(
    fixture.dealId,
    fixture.canonicalPropertyKey,
    fixture.asOf
  );

status(contradictory, 'contradictory');
assert.strictEqual(contradictory.record, null);
assert.strictEqual(
  contradictory.candidateEvidenceIds.length,
  2
);

const unsupported = clone(fixture.arv);

unsupported['Schema Version'] = '999';
unsupported['ARV Evidence ID'] = 'ARVE-UNSUPPORTED';
unsupported['Idempotency Key'] = 'idem-unsupported';

status(
  createOfflinePersistenceModel()
    .appendDealArvEvidence(unsupported),
  'unsupported_version'
);

const missingDeal = clone(fixture.repair);

missingDeal['Repair Scope Evidence ID'] = 'RSE-MISSING-DEAL';
missingDeal['Deal ID'] = '';
missingDeal['Idempotency Key'] = 'idem-missing-deal';

status(
  createOfflinePersistenceModel()
    .appendDealRepairScopeEvidence(missingDeal),
  'rejected_identity'
);

const missingProperty = clone(fixture.readiness);

missingProperty['Readiness Evidence ID'] = 'ORE-MISSING-PROPERTY';
missingProperty['Canonical Property Key'] = '';
missingProperty['Idempotency Key'] = 'idem-missing-property';

status(
  createOfflinePersistenceModel()
    .appendDealOfferReadinessEvidence(missingProperty),
  'rejected_identity'
);

const mismatchModel = createOfflinePersistenceModel();

status(
  mismatchModel.appendDealArvEvidence(fixture.arv),
  'appended'
);

const badSuccessor = clone(fixture.arv);

badSuccessor['ARV Evidence ID'] = 'ARVE-BAD-SUCCESSOR';
badSuccessor['Deal ID'] = 'DEAL-OTHER';
badSuccessor['Idempotency Key'] = 'idem-bad-successor';
badSuccessor['Supersedes Evidence ID'] = 'ARVE-SYNTH-001';

status(
  mismatchModel.appendDealArvEvidence(badSuccessor),
  'rejected_identity'
);

assert.strictEqual(
  mismatchModel.snapshot().arv.length,
  1
);

const malformed = clone(fixture.arv);
delete malformed['Estimated ARV'];

status(
  createOfflinePersistenceModel()
    .appendDealArvEvidence(malformed),
  'rejected_validation'
);

const eligible =
  model.getDealOfferReadinessEvidenceById('ORE-SYNTH-001');

status(eligible, 'selected');
assert.strictEqual(
  eligible.record['Decision'],
  'eligible'
);

/*
 * Deliberately no workflow action follows the eligible synthetic record.
 * Eligibility is durable evidence only.
 */

console.log(
  'OFFLINE_COMPS_READINESS_EVIDENCE_PERSISTENCE_MODEL_V1_VALIDATION_PASSED=true'
);
console.log('SYNTHETIC_FIXTURES_ONLY=true');
console.log('ARV_SCHEMA_FIELD_COUNT=' + ARV_FIELDS.length);
console.log('REPAIR_SCHEMA_FIELD_COUNT=' + REPAIR_FIELDS.length);
console.log('READINESS_SCHEMA_FIELD_COUNT=' + READINESS_FIELDS.length);
console.log('IMMUTABLE_EVIDENCE_RECORDS_VALIDATED=true');
console.log('APPEND_ONLY_HISTORY_VALIDATED=true');
console.log('IDEMPOTENT_RETRY_VALIDATED=true');
console.log('IDEMPOTENCY_CONFLICT_REJECTION_VALIDATED=true');
console.log('SUPERSESSION_VALIDATED=true');
console.log('SUPERSEDED_HISTORY_REMAINS_READABLE=true');
console.log('EXPLICIT_ASOF_SELECTION_VALIDATED=true');
console.log('FUTURE_EVIDENCE_EXCLUSION_VALIDATED=true');
console.log('DEAL_IDENTITY_ENFORCEMENT_VALIDATED=true');
console.log('CANONICAL_PROPERTY_IDENTITY_ENFORCEMENT_VALIDATED=true');
console.log(
  'CONTRADICTORY_CURRENT_EVIDENCE_FAIL_CLOSED_VALIDATED=true'
);
console.log('UNSUPPORTED_VERSION_REJECTION_VALIDATED=true');
console.log('MALFORMED_EVIDENCE_REJECTION_VALIDATED=true');
console.log('LEGACY_SCALAR_INFERENCE_IMPLEMENTED=false');
console.log('EVIDENCE_MANUFACTURING_IMPLEMENTED=false');
console.log('PRODUCTION_IO_IMPLEMENTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_AUTHORITY_GRANTED=false');
