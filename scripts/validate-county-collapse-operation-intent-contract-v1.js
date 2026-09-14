#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const cp = require('child_process');

const BASE =
  '107eea2c31c2ca1fb5bc1b37fb72affe591090ff';

const CONTRACT_COMMIT =
  '98e059459f24f0253d5413722ff6332559acc400';

const DOC =
  'docs/county-collapse-operation-intent-contract-v1.md';

const SELF =
  'scripts/validate-county-collapse-operation-intent-contract-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const IMPLEMENTATION =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const EXECUTOR_IMPLEMENTATION =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const EXPECTED_DOC_SHA =
  'c0a3b52382213f8d3e12807bd03a2729be5d8b47fa2233f6ac9826f86677615f';

function git(args) {
  return cp.execFileSync(
    'git',
    args,
    {
      encoding: 'utf8'
    }
  ).trim();
}

function gitStatus(args) {
  return cp.spawnSync(
    'git',
    args,
    {
      encoding: 'utf8'
    }
  );
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

console.log(
  '=== COUNTY COLLAPSE OPERATION-INTENT CONTRACT V1 ==='
);

assert.strictEqual(
  git(['merge-base', BASE, 'HEAD']),
  BASE,
  'Certified operation-intent base is no longer an ancestry root.'
);

const contractAncestor =
  gitStatus([
    'merge-base',
    '--is-ancestor',
    CONTRACT_COMMIT,
    'HEAD'
  ]);

assert.strictEqual(
  contractAncestor.status,
  0,
  'Certified operation-intent contract commit is not an ancestor of HEAD.'
);

const staged =
  git([
    'diff',
    '--cached',
    '--name-only'
  ]);

assert.strictEqual(
  staged,
  '',
  'Operation-intent validator expects no staged changes.'
);

const untracked =
  git([
    'ls-files',
    '--others',
    '--exclude-standard'
  ]);

assert.strictEqual(
  untracked,
  '',
  'Operation-intent validator expects no untracked files.'
);

assert.ok(
  fs.existsSync(DOC),
  'Operation-intent contract document must exist.'
);

assert.ok(
  fs.existsSync(SELF),
  'Operation-intent contract validator must exist.'
);

assert.ok(
  fs.existsSync(WORKFLOW),
  'County-collapse CI workflow must exist.'
);

assert.ok(
  !fs.existsSync(IMPLEMENTATION),
  'Operation-intent storage implementation must not exist.'
);

assert.ok(
  !fs.existsSync(EXECUTOR_IMPLEMENTATION),
  'Collapse executor implementation must not exist.'
);

const doc =
  fs.readFileSync(DOC, 'utf8');

const self =
  fs.readFileSync(SELF, 'utf8');

const workflow =
  fs.readFileSync(WORKFLOW, 'utf8');

assert.strictEqual(
  sha256(doc),
  EXPECTED_DOC_SHA,
  'Certified operation-intent contract document hash changed.'
);

[
  'OPERATION_INTENT_CONTRACT_VERSION=1',
  'OPERATION_INTENT_BASE_SHA=' + BASE,
  'STORAGE_BACKEND=APPEND_ONLY_GOOGLE_SHEETS_JOURNAL',
  'STORAGE_WORKBOOK=DEDICATED_SEPARATE_WORKBOOK',
  'EVENT_SHEET=COUNTY_COLLAPSE_OPERATION_INTENTS',
  'CHUNK_SHEET=COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS',
  'MAX_EVENT_PAYLOAD_UTF8_BYTES=1048576',
  'MAX_CHUNK_UTF8_BYTES=16384',
  'MAX_CHUNKS_PER_EVENT=64',
  'MAX_EVENTS_PER_OPERATION=32',
  'IMMUTABLE_OPERATION_ID=true',
  'APPEND_ONLY_STORAGE=true',
  'PREPARED_READBACK_REQUIRED=true',
  'DELETE_BARRIER_EVENT=DELETE_INVOCATION_STARTED',
  'RECOVERY_MODE=READ_ONLY',
  'AUTOMATIC_RETRY=false',
  'RUNTIME_PURGE_AUTHORITY=false',
  'EXECUTOR_IMPLEMENTATION_AUTHORITY=false',
  'RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PRODUCTION_PHYSICAL_DELETE_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(token => {
  assert.ok(
    doc.includes(token),
    'Required operation-intent marker missing: ' + token
  );
});

[
  'INTENT_PREPARED',
  'DELETE_INVOCATION_STARTED',
  'POSTDELETE_VERIFIED',
  'COLLAPSE_DELETE_VERIFIED',
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
  'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN',
  'RECONCILIATION_NOTE'
].forEach(token => {
  assert.ok(
    doc.includes(token),
    'Required operation-intent event missing: ' + token
  );
});

[
  'winner-plan fingerprint',
  'collapse authority SHA-256',
  'winner Distress Lead ID',
  'target delete Distress Lead ID',
  'current county-data spreadsheet ID',
  'current county-data sheet ID',
  'complete current headers',
  'complete canonical winner values',
  'complete winner formulas',
  'complete canonical delete-candidate values',
  'complete delete-candidate formulas',
  'complete residual certified-group membership before mutation',
  'complete current downstream-reference audit evidence',
  'scheduler frozen snapshot',
  'checkpoint frozen snapshot',
  'certified preservation receipt when required',
  'exact primitive request derived from fresh under-lock evidence'
].forEach(token => {
  assert.ok(
    doc.includes(token),
    'Required prepared-intent evidence missing: ' + token
  );
});

[
  'read-only reconciliation',
  'No automatic retry is permitted.',
  'No automatic row recreation is permitted.',
  'The runtime has no purge authority.',
  'No nested ScriptLock is introduced by the storage module.',
  'The storage layer does not release the caller-owned lock.',
  'Any storage exception after the delete barrier is uncertain.',
  'Storage failure never authorizes a retry of the physical-delete primitive.'
].forEach(token => {
  assert.ok(
    doc.includes(token),
    'Required fail-closed safety rule missing: ' + token
  );
});

const ciPath =
  'scripts/validate-county-collapse-operation-intent-contract-v1.js';

const ciOccurrences =
  workflow.split(ciPath).length - 1;

assert.strictEqual(
  ciOccurrences,
  2,
  'County-collapse CI must reference operation-intent validator exactly twice.'
);

assert.ok(
  workflow.includes(
    'node --check ' + ciPath
  ),
  'County-collapse CI must syntax-check operation-intent validator.'
);

assert.ok(
  workflow.includes(
    'run: node ' + ciPath
  ),
  'County-collapse CI must execute operation-intent validator.'
);

const trackedRpc =
  gitStatus([
    'grep',
    '-n',
    'reosCountyCodeViolationCollapseExecute',
    '--',
    'build/apps-script-brand'
  ]);

assert.ok(
  trackedRpc.status === 1 ||
  !String(trackedRpc.stdout || '').trim(),
  'Collapse executor RPC unexpectedly exists.'
);

doc.split('\n').forEach((line, index) => {
  assert.ok(
    !/[ \t]+$/.test(line),
    'Trailing whitespace in contract line ' + (index + 1)
  );
});

self.split('\n').forEach((line, index) => {
  assert.ok(
    !/[ \t]+$/.test(line),
    'Trailing whitespace in validator line ' + (index + 1)
  );
});

console.log(
  'PASS: certified merged-main baseline remains ancestry root.'
);
console.log(
  'PASS: certified operation-intent contract commit remains an ancestor.'
);
console.log(
  'PASS: validator permits unrelated future descendant work.'
);
console.log(
  'PASS: append-only dedicated-workbook backend remains certified.'
);
console.log(
  'PASS: immutable operation identity and hash-chained event model remain certified.'
);
console.log(
  'PASS: complete prepared preimages and primitive request remain mandatory.'
);
console.log(
  'PASS: durable readback remains required before delete authority.'
);
console.log(
  'PASS: DELETE_INVOCATION_STARTED remains the conservative delete barrier.'
);
console.log(
  'PASS: recovery remains read-only with no automatic uncertain-state resume.'
);
console.log(
  'PASS: indefinite retention and no runtime purge authority remain certified.'
);
console.log(
  'PASS: county-collapse CI registers and executes operation-intent validation.'
);
console.log(
  'PASS: no storage implementation, executor implementation, or executor RPC exists.'
);
console.log(
  'contract_sha256=' + sha256(doc)
);
console.log(
  'validator_sha256=' + sha256(self)
);
console.log(
  'OPERATION_INTENT_CONTRACT_VALIDATION_PASSED=true'
);
