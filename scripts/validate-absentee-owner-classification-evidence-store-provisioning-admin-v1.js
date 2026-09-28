#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RUNTIME = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js'
);

assert.ok(
  fs.existsSync(RUNTIME),
  'provisioning admin runtime is missing'
);

const text = fs.readFileSync(RUNTIME, 'utf8');

const required = [
  'REOS.AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin',
  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'REOS Absentee Owner Classification Evidence',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',
  'ADMIN_EVIDENCE_STORE_PROVISIONING_INSPECTION',
  'ADMIN_EVIDENCE_STORE_PROVISIONING',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED',
  'REOS.Security.requireAdmin();',
  'LockService.getScriptLock();',
  'lock.tryLock(1000)',
  'SpreadsheetApp.create(',
  'SpreadsheetApp.flush();',
  'properties.setProperty(',
  'expectedActiveReosSpreadsheetId',
  'expectedPropertyState',
  "options.expectedPropertyState !== 'ABSENT'",
  'typeof positionalSheet.getSheetId',
  'typeof sheet.getSheetId',
  'positionalSheet.getSheetId()',
  'sheet.getSheetId()',
  'positionalSheetId !== namedSheetId',
  'persistenceAuthorized: false',
  'boundedRolloutAuthorized: false',
  'automaticOfferAuthorityGranted: false',
  'function reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(options)',
  'function reosAbsenteeOwnerClassificationEvidenceStoreProvision(options)'
];

required.forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required provisioning marker missing: ' + marker
  );
});

assert.strictEqual(
  text.includes('sheets[0] !== sheet'),
  false,
  'wrapper reference identity must not remain physical sheet authority'
);

const headers = [
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
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

assert.strictEqual(new Set(headers).size, 20);

headers.forEach(header => {
  assert.ok(
    text.includes(header),
    'header missing: ' + header
  );
});

function count(pattern) {
  return (text.match(pattern) || []).length;
}

assert.strictEqual(
  count(/SpreadsheetApp\.create\s*\(/g),
  1,
  'runtime must contain exactly one SpreadsheetApp.create call site'
);

assert.strictEqual(
  count(/SpreadsheetApp\.flush\s*\(\s*\)/g),
  1,
  'runtime must contain exactly one explicit SpreadsheetApp.flush call site'
);

assert.strictEqual(
  count(/\.setProperty\s*\(/g),
  1,
  'runtime must contain exactly one Script Property publication call site'
);

assert.strictEqual(
  count(/\.getSheetId\s*\(\s*\)/g),
  2,
  'provisioning verifier must perform exactly two stable sheet-ID reads'
);

assert.strictEqual(
  count(/\bfunction\s+reosAbsenteeOwnerClassificationEvidenceStore(?:ProvisioningInspect|Provision)\s*\(/g),
  2,
  'runtime must expose exactly two provisioning RPCs'
);

[
  'insertSheet(',
  '.setProperties(',
  '.deleteProperty(',
  '.deleteSheet(',
  '.deleteFile(',
  'DriveApp.getFileById',
  'setTrashed(',
  'UrlFetchApp',
  'DISTRESS_LEADS',
  'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'AbsenteeOwnerOwnerEvidenceComparison',
  'AbsenteeOwnerClassificationPersistenceExecutor',
  'AbsenteeOwnerClassificationBoundedRollout',
  'REOS.Database',
  'withScriptLockContext',
  'newTrigger(',
  'ScriptApp.newTrigger',
  'setProperty(PROPERTY_KEY, options',
  'setProperty(options'
].forEach(marker => {
  assert.strictEqual(
    text.includes(marker),
    false,
    'forbidden provisioning authority marker present: ' + marker
  );
});

assert.ok(
  text.indexOf('verifyProvisionedWorkbook_(\n        workbook') <
    text.indexOf('properties.setProperty('),
  'pre-publication workbook/schema verification must precede property publication'
);

assert.ok(
  text.indexOf('properties.setProperty(') <
    text.indexOf('SpreadsheetApp.openById(\n          propertyReadback'),
  'property publication must precede post-publication reopen verification'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_ADMIN_STATIC_VALID=true'
);
console.log('PUBLIC_RPC_COUNT=2');
console.log('EVIDENCE_SCHEMA_FIELD_COUNT=20');
console.log('STABLE_SHEET_IDENTITY=Sheet.getSheetId');
console.log('WRAPPER_REFERENCE_IDENTITY_AUTHORIZED=false');
console.log('STABLE_SHEET_ID_READ_CALLSITE_COUNT=2');
console.log('WORKBOOK_CREATE_CALLSITE_COUNT=1');
console.log('EXPLICIT_FLUSH_CALLSITE_COUNT=1');
console.log('SCRIPT_PROPERTY_PUBLICATION_CALLSITE_COUNT=1');
console.log('LOCK_PRIMITIVE=LockService.getScriptLock');
console.log('LOCK_ACQUISITION=tryLock(1000)');
console.log('DATABASE_LOCK_CONTEXT_AUTHORIZED=false');
console.log('RUNTIME_SELF_PROVISIONING_AUTHORITY=true');
console.log('PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_RETRY_AUTHORIZED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
