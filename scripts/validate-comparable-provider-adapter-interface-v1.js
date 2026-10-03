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
  'docs/comparable-provider-adapter-interface-v1.md'
);

const interfacePath = path.join(
  root,
  'scripts/lib/comparable-provider-adapter-interface-v1.js'
);

const fixturePath = path.join(
  root,
  'scripts/fixtures/comparable-provider-adapter-interface-v1.json'
);

for (const file of [designPath, interfacePath, fixturePath]) {
  requireTrue(fs.existsSync(file), 'missing file: ' + file);
}

const design = fs.readFileSync(designPath, 'utf8');

const requiredTerms = [
  'No real comparable provider is selected, contacted, authenticated,',
  'Provider-specific schemas must not leak into acceptance or ARV logic.',
  'It does not authorize automatic search expansion.',
  'Raw provider evidence must remain distinguishable from normalized',
  'Missing provider evidence remains missing.',
  'Version 1 includes only a deterministic offline mock adapter.',
  'Credentials do not belong in:',
  'adequate comp-supported ARV exists; and',
  'adequate repair scope exists.',
  'workflow readiness-gate hardening'
];

for (const term of requiredTerms) {
  requireTrue(
    design.includes(term),
    'design missing required term: ' + term
  );
}

const {
  RETRIEVAL_STATUSES,
  validateRequest,
  createOfflineMockAdapter
} = require(interfacePath);

requireTrue(
  JSON.stringify(RETRIEVAL_STATUSES) ===
    JSON.stringify([
      'success',
      'partial',
      'unavailable',
      'failed'
    ]),
  'retrieval status contract mismatch'
);

const fixtures = JSON.parse(
  fs.readFileSync(fixturePath, 'utf8')
);

validateRequest(fixtures.request);

const adapter = createOfflineMockAdapter({
  providerId: fixtures.providerId
});

requireTrue(
  Array.isArray(fixtures.responses) &&
    fixtures.responses.length >= 3,
  'fixture response coverage insufficient'
);

for (const response of fixtures.responses) {
  const first = adapter.retrieveComparables(
    fixtures.request,
    response
  );

  const second = adapter.retrieveComparables(
    fixtures.request,
    response
  );

  requireTrue(
    JSON.stringify(first) === JSON.stringify(second),
    'non-deterministic adapter output: ' + response.name
  );

  requireTrue(
    first.requestId === fixtures.request.requestId,
    'request ID not preserved'
  );

  requireTrue(
    first.providerId === fixtures.providerId,
    'provider ID not preserved'
  );

  requireTrue(
    first.retrievalStatus === response.retrievalStatus,
    'retrieval status mismatch'
  );

  console.log(
    'CASE=' +
      response.name +
      ' | status=' +
      first.retrievalStatus +
      ' | records=' +
      first.records.length
  );
}

const source = fs.readFileSync(interfacePath, 'utf8');

requireTrue(
  !source.includes('Date.now('),
  'adapter must not use Date.now'
);

requireTrue(
  !source.includes('new Date()'),
  'adapter must not read current clock'
);

requireTrue(
  !/\bfetch\s*\(/.test(source),
  'adapter must not execute fetch'
);

requireTrue(
  !/UrlFetchApp/.test(source),
  'adapter must not execute Apps Script HTTP'
);

requireTrue(
  !/https?:\/\//i.test(source),
  'adapter must not contain provider URL'
);

requireTrue(
  !/(api[_-]?key|access[_-]?token|client[_-]?secret)/i.test(source),
  'adapter must not contain credential material'
);

console.log('PROVIDER_SELECTION_EXECUTED=false');
console.log('EXTERNAL_HTTP_EXECUTED=false');
console.log('LIVE_COMPS_RETRIEVAL_EXECUTED=false');
console.log('PROVIDER_CREDENTIAL_USED=false');
console.log('PRODUCTION_REOS_READ_EXECUTED=false');
console.log('PRODUCTION_REOS_MUTATION_EXECUTED=false');
console.log('DETERMINISTIC_OFFLINE_MOCK_CONFIRMED=true');
console.log('COMPARABLE_PROVIDER_ADAPTER_INTERFACE_V1_VALIDATION_PASSED=true');
