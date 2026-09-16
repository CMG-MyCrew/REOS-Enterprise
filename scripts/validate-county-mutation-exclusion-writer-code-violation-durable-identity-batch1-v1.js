#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourcePath = process.argv[2] || path.join(root,
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationBatch1Executor.js');
const legacy = path.join(root,
  'scripts/validate-county-code-violation-durable-identity-migration-batch1-executor.js');
const source = fs.readFileSync(sourcePath, 'utf8');
let checks = 0;

function check(condition, label) {
  assert.ok(condition, label);
  checks += 1;
  console.log('PASS: ' + label);
}

check(source.includes("writerId: 'CODE_VIOLATION_DURABLE_IDENTITY_BATCH1'"),
  'exact Writer 7 identity is supplied to the lease assertion');
check((source.match(/REOS\.CountyMutationExclusionLease\.assertWriterAllowed/g) || []).length === 1,
  'exact lifecycle-required lease assertion appears once');
check((source.match(/\.withScriptLockContext\s*\(/g) || []).length === 1,
  'exactly one actual Database lock callback remains');
check((source.match(/\.setValues\s*\(/g) || []).length === 2,
  'exactly two narrow identity-column write primitives remain');
check(!/LockService\.|\.assertOwnerReady\s*\(|\.openExclusive\s*\(/.test(source),
  'no nested native lock or lease-owner authority is introduced');
check(!/function\s+reosCountyMutationExclusionLease/.test(source),
  'no generic lease RPC is introduced');
check(JSON.stringify(source.match(/function\s+reos\w+(?=\s*\()/g)) === JSON.stringify([
  'function reosCountyCodeViolationDurableIdentityMigrationBatch1Status',
  'function reosCountyCodeViolationDurableIdentityMigrationBatch1Execute'
]), 'public Batch 1 RPC surface is unchanged');

const result = cp.spawnSync(process.execPath, [legacy, sourcePath], {
  cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
assert.ifError(result.error);
assert.equal(result.status, 0, 'Batch 1 behavior and lease-boundary validation must pass');
const lines = new Set(result.stdout.split(/\r?\n/));
assert.ok(lines.has('repositoryFixtureMode=true'), 'offline repository fixture mode is required');
assert.ok(lines.has('productionEvidenceMode=false'), 'production evidence mode must remain disabled');
assert.ok(lines.has('writer7_batch1_behavior_cases=23'), 'all 23 behavior scenarios must execute');
assert.ok(lines.has('WRITER_7_LEASE_BOUNDARY_BEHAVIOR_PASSED=true'));
console.log('writer7_static_checks=' + checks);
console.log('COUNTY_MUTATION_EXCLUSION_WRITER_CODE_VIOLATION_DURABLE_IDENTITY_BATCH1_VALIDATION_PASSED=true');
