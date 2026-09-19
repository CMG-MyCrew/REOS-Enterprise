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
  'b6930db5a59a62c53d055aee5574b3ca3339f07d';

const DOC =
  'docs/county-code-violation-collapse-executor-maintenance-handoff-v1.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-maintenance-handoff-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const MAINT_OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const EXECUTOR_DOC =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const AUTH_DOC =
  'docs/county-code-violation-collapse-executor-implementation-authorization-v1.md';

const AUTH_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-implementation-authorization-v1.js';

const MAINTENANCE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const EXPECTED_DOC_SHA =
  'fb13bd9e65c20ad0b622c20929c9f2343efb161e2bd326409baf8cf637aa2725';

const EXPECTED_PROTECTED =
  new Map([
    [
      EXECUTOR_DOC,
      '54f4b5914961cec0a43e5a0a3a71028e4af84954049e0484e35ddef80a515317'
    ],
    [
      AUTH_DOC,
      'bbfeea240e162d7e4286da0aa104a5bb2b1b1f89cd83860f62daf4b5ec5f582b'
    ],
    [
      AUTH_VALIDATOR,
      '44034c9784fce28f5203169964727b808acd59b048472adac277198c55d1ac0b'
    ],
    [
      MAINTENANCE,
      '051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f'
    ]
  ]);

const EXPECTED_SCOPE =
  [
    DOC,
    SELF,
    WORKFLOW
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

  assert.strictEqual(
    result.status,
    0,
    'Git command failed: git ' +
      args.join(' ') +
      '\n' +
      String(result.stderr || '')
  );

  return String(
    result.stdout || ''
  ).trim();
}

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(path)
    )
    .digest('hex');
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
    label + ' missing: ' + marker
  );
}

console.log(
  '=== COLLAPSE EXECUTOR MAINTENANCE HANDOFF V1 ==='
);

assert.strictEqual(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE
);

[
  DOC,
  SELF,
  WORKFLOW,
  EXECUTOR_DOC,
  AUTH_DOC,
  AUTH_VALIDATOR,
  MAINTENANCE,
  LEASE,
  PREFLIGHT
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required handoff artifact missing: ' +
      path
  );
});

assert.strictEqual(
  fs.existsSync(EXECUTOR),
  false,
  'Executor source must remain absent.'
);

assert.strictEqual(
  fs.existsSync(MAINT_OPERATOR),
  false,
  'Maintenance operator source must remain absent.'
);

assert.strictEqual(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Maintenance-handoff document changed.'
);

EXPECTED_PROTECTED.forEach(
  (expected, path) => {
    assert.strictEqual(
      sha256File(path),
      expected,
      'Protected artifact changed: ' +
        path
    );
  }
);

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const executorContract =
  fs.readFileSync(
    EXECUTOR_DOC,
    'utf8'
  );

const authorization =
  fs.readFileSync(
    AUTH_DOC,
    'utf8'
  );

const maintenance =
  fs.readFileSync(
    MAINTENANCE,
    'utf8'
  );

const lease =
  fs.readFileSync(
    LEASE,
    'utf8'
  );

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

[
  'EXECUTOR_MAINTENANCE_HANDOFF_VERSION=1',
  'SOURCE_AUTHORITY_SHA=' + BASE,
  'MAINTENANCE_SETTLE_MS=600000',
  'EXECUTOR_SELECTOR_FIELD_COUNT=6',
  'MAINTENANCE_CAPABILITY_FIELD_COUNT=3',
  'EXECUTOR_V2_REQUEST_FIELD_COUNT=9',
  'MAINTENANCE_OPERATOR_REQUIRED=true',
  'TWO_STAGE_OPERATOR_HANDOFF_REQUIRED=true',
  'AUTHORIZATION_VALIDATOR_CI_MODE=SYNTAX_ONLY',
  'AUTHORIZATION_VALIDATOR_BYTE_EXACT=true',
  'RAW_MAINTENANCE_TOKEN_DURABLE_PERSISTENCE=false',
  'AUTOMATIC_MAINTENANCE_CLOSE_AFTER_UNCERTAIN=false',
  'AUTHORIZED_EXECUTOR_SCOPE=DIRECT_KEEP_ONLY',
  'DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16',
  'OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22',
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false',
  'COLLAPSE_EXECUTION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false',
  'SCHEDULER_RESTORATION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false',
  'reosCountyCodeViolationCollapseMaintenanceOpen(options)',
  'reosCountyCodeViolationCollapseMaintenanceStatus()',
  'reosCountyCodeViolationCollapseMaintenanceClose(options)',
  'maintenanceToken',
  'expectedMaintenanceLeaseId',
  'expectedMaintenanceGateId'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Maintenance-handoff contract'
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
  requireText(
    executorContract,
    '`' + field + '`',
    'Historical executor selector'
  );
});

[
  'maintenanceToken',
  'expectedLeaseId',
  'expectedGateId'
].forEach(field => {
  requireText(
    maintenance,
    "'" + field + "'",
    'Maintenance capability'
  );

  assert.strictEqual(
    executorContract.includes(
      '`' + field + '`'
    ),
    false,
    'Historical executor selector unexpectedly carries maintenance capability.'
  );
});

requireText(
  lease,
  'var SETTLE_MS =',
  'Mutation-exclusion lease'
);

requireText(
  lease,
  '600000',
  'Mutation-exclusion lease'
);

requireText(
  lease,
  'Lease settling interval has not completed.',
  'Mutation-exclusion lease'
);

requireText(
  authorization,
  'AUTHORIZED_EXECUTOR_SCOPE=DIRECT_KEEP_ONLY',
  'Implementation authorization'
);

requireText(
  authorization,
  'DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16',
  'Implementation authorization'
);

requireText(
  preflight,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'Current preflight blocker'
);

requireText(
  workflow,
  'node --check ' + AUTH_VALIDATOR,
  'Completed authorization validator syntax preservation'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' + AUTH_VALIDATOR
  ),
  false,
  'Completed authorization validator must be syntax-only in successor CI.'
);

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Handoff validator must appear exactly twice in CI.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Handoff validator syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Handoff validator execution registration'
);

const effectiveScope =
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
      effectiveScope.add(path);
    });
});

assert.deepStrictEqual(
  Array.from(
    effectiveScope
  ).sort(),
  EXPECTED_SCOPE,
  'Handoff design increment must remain exactly three files.'
);

assert.strictEqual(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Local design candidate must not contain staged changes.'
);

console.log(
  'PASS: executor implementation authorization remains byte-exact.'
);

console.log(
  'PASS: historical six-field selector contract remains byte-exact.'
);

console.log(
  'PASS: maintenance gate still requires the exact transient capability.'
);

console.log(
  'PASS: mandatory 600000 ms settling interval remains intact.'
);

console.log(
  'PASS: two-stage operator handoff resolves the implementation topology without weakening historical safety artifacts.'
);

console.log(
  'PASS: completed implementation-authorization validator remains byte-exact and syntax-only in successor CI.'
);

console.log(
  'PASS: executor and maintenance operator remain absent in this design increment.'
);

console.log(
  'EXECUTOR_MAINTENANCE_HANDOFF_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'TWO_STAGE_OPERATOR_HANDOFF_REQUIRED=true'
);

console.log(
  'AUTHORIZATION_VALIDATOR_CI_MODE=SYNTAX_ONLY'
);

console.log(
  'AUTHORIZATION_VALIDATOR_BYTE_EXACT=true'
);

console.log(
  'MAINTENANCE_OPERATOR_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_IMPLEMENTATION_AUTHORIZED=false'
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
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
