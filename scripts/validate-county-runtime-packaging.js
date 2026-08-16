#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

const REQUIRED_FILES = [
  'CountyConnectorSDK.js',
  'CountyHttpAdapter.js',
  'CountyAdapterRegistry.js',
  'ArcGISAdapter.js',
  'CSVAdapter.js',
  'HTMLTableAdapter.js',
  'JSONAPIAdapter.js',
  'SocrataAdapter.js'
];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function loadSource(fileName) {
  const filePath = path.join(BUILD, fileName);

  assert.ok(
    fs.existsSync(filePath),
    `required county runtime file missing: ${fileName}`
  );

  return fs.readFileSync(filePath, 'utf8');
}

function createDatabase() {
  const tables = new Map();
  const counters = new Map();

  function ensureTable(name) {
    if (!tables.has(name)) {
      tables.set(name, []);
    }

    return name;
  }

  function nextId(prefix) {
    const value = (counters.get(prefix) || 0) + 1;
    counters.set(prefix, value);

    return `${prefix}-${String(value).padStart(4, '0')}`;
  }

  return {
    ensureTable,

    getAll(name) {
      ensureTable(name);

      return tables.get(name).map(row => ({ ...row }));
    },

    insert(name, values, options) {
      ensureTable(name);

      const row = { ...(values || {}) };
      const opts = options || {};

      if (opts.idField && !row[opts.idField]) {
        row[opts.idField] = nextId(opts.idPrefix || 'ROW');
      }

      tables.get(name).push(row);

      return { ...row };
    },

    update(name, idField, id, changes) {
      ensureTable(name);

      const row = tables
        .get(name)
        .find(item => item[idField] === id);

      if (!row) {
        throw new Error(
          `Database row not found: ${name}.${idField}=${id}`
        );
      }

      Object.assign(row, changes || {});

      return { ...row };
    },

    rows(name) {
      ensureTable(name);
      return tables.get(name);
    }
  };
}

console.log('=== COUNTY RUNTIME PACKAGING CERTIFICATION ===');
console.log('');

REQUIRED_FILES.forEach(fileName => {
  loadSource(fileName);
  pass(`${fileName} packaged`);
});

console.log('');

const Database = createDatabase();

let generatedId = 0;

const context = vm.createContext({
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

  Session: {
    getActiveUser() {
      return {
        getEmail() {
          return 'county-runtime-certification@reos.local';
        }
      };
    }
  },

  UrlFetchApp: {
    fetch() {
      throw new Error(
        'Network execution is forbidden during runtime packaging certification.'
      );
    }
  },

  Utilities: {},

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty() {
          return '';
        },
        setProperty() {},
        deleteProperty() {}
      };
    }
  },

  REOS: {
    Database,

    generateId_(prefix) {
      generatedId += 1;

      return `${prefix}-CERT-${String(generatedId).padStart(4, '0')}`;
    }
  }
});

const LOAD_ORDER = [
  'CountyHttpAdapter.js',
  'CountyAdapterRegistry.js',
  'ArcGISAdapter.js',
  'CSVAdapter.js',
  'HTMLTableAdapter.js',
  'JSONAPIAdapter.js',
  'SocrataAdapter.js',
  'CountyConnectorSDK.js'
];

LOAD_ORDER.forEach(fileName => {
  vm.runInContext(
    loadSource(fileName),
    context,
    {
      filename: path.join(BUILD, fileName)
    }
  );
});

assert.ok(
  context.REOS.CountyConnectorSDK,
  'REOS.CountyConnectorSDK failed to load'
);

pass('REOS.CountyConnectorSDK loads');

[
  'register',
  'get',
  'list',
  'ensureInfrastructure',
  'run',
  'runAll',
  'validateLead'
].forEach(method => {
  assert.equal(
    typeof context.REOS.CountyConnectorSDK[method],
    'function',
    `CountyConnectorSDK.${method} must be a function`
  );
});

pass('CountyConnectorSDK public contract is present');

assert.ok(
  context.REOS.CountyAdapters,
  'REOS.CountyAdapters failed to load'
);

assert.ok(
  context.REOS.CountyAdapters.Registry,
  'CountyAdapterRegistry failed to load'
);

pass('CountyAdapterRegistry loads');

const expectedAdapters = [
  ['arcgis', 'ArcGIS'],
  ['csv', 'CSV'],
  ['html-table', 'HTMLTable'],
  ['json-api', 'JSONAPI'],
  ['socrata', 'Socrata']
];

expectedAdapters.forEach(([name, property]) => {
  const adapter = context.REOS.CountyAdapters[property];

  assert.ok(
    adapter,
    `county adapter implementation missing: ${property}`
  );

  assert.equal(
    typeof adapter.fetch,
    'function',
    `${property}.fetch must be a function`
  );

  context.REOS.CountyAdapters.Registry.register(
    name,
    adapter
  );

  pass(`${name} adapter loads and registers`);
});

const registeredAdapterNames =
  context.REOS.CountyAdapters.Registry
    .list()
    .map(item => item.name)
    .sort()
    .join(',');

assert.equal(
  registeredAdapterNames,
  expectedAdapters
    .map(item => item[0])
    .sort()
    .join(','),
  'registered county adapter set mismatch'
);

pass('county adapter registry is deterministic');

console.log('');

const sdk = context.REOS.CountyConnectorSDK;

sdk.register({
  id: 'PA-RUNTIME-CERTIFICATION',
  county: 'Runtime Certification',
  state: 'PA',
  version: '1.0.0',
  enabled: true,
  datasets: ['property_assessment'],

  fetch() {
    return {
      records: [
        {
          Address: '100 Certification Way',
          City: 'Philadelphia',
          State: 'PA',
          Zip: '19106',
          'Parcel ID': 'CERT-001',
          'Source Record ID': 'SOURCE-CERT-001'
        }
      ],
      nextCursor: '',
      message: 'Synthetic runtime packaging record.'
    };
  },

  normalize(record) {
    return record;
  }
});

assert.ok(
  sdk.get('PA-RUNTIME-CERTIFICATION'),
  'synthetic runtime connector failed registration'
);

pass('CountyConnectorSDK connector registration works');

const infrastructure = sdk.ensureInfrastructure();

assert.equal(
  infrastructure.ok,
  true,
  'CountyConnectorSDK infrastructure initialization failed'
);

assert.equal(
  infrastructure.auditSheet,
  'COUNTY_CONNECTOR_RUNS',
  'county audit table contract mismatch'
);

pass('county runtime audit infrastructure initializes');

const result = sdk.run(
  'PA-RUNTIME-CERTIFICATION',
  {
    dataset: 'property_assessment',
    dryRun: true,
    limit: 1
  }
);

assert.equal(result.ok, true);
assert.equal(result.mode, 'DRY_RUN');
assert.equal(result.stats.fetched, 1);
assert.equal(result.stats.valid, 1);
assert.equal(result.stats.inserted, 0);
assert.equal(result.stats.updated, 0);
assert.equal(result.stats.skipped, 1);
assert.equal(result.stats.failed, 0);

pass('CountyConnectorSDK deterministic dry-run executes');

assert.equal(
  Database.rows('DISTRESS_LEADS').length,
  0,
  'runtime packaging certification must never write DISTRESS_LEADS'
);

pass('runtime packaging certification performs no live lead writes');

const auditRows = Database.rows('COUNTY_CONNECTOR_RUNS');

assert.equal(
  auditRows.length,
  1,
  'dry-run must create exactly one county audit row'
);

assert.equal(
  auditRows[0].Status,
  'Completed',
  'county audit row must complete successfully'
);

pass('county runtime persists deterministic audit evidence');

console.log('');
console.log('County runtime packaging contract PASSED.');
