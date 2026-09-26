'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const DESIGN = path.join(
  ROOT,
  'docs/absentee-owner-classification-contract-v1.md'
);

const COMPARISON_CONTRACT = path.join(
  ROOT,
  'docs/absentee-owner-owner-evidence-comparison-contract-v1.md'
);

const COMPARISON_RUNTIME = path.join(
  ROOT,
  'build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js'
);

const PERSISTENCE = path.join(
  ROOT,
  'build/apps-script-brand/AbsenteeOwnerEnrichmentPersistenceAdapter.js'
);

const LEGACY_ACQUISITION = path.join(
  ROOT,
  'build/apps-script-brand/AcquisitionDistressIntelligence.js'
);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function requireText(source, text) {
  if (!source.includes(text)) {
    throw new Error(
      'REQUIRED_TEXT_MISSING: ' + text
    );
  }
}

function forbidText(source, text) {
  if (source.includes(text)) {
    throw new Error(
      'FORBIDDEN_TEXT_PRESENT: ' + text
    );
  }
}

const design = read(DESIGN);
const comparisonContract = read(COMPARISON_CONTRACT);
const comparisonRuntime = read(COMPARISON_RUNTIME);
const persistence = read(PERSISTENCE);
const legacy = read(LEGACY_ACQUISITION);

[
  '# Absentee-Owner Classification Contract v1',

  'REOS.AbsenteeOwnerClassification.classify(comparisonEvidence)',

  'Version 1 MUST NOT expose a production RPC.',

  'READ_ONLY_OWNER_EVIDENCE_COMPARISON',

  'absentee_owner_owner_evidence_comparison',

  'ABSENTEE_OWNER_INDICATED',
  'OWNER_MAILING_MATCHED',
  'INSUFFICIENT_CLASSIFICATION_EVIDENCE',
  'INELIGIBLE_COMPARISON_EVIDENCE',

  'The word `INDICATED` is mandatory',

  'Matching mailing evidence does not establish physical occupancy.',

  'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',

  'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION',

  'absentee_owner_classification',

  'This classification contract adds no persistent field.',

  'The new classification result MUST NOT automatically flow into that legacy',
  'scoring path.',

  'Automatic MAO or offer authority continues to require both comp-supported ARV',
  'and an adequate repair scope.',

  'Version 1 preserves exactly these 25 design boundaries:',

  'comparison-evidence SHA-256',
  '7f495bb5973ff9a09b4ec67e5362a4da943a873d4ccdf74bdfbf916612d5f456',

  'owner-evidence response SHA-256',
  'd5d949e3cd9dfb533b78bafd838947adb4aeb1b1c76d1e287c71ac539fdeb521',

  'row-377 certified fixture returns `ABSENTEE_OWNER_INDICATED`',

  'No classification is executed or persisted by this design document.'
].forEach(text => requireText(design, text));

const outcomeSection = [
  '- `ABSENTEE_OWNER_INDICATED`',
  '- `OWNER_MAILING_MATCHED`',
  '- `INSUFFICIENT_CLASSIFICATION_EVIDENCE`',
  '- `INELIGIBLE_COMPARISON_EVIDENCE`'
];

outcomeSection.forEach(text => requireText(design, text));

const mappings = [
  '| `MAILING_ADDRESS_DIFFERS` | `ABSENTEE_OWNER_INDICATED` |',
  '| `MAILING_ADDRESS_MATCHES` | `OWNER_MAILING_MATCHED` |',
  '| `INSUFFICIENT_MAILING_EVIDENCE` | `INSUFFICIENT_CLASSIFICATION_EVIDENCE` |',
  '| `INELIGIBLE_OWNER_EVIDENCE` | `INELIGIBLE_COMPARISON_EVIDENCE` |'
];

mappings.forEach(text => requireText(design, text));

const authorityFields = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'ownerOccupancyAuthorityGranted',
  'vacancyAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

authorityFields.forEach(text => requireText(design, text));

const numberedBoundaries = [
  '1. single comparison-evidence input only;',
  '2. no batch classification;',
  '3. no scheduler;',
  '4. no trigger;',
  '5. no external HTTP;',
  '6. no OPA lookup;',
  '7. no secondary source;',
  '8. no raw owner-name matching;',
  '9. no fuzzy address matching;',
  '10. no geocoding;',
  '11. no production REOS read;',
  '12. no production mutation;',
  '13. no owner-evidence persistence;',
  '14. no classification persistence;',
  '15. no canonical identity repair;',
  '16. no migration;',
  '17. no generic absentee connector authority;',
  '18. no legacy acquisition scoring authority;',
  '19. no Qualified Deal Queue authority;',
  '20. no acquisition lifecycle authority;',
  '21. no ARV authority;',
  '22. no repair-scope authority;',
  '23. no MAO authority;',
  '24. no offer-generation authority;',
  '25. no offer-submission authority.'
];

numberedBoundaries.forEach(
  text => requireText(design, text)
);

[
  'absenteeOwner: true',
  'ownerOccupied: true',
  'vacant: true',
  'automaticOfferAuthorityGranted: true',
  'classificationPersistenceAuthorityGranted: true'
].forEach(text => forbidText(design, text));

requireText(
  comparisonContract,
  'Any conversion of comparison evidence into an absentee-owner status requires a'
);

requireText(
  comparisonContract,
  'separate design, implementation, validation, and explicit production'
);

requireText(
  comparisonContract,
  '`Absentee Owner` or `Owner Occupied` is also outside this contract.'
);

[
  'MAILING_ADDRESS_MATCHES',
  'MAILING_ADDRESS_DIFFERS',
  'INSUFFICIENT_MAILING_EVIDENCE',
  'INELIGIBLE_OWNER_EVIDENCE',
  'READ_ONLY_OWNER_EVIDENCE_COMPARISON',
  'absentee_owner_owner_evidence_comparison'
].forEach(
  text => requireText(comparisonRuntime, text)
);

if (
  /function\s+reos[A-Za-z0-9_]*OwnerEvidenceComparison\s*\(/.test(
    comparisonRuntime
  )
) {
  throw new Error(
    'UPSTREAM_PRODUCTION_COMPARISON_RPC_PRESENT'
  );
}

requireText(
  persistence,
  "'Owner Name'"
);

requireText(
  persistence,
  "'Owner Mailing Address'"
);

[
  "'Absentee Owner'",
  "'Owner Occupied'"
].forEach(text => {
  if (persistence.includes(text)) {
    throw new Error(
      'CLASSIFICATION_FIELD_ALREADY_PERSISTED: ' +
      text
    );
  }
});

[
  'ABSENTEE_OWNER: 25',
  "labels.push('ABSENTEE_OWNER')",
  "['Absentee Owner','Absentee','Owner Occupied']"
].forEach(
  text => requireText(legacy, text)
);

const futureRuntime =
  path.join(
    ROOT,
    'build/apps-script-brand/AbsenteeOwnerClassification.js'
  );

if (fs.existsSync(futureRuntime)) {
  throw new Error(
    'CLASSIFICATION_RUNTIME_IMPLEMENTATION_ALREADY_EXISTS'
  );
}

const designOutcomeCount = 4;
const designBoundaryCount = 25;
const futureBehaviorCaseCount = 20;

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_CONTRACT_DESIGN_VALID=true'
);

console.log(
  'CLASSIFICATION_OUTCOME_COUNT=' +
  designOutcomeCount
);

console.log(
  'REQUIRED_CLASSIFICATION_DESIGN_BOUNDARY_COUNT=' +
  designBoundaryCount
);

console.log(
  'FUTURE_CLASSIFICATION_BEHAVIOR_CASE_COUNT=' +
  futureBehaviorCaseCount
);

console.log(
  'UPSTREAM_MODE=READ_ONLY_OWNER_EVIDENCE_COMPARISON'
);

console.log(
  'UPSTREAM_PHASE=absentee_owner_owner_evidence_comparison'
);

console.log(
  'MAILING_ADDRESS_DIFFERS_CLASSIFICATION=ABSENTEE_OWNER_INDICATED'
);

console.log(
  'MAILING_ADDRESS_MATCHES_CLASSIFICATION=OWNER_MAILING_MATCHED'
);

console.log(
  'ROW_377_EXPECTED_CLASSIFICATION=ABSENTEE_OWNER_INDICATED'
);

console.log(
  'OWNER_OCCUPANCY_DETERMINATION_AUTHORIZED=false'
);

console.log(
  'VACANCY_DETERMINATION_AUTHORIZED=false'
);

console.log(
  'CLASSIFICATION_PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_RPC_AUTHORIZED=false'
);

console.log(
  'RUNTIME_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
