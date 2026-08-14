/**
 * REOS Enterprise
 * Deal Increment 6 — Controlled Offer Delivery
 *
 * Gmail delivery adapter.
 *
 * Responsibilities:
 *   - persist delivery intent before the side effect
 *   - revalidate current execution authority immediately before send
 *   - capture durable Gmail message evidence
 *   - fail closed on ambiguous transport outcomes
 *
 * This module deliberately does NOT mark an execution Submitted.
 * Submission authority is bridged from durable delivery evidence
 * in a later Increment 6 commit.
 */
var REOS = REOS || {};

REOS.OfferDeliveryTransport = (function () {

  function deliverEmail(
    executionId,
    details
  ) {
    assertDependencies_();

    details = details || {};

    requireText_(
      executionId,
      'Execution ID'
    );

    var subject =
      String(
        details.subject || ''
      ).trim();

    var body =
      String(
        details.body || ''
      ).trim();

    requireText_(
      subject,
      'Email subject'
    );

    requireText_(
      body,
      'Email body'
    );

    if (subject.length > 250) {
      throw new Error(
        'Email subject cannot exceed 250 characters.'
      );
    }

    /*
     * prepare() reloads the persisted execution row and validates
     * the current qualified-deal authority before creating a
     * durable delivery-attempt record.
     */
    var prepared =
      REOS.OfferDeliveryEvidence.prepare(
        executionId,
        {
          method: 'Email',
          recipientName:
            details.recipientName,
          recipientEmail:
            details.recipientEmail,
          documentUrl:
            details.documentUrl,
          idempotencyKey:
            details.idempotencyKey,
          notes:
            details.notes
        }
      );

    var attempt =
      prepared &&
      prepared.record
        ? prepared.record
        : null;

    if (!attempt) {
      throw new Error(
        'Delivery preparation did not return an attempt record.'
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

    var status =
      String(
        attempt[
          'Delivery Status'
        ] || ''
      );

    /*
     * Never repeat an external send for an existing attempt.
     */
    if (status === 'Sent') {
      return {
        ok: true,
        sent: true,
        idempotent: true,
        attempt:
          clean_(attempt)
      };
    }

    if (status === 'Sending') {
      throw new Error(
        'Delivery attempt is already Sending. Reconcile it before retrying.'
      );
    }

    if (status === 'Uncertain') {
      throw new Error(
        'Delivery attempt outcome is Uncertain. Do not retry automatically.'
      );
    }

    if (status === 'Failed') {
      throw new Error(
        'Delivery attempt previously Failed. An explicit new idempotency key is required for retry.'
      );
    }

    if (status !== 'Prepared') {
      throw new Error(
        'Unsupported delivery attempt state: ' +
        status
      );
    }

    var sending =
      REOS.OfferDeliveryEvidence.markSending(
        attemptId,
        {
          notes:
            details.notes || ''
        }
      ).record;

    var recipient =
      String(
        sending[
          'Recipient Email'
        ] || ''
      ).trim();

    requireText_(
      recipient,
      'Recipient Email'
    );

    /*
     * Draft creation is deliberately separated from send.
     *
     * This allows us to revalidate qualified authority as close as
     * possible to the actual external delivery side effect.
     */
    var draft;

    try {
      draft =
        GmailApp.createDraft(
          recipient,
          subject,
          body
        );
    } catch (error) {
      safeFailed_(
        attemptId,
        'Gmail draft creation failed: ' +
          message_(error),
        details.notes
      );

      throw new Error(
        'Email delivery failed before send: ' +
        message_(error)
      );
    }

    var draftId =
      safeDraftId_(draft);

    /*
     * Increment 6 authority boundary:
     *
     * Re-read the persisted execution and revalidate QDQ authority
     * immediately before draft.send().
     */
    var sendAuthorityValidatedAt;

    try {
      validateCurrentExecutionAuthority_(
        executionId
      );

      /*
       * This timestamp is the historical proof that qualified
       * authority was current immediately before the irreversible
       * Gmail send side effect.
       */
      sendAuthorityValidatedAt =
        new Date();
    } catch (error) {
      safeDeleteDraft_(draft);

      safeFailed_(
        attemptId,
        'Authority validation blocked email send: ' +
          message_(error),
        draftId
          ? 'Deleted Gmail draft ' +
            draftId +
            ' before send.'
          : 'Gmail draft deleted before send.'
      );

      throw new Error(
        'Email delivery blocked before send: ' +
        message_(error)
      );
    }

    var sentMessage;

    try {
      sentMessage =
        draft.send();
    } catch (error) {
      /*
       * Once send() is invoked, an exception does not prove that
       * Gmail performed no side effect. Never auto-retry this case.
       */
      safeUncertain_(
        attemptId,
        'Gmail send outcome is uncertain: ' +
          message_(error),
        [
          draftId
            ? 'Draft ID: ' + draftId
            : '',
          details.notes || ''
        ].filter(Boolean).join(' ')
      );

      throw new Error(
        'Email delivery outcome is uncertain. Do not retry automatically: ' +
        message_(error)
      );
    }

    var messageId = '';

    try {
      if (
        !sentMessage ||
        typeof sentMessage.getId !==
          'function'
      ) {
        throw new Error(
          'Gmail did not return a message identifier.'
        );
      }

      messageId =
        String(
          sentMessage.getId() || ''
        ).trim();

      requireText_(
        messageId,
        'Gmail Message ID'
      );
    } catch (error) {
      safeUncertain_(
        attemptId,
        'Gmail send returned successfully but message evidence could not be captured: ' +
          message_(error),
        [
          draftId
            ? 'Draft ID: ' + draftId
            : '',
          details.notes || ''
        ].filter(Boolean).join(' ')
      );

      throw new Error(
        'Email may have been sent, but Gmail message evidence could not be captured. Do not retry automatically.'
      );
    }

    /*
     * The Gmail message ID is external transport evidence.
     *
     * Persisting Sent evidence still does NOT mutate
     * OFFER_EXECUTION_QUEUE to Submitted in this commit.
     */
    try {
      var sent =
        REOS.OfferDeliveryEvidence.recordSent(
          attemptId,
          {
            authorityValidatedAt:
              sendAuthorityValidatedAt,
            type:
              'GMAIL_MESSAGE_ID',
            reference:
              messageId,
            notes:
              details.notes || ''
          }
        );

      return {
        ok: true,
        sent: true,
        idempotent: false,
        messageId:
          messageId,
        attempt:
          clean_(
            sent.record
          )
      };
    } catch (error) {
      /*
       * Gmail already returned a sent message. A persistence failure
       * after this point must never cause an automatic resend.
       */
      var current =
        safeGetAttempt_(
          attemptId
        );

      if (
        current &&
        REOS.OfferDeliveryEvidence.isSentEvidence(
          current
        )
      ) {
        return {
          ok: true,
          sent: true,
          idempotent: false,
          messageId:
            messageId,
          attempt:
            clean_(current)
        };
      }

      safeUncertain_(
        attemptId,
        'Gmail message ' +
          messageId +
          ' was returned, but REOS could not persist Sent evidence: ' +
          message_(error),
        details.notes || ''
      );

      throw new Error(
        'Email send succeeded with Gmail message ID ' +
        messageId +
        ', but REOS evidence persistence failed. Do not retry automatically.'
      );
    }
  }

  function validateCurrentExecutionAuthority_(
    executionId
  ) {
    var row =
      REOS.Database.findById(
        'OFFER_EXECUTION_QUEUE',
        'Execution ID',
        String(
          executionId || ''
        )
      );

    if (!row) {
      throw new Error(
        'Offer execution not found: ' +
        executionId
      );
    }

    if (
      String(
        row[
          'Execution Status'
        ] || ''
      ) !== 'Ready'
    ) {
      throw new Error(
        'Email delivery requires Ready execution status.'
      );
    }

    if (
      String(
        row[
          'Authority Source'
        ] || ''
      ) !==
        'QUALIFIED_DEAL_QUEUE'
    ) {
      throw new Error(
        'Email delivery requires qualified-deal authority provenance.'
      );
    }

    requireText_(
      row[
        'Qualified Queue ID'
      ],
      'Qualified Queue ID'
    );

    requireText_(
      row[
        'Deal ID'
      ],
      'Deal ID'
    );

    requireText_(
      row[
        'Analysis ID'
      ],
      'Analysis ID'
    );

    if (
      !REOS.QualifiedDealQueue ||
      typeof REOS.QualifiedDealQueue
        .validateAuthority !==
        'function'
    ) {
      throw new Error(
        'Qualified-deal authority validator is unavailable.'
      );
    }

    var validation =
      REOS.QualifiedDealQueue.validateAuthority({
        queueId:
          String(
            row[
              'Qualified Queue ID'
            ] || ''
          ),
        dealId:
          String(
            row[
              'Deal ID'
            ] || ''
          ),
        analysisId:
          String(
            row[
              'Analysis ID'
            ] || ''
          )
      });

    if (
      !validation ||
      validation.ok !== true ||
      validation.authorized !== true
    ) {
      throw new Error(
        validation &&
        validation.reason
          ? String(
              validation.reason
            )
          : 'Qualified-deal authority was not confirmed.'
      );
    }

    return row;
  }

  function assertDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.findById !==
        'function'
    ) {
      throw new Error(
        'OfferDeliveryTransport requires REOS.Database.findById.'
      );
    }

    if (
      !REOS.OfferDeliveryEvidence ||
      typeof REOS.OfferDeliveryEvidence.prepare !==
        'function' ||
      typeof REOS.OfferDeliveryEvidence.markSending !==
        'function' ||
      typeof REOS.OfferDeliveryEvidence.recordSent !==
        'function' ||
      typeof REOS.OfferDeliveryEvidence.recordFailed !==
        'function' ||
      typeof REOS.OfferDeliveryEvidence.recordUncertain !==
        'function' ||
      typeof REOS.OfferDeliveryEvidence.get !==
        'function' ||
      typeof REOS.OfferDeliveryEvidence.isSentEvidence !==
        'function'
    ) {
      throw new Error(
        'OfferDeliveryTransport requires OfferDeliveryEvidence.'
      );
    }

    if (
      typeof GmailApp ===
        'undefined' ||
      !GmailApp ||
      typeof GmailApp.createDraft !==
        'function'
    ) {
      throw new Error(
        'Gmail delivery service is unavailable.'
      );
    }
  }

  function safeFailed_(
    attemptId,
    error,
    notes
  ) {
    try {
      REOS.OfferDeliveryEvidence.recordFailed(
        attemptId,
        {
          error:
            error || 'Delivery failed.',
          notes:
            notes || ''
        }
      );
    } catch (ignored) {}
  }

  function safeUncertain_(
    attemptId,
    error,
    notes
  ) {
    try {
      REOS.OfferDeliveryEvidence.recordUncertain(
        attemptId,
        {
          error:
            error || 'Delivery outcome uncertain.',
          notes:
            notes || ''
        }
      );
    } catch (ignored) {}
  }

  function safeGetAttempt_(
    attemptId
  ) {
    try {
      return REOS.OfferDeliveryEvidence.get(
        attemptId
      );
    } catch (error) {
      return null;
    }
  }

  function safeDraftId_(
    draft
  ) {
    try {
      if (
        draft &&
        typeof draft.getId ===
          'function'
      ) {
        return String(
          draft.getId() || ''
        );
      }
    } catch (ignored) {}

    return '';
  }

  function safeDeleteDraft_(
    draft
  ) {
    try {
      if (
        draft &&
        typeof draft.deleteDraft ===
          'function'
      ) {
        draft.deleteDraft();
      }
    } catch (ignored) {}
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

  function message_(
    error
  ) {
    return error &&
      error.message
        ? error.message
        : String(error);
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
    deliverEmail:
      deliverEmail
  };
})();

function reosOfferDeliveryEmail(
  executionId,
  details
) {
  reosRequireOfferExecutionPermission_();

  return REOS.OfferDeliveryTransport
    .deliverEmail(
      executionId,
      details || {}
    );
}
