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
  'AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js'
);

assert.ok(
  fs.existsSync(FILE),
  'source-evidence retriever implementation is missing'
);

const source = fs.readFileSync(
  FILE,
  'utf8'
);

[
  'REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever',
  'function retrieve(options)',
  'REOS.Security.requireAdmin();',
  'REOS.CountyAdapters.ArcGIS.fetch({',
  "'READ_ONLY_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVAL'",
  "'absentee_owner_source_evidence_retrieval'",
  "'PA-PHILADELPHIA'",
  "'code_violations'",
  "'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query'",
  "'objectid,address,parcel_id_num,opa_account_num'",
  'var MIN_REFERENCES = 2;',
  'var MAX_REFERENCES = 5;',
  "cursor: ''",
  'limit: 1',
  'maxLimit: 1',
  "'objectid = ' +",
  'returnGeometry:',
  "'SOURCE_OBSERVATION_IDENTITY_MISMATCH'",
  "'SOURCE_RECORD_NOT_FOUND'",
  "'SOURCE_RECORD_AMBIGUOUS'",
  "'SOURCE_RECORD_ID_MISMATCH'",
  "'SOURCE_RECORD_INCOMPLETE'",
  "'SOURCE_RETRIEVAL_FAILED'",
  "'SOURCE_EVIDENCE_READY'",
  'sourceObservationId:',
  'propertyAddress:',
  'parcel_id_num:',
  'opa_account_num:',
  'requestedReferenceCount:',
  'retrievedObservationCount:',
  'sourceObservations:'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'missing implementation marker: ' + marker
  );
});

[
  'UrlFetchApp.',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.CanonicalPropertyIdentity',
  'PropertiesService',
  'ScriptApp',
  'SpreadsheetApp',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator',
  'opa_properties_public',
  'reosAbsenteeOwner',
  '.setValue(',
  '.setValues(',
  '.appendRow(',
  '.deleteRow(',
  'SpreadsheetApp.flush'
].forEach(marker => {
  assert.strictEqual(
    source.includes(marker),
    false,
    'prohibited implementation marker: ' + marker
  );
});

assert.strictEqual(
  (source.match(
    /REOS\.CountyAdapters\.ArcGIS\.fetch\s*\(/g
  ) || []).length,
  1,
  'there must be exactly one ArcGIS fetch call site'
);

assert.strictEqual(
  /\.sort\s*\(/.test(source),
  false,
  'source references must not be sorted or reordered'
);

assert.strictEqual(
  /while\s*\(/.test(source),
  false,
  'automatic pagination/retry while-loop is prohibited'
);

assert.strictEqual(
  /do\s*\{[\s\S]*\}\s*while\s*\(/m.test(source),
  false,
  'automatic pagination/retry do-while loop is prohibited'
);

assert.ok(
  source.includes(
    'productionSourceRetrievalExecutionAuthorityGranted:'
  )
);

[
  'productionSourceRetrievalExecutionAuthorityGranted',
  'sourceEvidenceRetrievalAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'opaAccountRowRetrievalAuthorityGranted',
  'ownerEvidenceRetrievalAuthorityGranted',
  'classificationAuthorityGranted',
  'persistenceAuthorityGranted',
  'rolloutAuthorityGranted',
  'identityRepairAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted'
].forEach(field => {
  assert.ok(
    new RegExp(
      field +
      '\\s*:\\s*false'
    ).test(source),
    'authority must remain false: ' + field
  );
});

console.log(
  'ABSENTEE_OWNER_PHILADELPHIA_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVER_STATIC_VALID=true'
);
console.log('INTERNAL_RETRIEVE_ONLY=true');
console.log('REQUIRE_ADMIN=true');
console.log('FIXED_ENDPOINT=true');
console.log('MIN_SOURCE_REFERENCES=2');
console.log('MAX_SOURCE_REFERENCES=5');
console.log('MAX_EXTERNAL_SOURCE_REQUESTS=5');
console.log('ARCGIS_ADAPTER_ONLY=true');
console.log('DIRECT_URLFETCHAPP=false');
console.log('GLOBAL_RPC=false');
console.log('DATABASE_ACCESS=false');
console.log('SCHEDULER_INTERACTION=false');
console.log('OWNER_EVIDENCE_RETRIEVAL=false');
console.log('OPA_ACCOUNT_ROW_RETRIEVAL=false');
console.log('EVALUATOR_INVOCATION=false');
console.log('CLASSIFICATION_AUTHORITY=false');
console.log('PERSISTENCE_AUTHORITY=false');
console.log('OFFER_AUTHORITY=false');
