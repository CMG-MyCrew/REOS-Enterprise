#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.resolve(
  __dirname,
  '../build/apps-script-brand/OfferExecutionWorkflow.js'
);

const tables = Object.create(null);
const authorities = Object.create(null);
let nextId = 1;

function clone(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(clone);

  if (typeof value === 'object') {
    const result = {};
    Object.keys(value).forEach(function (key) {
      result[key] = clone(value[key]);
    });
    return result;
  }

  return value;
}

function store(name) {
  if (!tables[name]) {
    tables[name] = {
      headers: [],
      rows: []
    };
  }

  return tables[name];
}

function sheetApi(name) {
  const target = store(name);

  return {
    getLastColumn: function () {
      return target.headers.length;
    },

    getRange: function () {
      return {
        setValues: function (values) {
          (values[0] || []).forEach(function (header) {
            if (target.headers.indexOf(header) === -1) {
              target.headers.push(header);
            }
          });
          return this;
        },

        setFontWeight: function () {
          return this;
        },

        setWrap: function () {
          return this;
        }
      };
    }
  };
}

const database = {
  ensureTable: function (name, headers) {
    const target = store(name);

    if (!target.headers.length) {
      target.headers = (headers || []).slice();
    }

    return sheetApi(name);
  },

  getHeaders: function (name) {
    return store(name).headers.slice();
  },

  getAll: function (name) {
    return store(name).rows.map(clone);
  },

  insert: function (name, record, options) {
    const target = store(name);
    const row = clone(record);
    const idField = options && options.idField;
    const prefix =
      options && options.idPrefix
        ? options.idPrefix
        : 'ID';

    if (idField && !row[idField]) {
      row[idField] =
        prefix + '-' + String(nextId++);
    }

    target.rows.push(row);
    return clone(row);
  },

  update: function (
    name,
    idField,
    idValue,
    changes
  ) {
    const target = store(name);

    const row = target.rows.find(function (candidate) {
      return String(candidate[idField] || '') ===
        String(idValue || '');
    });

    if (!row) {
      throw new Error(
        'Row not found: ' +
        name +
        ' ' +
        idField +
        '=' +
        idValue
      );
    }

    Object.keys(changes || {}).forEach(function (key) {
      row[key] = clone(changes[key]);
    });

    return clone(row);
  }
};

const qualifiedDealQueue = {
  validateAuthority: function (reference) {
    const authority =
      authorities[String(reference.queueId || '')];

    if (!authority) {
      return {
        ok: true,
        authorized: false,
        reason: 'Qualified queue record not found.'
      };
    }

    if (
      authority.active !== true ||
      authority.dealId !==
        String(reference.dealId || '') ||
      authority.analysisId !==
        String(reference.analysisId || '')
    ) {
      return {
        ok: true,
        authorized: false,
        reason:
          'Qualified queue record is not active matching authority.'
      };
    }

    return {
      ok: true,
      authorized: true,
      queue: {
        'Queue ID': reference.queueId,
        'Deal ID': reference.dealId,
        'Analysis ID': reference.analysisId,
        Decision: 'BUY',
        'Eligible For Offer': true,
        'Queue Status': 'Pending',
        Active: true
      },
      reason: 'Active qualified-deal authority confirmed.'
    };
  }
};

const context = {
  REOS: {
    Database: database,
    QualifiedDealQueue: qualifiedDealQueue,

    PluginEventBus: {
      publish: function () {}
    }
  },

  Session: {
    getActiveUser: function () {
      return {
        getEmail: function () {
          return 'execution-validator@reos.local';
        }
      };
    }
  },

  console: console,
  Date: Date,
  JSON: JSON,
  String: String,
  Number: Number,
  Math: Math,
  Object: Object,
  Array: Array,
  Error: Error,
  isFinite: isFinite
};

vm.createContext(context);

vm.runInContext(
  fs.readFileSync(MODULE_PATH, 'utf8'),
  context,
  {
    filename: MODULE_PATH
  }
);

const workflow =
  context.REOS.OfferExecutionWorkflow;

assert(
  workflow,
  'REOS.OfferExecutionWorkflow must load.'
);

function clearObject(object) {
  Object.keys(object).forEach(function (key) {
    delete object[key];
  });
}

function resetRows() {
  Object.keys(tables).forEach(function (name) {
    tables[name].rows = [];
  });

  clearObject(authorities);
}

function seed(name, row) {
  store(name).rows.push(clone(row));
}

function authorize(
  queueId,
  dealId,
  analysisId
) {
  authorities[queueId] = {
    active: true,
    dealId: dealId,
    analysisId: analysisId
  };
}

function executions() {
  return database.getAll(
    'OFFER_EXECUTION_QUEUE'
  );
}

function offers() {
  return database.getAll('OFFERS');
}

function test(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
  } catch (error) {
    console.error('FAIL:', name);
    throw error;
  }
}

/*
 * Existing production sheets must gain the new
 * provenance columns rather than depending on
 * creation of a brand-new sheet.
 */
store('OFFER_EXECUTION_QUEUE').headers = [
  'Execution ID',
  'Offer ID',
  'Deal ID',
  'Execution Status',
  'Created At',
  'Updated At'
];

test(
  'existing execution queue gains authority provenance columns',
  function () {
    workflow.ensureSheets();

    const headers =
      database.getHeaders(
        'OFFER_EXECUTION_QUEUE'
      );

    [
      'Analysis ID',
      'Qualified Queue ID',
      'Authority Source',
      'Authority Validated At'
    ].forEach(function (header) {
      assert(
        headers.indexOf(header) !== -1,
        'Missing migrated header: ' + header
      );
    });
  }
);

test(
  'legacy draft without provenance cannot enter execution queue',
  function () {
    resetRows();

    seed('OFFERS', {
      'Offer ID': 'OFF-LEGACY',
      'Deal ID': 'DEAL-LEGACY',
      Status: 'Draft',
      'Offer Amount': 100000
    });

    const result =
      workflow.buildQueue({
        maxItems: 10
      });

    assert.strictEqual(
      result.created,
      0
    );

    assert.strictEqual(
      result.unauthorized,
      1
    );

    assert.strictEqual(
      executions().length,
      0
    );

    assert.strictEqual(
      offers()[0].Status,
      'Draft'
    );
  }
);

test(
  'active qualified offer enters execution queue with provenance',
  function () {
    resetRows();

    authorize(
      'QDQ-VALID',
      'DEAL-VALID',
      'ANL-VALID'
    );

    seed('OFFERS', {
      'Offer ID': 'OFF-VALID',
      'Deal ID': 'DEAL-VALID',
      'Analysis ID': 'ANL-VALID',
      'Qualified Queue ID': 'QDQ-VALID',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft',
      'Offer Type': 'Cash',
      'Offer Amount': 150000
    });

    const result =
      workflow.buildQueue({
        maxItems: 10
      });

    assert.strictEqual(
      result.created,
      1
    );

    assert.strictEqual(
      executions().length,
      1
    );

    const execution = executions()[0];

    assert.strictEqual(
      execution['Offer ID'],
      'OFF-VALID'
    );

    assert.strictEqual(
      execution['Analysis ID'],
      'ANL-VALID'
    );

    assert.strictEqual(
      execution['Qualified Queue ID'],
      'QDQ-VALID'
    );

    assert.strictEqual(
      execution['Authority Source'],
      'QUALIFIED_DEAL_QUEUE'
    );

    assert(
      execution['Authority Validated At']
    );

    assert.strictEqual(
      offers()[0].Status,
      'Ready'
    );
  }
);

test(
  'repeated queue build is idempotent for existing execution',
  function () {
    const before =
      executions().length;

    const result =
      workflow.buildQueue({
        maxItems: 10
      });

    assert.strictEqual(
      result.created,
      0
    );

    assert.strictEqual(
      executions().length,
      before
    );
  }
);

test(
  'revoked qualified authority cannot enter execution queue',
  function () {
    resetRows();

    authorities['QDQ-REVOKED'] = {
      active: false,
      dealId: 'DEAL-REVOKED',
      analysisId: 'ANL-REVOKED'
    };

    seed('OFFERS', {
      'Offer ID': 'OFF-REVOKED',
      'Deal ID': 'DEAL-REVOKED',
      'Analysis ID': 'ANL-REVOKED',
      'Qualified Queue ID':
        'QDQ-REVOKED',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    const result =
      workflow.buildQueue({
        maxItems: 10
      });

    assert.strictEqual(
      result.created,
      0
    );

    assert.strictEqual(
      result.unauthorized,
      1
    );

    assert.strictEqual(
      executions().length,
      0
    );
  }
);

test(
  'unauthorized offers do not consume authorized maxItems capacity',
  function () {
    resetRows();

    for (let index = 1; index <= 3; index++) {
      seed('OFFERS', {
        'Offer ID':
          'OFF-LEGACY-' + index,
        'Deal ID':
          'DEAL-LEGACY-' + index,
        Status: 'Draft'
      });
    }

    authorize(
      'QDQ-AFTER-LEGACY',
      'DEAL-AFTER-LEGACY',
      'ANL-AFTER-LEGACY'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-AFTER-LEGACY',
      'Deal ID':
        'DEAL-AFTER-LEGACY',
      'Analysis ID':
        'ANL-AFTER-LEGACY',
      'Qualified Queue ID':
        'QDQ-AFTER-LEGACY',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    const result =
      workflow.buildQueue({
        maxItems: 1
      });

    assert.strictEqual(
      result.created,
      1
    );

    assert.strictEqual(
      result.unauthorized,
      3
    );

    assert.strictEqual(
      executions()[0]['Offer ID'],
      'OFF-AFTER-LEGACY'
    );
  }
);

test(
  'authority validator unavailable fails closed',
  function () {
    resetRows();

    seed('OFFERS', {
      'Offer ID':
        'OFF-NO-VALIDATOR',
      'Deal ID':
        'DEAL-NO-VALIDATOR',
      'Analysis ID':
        'ANL-NO-VALIDATOR',
      'Qualified Queue ID':
        'QDQ-NO-VALIDATOR',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    const saved =
      context.REOS.QualifiedDealQueue;

    context.REOS.QualifiedDealQueue = null;

    try {
      const result =
        workflow.buildQueue({
          maxItems: 10
        });

      assert.strictEqual(
        result.created,
        0
      );

      assert.strictEqual(
        result.unauthorized,
        1
      );

      assert.strictEqual(
        executions().length,
        0
      );
    } finally {
      context.REOS.QualifiedDealQueue =
        saved;
    }
  }
);

console.log();
console.log(
  'Offer Execution Authority contract validation PASSED.'
);
