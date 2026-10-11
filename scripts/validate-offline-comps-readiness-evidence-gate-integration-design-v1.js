'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');

const design = fs.readFileSync(
  path.join(
    root,
    'docs/offline-comps-readiness-evidence-gate-integration-design-v1.md'
  ),
  'utf8'
);

function requireMarker(marker) {
  assert(
    design.includes(marker),
    `required marker missing: ${JSON.stringify(marker)}`
  );
}

[
  'compSupportedArvReady === true',
  'repairScopeReady === true',

  'getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)',
  'getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)',

  'Only `selected` may supply evidence.',
  'not_found',
  'stale',
  'identity_mismatch',
  'contradictory',
  'unsupported_version',
  'malformed',

  'evaluateOfflineCompsReadiness({',

  'decision',
  'reasonCodes',
  'arvEvidenceId',
  'repairScopeEvidenceId',
  'gateVersion',

  'Any cross-surface mismatch fails closed.',
  'No identity repair authority is granted.',

  'The same explicit `asOf` must bind:',
  'The integration must not replace `asOf` with current time.',

  'ARV Evidence ID',
  'Repair Scope Evidence ID',

  'compSupportedArvReady=false, repairScopeReady=false -> blocked',
  'compSupportedArvReady=false, repairScopeReady=true  -> blocked',
  'compSupportedArvReady=true,  repairScopeReady=false -> blocked',
  'compSupportedArvReady=true,  repairScopeReady=true  -> eligible',

  '`eligible` is evidence-layer readiness only.',
  'It does not authorize an offer.',

  'Unexpected mapper output must fail closed.',
  'Mapper exceptions must fail closed.',
  'Unknown gate versions must fail closed.',

  'DEAL_COMPARABLES row presence',
  'comparable count alone',
  'legacy Comparable Analysis ARV',
  'deal-level ARV scalar',
  'rehab budget',
  'repair-cost scalar',
  'previous Offer Generation state',

  'Production wiring is a separate future certification phase.',

  'build/apps-script-brand/DealAnalyzer.js',
  'build/apps-script-brand/DealLifecycleWorkflow.js',
  'build/apps-script-brand/AcquisitionWorkflow.js',
  'build/apps-script-brand/Database.js',

  'productionPersistenceAuthorityGranted = false',
  'productionComparableAcceptanceAuthorityGranted = false',
  'productionArvAuthorityGranted = false',
  'repairScopeAuthorityGranted = false',
  'qualifiedDealQueueAuthorityGranted = false',
  'acquisitionLifecycleAuthorityGranted = false',
  'maoAuthorityGranted = false',
  'offerGenerationAuthorityGranted = false',
  'offerSubmissionAuthorityGranted = false',
  'automaticOfferAuthorityGranted = false',

  'This design does not authorize a production RPC.',
  'This design does not authorize production persistence.',
  'This design does not authorize production source wiring.',
  'This design does not authorize lifecycle advancement.',
  'This design does not authorize Qualified Deal Queue mutation.',
  'This design does not authorize MAO calculation.',
  'This design does not authorize offer generation.',
  'This design does not authorize offer submission.',
  'This design does not authorize automatic offer authority.'
].forEach(requireMarker);

assert(
  !design.includes('automaticOfferAuthorityGranted = true')
);

assert(
  !design.includes('offerSubmissionAuthorityGranted = true')
);

assert(
  !design.includes('maoAuthorityGranted = true')
);

console.log('EXISTING_HARDENED_GATE_PRESERVED=true');
console.log('EXPLICIT_EVIDENCE_READ_BOUNDARY_DESIGNED=true');
console.log('EXPLICIT_ASOF_FLOW_DESIGNED=true');
console.log('MAPPER_INTEGRATION_BOUNDARY_DESIGNED=true');
console.log('READINESS_PROJECTION_BOUNDARY_DESIGNED=true');
console.log('EXACT_EVIDENCE_REFERENCE_BINDING_DESIGNED=true');
console.log('CROSS_SURFACE_IDENTITY_FAIL_CLOSED=true');
console.log('NON_SELECTED_READ_OUTCOMES_FAIL_CLOSED=true');
console.log('EXACT_FOUR_CASE_TRUTH_TABLE_DESIGNED=true');
console.log('UNEXPECTED_MAPPER_OUTPUT_FAIL_CLOSED=true');
console.log('EXCEPTION_PATH_FAIL_CLOSED=true');
console.log('LEGACY_SCALAR_INFERENCE_ALLOWED=false');
console.log('PRODUCTION_SOURCE_WIRING_AUTHORIZED=false');
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
  'OFFLINE_COMPS_READINESS_EVIDENCE_GATE_INTEGRATION_DESIGN_V1_VALID=true'
);
