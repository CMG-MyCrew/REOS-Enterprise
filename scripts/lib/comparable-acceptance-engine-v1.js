'use strict';

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function validPositive(value) {
  return finiteNumber(value) && value > 0;
}

function parseDate(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function ageDays(saleDate, evaluationDate) {
  return Math.floor(
    (evaluationDate.getTime() - saleDate.getTime()) / 86400000
  );
}

function pushUnique(list, code) {
  if (!list.includes(code)) list.push(code);
}

function evaluateComparable(input) {
  const subject = input && input.subject;
  const comp = input && input.comp;
  const policy = input && input.policy;
  const evaluationDateRaw = input && input.evaluationDate;

  if (!subject || !comp || !policy) {
    throw new Error('subject, comp, and policy are required');
  }

  const evaluationDate = parseDate(evaluationDateRaw);

  if (!evaluationDate) {
    throw new Error('evaluationDate must be YYYY-MM-DD');
  }

  const reasons = [];
  const reviewReasons = [];

  if (comp.normalizationOutcome === 'rejected_normalization') {
    pushUnique(reasons, 'NORMALIZATION_REJECTED');
  } else if (comp.normalizationOutcome === 'normalized_with_warnings') {
    pushUnique(reviewReasons, 'NORMALIZATION_WARNING');
  } else if (comp.normalizationOutcome !== 'normalized') {
    pushUnique(reasons, 'NORMALIZATION_REJECTED');
  }

  if (comp.saleStatus !== 'closed') {
    pushUnique(reasons, 'SALE_STATUS_NOT_CLOSED');
  }

  if (!validPositive(comp.salePrice)) {
    pushUnique(reasons, 'SALE_PRICE_MISSING_OR_INVALID');
  }

  const saleDate = parseDate(comp.saleDate);

  if (!saleDate) {
    pushUnique(reasons, 'SALE_DATE_MISSING_OR_INVALID');
  } else {
    const days = ageDays(saleDate, evaluationDate);

    if (days < 0) {
      pushUnique(reasons, 'SALE_DATE_IN_FUTURE');
    } else if (
      finiteNumber(policy.maxSaleAgeDays) &&
      days > policy.maxSaleAgeDays
    ) {
      pushUnique(reasons, 'SALE_TOO_OLD');
    }
  }

  if (
    typeof subject.propertyType !== 'string' ||
    !subject.propertyType.trim()
  ) {
    pushUnique(reasons, 'PROPERTY_TYPE_MISSING');
  }

  if (
    typeof comp.propertyType !== 'string' ||
    !comp.propertyType.trim()
  ) {
    pushUnique(reasons, 'PROPERTY_TYPE_MISSING');
  } else if (
    typeof subject.propertyType === 'string' &&
    subject.propertyType.trim() &&
    comp.propertyType !== subject.propertyType
  ) {
    pushUnique(reasons, 'PROPERTY_TYPE_MISMATCH');
  }

  if (!validPositive(subject.livingArea)) {
    pushUnique(
      reasons,
      'SUBJECT_LIVING_AREA_MISSING_OR_INVALID'
    );
  }

  if (!validPositive(comp.livingArea)) {
    pushUnique(
      reasons,
      'COMP_LIVING_AREA_MISSING_OR_INVALID'
    );
  }

  if (
    validPositive(subject.livingArea) &&
    validPositive(comp.livingArea) &&
    finiteNumber(policy.maxLivingAreaVariancePct)
  ) {
    const variance =
      Math.abs(comp.livingArea - subject.livingArea) /
      subject.livingArea;

    if (variance > policy.maxLivingAreaVariancePct) {
      pushUnique(
        reasons,
        'LIVING_AREA_VARIANCE_EXCEEDED'
      );
    }
  }

  if (
    !finiteNumber(comp.distanceMiles) ||
    comp.distanceMiles < 0
  ) {
    pushUnique(reasons, 'DISTANCE_MISSING_OR_INVALID');
  } else if (
    finiteNumber(policy.maxDistanceMiles) &&
    comp.distanceMiles > policy.maxDistanceMiles
  ) {
    pushUnique(reasons, 'DISTANCE_EXCEEDED');
  }

  if (policy.requireBedrooms === true) {
    if (
      !finiteNumber(subject.bedrooms) ||
      !finiteNumber(comp.bedrooms)
    ) {
      pushUnique(reasons, 'BEDROOMS_MISSING');
    } else if (
      finiteNumber(policy.maxBedroomDifference) &&
      Math.abs(comp.bedrooms - subject.bedrooms) >
        policy.maxBedroomDifference
    ) {
      pushUnique(
        reasons,
        'BEDROOM_DIFFERENCE_EXCEEDED'
      );
    }
  }

  if (policy.requireBathrooms === true) {
    if (
      !finiteNumber(subject.bathrooms) ||
      !finiteNumber(comp.bathrooms)
    ) {
      pushUnique(reasons, 'BATHROOMS_MISSING');
    } else if (
      finiteNumber(policy.maxBathroomDifference) &&
      Math.abs(comp.bathrooms - subject.bathrooms) >
        policy.maxBathroomDifference
    ) {
      pushUnique(
        reasons,
        'BATHROOM_DIFFERENCE_EXCEEDED'
      );
    }
  }

  if (
    Array.isArray(comp.warnings) &&
    comp.warnings.some(
      warning =>
        typeof warning === 'string' &&
        warning.toLowerCase().includes('provenance')
    )
  ) {
    pushUnique(reviewReasons, 'PROVENANCE_WARNING');
  }

  let decision;

  if (reasons.length) {
    decision = 'rejected';
  } else if (reviewReasons.length) {
    decision = 'review_required';
  } else {
    decision = 'accepted';
    reasons.push('ACCEPTED');
  }

  return {
    decision,
    reasons:
      decision === 'review_required'
        ? reviewReasons
        : reasons,
    evaluationDate: evaluationDateRaw,
    policy: JSON.parse(JSON.stringify(policy))
  };
}

module.exports = {
  evaluateComparable
};
