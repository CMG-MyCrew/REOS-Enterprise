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

const FREEZE_DOC =
  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.md';

const IMMUTABLE = Object.freeze({
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

function file(relative) {
  return path.join(
    ROOT,
    relative
  );
}

function git(args) {
  return childProcess
    .execFileSync(
      'git',
      args,
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    )
    .trim();
}

assert.ok(
  fs.existsSync(
    file(RUNTIME)
  ),
  'orchestrator runtime missing'
);

const source =
  fs.readFileSync(
    file(RUNTIME),
    'utf8'
  );

const required = [
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2',
  'MAX_EVIDENCE_BUNDLES = 10',
  "'evidenceBundles'",
  "'propertySourceIdentityCertification'",
  "'normalLookupEvidence'",
  "'ownerEvidenceResult'",
  "'comparisonResult'",
  "'classificationResult'",
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2',
  '.prepare(',
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2',
  '.execute(',
  'DUPLICATE_PHYSICAL_TARGET_ROW',
  'DUPLICATE_TARGET_DUAL_IDENTITY',
  'DUPLICATE_DETERMINISTIC_V2_EVENT_ID',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED',
  'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN',
  'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION',
  'ESCAPED_EXECUTOR_EXCEPTION',
  'UNEXPECTED_EXECUTOR_RESULT',
  'requestedBundleCount',
  'preflightedBundleCount',
  'processedBundleCount',
  'verifiedPersistenceCount',
  'alreadyPersistedCount',
  'bundleResults',
  'targetIdentity',
  'persistenceOutcome',
  'haltIndex',
  'haltPersistenceOutcome',
  'classifierResultSha256',
  'evidenceEventId',
  'evidenceEventSha256',
  'physicalEvidenceRowNumber',
  'publicProductionRpcAuthorityGranted: false',
  'schedulerAuthorityGranted: false',
  'triggerAuthorityGranted: false',
  'arvAuthorityGranted: false',
  'repairScopeAuthorityGranted: false',
  'maoAuthorityGranted: false',
  'offerGenerationAuthorityGranted: false',
  'offerSubmissionAuthorityGranted: false'
];

for (
  const marker of
  required
) {
  assert.ok(
    source.includes(marker),
    'runtime marker missing: ' +
      marker
  );
}

assert.equal(
  (
    source.match(
      /\.prepare\(/g
    ) ||
    []
  ).length,
  1,
  'orchestrator must contain one planner call site'
);

assert.equal(
  (
    source.match(
      /\.execute\(/g
    ) ||
    []
  ).length,
  1,
  'orchestrator must contain one executor call site'
);

const forbidden = [
  'AbsenteeOwnerClassificationEvidenceStoreV2',
  'withScriptLockContext',
  'LockService',
  'SpreadsheetApp',
  'UrlFetchApp',
  'ScriptApp',
  'PropertiesService',
  '.appendRow(',
  '.setValue(',
  '.setValues(',
  '.deleteRow(',
  '.insertRow(',
  'function reosAbsenteeOwner',
  'globalThis.',
  'eval('
];

for (
  const marker of
  forbidden
) {
  assert.equal(
    source.includes(marker),
    false,
    'forbidden orchestrator surface found: ' +
      marker
  );
}

for (
  const [
    relative,
    expected
  ] of
  Object.entries(IMMUTABLE)
) {
  assert.equal(
    git([
      'hash-object',
      '--',
      relative
    ]),
    expected,
    'immutable dependency changed: ' +
      relative
  );

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
    'immutable dependency differs from certified base: ' +
      relative
  );
}

const freeze =
  fs.readFileSync(
    file(FREEZE_DOC),
    'utf8'
  );

assert.equal(
  crypto
    .createHash('sha256')
    .update(
      freeze,
      'utf8'
    )
    .digest('hex'),
  '3dd26f468be78f26f9ff0a4be7de5253309b23297868b24900742fb8b875bd64',
  'freeze document identity changed'
);

assert.ok(
  freeze.includes(
    'The orchestrator must never call the V2 evidence store directly.'
  )
);

assert.ok(
  freeze.includes(
    'The orchestrator must never acquire its own persistence ScriptLock.'
  )
);

assert.ok(
  freeze.includes(
    'The eventual implementation behavioral suite must contain at least 46 cases.'
  )
);

console.log(
  'ABSENTEE_OWNER_V2_BOUNDED_ROLLOUT_ORCHESTRATOR_STATIC_VALIDATION_PASS=true'
);
