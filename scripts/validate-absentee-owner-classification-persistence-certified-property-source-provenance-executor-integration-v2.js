#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const BASE =
  '3f5c9fcc11861efd3f6f00c9b46c2d98f93025b9';

const PRE_CORRECTION_HEAD =
  '7d3e5bbac36d2ce44c1860ee393e9ee488d26ad3';

const workflow =
  '.github/workflows/county-collapse-offline.yml';

const runtime =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js';

const staticValidator =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-v2.js';

const behaviorValidator =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-behavior-v2.js';

const integrationValidator =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-integration-v2.js';

const countyValidator =
  'scripts/validate-county-runtime-integration.js';

const freezeValidator =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-v2-implementation-freeze-v1.js';

const expectedImplementationFiles = [
  workflow,
  runtime,
  staticValidator,
  behaviorValidator,
  integrationValidator,
  countyValidator
].sort();

const expectedCorrectionFiles = [
  workflow,
  runtime,
  behaviorValidator,
  integrationValidator
].sort();

function run(command, args) {
  return cp.spawnSync(
    command,
    args,
    {
      cwd: ROOT,
      encoding: 'utf8'
    }
  );
}

function lines(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean);
}

const status = run(
  'git',
  [
    'status',
    '--porcelain=v1',
    '--untracked-files=all'
  ]
);

assert.equal(
  status.status,
  0,
  'unable to inspect implementation validator repository state'
);

const head = run(
  'git',
  [
    'rev-parse',
    'HEAD'
  ]
);

assert.equal(
  head.status,
  0,
  'unable to resolve current repository HEAD'
);

const currentHead =
  head.stdout.trim();

const observed =
  lines(status.stdout)
    .map(line => line.slice(3))
    .sort();

if (observed.length === 0) {
  const implementationDiff = run(
    'git',
    [
      'diff',
      '--name-only',
      BASE,
      currentHead,
      '--',
      ...expectedImplementationFiles
    ]
  );

  assert.equal(
    implementationDiff.status,
    0,
    'unable to inspect committed implementation boundary'
  );

  const committedImplementationFiles =
    lines(
      implementationDiff.stdout
    ).sort();

  assert.deepEqual(
    committedImplementationFiles,
    expectedImplementationFiles,
    'clean committed/CI checkout must retain the exact six-file implementation delta from the certified base'
  );

  console.log(
    'ABSENTEE_OWNER_V2_EXECUTOR_INTEGRATION_MODE=CLEAN_COMMITTED_OR_CI'
  );
} else if (
  currentHead === BASE
) {
  assert.deepEqual(
    observed,
    expectedImplementationFiles,
    'original implementation source-edit scope must remain exactly six files'
  );

  console.log(
    'ABSENTEE_OWNER_V2_EXECUTOR_INTEGRATION_MODE=ORIGINAL_SIX_FILE_SOURCE_EDIT'
  );
} else if (
  currentHead === PRE_CORRECTION_HEAD
) {
  assert.deepEqual(
    observed,
    expectedCorrectionFiles,
    'PR313 correction source-edit scope must remain exactly four authorized files'
  );

  console.log(
    'ABSENTEE_OWNER_V2_EXECUTOR_INTEGRATION_MODE=PR313_FOUR_FILE_CORRECTION'
  );
} else {
  assert.fail(
    'dirty implementation validation is only authorized at the certified base or the pinned PR313 pre-correction head'
  );
}

[
  runtime,
  staticValidator,
  behaviorValidator,
  integrationValidator
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    `implementation file missing: ${file}`
  );
});

const workflowText =
  fs.readFileSync(
    path.join(ROOT, workflow),
    'utf8'
  );

const workflowMarkers = [
  'Check absentee-owner certified property-source provenance executor v2 syntax',
  'Validate absentee-owner certified property-source provenance executor v2 static',
  'Validate absentee-owner certified property-source provenance executor v2 behavior',
  'Validate absentee-owner certified property-source provenance executor v2 integration',
  'Validate absentee-owner certified property-source provenance executor v2 successor immutability'
];

workflowMarkers.forEach(marker => {
  assert.equal(
    workflowText.split(marker).length - 1,
    1,
    `workflow marker must occur exactly once: ${marker}`
  );
});

assert.equal(
  workflowText
    .split(
      'Validate absentee-owner certified property-source provenance executor v2 implementation freeze v1'
    )
    .length - 1,
  0,
  'obsolete implementation-freeze execution step must be retired after implementation'
);

const workflowRunLines =
  workflowText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line =>
      line.startsWith('run: ')
    );

[
  `node --check ${runtime}`,
  `node ${staticValidator}`,
  `node ${behaviorValidator}`,
  `node ${integrationValidator}`,
  `node ${staticValidator} --successor-immutability`
].forEach(command => {
  assert.equal(
    workflowRunLines.filter(
      line =>
        line === `run: ${command}`
    ).length,
    1,
    `workflow command must occur exactly once as an exact run line: ${command}`
  );
});

assert.equal(
  workflowRunLines.filter(
    line =>
      line ===
      `run: node ${freezeValidator}`
  ).length,
  0,
  'obsolete implementation-freeze validator must not execute as an active workflow step'
);

const countyText =
  fs.readFileSync(
    path.join(ROOT, countyValidator),
    'utf8'
  );

assert.equal(
  countyText
    .split(
      'const ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXECUTOR_V2_PRODUCTION_FILES'
    )
    .length - 1,
  1,
  'county runtime validator must declare exactly one V2 executor inventory'
);

assert.ok(
  countyText.includes(runtime),
  'county runtime validator must register exact executor runtime'
);

const immutable = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js',
  'build/apps-script-brand/Database.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js'
];

immutable.forEach(file => {
  const baseBlob = run(
    'git',
    [
      'rev-parse',
      `${BASE}:${file}`
    ]
  );

  const currentBlob = run(
    'git',
    [
      'hash-object',
      file
    ]
  );

  assert.equal(
    baseBlob.status,
    0,
    `cannot resolve base dependency: ${file}`
  );

  assert.equal(
    currentBlob.status,
    0,
    `cannot hash current dependency: ${file}`
  );

  assert.equal(
    currentBlob.stdout.trim(),
    baseBlob.stdout.trim(),
    `certified dependency changed: ${file}`
  );
});

const countyRun =
  run(
    'node',
    [
      countyValidator
    ]
  );

if (countyRun.status !== 0) {
  process.stderr.write(
    countyRun.stdout || ''
  );
  process.stderr.write(
    countyRun.stderr || ''
  );
}

assert.equal(
  countyRun.status,
  0,
  'county runtime integration validator failed with the executor implementation'
);

console.log(
  'ABSENTEE_OWNER_V2_EXECUTOR_INTEGRATION_VALIDATION_PASS=true'
);
