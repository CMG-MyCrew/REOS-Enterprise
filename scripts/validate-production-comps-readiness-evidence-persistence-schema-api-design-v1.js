'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const designPath = path.join(
  root,
  'docs',
  'production-comps-readiness-evidence-persistence-schema-api-design-v1.md'
);

const databasePath = path.join(
  root,
  'build',
  'apps-script-brand',
  'Database.js'
);

const acquisitionPath = path.join(
  root,
  'build',
  'apps-script-brand',
  'AcquisitionWorkflow.js'
);

const lifecyclePath = path.join(
  root,
  'build',
  'apps-script-brand',
  'DealLifecycleWorkflow.js'
);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function requireText(text, needle, label) {
  assert.ok(
    text.toLowerCase().includes(needle.toLowerCase()),
    'missing design requirement: ' + label
  );
  console.log('PASS: ' + label);
}

function forbidText(text, needle, label) {
  assert.ok(
    !text.toLowerCase().includes(needle.toLowerCase()),
    'forbidden design text present: ' + label
  );
  console.log('PASS: ' + label);
}

const design = read(designPath);
const database = read(databasePath);
const acquisition = read(acquisitionPath);
const lifecycle = read(lifecyclePath);

const required = [
  ['This phase is design-only.', 'design-only authority'],

  ['DEAL_ARV_EVIDENCE', 'ARV evidence surface'],
  ['DEAL_REPAIR_SCOPE_EVIDENCE', 'repair evidence surface'],
  ['DEAL_OFFER_READINESS_EVIDENCE', 'readiness evidence surface'],

  ['ARV Evidence ID', 'ARV evidence ID'],
  ['Accepted Comparable Evidence IDs JSON', 'accepted comp IDs'],
  ['Accepted Comparable Count', 'accepted comp count'],
  ['Minimum Comparable Count', 'minimum comp count'],
  ['Valuation Inputs JSON', 'valuation inputs'],
  ['Evidence Generated At', 'generation timestamp'],
  ['Persisted At', 'persistence timestamp'],
  ['Idempotency Key', 'idempotency key'],
  ['Supersedes Evidence ID', 'supersession field'],

  ['Repair Scope Evidence ID', 'repair evidence ID'],
  ['Scope Status', 'repair status'],
  ['Scope Complete', 'scope completeness'],
  ['Estimated Repair Cost', 'repair estimate'],
  ['Scope Inputs JSON', 'repair inputs'],

  ['Readiness Evidence ID', 'readiness evidence ID'],
  ['Comp Supported ARV Ready', 'ARV readiness dimension'],
  ['Repair Scope Ready', 'repair readiness dimension'],
  ['Gate Version', 'gate version'],

  ['ARVE-', 'ARV ID prefix'],
  ['RSE-', 'repair ID prefix'],
  ['ORE-', 'readiness ID prefix'],

  ['Evidence history is append-only.', 'append-only history'],
  ['"Latest" is a read-selection concept', 'latest read selection'],
  ['idempotency collision', 'idempotency collision'],

  ['appendDealArvEvidence(record)', 'ARV append API'],
  ['appendDealRepairScopeEvidence(record)', 'repair append API'],
  ['appendDealOfferReadinessEvidence(record)', 'readiness append API'],

  ['getDealArvEvidenceById(evidenceId)', 'ARV by-ID API'],
  ['getDealRepairScopeEvidenceById(evidenceId)', 'repair by-ID API'],
  ['getDealOfferReadinessEvidenceById(evidenceId)', 'readiness by-ID API'],

  [
    'getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)',
    'current ARV API'
  ],
  [
    'getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)',
    'current repair API'
  ],
  [
    'getCurrentDealOfferReadinessEvidence(dealId, canonicalPropertyKey, asOf)',
    'current readiness API'
  ],

  ['The supplied `asOf` must be explicit.', 'explicit asOf'],
  ['Identity mismatch fails closed.', 'identity mismatch fail closed'],
  [
    'Missing identity must never be converted into matching identity.',
    'no identity manufacturing'
  ],

  ['arvEvidence.dealId', 'ARV deal mapping'],
  ['arvEvidence.evidenceStatus', 'ARV status mapping'],
  ['arvEvidence.confidenceStatus', 'ARV confidence mapping'],
  ['arvEvidence.estimatedArv', 'ARV value mapping'],
  [
    'arvEvidence.acceptedComparableEvidenceIds',
    'accepted comparable mapping'
  ],
  ['arvEvidence.acceptedComparableCount', 'accepted count mapping'],
  ['arvEvidence.minimumComparableCount', 'minimum count mapping'],
  ['arvEvidence.reviewRequired', 'ARV review mapping'],

  ['repairScope.dealId', 'repair deal mapping'],
  ['repairScope.scopeStatus', 'repair status mapping'],
  ['repairScope.scopeComplete', 'repair completeness mapping'],
  ['repairScope.estimatedRepairCost', 'repair estimate mapping'],
  ['repairScope.reviewRequired', 'repair review mapping'],

  [
    'No missing field may be synthesized merely to make the gate pass.',
    'no gate evidence manufacturing'
  ],

  [
    'Failure to persist readiness evidence must not mutate its underlying ARV',
    'partial-write isolation'
  ],

  ['contradict each other', 'contradictory evidence handling'],
  ['Unknown schema versions fail closed.', 'unknown version fail closed'],

  ['Existing `DEAL_COMPARABLES`', 'legacy compatibility'],
  [
    'This design does not modify `Database.js`.',
    'Database.js modification prohibited'
  ],

  ['`appended`', 'append outcome'],
  ['`idempotent_existing`', 'idempotent outcome'],
  [
    '`rejected_idempotency_conflict`',
    'idempotency conflict outcome'
  ],
  ['`contradictory`', 'contradictory read outcome'],
  ['`unsupported_version`', 'unsupported version outcome'],

  ['no evidence manufacturing', 'no evidence manufacturing'],
  ['no workflow progression authority', 'no workflow authority'],

  [
    'Adequate comp-supported ARV evidence plus adequate repair scope',
    'combined safety invariant'
  ],
  [
    'No automatic MAO or offer authority is granted by this design.',
    'automatic offer authority remains blocked'
  ]
];

for (const [needle, label] of required) {
  requireText(design, needle, label);
}

const forbidden = [
  ['PRODUCTION_ARV_AUTHORITY_GRANTED=true', 'ARV authority grant'],
  ['REPAIR_SCOPE_AUTHORITY_GRANTED=true', 'repair authority grant'],
  ['MAO_AUTHORITY_GRANTED=true', 'MAO authority grant'],
  ['OFFER_GENERATION_AUTHORITY_GRANTED=true', 'offer authority grant'],
  [
    'AUTOMATIC_OFFER_AUTHORITY_GRANTED=true',
    'automatic offer authority grant'
  ]
];

for (const [needle, label] of forbidden) {
  forbidText(design, needle, label);
}

requireText(
  acquisition,
  'Comparable-row presence is not readiness authority.',
  'production acquisition fail-closed guard'
);

requireText(
  lifecycle,
  'Legacy analysis / comparable-count / MAO evidence must not',
  'production lifecycle fail-closed guard'
);

assert.ok(
  !acquisition.includes('if (comps.length) {'),
  'legacy comps.length authority must remain absent'
);

console.log('PASS: legacy comps.length authority absent');

assert.ok(
  database.length > 0,
  'Database.js compatibility surface must remain present'
);

console.log('PASS: Database.js compatibility surface present');

console.log('PRODUCTION_SCHEMA_CREATED=false');
console.log('PRODUCTION_TABLE_CREATED=false');
console.log('PRODUCTION_EVIDENCE_BRIDGE_CREATED=false');
console.log('PRODUCTION_PERSISTENCE_IMPLEMENTED=false');
console.log('OFFER_GENERATION_EXECUTED=false');
console.log('MAO_CALCULATION_EXECUTED=false');

console.log(
  'PRODUCTION_COMPS_READINESS_EVIDENCE_PERSISTENCE_SCHEMA_API_DESIGN_V1_VALIDATION_PASSED=true'
);
