#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');

const MANIFEST =
  'certification/evidence/code-violations-production-completion/gate1-recovery/gate1-missing-recovery-authority-v1.json';

const AUTHORITY =
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryAuthority.js';

const EXPECTED_MANIFEST_SHA =
  '33733cdf3ea8fbfccf66dfe0904fe26999b184c2e367a920318b2d943fe6e8c6';

const EXPECTED_CATALOG_SHA =
  '050857487383e799b0a9dc503dfeeae759e8ddf60e485e4ae94cb551e2b8731d';

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) {
    return '[' + value.map(stable).join(',') + ']';
  }

  if (value && typeof value === 'object') {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map(key =>
          JSON.stringify(key) + ':' + stable(value[key])
        )
        .join(',') +
      '}'
    );
  }

  return JSON.stringify(value);
}

const manifestRaw = fs.readFileSync(MANIFEST);
assert.strictEqual(
  sha256(manifestRaw),
  EXPECTED_MANIFEST_SHA,
  'manifest SHA drift'
);

const manifest = JSON.parse(manifestRaw);

assert.strictEqual(
  manifest.schemaVersion,
  'code-violations-gate1-missing-recovery-authority-v1'
);

assert.strictEqual(
  manifest.sourceGitAuthority,
  '4a99f39727f59a6b9b18600890dcf6f4cec3d457'
);

assert.strictEqual(manifest.connectorId, 'PA-PHILADELPHIA');
assert.strictEqual(manifest.dataset, 'code_violations');

assert.strictEqual(
  manifest.certifiedPopulation.missingRecoveryCandidates,
  139
);

assert.strictEqual(
  manifest.certifiedPopulation.unresolvedConflicts,
  0
);

assert.strictEqual(manifest.candidates.length, 139);

const expectedRecords = {};

for (const candidate of manifest.candidates) {
  const violation =
    String(candidate.violationNumber).trim().toUpperCase();

  const durable =
    String(candidate.durableObservationKey)
      .trim()
      .toLowerCase();

  const expectedKey =
    'pa-philadelphia|code_violations|' +
    violation.toLowerCase();

  assert.strictEqual(
    durable,
    expectedKey,
    `durable identity mismatch: ${violation}`
  );

  assert.ok(
    candidate.expectedCanonicalPropertyKey,
    `missing canonical property: ${violation}`
  );

  assert.ok(
    candidate.expectedParcelId,
    `missing parcel: ${violation}`
  );

  assert.ok(
    !Object.prototype.hasOwnProperty.call(
      expectedRecords,
      durable
    ),
    `duplicate durable authority: ${durable}`
  );

  expectedRecords[durable] = {
    violationNumber: violation,
    durableObservationKey: durable,
    expectedCanonicalPropertyKey:
      String(candidate.expectedCanonicalPropertyKey).trim(),
    expectedParcelId:
      String(candidate.expectedParcelId).trim(),
    evidenceViolationDate:
      candidate.evidenceViolationDate,
    evidenceObjectId:
      String(candidate.evidenceObjectId),
    evidenceLegacyObjectIdObservationKey:
      String(candidate.evidenceLegacyObjectIdObservationKey),
    evidenceAddress:
      String(candidate.evidenceAddress),
    priority:
      String(candidate.priority)
  };
}

assert.strictEqual(
  Object.keys(expectedRecords).length,
  139
);

const computedCatalogSha =
  sha256(Buffer.from(stable(expectedRecords), 'utf8'));

assert.strictEqual(
  computedCatalogSha,
  EXPECTED_CATALOG_SHA,
  'catalog SHA mismatch'
);

const source =
  fs.readFileSync(AUTHORITY, 'utf8');

[
  'REOS.Database',
  'ScriptApp',
  'PropertiesService',
  'UrlFetchApp',
  'SpreadsheetApp',
  'LockService'
].forEach(token => {
  assert.ok(
    !source.includes(token),
    `authority catalog contains forbidden runtime dependency: ${token}`
  );
});

const sandbox = {
  REOS: {}
};

vm.runInNewContext(
  source,
  sandbox,
  {
    filename: AUTHORITY
  }
);

const authority =
  sandbox.REOS
    .CountyCodeViolationGate1RecoveryAuthority;

assert.ok(authority);
assert.strictEqual(typeof authority.resolve, 'function');
assert.strictEqual(typeof authority.metadata, 'function');

const metadata = authority.metadata();

assert.strictEqual(
  metadata.mode,
  'READ_ONLY_GATE1_MISSING_RECOVERY_AUTHORITY'
);

assert.strictEqual(
  metadata.sourceGitAuthority,
  '4a99f39727f59a6b9b18600890dcf6f4cec3d457'
);

assert.strictEqual(
  metadata.authorityManifestSha256,
  EXPECTED_MANIFEST_SHA
);

assert.strictEqual(
  metadata.authorityCatalogSha256,
  EXPECTED_CATALOG_SHA
);

assert.strictEqual(metadata.candidateCount, 139);
assert.strictEqual(metadata.recordCount, 139);

assert.strictEqual(
  metadata.durableIdentityField,
  'Violation Number'
);

assert.strictEqual(
  metadata.canonicalPropertyRequired,
  true
);

assert.strictEqual(
  metadata.objectIdIsDurableAuthority,
  false
);

[
  'mutationAuthorityGranted',
  'insertAuthorityGranted',
  'updateAuthorityGranted',
  'checkpointAuthorityGranted',
  'schedulerAuthorityGranted',
  'migrationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(flag => {
  assert.strictEqual(
    metadata[flag],
    false,
    `${flag} must remain false`
  );
});

for (const candidate of manifest.candidates) {
  const key =
    String(candidate.durableObservationKey)
      .trim()
      .toLowerCase();

  const expected =
    expectedRecords[key];

  const resolved =
    authority.resolve(key);

  assert.ok(
    resolved,
    `durable authority did not resolve: ${key}`
  );

  assert.strictEqual(
    JSON.stringify(resolved),
    JSON.stringify({
      ...expected,
      objectIdAuthorityGranted: false
    }),
    `resolved authority mismatch: ${key}`
  );

  const upperResolved =
    authority.resolve(key.toUpperCase());

  assert.ok(
    upperResolved,
    `case-normalized durable key failed: ${key}`
  );

  const objectId =
    String(candidate.evidenceObjectId);

  assert.strictEqual(
    authority.resolve(objectId),
    null,
    `ObjectID improperly granted authority: ${objectId}`
  );

  const legacyKey =
    String(
      candidate.evidenceLegacyObjectIdObservationKey
    );

  assert.strictEqual(
    authority.resolve(legacyKey),
    null,
    `legacy ObjectID key improperly granted authority: ${legacyKey}`
  );
}

assert.strictEqual(
  authority.resolve(
    'pa-philadelphia|code_violations|vi-does-not-exist'
  ),
  null
);

console.log(
  'PASS: Gate 1 recovery authority catalog matches all 139 certified candidates.'
);

console.log(
  'PASS: durable Violation Number identity is the only resolution authority.'
);

console.log(
  'PASS: ArcGIS ObjectID and legacy ObjectID keys grant no recovery authority.'
);

console.log(
  'catalog_sha256=' + computedCatalogSha
);
