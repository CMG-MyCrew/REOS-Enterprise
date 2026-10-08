var REOS = REOS || {};

REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint =
  (function () {
    'use strict';

    var MODE =
      'READ_ONLY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT';

    var PHASE =
      'absentee_owner_certified_property_source_identity_owner_evidence_single_record_production';

    var UPSTREAM_MODE =
      'READ_ONLY_OWNER_EVIDENCE';

    var UPSTREAM_PHASE =
      'absentee_owner_certified_property_source_identity_owner_evidence_lookup';

    var UPSTREAM_OUTCOMES =
      Object.freeze([
        'MATCHED',
        'NO_MATCH',
        'AMBIGUOUS',
        'FAILED'
      ]);

    var UPSTREAM_AUTHORITY_FIELDS =
      Object.freeze([
        'productionDataMutationAuthorityGranted',
        'ownerEvidencePersistenceAuthorityGranted',
        'classificationAuthorityGranted',
        'absenteeClassificationAuthorityGranted',
        'classificationPersistenceAuthorityGranted',
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
        'arvAuthorityGranted',
        'repairScopeAuthorityGranted',
        'maoAuthorityGranted',
        'offerAuthorityGranted',
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

        arvAuthorityGranted:
          false,

        repairScopeAuthorityGranted:
          false,

        maoAuthorityGranted:
          false,

        offerAuthorityGranted:
          false,

        automaticOfferAuthorityGranted:
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
            'PRODUCTION_OWNER_EVIDENCE_RETRIEVAL_FAILED',
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

    function validateInput_(options) {
      if (
        !isPlainObject_(options) ||
        !exactKeys_(
          options,
          [
            'propertySourceIdentityCertification',
            'normalLookupEvidence'
          ]
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_OPTIONS',
            'options must contain exactly propertySourceIdentityCertification and normalLookupEvidence.',
            'input'
          )
        };
      }

      if (
        !isPlainObject_(
          options
            .propertySourceIdentityCertification
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
            'propertySourceIdentityCertification must be an object.',
            'input'
          )
        };
      }

      if (
        !isPlainObject_(
          options.normalLookupEvidence
        )
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_NORMAL_LOOKUP_EVIDENCE',
            'normalLookupEvidence must be an object.',
            'input'
          )
        };
      }

      return {
        ok: true,

        value:
          Object.freeze({
            propertySourceIdentityCertification:
              options
                .propertySourceIdentityCertification,

            normalLookupEvidence:
              options
                .normalLookupEvidence
          })
      };
    }

    function dependenciesAvailable_() {
      return !!(
        REOS &&
        REOS
          .AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup &&
        typeof REOS
          .AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup
          .lookup ===
          'function'
      );
    }

    function upstreamAuthoritiesFalse_(
      result
    ) {
      return UPSTREAM_AUTHORITY_FIELDS
        .every(function (field) {
          return own_(
            result,
            field
          ) &&
            result[field] ===
              false;
        });
    }

    function noTrueAuthority_(result) {
      return Object.keys(result)
        .every(function (key) {
          if (
            !/AuthorityGranted$/
              .test(key)
          ) {
            return true;
          }

          return result[key] ===
            false;
        });
    }

    function eligibleUpstreamResult_(
      result
    ) {
      if (
        !isPlainObject_(result) ||
        (
          result.ok !== true &&
          result.ok !== false
        ) ||
        result.mode !==
          UPSTREAM_MODE ||
        result.phase !==
          UPSTREAM_PHASE ||
        UPSTREAM_OUTCOMES
          .indexOf(
            result.outcome
          ) === -1
      ) {
        return false;
      }

      if (
        result.ok === true &&
        result.outcome ===
          'FAILED'
      ) {
        return false;
      }

      if (
        result.ok === false &&
        result.outcome !==
          'FAILED'
      ) {
        return false;
      }

      return (
        upstreamAuthoritiesFalse_(
          result
        ) &&
        noTrueAuthority_(
          result
        )
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
          'Certified owner-evidence lookup dependency is unavailable.',
          'dependency_validation'
        );
      }

      var result;

      try {
        result =
          REOS
            .AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup
            .lookup(
              validated.value
            );
      } catch (error) {
        return fail_(
          'OWNER_EVIDENCE_LOOKUP_FAILED',
          'Certified owner-evidence lookup threw.',
          'owner_evidence_lookup'
        );
      }

      if (
        !eligibleUpstreamResult_(
          result
        )
      ) {
        return fail_(
          'INVALID_OWNER_EVIDENCE_LOOKUP_RESULT',
          'Certified owner-evidence lookup returned ineligible evidence.',
          'owner_evidence_lookup',
          (
            isPlainObject_(result) &&
            own_(
              result,
              'code'
            )
          )
            ? String(result.code)
            : ''
        );
      }

      return result;
    }

    return Object.freeze({
      execute: execute
    });
  })();

function reosAbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceRetrieveSingleRecord(
  options
) {
  return REOS
    .AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint
    .execute(options);
}
