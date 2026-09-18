'use strict';

const assert = require('assert');
const fs = require('fs');

const FILE =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentExecutor.js';

const text = fs.readFileSync(FILE, 'utf8');

function requireText(needle) {
  assert.ok(
    text.includes(needle),
    'Missing required executor contract: ' + needle
  );
}

[
  "'DISTRESS_LEADS'",
  "'Distress Lead ID'",
  "'Canonical Property Key'",
  "'Owner Name'",
  "'Owner Mailing Address'",
  "'Updated At'",
  'REOS.Database.withScriptLockContext',
  'REOS.Database.assertScriptLockContext',
  'SpreadsheetApp.getActiveSpreadsheet()',
  'SpreadsheetApp.flush()',
  '.setValue(',
  'ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_EXECUTION_VERIFIED',
  'expectedSpreadsheetId',
  'expectedSheetId',
  'expectedRowNumber',
  'phase1fRowNumberEvidence',
  'expectedHeaders',
  'expectedRowValues',
  'expectedRowFormulas',
  'semanticPatch'
].forEach(requireText);

[
  /REOS\.Database\.update\s*\(/,
  /REOS\.Database\.insert\s*\(/,
  /REOS\.Database\.upsert\s*\(/,
  /REOS\.Database\.patchPhysicalRowCellsExact\s*\(/,
  /REOS\.Database\.replacePhysicalRowExact\s*\(/,
  /\.setValues\s*\(/,
  /\.appendRow\s*\(/,
  /\.deleteRow\s*\(/,
  /getSpreadsheet_\s*\(/
].forEach(pattern => {
  assert.ok(
    !pattern.test(text),
    'Unauthorized mutation/access surface: ' + pattern
  );
});

[
  'persistenceExecutionAuthorized',
  'databaseUpdateAuthorized',
  'databaseInsertAuthorized',
  'databaseUpsertAuthorized',
  'dealCreationAuthorized',
  'maoGenerationAuthorized',
  'automaticOfferAuthorityGranted',
  'schedulerAuthority',
  'productionMutationAuthority'
].forEach(field => {
  assert.ok(
    !new RegExp(
      '\\b' + field + '\\s*:\\s*true\\b'
    ).test(text),
    'Authority escalation detected: ' + field
  );
});

const finalBoundary =
  text.indexOf('Final definite no-write boundary.');

const firstWrite =
  text.indexOf('.setValue(');

const flush =
  text.indexOf('SpreadsheetApp.flush()');

assert.ok(finalBoundary >= 0);
assert.ok(firstWrite > finalBoundary);
assert.ok(flush > firstWrite);

console.log(
  'PASS: Phase 1J executor static contract is fail-closed.'
);
console.log(
  'PASS: executor owns bounded target-cell mutation only.'
);
console.log(
  'PASS: final lock assertion precedes first physical write.'
);
console.log(
  'PASS: explicit in-callback flush follows physical writes.'
);
console.log(
  'PASS: generic Database and county mutation primitives are absent.'
);
console.log(
  'PASS: automatic offer authority remains false.'
);

/*
 * Phase 1J deterministic physical-write hardening.
 */
[
  'var physicalWrites = [];',
  'physicalWrites.push({',
  'physicalWrites.sort(function (left, right)',
  'return left.column - right.column;',
  'physicalWrites.forEach(function (write)',
  'writeStarted = true;',
  'write.column',
  '.setValue(write.value)',
  'physicalWrites.map(function (write)'
].forEach(requireText);

assert.ok(
  !text.includes('.setValue(certified.patch[field])'),
  'Semantic patch insertion order must not directly drive writes.'
);

const hardPlan =
  text.indexOf('var physicalWrites = [];');

const hardSort =
  text.indexOf(
    'physicalWrites.sort(function (left, right)'
  );

const hardLoop =
  text.indexOf(
    'physicalWrites.forEach(function (write)'
  );

const hardBoundary =
  text.indexOf(
    'writeStarted = true;',
    hardLoop
  );

const hardWrite =
  text.indexOf(
    '.setValue(write.value)',
    hardLoop
  );

const hardFlush =
  text.indexOf(
    'SpreadsheetApp.flush()',
    hardWrite
  );

assert.ok(hardPlan >= 0);
assert.ok(hardSort > hardPlan);
assert.ok(hardLoop > hardSort);
assert.ok(hardBoundary > hardLoop);
assert.ok(hardWrite > hardBoundary);
assert.ok(hardFlush > hardWrite);

console.log(
  'PASS: deterministic physical-column write plan is required.'
);
console.log(
  'PASS: uncertain boundary remains immediately before setValue.'
);
