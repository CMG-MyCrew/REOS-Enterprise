var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationBoundedRollout = (function () {
  'use strict';

  var MODE =
    'BOUNDED_ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE';

  var PHASE =
    'absentee_owner_classification_bounded_rollout';

  var MAX_TARGETS =
    10;

  var DISTRESS_ID =
    'Distress Lead ID';

  var CANONICAL_KEY =
    'Canonical Property Key';

  var PRECONDITION =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED';

  var UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN';

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

  function own_(
    object,
    key
  ) {
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
      prototype === null
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
      actual.length ===
        allowed.length &&
      actual.every(
        function (key, index) {
          return key ===
            allowed[index];
        }
      )
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
    return (
      typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 2
    );
  }

  function failRequest_(
    code,
    message
  ) {
    return attachAuthority_({
      ok: false,
      mode: MODE,
      phase: PHASE,
      outcome:
        'ROLLOUT_REQUEST_REJECTED',
      code: code,
      message: message,
      requestedTargetCount: 0,
      processedTargetCount: 0,
      halted: true,
      results: []
    });
  }

  function validateInput_(options) {
    if (
      !exactKeys_(
        options,
        [
          'targets'
        ]
      )
    ) {
      return {
        ok: false,

        result:
          failRequest_(
            'INVALID_OPTIONS',
            'options must contain exactly targets.'
          )
      };
    }

    if (
      !Array.isArray(
        options.targets
      ) ||
      options.targets.length < 1 ||
      options.targets.length >
        MAX_TARGETS
    ) {
      return {
        ok: false,

        result:
          failRequest_(
            'INVALID_TARGET_COUNT',
            'targets must contain from 1 through 10 explicit targets.'
          )
      };
    }

    var seenRows = {};
    var seenIdentities = {};
    var targets = [];

    for (
      var index = 0;
      index <
        options.targets.length;
      index++
    ) {
      var target =
        options.targets[index];

      if (
        !exactKeys_(
          target,
          [
            'rowNumber',
            'identity'
          ]
        )
      ) {
        return {
          ok: false,

          result:
            failRequest_(
              'INVALID_TARGET',
              'Each target must contain exactly rowNumber and identity.'
            )
        };
      }

      if (
        !validRowNumber_(
          target.rowNumber
        )
      ) {
        return {
          ok: false,

          result:
            failRequest_(
              'INVALID_ROW_NUMBER',
              'Each target rowNumber must be a finite integer data-row number.'
            )
        };
      }

      if (
        !exactKeys_(
          target.identity,
          [
            DISTRESS_ID,
            CANONICAL_KEY
          ]
        )
      ) {
        return {
          ok: false,

          result:
            failRequest_(
              'INVALID_IDENTITY',
              'Each target identity must contain exact persisted dual identity.'
            )
        };
      }

      var distressLeadId =
        cleanString_(
          target
            .identity[
              DISTRESS_ID
            ]
        );

      var canonicalPropertyKey =
        cleanString_(
          target
            .identity[
              CANONICAL_KEY
            ]
        );

      if (
        !distressLeadId ||
        !canonicalPropertyKey
      ) {
        return {
          ok: false,

          result:
            failRequest_(
              'BLANK_IDENTITY',
              'Each target dual identity must be nonblank.'
            )
        };
      }

      var rowKey =
        String(
          target.rowNumber
        );

      var identityKey =
        distressLeadId +
        '\u0000' +
        canonicalPropertyKey;

      if (seenRows[rowKey]) {
        return {
          ok: false,

          result:
            failRequest_(
              'DUPLICATE_TARGET_ROW',
              'The same physical row may not appear twice in one rollout request.'
            )
        };
      }

      if (
        seenIdentities[
          identityKey
        ]
      ) {
        return {
          ok: false,

          result:
            failRequest_(
              'DUPLICATE_TARGET_IDENTITY',
              'The same dual identity may not appear twice in one rollout request.'
            )
        };
      }

      seenRows[rowKey] =
        true;

      seenIdentities[
        identityKey
      ] = true;

      targets.push({
        rowNumber:
          target.rowNumber,

        identity: {
          'Distress Lead ID':
            distressLeadId,

          'Canonical Property Key':
            canonicalPropertyKey
        }
      });
    }

    return {
      ok: true,
      value: targets
    };
  }

  function dependenciesAvailable_() {
    return !!(
      REOS &&
      REOS.Security &&
      typeof REOS.Security
        .requireAdmin ===
        'function' &&
      REOS
        .AbsenteeOwnerEnrichmentExactRecordSelector &&
      typeof REOS
        .AbsenteeOwnerEnrichmentExactRecordSelector
        .exactRecordEvidence ===
        'function' &&
      REOS
        .AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup &&
      typeof REOS
        .AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup
        .lookup ===
        'function' &&
      REOS
        .AbsenteeOwnerOwnerEvidenceComparison &&
      typeof REOS
        .AbsenteeOwnerOwnerEvidenceComparison
        .compare ===
        'function' &&
      REOS
        .AbsenteeOwnerClassification &&
      typeof REOS
        .AbsenteeOwnerClassification
        .classify ===
        'function' &&
      REOS
        .AbsenteeOwnerClassificationPersistenceExecutor &&
      typeof REOS
        .AbsenteeOwnerClassificationPersistenceExecutor
        .execute ===
        'function'
    );
  }

  function selectorAuthoritiesFalse_(
    evidence
  ) {
    return SELECTOR_AUTHORITY_FIELDS
      .every(
        function (field) {
          return (
            own_(
              evidence,
              field
            ) &&
            evidence[field] ===
              false
          );
        }
      );
  }

  function selectorSuccessEligible_(
    evidence,
    requested
  ) {
    return (
      isPlainObject_(evidence) &&
      evidence.ok === true &&
      evidence.mode ===
        'READ_ONLY' &&
      evidence.phase ===
        'absentee_owner_exact_record_evidence' &&
      isPlainObject_(
        evidence.target
      ) &&
      evidence.target.table ===
        'DISTRESS_LEADS' &&
      evidence.target.rowNumber ===
        requested.rowNumber &&
      isPlainObject_(
        evidence.identity
      ) &&
      cleanString_(
        evidence
          .identity[
            DISTRESS_ID
          ]
      ) ===
        requested
          .identity[
            DISTRESS_ID
          ] &&
      cleanString_(
        evidence
          .identity[
            CANONICAL_KEY
          ]
      ) ===
        requested
          .identity[
            CANONICAL_KEY
          ] &&
      isPlainObject_(
        evidence.record
      ) &&
      selectorAuthoritiesFalse_(
        evidence
      )
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

    if (
      !propertyAddress ||
      !city ||
      !state
    ) {
      return null;
    }

    var request = {
      rowNumber:
        selectorEvidence
          .target
          .rowNumber,

      identity: {
        'Distress Lead ID':
          selectorEvidence
            .identity[
              DISTRESS_ID
            ],

        'Canonical Property Key':
          selectorEvidence
            .identity[
              CANONICAL_KEY
            ]
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

    return request;
  }

  function targetBase_(target) {
    return {
      rowNumber:
        target.rowNumber,

      identity: {
        'Distress Lead ID':
          target
            .identity[
              DISTRESS_ID
            ],

        'Canonical Property Key':
          target
            .identity[
              CANONICAL_KEY
            ]
      }
    };
  }

  function targetFailure_(
    target,
    stage,
    code,
    classifierOutcome,
    upstreamComparisonOutcome
  ) {
    var result =
      targetBase_(target);

    result.ok =
      false;

    result.stage =
      stage;

    result.code =
      code;

    if (classifierOutcome) {
      result.classifierOutcome =
        classifierOutcome;
    }

    if (
      upstreamComparisonOutcome
    ) {
      result.upstreamComparisonOutcome =
        upstreamComparisonOutcome;
    }

    return result;
  }

  function persistenceTargetResult_(
    target,
    classifierResult,
    persistenceResult
  ) {
    var result =
      targetBase_(target);

    result.ok =
      persistenceResult.ok ===
      true;

    result.classifierOutcome =
      classifierResult.outcome;

    result.upstreamComparisonOutcome =
      classifierResult
        .upstreamComparisonOutcome;

    result.persistenceOutcome =
      persistenceResult.outcome;

    if (
      persistenceResult
        .disposition
    ) {
      result.persistenceDisposition =
        persistenceResult
          .disposition;
    }

    if (
      persistenceResult
        .classifierResultSha256
    ) {
      result.classifierResultSha256 =
        persistenceResult
          .classifierResultSha256;
    }

    if (
      persistenceResult
        .evidenceEventId
    ) {
      result.evidenceEventId =
        persistenceResult
          .evidenceEventId;
    }

    if (
      persistenceResult
        .evidenceEventSha256
    ) {
      result.evidenceEventSha256 =
        persistenceResult
          .evidenceEventSha256;
    }

    if (
      persistenceResult
        .code
    ) {
      result.code =
        persistenceResult
          .code;
    }

    return result;
  }

  function run(options) {
    REOS.Security
      .requireAdmin();

    var validated =
      validateInput_(options);

    if (!validated.ok) {
      return validated.result;
    }

    if (
      !dependenciesAvailable_()
    ) {
      return failRequest_(
        'RUNTIME_DEPENDENCY_UNAVAILABLE',
        'Certified bounded-rollout dependency is unavailable.'
      );
    }

    var targets =
      validated.value;

    var results = [];
    var halted = false;
    var haltClassification = '';

    for (
      var index = 0;
      index < targets.length;
      index++
    ) {
      var target =
        targets[index];

      var selectorEvidence;

      try {
        selectorEvidence =
          REOS
            .AbsenteeOwnerEnrichmentExactRecordSelector
            .exactRecordEvidence(
              target
            );
      } catch (error) {
        results.push(
          targetFailure_(
            target,
            'exact_record_selector',
            'SELECTOR_EXCEPTION'
          )
        );

        continue;
      }

      if (
        !selectorSuccessEligible_(
          selectorEvidence,
          target
        )
      ) {
        results.push(
          targetFailure_(
            target,
            'exact_record_selector',
            selectorEvidence &&
            selectorEvidence.code
              ? String(
                selectorEvidence
                  .code
              )
              : 'INVALID_EXACT_RECORD_EVIDENCE'
          )
        );

        continue;
      }

      var lookupRequest =
        lookupRequest_(
          selectorEvidence
        );

      if (!lookupRequest) {
        results.push(
          targetFailure_(
            target,
            'lookup_request_derivation',
            'INVALID_VERIFIED_PROPERTY_EVIDENCE'
          )
        );

        continue;
      }

      var ownerEvidence;

      try {
        ownerEvidence =
          REOS
            .AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup
            .lookup(
              lookupRequest
            );
      } catch (error) {
        results.push(
          targetFailure_(
            target,
            'owner_evidence_lookup',
            'LOOKUP_EXCEPTION'
          )
        );

        continue;
      }

      if (
        !isPlainObject_(
          ownerEvidence
        ) ||
        ownerEvidence.ok !==
          true
      ) {
        results.push(
          targetFailure_(
            target,
            'owner_evidence_lookup',
            ownerEvidence &&
            ownerEvidence.code
              ? String(
                ownerEvidence
                  .code
              )
              : 'OWNER_EVIDENCE_LOOKUP_FAILED'
          )
        );

        continue;
      }

      var comparisonEvidence;

      try {
        comparisonEvidence =
          REOS
            .AbsenteeOwnerOwnerEvidenceComparison
            .compare(
              ownerEvidence
            );
      } catch (error) {
        results.push(
          targetFailure_(
            target,
            'owner_evidence_comparison',
            'COMPARISON_EXCEPTION'
          )
        );

        continue;
      }

      var classifierResult;

      try {
        classifierResult =
          REOS
            .AbsenteeOwnerClassification
            .classify(
              comparisonEvidence
            );
      } catch (error) {
        results.push(
          targetFailure_(
            target,
            'classification',
            'CLASSIFIER_EXCEPTION'
          )
        );

        continue;
      }

      if (
        !isPlainObject_(
          classifierResult
        ) ||
        classifierResult.ok !==
          true
      ) {
        results.push(
          targetFailure_(
            target,
            'classification',
            'INELIGIBLE_COMPARISON_EVIDENCE',
            classifierResult &&
            classifierResult.outcome
              ? String(
                classifierResult
                  .outcome
              )
              : '',
            classifierResult &&
            classifierResult
              .upstreamComparisonOutcome
              ? String(
                classifierResult
                  .upstreamComparisonOutcome
              )
              : ''
          )
        );

        continue;
      }

      var persistenceResult;

      try {
        persistenceResult =
          REOS
            .AbsenteeOwnerClassificationPersistenceExecutor
            .execute(
              classifierResult
            );
      } catch (error) {
        persistenceResult = {
          ok: false,
          outcome:
            PRECONDITION,
          code:
            'PERSISTENCE_EXECUTOR_EXCEPTION'
        };
      }

      if (
        !isPlainObject_(
          persistenceResult
        ) ||
        typeof persistenceResult
          .outcome !==
          'string'
      ) {
        persistenceResult = {
          ok: false,
          outcome:
            PRECONDITION,
          code:
            'INVALID_PERSISTENCE_EXECUTOR_RESULT'
        };
      }

      results.push(
        persistenceTargetResult_(
          target,
          classifierResult,
          persistenceResult
        )
      );

      if (
        persistenceResult.outcome ===
          PRECONDITION ||
        persistenceResult.outcome ===
          UNCERTAIN
      ) {
        halted = true;

        haltClassification =
          persistenceResult
            .outcome;

        break;
      }
    }

    var response =
      attachAuthority_({
        ok:
          !halted,

        mode:
          MODE,

        phase:
          PHASE,

        outcome:
          halted
            ? 'ROLLOUT_HALTED'
            : 'ROLLOUT_COMPLETED',

        requestedTargetCount:
          targets.length,

        processedTargetCount:
          results.length,

        halted:
          halted,

        results:
          results
      });

    if (haltClassification) {
      response.haltClassification =
        haltClassification;
    }

    return response;
  }

  return Object.freeze({
    run: run,
    maxTargets: MAX_TARGETS
  });
})();

function reosAbsenteeOwnerClassificationBoundedRollout(
  options
) {
  return REOS
    .AbsenteeOwnerClassificationBoundedRollout
    .run(
      options
    );
}
