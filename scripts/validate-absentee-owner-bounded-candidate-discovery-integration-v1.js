#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const IMPLEMENTATION =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentCandidateDiscovery.js';

const STATIC =
  'scripts/' +
  'validate-absentee-owner-bounded-candidate-discovery-v1.js';

const BEHAVIOR =
  'scripts/' +
  'validate-absentee-owner-bounded-candidate-discovery-behavior-v1.js';

const INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-bounded-candidate-discovery-integration-v1.js';

const RUNTIME_INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

[
  IMPLEMENTATION,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  RUNTIME_INTEGRATION,
  WORKFLOW
].forEach(file => {
  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    'required integration surface missing: ' + file
  );
});

const implementation = fs.readFileSync(
  path.join(ROOT, IMPLEMENTATION),
  'utf8'
);

const runtime = fs.readFileSync(
  path.join(ROOT, RUNTIME_INTEGRATION),
  'utf8'
);

const workflow = fs.readFileSync(
  path.join(ROOT, WORKFLOW),
  'utf8'
);

function count(text, marker) {
  return text.split(marker).length - 1;
}

assert.equal(
  count(
    runtime,
    "'build/apps-script-brand/" +
      "AbsenteeOwnerEnrichmentCandidateDiscovery.js'"
  ),
  1,
  'candidate-discovery production allowlist entry must occur exactly once'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-bounded-candidate-discovery-v1.js'"
  ),
  1,
  'candidate-discovery static validator must occur exactly once in component inventory'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-bounded-candidate-discovery-behavior-v1.js'"
  ),
  1,
  'candidate-discovery behavior validator must occur exactly once in component inventory'
);

[
  'REOS.Security.requireAdmin();',
  'var MAX_ROWS = 50;',
  "mode: 'READ_ONLY'",
  'productionDataMutationAuthorityGranted: false',
  'canonicalIdentityRepairAuthorityGranted: false',
  'automaticOfferAuthorityGranted: false'
].forEach(marker => {
  assert.ok(
    implementation.includes(marker),
    'implementation boundary marker missing: ' + marker
  );
});

[
  'REOS.Database.',
  'CanonicalPropertyIdentity',
  'AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',
  'SpreadsheetApp.flush',
  'ScriptApp.',
  'PropertiesService.',
  'LockService.'
].forEach(marker => {
  assert.equal(
    implementation.includes(marker),
    false,
    'prohibited candidate-discovery integration marker: ' + marker
  );
});

const syntaxMarkers = [
  'node --check build/apps-script-brand/' +
    'AbsenteeOwnerEnrichmentCandidateDiscovery.js',
  'node --check scripts/' +
    'validate-absentee-owner-bounded-candidate-discovery-v1.js',
  'node --check scripts/' +
    'validate-absentee-owner-bounded-candidate-discovery-behavior-v1.js',
  'node --check scripts/' +
    'validate-absentee-owner-bounded-candidate-discovery-integration-v1.js'
];

syntaxMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur exactly once: ' + marker
  );
});

const stepMarkers = [
  'Validate absentee-owner bounded candidate discovery static v1',
  'Validate absentee-owner bounded candidate discovery behavior v1',
  'Validate absentee-owner bounded candidate discovery integration v1'
];

stepMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'workflow validation step must occur exactly once: ' + marker
  );
});

assert.equal(
  count(
    workflow,
    'run: node scripts/' +
      'validate-absentee-owner-bounded-candidate-discovery-v1.js'
  ),
  1,
  'static validator execution must occur exactly once'
);

assert.equal(
  count(
    workflow,
    'run: node scripts/' +
      'validate-absentee-owner-bounded-candidate-discovery-behavior-v1.js'
  ),
  1,
  'behavior validator execution must occur exactly once'
);

assert.equal(
  count(
    workflow,
    'run: node scripts/' +
      'validate-absentee-owner-bounded-candidate-discovery-integration-v1.js'
  ),
  1,
  'integration validator execution must occur exactly once'
);

/*
 * Preserve the previously certified county-runtime replay.
 * Candidate discovery is integrated into current authority without
 * converting that historical replay into a moving-current validation.
 */
[
  'Validate certified county runtime integration',
  'git worktree add --detach "$wt" ' +
    'd79d640d587e8a4d104cc4631b2022609a63fd50',
  'test "$(git rev-parse \'HEAD^{tree}\')" = ' +
    '"90d28afc06ae80006ce32810e3bf523665f191f8"',
  'node scripts/validate-county-runtime-integration.js'
].forEach(marker => {
  assert.ok(
    workflow.includes(marker),
    'historical county-runtime replay marker changed: ' + marker
  );
});

assert.equal(
  count(
    workflow,
    'node scripts/validate-county-runtime-integration.js'
  ),
  1,
  'county runtime integration validator must remain historical replay only'
);

console.log(
  'ABSENTEE_OWNER_BOUNDED_CANDIDATE_DISCOVERY_INTEGRATION_VALID=true'
);
console.log('RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true');
console.log('COMPONENT_VALIDATOR_REGISTRATION_EXACT=true');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('HISTORICAL_COUNTY_RUNTIME_REPLAY_PRESERVED=true');
console.log('CURRENT_RUNTIME_AUTHORITY_RECONCILED=true');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('CANONICAL_IDENTITY_REPAIR_AUTHORITY=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('TRIGGER_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
