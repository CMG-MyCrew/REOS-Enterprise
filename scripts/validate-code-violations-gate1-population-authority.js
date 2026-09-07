#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

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

const EXPECTED_SOURCE_SHA =
  '5958a94f9fa2b571b32cb4dd9dc43476b8877a59f37ebdd4c697faf033b445b3';

const manifestBytes =
  fs.readFileSync(MANIFEST);

const manifest =
  JSON.parse(
    manifestBytes.toString('utf8')
  );

const manifestSha =
  crypto
    .createHash('sha256')
    .update(manifestBytes)
    .digest('hex');

assert.equal(
  manifest.schema,
  'code-violations-gate1-certified-population-authority-v1'
);

assert.equal(
  manifest.connectorId,
  'PA-PHILADELPHIA'
);

assert.equal(
  manifest.dataset,
  'code_violations'
);

assert.equal(
  manifest.sourceEvidenceSha256,
  EXPECTED_SOURCE_SHA
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
  manifest.membershipAuthority.durableField,
  'Violation Number'
);

assert.equal(
  manifest.membershipAuthority.arcGisObjectIdIsMembershipAuthority,
  false
);

assert.equal(
  manifest.records.length,
  168
);

const keys =
  manifest.records.map(
    record =>
      record.violationNumber
  );

assert.equal(
  new Set(keys).size,
  168,
  'certified durable population must contain 168 unique Violation Numbers'
);

[
  'VI-2026-041091',
  'VI-2026-041092',
  'VI-2026-041093',
  'VI-2026-041094'
].forEach(value => {
  assert.equal(
    keys.includes(value),
    false,
    value +
      ' must remain outside the original certified 168-row Gate-1 cohort'
  );
});

const source =
  fs.readFileSync(
    CATALOG,
    'utf8'
  );

const sandbox = {
  REOS: {},
  String,
  Array,
  Object
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

const metadata =
  authority.metadata();

assert.equal(
  metadata.populationCount,
  168
);

assert.equal(
  metadata.openActionableCount,
  153
);

assert.equal(
  metadata.nonOpenCount,
  15
);

assert.equal(
  metadata.objectIdIsMembershipAuthority,
  false
);

assert.equal(
  metadata.manifestSha256,
  manifestSha
);

assert.equal(
  metadata.sourceEvidenceSha256,
  EXPECTED_SOURCE_SHA
);

const catalogKeys =
  Array.from(
    authority.violationNumbers()
  );

assert.deepEqual(
  catalogKeys,
  keys
);

keys.forEach(value => {
  assert.equal(
    authority.contains(value),
    true
  );
});

[
  'VI-2026-041091',
  'VI-2026-041092',
  'VI-2026-041093',
  'VI-2026-041094',
  '',
  '636642'
].forEach(value => {
  assert.equal(
    authority.contains(value),
    false
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
  'PASS: Gate 1 certified population authority contains exactly 168 durable Violation Numbers.'
);

console.log(
  'PASS: four newly ObjectID-windowed already-safe violations are excluded.'
);

console.log(
  'PASS: ArcGIS ObjectID is explicitly not population membership authority.'
);

console.log(
  'Gate 1 certified population authority validation PASSED.'
);
