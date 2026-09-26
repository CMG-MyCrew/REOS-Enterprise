var REOS = REOS || {};

REOS.AbsenteeOwnerClassification = (function () {
  'use strict';

  var MODE =
    'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION';

  var PHASE =
    'absentee_owner_classification';

  var UPSTREAM_MODE =
    'READ_ONLY_OWNER_EVIDENCE_COMPARISON';

  var UPSTREAM_PHASE =
    'absentee_owner_owner_evidence_comparison';

  var BASIS =
    'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON';

  var DISTRESS_ID =
    'Distress Lead ID';

  var CANONICAL_KEY =
    'Canonical Property Key';

  var OUTCOME_MAP = Object.freeze({
    'MAILING_ADDRESS_DIFFERS':
      'ABSENTEE_OWNER_INDICATED',

    'MAILING_ADDRESS_MATCHES':
      'OWNER_MAILING_MATCHED',

    'INSUFFICIENT_MAILING_EVIDENCE':
      'INSUFFICIENT_CLASSIFICATION_EVIDENCE',

    'INELIGIBLE_OWNER_EVIDENCE':
      'INELIGIBLE_COMPARISON_EVIDENCE'
  });

  var UPSTREAM_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'absenteeClassificationAuthorityGranted',
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

      automaticOfferAuthorityGranted:
        false
    };
  }

  function attachAuthority_(result) {
    var authority = authority_();

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

  function nonblank_(value) {
    return typeof value === 'string' &&
      value.trim() !== '';
  }

  function validRowNumber_(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 2;
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

  function recognizedOutcome_(outcome) {
    return own_(
      OUTCOME_MAP,
      outcome
    );
  }

  function targetEligible_(target) {
    return isPlainObject_(target) &&
      validRowNumber_(
        target.rowNumber
      ) &&
      isPlainObject_(
        target.identity
      ) &&
      nonblank_(
        target.identity[DISTRESS_ID]
      ) &&
      nonblank_(
        target.identity[CANONICAL_KEY]
      );
  }

  function normalizedEvidenceEligible_(
    evidence
  ) {
    return isPlainObject_(
      evidence.normalizedPropertyAddress
    ) &&
      isPlainObject_(
        evidence.normalizedMailingAddress
      );
  }

  function differencesEligible_(
    evidence
  ) {
    if (
      evidence.outcome ===
      'MAILING_ADDRESS_DIFFERS'
    ) {
      return Array.isArray(
        evidence.differingComponents
      ) &&
        evidence.differingComponents.length > 0 &&
        evidence.differingComponents.every(
          function (field) {
            return [
              'street',
              'city',
              'state',
              'zip'
            ].indexOf(field) >= 0;
          }
        );
    }

    if (
      evidence.outcome ===
      'MAILING_ADDRESS_MATCHES'
    ) {
      return Array.isArray(
        evidence.differingComponents
      ) &&
        evidence.differingComponents.length === 0;
    }

    return true;
  }

  function baseEligible_(evidence) {
    return isPlainObject_(evidence) &&
      evidence.mode === UPSTREAM_MODE &&
      evidence.phase === UPSTREAM_PHASE &&
      recognizedOutcome_(
        evidence.outcome
      ) &&
      upstreamAuthoritiesFalse_(
        evidence
      );
  }

  function eligible_(evidence) {
    if (!baseEligible_(evidence)) {
      return false;
    }

    /*
     * Certified comparison-layer ineligibility is itself
     * admissible classification input. The comparison layer
     * intentionally emits no target when it has already failed
     * closed.
     */
    if (
      evidence.outcome ===
      'INELIGIBLE_OWNER_EVIDENCE'
    ) {
      return true;
    }

    return targetEligible_(
      evidence.target
    ) &&
      normalizedEvidenceEligible_(
        evidence
      ) &&
      differencesEligible_(
        evidence
      );
  }

  function copyObject_(value) {
    var result = {};

    Object.keys(value).forEach(
      function (key) {
        result[key] =
          value[key];
      }
    );

    return result;
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

  function ineligible_(input) {
    var result = {
      ok: false,
      mode: MODE,
      phase: PHASE,
      outcome:
        'INELIGIBLE_COMPARISON_EVIDENCE',
      classificationBasis: BASIS
    };

    if (
      isPlainObject_(input) &&
      typeof input.outcome === 'string'
    ) {
      result.upstreamComparisonOutcome =
        input.outcome;
    }

    return attachAuthority_(
      result
    );
  }

  function classify(
    comparisonEvidence
  ) {
    if (
      !eligible_(
        comparisonEvidence
      )
    ) {
      return ineligible_(
        comparisonEvidence
      );
    }

    if (
      comparisonEvidence.outcome ===
      'INELIGIBLE_OWNER_EVIDENCE'
    ) {
      return ineligible_(
        comparisonEvidence
      );
    }

    var result = {
      ok: true,
      mode: MODE,
      phase: PHASE,

      outcome:
        OUTCOME_MAP[
          comparisonEvidence.outcome
        ],

      target:
        targetResult_(
          comparisonEvidence
        ),

      upstreamComparisonOutcome:
        comparisonEvidence.outcome,

      classificationBasis:
        BASIS,

      normalizedPropertyAddress:
        copyObject_(
          comparisonEvidence
            .normalizedPropertyAddress
        ),

      normalizedMailingAddress:
        copyObject_(
          comparisonEvidence
            .normalizedMailingAddress
        )
    };

    if (
      Array.isArray(
        comparisonEvidence
          .differingComponents
      )
    ) {
      result.differingComponents =
        comparisonEvidence
          .differingComponents
          .slice();
    }

    return attachAuthority_(
      result
    );
  }

  return Object.freeze({
    classify: classify
  });
})();
