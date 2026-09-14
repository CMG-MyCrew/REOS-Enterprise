#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const cp = require('child_process');

const BASE =
  '6ac59ad157cf495e21539ecc832af8bf5def1107';

const BRANCH =
  'feat/county-code-violation-collapse-executor-v1';

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

function git(args) {
  return cp.execFileSync(
    'git',
    args,
    {
      encoding: 'utf8'
    }
  ).trim();
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

assert.strictEqual(
  git(['branch', '--show-current']),
  BRANCH,
  'Validator must run on exact executor design branch.'
);

assert.strictEqual(
  git(['rev-parse', 'HEAD']),
  BASE,
  'Executor design branch HEAD must remain exact certified base.'
);

assert.strictEqual(
  git(['rev-list', '--count', BASE + '..HEAD']),
  '0',
  'Design branch must contain zero commits.'
);

assert.strictEqual(
  git(['diff', '--name-only', BASE, '--']),
  '',
  'No tracked file may differ from certified base during design authoring.'
);

const untracked =
  git([
    'ls-files',
    '--others',
    '--exclude-standard'
  ])
    .split('\n')
    .filter(Boolean)
    .sort();

assert.deepStrictEqual(
  untracked,
  [DOC, SELF].sort(),
  'Exactly the contract and its validator may be untracked.'
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
  'Executor implementation must not exist in design gate.'
);

const doc =
  fs.readFileSync(DOC, 'utf8');

const preflight =
  fs.readFileSync(PREFLIGHT, 'utf8');

const winnerPlan =
  fs.readFileSync(WINNER_PLAN, 'utf8');

const database =
  fs.readFileSync(DATABASE, 'utf8');

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

const directDeletePatterns = [
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.deleteCells\s*\(/,
  /\.clearContent\s*\(/
];

directDeletePatterns.forEach(pattern => {
  assert.ok(
    !pattern.test(
      git([
        'show',
        'HEAD:' + WINNER_PLAN
      ])
    ),
    'Winner plan unexpectedly exposes direct physical mutation.'
  );
});

const trackedExecutor =
  cp.spawnSync(
    'git',
    [
      'grep',
      '-n',
      'CountyCodeViolationCollapseExecutor',
      'HEAD',
      '--',
      'build/apps-script-brand'
    ],
    {
      encoding: 'utf8'
    }
  );

assert.ok(
  trackedExecutor.status === 1 ||
  !String(trackedExecutor.stdout || '').trim(),
  'Tracked executor implementation already exists.'
);

const trackedRpc =
  cp.spawnSync(
    'git',
    [
      'grep',
      '-n',
      'reosCountyCodeViolationCollapseExecute',
      'HEAD',
      '--',
      'build/apps-script-brand'
    ],
    {
      encoding: 'utf8'
    }
  );

assert.ok(
  trackedRpc.status === 1 ||
  !String(trackedRpc.stdout || '').trim(),
  'Tracked collapse executor RPC already exists.'
);

doc.split('\n').forEach((line, index) => {
  assert.ok(
    !/[ \t]+$/.test(line),
    'Trailing whitespace in contract line ' + (index + 1)
  );
});

console.log(
  'PASS: exact certified main baseline retained.'
);

console.log(
  'PASS: design branch contains zero commits.'
);

console.log(
  'PASS: only contract + validator are untracked.'
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
  'contract_sha256=' + sha256(doc)
);

console.log(
  'validator_sha256=' +
  sha256(
    fs.readFileSync(SELF, 'utf8')
  )
);

console.log(
  'EXECUTOR_CONTRACT_DESIGN_VALIDATION_PASSED=true'
);
