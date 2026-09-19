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
  '9d0fa6fef330f87ad2777a6d8547a4dc5bebff8c';

const DOC =
  'docs/county-collapse-runtime-prerequisite-certification-contract-v1.md';

const SELF =
  'scripts/validate-county-collapse-runtime-prerequisite-certification-contract-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const V2 =
  'docs/county-code-violation-collapse-execution-boundary-v2.md';

const EXECUTOR_CONTRACT =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

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

const INTENT_STORE_HARNESS =
  'scripts/validate-county-collapse-operation-intent-store-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const WINNER =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const FUTURE_GATE =
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const EXPECTED = [
  WORKFLOW,
  DOC,
  SELF
].sort();

const HASHES = new Map([
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
    INTENT_STORE_HARNESS,
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

function git(args) {
  const result =
    cp.spawnSync(
      'git',
      args,
      {
        encoding:
          'utf8'
      }
    );

  if (result.error) {
    throw result.error;
  }

  return result;
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
  '=== COUNTY COLLAPSE RUNTIME PREREQUISITE CERTIFICATION CONTRACT V1 ==='
);

assert.strictEqual(
  git([
    'merge-base',
    BASE,
    'HEAD'
  ]).stdout.trim(),
  BASE,
  'Certified prerequisite base is no longer an ancestry root.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  V2,
  EXECUTOR_CONTRACT,
  LEASE,
  LEASE_HARNESS,
  MAINTENANCE,
  MAINTENANCE_HARNESS,
  INTENT_STORE,
  INTENT_STORE_HARNESS,
  PREFLIGHT,
  WINNER
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required artifact missing: ' + path
  );
});

HASHES.forEach((expected, path) => {
  assert.strictEqual(
    sha256File(path),
    expected,
    'Certified prerequisite artifact changed: ' + path
  );
});

assert.ok(
  !fs.existsSync(FUTURE_GATE),
  'Runtime prerequisite implementation must remain absent during design phase.'
);

assert.ok(
  !fs.existsSync(EXECUTOR),
  'Collapse executor must remain absent during prerequisite design.'
);

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

[
  'RUNTIME_PREREQUISITE_CONTRACT_VERSION=1',
  'RUNTIME_PREREQUISITE_BASE_SHA=' + BASE,
  'FUTURE_MODULE=REOS.CountyCollapseRuntimePrerequisiteCertification',
  'FUTURE_STATUS_RPC=reosCountyCollapseRuntimePrerequisiteStatus',
  'FUTURE_PROVISION_RPC=reosCountyCollapseOperationIntentProvision',
  'OPERATION_INTENT_PROPERTY=REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID',
  'EVENT_SHEET=COUNTY_COLLAPSE_OPERATION_INTENTS',
  'CHUNK_SHEET=COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS',
  'EXACT_LOGICAL_SHEET_COUNT=2',
  'CALLER_SUPPLIED_WORKBOOK_ID=false',
  'CALLER_SUPPLIED_WORKBOOK_NAME=false',
  'PROVISIONING_REPLACEMENT_AUTHORITY=false',
  'EXISTING_VALID_BINDING_RERUN=READ_ONLY_IDEMPOTENT',
  'EXISTING_INVALID_BINDING=FAIL_CLOSED_NO_REPLACEMENT',
  'PROPERTY_WRITE_AFTER_SCHEMA_ACCESS_VERIFICATION=true',
  'WORKBOOK_MUST_DIFFER_FROM_COUNTY_DATA=true',
  'EXTRA_EDITORS_ALLOWED=false',
  'EXTRA_VIEWERS_ALLOWED=false',
  'STATUS_EXPOSES_RAW_LEASE_TOKEN=false',
  'STATUS_EXPOSES_RAW_WORKBOOK_ID=false',
  'LEASE_SAFE_TRANSITION_STATES=ABSENT,CLOSED,EXPIRED',
  'LEASE_UNSAFE_TRANSITION_STATES=OPEN,SETTLED,MALFORMED',
  'DEPLOYED_EXACT_SOURCE_CERTIFICATION_REQUIRED=true',
  'OFFLINE_40_CASE_LEASE_CERTIFICATION_REQUIRED=true',
  'INTENT_STORE_SCHEMA_READBACK_REQUIRED=true',
  'ACCESS_BINDING_CERTIFICATION_REQUIRED=true',
  'COMPATIBILITY_BLOCKER_RELEASE_SEPARATE_INCREMENT=true',
  'EXECUTOR_BLOCKER_RELEASE_SEPARATE_INCREMENT=true',
  'DIRECT_KEEP_EXECUTOR_ONLY_AFTER_PREREQUISITES=true',
  'OBSERVATION_MERGE_EXECUTABLE=false',
  'EXECUTOR_IMPLEMENTATION_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Prerequisite contract'
  );
});

[
  'Operation ID',
  'Event Sequence',
  'Event Type',
  'Event Timestamp UTC',
  'Operation Intent Contract Version',
  'Executor Implementation Version',
  'Group Number',
  'Winner Distress Lead ID',
  'Target Delete Distress Lead ID',
  'Payload SHA-256',
  'Payload UTF-8 Bytes',
  'Payload Chunk Count',
  'Previous Event SHA-256',
  'Event SHA-256',
  'Chunk Index',
  'Chunk UTF-8 Bytes',
  'Chunk SHA-256',
  'Chunk Data'
].forEach(header => {
  requireText(
    doc,
    header,
    'Certified journal schema'
  );
});

[
  '2,4,5,6,7,8,9,10,11,12,13,14,15,16',
  'Groups 17 through 22 remain non-executable',
  'Group 1 remains conflict-blocked',
  'Historical Group 3 remains excluded'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Executor sequencing boundary'
  );
});

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

[
  V2,
  EXECUTOR_CONTRACT,
  LEASE,
  LEASE_HARNESS,
  MAINTENANCE,
  MAINTENANCE_HARNESS,
  INTENT_STORE,
  INTENT_STORE_HARNESS,
  PREFLIGHT,
  WINNER
].forEach(path => {
  assert.strictEqual(
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]).status,
    0,
    'Protected prerequisite evidence changed: ' + path
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
  'Design validator requires no staged changes.'
);

const head =
  git([
    'rev-parse',
    'HEAD'
  ]).stdout.trim();

const authoringActual = [
  ...(
    git([
      'diff',
      '--name-only'
    ]).stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
  ),
  ...(
    git([
      'ls-files',
      '--others',
      '--exclude-standard'
    ]).stdout
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
  )
];

const authoringUnique =
  Array.from(
    new Set(authoringActual)
  ).sort();

if (authoringUnique.length > 0) {
  assert.strictEqual(
    head,
    BASE,
    'Uncommitted design authoring must remain pinned to the certified base.'
  );

  assert.deepStrictEqual(
    authoringUnique,
    EXPECTED,
    'Prerequisite design authoring scope must be exactly three files.'
  );

  console.log(
    'PASS: exact three-file uncommitted design authoring lifecycle detected.'
  );
} else {
  assert.notStrictEqual(
    head,
    BASE,
    'Clean lifecycle requires an integrated descendant of the certified base.'
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
    EXPECTED,
    'Clean integrated prerequisite-design scope must be exactly three files.'
  );

  console.log(
    'PASS: exact three-file clean integrated design lifecycle detected.'
  );
}

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Prerequisite design validator must be syntax-checked and executed exactly once.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Prerequisite design syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Prerequisite design execution registration'
);

console.log(
  'PASS: current lease, maintenance, intent-store, winner, preflight, v2, and executor-contract evidence remains byte-exact.'
);

console.log(
  'PASS: production gate permits only read-only status and one-time intent-workbook provisioning in a future implementation.'
);

console.log(
  'PASS: existing malformed bindings fail closed and cannot be replaced automatically.'
);

console.log(
  'PASS: both preflight blockers remain intact.'
);

console.log(
  'PASS: future executor remains direct-keep-only until preservation orchestration is separately certified.'
);

console.log(
  'RUNTIME_PREREQUISITE_CONTRACT_DESIGN_VALIDATION_PASSED=true'
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
