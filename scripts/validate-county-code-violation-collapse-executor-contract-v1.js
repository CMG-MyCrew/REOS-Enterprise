#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const cp = require('child_process');

const BASE =
  '6ac59ad157cf495e21539ecc832af8bf5def1107';

const CONTRACT_COMMIT =
  'e5aa095d65c55dfbeeeff786ef47cc3d141b23dd';

const DOC =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-contract-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const WINNER_PLAN =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const PROPOSED_IMPL =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXPECTED_DOC_SHA =
  '54f4b5914961cec0a43e5a0a3a71028e4af84954049e0484e35ddef80a515317';

function git(args, options) {
  return cp.execFileSync(
    'git',
    args,
    Object.assign(
      {
        encoding: 'utf8'
      },
      options || {}
    )
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

function lines(value) {
  return String(value || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .sort();
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

console.log(
  '=== COUNTY CODE-VIOLATION COLLAPSE EXECUTOR CONTRACT V1 ==='
);

/*
 * Lifecycle invariant:
 *
 * The validator must remain valid after its original contract commit and
 * after a validator-only remediation commit. It must also tolerate detached
 * HEAD execution in CI.
 *
 * Therefore branch-name equality, HEAD === BASE, zero-commit, and untracked
 * artifact assumptions are intentionally prohibited here.
 */

assert.strictEqual(
  git(['merge-base', BASE, 'HEAD']),
  BASE,
  'Certified executor base is no longer the current ancestry root.'
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
  'Certified executor contract commit is not an ancestor of current HEAD.'
);

const committedScope =
  lines(
    git([
      'diff',
      '--name-only',
      BASE,
      'HEAD'
    ])
  );

const committedTwoFileScope =
  JSON.stringify(committedScope) ===
  JSON.stringify([DOC, SELF].sort());

const committedThreeFileScope =
  JSON.stringify(committedScope) ===
  JSON.stringify([DOC, SELF, WORKFLOW].sort());

assert.ok(
  committedTwoFileScope ||
  committedThreeFileScope,
  'Committed executor-design scope must remain contract + validator, optionally with certified CI registration.'
);

/*
 * During validator remediation the working tree may differ from HEAD only
 * at this validator. Once committed, there should be no working-tree delta.
 */

const workingTracked =
  lines(
    git([
      'diff',
      '--name-only'
    ])
  );

assert.ok(
  workingTracked.every(function (path) {
    return (
      path === SELF ||
      path === WORKFLOW
    );
  }) &&
  workingTracked.length <= 2,
  'Working-tree changes are limited to validator / CI registration remediation.'
);

const staged =
  lines(
    git([
      'diff',
      '--cached',
      '--name-only'
    ])
  );

assert.deepStrictEqual(
  staged,
  [],
  'Validator lifecycle certification expects no staged changes.'
);

const untracked =
  lines(
    git([
      'ls-files',
      '--others',
      '--exclude-standard'
    ])
  );

assert.deepStrictEqual(
  untracked,
  [],
  'Validator lifecycle certification expects no untracked files.'
);

const effectiveScope =
  lines(
    git([
      'diff',
      '--name-only',
      BASE,
      '--'
    ])
  );

assert.deepStrictEqual(
  effectiveScope,
  [DOC, SELF, WORKFLOW].sort(),
  'Effective design scope must remain exactly contract + validator + CI registration.'
);

assert.ok(
  fs.existsSync(DOC),
  'Executor contract document must exist.'
);

assert.ok(
  fs.existsSync(SELF),
  'Executor contract validator must exist.'
);

assert.ok(
  !fs.existsSync(PROPOSED_IMPL),
  'Executor implementation must not exist during design certification.'
);

const doc =
  fs.readFileSync(DOC, 'utf8');

const self =
  fs.readFileSync(SELF, 'utf8');

const preflight =
  fs.readFileSync(PREFLIGHT, 'utf8');

const winnerPlan =
  fs.readFileSync(WINNER_PLAN, 'utf8');

const database =
  fs.readFileSync(DATABASE, 'utf8');

const workflow =
  fs.readFileSync(WORKFLOW, 'utf8');

assert.strictEqual(
  sha256(doc),
  EXPECTED_DOC_SHA,
  'Certified executor contract document hash changed.'
);

[
  'Status: DESIGN ONLY.',
  'EXECUTOR_CONTRACT_VERSION=1',
  'EXECUTOR_BASE_SHA=' + BASE,
  'WINNER_PLAN_FINGERPRINT=848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9',
  'COLLAPSE_AUTHORITY_SHA=87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee',
  'EXECUTOR_INVOCATION_SCOPE=ONE_GROUP_ONE_DELETE_CANDIDATE',
  'PHYSICAL_DELETE_CALLS_PER_INVOCATION=AT_MOST_ONE',
  'BLOCKED_GROUPS=1,3',
  'OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22',
  'REOS.Database.deletePhysicalRowExact',
  'DELETED_VERIFIED',
  'PHYSICAL_DELETE_PRECONDITION_FAILED',
  'PHYSICAL_DELETE_OUTCOME_UNCERTAIN',
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
  'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN',
  'COLLAPSE_DELETE_VERIFIED',
  'KEEP_WINNER_AND_COLLAPSE',
  'MERGE_LATEST_OBSERVATION_THEN_COLLAPSE',
  'durable operation-intent',
  'complete downstream-reference',
  'Row-shift-aware re-resolution',
  'writer-quiescence',
  'read-only reconciliation',
  'never automatically retry physical deletion',
  'does not authorize an executor implementation',
  'does not authorize an Apps Script RPC',
  'does not authorize a commit or push',
  'RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(token => {
  assert.ok(
    doc.includes(token),
    'Required executor contract token missing: ' + token
  );
});

[
  'confirmExecution',
  'groupNumber',
  'deleteDistressLeadId',
  'expectedWinnerDistressLeadId',
  'expectedPlanFingerprintSha256',
  'expectedAuthoritySha256'
].forEach(field => {
  assert.ok(
    doc.includes('`' + field + '`'),
    'Required future request field missing: ' + field
  );
});

[
  'durable operation-intent/preimage storage and recovery',
  'observation-preservation field mapping',
  'collapse-maintenance / writer-quiescence authority',
  'executor implementation contract and offline failure-path harness'
].forEach(blocker => {
  assert.ok(
    doc.includes(blocker),
    'Implementation prerequisite missing: ' + blocker
  );
});

assert.ok(
  preflight.includes(
    'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
  ),
  'Certified preflight blocker must remain present.'
);

assert.ok(
  preflight.includes(
    'physicalDeletePrimitiveAvailable'
  ) &&
  preflight.includes(
    'collapseExecutionReady'
  ),
  'Preflight primitive/readiness boundary must remain present.'
);

[
  'EXPECTED_ELIGIBLE_GROUPS = 20',
  'EXPECTED_ELIGIBLE_ROWS = 42',
  'EXPECTED_DIRECT_KEEP_GROUPS = 14',
  'EXPECTED_OBSERVATION_MERGE_GROUPS = 6',
  'EXPECTED_DELETE_CANDIDATES = 22',
  'CONFLICT_BLOCKED_GROUP = 1',
  'REFERENCE_BLOCKED_GROUP = 3',
  'MERGE_LATEST_OBSERVATION_THEN_COLLAPSE',
  'KEEP_WINNER_AND_COLLAPSE'
].forEach(token => {
  assert.ok(
    winnerPlan.includes(token),
    'Certified winner-plan baseline token missing: ' + token
  );
});

assert.ok(
  database.includes(
    'deletePhysicalRowExact'
  ),
  'Certified physical delete primitive must exist.'
);

const ciValidatorPath =
  'scripts/validate-county-code-violation-collapse-executor-contract-v1.js';

const ciValidatorOccurrences =
  workflow.split(ciValidatorPath).length - 1;

assert.strictEqual(
  ciValidatorOccurrences,
  2,
  'County-collapse CI must reference the executor contract validator exactly twice.'
);

assert.ok(
  workflow.includes(
    'node --check ' + ciValidatorPath
  ),
  'County-collapse CI must syntax-check the executor contract validator.'
);

assert.ok(
  workflow.includes(
    'run: node ' + ciValidatorPath
  ),
  'County-collapse CI must execute the executor contract validator.'
);

[
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.deleteCells\s*\(/,
  /\.clearContent\s*\(/
].forEach(pattern => {
  assert.ok(
    !pattern.test(winnerPlan),
    'Winner plan unexpectedly exposes direct physical mutation.'
  );
});

/*
 * Inspect the effective working tree, not only HEAD, so a locally introduced
 * executor implementation or RPC cannot hide behind an uncommitted change.
 */

const trackedExecutor =
  gitStatus([
    'grep',
    '-n',
    'CountyCodeViolationCollapseExecutor',
    '--',
    'build/apps-script-brand'
  ]);

assert.ok(
  trackedExecutor.status === 1 ||
  !String(
    trackedExecutor.stdout || ''
  ).trim(),
  'Executor implementation already exists.'
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
  !String(
    trackedRpc.stdout || ''
  ).trim(),
  'Collapse executor RPC already exists.'
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
  'PASS: certified executor base remains exact ancestry root.'
);

console.log(
  'PASS: certified contract commit remains an ancestor of current HEAD.'
);

console.log(
  'PASS: repository design scope remains limited to contract + validator + CI registration.'
);

console.log(
  'PASS: county-collapse CI registers and executes the executor contract validator.'
);

console.log(
  'PASS: validator supports committed and detached-HEAD lifecycle execution.'
);

console.log(
  'PASS: executor invocation is one group / one delete candidate.'
);

console.log(
  'PASS: at most one physical-delete primitive call is authorized per invocation.'
);

console.log(
  'PASS: groups 1 and 3 remain blocked.'
);

console.log(
  'PASS: groups 17-22 require certified observation preservation first.'
);

console.log(
  'PASS: durable intent/preimages are mandatory before delete.'
);

console.log(
  'PASS: writer quiescence is a separate mandatory prerequisite.'
);

console.log(
  'PASS: row-shift re-resolution and residual verification are mandatory.'
);

console.log(
  'PASS: uncertain outcomes halt and require read-only reconciliation.'
);

console.log(
  'PASS: no executor implementation or RPC exists.'
);

console.log(
  'contract_sha256=' +
  sha256(doc)
);

console.log(
  'validator_sha256=' +
  sha256(self)
);

console.log(
  'EXECUTOR_CONTRACT_DESIGN_VALIDATION_PASSED=true'
);
