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
  'eb59d8177b3811f3cb40790f363472482d9da4f9';

const DOC =
  'docs/county-code-violation-collapse-executor-implementation-authorization-v1.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-implementation-authorization-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const EXECUTOR_DOC =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const EXECUTOR_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-contract-v1.js';

const MAINT_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-maintenance-implementation-lifecycle-v1.js';

const PREREQ_LIFECYCLE =
  'scripts/validate-county-collapse-runtime-prerequisite-implementation-lifecycle-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const WINNER =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const MAINTENANCE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const OBS_STORE =
  'build/apps-script-brand/CountyCollapseObservationPreservationStore.js';

const RUNTIME_PREREQ =
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js';

const RECOVERY =
  'build/apps-script-brand/CountyCollapseOperationIntentOrphanBindingRecovery.js';

const EXPECTED_DOC_SHA =
  'bbfeea240e162d7e4286da0aa104a5bb2b1b1f89cd83860f62daf4b5ec5f582b';

const EXPECTED_PROTECTED =
  new Map([
    [
      EXECUTOR_DOC,
      '54f4b5914961cec0a43e5a0a3a71028e4af84954049e0484e35ddef80a515317'
    ],
    [
      EXECUTOR_VALIDATOR,
      'c4bd5623e9746563fb56a992e7d870dce795756559925f4b3ad23994e4c452b0'
    ],
    [
      MAINT_LIFECYCLE,
      '697a635ded4262d2cfcbbb38ea361adf1704d41c39b104eb83d2b40f027ab2dd'
    ],
    [
      PREREQ_LIFECYCLE,
      '703c9c2d26f9f0659e38a437259cfe10daef4464a464951ce45ee2401b04109a'
    ],
    [
      PREFLIGHT,
      'baa7e61dd573d79ee616b13685048330f65da4f23d9efed9f00644cffc0bde53'
    ],
    [
      WINNER,
      '24aead02bd9eb74a68a6db0e6a8973f34504bb51120820cb940792c01f4e5410'
    ],
    [
      INTENT_STORE,
      '00c7ee96dfeee3401444374b3d7a03e905e2928143c92de91cff612e5a782abf'
    ],
    [
      MAINTENANCE,
      '051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f'
    ],
    [
      OBS_STORE,
      '256bf719a30e5a3630ccf2b06eed828ac0a4c37f61bc836d3f895d1dd85c406a'
    ],
    [
      RUNTIME_PREREQ,
      '9905e32a068a663480f27a543cb6da4e2fd3b72f4530ba826273c243b74a6efa'
    ],
    [
      RECOVERY,
      '1437a06d9acb656b56e0dff6239fc1c097d115b45036b132d40a108c3433207c'
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
    label + ' missing: ' + marker
  );
}

console.log(
  '=== COLLAPSE EXECUTOR IMPLEMENTATION AUTHORIZATION V1 ==='
);

assert.strictEqual(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Current revision must descend from the certified authorization base.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  EXECUTOR_DOC,
  EXECUTOR_VALIDATOR,
  MAINT_LIFECYCLE,
  PREREQ_LIFECYCLE,
  PREFLIGHT,
  WINNER,
  INTENT_STORE,
  MAINTENANCE,
  OBS_STORE,
  RUNTIME_PREREQ,
  RECOVERY
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required authorization artifact missing: ' +
      path
  );
});

assert.strictEqual(
  fs.existsSync(EXECUTOR),
  false,
  'Executor source must remain absent in the authorization increment.'
);

assert.strictEqual(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Implementation-authorization document changed.'
);

EXPECTED_PROTECTED.forEach(
  (expected, path) => {
    assert.strictEqual(
      sha256File(path),
      expected,
      'Protected authority artifact changed: ' +
        path
    );
  }
);

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const self =
  fs.readFileSync(
    SELF,
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

const winner =
  fs.readFileSync(
    WINNER,
    'utf8'
  );

const executorValidator =
  fs.readFileSync(
    EXECUTOR_VALIDATOR,
    'utf8'
  );

const maintenanceLifecycle =
  fs.readFileSync(
    MAINT_LIFECYCLE,
    'utf8'
  );

const prerequisiteLifecycle =
  fs.readFileSync(
    PREREQ_LIFECYCLE,
    'utf8'
  );

[
  'Status: DESIGN-ONLY IMPLEMENTATION AUTHORIZATION HANDOFF.',
  'EXECUTOR_IMPLEMENTATION_AUTHORIZATION_VERSION=1',
  'SOURCE_AUTHORITY_SHA=' + BASE,
  'SOURCE_AUTHORITY_TREE=e5ed20abdce61ff9bb6f0e03bcc4f1096929496f',
  'PRODUCTION_PREREQUISITE_DEPLOYMENT_VERSION=110',
  'PERSISTED_ORPHAN_BINDING_RECOVERY_CERTIFIED=true',
  'PREREQUISITES_READY_FOR_EXECUTOR_IMPLEMENTATION=true',
  'AUTHORIZED_EXECUTOR_SCOPE=DIRECT_KEEP_ONLY',
  'DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16',
  'OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22',
  'CONFLICT_BLOCKED_GROUP=1',
  'HISTORICAL_GROUP_3_EXCLUDED=true',
  'POST_MERGE_LOCAL_EXECUTOR_IMPLEMENTATION_HANDOFF=true',
  'COLLAPSE_EXECUTION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'EXECUTOR_RPC_EXECUTION_AUTHORITY=false',
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false',
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false',
  'SCHEDULER_RESTORATION_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_MAO_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false',
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'KEEP_WINNER_AND_COLLAPSE',
  'MERGE_LATEST_OBSERVATION_THEN_COLLAPSE',
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
  'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN',
  'COLLAPSE_DELETE_VERIFIED',
  'REOS.Database.deletePhysicalRowExact',
  'No executor source may be added in this increment.',
  'county scheduler remains frozen'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Authorization contract'
  );
});

[
  'EXPECTED_DIRECT_KEEP_GROUPS = 14',
  'EXPECTED_OBSERVATION_MERGE_GROUPS = 6',
  'CONFLICT_BLOCKED_GROUP = 1',
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7',
  'var planFingerprint =',
  'sha256Hex_(',
  'planFingerprintSha256:'
].forEach(marker => {
  requireText(
    winner,
    marker,
    'Current winner authority'
  );
});

requireText(
  preflight,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'Current preflight blocker'
);

requireText(
  preflight,
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce',
  'Current preflight winner fingerprint'
);

assert.strictEqual(
  preflight.includes(
    'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED'
  ),
  false,
  'Retired lease-compatibility blocker unexpectedly returned.'
);

requireText(
  executorValidator,
  'Executor implementation must not exist during design certification.',
  'Historical executor validator'
);

requireText(
  maintenanceLifecycle,
  'Collapse executor must remain absent.',
  'Historical maintenance lifecycle'
);

requireText(
  prerequisiteLifecycle,
  'Collapse executor must remain absent.',
  'Historical prerequisite lifecycle'
);

requireText(
  prerequisiteLifecycle,
  'EXECUTOR_IMPLEMENTATION_AUTHORIZED=false',
  'Current prerequisite lifecycle'
);

[
  EXECUTOR_VALIDATOR,
  MAINT_LIFECYCLE,
  PREREQ_LIFECYCLE
].forEach(path => {
  requireText(
    workflow,
    'run: node ' + path,
    'Current historical guard execution'
  );
});

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Authorization validator must appear exactly twice in workflow.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Authorization validator syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Authorization validator execution registration'
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
  'Authorization increment scope must remain exactly three files.'
);

assert.strictEqual(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Local authorization candidate must not contain staged changes.'
);

[
  doc,
  self
].forEach((text, textIndex) => {
  text
    .split('\n')
    .forEach((line, lineIndex) => {
      assert.ok(
        !/[ \t]+$/.test(line),
        'Trailing whitespace in ' +
          (textIndex === 0 ? DOC : SELF) +
          ' line ' +
          (lineIndex + 1)
      );
    });
});

console.log(
  'PASS: certified main authority remains the exact authorization base.'
);

console.log(
  'PASS: historical executor, maintenance and prerequisite safety artifacts remain byte-exact.'
);

console.log(
  'PASS: executor source remains absent and the certified preflight blocker remains present.'
);

console.log(
  'PASS: production prerequisite readiness is recorded only as source-implementation handoff evidence.'
);

console.log(
  'PASS: implementation handoff is limited to direct-keep groups 2 and 4 through 16.'
);

console.log(
  'PASS: Groups 17 through 22 remain outside implementation authority.'
);

console.log(
  'PASS: historical implementation-absent guards remain active during this design-only increment.'
);

console.log(
  'PASS: future blocker retirement, deployment and production execution remain separate gates.'
);

console.log(
  'authorization_doc_sha256=' +
    sha256File(DOC)
);

console.log(
  'authorization_validator_sha256=' +
    sha256File(SELF)
);

console.log(
  'EXECUTOR_IMPLEMENTATION_AUTHORIZATION_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'DIRECT_KEEP_EXECUTOR_IMPLEMENTATION_HANDOFF_DEFINED=true'
);

console.log(
  'HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true'
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
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'SCHEDULER_RESTORATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
