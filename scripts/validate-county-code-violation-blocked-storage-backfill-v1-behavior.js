#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');

const SRC =
  'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js';

const source = fs.readFileSync(SRC, 'utf8');

function fail(message) {
  console.error('STOP: ' + message);
  process.exit(1);
}

function pass(message) {
  console.log('PASS: ' + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function bytes(hex) {
  return Array.from(Buffer.from(hex, 'hex'));
}

const WINDOW1_CANDIDATE_SHA =
  'abda6858ff296f2ddce454c2c02e3b05862c8452576a6e2b1a0e127cdb1e8fee';
const WINDOW1_SPAN_SHA =
  '20685d9cc162624d099494f030e465a688d223c9c5985bff589f828a3a3cef23';

function firstWindowRows() {
  const rows = [];
  let next = 100;

  for (let group = 0; group < 60; group += 1) {
    const size = group < 10 ? 5 : 4;

    for (let i = 0; i < size; i += 1) {
      rows.push(next + i);
    }

    next += size + 1;
  }

  assert(rows.length === 250, 'synthetic first window must contain 250 rows.');
  return rows;
}

const selectedRows = firstWindowRows();
const blocked = [];

for (let index = 0; index < 814; index += 1) {
  const n = index + 1;
  const suffix = String(n).padStart(4, '0');
  const rowNumber = index < 250
    ? selectedRows[index]
    : 5000 + index;
  const legacy =
    'pa-philadelphia|code_violations|' + String(700000 + n);

  blocked.push({
    rowNumber,
    distressLeadId: 'TEST-' + suffix,
    sourceRecordId: String(700000 + n),
    violationNumber: 'VI-TEST-' + suffix,
    parcelId: 'P-' + suffix,
    canonicalPropertyKey: 'property|parcel|pa|philadelphia|' + suffix,
    storedCanonicalPropertyKey: '',
    sourceObservationKey: '',
    sourceRecordKey: legacy,
    legacyObservationKey: legacy,
    proposedDurableKey:
      'pa-philadelphia|code_violations|vi-test-' + suffix,
    alreadyDurable: false,
    planBlockReasons: [
      'stored_canonical_identity_missing',
      'stored_observation_key_incomplete'
    ],
    prestateFingerprintSha256: 'fingerprint-' + suffix
  });
}

const plan = {
  connectorId: 'PA-PHILADELPHIA',
  dataset: 'code_violations',
  countySchedulerTriggerCount: 0,
  alreadyDurableRows: 4026,
  collapseRequiredRows: 141,
  reviewRequiredRows: 95,
  migrationRequiredRows: 0,
  planBlockedRows: 814,
  planBlockedRecords: blocked,
  migrationRequiredRecords: [],
  alreadyDurableRecords: [],
  migrationPlanSha256:
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  completePlanSha256:
    'synthetic-complete-plan'
};

const headers = Array(51).fill('');
headers[24] = 'Source Record Key';
headers[30] = 'Canonical Property Key';
headers[50] = 'Source Observation Key';

let hashCalls = 0;
let mutationCalls = 0;

const context = {
  console,
  REOS: {
    Database: {
      getHeaders() {
        return headers.slice();
      },
      withScriptLockContext() {
        mutationCalls += 1;
        throw new Error('behavior harness must never enter mutation lock.');
      },
      getSheet() {
        mutationCalls += 1;
        throw new Error('behavior harness must never request mutation sheet.');
      }
    },
    CountyCodeViolationDurableIdentityMigrationPlan: {
      build() {
        return JSON.parse(JSON.stringify(plan));
      }
    }
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    computeDigest(_algorithm, value) {
      hashCalls += 1;
      const text = String(value);

      if (text.startsWith('[{"count":')) {
        return bytes(WINDOW1_SPAN_SHA);
      }

      return bytes(WINDOW1_CANDIDATE_SHA);
    }
  },
  ScriptApp: {
    getProjectTriggers() {
      return [];
    }
  },
  SpreadsheetApp: {
    flush() {
      mutationCalls += 1;
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context, {
  filename: SRC
});

assert(
  typeof context.reosCountyCodeViolationBlockedStorageBackfillStatus === 'function',
  'status RPC must load.'
);
assert(
  typeof context.reosCountyCodeViolationBlockedStorageBackfillPreview === 'function',
  'preview RPC must load.'
);
assert(
  typeof context.reosCountyCodeViolationBlockedStorageBackfillExecute === 'function',
  'execute RPC must load.'
);
pass('all three backfill RPCs load.');

const status =
  context.reosCountyCodeViolationBlockedStorageBackfillStatus();

assert(status.currentWindowNumber === 1, 'status must identify window 1.');
assert(status.backfillComplete === false, 'status must not claim completion.');
assert(status.planBlockedRows === 814, 'status blocked count must be 814.');
assert(status.migrationRequiredRows === 0, 'status migration count must be 0.');
assert(status.mutationAuthorityGranted === false, 'status mutation authority must be false.');
assert(status.schedulerMutationAuthorityGranted === false, 'status scheduler authority must be false.');
pass('window-1 read-only status is fail-closed.');

const preview =
  context.reosCountyCodeViolationBlockedStorageBackfillPreview({
    windowNumber: 1
  });

assert(preview.windowNumber === 1, 'preview window number must be 1.');
assert(preview.candidateCount === 250, 'preview candidate count must be 250.');
assert(preview.physicalSpanCount === 60, 'preview span count must be 60.');
assert(preview.physicalWriteRangeCount === 120, 'preview range count must be 120.');
assert(preview.planBlockedRowsBefore === 814, 'preview blocked before must be 814.');
assert(preview.planBlockedRowsAfter === 564, 'preview blocked after must be 564.');
assert(preview.migrationRequiredRowsBefore === 0, 'preview migration before must be 0.');
assert(preview.migrationRequiredRowsAfter === 250, 'preview migration after must be 250.');
assert(preview.candidateAuthoritySha256 === WINDOW1_CANDIDATE_SHA, 'preview candidate SHA must bind window authority.');
assert(preview.spanGeometrySha256 === WINDOW1_SPAN_SHA, 'preview span SHA must bind window authority.');
assert(preview.sourceRecordKeyColumn === 25, 'source record column must remain 25.');
assert(preview.sourceObservationKeyColumn === 51, 'source observation column must remain 51.');
assert(preview.canonicalPropertyKeyColumn === 31, 'canonical column must resolve from headers.');
assert(preview.mutationAuthorityGranted === false, 'preview mutation authority must be false.');
assert(preview.collapseAuthorityGranted === false, 'preview collapse authority must be false.');
assert(preview.winnerSelectionAuthorityGranted === false, 'preview winner authority must be false.');
pass('window-1 preview binds exact candidate and physical geometry authority.');

let wrongWindowFailed = false;
try {
  context.reosCountyCodeViolationBlockedStorageBackfillPreview({
    windowNumber: 2
  });
} catch (error) {
  wrongWindowFailed = /not the current certified window/.test(String(error.message || error));
}
assert(wrongWindowFailed, 'preview must fail closed for a non-current window.');
pass('non-current window preview fails closed.');

let executeFailed = false;
try {
  context.reosCountyCodeViolationBlockedStorageBackfillExecute({
    windowNumber: 1
  });
} catch (error) {
  executeFailed = /All six blocked-storage backfill confirmations are required/.test(
    String(error.message || error)
  );
}
assert(executeFailed, 'execute must reject missing explicit confirmations.');
assert(mutationCalls === 0, 'failed authority check must perform zero mutation calls.');
assert(hashCalls >= 4, 'preview and execute preflight must certify candidate/span hashes.');
pass('execute authority gate fails before any mutation boundary.');

console.log(
  '=== GATE 2B BLOCKED STORAGE BACKFILL V1 BEHAVIOR VALIDATION PASSED ==='
);
