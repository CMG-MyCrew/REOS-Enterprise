'use strict';

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function positiveNumber(value) {
  return finiteNumber(value) && value > 0;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  const ordered = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);

  if (ordered.length % 2) {
    return ordered[middle];
  }

  return (ordered[middle - 1] + ordered[middle]) / 2;
}

function result(status, reasonCodes, extra) {
  return Object.assign(
    {
      evidenceStatus: status,
      confidence:
        status === 'supported'
          ? 'sufficient'
          : status === 'review_required'
            ? 'review_required'
            : 'insufficient',
      reasonCodes: reasonCodes.slice(),
      estimatedArv: null
    },
    extra || {}
  );
}

function evaluateArvEvidence(input) {
  if (!input || !input.subject || !input.policy) {
    throw new Error('subject and policy are required');
  }

  const subject = input.subject;
  const policy = input.policy;
  const comparables = Array.isArray(input.comparables)
    ? input.comparables
    : [];

  if (!positiveNumber(subject.livingArea)) {
    return result(
      'insufficient',
      ['SUBJECT_LIVING_AREA_MISSING_OR_INVALID']
    );
  }

  if (
    !Number.isInteger(policy.minimumAcceptedCompCount) ||
    policy.minimumAcceptedCompCount < 1
  ) {
    throw new Error(
      'policy.minimumAcceptedCompCount must be a positive integer'
    );
  }

  if (
    !finiteNumber(policy.maxPpsfSpreadRatio) ||
    policy.maxPpsfSpreadRatio < 0
  ) {
    throw new Error(
      'policy.maxPpsfSpreadRatio must be a non-negative finite number'
    );
  }

  if (comparables.length < policy.minimumAcceptedCompCount) {
    return result(
      'insufficient',
      ['MINIMUM_ACCEPTED_COMP_COUNT_NOT_MET'],
      {
        acceptedComparableCount: comparables.length,
        requiredComparableCount: policy.minimumAcceptedCompCount
      }
    );
  }

  const ids = new Set();
  const ppsfValues = [];
  const soldPrices = [];
  const evidenceIds = [];

  for (const comp of comparables) {
    if (!comp || comp.acceptanceDecision !== 'accepted') {
      return result(
        'insufficient',
        ['NON_ACCEPTED_COMPARABLE_SUPPLIED']
      );
    }

    if (
      typeof comp.comparableEvidenceId !== 'string' ||
      !comp.comparableEvidenceId.trim()
    ) {
      return result(
        'insufficient',
        ['COMPARABLE_EVIDENCE_ID_MISSING']
      );
    }

    if (ids.has(comp.comparableEvidenceId)) {
      return result(
        'insufficient',
        ['DUPLICATE_COMPARABLE_EVIDENCE_ID']
      );
    }

    ids.add(comp.comparableEvidenceId);
    evidenceIds.push(comp.comparableEvidenceId);

    if (!positiveNumber(comp.salePrice)) {
      return result(
        'insufficient',
        ['COMPARABLE_SALE_PRICE_MISSING_OR_INVALID']
      );
    }

    if (!positiveNumber(comp.livingArea)) {
      return result(
        'insufficient',
        ['COMPARABLE_LIVING_AREA_MISSING_OR_INVALID']
      );
    }

    soldPrices.push(comp.salePrice);
    ppsfValues.push(comp.salePrice / comp.livingArea);
  }

  const averageSoldPrice = average(soldPrices);
  const medianSoldPrice = median(soldPrices);

  const averagePpsf = average(ppsfValues);
  const medianPpsf = median(ppsfValues);
  const lowPpsf = Math.min(...ppsfValues);
  const highPpsf = Math.max(...ppsfValues);

  const spreadRatio =
    medianPpsf === 0
      ? Infinity
      : (highPpsf - lowPpsf) / medianPpsf;

  const commonEvidence = {
    acceptedComparableCount: comparables.length,
    requiredComparableCount: policy.minimumAcceptedCompCount,
    comparableEvidenceIds: evidenceIds.slice().sort(),
    valuationMethod: 'median_price_per_square_foot',
    averageSoldPrice: roundMoney(averageSoldPrice),
    medianSoldPrice: roundMoney(medianSoldPrice),
    averagePricePerSqFt: roundMoney(averagePpsf),
    medianPricePerSqFt: roundMoney(medianPpsf),
    lowPricePerSqFt: roundMoney(lowPpsf),
    highPricePerSqFt: roundMoney(highPpsf),
    pricePerSqFtSpreadRatio: roundMoney(spreadRatio),
    lowSupportedValue: roundMoney(
      lowPpsf * subject.livingArea
    ),
    highSupportedValue: roundMoney(
      highPpsf * subject.livingArea
    )
  };

  if (spreadRatio > policy.maxPpsfSpreadRatio) {
    return result(
      'review_required',
      ['PRICE_PER_SQFT_DISPERSION_EXCEEDED'],
      commonEvidence
    );
  }

  return result(
    'supported',
    ['ARV_EVIDENCE_SUPPORTED'],
    Object.assign(commonEvidence, {
      estimatedArv: roundMoney(
        medianPpsf * subject.livingArea
      )
    })
  );
}

module.exports = {
  evaluateArvEvidence
};
