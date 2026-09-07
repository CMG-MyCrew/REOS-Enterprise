#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

const MANIFEST =
  path.join(
    ROOT,
    'certification/evidence/code-violations-production-completion/gate1-population/gate1-certified-population-authority-v1.json'
  );

const CATALOG =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGate1PopulationAuthority.js'
  );

const EXPECTED_MANIFEST_SHA =
  'ebc0936a9fc3b4a5643e8a834ab7c068d2b1d2f15335b2fe9f365fe1e24a6b13';

const EXPECTED_SOURCE_SHA =
  '5958a94f9fa2b571b32cb4dd9dc43476b8877a59f37ebdd4c697faf033b445b3';

const manifestRaw =
  fs.readFileSync(MANIFEST);

const manifestSha =
  crypto
    .createHash('sha256')
    .update(manifestRaw)
    .digest('hex');

assert.equal(
  manifestSha,
  EXPECTED_MANIFEST_SHA
);

const manifest =
  JSON.parse(
    manifestRaw.toString('utf8')
  );

assert.equal(
  manifest.records.length,
  168
);

assert.equal(
  manifest.certifiedPopulation.total,
  168
);

assert.equal(
  manifest.certifiedPopulation.openActionable,
  153
);

assert.equal(
  manifest.certifiedPopulation.nonOpen,
  15
);

assert.equal(
  manifest.sourceEvidenceSha256,
  EXPECTED_SOURCE_SHA
);

const source =
  fs.readFileSync(
    CATALOG,
    'utf8'
  );

const sandbox = {
  REOS: {},
  JSON,
  String,
  Object,
  Array
};

vm.createContext(sandbox);

vm.runInContext(
  source,
  sandbox,
  {
    filename:
      CATALOG
  }
);

const authority =
  sandbox.REOS
    .CountyCodeViolationGate1PopulationAuthority;

assert.ok(authority);
assert.equal(typeof authority.resolve, 'function');
assert.equal(typeof authority.contains, 'function');
assert.equal(typeof authority.violationNumbers, 'function');

const metadata =
  authority.metadata();

assert.equal(metadata.populationCount, 168);
assert.equal(metadata.recordCount, 168);
assert.equal(metadata.openActionableCount, 153);
assert.equal(metadata.nonOpenCount, 15);

assert.equal(
  metadata.durableIdentityField,
  'Violation Number'
);

assert.equal(
  metadata.objectIdIsMembershipAuthority,
  false
);

assert.equal(
  metadata.currentObjectIdIsMembershipAuthority,
  false
);

assert.equal(
  metadata.currentObjectIdIsRecoveryAuthority,
  false
);

assert.equal(
  metadata.certifiedEvidenceObjectIdIsLegacyCompatibilityEvidence,
  true
);

assert.equal(
  metadata.manifestSha256,
  EXPECTED_MANIFEST_SHA
);

assert.equal(
  metadata.sourceEvidenceSha256,
  EXPECTED_SOURCE_SHA
);

const expectedKeys =
  manifest.records.map(
    record =>
      String(record.violationNumber)
        .trim()
        .toUpperCase()
  );

const actualKeys =
  Array.from(
    authority.violationNumbers()
  );

assert.deepEqual(
  actualKeys,
  expectedKeys
);

assert.equal(
  new Set(actualKeys).size,
  168
);

manifest.records.forEach(record => {
  const violation =
    String(record.violationNumber)
      .trim()
      .toUpperCase();

  const resolved =
    authority.resolve(violation);

  assert.ok(
    resolved,
    'authority did not resolve ' + violation
  );

  assert.equal(
    resolved.violationNumber,
    violation
  );

  assert.equal(
    resolved.durableObservationKey,
    record.durableObservationKey
  );

  assert.equal(
    resolved.evidenceObjectId,
    String(record.evidenceObjectId)
  );

  assert.match(
    resolved.evidenceObjectId,
    /^[0-9]+$/
  );

  assert.equal(
    authority.contains(violation),
    true
  );

  /*
   * ObjectID itself must never resolve authority.
   */
  assert.equal(
    authority.resolve(
      resolved.evidenceObjectId
    ),
    null
  );
});

[
  'VI-2026-041091',
  'VI-2026-041092',
  'VI-2026-041093',
  'VI-2026-041094'
].forEach(value => {
  assert.equal(
    authority.contains(value),
    false,
    value +
      ' must remain outside the original 168-row cohort'
  );
});

[
  'mutationAuthorityGranted',
  'insertAuthorityGranted',
  'checkpointAuthorityGranted',
  'schedulerAuthorityGranted',
  'migrationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.equal(
    metadata[field],
    false
  );
});

console.log(
  'PASS: Gate 1 population authority resolves exactly 168 durable Violation Numbers.'
);

console.log(
  'PASS: current ArcGIS ObjectID grants no membership or recovery authority.'
);

console.log(
  'PASS: certified historical ObjectID is retained only as legacy compatibility evidence.'
);

console.log(
  'PASS: four newly ObjectID-windowed already-safe violations remain excluded.'
);

console.log(
  'Gate 1 certified population authority validation PASSED.'
);
