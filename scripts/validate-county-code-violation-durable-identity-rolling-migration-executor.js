#!/usr/bin/env node

'use strict';

const fs = require('fs');

const SRC =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js';

const CONTRACT =
  'docs/gate2b-code-violations-durable-identity-rolling-executor-v1.md';

const source = fs.readFileSync(SRC, 'utf8');
const contract = fs.readFileSync(CONTRACT, 'utf8');

function pass(message) {
  console.log('PASS: ' + message);
}

function fail(message) {
  console.error('STOP: ' + message);
  process.exit(1);
}

function requireText(text, pattern, message) {
  if (!pattern.test(text)) fail(message);
  pass(message);
}

function count(text, pattern) {
  return (text.match(pattern) || []).length;
}

requireText(
  source,
  /confirmRollingMigration/,
  'rolling migration confirmation is represented.'
);

requireText(
  source,
  /confirmDurableIdentity/,
  'durable identity confirmation is represented.'
);

requireText(
  source,
  /confirmInPlace/,
  'in-place confirmation is represented.'
);

requireText(
  source,
  /confirmNoInsertDelete/,
  'no-insert/delete confirmation is represented.'
);

requireText(
  source,
  /confirmMigrationReadyOnly/,
  'migration-ready-only confirmation is represented.'
);

requireText(
  source,
  /migrationPlanSha256/,
  'current migration plan SHA is caller-bound.'
);

requireText(
  source,
  /completePlanSha256/,
  'current complete plan SHA is caller-bound.'
);

requireText(
  source,
  /batchSize/,
  'bounded requested batch size is supported.'
);

requireText(
  source,
  /HARD_BATCH_MAX\s*=\s*10/,
  'hard batch maximum is 10.'
);

requireText(
  source,
  /SOURCE_RECORD_KEY_COLUMN\s*=\s*25/,
  'Source Record Key is column 25.'
);

requireText(
  source,
  /SOURCE_OBSERVATION_KEY_COLUMN\s*=\s*51/,
  'Source Observation Key is column 51.'
);

requireText(
  source,
  /migrationRequiredRecords/,
  'selection is sourced from migration-required records.'
);

requireText(
  source,
  /sort\(function\s*\(a,\s*b\)/,
  'deterministic sorting is implemented.'
);

requireText(
  source,
  /proposedDurableKey/,
  'durable-key ordering is represented.'
);

requireText(
  source,
  /setValues\(sourceRecordValues\)/,
  'Source Record Key physical write exists.'
);

requireText(
  source,
  /setValues\(sourceObservationValues\)/,
  'Source Observation Key physical write exists.'
);

if (count(source, /\.setValues\(/g) !== 4) {
  fail(
    'expected exactly four setValues call sites: two forward-write call sites and two rollback call sites.'
  );
}
pass(
  'exactly two forward physical writes and two rollback write call sites.'
);

if (/\.insert\s*\(/.test(source) ||
    /\.upsert\s*\(/.test(source) ||
    /\.update\s*\(/.test(source) ||
    /\.deleteRow\s*\(/.test(source) ||
    /appendRow\s*\(/.test(source)) {
  fail('forbidden row mutation API detected.');
}
pass('no insert/upsert/update/delete/append mutation API detected.');

if (/reosCountyProductionSchedulerRun/.test(source)) {
  fail('county scheduler handler authority detected.');
}
pass('county scheduler mutation authority is absent.');

if (/setCheckpoint\s*\(/.test(source) ||
    /saveCheckpoint\s*\(/.test(source) ||
    /updateCheckpoint\s*\(/.test(source)) {
  fail('checkpoint mutation API detected.');
}
pass('checkpoint mutation authority is absent.');

requireText(
  source,
  /SpreadsheetApp\.flush\(\)/,
  'flush boundary is present.'
);

requireText(
  source,
  /withScriptLockContext/,
  'fail-fast outer Database lock boundary is present.'
);

requireText(
  source,
  /capturePrestate_/,
  'physical prestate capture is implemented.'
);

requireText(
  source,
  /restoreIdentityColumns_/,
  'rollback restoration is implemented.'
);

requireText(
  source,
  /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/,
  'ambiguous/no-retry result is implemented.'
);

requireText(
  source,
  /retryPermitted:\s*false/,
  'automatic retry is explicitly prohibited.'
);

requireText(
  source,
  /verifyPostPlan_/,
  'post-mutation independent plan verification is implemented.'
);

requireText(
  source,
  /planBlockedRows/,
  'blocked population preservation is verified.'
);

requireText(
  source,
  /collapseRequiredRows/,
  'collapse population preservation is verified.'
);

requireText(
  source,
  /reviewRequiredRows/,
  'review population preservation is verified.'
);

requireText(
  source,
  /checkpointCycleBefore/,
  'frozen checkpoint evidence is returned.'
);

requireText(
  source,
  /schedulerMutationAuthorityGranted:\s*false/,
  'scheduler mutation authority is explicitly false.'
);

requireText(
  source,
  /checkpointMutationAuthorityGranted:\s*false/,
  'checkpoint mutation authority is explicitly false.'
);

requireText(
  source,
  /automaticOfferAuthorityGranted:\s*false/,
  'offer authority is explicitly false.'
);

if (!(
  /one contiguous N x 1 write to Source Record Key/i.test(contract) &&
  /one contiguous N x 1 write to Source Observation Key/i.test(contract)
)) {
  console.error(
    'STOP: certified contract does not contain both required contiguous N x 1 writes.'
  );
  process.exit(1);
}
pass(
  'certified contract still requires exactly two contiguous N x 1 identity-column writes.'
);

requireText(
  contract,
  /independent read-only reconciliation/i,
  'certified contract still requires independent reconciliation.'
);

requireText(
  contract,
  /No automatic retry/i,
  'certified contract still prohibits automatic retry.'
);


requireText(
  source,
  /text_\s*\(\s*checkpoint\.id\s*\)\s*===\s*EXPECTED_CYCLE/,
  'checkpoint.id must bind to EXPECTED_CYCLE.'
);

if (
  /checkpoint\.id[\s\S]{0,120}EXPECTED_CURSOR\.split/.test(source)
) {
  console.error(
    'FAIL: checkpoint.id must not bind to cursor prefix.'
  );
  process.exit(1);
}

pass('checkpoint.id is bound to EXPECTED_CYCLE.');
pass('checkpoint.id is not bound to cursor prefix.');

console.log(
  '=== GENERIC ROLLING EXECUTOR STATIC CONTRACT VALIDATION PASSED ==='
);
