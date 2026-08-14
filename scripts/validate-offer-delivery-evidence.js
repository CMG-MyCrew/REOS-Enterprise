#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
  path.resolve(
    __dirname,
    '../build/apps-script-brand/OfferDeliveryEvidence.js'
  ),
  'utf8'
);

let rows = [];
let executionRows = [];

let headers = [
  'Delivery Attempt ID',
  'Execution ID'
];
let nextId = 1;

const authorized = new Set();

function clone(value) {
  return Object.assign(
    {},
    value || {}
  );
}

const fakeSheet = {
  getLastColumn() {
    return headers.length;
  },

  getRange(
    row,
    column,
    rowCount,
    columnCount
  ) {
    return {
      setValues(values) {
        const incoming =
          values[0] || [];

        incoming.forEach(function (header) {
          if (
            headers.indexOf(header) === -1
          ) {
            headers.push(header);
          }
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
  }
};

const Database = {
  ensureTable() {
    return fakeSheet;
  },

  getHeaders() {
    return headers.slice();
  },

  getAll(table) {
    if (
      table ===
      'OFFER_EXECUTION_QUEUE'
    ) {
      return executionRows.map(
        clone
      );
    }

    return rows.map(clone);
  },

  insert(
    table,
    record,
    options
  ) {
    const created =
      clone(record);

    const idField =
      options.idField;

    created[idField] =
      options.idPrefix +
      '-' +
      String(nextId++);

    rows.push(created);

    return clone(created);
  },

  update(
    table,
    idField,
    idValue,
    changes
  ) {
    const row =
      rows.find(function (item) {
        return String(
          item[idField] || ''
        ) === String(
          idValue || ''
        );
      });

    if (!row) {
      throw new Error(
        'Row not found: ' +
        idValue
      );
    }

    Object.assign(
      row,
      changes || {}
    );

    return clone(row);
  },

  findById(
    table,
    idField,
    idValue
  ) {
    const collection =
      table ===
      'OFFER_EXECUTION_QUEUE'
        ? executionRows
        : rows;

    const row =
      collection.find(function (item) {
        return String(
          item[idField] || ''
        ) === String(
          idValue || ''
        );
      });

    return row
      ? clone(row)
      : null;
  }
};

const context = {
  REOS: {
    Database,

    normalizeEmail_: function (value) {
      return String(
        value || ''
      ).trim().toLowerCase();
    },

    QualifiedDealQueue: {
      validateAuthority(reference) {
        const key = [
          reference.queueId,
          reference.dealId,
          reference.analysisId
        ].join('|');

        return {
          ok: true,
          authorized:
            authorized.has(key),
          reason:
            authorized.has(key)
              ? 'Active authority.'
              : 'Authority revoked or missing.'
        };
      }
    }
  },

  Session: {
    getActiveUser() {
      return {
        getEmail() {
          return 'tester@example.com';
        }
      };
    }
  },

  console,
  Date,
  JSON,
  String,
  Number,
  Array,
  Object,
  Error,
  Math,
  isFinite
};

vm.createContext(context);
vm.runInContext(
  source,
  context
);

const delivery =
  context.REOS.OfferDeliveryEvidence;

function reset() {
  rows = [];
  executionRows = [];

  headers = [
    'Delivery Attempt ID',
    'Execution ID'
  ];
  nextId = 1;
  authorized.clear();
}

function authorize(execution) {
  authorized.add(
    [
      execution['Qualified Queue ID'],
      execution['Deal ID'],
      execution['Analysis ID']
    ].join('|')
  );
}

function readyExecution(
  overrides
) {
  const execution =
    Object.assign(
      {
        'Execution ID':
          'OEXEC-1',
        'Offer ID':
          'OFF-1',
        'Deal ID':
          'DEAL-1',
        'Analysis ID':
          'ANL-1',
        'Qualified Queue ID':
          'QDQ-1',
        'Authority Source':
          'QUALIFIED_DEAL_QUEUE',
        'Execution Status':
          'Ready',
        'Recipient Name':
          'Seller One',
        'Recipient Email':
          'seller@example.com',
        'Submission Method':
          'Email',
        'Published Document URL':
          ''
      },
      overrides || {}
    );

  executionRows.push(
    clone(execution)
  );

  return execution;
}

function test(
  name,
  fn
) {
  try {
    reset();
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
  'existing delivery ledger gains required evidence columns',
  function () {
    delivery.ensureSheet();

    [
      'Qualified Queue ID',
      'Authority Source',
      'Authority Validated At',
      'Delivery Method',
      'Idempotency Key',
      'Delivery Status',
      'Attempted At',
      'Sent At',
      'Evidence Type',
      'Evidence Reference',
      'Error'
    ].forEach(function (header) {
      assert(
        headers.indexOf(header) !== -1,
        'Missing header: ' +
          header
      );
    });
  }
);

test(
  'delivery preparation requires a persisted execution row',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    /*
     * Remove the persisted execution while retaining the caller's
     * local object. The evidence layer must fail closed.
     */
    executionRows = [];

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {}
        );
      },
      /Offer execution not found/
    );

    assert.strictEqual(
      rows.length,
      0
    );
  }
);

test(
  'delivery preparation requires Ready execution',
  function () {
    const execution =
      readyExecution({
        'Execution Status':
          'Submitted'
      });

    authorize(execution);

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {}
        );
      },
      /requires Ready execution status/
    );

    assert.strictEqual(
      rows.length,
      0
    );
  }
);

test(
  'delivery preparation requires complete authority provenance',
  function () {
    const execution =
      readyExecution({
        'Qualified Queue ID':
          ''
      });

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {}
        );
      },
      /Qualified Queue ID is required/
    );

    assert.strictEqual(
      rows.length,
      0
    );
  }
);

test(
  'revoked authority cannot prepare delivery',
  function () {
    const execution =
      readyExecution();

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {}
        );
      },
      /Authority revoked or missing/
    );

    assert.strictEqual(
      rows.length,
      0
    );
  }
);

test(
  'authorized Ready execution creates Prepared delivery evidence row',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const result =
      delivery.prepare(
          execution['Execution ID'],
        {}
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.created,
      true
    );

    assert.strictEqual(
      rows.length,
      1
    );

    assert.strictEqual(
      rows[0]['Delivery Status'],
      'Prepared'
    );

    assert.strictEqual(
      rows[0]['Execution ID'],
      execution['Execution ID']
    );

    assert.strictEqual(
      rows[0]['Qualified Queue ID'],
      execution['Qualified Queue ID']
    );

    assert.strictEqual(
      rows[0]['Authority Source'],
      'QUALIFIED_DEAL_QUEUE'
    );

    assert.ok(
      rows[0]['Authority Validated At']
    );

    assert.ok(
      rows[0]['Idempotency Key']
    );

    assert.strictEqual(
      rows[0]['Sent At'],
      ''
    );
  }
);

test(
  'delivery preparation is idempotent for the same execution target',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const first =
      delivery.prepare(
          execution['Execution ID'],
        {}
      );

    const second =
      delivery.prepare(
          execution['Execution ID'],
        {}
      );

    assert.strictEqual(
      first.created,
      true
    );

    assert.strictEqual(
      second.created,
      false
    );

    assert.strictEqual(
      rows.length,
      1
    );

    assert.strictEqual(
      first.record[
        'Delivery Attempt ID'
      ],
      second.record[
        'Delivery Attempt ID'
      ]
    );
  }
);

test(
  'unsupported delivery methods fail closed',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {
            method:
              'Portal'
          }
        );
      },
      /Unsupported delivery method/
    );

    assert.strictEqual(
      rows.length,
      0
    );
  }
);

test(
  'email delivery requires a valid recipient email',
  function () {
    const execution =
      readyExecution({
        'Recipient Email':
          ''
      });

    authorize(execution);

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {
            method:
              'Email'
          }
        );
      },
      /valid Recipient Email/
    );

    assert.strictEqual(
      rows.length,
      0
    );
  }
);

test(
  'Prepared attempt cannot jump directly to Sent',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const prepared =
      delivery.prepare(
          execution['Execution ID'],
        {}
      ).record;

    assert.throws(
      function () {
        delivery.recordSent(
          prepared[
            'Delivery Attempt ID'
          ],
          {
            type:
              'TEST',
            reference:
              'proof-1'
          }
        );
      },
      /Invalid delivery transition/
    );
  }
);

test(
  'Prepared attempt transitions to Sending before side effect',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const prepared =
      delivery.prepare(
          execution['Execution ID'],
        {}
      ).record;

    const sending =
      delivery.markSending(
        prepared[
          'Delivery Attempt ID'
        ],
        {}
      ).record;

    assert.strictEqual(
      sending[
        'Delivery Status'
      ],
      'Sending'
    );

    assert.ok(
      sending[
        'Attempted At'
      ]
    );
  }
);

test(
  'Sent transition requires durable evidence',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const attemptId =
      delivery.prepare(
          execution['Execution ID'],
        {}
      ).record[
        'Delivery Attempt ID'
      ];

    delivery.markSending(
      attemptId,
      {}
    );

    assert.throws(
      function () {
        delivery.recordSent(
          attemptId,
          {}
        );
      },
      /Evidence Type is required/
    );
  }
);

test(
  'Sending attempt with durable evidence becomes Sent',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const attemptId =
      delivery.prepare(
          execution['Execution ID'],
        {}
      ).record[
        'Delivery Attempt ID'
      ];

    delivery.markSending(
      attemptId,
      {}
    );

    const sent =
      delivery.recordSent(
        attemptId,
        {
          type:
            'GMAIL_SEND',
          reference:
            'gmail-send:' +
            attemptId
        }
      ).record;

    assert.strictEqual(
      sent[
        'Delivery Status'
      ],
      'Sent'
    );

    assert.ok(
      sent[
        'Sent At'
      ]
    );

    assert.strictEqual(
      sent[
        'Evidence Type'
      ],
      'GMAIL_SEND'
    );

    assert.strictEqual(
      delivery.isSentEvidence(
        sent
      ),
      true
    );
  }
);

test(
  'Failed and Uncertain attempts are not sent evidence',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const failedId =
      delivery.prepare(
          execution['Execution ID'],
        {
          idempotencyKey:
            'failed-attempt'
        }
      ).record[
        'Delivery Attempt ID'
      ];

    delivery.markSending(
      failedId,
      {}
    );

    const failed =
      delivery.recordFailed(
        failedId,
        {
          error:
            'Transport failure.'
        }
      ).record;

    assert.strictEqual(
      delivery.isSentEvidence(
        failed
      ),
      false
    );

    const uncertainId =
      delivery.prepare(
          execution['Execution ID'],
        {
          idempotencyKey:
            'uncertain-attempt'
        }
      ).record[
        'Delivery Attempt ID'
      ];

    delivery.markSending(
      uncertainId,
      {}
    );

    const uncertain =
      delivery.recordUncertain(
        uncertainId,
        {
          notes:
            'Transport outcome unknown.'
        }
      ).record;

    assert.strictEqual(
      delivery.isSentEvidence(
        uncertain
      ),
      false
    );
  }
);

test(
  'Sent attempt is terminal and cannot be sent twice',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const attemptId =
      delivery.prepare(
          execution['Execution ID'],
        {}
      ).record[
        'Delivery Attempt ID'
      ];

    delivery.markSending(
      attemptId,
      {}
    );

    delivery.recordSent(
      attemptId,
      {
        type:
          'GMAIL_SEND',
        reference:
          'proof-final'
      }
    );

    assert.throws(
      function () {
        delivery.recordSent(
          attemptId,
          {
            type:
              'GMAIL_SEND',
            reference:
              'duplicate'
          }
        );
      },
      /Invalid delivery transition/
    );
  }
);


test(
  'Sent evidence cannot be bypassed with a different idempotency key',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const attemptId =
      delivery.prepare(
        execution['Execution ID'],
        {}
      ).record[
        'Delivery Attempt ID'
      ];

    delivery.markSending(
      attemptId,
      {}
    );

    delivery.recordSent(
      attemptId,
      {
        type:
          'GMAIL_MESSAGE_ID',
        reference:
          'gmail-message-original'
      }
    );

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {
            method:
              'Email',
            idempotencyKey:
              'alternate-key'
          }
        );
      },
      /second delivery attempt is not allowed/
    );

    assert.strictEqual(
      rows.length,
      1
    );
  }
);

test(
  'Uncertain evidence cannot be bypassed with a different idempotency key',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const attemptId =
      delivery.prepare(
        execution['Execution ID'],
        {}
      ).record[
        'Delivery Attempt ID'
      ];

    delivery.markSending(
      attemptId,
      {}
    );

    delivery.recordUncertain(
      attemptId,
      {
        notes:
          'Transport result unknown.'
      }
    );

    assert.throws(
      function () {
        delivery.prepare(
          execution['Execution ID'],
          {
            method:
              'Email',
            idempotencyKey:
              'alternate-uncertain-key'
          }
        );
      },
      /second delivery attempt is not allowed/
    );

    assert.strictEqual(
      rows.length,
      1
    );
  }
);

test(
  'definite Failed evidence allows explicit new delivery attempt',
  function () {
    const execution =
      readyExecution();

    authorize(execution);

    const first =
      delivery.prepare(
        execution['Execution ID'],
        {}
      ).record;

    delivery.markSending(
      first[
        'Delivery Attempt ID'
      ],
      {}
    );

    delivery.recordFailed(
      first[
        'Delivery Attempt ID'
      ],
      {
        error:
          'Known transport failure.'
      }
    );

    const same =
      delivery.prepare(
        execution['Execution ID'],
        {}
      );

    assert.strictEqual(
      same.created,
      false
    );

    assert.strictEqual(
      same.record[
        'Delivery Status'
      ],
      'Failed'
    );

    const retry =
      delivery.prepare(
        execution['Execution ID'],
        {
          method:
            'Email',
          idempotencyKey:
            'explicit-retry-key'
        }
      );

    assert.strictEqual(
      retry.created,
      true
    );

    assert.strictEqual(
      retry.record[
        'Delivery Status'
      ],
      'Prepared'
    );

    assert.strictEqual(
      rows.length,
      2
    );
  }
);

console.log();
console.log(
  'Offer Delivery Evidence contract validation PASSED.'
);
