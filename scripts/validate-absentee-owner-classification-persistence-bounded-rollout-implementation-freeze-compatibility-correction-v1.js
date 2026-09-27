#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

function read(relative) {
  return fs.readFileSync(
    path.join(ROOT, relative),
    'utf8'
  );
}

const DESIGN =
  'docs/absentee-owner-classification-persistence-bounded-rollout-implementation-freeze-compatibility-correction-v1.md';

const FREEZE =
  'docs/absentee-owner-classification-persistence-bounded-rollout-implementation-freeze-v1.md';

const CLASSIFICATION_INTEGRATION =
  'scripts/validate-absentee-owner-classification-integration-v1.js';

const SINGLE_RECORD_INTEGRATION =
  'scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js';

const RUNTIME_INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

[
  DESIGN,
  FREEZE,
  CLASSIFICATION_INTEGRATION,
  SINGLE_RECORD_INTEGRATION,
  RUNTIME_INTEGRATION
].forEach(file => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, file)
    ),
    'required correction authority missing: ' + file
  );
});

const design =
  read(DESIGN);

const freeze =
  read(FREEZE);

const classification =
  read(CLASSIFICATION_INTEGRATION);

const singleRecord =
  read(SINGLE_RECORD_INTEGRATION);

const runtime =
  read(RUNTIME_INTEGRATION);

[
  '43',
  '47',
  '104',
  '147',
  '74',
  '7` new files',
  '4` modified existing files',
  '11` total files',
  'No other existing source or validator file is authorized to change.',
  'No count-obfuscation workaround',
  'Automatic MAO or offer authority remains blocked'
].forEach(marker => {
  assert.ok(
    design.includes(marker),
    'correction design marker missing: ' + marker
  );
});

const requiredRuntimes = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js'
];

requiredRuntimes.forEach(file => {
  assert.ok(
    design.includes(file),
    'correction design runtime missing: ' + file
  );
});

const additionalValidators = [
  'scripts/validate-absentee-owner-classification-integration-v1.js',
  'scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js'
];

additionalValidators.forEach(file => {
  assert.ok(
    design.includes(file),
    'authorized count-coupled validator missing: ' + file
  );
});

assert.ok(
  freeze.includes(
    '.github/workflows/county-collapse-offline.yml'
  ),
  'original freeze workflow authority missing'
);

assert.ok(
  freeze.includes(
    'scripts/validate-county-runtime-integration.js'
  ),
  'original freeze runtime-integration authority missing'
);

const postStart =
  runtime.indexOf(
    'const POST_COUNTY_PRODUCTION_FILES = ['
  );

const postEnd =
  runtime.indexOf(
    '];',
    postStart
  );

assert.ok(
  postStart >= 0 &&
  postEnd > postStart,
  'unable to locate post-county production inventory'
);

const currentPostEntries =
  runtime
    .slice(
      postStart,
      postEnd
    )
    .match(
      /'build\/apps-script-brand\/[^']+\.js'/g
    ) || [];

assert.strictEqual(
  currentPostEntries.length,
  43,
  'preimplementation certified main must still contain exactly 43 current post-county runtime entries'
);

assert.ok(
  /postCountyEntries\.length,\s*43,/s
    .test(classification),
  'classification integration must still exhibit discovered 43-count coupling before implementation'
);

assert.ok(
  classification.includes(
    'POST_COUNTY_PRODUCTION_FILE_COUNT=43'
  ),
  'classification integration summary must still exhibit discovered count 43'
);

assert.ok(
  /postEntries\.length,\s*43,/s
    .test(singleRecord),
  'single-record integration must still exhibit direct 43-count coupling before implementation'
);

assert.ok(
  /postCountyEntries\\\.length,\s*\\s\*43/s
    .test(singleRecord) ||
  singleRecord.includes(
    'postCountyEntries\\.length,\\s*43'
  ),
  'single-record integration must still check classification integration count 43'
);

assert.ok(
  singleRecord.includes(
    'POST_COUNTY_PRODUCTION_FILE_COUNT=43'
  ),
  'single-record integration must still check classification summary count 43'
);

const scriptsDir =
  path.join(
    ROOT,
    'scripts'
  );

const coupled = [];

for (
  const name of
  fs.readdirSync(scriptsDir)
) {
  if (!name.endsWith('.js')) {
    continue;
  }

  const relative =
    'scripts/' + name;

  /*
   * This validator contains the historical 43-count markers as
   * certification fixtures. Exclude only this validator itself so
   * discovery continues to describe historical validators rather than
   * counting the diagnostic authority performing the discovery.
   */
  if (
    relative ===
    'scripts/validate-absentee-owner-classification-persistence-bounded-rollout-implementation-freeze-compatibility-correction-v1.js'
  ) {
    continue;
  }

  const text =
    read(relative);

  const directlyCoupled =
    /(?:postCountyEntries|postEntries)\.length,\s*43,/s
      .test(text);

  const crossCoupled =
    text.includes(
      'POST_COUNTY_PRODUCTION_FILE_COUNT=43'
    ) &&
    (
      text.includes(
        'postCountyEntries\\.length'
      ) ||
      text.includes(
        'postEntries.length'
      )
    );

  if (
    directlyCoupled ||
    crossCoupled
  ) {
    coupled.push(relative);
  }
}

coupled.sort();

const expectedCoupled = [
  CLASSIFICATION_INTEGRATION,
  SINGLE_RECORD_INTEGRATION
].sort();

assert.deepStrictEqual(
  coupled,
  expectedCoupled,
  'exact count-coupled validator set changed'
);

assert.ok(
  runtime.includes(
    'expected county runtime integration inventory must contain 104 files'
  ),
  'historical county runtime 104 authority changed'
);

assert.ok(
  runtime.includes(
    'county runtime remains exactly 104 additive files'
  ),
  'historical county runtime 104 summary changed'
);

assert.ok(
  runtime.includes(
    'expected reconciled production inventory must contain 147 files'
  ),
  'historical reconciled production inventory 147 changed'
);

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
  'unable to locate component-validator inventory'
);

const componentEntries =
  runtime
    .slice(
      componentStart,
      componentEnd
    )
    .match(
      /'validate-[^']+\.js'/g
    ) || [];

assert.strictEqual(
  componentEntries.length,
  74,
  'component validator inventory must remain 74'
);

assert.ok(
  design.includes(
    'current post-county inventory must truthfully contain exactly `47`'
  ),
  'count-obfuscation prohibition missing'
);

assert.ok(
  design.includes(
    'Implementation may resume only after this compatibility correction completes'
  ),
  'resume gate missing'
);

assert.ok(
  design.includes(
    'The implementation may not simply commit the currently preserved candidate'
  ),
  'stale-main implementation prohibition missing'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_BOUNDED_ROLLOUT_IMPLEMENTATION_FREEZE_COMPATIBILITY_CORRECTION_VALID=true'
);

console.log(
  'COUNT_COUPLED_VALIDATOR_COUNT=2'
);

console.log(
  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=43'
);

console.log(
  'TARGET_POST_COUNTY_PRODUCTION_FILE_COUNT=47'
);

console.log(
  'POST_COUNTY_INCREMENT=4'
);

console.log(
  'RUNTIME_SURFACE_COUNT=4'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=74'
);

console.log(
  'HISTORICAL_COUNTY_RUNTIME_INVENTORY=104'
);

console.log(
  'HISTORICAL_RECONCILED_PRODUCTION_INVENTORY=147'
);

console.log(
  'IMPLEMENTATION_NEW_FILE_COUNT=7'
);

console.log(
  'IMPLEMENTATION_MODIFIED_FILE_COUNT=4'
);

console.log(
  'IMPLEMENTATION_TOTAL_SCOPE_FILE_COUNT=11'
);

console.log(
  'DATABASE_MODIFICATION_AUTHORIZED=false'
);

console.log(
  'DISTRESS_LEADS_SCHEMA_MODIFICATION_AUTHORIZED=false'
);

console.log(
  'EVIDENCE_STORE_PROVISIONING_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_EXECUTION_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
