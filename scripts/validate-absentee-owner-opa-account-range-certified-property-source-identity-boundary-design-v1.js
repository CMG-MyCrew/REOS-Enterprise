#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(
  __dirname,
  '..'
);

const DESIGN = path.join(
  ROOT,
  'docs',
  'absentee-owner-opa-account-range-certified-property-source-identity-boundary-design-v1.md'
);

assert.ok(
  fs.existsSync(DESIGN),
  'certified property-source identity boundary design is missing'
);

const text = fs.readFileSync(
  DESIGN,
  'utf8'
);

const required = [
  '# Absentee-Owner OPA Account Range Certified Property-Source Identity Boundary Design v1',

  '`PROPERTY_SOURCE_IDENTITY_CERTIFIED=true`',
  '`propertySourceIdentityCertified: true`',

  '`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`',
  '`REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification`',
  '`certify(options)`',

  '`exactRecordEvidence`',
  '`normalLookupEvidence`',
  '`sourceObservations`',
  '`opaAccountRows`',

  '`REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(...)`',
  '`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup(...)`',
  '`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator.evaluate(...)`',

  '`NO_MATCH`',
  '`exact_property_address`',

  '`2`',
  '`5`',

  '`parcel_id_num`',
  '`opa_account_num`',
  '`parcel_number`',
  '`Parcel ID`',

  '`^[0-9]{9}$`',

  '`1473083`',
  '`183124510`',
  '`1616-42 N BODINE ST`',

  '`SOURCE_PARCEL_EQUALS_PERSISTED_PARCEL=true`',

  '`RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE`',
  '`RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE=true`',
  '`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`',

  '`EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT`',

  '`OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`',
  '`CLASSIFICATION_AUTHORITY_GRANTED=false`',
  '`PERSISTENCE_AUTHORITY_GRANTED=false`',
  '`ROLLOUT_AUTHORITY_GRANTED=false`',
  '`CANONICAL_IDENTITY_REPAIR_AUTHORITY_GRANTED=false`',

  '`ARV_AUTHORITY_GRANTED=false`',
  '`REPAIR_SCOPE_AUTHORITY_GRANTED=false`',
  '`MAO_AUTHORITY_GRANTED=false`',
  '`OFFER_AUTHORITY_GRANTED=false`',

  'No owner-name or owner-mailing evidence is authorized by this design increment.',

  'The caller MUST NOT supply or override the OPA account.',

  'The common source `parcel_id_num` MUST equal the verified persisted:',

  'The existing evaluator remains the single implementation authority for:',

  'The new certification fact belongs to a separate layer.',

  'Physical row `1532` remains outside this boundary.',

  'Successful design validation does not authorize implementation.',

  'Successful implementation would not authorize production execution.',

  'Automatic MAO or offer authority still requires both adequate comp-supported',
  'ARV and an adequate repair scope through independently certified acquisition',
  'paths.',

  'No step implies authority for the next step.'
];

for (const marker of required) {
  assert.ok(
    text.includes(marker),
    'missing required design marker: ' + marker
  );
}

const prohibited = [
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=true',

  'OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=true',
  'CLASSIFICATION_AUTHORITY_GRANTED=true',
  'PERSISTENCE_AUTHORITY_GRANTED=true',
  'ROLLOUT_AUTHORITY_GRANTED=true',
  'CANONICAL_IDENTITY_REPAIR_AUTHORITY_GRANTED=true',

  'ARV_AUTHORITY_GRANTED=true',
  'REPAIR_SCOPE_AUTHORITY_GRANTED=true',
  'MAO_AUTHORITY_GRANTED=true',
  'OFFER_AUTHORITY_GRANTED=true',

  'OPA account replaces the persisted Parcel ID',
  'OPA account replaces the canonical property key',

  'fuzzy matching is authorized',
  'geocoding is authorized',
  'owner-name fallback is authorized',
  'automatic rollout is authorized',

  'range candidate authorizes classification',
  'property-source certification authorizes classification',
  'property-source certification authorizes persistence'
];

for (const marker of prohibited) {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited design marker present: ' + marker
  );
}

const designOnly = [
  'This increment creates only:',
  '- this design document;',
  '- its offline design validator.',

  'It MUST NOT create:',
  '- production Apps Script;',
  '- an RPC;',
  '- an OPA lookup implementation;',
  '- an owner-evidence retrieval implementation;',
  '- a classifier change;',
  '- a comparison-layer change;',
  '- a persistence change;',
  '- a deployment change.'
];

for (const marker of designOnly) {
  assert.ok(
    text.includes(marker),
    'design-only boundary missing: ' + marker
  );
}

assert.ok(
  text.includes(
    'The future certifier MUST derive the OPA account only from the corroborating'
  )
);

assert.ok(
  text.includes(
    'The common source `parcel_id_num` MUST equal the verified persisted:'
  )
);

assert.ok(
  text.includes(
    'The future certifier MUST NOT implement a second independent range parser.'
  )
);

assert.ok(
  text.includes(
    'The existing `REOS.AbsenteeOwnerOwnerEvidenceComparison`'
  ) ||
  (
    text.includes(
      'The existing:'
    ) &&
    text.includes(
      '`REOS.AbsenteeOwnerOwnerEvidenceComparison`'
    )
  )
);

assert.ok(
  text.includes(
    'requires normal OPA evidence with outcome:'
  )
);

assert.ok(
  text.includes(
    'Every failure MUST preserve:'
  )
);

assert.ok(
  text.includes(
    '`PROPERTY_SOURCE_IDENTITY_CERTIFIED=false`'
  )
);

assert.ok(
  text.includes(
    'One explicitly selected target remains the maximum future execution scope.'
  )
);

assert.ok(
  text.includes(
    'The OPA account remains source provenance, not canonical REOS identity.'
  )
);

console.log(
  'ABSENTEE_OWNER_OPA_ACCOUNT_RANGE_CERTIFIED_PROPERTY_SOURCE_IDENTITY_BOUNDARY_DESIGN_VALID=true'
);

console.log(
  'DESIGN_ONLY_INCREMENT=true'
);

console.log(
  'EXISTING_RANGE_EVALUATOR_UNCHANGED=true'
);

console.log(
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=false'
);

console.log(
  'NEW_CERTIFICATION_FACT=PROPERTY_SOURCE_IDENTITY_CERTIFIED'
);

console.log(
  'MIN_CORROBORATING_SOURCE_OBSERVATIONS=2'
);

console.log(
  'MAX_CORROBORATING_SOURCE_OBSERVATIONS=5'
);

console.log(
  'SOURCE_PARCEL_MUST_EQUAL_PERSISTED_PARCEL=true'
);

console.log(
  'OPA_ACCOUNT_SOURCE_FIELD=opa_account_num'
);

console.log(
  'OPA_ACCOUNT_EXACT_NINE_DIGITS_REQUIRED=true'
);

console.log(
  'OPA_ACCOUNT_UNIQUE_OFFICIAL_ROW_REQUIRED=true'
);

console.log(
  'EXISTING_RANGE_EVALUATOR_REUSE_REQUIRED=true'
);

console.log(
  'FUZZY_ADDRESS_MATCHING_AUTHORITY=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY_GRANTED=false'
);

console.log(
  'PERSISTENCE_AUTHORITY_GRANTED=false'
);

console.log(
  'ROLLOUT_AUTHORITY_GRANTED=false'
);

console.log(
  'CANONICAL_IDENTITY_REPAIR_AUTHORITY_GRANTED=false'
);

console.log(
  'ARV_AUTHORITY_GRANTED=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false'
);

console.log(
  'MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'OFFER_AUTHORITY_GRANTED=false'
);

console.log(
  'ROW_1532_PROCESSING_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_RUNTIME_CREATED=false'
);

console.log(
  'IMPLEMENTATION_AUTHORIZED=false'
);
