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
  'scripts/lib/arv-evidence-engine-v1.js'
);

const fixturesPath = path.join(
  root,
  'scripts/fixtures/arv-evidence-engine-v1.json'
);

const designPath = path.join(
  root,
  'docs/offline-arv-evidence-engine-v1.md'
);

for (const file of [enginePath, fixturesPath, designPath]) {
  requireTrue(fs.existsSync(file), 'missing file: ' + file);
}

const design = fs.readFileSync(designPath, 'utf8');

const requiredTerms = [
  'Every comparable supplied to the ARV engine must already carry an',
  'Comp count alone does not establish confidence.',
  'medianPricePerSqFt * subjectLivingArea',
  'Only `supported` contains an estimated ARV.',
  '`review_required` and `insufficient` must return a null estimated ARV.',
  'adequate comp-supported ARV; and',
  'adequate repair scope.',
  'The engine must not read the current clock.',
  'All v1 evidence is synthetic.',
  'Workflow readiness-gate hardening remains separately required'
];

for (const term of requiredTerms) {
  requireTrue(
    design.includes(term),
    'design missing required term: ' + term
  );
}

const { evaluateArvEvidence } = require(enginePath);

const fixtures = JSON.parse(
  fs.readFileSync(fixturesPath, 'utf8')
);

requireTrue(
  Array.isArray(fixtures.cases) && fixtures.cases.length >= 6,
  'insufficient fixture coverage'
);

let supported = 0;
let insufficient = 0;
let reviewRequired = 0;

for (const testCase of fixtures.cases) {
  const input = {
    subject: fixtures.subject,
    policy: fixtures.policy,
    comparables: testCase.comparables
  };

  const first = evaluateArvEvidence(input);
  const second = evaluateArvEvidence(input);

  requireTrue(
    JSON.stringify(first) === JSON.stringify(second),
    'non-deterministic result: ' + testCase.name
  );

  requireTrue(
    first.evidenceStatus === testCase.expectedStatus,
    testCase.name +
      ': expected ' +
      testCase.expectedStatus +
      ', got ' +
      first.evidenceStatus
  );

  requireTrue(
    first.reasonCodes.includes(testCase.expectedReason),
    testCase.name +
      ': missing reason ' +
      testCase.expectedReason
  );

  if (testCase.expectArv) {
    requireTrue(
      typeof first.estimatedArv === 'number' &&
        Number.isFinite(first.estimatedArv) &&
        first.estimatedArv > 0,
      testCase.name + ': expected positive ARV'
    );
  } else {
    requireTrue(
      first.estimatedArv === null,
      testCase.name + ': ARV must fail closed'
    );
  }

  if (first.evidenceStatus === 'supported') supported += 1;
  if (first.evidenceStatus === 'insufficient') insufficient += 1;
  if (first.evidenceStatus === 'review_required') reviewRequired += 1;

  console.log(
    'CASE=' +
      testCase.name +
      ' | status=' +
      first.evidenceStatus +
      ' | reasons=' +
      first.reasonCodes.join(',') +
      ' | arv=' +
      String(first.estimatedArv)
  );
}

requireTrue(supported >= 1, 'supported fixture missing');
requireTrue(insufficient >= 1, 'insufficient fixture missing');
requireTrue(reviewRequired >= 1, 'review-required fixture missing');

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

requireTrue(
  !/MAO/i.test(source),
  'offline ARV engine must not calculate MAO'
);

console.log('FIXTURE_COUNT=' + fixtures.cases.length);
console.log('SUPPORTED_FIXTURE_COUNT=' + supported);
console.log('INSUFFICIENT_FIXTURE_COUNT=' + insufficient);
console.log('REVIEW_REQUIRED_FIXTURE_COUNT=' + reviewRequired);
console.log('DETERMINISTIC_ARV_EVIDENCE_CONFIRMED=true');
console.log('NON_ACCEPTED_COMPS_FAIL_CLOSED=true');
console.log('INSUFFICIENT_EVIDENCE_FAILS_CLOSED=true');
console.log('DISPERSION_REQUIRES_REVIEW=true');
console.log('PRODUCTION_ARV_AUTHORITY_GRANTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_AUTHORITY_GRANTED=false');
console.log('OFFLINE_ARV_EVIDENCE_ENGINE_V1_VALIDATION_PASSED=true');
