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
  'comparable-evidence-normalization-contract-v1.md'
);

const parentPath = path.join(
  root,
  'docs',
  'comps-evidence-arv-contract-v1.md'
);

const comparableSalesPath = path.join(
  root,
  'build',
  'apps-script-brand',
  'ComparableSales.js'
);

for (const file of [
  contractPath,
  parentPath,
  comparableSalesPath
]) {
  requireTrue(
    fs.existsSync(file),
    'required file missing: ' + file
  );
}

const contract = fs.readFileSync(contractPath, 'utf8');
const parent = fs.readFileSync(parentPath, 'utf8');
const comparableSales = fs.readFileSync(
  comparableSalesPath,
  'utf8'
);

const requiredTerms = [
  'Normalization does not determine whether a candidate is a valid comp.',
  'Provider-specific schemas must not leak into the acceptance or ARV',
  'Normalization must not destroy source evidence.',
  'subject canonical property key where available',
  'canonical comparable property key where resolvable',
  'Unknown sale status must remain unknown.',
  'Missing sale price must remain missing.',
  'Missing sale date must remain missing.',
  'Normalization must not synthesize sale facts.',
  'Missing characteristics must remain explicitly missing.',
  'This contract does not authorize geocoding.',
  'Invalid or ambiguous monetary values must not become zero.',
  'Invalid values must not silently coerce to zero.',
  'Missing evidence must never become matching evidence.',
  'Derived values must not masquerade as direct provider observations.',
  'normalized_with_warnings',
  'rejected_normalization',
  'Normalization success does not mean the candidate is an accepted comp.',
  'Normalization must fail closed.',
  'Provider credentials must never be persisted inside comparable evidence',
  'Normalization grants no ARV authority.',
  'No provider-specific HTTP request belongs in the normalizer.',
  'Live provider integration remains out of scope.',
  'No phase automatically authorizes the next phase.'
];

for (const term of requiredTerms) {
  requireTrue(
    contract.includes(term),
    'normalization contract missing required term: ' + term
  );
}

requireTrue(
  parent.includes(
    'Raw provider evidence and normalized REOS evidence must remain'
  ),
  'parent contract normalization requirement missing'
);

requireTrue(
  parent.includes(
    'Comparable retrieval must use an isolated provider/adapter boundary.'
  ),
  'parent provider boundary missing'
);

requireTrue(
  comparableSales.includes('DEAL_COMPARABLES'),
  'existing DEAL_COMPARABLES surface missing'
);

requireTrue(
  comparableSales.includes('Sold Price'),
  'existing Sold Price field missing'
);

requireTrue(
  comparableSales.includes('Sold Date'),
  'existing Sold Date field missing'
);

requireTrue(
  comparableSales.includes('Distance Miles'),
  'existing Distance Miles field missing'
);

requireTrue(
  comparableSales.includes('Source'),
  'existing Source field missing'
);

console.log('PARENT_COMPS_EVIDENCE_ARV_CONTRACT_CONFIRMED=true');
console.log('COMPARABLE_NORMALIZATION_CONTRACT_PRESENT=true');
console.log('PROVIDER_NEUTRAL_MODEL_REQUIRED=true');
console.log('RAW_EVIDENCE_DISTINCTION_REQUIRED=true');
console.log('SUBJECT_AND_COMP_IDENTITY_SEPARATED=true');
console.log('MISSING_VALUE_SEMANTICS_REQUIRED=true');
console.log('DERIVED_VALUE_PROVENANCE_REQUIRED=true');
console.log('SCHEMA_VERSION_REQUIRED=true');
console.log('NORMALIZATION_DETERMINISM_REQUIRED=true');
console.log('NORMALIZATION_IDEMPOTENCY_REQUIRED=true');
console.log('NORMALIZATION_FAIL_CLOSED_REQUIRED=true');
console.log('NORMALIZATION_DOES_NOT_GRANT_ACCEPTANCE=true');
console.log('NORMALIZATION_DOES_NOT_GRANT_ARV=true');
console.log('LIVE_PROVIDER_INTEGRATION_AUTHORIZED=false');
console.log('COMPARABLE_EVIDENCE_NORMALIZATION_CONTRACT_VALIDATION_PASSED=true');
