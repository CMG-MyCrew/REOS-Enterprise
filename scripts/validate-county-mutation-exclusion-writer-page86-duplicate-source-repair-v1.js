#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(
  ROOT,
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js'
);
const source = fs.readFileSync(SOURCE, 'utf8');

let checks = 0;

function check(condition, label) {
  assert.ok(condition, label);
  checks += 1;
  console.log('PASS: ' + label);
}

check(
  /writerId:\s*'PAGE86_DUPLICATE_SOURCE_REPAIR'/.test(source),
  'exact Writer 12 identity is supplied to the lease assertion'
);

check(
  (source.match(
    /REOS\.CountyMutationExclusionLease\.assertWriterAllowed/g
  ) || []).length === 1,
  'exact lifecycle-required lease assertion appears once'
);

check(
  (source.match(/\.withScriptLockContext\s*\(/g) || []).length === 1,
  'exactly one existing Database ScriptLock callback remains'
);

check(
  (source.match(/\.setValues\s*\(/g) || []).length === 1,
  'exactly one shared bounded block-write primitive remains'
);

check(
  !(
    /LockService\./.test(source) ||
    /\.assertOwnerReady\s*\(/.test(source) ||
    /\.openExclusive\s*\(/.test(source) ||
    /REOS\.Database\s*\.(?:insert|update|upsert|softDelete)\s*\(/.test(source) ||
    /\.deleteRows?\s*\(/.test(source) ||
    /\.appendRow\s*\(/.test(source) ||
    /\.clearContent\s*\(/.test(source)
  ),
  'no nested lock, lease-owner authority, row-delete, clear, or broad mutation surface is introduced'
);

check(
  !/function\s+reosCountyMutationExclusionLease/.test(source),
  'no generic mutation-exclusion lease RPC is introduced'
);

check(
  JSON.stringify(source.match(/function\s+reos\w+(?=\s*\()/g)) ===
    JSON.stringify([
      'function reosCountyPage86DuplicateSourceRepair',
      'function reosCountyPage86DuplicateSourceRepairStatus'
    ]),
  'public Page-86 repair RPC surface remains exactly two functions'
);

function run(file) {
  const result = cp.spawnSync(
    process.execPath,
    [path.join(ROOT, file)],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 24 * 1024 * 1024
    }
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  assert.ifError(result.error);
  assert.equal(
    result.status,
    0,
    'Offline validation must pass: ' + file
  );

  return new Set(result.stdout.split(/\r?\n/));
}

const staticLines = run(
  'scripts/validate-county-page86-duplicate-source-repair.js'
);

const behaviorLines = run(
  'scripts/validate-county-page86-duplicate-source-repair-failure-paths.js'
);

assert.ok(
  staticLines.has(
    'Page-86 duplicate source repair static contract PASSED.'
  ),
  'legacy Page-86 static validator completion marker is required'
);

assert.ok(
  behaviorLines.has(
    'PAGE-86 DYNAMIC FAILURE-PATH CERTIFICATION PASSED.'
  ),
  'legacy Page-86 failure-path validator completion marker is required'
);

assert.ok(
  behaviorLines.has('writer12_page86_lease_behavior_cases=10'),
  'all 10 Writer 12 lease-boundary cases must execute'
);

assert.ok(
  behaviorLines.has('WRITER_12_LEASE_BOUNDARY_BEHAVIOR_PASSED=true')
);

console.log('writer12_static_checks=' + checks);
console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_PAGE86_DUPLICATE_SOURCE_REPAIR_VALIDATION_PASSED=true'
);
