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
const sentEvidence = Object.create(null);
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

    OfferDeliveryEvidence: {
      get: function (attemptId) {
        return sentEvidence[
          String(attemptId || '')
        ]
          ? clone(
              sentEvidence[
                String(attemptId || '')
              ]
            )
          : null;
      },

      isSentEvidence: function (attempt) {
        if (!attempt) return false;

        const authorityAt =
          new Date(
            attempt[
              'Send Authority Validated At'
            ] || ''
          );

        const sentAt =
          new Date(
            attempt['Sent At'] || ''
          );

        return !!(
          attempt[
            'Delivery Status'
          ] === 'Sent' &&
          attempt[
            'Evidence Type'
          ] &&
          attempt[
            'Evidence Reference'
          ] &&
          isFinite(
            authorityAt.getTime()
          ) &&
          isFinite(
            sentAt.getTime()
          ) &&
          sentAt.getTime() >=
            authorityAt.getTime()
        );
      }
    },

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
  clearObject(sentEvidence);
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

function seedSentEvidence(
  execution,
  overrides
) {
  const authorityAt =
    new Date(
      Date.now() - 1000
    );

  const sentAt =
    new Date();

  const row =
    Object.assign(
      {
        'Delivery Attempt ID':
          'ODEL-' +
          String(nextId++),
        'Execution ID':
          execution[
            'Execution ID'
          ],
        'Offer ID':
          execution[
            'Offer ID'
          ],
        'Deal ID':
          execution[
            'Deal ID'
          ],
        'Analysis ID':
          execution[
            'Analysis ID'
          ],
        'Qualified Queue ID':
          execution[
            'Qualified Queue ID'
          ],
        'Authority Source':
          execution[
            'Authority Source'
          ],
        'Delivery Method':
          'Email',
        'Recipient Name':
          'Seller',
        'Recipient Email':
          'seller@example.com',
        'Delivery Status':
          'Sent',
        'Send Authority Validated At':
          authorityAt,
        'Sent At':
          sentAt,
        'Evidence Type':
          'GMAIL_MESSAGE_ID',
        'Evidence Reference':
          'gmail-message-' +
          String(nextId++),
        'Document URL':
          ''
      },
      overrides || {}
    );

  sentEvidence[
    row[
      'Delivery Attempt ID'
    ]
  ] = clone(row);

  return clone(row);
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
      'Authority Validated At',
      'Delivery Attempt ID',
      'Delivery Evidence Type',
      'Delivery Evidence Reference'
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

test(
  'Sent delivery evidence finalizes submission',
  function () {
    resetRows();

    authorize(
      'QDQ-SUBMIT',
      'DEAL-SUBMIT',
      'ANL-SUBMIT'
    );

    seed('OFFERS', {
      'Offer ID': 'OFF-SUBMIT',
      'Deal ID': 'DEAL-SUBMIT',
      'Analysis ID': 'ANL-SUBMIT',
      'Qualified Queue ID': 'QDQ-SUBMIT',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft',
      'Offer Type': 'Cash',
      'Offer Amount': 125000
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    const evidence =
      seedSentEvidence(
        execution
      );

    const result =
      workflow.markSubmitted(
        execution[
          'Execution ID'
        ],
        {
          deliveryAttemptId:
            evidence[
              'Delivery Attempt ID'
            ],
          notes:
            'Evidence-backed submission.'
        }
      );

    assert.strictEqual(
      result.ok,
      true
    );

    const submitted =
      executions()[0];

    assert.strictEqual(
      submitted[
        'Execution Status'
      ],
      'Submitted'
    );

    assert.strictEqual(
      submitted[
        'Delivery Attempt ID'
      ],
      evidence[
        'Delivery Attempt ID'
      ]
    );

    assert.strictEqual(
      submitted[
        'Delivery Evidence Type'
      ],
      'GMAIL_MESSAGE_ID'
    );

    assert.strictEqual(
      submitted[
        'Delivery Evidence Reference'
      ],
      evidence[
        'Evidence Reference'
      ]
    );

    assert(
      submitted[
        'Submitted At'
      ]
    );

    assert.strictEqual(
      offers()[0].Status,
      'Submitted'
    );
  }
);

test(
  'authority revoked after genuine send does not block submission finalization',
  function () {
    resetRows();

    authorize(
      'QDQ-HISTORICAL-SEND',
      'DEAL-HISTORICAL-SEND',
      'ANL-HISTORICAL-SEND'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-HISTORICAL-SEND',
      'Deal ID':
        'DEAL-HISTORICAL-SEND',
      'Analysis ID':
        'ANL-HISTORICAL-SEND',
      'Qualified Queue ID':
        'QDQ-HISTORICAL-SEND',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    const evidence =
      seedSentEvidence(
        execution
      );

    authorities[
      'QDQ-HISTORICAL-SEND'
    ].active = false;

    const result =
      workflow.markSubmitted(
        execution[
          'Execution ID'
        ],
        {
          deliveryAttemptId:
            evidence[
              'Delivery Attempt ID'
            ]
        }
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Submitted'
    );
  }
);

test(
  'submission finalization uses historical send evidence when current validator disappears',
  function () {
    resetRows();

    authorize(
      'QDQ-SEND-HISTORY',
      'DEAL-SEND-HISTORY',
      'ANL-SEND-HISTORY'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-SEND-HISTORY',
      'Deal ID':
        'DEAL-SEND-HISTORY',
      'Analysis ID':
        'ANL-SEND-HISTORY',
      'Qualified Queue ID':
        'QDQ-SEND-HISTORY',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    const evidence =
      seedSentEvidence(
        execution
      );

    const saved =
      context.REOS
        .QualifiedDealQueue;

    context.REOS
      .QualifiedDealQueue = null;

    try {
      const result =
        workflow.markSubmitted(
          execution[
            'Execution ID'
          ],
          {
            deliveryAttemptId:
              evidence[
                'Delivery Attempt ID'
              ]
          }
        );

      assert.strictEqual(
        result.ok,
        true
      );
    } finally {
      context.REOS
        .QualifiedDealQueue =
          saved;
    }

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Submitted'
    );
  }
);

test(
  'submitted execution cannot be finalized a second time',
  function () {
    resetRows();

    authorize(
      'QDQ-ONE-SUBMIT',
      'DEAL-ONE-SUBMIT',
      'ANL-ONE-SUBMIT'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-ONE-SUBMIT',
      'Deal ID':
        'DEAL-ONE-SUBMIT',
      'Analysis ID':
        'ANL-ONE-SUBMIT',
      'Qualified Queue ID':
        'QDQ-ONE-SUBMIT',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    const evidence =
      seedSentEvidence(
        execution
      );

    workflow.markSubmitted(
      execution[
        'Execution ID'
      ],
      {
        deliveryAttemptId:
          evidence[
            'Delivery Attempt ID'
          ]
      }
    );

    assert.throws(
      function () {
        workflow.markSubmitted(
          execution[
            'Execution ID'
          ],
          {
            deliveryAttemptId:
              evidence[
                'Delivery Attempt ID'
              ]
          }
        );
      },
      /requires Ready execution status/
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Submitted'
    );
  }
);

test(
  'response tracking remains available after evidence-backed submission authority is revoked',
  function () {
    resetRows();

    authorize(
      'QDQ-RESPONSE',
      'DEAL-RESPONSE',
      'ANL-RESPONSE'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-RESPONSE',
      'Deal ID':
        'DEAL-RESPONSE',
      'Analysis ID':
        'ANL-RESPONSE',
      'Qualified Queue ID':
        'QDQ-RESPONSE',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft',
      'Offer Amount': 99000
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    const evidence =
      seedSentEvidence(
        execution
      );

    workflow.markSubmitted(
      execution[
        'Execution ID'
      ],
      {
        deliveryAttemptId:
          evidence[
            'Delivery Attempt ID'
          ]
      }
    );

    authorities[
      'QDQ-RESPONSE'
    ].active = false;

    const result =
      workflow.recordResponse(
        execution[
          'Execution ID'
        ],
        'Countered',
        'Seller counter received.'
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Countered'
    );

    assert.strictEqual(
      offers()[0].Status,
      'Countered'
    );
  }
);

test(
  'Ready execution cannot be marked Submitted without delivery evidence',
  function () {
    resetRows();

    authorize(
      'QDQ-NO-EVIDENCE',
      'DEAL-NO-EVIDENCE',
      'ANL-NO-EVIDENCE'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-NO-EVIDENCE',
      'Deal ID':
        'DEAL-NO-EVIDENCE',
      'Analysis ID':
        'ANL-NO-EVIDENCE',
      'Qualified Queue ID':
        'QDQ-NO-EVIDENCE',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    assert.throws(
      function () {
        workflow.markSubmitted(
          execution[
            'Execution ID'
          ],
          {}
        );
      },
      /Delivery Attempt ID is required/
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Ready'
    );
  }
);

test(
  'mismatched delivery provenance cannot finalize submission',
  function () {
    resetRows();

    authorize(
      'QDQ-MISMATCH',
      'DEAL-MISMATCH',
      'ANL-MISMATCH'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-MISMATCH',
      'Deal ID':
        'DEAL-MISMATCH',
      'Analysis ID':
        'ANL-MISMATCH',
      'Qualified Queue ID':
        'QDQ-MISMATCH',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    const evidence =
      seedSentEvidence(
        execution,
        {
          'Offer ID':
            'OFF-OTHER'
        }
      );

    assert.throws(
      function () {
        workflow.markSubmitted(
          execution[
            'Execution ID'
          ],
          {
            deliveryAttemptId:
              evidence[
                'Delivery Attempt ID'
              ]
          }
        );
      },
      /provenance mismatch/
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Ready'
    );
  }
);

test(
  'Ready execution cannot record a response before submission',
  function () {
    resetRows();

    authorize(
      'QDQ-NO-EARLY-RESPONSE',
      'DEAL-NO-EARLY-RESPONSE',
      'ANL-NO-EARLY-RESPONSE'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-NO-EARLY-RESPONSE',
      'Deal ID':
        'DEAL-NO-EARLY-RESPONSE',
      'Analysis ID':
        'ANL-NO-EARLY-RESPONSE',
      'Qualified Queue ID':
        'QDQ-NO-EARLY-RESPONSE',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    assert.strictEqual(
      execution['Execution Status'],
      'Ready'
    );

    assert.throws(
      function () {
        workflow.recordResponse(
          execution['Execution ID'],
          'Accepted',
          'Must not bypass submission.'
        );
      },
      /previously submitted execution/
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Ready'
    );

    assert.strictEqual(
      offers()[0].Status,
      'Ready'
    );
  }
);

test(
  'forged Submitted status without Submitted At cannot record response',
  function () {
    resetRows();

    seed(
      'OFFER_EXECUTION_QUEUE',
      {
        'Execution ID':
          'OEXEC-FORGED',
        'Offer ID':
          'OFF-FORGED',
        'Deal ID':
          'DEAL-FORGED',
        'Execution Status':
          'Submitted',
        'Submitted At': ''
      }
    );

    assert.throws(
      function () {
        workflow.recordResponse(
          'OEXEC-FORGED',
          'Accepted',
          'Forged lifecycle.'
        );
      },
      /valid Submitted At timestamp/
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Submitted'
    );
  }
);

test(
  'Countered execution may record a later response after submission',
  function () {
    resetRows();

    authorize(
      'QDQ-MULTI-RESPONSE',
      'DEAL-MULTI-RESPONSE',
      'ANL-MULTI-RESPONSE'
    );

    seed('OFFERS', {
      'Offer ID':
        'OFF-MULTI-RESPONSE',
      'Deal ID':
        'DEAL-MULTI-RESPONSE',
      'Analysis ID':
        'ANL-MULTI-RESPONSE',
      'Qualified Queue ID':
        'QDQ-MULTI-RESPONSE',
      'Authority Source':
        'QUALIFIED_DEAL_QUEUE',
      Status: 'Draft'
    });

    workflow.buildQueue({
      maxItems: 10
    });

    const execution =
      executions()[0];

    const evidence =
      seedSentEvidence(
        execution
      );

    workflow.markSubmitted(
      execution[
        'Execution ID'
      ],
      {
        deliveryAttemptId:
          evidence[
            'Delivery Attempt ID'
          ]
      }
    );

    workflow.recordResponse(
      execution['Execution ID'],
      'Countered',
      'Seller countered.'
    );

    const accepted =
      workflow.recordResponse(
        execution['Execution ID'],
        'Accepted',
        'Counter accepted.'
      );

    assert.strictEqual(
      accepted.ok,
      true
    );

    assert.strictEqual(
      executions()[0][
        'Execution Status'
      ],
      'Accepted'
    );

    assert.strictEqual(
      offers()[0].Status,
      'Accepted'
    );
  }
);

console.log();
console.log(
  'Offer Execution Authority contract validation PASSED.'
);
