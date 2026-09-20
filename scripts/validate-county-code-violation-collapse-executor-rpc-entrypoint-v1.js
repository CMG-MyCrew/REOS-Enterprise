#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const vm =
  require('node:vm');

const BASE =
  '397e66b141dd07d11fd280c1c5c0b91a6bfd5a9b';

const BASE_TREE =
  '1305138b26d54cde2472486000deede0123e101f';

const SOURCE =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-rpc-entrypoint-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const SUCCESSOR_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-successor-preflight-rpc-entrypoint-v1.js';

const MAINT_OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const DIRECT_KEEP =
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const RPC =
  'reosCountyCodeViolationCollapseExecute';

const EXPECTED_SCOPE = [
  SOURCE,
  SELF,
  WORKFLOW,
  INTEGRATION
].sort();

const WRAPPER =
`function ${RPC}(request) {
  if (arguments.length !== 1) {
    throw new Error(
      'Collapse executor RPC requires exactly one request.'
    );
  }

  return REOS
    .CountyCodeViolationCollapseExecutor
    .execute(request);
}`;

function git(args) {
  return cp.spawnSync(
    'git',
    args,
    {
      encoding: 'utf8'
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

function count(value, needle) {
  return value
    .split(needle)
    .length - 1;
}

console.log(
  '=== COLLAPSE EXECUTOR RPC ENTRYPOINT V1 VALIDATION ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Candidate must descend from exact certified main.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Certified base tree changed.'
);

[
  SOURCE,
  SELF,
  WORKFLOW,
  INTEGRATION,
  SUCCESSOR_VALIDATOR,
  MAINT_OPERATOR,
  MAINT_GATE,
  LEASE,
  PREFLIGHT,
  DIRECT_KEEP,
  RESIDUAL,
  INTENT_STORE,
  DATABASE
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required file missing: ' + path
  );
});

/*
 * Every production execution dependency except the executor transport
 * itself must remain byte-identical to certified main.
 */
[
  MAINT_OPERATOR,
  MAINT_GATE,
  LEASE,
  PREFLIGHT,
  DIRECT_KEEP,
  RESIDUAL,
  INTENT_STORE,
  DATABASE
].forEach(path => {
  assert.equal(
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]).status,
    0,
    'Protected production source changed: ' + path
  );
});

const source =
  fs.readFileSync(
    SOURCE,
    'utf8'
  );

const baseSource =
  gitText([
    'show',
    BASE + ':' + SOURCE
  ]);

const expectedSource =
  baseSource +
  '\n\n' +
  WRAPPER +
  '\n';

assert.equal(
  source,
  expectedSource,
  'Executor source must differ only by the exact RPC wrapper.'
);

assert.equal(
  count(
    source,
    'function ' + RPC + '(request)'
  ),
  1,
  'Exact executor RPC wrapper must appear once.'
);

assert.ok(
  source.endsWith(
    WRAPPER + '\n'
  ),
  'Executor RPC wrapper must be the exact terminal source addition.'
);

[
  'deletePhysicalRowExact',
  'MaintenanceOpen',
  'MaintenanceClose',
  'ProductionScheduler',
  'retireCheckpoint',
  'CountyCollapseOperationIntentStore',
  'SpreadsheetApp',
  'PropertiesService'
].forEach(forbidden => {
  assert.equal(
    WRAPPER.includes(forbidden),
    false,
    'Transport wrapper contains prohibited direct authority: ' +
      forbidden
  );
});

assert.equal(
  count(
    WRAPPER,
    '.CountyCodeViolationCollapseExecutor'
  ),
  1
);

assert.equal(
  count(
    WRAPPER,
    '.execute(request);'
  ),
  1
);

assert.equal(
  WRAPPER.includes(
    'arguments.length !== 1'
  ),
  true,
  'RPC transport must require exactly one request argument.'
);

/*
 * Prove transport semantics independently of executor behavior:
 * exactly one request enters and the exact same object is delegated.
 */
const calls = [];

const context = {
  REOS: {
    CountyCodeViolationCollapseExecutor: {
      execute(request) {
        calls.push(request);

        return {
          ok: true,
          delegated: true
        };
      }
    }
  }
};

vm.createContext(
  context
);

vm.runInContext(
  WRAPPER,
  context,
  {
    filename: 'executor-rpc-wrapper.js'
  }
);

assert.equal(
  typeof context[RPC],
  'function',
  'RPC wrapper did not become a top-level function.'
);

assert.throws(
  () => context[RPC](),
  /requires exactly one request/
);

assert.throws(
  () => context[RPC]({}, {}),
  /requires exactly one request/
);

const request = {
  sentinel:
    'EXECUTOR_RPC_REQUEST_PASSTHROUGH'
};

const result =
  context[RPC](request);

assert.equal(
  calls.length,
  1,
  'Executor transport delegated an unexpected number of times.'
);

assert.strictEqual(
  calls[0],
  request,
  'Executor transport did not delegate the exact request object.'
);

assert.equal(
  result.ok,
  true
);

assert.equal(
  result.delegated,
  true
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

assert.ok(
  workflow.includes(
    'node --check ' + SELF
  ),
  'Workflow syntax registration missing.'
);

assert.ok(
  workflow.includes(
    'run: node ' + SELF
  ),
  'Workflow execution registration missing.'
);

/*
 * PR #215's scope-exact validator is now historical and must replay
 * against its exact merged main authority instead of current HEAD.
 */
assert.equal(
  workflow.includes(
    'run: node ' + SUCCESSOR_VALIDATOR
  ),
  false,
  'Successor-preflight RPC validator must not execute directly on successor scope.'
);

[
  'Validate certified successor preflight RPC entrypoint v1',
  'git worktree add --detach "$wt" ' + BASE,
  'test "$(git rev-parse HEAD)" = "' + BASE + '"',
  'test "$(git rev-parse \'HEAD^{tree}\')" = "' + BASE_TREE + '"',
  'node ' + SUCCESSOR_VALIDATOR
].forEach(marker => {
  assert.ok(
    workflow.includes(marker),
    'Certified successor-preflight replay missing: ' + marker
  );
});

/*
 * The pre-wrapper safety runtime is historical after this transport
 * increment. Preserve it byte-for-byte and replay it at certified
 * base authority rather than weakening its "no executor RPC" assertion.
 */
assert.equal(
  workflow.includes(
    'run: node scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js'
  ),
  false,
  'Safety-correction runtime must not execute directly on wrapper scope.'
);

[
  'Validate certified collapse executor safety-correction runtime v1',
  'git worktree add --detach "$wt" ' + BASE,
  'test "$(git rev-parse HEAD)" = "' + BASE + '"',
  'test "$(git rev-parse \'HEAD^{tree}\')" = "' + BASE_TREE + '"',
  'node scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js'
].forEach(marker => {
  assert.ok(
    workflow.includes(marker),
    'Certified safety-runtime workflow replay missing: ' + marker
  );
});

[
  'CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_VALIDATOR',
  "'validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js'",
  'CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_REPLAY_SHA',
  "'397e66b141dd07d11fd280c1c5c0b91a6bfd5a9b'",
  'CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_REPLAY_TREE',
  "'1305138b26d54cde2472486000deede0123e101f'"
].forEach(marker => {
  assert.ok(
    integration.includes(marker),
    'Runtime-integration safety replay marker missing: ' + marker
  );
});

assert.ok(
  integration.includes(
    'fileName ===\n      CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_VALIDATOR'
  ),
  'Runtime-integration safety validator replay dispatch missing.'
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
  Array.from(effective).sort(),
  EXPECTED_SCOPE,
  'Candidate scope must remain exactly four files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Candidate must remain unstaged during local certification.'
);

console.log(
  'PASS: executor source differs only by one exact terminal RPC wrapper.'
);

console.log(
  'PASS: wrapper requires exactly one request and delegates it unchanged.'
);

console.log(
  'PASS: wrapper contains no direct maintenance, delete, scheduler, checkpoint, journal, or spreadsheet authority.'
);

console.log(
  'PASS: PR #215 successor-preflight validator is preserved through certified replay.'
);

console.log(
  'PASS: candidate scope is exactly four files.'
);

console.log(
  'COLLAPSE_EXECUTOR_RPC_ENTRYPOINT_V1_VALIDATION_PASSED=true'
);

console.log(
  'EXECUTOR_RPC_ENTRYPOINT_PRESENT=true'
);

console.log(
  'EXECUTOR_RPC_NAME=reosCountyCodeViolationCollapseExecute'
);

console.log(
  'EXECUTOR_RPC_REQUEST_ARGUMENT_COUNT=1'
);

console.log(
  'EXECUTOR_RPC_REQUEST_PASSTHROUGH_EXACT=true'
);

console.log(
  'SUCCESSOR_PREFLIGHT_RPC_VALIDATOR_CERTIFIED_REPLAY=true'
);

console.log(
  'EXECUTOR_SAFETY_RUNTIME_CERTIFIED_REPLAY=true'
);

console.log(
  'CANDIDATE_SCOPE_FILE_COUNT=4'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'RPC_EXECUTION_AUTHORIZED=false'
);

console.log(
  'MAINTENANCE_WINDOW_OPEN_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_RPC_EXECUTION_AUTHORIZED=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);

console.log(
  'COUNTY_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'SCHEDULER_RESTORATION_AUTHORIZED=false'
);

console.log(
  'CHECKPOINT_MUTATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
