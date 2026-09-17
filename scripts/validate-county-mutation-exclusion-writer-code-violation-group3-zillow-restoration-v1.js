#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const cp =
  require('node:child_process');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const SOURCE =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js'
  );

const VALIDATOR =
  'scripts/validate-county-code-violation-group3-zillow-restoration-executor-v1.js';

const source =
  fs.readFileSync(
    SOURCE,
    'utf8'
  );

let checks = 0;

function check(
  condition,
  label
) {
  assert.ok(
    condition,
    label
  );

  checks++;

  console.log(
    'PASS: ' +
    label
  );
}

check(
  /CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION/.test(
    source
  ),
  'exact Writer 13 identity is present'
);

check(
  (
    source.match(
      /REOS\.CountyMutationExclusionLease\s*\.assertWriterAllowed/g
    ) || []
  ).length === 1,
  'exact lifecycle-required lease assertion appears once'
);

check(
  (
    source.match(
      /\.withScriptLockContext\s*\(/g
    ) || []
  ).length === 1,
  'exactly one caller-owned Database ScriptLock callback exists'
);

check(
  (
    source.match(
      /REOS\.Database\s*\.replacePhysicalRowExact\s*\(/g
    ) || []
  ).length === 1,
  'exactly one certified full-row replacement invocation exists'
);

check(
  !(
    /LockService\./.test(source) ||
    /\.openExclusive\s*\(/.test(source) ||
    /\.assertOwnerReady\s*\(/.test(source) ||
    /\.setValues?\s*\(/.test(source) ||
    /\.deleteRows?\s*\(/.test(source) ||
    /\.appendRow\s*\(/.test(source) ||
    /\.clearContent\s*\(/.test(source) ||
    /patchPhysicalRowCellsExact\s*\(/.test(source) ||
    /deletePhysicalRowExact\s*\(/.test(source)
  ),
  'no nested lock, lease-owner authority, direct spreadsheet write, delete, clear, or broader primitive is introduced'
);

check(
  !/\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    source
  ),
  'no public Group 3 RPC is introduced'
);

const result =
  cp.spawnSync(
    process.execPath,
    [
      path.join(
        ROOT,
        VALIDATOR
      )
    ],
    {
      cwd:
        ROOT,
      encoding:
        'utf8',
      maxBuffer:
        24 * 1024 * 1024
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

assert.ifError(
  result.error
);

assert.equal(
  result.status,
  0,
  'Group 3 executor offline validator must pass.'
);

const lines =
  new Set(
    result.stdout
      .split(/\r?\n/)
  );

assert.ok(
  lines.has(
    'GROUP3_ZILLOW_RESTORATION_EXECUTOR_VALIDATION_PASSED=true'
  )
);

assert.ok(
  lines.has(
    'GROUP3_EXECUTOR_BEHAVIOR_CASES=12'
  )
);

assert.ok(
  lines.has(
    'GROUP3_EXECUTOR_PUBLIC_RPC_PRESENT=false'
  )
);

console.log(
  'writer13_static_checks=' +
  checks
);

console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_GROUP3_ZILLOW_RESTORATION_VALIDATION_PASSED=true'
);
