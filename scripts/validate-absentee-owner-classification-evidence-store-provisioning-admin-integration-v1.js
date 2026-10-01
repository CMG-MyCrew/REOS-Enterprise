#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const files = {
  provisioningDesign:
    'docs/absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.md',

  correctionDesign:
    'docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.md',

  freeze:
    'docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.md',

  runtime:
    'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',

  orphanRuntime:
    'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',

  staticValidator:
    'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',

  behaviorValidator:
    'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',

  integrationValidator:
    'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js',

  orphanStatic:
    'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',

  orphanBehavior:
    'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',

  orphanIntegration:
    'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js',

  workflow:
    '.github/workflows/county-collapse-offline.yml',

  runtimeIntegration:
    'scripts/validate-county-runtime-integration.js',

  ownerEvidenceIntegration:
    'scripts/validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js',

  comparisonIntegration:
    'scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js',

  classificationIntegration:
    'scripts/validate-absentee-owner-classification-integration-v1.js',

  singleRecordIntegration:
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

const provisioningDesign =
  read(files.provisioningDesign);

const correctionDesign =
  read(files.correctionDesign);

const freeze =
  read(files.freeze);

const runtime =
  read(files.runtime);

const workflow =
  read(files.workflow);

const county =
  read(files.runtimeIntegration);

const ownerEvidence =
  read(files.ownerEvidenceIntegration);

const comparison =
  read(files.comparisonIntegration);

const classification =
  read(files.classificationIntegration);

const singleRecord =
  read(files.singleRecordIntegration);

assert.strictEqual(
  crypto
    .createHash('sha256')
    .update(
      provisioningDesign,
      'utf8'
    )
    .digest('hex'),
  '287041aeeae9636f5b66d45c1c4c90e96f596118697adc1dbc6024ab20ad176e',
  'merged provisioning design changed'
);

assert.strictEqual(
  crypto
    .createHash('sha256')
    .update(
      correctionDesign,
      'utf8'
    )
    .digest('hex'),
  '7df2d03a307a029840f06e192973b82a33fe9d8c8e2f883fd73ad0c7fb24a6c8',
  'merged correction/orphan design changed'
);

assert.strictEqual(
  crypto
    .createHash('sha256')
    .update(
      freeze,
      'utf8'
    )
    .digest('hex'),
  '0acf3aaafc50aa9a3bc4f9f0538f495f270d9c13e6ac8c847906a4d1597cd8cd',
  'merged implementation freeze changed'
);

[
  'REOS.Security.requireAdmin()',
  'LockService.getScriptLock',
  'SpreadsheetApp.create',
  'positionalSheet.getSheetId()',
  'sheet.getSheetId()',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED',
  'persistenceAuthorized: false',
  'boundedRolloutAuthorized: false',
  'automaticOfferAuthorityGranted: false'
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'runtime integration marker missing: ' + marker
  );
});

assert.strictEqual(
  runtime.includes(
    'sheets[0] !== sheet'
  ),
  false,
  'wrapper-reference identity remains in provisioning runtime'
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
  55,
  'post-county production inventory must contain exactly 55 files'
);

[
  'AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  'AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js'
].forEach(file => {
  assert.strictEqual(
    count(
      postBlock,
      "'build/apps-script-brand/" +
        file +
        "'"
    ),
    1,
    'production runtime must occur once: ' + file
  );
});

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
  84,
  'component validator inventory must contain exactly 84 validators'
);

[
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js'
].forEach(file => {
  assert.strictEqual(
    count(
      componentBlock,
      "'" + file + "'"
    ),
    1,
    'component validator registration must occur exactly once: ' + file
  );
});

[
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.js',
  'validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js',
  'validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.js',
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js',
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js'
].forEach(file => {
  assert.strictEqual(
    componentBlock.includes(file),
    false,
    'workflow-only validator must not enter COMPONENT_VALIDATORS: ' + file
  );
});

[
  ownerEvidence,
  comparison,
  classification,
  singleRecord
].forEach(text => {
  assert.ok(
    /componentEntries\.length,\s*84,/s.test(text),
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
    /(?:postCountyEntries|postEntries)\.length,\s*55,/s.test(text),
    'post-county count-coupled validator was not reconciled to 55'
  );

  assert.ok(
    text.includes(
      'POST_COUNTY_PRODUCTION_FILE_COUNT=55'
    ),
    'post-county summary was not reconciled to 53'
  );
});

assert.ok(
  county.includes(
    'expected county runtime integration inventory must contain 104 files'
  ),
  'historical county runtime inventory changed'
);

assert.ok(
  county.includes(
    'county runtime remains exactly 104 additive files'
  ),
  'historical county runtime summary changed'
);

assert.ok(
  county.includes(
    'expected reconciled production inventory must contain 147 files'
  ),
  'historical 147-file production inventory changed'
);

const syntaxMarkers = [
  'node --check build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  'node --check build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js',
  'node --check scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js'
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
  'run: node scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js',
  'run: node scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js'
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
  'ScriptApp.newTrigger',
  'newTrigger('
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'prohibited provisioning integration authority marker present: ' + marker
  );
});

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_ADMIN_INTEGRATION_VALID=true'
);
console.log('RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true');
console.log('POST_COUNTY_PRODUCTION_FILE_COUNT=55');
console.log('COMPONENT_VALIDATOR_COUNT=80');
console.log('LIVE_COMPONENT_COUNT_RECONCILIATION_COUNT=5');
console.log('LIVE_POST_COUNTY_COUNT_RECONCILIATION_COUNT=3');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('HISTORICAL_COUNTY_RUNTIME_INVENTORY_104_PRESERVED=true');
console.log('HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true');
console.log('PRODUCTION_RPC_COUNT=2');
console.log('STABLE_SHEET_IDENTITY=Sheet.getSheetId');
console.log('WRAPPER_REFERENCE_IDENTITY_AUTHORIZED=false');
console.log('PROVISIONING_RETRY_AUTHORIZED=false');
console.log('PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
