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

const FILE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js'
  );

assert.ok(
  fs.existsSync(FILE),
  'certifier implementation is missing'
);

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

[
  'REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification',
  "'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'",
  "'absentee_owner_opa_account_range_property_source_identity_certification'",
  "'PROPERTY_SOURCE_IDENTITY_CERTIFIED'",
  "'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT'",
  'certify: certify',
  'propertySourceIdentityCertified:',
  'rangeContainmentDiagnosticCandidate:',
  'rangeContainmentCertifiedMatch:',
  "'SOURCE_PARCEL_TARGET_MISMATCH'",
  "'OPA_ACCOUNT_IDENTIFIER_MISMATCH'",
  "'RANGE_DIAGNOSTIC_INELIGIBLE'",
  'arvAuthorityGranted:',
  'repairScopeAuthorityGranted:',
  'maoAuthorityGranted:',
  'offerAuthorityGranted:',
  'automaticOfferAuthorityGranted:'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'required certifier marker missing: ' +
      marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'DriveApp',
  'GmailApp',
  'Jdbc',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  'REOS.AbsenteeOwnerClassification',
  'REOS.AbsenteeOwnerClassificationPersistenceExecutor',
  'owner_1',
  'owner_2',
  'mailing_address_1',
  'mailing_address_2',
  'mailing_care_of',
  'mailing_city_state',
  'mailing_street',
  'mailing_zip'
].forEach(token => {
  assert.strictEqual(
    source.includes(token),
    false,
    'prohibited certifier token present: ' +
      token
  );
});

assert.strictEqual(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    source
  ),
  false,
  'certifier must not expose a global Apps Script RPC'
);

assert.ok(
  /REOS\s*\.\s*AbsenteeOwnerOpaAccountRangeEvidenceEvaluator/.test(
    source
  ),
  'certifier must reference the certified range evaluator'
);

assert.strictEqual(
  (
    source.match(
      /AbsenteeOwnerOpaAccountRangeEvidenceEvaluator[\s\S]*?\.evaluate\s*\(/g
    ) || []
  ).length,
  1,
  'existing range evaluator must be invoked exactly once'
);

assert.strictEqual(
  /function\s+parse(?:Target|Range|Address|Location)/.test(
    source
  ),
  false,
  'certifier must not implement a second range parser'
);

assert.ok(
  source.includes(
    '.replace(/\\s+/g, \' \')'
  ) &&
  source.includes(
    '.toUpperCase()'
  ),
  'address normalization must remain superficial'
);

assert.ok(
  source.includes(
    'observations.length < 2'
  ) &&
  source.includes(
    'observations.length > 5'
  ),
  'two-through-five source bound is missing'
);

assert.ok(
  source.includes(
    '/^\\d{9}$/.test(account)'
  ),
  'nine-digit OPA account check is missing'
);

assert.ok(
  /source\.parcelIdNum\s*!==\s*exact\.parcelId/.test(
    source
  ),
  'source parcel to persisted parcel binding is missing'
);

assert.ok(
  /opaParcelNumber\s*!==\s*source\.opaAccountNum/.test(
    source
  ),
  'OPA account identifier binding is missing'
);

assert.ok(
  /rangeContainmentCertifiedMatch\s*===\s*false/.test(
    source
  ),
  'evaluator certified-match false gate is missing'
);

console.log(
  'ABSENTEE_OWNER_OPA_ACCOUNT_RANGE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_STATIC_VALID=true'
);

console.log(
  'PURE_INTERNAL_CERTIFIER=true'
);

console.log(
  'ONLY_RANGE_EVALUATOR_RUNTIME_DEPENDENCY=true'
);

console.log(
  'RANGE_EVALUATOR_INVOCATION_MAX=1'
);

console.log(
  'PUBLIC_RPC_CREATED=false'
);

console.log(
  'EXTERNAL_HTTP_AUTHORITY=false'
);

console.log(
  'DATABASE_OR_SPREADSHEET_AUTHORITY=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
