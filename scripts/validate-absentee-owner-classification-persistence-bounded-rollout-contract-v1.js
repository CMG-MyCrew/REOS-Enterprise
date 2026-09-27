#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const DESIGN =
  path.join(
    ROOT,
    'docs',
    'absentee-owner-classification-persistence-bounded-rollout-contract-v1.md'
  );

const text =
  fs.readFileSync(
    DESIGN,
    'utf8'
  );

function requireText(value) {
  assert(
    text.includes(value),
    'Missing required contract marker: ' + value
  );
}

[
  '# Absentee-Owner Classification Persistence and Bounded Rollout Contract v1',

  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',

  'The evidence store is the durable authority for v1.',

  '`Owner Name`',
  '`Owner Mailing Address`',

  '`Evidence Event ID`',
  '`Observed At UTC`',
  '`Classifier Result SHA-256`',
  '`Previous Evidence SHA-256`',
  '`Evidence Event SHA-256`',

  'Philadelphia Office of Property Assessment',
  'Philadelphia Properties and Assessment History',
  'opa_properties_public',
  'https://phl.carto.com/api/v2/sql',
  'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',

  '`ABSENTEE_OWNER_INDICATED`',
  '`OWNER_MAILING_MATCHED`',
  '`INSUFFICIENT_CLASSIFICATION_EVIDENCE`',
  '`INELIGIBLE_COMPARISON_EVIDENCE`',

  '`ALREADY_PERSISTED`',
  '`GENESIS`',

  '`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED`',
  '`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN`',
  '`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED`',
  '`ABSENTEE_OWNER_CLASSIFICATION_ALREADY_PERSISTED`',

  '`MAX_TARGETS = 10`',
  '`1 -> 5 -> 10`',

  'Targets MUST be processed sequentially.',
  'Version 1 MUST NOT execute target pipelines concurrently.',

  'The uncertain target MUST NOT be retried automatically.',

  'The historical single-record production certification RPC:',
  '`reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord(...)`',
  'is certification authority only.',

  '`reosConnectorHandleAbsenteeOwners`',
  '`AcquisitionDistressIntelligence`',

  'A future materialized/current-classification projection requires a separate',
  'contract.',

  'Automatic MAO or offer authority remains blocked unless both:',
  'adequate comp-supported ARV',
  'adequate repair scope',

  'no DISTRESS_LEADS classification mutation',
  'no owner-name persistence',
  'no retry',
  'no scheduler',
  'no county execution',
  'no occupancy/vacancy inference',
  'no acquisition lifecycle authority',
  'no ARV/repair/MAO/offer authority.'
].forEach(requireText);

const schemaFields = [
  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

schemaFields.forEach((field) => {
  requireText('- `' + field + '`');
});

assert.strictEqual(
  schemaFields.length,
  20
);

const boundarySection =
  text.split(
    '## 30. Required design safety boundaries'
  )[1].split(
    '## 31. Bounded rollout production stages'
  )[0];

const boundaryLines =
  boundarySection
    .split('\n')
    .filter((line) =>
      /^\d+\.\s/.test(line.trim())
    );

assert.strictEqual(
  boundaryLines.length,
  36,
  'Expected exactly 36 design safety boundaries.'
);

const behaviorSection =
  text.split(
    '## 37. Future behavior cases'
  )[1].split(
    '## 38. Future implementation decomposition'
  )[0];

const behaviorLines =
  behaviorSection
    .split('\n')
    .filter((line) =>
      /^\d+\.\s/.test(line.trim())
    );

assert.strictEqual(
  behaviorLines.length,
  32,
  'Expected exactly 32 future behavior cases.'
);

[
  'REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize',
  'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan',
  'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare',
  'REOS.AbsenteeOwnerEnrichmentExecutor.execute'
].forEach((surface) => {
  requireText(surface);
});

const requiredProhibitions = [
  'MUST NOT persist classification by adding generic mutation authority to',
  '`DISTRESS_LEADS`',
  'Classification persistence MUST NOT write `Owner Name` or',
  '`Owner Mailing Address`.',
  'Version 1 MUST NOT add, update, or overwrite a classification field on',
  '`DISTRESS_LEADS`.',
  'Owner names MUST NOT be persisted in the classification evidence store.',
  'It MUST NOT persist the complete raw OPA row.',
  'No caller-supplied hash is trusted.',
  'No prior evidence hash may be rewritten.',
  'Persistence MUST NOT write formulas.',
  'Bounded rollout MUST NOT discover targets.',
  'Duplicate targets MUST fail the whole request before the first production read.',
  'No stage may retry automatically.',
  'the rollout MUST stop immediately.',
  'Version 1 MUST NOT create, install, update, remove, or execute:'
];

requiredProhibitions.forEach(requireText);

assert(
  !text.includes(
    'classification persistence grants automatic offer authority'
  )
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_BOUNDED_ROLLOUT_CONTRACT_VALID=true'
);

console.log(
  'EVIDENCE_STORE_MODE=DEDICATED_APPEND_ONLY'
);

console.log(
  'EVIDENCE_SCHEMA_FIELD_COUNT=20'
);

console.log(
  'MAX_TARGETS=10'
);

console.log(
  'ROLLOUT_STAGES=1,5,10'
);

console.log(
  'DESIGN_SAFETY_BOUNDARY_COUNT=36'
);

console.log(
  'BEHAVIOR_CASE_COUNT=32'
);

console.log(
  'DISTRESS_LEADS_CLASSIFICATION_WRITE_AUTHORIZED=false'
);

console.log(
  'OWNER_NAME_PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'OWNER_MAILING_ADDRESS_PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'SCHEDULER_AUTHORITY_GRANTED=false'
);

console.log(
  'TRIGGER_AUTHORITY_GRANTED=false'
);

console.log(
  'COUNTY_EXECUTION_AUTHORIZED=false'
);

console.log(
  'OWNER_OCCUPANCY_DETERMINATION_AUTHORIZED=false'
);

console.log(
  'VACANCY_DETERMINATION_AUTHORIZED=false'
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
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
