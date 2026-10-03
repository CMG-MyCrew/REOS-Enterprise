'use strict';

const REASONS = Object.freeze({
  ARV_EVIDENCE_MISSING: 'ARV_EVIDENCE_MISSING',
  ARV_EVIDENCE_NOT_SUPPORTED: 'ARV_EVIDENCE_NOT_SUPPORTED',
  ARV_CONFIDENCE_NOT_SUFFICIENT: 'ARV_CONFIDENCE_NOT_SUFFICIENT',
  ARV_VALUE_MISSING_OR_INVALID: 'ARV_VALUE_MISSING_OR_INVALID',
  ARV_COMPARABLE_IDS_MISSING: 'ARV_COMPARABLE_IDS_MISSING',
  ARV_COMPARABLE_COUNT_INSUFFICIENT:
    'ARV_COMPARABLE_COUNT_INSUFFICIENT',
  ARV_DEAL_ID_MISMATCH: 'ARV_DEAL_ID_MISMATCH',
  ARV_REVIEW_REQUIRED: 'ARV_REVIEW_REQUIRED',

  REPAIR_SCOPE_MISSING: 'REPAIR_SCOPE_MISSING',
  REPAIR_SCOPE_NOT_ADEQUATE: 'REPAIR_SCOPE_NOT_ADEQUATE',
  REPAIR_ESTIMATE_MISSING_OR_INVALID:
    'REPAIR_ESTIMATE_MISSING_OR_INVALID',
  REPAIR_DEAL_ID_MISMATCH: 'REPAIR_DEAL_ID_MISMATCH',
  REPAIR_SCOPE_INCOMPLETE: 'REPAIR_SCOPE_INCOMPLETE',
  REPAIR_REVIEW_REQUIRED: 'REPAIR_REVIEW_REQUIRED',

  OFFER_READINESS_ELIGIBLE: 'OFFER_READINESS_ELIGIBLE'
});

function positiveFinite(value) {
  return Number.isFinite(value) && value > 0;
}

function nonNegativeFinite(value) {
  return Number.isFinite(value) && value >= 0;
}

function evaluateOfferReadiness(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('input is required');
  }

  if (typeof input.dealId !== 'string' || !input.dealId.trim()) {
    throw new Error('dealId is required');
  }

  const reasons = [];
  const arv = input.arvEvidence;
  const repair = input.repairScope;

  let compSupportedArvReady = true;
  let repairScopeReady = true;

  if (!arv || typeof arv !== 'object') {
    reasons.push(REASONS.ARV_EVIDENCE_MISSING);
    compSupportedArvReady = false;
  } else {
    if (arv.dealId !== input.dealId) {
      reasons.push(REASONS.ARV_DEAL_ID_MISMATCH);
      compSupportedArvReady = false;
    }

    if (arv.evidenceStatus !== 'supported') {
      reasons.push(REASONS.ARV_EVIDENCE_NOT_SUPPORTED);
      compSupportedArvReady = false;
    }

    if (arv.confidenceStatus !== 'sufficient') {
      reasons.push(REASONS.ARV_CONFIDENCE_NOT_SUFFICIENT);
      compSupportedArvReady = false;
    }

    if (!positiveFinite(arv.estimatedArv)) {
      reasons.push(REASONS.ARV_VALUE_MISSING_OR_INVALID);
      compSupportedArvReady = false;
    }

    if (
      !Array.isArray(arv.acceptedComparableEvidenceIds) ||
      arv.acceptedComparableEvidenceIds.length === 0
    ) {
      reasons.push(REASONS.ARV_COMPARABLE_IDS_MISSING);
      compSupportedArvReady = false;
    }

    if (
      !Number.isInteger(arv.acceptedComparableCount) ||
      !Number.isInteger(arv.minimumAcceptedComparableCount) ||
      arv.minimumAcceptedComparableCount < 1 ||
      arv.acceptedComparableCount <
        arv.minimumAcceptedComparableCount
    ) {
      reasons.push(REASONS.ARV_COMPARABLE_COUNT_INSUFFICIENT);
      compSupportedArvReady = false;
    }

    if (arv.reviewRequired === true) {
      reasons.push(REASONS.ARV_REVIEW_REQUIRED);
      compSupportedArvReady = false;
    }
  }

  if (!repair || typeof repair !== 'object') {
    reasons.push(REASONS.REPAIR_SCOPE_MISSING);
    repairScopeReady = false;
  } else {
    if (repair.dealId !== input.dealId) {
      reasons.push(REASONS.REPAIR_DEAL_ID_MISMATCH);
      repairScopeReady = false;
    }

    if (repair.scopeStatus !== 'adequate') {
      reasons.push(REASONS.REPAIR_SCOPE_NOT_ADEQUATE);
      repairScopeReady = false;
    }

    if (!nonNegativeFinite(repair.estimatedRepairCost)) {
      reasons.push(REASONS.REPAIR_ESTIMATE_MISSING_OR_INVALID);
      repairScopeReady = false;
    }

    if (repair.scopeComplete !== true) {
      reasons.push(REASONS.REPAIR_SCOPE_INCOMPLETE);
      repairScopeReady = false;
    }

    if (repair.reviewRequired === true) {
      reasons.push(REASONS.REPAIR_REVIEW_REQUIRED);
      repairScopeReady = false;
    }
  }

  const eligible =
    compSupportedArvReady === true &&
    repairScopeReady === true;

  if (eligible) {
    reasons.push(REASONS.OFFER_READINESS_ELIGIBLE);
  }

  return {
    decision: eligible ? 'eligible' : 'blocked',
    dealId: input.dealId,
    compSupportedArvReady,
    repairScopeReady,
    reasons
  };
}

module.exports = {
  REASONS,
  evaluateOfferReadiness
};
