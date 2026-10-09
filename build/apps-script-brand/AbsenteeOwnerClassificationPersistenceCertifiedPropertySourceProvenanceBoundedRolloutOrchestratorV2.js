var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2 = (function () {
  'use strict';

  var MAX_EVIDENCE_BUNDLES = 10;

  var INPUT_FIELDS = Object.freeze([
    'propertySourceIdentityCertification',
    'normalLookupEvidence',
    'ownerEvidenceResult',
    'comparisonResult',
    'classificationResult'
  ]);

  var VERIFIED =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED';

  var ALREADY =
    'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED';

  var PRECONDITION =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED';

  var UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN';

  var V1_EQUIVALENT =
    'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION';

  var COMPLETED =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_COMPLETED';

  var ROLLOUT_PRECONDITION =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_PRECONDITION_FAILED';

  var ROLLOUT_UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_OUTCOME_UNCERTAIN';

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

  function exactKeys_(object, expected) {
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
        return key === allowed[index];
      })
    );
  }

  function nonblank_(value) {
    return (
      typeof value === 'string' &&
      value.trim() !== ''
    );
  }

  function validRowNumber_(value) {
    return (
      typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 2
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
      .forEach(function (key) {
        result[key] =
          authority[key];
      });

    return result;
  }

  function dependenciesAvailable_() {
    return !!(
      REOS &&
      REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2 &&
      typeof REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.prepare === 'function' &&
      REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2 &&
      typeof REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.execute === 'function'
    );
  }

  function targetFromPlan_(plan) {
    if (
      !plan ||
      plan.ok !== true ||
      !isPlainObject_(plan.target) ||
      !validRowNumber_(
        plan.target.rowNumber
      ) ||
      !isPlainObject_(
        plan.target.identity
      ) ||
      !exactKeys_(
        plan.target.identity,
        [
          'Distress Lead ID',
          'Canonical Property Key'
        ]
      ) ||
      !nonblank_(
        plan.target.identity[
          'Distress Lead ID'
        ]
      ) ||
      !nonblank_(
        plan.target.identity[
          'Canonical Property Key'
        ]
      ) ||
      typeof plan.evidenceEventId !== 'string' ||
      !/^AOCE2-[0-9a-f]{64}$/.test(
        plan.evidenceEventId
      )
    ) {
      return null;
    }

    return {
      rowNumber:
        plan.target.rowNumber,

      distressLeadId:
        plan.target.identity[
          'Distress Lead ID'
        ],

      canonicalPropertyKey:
        plan.target.identity[
          'Canonical Property Key'
        ]
    };
  }

  function baseResult_(
    ok,
    outcome,
    requested,
    preflighted,
    processed,
    verified,
    already,
    halted,
    bundleResults
  ) {
    return attachAuthority_({
      ok: ok,
      outcome: outcome,
      requestedBundleCount: requested,
      preflightedBundleCount: preflighted,
      processedBundleCount: processed,
      verifiedPersistenceCount: verified,
      alreadyPersistedCount: already,
      halted: halted,
      bundleResults: bundleResults
    });
  }

  function failureResult_(
    outcome,
    code,
    message,
    requested,
    preflighted,
    processed,
    verified,
    already,
    bundleResults,
    haltIndex,
    haltPersistenceOutcome
  ) {
    var result =
      baseResult_(
        false,
        outcome,
        requested,
        preflighted,
        processed,
        verified,
        already,
        true,
        bundleResults
      );

    result.code =
      code;

    result.message =
      message;

    if (
      typeof haltIndex === 'number'
    ) {
      result.haltIndex =
        haltIndex;
    }

    if (
      haltPersistenceOutcome !==
      undefined
    ) {
      result.haltPersistenceOutcome =
        haltPersistenceOutcome;
    }

    result.haltCode =
      code;

    return result;
  }

  function bundleResult_(
    index,
    plan,
    executorResult
  ) {
    var target =
      targetFromPlan_(plan);

    var result = {
      index: index,
      targetIdentity: {
        rowNumber:
          target.rowNumber,

        distressLeadId:
          target.distressLeadId,

        canonicalPropertyKey:
          target.canonicalPropertyKey
      },

      persistenceOutcome:
        executorResult &&
        own_(
          executorResult,
          'outcome'
        )
          ? executorResult.outcome
          : UNCERTAIN
    };

    [
      'disposition',
      'classifierResultSha256',
      'evidenceEventId',
      'evidenceEventSha256',
      'physicalEvidenceRowNumber',
      'code'
    ].forEach(function (field) {
      if (
        executorResult &&
        own_(
          executorResult,
          field
        )
      ) {
        result[field] =
          executorResult[field];
      }
    });

    return result;
  }

  function run(options) {
    var requested = 0;

    if (
      isPlainObject_(options) &&
      Array.isArray(
        options.evidenceBundles
      )
    ) {
      requested =
        options.evidenceBundles.length;
    }

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
      return failureResult_(
        ROLLOUT_PRECONDITION,
        'INVALID_OPTIONS',
        'Options must contain exactly evidenceBundles.',
        requested,
        0,
        0,
        0,
        0,
        [],
        undefined,
        PRECONDITION
      );
    }

    if (
      requested < 1 ||
      requested >
        MAX_EVIDENCE_BUNDLES
    ) {
      return failureResult_(
        ROLLOUT_PRECONDITION,
        'INVALID_EVIDENCE_BUNDLE_COUNT',
        'evidenceBundles must contain between 1 and 10 bundles.',
        requested,
        0,
        0,
        0,
        0,
        [],
        undefined,
        PRECONDITION
      );
    }

    var envelopeFailureIndex =
      -1;

    for (
      var envelopeIndex = 0;
      envelopeIndex < requested;
      envelopeIndex++
    ) {
      if (
        !exactKeys_(
          options.evidenceBundles[
            envelopeIndex
          ],
          INPUT_FIELDS
        )
      ) {
        envelopeFailureIndex =
          envelopeIndex;
        break;
      }
    }

    if (
      envelopeFailureIndex !==
      -1
    ) {
      return failureResult_(
        ROLLOUT_PRECONDITION,
        'INVALID_EVIDENCE_BUNDLE',
        'Every evidence bundle must contain exactly the five certified artifacts.',
        requested,
        0,
        0,
        0,
        0,
        [],
        envelopeFailureIndex,
        PRECONDITION
      );
    }

    if (
      !dependenciesAvailable_()
    ) {
      return failureResult_(
        ROLLOUT_PRECONDITION,
        'ROLLOUT_DEPENDENCY_UNAVAILABLE',
        'Certified V2 planner or executor is unavailable.',
        requested,
        0,
        0,
        0,
        0,
        [],
        undefined,
        PRECONDITION
      );
    }

    var prepared = [];
    var preflighted = 0;
    var firstPreflightFailure =
      null;

    for (
      var index = 0;
      index < requested;
      index++
    ) {
      var bundle =
        options.evidenceBundles[
          index
        ];

      var plan;

      try {
        plan =
          REOS
            .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2
            .prepare(
              bundle
            );
      } catch (error) {
        if (
          firstPreflightFailure ===
          null
        ) {
          firstPreflightFailure = {
            index: index,
            code:
              'PLANNER_EXECUTION_FAILED',
            message:
              'Certified V2 planner threw during whole-request preflight.'
          };
        }

        continue;
      }

      if (
        !plan ||
        plan.ok !== true
      ) {
        if (
          firstPreflightFailure ===
          null
        ) {
          firstPreflightFailure = {
            index: index,
            code:
              plan &&
              plan.code
                ? String(
                    plan.code
                  )
                : 'V2_PLANNER_REJECTED',
            message:
              plan &&
              plan.message
                ? String(
                    plan.message
                  )
                : 'Certified V2 planner rejected the evidence bundle.'
          };
        }

        continue;
      }

      var target =
        targetFromPlan_(plan);

      if (!target) {
        if (
          firstPreflightFailure ===
          null
        ) {
          firstPreflightFailure = {
            index: index,
            code:
              'INVALID_PLANNER_RESULT',
            message:
              'Certified V2 planner returned an invalid target or deterministic event identity.'
          };
        }

        continue;
      }

      preflighted++;

      prepared.push({
        index: index,
        bundle: bundle,
        plan: plan,
        target: target
      });
    }

    if (
      firstPreflightFailure !==
      null
    ) {
      return failureResult_(
        ROLLOUT_PRECONDITION,
        firstPreflightFailure.code,
        firstPreflightFailure.message,
        requested,
        preflighted,
        0,
        0,
        0,
        [],
        firstPreflightFailure.index,
        PRECONDITION
      );
    }

    var rows = {};
    var identities = {};
    var events = {};

    for (
      var preparedIndex = 0;
      preparedIndex <
        prepared.length;
      preparedIndex++
    ) {
      var item =
        prepared[
          preparedIndex
        ];

      var rowKey =
        String(
          item.target.rowNumber
        );

      var identityKey =
        item.target.distressLeadId +
        '\u0000' +
        item.target.canonicalPropertyKey;

      var eventKey =
        item.plan.evidenceEventId;

      if (own_(rows, rowKey)) {
        return failureResult_(
          ROLLOUT_PRECONDITION,
          'DUPLICATE_PHYSICAL_TARGET_ROW',
          'Two evidence bundles resolve to the same physical target row.',
          requested,
          preflighted,
          0,
          0,
          0,
          [],
          item.index,
          PRECONDITION
        );
      }

      if (
        own_(
          identities,
          identityKey
        )
      ) {
        return failureResult_(
          ROLLOUT_PRECONDITION,
          'DUPLICATE_TARGET_DUAL_IDENTITY',
          'Two evidence bundles resolve to the same Distress Lead ID and Canonical Property Key.',
          requested,
          preflighted,
          0,
          0,
          0,
          [],
          item.index,
          PRECONDITION
        );
      }

      if (
        own_(
          events,
          eventKey
        )
      ) {
        return failureResult_(
          ROLLOUT_PRECONDITION,
          'DUPLICATE_DETERMINISTIC_V2_EVENT_ID',
          'Two evidence bundles resolve to the same deterministic V2 Evidence Event ID.',
          requested,
          preflighted,
          0,
          0,
          0,
          [],
          item.index,
          PRECONDITION
        );
      }

      rows[rowKey] =
        true;

      identities[
        identityKey
      ] =
        true;

      events[
        eventKey
      ] =
        true;
    }

    var processed = 0;
    var verified = 0;
    var already = 0;
    var bundleResults = [];

    for (
      var executeIndex = 0;
      executeIndex <
        prepared.length;
      executeIndex++
    ) {
      var current =
        prepared[
          executeIndex
        ];

      var executorResult;

      try {
        executorResult =
          REOS
            .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2
            .execute(
              current.bundle
            );
      } catch (error) {
        processed++;

        bundleResults.push(
          bundleResult_(
            current.index,
            current.plan,
            {
              ok: false,
              outcome: UNCERTAIN,
              code:
                'ESCAPED_EXECUTOR_EXCEPTION'
            }
          )
        );

        return failureResult_(
          ROLLOUT_UNCERTAIN,
          'ESCAPED_EXECUTOR_EXCEPTION',
          'An unexpected executor exception escaped; rollout outcome is uncertain and automatic retry is prohibited.',
          requested,
          preflighted,
          processed,
          verified,
          already,
          bundleResults,
          current.index,
          UNCERTAIN
        );
      }

      processed++;

      if (
        executorResult &&
        executorResult.ok === true &&
        executorResult.outcome ===
          VERIFIED
      ) {
        verified++;

        bundleResults.push(
          bundleResult_(
            current.index,
            current.plan,
            executorResult
          )
        );

        continue;
      }

      if (
        executorResult &&
        executorResult.ok === true &&
        executorResult.outcome ===
          ALREADY
      ) {
        already++;

        bundleResults.push(
          bundleResult_(
            current.index,
            current.plan,
            executorResult
          )
        );

        continue;
      }

      if (
        executorResult &&
        (
          executorResult.outcome ===
            PRECONDITION ||
          executorResult.outcome ===
            UNCERTAIN ||
          executorResult.code ===
            V1_EQUIVALENT
        )
      ) {
        bundleResults.push(
          bundleResult_(
            current.index,
            current.plan,
            executorResult
          )
        );

        var haltOutcome =
          executorResult.outcome ===
            UNCERTAIN
            ? ROLLOUT_UNCERTAIN
            : ROLLOUT_PRECONDITION;

        return failureResult_(
          haltOutcome,
          executorResult.code
            ? String(
                executorResult.code
              )
            : (
              executorResult.outcome ===
                UNCERTAIN
                ? 'V2_EXECUTOR_OUTCOME_UNCERTAIN'
                : 'V2_EXECUTOR_PRECONDITION_FAILED'
            ),
          executorResult.message
            ? String(
                executorResult.message
              )
            : 'Certified V2 executor halted the bounded rollout.',
          requested,
          preflighted,
          processed,
          verified,
          already,
          bundleResults,
          current.index,
          executorResult.outcome
        );
      }

      bundleResults.push(
        bundleResult_(
          current.index,
          current.plan,
          {
            ok: false,
            outcome: UNCERTAIN,
            code:
              'UNEXPECTED_EXECUTOR_RESULT'
          }
        )
      );

      return failureResult_(
        ROLLOUT_UNCERTAIN,
        'UNEXPECTED_EXECUTOR_RESULT',
        'Certified V2 executor returned an unrecognized result; rollout outcome is uncertain and automatic retry is prohibited.',
        requested,
        preflighted,
        processed,
        verified,
        already,
        bundleResults,
        current.index,
        UNCERTAIN
      );
    }

    return baseResult_(
      true,
      COMPLETED,
      requested,
      preflighted,
      processed,
      verified,
      already,
      false,
      bundleResults
    );
  }

  return Object.freeze({
    run: run
  });
})();
