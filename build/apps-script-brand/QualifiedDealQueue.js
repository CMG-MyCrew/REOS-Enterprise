/*
 * REOS Enterprise v3.0
 * Deal Increment 4 — Qualified Deal Queue
 *
 * Controlled execution boundary between formal deal decisions and
 * operational offer/follow-up workflows.
 *
 * Increment 3 decides whether a deal is eligible for offer execution.
 * Increment 4 records that authority in an auditable, reversible queue.
 *
 * Queue authority does NOT imply offer-send authority.
 */

var REOS = REOS || {};

REOS.QualifiedDealQueue = (function () {
  'use strict';

  var TABLE = 'QUALIFIED_DEAL_QUEUE';

  var HEADERS = [
    'Queue ID',
    'Deal ID',
    'Analysis ID',
    'Decision',
    'Eligible For Offer',
    'Queue Status',
    'Ruleset Version',
    'Reasons',
    'Warnings',
    'Blockers',
    'Missing Data',
    'Decision Snapshot',
    'Queued At',
    'Queued By',
    'Created At',
    'Updated At',
    'Active'
  ];

  var STATUS = {
    PENDING: 'Pending',
    REMOVED: 'Removed'
  };

  function ensureTable() {
    assertDependencies_();
    return ensureColumns_(TABLE, HEADERS);
  }

  /**
   * Records queue authority granted by Increment 3.
   *
   * Only BUY + eligibleForOffer === true may enter the active queue.
   * This method does not create, prepare, approve, or send an offer.
   */
  function qualify(formalDecision, options) {
    options = options || {};

    assertDependencies_();
    ensureTable();

    validateFormalDecision_(formalDecision);

    var result = formalDecision.decision;
    var dealId = String(formalDecision.dealId || '');
    var analysisId = String(formalDecision.analysisId || '');

    if (
      result.decision !== 'BUY' ||
      result.eligibleForOffer !== true
    ) {
      var revoked = revokeActive_(
        dealId,
        buildRevocationReason_(result)
      );

      return {
        ok: true,
        queued: false,
        revoked: revoked.removed === true,
        queue: revoked.queue || null,
        reason: 'Decision does not grant qualified-deal queue authority.',
        dealId: dealId,
        analysisId: analysisId,
        decision: result.decision || '',
        eligibleForOffer: result.eligibleForOffer === true
      };
    }

    var existing = findActiveByDeal_(dealId);

    var now = new Date();
    var record = buildRecord_(
      formalDecision,
      options,
      now
    );

    if (existing) {
      REOS.Database.update(
        TABLE,
        'Queue ID',
        existing['Queue ID'],
        record
      );

      return {
        ok: true,
        queued: true,
        created: false,
        queue: REOS.Database.findById(
          TABLE,
          'Queue ID',
          existing['Queue ID']
        )
      };
    }

    var inserted = REOS.Database.insert(
      TABLE,
      record,
      {
        idField: 'Queue ID',
        idPrefix: 'QDQ'
      }
    );

    return {
      ok: true,
      queued: true,
      created: true,
      queue: inserted
    };
  }

  function getByDealId(dealId) {
    assertDependencies_();
    ensureTable();

    return findActiveByDeal_(String(dealId || ''));
  }

  function listPending() {
    assertDependencies_();
    ensureTable();

    return REOS.Database.getAll(TABLE).filter(function (row) {
      return (
        row.Active !== false &&
        String(row['Queue Status'] || '') === STATUS.PENDING
      );
    });
  }

  function remove(dealId, reason) {
    assertDependencies_();
    ensureTable();

    return revokeActive_(
      String(dealId || ''),
      reason || 'Removed from qualified-deal queue.'
    );
  }

  function revokeActive_(dealId, reason) {
    var existing = findActiveByDeal_(String(dealId || ''));

    if (!existing) {
      return {
        ok: true,
        removed: false,
        queue: null,
        reason: 'No active qualified-deal queue entry found.'
      };
    }

    REOS.Database.update(
      TABLE,
      'Queue ID',
      existing['Queue ID'],
      {
        'Queue Status': STATUS.REMOVED,
        'Blockers': appendText_(
          existing.Blockers,
          reason || 'Removed from qualified-deal queue.'
        ),
        Active: false
      }
    );

    return {
      ok: true,
      removed: true,
      queue: REOS.Database.findById(
        TABLE,
        'Queue ID',
        existing['Queue ID']
      )
    };
  }

  function buildRevocationReason_(result) {
    return (
      'Queue authority revoked by formal decision: ' +
      String(result.decision || 'UNKNOWN') +
      '; eligibleForOffer=' +
      String(result.eligibleForOffer === true)
    );
  }

  function buildRecord_(formalDecision, options, now) {
    var result = formalDecision.decision || {};

    return {
      'Deal ID': String(formalDecision.dealId || ''),
      'Analysis ID': String(formalDecision.analysisId || ''),
      Decision: String(result.decision || ''),
      'Eligible For Offer': result.eligibleForOffer === true,
      'Queue Status': STATUS.PENDING,
      'Ruleset Version': String(result.rulesetVersion || ''),
      Reasons: serializeList_(result.reasons),
      Warnings: serializeList_(result.warnings),
      Blockers: serializeList_(result.blockers),
      'Missing Data': serializeList_(result.missingData),
      'Decision Snapshot': JSON.stringify({
        decision: result.decision || '',
        eligibleForOffer: result.eligibleForOffer === true,
        metrics: result.metrics || {},
        rulesetVersion: result.rulesetVersion || '',
        rules: result.rules || {}
      }),
      'Queued At': now,
      'Queued By': resolveUser_(options),
      Active: true
    };
  }

  function validateFormalDecision_(formalDecision) {
    if (
      !formalDecision ||
      formalDecision.ok !== true ||
      !formalDecision.dealId ||
      !formalDecision.analysisId ||
      !formalDecision.decision
    ) {
      throw new Error(
        'QualifiedDealQueue requires a valid DealDecisionAdapter result.'
      );
    }

    if (!formalDecision.decision.decision) {
      throw new Error(
        'QualifiedDealQueue requires a formal decision value.'
      );
    }

    if (
      typeof formalDecision.decision.eligibleForOffer !== 'boolean'
    ) {
      throw new Error(
        'QualifiedDealQueue requires explicit eligibleForOffer authority.'
      );
    }
  }

  function findActiveByDeal_(dealId) {
    if (!dealId) return null;

    var matches = REOS.Database.getAll(TABLE).filter(function (row) {
      return (
        String(row['Deal ID'] || '') === dealId &&
        row.Active !== false &&
        String(row['Queue Status'] || '') !== STATUS.REMOVED
      );
    });

    if (!matches.length) return null;

    matches.sort(function (a, b) {
      return dateValue_(b['Updated At'] || b['Queued At']) -
        dateValue_(a['Updated At'] || a['Queued At']);
    });

    return matches[0];
  }

  function ensureColumns_(sheetName, requiredHeaders) {
    var sheet = REOS.Database.ensureTable(
      sheetName,
      requiredHeaders
    );

    var existing = REOS.Database.getHeaders(sheetName);

    var missing = requiredHeaders.filter(function (header) {
      return existing.indexOf(header) === -1;
    });

    if (missing.length) {
      var startColumn = existing.length + 1;

      sheet
        .getRange(1, startColumn, 1, missing.length)
        .setValues([missing]);

      existing = existing.concat(missing);
    }

    return {
      ok: true,
      table: sheetName,
      headers: existing
    };
  }

  function serializeList_(values) {
    if (!Array.isArray(values)) return '';
    return values.join(' | ');
  }

  function appendText_(existing, value) {
    existing = String(existing || '').trim();
    value = String(value || '').trim();

    if (!existing) return value;
    if (!value) return existing;

    return existing + ' | ' + value;
  }

  function resolveUser_(options) {
    if (options && options.user) {
      return String(options.user);
    }

    try {
      return Session.getActiveUser().getEmail() || '';
    } catch (error) {
      return '';
    }
  }

  function dateValue_(value) {
    if (!value) return 0;

    var date = value instanceof Date
      ? value
      : new Date(value);

    return isFinite(date.getTime())
      ? date.getTime()
      : 0;
  }

  function assertDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.ensureTable !== 'function' ||
      typeof REOS.Database.getAll !== 'function' ||
      typeof REOS.Database.insert !== 'function' ||
      typeof REOS.Database.update !== 'function'
    ) {
      throw new Error(
        'QualifiedDealQueue requires REOS.Database.'
      );
    }
  }

  return {
    TABLE: TABLE,
    HEADERS: HEADERS.slice(),
    STATUS: STATUS,

    ensureTable: ensureTable,
    qualify: qualify,
    getByDealId: getByDealId,
    listPending: listPending,
    remove: remove
  };
})();
