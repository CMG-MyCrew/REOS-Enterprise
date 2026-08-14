/*
 * REOS Enterprise v3.0
 * Deal Increment 3 — Decision Adapter
 *
 * Translates existing REOS persistence contracts into the normalized
 * input contract consumed by REOS.DealDecisionEngine.
 *
 * This module does not calculate financial metrics or intelligence.
 */

var REOS = REOS || {};

REOS.DealDecisionAdapter = (function () {
  'use strict';

  var DISTRESS_LEADS = 'DISTRESS_LEADS';
  var DEAL_INTELLIGENCE = 'AI_DEAL_INTELLIGENCE';

  function evaluate(dealId, analysis, score, options) {
    options = options || {};

    assertDependencies_();

    if (!dealId) {
      throw new Error('DealDecisionAdapter requires Deal ID.');
    }

    if (!analysis || !analysis['Analysis ID']) {
      throw new Error(
        'DealDecisionAdapter requires a persisted DEAL_ANALYSIS record.'
      );
    }

    var context = resolveContext_(dealId, options);

    var input = buildInput_(
      dealId,
      analysis,
      score || {},
      context,
      options
    );

    var result = REOS.DealDecisionEngine.evaluate(
      input,
      options.engineOptions || {}
    );

    return {
      ok: true,
      dealId: String(dealId),
      analysisId: String(analysis['Analysis ID'] || ''),

      sourceLeadId: context.lead
        ? String(context.lead['Distress Lead ID'] || '')
        : '',

      input: input,
      decision: result,

      sources: {
        analysis: Boolean(analysis),
        dealScore: Boolean(score && score.Score !== undefined),
        distressLead: Boolean(context.lead),
        dealIntelligence: Boolean(context.intelligence)
      }
    };
  }

  function buildInput_(dealId, analysis, score, context, options) {
    var lead = context.lead || {};
    var intelligence = context.intelligence || {};

    var strategy = resolveStrategy_(
      options.strategy,
      intelligence.Strategy
    );

    var rental = isRentalStrategy_(strategy);

    return {
      dealId: String(dealId || ''),
      analysisId: String(analysis['Analysis ID'] || ''),

      strategy: strategy,

      mao: analysis.MAO,
      purchasePrice: analysis['Purchase Price'],

      /*
       * DEAL_ANALYSIS currently exposes Flip Profit and ROI % as
       * resale economics regardless of strategy. Do not present
       * those metrics to the decision engine as rental economics.
       *
       * Until REOS has authoritative rental return metrics,
       * rental strategies intentionally remain RESEARCH.
       */
      projectedProfit: rental
        ? undefined
        : analysis['Flip Profit'],

      roi: rental
        ? undefined
        : analysis['ROI %'],

      dscr: analysis.DSCR,

      distressScore: lead['Distress Score'],
      dealScore: score ? score.Score : '',

      riskLevel: analysis['Risk Level'],
      dataConfidence: intelligence.Confidence
    };
  }

  function resolveContext_(dealId, options) {
    var lead = options.lead || findDistressLeadForDeal_(dealId);
    var intelligence = options.intelligence ||
      findDealIntelligence_(lead);

    return {
      lead: lead,
      intelligence: intelligence
    };
  }

  function findDistressLeadForDeal_(dealId) {
    var rows = safeAll_(DISTRESS_LEADS);

    var matches = rows.filter(function (row) {
      return String(row['Imported Deal ID'] || '') ===
        String(dealId || '');
    });

    if (!matches.length) return null;

    matches.sort(function (a, b) {
      return timestamp_(a['Updated At'] || a['Created At']) -
        timestamp_(b['Updated At'] || b['Created At']);
    });

    return matches[matches.length - 1];
  }

  function findDealIntelligence_(lead) {
    if (!lead) return null;

    var leadId = String(
      lead['Distress Lead ID'] ||
      lead['Lead ID'] ||
      ''
    );

    if (!leadId) return null;

    var rows = safeAll_(DEAL_INTELLIGENCE);

    var matches = rows.filter(function (row) {
      return String(row['Distress Lead ID'] || '') === leadId;
    });

    if (!matches.length) return null;

    matches.sort(function (a, b) {
      return timestamp_(a['Updated At'] || a['Created At']) -
        timestamp_(b['Updated At'] || b['Created At']);
    });

    return matches[matches.length - 1];
  }

  function isRentalStrategy_(strategy) {
    return (
      strategy === 'RENTAL' ||
      strategy === 'HOLD' ||
      strategy === 'BRRRR'
    );
  }

  function resolveStrategy_(explicitStrategy, intelligenceStrategy) {
    var strategy = String(
      explicitStrategy ||
      intelligenceStrategy ||
      'FLIP'
    ).trim();

    var normalized = strategy.toUpperCase();

    if (
      normalized === 'RENTAL / BRRRR' ||
      normalized === 'RENTAL/BRRRR'
    ) {
      return 'BRRRR';
    }

    if (normalized === 'RENTAL') return 'RENTAL';
    if (normalized === 'HOLD') return 'HOLD';
    if (normalized === 'BRRRR') return 'BRRRR';
    if (normalized === 'WHOLESALE') return 'WHOLESALE';
    if (normalized === 'FLIP') return 'FLIP';

    return normalized || 'FLIP';
  }

  function safeAll_(sheetName) {
    try {
      return REOS.Database.getAll(sheetName) || [];
    } catch (error) {
      return [];
    }
  }

  function timestamp_(value) {
    if (!value) return 0;

    var date = value instanceof Date
      ? value
      : new Date(value);

    return isFinite(date.getTime())
      ? date.getTime()
      : 0;
  }

  function assertDependencies_() {
    if (!REOS.Database) {
      throw new Error(
        'DealDecisionAdapter requires REOS.Database.'
      );
    }

    if (
      !REOS.DealDecisionEngine ||
      typeof REOS.DealDecisionEngine.evaluate !== 'function'
    ) {
      throw new Error(
        'DealDecisionAdapter requires REOS.DealDecisionEngine.'
      );
    }
  }

  return {
    evaluate: evaluate,
    buildInput: function (
      dealId,
      analysis,
      score,
      context,
      options
    ) {
      return buildInput_(
        dealId,
        analysis || {},
        score || {},
        context || {},
        options || {}
      );
    }
  };
})();
