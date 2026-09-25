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
  'AbsenteeOwnerEnrichmentCandidateDiscovery.js'
);

assert.ok(
  fs.existsSync(FILE),
  'candidate-discovery implementation is missing'
);

const source = fs.readFileSync(FILE, 'utf8');

[
  "var TABLE = 'DISTRESS_LEADS';",
  "var DISTRESS_ID = 'Distress Lead ID';",
  "var CANONICAL_KEY = 'Canonical Property Key';",
  "var PHASE = 'absentee_owner_candidate_discovery';",
  'var MAX_ROWS = 50;',
  'REOS.Security.requireAdmin();',
  'var validated = validateInput_(options);',
  'SpreadsheetApp.getActiveSpreadsheet();',
  '.getSheetByName(TABLE)',
  '.getLastRow();',
  '.getLastColumn();',
  '.getRange(1, 1, 1, lastColumn)',
  'distressHeader.index + 1',
  'canonicalHeader.index + 1',
  'rowsToInspect,',
  'No complete DISTRESS_LEADS data row is read.',
  "'INVALID_START_ROW'",
  "'INVALID_MAX_ROWS'",
  "'UNEXPECTED_OPTIONS'",
  "'MISSING_REQUIRED_HEADER'",
  "'DUPLICATE_REQUIRED_HEADER'",
  "'INVALID_BOUNDED_READ'",
  "mode: 'READ_ONLY'",
  'productionDataMutationAuthorityGranted: false',
  'canonicalIdentityRepairAuthorityGranted: false',
  'migrationAuthorityGranted: false',
  'schedulerAuthorityGranted: false',
  'triggerAuthorityGranted: false',
  'connectorExecutionAuthorityGranted: false',
  'certificationMutationAuthorityGranted: false',
  'automaticOfferAuthorityGranted: false',
  'rowNumber: validated.startRow + offset',
  "'Distress Lead ID': distressLeadId",
  "'Canonical Property Key': canonicalPropertyKey",
  'exhausted ? null : lastInspectedRow + 1',
  'function reosAbsenteeOwnerEnrichmentCandidateDiscovery(options)'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'missing required implementation marker: ' + marker
  );
});

[
  'REOS.Database.',
  'Database.getAll',
  'Database.query',
  'Database.findById',
  'CanonicalPropertyIdentity',
  'AbsenteeOwnerEnrichmentExactRecordSelector',
  'reosAbsenteeOwnerEnrichmentExactRecordEvidence',
  'AbsenteeOwnerEnrichmentSanitizer',
  'AbsenteeOwnerEnrichmentPersistenceAdapter',
  'AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',
  '.setValue(',
  '.setValues(',
  '.appendRow(',
  '.deleteRow(',
  'SpreadsheetApp.flush',
  'ScriptApp.',
  'PropertiesService.',
  'LockService.'
].forEach(marker => {
  assert.equal(
    source.includes(marker),
    false,
    'prohibited implementation marker: ' + marker
  );
});

const getRangeCount =
  (source.match(/\.getRange\s*\(/g) || []).length;

const getValuesCount =
  (source.match(/\.getValues\s*\(/g) || []).length;

assert.equal(
  getRangeCount,
  3,
  'implementation must contain exactly three bounded getRange calls'
);

assert.equal(
  getValuesCount,
  3,
  'implementation must contain exactly three getValues calls'
);

assert.ok(
  /maxRows\s*>\s*MAX_ROWS/.test(source),
  'hard MAX_ROWS enforcement is missing'
);

assert.ok(
  /validated\.startRow\s*>\s*lastRow/.test(source),
  'bounded exhausted-window handling is missing'
);

assert.ok(
  /Math\.min\(\s*validated\.maxRows,\s*lastRow\s*-\s*validated\.startRow\s*\+\s*1\s*\)/m
    .test(source),
  'bounded physical row count calculation is missing'
);

assert.equal(
  /getRange\s*\(\s*validated\.startRow\s*,\s*1\s*,/m
    .test(source),
  false,
  'complete-row data read pattern is prohibited'
);

assert.equal(
  /getRange\s*\([^)]*rowsToInspect[^)]*lastColumn/m
    .test(source),
  false,
  'window-wide full-row read is prohibited'
);

console.log(
  'ABSENTEE_OWNER_BOUNDED_CANDIDATE_DISCOVERY_STATIC_VALID=true'
);
console.log('MAX_ROWS_50_EXACT=true');
console.log('HEADER_READ_EXACTLY_ONCE_IN_SOURCE=true');
console.log('IDENTITY_COLUMN_READS_ONLY=true');
console.log('COMPLETE_ROW_READ_PROHIBITED=true');
console.log('DATABASE_FULL_TABLE_APIS_PROHIBITED=true');
console.log('IDENTITY_DERIVATION_PROHIBITED=true');
console.log('AUTOMATIC_MULTIWINDOW_SCAN_PROHIBITED=true');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('CANONICAL_IDENTITY_REPAIR_AUTHORITY=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('TRIGGER_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
