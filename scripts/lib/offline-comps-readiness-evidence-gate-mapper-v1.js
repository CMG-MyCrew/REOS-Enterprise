'use strict';

const READ_OUTCOMES = Object.freeze([
  'selected',
  'not_found',
  'stale',
  'identity_mismatch',
  'contradictory',
  'unsupported_version',
  'malformed'
]);

const ARV_REASON_BY_OUTCOME = Object.freeze({
  not_found: 'ARV_EVIDENCE_NOT_FOUND',
  stale: 'ARV_EVIDENCE_STALE',
  identity_mismatch: 'ARV_IDENTITY_MISMATCH',
  contradictory: 'ARV_EVIDENCE_CONTRADICTORY',
  unsupported_version: 'ARV_UNSUPPORTED_VERSION',
  malformed: 'ARV_EVIDENCE_MALFORMED'
});

const REPAIR_REASON_BY_OUTCOME = Object.freeze({
  not_found: 'REPAIR_EVIDENCE_NOT_FOUND',
  stale: 'REPAIR_EVIDENCE_STALE',
  identity_mismatch: 'REPAIR_IDENTITY_MISMATCH',
  contradictory: 'REPAIR_EVIDENCE_CONTRADICTORY',
  unsupported_version: 'REPAIR_UNSUPPORTED_VERSION',
  malformed: 'REPAIR_EVIDENCE_MALFORMED'
});

const ARV_SUPPORTED_STATUSES = Object.freeze([
  'supported',
  'certified_supported'
]);

const ARV_SUFFICIENT_CONFIDENCE_STATUSES = Object.freeze([
  'sufficient',
  'certified_sufficient'
]);

const REPAIR_ADEQUATE_STATUSES = Object.freeze([
  'adequate',
  'certified_adequate'
]);

const GATE_VERSION = 'offline-comps-readiness-evidence-gate-mapper-v1';

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function exactIdentity(record, dealId, canonicalPropertyKey) {
  return Boolean(
    record &&
    record.dealId === dealId &&
    record.canonicalPropertyKey === canonicalPropertyKey
  );
}

function normalizeIds(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    id => typeof id === 'string' && id.trim().length > 0
  );
}

function uniqueReasons(reasons) {
  return Array.from(new Set(reasons));
}

function evaluateArv(readResult, context) {
  const reasons = [];

  if (!readResult || !READ_OUTCOMES.includes(readResult.outcome)) {
    reasons.push('ARV_EVIDENCE_MALFORMED');
    return { ready: false, evidenceId: null, reasons };
  }

  if (readResult.outcome !== 'selected') {
    reasons.push(
      ARV_REASON_BY_OUTCOME[readResult.outcome] ||
      'ARV_EVIDENCE_MALFORMED'
    );

    return { ready: false, evidenceId: null, reasons };
  }

  const record = readResult.record;

  if (!record || typeof record !== 'object') {
    reasons.push('ARV_EVIDENCE_MALFORMED');
    return { ready: false, evidenceId: null, reasons };
  }

  if (record.dealId !== context.dealId) {
    reasons.push('ARV_IDENTITY_MISMATCH');
  }

  if (record.canonicalPropertyKey !== context.canonicalPropertyKey) {
    reasons.push('ARV_IDENTITY_MISMATCH');
  }

  if (!ARV_SUPPORTED_STATUSES.includes(record.evidenceStatus)) {
    reasons.push('ARV_STATUS_NOT_SUPPORTED');
  }

  if (
    !ARV_SUFFICIENT_CONFIDENCE_STATUSES.includes(
      record.confidenceStatus
    )
  ) {
    reasons.push('ARV_CONFIDENCE_NOT_SUFFICIENT');
  }

  if (!finiteNumber(record.estimatedArv) || record.estimatedArv <= 0) {
    reasons.push('ARV_VALUE_INVALID');
  }

  const comparableIds = normalizeIds(
    record.acceptedComparableEvidenceIds
  );

  if (comparableIds.length === 0) {
    reasons.push('ARV_COMPARABLE_EVIDENCE_MISSING');
  }

  if (
    !finiteNumber(record.acceptedComparableCount) ||
    !finiteNumber(record.minimumComparableCount) ||
    record.acceptedComparableCount < record.minimumComparableCount
  ) {
    reasons.push('ARV_COMPARABLE_COUNT_INSUFFICIENT');
  }

  if (record.reviewRequired !== false) {
    reasons.push('ARV_REVIEW_REQUIRED');
  }

  return {
    ready: reasons.length === 0,
    evidenceId:
      typeof record.arvEvidenceId === 'string'
        ? record.arvEvidenceId
        : null,
    reasons: uniqueReasons(reasons)
  };
}

function evaluateRepair(readResult, context) {
  const reasons = [];

  if (!readResult || !READ_OUTCOMES.includes(readResult.outcome)) {
    reasons.push('REPAIR_EVIDENCE_MALFORMED');
    return { ready: false, evidenceId: null, reasons };
  }

  if (readResult.outcome !== 'selected') {
    reasons.push(
      REPAIR_REASON_BY_OUTCOME[readResult.outcome] ||
      'REPAIR_EVIDENCE_MALFORMED'
    );

    return { ready: false, evidenceId: null, reasons };
  }

  const record = readResult.record;

  if (!record || typeof record !== 'object') {
    reasons.push('REPAIR_EVIDENCE_MALFORMED');
    return { ready: false, evidenceId: null, reasons };
  }

  if (record.dealId !== context.dealId) {
    reasons.push('REPAIR_IDENTITY_MISMATCH');
  }

  if (record.canonicalPropertyKey !== context.canonicalPropertyKey) {
    reasons.push('REPAIR_IDENTITY_MISMATCH');
  }

  if (!REPAIR_ADEQUATE_STATUSES.includes(record.scopeStatus)) {
    reasons.push('REPAIR_SCOPE_NOT_ADEQUATE');
  }

  if (record.scopeComplete !== true) {
    reasons.push('REPAIR_SCOPE_INCOMPLETE');
  }

  if (
    !finiteNumber(record.estimatedRepairCost) ||
    record.estimatedRepairCost < 0
  ) {
    reasons.push('REPAIR_COST_INVALID');
  }

  if (record.reviewRequired !== false) {
    reasons.push('REPAIR_REVIEW_REQUIRED');
  }

  return {
    ready: reasons.length === 0,
    evidenceId:
      typeof record.repairScopeEvidenceId === 'string'
        ? record.repairScopeEvidenceId
        : null,
    reasons: uniqueReasons(reasons)
  };
}

function evaluateOfflineCompsReadiness(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('input is required');
  }

  const context = {
    dealId: input.dealId,
    canonicalPropertyKey: input.canonicalPropertyKey,
    asOf: input.asOf
  };

  if (
    typeof context.dealId !== 'string' ||
    context.dealId.length === 0
  ) {
    throw new TypeError('dealId is required');
  }

  if (
    typeof context.canonicalPropertyKey !== 'string' ||
    context.canonicalPropertyKey.length === 0
  ) {
    throw new TypeError('canonicalPropertyKey is required');
  }

  if (typeof context.asOf !== 'string' || context.asOf.length === 0) {
    throw new TypeError('explicit asOf is required');
  }

  const arv = evaluateArv(input.arvReadResult, context);
  const repair = evaluateRepair(input.repairReadResult, context);

  const reasons = [...arv.reasons, ...repair.reasons];

  const arvRecord =
    input.arvReadResult &&
    input.arvReadResult.outcome === 'selected'
      ? input.arvReadResult.record
      : null;

  const repairRecord =
    input.repairReadResult &&
    input.repairReadResult.outcome === 'selected'
      ? input.repairReadResult.record
      : null;

  if (arvRecord && repairRecord) {
    if (arvRecord.dealId !== repairRecord.dealId) {
      reasons.push('CROSS_SURFACE_DEAL_ID_MISMATCH');
    }

    if (
      arvRecord.canonicalPropertyKey !==
      repairRecord.canonicalPropertyKey
    ) {
      reasons.push('CROSS_SURFACE_PROPERTY_IDENTITY_MISMATCH');
    }
  }

  const crossSurfaceFailure =
    reasons.includes('CROSS_SURFACE_DEAL_ID_MISMATCH') ||
    reasons.includes('CROSS_SURFACE_PROPERTY_IDENTITY_MISMATCH');

  const compSupportedArvReady =
    arv.ready && !crossSurfaceFailure;

  const repairScopeReady =
    repair.ready && !crossSurfaceFailure;

  const decision =
    compSupportedArvReady === true &&
    repairScopeReady === true
      ? 'eligible'
      : 'blocked';

  return Object.freeze({
    dealId: context.dealId,
    canonicalPropertyKey: context.canonicalPropertyKey,
    asOf: context.asOf,
    arvEvidenceId: arv.evidenceId,
    repairScopeEvidenceId: repair.evidenceId,
    decision,
    compSupportedArvReady,
    repairScopeReady,
    reasonCodes: uniqueReasons(reasons),
    evaluatedAt: context.asOf,
    gateVersion: GATE_VERSION,

    productionPersistenceAuthorityGranted: false,
    productionComparableAcceptanceAuthorityGranted: false,
    productionArvAuthorityGranted: false,
    repairScopeAuthorityGranted: false,
    qualifiedDealQueueAuthorityGranted: false,
    acquisitionLifecycleAuthorityGranted: false,
    maoAuthorityGranted: false,
    offerGenerationAuthorityGranted: false,
    offerSubmissionAuthorityGranted: false,
    automaticOfferAuthorityGranted: false
  });
}

module.exports = {
  READ_OUTCOMES,
  GATE_VERSION,
  evaluateOfflineCompsReadiness
};
