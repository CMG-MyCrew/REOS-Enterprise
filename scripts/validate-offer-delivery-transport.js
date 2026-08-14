#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const evidenceSource =
  fs.readFileSync(
    path.resolve(
      __dirname,
      '../build/apps-script-brand/OfferDeliveryEvidence.js'
    ),
    'utf8'
  );

const transportSource =
  fs.readFileSync(
    path.resolve(
      __dirname,
      '../build/apps-script-brand/OfferDeliveryTransport.js'
    ),
    'utf8'
  );

let evidenceRows = [];
let executionRows = [];
let headers = [];
let nextId = 1;

let authorityCalls = 0;
let revokeOnAuthorityCall = 0;

let draftsCreated = 0;
let draftsSent = 0;
let draftsDeleted = 0;

let draftCreationError = null;
let sendError = null;
let messageIdError = null;

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

  getRange() {
    return {
      setValues(values) {
        (values[0] || [])
          .forEach(function (header) {
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

    return evidenceRows.map(
      clone
    );
  },

  insert(
    table,
    record,
    options
  ) {
    const created =
      clone(record);

    created[
      options.idField
    ] =
      options.idPrefix +
      '-' +
      String(nextId++);

    evidenceRows.push(
      created
    );

    return clone(
      created
    );
  },

  update(
    table,
    idField,
    idValue,
    changes
  ) {
    const collection =
      table ===
      'OFFER_EXECUTION_QUEUE'
        ? executionRows
        : evidenceRows;

    const row =
      collection.find(
        function (item) {
          return String(
            item[idField] || ''
          ) === String(
            idValue || ''
          );
        }
      );

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
        : evidenceRows;

    const row =
      collection.find(
        function (item) {
          return String(
            item[idField] || ''
          ) === String(
            idValue || ''
          );
        }
      );

    return row
      ? clone(row)
      : null;
  }
};

function authorityResult(
  reference
) {
  authorityCalls++;

  const revoked =
    revokeOnAuthorityCall > 0 &&
    authorityCalls >=
      revokeOnAuthorityCall;

  return {
    ok: true,
    authorized:
      !revoked,
    reason:
      revoked
        ? 'Qualified authority revoked.'
        : 'Active authority.',
    reference:
      clone(reference)
  };
}

function createDraft(
  recipient,
  subject,
  body
) {
  draftsCreated++;

  if (draftCreationError) {
    throw new Error(
      draftCreationError
    );
  }

  const active =
    evidenceRows[
      evidenceRows.length - 1
    ];

  assert.strictEqual(
    active[
      'Delivery Status'
    ],
    'Sending',
    'Delivery attempt must be persisted as Sending before Gmail draft creation.'
  );

  const draftId =
    'draft-' +
    String(draftsCreated);

  return {
    getId() {
      return draftId;
    },

    deleteDraft() {
      draftsDeleted++;
    },

    send() {
      draftsSent++;

      if (sendError) {
        throw new Error(
          sendError
        );
      }

      return {
        getId() {
          if (messageIdError) {
            throw new Error(
              messageIdError
            );
          }

          return (
            'gmail-message-' +
            String(draftsSent)
          );
        }
      };
    }
  };
}

const context = {
  REOS: {
    Database,

    normalizeEmail_(value) {
      return String(
        value || ''
      ).trim().toLowerCase();
    },

    QualifiedDealQueue: {
      validateAuthority:
        authorityResult
    }
  },

  GmailApp: {
    createDraft
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

vm.createContext(
  context
);

vm.runInContext(
  evidenceSource,
  context
);

vm.runInContext(
  transportSource,
  context
);

const evidence =
  context.REOS
    .OfferDeliveryEvidence;

const transport =
  context.REOS
    .OfferDeliveryTransport;

function reset() {
  evidenceRows = [];
  executionRows = [];
  headers = [];
  nextId = 1;

  authorityCalls = 0;
  revokeOnAuthorityCall = 0;

  draftsCreated = 0;
  draftsSent = 0;
  draftsDeleted = 0;

  draftCreationError = null;
  sendError = null;
  messageIdError = null;

  executionRows.push({
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
  });
}

function deliver(
  overrides
) {
  return transport.deliverEmail(
    'OEXEC-1',
    Object.assign(
      {
        subject:
          'Offer for 123 Main Street',
        body:
          'Please review the acquisition offer.'
      },
      overrides || {}
    )
  );
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
  'email delivery requires subject',
  function () {
    assert.throws(
      function () {
        deliver({
          subject: ''
        });
      },
      /Email subject is required/
    );

    assert.strictEqual(
      draftsCreated,
      0
    );
  }
);

test(
  'email delivery requires body',
  function () {
    assert.throws(
      function () {
        deliver({
          body: ''
        });
      },
      /Email body is required/
    );

    assert.strictEqual(
      draftsCreated,
      0
    );
  }
);

test(
  'email subject is capped at Gmail limit',
  function () {
    assert.throws(
      function () {
        deliver({
          subject:
            'x'.repeat(251)
        });
      },
      /cannot exceed 250/
    );

    assert.strictEqual(
      draftsCreated,
      0
    );
  }
);

test(
  'delivery is persisted as Sending before Gmail side effect',
  function () {
    deliver();

    assert.strictEqual(
      draftsCreated,
      1
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Sent'
    );
  }
);

test(
  'authority is revalidated immediately before send',
  function () {
    deliver();

    assert.strictEqual(
      authorityCalls,
      2,
      'Expected prepare-time validation plus pre-send validation.'
    );

    assert.strictEqual(
      draftsSent,
      1
    );
  }
);

test(
  'revoked authority before send deletes draft and records Failed',
  function () {
    revokeOnAuthorityCall = 2;

    assert.throws(
      function () {
        deliver();
      },
      /blocked before send/
    );

    assert.strictEqual(
      draftsCreated,
      1
    );

    assert.strictEqual(
      draftsSent,
      0
    );

    assert.strictEqual(
      draftsDeleted,
      1
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Failed'
    );
  }
);

test(
  'Gmail draft creation failure is definite Failed evidence',
  function () {
    draftCreationError =
      'Draft service unavailable.';

    assert.throws(
      function () {
        deliver();
      },
      /failed before send/
    );

    assert.strictEqual(
      draftsSent,
      0
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Failed'
    );
  }
);

test(
  'Gmail send exception becomes Uncertain and is not auto-retried',
  function () {
    sendError =
      'Transport timeout.';

    assert.throws(
      function () {
        deliver();
      },
      /outcome is uncertain/
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Uncertain'
    );

    assert.throws(
      function () {
        deliver();
      },
      /Do not retry automatically/
    );

    assert.strictEqual(
      draftsSent,
      1
    );
  }
);

test(
  'missing Gmail message ID after send becomes Uncertain',
  function () {
    messageIdError =
      'Message ID unavailable.';

    assert.throws(
      function () {
        deliver();
      },
      /evidence could not be captured/
    );

    assert.strictEqual(
      draftsSent,
      1
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Uncertain'
    );
  }
);

test(
  'successful Gmail delivery records durable message ID evidence',
  function () {
    const result =
      deliver();

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.sent,
      true
    );

    assert.strictEqual(
      result.idempotent,
      false
    );

    assert.strictEqual(
      result.messageId,
      'gmail-message-1'
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Sent'
    );

    assert.strictEqual(
      evidenceRows[0][
        'Evidence Type'
      ],
      'GMAIL_MESSAGE_ID'
    );

    assert.strictEqual(
      evidenceRows[0][
        'Evidence Reference'
      ],
      'gmail-message-1'
    );

    assert.ok(
      evidenceRows[0][
        'Sent At'
      ]
    );
  }
);

test(
  'successful delivery is idempotent and does not send twice',
  function () {
    const first =
      deliver();

    const second =
      deliver();

    assert.strictEqual(
      first.sent,
      true
    );

    assert.strictEqual(
      second.sent,
      true
    );

    assert.strictEqual(
      second.idempotent,
      true
    );

    assert.strictEqual(
      draftsCreated,
      1
    );

    assert.strictEqual(
      draftsSent,
      1
    );

    assert.strictEqual(
      evidenceRows.length,
      1
    );
  }
);

test(
  'existing Sending attempt blocks duplicate external send',
  function () {
    const prepared =
      evidence.prepare(
        'OEXEC-1',
        {
          method:
            'Email'
        }
      ).record;

    evidence.markSending(
      prepared[
        'Delivery Attempt ID'
      ],
      {}
    );

    assert.throws(
      function () {
        deliver();
      },
      /already Sending/
    );

    assert.strictEqual(
      draftsCreated,
      0
    );
  }
);

test(
  'existing Failed attempt requires explicit new idempotency key',
  function () {
    const prepared =
      evidence.prepare(
        'OEXEC-1',
        {
          method:
            'Email'
        }
      ).record;

    evidence.markSending(
      prepared[
        'Delivery Attempt ID'
      ],
      {}
    );

    evidence.recordFailed(
      prepared[
        'Delivery Attempt ID'
      ],
      {
        error:
          'Known transport failure.'
      }
    );

    assert.throws(
      function () {
        deliver();
      },
      /explicit new idempotency key/
    );

    assert.strictEqual(
      draftsCreated,
      0
    );
  }
);

test(
  'email transport does not manufacture Submitted execution state',
  function () {
    deliver();

    assert.strictEqual(
      executionRows[0][
        'Execution Status'
      ],
      'Ready'
    );

    assert.strictEqual(
      /markSubmitted/.test(
        transportSource
      ),
      false
    );

    assert.strictEqual(
      /['"]Execution Status['"]\s*:\s*['"]Submitted['"]/
        .test(
          transportSource
        ),
      false
    );
  }
);


test(
  'successful delivery cannot be bypassed with alternate idempotency key',
  function () {
    const first =
      deliver();

    assert.strictEqual(
      first.sent,
      true
    );

    assert.throws(
      function () {
        deliver({
          idempotencyKey:
            'second-send-key'
        });
      },
      /second delivery attempt is not allowed/
    );

    assert.strictEqual(
      draftsCreated,
      1
    );

    assert.strictEqual(
      draftsSent,
      1
    );

    assert.strictEqual(
      evidenceRows.length,
      1
    );
  }
);

test(
  'Uncertain send cannot be bypassed with alternate idempotency key',
  function () {
    sendError =
      'Transport timeout.';

    assert.throws(
      function () {
        deliver();
      },
      /outcome is uncertain/
    );

    sendError = null;

    assert.throws(
      function () {
        deliver({
          idempotencyKey:
            'unsafe-retry-key'
        });
      },
      /second delivery attempt is not allowed/
    );

    assert.strictEqual(
      draftsSent,
      1
    );

    assert.strictEqual(
      evidenceRows.length,
      1
    );
  }
);

test(
  'definite Failed delivery may retry with explicit new idempotency key',
  function () {
    draftCreationError =
      'Draft service unavailable.';

    assert.throws(
      function () {
        deliver();
      },
      /failed before send/
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Failed'
    );

    draftCreationError = null;

    assert.throws(
      function () {
        deliver();
      },
      /explicit new idempotency key/
    );

    const retry =
      deliver({
        idempotencyKey:
          'retry-after-definite-failure'
      });

    assert.strictEqual(
      retry.ok,
      true
    );

    assert.strictEqual(
      retry.sent,
      true
    );

    assert.strictEqual(
      draftsSent,
      1
    );

    assert.strictEqual(
      evidenceRows.length,
      2
    );

    assert.strictEqual(
      evidenceRows[0][
        'Delivery Status'
      ],
      'Failed'
    );

    assert.strictEqual(
      evidenceRows[1][
        'Delivery Status'
      ],
      'Sent'
    );
  }
);

console.log();
console.log(
  'Offer Delivery Transport contract validation PASSED.'
);
