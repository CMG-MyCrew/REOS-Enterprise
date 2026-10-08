#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const DESIGN =
  'docs/absentee-owner-certified-property-source-identity-owner-evidence-retrieval-boundary-v1.md';

const DESIGN_VALIDATOR =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-retrieval-boundary-design-v1.js';

const IMPLEMENTATION =
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js';

const STATIC =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-lookup-v1.js';

const BEHAVIOR =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-lookup-behavior-v1.js';

const INTEGRATION =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-lookup-integration-v1.js';

const COMPARISON =
  'build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js';

const COMPARISON_STATIC =
  'scripts/validate-absentee-owner-owner-evidence-comparison-v1.js';

const COMPARISON_BEHAVIOR =
  'scripts/validate-absentee-owner-owner-evidence-comparison-behavior-v1.js';

const COMPARISON_INTEGRATION =
  'scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js';

const EXISTING_LOOKUP =
  'build/apps-script-brand/AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js';

const RUNTIME_INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

[
  DESIGN,
  DESIGN_VALIDATOR,
  IMPLEMENTATION,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  COMPARISON,
  COMPARISON_STATIC,
  COMPARISON_BEHAVIOR,
  COMPARISON_INTEGRATION,
  EXISTING_LOOKUP,
  RUNTIME_INTEGRATION,
  WORKFLOW
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required capability integration surface missing: ' + file
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

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

const implementation =
  read(IMPLEMENTATION);

const behavior =
  read(BEHAVIOR);

const comparison =
  read(COMPARISON);

const comparisonBehavior =
  read(COMPARISON_BEHAVIOR);

const existingLookup =
  read(EXISTING_LOOKUP);

const runtime =
  read(RUNTIME_INTEGRATION);

const workflow =
  read(WORKFLOW);

assert.strictEqual(
  sha256(existingLookup),
  '26f6d6518b19fc0397ae9f61f573455fc611301f3d017b7b298b7aee719d554e',
  'historical exact-address lookup changed'
);

[
  'REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup',
  "'READ_ONLY_OWNER_EVIDENCE'",
  "'absentee_owner_certified_property_source_identity_owner_evidence_lookup'",
  "'certified_opa_account'",
  "'PROPERTY_SOURCE_IDENTITY_CERTIFIED'",
  "'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT'",
  'var MAX_SOURCE_ROWS = 2;',
  'UrlFetchApp.fetch(',
  'lookup: lookup'
].forEach(marker => {
  assert.ok(
    implementation.includes(marker),
    'new lookup implementation marker missing: ' + marker
  );
});

assert.strictEqual(
  (
    implementation.match(
      /UrlFetchApp\.fetch\s*\(/g
    ) || []
  ).length,
  1,
  'new lookup must contain exactly one HTTP call site'
);

assert.strictEqual(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    implementation
  ),
  false,
  'new lookup must remain internal and non-RPC'
);

[
  "'absentee_owner_philadelphia_owner_evidence_lookup'",
  "'exact_property_address'",
  "'absentee_owner_certified_property_source_identity_owner_evidence_lookup'",
  "'certified_opa_account'",
  "'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT'",
  'propertySourceIdentityCertified',
  'certifiedOpaAccount',
  'rangeContainmentCertifiedMatch',
  'compare: compare'
].forEach(marker => {
  assert.ok(
    comparison.includes(marker),
    'comparison eligibility/provenance marker missing: ' + marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'REOS.Database',
  'AbsenteeOwnerEnrichmentPersistenceAdapter'
].forEach(marker => {
  assert.strictEqual(
    comparison.includes(marker),
    false,
    'comparison acquired prohibited authority: ' + marker
  );
});

assert.ok(
  /assert\.strictEqual\(\s*count,\s*20,/s
    .test(behavior),
  'new lookup behavior suite must contain exactly 20 cases'
);

assert.ok(
  /assert\.strictEqual\(\s*count,\s*32,/s
    .test(comparisonBehavior),
  'comparison behavior suite must contain exactly 32 cases'
);

assert.strictEqual(
  count(
    runtime,
    "'build/apps-script-brand/" +
      "AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js'"
  ),
  1,
  'new runtime separate inventory entry must occur exactly once'
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
  'component validator count must remain 97'
);

[
  'validate-absentee-owner-certified-property-source-identity-owner-evidence-retrieval-boundary-design-v1.js',
  'validate-absentee-owner-certified-property-source-identity-owner-evidence-lookup-v1.js',
  'validate-absentee-owner-certified-property-source-identity-owner-evidence-lookup-behavior-v1.js',
  'validate-absentee-owner-certified-property-source-identity-owner-evidence-lookup-integration-v1.js'
].forEach(file => {
  assert.strictEqual(
    componentBlock.includes(file),
    false,
    'new capability validator must remain workflow-only: ' + file
  );
});

assert.ok(
  runtime.includes(
    'expected county runtime integration inventory must contain 104 files'
  )
);

assert.ok(
  runtime.includes(
    'county runtime remains exactly 104 additive files'
  )
);

assert.ok(
  runtime.includes(
    'expected reconciled production inventory must contain 147 files'
  )
);

[
  'node --check ' + DESIGN_VALIDATOR,
  'node --check ' + IMPLEMENTATION,
  'node --check ' + STATIC,
  'node --check ' + BEHAVIOR,
  'node --check ' + INTEGRATION
].forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur once: ' + marker
  );
});

[
  'run: node ' + DESIGN_VALIDATOR,
  'run: node ' + STATIC,
  'run: node ' + BEHAVIOR,
  'run: node ' + INTEGRATION
].forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow execution registration must occur once: ' + marker
  );
});

console.log(
  'ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_INTEGRATION_VALID=true'
);

console.log(
  'EXISTING_EXACT_ADDRESS_LOOKUP_SHA256=' +
    sha256(existingLookup)
);

console.log(
  'EXISTING_EXACT_ADDRESS_LOOKUP_UNCHANGED=true'
);

console.log(
  'NEW_RUNTIME_SEPARATE_BOUNDED_INVENTORY_EXACT=true'
);

console.log(
  'NEW_VALIDATORS_WORKFLOW_ONLY=true'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=97'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_COUNT=104'
);

console.log(
  'HISTORICAL_RECONCILED_PRODUCTION_COUNT=147'
);

console.log(
  'NEW_LOOKUP_BEHAVIOR_CASE_COUNT=20'
);

console.log(
  'COMPARISON_BEHAVIOR_CASE_COUNT=32'
);

console.log(
  'HISTORICAL_EXACT_ADDRESS_COMPARISON_PATH_PRESERVED=true'
);

console.log(
  'CERTIFIED_ACCOUNT_COMPARISON_PATH_PRESENT=true'
);

console.log(
  'COMPARISON_ALGORITHM_CHANGE_AUTHORIZED=false'
);

console.log(
  'PUBLIC_RPC_CREATED=false'
);

console.log(
  'CLASSIFICATION_INVOCATION_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
