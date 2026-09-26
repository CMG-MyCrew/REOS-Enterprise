var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint =
  (function () {
    'use strict';

    var MODE =
      'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION_CERTIFICATION';

    var PHASE =
      'absentee_owner_classification_single_record_read_only_certification';

    var TABLE =
      'DISTRESS_LEADS';

    var DISTRESS_ID =
      'Distress Lead ID';

    var CANONICAL_KEY =
      'Canonical Property Key';

    var SELECTOR_AUTHORITY_FIELDS =
      Object.freeze([
        'productionDataMutationAuthorityGranted',
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
        classificationPersistenceAuthorityGranted: false,
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
        offerGenerationAuthorityGranted: false,
        offerSubmissionAuthorityGranted: false,
        automaticOfferAuthorityGranted: false
      };
    }

    function attachAuthority_(result) {
      var authority =
        authority_();

      Object.keys(authority)
        .forEach(function (key) {
          result[key] =
            authority[key];
        });

      return result;
    }

    function fail_(
      code,
      message,
      stage,
      upstreamCode
    ) {
      var result =
        attachAuthority_({
          ok: false,
          mode: MODE,
          phase: PHASE,
          outcome:
            'CERTIFICATION_FAILED',
          code: code,
          message: message
        });

      if (stage) {
        result.stage =
          stage;
      }

      if (upstreamCode) {
        result.upstreamCode =
          upstreamCode;
      }

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

      var allowed =
        expected
          .slice()
          .sort();

      if (
        actual.length !==
        allowed.length
      ) {
        return false;
      }

      return actual.every(
        function (key, index) {
          return key ===
            allowed[index];
        }
      );
    }

    function validRowNumber_(value) {
      return typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value &&
        value >= 2;
    }

    function validateInput_(options) {
      if (
        !isPlainObject_(options) ||
        !exactKeys_(
          options,
          [
            'rowNumber',
            'identity'
          ]
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_OPTIONS',
            'options must contain exactly rowNumber and identity.',
            'input'
          )
        };
      }

      if (
        !validRowNumber_(
          options.rowNumber
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_ROW_NUMBER',
            'rowNumber must be a finite integer data-row number.',
            'input'
          )
        };
      }

      if (
        !isPlainObject_(
          options.identity
        ) ||
        !exactKeys_(
          options.identity,
          [
            DISTRESS_ID,
            CANONICAL_KEY
          ]
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_IDENTITY',
            'identity must contain exactly persisted Distress Lead ID and Canonical Property Key.',
            'input'
          )
        };
      }

      var distressLeadId =
        cleanString_(
          options
            .identity[DISTRESS_ID]
        );

      var canonicalPropertyKey =
        cleanString_(
          options
            .identity[CANONICAL_KEY]
        );

      if (!distressLeadId) {
        return {
          ok: false,
          result: fail_(
            'MISSING_DISTRESS_LEAD_ID',
            'Persisted Distress Lead ID is required.',
            'input'
          )
        };
      }

      if (!canonicalPropertyKey) {
        return {
          ok: false,
          result: fail_(
            'MISSING_CANONICAL_PROPERTY_KEY',
            'Persisted Canonical Property Key is required.',
            'input'
          )
        };
      }

      return {
        ok: true,
        value: {
          rowNumber:
            options.rowNumber,
          identity: {
            'Distress Lead ID':
              distressLeadId,
            'Canonical Property Key':
              canonicalPropertyKey
          }
        }
      };
    }

    function dependenciesAvailable_() {
      return !!(
        REOS &&
        REOS.Security &&
        typeof REOS.Security.requireAdmin ===
          'function' &&
        REOS.AbsenteeOwnerEnrichmentExactRecordSelector &&
        typeof REOS
          .AbsenteeOwnerEnrichmentExactRecordSelector
          .exactRecordEvidence ===
          'function' &&
        REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup &&
        typeof REOS
          .AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup
          .lookup ===
          'function' &&
        REOS.AbsenteeOwnerOwnerEvidenceComparison &&
        typeof REOS
          .AbsenteeOwnerOwnerEvidenceComparison
          .compare ===
          'function' &&
        REOS.AbsenteeOwnerClassification &&
        typeof REOS
          .AbsenteeOwnerClassification
          .classify ===
          'function'
      );
    }

    function selectorAuthoritiesFalse_(evidence) {
      return SELECTOR_AUTHORITY_FIELDS
        .every(function (field) {
          return own_(evidence, field) &&
            evidence[field] === false;
        });
    }

    function selectorSuccessEligible_(
      evidence,
      requested
    ) {
      if (
        !isPlainObject_(evidence) ||
        evidence.ok !== true ||
        evidence.mode !== 'READ_ONLY' ||
        evidence.phase !==
          'absentee_owner_exact_record_evidence'
      ) {
        return false;
      }

      if (
        !isPlainObject_(
          evidence.target
        ) ||
        evidence.target.table !==
          TABLE ||
        evidence.target.rowNumber !==
          requested.rowNumber
      ) {
        return false;
      }

      if (
        !isPlainObject_(
          evidence.identity
        ) ||
        cleanString_(
          evidence
            .identity[DISTRESS_ID]
        ) !==
          requested
            .identity[DISTRESS_ID] ||
        cleanString_(
          evidence
            .identity[CANONICAL_KEY]
        ) !==
          requested
            .identity[CANONICAL_KEY]
      ) {
        return false;
      }

      if (
        !isPlainObject_(
          evidence.record
        )
      ) {
        return false;
      }

      return selectorAuthoritiesFalse_(
        evidence
      );
    }

    function selectorFailure_(evidence) {
      if (
        isPlainObject_(evidence) &&
        evidence.ok === false
      ) {
        return fail_(
          'EXACT_RECORD_SELECTION_FAILED',
          'Exact-record verification failed.',
          'exact_record_selector',
          cleanString_(
            evidence.code
          )
        );
      }

      return fail_(
        'INVALID_EXACT_RECORD_EVIDENCE',
        'Exact-record selector returned malformed evidence.',
        'exact_record_selector'
      );
    }

    function lookupRequest_(
      selectorEvidence
    ) {
      var record =
        selectorEvidence.record;

      var propertyAddress =
        cleanString_(
          record.Address
        );

      var city =
        cleanString_(
          record.City
        );

      var state =
        cleanString_(
          record.State
        );

      var zip =
        cleanString_(
          record.Zip
        );

      if (!propertyAddress) {
        return {
          ok: false,
          result: fail_(
            'MISSING_VERIFIED_PROPERTY_ADDRESS',
            'Verified DISTRESS_LEADS Address is required.',
            'lookup_request_derivation'
          )
        };
      }

      if (!city) {
        return {
          ok: false,
          result: fail_(
            'MISSING_VERIFIED_CITY',
            'Verified DISTRESS_LEADS City is required.',
            'lookup_request_derivation'
          )
        };
      }

      if (!state) {
        return {
          ok: false,
          result: fail_(
            'MISSING_VERIFIED_STATE',
            'Verified DISTRESS_LEADS State is required.',
            'lookup_request_derivation'
          )
        };
      }

      var request = {
        rowNumber:
          selectorEvidence
            .target
            .rowNumber,

        identity: {
          'Distress Lead ID':
            selectorEvidence
              .identity[DISTRESS_ID],

          'Canonical Property Key':
            selectorEvidence
              .identity[CANONICAL_KEY]
        },

        propertyAddress:
          propertyAddress,

        city:
          city,

        state:
          state
      };

      if (zip) {
        request.zip =
          zip;
      }

      return {
        ok: true,
        value: request
      };
    }

    function certifySingleRecord(options) {
      REOS.Security.requireAdmin();

      var validated =
        validateInput_(options);

      if (!validated.ok) {
        return validated.result;
      }

      if (!dependenciesAvailable_()) {
        return fail_(
          'RUNTIME_DEPENDENCY_UNAVAILABLE',
          'Certified absentee-owner classification dependency is unavailable.',
          'dependency_validation'
        );
      }

      var selectorEvidence =
        REOS
          .AbsenteeOwnerEnrichmentExactRecordSelector
          .exactRecordEvidence(
            validated.value
          );

      if (
        !isPlainObject_(
          selectorEvidence
        ) ||
        selectorEvidence.ok !== true
      ) {
        return selectorFailure_(
          selectorEvidence
        );
      }

      if (
        !selectorSuccessEligible_(
          selectorEvidence,
          validated.value
        )
      ) {
        return fail_(
          'INVALID_EXACT_RECORD_EVIDENCE',
          'Exact-record selector returned malformed or mismatched success evidence.',
          'exact_record_selector'
        );
      }

      var lookupRequest =
        lookupRequest_(
          selectorEvidence
        );

      if (!lookupRequest.ok) {
        return lookupRequest.result;
      }

      var ownerEvidence =
        REOS
          .AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup
          .lookup(
            lookupRequest.value
          );

      var comparisonEvidence =
        REOS
          .AbsenteeOwnerOwnerEvidenceComparison
          .compare(
            ownerEvidence
          );

      return REOS
        .AbsenteeOwnerClassification
        .classify(
          comparisonEvidence
        );
    }

    return Object.freeze({
      certifySingleRecord:
        certifySingleRecord
    });
  })();

function reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord(
  options
) {
  return REOS
    .AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint
    .certifySingleRecord(
      options
    );
}
