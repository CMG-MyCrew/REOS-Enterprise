#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');

let checks = 0;

function check(condition, label) {
  assert.ok(condition, label);
  checks += 1;
  console.log('PASS: ' + label);
}

check(
  source.includes("writerId: 'CODE_VIOLATION_DURABLE_IDENTITY_ROLLING'"),
  'exact Writer 9 identity is supplied to the lease assertion'
);

check(
  (source.match(/REOS\.CountyMutationExclusionLease\.assertWriterAllowed/g) || [])
    .length === 1,
  'exact lifecycle-required lease assertion appears once'
);

check(
  (source.match(/\.withScriptLockContext\s*\(/g) || []).length === 1,
  'exactly one actual Database lock callback remains'
);

check(
  (source.match(/\.setValues\s*\(/g) || []).length === 4,
  'exactly two forward and two rollback identity-column write sites remain'
);

check(
  !/LockService\.|\.assertOwnerReady\s*\(|\.openExclusive\s*\(/.test(source),
  'no nested native lock or lease-owner authority is introduced'
);

check(
  !/function\s+reosCountyMutationExclusionLease/.test(source),
  'no generic lease RPC is introduced'
);

check(
  JSON.stringify(
    source.match(/function\s+reos\w+(?=\s*\()/g)
  ) === JSON.stringify([
    'function reosCountyCodeViolationDurableIdentityRollingMigrationStatus',
    'function reosCountyCodeViolationDurableIdentityRollingMigrationPreview',
    'function reosCountyCodeViolationDurableIdentityRollingMigrationExecute'
  ]),
  'public rolling RPC surface is unchanged'
);

function run(file) {
  const result = cp.spawnSync(
    process.execPath,
    [path.join(root, file)],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024
    }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  assert.ifError(result.error);
  assert.equal(result.status, 0, 'Offline validation must pass: ' + file);

  return new Set(result.stdout.split(/\r?\n/));
}

const staticLines = run(
  'scripts/validate-county-code-violation-durable-identity-rolling-migration-executor.js'
);

assert.ok(
  staticLines.has(
    '=== GENERIC ROLLING EXECUTOR STATIC CONTRACT VALIDATION PASSED ==='
  )
);

const behaviorLines = run(
  'scripts/validate-county-code-violation-durable-identity-rolling-migration-executor-behavior.js'
);

assert.ok(
  behaviorLines.has('writer9_rolling_behavior_cases=44'),
  'all 44 Writer 9 behavior scenarios must execute'
);

assert.ok(
  behaviorLines.has('WRITER_9_LEASE_BOUNDARY_BEHAVIOR_PASSED=true')
);

console.log('writer9_static_checks=' + checks);
console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_CODE_VIOLATION_DURABLE_IDENTITY_ROLLING_VALIDATION_PASSED=true'
);
