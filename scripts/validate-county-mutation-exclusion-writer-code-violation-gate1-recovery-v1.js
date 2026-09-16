#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js'
);
const source = fs.readFileSync(sourcePath, 'utf8');

let checks = 0;

function check(condition, label) {
  assert.ok(condition, label);
  checks += 1;
  console.log('PASS: ' + label);
}

check(
  source.includes("writerId: 'CODE_VIOLATION_GATE1_RECOVERY'"),
  'exact Writer 10 identity is supplied to the lease assertion'
);

check(
  (source.match(/REOS\.CountyMutationExclusionLease\.assertWriterAllowed/g) || [])
    .length === 1,
  'exact lifecycle-required lease assertion appears once'
);

check(
  (source.match(/\.withScriptLockContext\s*\(/g) || []).length === 1,
  'exactly one existing Database ScriptLock callback remains'
);

check(
  (source.match(/REOS\.Database\s*\.insert\s*\(/g) || []).length === 1,
  'exactly one lock-owned Database.insert call site remains'
);

check(
  !(
    /REOS\.Database\s*\.(?:update|upsert|softDelete)\s*\(/.test(source) ||
    /\.setValues\s*\(/.test(source) ||
    /\.setValue\s*\(/.test(source) ||
    /\.appendRow\s*\(/.test(source) ||
    /\.deleteRows?\s*\(/.test(source)
  ),
  'no broad or direct spreadsheet mutation authority is introduced'
);

check(
  !/LockService\.|\.assertOwnerReady\s*\(|\.openExclusive\s*\(/.test(source),
  'no nested native lock or lease-owner authority is introduced'
);

check(
  JSON.stringify(source.match(/function\s+reos\w+(?=\s*\()/g)) ===
    JSON.stringify(['function reosCountyCodeViolationGate1RecoveryExecute']),
  'public Gate 1 recovery RPC surface is unchanged'
);

function run(file) {
  const result = cp.spawnSync(
    process.execPath,
    [path.join(root, file)],
    {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024
    }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  assert.ifError(result.error);
  assert.equal(result.status, 0, 'Offline validation must pass: ' + file);

  return new Set(result.stdout.split(/\r?\n/));
}

run('scripts/validate-code-violations-gate1-recovery-authority.js');

const executorLines = run(
  'scripts/validate-code-violations-gate1-recovery-executor.js'
);

run('scripts/validate-code-violations-gate1-recovery-maintenance-gate.js');
run('scripts/validate-code-violations-gate1-recovery-preflight.js');

assert.ok(
  executorLines.has(
    'Code Violations Gate 1 bounded recovery executor validation PASSED.'
  )
);

assert.ok(
  executorLines.has('writer10_gate1_lease_behavior_cases=9'),
  'all 9 Writer 10 lease-boundary cases must execute'
);

assert.ok(
  executorLines.has('WRITER_10_LEASE_BOUNDARY_BEHAVIOR_PASSED=true')
);

console.log('writer10_static_checks=' + checks);
console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_CODE_VIOLATION_GATE1_RECOVERY_VALIDATION_PASSED=true'
);
