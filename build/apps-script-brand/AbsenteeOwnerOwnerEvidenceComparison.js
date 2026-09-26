var REOS = REOS || {};

REOS.AbsenteeOwnerOwnerEvidenceComparison = (function () {
  'use strict';

  var MODE =
    'READ_ONLY_OWNER_EVIDENCE_COMPARISON';

  var PHASE =
    'absentee_owner_owner_evidence_comparison';

  var UPSTREAM_MODE =
    'READ_ONLY_OWNER_EVIDENCE';

  var UPSTREAM_PHASE =
    'absentee_owner_philadelphia_owner_evidence_lookup';

  var SOURCE_AGENCY =
    'Philadelphia Office of Property Assessment';

  var SOURCE_TABLE =
    'opa_properties_public';

  var SOURCE_ENDPOINT =
    'https://phl.carto.com/api/v2/sql';

  var SOURCE_LOOKUP_MODE =
    'exact_property_address';

  var DISTRESS_ID =
    'Distress Lead ID';

  var CANONICAL_KEY =
    'Canonical Property Key';

  var MAILING_FIELDS = Object.freeze([
    'mailing_address_1',
    'mailing_address_2',
    'mailing_care_of',
    'mailing_city_state',
    'mailing_street',
    'mailing_zip'
  ]);

  var UPSTREAM_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ]);

  function authority_() {
    return {
      productionDataMutationAuthorityGranted: false,
      ownerEvidencePersistenceAuthorityGranted: false,
      absenteeClassificationAuthorityGranted: false,
      canonicalIdentityRepairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      triggerAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      certificationMutationAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function attachAuthority_(result) {
    var authority = authority_();

    Object.keys(authority).forEach(function (key) {
      result[key] = authority[key];
    });

    return result;
  }

  function isPlainObject_(value) {
    return !!value &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function own_(object, key) {
    return Object.prototype.hasOwnProperty.call(
      object,
      key
    );
  }

  function cleanString_(value) {
    return String(
      value === null || value === undefined
        ? ''
        : value
    ).trim();
  }

  function normalizeText_(value) {
    return cleanString_(value)
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function normalizeState_(value) {
    var normalized =
      normalizeText_(value);

    return /^[A-Z]{2}$/.test(normalized)
      ? normalized
      : '';
  }

  function normalizeZip_(value) {
    var normalized =
      cleanString_(value);

    var match =
      normalized.match(
        /^(\d{5})(?:-\d{4})?$/
      );

    return match
      ? match[1]
      : '';
  }

  function parseMailingCityState_(value) {
    var normalized =
      normalizeText_(value);

    var match =
      normalized.match(
        /^(.+)\s+([A-Z]{2})$/
      );

    if (!match) {
      return {
        city: '',
        state: ''
      };
    }

    var city =
      cleanString_(match[1]);

    if (!city) {
      return {
        city: '',
        state: ''
      };
    }

    return {
      city: city,
      state: match[2]
    };
  }

  function validRowNumber_(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 2;
  }

  function nonblank_(value) {
    return cleanString_(value) !== '';
  }

  function upstreamAuthoritiesFalse_(
    evidence
  ) {
    return UPSTREAM_AUTHORITY_FIELDS
      .every(function (field) {
        return own_(evidence, field) &&
          evidence[field] === false;
      });
  }

  function targetEnvelopeEligible_(
    target
  ) {
    if (!isPlainObject_(target)) {
      return false;
    }

    if (!validRowNumber_(target.rowNumber)) {
      return false;
    }

    if (!isPlainObject_(target.identity)) {
      return false;
    }

    if (
      !nonblank_(
        target.identity[DISTRESS_ID]
      ) ||
      !nonblank_(
        target.identity[CANONICAL_KEY]
      )
    ) {
      return false;
    }

    return [
      'propertyAddress',
      'city',
      'state',
      'zip'
    ].every(function (field) {
      return own_(target, field);
    });
  }

  function sourceEligible_(source) {
    return isPlainObject_(source) &&
      source.agency === SOURCE_AGENCY &&
      source.table === SOURCE_TABLE &&
      source.endpoint === SOURCE_ENDPOINT &&
      source.lookupQueryMode ===
        SOURCE_LOOKUP_MODE;
  }

  function mailingEnvelopeEligible_(
    mailing
  ) {
    if (!isPlainObject_(mailing)) {
      return false;
    }

    return MAILING_FIELDS.every(
      function (field) {
        return own_(mailing, field);
      }
    );
  }

  function eligible_(evidence) {
    if (!isPlainObject_(evidence)) {
      return false;
    }

    if (
      evidence.mode !== UPSTREAM_MODE ||
      evidence.phase !== UPSTREAM_PHASE ||
      evidence.outcome !== 'MATCHED'
    ) {
      return false;
    }

    if (
      evidence.boundedSourceRowCount !== 1
    ) {
      return false;
    }

    if (
      !targetEnvelopeEligible_(
        evidence.target
      )
    ) {
      return false;
    }

    if (!sourceEligible_(evidence.source)) {
      return false;
    }

    if (
      !mailingEnvelopeEligible_(
        evidence.ownerMailingEvidence
      )
    ) {
      return false;
    }

    return upstreamAuthoritiesFalse_(
      evidence
    );
  }

  function normalizedProperty_(
    evidence
  ) {
    return {
      street:
        normalizeText_(
          evidence.target.propertyAddress
        ),
      city:
        normalizeText_(
          evidence.target.city
        ),
      state:
        normalizeState_(
          evidence.target.state
        ),
      zip:
        normalizeZip_(
          evidence.target.zip
        )
    };
  }

  function normalizedMailing_(
    evidence
  ) {
    var parsed =
      parseMailingCityState_(
        evidence
          .ownerMailingEvidence
          .mailing_city_state
      );

    return {
      street:
        normalizeText_(
          evidence
            .ownerMailingEvidence
            .mailing_street
        ),
      city: parsed.city,
      state: parsed.state,
      zip:
        normalizeZip_(
          evidence
            .ownerMailingEvidence
            .mailing_zip
        )
    };
  }

  function sufficient_(components) {
    return !!(
      components.street &&
      components.city &&
      components.state &&
      components.zip
    );
  }

  function targetResult_(evidence) {
    return {
      rowNumber:
        evidence.target.rowNumber,
      identity: {
        'Distress Lead ID':
          evidence
            .target
            .identity[DISTRESS_ID],
        'Canonical Property Key':
          evidence
            .target
            .identity[CANONICAL_KEY]
      }
    };
  }

  function sourceResult_(evidence) {
    var result = {
      agency:
        evidence.source.agency,
      table:
        evidence.source.table,
      endpoint:
        evidence.source.endpoint,
      lookupQueryMode:
        evidence.source.lookupQueryMode
    };

    if (own_(evidence.source, 'dataset')) {
      result.dataset =
        evidence.source.dataset;
    }

    if (
      own_(
        evidence.source,
        'parcelNumber'
      )
    ) {
      result.parcelNumber =
        evidence.source.parcelNumber;
    }

    if (
      own_(
        evidence.source,
        'propertyLocation'
      )
    ) {
      result.propertyLocation =
        evidence.source.propertyLocation;
    }

    return result;
  }

  function ineligible_() {
    return attachAuthority_({
      ok: false,
      mode: MODE,
      phase: PHASE,
      outcome:
        'INELIGIBLE_OWNER_EVIDENCE'
    });
  }

  function eligibleResult_(
    evidence,
    outcome,
    property,
    mailing,
    differences
  ) {
    var result = {
      ok: true,
      mode: MODE,
      phase: PHASE,
      outcome: outcome,
      target:
        targetResult_(evidence),
      source:
        sourceResult_(evidence),
      normalizedPropertyAddress:
        property,
      normalizedMailingAddress:
        mailing
    };

    if (Array.isArray(differences)) {
      result.differingComponents =
        differences.slice();
    }

    return attachAuthority_(result);
  }

  function compare(ownerEvidence) {
    if (!eligible_(ownerEvidence)) {
      return ineligible_();
    }

    var property =
      normalizedProperty_(
        ownerEvidence
      );

    var mailing =
      normalizedMailing_(
        ownerEvidence
      );

    if (
      !sufficient_(property) ||
      !sufficient_(mailing)
    ) {
      return eligibleResult_(
        ownerEvidence,
        'INSUFFICIENT_MAILING_EVIDENCE',
        property,
        mailing
      );
    }

    var differences = [];

    [
      'street',
      'city',
      'state',
      'zip'
    ].forEach(function (field) {
      if (
        property[field] !==
        mailing[field]
      ) {
        differences.push(field);
      }
    });

    if (differences.length === 0) {
      return eligibleResult_(
        ownerEvidence,
        'MAILING_ADDRESS_MATCHES',
        property,
        mailing,
        []
      );
    }

    return eligibleResult_(
      ownerEvidence,
      'MAILING_ADDRESS_DIFFERS',
      property,
      mailing,
      differences
    );
  }

  return Object.freeze({
    compare: compare
  });
})();
