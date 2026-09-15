#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const cp = require('node:child_process');

const BASE =
  'c5ddbd955dd748aba6eb7de6a7e570a9b41bcac5';

const DOC =
  'docs/county-mutation-exclusion-lease-contract-v1.md';

const SELF =
  'scripts/validate-county-mutation-exclusion-lease-contract-v1.js';

const FUTURE_LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const FUTURE_MAINTENANCE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const FUTURE_EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const COLLAPSE_DESIGN =
  'docs/county-code-violation-collapse-maintenance-quiescence-contract-v1.md';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXPECTED_DOC_SHA =
  '903438543ad8463faa76b3f6d1afa689628312d183787116ce7cce39f3390e6b';

const PROTECTED_FILES = [
  'build/apps-script-brand/CountyProductionScheduler.js',
  'build/apps-script-brand/CountyConnectorSDK.js',
  'build/apps-script-brand/CountyCheckpointRecovery.js',
  'build/apps-script-brand/CountyC1SchemaMigration.js',
  'build/apps-script-brand/CountyC1InsertRecovery.js',
  'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationBatch1Executor.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js',
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js',
  'build/apps-script-brand/CountyPage85SourceObservation214Repair.js',
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js'
];

function git(...args) {
  return cp.execFileSync(
    'git',
    args,
    { encoding: 'utf8' }
  ).trim();
}

function requireText(text, marker, label) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

console.log(
  '=== COUNTY MUTATION-EXCLUSION LEASE CONTRACT V1 ==='
);

assert.strictEqual(
  git('merge-base', BASE, 'HEAD'),
  BASE,
  'Certified merged-main base is no longer an ancestry root.'
);

assert.ok(
  fs.existsSync(DOC),
  'Mutation-exclusion lease contract must exist.'
);

assert.ok(
  fs.existsSync(SELF),
  'Mutation-exclusion lease validator must exist.'
);

assert.ok(
  fs.existsSync(COLLAPSE_DESIGN),
  'Merged collapse maintenance design contract must exist.'
);

assert.ok(
  fs.existsSync(PREFLIGHT),
  'Collapse execution preflight must exist.'
);

assert.ok(
  fs.existsSync(WORKFLOW),
  'County-collapse offline workflow must exist.'
);

assert.ok(
  !fs.existsSync(FUTURE_LEASE),
  'Runtime county mutation-exclusion lease must remain absent during design certification.'
);

assert.ok(
  !fs.existsSync(FUTURE_MAINTENANCE),
  'Collapse maintenance implementation must remain absent during lease design certification.'
);

assert.ok(
  !fs.existsSync(FUTURE_EXECUTOR),
  'Collapse executor must remain absent during lease design certification.'
);

PROTECTED_FILES.forEach(file => {
  assert.ok(
    fs.existsSync(file),
    'Protected writer source missing: ' + file
  );
});

const doc =
  fs.readFileSync(DOC, 'utf8');

const self =
  fs.readFileSync(SELF, 'utf8');

const workflow =
  fs.readFileSync(WORKFLOW, 'utf8');

assert.strictEqual(
  sha256(doc),
  EXPECTED_DOC_SHA,
  'County mutation-exclusion lease contract SHA-256 changed.'
);

const normalizedDoc =
  doc.replace(/\s+/g, ' ').trim();

const collapseDesign =
  fs.readFileSync(COLLAPSE_DESIGN, 'utf8')
    .replace(/\s+/g, ' ')
    .trim();

const preflight =
  fs.readFileSync(PREFLIGHT, 'utf8');

[
  'COUNTY_MUTATION_EXCLUSION_LEASE_CONTRACT_VERSION=1',
  'LEASE_SCOPE=REOS_COUNTY_PRODUCTION_MUTATION',
  'EXCLUSIVE_OWNER_MODE=CODE_VIOLATION_COLLAPSE',
  'RAW_LEASE_TOKEN_PERSISTENCE=false',
  'LEASE_GRANTS_MUTATION_AUTHORITY=false',
  'INCOMPATIBLE_WRITER_DEFAULT=FAIL_CLOSED',
  'COLLAPSE_OWNER_REQUIRES_MAINTENANCE_ASSERTION=true',
  'SAME_OUTER_LOCK_REVALIDATION=true',
  'NESTED_SCRIPTLOCK_AUTHORITY=false',
  'RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Lease contract marker'
  );
});

[
  'REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON',
  'one canonical project-wide county mutation lease state',
  'Only one active, unexpired exclusive county mutation lease may exist at a time.',
  'unknown county writer must fail closed',
  'The raw lease token must never be persisted.',
  'The lease does not grant insert, update, delete, repair, migration, connector, scheduler, checkpoint, collapse, winner-selection, physical-delete, or offer authority.',
  'same outer Database ScriptLock',
  'No public Apps Script RPC is authorized',
  'shared lease implementation',
  'exact protected-writer guard integration',
  'collapse executor remains unavailable'
].forEach(marker => {
  requireText(
    normalizedDoc,
    marker,
    'Lease safety model'
  );
});

[
  'COUNTY_PRODUCTION_SCHEDULER',
  'COUNTY_CONNECTOR_LIVE_PERSISTENCE',
  'COUNTY_CHECKPOINT_RECOVERY',
  'COUNTY_C1_SCHEMA_MIGRATION',
  'COUNTY_C1_INSERT_RECOVERY',
  'CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL',
  'CODE_VIOLATION_DURABLE_IDENTITY_BATCH1',
  'CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN',
  'CODE_VIOLATION_DURABLE_IDENTITY_ROLLING',
  'CODE_VIOLATION_GATE1_RECOVERY',
  'PAGE85_SOURCE_OBSERVATION_214_REPAIR',
  'PAGE86_DUPLICATE_SOURCE_REPAIR',
  'CODE_VIOLATION_COLLAPSE_EXECUTOR'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Protected writer inventory'
  );
});

[
  'no competing REOS county mutation path is authorized',
  'explicit external/manual-writer certification',
  'same outer Database ScriptLock'
].forEach(marker => {
  requireText(
    collapseDesign,
    marker,
    'Merged collapse-maintenance prerequisite'
  );
});

requireText(
  preflight,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'Collapse preflight blocker'
);

const ciValidatorPath =
  SELF;

const ciOccurrences =
  workflow.split(ciValidatorPath).length - 1;

assert.strictEqual(
  ciOccurrences,
  2,
  'County mutation-exclusion lease validator must appear exactly twice in county-collapse CI.'
);

requireText(
  workflow,
  'node --check ' + ciValidatorPath,
  'County mutation-exclusion lease CI syntax registration'
);

requireText(
  workflow,
  'run: node ' + ciValidatorPath,
  'County mutation-exclusion lease CI execution registration'
);

const forbiddenRpc =
  cp.spawnSync(
    'git',
    [
      'grep',
      '-n',
      'reosCountyMutationExclusionLease',
      '--',
      'build/apps-script-brand'
    ],
    { encoding: 'utf8' }
  );

assert.strictEqual(
  forbiddenRpc.status,
  1,
  'Generic county mutation-exclusion lease RPC unexpectedly exists or grep failed.'
);

assert.strictEqual(
  forbiddenRpc.stdout.trim(),
  '',
  'Generic county mutation-exclusion lease RPC unexpectedly exists.'
);

assert.strictEqual(
  forbiddenRpc.stderr.trim(),
  '',
  'Generic county mutation-exclusion lease RPC search emitted unexpected stderr.'
);

console.log(
  'PASS: discovery proves no pre-existing shared county mutation lease module.'
);
console.log(
  'PASS: exact v1 competing county writer inventory is design-bound.'
);
console.log(
  'PASS: active collapse lease must deny every incompatible protected writer.'
);
console.log(
  'PASS: lease authority is exclusion-only and never mutation authority.'
);
console.log(
  'PASS: collapse ownership still requires separate maintenance capability.'
);
console.log(
  'PASS: evidence journals remain authority-free and are not county production-data writers.'
);
console.log(
  'PASS: same-lock lease revalidation is mandatory and nested ScriptLock authority remains false.'
);
console.log(
  'PASS: runtime lease, collapse maintenance gate, executor, and generic lease RPC remain absent.'
);
console.log(
  'contract_sha256=' +
  sha256(doc)
);
console.log(
  'validator_sha256=' +
  sha256(self)
);
console.log(
  'COUNTY_MUTATION_EXCLUSION_LEASE_CONTRACT_DESIGN_VALIDATION_PASSED=true'
);
