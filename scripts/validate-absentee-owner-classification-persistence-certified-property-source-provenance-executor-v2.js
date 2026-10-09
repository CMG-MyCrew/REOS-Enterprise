#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE = '3f5c9fcc11861efd3f6f00c9b46c2d98f93025b9';

const runtimePath =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js';

const source =
  fs.readFileSync(
    path.join(ROOT, runtimePath),
    'utf8'
  );

function required(text) {
  assert.ok(
    source.includes(text),
    `required executor marker missing: ${text}`
  );
}

[
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2',
  'function execute(',
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2',
  '.prepare(',
  'withScriptLockContext',
  'assertScriptLockContext',
  'AbsenteeOwnerClassificationEvidenceStoreV2',
  '.persist(',
  'AbsenteeOwnerClassificationEvidenceStore',
  '.headers()',
  'AbsenteeOwnerClassificationPersistencePlanner',
  '.evidenceEventIdFor(',
  '.hashCanonicalObject(',
  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',
  'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED',
  'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED',
  'createTextFinder(',
  'matchEntireCell(',
  'findAll()',
  'writeAttempted',
  'classifierResultSha256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
].forEach(required);

[
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'ownerOccupancyAuthorityGranted',
  'vacancyAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerGenerationAuthorityGranted',
  'offerSubmissionAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.ok(
    new RegExp(
      field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '\\s*:\\s*false'
    ).test(source),
    `authority field must remain false: ${field}`
  );
});

[
  'UrlFetchApp',
  'getDataRange(',
  '.appendRow(',
  '.deleteRow(',
  '.deleteRows(',
  '.clear(',
  '.clearContent(',
  '.setProperty(',
  '.deleteProperty(',
  'DISTRESS_LEADS',
  'Qualified Deal Queue'
].forEach(forbidden => {
  assert.ok(
    !source.includes(forbidden),
    `forbidden executor surface present: ${forbidden}`
  );
});

assert.ok(
  !/function\s+reos[A-Z0-9_]/.test(source),
  'executor must not define a public top-level reos RPC'
);

assert.ok(
  /function\s+execute\s*\(\s*evidenceBundle\s*\)/m.test(source),
  'executor must accept one evidence bundle'
);

assert.ok(
  source.indexOf('.prepare(') <
  source.indexOf('.withScriptLockContext('),
  'V2 planner must execute before persistence lock acquisition'
);

assert.ok(
  source.indexOf('reconcileV1Equivalent_(') <
  source.lastIndexOf('.persist('),
  'V1 reconciliation must precede V2 store persistence'
);

const immutable = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js',
  'build/apps-script-brand/Database.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js'
];

function git(args) {
  return cp.spawnSync(
    'git',
    args,
    {
      cwd: ROOT,
      encoding: 'utf8'
    }
  );
}

immutable.forEach(file => {
  const expected = git([
    'rev-parse',
    `${BASE}:${file}`
  ]);

  assert.equal(
    expected.status,
    0,
    `unable to resolve immutable base blob: ${file}`
  );

  const actual = git([
    'hash-object',
    file
  ]);

  assert.equal(
    actual.status,
    0,
    `unable to hash immutable dependency: ${file}`
  );

  assert.equal(
    actual.stdout.trim(),
    expected.stdout.trim(),
    `immutable dependency changed: ${file}`
  );
});

if (
  process.argv.includes(
    '--successor-immutability'
  )
) {
  const diff = git([
    'diff',
    '--name-only',
    BASE,
    '--',
    ...immutable
  ]);

  assert.equal(
    diff.status,
    0,
    'unable to inspect immutable successor boundary'
  );

  assert.equal(
    diff.stdout.trim(),
    '',
    'successor implementation modified an immutable dependency'
  );

  console.log(
    'ABSENTEE_OWNER_V2_EXECUTOR_SUCCESSOR_IMMUTABILITY_VALIDATION_PASS=true'
  );
} else {
  console.log(
    'ABSENTEE_OWNER_V2_EXECUTOR_STATIC_VALIDATION_PASS=true'
  );
}
