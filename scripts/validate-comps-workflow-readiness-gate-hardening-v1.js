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

const designPath = path.join(
  root,
  'docs/comps-workflow-readiness-gate-hardening-v1.md'
);

const gatePath = path.join(
  root,
  'scripts/lib/comps-workflow-readiness-gate-v1.js'
);

const fixturePath = path.join(
  root,
  'scripts/fixtures/comps-workflow-readiness-gate-v1.json'
);

for (const file of [designPath, gatePath, fixturePath]) {
  requireTrue(fs.existsSync(file), 'missing file: ' + file);
}

const design = fs.readFileSync(designPath, 'utf8');

const requiredDesignTerms = [
  'adequate comp-supported ARV; and',
  'adequate repair scope.',
  '`comps.length > 0` must never independently authorize Offer Generation.',
  'Every other state is blocked.',
  'Any missing or unrecognized state is blocked.',
  'Production workflow integration remains a separate phase.',
  'bounded workflow integration hardening'
];

for (const term of requiredDesignTerms) {
  requireTrue(
    design.includes(term),
    'design missing required term: ' + term
  );
}

const {
  REASONS,
  evaluateOfferReadiness
} = require(gatePath);

const fixtures = JSON.parse(
  fs.readFileSync(fixturePath, 'utf8')
);

requireTrue(
  Array.isArray(fixtures.cases) &&
    fixtures.cases.length >= 6,
  'fixture coverage insufficient'
);

let eligibleCount = 0;
let blockedCount = 0;

for (const testCase of fixtures.cases) {
  const first = evaluateOfferReadiness(testCase.input);
  const second = evaluateOfferReadiness(testCase.input);

  requireTrue(
    JSON.stringify(first) === JSON.stringify(second),
    'non-deterministic result: ' + testCase.name
  );

  requireTrue(
    first.decision === testCase.expectedDecision,
    'unexpected decision: ' + testCase.name
  );

  requireTrue(
    first.reasons.includes(testCase.expectedReason),
    'missing expected reason: ' + testCase.name
  );

  if (first.decision === 'eligible') {
    eligibleCount += 1;

    requireTrue(
      first.compSupportedArvReady === true,
      'eligible result without ARV readiness'
    );

    requireTrue(
      first.repairScopeReady === true,
      'eligible result without repair readiness'
    );
  } else {
    blockedCount += 1;

    requireTrue(
      !(
        first.compSupportedArvReady === true &&
        first.repairScopeReady === true
      ),
      'blocked result has both readiness gates true'
    );
  }

  console.log(
    'CASE=' +
      testCase.name +
      ' | decision=' +
      first.decision +
      ' | reasons=' +
      first.reasons.join(',')
  );
}

requireTrue(eligibleCount >= 1, 'missing eligible fixture');
requireTrue(blockedCount >= 5, 'insufficient blocked fixtures');

const source = fs.readFileSync(gatePath, 'utf8');

requireTrue(
  !source.includes('Date.now('),
  'gate must not use Date.now'
);

requireTrue(
  !source.includes('new Date()'),
  'gate must not read current clock'
);

requireTrue(
  !/\bfetch\s*\(/.test(source),
  'gate must not execute fetch'
);

requireTrue(
  !/UrlFetchApp/.test(source),
  'gate must not execute Apps Script HTTP'
);

requireTrue(
  !/DEAL_COMPARABLES/.test(source),
  'gate must not infer readiness directly from comparable table'
);

requireTrue(
  !/comps\.length/.test(source),
  'gate must not use comparable presence as authority'
);

requireTrue(
  REASONS.OFFER_READINESS_ELIGIBLE ===
    'OFFER_READINESS_ELIGIBLE',
  'eligible reason missing'
);

console.log('ELIGIBLE_FIXTURE_COUNT=' + eligibleCount);
console.log('BLOCKED_FIXTURE_COUNT=' + blockedCount);
console.log('PRODUCTION_WORKFLOW_MUTATION_EXECUTED=false');
console.log('OFFER_GENERATION_EXECUTED=false');
console.log('MAO_CALCULATION_EXECUTED=false');
console.log('COMPS_WORKFLOW_READINESS_GATE_V1_VALIDATION_PASSED=true');
