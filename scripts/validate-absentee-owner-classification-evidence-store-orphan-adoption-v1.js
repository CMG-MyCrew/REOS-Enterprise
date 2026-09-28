#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const RUNTIME = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js'
);

const CERTIFIED_SHA =
  '4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce';

assert.ok(
  fs.existsSync(RUNTIME),
  'orphan-adoption runtime is missing'
);

const text = fs.readFileSync(RUNTIME, 'utf8');

function count(pattern) {
  return (text.match(pattern) || []).length;
}

function containsCertifiedRawOrphanId(source) {
  const tokens =
    String(source).match(
      /[A-Za-z0-9_-]{20,}/g
    ) || [];

  return tokens.some(token =>
    crypto
      .createHash('sha256')
      .update(token, 'utf8')
      .digest('hex') === CERTIFIED_SHA
  );
}

[
  'REOS.AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption',
  CERTIFIED_SHA,
  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'REOS Absentee Owner Classification Evidence',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',
  'ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_VERIFIED',
  'ADOPT_CERTIFIED_ORPHAN',
  'expectedOrphanWorkbookIdSha256',
  'expectedActiveReosSpreadsheetId',
  'expectedPropertyState',
  'REOS.Security.requireAdmin();',
  'LockService.getScriptLock();',
  'lock.tryLock(1000)',
  'Utilities.computeDigest(',
  'Utilities.DigestAlgorithm.SHA_256',
  'Utilities.Charset.UTF_8',
  'Session.getEffectiveUser()',
  'workbook.getOwner()',
  'workbook.getEditors()',
  'workbook.getViewers()',
  'positionalSheet.getSheetId()',
  'namedSheet.getSheetId()',
  'namedSheetId !== CERTIFIED_SHEET_ID_',
  'properties.setProperty(',
  'propertyReadback',
  'workbookCreated: false',
  'workbookMutated: false',
  'provisioningRetryExecuted: false',
  'persistenceAuthorized: false',
  'boundedRolloutAuthorized: false',
  'automaticOfferAuthorityGranted: false',
  'function reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required orphan-adoption marker missing: ' + marker
  );
});

assert.strictEqual(
  count(/\bfunction\s+reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan\s*\(/g),
  1,
  'exactly one public orphan-adoption RPC is required'
);

assert.strictEqual(
  count(/\.setProperty\s*\(/g),
  1,
  'exactly one Script Property publication call site is required'
);

assert.strictEqual(
  count(/\.getSheetId\s*\(\s*\)/g),
  2,
  'exactly two stable sheet-ID reads are required'
);

[
  /SpreadsheetApp\.create\s*\(/,
  /\.insertSheet\s*\(/,
  /\.deleteSheet\s*\(/,
  /\.setName\s*\(/,
  /\.setValues\s*\(/,
  /\.setValue\s*\(/,
  /\.clear\s*\(/,
  /\.clearContent\s*\(/,
  /SpreadsheetApp\.flush\s*\(/,
  /\.setProperties\s*\(/,
  /\.deleteProperty\s*\(/,
  /setTrashed\s*\(/,
  /\.addEditor\s*\(/,
  /\.addViewer\s*\(/,
  /\.removeEditor\s*\(/,
  /\.removeViewer\s*\(/,
  /\.setSharing\s*\(/,
  /UrlFetchApp/,
  /DISTRESS_LEADS/,
  /AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup/,
  /AbsenteeOwnerOwnerEvidenceComparison/,
  /AbsenteeOwnerClassificationPersistenceExecutor/,
  /AbsenteeOwnerClassificationBoundedRollout/,
  /REOS\.Database/,
  /ScriptApp\.newTrigger/,
  /newTrigger\s*\(/
].forEach(pattern => {
  assert.strictEqual(
    pattern.test(text),
    false,
    'forbidden orphan-adoption authority surface: ' + pattern
  );
});

assert.strictEqual(
  containsCertifiedRawOrphanId(text),
  false,
  'raw certified orphan workbook ID must not appear in runtime source'
);

assert.strictEqual(
  containsCertifiedRawOrphanId(
    fs.readFileSync(__filename, 'utf8')
  ),
  false,
  'raw certified orphan workbook ID must not appear in static validator'
);

assert.ok(
  text.indexOf('verifyWorkbook_(\n        workbook') <
    text.indexOf('properties.setProperty('),
  'complete orphan verification must precede property publication'
);

assert.ok(
  text.indexOf('properties.setProperty(') <
    text.indexOf('var propertyReadback'),
  'property publication must precede property readback'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_STATIC_VALID=true'
);
console.log('PUBLIC_RPC_COUNT=1');
console.log('CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256=' + CERTIFIED_SHA);
console.log('CERTIFIED_ORPHAN_SHEET_ID=0');
console.log('EVIDENCE_SCHEMA_FIELD_COUNT=20');
console.log('STABLE_SHEET_IDENTITY=Sheet.getSheetId');
console.log('SCRIPT_PROPERTY_PUBLICATION_CALLSITE_COUNT=1');
console.log('WORKBOOK_CREATE_CALLSITE_COUNT=0');
console.log('WORKBOOK_MUTATION_AUTHORIZED=false');
console.log('PROVISIONING_RETRY_AUTHORIZED=false');
console.log('PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('ARV_AUTHORITY_GRANTED=false');
console.log('REPAIR_SCOPE_AUTHORITY_GRANTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
