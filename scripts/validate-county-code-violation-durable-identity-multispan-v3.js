#!/usr/bin/env node
'use strict';

const fs = require('fs');

const SRC =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js';

const CONTRACT =
  'docs/gate2b-code-violations-durable-identity-multispan-v3.md';

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
  /DEFAULT_BATCH_MAX\s*=\s*100/,
  'default batch maximum remains 100.'
);

requireText(
  source,
  /HARD_BATCH_MAX\s*=\s*250/,
  'hard batch maximum remains 250.'
);

requireText(
  source,
  /PREVIOUS_CERTIFIED_BATCH_MAX\s*=\s*100/,
  'previous certified 100-row boundary remains explicit.'
);

requireText(
  source,
  /MAX_PHYSICAL_SPANS\s*=\s*70/,
  'multi-span ceiling is exactly 70.'
);

requireText(
  source,
  /MAX_FORWARD_WRITE_RANGES\s*=\s*140/,
  'forward write-range ceiling is exactly 140.'
);

[
  'confirmRollingMigration',
  'confirmDurableIdentity',
  'confirmInPlace',
  'confirmNoInsertDelete',
  'confirmMigrationReadyOnly',
  'confirmLargeWindowMigration',
  'confirmMultiSpanMigration',
  'migrationPlanSha256',
  'completePlanSha256'
].forEach(name => {
  requireText(
    source,
    new RegExp(name),
    name + ' authority is represented.'
  );
});

requireText(
  source,
  /migrationRequiredRecords/,
  'selection is sourced only from migration-required records.'
);

requireText(
  source,
  /proposedDurableKey/,
  'durable-key deterministic ordering is represented.'
);

requireText(
  source,
  /return Number\(a\.rowNumber\) - Number\(b\.rowNumber\)/,
  'numeric rowNumber tie-breaker is represented.'
);

requireText(
  source,
  /function buildPhysicalSpans_/,
  'explicit multi-span geometry builder exists.'
);

requireText(
  source,
  /spans\.length <= MAX_PHYSICAL_SPANS/,
  'physical-span ceiling is enforced before mutation.'
);

requireText(
  source,
  /spans\.length \* 2 <= MAX_FORWARD_WRITE_RANGES/,
  'write-range ceiling is enforced before mutation.'
);

requireText(
  source,
  /function assertSameSelection_/,
  'under-lock deterministic selection equivalence is enforced.'
);

requireText(
  source,
  /function assertSameSpanGeometry_/,
  'under-lock span geometry equivalence is enforced.'
);

requireText(
  source,
  /function verifyPhysicalPrestate_/,
  'physical prestate fingerprint verification exists.'
);

requireText(
  source,
  /function capturePrestate_/,
  'all-span rollback prestate capture exists.'
);

requireText(
  source,
  /function writeIdentitySpans_/,
  'multi-span forward writer exists.'
);

requireText(
  source,
  /function restoreIdentitySpans_/,
  'multi-span rollback writer exists.'
);

requireText(
  source,
  /SpreadsheetApp\.flush\(\)/,
  'flush boundaries are represented.'
);

requireText(
  source,
  /withScriptLockContext/,
  'fail-fast outer Database ScriptLock boundary exists.'
);

requireText(
  source,
  /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/,
  'ambiguous/no-retry authority is preserved.'
);

requireText(
  source,
  /retryPermitted:\s*false/,
  'automatic retry is explicitly prohibited.'
);

requireText(
  source,
  /physicalSpanCount/,
  'physical span count is returned.'
);

requireText(
  source,
  /physicalWriteRangeCount/,
  'physical write-range count is returned.'
);

requireText(
  source,
  /physicalSpans/,
  'physical span geometry is returned.'
);

requireText(
  source,
  /schedulerMutationAuthorityGranted:\s*false/,
  'scheduler mutation authority remains false.'
);

requireText(
  source,
  /checkpointMutationAuthorityGranted:\s*false/,
  'checkpoint mutation authority remains false.'
);

requireText(
  source,
  /automaticOfferAuthorityGranted:\s*false/,
  'offer authority remains false.'
);

if (count(source, /\.setValues\(/g) !== 4) {
  fail(
    'expected exactly four setValues call sites: ' +
    'two looped forward call sites and two looped rollback call sites.'
  );
}
pass(
  'exactly two looped forward and two looped rollback setValues call sites.'
);

if (
  /\.insert\s*\(/.test(source) ||
  /\.upsert\s*\(/.test(source) ||
  /\.update\s*\(/.test(source) ||
  /\.deleteRow\s*\(/.test(source) ||
  /appendRow\s*\(/.test(source)
) {
  fail('forbidden row mutation API detected.');
}
pass('no insert/upsert/update/delete/append mutation API detected.');

if (/reosCountyProductionSchedulerRun/.test(source)) {
  fail('county scheduler handler mutation authority detected.');
}
pass('county scheduler mutation authority is absent.');

if (
  /setCheckpoint\s*\(/.test(source) ||
  /saveCheckpoint\s*\(/.test(source) ||
  /updateCheckpoint\s*\(/.test(source)
) {
  fail('checkpoint mutation API detected.');
}
pass('checkpoint mutation authority is absent.');

if (/assertContiguousSelection_/.test(source)) {
  fail('v2 single-span assertion leaked into v3 executor.');
}
pass('v3 executor does not retain the v2 single-span gate.');

requireText(
  source,
  /reosCountyCodeViolationDurableIdentityMultiSpanMigrationPreview/,
  'separate v3 preview RPC exists.'
);

requireText(
  source,
  /reosCountyCodeViolationDurableIdentityMultiSpanMigrationExecute/,
  'separate v3 execute RPC exists.'
);

if (
  /function reosCountyCodeViolationDurableIdentityRollingMigrationExecute/.test(
    source
  )
) {
  fail('v3 file must not redefine the certified v2 execute RPC.');
}
pass('certified v2 execute RPC is not redefined.');

[
  /MAX_PHYSICAL_SPANS = 70/,
  /MAX_FORWARD_WRITE_RANGES = 140/,
  /confirmMultiSpanMigration=true/,
  /HARD_BATCH_MAX remains 250/,
  /independent read-only reconciliation/i,
  /retryPermitted=false/,
  /Window #16 execution remains unauthorized/
].forEach(pattern => {
  requireText(
    contract,
    pattern,
    'v3 contract contains required authority: ' + pattern
  );
});

console.log(
  '=== GATE 2B V3 MULTI-SPAN STATIC CONTRACT VALIDATION PASSED ==='
);
