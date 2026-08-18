/*
 * REOS Enterprise v3.0
 * Deal Increment 3 — Decision Engine
 *
 * Formal deal classification layer.
 * Consumes existing REOS analysis/scoring outputs without replacing
 * DealAnalyzer, DealLogicVersioning, or AcquisitionIntelligence.
 */

var REOS = REOS || {};

REOS.DealDecisionEngine = (function () {
  'use strict';

  var VERSION = '3.0.0';

  var DECISIONS = {
    BUY: 'BUY',
    REVIEW: 'REVIEW',
    RESEARCH: 'RESEARCH',
    PASS: 'PASS'
  };

  var DEFAULT_RULES = {
    minimumBuyProfit: 25000,
    minimumReviewProfit: 15000,

    minimumBuyROI: 20,
    minimumViableROI: 10,

    minimumBuyDSCR: 1.20,
    minimumReviewDSCR: 1.00,

    preferredDistressScore: 70,

    rentalStrategies: [
      'RENTAL',
      'HOLD',
      'BRRRR'
    ]
  };

  function evaluate(input, options) {
    input = input || {};
    options = options || {};

    var rules = mergeRules_(DEFAULT_RULES, options.rules || {});
    var metrics = normalize_(input);
    var reasons = [];
    var warnings = [];
    var blockers = [];
    var missingData = [];

    validateRequiredData_(metrics, missingData);

    var rental = isRentalStrategy_(metrics.strategy, rules);

    if (!metrics.hasProjectedProfit) {
      missingData.push('projectedProfit');
    }

    if (!metrics.hasROI) {
      missingData.push('roi');
    }

    if (rental && !metrics.hasDSCR) {
      missingData.push('dscr');
    }

    if (!metrics.dataConfidence) {
      missingData.push('dataConfidence');
    }

    missingData = unique_(missingData);

    /*
     * Missing or low-confidence information is RESEARCH rather than PASS.
     * The engine should not reject a deal when the evidence itself
     * is insufficient.
     */
    if (
      missingData.length ||
      metrics.dataConfidence === 'Low'
    ) {
      if (metrics.dataConfidence === 'Low') {
        reasons.push('LOW_DATA_CONFIDENCE');
      }

      if (missingData.length) {
        reasons.push('REQUIRED_DATA_MISSING');
      }

      return result_(
        DECISIONS.RESEARCH,
        metrics,
        reasons,
        warnings,
        blockers,
        missingData,
        rules
      );
    }

    /*
     * Hard economic PASS gates.
     */
    if (metrics.projectedProfit < rules.minimumReviewProfit) {
      blockers.push('PROFIT_BELOW_MINIMUM');
    }

    if (metrics.roi < rules.minimumViableROI) {
      blockers.push('ROI_BELOW_MINIMUM');
    }

    if (rental && metrics.dscr < rules.minimumReviewDSCR) {
      blockers.push('DSCR_BELOW_MINIMUM');
    }

    if (metrics.riskLevel === 'Critical') {
      blockers.push('CRITICAL_RISK');
    }

    if (blockers.length) {
      reasons.push('HARD_GATE_FAILED');

      return result_(
        DECISIONS.PASS,
        metrics,
        reasons,
        warnings,
        blockers,
        missingData,
        rules
      );
    }

    /*
     * BUY requires strong economics and high confidence.
     */
    var maoCompliant =
      metrics.mao > 0 &&
      metrics.purchasePrice > 0 &&
      metrics.purchasePrice <= metrics.mao;

    var buyEligible =
      maoCompliant &&
      metrics.projectedProfit >= rules.minimumBuyProfit &&
      metrics.roi >= rules.minimumBuyROI &&
      metrics.riskLevel === 'Low' &&
      metrics.dataConfidence === 'High' &&
      (!rental || metrics.dscr >= rules.minimumBuyDSCR);

    if (buyEligible) {
      reasons.push('MAO_COMPLIANT');
      reasons.push('BUY_PROFIT_THRESHOLD_MET');
      reasons.push('BUY_ROI_THRESHOLD_MET');
      reasons.push('LOW_RISK');
      reasons.push('HIGH_DATA_CONFIDENCE');

      if (metrics.distressScore >= rules.preferredDistressScore) {
        reasons.push('HIGH_DISTRESS_OPPORTUNITY');
      }

      return result_(
        DECISIONS.BUY,
        metrics,
        reasons,
        warnings,
        blockers,
        missingData,
        rules
      );
    }

    /*
     * Economically viable deals that do not satisfy every BUY gate
     * require human review.
     */
    reasons.push('HUMAN_REVIEW_REQUIRED');

    if (!maoCompliant) {
      warnings.push('PURCHASE_PRICE_ABOVE_MAO');
    }

    if (metrics.projectedProfit < rules.minimumBuyProfit) {
      warnings.push('PROFIT_BELOW_BUY_THRESHOLD');
    }

    if (metrics.roi < rules.minimumBuyROI) {
      warnings.push('ROI_BELOW_BUY_THRESHOLD');
    }

    if (metrics.riskLevel !== 'Low') {
      warnings.push('ELEVATED_RISK');
    }

    if (metrics.dataConfidence !== 'High') {
      warnings.push('CONFIDENCE_BELOW_BUY_THRESHOLD');
    }

    if (
      rental &&
      metrics.dscr < rules.minimumBuyDSCR
    ) {
      warnings.push('DSCR_BELOW_BUY_THRESHOLD');
    }

    return result_(
      DECISIONS.REVIEW,
      metrics,
      reasons,
      warnings,
      blockers,
      missingData,
      rules
    );
  }

  function normalize_(input) {
    return {
      dealId: text_(input.dealId),
      analysisId: text_(input.analysisId),
      strategy: text_(input.strategy || 'FLIP').toUpperCase(),

      mao: number_(input.mao),
      purchasePrice: number_(input.purchasePrice),
      projectedProfit: number_(input.projectedProfit),
      roi: number_(input.roi),
      dscr: number_(input.dscr),

      hasProjectedProfit: hasValue_(input.projectedProfit),
      hasROI: hasValue_(input.roi),
      hasDSCR: hasValue_(input.dscr),

      distressScore: number_(input.distressScore),
      dealScore: number_(input.dealScore),

      riskLevel: normalizeRisk_(input.riskLevel),
      dataConfidence: normalizeConfidence_(input.dataConfidence)
    };
  }

  function validateRequiredData_(metrics, missing) {
    if (metrics.mao <= 0) missing.push('mao');
    if (metrics.purchasePrice <= 0) missing.push('purchasePrice');

    /*
     * Profit and ROI may legitimately be negative, so presence must
     * be determined from the normalized source contract by callers.
     * Zero values are treated as valid economic values and evaluated
     * by the hard gates.
     */
  }

  function isRentalStrategy_(strategy, rules) {
    return rules.rentalStrategies.indexOf(
      text_(strategy).toUpperCase()
    ) !== -1;
  }

  function normalizeRisk_(value) {
    var risk = text_(value).toLowerCase();

    if (risk === 'critical') return 'Critical';
    if (risk === 'high') return 'High';
    if (risk === 'medium') return 'Medium';
    if (risk === 'low') return 'Low';

    return 'Unknown';
  }

  function normalizeConfidence_(value) {
    var confidence = text_(value).toLowerCase();

    if (confidence === 'high') return 'High';
    if (confidence === 'medium') return 'Medium';
    if (confidence === 'low') return 'Low';

    return '';
  }

  function result_(
    decision,
    metrics,
    reasons,
    warnings,
    blockers,
    missingData,
    rules
  ) {
    return {
      decision: decision,
      eligibleForOffer: decision === DECISIONS.BUY,

      reasons: unique_(reasons),
      warnings: unique_(warnings),
      blockers: unique_(blockers),
      missingData: unique_(missingData),

      metrics: metrics,

      rulesetVersion: VERSION,
      rules: rules
    };
  }

  function mergeRules_(base, overrides) {
    var result = {};
    var key;

    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        result[key] = base[key];
      }
    }

    for (key in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, key)) {
        result[key] = overrides[key];
      }
    }

    return result;
  }

  function unique_(values) {
    var seen = {};

    return (values || []).filter(function (value) {
      value = String(value || '');

      if (!value || seen[value]) return false;

      seen[value] = true;
      return true;
    });
  }

  function hasValue_(value) {
    return !(
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '')
    );
  }

  function text_(value) {
    return String(
      value === null || value === undefined ? '' : value
    ).trim();
  }

  function number_(value) {
    if (typeof value === 'number') {
      return isFinite(value) ? value : 0;
    }

    var parsed = Number(
      String(value || '').replace(/[^0-9.\-]/g, '')
    );

    return isFinite(parsed) ? parsed : 0;
  }

  return {
    VERSION: VERSION,
    DECISIONS: DECISIONS,
    DEFAULT_RULES: DEFAULT_RULES,
    evaluate: evaluate
  };
})();
