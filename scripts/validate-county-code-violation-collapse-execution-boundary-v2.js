#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  '82cac550317faafce2a76fabb954497b069dcc2e';

const DOC =
  'docs/county-code-violation-collapse-execution-boundary-v2.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-execution-boundary-v2.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const HISTORICAL_EXECUTOR_DOC =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const HISTORICAL_EXECUTOR_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-contract-v1.js';

const HISTORICAL_MAINTENANCE_DOC =
  'docs/county-code-violation-collapse-maintenance-quiescence-contract-v1.md';

const HISTORICAL_MAINTENANCE_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-maintenance-quiescence-contract-v1.js';

const WINNER =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const WINNER_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-winner-plan-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const OP_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const PRESERVATION_STORE =
  'build/apps-script-brand/CountyCollapseObservationPreservationStore.js';

const DB =
  'build/apps-script-brand/Database.js';

const FUTURE_MAINTENANCE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const FUTURE_EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const HISTORICAL_AUTHORITY =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const HISTORICAL_FINGERPRINT =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const CURRENT_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const CURRENT_FINGERPRINT =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

function git(args) {
  const result =
    cp.spawnSync(
      'git',
      args,
      {
        encoding:
          'utf8'
      }
    );

  if (result.error) {
    throw result.error;
  }

  return result;
}

function read(path) {
  return fs.readFileSync(
    path,
    'utf8'
  );
}

function requireText(
  text,
  marker,
  label
) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
}

console.log(
  '=== POST-RESTORATION COLLAPSE EXECUTION BOUNDARY V2 ==='
);

assert.strictEqual(
  git([
    'merge-base',
    BASE,
    'HEAD'
  ]).stdout.trim(),
  BASE,
  'V2 execution-boundary base is no longer an ancestry root.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  HISTORICAL_EXECUTOR_DOC,
  HISTORICAL_EXECUTOR_VALIDATOR,
  HISTORICAL_MAINTENANCE_DOC,
  HISTORICAL_MAINTENANCE_VALIDATOR,
  WINNER,
  WINNER_VALIDATOR,
  PREFLIGHT,
  LEASE,
  OP_STORE,
  PRESERVATION_STORE,
  DB
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required artifact missing: ' + path
  );
});

const doc =
  read(DOC);

const executorDoc =
  read(HISTORICAL_EXECUTOR_DOC);

const winner =
  read(WINNER);

const winnerValidator =
  read(WINNER_VALIDATOR);

const preflight =
  read(PREFLIGHT);

const lease =
  read(LEASE);

const opStore =
  read(OP_STORE);

const preservationStore =
  read(PRESERVATION_STORE);

const db =
  read(DB);

const workflow =
  read(WORKFLOW);

[
  'CODE_VIOLATION_COLLAPSE_EXECUTION_BOUNDARY_V2',
  BASE,
  HISTORICAL_AUTHORITY,
  HISTORICAL_FINGERPRINT,
  CURRENT_AUTHORITY,
  CURRENT_FINGERPRINT,
  '21 duplicate groups',
  '44 duplicate rows',
  '20 eligible groups',
  '42 eligible rows',
  '14 direct-keep groups',
  '6 observation-merge groups',
  '22 delete candidates',
  'Group 1 is the sole blocked group',
  '`2,4,5,6,7,8,9,10,11,12,13,14,15,16`',
  '`17,18,19,20,21,22`',
  'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED',
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'COLLAPSE_EXECUTION_BOUNDARY_V2_DESIGN_ONLY=true',
  'COLLAPSE_MAINTENANCE_IMPLEMENTATION_PRESENT=false',
  'COLLAPSE_EXECUTOR_IMPLEMENTATION_PRESENT=false',
  'LEASE_COMPATIBILITY_PREFLIGHT_BLOCKER_REMOVED=false',
  'COLLAPSE_EXECUTOR_PREFLIGHT_BLOCKER_REMOVED=false',
  'COLLAPSE_EXECUTION_READY=false',
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'V2 execution-boundary contract'
  );
});

[
  'implement and certify the current-authority collapse maintenance gate',
  'deploy/revalidate lease compatibility without granting collapse authority',
  'design/implement the direct-keep executor path',
  'separately implement observation-preservation orchestration'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'V2 implementation sequence'
  );
});

requireText(
  executorDoc,
  HISTORICAL_AUTHORITY,
  'Historical executor authority'
);

requireText(
  executorDoc,
  HISTORICAL_FINGERPRINT,
  'Historical executor fingerprint'
);

requireText(
  executorDoc,
  'BLOCKED_GROUPS=1,3',
  'Historical executor blocked-group evidence'
);

[
  CURRENT_AUTHORITY,
  'EXPECTED_GROUP_COUNT = 21',
  'EXPECTED_ROW_COUNT = 44',
  'EXPECTED_ELIGIBLE_GROUPS = 20',
  'EXPECTED_ELIGIBLE_ROWS = 42',
  'EXPECTED_DIRECT_KEEP_GROUPS = 14',
  'EXPECTED_OBSERVATION_MERGE_GROUPS = 6',
  'EXPECTED_DELETE_CANDIDATES = 22',
  'CONFLICT_BLOCKED_GROUP = 1'
].forEach(marker => {
  requireText(
    winner,
    marker,
    'Current winner-plan authority'
  );
});

requireText(
  winnerValidator,
  'Groups 17-22',
  'Current observation-merge partition'
);

[
  CURRENT_FINGERPRINT,
  CURRENT_AUTHORITY,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED',
  'collapseExecutionReady:',
  'false',
  'executionAuthorityGranted:'
].forEach(marker => {
  requireText(
    preflight,
    marker,
    'Current execution preflight'
  );
});

[
  HISTORICAL_AUTHORITY,
  HISTORICAL_FINGERPRINT,
  CURRENT_AUTHORITY,
  CURRENT_FINGERPRINT,
  'HISTORICAL',
  'CURRENT',
  'UNKNOWN',
  'Only CURRENT authority lease may satisfy owner readiness.'
].forEach(marker => {
  requireText(
    lease,
    marker,
    'Current lease compatibility runtime'
  );
});

[
  'COUNTY_COLLAPSE_OPERATION_INTENTS',
  'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS'
].forEach(marker => {
  requireText(
    opStore,
    marker,
    'Operation-intent store'
  );
});

[
  'COUNTY_COLLAPSE_PRESERVATION_EVENTS',
  'COUNTY_COLLAPSE_PRESERVATION_CHUNKS',
  'PRESERVATION_RECEIPT_VERIFIED',
  'VERIFIED_PRESERVATION_RECEIPT'
].forEach(marker => {
  requireText(
    preservationStore,
    marker,
    'Observation-preservation store'
  );
});

[
  'function deletePhysicalRowExact(',
  'function patchPhysicalRowCellsExact(',
  'function withScriptLockContext(',
  'function assertScriptLockContext('
].forEach(marker => {
  requireText(
    db,
    marker,
    'Certified Database prerequisite'
  );
});

[
  HISTORICAL_EXECUTOR_DOC,
  HISTORICAL_EXECUTOR_VALIDATOR,
  HISTORICAL_MAINTENANCE_DOC,
  HISTORICAL_MAINTENANCE_VALIDATOR,
  PREFLIGHT
].forEach(path => {
  const result =
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]);

  assert.strictEqual(
    result.status,
    0,
    'Historical/safety artifact changed during v2 design: ' +
      path
  );
});

assert.ok(
  !fs.existsSync(
    FUTURE_MAINTENANCE
  ),
  'Collapse maintenance implementation unexpectedly exists.'
);

assert.ok(
  !fs.existsSync(
    FUTURE_EXECUTOR
  ),
  'Collapse executor implementation unexpectedly exists.'
);

const executorRpc =
  git([
    'grep',
    '-n',
    'function reosCountyCodeViolationCollapseExecute',
    '--',
    'build/apps-script-brand'
  ]);

assert.ok(
  executorRpc.status === 1 ||
  executorRpc.stdout.trim() === '',
  'Collapse executor RPC unexpectedly exists.'
);

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'V2 boundary validator must appear exactly twice in CI.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'V2 boundary syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'V2 boundary execution registration'
);

const changed =
  new Set();

git([
  'diff',
  '--name-only'
]).stdout
  .split('\n')
  .filter(Boolean)
  .forEach(path => changed.add(path));

git([
  'ls-files',
  '--others',
  '--exclude-standard'
]).stdout
  .split('\n')
  .filter(Boolean)
  .forEach(path => changed.add(path));

const actual =
  Array.from(changed)
    .sort();

const expectedAuthoring =
  [
    DOC,
    SELF,
    WORKFLOW
  ].sort();

assert.ok(
  actual.length === 0 ||
  JSON.stringify(actual) ===
    JSON.stringify(
      expectedAuthoring
    ),
  'Unexpected v2 design scope: ' +
    actual.join(',')
);

const staged =
  git([
    'diff',
    '--cached',
    '--name-only'
  ]).stdout
    .split('\n')
    .filter(Boolean);

assert.strictEqual(
  staged.length,
  0,
  'V2 design gate permits no staged changes.'
);

console.log(
  'PASS: historical executor and maintenance v1 evidence remains immutable.'
);

console.log(
  'PASS: current 21/44 post-restoration authority is exact.'
);

console.log(
  'PASS: Group 1 is sole current blocked group; historical Group 3 is excluded.'
);

console.log(
  'PASS: direct-keep and observation-merge execution paths are separated.'
);

console.log(
  'PASS: operation-intent and preservation stores are prerequisites, not authority.'
);

console.log(
  'PASS: maintenance gate and collapse executor implementations remain absent.'
);

console.log(
  'PASS: both current preflight blockers remain intact.'
);

console.log(
  'PASS: next implementation prerequisite is current-authority maintenance gate.'
);

console.log(
  'COLLAPSE_EXECUTION_BOUNDARY_V2_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'COLLAPSE_EXECUTION_READY=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
