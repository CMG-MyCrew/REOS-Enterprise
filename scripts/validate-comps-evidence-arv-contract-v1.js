'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function fail(message) {
  console.error('FAIL=' + message);
  process.exit(1);
}

function requireTrue(condition, message) {
  if (!condition) fail(message);
}

const contractPath = path.join(
  root,
  'docs',
  'comps-evidence-arv-contract-v1.md'
);

const existingFiles = [
  'build/apps-script-brand/ComparableSales.js',
  'build/apps-script-brand/DealAnalyzer.js',
  'build/apps-script-brand/DealLifecycleWorkflow.js',
  'build/apps-script-brand/AcquisitionWorkflow.js'
];

requireTrue(
  fs.existsSync(contractPath),
  'contract missing'
);

for (const file of existingFiles) {
  requireTrue(
    fs.existsSync(path.join(root, file)),
    'existing REOS surface missing: ' + file
  );
}

const contract = fs.readFileSync(contractPath, 'utf8');

const comparableSales = fs.readFileSync(
  path.join(root, 'build/apps-script-brand/ComparableSales.js'),
  'utf8'
);

const acquisitionWorkflow = fs.readFileSync(
  path.join(root, 'build/apps-script-brand/AcquisitionWorkflow.js'),
  'utf8'
);

const lifecycle = fs.readFileSync(
  path.join(root, 'build/apps-script-brand/DealLifecycleWorkflow.js'),
  'utf8'
);

const requiredTerms = [
  'A parallel competing comps engine is prohibited.',
  'Raw provider evidence and normalized REOS evidence must remain',
  'Missing evidence must not silently become matching evidence.',
  'A sparse comparable set routes to research/review.',
  'An ARV number without adequate supporting comparable evidence',
  'Confidence must not be based solely on comparable count.',
  'Automatic MAO or offer authority requires BOTH:',
  'adequate comp-supported ARV evidence',
  'adequate repair scope',
  'The presence of rows in DEAL_COMPARABLES is not sufficient authority',
  'comparable retrieval authority',
  'ARV calculation authority',
  'repair-scope authority',
  'offer-generation authority',
  'offer-submission authority',
  'Comparable retrieval must use an isolated provider/adapter boundary.',
  'The system must fail closed.',
  'This contract does not authorize automatic MAO execution.',
  'No phase automatically authorizes the next phase.'
];

for (const term of requiredTerms) {
  requireTrue(
    contract.includes(term),
    'contract missing required term: ' + term
  );
}

requireTrue(
  comparableSales.includes('DEAL_COMPARABLES'),
  'ComparableSales missing DEAL_COMPARABLES'
);

requireTrue(
  comparableSales.includes('Estimated ARV'),
  'ComparableSales missing Estimated ARV'
);

requireTrue(
  comparableSales.includes('Confidence Score'),
  'ComparableSales missing Confidence Score'
);

requireTrue(
  acquisitionWorkflow.includes('Offer Generation'),
  'AcquisitionWorkflow missing Offer Generation'
);

requireTrue(
  lifecycle.includes('Comparable Analysis'),
  'DealLifecycleWorkflow missing Comparable Analysis'
);

requireTrue(
  lifecycle.includes('Offer Generation'),
  'DealLifecycleWorkflow missing Offer Generation'
);

console.log('COMPS_EVIDENCE_ARV_CONTRACT_PRESENT=true');
console.log('EXISTING_COMPARABLE_SALES_ENGINE_CONFIRMED=true');
console.log('EXISTING_DEAL_COMPARABLES_CONFIRMED=true');
console.log('EXISTING_ESTIMATED_ARV_CONFIRMED=true');
console.log('EXISTING_CONFIDENCE_SCORE_CONFIRMED=true');
console.log('ACQUISITION_WORKFLOW_OFFER_SURFACE_CONFIRMED=true');
console.log('DEAL_LIFECYCLE_COMPARABLE_STAGE_CONFIRMED=true');
console.log('DEAL_LIFECYCLE_OFFER_STAGE_CONFIRMED=true');
console.log('PROVIDER_BOUNDARY_REQUIRED=true');
console.log('COMPARABLE_PROVENANCE_REQUIRED=true');
console.log('ARV_EVIDENCE_REQUIRED=true');
console.log('LOW_CONFIDENCE_ROUTES_TO_REVIEW=true');
console.log('REPAIR_SCOPE_REQUIRED_FOR_AUTOMATIC_OFFER_AUTHORITY=true');
console.log('COMPS_PRESENCE_ALONE_DOES_NOT_GRANT_OFFER_AUTHORITY=true');
console.log('FAIL_CLOSED_REQUIRED=true');
console.log('COMPS_EVIDENCE_ARV_CONTRACT_VALIDATION_PASSED=true');
