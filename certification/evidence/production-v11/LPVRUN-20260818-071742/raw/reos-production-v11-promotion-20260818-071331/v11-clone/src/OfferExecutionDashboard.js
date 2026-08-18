/**
 * REOS Enterprise
 * Deal Increment 6 — Controlled Offer Execution Dashboard
 */
var REOS = REOS || {};

REOS.OfferExecutionDashboard = (function () {

  function data(filters) {
    assertReadDependencies_();

    var summary =
      REOS.OfferExecutionWorkflow
        .summary();

    var records =
      REOS.OfferExecutionWorkflow
        .list(
          filters || {}
        )
        .map(
          attachDeliveryState_
        );

    return {
      ok: true,
      generatedAt:
        new Date().toISOString(),
      kpis: {
        total:
          summary.total || 0,
        ready:
          summary.ready || 0,
        submitted:
          summary.submitted || 0,
        countered:
          summary.countered || 0,
        accepted:
          summary.accepted || 0,
        rejected:
          summary.rejected || 0,
        expired:
          summary.expired || 0,
        totalOfferValue:
          summary.totalOfferValue || 0
      },
      records: records,
      statuses: [
        'Ready',
        'Submitted',
        'Countered',
        'Accepted',
        'Rejected',
        'Expired',
        'Withdrawn'
      ],

      /*
       * Increment 6 supports controlled Email execution only.
       * Other delivery methods require their own durable evidence
       * implementation before being exposed here.
       */
      methods: [
        'Email'
      ]
    };
  }

  function sendEmail(
    executionId,
    details
  ) {
    assertWriteDependencies_();

    details = details || {};

    requireText_(
      executionId,
      'Execution ID'
    );

    /*
     * A prior durable Sent attempt means the external side effect
     * already happened. Never call Gmail again; finish local
     * finalization from the existing evidence instead.
     */
    var latest =
      latestAttempt_(
        executionId
      );

    if (latest) {
      var status =
        String(
          latest[
            'Delivery Status'
          ] || ''
        );

      if (status === 'Sent') {
        return finalizeSent_(
          executionId,
          latest,
          details.notes || ''
        );
      }

      if (status === 'Sending') {
        throw new Error(
          'Delivery is already Sending. Reconcile the existing attempt before any retry.'
        );
      }

      if (status === 'Uncertain') {
        throw new Error(
          'Delivery outcome is Uncertain. Do not resend. Reconcile the existing attempt first.'
        );
      }

      if (status === 'Failed') {
        throw new Error(
          'The previous delivery attempt Failed. Retry requires explicit review and a new idempotency key.'
        );
      }
    }

    /*
     * No recipient fields are accepted from the dashboard.
     * OfferDeliveryEvidence derives Email recipient authority from
     * the persisted execution Recipient Email.
     */
    var delivery =
      REOS.OfferDeliveryTransport
        .deliverEmail(
          executionId,
          {
            subject:
              details.subject,
            body:
              details.body,
            notes:
              details.notes || ''
          }
        );

    if (
      !delivery ||
      delivery.sent !== true ||
      !delivery.attempt
    ) {
      throw new Error(
        'Controlled Email delivery did not return durable Sent evidence.'
      );
    }

    return finalizeSent_(
      executionId,
      delivery.attempt,
      details.notes || ''
    );
  }

  function reconcileSent(
    executionId
  ) {
    assertWriteDependencies_();

    requireText_(
      executionId,
      'Execution ID'
    );

    var latest =
      latestAttempt_(
        executionId
      );

    if (
      !latest ||
      String(
        latest[
          'Delivery Status'
        ] || ''
      ) !== 'Sent'
    ) {
      throw new Error(
        'No durable Sent delivery evidence is available for finalization.'
      );
    }

    return finalizeSent_(
      executionId,
      latest,
      'Submission reconciled from existing durable Sent delivery evidence.'
    );
  }

  function finalizeSent_(
    executionId,
    attempt,
    notes
  ) {
    if (
      !REOS.OfferDeliveryEvidence
        .isSentEvidence(
          attempt
        )
    ) {
      throw new Error(
        'Submission finalization requires valid Sent delivery evidence.'
      );
    }

    var attemptId =
      String(
        attempt[
          'Delivery Attempt ID'
        ] || ''
      );

    requireText_(
      attemptId,
      'Delivery Attempt ID'
    );

    try {
      var finalized =
        REOS.OfferExecutionWorkflow
          .finalizeSentDelivery(
            executionId,
            attemptId,
            {
              notes:
                notes || ''
            }
          );

      return {
        ok: true,
        sent: true,
        submitted: true,
        deliveryAttemptId:
          attemptId,
        messageId:
          String(
            attempt[
              'Evidence Reference'
            ] || ''
          ),
        record:
          finalized &&
          finalized.record
            ? finalized.record
            : null
      };
    } catch (error) {
      /*
       * At this point Sent evidence is durable. The Email side
       * effect must never be repeated merely because local status
       * finalization failed.
       */
      throw new Error(
        'Email has durable Sent evidence for delivery attempt ' +
        attemptId +
        ', but submission finalization failed. Do not resend. Reconciliation is required: ' +
        message_(
          error
        )
      );
    }
  }

  function attachDeliveryState_(
    record
  ) {
    record =
      Object.assign(
        {},
        record || {}
      );

    var latest =
      latestAttempt_(
        record[
          'Execution ID'
        ]
      );

    record[
      'Delivery Status'
    ] =
      latest
        ? String(
            latest[
              'Delivery Status'
            ] || ''
          )
        : '';

    record[
      'Delivery Error'
    ] =
      latest
        ? String(
            latest.Error || ''
          )
        : '';

    record[
      'Latest Delivery Attempt ID'
    ] =
      latest
        ? String(
            latest[
              'Delivery Attempt ID'
            ] || ''
          )
        : '';

    record[
      'Latest Delivery Evidence Reference'
    ] =
      latest
        ? String(
            latest[
              'Evidence Reference'
            ] || ''
          )
        : '';

    return record;
  }

  function latestAttempt_(
    executionId
  ) {
    var attempts =
      REOS.OfferDeliveryEvidence
        .listForExecution(
          executionId
        ) || [];

    attempts.sort(
      function (a, b) {
        return timestamp_(
          a['Updated At'] ||
          a['Created At']
        ) -
        timestamp_(
          b['Updated At'] ||
          b['Created At']
        );
      }
    );

    return attempts.length
      ? attempts[
          attempts.length - 1
        ]
      : null;
  }

  function show() {
    var html =
      HtmlService
        .createHtmlOutputFromFile(
          'OfferExecutionDashboardUI'
        )
        .setWidth(1400)
        .setHeight(900);

    SpreadsheetApp
      .getUi()
      .showModelessDialog(
        html,
        'REOS Offer Execution'
      );
  }

  function assertReadDependencies_() {
    if (
      !REOS.OfferExecutionWorkflow
    ) {
      throw new Error(
        'OfferExecutionWorkflow is required.'
      );
    }

    if (
      !REOS.OfferDeliveryEvidence ||
      typeof REOS.OfferDeliveryEvidence
        .listForExecution !==
        'function'
    ) {
      throw new Error(
        'OfferDeliveryEvidence is required.'
      );
    }
  }

  function assertWriteDependencies_() {
    assertReadDependencies_();

    if (
      !REOS.OfferDeliveryTransport ||
      typeof REOS.OfferDeliveryTransport
        .deliverEmail !==
        'function'
    ) {
      throw new Error(
        'OfferDeliveryTransport is required.'
      );
    }

    if (
      typeof REOS.OfferExecutionWorkflow
        .finalizeSentDelivery !==
        'function'
    ) {
      throw new Error(
        'Evidence-backed submission finalizer is required.'
      );
    }

    if (
      typeof REOS.OfferDeliveryEvidence
        .isSentEvidence !==
        'function'
    ) {
      throw new Error(
        'Delivery evidence validator is required.'
      );
    }
  }

  function requireText_(
    value,
    label
  ) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    ) {
      throw new Error(
        label + ' is required.'
      );
    }
  }

  function timestamp_(
    value
  ) {
    var date =
      value instanceof Date
        ? value
        : new Date(
            value || 0
          );

    var time =
      date.getTime();

    return isFinite(time)
      ? time
      : 0;
  }

  function message_(
    error
  ) {
    return error &&
      error.message
        ? error.message
        : String(error);
  }

  return {
    data:
      data,
    sendEmail:
      sendEmail,
    reconcileSent:
      reconcileSent,
    show:
      show
  };
})();

function reosOfferExecutionDashboardData(
  filters
) {
  return JSON.stringify(
    REOS.OfferExecutionDashboard
      .data(
        filters || {}
      )
  );
}

function reosOfferExecutionSendEmail(
  executionId,
  details
) {
  reosRequireOfferExecutionPermission_();

  return REOS.OfferExecutionDashboard
    .sendEmail(
      executionId,
      details || {}
    );
}

function reosOfferExecutionReconcileSent(
  executionId
) {
  reosRequireOfferExecutionPermission_();

  return REOS.OfferExecutionDashboard
    .reconcileSent(
      executionId
    );
}

function showOfferExecutionDashboard() {
  return REOS.OfferExecutionDashboard
    .show();
}
