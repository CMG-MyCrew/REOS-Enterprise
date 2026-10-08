#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BASE = '6d48ecae5d51ceb1a7698366034c861bef7e52cf';
const BASE_TREE = 'a59a1894106dcf29e609484cfc5961d03f2e3188';
const BRANCH = 'feat/absentee-owner-classification-persistence-certified-property-source-provenance-runtime-v2';

const IMPLEMENTATION =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js';
const STATIC =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-planner-v2.js';
const BEHAVIOR =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-planner-behavior-v2.js';
const INTEGRATION =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-planner-integration-v2.js';
const RUNTIME_INTEGRATION = 'scripts/validate-county-runtime-integration.js';
const WORKFLOW = '.github/workflows/county-collapse-offline.yml';

const ALLOWED_FILES = [
  IMPLEMENTATION,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  RUNTIME_INTEGRATION,
  WORKFLOW
].sort();

const V1_RUNTIME_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js'
];

function git(args) {
  const result = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8'
  });
  if (result.error) throw result.error;
  return result;
}

function gitText(args, message) {
  const result = git(args);
  assert.strictEqual(result.status, 0, message + (result.stderr ? ': ' + result.stderr.trim() : ''));
  return result.stdout.trimEnd();
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function count(text, marker) {
  return text.split(marker).length - 1;
}

function constArrayBlock(text, name) {
  const startMarker = 'const ' + name + ' = [';
  const start = text.indexOf(startMarker);
  assert.ok(start >= 0, 'missing const array: ' + name);
  const end = text.indexOf('];', start);
  assert.ok(end > start, 'unterminated const array: ' + name);
  return text.slice(start, end + 2);
}

assert.strictEqual(gitText(['rev-parse', 'HEAD'], 'unable to read HEAD'), BASE, 'HEAD drifted from certified base');
assert.strictEqual(gitText(['rev-parse', 'HEAD^{tree}'], 'unable to read HEAD tree'), BASE_TREE, 'committed tree drifted from certified base');
assert.strictEqual(gitText(['branch', '--show-current'], 'unable to read branch'), BRANCH, 'wrong runtime branch');

ALLOWED_FILES.forEach(file => {
  assert.ok(fs.existsSync(path.join(ROOT, file)), 'required first-tranche file missing: ' + file);
});

const statusText = gitText(
  ['status', '--porcelain=v1', '--untracked-files=all'],
  'unable to inspect worktree status'
);
assert.ok(statusText, 'source edit produced no worktree changes');

const changed = statusText
  .split(/\r?\n/)
  .filter(Boolean)
  .map(line => line.slice(3))
  .sort();

assert.deepStrictEqual(
  changed,
  ALLOWED_FILES,
  'first tranche must modify exactly the authorized six files and no seventh file'
);

V1_RUNTIME_FILES.forEach(file => {
  const result = git(['diff', '--quiet', BASE, '--', file]);
  assert.strictEqual(result.status, 0, 'v1 runtime modification is prohibited: ' + file);
});

const runtimeIntegration = read(RUNTIME_INTEGRATION);
const baselineRuntimeIntegration = gitText(
  ['show', BASE + ':' + RUNTIME_INTEGRATION],
  'unable to read baseline county runtime integration validator'
);

[
  'POST_COUNTY_PRODUCTION_FILES',
  'COMPONENT_VALIDATORS'
].forEach(name => {
  assert.strictEqual(
    constArrayBlock(runtimeIntegration, name),
    constArrayBlock(baselineRuntimeIntegration, name),
    name + ' historical inventory must remain byte-exact'
  );
});

const inventoryName =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_V2_PRODUCTION_FILES';
const inventoryBlock = constArrayBlock(runtimeIntegration, inventoryName);
assert.strictEqual(
  (inventoryBlock.match(/'build\/apps-script-brand\/[^']+\.js'/g) || []).length,
  1,
  'v2 planner production inventory must contain exactly one file'
);
assert.strictEqual(
  count(inventoryBlock, "'" + IMPLEMENTATION + "'"),
  1,
  'v2 planner runtime must occur exactly once in its dedicated inventory'
);

[
  'absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2Entries',
  inventoryName + '.length',
  'certified property-source provenance planner v2 inventory must contain exactly one file',
  'certified property-source provenance planner v2 surface is exactly one explicitly allowlisted additive pure-planner file'
].forEach(marker => {
  assert.ok(runtimeIntegration.includes(marker), 'dedicated runtime integration marker missing: ' + marker);
});

const workflow = read(WORKFLOW);
const baselineWorkflow = gitText(
  ['show', BASE + ':' + WORKFLOW],
  'unable to read baseline workflow'
);

const designStep =
  'Validate absentee-owner classification persistence certified property-source provenance extension design v2';
assert.strictEqual(count(baselineWorkflow, designStep), 1, 'baseline design step must exist exactly once');
assert.strictEqual(count(workflow, designStep), 1, 'existing v2 design validation step must remain exactly once');

[
  'node --check ' + IMPLEMENTATION,
  'node --check ' + STATIC,
  'node --check ' + BEHAVIOR,
  'node --check ' + INTEGRATION
].forEach(marker => {
  assert.strictEqual(count(workflow, marker), 1, 'workflow syntax registration must occur exactly once: ' + marker);
});

const stepMarkers = [
  'Validate absentee-owner certified property-source provenance planner static v2',
  'Validate absentee-owner certified property-source provenance planner behavior v2',
  'Validate absentee-owner certified property-source provenance planner integration v2'
];
stepMarkers.forEach(marker => {
  assert.strictEqual(count(workflow, marker), 1, 'workflow execution step must occur exactly once: ' + marker);
});

[STATIC, BEHAVIOR, INTEGRATION].forEach(file => {
  assert.strictEqual(
    count(workflow, 'run: node ' + file),
    1,
    'workflow validator execution must occur exactly once: ' + file
  );
});

const implementation = read(IMPLEMENTATION);
[
  'SpreadsheetApp',
  'UrlFetchApp',
  'LockService',
  'REOS.Database',
  'REOS.AbsenteeOwnerClassificationEvidenceStore',
  'REOS.AbsenteeOwnerClassificationPersistenceExecutor',
  'REOS.AbsenteeOwnerClassificationBoundedRollout',
  'function reosAbsenteeOwner'
].forEach(marker => {
  assert.strictEqual(
    implementation.includes(marker),
    false,
    'pure planner contains prohibited dependency or execution surface: ' + marker
  );
});

assert.strictEqual(
  count(implementation, 'REOS.AbsenteeOwnerClassificationPersistencePlanner'),
  1,
  'v2 planner must reference the v1 planner namespace exactly once for canonical helpers'
);
assert.strictEqual(count(implementation, "'AOCE2-'"), 1, 'AOCE2 prefix declaration must occur exactly once');

console.log('ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_INTEGRATION_V2_VALID=true');
console.log('BASE_MAIN=' + BASE);
console.log('BASE_MAIN_TREE=' + BASE_TREE);
console.log('FIRST_TRANCHE_FILE_COUNT=6');
console.log('FIRST_TRANCHE_FILE_SET_EXACT=true');
console.log('NO_SEVENTH_FIRST_TRANCHE_FILE=true');
console.log('V1_RUNTIME_UNCHANGED=true');
console.log('POST_COUNTY_PRODUCTION_INVENTORY_UNCHANGED=true');
console.log('COMPONENT_VALIDATOR_INVENTORY_UNCHANGED=true');
console.log('V2_PLANNER_DEDICATED_RUNTIME_INVENTORY_EXACT=true');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('PURE_PLANNER_ONLY=true');
console.log('PRODUCTION_RPC=false');
console.log('PERSISTENCE_EXECUTION=false');
console.log('PRODUCTION_MUTATION=false');
