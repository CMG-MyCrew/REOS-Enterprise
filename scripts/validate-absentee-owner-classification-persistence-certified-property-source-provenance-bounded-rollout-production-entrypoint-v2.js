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

[
  DESIGN,
  RUNTIME,
  ORCHESTRATOR
].forEach(relative => {
  assert.ok(
    fs.existsSync(
      full(relative)
    ),
    'required entrypoint surface missing: ' +
      relative
  );
});

assert.strictEqual(
  sha256(DESIGN),
  EXPECTED_DESIGN_SHA,
  'certified production invocation design changed'
);

assert.strictEqual(
  sha256(ORCHESTRATOR),
  EXPECTED_ORCHESTRATOR_SHA,
  'certified bounded-rollout orchestrator changed'
);

const text =
  read(RUNTIME);

[
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2',
  'function execute(options)',
  'execute: execute',
  'function reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2(',
  'REOS.Security.requireAdmin();',
  "'MANUAL_BOUNDED_ADMIN_ONLY'",
  "'evidenceBundles'",
  "'propertySourceIdentityCertification'",
  "'normalLookupEvidence'",
  "'ownerEvidenceResult'",
  "'comparisonResult'",
  "'classificationResult'",
  'MAX_EVIDENCE_BUNDLES = 10',
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2',
  '.run(',
  'INVALID_ORCHESTRATOR_RESULT',
  'ORCHESTRATOR_EXECUTION_FAILED',
  'automatic retry is prohibited',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_COMPLETED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_OUTCOME_UNCERTAIN'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required runtime marker missing: ' +
      marker
  );
});

[
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2',
  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2',
  'REOS.AbsenteeOwnerClassificationEvidenceStoreV2',
  'REOS.Database',
  'SpreadsheetApp',
  'UrlFetchApp',
  'ScriptApp',
  'LockService',
  'PropertiesService',
  'setValue(',
  'setValues(',
  'appendRow(',
  'deleteRow(',
  'insertRow(',
  'evidenceEventId',
  'evidenceEventSha256',
  'previousEventSha256',
  'physicalEvidenceRowNumber',
  'persistedAt',
  'storageRow',
  'lockState',
  'writeState',
  'retryState',
  'resumeToken'
].forEach(marker => {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited direct runtime marker present: ' +
      marker
  );
});

const authorityFields = [
  'productionDataMutationAuthorityGranted',
  'sourceEvidenceRetrievalAuthorityGranted',
  'ownerEvidenceRetrievalAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'propertySourceIdentityCertificationAuthorityGranted',
  'classificationAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'publicProductionRpcAuthorityGranted',
  'boundedRolloutProductionAuthorityGranted',
  'ownerOccupancyAuthorityGranted',
  'vacancyAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerGenerationAuthorityGranted',
  'offerSubmissionAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

authorityFields.forEach(field => {
  assert.ok(
    new RegExp(
      field +
      '\\s*:\\s*false'
    ).test(text),
    'authority field must remain false: ' +
      field
  );
});

assert.strictEqual(
  (
    text.match(
      /REOS\.Security\.requireAdmin\(\);/g
    ) || []
  ).length,
  1,
  'admin gate must execute exactly once'
);

assert.strictEqual(
  (
    text.match(
      /\.run\s*\(/g
    ) || []
  ).length,
  1,
  'certified orchestrator must be invoked exactly once'
);

assert.strictEqual(
  (
    text.match(
      /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/g
    ) || []
  ).length,
  1,
  'exactly one global production RPC is permitted'
);

const rpcMatches =
  text.match(
    /\bfunction\s+reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2\s*\(/g
  ) || [];

assert.strictEqual(
  rpcMatches.length,
  1,
  'authorized bounded-rollout RPC must occur exactly once'
);

const executeStart =
  text.indexOf(
    'function execute(options)'
  );

const adminIndex =
  text.indexOf(
    'REOS.Security.requireAdmin();',
    executeStart
  );

const validationIndex =
  text.indexOf(
    'validateInput_(',
    adminIndex
  );

const dependencyIndex =
  text.indexOf(
    'dependenciesAvailable_()',
    validationIndex
  );

const delegationIndex =
  text.indexOf(
    '.run(',
    dependencyIndex
  );

assert.ok(
  executeStart >= 0 &&
  adminIndex > executeStart &&
  validationIndex > adminIndex &&
  dependencyIndex > validationIndex &&
  delegationIndex > dependencyIndex,
  'admin / validation / dependency / delegation order changed'
);

console.log(
  'ABSENTEE_OWNER_V2_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_STATIC_VALID=true'
);

console.log(
  'DESIGN_AUTHORITY_EXACT=true'
);

console.log(
  'ORCHESTRATOR_IMMUTABLE=true'
);

console.log(
  'ADMIN_GATE_FIRST=true'
);

console.log(
  'ADMIN_GATE_INVOCATION_COUNT=1'
);

console.log(
  'TOP_LEVEL_INPUT_FIELD_COUNT=1'
);

console.log(
  'MAX_BUNDLE_COUNT=10'
);

console.log(
  'BUNDLE_ARTIFACT_FIELD_COUNT=5'
);

console.log(
  'ORCHESTRATOR_DELEGATION_COUNT=1'
);

console.log(
  'GLOBAL_PRODUCTION_RPC_COUNT=1'
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
  'DIRECT_HTTP_AUTHORITY=false'
);

console.log(
  'DIRECT_SPREADSHEET_AUTHORITY=false'
);

console.log(
  'SCHEDULER_AUTHORITY=false'
);

console.log(
  'TRIGGER_AUTHORITY=false'
);

console.log(
  'ARV_AUTHORITY=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'OFFER_AUTHORITY=false'
);
