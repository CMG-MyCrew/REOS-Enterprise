#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESIGN = path.join(
  ROOT,
  'docs',
  'absentee-owner-owner-evidence-comparison-contract-v1.md'
);

assert.ok(
  fs.existsSync(DESIGN),
  'comparison contract design is missing'
);

const source = fs.readFileSync(
  DESIGN,
  'utf8'
);

[
  '# Absentee-Owner Owner-Evidence Comparison Contract v1',

  'REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(ownerEvidence)',

  'Version 1 MUST NOT expose a new production RPC.',

  'READ_ONLY_OWNER_EVIDENCE',

  'absentee_owner_philadelphia_owner_evidence_lookup',

  'Philadelphia Office of Property Assessment',

  'opa_properties_public',

  'https://phl.carto.com/api/v2/sql',

  '`MAILING_ADDRESS_MATCHES`',

  '`MAILING_ADDRESS_DIFFERS`',

  '`INSUFFICIENT_MAILING_EVIDENCE`',

  '`INELIGIBLE_OWNER_EVIDENCE`',

  'Incomplete evidence MUST NOT be treated as a match or difference.',

  'This outcome means only that the normalized address evidence differs.',

  'Any conversion of comparison evidence into an absentee-owner status requires a',

  'The comparison contract does not add a new persistent field.',

  '`reosConnectorHandleAbsenteeOwners`',

  'Automatic MAO or offer authority continues to require both adequate',

  'comp-supported ARV and an adequate repair scope',

  'row: `377`',

  '`DL-20260731203649-4601`',

  '`property|address|pa|philadelphia|19141-4008|5146 n 10th st`',

  'parcel: `776330000`',

  'mailing street: `6623 N 8TH ST`',

  'mailing ZIP: `19126`',

  '`d5d949e3cd9dfb533b78bafd838947adb4aeb1b1c76d1e287c71ac539fdeb521`',

  'expected comparison outcome for this fixture is:',

  '`MAILING_ADDRESS_DIFFERS`',

  '`productionDataMutationAuthorityGranted`',

  '`ownerEvidencePersistenceAuthorityGranted`',

  '`absenteeClassificationAuthorityGranted`',

  '`automaticOfferAuthorityGranted`',

  'The surface remains deterministic, source-bound, observational, and read-only.'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'required comparison-contract marker missing: ' + marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
  'REOS.AbsenteeOwnerEnrichmentSanitizer',
  'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter',
  'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'REOS.AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'required isolation marker missing: ' + marker
  );
});

assert.ok(
  source.includes(
    'A different mailing address is evidence relevant to a possible later absentee'
  ),
  'mailing-difference evidence boundary missing'
);

assert.ok(
  source.includes(
    'but it is not itself that classification.'
  ),
  'classification separation marker missing'
);

assert.ok(
  source.includes(
    'Owner names MUST NOT participate in address comparison.'
  ),
  'owner-name non-comparison rule missing'
);

assert.ok(
  source.includes(
    'ZIP+4 MAY be reduced to its first five digits.'
  ),
  'ZIP5 comparison rule missing'
);

assert.ok(
  source.includes(
    'street differs;'
  ) &&
  source.includes(
    'ZIP differs.'
  ),
  'row-377 expected difference components missing'
);

assert.strictEqual(
  source.includes('absenteeOwner=true'),
  false,
  'design must not declare absenteeOwner=true'
);

assert.strictEqual(
  source.includes('ownerOccupied=false'),
  false,
  'design must not declare ownerOccupied=false'
);

assert.strictEqual(
  source.includes('automaticOfferAuthorityGranted: true'),
  false,
  'design must not grant automatic offer authority'
);

assert.strictEqual(
  source.includes('productionDataMutationAuthorityGranted: true'),
  false,
  'design must not grant mutation authority'
);

assert.strictEqual(
  source.includes('ownerEvidencePersistenceAuthorityGranted: true'),
  false,
  'design must not grant owner-evidence persistence authority'
);

const outcomes = [
  'MAILING_ADDRESS_MATCHES',
  'MAILING_ADDRESS_DIFFERS',
  'INSUFFICIENT_MAILING_EVIDENCE',
  'INELIGIBLE_OWNER_EVIDENCE'
];

outcomes.forEach(outcome => {
  assert.ok(
    source.includes(outcome),
    'comparison outcome missing: ' + outcome
  );
});

const behavioralStart = source.indexOf(
  '## 25. Behavioral validation requirements'
);

const behavioralEnd = source.indexOf(
  '## 26. Promotion sequence'
);

assert.ok(
  behavioralStart >= 0 &&
  behavioralEnd > behavioralStart,
  'behavioral validation section missing'
);

const behavioralBlock = source.slice(
  behavioralStart,
  behavioralEnd
);

const behaviorCases = (
  behavioralBlock.match(
    /^\d+\.\s/gm
  ) || []
).length;

assert.strictEqual(
  behaviorCases,
  28,
  'comparison behavioral contract must define exactly 28 cases'
);

console.log(
  'ABSENTEE_OWNER_EVIDENCE_COMPARISON_CONTRACT_DESIGN_VALID=true'
);
console.log(
  'COMPARISON_OUTCOME_COUNT=4'
);
console.log(
  'COMPARISON_BEHAVIOR_CASE_COUNT=28'
);
console.log(
  'PURE_DETERMINISTIC_COMPARISON_REQUIRED=true'
);
console.log(
  'PRODUCTION_RPC_AUTHORIZED=false'
);
console.log(
  'EXTERNAL_HTTP_AUTHORIZED=false'
);
console.log(
  'REOS_DATA_READ_AUTHORIZED=false'
);
console.log(
  'PRODUCTION_MUTATION_AUTHORITY=false'
);
console.log(
  'OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false'
);
console.log(
  'ABSENTEE_CLASSIFICATION_AUTHORITY=false'
);
console.log(
  'OWNER_OCCUPANCY_CLASSIFICATION_AUTHORITY=false'
);
console.log(
  'FUZZY_ADDRESS_MATCHING_AUTHORITY=false'
);
console.log(
  'ROW_377_EXPECTED_COMPARISON=MAILING_ADDRESS_DIFFERS'
);
console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
