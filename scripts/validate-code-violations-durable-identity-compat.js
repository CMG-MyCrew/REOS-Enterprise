#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log(
  '=== GATE 2A DURABLE IDENTITY COMPATIBILITY VALIDATION ==='
);

const identitySource =
  fs.readFileSync(
    'build/apps-script-brand/CanonicalPropertyIdentity.js',
    'utf8'
  );

const sdkSource =
  fs.readFileSync(
    'build/apps-script-brand/CountyConnectorSDK.js',
    'utf8'
  );

function canonical(parcel) {
  return (
    'property|parcel|pa|philadelphia|' +
    String(parcel)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  );
}

function harness(initialRows) {
  const leads =
    (initialRows || []).map(
      (row, index) =>
        Object.assign(
          { _rowNumber: index + 2 },
          row
        )
    );

  const runs = [];

  let sequence = 0;

  const calls = {
    insert: 0,
    update: 0
  };

  const Database = {
    ensureTable() {},

    getAll(sheet) {
      if (sheet === 'DISTRESS_LEADS') {
        return leads.map(
          row => Object.assign({}, row)
        );
      }

      if (sheet === 'COUNTY_CONNECTOR_RUNS') {
        return runs.map(
          row => Object.assign({}, row)
        );
      }

      return [];
    },

    insert(sheet, record, options) {
      const row =
        Object.assign({}, record);

      if (sheet === 'DISTRESS_LEADS') {
        calls.insert++;

        if (
          options &&
          options.idField &&
          !row[options.idField]
        ) {
          sequence++;
          row[options.idField] =
            (options.idPrefix || 'ID') +
            '-' +
            sequence;
        }

        row._rowNumber =
          leads.length + 2;

        leads.push(row);

        return Object.assign({}, row);
      }

      if (sheet === 'COUNTY_CONNECTOR_RUNS') {
        runs.push(row);
        return Object.assign({}, row);
      }

      throw new Error(
        'Unexpected insert ' + sheet
      );
    },

    update(
      sheet,
      idField,
      idValue,
      changes
    ) {
      if (sheet === 'DISTRESS_LEADS') {
        calls.update++;

        const index =
          leads.findIndex(
            row =>
              String(row[idField] || '') ===
              String(idValue || '')
          );

        assert.notStrictEqual(
          index,
          -1
        );

        leads[index] =
          Object.assign(
            {},
            leads[index],
            changes
          );

        return Object.assign(
          {},
          leads[index]
        );
      }

      if (sheet === 'COUNTY_CONNECTOR_RUNS') {
        const index =
          runs.findIndex(
            row =>
              String(row[idField] || '') ===
              String(idValue || '')
          );

        if (index !== -1) {
          runs[index] =
            Object.assign(
              {},
              runs[index],
              changes
            );

          return Object.assign(
            {},
            runs[index]
          );
        }

        return Object.assign(
          {},
          changes
        );
      }

      throw new Error(
        'Unexpected update ' + sheet
      );
    }
  };

  const sandbox = {
    console,
    Date,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    JSON,
    RegExp,
    Error,
    isNaN,
    isFinite,

    Session: {
      getActiveUser() {
        return {
          getEmail() {
            return 'gate2@example.invalid';
          }
        };
      }
    },

    REOS: {
      Database,

      Logger: {
        info() {},
        error() {}
      },

      generateId_(prefix) {
        sequence++;
        return (
          prefix +
          '-GATE2-' +
          sequence
        );
      }
    }
  };

  vm.createContext(sandbox);

  vm.runInContext(
    identitySource,
    sandbox
  );

  vm.runInContext(
    sdkSource,
    sandbox
  );

  return {
    sdk:
      sandbox.REOS.CountyConnectorSDK,
    leads,
    calls
  };
}

function obs(
  objectId,
  violationNumber,
  parcel
) {
  return {
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
      parcel,

    'Source Record ID':
      objectId,

    'Violation Number':
      violationNumber
  };
}

function connector(
  dataset,
  records
) {
  return {
    id:
      'PA-PHILADELPHIA',

    county:
      'Philadelphia',

    state:
      'PA',

    datasets:
      [dataset],

    enabled:
      true,

    fetch() {
      return {
        records,
        nextCursor: '',
        message:
          'gate2 validator'
      };
    },

    normalize(record) {
      return Object.assign(
        {},
        record
      );
    },

    validate() {
      return {
        ok: true,
        errors: []
      };
    }
  };
}

function run(
  h,
  dataset,
  record
) {
  h.sdk.register(
    connector(
      dataset,
      [record]
    )
  );

  return h.sdk.run(
    'PA-PHILADELPHIA',
    {
      dataset,
      dryRun: false
    }
  );
}

/*
 * Fresh durable observation.
 */
{
  const h = harness([]);

  const r = run(
    h,
    'code_violations',
    obs(
      '101',
      'VIO-100',
      '881234500'
    )
  );

  assert.strictEqual(
    r.stats.inserted,
    1
  );

  assert.strictEqual(
    h.leads[0][
      'Source Observation Key'
    ],
    'pa-philadelphia|code_violations|vio-100'
  );

  assert.strictEqual(
    h.leads[0][
      'Source Record ID'
    ],
    '101'
  );

  console.log(
    'PASS: fresh observation uses Violation Number authority'
  );
}

/*
 * ObjectID drift.
 */
{
  const h = harness([]);

  run(
    h,
    'code_violations',
    obs(
      '101',
      'VIO-101',
      '881234501'
    )
  );

  const r = run(
    h,
    'code_violations',
    obs(
      '999',
      'VIO-101',
      '881234501'
    )
  );

  assert.strictEqual(
    r.stats.updated,
    1
  );

  assert.strictEqual(
    r.stats.inserted,
    0
  );

  assert.strictEqual(
    h.leads.length,
    1
  );

  assert.strictEqual(
    h.leads[0][
      'Source Record ID'
    ],
    '999'
  );

  console.log(
    'PASS: ObjectID drift is idempotent'
  );
}

/*
 * Historical ObjectID-keyed compatibility row.
 */
{
  const key =
    'pa-philadelphia|code_violations|202';

  const parcel =
    '881234502';

  const h = harness([
    {
      'Distress Lead ID':
        'DL-LEGACY',

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

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Parcel ID':
        parcel,

      'Source Record ID':
        '202',

      'Violation Number':
        'VIO-102',

      'Source Record Key':
        key,

      'Source Observation Key':
        key,

      'Canonical Property Key':
        canonical(parcel)
    }
  ]);

  const r = run(
    h,
    'code_violations',
    obs(
      '777',
      'VIO-102',
      parcel
    )
  );

  assert.strictEqual(
    r.stats.updated,
    1
  );

  assert.strictEqual(
    r.stats.inserted,
    0
  );

  assert.strictEqual(
    h.leads[0][
      'Source Observation Key'
    ],
    key
  );

  assert.strictEqual(
    h.leads[0][
      'Source Record Key'
    ],
    key
  );

  console.log(
    'PASS: legacy compatibility match does not migrate identity columns'
  );
}

/*
 * Collapse-required duplicate durable identity.
 */
{
  const parcel =
    '881234503';

  const cp =
    canonical(parcel);

  const h = harness([
    {
      'Distress Lead ID':
        'DL-A',

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

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Parcel ID':
        parcel,

      'Source Record ID':
        '301',

      'Violation Number':
        'VIO-103',

      'Source Record Key':
        'pa-philadelphia|code_violations|301',

      'Source Observation Key':
        'pa-philadelphia|code_violations|301',

      'Canonical Property Key':
        cp
    },
    {
      'Distress Lead ID':
        'DL-B',

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

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Parcel ID':
        parcel,

      'Source Record ID':
        '302',

      'Violation Number':
        'VIO-103',

      'Source Record Key':
        'pa-philadelphia|code_violations|302',

      'Source Observation Key':
        'pa-philadelphia|code_violations|302',

      'Canonical Property Key':
        cp
    }
  ]);

  const r = run(
    h,
    'code_violations',
    obs(
      '999',
      'VIO-103',
      parcel
    )
  );

  assert.strictEqual(
    r.stats.failed,
    1
  );

  assert.strictEqual(
    h.calls.insert,
    0
  );

  assert.strictEqual(
    h.calls.update,
    0
  );

  assert(
    /Duplicate persisted source observation identity/
      .test(
        r.recordErrors[0].message
      )
  );

  console.log(
    'PASS: collapse-required identity fails closed'
  );
}

/*
 * Canonical property conflict.
 */
{
  const parcel =
    '881234504';

  const h = harness([
    {
      'Distress Lead ID':
        'DL-CONFLICT',

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

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Parcel ID':
        parcel,

      'Source Record ID':
        '401',

      'Violation Number':
        'VIO-104',

      'Source Record Key':
        'pa-philadelphia|code_violations|401',

      'Source Observation Key':
        'pa-philadelphia|code_violations|401',

      'Canonical Property Key':
        canonical(parcel)
    }
  ]);

  const r = run(
    h,
    'code_violations',
    obs(
      '999',
      'VIO-104',
      '999999999'
    )
  );

  assert.strictEqual(
    r.stats.failed,
    1
  );

  assert.strictEqual(
    h.calls.update,
    0
  );

  assert(
    /Canonical property identity conflict/
      .test(
        r.recordErrors[0].message
      )
  );

  console.log(
    'PASS: canonical-property conflict fails closed'
  );
}

/*
 * Review-required missing historical canonical identity.
 */
{
  const h = harness([
    {
      'Distress Lead ID':
        'DL-REVIEW',

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

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Parcel ID':
        '881234505',

      'Source Record ID':
        '501',

      'Violation Number':
        'VIO-105',

      'Source Record Key':
        'pa-philadelphia|code_violations|501',

      'Source Observation Key':
        'pa-philadelphia|code_violations|501',

      'Canonical Property Key':
        ''
    }
  ]);

  const r = run(
    h,
    'code_violations',
    obs(
      '999',
      'VIO-105',
      '881234505'
    )
  );

  assert.strictEqual(
    r.stats.failed,
    1
  );

  assert.strictEqual(
    h.calls.update,
    0
  );

  assert(
    /review-required/
      .test(
        r.recordErrors[0].message
      )
  );

  console.log(
    'PASS: review-required historical canonical identity cannot be backfilled'
  );
}

/*
 * Missing Violation Number.
 */
{
  const h = harness([]);

  const r = run(
    h,
    'code_violations',
    obs(
      '601',
      '',
      '881234506'
    )
  );

  assert.strictEqual(
    r.stats.failed,
    1
  );

  assert.strictEqual(
    h.calls.insert,
    0
  );

  assert(
    /requires Violation Number/
      .test(
        r.recordErrors[0].message
      )
  );

  console.log(
    'PASS: missing Violation Number fails closed'
  );
}

/*
 * Non-code-violation dataset behavior remains unchanged.
 */
{
  const h = harness([]);

  run(
    h,
    'vacant_properties',
    obs(
      '701',
      '',
      '881234507'
    )
  );

  const r = run(
    h,
    'vacant_properties',
    obs(
      '702',
      '',
      '881234507'
    )
  );

  assert.strictEqual(
    r.stats.inserted,
    1
  );

  assert.strictEqual(
    h.leads.length,
    2
  );

  console.log(
    'PASS: other county datasets retain Source Record ID identity'
  );
}

console.log();
console.log(
  'Gate 2A durable identity compatibility validation PASSED.'
);
