#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log(
  '=== CANONICAL PROPERTY / SOURCE OBSERVATION IDENTITY CONTRACT ==='
);

const sdkPath =
  'build/apps-script-brand/CountyConnectorSDK.js';

const schemaPath =
  'build/apps-script-brand/DistressLeadCountySchema.js';

const identityPath =
  'build/apps-script-brand/CanonicalPropertyIdentity.js';

const sdkSource =
  fs.readFileSync(sdkPath, 'utf8');

const schemaSource =
  fs.readFileSync(schemaPath, 'utf8');

/*
 * Target schema contract.
 *
 * DISTRESS_LEADS remains an observation table.
 * It must carry:
 *
 * - Source Observation Key:
 *     immutable source/dataset/source-record identity
 *
 * - Canonical Property Key:
 *     source-independent deterministic property identity
 *
 * This permits multiple distress/source observations to link to
 * one property identity without overwriting each other.
 */
assert(
  /['"]Source Observation Key['"]/.test(schemaSource),
  'DISTRESS_LEADS schema must include Source Observation Key'
);

assert(
  /['"]Canonical Property Key['"]/.test(schemaSource),
  'DISTRESS_LEADS schema must include Canonical Property Key'
);

assert(
  fs.existsSync(identityPath),
  'CanonicalPropertyIdentity.js must exist'
);

const identitySource =
  fs.readFileSync(identityPath, 'utf8');

/*
 * County persistence must use observation identity for upsert.
 *
 * Address equality by itself must not select an existing source
 * observation row for update.
 */
const findStart =
  sdkSource.indexOf('function findExisting_(');

const normalizeStart =
  sdkSource.indexOf(
    'function normalizeLead_(',
    findStart
  );

assert(
  findStart !== -1 && normalizeStart !== -1,
  'CountyConnectorSDK findExisting_ section must exist'
);

const findSection =
  sdkSource.slice(findStart, normalizeStart);

assert(
  !(
    /row\.Address/.test(findSection) &&
    /record\.Address/.test(findSection) &&
    /row\.City/.test(findSection)
  ),
  'address equality must not authorize source-observation overwrite'
);

function createHarness(initialLeads) {
  const leads = (initialLeads || []).map(
    function (row, index) {
      return Object.assign(
        { _rowNumber: index + 2 },
        row
      );
    }
  );

  const audits = [];

  const calls = {
    leadGetAll: 0,
    leadInsert: 0,
    leadUpdate: 0
  };

  let idSequence = 0;

  const database = {
    ensureTable: function () {},

    getAll: function (sheetName) {
      if (sheetName === 'DISTRESS_LEADS') {
        calls.leadGetAll += 1;

        return leads.map(function (row) {
          return Object.assign({}, row);
        });
      }

      if (sheetName === 'COUNTY_CONNECTOR_RUNS') {
        return audits.map(function (row) {
          return Object.assign({}, row);
        });
      }

      return [];
    },

    insert: function (sheetName, record, options) {
      const inserted =
        Object.assign({}, record);

      if (sheetName === 'DISTRESS_LEADS') {
        calls.leadInsert += 1;

        if (
          options &&
          options.idField &&
          !inserted[options.idField]
        ) {
          idSequence += 1;

          inserted[options.idField] =
            (options.idPrefix || 'ID') +
            '-' +
            idSequence;
        }

        inserted._rowNumber =
          leads.length + 2;

        leads.push(inserted);

        return Object.assign({}, inserted);
      }

      if (sheetName === 'COUNTY_CONNECTOR_RUNS') {
        audits.push(inserted);
        return Object.assign({}, inserted);
      }

      throw new Error(
        'Unexpected insert: ' + sheetName
      );
    },

    update: function (
      sheetName,
      idField,
      idValue,
      changes
    ) {
      if (sheetName === 'DISTRESS_LEADS') {
        calls.leadUpdate += 1;

        const index =
          leads.findIndex(function (row) {
            return (
              String(row[idField] || '') ===
              String(idValue || '')
            );
          });

        assert.notStrictEqual(
          index,
          -1,
          'lead update target exists'
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

      if (sheetName === 'COUNTY_CONNECTOR_RUNS') {
        const index =
          audits.findIndex(function (row) {
            return (
              String(row[idField] || '') ===
              String(idValue || '')
            );
          });

        if (index !== -1) {
          audits[index] =
            Object.assign(
              {},
              audits[index],
              changes
            );

          return Object.assign(
            {},
            audits[index]
          );
        }

        return Object.assign({}, changes);
      }

      throw new Error(
        'Unexpected update: ' + sheetName
      );
    }
  };

  const sandbox = {
    console: console,
    Date: Date,
    Object: Object,
    Array: Array,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Math: Math,
    JSON: JSON,
    RegExp: RegExp,
    Error: Error,
    isNaN: isNaN,
    isFinite: isFinite,

    Session: {
      getActiveUser: function () {
        return {
          getEmail: function () {
            return 'identity-cert@example.invalid';
          }
        };
      }
    },

    REOS: {
      Database: database,

      Logger: {
        info: function () {},
        error: function () {}
      },

      generateId_: function (prefix) {
        idSequence += 1;

        return (
          prefix +
          '-IDENTITY-' +
          idSequence
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
    sdk: sandbox.REOS.CountyConnectorSDK,
    identity:
      sandbox.REOS.CanonicalPropertyIdentity,
    leads: leads,
    calls: calls
  };
}

function makeConnector(
  dataset,
  records
) {
  return {
    id: 'PA-PHILADELPHIA',
    county: 'Philadelphia',
    state: 'PA',
    datasets: [dataset],
    enabled: true,

    fetch: function () {
      return {
        records: records,
        nextCursor: '',
        message: 'identity contract'
      };
    },

    normalize: function (record) {
      return Object.assign(
        {},
        record,
        {
          Source: 'PA-PHILADELPHIA',
          'Source Dataset': dataset
        }
      );
    }
  };
}

function observation(
  sourceRecordId,
  parcel,
  dataset,
  overrides
) {
  return Object.assign(
    {
      Address: '1234 Market Street',
      City: 'Philadelphia',
      State: 'PA',
      Zip: '19107',
      County: 'Philadelphia',
      'Parcel ID': parcel || '',
      'Source Record ID':
        sourceRecordId,
      Source: 'PA-PHILADELPHIA',
      'Source Dataset': dataset
    },
    overrides || {}
  );
}

/*
 * Pure identity resolver contract.
 */
{
  const harness =
    createHarness([]);

  const identity =
    harness.identity;

  assert(
    identity &&
    typeof identity.resolve === 'function',
    'CanonicalPropertyIdentity.resolve must exist'
  );

  const a =
    identity.resolve(
      observation(
        'VIOL-100',
        '881234500',
        'code_violations'
      )
    );

  const b =
    identity.resolve(
      observation(
        'VAC-900',
        '881234500',
        'vacant_properties'
      )
    );

  assert.strictEqual(
    a.canonicalPropertyKey,
    b.canonicalPropertyKey,
    'same jurisdiction + parcel must resolve to same canonical property'
  );

  assert.notStrictEqual(
    a.sourceObservationKey,
    b.sourceObservationKey,
    'different source observations must retain distinct identities'
  );

  assert.strictEqual(
    a.authority,
    'parcel',
    'parcel must be preferred canonical authority'
  );

  console.log(
    'PASS: same parcel resolves cross-source to one canonical property'
  );
}

/*
 * Exact observation replay is idempotent.
 */
{
  const row =
    observation(
      'VIOL-200',
      '881234501',
      'code_violations'
    );

  const harness =
    createHarness([]);

  harness.sdk.register(
    makeConnector(
      'code_violations',
      [row, row, row]
    )
  );

  const result =
    harness.sdk.run(
      'PA-PHILADELPHIA',
      {
        dataset: 'code_violations',
        dryRun: false
      }
    );

  assert.strictEqual(
    result.stats.inserted,
    1
  );

  assert.strictEqual(
    result.stats.updated,
    2
  );

  assert.strictEqual(
    harness.leads.length,
    1
  );

  console.log(
    'PASS: exact source observation replay is idempotent'
  );
}

/*
 * Critical regression:
 *
 * Different violations at the exact same property must remain
 * separate observations.
 *
 * Current address-fallback persistence incorrectly collapses these.
 */
{
  const harness =
    createHarness([]);

  harness.sdk.register(
    makeConnector(
      'code_violations',
      [
        observation(
          'VIOL-301',
          '881234502',
          'code_violations',
          {
            'Violation Number':
              'V-301'
          }
        ),

        observation(
          'VIOL-302',
          '881234502',
          'code_violations',
          {
            'Violation Number':
              'V-302'
          }
        )
      ]
    )
  );

  const result =
    harness.sdk.run(
      'PA-PHILADELPHIA',
      {
        dataset: 'code_violations',
        dryRun: false
      }
    );

  assert.strictEqual(
    result.stats.inserted,
    2,
    'different source record IDs at same property must insert two observations'
  );

  assert.strictEqual(
    result.stats.updated,
    0,
    'different source observations must not overwrite one another'
  );

  assert.strictEqual(
    harness.leads.length,
    2,
    'both violation observations must survive'
  );

  assert.notStrictEqual(
    harness.leads[0]['Source Observation Key'],
    harness.leads[1]['Source Observation Key'],
    'observations must have distinct observation keys'
  );

  assert.strictEqual(
    harness.leads[0]['Canonical Property Key'],
    harness.leads[1]['Canonical Property Key'],
    'observations at same parcel must link to same canonical property'
  );

  console.log(
    'PASS: multiple violations at one property remain independent observations'
  );
}

/*
 * Cross-dataset identity:
 *
 * Same parcel from code violations and vacant properties must
 * resolve to the same canonical property while retaining
 * separate source-observation identities.
 */
{
  const harness =
    createHarness([]);

  const violation =
    harness.identity.resolve(
      observation(
        'VIOL-401',
        '881234503',
        'code_violations'
      )
    );

  const vacant =
    harness.identity.resolve(
      observation(
        'VAC-401',
        '881234503',
        'vacant_properties'
      )
    );

  assert.strictEqual(
    violation.canonicalPropertyKey,
    vacant.canonicalPropertyKey
  );

  assert.notStrictEqual(
    violation.sourceObservationKey,
    vacant.sourceObservationKey
  );

  console.log(
    'PASS: cross-dataset observations link without identity collapse'
  );
}

/*
 * Exact-address fallback is permitted only when no parcel exists.
 * No fuzzy matching is part of this contract.
 */
{
  const harness =
    createHarness([]);

  const result =
    harness.identity.resolve(
      observation(
        'NO-PARCEL-1',
        '',
        'code_violations',
        {
          Address:
            '  500   South Broad Street  ',
          City:
            ' PHILADELPHIA ',
          State:
            'pa',
          Zip:
            '19146'
        }
      )
    );

  assert.strictEqual(
    result.authority,
    'address'
  );

  assert(
    result.canonicalPropertyKey,
    'address fallback must produce deterministic property identity'
  );

  console.log(
    'PASS: exact normalized address is deterministic fallback authority'
  );
}


/*
 * Adversarial canonical identity contract.
 */

/*
 * Adversarial canonical identity contract.
 *
 * These cases protect against cross-property corruption and
 * over-sensitive parcel formatting.
 */

/*
 * Parcel formatting differences must normalize to one identity.
 */
{
  const harness =
    createHarness([]);

  const a =
    harness.identity.resolve(
      observation(
        'FORMAT-1',
        '88-123-4500',
        'code_violations'
      )
    );

  const b =
    harness.identity.resolve(
      observation(
        'FORMAT-2',
        '881234500',
        'vacant_properties'
      )
    );

  assert.strictEqual(
    a.canonicalPropertyKey,
    b.canonicalPropertyKey,
    'equivalent parcel formatting must resolve to one canonical property'
  );

  assert.strictEqual(
    a.authority,
    'parcel'
  );

  assert.strictEqual(
    b.authority,
    'parcel'
  );

  console.log(
    'PASS: parcel formatting normalization is deterministic'
  );
}

/*
 * Same address does NOT override incompatible parcel authority.
 */
{
  const harness =
    createHarness([]);

  const a =
    harness.identity.resolve(
      observation(
        'PARCEL-A',
        '881234501',
        'code_violations',
        {
          Address:
            '700 Market Street'
        }
      )
    );

  const b =
    harness.identity.resolve(
      observation(
        'PARCEL-B',
        '881234599',
        'vacant_properties',
        {
          Address:
            '700 Market Street'
        }
      )
    );

  assert.notStrictEqual(
    a.canonicalPropertyKey,
    b.canonicalPropertyKey,
    'same address with incompatible parcels must not merge'
  );

  console.log(
    'PASS: incompatible parcel IDs remain separate despite same address'
  );
}

/*
 * Parcel authority is stronger than cosmetic address drift.
 */
{
  const harness =
    createHarness([]);

  const a =
    harness.identity.resolve(
      observation(
        'ADDRESS-1',
        '881234777',
        'code_violations',
        {
          Address:
            '1234 Market Street'
        }
      )
    );

  const b =
    harness.identity.resolve(
      observation(
        'ADDRESS-2',
        '881234777',
        'vacant_properties',
        {
          Address:
            '1234   MARKET STREET'
        }
      )
    );

  assert.strictEqual(
    a.canonicalPropertyKey,
    b.canonicalPropertyKey,
    'same parcel must retain canonical identity despite address presentation drift'
  );

  console.log(
    'PASS: parcel authority survives address presentation drift'
  );
}

/*
 * CRITICAL FAIL-CLOSED CONTRACT:
 *
 * An immutable source observation must never silently move from one
 * canonical property to another.
 *
 * Same Source + Dataset + Source Record ID means the observation is
 * being replayed. If its newly resolved canonical property conflicts
 * with the canonical property already stored for that observation,
 * persistence must reject/quarantine the conflicting replay instead
 * of overwriting Canonical Property Key.
 *
 * Current implementation is expected to FAIL this test until
 * conflict protection is added.
 */
{
  const harness =
    createHarness([]);

  harness.sdk.register(
    makeConnector(
      'code_violations',
      [
        observation(
          'IMMUTABLE-900',
          '881234900',
          'code_violations',
          {
            Address:
              '900 Market Street'
          }
        ),

        observation(
          'IMMUTABLE-900',
          '881234999',
          'code_violations',
          {
            Address:
              '900 Market Street'
          }
        )
      ]
    )
  );

  const expectedIdentity =
    harness.identity.resolve(
      observation(
        'IMMUTABLE-900',
        '881234900',
        'code_violations',
        {
          Address:
            '900 Market Street'
        }
      )
    );

  const result =
    harness.sdk.run(
      'PA-PHILADELPHIA',
      {
        dataset: 'code_violations',
        dryRun: false
      }
    );

  assert.strictEqual(
    result.stats.inserted,
    1,
    'first immutable source observation should insert once'
  );

  assert.strictEqual(
    result.stats.updated,
    0,
    'conflicting canonical-property replay must not update existing observation'
  );

  assert.strictEqual(
    result.stats.failed,
    1,
    'conflicting canonical-property replay must fail closed'
  );

  assert.strictEqual(
    harness.leads.length,
    1,
    'conflicting replay must not create another observation'
  );

  assert.strictEqual(
    harness.leads[0]['Canonical Property Key'],
    expectedIdentity.canonicalPropertyKey,
    'existing observation must retain its original canonical property authority'
  );

  console.log(
    'PASS: immutable source observation cannot silently change canonical property'
  );
}

console.log();
console.log(
  'Canonical property / source observation identity contract PASSED.'
);
