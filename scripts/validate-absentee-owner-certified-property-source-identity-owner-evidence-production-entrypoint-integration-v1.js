#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const DESIGN =
  'docs/absentee-owner-certified-property-source-identity-owner-evidence-production-invocation-boundary-design-v1.md';

const RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint.js';

const LOOKUP =
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js';

const CERTIFIER =
  'build/apps-script-brand/AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js';

const NORMAL_LOOKUP =
  'build/apps-script-brand/AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js';

const COMPARISON =
  'build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js';

const COUNTY =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const DESIGN_VALIDATOR =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-production-invocation-boundary-design-v1.js';

const STATIC_VALIDATOR =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-production-entrypoint-v1.js';

const BEHAVIOR_VALIDATOR =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-production-entrypoint-behavior-v1.js';

const INTEGRATION_VALIDATOR =
  'scripts/validate-absentee-owner-certified-property-source-identity-owner-evidence-production-entrypoint-integration-v1.js';

const EXPECTED_DESIGN_SHA =
  '3fb6aec6c113b1c4aa3c299cc7f48ea83ff501ec1a150b71479b7fe5c7021cb5';

const EXPECTED_LOOKUP_SHA =
  '9bdd012566e598bfa5d008dd776b64489b05c524b0577374a65da9760173b274';

const EXPECTED_CERTIFIER_SHA =
  '5d02fe60c9746b740a7b4cf2e559a973a1e525b06e37d600ebb88447c38a2f5f';

const EXPECTED_NORMAL_LOOKUP_SHA =
  '26f6d6518b19fc0397ae9f61f573455fc611301f3d017b7b298b7aee719d554e';

const EXPECTED_COMPARISON_SHA =
  '9b8f8da50e5eac2a9e1ab5a9653420da35a6c2258184a942acebb857b7c9db14';

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
  DESIGN,
  RUNTIME,
  LOOKUP,
  CERTIFIER,
  NORMAL_LOOKUP,
  COMPARISON,
  COUNTY,
  WORKFLOW,
  DESIGN_VALIDATOR,
  STATIC_VALIDATOR,
  BEHAVIOR_VALIDATOR,
  INTEGRATION_VALIDATOR
].forEach(relative => {
  assert.ok(
    fs.existsSync(
      full(relative)
    ),
    'required integration surface missing: ' +
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
  'owner-evidence lookup changed'
);

assert.strictEqual(
  sha256(CERTIFIER),
  EXPECTED_CERTIFIER_SHA,
  'property-source certifier changed'
);

assert.strictEqual(
  sha256(NORMAL_LOOKUP),
  EXPECTED_NORMAL_LOOKUP_SHA,
  'normal owner lookup changed'
);

assert.strictEqual(
  sha256(COMPARISON),
  EXPECTED_COMPARISON_SHA,
  'owner-evidence comparison changed'
);

const runtime =
  read(RUNTIME);

const county =
  read(COUNTY);

const workflow =
  read(WORKFLOW);

assert.ok(
  runtime.includes(
    'REOS.Security.requireAdmin'
  ),
  'authorized admin dependency missing'
);

assert.ok(
  /REOS\s*\.\s*AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup/
    .test(runtime),
  'authorized owner-evidence lookup dependency missing'
);

[
  'UrlFetchApp',
  'REOS.Database',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever',
  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  'REOS.AbsenteeOwnerClassification'
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'prohibited runtime dependency present: ' +
      marker
  );
});

function arrayValues(name) {
  const match =
    county.match(
      new RegExp(
        name +
        '\\s*=\\s*\\[(.*?)\\];',
        's'
      )
    );

  assert.ok(
    match,
    'county inventory missing: ' +
      name
  );

  return (
    match[1]
      .match(
        /'[^']+'/g
      ) || []
  ).map(value =>
    value.slice(1, -1)
  );
}

assert.strictEqual(
  arrayValues(
    'POST_COUNTY_PRODUCTION_FILES'
  ).length,
  70
);

assert.strictEqual(
  arrayValues(
    'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES'
  ).length,
  1
);

assert.strictEqual(
  arrayValues(
    'ABSENTEE_OWNER_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_PRODUCTION_FILES'
  ).length,
  1
);

assert.strictEqual(
  arrayValues(
    'ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_PRODUCTION_FILES'
  ).length,
  1
);

assert.strictEqual(
  arrayValues(
    'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_ENTRYPOINT_FILES'
  ).length,
  1
);

const newInventory =
  arrayValues(
    'ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_FILES'
  );

assert.deepStrictEqual(
  newInventory,
  [
    'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint.js'
  ]
);

assert.strictEqual(
  arrayValues(
    'COMPONENT_VALIDATORS'
  ).length,
  97
);

assert.strictEqual(
  arrayValues(
    'POST_COUNTY_PRODUCTION_FILES'
  ).includes(RUNTIME),
  false,
  'new runtime must not expand historical post-county inventory'
);

const workflowMarkers = [
  'node --check ' + DESIGN_VALIDATOR,
  'node --check ' + RUNTIME,
  'node --check ' + STATIC_VALIDATOR,
  'node --check ' + BEHAVIOR_VALIDATOR,
  'node --check ' + INTEGRATION_VALIDATOR,

  'run: node ' + DESIGN_VALIDATOR,
  'run: node ' + STATIC_VALIDATOR,
  'run: node ' + BEHAVIOR_VALIDATOR,
  'run: node ' + INTEGRATION_VALIDATOR
];

workflowMarkers.forEach(marker => {
  assert.strictEqual(
    workflow.split(marker).length - 1,
    1,
    'CI registration must occur exactly once: ' +
      marker
  );
});

assert.ok(
  county.includes(
    'bounded certified-property-source owner-evidence production entrypoint surface is exactly one explicitly allowlisted additive file'
  ),
  'county runtime certification marker missing'
);

console.log(
  'ABSENTEE_OWNER_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_INTEGRATION_VALID=true'
);

console.log(
  'AUTHORIZED_RUNTIME_DEPENDENCY_COUNT=2'
);

console.log(
  'POST_COUNTY_PRODUCTION_FILE_COUNT=70'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=97'
);

console.log(
  'OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_FILE_COUNT=1'
);

console.log(
  'HISTORICAL_INVENTORIES_PRESERVED=true'
);

console.log(
  'ENTRYPOINT_CI_REGISTRATION_EXACT=true'
);

console.log(
  'DIRECT_HTTP_AUTHORITY=false'
);

console.log(
  'DIRECT_DATABASE_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY=false'
);

console.log(
  'DEPLOYMENT_AUTHORITY=false'
);

console.log(
  'PRODUCTION_INVOCATION_AUTHORITY=false'
);
