#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(
  __dirname,
  '..'
);

const DESIGN = path.join(
  ROOT,
  'docs',
  'absentee-owner-source-evidence-retrieval-boundary-contract-design-v1.md'
);

assert.ok(
  fs.existsSync(DESIGN),
  'source-evidence retrieval boundary design is missing'
);

const text = fs.readFileSync(
  DESIGN,
  'utf8'
);

const required = [
  '# Absentee-Owner Source-Evidence Retrieval Boundary Contract Design v1',

  '`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`',
  '`sourceObservations`',

  '`PA-PHILADELPHIA`',
  '`code_violations`',

  '`parcel_id_num`',
  '`opa_account_num`',
  '`Parcel ID`',

  '`objectid`',
  '`pa-philadelphia|code_violations|<objectid>`',

  '`2`',
  '`5`',

  '`objectid = <certified-objectid>`',
  '`maxLimit = 1`',
  '`returnGeometry = false`',
  '`objectid,address,parcel_id_num,opa_account_num`',

  '`SOURCE_RECORD_NOT_FOUND`',
  '`SOURCE_RECORD_AMBIGUOUS`',
  '`SOURCE_RECORD_ID_MISMATCH`',
  '`SOURCE_RECORD_INCOMPLETE`',
  '`SOURCE_RETRIEVAL_FAILED`',
  '`SOURCE_EVIDENCE_READY`',

  '`REOS.CountyCodeViolationSourceRecordDiagnostic`',

  'The new future source-evidence boundary MUST NOT require the production county',
  'scheduler to be absent.',

  'Partial evidence MUST NOT be passed to the range evaluator.',

  '`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`',
  '`CLASSIFICATION_AUTHORITY_GRANTED=false`',
  '`PERSISTENCE_AUTHORITY_GRANTED=false`',
  '`ROLLOUT_AUTHORITY_GRANTED=false`',
  '`IDENTITY_REPAIR_AUTHORITY_GRANTED=false`',
  '`SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`',

  'Rows 1530 and 1532 remain deferred.',

  'Successful design creation does not authorize implementation.',

  'Automatic MAO or offer authority still requires both adequate comp-supported',
  'ARV and an adequate repair scope through independently certified paths.',

  'No step implies authority for the next step.'
];

for (const marker of required) {
  assert.ok(
    text.includes(marker),
    'missing required design marker: ' + marker
  );
}

const prohibited = [
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=true',
  'CLASSIFICATION_AUTHORITY_GRANTED=true',
  'PERSISTENCE_AUTHORITY_GRANTED=true',
  'ROLLOUT_AUTHORITY_GRANTED=true',
  'IDENTITY_REPAIR_AUTHORITY_GRANTED=true',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=true',

  'outFields=* is authorized',
  'delete the county scheduler trigger',
  'opa_account_num replaces Parcel ID',
  'opa_account_num replaces the Canonical Property Key',
  'fuzzy matching is authorized',
  'owner-name matching is authorized',
  'automatic deferred-row processing is authorized'
];

for (const marker of prohibited) {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited design marker present: ' + marker
  );
}

const identityDomainMarkers = [
  '`sourceRecordId` is the exact raw ArcGIS `objectid` used for external retrieval.',
  '`persistedSourceObservationKey` is the existing REOS `Source Observation Key`, when supplied, and MUST be preserved without mutation.',
  '`sourceObservationId` is the canonical composite evaluator observation identity derived from `sourceRecordId`.',
  'The boundary MUST NOT substitute raw `objectid` for the composite `sourceObservationId`.',
  '`SOURCE_OBSERVATION_IDENTITY_MISMATCH`',
  'The boundary MUST NOT repair either identity value.'
];

for (const marker of identityDomainMarkers) {
  assert.ok(
    text.includes(marker),
    'identity-domain boundary missing: ' + marker
  );
}

const exactDesignOnly = [
  'This increment creates only:',
  '- this source-evidence retrieval boundary design document.',
  'The next separately authorized design artifact may be:',
  '- its offline design validator.',
  'This increment MUST NOT create:',
  '- source retrieval runtime;',
  '- HTTP implementation;',
  '- Apps Script RPC;',
  '- production wiring;',
  '- persistence logic;',
  '- classification logic;',
  '- scheduler logic;',
  '- trigger logic;',
  '- OPA-account-row lookup implementation.'
];

for (const marker of exactDesignOnly) {
  assert.ok(
    text.includes(marker),
    'design-only boundary missing: ' + marker
  );
}

assert.ok(
  text.includes(
    'The retriever MUST NOT broadly scan `DISTRESS_LEADS` to discover siblings.'
  )
);

assert.ok(
  text.includes(
    'Each certified reference is retrieved independently using exact:'
  )
);

assert.ok(
  text.includes(
    'No `outFields=*` is authorized by this contract.'
  )
);

assert.ok(
  text.includes(
    'The generic county connector normalization MUST NOT be used for the returned'
  )
);

assert.ok(
  text.includes(
    'The future OPA-account-row retrieval required for:'
  )
);

assert.ok(
  text.includes(
    'remains a separate authorization boundary.'
  )
);

assert.ok(
  text.includes(
    '`pa-philadelphia|code_violations|383`'
  )
);

assert.ok(
  text.includes(
    '`pa-philadelphia|code_violations|384`'
  )
);

assert.ok(
  text.includes(
    'This design retrieves neither record.'
  )
);

console.log(
  'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_BOUNDARY_CONTRACT_DESIGN_VALID=true'
);

console.log(
  'SOURCE_CONNECTOR=PA-PHILADELPHIA'
);

console.log(
  'SOURCE_DATASET=code_violations'
);

console.log(
  'SOURCE_RECORD_ID_FIELD=objectid'
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
  'SOURCE_PROJECTION=objectid,address,parcel_id_num,opa_account_num'
);

console.log(
  'GENERIC_CONNECTOR_NORMALIZATION_AUTHORIZED=false'
);

console.log(
  'SCHEDULER_ABSENCE_REQUIRED=false'
);

console.log(
  'TRIGGER_INSPECTION_AUTHORIZED=false'
);

console.log(
  'DISTRESS_LEADS_MUTATION_AUTHORIZED=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_AUTHORIZED=false'
);

console.log(
  'OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORIZED=false'
);

console.log(
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=false'
);

console.log(
  'SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false'
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
  'PRODUCTION_RUNTIME_CREATED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
