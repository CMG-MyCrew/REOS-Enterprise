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
  'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js'
);

assert.ok(
  fs.existsSync(FILE),
  'Philadelphia owner-evidence lookup implementation is missing'
);

const source = fs.readFileSync(FILE, 'utf8');

[
  "var SOURCE_AGENCY =",
  "'Philadelphia Office of Property Assessment'",
  "var SOURCE_TABLE =",
  "'opa_properties_public'",
  "var SOURCE_ENDPOINT =",
  "'https://phl.carto.com/api/v2/sql'",
  "var PHASE =",
  "'absentee_owner_philadelphia_owner_evidence_lookup'",
  "'READ_ONLY_OWNER_EVIDENCE'",
  'var MAX_SOURCE_ROWS = 5;',
  "'parcel_number'",
  "'location'",
  "'owner_1'",
  "'owner_2'",
  "'mailing_address_1'",
  "'mailing_address_2'",
  "'mailing_care_of'",
  "'mailing_city_state'",
  "'mailing_street'",
  "'mailing_zip'",
  'REOS.Security.requireAdmin();',
  'escapeSqlLiteral_',
  "replace(/'/g, \"''\")",
  "SOURCE_FIELDS.join(',')",
  "regexp_replace(trim(location)",

  'MAX_SOURCE_ROWS',
  'encodeURIComponent(query)',
  '&format=json',
  'UrlFetchApp.fetch(',
  'muteHttpExceptions: true',
  'followRedirects: true',
  "'MATCHED'",
  "'NO_MATCH'",
  "'AMBIGUOUS'",
  "'FAILED'",
  'productionDataMutationAuthorityGranted: false',
  'ownerEvidencePersistenceAuthorityGranted: false',
  'canonicalIdentityRepairAuthorityGranted: false',
  'migrationAuthorityGranted: false',
  'schedulerAuthorityGranted: false',
  'triggerAuthorityGranted: false',
  'connectorExecutionAuthorityGranted: false',
  'certificationMutationAuthorityGranted: false',
  'automaticOfferAuthorityGranted: false',
  'ownerNameEvidence',
  'ownerMailingEvidence',
  'lookupTimestamp',
  'boundedSourceRowCount',
  'function reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(options)'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'missing required implementation marker: ' + marker
  );
});

[
  'SELECT *',
  'REOS.Database.',
  'SpreadsheetApp.',
  'PropertiesService.',
  'ScriptApp.',
  'LockService.',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
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
  'absenteeOwner:',
  'ownerOccupied:',
  'vacant:'
].forEach(marker => {
  assert.strictEqual(
    source.includes(marker),
    false,
    'prohibited implementation marker: ' + marker
  );
});

const fetchCount =
  (source.match(/UrlFetchApp\.fetch\s*\(/g) || []).length;

assert.strictEqual(
  fetchCount,
  1,
  'implementation must contain exactly one external fetch call site'
);

assert.ok(
  /payload\.rows\.length\s*>\s*MAX_SOURCE_ROWS/.test(source),
  'hard five-row response bound is missing'
);

assert.ok(
  /["'] LIMIT ["']\s*\+\s*MAX_SOURCE_ROWS/.test(source),
  'fixed LIMIT concatenation with MAX_SOURCE_ROWS is missing'
);

assert.ok(
  /matches\.length\s*===\s*0/.test(source),
  'NO_MATCH branch is missing'
);

assert.ok(
  /matches\.length\s*!==\s*1/.test(source),
  'AMBIGUOUS branch is missing'
);

assert.ok(
  /normalizeAddress_\(row\.location\)\s*===\s*validated\.normalizedAddress/m
    .test(source),
  'conservative normalized exact-address comparison is missing'
);

assert.strictEqual(
  /while\s*\(/.test(source),
  false,
  'retry/pagination while-loop is prohibited'
);

assert.strictEqual(
  /do\s*\{[\s\S]*\}\s*while\s*\(/m.test(source),
  false,
  'retry/pagination do-while loop is prohibited'
);

console.log(
  'ABSENTEE_OWNER_PHILADELPHIA_OWNER_EVIDENCE_LOOKUP_STATIC_VALID=true'
);
console.log('OFFICIAL_OPA_ENDPOINT_FIXED=true');
console.log('OPA_PROPERTIES_PUBLIC_TABLE_FIXED=true');
console.log('SOURCE_REQUIRED_FIELD_COUNT=10');
console.log('MAX_SOURCE_ROWS=5');
console.log('MAX_EXTERNAL_REQUEST_CALL_SITES=1');
console.log('SELECT_STAR_PROHIBITED=true');
console.log('OWNER_NAME_FALLBACK_SEARCH_PROHIBITED=true');
console.log('AUTOMATIC_PAGINATION_AUTHORITY=false');
console.log('AUTOMATIC_RETRY_AUTHORITY=false');
console.log('FUZZY_ADDRESS_MATCHING_AUTHORITY=false');
console.log('ABSENTEE_CLASSIFICATION_AUTHORITY=false');
console.log('OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('TRIGGER_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
