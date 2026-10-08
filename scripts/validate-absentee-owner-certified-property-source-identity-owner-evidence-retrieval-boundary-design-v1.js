#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const DESIGN =
  path.join(
    ROOT,
    'docs',
    'absentee-owner-certified-property-source-identity-owner-evidence-retrieval-boundary-v1.md'
  );

assert.ok(
  fs.existsSync(DESIGN),
  'owner-evidence retrieval design is missing'
);

const text =
  fs.readFileSync(
    DESIGN,
    'utf8'
  );

[
  'PROPERTY_SOURCE_IDENTITY_CERTIFIED=true',
  'ONE_CAPABILITY_ONE_EVENTUAL_PR=true',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'exact_property_address',
  'NO_MATCH',
  'REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup',
  'AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js',
  'READ_ONLY_OWNER_EVIDENCE',
  'absentee_owner_certified_property_source_identity_owner_evidence_lookup',
  'certified_opa_account',
  'propertySourceIdentityCertification',
  'normalLookupEvidence',
  'sourceOpaAccountNum',
  '^[0-9]{9}$',
  'opa_properties_public',
  'https://phl.carto.com/api/v2/sql',
  'parcel_number',
  'owner_1',
  'owner_2',
  'mailing_address_1',
  'mailing_address_2',
  'mailing_care_of',
  'mailing_city_state',
  'mailing_street',
  'mailing_zip',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  'MAILING_ADDRESS_MATCHES',
  'MAILING_ADDRESS_DIFFERS',
  'INSUFFICIENT_MAILING_EVIDENCE',
  'REOS.Security.requireAdmin()',
  'UrlFetchApp.fetch',
  'DL-20260825185532-4474',
  'property|parcel|pa|philadelphia|1473083',
  '183124510',
  '1624 N BODINE ST',
  '1616-42 N BODINE ST',
  'ROW_1532_PROCESSING_AUTHORIZED=false',
  'DESIGN_ONLY_PR_AUTHORIZED=false',
  'OWNER_EVIDENCE_CAPABILITY_SINGLE_PR=true',
  'OWNER_EVIDENCE_RETRIEVAL_IMPLEMENTATION_AUTHORIZED=false',
  'CLASSIFICATION_IMPLEMENTATION_AUTHORIZED=false',
  'PERSISTENCE_AUTHORIZED=false',
  'DEPLOYMENT_AUTHORIZED=false',
  'MAO_AUTHORITY_GRANTED=false',
  'OFFER_AUTHORITY_GRANTED=false'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required owner-evidence design marker missing: ' +
      marker
  );
});

[
  'No caller-supplied OPA account override is permitted.',
  'No caller-supplied parcel override is permitted.',
  'No caller-supplied property address override is permitted.',
  'No new global Apps Script RPC is authorized.',
  'A second mailing-address comparison implementation is not authorized.',
  'The historical exact-address comparison path MUST remain unchanged.',
  'The new lookup MUST NOT call:',
  'No first-row-wins behavior is authorized.',
  'No pagination is authorized.'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required fail-closed design statement missing: ' +
      marker
  );
});

assert.ok(
  text.includes(
    '`2`\n\nrows so zero, unique, and ambiguous resolution can be distinguished.'
  ),
  'two-row account query bound missing'
);

assert.ok(
  text.includes(
    'The returned:\n\n`parcel_number`\n\nMUST equal the certified:\n\n`sourceOpaAccountNum`'
  ),
  'returned account binding missing'
);

assert.ok(
  text.includes(
    'Automatic MAO or offer authority continues to require independently supported\nARV and adequate repair scope.'
  ),
  'acquisition safety gate missing'
);

assert.strictEqual(
  /DESIGN_ONLY_PR_AUTHORIZED=true/.test(text),
  false,
  'design-only PR must remain unauthorized'
);

assert.strictEqual(
  /OWNER_EVIDENCE_RETRIEVAL_IMPLEMENTATION_AUTHORIZED=true/.test(text),
  false,
  'runtime implementation must not be authorized by design source edit'
);

assert.strictEqual(
  /CLASSIFICATION_IMPLEMENTATION_AUTHORIZED=true/.test(text),
  false,
  'classification implementation must remain unauthorized'
);

console.log(
  'ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_RETRIEVAL_BOUNDARY_DESIGN_VALID=true'
);

console.log(
  'ONE_CAPABILITY_ONE_EVENTUAL_PR=true'
);

console.log(
  'EXISTING_EXACT_ADDRESS_OWNER_LOOKUP_PRESERVED=true'
);

console.log(
  'CERTIFIED_ACCOUNT_LOOKUP_MODE=certified_opa_account'
);

console.log(
  'NEW_GLOBAL_RPC_AUTHORIZED=false'
);

console.log(
  'OWNER_EVIDENCE_COMPARISON_REUSE_REQUIRED=true'
);

console.log(
  'CLASSIFICATION_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'OFFER_AUTHORITY=false'
);

console.log(
  'DESIGN_ONLY_PR_AUTHORIZED=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_IMPLEMENTATION_AUTHORIZED=false'
);
