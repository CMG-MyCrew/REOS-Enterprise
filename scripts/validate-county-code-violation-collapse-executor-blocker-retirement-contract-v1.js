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
  '5ed9766fe4f06b9c3e1c665a08d9212fb8617800';

const BASE_TREE =
  '3bc32b52da3021967505000e984539c47fd8631b';

const DOC =
  'docs/county-code-violation-collapse-executor-blocker-retirement-contract-v1.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-contract-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const HIST_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const PREFLIGHT_V2 =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const EXECUTOR_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-runtime-v1.js';

const EXECUTOR_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js';

const REPEATABILITY_RUNTIME =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js';

const DIRECT_KEEP =
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const FUTURE_RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-runtime-v1.js';

const FUTURE_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js';

const BLOCKER =
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE';

const EXPECTED_DOC_SHA =
  '3fb09e1f962986f9cdbf64131c526f87439cf5860d6e03963db59bcf86df0e81';

const EXPECTED_INTEGRATION_SHA =
  '02756b3f8f646ce0f4280f16f68afbdd44887da0078b92fa6c54e9daf9fe51c5';

const SOURCE_ACTIVE_BLOCKER_VALIDATORS = [
  'scripts/validate-county-code-violation-post-restoration-collapse-authority-contract-v1.js',
  'scripts/validate-county-code-violation-collapse-execution-preflight-v1.js',
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js',
  'scripts/validate-county-code-violation-collapse-executor-runtime-v1.js',
  'scripts/validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js',
  'scripts/validate-county-collapse-operation-intent-orphan-binding-recovery-contract-v1.js'
].sort();

const PROTECTED = [
  HIST_PREFLIGHT,
  PREFLIGHT_V2,
  EXECUTOR,
  OPERATOR,
  EXECUTOR_RUNTIME,
  EXECUTOR_LIFECYCLE,
  REPEATABILITY_RUNTIME,
  DIRECT_KEEP,
  RESIDUAL,
  MAINT_GATE,
  INTENT_STORE,
  DATABASE
];

const EXPECTED_SCOPE = [
  DOC,
  SELF,
  WORKFLOW,
  INTEGRATION
].sort();

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
  '=== EXECUTOR BLOCKER RETIREMENT CONTRACT V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Blocker-retirement contract branch must descend from certified PR #209 main.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Certified blocker-retirement source tree changed.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  ...PROTECTED
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required blocker-retirement contract artifact missing: ' +
      path
  );
});

assert.equal(
  fs.existsSync(FUTURE_RUNTIME),
  false,
  'Future blocker-retirement runtime must remain absent in contract increment.'
);

assert.equal(
  fs.existsSync(FUTURE_LIFECYCLE),
  false,
  'Future blocker-retirement lifecycle must remain absent in contract increment.'
);

assert.equal(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Blocker-retirement contract document changed.'
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
    'Protected merged implementation artifact changed: ' +
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

const integration =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

const historical =
  fs.readFileSync(
    HIST_PREFLIGHT,
    'utf8'
  );

const successor =
  fs.readFileSync(
    PREFLIGHT_V2,
    'utf8'
  );

[
  'Status: DESIGN-ONLY BLOCKER-RETIREMENT AUTHORIZATION HANDOFF.',
  'EXECUTOR_BLOCKER_RETIREMENT_CONTRACT_VERSION=1',
  'SOURCE_MAIN_SHA=' + BASE,
  'SOURCE_MAIN_TREE=' + BASE_TREE,
  'SOURCE_POST_MERGE_CI_RUN=35469351737',
  'SOURCE_POST_MERGE_CI_JOB=105967356971',
  'EXECUTOR_IMPLEMENTATION_POST_MERGE_CERTIFIED=true',
  'EXECUTOR_FAILURE_PATH_VALIDATION_POST_MERGE_CERTIFIED=true',
  'SOURCE_BLOCKER_REFERENCE_COUNT=43',
  'SOURCE_ACTIVE_BLOCKER_VALIDATOR_COUNT=6',
  'CURRENT_BLOCKER=' + BLOCKER,
  'AUTHORIZED_RETIREMENT_TARGET=SUCCESSOR_PREFLIGHT_V2_ONLY',
  'HISTORICAL_PREFLIGHT_RETENTION_REQUIRED=true',
  'UNRESOLVED_OPERATION_HISTORY_BLOCKER_REQUIRED=true',
  'FUTURE_RETIREMENT_IMPLEMENTATION_SCOPE_FILE_COUNT=4',
  'POST_MERGE_BLOCKER_RETIREMENT_IMPLEMENTATION_HANDOFF=true',
  'HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true',
  'EXECUTOR_IMPLEMENTATION_LIFECYCLE_REPLAY_REQUIRED=true',
  'EXECUTOR_IMPLEMENTATION_LIFECYCLE_REPLAY_SOURCE=' + BASE,
  'COUNTY_RUNTIME_INTEGRATION_LIFECYCLE_REPLAY_REQUIRED=true',
  'COUNTY_RUNTIME_INTEGRATION_LIFECYCLE_REPLAY_SOURCE=' + BASE,
  'COUNTY_RUNTIME_INTEGRATION_LIFECYCLE_REPLAY_TREE=' + BASE_TREE,
  'COUNTY_RUNTIME_INTEGRATION_REPLAY_SHA256=' + EXPECTED_INTEGRATION_SHA,
  'CONTRACT_INCREMENT_SCOPE_FILE_COUNT=4',
  'COUNTY_RUNTIME_INTEGRATION_PRODUCTION_AUTHORITY_CHANGE=false',
  'EXECUTOR_SOURCE_MODIFICATION_AUTHORITY=false',
  'MAINTENANCE_OPERATOR_SOURCE_MODIFICATION_AUTHORITY=false',
  'HISTORICAL_PREFLIGHT_MODIFICATION_AUTHORITY=false',
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
    'Blocker-retirement contract'
  );
});

[
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js',
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-runtime-v1.js',
  'scripts/validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js',
  '.github/workflows/county-collapse-offline.yml',
  'collapseExecutionReady = executionBlockers.length === 0',
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Future retirement boundary'
  );
});

requireText(
  historical,
  BLOCKER,
  'Historical preflight blocker'
);

requireText(
  successor,
  BLOCKER,
  'Successor preflight blocker'
);

requireText(
  successor,
  "var blockers = [\n        'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'\n      ];",
  'Exact successor blocker initializer'
);

requireText(
  successor,
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY',
  'Unresolved operation-history blocker'
);

requireText(
  successor,
  'collapseExecutionReady:\n          false',
  'Current unconditional execution readiness'
);

const baselineGrep =
  git([
    'grep',
    '-n',
    '-F',
    BLOCKER,
    BASE,
    '--',
    'build/apps-script-brand',
    'scripts',
    'docs',
    '.github'
  ]);

assert.equal(
  baselineGrep.status,
  0,
  'Certified source blocker inventory is unavailable.'
);

const baselineReferences =
  lines(
    baselineGrep.stdout
  );

assert.equal(
  baselineReferences.length,
  43,
  'Certified source blocker-reference count changed.'
);

const baseWorkflow =
  gitText([
    'show',
    BASE + ':' + WORKFLOW
  ]);

const active = [];

baseWorkflow
  .split(/\r?\n/)
  .forEach(line => {
    const match =
      line.match(
        /^\s*run:\s*node\s+([^\s]+\.js)\s*$/
      );

    if (
      match &&
      active.indexOf(
        match[1]
      ) === -1
    ) {
      active.push(
        match[1]
      );
    }
  });

const activeBlockerValidators = [];

active.forEach(path => {
  const result =
    git([
      'show',
      BASE + ':' + path
    ]);

  if (result.status !== 0) {
    return;
  }

  if (
    String(
      result.stdout || ''
    ).includes(
      BLOCKER
    )
  ) {
    activeBlockerValidators.push(
      path
    );
  }
});

assert.deepEqual(
  activeBlockerValidators
    .slice()
    .sort(),
  SOURCE_ACTIVE_BLOCKER_VALIDATORS,
  'Certified active blocker-validator inventory changed.'
);

[
  EXECUTOR_RUNTIME,
  REPEATABILITY_RUNTIME
].forEach(path => {
  assert.ok(
    workflow.includes(
      'run: node ' + path
    ),
    'Current safety validator unexpectedly inactive in contract increment: ' +
      path
  );
});

requireText(
  workflow,
  'node --check ' + EXECUTOR_LIFECYCLE,
  'Historical executor lifecycle syntax registration'
);

assert.equal(
  workflow.includes(
    'run: node ' + EXECUTOR_LIFECYCLE
  ),
  false,
  'Historical executor lifecycle must not execute against cumulative later-increment scope.'
);

[
  'Validate certified collapse executor implementation lifecycle v1',
  'git worktree add --detach "$wt" ' + BASE,
  'test "$(git rev-parse HEAD)" = "' + BASE + '"',
  'node ' + EXECUTOR_LIFECYCLE
].forEach(marker => {
  requireText(
    workflow,
    marker,
    'Certified executor lifecycle replay registration'
  );
});

[
  'CERTIFIED_EXECUTOR_IMPLEMENTATION_LIFECYCLE_VALIDATOR',
  'CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_SHA',
  'CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_TREE',
  BASE,
  BASE_TREE,
  'git',
  'worktree',
  'add',
  '--detach',
  'rev-parse',
  'HEAD^{tree}',
  'component certification failed: '
].forEach(marker => {
  requireText(
    integration,
    marker,
    'County runtime integration certified lifecycle replay'
  );
});

requireText(
  integration,
  'validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js',
  'County runtime integration lifecycle component inventory'
);

[
  'expectedCodeViolationCollapseExecutorImplementationFiles',
  'CountyCodeViolationCollapseMaintenanceOperator.js',
  'CountyCodeViolationCollapseExecutor.js',
  'expected reconciled production inventory must contain 142 files'
].forEach(marker => {
  requireText(
    integration,
    marker,
    'County runtime integration production boundary'
  );
});

const baselineIntegrationResult =
  git([
    'show',
    BASE + ':' + INTEGRATION
  ]);

assert.equal(
  baselineIntegrationResult.status,
  0,
  'Unable to read byte-exact county runtime integration baseline.'
);

const baselineIntegration =
  String(
    baselineIntegrationResult.stdout || ''
  );

assert.notEqual(
  integration,
  baselineIntegration,
  'County runtime integration must contain the certified replay-orchestration delta.'
);

assert.equal(
  sha256File(INTEGRATION),
  EXPECTED_INTEGRATION_SHA,
  'County runtime integration replay-orchestration bytes changed.'
);

[
  "const os = require('node:os');",
  'const CERTIFIED_EXECUTOR_IMPLEMENTATION_LIFECYCLE_VALIDATOR =',
  'const CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_SHA =',
  'const CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_TREE =',
  BASE,
  BASE_TREE,
  'function runComponentCertification(fileName) {',
  "'worktree'",
  "'--detach'",
  "'HEAD^{tree}'"
].forEach(marker => {
  requireText(
    integration,
    marker,
    'County runtime integration replay topology'
  );
});

function removeExactOnce(
  text,
  fragment,
  label
) {
  assert.equal(
    text.split(fragment).length - 1,
    1,
    label + ' must occur exactly once.'
  );

  return text.replace(
    fragment,
    ''
  );
}

let normalizedIntegration =
  integration;

/*
 * Certified delta #1:
 * os is required only for the isolated temporary replay worktree.
 */
normalizedIntegration =
  removeExactOnce(
    normalizedIntegration,
    "const os = require('node:os');\n",
    'os replay import'
  );

/*
 * Certified delta #2:
 * remove the exact replay-authority constant block.
 */
const replayConstantsStart =
  normalizedIntegration.indexOf(
    'const CERTIFIED_EXECUTOR_IMPLEMENTATION_LIFECYCLE_VALIDATOR =\n'
  );

assert.ok(
  replayConstantsStart >= 0,
  'Replay constant block start missing.'
);

const replayConstantsEnd =
  normalizedIntegration.indexOf(
    'function pass(message) {',
    replayConstantsStart
  );

assert.ok(
  replayConstantsEnd > replayConstantsStart,
  'Replay constant block end missing.'
);

normalizedIntegration =
  normalizedIntegration.slice(
    0,
    replayConstantsStart
  ) +
  normalizedIntegration.slice(
    replayConstantsEnd
  );

/*
 * Certified delta #3:
 * replace the replay helper plus modified execution loop with the
 * historical component execution loop copied directly from BASE.
 *
 * No forward reconstruction is used.
 */
const certificationTail =
  "\n\nconsole.log('');\n" +
  'pass(`all ${COMPONENT_VALIDATORS.length} component certifications pass together`);';

const currentReplayStart =
  normalizedIntegration.indexOf(
    'function runComponentCertification(fileName) {'
  );

assert.ok(
  currentReplayStart >= 0,
  'Replay helper start missing.'
);

const currentReplayEnd =
  normalizedIntegration.indexOf(
    certificationTail,
    currentReplayStart
  );

assert.ok(
  currentReplayEnd > currentReplayStart,
  'Replay helper end missing.'
);

const baseLoopStart =
  baselineIntegration.lastIndexOf(
    'COMPONENT_VALIDATORS.forEach(fileName => {'
  );

assert.ok(
  baseLoopStart >= 0,
  'Historical component execution loop missing.'
);

const baseLoopEnd =
  baselineIntegration.indexOf(
    certificationTail,
    baseLoopStart
  );

assert.ok(
  baseLoopEnd > baseLoopStart,
  'Historical component execution loop end missing.'
);

const historicalExecutionLoop =
  baselineIntegration.slice(
    baseLoopStart,
    baseLoopEnd
  );

normalizedIntegration =
  normalizedIntegration.slice(
    0,
    currentReplayStart
  ) +
  historicalExecutionLoop +
  normalizedIntegration.slice(
    currentReplayEnd
  );

assert.equal(
  normalizedIntegration,
  baselineIntegration,
  'County runtime integration contains changes outside the certified replay-orchestration delta.'
);

console.log(
  'COUNTY_RUNTIME_INTEGRATION_EXACT_SHA_BOUND=true'
);

console.log(
  'COUNTY_RUNTIME_INTEGRATION_INVERSE_NORMALIZATION_BASE_EXACT=true'
);

assert.equal(
  workflow.split(SELF).length - 1,
  2,
  'Blocker-retirement contract validator must be syntax-checked and active exactly once.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Contract validator syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Contract validator active registration'
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
  'Blocker-retirement contract increment must remain exactly three files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Blocker-retirement contract candidate must remain unstaged.'
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
          (textIndex === 0
            ? DOC
            : SELF) +
          ' line ' +
          String(
            lineIndex + 1
          )
      );
    });
});

console.log(
  'PASS: PR #209 merged main is the exact blocker-retirement contract source.'
);

console.log(
  'PASS: certified blocker reference inventory remains exactly 43 source references.'
);

console.log(
  'PASS: certified active blocker-validator inventory remains exactly six validators.'
);

console.log(
  'PASS: both current preflights retain the certified executor blocker.'
);

console.log(
  'PASS: executor, operator, historical preflight and successor safety surfaces remain byte-exact.'
);

console.log(
  'PASS: future retirement implementation is bounded to successor preflight v2 plus successor validation/workflow only.'
);

console.log(
  'PASS: unresolved operation history remains a mandatory fail-closed blocker.'
);

console.log(
  'PASS: deployment, RPC, execution, physical delete and automatic offers remain separate future gates.'
);

console.log(
  'blocker_retirement_contract_sha256=' +
    sha256File(DOC)
);

console.log(
  'blocker_retirement_validator_sha256=' +
    sha256File(SELF)
);

console.log(
  'EXECUTOR_BLOCKER_RETIREMENT_CONTRACT_VALIDATION_PASSED=true'
);

console.log(
  'BLOCKER_RETIREMENT_IMPLEMENTATION_HANDOFF_DEFINED=true'
);

console.log(
  'HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true'
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
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
