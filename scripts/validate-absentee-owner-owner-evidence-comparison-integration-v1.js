#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const IMPLEMENTATION =
  'build/apps-script-brand/' +
  'AbsenteeOwnerOwnerEvidenceComparison.js';

const STATIC =
  'scripts/' +
  'validate-absentee-owner-owner-evidence-comparison-v1.js';

const BEHAVIOR =
  'scripts/' +
  'validate-absentee-owner-owner-evidence-comparison-behavior-v1.js';

const INTEGRATION =
  'scripts/' +
  'validate-absentee-owner-owner-evidence-comparison-integration-v1.js';

const OWNER_EVIDENCE_INTEGRATION =
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
  OWNER_EVIDENCE_INTEGRATION,
  RUNTIME_INTEGRATION,
  WORKFLOW
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required comparison integration surface missing: ' + file
  );
});

const implementation =
  fs.readFileSync(
    path.join(ROOT, IMPLEMENTATION),
    'utf8'
  );

const ownerEvidenceIntegration =
  fs.readFileSync(
    path.join(
      ROOT,
      OWNER_EVIDENCE_INTEGRATION
    ),
    'utf8'
  );

const runtime =
  fs.readFileSync(
    path.join(ROOT, RUNTIME_INTEGRATION),
    'utf8'
  );

const workflow =
  fs.readFileSync(
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
      "AbsenteeOwnerOwnerEvidenceComparison.js'"
  ),
  1,
  'comparison production allowlist entry must occur exactly once'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-owner-evidence-comparison-v1.js'"
  ),
  1,
  'comparison static validator must occur exactly once in component inventory'
);

assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-owner-evidence-comparison-behavior-v1.js'"
  ),
  1,
  'comparison behavior validator must occur exactly once in component inventory'
);

/*
 * Integration validators remain workflow-executed and must not recursively
 * enter COMPONENT_VALIDATORS.
 */
assert.equal(
  count(
    runtime,
    "'validate-absentee-owner-owner-evidence-comparison-integration-v1.js'"
  ),
  0,
  'comparison integration validator must not recursively enter component inventory'
);

[
  "'READ_ONLY_OWNER_EVIDENCE_COMPARISON'",
  "'absentee_owner_owner_evidence_comparison'",
  "'MAILING_ADDRESS_MATCHES'",
  "'MAILING_ADDRESS_DIFFERS'",
  "'INSUFFICIENT_MAILING_EVIDENCE'",
  "'INELIGIBLE_OWNER_EVIDENCE'",
  'productionDataMutationAuthorityGranted: false',
  'ownerEvidencePersistenceAuthorityGranted: false',
  'absenteeClassificationAuthorityGranted: false',
  'automaticOfferAuthorityGranted: false',
  'compare: compare'
].forEach(marker => {
  assert.ok(
    implementation.includes(marker),
    'comparison implementation boundary marker missing: ' + marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
  'reosConnectorHandleAbsenteeOwners',
  'REOS.AbsenteeOwnerEnrichmentSanitizer',
  'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter',
  'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'REOS.AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',
  'ownerNameEvidence',
  'absenteeOwner',
  'ownerOccupied'
].forEach(marker => {
  assert.equal(
    implementation.includes(marker),
    false,
    'prohibited comparison integration marker: ' + marker
  );
});

assert.equal(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    implementation
  ),
  false,
  'comparison runtime must not expose an RPC'
);

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
  69,
  'current component validator inventory must contain exactly 69 validators'
);

assert.ok(
  runtime.includes(
    'expected county runtime integration inventory must contain 104 files'
  ),
  'current runtime inventory must be reconciled to 105'
);

assert.ok(
  runtime.includes(
    'county runtime remains exactly 104 additive files'
  ),
  'current runtime summary must be reconciled to 105'
);

assert.ok(
  runtime.includes(
    'expected reconciled production inventory must contain 147 files'
  ),
  'historical 147-file production inventory authority changed'
);

assert.ok(
  /assert\.equal\(\s*componentEntries\.length,\s*69,/s
    .test(ownerEvidenceIntegration),
  'owner-evidence integration validator must reconcile component count to 69'
);

assert.ok(
  ownerEvidenceIntegration.includes(
    'COMPONENT_VALIDATOR_COUNT=69'
  ),
  'owner-evidence integration summary must reconcile component count to 69'
);

assert.equal(
  ownerEvidenceIntegration.includes(
    'COMPONENT_VALIDATOR_COUNT=67'
  ),
  false,
  'stale owner-evidence component count 67 remains'
);

const syntaxMarkers = [
  'node --check build/apps-script-brand/' +
    'AbsenteeOwnerOwnerEvidenceComparison.js',
  'node --check scripts/' +
    'validate-absentee-owner-owner-evidence-comparison-v1.js',
  'node --check scripts/' +
    'validate-absentee-owner-owner-evidence-comparison-behavior-v1.js',
  'node --check scripts/' +
    'validate-absentee-owner-owner-evidence-comparison-integration-v1.js'
];

syntaxMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'comparison workflow syntax registration must occur exactly once: ' + marker
  );
});

const stepMarkers = [
  'Validate absentee-owner owner evidence comparison static v1',
  'Validate absentee-owner owner evidence comparison behavior v1',
  'Validate absentee-owner owner evidence comparison integration v1'
];

stepMarkers.forEach(marker => {
  assert.equal(
    count(workflow, marker),
    1,
    'comparison workflow execution step must occur exactly once: ' + marker
  );
});

[
  'validate-absentee-owner-owner-evidence-comparison-v1.js',
  'validate-absentee-owner-owner-evidence-comparison-behavior-v1.js',
  'validate-absentee-owner-owner-evidence-comparison-integration-v1.js'
].forEach(file => {
  assert.equal(
    count(
      workflow,
      'run: node scripts/' + file
    ),
    1,
    'comparison workflow validator execution must occur exactly once: ' + file
  );
});

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
  'historical county runtime integration execution must remain exactly once'
);

console.log(
  'ABSENTEE_OWNER_EVIDENCE_COMPARISON_INTEGRATION_VALID=true'
);
console.log(
  'RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true'
);
console.log(
  'COMPONENT_VALIDATOR_COUNT=69'
);
console.log(
  'COMPARISON_INTEGRATION_RECURSIVE_REGISTRATION=false'
);
console.log(
  'CI_SYNTAX_REGISTRATION_EXACT=true'
);
console.log(
  'CI_EXECUTION_REGISTRATION_EXACT=true'
);
console.log(
  'CURRENT_RUNTIME_INVENTORY_COUNT=104'
);
console.log(
  'HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true'
);
console.log(
  'HISTORICAL_COUNTY_RUNTIME_REPLAY_PRESERVED=true'
);
console.log(
  'PRODUCTION_RPC_CREATED=false'
);
console.log(
  'EXTERNAL_HTTP_AUTHORITY=false'
);
console.log(
  'OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false'
);
console.log(
  'ABSENTEE_CLASSIFICATION_AUTHORITY=false'
);
console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
