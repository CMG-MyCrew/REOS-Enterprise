(function (root) {
  'use strict';

  var OUTCOMES = Object.freeze([
    'MATCHED',
    'NO_MATCH',
    'AMBIGUOUS',
    'FAILED'
  ]);

  var OWNED_FIELDS = Object.freeze([
    'Owner Name',
    'Owner Mailing Address'
  ]);

  var REQUIRED_IDENTITY_FIELDS = Object.freeze([
    'Distress Lead ID',
    'Canonical Property Key'
  ]);

  var PROTECTED_FIELDS = Object.freeze([
    'Distress Lead ID',
    'Canonical Property Key',
    'Address',
    'City',
    'State',
    'Zip',
    'Distress Type',
    'Distress Score',
    'Estimated Value',
    'Estimated Repairs',
    'Suggested Offer',
    'Lead Source',
    'Status',
    'Notes',
    'Imported Deal ID',
    'Created At',
    'ARV',
    'MAO',
    'automaticOfferAuthorityGranted'
  ]);

  function hasOwn_(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isPlainObject_(value) {
    if (value === null || typeof value !== 'object') {
      return false;
    }

    var proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  function copyObject_(value) {
    var copy = {};
    Object.keys(value || {}).forEach(function (key) {
      copy[key] = value[key];
    });
    return copy;
  }

  function normalizeRequiredIdentityValue_(value) {
    if (typeof value !== 'string') {
      return '';
    }
    return value.trim();
  }

  function normalizeOwnerValue_(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value !== 'string') {
      throw new Error('OWNER_VALUE_INVALID_TYPE');
    }

    return value.trim();
  }

  function assertOutcome_(outcome) {
    if (OUTCOMES.indexOf(outcome) === -1) {
      throw new Error('OUTCOME_NOT_ALLOWED');
    }
  }

  function assertIdentity_(identity) {
    if (!isPlainObject_(identity)) {
      throw new Error('IDENTITY_REQUIRED');
    }

    REQUIRED_IDENTITY_FIELDS.forEach(function (field) {
      if (
        !hasOwn_(identity, field) ||
        normalizeRequiredIdentityValue_(identity[field]) === ''
      ) {
        throw new Error('IDENTITY_FIELD_REQUIRED:' + field);
      }
    });
  }

  function assertAttemptedPatch_(attemptedPatch) {
    if (!isPlainObject_(attemptedPatch)) {
      throw new Error('ATTEMPTED_PATCH_REQUIRED');
    }

    Object.keys(attemptedPatch).forEach(function (key) {
      if (OWNED_FIELDS.indexOf(key) === -1) {
        throw new Error('WRITE_KEY_NOT_ALLOWED:' + key);
      }
    });
  }

  function buildOwnedPatch_(outcome, attemptedPatch) {
    if (outcome !== 'MATCHED') {
      if (Object.keys(attemptedPatch).length !== 0) {
        throw new Error('NON_MATCHED_OUTCOME_CANNOT_WRITE_OWNER_FIELDS');
      }
      return {};
    }

    var patch = {};

    OWNED_FIELDS.forEach(function (field) {
      if (!hasOwn_(attemptedPatch, field)) {
        return;
      }

      patch[field] = normalizeOwnerValue_(attemptedPatch[field]);
    });

    return patch;
  }

  function sanitize(input) {
    if (!isPlainObject_(input)) {
      throw new Error('INPUT_REQUIRED');
    }

    var outcome = input.outcome;
    var identity = input.identity;
    var attemptedPatch = input.attemptedPatch;

    assertOutcome_(outcome);
    assertIdentity_(identity);
    assertAttemptedPatch_(attemptedPatch);

    var patch = buildOwnedPatch_(outcome, attemptedPatch);

    return {
      ok: true,
      outcome: outcome,
      identity: {
        'Distress Lead ID':
          normalizeRequiredIdentityValue_(identity['Distress Lead ID']),
        'Canonical Property Key':
          normalizeRequiredIdentityValue_(identity['Canonical Property Key'])
      },
      patch: copyObject_(patch),
      persistenceAuthorized: false,
      dealCreationAuthorized: false,
      automaticOfferAuthorityGranted: false
    };
  }

  var api = Object.freeze({
    OUTCOMES: OUTCOMES,
    OWNED_FIELDS: OWNED_FIELDS,
    REQUIRED_IDENTITY_FIELDS: REQUIRED_IDENTITY_FIELDS,
    PROTECTED_FIELDS: PROTECTED_FIELDS,
    sanitize: sanitize
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.REOS = root.REOS || {};
  root.REOS.AbsenteeOwnerEnrichmentSanitizer = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
