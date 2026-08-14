/**
 * REOS Enterprise v4.3.3
 * Sprint 7.2 Increment 5 — Offer Execution Workflow
 */
var REOS = REOS || {};

REOS.OfferExecutionWorkflow = (function () {
  var SOURCE = 'OFFERS';
  var QUEUE = 'OFFER_EXECUTION_QUEUE';
  var LOG = 'OFFER_EXECUTION_LOG';
  var STATUSES = ['Ready','Submitted','Countered','Accepted','Rejected','Expired','Withdrawn'];

  var QUEUE_HEADERS = [
    'Execution ID','Offer ID','Deal ID','Analysis ID','Qualified Queue ID',
    'Authority Source','Lead ID','Address','Offer Type','Offer Amount',
    'Execution Status','Authority Validated At',
    'Delivery Attempt ID','Delivery Evidence Type','Delivery Evidence Reference',
    'Recipient Name','Recipient Email','Submission Method','Submitted At',
    'Follow Up At','Response At','Response Notes','Assigned To',
    'Published Document URL','Created At','Updated At'
  ];

  var LOG_HEADERS = [
    'Execution Log ID','Execution ID','Offer ID','Deal ID','Action','Previous Status',
    'New Status','Notes','Performed By','Created At'
  ];

  function ensureSheets() {
    ensureColumns_(QUEUE, QUEUE_HEADERS);
    ensureColumns_(LOG, LOG_HEADERS);

    return {
      ok: true,
      queue: QUEUE,
      log: LOG
    };
  }

  function ensureColumns_(sheetName, requiredHeaders) {
    var sheet = REOS.Database.ensureTable(
      sheetName,
      requiredHeaders
    );

    var existing =
      REOS.Database.getHeaders(sheetName);

    var missing = requiredHeaders.filter(
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

  function buildQueue(options) {
    ensureSheets();
    options = Object.assign({ maxItems: 200 }, options || {});

    var requestedMaxItems =
      Number(options.maxItems);

    var maxItems =
      isFinite(requestedMaxItems) &&
      requestedMaxItems > 0
        ? Math.floor(requestedMaxItems)
        : 200;

    var offers = safeAll_(SOURCE).filter(function (row) {
      var status = String(row.Status || 'Draft');
      return status === 'Draft' || status === 'Ready';
    });

    var existing = {};
    safeAll_(QUEUE).forEach(function (row) {
      existing[String(row['Offer ID'] || '')] = true;
    });

    var created = [];
    var skipped = 0;
    var unauthorized = [];
    var unauthorizedCount = 0;

    offers.some(function (offer) {
      if (created.length >= maxItems) {
        return true;
      }

      var offerId = String(offer['Offer ID'] || '');

      if (!offerId || existing[offerId]) {
        skipped++;
        return;
      }

      var authority = validateOfferAuthority_(offer);

      if (!authority.authorized) {
        skipped++;
        unauthorizedCount++;

        if (unauthorized.length < maxItems) {
          unauthorized.push({
            offerId: offerId,
            dealId: String(
              offer['Deal ID'] || ''
            ),
            analysisId: String(
              offer['Analysis ID'] || ''
            ),
            queueId: String(
              offer['Qualified Queue ID'] || ''
            ),
            reason: authority.reason
          });
        }

        return false;
      }

      var deal = findOne_(
        'DEALS',
        'Deal ID',
        offer['Deal ID']
      ) || {};

      var authorityValidatedAt = new Date();
      var row = REOS.Database.insert(QUEUE, {
        'Offer ID': offerId,
        'Deal ID': offer['Deal ID'] || '',
        'Analysis ID': offer['Analysis ID'] || '',
        'Qualified Queue ID':
          offer['Qualified Queue ID'] || '',
        'Authority Source':
          offer['Authority Source'] || '',
        'Lead ID':
          offer['Lead ID'] ||
          deal['Lead ID'] ||
          '',
        Address: deal.Address || offer.Address || '',
        'Offer Type': offer['Offer Type'] || 'Acquisition',
        'Offer Amount': Number(offer['Offer Amount'] || 0),
        'Execution Status': 'Ready',
        'Authority Validated At': authorityValidatedAt,
        'Recipient Name': deal['Seller Name'] || '',
        'Recipient Email': deal['Seller Email'] || '',
        'Submission Method': 'Email',
        'Submitted At': '',
        'Follow Up At': '',
        'Response At': '',
        'Response Notes': '',
        'Assigned To': offer['Assigned To'] || currentUser_(),
        'Published Document URL': '',
        'Created At': new Date(),
        'Updated At': new Date()
      }, { idField: 'Execution ID', idPrefix: 'OEXEC' });

      REOS.Database.update(SOURCE, 'Offer ID', offerId, {
        Status: 'Ready',
        'Updated At': new Date()
      });

      log_(row, 'Queue Created', '', 'Ready', 'Offer added to execution queue.');
      existing[offerId] = true;
      created.push(row);

      return false;
    });

    return {
      ok: true,
      source: offers.length,
      created: created.length,
      skipped: skipped,
      unauthorized: unauthorizedCount,
      unauthorizedDetails: clean_(unauthorized),
      records: clean_(created)
    };
  }

  function validateOfferAuthority_(offer) {
    offer = offer || {};

    if (
      String(offer['Authority Source'] || '') !==
        'QUALIFIED_DEAL_QUEUE'
    ) {
      return {
        authorized: false,
        reason:
          'Offer does not declare qualified-deal authority.'
      };
    }

    if (
      !offer['Qualified Queue ID'] ||
      !offer['Deal ID'] ||
      !offer['Analysis ID']
    ) {
      return {
        authorized: false,
        reason:
          'Offer is missing qualified authority provenance.'
      };
    }

    if (
      !REOS.QualifiedDealQueue ||
      typeof REOS.QualifiedDealQueue.validateAuthority !==
        'function'
    ) {
      return {
        authorized: false,
        reason:
          'Qualified-deal authority validator is unavailable.'
      };
    }

    try {
      var validation =
        REOS.QualifiedDealQueue.validateAuthority({
          queueId: String(
            offer['Qualified Queue ID'] || ''
          ),
          dealId: String(
            offer['Deal ID'] || ''
          ),
          analysisId: String(
            offer['Analysis ID'] || ''
          )
        });

      if (
        !validation ||
        validation.ok !== true ||
        validation.authorized !== true
      ) {
        return {
          authorized: false,
          reason:
            validation && validation.reason
              ? String(validation.reason)
              : 'Qualified-deal authority was not confirmed.'
        };
      }

      return {
        authorized: true,
        queue: validation.queue || null,
        reason:
          validation.reason ||
          'Qualified-deal authority confirmed.'
      };
    } catch (error) {
      return {
        authorized: false,
        reason:
          'Qualified-deal authority validation failed: ' +
          (
            error && error.message
              ? error.message
              : String(error)
          )
      };
    }
  }

  function markSubmitted(executionId, details) {
    details = details || {};

    var row =
      requireExecution_(
        executionId
      );

    /*
     * Deal Increment 6 — evidence-backed submission boundary.
     *
     * Current qualified authority is checked immediately before the
     * external delivery side effect by OfferDeliveryTransport.
     *
     * After a genuine send, current authority may later change.
     * Finalization therefore relies on historical Sent delivery
     * evidence rather than re-running current QDQ authority.
     */
    if (
      String(
        row['Execution Status'] || ''
      ) !== 'Ready'
    ) {
      throw new Error(
        'Offer submission requires Ready execution status.'
      );
    }

    requireText_(
      details.deliveryAttemptId,
      'Delivery Attempt ID'
    );

    var delivery =
      requireSentDeliveryEvidence_(
        row,
        details.deliveryAttemptId
      );

    var submittedAt =
      requiredDate_(
        delivery['Sent At'],
        'Sent At'
      );

    var authorityValidatedAt =
      requiredDate_(
        delivery[
          'Send Authority Validated At'
        ],
        'Send Authority Validated At'
      );

    if (
      submittedAt.getTime() <
      authorityValidatedAt.getTime()
    ) {
      throw new Error(
        'Submission evidence predates send authority validation.'
      );
    }

    var followUpAt =
      details.followUpAt
        ? requiredDate_(
            details.followUpAt,
            'Follow Up At'
          )
        : new Date(
            submittedAt.getTime() +
            2 * 24 * 60 * 60 * 1000
          );

    var updated =
      updateStatus_(
        row,
        'Submitted',
        {
          'Authority Validated At':
            authorityValidatedAt,
          'Delivery Attempt ID':
            delivery[
              'Delivery Attempt ID'
            ],
          'Delivery Evidence Type':
            delivery[
              'Evidence Type'
            ],
          'Delivery Evidence Reference':
            delivery[
              'Evidence Reference'
            ],
          'Recipient Name':
            delivery[
              'Recipient Name'
            ] ||
            row[
              'Recipient Name'
            ] ||
            '',
          'Recipient Email':
            delivery[
              'Recipient Email'
            ] ||
            row[
              'Recipient Email'
            ] ||
            '',
          'Submission Method':
            delivery[
              'Delivery Method'
            ] ||
            row[
              'Submission Method'
            ] ||
            '',
          'Submitted At':
            submittedAt,
          'Follow Up At':
            followUpAt,
          'Published Document URL':
            delivery[
              'Document URL'
            ] ||
            row[
              'Published Document URL'
            ] ||
            '',
          'Response Notes':
            details.notes ||
            row[
              'Response Notes'
            ] ||
            ''
        },
        details.notes ||
          'Offer submission finalized from durable delivery evidence.'
      );

    createFollowUpTask_(
      updated
    );

    advancePipeline_(
      updated['Deal ID'],
      'Offer Submitted',
      'Offer submission finalized from durable delivery evidence.'
    );

    return {
      ok: true,
      deliveryAttemptId:
        delivery[
          'Delivery Attempt ID'
        ],
      record:
        clean_(updated)
    };
  }

  function requireSentDeliveryEvidence_(
    execution,
    attemptId
  ) {
    if (
      !REOS.OfferDeliveryEvidence ||
      typeof REOS.OfferDeliveryEvidence.get !==
        'function' ||
      typeof REOS.OfferDeliveryEvidence.isSentEvidence !==
        'function'
    ) {
      throw new Error(
        'Offer submission blocked: delivery evidence service is unavailable.'
      );
    }

    var attempt =
      REOS.OfferDeliveryEvidence.get(
        String(
          attemptId || ''
        )
      );

    if (
      !attempt ||
      REOS.OfferDeliveryEvidence
        .isSentEvidence(
          attempt
        ) !== true
    ) {
      throw new Error(
        'Offer submission blocked: valid Sent delivery evidence is required.'
      );
    }

    [
      'Execution ID',
      'Offer ID',
      'Deal ID',
      'Analysis ID',
      'Qualified Queue ID',
      'Authority Source'
    ].forEach(
      function (field) {
        if (
          String(
            attempt[field] || ''
          ) !==
          String(
            execution[field] || ''
          )
        ) {
          throw new Error(
            'Offer submission blocked: delivery evidence provenance mismatch for ' +
            field +
            '.'
          );
        }
      }
    );

    if (
      String(
        attempt[
          'Delivery Method'
        ] || ''
      ) === 'Email' &&
      String(
        attempt[
          'Evidence Type'
        ] || ''
      ) !== 'GMAIL_MESSAGE_ID'
    ) {
      throw new Error(
        'Offer submission blocked: email delivery requires Gmail message evidence.'
      );
    }

    return attempt;
  }

  function recordResponse(executionId, status, notes) {
    if (
      STATUSES.indexOf(status) === -1 ||
      status === 'Ready' ||
      status === 'Submitted'
    ) {
      throw new Error(
        'Invalid response status: ' + status
      );
    }

    var row = requireExecution_(executionId);

    var currentStatus = String(
      row['Execution Status'] || ''
    );

    if (
      currentStatus !== 'Submitted' &&
      currentStatus !== 'Countered'
    ) {
      throw new Error(
        'Offer response requires a previously submitted execution.'
      );
    }

    var submittedAt =
      row['Submitted At'];

    var submittedDate =
      submittedAt instanceof Date
        ? submittedAt
        : new Date(submittedAt);

    if (
      !submittedAt ||
      !isFinite(submittedDate.getTime())
    ) {
      throw new Error(
        'Offer response requires a valid Submitted At timestamp.'
      );
    }

    var updated = updateStatus_(row, status, {
      'Response At': new Date(),
      'Response Notes': String(notes || '').trim()
    }, notes || ('Offer response recorded: ' + status));

    if (status === 'Accepted') advancePipeline_(updated['Deal ID'], 'Under Contract', 'Offer accepted.');
    if (status === 'Countered') advancePipeline_(updated['Deal ID'], 'Negotiation', 'Offer countered.');
    return { ok: true, record: clean_(updated) };
  }

  function scheduleFollowUps() {
    ensureSheets();
    var now = new Date();
    var due = safeAll_(QUEUE).filter(function (row) {
      return row['Execution Status'] === 'Submitted' && row['Follow Up At'] && new Date(row['Follow Up At']) <= now;
    });
    var created = 0;
    due.forEach(function (row) {
      if (createFollowUpTask_(row)) created++;
    });
    return { ok: true, due: due.length, tasksCreated: created };
  }

  function list(filters) {
    ensureSheets();
    filters = filters || {};
    return clean_(safeAll_(QUEUE).filter(function (row) {
      if (filters.status && row['Execution Status'] !== filters.status) return false;
      if (filters.method && row['Submission Method'] !== filters.method) return false;
      if (filters.assignedTo && row['Assigned To'] !== filters.assignedTo) return false;
      return true;
    }).slice().reverse());
  }

  function summary() {
    var rows = list();
    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      total: rows.length,
      ready: count_(rows, 'Execution Status', 'Ready'),
      submitted: count_(rows, 'Execution Status', 'Submitted'),
      countered: count_(rows, 'Execution Status', 'Countered'),
      accepted: count_(rows, 'Execution Status', 'Accepted'),
      rejected: count_(rows, 'Execution Status', 'Rejected'),
      expired: count_(rows, 'Execution Status', 'Expired'),
      totalOfferValue: rows.reduce(function (s, r) { return s + Number(r['Offer Amount'] || 0); }, 0),
      records: rows
    };
  }

  function requireExecution_(executionId) {
    ensureSheets();
    requireText_(executionId, 'Execution ID');
    var row = findOne_(QUEUE, 'Execution ID', executionId);
    if (!row) throw new Error('Offer execution not found: ' + executionId);
    return row;
  }

  function updateStatus_(row, status, changes, notes) {
    var previous = row['Execution Status'] || '';
    changes = Object.assign({}, changes || {}, {
      'Execution Status': status,
      'Updated At': new Date()
    });
    var updated = REOS.Database.update(QUEUE, 'Execution ID', row['Execution ID'], changes);
    REOS.Database.update(SOURCE, 'Offer ID', row['Offer ID'], { Status: status, 'Updated At': new Date() });
    log_(row, 'Status Changed', previous, status, notes || '');
    publish_('offer.execution.status.changed', { executionId: row['Execution ID'], offerId: row['Offer ID'], status: status });
    return updated;
  }

  function createFollowUpTask_(row) {
    try {
      REOS.Database.ensureTable('ACQUISITION_TASK_QUEUE', [
        'Acquisition Task ID','Deal ID','Stage','Task Name','Owner Role','Priority','Due At','Status','Notes','Created At','Updated At'
      ]);
      var existing = safeAll_('ACQUISITION_TASK_QUEUE').some(function (task) {
        return task['Deal ID'] === row['Deal ID'] && task.Status === 'Open' && String(task['Task Name'] || '').indexOf('Follow up on offer') === 0;
      });
      if (existing) return false;
      REOS.Database.insert('ACQUISITION_TASK_QUEUE', {
        'Deal ID': row['Deal ID'] || '',
        Stage: 'Offer Submitted',
        'Task Name': 'Follow up on offer ' + (row['Offer ID'] || ''),
        'Owner Role': 'Acquisitions',
        Priority: 'High',
        'Due At': row['Follow Up At'] || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        Status: 'Open',
        Notes: 'Automated follow-up from Offer Execution Workflow.',
        'Created At': new Date(),
        'Updated At': new Date()
      }, { idField: 'Acquisition Task ID', idPrefix: 'ATASK' });
      return true;
    } catch (error) { return false; }
  }

  function advancePipeline_(dealId, stage, notes) {
    try {
      if (dealId && REOS.AcquisitionPipeline && typeof REOS.AcquisitionPipeline.advanceStage === 'function') {
        REOS.AcquisitionPipeline.advanceStage(dealId, stage, notes || '');
      }
    } catch (ignored) {}
  }

  function log_(row, action, previous, next, notes) {
    REOS.Database.insert(LOG, {
      'Execution ID': row['Execution ID'] || '',
      'Offer ID': row['Offer ID'] || '',
      'Deal ID': row['Deal ID'] || '',
      Action: action,
      'Previous Status': previous || '',
      'New Status': next || '',
      Notes: notes || '',
      'Performed By': currentUser_(),
      'Created At': new Date()
    }, { idField: 'Execution Log ID', idPrefix: 'OLOG' });
  }

  function safeAll_(sheet) { try { return REOS.Database.getAll(sheet) || []; } catch (e) { return []; } }
  function findOne_(sheet, field, value) { return safeAll_(sheet).filter(function (r) { return r[field] === value; })[0] || null; }
  function count_(rows, field, value) { return rows.filter(function (r) { return r[field] === value; }).length; }
  function requiredDate_(value, label) {
    if (
      value === null ||
      value === undefined ||
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

  function requireText_(value, label) { if (value === null || value === undefined || String(value).trim() === '') throw new Error(label + ' is required.'); }
  function currentUser_() { try { return Session.getActiveUser().getEmail() || ''; } catch (e) { return ''; } }
  function clean_(value) { return JSON.parse(JSON.stringify(value || null, function (k, v) { return v instanceof Date ? v.toISOString() : v; })); }
  function publish_(topic, payload) { try { if (REOS.PluginEventBus && typeof REOS.PluginEventBus.publish === 'function') REOS.PluginEventBus.publish(topic, payload, 'offer-execution'); } catch (e) {} }

  return {
    ensureSheets: ensureSheets,
    buildQueue: buildQueue,
    markSubmitted: markSubmitted,
    recordResponse: recordResponse,
    scheduleFollowUps: scheduleFollowUps,
    list: list,
    summary: summary
  };
})();

function reosOfferExecutionEnsureSheets() { return REOS.OfferExecutionWorkflow.ensureSheets(); }
function reosOfferExecutionBuildQueue(options) { return REOS.OfferExecutionWorkflow.buildQueue(options); }
function reosOfferExecutionMarkSubmitted(executionId, details) { return REOS.OfferExecutionWorkflow.markSubmitted(executionId, details); }
function reosOfferExecutionRecordResponse(executionId, status, notes) { return REOS.OfferExecutionWorkflow.recordResponse(executionId, status, notes); }
function reosOfferExecutionScheduleFollowUps() { return REOS.OfferExecutionWorkflow.scheduleFollowUps(); }
function reosOfferExecutionList(filters) { return REOS.OfferExecutionWorkflow.list(filters); }
function reosOfferExecutionSummary() { return REOS.OfferExecutionWorkflow.summary(); }
