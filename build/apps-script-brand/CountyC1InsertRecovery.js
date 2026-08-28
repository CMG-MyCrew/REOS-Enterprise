/**
 * REOS Enterprise - County C1 Insert-Only Recovery
 *
 * Dedicated, bounded recovery executor for a previously certified
 * Philadelphia code-violations C1 missing-observation candidate.
 *
 * IMPORTANT:
 * - one certified Source Observation Key per invocation
 * - INSERT only
 * - exactly one Database.insert() maximum
 * - no update/upsert/delete/dedupe/merge
 * - no schema mutation
 * - no property creation
 * - no scheduler or trigger integration
 * - no automatic offer/MAO authority
 *
 * Source retrieval occurs before lock acquisition.
 *
 * Final authority/catalog, schema, persisted-observation, validation,
 * and canonical identity checks occur inside the same capability-bound
 * ScriptLock callback as the single Database.insert().
 *
 * A prior separately executed read-only C1 live preflight remains an
 * operational prerequisite. This executor deliberately does NOT invoke
 * CountyC1LivePreflight in the same invocation.
 */
var REOS = REOS || {};

REOS.CountyC1InsertRecovery = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var AUTHORITY_DESCRIPTOR_SOURCE_SHA256 =
    '9d5b728823107083c50f5bb4871e0fce47967e21eadd70a59e13f97e13a2eea9';

  var AUTHORITY_CATALOG_SHA256 =
    'b5aeebee8bc5162c9557f2678bf62e1930fa1f6ad5ba369c27b3a1dabb55c091';

  var AUTHORITY_DESCRIPTOR_COUNT =
    664;

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function safeValue_(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    if (
      Object.prototype.toString.call(value) ===
      '[object Date]'
    ) {
      return value.toISOString();
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map(safeValue_);
    }

    if (typeof value === 'object') {
      var copy = {};

      Object.keys(value)
        .sort()
        .forEach(function (key) {
          if (
            typeof value[key] !==
            'function'
          ) {
            copy[key] =
              safeValue_(
                value[key]
              );
          }
        });

      return copy;
    }

    return String(value);
  }

  function stableStringify_(value) {
    return JSON.stringify(
      safeValue_(value)
    );
  }

  function sha256_(value) {
    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        stableStringify_(value),
        Utilities.Charset.UTF_8
      );

    return digest
      .map(function (byte) {
        var normalized =
          byte < 0
            ? byte + 256
            : byte;

        return (
          normalized < 16
            ? '0'
            : ''
        ) + normalized.toString(16);
      })
      .join('');
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
      !REOS.Database ||
      typeof REOS.Database.getHeaders !==
        'function' ||
      typeof REOS.Database.getAll !==
        'function' ||
      typeof REOS.Database.insert !==
        'function' ||
      typeof REOS.Database
        .withScriptLockContext !==
        'function'
    ) {
      throw new Error(
        'Certified Database read/insert/lock-context APIs are required.'
      );
    }

    if (
      !REOS.CountyC1MaintenanceGate ||
      typeof REOS.CountyC1MaintenanceGate
        .assertRecoveryReady !==
        'function'
    ) {
      throw new Error(
        'Certified C1 maintenance/quiescence gate is required.'
      );
    }

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
      !REOS.DistressLeadCountySchema ||
      typeof REOS.DistressLeadCountySchema
        .requiredHeaders !==
        'function'
    ) {
      throw new Error(
        'Certified DISTRESS_LEADS schema contract is required.'
      );
    }

    if (
      !REOS.CountyRuntimeBridge ||
      typeof REOS.CountyRuntimeBridge
        .registerConnectors !==
        'function'
    ) {
      throw new Error(
        'County connector registration is required.'
      );
    }

    if (
      !REOS.CountyConnectorSDK ||
      typeof REOS.CountyConnectorSDK.get !==
        'function' ||
      typeof REOS.CountyConnectorSDK
        .validateLead !==
        'function'
    ) {
      throw new Error(
        'County connector registry/validation is required.'
      );
    }

    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.Registry ||
      typeof REOS.CountyAdapters.Registry.fetch !==
        'function'
    ) {
      throw new Error(
        'County adapter registry is required.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity
        .resolve !==
        'function'
    ) {
      throw new Error(
        'CanonicalPropertyIdentity is required.'
      );
    }

    if (
      !REOS.CountyC1CertifiedAuthority ||
      typeof REOS.CountyC1CertifiedAuthority
        .resolve !==
        'function' ||
      typeof REOS.CountyC1CertifiedAuthority
        .metadata !==
        'function'
    ) {
      throw new Error(
        'Certified C1 authority catalog is required.'
      );
    }

    if (
      typeof PropertiesService ===
        'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !==
        'function'
    ) {
      throw new Error(
        'Script Properties read access is required.'
      );
    }

    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities.computeDigest !==
        'function'
    ) {
      throw new Error(
        'Utilities digest support is required.'
      );
    }
  }

  function requireAuthorityMetadata_() {
    var metadata =
      REOS.CountyC1CertifiedAuthority
        .metadata();

    if (
      !metadata ||
      metadata.mode !==
        'READ_ONLY_AUTHORITY_CATALOG' ||
      metadata.planningClass !==
        'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE' ||
      metadata.connectorId !==
        CONNECTOR_ID ||
      metadata.dataset !==
        DATASET ||
      metadata.descriptorSourceSha256 !==
        AUTHORITY_DESCRIPTOR_SOURCE_SHA256 ||
      metadata.catalogSha256 !==
        AUTHORITY_CATALOG_SHA256 ||
      Number(metadata.descriptorCount) !==
        AUTHORITY_DESCRIPTOR_COUNT ||
      Number(metadata.recordCount) !==
        AUTHORITY_DESCRIPTOR_COUNT ||
      metadata.mutationAuthorityGranted !==
        false ||
      metadata.insertAuthorityGranted !==
        false
    ) {
      throw new Error(
        'Certified C1 authority metadata mismatch.'
      );
    }

    return metadata;
  }

  function resolveCertifiedCandidate_(
    sourceObservationKey
  ) {
    var key =
      text_(
        sourceObservationKey
      );

    if (!key) {
      throw new Error(
        'Certified C1 Source Observation Key is required.'
      );
    }

    var candidate =
      REOS.CountyC1CertifiedAuthority
        .resolve(
          key
        );

    if (!candidate) {
      throw new Error(
        'C1 Source Observation Key is outside certified authority catalog.'
      );
    }

    var sourceRecordId =
      text_(
        candidate
          .immutableSourceRecordId
      );

    var canonicalPropertyKey =
      text_(
        candidate
          .expectedCanonicalPropertyKey
      );

    if (
      candidate.planningClass !==
        'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE' ||
      candidate.connectorId !==
        CONNECTOR_ID ||
      candidate.dataset !==
        DATASET ||
      text_(
        candidate.sourceObservationKey
      ) !==
        key ||
      candidate
        .authorityDescriptorSourceSha256 !==
        AUTHORITY_DESCRIPTOR_SOURCE_SHA256 ||
      candidate
        .authorityCatalogSha256 !==
        AUTHORITY_CATALOG_SHA256
    ) {
      throw new Error(
        'Certified C1 candidate authority mismatch.'
      );
    }

    if (
      !/^[0-9]+$/.test(
        sourceRecordId
      ) ||
      Number(sourceRecordId) < 1
    ) {
      throw new Error(
        'Certified C1 immutable source record ID is invalid.'
      );
    }

    if (
      key !==
        (
          'pa-philadelphia|code_violations|' +
          sourceRecordId.toLowerCase()
        )
    ) {
      throw new Error(
        'Certified C1 observation identity does not match immutable source ID.'
      );
    }

    if (!canonicalPropertyKey) {
      throw new Error(
        'Certified C1 canonical property key is missing.'
      );
    }

    return {
      sourceObservationKey:
        key,

      immutableSourceRecordId:
        sourceRecordId,

      expectedCanonicalPropertyKey:
        canonicalPropertyKey,

      historicalNormalizedSourceRecordSha256:
        text_(
          candidate
            .historicalNormalizedSourceRecordSha256
        ),

      descriptorSha256:
        text_(
          candidate
            .descriptorSha256
        )
    };
  }

  function candidateEqual_(left, right) {
    return Boolean(
      left &&
      right &&
      left.sourceObservationKey ===
        right.sourceObservationKey &&
      left.immutableSourceRecordId ===
        right.immutableSourceRecordId &&
      left.expectedCanonicalPropertyKey ===
        right.expectedCanonicalPropertyKey &&
      left.historicalNormalizedSourceRecordSha256 ===
        right.historicalNormalizedSourceRecordSha256 &&
      left.descriptorSha256 ===
        right.descriptorSha256
    );
  }

  function getEndpoint_() {
    var endpoint =
      text_(
        PropertiesService
          .getScriptProperties()
          .getProperty(
            ENDPOINT_PROPERTY
          )
      );

    if (!endpoint) {
      throw new Error(
        'Missing Philadelphia code violations endpoint.'
      );
    }

    return endpoint;
  }

  function rawSourceRecordId_(raw) {
    raw =
      raw ||
      {};

    return text_(
      raw.objectid ||
      raw.OBJECTID ||
      raw.id ||
      raw.ID ||
      raw.record_id ||
      raw.RECORD_ID
    );
  }

  function validationResult_(
    connector,
    normalized,
    context
  ) {
    var validation =
      connector.validate
        ? connector.validate(
            normalized,
            context
          )
        : REOS.CountyConnectorSDK
            .validateLead(
              normalized
            );

    if (
      validation ===
      true
    ) {
      return {
        ok:
          true,

        errors:
          []
      };
    }

    return validation || {
      ok:
        false,

      errors:
        [
          'No validation result.'
        ]
    };
  }

  function validateNormalizedIdentity_(
    connector,
    normalized,
    context,
    candidate
  ) {
    if (
      !normalized ||
      normalized.__skip ===
        true
    ) {
      throw new Error(
        'Certified C1 source record is filtered; no insert executed.'
      );
    }

    var validation =
      validationResult_(
        connector,
        normalized,
        context
      );

    if (
      !validation ||
      !validation.ok
    ) {
      throw new Error(
        'Certified C1 source record failed validation; no insert executed.'
      );
    }

    if (
      text_(normalized.Source) !==
        CONNECTOR_ID ||
      text_(
        normalized[
          'Source Dataset'
        ]
      ) !==
        DATASET ||
      text_(
        normalized[
          'Source Record ID'
        ]
      ) !==
        candidate
          .immutableSourceRecordId
    ) {
      throw new Error(
        'Certified C1 normalized source identity drifted; no insert executed.'
      );
    }

    var identity =
      REOS.CanonicalPropertyIdentity
        .resolve(
          normalized
        );

    if (
      !identity ||
      text_(
        identity
          .sourceObservationKey
      ) !==
        candidate
          .sourceObservationKey ||
      text_(
        identity
          .canonicalPropertyKey
      ) !==
        candidate
          .expectedCanonicalPropertyKey
    ) {
      throw new Error(
        'Certified C1 canonical identity drifted; no insert executed.'
      );
    }

    return identity;
  }

  function fetchFreshSource_(
    candidate
  ) {
    REOS.CountyRuntimeBridge
      .registerConnectors();

    var connector =
      REOS.CountyConnectorSDK
        .get(
          CONNECTOR_ID
        );

    if (
      !connector ||
      typeof connector.normalize !==
        'function'
    ) {
      throw new Error(
        'Registered Philadelphia connector is incomplete.'
      );
    }

    var now =
      new Date();

    var context = {
      runId:
        'C1-RECOVERY-' +
        candidate
          .immutableSourceRecordId +
        '-' +
        now.getTime(),

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      cursor:
        '0',

      limit:
        1,

      since:
        null,

      dryRun:
        true,

      config:
        {},

      now:
        now
    };

    var response =
      REOS.CountyAdapters.Registry
        .fetch(
          'arcgis',
          {
            endpoint:
              getEndpoint_(),

            context:
              context,

            maxLimit:
              1,

            where:
              'objectid IN (' +
              Number(
                candidate
                  .immutableSourceRecordId
              ) +
              ')',

            outFields:
              '*',

            returnGeometry:
              false,

            orderByFields:
              'objectid ASC'
          }
        ) || {};

    var records =
      Array.isArray(
        response.records
      )
        ? response.records
        : [];

    if (
      records.length !==
        1 ||
      rawSourceRecordId_(
        records[0]
      ) !==
        candidate
          .immutableSourceRecordId
    ) {
      throw new Error(
        'Certified C1 exact source record is absent or non-unique; no insert executed.'
      );
    }

    var normalized =
      connector.normalize(
        records[0],
        context
      );

    var identity =
      validateNormalizedIdentity_(
        connector,
        normalized,
        context,
        candidate
      );

    return {
      connector:
        connector,

      context:
        context,

      normalizedSourceRecord:
        normalized,

      normalizedSourceRecordSha256:
        sha256_(
          normalized
        ),

      identity:
        {
          sourceObservationKey:
            text_(
              identity
                .sourceObservationKey
            ),

          canonicalPropertyKey:
            text_(
              identity
                .canonicalPropertyKey
            )
        }
    };
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
      )
    ) {
      throw new Error(
        'DISTRESS_LEADS schema differs from certified C1 insert boundary.'
      );
    }

    return {
      headerCount:
        actual.length
    };
  }

  function persistedMatches_(
    rows,
    sourceObservationKey
  ) {
    var matches =
      [];

    (rows || [])
      .forEach(function (row) {
        row =
          row ||
          {};

        var stored =
          text_(
            row[
              'Source Observation Key'
            ]
          );

        var legacy =
          text_(
            row[
              'Source Record Key'
            ]
          );

        var source =
          text_(
            row.Source
          );

        var dataset =
          text_(
            row[
              'Source Dataset'
            ]
          );

        var sourceRecordId =
          text_(
            row[
              'Source Record ID'
            ]
          );

        var reconstructed =
          '';

        if (
          source &&
          dataset &&
          sourceRecordId
        ) {
          reconstructed =
            [
              source.toLowerCase(),
              dataset.toLowerCase(),
              sourceRecordId.toLowerCase()
            ].join('|');
        }

        if (
          stored ===
            sourceObservationKey ||
          legacy ===
            sourceObservationKey ||
          reconstructed ===
            sourceObservationKey
        ) {
          matches.push(
            row
          );
        }
      });

    return matches;
  }

  function execute(options) {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    options =
      options ||
      {};

    if (
      options.confirmInsert !==
        true
    ) {
      throw new Error(
        'C1 insert-only recovery requires confirmInsert=true.'
      );
    }

    if (
      Object.prototype
        .hasOwnProperty.call(
          options,
          'candidates'
        ) ||
      Object.prototype
        .hasOwnProperty.call(
          options,
          'sourceObservationKeys'
        )
    ) {
      throw new Error(
        'C1 recovery accepts exactly one sourceObservationKey.'
      );
    }

    requireAuthorityMetadata_();

    var candidate =
      resolveCertifiedCandidate_(
        options
          .sourceObservationKey
      );

    /*
     * A separately opened maintenance gate is required before network
     * retrieval. The gate itself grants no insert authority; it proves
     * that the approved quiescence boundary is active for this candidate.
     */
    var maintenance =
      REOS.CountyC1MaintenanceGate
        .assertRecoveryReady({
          sourceObservationKey:
            candidate
              .sourceObservationKey,

          maintenanceToken:
            text_(
              options
                .maintenanceToken
            )
        });

    if (
      !maintenance ||
      maintenance.ready !==
        true ||
      !text_(
        maintenance.gateId
      )
    ) {
      throw new Error(
        'Certified C1 maintenance gate is not recovery-ready.'
      );
    }

    /*
     * NETWORK READ before lock acquisition.
     *
     * This is intentionally independent of CountyC1LivePreflight.
     * A separately executed no-write live preflight remains an
     * operational prerequisite for an authorized production run.
     */
    var source =
      fetchFreshSource_(
        candidate
      );

    var insertAttempted =
      false;

    try {
      return REOS.Database
        .withScriptLockContext(
          function (lockContext) {
            /*
             * Rebind to the certified embedded authority while the
             * exclusive database lock is held.
             */
            requireAuthorityMetadata_();

            var lockedCandidate =
              resolveCertifiedCandidate_(
                candidate
                  .sourceObservationKey
              );

            if (
              !candidateEqual_(
                candidate,
                lockedCandidate
              )
            ) {
              throw new Error(
                'Certified C1 authority changed before insert; no insert executed.'
              );
            }

            /*
             * Recheck the same quiescence capability while the exclusive
             * database lock is owned. A changed/closed/expired gate or any
             * newly installed project trigger fails before Database.insert.
             */
            var lockedMaintenance =
              REOS.CountyC1MaintenanceGate
                .assertRecoveryReady({
                  sourceObservationKey:
                    lockedCandidate
                      .sourceObservationKey,

                  maintenanceToken:
                    text_(
                      options
                        .maintenanceToken
                    )
                });

            if (
              !lockedMaintenance ||
              lockedMaintenance.ready !==
                true ||
              text_(
                lockedMaintenance
                  .gateId
              ) !==
                text_(
                  maintenance
                    .gateId
                )
            ) {
              throw new Error(
                'C1 maintenance gate changed before insert; no insert executed.'
              );
            }

            var schema =
              assertSchemaExact_();

            /*
             * Revalidate the already-fetched source payload under the
             * same lock as the final persisted-table existence check.
             */
            var lockedIdentity =
              validateNormalizedIdentity_(
                source.connector,
                source
                  .normalizedSourceRecord,
                source.context,
                lockedCandidate
              );

            var beforeRows =
              REOS.Database
                .getAll(
                  TABLE
                );

            var beforeMatches =
              persistedMatches_(
                beforeRows,
                lockedCandidate
                  .sourceObservationKey
              );

            if (
              beforeMatches.length !==
                0
            ) {
              throw new Error(
                'C1 source observation already exists; no insert executed.'
              );
            }

            var insertRecord =
              Object.assign(
                {},
                source
                  .normalizedSourceRecord,
                {
                  'Source Record Key':
                    lockedCandidate
                      .sourceObservationKey,

                  'Source Observation Key':
                    lockedCandidate
                      .sourceObservationKey,

                  'Canonical Property Key':
                    text_(
                      lockedIdentity
                        .canonicalPropertyKey
                    ),

                  'Last Seen At':
                    new Date()
                }
              );

            delete insertRecord._rowNumber;
            delete insertRecord[
              'Distress Lead ID'
            ];

            /*
             * The only mutation primitive in this module.
             */
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
                'Inserted C1 row returned no Distress Lead ID.'
              );
            }

            /*
             * Exact post-insert reconciliation while the same database
             * lock remains owned.
             */
            var afterRows =
              REOS.Database
                .getAll(
                  TABLE
                );

            var afterMatches =
              persistedMatches_(
                afterRows,
                lockedCandidate
                  .sourceObservationKey
              );

            if (
              afterMatches.length !==
                1
            ) {
              throw new Error(
                'C1 post-insert observation count is not exactly one.'
              );
            }

            var reconciled =
              afterMatches[0];

            if (
              text_(
                reconciled[
                  'Distress Lead ID'
                ]
              ) !==
                insertedId ||
              text_(
                reconciled[
                  'Source Record ID'
                ]
              ) !==
                lockedCandidate
                  .immutableSourceRecordId ||
              text_(
                reconciled[
                  'Source Observation Key'
                ]
              ) !==
                lockedCandidate
                  .sourceObservationKey ||
              text_(
                reconciled[
                  'Canonical Property Key'
                ]
              ) !==
                lockedCandidate
                  .expectedCanonicalPropertyKey
            ) {
              throw new Error(
                'C1 post-insert identity reconciliation failed.'
              );
            }

            return {
              ok:
                true,

              mode:
                'EXPLICIT_SINGLE_C1_INSERT_ONLY',

              phase:
                'c1_insert_only_recovery',

              maintenanceGateId:
                text_(
                  lockedMaintenance
                    .gateId
                ),

              sourceObservationKey:
                lockedCandidate
                  .sourceObservationKey,

              immutableSourceRecordId:
                lockedCandidate
                  .immutableSourceRecordId,

              canonicalPropertyKey:
                lockedCandidate
                  .expectedCanonicalPropertyKey,

              insertedDistressLeadId:
                insertedId,

              sourceContentChanged:
                Boolean(
                  lockedCandidate
                    .historicalNormalizedSourceRecordSha256 &&
                  lockedCandidate
                    .historicalNormalizedSourceRecordSha256 !==
                    source
                      .normalizedSourceRecordSha256
                ),

              normalizedSourceRecordSha256:
                source
                  .normalizedSourceRecordSha256,

              schemaHeaderCount:
                schema.headerCount,

              preInsertObservationCount:
                0,

              postInsertObservationCount:
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

              automaticMutationAuthorityGranted:
                false,

              automaticInsertAuthorityGranted:
                false,

              schedulerAuthorityGranted:
                false,

              offerAuthorityGranted:
                false
            };
          }
        );
    } catch (error) {
      if (
        insertAttempted
      ) {
        throw new Error(
          'C1_INSERT_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY: ' +
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

  return {
    execute:
      execute
  };
})();


function reosCountyC1InsertRecovery(
  options
) {
  return REOS
    .CountyC1InsertRecovery
    .execute(
      options ||
      {}
    );
}
