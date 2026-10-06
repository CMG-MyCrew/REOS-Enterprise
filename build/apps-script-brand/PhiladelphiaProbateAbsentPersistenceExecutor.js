/**
 * REOS Enterprise - Philadelphia Probate Fixed-Target ABSENT Persistence Executor
 *
 * One certified Philadelphia probate observation only.
 *
 * Safety:
 * - zero-parameter fixed target
 * - admin required
 * - exact DISTRESS_LEADS schema required
 * - pre-insert ABSENT recheck under Database ScriptLock
 * - existing COUNTY_CONNECTOR_LIVE_PERSISTENCE exclusion boundary
 * - one Database.insert() maximum
 * - Database-generated DL identifier
 * - post-insert exact reconciliation under the same lock
 * - no update/upsert/delete/dedupe/schema mutation
 * - no external HTTP / connector / scheduler / checkpoint mutation
 * - no owner enrichment, valuation, repair, MAO, or offer authority
 * - any error after insert attempt begins is ambiguous and non-retryable
 */
var REOS = REOS || {};

REOS.PhiladelphiaProbateAbsentPersistenceExecutor = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var TARGET_SOURCE =
    'PA-PHILADELPHIA';

  var TARGET_DATASET =
    'probate';

  var TARGET_SOURCE_RECORD_ID =
    'TLI-PROBATE-2026-09-30-OC-1170-DE-2026-372346800';

  var TARGET_SOURCE_OBSERVATION_KEY =
    'pa-philadelphia|probate|tli-probate-2026-09-30-oc-1170-de-2026-372346800';

  var TARGET_CANONICAL_PROPERTY_KEY =
    'property|parcel|pa|philadelphia|372346800';

  var TARGET_PARCEL_ID =
    '372346800';

  var WRITER_ID =
    'COUNTY_CONNECTOR_LIVE_PERSISTENCE';

  var CERTIFIED_INSERT_RECORD_SHA256 =
    '6511192926ced92e361ce6052325db6f8bd8647384c4391de8f2a364ca3cd698';

  var CERTIFIED_DERIVED_IDENTITY_SHA256 =
    '648348883ef2457ffae33aac975843e04a97bd838db7a4485b8d3d7ff19b2c16';

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function exactText_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    );
  }

  function arraysEqual_(left, right) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== right.length
    ) {
      return false;
    }

    return left.every(
      function (value, index) {
        return value === right[index];
      }
    );
  }

  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Admin authority is required.'
      );
    }

    if (
      !REOS.Database ||
      typeof REOS.Database.getHeaders !==
        'function' ||
      typeof REOS.Database.getAll !==
        'function' ||
      typeof REOS.Database.insert !==
        'function' ||
      typeof REOS.Database.withScriptLockContext !==
        'function'
    ) {
      throw new Error(
        'Certified Database APIs are required.'
      );
    }

    if (
      !REOS.DistressLeadCountySchema ||
      typeof REOS.DistressLeadCountySchema.requiredHeaders !==
        'function'
    ) {
      throw new Error(
        'Certified DISTRESS_LEADS schema contract is required.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity.resolve !==
        'function'
    ) {
      throw new Error(
        'CanonicalPropertyIdentity is required.'
      );
    }

    if (
      !REOS.CountyMutationExclusionLease ||
      typeof REOS.CountyMutationExclusionLease.assertWriterAllowed !==
        'function'
    ) {
      throw new Error(
        'County mutation-exclusion assertion is required.'
      );
    }
  }

  function assertSchemaExact_() {
    var expected =
      REOS.DistressLeadCountySchema
        .requiredHeaders();

    var actual =
      REOS.Database
        .getHeaders(
          TABLE
        );

    if (
      !arraysEqual_(
        actual,
        expected
      ) ||
      actual.length !== 52
    ) {
      throw new Error(
        'DISTRESS_LEADS schema differs from certified probate insert boundary.'
      );
    }

    return {
      headerCount:
        actual.length
    };
  }

  function baseInsertRecord_() {
    return {
      Address:
        '1225 W. Somerset Street',

      City:
        'Philadelphia',

      State:
        'PA',

      Zip:
        '19133',

      'Distress Type':
        'probate',

      Status:
        'Research',

      County:
        'Philadelphia',

      Source:
        TARGET_SOURCE,

      'Source Dataset':
        TARGET_DATASET,

      'Parcel ID':
        TARGET_PARCEL_ID,

      'Source Record ID':
        TARGET_SOURCE_RECORD_ID
    };
  }

  function resolveCertifiedIdentity_(record) {
    var identity =
      REOS.CanonicalPropertyIdentity
        .resolve(
          record
        );

    if (
      !identity ||
      text_(
        identity.sourceObservationKey
      ) !==
        TARGET_SOURCE_OBSERVATION_KEY ||
      text_(
        identity.canonicalPropertyKey
      ) !==
        TARGET_CANONICAL_PROPERTY_KEY
    ) {
      throw new Error(
        'Certified probate canonical identity mismatch; no insert executed.'
      );
    }

    return identity;
  }

  function exactIdentityMatches_(rows) {
    var matches =
      [];

    (rows || [])
      .forEach(function (row) {
        row =
          row || {};

        var sourceRecordId =
          exactText_(
            row[
              'Source Record ID'
            ]
          );

        var sourceObservationKey =
          exactText_(
            row[
              'Source Observation Key'
            ]
          );

        var sourceRecordKey =
          exactText_(
            row[
              'Source Record Key'
            ]
          );

        if (
          sourceRecordId ===
            TARGET_SOURCE_RECORD_ID ||
          sourceObservationKey ===
            TARGET_SOURCE_OBSERVATION_KEY ||
          sourceRecordKey ===
            TARGET_SOURCE_OBSERVATION_KEY
        ) {
          matches.push(
            row
          );
        }
      });

    return matches;
  }

  function assertWriterAllowed_() {
    return REOS.CountyMutationExclusionLease
      .assertWriterAllowed({
        writerId:
          WRITER_ID
      });
  }

  function execute() {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    var insertAttempted =
      false;

    try {
      return REOS.Database
        .withScriptLockContext(
          function (lockContext) {
            var schema =
              assertSchemaExact_();

            var beforeRows =
              REOS.Database
                .getAll(
                  TABLE
                );

            var beforeMatches =
              exactIdentityMatches_(
                beforeRows
              );

            if (
              beforeMatches.length !== 0
            ) {
              throw new Error(
                'Certified probate observation is no longer ABSENT; no insert executed.'
              );
            }

            var insertRecord =
              baseInsertRecord_();

            resolveCertifiedIdentity_(
              insertRecord
            );

            insertRecord[
              'Source Record Key'
            ] =
              TARGET_SOURCE_OBSERVATION_KEY;

            insertRecord[
              'Source Observation Key'
            ] =
              TARGET_SOURCE_OBSERVATION_KEY;

            insertRecord[
              'Canonical Property Key'
            ] =
              TARGET_CANONICAL_PROPERTY_KEY;

            insertRecord[
              'Last Seen At'
            ] =
              new Date();

            delete insertRecord[
              'Distress Lead ID'
            ];

            assertWriterAllowed_();

            insertAttempted =
              true;

            var inserted =
              REOS.Database.insert(
                TABLE,
                insertRecord,
                {
                  idField:
                    'Distress Lead ID',

                  idPrefix:
                    'DL',

                  lockContext:
                    lockContext
                }
              );

            var insertedId =
              text_(
                inserted &&
                inserted[
                  'Distress Lead ID'
                ]
              );

            if (!insertedId) {
              throw new Error(
                'Inserted probate row returned no Distress Lead ID.'
              );
            }

            var afterRows =
              REOS.Database
                .getAll(
                  TABLE
                );

            var afterMatches =
              exactIdentityMatches_(
                afterRows
              );

            if (
              afterMatches.length !== 1
            ) {
              throw new Error(
                'Probate post-insert exact-identity count is not exactly one.'
              );
            }

            var reconciled =
              afterMatches[0] || {};

            var reconciledIdentity =
              resolveCertifiedIdentity_(
                reconciled
              );

            if (
              text_(
                reconciled[
                  'Distress Lead ID'
                ]
              ) !== insertedId ||
              exactText_(
                reconciled.Source
              ) !== TARGET_SOURCE ||
              exactText_(
                reconciled[
                  'Source Dataset'
                ]
              ) !== TARGET_DATASET ||
              exactText_(
                reconciled[
                  'Source Record ID'
                ]
              ) !== TARGET_SOURCE_RECORD_ID ||
              exactText_(
                reconciled[
                  'Source Record Key'
                ]
              ) !== TARGET_SOURCE_OBSERVATION_KEY ||
              exactText_(
                reconciled[
                  'Source Observation Key'
                ]
              ) !== TARGET_SOURCE_OBSERVATION_KEY ||
              exactText_(
                reconciled[
                  'Canonical Property Key'
                ]
              ) !== TARGET_CANONICAL_PROPERTY_KEY ||
              exactText_(
                reconciled[
                  'Parcel ID'
                ]
              ) !== TARGET_PARCEL_ID ||
              text_(
                reconciledIdentity
                  .sourceObservationKey
              ) !== TARGET_SOURCE_OBSERVATION_KEY ||
              text_(
                reconciledIdentity
                  .canonicalPropertyKey
              ) !== TARGET_CANONICAL_PROPERTY_KEY
            ) {
              throw new Error(
                'Probate post-insert identity reconciliation failed.'
              );
            }

            return {
              ok:
                true,

              mode:
                'EXPLICIT_SINGLE_PROBATE_ABSENT_INSERT_ONLY',

              source:
                TARGET_SOURCE,

              sourceDataset:
                TARGET_DATASET,

              sourceRecordId:
                TARGET_SOURCE_RECORD_ID,

              sourceObservationKey:
                TARGET_SOURCE_OBSERVATION_KEY,

              canonicalPropertyKey:
                TARGET_CANONICAL_PROPERTY_KEY,

              parcelId:
                TARGET_PARCEL_ID,

              insertedDistressLeadId:
                insertedId,

              certifiedInsertRecordSha256:
                CERTIFIED_INSERT_RECORD_SHA256,

              certifiedDerivedIdentitySha256:
                CERTIFIED_DERIVED_IDENTITY_SHA256,

              schemaHeaderCount:
                schema.headerCount,

              preInsertExactIdentityCount:
                0,

              postInsertExactIdentityCount:
                1,

              postInsertReconciled:
                true,

              insertExecuted:
                true,

              updateExecuted:
                false,

              upsertExecuted:
                false,

              deleteExecuted:
                false,

              dedupeExecuted:
                false,

              externalHttpExecuted:
                false,

              connectorExecutionExecuted:
                false,

              schedulerExecuted:
                false,

              checkpointMutationExecuted:
                false,

              automaticMutationAuthorityGranted:
                false,

              automaticInsertAuthorityGranted:
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
        );
    } catch (error) {
      if (insertAttempted) {
        throw new Error(
          'PHILADELPHIA_PROBATE_ABSENT_INSERT_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY: ' +
          (
            error &&
            error.message
              ? error.message
              : String(error)
          )
        );
      }

      throw error;
    }
  }

  return Object.freeze({
    execute:
      execute
  });
})();


function reosPhiladelphiaProbateAbsentPersistenceExecutor() {
  return REOS
    .PhiladelphiaProbateAbsentPersistenceExecutor
    .execute();
}
