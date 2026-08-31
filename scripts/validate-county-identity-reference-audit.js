#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

console.log(
  '=== COUNTY IDENTITY REFERENCE AUDIT CONTRACT ==='
);

const auditPath =
  'build/apps-script-brand/CountyIdentityReferenceAudit.js';

assert.ok(
  fs.existsSync(auditPath),
  'CountyIdentityReferenceAudit.js must exist'
);

const source =
  fs.readFileSync(auditPath, 'utf8');

/*
 * Structural read-only containment.
 */
const forbiddenPatterns = [
  [/\.ensureTable\s*\(/, 'Database.ensureTable'],
  [/\.insert\s*\(/, 'Database.insert'],
  [/\.update\s*\(/, 'Database.update'],
  [/\.upsert\s*\(/, 'Database.upsert'],
  [/\.softDelete\s*\(/, 'Database.softDelete'],
  [/\.appendRow\s*\(/, 'appendRow'],
  [/\.setValue\s*\(/, 'setValue'],
  [/\.setValues\s*\(/, 'setValues'],
  [/\.insertSheet\s*\(/, 'insertSheet'],
  [/\.deleteSheet\s*\(/, 'deleteSheet'],
  [/\.deleteRow\s*\(/, 'deleteRow'],
  [/\.deleteRows\s*\(/, 'deleteRows'],
  [/\.clear\s*\(/, 'clear'],
  [/\.clearContent\s*\(/, 'clearContent'],
  [/\.clearContents\s*\(/, 'clearContents'],
  [/\.setFormula\s*\(/, 'setFormula'],
  [/\.setFormulas\s*\(/, 'setFormulas'],
  [/\.setProperty\s*\(/, 'Script Properties setProperty'],
  [/\.deleteProperty\s*\(/, 'Script Properties deleteProperty'],
  [/ScriptApp\s*\.\s*newTrigger/, 'trigger creation'],
  [/ScriptApp\s*\.\s*deleteTrigger/, 'trigger deletion'],
  [/UrlFetchApp/, 'network access'],
  [
    /CountyRuntimeBridge\s*\.\s*(run|sync|dryRun)/,
    'county runtime execution'
  ]
];

for (const [pattern, label] of forbiddenPatterns) {
  assert.equal(
    pattern.test(source),
    false,
    'Reference audit must not contain mutation/execution surface: ' +
      label
  );
}

assert.match(
  source,
  /SpreadsheetApp\.getActiveSpreadsheet\s*\(/,
  'Audit must open existing active spreadsheet'
);

assert.match(
  source,
  /\.getSheets\s*\(/,
  'Audit must enumerate existing sheets'
);

assert.match(
  source,
  /\.getValues\s*\(/,
  'Audit must read existing cell values'
);

assert.match(
  source,
  /REOS\.Security\.requireAdmin\s*\(/,
  'Audit must require admin authority'
);

assert.match(
  source,
  /function\s+reosCountyIdentityReferenceAudit\s*\(/,
  'Controlled Apps Script entry point is required'
);

[
  'READ_ONLY',
  'downstream_reference_audit',
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'repairPlanAuthorityGranted',
  'requestedIds',
  'scannedSheets',
  'matches',
  'unmatchedIds',
  'truncated'
].forEach(function (field) {
  assert.ok(
    source.includes(field),
    'Audit result must expose contract field: ' + field
  );
});

console.log(
  'PASS: reference audit is structurally read-only'
);

/*
 * Behavioral certification.
 */
let adminCalls = 0;
let getSheetsCalls = 0;
let getValuesCalls = 0;

function fakeSheet(name, values) {
  return {
    getName() {
      return name;
    },

    getLastRow() {
      return values.length;
    },

    getLastColumn() {
      return values.length
        ? Math.max(...values.map(row => row.length))
        : 0;
    },

    getRange(row, column, rowCount, columnCount) {
      assert.equal(row, 1);
      assert.equal(column, 1);
      assert.equal(rowCount, values.length);

      getValuesCalls++;

      return {
        getValues() {
          return values.map(function (sourceRow) {
            const result = [];

            for (let i = 0; i < columnCount; i++) {
              result.push(
                sourceRow[i] === undefined
                  ? ''
                  : sourceRow[i]
              );
            }

            return result;
          });
        }
      };
    }
  };
}

const distress = fakeSheet(
  'DISTRESS_LEADS',
  [
    ['Distress Lead ID', 'Address'],
    ['DL-SURVIVOR', '1019 Magee Ave'],
    ['DL-SURPLUS-A', '1019 Magee Ave']
  ]
);

const deals = fakeSheet(
  'DEALS',
  [
    ['Deal ID', 'Distress Lead ID'],
    ['D-1', 'DL-SURPLUS-A'],
    ['D-2', 'DL-OTHER']
  ]
);

const history = fakeSheet(
  'ACQUISITION_HISTORY',
  [
    ['History ID', 'Related Lead'],
    ['H-1', 'DL-SURPLUS-B'],
    ['H-2', 'not-a-match']
  ]
);

const empty = fakeSheet(
  'EMPTY_TABLE',
  []
);

const context = {
  console,

  SpreadsheetApp: {
    getActiveSpreadsheet() {
      return {
        getSheets() {
          getSheetsCalls++;
          return [
            distress,
            deals,
            history,
            empty
          ];
        }
      };
    }
  },

  REOS: {
    Security: {
      requireAdmin() {
        adminCalls++;
      }
    }
  }
};

vm.createContext(context);

vm.runInContext(
  source,
  context,
  {
    filename:
      'CountyIdentityReferenceAudit.js'
  }
);

assert.equal(
  typeof context.reosCountyIdentityReferenceAudit,
  'function'
);

const result =
  context.reosCountyIdentityReferenceAudit({
    distressLeadIds: [
      'DL-SURPLUS-A',
      'DL-SURPLUS-B',
      'DL-NO-REFERENCE',
      'DL-SURPLUS-A'
    ],
    maxMatches: 25
  });

assert.equal(
  adminCalls,
  1,
  'audit must require admin exactly once'
);

assert.equal(
  getSheetsCalls,
  1,
  'audit must enumerate sheets exactly once'
);

assert.equal(
  getValuesCalls,
  2,
  'audit must read only non-empty non-authoritative sheets'
);

assert.equal(result.ok, true);
assert.equal(result.mode, 'READ_ONLY');
assert.equal(
  result.phase,
  'downstream_reference_audit'
);

assert.equal(
  result.repairAuthorityGranted,
  false
);

assert.equal(
  result.migrationAuthorityGranted,
  false
);

assert.equal(
  result.repairPlanAuthorityGranted,
  false
);

assert.deepEqual(
  Array.from(result.requestedIds),
  [
    'DL-SURPLUS-A',
    'DL-SURPLUS-B',
    'DL-NO-REFERENCE'
  ],
  'requested IDs must be normalized and deduplicated'
);

assert.equal(
  result.scannedSheetCount,
  3,
  'DISTRESS_LEADS must be excluded from downstream scan'
);

assert.equal(result.matchCount, 2);
assert.equal(result.matchedIdCount, 2);

assert.deepEqual(
  Array.from(result.unmatchedIds),
  ['DL-NO-REFERENCE']
);

const matches =
  Array.from(result.matches).map(function (match) {
    return {
      distressLeadId: match.distressLeadId,
      sheet: match.sheet,
      rowNumber: match.rowNumber,
      columnNumber: match.columnNumber
    };
  });

assert.deepEqual(
  matches,
  [
    {
      distressLeadId: 'DL-SURPLUS-A',
      sheet: 'DEALS',
      rowNumber: 2,
      columnNumber: 2
    },
    {
      distressLeadId: 'DL-SURPLUS-B',
      sheet: 'ACQUISITION_HISTORY',
      rowNumber: 2,
      columnNumber: 2
    }
  ]
);

assert.equal(result.truncated, false);

assert.equal(result.scanComplete, true);
assert.equal(result.matchesTruncated, false);
assert.equal(result.matchCount, result.matches.length);
assert.equal(
  result.retainedMatchCount,
  result.matches.length
);

console.log(
  'PASS: complete-scan result semantics are explicit'
);

const overflowResult =
  context.reosCountyIdentityReferenceAudit({
    distressLeadIds: [
      'DL-SURPLUS-A',
      'DL-SURPLUS-B',
      'DL-NO-REFERENCE'
    ],
    maxMatches: 1
  });

assert.equal(
  overflowResult.scanComplete,
  true,
  'match-detail truncation must not truncate workbook scan'
);

assert.equal(
  overflowResult.matchesTruncated,
  true,
  'overflow must explicitly report truncated match details'
);

assert.equal(
  overflowResult.truncated,
  true,
  'legacy truncated field must reflect match-detail truncation'
);

assert.equal(
  overflowResult.matchCount,
  2,
  'total match count must include matches on later sheets'
);

assert.equal(
  overflowResult.retainedMatchCount,
  1,
  'retained match evidence must honor maxMatches'
);

assert.equal(
  overflowResult.matches.length,
  1,
  'returned match details must remain bounded'
);

assert.equal(
  overflowResult.matchedIdCount,
  2,
  'later-sheet IDs must remain classified as matched'
);

assert.deepEqual(
  Array.from(overflowResult.unmatchedIds),
  ['DL-NO-REFERENCE'],
  'later-sheet matches must never be falsely reported unmatched'
);

assert.deepEqual(
  Array.from(overflowResult.matches).map(function (match) {
    return {
      distressLeadId: match.distressLeadId,
      sheet: match.sheet,
      rowNumber: match.rowNumber,
      columnNumber: match.columnNumber
    };
  }),
  [
    {
      distressLeadId: 'DL-SURPLUS-A',
      sheet: 'DEALS',
      rowNumber: 2,
      columnNumber: 2
    }
  ],
  'retained evidence must be deterministic'
);

console.log(
  'PASS: maxMatches bounds evidence without truncating later-sheet discovery'
);


assert.throws(
  () => context.reosCountyIdentityReferenceAudit({
    distressLeadIds: []
  }),
  /At least one Distress Lead ID is required/
);

console.log(
  'PASS: authoritative DISTRESS_LEADS is excluded from downstream matching'
);

console.log(
  'PASS: exact downstream Distress Lead ID references are reported'
);

console.log(
  'PASS: unmatched IDs remain explicit'
);

console.log(
  'PASS: reference audit grants no repair or migration authority'
);

console.log(
  'County identity reference audit contract validation PASSED.'
);
