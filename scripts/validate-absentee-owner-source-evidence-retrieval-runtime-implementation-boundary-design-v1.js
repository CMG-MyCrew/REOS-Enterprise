#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

const DESIGN = path.join(
  ROOT,
  'docs',
  'absentee-owner-source-evidence-retrieval-runtime-implementation-boundary-design-v1.md'
);

assert.ok(
  fs.existsSync(DESIGN),
  'runtime implementation boundary design is missing'
);

const text = fs.readFileSync(DESIGN, 'utf8');

const required = [
  '# Absentee-Owner Source-Evidence Retrieval Runtime Implementation Boundary Design v1',

  '`REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever`',
  '`retrieve(options)`',
  '`REOS.Security.requireAdmin()`',
  '`REOS.CountyAdapters.ArcGIS.fetch`',

  '`PA-PHILADELPHIA`',
  '`code_violations`',
  '`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query`',

  '`sourceReferences`',
  '`sourceRecordId`',
  '`persistedSourceObservationKey`',
  '`pa-philadelphia|code_violations|<sourceRecordId>`',
  '`SOURCE_OBSERVATION_IDENTITY_MISMATCH`',

  '`2`',
  '`5`',

  '`context.limit = 1`',
  '`maxLimit = 1`',
  '`where = objectid = <sourceRecordId>`',
  '`outFields = objectid,address,parcel_id_num,opa_account_num`',
  '`returnGeometry = false`',

  '`SOURCE_RECORD_NOT_FOUND`',
  '`SOURCE_RECORD_AMBIGUOUS`',
  '`SOURCE_RECORD_ID_MISMATCH`',
  '`SOURCE_RECORD_INCOMPLETE`',
  '`SOURCE_RETRIEVAL_FAILED`',
  '`SOURCE_EVIDENCE_READY`',

  '`sourceObservationId`',
  '`propertyAddress`',
  '`parcel_id_num`',
  '`opa_account_num`',

  '`READ_ONLY_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVAL`',
  '`absentee_owner_source_evidence_retrieval`',

  '`opaAccountRows`',
  '`opa_properties_public`',

  '`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`',
  '`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`',

  '`PRODUCTION_SOURCE_RETRIEVAL_EXECUTION_AUTHORITY_GRANTED=false`',
  '`SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`',
  '`OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORITY_GRANTED=false`',
  '`OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`',
  '`CLASSIFICATION_AUTHORITY_GRANTED=false`',
  '`PERSISTENCE_AUTHORITY_GRANTED=false`',
  '`ROLLOUT_AUTHORITY_GRANTED=false`',
  '`IDENTITY_REPAIR_AUTHORITY_GRANTED=false`',
  '`ARV_AUTHORITY_GRANTED=false`',
  '`REPAIR_SCOPE_AUTHORITY_GRANTED=false`',
  '`MAO_AUTHORITY_GRANTED=false`',
  '`OFFER_AUTHORITY_GRANTED=false`',

  'Rows 1530 and 1532 remain deferred.',
  'Implementation existence does not authorize production invocation.',
  'No step implies authority for the next step.'
];

for (const marker of required) {
  assert.ok(
    text.includes(marker),
    'missing required design marker: ' + marker
  );
}

const requiredSafetyStatements = [
  'The retriever MUST NOT query `DISTRESS_LEADS` to discover or repair the target.',
  'The retriever MUST NOT discover sibling records.',
  'Generic county connector normalization MUST NOT be used.',
  'The entire reference set is atomic.',
  'The retriever MUST NOT invoke `REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator` itself.',
  'It MUST NOT query:',
  'The runtime MUST NOT call:',
  'It MUST NOT require zero scheduler triggers.',
  'Implementation validation MUST cover at minimum:',
  'Automatic MAO or offer authority still requires both adequate comp-supported ARV and an adequate repair scope through independently certified paths.'
];

for (const marker of requiredSafetyStatements) {
  assert.ok(
    text.includes(marker),
    'missing safety boundary: ' + marker
  );
}

const prohibited = [
  'PRODUCTION_SOURCE_RETRIEVAL_EXECUTION_AUTHORITY_GRANTED=true',
  'SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=true',
  'OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORITY_GRANTED=true',
  'OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=true',
  'CLASSIFICATION_AUTHORITY_GRANTED=true',
  'PERSISTENCE_AUTHORITY_GRANTED=true',
  'ROLLOUT_AUTHORITY_GRANTED=true',
  'IDENTITY_REPAIR_AUTHORITY_GRANTED=true',
  'ARV_AUTHORITY_GRANTED=true',
  'REPAIR_SCOPE_AUTHORITY_GRANTED=true',
  'MAO_AUTHORITY_GRANTED=true',
  'OFFER_AUTHORITY_GRANTED=true',
  'outFields=*',
  'generic connector normalization is authorized',
  'fuzzy matching is authorized',
  'owner-name matching is authorized',
  'automatic deferred-row processing is authorized',
  'production invocation is authorized'
];

for (const marker of prohibited) {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited design marker present: ' + marker
  );
}

assert.ok(
  text.includes(
    '`build/apps-script-brand/AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js`'
  )
);

assert.ok(
  text.includes(
    'one invocation may perform at most:'
  )
);

assert.ok(
  text.includes(
    'Successful `sourceObservations` MUST preserve the exact order'
  )
);

assert.ok(
  text.includes(
    'No global Apps Script RPC entrypoint is authorized by this design.'
  )
);

assert.ok(
  text.includes(
    'The runtime MUST NOT inspect, create, delete, disable, execute, pause, or otherwise interact with the production county scheduler'
  )
);

console.log(
  'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_RUNTIME_IMPLEMENTATION_BOUNDARY_DESIGN_VALID=true'
);

console.log(
  'FUTURE_RUNTIME=REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever'
);

console.log(
  'SOURCE_CONNECTOR=PA-PHILADELPHIA'
);

console.log(
  'SOURCE_DATASET=code_violations'
);

console.log(
  'SOURCE_LOOKUP_MODE=exact_objectid'
);

console.log(
  'MIN_SOURCE_REFERENCES=2'
);

console.log(
  'MAX_SOURCE_REFERENCES=5'
);

console.log(
  'MAX_EXTERNAL_SOURCE_REQUESTS=5'
);

console.log(
  'SOURCE_PROJECTION=objectid,address,parcel_id_num,opa_account_num'
);

console.log(
  'GENERIC_CONNECTOR_NORMALIZATION_AUTHORIZED=false'
);

console.log(
  'DATABASE_ACCESS_AUTHORIZED=false'
);

console.log(
  'SCHEDULER_INSPECTION_AUTHORIZED=false'
);

console.log(
  'APPS_SCRIPT_RPC_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_SOURCE_RETRIEVAL_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false'
);

console.log(
  'OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORITY_GRANTED=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY_GRANTED=false'
);

console.log(
  'PERSISTENCE_AUTHORITY_GRANTED=false'
);

console.log(
  'ROLLOUT_AUTHORITY_GRANTED=false'
);

console.log(
  'IDENTITY_REPAIR_AUTHORITY_GRANTED=false'
);

console.log(
  'ARV_AUTHORITY_GRANTED=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false'
);

console.log(
  'MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'OFFER_AUTHORITY_GRANTED=false'
);

console.log(
  'RUNTIME_IMPLEMENTATION_CREATED=false'
);
