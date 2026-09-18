'use strict';

const assert = require('assert');
const fs = require('fs');

const FILE =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentExecutionRequestBuilder.js';

const text = fs.readFileSync(FILE, 'utf8');

function requireText(needle, message) {
  assert.ok(text.includes(needle), message);
}

[
  "'DISTRESS_LEADS'",
  "'Distress Lead ID'",
  "'Canonical Property Key'",
  "'Owner Name'",
  "'Owner Mailing Address'",
  "'Updated At'",
  'SpreadsheetApp.getActiveSpreadsheet()',
  'getSheetByName(TARGET_TABLE)',
  '.getSheetId()',
  '.getLastRow()',
  '.getLastColumn()',
  '.getMaxRows()',
  '.getMaxColumns()',
  '.getValues()',
  '.getFormulas()',
  'PHASE1F_ROW_EVIDENCE_MISMATCH',
  'DUAL_IDENTITY_ROW_MISMATCH',
  'TARGET_FORMULA_NOT_BLANK:',
  'expectedRowValues:',
  'expectedRowFormulas:',
  'persistenceExecutionAuthorized: false',
  'databaseUpdateAuthorized: false',
  'databaseInsertAuthorized: false',
  'databaseUpsertAuthorized: false',
  'dealCreationAuthorized: false',
  'maoGenerationAuthorized: false',
  'automaticOfferAuthorityGranted: false',
  'schedulerAuthority: false',
  'productionMutationAuthority: false'
].forEach(function (needle) {
  requireText(
    needle,
    'Missing required builder contract: ' + needle
  );
});

[
  ['setValue', /\.setValue\s*\(/],
  ['setValues', /\.setValues\s*\(/],
  ['appendRow', /\.appendRow\s*\(/],
  ['insertRow', /\.insertRow/],
  ['deleteRow', /\.deleteRow\s*\(/],
  ['clearContent', /\.clearContent\s*\(/],
  ['flush', /SpreadsheetApp\.flush\s*\(/],
  [
    'Database.update',
    /REOS\.Database\.update\s*\(/
  ],
  [
    'Database.insert',
    /REOS\.Database\.insert\s*\(/
  ],
  [
    'Database.upsert',
    /REOS\.Database\.upsert\s*\(/
  ],
  [
    'Database.patchPhysicalRowCellsExact',
    /REOS\.Database\.patchPhysicalRowCellsExact\s*\(/
  ],
  [
    'Database.withScriptLockContext',
    /REOS\.Database\.withScriptLockContext\s*\(/
  ],
  [
    'private Database spreadsheet accessor',
    /getSpreadsheet_\s*\(/
  ]
].forEach(function (entry) {
  assert.ok(
    !entry[1].test(text),
    'Builder must not contain mutation/lock/private API: ' +
      entry[0]
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
].forEach(function (field) {
  const truePattern =
    new RegExp(field + '\\s*:\\s*true');

  assert.ok(
    !truePattern.test(text),
    'Builder must never grant authority: ' + field
  );
});

console.log(
  'PASS: Phase 1H builder static contract is fail-closed.'
);
console.log(
  'PASS: builder contains no mutation, lock, or private Database API.'
);
console.log(
  'PASS: automatic offer authority remains false.'
);
