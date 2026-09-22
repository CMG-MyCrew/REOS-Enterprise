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
  '5dcdafe278a57a72685949b357029b5a5020cdef';

const BASE_TREE =
  '5bf56ee137acdf74d09951a87d4ab45d761841b7';

const EXPECTED_DOC_SHA =
  '62b2ef5eca236330c2e09ea6c1e79a71bb3a8cc07f531a750eb53aeb97cdb439';

const DOC =
  'docs/county-collapse-group2-executor-history-exception-authorization-v1.md';

const SELF =
  'scripts/validate-county-collapse-group2-executor-history-exception-authorization-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const POST_TERMINAL =
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const MAINT_GATE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const FUTURE_VALIDATOR =
  'scripts/validate-county-collapse-group2-executor-history-exception-v1.js';

const EXPECTED_SCOPE = [
  DOC,
  SELF,
  WORKFLOW
].sort();

const PROTECTED = [
  EXECUTOR,
  STORE,
  POST_TERMINAL,
  RESIDUAL,
  PREFLIGHT,
  MAINT_GATE,
  LEASE,
  DATABASE,
  INTEGRATION
];

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
      String(result.stderr || '')
  );

  return String(
    result.stdout || ''
  ).trim();
}

function gitRaw(args) {
  const result =
    git(args);

  assert.equal(
    result.status,
    0,
    'git ' +
      args.join(' ') +
      ' failed\n' +
      String(result.stderr || '')
  );

  return String(
    result.stdout || ''
  );
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
    label +
      ' missing: ' +
      marker
  );
}

console.log(
  '=== GROUP 2 EXECUTOR-HISTORY EXCEPTION AUTHORIZATION V1 ==='
);

assert.equal(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Design branch must descend from exact certified main.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Certified source tree changed.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  ...PROTECTED
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required file missing: ' +
      path
  );
});

assert.equal(
  fs.existsSync(FUTURE_VALIDATOR),
  false,
  'Future history-exception runtime validator must remain absent.'
);

assert.equal(
  sha256File(DOC),
  EXPECTED_DOC_SHA,
  'Authorization document changed.'
);

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
    'Protected source changed during design increment: ' +
      path
  );
});

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const executor =
  fs.readFileSync(
    EXECUTOR,
    'utf8'
  );

const postTerminal =
  fs.readFileSync(
    POST_TERMINAL,
    'utf8'
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

[
  'Status: DESIGN-ONLY INCIDENT-SPECIFIC EXECUTOR-HISTORY EXCEPTION HANDOFF.',

  'GROUP2_EXECUTOR_HISTORY_EXCEPTION_AUTHORIZATION_VERSION=1',

  'SOURCE_MAIN_SHA=' + BASE,
  'SOURCE_MAIN_TREE=' + BASE_TREE,

  'SOURCE_POST_MERGE_CI_RUN=35665185444',
  'SOURCE_POST_MERGE_CI_JOB=106549227383',

  'PRODUCTION_VERSION=118',

  'INCIDENT_OPERATION_ID=6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8',
  'INCIDENT_GROUP_NUMBER=2',
  'INCIDENT_WINNER=DL-20260820181645-7130',
  'INCIDENT_TARGET=DL-20260820181652-6183',

  'PREPARED_EVENT_SHA256=843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153',
  'PREPARED_PAYLOAD_SHA256=9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c',

  'TERMINAL_EVENT_SHA256=2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89',
  'TERMINAL_PAYLOAD_SHA256=10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2',

  'POST_TERMINAL_RAW_SHA256=0d1d4ec19959bfa5f6a2a77c561fdc8ba7c74011e6ab30d98f8961ee9c6d9622',
  'POST_TERMINAL_JSON_SHA256=92addf0817fc0267370abf03d227954363511a1d288262f1373db2fe58d64389',
  'POST_TERMINAL_STDERR_SHA256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',

  'POST_TERMINAL_RECONCILIATION_COMPLETE=true',
  'DELETE_BARRIER_PRESENT=false',
  'VERIFIED_DELETE_PRESENT=false',

  'WINNER_CURRENT_ROW_NUMBER=766',
  'TARGET_CURRENT_ROW_NUMBER=770',

  'FUTURE_HISTORY_EXCEPTION_IMPLEMENTATION_SCOPE_FILE_COUNT=4',

  'OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false',
  'POST_TERMINAL_RECONCILIATION_MODIFICATION_AUTHORITY=false',
  'RESIDUAL_EVIDENCE_MODIFICATION_AUTHORITY=false',
  'SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false',
  'MAINTENANCE_GATE_MODIFICATION_AUTHORITY=false',
  'COUNTY_MUTATION_EXCLUSION_LEASE_MODIFICATION_AUTHORITY=false',
  'DATABASE_MODIFICATION_AUTHORITY=false',

  'EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_AUTHORITY=false',
  'EXECUTOR_RETRY_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'JOURNAL_MUTATION_AUTHORITY=false',

  'PRODUCTION_RECONCILIATION_RPC_REINVOCATION_AUTHORITY=false',

  'SCHEDULER_RESTORATION_AUTHORITY=false',
  'CHECKPOINT_MUTATION_AUTHORITY=false',

  'AUTOMATIC_MAO_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Authorization contract'
  );
});

[
  EXECUTOR,
  FUTURE_VALIDATOR,
  WORKFLOW,
  INTEGRATION
].forEach(path => {
  requireText(
    doc,
    path,
    'Future implementation scope'
  );
});

/*
 * Current history guard must remain unmodified and fail closed.
 */
requireText(
  executor,
  'function assertNoTargetBoundOperationHistory_(',
  'Executor history guard'
);

requireText(
  executor,
  'Existing durable operation history already binds requested delete candidate.',
  'Executor history blocker'
);

const guardStart =
  executor.indexOf(
    'function assertNoTargetBoundOperationHistory_('
  );

const guardEnd =
  executor.indexOf(
    'function captureSheetEvidence_(',
    guardStart
  );

assert.ok(
  guardStart >= 0 &&
  guardEnd > guardStart,
  'Exact history-guard boundary is unavailable.'
);

const guard =
  executor.slice(
    guardStart,
    guardEnd
  );

requireText(
  guard,
  '.events[0]',
  'Current first-event binding'
);

requireText(
  guard,
  'targetDeleteDistressLeadId',
  'Current target identity binding'
);

assert.equal(
  guard.includes(
    'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
  ),
  false,
  'Runtime terminal-history exception already exists unexpectedly.'
);

assert.equal(
  executor.includes(
    'GROUP2_CERTIFIED_POST_TERMINAL_HISTORY_EXCEPTION'
  ),
  false,
  'Proposed runtime exception already exists unexpectedly.'
);

/*
 * Existing certified post-terminal reader must expose the exact evidence
 * predicates the future exception depends upon.
 */
[
  'READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1',
  'postTerminalReconciliationComplete',
  'executorHistoryExceptionEvidenceEligible',
  'executorHistoryExceptionImplementationAuthorityGranted',
  'executorRetryAuthorityGranted',
  'physicalDeleteAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'journalMutationExecuted',
  'automaticRetryPermitted',
  'deleteBarrierPresent',
  'verifiedDeletePresent',
  'schedulerFrozen',
  'checkpointFrozen'
].forEach(marker => {
  requireText(
    postTerminal,
    marker,
    'Post-terminal evidence surface'
  );
});

/*
 * Contract must explicitly prohibit generic bypasses.
 */
[
  'No request field may select, enable, disable, or name the history exception.',
  'Any second target-bound operation must fail closed.',
  'No automatic repeat execution is permitted.',
  'an uncertain operation',
  'a delete-barrier operation',
  'a verified-delete operation',
  'an arbitrary operation-ID allowlist',
  'any terminal event merely because it is terminal',
  'any `COLLAPSE_EXECUTOR_PRECONDITION_FAILED` event merely by event type'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Fail-closed design requirement'
  );
});

/*
 * Existing execution safeguards remain mandatory.
 */
[
  'admin authority',
  'exact confirmation token',
  'current collapse authority SHA',
  'current winner-plan fingerprint',
  'successor execution preflight',
  'residual evidence',
  'physical sheet evidence capture',
  'downstream-reference audit',
  'maintenance readiness',
  'caller-owned Database ScriptLock context',
  '`DELETE_INVOCATION_STARTED` barrier',
  'exact physical-delete primitive',
  'post-delete verification',
  'fail-closed uncertainty handling'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Existing safeguard preservation'
  );
});

/*
 * Workflow change must be exactly this validator registration.
 */
const baseWorkflow =
  gitRaw([
    'show',
    BASE + ':' + WORKFLOW
  ]);

const syntaxAnchor =
  '          node --check scripts/validate-county-collapse-group2-post-terminal-reconciliation-v1.js\n';

const syntaxReplacement =
  syntaxAnchor +
  '          node --check ' +
  SELF +
  '\n';

assert.equal(
  baseWorkflow.split(
    syntaxAnchor
  ).length - 1,
  1,
  'Post-terminal syntax anchor changed.'
);

const stepAnchor =
  '      - name: Validate Group 2 post-terminal reconciliation v1\n' +
  '        run: node scripts/validate-county-collapse-group2-post-terminal-reconciliation-v1.js\n\n';

const stepReplacement =
  stepAnchor +
  '      - name: Validate Group 2 executor-history exception authorization v1\n' +
  '        run: node ' +
  SELF +
  '\n\n';

assert.equal(
  baseWorkflow.split(
    stepAnchor
  ).length - 1,
  1,
  'Post-terminal validation anchor changed.'
);

let expectedWorkflow =
  baseWorkflow.replace(
    syntaxAnchor,
    syntaxReplacement
  );

expectedWorkflow =
  expectedWorkflow.replace(
    stepAnchor,
    stepReplacement
  );

assert.equal(
  workflow,
  expectedWorkflow,
  'Workflow changed outside exact authorization-validator registration.'
);

/*
 * Candidate scope must remain exactly three files.
 */
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
  Array.from(effective).sort(),
  EXPECTED_SCOPE,
  'Authorization increment must remain exactly three files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Authorization candidate must remain unstaged.'
);

[
  doc,
  fs.readFileSync(
    SELF,
    'utf8'
  )
].forEach((text, artifactIndex) => {
  text
    .split('\n')
    .forEach((line, lineIndex) => {
      assert.equal(
        /[ \t]+$/.test(line),
        false,
        'Trailing whitespace in artifact ' +
          String(artifactIndex) +
          ' line ' +
          String(lineIndex + 1)
      );
    });
});

console.log(
  'PASS: certified v118 post-terminal production evidence is pinned.'
);

console.log(
  'PASS: exact prepared and terminal journal hashes are pinned.'
);

console.log(
  'PASS: current executor target-history blocker remains unchanged and fail-closed.'
);

console.log(
  'PASS: future exception is limited to one exact incident and exact two-event history.'
);

console.log(
  'PASS: generic, uncertain, verified-delete, event-type-only, and arbitrary-allowlist bypasses are prohibited.'
);

console.log(
  'PASS: second target-bound operation fails closed.'
);

console.log(
  'PASS: request schema remains caller-bypass-free by contract.'
);

console.log(
  'PASS: existing execution safeguards remain mandatory.'
);

console.log(
  'PASS: future implementation scope is exactly four files.'
);

console.log(
  'PASS: design-only increment scope is exactly three files.'
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
  'GROUP2_EXECUTOR_HISTORY_EXCEPTION_AUTHORIZATION_VALIDATION_PASSED=true'
);

console.log(
  'FUTURE_HISTORY_EXCEPTION_IMPLEMENTATION_HANDOFF_DEFINED=true'
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

console.log(
  'JOURNAL_MUTATION_AUTHORIZED=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
