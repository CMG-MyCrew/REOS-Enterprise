#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const cp = require('node:child_process');

const BASE =
  'c94fa7205c3405d3327107facf75937c079e57db';

const DOC =
  'docs/county-code-violation-collapse-maintenance-quiescence-contract-v1.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-maintenance-quiescence-contract-v1.js';

const FUTURE_IMPL =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const FUTURE_EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const EXECUTOR_DOC =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const DB =
  'build/apps-script-brand/Database.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXPECTED_DOC_SHA =
  '7d324945b28e9629725ebee4a0540d00a86a046a020bdbb53e377a0e82f7429b';

function git(...args) {
  return cp.execFileSync(
    'git',
    args,
    { encoding: 'utf8' }
  ).trim();
}

function requireText(text, marker, label) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(text, 'utf8')
    .digest('hex');
}

console.log(
  '=== COUNTY CODE-VIOLATION COLLAPSE MAINTENANCE / WRITER-QUIESCENCE CONTRACT V1 ==='
);

assert.strictEqual(
  git('merge-base', BASE, 'HEAD'),
  BASE,
  'Certified maintenance-design base is no longer an ancestry root.'
);

assert.ok(
  fs.existsSync(DOC),
  'Maintenance contract document must exist.'
);

assert.ok(
  fs.existsSync(SELF),
  'Maintenance contract validator must exist.'
);

assert.ok(
  fs.existsSync(WORKFLOW),
  'County-collapse offline workflow must exist.'
);

assert.ok(
  !fs.existsSync(FUTURE_IMPL),
  'Collapse maintenance implementation must not exist during design certification.'
);

assert.ok(
  !fs.existsSync(FUTURE_EXECUTOR),
  'Collapse executor must remain absent during maintenance design certification.'
);

const doc = fs.readFileSync(DOC, 'utf8');
const self = fs.readFileSync(SELF, 'utf8');
const workflow =
  fs.readFileSync(WORKFLOW, 'utf8');

assert.strictEqual(
  sha256(doc),
  EXPECTED_DOC_SHA,
  'Collapse maintenance contract SHA-256 changed.'
);

const normalizedDoc =
  doc.replace(/\s+/g, ' ').trim();

const executorDoc =
  fs.readFileSync(EXECUTOR_DOC, 'utf8');
const preflight =
  fs.readFileSync(PREFLIGHT, 'utf8');
const db =
  fs.readFileSync(DB, 'utf8');

[
  'Status: DESIGN ONLY.',
  'COLLAPSE_MAINTENANCE_CONTRACT_VERSION=1',
  'MAINTENANCE_MODE=CODE_VIOLATION_COLLAPSE',
  'SCHEDULER_HANDLER=reosCountyProductionSchedulerRun',
  'REQUIRED_MANAGED_SCHEDULER_TRIGGER_COUNT=0',
  'CAPABILITY_STORAGE=SHA256_ONLY',
  'CAPABILITY_REVALIDATION=UNDER_SAME_OUTER_DATABASE_SCRIPTLOCK',
  'NESTED_LOCK_AUTHORITY=false',
  'MAINTENANCE_GATE_GRANTS_MUTATION_AUTHORITY=false',
  'RPC_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PRODUCTION_MUTATION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'SCHEDULER_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',
  'CONNECTOR_EXECUTION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Maintenance contract'
  );
});

[
  'exact certified collapse winner-plan fingerprint',
  'exact certified collapse authority SHA-256',
  'exact certified frozen checkpoint',
  'zero active triggers',
  'no competing REOS county mutation path',
  'external/manual',
  'SHA-256 digest',
  'settling interval',
  'same outer Database ScriptLock',
  'gate identity',
  'readiness metadata only',
  'No implementation is authorized by this design gate.'
].forEach(marker => {
  requireText(
    normalizedDoc,
    marker,
    'Maintenance safety model'
  );
});

[
  'ScriptLock coordinates cooperating code but cannot exclude manual edits or',
  'collapse-maintenance / writer-quiescence mechanism',
  'the managed county scheduler has zero active triggers',
  'checkpoint state is the exact frozen certified state',
  'no competing REOS county mutation path is authorized',
  'the collapse operation owns the required maintenance capability',
  'the maintenance capability is revalidated under the same outer lock',
  'external/manual writer assumptions'
].forEach(marker => {
  requireText(
    executorDoc,
    marker,
    'Certified executor prerequisite'
  );
});

requireText(
  preflight,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'Collapse preflight blocker'
);

[
  'function withScriptLockContext(',
  'function assertScriptLockContext(',
  'withScriptLockContext: withScriptLockContext',
  'assertScriptLockContext: assertScriptLockContext'
].forEach(marker => {
  requireText(
    db,
    marker,
    'Database caller-owned lock API'
  );
});

const ciValidatorPath = SELF;

const ciValidatorOccurrences =
  workflow.split(ciValidatorPath).length - 1;

assert.strictEqual(
  ciValidatorOccurrences,
  2,
  'Collapse maintenance validator must appear exactly twice in county-collapse CI.'
);

requireText(
  workflow,
  'node --check ' + ciValidatorPath,
  'Collapse maintenance CI syntax registration'
);

requireText(
  workflow,
  'run: node ' + ciValidatorPath,
  'Collapse maintenance CI execution registration'
);

const rpcSearch =
  cp.spawnSync(
    'git',
    [
      'grep',
      '-n',
      'reosCountyCodeViolationCollapseMaintenance',
      '--',
      'build/apps-script-brand'
    ],
    { encoding: 'utf8' }
  );

assert.ok(
  rpcSearch.status === 1 ||
  rpcSearch.stdout.trim() === '',
  'Collapse maintenance RPC unexpectedly exists.'
);

console.log(
  'PASS: maintenance authority is collapse-specific and design-only.'
);
console.log(
  'PASS: scheduler quiescence and exact frozen checkpoint are mandatory.'
);
console.log(
  'PASS: competing REOS county writer authority must be explicitly excluded.'
);
console.log(
  'PASS: manual/external writer assumption must be explicitly certified.'
);
console.log(
  'PASS: raw maintenance capability may not be persisted.'
);
console.log(
  'PASS: readiness must be revalidated under the executor outer Database lock.'
);
console.log(
  'PASS: maintenance readiness grants no mutation authority.'
);
console.log(
  'PASS: executor implementation and maintenance implementation remain absent.'
);
console.log(
  'contract_sha256=' +
  sha256(doc)
);
console.log(
  'validator_sha256=' +
  sha256(self)
);
console.log(
  'COLLAPSE_MAINTENANCE_CONTRACT_DESIGN_VALIDATION_PASSED=true'
);
