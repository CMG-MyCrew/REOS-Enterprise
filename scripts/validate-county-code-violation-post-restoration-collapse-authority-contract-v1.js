'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const docPath = path.join(
  root,
  'docs/county-code-violation-post-restoration-collapse-authority-v1.md'
);

const workflowPath = path.join(
  root,
  '.github/workflows/county-collapse-offline.yml'
);

const authorityPath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js'
);

const fullRowPath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js'
);

const winnerPath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js'
);

const preflightPath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js'
);

const leasePath = path.join(
  root,
  'build/apps-script-brand/CountyMutationExclusionLease.js'
);

for (const file of [
  docPath,
  workflowPath,
  authorityPath,
  fullRowPath,
  winnerPath,
  preflightPath,
  leasePath
]) {
  assert.ok(
    fs.existsSync(file),
    'Required file missing: ' + file
  );
}

const doc = fs.readFileSync(docPath, 'utf8');
const workflow = fs.readFileSync(workflowPath, 'utf8');

function requires(fragment) {
  assert.ok(
    doc.includes(fragment),
    'Design contract missing: ' + fragment
  );
}

[
  'POST_RESTORATION_COLLAPSE_AUTHORITY_V1',

  'POST_RESTORATION_GROUP_COUNT=21',
  'POST_RESTORATION_ROW_COUNT=44',

  'POST_RESTORATION_ELIGIBLE_GROUP_COUNT=20',
  'POST_RESTORATION_ELIGIBLE_ROW_COUNT=42',

  'POST_RESTORATION_DIRECT_KEEP_GROUP_COUNT=14',
  'POST_RESTORATION_OBSERVATION_MERGE_GROUP_COUNT=6',
  'POST_RESTORATION_DELETE_CANDIDATE_ROW_COUNT=22',

  'POST_RESTORATION_BLOCKED_GROUP_COUNT=1',
  'POST_RESTORATION_CONFLICT_BLOCKED_GROUP=1',
  'POST_RESTORATION_REFERENCE_BLOCKED_GROUP=NONE',

  'DL-20260820181647-4170',
  'ZIL-20260820193920-1756',

  'row 767',
  'row 771',
  'row 38 / column 13',

  'requested ID count: `44`',
  'zero downstream references',

  'Group numbers must not be renumbered',

  'CountyCodeViolationCollapseOnlyEvidenceAuthority.js',
  'CountyCodeViolationCollapseFullRowEvidence.js',
  'CountyCodeViolationCollapseWinnerPlan.js',
  'CountyCodeViolationCollapseExecutionPreflight.js',
  'CountyMutationExclusionLease.js',

  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee',
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9',

  'must not merely replace the two constants',
  'historical CLOSED',
  'historical expired',
  'active, unexpired historical-authority lease',

  'GROUP3_REEXECUTION_REQUIRED=false',
  'GROUP3_REEXECUTION_AUTHORITY_GRANTED=false',

  'COLLAPSE_EXECUTION_READY=false',
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false',

  'SCHEDULER_REINSTALL_AUTHORITY_GRANTED=false',

  'POST_RESTORATION_COLLAPSE_AUTHORITY_DESIGN_ONLY=true',
  'POST_RESTORATION_COLLAPSE_IMPLEMENTATION_PRESENT=false',
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false',
  'COLLAPSE_AUTHORITY_GRANTED=false',
  'WINNER_SELECTION_AUTHORITY_GRANTED=false',
  'DELETE_AUTHORITY_GRANTED=false',
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false',
  'REFERENCE_REWRITE_AUTHORITY_GRANTED=false',
  'SCHEDULER_MUTATION_AUTHORITY_GRANTED=false',
  'CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false',
  'CONNECTOR_EXECUTION_AUTHORITY_GRANTED=false',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
].forEach(requires);

/*
 * Design-only means existing runtime authority MUST remain untouched
 * in this increment.
 */
const authority = fs.readFileSync(authorityPath, 'utf8');
const fullRow = fs.readFileSync(fullRowPath, 'utf8');
const winner = fs.readFileSync(winnerPath, 'utf8');
const preflight = fs.readFileSync(preflightPath, 'utf8');
const lease = fs.readFileSync(leasePath, 'utf8');

assert.ok(
  authority.includes('groupCount: 22'),
  'Design increment unexpectedly changed runtime group count.'
);

assert.ok(
  authority.includes('rowCount: 46'),
  'Design increment unexpectedly changed runtime row count.'
);

assert.ok(
  fullRow.includes('var EXPECTED_GROUP_COUNT = 22;'),
  'Design increment unexpectedly changed full-row group authority.'
);

assert.ok(
  fullRow.includes('var EXPECTED_ROW_COUNT = 46;'),
  'Design increment unexpectedly changed full-row row authority.'
);

assert.ok(
  winner.includes('var EXPECTED_GROUP_COUNT = 22;'),
  'Design increment unexpectedly changed winner-plan group authority.'
);

assert.ok(
  winner.includes('var EXPECTED_ROW_COUNT = 46;'),
  'Design increment unexpectedly changed winner-plan row authority.'
);

assert.ok(
  winner.includes('var REFERENCE_BLOCKED_GROUP = 3;'),
  'Design increment unexpectedly changed Group 3 runtime classification.'
);

const oldAuthority =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const oldFingerprint =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

assert.ok(
  preflight.includes(oldAuthority),
  'Design increment unexpectedly changed preflight authority SHA.'
);

assert.ok(
  preflight.includes(oldFingerprint),
  'Design increment unexpectedly changed preflight winner fingerprint.'
);

assert.ok(
  lease.includes(oldAuthority),
  'Design increment unexpectedly changed lease authority SHA.'
);

assert.ok(
  lease.includes(oldFingerprint),
  'Design increment unexpectedly changed lease winner fingerprint.'
);

/*
 * CI registration is part of the design increment.
 */
const validatorRel =
  'scripts/validate-county-code-violation-post-restoration-collapse-authority-contract-v1.js';

assert.ok(
  workflow.includes(
    'node --check ' + validatorRel
  ),
  'Design validator syntax check is not registered in CI.'
);

assert.ok(
  workflow.includes(
    'run: node ' + validatorRel
  ),
  'Design validator execution is not registered in CI.'
);

console.log(
  'POST_RESTORATION_COLLAPSE_AUTHORITY_DESIGN_VALIDATOR_PASS=true'
);

console.log(
  'POST_RESTORATION_GROUP_COUNT=21'
);

console.log(
  'POST_RESTORATION_ROW_COUNT=44'
);

console.log(
  'POST_RESTORATION_ELIGIBLE_GROUP_COUNT=20'
);

console.log(
  'POST_RESTORATION_ELIGIBLE_ROW_COUNT=42'
);

console.log(
  'POST_RESTORATION_DELETE_CANDIDATE_ROW_COUNT=22'
);

console.log(
  'POST_RESTORATION_BLOCKED_GROUP_COUNT=1'
);

console.log(
  'RUNTIME_IMPLEMENTATION_CHANGED=false'
);

console.log(
  'GROUP3_REEXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
