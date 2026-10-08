#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js'
);

assert.ok(fs.existsSync(FILE), 'v2 provenance planner implementation is missing');
const source = fs.readFileSync(FILE, 'utf8');

[
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2',
  'function prepare(bundle)',
  'var PERSISTENCE_CONTRACT_VERSION = 2;',
  'var CLASSIFICATION_CONTRACT_VERSION = 1;',
  "'AOCE2-'",
  "'certified_opa_account'",
  "'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT'",
  'REOS.AbsenteeOwnerClassificationPersistencePlanner',
  'typeof planner.canonicalJson',
  'typeof planner.hashCanonicalObject',
  "'propertySourceIdentityCertification'",
  "'normalLookupEvidence'",
  "'ownerEvidenceResult'",
  "'comparisonResult'",
  "'classificationResult'",
  'propertySourceIdentityCertificationSha256',
  'normalLookupEvidenceSha256',
  'ownerEvidenceResultSha256',
  'comparisonResultSha256',
  'classifierResultSha256',
  "'Observed At UTC'",
  "'Previous Evidence SHA-256'",
  "'Evidence Event SHA-256'"
].forEach(marker => {
  assert.ok(source.includes(marker), 'missing implementation marker: ' + marker);
});

[
  'SpreadsheetApp',
  'UrlFetchApp',
  'LockService',
  'PropertiesService',
  'ScriptApp',
  'REOS.Database',
  '.appendRow(',
  '.setValue(',
  '.setValues(',
  '.deleteRow(',
  'SpreadsheetApp.flush',
  'REOS.AbsenteeOwnerClassificationEvidenceStore',
  'REOS.AbsenteeOwnerClassificationPersistenceExecutor',
  'REOS.AbsenteeOwnerClassificationBoundedRollout',
  'REOS.AbsenteeOwnerClassification.classify(',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(',
  'Utilities.computeDigest',
  "require('crypto')",
  'function reosAbsenteeOwner'
].forEach(marker => {
  assert.strictEqual(
    source.includes(marker),
    false,
    'prohibited pure-planner marker: ' + marker
  );
});

function extractArray(name) {
  const marker = 'var ' + name + ' = Object.freeze([';
  const start = source.indexOf(marker);
  assert.ok(start >= 0, 'missing array: ' + name);
  const end = source.indexOf(']);', start);
  assert.ok(end > start, 'unterminated array: ' + name);
  return Array.from(source.slice(start, end).matchAll(/'([^']+)'/g), m => m[1]);
}

const headers = extractArray('V2_EVIDENCE_HEADERS');
const expectedHeaders = [
  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Owner Evidence Lookup Mode',
  'Certified OPA Account',
  'Property Source Identity Certification Basis',
  'Property Source Identity Certification SHA-256',
  'Normal Lookup Evidence SHA-256',
  'Owner Evidence Result SHA-256',
  'Comparison Result SHA-256',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

assert.deepStrictEqual(headers, expectedHeaders, 'v2 27-column schema drifted');
assert.strictEqual(headers.length, 27, 'v2 evidence schema must contain exactly 27 columns');

const storeHeaders = extractArray('STORE_CONTROLLED_HEADERS');
assert.deepStrictEqual(
  storeHeaders,
  [
    'Observed At UTC',
    'Previous Evidence SHA-256',
    'Evidence Event SHA-256'
  ],
  'store-controlled v2 columns drifted'
);
assert.strictEqual(headers.length - storeHeaders.length, 24, 'planner-controlled column count must be 24');

const inputFields = extractArray('INPUT_FIELDS');
assert.deepStrictEqual(
  inputFields,
  [
    'propertySourceIdentityCertification',
    'normalLookupEvidence',
    'ownerEvidenceResult',
    'comparisonResult',
    'classificationResult'
  ],
  'v2 input artifact inventory drifted'
);
assert.strictEqual(inputFields.length, 5, 'v2 input artifact count must be exactly five');

const eventFieldsMatch = source.match(
  /exactKeys_\(\s*details,\s*\[([\s\S]*?)\]\s*\)/m
);
assert.ok(eventFieldsMatch, 'event-id canonical field declaration missing');
const eventFields = Array.from(eventFieldsMatch[1].matchAll(/'([^']+)'/g), m => m[1]);
assert.strictEqual(eventFields.length, 10, 'AOCE2 event identity must contain exactly ten canonical fields');

assert.strictEqual(
  (source.match(/return Object\.freeze\(\{\s*prepare:\s*prepare\s*\}\);/g) || []).length,
  1,
  'v2 planner must expose only prepare'
);

console.log('ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_V2_STATIC_VALID=true');
console.log('PURE_PLANNER=true');
console.log('V2_INPUT_ARTIFACT_COUNT=5');
console.log('V2_EVIDENCE_SCHEMA_COLUMN_COUNT=27');
console.log('V2_PLANNER_CONTROLLED_COLUMN_COUNT=24');
console.log('V2_STORE_CONTROLLED_COLUMN_COUNT=3');
console.log('V2_EVENT_ID_PREFIX=AOCE2-');
console.log('V2_EVENT_ID_CANONICAL_FIELD_COUNT=10');
console.log('REUSES_V1_CANONICAL_HELPERS=true');
console.log('SPREADSHEETAPP=false');
console.log('DATABASE=false');
console.log('URLFETCHAPP=false');
console.log('LOCKSERVICE=false');
console.log('PUBLIC_RPC=false');
console.log('PERSISTENCE_EXECUTION=false');
console.log('CLASSIFICATION_EXECUTION=false');
