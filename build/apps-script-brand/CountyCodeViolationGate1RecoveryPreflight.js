/**
 * REOS Enterprise
 * Code Violations Production Completion
 * Gate 1 Missing-Recovery Preflight
 *
 * Read-only validation of the checksum-certified 139-record recovery
 * authority against fresh Gate-1 source and persisted-state evidence.
 *
 * IMPORTANT:
 * - Violation Number is durable observation authority.
 * - Canonical property identity must remain exact.
 * - ArcGIS ObjectID is evidence only and may drift.
 *
 * This module grants NO mutation, insert, checkpoint, scheduler,
 * migration, deduplication, or automatic-offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationGate1RecoveryPreflight =
(function () {
  'use strict';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var EXPECTED_OPEN_POPULATION =
    153;

  var EXPECTED_RECOVERY_AUTHORITIES =
    139;

  var EXPECTED_NON_RECOVERY_SAFE =
    14;

  var EXPECTED_MANIFEST_SHA256 =
    '33733cdf3ea8fbfccf66dfe0904fe26999b184c2e367a920318b2d943fe6e8c6';

  var EXPECTED_CATALOG_SHA256 =
    '050857487383e799b0a9dc503dfeeae759e8ddf60e485e4ae94cb551e2b8731d';

  var EXPECTED_SOURCE_EVIDENCE_SHA256 =
    'fc6eaf12a1692882dd7e5fae62ea2985fb336c6c6287b017fbb18a28d672c1ef';

  var ACTIONABLE_PRIORITIES = {
    'UNSAFE': true,
    'IMMINENTLY DANGEROUS': true,
    'UNFIT': true,
    'HAZARDOUS': true,
    'UNLAWFUL': true
  };

  function text_(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).trim();
  }

  function upper_(value) {
    return text_(value).toUpperCase();
  }

  function requireDependencies_() {
    if (
      !REOS.CountyCodeViolationGate1Reconciliation ||
      typeof REOS.CountyCodeViolationGate1Reconciliation.run !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery preflight requires certified Gate 1 reconciliation.'
      );
    }

    if (
      !REOS.CountyCodeViolationGate1RecoveryAuthority ||
      typeof REOS.CountyCodeViolationGate1RecoveryAuthority.resolve !==
        'function' ||
      typeof REOS.CountyCodeViolationGate1RecoveryAuthority.metadata !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery preflight requires certified recovery authority.'
      );
    }
  }

  function requireAuthorityMetadata_() {
    var metadata =
      REOS.CountyCodeViolationGate1RecoveryAuthority
        .metadata();

    if (
      !metadata ||
      metadata.mode !==
        'READ_ONLY_GATE1_MISSING_RECOVERY_AUTHORITY' ||
      metadata.connectorId !== CONNECTOR_ID ||
      metadata.dataset !== DATASET ||
      metadata.authorityManifestSha256 !==
        EXPECTED_MANIFEST_SHA256 ||
      metadata.authorityCatalogSha256 !==
        EXPECTED_CATALOG_SHA256 ||
      metadata.sourceEvidenceSha256 !==
        EXPECTED_SOURCE_EVIDENCE_SHA256 ||
      Number(metadata.candidateCount) !==
        EXPECTED_RECOVERY_AUTHORITIES ||
      Number(metadata.recordCount) !==
        EXPECTED_RECOVERY_AUTHORITIES ||
      metadata.durableIdentityField !==
        'Violation Number' ||
      metadata.canonicalPropertyRequired !== true ||
      metadata.objectIdIsDurableAuthority !== false ||
      metadata.mutationAuthorityGranted !== false ||
      metadata.insertAuthorityGranted !== false ||
      metadata.updateAuthorityGranted !== false ||
      metadata.checkpointAuthorityGranted !== false ||
      metadata.schedulerAuthorityGranted !== false ||
      metadata.migrationAuthorityGranted !== false ||
      metadata.automaticOfferAuthorityGranted !== false
    ) {
      throw new Error(
        'Gate 1 recovery authority metadata mismatch.'
      );
    }

    return metadata;
  }

  function requireReconciliationContract_(result) {
    if (
      !result ||
      result.ok !== true ||
      result.readOnly !== true ||
      result.mode !==
        'CODE_VIOLATIONS_PRODUCTION_COMPLETION_GATE_1' ||
      result.connectorId !== CONNECTOR_ID ||
      result.dataset !== DATASET ||
      !Array.isArray(result.records) ||
      result.records.length !==
        EXPECTED_OPEN_POPULATION ||
      Number(result.countySchedulerTriggerCount) !== 0 ||
      result.productionDataMutationAuthorityGranted !== false ||
      result.connectorExecutionAuthorityGranted !== false ||
      result.checkpointMutationAuthorityGranted !== false ||
      result.schedulerAuthorityGranted !== false ||
      result.repairAuthorityGranted !== false ||
      result.migrationAuthorityGranted !== false ||
      result.automaticOfferAuthorityGranted !== false
    ) {
      throw new Error(
        'Gate 1 reconciliation contract drift.'
      );
    }
  }

  function requireSourceAuthorityMatch_(
    source,
    authority
  ) {
    var violationNumber =
      upper_(source.violationNumber);

    if (
      violationNumber !==
        upper_(authority.violationNumber)
    ) {
      throw new Error(
        'Recovery durable violation identity drift: ' +
        violationNumber
      );
    }

    if (
      text_(source.durableObservationKey)
        .toLowerCase() !==
      text_(authority.durableObservationKey)
        .toLowerCase()
    ) {
      throw new Error(
        'Recovery durable observation key drift: ' +
        violationNumber
      );
    }

    if (
      text_(source.canonicalPropertyKey) !==
      text_(authority.expectedCanonicalPropertyKey)
    ) {
      throw new Error(
        'Recovery canonical property identity drift: ' +
        violationNumber
      );
    }

    if (
      text_(source.parcelId) !==
      text_(authority.expectedParcelId)
    ) {
      throw new Error(
        'Recovery parcel identity drift: ' +
        violationNumber
      );
    }

    if (
      Number(source.violationDate) !==
      Number(authority.evidenceViolationDate)
    ) {
      throw new Error(
        'Recovery violation-date identity guard drift: ' +
        violationNumber
      );
    }

    if (
      upper_(source.violationStatus) !==
      'OPEN'
    ) {
      throw new Error(
        'Recovery source is no longer OPEN: ' +
        violationNumber
      );
    }

    if (
      !ACTIONABLE_PRIORITIES[
        upper_(source.priority)
      ]
    ) {
      throw new Error(
        'Recovery source is no longer actionable: ' +
        violationNumber
      );
    }
  }

  function run() {
    requireDependencies_();

    var metadata =
      requireAuthorityMetadata_();

    /*
     * One certified read-only reconciliation owns:
     * - admin gate
     * - zero scheduler-trigger gate
     * - certified endpoint gate
     * - one bounded ArcGIS population read
     * - one fresh DISTRESS_LEADS read
     */
    var reconciliation =
      REOS.CountyCodeViolationGate1Reconciliation
        .run();

    requireReconciliationContract_(
      reconciliation
    );

    var seenRecoveryKeys = {};
    var recoveryResults = [];
    var nonRecoveryResults = [];

    reconciliation.records.forEach(
      function (record) {
        var source =
          record && record.source
            ? record.source
            : {};

        var key =
          text_(
            source.durableObservationKey
          ).toLowerCase();

        var authority =
          REOS.CountyCodeViolationGate1RecoveryAuthority
            .resolve(key);

        if (!authority) {
          if (
            record.classification !==
            'ALREADY_SAFE'
          ) {
            throw new Error(
              'Non-recovery Gate 1 observation is no longer safely persisted: ' +
              upper_(source.violationNumber)
            );
          }

          nonRecoveryResults.push({
            violationNumber:
              upper_(source.violationNumber),

            durableObservationKey:
              key,

            classification:
              record.classification
          });

          return;
        }

        if (seenRecoveryKeys[key]) {
          throw new Error(
            'Duplicate recovery authority encountered in fresh source population: ' +
            key
          );
        }

        seenRecoveryKeys[key] = true;

        requireSourceAuthorityMatch_(
          source,
          authority
        );

        if (
          record.classification !==
            'MISSING' &&
          record.classification !==
            'ALREADY_SAFE'
        ) {
          throw new Error(
            'Recovery candidate entered unsafe reconciliation state: ' +
            upper_(source.violationNumber) +
            ' / ' +
            text_(record.classification)
          );
        }

        recoveryResults.push({
          violationNumber:
            upper_(source.violationNumber),

          durableObservationKey:
            key,

          expectedCanonicalPropertyKey:
            text_(
              authority
                .expectedCanonicalPropertyKey
            ),

          expectedParcelId:
            text_(
              authority.expectedParcelId
            ),

          classification:
            record.classification,

          outcome:
            record.classification ===
              'MISSING'
              ? 'RECOVERY_CANDIDATE_STILL_MISSING_NO_WRITE_AUTHORITY'
              : 'RECOVERY_CANDIDATE_ALREADY_PRESENT_NO_WRITE_AUTHORITY',

          currentObjectId:
            text_(source.objectId),

          certifiedEvidenceObjectId:
            text_(
              authority.evidenceObjectId
            ),

          objectIdChangedSinceCertification:
            text_(source.objectId) !==
            text_(
              authority.evidenceObjectId
            ),

          mutationAuthorized:
            false,

          insertAuthorized:
            false
        });
      }
    );

    if (
      recoveryResults.length !==
      EXPECTED_RECOVERY_AUTHORITIES
    ) {
      throw new Error(
        'Gate 1 recovery authority coverage drift: expected ' +
        EXPECTED_RECOVERY_AUTHORITIES +
        ', observed ' +
        recoveryResults.length +
        '.'
      );
    }

    if (
      Object.keys(seenRecoveryKeys).length !==
      EXPECTED_RECOVERY_AUTHORITIES
    ) {
      throw new Error(
        'Gate 1 recovery durable-key accounting mismatch.'
      );
    }

    if (
      nonRecoveryResults.length !==
      EXPECTED_NON_RECOVERY_SAFE
    ) {
      throw new Error(
        'Gate 1 non-recovery safe population drift: expected ' +
        EXPECTED_NON_RECOVERY_SAFE +
        ', observed ' +
        nonRecoveryResults.length +
        '.'
      );
    }

    var stillMissingCount =
      recoveryResults.filter(
        function (result) {
          return (
            result.classification ===
            'MISSING'
          );
        }
      ).length;

    var alreadyPresentCount =
      recoveryResults.length -
      stillMissingCount;

    var objectIdChangedCount =
      recoveryResults.filter(
        function (result) {
          return (
            result
              .objectIdChangedSinceCertification ===
            true
          );
        }
      ).length;

    return {
      ok: true,

      readOnly: true,

      mode:
        'CODE_VIOLATIONS_GATE1_RECOVERY_PREFLIGHT',

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      authority: {
        manifestSha256:
          metadata.authorityManifestSha256,

        catalogSha256:
          metadata.authorityCatalogSha256,

        certifiedCandidateCount:
          metadata.candidateCount,

        durableIdentityField:
          metadata.durableIdentityField,

        objectIdIsDurableAuthority:
          false
      },

      observedOpenPopulation:
        reconciliation.records.length,

      recoveryAuthorityCount:
        recoveryResults.length,

      stillMissingCount:
        stillMissingCount,

      alreadyPresentCount:
        alreadyPresentCount,

      nonRecoveryAlreadySafeCount:
        nonRecoveryResults.length,

      objectIdChangedCount:
        objectIdChangedCount,

      recoveryResults:
        recoveryResults,

      nonRecoveryResults:
        nonRecoveryResults,

      countySchedulerTriggerCount:
        0,

      writeReadyCount:
        0,

      executableWritePayloadGenerated:
        false,

      sameInvocationWriteAllowed:
        false,

      productionDataMutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      updateAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      deduplicationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  return {
    run: run
  };
})();


function reosCountyCodeViolationGate1RecoveryPreflight() {
  return REOS
    .CountyCodeViolationGate1RecoveryPreflight
    .run();
}
