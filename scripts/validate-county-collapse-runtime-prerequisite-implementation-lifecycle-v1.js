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
  '644063fb7aa7e74e556c02cde20f85ee914abf12';

const MODULE =
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js';

const HARNESS =
  'scripts/validate-county-collapse-runtime-prerequisite-certification-v1.js';

const SELF =
  'scripts/validate-county-collapse-runtime-prerequisite-implementation-lifecycle-v1.js';

const MAINT_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-maintenance-implementation-lifecycle-v1.js';

const RETROFIT_LIFECYCLE =
  'scripts/validate-county-mutation-exclusion-lease-retrofit-validation-lifecycle-v1.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const DESIGN_DOC =
  'docs/county-collapse-runtime-prerequisite-certification-contract-v1.md';

const DESIGN_VALIDATOR =
  'scripts/validate-county-collapse-runtime-prerequisite-certification-contract-v1.js';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const LEASE_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-runtime-v1.js';

const MAINTENANCE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const MAINTENANCE_HARNESS =
  'scripts/validate-county-code-violation-collapse-maintenance-gate-v1.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const INTENT_HARNESS =
  'scripts/validate-county-collapse-operation-intent-store-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const WINNER =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const V2 =
  'docs/county-code-violation-collapse-execution-boundary-v2.md';

const EXECUTOR_CONTRACT =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const EXPECTED_MODULE_SHA =
  '7076616cd8c86bddac7d7ce57183312113a1bd4ac7d90401d84450e8a4557644';

const EXPECTED_HARNESS_SHA =
  '6a6e111650db3185828d8524e44bd2e255dece9da81942c6fb1c20d2182d8f6f';

const EXPECTED_PROTECTED = new Map([
  [
    DESIGN_DOC,
    '30f1c2361e6c938020de6f22046ed94948f1e37982581a07f0af46dfaf04522c'
  ],
  [
    DESIGN_VALIDATOR,
    '9e4dbcc7860393fae5723d27b5ad916c118d1fdb2e6ece9e42b551ef823b68e7'
  ],
  [
    LEASE,
    'f4e02ba1c8aef87075a87437673691b02d8a8587be2dd51280c9708b92954fdb'
  ],
  [
    LEASE_HARNESS,
    '4a8e18fc495869fd8bd47a66f89c3989720f162d3cbde07ad098ddb2029d938d'
  ],
  [
    MAINTENANCE,
    '051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f'
  ],
  [
    MAINTENANCE_HARNESS,
    'c7ddcb9ddf9976650eb6efdd15645dd6c944682a65209c2c908af9ab33d4a10a'
  ],
  [
    INTENT_STORE,
    '00c7ee96dfeee3401444374b3d7a03e905e2928143c92de91cff612e5a782abf'
  ],
  [
    INTENT_HARNESS,
    'f320bf816eb1491db1f0bfda80ff5b6edbf3dff3fcfd91ef89767e9a3d489233'
  ],
  [
    PREFLIGHT,
    'f5c6181b9e5de72cb9ab1c3479940b426576778826d02c474331419b485b9bc8'
  ],
  [
    WINNER,
    '24aead02bd9eb74a68a6db0e6a8973f34504bb51120820cb940792c01f4e5410'
  ],
  [
    V2,
    '0bafebe5173d0d0f1be9b2634d244b60e8bfabdf4931bf16bd46bde7958754ab'
  ],
  [
    EXECUTOR_CONTRACT,
    '54f4b5914961cec0a43e5a0a3a71028e4af84954049e0484e35ddef80a515317'
  ]
]);

const EXPECTED_SCOPE = [
  WORKFLOW,
  MODULE,
  HARNESS,
  SELF,
  MAINT_LIFECYCLE,
  RETROFIT_LIFECYCLE,
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

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(path)
    )
    .digest('hex');
}

function requireText(text, marker, label) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
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
    'Node validation failed: ' + path
  );
}

console.log(
  '=== COUNTY COLLAPSE RUNTIME PREREQUISITE IMPLEMENTATION LIFECYCLE V1 ==='
);

assert.strictEqual(
  git([
    'merge-base',
    BASE,
    'HEAD'
  ]).stdout.trim(),
  BASE
);

[
  MODULE,
  HARNESS,
  SELF,
  MAINT_LIFECYCLE,
  RETROFIT_LIFECYCLE,
  INTEGRATION,
  WORKFLOW
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Implementation lifecycle artifact missing: ' +
      path
  );
});

EXPECTED_PROTECTED.forEach(
  (expected, path) => {
    assert.strictEqual(
      sha256File(path),
      expected,
      'Protected prerequisite artifact changed: ' +
        path
    );

    assert.strictEqual(
      git([
        'diff',
        '--quiet',
        BASE,
        '--',
        path
      ]).status,
      0,
      'Protected prerequisite artifact differs from implementation base: ' +
        path
    );
  }
);

assert.strictEqual(
  sha256File(MODULE),
  EXPECTED_MODULE_SHA,
  'Prerequisite runtime implementation changed.'
);

assert.strictEqual(
  sha256File(HARNESS),
  EXPECTED_HARNESS_SHA,
  'Prerequisite behavior harness changed.'
);

assert.ok(
  !fs.existsSync(EXECUTOR),
  'Collapse executor must remain absent.'
);

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

[
  'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED',
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
].forEach(marker => {
  requireText(
    preflight,
    marker,
    'Preserved preflight blocker'
  );
});

const moduleSource =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

[
  'REOS.CountyCollapseRuntimePrerequisiteCertification',
  'reosCountyCollapseRuntimePrerequisiteStatus',
  'reosCountyCollapseOperationIntentProvision',
  'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID',
  'COUNTY_COLLAPSE_OPERATION_INTENTS',
  'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS',
  'prerequisitesReadyForExecutorImplementation',
  'collapseExecutionAuthorityGranted',
  'false'
].forEach(marker => {
  requireText(
    moduleSource,
    marker,
    'Prerequisite runtime'
  );
});

[
  /deletePhysicalRowExact/,
  /patchPhysicalRowCellsExact/,
  /replacePhysicalRowCellsExact/,
  /REOS\.Database\./,
  /ScriptApp\.newTrigger/,
  /\.openExclusive\s*\(/,
  /\.close\s*\(/
].forEach(pattern => {
  assert.strictEqual(
    pattern.test(moduleSource),
    false,
    'Forbidden prerequisite runtime surface: ' +
      pattern
  );
});

assert.strictEqual(
  (
    moduleSource.match(
      /function\s+reosCountyCollapseRuntimePrerequisiteStatus\s*\(/g
    ) || []
  ).length,
  1
);

assert.strictEqual(
  (
    moduleSource.match(
      /function\s+reosCountyCollapseOperationIntentProvision\s*\(/g
    ) || []
  ).length,
  1
);

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

assert.strictEqual(
  workflow.split(DESIGN_VALIDATOR).length - 1,
  1,
  'Completed design validator must remain syntax-only.'
);

requireText(
  workflow,
  'node --check ' +
    DESIGN_VALIDATOR,
  'Historical design syntax registration'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' +
      DESIGN_VALIDATOR
  ),
  false,
  'Completed implementation-absent design validator must not execute.'
);

[
  MODULE,
  HARNESS,
  SELF
].forEach(path => {
  requireText(
    workflow,
    'node --check ' +
      path,
    'Prerequisite implementation syntax registration'
  );
});

requireText(
  workflow,
  'run: node ' +
    SELF,
  'Prerequisite implementation lifecycle execution'
);

const integration =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

[
  'CountyCollapseRuntimePrerequisiteCertification.js',
  'validate-county-collapse-runtime-prerequisite-certification-v1.js',
  'expectedCountyCollapseRuntimePrerequisiteFiles',
  'expected reconciled production inventory must contain 136 files'
].forEach(marker => {
  requireText(
    integration,
    marker,
    'Runtime integration'
  );
});

const staged =
  git([
    'diff',
    '--cached',
    '--name-only'
  ]).stdout.trim();

assert.strictEqual(
  staged,
  '',
  'Implementation lifecycle requires no staged changes.'
);

const head =
  git([
    'rev-parse',
    'HEAD'
  ]).stdout.trim();

const authoring = [
  ...git([
    'diff',
    '--name-only'
  ]).stdout
    .trim()
    .split(/\r?\n/)
    .filter(Boolean),

  ...git([
    'ls-files',
    '--others',
    '--exclude-standard'
  ]).stdout
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
];

const authoringScope =
  Array.from(
    new Set(authoring)
  ).sort();

if (
  authoringScope.length > 0
) {
  assert.strictEqual(
    head,
    BASE,
    'Uncommitted implementation must remain pinned to implementation base.'
  );

  assert.deepStrictEqual(
    authoringScope,
    EXPECTED_SCOPE,
    'Prerequisite implementation authoring scope must be exactly seven files.'
  );
} else {
  assert.notStrictEqual(
    head,
    BASE,
    'Clean lifecycle requires an integrated implementation descendant.'
  );

  const integrated =
    git([
      'diff',
      '--name-only',
      BASE,
      'HEAD'
    ]).stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .sort();

  assert.deepStrictEqual(
    integrated,
    EXPECTED_SCOPE,
    'Integrated prerequisite implementation scope must be exactly seven files.'
  );
}

runNode(
  LEASE_HARNESS
);

runNode(
  MAINTENANCE_HARNESS
);

runNode(
  INTENT_HARNESS
);

runNode(
  HARNESS
);

console.log(
  'PASS: merged prerequisite design remains byte-exact and syntax-only.'
);

console.log(
  'PASS: lease, maintenance, intent store, winner, preflight, v2 and executor contract remain byte-exact.'
);

console.log(
  'PASS: prerequisite runtime is bounded to read-only status and one-time intent-store provisioning.'
);

console.log(
  'PASS: collapse executor remains absent and both preflight blockers remain intact.'
);

console.log(
  'RUNTIME_PREREQUISITE_IMPLEMENTATION_LIFECYCLE_PASSED=true'
);

console.log(
  'EXECUTOR_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_PROVISIONING_AUTHORIZED=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
