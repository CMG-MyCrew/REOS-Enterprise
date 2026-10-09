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
  'AbsenteeOwnerClassificationEvidenceStoreV2.js'
);

assert.ok(fs.existsSync(FILE), 'v2 evidence store runtime is missing');

const source = fs.readFileSync(FILE, 'utf8');

[
  'REOS.AbsenteeOwnerClassificationEvidenceStoreV2',
  "var SHEET_NAME =",
  "'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2'",
  'function persist(plan, options)',
  "'AOCE2-'",
  "'GENESIS'",
  'REOS.Database',
  '.assertScriptLockContext',
  'SpreadsheetApp',
  'PropertiesService',
  '.appendRow(row)',
  'SpreadsheetApp.flush()',
  'propertySourceIdentityCertificationSha256',
  'normalLookupEvidenceSha256',
  'ownerEvidenceResultSha256',
  'comparisonResultSha256',
  'classifierResultSha256'
].forEach(marker => {
  assert.ok(source.includes(marker), 'missing v2 store marker: ' + marker);
});

[
  'LockService',
  '.getScriptLock(',
  'UrlFetchApp',
  '.insertSheet(',
  '.deleteSheet(',
  '.deleteRow(',
  '.setValue(',
  '.setValues(',
  '.clear(',
  'REOS.AbsenteeOwnerClassificationEvidenceStore.persist',
  'function reosAbsenteeOwner',
  'DISTRESS_LEADS',
  'Qualified Deal Queue'
].forEach(marker => {
  assert.strictEqual(
    source.includes(marker),
    false,
    'prohibited v2 store marker: ' + marker
  );
});

function extractArray(name) {
  const marker = 'var ' + name + ' = Object.freeze([';
  const start = source.indexOf(marker);
  assert.ok(start >= 0, 'missing array: ' + name);
  const end = source.indexOf(']);', start);
  assert.ok(end > start, 'unterminated array: ' + name);

  return Array.from(
    source.slice(start, end).matchAll(/'([^']+)'/g),
    match => match[1]
  );
}

const headers = extractArray('HEADERS');

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

assert.deepStrictEqual(headers, expectedHeaders);
assert.strictEqual(headers.length, 27);

const planFields = extractArray('PLAN_FIELDS');

assert.deepStrictEqual(planFields, [
  'ok',
  'persistenceContractVersion',
  'classificationContractVersion',
  'target',
  'classificationOutcome',
  'classificationBasis',
  'upstreamComparisonOutcome',
  'differingComponentsJson',
  'normalizedPropertyAddressJson',
  'normalizedMailingAddressJson',
  'sourceAgency',
  'sourceDataset',
  'sourceTable',
  'sourceEndpoint',
  'ownerEvidenceLookupMode',
  'certifiedOpaAccount',
  'propertySourceIdentityCertificationBasis',
  'propertySourceIdentityCertificationSha256',
  'normalLookupEvidenceSha256',
  'ownerEvidenceResultSha256',
  'comparisonResultSha256',
  'classifierResultSha256',
  'evidenceEventId'
]);

const eventIdentityMatch = source.match(
  /function eventIdFor_\(helpers, details\)[\s\S]*?exactKeys_\(\s*details,\s*\[([\s\S]*?)\]\s*\)/
);

assert.ok(eventIdentityMatch, 'AOCE2 exact field declaration missing');

const eventFields =
  Array.from(
    eventIdentityMatch[1].matchAll(/'([^']+)'/g),
    match => match[1]
  );

assert.strictEqual(eventFields.length, 10);

assert.strictEqual(
  (source.match(/return Object\.freeze\(\{[\s\S]*?persist:\s*persist,[\s\S]*?headers:/g) || []).length,
  1,
  'v2 store public surface must expose persist and headers once'
);

assert.strictEqual(
  source.includes('.evidenceEventIdFor('),
  false,
  'AOCE2 must not reuse v1 AOCE event-id helper'
);

console.log('ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_STATIC_VALID=true');
console.log('V2_SCHEMA_COLUMN_COUNT=27');
console.log('V2_PLAN_TOP_LEVEL_FIELD_COUNT=23');
console.log('V2_EVENT_ID_CANONICAL_FIELD_COUNT=10');
console.log('V2_SHEET_NAME_EXACT=true');
console.log('CALLER_OWNED_LOCK_CONTEXT_REQUIRED=true');
console.log('STORE_LOCK_ACQUISITION=false');
console.log('APPEND_ROW_ONLY=true');
console.log('PROVISIONING=false');
console.log('V1_STORE_MUTATION=false');
console.log('PUBLIC_RPC=false');
console.log('DOWNSTREAM_AUTHORITY=false');
