#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  'b83fb0529d17dcc35c131838ed8d55c31b3274f9';

const BASE_TREE =
  '9c8536696555b9d979ba81027e35ff3b085b5ba7';

const EXPECTED_DOC_SHA =
  'e4914071daac58b2f3abd4d262a68931025282dccd52e4aea7cdd51f717e8dbf';

const DOC =
  'docs/county-collapse-group2-prepared-operation-retirement-authorization-v1.md';

const SELF =
  'scripts/validate-county-collapse-group2-prepared-operation-retirement-authorization-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const RECON =
  'build/apps-script-brand/CountyCollapseGroup2StrandedOperationReconciliation.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const MAINT_OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const FUTURE_MODULE =
  'build/apps-script-brand/CountyCollapseGroup2PreparedOperationRetirement.js';

const FUTURE_VALIDATOR =
  'scripts/validate-county-collapse-group2-prepared-operation-retirement-v1.js';

const EXPECTED_SCOPE = [
  DOC,
  SELF,
  WORKFLOW
].sort();

const PROTECTED = [
  STORE,
  EXECUTOR,
  RESIDUAL,
  RECON,
  PREFLIGHT,
  MAINT_GATE,
  MAINT_OPERATOR,
  DATABASE,
  INTEGRATION
];

function git(args) {
  return cp.spawnSync(
    'git',
    args,
    {
      encoding:
        'utf8'
    }
  );
}

function gitText(args) {
  const result =
    git(args);

  assert.equal(
    result.status,
    0,
    'git ' +
      args.join(' ') +
      ' failed\n' +
      String(result.stderr || '')
  );

  return String(
    result.stdout || ''
  ).trim();
}

function gitRaw(args) {
  const result =
    git(args);

  assert.equal(
    result.status,
    0,
    'git ' +
      args.join(' ') +
      ' failed\n' +
      String(result.stderr || '')
  );

  return String(
    result.stdout || ''
  );
}

function lines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(path)
    )
    .digest('hex');
}

function requireText(
  text,
  marker,
  label
) {
  assert.ok(
    text.includes(marker),
    label +
      ' missing: ' +
      marker
  );
}

console.log(
  '=== GROUP 2 PREPARED-OPERATION RETIREMENT AUTHORIZATION V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Authorization branch must descend from exact certified main.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Certified source tree changed.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  ...PROTECTED
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required file missing: ' +
      path
  );
});

assert.equal(
  fs.existsSync(FUTURE_MODULE),
  false,
  'Future retirement module must remain absent.'
);

assert.equal(
  fs.existsSync(FUTURE_VALIDATOR),
  false,
  'Future retirement runtime validator must remain absent.'
);

assert.equal(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Authorization document changed.'
);

PROTECTED.forEach(path => {
  assert.equal(
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]).status,
    0,
    'Protected source changed: ' +
      path
  );
});

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const store =
  fs.readFileSync(
    STORE,
    'utf8'
  );

const executor =
  fs.readFileSync(
    EXECUTOR,
    'utf8'
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

[
  'Status: DESIGN-ONLY INCIDENT RETIREMENT IMPLEMENTATION AUTHORIZATION HANDOFF.',
  'GROUP2_PREPARED_OPERATION_RETIREMENT_AUTHORIZATION_VERSION=1',
  'SOURCE_MAIN_SHA=' + BASE,
  'SOURCE_MAIN_TREE=' + BASE_TREE,
  'SOURCE_POST_MERGE_CI_RUN=35558214884',
  'SOURCE_POST_MERGE_CI_JOB=106205907386',
  'PRODUCTION_VERSION=116',
  'INCIDENT_OPERATION_ID=6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8',
  'INCIDENT_GROUP_NUMBER=2',
  'INCIDENT_WINNER=DL-20260820181645-7130',
  'INCIDENT_TARGET=DL-20260820181652-6183',
  'PREPARED_EVENT_SHA256=843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153',
  'PREPARED_PAYLOAD_SHA256=9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c',
  'LIVE_V2_RAW_SHA256=99d049d2364a470c44827ac8aeaa1228e17b521fa5044565a3a71ee1aeccbd8b',
  'LIVE_V2_JSON_SHA256=330c2ee6392a4d396213da868765f3c0321982ea17763f4c585a8ee2c61ddeb6',
  'LIVE_V2_RPC_INVOCATION_COUNT=1',
  'SECOND_V2_RPC_AUTHORITY=false',
  'CERTIFIED_PREBARRIER_OPERATION=true',
  'WINNER_CURRENT_ROW_NUMBER=766',
  'TARGET_CURRENT_ROW_NUMBER=770',
  'FUTURE_RETIREMENT_IMPLEMENTATION_SCOPE_FILE_COUNT=4',
  'OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false',
  'EXECUTOR_MODIFICATION_AUTHORITY=false',
  'RESIDUAL_EVIDENCE_MODIFICATION_AUTHORITY=false',
  'SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false',
  'DATABASE_MODIFICATION_AUTHORITY=false',
  'RETIREMENT_IMPLEMENTATION_AUTHORITY=false',
  'RETIREMENT_RPC_EXECUTION_AUTHORITY=false',
  'EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_AUTHORITY=false',
  'EXECUTOR_RETRY_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'SCHEDULER_RESTORATION_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'AUTOMATIC_MAO_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Authorization contract'
  );
});

[
  FUTURE_MODULE,
  FUTURE_VALIDATOR,
  WORKFLOW,
  INTEGRATION
].forEach(path => {
  requireText(
    doc,
    path,
    'Future retirement scope'
  );
});

/*
 * Existing store already supports exactly the terminal needed for this
 * pre-barrier incident.
 */
requireText(
  store,
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED: true',
  'Store event type'
);

requireText(
  store,
  'Precondition-failed terminal is forbidden after delete barrier.',
  'Store pre-barrier terminal rule'
);

requireText(
  store,
  "'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'",
  'Store post-terminal recovery classification'
);

requireText(
  store,
  "'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'",
  'Store prepared-only recovery classification'
);

requireText(
  store,
  'assertLockContext_(',
  'Store caller-owned lock requirement'
);

/*
 * Confirm why terminalization cannot by itself permit a successor attempt.
 */
requireText(
  executor,
  'assertNoTargetBoundOperationHistory_(',
  'Executor target-history guard'
);

requireText(
  executor,
  'Existing durable operation history already binds requested delete candidate.',
  'Executor target-history fail-closed rule'
);

const historyGuardStart =
  executor.indexOf(
    'function assertNoTargetBoundOperationHistory_('
  );

assert.ok(
  historyGuardStart >= 0,
  'Target-history guard missing.'
);

const historyGuardEnd =
  executor.indexOf(
    'function captureSheetEvidence_(',
    historyGuardStart
  );

assert.ok(
  historyGuardEnd >
    historyGuardStart
);

const historyGuard =
  executor.slice(
    historyGuardStart,
    historyGuardEnd
  );

assert.ok(
  historyGuard.includes(
    '.events[0]'
  ),
  'Target-history guard no longer binds first durable manifest.'
);

assert.ok(
  historyGuard.includes(
    'targetDeleteDistressLeadId'
  )
);

assert.equal(
  historyGuard.includes(
    'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
  ),
  false,
  'Executor already contains terminal-history exception unexpectedly.'
);

/*
 * Workflow transition is limited to adding this design validator.
 */
const baseWorkflow =
  gitRaw([
    'show',
    BASE + ':' + WORKFLOW
  ]);

const syntaxAnchor =
  '          node --check scripts/validate-county-collapse-group2-stranded-operation-reconciliation-v2.js\n';

const syntaxReplacement =
  syntaxAnchor +
  '          node --check ' +
  SELF +
  '\n';

assert.equal(
  baseWorkflow.split(
    syntaxAnchor
  ).length - 1,
  1,
  'V2 syntax anchor changed.'
);

const stepAnchor =
  '      - name: Validate Group 2 stranded operation read-only reconciliation v2\n' +
  '        run: node scripts/validate-county-collapse-group2-stranded-operation-reconciliation-v2.js\n\n';

const stepReplacement =
  stepAnchor +
  '      - name: Validate Group 2 prepared-operation retirement authorization v1\n' +
  '        run: node ' +
  SELF +
  '\n\n';

assert.equal(
  baseWorkflow.split(
    stepAnchor
  ).length - 1,
  1,
  'V2 active-validation anchor changed.'
);

let expectedWorkflow =
  baseWorkflow.replace(
    syntaxAnchor,
    syntaxReplacement
  );

expectedWorkflow =
  expectedWorkflow.replace(
    stepAnchor,
    stepReplacement
  );

assert.equal(
  workflow,
  expectedWorkflow,
  'Workflow changed outside exact design-validator registration.'
);

/*
 * Exact design-only candidate scope.
 */
const effective =
  new Set();

[
  gitText([
    'diff',
    '--name-only',
    BASE,
    'HEAD'
  ]),
  gitText([
    'diff',
    '--name-only'
  ]),
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  gitText([
    'ls-files',
    '--others',
    '--exclude-standard'
  ])
].forEach(value => {
  lines(value)
    .forEach(path => {
      effective.add(path);
    });
});

assert.deepEqual(
  Array.from(
    effective
  ).sort(),
  EXPECTED_SCOPE,
  'Authorization increment must remain exactly three files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Authorization candidate must remain unstaged.'
);

[
  doc,
  fs.readFileSync(
    SELF,
    'utf8'
  )
].forEach((text, textIndex) => {
  text
    .split('\n')
    .forEach((line, lineIndex) => {
      assert.equal(
        /[ \t]+$/.test(line),
        false,
        'Trailing whitespace in artifact ' +
          String(textIndex) +
          ' line ' +
          String(lineIndex + 1)
      );
    });
});

console.log(
  'PASS: certified v116 / live-V2 incident authority is pinned.'
);

console.log(
  'PASS: existing store supports pre-barrier precondition-failed terminalization.'
);

console.log(
  'PASS: operation-intent store remains protected and unchanged.'
);

console.log(
  'PASS: executor target-bound history guard remains fail-closed and unchanged.'
);

console.log(
  'PASS: terminalization and executor-history exception are explicitly separated into two phases.'
);

console.log(
  'PASS: future retirement implementation is bounded to four explicitly named files.'
);

console.log(
  'PASS: design-only increment scope is exactly three files.'
);

console.log(
  'authorization_doc_sha256=' +
    sha256File(DOC)
);

console.log(
  'authorization_validator_sha256=' +
    sha256File(SELF)
);

console.log(
  'GROUP2_PREPARED_OPERATION_RETIREMENT_AUTHORIZATION_VALIDATION_PASSED=true'
);

console.log(
  'FUTURE_RETIREMENT_IMPLEMENTATION_HANDOFF_DEFINED=true'
);

console.log(
  'RETIREMENT_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_RETRY_AUTHORIZED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
