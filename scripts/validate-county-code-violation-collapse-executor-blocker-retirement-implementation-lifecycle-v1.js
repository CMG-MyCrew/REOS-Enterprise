#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  '3989fdddb4c46db6ead43794149f6b450e111b48';

const BASE_TREE =
  '36d460e4b8ff9c5e0b3b113b15fafb0c3cab3062';

const PR212_MAIN =
  'daefe8f081cb48e6f9f0433c05a267d9d553966d';

const PR212_TREE =
  'df4fc612ba4b62e05c262f26958fada74416de0c';

const RETIRED_BLOCKER =
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE';

const RESIDUAL_BLOCKER =
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const HIST_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const REFERENCE_AUDIT =
  'build/apps-script-brand/CountyIdentityReferenceAudit.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const SUCCESSOR_AUTH_DOC =
  'docs/county-code-violation-collapse-executor-blocker-retirement-successor-authorization-v2.md';

const SUCCESSOR_AUTH_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-successor-authorization-v2.js';

const REPEATABILITY =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js';

const CORRECTION_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js';

const CORRECTION_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js';

const RETIREMENT_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-runtime-v1.js';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const EXPECTED_SCOPE = [
  PREFLIGHT,
  RETIREMENT_RUNTIME,
  SELF,
  WORKFLOW,
  INTEGRATION
].sort();

const PROTECTED = [
  HIST_PREFLIGHT,
  EXECUTOR,
  INTENT_STORE,
  RESIDUAL,
  MAINT_GATE,
  OPERATOR,
  REFERENCE_AUDIT,
  DATABASE,
  SUCCESSOR_AUTH_DOC,
  SUCCESSOR_AUTH_VALIDATOR,
  REPEATABILITY,
  CORRECTION_RUNTIME,
  CORRECTION_LIFECYCLE
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

function lines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
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
  '=== BLOCKER RETIREMENT IMPLEMENTATION LIFECYCLE V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Retirement implementation must descend from exact PR #213 merged main.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'PR #213 merged source tree changed.'
);

[
  PREFLIGHT,
  RETIREMENT_RUNTIME,
  SELF,
  WORKFLOW,
  INTEGRATION,
  ...PROTECTED
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required file missing: ' +
      path
  );
});

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

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

const integration =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

assert.equal(
  preflight.includes(
    RETIRED_BLOCKER
  ),
  false,
  'Certified executor availability blocker must be retired.'
);

requireText(
  preflight,
  'var blockers = [];',
  'Successor preflight blocker initialization'
);

requireText(
  preflight,
  RESIDUAL_BLOCKER,
  'Unresolved durable-operation blocker'
);

requireText(
  preflight,
  'collapseExecutionReady:\n          blockers.length === 0',
  'Derived collapse readiness'
);

[
  'executionAuthorityGranted:\n          false',
  'winnerSelectionAuthorityGranted:\n          false',
  'collapseAuthorityGranted:\n          false',
  'deleteAuthorityGranted:\n          false',
  'physicalDeleteAuthorityGranted:\n          false',
  'productionDataMutationAuthorityGranted:\n          false',
  'connectorExecutionAuthorityGranted:\n          false',
  'checkpointMutationAuthorityGranted:\n          false',
  'schedulerAuthorityGranted:\n          false',
  'automaticOfferAuthorityGranted:\n          false'
].forEach(marker => {
  requireText(
    preflight,
    marker,
    'Non-readiness authority remains false'
  );
});

[
  'node --check ' +
    RETIREMENT_RUNTIME,
  'node --check ' +
    SELF,
  'run: node ' +
    RETIREMENT_RUNTIME,
  'run: node ' +
    SELF,
  'run: node ' +
    CORRECTION_RUNTIME,
  'run: node ' +
    INTEGRATION
].forEach(marker => {
  requireText(
    workflow,
    marker,
    'Current retirement workflow'
  );
});

assert.equal(
  workflow.includes(
    'run: node ' +
      SUCCESSOR_AUTH_VALIDATOR
  ),
  false,
  'Completed PR #213 authorization validator must not run directly.'
);

[
  'Validate certified collapse executor blocker-retirement successor authorization v2',
  'git worktree add --detach "$wt" ' +
    BASE,
  'test "$(git rev-parse HEAD)" = "' +
    BASE +
    '"',
  'test "$(git rev-parse \'HEAD^{tree}\')" = "' +
    BASE_TREE +
    '"',
  'node ' +
    SUCCESSOR_AUTH_VALIDATOR
].forEach(marker => {
  requireText(
    workflow,
    marker,
    'PR #213 successor authorization certified replay'
  );
});

[
  REPEATABILITY,
  CORRECTION_LIFECYCLE
].forEach(script => {
  assert.equal(
    workflow.includes(
      'run: node ' +
        script
    ),
    false,
    'PR #212 historical validator must remain replay-only: ' +
      script
  );
});

assert.ok(
  workflow.includes(
    'git worktree add --detach "$wt" ' +
      PR212_MAIN
  )
);

assert.ok(
  workflow.includes(
    'test "$(git rev-parse \'HEAD^{tree}\')" = "' +
      PR212_TREE +
      '"'
  )
);

assert.equal(
  workflow.includes(
    'Validate certified county runtime integration at PR 212'
  ),
  false,
  'County integration must be reactivated at current candidate.'
);

const retirementRuntimeName =
  RETIREMENT_RUNTIME
    .split('/')
    .pop();

const retirementLifecycleName =
  SELF
    .split('/')
    .pop();

const correctionLifecycleName =
  CORRECTION_LIFECYCLE
    .split('/')
    .pop();

[
  "'" +
    retirementRuntimeName +
    "'",
  "'" +
    retirementLifecycleName +
    "'",
  "'" +
    correctionLifecycleName +
    "'",
  'CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_LIFECYCLE_VALIDATOR',
  'CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_REPLAY_SHA',
  'CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_REPLAY_TREE',
  "'" +
    PR212_MAIN +
    "'",
  "'" +
    PR212_TREE +
    "'"
].forEach(marker => {
  requireText(
    integration,
    marker,
    'Current county integration retirement transition'
  );
});

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
  'Retirement implementation scope must remain exactly five files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Local implementation candidate must remain unstaged.'
);

console.log(
  'PASS: blocker-retirement implementation scope is exactly five files.'
);

console.log(
  'PASS: only certified executor availability blocker is retired.'
);

console.log(
  'PASS: unresolved durable-operation history remains fail-closed.'
);

console.log(
  'PASS: collapse readiness is derived from remaining blockers.'
);

console.log(
  'PASS: every non-readiness mutation/authority field remains false.'
);

console.log(
  'PASS: PR #213 successor authorization transitions to certified replay.'
);

console.log(
  'PASS: PR #212 repeatability and corrective lifecycle remain certified replay.'
);

console.log(
  'PASS: current county integration is reactivated with corrective-lifecycle replay.'
);

console.log(
  'EXECUTOR_BLOCKER_RETIREMENT_IMPLEMENTATION_LIFECYCLE_VALIDATION_PASSED=true'
);

console.log(
  'BLOCKER_RETIREMENT_IMPLEMENTATION_SCOPE_FILE_COUNT=5'
);

console.log(
  'CERTIFIED_EXECUTOR_AVAILABILITY_BLOCKER_RETIRED=true'
);

console.log(
  'UNRESOLVED_OPERATION_HISTORY_BLOCKER_RETAINED=true'
);

console.log(
  'COLLAPSE_READINESS_DERIVED_FROM_REMAINING_BLOCKERS=true'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_EXECUTION_AUTHORIZED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);
