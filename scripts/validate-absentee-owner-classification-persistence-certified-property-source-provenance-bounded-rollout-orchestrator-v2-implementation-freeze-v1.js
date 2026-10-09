'use strict';

const fs = require('fs');
const crypto = require('crypto');
const childProcess = require('child_process');

const BASE =
  '540120bc71803dcc9b0375020704e6d1fe61fd75';

const BASE_TREE =
  'fcdd49ab99db4fe99044311774dbc2c225ce866f';

const DESIGN_SHA256 =
  '3dd26f468be78f26f9ff0a4be7de5253309b23297868b24900742fb8b875bd64';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const DOC =
  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.md';

const SELF =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.js';

const FUTURE_RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js';

const FUTURE_STATIC =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2.js';

const FUTURE_BEHAVIOR =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-behavior-v2.js';

const FUTURE_INTEGRATION =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-integration-v2.js';

const COUNTY_RUNTIME_VALIDATOR =
  'scripts/validate-county-runtime-integration.js';

const BASE_WORKFLOW_BLOB =
  '622be9155f87daa3f7ac0017cd7244bc04527dee';

const COUNTY_RUNTIME_VALIDATOR_BLOB =
  '790be8ddfcfd09194f4959f2c868633c9eeb2e72';

const EXPECTED_BLOBS = Object.freeze({
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js':
    '2c353ca3ce173ff2d35b5722c7669af63a3b1cb0',

  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js':
    'fd034b1b367a5720da58ab26703e1e4a2bf7e937',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js':
    '3e8175c31763a8cc3f0f6fe665edd8eb3ff377cb',

  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js':
    '4c19474a66315b5277a8ebdd2864a0827e5a1595',

  'build/apps-script-brand/Database.js':
    '7488594963b8e95574d2235091c0751941484914'
});

const WORKFLOW_INSERTION =
  '\n' +
  '      - name: Validate absentee-owner certified property-source provenance bounded rollout orchestrator v2 implementation freeze v1\n' +
  '        run: node scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.js\n';

const EXPECTED_CHANGED_FILES = Object.freeze({
  '.github/workflows/county-collapse-offline.yml': 'M',
  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.md': 'A',
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.js': 'A'
});

function fail(message) {
  process.stderr.write(
    'STOP=' + message + '\n'
  );
  process.exit(1);
}

function requireCondition(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function read(path) {
  return fs.readFileSync(
    path,
    'utf8'
  );
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(
      Buffer.from(
        text,
        'utf8'
      )
    )
    .digest('hex');
}

function gitBlobSha(content) {
  const body =
    Buffer.from(
      content,
      'utf8'
    );

  const header =
    Buffer.from(
      'blob ' +
      body.length +
      '\0',
      'utf8'
    );

  return crypto
    .createHash('sha1')
    .update(header)
    .update(body)
    .digest('hex');
}

function gitHashObject(path) {
  return childProcess
    .execFileSync(
      'git',
      [
        'hash-object',
        '--',
        path
      ],
      {
        encoding: 'utf8',
        stdio: [
          'ignore',
          'pipe',
          'pipe'
        ]
      }
    )
    .trim();
}

function gitOutput(args) {
  return childProcess
    .execFileSync(
      'git',
      args,
      {
        encoding: 'utf8',
        stdio: [
          'ignore',
          'pipe',
          'pipe'
        ]
      }
    )
    .trim();
}

function countOccurrences(text, needle) {
  let count = 0;
  let offset = 0;

  while (true) {
    const index =
      text.indexOf(
        needle,
        offset
      );

    if (index === -1) {
      return count;
    }

    count++;
    offset =
      index +
      needle.length;
  }
}

requireCondition(
  fs.existsSync(DOC),
  'implementation-freeze document is missing'
);

requireCondition(
  fs.existsSync(SELF),
  'implementation-freeze validator is missing'
);

[
  FUTURE_RUNTIME,
  FUTURE_STATIC,
  FUTURE_BEHAVIOR,
  FUTURE_INTEGRATION
].forEach((path) => {
  requireCondition(
    !fs.existsSync(path),
    'future implementation surface must remain absent during freeze: ' +
      path
  );
});

Object.keys(EXPECTED_BLOBS)
  .forEach((path) => {
    requireCondition(
      fs.existsSync(path),
      'immutable dependency missing: ' +
        path
    );

    requireCondition(
      gitHashObject(path) ===
        EXPECTED_BLOBS[path],
      'immutable dependency changed: ' +
        path
    );
  });

requireCondition(
  fs.existsSync(
    COUNTY_RUNTIME_VALIDATOR
  ),
  'county runtime validator is missing'
);

requireCondition(
  gitHashObject(
    COUNTY_RUNTIME_VALIDATOR
  ) ===
    COUNTY_RUNTIME_VALIDATOR_BLOB,
  'county runtime validator changed during implementation freeze'
);

const doc =
  read(DOC);

requireCondition(
  sha256(doc) ===
    DESIGN_SHA256,
  'implementation-freeze document differs from certified design'
);

[
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2',
  '540120bc71803dcc9b0375020704e6d1fe61fd75',
  'fcdd49ab99db4fe99044311774dbc2c225ce866f',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js',
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2',
  'run(options)',
  'evidenceBundles',
  'propertySourceIdentityCertification',
  'normalLookupEvidence',
  'ownerEvidenceResult',
  'comparisonResult',
  'classificationResult',
  'PlannerV2.prepare(bundle)',
  'execute(originalBundle)',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED',
  'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN',
  'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION',
  'No global Apps Script production RPC is authorized in this capability.',
  'The orchestrator must never call the V2 evidence store directly.',
  'The orchestrator must never acquire its own persistence ScriptLock.',
  'no automatic retry',
  'maximum 10 bundles',
  'at least 46 cases',
  'Automatic MAO or offer authority remains prohibited'
].forEach((marker) => {
  requireCondition(
    doc.includes(marker),
    'freeze document marker missing: ' +
      marker
  );
});

requireCondition(
  !doc.includes(
    'function reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2'
  ),
  'freeze document must not define a public production RPC'
);

const workflow =
  read(WORKFLOW);

requireCondition(
  countOccurrences(
    workflow,
    WORKFLOW_INSERTION
  ) === 1,
  'freeze workflow insertion must occur exactly once'
);

requireCondition(
  countOccurrences(
    workflow,
    SELF
  ) === 1,
  'freeze validator workflow path must occur exactly once'
);

const reconstructedWorkflow =
  workflow.replace(
    WORKFLOW_INSERTION,
    ''
  );

requireCondition(
  gitBlobSha(
    reconstructedWorkflow
  ) ===
    BASE_WORKFLOW_BLOB,
  'workflow differs from certified base by more than exact freeze-validator registration'
);

const changed =
  gitOutput([
    'diff',
    '--name-status',
    BASE,
    'HEAD'
  ])
    .split('\n')
    .filter(Boolean);

const observed = {};

changed.forEach((line) => {
  const parts =
    line.split('\t');

  requireCondition(
    parts.length === 2,
    'unexpected implementation-freeze diff entry: ' +
      line
  );

  observed[
    parts[1]
  ] =
    parts[0];
});

requireCondition(
  Object.keys(observed).length ===
    3,
  'implementation-freeze commit must contain exactly three files'
);

Object.keys(EXPECTED_CHANGED_FILES)
  .forEach((path) => {
    requireCondition(
      observed[path] ===
        EXPECTED_CHANGED_FILES[path],
      'implementation-freeze file status mismatch: ' +
        path
    );
  });

requireCondition(
  gitOutput([
    'rev-parse',
    BASE + '^{tree}'
  ]) ===
    BASE_TREE,
  'certified base tree changed'
);

process.stdout.write(
  [
    'ABSENTEE_OWNER_V2_PERSISTENCE_BOUNDED_ROLLOUT_ORCHESTRATOR_IMPLEMENTATION_FREEZE_VALIDATION_PASS=true',
    'CAPABILITY=ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2',
    'CERTIFIED_BASE=' + BASE,
    'CERTIFIED_BASE_TREE=' + BASE_TREE,
    'CERTIFIED_DESIGN_SHA256=' + DESIGN_SHA256,
    'FREEZE_FILE_COUNT=3',
    'FUTURE_RUNTIME_PRESENT=false',
    'FUTURE_IMPLEMENTATION_VALIDATORS_PRESENT=false',
    'IMMUTABLE_DEPENDENCIES_EXACT=true',
    'COUNTY_RUNTIME_VALIDATOR_UNCHANGED=true',
    'FREEZE_DOCUMENT_EXACT_CERTIFIED_DESIGN=true',
    'WORKFLOW_CHANGE_EXACTLY_ONE_FREEZE_VALIDATOR_REGISTRATION=true',
    'PUBLIC_PRODUCTION_RPC_AUTHORIZED=false',
    'V2_PERSISTENCE_EXECUTION_AUTHORIZED=false',
    'IMPLEMENTATION_AUTHORIZED=false'
  ].join('\n') +
  '\n'
);
