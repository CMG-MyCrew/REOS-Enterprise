#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESIGN =
  'docs/absentee-owner-classification-evidence-store-v2-provisioning-readiness-reconciliation-v1.md';

const RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js';

const STATIC =
  'scripts/validate-absentee-owner-classification-evidence-store-v2-provisioning-admin-v1.js';

const BEHAVIOR =
  'scripts/validate-absentee-owner-classification-evidence-store-v2-provisioning-admin-behavior-v1.js';

const INTEGRATION =
  'scripts/validate-absentee-owner-classification-evidence-store-v2-provisioning-admin-integration-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const COUNTY =
  'scripts/validate-county-runtime-integration.js';

const V1_PROVISIONER =
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js';

const V2_STORE =
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js';

function read(file) {
  return fs.readFileSync(
    path.join(ROOT, file),
    'utf8'
  );
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

function count(text, marker) {
  return text.split(marker).length - 1;
}

[
  DESIGN,
  RUNTIME,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  WORKFLOW,
  COUNTY,
  V1_PROVISIONER,
  V2_STORE
].forEach(file => {
  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    'required artifact missing: ' + file
  );
});

assert.strictEqual(
  sha256(read(DESIGN)),
  '7839a8b1deb6b738b8919327e145df0741d134cbc6d472b1ff1c901ab6cbd55b'
);

assert.strictEqual(
  sha256(read(V1_PROVISIONER)),
  '73b7f2706689c8829ba0bb056f6c6133b19025fe9c6f96578d0c96cdcdc00304'
);

assert.strictEqual(
  sha256(read(V2_STORE)),
  '2bdfd0bdf005ea8b16ed9e13777a8c99ba229f8e86fbf5055859867be6cf5048'
);

const runtime = read(RUNTIME);
const county = read(COUNTY);
const workflow = read(WORKFLOW);

[
  'REOS.Security.requireAdmin();',
  'PROVISION_V2_EVIDENCE_SHEET',
  'workbook.insertSheet(',
  'SpreadsheetApp.flush();',
  'v2PersistenceAuthorized: false',
  'v2BoundedRolloutAuthorized: false',
  'v2OrchestratorAuthorized: false',
  'automaticOfferAuthorityGranted: false'
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'runtime marker missing: ' + marker
  );
});

[
  'SpreadsheetApp.create(',
  '.setProperty(',
  '.deleteSheet(',
  'DISTRESS_LEADS',
  'UrlFetchApp',
  'AbsenteeOwnerClassificationEvidenceStoreV2.persist',
  'ScriptApp.newTrigger'
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'forbidden authority present: ' + marker
  );
});

function block(marker) {
  const start = county.indexOf(marker);
  assert.ok(start >= 0, 'inventory missing: ' + marker);

  const end = county.indexOf('];', start);
  assert.ok(end > start, 'inventory unterminated: ' + marker);

  return county.slice(start, end);
}

const post = block(
  'const POST_COUNTY_PRODUCTION_FILES = ['
);

const components = block(
  'const COMPONENT_VALIDATORS = ['
);

const bounded = block(
  'const ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRODUCTION_FILES = ['
);

const postEntries =
  post.match(
    /'build\/apps-script-brand\/[^']+\.js'/g
  ) || [];

const componentEntries =
  components.match(
    /'validate-[^']+\.js'/g
  ) || [];

const boundedEntries =
  bounded.match(
    /'build\/apps-script-brand\/[^']+\.js'/g
  ) || [];

assert.strictEqual(
  postEntries.length,
  70,
  'historical post-county inventory must remain 70'
);

assert.strictEqual(
  componentEntries.length,
  97,
  'historical component inventory must remain 97'
);

assert.strictEqual(
  boundedEntries.length,
  1,
  'V2 provisioning bounded inventory must contain one runtime'
);

assert.ok(
  bounded.includes("'" + RUNTIME + "'"),
  'V2 provisioning runtime missing from bounded inventory'
);

assert.strictEqual(
  post.includes(RUNTIME),
  false,
  'V2 provisioning runtime entered inherited post-county inventory'
);

[
  path.basename(STATIC),
  path.basename(BEHAVIOR),
  path.basename(INTEGRATION)
].forEach(file => {
  assert.strictEqual(
    components.includes(file),
    false,
    'V2 provisioning validator must remain workflow-only: ' + file
  );
});

assert.ok(
  county.includes(
    '!ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRODUCTION_FILES.includes('
  )
);

assert.ok(
  county.includes(
    'expected reconciled production inventory must contain 147 files'
  )
);

assert.ok(
  county.includes(
    'expected county runtime integration inventory must contain 104 files'
  )
);

[
  'node --check ' + RUNTIME,
  'node --check ' + STATIC,
  'node --check ' + BEHAVIOR,
  'node --check ' + INTEGRATION,
  'run: node ' + STATIC,
  'run: node ' + BEHAVIOR,
  'run: node ' + INTEGRATION
].forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow registration not exact: ' + marker
  );
});

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_ADMIN_INTEGRATION_VALID=true'
);

console.log(
  'V2_PROVISIONING_RUNTIME_SEPARATE_BOUNDED_INVENTORY=true'
);

console.log('V2_PROVISIONING_RUNTIME_INVENTORY_COUNT=1');
console.log('POST_COUNTY_PRODUCTION_FILE_COUNT=70');
console.log('COMPONENT_VALIDATOR_COUNT=97');
console.log('HISTORICAL_RECONCILED_PRODUCTION_FILE_COUNT=147');
console.log('HISTORICAL_COUNTY_RUNTIME_FILE_COUNT=104');
console.log('V2_PROVISIONING_VALIDATORS_WORKFLOW_ONLY=true');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('V1_PROVISIONER_FROZEN=true');
console.log('V2_EVIDENCE_STORE_FROZEN=true');
console.log('V2_PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('V2_BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('V2_ORCHESTRATOR_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
