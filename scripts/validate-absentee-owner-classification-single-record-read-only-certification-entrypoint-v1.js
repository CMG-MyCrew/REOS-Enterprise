#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const RUNTIME =
  'build/apps-script-brand/' +
  'AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js';

const DESIGN =
  'docs/' +
  'absentee-owner-classification-single-record-read-only-' +
  'certification-entrypoint-contract-v1.md';

const EXPECTED_DESIGN_SHA =
  '2f7c0281208ff7c28dd9dd69a39b126e140561696bd357751090783ee6e55292';

function read(relative) {
  return fs.readFileSync(
    path.join(ROOT, relative),
    'utf8'
  );
}

function sha256(relative) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(
        path.join(ROOT, relative)
      )
    )
    .digest('hex');
}

assert.ok(
  fs.existsSync(
    path.join(ROOT, RUNTIME)
  ),
  'entrypoint runtime missing'
);

assert.strictEqual(
  sha256(DESIGN),
  EXPECTED_DESIGN_SHA,
  'entrypoint design authority changed'
);

const text =
  read(RUNTIME);

[
  'REOS.AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint',
  'function certifySingleRecord(options)',
  'certifySingleRecord:',
  'function reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord(',
  'REOS.Security.requireAdmin();',

  "'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION_CERTIFICATION'",
  "'absentee_owner_classification_single_record_read_only_certification'",

  "'rowNumber'",
  "'identity'",
  "'Distress Lead ID'",
  "'Canonical Property Key'",

  'REOS.AbsenteeOwnerEnrichmentExactRecordSelector',
  '.exactRecordEvidence(',

  'record.Address',
  'record.City',
  'record.State',
  'record.Zip',

  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  '.lookup(',

  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  '.compare(',

  'REOS.AbsenteeOwnerClassification',
  '.classify(',

  'productionDataMutationAuthorityGranted: false',
  'ownerEvidencePersistenceAuthorityGranted: false',
  'classificationPersistenceAuthorityGranted: false',
  'ownerOccupancyAuthorityGranted: false',
  'vacancyAuthorityGranted: false',
  'qualifiedDealQueueAuthorityGranted: false',
  'acquisitionLifecycleAuthorityGranted: false',
  'arvAuthorityGranted: false',
  'repairScopeAuthorityGranted: false',
  'maoAuthorityGranted: false',
  'offerGenerationAuthorityGranted: false',
  'offerSubmissionAuthorityGranted: false',
  'automaticOfferAuthorityGranted: false'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required runtime marker missing: ' +
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

  'AbsenteeOwnerEnrichmentSanitizer',
  'AbsenteeOwnerEnrichmentPersistenceAdapter',
  'AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',

  'reosConnectorHandleAbsenteeOwners',
  'AcquisitionDistressIntelligence',

  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',

  'ownerNameEvidence',
  'Owner Name',

  'setValue(',
  'setValues(',
  'appendRow(',
  'deleteRow('
].forEach(marker => {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited direct runtime marker present: ' +
      marker
  );
});

const rpcMatches =
  text.match(
    /\bfunction\s+reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord\s*\(/g
  ) || [];

assert.strictEqual(
  rpcMatches.length,
  1,
  'expected exactly one certification RPC'
);

const certifyStart =
  text.indexOf(
    'function certifySingleRecord(options)'
  );

const adminIndex =
  text.indexOf(
    'REOS.Security.requireAdmin();',
    certifyStart
  );

const selectorIndex =
  text.indexOf(
    '.exactRecordEvidence(',
    certifyStart
  );

const lookupIndex =
  text.indexOf(
    '.lookup(',
    certifyStart
  );

const comparisonIndex =
  text.indexOf(
    '.compare(',
    certifyStart
  );

const classifierIndex =
  text.indexOf(
    '.classify(',
    certifyStart
  );

assert.ok(
  certifyStart >= 0 &&
  adminIndex > certifyStart &&
  selectorIndex > adminIndex &&
  lookupIndex > selectorIndex &&
  comparisonIndex > lookupIndex &&
  classifierIndex > comparisonIndex,
  'pipeline call order or admin-first authority changed'
);

assert.strictEqual(
  (text.match(/\.exactRecordEvidence\s*\(/g) || []).length,
  1,
  'selector must be invoked exactly once in runtime'
);

assert.strictEqual(
  (text.match(/\.lookup\s*\(/g) || []).length,
  1,
  'lookup must be invoked exactly once in runtime'
);

assert.strictEqual(
  (text.match(/\.compare\s*\(/g) || []).length,
  1,
  'comparison must be invoked exactly once in runtime'
);

assert.strictEqual(
  (text.match(/\.classify\s*\(/g) || []).length,
  1,
  'classifier must be invoked exactly once in runtime'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_SINGLE_RECORD_READ_ONLY_CERTIFICATION_ENTRYPOINT_STATIC_VALID=true'
);

console.log(
  'DESIGN_AUTHORITY_EXACT=true'
);

console.log(
  'ADMIN_GATE_FIRST=true'
);

console.log(
  'INPUT_KEYS_EXACT=true'
);

console.log(
  'VERIFIED_ROW_ADDRESS_AUTHORITY=true'
);

console.log(
  'PIPELINE_STAGE_COUNT=4'
);

console.log(
  'SELECTOR_INVOCATION_COUNT=1'
);

console.log(
  'LOOKUP_INVOCATION_COUNT=1'
);

console.log(
  'COMPARISON_INVOCATION_COUNT=1'
);

console.log(
  'CLASSIFIER_INVOCATION_COUNT=1'
);

console.log(
  'DIRECT_SPREADSHEET_AUTHORITY=false'
);

console.log(
  'DIRECT_HTTP_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
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
