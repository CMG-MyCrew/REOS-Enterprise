#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = {
  design:
    'docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.md',

  freeze:
    'docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.md',

  runtime:
    'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',

  staticValidator:
    'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',

  behaviorValidator:
    'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',

  integrationValidator:
    'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js',

  provisionRuntime:
    'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',

  provisionIntegration:
    'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js',

  workflow:
    '.github/workflows/county-collapse-offline.yml',

  county:
    'scripts/validate-county-runtime-integration.js',

  ownerEvidence:
    'scripts/validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js',

  comparison:
    'scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js',

  classification:
    'scripts/validate-absentee-owner-classification-integration-v1.js',

  singleRecord:
    'scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js'
};

Object.values(files).forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required integration file missing: ' + file
  );
});

function read(file) {
  return fs.readFileSync(
    path.join(ROOT, file),
    'utf8'
  );
}

function count(text, marker) {
  return text.split(marker).length - 1;
}

const design = read(files.design);
const freeze = read(files.freeze);
const runtime = read(files.runtime);
const provisionRuntime = read(files.provisionRuntime);
const workflow = read(files.workflow);
const county = read(files.county);
const ownerEvidence = read(files.ownerEvidence);
const comparison = read(files.comparison);
const classification = read(files.classification);
const singleRecord = read(files.singleRecord);

assert.strictEqual(
  crypto
    .createHash('sha256')
    .update(design, 'utf8')
    .digest('hex'),
  '7df2d03a307a029840f06e192973b82a33fe9d8c8e2f883fd73ad0c7fb24a6c8',
  'governing sheet-identity/orphan-adoption design changed'
);

assert.strictEqual(
  crypto
    .createHash('sha256')
    .update(freeze, 'utf8')
    .digest('hex'),
  '0acf3aaafc50aa9a3bc4f9f0538f495f270d9c13e6ac8c847906a4d1597cd8cd',
  'governing implementation freeze changed'
);

[
  'ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION',
  'REOS.Security.requireAdmin();',
  'LockService.getScriptLock();',
  'lock.tryLock(1000)',
  'Session.getEffectiveUser()',
  'workbook.getOwner()',
  'workbook.getEditors()',
  'workbook.getViewers()',
  'positionalSheet.getSheetId()',
  'namedSheet.getSheetId()',
  'properties.setProperty(',
  'workbookCreated: false',
  'workbookMutated: false',
  'provisioningRetryExecuted: false',
  'persistenceAuthorized: false',
  'boundedRolloutAuthorized: false',
  'automaticOfferAuthorityGranted: false'
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'orphan runtime integration marker missing: ' + marker
  );
});

assert.strictEqual(
  provisionRuntime.includes(
    'sheets[0] !== sheet'
  ),
  false,
  'provisioning wrapper reference identity remains'
);

assert.ok(
  provisionRuntime.includes(
    'positionalSheet.getSheetId()'
  ),
  'corrected provisioning stable identity is missing'
);

const postStart =
  county.indexOf(
    'const POST_COUNTY_PRODUCTION_FILES = ['
  );

const postEnd =
  county.indexOf(
    '];',
    postStart
  );

assert.ok(
  postStart >= 0 &&
  postEnd > postStart
);

const postBlock =
  county.slice(
    postStart,
    postEnd
  );

const postEntries =
  postBlock.match(
    /'build\/apps-script-brand\/[^']+\.js'/g
  ) || [];

assert.strictEqual(
  postEntries.length,
  54,
  'post-county production inventory must contain exactly 54 files'
);

assert.strictEqual(
  count(
    postBlock,
    "'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js'"
  ),
  1,
  'orphan-adoption runtime must occur exactly once in post-county production inventory'
);

const componentStart =
  county.indexOf(
    'const COMPONENT_VALIDATORS = ['
  );

const componentEnd =
  county.indexOf(
    '];',
    componentStart
  );

assert.ok(
  componentStart >= 0 &&
  componentEnd > componentStart
);

const componentBlock =
  county.slice(
    componentStart,
    componentEnd
  );

const componentEntries =
  componentBlock.match(
    /'validate-[^']+\.js'/g
  ) || [];

assert.strictEqual(
  componentEntries.length,
  83,
  'component validator inventory must contain exactly 83 validators'
);

[
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js'
].forEach(file => {
  assert.strictEqual(
    count(
      componentBlock,
      "'" + file + "'"
    ),
    1,
    'orphan component validator registration must occur exactly once: ' + file
  );
});

[
  'validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js',
  'validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.js',
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js'
].forEach(file => {
  assert.strictEqual(
    componentBlock.includes(file),
    false,
    'workflow-only validator entered COMPONENT_VALIDATORS: ' + file
  );
});

[
  ownerEvidence,
  comparison,
  classification,
  singleRecord
].forEach(text => {
  assert.ok(
    /componentEntries\.length,\s*83,/s.test(text),
    'count-coupled integration validator was not reconciled to 81'
  );

  assert.ok(
    text.includes(
      'COMPONENT_VALIDATOR_COUNT=80'
    ),
    'count-coupled integration summary was not reconciled to 81'
  );
});

[
  classification,
  singleRecord
].forEach(text => {
  assert.ok(
    /(?:postCountyEntries|postEntries)\.length,\s*54,/s.test(text),
    'post-county count-coupled validator was not reconciled to 54'
  );

  assert.ok(
    text.includes(
      'POST_COUNTY_PRODUCTION_FILE_COUNT=54'
    ),
    'post-county summary was not reconciled to 53'
  );
});

const syntaxMarkers = [
  'node --check build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js'
];

syntaxMarkers.forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur exactly once: ' + marker
  );
});

const executionMarkers = [
  'run: node scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js'
];

executionMarkers.forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow execution registration must occur exactly once: ' + marker
  );
});

[
  'UrlFetchApp',
  'DISTRESS_LEADS',
  'AbsenteeOwnerClassificationPersistenceExecutor',
  'AbsenteeOwnerClassificationBoundedRollout',
  'REOS.Database',
  'ScriptApp.newTrigger',
  'newTrigger('
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'prohibited orphan-adoption integration authority marker: ' + marker
  );
});

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_INTEGRATION_VALID=true'
);
console.log('RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true');
console.log('POST_COUNTY_PRODUCTION_FILE_COUNT=54');
console.log('COMPONENT_VALIDATOR_COUNT=80');
console.log('LIVE_COMPONENT_COUNT_RECONCILIATION_COUNT=5');
console.log('LIVE_POST_COUNTY_COUNT_RECONCILIATION_COUNT=3');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('STABLE_SHEET_IDENTITY=Sheet.getSheetId');
console.log('PROVISIONING_RETRY_AUTHORIZED=false');
console.log('ORPHAN_ADOPTION_PUBLIC_RPC_COUNT=1');
console.log('ORPHAN_ADOPTION_WORKBOOK_MUTATION_AUTHORIZED=false');
console.log('PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('ARV_AUTHORITY_GRANTED=false');
console.log('REPAIR_SCOPE_AUTHORITY_GRANTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
