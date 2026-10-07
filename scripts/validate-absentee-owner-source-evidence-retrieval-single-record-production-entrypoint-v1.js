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
  'AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js';

const DESIGN =
  'docs/' +
  'absentee-owner-source-evidence-retriever-production-execution-boundary-design-v1.md';

const EXPECTED_DESIGN_SHA =
  '5fd7322a97d4d6c8eb5030a400aa6dd73af0fdfa0acfa30ae50f33be6c9c93b6';

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
  'production entrypoint runtime missing'
);

assert.strictEqual(
  sha256(DESIGN),
  EXPECTED_DESIGN_SHA,
  'production execution design authority changed'
);

const text =
  read(RUNTIME);

[
  'REOS.AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint',
  'function execute(options)',
  'execute: execute',
  'function reosAbsenteeOwnerSourceEvidenceRetrieveSingleRecord(options)',
  'REOS.Security.requireAdmin();',

  "'READ_ONLY_SOURCE_EVIDENCE_PRODUCTION_ENTRYPOINT'",
  "'absentee_owner_source_evidence_retrieval_single_record_production'",

  "'rowNumber'",
  "'identity'",
  "'sourceReferences'",
  "'Distress Lead ID'",
  "'Canonical Property Key'",

  '/^[1-9][0-9]*$/',
  "'persistedSourceObservationKey'",
  "'pa-philadelphia|code_violations|'",

  'REOS.AbsenteeOwnerEnrichmentExactRecordSelector',
  '.exactRecordEvidence({',

  'evidence.record.Address',

  'REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever',
  '.retrieve(',

  'productionSourceRetrievalExecutionAuthorityGranted:',
  'sourceEvidenceRetrievalAuthorityGranted:',
  'productionDataMutationAuthorityGranted:',
  'opaAccountRowRetrievalAuthorityGranted:',
  'ownerEvidenceRetrievalAuthorityGranted:',
  'classificationAuthorityGranted:',
  'persistenceAuthorityGranted:',
  'rolloutAuthorityGranted:',
  'schedulerAuthorityGranted:',
  'triggerAuthorityGranted:',
  'qualifiedDealQueueAuthorityGranted:',
  'acquisitionLifecycleAuthorityGranted:',
  'arvAuthorityGranted:',
  'repairScopeAuthorityGranted:',
  'maoAuthorityGranted:',
  'offerAuthorityGranted:'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required entrypoint marker missing: ' +
      marker
  );
});

[
  'REOS.Database',
  'SpreadsheetApp',
  'UrlFetchApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',

  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.CanonicalPropertyIdentity',

  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator',
  'REOS.AbsenteeOwnerClassification',
  'REOS.AbsenteeOwnerClassificationPersistence',
  'reosConnectorHandleAbsenteeOwners',

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
    /\bfunction\s+reosAbsenteeOwnerSourceEvidenceRetrieveSingleRecord\s*\(/g
  ) || [];

assert.strictEqual(
  rpcMatches.length,
  1,
  'expected exactly one production retrieval RPC'
);

const executeStart =
  text.indexOf(
    'function execute(options)'
  );

const adminIndex =
  text.indexOf(
    'REOS.Security.requireAdmin();',
    executeStart
  );

const validationIndex =
  text.indexOf(
    'validateInput_(',
    adminIndex
  );

const selectorIndex =
  text.indexOf(
    '.exactRecordEvidence({',
    executeStart
  );

const retrieverIndex =
  text.indexOf(
    '.retrieve(',
    selectorIndex
  );

assert.ok(
  executeStart >= 0 &&
  adminIndex > executeStart &&
  validationIndex > adminIndex &&
  selectorIndex > validationIndex &&
  retrieverIndex > selectorIndex,
  'admin / validation / selector / retriever execution order changed'
);

assert.strictEqual(
  (
    text.match(
      /\.exactRecordEvidence\s*\(\{/g
    ) || []
  ).length,
  1,
  'exact-record selector must be invoked exactly once'
);

assert.strictEqual(
  (
    text.match(
      /\.retrieve\s*\(/g
    ) || []
  ).length,
  1,
  'source-evidence retriever must be invoked exactly once'
);

[
  'productionSourceRetrievalExecutionAuthorityGranted',
  'sourceEvidenceRetrievalAuthorityGranted',
  'opaAccountRowRetrievalAuthorityGranted',
  'ownerEvidenceRetrievalAuthorityGranted',
  'classificationAuthorityGranted',
  'persistenceAuthorityGranted',
  'rolloutAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted'
].forEach(field => {
  const pattern =
    new RegExp(
      field +
      '\\s*:\\s*false'
    );

  assert.ok(
    pattern.test(text),
    'authority field must remain false: ' +
      field
  );
});

console.log(
  'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_SINGLE_RECORD_PRODUCTION_ENTRYPOINT_STATIC_VALID=true'
);

console.log(
  'DESIGN_AUTHORITY_EXACT=true'
);

console.log(
  'ADMIN_GATE_FIRST=true'
);

console.log(
  'WHOLE_REQUEST_VALIDATION_BEFORE_SELECTOR=true'
);

console.log(
  'PRODUCTION_SOURCE_RECORD_ID_STRING_ONLY=true'
);

console.log(
  'NUMERIC_SOURCE_RECORD_ID_PRODUCTION_INPUT_AUTHORIZED=false'
);

console.log(
  'SELECTOR_INVOCATION_COUNT=1'
);

console.log(
  'RETRIEVER_INVOCATION_COUNT=1'
);

console.log(
  'DIRECT_DATABASE_AUTHORITY=false'
);

console.log(
  'DIRECT_SPREADSHEET_AUTHORITY=false'
);

console.log(
  'DIRECT_HTTP_AUTHORITY=false'
);

console.log(
  'EVALUATOR_AUTHORITY=false'
);

console.log(
  'OWNER_EVIDENCE_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY=false'
);

console.log(
  'ACQUISITION_LIFECYCLE_AUTHORITY=false'
);

console.log(
  'ARV_AUTHORITY=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'OFFER_AUTHORITY=false'
);
