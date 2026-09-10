#!/usr/bin/env node

'use strict';

const fs = require('fs');

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js';

const OLD_CONTRACT =
  'docs/gate2b-code-violations-durable-identity-rolling-executor-v1.md';

const NEW_CONTRACT =
  'docs/gate2b-code-violations-durable-identity-large-window-v1.md';

const executor = fs.readFileSync(EXECUTOR, 'utf8');
const oldContract = fs.readFileSync(OLD_CONTRACT, 'utf8');
const contract = fs.readFileSync(NEW_CONTRACT, 'utf8');

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

/*
 * Historical contract must not be silently rewritten.
 */
requireText(
  oldContract,
  /Version 1 maximum:[\s\S]*?`10` records\./,
  'historical v1 contract retains 10-row maximum.'
);

requireText(
  oldContract,
  /greater than 10 MUST fail closed/,
  'historical v1 >10 rejection remains preserved.'
);

/*
 * Promotion ceiling.
 */
requireText(
  contract,
  /Promoted hard maximum:[\s\S]*?`100` records\./,
  'promotion contract authorizes a bounded 100-row ceiling.'
);

requireText(
  contract,
  /greater than `100` MUST fail closed/,
  'promotion contract requires >100 fail-closed behavior.'
);

requireText(
  executor,
  /DEFAULT_BATCH_MAX\s*=\s*100/,
  'executor default maximum is 100.'
);

requireText(
  executor,
  /HARD_BATCH_MAX\s*=\s*100/,
  'executor hard maximum is 100.'
);

requireText(
  executor,
  /n\s*<=\s*HARD_BATCH_MAX/,
  'runtime ceiling remains enforced.'
);

/*
 * Exact mutation topology.
 */
requireText(
  contract,
  /one contiguous N x 1 write to Source Record Key/,
  'promotion preserves first contiguous N x 1 write.'
);

requireText(
  contract,
  /one contiguous N x 1 write to Source Observation Key/,
  'promotion preserves second contiguous N x 1 write.'
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

/*
 * Rolling authority.
 */
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
    name + ' remains explicit and fail-closed.'
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

requireText(
  executor,
  /assertContiguousSelection_/,
  'contiguous physical selection remains mandatory.'
);

requireText(
  executor,
  /verifyPhysicalPrestate_/,
  'physical prestate verification remains mandatory.'
);

requireText(
  executor,
  /capturePrestate_/,
  'rollback prestate capture remains mandatory.'
);

requireText(
  executor,
  /restoreIdentityColumns_/,
  'rollback restoration remains mandatory.'
);

requireText(
  executor,
  /verifyPostPlan_/,
  'independent post-plan verification remains mandatory.'
);

requireText(
  executor,
  /withScriptLockContext/,
  'outer fail-fast lock boundary remains.'
);

requireText(
  executor,
  /retryPermitted:\s*false/,
  'automatic retry remains prohibited.'
);

requireText(
  executor,
  /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/,
  'ambiguous/no-retry state remains represented.'
);

requireText(
  executor,
  /schedulerMutationAuthorityGranted:\s*false/,
  'scheduler mutation authority remains false.'
);

requireText(
  executor,
  /checkpointMutationAuthorityGranted:\s*false/,
  'checkpoint mutation authority remains false.'
);

requireText(
  executor,
  /automaticOfferAuthorityGranted:\s*false/,
  'automatic offer authority remains false.'
);

console.log();
console.log(
  '=== GATE 2B 100-ROW LARGE-WINDOW PROMOTION CONTRACT VALIDATION PASSED ==='
);
