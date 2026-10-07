var REOS = REOS || {};

REOS.AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint =
  (function () {
    'use strict';

    var MODE =
      'READ_ONLY_SOURCE_EVIDENCE_PRODUCTION_ENTRYPOINT';

    var PHASE =
      'absentee_owner_source_evidence_retrieval_single_record_production';

    var TABLE =
      'DISTRESS_LEADS';

    var DISTRESS_ID =
      'Distress Lead ID';

    var CANONICAL_KEY =
      'Canonical Property Key';

    var MIN_REFERENCES = 2;
    var MAX_REFERENCES = 5;

    var OBSERVATION_PREFIX =
      'pa-philadelphia|code_violations|';

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
        productionSourceRetrievalExecutionAuthorityGranted:
          false,

        sourceEvidenceRetrievalAuthorityGranted:
          false,

        productionDataMutationAuthorityGranted:
          false,

        opaAccountRowRetrievalAuthorityGranted:
          false,

        ownerEvidenceRetrievalAuthorityGranted:
          false,

        classificationAuthorityGranted:
          false,

        persistenceAuthorityGranted:
          false,

        rolloutAuthorityGranted:
          false,

        schedulerAuthorityGranted:
          false,

        triggerAuthorityGranted:
          false,

        qualifiedDealQueueAuthorityGranted:
          false,

        acquisitionLifecycleAuthorityGranted:
          false,

        arvAuthorityGranted:
          false,

        repairScopeAuthorityGranted:
          false,

        maoAuthorityGranted:
          false,

        offerAuthorityGranted:
          false
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
            'PRODUCTION_SOURCE_EVIDENCE_RETRIEVAL_FAILED',
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

    function cleanString_(value) {
      return String(
        value === null ||
        value === undefined
          ? ''
          : value
      ).trim();
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
            'identity',
            'sourceReferences'
          ]
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_OPTIONS',
            'options must contain exactly rowNumber, identity, and sourceReferences.',
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
            'identity must contain exactly Distress Lead ID and Canonical Property Key.',
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

      if (
        !Array.isArray(
          options.sourceReferences
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_SOURCE_REFERENCES',
            'sourceReferences must be an array.',
            'input'
          )
        };
      }

      if (
        options.sourceReferences.length <
          MIN_REFERENCES ||
        options.sourceReferences.length >
          MAX_REFERENCES
      ) {
        return {
          ok: false,
          result: fail_(
            'SOURCE_REFERENCE_COUNT_OUT_OF_BOUNDS',
            'sourceReferences must contain between two and five explicit references.',
            'input'
          )
        };
      }

      var seen = {};
      var references = [];

      for (
        var index = 0;
        index <
          options.sourceReferences.length;
        index++
      ) {
        var reference =
          options.sourceReferences[index];

        if (!isPlainObject_(reference)) {
          return {
            ok: false,
            result: fail_(
              'INVALID_SOURCE_REFERENCE',
              'Each source reference must be an object.',
              'input'
            )
          };
        }

        var hasPersisted =
          own_(
            reference,
            'persistedSourceObservationKey'
          );

        var expectedKeys =
          hasPersisted
            ? [
                'sourceRecordId',
                'persistedSourceObservationKey'
              ]
            : [
                'sourceRecordId'
              ];

        if (
          !exactKeys_(
            reference,
            expectedKeys
          )
        ) {
          return {
            ok: false,
            result: fail_(
              'INVALID_SOURCE_REFERENCE',
              'Each source reference may contain only sourceRecordId and optional persistedSourceObservationKey.',
              'input'
            )
          };
        }

        if (
          typeof reference.sourceRecordId !==
            'string' ||
          !/^[1-9][0-9]*$/.test(
            reference.sourceRecordId
          )
        ) {
          return {
            ok: false,
            result: fail_(
              'INVALID_SOURCE_RECORD_ID',
              'sourceRecordId must be a canonical positive-decimal string.',
              'input'
            )
          };
        }

        var sourceRecordId =
          reference.sourceRecordId;

        if (seen[sourceRecordId]) {
          return {
            ok: false,
            result: fail_(
              'DUPLICATE_SOURCE_RECORD_ID',
              'Duplicate sourceRecordId values are prohibited.',
              'input'
            )
          };
        }

        seen[sourceRecordId] = true;

        var canonicalObservationId =
          OBSERVATION_PREFIX +
          sourceRecordId;

        if (hasPersisted) {
          if (
            typeof reference
              .persistedSourceObservationKey !==
              'string'
          ) {
            return {
              ok: false,
              result: fail_(
                'INVALID_PERSISTED_SOURCE_OBSERVATION_KEY',
                'persistedSourceObservationKey must be a string when supplied.',
                'input'
              )
            };
          }

          if (
            reference
              .persistedSourceObservationKey !==
                '' &&
            reference
              .persistedSourceObservationKey !==
                canonicalObservationId
          ) {
            return {
              ok: false,
              result: fail_(
                'SOURCE_OBSERVATION_IDENTITY_MISMATCH',
                'persistedSourceObservationKey does not exactly match the canonical observation identity.',
                'input'
              )
            };
          }
        }

        var validatedReference = {
          sourceRecordId:
            sourceRecordId
        };

        if (hasPersisted) {
          validatedReference
            .persistedSourceObservationKey =
              reference
                .persistedSourceObservationKey;
        }

        references.push(
          Object.freeze(
            validatedReference
          )
        );
      }

      return {
        ok: true,

        value: Object.freeze({
          rowNumber:
            options.rowNumber,

          identity:
            Object.freeze({
              'Distress Lead ID':
                distressLeadId,

              'Canonical Property Key':
                canonicalPropertyKey
            }),

          sourceReferences:
            Object.freeze(
              references
            )
        })
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
        REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever &&
        typeof REOS
          .AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever
          .retrieve ===
          'function'
      );
    }

    function selectorAuthoritiesFalse_(
      evidence
    ) {
      return SELECTOR_AUTHORITY_FIELDS
        .every(function (field) {
          return own_(
            evidence,
            field
          ) &&
            evidence[field] ===
              false;
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

    function verifiedAddress_(
      evidence
    ) {
      var value =
        evidence.record.Address;

      if (
        typeof value !== 'string' ||
        !value ||
        value !== value.trim() ||
        /[\u0000-\u001F\u007F]/
          .test(value)
      ) {
        return {
          ok: false,
          result: fail_(
            'MISSING_VERIFIED_PROPERTY_ADDRESS',
            'Verified DISTRESS_LEADS record.Address must be a usable unmodified string.',
            'target_derivation'
          )
        };
      }

      return {
        ok: true,
        value: value
      };
    }

    function selectorFailure_(
      evidence
    ) {
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
        'Exact-record selector returned malformed or mismatched evidence.',
        'exact_record_selector'
      );
    }

    function execute(options) {
      REOS.Security.requireAdmin();

      var validated =
        validateInput_(
          options
        );

      if (!validated.ok) {
        return validated.result;
      }

      if (!dependenciesAvailable_()) {
        return fail_(
          'RUNTIME_DEPENDENCY_UNAVAILABLE',
          'Required bounded production retrieval dependency is unavailable.',
          'dependency_validation'
        );
      }

      var selectorEvidence;

      try {
        selectorEvidence =
          REOS
            .AbsenteeOwnerEnrichmentExactRecordSelector
            .exactRecordEvidence({
              rowNumber:
                validated.value.rowNumber,

              identity:
                validated.value.identity
            });
      } catch (error) {
        return fail_(
          'EXACT_RECORD_SELECTION_FAILED',
          'Exact-record selector threw before source retrieval.',
          'exact_record_selector'
        );
      }

      if (
        !selectorSuccessEligible_(
          selectorEvidence,
          validated.value
        )
      ) {
        return selectorFailure_(
          selectorEvidence
        );
      }

      var verifiedAddress =
        verifiedAddress_(
          selectorEvidence
        );

      if (!verifiedAddress.ok) {
        return verifiedAddress.result;
      }

      var target =
        Object.freeze({
          rowNumber:
            validated.value.rowNumber,

          identity:
            validated.value.identity,

          propertyAddress:
            verifiedAddress.value
        });

      var retrievalRequest =
        Object.freeze({
          target: target,

          sourceReferences:
            validated.value
              .sourceReferences
        });

      var retrieval;

      try {
        retrieval =
          REOS
            .AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever
            .retrieve(
              retrievalRequest
            );
      } catch (error) {
        return fail_(
          'SOURCE_RETRIEVAL_FAILED',
          'Bounded source-evidence retriever threw.',
          'source_retriever'
        );
      }

      if (!isPlainObject_(retrieval)) {
        return fail_(
          'INVALID_SOURCE_RETRIEVAL_RESULT',
          'Bounded source-evidence retriever returned malformed evidence.',
          'source_retriever'
        );
      }

      if (
        retrieval.ok === false &&
        own_(
          retrieval,
          'sourceObservations'
        )
      ) {
        return fail_(
          'INVALID_SOURCE_RETRIEVAL_FAILURE_EVIDENCE',
          'Failed retrieval must not expose partial source observations.',
          'source_retriever'
        );
      }

      return retrieval;
    }

    return Object.freeze({
      execute: execute
    });
  })();

function reosAbsenteeOwnerSourceEvidenceRetrieveSingleRecord(options) {
  return REOS
    .AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint
    .execute(options);
}
