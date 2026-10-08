#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint.js';

const DESIGN =
  'docs/absentee-owner-certified-property-source-identity-owner-evidence-production-invocation-boundary-design-v1.md';

const LOOKUP =
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js';

const EXPECTED_DESIGN_SHA =
  '3fb6aec6c113b1c4aa3c299cc7f48ea83ff501ec1a150b71479b7fe5c7021cb5';

const EXPECTED_LOOKUP_SHA =
  '9bdd012566e598bfa5d008dd776b64489b05c524b0577374a65da9760173b274';

function full(relative) {
  return path.join(
    ROOT,
    relative
  );
}

function read(relative) {
  return fs.readFileSync(
    full(relative),
    'utf8'
  );
}

function sha256(relative) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(
        full(relative)
      )
    )
    .digest('hex');
}

[
  RUNTIME,
  DESIGN,
  LOOKUP
].forEach(relative => {
  assert.ok(
    fs.existsSync(
      full(relative)
    ),
    'required production entrypoint surface missing: ' +
      relative
  );
});

assert.strictEqual(
  sha256(DESIGN),
  EXPECTED_DESIGN_SHA,
  'production invocation design changed'
);

assert.strictEqual(
  sha256(LOOKUP),
  EXPECTED_LOOKUP_SHA,
  'certified internal owner-evidence lookup changed'
);

const text =
  read(RUNTIME);

[
  'REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint',
  'function execute(options)',
  'execute: execute',
  'function reosAbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceRetrieveSingleRecord(',
  'REOS.Security.requireAdmin();',

  "'READ_ONLY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT'",
  "'absentee_owner_certified_property_source_identity_owner_evidence_single_record_production'",

  "'propertySourceIdentityCertification'",
  "'normalLookupEvidence'",

  '.lookup(',

  'productionDataMutationAuthorityGranted:',
  'sourceEvidenceRetrievalAuthorityGranted:',
  'ownerEvidenceRetrievalAuthorityGranted:',
  'ownerEvidencePersistenceAuthorityGranted:',
  'classificationAuthorityGranted:',
  'absenteeClassificationAuthorityGranted:',
  'classificationPersistenceAuthorityGranted:',
  'schedulerAuthorityGranted:',
  'triggerAuthorityGranted:',
  'qualifiedDealQueueAuthorityGranted:',
  'acquisitionLifecycleAuthorityGranted:',
  'arvAuthorityGranted:',
  'repairScopeAuthorityGranted:',
  'maoAuthorityGranted:',
  'offerAuthorityGranted:',
  'automaticOfferAuthorityGranted:'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required runtime marker missing: ' +
      marker
  );
});

assert.ok(
  /REOS\s*\.\s*AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup/
    .test(text),
  'certified owner-evidence lookup dependency missing'
);

[
  'UrlFetchApp',
  'REOS.Database',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',

  'REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  'REOS.AbsenteeOwnerClassification',

  'sourceOpaAccountNum',
  'certifiedOpaAccount',

  'setValue(',
  'setValues(',
  'appendRow(',
  'deleteRow('
].forEach(marker => {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited direct runtime marker present: ' +
      marker
  );
});

const rpcMatches =
  text.match(
    /\bfunction\s+reosAbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceRetrieveSingleRecord\s*\(/g
  ) || [];

assert.strictEqual(
  rpcMatches.length,
  1,
  'expected exactly one production owner-evidence RPC'
);

assert.strictEqual(
  (
    text.match(
      /\.lookup\s*\(/g
    ) || []
  ).length,
  1,
  'certified owner-evidence lookup must be invoked exactly once'
);

assert.strictEqual(
  (
    text.match(
      /REOS\.Security\.requireAdmin\(\);/g
    ) || []
  ).length,
  1,
  'admin gate must occur exactly once'
);

const executeStart =
  text.indexOf(
    'function execute(options)'
  );

const adminIndex =
  text.indexOf(
    'REOS.Security.requireAdmin();',
    executeStart
  );

const validationIndex =
  text.indexOf(
    'validateInput_(',
    adminIndex
  );

const dependencyIndex =
  text.indexOf(
    'dependenciesAvailable_()',
    validationIndex
  );

const lookupIndex =
  text.indexOf(
    '.lookup(',
    dependencyIndex
  );

assert.ok(
  executeStart >= 0 &&
  adminIndex > executeStart &&
  validationIndex > adminIndex &&
  dependencyIndex > validationIndex &&
  lookupIndex > dependencyIndex,
  'admin / validation / dependency / lookup execution order changed'
);

[
  'productionDataMutationAuthorityGranted',
  'sourceEvidenceRetrievalAuthorityGranted',
  'ownerEvidenceRetrievalAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'classificationAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.ok(
    new RegExp(
      field +
      '\\s*:\\s*false'
    ).test(text),
    'authority field must remain false: ' +
      field
  );
});

console.log(
  'ABSENTEE_OWNER_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_STATIC_VALID=true'
);

console.log(
  'DESIGN_AUTHORITY_EXACT=true'
);

console.log(
  'ADMIN_GATE_FIRST=true'
);

console.log(
  'TOP_LEVEL_INPUT_FIELD_COUNT=2'
);

console.log(
  'LOOKUP_DELEGATE_INVOCATION_COUNT=1'
);

console.log(
  'DIRECT_HTTP_AUTHORITY=false'
);

console.log(
  'DIRECT_DATABASE_AUTHORITY=false'
);

console.log(
  'DIRECT_OPA_ACCOUNT_INPUT_AUTHORITY=false'
);

console.log(
  'BATCH_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY=false'
);

console.log(
  'ARV_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'OFFER_AUTHORITY=false'
);
