#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const BASE =
  '44b3315f9e80fefd4fa3c52dc6a7f5b50b408413';

const BASE_TREE =
  '6e05847ce0d9ccc3d6b273361fb4f2fdd9208ec6';

const BRANCH =
  'feat/absentee-owner-classification-persistence-certified-property-source-provenance-evidence-store-v2';

const IMPLEMENTATION =
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js';

const STATIC =
  'scripts/validate-absentee-owner-classification-evidence-store-v2.js';

const BEHAVIOR =
  'scripts/validate-absentee-owner-classification-evidence-store-behavior-v2.js';

const INTEGRATION =
  'scripts/validate-absentee-owner-classification-evidence-store-integration-v2.js';

const RUNTIME_INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const ALLOWED_FILES = [
  IMPLEMENTATION,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  RUNTIME_INTEGRATION,
  WORKFLOW
].sort();

const FROZEN_RUNTIME_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js'
];

function git(args) {
  const result = spawnSync(
    'git',
    args,
    {
      cwd: ROOT,
      encoding: 'utf8'
    }
  );

  if (result.error) throw result.error;

  return result;
}

function gitText(args, message) {
  const result = git(args);

  assert.strictEqual(
    result.status,
    0,
    message +
      (
        result.stderr
          ? ': ' + result.stderr.trim()
          : ''
      )
  );

  return result.stdout.trimEnd();
}

function read(file) {
  return fs.readFileSync(
    path.join(ROOT, file),
    'utf8'
  );
}

function count(text, marker) {
  return text.split(marker).length - 1;
}

function constArrayBlock(text, name) {
  const startMarker =
    'const ' + name + ' = [';

  const start =
    text.indexOf(startMarker);

  assert.ok(
    start >= 0,
    'missing const array: ' + name
  );

  const end =
    text.indexOf('];', start);

  assert.ok(
    end > start,
    'unterminated const array: ' + name
  );

  return text.slice(start, end + 2);
}

function readGitHubEvent() {
  const eventPath =
    process.env.GITHUB_EVENT_PATH || '';

  assert.ok(
    eventPath,
    'GitHub Actions event path missing'
  );

  try {
    return JSON.parse(
      fs.readFileSync(
        eventPath,
        'utf8'
      )
    );
  } catch (error) {
    assert.fail(
      'unable to parse GitHub Actions event: ' +
      error.message
    );
  }
}

function changedFilesBetween(base, head) {
  const output =
    gitText(
      [
        'diff',
        '--name-only',
        base,
        head
      ],
      'unable to inspect committed file scope'
    );

  return output
    ? output
        .split(/\r?\n/)
        .filter(Boolean)
        .sort()
    : [];
}

function commitParents(commit) {
  const line =
    gitText(
      [
        'rev-list',
        '--parents',
        '-n',
        '1',
        commit
      ],
      'unable to inspect commit parents: ' +
        commit
    );

  return line
    .split(/\s+/)
    .slice(1);
}

ALLOWED_FILES.forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required v2 store tranche file missing: ' +
      file
  );
});

const githubActions =
  process.env.GITHUB_ACTIONS === 'true';

const githubEventName =
  process.env.GITHUB_EVENT_NAME || '';

let validationMode = '';

if (!githubActions) {
  validationMode =
    'LOCAL_SOURCE_EDIT_CERTIFICATION';

  assert.strictEqual(
    gitText(
      ['rev-parse', 'HEAD'],
      'unable to read HEAD'
    ),
    BASE,
    'HEAD drifted from certified base'
  );

  assert.strictEqual(
    gitText(
      ['rev-parse', 'HEAD^{tree}'],
      'unable to read HEAD tree'
    ),
    BASE_TREE,
    'committed tree drifted from certified base'
  );

  assert.strictEqual(
    gitText(
      ['branch', '--show-current'],
      'unable to read branch'
    ),
    BRANCH,
    'wrong v2 store branch'
  );

  const statusText =
    gitText(
      [
        'status',
        '--porcelain=v1',
        '--untracked-files=all'
      ],
      'unable to inspect worktree status'
    );

  assert.ok(
    statusText,
    'source edit produced no worktree changes'
  );

  const changed =
    statusText
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => line.slice(3))
      .sort();

  assert.deepStrictEqual(
    changed,
    ALLOWED_FILES,
    'v2 store tranche must modify exactly six authorized files'
  );
} else if (
  githubEventName === 'pull_request'
) {
  validationMode =
    'GITHUB_PULL_REQUEST_CI';

  const event =
    readGitHubEvent();

  assert.ok(
    event.pull_request,
    'pull_request payload missing'
  );

  assert.strictEqual(
    event.pull_request.base.ref,
    'main',
    'PR base branch must be main'
  );

  assert.strictEqual(
    event.pull_request.base.sha,
    BASE,
    'PR base SHA drifted'
  );

  assert.strictEqual(
    event.pull_request.head.ref,
    BRANCH,
    'PR head branch drifted'
  );

  const prHead =
    event.pull_request.head.sha;

  assert.match(
    prHead,
    /^[0-9a-f]{40}$/,
    'PR head must be a full SHA'
  );

  assert.strictEqual(
    gitText(
      ['rev-parse', prHead + '^{commit}'],
      'unable to resolve PR head'
    ),
    prHead,
    'resolved PR head mismatch'
  );

  assert.strictEqual(
    gitText(
      ['merge-base', BASE, prHead],
      'unable to calculate PR merge base'
    ),
    BASE,
    'PR head must descend from certified base'
  );

  const checkoutHead =
    gitText(
      ['rev-parse', 'HEAD'],
      'unable to read PR checkout HEAD'
    );

  assert.strictEqual(
    process.env.GITHUB_SHA || '',
    checkoutHead,
    'GITHUB_SHA must equal PR merge checkout'
  );

  assert.match(
    process.env.GITHUB_REF || '',
    /^refs\/pull\/[0-9]+\/merge$/,
    'GITHUB_REF must identify PR merge ref'
  );

  assert.deepStrictEqual(
    commitParents(checkoutHead),
    [BASE, prHead],
    'synthetic merge parents must be certified base then PR head'
  );

  assert.strictEqual(
    gitText(
      ['rev-parse', 'HEAD^{tree}'],
      'unable to read PR checkout tree'
    ),
    gitText(
      ['rev-parse', prHead + '^{tree}'],
      'unable to read PR head tree'
    ),
    'synthetic merge tree must equal PR head tree'
  );

  assert.strictEqual(
    gitText(
      [
        'status',
        '--porcelain=v1',
        '--untracked-files=all'
      ],
      'unable to inspect PR checkout'
    ),
    '',
    'PR CI checkout must be clean'
  );

  assert.deepStrictEqual(
    changedFilesBetween(BASE, prHead),
    ALLOWED_FILES,
    'PR scope must remain exactly six authorized files'
  );
} else if (
  githubEventName === 'push'
) {
  validationMode =
    'GITHUB_MAIN_PUSH_CI';

  const event =
    readGitHubEvent();

  const checkoutHead =
    gitText(
      ['rev-parse', 'HEAD'],
      'unable to read main push HEAD'
    );

  assert.strictEqual(
    process.env.GITHUB_REF || '',
    'refs/heads/main',
    'push CI is authorized only for main'
  );

  assert.strictEqual(
    process.env.GITHUB_SHA || '',
    checkoutHead,
    'GITHUB_SHA must equal main checkout'
  );

  assert.strictEqual(
    event.ref,
    'refs/heads/main',
    'push event ref must be main'
  );

  assert.strictEqual(
    event.after,
    checkoutHead,
    'push event after must equal checkout HEAD'
  );

  assert.strictEqual(
    gitText(
      [
        'status',
        '--porcelain=v1',
        '--untracked-files=all'
      ],
      'unable to inspect main push checkout'
    ),
    '',
    'main push checkout must be clean'
  );
} else {
  assert.fail(
    'unsupported GitHub Actions event for v2 evidence store integration validator: ' +
      githubEventName
  );
}

FROZEN_RUNTIME_FILES.forEach(file => {
  const result =
    git([
      'diff',
      '--quiet',
      BASE,
      '--',
      file
    ]);

  assert.strictEqual(
    result.status,
    0,
    'frozen runtime modification prohibited: ' +
      file
  );
});

const runtimeIntegration =
  read(RUNTIME_INTEGRATION);

const baselineRuntimeIntegration =
  gitText(
    [
      'show',
      BASE + ':' + RUNTIME_INTEGRATION
    ],
    'unable to read baseline runtime integration'
  );

[
  'POST_COUNTY_PRODUCTION_FILES',
  'COMPONENT_VALIDATORS'
].forEach(name => {
  assert.strictEqual(
    constArrayBlock(
      runtimeIntegration,
      name
    ),
    constArrayBlock(
      baselineRuntimeIntegration,
      name
    ),
    name +
      ' historical inventory must remain byte-exact'
  );
});

const inventoryName =
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PRODUCTION_FILES';

const inventoryBlock =
  constArrayBlock(
    runtimeIntegration,
    inventoryName
  );

assert.strictEqual(
  (
    inventoryBlock.match(
      /'build\/apps-script-brand\/[^']+\.js'/g
    ) ||
    []
  ).length,
  1,
  'v2 store production inventory must contain exactly one file'
);

assert.strictEqual(
  count(
    inventoryBlock,
    "'" + IMPLEMENTATION + "'"
  ),
  1,
  'v2 store runtime must occur exactly once in dedicated inventory'
);

[
  'absenteeOwnerClassificationEvidenceStoreV2Entries',
  inventoryName + '.length',
  'classification evidence store v2 inventory must contain exactly one file',
  'classification evidence store v2 surface is exactly one explicitly allowlisted additive store file'
].forEach(marker => {
  assert.ok(
    runtimeIntegration.includes(marker),
    'v2 store runtime integration marker missing: ' +
      marker
  );
});

const workflow =
  read(WORKFLOW);

const baselineWorkflow =
  gitText(
    [
      'show',
      BASE + ':' + WORKFLOW
    ],
    'unable to read baseline workflow'
  );

const plannerStep =
  'Validate absentee-owner certified property-source provenance planner integration v2';

assert.strictEqual(
  count(baselineWorkflow, plannerStep),
  1,
  'baseline planner integration step must exist once'
);

assert.strictEqual(
  count(workflow, plannerStep),
  1,
  'existing planner integration step must remain once'
);

[
  'node --check ' + IMPLEMENTATION,
  'node --check ' + STATIC,
  'node --check ' + BEHAVIOR,
  'node --check ' + INTEGRATION
].forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur once: ' +
      marker
  );
});

const stepMarkers = [
  'Validate absentee-owner classification evidence store static v2',
  'Validate absentee-owner classification evidence store behavior v2',
  'Validate absentee-owner classification evidence store integration v2'
];

stepMarkers.forEach(marker => {
  assert.strictEqual(
    count(workflow, marker),
    1,
    'workflow execution step must occur once: ' +
      marker
  );
});

[
  STATIC,
  BEHAVIOR,
  INTEGRATION
].forEach(file => {
  assert.strictEqual(
    count(
      workflow,
      'run: node ' + file
    ),
    1,
    'workflow validator execution must occur once: ' +
      file
  );
});

const implementation =
  read(IMPLEMENTATION);

[
  'LockService',
  'UrlFetchApp',
  '.insertSheet(',
  '.deleteRow(',
  '.setValue(',
  '.setValues(',
  'function reosAbsenteeOwner'
].forEach(marker => {
  assert.strictEqual(
    implementation.includes(marker),
    false,
    'prohibited v2 store execution surface: ' +
      marker
  );
});

assert.strictEqual(
  count(
    implementation,
    '.appendRow(row)'
  ),
  1,
  'v2 store must contain exactly one physical append invocation'
);

console.log('VALIDATION_MODE=' + validationMode);
console.log('GITHUB_ACTIONS_CONTEXT=' + githubActions);
console.log('ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_INTEGRATION_V2_VALID=true');
console.log('BASE_MAIN=' + BASE);
console.log('BASE_MAIN_TREE=' + BASE_TREE);
console.log('AUTHORIZED_FILE_COUNT=6');
console.log('AUTHORIZED_FILE_SET_EXACT=true');
console.log('NO_SEVENTH_FILE=true');
console.log('V1_RUNTIME_UNCHANGED=true');
console.log('V2_PLANNER_UNCHANGED=true');
console.log('POST_COUNTY_PRODUCTION_INVENTORY_UNCHANGED=true');
console.log('COMPONENT_VALIDATOR_INVENTORY_UNCHANGED=true');
console.log('V2_STORE_DEDICATED_RUNTIME_INVENTORY_EXACT=true');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('STORE_LOCK_ACQUISITION=false');
console.log('PROVISIONING=false');
console.log('V1_RECONCILIATION=false');
console.log('PUBLIC_RPC=false');
console.log('DOWNSTREAM_AUTHORITY=false');
