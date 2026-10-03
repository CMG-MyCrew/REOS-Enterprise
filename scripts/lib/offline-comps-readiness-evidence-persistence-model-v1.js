'use strict';

const SUPPORTED_SCHEMA_VERSION = '1';

const ARV_FIELDS = Object.freeze([
  'ARV Evidence ID',
  'Schema Version',
  'Deal ID',
  'Canonical Property Key',
  'Evidence Status',
  'Confidence Status',
  'Estimated ARV',
  'Accepted Comparable Evidence IDs JSON',
  'Accepted Comparable Count',
  'Minimum Comparable Count',
  'Valuation Method',
  'Valuation Inputs JSON',
  'Supported Low Value',
  'Supported High Value',
  'Review Required',
  'Reason Codes JSON',
  'Evidence Generated At',
  'Persisted At',
  'Source Engine',
  'Source Engine Version',
  'Provenance JSON',
  'Idempotency Key',
  'Supersedes Evidence ID'
]);

const REPAIR_FIELDS = Object.freeze([
  'Repair Scope Evidence ID',
  'Schema Version',
  'Deal ID',
  'Canonical Property Key',
  'Scope Status',
  'Scope Complete',
  'Estimated Repair Cost',
  'Review Required',
  'Reason Codes JSON',
  'Scope Inputs JSON',
  'Evidence Generated At',
  'Persisted At',
  'Source Engine',
  'Source Engine Version',
  'Provenance JSON',
  'Idempotency Key',
  'Supersedes Evidence ID'
]);

const READINESS_FIELDS = Object.freeze([
  'Readiness Evidence ID',
  'Schema Version',
  'Deal ID',
  'Canonical Property Key',
  'ARV Evidence ID',
  'Repair Scope Evidence ID',
  'Decision',
  'Comp Supported ARV Ready',
  'Repair Scope Ready',
  'Reason Codes JSON',
  'Evaluated At',
  'Persisted At',
  'Gate Version',
  'Idempotency Key',
  'Supersedes Evidence ID'
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);

  Object.keys(value).forEach(function (key) {
    deepFreeze(value[key]);
  });

  return value;
}

function immutableCopy(value) {
  return deepFreeze(clone(value));
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validTimestamp(value) {
  if (!nonEmptyString(value)) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

function timestamp(value) {
  return validTimestamp(value) ? Date.parse(value) : null;
}

function validJson(value) {
  if (!nonEmptyString(value)) {
    return false;
  }

  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return false;
  }
}

function exactFields(record, expected) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return false;
  }

  const actual = Object.keys(record);

  return (
    actual.length === expected.length &&
    expected.every(function (field, index) {
      return actual[index] === field;
    })
  );
}

function material(record) {
  return JSON.stringify(record);
}

function validateCommon(
  record,
  fields,
  idField,
  idPrefix,
  evidenceTimeField
) {
  if (!exactFields(record, fields)) {
    return {
      ok: false,
      status: 'rejected_validation',
      reason: 'schema_fields_mismatch'
    };
  }

  if (record['Schema Version'] !== SUPPORTED_SCHEMA_VERSION) {
    return {
      ok: false,
      status: 'unsupported_version',
      reason: 'unsupported_schema_version'
    };
  }

  if (
    !nonEmptyString(record[idField]) ||
    !record[idField].startsWith(idPrefix)
  ) {
    return {
      ok: false,
      status: 'rejected_validation',
      reason: 'invalid_evidence_id'
    };
  }

  if (!nonEmptyString(record['Deal ID'])) {
    return {
      ok: false,
      status: 'rejected_identity',
      reason: 'deal_id_missing'
    };
  }

  if (!nonEmptyString(record['Canonical Property Key'])) {
    return {
      ok: false,
      status: 'rejected_identity',
      reason: 'canonical_property_key_missing'
    };
  }

  if (!nonEmptyString(record['Idempotency Key'])) {
    return {
      ok: false,
      status: 'rejected_validation',
      reason: 'idempotency_key_missing'
    };
  }

  if (!validTimestamp(record[evidenceTimeField])) {
    return {
      ok: false,
      status: 'rejected_validation',
      reason: 'invalid_evidence_timestamp'
    };
  }

  if (!validTimestamp(record['Persisted At'])) {
    return {
      ok: false,
      status: 'rejected_validation',
      reason: 'invalid_persisted_at'
    };
  }

  if (
    record['Supersedes Evidence ID'] !== '' &&
    !nonEmptyString(record['Supersedes Evidence ID'])
  ) {
    return {
      ok: false,
      status: 'rejected_validation',
      reason: 'invalid_supersedes_evidence_id'
    };
  }

  return { ok: true };
}

function validateArv(record) {
  const result = validateCommon(
    record,
    ARV_FIELDS,
    'ARV Evidence ID',
    'ARVE-',
    'Evidence Generated At'
  );

  if (!result.ok) {
    return result;
  }

  if (!nonEmptyString(record['Evidence Status'])) {
    return { ok: false, status: 'rejected_validation', reason: 'evidence_status_missing' };
  }

  if (!nonEmptyString(record['Confidence Status'])) {
    return { ok: false, status: 'rejected_validation', reason: 'confidence_status_missing' };
  }

  if (
    !Number.isFinite(record['Estimated ARV']) ||
    record['Estimated ARV'] <= 0
  ) {
    return { ok: false, status: 'rejected_validation', reason: 'invalid_estimated_arv' };
  }

  if (
    !Number.isInteger(record['Accepted Comparable Count']) ||
    record['Accepted Comparable Count'] < 0
  ) {
    return { ok: false, status: 'rejected_validation', reason: 'invalid_accepted_comparable_count' };
  }

  if (
    !Number.isInteger(record['Minimum Comparable Count']) ||
    record['Minimum Comparable Count'] < 1
  ) {
    return { ok: false, status: 'rejected_validation', reason: 'invalid_minimum_comparable_count' };
  }

  if (!validJson(record['Accepted Comparable Evidence IDs JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'invalid_comparable_ids_json' };
  }

  if (!validJson(record['Valuation Inputs JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'invalid_valuation_inputs_json' };
  }

  if (!validJson(record['Reason Codes JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'invalid_reason_codes_json' };
  }

  if (!validJson(record['Provenance JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'invalid_provenance_json' };
  }

  return { ok: true };
}

function validateRepair(record) {
  const result = validateCommon(
    record,
    REPAIR_FIELDS,
    'Repair Scope Evidence ID',
    'RSE-',
    'Evidence Generated At'
  );

  if (!result.ok) {
    return result;
  }

  if (!nonEmptyString(record['Scope Status'])) {
    return { ok: false, status: 'rejected_validation', reason: 'scope_status_missing' };
  }

  if (typeof record['Scope Complete'] !== 'boolean') {
    return { ok: false, status: 'rejected_validation', reason: 'scope_complete_invalid' };
  }

  if (
    !Number.isFinite(record['Estimated Repair Cost']) ||
    record['Estimated Repair Cost'] < 0
  ) {
    return { ok: false, status: 'rejected_validation', reason: 'repair_cost_invalid' };
  }

  if (typeof record['Review Required'] !== 'boolean') {
    return { ok: false, status: 'rejected_validation', reason: 'review_required_invalid' };
  }

  if (!validJson(record['Reason Codes JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'reason_codes_invalid' };
  }

  if (!validJson(record['Scope Inputs JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'scope_inputs_invalid' };
  }

  if (!validJson(record['Provenance JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'provenance_invalid' };
  }

  return { ok: true };
}

function validateReadiness(record) {
  const result = validateCommon(
    record,
    READINESS_FIELDS,
    'Readiness Evidence ID',
    'ORE-',
    'Evaluated At'
  );

  if (!result.ok) {
    return result;
  }

  if (!nonEmptyString(record['ARV Evidence ID'])) {
    return { ok: false, status: 'rejected_validation', reason: 'arv_evidence_id_missing' };
  }

  if (!nonEmptyString(record['Repair Scope Evidence ID'])) {
    return { ok: false, status: 'rejected_validation', reason: 'repair_scope_evidence_id_missing' };
  }

  if (!nonEmptyString(record['Decision'])) {
    return { ok: false, status: 'rejected_validation', reason: 'decision_missing' };
  }

  if (typeof record['Comp Supported ARV Ready'] !== 'boolean') {
    return { ok: false, status: 'rejected_validation', reason: 'arv_ready_invalid' };
  }

  if (typeof record['Repair Scope Ready'] !== 'boolean') {
    return { ok: false, status: 'rejected_validation', reason: 'repair_ready_invalid' };
  }

  if (!validJson(record['Reason Codes JSON'])) {
    return { ok: false, status: 'rejected_validation', reason: 'reason_codes_invalid' };
  }

  if (!nonEmptyString(record['Gate Version'])) {
    return { ok: false, status: 'rejected_validation', reason: 'gate_version_missing' };
  }

  return { ok: true };
}

function createSurface(config) {
  const history = [];

  function append(record) {
    const validation = config.validate(record);

    if (!validation.ok) {
      return deepFreeze({
        status: validation.status,
        reason: validation.reason,
        record: null
      });
    }

    const sameId = history.find(function (candidate) {
      return candidate[config.idField] === record[config.idField];
    });

    if (sameId) {
      if (material(sameId) === material(record)) {
        return deepFreeze({
          status: 'idempotent_existing',
          reason: 'evidence_id_existing_identical',
          record: immutableCopy(sameId)
        });
      }

      return deepFreeze({
        status: 'rejected_idempotency_conflict',
        reason: 'evidence_id_conflict',
        record: null
      });
    }

    const sameIdempotencyKey = history.find(function (candidate) {
      return candidate['Idempotency Key'] === record['Idempotency Key'];
    });

    if (sameIdempotencyKey) {
      if (material(sameIdempotencyKey) === material(record)) {
        return deepFreeze({
          status: 'idempotent_existing',
          reason: 'idempotency_key_existing_identical',
          record: immutableCopy(sameIdempotencyKey)
        });
      }

      return deepFreeze({
        status: 'rejected_idempotency_conflict',
        reason: 'idempotency_key_payload_conflict',
        record: null
      });
    }

    if (record['Supersedes Evidence ID'] !== '') {
      const predecessor = history.find(function (candidate) {
        return candidate[config.idField] === record['Supersedes Evidence ID'];
      });

      if (!predecessor) {
        return deepFreeze({
          status: 'rejected_validation',
          reason: 'superseded_evidence_not_found',
          record: null
        });
      }

      if (
        predecessor['Deal ID'] !== record['Deal ID'] ||
        predecessor['Canonical Property Key'] !== record['Canonical Property Key']
      ) {
        return deepFreeze({
          status: 'rejected_identity',
          reason: 'superseded_evidence_identity_mismatch',
          record: null
        });
      }

      if (
        timestamp(record['Persisted At']) <
        timestamp(predecessor['Persisted At'])
      ) {
        return deepFreeze({
          status: 'rejected_validation',
          reason: 'supersession_precedes_predecessor'
        });
      }
    }

    const stored = immutableCopy(record);
    history.push(stored);

    return deepFreeze({
      status: 'appended',
      reason: null,
      record: immutableCopy(stored)
    });
  }

  function getById(evidenceId) {
    const record = history.find(function (candidate) {
      return candidate[config.idField] === evidenceId;
    });

    if (!record) {
      return deepFreeze({
        status: 'not_found',
        record: null
      });
    }

    return deepFreeze({
      status: 'selected',
      record: immutableCopy(record)
    });
  }

  function getCurrent(dealId, canonicalPropertyKey, asOf) {
    if (!nonEmptyString(dealId) || !nonEmptyString(canonicalPropertyKey)) {
      return deepFreeze({
        status: 'identity_mismatch',
        record: null
      });
    }

    const asOfMs = timestamp(asOf);

    if (asOfMs === null) {
      return deepFreeze({
        status: 'malformed',
        record: null
      });
    }

    const dealCandidates = history.filter(function (record) {
      return record['Deal ID'] === dealId;
    });

    if (dealCandidates.length === 0) {
      return deepFreeze({
        status: 'not_found',
        record: null
      });
    }

    const identityCandidates = dealCandidates.filter(function (record) {
      return record['Canonical Property Key'] === canonicalPropertyKey;
    });

    if (identityCandidates.length === 0) {
      return deepFreeze({
        status: 'identity_mismatch',
        record: null
      });
    }

    const unsupported = identityCandidates.some(function (record) {
      return record['Schema Version'] !== SUPPORTED_SCHEMA_VERSION;
    });

    if (unsupported) {
      return deepFreeze({
        status: 'unsupported_version',
        record: null
      });
    }

    const visible = identityCandidates.filter(function (record) {
      const evidenceMs = timestamp(record[config.evidenceTimeField]);
      const persistedMs = timestamp(record['Persisted At']);

      return (
        evidenceMs !== null &&
        persistedMs !== null &&
        evidenceMs <= asOfMs &&
        persistedMs <= asOfMs
      );
    });

    if (visible.length === 0) {
      return deepFreeze({
        status: 'not_found',
        record: null
      });
    }

    const superseded = new Set(
      visible
        .map(function (record) {
          return record['Supersedes Evidence ID'];
        })
        .filter(nonEmptyString)
    );

    const current = visible.filter(function (record) {
      return !superseded.has(record[config.idField]);
    });

    if (current.length === 0) {
      return deepFreeze({
        status: 'not_found',
        record: null
      });
    }

    if (current.length !== 1) {
      return deepFreeze({
        status: 'contradictory',
        record: null,
        candidateEvidenceIds: deepFreeze(
          current
            .map(function (record) {
              return record[config.idField];
            })
            .sort()
        )
      });
    }

    return deepFreeze({
      status: 'selected',
      record: immutableCopy(current[0])
    });
  }

  function snapshot() {
    return immutableCopy(history);
  }

  return Object.freeze({
    append,
    getById,
    getCurrent,
    snapshot
  });
}

function createOfflinePersistenceModel() {
  const arv = createSurface({
    idField: 'ARV Evidence ID',
    evidenceTimeField: 'Evidence Generated At',
    validate: validateArv
  });

  const repair = createSurface({
    idField: 'Repair Scope Evidence ID',
    evidenceTimeField: 'Evidence Generated At',
    validate: validateRepair
  });

  const readiness = createSurface({
    idField: 'Readiness Evidence ID',
    evidenceTimeField: 'Evaluated At',
    validate: validateReadiness
  });

  return Object.freeze({
    appendDealArvEvidence: arv.append,
    appendDealRepairScopeEvidence: repair.append,
    appendDealOfferReadinessEvidence: readiness.append,

    getDealArvEvidenceById: arv.getById,
    getDealRepairScopeEvidenceById: repair.getById,
    getDealOfferReadinessEvidenceById: readiness.getById,

    getCurrentDealArvEvidence: arv.getCurrent,
    getCurrentDealRepairScopeEvidence: repair.getCurrent,
    getCurrentDealOfferReadinessEvidence: readiness.getCurrent,

    snapshot: function () {
      return deepFreeze({
        arv: arv.snapshot(),
        repair: repair.snapshot(),
        readiness: readiness.snapshot()
      });
    }
  });
}

module.exports = Object.freeze({
  SUPPORTED_SCHEMA_VERSION,
  ARV_FIELDS,
  REPAIR_FIELDS,
  READINESS_FIELDS,
  createOfflinePersistenceModel
});
