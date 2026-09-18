/**
 * REOS Enterprise - Absentee Owner Enrichment
 * Single-Record Certification Entrypoint
 *
 * Manual Admin-only certification orchestration for exactly one existing
 * canonical DISTRESS_LEADS record.
 *
 * This module owns no physical mutation primitive. It composes only the
 * certified sanitizer -> persistence-plan -> execution-request -> executor
 * chain. The executor remains the sole physical mutation surface.
 */

var REOS = REOS || {};

REOS.AbsenteeOwnerEnrichmentCertificationEntrypoint = (function () {
  'use strict';

  var TARGET_TABLE = 'DISTRESS_LEADS';
  var DISTRESS_ID = 'Distress Lead ID';
  var PROPERTY_KEY = 'Canonical Property Key';

  function isPlainObject_(value) {
    return !!value &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function requiredString_(value, code) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(code);
    }

    return value.trim();
  }

  function requireSurface_(owner, method, code) {
    if (!owner || typeof owner[method] !== 'function') {
      throw new Error(code);
    }
  }

  function certifySingleRecord(options) {
    /*
     * Admin authority is deliberately the first operational action.
     * No DISTRESS_LEADS read, planning, builder work, lock acquisition,
     * or mutation may precede it.
     */
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'ABSENTEE_OWNER_CERTIFICATION_ADMIN_SECURITY_UNAVAILABLE'
      );
    }

    REOS.Security.requireAdmin();

    if (!isPlainObject_(options)) {
      throw new Error(
        'ABSENTEE_OWNER_CERTIFICATION_OPTIONS_REQUIRED'
      );
    }

    if (Object.keys(options).some(function (key) {
      return [
        'outcome',
        'identity',
        'attemptedPatch'
      ].indexOf(key) === -1;
    })) {
      throw new Error(
        'ABSENTEE_OWNER_CERTIFICATION_OPTION_NOT_ALLOWED'
      );
    }

    if (!isPlainObject_(options.identity)) {
      throw new Error(
        'ABSENTEE_OWNER_CERTIFICATION_IDENTITY_REQUIRED'
      );
    }

    var identityKeys = Object.keys(options.identity).sort();
    var requiredIdentityKeys = [
      DISTRESS_ID,
      PROPERTY_KEY
    ].sort();

    if (
      identityKeys.length !== requiredIdentityKeys.length ||
      identityKeys.some(function (key, index) {
        return key !== requiredIdentityKeys[index];
      })
    ) {
      throw new Error(
        'ABSENTEE_OWNER_CERTIFICATION_IDENTITY_SHAPE_INVALID'
      );
    }

    var identity = {};
    identity[DISTRESS_ID] = requiredString_(
      options.identity[DISTRESS_ID],
      'ABSENTEE_OWNER_CERTIFICATION_DISTRESS_LEAD_ID_REQUIRED'
    );
    identity[PROPERTY_KEY] = requiredString_(
      options.identity[PROPERTY_KEY],
      'ABSENTEE_OWNER_CERTIFICATION_CANONICAL_PROPERTY_KEY_REQUIRED'
    );

    if (!isPlainObject_(options.attemptedPatch)) {
      throw new Error(
        'ABSENTEE_OWNER_CERTIFICATION_ATTEMPTED_PATCH_REQUIRED'
      );
    }

    requireSurface_(
      REOS.AbsenteeOwnerEnrichmentSanitizer,
      'sanitize',
      'ABSENTEE_OWNER_SANITIZER_UNAVAILABLE'
    );

    requireSurface_(
      REOS.Database,
      'getAll',
      'ABSENTEE_OWNER_DATABASE_READ_API_UNAVAILABLE'
    );

    requireSurface_(
      REOS.AbsenteeOwnerEnrichmentPersistenceAdapter,
      'plan',
      'ABSENTEE_OWNER_PERSISTENCE_ADAPTER_UNAVAILABLE'
    );

    requireSurface_(
      REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder,
      'prepare',
      'ABSENTEE_OWNER_EXECUTION_REQUEST_BUILDER_UNAVAILABLE'
    );

    requireSurface_(
      REOS.AbsenteeOwnerEnrichmentExecutor,
      'execute',
      'ABSENTEE_OWNER_EXECUTOR_UNAVAILABLE'
    );

    var sanitized =
      REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize({
        outcome: options.outcome,
        identity: identity,
        attemptedPatch: options.attemptedPatch
      });

    /*
     * Read-only canonical record supply.
     *
     * Database.getAll preserves each record's physical _rowNumber.
     * The certified persistence adapter independently requires unique
     * Distress Lead ID and Canonical Property Key matches, requires those
     * identities to resolve to the same physical row, and rejects an empty
     * semantic patch.
     */
    var records = REOS.Database.getAll(TARGET_TABLE);

    var plan =
      REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan({
        sanitizedResult: sanitized,
        records: records
      });

    var request =
      REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare(
        plan
      );

    /*
     * No mutation occurs in this entrypoint. The certified executor owns
     * ScriptLock acquisition, complete preimage validation, bounded target
     * writes, explicit flush, complete postimage validation, and the
     * PRECONDITION / OUTCOME_UNCERTAIN / VERIFIED classifications.
     */
    return REOS.AbsenteeOwnerEnrichmentExecutor.execute(
      request
    );
  }

  return Object.freeze({
    TARGET_TABLE: TARGET_TABLE,
    certifySingleRecord: certifySingleRecord
  });
})();

function reosAbsenteeOwnerEnrichmentCertifySingleRecord(options) {
  return REOS
    .AbsenteeOwnerEnrichmentCertificationEntrypoint
    .certifySingleRecord(options);
}
