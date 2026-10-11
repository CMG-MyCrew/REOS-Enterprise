/**
 * REOS Enterprise
 * Production Comps Readiness Evidence Persistence Module v1
 *
 * This module defines the production evidence persistence API surface while
 * keeping the implementation independently testable without live Google
 * Sheets access.
 *
 * IMPORTANT:
 * - No acquisition workflow wiring is performed here.
 * - No provider request is performed here.
 * - No ARV calculation is performed here.
 * - No repair-scope calculation or mutation is performed here.
 * - No MAO or offer authority is granted here.
 * - The storage adapter must be supplied explicitly.
 */

var REOS_COMPS_READINESS_EVIDENCE_PERSISTENCE_V1 = (function () {
  'use strict';

  var SCHEMA_VERSION = 'v1';

  var TABLES = Object.freeze({
    arv: 'DEAL_ARV_EVIDENCE',
    repair: 'DEAL_REPAIR_SCOPE_EVIDENCE',
    readiness: 'DEAL_OFFER_READINESS_EVIDENCE'
  });

  var ID_PREFIXES = Object.freeze({
    arv: 'ARVE-',
    repair: 'RSE-',
    readiness: 'ORE-'
  });

  var APPEND_OUTCOMES = Object.freeze({
    APPENDED: 'appended',
    IDEMPOTENT_EXISTING: 'idempotent_existing',
    REJECTED_VALIDATION: 'rejected_validation',
    REJECTED_IDENTITY: 'rejected_identity',
    REJECTED_IDEMPOTENCY_CONFLICT: 'rejected_idempotency_conflict',
    FAILED_PERSISTENCE: 'failed_persistence'
  });

  var READ_OUTCOMES = Object.freeze({
    SELECTED: 'selected',
    NOT_FOUND: 'not_found',
    STALE: 'stale',
    IDENTITY_MISMATCH: 'identity_mismatch',
    CONTRADICTORY: 'contradictory',
    UNSUPPORTED_VERSION: 'unsupported_version',
    MALFORMED: 'malformed'
  });

  var ARV_FIELDS = Object.freeze([
    'arvEvidenceId',
    'schemaVersion',
    'dealId',
    'canonicalPropertyKey',
    'evidenceStatus',
    'confidenceStatus',
    'estimatedArv',
    'acceptedComparableEvidenceIds',
    'acceptedComparableCount',
    'minimumComparableCount',
    'valuationMethod',
    'valuationInputs',
    'supportedLowValue',
    'supportedHighValue',
    'reviewRequired',
    'reasonCodes',
    'evidenceGeneratedAt',
    'persistedAt',
    'sourceEngine',
    'sourceEngineVersion',
    'provenance',
    'idempotencyKey',
    'supersedesEvidenceId'
  ]);

  var REPAIR_FIELDS = Object.freeze([
    'repairScopeEvidenceId',
    'schemaVersion',
    'dealId',
    'canonicalPropertyKey',
    'scopeStatus',
    'scopeComplete',
    'estimatedRepairCost',
    'reviewRequired',
    'reasonCodes',
    'scopeInputs',
    'evidenceGeneratedAt',
    'persistedAt',
    'sourceEngine',
    'sourceEngineVersion',
    'provenance',
    'idempotencyKey',
    'supersedesEvidenceId'
  ]);

  var READINESS_FIELDS = Object.freeze([
    'readinessEvidenceId',
    'schemaVersion',
    'dealId',
    'canonicalPropertyKey',
    'arvEvidenceId',
    'repairScopeEvidenceId',
    'decision',
    'compSupportedArvReady',
    'repairScopeReady',
    'reasonCodes',
    'evaluatedAt',
    'persistedAt',
    'gateVersion',
    'idempotencyKey',
    'supersedesEvidenceId'
  ]);

  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
    }
    return value;
  }

  function nonBlank(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function exactIdentity(record, dealId, canonicalPropertyKey) {
    return !!record &&
      record.dealId === dealId &&
      record.canonicalPropertyKey === canonicalPropertyKey;
  }

  function validIso(value) {
    if (!nonBlank(value)) return false;
    var time = Date.parse(value);
    return Number.isFinite(time);
  }

  function supportedVersion(record) {
    return !!record && record.schemaVersion === SCHEMA_VERSION;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function stableJson(value) {
    if (value === null || typeof value !== 'object') {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return '[' + value.map(stableJson).join(',') + ']';
    }

    var keys = Object.keys(value).sort();
    return '{' + keys.map(function (key) {
      return JSON.stringify(key) + ':' + stableJson(value[key]);
    }).join(',') + '}';
  }

  function appendResult(outcome, record, existingRecord, reasonCodes) {
    return freeze({
      outcome: outcome,
      record: record ? freeze(clone(record)) : null,
      existingRecord: existingRecord ? freeze(clone(existingRecord)) : null,
      reasonCodes: freeze((reasonCodes || []).slice())
    });
  }

  function readResult(outcome, record, reasonCodes) {
    return freeze({
      outcome: outcome,
      record: record ? freeze(clone(record)) : null,
      reasonCodes: freeze((reasonCodes || []).slice())
    });
  }

  function requireStorage(storage) {
    return !!storage &&
      typeof storage.readAll === 'function' &&
      typeof storage.append === 'function';
  }

  function validateCommon(record, idField, prefix) {
    var reasons = [];

    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return ['RECORD_REQUIRED'];
    }

    if (!nonBlank(record[idField]) ||
        record[idField].indexOf(prefix) !== 0) {
      reasons.push('EVIDENCE_ID_INVALID');
    }

    if (record.schemaVersion !== SCHEMA_VERSION) {
      reasons.push('SCHEMA_VERSION_UNSUPPORTED');
    }

    if (!nonBlank(record.dealId)) {
      reasons.push('DEAL_ID_REQUIRED');
    }

    if (!nonBlank(record.canonicalPropertyKey)) {
      reasons.push('CANONICAL_PROPERTY_KEY_REQUIRED');
    }

    if (!nonBlank(record.idempotencyKey)) {
      reasons.push('IDEMPOTENCY_KEY_REQUIRED');
    }

    if (!validIso(record.persistedAt)) {
      reasons.push('PERSISTED_AT_INVALID');
    }

    if (record.supersedesEvidenceId != null &&
        record.supersedesEvidenceId !== '' &&
        !nonBlank(record.supersedesEvidenceId)) {
      reasons.push('SUPERSEDES_EVIDENCE_ID_INVALID');
    }

    return reasons;
  }

  function validateArv(record) {
    var reasons = validateCommon(record, 'arvEvidenceId', ID_PREFIXES.arv);

    if (!nonBlank(record.evidenceStatus)) reasons.push('EVIDENCE_STATUS_REQUIRED');
    if (!nonBlank(record.confidenceStatus)) reasons.push('CONFIDENCE_STATUS_REQUIRED');

    if (typeof record.reviewRequired !== 'boolean') {
      reasons.push('REVIEW_REQUIRED_INVALID');
    }

    if (!validIso(record.evidenceGeneratedAt)) {
      reasons.push('EVIDENCE_GENERATED_AT_INVALID');
    }

    if (!Array.isArray(record.acceptedComparableEvidenceIds)) {
      reasons.push('ACCEPTED_COMPARABLE_EVIDENCE_IDS_INVALID');
    }

    if (!Number.isInteger(record.acceptedComparableCount) ||
        record.acceptedComparableCount < 0) {
      reasons.push('ACCEPTED_COMPARABLE_COUNT_INVALID');
    }

    if (!Number.isInteger(record.minimumComparableCount) ||
        record.minimumComparableCount < 0) {
      reasons.push('MINIMUM_COMPARABLE_COUNT_INVALID');
    }

    return reasons;
  }

  function validateRepair(record) {
    var reasons = validateCommon(
      record,
      'repairScopeEvidenceId',
      ID_PREFIXES.repair
    );

    if (!nonBlank(record.scopeStatus)) reasons.push('SCOPE_STATUS_REQUIRED');

    if (typeof record.scopeComplete !== 'boolean') {
      reasons.push('SCOPE_COMPLETE_INVALID');
    }

    if (typeof record.reviewRequired !== 'boolean') {
      reasons.push('REVIEW_REQUIRED_INVALID');
    }

    if (!validIso(record.evidenceGeneratedAt)) {
      reasons.push('EVIDENCE_GENERATED_AT_INVALID');
    }

    return reasons;
  }

  function validateReadiness(record) {
    var reasons = validateCommon(
      record,
      'readinessEvidenceId',
      ID_PREFIXES.readiness
    );

    if (!nonBlank(record.arvEvidenceId) ||
        record.arvEvidenceId.indexOf(ID_PREFIXES.arv) !== 0) {
      reasons.push('ARV_EVIDENCE_ID_INVALID');
    }

    if (!nonBlank(record.repairScopeEvidenceId) ||
        record.repairScopeEvidenceId.indexOf(ID_PREFIXES.repair) !== 0) {
      reasons.push('REPAIR_SCOPE_EVIDENCE_ID_INVALID');
    }

    if (record.decision !== 'eligible' &&
        record.decision !== 'blocked') {
      reasons.push('DECISION_INVALID');
    }

    if (typeof record.compSupportedArvReady !== 'boolean') {
      reasons.push('COMP_SUPPORTED_ARV_READY_INVALID');
    }

    if (typeof record.repairScopeReady !== 'boolean') {
      reasons.push('REPAIR_SCOPE_READY_INVALID');
    }

    if (!validIso(record.evaluatedAt)) {
      reasons.push('EVALUATED_AT_INVALID');
    }

    if (!nonBlank(record.gateVersion)) {
      reasons.push('GATE_VERSION_REQUIRED');
    }

    return reasons;
  }

  function appendEvidence(config) {
    var record = clone(config.record);
    var validationReasons = config.validate(record);

    if (validationReasons.length) {
      return appendResult(
        APPEND_OUTCOMES.REJECTED_VALIDATION,
        null,
        null,
        validationReasons
      );
    }

    if (!requireStorage(config.storage)) {
      return appendResult(
        APPEND_OUTCOMES.FAILED_PERSISTENCE,
        null,
        null,
        ['STORAGE_ADAPTER_REQUIRED']
      );
    }

    var existing;

    try {
      existing = config.storage.readAll(config.table);
    } catch (error) {
      return appendResult(
        APPEND_OUTCOMES.FAILED_PERSISTENCE,
        null,
        null,
        ['STORAGE_READ_FAILED']
      );
    }

    if (!Array.isArray(existing)) {
      return appendResult(
        APPEND_OUTCOMES.FAILED_PERSISTENCE,
        null,
        null,
        ['STORAGE_READ_MALFORMED']
      );
    }

    var sameId = existing.filter(function (candidate) {
      return candidate &&
        candidate[config.idField] === record[config.idField];
    });

    if (sameId.length > 1) {
      return appendResult(
        APPEND_OUTCOMES.REJECTED_IDEMPOTENCY_CONFLICT,
        null,
        null,
        ['DUPLICATE_EVIDENCE_ID']
      );
    }

    if (sameId.length === 1) {
      if (stableJson(sameId[0]) === stableJson(record)) {
        return appendResult(
          APPEND_OUTCOMES.IDEMPOTENT_EXISTING,
          record,
          sameId[0],
          []
        );
      }

      return appendResult(
        APPEND_OUTCOMES.REJECTED_IDEMPOTENCY_CONFLICT,
        null,
        sameId[0],
        ['EVIDENCE_ID_CONFLICT']
      );
    }

    var sameIdempotency = existing.filter(function (candidate) {
      return candidate &&
        candidate.idempotencyKey === record.idempotencyKey;
    });

    if (sameIdempotency.length > 0) {
      var exact = sameIdempotency.filter(function (candidate) {
        return stableJson(candidate) === stableJson(record);
      });

      if (exact.length === 1 &&
          sameIdempotency.length === 1) {
        return appendResult(
          APPEND_OUTCOMES.IDEMPOTENT_EXISTING,
          record,
          exact[0],
          []
        );
      }

      return appendResult(
        APPEND_OUTCOMES.REJECTED_IDEMPOTENCY_CONFLICT,
        null,
        sameIdempotency[0] || null,
        ['IDEMPOTENCY_KEY_CONFLICT']
      );
    }

    if (record.supersedesEvidenceId) {
      var superseded = existing.filter(function (candidate) {
        return candidate &&
          candidate[config.idField] === record.supersedesEvidenceId;
      });

      if (superseded.length !== 1) {
        return appendResult(
          APPEND_OUTCOMES.REJECTED_VALIDATION,
          null,
          null,
          ['SUPERSEDED_EVIDENCE_NOT_FOUND']
        );
      }

      if (!exactIdentity(
        superseded[0],
        record.dealId,
        record.canonicalPropertyKey
      )) {
        return appendResult(
          APPEND_OUTCOMES.REJECTED_IDENTITY,
          null,
          superseded[0],
          ['SUPERSEDED_EVIDENCE_IDENTITY_MISMATCH']
        );
      }
    }

    try {
      config.storage.append(config.table, clone(record));
    } catch (error) {
      return appendResult(
        APPEND_OUTCOMES.FAILED_PERSISTENCE,
        null,
        null,
        ['STORAGE_APPEND_FAILED']
      );
    }

    return appendResult(
      APPEND_OUTCOMES.APPENDED,
      record,
      null,
      []
    );
  }

  function selectCurrent(config) {
    if (!nonBlank(config.dealId) ||
        !nonBlank(config.canonicalPropertyKey) ||
        !validIso(config.asOf)) {
      return readResult(
        READ_OUTCOMES.MALFORMED,
        null,
        ['READ_REQUEST_INVALID']
      );
    }

    if (!requireStorage(config.storage)) {
      return readResult(
        READ_OUTCOMES.MALFORMED,
        null,
        ['STORAGE_ADAPTER_REQUIRED']
      );
    }

    var records;

    try {
      records = config.storage.readAll(config.table);
    } catch (error) {
      return readResult(
        READ_OUTCOMES.MALFORMED,
        null,
        ['STORAGE_READ_FAILED']
      );
    }

    if (!Array.isArray(records)) {
      return readResult(
        READ_OUTCOMES.MALFORMED,
        null,
        ['STORAGE_READ_MALFORMED']
      );
    }

    var identityMatches = records.filter(function (record) {
      return exactIdentity(
        record,
        config.dealId,
        config.canonicalPropertyKey
      );
    });

    if (identityMatches.length === 0) {
      var sameDeal = records.some(function (record) {
        return record && record.dealId === config.dealId;
      });

      return readResult(
        sameDeal ?
          READ_OUTCOMES.IDENTITY_MISMATCH :
          READ_OUTCOMES.NOT_FOUND,
        null,
        []
      );
    }

    var supported = identityMatches.filter(supportedVersion);

    if (supported.length !== identityMatches.length) {
      return readResult(
        READ_OUTCOMES.UNSUPPORTED_VERSION,
        null,
        []
      );
    }

    var malformed = supported.some(function (record) {
      return config.validate(record).length > 0;
    });

    if (malformed) {
      return readResult(
        READ_OUTCOMES.MALFORMED,
        null,
        []
      );
    }

    var asOfMs = Date.parse(config.asOf);

    var eligible = supported.filter(function (record) {
      return Date.parse(config.timeField(record)) <= asOfMs;
    });

    if (eligible.length === 0) {
      return readResult(
        READ_OUTCOMES.NOT_FOUND,
        null,
        []
      );
    }

    var supersededIds = Object.create(null);

    eligible.forEach(function (record) {
      if (nonBlank(record.supersedesEvidenceId)) {
        supersededIds[record.supersedesEvidenceId] = true;
      }
    });

    var current = eligible.filter(function (record) {
      return !supersededIds[record[config.idField]];
    });

    if (current.length === 0) {
      return readResult(
        READ_OUTCOMES.MALFORMED,
        null,
        ['SUPERSESSION_CHAIN_HAS_NO_CURRENT_RECORD']
      );
    }

    if (current.length > 1) {
      return readResult(
        READ_OUTCOMES.CONTRADICTORY,
        null,
        []
      );
    }

    var selected = current[0];

    if (Date.parse(selected.persistedAt) > asOfMs) {
      return readResult(
        READ_OUTCOMES.NOT_FOUND,
        null,
        []
      );
    }

    return readResult(
      READ_OUTCOMES.SELECTED,
      selected,
      []
    );
  }

  function appendDealArvEvidence(record, storage) {
    return appendEvidence({
      table: TABLES.arv,
      idField: 'arvEvidenceId',
      record: record,
      storage: storage,
      validate: validateArv
    });
  }

  function appendDealRepairScopeEvidence(record, storage) {
    return appendEvidence({
      table: TABLES.repair,
      idField: 'repairScopeEvidenceId',
      record: record,
      storage: storage,
      validate: validateRepair
    });
  }

  function appendDealOfferReadinessEvidence(record, storage) {
    return appendEvidence({
      table: TABLES.readiness,
      idField: 'readinessEvidenceId',
      record: record,
      storage: storage,
      validate: validateReadiness
    });
  }

  function getCurrentDealArvEvidence(
    dealId,
    canonicalPropertyKey,
    asOf,
    storage
  ) {
    return selectCurrent({
      table: TABLES.arv,
      idField: 'arvEvidenceId',
      dealId: dealId,
      canonicalPropertyKey: canonicalPropertyKey,
      asOf: asOf,
      storage: storage,
      validate: validateArv,
      timeField: function (record) {
        return record.evidenceGeneratedAt;
      }
    });
  }

  function getCurrentDealRepairScopeEvidence(
    dealId,
    canonicalPropertyKey,
    asOf,
    storage
  ) {
    return selectCurrent({
      table: TABLES.repair,
      idField: 'repairScopeEvidenceId',
      dealId: dealId,
      canonicalPropertyKey: canonicalPropertyKey,
      asOf: asOf,
      storage: storage,
      validate: validateRepair,
      timeField: function (record) {
        return record.evidenceGeneratedAt;
      }
    });
  }

  function getCurrentDealOfferReadinessEvidence(
    dealId,
    canonicalPropertyKey,
    asOf,
    storage
  ) {
    return selectCurrent({
      table: TABLES.readiness,
      idField: 'readinessEvidenceId',
      dealId: dealId,
      canonicalPropertyKey: canonicalPropertyKey,
      asOf: asOf,
      storage: storage,
      validate: validateReadiness,
      timeField: function (record) {
        return record.evaluatedAt;
      }
    });
  }

  return freeze({
    schemaVersion: SCHEMA_VERSION,
    tables: TABLES,
    idPrefixes: ID_PREFIXES,
    appendOutcomes: APPEND_OUTCOMES,
    readOutcomes: READ_OUTCOMES,
    arvFields: ARV_FIELDS,
    repairFields: REPAIR_FIELDS,
    readinessFields: READINESS_FIELDS,
    appendDealArvEvidence: appendDealArvEvidence,
    appendDealRepairScopeEvidence: appendDealRepairScopeEvidence,
    appendDealOfferReadinessEvidence: appendDealOfferReadinessEvidence,
    getCurrentDealArvEvidence: getCurrentDealArvEvidence,
    getCurrentDealRepairScopeEvidence: getCurrentDealRepairScopeEvidence,
    getCurrentDealOfferReadinessEvidence: getCurrentDealOfferReadinessEvidence,

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
}());

if (typeof module !== 'undefined' && module.exports) {
  module.exports = REOS_COMPS_READINESS_EVIDENCE_PERSISTENCE_V1;
}
