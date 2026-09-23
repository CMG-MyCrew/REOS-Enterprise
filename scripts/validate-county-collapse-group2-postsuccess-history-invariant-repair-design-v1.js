'use strict';

const assert = require('assert');
const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');

const BASE =
  'd79d640d587e8a4d104cc4631b2022609a63fd50';

const BASE_TREE =
  '90d28afc06ae80006ce32810e3bf523665f191f8';

const DOC =
  'docs/county-collapse-group2-postsuccess-history-invariant-repair-design-v1.md';

const SELF =
  'scripts/validate-county-collapse-group2-postsuccess-history-invariant-repair-design-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const POST_TERMINAL =
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js';

const HISTORICAL_DOC =
  'docs/county-collapse-group2-executor-history-exception-authorization-v1.md';

const HISTORICAL_VALIDATOR =
  'scripts/validate-county-collapse-group2-executor-history-exception-v1.js';

const EXPECTED_SCOPE = [
  DOC,
  SELF,
  WORKFLOW
].sort();

function git(args) {
  return cp.execFileSync(
    'git',
    args,
    {
      encoding: 'utf8'
    }
  );
}

function gitText(args) {
  return git(args).trim();
}

function gitRaw(args) {
  return git(args);
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function sha256File(path) {
  return sha256(
    fs.readFileSync(
      path
    )
  );
}

function lines(value) {
  return String(value || '')
    .split('\n')
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
      ' missing marker: ' +
      marker
  );
}

function countText(
  text,
  marker
) {
  return text.split(marker).length - 1;
}

assert.equal(
  gitText([
    'rev-parse',
    BASE
  ]),
  BASE,
  'Source main is unavailable.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Source tree drifted.'
);

const sourcePins = {
  [RESIDUAL]:
    '3e66b2ac5d2bb7b9b25d5ed9121a92899c2c5cff319025931152b693bd7cc82d',

  [STORE]:
    'bfae3ae3edadc72e898064d4c9271329c36bb0c95bde6474fbe1fd9ca2498766',

  [PREFLIGHT]:
    'e805202ac89f827b27205f4f58bad71271f9c00a05ad5672c25ed4c05e802dac',

  [EXECUTOR]:
    'dd1d04f6c16dc127d1c5380cd7a92f325724bf37640a6ff4459a056ce87a78f4',

  [POST_TERMINAL]:
    '1cd09c1f2ad2cd5d8c4a3fd3c63075aa26be60914c5848b83cd5a38359062a27',

  [HISTORICAL_DOC]:
    '62b2ef5eca236330c2e09ea6c1e79a71bb3a8cc07f531a750eb53aeb97cdb439',

  [HISTORICAL_VALIDATOR]:
    '073723264bd1cf43b9e33d9a43e05e5f2f41dcf33bf7990340afc89cfaf56297',

  [WORKFLOW]:
    '5715ddca7d6cdc33d38dab7ccc66252ea68d07dc657de8e17b4eb5c54f2bb232'
};

Object.keys(sourcePins)
  .forEach(path => {
    const raw =
      gitRaw([
        'show',
        BASE + ':' + path
      ]);

    assert.equal(
      sha256(raw),
      sourcePins[path],
      'Pinned source hash drift: ' +
        path
    );
  });

const baseResidual =
  gitRaw([
    'show',
    BASE + ':' + RESIDUAL
  ]);

[
  'var boundOperationCount = {};',
  'VERIFIED_SUCCESS_JOURNAL',
  'Multiple verified delete histories bind target:',
  'Missing certified ID does not bind exactly one strict operation history:'
].forEach(marker => {
  requireText(
    baseResidual,
    marker,
    'Base residual source'
  );
});

const historicalDoc =
  gitRaw([
    'show',
    BASE + ':' + HISTORICAL_DOC
  ]);

[
  '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8',
  'DL-20260820181645-7130',
  'DL-20260820181652-6183',
  'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
  'Any second target-bound operation must fail closed.'
].forEach(marker => {
  requireText(
    historicalDoc,
    marker,
    'Historical Group 2 contract'
  );
});

assert.ok(
  fs.existsSync(DOC),
  'Design document is missing.'
);

assert.ok(
  fs.existsSync(SELF),
  'Design validator is missing.'
);

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

[
  'Status: DESIGN ONLY. INCIDENT-BOUNDED POST-SUCCESS REPAIR HANDOFF.',
  '`SOURCE_MAIN_SHA=d79d640d587e8a4d104cc4631b2022609a63fd50`',
  '`SOURCE_MAIN_TREE=90d28afc06ae80006ce32810e3bf523665f191f8`',
  '`INCIDENT_GROUP_NUMBER=2`',
  '`INCIDENT_WINNER=DL-20260820181645-7130`',
  '`INCIDENT_TARGET=DL-20260820181652-6183`',
  '`HISTORICAL_OPERATION_ID=6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`',
  '`HISTORICAL_RECOVERY_CLASSIFICATION=PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`',
  '`VERIFIED_SUCCESS_RECOVERY_CLASSIFICATION=VERIFIED_SUCCESS_JOURNAL`',
  '`INCIDENT_ALLOWED_BOUND_HISTORY_COUNT=2`',
  '`INCIDENT_HISTORICAL_HISTORY_COUNT=1`',
  '`INCIDENT_VERIFIED_SUCCESS_HISTORY_COUNT=1`',
  '`THIRD_TARGET_BOUND_HISTORY_ALLOWED=false`',
  '`SECOND_VERIFIED_SUCCESS_HISTORY_ALLOWED=false`',
  '`UNCERTAIN_TARGET_BOUND_HISTORY_ALLOWED=false`',
  '`GENERIC_COUNT_TWO_RULE_ALLOWED=false`',
  '`NON_GROUP2_EXACT_ONE_RULE_PRESERVED=true`'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Design contract'
  );
});

[
  'Exactly two strict target-bound operations must exist for the incident target.',
  'one exact historical precondition-failed history',
  'one exact verified-success history',
  'No generic count-two rule is authorized.',
  'A third target-bound history fails closed.',
  'An unrecognized target-bound history fails closed.',
  'Any uncertain target-bound history fails closed.',
  'A second verified-success history fails closed.',
  'Non-Group-2 target behavior must remain unchanged.'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Fail-closed repair semantics'
  );
});

[
  'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
  '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153',
  '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c',
  '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89',
  '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2',
  'VERIFIED_SUCCESS_JOURNAL',
  'COLLAPSE_DELETE_VERIFIED'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Strict history predicate'
  );
});

[
  '`FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=3`',
  '`RESIDUAL_EVIDENCE_FUTURE_MODIFICATION_AUTHORITY=true`',
  '`OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false`',
  '`SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false`',
  '`EXECUTOR_MODIFICATION_AUTHORITY=false`',
  '`POST_TERMINAL_RECONCILIATION_MODIFICATION_AUTHORITY=false`',
  '`JOURNAL_MUTATION_AUTHORITY=false`',
  '`POSTSUCCESS_REPAIR_IMPLEMENTATION_AUTHORIZED=false`'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Implementation boundary'
  );
});

[
  '`EXECUTOR_RETRY_AUTHORIZED=false`',
  '`SECOND_EXECUTOR_INVOCATION_AUTHORIZED=false`',
  '`PHYSICAL_DELETE_AUTHORIZED=false`',
  '`ROW_RECREATION_AUTHORIZED=false`',
  '`JOURNAL_MUTATION_AUTHORIZED=false`',
  '`MAINTENANCE_OPEN_AUTHORIZED=false`',
  '`MAINTENANCE_CLOSE_AUTHORIZED=false`',
  '`SCHEDULER_RESTORATION_AUTHORIZED=false`',
  '`CHECKPOINT_MUTATION_AUTHORIZED=false`',
  '`DEPLOYMENT_AUTHORIZED=false`',
  '`RPC_EXECUTION_AUTHORIZED=false`',
  '`AUTOMATIC_MAO_AUTHORITY=false`',
  '`AUTOMATIC_OFFER_AUTHORITY=false`'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Non-authority boundary'
  );
});

[
  RESIDUAL,
  STORE,
  PREFLIGHT,
  EXECUTOR,
  POST_TERMINAL
].forEach(path => {
  requireText(
    doc,
    path,
    'Runtime scope declaration'
  );
});

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

const baseWorkflow =
  gitRaw([
    'show',
    BASE + ':' + WORKFLOW
  ]);

const syntaxAnchor =
  '          node --check scripts/validate-county-collapse-group2-executor-history-exception-v1.js\n';

const syntaxAddition =
  syntaxAnchor +
  '          node --check ' +
  SELF +
  '\n';

assert.equal(
  countText(
    baseWorkflow,
    syntaxAnchor
  ),
  1,
  'History-exception syntax anchor changed.'
);

const stepAnchor =
  '      - name: Validate Group 2 executor-history exception v1\n' +
  '        run: node scripts/validate-county-collapse-group2-executor-history-exception-v1.js\n\n';

const certifiedHistoryStep =
  '      - name: Validate certified Group 2 executor-history exception v1\n' +
  '        run: |\n' +
  '          root="$(mktemp -d)"\n' +
  '          wt="$root/certified"\n' +
  '          cleanup() {\n' +
  '            git worktree remove --force "$wt" >/dev/null 2>&1 || true\n' +
  '            rm -rf "$root"\n' +
  '          }\n' +
  '          trap cleanup EXIT\n\n' +
  '          git worktree add --detach "$wt" ' +
  BASE +
  '\n\n' +
  '          (\n' +
  '            cd "$wt"\n' +
  '            test "$(git rev-parse HEAD)" = "' +
  BASE +
  '"\n' +
  '            test "$(git rev-parse \'HEAD^{tree}\')" = "' +
  BASE_TREE +
  '"\n' +
  '            node scripts/validate-county-collapse-group2-executor-history-exception-v1.js\n' +
  '          )\n\n';

const designStep =
  '      - name: Validate Group 2 post-success history-invariant repair design v1\n' +
  '        run: node ' +
  SELF +
  '\n\n';

const stepAddition =
  certifiedHistoryStep +
  designStep;

const runtimeIntegrationAnchor =
  '      - name: Validate county runtime integration\n' +
  '        run: node scripts/validate-county-runtime-integration.js';

const certifiedRuntimeIntegrationStep =
  '      - name: Validate certified county runtime integration\n' +
  '        run: |\n' +
  '          root="$(mktemp -d)"\n' +
  '          wt="$root/certified"\n' +
  '          cleanup() {\n' +
  '            git worktree remove --force "$wt" >/dev/null 2>&1 || true\n' +
  '            rm -rf "$root"\n' +
  '          }\n' +
  '          trap cleanup EXIT\n\n' +
  '          git worktree add --detach "$wt" ' +
  BASE +
  '\n\n' +
  '          (\n' +
  '            cd "$wt"\n' +
  '            test "$(git rev-parse HEAD)" = "' +
  BASE +
  '"\n' +
  '            test "$(git rev-parse \'HEAD^{tree}\')" = "' +
  BASE_TREE +
  '"\n' +
  '            node scripts/validate-county-runtime-integration.js\n' +
  '          )';

assert.equal(
  countText(
    baseWorkflow,
    stepAnchor
  ),
  1,
  'History-exception validation anchor changed.'
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

assert.equal(
  countText(
    baseWorkflow,
    runtimeIntegrationAnchor
  ),
  1,
  'County runtime integration anchor changed.'
);

expectedWorkflow =
  expectedWorkflow.replace(
    runtimeIntegrationAnchor,
    certifiedRuntimeIntegrationStep
  );

assert.equal(
  workflow,
  expectedWorkflow,
  'Workflow changed outside exact historical/runtime-integration lifecycle transitions and design-validator registration.'
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
  'PASS: exact d79d640 source authority and source hashes are pinned.'
);

console.log(
  'PASS: obsolete total-history-count-equals-one residual invariant is pinned.'
);

console.log(
  'PASS: verified-success uniqueness remains mandatory.'
);

console.log(
  'PASS: exact historical Group 2 precondition-failed operation is pinned.'
);

console.log(
  'PASS: exact Group 2 post-success history set is limited to two strict histories.'
);

console.log(
  'PASS: third, unrecognized, uncertain, and second verified-success histories fail closed.'
);

console.log(
  'PASS: non-Group-2 exact-one behavior remains unchanged.'
);

console.log(
  'PASS: journal, executor, preflight, and post-terminal runtime surfaces remain protected.'
);

console.log(
  'PASS: future implementation scope is exactly three files.'
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
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_DESIGN_COMPLETE=true'
);

console.log(
  'POSTSUCCESS_REPAIR_IMPLEMENTATION_AUTHORIZED=false'
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
  'SCHEDULER_RESTORATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
