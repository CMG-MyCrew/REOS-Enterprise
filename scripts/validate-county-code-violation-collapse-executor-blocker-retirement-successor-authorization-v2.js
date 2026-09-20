#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  'daefe8f081cb48e6f9f0433c05a267d9d553966d';

const BASE_TREE =
  'df4fc612ba4b62e05c262f26958fada74416de0c';

const BLOCKER =
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const DOC =
  'docs/county-code-violation-collapse-executor-blocker-retirement-successor-authorization-v2.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-successor-authorization-v2.js';

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

const REPEATABILITY =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js';

const CORRECTION_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js';

const CORRECTION_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const OLD_BLOCKER_CONTRACT =
  'docs/county-code-violation-collapse-executor-blocker-retirement-contract-v1.md';

const OLD_BLOCKER_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-contract-v1.js';

const RETIREMENT_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-runtime-v1.js';

const RETIREMENT_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js';

const EXPECTED_SCOPE = [
  DOC,
  SELF,
  WORKFLOW
].sort();

const PROTECTED = [
  PREFLIGHT,
  HIST_PREFLIGHT,
  EXECUTOR,
  INTENT_STORE,
  RESIDUAL,
  MAINT_GATE,
  OPERATOR,
  REFERENCE_AUDIT,
  DATABASE,
  REPEATABILITY,
  CORRECTION_RUNTIME,
  CORRECTION_LIFECYCLE,
  INTEGRATION,
  OLD_BLOCKER_CONTRACT,
  OLD_BLOCKER_VALIDATOR
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
  '=== BLOCKER RETIREMENT SUCCESSOR AUTHORIZATION V2 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Successor authorization must descend from exact PR #212 merged main.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'PR #212 source tree changed.'
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
    'Protected source changed during design-only authorization: ' +
      path
  );
});

assert.equal(
  fs.existsSync(
    RETIREMENT_RUNTIME
  ),
  false,
  'Retirement runtime must remain absent during authorization.'
);

assert.equal(
  fs.existsSync(
    RETIREMENT_LIFECYCLE
  ),
  false,
  'Retirement lifecycle must remain absent during authorization.'
);

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

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

const executor =
  fs.readFileSync(
    EXECUTOR,
    'utf8'
  );

const repeatability =
  fs.readFileSync(
    REPEATABILITY,
    'utf8'
  );

const correctionLifecycle =
  fs.readFileSync(
    CORRECTION_LIFECYCLE,
    'utf8'
  );

const integration =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

const oldContract =
  fs.readFileSync(
    OLD_BLOCKER_CONTRACT,
    'utf8'
  );

[
  'EXECUTOR_BLOCKER_RETIREMENT_SUCCESSOR_AUTHORIZATION_VERSION=2',
  'SOURCE_MAIN_SHA=' + BASE,
  'SOURCE_MAIN_TREE=' + BASE_TREE,
  'ORIGINAL_FOUR_FILE_BLOCKER_RETIREMENT_HANDOFF_SUFFICIENT=false',
  'SUCCESSOR_RETIREMENT_FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=5',
  'FUTURE_RETIREMENT_MAY_REMOVE_ONLY_CERTIFIED_EXECUTOR_AVAILABILITY_BLOCKER=true',
  'UNRESOLVED_OPERATION_HISTORY_BLOCKER_REQUIRED=true',
  'PR_212_CORRECTION_INVARIANTS_INHERITANCE_REQUIRED=true',
  'POSTDELETE_REPEATABILITY_CERTIFIED_REPLAY_REQUIRED=true',
  'CORRECTION_LIFECYCLE_CERTIFIED_REPLAY_REQUIRED=true',
  'COUNTY_RUNTIME_INTEGRATION_AUTH_INCREMENT_REPLAY_REQUIRED=true',
  'FUTURE_COUNTY_RUNTIME_INTEGRATION_MODIFICATION_AUTHORITY=true',
  'AUTHORIZATION_INCREMENT_SCOPE_FILE_COUNT=3',
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORIZED=false',
  PREFLIGHT,
  RETIREMENT_RUNTIME,
  RETIREMENT_LIFECYCLE,
  WORKFLOW,
  INTEGRATION,
  'collapseExecutionReady = executionBlockers.length === 0',
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Successor authorization document'
  );
});

requireText(
  oldContract,
  'FUTURE_RETIREMENT_IMPLEMENTATION_SCOPE_FILE_COUNT=4',
  'Original PR #210 four-file handoff'
);

requireText(
  preflight,
  BLOCKER,
  'Current successor preflight blocker'
);

requireText(
  preflight,
  "var blockers = [\n        'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'\n      ];",
  'Current exact blocker initializer'
);

requireText(
  preflight,
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY',
  'Retained unresolved operation-history blocker'
);

requireText(
  preflight,
  'collapseExecutionReady:\n          false',
  'Current unconditional readiness'
);

assert.equal(
  executor
    .split(
      '.deletePhysicalRowExact('
    )
    .length - 1,
  1,
  'Corrected executor must retain one physical-delete call site.'
);

[
  'assertNoTargetBoundOperationHistory_(',
  'requirePreflightReady_();',
  'maintenanceReady_(',
  'DELETE_INVOCATION_STARTED'
].forEach(marker => {
  requireText(
    executor,
    marker,
    'PR #212 executor correction'
  );
});

requireText(
  repeatability,
  'successor preflight remains fail-closed solely on certified executor blocker',
  'Post-delete repeatability current blocker-state assertion'
);

requireText(
  repeatability,
  BLOCKER,
  'Post-delete repeatability blocker reference'
);

requireText(
  correctionLifecycle,
  '  PREFLIGHT,',
  'PR #212 correction lifecycle protected preflight'
);

requireText(
  correctionLifecycle,
  'Successor preflight blocker',
  'PR #212 correction lifecycle blocker requirement'
);

const correctionLifecycleName =
  CORRECTION_LIFECYCLE
    .split('/')
    .pop();

requireText(
  integration,
  "'" +
    correctionLifecycleName +
    "'",
  'County integration correction lifecycle component inventory'
);

assert.equal(
  integration.includes(
    'CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_LIFECYCLE_VALIDATOR'
  ),
  false,
  'Current integration must not already contain future correction-lifecycle replay support.'
);

function requireReplay(
  name,
  script
) {
  [
    '      - name: ' + name,
    'git worktree add --detach "$wt" ' +
      BASE,
    'test "$(git rev-parse HEAD)" = "' +
      BASE +
      '"',
    'test "$(git rev-parse \'HEAD^{tree}\')" = "' +
      BASE_TREE +
      '"',
    'node ' + script
  ].forEach(marker => {
    requireText(
      workflow,
      marker,
      'Certified replay for ' +
        script
    );
  });

  assert.equal(
    workflow.includes(
      'run: node ' +
        script
    ),
    false,
    'Replay-only validator must not execute directly: ' +
      script
  );
}

requireReplay(
  'Validate certified collapse post-delete repeatability runtime',
  REPEATABILITY
);

requireReplay(
  'Validate certified collapse executor safety-correction implementation lifecycle v1',
  CORRECTION_LIFECYCLE
);

requireReplay(
  'Validate certified county runtime integration at PR 212',
  INTEGRATION
);

requireText(
  workflow,
  'run: node ' +
    CORRECTION_RUNTIME,
  'Current PR #212 corrective runtime remains directly active'
);

requireText(
  workflow,
  'node --check ' +
    SELF,
  'Successor authorization validator syntax registration'
);

requireText(
  workflow,
  'run: node ' +
    SELF,
  'Successor authorization validator active registration'
);

requireText(
  workflow,
  'Validate certified collapse executor blocker-retirement contract v1',
  'Original PR #210 blocker-retirement contract replay'
);

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
  'Successor authorization must remain exactly three files.'
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

console.log(
  'PASS: exact three-file design-only successor authorization scope is preserved.'
);

console.log(
  'PASS: original PR #210 four-file implementation handoff is explicitly superseded.'
);

console.log(
  'PASS: future blocker-retirement implementation boundary is exactly five files.'
);

console.log(
  'PASS: post-delete repeatability, PR #212 correction lifecycle, and county integration use certified PR #212 replay.'
);

console.log(
  'PASS: current successor blocker remains present and unconditional readiness remains false.'
);

console.log(
  'PASS: PR #212 corrected executor invariants remain inherited and protected.'
);

console.log(
  'EXECUTOR_BLOCKER_RETIREMENT_SUCCESSOR_AUTHORIZATION_VALIDATION_PASSED=true'
);

console.log(
  'SUCCESSOR_RETIREMENT_FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=5'
);

console.log(
  'CERTIFIED_COLLAPSE_EXECUTOR_BLOCKER_PRESENT=true'
);

console.log(
  'BLOCKER_RETIREMENT_IMPLEMENTATION_AUTHORIZED=false'
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
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
