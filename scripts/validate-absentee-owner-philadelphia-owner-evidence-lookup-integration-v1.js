#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const IMPLEMENTATION =
  'build/apps-script-brand/' +
  'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js';

const STATIC =
  'scripts/' +
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-v1.js';

const BEHAVIOR =
  'scripts/' +
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-behavior-v1.js';

const INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js';

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
    fs.existsSync(
      path.join(ROOT, file)
    ),
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
      "AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js'"
  ),
  1,
  'owner-evidence production allowlist entry must occur exactly once'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-philadelphia-owner-evidence-lookup-v1.js'"
  ),
  1,
  'owner-evidence static validator must occur exactly once in component inventory'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-philadelphia-owner-evidence-lookup-behavior-v1.js'"
  ),
  1,
  'owner-evidence behavior validator must occur exactly once in component inventory'
);

/*
 * The integration validator is intentionally workflow-executed rather than
 * recursively registered in COMPONENT_VALIDATORS.
 */
assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js'"
  ),
  0,
  'integration validator must not recursively enter component inventory'
);

[
  'REOS.Security.requireAdmin();',
  "'https://phl.carto.com/api/v2/sql'",
  "'opa_properties_public'",
  'var MAX_SOURCE_ROWS = 5;',
  "'READ_ONLY_OWNER_EVIDENCE'",
  'productionDataMutationAuthorityGranted: false',
  'ownerEvidencePersistenceAuthorityGranted: false',
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
  'SpreadsheetApp.',
  'PropertiesService.',
  'ScriptApp.',
  'LockService.',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
  'AbsenteeOwnerEnrichmentSanitizer',
  'AbsenteeOwnerEnrichmentPersistenceAdapter',
  'AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord'
].forEach(marker => {
  assert.equal(
    implementation.includes(marker),
    false,
    'prohibited owner-evidence integration marker: ' + marker
  );
});

const syntaxMarkers = [
  'node --check build/apps-script-brand/' +
    'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js',
  'node --check scripts/' +
    'validate-absentee-owner-philadelphia-owner-evidence-lookup-v1.js',
  'node --check scripts/' +
    'validate-absentee-owner-philadelphia-owner-evidence-lookup-behavior-v1.js',
  'node --check scripts/' +
    'validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js'
];

syntaxMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'workflow syntax registration must occur exactly once: ' + marker
  );
});

const stepMarkers = [
  'Validate absentee-owner Philadelphia owner evidence lookup static v1',
  'Validate absentee-owner Philadelphia owner evidence lookup behavior v1',
  'Validate absentee-owner Philadelphia owner evidence lookup integration v1'
];

stepMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'workflow execution step must occur exactly once: ' + marker
  );
});

[
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-v1.js',
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-behavior-v1.js',
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js'
].forEach(file => {
  assert.equal(
    count(
      workflow,
      'run: node scripts/' + file
    ),
    1,
    'workflow validator execution must occur exactly once: ' + file
  );
});

/*
 * The reconciled current validator has 71 component validators after
 * adding classification static/behavior certifications.
 */
const componentStart =
  runtime.indexOf(
    'const COMPONENT_VALIDATORS = ['
  );

const componentEnd =
  runtime.indexOf(
    '];',
    componentStart
  );

assert.ok(
  componentStart >= 0 &&
  componentEnd > componentStart,
  'unable to locate component validator inventory'
);

const componentBlock =
  runtime.slice(
    componentStart,
    componentEnd
  );

const componentEntries =
  componentBlock.match(
    /'validate-[^']+\.js'/g
  ) || [];

assert.equal(
  componentEntries.length,
  71,
  'current component validator inventory must contain exactly 71 validators'
);

/*
 * POST_COUNTY_PRODUCTION_FILES is filtered out before the historical
 * county reconciliation inventory. Therefore adding this bounded
 * post-county runtime must not change the certified 147-file historical
 * production inventory.
 */
assert.ok(
  runtime.includes(
    'expected reconciled production inventory must contain 147 files'
  ),
  'historical 147-file production inventory authority changed'
);

/*
 * Preserve the historical county-runtime replay exactly. This new current
 * runtime authority must not turn the replay step into moving-current
 * validation.
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
  'ABSENTEE_OWNER_PHILADELPHIA_OWNER_EVIDENCE_LOOKUP_INTEGRATION_VALID=true'
);
console.log('RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true');
console.log('COMPONENT_VALIDATOR_REGISTRATION_EXACT=true');
console.log('COMPONENT_VALIDATOR_COUNT=71');
console.log('CI_SYNTAX_REGISTRATION_EXACT=true');
console.log('CI_EXECUTION_REGISTRATION_EXACT=true');
console.log('HISTORICAL_COUNTY_RUNTIME_REPLAY_PRESERVED=true');
console.log('HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true');
console.log('CURRENT_RUNTIME_AUTHORITY_RECONCILED=true');
console.log('OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('CANONICAL_IDENTITY_REPAIR_AUTHORITY=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('TRIGGER_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
