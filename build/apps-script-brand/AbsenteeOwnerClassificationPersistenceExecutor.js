var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationPersistenceExecutor = (function () {
  'use strict';

  var PRECONDITION =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED';

  var UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN';

  function authority_() {
    return {
      productionDataMutationAuthorityGranted:
        false,

      ownerEvidencePersistenceAuthorityGranted:
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

      offerGenerationAuthorityGranted:
        false,

      offerSubmissionAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  function attachAuthority_(result) {
    var authority =
      authority_();

    Object.keys(authority)
      .forEach(
        function (key) {
          result[key] =
            authority[key];
        }
      );

    return result;
  }

  function dependenciesAvailable_() {
    return !!(
      REOS &&
      REOS.Database &&
      typeof REOS.Database
        .withScriptLockContext ===
        'function' &&
      REOS
        .AbsenteeOwnerClassificationPersistencePlanner &&
      typeof REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .prepare ===
        'function' &&
      REOS
        .AbsenteeOwnerClassificationEvidenceStore &&
      typeof REOS
        .AbsenteeOwnerClassificationEvidenceStore
        .persist ===
        'function'
    );
  }

  function failure_(
    outcome,
    stage,
    code,
    message
  ) {
    var result =
      attachAuthority_({
        ok: false,
        outcome: outcome,
        stage: stage,
        message: message
      });

    if (code) {
      result.code =
        code;
    }

    return result;
  }

  function execute(
    classifierResult
  ) {
    if (
      !dependenciesAvailable_()
    ) {
      return failure_(
        PRECONDITION,
        'dependency_validation',
        'PERSISTENCE_DEPENDENCY_UNAVAILABLE',
        'Classification persistence dependency is unavailable.'
      );
    }

    var plan =
      REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .prepare(
          classifierResult
        );

    if (
      !plan ||
      plan.ok !== true
    ) {
      return failure_(
        PRECONDITION,
        'planner',
        plan &&
        plan.code
          ? String(plan.code)
          : 'INVALID_PERSISTENCE_PLAN',
        'Classifier result was rejected before persistence lock acquisition.'
      );
    }

    var writeState = {
      writeAttempted: false
    };

    try {
      var result =
        REOS.Database
          .withScriptLockContext(
            function (lockContext) {
              return REOS
                .AbsenteeOwnerClassificationEvidenceStore
                .persist(
                  plan,
                  {
                    lockContext:
                      lockContext,

                    writeState:
                      writeState
                  }
                );
            }
          );

      if (
        !result ||
        result.ok !== true
      ) {
        return failure_(
          writeState
            .writeAttempted
            ? UNCERTAIN
            : PRECONDITION,
          'store_result_validation',
          'INVALID_STORE_RESULT',
          'Classification evidence store returned an invalid result.'
        );
      }

      return attachAuthority_(
        result
      );
    } catch (error) {
      var classification =
        writeState.writeAttempted
          ? UNCERTAIN
          : (
            error &&
            error.persistenceClassification ===
              UNCERTAIN
              ? UNCERTAIN
              : PRECONDITION
          );

      return failure_(
        classification,
        'persistence_executor',
        error &&
        error.persistenceClassification
          ? String(
            error
              .persistenceClassification
          )
          : 'PERSISTENCE_EXECUTION_FAILED',
        classification ===
          UNCERTAIN
          ? 'Classification persistence outcome is uncertain; operator reconciliation is required.'
          : 'Classification persistence failed before a physical evidence-store write was attempted.'
      );
    }
  }

  return Object.freeze({
    execute: execute
  });
})();
