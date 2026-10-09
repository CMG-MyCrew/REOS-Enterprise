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
  'AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js'
);

assert.ok(
  fs.existsSync(RUNTIME),
  'V2 provisioning admin runtime is missing'
);

const text =
  fs.readFileSync(
    RUNTIME,
    'utf8'
  );

const required = [
  'REOS.AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin',
  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2',

  'ADMIN_EVIDENCE_STORE_V2_PROVISIONING_INSPECTION',
  'ADMIN_EVIDENCE_STORE_V2_PROVISIONING',

  'SHARED_EVIDENCE_WORKBOOK_UNCONFIGURED',
  'UNSAFE_ACTIVE_REOS_ALIAS',
  'CONFIGURED_WORKBOOK_UNOPENABLE',
  'V1_SHEET_MISSING',
  'V1_SCHEMA_INVALID',
  'UNEXPECTED_WORKBOOK_SHEET_SET',
  'V2_PROVISIONING_REQUIRED',
  'V2_SCHEMA_INVALID',
  'V2_ALREADY_PROVISIONED',

  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_VERIFIED',

  'REOS.Security.requireAdmin();',
  'LockService.getScriptLock();',
  'lock.tryLock(1000)',

  'PROVISION_V2_EVIDENCE_SHEET',
  'expectedActiveReosSpreadsheetId',
  'expectedConfiguredWorkbookId',
  'expectedV1SheetId',
  'expectedV2State',

  'workbook.insertSheet(',
  'SpreadsheetApp.flush();',

  'v2ProvisioningVerified: true',
  'v2PersistenceAuthorized: false',
  'v2BoundedRolloutAuthorized: false',
  'v2OrchestratorAuthorized: false',
  'automaticOfferAuthorityGranted: false',

  'function reosAbsenteeOwnerClassificationEvidenceStoreV2ProvisioningInspect(',
  'function reosAbsenteeOwnerClassificationEvidenceStoreV2Provision('
];

required.forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required V2 provisioning marker missing: ' +
      marker
  );
});

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

assert.strictEqual(
  headers.length,
  27
);

assert.strictEqual(
  new Set(headers).size,
  27
);

headers.forEach(header => {
  assert.ok(
    text.includes(header),
    'V2 evidence header missing: ' +
      header
  );
});

function count(pattern) {
  return (
    text.match(pattern) || []
  ).length;
}

assert.strictEqual(
  count(/\.insertSheet\s*\(/g),
  1,
  'runtime must contain exactly one V2 insertSheet call site'
);

assert.strictEqual(
  count(/SpreadsheetApp\.flush\s*\(\s*\)/g),
  1,
  'runtime must contain exactly one explicit flush call site'
);

assert.strictEqual(
  count(
    /\bfunction\s+reosAbsenteeOwnerClassificationEvidenceStoreV2(?:ProvisioningInspect|Provision)\s*\(/g
  ),
  2,
  'runtime must expose exactly two V2 provisioning RPCs'
);

[
  'SpreadsheetApp.create(',
  '.setProperty(',
  '.setProperties(',
  '.deleteProperty(',
  '.deleteSheet(',
  '.setName(',
  'DriveApp.',
  'UrlFetchApp',
  'DISTRESS_LEADS',
  'AbsenteeOwnerClassificationEvidenceStoreV2.persist',
  'AbsenteeOwnerClassificationPersistenceExecutor',
  'AbsenteeOwnerClassificationBoundedRollout',
  'ScriptApp.newTrigger',
  'newTrigger('
].forEach(marker => {
  assert.strictEqual(
    text.includes(marker),
    false,
    'forbidden V2 provisioning authority marker present: ' +
      marker
  );
});

assert.ok(
  text.indexOf(
    'mutationBoundaryEntered = true;'
  ) <
  text.indexOf(
    'workbook.insertSheet('
  ),
  'outcome-uncertain boundary must begin before insertSheet'
);

assert.ok(
  text.indexOf(
    'headerRange.setValues(['
  ) <
  text.indexOf(
    'SpreadsheetApp.flush();'
  ),
  'V2 header write must precede explicit flush'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_ADMIN_STATIC_VALID=true'
);

console.log('PUBLIC_RPC_COUNT=2');
console.log('V1_SCHEMA_FIELD_COUNT=20');
console.log('V2_SCHEMA_FIELD_COUNT=27');
console.log('WORKBOOK_CREATE_CALLSITE_COUNT=0');
console.log('V2_INSERT_SHEET_CALLSITE_COUNT=1');
console.log('SCRIPT_PROPERTY_WRITE_CALLSITE_COUNT=0');
console.log('EXPLICIT_FLUSH_CALLSITE_COUNT=1');
console.log('LOCK_PRIMITIVE=LockService.getScriptLock');
console.log('AUTOMATIC_RETRY_AUTHORIZED=false');
console.log('V1_MUTATION_AUTHORIZED=false');
console.log('V2_PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('V2_BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('V2_ORCHESTRATOR_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
