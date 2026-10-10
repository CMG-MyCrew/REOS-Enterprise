#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const DESIGN =
  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-invocation-boundary-design-v1.md';

const RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2.js';

const ORCHESTRATOR =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js';

const STATIC =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-entrypoint-v2.js';

const BEHAVIOR =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-entrypoint-behavior-v2.js';

const INTEGRATION =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-entrypoint-integration-v2.js';

const COUNTY =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const DESIGN_VALIDATOR =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-invocation-boundary-design-v1.js';

const EXPECTED_DESIGN_SHA =
  '6dcdbd8a62a9697aed1beb23a59295cfc1bac0b353592add4cda162e251ba5b6';

const EXPECTED_ORCHESTRATOR_SHA =
  '2356c6e3f657aa138cd4ac69c02a829636b9a633fc4c5946cfa27290e9db4529';

function full(relative) {
  return path.join(
    ROOT,
    relative
  );
}

function read(relative) {
  return fs.readFileSync(
    full(relative),
    'utf8'
  );
}

function sha256(relative) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(
        full(relative)
      )
    )
    .digest('hex');
}

function count(text, marker) {
  return text
    .split(marker)
    .length - 1;
}

[
  DESIGN,
  RUNTIME,
  ORCHESTRATOR,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  COUNTY,
  WORKFLOW,
  DESIGN_VALIDATOR
].forEach(relative => {
  assert.ok(
    fs.existsSync(
      full(relative)
    ),
    'required integration surface missing: ' +
      relative
  );
});

assert.strictEqual(
  sha256(DESIGN),
  EXPECTED_DESIGN_SHA,
  'certified invocation design changed'
);

assert.strictEqual(
  sha256(ORCHESTRATOR),
  EXPECTED_ORCHESTRATOR_SHA,
  'certified bounded-rollout orchestrator changed'
);

const runtime =
  read(RUNTIME);

const county =
  read(COUNTY);

const workflow =
  read(WORKFLOW);

[
  'REOS.Security.requireAdmin',
  'function reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2('
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'authorized runtime dependency/surface missing: ' +
      marker
  );
});

assert.ok(
  /REOS\s*\.\s*AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2/
    .test(runtime),
  'authorized orchestrator dependency missing'
);

[
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2',
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2',
  'REOS.AbsenteeOwnerClassificationEvidenceStoreV2',
  'REOS.Database',
  'SpreadsheetApp',
  'UrlFetchApp',
  'ScriptApp',
  'LockService',
  'PropertiesService'
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'prohibited production dependency present: ' +
      marker
  );
});

function arrayValues(name) {
  const match =
    county.match(
      new RegExp(
        name +
        '\\s*=\\s*\\[(.*?)\\];',
        's'
      )
    );

  assert.ok(
    match,
    'county inventory missing: ' +
      name
  );

  return (
    match[1]
      .match(
        /'[^']+'/g
      ) || []
  ).map(value =>
    value.slice(1, -1)
  );
}

assert.strictEqual(
  arrayValues(
    'POST_COUNTY_PRODUCTION_FILES'
  ).length,
  70,
  'historical post-county production inventory changed'
);

assert.strictEqual(
  arrayValues(
    'COMPONENT_VALIDATORS'
  ).length,
  97,
  'historical component validator inventory changed'
);

assert.deepStrictEqual(
  arrayValues(
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2_PRODUCTION_FILES'
  ),
  [
    ORCHESTRATOR
  ],
  'certified orchestrator inventory changed'
);

assert.deepStrictEqual(
  arrayValues(
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_V2_PRODUCTION_FILES'
  ),
  [
    RUNTIME
  ],
  'bounded-rollout production entrypoint inventory must contain exactly the new runtime'
);

assert.strictEqual(
  arrayValues(
    'POST_COUNTY_PRODUCTION_FILES'
  ).includes(RUNTIME),
  false,
  'new runtime must not expand historical post-county inventory'
);

[
  'expected county runtime integration inventory must contain 104 files',
  'county runtime remains exactly 104 additive files',
  'expected reconciled production inventory must contain 147 files'
].forEach(marker => {
  assert.ok(
    county.includes(marker),
    'historical runtime authority changed: ' +
      marker
  );
});

assert.ok(
  county.includes(
    'certified property-source provenance bounded rollout production entrypoint v2 surface is exactly one explicitly allowlisted additive manual admin RPC file'
  ),
  'county runtime bounded-entrypoint certification marker missing'
);

const syntaxMarkers = [
  'node --check ' + RUNTIME,
  'node --check ' + STATIC,
  'node --check ' + BEHAVIOR,
  'node --check ' + INTEGRATION
];

syntaxMarkers.forEach(marker => {
  assert.strictEqual(
    count(
      workflow,
      marker
    ),
    1,
    'entrypoint CI syntax registration must occur exactly once: ' +
      marker
  );
});

[
  'run: node ' + STATIC,
  'run: node ' + BEHAVIOR,
  'run: node ' + INTEGRATION
].forEach(marker => {
  assert.strictEqual(
    count(
      workflow,
      marker
    ),
    1,
    'entrypoint CI execution registration must occur exactly once: ' +
      marker
  );
});

[
  'Check absentee-owner certified property-source provenance bounded rollout production entrypoint v2 syntax',
  'Validate absentee-owner certified property-source provenance bounded rollout production entrypoint v2 static',
  'Validate absentee-owner certified property-source provenance bounded rollout production entrypoint v2 behavior',
  'Validate absentee-owner certified property-source provenance bounded rollout production entrypoint v2 integration'
].forEach(marker => {
  assert.strictEqual(
    count(
      workflow,
      marker
    ),
    1,
    'entrypoint workflow step must occur exactly once: ' +
      marker
  );
});

assert.strictEqual(
  workflow.includes(
    DESIGN_VALIDATOR
  ),
  false,
  'design-only validator must remain outside production workflow registration'
);

console.log(
  'ABSENTEE_OWNER_V2_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_INTEGRATION_VALID=true'
);

console.log(
  'AUTHORIZED_RUNTIME_DEPENDENCY_COUNT=2'
);

console.log(
  'BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_FILE_COUNT=1'
);

console.log(
  'POST_COUNTY_PRODUCTION_FILE_COUNT=70'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=97'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_INVENTORY_104_PRESERVED=true'
);

console.log(
  'HISTORICAL_PRODUCTION_INVENTORY_147_PRESERVED=true'
);

console.log(
  'ENTRYPOINT_CI_REGISTRATION_EXACT=true'
);

console.log(
  'ORCHESTRATOR_IMMUTABLE=true'
);

console.log(
  'DIRECT_PLANNER_AUTHORITY=false'
);

console.log(
  'DIRECT_EXECUTOR_AUTHORITY=false'
);

console.log(
  'DIRECT_STORE_AUTHORITY=false'
);

console.log(
  'DIRECT_DATABASE_AUTHORITY=false'
);

console.log(
  'DEPLOYMENT_AUTHORITY=false'
);

console.log(
  'PRODUCTION_INVOCATION_AUTHORITY=false'
);
