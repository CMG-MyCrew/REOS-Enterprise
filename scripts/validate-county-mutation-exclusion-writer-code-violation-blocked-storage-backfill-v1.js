#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');
const fs =
  require('node:fs');
const cp =
  require('node:child_process');

const SOURCE =
  'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js';

const STATIC =
  'scripts/validate-county-code-violation-blocked-storage-backfill-v1.js';

const BEHAVIOR =
  'scripts/validate-county-code-violation-blocked-storage-backfill-v1-behavior.js';

const source =
  fs.readFileSync(SOURCE, 'utf8');

let cases = 0;

function check(value, message) {
  assert.ok(value, message);
  cases += 1;
  console.log('PASS: ' + message);
}

function count(text, token) {
  return text.split(token).length - 1;
}

function run(file) {
  const result =
    cp.spawnSync(
      process.execPath,
      [file],
      {
        cwd: process.cwd(),
        encoding: 'utf8'
      }
    );

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  assert.equal(
    result.status,
    0,
    file + ' must pass.'
  );
}

check(
  source.includes(
    "'CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL'"
  ),
  'exact Writer #6 identity is embedded.'
);

check(
  count(
    source,
    'REOS.CountyMutationExclusionLease.assertWriterAllowed'
  ) === 1,
  'exactly one lifecycle-required lease assertion literal exists.'
);

check(
  count(
    source,
    'REOS.Database.withScriptLockContext'
  ) === 2,
  'dependency check plus one actual Database lock callback remain.'
);

check(
  count(
    source,
    'REOS.Database.withScriptLockContext(function () {'
  ) === 1,
  'exactly one actual Database ScriptLock callback exists.'
);

check(
  count(
    source,
    '.setValues('
  ) === 4,
  'exactly two forward and two rollback setValues sites remain.'
);

check(
  !source.includes('LockService.'),
  'no nested/native LockService acquisition exists.'
);

check(
  !source.includes('.assertOwnerReady(') &&
    !source.includes('.openExclusive('),
  'no owner or lease-opening authority is introduced.'
);

const start =
  source.indexOf(
    'REOS.Database.withScriptLockContext(function () {'
  );

const end =
  source.indexOf(
    'var summaries = spanSummary_(result.lockedSpans);',
    start
  );

assert.ok(
  start >= 0 &&
    end > start
);

const locked =
  source.slice(start, end);

const leaseAt =
  locked.indexOf(
    'assertWriterAllowed_();'
  );

const forwardAt =
  locked.indexOf(
    'writeBackfillSpans_('
  );

const rollbackAt =
  locked.indexOf(
    'restoreBackfillSpans_('
  );

check(
  leaseAt >= 0 &&
    forwardAt > leaseAt,
  'lease assertion executes under lock before forward mutation.'
);

check(
  rollbackAt > forwardAt,
  'rollback executes later under the same lock callback.'
);

check(
  !source.slice(end).includes(
    'restoreBackfillSpans_(sheet, columns, prestate)'
  ),
  'no rollback mutation remains outside the Database lock callback.'
);

check(
  !/\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.deleteRow\s*\(|appendRow\s*\(/.test(
    source
  ),
  'no alternate row mutation API is introduced.'
);

run(STATIC);
cases += 1;
console.log(
  'PASS: blocked-storage static contract remains valid.'
);

run(BEHAVIOR);
cases += 1;
console.log(
  'PASS: forward and rollback behavior remains valid under one lock.'
);

console.log(
  'blocked_storage_backfill_cases=' +
    cases
);

console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL_VALIDATION_PASSED=true'
);
