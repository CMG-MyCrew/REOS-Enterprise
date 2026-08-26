#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

const RUNTIME_FILES = [
  'CountyHttpAdapter.js',
  'CountyAdapterRegistry.js',
  'ArcGISAdapter.js',
  'CSVAdapter.js',
  'HTMLTableAdapter.js',
  'JSONAPIAdapter.js',
  'SocrataAdapter.js',
  'CanonicalPropertyIdentity.js',
  'CountyConnectorSDK.js',
  'DistressLeadCountySchema.js'
];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function read(fileName) {
  const filePath = path.join(BUILD, fileName);

  assert.ok(
    fs.existsSync(filePath),
    `required file missing: ${fileName}`
  );

  return fs.readFileSync(filePath, 'utf8');
}

function extractLegacyLeadHeaders() {
  const source = read('CSVImportEngine.js');

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

function createDatabase(legacyHeaders) {
  const tables = new Map();
  const events = [];
  const counters = new Map();

  tables.set('DISTRESS_LEADS', {
    headers: legacyHeaders.slice(),
    rows: []
  });

  function getTable(name) {
    const table = tables.get(name);

    if (!table) {
      throw new Error(
        `Sheet not found: ${name}`
      );
    }

    return table;
  }

  function nextId(prefix) {
    const count =
      (counters.get(prefix) || 0) + 1;

    counters.set(prefix, count);

    return (
      `${prefix}-BRIDGE-` +
      String(count).padStart(4, '0')
    );
  }

  function cloneRecord(record) {
    return Object.assign({}, record || {});
  }

  function project(headers, record) {
    const projected = {};

    headers.forEach(header => {
      projected[header] =
        Object.prototype.hasOwnProperty.call(
          record,
          header
        )
          ? record[header]
          : '';
    });

    return projected;
  }

  const Database = {
    ensureTable(name, headers) {
      events.push({
        type: 'ensureTable',
        table: name
      });

      if (!tables.has(name)) {
        tables.set(name, {
          headers: Array.from(headers),
          rows: []
        });
      }

      return Database.getSheet(name);
    },

    getHeaders(name) {
      return getTable(name).headers.slice();
    },

    getSheet(name) {
      const table = getTable(name);

      return {
        getRange(
          row,
          column,
          rowCount,
          columnCount
        ) {
          return {
            setValues(values) {
              assert.equal(
                row,
                1,
                'schema bridge may only add headers on row 1'
              );

              assert.equal(
                values.length,
                rowCount
              );

              assert.equal(
                values[0].length,
                columnCount
              );

              values[0].forEach(
                (value, index) => {
                  table.headers[
                    column - 1 + index
                  ] = value;
                }
              );

              events.push({
                type: 'schemaHeaderWrite',
                table: name,
                column,
                count: columnCount
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

        autoResizeColumns() {}
      };
    },

    getAll(name) {
      return getTable(name)
        .rows
        .map(cloneRecord);
    },

    insert(name, record, options) {
      const table = getTable(name);
      const values = cloneRecord(record);
      const opts = options || {};

      if (
        opts.idField &&
        !values[opts.idField]
      ) {
        values[opts.idField] =
          nextId(
            opts.idPrefix || 'ROW'
          );
      }

      const stored =
        project(
          table.headers,
          values
        );

      table.rows.push(stored);

      events.push({
        type: 'insert',
        table: name,
        record: cloneRecord(stored)
      });

      return cloneRecord(stored);
    },

    update(
      name,
      idField,
      idValue,
      changes
    ) {
      const table = getTable(name);

      const index =
        table.rows.findIndex(row =>
          String(row[idField] || '') ===
          String(idValue || '')
        );

      if (index === -1) {
        throw new Error(
          `Record not found: ${name}.${idField}=${idValue}`
        );
      }

      const updated =
        Object.assign(
          {},
          table.rows[index],
          changes || {}
        );

      table.rows[index] =
        project(
          table.headers,
          updated
        );

      events.push({
        type: 'update',
        table: name,
        record: cloneRecord(
          table.rows[index]
        )
      });

      return cloneRecord(
        table.rows[index]
      );
    }
  };

  return {
    Database,

    rows(name) {
      return getTable(name)
        .rows
        .map(cloneRecord);
    },

    headers(name) {
      return getTable(name)
        .headers
        .slice();
    },

    events,

    nextId
  };
}

console.log(
  '=== COUNTY RUNTIME BRIDGE CERTIFICATION ==='
);
console.log('');

const legacyHeaders =
  extractLegacyLeadHeaders();

assert.equal(
  legacyHeaders.length,
  18,
  'expected legacy 18-column DISTRESS_LEADS schema'
);

const database =
  createDatabase(legacyHeaders);

let generatedId = 0;
let networkCalls = 0;

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
  isFinite,
  parseInt,
  parseFloat,

  Session: {
    getActiveUser() {
      return {
        getEmail() {
          return (
            'county-runtime-bridge' +
            '@reos.local'
          );
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
        'Network execution is forbidden during bridge certification.'
      );
    }
  },

  Utilities: {},

  REOS: {
    Database: database.Database,

    generateId_(prefix) {
      generatedId += 1;

      return (
        `${prefix}-BRIDGE-CERT-` +
        String(generatedId)
          .padStart(4, '0')
      );
    }
  }
});

RUNTIME_FILES.forEach(fileName => {
  vm.runInContext(
    read(fileName),
    context,
    {
      filename: path.join(
        BUILD,
        fileName
      )
    }
  );
});

pass('county runtime core and schema bridge load');

const generatedFiles = fs
  .readdirSync(BUILD)
  .filter(fileName =>
    fileName.endsWith(
      'CountyConnector.js'
    )
  )
  .sort();

assert.equal(
  generatedFiles.length,
  94,
  'expected exactly 94 generated county connectors'
);

generatedFiles.forEach(fileName => {
  vm.runInContext(
    read(fileName),
    context,
    {
      filename: path.join(
        BUILD,
        fileName
      )
    }
  );
});

pass('94 generated county connector files load');

vm.runInContext(
  read('CountyRuntimeBridge.js'),
  context,
  {
    filename: path.join(
      BUILD,
      'CountyRuntimeBridge.js'
    )
  }
);

assert.ok(
  context.REOS.CountyRuntimeBridge,
  'REOS.CountyRuntimeBridge failed to load'
);

[
  'registerAdapters',
  'registerConnectors',
  'setup',
  'list',
  'run',
  'dryRun',
  'sync'
].forEach(method => {
  assert.equal(
    typeof context.REOS
      .CountyRuntimeBridge[method],
    'function',
    `CountyRuntimeBridge.${method} must be a function`
  );
});

pass('CountyRuntimeBridge public contract loads');

[
  'REOS_COUNTY_RUNTIME_SETUP',
  'REOS_COUNTY_RUNTIME_LIST',
  'REOS_COUNTY_RUNTIME_DRY_RUN',
  'REOS_COUNTY_RUNTIME_SYNC'
].forEach(functionName => {
  assert.equal(
    typeof context[functionName],
    'function',
    `${functionName} must be exposed`
  );
});

pass('controlled Apps Script runtime entry points load');

assert.equal(
  typeof context
    .REOS_COUNTY_RUNTIME_SYNC_ALL,
  'undefined',
  'runtime bridge must not expose sync-all'
);

assert.equal(
  typeof context
    .REOS_COUNTY_RUNTIME_INSTALL_DAILY_TRIGGER,
  'undefined',
  'runtime bridge must not expose a live daily trigger'
);

pass('no sync-all or scheduled live execution surface is exposed');

const bridge =
  context.REOS.CountyRuntimeBridge;

const firstAdapters =
  bridge.registerAdapters();

assert.equal(
  firstAdapters.length,
  5,
  'expected exactly five county adapters'
);

const secondAdapters =
  bridge.registerAdapters();

assert.equal(
  secondAdapters.length,
  5,
  'adapter registration must remain idempotent'
);

pass('five county adapters register idempotently');

const firstConnectorList =
  bridge.list();

assert.equal(
  firstConnectorList.length,
  94,
  'bridge must register exactly 94 generated connectors'
);

const secondConnectorList =
  bridge.list();

assert.equal(
  secondConnectorList.length,
  94,
  'generated connector registration must be idempotent'
);

assert.ok(
  context.REOS.CountyConnectorSDK.get(
    'PA-PHILADELPHIA'
  ),
  'Philadelphia generated connector must remain registered'
);

pass('94 generated connectors register idempotently');
pass('Philadelphia connector remains available');

let schemaEnsureCalls = 0;

const originalSchemaEnsure =
  context.REOS
    .DistressLeadCountySchema
    .ensure;

context.REOS
  .DistressLeadCountySchema
  .ensure = function () {
    schemaEnsureCalls += 1;

    return originalSchemaEnsure();
  };

const SYNTHETIC_ID =
  'PA-BRIDGE-CERTIFICATION';

context.REOS.CountyConnectorSDK.register({
  id: SYNTHETIC_ID,
  county: 'Runtime Bridge Certification',
  state: 'PA',
  version: '1.0.0',
  enabled: true,
  datasets: [
    'property_assessment'
  ],

  fetch() {
    return {
      records: [
        {
          Address:
            '100 Certification Way',
          City:
            'Philadelphia',
          State:
            'PA',
          Zip:
            '19106',
          County:
            'Philadelphia',
          'Owner Name':
            'Certification Owner',
          'Parcel ID':
            'BRIDGE-PARCEL-001',
          'Source Record ID':
            'BRIDGE-SOURCE-001',
          'Estimated Value':
            '250000'
        }
      ],

      nextCursor: '',
      message:
        'Synthetic bridge certification record.'
    };
  },

  normalize(record) {
    return Object.assign(
      {},
      record
    );
  }
});

pass('synthetic deterministic bridge connector registers');

const leadHeadersBeforeDryRun =
  database.headers(
    'DISTRESS_LEADS'
  );

const dryRun =
  bridge.run(
    SYNTHETIC_ID,
    {
      dataset:
        'property_assessment',
      limit: 1
    }
  );

assert.equal(
  dryRun.ok,
  true
);

assert.equal(
  dryRun.mode,
  'DRY_RUN'
);

assert.equal(
  dryRun.stats.fetched,
  1
);

assert.equal(
  dryRun.stats.valid,
  1
);

assert.equal(
  dryRun.stats.inserted,
  0
);

assert.equal(
  dryRun.stats.updated,
  0
);

assert.equal(
  dryRun.stats.skipped,
  1
);

assert.equal(
  schemaEnsureCalls,
  0,
  'dry-run must not migrate DISTRESS_LEADS'
);

assert.deepEqual(
  database.headers(
    'DISTRESS_LEADS'
  ),
  leadHeadersBeforeDryRun,
  'dry-run changed DISTRESS_LEADS headers'
);

assert.equal(
  database.rows(
    'DISTRESS_LEADS'
  ).length,
  0,
  'dry-run wrote a DISTRESS_LEADS record'
);

pass('dry-run is the default execution mode');
pass('dry-run performs no lead schema migration');
pass('dry-run performs no DISTRESS_LEADS writes');

const auditCountBeforeBlockedLive =
  database.rows(
    'COUNTY_CONNECTOR_RUNS'
  ).length;

assert.throws(
  () => {
    bridge.sync(
      SYNTHETIC_ID,
      'property_assessment',
      {
        limit: 1
      }
    );
  },
  /confirmLive=true/,
  'unconfirmed live execution must be rejected'
);

assert.equal(
  schemaEnsureCalls,
  0,
  'blocked live execution must not migrate schema'
);

assert.equal(
  database.rows(
    'COUNTY_CONNECTOR_RUNS'
  ).length,
  auditCountBeforeBlockedLive,
  'blocked live execution must not start an SDK run'
);

assert.equal(
  database.rows(
    'DISTRESS_LEADS'
  ).length,
  0,
  'blocked live execution wrote a lead'
);

pass('live execution requires explicit confirmLive=true');
pass('blocked live execution creates no audit or lead write');

const eventsBeforeFirstLive =
  database.events.length;

const firstLive =
  bridge.sync(
    SYNTHETIC_ID,
    'property_assessment',
    {
      limit: 1,
      confirmLive: true
    }
  );

assert.equal(
  firstLive.ok,
  true
);

assert.equal(
  firstLive.mode,
  'LIVE'
);

assert.equal(
  firstLive.stats.inserted,
  1
);

assert.equal(
  firstLive.stats.updated,
  0
);

assert.equal(
  schemaEnsureCalls,
  1,
  'confirmed live execution must ensure schema exactly once'
);

const liveHeaders =
  database.headers(
    'DISTRESS_LEADS'
  );

assert.equal(
  liveHeaders.length,
  52,
  'confirmed live execution must establish 52-column lead schema'
);

assert.deepEqual(
  liveHeaders.slice(0, 18),
  legacyHeaders,
  'live schema migration altered the legacy header prefix'
);

const firstLiveEvents =
  database.events.slice(
    eventsBeforeFirstLive
  );

const schemaWriteIndex =
  firstLiveEvents.findIndex(
    event =>
      event.type ===
        'schemaHeaderWrite' &&
      event.table ===
        'DISTRESS_LEADS'
  );

const leadInsertIndex =
  firstLiveEvents.findIndex(
    event =>
      event.type ===
        'insert' &&
      event.table ===
        'DISTRESS_LEADS'
  );

assert.ok(
  schemaWriteIndex !== -1,
  'confirmed live execution did not migrate lead headers'
);

assert.ok(
  leadInsertIndex !== -1,
  'confirmed live execution did not insert a lead'
);

assert.ok(
  schemaWriteIndex <
    leadInsertIndex,
  'schema migration must occur before lead persistence'
);

assert.equal(
  database.rows(
    'DISTRESS_LEADS'
  ).length,
  1
);

const insertedLead =
  database.rows(
    'DISTRESS_LEADS'
  )[0];

assert.equal(
  insertedLead[
    'Source Record ID'
  ],
  'BRIDGE-SOURCE-001'
);

assert.equal(
  insertedLead[
    'Source Dataset'
  ],
  'property_assessment'
);

assert.ok(
  insertedLead[
    'Source Record Key'
  ],
  'live persistence must establish Source Record Key'
);

assert.ok(
  insertedLead[
    'Source Observation Key'
  ],
  'live persistence must establish Source Observation Key'
);

assert.ok(
  insertedLead[
    'Canonical Property Key'
  ],
  'live persistence must establish Canonical Property Key'
);

pass('confirmed live execution migrates schema before persistence');
pass('first live execution inserts exactly one county lead');

const schemaWritesAfterFirstLive =
  database.events.filter(
    event =>
      event.type ===
        'schemaHeaderWrite' &&
      event.table ===
        'DISTRESS_LEADS'
  ).length;

const secondLive =
  bridge.sync(
    SYNTHETIC_ID,
    'property_assessment',
    {
      limit: 1,
      confirmLive: true
    }
  );

assert.equal(
  secondLive.ok,
  true
);

assert.equal(
  secondLive.stats.inserted,
  0
);

assert.equal(
  secondLive.stats.updated,
  1
);

assert.equal(
  schemaEnsureCalls,
  2,
  'each confirmed live execution must verify schema'
);

assert.equal(
  database.rows(
    'DISTRESS_LEADS'
  ).length,
  1,
  'repeated live execution duplicated the county lead'
);

const schemaWritesAfterSecondLive =
  database.events.filter(
    event =>
      event.type ===
        'schemaHeaderWrite' &&
      event.table ===
        'DISTRESS_LEADS'
  ).length;

assert.equal(
  schemaWritesAfterSecondLive,
  schemaWritesAfterFirstLive,
  'idempotent schema verification performed another header write'
);

pass('repeated live execution updates instead of duplicating');
pass('repeated live schema verification performs no extra header write');

assert.equal(
  networkCalls,
  0,
  'bridge certification performed external network access'
);

pass('bridge certification performs zero external network calls');

const runRows =
  database.rows(
    'COUNTY_CONNECTOR_RUNS'
  );

assert.equal(
  runRows.length,
  3,
  'expected dry-run plus two confirmed live audit rows'
);

assert.equal(
  runRows[0].Mode,
  'DRY_RUN'
);

assert.equal(
  runRows[1].Mode,
  'LIVE'
);

assert.equal(
  runRows[2].Mode,
  'LIVE'
);

assert.ok(
  runRows.every(
    row => row.Status === 'Completed'
  ),
  'all executed bridge runs must complete in audit ledger'
);

pass('dry-run and live executions persist deterministic audit evidence');

console.log('');
console.log(
  'County runtime bridge certification PASSED.'
);
