#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const IMPLEMENTATION =
  'build/apps-script-brand/' +
  'AbsenteeOwnerClassification.js';

const STATIC =
  'scripts/' +
  'validate-absentee-owner-classification-v1.js';

const BEHAVIOR =
  'scripts/' +
  'validate-absentee-owner-classification-behavior-v1.js';

const INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-classification-integration-v1.js';

const OWNER_EVIDENCE_INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js';

const COMPARISON_INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-owner-evidence-comparison-integration-v1.js';

const RUNTIME_INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

[
  IMPLEMENTATION,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  OWNER_EVIDENCE_INTEGRATION,
  COMPARISON_INTEGRATION,
  RUNTIME_INTEGRATION,
  WORKFLOW
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required classification integration surface missing: ' +
      file
  );
});

const implementation =
  fs.readFileSync(
    path.join(ROOT, IMPLEMENTATION),
    'utf8'
  );

const ownerEvidenceIntegration =
  fs.readFileSync(
    path.join(
      ROOT,
      OWNER_EVIDENCE_INTEGRATION
    ),
    'utf8'
  );

const comparisonIntegration =
  fs.readFileSync(
    path.join(
      ROOT,
      COMPARISON_INTEGRATION
    ),
    'utf8'
  );

const runtime =
  fs.readFileSync(
    path.join(ROOT, RUNTIME_INTEGRATION),
    'utf8'
  );

const workflow =
  fs.readFileSync(
    path.join(ROOT, WORKFLOW),
    'utf8'
  );

function count(text, marker) {
  return text.split(marker).length - 1;
}

assert.equal(
  count(
    runtime,
    "'build/apps-script-brand/" +
      "AbsenteeOwnerClassification.js'"
  ),
  1,
  'classification production allowlist entry must occur exactly once'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-classification-v1.js'"
  ),
  1,
  'classification static validator must occur exactly once in component inventory'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-classification-behavior-v1.js'"
  ),
  1,
  'classification behavior validator must occur exactly once in component inventory'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-classification-integration-v1.js'"
  ),
  0,
  'classification integration validator must not recursively enter component inventory'
);

[
  "'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION'",
  "'absentee_owner_classification'",
  "'ABSENTEE_OWNER_INDICATED'",
  "'OWNER_MAILING_MATCHED'",
  "'INSUFFICIENT_CLASSIFICATION_EVIDENCE'",
  "'INELIGIBLE_COMPARISON_EVIDENCE'",
  "'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON'",
  'classificationPersistenceAuthorityGranted:',
  'ownerOccupancyAuthorityGranted:',
  'vacancyAuthorityGranted:',
  'qualifiedDealQueueAuthorityGranted:',
  'acquisitionLifecycleAuthorityGranted:',
  'automaticOfferAuthorityGranted:',
  'classify: classify'
].forEach(marker => {
  assert.ok(
    implementation.includes(marker),
    'classification implementation boundary marker missing: ' +
      marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
  'reosConnectorHandleAbsenteeOwners',
  'REOS.AbsenteeOwnerEnrichmentSanitizer',
  'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter',
  'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'REOS.AbsenteeOwnerEnrichmentExecutor',
  'AcquisitionDistressIntelligence'
].forEach(marker => {
  assert.equal(
    implementation.includes(marker),
    false,
    'prohibited classification integration marker: ' +
      marker
  );
});

assert.equal(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    implementation
  ),
  false,
  'classification runtime must not expose an RPC'
);

const componentStart =
  runtime.indexOf(
    'const COMPONENT_VALIDATORS = ['
  );

const componentEnd =
  runtime.indexOf(
    '];',
    componentStart
  );

assert.ok(
  componentStart >= 0 &&
  componentEnd > componentStart,
  'unable to locate component-validator inventory'
);

const componentBlock =
  runtime.slice(
    componentStart,
    componentEnd
  );

const componentEntries =
  componentBlock.match(
    /'validate-[^']+\.js'/g
  ) || [];

assert.equal(
  componentEntries.length,
  71,
  'current component validator inventory must contain exactly 71 validators'
);

assert.ok(
  runtime.includes(
    'expected county runtime integration inventory must contain 104 files'
  ),
  'historical county runtime inventory 104 changed'
);

assert.ok(
  runtime.includes(
    'county runtime remains exactly 104 additive files'
  ),
  'historical county runtime summary 104 changed'
);

assert.ok(
  runtime.includes(
    'expected reconciled production inventory must contain 147 files'
  ),
  'historical 147-file production inventory authority changed'
);

const postCountyStart =
  runtime.indexOf(
    'const POST_COUNTY_PRODUCTION_FILES = ['
  );

const postCountyEnd =
  runtime.indexOf(
    '];',
    postCountyStart
  );

assert.ok(
  postCountyStart >= 0 &&
  postCountyEnd > postCountyStart,
  'unable to locate post-county production inventory'
);

const postCountyBlock =
  runtime.slice(
    postCountyStart,
    postCountyEnd
  );

const postCountyEntries =
  postCountyBlock.match(
    /'build\/apps-script-brand\/[^']+\.js'/g
  ) || [];

assert.equal(
  postCountyEntries.length,
  41,
  'post-county production inventory must contain exactly 41 files'
);

assert.ok(
  /assert\.equal\(\s*componentEntries\.length,\s*71,/s
    .test(ownerEvidenceIntegration),
  'owner-evidence integration validator must reconcile component count to 71'
);

assert.ok(
  ownerEvidenceIntegration.includes(
    'COMPONENT_VALIDATOR_COUNT=71'
  ),
  'owner-evidence integration summary must reconcile component count to 71'
);

assert.ok(
  /assert\.equal\(\s*componentEntries\.length,\s*71,/s
    .test(comparisonIntegration),
  'comparison integration validator must reconcile component count to 71'
);

assert.ok(
  comparisonIntegration.includes(
    'COMPONENT_VALIDATOR_COUNT=71'
  ),
  'comparison integration summary must reconcile component count to 71'
);

const syntaxMarkers = [
  'node --check build/apps-script-brand/' +
    'AbsenteeOwnerClassification.js',

  'node --check scripts/' +
    'validate-absentee-owner-classification-v1.js',

  'node --check scripts/' +
    'validate-absentee-owner-classification-behavior-v1.js',

  'node --check scripts/' +
    'validate-absentee-owner-classification-integration-v1.js'
];

syntaxMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'classification workflow syntax registration must occur exactly once: ' +
      marker
  );
});

const stepMarkers = [
  'Validate absentee-owner classification static v1',
  'Validate absentee-owner classification behavior v1',
  'Validate absentee-owner classification integration v1'
];

stepMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'classification workflow execution step must occur exactly once: ' +
      marker
  );
});

[
  'validate-absentee-owner-classification-v1.js',
  'validate-absentee-owner-classification-behavior-v1.js',
  'validate-absentee-owner-classification-integration-v1.js'
].forEach(file => {
  assert.equal(
    count(
      workflow,
      'run: node scripts/' + file
    ),
    1,
    'classification workflow validator execution must occur exactly once: ' +
      file
  );
});

[
  'Validate certified county runtime integration',
  'git worktree add --detach "$wt" ' +
    'd79d640d587e8a4d104cc4631b2022609a63fd50',
  'test "$(git rev-parse \'HEAD^{tree}\')" = ' +
    '"90d28afc06ae80006ce32810e3bf523665f191f8"',
  'node scripts/validate-county-runtime-integration.js'
].forEach(marker => {
  assert.ok(
    workflow.includes(marker),
    'historical county-runtime replay marker changed: ' +
      marker
  );
});

assert.equal(
  count(
    workflow,
    'node scripts/validate-county-runtime-integration.js'
  ),
  1,
  'historical county runtime integration execution must remain exactly once'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_INTEGRATION_VALID=true'
);

console.log(
  'RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=71'
);

console.log(
  'POST_COUNTY_PRODUCTION_FILE_COUNT=41'
);

console.log(
  'CLASSIFICATION_INTEGRATION_RECURSIVE_REGISTRATION=false'
);

console.log(
  'CI_SYNTAX_REGISTRATION_EXACT=true'
);

console.log(
  'CI_EXECUTION_REGISTRATION_EXACT=true'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_INVENTORY_104_PRESERVED=true'
);

console.log(
  'HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_REPLAY_PRESERVED=true'
);

console.log(
  'PRODUCTION_RPC_CREATED=false'
);

console.log(
  'EXTERNAL_HTTP_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_PERSISTENCE_AUTHORITY=false'
);

console.log(
  'OWNER_OCCUPANCY_AUTHORITY=false'
);

console.log(
  'VACANCY_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
