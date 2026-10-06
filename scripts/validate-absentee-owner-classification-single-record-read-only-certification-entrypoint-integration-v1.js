#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const RUNTIME =
  'build/apps-script-brand/' +
  'AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js';

const STATIC =
  'scripts/' +
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-v1.js';

const BEHAVIOR =
  'scripts/' +
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-behavior-v1.js';

const INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js';

const DESIGN_VALIDATOR =
  'scripts/' +
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-contract-v1.js';

const OWNER_EVIDENCE_INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js';

const COMPARISON_INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-owner-evidence-comparison-integration-v1.js';

const CLASSIFICATION_INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-classification-integration-v1.js';

const RUNTIME_INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

[
  RUNTIME,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  OWNER_EVIDENCE_INTEGRATION,
  COMPARISON_INTEGRATION,
  CLASSIFICATION_INTEGRATION,
  RUNTIME_INTEGRATION,
  WORKFLOW
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required implementation integration surface missing: ' +
      file
  );
});

function read(relative) {
  return fs.readFileSync(
    path.join(ROOT, relative),
    'utf8'
  );
}

function count(text, marker) {
  return text.split(marker).length - 1;
}

const runtime =
  read(RUNTIME);

const ownerEvidenceIntegration =
  read(OWNER_EVIDENCE_INTEGRATION);

const comparisonIntegration =
  read(COMPARISON_INTEGRATION);

const classificationIntegration =
  read(CLASSIFICATION_INTEGRATION);

const county =
  read(RUNTIME_INTEGRATION);

const workflow =
  read(WORKFLOW);

assert.strictEqual(
  count(
    county,
    "'build/apps-script-brand/" +
      "AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js'"
  ),
  1,
  'entrypoint runtime must occur exactly once in post-county production inventory'
);

assert.strictEqual(
  count(
    county,
    "'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-v1.js'"
  ),
  1,
  'entrypoint static validator must occur exactly once in component inventory'
);

assert.strictEqual(
  count(
    county,
    "'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-behavior-v1.js'"
  ),
  1,
  'entrypoint behavior validator must occur exactly once in component inventory'
);

assert.strictEqual(
  count(
    county,
    "'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js'"
  ),
  0,
  'entrypoint integration validator must remain workflow-only'
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

const componentEntries =
  county
    .slice(
      componentStart,
      componentEnd
    )
    .match(
      /'validate-[^']+\.js'/g
    ) || [];

assert.strictEqual(
  componentEntries.length,
  97,
  'current component validator inventory must contain exactly 97 validators'
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

const postEntries =
  county
    .slice(
      postStart,
      postEnd
    )
    .match(
      /'build\/apps-script-brand\/[^']+\.js'/g
    ) || [];

assert.strictEqual(
  postEntries.length,
  70,
  'current post-county production inventory must contain exactly 70 files'
);

[
  ownerEvidenceIntegration,
  comparisonIntegration,
  classificationIntegration
].forEach(text => {
  assert.ok(
    /componentEntries\.length,\s*97,/s
      .test(text),
    'count-coupled absentee-owner integration validator was not reconciled to 97'
  );

  assert.ok(
    text.includes(
      'COMPONENT_VALIDATOR_COUNT=97'
    ),
    'count-coupled integration summary was not reconciled to 97'
  );
});

assert.ok(
  /postCountyEntries\.length,\s*70,/s
    .test(
      classificationIntegration
    ),
  'classification integration post-county count was not reconciled to 70'
);

assert.ok(
  classificationIntegration.includes(
    'POST_COUNTY_PRODUCTION_FILE_COUNT=70'
  ),
  'classification integration post-county summary was not reconciled to 70'
);

[
  'expected county runtime integration inventory must contain 104 files',
  'county runtime remains exactly 104 additive files',
  'expected reconciled production inventory must contain 147 files'
].forEach(marker => {
  assert.ok(
    county.includes(marker),
    'historical runtime authority changed: ' +
      marker
  );
});

[
  'node --check build/apps-script-brand/' +
    'AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js',

  'node --check scripts/' +
    'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-v1.js',

  'node --check scripts/' +
    'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-behavior-v1.js',

  'node --check scripts/' +
    'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js'
].forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur exactly once: ' +
      marker
  );
});

[
  'Validate absentee-owner classification single-record read-only certification entrypoint static v1',
  'Validate absentee-owner classification single-record read-only certification entrypoint behavior v1',
  'Validate absentee-owner classification single-record read-only certification entrypoint integration v1'
].forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow execution registration must occur exactly once: ' +
      marker
  );
});

[
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-v1.js',
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-behavior-v1.js',
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js'
].forEach(file => {
  assert.strictEqual(
    count(
      workflow,
      'run: node scripts/' + file
    ),
    1,
    'workflow execution command must occur exactly once: ' +
      file
  );
});

assert.strictEqual(
  workflow.includes(
    DESIGN_VALIDATOR
  ),
  false,
  'design validator must remain outside production workflow registration'
);

[
  'REOS.Security.requireAdmin();',
  'REOS.AbsenteeOwnerEnrichmentExactRecordSelector',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  'REOS.AbsenteeOwnerClassification',
  'function reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord('
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'runtime orchestration marker missing: ' +
      marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'REOS.Database',
  'AbsenteeOwnerEnrichmentExecutor',
  'reosConnectorHandleAbsenteeOwners',
  'AcquisitionDistressIntelligence'
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'prohibited direct integration authority present: ' +
      marker
  );
});

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_SINGLE_RECORD_READ_ONLY_CERTIFICATION_ENTRYPOINT_INTEGRATION_VALID=true'
);

console.log(
  'RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=97'
);

console.log(
  'POST_COUNTY_PRODUCTION_FILE_COUNT=70'
);

console.log(
  'INTEGRATION_VALIDATOR_RECURSIVE_REGISTRATION=false'
);

console.log(
  'CI_SYNTAX_REGISTRATION_EXACT=true'
);

console.log(
  'CI_EXECUTION_REGISTRATION_EXACT=true'
);

console.log(
  'DESIGN_VALIDATOR_WORKFLOW_REGISTRATION=false'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_INVENTORY_104_PRESERVED=true'
);

console.log(
  'HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true'
);

console.log(
  'PRODUCTION_CLASSIFICATION_EXECUTED=false'
);

console.log(
  'CLASSIFICATION_PERSISTENCE_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
