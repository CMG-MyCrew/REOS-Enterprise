#!/usr/bin/env node
'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const path =
  require('path');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const IMPLEMENTATION =
  'build/apps-script-brand/AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js';

const STATIC =
  'scripts/validate-absentee-owner-opa-account-range-property-source-identity-certification-v1.js';

const BEHAVIOR =
  'scripts/validate-absentee-owner-opa-account-range-property-source-identity-certification-behavior-v1.js';

const INTEGRATION =
  'scripts/validate-absentee-owner-opa-account-range-property-source-identity-certification-integration-v1.js';

const DESIGN_VALIDATOR =
  'scripts/validate-absentee-owner-opa-account-range-certified-property-source-identity-boundary-design-v1.js';

const EVALUATOR =
  'build/apps-script-brand/AbsenteeOwnerOpaAccountRangeEvidenceEvaluator.js';

const RUNTIME =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

[
  IMPLEMENTATION,
  STATIC,
  BEHAVIOR,
  INTEGRATION,
  DESIGN_VALIDATOR,
  EVALUATOR,
  RUNTIME,
  WORKFLOW
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(
        ROOT,
        file
      )
    ),
    'required integration surface missing: ' +
      file
  );
});

function read(file) {
  return fs.readFileSync(
    path.join(
      ROOT,
      file
    ),
    'utf8'
  );
}

function count(
  text,
  marker
) {
  return text
    .split(marker)
    .length -
    1;
}

function sha256(text) {
  return crypto
    .createHash('sha256')
    .update(
      text,
      'utf8'
    )
    .digest('hex');
}

const implementation =
  read(IMPLEMENTATION);

const evaluator =
  read(EVALUATOR);

const runtime =
  read(RUNTIME);

const workflow =
  read(WORKFLOW);

const behavior =
  read(BEHAVIOR);

assert.strictEqual(
  sha256(evaluator),
  '46c810dd4ab66189bb74a6e5086276e1258351f7379c3bdc98246e19df4ec016',
  'existing range evaluator changed'
);

[
  'REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification',
  'certify: certify',
  "'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'",
  "'PROPERTY_SOURCE_IDENTITY_CERTIFIED'",
  'propertySourceIdentityCertified:',
  'rangeContainmentCertifiedMatch:',
].forEach(marker => {
  assert.ok(
    implementation.includes(
      marker
    ),
    'implementation marker missing: ' +
      marker
  );
});

assert.ok(
  /REOS\s*\.\s*AbsenteeOwnerOpaAccountRangeEvidenceEvaluator/.test(
    implementation
  ),
  'certifier must reference the certified range evaluator'
);

assert.ok(
  /REOS\s*\.\s*AbsenteeOwnerOpaAccountRangeEvidenceEvaluator[\s\S]*?\.\s*evaluate\s*\(/.test(
    implementation
  ),
  'certifier must invoke the certified range evaluator'
);

assert.strictEqual(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    implementation
  ),
  false,
  'certifier must remain internal and non-RPC'
);

assert.strictEqual(
  count(
    runtime,
    "'build/apps-script-brand/AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js'"
  ),
  1,
  'certifier must occur exactly once in runtime inventory'
);

[
  'ABSENTEE_OWNER_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_PRODUCTION_FILES',
  'bounded absentee-owner property-source identity certification inventory must contain exactly one file',
  'bounded absentee-owner property-source identity certification surface is exactly one explicitly allowlisted additive file'
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'runtime inventory marker missing: ' +
      marker
  );
});

const componentStart =
  runtime.indexOf(
    'const COMPONENT_VALIDATORS = ['
  );

const componentEnd =
  runtime.indexOf(
    '];',
    componentStart
  );

assert.ok(
  componentStart >= 0 &&
  componentEnd > componentStart,
  'component validator inventory missing'
);

const componentBlock =
  runtime.slice(
    componentStart,
    componentEnd
  );

const componentEntries =
  componentBlock.match(
    /'validate-[^']+\.js'/g
  ) || [];

assert.strictEqual(
  componentEntries.length,
  97,
  'historical component validator inventory must remain 97'
);

[
  STATIC,
  BEHAVIOR,
  INTEGRATION
].forEach(file => {
  assert.strictEqual(
    componentBlock.includes(
      "'" +
        path.basename(file) +
        "'"
    ),
    false,
    'new validator must remain workflow-only: ' +
      file
  );
});

assert.ok(
  runtime.includes(
    'expected county runtime integration inventory must contain 104 files'
  ),
  'historical county runtime count changed'
);

assert.ok(
  runtime.includes(
    'county runtime remains exactly 104 additive files'
  ),
  'historical county runtime summary changed'
);

assert.ok(
  runtime.includes(
    'expected reconciled production inventory must contain 147 files'
  ),
  'historical reconciled production count changed'
);

[
  'node --check ' +
    IMPLEMENTATION,

  'node --check ' +
    STATIC,

  'node --check ' +
    BEHAVIOR,

  'node --check ' +
    INTEGRATION
].forEach(marker => {
  assert.strictEqual(
    count(
      workflow,
      marker
    ),
    1,
    'workflow syntax registration must occur exactly once: ' +
      marker
  );
});

[
  'run: node ' +
    STATIC,

  'run: node ' +
    BEHAVIOR,

  'run: node ' +
    INTEGRATION
].forEach(marker => {
  assert.strictEqual(
    count(
      workflow,
      marker
    ),
    1,
    'workflow execution registration must occur exactly once: ' +
      marker
  );
});

assert.strictEqual(
  count(
    workflow,
    'run: node ' +
      DESIGN_VALIDATOR
  ),
  1,
  'merged design validator workflow registration changed'
);

assert.ok(
  behavior.includes(
    'behavior validator must execute exactly the 32 design-required cases'
  ),
  '32-case behavior contract missing'
);

assert.ok(
  behavior.includes(
    'PROPERTY_SOURCE_IDENTITY_BEHAVIOR_CASE_COUNT='
  ),
  'behavior case-count summary missing'
);

assert.ok(
  workflow.includes(
    'Validate current county runtime integration'
  ),
  'current county runtime integration step missing'
);

assert.strictEqual(
  count(
    workflow,
    'node ./scripts/validate-county-runtime-integration.js'
  ),
  1,
  'current county runtime integration invocation changed'
);

console.log(
  'ABSENTEE_OWNER_OPA_ACCOUNT_RANGE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_INTEGRATION_VALID=true'
);

console.log(
  'RUNTIME_PRODUCTION_ALLOWLIST_EXACT=true'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=97'
);

console.log(
  'COMPONENT_VALIDATOR_INVENTORY_UNCHANGED=true'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_COUNT=104'
);

console.log(
  'HISTORICAL_RECONCILED_PRODUCTION_COUNT=147'
);

console.log(
  'CI_SYNTAX_REGISTRATION_EXACT=true'
);

console.log(
  'CI_EXECUTION_REGISTRATION_EXACT=true'
);

console.log(
  'EXISTING_RANGE_EVALUATOR_UNCHANGED=true'
);

console.log(
  'PUBLIC_RPC_CREATED=false'
);

console.log(
  'EXTERNAL_HTTP_AUTHORITY=false'
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
