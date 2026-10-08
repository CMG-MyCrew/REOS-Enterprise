#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const FILE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js'
  );

assert.ok(
  fs.existsSync(FILE),
  'certified-account owner-evidence lookup implementation is missing'
);

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

[
  'REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup',
  "'READ_ONLY_OWNER_EVIDENCE'",
  "'absentee_owner_certified_property_source_identity_owner_evidence_lookup'",
  "'certified_opa_account'",
  "'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'",
  "'PROPERTY_SOURCE_IDENTITY_CERTIFIED'",
  "'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT'",
  "'absentee_owner_philadelphia_owner_evidence_lookup'",
  "'exact_property_address'",
  "'Philadelphia Office of Property Assessment'",
  "'Philadelphia Properties and Assessment History'",
  "'opa_properties_public'",
  "'https://phl.carto.com/api/v2/sql'",
  'var MAX_SOURCE_ROWS = 2;',
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
  'propertySourceIdentityCertification',
  'normalLookupEvidence',
  'sourceOpaAccountNum',
  'propertySourceIdentityCertified',
  'rangeContainmentDiagnosticCandidate',
  'rangeContainmentCertifiedMatch',
  'certifiedOpaAccount',
  'REOS.Security.requireAdmin();',
  'UrlFetchApp.fetch(',
  'ownerNameEvidence',
  'ownerMailingEvidence',
  'lookup: lookup'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'required certified-account lookup marker missing: ' + marker
  );
});

[
  'function reosAbsenteeOwnerCertified',
  'REOS.Database',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'REOS.AbsenteeOwnerClassification',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  'AbsenteeOwnerEnrichmentPersistenceAdapter',
  'AbsenteeOwnerEnrichmentExecutor',
  '.setValue(',
  '.setValues(',
  '.appendRow(',
  '.deleteRow(',
  'SELECT *'
].forEach(marker => {
  assert.strictEqual(
    source.includes(marker),
    false,
    'prohibited certified-account lookup marker: ' + marker
  );
});

assert.strictEqual(
  (
    source.match(
      /UrlFetchApp\.fetch\s*\(/g
    ) || []
  ).length,
  1,
  'certified-account lookup must contain exactly one HTTP call site'
);

assert.ok(
  /WHERE parcel_number = ['"]/.test(source),
  'exact OPA account predicate missing'
);

assert.ok(
  /['"] LIMIT ['"]\s*\+\s*MAX_SOURCE_ROWS/.test(source),
  'fixed LIMIT concatenation missing'
);

assert.ok(
  /\/\^\[0-9\]\{9\}\$\//.test(source),
  'strict nine-digit certified account validation missing'
);

assert.strictEqual(
  /regexp_replace\s*\(\s*trim\s*\(\s*location/.test(source),
  false,
  'new lookup must not query OPA by property location'
);

assert.strictEqual(
  /while\s*\(/.test(source),
  false,
  'automatic pagination/retry loop is prohibited'
);

assert.strictEqual(
  /do\s*\{[\s\S]*\}\s*while\s*\(/m.test(source),
  false,
  'automatic do-while pagination/retry loop is prohibited'
);

console.log(
  'ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_STATIC_VALID=true'
);

console.log(
  'CERTIFIED_ACCOUNT_LOOKUP_MODE=certified_opa_account'
);

console.log(
  'MAX_EXTERNAL_REQUEST_CALL_SITES=1'
);

console.log(
  'MAX_SOURCE_ROWS=2'
);

console.log(
  'PUBLIC_RPC_CREATED=false'
);

console.log(
  'DATABASE_OR_SPREADSHEET_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_INVOCATION_AUTHORITY=false'
);

console.log(
  'OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_PAGINATION_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
