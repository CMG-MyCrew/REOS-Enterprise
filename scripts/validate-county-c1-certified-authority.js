#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const vm =
  require('node:vm');

const ROOT =
  path.resolve(__dirname, '..');

const AUTHORITY =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyC1CertifiedAuthority.js'
  );

const EXPECTED_DESCRIPTOR_SOURCE_SHA =
  '9d5b728823107083c50f5bb4871e0fce47967e21eadd70a59e13f97e13a2eea9';

const EXPECTED_COUNT =
  664;

const source =
  fs.readFileSync(
    AUTHORITY,
    'utf8'
  );

function pass(message) {
  console.log(
    `PASS: ${message}`
  );
}

console.log(
  '=== COUNTY C1 CERTIFIED AUTHORITY CONTRACT ==='
);

/*
 * The authority catalog is data/identity only.
 * It may not read or mutate production state.
 */
[
  /REOS\.Database/,
  /PropertiesService/,
  /UrlFetchApp/,
  /CountyAdapters/,
  /CountyConnectorSDK/,
  /CountyRuntimeBridge/,
  /SpreadsheetApp/,
  /DriveApp/,
  /GmailApp/,
  /MailApp/,
  /ScriptApp/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /\.setProperty\s*\(/,
  /\.appendRow\s*\(/,
  /\.setValues\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(source),
    false,
    `forbidden authority-catalog surface: ${pattern}`
  );
});

assert.ok(
  source.includes(
    EXPECTED_DESCRIPTOR_SOURCE_SHA
  ),
  'certified descriptor source SHA missing'
);

assert.ok(
  source.includes(
    'var DESCRIPTOR_COUNT =\n    664;'
  ),
  'certified descriptor count constant missing'
);

const context = {
  console,

  Object,

  String,

  Error,

  REOS: {}
};

vm.createContext(
  context
);

vm.runInContext(
  source,
  context,
  {
    filename:
      'CountyC1CertifiedAuthority.js'
  }
);

const authority =
  context.REOS
    .CountyC1CertifiedAuthority;

assert.ok(
  authority,
  'CountyC1CertifiedAuthority namespace missing'
);

assert.equal(
  typeof authority.resolve,
  'function',
  'authority resolve API missing'
);

assert.equal(
  typeof authority.metadata,
  'function',
  'authority metadata API missing'
);

const metadata =
  authority.metadata();

assert.equal(
  metadata.mode,
  'READ_ONLY_AUTHORITY_CATALOG'
);

assert.equal(
  metadata.planningClass,
  'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE'
);

assert.equal(
  metadata.connectorId,
  'PA-PHILADELPHIA'
);

assert.equal(
  metadata.dataset,
  'code_violations'
);

assert.equal(
  metadata.descriptorSourceSha256,
  EXPECTED_DESCRIPTOR_SOURCE_SHA
);

assert.equal(
  metadata.descriptorCount,
  EXPECTED_COUNT
);

assert.equal(
  metadata.recordCount,
  EXPECTED_COUNT
);

assert.equal(
  metadata.mutationAuthorityGranted,
  false
);

assert.equal(
  metadata.insertAuthorityGranted,
  false
);

assert.match(
  metadata.catalogSha256,
  /^[0-9a-f]{64}$/
);

pass(
  'catalog metadata binds exact certified descriptor source'
);

pass(
  'catalog contains exactly 664 C1 authority records'
);

const sample =
  authority.resolve(
    'pa-philadelphia|code_violations|10'
  );

assert.ok(
  sample,
  'known certified C1 sample is missing'
);

assert.equal(
  sample.planningClass,
  'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE'
);

assert.equal(
  sample.sourceObservationKey,
  'pa-philadelphia|code_violations|10'
);

assert.equal(
  sample.connectorId,
  'PA-PHILADELPHIA'
);

assert.equal(
  sample.dataset,
  'code_violations'
);

assert.equal(
  sample.immutableSourceRecordId,
  '10'
);

assert.equal(
  sample.expectedCanonicalPropertyKey,
  'property|parcel|pa|philadelphia|511161'
);

assert.equal(
  sample.historicalNormalizedSourceRecordSha256,
  '28ee369d1571131c6f4b6133be18bac06d517e632e2e65e16e5eb0bd7d3a46d7'
);

assert.equal(
  sample.descriptorSha256,
  '9cc0011c3fce626df41d43a6cb563c15d1255216ee56658a99022e9f702d0c21'
);

assert.equal(
  sample.authorityDescriptorSourceSha256,
  EXPECTED_DESCRIPTOR_SOURCE_SHA
);

assert.equal(
  sample.authorityCatalogSha256,
  metadata.catalogSha256
);

pass(
  'known certified C1 descriptor resolves exactly'
);

assert.equal(
  authority.resolve(
    'pa-philadelphia|code_violations|999999999999999999'
  ),
  null
);

assert.equal(
  authority.resolve(
    'PA-PHILADELPHIA|code_violations|10'
  ),
  null
);

assert.equal(
  authority.resolve(
    '__proto__'
  ),
  null
);

assert.equal(
  authority.resolve(
    'constructor'
  ),
  null
);

pass(
  'unknown or noncanonical candidate identity fails closed'
);

/*
 * Returned records must be defensive copies rather than mutable
 * references into the embedded authority table.
 */
const copy =
  authority.resolve(
    'pa-philadelphia|code_violations|10'
  );

copy.immutableSourceRecordId =
  '999999';

copy.expectedCanonicalPropertyKey =
  'tampered';

const reread =
  authority.resolve(
    'pa-philadelphia|code_violations|10'
  );

assert.equal(
  reread.immutableSourceRecordId,
  '10'
);

assert.equal(
  reread.expectedCanonicalPropertyKey,
  'property|parcel|pa|philadelphia|511161'
);

pass(
  'authority resolution returns defensive identity copies'
);

assert.deepEqual(
  Object.keys(authority).sort(),
  [
    'metadata',
    'resolve'
  ]
);

pass(
  'authority public surface is limited to resolve + metadata'
);

console.log('');
console.log(
  'County C1 certified authority validation PASSED.'
);
