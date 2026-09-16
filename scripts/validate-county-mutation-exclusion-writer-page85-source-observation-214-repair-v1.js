#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(
  ROOT,
  'build/apps-script-brand/CountyPage85SourceObservation214Repair.js'
);
const source = fs.readFileSync(SOURCE, 'utf8');

let checks = 0;

function check(condition, label) {
  assert.ok(condition, label);
  checks += 1;
  console.log('PASS: ' + label);
}

check(
  /writerId:\s*'PAGE85_SOURCE_OBSERVATION_214_REPAIR'/.test(source),
  'exact Writer 11 identity is supplied to the lease assertion'
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
  'exactly one shared bounded physical-write primitive remains'
);

check(
  !(
    /LockService\./.test(source) ||
    /\.assertOwnerReady\s*\(/.test(source) ||
    /\.openExclusive\s*\(/.test(source) ||
    /REOS\.Database\s*\.(?:insert|update|upsert|softDelete)\s*\(/.test(source) ||
    /\.deleteRows?\s*\(/.test(source) ||
    /\.appendRow\s*\(/.test(source)
  ),
  'no nested lock, lease-owner authority, row-delete, or broad mutation surface is introduced'
);

check(
  !/function\s+reosCountyMutationExclusionLease/.test(source),
  'no generic mutation-exclusion lease RPC is introduced'
);

check(
  JSON.stringify(source.match(/function\s+reos\w+(?=\s*\()/g)) ===
    JSON.stringify([
      'function reosCountyPage85SourceObservation214Repair'
    ]),
  'public Page-85 repair RPC surface is unchanged'
);

function run(file) {
  const result = cp.spawnSync(
    process.execPath,
    [path.join(ROOT, file)],
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024
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
  'scripts/validate-county-page85-source-observation-214-repair.js'
);

const behaviorLines = run(
  'scripts/validate-county-page85-source-observation-214-repair-failure-paths.js'
);

assert.ok(
  staticLines.has(
    'Page-85 source observation 214 repair validation PASSED.'
  )
);

assert.ok(
  behaviorLines.has(
    'PAGE-85 DYNAMIC FAILURE-PATH CERTIFICATION PASSED.'
  )
);

assert.ok(
  behaviorLines.has('writer11_page85_lease_behavior_cases=9')
);

assert.ok(
  behaviorLines.has('WRITER_11_LEASE_BOUNDARY_BEHAVIOR_PASSED=true')
);

console.log('writer11_static_checks=' + checks);
console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_PAGE85_SOURCE_OBSERVATION_214_REPAIR_VALIDATION_PASSED=true'
);
