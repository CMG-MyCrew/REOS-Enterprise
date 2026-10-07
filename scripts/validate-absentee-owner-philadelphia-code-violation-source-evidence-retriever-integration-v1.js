#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const IMPLEMENTATION =
  'build/apps-script-brand/' +
  'AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js';

const STATIC =
  'scripts/' +
  'validate-absentee-owner-philadelphia-code-violation-source-evidence-retriever-v1.js';

const BEHAVIOR =
  'scripts/' +
  'validate-absentee-owner-philadelphia-code-violation-source-evidence-retriever-behavior-v1.js';

const INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-philadelphia-code-violation-source-evidence-retriever-integration-v1.js';

const RUNTIME_VALIDATOR =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

[
  IMPLEMENTATION,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  RUNTIME_VALIDATOR,
  WORKFLOW
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required integration surface missing: ' + file
  );
});

const implementation =
  fs.readFileSync(
    path.join(ROOT, IMPLEMENTATION),
    'utf8'
  );

const runtime =
  fs.readFileSync(
    path.join(ROOT, RUNTIME_VALIDATOR),
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

/*
 * Preserve inherited post-county inventory exactly at 70.
 */
const postStart =
  runtime.indexOf(
    'const POST_COUNTY_PRODUCTION_FILES = ['
  );

const postEnd =
  runtime.indexOf(
    '];',
    postStart
  );

assert.ok(
  postStart >= 0 &&
  postEnd > postStart,
  'post-county production inventory missing'
);

const postBlock =
  runtime.slice(
    postStart,
    postEnd
  );

const postEntries =
  postBlock.match(
    /'build\/apps-script-brand\/[^']+\.js'/g
  ) || [];

assert.strictEqual(
  postEntries.length,
  70,
  'inherited post-county production inventory must remain exactly 70 files'
);

assert.strictEqual(
  postBlock.includes(
    "'" + IMPLEMENTATION + "'"
  ),
  false,
  'retriever must not expand inherited 70-file post-county inventory'
);

/*
 * Retriever receives a separate, exact one-file production inventory.
 */
const boundedStart =
  runtime.indexOf(
    'const ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES = ['
  );

const boundedEnd =
  runtime.indexOf(
    '];',
    boundedStart
  );

assert.ok(
  boundedStart >= 0 &&
  boundedEnd > boundedStart,
  'bounded source-evidence retrieval production inventory missing'
);

const boundedBlock =
  runtime.slice(
    boundedStart,
    boundedEnd
  );

const boundedEntries =
  boundedBlock.match(
    /'build\/apps-script-brand\/[^']+\.js'/g
  ) || [];

assert.strictEqual(
  boundedEntries.length,
  1,
  'bounded source-evidence retrieval inventory must contain exactly one file'
);

assert.strictEqual(
  count(
    boundedBlock,
    "'" + IMPLEMENTATION + "'"
  ),
  1,
  'retriever runtime must occur exactly once in its dedicated inventory'
);

[
  'absenteeOwnerSourceEvidenceRetrievalEntries',
  'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES.length',
  'bounded absentee-owner source-evidence retrieval inventory must contain exactly one file',
  'bounded absentee-owner source-evidence retrieval production surface is exactly one explicitly allowlisted additive file'
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'dedicated production reconciliation marker missing: ' + marker
  );
});

/*
 * Preserve inherited component inventory exactly at 97.
 */
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
  'component validator inventory missing'
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

assert.strictEqual(
  componentEntries.length,
  97,
  'component validator inventory must remain exactly 97'
);

[
  path.basename(STATIC),
  path.basename(BEHAVIOR),
  path.basename(INTEGRATION)
].forEach(file => {
  assert.strictEqual(
    componentBlock.includes(
      "'" + file + "'"
    ),
    false,
    'new validator must remain workflow-only: ' + file
  );
});

/*
 * Runtime boundary.
 */
[
  'REOS.Security.requireAdmin();',
  'REOS.CountyAdapters.ArcGIS.fetch({',
  "'PA-PHILADELPHIA'",
  "'code_violations'",
  "'SOURCE_EVIDENCE_READY'",
  'productionSourceRetrievalExecutionAuthorityGranted:',
  'sourceEvidenceRetrievalAuthorityGranted:',
  'productionDataMutationAuthorityGranted:',
  'opaAccountRowRetrievalAuthorityGranted:',
  'ownerEvidenceRetrievalAuthorityGranted:',
  'classificationAuthorityGranted:',
  'persistenceAuthorityGranted:',
  'offerAuthorityGranted:'
].forEach(marker => {
  assert.ok(
    implementation.includes(marker),
    'implementation marker missing: ' + marker
  );
});

[
  'UrlFetchApp.',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.CanonicalPropertyIdentity',
  'PropertiesService',
  'ScriptApp',
  'SpreadsheetApp',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator',
  'opa_properties_public'
].forEach(marker => {
  assert.strictEqual(
    implementation.includes(marker),
    false,
    'prohibited implementation dependency: ' + marker
  );
});

/*
 * Direct workflow-only validation.
 */
const syntaxMarkers = [
  'node --check build/apps-script-brand/' +
    'AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js',

  'node --check scripts/' +
    path.basename(STATIC),

  'node --check scripts/' +
    path.basename(BEHAVIOR),

  'node --check scripts/' +
    path.basename(INTEGRATION)
];

syntaxMarkers.forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur exactly once: ' + marker
  );
});

const stepMarkers = [
  'Validate absentee-owner Philadelphia code-violation source-evidence retriever static v1',
  'Validate absentee-owner Philadelphia code-violation source-evidence retriever behavior v1',
  'Validate absentee-owner Philadelphia code-violation source-evidence retriever integration v1'
];

stepMarkers.forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow execution step must occur exactly once: ' + marker
  );
});

[
  path.basename(STATIC),
  path.basename(BEHAVIOR),
  path.basename(INTEGRATION)
].forEach(file => {
  assert.strictEqual(
    count(
      workflow,
      'run: node scripts/' + file
    ),
    1,
    'workflow validator execution must occur exactly once: ' + file
  );
});

/*
 * Preserve historical county replay.
 */
[
  'Validate certified county runtime integration',
  'git worktree add --detach "$wt" d79d640d587e8a4d104cc4631b2022609a63fd50',
  'test "$(git rev-parse \'HEAD^{tree}\')" = "90d28afc06ae80006ce32810e3bf523665f191f8"',
  'node scripts/validate-county-runtime-integration.js'
].forEach(marker => {
  assert.ok(
    workflow.includes(marker),
    'historical county-runtime replay marker changed: ' + marker
  );
});

assert.strictEqual(
  count(
    workflow,
    'node scripts/validate-county-runtime-integration.js'
  ),
  1,
  'county runtime workflow invocation count changed'
);

console.log(
  'ABSENTEE_OWNER_PHILADELPHIA_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVER_INTEGRATION_VALID=true'
);

console.log(
  'INHERITED_POST_COUNTY_PRODUCTION_FILE_COUNT=70'
);

console.log(
  'BOUNDED_SOURCE_EVIDENCE_PRODUCTION_FILE_COUNT=1'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=97'
);

console.log(
  'COMPONENT_VALIDATOR_INVENTORY_UNCHANGED=true'
);

console.log(
  'NEW_VALIDATORS_WORKFLOW_ONLY=true'
);

console.log(
  'CI_SYNTAX_REGISTRATION_EXACT=true'
);

console.log(
  'CI_EXECUTION_REGISTRATION_EXACT=true'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_REPLAY_PRESERVED=true'
);

console.log('DIRECT_URLFETCHAPP=false');
console.log('DATABASE_ACCESS=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('OWNER_EVIDENCE_RETRIEVAL=false');
console.log('OPA_ACCOUNT_ROW_RETRIEVAL=false');
console.log('CLASSIFICATION_AUTHORITY=false');
console.log('PERSISTENCE_AUTHORITY=false');
console.log('OFFER_AUTHORITY=false');
