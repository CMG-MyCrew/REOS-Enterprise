#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const cp =
  require('node:child_process');

const BASE =
  '047c82d57d9a51fbb38360f672b9857a91d5c189';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const RUNTIME =
  'scripts/validate-county-code-violation-collapse-executor-runtime-v1.js';

const SELF =
  'scripts/validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js';

const AUTH_V2 =
  'scripts/validate-county-code-violation-collapse-executor-implementation-authorization-v2.js';

const EXECUTOR_CONTRACT =
  'scripts/validate-county-code-violation-collapse-executor-contract-v1.js';

const HANDOFF =
  'scripts/validate-county-code-violation-collapse-executor-maintenance-handoff-v1.js';

const MAINT_LIFECYCLE =
  'scripts/validate-county-code-violation-collapse-maintenance-implementation-lifecycle-v1.js';

const PREREQ_LIFECYCLE =
  'scripts/validate-county-collapse-runtime-prerequisite-implementation-lifecycle-v1.js';

const REPEATABILITY_RUNTIME =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js';

const RETROFIT_LIFECYCLE =
  'scripts/validate-county-mutation-exclusion-lease-retrofit-validation-lifecycle-v1.js';

const RETROFIT_RUNTIME_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-v1.js';

const RETROFIT_COMPATIBILITY_RUNTIME =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-runtime-v1.js';

const RETROFIT_LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const RETROFIT_WRITERS = [
  {
    id: 'COUNTY_PRODUCTION_SCHEDULER',
    file: 'build/apps-script-brand/CountyProductionScheduler.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-production-scheduler-v1.js'
  },
  {
    id: 'COUNTY_CONNECTOR_LIVE_PERSISTENCE',
    file: 'build/apps-script-brand/CountyConnectorSDK.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-connector-live-persistence-v1.js'
  },
  {
    id: 'COUNTY_CHECKPOINT_RECOVERY',
    file: 'build/apps-script-brand/CountyCheckpointRecovery.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-checkpoint-recovery-v1.js'
  },
  {
    id: 'COUNTY_C1_SCHEMA_MIGRATION',
    file: 'build/apps-script-brand/CountyC1SchemaMigration.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-c1-schema-migration-v1.js'
  },
  {
    id: 'COUNTY_C1_INSERT_RECOVERY',
    file: 'build/apps-script-brand/CountyC1InsertRecovery.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-county-c1-insert-recovery-v1.js'
  },
  {
    id: 'CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL',
    file: 'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-blocked-storage-backfill-v1.js'
  },
  {
    id: 'CODE_VIOLATION_DURABLE_IDENTITY_BATCH1',
    file: 'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationBatch1Executor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-durable-identity-batch1-v1.js'
  },
  {
    id: 'CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN',
    file: 'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-durable-identity-multispan-v1.js'
  },
  {
    id: 'CODE_VIOLATION_DURABLE_IDENTITY_ROLLING',
    file: 'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-durable-identity-rolling-v1.js'
  },
  {
    id: 'CODE_VIOLATION_GATE1_RECOVERY',
    file: 'build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-gate1-recovery-v1.js'
  },
  {
    id: 'PAGE85_SOURCE_OBSERVATION_214_REPAIR',
    file: 'build/apps-script-brand/CountyPage85SourceObservation214Repair.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-page85-source-observation-214-repair-v1.js'
  },
  {
    id: 'PAGE86_DUPLICATE_SOURCE_REPAIR',
    file: 'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-page86-duplicate-source-repair-v1.js'
  },
  {
    id: 'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION',
    file: 'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js',
    harness: 'scripts/validate-county-mutation-exclusion-writer-code-violation-group3-zillow-restoration-v1.js'
  }
];

const OP_INTENT_CONTRACT =
  'scripts/validate-county-collapse-operation-intent-contract-v1.js';

const OP_INTENT_DOC =
  'docs/county-collapse-operation-intent-contract-v1.md';

const OP_INTENT_STORE_VALIDATOR =
  'scripts/validate-county-collapse-operation-intent-store-v1.js';

const DIRECT_KEEP =
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const PREFLIGHT_V2 =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const HIST_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const INTENT_STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const PROTECTED = [
  AUTH_V2,
  EXECUTOR_CONTRACT,
  HANDOFF,
  MAINT_LIFECYCLE,
  PREREQ_LIFECYCLE,
  REPEATABILITY_RUNTIME,
  OP_INTENT_CONTRACT,
  OP_INTENT_DOC,
  OP_INTENT_STORE_VALIDATOR,
  DIRECT_KEEP,
  RESIDUAL,
  PREFLIGHT_V2,
  HIST_PREFLIGHT,
  MAINT_GATE,
  INTENT_STORE,
  DATABASE
];

const EXPECTED_SCOPE = [
  WORKFLOW,
  INTEGRATION,
  OPERATOR,
  EXECUTOR,
  RUNTIME,
  SELF
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

  assert.equal(
    result.status,
    0,
    'git ' +
      args.join(' ') +
      ' failed\n' +
      String(
        result.stderr || ''
      )
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

function runNode(path) {
  const result =
    cp.spawnSync(
      process.execPath,
      [
        path
      ],
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

  assert.equal(
    result.status,
    0,
    'Node validation failed: ' +
      path
  );
}

console.log(
  '=== DIRECT-KEEP EXECUTOR IMPLEMENTATION LIFECYCLE V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Implementation branch must descend from certified authorization-v2 main.'
);

[
  WORKFLOW,
  INTEGRATION,
  OPERATOR,
  EXECUTOR,
  RUNTIME,
  SELF,
  ...PROTECTED
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required implementation lifecycle artifact missing: ' +
      path
  );
});

PROTECTED.forEach(path => {
  assert.equal(
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]).status,
    0,
    'Protected certified artifact changed: ' +
      path
  );
});

[
  RETROFIT_LIFECYCLE,
  RETROFIT_RUNTIME_HARNESS,
  RETROFIT_COMPATIBILITY_RUNTIME,
  RETROFIT_LEASE
]
  .concat(
    RETROFIT_WRITERS.map(
      entry => entry.file
    )
  )
  .concat(
    RETROFIT_WRITERS.map(
      entry => entry.harness
    )
  )
  .forEach(path => {
    assert.ok(
      fs.existsSync(path),
      'Inherited retrofit safety artifact missing: ' +
        path
    );

    assert.equal(
      git([
        'diff',
        '--quiet',
        BASE,
        '--',
        path
      ]).status,
      0,
      'Inherited retrofit safety artifact changed: ' +
        path
    );
  });

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

const operator =
  fs.readFileSync(
    OPERATOR,
    'utf8'
  );

const executor =
  fs.readFileSync(
    EXECUTOR,
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

function counts(path) {
  return [
    workflow
      .split(
        'node --check ' +
        path
      )
      .length - 1,
    workflow
      .split(
        'run: node ' +
        path
      )
      .length - 1
  ];
}

[
  AUTH_V2,
  EXECUTOR_CONTRACT,
  HANDOFF,
  MAINT_LIFECYCLE,
  PREREQ_LIFECYCLE,
  RETROFIT_LIFECYCLE,
  OP_INTENT_CONTRACT
].forEach(path => {
  assert.deepEqual(
    counts(path),
    [
      1,
      0
    ],
    'Historical implementation-absence validator must be syntax-only: ' +
      path
  );
});

assert.deepEqual(
  counts(OP_INTENT_STORE_VALIDATOR),
  [
    1,
    1
  ],
  'Operation-intent store validator must remain syntax-checked and active.'
);

const operationIntentDoc =
  fs.readFileSync(
    OP_INTENT_DOC,
    'utf8'
  );

[
  'OPERATION_INTENT_CONTRACT_VERSION=1',
  'STORAGE_BACKEND=APPEND_ONLY_GOOGLE_SHEETS_JOURNAL',
  'STORAGE_WORKBOOK=DEDICATED_SEPARATE_WORKBOOK',
  'APPEND_ONLY_STORAGE=true',
  'PREPARED_READBACK_REQUIRED=true',
  'DELETE_BARRIER_EVENT=DELETE_INVOCATION_STARTED',
  'RECOVERY_MODE=READ_ONLY',
  'AUTOMATIC_RETRY=false',
  'RUNTIME_PURGE_AUTHORITY=false',
  'RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PRODUCTION_PHYSICAL_DELETE_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false',
  'INTENT_PREPARED',
  'DELETE_INVOCATION_STARTED',
  'POSTDELETE_VERIFIED',
  'COLLAPSE_DELETE_VERIFIED',
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
  'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN'
].forEach(marker => {
  requireText(
    operationIntentDoc,
    marker,
    'Inherited operation-intent contract'
  );
});

[
  OP_INTENT_DOC,
  OP_INTENT_CONTRACT
].forEach(path => {
  fs.readFileSync(
    path,
    'utf8'
  )
    .split('\n')
    .forEach((line, index) => {
      assert.equal(
        /[ \t]+$/.test(line),
        false,
        'Trailing whitespace in inherited operation-intent artifact: ' +
          path +
          ':' +
          String(index + 1)
      );
    });
});

console.log(
  'OPERATION_INTENT_CONTRACT_SAFETY_INHERITED=true'
);

assert.deepEqual(
  counts(REPEATABILITY_RUNTIME),
  [
    1,
    1
  ],
  'Repeatability runtime must remain active.'
);

assert.deepEqual(
  counts(RUNTIME),
  [
    1,
    1
  ],
  'Executor runtime validator must be syntax-checked and active.'
);

assert.deepEqual(
  counts(SELF),
  [
    1,
    1
  ],
  'Executor implementation lifecycle must be syntax-checked and active.'
);

[
  'REOS.CountyCodeViolationCollapseMaintenanceOperator',
  'reosCountyCodeViolationCollapseMaintenanceOpen',
  'reosCountyCodeViolationCollapseMaintenanceStatus',
  'reosCountyCodeViolationCollapseMaintenanceClose'
].forEach(marker => {
  requireText(
    operator,
    marker,
    'Maintenance operator'
  );
});

assert.equal(
  operator.includes(
    'PropertiesService'
  ),
  false,
  'Maintenance operator must not own durable capability state.'
);

assert.equal(
  operator.includes(
    'CountyCodeViolationCollapseExecutor'
  ),
  false,
  'Maintenance operator must not invoke executor.'
);

[
  'REOS.CountyCodeViolationCollapseExecutor',
  'CONFIRM_DIRECT_KEEP_COLLAPSE_EXECUTION_V1',
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'CountyCodeViolationCollapseExecutionPreflightV2',
  'CountyCodeViolationCollapseResidualEvidence',
  'CountyIdentityReferenceAudit',
  'CountyCollapseOperationIntentStore',
  'CountyCodeViolationCollapseMaintenanceGate',
  'withScriptLockContext',
  'DELETE_INVOCATION_STARTED',
  'POSTDELETE_VERIFIED',
  'COLLAPSE_DELETE_VERIFIED',
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
  'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN'
].forEach(marker => {
  requireText(
    executor,
    marker,
    'Executor runtime'
  );
});

assert.equal(
  executor
    .split(
      '.deletePhysicalRowExact('
    )
    .length - 1,
  1,
  'Executor must contain exactly one physical-delete invocation site.'
);

assert.equal(
  executor.includes(
    '.close('
  ),
  false,
  'Executor must never automatically close maintenance capability.'
);

assert.equal(
  /function\s+reosCountyCodeViolationCollapseExecute/
    .test(executor),
  false,
  'Executor RPC source is not authorized in implementation v1.'
);

[
  "'confirmExecution'",
  "'groupNumber'",
  "'deleteDistressLeadId'",
  "'expectedWinnerDistressLeadId'",
  "'expectedPlanFingerprintSha256'",
  "'expectedAuthoritySha256'",
  "'maintenanceToken'",
  "'expectedMaintenanceLeaseId'",
  "'expectedMaintenanceGateId'"
].forEach(field => {
  requireText(
    executor,
    field,
    'Exact nine-field executor request'
  );
});

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

[
  'CountyCodeViolationCollapseMaintenanceOperator.js',
  'CountyCodeViolationCollapseExecutor.js',
  'validate-county-code-violation-collapse-executor-runtime-v1.js',
  'validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js',
  'expectedCodeViolationCollapseExecutorImplementationFiles',
  'expected reconciled production inventory must contain 142 files'
].forEach(marker => {
  requireText(
    integration,
    marker,
    'County runtime integration'
  );
});

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
  Array.from(
    effective
  ).sort(),
  EXPECTED_SCOPE,
  'Executor implementation increment must remain exactly six files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Implementation candidate must remain unstaged.'
);

/*
 * The historical mutation-exclusion retrofit lifecycle is preserved
 * byte-exact but becomes syntax-only once executor source is authorized.
 *
 * Its still-relevant runtime safety responsibilities are inherited here:
 * - compatibility runtime;
 * - exact protected-writer inventory;
 * - exact lease guard + writer ID on every retrofitted writer;
 * - every protected-writer harness;
 * - no generic lease RPC.
 */
[
  RETROFIT_RUNTIME_HARNESS,
  RETROFIT_COMPATIBILITY_RUNTIME
].forEach(path => {
  const syntax = cp.spawnSync(
    process.execPath,
    [
      '--check',
      path
    ],
    {
      encoding:
        'utf8'
    }
  );

  if (syntax.stdout) {
    process.stdout.write(
      syntax.stdout
    );
  }

  if (syntax.stderr) {
    process.stderr.write(
      syntax.stderr
    );
  }

  assert.equal(
    syntax.status,
    0,
    'Inherited retrofit harness syntax failed: ' +
      path
  );
});

runNode(
  RETROFIT_COMPATIBILITY_RUNTIME
);

const expectedRetrofitHarnesses =
  new Set(
    RETROFIT_WRITERS.map(
      entry => entry.harness
    )
  );

const discoveredRetrofitHarnesses =
  fs.readdirSync('scripts')
    .filter(name =>
      name.startsWith(
        'validate-county-mutation-exclusion-writer-'
      ) &&
      name.endsWith(
        '-v1.js'
      )
    )
    .map(name =>
      'scripts/' + name
    );

assert.deepEqual(
  discoveredRetrofitHarnesses
    .slice()
    .sort(),
  Array.from(
    expectedRetrofitHarnesses
  ).sort(),
  'Protected-writer retrofit harness inventory changed.'
);

RETROFIT_WRITERS.forEach(entry => {
  const source =
    fs.readFileSync(
      entry.file,
      'utf8'
    );

  requireText(
    source,
    'REOS.CountyMutationExclusionLease.assertWriterAllowed',
    'Inherited protected writer lease guard'
  );

  requireText(
    source,
    entry.id,
    'Inherited protected writer exact writer ID'
  );

  runNode(
    entry.harness
  );
});

const genericLeaseRpc =
  git([
    'grep',
    '-n',
    'function reosCountyMutationExclusionLease',
    '--',
    'build/apps-script-brand'
  ]);

assert.ok(
  genericLeaseRpc.status === 1 ||
  String(
    genericLeaseRpc.stdout || ''
  ).trim() === '',
  'Generic mutation-exclusion lease RPC unexpectedly exists.'
);

console.log(
  'RETROFIT_SAFETY_COVERAGE_INHERITED=true'
);

console.log(
  'RETROFIT_PROTECTED_WRITER_COUNT=' +
  RETROFIT_WRITERS.length
);

runNode(
  OP_INTENT_STORE_VALIDATOR
);

console.log(
  'OPERATION_INTENT_STORE_RUNTIME_INHERITED=true'
);

runNode(
  RUNTIME
);

console.log(
  'PASS: historical implementation-absence validators are preserved byte-exact and syntax-only.'
);

console.log(
  'PASS: bounded maintenance operator contains exactly the certified transport topology.'
);

console.log(
  'PASS: direct-keep executor has exactly one physical-delete call site and no automatic retry or maintenance close.'
);

console.log(
  'PASS: production successor preflight blocker remains byte-exact.'
);

console.log(
  'PASS: implementation scope is exactly six files.'
);

console.log(
  'DIRECT_KEEP_EXECUTOR_IMPLEMENTATION_LIFECYCLE_PASSED=true'
);

console.log(
  'EXECUTOR_IMPLEMENTATION_LOCAL_CANDIDATE_CERTIFIED=true'
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
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
