var REOS = REOS || {};

REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator = (function () {
  'use strict';

  var MODE =
    'READ_ONLY_OPA_ACCOUNT_RANGE_EVIDENCE_EVALUATION';

  var PHASE =
    'absentee_owner_opa_account_range_evidence_evaluation';

  var UPSTREAM_MODE =
    'READ_ONLY_OWNER_EVIDENCE';

  var UPSTREAM_PHASE =
    'absentee_owner_philadelphia_owner_evidence_lookup';

  var SOURCE_AGENCY =
    'Philadelphia Office of Property Assessment';

  var SOURCE_DATASET =
    'Philadelphia Properties and Assessment History';

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

  var MIN_CORROBORATING_SOURCE_OBSERVATIONS =
    2;

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
      productionDataMutationAuthorityGranted:
        false,

      sourceEvidenceRetrievalAuthorityGranted:
        false,

      ownerEvidenceRetrievalAuthorityGranted:
        false,

      ownerEvidencePersistenceAuthorityGranted:
        false,

      classificationAuthorityGranted:
        false,

      absenteeClassificationAuthorityGranted:
        false,

      classificationPersistenceAuthorityGranted:
        false,

      rolloutAuthorityGranted:
        false,

      canonicalIdentityRepairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      triggerAuthorityGranted:
        false,

      connectorExecutionAuthorityGranted:
        false,

      certificationMutationAuthorityGranted:
        false,

      ownerOccupancyAuthorityGranted:
        false,

      vacancyAuthorityGranted:
        false,

      qualifiedDealQueueAuthorityGranted:
        false,

      acquisitionLifecycleAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  function attachAuthority_(result) {
    var authority =
      authority_();

    Object.keys(authority).forEach(
      function (key) {
        result[key] =
          authority[key];
      }
    );

    return result;
  }

  function own_(object, key) {
    return Object.prototype
      .hasOwnProperty.call(
        object,
        key
      );
  }

  function isPlainObject_(value) {
    return !!value &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function cleanString_(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();
  }

  function normalizeText_(value) {
    return cleanString_(value)
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function nonblank_(value) {
    return cleanString_(value) !== '';
  }

  function validRowNumber_(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 2;
  }

  function validBoundedCount_(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 0 &&
      value <= 5;
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

  function validIdentity_(identity) {
    return isPlainObject_(identity) &&
      nonblank_(
        identity[DISTRESS_ID]
      ) &&
      nonblank_(
        identity[CANONICAL_KEY]
      );
  }

  function validUpstreamTarget_(target) {
    return isPlainObject_(target) &&
      validRowNumber_(
        target.rowNumber
      ) &&
      validIdentity_(
        target.identity
      ) &&
      own_(
        target,
        'propertyAddress'
      ) &&
      nonblank_(
        target.propertyAddress
      );
  }

  function validUpstreamSource_(source) {
    return isPlainObject_(source) &&
      source.agency === SOURCE_AGENCY &&
      source.dataset === SOURCE_DATASET &&
      source.table === SOURCE_TABLE &&
      source.endpoint === SOURCE_ENDPOINT &&
      source.lookupQueryMode ===
        SOURCE_LOOKUP_MODE;
  }

  function normalLookupEligible_(evidence) {
    return isPlainObject_(evidence) &&
      evidence.ok === true &&
      evidence.mode === UPSTREAM_MODE &&
      evidence.phase === UPSTREAM_PHASE &&
      evidence.outcome === 'NO_MATCH' &&
      validUpstreamTarget_(
        evidence.target
      ) &&
      validUpstreamSource_(
        evidence.source
      ) &&
      validBoundedCount_(
        evidence.boundedSourceRowCount
      ) &&
      upstreamAuthoritiesFalse_(
        evidence
      );
  }

  function unitBearing_(normalized) {
    return normalized.indexOf('#') >= 0 ||
      /(?:^|\s)(?:APT|APARTMENT|UNIT|STE|SUITE|FL|FLOOR|RM|ROOM)\b/
        .test(normalized);
  }

  function parseTargetAddress_(value) {
    var normalized =
      normalizeText_(value);

    if (
      !normalized ||
      unitBearing_(normalized)
    ) {
      return null;
    }

    var match =
      normalized.match(
        /^([1-9]\d*)\s+(.+)$/
      );

    if (!match) {
      return null;
    }

    var number =
      Number(match[1]);

    if (
      !isFinite(number) ||
      Math.floor(number) !== number ||
      number <= 0
    ) {
      return null;
    }

    var street =
      cleanString_(match[2]);

    if (!street) {
      return null;
    }

    return {
      normalizedAddress: normalized,
      houseNumber: number,
      streetSuffix: street
    };
  }

  function parseRangeLocation_(value) {
    var normalized =
      normalizeText_(value);

    if (
      !normalized ||
      unitBearing_(normalized)
    ) {
      return null;
    }

    var match =
      normalized.match(
        /^([1-9]\d*)-(\d+)\s+(.+)$/
      );

    if (!match) {
      return null;
    }

    var startText =
      match[1];

    var endText =
      match[2];

    var street =
      cleanString_(match[3]);

    if (!street) {
      return null;
    }

    var expandedEndText;

    if (
      endText.length <
      startText.length
    ) {
      var prefixLength =
        startText.length -
        endText.length;

      expandedEndText =
        startText.slice(
          0,
          prefixLength
        ) +
        endText;
    } else {
      expandedEndText =
        endText;
    }

    if (
      !/^\d+$/.test(
        expandedEndText
      )
    ) {
      return null;
    }

    var start =
      Number(startText);

    var end =
      Number(expandedEndText);

    if (
      !isFinite(start) ||
      !isFinite(end) ||
      Math.floor(start) !== start ||
      Math.floor(end) !== end ||
      start <= 0 ||
      end <= 0 ||
      end < start
    ) {
      return null;
    }

    return {
      normalizedLocation:
        normalized,

      rangeStart:
        start,

      rangeEnd:
        end,

      streetSuffix:
        street
    };
  }

  function copyTarget_(normalEvidence) {
    return {
      rowNumber:
        normalEvidence.target.rowNumber,

      identity: {
        'Distress Lead ID':
          normalEvidence
            .target
            .identity[DISTRESS_ID],

        'Canonical Property Key':
          normalEvidence
            .target
            .identity[CANONICAL_KEY]
      },

      propertyAddress:
        normalEvidence
          .target
          .propertyAddress
    };
  }

  function sourceObservationSummary_(
    observations,
    targetAddress
  ) {
    if (
      !Array.isArray(observations) ||
      observations.length <
        MIN_CORROBORATING_SOURCE_OBSERVATIONS
    ) {
      return {
        ok: false,
        reason:
          'INSUFFICIENT_SOURCE_OBSERVATIONS'
      };
    }

    var targetNormalized =
      normalizeText_(
        targetAddress
      );

    var ids = {};
    var orderedIds = [];

    var parcelIdNum = '';
    var opaAccountNum = '';

    for (
      var index = 0;
      index < observations.length;
      index++
    ) {
      var observation =
        observations[index];

      if (!isPlainObject_(observation)) {
        return {
          ok: false,
          reason:
            'INVALID_SOURCE_OBSERVATION'
        };
      }

      var observationId =
        cleanString_(
          observation.sourceObservationId
        );

      var propertyAddress =
        normalizeText_(
          observation.propertyAddress
        );

      var parcel =
        cleanString_(
          observation.parcel_id_num
        );

      var account =
        cleanString_(
          observation.opa_account_num
        );

      if (
        !observationId ||
        !propertyAddress ||
        !parcel ||
        !account
      ) {
        return {
          ok: false,
          reason:
            'INCOMPLETE_SOURCE_OBSERVATION'
        };
      }

      if (own_(ids, observationId)) {
        return {
          ok: false,
          reason:
            'DUPLICATE_SOURCE_OBSERVATION_ID'
        };
      }

      ids[observationId] = true;
      orderedIds.push(
        observationId
      );

      if (
        propertyAddress !==
        targetNormalized
      ) {
        return {
          ok: false,
          reason:
            'SOURCE_ADDRESS_DISAGREEMENT'
        };
      }

      if (index === 0) {
        parcelIdNum =
          parcel;

        opaAccountNum =
          account;
      } else {
        if (
          parcel !== parcelIdNum
        ) {
          return {
            ok: false,
            reason:
              'SOURCE_PARCEL_ID_DISAGREEMENT'
          };
        }

        if (
          account !== opaAccountNum
        ) {
          return {
            ok: false,
            reason:
              'SOURCE_OPA_ACCOUNT_DISAGREEMENT'
          };
        }
      }
    }

    if (
      !/^\d{9}$/.test(
        opaAccountNum
      )
    ) {
      return {
        ok: false,
        reason:
          'OPA_ACCOUNT_NOT_NINE_DIGITS'
      };
    }

    return {
      ok: true,
      observationCount:
        observations.length,
      observationIds:
        orderedIds,
      normalizedTargetAddress:
        targetNormalized,
      parcelIdNum:
        parcelIdNum,
      opaAccountNum:
        opaAccountNum
    };
  }

  function ineligible_(reason) {
    return attachAuthority_({
      ok: false,

      mode:
        MODE,

      phase:
        PHASE,

      outcome:
        'INELIGIBLE',

      reason:
        reason,

      rangeContainmentDiagnosticCandidate:
        false,

      rangeContainmentCertifiedMatch:
        false
    });
  }

  function evaluated_(
    input,
    normalEvidence,
    summary,
    outcome,
    details
  ) {
    var result = {
      ok: true,

      mode:
        MODE,

      phase:
        PHASE,

      outcome:
        outcome,

      normalLookupOutcome:
        'NO_MATCH',

      target:
        copyTarget_(
          normalEvidence
        ),

      corroboratingSourceObservationCount:
        summary.observationCount,

      sourceObservationIds:
        summary.observationIds.slice(),

      sourceParcelIdNum:
        summary.parcelIdNum,

      sourceOpaAccountNum:
        summary.opaAccountNum,

      boundedOpaAccountRowCount:
        input.opaAccountRows.length,

      rangeContainmentDiagnosticCandidate:
        outcome ===
        'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE',

      rangeContainmentCertifiedMatch:
        false
    };

    if (isPlainObject_(details)) {
      Object.keys(details).forEach(
        function (key) {
          result[key] =
            details[key];
        }
      );
    }

    return attachAuthority_(
      result
    );
  }

  function evaluate(input) {
    if (!isPlainObject_(input)) {
      return ineligible_(
        'INVALID_INPUT'
      );
    }

    var normalEvidence =
      input.normalLookupEvidence;

    if (
      !normalLookupEligible_(
        normalEvidence
      )
    ) {
      return ineligible_(
        'NORMAL_LOOKUP_NOT_ELIGIBLE'
      );
    }

    var summary =
      sourceObservationSummary_(
        input.sourceObservations,
        normalEvidence
          .target
          .propertyAddress
      );

    if (!summary.ok) {
      return ineligible_(
        summary.reason
      );
    }

    if (
      !Array.isArray(
        input.opaAccountRows
      )
    ) {
      return ineligible_(
        'OPA_ACCOUNT_ROWS_NOT_ARRAY'
      );
    }

    if (
      input.opaAccountRows.length === 0
    ) {
      return evaluated_(
        input,
        normalEvidence,
        summary,
        'ACCOUNT_NO_MATCH'
      );
    }

    if (
      input.opaAccountRows.length !== 1
    ) {
      return evaluated_(
        input,
        normalEvidence,
        summary,
        'ACCOUNT_AMBIGUOUS'
      );
    }

    var opaRow =
      input.opaAccountRows[0];

    if (
      !isPlainObject_(opaRow) ||
      !own_(opaRow, 'parcel_number') ||
      !own_(opaRow, 'location')
    ) {
      return ineligible_(
        'INVALID_OPA_ACCOUNT_ROW'
      );
    }

    var opaParcelNumber =
      cleanString_(
        opaRow.parcel_number
      );

    var opaLocation =
      cleanString_(
        opaRow.location
      );

    if (
      opaParcelNumber !==
      summary.opaAccountNum
    ) {
      return ineligible_(
        'OPA_ACCOUNT_ROW_IDENTIFIER_MISMATCH'
      );
    }

    if (!opaLocation) {
      return ineligible_(
        'OPA_ACCOUNT_ROW_LOCATION_BLANK'
      );
    }

    var target =
      parseTargetAddress_(
        normalEvidence
          .target
          .propertyAddress
      );

    var range =
      parseRangeLocation_(
        opaLocation
      );

    if (
      !target ||
      !range
    ) {
      return evaluated_(
        input,
        normalEvidence,
        summary,
        'RANGE_PARSE_FAILED',
        {
          opaParcelNumber:
            opaParcelNumber,

          opaLocation:
            opaLocation
        }
      );
    }

    var streetExact =
      target.streetSuffix ===
      range.streetSuffix;

    var withinRange =
      target.houseNumber >=
        range.rangeStart &&
      target.houseNumber <=
        range.rangeEnd;

    var parityCompatible =
      target.houseNumber % 2 ===
        range.rangeStart % 2 &&
      target.houseNumber % 2 ===
        range.rangeEnd % 2;

    var details = {
      opaParcelNumber:
        opaParcelNumber,

      opaLocation:
        opaLocation,

      normalizedTargetAddress:
        target.normalizedAddress,

      normalizedOpaRangeLocation:
        range.normalizedLocation,

      targetHouseNumber:
        target.houseNumber,

      rangeStart:
        range.rangeStart,

      rangeEnd:
        range.rangeEnd,

      targetStreetSuffix:
        target.streetSuffix,

      opaRangeStreetSuffix:
        range.streetSuffix,

      streetSuffixExact:
        streetExact,

      targetNumberNumericallyWithinRange:
        withinRange,

      targetParityCompatibleWithRange:
        parityCompatible
    };

    if (!streetExact) {
      return evaluated_(
        input,
        normalEvidence,
        summary,
        'STREET_MISMATCH',
        details
      );
    }

    if (!withinRange) {
      return evaluated_(
        input,
        normalEvidence,
        summary,
        'OUTSIDE_RANGE',
        details
      );
    }

    if (!parityCompatible) {
      return evaluated_(
        input,
        normalEvidence,
        summary,
        'PARITY_MISMATCH',
        details
      );
    }

    return evaluated_(
      input,
      normalEvidence,
      summary,
      'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE',
      details
    );
  }

  return Object.freeze({
    evaluate: evaluate
  });
})();
