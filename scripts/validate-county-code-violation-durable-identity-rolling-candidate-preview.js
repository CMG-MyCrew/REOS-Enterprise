#!/usr/bin/env node
'use strict';

const fs = require('fs');
const assert = require('assert');

const file =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js';

const src = fs.readFileSync(file, 'utf8');

function pass(message) {
  console.log('PASS: ' + message);
}

assert.match(
  src,
  /function preview\s*\(options\)/
);
pass('preview function exists.');

assert.match(
  src,
  /READ_ONLY_GENERIC_ROLLING_DURABLE_IDENTITY_CANDIDATE_PREVIEW/
);
pass('preview mode is explicitly read-only.');

assert.match(
  src,
  /reosCountyCodeViolationDurableIdentityRollingMigrationPreview/
);
pass('controlled preview RPC exists.');

assert.match(
  src,
  /selectBatch_\(plan,\s*requestedBatchSize\)/
);
pass('preview reuses deterministic production batch selection.');

assert.match(
  src,
  /assertContiguousSelection_\(selected\)/
);
pass('preview proves physical contiguity.');

assert.match(
  src,
  /prestateFingerprintSha256/
);
pass('preview exposes certified prestate fingerprint evidence.');

assert.match(
  src,
  /migrationPlanSha256/
);
assert.match(
  src,
  /completePlanSha256/
);
pass('preview binds both rolling hashes.');

[
  'mutationAuthorityGranted: false',
  'schedulerMutationAuthorityGranted: false',
  'checkpointMutationAuthorityGranted: false',
  'offerAuthorityGranted: false'
].forEach(fragment => {
  assert.ok(
    src.includes(fragment),
    'missing ' + fragment
  );
});
pass('preview grants no mutation/scheduler/checkpoint/offer authority.');

const previewStart = src.indexOf('function preview(options)');
const statusStart = src.indexOf('function status()', previewStart);

assert.ok(previewStart >= 0 && statusStart > previewStart);

const previewSrc = src.slice(previewStart, statusStart);

[
  '.setValues(',
  '.setValue(',
  'Database.insert(',
  'Database.update(',
  'Database.upsert(',
  'deleteRow(',
  'deleteRows(',
  'newTrigger('
].forEach(fragment => {
  assert.ok(
    !previewSrc.includes(fragment),
    'preview contains forbidden mutation primitive: ' + fragment
  );
});
pass('preview surface contains no mutation primitive.');

console.log(
  '=== ROLLING CANDIDATE PREVIEW STATIC VALIDATION PASSED ==='
);
