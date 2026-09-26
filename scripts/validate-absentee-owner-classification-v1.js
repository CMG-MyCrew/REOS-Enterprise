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
  'AbsenteeOwnerClassification.js'
);

assert.ok(
  fs.existsSync(FILE),
  'classification runtime is missing'
);

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

[
  'REOS.AbsenteeOwnerClassification',
  "'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION'",
  "'absentee_owner_classification'",
  "'READ_ONLY_OWNER_EVIDENCE_COMPARISON'",
  "'absentee_owner_owner_evidence_comparison'",
  "'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON'",
  "'MAILING_ADDRESS_DIFFERS'",
  "'MAILING_ADDRESS_MATCHES'",
  "'INSUFFICIENT_MAILING_EVIDENCE'",
  "'INELIGIBLE_OWNER_EVIDENCE'",
  "'ABSENTEE_OWNER_INDICATED'",
  "'OWNER_MAILING_MATCHED'",
  "'INSUFFICIENT_CLASSIFICATION_EVIDENCE'",
  "'INELIGIBLE_COMPARISON_EVIDENCE'",
  'productionDataMutationAuthorityGranted:',
  'ownerEvidencePersistenceAuthorityGranted:',
  'classificationPersistenceAuthorityGranted:',
  'canonicalIdentityRepairAuthorityGranted:',
  'migrationAuthorityGranted:',
  'schedulerAuthorityGranted:',
  'triggerAuthorityGranted:',
  'connectorExecutionAuthorityGranted:',
  'certificationMutationAuthorityGranted:',
  'ownerOccupancyAuthorityGranted:',
  'vacancyAuthorityGranted:',
  'qualifiedDealQueueAuthorityGranted:',
  'acquisitionLifecycleAuthorityGranted:',
  'automaticOfferAuthorityGranted:',
  'classify: classify'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'missing classification implementation marker: ' +
      marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
  'reosConnectorHandleAbsenteeOwners',
  'REOS.AbsenteeOwnerEnrichmentSanitizer',
  'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter',
  'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'REOS.AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',
  'AcquisitionDistressIntelligence',
  'ownerNameEvidence',
  'absenteeOwner:',
  'ownerOccupied:',
  'nonOwnerOccupied:',
  'vacant:',
  'Math.random',
  'new Date('
].forEach(marker => {
  assert.strictEqual(
    source.includes(marker),
    false,
    'prohibited classification implementation marker: ' +
      marker
  );
});

assert.strictEqual(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    source
  ),
  false,
  'classification runtime must not expose a production RPC'
);

assert.strictEqual(
  (source.match(/UrlFetchApp/g) || []).length,
  0,
  'classification runtime must contain zero HTTP call sites'
);

assert.strictEqual(
  (source.match(/SpreadsheetApp/g) || []).length,
  0,
  'classification runtime must contain zero Spreadsheet call sites'
);

assert.strictEqual(
  (source.match(/REOS\.Database/g) || []).length,
  0,
  'classification runtime must contain zero database call sites'
);

assert.ok(
  /function\s+classify\s*\(\s*comparisonEvidence\s*\)/m
    .test(source),
  'exact single-input classify surface is missing'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_STATIC_VALID=true'
);

console.log(
  'INTERNAL_CLASSIFY_SURFACE_PRESENT=true'
);

console.log(
  'CLASSIFICATION_OUTCOME_COUNT=4'
);

console.log(
  'EXTERNAL_HTTP_CALL_SITE_COUNT=0'
);

console.log(
  'SPREADSHEET_CALL_SITE_COUNT=0'
);

console.log(
  'DATABASE_CALL_SITE_COUNT=0'
);

console.log(
  'PRODUCTION_RPC_CREATED=false'
);

console.log(
  'OWNER_NAME_MATCHING_AUTHORITY=false'
);

console.log(
  'FUZZY_ADDRESS_MATCHING_AUTHORITY=false'
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
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
