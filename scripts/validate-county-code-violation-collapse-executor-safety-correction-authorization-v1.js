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
  'dc19ab42fa9faf63b3db327598e32da6844de733';

const BASE_TREE =
  '78db590eeae0c2fc64da4d4be29896e1f4980159';

const DOC =
  'docs/county-code-violation-collapse-executor-safety-correction-authorization-v1.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-authorization-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const BLOCKER_CONTRACT =
  'docs/county-code-violation-collapse-executor-blocker-retirement-contract-v1.md';

const BLOCKER_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-contract-v1.js';

const HIST_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const REFERENCE_AUDIT =
  'build/apps-script-brand/CountyIdentityReferenceAudit.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const EXECUTOR_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-runtime-v1.js';

const EXECUTOR_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const FUTURE_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js';

const FUTURE_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js';

const BLOCKER =
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE';

const EXPECTED_DOC_SHA =
  'b327935fb30765032670e2811ce29780655f05d7f8a49060d726046215bd5919';

const EXPECTED_SCOPE = [
  DOC,
  SELF,
  WORKFLOW
].sort();

const PROTECTED = [
  BLOCKER_CONTRACT,
  BLOCKER_VALIDATOR,
  HIST_PREFLIGHT,
  PREFLIGHT,
  EXECUTOR,
  OPERATOR,
  MAINT_GATE,
  RESIDUAL,
  INTENT_STORE,
  REFERENCE_AUDIT,
  DATABASE,
  EXECUTOR_RUNTIME,
  EXECUTOR_LIFECYCLE,
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
  '=== EXECUTOR SAFETY CORRECTION AUTHORIZATION V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Authorization branch must descend from exact PR #210 merged main.'
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
    'Required artifact missing: ' +
      path
  );
});

assert.equal(
  fs.existsSync(FUTURE_RUNTIME),
  false,
  'Future corrective runtime must remain absent in authorization increment.'
);

assert.equal(
  fs.existsSync(FUTURE_LIFECYCLE),
  false,
  'Future corrective lifecycle must remain absent in authorization increment.'
);

assert.equal(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Corrective authorization document changed.'
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
    'Protected source changed in authorization increment: ' +
      path
  );
});

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

const executor =
  fs.readFileSync(
    EXECUTOR,
    'utf8'
  );

const residual =
  fs.readFileSync(
    RESIDUAL,
    'utf8'
  );

const intentStore =
  fs.readFileSync(
    INTENT_STORE,
    'utf8'
  );

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

[
  'Status: DESIGN-ONLY CORRECTIVE SAFETY IMPLEMENTATION AUTHORIZATION HANDOFF.',
  'EXECUTOR_SAFETY_CORRECTION_AUTHORIZATION_VERSION=1',
  'SOURCE_MAIN_SHA=' + BASE,
  'SOURCE_MAIN_TREE=' + BASE_TREE,
  'SOURCE_POST_MERGE_CI_RUN=35472367580',
  'SOURCE_POST_MERGE_CI_JOB=105975528204',
  'PR_210_POST_MERGE_CERTIFIED=true',
  'READINESS_AUDIT_HARD_GAP_COUNT=3',
  'READINESS_GAP_1=TARGET_BOUND_OPERATION_HISTORY_REUSE',
  'READINESS_GAP_2=FINAL_MAINTENANCE_REASSERTION',
  'READINESS_GAP_3=FINAL_SCHEDULER_CHECKPOINT_REVALIDATION',
  'CORRECTIVE_EXECUTOR_SAFETY_INCREMENT_REQUIRED=true',
  'BLOCKER_RETIREMENT_IMPLEMENTATION_SUSPENDED_PENDING_CORRECTION=true',
  'CURRENT_BLOCKER=' + BLOCKER,
  'BLOCKER_RETIREMENT_CONTRACT_REPLAY_REQUIRED=true',
  'BLOCKER_RETIREMENT_CONTRACT_REPLAY_SOURCE=' + BASE,
  'FUTURE_CORRECTIVE_IMPLEMENTATION_SCOPE_FILE_COUNT=5',
  'HISTORICAL_EXECUTOR_RUNTIME_REPLAY_REQUIRED=true',
  'HISTORICAL_EXECUTOR_RUNTIME_REPLAY_SOURCE=' + BASE,
  'COUNTY_RUNTIME_INTEGRATION_CORRECTIVE_ORCHESTRATION_CHANGE_REQUIRED=true',
  'SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false',
  'OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false',
  'RESIDUAL_EVIDENCE_MODIFICATION_AUTHORITY=false',
  'MAINTENANCE_GATE_MODIFICATION_AUTHORITY=false',
  'MAINTENANCE_OPERATOR_MODIFICATION_AUTHORITY=false',
  'REFERENCE_AUDIT_MODIFICATION_AUTHORITY=false',
  'DATABASE_MODIFICATION_AUTHORITY=false',
  'CORRECTIVE_EXECUTOR_IMPLEMENTATION_AUTHORITY=false',
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false',
  'COLLAPSE_EXECUTION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'EXECUTOR_RPC_EXECUTION_AUTHORITY=false',
  'MAINTENANCE_RPC_EXECUTION_AUTHORITY=false',
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false',
  'SCHEDULER_RESTORATION_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_MAO_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Corrective authorization'
  );
});

[
  EXECUTOR,
  FUTURE_RUNTIME,
  FUTURE_LIFECYCLE,
  WORKFLOW,
  INTEGRATION
].forEach(path => {
  requireText(
    doc,
    path,
    'Future corrective implementation scope'
  );
});

requireText(
  preflight,
  BLOCKER,
  'Successor preflight blocker'
);

/*
 * Reconfirm exact three hard gaps.
 */
assert.ok(
  residual.includes(
    'var boundOperationCount = {};'
  )
);

assert.ok(
  residual.includes(
    'boundOperationCount[targetId]'
  )
);

assert.ok(
  residual.includes(
    'boundOperationCount[id] !=='
  )
);

assert.ok(
  intentStore.includes(
    'newOperationId_()'
  )
);

const prepareMarker =
  'store.prepare(';

const prepareIndex =
  executor.indexOf(
    prepareMarker
  );

assert.ok(
  prepareIndex >= 0,
  'Executor prepare sequence missing.'
);

const beforePrepare =
  executor.slice(
    0,
    prepareIndex
  );

assert.equal(
  beforePrepare.includes(
    'listOperationIds'
  ) ||
  beforePrepare.includes(
    'boundOperationCount'
  ),
  false,
  'Target-bound operation-history gap unexpectedly changed.'
);

const afterPrepare =
  executor.slice(
    prepareIndex +
      prepareMarker.length
  );

const referenceAgainIndex =
  afterPrepare.indexOf(
    'var referencesAgain'
  );

const barrierIndex =
  afterPrepare.indexOf(
    "eventType:\n                    'DELETE_INVOCATION_STARTED'"
  );

assert.ok(
  referenceAgainIndex >= 0
);

assert.ok(
  barrierIndex >
    referenceAgainIndex
);

const finalWindow =
  afterPrepare.slice(
    referenceAgainIndex,
    barrierIndex
  );

assert.equal(
  finalWindow.includes(
    'maintenanceReady_('
  ),
  false,
  'Final maintenance gap unexpectedly changed.'
);

assert.equal(
  finalWindow.includes(
    'requirePreflightReady_();'
  ),
  false,
  'Final scheduler/checkpoint gap unexpectedly changed.'
);

/*
 * Exact workflow transition:
 * - preserve syntax check for completed blocker contract validator;
 * - add syntax check for this authorization validator;
 * - replace direct completed blocker-contract execution with certified
 *   replay at PR #210 main;
 * - activate this authorization validator directly.
 */
const baseWorkflow =
  gitRaw([
    'show',
    BASE + ':' + WORKFLOW
  ]);

const oldSyntax =
  '          node --check ' +
  BLOCKER_VALIDATOR +
  '\n';

const newSyntax =
  oldSyntax +
  '          node --check ' +
  SELF +
  '\n';

assert.equal(
  baseWorkflow.split(
    oldSyntax
  ).length - 1,
  1,
  'Base workflow blocker-contract syntax anchor changed.'
);

const oldStep =
  '      - name: Validate collapse executor blocker-retirement contract v1\n' +
  '        run: node ' +
  BLOCKER_VALIDATOR +
  '\n\n';

const replayStep =
  '      - name: Validate certified collapse executor blocker-retirement contract v1\n' +
  '        run: |\n' +
  '          root="$(mktemp -d)"\n' +
  '          wt="$root/certified"\n' +
  '          cleanup() {\n' +
  '            git worktree remove --force "$wt" >/dev/null 2>&1 || true\n' +
  '            rm -rf "$root"\n' +
  '          }\n' +
  '          trap cleanup EXIT\n' +
  '\n' +
  '          git worktree add --detach "$wt" ' +
  BASE +
  '\n' +
  '\n' +
  '          (\n' +
  '            cd "$wt"\n' +
  '            test "$(git rev-parse HEAD)" = "' +
  BASE +
  '"\n' +
  '            test "$(git rev-parse \'HEAD^{tree}\')" = "' +
  BASE_TREE +
  '"\n' +
  '            node ' +
  BLOCKER_VALIDATOR +
  '\n' +
  '          )\n' +
  '\n' +
  '      - name: Validate collapse executor safety-correction authorization v1\n' +
  '        run: node ' +
  SELF +
  '\n\n';

assert.equal(
  baseWorkflow.split(
    oldStep
  ).length - 1,
  1,
  'Base workflow blocker-contract active anchor changed.'
);

let expectedWorkflow =
  baseWorkflow.replace(
    oldSyntax,
    newSyntax
  );

expectedWorkflow =
  expectedWorkflow.replace(
    oldStep,
    replayStep
  );

assert.equal(
  workflow,
  expectedWorkflow,
  'Workflow changed beyond exact authorization lifecycle transition.'
);

assert.equal(
  workflow.includes(
    'run: node ' +
    BLOCKER_VALIDATOR
  ),
  false,
  'Completed blocker-retirement contract validator must not run directly on later cumulative scope.'
);

[
  'Validate certified collapse executor blocker-retirement contract v1',
  'git worktree add --detach "$wt" ' + BASE,
  'test "$(git rev-parse HEAD)" = "' + BASE + '"',
  'test "$(git rev-parse \'HEAD^{tree}\')" = "' + BASE_TREE + '"',
  'node ' + BLOCKER_VALIDATOR,
  'run: node ' + SELF
].forEach(marker => {
  requireText(
    workflow,
    marker,
    'Authorization workflow transition'
  );
});

/*
 * Current executor runtime remains direct/active because executor source
 * is unchanged in this design-only increment.
 */
requireText(
  workflow,
  'run: node ' + EXECUTOR_RUNTIME,
  'Current executor runtime active registration'
);

/*
 * Exact candidate scope.
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
  'Corrective authorization increment must remain exactly three files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Corrective authorization candidate must remain unstaged.'
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
        'Trailing whitespace in ' +
          (
            textIndex === 0
              ? DOC
              : SELF
          ) +
          ' line ' +
          String(lineIndex + 1)
      );
    });
});

console.log(
  'PASS: PR #210 merged main is exact corrective authorization source.'
);

console.log(
  'PASS: three runtime-readiness hard gaps remain exactly reproduced.'
);

console.log(
  'PASS: blocker-retirement contract validator is preserved byte-exact and transitioned to certified PR #210 replay.'
);

console.log(
  'PASS: current executor runtime remains active because executor source is unchanged in this authorization increment.'
);

console.log(
  'PASS: future corrective implementation is bounded to five explicitly named source-control surfaces.'
);

console.log(
  'PASS: successor preflight and certified executor blocker remain untouched.'
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
  'EXECUTOR_SAFETY_CORRECTION_AUTHORIZATION_VALIDATION_PASSED=true'
);

console.log(
  'CORRECTIVE_EXECUTOR_IMPLEMENTATION_HANDOFF_DEFINED=true'
);

console.log(
  'HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true'
);

console.log(
  'CORRECTIVE_EXECUTOR_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORIZED=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_RPC_EXECUTION_AUTHORIZED=false'
);

console.log(
  'MAINTENANCE_RPC_EXECUTION_AUTHORIZED=false'
);

console.log(
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
