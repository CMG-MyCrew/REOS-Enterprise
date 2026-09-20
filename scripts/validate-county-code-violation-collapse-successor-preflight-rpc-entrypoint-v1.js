#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  '327258b0616f9cdc709168c1865674cdbb473025';

const BASE_TREE =
  '2873066de3fd9ec82d1cc56eadb3dd7b9a66ecd0';

const SOURCE =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const SELF =
  'scripts/validate-county-code-violation-collapse-successor-preflight-rpc-entrypoint-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const HISTORICAL =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const MAINTENANCE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const PREREQ =
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js';

const RPC =
  'reosCountyCodeViolationCollapseExecutionPreflightV2';

const EXPECTED_SCOPE = [
  SOURCE,
  SELF,
  WORKFLOW
].sort();

const WRAPPER =
`function ${RPC}() {
  return REOS
    .CountyCodeViolationCollapseExecutionPreflightV2
    .preflight({});
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
  '=== SUCCESSOR PREFLIGHT RPC ENTRYPOINT V1 VALIDATION ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Candidate must descend from exact certified source main.'
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
  SOURCE,
  SELF,
  WORKFLOW,
  HISTORICAL,
  EXECUTOR,
  MAINTENANCE,
  PREREQ
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required file missing: ' + path
  );
});

[
  HISTORICAL,
  EXECUTOR,
  MAINTENANCE,
  PREREQ
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
  'Successor preflight source must differ only by the exact RPC wrapper.'
);

assert.equal(
  count(
    source,
    'function ' + RPC + '()'
  ),
  1,
  'Exact successor RPC wrapper must appear once.'
);

assert.equal(
  count(
    source,
    '.CountyCodeViolationCollapseExecutionPreflightV2'
  ) >= 2,
  true,
  'Wrapper must delegate to the certified V2 namespace.'
);

assert.ok(
  source.endsWith(
    WRAPPER + '\n'
  ),
  'RPC wrapper must be the exact terminal source addition.'
);

assert.equal(
  WRAPPER.includes(
    '.preflight({});'
  ),
  true,
  'RPC wrapper must invoke the V2 preflight with an exact empty object.'
);

[
  'execute(',
  'deletePhysicalRowExact(',
  'MaintenanceOpen',
  'MaintenanceClose',
  'ProductionSchedulerRun',
  'setCheckpoint',
  'insert(',
  'update('
].forEach(forbidden => {
  assert.equal(
    WRAPPER.includes(forbidden),
    false,
    'RPC wrapper contains prohibited mutation surface: ' + forbidden
  );
});

[
  'executionAuthorityGranted:\n          false',
  'collapseAuthorityGranted:\n          false',
  'deleteAuthorityGranted:\n          false',
  'physicalDeleteAuthorityGranted:\n          false',
  'productionDataMutationAuthorityGranted:\n          false',
  'checkpointMutationAuthorityGranted:\n          false',
  'schedulerAuthorityGranted:\n          false',
  'automaticOfferAuthorityGranted:\n          false'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'Fail-closed authority marker missing: ' + marker
  );
});

const workflow =
  fs.readFileSync(
    WORKFLOW,
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
  'Candidate scope must be exactly three files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Candidate must remain unstaged.'
);

console.log(
  'PASS: successor V2 preflight has exactly one zero-argument RPC wrapper.'
);

console.log(
  'PASS: wrapper delegates only to certified V2 preflight with an empty options object.'
);

console.log(
  'PASS: historical preflight, executor, maintenance operator, and prerequisite certification remain unchanged.'
);

console.log(
  'PASS: candidate scope is exactly three files.'
);

console.log(
  'SUCCESSOR_PREFLIGHT_RPC_ENTRYPOINT_V1_VALIDATION_PASSED=true'
);

console.log(
  'SUCCESSOR_PREFLIGHT_RPC_WRAPPER_PRESENT=true'
);

console.log(
  'SUCCESSOR_PREFLIGHT_RPC_WRAPPER_ZERO_ARGUMENT=true'
);

console.log(
  'SUCCESSOR_PREFLIGHT_RPC_EMPTY_OPTIONS_EXACT=true'
);

console.log(
  'CANDIDATE_SCOPE_FILE_COUNT=3'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'RPC_EXECUTION_AUTHORIZED=false'
);

console.log(
  'MAINTENANCE_RPC_EXECUTION_AUTHORIZED=false'
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
