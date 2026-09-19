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
  '2866b515c6c3c7bc504c0b48a8e593fafe1c0748';

const CONTRACT =
  'docs/county-code-violation-collapse-postdelete-repeatability-contract-v1.md';

const DESIGN_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-contract-v1.js';

const INTENT =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const INTENT_HARNESS =
  'scripts/validate-county-collapse-operation-intent-store-v1.js';

const INTENT_CONTRACT =
  'scripts/validate-county-collapse-operation-intent-contract-v1.js';

const AUTHORITY =
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const PREFLIGHT_V2 =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const RUNTIME_HARNESS =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js';

const SELF =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-implementation-lifecycle-v1.js';

const RUNTIME_PREREQ_LIFECYCLE =
  'scripts/validate-county-collapse-runtime-prerequisite-implementation-lifecycle-v1.js';

const MAINT_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-maintenance-implementation-lifecycle-v1.js';

const PRESERVATION_IMPL_VALIDATOR =
  'scripts/validate-county-collapse-observation-preservation-implementation-contract-v1.js';

const FULLROW =
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js';

const WINNER =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const HIST_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const MAINT_OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const PROTECTED = new Map([
  [
    CONTRACT,
    '1e8ba1fd8363d16265d4b762309011d2036f1cd6af2719d99f38133334d320ab'
  ],
  [
    DESIGN_VALIDATOR,
    '228bb625e5898dda3a8b65517d844e99d5575d1a5f36cc8e5e9f59d1fa5c423c'
  ],
  [
    INTENT_HARNESS,
    'f320bf816eb1491db1f0bfda80ff5b6edbf3dff3fcfd91ef89767e9a3d489233'
  ],
  [
    INTENT_CONTRACT,
    'da12aeabd04faf1bbae82137409ccf37d1e349298446d515b7e7726cb6cf504d'
  ],
  [
    RUNTIME_PREREQ_LIFECYCLE,
    '703c9c2d26f9f0659e38a437259cfe10daef4464a464951ce45ee2401b04109a'
  ],
  [
    MAINT_LIFECYCLE,
    '697a635ded4262d2cfcbbb38ea361adf1704d41c39b104eb83d2b40f027ab2dd'
  ],
  [
    FULLROW,
    '5be8bc5b0b47e0ed20990f33ca8115bb2d86d333ebabbeeeda58f68ef07f9744'
  ],
  [
    WINNER,
    '24aead02bd9eb74a68a6db0e6a8973f34504bb51120820cb940792c01f4e5410'
  ],
  [
    HIST_PREFLIGHT,
    'baa7e61dd573d79ee616b13685048330f65da4f23d9efed9f00644cffc0bde53'
  ]
]);

const EXPECTED_SCOPE = [
  WORKFLOW,
  INTENT,
  AUTHORITY,
  RESIDUAL,
  PREFLIGHT_V2,
  RUNTIME_HARNESS,
  SELF,
  PRESERVATION_IMPL_VALIDATOR,
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

  assert.strictEqual(
    result.status,
    0,
    'Git command failed: git ' +
      args.join(' ') +
      '\n' +
      String(
        result.stderr || ''
      )
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

function lines(value) {
  return String(
    value || ''
  )
    .split(/\r?\n/)
    .map(
      line =>
        line.trim()
    )
    .filter(Boolean);
}

function runNode(path) {
  const result =
    cp.spawnSync(
      process.execPath,
      [path],
      {
        encoding:
          'utf8'
      }
    );

  if (result.stdout) {
    process.stdout.write(
      result.stdout
    );
  }

  if (result.stderr) {
    process.stderr.write(
      result.stderr
    );
  }

  assert.strictEqual(
    result.status,
    0,
    'Node validation failed: ' +
      path
  );
}

console.log(
  '=== POST-DELETE REPEATABILITY IMPLEMENTATION LIFECYCLE V1 ==='
);

assert.strictEqual(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Implementation branch must descend from certified PR #206 main authority.'
);

[
  CONTRACT,
  DESIGN_VALIDATOR,
  INTENT,
  INTENT_HARNESS,
  INTENT_CONTRACT,
  AUTHORITY,
  RESIDUAL,
  PREFLIGHT_V2,
  RUNTIME_HARNESS,
  SELF,
  PRESERVATION_IMPL_VALIDATOR,
  RUNTIME_PREREQ_LIFECYCLE,
  MAINT_LIFECYCLE,
  FULLROW,
  WINNER,
  HIST_PREFLIGHT,
  INTEGRATION,
  WORKFLOW
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required implementation artifact missing: ' +
      path
  );
});

PROTECTED.forEach(
  (expected, path) => {
    assert.strictEqual(
      sha256File(path),
      expected,
      'Protected historical artifact changed: ' +
        path
    );
  }
);

assert.strictEqual(
  fs.existsSync(EXECUTOR),
  false,
  'Collapse executor must remain absent.'
);

assert.strictEqual(
  fs.existsSync(MAINT_OPERATOR),
  false,
  'Maintenance operator must remain absent.'
);

const intent =
  fs.readFileSync(
    INTENT,
    'utf8'
  );

requireText(
  intent,
  'function listOperationIds()',
  'Intent enumeration implementation'
);

requireText(
  intent,
  'listOperationIds:',
  'Intent enumeration public API'
);

const authority =
  fs.readFileSync(
    AUTHORITY,
    'utf8'
  );

const residual =
  fs.readFileSync(
    RESIDUAL,
    'utf8'
  );

const preflight =
  fs.readFileSync(
    PREFLIGHT_V2,
    'utf8'
  );

[
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7',
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce',
  '2, 4, 5, 6, 7, 8, 9',
  'physicalDeleteAuthorityGranted',
  'false'
].forEach(marker => {
  requireText(
    authority,
    marker,
    'Direct-keep authority'
  );
});

[
  'VERIFIED_SUCCESS_JOURNAL',
  'COLLAPSE_DELETE_VERIFIED',
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY',
  'currentPhysicalRowIsEvidenceOnly',
  'callerSuppliedDeletedIdAuthority',
  'false'
].forEach(marker => {
  requireText(
    residual,
    marker,
    'Residual evidence'
  );
});

[
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY',
  'collapseExecutionReady:',
  'false',
  'deletePhysicalRowExact'
].forEach(marker => {
  requireText(
    preflight,
    marker,
    'Successor execution preflight'
  );
});

assert.strictEqual(
  /deletePhysicalRowExact\s*\(/.test(
    preflight
  ),
  false,
  'Successor preflight must not invoke physical-delete primitive.'
);

[
  authority,
  residual,
  preflight
].forEach(source => {
  assert.strictEqual(
    /function\s+reos/.test(
      source
    ),
    false,
    'Successor repeatability runtime may not expose an RPC.'
  );
});

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

assert.strictEqual(
  workflow.split(
    DESIGN_VALIDATOR
  ).length - 1,
  1,
  'Completed repeatability design validator must remain syntax-only.'
);

requireText(
  workflow,
  'node --check ' +
    DESIGN_VALIDATOR,
  'Repeatability design syntax registration'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' +
      DESIGN_VALIDATOR
  ),
  false,
  'Completed repeatability design validator must not execute.'
);

assert.strictEqual(
  workflow.split(
    RUNTIME_PREREQ_LIFECYCLE
  ).length - 1,
  1,
  'Completed runtime-prerequisite lifecycle must remain syntax-only.'
);

requireText(
  workflow,
  'node --check ' +
    RUNTIME_PREREQ_LIFECYCLE,
  'Runtime-prerequisite lifecycle syntax preservation'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' +
      RUNTIME_PREREQ_LIFECYCLE
  ),
  false,
  'Superseded runtime-prerequisite lifecycle must not execute.'
);

assert.strictEqual(
  workflow.split(
    MAINT_LIFECYCLE
  ).length - 1,
  2,
  'Maintenance lifecycle must remain syntax-checked and active exactly once.'
);

assert.strictEqual(
  workflow.split(
    INTENT_CONTRACT
  ).length - 1,
  2,
  'Operation-intent contract must remain syntax-checked and active exactly once.'
);

assert.strictEqual(
  workflow.split(
    INTENT_HARNESS
  ).length - 1,
  2,
  'Operation-intent store harness must remain syntax-checked and active exactly once.'
);

assert.strictEqual(
  workflow.split(
    PRESERVATION_IMPL_VALIDATOR
  ).length - 1,
  2,
  'Observation-preservation implementation validator must remain syntax-checked and active exactly once.'
);

[
  AUTHORITY,
  RESIDUAL,
  PREFLIGHT_V2,
  RUNTIME_HARNESS,
  SELF
].forEach(path => {
  requireText(
    workflow,
    'node --check ' +
      path,
    'Successor syntax registration'
  );
});

requireText(
  workflow,
  'run: node ' +
    RUNTIME_HARNESS,
  'Successor runtime harness execution'
);

requireText(
  workflow,
  'run: node ' +
    SELF,
  'Successor lifecycle execution'
);

const integration =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

[
  'expectedCodeViolationCollapseRepeatabilityFiles',
  'CountyCodeViolationCollapseDirectKeepExecutionAuthority.js',
  'CountyCodeViolationCollapseResidualEvidence.js',
  'CountyCodeViolationCollapseExecutionPreflightV2.js',
  'expected reconciled production inventory must contain 140 files'
].forEach(marker => {
  requireText(
    integration,
    marker,
    'Runtime integration'
  );
});

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
  'Repeatability implementation increment must remain exactly nine files.'
);

assert.strictEqual(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Implementation candidate must remain unstaged.'
);

runNode(
  INTENT_HARNESS
);

runNode(
  PRESERVATION_IMPL_VALIDATOR
);

runNode(
  RUNTIME_HARNESS
);

runNode(
  MAINT_LIFECYCLE
);

runNode(
  INTEGRATION
);

console.log(
  'PASS: historical pre-delete full-row, winner-plan and execution-preflight evidence remains byte-exact.'
);

console.log(
  'PASS: intent journal gains only deterministic read-only operation-ID enumeration.'
);

console.log(
  'PASS: observation-preservation implementation validation accepts only the historical or exact repeatability intent-store generation.'
);

console.log(
  'PASS: immutable direct-keep authority contains exactly 14 groups and 16 candidate deletes.'
);

console.log(
  'PASS: residual evidence accepts row shifts only when immutable identity remains exact.'
);

console.log(
  'PASS: every missing certified ID requires one exact verified delete journal.'
);

console.log(
  'PASS: uncertain delete history blocks successor execution.'
);

console.log(
  'PASS: successor preflight preserves certified executor blocker and remains authority-free.'
);

console.log(
  'PASS: runtime inventory transitions exactly 137 -> 140.'
);

console.log(
  'REPEATABILITY_IMPLEMENTATION_LIFECYCLE_PASSED=true'
);

console.log(
  'REPEATABILITY_RUNTIME_IMPLEMENTATION_CANDIDATE_CERTIFIED=true'
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
  'SCHEDULER_RESTORATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
