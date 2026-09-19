#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const cp = require('node:child_process');

const BASE =
  '63375a9ef9e5e4fb96484e3f123e7dc4fda2a39a';

const DOC =
  'docs/county-code-violation-collapse-postdelete-repeatability-contract-v1.md';

const SELF =
  'scripts/validate-county-code-violation-collapse-postdelete-repeatability-contract-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const HANDOFF_DOC =
  'docs/county-code-violation-collapse-executor-maintenance-handoff-v1.md';

const HANDOFF_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-executor-maintenance-handoff-v1.js';

const FULLROW =
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js';

const FULLROW_VALIDATOR =
  'scripts/validate-county-code-violation-collapse-fullrow-evidence-v2.js';

const WINNER =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js';

const INTENT =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const MAINT_OPERATOR =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const FUTURE_AUTHORITY =
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js';

const FUTURE_RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const FUTURE_PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

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
      encoding: 'utf8'
    }
  );
}

function gitText(args) {
  const result = git(args);

  assert.strictEqual(
    result.status,
    0,
    'Git command failed: git ' +
      args.join(' ') +
      '\n' +
      String(result.stderr || '')
  );

  return String(result.stdout || '').trim();
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

function sha256GitFile(ref, path) {
  const result =
    git([
      'show',
      ref + ':' + path
    ]);

  assert.strictEqual(
    result.status,
    0,
    'Unable to read baseline file: ' + path
  );

  return sha256(
    result.stdout
  );
}

function requireText(text, marker, label) {
  assert.ok(
    text.includes(marker),
    label + ' missing: ' + marker
  );
}

function lines(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

console.log(
  '=== COLLAPSE POST-DELETE REPEATABILITY CONTRACT V1 ==='
);

assert.strictEqual(
  gitText([
    'merge-base',
    BASE,
    'HEAD'
  ]),
  BASE,
  'Design branch must descend from exact certified source authority.'
);

[
  DOC,
  SELF,
  WORKFLOW,
  HANDOFF_DOC,
  HANDOFF_VALIDATOR,
  FULLROW,
  FULLROW_VALIDATOR,
  WINNER,
  PREFLIGHT,
  INTENT
].forEach(path => {
  assert.ok(
    fs.existsSync(path),
    'Required repeatability artifact missing: ' + path
  );
});

/*
 * Historical source remains byte-exact in this design increment.
 */
[
  HANDOFF_DOC,
  HANDOFF_VALIDATOR,
  FULLROW,
  FULLROW_VALIDATOR,
  WINNER,
  PREFLIGHT,
  INTENT
].forEach(path => {
  assert.strictEqual(
    sha256File(path),
    sha256GitFile(BASE, path),
    'Historical artifact changed during repeatability design: ' + path
  );
});

assert.strictEqual(
  fs.existsSync(EXECUTOR),
  false,
  'Executor source must remain absent.'
);

assert.strictEqual(
  fs.existsSync(MAINT_OPERATOR),
  false,
  'Maintenance operator source must remain absent.'
);

[
  FUTURE_AUTHORITY,
  FUTURE_RESIDUAL,
  FUTURE_PREFLIGHT
].forEach(path => {
  assert.strictEqual(
    fs.existsSync(path),
    false,
    'Successor repeatability runtime must remain absent in design increment: ' +
      path
  );
});

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const fullrow =
  fs.readFileSync(
    FULLROW,
    'utf8'
  );

const fullrowValidator =
  fs.readFileSync(
    FULLROW_VALIDATOR,
    'utf8'
  );

const winner =
  fs.readFileSync(
    WINNER,
    'utf8'
  );

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

const intent =
  fs.readFileSync(
    INTENT,
    'utf8'
  );

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

/*
 * Prove the current repeatability conflict remains exactly present.
 */
requireText(
  fullrow,
  'Certified collapse cohort drift: physical row mismatch for ',
  'Historical full-row physical-row guard'
);

requireText(
  fullrow,
  'Certified collapse cohort is incomplete; missing ',
  'Historical full-row population guard'
);

requireText(
  fullrowValidator,
  '/physical row mismatch/',
  'Historical row-shift failure-path validator'
);

requireText(
  fullrowValidator,
  '/Certified collapse cohort is incomplete/',
  'Historical missing-row failure-path validator'
);

requireText(
  winner,
  'CountyCodeViolationCollapseFullRowEvidence',
  'Historical winner-plan dependency'
);

requireText(
  winner,
  '.exportEvidence({})',
  'Historical winner-plan full-row read'
);

requireText(
  preflight,
  'var winnerPlan =',
  'Historical execution preflight'
);

requireText(
  preflight,
  'assertWinnerPlan_();',
  'Historical execution preflight winner rebuild'
);

requireText(
  preflight,
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'Current executor blocker'
);

/*
 * Current operation-intent API can classify a known ID but cannot enumerate.
 */
requireText(
  intent,
  'function read(operationId)',
  'Operation-intent strict read API'
);

requireText(
  intent,
  'function recover(operationId)',
  'Operation-intent recovery API'
);

assert.strictEqual(
  intent.includes(
    'listOperationIds'
  ),
  false,
  'Operation-ID enumeration must not exist in the design increment.'
);

/*
 * Contract markers and successor topology.
 */
[
  'POSTDELETE_REPEATABILITY_CONTRACT_VERSION=1',
  'SOURCE_AUTHORITY_SHA=' + BASE,
  'POST_DELETE_REPEATABILITY_CONFLICT_CERTIFIED=true',
  'HISTORICAL_FULLROW_MODE=INITIAL_PREDELETE_ONLY',
  'HISTORICAL_WINNER_PLAN_MODE=INITIAL_PREDELETE_ONLY',
  'HISTORICAL_EXECUTION_PREFLIGHT_MODE=INITIAL_PREDELETE_ONLY',
  'INTENT_OPERATION_ID_ENUMERATION_REQUIRED=true',
  'INTENT_OPERATION_ID_ENUMERATION_READ_ONLY=true',
  'SECOND_OPERATION_INTENT_STORE_AUTHORIZED=false',
  'DIRECT_KEEP_EXECUTION_AUTHORITY_REQUIRED=true',
  'RESIDUAL_EVIDENCE_REQUIRED=true',
  'SUCCESSOR_EXECUTION_PREFLIGHT_REQUIRED=true',
  'ORIGINAL_AUTHORITY_SHA_IMMUTABLE=true',
  'ORIGINAL_WINNER_PLAN_FINGERPRINT_IMMUTABLE=true',
  'CURRENT_PHYSICAL_ROW_IS_EVIDENCE_NOT_IMMUTABLE_AUTHORITY=true',
  'MISSING_CERTIFIED_ID_REQUIRES_VERIFIED_DELETE_JOURNAL=true',
  'VERIFIED_DELETED_ID_REAPPEARANCE_FAILS_CLOSED=true',
  'UNCERTAIN_DELETE_HISTORY_BLOCKS_FURTHER_COLLAPSE=true',
  'CALLER_SUPPLIED_DELETED_ID_AUTHORITY=false',
  'DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16',
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false',
  'HANDOFF_VALIDATOR_CI_MODE=SYNTAX_ONLY',
  'COLLAPSE_EXECUTION_AUTHORITY=false',
  'PHYSICAL_DELETE_AUTHORITY=false',
  'DEPLOYMENT_AUTHORITY=false',
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false',
  'SCHEDULER_RESTORATION_AUTHORITY=false',
  'AUTOMATIC_OFFER_AUTHORITY=false',
  'listOperationIds()',
  'CountyCodeViolationCollapseDirectKeepExecutionAuthority.js',
  'CountyCodeViolationCollapseResidualEvidence.js',
  'CountyCodeViolationCollapseExecutionPreflightV2.js',
  'VERIFIED_SUCCESS_JOURNAL',
  'COLLAPSE_DELETE_VERIFIED'
].forEach(marker => {
  requireText(
    doc,
    marker,
    'Repeatability design contract'
  );
});

/*
 * Completed maintenance-handoff design moves to syntax-only.
 */
assert.strictEqual(
  workflow.split(HANDOFF_VALIDATOR).length - 1,
  1,
  'Completed maintenance-handoff validator must be syntax-only.'
);

requireText(
  workflow,
  'node --check ' + HANDOFF_VALIDATOR,
  'Maintenance-handoff syntax preservation'
);

assert.strictEqual(
  workflow.includes(
    'run: node ' + HANDOFF_VALIDATOR
  ),
  false,
  'Completed maintenance-handoff validator must not remain active.'
);

/*
 * New successor design validator is syntax-checked and active exactly once.
 */
assert.strictEqual(
  workflow.split(SELF).length - 1,
  2,
  'Repeatability validator must appear exactly twice in CI.'
);

requireText(
  workflow,
  'node --check ' + SELF,
  'Repeatability validator syntax registration'
);

requireText(
  workflow,
  'run: node ' + SELF,
  'Repeatability validator execution registration'
);

/*
 * Design increment scope remains exactly three files.
 */
const effectiveScope =
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
      effectiveScope.add(path);
    });
});

assert.deepStrictEqual(
  Array.from(effectiveScope).sort(),
  EXPECTED_SCOPE,
  'Repeatability design increment must remain exactly three files.'
);

assert.strictEqual(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Design candidate must not contain staged changes.'
);

console.log(
  'PASS: post-delete repeatability conflict remains proven without weakening historical evidence.'
);

console.log(
  'PASS: historical full-row reader, winner plan, preflight and intent journal remain byte-exact.'
);

console.log(
  'PASS: operation-intent enumeration is defined only as a future read-only extension.'
);

console.log(
  'PASS: successor residual evidence requires verified journal history for every legitimately missing certified ID.'
);

console.log(
  'PASS: current physical row becomes fresh evidence rather than immutable post-delete authority.'
);

console.log(
  'PASS: Groups 17 through 22 remain outside implementation authority.'
);

console.log(
  'POSTDELETE_REPEATABILITY_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'REPEATABILITY_RUNTIME_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'EXECUTOR_IMPLEMENTATION_AUTHORIZED=false'
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
  'SCHEDULER_RESTORATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
