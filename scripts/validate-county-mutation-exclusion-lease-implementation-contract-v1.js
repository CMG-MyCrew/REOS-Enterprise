#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const cp = require('node:child_process');

const BASE =
  '004e9cdbce48df3c48a0f31141ea6c3d1e94a430';

const DESIGN_DOC =
  'docs/county-mutation-exclusion-lease-contract-v1.md';

const EXPECTED_DESIGN_SHA =
  '903438543ad8463faa76b3f6d1afa689628312d183787116ce7cce39f3390e6b';

const DOC =
  'docs/county-mutation-exclusion-lease-implementation-contract-v1.md';

const SELF =
  'scripts/validate-county-mutation-exclusion-lease-implementation-contract-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXPECTED_DOC_SHA =
  '87f930ad258f057fa224b688043f8c3996298bcd2db9c06e89d8e531422d19d3';

const FUTURE_LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const FUTURE_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-v1.js';

const FUTURE_MAINTENANCE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const FUTURE_EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const WINNER_FINGERPRINT =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const AUTHORITY_SHA =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const CYCLE =
  'COUNTY-20260902222607805';

const CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const WRITERS = [
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
  'PAGE86_DUPLICATE_SOURCE_REPAIR'
];

function git(...args) {
  return cp.execFileSync(
    'git',
    args,
    { encoding: 'utf8' }
  ).trim();
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

function requireText(text, marker, label) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
}

console.log(
  '=== COUNTY MUTATION-EXCLUSION LEASE IMPLEMENTATION CONTRACT V1 ==='
);

assert.strictEqual(
  git('merge-base', BASE, 'HEAD'),
  BASE,
  'Merged lease-design base is no longer an ancestry root.'
);

assert.ok(
  fs.existsSync(DESIGN_DOC),
  'Merged lease design contract must exist.'
);

assert.ok(
  fs.existsSync(DOC),
  'Lease implementation contract must exist.'
);

assert.ok(
  fs.existsSync(SELF),
  'Lease implementation-contract validator must exist.'
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
  'Runtime lease implementation must remain absent.'
);

assert.ok(
  !fs.existsSync(FUTURE_HARNESS),
  'Runtime lease harness must remain absent.'
);

assert.ok(
  !fs.existsSync(FUTURE_MAINTENANCE),
  'Collapse maintenance implementation must remain absent.'
);

assert.ok(
  !fs.existsSync(FUTURE_EXECUTOR),
  'Collapse executor implementation must remain absent.'
);

const design =
  fs.readFileSync(DESIGN_DOC, 'utf8');

assert.strictEqual(
  sha256(design),
  EXPECTED_DESIGN_SHA,
  'Merged lease design contract SHA changed.'
);

const doc =
  fs.readFileSync(DOC, 'utf8');

assert.strictEqual(
  sha256(doc),
  EXPECTED_DOC_SHA,
  'County mutation-exclusion lease implementation contract SHA-256 changed.'
);

const normalizedDoc =
  doc.replace(/\s+/g, ' ').trim();

const self =
  fs.readFileSync(SELF, 'utf8');

const preflight =
  fs.readFileSync(PREFLIGHT, 'utf8');

const workflow =
  fs.readFileSync(WORKFLOW, 'utf8');

[
  WINNER_FINGERPRINT,
  AUTHORITY_SHA,
  CYCLE,
  CURSOR,
  'reosCountyProductionSchedulerRun',
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
].forEach(marker => {
  requireText(
    preflight,
    marker,
    'Certified collapse preflight authority'
  );
});

[
  'COUNTY_MUTATION_EXCLUSION_LEASE_IMPLEMENTATION_CONTRACT_VERSION=1',
  'RUNTIME_MODULE=REOS.CountyMutationExclusionLease',
  'STATE_KEY=REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON',
  'LEASE_SCOPE=REOS_COUNTY_PRODUCTION_MUTATION',
  'OWNER_MODE=CODE_VIOLATION_COLLAPSE',
  'OWNER_WRITER_ID=CODE_VIOLATION_COLLAPSE_EXECUTOR',
  'PROTECTED_WRITER_INVENTORY_VERSION=1',
  'SCHEDULER_HANDLER=reosCountyProductionSchedulerRun',
  'SETTLE_MS=600000',
  'WINDOW_MS=3600000',
  'OPEN_REQUIRES_ADMIN=true',
  'OPEN_REQUIRES_EXPLICIT_CONFIRMATION=true',
  'MANUAL_EXTERNAL_WRITER_CERTIFICATION_REQUIRED=true',
  'RAW_TOKEN_PERSISTENCE=false',
  'ACTIVE_LEASE_REPLACEMENT=false',
  'UNKNOWN_WRITER_FAILS_CLOSED=true',
  'MALFORMED_STATE_FAILS_CLOSED=true',
  'EXPIRED_LEASE_OWNER_READY=false',
  'NO_ACTIVE_LEASE_PRESERVES_EXISTING_WRITER_AUTHORITY=true',
  'ACTIVE_COLLAPSE_LEASE_DENIES_NONOWNER_WRITERS=true',
  'OWNER_REQUIRES_EXACT_LEASE_GATE_AUTHORITY=true',
  'CALLER_OWNED_LOCK_REVALIDATION=true',
  'ASSERTIONS_ACQUIRE_SCRIPTLOCK=false',
  'OPEN_CLOSE_STATE_TRANSITIONS_ACQUIRE_SCRIPTLOCK=true',
  'NESTED_SCRIPTLOCK_AUTHORITY=false',
  'LEASE_GRANTS_MUTATION_AUTHORITY=false',
  'GENERIC_RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'SCHEDULER_MUTATION_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Implementation contract marker'
  );
});

[
  WINNER_FINGERPRINT,
  AUTHORITY_SHA,
  CYCLE,
  CURSOR
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Hard-bound implementation authority'
  );
});

[
  '`openExclusive(options)`',
  '`assertOwnerReady(options)`',
  '`assertWriterAllowed(options)`',
  '`status()`',
  '`close(options)`',
  '`REOS.Database.assertScriptLockContext(lockContext)`',
  '`REOS.Database.withScriptLockContext(...)`',
  'Caller values cannot manufacture or redefine authority.',
  'The raw lease token must never appear in persisted state.',
  'The module must expose no Apps Script RPC.',
  'No protected writer modification is authorized by this implementation-design gate.',
  'The county scheduler remains frozen.'
].forEach(marker => {
  requireText(
    normalizedDoc,
    marker,
    'Implementation safety requirement'
  );
});

WRITERS.forEach(writer => {
  requireText(
    doc,
    writer,
    'Protected writer inventory'
  );
});

[
  'REOS.CountyCollapseOperationIntentStore',
  'REOS.CountyCollapseObservationPreservationStore'
].forEach(store => {
  requireText(
    doc,
    store,
    'Evidence-journal exclusion'
  );
});

for (let i = 1; i <= 50; i += 1) {
  requireText(
    doc,
    String(i) + '.',
    'Offline harness case ' + i
  );
}

const ciValidatorPath =
  SELF;

const ciOccurrences =
  workflow.split(ciValidatorPath).length - 1;

assert.strictEqual(
  ciOccurrences,
  2,
  'Lease implementation-contract validator must appear exactly twice in county-collapse CI.'
);

requireText(
  workflow,
  'node --check ' + ciValidatorPath,
  'Lease implementation-contract CI syntax registration'
);

requireText(
  workflow,
  'run: node ' + ciValidatorPath,
  'Lease implementation-contract CI execution registration'
);

const forbiddenRpc =
  cp.spawnSync(
    'git',
    [
      'grep',
      '-n',
      'function reosCountyMutationExclusionLease',
      '--',
      'build/apps-script-brand'
    ],
    { encoding: 'utf8' }
  );

assert.strictEqual(
  forbiddenRpc.status,
  1,
  'Generic lease RPC unexpectedly exists or grep failed.'
);

assert.strictEqual(
  forbiddenRpc.stdout.trim(),
  '',
  'Generic lease RPC unexpectedly exists.'
);

assert.strictEqual(
  forbiddenRpc.stderr.trim(),
  '',
  'Generic lease RPC search emitted stderr.'
);

console.log(
  'PASS: merged lease-design contract remains exact.'
);
console.log(
  'PASS: runtime implementation is hard-bound to certified collapse authority.'
);
console.log(
  'PASS: exact five-method runtime module API is specified.'
);
console.log(
  'PASS: open/close own state-transition locking while assertions remain non-locking.'
);
console.log(
  'PASS: caller-owned Database lock revalidation is mandatory.'
);
console.log(
  'PASS: active collapse lease denies all protected non-owner writers.'
);
console.log(
  'PASS: absent/closed/expired lease preserves existing writer authority model.'
);
console.log(
  'PASS: unknown writers and malformed state fail closed.'
);
console.log(
  'PASS: 50-case offline runtime harness contract is specified.'
);
console.log(
  'PASS: runtime lease, runtime harness, protected-writer retrofit, maintenance gate, executor, and RPC remain absent.'
);
console.log(
  'contract_sha256=' + sha256(doc)
);
console.log(
  'validator_sha256=' + sha256(self)
);
console.log(
  'COUNTY_MUTATION_EXCLUSION_LEASE_IMPLEMENTATION_CONTRACT_DESIGN_VALIDATION_PASSED=true'
);
