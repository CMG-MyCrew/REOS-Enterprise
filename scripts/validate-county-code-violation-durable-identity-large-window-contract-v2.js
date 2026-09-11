#!/usr/bin/env node
'use strict';

const fs = require('fs');

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js';

const ROLLING_V1 =
  'docs/gate2b-code-violations-durable-identity-rolling-executor-v1.md';

const WINDOW_V1 =
  'docs/gate2b-code-violations-durable-identity-large-window-v1.md';

const WINDOW_V2 =
  'docs/gate2b-code-violations-durable-identity-large-window-v2.md';

const executor = fs.readFileSync(EXECUTOR, 'utf8');
const rollingV1 = fs.readFileSync(ROLLING_V1, 'utf8');
const windowV1 = fs.readFileSync(WINDOW_V1, 'utf8');
const windowV2 = fs.readFileSync(WINDOW_V2, 'utf8');

function fail(message) {
  console.error('STOP: ' + message);
  process.exit(1);
}

function pass(message) {
  console.log('PASS: ' + message);
}

function requireText(text, pattern, message) {
  if (!pattern.test(text)) fail(message);
  pass(message);
}

requireText(
  rollingV1,
  /Version 1 maximum:[\s\S]*?`10` records\./,
  'historical rolling v1 retains 10-row maximum.'
);

requireText(
  windowV1,
  /Promoted hard maximum:[\s\S]*?`100` records\./,
  'historical large-window v1 retains 100-row maximum.'
);

requireText(
  windowV1,
  /greater than `100` MUST fail closed/,
  'historical 100-row boundary remains documented.'
);

requireText(
  windowV2,
  /Promoted default:[\s\S]*?`100` records\./,
  'v2 preserves 100-row default.'
);

requireText(
  windowV2,
  /Promoted hard maximum:[\s\S]*?`250` records\./,
  'v2 authorizes bounded 250-row hard ceiling.'
);

requireText(
  windowV2,
  /greater than `250` MUST fail closed/,
  'v2 requires >250 fail-closed behavior.'
);

requireText(
  windowV2,
  /confirmLargeWindowMigration=true/,
  'v2 requires explicit large-window confirmation.'
);

requireText(
  executor,
  /DEFAULT_BATCH_MAX\s*=\s*100/,
  'executor default remains 100.'
);

requireText(
  executor,
  /HARD_BATCH_MAX\s*=\s*250/,
  'executor hard maximum is 250.'
);

requireText(
  executor,
  /batchSize_\(options\.batchSize\);/,
  'preview omitted batchSize uses the certified 100-row default.'
);

if (/batchSize_\(options\.batchSize\s*\|\|\s*HARD_BATCH_MAX\)/.test(executor)) {
  fail('preview must not default omitted batchSize to the 250-row hard ceiling.');
}

pass('preview does not silently escalate omitted batchSize to 250.');

requireText(
  executor,
  /PREVIOUS_CERTIFIED_BATCH_MAX\s*=\s*100/,
  'previous 100-row boundary is explicit.'
);

requireText(
  executor,
  /n\s*<=\s*HARD_BATCH_MAX/,
  'runtime hard ceiling remains enforced.'
);

requireText(
  executor,
  /options\.confirmLargeWindowMigration\s*===\s*true/,
  'large-window confirmation is runtime enforced.'
);

[
  'confirmRollingMigration',
  'confirmDurableIdentity',
  'confirmInPlace',
  'confirmNoInsertDelete',
  'confirmMigrationReadyOnly'
].forEach(name => {
  requireText(
    executor,
    new RegExp('options\\.' + name + '\\s*===\\s*true'),
    name + ' remains explicit.'
  );
});

requireText(
  executor,
  /options\.migrationPlanSha256/,
  'migration-plan SHA remains caller-bound.'
);

requireText(
  executor,
  /options\.completePlanSha256/,
  'complete-plan SHA remains caller-bound.'
);

const writes = (executor.match(/\.setValues\(/g) || []).length;

if (writes !== 4) {
  fail(
    'expected exactly four setValues call sites: two forward and two rollback.'
  );
}

pass('two forward plus two rollback setValues call sites remain exact.');

if (
  /\.insert\s*\(/.test(executor) ||
  /\.upsert\s*\(/.test(executor) ||
  /\.update\s*\(/.test(executor) ||
  /\.deleteRow\s*\(/.test(executor) ||
  /appendRow\s*\(/.test(executor)
) {
  fail('forbidden broad mutation API detected.');
}

pass('no broad insert/upsert/update/delete/append authority exists.');

[
  /assertContiguousSelection_/,
  /verifyPhysicalPrestate_/,
  /capturePrestate_/,
  /restoreIdentityColumns_/,
  /verifyPostPlan_/,
  /withScriptLockContext/,
  /retryPermitted:\s*false/,
  /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/,
  /schedulerMutationAuthorityGranted:\s*false/,
  /checkpointMutationAuthorityGranted:\s*false/,
  /automaticOfferAuthorityGranted:\s*false/
].forEach(pattern => {
  requireText(
    executor,
    pattern,
    'required fail-closed invariant remains represented.'
  );
});

console.log();
console.log(
  '=== GATE 2B 250-WINDOW V2 CONTRACT VALIDATION PASSED ==='
);
