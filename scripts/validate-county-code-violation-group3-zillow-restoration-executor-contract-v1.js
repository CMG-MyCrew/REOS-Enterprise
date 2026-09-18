#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DOC =
  'docs/county-code-violation-group3-zillow-restoration-executor-contract-v1.md';

const GROUP3 =
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationContract.js';

const PAGE86 =
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const FUTURE_EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js';

const OPERATOR =
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationOperator.js';

const OPERATOR_RPC =
  'reosCountyCodeViolationGroup3ZillowRestorationExecute';

const EVIDENCE_FILE =
  'CountyCodeViolationGroup3PostRestorationEvidence.js';

const EVIDENCE_RPC =
  'reosCountyCodeViolationGroup3PostRestorationEvidence';

const FUTURE_WRITER =
  'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function requireText(source, token, label) {
  assert.ok(
    source.includes(token),
    label + ' missing: ' + token
  );
}

console.log(
  '=== GROUP 3 ZILLOW RESTORATION EXECUTOR CONTRACT V1 ==='
);

[
  DOC,
  GROUP3,
  PAGE86,
  DATABASE,
  LEASE,
  FUTURE_EXECUTOR,
  OPERATOR
].forEach(file => {
  assert.ok(
    fs.existsSync(file),
    'Required contract authority surface missing: ' + file
  );
});

assert.equal(
  fs.existsSync(FUTURE_EXECUTOR),
  true,
  'Group 3 executor implementation is missing'
);

const doc = read(DOC);
const group3 = read(GROUP3);
const page86 = read(PAGE86);
const database = read(DATABASE);
const lease = read(LEASE);
const executor = read(FUTURE_EXECUTOR);
const operator = read(OPERATOR);

[
  'DESIGN ONLY',
  'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION',
  'PAGE86_DUPLICATE_SOURCE_REPAIR',
  'MUST NOT be reused',
  'REOS.Database.replacePhysicalRowExact(sheetName, request, options)',
  'This contract does not implement that API.',
  'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false',
  'GROUP3_FULL_ROW_REPLACEMENT_AUTHORITY_GRANTED=false',
  'GROUP3_WRITER_REGISTRATION_AUTHORITY_GRANTED=false',
  'GROUP3_PUBLIC_RPC_AUTHORITY_GRANTED=false',
  'REFERENCE_REWRITE_AUTHORITY_GRANTED=false',
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false',
  'SCHEDULER_MUTATION_AUTHORITY_GRANTED=false',
  'CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false',
  'DEPLOYMENT_AUTHORITY_GRANTED=false',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
].forEach(token => {
  requireText(
    doc,
    token,
    'Executor design contract'
  );
});

/*
 * Existing merged Group 3 contract remains pure authority data.
 */
[
  '.setValue(',
  '.setValues(',
  'patchPhysicalRowCellsExact',
  'deletePhysicalRowExact',
  'withScriptLockContext',
  'assertWriterAllowed',
  'requireAdmin'
].forEach(token => {
  assert.equal(
    group3.includes(token),
    false,
    'Merged Group 3 contract unexpectedly contains execution surface: ' +
      token
  );
});

assert.equal(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(group3),
  false,
  'Merged Group 3 contract unexpectedly exposes public RPC'
);

requireText(
  group3,
  'COUNTY_CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION_V1',
  'Merged Group 3 contract identity'
);

requireText(
  group3,
  'DL-20260820181647-4170',
  'County survivor authority'
);

requireText(
  group3,
  'ZIL-20260820193920-1756',
  'Zillow restoration authority'
);

/*
 * Page-86 is precedent only, never Group 3 authority.
 */
requireText(
  page86,
  'function zillowProjection_',
  'Page-86 Zillow projection precedent'
);

requireText(
  page86,
  'function zillowTargetRecord_',
  'Page-86 Zillow target precedent'
);

requireText(
  page86,
  "writerId: 'PAGE86_DUPLICATE_SOURCE_REPAIR'",
  'Page-86 protected writer identity'
);

requireText(
  page86,
  'withScriptLockContext',
  'Page-86 ScriptLock precedent'
);

requireText(
  page86,
  '.setValues(values)',
  'Page-86 full-row write precedent'
);

assert.equal(
  page86.includes(
    "writerId: '" + FUTURE_WRITER + "'"
  ),
  false,
  'Page-86 must never claim the future Group 3 writer identity'
);

/*
 * Existing physical-cell patch capability is intentionally too narrow.
 */
const headerMatch = database.match(
  /var\s+PHYSICAL_PATCH_HEADERS_\s*=\s*\[([\s\S]*?)\];/
);

assert.ok(
  headerMatch,
  'Database physical patch header authority missing'
);

const patchHeaders = [];

for (
  const match of
  headerMatch[1].matchAll(/'([^']+)'/g)
) {
  patchHeaders.push(match[1]);
}

assert.deepEqual(
  patchHeaders,
  [
    'Updated At',
    'Last Seen At',
    'Connector Run ID'
  ],
  'Physical patch authority changed; executor contract requires rediscovery'
);

assert.equal(
  /\bfunction\s+replacePhysicalRowExact\s*\(/.test(database),
  true,
  'Full-row exact replacement primitive is missing'
);

assert.equal(
  /replacePhysicalRowExact\s*:\s*replacePhysicalRowExact/.test(database),
  true,
  'Full-row exact replacement primitive export is missing'
);

/*
 * A contract identifier is not a protected writer identity.
 * The future writer must not yet exist in production authority.
 */
assert.equal(
  lease.includes(FUTURE_WRITER),
  true,
  'Group 3 protected writer is missing from lease'
);

assert.equal(
  new RegExp(
    "writerId\\s*:\\s*['\\\"]" +
    FUTURE_WRITER +
    "['\\\"]"
  ).test(group3),
  false,
  'Merged Group 3 contract unexpectedly owns writer authority'
);

/*
 * Implemented executor remains bounded and non-public.
 */
[
  'REOS.Database.replacePhysicalRowExact',
  'REOS.Database.withScriptLockContext',
  'REOS.Database.assertScriptLockContext',
  'REOS.CountyMutationExclusionLease',
  'assertWriterAllowed',
  'REOS.Security',
  'requireAdmin',
  'GROUP3_RESTORATION_PRECONDITION_FAILED',
  'GROUP3_RESTORATION_OUTCOME_UNCERTAIN'
].forEach(token => {
  requireText(
    executor,
    token,
    'Group 3 executor implementation'
  );
});

requireText(
  executor,
  FUTURE_WRITER,
  'Group 3 executor protected writer identity'
);

assert.equal(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(executor),
  false,
  'Group 3 executor implementation must expose no public RPC'
);

[
  '.setValue(',
  '.setValues(',
  '.deleteRow(',
  '.deleteRows(',
  '.appendRow(',
  '.clearContent(',
  'patchPhysicalRowCellsExact(',
  'deletePhysicalRowExact('
].forEach(token => {
  assert.equal(
    executor.includes(token),
    false,
    'Group 3 executor contains prohibited mutation surface: ' + token
  );
});

/*
 * No hidden Group 3 executor may exist.
 * The only public Group 3 RPC is the separately contracted operator
 * transport entrypoint.
 */
const buildDir =
  'build/apps-script-brand';

const buildSources =
  fs.readdirSync(buildDir)
    .filter(name => name.endsWith('.js'))
    .map(name => ({
      name,
      source: read(path.join(buildDir, name))
    }));

const writerOwners =
  buildSources.filter(entry =>
    new RegExp(
      "writerId\\s*:\\s*['\\\"]" +
      FUTURE_WRITER +
      "['\\\"]"
    ).test(entry.source)
  );

assert.equal(
  writerOwners.length,
  1,
  'Group 3 writer must have exactly one implementation owner'
);

assert.equal(
  writerOwners[0].name,
  'CountyCodeViolationGroup3ZillowRestorationExecutor.js',
  'Group 3 writer owner must be the dedicated executor'
);

const group3Rpcs =
  buildSources.flatMap(entry => {
    const matches = [
      ...entry.source.matchAll(
        /\bfunction\s+(reos[A-Za-z0-9_]*Group3[A-Za-z0-9_]*)\s*\(/g
      )
    ];

    return matches.map(match => ({
      file: entry.name,
      rpc: match[1]
    }));
  });

const sortedGroup3Rpcs =
  group3Rpcs
    .slice()
    .sort(function (left, right) {
      return (
        left.file +
        ':' +
        left.rpc
      ).localeCompare(
        right.file +
        ':' +
        right.rpc
      );
    });

assert.deepEqual(
  sortedGroup3Rpcs,
  [
    {
      file:
        EVIDENCE_FILE,
      rpc:
        EVIDENCE_RPC
    },
    {
      file:
        'CountyCodeViolationGroup3ZillowRestorationOperator.js',
      rpc:
        OPERATOR_RPC
    }
  ],
  'Group 3 public RPC inventory must contain exactly one read-only evidence RPC and one separately contracted executable operator RPC'
);

const evidenceOwners =
  buildSources.filter(
    entry =>
      entry.name ===
      EVIDENCE_FILE
  );

assert.equal(
  evidenceOwners.length,
  1,
  'Group 3 read-only evidence RPC must have exactly one implementation owner'
);

requireText(
  evidenceOwners[0].source,
  'function ' + EVIDENCE_RPC + '(',
  'Group 3 read-only evidence public RPC'
);

[
  'CountyCodeViolationGroup3ZillowRestorationExecutor',
  'REOS.Database.replacePhysicalRowExact',
  'REOS.Database.patchPhysicalRowCellsExact',
  'REOS.Database.deletePhysicalRowExact',
  '.setValue(',
  '.setValues(',
  '.appendRow(',
  '.deleteRow(',
  '.deleteRows('
].forEach(token => {
  assert.equal(
    evidenceOwners[0].source.includes(token),
    false,
    'Group 3 read-only evidence RPC contains prohibited execution surface: ' +
      token
  );
});

requireText(
  operator,
  'function ' + OPERATOR_RPC + '(options)',
  'Group 3 operator public RPC'
);

requireText(
  operator,
  'REOS.Security.requireAdmin();',
  'Group 3 operator Admin boundary'
);

requireText(
  operator,
  '.CountyCodeViolationGroup3ZillowRestorationExecutor',
  'Group 3 operator executor delegation'
);

[
  'REOS.Database',
  'CountyMutationExclusionLease',
  'LockService',
  '.setValue(',
  '.setValues(',
  '.deleteRow(',
  '.deleteRows('
].forEach(token => {
  assert.equal(
    operator.includes(token),
    false,
    'Group 3 operator contains prohibited direct execution surface: ' +
      token
  );
});

console.log(
  'GROUP3_EXECUTOR_CONTRACT_DESIGN_VALIDATION_PASSED=true'
);

console.log(
  'GROUP3_CURRENT_CONTRACT_DESIGN_ONLY=true'
);

console.log(
  'PAGE86_RESTORATION_PRECEDENT_PRESENT=true'
);

console.log(
  'PAGE86_WRITER_REUSE_PROHIBITED=true'
);

console.log(
  'PHYSICAL_PATCH_PRIMITIVE_SUITABLE_FOR_FULL_RESTORATION=false'
);

console.log(
  'FULL_ROW_EXACT_REPLACEMENT_PRIMITIVE_REQUIRED=true'
);

console.log(
  'FULL_ROW_EXACT_REPLACEMENT_PRIMITIVE_PRESENT=true'
);

console.log(
  'EXISTING_GROUP3_PROTECTED_WRITER_ID=true'
);

console.log(
  'GROUP3_EXECUTOR_IMPLEMENTATION_PRESENT=true'
);

console.log(
  'GROUP3_PUBLIC_RPC_PRESENT=true'
);


console.log(
  'GROUP3_READ_ONLY_EVIDENCE_RPC_PRESENT=true'
);

console.log(
  'GROUP3_GLOBAL_PUBLIC_RPC_COUNT=2'
);

console.log(
  'GROUP3_PUBLIC_RPC_AUTHORITY_GRANTED=false'
);

console.log(
  'FUTURE_GROUP3_WRITER_ID=' + FUTURE_WRITER
);

console.log(
  'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
