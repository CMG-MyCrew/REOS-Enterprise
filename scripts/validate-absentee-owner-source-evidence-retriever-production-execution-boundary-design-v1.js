#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESIGN =
  'docs/absentee-owner-source-evidence-retriever-production-execution-boundary-design-v1.md';

const PREDECESSOR =
  'docs/absentee-owner-source-evidence-retrieval-boundary-contract-design-v1.md';

const IMPLEMENTATION_DESIGN =
  'docs/absentee-owner-source-evidence-retrieval-runtime-implementation-boundary-design-v1.md';

const RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js';

const EXPECTED_PREDECESSOR_SHA =
  '43f3d3bd161b7aea3c317d88149cb212684b52d8d474185e3ecbbce2940accf3';

const EXPECTED_IMPLEMENTATION_DESIGN_SHA =
  '3e6d5af096525a17bbdc74f79ae76c31a05abdcda459b6450ffac4f1aebd3a93';

const EXPECTED_RUNTIME_SHA =
  '4fa560a1e29715b4d7fac39154f1aa44428c8711cefdf1b6c1a4bc340d672844';

function full(relative) {
  return path.join(ROOT, relative);
}

function read(relative) {
  return fs.readFileSync(
    full(relative),
    'utf8'
  );
}

function sha256(relative) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(
        full(relative)
      )
    )
    .digest('hex');
}

assert.ok(
  fs.existsSync(full(DESIGN)),
  'production execution boundary design is missing'
);

assert.strictEqual(
  sha256(PREDECESSOR),
  EXPECTED_PREDECESSOR_SHA,
  'predecessor source-evidence boundary authority changed'
);

assert.strictEqual(
  sha256(IMPLEMENTATION_DESIGN),
  EXPECTED_IMPLEMENTATION_DESIGN_SHA,
  'runtime implementation boundary authority changed'
);

assert.strictEqual(
  sha256(RUNTIME),
  EXPECTED_RUNTIME_SHA,
  'merged source-evidence retriever runtime changed'
);

const text = read(DESIGN);

const required = [
  '# Absentee-Owner Source-Evidence Retriever Production Execution Boundary Design v1',

  'This increment is design only.',
  'It does not create a production entrypoint.',
  'It does not create a global Apps Script RPC.',
  'It does not deploy source.',
  'It does not invoke the retriever against production.',

  '`6fb172858ee3eeb45af1ab9bf78c20a4a08e3ee9`',
  '`37614231830`',

  '`REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever`',
  '`REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.retrieve(options)`',

  '`REOS.AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint`',
  '`build/apps-script-brand/AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js`',
  '`execute(options)`',
  '`reosAbsenteeOwnerSourceEvidenceRetrieveSingleRecord(options)`',

  'manual administrative execution only',
  '`REOS.Security.requireAdmin()`',

  '- `rowNumber`',
  '- `identity`',
  '- `sourceReferences`',

  '`Distress Lead ID`',
  '`Canonical Property Key`',

  '`REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(...)`',
  '`record.Address`',

  '`2`',
  '`5`',

  'The production entrypoint MUST accept `sourceRecordId` only as a canonical positive-decimal string',
  '`^[1-9][0-9]*$`',
  'The future production wrapper MUST NOT coerce numeric values into strings.',
  'That internal representational tolerance MUST NOT broaden the future production-facing RPC contract.',

  '`pa-philadelphia|code_violations|<sourceRecordId>`',

  'zero exact-record target reads',
  'zero ArcGIS requests',

  'invoke the merged source-evidence retriever exactly once',

  '`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`',
  '`RANGE_CONTAINMENT_CERTIFIED_MATCH=true`',
  '`opaAccountRows`',
  '`opa_properties_public`',
  '`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`',

  'Rows 1530 and 1532 remain deferred.',

  'Deployment remains separate',
  'Per-invocation authorization',

  '`PRODUCTION_SOURCE_RETRIEVAL_EXECUTION_AUTHORITY_GRANTED=false`',
  '`SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`',
  '`OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORITY_GRANTED=false`',
  '`OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`',
  '`CLASSIFICATION_AUTHORITY_GRANTED=false`',
  '`PERSISTENCE_AUTHORITY_GRANTED=false`',
  '`ROLLOUT_AUTHORITY_GRANTED=false`',
  '`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`',
  '`ARV_AUTHORITY_GRANTED=false`',
  '`REPAIR_SCOPE_AUTHORITY_GRANTED=false`',
  '`MAO_AUTHORITY_GRANTED=false`',
  '`OFFER_AUTHORITY_GRANTED=false`',

  'Automatic MAO or offer authority remains blocked unless both:',
  'adequate comp-supported ARV',
  'adequate repair scope',

  'No step implies authority for the next step.'
];

for (const marker of required) {
  assert.ok(
    text.includes(marker),
    'missing production-execution design marker: ' +
      marker
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
  'ARV_AUTHORITY_GRANTED=true',
  'REPAIR_SCOPE_AUTHORITY_GRANTED=true',
  'MAO_AUTHORITY_GRANTED=true',
  'OFFER_AUTHORITY_GRANTED=true',

  'Rows 1530 and 1532 are authorized.',
  'batch execution is authorized',
  'scheduler execution is authorized',
  'Automatic retry is authorized.',
  'automatic source-reference discovery is authorized',
  'caller-supplied propertyAddress is authoritative'
];

for (const marker of prohibited) {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited production-execution design marker: ' +
      marker
  );
}

assert.ok(
  text.includes(
    'The production entrypoint MUST NOT directly invoke:'
  )
);

assert.ok(
  text.includes(
    '`REOS.Database`'
  )
);

assert.ok(
  text.includes(
    'The future production wrapper MUST NOT trim or repair a noncanonical source-record identity.'
  )
);

assert.ok(
  text.includes(
    'The caller MUST NOT supply `target.propertyAddress`.'
  )
);

assert.ok(
  text.includes(
    'The exact-record selector is the only authorized production `DISTRESS_LEADS` read authority for this boundary.'
  )
);

assert.ok(
  text.includes(
    'No automatic retry is authorized at any stage.'
  )
);

assert.ok(
  text.includes(
    'A deployed RPC MUST remain dormant until a separately certified invocation is authorized.'
  )
);

assert.ok(
  text.includes(
    'Authorization for one invocation MUST NOT authorize another target.'
  )
);

assert.ok(
  text.includes(
    'numeric `sourceRecordId` rejected'
  )
);

assert.ok(
  text.includes(
    'no evaluator'
  )
);

console.log(
  'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVER_PRODUCTION_EXECUTION_BOUNDARY_DESIGN_VALID=true'
);

console.log(
  'DESIGN_ONLY=true'
);

console.log(
  'MERGED_RUNTIME_AUTHORITY_EXACT=true'
);

console.log(
  'FUTURE_PRODUCTION_ENTRYPOINT_COUNT=1'
);

console.log(
  'FUTURE_GLOBAL_RPC_COUNT=1'
);

console.log(
  'MANUAL_ADMIN_EXECUTION_ONLY=true'
);

console.log(
  'EXACT_RECORD_SELECTOR_REQUIRED=true'
);

console.log(
  'CALLER_PROPERTY_ADDRESS_AUTHORITY=false'
);

console.log(
  'VERIFIED_ROW_ADDRESS_AUTHORITY=true'
);

console.log(
  'MIN_SOURCE_REFERENCES=2'
);

console.log(
  'MAX_SOURCE_REFERENCES=5'
);

console.log(
  'PRODUCTION_SOURCE_RECORD_ID_TYPE=canonical_positive_decimal_string'
);

console.log(
  'NUMERIC_SOURCE_RECORD_ID_PRODUCTION_INPUT_AUTHORIZED=false'
);

console.log(
  'RETRIEVER_INVOCATION_MAX=1'
);

console.log(
  'MAX_EXTERNAL_SOURCE_REQUESTS=5'
);

console.log(
  'SOURCE_REFERENCE_DISCOVERY_AUTHORIZED=false'
);

console.log(
  'BATCH_AUTHORITY=false'
);

console.log(
  'SCHEDULER_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'EVALUATOR_INVOCATION_AUTHORITY=false'
);

console.log(
  'OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORITY=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_AUTHORITY=false'
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

console.log(
  'ROWS_1530_1532_AUTHORIZED=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_EXECUTION_AUTHORIZED=false'
);
