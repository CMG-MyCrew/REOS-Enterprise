#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

const registryPath = path.join(BUILD, 'ConnectorRegistry.js');
const managerPath = path.join(BUILD, 'AcquisitionConnectorManager.js');

const COUNTY_CONNECTORS = [
  {
    key: 'county_csv',
    handler: 'reosConnectorHandleCountyCsv',
    sourceCategory: 'County Records'
  },
  {
    key: 'tax_delinquent',
    handler: 'reosConnectorHandleTaxDelinquent',
    sourceCategory: 'Tax Delinquency'
  },
  {
    key: 'probate',
    handler: 'reosConnectorHandleProbate',
    sourceCategory: 'Probate'
  },
  {
    key: 'code_violations',
    handler: 'reosConnectorHandleCodeViolations',
    sourceCategory: 'Code Violations'
  },
  {
    key: 'vacant_properties',
    handler: 'reosConnectorHandleVacantProperties',
    sourceCategory: 'Vacancy'
  },
  {
    key: 'absentee_owners',
    handler: 'reosConnectorHandleAbsenteeOwners',
    sourceCategory: 'Absentee Owner'
  }
];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function loadSource(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required source not found: ${path.relative(ROOT, filePath)}`);
  }

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
    const current = (counters.get(prefix) || 0) + 1;
    counters.set(prefix, current);
    return `${prefix}-${String(current).padStart(4, '0')}`;
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

    _rows(name) {
      ensureTable(name);
      return tables.get(name);
    }
  };
}

const Database = createDatabase();

let failureConnectorKey = '';
const invocationLog = [];

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
          return 'county-certification@reos.local';
        }
      };
    }
  },

  reosConnectorHandleZillowGmail: function () {
    return {
      ok: true,
      status: 'Complete',
      message: 'Certification Zillow Gmail stub.'
    };
  },

  reosConnectorHandleZillowImport: function () {
    return {
      ok: true,
      status: 'Complete',
      message: 'Certification Zillow import stub.'
    };
  },

  REOS: {
    Database,

    CSVImportEngine: {
      ensureSheets() {
        return { ok: true };
      },

      importConnector(callContext) {
        const connector =
          (callContext && callContext.connector) || {};

        const key = connector['Connector Key'] || '';

        invocationLog.push({
          key,
          handler: connector['Handler Function'] || ''
        });

        if (key === failureConnectorKey) {
          return {
            ok: false,
            status: 'Failed',
            message: `Synthetic certification failure for ${key}`,
            recordsFound: 5,
            recordsImported: 0,
            recordsSkipped: 5
          };
        }

        return {
          ok: true,
          status: 'Complete',
          message: `Synthetic certification success for ${key}`,
          recordsFound: 5,
          recordsImported: 4,
          recordsSkipped: 1
        };
      }
    }
  }
});

vm.runInContext(
  loadSource(registryPath),
  context,
  { filename: registryPath }
);

vm.runInContext(
  loadSource(managerPath),
  context,
  { filename: managerPath }
);

const registry = context.REOS.ConnectorRegistry;
const manager = context.REOS.AcquisitionConnectorManager;

assert.ok(registry, 'ConnectorRegistry failed to load');
assert.ok(manager, 'AcquisitionConnectorManager failed to load');

console.log('=== COUNTY CONNECTOR CERTIFICATION ===');
console.log('');

const initialized = manager.initialize();

assert.equal(initialized.ok, true);
pass('connector registry initializes');

for (const expected of COUNTY_CONNECTORS) {
  const connector = registry.get(expected.key);

  assert.ok(
    connector,
    `missing connector registration: ${expected.key}`
  );

  assert.equal(
    connector.Type,
    'CSV',
    `${expected.key} must use CSV connector type`
  );

  assert.equal(
    connector['Source Category'],
    expected.sourceCategory,
    `${expected.key} source category mismatch`
  );

  assert.equal(
    connector['Handler Function'],
    expected.handler,
    `${expected.key} handler mismatch`
  );

  assert.equal(
    registry.isEnabled(connector),
    false,
    `${expected.key} must be disabled by default`
  );

  assert.equal(
    connector.Schedule,
    'Manual',
    `${expected.key} must default to Manual schedule`
  );

  pass(`${expected.key} registration contract`);
}

console.log('');

for (const expected of COUNTY_CONNECTORS) {
  const disabledResult = manager.run(expected.key);

  assert.equal(
    disabledResult.ok,
    false,
    `${expected.key} disabled execution must not report success`
  );

  assert.equal(
    disabledResult.skipped,
    true,
    `${expected.key} disabled execution must be skipped`
  );

  assert.equal(
    disabledResult.status,
    'Disabled',
    `${expected.key} disabled execution status mismatch`
  );

  pass(`${expected.key} disabled-by-default execution guard`);
}

assert.equal(
  manager.recentRuns(100).length,
  0,
  'disabled/skipped executions must not create run-ledger rows'
);

pass('disabled connector skips do not create run-ledger authority');

console.log('');

for (const expected of COUNTY_CONNECTORS) {
  registry.enable(expected.key, {
    certification: true
  });

  const result = manager.run(expected.key, {
    force: true,
    context: {
      certification: true
    }
  });

  assert.equal(
    result.ok,
    true,
    `${expected.key} forced certification run failed`
  );

  assert.equal(
    result.status,
    'Complete',
    `${expected.key} status must be Complete`
  );

  assert.equal(
    Number(result.run['Records Found']),
    5,
    `${expected.key} records-found metric mismatch`
  );

  assert.equal(
    Number(result.run['Records Imported']),
    4,
    `${expected.key} records-imported metric mismatch`
  );

  assert.equal(
    Number(result.run['Records Skipped']),
    1,
    `${expected.key} records-skipped metric mismatch`
  );

  const invocation = invocationLog
    .slice()
    .reverse()
    .find(item => item.key === expected.key);

  assert.ok(
    invocation,
    `${expected.key} did not reach CSV import routing`
  );

  assert.equal(
    invocation.handler,
    expected.handler,
    `${expected.key} routed through wrong handler`
  );

  const health = manager.health();
  const item = health.items.find(
    candidate => candidate.key === expected.key
  );

  assert.ok(item, `${expected.key} missing from health report`);

  assert.equal(
    item.state,
    'Healthy',
    `${expected.key} must become Healthy after successful execution`
  );

  pass(`${expected.key} execution, routing, metrics and health`);
}

console.log('');

const recentRuns = manager.recentRuns(100);

for (const expected of COUNTY_CONNECTORS) {
  const run = recentRuns.find(
    row => row['Connector Key'] === expected.key
  );

  assert.ok(
    run,
    `${expected.key} missing run-ledger entry`
  );

  assert.ok(
    run['Run ID'],
    `${expected.key} run-ledger entry missing Run ID`
  );
}

pass('all six county routes persist run-ledger evidence');

console.log('');

const failureKey = 'tax_delinquent';
failureConnectorKey = failureKey;

const failed = manager.run(failureKey, {
  force: true,
  context: {
    certificationFailure: true
  }
});

assert.equal(
  failed.ok,
  false,
  'synthetic connector failure must propagate as ok=false'
);

assert.equal(
  failed.status,
  'Failed',
  'synthetic connector failure must propagate Failed status'
);

assert.equal(
  Number(failed.run['Records Found']),
  5
);

assert.equal(
  Number(failed.run['Records Imported']),
  0
);

assert.equal(
  Number(failed.run['Records Skipped']),
  5
);

let health = manager.health();
let failureHealth = health.items.find(
  item => item.key === failureKey
);

assert.equal(
  failureHealth.state,
  'Unhealthy',
  'failed enabled connector must become Unhealthy'
);

pass('failure propagates to run ledger and Unhealthy state');

failureConnectorKey = '';

console.log('');

registry.update('county_csv', {
  'Last Run At': new Date(
    Date.now() - (49 * 60 * 60 * 1000)
  ),
  'Last Status': 'Complete',
  'Last Message': 'Synthetic stale certification state'
});

health = manager.health();

const staleHealth = health.items.find(
  item => item.key === 'county_csv'
);

assert.equal(
  staleHealth.state,
  'Stale',
  'enabled connector older than 48 hours must become Stale'
);

assert.ok(
  Number(staleHealth.ageHours) > 48,
  'stale connector age must exceed 48 hours'
);

pass('48-hour stale-health contract');

console.log('');

assert.throws(
  () => manager.run('county_connector_that_does_not_exist', {
    force: true
  }),
  /Unknown connector:/,
  'unknown connector key must be rejected'
);

pass('unknown connector key is rejected');

console.log('');

const finalRuns = manager.recentRuns(100);

assert.equal(
  finalRuns.length,
  COUNTY_CONNECTORS.length + 1,
  'expected six successful runs plus one synthetic failure'
);

pass('certification run-ledger count is deterministic');

console.log('');
console.log('County connector certification contract PASSED.');
