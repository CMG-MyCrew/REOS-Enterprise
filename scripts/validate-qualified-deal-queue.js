#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const MODULE_PATH = path.resolve(
  __dirname,
  '../build/apps-script-brand/QualifiedDealQueue.js'
);

const tables = Object.create(null);
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

function ensureStore(name, headers) {
  if (!tables[name]) {
    tables[name] = {
      headers: (headers || []).slice(),
      rows: []
    };
  }

  return tables[name];
}

const database = {
  ensureTable: function (name, headers) {
    const store = ensureStore(name, headers);

    return {
      getRange: function (row, column, numRows, numColumns) {
        assert.strictEqual(row, 1);
        assert.strictEqual(numRows, 1);

        return {
          setValues: function (values) {
            const additions = values[0] || [];

            additions.forEach(function (header) {
              if (store.headers.indexOf(header) === -1) {
                store.headers.push(header);
              }
            });

            return this;
          }
        };
      }
    };
  },

  getHeaders: function (name) {
    return ensureStore(name, []).headers.slice();
  },

  getAll: function (name) {
    return ensureStore(name, []).rows.map(clone);
  },

  insert: function (name, record, options) {
    const store = ensureStore(name, []);
    const row = clone(record);
    const idField = options && options.idField;
    const idPrefix =
      options && options.idPrefix
        ? options.idPrefix
        : 'ID';

    if (idField && !row[idField]) {
      row[idField] = idPrefix + '-' + String(nextId++);
    }

    if (!row['Created At']) {
      row['Created At'] = new Date();
    }

    row['Updated At'] = new Date();

    store.rows.push(row);

    return clone(row);
  },

  update: function (name, idField, idValue, changes) {
    const store = ensureStore(name, []);

    const row = store.rows.find(function (candidate) {
      return String(candidate[idField] || '') === String(idValue || '');
    });

    if (!row) {
      throw new Error(
        'Row not found: ' + name + ' ' + idField + '=' + idValue
      );
    }

    Object.keys(changes || {}).forEach(function (key) {
      row[key] = clone(changes[key]);
    });

    row['Updated At'] = new Date();

    return clone(row);
  },

  findById: function (name, idField, idValue) {
    const store = ensureStore(name, []);

    const row = store.rows.find(function (candidate) {
      return String(candidate[idField] || '') === String(idValue || '');
    });

    return row ? clone(row) : null;
  }
};

const context = {
  REOS: {
    Database: database
  },

  Session: {
    getActiveUser: function () {
      return {
        getEmail: function () {
          return 'queue-validator@reos.local';
        }
      };
    }
  },

  console: console,
  Date: Date,
  JSON: JSON,
  String: String,
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

const queue = context.REOS.QualifiedDealQueue;

assert(queue, 'REOS.QualifiedDealQueue must load.');

function decision(options) {
  options = options || {};

  return {
    ok: true,
    dealId: options.dealId || 'DEAL-001',
    analysisId: options.analysisId || 'ANL-001',

    decision: {
      decision: options.decision || 'BUY',

      eligibleForOffer:
        options.eligibleForOffer !== undefined
          ? options.eligibleForOffer
          : true,

      reasons: options.reasons || ['Qualified'],
      warnings: options.warnings || [],
      blockers: options.blockers || [],
      missingData: options.missingData || [],

      metrics: options.metrics || {
        mao: 150000,
        roi: 22,
        dscr: 1.5
      },

      rulesetVersion:
        options.rulesetVersion || 'test-rules-v1',

      rules: options.rules || {}
    }
  };
}

function rows() {
  return database.getAll(queue.TABLE);
}

function activeRows(dealId) {
  return rows().filter(function (row) {
    return (
      String(row['Deal ID'] || '') === String(dealId || '') &&
      row.Active !== false &&
      String(row['Queue Status'] || '') !== queue.STATUS.REMOVED
    );
  });
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

test('BUY + eligible creates pending queue authority', function () {
  const result = queue.qualify(
    decision({
      dealId: 'DEAL-BUY',
      analysisId: 'ANL-BUY-1'
    })
  );

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.queued, true);
  assert.strictEqual(result.created, true);
  assert(result.queue);
  assert.strictEqual(result.queue.Decision, 'BUY');
  assert.strictEqual(result.queue['Eligible For Offer'], true);
  assert.strictEqual(
    result.queue['Queue Status'],
    queue.STATUS.PENDING
  );
  assert.strictEqual(activeRows('DEAL-BUY').length, 1);
});

test('repeated BUY is idempotent', function () {
  const before = activeRows('DEAL-BUY');

  assert.strictEqual(before.length, 1);

  const queueId = before[0]['Queue ID'];

  const result = queue.qualify(
    decision({
      dealId: 'DEAL-BUY',
      analysisId: 'ANL-BUY-1'
    })
  );

  assert.strictEqual(result.queued, true);
  assert.strictEqual(result.created, false);
  assert.strictEqual(result.queue['Queue ID'], queueId);
  assert.strictEqual(activeRows('DEAL-BUY').length, 1);
});

test('new BUY analysis updates existing active authority', function () {
  const queueId =
    activeRows('DEAL-BUY')[0]['Queue ID'];

  const result = queue.qualify(
    decision({
      dealId: 'DEAL-BUY',
      analysisId: 'ANL-BUY-2',
      reasons: ['Newer qualifying analysis'],
      rulesetVersion: 'test-rules-v2'
    })
  );

  assert.strictEqual(result.created, false);
  assert.strictEqual(result.queue['Queue ID'], queueId);
  assert.strictEqual(
    result.queue['Analysis ID'],
    'ANL-BUY-2'
  );
  assert.strictEqual(
    result.queue['Ruleset Version'],
    'test-rules-v2'
  );
  assert.strictEqual(activeRows('DEAL-BUY').length, 1);
});

['REVIEW', 'RESEARCH', 'PASS'].forEach(function (value) {
  test(value + ' does not create queue authority', function () {
    const dealId = 'DEAL-' + value;

    const result = queue.qualify(
      decision({
        dealId: dealId,
        analysisId: 'ANL-' + value,
        decision: value,
        eligibleForOffer: false
      })
    );

    assert.strictEqual(result.queued, false);
    assert.strictEqual(result.revoked, false);
    assert.strictEqual(activeRows(dealId).length, 0);
  });
});

test('later REVIEW revokes existing BUY authority', function () {
  assert.strictEqual(activeRows('DEAL-BUY').length, 1);

  const result = queue.qualify(
    decision({
      dealId: 'DEAL-BUY',
      analysisId: 'ANL-BUY-3',
      decision: 'REVIEW',
      eligibleForOffer: false
    })
  );

  assert.strictEqual(result.queued, false);
  assert.strictEqual(result.revoked, true);
  assert(result.queue);
  assert.strictEqual(
    result.queue['Queue Status'],
    queue.STATUS.REMOVED
  );
  assert.strictEqual(result.queue.Active, false);
  assert.strictEqual(activeRows('DEAL-BUY').length, 0);
});

test('BUY with eligibleForOffer=false cannot retain authority', function () {
  queue.qualify(
    decision({
      dealId: 'DEAL-INELIGIBLE',
      analysisId: 'ANL-INELIGIBLE-1'
    })
  );

  assert.strictEqual(
    activeRows('DEAL-INELIGIBLE').length,
    1
  );

  const result = queue.qualify(
    decision({
      dealId: 'DEAL-INELIGIBLE',
      analysisId: 'ANL-INELIGIBLE-2',
      decision: 'BUY',
      eligibleForOffer: false
    })
  );

  assert.strictEqual(result.queued, false);
  assert.strictEqual(result.revoked, true);
  assert.strictEqual(
    activeRows('DEAL-INELIGIBLE').length,
    0
  );
});

test('qualifying again after revocation creates new authority', function () {
  const result = queue.qualify(
    decision({
      dealId: 'DEAL-BUY',
      analysisId: 'ANL-BUY-4'
    })
  );

  assert.strictEqual(result.queued, true);
  assert.strictEqual(result.created, true);
  assert.strictEqual(activeRows('DEAL-BUY').length, 1);

  const history = rows().filter(function (row) {
    return row['Deal ID'] === 'DEAL-BUY';
  });

  assert.strictEqual(history.length, 2);
});

test('missing explicit eligibleForOffer is rejected', function () {
  const input = decision({
    dealId: 'DEAL-INVALID',
    analysisId: 'ANL-INVALID'
  });

  delete input.decision.eligibleForOffer;

  assert.throws(
    function () {
      queue.qualify(input);
    },
    /explicit eligibleForOffer authority/
  );

  assert.strictEqual(
    activeRows('DEAL-INVALID').length,
    0
  );
});

console.log();
console.log(
  'Qualified Deal Queue contract validation PASSED.'
);
