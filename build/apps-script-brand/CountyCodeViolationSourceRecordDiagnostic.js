/**
 * REOS Enterprise - County Code Violation Source Record Diagnostic
 *
 * Targeted read-only forensic diagnostic for one Philadelphia
 * code-violations ArcGIS source observation.
 *
 * This module:
 * - requires admin authority;
 * - requires zero managed county scheduler triggers;
 * - requires the certified Philadelphia code-violations endpoint;
 * - fetches exactly one requested ArcGIS objectid;
 * - normalizes through the registered production connector;
 * - reconstructs canonical/source-observation identity;
 * - compares against exact persisted source-observation matches.
 *
 * This module DOES NOT:
 * - execute the county connector persistence runtime;
 * - insert/update/upsert/delete DISTRESS_LEADS;
 * - mutate county checkpoints;
 * - write connector-run state;
 * - create/delete scheduler triggers;
 * - grant MAO/draft-offer/offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationSourceRecordDiagnostic = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var BASE_WHERE =
    "violationdate >= TIMESTAMP '2025-09-01 00:00:00' " +
    "AND caseprioritydesc IN " +
    "('UNSAFE','IMMINENTLY DANGEROUS','UNFIT','HAZARDOUS','UNLAWFUL') " +
    'AND objectid <= 636638';

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'County source-record diagnostic admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getAll !==
        'function'
    ) {
      throw new Error(
        'County source-record diagnostic Database.getAll is unavailable.'
      );
    }

    if (
      !REOS.CountyRuntimeBridge ||
      typeof REOS.CountyRuntimeBridge
        .registerConnectors !==
        'function'
    ) {
      throw new Error(
        'County source-record diagnostic connector registration is unavailable.'
      );
    }

    if (
      !REOS.CountyConnectorSDK ||
      typeof REOS.CountyConnectorSDK.get !==
        'function'
    ) {
      throw new Error(
        'County source-record diagnostic connector registry is unavailable.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity
        .resolve !==
        'function'
    ) {
      throw new Error(
        'County source-record diagnostic canonical identity resolver is unavailable.'
      );
    }

    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.ArcGIS ||
      typeof REOS.CountyAdapters.ArcGIS.fetch !==
        'function'
    ) {
      throw new Error(
        'County source-record diagnostic ArcGIS adapter is unavailable.'
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
        'County source-record diagnostic endpoint authority is unavailable.'
      );
    }

    if (
      typeof ScriptApp ===
        'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !==
        'function'
    ) {
      throw new Error(
        'County source-record diagnostic trigger authority is unavailable.'
      );
    }
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

  function requireCertifiedEndpoint_() {
    var endpoint =
      text_(
        PropertiesService
          .getScriptProperties()
          .getProperty(
            ENDPOINT_PROPERTY
          )
      );

    if (
      endpoint !==
      CERTIFIED_ENDPOINT
    ) {
      throw new Error(
        'County source-record diagnostic endpoint authority mismatch.'
      );
    }

    return endpoint;
  }

  function normalizeObjectId_(value) {
    var number =
      Number(value);

    if (
      !isFinite(number) ||
      Math.floor(number) !== number ||
      number < 0 ||
      number > 636638
    ) {
      throw new Error(
        'County source-record diagnostic objectid is invalid.'
      );
    }

    return number;
  }

  function persistedSummary_(row) {
    return {
      rowNumber:
        Number(
          row._rowNumber || 0
        ),

      distressLeadId:
        text_(
          row['Distress Lead ID']
        ),

      address:
        text_(
          row.Address
        ),

      city:
        text_(
          row.City
        ),

      state:
        text_(
          row.State
        ),

      zip:
        text_(
          row.Zip
        ),

      county:
        text_(
          row.County
        ),

      parcelId:
        text_(
          row['Parcel ID']
        ),

      sourceRecordId:
        text_(
          row['Source Record ID']
        ),

      sourceRecordKey:
        text_(
          row['Source Record Key']
        ),

      sourceObservationKey:
        text_(
          row['Source Observation Key']
        ),

      canonicalPropertyKey:
        text_(
          row['Canonical Property Key']
        )
    };
  }

  function run(objectId) {
    requireAdmin_();
    requireDependencies_();

    var targetObjectId =
      normalizeObjectId_(
        objectId
      );

    if (
      managedTriggerCount_() !== 0
    ) {
      throw new Error(
        'County source-record diagnostic requires zero managed scheduler triggers.'
      );
    }

    var endpoint =
      requireCertifiedEndpoint_();

    REOS.CountyRuntimeBridge
      .registerConnectors();

    var connector =
      REOS.CountyConnectorSDK
        .get(CONNECTOR_ID);

    if (
      !connector ||
      typeof connector.normalize !==
        'function'
    ) {
      throw new Error(
        'Registered Philadelphia connector normalize authority is unavailable.'
      );
    }

    if (
      managedTriggerCount_() !== 0
    ) {
      throw new Error(
        'County source-record diagnostic scheduler authority changed before fetch.'
      );
    }

    var where =
      '(' +
      BASE_WHERE +
      ') AND objectid = ' +
      String(targetObjectId);

    var response =
      REOS.CountyAdapters.ArcGIS.fetch({
        endpoint:
          endpoint,

        context: {
          limit: 1,
          cursor: ''
        },

        maxLimit:
          1,

        where:
          where,

        outFields:
          '*',

        returnGeometry:
          false,

        orderByFields:
          'objectid ASC'
      }) || {};

    var rawRecords =
      Array.isArray(
        response.records
      )
        ? response.records
        : [];

    if (
      rawRecords.length > 1
    ) {
      throw new Error(
        'County source-record diagnostic returned multiple ArcGIS rows.'
      );
    }

    var raw =
      rawRecords.length === 1
        ? rawRecords[0]
        : null;

    var normalized =
      raw
        ? connector.normalize(
            raw,
            {
              connectorId:
                CONNECTOR_ID,
              dataset:
                DATASET,
              runId:
                'READ-ONLY-SOURCE-RECORD-DIAGNOSTIC',
              cursor:
                '',
              limit:
                1,
              since:
                null,
              dryRun:
                true,
              config:
                {},
              now:
                new Date()
            }
          )
        : null;

    var skipped =
      !!(
        normalized &&
        normalized.__skip
      );

    var identity =
      normalized &&
      !skipped
        ? REOS
            .CanonicalPropertyIdentity
            .resolve(
              normalized
            )
        : null;

    var naturalKey =
      [
        'pa-philadelphia',
        DATASET,
        String(targetObjectId)
      ].join('|');

    var persistedMatches =
      REOS.Database
        .getAll(TABLE)
        .filter(function (row) {
          return (
            text_(
              row[
                'Source Observation Key'
              ]
            ) ===
              naturalKey ||
            text_(
              row[
                'Source Record Key'
              ]
            ) ===
              naturalKey
          );
        });

    var persisted =
      persistedMatches
        .map(
          persistedSummary_
        );

    var persistedIdentity =
      persistedMatches
        .map(function (row) {
          try {
            var resolved =
              REOS
                .CanonicalPropertyIdentity
                .resolve(
                  row
                );

            return {
              rowNumber:
                Number(
                  row._rowNumber || 0
                ),

              distressLeadId:
                text_(
                  row[
                    'Distress Lead ID'
                  ]
                ),

              sourceObservationKey:
                resolved
                  .sourceObservationKey,

              canonicalPropertyKey:
                resolved
                  .canonicalPropertyKey,

              error:
                ''
            };
          } catch (error) {
            return {
              rowNumber:
                Number(
                  row._rowNumber || 0
                ),

              distressLeadId:
                text_(
                  row[
                    'Distress Lead ID'
                  ]
                ),

              sourceObservationKey:
                '',

              canonicalPropertyKey:
                '',

              error:
                error &&
                error.message
                  ? String(
                      error.message
                    )
                  : String(error)
            };
          }
        });

    if (
      managedTriggerCount_() !== 0
    ) {
      throw new Error(
        'County source-record diagnostic scheduler authority changed during fetch.'
      );
    }

    return {
      ok:
        rawRecords.length === 1 &&
        !!identity,

      readOnly:
        true,

      mode:
        'CODE_VIOLATION_SOURCE_RECORD_DIAGNOSTIC',

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      objectId:
        targetObjectId,

      sourceObservationKey:
        naturalKey,

      sourceWhere:
        where,

      sourceRecordFound:
        rawRecords.length === 1,

      rawSourceRecord:
        raw,

      normalizedSourceRecord:
        normalized,

      normalizedRecordSkipped:
        skipped,

      normalizedIdentity:
        identity,

      persistedMatchCount:
        persisted.length,

      persistedRows:
        persisted,

      persistedIdentity:
        persistedIdentity,

      sourceMatchesPersistedCanonicalRows:
        identity
          ? persistedIdentity
              .filter(
                function (entry) {
                  return (
                    !entry.error &&
                    entry.canonicalPropertyKey ===
                      identity
                        .canonicalPropertyKey
                  );
                }
              )
              .map(
                function (entry) {
                  return {
                    rowNumber:
                      entry.rowNumber,

                    distressLeadId:
                      entry.distressLeadId
                  };
                }
              )
          : [],

      arcGisMetadata:
        response.metadata || {},

      connectorExecutionAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      productionDataMutationAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false,

      countySchedulerTriggerCount:
        0
    };
  }

  return {
    run:
      run
  };
})();


function reosCountyCodeViolationSourceRecordDiagnostic(
  objectId
) {
  return REOS
    .CountyCodeViolationSourceRecordDiagnostic
    .run(
      objectId
    );
}
