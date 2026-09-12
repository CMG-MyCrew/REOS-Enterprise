#!/usr/bin/env node
'use strict';

const fs = require('fs');

const SRC =
  'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js';

const CONTRACT =
  'docs/gate2b-code-violations-blocked-storage-backfill-v1.md';

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

[
  /HARD_BATCH_MAX\s*=\s*250/,
  /MAX_PHYSICAL_SPANS\s*=\s*70/,
  /MAX_FORWARD_WRITE_RANGES\s*=\s*140/,
  /BLOCKED_BACKFILL_AUTHORITY_SHA256\s*=\s*\n\s*'6d064158ced3d2eaede191c2b5e8195fd3701713c271cbbc6b257671be1767f0'/,
  /WINDOW_PLAN_SHA256\s*=\s*\n\s*'742ba533413e6447d9e121f326455381d1e689888647e2d86ad0b6e3bbd50684'/
].forEach(pattern => {
  requireText(source, pattern, 'certified backfill boundary is represented: ' + pattern);
});

const windowExpectations = [
  [1, 250, 60, 120, 814, 564, 0, 250, 4026, 4026,
   'abda6858ff296f2ddce454c2c02e3b05862c8452576a6e2b1a0e127cdb1e8fee',
   '20685d9cc162624d099494f030e465a688d223c9c5985bff589f828a3a3cef23'],
  [2, 250, 27, 54, 564, 314, 0, 250, 4276, 4276,
   '63ca3a9db81a3b0ab7596cbc2c95dc95294679ac8af970868fc8ea3bf7f710be',
   '45b0f7f8a8e71762f76f89b2540823d6735552656702baf969b7d56d6b5d251a'],
  [3, 215, 70, 140, 314, 99, 0, 215, 4526, 4526,
   'a89dfc349741a7b42a14955c312166833f1a9f7b700d99cd5a9bcedcf649ad49',
   '8c511f38a1889f3099d7aaad8fca393125db677a2024c80539e03dd11aba515f'],
  [4, 99, 38, 76, 99, 0, 0, 99, 4741, 4741,
   '66d44834e0f01fa1d0f4f84f8c1f0f1212ea1d754f6a8be88f339df5c61d594b',
   'ee24c752004c874e97416876aa1cd0c9898c5e81136c381c512e5ffcee642543']
];

windowExpectations.forEach(([
  windowNumber,
  countExpected,
  spansExpected,
  rangesExpected,
  blockedBefore,
  blockedAfter,
  migrationBefore,
  migrationAfter,
  durableBefore,
  durableAfter,
  candidateSha,
  spanSha
]) => {
  const fragment = new RegExp(
    windowNumber + ':\\s*\\{[\\s\\S]*?' +
    'candidateCount:\\s*' + countExpected + '[\\s\\S]*?' +
    'physicalSpanCount:\\s*' + spansExpected + '[\\s\\S]*?' +
    'physicalWriteRangeCount:\\s*' + rangesExpected + '[\\s\\S]*?' +
    'planBlockedRowsBefore:\\s*' + blockedBefore + '[\\s\\S]*?' +
    'planBlockedRowsAfter:\\s*' + blockedAfter + '[\\s\\S]*?' +
    'migrationRequiredRowsBefore:\\s*' + migrationBefore + '[\\s\\S]*?' +
    'migrationRequiredRowsAfter:\\s*' + migrationAfter + '[\\s\\S]*?' +
    'alreadyDurableRowsBefore:\\s*' + durableBefore + '[\\s\\S]*?' +
    'alreadyDurableRowsAfter:\\s*' + durableAfter + '[\\s\\S]*?' +
    candidateSha + '[\\s\\S]*?' + spanSha
  );

  requireText(
    source,
    fragment,
    'window ' + windowNumber + ' exact certified authority is embedded.'
  );
});

[
  'confirmBlockedStorageBackfill',
  'confirmCanonicalPropertyBackfill',
  'confirmLegacyObservationPreservation',
  'confirmNoDurableObservationWrite',
  'confirmNoSourceRecordKeyWrite',
  'confirmNoInsertDelete',
  'windowPlanSha256',
  'blockedBackfillAuthoritySha256',
  'candidateAuthoritySha256',
  'spanGeometrySha256',
  'migrationPlanSha256',
  'completePlanSha256'
].forEach(name => {
  requireText(source, new RegExp(name), name + ' authority is represented.');
});

[
  /function verifyPhysicalPrestate_/,
  /function capturePrestate_/,
  /function writeBackfillSpans_/,
  /function restoreBackfillSpans_/,
  /function verifyPostPlan_/,
  /function assertSameSelection_/,
  /function assertSameSpanGeometry_/,
  /withScriptLockContext/,
  /SpreadsheetApp\.flush\(\)/,
  /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/,
  /retryPermitted:\s*false/
].forEach(pattern => {
  requireText(source, pattern, 'fail-closed mutation contract is represented: ' + pattern);
});

if (count(source, /\.setValues\(/g) !== 4) {
  fail('expected exactly four setValues call sites: two forward and two rollback.');
}
pass('exactly two forward and two rollback setValues call sites exist.');

const writerStart = source.indexOf('function writeBackfillSpans_');
const writerEnd = source.indexOf('function restoreBackfillSpans_');
if (writerStart === -1 || writerEnd === -1 || writerEnd <= writerStart) {
  fail('unable to isolate forward writer.');
}
const writer = source.slice(writerStart, writerEnd);

if (/columns\.sourceRecordKey[\s\S]*?\.setValues/.test(writer)) {
  fail('forward writer appears to write Source Record Key.');
}
pass('forward writer does not write Source Record Key.');

if (/proposedDurableKey[\s\S]*?\.setValues/.test(writer)) {
  fail('forward writer appears to write proposed durable identity.');
}
pass('forward writer does not write proposed durable identity.');

requireText(
  writer,
  /canonicalPropertyKey/,
  'forward writer restores Canonical Property Key.'
);
requireText(
  writer,
  /legacyObservationKey/,
  'forward writer restores Source Observation Key from legacy authority.'
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

if (
  /setCheckpoint\s*\(/.test(source) ||
  /saveCheckpoint\s*\(/.test(source) ||
  /updateCheckpoint\s*\(/.test(source)
) {
  fail('checkpoint mutation API detected.');
}
pass('checkpoint mutation authority is absent.');

if (/reosCountyProductionSchedulerRun\s*\(/.test(source)) {
  fail('scheduler-run invocation detected.');
}
pass('scheduler execution authority is absent.');

[
  /sourceRecordKeyMutationExecuted:\s*false/,
  /durableObservationKeyMutationExecuted:\s*false/,
  /collapseAuthorityGranted:\s*false/,
  /winnerSelectionAuthorityGranted:\s*false/,
  /automaticOfferAuthorityGranted:\s*false/,
  /schedulerMutationAuthorityGranted:\s*false/,
  /checkpointMutationAuthorityGranted:\s*false/
].forEach(pattern => {
  requireText(source, pattern, 'forbidden authority remains false: ' + pattern);
});

[
  /reosCountyCodeViolationBlockedStorageBackfillStatus/,
  /reosCountyCodeViolationBlockedStorageBackfillPreview/,
  /reosCountyCodeViolationBlockedStorageBackfillExecute/
].forEach(pattern => {
  requireText(source, pattern, 'backfill RPC is represented: ' + pattern);
});

[
  /814-row certified blocked cohort/i,
  /four bounded windows/i,
  /Source Record Key is never written/i,
  /durable Violation Number key is never written/i,
  /independent read-only reconciliation/i,
  /retryPermitted=false/i,
  /scheduler remains frozen/i
].forEach(pattern => {
  requireText(contract, pattern, 'contract contains required safety statement: ' + pattern);
});

console.log(
  '=== GATE 2B BLOCKED STORAGE BACKFILL V1 STATIC VALIDATION PASSED ==='
);
