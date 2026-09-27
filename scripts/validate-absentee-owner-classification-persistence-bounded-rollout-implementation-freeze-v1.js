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
    'absentee-owner-classification-persistence-bounded-rollout-implementation-freeze-v1.md'
  );

const text =
  fs.readFileSync(
    DESIGN,
    'utf8'
  );

function has(marker) {
  assert(
    text.includes(marker),
    'Missing freeze marker: ' + marker
  );
}

[
  '# Absentee-Owner Classification Persistence and Bounded Rollout Implementation Freeze v1',

  'AbsenteeOwnerClassificationPersistencePlanner.js',
  'AbsenteeOwnerClassificationEvidenceStore.js',
  'AbsenteeOwnerClassificationPersistenceExecutor.js',
  'AbsenteeOwnerClassificationBoundedRollout.js',

  'validate-absentee-owner-classification-persistence-bounded-rollout-v1.js',
  'validate-absentee-owner-classification-persistence-bounded-rollout-behavior-v1.js',
  'validate-absentee-owner-classification-persistence-bounded-rollout-integration-v1.js',

  'reosAbsenteeOwnerClassificationBoundedRollout(options)',

  '`Persistence Contract Version`',
  '`Classification Contract Version`',

  '`1`',

  'sort plain-object string keys lexicographically',
  'reject sparse arrays',
  'reject cyclic structures',

  '`ABSENTEE_OWNER_INDICATED`',
  '`OWNER_MAILING_MATCHED`',
  '`INSUFFICIENT_CLASSIFICATION_EVIDENCE`',
  '`INELIGIBLE_COMPARISON_EVIDENCE`',

  'Differing Components JSON',
  '`null`',

  '`AOCE-` + 64-character lowercase SHA-256',

  'duplicate rejection, generate `Observed At UTC`',

  'outcome: ABSENTEE_OWNER_CLASSIFICATION_ALREADY_PERSISTED',
  'disposition: ALREADY_PERSISTED',

  'outcome: ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED',
  'disposition: PERSISTED',

  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN',

  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',

  'createTextFinder(distressLeadId)',
  'matchEntireCell(true)',
  'findAll()',

  '`GENESIS`',

  '`appendRow(...)`',
  '`SpreadsheetApp.flush()`',

  'REOS.Database.withScriptLockContext(...)',
  'REOS.Database.assertScriptLockContext(...)',

  'OPA HTTP must never execute while the persistence ScriptLock is held.',

  '`REOS.Security.requireAdmin()`',

  'MAX_TARGETS = 10',
  '`1 -> 5 -> 10`',

  'persistence layer raises:',
  'the rollout halts immediately.',

  '.github/workflows/county-collapse-offline.yml',
  'scripts/validate-county-runtime-integration.js',

  'No unrelated workflow behavior may change.',

  'Evidence-store provisioning requires a separate certified gate',

  'Automatic MAO or offer authority remains blocked unless both independently',
].forEach(has);

const runtimeFiles = [
  'AbsenteeOwnerClassificationPersistencePlanner.js',
  'AbsenteeOwnerClassificationEvidenceStore.js',
  'AbsenteeOwnerClassificationPersistenceExecutor.js',
  'AbsenteeOwnerClassificationBoundedRollout.js',
];

runtimeFiles.forEach((file) => {
  assert.strictEqual(
    text.split(file).length - 1 >= 1,
    true,
    file
  );
});

const headers = [
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
  'Evidence Event SHA-256',
];

headers.forEach((header) => {
  has('`' + header + '`');
});

assert.strictEqual(
  headers.length,
  20
);

[
  'build/apps-script-brand/Database.js',
  'build/apps-script-brand/DistressLeadCountySchema.js',
  'build/apps-script-brand/appsscript.json',
  '.clasp.json',
].forEach((file) => {
  has(file);
});

[
  'no new row is appended',
  'no existing row is changed',
  'No persistence retry is permitted.',
  'No stage retries.',
  'No target executes concurrently.',
  'No later target starts.',
  'No retry occurs.',
  'must not create the workbook',
  'must not create the sheet',
  'must not add headers',
  'must not repair headers',
].forEach(has);

assert(
  !text.includes(
    'automaticOfferAuthorityGranted: true'
  )
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_BOUNDED_ROLLOUT_IMPLEMENTATION_FREEZE_VALID=true'
);

console.log(
  'RUNTIME_SURFACE_COUNT=4'
);

console.log(
  'NEW_IMPLEMENTATION_VALIDATOR_COUNT=3'
);

console.log(
  'PUBLIC_RPC=reosAbsenteeOwnerClassificationBoundedRollout'
);

console.log(
  'PERSISTENCE_CONTRACT_VERSION=1'
);

console.log(
  'CLASSIFICATION_CONTRACT_VERSION=1'
);

console.log(
  'EVENT_ID_MODE=DETERMINISTIC_IDENTITY_PLUS_CLASSIFIER_HASH'
);

console.log(
  'DUPLICATE_OUTCOME=ABSENTEE_OWNER_CLASSIFICATION_ALREADY_PERSISTED'
);

console.log(
  'DUPLICATE_DISPOSITION=ALREADY_PERSISTED'
);

console.log(
  'VERIFIED_OUTCOME=ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED'
);

console.log(
  'VERIFIED_DISPOSITION=PERSISTED'
);

console.log(
  'HISTORY_LOOKUP=EXACT_DISTRESS_ID_TEXTFINDER_THEN_CANONICAL_KEY'
);

console.log(
  'STORE_WRITE_PRIMITIVE=appendRow'
);

console.log(
  'PERSISTENCE_LOCK=REOS.Database.withScriptLockContext'
);

console.log(
  'OPA_HTTP_UNDER_PERSISTENCE_LOCK=false'
);

console.log(
  'MAX_TARGETS=10'
);

console.log(
  'ROLLOUT_STAGES=1,5,10'
);

console.log(
  'PERSISTENCE_PRECONDITION_FAILURE_HALTS_ROLLOUT=true'
);

console.log(
  'PERSISTENCE_UNCERTAINTY_HALTS_ROLLOUT=true'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'DATABASE_MODIFICATION_AUTHORIZED=false'
);

console.log(
  'DISTRESS_LEADS_SCHEMA_MODIFICATION_AUTHORIZED=false'
);

console.log(
  'MANIFEST_MODIFICATION_AUTHORIZED=false'
);

console.log(
  'EVIDENCE_STORE_PROVISIONING_AUTHORIZED=false'
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
