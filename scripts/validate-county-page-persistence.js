#!/usr/bin/env node

'use strict';

const fs = require('fs');
const assert = require('assert');

console.log(
  '=== COUNTY PAGE PERSISTENCE CERTIFICATION ==='
);

const path =
  'build/apps-script-brand/CountyConnectorSDK.js';

const source = fs.readFileSync(path, 'utf8');

/*
 * Performance contract:
 *
 * Live county page persistence must not perform a complete
 * DISTRESS_LEADS read independently for every normalized record.
 *
 * The page must establish one page-scoped persistence context/index
 * and reuse it for all records processed by that page.
 */

const hasPagePersistenceContext =
  /pagePersistence|persistenceContext|persistenceIndex|leadIndex/i
    .test(source);

assert(
  hasPagePersistenceContext,
  'live county page establishes a page-scoped persistence context'
);

const runSection = source.slice(
  source.indexOf('function run('),
  source.indexOf('function persist_(')
);

assert(
  /persist_\([^)]*,\s*context\s*,/m.test(runSection),
  'page persistence context is passed into record persistence'
);

const findStart = source.indexOf(
  'function findExisting_('
);

const findEnd = source.indexOf(
  'function normalizeLead_(',
  findStart
);

const findSection = source.slice(
  findStart,
  findEnd
);

assert(
  !/REOS\.Database\.getAll\(TARGET_SHEET\)/.test(
    findSection
  ),
  'record-level matching does not reload DISTRESS_LEADS'
);

console.log(
  'PASS: county persistence uses page-scoped lookup authority'
);

console.log();
console.log(
  'County page persistence certification PASSED.'
);

/*
 * Behavioral certification.
 *
 * Execute the real CountyConnectorSDK in an isolated VM and verify
 * that DISTRESS_LEADS lookup authority is page-scoped.
 */

const vm = require('vm');

function createHarness(initialLeads) {
  const leads = (initialLeads || []).map(function (row, index) {
    return Object.assign(
      { _rowNumber: index + 2 },
      row
    );
  });

  const auditRows = [];
  const calls = {
    leadGetAll: 0,
    leadInsert: 0,
    leadUpdate: 0,
    auditInsert: 0,
    auditUpdate: 0
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
        return auditRows.map(function (row) {
          return Object.assign({}, row);
        });
      }

      return [];
    },

    insert: function (sheetName, record, options) {
      const inserted = Object.assign({}, record);

      if (sheetName === 'DISTRESS_LEADS') {
        calls.leadInsert += 1;

        if (
          options &&
          options.idField &&
          !inserted[options.idField]
        ) {
          idSequence += 1;
          inserted[options.idField] =
            (options.idPrefix || 'ID') + '-' + idSequence;
        }

        inserted._rowNumber = leads.length + 2;
        leads.push(inserted);

        return Object.assign({}, inserted);
      }

      if (sheetName === 'COUNTY_CONNECTOR_RUNS') {
        calls.auditInsert += 1;
        auditRows.push(inserted);
        return Object.assign({}, inserted);
      }

      throw new Error(
        'Unexpected insert sheet: ' + sheetName
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

        const index = leads.findIndex(function (row) {
          return String(row[idField] || '') ===
            String(idValue || '');
        });

        assert.notStrictEqual(
          index,
          -1,
          'behavioral harness can resolve lead update target'
        );

        leads[index] = Object.assign(
          {},
          leads[index],
          changes
        );

        return Object.assign({}, leads[index]);
      }

      if (sheetName === 'COUNTY_CONNECTOR_RUNS') {
        calls.auditUpdate += 1;

        const index = auditRows.findIndex(function (row) {
          return String(row[idField] || '') ===
            String(idValue || '');
        });

        if (index !== -1) {
          auditRows[index] = Object.assign(
            {},
            auditRows[index],
            changes
          );

          return Object.assign({}, auditRows[index]);
        }

        return Object.assign({}, changes);
      }

      throw new Error(
        'Unexpected update sheet: ' + sheetName
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

    Session: {
      getActiveUser: function () {
        return {
          getEmail: function () {
            return 'certification@example.invalid';
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
        return prefix + '-TEST-' + idSequence;
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);

  return {
    sdk: sandbox.REOS.CountyConnectorSDK,
    calls: calls,
    leads: leads,
    auditRows: auditRows
  };
}

function makeConnector(records, nextCursor) {
  return {
    id: 'TEST-COUNTY',
    county: 'Test County',
    state: 'PA',
    datasets: ['tax_delinquent'],
    enabled: true,

    fetch: function () {
      return {
        records: records,
        nextCursor: nextCursor,
        message: 'behavioral certification'
      };
    },

    normalize: function (record) {
      return Object.assign({}, record);
    }
  };
}

function makeLead(sourceId, address) {
  return {
    Address: address || '100 Test Street',
    City: 'Philadelphia',
    State: 'PA',
    Zip: '19103',
    'Source Record ID': sourceId,
    'Parcel ID': '',
    Source: 'TEST-COUNTY',
    'Source Dataset': 'tax_delinquent'
  };
}

/*
 * Unique live records.
 */
{
  const harness = createHarness([]);

  harness.sdk.register(
    makeConnector(
      [
        makeLead('A-1', '100 Test Street'),
        makeLead('A-2', '200 Test Street')
      ],
      '50'
    )
  );

  const result = harness.sdk.run(
    'TEST-COUNTY',
    {
      dataset: 'tax_delinquent',
      dryRun: false,
      limit: 50
    }
  );

  assert.strictEqual(
    harness.calls.leadGetAll,
    1,
    'live page reads DISTRESS_LEADS exactly once'
  );

  assert.strictEqual(result.stats.inserted, 2);
  assert.strictEqual(result.stats.updated, 0);
  assert.strictEqual(harness.calls.leadInsert, 2);
  assert.strictEqual(result.nextCursor, '50');

  console.log(
    'PASS: live page performs one lead-table read for unique records'
  );
}

/*
 * Same-page duplicate must see the record inserted earlier
 * in the same page through the page persistence cache.
 */
{
  const harness = createHarness([]);

  harness.sdk.register(
    makeConnector(
      [
        makeLead('DUP-1', '300 Test Street'),
        makeLead('DUP-1', '300 Test Street'),
        makeLead('DUP-1', '300 Test Street')
      ],
      ''
    )
  );

  const result = harness.sdk.run(
    'TEST-COUNTY',
    {
      dataset: 'tax_delinquent',
      dryRun: false
    }
  );

  assert.strictEqual(harness.calls.leadGetAll, 1);
  assert.strictEqual(result.stats.inserted, 1);
  assert.strictEqual(result.stats.updated, 2);
  assert.strictEqual(harness.calls.leadInsert, 1);
  assert.strictEqual(harness.calls.leadUpdate, 2);
  assert.strictEqual(result.nextCursor, '');

  console.log(
    'PASS: same-page duplicates reuse and refresh page cache'
  );
}

/*
 * Pre-existing natural-key match must update.
 */
{
  const existing = Object.assign(
    makeLead('EXISTING-1', '400 Test Street'),
    {
      'Distress Lead ID': 'DL-EXISTING',
      'Source Record Key':
        'test-county|tax_delinquent|existing-1'
    }
  );

  const harness = createHarness([existing]);

  harness.sdk.register(
    makeConnector(
      [makeLead('EXISTING-1', '400 Test Street')],
      ''
    )
  );

  const result = harness.sdk.run(
    'TEST-COUNTY',
    {
      dataset: 'tax_delinquent',
      dryRun: false
    }
  );

  assert.strictEqual(harness.calls.leadGetAll, 1);
  assert.strictEqual(result.stats.inserted, 0);
  assert.strictEqual(result.stats.updated, 1);
  assert.strictEqual(harness.calls.leadInsert, 0);
  assert.strictEqual(harness.calls.leadUpdate, 1);

  console.log(
    'PASS: pre-existing natural-key match updates without reread'
  );
}

/*
 * Dry run must not establish persistence authority.
 */
{
  const harness = createHarness([]);

  harness.sdk.register(
    makeConnector(
      [makeLead('DRY-1', '500 Test Street')],
      '50'
    )
  );

  const result = harness.sdk.run(
    'TEST-COUNTY',
    {
      dataset: 'tax_delinquent',
      dryRun: true,
      limit: 50
    }
  );

  assert.strictEqual(harness.calls.leadGetAll, 0);
  assert.strictEqual(harness.calls.leadInsert, 0);
  assert.strictEqual(harness.calls.leadUpdate, 0);
  assert.strictEqual(result.stats.skipped, 1);
  assert.strictEqual(result.nextCursor, '50');

  console.log(
    'PASS: dry run performs zero DISTRESS_LEADS persistence operations'
  );
}

/*
 * Audit activity is independent of lead persistence counts.
 */
{
  const harness = createHarness([]);

  harness.sdk.register(
    makeConnector(
      [makeLead('AUDIT-1', '600 Test Street')],
      ''
    )
  );

  harness.sdk.run(
    'TEST-COUNTY',
    {
      dataset: 'tax_delinquent',
      dryRun: false
    }
  );

  assert.strictEqual(harness.calls.auditInsert, 1);
  assert.strictEqual(harness.calls.auditUpdate, 1);
  assert.strictEqual(harness.calls.leadInsert, 1);

  console.log(
    'PASS: audit persistence remains separate from lead persistence'
  );
}

console.log('');
console.log(
  'County page persistence behavioral certification PASSED.'
);
