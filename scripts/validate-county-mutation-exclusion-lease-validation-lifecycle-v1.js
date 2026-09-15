#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const cp = require('node:child_process');

const BASE =
  '918d3081041ed73dabe3b7af21c50d0c49f3ed37';

const DESIGN_DOC =
  'docs/county-mutation-exclusion-lease-contract-v1.md';

const DESIGN_VALIDATOR =
  'scripts/validate-county-mutation-exclusion-lease-contract-v1.js';

const IMPLEMENTATION_DOC =
  'docs/county-mutation-exclusion-lease-implementation-contract-v1.md';

const IMPLEMENTATION_VALIDATOR =
  'scripts/validate-county-mutation-exclusion-lease-implementation-contract-v1.js';

const SELF =
  'scripts/validate-county-mutation-exclusion-lease-validation-lifecycle-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const RUNTIME_LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const RUNTIME_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-v1.js';

const MAINTENANCE_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const EXPECTED_DESIGN_DOC_SHA =
  '903438543ad8463faa76b3f6d1afa689628312d183787116ce7cce39f3390e6b';

const EXPECTED_DESIGN_VALIDATOR_SHA =
  '7e5312d5898d2cf50c140d1eb9449ec30bb72a4b3a5e635f22d3eb55a30a6498';

const EXPECTED_IMPLEMENTATION_DOC_SHA =
  '87f930ad258f057fa224b688043f8c3996298bcd2db9c06e89d8e531422d19d3';

const EXPECTED_IMPLEMENTATION_VALIDATOR_SHA =
  '869f3002a09bab5608b6d0dcb0abf5513f6092b160abefc78087299bd809b8fe';

const PROTECTED_WRITERS = [
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

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path))
    .digest('hex');
}

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

function runNode(path) {
  const result =
    cp.spawnSync(
      process.execPath,
      [path],
      {
        encoding: 'utf8'
      }
    );

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  assert.strictEqual(
    result.status,
    0,
    'Node execution failed: ' + path
  );
}

console.log(
  '=== COUNTY MUTATION-EXCLUSION LEASE VALIDATION LIFECYCLE V1 ==='
);

assert.strictEqual(
  git('merge-base', BASE, 'HEAD'),
  BASE,
  'Certified lifecycle base is no longer an ancestry root.'
);

[
  DESIGN_DOC,
  DESIGN_VALIDATOR,
  IMPLEMENTATION_DOC,
  IMPLEMENTATION_VALIDATOR,
  SELF,
  WORKFLOW
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required lifecycle artifact missing: ' + path
  );
});

assert.strictEqual(
  sha256File(DESIGN_DOC),
  EXPECTED_DESIGN_DOC_SHA,
  'Historical design contract changed.'
);

assert.strictEqual(
  sha256File(DESIGN_VALIDATOR),
  EXPECTED_DESIGN_VALIDATOR_SHA,
  'Historical design validator changed.'
);

assert.strictEqual(
  sha256File(IMPLEMENTATION_DOC),
  EXPECTED_IMPLEMENTATION_DOC_SHA,
  'Historical implementation contract changed.'
);

assert.strictEqual(
  sha256File(IMPLEMENTATION_VALIDATOR),
  EXPECTED_IMPLEMENTATION_VALIDATOR_SHA,
  'Historical implementation-contract validator changed.'
);

assert.ok(
  !fs.existsSync(MAINTENANCE_GATE),
  'Collapse maintenance implementation remains prohibited.'
);

assert.ok(
  !fs.existsSync(EXECUTOR),
  'Collapse executor implementation remains prohibited.'
);

PROTECTED_WRITERS.forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Protected writer missing: ' + path
  );

  const result =
    cp.spawnSync(
      'git',
      [
        'diff',
        '--quiet',
        BASE,
        '--',
        path
      ]
    );

  assert.strictEqual(
    result.status,
    0,
    'Protected writer changed before retrofit authority: ' + path
  );
});

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

assert.strictEqual(
  workflow.split(DESIGN_VALIDATOR).length - 1,
  1,
  'Historical design validator must remain syntax-only in CI.'
);

assert.strictEqual(
  workflow.split(IMPLEMENTATION_VALIDATOR).length - 1,
  1,
  'Historical implementation-contract validator must remain syntax-only in CI.'
);

requireText(
  workflow,
  'node --check ' + DESIGN_VALIDATOR,
  'Historical design-validator syntax check'
);

requireText(
  workflow,
  'node --check ' + IMPLEMENTATION_VALIDATOR,
  'Historical implementation-validator syntax check'
);

assert.ok(
  !workflow.includes(
    'run: node ' + DESIGN_VALIDATOR
  ),
  'Historical design validator must not remain a direct execution step.'
);

assert.ok(
  !workflow.includes(
    'run: node ' + IMPLEMENTATION_VALIDATOR
  ),
  'Historical implementation validator must not remain a direct execution step.'
);

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Lifecycle validator must appear exactly twice in CI.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Lifecycle CI syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Lifecycle CI execution registration'
);

const runtimeLeaseExists =
  fs.existsSync(RUNTIME_LEASE);

const runtimeHarnessExists =
  fs.existsSync(RUNTIME_HARNESS);

assert.strictEqual(
  runtimeLeaseExists,
  runtimeHarnessExists,
  'Partial runtime stage is prohibited: module and harness must appear together.'
);

let stage;

if (!runtimeLeaseExists) {
  stage = 'DESIGN';

  const rpcSearch =
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
    rpcSearch.status,
    1,
    'Generic lease RPC unexpectedly exists or grep failed.'
  );

  assert.strictEqual(
    rpcSearch.stdout.trim(),
    '',
    'Generic lease RPC unexpectedly exists.'
  );

  assert.strictEqual(
    rpcSearch.stderr.trim(),
    '',
    'Generic lease RPC search emitted stderr.'
  );

  console.log(
    'PASS: DESIGN stage retains exact historical evidence with runtime absent.'
  );
} else {
  stage = 'RUNTIME';
}

if (stage === 'RUNTIME') {
  const leaseCheck =
    cp.spawnSync(
      process.execPath,
      [
        '--check',
        RUNTIME_LEASE
      ],
      { encoding: 'utf8' }
    );

  if (leaseCheck.stdout) {
    process.stdout.write(leaseCheck.stdout);
  }

  if (leaseCheck.stderr) {
    process.stderr.write(leaseCheck.stderr);
  }

  assert.strictEqual(
    leaseCheck.status,
    0,
    'Runtime lease syntax check failed.'
  );

  const harnessCheck =
    cp.spawnSync(
      process.execPath,
      [
        '--check',
        RUNTIME_HARNESS
      ],
      { encoding: 'utf8' }
    );

  if (harnessCheck.stdout) {
    process.stdout.write(harnessCheck.stdout);
  }

  if (harnessCheck.stderr) {
    process.stderr.write(harnessCheck.stderr);
  }

  assert.strictEqual(
    harnessCheck.status,
    0,
    'Runtime harness syntax check failed.'
  );

  runNode(
    RUNTIME_HARNESS
  );

  console.log(
    'PASS: RUNTIME stage module and harness certified together.'
  );
}

console.log(
  'PASS: historical design contracts and validators remain byte-exact.'
);

console.log(
  'PASS: protected writer sources remain unchanged.'
);

console.log(
  'PASS: collapse maintenance gate and collapse executor remain absent.'
);

console.log(
  'validation_stage=' + stage
);

console.log(
  'COUNTY_MUTATION_EXCLUSION_LEASE_VALIDATION_LIFECYCLE_PASSED=true'
);
