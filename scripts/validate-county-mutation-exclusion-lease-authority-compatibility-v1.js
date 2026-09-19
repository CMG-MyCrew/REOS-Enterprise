#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  '212bd5b56ec8fda87e437467d774bfa206e75726';

const DOC =
  'docs/county-mutation-exclusion-lease-authority-compatibility-v1.md';

const SELF =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-v1.js';

const RUNTIME_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-runtime-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const HISTORICAL_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const MAINTENANCE_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const HISTORICAL_AUTHORITY =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const HISTORICAL_FINGERPRINT =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const CURRENT_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const CURRENT_FINGERPRINT =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const EXPECTED_DOC_SHA =
  '6da013c3210e883dfd95e104c18e73a394b59f989ca06e480bc16b6142c56036';

const EXPECTED_HISTORICAL_LEASE_SHA =
  '7bb81a035b8ed643a1eb02582a02cb7d17bcc43bdc4e0c71ab3da963b48473b4';

const EXPECTED_HISTORICAL_HARNESS_SHA =
  '61d7c1bb6d55b3be147ffe4fd7c99f932d9a9d194e0cfe30d8875addcbd44ebb';

const EXPECTED_CURRENT_LEASE_SHA =
  'f4e02ba1c8aef87075a87437673691b02d8a8587be2dd51280c9708b92954fdb';

const EXPECTED_RUNTIME_HARNESS_SHA =
  '4a8e18fc495869fd8bd47a66f89c3989720f162d3cbde07ad098ddb2029d938d';

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
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js',
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js'
];

function sha256Bytes(bytes) {
  return crypto
    .createHash('sha256')
    .update(bytes)
    .digest('hex');
}

function sha256File(path) {
  return sha256Bytes(
    fs.readFileSync(path)
  );
}

function git(args) {
  const result =
    cp.spawnSync(
      'git',
      args,
      {
        encoding:
          'utf8'
      }
    );

  if (result.error) {
    throw result.error;
  }

  return result;
}

function gitFile(ref, path) {
  const result =
    git([
      'show',
      ref + ':' + path
    ]);

  assert.strictEqual(
    result.status,
    0,
    'Unable to read historical Git artifact: ' +
      path
  );

  return Buffer.from(
    result.stdout,
    'utf8'
  );
}

function requireText(
  text,
  marker,
  label
) {
  assert.ok(
    text.includes(marker),
    label +
      ' missing: ' +
      marker
  );
}

function runNode(path) {
  const syntax =
    cp.spawnSync(
      process.execPath,
      [
        '--check',
        path
      ],
      {
        encoding:
          'utf8'
      }
    );

  if (syntax.stdout) {
    process.stdout.write(
      syntax.stdout
    );
  }

  if (syntax.stderr) {
    process.stderr.write(
      syntax.stderr
    );
  }

  assert.strictEqual(
    syntax.status,
    0,
    'Node syntax check failed: ' +
      path
  );

  const result =
    cp.spawnSync(
      process.execPath,
      [
        path
      ],
      {
        encoding:
          'utf8'
      }
    );

  if (result.stdout) {
    process.stdout.write(
      result.stdout
    );
  }

  if (result.stderr) {
    process.stderr.write(
      result.stderr
    );
  }

  assert.strictEqual(
    result.status,
    0,
    'Node execution failed: ' +
      path
  );
}

console.log(
  '=== COUNTY MUTATION-EXCLUSION LEASE AUTHORITY COMPATIBILITY — IMPLEMENTED ==='
);

assert.strictEqual(
  git([
    'merge-base',
    BASE,
    'HEAD'
  ]).stdout.trim(),
  BASE
);

[
  DOC,
  SELF,
  RUNTIME_HARNESS,
  WORKFLOW,
  LEASE,
  HISTORICAL_HARNESS,
  PREFLIGHT
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required compatibility artifact missing: ' +
      path
  );
});

assert.strictEqual(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Merged compatibility design contract changed.'
);

assert.strictEqual(
  sha256Bytes(
    gitFile(
      BASE,
      LEASE
    )
  ),
  EXPECTED_HISTORICAL_LEASE_SHA,
  'Historical lease baseline changed.'
);

assert.strictEqual(
  sha256File(HISTORICAL_HARNESS),
  EXPECTED_HISTORICAL_HARNESS_SHA,
  'Historical 50-case runtime harness changed.'
);

assert.strictEqual(
  sha256File(LEASE),
  EXPECTED_CURRENT_LEASE_SHA,
  'Current compatibility lease SHA changed.'
);

assert.strictEqual(
  sha256File(RUNTIME_HARNESS),
  EXPECTED_RUNTIME_HARNESS_SHA,
  'Current compatibility runtime harness SHA changed.'
);

const lease =
  fs.readFileSync(
    LEASE,
    'utf8'
  );

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

[
  'COUNTY_MUTATION_EXCLUSION_LEASE_AUTHORITY_COMPATIBILITY_V1',
  HISTORICAL_AUTHORITY,
  HISTORICAL_FINGERPRINT,
  CURRENT_AUTHORITY,
  CURRENT_FINGERPRINT,
  '`CURRENT`',
  '`HISTORICAL`',
  '`UNKNOWN`',
  'A historical token can never authorize current collapse execution.',
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Compatibility design contract'
  );
});

[
  HISTORICAL_AUTHORITY,
  HISTORICAL_FINGERPRINT,
  CURRENT_AUTHORITY,
  CURRENT_FINGERPRINT,
  'HISTORICAL',
  'CURRENT',
  'UNKNOWN',
  'authorityGeneration_',
  'Only CURRENT authority lease may satisfy owner readiness.'
].forEach(marker => {
  requireText(
    lease,
    marker,
    'Compatibility runtime lease'
  );
});

requireText(
  preflight,
  CURRENT_AUTHORITY,
  'Post-restoration preflight authority'
);

requireText(
  preflight,
  CURRENT_FINGERPRINT,
  'Post-restoration preflight fingerprint'
);

requireText(
  preflight,
  'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED',
  'Fail-closed preflight compatibility blocker'
);

const preflightDiff =
  git([
    'diff',
    '--quiet',
    BASE,
    '--',
    PREFLIGHT
  ]);

assert.strictEqual(
  preflightDiff.status,
  0,
  'Execution preflight changed during lease compatibility implementation.'
);

PROTECTED_WRITERS.forEach(path => {
  const diff =
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]);

  assert.strictEqual(
    diff.status,
    0,
    'Protected writer changed during compatibility runtime implementation: ' +
      path
  );
});

assert.ok(
  !fs.existsSync(
    MAINTENANCE_GATE
  ),
  'Collapse maintenance gate remains prohibited.'
);

assert.ok(
  !fs.existsSync(
    EXECUTOR
  ),
  'Collapse executor remains prohibited.'
);

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Compatibility validator CI registration changed.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Compatibility validator syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Compatibility validator execution registration'
);

runNode(
  RUNTIME_HARNESS
);

const rpcSearch =
  git([
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

console.log(
  'PASS: historical lease baseline remains SHA-certified.'
);

console.log(
  'PASS: historical 50-case runtime harness remains byte-exact.'
);

console.log(
  'PASS: current runtime recognizes CURRENT, HISTORICAL, and UNKNOWN authority generations.'
);

console.log(
  'PASS: historical CLOSED/expired state remains writer-compatible but never owner-ready.'
);

console.log(
  'PASS: historical active OPEN remains writer-blocking.'
);

console.log(
  'PASS: only CURRENT authority may open a new lease or satisfy owner readiness.'
);

console.log(
  'PASS: protected writer sources and execution preflight remain unchanged.'
);

console.log(
  'LEASE_AUTHORITY_COMPATIBILITY_IMPLEMENTATION_PRESENT=true'
);

console.log(
  'LEASE_AUTHORITY_COMPATIBILITY_RUNTIME_VALIDATION_PASSED=true'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
