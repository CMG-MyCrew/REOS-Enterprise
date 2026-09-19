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
  '9b0607b923d6f191d0785e2575abe8c831d29c05';

const DOC =
  'docs/county-code-violation-collapse-executor-implementation-authorization-v2.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-implementation-authorization-v2.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const AUTH_V1_DOC =
  'docs/county-code-violation-collapse-executor-implementation-authorization-v1.md';

const AUTH_V1_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-implementation-authorization-v1.js';

const REPEATABILITY_CONTRACT =
  'docs/county-code-violation-collapse-postdelete-repeatability-contract-v1.md';

const REPEATABILITY_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-implementation-lifecycle-v1.js';

const REPEATABILITY_RUNTIME =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js';

const HANDOFF_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-maintenance-handoff-v1.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const DIRECT_KEEP_AUTHORITY =
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const PREFLIGHT_V2 =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const HIST_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const EXECUTOR_CONTRACT =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const EXECUTOR_CONTRACT_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-contract-v1.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const MAINT_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-maintenance-implementation-lifecycle-v1.js';

const PREREQ_LIFECYCLE =
  'scripts/validate-county-collapse-runtime-prerequisite-implementation-lifecycle-v1.js';

const OBS_STORE =
  'build/apps-script-brand/CountyCollapseObservationPreservationStore.js';

const RUNTIME_PREREQ =
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js';

const RECOVERY =
  'build/apps-script-brand/CountyCollapseOperationIntentOrphanBindingRecovery.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const MAINT_OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const EXPECTED_DOC_SHA =
  '6f79a4faa25f1d4770e94df0e994b5ffbad8f372c7f01b2ffa2cb9d47b63d6ff';

const EXPECTED_PROTECTED =
  new Map([
    [
      AUTH_V1_DOC,
      'bbfeea240e162d7e4286da0aa104a5bb2b1b1f89cd83860f62daf4b5ec5f582b'
    ],
    [
      AUTH_V1_VALIDATOR,
      '44034c9784fce28f5203169964727b808acd59b048472adac277198c55d1ac0b'
    ],
    [
      REPEATABILITY_CONTRACT,
      '1e8ba1fd8363d16265d4b762309011d2036f1cd6af2719d99f38133334d320ab'
    ],
    [
      REPEATABILITY_LIFECYCLE,
      '76aeb127e6286d0fc9055a1690686cd6981e4c15b4bf1d9b36a29d517e21072c'
    ],
    [
      REPEATABILITY_RUNTIME,
      '073346c1492cffb232e76a39484fd921c9ee9231e7d8af56b870264a46cd1111'
    ],
    [
      HANDOFF_VALIDATOR,
      '789e00c572b739f4bdf0fbc3337c6b6d5d6cf52f4fc2d54f89acc7b6ccde1e8d'
    ],
    [
      INTENT_STORE,
      '037de0188ea10340015d7030cdc364731e460db326f156cc8bf7725976bdbbce'
    ],
    [
      DIRECT_KEEP_AUTHORITY,
      'c1b9c82d2183dddba22627ba55aa36be79c16c8fbe29bebfd9eada1bbf145fca'
    ],
    [
      RESIDUAL,
      '3e66b2ac5d2bb7b9b25d5ed9121a92899c2c5cff319025931152b693bd7cc82d'
    ],
    [
      PREFLIGHT_V2,
      '9712493ce97ff32f3fe8ed28f08bb46f2855b68f83063d2b9b12ea75473ffc2a'
    ],
    [
      HIST_PREFLIGHT,
      'baa7e61dd573d79ee616b13685048330f65da4f23d9efed9f00644cffc0bde53'
    ],
    [
      EXECUTOR_CONTRACT,
      '54f4b5914961cec0a43e5a0a3a71028e4af84954049e0484e35ddef80a515317'
    ],
    [
      EXECUTOR_CONTRACT_VALIDATOR,
      'c4bd5623e9746563fb56a992e7d870dce795756559925f4b3ad23994e4c452b0'
    ],
    [
      MAINT_GATE,
      '051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f'
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

function requireWhitespaceNormalizedText(
  text,
  marker,
  label
) {
  const normalizedText =
    String(text)
      .replace(/\s+/g, ' ')
      .trim();

  const normalizedMarker =
    String(marker)
      .replace(/\s+/g, ' ')
      .trim();

  assert.ok(
    normalizedText.includes(
      normalizedMarker
    ),
    label + ' missing after whitespace normalization: ' +
      marker
  );
}

console.log(
  '=== EXECUTOR SUCCESSOR IMPLEMENTATION AUTHORIZATION V2 ==='
);

assert.strictEqual(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Successor authorization branch must descend from certified PR #207 main.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  ...EXPECTED_PROTECTED.keys()
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required successor authorization artifact missing: ' +
      path
  );
});

assert.strictEqual(
  fs.existsSync(EXECUTOR),
  false,
  'Executor source must remain absent in authorization v2.'
);

assert.strictEqual(
  fs.existsSync(MAINT_OPERATOR),
  false,
  'Maintenance operator must remain absent in authorization v2.'
);

assert.strictEqual(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Successor authorization document changed.'
);

EXPECTED_PROTECTED.forEach(
  (expected, path) => {
    assert.strictEqual(
      sha256File(path),
      expected,
      'Protected historical/successor artifact changed: ' +
        path
    );
  }
);

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

const historicalPreflight =
  fs.readFileSync(
    HIST_PREFLIGHT,
    'utf8'
  );

const successorPreflight =
  fs.readFileSync(
    PREFLIGHT_V2,
    'utf8'
  );

const intentStore =
  fs.readFileSync(
    INTENT_STORE,
    'utf8'
  );

[
  'Status: DESIGN-ONLY SUCCESSOR IMPLEMENTATION AUTHORIZATION HANDOFF.',
  'EXECUTOR_SUCCESSOR_IMPLEMENTATION_AUTHORIZATION_VERSION=2',
  'SOURCE_AUTHORITY_SHA=' + BASE,
  'SOURCE_AUTHORITY_TREE=0eefe2801c996f366a95c18550a5a81dde211710',
  'SOURCE_POST_MERGE_CI_RUN=35465872479',
  'SOURCE_POST_MERGE_CI_JOB=105957977946',
  'REPEATABILITY_RUNTIME_IMPLEMENTATION_MERGE_CERTIFIED=true',
  'HISTORICAL_AUTHORIZATION_V1_PRESERVED=true',
  'AUTHORIZED_EXECUTOR_SCOPE=DIRECT_KEEP_ONLY',
  'DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16',
  'OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22',
  'CONFLICT_BLOCKED_GROUP=1',
  'HISTORICAL_GROUP_3_EXCLUDED=true',
  'SUCCESSOR_INTENT_ENUMERATION_REQUIRED=true',
  'SUCCESSOR_RESIDUAL_EVIDENCE_REQUIRED=true',
  'SUCCESSOR_PREFLIGHT_V2_REQUIRED=true',
  'POST_MERGE_LOCAL_EXECUTOR_IMPLEMENTATION_HANDOFF=true',
  'POST_MERGE_LOCAL_MAINTENANCE_OPERATOR_IMPLEMENTATION_HANDOFF=true',
  'HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true',
  'EXECUTOR_IMPLEMENTATION_AUTHORITY=false',
  'MAINTENANCE_OPERATOR_IMPLEMENTATION_AUTHORITY=false',
  'COLLAPSE_EXECUTION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'EXECUTOR_RPC_EXECUTION_AUTHORITY=false',
  'MAINTENANCE_RPC_EXECUTION_AUTHORITY=false',
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false',
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false',
  'SCHEDULER_RESTORATION_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_MAO_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false',
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'KEEP_WINNER_AND_COLLAPSE'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Successor authorization contract'
  );
});

requireWhitespaceNormalizedText(
  doc,
  'No executor source or maintenance-operator source may be added in this increment.',
  'Successor authorization release boundary'
);

requireText(
  historicalPreflight,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'Historical preflight blocker'
);

requireText(
  successorPreflight,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'Successor preflight blocker'
);

requireText(
  successorPreflight,
  'collapseExecutionReady:',
  'Successor preflight readiness surface'
);

requireText(
  intentStore,
  'function listOperationIds()',
  'Successor intent enumeration'
);

requireText(
  intentStore,
  'listOperationIds:',
  'Successor intent public API'
);

/*
 * Historical authorization and handoff gates remain preserved,
 * syntax-only, and non-active.
 */
[
  AUTH_V1_VALIDATOR,
  HANDOFF_VALIDATOR,
  REPEATABILITY_LIFECYCLE,
  PREREQ_LIFECYCLE
].forEach(path => {
  assert.strictEqual(
    workflow.split(path).length - 1,
    1,
    'Completed historical/successor lifecycle must be syntax-only exactly once: ' +
      path
  );

  requireText(
    workflow,
    'node --check ' + path,
    'Syntax-only lifecycle registration'
  );

  assert.strictEqual(
    workflow.includes(
      'run: node ' + path
    ),
    false,
    'Completed lifecycle unexpectedly remains active: ' +
      path
  );
});

/*
 * V2 becomes the active successor implementation-handoff gate.
 */
assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'V2 authorization validator must be syntax-checked and active exactly once.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'V2 authorization syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'V2 authorization execution registration'
);

/*
 * Existing safety gates remain active during authorization v2.
 */
[
  EXECUTOR_CONTRACT_VALIDATOR,
  MAINT_LIFECYCLE,
  REPEATABILITY_RUNTIME
].forEach(path => {
  requireText(
    workflow,
    'run: node ' + path,
    'Required active safety validation'
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
  'Successor authorization v2 increment must remain exactly three files.'
);

assert.strictEqual(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Successor authorization candidate must remain unstaged.'
);

[
  doc,
  fs.readFileSync(SELF, 'utf8')
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
  'PASS: PR #207 successor main is the exact authorization-v2 base.'
);

console.log(
  'PASS: historical v1 authorization remains byte-exact and syntax-only.'
);

console.log(
  'PASS: completed repeatability implementation lifecycle remains byte-exact and syntax-only.'
);

console.log(
  'PASS: successor intent enumeration, direct-keep authority, residual evidence and preflight v2 remain byte-exact.'
);

console.log(
  'PASS: executor and maintenance operator remain absent.'
);

console.log(
  'PASS: certified executor blocker remains present.'
);

console.log(
  'PASS: future local implementation handoff remains limited to direct-keep groups 2 and 4 through 16.'
);

console.log(
  'PASS: Groups 17 through 22 remain outside executor implementation authority.'
);

console.log(
  'PASS: deployment, execution, blocker retirement and automatic offers remain separate future gates.'
);

console.log(
  'successor_authorization_doc_sha256=' +
    sha256File(DOC)
);

console.log(
  'successor_authorization_validator_sha256=' +
    sha256File(SELF)
);

console.log(
  'EXECUTOR_SUCCESSOR_IMPLEMENTATION_AUTHORIZATION_V2_VALIDATION_PASSED=true'
);

console.log(
  'DIRECT_KEEP_EXECUTOR_IMPLEMENTATION_HANDOFF_DEFINED=true'
);

console.log(
  'BOUNDED_MAINTENANCE_OPERATOR_IMPLEMENTATION_HANDOFF_DEFINED=true'
);

console.log(
  'HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true'
);

console.log(
  'EXECUTOR_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'MAINTENANCE_OPERATOR_IMPLEMENTATION_AUTHORIZED=false'
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
