'use strict';

const assert = require('assert');
const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');

const BASE =
  'ec0455b8c52d3a22acad71db6f062c1712418744';

const BASE_TREE =
  '111663af93a7cae9179c82cb09dae9e8bb0f462d';

const DOC =
  'docs/county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.md';

const SELF =
  'scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const PROTECTED = [
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js',
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js',
  'build/apps-script-brand/Database.js',
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js',
  'build/apps-script-brand/CountyMutationExclusionLease.js',
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js',
  'docs/county-collapse-group2-postsuccess-history-invariant-repair-design-v1.md'
];

const EXPECTED_SCOPE = [
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

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function sha256File(path) {
  return sha256(
    fs.readFileSync(path)
  );
}

function requireText(
  text,
  marker,
  label
) {
  assert.ok(
    text.includes(marker),
    label +
      ' missing marker: ' +
      marker
  );
}

assert.equal(
  gitText([
    'rev-parse',
    BASE
  ]),
  BASE,
  'Source main unavailable.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Source tree drift.'
);

PROTECTED.forEach(path => {
  const result =
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      path
    ]);

  assert.equal(
    result.status,
    0,
    'Protected source changed: ' +
      path
  );
});

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

[
  'Status: DESIGN ONLY. INCIDENT-BOUNDED TERMINAL-RECONCILIATION HANDOFF.',
  '`SOURCE_MAIN_SHA=ec0455b8c52d3a22acad71db6f062c1712418744`',
  '`SOURCE_MAIN_TREE=111663af93a7cae9179c82cb09dae9e8bb0f462d`',
  '`INCIDENT_OPERATION_ID=9c3f6f20-340b-47fb-a2c9-175fcbfbd88d`',
  '`INCIDENT_GROUP_NUMBER=4`',
  '`INCIDENT_WINNER=DL-20260820195113-7700`',
  '`INCIDENT_TARGET=DL-20260820195131-0566`',
  '`INCIDENT_VIOLATION=VI-2026-045398`',
  '`PREPARED_EVENT_SHA256=41869f2955b69423bc02292a126049cacb523df545d4535471a5972c36b6c788`',
  '`PREPARED_PAYLOAD_SHA256=c417ee900580a965090f95eddffeb6220e77385188900e740483617d41e7af12`',
  '`DELETE_BARRIER_EVENT_SHA256=6f925e2042904e756375b06c2e0b0ba321517dd2e95a909fdc6f75f4df66fd86`',
  '`DELETE_BARRIER_PAYLOAD_SHA256=ddf06e64cfd987044b048317170b9b23367444993ae7999cbfec4dcb202f8f5d`',
  '`CURRENT_RECOVERY_CLASSIFICATION=UNCERTAIN_DELETE_BARRIER_OR_TERMINAL`',
  '`EXISTING_EVENT_COUNT=2`',
  '`FRESH_MAINTENANCE_REQUIRED_FOR_FUTURE_REPAIR=true`',
  '`REPAIR_MUST_NOT_CALL_DELETE_PHYSICAL_ROW_EXACT=true`',
  '`REPAIR_MUST_NOT_FABRICATE_ORIGINAL_PRIMITIVE_RESULT=true`',
  '`REPAIR_MUST_BE_RESUME_SAFE=true`',
  '`FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=4`',
  '`GROUP4_TERMINAL_RECONCILIATION_IMPLEMENTATION_AUTHORIZED=false`',
  '`JOURNAL_MUTATION_AUTHORIZED=false`',
  '`DEPLOYMENT_AUTHORIZED=false`',
  '`RPC_EXECUTION_AUTHORIZED=false`'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Design contract'
  );
});

[
  'DELETE_INVOCATION_STARTED -> POSTDELETE_VERIFIED -> COLLAPSE_DELETE_VERIFIED',
  'A `COLLAPSE_EXECUTOR_PRECONDITION_FAILED` terminal is forbidden after a',
  'It must never call:',
  '`REOS.Database.deletePhysicalRowExact`',
  'It must never invoke the collapse executor.',
  'It must not fabricate:',
  '`primitiveResult`',
  '`physicalDeleteClassification=DELETED_VERIFIED`',
  'The future repair must tolerate interruption without duplicating journal',
  'exactly those two events plus one previously certified',
  '`POSTDELETE_VERIFIED` reconciliation event from this exact repair contract.',
  'current certified rows `42`',
  'verified deleted count `2`',
  'remaining direct-keep delete candidates `14`'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Repair semantics'
  );
});

[
  '`EXECUTOR_RETRY_AUTHORIZED=false`',
  '`SECOND_EXECUTOR_INVOCATION_AUTHORIZED=false`',
  '`PHYSICAL_DELETE_AUTHORIZED=false`',
  '`ROW_RECREATION_AUTHORIZED=false`',
  '`GROUP2_POSTSUCCESS_EXCEPTION_REUSE_AUTHORIZED=false`',
  '`GENERIC_RESIDUAL_WEAKENING_AUTHORIZED=false`',
  '`JOURNAL_MUTATION_AUTHORIZED=false`',
  '`AUTOMATIC_MAO_AUTHORITY_GRANTED=false`',
  '`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Non-authority boundary'
  );
});

[
  'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutEvidence.js',
  'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.js',
  'scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-v1.js',
  '.github/workflows/county-collapse-offline.yml'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Future implementation shape'
  );
});

const baseWorkflow =
  gitRaw([
    'show',
    BASE + ':' + WORKFLOW
  ]);

const syntaxAnchor =
  '          node --check scripts/validate-county-collapse-group2-postsuccess-history-invariant-repair-design-v1.js\n';

const syntaxAddition =
  syntaxAnchor +
  '          node --check scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.js\n';

assert.equal(
  baseWorkflow
    .split(syntaxAnchor)
    .length - 1,
  1,
  'Design syntax anchor changed.'
);

const stepAnchor =
  '      - name: Validate Group 2 post-success history-invariant repair v1\n' +
  '        run: node scripts/validate-county-collapse-group2-postsuccess-history-invariant-repair-v1.js\n\n';

const stepAddition =
  stepAnchor +
  '      - name: Validate Group 4 post-barrier timeout terminal-reconciliation design v1\n' +
  '        run: node scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.js\n\n';

assert.equal(
  baseWorkflow
    .split(stepAnchor)
    .length - 1,
  1,
  'Design validation step anchor changed.'
);

let expectedWorkflow =
  baseWorkflow.replace(
    syntaxAnchor,
    syntaxAddition
  );

expectedWorkflow =
  expectedWorkflow.replace(
    stepAnchor,
    stepAddition
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

assert.equal(
  workflow,
  expectedWorkflow,
  'Workflow changed outside exact Group 4 design-validator registration.'
);

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
  'Design increment must remain exactly three files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Design candidate must remain unstaged.'
);

[
  DOC,
  SELF,
  WORKFLOW
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
        'Trailing whitespace in ' +
          path +
          ' line ' +
          String(index + 1)
      );
    });
});

console.log(
  'PASS: exact ec0455 source authority is pinned.'
);

console.log(
  'PASS: exact Group 4 post-barrier timeout incident identity is pinned.'
);

console.log(
  'PASS: exact prepared and delete-barrier event hashes are pinned.'
);

console.log(
  'PASS: executor retry, second delete, and row recreation remain forbidden.'
);

console.log(
  'PASS: Group 2 post-success exception reuse is forbidden.'
);

console.log(
  'PASS: generic residual-reader weakening is forbidden.'
);

console.log(
  'PASS: future repair requires fresh maintenance and live re-verification.'
);

console.log(
  'PASS: future repair cannot call deletePhysicalRowExact.'
);

console.log(
  'PASS: future repair cannot fabricate the original primitive result.'
);

console.log(
  'PASS: future repair must be resume-safe across two-event and three-event states.'
);

console.log(
  'PASS: current design increment scope is exactly three files.'
);

console.log(
  'design_doc_sha256=' +
    sha256File(DOC)
);

console.log(
  'design_validator_sha256=' +
    sha256File(SELF)
);

console.log(
  'GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_DESIGN_COMPLETE=true'
);

console.log(
  'GROUP4_TERMINAL_RECONCILIATION_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_RETRY_AUTHORIZED=false'
);

console.log(
  'SECOND_EXECUTOR_INVOCATION_AUTHORIZED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORIZED=false'
);

console.log(
  'JOURNAL_MUTATION_AUTHORIZED=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'RPC_EXECUTION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
