#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const root =
  'build/apps-script-brand/';

const identitySource =
  fs.readFileSync(
    root +
      'CanonicalPropertyIdentity.js',
    'utf8'
  );

const csvSource =
  fs.readFileSync(
    root +
      'CSVImportEngine.js',
    'utf8'
  );

const dedupSource =
  fs.readFileSync(
    root +
      'LeadDeduplication.js',
    'utf8'
  );

const zillowSource =
  fs.readFileSync(
    root +
      'ZillowGmailConnector.js',
    'utf8'
  );

console.log(
  '=== CROSS-SOURCE OBSERVATION INTEGRITY CONTRACT ==='
);

assert(
  /sourceObservationKey:\s*sourceObservationKey/.test(
    identitySource
  ),
  'sourceObservationKey API missing'
);

assert(
  /tryCanonicalPropertyIdentity/.test(
    identitySource
  ),
  'canonical-property non-destructive API missing'
);


/*
 * CSV must not use property address as observation duplicate
 * authority inside importFile().
 */
const importStart =
  csvSource.indexOf(
    'function importFile('
  );

const importEnd =
  csvSource.indexOf(
    'function importConnector(',
    importStart
  );

assert(
  importStart >= 0 &&
  importEnd > importStart,
  'CSV importFile section unavailable'
);

const importBody =
  csvSource.slice(
    importStart,
    importEnd
  );

assert(
  !/leadKey_\(lead\.address/.test(
    importBody
  ),
  'CSV import still uses address duplicate authority'
);

assert(
  /buildExistingObservationIndex_/.test(
    importBody
  ),
  'CSV import does not index observation identities'
);

assert(
  /'Source Observation Key'/.test(
    importBody
  ),
  'CSV row does not persist Source Observation Key'
);

assert(
  /'Canonical Property Key'/.test(
    importBody
  ),
  'CSV row does not persist Canonical Property Key'
);


/*
 * Generic dedupe must fail closed across observations.
 */
assert(
  /Distinct source observations/.test(
    dedupSource
  ),
  'different observation keys are not protected'
);

assert(
  /Cross-source observations are distinct/.test(
    dedupSource
  ),
  'cross-source legacy rows are not protected'
);


/*
 * Zillow must participate in the same identity contract.
 */
assert(
  /'Source Observation Key':\s*identity\.sourceObservationKey/.test(
    zillowSource
  ),
  'Zillow observation key persistence missing'
);

assert(
  /'Canonical Property Key':\s*identity\.canonicalPropertyKey/.test(
    zillowSource
  ),
  'Zillow canonical property persistence missing'
);


/*
 * Execute the pure identity module to prove two sources can point
 * to one property without becoming one observation.
 */
const sandbox = {
  REOS: {},
  String,
  Object,
  Array,
  Error
};

vm.createContext(sandbox);

vm.runInContext(
  identitySource,
  sandbox
);

const identity =
  sandbox.REOS
    .CanonicalPropertyIdentity;

const county =
  identity.resolve({
    Address:
      '1234 Market Street',

    City:
      'Philadelphia',

    State:
      'PA',

    County:
      'Philadelphia',

    Zip:
      '19107',

    'Parcel ID':
      '88-123-4500',

    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Source Record ID':
      'CV-100'
  });

const csvRecord = {
  Address:
    '1234 Market Street',

  City:
    'Philadelphia',

  State:
    'PA',

  Zip:
    '19107',

  'Parcel ID':
    '881234500',

  Source:
    'csv',

  'Source Dataset':
    'zillow_authorized_import',

  'Source Record ID':
    'FILE:HASH:2'
};

const csvObservation =
  identity.sourceObservationKey(
    csvRecord
  );

const csvProperty =
  identity.canonicalPropertyIdentity(
    csvRecord
  );

assert.notStrictEqual(
  county.sourceObservationKey,
  csvObservation,
  'different source records collapsed into one observation'
);

assert.strictEqual(
  county.canonicalPropertyKey,
  csvProperty.key,
  'same parcel failed canonical-property linkage'
);

console.log(
  'PASS: source observations stay independent'
);

console.log(
  'PASS: same property links across sources'
);

console.log(
  'PASS: CSV address equality has no duplicate authority'
);

console.log(
  'PASS: generic dedupe protects distinct observations'
);

console.log(
  'PASS: Zillow persists observation identity'
);

console.log();
console.log(
  'Cross-source observation integrity contract PASSED.'
);
