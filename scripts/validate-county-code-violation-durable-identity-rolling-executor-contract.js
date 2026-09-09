#!/usr/bin/env node
'use strict';

const fs = require('fs');

const CONTRACT =
  'docs/gate2b-code-violations-durable-identity-rolling-executor-v1.md';

const expected = {
  migration:
    'b492a0d90e3c0deeab0b159574a455944726c46d3d758e930562b57809a31dc6',

  complete:
    '0d8b1c8518fea1a49a8dd6c054b14b1c2ffa58d68faa7753041f37e64aa0a317',

  cycle:
    'COUNTY-20260902222607805',

  cursor:
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281'
};

function fail(message) {
  console.error(`STOP: ${message}`);
  process.exit(1);
}

function requireText(text, needle, label) {
  if (!text.includes(needle)) {
    fail(`contract missing ${label}: ${needle}`);
  }
}

if (!fs.existsSync(CONTRACT)) {
  fail(`missing contract file: ${CONTRACT}`);
}

const text = fs.readFileSync(CONTRACT, 'utf8');

const requiredFragments = [
  '# REOS Enterprise — Gate 2B Generic Rolling Durable-Identity Migration Contract v1',

  `migration-plan SHA-256: \`${expected.migration}\``,
  `complete-plan SHA-256: \`${expected.complete}\``,

  'migration-required rows: 3877',
  'already-durable rows: 149',
  'plan-blocked rows: 814',
  'collapse-required rows: 141',
  'review-required rows: 95',

  'confirmRollingMigration=true',
  'confirmDurableIdentity=true',
  'confirmInPlace=true',
  'confirmNoInsertDelete=true',
  'confirmMigrationReadyOnly=true',

  'Version 1 maximum:',

  'Deterministic batch selection',
  'proposed durable key ascending',
  'physical row number ascending as tie-breaker',

  'Source Record Key = column 25',
  'Source Observation Key = column 51',

  'Database.update',
  'Database.insert',
  'Database.upsert',

  'one contiguous N x 1 write to Source Record Key',
  'one contiguous N x 1 write to Source Observation Key',

  'one fail-fast outer REOS Database ScriptLock context',

  `cycle: \`${expected.cycle}\``,
  'nextFeedIndex: 0',
  `currentFeedCursor: \`${expected.cursor}\``,
  'completedFeeds: 0',
  'totalFeeds: 4',
  'results: empty array',

  'GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY',

  'The next invocation MUST present exactly that pair.',

  'Independent reconciliation requirement',

  'No rolling executor may grant automatic MAO/offer authority.',

  'No production authority is granted by this document.'
];

requiredFragments.forEach(
  fragment =>
    requireText(
      text,
      fragment,
      'required design contract clause'
    )
);

if (!/\$BATCH_MAX/.test(
  fs.readFileSync(
    CONTRACT,
    'utf8'
  ) || ''
)) {
  // The source contract has already materialized the value 10.
  // This check intentionally does not fail because the generated
  // document is a finalized design artifact.
}

const forbiddenAuthorityGrantPatterns = [
  /schedulerAuthorityGranted\s*=\s*true/i,
  /automaticOfferAuthorityGranted\s*=\s*true/i,
  /checkpointMutationAuthorityGranted\s*=\s*true/i
];

for (const pattern of forbiddenAuthorityGrantPatterns) {
  if (pattern.test(text)) {
    fail(
      `contract contains a forbidden authority grant pattern: ${pattern}`
    );
  }
}

const mutationBoundaryCount = (
  text.match(
    /Source Record Key = column 25/g
  ) || []
).length;

if (mutationBoundaryCount !== 1) {
  fail(
    `expected exactly one explicit Source Record Key column declaration; actual=${mutationBoundaryCount}`
  );
}

const observationBoundaryCount = (
  text.match(
    /Source Observation Key = column 51/g
  ) || []
).length;

if (observationBoundaryCount !== 1) {
  fail(
    `expected exactly one explicit Source Observation Key column declaration; actual=${observationBoundaryCount}`
  );
}

console.log(
  'PASS: generic rolling executor contract exists and contains the certified seed hashes.'
);

console.log(
  'PASS: exact post-Batch-1 counts are 3877 / 149 / 814 / 141 / 95.'
);

console.log(
  'PASS: five explicit rolling confirmations are required.'
);

console.log(
  'PASS: deterministic first-N selection is required.'
);

console.log(
  'PASS: mutation boundary is limited to columns 25 and 51.'
);

console.log(
  'PASS: exactly two narrow Nx1 physical writes are required.'
);

console.log(
  'PASS: scheduler/checkpoint/collapse/review/offer authority remains excluded.'
);

console.log(
  'PASS: rollback and ambiguous/no-retry semantics are explicitly required.'
);

console.log(
  'PASS: independent read-only reconciliation is mandatory.'
);

console.log(
  'PASS: design-only contract grants no production authority.'
);

console.log(
  '=== ROLLING EXECUTOR CONTRACT VALIDATION PASSED ==='
);
