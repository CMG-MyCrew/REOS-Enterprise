#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

const EXPECTED_CONNECTOR_COUNT = 94;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function read(fileName) {
  return fs.readFileSync(
    path.join(BUILD, fileName),
    'utf8'
  );
}

console.log(
  '=== GENERATED COUNTY CONNECTOR CERTIFICATION ==='
);
console.log('');

const generatedFiles = fs
  .readdirSync(BUILD)
  .filter(fileName =>
    fileName.endsWith('CountyConnector.js')
  )
  .sort();

assert.equal(
  generatedFiles.length,
  EXPECTED_CONNECTOR_COUNT,
  `expected ${EXPECTED_CONNECTOR_COUNT} generated connector files, ` +
    `found ${generatedFiles.length}`
);

pass('exactly 94 generated county connector files packaged');

const normalizedFileNames = generatedFiles.map(
  fileName => fileName.toLowerCase()
);

assert.equal(
  new Set(normalizedFileNames).size,
  EXPECTED_CONNECTOR_COUNT,
  'generated connector filenames are not case-insensitively unique'
);

pass('generated connector filenames are case-insensitively unique');

const symbols = [];
const manifestIds = [];
const manifestStates = [];

generatedFiles.forEach(fileName => {
  const source = read(fileName);

  const registrarCount = (
    source.match(
      /GeneratedCountyConnectorRegistrars\.push\s*\(/g
    ) || []
  ).length;

  assert.equal(
    registrarCount,
    1,
    `${fileName} must contribute exactly one generated registrar`
  );

  const symbolMatch = source.match(
    /REOS\.([A-Za-z0-9_$]+CountyConnector)\s*=\s*\(function/
  );

  assert.ok(
    symbolMatch,
    `${fileName} does not expose a county connector symbol`
  );

  const symbol = symbolMatch[1];
  const expectedSymbol = fileName.replace(/\.js$/, '');

  assert.equal(
    symbol,
    expectedSymbol,
    `${fileName} symbol does not match filename`
  );

  symbols.push(symbol);

  const manifestBlock = source.match(
    /var\s+MANIFEST\s*=\s*\{([\s\S]*?)\n\s*datasets\s*:/
  );

  assert.ok(
    manifestBlock,
    `${fileName} MANIFEST block not found`
  );

  const idMatch = manifestBlock[1].match(
    /\bid\s*:\s*["']([^"']+)["']/
  );

  const stateMatch = manifestBlock[1].match(
    /\bstate\s*:\s*["']([^"']+)["']/
  );

  assert.ok(
    idMatch,
    `${fileName} MANIFEST.id not found`
  );

  assert.ok(
    stateMatch,
    `${fileName} MANIFEST.state not found`
  );

  const connectorId = idMatch[1];
  const state = stateMatch[1];

  assert.match(
    state,
    /^[A-Z]{2}$/,
    `${fileName} state must be a two-letter uppercase code`
  );

  assert.ok(
    connectorId.startsWith(`${state}-`),
    `${fileName} connector ID is not state-qualified: ${connectorId}`
  );

  assert.ok(
    fileName.startsWith(state),
    `${fileName} filename does not begin with manifest state ${state}`
  );

  manifestIds.push(connectorId);
  manifestStates.push(state);
});

assert.equal(
  new Set(symbols).size,
  EXPECTED_CONNECTOR_COUNT,
  'generated connector symbols are not unique'
);

pass('94 generated connector symbols are unique');

assert.equal(
  new Set(manifestIds).size,
  EXPECTED_CONNECTOR_COUNT,
  'generated connector manifest IDs are not unique'
);

pass('94 generated connector IDs are unique');

pass('all generated IDs and filenames are state-qualified');

const stateCounts = {};

manifestStates.forEach(state => {
  stateCounts[state] = (stateCounts[state] || 0) + 1;
});

console.log('');
console.log(
  'Generated connector state distribution: ' +
  Object.keys(stateCounts)
    .sort()
    .map(state => `${state}=${stateCounts[state]}`)
    .join(', ')
);
console.log('');

let networkCalls = 0;
let databaseCalls = 0;

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
  RegExp,
  isNaN,
  parseInt,
  parseFloat,

  Session: {
    getActiveUser() {
      return {
        getEmail() {
          return 'generated-county-certification@reos.local';
        }
      };
    }
  },

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

  UrlFetchApp: {
    fetch() {
      networkCalls += 1;

      throw new Error(
        'Network access is forbidden during generated connector certification.'
      );
    }
  },

  Utilities: {},

  REOS: {
    Database: {
      ensureTable() {
        databaseCalls += 1;
        fail(
          'Database access is forbidden during generated connector registration.'
        );
      },

      getAll() {
        databaseCalls += 1;
        fail(
          'Database access is forbidden during generated connector registration.'
        );
      },

      insert() {
        databaseCalls += 1;
        fail(
          'Database access is forbidden during generated connector registration.'
        );
      },

      update() {
        databaseCalls += 1;
        fail(
          'Database access is forbidden during generated connector registration.'
        );
      }
    },

    generateId_() {
      fail(
        'ID generation is forbidden during generated connector registration.'
      );
    }
  }
});

vm.runInContext(
  read('CountyConnectorSDK.js'),
  context,
  {
    filename: path.join(
      BUILD,
      'CountyConnectorSDK.js'
    )
  }
);

assert.ok(
  context.REOS.CountyConnectorSDK,
  'CountyConnectorSDK did not load'
);

pass('CountyConnectorSDK loads for generated registration');

let registerCalls = 0;

const sdk = context.REOS.CountyConnectorSDK;
const originalRegister = sdk.register;

sdk.register = function (connector) {
  registerCalls += 1;
  return originalRegister(connector);
};

generatedFiles.forEach(fileName => {
  vm.runInContext(
    read(fileName),
    context,
    {
      filename: path.join(BUILD, fileName)
    }
  );
});

assert.ok(
  Array.isArray(
    context.REOS.GeneratedCountyConnectorRegistrars
  ),
  'generated registrar array was not created'
);

const registrars =
  context.REOS.GeneratedCountyConnectorRegistrars;

assert.equal(
  registrars.length,
  EXPECTED_CONNECTOR_COUNT,
  `expected ${EXPECTED_CONNECTOR_COUNT} generated registrars, ` +
    `found ${registrars.length}`
);

pass('exactly 94 generated registrars load');

assert.equal(
  sdk.list().length,
  0,
  'generated connectors registered before registrar execution'
);

pass('generated connectors do not auto-register at file load');

registrars.forEach((registrar, index) => {
  assert.equal(
    typeof registrar,
    'function',
    `generated registrar ${index} is not a function`
  );

  registrar();
});

assert.equal(
  registerCalls,
  EXPECTED_CONNECTOR_COUNT,
  'first registrar pass did not register exactly 94 connectors'
);

const firstRegistration = sdk.list();

assert.equal(
  firstRegistration.length,
  EXPECTED_CONNECTOR_COUNT,
  `SDK registry expected ${EXPECTED_CONNECTOR_COUNT} connectors ` +
    `after first registrar pass`
);

pass('first registrar pass registers exactly 94 connectors');

const registeredIds = firstRegistration
  .map(item => item.id)
  .sort();

assert.deepEqual(
  registeredIds,
  manifestIds.slice().sort(),
  'runtime SDK registration IDs differ from packaged manifest IDs'
);

pass('runtime registry exactly matches packaged manifest IDs');

firstRegistration.forEach(item => {
  assert.match(
    item.state,
    /^[A-Z]{2}$/,
    `registered connector has invalid state: ${item.id}`
  );

  assert.ok(
    item.id.startsWith(`${item.state}-`),
    `registered connector is not state-qualified: ${item.id}`
  );

  assert.ok(
    Array.isArray(item.datasets) &&
      item.datasets.length > 0,
    `registered connector has no datasets: ${item.id}`
  );
});

pass('all registered connectors expose valid datasets');

assert.ok(
  sdk.get('PA-PHILADELPHIA'),
  'Philadelphia generated connector is not registered'
);

assert.ok(
  context.REOS.PAPhiladelphiaCountyConnector,
  'Philadelphia generated connector symbol is missing'
);

pass('Philadelphia production connector is preserved');

registrars.forEach(registrar => {
  registrar();
});

assert.equal(
  sdk.list().length,
  EXPECTED_CONNECTOR_COUNT,
  'second registrar pass changed SDK connector count'
);

assert.equal(
  registerCalls,
  EXPECTED_CONNECTOR_COUNT,
  'guarded registrars attempted duplicate SDK registration'
);

pass('second registrar pass is idempotent');

assert.equal(
  networkCalls,
  0,
  'generated registration performed network access'
);

pass('generated registration performs zero network calls');

assert.equal(
  databaseCalls,
  0,
  'generated registration performed database access'
);

pass('generated registration performs zero database calls');

console.log('');
console.log(
  'Generated county connector certification PASSED.'
);
