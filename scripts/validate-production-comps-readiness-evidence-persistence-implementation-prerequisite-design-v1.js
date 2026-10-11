'use strict';

const fs = require('fs');
const path = require('path');

function requireTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const root = path.resolve(__dirname, '..');
const designPath = path.join(
  root,
  'docs',
  'production-comps-readiness-evidence-persistence-implementation-prerequisite-design-v1.md'
);

requireTrue(fs.existsSync(designPath), 'design document missing');

const source = fs.readFileSync(designPath, 'utf8');

const requiredMarkers = [
  'Production Comps Readiness Evidence Persistence Implementation Prerequisite Design v1',

  '`DEAL_ARV_EVIDENCE`',
  '`DEAL_REPAIR_SCOPE_EVIDENCE`',
  '`DEAL_OFFER_READINESS_EVIDENCE`',

  '`appendDealArvEvidence(record)`',
  '`appendDealRepairScopeEvidence(record)`',
  '`appendDealOfferReadinessEvidence(record)`',

  '`getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)`',
  '`getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)`',
  '`getCurrentDealOfferReadinessEvidence(dealId, canonicalPropertyKey, asOf)`',

  '`selected`',
  '`not_found`',
  '`stale`',
  '`identity_mismatch`',
  '`contradictory`',
  '`unsupported_version`',
  '`malformed`',

  '`appended`',
  '`idempotent_existing`',
  '`rejected_validation`',
  '`rejected_identity`',
  '`rejected_idempotency_conflict`',
  '`failed_persistence`',

  '`ARVE-`',
  '`RSE-`',
  '`ORE-`',

  '`Supersedes Evidence ID`',
  '`Idempotency Key`',

  'Implicit wall-clock selection is prohibited.',
  'Missing identity must never be repaired by inference.',
  'Unknown or unsupported schema versions fail closed.',
  'Unknown or unsupported gate versions fail closed.',
  'There is no readiness-positive fallback.',

  '`compSupportedArvReady === true`',
  '`repairScopeReady === true`',

  'Production gate wiring must remain blocked while the six production evidence',
  'APIs are absent.',

  'This design does not authorize a production RPC.',
  'This design does not authorize a Google Sheets read or write.',
  'This design does not authorize production persistence.',
  'This design does not authorize provider requests.',
  'This design does not authorize live comparable retrieval.',
  'This design does not authorize production ARV calculation.',
  'This design does not authorize repair-scope mutation.',
  'This design does not authorize readiness persistence.',
  'This design does not authorize Qualified Deal Queue mutation.',
  'This design does not authorize acquisition lifecycle mutation.',
  'This design does not authorize MAO calculation.',
  'This design does not authorize Offer Generation.',
  'This design does not authorize offer submission.',
  'This design does not authorize deployment.',
  'This design does not authorize trigger changes.',

  '`productionPersistenceAuthorityGranted = false`',
  '`productionComparableAcceptanceAuthorityGranted = false`',
  '`productionArvAuthorityGranted = false`',
  '`repairScopeAuthorityGranted = false`',
  '`qualifiedDealQueueAuthorityGranted = false`',
  '`acquisitionLifecycleAuthorityGranted = false`',
  '`maoAuthorityGranted = false`',
  '`offerGenerationAuthorityGranted = false`',
  '`offerSubmissionAuthorityGranted = false`',
  '`automaticOfferAuthorityGranted = false`',

  '`implement_offline_certifiable_production_comps_readiness_evidence_persistence_module_v1`'
];

for (const marker of requiredMarkers) {
  requireTrue(
    source.includes(marker),
    `required design marker missing: ${JSON.stringify(marker)}`
  );
}

const forbiddenPositiveAuthority = [
  'productionPersistenceAuthorityGranted = true',
  'productionComparableAcceptanceAuthorityGranted = true',
  'productionArvAuthorityGranted = true',
  'repairScopeAuthorityGranted = true',
  'qualifiedDealQueueAuthorityGranted = true',
  'acquisitionLifecycleAuthorityGranted = true',
  'maoAuthorityGranted = true',
  'offerGenerationAuthorityGranted = true',
  'offerSubmissionAuthorityGranted = true',
  'automaticOfferAuthorityGranted = true'
];

for (const marker of forbiddenPositiveAuthority) {
  requireTrue(
    !source.includes(marker),
    `forbidden authority marker present: ${marker}`
  );
}

const schemas = {
  arv: [
    'ARV Evidence ID',
    'Schema Version',
    'Deal ID',
    'Canonical Property Key',
    'Evidence Status',
    'Confidence Status',
    'Estimated ARV',
    'Accepted Comparable Evidence IDs JSON',
    'Accepted Comparable Count',
    'Minimum Comparable Count',
    'Valuation Method',
    'Valuation Inputs JSON',
    'Supported Low Value',
    'Supported High Value',
    'Review Required',
    'Reason Codes JSON',
    'Evidence Generated At',
    'Persisted At',
    'Source Engine',
    'Source Engine Version',
    'Provenance JSON',
    'Idempotency Key',
    'Supersedes Evidence ID'
  ],
  repair: [
    'Repair Scope Evidence ID',
    'Schema Version',
    'Deal ID',
    'Canonical Property Key',
    'Scope Status',
    'Scope Complete',
    'Estimated Repair Cost',
    'Review Required',
    'Reason Codes JSON',
    'Scope Inputs JSON',
    'Evidence Generated At',
    'Persisted At',
    'Source Engine',
    'Source Engine Version',
    'Provenance JSON',
    'Idempotency Key',
    'Supersedes Evidence ID'
  ],
  readiness: [
    'Readiness Evidence ID',
    'Schema Version',
    'Deal ID',
    'Canonical Property Key',
    'ARV Evidence ID',
    'Repair Scope Evidence ID',
    'Decision',
    'Comp Supported ARV Ready',
    'Repair Scope Ready',
    'Reason Codes JSON',
    'Evaluated At',
    'Persisted At',
    'Gate Version',
    'Idempotency Key',
    'Supersedes Evidence ID'
  ]
};

for (const [surface, fields] of Object.entries(schemas)) {
  for (const field of fields) {
    requireTrue(
      source.includes('`' + field + '`'),
      `${surface} schema field missing: ${field}`
    );
  }
}

requireTrue(
  /Only `selected` may supply evidence to readiness mapping\./.test(source),
  'selected-only readiness supply rule missing'
);

requireTrue(
  /Every other outcome fails closed\./.test(source),
  'non-selected fail-closed rule missing'
);

requireTrue(
  /The same idempotency key with materially different evidence must return\s+`rejected_idempotency_conflict`\./m.test(source),
  'idempotency conflict rule missing'
);

requireTrue(
  /The implementation must not resolve contradictory current candidates by\s+choosing whichever candidate produces a readiness-positive result\./m.test(source),
  'contradictory-current-evidence fail-closed rule missing'
);

requireTrue(
  /It must not use legacy scalar ARV, rehab budget, repair estimate, comparable\s+count, workflow stage, previous offer state, or manually populated numeric\s+values to manufacture evidence\./m.test(source),
  'legacy scalar inference prohibition missing'
);

requireTrue(
  /A persisted readiness row is evidence only\. It is not workflow authority\./.test(source),
  'readiness evidence authority boundary missing'
);

requireTrue(
  /Even a future readiness decision of `eligible` remains evidence-layer\s+eligibility and does not independently authorize MAO, Offer Generation, offer\s+submission, Qualified Deal Queue advancement, or acquisition lifecycle\s+advancement\./m.test(source),
  'eligible authority boundary missing'
);

console.log('EXACT_THREE_EVIDENCE_SURFACES_DESIGNED=true');
console.log('EXACT_SIX_PRODUCTION_EVIDENCE_APIS_DESIGNED=true');
console.log('EXACT_ARV_SCHEMA_PRESERVED=true');
console.log('EXACT_REPAIR_SCOPE_SCHEMA_PRESERVED=true');
console.log('EXACT_READINESS_SCHEMA_PRESERVED=true');
console.log('EXPLICIT_AS_OF_REQUIRED=true');
console.log('SELECTED_ONLY_READINESS_SUPPLY_REQUIRED=true');
console.log('IDENTITY_BINDING_REQUIRED=true');
console.log('SUPERSESSION_FAIL_CLOSED_REQUIRED=true');
console.log('IDEMPOTENCY_REQUIRED=true');
console.log('UNKNOWN_VERSION_FAIL_CLOSED_REQUIRED=true');
console.log('LEGACY_SCALAR_INFERENCE_PROHIBITED=true');
console.log('READINESS_EVIDENCE_IS_NOT_WORKFLOW_AUTHORITY=true');
console.log('PRODUCTION_GATE_WIRING_REMAINS_BLOCKED=true');
console.log('PRODUCTION_PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('PRODUCTION_ARV_AUTHORITY_GRANTED=false');
console.log('REPAIR_SCOPE_AUTHORITY_GRANTED=false');
console.log('QUALIFIED_DEAL_QUEUE_AUTHORITY_GRANTED=false');
console.log('ACQUISITION_LIFECYCLE_AUTHORITY_GRANTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_GENERATION_AUTHORITY_GRANTED=false');
console.log('OFFER_SUBMISSION_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
console.log(
  'PRODUCTION_COMPS_READINESS_EVIDENCE_PERSISTENCE_IMPLEMENTATION_PREREQUISITE_DESIGN_V1_VALID=true'
);
