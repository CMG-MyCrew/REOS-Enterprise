var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2 =
  (function () {
    'use strict';

    var MODE =
      'MANUAL_BOUNDED_ADMIN_ONLY';

    var PHASE =
      'absentee_owner_classification_persistence_certified_property_source_provenance_bounded_rollout_production_invocation_v2';

    var COMPLETED =
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_COMPLETED';

    var PRECONDITION =
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_PRECONDITION_FAILED';

    var UNCERTAIN =
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_OUTCOME_UNCERTAIN';

    var INVOCATION_PRECONDITION =
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_INVOCATION_V2_PRECONDITION_FAILED';

    var INVOCATION_UNCERTAIN =
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_INVOCATION_V2_OUTCOME_UNCERTAIN';

    var MAX_EVIDENCE_BUNDLES = 10;

    var INPUT_FIELDS =
      Object.freeze([
        'propertySourceIdentityCertification',
        'normalLookupEvidence',
        'ownerEvidenceResult',
        'comparisonResult',
        'classificationResult'
      ]);

    var AUTHORITY_FIELDS =
      Object.freeze([
        'productionDataMutationAuthorityGranted',
        'sourceEvidenceRetrievalAuthorityGranted',
        'ownerEvidenceRetrievalAuthorityGranted',
        'ownerEvidencePersistenceAuthorityGranted',
        'propertySourceIdentityCertificationAuthorityGranted',
        'classificationAuthorityGranted',
        'absenteeClassificationAuthorityGranted',
        'classificationPersistenceAuthorityGranted',
        'canonicalIdentityRepairAuthorityGranted',
        'migrationAuthorityGranted',
        'schedulerAuthorityGranted',
        'triggerAuthorityGranted',
        'connectorExecutionAuthorityGranted',
        'publicProductionRpcAuthorityGranted',
        'boundedRolloutProductionAuthorityGranted',
        'ownerOccupancyAuthorityGranted',
        'vacancyAuthorityGranted',
        'qualifiedDealQueueAuthorityGranted',
        'acquisitionLifecycleAuthorityGranted',
        'arvAuthorityGranted',
        'repairScopeAuthorityGranted',
        'maoAuthorityGranted',
        'offerGenerationAuthorityGranted',
        'offerSubmissionAuthorityGranted',
        'automaticOfferAuthorityGranted'
      ]);

    function own_(object, key) {
      return Object.prototype
        .hasOwnProperty
        .call(
          object,
          key
        );
    }

    function isPlainObject_(value) {
      if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value)
      ) {
        return false;
      }

      var prototype =
        Object.getPrototypeOf(value);

      return (
        prototype === Object.prototype ||
        prototype === null ||
        Object.prototype
          .toString
          .call(value) ===
            '[object Object]'
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

      return (
        actual.length === allowed.length &&
        actual.every(function (
          key,
          index
        ) {
          return key ===
            allowed[index];
        })
      );
    }

    function finiteInteger_(value) {
      return (
        typeof value === 'number' &&
        isFinite(value) &&
        Math.floor(value) === value
      );
    }

    function nonblank_(value) {
      return (
        typeof value === 'string' &&
        value.trim() !== ''
      );
    }

    function authority_() {
      return {
        productionDataMutationAuthorityGranted: false,
        sourceEvidenceRetrievalAuthorityGranted: false,
        ownerEvidenceRetrievalAuthorityGranted: false,
        ownerEvidencePersistenceAuthorityGranted: false,
        propertySourceIdentityCertificationAuthorityGranted: false,
        classificationAuthorityGranted: false,
        absenteeClassificationAuthorityGranted: false,
        classificationPersistenceAuthorityGranted: false,
        canonicalIdentityRepairAuthorityGranted: false,
        migrationAuthorityGranted: false,
        schedulerAuthorityGranted: false,
        triggerAuthorityGranted: false,
        connectorExecutionAuthorityGranted: false,
        publicProductionRpcAuthorityGranted: false,
        boundedRolloutProductionAuthorityGranted: false,
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
        .forEach(function (field) {
          result[field] =
            authority[field];
        });

      return result;
    }

    function fail_(
      outcome,
      code,
      message,
      stage
    ) {
      var result =
        attachAuthority_({
          ok: false,
          mode: MODE,
          phase: PHASE,
          outcome: outcome,
          code: code,
          message: message
        });

      if (stage) {
        result.stage =
          stage;
      }

      return result;
    }

    function validateInput_(options) {
      if (
        !exactKeys_(
          options,
          [
            'evidenceBundles'
          ]
        ) ||
        !Array.isArray(
          options.evidenceBundles
        )
      ) {
        return {
          ok: false,
          result: fail_(
            INVOCATION_PRECONDITION,
            'INVALID_OPTIONS',
            'options must contain exactly evidenceBundles.',
            'input'
          )
        };
      }

      if (
        options.evidenceBundles.length < 1 ||
        options.evidenceBundles.length >
          MAX_EVIDENCE_BUNDLES
      ) {
        return {
          ok: false,
          result: fail_(
            INVOCATION_PRECONDITION,
            'INVALID_EVIDENCE_BUNDLE_COUNT',
            'evidenceBundles must contain between 1 and 10 bundles.',
            'input'
          )
        };
      }

      for (
        var index = 0;
        index <
          options.evidenceBundles.length;
        index++
      ) {
        var bundle =
          options.evidenceBundles[index];

        if (
          !exactKeys_(
            bundle,
            INPUT_FIELDS
          )
        ) {
          return {
            ok: false,
            result: fail_(
              INVOCATION_PRECONDITION,
              'INVALID_EVIDENCE_BUNDLE',
              'Every evidence bundle must contain exactly the five certified artifacts.',
              'input'
            )
          };
        }

        for (
          var fieldIndex = 0;
          fieldIndex <
            INPUT_FIELDS.length;
          fieldIndex++
        ) {
          var field =
            INPUT_FIELDS[fieldIndex];

          if (
            !isPlainObject_(
              bundle[field]
            )
          ) {
            return {
              ok: false,
              result: fail_(
                INVOCATION_PRECONDITION,
                'INVALID_EVIDENCE_ARTIFACT',
                'Every certified evidence artifact must be an object.',
                'input'
              )
            };
          }
        }
      }

      return {
        ok: true
      };
    }

    function dependenciesAvailable_() {
      return !!(
        REOS &&
        REOS
          .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2 &&
        typeof REOS
          .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2
          .run ===
          'function'
      );
    }

    function authoritiesFalse_(result) {
      return AUTHORITY_FIELDS
        .every(function (field) {
          return (
            own_(
              result,
              field
            ) &&
            result[field] ===
              false
          );
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

    function eligibleBundleResult_(
      result,
      requested
    ) {
      return !!(
        isPlainObject_(result) &&
        finiteInteger_(result.index) &&
        result.index >= 0 &&
        result.index < requested &&
        isPlainObject_(
          result.targetIdentity
        ) &&
        nonblank_(
          result.persistenceOutcome
        )
      );
    }

    function eligibleOrchestratorResult_(
      result,
      requested
    ) {
      if (
        !isPlainObject_(result) ||
        (
          result.ok !== true &&
          result.ok !== false
        ) ||
        [
          COMPLETED,
          PRECONDITION,
          UNCERTAIN
        ].indexOf(
          result.outcome
        ) === -1 ||
        result.requestedBundleCount !==
          requested ||
        !finiteInteger_(
          result.preflightedBundleCount
        ) ||
        !finiteInteger_(
          result.processedBundleCount
        ) ||
        !finiteInteger_(
          result.verifiedPersistenceCount
        ) ||
        !finiteInteger_(
          result.alreadyPersistedCount
        ) ||
        result.preflightedBundleCount < 0 ||
        result.preflightedBundleCount >
          requested ||
        result.processedBundleCount < 0 ||
        result.processedBundleCount >
          requested ||
        result.verifiedPersistenceCount < 0 ||
        result.alreadyPersistedCount < 0 ||
        (
          result.verifiedPersistenceCount +
          result.alreadyPersistedCount
        ) >
          result.processedBundleCount ||
        typeof result.halted !==
          'boolean' ||
        !Array.isArray(
          result.bundleResults
        ) ||
        result.bundleResults.length !==
          result.processedBundleCount ||
        !authoritiesFalse_(
          result
        ) ||
        !noTrueAuthority_(
          result
        )
      ) {
        return false;
      }

      for (
        var index = 0;
        index <
          result.bundleResults.length;
        index++
      ) {
        if (
          !eligibleBundleResult_(
            result.bundleResults[index],
            requested
          )
        ) {
          return false;
        }
      }

      if (
        result.outcome ===
          COMPLETED
      ) {
        return (
          result.ok === true &&
          result.halted === false &&
          result.processedBundleCount ===
            requested &&
          (
            result.verifiedPersistenceCount +
            result.alreadyPersistedCount
          ) ===
            result.processedBundleCount
        );
      }

      return (
        result.ok === false &&
        result.halted === true &&
        nonblank_(result.code) &&
        nonblank_(result.message) &&
        nonblank_(result.haltCode)
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
          INVOCATION_PRECONDITION,
          'RUNTIME_DEPENDENCY_UNAVAILABLE',
          'Certified bounded-rollout orchestrator dependency is unavailable.',
          'dependency_validation'
        );
      }

      var result;

      try {
        result =
          REOS
            .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2
            .run(
              options
            );
      } catch (error) {
        return fail_(
          INVOCATION_UNCERTAIN,
          'ORCHESTRATOR_EXECUTION_FAILED',
          'Certified bounded-rollout orchestrator threw; invocation outcome is uncertain and automatic retry is prohibited.',
          'orchestrator_execution'
        );
      }

      if (
        !eligibleOrchestratorResult_(
          result,
          options.evidenceBundles.length
        )
      ) {
        return fail_(
          INVOCATION_UNCERTAIN,
          'INVALID_ORCHESTRATOR_RESULT',
          'Certified bounded-rollout orchestrator returned an ineligible result; invocation outcome is uncertain and automatic retry is prohibited.',
          'orchestrator_result_validation'
        );
      }

      return result;
    }

    return Object.freeze({
      execute: execute
    });
  })();

function reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2(
  options
) {
  return REOS
    .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2
    .execute(
      options
    );
}
