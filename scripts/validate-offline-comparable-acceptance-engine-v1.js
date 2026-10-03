'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function fail(message) {
  console.error('FAIL=' + message);
  process.exit(1);
}

function requireTrue(condition, message) {
  if (!condition) fail(message);
}

const enginePath = path.join(
  root,
  'scripts/lib/comparable-acceptance-engine-v1.js'
);

const fixturesPath = path.join(
  root,
  'scripts/fixtures/comparable-acceptance-engine-v1.json'
);

const designPath = path.join(
  root,
  'docs/offline-comparable-acceptance-engine-v1.md'
);

const normalizationPath = path.join(
  root,
  'docs/comparable-evidence-normalization-contract-v1.md'
);

for (const file of [
  enginePath,
  fixturesPath,
  designPath,
  normalizationPath
]) {
  requireTrue(fs.existsSync(file), 'missing file: ' + file);
}

const design = fs.readFileSync(designPath, 'utf8');
const normalization = fs.readFileSync(normalizationPath, 'utf8');

const requiredDesignTerms = [
  'Acceptance is distinct from normalization.',
  'Acceptance is distinct from ARV calculation.',
  'The engine must not read the current clock.',
  'accepted;',
  'rejected;',
  'review_required.',
  'Unknown evidence is not matching evidence.',
  'Normalization success alone does not establish acceptance.',
  'Radius or recency expansion is not performed implicitly.',
  'This engine does not rank accepted comps.',
  'This engine does not weight accepted comps.',
  'This engine does not select an ARV.',
  'No ARV Authority',
  'All v1 validation uses synthetic fixtures.',
  'Live provider integration remains separately gated.'
];

for (const term of requiredDesignTerms) {
  requireTrue(
    design.includes(term),
    'design missing required term: ' + term
  );
}

requireTrue(
  normalization.includes(
    'Normalization success does not mean the candidate is an accepted comp.'
  ),
  'normalization acceptance boundary missing'
);

const { evaluateComparable } = require(enginePath);
const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

requireTrue(
  Array.isArray(fixtures.cases) && fixtures.cases.length >= 10,
  'insufficient fixture coverage'
);

let accepted = 0;
let rejected = 0;
let reviewRequired = 0;

for (const testCase of fixtures.cases) {
  const input = {
    subject: fixtures.subject,
    comp: testCase.comp,
    policy: fixtures.policy,
    evaluationDate: fixtures.evaluationDate
  };

  const first = evaluateComparable(input);
  const second = evaluateComparable(input);

  requireTrue(
    JSON.stringify(first) === JSON.stringify(second),
    'non-deterministic result: ' + testCase.name
  );

  requireTrue(
    first.decision === testCase.expectedDecision,
    testCase.name +
      ': expected ' +
      testCase.expectedDecision +
      ', got ' +
      first.decision
  );

  requireTrue(
    first.reasons.includes(testCase.expectedReason),
    testCase.name +
      ': missing reason ' +
      testCase.expectedReason
  );

  if (first.decision === 'accepted') accepted += 1;
  if (first.decision === 'rejected') rejected += 1;
  if (first.decision === 'review_required') reviewRequired += 1;

  console.log(
    'CASE=' +
      testCase.name +
      ' | decision=' +
      first.decision +
      ' | reasons=' +
      first.reasons.join(',')
  );
}

requireTrue(accepted >= 1, 'accepted fixture missing');
requireTrue(rejected >= 1, 'rejected fixture missing');
requireTrue(reviewRequired >= 1, 'review fixture missing');

const source = fs.readFileSync(enginePath, 'utf8');

requireTrue(
  !source.includes('Date.now('),
  'engine must not use Date.now'
);

requireTrue(
  !source.includes('new Date()'),
  'engine must not read implicit current clock'
);

requireTrue(
  !/\bfetch\s*\(/.test(source),
  'engine must not perform HTTP fetch'
);

requireTrue(
  !/UrlFetchApp/.test(source),
  'engine must not use Apps Script HTTP'
);

console.log('FIXTURE_COUNT=' + fixtures.cases.length);
console.log('ACCEPTED_FIXTURE_COUNT=' + accepted);
console.log('REJECTED_FIXTURE_COUNT=' + rejected);
console.log('REVIEW_REQUIRED_FIXTURE_COUNT=' + reviewRequired);
console.log('DETERMINISTIC_EVALUATION_CONFIRMED=true');
console.log('EXPLICIT_EVALUATION_DATE_REQUIRED=true');
console.log('FAIL_CLOSED_ACCEPTANCE_CONFIRMED=true');
console.log('NORMALIZATION_IS_NOT_ACCEPTANCE=true');
console.log('ACCEPTANCE_IS_NOT_ARV=true');
console.log('LIVE_PROVIDER_ACCESS_AUTHORIZED=false');
console.log('PRODUCTION_PERSISTENCE_AUTHORIZED=false');
console.log('ARV_AUTHORITY_GRANTED=false');
console.log('OFFLINE_COMPARABLE_ACCEPTANCE_ENGINE_V1_VALIDATION_PASSED=true');
