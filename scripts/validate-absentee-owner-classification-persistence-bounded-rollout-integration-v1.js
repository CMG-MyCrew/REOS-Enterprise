#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

function read(relative) {
  return fs.readFileSync(
    path.join(
      ROOT,
      relative
    ),
    'utf8'
  );
}

const runtimeFiles = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js'
];

const validators = [
  'scripts/validate-absentee-owner-classification-persistence-bounded-rollout-contract-v1.js',
  'scripts/validate-absentee-owner-classification-persistence-bounded-rollout-implementation-freeze-v1.js',
  'scripts/validate-absentee-owner-classification-persistence-bounded-rollout-v1.js',
  'scripts/validate-absentee-owner-classification-persistence-bounded-rollout-behavior-v1.js',
  'scripts/validate-absentee-owner-classification-persistence-bounded-rollout-integration-v1.js'
];

for (
  const relative of
  runtimeFiles.concat(
    validators
  )
) {
  assert.ok(
    fs.existsSync(
      path.join(
        ROOT,
        relative
      )
    ),
    'required integrated file missing: ' +
      relative
  );
}

const workflow =
  read(
    '.github/workflows/county-collapse-offline.yml'
  );

const runtimeIntegration =
  read(
    'scripts/validate-county-runtime-integration.js'
  );

const database =
  read(
    'build/apps-script-brand/Database.js'
  );

const schema =
  read(
    'build/apps-script-brand/DistressLeadCountySchema.js'
  );

const singleRecord =
  read(
    'build/apps-script-brand/AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js'
  );

const clasp =
  JSON.parse(
    read(
      '.clasp.json'
    )
  );

const manifest =
  JSON.parse(
    read(
      'build/apps-script-brand/appsscript.json'
    )
  );

for (
  const relative of
  runtimeFiles.concat(
    validators
  )
) {
  assert.ok(
    workflow.includes(
      'node --check ' +
      relative
    ),
    'workflow syntax registration missing: ' +
      relative
  );
}

const dedicatedSteps = [
  'Validate absentee-owner classification persistence bounded rollout contract v1',
  'Validate absentee-owner classification persistence bounded rollout implementation freeze v1',
  'Validate absentee-owner classification persistence bounded rollout implementation static v1',
  'Validate absentee-owner classification persistence bounded rollout implementation behavior v1',
  'Validate absentee-owner classification persistence bounded rollout implementation integration v1'
];

for (
  const name of
  dedicatedSteps
) {
  assert.strictEqual(
    workflow
      .split(
        '- name: ' +
        name
      )
      .length -
      1,
    1,
    'workflow dedicated step must occur exactly once: ' +
      name
  );
}

for (
  const relative of
  validators
) {
  assert.ok(
    workflow.includes(
      'run: node ' +
      relative
    ),
    'workflow validator execution missing: ' +
      relative
  );
}

assert.ok(
  workflow.indexOf(
    'Validate absentee-owner classification persistence bounded rollout implementation integration v1'
  ) <
  workflow.indexOf(
    'Validate certified county runtime integration'
  ),
  'implementation integration validation must run before certified county runtime integration'
);

const match =
  runtimeIntegration.match(
    /const\s+POST_COUNTY_PRODUCTION_FILES\s*=\s*\[(.*?)\];/s
  );

assert.ok(
  match,
  'POST_COUNTY_PRODUCTION_FILES inventory missing'
);

const inventory =
  Array.from(
    match[1].matchAll(
      /'([^']+)'/g
    ),
    (item) =>
      item[1]
  );

for (
  const relative of
  runtimeFiles
) {
  assert.strictEqual(
    inventory.filter(
      (file) =>
        file === relative
    ).length,
    1,
    'runtime integration must register implementation file exactly once: ' +
      relative
  );
}

for (
  const relative of
  [
    'build/apps-script-brand/AbsenteeOwnerEnrichmentExactRecordSelector.js',
    'build/apps-script-brand/AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js',
    'build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js',
    'build/apps-script-brand/AbsenteeOwnerClassification.js',
    'build/apps-script-brand/AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js'
  ]
) {
  assert.ok(
    inventory.includes(
      relative
    ),
    'existing absentee-owner runtime registration lost: ' +
      relative
  );
}

assert.ok(
  database.includes(
    'function withScriptLockContext(work)'
  ),
  'Database ScriptLock authority missing'
);

assert.ok(
  database.includes(
    'assertScriptLockContext: assertScriptLockContext'
  ),
  'Database lock assertion export missing'
);

assert.strictEqual(
  schema.includes(
    'Absentee Owner Classification'
  ),
  false,
  'DISTRESS_LEADS schema must not gain classification field'
);

assert.strictEqual(
  singleRecord.includes(
    'AbsenteeOwnerClassificationPersistenceExecutor'
  ),
  false,
  'read-only certification entrypoint must not gain persistence authority'
);

assert.strictEqual(
  singleRecord.includes(
    'AbsenteeOwnerClassificationBoundedRollout'
  ),
  false,
  'read-only certification entrypoint must not become rollout authority'
);

assert.strictEqual(
  clasp.rootDir,
  'build/apps-script-brand'
);

assert.ok(
  clasp
    .scriptExtensions
    .includes(
      '.js'
    )
);

assert.deepStrictEqual(
  clasp.filePushOrder,
  []
);

assert.strictEqual(
  manifest.runtimeVersion,
  'V8'
);

assert.ok(
  manifest
    .oauthScopes
    .includes(
      'https://www.googleapis.com/auth/spreadsheets'
    )
);

assert.ok(
  manifest
    .oauthScopes
    .includes(
      'https://www.googleapis.com/auth/script.external_request'
    )
);

const rollout =
  read(
    'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js'
  );

assert.ok(
  rollout.includes(
    'function reosAbsenteeOwnerClassificationBoundedRollout('
  )
);

assert.strictEqual(
  rollout.includes(
    'reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord('
  ),
  false
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_BOUNDED_ROLLOUT_INTEGRATION_VALID=true'
);

console.log(
  'RUNTIME_SURFACE_COUNT=4'
);

console.log(
  'DEDICATED_IMPLEMENTATION_VALIDATION_STEP_COUNT=5'
);

console.log(
  'WORKFLOW_REGISTRATION_VALID=true'
);

console.log(
  'RUNTIME_INTEGRATION_REGISTRATION_VALID=true'
);

console.log(
  'DATABASE_MODIFICATION_REQUIRED=false'
);

console.log(
  'DISTRESS_LEADS_SCHEMA_MODIFICATION_REQUIRED=false'
);

console.log(
  'MANIFEST_MODIFICATION_REQUIRED=false'
);

console.log(
  'CLASP_CONFIGURATION_MODIFICATION_REQUIRED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
