'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const modulePath = path.join(
  root,
  'build/apps-script-brand/CompsReadinessEvidencePersistence.js'
);

const fixturePath = path.join(
  root,
  'scripts/fixtures/production-comps-readiness-evidence-persistence-module-v1.json'
);

const persistence = require(modulePath);
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fakeStorage(seed) {
  const tables = clone(seed || {});

  return {
    tables,

    readAll(table) {
      return clone(tables[table] || []);
    },

    append(table, record) {
      if (!tables[table]) tables[table] = [];
      tables[table].push(clone(record));
    }
  };
}

function assertAllAuthorityFalse() {
  [
    'productionPersistenceAuthorityGranted',
    'productionComparableAcceptanceAuthorityGranted',
    'productionArvAuthorityGranted',
    'repairScopeAuthorityGranted',
    'qualifiedDealQueueAuthorityGranted',
    'acquisitionLifecycleAuthorityGranted',
    'maoAuthorityGranted',
    'offerGenerationAuthorityGranted',
    'offerSubmissionAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach((key) => {
    assert.strictEqual(persistence[key], false, key);
  });
}

assert.strictEqual(persistence.schemaVersion, 'v1');

assert.deepStrictEqual(
  persistence.tables,
  {
    arv: 'DEAL_ARV_EVIDENCE',
    repair: 'DEAL_REPAIR_SCOPE_EVIDENCE',
    readiness: 'DEAL_OFFER_READINESS_EVIDENCE'
  }
);

assert.strictEqual(persistence.arvFields.length, 23);
assert.strictEqual(persistence.repairFields.length, 17);
assert.strictEqual(persistence.readinessFields.length, 15);

assertAllAuthorityFalse();

const storage = fakeStorage();

let result = persistence.appendDealArvEvidence(
  fixture.arv,
  storage
);
assert.strictEqual(result.outcome, 'appended');

result = persistence.appendDealRepairScopeEvidence(
  fixture.repair,
  storage
);
assert.strictEqual(result.outcome, 'appended');

result = persistence.appendDealOfferReadinessEvidence(
  fixture.readiness,
  storage
);
assert.strictEqual(result.outcome, 'appended');

assert.strictEqual(
  storage.tables.DEAL_ARV_EVIDENCE.length,
  1
);
assert.strictEqual(
  storage.tables.DEAL_REPAIR_SCOPE_EVIDENCE.length,
  1
);
assert.strictEqual(
  storage.tables.DEAL_OFFER_READINESS_EVIDENCE.length,
  1
);

result = persistence.appendDealArvEvidence(
  fixture.arv,
  storage
);
assert.strictEqual(result.outcome, 'idempotent_existing');
assert.strictEqual(storage.tables.DEAL_ARV_EVIDENCE.length, 1);

const conflictingArv = clone(fixture.arv);
conflictingArv.estimatedArv = 999999;

result = persistence.appendDealArvEvidence(
  conflictingArv,
  storage
);
assert.strictEqual(
  result.outcome,
  'rejected_idempotency_conflict'
);
assert.strictEqual(storage.tables.DEAL_ARV_EVIDENCE.length, 1);

result = persistence.getCurrentDealArvEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  fixture.asOf,
  storage
);
assert.strictEqual(result.outcome, 'selected');
assert.strictEqual(
  result.record.arvEvidenceId,
  fixture.arv.arvEvidenceId
);

result = persistence.getCurrentDealRepairScopeEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  fixture.asOf,
  storage
);
assert.strictEqual(result.outcome, 'selected');
assert.strictEqual(
  result.record.repairScopeEvidenceId,
  fixture.repair.repairScopeEvidenceId
);

result = persistence.getCurrentDealOfferReadinessEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  fixture.asOf,
  storage
);
assert.strictEqual(result.outcome, 'selected');
assert.strictEqual(
  result.record.readinessEvidenceId,
  fixture.readiness.readinessEvidenceId
);

result = persistence.getCurrentDealArvEvidence(
  fixture.dealId,
  'property|parcel|pa|philadelphia|wrong',
  fixture.asOf,
  storage
);
assert.strictEqual(result.outcome, 'identity_mismatch');

result = persistence.getCurrentDealArvEvidence(
  'DL-NOT-FOUND',
  fixture.canonicalPropertyKey,
  fixture.asOf,
  storage
);
assert.strictEqual(result.outcome, 'not_found');

result = persistence.getCurrentDealArvEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  '',
  storage
);
assert.strictEqual(result.outcome, 'malformed');

const unsupportedStorage = fakeStorage({
  DEAL_ARV_EVIDENCE: [
    Object.assign({}, fixture.arv, {
      schemaVersion: 'v999'
    })
  ]
});

result = persistence.getCurrentDealArvEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  fixture.asOf,
  unsupportedStorage
);
assert.strictEqual(result.outcome, 'unsupported_version');

const contradictoryStorage = fakeStorage({
  DEAL_ARV_EVIDENCE: [
    fixture.arv,
    Object.assign({}, fixture.arv, {
      arvEvidenceId: 'ARVE-SYNTH-PERSIST-002',
      idempotencyKey: 'synthetic-arv-002'
    })
  ]
});

result = persistence.getCurrentDealArvEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  fixture.asOf,
  contradictoryStorage
);
assert.strictEqual(result.outcome, 'contradictory');

const superseding = Object.assign({}, fixture.arv, {
  arvEvidenceId: 'ARVE-SYNTH-PERSIST-002',
  estimatedArv: 255000,
  evidenceGeneratedAt: '2026-10-11T11:00:00.000Z',
  persistedAt: '2026-10-11T11:01:00.000Z',
  idempotencyKey: 'synthetic-arv-002',
  supersedesEvidenceId: fixture.arv.arvEvidenceId
});

const supersessionStorage = fakeStorage({
  DEAL_ARV_EVIDENCE: [fixture.arv]
});

result = persistence.appendDealArvEvidence(
  superseding,
  supersessionStorage
);
assert.strictEqual(result.outcome, 'appended');

result = persistence.getCurrentDealArvEvidence(
  fixture.dealId,
  fixture.canonicalPropertyKey,
  fixture.asOf,
  supersessionStorage
);
assert.strictEqual(result.outcome, 'selected');
assert.strictEqual(
  result.record.arvEvidenceId,
  superseding.arvEvidenceId
);

const identityMismatchSuperseding = Object.assign(
  {},
  superseding,
  {
    arvEvidenceId: 'ARVE-SYNTH-PERSIST-003',
    dealId: 'DL-OTHER',
    idempotencyKey: 'synthetic-arv-003'
  }
);

result = persistence.appendDealArvEvidence(
  identityMismatchSuperseding,
  supersessionStorage
);
assert.strictEqual(result.outcome, 'rejected_identity');

const malformedArv = clone(fixture.arv);
delete malformedArv.idempotencyKey;

result = persistence.appendDealArvEvidence(
  malformedArv,
  fakeStorage()
);
assert.strictEqual(result.outcome, 'rejected_validation');

result = persistence.appendDealArvEvidence(
  fixture.arv,
  null
);
assert.strictEqual(result.outcome, 'failed_persistence');

const throwingStorage = {
  readAll() {
    throw new Error('synthetic read failure');
  },
  append() {
    throw new Error('synthetic append failure');
  }
};

result = persistence.appendDealArvEvidence(
  fixture.arv,
  throwingStorage
);
assert.strictEqual(result.outcome, 'failed_persistence');

const appendThrowStorage = {
  readAll() {
    return [];
  },
  append() {
    throw new Error('synthetic append failure');
  }
};

result = persistence.appendDealArvEvidence(
  fixture.arv,
  appendThrowStorage
);
assert.strictEqual(result.outcome, 'failed_persistence');

const source = fs.readFileSync(modulePath, 'utf8');

assert.strictEqual(/\bSpreadsheetApp\b/.test(source), false);
assert.strictEqual(/\bUrlFetchApp\b/.test(source), false);
assert.strictEqual(/\bDriveApp\b/.test(source), false);
assert.strictEqual(/\bGmailApp\b/.test(source), false);
assert.strictEqual(/\bJdbc\b/.test(source), false);
assert.strictEqual(/\bScriptApp\b/.test(source), false);

assert.strictEqual(
  /function\s+appendDealArvEvidence\s*\(/.test(source),
  true
);
assert.strictEqual(
  /function\s+appendDealRepairScopeEvidence\s*\(/.test(source),
  true
);
assert.strictEqual(
  /function\s+appendDealOfferReadinessEvidence\s*\(/.test(source),
  true
);
assert.strictEqual(
  /function\s+getCurrentDealArvEvidence\s*\(/.test(source),
  true
);
assert.strictEqual(
  /function\s+getCurrentDealRepairScopeEvidence\s*\(/.test(source),
  true
);
assert.strictEqual(
  /function\s+getCurrentDealOfferReadinessEvidence\s*\(/.test(source),
  true
);

assert.strictEqual(Object.isFrozen(persistence), true);
assert.strictEqual(Object.isFrozen(persistence.tables), true);
assert.strictEqual(Object.isFrozen(persistence.appendOutcomes), true);
assert.strictEqual(Object.isFrozen(persistence.readOutcomes), true);

console.log('PRODUCTION_COMPS_READINESS_EVIDENCE_PERSISTENCE_MODULE_V1_VALID=true');
console.log('SYNTHETIC_FIXTURE_ONLY=true');
console.log('LIVE_GOOGLE_SHEETS_READ_EXECUTED=false');
console.log('LIVE_GOOGLE_SHEETS_WRITE_EXECUTED=false');
console.log('PRODUCTION_PERSISTENCE_EXECUTED=false');
console.log('PROVIDER_REQUEST_EXECUTED=false');
console.log('LIVE_COMPS_RETRIEVAL_EXECUTED=false');
console.log('PRODUCTION_ARV_CALCULATION_EXECUTED=false');
console.log('REPAIR_SCOPE_MUTATION_EXECUTED=false');
console.log('QUALIFIED_DEAL_QUEUE_MUTATED=false');
console.log('ACQUISITION_LIFECYCLE_MUTATED=false');
console.log('MAO_CALCULATION_EXECUTED=false');
console.log('OFFER_GENERATION_EXECUTED=false');
console.log('OFFER_SUBMISSION_EXECUTED=false');
console.log('ALL_PRODUCTION_AUTHORITY_FLAGS_FALSE=true');
