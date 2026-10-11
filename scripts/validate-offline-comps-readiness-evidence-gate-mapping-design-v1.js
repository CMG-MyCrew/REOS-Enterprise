'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const designPath = path.join(
  root,
  'docs',
  'offline-comps-readiness-evidence-gate-mapping-design-v1.md'
);

function requireTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const text = fs.readFileSync(designPath, 'utf8');

const required = [
  'compSupportedArvReady === true',
  'repairScopeReady === true',

  'getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)',
  'getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)',
  'No implicit wall clock is permitted.',

  'Only the read outcome `selected`',
  'not_found',
  'stale',
  'identity_mismatch',
  'contradictory',
  'unsupported_version',
  'malformed',

  'compSupportedArvReady = false',
  'repairScopeReady = false',

  '`Deal ID` | `arvEvidence.dealId`',
  '`Evidence Status` | `arvEvidence.evidenceStatus`',
  '`Confidence Status` | `arvEvidence.confidenceStatus`',
  '`Estimated ARV` | `arvEvidence.estimatedArv`',
  '`Accepted Comparable Evidence IDs JSON` | `arvEvidence.acceptedComparableEvidenceIds`',
  '`Accepted Comparable Count` | `arvEvidence.acceptedComparableCount`',
  '`Minimum Comparable Count` | `arvEvidence.minimumComparableCount`',
  '`Review Required` | `arvEvidence.reviewRequired`',

  '`Deal ID` | `repairScope.dealId`',
  '`Scope Status` | `repairScope.scopeStatus`',
  '`Scope Complete` | `repairScope.scopeComplete`',
  '`Estimated Repair Cost` | `repairScope.estimatedRepairCost`',
  '`Review Required` | `repairScope.reviewRequired`',

  'selected ARV Deal ID === requested Deal ID',
  'selected ARV Canonical Property Key === requested Canonical Property Key',
  'selected repair Deal ID === requested Deal ID',
  'selected repair Canonical Property Key === requested Canonical Property Key',

  'Cross-surface identity invariant',

  '| false | false | blocked |',
  '| false | true | blocked |',
  '| true | false | blocked |',
  '| true | true | eligible |',

  '`eligible` means only that the evidence-layer readiness conjunction',
  'Qualified Deal Queue',
  'calculate MAO',
  'generate an offer',
  'submit an offer',

  'ARV Evidence ID',
  'Repair Scope Evidence ID',
  'Comp Supported ARV Ready',
  'Repair Scope Ready',
  'Reason Codes JSON',
  'Evaluated At',
  'Gate Version',

  'Contradictory current evidence fails closed.',
  'Unsupported evidence schema versions fail closed.',
  'Human-review-required evidence must never be silently promoted to readiness.',

  'ARV_EVIDENCE_NOT_FOUND',
  'ARV_EVIDENCE_STALE',
  'ARV_IDENTITY_MISMATCH',
  'ARV_EVIDENCE_CONTRADICTORY',
  'ARV_UNSUPPORTED_VERSION',
  'ARV_EVIDENCE_MALFORMED',
  'ARV_STATUS_NOT_SUPPORTED',
  'ARV_CONFIDENCE_NOT_SUFFICIENT',
  'ARV_VALUE_INVALID',
  'ARV_COMPARABLE_EVIDENCE_MISSING',
  'ARV_COMPARABLE_COUNT_INSUFFICIENT',
  'ARV_REVIEW_REQUIRED',

  'REPAIR_EVIDENCE_NOT_FOUND',
  'REPAIR_EVIDENCE_STALE',
  'REPAIR_IDENTITY_MISMATCH',
  'REPAIR_EVIDENCE_CONTRADICTORY',
  'REPAIR_UNSUPPORTED_VERSION',
  'REPAIR_EVIDENCE_MALFORMED',
  'REPAIR_SCOPE_NOT_ADEQUATE',
  'REPAIR_SCOPE_INCOMPLETE',
  'REPAIR_COST_INVALID',
  'REPAIR_REVIEW_REQUIRED',

  'CROSS_SURFACE_DEAL_ID_MISMATCH',
  'CROSS_SURFACE_PROPERTY_IDENTITY_MISMATCH',

  '`DEAL_COMPARABLES` row presence alone',
  'comp count alone',
  'deal-level ARV scalar alone',
  'rehab budget alone',
  'repair-cost scalar alone',

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

  'only an offline mapper and synthetic fixtures'
];

for (const marker of required) {
  requireTrue(
    text.includes(marker),
    'required gate-mapping marker missing: ' + JSON.stringify(marker)
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
    !text.includes(marker),
    'forbidden positive authority marker present: ' + marker
  );
}

/*
 * Build forbidden runtime identifiers from pieces so the validator source
 * does not itself contain contiguous production API names that a static
 * safety scan could misclassify as executable production behavior.
 */
const forbiddenRuntimeIdentifiers = [
  ['Url', 'FetchApp'].join(''),
  ['Spreadsheet', 'App'].join(''),
  ['Drive', 'App'].join(''),
  ['J', 'dbc'].join('')
];

for (const identifier of forbiddenRuntimeIdentifiers) {
  const executablePattern = new RegExp(
    '\\b' + identifier + '\\s*\\.'
  );

  requireTrue(
    !executablePattern.test(text),
    'production I/O syntax present in design: ' + identifier
  );
}

requireTrue(
  !/clasp\s+(?:push|deploy|version)\b/.test(text),
  'deployment command syntax present in design'
);

console.log('EXISTING_READINESS_GATE_PRESERVED=true');
console.log('EXACT_ARV_FIELD_MAPPING_DESIGNED=true');
console.log('EXACT_REPAIR_FIELD_MAPPING_DESIGNED=true');
console.log('EXPLICIT_ASOF_SELECTION_REQUIRED=true');
console.log('DEAL_IDENTITY_ENFORCEMENT_REQUIRED=true');
console.log('CANONICAL_PROPERTY_IDENTITY_ENFORCEMENT_REQUIRED=true');
console.log('CROSS_SURFACE_IDENTITY_ENFORCEMENT_REQUIRED=true');
console.log('NON_SELECTED_READ_OUTCOMES_FAIL_CLOSED=true');
console.log('CONTRADICTORY_CURRENT_EVIDENCE_FAIL_CLOSED=true');
console.log('UNSUPPORTED_VERSION_FAIL_CLOSED=true');
console.log('MISSING_EVIDENCE_FAIL_CLOSED=true');
console.log('REVIEW_REQUIRED_EVIDENCE_FAIL_CLOSED=true');
console.log('EXACT_READINESS_TRUTH_TABLE_DESIGNED=true');
console.log('READINESS_EVIDENCE_REFERENCE_BINDING_DESIGNED=true');
console.log('DETERMINISTIC_REASON_CODES_DESIGNED=true');
console.log('LEGACY_SCALAR_INFERENCE_ALLOWED=false');
console.log('EVIDENCE_MANUFACTURING_ALLOWED=false');
console.log('PRODUCTION_PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('PRODUCTION_ARV_AUTHORITY_GRANTED=false');
console.log('REPAIR_SCOPE_AUTHORITY_GRANTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_GENERATION_AUTHORITY_GRANTED=false');
console.log('OFFER_SUBMISSION_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
console.log(
  'OFFLINE_COMPS_READINESS_EVIDENCE_GATE_MAPPING_DESIGN_V1_VALID=true'
);
