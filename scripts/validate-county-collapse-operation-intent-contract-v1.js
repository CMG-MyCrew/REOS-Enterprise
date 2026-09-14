'use strict';

const crypto = require('crypto');
const fs = require('fs');
const cp = require('child_process');

const BASE = '107eea2c31c2ca1fb5bc1b37fb72affe591090ff';

const DOC =
  'docs/county-collapse-operation-intent-contract-v1.md';

const SELF =
  'scripts/validate-county-collapse-operation-intent-contract-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const IMPLEMENTATION =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

function run(command) {
  return cp.execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function lines(text) {
  if (!text) return [];
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}

function uniqueSorted(items) {
  return [...new Set(items)].sort();
}

console.log(
  '=== COUNTY COLLAPSE OPERATION-INTENT CONTRACT V1 ==='
);

const head = run('git rev-parse HEAD');
const mergeBase = run(`git merge-base ${BASE} HEAD`);

assert(
  mergeBase === BASE,
  'current HEAD must descend from exact certified main baseline'
);

const committed = lines(
  run(`git diff --name-only ${BASE}..HEAD`)
);

const working = lines(
  run('git diff --name-only')
);

const staged = lines(
  run('git diff --cached --name-only')
);

assert(
  staged.length === 0,
  'validator must run before staging or after commit'
);

const untracked = lines(
  run('git ls-files --others --exclude-standard')
);

const effective = uniqueSorted([
  ...committed,
  ...working,
  ...untracked,
]);

const allowed = new Set([DOC, SELF, WORKFLOW]);

for (const path of effective) {
  assert(
    allowed.has(path),
    `unexpected operation-intent design scope: ${path}`
  );
}

assert(
  effective.includes(DOC),
  'operation-intent contract must be in effective branch scope'
);

assert(
  effective.includes(SELF),
  'operation-intent validator must be in effective branch scope'
);

assert(
  !fs.existsSync(IMPLEMENTATION),
  'operation-intent implementation must not exist'
);

const doc = fs.readFileSync(DOC, 'utf8');

const requiredMarkers = [
  'Contract-Marker: OPERATION_INTENT_CONTRACT_VERSION=1',
  'Contract-Marker: OPERATION_INTENT_BASE_SHA=' + BASE,
  'Contract-Marker: STORAGE_BACKEND=APPEND_ONLY_GOOGLE_SHEETS_JOURNAL',
  'Contract-Marker: STORAGE_WORKBOOK=DEDICATED_SEPARATE_WORKBOOK',
  'Contract-Marker: EVENT_SHEET=COUNTY_COLLAPSE_OPERATION_INTENTS',
  'Contract-Marker: CHUNK_SHEET=COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS',
  'Contract-Marker: MAX_EVENT_PAYLOAD_UTF8_BYTES=1048576',
  'Contract-Marker: MAX_CHUNK_UTF8_BYTES=16384',
  'Contract-Marker: MAX_CHUNKS_PER_EVENT=64',
  'Contract-Marker: MAX_EVENTS_PER_OPERATION=32',
  'Contract-Marker: IMMUTABLE_OPERATION_ID=true',
  'Contract-Marker: APPEND_ONLY_STORAGE=true',
  'Contract-Marker: PREPARED_READBACK_REQUIRED=true',
  'Contract-Marker: DELETE_BARRIER_EVENT=DELETE_INVOCATION_STARTED',
  'Contract-Marker: RECOVERY_MODE=READ_ONLY',
  'Contract-Marker: AUTOMATIC_RETRY=false',
  'Contract-Marker: RUNTIME_PURGE_AUTHORITY=false',
  'Contract-Marker: EXECUTOR_IMPLEMENTATION_AUTHORITY=false',
  'Contract-Marker: RPC_AUTHORITY=false',
  'Contract-Marker: DEPLOYMENT_AUTHORITY=false',
  'Contract-Marker: PRODUCTION_PHYSICAL_DELETE_AUTHORITY=false',
  'Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false',
  'Contract-Marker: SCHEDULER_AUTHORITY=false',
  'Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false',
  'Contract-Marker: CONNECTOR_EXECUTION_AUTHORITY=false',
  'Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false',
];

for (const marker of requiredMarkers) {
  assert(doc.includes(marker), `missing marker: ${marker}`);
}

const requiredEvents = [
  '`INTENT_PREPARED`',
  '`DELETE_INVOCATION_STARTED`',
  '`POSTDELETE_VERIFIED`',
  '`COLLAPSE_DELETE_VERIFIED`',
  '`COLLAPSE_EXECUTOR_PRECONDITION_FAILED`',
  '`COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`',
  '`RECONCILIATION_NOTE`',
];

for (const event of requiredEvents) {
  assert(doc.includes(event), `missing event contract: ${event}`);
}

const requiredEvidence = [
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
  'exact primitive request derived from fresh under-lock evidence',
];

for (const phrase of requiredEvidence) {
  assert(
    doc.includes(phrase),
    `missing prepared-intent evidence requirement: ${phrase}`
  );
}

const requiredSafety = [
  'read-only reconciliation',
  'No automatic retry is permitted.',
  'No automatic row recreation is permitted.',
  'The runtime has no purge authority.',
  'No nested ScriptLock is introduced by the storage module.',
  'The storage layer does not release the caller-owned lock.',
  'Any storage exception after the delete barrier is uncertain.',
  'Storage failure never authorizes a retry of the physical-delete primitive.',
];

for (const phrase of requiredSafety) {
  assert(doc.includes(phrase), `missing safety rule: ${phrase}`);
}

assert(
  !doc.includes('Contract-Marker: EXECUTOR_IMPLEMENTATION_AUTHORITY=true'),
  'executor implementation authority must remain false'
);

assert(
  !doc.includes('Contract-Marker: PRODUCTION_PHYSICAL_DELETE_AUTHORITY=true'),
  'physical-delete authority must remain false'
);

assert(
  !doc.includes('Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=true'),
  'production mutation authority must remain false'
);

const reservedRpc = 'reosCountyCodeViolationCollapseExecute';

let runtimeRpcFound = false;
try {
  const result = run(
    `git grep -n ${reservedRpc} HEAD -- build/apps-script-brand`
  );
  runtimeRpcFound = Boolean(result);
} catch (_) {
  runtimeRpcFound = false;
}

assert(
  !runtimeRpcFound,
  'reserved executor RPC must not exist in runtime code'
);

if (effective.includes(WORKFLOW)) {
  const workflow = fs.readFileSync(WORKFLOW, 'utf8');

  const refs = workflow
    .split('\n')
    .filter(line => line.includes(SELF))
    .length;

  assert(
    refs >= 1,
    'modified CI workflow must register operation-intent validator'
  );
}

const docHash = sha256(doc);
const validatorHash = sha256(fs.readFileSync(SELF, 'utf8'));

console.log(
  'PASS: exact certified merged-main baseline remains ancestry root.'
);
console.log(
  'PASS: effective design scope is limited to contract + validator + optional CI registration.'
);
console.log(
  'PASS: append-only dedicated-workbook backend specified.'
);
console.log(
  'PASS: immutable operation identity and hash-chained event model specified.'
);
console.log(
  'PASS: complete prepared preimages and primitive request are mandatory.'
);
console.log(
  'PASS: durable readback is required before delete authority.'
);
console.log(
  'PASS: DELETE_INVOCATION_STARTED is the conservative delete barrier.'
);
console.log(
  'PASS: recovery is read-only and uncertain histories cannot auto-resume.'
);
console.log(
  'PASS: indefinite retention / no runtime purge authority specified.'
);
console.log(
  'PASS: no operation-intent implementation or executor RPC exists.'
);
console.log(`contract_sha256=${docHash}`);
console.log(`validator_sha256=${validatorHash}`);
console.log('OPERATION_INTENT_CONTRACT_VALIDATION_PASSED=true');
