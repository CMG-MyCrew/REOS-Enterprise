#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESIGN =
  'docs/' +
  'absentee-owner-classification-single-record-read-only-' +
  'certification-entrypoint-contract-v1.md';

const FUTURE_RUNTIME =
  'build/apps-script-brand/' +
  'AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js';

const SELECTOR =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentExactRecordSelector.js';

const LOOKUP =
  'build/apps-script-brand/' +
  'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js';

const COMPARISON =
  'build/apps-script-brand/' +
  'AbsenteeOwnerOwnerEvidenceComparison.js';

const CLASSIFIER =
  'build/apps-script-brand/' +
  'AbsenteeOwnerClassification.js';

const MUTATION_ENTRYPOINT =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentCertificationEntrypoint.js';

const SCHEMA =
  'build/apps-script-brand/' +
  'DistressLeadCountySchema.js';

const RUNTIME_INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

function read(relative) {
  return fs.readFileSync(
    path.join(ROOT, relative),
    'utf8'
  );
}

function exists(relative) {
  return fs.existsSync(
    path.join(ROOT, relative)
  );
}

[
  DESIGN,
  SELECTOR,
  LOOKUP,
  COMPARISON,
  CLASSIFIER,
  MUTATION_ENTRYPOINT,
  SCHEMA,
  RUNTIME_INTEGRATION
].forEach(file => {
  assert.ok(
    exists(file),
    'required design authority missing: ' + file
  );
});

assert.strictEqual(
  exists(FUTURE_RUNTIME),
  false,
  'future entrypoint runtime implementation already exists'
);

const design = read(DESIGN);
const selector = read(SELECTOR);
const lookup = read(LOOKUP);
const comparison = read(COMPARISON);
const classifier = read(CLASSIFIER);
const mutationEntrypoint = read(MUTATION_ENTRYPOINT);
const schema = read(SCHEMA);
const runtimeIntegration = read(RUNTIME_INTEGRATION);

function has(text, marker, message) {
  assert.ok(
    text.includes(marker),
    message || ('missing required marker: ' + marker)
  );
}

function notHas(text, marker, message) {
  assert.strictEqual(
    text.includes(marker),
    false,
    message || ('prohibited marker present: ' + marker)
  );
}

/*
 * Core design authority.
 */
[
  '# Absentee-Owner Classification Single-Record Read-Only Certification Entrypoint Contract v1',

  'REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(...)',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup(...)',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(...)',
  'REOS.AbsenteeOwnerClassification.classify(...)',

  'build/apps-script-brand/AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js',

  'reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord(options)',

  '`rowNumber`',
  '`identity`',

  '`Distress Lead ID`',
  '`Canonical Property Key`',

  '`Address`',
  '`City`',
  '`State`',
  '`Zip`',

  'ABSENTEE_OWNER_INDICATED',
  'OWNER_MAILING_MATCHED',
  'INSUFFICIENT_CLASSIFICATION_EVIDENCE',
  'INELIGIBLE_COMPARISON_EVIDENCE',

  'no ARV authority',
  'no repair-scope or MAO authority',
  'no offer-generation or offer-submission authority',

  'DL-20260731203649-4601',
  'property|address|pa|philadelphia|19141-4008|5146 n 10th st',
  '5146 N 10TH ST'
].forEach(marker => {
  has(design, marker);
});

/*
 * Design must explicitly deny every existing mutation/broader authority.
 */
[
  'REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize',
  'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan',
  'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare',
  'REOS.AbsenteeOwnerEnrichmentExecutor.execute',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',
  'reosConnectorHandleAbsenteeOwners',
  'AcquisitionDistressIntelligence'
].forEach(marker => {
  has(
    design,
    marker,
    'design must explicitly deny existing unsafe/broader authority: ' +
      marker
  );
});

/*
 * Existing exact-record selector authority.
 */
has(
  selector,
  'REOS.AbsenteeOwnerEnrichmentExactRecordSelector'
);

has(
  selector,
  'exactRecordEvidence: exactRecordEvidence'
);

has(
  selector,
  'function reosAbsenteeOwnerEnrichmentExactRecordEvidence(options)'
);

has(
  selector,
  'REOS.Security.requireAdmin();'
);

has(
  selector,
  "var TABLE = 'DISTRESS_LEADS';"
);

/*
 * Existing Philadelphia owner-evidence lookup authority.
 */
has(
  lookup,
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup'
);

has(
  lookup,
  'lookup: lookup'
);

has(
  lookup,
  'function reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(options)'
);

has(
  lookup,
  'REOS.Security.requireAdmin();'
);

has(
  lookup,
  "'https://phl.carto.com/api/v2/sql'"
);

has(
  lookup,
  "'opa_properties_public'"
);

has(
  lookup,
  'var MAX_SOURCE_ROWS = 5;'
);

/*
 * Comparison must remain internal-only.
 */
has(
  comparison,
  'REOS.AbsenteeOwnerOwnerEvidenceComparison'
);

has(
  comparison,
  'function compare(ownerEvidence)'
);

has(
  comparison,
  'compare: compare'
);

assert.strictEqual(
  /function\s+reosAbsenteeOwner[A-Za-z0-9_]*Comparison[A-Za-z0-9_]*\s*\(/m
    .test(comparison),
  false,
  'comparison layer unexpectedly exposes a global RPC'
);

/*
 * Classifier must remain internal-only.
 */
has(
  classifier,
  'REOS.AbsenteeOwnerClassification'
);

has(
  classifier,
  'classify: classify'
);

assert.strictEqual(
  /function\s+reosAbsenteeOwner[A-Za-z0-9_]*Classification[A-Za-z0-9_]*\s*\(/m
    .test(classifier),
  false,
  'classifier unexpectedly exposes a global RPC'
);

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'REOS.Database',
  'ScriptApp',
  'LockService'
].forEach(marker => {
  notHas(
    classifier,
    marker,
    'classifier must remain a pure internal transformation: ' + marker
  );
});

/*
 * Existing mutation-capable enrichment RPC is a separate prohibited surface.
 */
has(
  mutationEntrypoint,
  'function reosAbsenteeOwnerEnrichmentCertifySingleRecord(options)'
);

has(
  mutationEntrypoint,
  'REOS.AbsenteeOwnerEnrichmentExecutor.execute'
);

/*
 * Canonical DISTRESS_LEADS address-header authority.
 */
[
  "'Address'",
  "'City'",
  "'State'",
  "'Zip'"
].forEach(marker => {
  has(
    schema,
    marker,
    'protected DISTRESS_LEADS address header missing: ' + marker
  );
});

/*
 * Current integration inventory authority after PR #239.
 */
const componentStart =
  runtimeIntegration.indexOf(
    'const COMPONENT_VALIDATORS = ['
  );

const componentEnd =
  runtimeIntegration.indexOf(
    '];',
    componentStart
  );

assert.ok(
  componentStart >= 0 &&
  componentEnd > componentStart,
  'unable to locate component validator inventory'
);

const componentEntries =
  runtimeIntegration
    .slice(
      componentStart,
      componentEnd
    )
    .match(
      /'validate-[^']+\.js'/g
    ) || [];

assert.strictEqual(
  componentEntries.length,
  72,
  'current component validator inventory must contain exactly 72 validators'
);

const postStart =
  runtimeIntegration.indexOf(
    'const POST_COUNTY_PRODUCTION_FILES = ['
  );

const postEnd =
  runtimeIntegration.indexOf(
    '];',
    postStart
  );

assert.ok(
  postStart >= 0 &&
  postEnd > postStart,
  'unable to locate post-county production inventory'
);

const postEntries =
  runtimeIntegration
    .slice(
      postStart,
      postEnd
    )
    .match(
      /'build\/apps-script-brand\/[^']+\.js'/g
    ) || [];

assert.strictEqual(
  postEntries.length,
  42,
  'current post-county production inventory must contain exactly 42 files'
);

has(
  runtimeIntegration,
  'expected reconciled production inventory must contain 147 files',
  'historical 147-file production inventory authority changed'
);

/*
 * Count required design boundaries.
 */
const boundaryMatch = design.match(
  /## 25\. Required design safety boundaries\n\n([\s\S]*?)\n\n## 26\./
);

assert.ok(
  boundaryMatch,
  'unable to locate required design safety boundary section'
);

const boundaries = boundaryMatch[1]
  .split('\n')
  .filter(line => /^\d+\.\s/.test(line));

assert.strictEqual(
  boundaries.length,
  30,
  'expected exactly 30 required design safety boundaries'
);

/*
 * Count future behavior cases.
 */
const behaviorMatch = design.match(
  /## 26\. Future implementation behavior cases\n\n([\s\S]*?)\n\n## 27\./
);

assert.ok(
  behaviorMatch,
  'unable to locate future behavior case section'
);

const behaviors = behaviorMatch[1]
  .split('\n')
  .filter(line => /^\d+\.\s/.test(line));

assert.strictEqual(
  behaviors.length,
  27,
  'expected exactly 27 future implementation behavior cases'
);

/*
 * Preserve acquisition safety gate.
 */
[
  'adequate comp-supported ARV',
  'adequate repair scope',
  'cannot satisfy, bypass, replace, weaken, or substitute'
].forEach(marker => {
  has(
    design,
    marker,
    'acquisition safety gate marker missing: ' + marker
  );
});

/*
 * Design increment must remain non-runtime and non-production.
 */
[
  'This contract is design authority only.',
  'does not authorize a production',
  'This contract does not create either surface.',
  'This contract does not authorize execution against row 377.'
].forEach(marker => {
  has(design, marker);
});

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_SINGLE_RECORD_READ_ONLY_CERTIFICATION_ENTRYPOINT_CONTRACT_DESIGN_VALID=true'
);

console.log(
  'PLANNED_ENTRYPOINT_RUNTIME=' +
  FUTURE_RUNTIME
);

console.log(
  'PLANNED_ENTRYPOINT_RPC=' +
  'reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord'
);

console.log(
  'PIPELINE_STAGE_COUNT=4'
);

console.log(
  'REQUIRED_DESIGN_BOUNDARY_COUNT=' +
  boundaries.length
);

console.log(
  'FUTURE_BEHAVIOR_CASE_COUNT=' +
  behaviors.length
);

console.log(
  'ADDRESS_AUTHORITY_HEADERS=Address,City,State,Zip'
);

console.log(
  'CURRENT_COMPONENT_VALIDATOR_COUNT=' +
  componentEntries.length
);

console.log(
  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=' +
  postEntries.length
);

console.log(
  'HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true'
);

console.log(
  'COMPARISON_INTERNAL_ONLY=true'
);

console.log(
  'CLASSIFICATION_INTERNAL_ONLY=true'
);

console.log(
  'MUTATION_CAPABLE_ENRICHMENT_RPC_EXCLUDED=true'
);

console.log(
  'PRODUCTION_RPC_CREATED=false'
);

console.log(
  'PRODUCTION_DATA_READ_EXECUTED=false'
);

console.log(
  'PRODUCTION_OPA_LOOKUP_EXECUTED=false'
);

console.log(
  'PRODUCTION_CLASSIFICATION_EXECUTED=false'
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
  'ARV_AUTHORITY=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
