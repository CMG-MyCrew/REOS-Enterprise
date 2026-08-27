/**
 * REOS Enterprise - County C1 Live Preflight
 *
 * Phase C.5 read-only live preflight for previously certified
 * C1 missing-observation recovery candidates.
 *
 * This module:
 * - accepts only explicitly identified C1 candidates
 * - is bounded to at most 25 candidates per invocation
 * - performs one exact immutable-record source lookup
 * - performs one fresh DISTRESS_LEADS read
 * - checks modern, legacy-alias, and reconstructed observation identity
 * - returns evidence only
 *
 * This module DOES NOT:
 * - insert/update/upsert/delete DISTRESS_LEADS
 * - migrate schema
 * - create repair authority
 * - create migration authority
 * - create insert authority
 * - invoke the county SDK persistence execution path
 * - call CountyRuntimeBridge.run/sync/dryRun
 * - execute a scheduler
 * - create or change triggers
 *
 * A successful preflight means only:
 * C1_LIVE_PRECHECK_SATISFIED_NO_WRITE_AUTHORITY
 */
var REOS = REOS || {};

REOS.CountyC1LivePreflight = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var MAX_CANDIDATES =
    25;

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
        var value =
          byte < 0
            ? byte + 256
            : byte;

        return (
          value < 16
            ? '0'
            : ''
        ) + value.toString(16);
      })
      .join('');
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getAll !==
        'function'
    ) {
      throw new Error(
        'Database.getAll is required.'
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
        'CountyConnectorSDK registry access is required.'
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
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.Registry ||
      typeof REOS.CountyAdapters.Registry.fetch !==
        'function'
    ) {
      throw new Error(
        'County ArcGIS adapter registry is required.'
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
        'Utilities.computeDigest is required.'
      );
    }
  }

  function requireCertifiedAuthorityMetadata_() {
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

    var normalizedSourceSha =
      text_(
        candidate
          .historicalNormalizedSourceRecordSha256
      );

    var descriptorSha =
      text_(
        candidate
          .descriptorSha256
      );

    if (
      candidate.planningClass !==
        'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE' ||
      text_(
        candidate
          .sourceObservationKey
      ) !==
        key ||
      candidate.connectorId !==
        CONNECTOR_ID ||
      candidate.dataset !==
        DATASET ||
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

    if (
      !/^[0-9a-f]{64}$/.test(
        normalizedSourceSha
      )
    ) {
      throw new Error(
        'Certified C1 historical source hash is invalid.'
      );
    }

    if (
      !/^[0-9a-f]{64}$/.test(
        descriptorSha
      )
    ) {
      throw new Error(
        'Certified C1 descriptor hash is invalid.'
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
        normalizedSourceSha,

      descriptorSha256:
        descriptorSha
    };
  }

  function normalizeOptions_(options) {
    options =
      options || {};

    /*
     * Legacy caller-supplied candidate descriptors are deliberately
     * rejected. Identity authority must come only from the embedded,
     * checksum-certified C1 catalog.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        options,
        'candidates'
      )
    ) {
      throw new Error(
        'Caller-supplied C1 candidate descriptors are prohibited.'
      );
    }

    var sourceObservationKeys =
      options.sourceObservationKeys;

    if (
      !Array.isArray(
        sourceObservationKeys
      ) ||
      sourceObservationKeys.length < 1 ||
      sourceObservationKeys.length >
        MAX_CANDIDATES
    ) {
      throw new Error(
        'C1 live preflight requires 1-' +
        MAX_CANDIDATES +
        ' certified Source Observation Keys.'
      );
    }

    var keys =
      sourceObservationKeys
        .map(function (value) {
          var key =
            text_(value);

          if (!key) {
            throw new Error(
              'Certified C1 Source Observation Key is required.'
            );
          }

          return key;
        });

    var observationSeen =
      {};

    keys.forEach(function (key) {
      if (
        observationSeen[
          key
        ]
      ) {
        throw new Error(
          'Duplicate certified C1 Source Observation Key is prohibited.'
        );
      }

      observationSeen[
        key
      ] =
        true;
    });

    /*
     * Validate the entire authority catalog contract before resolving
     * caller-selected keys. This still performs no network/table I/O.
     */
    var authorityMetadata =
      requireCertifiedAuthorityMetadata_();

    var candidates =
      keys.map(
        resolveCertifiedCandidate_
      );

    var sourceIdSeen =
      {};

    candidates.forEach(
      function (candidate) {
        if (
          sourceIdSeen[
            candidate
              .immutableSourceRecordId
          ]
        ) {
          throw new Error(
            'Duplicate certified C1 immutable source record ID is prohibited.'
          );
        }

        sourceIdSeen[
          candidate
            .immutableSourceRecordId
        ] =
          true;
      }
    );

    return {
      authorityMetadata:
        authorityMetadata,

      candidates:
        candidates
    };
  }

  function getEndpoint_() {
    var properties =
      PropertiesService
        .getScriptProperties();

    var endpoint =
      text_(
        properties.getProperty(
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
      raw || {};

    return text_(
      raw.objectid ||
      raw.OBJECTID ||
      raw.id ||
      raw.ID ||
      raw.record_id ||
      raw.RECORD_ID
    );
  }

  function rowSummary_(row) {
    return {
      rowNumber:
        Number(
          row._rowNumber ||
          0
        ),

      distressLeadId:
        text_(
          row[
            'Distress Lead ID'
          ]
        ),

      source:
        text_(
          row.Source
        ),

      sourceDataset:
        text_(
          row[
            'Source Dataset'
          ]
        ),

      sourceRecordId:
        text_(
          row[
            'Source Record ID'
          ]
        ),

      sourceRecordKey:
        text_(
          row[
            'Source Record Key'
          ]
        ),

      storedSourceObservationKey:
        text_(
          row[
            'Source Observation Key'
          ]
        ),

      storedCanonicalPropertyKey:
        text_(
          row[
            'Canonical Property Key'
          ]
        )
    };
  }

  function buildPersistedIndex_(rows) {
    var index =
      {};

    (rows || [])
      .filter(function (row) {
        return (
          text_(row.Source) ===
            CONNECTOR_ID &&
          text_(
            row[
              'Source Dataset'
            ]
          ) ===
            DATASET
        );
      })
      .forEach(function (row) {
        var keys =
          {};

        var storedObservationKey =
          text_(
            row[
              'Source Observation Key'
            ]
          );

        var legacyAlias =
          text_(
            row[
              'Source Record Key'
            ]
          );

        if (storedObservationKey) {
          keys[
            storedObservationKey
          ] =
            'STORED_SOURCE_OBSERVATION_KEY';
        }

        if (legacyAlias) {
          keys[
            legacyAlias
          ] =
            'LEGACY_SOURCE_RECORD_KEY_ALIAS';
        }

        /*
         * Source-observation identity does not depend on canonical
         * property resolution. Reconstruct it directly from the exact
         * source + dataset + immutable Source Record ID so a malformed
         * or conflicting canonical-property row cannot silently bypass
         * the persisted-observation defense.
         */
        var reconstructedSourceRecordId =
          text_(
            row[
              'Source Record ID'
            ]
          );

        if (reconstructedSourceRecordId) {
          var reconstructed =
            [
              text_(
                row.Source
              ).toLowerCase(),

              text_(
                row[
                  'Source Dataset'
                ]
              ).toLowerCase(),

              reconstructedSourceRecordId
                .toLowerCase()
            ].join('|');

          keys[
            reconstructed
          ] =
            keys[reconstructed] ||
            'RECONSTRUCTED_SOURCE_OBSERVATION_KEY';
        }

        Object.keys(keys)
          .forEach(function (key) {
            index[key] =
              index[key] || [];

            index[key]
              .push({
                matchType:
                  keys[key],

                row:
                  row
              });
          });
      });

    return index;
  }

  function fetchExactSourceRecords_(
    candidates,
    endpoint
  ) {
    var ids =
      candidates
        .map(function (candidate) {
          return Number(
            candidate
              .immutableSourceRecordId
          );
        })
        .sort(function (a, b) {
          return a - b;
        });

    var where =
      'objectid IN (' +
      ids.join(',') +
      ')';

    var context = {
      runId:
        'PHASE-C5-C1-READ-ONLY',

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      cursor:
        '0',

      limit:
        candidates.length,

      since:
        null,

      dryRun:
        true,

      config:
        {},

      now:
        new Date()
    };

    var response =
      REOS.CountyAdapters.Registry
        .fetch(
          'arcgis',
          {
            endpoint:
              endpoint,

            context:
              context,

            maxLimit:
              MAX_CANDIDATES,

            where:
              where,

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
      records.length >
      candidates.length
    ) {
      throw new Error(
        'Exact source lookup returned more records than requested.'
      );
    }

    var requested =
      {};

    candidates.forEach(
      function (candidate) {
        requested[
          candidate
            .immutableSourceRecordId
        ] =
          true;
      }
    );

    var byId =
      {};

    records.forEach(
      function (raw) {
        var sourceId =
          rawSourceRecordId_(
            raw
          );

        if (
          !sourceId ||
          !requested[sourceId]
        ) {
          throw new Error(
            'Exact source lookup returned an unrequested immutable source record.'
          );
        }

        byId[sourceId] =
          byId[sourceId] || [];

        byId[sourceId]
          .push(raw);
      }
    );

    return {
      where:
        where,

      records:
        records,

      byId:
        byId,

      responseMetadata:
        safeValue_(
          response.metadata ||
          {}
        )
    };
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
        : REOS
            .CountyConnectorSDK
            .validateLead(
              normalized
            );

    if (
      validation === true
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

  function preflight(options) {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    options =
      normalizeOptions_(
        options
      );

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

    var endpoint =
      getEndpoint_();

    /*
     * Fresh persisted read. No schema migration, update, or write.
     */
    var allRows =
      REOS.Database
        .getAll(TABLE);

    var persistedIndex =
      buildPersistedIndex_(
        allRows
      );

    /*
     * Exactly one bounded NETWORK READ.
     *
     * Identity is selected by immutable objectid values, not pagination
     * offset. The county SDK persistence execution path is prohibited.
     */
    var source =
      fetchExactSourceRecords_(
        options.candidates,
        endpoint
      );

    var context = {
      runId:
        'PHASE-C5-C1-READ-ONLY',

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      cursor:
        '0',

      limit:
        options.candidates
          .length,

      since:
        null,

      dryRun:
        true,

      config:
        {},

      now:
        new Date()
    };

    var results =
      [];

    options.candidates
      .forEach(function (candidate) {
        var persistedMatches =
          persistedIndex[
            candidate
              .sourceObservationKey
          ] || [];

        var persistedEvidence =
          persistedMatches
            .map(function (match) {
              return {
                matchType:
                  match.matchType,

                row:
                  rowSummary_(
                    match.row
                  )
              };
            });

        var rawMatches =
          source.byId[
            candidate
              .immutableSourceRecordId
          ] || [];

        var result = {
          sourceObservationKey:
            candidate
              .sourceObservationKey,

          immutableSourceRecordId:
            candidate
              .immutableSourceRecordId,

          expectedCanonicalPropertyKey:
            candidate
              .expectedCanonicalPropertyKey,

          descriptorSha256:
            candidate
              .descriptorSha256,

          persistedMatchCount:
            persistedEvidence.length,

          persistedMatches:
            persistedEvidence,

          sourceMatchCount:
            rawMatches.length,

          outcome:
            '',

          mutationAuthorized:
            false,

          insertAuthorized:
            false,

          updateAuthorized:
            false,

          deleteAuthorized:
            false,

          canonicalOverwriteAuthorized:
            false
        };

        if (
          persistedEvidence.length >
          0
        ) {
          result.outcome =
            'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT';

          results.push(
            result
          );

          return;
        }

        if (
          rawMatches.length ===
          0
        ) {
          result.outcome =
            'SOURCE_RECORD_NO_LONGER_PRESENT_STOP_NO_MUTATION';

          results.push(
            result
          );

          return;
        }

        if (
          rawMatches.length !==
          1
        ) {
          result.outcome =
            'SOURCE_IDENTITY_NONUNIQUE_STOP_NO_MUTATION';

          results.push(
            result
          );

          return;
        }

        var normalized;

        try {
          normalized =
            connector.normalize(
              rawMatches[0],
              context
            );
        } catch (error) {
          result.outcome =
            'SOURCE_NORMALIZATION_FAILED_STOP_NO_MUTATION';

          result.error =
            error &&
            error.message
              ? error.message
              : String(error);

          results.push(
            result
          );

          return;
        }

        if (
          normalized &&
          normalized.__skip ===
            true
        ) {
          result.outcome =
            'SOURCE_RECORD_FILTERED_STOP_NO_MUTATION';

          result.skipReason =
            text_(
              normalized
                .__skipReason
            );

          results.push(
            result
          );

          return;
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
          result.outcome =
            'SOURCE_RECORD_INVALID_STOP_NO_MUTATION';

          result.validationErrors =
            validation &&
            validation.errors
              ? validation.errors
                  .slice()
              : [];

          results.push(
            result
          );

          return;
        }

        var identity;

        try {
          identity =
            REOS
              .CanonicalPropertyIdentity
              .resolve(
                normalized
              );
        } catch (error) {
          result.outcome =
            'SOURCE_IDENTITY_RESOLUTION_FAILED_STOP_NO_MUTATION';

          result.error =
            error &&
            error.message
              ? error.message
              : String(error);

          results.push(
            result
          );

          return;
        }

        var freshSourceRecordId =
          text_(
            normalized[
              'Source Record ID'
            ]
          );

        var freshObservationKey =
          text_(
            identity
              .sourceObservationKey
          );

        var freshCanonicalKey =
          text_(
            identity
              .canonicalPropertyKey
          );

        var normalizedHash =
          sha256_(
            normalized
          );

        result.freshSourceIdentity = {
          immutableSourceRecordId:
            freshSourceRecordId,

          sourceObservationKey:
            freshObservationKey,

          canonicalPropertyKey:
            freshCanonicalKey,

          normalizedSourceRecordSha256:
            normalizedHash,

          historicalNormalizedSourceRecordSha256:
            candidate
              .historicalNormalizedSourceRecordSha256,

          sourceContentChanged:
            Boolean(
              candidate
                .historicalNormalizedSourceRecordSha256 &&
              candidate
                .historicalNormalizedSourceRecordSha256 !==
                normalizedHash
            )
        };

        result.normalizedSourceRecord =
          safeValue_(
            normalized
          );

        if (
          freshSourceRecordId !==
          candidate
            .immutableSourceRecordId
        ) {
          result.outcome =
            'SOURCE_IMMUTABLE_ID_DRIFT_STOP_NO_MUTATION';

          results.push(
            result
          );

          return;
        }

        if (
          freshObservationKey !==
          candidate
            .sourceObservationKey
        ) {
          result.outcome =
            'SOURCE_IDENTITY_DRIFT_STOP_NO_MUTATION';

          results.push(
            result
          );

          return;
        }

        if (
          freshCanonicalKey !==
          candidate
            .expectedCanonicalPropertyKey
        ) {
          result.outcome =
            'CANONICAL_IDENTITY_DRIFT_STOP_NO_MUTATION';

          results.push(
            result
          );

          return;
        }

        /*
         * Identity remained exact and the persisted observation is still
         * absent. This is intentionally NOT insert authority.
         *
         * Mutable source content may legitimately change while immutable
         * observation/property identity remains stable; therefore the
         * historical normalized-record hash is reported as evidence but
         * does not itself authorize or block identity.
         */
        result.outcome =
          'C1_LIVE_PRECHECK_SATISFIED_NO_WRITE_AUTHORITY';

        results.push(
          result
        );
      });

    var outcomeCounts =
      {};

    results.forEach(
      function (result) {
        outcomeCounts[
          result.outcome
        ] =
          (
            outcomeCounts[
              result.outcome
            ] ||
            0
          ) + 1;
      }
    );

    return {
      ok:
        true,

      mode:
        'READ_ONLY',

      phase:
        'c1_live_preflight',

      sourceAccess:
        'NETWORK_READ_ONLY',

      tableAccess:
        'READ_ONLY',

      scope: {
        connectorId:
          CONNECTOR_ID,

        dataset:
          DATASET,

        candidateCount:
          options.candidates
            .length,

        maxCandidates:
          MAX_CANDIDATES,

        authorityBound:
          true,

        authorityDescriptorSourceSha256:
          options.authorityMetadata
            .descriptorSourceSha256,

        authorityCatalogSha256:
          options.authorityMetadata
            .catalogSha256,

        authorityDescriptorCount:
          options.authorityMetadata
            .descriptorCount
      },

      sourceLookup: {
        lookupType:
          'EXACT_IMMUTABLE_SOURCE_RECORD_ID',

        where:
          source.where,

        fetchedRecordCount:
          source.records
            .length,

        metadata:
          source
            .responseMetadata,

        fullWindowReplay:
          false,

        offsetIdentityAuthority:
          false
      },

      persistedRead: {
        table:
          TABLE,

        totalRowsRead:
          allRows.length,

        freshRead:
          true
      },

      outcomeCounts:
        outcomeCounts,

      results:
        results,

      successfulPrecheckCount:
        outcomeCounts[
          'C1_LIVE_PRECHECK_SATISFIED_NO_WRITE_AUTHORITY'
        ] || 0,

      writeReadyCount:
        0,

      sameInvocationWriteAllowed:
        false,

      executableWritePayloadGenerated:
        false,

      repairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      repairPlanAuthorityGranted:
        false,

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      updateAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      deduplicationAuthorityGranted:
        false,

      identifierRewriteAuthorityGranted:
        false,

      canonicalOverwriteAuthorityGranted:
        false
    };
  }

  return {
    preflight:
      preflight
  };
})();


function reosCountyC1LivePreflight(
  options
) {
  return REOS
    .CountyC1LivePreflight
    .preflight(
      options
    );
}
