#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DASHBOARD_PATH = path.resolve(
  __dirname,
  '../build/apps-script-brand/DashboardActions.js'
);

const WORKFLOW_PATH = path.resolve(
  __dirname,
  '../build/apps-script-brand/AcquisitionWorkflow.js'
);

const tables = Object.create(null);
const pipelineCalls = [];
let nextId = 1;

function clone(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (value instanceof Date) {
    return new Date(
      value.getTime()
    );
  }

  if (Array.isArray(value)) {
    return value.map(clone);
  }

  if (typeof value === 'object') {
    const result = {};

    Object.keys(value).forEach(
      function (key) {
        result[key] =
          clone(value[key]);
      }
    );

    return result;
  }

  return value;
}

function table(name) {
  if (!tables[name]) {
    tables[name] = {
      headers: [],
      rows: []
    };
  }

  return tables[name];
}

const database = {
  ensureTable: function (
    name,
    headers
  ) {
    const target = table(name);

    if (!target.headers.length) {
      target.headers =
        (headers || []).slice();
    }

    return {};
  },

  getAll: function (name) {
    return table(name)
      .rows
      .map(clone);
  },

  insert: function (
    name,
    record,
    options
  ) {
    const target = table(name);
    const row = clone(record);

    const idField =
      options && options.idField;

    const prefix =
      options && options.idPrefix
        ? options.idPrefix
        : 'ID';

    if (
      idField &&
      !row[idField]
    ) {
      row[idField] =
        prefix +
        '-' +
        String(nextId++);
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
    const row =
      table(name).rows.find(
        function (candidate) {
          return String(
            candidate[idField] || ''
          ) === String(
            idValue || ''
          );
        }
      );

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

    Object.keys(
      changes || {}
    ).forEach(function (key) {
      row[key] =
        clone(changes[key]);
    });

    return clone(row);
  }
};

const acquisitionPipeline = {
  ensureSheets: function () {},

  createPipeline: function (
    dealId
  ) {
    return {
      'Deal ID': dealId,
      'Current Stage': 'Lead'
    };
  },

  advanceStage: function (
    dealId,
    stage,
    notes
  ) {
    pipelineCalls.push({
      dealId: dealId,
      stage: stage,
      notes: notes || ''
    });

    return {
      'Deal ID': dealId,
      'Current Stage': stage
    };
  }
};

const context = {
  REOS: {
    Database: database,
    AcquisitionPipeline:
      acquisitionPipeline,

    PluginEventBus: {
      publish: function () {}
    }
  },

  Session: {
    getActiveUser: function () {
      return {
        getEmail: function () {
          return (
            'lifecycle-validator' +
            '@reos.local'
          );
        }
      };
    }
  },

  console: console,
  Date: Date,
  JSON: JSON,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  Error: Error,
  Math: Math,
  isFinite: isFinite
};

vm.createContext(context);

vm.runInContext(
  fs.readFileSync(
    DASHBOARD_PATH,
    'utf8'
  ),
  context,
  {
    filename: DASHBOARD_PATH
  }
);

vm.runInContext(
  fs.readFileSync(
    WORKFLOW_PATH,
    'utf8'
  ),
  context,
  {
    filename: WORKFLOW_PATH
  }
);

const dashboard =
  context.REOS.DashboardActions;

const acquisitionWorkflow =
  context.REOS.AcquisitionWorkflow;

assert(
  dashboard,
  'DashboardActions must load.'
);

assert(
  acquisitionWorkflow,
  'AcquisitionWorkflow must load.'
);

function reset() {
  Object.keys(tables).forEach(
    function (name) {
      tables[name].rows = [];
    }
  );

  pipelineCalls.length = 0;
}

function seed(name, row) {
  table(name).rows.push(
    clone(row)
  );
}

function stagesFor(dealId) {
  return pipelineCalls
    .filter(function (call) {
      return call.dealId === dealId;
    })
    .map(function (call) {
      return call.stage;
    });
}

function test(name, fn) {
  try {
    fn();
    console.log(
      'PASS:',
      name
    );
  } catch (error) {
    console.error(
      'FAIL:',
      name
    );

    throw error;
  }
}

test(
  'operational dashboard cannot manufacture Submitted status',
  function () {
    reset();

    seed('OFFERS', {
      'Offer ID':
        'OFF-DASHBOARD',
      'Deal ID':
        'DEAL-DASHBOARD',
      Status: 'Draft'
    });

    assert.throws(
      function () {
        dashboard.updateOfferStatus(
          'OFF-DASHBOARD',
          'Submitted',
          'Attempted dashboard submission.'
        );
      },
      /managed by OfferExecutionWorkflow/
    );

    assert.strictEqual(
      database.getAll(
        'OFFERS'
      )[0].Status,
      'Draft'
    );
  }
);

test(
  'operational dashboard may annotate without changing status',
  function () {
    reset();

    seed('OFFERS', {
      'Offer ID':
        'OFF-DASHBOARD-NOTE',
      'Deal ID':
        'DEAL-DASHBOARD-NOTE',
      Status: 'Draft',
      Notes: ''
    });

    const result =
      dashboard.updateOfferStatus(
        'OFF-DASHBOARD-NOTE',
        'Draft',
        'Review note only.'
      );

    assert.strictEqual(
      result.ok,
      true
    );

    const offer =
      database.getAll(
        'OFFERS'
      )[0];

    assert.strictEqual(
      offer.Status,
      'Draft'
    );

    assert.strictEqual(
      offer.Notes,
      'Review note only.'
    );
  }
);

test(
  'OFFERS row alone does not advance acquisition workflow to Offer Submitted',
  function () {
    reset();

    const dealId =
      'DEAL-OFFER-ONLY';

    seed('OFFERS', {
      'Offer ID':
        'OFF-OFFER-ONLY',
      'Deal ID': dealId,
      Status: 'Draft'
    });

    const result =
      acquisitionWorkflow.runForDeal(
        dealId
      );

    assert.strictEqual(
      result.Status,
      'Complete'
    );

    assert.strictEqual(
      stagesFor(dealId).indexOf(
        'Offer Submitted'
      ),
      -1
    );
  }
);

test(
  'Ready execution without submission does not advance pipeline',
  function () {
    reset();

    const dealId =
      'DEAL-READY-ONLY';

    seed(
      'OFFER_EXECUTION_QUEUE',
      {
        'Execution ID':
          'OEXEC-READY',
        'Deal ID': dealId,
        'Execution Status':
          'Ready',
        'Submitted At': ''
      }
    );

    acquisitionWorkflow.runForDeal(
      dealId
    );

    assert.strictEqual(
      stagesFor(dealId).indexOf(
        'Offer Submitted'
      ),
      -1
    );
  }
);

test(
  'forged Submitted execution without Submitted At does not advance pipeline',
  function () {
    reset();

    const dealId =
      'DEAL-FORGED-SUBMITTED';

    seed(
      'OFFER_EXECUTION_QUEUE',
      {
        'Execution ID':
          'OEXEC-FORGED-SUBMITTED',
        'Deal ID': dealId,
        'Execution Status':
          'Submitted',
        'Submitted At': ''
      }
    );

    acquisitionWorkflow.runForDeal(
      dealId
    );

    assert.strictEqual(
      stagesFor(dealId).indexOf(
        'Offer Submitted'
      ),
      -1
    );
  }
);

test(
  'real Submitted execution advances pipeline to Offer Submitted',
  function () {
    reset();

    const dealId =
      'DEAL-SUBMITTED';

    seed(
      'OFFER_EXECUTION_QUEUE',
      {
        'Execution ID':
          'OEXEC-SUBMITTED',
        'Deal ID': dealId,
        'Execution Status':
          'Submitted',
        'Submitted At':
          new Date()
      }
    );

    acquisitionWorkflow.runForDeal(
      dealId
    );

    assert.notStrictEqual(
      stagesFor(dealId).indexOf(
        'Offer Submitted'
      ),
      -1
    );
  }
);

test(
  'post-submission Countered execution retains submission authority signal',
  function () {
    reset();

    const dealId =
      'DEAL-COUNTERED';

    seed(
      'OFFER_EXECUTION_QUEUE',
      {
        'Execution ID':
          'OEXEC-COUNTERED',
        'Deal ID': dealId,
        'Execution Status':
          'Countered',
        'Submitted At':
          new Date()
      }
    );

    acquisitionWorkflow.runForDeal(
      dealId
    );

    assert.notStrictEqual(
      stagesFor(dealId).indexOf(
        'Offer Submitted'
      ),
      -1
    );
  }
);

console.log();

console.log(
  'Offer Lifecycle Authority contract validation PASSED.'
);
