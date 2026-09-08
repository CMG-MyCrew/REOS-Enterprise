/**
 * REOS Enterprise
 * Code Violations Production Completion - Gate 1 Reconciliation
 *
 * Read-only population reconciliation for the original certified
 * 168 Philadelphia code-violation observations.
 *
 * Cohort membership is fixed by durable Violation Number authority.
 * Current ArcGIS ObjectID is diagnostic telemetry only.
 * Certified historical ObjectID is retained solely for legacy-key
 * compatibility reconciliation.
 *
 * Proven population:
 * - 168 certified durable Violation Numbers
 * - 153 currently OPEN/actionable
 * - 15 currently filtered non-OPEN
 *
 * This module does NOT:
 * - mutate DISTRESS_LEADS
 * - execute a county connector
 * - mutate or retire a checkpoint
 * - install/remove scheduler triggers
 * - migrate identity
 * - grant repair or offer authority
 */
var REOS = REOS || {};

REOS.CountyCodeViolationGate1Reconciliation = (function () {
  'use strict';

  var TABLE = 'DISTRESS_LEADS';
  var CONNECTOR_ID = 'PA-PHILADELPHIA';
  var DATASET = 'code_violations';

  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var EXPECTED_POPULATION_COUNT = 168;
  var EXPECTED_OPEN_COUNT = 153;

  var SOURCE_CHUNK_SIZE = 20;

  var EARLIEST_TIMESTAMP =
    '2025-09-01 00:00:00';

  var LATEST_TIMESTAMP =
    '2026-06-27 07:28:16';

  var EXPECTED_POPULATION_MANIFEST_SHA256 =
    'ebc0936a9fc3b4a5643e8a834ab7c068d2b1d2f15335b2fe9f365fe1e24a6b13';

  var EXPECTED_POPULATION_SOURCE_EVIDENCE_SHA256 =
    '5958a94f9fa2b571b32cb4dd9dc43476b8877a59f37ebdd4c697faf033b445b3';

  var PRIORITY_SQL =
    "'UNSAFE','IMMINENTLY DANGEROUS','UNFIT','HAZARDOUS','UNLAWFUL'";

  var CLASSIFICATIONS = {
    ALREADY_SAFE: 'ALREADY_SAFE',
    MISSING: 'MISSING',
    DUPLICATE_DURABLE: 'DUPLICATE_DURABLE',
    PROPERTY_CONFLICT: 'PROPERTY_CONFLICT',
    LEGACY_OBJECTID_COLLISION:
      'LEGACY_OBJECTID_COLLISION',
    SOURCE_IDENTITY_UNAVAILABLE:
      'SOURCE_IDENTITY_UNAVAILABLE'
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

  function sqlString_(value) {
    return (
      "'" +
      text_(value)
        .replace(/'/g, "''") +
      "'"
    );
  }


  function requirePopulationAuthority_() {
    var authority =
      REOS
        .CountyCodeViolationGate1PopulationAuthority;

    if (
      !authority ||
      typeof authority.metadata !== 'function' ||
      typeof authority.resolve !== 'function' ||
      typeof authority.contains !== 'function' ||
      typeof authority.violationNumbers !== 'function'
    ) {
      throw new Error(
        'Gate 1 certified durable population authority is unavailable.'
      );
    }

    var metadata =
      authority.metadata();

    if (
      !metadata ||
      metadata.mode !==
        'READ_ONLY_GATE1_CERTIFIED_POPULATION_AUTHORITY' ||
      metadata.connectorId !==
        CONNECTOR_ID ||
      metadata.dataset !==
        DATASET ||
      Number(metadata.populationCount) !==
        EXPECTED_POPULATION_COUNT ||
      Number(metadata.recordCount) !==
        EXPECTED_POPULATION_COUNT ||
      Number(metadata.openActionableCount) !==
        EXPECTED_OPEN_COUNT ||
      Number(metadata.nonOpenCount) !==
        EXPECTED_POPULATION_COUNT -
        EXPECTED_OPEN_COUNT ||
      metadata.durableIdentityField !==
        'Violation Number' ||
      metadata.currentObjectIdIsMembershipAuthority !==
        false ||
      metadata.currentObjectIdIsRecoveryAuthority !==
        false ||
      metadata.certifiedEvidenceObjectIdIsLegacyCompatibilityEvidence !==
        true ||
      metadata.manifestSha256 !==
        EXPECTED_POPULATION_MANIFEST_SHA256 ||
      metadata.sourceEvidenceSha256 !==
        EXPECTED_POPULATION_SOURCE_EVIDENCE_SHA256
    ) {
      throw new Error(
        'Gate 1 certified durable population authority metadata mismatch.'
      );
    }

    var violationNumbers =
      authority
        .violationNumbers()
        .map(upper_);

    if (
      violationNumbers.length !==
      EXPECTED_POPULATION_COUNT
    ) {
      throw new Error(
        'Gate 1 certified durable population authority count mismatch.'
      );
    }

    var seen = {};

    violationNumbers.forEach(
      function (violationNumber) {
        var resolved =
          authority.resolve(
            violationNumber
          );

        if (
          !violationNumber ||
          seen[violationNumber] ||
          !resolved ||
          upper_(
            resolved.violationNumber
          ) !==
            violationNumber ||
          !/^[0-9]+$/.test(
            text_(
              resolved.evidenceObjectId
            )
          )
        ) {
          throw new Error(
            'Gate 1 certified durable population record is invalid: ' +
            violationNumber
          );
        }

        seen[violationNumber] = true;
      }
    );

    return {
      authority:
        authority,

      metadata:
        metadata,

      violationNumbers:
        violationNumbers
    };
  }


  function keyPart_(value) {
    return text_(value)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');
  }

  function normalizeObservationKey_(value) {
    var parts = text_(value).split('|');

    if (parts.length !== 3) {
      return '';
    }

    return [
      keyPart_(parts[0]),
      keyPart_(parts[1]),
      keyPart_(parts[2])
    ].join('|');
  }

  function durableKey_(violationNumber) {
    var value = upper_(violationNumber);

    if (!value) {
      return '';
    }

    return [
      keyPart_(CONNECTOR_ID),
      keyPart_(DATASET),
      keyPart_(value)
    ].join('|');
  }

  function legacyObjectIdKey_(objectId) {
    var value = text_(objectId);

    if (!value || !/^[0-9]+$/.test(value)) {
      return '';
    }

    return [
      keyPart_(CONNECTOR_ID),
      keyPart_(DATASET),
      keyPart_(value)
    ].join('|');
  }

  function managedTriggerCount_() {
    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger.getHandlerFunction ===
            'function' &&
          trigger.getHandlerFunction() ===
            'reosCountyProductionSchedulerRun'
        );
      })
      .length;
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getAll !== 'function'
    ) {
      throw new Error(
        'Gate 1 requires read-only Database.getAll.'
      );
    }

    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Gate 1 requires admin authority.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity !==
        'function'
    ) {
      throw new Error(
        'Gate 1 requires CanonicalPropertyIdentity.'
      );
    }

    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.ArcGIS ||
      typeof REOS.CountyAdapters.ArcGIS.fetch !==
        'function'
    ) {
      throw new Error(
        'Gate 1 requires the read-only ArcGIS adapter.'
      );
    }
  }

  function requireCertifiedEndpoint_() {
    var endpoint = text_(
      PropertiesService
        .getScriptProperties()
        .getProperty(ENDPOINT_PROPERTY)
    );

    if (endpoint !== CERTIFIED_ENDPOINT) {
      throw new Error(
        'Gate 1 certified endpoint authority mismatch.'
      );
    }

    return endpoint;
  }

  function canonicalKey_(record) {
    var result =
      REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity(
          record || {}
        );

    return result && result.ok
      ? text_(result.key)
      : '';
  }

  function sourceCandidate_(raw) {
    return {
      Source: CONNECTOR_ID,
      'Source Dataset': DATASET,
      'Source Record ID':
        text_(raw.objectid || raw.OBJECTID),
      'Violation Number':
        upper_(
          raw.violationnumber ||
          raw.VIOLATIONNUMBER
        ),
      'Parcel ID':
        text_(
          raw.parcel_id_num ||
          raw.opa_account_num
        ),
      Address:
        text_(raw.address),
      City: 'Philadelphia',
      State: 'PA',
      County: 'Philadelphia',
      Zip: text_(raw.zip)
    };
  }

  function sourceSummary_(
    raw,
    certifiedRecord
  ) {
    var candidate =
      sourceCandidate_(raw);

    var currentObjectId =
      text_(
        raw.objectid ||
        raw.OBJECTID
      );

    var certifiedEvidenceObjectId =
      text_(
        certifiedRecord &&
        certifiedRecord
          .evidenceObjectId
      );

    return {
      /*
       * Current ObjectID is telemetry only.
       */
      objectId:
        currentObjectId,

      currentObjectId:
        currentObjectId,

      currentObjectIdObservationKey:
        legacyObjectIdKey_(
          currentObjectId
        ),

      /*
       * Historical certified ObjectID is used only to inspect whether
       * the original legacy observation key is already bound to a
       * different durable Violation Number.
       */
      certifiedEvidenceObjectId:
        certifiedEvidenceObjectId,

      violationNumber:
        candidate['Violation Number'],

      violationDate:
        raw.violationdate,

      parcelId:
        candidate['Parcel ID'],

      address:
        candidate.Address,

      violationStatus:
        upper_(raw.violationstatus),

      priority:
        upper_(raw.caseprioritydesc),

      durableObservationKey:
        durableKey_(
          candidate['Violation Number']
        ),

      legacyObjectIdObservationKey:
        legacyObjectIdKey_(
          certifiedEvidenceObjectId
        ),

      canonicalPropertyKey:
        canonicalKey_(candidate)
    };
  }

  function persistedSummary_(row) {
    return {
      rowNumber:
        Number(row._rowNumber || 0),
      distressLeadId:
        text_(row['Distress Lead ID']),
      sourceRecordId:
        text_(row['Source Record ID']),
      violationNumber:
        upper_(row['Violation Number']),
      parcelId:
        text_(row['Parcel ID']),
      address:
        text_(row.Address),
      sourceObservationKey:
        text_(row['Source Observation Key']),
      sourceRecordKey:
        text_(row['Source Record Key']),
      canonicalPropertyKey:
        canonicalKey_(row)
    };
  }

  function addToMap_(map, key, row) {
    if (!key) {
      return;
    }

    if (!map[key]) {
      map[key] = [];
    }

    map[key].push(row);
  }

  function buildPersistedIndexes_(rows) {
    var durable = {};
    var legacy = {};

    rows.forEach(function (row) {
      var violationNumber =
        upper_(row['Violation Number']);

      if (violationNumber) {
        addToMap_(
          durable,
          violationNumber,
          row
        );
      }

      [
        row['Source Observation Key'],
        row['Source Record Key']
      ].forEach(function (value) {
        var key =
          normalizeObservationKey_(value);

        if (key) {
          addToMap_(legacy, key, row);
        }
      });
    });

    return {
      durable: durable,
      legacy: legacy
    };
  }

  function uniqueCanonicalKeys_(rows) {
    var seen = {};
    var keys = [];

    rows.forEach(function (row) {
      var key = canonicalKey_(row);

      if (!key || seen[key]) {
        return;
      }

      seen[key] = true;
      keys.push(key);
    });

    return keys;
  }

  function classify_(
    source,
    indexes
  ) {
    var targetViolation =
      source.violationNumber;

    var sourceCanonical =
      source.canonicalPropertyKey;

    if (
      !targetViolation ||
      !source.durableObservationKey ||
      !source.legacyObjectIdObservationKey ||
      !sourceCanonical
    ) {
      return {
        classification:
          CLASSIFICATIONS
            .SOURCE_IDENTITY_UNAVAILABLE,
        persistedDurableRows: [],
        legacyCollisionRows: []
      };
    }

    var durableRows =
      indexes.durable[targetViolation] || [];

    var legacyRows =
      indexes.legacy[
        source.legacyObjectIdObservationKey
      ] || [];

    var legacyCollisionRows =
      legacyRows.filter(function (row) {
        return (
          upper_(row['Violation Number']) !==
          targetViolation
        );
      });

    if (legacyCollisionRows.length) {
      return {
        classification:
          CLASSIFICATIONS
            .LEGACY_OBJECTID_COLLISION,
        persistedDurableRows:
          durableRows,
        legacyCollisionRows:
          legacyCollisionRows
      };
    }

    if (!durableRows.length) {
      return {
        classification:
          CLASSIFICATIONS.MISSING,
        persistedDurableRows: [],
        legacyCollisionRows: []
      };
    }

    var canonicalKeys =
      uniqueCanonicalKeys_(durableRows);

    var hasUnavailableCanonical =
      durableRows.some(function (row) {
        return !canonicalKey_(row);
      });

    var hasPropertyMismatch =
      canonicalKeys.some(function (key) {
        return key !== sourceCanonical;
      });

    if (
      hasUnavailableCanonical ||
      hasPropertyMismatch ||
      canonicalKeys.length !== 1
    ) {
      return {
        classification:
          CLASSIFICATIONS.PROPERTY_CONFLICT,
        persistedDurableRows:
          durableRows,
        legacyCollisionRows: []
      };
    }

    if (durableRows.length > 1) {
      return {
        classification:
          CLASSIFICATIONS.DUPLICATE_DURABLE,
        persistedDurableRows:
          durableRows,
        legacyCollisionRows: []
      };
    }

    return {
      classification:
        CLASSIFICATIONS.ALREADY_SAFE,
      persistedDurableRows:
        durableRows,
      legacyCollisionRows: []
    };
  }

  function sourceWhereForChunk_(
    violationNumbers
  ) {
    if (
      !Array.isArray(
        violationNumbers
      ) ||
      !violationNumbers.length ||
      violationNumbers.length >
        SOURCE_CHUNK_SIZE
    ) {
      throw new Error(
        'Gate 1 durable source chunk authority is invalid.'
      );
    }

    return (
      'violationnumber IN (' +
      violationNumbers
        .map(sqlString_)
        .join(',') +
      ')' +
      " AND violationdate >= TIMESTAMP '" +
      EARLIEST_TIMESTAMP +
      "'" +
      " AND violationdate <= TIMESTAMP '" +
      LATEST_TIMESTAMP +
      "'" +
      ' AND caseprioritydesc IN (' +
      PRIORITY_SQL +
      ')'
    );
  }


  function fetchCertifiedPopulation_(
    endpoint,
    violationNumbers
  ) {
    var records = [];
    var chunks = [];

    for (
      var start = 0;
      start < violationNumbers.length;
      start += SOURCE_CHUNK_SIZE
    ) {
      if (
        managedTriggerCount_() !==
        0
      ) {
        throw new Error(
          'Gate 1 scheduler authority changed before durable source chunk read.'
        );
      }

      var chunk =
        violationNumbers.slice(
          start,
          start +
            SOURCE_CHUNK_SIZE
        );

      var response =
        REOS.CountyAdapters.ArcGIS.fetch({
          endpoint:
            endpoint,

          context: {
            cursor:
              '',
            limit:
              100
          },

          maxLimit:
            100,

          where:
            sourceWhereForChunk_(
              chunk
            ),

          outFields:
            'objectid,violationnumber,violationdate,' +
            'parcel_id_num,opa_account_num,address,zip,' +
            'violationstatus,caseprioritydesc',

          returnGeometry:
            false,

          orderByFields:
            'violationnumber ASC, objectid ASC'
        }) || {};

      var chunkRecords =
        Array.isArray(
          response.records
        )
          ? response.records
          : [];

      if (
        response.nextCursor ||
        (
          response.metadata &&
          response.metadata
            .exceededTransferLimit ===
            true
        )
      ) {
        throw new Error(
          'Gate 1 durable source chunk exceeded bounded read authority.'
        );
      }

      records =
        records.concat(
          chunkRecords
        );

      chunks.push({
        chunkIndex:
          chunks.length,

        requestedViolationCount:
          chunk.length,

        observedRecordCount:
          chunkRecords.length,

        metadata:
          response.metadata || {}
      });
    }

    return {
      records:
        records,

      metadata: {
        adapter:
          'arcgis',

        membershipAuthority:
          'Violation Number',

        currentObjectIdIsMembershipAuthority:
          false,

        chunkSize:
          SOURCE_CHUNK_SIZE,

        chunkCount:
          chunks.length,

        chunks:
          chunks
      }
    };
  }

  function run() {
    requireDependencies_();
    REOS.Security.requireAdmin();

    var triggerCount =
      managedTriggerCount_();

    if (triggerCount !== 0) {
      throw new Error(
        'Gate 1 requires zero managed county scheduler triggers.'
      );
    }

    var populationAuthority =
      requirePopulationAuthority_();

    var endpoint =
      requireCertifiedEndpoint_();

    var sourceRead =
      fetchCertifiedPopulation_(
        endpoint,
        populationAuthority
          .violationNumbers
      );

    var rawRecords =
      sourceRead.records;

    if (
      rawRecords.length !==
      EXPECTED_POPULATION_COUNT
    ) {
      throw new Error(
        'Gate 1 certified durable source population drift: expected ' +
        EXPECTED_POPULATION_COUNT +
        ', found ' +
        rawRecords.length +
        '.'
      );
    }

    var seenPopulation = {};

    rawRecords.forEach(
      function (raw) {
        var violationNumber =
          upper_(
            raw.violationnumber ||
            raw.VIOLATIONNUMBER
          );

        if (
          !violationNumber ||
          populationAuthority
            .authority
            .contains(
              violationNumber
            ) !== true
        ) {
          throw new Error(
            'Gate 1 source returned observation outside certified durable population: ' +
            violationNumber
          );
        }

        if (
          seenPopulation[
            violationNumber
          ]
        ) {
          throw new Error(
            'Gate 1 source durable identity duplicate: ' +
            violationNumber
          );
        }

        seenPopulation[
          violationNumber
        ] = true;
      }
    );

    populationAuthority
      .violationNumbers
      .forEach(
        function (
          violationNumber
        ) {
          if (
            !seenPopulation[
              violationNumber
            ]
          ) {
            throw new Error(
              'Gate 1 certified durable source observation missing: ' +
              violationNumber
            );
          }
        }
      );

    var openSourceRows =
      rawRecords
        .filter(function (raw) {
          return (
            upper_(raw.violationstatus) ===
            'OPEN'
          );
        })
        .map(function (raw) {
          var violationNumber =
            upper_(
              raw.violationnumber ||
              raw.VIOLATIONNUMBER
            );

          var certifiedRecord =
            populationAuthority
              .authority
              .resolve(
                violationNumber
              );

          if (!certifiedRecord) {
            throw new Error(
              'Gate 1 durable population evidence missing: ' +
              violationNumber
            );
          }

          return sourceSummary_(
            raw,
            certifiedRecord
          );
        });

    /*
     * Source reads are chunked by durable Violation Number authority.
     * Canonicalize the merged OPEN population into the executor's
     * durable cursor order before classification/output.
     */
    openSourceRows.sort(function (
      left,
      right
    ) {
      var leftDate =
        Number(
          left.violationDate
        );

      var rightDate =
        Number(
          right.violationDate
        );

      if (
        leftDate !==
        rightDate
      ) {
        return (
          leftDate -
          rightDate
        );
      }

      var leftViolation =
        upper_(
          left.violationNumber
        );

      var rightViolation =
        upper_(
          right.violationNumber
        );

      if (
        leftViolation <
        rightViolation
      ) {
        return -1;
      }

      if (
        leftViolation >
        rightViolation
      ) {
        return 1;
      }

      return 0;
    });

    if (
      openSourceRows.length !==
      EXPECTED_OPEN_COUNT
    ) {
      throw new Error(
        'Gate 1 actionable population drift: expected ' +
        EXPECTED_OPEN_COUNT +
        ', found ' +
        openSourceRows.length +
        '.'
      );
    }

    var seenViolationNumbers = {};

    openSourceRows.forEach(function (row) {
      if (
        row.violationNumber &&
        seenViolationNumbers[
          row.violationNumber
        ]
      ) {
        throw new Error(
          'Gate 1 source durable identity duplicate: ' +
          row.violationNumber
        );
      }

      if (row.violationNumber) {
        seenViolationNumbers[
          row.violationNumber
        ] = true;
      }
    });

    var persistedRows =
      REOS.Database
        .getAll(TABLE)
        .filter(function (row) {
          return (
            text_(row.Source) ===
              CONNECTOR_ID &&
            text_(row['Source Dataset']) ===
              DATASET
          );
        });

    var indexes =
      buildPersistedIndexes_(
        persistedRows
      );

    var counts = {};
    Object.keys(CLASSIFICATIONS)
      .forEach(function (key) {
        counts[
          CLASSIFICATIONS[key]
        ] = 0;
      });

    var results =
      openSourceRows.map(function (source) {
        var classified =
          classify_(
            source,
            indexes
          );

        counts[
          classified.classification
        ] += 1;

        return {
          classification:
            classified.classification,

          source:
            source,

          persistedDurableRowCount:
            classified
              .persistedDurableRows
              .length,

          persistedDurableRows:
            classified
              .persistedDurableRows
              .map(persistedSummary_),

          legacyCollisionRowCount:
            classified
              .legacyCollisionRows
              .length,

          legacyCollisionRows:
            classified
              .legacyCollisionRows
              .map(persistedSummary_)
        };
      });

    if (
      results.length !==
      EXPECTED_OPEN_COUNT
    ) {
      throw new Error(
        'Gate 1 reconciliation result-count mismatch.'
      );
    }

    if (
      managedTriggerCount_() !== 0
    ) {
      throw new Error(
        'Gate 1 scheduler authority changed during reconciliation.'
      );
    }

    var accounted =
      Object.keys(counts)
        .reduce(function (sum, key) {
          return sum + counts[key];
        }, 0);

    if (
      accounted !== EXPECTED_OPEN_COUNT
    ) {
      throw new Error(
        'Gate 1 classification accounting mismatch.'
      );
    }

    return {
      ok: true,
      readOnly: true,
      mode:
        'CODE_VIOLATIONS_PRODUCTION_COMPLETION_GATE_1',

      connectorId:
        CONNECTOR_ID,
      dataset:
        DATASET,

      sourceAuthority: {
        membershipAuthority:
          'Violation Number',

        currentObjectIdIsMembershipAuthority:
          false,

        currentObjectIdIsRecoveryAuthority:
          false,

        certifiedEvidenceObjectIdUse:
          'LEGACY_COMPATIBILITY_EVIDENCE_ONLY',

        populationManifestSha256:
          populationAuthority
            .metadata
            .manifestSha256,

        sourceEvidenceSha256:
          populationAuthority
            .metadata
            .sourceEvidenceSha256,

        earliestTimestamp:
          EARLIEST_TIMESTAMP,

        latestTimestamp:
          LATEST_TIMESTAMP,

        expectedCertifiedPopulation:
          EXPECTED_POPULATION_COUNT,

        observedCertifiedPopulation:
          rawRecords.length,

        /*
         * Compatibility names retained for downstream preflight.
         */
        expectedPreboundaryExcluded:
          EXPECTED_POPULATION_COUNT,

        observedPreboundaryExcluded:
          rawRecords.length,

        expectedOpenActionable:
          EXPECTED_OPEN_COUNT,

        observedOpenActionable:
          openSourceRows.length,

        filteredNonOpen:
          rawRecords.length -
          openSourceRows.length,

        sourceChunkSize:
          SOURCE_CHUNK_SIZE,

        sourceChunkCount:
          sourceRead
            .metadata
            .chunkCount
      },

      classificationCounts:
        counts,

      backfillCandidateCount:
        counts[
          CLASSIFICATIONS.MISSING
        ],

      unresolvedConflictCount:
        counts[
          CLASSIFICATIONS.DUPLICATE_DURABLE
        ] +
        counts[
          CLASSIFICATIONS.PROPERTY_CONFLICT
        ] +
        counts[
          CLASSIFICATIONS
            .LEGACY_OBJECTID_COLLISION
        ] +
        counts[
          CLASSIFICATIONS
            .SOURCE_IDENTITY_UNAVAILABLE
        ],

      records:
        results,

      arcGisMetadata:
        sourceRead.metadata,

      countySchedulerTriggerCount: 0,

      productionDataMutationAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      checkpointMutationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      repairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  return {
    run: run
  };
})();


function reosCountyCodeViolationGate1Reconciliation() {
  return REOS
    .CountyCodeViolationGate1Reconciliation
    .run();
}
