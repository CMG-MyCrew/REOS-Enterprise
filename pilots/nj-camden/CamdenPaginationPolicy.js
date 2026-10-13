'use strict';

const COUNTY = 'CAMDEN';
const MAX_PAGE_SIZE = 500;
const ORDER = 'OBJECTID ASC';

function positiveInteger(value) {
  if (typeof value !== 'number' &&
      typeof value !== 'string') return null;

  const s = String(value).trim();
  if (!/^[1-9][0-9]*$/.test(s)) return null;

  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

function cursorValue(value) {
  if (value === null || value === undefined ||
      value === '') return 0;

  return positiveInteger(value);
}

function planPage(cursor, requestedLimit) {
  const last = cursorValue(cursor);
  const requested = positiveInteger(requestedLimit);

  if (last === null) {
    return {ok: false, reason: 'INVALID_CURSOR'};
  }
  if (requested === null) {
    return {ok: false, reason: 'INVALID_LIMIT'};
  }

  const limit = Math.min(requested, MAX_PAGE_SIZE);

  return {
    ok: true,
    reason: 'PAGE_PLANNED',
    limit,
    lastObjectId: last,
    where: "COUNTY='CAMDEN' AND OBJECTID > " + last,
    orderByFields: ORDER,
    resultRecordCount: limit,
    resultOffset: 0,
    returnGeometry: false
  };
}

function evaluatePage(plan, features, exceededTransferLimit) {
  if (!plan || plan.ok !== true ||
      !Number.isSafeInteger(plan.lastObjectId) ||
      !Number.isSafeInteger(plan.limit) ||
      plan.limit < 1 || plan.limit > MAX_PAGE_SIZE ||
      !Array.isArray(features) ||
      typeof exceededTransferLimit !== 'boolean') {
    return {ok: false, reason: 'INVALID_PAGE_RESPONSE'};
  }

  // Reconstruct the approved query rather than trusting caller fields.
  const canonical = planPage(
    plan.lastObjectId === 0 ? '' : String(plan.lastObjectId),
    plan.limit
  );

  if (
    !canonical.ok ||
    plan.where !== canonical.where ||
    plan.orderByFields !== canonical.orderByFields ||
    plan.resultRecordCount !== canonical.resultRecordCount ||
    plan.resultOffset !== canonical.resultOffset ||
    plan.returnGeometry !== canonical.returnGeometry
  ) {
    return {ok: false, reason: 'PAGE_PLAN_INTEGRITY_FAILED'};
  }

  if (features.length > plan.limit) {
    return {ok: false, reason: 'PAGE_LIMIT_EXCEEDED'};
  }

  let last = plan.lastObjectId;

  for (const feature of features) {
    const raw = feature && feature.attributes
      ? feature.attributes : feature;
    const id = raw && positiveInteger(raw.OBJECTID);

    if (id === null || id <= last ||
        String(raw.COUNTY || '').trim().toUpperCase() !== COUNTY) {
      return {ok: false, reason: 'UNSAFE_PAGE_ORDER_OR_IDENTITY'};
    }
    last = id;
  }

  if (features.length === 0 && exceededTransferLimit) {
    return {ok: false, reason: 'EMPTY_TRUNCATED_PAGE'};
  }

  return {
    ok: true,
    reason: features.length ? 'PAGE_CONTINUATION' :
      'EMPTY_PAGE_OBSERVED',
    nextCursor: String(last),
    recordCount: features.length,
    emptyPageObserved: features.length === 0,
    fullCoverageCertified: false,
    persistenceAuthorized: false
  };
}

module.exports = {
  MAX_PAGE_SIZE,
  ORDER,
  positiveInteger,
  planPage,
  evaluatePage
};
