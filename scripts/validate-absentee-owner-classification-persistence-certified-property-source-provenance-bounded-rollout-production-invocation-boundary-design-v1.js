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

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const DESIGN =
  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-invocation-boundary-design-v1.md';

const ORCHESTRATOR =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js';

const EXPECTED_ORCHESTRATOR_SHA256 =
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
  ORCHESTRATOR
].forEach(relative => {
  assert.ok(
    fs.existsSync(
      full(relative)
    ),
    'required production invocation design dependency missing: ' +
      relative
  );
});

assert.equal(
  sha256(ORCHESTRATOR),
  EXPECTED_ORCHESTRATOR_SHA256,
  'certified V2 bounded-rollout orchestrator changed'
);

const text =
  read(DESIGN);

[
  '# Absentee-Owner Certified Property-Source Provenance Bounded-Rollout Production Invocation Boundary Design v1',

  '`manual_bounded_admin_only`',

  '`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2`',

  '`execute(options)`',

  '`reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2(options)`',

  '`REOS.Security.requireAdmin()` must execute exactly once',

  '`evidenceBundles`',

  'between 1 and 10 bundles inclusive',

  '`propertySourceIdentityCertification`',
  '`normalLookupEvidence`',
  '`ownerEvidenceResult`',
  '`comparisonResult`',
  '`classificationResult`',

  'No sixth bundle field is allowed.',

  'The entrypoint performs only structural envelope validation.',

  'The entrypoint must delegate exactly once',

  '`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.run(options)`',

  'The original validated `options` object must be passed to the orchestrator.',

  'The entrypoint must not call the V2 planner directly.',
  'The entrypoint must not call the V2 executor directly.',
  'The entrypoint must not call the V2 evidence store directly.',
  'The entrypoint must not call Database directly.',
  'The entrypoint must not acquire a ScriptLock.',

  'Automatic retry authority is zero.',
  'Scheduler authority is zero.',
  'Trigger authority is zero.',
  'Background continuation authority is zero.',

  '`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_COMPLETED`',

  '`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_PRECONDITION_FAILED`',

  '`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_OUTCOME_UNCERTAIN`',

  'The entrypoint must not invent persistence evidence.',

  'An escaped orchestrator exception must fail closed.',

  'A malformed orchestrator result fails closed.',

  'An orchestrator result containing any unexpected true authority grant fails closed.',

  'Deployment of the eventual entrypoint does not authorize production invocation.',

  'Every actual bounded rollout requires a separate invocation authorization',

  'The eventual behavior suite must contain at least 48 cases.',

  'ARV authority remains false.',
  'Repair-scope authority remains false.',
  'MAO authority remains false.',
  'Offer-generation authority remains false.',
  'Offer-submission authority remains false.',

  'Automatic MAO or offer authority remains blocked unless both adequate comp-supported ARV and an adequate repair scope are present.',

  'This design does not authorize Apps Script version 158.',
  'This design does not authorize production invocation.',
  'This design does not authorize V2 persistence execution.'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required design marker missing: ' +
      marker
  );
});

[
  'AUTOMATIC_RETRY_AUTHORITY=true',
  'SCHEDULER_AUTHORITY=true',
  'TRIGGER_AUTHORITY=true',
  'DIRECT_STORE_AUTHORITY=true',
  'DIRECT_EXECUTOR_AUTHORITY=true',
  'ARV_AUTHORITY=true',
  'REPAIR_SCOPE_AUTHORITY=true',
  'MAO_AUTHORITY=true',
  'OFFER_GENERATION_AUTHORITY=true',
  'OFFER_SUBMISSION_AUTHORITY=true',
  'PRODUCTION_INVOCATION_AUTHORIZED=true',
  'V2_PERSISTENCE_EXECUTION_AUTHORIZED=true'
].forEach(marker => {
  assert.equal(
    text.includes(marker),
    false,
    'prohibited authority marker present: ' +
      marker
  );
});

const rpcName =
  'reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2';

assert.equal(
  (
    text.match(
      new RegExp(
        rpcName,
        'g'
      )
    ) || []
  ).length,
  1,
  'design must define the production RPC exactly once'
);

console.log(
  'ABSENTEE_OWNER_V2_BOUNDED_ROLLOUT_PRODUCTION_INVOCATION_BOUNDARY_DESIGN_VALID=true'
);

console.log(
  'INVOCATION_MODEL=manual_bounded_admin_only'
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
  'DIRECT_PLANNER_AUTHORITY=false'
);

console.log(
  'DIRECT_EXECUTOR_AUTHORITY=false'
);

console.log(
  'DIRECT_STORE_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORITY=false'
);

console.log(
  'SCHEDULER_AUTHORITY=false'
);

console.log(
  'TRIGGER_AUTHORITY=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_INVOCATION_AUTHORIZED=false'
);

console.log(
  'V2_PERSISTENCE_EXECUTION_AUTHORIZED=false'
);

console.log(
  'ACQUISITION_SAFETY_GATE_PRESERVED=true'
);
