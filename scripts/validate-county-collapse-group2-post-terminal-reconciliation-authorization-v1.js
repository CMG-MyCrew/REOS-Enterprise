'use strict';

const assert = require('assert');
const fs = require('fs');
const cp = require('child_process');

const BASE =
  'f6bf77b026615b429e36bb89974d2e9068ab2588';

const DOC =
  'docs/county-collapse-group2-post-terminal-reconciliation-authorization-v1.md';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXPECTED_IMPLEMENTATION_FILES = [
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js',
  'scripts/validate-county-collapse-group2-post-terminal-reconciliation-v1.js',
  '.github/workflows/county-collapse-offline.yml',
  'scripts/validate-county-runtime-integration.js'
];

const PROTECTED_FILES = [
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js',
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js',
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js',
  'build/apps-script-brand/CountyMutationExclusionLease.js',
  'build/apps-script-brand/CountyCollapseGroup2PreparedOperationRetirement.js',
  'build/apps-script-brand/CountyCollapseGroup2StrandedOperationReconciliation.js',
  'build/apps-script-brand/Database.js'
];

function git(args) {
  return cp.execFileSync(
    'git',
    args,
    {
      encoding: 'utf8'
    }
  );
}

function pass(message) {
  console.log('PASS ' + message);
}

assert.ok(
  fs.existsSync(DOC),
  'authorization document is missing'
);

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

[
  '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8',

  '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153',
  '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c',

  '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89',
  '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2',

  'DL-20260820181645-7130',
  'DL-20260820181652-6183',

  'INTENT_PREPARED',
  'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',

  'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',

  'READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1',

  'reosCountyCollapseGroup2PostTerminalReconciliationStatus',

  'executorHistoryExceptionEvidenceEligible=true',

  'executorHistoryExceptionImplementationAuthorityGranted',

  'automaticRetryPermitted',
  'executorRetryAuthorityGranted',
  'physicalDeleteAuthorityGranted',

  'COUNTY-20260902222607805',

  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281'
].forEach(value => {
  assert.ok(
    doc.includes(value),
    'authorization document missing required pin: ' + value
  );
});

pass('exact production incident and terminal hashes are pinned');

[
  'CountyCollapseOperationIntentStore.listOperationIds()',
  'CountyCollapseOperationIntentStore.read(operationId)',
  'CountyCollapseOperationIntentStore.recover(operationId)',
  '`prepare()`',
  '`append()`',
  "Database.getSheet('DISTRESS_LEADS')"
].forEach(value => {
  assert.ok(
    doc.includes(value),
    'journal/live-read boundary missing: ' + value
  );
});

pass('read-only journal and fresh live-row evidence boundaries are defined');

EXPECTED_IMPLEMENTATION_FILES.forEach(file => {
  assert.ok(
    doc.includes('`' + file + '`'),
    'future implementation file not explicitly authorized: ' + file
  );
});

assert.equal(
  EXPECTED_IMPLEMENTATION_FILES.length,
  4
);

pass('future implementation scope is exactly four files');

PROTECTED_FILES.forEach(file => {
  assert.ok(
    doc.includes('`' + file + '`'),
    'protected surface omitted from authorization: ' + file
  );

  const base =
    git([
      'show',
      BASE + ':' + file
    ]);

  const current =
    fs.readFileSync(
      file,
      'utf8'
    );

  assert.equal(
    current,
    base,
    'protected file changed during authorization increment: ' + file
  );
});

pass('all protected runtime surfaces remain byte-for-byte unchanged');

[
  'deployment authority',
  'production RPC execution authority',
  'retirement RPC retry authority',
  'journal mutation authority',
  'maintenance open/close authority',
  'executor-history exception implementation authority',
  'executor retry authority',
  'physical-delete authority',
  'scheduler restoration authority',
  'checkpoint mutation authority',
  'MAO authority',
  'automatic-offer authority'
].forEach(value => {
  assert.ok(
    doc.includes(value),
    'explicit non-authority missing: ' + value
  );
});

pass('production and execution authorities remain denied');

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

assert.ok(
  workflow.includes(
    'node --check scripts/validate-county-collapse-group2-post-terminal-reconciliation-authorization-v1.js'
  ),
  'authorization validator syntax check is not wired into CI'
);

assert.ok(
  workflow.includes(
    '- name: Validate Group 2 post-terminal reconciliation authorization v1'
  ),
  'authorization validator CI step is missing'
);

assert.ok(
  workflow.includes(
    'run: node scripts/validate-county-collapse-group2-post-terminal-reconciliation-authorization-v1.js'
  ),
  'authorization validator CI command is missing'
);

pass('offline CI wiring is exact');

console.log('');
console.log(
  'GROUP2_POST_TERMINAL_RECONCILIATION_AUTHORIZATION_VALIDATION_PASSED=true'
);
console.log(
  'FUTURE_POST_TERMINAL_RECONCILIATION_IMPLEMENTATION_FILES=4'
);
console.log(
  'POST_TERMINAL_RECONCILIATION_PRODUCTION_RPC_AUTHORIZED=false'
);
console.log(
  'EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_AUTHORIZED=false'
);
console.log(
  'EXECUTOR_RETRY_AUTHORIZED=false'
);
console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);
