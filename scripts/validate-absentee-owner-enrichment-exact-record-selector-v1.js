'use strict';

const fs = require('fs');
const crypto = require('crypto');

const implementationPath =
  'build/apps-script-brand/AbsenteeOwnerEnrichmentExactRecordSelector.js';

const designPath =
  'docs/absentee-owner-exact-record-selector-design-v1.md';

const expectedDesignSha =
  '83520582c74ca87c83417c5a8de895bb891b980ceb56ae8f38731f404f8eb016';

function sha256(path) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path))
    .digest('hex');
}

function requireToken(text, token) {
  if (!text.includes(token)) {
    throw new Error('Missing required token: ' + token);
  }
}

function prohibit(text, token) {
  if (text.includes(token)) {
    throw new Error('Prohibited token present: ' + token);
  }
}

if (!fs.existsSync(implementationPath)) {
  throw new Error('Selector implementation missing.');
}

if (sha256(designPath) !== expectedDesignSha) {
  throw new Error('Selector design authority changed.');
}

const text = fs.readFileSync(implementationPath, 'utf8');

[
  'REOS.AbsenteeOwnerEnrichmentExactRecordSelector',
  'function exactRecordEvidence(options)',
  'REOS.Security.requireAdmin();',
  "var TABLE = 'DISTRESS_LEADS';",
  "var DISTRESS_ID = 'Distress Lead ID';",
  "var CANONICAL_KEY = 'Canonical Property Key';",
  '.getActiveSpreadsheet()',
  '.getSheetByName(TABLE)',
  '.getLastRow()',
  '.getLastColumn()',
  '.getRange(1, 1, 1, lastColumn)',
  '.getRange(validated.rowNumber, 1, 1, lastColumn)',
  'BLANK_PERSISTED_CANONICAL_PROPERTY_KEY',
  'DISTRESS_LEAD_ID_MISMATCH',
  'CANONICAL_PROPERTY_KEY_MISMATCH',
  'productionDataMutationAuthorityGranted: false',
  'canonicalIdentityRepairAuthorityGranted: false',
  'schedulerAuthorityGranted: false',
  'triggerAuthorityGranted: false',
  'certificationMutationAuthorityGranted: false',
  'automaticOfferAuthorityGranted: false',
  'function reosAbsenteeOwnerEnrichmentExactRecordEvidence(options)'
].forEach(function (token) {
  requireToken(text, token);
});

[
  'REOS.Database.getAll',
  'REOS.Database.query',
  'REOS.Database.findById',
  'REOS.Database.insert',
  'REOS.Database.update',
  'REOS.Database.upsert',
  '.setValue(',
  '.setValues(',
  '.appendRow(',
  '.deleteRow(',
  'SpreadsheetApp.flush',
  'ScriptApp.',
  'AbsenteeOwnerEnrichmentSanitizer',
  'AbsenteeOwnerEnrichmentPersistenceAdapter',
  'AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',
  'CanonicalPropertyIdentity',
  'CountyMutationExclusionLease'
].forEach(function (token) {
  prohibit(text, token);
});

const rangeCalls =
  text.match(/\.getRange\s*\(/g) || [];

if (rangeCalls.length !== 2) {
  throw new Error(
    'Expected exactly two physical getRange calls; got ' +
      rangeCalls.length
  );
}

if (
  !/getRange\s*\(\s*1\s*,\s*1\s*,\s*1\s*,\s*lastColumn\s*\)/
    .test(text)
) {
  throw new Error('Header read is not statically height one.');
}

if (
  !/getRange\s*\(\s*validated\.rowNumber\s*,\s*1\s*,\s*1\s*,\s*lastColumn\s*\)/
    .test(text)
) {
  throw new Error('Target read is not statically height one.');
}

console.log('ABSENTEE_OWNER_EXACT_SELECTOR_STATIC_VALIDATION_OK');
console.log('DESIGN_AUTHORITY_EXACT=true');
console.log('ADMIN_REQUIRED=true');
console.log('EXACT_TWO_PHYSICAL_RANGE_READS=true');
console.log('HEADER_READ_HEIGHT_ONE=true');
console.log('TARGET_READ_HEIGHT_ONE=true');
console.log('FULL_TABLE_DATABASE_API_PROHIBITED=true');
console.log('IDENTITY_DERIVATION_PROHIBITED=true');
console.log('MUTATION_SURFACE_PROHIBITED=true');
console.log('CERTIFICATION_CHAIN_CALL_PROHIBITED=true');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
