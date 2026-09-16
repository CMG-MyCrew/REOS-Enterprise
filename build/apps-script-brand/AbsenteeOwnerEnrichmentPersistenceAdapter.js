(function (root, factory) {
  'use strict';

  var api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.REOS = root.REOS || {};
  root.REOS.AbsenteeOwnerEnrichmentPersistenceAdapter = api;
})(
  typeof globalThis !== 'undefined' ? globalThis : this,
  function () {
    'use strict';

    var TARGET_TABLE = 'DISTRESS_LEADS';

    var OWNED_FIELDS = Object.freeze([
      'Owner Name',
      'Owner Mailing Address'
    ]);

    var REQUIRED_IDENTITY = Object.freeze([
      'Distress Lead ID',
      'Canonical Property Key'
    ]);

    function isPlainObject_(value) {
      return !!value &&
        typeof value === 'object' &&
        !Array.isArray(value);
    }

    function normalizeRequiredString_(value, field) {
      if (typeof value !== 'string' || !value.trim()) {
        throw new Error('IDENTITY_INVALID:' + field);
      }

      return value.trim();
    }

    function assertSanitizedResult_(result) {
      if (!isPlainObject_(result)) {
        throw new Error('SANITIZED_RESULT_INVALID');
      }

      if (result.ok !== true) {
        throw new Error('SANITIZED_RESULT_NOT_OK');
      }

      if (result.outcome !== 'MATCHED') {
        throw new Error(
          'OUTCOME_NOT_PERSISTENCE_ELIGIBLE:' +
          String(result.outcome || '')
        );
      }

      if (result.persistenceAuthorized !== false) {
        throw new Error(
          'SANITIZER_PERSISTENCE_AUTHORITY_INVALID'
        );
      }

      if (result.automaticOfferAuthorityGranted !== false) {
        throw new Error(
          'SANITIZER_OFFER_AUTHORITY_INVALID'
        );
      }

      if (!isPlainObject_(result.identity)) {
        throw new Error('IDENTITY_INVALID');
      }

      if (!isPlainObject_(result.patch)) {
        throw new Error('PATCH_INVALID');
      }
    }

    function buildIdentity_(result) {
      var identity = {};

      REQUIRED_IDENTITY.forEach(function (field) {
        identity[field] =
          normalizeRequiredString_(
            result.identity[field],
            field
          );
      });

      return identity;
    }

    function buildPatch_(result) {
      var source = result.patch;
      var keys = Object.keys(source);

      keys.forEach(function (key) {
        if (OWNED_FIELDS.indexOf(key) === -1) {
          throw new Error(
            'WRITE_KEY_NOT_ALLOWED:' + key
          );
        }
      });

      var patch = {};

      OWNED_FIELDS.forEach(function (field) {
        if (
          Object.prototype.hasOwnProperty.call(
            source,
            field
          )
        ) {
          if (typeof source[field] !== 'string') {
            throw new Error(
              'OWNER_VALUE_INVALID_TYPE:' + field
            );
          }

          patch[field] = source[field].trim();
        }
      });

      if (Object.keys(patch).length === 0) {
        throw new Error('EMPTY_OWNER_PATCH');
      }

      return patch;
    }

    function normalizeRecordIdentity_(record, field) {
      return String(
        record && record[field] || ''
      ).trim();
    }

    function resolveUniqueRecord_(
      records,
      identity
    ) {
      if (!Array.isArray(records)) {
        throw new Error('RECORD_SET_INVALID');
      }

      var distressId =
        identity['Distress Lead ID'];

      var canonicalKey =
        identity['Canonical Property Key'];

      var distressMatches =
        records.filter(function (record) {
          return normalizeRecordIdentity_(
            record,
            'Distress Lead ID'
          ) === distressId;
        });

      var canonicalMatches =
        records.filter(function (record) {
          return normalizeRecordIdentity_(
            record,
            'Canonical Property Key'
          ) === canonicalKey;
        });

      if (distressMatches.length === 0) {
        throw new Error(
          'DISTRESS_LEAD_ID_NOT_FOUND'
        );
      }

      if (distressMatches.length !== 1) {
        throw new Error(
          'DISTRESS_LEAD_ID_AMBIGUOUS'
        );
      }

      if (canonicalMatches.length === 0) {
        throw new Error(
          'CANONICAL_PROPERTY_KEY_NOT_FOUND'
        );
      }

      if (canonicalMatches.length !== 1) {
        throw new Error(
          'CANONICAL_PROPERTY_KEY_AMBIGUOUS'
        );
      }

      var distressRecord =
        distressMatches[0];

      var canonicalRecord =
        canonicalMatches[0];

      if (distressRecord !== canonicalRecord) {
        var distressRow =
          distressRecord &&
          distressRecord._rowNumber;

        var canonicalRow =
          canonicalRecord &&
          canonicalRecord._rowNumber;

        if (
          !distressRow ||
          !canonicalRow ||
          distressRow !== canonicalRow
        ) {
          throw new Error(
            'IDENTITY_DIMENSIONS_RESOLVE_TO_DIFFERENT_RECORDS'
          );
        }
      }

      return distressRecord;
    }

    function plan(input) {
      if (!isPlainObject_(input)) {
        throw new Error('INPUT_INVALID');
      }

      assertSanitizedResult_(
        input.sanitizedResult
      );

      var identity =
        buildIdentity_(
          input.sanitizedResult
        );

      var patch =
        buildPatch_(
          input.sanitizedResult
        );

      var record =
        resolveUniqueRecord_(
          input.records,
          identity
        );

      return {
        ok: true,
        targetTable: TARGET_TABLE,
        identity: {
          'Distress Lead ID':
            identity['Distress Lead ID'],
          'Canonical Property Key':
            identity['Canonical Property Key']
        },
        rowNumber:
          record &&
          record._rowNumber
            ? record._rowNumber
            : null,
        patch: patch,

        persistenceExecutionAuthorized: false,
        databaseUpdateAuthorized: false,
        databaseInsertAuthorized: false,
        databaseUpsertAuthorized: false,
        dealCreationAuthorized: false,
        maoGenerationAuthorized: false,
        automaticOfferAuthorityGranted: false
      };
    }

    return Object.freeze({
      TARGET_TABLE: TARGET_TABLE,
      OWNED_FIELDS: OWNED_FIELDS,
      REQUIRED_IDENTITY: REQUIRED_IDENTITY,
      plan: plan
    });
  }
);
