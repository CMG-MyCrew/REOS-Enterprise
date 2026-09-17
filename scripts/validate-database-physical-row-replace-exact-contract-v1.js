'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const DOC = path.join(
  ROOT,
  'docs/database-physical-row-replace-exact-contract-v1.md'
);

const DATABASE = path.join(
  ROOT,
  'build/apps-script-brand/Database.js'
);

const GROUP3_DOC = path.join(
  ROOT,
  'docs/county-code-violation-group3-zillow-restoration-executor-contract-v1.md'
);

const LEASE = path.join(
  ROOT,
  'build/apps-script-brand/CountyMutationExclusionLease.js'
);

const EXECUTOR = path.join(
  ROOT,
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js'
);

function fail(message) {
  throw new Error(message);
}

function requireFile(file, label) {
  if (!fs.existsSync(file)) {
    fail(label + ' is missing.');
  }

  return fs.readFileSync(
    file,
    'utf8'
  );
}

function requireText(text, token, label) {
  if (!text.includes(token)) {
    fail(
      label +
      ' missing required token: ' +
      token
    );
  }
}

function rejectText(text, token, label) {
  if (text.includes(token)) {
    fail(
      label +
      ' contains prohibited token: ' +
      token
    );
  }
}

function extractArray(text, variableName) {
  const pattern = new RegExp(
    '\\bvar\\s+' +
    variableName +
    '\\s*=\\s*\\[([\\s\\S]*?)\\];'
  );

  const match = text.match(pattern);

  if (!match) {
    fail(
      'Unable to locate array: ' +
      variableName
    );
  }

  const values = [];

  const itemPattern =
    /'([^']*)'/g;

  let item;

  while (
    (item = itemPattern.exec(match[1])) !==
    null
  ) {
    values.push(item[1]);
  }

  return values;
}

const doc =
  requireFile(
    DOC,
    'Full-row replacement design contract'
  );

const database =
  requireFile(
    DATABASE,
    'Database.js'
  );

const group3 =
  requireFile(
    GROUP3_DOC,
    'Group 3 executor contract'
  );

const lease =
  requireFile(
    LEASE,
    'County mutation-exclusion lease'
  );

if (fs.existsSync(EXECUTOR)) {
  fail(
    'Group 3 executor unexpectedly exists.'
  );
}

/*
 * The contract increment is design-only. The implementation
 * must remain absent at this gate.
 */
if (
  /\bfunction\s+replacePhysicalRowExact\s*\(/.test(
    database
  )
) {
  fail(
    'replacePhysicalRowExact implementation already exists.'
  );
}

if (
  /replacePhysicalRowExact\s*:/.test(
    database
  )
) {
  fail(
    'replacePhysicalRowExact is already exported.'
  );
}

/*
 * Existing exact mutation infrastructure must still exist.
 */
[
  'function validateLockContext_',
  'function withScriptLockContext',
  'function assertScriptLockContext',
  'function patchPhysicalRowCellsExact',
  'function deletePhysicalRowExact',
  'expectedHeaders',
  'expectedRowValues',
  'expectedRowFormulas',
  'expectedPostRowValues',
  'expectedPostRowFormulas',
  'canonicalizePhysicalDeleteValue_',
  'physicalDeleteCanonicalValuesEqual_',
  'PHYSICAL_PATCH_PRECONDITION_FAILED',
  'PHYSICAL_PATCH_OUTCOME_UNCERTAIN',
  'PHYSICAL_PATCH_VERIFIED'
].forEach(function (token) {
  requireText(
    database,
    token,
    'Database exact-mutation infrastructure'
  );
});

/*
 * The existing exact patch corridor must remain exact and
 * must not be widened for Group 3.
 */
const patchHeaders =
  extractArray(
    database,
    'PHYSICAL_PATCH_HEADERS_'
  );

const expectedPatchHeaders = [
  'Updated At',
  'Last Seen At',
  'Connector Run ID'
];

if (
  JSON.stringify(patchHeaders) !==
  JSON.stringify(expectedPatchHeaders)
) {
  fail(
    'PHYSICAL_PATCH_HEADERS_ changed from its certified three-header corridor.'
  );
}

/*
 * Existing Group 3 authority must still require a distinct
 * full-row primitive and prohibit widening the patch primitive.
 */
[
  'REOS.Database.replacePhysicalRowExact(sheetName, request, options)',
  'The existing exact-cell patch primitive MUST NOT be widened',
  'Before a Group 3 executor may exist, a separate certified full-row exact',
  'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false',
  'GROUP3_FULL_ROW_REPLACEMENT_AUTHORITY_GRANTED=false',
  'GROUP3_WRITER_REGISTRATION_AUTHORITY_GRANTED=false'
].forEach(function (token) {
  requireText(
    group3,
    token,
    'Merged Group 3 executor contract'
  );
});

/*
 * The future Group 3 writer still must not already be
 * registered at this design-only boundary.
 */
rejectText(
  lease,
  'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION',
  'County mutation-exclusion lease'
);

/*
 * Contract API and exact request surface.
 */
[
  'REOS.Database.replacePhysicalRowExact(sheetName, request, options)',
  '`spreadsheetId`',
  '`sheetId`',
  '`expectedRowNumber`',
  '`idField`',
  '`idValue`',
  '`expectedLastRow`',
  '`expectedLastColumn`',
  '`expectedMaxRows`',
  '`expectedMaxColumns`',
  '`expectedHeaders`',
  '`expectedRowValues`',
  '`expectedRowFormulas`',
  '`expectedPostRowValues`',
  '`expectedPostRowFormulas`',
  '`lockContext`'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract request surface'
  );
});

/*
 * Lock ownership and exact evidence requirements.
 */
[
  'The primitive acquires no lock itself.',
  'complete physical ID column',
  '`idValue` must occur exactly once',
  '`expectedRowNumber`',
  '`getValues()`',
  '`getFormulas()`',
  'exact caller-owned Database lock context',
  'This is the final definite no-write boundary.'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract authority boundary'
  );
});

/*
 * Formula safety is deliberately narrower than the broad
 * future executor requirement: v1 preserves existing formula
 * text but grants no formula-mutation authority.
 */
[
  'Version 1 grants no formula-mutation authority.',
  'must exactly equal:',
  'Existing formulas may therefore be preserved',
  'MUST NOT begin',
  'with `=`',
  'Any future authority to add, remove, or alter formulas requires a new contract'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract formula policy'
  );
});

/*
 * Exactly one full-row write and no rollback/retry after the
 * uncertain boundary.
 */
[
  '`candidateRange.setValues([replacementRow])`',
  'The primitive shall not call:',
  '`setValue()`',
  '`setFormulas()`',
  '`appendRow()`',
  '`deleteRow*()`',
  'The primitive shall not perform an automatic rollback.',
  'must never trigger a second write',
  'No automatic retry is permitted.',
  'No automatic rollback is permitted.'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract one-write boundary'
  );
});

/*
 * Outcome taxonomy.
 */
[
  'PHYSICAL_REPLACE_PRECONDITION_FAILED',
  'PHYSICAL_REPLACE_OUTCOME_UNCERTAIN',
  'PHYSICAL_REPLACE_VERIFIED'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract outcome taxonomy'
  );
});

/*
 * Full postimage verification.
 */
[
  'invoke `SpreadsheetApp.flush()`',
  'prove last-row, last-column, max-row, and max-column geometry unchanged',
  'rescan the complete physical ID column',
  'reread the complete target row values',
  'reread the complete target row formulas',
  'compare every formula against `expectedPostRowFormulas`'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract postimage verification'
  );
});

/*
 * Capability is not caller authority.
 */
[
  'Its existence does not authorize any caller to use it.',
  'shall not:',
  'call `REOS.Security.requireAdmin()`',
  'assert a county mutation-exclusion writer',
  'acquire or release ScriptLock',
  'create a public RPC',
  'mutate scheduler triggers',
  'mutate scheduler checkpoints',
  'insert rows',
  'delete rows',
  'rewrite downstream references'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract non-authority'
  );
});

/*
 * Group 3 must remain separately blocked.
 */
[
  'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION',
  'PAGE86_DUPLICATE_SOURCE_REPAIR',
  'must not be reused or treated as Group 3 authority'
].forEach(function (token) {
  requireText(
    doc,
    token,
    'Design contract Group 3 isolation'
  );
});

/*
 * Explicit authority markers must remain false.
 */
[
  'FULL_ROW_REPLACEMENT_IMPLEMENTATION_AUTHORITY_GRANTED=false',
  'DATABASE_MUTATION_AUTHORITY_GRANTED=false',
  'GROUP3_FULL_ROW_REPLACEMENT_AUTHORITY_GRANTED=false',
  'GROUP3_EXECUTOR_IMPLEMENTATION_AUTHORITY_GRANTED=false',
  'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false',
  'GROUP3_WRITER_REGISTRATION_AUTHORITY_GRANTED=false',
  'GROUP3_PUBLIC_RPC_AUTHORITY_GRANTED=false',
  'SCHEDULER_MUTATION_AUTHORITY_GRANTED=false',
  'CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false',
  'DEPLOYMENT_AUTHORITY_GRANTED=false',
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
].forEach(function (token) {
  requireText(
    doc,
    '`' + token + '`',
    'Design contract authority markers'
  );
});

console.log(
  'DATABASE_PHYSICAL_ROW_REPLACE_EXACT_CONTRACT_VALIDATOR_PASS=true'
);
console.log(
  'FULL_ROW_EXACT_REPLACEMENT_IMPLEMENTATION_PRESENT=false'
);
console.log(
  'EXISTING_PATCH_PRIMITIVE_REMAINS_EXACT_THREE_HEADERS=true'
);
console.log(
  'CALLER_OWNED_DATABASE_LOCK_CONTEXT_REQUIRED=true'
);
console.log(
  'FULL_PREIMAGE_VALUES_AND_FORMULAS_REQUIRED=true'
);
console.log(
  'FULL_POSTIMAGE_VALUES_AND_FORMULAS_REQUIRED=true'
);
console.log(
  'IDENTITY_IMMUTABILITY_REQUIRED=true'
);
console.log(
  'FORMULA_MUTATION_AUTHORITY_GRANTED=false'
);
console.log(
  'EXACTLY_ONE_FULL_ROW_SETVALUES_WRITE_REQUIRED=true'
);
console.log(
  'AUTOMATIC_ROLLBACK_AUTHORITY_GRANTED=false'
);
console.log(
  'AUTOMATIC_RETRY_AUTHORITY_GRANTED=false'
);
console.log(
  'GROUP3_EXECUTOR_IMPLEMENTATION_AUTHORITY_GRANTED=false'
);
console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);
