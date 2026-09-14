'use strict';

const assert = require('assert');
const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');

const BASE =
  '009407adc1e533af4926611af008120bf7e50a90';

const DISCOVERY_SHA =
  '8ea65a95d14d147b671e10db6b69ff97e6754641f6c85e7e9b610a619c2112ff';

const DB_SHA =
  '0cdda4923ada7dcb40d880c65a391e30858e78adbedfd1b010599c80de61f0d4';

const OP_STORE_SHA =
  '00c7ee96dfeee3401444374b3d7a03e905e2928143c92de91cff612e5a782abf';

const PRESERVATION_CONTRACT_SHA =
  'ed0142bf040c52eee5ef0c95113791e36667d1fb9965ced8906b71379f134f12';

const DB =
  'build/apps-script-brand/Database.js';

const OP_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const PRESERVATION_CONTRACT =
  'docs/county-collapse-observation-preservation-contract-v1.md';

const PATCH_CONTRACT =
  'docs/county-database-exact-row-patch-contract-v1.md';

const STORE_CONTRACT =
  'docs/county-collapse-observation-preservation-store-contract-v1.md';

const SELF =
  'scripts/validate-county-collapse-observation-preservation-implementation-contract-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const FUTURE_STORE =
  'build/apps-script-brand/CountyCollapseObservationPreservationStore.js';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function sha(text) {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}

function git(...args) {
  return cp.execFileSync(
    'git',
    args,
    { encoding: 'utf8' }
  ).trim();
}

function requireText(text, marker, label) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
}

function requireWhitespaceNormalizedText(
  text,
  marker,
  label
) {
  const normalizedText =
    String(text)
      .replace(/\s+/g, ' ')
      .trim();

  const normalizedMarker =
    String(marker)
      .replace(/\s+/g, ' ')
      .trim();

  assert.ok(
    normalizedText.includes(normalizedMarker),
    label + ' missing: ' + marker
  );
}

console.log(
  '=== OBSERVATION-PRESERVATION IMPLEMENTATION CONTRACT V1 ==='
);

assert.strictEqual(
  git('merge-base', BASE, 'HEAD'),
  BASE,
  'Certified implementation-design base is no longer an ancestry root.'
);

const db = read(DB);
const opStore = read(OP_STORE);
const preservationContract =
  read(PRESERVATION_CONTRACT);
const patchContract =
  read(PATCH_CONTRACT);
const storeContract =
  read(STORE_CONTRACT);
const workflow =
  read(WORKFLOW);

assert.strictEqual(
  sha(db),
  DB_SHA,
  'Database baseline drifted before patch implementation.'
);

assert.strictEqual(
  sha(opStore),
  OP_STORE_SHA,
  'Operation-intent store drifted before preservation implementation.'
);

assert.strictEqual(
  sha(preservationContract),
  PRESERVATION_CONTRACT_SHA,
  'Observation-preservation design contract drifted.'
);

assert.ok(
  db.includes('withScriptLockContext'),
  'Database outer lock API missing.'
);

assert.ok(
  db.includes('assertScriptLockContext'),
  'Database lock assertion API missing.'
);

assert.ok(
  db.includes('deletePhysicalRowExact'),
  'Certified exact physical-delete primitive missing.'
);

assert.ok(
  !db.includes('patchPhysicalRowCellsExact'),
  'Exact row-patch implementation already exists; design gate must be revisited.'
);

assert.ok(
  !fs.existsSync(FUTURE_STORE),
  'Preservation store implementation already exists.'
);

const rpcSearch = cp.spawnSync(
  'git',
  [
    'grep',
    '-n',
    '-i',
    'reosCountyCodeViolationCollapseObservationPreserv',
    '--',
    'build/apps-script-brand'
  ],
  { encoding: 'utf8' }
);

assert.ok(
  rpcSearch.status === 1 ||
  rpcSearch.stdout.trim() === '',
  'Preservation RPC unexpectedly exists.'
);

[
  'DATABASE_EXACT_ROW_PATCH_CONTRACT_VERSION=1',
  'CERTIFIED_MAIN=' + BASE,
  'IMPLEMENTATION_DISCOVERY_SHA256=' + DISCOVERY_SHA,
  'FUTURE_API=REOS.Database.patchPhysicalRowCellsExact(sheetName, request, options)',
  'PATCH_CARDINALITY=3',
  'MUTATION_PRIMITIVE=THREE_EXACT_1X1_CELL_WRITES',
  'LOCK_MODEL=CALLER_OWNED_DATABASE_SCRIPTLOCK',
  'NESTED_LOCK_AUTHORITY=false',
  'VERIFIED_SUCCESS=PHYSICAL_PATCH_VERIFIED',
  'PRECONDITION_FAILURE=PHYSICAL_PATCH_PRECONDITION_FAILED',
  'UNCERTAIN_OUTCOME=PHYSICAL_PATCH_OUTCOME_UNCERTAIN',
  'IMPLEMENTATION_AUTHORITY=false',
  'RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach((marker) => {
  requireText(
    patchContract,
    marker,
    'Patch contract'
  );
});

requireWhitespaceNormalizedText(
  patchContract,
  'exactly three 1x1 physical cell writes',
  'Patch safety model'
);

[
  'No full-row rewrite is permitted.',
  'deterministic ascending physical',
  'PHYSICAL_PATCH_PRECONDITION_FAILED',
  'PHYSICAL_PATCH_OUTCOME_UNCERTAIN',
  'SpreadsheetApp.flush()',
  'complete physical row values',
  'complete physical row formulas',
  'must not automatically retry',
  'must not claim rollback success'
].forEach((marker) => {
  requireText(
    patchContract,
    marker,
    'Patch safety model'
  );
});

[
  'OBSERVATION_PRESERVATION_STORE_CONTRACT_VERSION=1',
  'CERTIFIED_MAIN=' + BASE,
  'IMPLEMENTATION_DISCOVERY_SHA256=' + DISCOVERY_SHA,
  'CERTIFIED_OPERATION_INTENT_STORE_SHA256=' + OP_STORE_SHA,
  'CERTIFIED_OBSERVATION_PRESERVATION_CONTRACT_SHA256=' +
    PRESERVATION_CONTRACT_SHA,
  'FUTURE_MODULE=REOS.CountyCollapseObservationPreservationStore',
  'WORKBOOK_PROPERTY=REOS_COUNTY_COLLAPSE_OBSERVATION_PRESERVATION_WORKBOOK_ID',
  'EVENT_SHEET=COUNTY_COLLAPSE_PRESERVATION_EVENTS',
  'CHUNK_SHEET=COUNTY_COLLAPSE_PRESERVATION_CHUNKS',
  'BACKEND=DEDICATED_APPEND_ONLY_GOOGLE_SHEETS_WORKBOOK',
  'LOCK_MODEL=CALLER_OWNED_DATABASE_SCRIPTLOCK',
  'NESTED_LOCK_AUTHORITY=false',
  'OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22',
  'PRESERVATION_WRITE_FIELDS=Updated At,Last Seen At,Connector Run ID',
  'IMPLEMENTATION_AUTHORITY=false',
  'PRESERVATION_MUTATION_AUTHORITY=false',
  'DURABLE_RECEIPT_PROVISIONING_AUTHORITY=false',
  'RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach((marker) => {
  requireText(
    storeContract,
    marker,
    'Preservation store contract'
  );
});

[
  'PRESERVATION_PREPARED',
  'PATCH_INVOCATION_STARTED',
  'PRESERVATION_RECEIPT_VERIFIED',
  'PRESERVATION_PRECONDITION_FAILED',
  'PRESERVATION_OUTCOME_UNCERTAIN',
  'RECONCILIATION_NOTE',
  'VERIFIED_PRESERVATION_RECEIPT',
  'UNCERTAIN_STORAGE_INVALID',
  'UNCERTAIN_PATCH_BARRIER_OR_TERMINAL',
  'NO_PATCH_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
  'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
  'NOT_FOUND'
].forEach((marker) => {
  requireText(
    storeContract,
    marker,
    'Preservation journal/recovery model'
  );
});

[
  'complete winner preimage values',
  'complete winner preimage formulas',
  'complete latest-observation values',
  'complete latest-observation formulas',
  'complete expected winner postimage values',
  'complete expected winner postimage formulas',
  'durably appended, flushed, reread',
  'the physical patch may have run',
  'No automatic retry is authorized.',
  'No automatic delete may follow.',
  'No automatic patch retry may follow.',
  'No row recreation may follow.'
].forEach((marker) => {
  requireText(
    storeContract,
    marker,
    'Preservation durability model'
  );
});

assert.ok(
  opStore.includes(
    "'COUNTY_COLLAPSE_OPERATION_INTENTS'"
  ),
  'Operation-intent event sheet missing.'
);

assert.ok(
  opStore.includes(
    "'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS'"
  ),
  'Operation-intent chunk sheet missing.'
);

assert.ok(
  !opStore.includes(
    'COUNTY_COLLAPSE_PRESERVATION_EVENTS'
  ),
  'Existing operation-intent store was expanded with preservation events.'
);

assert.ok(
  !opStore.includes(
    'COUNTY_COLLAPSE_PRESERVATION_CHUNKS'
  ),
  'Existing operation-intent store was expanded with preservation chunks.'
);

[
  'node --check ' + SELF,
  'name: Validate collapse observation-preservation implementation contracts',
  'run: node ' + SELF
].forEach((marker) => {
  const count =
    workflow.split(marker).length - 1;

  assert.strictEqual(
    count,
    1,
    'County-collapse workflow CI registration count for ' +
      marker +
      ' must be exactly one.'
  );
});

const trackedChanges =
  git('diff', '--name-only')
    .split('\n')
    .filter(Boolean)
    .sort();

const allowedCiRemediationTrackedChanges = [
  SELF,
  WORKFLOW
].sort();

const cleanTrackedLifecycle =
  trackedChanges.length === 0;

const ciRemediationAuthoringLifecycle =
  JSON.stringify(trackedChanges) ===
  JSON.stringify(
    allowedCiRemediationTrackedChanges
  );

assert.ok(
  cleanTrackedLifecycle ||
  ciRemediationAuthoringLifecycle,
  'Unexpected tracked design/CI scope: ' +
    trackedChanges.join(',')
);

const stagedChanges =
  git('diff', '--cached', '--name-only')
    .split('\n')
    .filter(Boolean);

assert.strictEqual(
  stagedChanges.length,
  0,
  'Design gate permits no staged changes.'
);

const untracked =
  git(
    'ls-files',
    '--others',
    '--exclude-standard'
  )
    .split('\n')
    .filter(Boolean)
    .sort();

const expectedUntracked = [
  PATCH_CONTRACT,
  STORE_CONTRACT,
  SELF
].sort();

const cleanCommittedLifecycle =
  untracked.length === 0;

const authoringLifecycle =
  JSON.stringify(untracked) ===
  JSON.stringify(expectedUntracked);

assert.ok(
  cleanCommittedLifecycle ||
  authoringLifecycle,
  'Unexpected untracked design-gate scope: ' +
    untracked.join(',')
);

console.log(
  'PASS: certified implementation-design baseline remains exact ancestry root.'
);
console.log(
  'PASS: Database still exposes caller-owned lock context and exact-delete precedent.'
);
console.log(
  'PASS: no exact row-patch implementation exists yet.'
);
console.log(
  'PASS: existing operation-intent journal remains isolated and unchanged.'
);
console.log(
  'PASS: exact patch contract requires three point writes and conservative uncertain outcomes.'
);
console.log(
  'PASS: preservation store contract requires durable preimage before patch barrier.'
);
console.log(
  'PASS: verified preservation receipt requires durable flush/readback/reconstruction.'
);
console.log(
  'PASS: recovery is read-only and forbids automatic retry/delete/recreation.'
);
console.log(
  'PASS: preservation implementation and RPC remain absent.'
);
console.log(
  'PASS: county-collapse CI registers and executes this implementation-contract validator.'
);

console.log(
  'patch_contract_sha256=' +
    sha(patchContract)
);

console.log(
  'store_contract_sha256=' +
    sha(storeContract)
);

console.log(
  'validator_sha256=' +
    sha(read(SELF))
);

console.log(
  'OBSERVATION_PRESERVATION_IMPLEMENTATION_CONTRACT_DESIGN_VALIDATION_PASSED=true'
);
