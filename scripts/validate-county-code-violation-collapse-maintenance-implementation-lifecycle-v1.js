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
  'd5f988380825ad5b670a075d140f424719e89a1e';

const MODULE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const HARNESS =
  'scripts/validate-county-code-violation-collapse-maintenance-gate-v1.js';

const SELF =
  'scripts/validate-county-code-violation-collapse-maintenance-implementation-lifecycle-v1.js';

const HIST_MAINT_DOC =
  'docs/county-code-violation-collapse-maintenance-quiescence-contract-v1.md';

const HIST_MAINT_VAL =
  'scripts/validate-county-code-violation-collapse-maintenance-quiescence-contract-v1.js';

const V2_DOC =
  'docs/county-code-violation-collapse-execution-boundary-v2.md';

const V2_VAL =
  'scripts/validate-county-code-violation-collapse-execution-boundary-v2.js';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const LEASE_COMPAT_VALIDATOR =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-v1.js';

const LEASE_COMPAT_HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-authority-compatibility-runtime-v1.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const RUNTIME_PREREQUISITE_MODULE =
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js';

const RUNTIME_PREREQUISITE_HARNESS =
  'scripts/validate-county-collapse-runtime-prerequisite-certification-v1.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const CURRENT_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const CURRENT_FINGERPRINT =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const EXPECTED_HIST_MAINT_DOC_SHA =
  '7d324945b28e9629725ebee4a0540d00a86a046a020bdbb53e377a0e82f7429b';

const EXPECTED_HIST_MAINT_VAL_SHA =
  '73d6c6cc977b72088a6d3ce370a686da14b08134145713a7799d760edf3e2256';

const EXPECTED_V2_DOC_SHA =
  '0bafebe5173d0d0f1be9b2634d244b60e8bfabdf4931bf16bd46bde7958754ab';

const EXPECTED_V2_VAL_SHA =
  'ec52d341151299ff71ad7a333a2b6b2fc1ecacd18ed06caf416ba196fb04dd5b';

const EXPECTED_LEASE_SHA =
  'f4e02ba1c8aef87075a87437673691b02d8a8587be2dd51280c9708b92954fdb';

const EXPECTED_LEASE_COMPAT_VALIDATOR_SHA =
  'e7ed7d53f8f8a01836c31e669d847f36a32870c4cddcfc3305f780b7ba95d30b';

const EXPECTED_LEASE_COMPAT_HARNESS_SHA =
  '4a8e18fc495869fd8bd47a66f89c3989720f162d3cbde07ad098ddb2029d938d';

const EXPECTED_PREFLIGHT_SHA =
  'f5c6181b9e5de72cb9ab1c3479940b426576778826d02c474331419b485b9bc8';

const EXPECTED_MODULE_SHA =
  '051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f';

const EXPECTED_HARNESS_SHA =
  'c7ddcb9ddf9976650eb6efdd15645dd6c944682a65209c2c908af9ab33d4a10a';

function sha256File(path) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(path)
    )
    .digest('hex');
}

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

  assert.strictEqual(
    result.status,
    0,
    'Node validation failed: ' +
      path
  );
}

console.log(
  '=== COLLAPSE MAINTENANCE IMPLEMENTATION LIFECYCLE V1 ==='
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
  HIST_MAINT_DOC,
  HIST_MAINT_VAL,
  V2_DOC,
  V2_VAL,
  LEASE,
  LEASE_COMPAT_VALIDATOR,
  LEASE_COMPAT_HARNESS,
  PREFLIGHT,
  RUNTIME_PREREQUISITE_MODULE,
  RUNTIME_PREREQUISITE_HARNESS,
  INTEGRATION,
  WORKFLOW
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required maintenance lifecycle artifact missing: ' +
      path
  );
});

assert.strictEqual(
  sha256File(HIST_MAINT_DOC),
  EXPECTED_HIST_MAINT_DOC_SHA,
  'Historical maintenance design document changed.'
);

assert.strictEqual(
  sha256File(HIST_MAINT_VAL),
  EXPECTED_HIST_MAINT_VAL_SHA,
  'Historical maintenance design validator changed.'
);

assert.strictEqual(
  sha256File(V2_DOC),
  EXPECTED_V2_DOC_SHA,
  'V2 execution-boundary design changed.'
);

assert.strictEqual(
  sha256File(V2_VAL),
  EXPECTED_V2_VAL_SHA,
  'V2 execution-boundary validator changed.'
);

assert.strictEqual(
  sha256File(LEASE),
  EXPECTED_LEASE_SHA,
  'Mutation-exclusion lease changed during maintenance-gate implementation.'
);

assert.strictEqual(
  sha256File(LEASE_COMPAT_VALIDATOR),
  EXPECTED_LEASE_COMPAT_VALIDATOR_SHA,
  'Completed lease-compatibility validator changed.'
);

assert.strictEqual(
  sha256File(LEASE_COMPAT_HARNESS),
  EXPECTED_LEASE_COMPAT_HARNESS_SHA,
  'Completed lease-compatibility runtime harness changed.'
);

assert.strictEqual(
  sha256File(PREFLIGHT),
  EXPECTED_PREFLIGHT_SHA,
  'Collapse execution preflight changed during maintenance-gate implementation.'
);

assert.strictEqual(
  sha256File(MODULE),
  EXPECTED_MODULE_SHA,
  'Certified maintenance-gate runtime changed.'
);

assert.strictEqual(
  sha256File(HARNESS),
  EXPECTED_HARNESS_SHA,
  'Certified maintenance-gate harness changed.'
);

[
  HIST_MAINT_DOC,
  HIST_MAINT_VAL,
  V2_DOC,
  V2_VAL,
  LEASE,
  LEASE_COMPAT_VALIDATOR,
  LEASE_COMPAT_HARNESS,
  PREFLIGHT
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
    'Historical/safety artifact changed: ' +
      path
  );
});

assert.ok(
  !fs.existsSync(
    EXECUTOR
  ),
  'Collapse executor must remain absent.'
);

const moduleSource =
  fs.readFileSync(
    MODULE,
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

const integration =
  fs.readFileSync(
    INTEGRATION,
    'utf8'
  );

[
  'REOS.CountyCodeViolationCollapseMaintenanceGate',
  CURRENT_AUTHORITY,
  CURRENT_FINGERPRINT,
  'REOS.CountyMutationExclusionLease',
  'openExclusive',
  'assertOwnerReady',
  'assertWriterAllowed',
  'CURRENT',
  'DURABLE_STATE_OWNER',
  'collapseExecutionAuthorityGranted',
  'false'
].forEach(marker => {
  requireText(
    moduleSource,
    marker,
    'Maintenance runtime'
  );
});

assert.strictEqual(
  moduleSource.includes(
    'PropertiesService'
  ),
  false,
  'Maintenance facade must not create an independent durable state store.'
);

assert.strictEqual(
  /function\s+reosCountyCodeViolationCollapseMaintenance/
    .test(
      moduleSource
    ),
  false,
  'Maintenance RPC is prohibited.'
);

[
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED'
].forEach(marker => {
  requireText(
    preflight,
    marker,
    'Preserved execution blocker'
  );
});

assert.strictEqual(
  workflow.split(HIST_MAINT_VAL).length - 1,
  1,
  'Historical maintenance validator must remain syntax-only in CI.'
);

assert.strictEqual(
  workflow.split(V2_VAL).length - 1,
  1,
  'V2 design validator must remain syntax-only after implementation.'
);

assert.strictEqual(
  workflow.split(LEASE_COMPAT_VALIDATOR).length - 1,
  1,
  'Completed lease-compatibility validator must remain syntax-only after maintenance implementation.'
);

assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Maintenance implementation lifecycle must be syntax-checked and executed exactly once.'
);

requireText(
  workflow,
  'node --check ' + MODULE,
  'Maintenance module syntax registration'
);

requireText(
  workflow,
  'node --check ' + HARNESS,
  'Maintenance harness syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Maintenance lifecycle execution registration'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' +
    HIST_MAINT_VAL
  ),
  false,
  'Historical implementation-absent validator must not execute after implementation.'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' +
    V2_VAL
  ),
  false,
  'V2 implementation-absent design validator must not execute after implementation.'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' +
    LEASE_COMPAT_VALIDATOR
  ),
  false,
  'Completed lease-compatibility validator must not execute after maintenance implementation.'
);

[
  'CountyCodeViolationCollapseMaintenanceGate.js',
  'validate-county-code-violation-collapse-maintenance-gate-v1.js',
  'expectedCodeViolationCollapseMaintenanceGateFiles',
  'CountyCollapseRuntimePrerequisiteCertification.js',
  'validate-county-collapse-runtime-prerequisite-certification-v1.js',
  'expectedCountyCollapseRuntimePrerequisiteFiles',
  'expected reconciled production inventory must contain 136 files'
].forEach(marker => {
  requireText(
    integration,
    marker,
    'County runtime integration'
  );
});

runNode(
  LEASE_COMPAT_HARNESS
);

runNode(
  HARNESS
);

console.log(
  'PASS: historical maintenance and v2 design evidence remains byte-exact.'
);

console.log(
  'PASS: completed lease-compatibility validator and 40-case runtime harness remain byte-exact.'
);

console.log(
  'PASS: maintenance facade composes the certified CURRENT mutation-exclusion lease.'
);

console.log(
  'PASS: no independent maintenance state store or public maintenance RPC exists.'
);

console.log(
  'PASS: both collapse execution blockers remain intact.'
);

console.log(
  'PASS: bounded runtime-prerequisite operator surface is additive and authority-free.'
);

console.log(
  'PASS: collapse executor remains absent.'
);

console.log(
  'COLLAPSE_MAINTENANCE_IMPLEMENTATION_LIFECYCLE_PASSED=true'
);

console.log(
  'COLLAPSE_EXECUTION_READY=false'
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
