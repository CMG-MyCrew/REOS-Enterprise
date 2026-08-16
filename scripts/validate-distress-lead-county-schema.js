#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(
  ROOT,
  'build',
  'apps-script-brand'
);

const SCHEMA_FILE = 'DistressLeadCountySchema.js';
const CSV_FILE = 'CSVImportEngine.js';

function pass(message) {
  console.log(`PASS: ${message}`);
}

function read(fileName) {
  return fs.readFileSync(
    path.join(BUILD, fileName),
    'utf8'
  );
}

function extractCsvLeadHeaders() {
  const source = read(CSV_FILE);

  const match = source.match(
    /var\s+LEAD_HEADERS\s*=\s*\[([\s\S]*?)\];/
  );

  assert.ok(
    match,
    'CSVImportEngine LEAD_HEADERS not found'
  );

  return Array.from(
    match[1].matchAll(/'([^']+)'/g),
    item => item[1]
  );
}

function createHarness(initialHeaders, initialRows) {
  const state = {
    exists: initialHeaders !== null,
    headers:
      initialHeaders === null
        ? []
        : initialHeaders.slice(),
    rows: (initialRows || []).map(row => row.slice()),
    headerWrites: 0,
    ensureCalls: 0,
    autoResizeCalls: 0
  };

  const sheet = {
    getRange(row, column, rowCount, columnCount) {
      assert.equal(
        row,
        1,
        'schema bridge may only write the header row'
      );

      return {
        setValues(values) {
          assert.equal(values.length, rowCount);
          assert.equal(values[0].length, columnCount);

          state.headerWrites += 1;

          values[0].forEach((value, index) => {
            state.headers[column - 1 + index] = value;
          });

          return this;
        },

        setFontWeight() {
          return this;
        },

        setWrap() {
          return this;
        }
      };
    },

    autoResizeColumns() {
      state.autoResizeCalls += 1;
    }
  };

  const Database = {
    ensureTable(name, headers) {
      assert.equal(name, 'DISTRESS_LEADS');

      state.ensureCalls += 1;

      if (!state.exists) {
        state.exists = true;
        state.headers = Array.from(headers);
      }

      return sheet;
    },

    getHeaders(name) {
      assert.equal(name, 'DISTRESS_LEADS');

      if (!state.exists) {
        throw new Error('Sheet not found: DISTRESS_LEADS');
      }

      return state.headers.slice();
    },

    getSheet(name) {
      assert.equal(name, 'DISTRESS_LEADS');

      if (!state.exists) {
        throw new Error('Sheet not found: DISTRESS_LEADS');
      }

      return sheet;
    }
  };

  const context = vm.createContext({
    console,
    REOS: {
      Database
    }
  });

  vm.runInContext(
    read(SCHEMA_FILE),
    context,
    {
      filename: path.join(
        BUILD,
        SCHEMA_FILE
      )
    }
  );

  return {
    state,
    schema: context.REOS.DistressLeadCountySchema
  };
}

console.log(
  '=== DISTRESS LEAD COUNTY SCHEMA CERTIFICATION ==='
);
console.log('');

const schemaSource = read(SCHEMA_FILE);

assert.doesNotMatch(
  schemaSource,
  /REOS\.Database\.ensureTable\s*=/,
  'schema bridge must not replace Database.ensureTable'
);

pass('schema bridge does not modify Database.ensureTable');

const baseHarness = createHarness([], []);
const schema = baseHarness.schema;

assert.ok(
  schema,
  'REOS.DistressLeadCountySchema failed to load'
);

[
  'tableName',
  'baseHeaders',
  'countyHeaders',
  'requiredHeaders',
  'inspect',
  'ensure'
].forEach(method => {
  assert.equal(
    typeof schema[method],
    'function',
    `schema.${method} must be a function`
  );
});

pass('county schema public contract loads');

const baseHeaders = schema.baseHeaders();
const countyHeaders = schema.countyHeaders();
const requiredHeaders = schema.requiredHeaders();
const csvHeaders = extractCsvLeadHeaders();

assert.equal(
  baseHeaders.length,
  18,
  'Enterprise base DISTRESS_LEADS schema must remain 18 columns'
);

assert.deepEqual(
  Array.from(baseHeaders),
  csvHeaders,
  'schema bridge base headers drift from CSVImportEngine'
);

pass('legacy 18-column CSVImportEngine schema is preserved exactly');

assert.equal(
  countyHeaders.length,
  32,
  'county schema must add exactly 32 fields'
);

assert.equal(
  requiredHeaders.length,
  50,
  'combined DISTRESS_LEADS schema must contain 50 fields'
);

assert.equal(
  new Set(requiredHeaders).size,
  requiredHeaders.length,
  'combined schema contains duplicate headers'
);

pass('32 additive county fields produce a unique 50-column schema');

console.log('');

const legacyData = [
  [
    'DLEAD-001',
    '100 Market St',
    'Philadelphia',
    'PA',
    '19106'
  ]
];

const legacy = createHarness(
  csvHeaders,
  legacyData
);

const beforeHeaders = legacy.state.headers.slice();
const beforeRows = JSON.stringify(legacy.state.rows);

const first = legacy.schema.ensure();

assert.equal(first.ok, true);
assert.equal(first.addedCount, 32);

assert.deepEqual(
  legacy.state.headers.slice(0, 18),
  beforeHeaders,
  'legacy header order changed during county migration'
);

assert.deepEqual(
  legacy.state.headers.slice(18),
  Array.from(countyHeaders),
  'county headers were not appended in canonical order'
);

assert.equal(
  JSON.stringify(legacy.state.rows),
  beforeRows,
  'existing DISTRESS_LEADS data changed during schema migration'
);

assert.equal(
  legacy.state.headerWrites,
  1,
  'legacy migration should perform one additive header write'
);

pass('legacy table receives exactly 32 appended county fields');
pass('legacy header order and existing row data remain unchanged');

const firstHeaders = legacy.state.headers.slice();
const writesAfterFirst = legacy.state.headerWrites;

const second = legacy.schema.ensure();

assert.equal(second.addedCount, 0);

assert.deepEqual(
  legacy.state.headers,
  firstHeaders,
  'second migration changed the schema'
);

assert.equal(
  legacy.state.headerWrites,
  writesAfterFirst,
  'second migration performed an unnecessary write'
);

pass('county schema migration is idempotent');

console.log('');

const missing = createHarness(
  null,
  []
);

const created = missing.schema.ensure();

assert.equal(created.ok, true);
assert.equal(created.addedCount, 0);

assert.deepEqual(
  missing.state.headers,
  Array.from(requiredHeaders),
  'new DISTRESS_LEADS table was not created with complete schema'
);

assert.equal(
  missing.state.headerWrites,
  0,
  'new table should be initialized by Database.ensureTable only'
);

pass('missing table initializes directly with complete 50-column schema');

console.log('');

const partialHeaders = csvHeaders.concat([
  'County',
  'Source'
]);

const partial = createHarness(
  partialHeaders,
  []
);

const partialResult = partial.schema.ensure();

assert.equal(
  partialResult.addedCount,
  30,
  'partial migration should add only missing county fields'
);

assert.equal(
  partial.state.headers.length,
  50
);

pass('partial county schema migration adds only missing fields');

console.log('');

const conflict = createHarness(
  csvHeaders.concat(['county']),
  []
);

assert.throws(
  () => conflict.schema.ensure(),
  /header casing conflicts/,
  'case-conflicting county header must be rejected'
);

pass('case-conflicting county headers are rejected');

console.log('');

const REQUIRED_RUNTIME_FIELDS = [
  'County',
  'Source',
  'Source Dataset',
  'Connector Run ID',
  'Parcel ID',
  'Source Record ID',
  'Source Record Key',
  'Last Seen At',
  'Source Updated At',
  'Co-Owner Name',
  'Estimated Debt',
  'Assessment Value',
  'Year Built',
  'Land Acres',
  'Living Area',
  'Last Sale Date',
  'Last Sale Price',
  'Tax Delinquent Amount',
  'Tax Principal',
  'Tax Interest',
  'Tax Penalty',
  'Violation Amount',
  'Violation Number',
  'Violation Type',
  'Violation Status',
  'Vacancy Status',
  'Vacancy Rank',
  'Sheriff Auction ID',
  'Book/Writ',
  'Sale Type',
  'Sale Status',
  'Sale Date'
];

REQUIRED_RUNTIME_FIELDS.forEach(header => {
  assert.ok(
    requiredHeaders.includes(header),
    `county runtime field missing from schema: ${header}`
  );
});

pass('all county runtime persistence fields are represented');

const generatedFiles = fs
  .readdirSync(BUILD)
  .filter(name =>
    name.endsWith('CountyConnector.js')
  )
  .sort();

assert.equal(
  generatedFiles.length,
  94,
  'expected 94 generated connector files'
);

/*
 * Dynamically load all generated connectors with a registration-only SDK.
 * No fetch or database APIs are supplied.
 */
const registrations = new Map();

const generatedContext = vm.createContext({
  console,
  Date,
  JSON,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Error,
  RegExp,
  isNaN,
  parseInt,
  parseFloat,

  REOS: {
    CountyConnectorSDK: {
      get(id) {
        return registrations.get(id) || null;
      },

      register(connector) {
        registrations.set(
          connector.id,
          connector
        );

        return connector.id;
      },

      validateLead() {
        return {
          ok: true,
          errors: []
        };
      }
    }
  }
});

generatedFiles.forEach(fileName => {
  vm.runInContext(
    read(fileName),
    generatedContext,
    {
      filename: path.join(
        BUILD,
        fileName
      )
    }
  );
});

const registrars =
  generatedContext.REOS.GeneratedCountyConnectorRegistrars;

assert.equal(
  registrars.length,
  94,
  'expected 94 generated registrars'
);

registrars.forEach(registrar => registrar());

assert.equal(
  registrations.size,
  94,
  'expected 94 registered generated connectors'
);

const generatedFields = new Set();

Object.keys(generatedContext.REOS)
  .filter(key => {
    const value = generatedContext.REOS[key];

    return (
      /CountyConnector$/.test(key) &&
      value &&
      value.manifest
    );
  })
  .forEach(symbol => {
    const exported =
      generatedContext.REOS[symbol];

    const manifest = exported.manifest;
    const connector =
      registrations.get(manifest.id);

    assert.ok(
      connector,
      `registered connector missing: ${manifest.id}`
    );

    Object.keys(manifest.datasets)
      .forEach(dataset => {
        const definition =
          manifest.datasets[dataset] || {};

        /*
         * Disabled datasets are intentionally non-executable.
         * They must not be normalized by the certification harness.
         */
        if (definition.enabled === false) {
          return;
        }

        const mapping =
          definition.mapping || {};

        const raw = {};

        Object.keys(mapping)
          .forEach(mappingName => {
            const aliases =
              mapping[mappingName] || [];

            aliases.forEach(alias => {
              raw[alias] =
                /amount|value|price|area|acres|rank|year/i
                  .test(mappingName)
                  ? '100'
                  : /date|updated/i.test(mappingName)
                    ? '2026-08-16'
                    : mappingName === 'zip'
                      ? '19106'
                      : 'CERTIFICATION';
            });
          });

        const filter =
          definition.recordFilter || {};

        (filter.requireAny || [])
          .forEach(group => {
            (group || []).forEach(key => {
              raw[key] = raw[key] || 'CERTIFICATION';
            });
          });

        const normalized =
          connector.normalize(
            raw,
            {
              dataset,
              connectorId: manifest.id,
              dryRun: true,
              config: {}
            }
          );

        assert.ok(
          normalized &&
          normalized.__skip !== true,
          `${manifest.id}/${dataset} unexpectedly skipped synthetic normalization`
        );

        Object.keys(normalized)
          .forEach(field => {
            if (!/^__/.test(field)) {
              generatedFields.add(field);
            }
          });
      });
  });

const uncoveredGeneratedFields =
  Array.from(generatedFields)
    .filter(field =>
      !requiredHeaders.includes(field)
    )
    .sort();

assert.deepEqual(
  uncoveredGeneratedFields,
  [],
  'generated connectors emit fields not represented by DISTRESS_LEADS schema'
);

pass(
  'all normalized fields emitted by 94 generated connectors are schema-covered'
);

console.log('');
console.log(
  'generated_normalized_field_count=' +
  generatedFields.size
);

console.log(
  'required_schema_field_count=' +
  requiredHeaders.length
);

console.log('');
console.log(
  'DISTRESS_LEADS county schema certification PASSED.'
);
