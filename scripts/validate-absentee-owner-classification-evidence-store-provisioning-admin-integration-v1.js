#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = {
  design: 'docs/absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.md',
  runtime: 'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  staticValidator: 'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  behaviorValidator: 'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  integrationValidator: 'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js',
  workflow: '.github/workflows/county-collapse-offline.yml',
  runtimeIntegration: 'scripts/validate-county-runtime-integration.js',
  ownerEvidenceIntegration: 'scripts/validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js',
  comparisonIntegration: 'scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js',
  classificationIntegration: 'scripts/validate-absentee-owner-classification-integration-v1.js',
  singleRecordIntegration: 'scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js'
};

Object.values(files).forEach(file => {
  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    'required integration file missing: ' + file
  );
});

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function count(text, marker) {
  return text.split(marker).length - 1;
}

const design = read(files.design);
const runtime = read(files.runtime);
const workflow = read(files.workflow);
const county = read(files.runtimeIntegration);
const ownerEvidence = read(files.ownerEvidenceIntegration);
const comparison = read(files.comparisonIntegration);
const classification = read(files.classificationIntegration);
const singleRecord = read(files.singleRecordIntegration);

assert.strictEqual(
  crypto.createHash('sha256').update(design, 'utf8').digest('hex'),
  '287041aeeae9636f5b66d45c1c4c90e96f596118697adc1dbc6024ab20ad176e',
  'merged provisioning design changed'
);

[
  'REOS.Security.requireAdmin()',
  'LockService.getScriptLock',
  'SpreadsheetApp.create',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED',
  'persistenceAuthorized: false',
  'boundedRolloutAuthorized: false',
  'automaticOfferAuthorityGranted: false'
].forEach(marker => {
  assert.ok(runtime.includes(marker), 'runtime integration marker missing: ' + marker);
});

const postStart = county.indexOf('const POST_COUNTY_PRODUCTION_FILES = [');
const postEnd = county.indexOf('];', postStart);
assert.ok(postStart >= 0 && postEnd > postStart);

const postBlock = county.slice(postStart, postEnd);
const postEntries = postBlock.match(/'build\/apps-script-brand\/[^']+\.js'/g) || [];

assert.strictEqual(
  postEntries.length,
  48,
  'post-county production inventory must contain exactly 48 files'
);
assert.strictEqual(
  count(county, "'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js'"),
  1,
  'provisioning runtime must occur exactly once in post-county production inventory'
);

const componentStart = county.indexOf('const COMPONENT_VALIDATORS = [');
const componentEnd = county.indexOf('];', componentStart);
assert.ok(componentStart >= 0 && componentEnd > componentStart);

const componentBlock = county.slice(componentStart, componentEnd);
const componentEntries = componentBlock.match(/'validate-[^']+\.js'/g) || [];

assert.strictEqual(
  componentEntries.length,
  76,
  'component validator inventory must contain exactly 76 validators'
);

[
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js'
].forEach(file => {
  assert.strictEqual(
    count(componentBlock, "'" + file + "'"),
    1,
    'provisioning component validator registration must occur exactly once: ' + file
  );
});

assert.strictEqual(
  componentBlock.includes(
    'validate-absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.js'
  ),
  false,
  'design validator must remain workflow-only'
);
assert.strictEqual(
  componentBlock.includes(
    'validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js'
  ),
  false,
  'integration validator must remain workflow-only'
);

[
  ownerEvidence,
  comparison,
  classification,
  singleRecord
].forEach(text => {
  assert.ok(
    /componentEntries\.length,\s*76,/s.test(text),
    'count-coupled integration validator was not reconciled to 76'
  );
  assert.ok(
    text.includes('COMPONENT_VALIDATOR_COUNT=76'),
    'count-coupled integration summary was not reconciled to 76'
  );
  assert.strictEqual(
    text.includes('COMPONENT_VALIDATOR_COUNT=74'),
    false,
    'stale component-validator count 74 remains'
  );
});

[
  classification,
  singleRecord
].forEach(text => {
  assert.ok(
    /(?:postCountyEntries|postEntries)\.length,\s*48,/s.test(text),
    'post-county count-coupled validator was not reconciled to 48'
  );
  assert.ok(
    text.includes('POST_COUNTY_PRODUCTION_FILE_COUNT=48'),
    'post-county summary was not reconciled to 48'
  );
  assert.strictEqual(
    text.includes('POST_COUNTY_PRODUCTION_FILE_COUNT=47'),
    false,
    'stale post-county count 47 remains'
  );
});

assert.ok(
  county.includes('expected county runtime integration inventory must contain 104 files'),
  'historical county runtime inventory changed'
);
assert.ok(
  county.includes('county runtime remains exactly 104 additive files'),
  'historical county runtime summary changed'
);
assert.ok(
  county.includes('expected reconciled production inventory must contain 147 files'),
  'historical 147-file production inventory changed'
);

const syntaxMarkers = [
  'node --check build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js'
];

syntaxMarkers.forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur exactly once: ' + marker
  );
});

const steps = [
  [
    'Validate absentee-owner classification evidence-store provisioning admin surface design v1',
    'run: node scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.js'
  ],
  [
    'Validate absentee-owner classification evidence-store provisioning admin static v1',
    'run: node scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js'
  ],
  [
    'Validate absentee-owner classification evidence-store provisioning admin behavior v1',
    'run: node scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js'
  ],
  [
    'Validate absentee-owner classification evidence-store provisioning admin integration v1',
    'run: node scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js'
  ]
];

steps.forEach(([name, run]) => {
  assert.strictEqual(count(workflow, name), 1, 'workflow step must occur once: ' + name);
  assert.strictEqual(count(workflow, run), 1, 'workflow run command must occur once: ' + run);
});

[
  'UrlFetchApp',
  'DISTRESS_LEADS',
  'AbsenteeOwnerClassificationPersistenceExecutor',
  'AbsenteeOwnerClassificationBoundedRollout',
  'ScriptApp.newTrigger',
  'newTrigger('
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'prohibited integration authority marker present: ' + marker
  );
});

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_ADMIN_INTEGRATION_VALID=true'
);
console.log('RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true');
console.log('POST_COUNTY_PRODUCTION_FILE_COUNT=48');
console.log('COMPONENT_VALIDATOR_COUNT=76');
console.log('LIVE_COMPONENT_COUNT_RECONCILIATION_COUNT=4');
console.log('LIVE_POST_COUNTY_COUNT_RECONCILIATION_COUNT=2');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('HISTORICAL_COUNTY_RUNTIME_INVENTORY_104_PRESERVED=true');
console.log('HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true');
console.log('PRODUCTION_RPC_COUNT=2');
console.log('PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
