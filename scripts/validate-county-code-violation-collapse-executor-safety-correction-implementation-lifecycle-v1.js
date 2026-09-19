#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  '73c3cfe69edaa4edfc7a1d5877ff83be7b5b909e';

const BASE_TREE =
  'bac75f02bc84cea175d7899ef072cbc7b5b3b2af';

const PRE_CORRECTION_MAIN =
  'dc19ab42fa9faf63b3db327598e32da6844de733';

const PRE_CORRECTION_TREE =
  '78db590eeae0c2fc64da4d4be29896e1f4980159';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const HIST_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

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

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const OLD_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-runtime-v1.js';

const OLD_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js';

const AUTH_DOC =
  'docs/county-code-violation-collapse-executor-safety-correction-authorization-v1.md';

const AUTH_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-authorization-v1.js';

const BLOCKER_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-contract-v1.js';

const NEW_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js';

const BLOCKER =
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE';

const EXPECTED_SCOPE = [
  EXECUTOR,
  NEW_RUNTIME,
  SELF,
  WORKFLOW,
  INTEGRATION
].sort();

const PROTECTED = [
  PREFLIGHT,
  HIST_PREFLIGHT,
  INTENT_STORE,
  RESIDUAL,
  MAINT_GATE,
  OPERATOR,
  REFERENCE_AUDIT,
  DATABASE,
  OLD_RUNTIME,
  OLD_LIFECYCLE,
  AUTH_DOC,
  AUTH_VALIDATOR,
  BLOCKER_VALIDATOR
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
  '=== EXECUTOR SAFETY CORRECTION IMPLEMENTATION LIFECYCLE V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Corrective implementation must descend from exact PR #211 merged main.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'PR #211 certified source tree changed.'
);

[
  EXECUTOR,
  NEW_RUNTIME,
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

const executor =
  fs.readFileSync(
    EXECUTOR,
    'utf8'
  );

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

const runtime =
  fs.readFileSync(
    NEW_RUNTIME,
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

requireText(
  preflight,
  BLOCKER,
  'Successor preflight blocker'
);

assert.equal(
  executor
    .split(
      '.deletePhysicalRowExact('
    )
    .length - 1,
  1,
  'Corrective executor must retain exactly one physical-delete call site.'
);

assert.equal(
  executor.includes(
    '.close('
  ),
  false,
  'Corrective executor must not auto-close maintenance.'
);

[
  'function assertNoTargetBoundOperationHistory_(',
  '.listOperationIds()',
  'Existing durable operation history already binds requested delete candidate.',
  'assertNoTargetBoundOperationHistory_('
].forEach(marker => {
  requireText(
    executor,
    marker,
    'Target-bound history guard'
  );
});

const prepareIndex =
  executor.indexOf(
    'store.prepare('
  );

const historyGuardIndex =
  executor.indexOf(
    'assertNoTargetBoundOperationHistory_(',
    executor.indexOf(
      'function execute(request)'
    )
  );

assert.ok(
  historyGuardIndex >= 0
);

assert.ok(
  prepareIndex >
    historyGuardIndex,
  'History guard must precede store.prepare().'
);

const referenceAgainIndex =
  executor.indexOf(
    'var referencesAgain'
  );

const barrierIndex =
  executor.indexOf(
    "eventType:\n                    'DELETE_INVOCATION_STARTED'",
    referenceAgainIndex
  );

assert.ok(
  referenceAgainIndex >= 0
);

assert.ok(
  barrierIndex >
    referenceAgainIndex
);

const finalWindow =
  executor.slice(
    referenceAgainIndex,
    barrierIndex
  );

const finalPreflightIndex =
  finalWindow.lastIndexOf(
    'requirePreflightReady_();'
  );

const finalMaintenanceIndex =
  finalWindow.lastIndexOf(
    'maintenanceReady_('
  );

assert.ok(
  finalPreflightIndex >= 0,
  'Final successor preflight reassertion missing.'
);

assert.ok(
  finalMaintenanceIndex >
    finalPreflightIndex,
  'Final maintenance readiness must follow final successor preflight.'
);

assert.equal(
  finalWindow
    .slice(
      finalMaintenanceIndex
    )
    .includes(
      'referenceClear_('
    ),
  false,
  'No reference scan may occur after final maintenance readiness.'
);

[
  'EXECUTOR_SAFETY_CORRECTION_RUNTIME_VALIDATION_PASSED=true',
  'TARGET_BOUND_HISTORY_GUARD_VALIDATED=true',
  'FINAL_PREFLIGHT_REASSERTION_VALIDATED=true',
  'FINAL_MAINTENANCE_REASSERTION_VALIDATED=true',
  'FINAL_BARRIER_ORDER_VALIDATED=true',
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORIZED=false'
].forEach(marker => {
  requireText(
    runtime,
    marker,
    'Corrective runtime'
  );
});

assert.equal(
  workflow.includes(
    'run: node ' +
    OLD_RUNTIME
  ),
  false,
  'Historical executor runtime must not run directly against corrected executor.'
);

assert.equal(
  workflow.includes(
    'run: node ' +
    AUTH_VALIDATOR
  ),
  false,
  'Completed authorization validator must not run directly on implementation scope.'
);

[
  'Validate certified collapse direct-keep executor runtime v1',
  'git worktree add --detach "$wt" ' +
    PRE_CORRECTION_MAIN,
  'test "$(git rev-parse \'HEAD^{tree}\')" = "' +
    PRE_CORRECTION_TREE +
    '"',
  'Validate certified collapse executor safety-correction authorization v1',
  'git worktree add --detach "$wt" ' +
    BASE,
  'run: node ' +
    NEW_RUNTIME,
  'run: node ' +
    SELF
].forEach(marker => {
  requireText(
    workflow,
    marker,
    'Corrective workflow lifecycle'
  );
});

[
  "'validate-county-code-violation-collapse-executor-runtime-v1.js'",
  "'validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js'",
  "'validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js'",
  "'validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js'",
  'CERTIFIED_EXECUTOR_RUNTIME_VALIDATOR',
  "CERTIFIED_EXECUTOR_RUNTIME_REPLAY_SHA",
  PRE_CORRECTION_MAIN,
  PRE_CORRECTION_TREE
].forEach(marker => {
  requireText(
    integration,
    marker,
    'County runtime integration correction orchestration'
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
  'Corrective implementation must remain exactly five files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Corrective implementation candidate must remain unstaged.'
);

const runtimeResult =
  cp.spawnSync(
    process.execPath,
    [
      NEW_RUNTIME
    ],
    {
      encoding:
        'utf8'
    }
  );

if (runtimeResult.stdout) {
  process.stdout.write(
    runtimeResult.stdout
  );
}

if (runtimeResult.stderr) {
  process.stderr.write(
    runtimeResult.stderr
  );
}

assert.equal(
  runtimeResult.status,
  0,
  'Corrective executor runtime failed.'
);

console.log(
  'PASS: exact five-file PR #211 corrective implementation scope is preserved.'
);

console.log(
  'PASS: target-bound durable operation history now fails closed before store.prepare.'
);

console.log(
  'PASS: final successor preflight and maintenance readiness occur after final evidence refresh.'
);

console.log(
  'PASS: irreversible ordering is preflight then maintenance then durable barrier then one delete.'
);

console.log(
  'PASS: successor preflight blocker remains present and byte-exact.'
);

console.log(
  'PASS: historical executor runtime and completed authorization are transitioned to certified replay.'
);

console.log(
  'EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_LIFECYCLE_VALIDATION_PASSED=true'
);

console.log(
  'CORRECTIVE_EXECUTOR_SOURCE_IMPLEMENTATION_PRESENT=true'
);

console.log(
  'CERTIFIED_COLLAPSE_EXECUTOR_BLOCKER_PRESENT=true'
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
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
