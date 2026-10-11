'use strict';

const {
  evaluateOfflineCompsReadiness
} = require('./offline-comps-readiness-evidence-gate-mapper-v1');

const ADAPTER_VERSION =
  'offline-comps-readiness-evidence-gate-integration-adapter-v1';

const AUTHORITY_FLAGS = Object.freeze({
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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function uniqueStrings(values) {
  const out = [];
  const seen = new Set();

  for (const value of values) {
    if (!isNonEmptyString(value)) continue;

    const normalized = value.trim();

    if (!seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }

  return out;
}

function blockedProjection(input, reasonCodes, mapperResult) {
  const mapper =
    mapperResult && typeof mapperResult === 'object'
      ? mapperResult
      : null;

  return Object.freeze({
    adapterVersion: ADAPTER_VERSION,

    dealId:
      input && isNonEmptyString(input.dealId)
        ? input.dealId
        : null,

    canonicalPropertyKey:
      input && isNonEmptyString(input.canonicalPropertyKey)
        ? input.canonicalPropertyKey
        : null,

    asOf:
      input && isNonEmptyString(input.asOf)
        ? input.asOf
        : null,

    decision: 'blocked',

    compSupportedArvReady: false,
    repairScopeReady: false,

    arvEvidenceId:
      mapper && isNonEmptyString(mapper.arvEvidenceId)
        ? mapper.arvEvidenceId
        : null,

    repairScopeEvidenceId:
      mapper && isNonEmptyString(mapper.repairScopeEvidenceId)
        ? mapper.repairScopeEvidenceId
        : null,

    reasonCodes: Object.freeze(uniqueStrings(reasonCodes)),

    evaluatedAt:
      input && isNonEmptyString(input.asOf)
        ? input.asOf
        : null,

    gateVersion:
      mapper && isNonEmptyString(mapper.gateVersion)
        ? mapper.gateVersion
        : null,

    ...AUTHORITY_FLAGS
  });
}

function integrateOfflineCompsReadinessEvidence(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return blockedProjection(
      null,
      ['INTEGRATION_INPUT_MALFORMED'],
      null
    );
  }

  const {
    dealId,
    canonicalPropertyKey,
    asOf,
    arvReadResult,
    repairReadResult
  } = input;

  const inputReasons = [];

  if (!isNonEmptyString(dealId)) {
    inputReasons.push('INTEGRATION_DEAL_ID_MISSING');
  }

  if (!isNonEmptyString(canonicalPropertyKey)) {
    inputReasons.push('INTEGRATION_PROPERTY_IDENTITY_MISSING');
  }

  if (!isNonEmptyString(asOf)) {
    inputReasons.push('INTEGRATION_ASOF_MISSING');
  }

  if (inputReasons.length > 0) {
    return blockedProjection(input, inputReasons, null);
  }

  let mapperResult;

  try {
    mapperResult = evaluateOfflineCompsReadiness({
      dealId,
      canonicalPropertyKey,
      asOf,
      arvReadResult,
      repairReadResult
    });
  } catch (error) {
    return blockedProjection(
      input,
      ['INTEGRATION_MAPPER_EXCEPTION'],
      null
    );
  }

  if (
    !mapperResult ||
    typeof mapperResult !== 'object' ||
    Array.isArray(mapperResult)
  ) {
    return blockedProjection(
      input,
      ['INTEGRATION_MAPPER_OUTPUT_MALFORMED'],
      null
    );
  }

  const reasons = Array.isArray(mapperResult.reasonCodes)
    ? mapperResult.reasonCodes.slice()
    : [];

  if (mapperResult.dealId !== dealId) {
    reasons.push('INTEGRATION_MAPPER_DEAL_ID_MISMATCH');
  }

  if (mapperResult.canonicalPropertyKey !== canonicalPropertyKey) {
    reasons.push('INTEGRATION_MAPPER_PROPERTY_IDENTITY_MISMATCH');
  }

  if (mapperResult.asOf !== asOf) {
    reasons.push('INTEGRATION_MAPPER_ASOF_MISMATCH');
  }

  if (mapperResult.evaluatedAt !== asOf) {
    reasons.push('INTEGRATION_MAPPER_EVALUATED_AT_MISMATCH');
  }

  if (!isNonEmptyString(mapperResult.gateVersion)) {
    reasons.push('INTEGRATION_GATE_VERSION_MISSING');
  }

  if (
    mapperResult.compSupportedArvReady !== true &&
    mapperResult.compSupportedArvReady !== false
  ) {
    reasons.push('INTEGRATION_ARV_READINESS_NOT_BOOLEAN');
  }

  if (
    mapperResult.repairScopeReady !== true &&
    mapperResult.repairScopeReady !== false
  ) {
    reasons.push('INTEGRATION_REPAIR_READINESS_NOT_BOOLEAN');
  }

  if (
    mapperResult.decision !== 'eligible' &&
    mapperResult.decision !== 'blocked'
  ) {
    reasons.push('INTEGRATION_DECISION_UNRECOGNIZED');
  }

  /*
   * Defense-in-depth:
   *
   * Evidence-layer eligibility must remain bound to the exact ARV and
   * repair-scope evidence records evaluated. A positive readiness result
   * without either evidence ID is malformed and therefore blocked.
   */
  if (
    mapperResult.compSupportedArvReady === true &&
    !isNonEmptyString(mapperResult.arvEvidenceId)
  ) {
    reasons.push('ARV_EVIDENCE_MALFORMED');
  }

  if (
    mapperResult.repairScopeReady === true &&
    !isNonEmptyString(mapperResult.repairScopeEvidenceId)
  ) {
    reasons.push('REPAIR_EVIDENCE_MALFORMED');
  }

  const structurallyValid =
    mapperResult.dealId === dealId &&
    mapperResult.canonicalPropertyKey === canonicalPropertyKey &&
    mapperResult.asOf === asOf &&
    mapperResult.evaluatedAt === asOf &&
    isNonEmptyString(mapperResult.gateVersion) &&
    (
      mapperResult.compSupportedArvReady === true ||
      mapperResult.compSupportedArvReady === false
    ) &&
    (
      mapperResult.repairScopeReady === true ||
      mapperResult.repairScopeReady === false
    ) &&
    (
      mapperResult.decision === 'eligible' ||
      mapperResult.decision === 'blocked'
    );

  const evidenceReferencesBound =
    (
      mapperResult.compSupportedArvReady !== true ||
      isNonEmptyString(mapperResult.arvEvidenceId)
    ) &&
    (
      mapperResult.repairScopeReady !== true ||
      isNonEmptyString(mapperResult.repairScopeEvidenceId)
    );

  const bothReady =
    mapperResult.compSupportedArvReady === true &&
    mapperResult.repairScopeReady === true;

  const mapperEligible =
    mapperResult.decision === 'eligible';

  const eligible =
    structurallyValid &&
    evidenceReferencesBound &&
    bothReady &&
    mapperEligible &&
    reasons.length === 0;

  if (eligible) {
    return Object.freeze({
      adapterVersion: ADAPTER_VERSION,
      dealId,
      canonicalPropertyKey,
      asOf,
      decision: 'eligible',
      compSupportedArvReady: true,
      repairScopeReady: true,
      arvEvidenceId: mapperResult.arvEvidenceId,
      repairScopeEvidenceId: mapperResult.repairScopeEvidenceId,
      reasonCodes: Object.freeze([]),
      evaluatedAt: asOf,
      gateVersion: mapperResult.gateVersion,
      ...AUTHORITY_FLAGS
    });
  }

  /*
   * A blocked mapper result may legitimately contain one readiness=true
   * and the other=false. Preserve the certified mapper booleans only when
   * its structural contract is intact. Structural or evidence-binding
   * failure forces both readiness flags false.
   */
  const preserveMapperReadiness =
    structurallyValid &&
    evidenceReferencesBound;

  return Object.freeze({
    adapterVersion: ADAPTER_VERSION,
    dealId,
    canonicalPropertyKey,
    asOf,
    decision: 'blocked',

    compSupportedArvReady:
      preserveMapperReadiness
        ? mapperResult.compSupportedArvReady === true
        : false,

    repairScopeReady:
      preserveMapperReadiness
        ? mapperResult.repairScopeReady === true
        : false,

    arvEvidenceId:
      isNonEmptyString(mapperResult.arvEvidenceId)
        ? mapperResult.arvEvidenceId
        : null,

    repairScopeEvidenceId:
      isNonEmptyString(mapperResult.repairScopeEvidenceId)
        ? mapperResult.repairScopeEvidenceId
        : null,

    reasonCodes: Object.freeze(
      uniqueStrings(
        reasons.length > 0
          ? reasons
          : ['INTEGRATION_READINESS_BLOCKED']
      )
    ),

    evaluatedAt: asOf,

    gateVersion:
      isNonEmptyString(mapperResult.gateVersion)
        ? mapperResult.gateVersion
        : null,

    ...AUTHORITY_FLAGS
  });
}

module.exports = Object.freeze({
  ADAPTER_VERSION,
  AUTHORITY_FLAGS,
  integrateOfflineCompsReadinessEvidence
});
