/**
 * REOS Enterprise
 * Deal Increment 6 — Controlled Offer Delivery
 *
 * Persistent delivery-attempt ledger.
 *
 * This module does NOT perform an external delivery and does NOT
 * mark an offer Submitted. It establishes the evidence contract
 * that future delivery adapters must satisfy.
 */
var REOS = REOS || {};

REOS.OfferDeliveryEvidence = (function () {
  var TABLE = 'OFFER_DELIVERY_ATTEMPTS';

  var STATUS = {
    PREPARED: 'Prepared',
    SENDING: 'Sending',
    SENT: 'Sent',
    FAILED: 'Failed',
    UNCERTAIN: 'Uncertain'
  };

  var METHODS = [
    'Email',
    'Manual'
  ];

  var HEADERS = [
    'Delivery Attempt ID',
    'Execution ID',
    'Offer ID',
    'Deal ID',
    'Analysis ID',
    'Qualified Queue ID',
    'Authority Source',
    'Authority Validated At',
    'Delivery Method',
    'Recipient Name',
    'Recipient Email',
    'Document URL',
    'Idempotency Key',
    'Delivery Status',
    'Attempted At',
    'Send Authority Validated At',
    'Sent At',
    'Evidence Type',
    'Evidence Reference',
    'Error',
    'Notes',
    'Created By',
    'Created At',
    'Updated At'
  ];

  function ensureSheet() {
    ensureColumns_(
      TABLE,
      HEADERS
    );

    return {
      ok: true,
      table: TABLE,
      statuses: Object.keys(STATUS).map(function (key) {
        return STATUS[key];
      }),
      methods: METHODS.slice()
    };
  }

  function ensureColumns_(
    sheetName,
    requiredHeaders
  ) {
    var sheet =
      REOS.Database.ensureTable(
        sheetName,
        requiredHeaders
      );

    var existing =
      REOS.Database.getHeaders(
        sheetName
      ) || [];

    var missing =
      requiredHeaders.filter(
        function (header) {
          return existing.indexOf(header) === -1;
        }
      );

    if (missing.length) {
      var startColumn =
        Math.max(
          sheet.getLastColumn(),
          existing.length,
          0
        ) + 1;

      sheet
        .getRange(
          1,
          startColumn,
          1,
          missing.length
        )
        .setValues([missing])
        .setFontWeight('bold')
        .setWrap(true);
    }

    return sheet;
  }

  /**
   * Creates the durable intent/evidence row for one delivery attempt.
   *
   * Preparing an attempt is not proof that anything was sent.
   * External side effects are introduced by later Increment 6 work.
   */
  function prepare(executionId, details) {
    ensureSheet();

    details = details || {};

    requireText_(
      executionId,
      'Execution ID'
    );

    /*
     * Never trust caller-supplied execution provenance.
     *
     * Delivery evidence must originate from the persisted
     * OFFER_EXECUTION_QUEUE record that already passed the
     * Increment 5 execution-authority boundary.
     */
    var execution =
      REOS.Database.findById(
        'OFFER_EXECUTION_QUEUE',
        'Execution ID',
        String(executionId || '')
      );

    if (!execution) {
      throw new Error(
        'Offer execution not found: ' +
        executionId
      );
    }

    requireText_(
      execution['Offer ID'],
      'Offer ID'
    );

    requireText_(
      execution['Deal ID'],
      'Deal ID'
    );

    requireText_(
      execution['Analysis ID'],
      'Analysis ID'
    );

    requireText_(
      execution['Qualified Queue ID'],
      'Qualified Queue ID'
    );

    if (
      String(
        execution['Execution Status'] || ''
      ) !== 'Ready'
    ) {
      throw new Error(
        'Delivery preparation requires Ready execution status.'
      );
    }

    validateAuthority_(execution);

    var method =
      normalizeMethod_(
        details.method ||
        execution['Submission Method'] ||
        'Email'
      );

    var recipientName =
      String(
        details.recipientName ||
        execution['Recipient Name'] ||
        ''
      ).trim();

    var persistedRecipientEmail =
      normalizeEmail_(
        execution['Recipient Email'] ||
        ''
      );

    var requestedRecipientEmail =
      normalizeEmail_(
        details.recipientEmail ||
        ''
      );

    if (
      method === 'Email' &&
      requestedRecipientEmail &&
      requestedRecipientEmail !==
        persistedRecipientEmail
    ) {
      throw new Error(
        'Email recipient override is not allowed. Use the persisted execution Recipient Email.'
      );
    }

    var recipientEmail =
      method === 'Email'
        ? persistedRecipientEmail
        : normalizeEmail_(
            details.recipientEmail ||
            execution['Recipient Email'] ||
            ''
          );

    if (
      method === 'Email' &&
      !isValidEmail_(recipientEmail)
    ) {
      throw new Error(
        'Email delivery requires a valid Recipient Email.'
      );
    }

    var documentUrl =
      String(
        details.documentUrl ||
        execution['Published Document URL'] ||
        ''
      ).trim();

    var idempotencyKey =
      String(
        details.idempotencyKey ||
        buildIdempotencyKey_(
          execution,
          method,
          recipientEmail,
          documentUrl
        )
      ).trim();

    requireText_(
      idempotencyKey,
      'Idempotency Key'
    );

    var existing =
      findByIdempotencyKey_(
        idempotencyKey
      );

    if (existing) {
      return {
        ok: true,
        created: false,
        record: clean_(existing)
      };
    }

    /*
     * Deal Increment 6 — duplicate-delivery boundary.
     *
     * One execution may have only one active, successful, or
     * uncertain delivery chain. Supplying a different idempotency
     * key must never become a way to send the same execution twice.
     *
     * A definite Failed attempt may be retried, but only through an
     * explicitly new idempotency key.
     */
    var executionAttempts =
      safeAll_().filter(
        function (row) {
          return String(
            row['Execution ID'] || ''
          ) === String(
            execution['Execution ID'] || ''
          );
        }
      );

    var blockingAttempt =
      executionAttempts.filter(
        function (row) {
          return [
            STATUS.PREPARED,
            STATUS.SENDING,
            STATUS.SENT,
            STATUS.UNCERTAIN
          ].indexOf(
            String(
              row['Delivery Status'] || ''
            )
          ) !== -1;
        }
      )[0] || null;

    if (blockingAttempt) {
      throw new Error(
        'Execution already has ' +
        String(
          blockingAttempt['Delivery Status'] || ''
        ) +
        ' delivery evidence. A second delivery attempt is not allowed.'
      );
    }

    var hasFailedAttempt =
      executionAttempts.some(
        function (row) {
          return String(
            row['Delivery Status'] || ''
          ) === STATUS.FAILED;
        }
      );

    if (
      hasFailedAttempt &&
      !String(
        details.idempotencyKey || ''
      ).trim()
    ) {
      throw new Error(
        'Retry after Failed delivery requires an explicit new Idempotency Key.'
      );
    }

    var now = new Date();

    var created =
      REOS.Database.insert(
        TABLE,
        {
          'Execution ID':
            execution['Execution ID'],
          'Offer ID':
            execution['Offer ID'],
          'Deal ID':
            execution['Deal ID'],
          'Analysis ID':
            execution['Analysis ID'],
          'Qualified Queue ID':
            execution['Qualified Queue ID'],
          'Authority Source':
            execution['Authority Source'],
          'Authority Validated At':
            now,
          'Delivery Method':
            method,
          'Recipient Name':
            recipientName,
          'Recipient Email':
            recipientEmail,
          'Document URL':
            documentUrl,
          'Idempotency Key':
            idempotencyKey,
          'Delivery Status':
            STATUS.PREPARED,
          'Attempted At': '',
          'Sent At': '',
          'Evidence Type': '',
          'Evidence Reference': '',
          Error: '',
          Notes:
            String(details.notes || '').trim(),
          'Created By':
            currentUser_(),
          'Created At':
            now,
          'Updated At':
            now
        },
        {
          idField:
            'Delivery Attempt ID',
          idPrefix:
            'ODEL'
        }
      );

    return {
      ok: true,
      created: true,
      record: clean_(created)
    };
  }

  /**
   * Prepared -> Sending
   *
   * This state must be persisted before a transport side effect
   * begins. If execution becomes ambiguous after this point, the
   * attempt can be classified Uncertain instead of blindly retried.
   */
  function markSending(
    attemptId,
    details
  ) {
    details = details || {};

    return transition_(
      attemptId,
      STATUS.SENDING,
      {
        'Attempted At':
          validDateOrNow_(
            details.attemptedAt
          ),
        Notes:
          optionalText_(
            details.notes
          )
      }
    );
  }

  /**
   * Sending -> Sent
   *
   * Sent is valid only when durable evidence accompanies the state.
   */
  function recordSent(
    attemptId,
    evidence
  ) {
    evidence = evidence || {};

    /*
     * Enforce the delivery state machine before validating the
     * payload for the requested transition.
     *
     * Prepared -> Sent must always fail as a transition violation;
     * only Sending may be converted into durable Sent evidence.
     */
    var currentAttempt =
      requireAttempt_(
        attemptId
      );

    var currentStatus =
      String(
        currentAttempt[
          'Delivery Status'
        ] || ''
      );

    if (
      currentStatus !==
        STATUS.SENDING
    ) {
      throw new Error(
        'Invalid delivery transition: ' +
        currentStatus +
        ' -> ' +
        STATUS.SENT
      );
    }

    requireText_(
      evidence.type,
      'Evidence Type'
    );

    requireText_(
      evidence.reference,
      'Evidence Reference'
    );

    var sendAuthorityValidatedAt =
      requiredDate_(
        evidence.authorityValidatedAt,
        'Send Authority Validated At'
      );

    var sentAt =
      validDateOrNow_(
        evidence.sentAt
      );

    if (
      sentAt.getTime() <
      sendAuthorityValidatedAt.getTime()
    ) {
      throw new Error(
        'Sent At cannot precede send authority validation.'
      );
    }

    return transition_(
      attemptId,
      STATUS.SENT,
      {
        'Send Authority Validated At':
          sendAuthorityValidatedAt,
        'Sent At':
          sentAt,
        'Evidence Type':
          String(
            evidence.type
          ).trim(),
        'Evidence Reference':
          String(
            evidence.reference
          ).trim(),
        Error: '',
        Notes:
          optionalText_(
            evidence.notes
          )
      }
    );
  }

  /**
   * Sending -> Failed
   *
   * Failed means the transport reported a definite failure.
   */
  function recordFailed(
    attemptId,
    details
  ) {
    details = details || {};

    requireText_(
      details.error,
      'Delivery error'
    );

    return transition_(
      attemptId,
      STATUS.FAILED,
      {
        Error:
          String(
            details.error
          ).trim(),
        Notes:
          optionalText_(
            details.notes
          )
      }
    );
  }

  /**
   * Sending -> Uncertain
   *
   * Uncertain is intentionally terminal for automatic delivery.
   * A future reconciliation path must resolve it before another
   * external send is attempted.
   */
  function recordUncertain(
    attemptId,
    details
  ) {
    details = details || {};

    requireText_(
      details.error ||
      details.notes,
      'Uncertain delivery reason'
    );

    return transition_(
      attemptId,
      STATUS.UNCERTAIN,
      {
        Error:
          optionalText_(
            details.error
          ),
        Notes:
          optionalText_(
            details.notes
          )
      }
    );
  }

  function transition_(
    attemptId,
    nextStatus,
    changes
  ) {
    ensureSheet();

    var row =
      requireAttempt_(
        attemptId
      );

    var current =
      String(
        row['Delivery Status'] || ''
      );

    var allowed = {};

    allowed[STATUS.PREPARED] = [
      STATUS.SENDING
    ];

    allowed[STATUS.SENDING] = [
      STATUS.SENT,
      STATUS.FAILED,
      STATUS.UNCERTAIN
    ];

    if (
      !allowed[current] ||
      allowed[current].indexOf(
        nextStatus
      ) === -1
    ) {
      throw new Error(
        'Invalid delivery transition: ' +
        current +
        ' -> ' +
        nextStatus
      );
    }

    changes =
      Object.assign(
        {},
        changes || {},
        {
          'Delivery Status':
            nextStatus,
          'Updated At':
            new Date()
        }
      );

    var updated =
      REOS.Database.update(
        TABLE,
        'Delivery Attempt ID',
        row['Delivery Attempt ID'],
        changes
      );

    return {
      ok: true,
      record: clean_(updated)
    };
  }

  /**
   * This predicate becomes the bridge into Submitted during a later
   * Increment 6 commit. Merely having a delivery-attempt row is not
   * enough.
   */
  function isSentEvidence(attempt) {
    if (!attempt) {
      return false;
    }

    if (
      String(
        attempt['Delivery Status'] || ''
      ) !== STATUS.SENT
    ) {
      return false;
    }

    if (
      METHODS.indexOf(
        String(
          attempt['Delivery Method'] || ''
        )
      ) === -1
    ) {
      return false;
    }

    if (
      String(
        attempt['Authority Source'] || ''
      ) !== 'QUALIFIED_DEAL_QUEUE'
    ) {
      return false;
    }

    if (
      !attempt['Execution ID'] ||
      !attempt['Offer ID'] ||
      !attempt['Deal ID'] ||
      !attempt['Analysis ID'] ||
      !attempt['Qualified Queue ID']
    ) {
      return false;
    }

    if (
      !String(
        attempt['Evidence Type'] || ''
      ).trim() ||
      !String(
        attempt['Evidence Reference'] || ''
      ).trim()
    ) {
      return false;
    }

    var sendAuthorityValidatedAt =
      attempt[
        'Send Authority Validated At'
      ];

    var authorityDate =
      sendAuthorityValidatedAt instanceof Date
        ? sendAuthorityValidatedAt
        : new Date(
            sendAuthorityValidatedAt
          );

    if (
      !sendAuthorityValidatedAt ||
      !isFinite(
        authorityDate.getTime()
      )
    ) {
      return false;
    }

    var sentAt =
      attempt['Sent At'];

    var sentDate =
      sentAt instanceof Date
        ? sentAt
        : new Date(sentAt);

    return !!(
      sentAt &&
      isFinite(
        sentDate.getTime()
      ) &&
      sentDate.getTime() >=
        authorityDate.getTime()
    );
  }

  function get(attemptId) {
    ensureSheet();

    var row =
      requireAttempt_(
        attemptId
      );

    return clean_(row);
  }

  function listForExecution(
    executionId
  ) {
    ensureSheet();

    return clean_(
      safeAll_().filter(
        function (row) {
          return String(
            row['Execution ID'] || ''
          ) === String(
            executionId || ''
          );
        }
      )
    );
  }

  function requireAttempt_(
    attemptId
  ) {
    requireText_(
      attemptId,
      'Delivery Attempt ID'
    );

    var row =
      REOS.Database.findById(
        TABLE,
        'Delivery Attempt ID',
        attemptId
      );

    if (!row) {
      throw new Error(
        'Delivery attempt not found: ' +
        attemptId
      );
    }

    return row;
  }

  function findByIdempotencyKey_(
    idempotencyKey
  ) {
    return safeAll_().filter(
      function (row) {
        return String(
          row['Idempotency Key'] || ''
        ) === String(
          idempotencyKey || ''
        );
      }
    )[0] || null;
  }

  function validateAuthority_(
    execution
  ) {
    if (
      String(
        execution['Authority Source'] || ''
      ) !== 'QUALIFIED_DEAL_QUEUE'
    ) {
      throw new Error(
        'Delivery preparation requires qualified-deal authority.'
      );
    }

    if (
      !REOS.QualifiedDealQueue ||
      typeof REOS.QualifiedDealQueue.validateAuthority !==
        'function'
    ) {
      throw new Error(
        'Delivery preparation blocked: qualified-deal authority validator is unavailable.'
      );
    }

    var validation;

    try {
      validation =
        REOS.QualifiedDealQueue.validateAuthority({
          queueId:
            String(
              execution['Qualified Queue ID'] || ''
            ),
          dealId:
            String(
              execution['Deal ID'] || ''
            ),
          analysisId:
            String(
              execution['Analysis ID'] || ''
            )
        });
    } catch (error) {
      throw new Error(
        'Delivery preparation blocked: authority validation failed: ' +
        (
          error && error.message
            ? error.message
            : String(error)
        )
      );
    }

    if (
      !validation ||
      validation.ok !== true ||
      validation.authorized !== true
    ) {
      throw new Error(
        'Delivery preparation blocked: ' +
        (
          validation &&
          validation.reason
            ? String(
                validation.reason
              )
            : 'qualified-deal authority was not confirmed.'
        )
      );
    }

    return validation;
  }

  function normalizeMethod_(
    method
  ) {
    method =
      String(
        method || ''
      ).trim();

    if (
      METHODS.indexOf(
        method
      ) === -1
    ) {
      throw new Error(
        'Unsupported delivery method: ' +
        method
      );
    }

    return method;
  }

  function normalizeEmail_(
    value
  ) {
    value =
      String(
        value || ''
      ).trim();

    if (
      REOS.normalizeEmail_ &&
      typeof REOS.normalizeEmail_ ===
        'function'
    ) {
      return REOS.normalizeEmail_(
        value
      );
    }

    return value.toLowerCase();
  }

  function isValidEmail_(
    value
  ) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/
      .test(
        String(
          value || ''
        )
      );
  }

  function buildIdempotencyKey_(
    execution,
    method,
    recipientEmail,
    documentUrl
  ) {
    return [
      String(
        execution['Execution ID'] || ''
      ),
      String(
        method || ''
      ).toUpperCase(),
      String(
        recipientEmail || ''
      ).toLowerCase(),
      String(
        documentUrl || ''
      )
    ].join('|');
  }

  function requiredDate_(
    value,
    label
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      throw new Error(
        label + ' is required.'
      );
    }

    var date =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      !isFinite(
        date.getTime()
      )
    ) {
      throw new Error(
        'Invalid ' + label + '.'
      );
    }

    return date;
  }

  function validDateOrNow_(
    value
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return new Date();
    }

    var date =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      !isFinite(
        date.getTime()
      )
    ) {
      throw new Error(
        'Invalid delivery timestamp.'
      );
    }

    return date;
  }

  function optionalText_(
    value
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      return '';
    }

    return String(
      value
    ).trim();
  }

  function safeAll_() {
    try {
      return REOS.Database.getAll(
        TABLE
      ) || [];
    } catch (error) {
      return [];
    }
  }

  function requireText_(
    value,
    label
  ) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {
      throw new Error(
        label + ' is required.'
      );
    }
  }

  function currentUser_() {
    try {
      return Session
        .getActiveUser()
        .getEmail() || '';
    } catch (error) {
      return '';
    }
  }

  function clean_(
    value
  ) {
    return JSON.parse(
      JSON.stringify(
        value || null,
        function (key, item) {
          return item instanceof Date
            ? item.toISOString()
            : item;
        }
      )
    );
  }

  return {
    STATUS: STATUS,
    METHODS: METHODS,
    ensureSheet: ensureSheet,
    prepare: prepare,
    markSending: markSending,
    recordSent: recordSent,
    recordFailed: recordFailed,
    recordUncertain: recordUncertain,
    isSentEvidence: isSentEvidence,
    get: get,
    listForExecution: listForExecution
  };
})();
