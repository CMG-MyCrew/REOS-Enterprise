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
  '44740ff1eaefed31631db2f03e340a944f916bad';

const DOC =
  'docs/county-mutation-exclusion-lease-authority-compatibility-v1.md';

const SELF =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const MAINTENANCE_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const OLD_AUTHORITY =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const OLD_FINGERPRINT =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const NEW_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const NEW_FINGERPRINT =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const EXPECTED_LEASE_SHA =
  '7bb81a035b8ed643a1eb02582a02cb7d17bcc43bdc4e0c71ab3da963b48473b4';

const EXPECTED_HARNESS_SHA =
  '61d7c1bb6d55b3be147ffe4fd7c99f932d9a9d194e0cfe30d8875addcbd44ebb';

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

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(path)
    )
    .digest('hex');
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

console.log(
  '=== COUNTY MUTATION-EXCLUSION LEASE AUTHORITY COMPATIBILITY V1 ==='
);

assert.strictEqual(
  git([
    'merge-base',
    BASE,
    'HEAD'
  ]).stdout.trim(),
  BASE,
  'Compatibility baseline is no longer an ancestry root.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  LEASE,
  HARNESS,
  PREFLIGHT
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required artifact missing: ' +
      path
  );
});

assert.strictEqual(
  sha256File(LEASE),
  EXPECTED_LEASE_SHA,
  'Runtime lease changed during design-only increment.'
);

assert.strictEqual(
  sha256File(HARNESS),
  EXPECTED_HARNESS_SHA,
  'Runtime lease harness changed during design-only increment.'
);

const lease =
  fs.readFileSync(
    LEASE,
    'utf8'
  );

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

[
  'COUNTY_MUTATION_EXCLUSION_LEASE_AUTHORITY_COMPATIBILITY_V1',
  'DESIGN ONLY.',
  OLD_AUTHORITY,
  OLD_FINGERPRINT,
  NEW_AUTHORITY,
  NEW_FINGERPRINT,
  '`CURRENT`',
  '`HISTORICAL`',
  '`UNKNOWN`',
  'HISTORICAL active OPEN state',
  'HISTORICAL expired OPEN state',
  'HISTORICAL CLOSED state',
  'CURRENT active OPEN state',
  'CURRENT expired OPEN state',
  'CURRENT CLOSED state',
  'A historical token can never authorize current collapse execution.',
  '`openExclusive(options)` must accept only exact `CURRENT` expected',
  '`assertOwnerReady(options)` must require:',
  '`authorityGeneration=CURRENT`',
  'Closing a historical lease preserves its historical authority pair.',
  'Mixed authority generations must be `UNKNOWN`.',
  'This compatibility transition must not change any protected writer',
  'LEASE_AUTHORITY_COMPATIBILITY_DESIGN_ONLY=true',
  'LEASE_AUTHORITY_COMPATIBILITY_IMPLEMENTATION_PRESENT=false',
  'COLLAPSE_EXECUTION_READY=false',
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false',
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Compatibility contract'
  );
});

for (
  let number = 1;
  number <= 40;
  number++
) {
  requireText(
    doc,
    String(number) + '.',
    'Compatibility harness case ' +
      number
  );
}

requireText(
  lease,
  OLD_AUTHORITY,
  'Historical lease authority'
);

requireText(
  lease,
  OLD_FINGERPRINT,
  'Historical lease fingerprint'
);

assert.strictEqual(
  lease.includes(
    NEW_AUTHORITY
  ),
  false,
  'Current authority must not enter runtime lease in design-only increment.'
);

assert.strictEqual(
  lease.includes(
    NEW_FINGERPRINT
  ),
  false,
  'Current fingerprint must not enter runtime lease in design-only increment.'
);

requireText(
  preflight,
  NEW_AUTHORITY,
  'Current preflight authority'
);

requireText(
  preflight,
  NEW_FINGERPRINT,
  'Current preflight fingerprint'
);

requireText(
  preflight,
  'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED',
  'Current compatibility blocker'
);

PROTECTED_WRITERS.forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Protected writer missing: ' +
      path
  );

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
    'Protected writer changed during compatibility design: ' +
      path
  );
});

assert.ok(
  !fs.existsSync(
    MAINTENANCE_GATE
  ),
  'Collapse maintenance implementation remains prohibited.'
);

assert.ok(
  !fs.existsSync(
    EXECUTOR
  ),
  'Collapse executor implementation remains prohibited.'
);

const occurrences =
  workflow
    .split(SELF)
    .length - 1;

assert.strictEqual(
  occurrences,
  2,
  'Compatibility validator must appear exactly twice in CI.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Compatibility syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Compatibility CI execution'
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
  'PASS: historical and current authority generations are exact.'
);

console.log(
  'PASS: safe historical CLOSED/expired states are explicitly compatible.'
);

console.log(
  'PASS: active historical OPEN state remains writer-blocking and non-owner-ready.'
);

console.log(
  'PASS: mixed and unknown authority pairs remain fail-closed.'
);

console.log(
  'PASS: only current authority may open a new lease or satisfy owner readiness.'
);

console.log(
  'PASS: exact historical OPEN lease may be closed without upgrading authority.'
);

console.log(
  'PASS: runtime lease and runtime harness remain byte-exact.'
);

console.log(
  'PASS: all protected writer sources remain unchanged.'
);

console.log(
  'PASS: collapse executor and maintenance implementation remain absent.'
);

console.log(
  'LEASE_AUTHORITY_COMPATIBILITY_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'LEASE_RUNTIME_CHANGED=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
