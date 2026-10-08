var REOS = REOS || {};

REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification = (function () {
  'use strict';

  var MODE =
    'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION';

  var PHASE =
    'absentee_owner_opa_account_range_property_source_identity_certification';

  var SUCCESS =
    'PROPERTY_SOURCE_IDENTITY_CERTIFIED';

  var BASIS =
    'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT';

  var DISTRESS_ID =
    'Distress Lead ID';

  var CANONICAL_KEY =
    'Canonical Property Key';

  var OPA_AGENCY =
    'Philadelphia Office of Property Assessment';

  var OPA_DATASET =
    'Philadelphia Properties and Assessment History';

  var OPA_TABLE =
    'opa_properties_public';

  var OPA_ENDPOINT =
    'https://phl.carto.com/api/v2/sql';

  var SELECTOR_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ]);

  var LOOKUP_AUTHORITY_FIELDS = Object.freeze([
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

  var EVALUATOR_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'sourceEvidenceRetrievalAuthorityGranted',
    'ownerEvidenceRetrievalAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'classificationAuthorityGranted',
    'absenteeClassificationAuthorityGranted',
    'classificationPersistenceAuthorityGranted',
    'rolloutAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'ownerOccupancyAuthorityGranted',
    'vacancyAuthorityGranted',
    'qualifiedDealQueueAuthorityGranted',
    'acquisitionLifecycleAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ]);

  function authority_() {
    return {
      productionDataMutationAuthorityGranted: false,
      sourceEvidenceRetrievalAuthorityGranted: false,
      ownerEvidenceRetrievalAuthorityGranted: false,
      ownerEvidencePersistenceAuthorityGranted: false,
      classificationAuthorityGranted: false,
      absenteeClassificationAuthorityGranted: false,
      classificationPersistenceAuthorityGranted: false,
      rolloutAuthorityGranted: false,
      canonicalIdentityRepairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      triggerAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      certificationMutationAuthorityGranted: false,
      ownerOccupancyAuthorityGranted: false,
      vacancyAuthorityGranted: false,
      qualifiedDealQueueAuthorityGranted: false,
      acquisitionLifecycleAuthorityGranted: false,
      arvAuthorityGranted: false,
      repairScopeAuthorityGranted: false,
      maoAuthorityGranted: false,
      offerAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
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

  function isPlainObject_(value) {
    return !!value &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function own_(object, key) {
    return Object.prototype
      .hasOwnProperty
      .call(
        object,
        key
      );
  }

  function cleanString_(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();
  }

  function normalizeAddress_(value) {
    return cleanString_(value)
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function exactKeys_(
    object,
    expected
  ) {
    if (!isPlainObject_(object)) {
      return false;
    }

    var actual =
      Object.keys(object)
        .slice()
        .sort();

    var wanted =
      expected
        .slice()
        .sort();

    return (
      actual.length === wanted.length &&
      actual.every(
        function (key, index) {
          return key === wanted[index];
        }
      )
    );
  }

  function finiteInteger_(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value;
  }

  function allFalse_(
    object,
    fields
  ) {
    return isPlainObject_(object) &&
      fields.every(
        function (field) {
          return own_(object, field) &&
            object[field] === false;
        }
      );
  }

  function noTrueAuthority_(object) {
    return isPlainObject_(object) &&
      Object.keys(object).every(
        function (key) {
          return !/AuthorityGranted$/.test(
            key
          ) ||
            object[key] === false;
        }
      );
  }

  function fail_(
    outcome,
    reason
  ) {
    return attachAuthority_({
      ok: false,
      mode: MODE,
      phase: PHASE,
      outcome: outcome,
      reason: reason,

      propertySourceIdentityCertified:
        false,

      rangeContainmentDiagnosticCandidate:
        false,

      rangeContainmentCertifiedMatch:
        false
    });
  }

  function exactRecordSummary_(evidence) {
    if (
      !isPlainObject_(evidence) ||
      evidence.ok !== true ||
      evidence.mode !== 'READ_ONLY' ||
      evidence.phase !==
        'absentee_owner_exact_record_evidence' ||
      !isPlainObject_(evidence.target) ||
      evidence.target.table !==
        'DISTRESS_LEADS' ||
      !finiteInteger_(
        evidence.target.rowNumber
      ) ||
      evidence.target.rowNumber <= 1 ||
      !isPlainObject_(evidence.identity) ||
      !isPlainObject_(evidence.record) ||
      !allFalse_(
        evidence,
        SELECTOR_AUTHORITY_FIELDS
      ) ||
      !noTrueAuthority_(evidence)
    ) {
      return null;
    }

    var distressLeadId =
      cleanString_(
        evidence.identity[DISTRESS_ID]
      );

    var canonicalPropertyKey =
      cleanString_(
        evidence.identity[CANONICAL_KEY]
      );

    var address =
      cleanString_(
        evidence.record.Address
      );

    var parcelId =
      cleanString_(
        evidence.record['Parcel ID']
      );

    if (
      !distressLeadId ||
      !canonicalPropertyKey ||
      !address ||
      !parcelId
    ) {
      return null;
    }

    return {
      rowNumber:
        evidence.target.rowNumber,

      distressLeadId:
        distressLeadId,

      canonicalPropertyKey:
        canonicalPropertyKey,

      address:
        address,

      normalizedAddress:
        normalizeAddress_(address),

      parcelId:
        parcelId
    };
  }

  function normalLookupSummary_(evidence) {
    if (
      !isPlainObject_(evidence) ||
      evidence.ok !== true ||
      evidence.mode !==
        'READ_ONLY_OWNER_EVIDENCE' ||
      evidence.phase !==
        'absentee_owner_philadelphia_owner_evidence_lookup' ||
      evidence.outcome !== 'NO_MATCH' ||
      evidence.boundedSourceRowCount !== 0 ||
      !isPlainObject_(evidence.target) ||
      !finiteInteger_(
        evidence.target.rowNumber
      ) ||
      !isPlainObject_(
        evidence.target.identity
      ) ||
      !isPlainObject_(evidence.source) ||
      evidence.source.agency !==
        OPA_AGENCY ||
      evidence.source.dataset !==
        OPA_DATASET ||
      evidence.source.table !==
        OPA_TABLE ||
      evidence.source.endpoint !==
        OPA_ENDPOINT ||
      evidence.source.lookupQueryMode !==
        'exact_property_address' ||
      !allFalse_(
        evidence,
        LOOKUP_AUTHORITY_FIELDS
      ) ||
      !noTrueAuthority_(evidence)
    ) {
      return null;
    }

    var distressLeadId =
      cleanString_(
        evidence
          .target
          .identity[DISTRESS_ID]
      );

    var canonicalPropertyKey =
      cleanString_(
        evidence
          .target
          .identity[CANONICAL_KEY]
      );

    var propertyAddress =
      cleanString_(
        evidence
          .target
          .propertyAddress
      );

    if (
      !distressLeadId ||
      !canonicalPropertyKey ||
      !propertyAddress
    ) {
      return null;
    }

    return {
      rowNumber:
        evidence.target.rowNumber,

      distressLeadId:
        distressLeadId,

      canonicalPropertyKey:
        canonicalPropertyKey,

      propertyAddress:
        propertyAddress,

      normalizedAddress:
        normalizeAddress_(
          propertyAddress
        )
    };
  }

  function sourceSummary_(
    observations,
    normalizedTargetAddress
  ) {
    if (
      !Array.isArray(observations) ||
      observations.length < 2 ||
      observations.length > 5
    ) {
      return {
        ok: false,
        outcome:
          'SOURCE_CORROBORATION_INSUFFICIENT',
        reason:
          'Source observations must contain between two and five records.'
      };
    }

    var ids = {};
    var orderedIds = [];

    var parcel = '';
    var account = '';

    for (
      var index = 0;
      index < observations.length;
      index++
    ) {
      var observation =
        observations[index];

      if (
        !exactKeys_(
          observation,
          [
            'sourceObservationId',
            'propertyAddress',
            'parcel_id_num',
            'opa_account_num'
          ]
        )
      ) {
        return {
          ok: false,
          outcome:
            'SOURCE_CORROBORATION_INSUFFICIENT',
          reason:
            'Each source observation must contain exactly the bounded source fields.'
        };
      }

      var observationId =
        cleanString_(
          observation.sourceObservationId
        );

      var normalizedAddress =
        normalizeAddress_(
          observation.propertyAddress
        );

      var currentParcel =
        cleanString_(
          observation.parcel_id_num
        );

      var currentAccount =
        cleanString_(
          observation.opa_account_num
        );

      if (
        !observationId ||
        !normalizedAddress ||
        !currentParcel ||
        !currentAccount
      ) {
        return {
          ok: false,
          outcome:
            'SOURCE_CORROBORATION_INSUFFICIENT',
          reason:
            'A required bounded source field is blank.'
        };
      }

      if (
        own_(
          ids,
          observationId
        )
      ) {
        return {
          ok: false,
          outcome:
            'SOURCE_OBSERVATION_IDENTITY_DUPLICATE',
          reason:
            'Source observation identity must be distinct.'
        };
      }

      ids[observationId] = true;

      orderedIds.push(
        observationId
      );

      if (
        normalizedAddress !==
        normalizedTargetAddress
      ) {
        return {
          ok: false,
          outcome:
            'SOURCE_ADDRESS_DISAGREEMENT',
          reason:
            'Source address does not equal the verified target after superficial normalization.'
        };
      }

      if (index === 0) {
        parcel =
          currentParcel;

        account =
          currentAccount;
      } else {
        if (
          currentParcel !== parcel
        ) {
          return {
            ok: false,
            outcome:
              'SOURCE_PARCEL_DISAGREEMENT',
            reason:
              'Source observations disagree on parcel_id_num.'
          };
        }

        if (
          currentAccount !== account
        ) {
          return {
            ok: false,
            outcome:
              'SOURCE_OPA_ACCOUNT_DISAGREEMENT',
            reason:
              'Source observations disagree on opa_account_num.'
          };
        }
      }
    }

    if (
      !/^\d{9}$/.test(account)
    ) {
      return {
        ok: false,
        outcome:
          'SOURCE_OPA_ACCOUNT_INVALID',
        reason:
          'Source opa_account_num must be exactly nine digits.'
      };
    }

    return {
      ok: true,

      observationIds:
        orderedIds,

      parcelIdNum:
        parcel,

      opaAccountNum:
        account
    };
  }

  function evaluatorEligible_(result) {
    return (
      isPlainObject_(result) &&
      result.ok === true &&
      result.mode ===
        'READ_ONLY_OPA_ACCOUNT_RANGE_EVIDENCE_EVALUATION' &&
      result.phase ===
        'absentee_owner_opa_account_range_evidence_evaluation' &&
      result.outcome ===
        'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE' &&
      result
        .rangeContainmentDiagnosticCandidate ===
        true &&
      result
        .rangeContainmentCertifiedMatch ===
        false &&
      result.streetSuffixExact === true &&
      result
        .targetNumberNumericallyWithinRange ===
        true &&
      result
        .targetParityCompatibleWithRange ===
        true &&
      allFalse_(
        result,
        EVALUATOR_AUTHORITY_FIELDS
      ) &&
      noTrueAuthority_(result)
    );
  }

  function certify(options) {
    if (
      !exactKeys_(
        options,
        [
          'exactRecordEvidence',
          'normalLookupEvidence',
          'sourceObservations',
          'opaAccountRows'
        ]
      )
    ) {
      return fail_(
        'INELIGIBLE_EXACT_RECORD_EVIDENCE',
        'Input envelope must contain exactly the four authorized evidence fields.'
      );
    }

    var exact =
      exactRecordSummary_(
        options.exactRecordEvidence
      );

    if (!exact) {
      return fail_(
        'INELIGIBLE_EXACT_RECORD_EVIDENCE',
        'Exact-record evidence is not eligible.'
      );
    }

    var normal =
      normalLookupSummary_(
        options.normalLookupEvidence
      );

    if (!normal) {
      return fail_(
        'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE',
        'Normal owner lookup evidence is not eligible.'
      );
    }

    if (
      exact.rowNumber !==
        normal.rowNumber ||
      exact.distressLeadId !==
        normal.distressLeadId ||
      exact.canonicalPropertyKey !==
        normal.canonicalPropertyKey
    ) {
      return fail_(
        'TARGET_IDENTITY_MISMATCH',
        'Exact-record and normal-lookup target identity must match.'
      );
    }

    if (
      exact.normalizedAddress !==
      normal.normalizedAddress
    ) {
      return fail_(
        'TARGET_ADDRESS_MISMATCH',
        'Normal lookup address must equal the verified record address after superficial normalization.'
      );
    }

    var source =
      sourceSummary_(
        options.sourceObservations,
        exact.normalizedAddress
      );

    if (!source.ok) {
      return fail_(
        source.outcome,
        source.reason
      );
    }

    if (
      source.parcelIdNum !==
      exact.parcelId
    ) {
      return fail_(
        'SOURCE_PARCEL_TARGET_MISMATCH',
        'Source parcel_id_num must exactly equal the persisted REOS Parcel ID.'
      );
    }

    if (
      !Array.isArray(
        options.opaAccountRows
      ) ||
      options.opaAccountRows.length === 0
    ) {
      return fail_(
        'OPA_ACCOUNT_NO_MATCH',
        'Derived source OPA account did not resolve to a property row.'
      );
    }

    if (
      options.opaAccountRows.length !== 1
    ) {
      return fail_(
        'OPA_ACCOUNT_AMBIGUOUS',
        'Derived source OPA account must resolve to exactly one property row.'
      );
    }

    var row =
      options.opaAccountRows[0];

    if (
      !exactKeys_(
        row,
        [
          'parcel_number',
          'location'
        ]
      )
    ) {
      return fail_(
        'OPA_ACCOUNT_IDENTIFIER_MISMATCH',
        'OPA property row must contain exactly parcel_number and location.'
      );
    }

    var opaParcelNumber =
      cleanString_(
        row.parcel_number
      );

    var opaLocation =
      cleanString_(
        row.location
      );

    if (
      !opaParcelNumber ||
      !opaLocation ||
      opaParcelNumber !==
        source.opaAccountNum
    ) {
      return fail_(
        'OPA_ACCOUNT_IDENTIFIER_MISMATCH',
        'OPA parcel_number must exactly equal the derived source OPA account.'
      );
    }

    if (
      !REOS
        .AbsenteeOwnerOpaAccountRangeEvidenceEvaluator ||
      typeof REOS
        .AbsenteeOwnerOpaAccountRangeEvidenceEvaluator
        .evaluate !== 'function'
    ) {
      return fail_(
        'RANGE_DIAGNOSTIC_INELIGIBLE',
        'Certified range evaluator dependency is unavailable.'
      );
    }

    var rangeResult =
      REOS
        .AbsenteeOwnerOpaAccountRangeEvidenceEvaluator
        .evaluate({
          normalLookupEvidence:
            options.normalLookupEvidence,

          sourceObservations:
            options.sourceObservations,

          opaAccountRows:
            options.opaAccountRows
        });

    if (
      !evaluatorEligible_(
        rangeResult
      )
    ) {
      return fail_(
        'RANGE_DIAGNOSTIC_INELIGIBLE',
        'Existing range evaluator did not return an authority-free diagnostic candidate.'
      );
    }

    return attachAuthority_({
      ok: true,
      mode: MODE,
      phase: PHASE,
      outcome: SUCCESS,
      certificationBasis:
        BASIS,

      target: {
        table:
          'DISTRESS_LEADS',

        rowNumber:
          exact.rowNumber,

        identity: {
          'Distress Lead ID':
            exact.distressLeadId,

          'Canonical Property Key':
            exact.canonicalPropertyKey
        }
      },

      normalizedVerifiedTargetAddress:
        exact.normalizedAddress,

      persistedParcelId:
        exact.parcelId,

      corroboratingSourceObservationCount:
        source
          .observationIds
          .length,

      corroboratingSourceObservationIds:
        source
          .observationIds
          .slice(),

      sourceParcelIdNum:
        source.parcelIdNum,

      sourceOpaAccountNum:
        source.opaAccountNum,

      opaParcelNumber:
        opaParcelNumber,

      opaLocation:
        opaLocation,

      normalizedOpaRangeLocation:
        rangeResult
          .normalizedOpaRangeLocation,

      targetHouseNumber:
        rangeResult
          .targetHouseNumber,

      rangeStart:
        rangeResult
          .rangeStart,

      rangeEnd:
        rangeResult
          .rangeEnd,

      targetStreetSuffix:
        rangeResult
          .targetStreetSuffix,

      opaRangeStreetSuffix:
        rangeResult
          .opaRangeStreetSuffix,

      streetSuffixExact:
        rangeResult
          .streetSuffixExact,

      targetNumberNumericallyWithinRange:
        rangeResult
          .targetNumberNumericallyWithinRange,

      targetParityCompatibleWithRange:
        rangeResult
          .targetParityCompatibleWithRange,

      propertySourceIdentityCertified:
        true,

      rangeContainmentDiagnosticCandidate:
        true,

      rangeContainmentCertifiedMatch:
        false
    });
  }

  return Object.freeze({
    certify: certify
  });
})();
