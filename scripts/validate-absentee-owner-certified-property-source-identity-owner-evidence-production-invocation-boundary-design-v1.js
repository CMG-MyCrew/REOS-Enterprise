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

const LOOKUP =
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js';

const CERTIFIER =
  'build/apps-script-brand/AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js';

const NORMAL_LOOKUP =
  'build/apps-script-brand/AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js';

const COMPARISON =
  'build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js';

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
  LOOKUP,
  CERTIFIER,
  NORMAL_LOOKUP,
  COMPARISON
].forEach(relative => {
  assert.ok(
    fs.existsSync(
      full(relative)
    ),
    'required design dependency missing: ' +
      relative
  );
});

assert.strictEqual(
  sha256(LOOKUP),
  EXPECTED_LOOKUP_SHA,
  'certified owner-evidence lookup changed'
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

const text =
  read(DESIGN);

[
  '# Absentee-Owner Certified Property-Source Identity Owner-Evidence Production Invocation Boundary Design v1',

  'one narrowly bounded production invocation surface',

  '`REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.lookup(options)`',

  '`READ_ONLY_OWNER_EVIDENCE`',
  '`certified_opa_account`',

  '`propertySourceIdentityCertification`',
  '`normalLookupEvidence`',

  '`REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint`',

  '`reosAbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceRetrieveSingleRecord(options)`',

  '`manual_single_record_admin_only`',
  '`REOS.Security.requireAdmin()`',

  'Direct caller-supplied OPA account input is prohibited.',
  'Batch or list invocation is prohibited.',

  'delegate exactly once',

  'zero retry authority',
  'zero pagination authority',

  '`MATCHED`',
  '`NO_MATCH`',
  '`AMBIGUOUS`',
  '`FAILED`',

  'A malformed upstream result fails closed.',
  'An upstream result containing any true authority grant fails closed.',

  'The existing owner-evidence lookup is not modified.',
  'The existing property-source identity certifier is not modified.',
  'The existing exact-address owner lookup is not modified.',
  'The existing owner-evidence comparison runtime is not modified.',

  'The historical `POST_COUNTY_PRODUCTION_FILES` count remains 70.',
  'The historical `COMPONENT_VALIDATORS` count remains 97.',

  'Deployment does not authorize production invocation.',

  'Automatic MAO or offer authority remains blocked unless both adequate comp-supported ARV and an adequate repair scope are present.'
].forEach(marker => {
  assert.ok(
    text.includes(marker),
    'required design marker missing: ' +
      marker
  );
});

[
  'DIRECT_OPA_ACCOUNT_INPUT_AUTHORIZED=true',
  'BATCH_INPUT_AUTHORIZED=true',
  'PERSISTENCE_AUTHORITY=true',
  'CLASSIFICATION_AUTHORITY=true',
  'SCHEDULER_AUTHORITY=true',
  'TRIGGER_AUTHORITY=true',
  'ARV_AUTHORITY=true',
  'MAO_AUTHORITY=true',
  'OFFER_AUTHORITY=true',
  'PRODUCTION_INVOCATION_AUTHORIZED=true'
].forEach(marker => {
  assert.strictEqual(
    text.includes(marker),
    false,
    'prohibited design authority marker present: ' +
      marker
  );
});

console.log(
  'ABSENTEE_OWNER_OWNER_EVIDENCE_PRODUCTION_INVOCATION_BOUNDARY_DESIGN_VALID=true'
);

console.log(
  'INVOCATION_MODEL=manual_single_record_admin_only'
);

console.log(
  'PROPOSED_INPUT_FIELD_COUNT=2'
);

console.log(
  'DIRECT_OPA_ACCOUNT_INPUT_AUTHORIZED=false'
);

console.log(
  'BATCH_INPUT_AUTHORIZED=false'
);

console.log(
  'OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'OFFER_AUTHORITY=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_INVOCATION_AUTHORIZED=false'
);
