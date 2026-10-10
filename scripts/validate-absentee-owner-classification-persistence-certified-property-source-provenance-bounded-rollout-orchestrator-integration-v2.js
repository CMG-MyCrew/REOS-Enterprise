#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const path =
  require('node:path');

const childProcess =
  require('node:child_process');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const BASE =
  'f7b75130030da1df8d8d1f4d0fbdb5d1f1144f2b';

const RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js';

const STATIC =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2.js';

const BEHAVIOR =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-behavior-v2.js';

const INTEGRATION =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-integration-v2.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const COUNTY_RUNTIME =
  'scripts/validate-county-runtime-integration.js';

const FREEZE_DOC =
  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.md';

const FREEZE_VALIDATOR =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.js';

const IMMUTABLE = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js',
  'build/apps-script-brand/Database.js'
];

function read(relative) {
  return fs.readFileSync(
    path.join(
      ROOT,
      relative
    ),
    'utf8'
  );
}

function count(text, needle) {
  return (
    text.split(
      needle
    ).length -
    1
  );
}

for (
  const relative of
  [
    RUNTIME,
    STATIC,
    BEHAVIOR,
    INTEGRATION,
    WORKFLOW,
    COUNTY_RUNTIME,
    FREEZE_DOC,
    FREEZE_VALIDATOR
  ].concat(
    IMMUTABLE
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
  read(WORKFLOW);

const county =
  read(COUNTY_RUNTIME);

const runtime =
  read(RUNTIME);

const syntaxStep =
  'Check absentee-owner certified property-source provenance bounded rollout orchestrator v2 syntax';

const staticStep =
  'Validate absentee-owner certified property-source provenance bounded rollout orchestrator v2 static';

const behaviorStep =
  'Validate absentee-owner certified property-source provenance bounded rollout orchestrator v2 behavior';

const integrationStep =
  'Validate absentee-owner certified property-source provenance bounded rollout orchestrator v2 integration';

for (
  const name of
  [
    syntaxStep,
    staticStep,
    behaviorStep,
    integrationStep
  ]
) {
  assert.equal(
    count(
      workflow,
      '- name: ' +
      name
    ),
    1,
    'workflow step must occur exactly once: ' +
      name
  );
}

for (
  const relative of
  [
    RUNTIME,
    STATIC,
    BEHAVIOR,
    INTEGRATION
  ]
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

assert.ok(
  workflow.includes(
    'run: node ' +
    STATIC
  ),
  'static validator workflow execution missing'
);

assert.ok(
  workflow.includes(
    'run: node ' +
    BEHAVIOR
  ),
  'behavior validator workflow execution missing'
);

assert.ok(
  workflow.includes(
    'run: node ' +
    INTEGRATION
  ),
  'integration validator workflow execution missing'
);

assert.ok(
  workflow.indexOf(
    integrationStep
  ) <
  workflow.indexOf(
    'Check absentee-owner certified property-source provenance executor v2 syntax'
  ),
  'orchestrator validation must execute before inherited executor validation'
);

const inventoryName =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2_PRODUCTION_FILES';

assert.equal(
  count(
    county,
    'const ' +
    inventoryName +
    ' = ['
  ),
  1,
  'county runtime dedicated orchestrator inventory missing or duplicated'
);

assert.equal(
  count(
    county,
    "'" +
    RUNTIME +
    "'"
  ),
  1,
  'county runtime orchestrator path must be registered exactly once'
);

assert.ok(
  county.includes(
    'certified property-source provenance bounded rollout orchestrator v2 surface is exactly one explicitly allowlisted additive internal orchestration file'
  ),
  'county runtime orchestrator containment pass marker missing'
);

const historicalMatch =
  county.match(
    /const\s+POST_COUNTY_PRODUCTION_FILES\s*=\s*\[(.*?)\];/s
  );

assert.ok(
  historicalMatch,
  'historical POST_COUNTY_PRODUCTION_FILES inventory missing'
);

assert.equal(
  historicalMatch[1].includes(
    RUNTIME
  ),
  false,
  'orchestrator must remain outside inherited post-county inventory'
);

for (
  const relative of
  IMMUTABLE
    .concat([
      FREEZE_DOC,
      FREEZE_VALIDATOR
    ])
) {
  const diff =
    childProcess
      .spawnSync(
        'git',
        [
          'diff',
          '--quiet',
          BASE,
          '--',
          relative
        ],
        {
          cwd: ROOT
        }
      );

  assert.equal(
    diff.status,
    0,
    'immutable/freeze dependency changed: ' +
      relative
  );
}

assert.equal(
  crypto
    .createHash('sha256')
    .update(
      read(FREEZE_DOC),
      'utf8'
    )
    .digest('hex'),
  '3dd26f468be78f26f9ff0a4be7de5253309b23297868b24900742fb8b875bd64',
  'freeze document SHA mismatch'
);

assert.ok(
  runtime.includes(
    'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2'
  )
);

assert.ok(
  runtime.includes(
    'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2'
  )
);

assert.equal(
  runtime.includes(
    'AbsenteeOwnerClassificationEvidenceStoreV2'
  ),
  false,
  'runtime must not directly call V2 store'
);

assert.equal(
  runtime.includes(
    'withScriptLockContext'
  ),
  false,
  'runtime must not own persistence lock'
);

assert.equal(
  runtime.includes(
    'function reosAbsenteeOwner'
  ),
  false,
  'runtime must not add a global production RPC'
);

const countyRun =
  childProcess
    .spawnSync(
      process.execPath,
      [
        path.join(
          ROOT,
          COUNTY_RUNTIME
        )
      ],
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    );

if (
  countyRun.status !==
  0
) {
  process.stdout.write(
    countyRun.stdout ||
    ''
  );

  process.stderr.write(
    countyRun.stderr ||
    ''
  );
}

assert.equal(
  countyRun.status,
  0,
  'county runtime integration validator failed'
);

console.log(
  'ABSENTEE_OWNER_V2_BOUNDED_ROLLOUT_ORCHESTRATOR_INTEGRATION_VALIDATION_PASS=true'
);
