'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const cp = require('child_process');

const BASE =
  'd60cbea8622c94e8525310038ced2f54fb4f709f';

const AUTHORITY =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const PLAN =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const DISCOVERY =
  '754a9ec4100622207f5ea356045a1d1d3004781d542f73653092f4b4a3572ec3';

const CONTRACT =
  'docs/county-collapse-observation-preservation-contract-v1.md';

const WINNER =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const FULLROW =
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js';

const EXECUTOR =
  'docs/county-code-violation-collapse-executor-contract-v1.md';

const IMPLEMENTATION =
  'build/apps-script-brand/CountyCodeViolationCollapseObservationPreservation.js';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

function git(...args) {
  return cp
    .execFileSync(
      'git',
      args,
      {
        encoding: 'utf8'
      }
    )
    .trim();
}

function requireText(source, text, label) {
  assert.ok(
    source.includes(text),
    'Missing contract marker: ' + label
  );
}

function requireAll(source, values, prefix) {
  values.forEach((value) => {
    requireText(
      source,
      value,
      prefix + ': ' + value
    );
  });
}

assert.ok(
  fs.existsSync(CONTRACT),
  'Observation-preservation contract must exist.'
);

assert.ok(
  fs.existsSync(WINNER),
  'Winner plan must exist.'
);

assert.ok(
  fs.existsSync(FULLROW),
  'Full-row evidence reader must exist.'
);

assert.ok(
  fs.existsSync(EXECUTOR),
  'Executor design contract must exist.'
);

cp.execFileSync(
  'git',
  [
    'merge-base',
    '--is-ancestor',
    BASE,
    'HEAD'
  ],
  {
    stdio: 'ignore'
  }
);

const contract = read(CONTRACT);
const winner = read(WINNER);
const fullrow = read(FULLROW);
const executor = read(EXECUTOR);

requireAll(
  contract,
  [
    'OBSERVATION_PRESERVATION_CONTRACT_VERSION=1',
    'BASE_MAIN_SHA=' + BASE,
    'COLLAPSE_AUTHORITY_SHA=' + AUTHORITY,
    'WINNER_PLAN_FINGERPRINT=' + PLAN,
    'DISCOVERY_SHA=' + DISCOVERY,
    'OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22',
    'PRESERVATION_WRITE_FIELDS=Updated At,Last Seen At,Connector Run ID',
    'PRESERVATION_MUTATION_AUTHORITY=false',
    'RPC_AUTHORITY=false',
    'DEPLOYMENT_AUTHORITY=false',
    'PHYSICAL_DELETE_AUTHORITY=false',
    'PRODUCTION_MUTATION_AUTHORITY=false',
    'SCHEDULER_AUTHORITY=false',
    'CHECKPOINT_MUTATION_AUTHORITY=false',
    'CONNECTOR_EXECUTION_AUTHORITY=false',
    'AUTOMATIC_OFFER_AUTHORITY=false'
  ],
  'contract marker'
);

requireAll(
  contract,
  [
    '`Updated At`',
    '`Last Seen At`',
    '`Connector Run ID`',
    '`Source Record ID`',
    '`Source Record Key`',
    '`Source Observation Key`',
    '`Created At`',
    '`Distress Lead ID`'
  ],
  'discovered field'
);

requireAll(
  contract,
  [
    'PRESERVE_FROM_LATEST_OBSERVATION',
    'IMMUTABLE_SOURCE_AND_PROPERTY_IDENTITY',
    'IMMUTABLE_LINEAGE',
    'BUSINESS_EQUIVALENT_KEEP_WINNER',
    'Every current `DISTRESS_LEADS` header must resolve exactly once',
    'The three authorized preservation cells must be literal stored values.',
    'contains a formula, preservation v1 fails closed.',
    'Only the three authorized winner cells may be written.',
    'complete winner row',
    'complete latest-observation row',
    'receipt SHA-256',
    'persisted durably and read back successfully',
    'preservation-uncertain',
    'requires separately authorized read-only\nreconciliation'
  ],
  'mapping/receipt safety rule'
);

requireAll(
  contract,
  [
    'replace `Distress Lead ID`',
    'replace `Created At`',
    'copy `Source Record ID`',
    'copy `Source Record Key`',
    'copy `Source Observation Key`',
    'change canonical property identity',
    'change business values',
    'write any field outside the exact three-field preservation set',
    'delete or insert rows',
    'run connectors',
    'mutate checkpoints',
    'enable or run the county scheduler'
  ],
  'forbidden preservation surface'
);

requireText(
  winner,
  'MERGE_LATEST_OBSERVATION_THEN_COLLAPSE',
  'winner-plan observation action'
);

requireText(
  winner,
  '[17, 18, 19, 20, 21, 22]',
  'exact observation-preservation groups'
);

requireAll(
  winner,
  [
    "'Updated At': true",
    "'Last Seen At': true",
    "'Connector Run ID': true"
  ],
  'winner-plan provenance classification'
);

requireAll(
  executor,
  [
    'used a complete field mapping that is broader than the winner-plan summary',
    'captured exact winner preimage values and formulas',
    'written only the authorized preservation fields',
    'verified the exact winner postimage',
    'persisted and read back a preservation receipt/fingerprint',
    'left canonical property identity, lineage identity, and Distress Lead ID',
    'unchanged'
  ],
  'executor prerequisite'
);

assert.ok(
  !fullrow.includes('formulas:'),
  'Full-row evidence unexpectedly became formula-complete; contract discovery must be revisited.'
);

assert.ok(
  !fs.existsSync(IMPLEMENTATION),
  'Observation-preservation implementation must not exist at design-contract gate.'
);

const buildFiles =
  fs.readdirSync(
    'build/apps-script-brand'
  );

const rpcPattern =
  /reosCountyCodeViolationCollapseObservationPreserv/i;

for (const file of buildFiles) {
  if (!file.endsWith('.js')) {
    continue;
  }

  const source =
    read(
      'build/apps-script-brand/' +
      file
    );

  assert.ok(
    !rpcPattern.test(source),
    'Observation-preservation RPC must not exist at design-contract gate: ' +
      file
  );
}

const trackedChanges =
  git(
    'diff',
    '--name-only',
    BASE + '...HEAD'
  )
    .split('\n')
    .filter(Boolean);

const workingChanges =
  git(
    'diff',
    '--name-only'
  )
    .split('\n')
    .filter(Boolean);

const stagedChanges =
  git(
    'diff',
    '--cached',
    '--name-only'
  )
    .split('\n')
    .filter(Boolean);

const untracked =
  git(
    'ls-files',
    '--others',
    '--exclude-standard'
  )
    .split('\n')
    .filter(Boolean);

const allowed = new Set([
  CONTRACT,
  'scripts/validate-county-collapse-observation-preservation-contract-v1.js'
]);

[
  ...trackedChanges,
  ...workingChanges,
  ...stagedChanges,
  ...untracked
].forEach((path) => {
  assert.ok(
    allowed.has(path),
    'Unexpected design-gate file scope: ' +
      path
  );
});

const contractSha =
  sha256(contract);

console.log(
  'OBSERVATION_PRESERVATION_CONTRACT_SHA256=' +
    contractSha
);

console.log(
  'OBSERVATION_PRESERVATION_GROUPS=17,18,19,20,21,22'
);

console.log(
  'OBSERVATION_PRESERVATION_WRITE_FIELDS=Updated At,Last Seen At,Connector Run ID'
);

console.log(
  'OBSERVATION_PRESERVATION_IMMUTABLE_SOURCE_FIELDS=Source Record ID,Source Record Key,Source Observation Key'
);

console.log(
  'OBSERVATION_PRESERVATION_IMMUTABLE_LINEAGE_FIELDS=Created At,Distress Lead ID'
);

console.log(
  'OBSERVATION_PRESERVATION_BUSINESS_DIFF_FIELDS=NONE'
);

console.log(
  'OBSERVATION_PRESERVATION_CONTRACT_VALIDATION_PASSED=true'
);
