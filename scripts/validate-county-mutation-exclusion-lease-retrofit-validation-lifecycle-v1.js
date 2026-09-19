#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const cp = require('node:child_process');

const BASE = '33b9feb19ce4feafd352a90fb108206a41e0d630';

const COMPATIBILITY_BASE =
  '212bd5b56ec8fda87e437467d774bfa206e75726';

const HISTORICAL =
  'scripts/validate-county-mutation-exclusion-lease-validation-lifecycle-v1.js';

const SELF =
  'scripts/validate-county-mutation-exclusion-lease-retrofit-validation-lifecycle-v1.js';

const DOC =
  'docs/county-mutation-exclusion-lease-retrofit-validation-lifecycle-v1.md';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const RUNTIME_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-v1.js';

const COMPATIBILITY_RUNTIME_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-runtime-v1.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const MAINTENANCE_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const EXPECTED_HISTORICAL_SHA = 'a33f351e25cbdbd7512c77e7ddcc511e38a4a9a93fcb40723c67eca5646d64a7';
const EXPECTED_HISTORICAL_LEASE_SHA = '7bb81a035b8ed643a1eb02582a02cb7d17bcc43bdc4e0c71ab3da963b48473b4';
const EXPECTED_CURRENT_LEASE_SHA = 'f4e02ba1c8aef87075a87437673691b02d8a8587be2dd51280c9708b92954fdb';
const EXPECTED_RUNTIME_HARNESS_SHA = '61d7c1bb6d55b3be147ffe4fd7c99f932d9a9d194e0cfe30d8875addcbd44ebb';
const EXPECTED_COMPATIBILITY_RUNTIME_HARNESS_SHA = '4a8e18fc495869fd8bd47a66f89c3989720f162d3cbde07ad098ddb2029d938d';
const EXPECTED_INTEGRATION_SHA = '80198b314f45c4b8c2dff02280153732b1dd5bb1f81b366cb99e4788759a6b88';
const EXPECTED_MAINTENANCE_GATE_SHA = '051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f';

const WRITERS = [
  {
    id: 'COUNTY_PRODUCTION_SCHEDULER',
    file: 'build/apps-script-brand/CountyProductionScheduler.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-production-scheduler-v1.js'
  },
  {
    id: 'COUNTY_CONNECTOR_LIVE_PERSISTENCE',
    file: 'build/apps-script-brand/CountyConnectorSDK.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-connector-live-persistence-v1.js'
  },
  {
    id: 'COUNTY_CHECKPOINT_RECOVERY',
    file: 'build/apps-script-brand/CountyCheckpointRecovery.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-checkpoint-recovery-v1.js'
  },
  {
    id: 'COUNTY_C1_SCHEMA_MIGRATION',
    file: 'build/apps-script-brand/CountyC1SchemaMigration.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-c1-schema-migration-v1.js'
  },
  {
    id: 'COUNTY_C1_INSERT_RECOVERY',
    file: 'build/apps-script-brand/CountyC1InsertRecovery.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-c1-insert-recovery-v1.js'
  },
  {
    id: 'CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL',
    file: 'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-blocked-storage-backfill-v1.js'
  },
  {
    id: 'CODE_VIOLATION_DURABLE_IDENTITY_BATCH1',
    file: 'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationBatch1Executor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-durable-identity-batch1-v1.js'
  },
  {
    id: 'CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN',
    file: 'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-durable-identity-multispan-v1.js'
  },
  {
    id: 'CODE_VIOLATION_DURABLE_IDENTITY_ROLLING',
    file: 'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-durable-identity-rolling-v1.js'
  },
  {
    id: 'CODE_VIOLATION_GATE1_RECOVERY',
    file: 'build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-gate1-recovery-v1.js'
  },
  {
    id: 'PAGE85_SOURCE_OBSERVATION_214_REPAIR',
    file: 'build/apps-script-brand/CountyPage85SourceObservation214Repair.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-page85-source-observation-214-repair-v1.js'
  },
  {
    id: 'PAGE86_DUPLICATE_SOURCE_REPAIR',
    file: 'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-page86-duplicate-source-repair-v1.js'
  },
  {
    id: 'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION',
    file: 'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-group3-zillow-restoration-v1.js'
  }
];

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path))
    .digest('hex');
}

function sha256GitFile(ref, path) {
  const result = cp.spawnSync(
    'git',
    [
      'show',
      ref + ':' + path
    ],
    {
      encoding: 'utf8'
    }
  );

  assert.strictEqual(
    result.status,
    0,
    'Unable to read historical Git artifact: ' + path
  );

  return crypto
    .createHash('sha256')
    .update(result.stdout, 'utf8')
    .digest('hex');
}

function git(args) {
  const result = cp.spawnSync(
    'git',
    args,
    { encoding: 'utf8' }
  );

  if (result.error) {
    throw result.error;
  }

  return result;
}

function requireText(text, marker, label) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
}

function runNode(path) {
  const result = cp.spawnSync(
    process.execPath,
    [path],
    { encoding: 'utf8' }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  assert.strictEqual(
    result.status,
    0,
    'Node execution failed: ' + path
  );
}

console.log(
  '=== COUNTY MUTATION-EXCLUSION LEASE RETROFIT VALIDATION LIFECYCLE V1 ==='
);

assert.strictEqual(
  git(['merge-base', BASE, 'HEAD']).stdout.trim(),
  BASE,
  'Certified runtime main is no longer an ancestry root.'
);

[
  HISTORICAL,
  SELF,
  DOC,
  WORKFLOW,
  LEASE,
  RUNTIME_HARNESS,
  COMPATIBILITY_RUNTIME_HARNESS,
  INTEGRATION
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required retrofit lifecycle artifact missing: ' + path
  );
});

assert.strictEqual(
  sha256File(HISTORICAL),
  EXPECTED_HISTORICAL_SHA,
  'Historical runtime lifecycle validator changed.'
);

assert.strictEqual(
  sha256GitFile(
    COMPATIBILITY_BASE,
    LEASE
  ),
  EXPECTED_HISTORICAL_LEASE_SHA,
  'Historical runtime lease baseline changed.'
);

assert.strictEqual(
  sha256File(LEASE),
  EXPECTED_CURRENT_LEASE_SHA,
  'Current compatibility runtime lease changed.'
);

assert.strictEqual(
  sha256File(RUNTIME_HARNESS),
  EXPECTED_RUNTIME_HARNESS_SHA,
  'Certified runtime harness changed.'
);

assert.strictEqual(
  sha256File(COMPATIBILITY_RUNTIME_HARNESS),
  EXPECTED_COMPATIBILITY_RUNTIME_HARNESS_SHA,
  'Compatibility runtime harness changed.'
);

assert.strictEqual(
  sha256File(INTEGRATION),
  EXPECTED_INTEGRATION_SHA,
  'Certified county runtime integration validator changed.'
);

assert.ok(
  fs.existsSync(MAINTENANCE_GATE),
  'Certified collapse maintenance gate must be present after maintenance implementation.'
);

assert.strictEqual(
  sha256File(MAINTENANCE_GATE),
  EXPECTED_MAINTENANCE_GATE_SHA,
  'Certified collapse maintenance gate changed.'
);

const maintenanceGateSource =
  fs.readFileSync(
    MAINTENANCE_GATE,
    'utf8'
  );

requireText(
  maintenanceGateSource,
  'REOS.CountyCodeViolationCollapseMaintenanceGate',
  'Certified collapse maintenance facade'
);

requireText(
  maintenanceGateSource,
  'REOS.CountyMutationExclusionLease',
  'Certified shared exclusion owner'
);

requireText(
  maintenanceGateSource,
  'DURABLE_STATE_OWNER',
  'Maintenance durable-state ownership'
);

requireText(
  maintenanceGateSource,
  'collapseExecutionAuthorityGranted',
  'Maintenance authority-free result surface'
);

assert.strictEqual(
  maintenanceGateSource.includes(
    'PropertiesService'
  ),
  false,
  'Collapse maintenance facade must not create an independent persistence store.'
);

assert.strictEqual(
  /function\s+reosCountyCodeViolationCollapseMaintenance/
    .test(
      maintenanceGateSource
    ),
  false,
  'Public collapse-maintenance RPC remains prohibited.'
);

assert.ok(
  !fs.existsSync(EXECUTOR),
  'Collapse executor remains prohibited during writer retrofit.'
);

const workflow = fs.readFileSync(WORKFLOW, 'utf8');

assert.strictEqual(
  workflow.split(HISTORICAL).length - 1,
  1,
  'Historical runtime lifecycle must appear exactly once as syntax-only CI evidence.'
);

requireText(
  workflow,
  'node --check ' + HISTORICAL,
  'Historical runtime lifecycle syntax registration'
);

assert.ok(
  !workflow.includes('run: node ' + HISTORICAL),
  'Historical runtime lifecycle must not execute directly after transition.'
);

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Active retrofit lifecycle must appear exactly twice in CI.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Retrofit lifecycle syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Retrofit lifecycle execution registration'
);

const runtimeHarnessSource =
  fs.readFileSync(
    RUNTIME_HARNESS,
    'utf8'
  );

requireText(
  runtimeHarnessSource,
  'no protected writer source is modified by runtime lease implementation',
  'Historical runtime harness protected-writer invariant'
);

const runtimeHarnessSyntax =
  cp.spawnSync(
    process.execPath,
    [
      '--check',
      RUNTIME_HARNESS
    ],
    {
      encoding:
        'utf8'
    }
  );

if (runtimeHarnessSyntax.stdout) {
  process.stdout.write(
    runtimeHarnessSyntax.stdout
  );
}

if (runtimeHarnessSyntax.stderr) {
  process.stderr.write(
    runtimeHarnessSyntax.stderr
  );
}

assert.strictEqual(
  runtimeHarnessSyntax.status,
  0,
  'Historical runtime harness syntax failed.'
);

const compatibilityHarnessSyntax =
  cp.spawnSync(
    process.execPath,
    [
      '--check',
      COMPATIBILITY_RUNTIME_HARNESS
    ],
    {
      encoding:
        'utf8'
    }
  );

if (compatibilityHarnessSyntax.stdout) {
  process.stdout.write(
    compatibilityHarnessSyntax.stdout
  );
}

if (compatibilityHarnessSyntax.stderr) {
  process.stderr.write(
    compatibilityHarnessSyntax.stderr
  );
}

assert.strictEqual(
  compatibilityHarnessSyntax.status,
  0,
  'Compatibility runtime harness syntax failed.'
);

runNode(
  COMPATIBILITY_RUNTIME_HARNESS
);

const expectedHarnesses =
  new Set(WRITERS.map(entry => entry.harness));

const discoveredHarnesses =
  fs.readdirSync('scripts')
    .filter(name =>
      name.startsWith('validate-county-mutation-exclusion-writer-') &&
      name.endsWith('-v1.js')
    )
    .map(name => 'scripts/' + name);

discoveredHarnesses.forEach(path => {
  assert.ok(
    expectedHarnesses.has(path),
    'Unknown protected-writer retrofit harness: ' + path
  );
});

const changed = [];

WRITERS.forEach(entry => {
  assert.ok(
    fs.existsSync(entry.file),
    'Protected writer missing: ' + entry.file
  );

  const diff = git([
    'diff',
    '--quiet',
    BASE,
    '--',
    entry.file
  ]);

  assert.ok(
    diff.status === 0 || diff.status === 1,
    'Unable to classify protected writer diff: ' + entry.file
  );

  const writerChanged = diff.status === 1;
  const harnessExists = fs.existsSync(entry.harness);

  assert.strictEqual(
    harnessExists,
    writerChanged,
    writerChanged
      ? 'Changed protected writer missing exact retrofit harness: ' + entry.file
      : 'Retrofit harness exists without protected writer change: ' + entry.harness
  );

  if (!writerChanged) {
    return;
  }

  const source = fs.readFileSync(entry.file, 'utf8');

  requireText(
    source,
    'REOS.CountyMutationExclusionLease.assertWriterAllowed',
    'Protected writer lease guard'
  );

  requireText(
    source,
    entry.id,
    'Protected writer exact writer ID'
  );

  const syntax = cp.spawnSync(
    process.execPath,
    ['--check', entry.harness],
    { encoding: 'utf8' }
  );

  if (syntax.stdout) process.stdout.write(syntax.stdout);
  if (syntax.stderr) process.stderr.write(syntax.stderr);

  assert.strictEqual(
    syntax.status,
    0,
    'Retrofit harness syntax failed: ' + entry.harness
  );

  runNode(entry.harness);

  changed.push(entry.id);
});

const rpcSearch = git([
  'grep',
  '-n',
  'function reosCountyMutationExclusionLease',
  '--',
  'build/apps-script-brand'
]);

assert.ok(
  rpcSearch.status === 1 ||
  rpcSearch.stdout.trim() === '',
  'Generic lease RPC unexpectedly exists.'
);

const stage =
  changed.length === 0
    ? 'RETROFIT_READY'
    : 'RETROFIT_ACTIVE';

console.log(
  'PASS: historical runtime lifecycle remains byte-exact and syntax-only.'
);

console.log(
  'PASS: historical lease baseline and historical 50-case harness remain SHA-certified.'
);

console.log(
  'PASS: current compatibility lease and compatibility runtime harness are SHA-certified.'
);

console.log(
  'PASS: every changed protected writer requires its exact mapped harness.'
);

console.log(
  'PASS: certified collapse maintenance gate is present and authority-free; collapse executor remains absent.'
);

console.log('validation_stage=' + stage);
console.log('retrofitted_writer_count=' + changed.length);

changed.forEach(id => {
  console.log('retrofitted_writer_id=' + id);
});

console.log(
  'COUNTY_MUTATION_EXCLUSION_LEASE_RETROFIT_VALIDATION_LIFECYCLE_PASSED=true'
);
