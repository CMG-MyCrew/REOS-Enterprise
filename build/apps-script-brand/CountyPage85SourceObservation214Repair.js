/**
 * REOS Enterprise - Page 85 Source Observation 214 Repair
 *
 * One-purpose production repair for the certified duplicate:
 *
 *   pa-philadelphia|code_violations|214
 *
 * Certified authoritative row:
 *   physical row 923
 *   DL-20260821060151-8654
 *   parcel 466864
 *
 * Certified conflicting duplicate:
 *   physical row 925
 *   DL-20260821060203-1280
 *
 * Repair strategy:
 * - preserve row 923 unchanged;
 * - clear row 925 in place;
 * - never delete spreadsheet rows;
 * - never shift physical row topology;
 * - require fresh ArcGIS source truth;
 * - require zero county scheduler triggers;
 * - require exact page-85 checkpoint authority;
 * - require exact lock-bound row fingerprints;
 * - require no downstream Distress Lead references;
 * - verify duplicate identity is removed after write.
 *
 * This module grants no:
 * - broad dedupe authority;
 * - insert/upsert authority;
 * - row-delete authority;
 * - scheduler/feed advancement authority;
 * - checkpoint mutation authority;
 * - MAO/draft-offer/offer authority.
 */
var REOS = REOS || {};

REOS.CountyPage85SourceObservation214Repair = (function () {
  var TABLE = 'DISTRESS_LEADS';

  var TARGET_OBJECT_ID = 214;

  var NATURAL_KEY =
    'pa-philadelphia|code_violations|214';

  var AUTHORITATIVE_ROW = 923;
  var DUPLICATE_ROW = 925;

  var AUTHORITATIVE_LEAD =
    'DL-20260821060151-8654';

  var DUPLICATE_LEAD =
    'DL-20260821060203-1280';

  var EXPECTED_PARCEL =
    '466864';

  var EXPECTED_CANONICAL_KEY =
    'property|parcel|pa|philadelphia|466864';

  var EXPECTED_CYCLE =
    'COUNTY-20260902222607805';

  var EXPECTED_CURSOR =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|' +
    '1780925895000|635678';

  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/' +
    'VIOLATIONS/FeatureServer/0/query';

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
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'Page-85 repair admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getSheet !== 'function' ||
      typeof REOS.Database.getHeaders !== 'function' ||
      typeof REOS.Database.rowToObject !== 'function' ||
      typeof REOS.Database.withScriptLockContext !== 'function'
    ) {
      throw new Error(
        'Page-85 repair database authority is unavailable.'
      );
    }

    if (
      !REOS.CountyRuntimeBridge ||
      typeof REOS.CountyRuntimeBridge.registerConnectors !== 'function'
    ) {
      throw new Error(
        'Page-85 repair connector registration is unavailable.'
      );
    }

    if (
      !REOS.CountyConnectorSDK ||
      typeof REOS.CountyConnectorSDK.get !== 'function'
    ) {
      throw new Error(
        'Page-85 repair connector registry is unavailable.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity.resolve !== 'function'
    ) {
      throw new Error(
        'Page-85 repair canonical identity resolver is unavailable.'
      );
    }

    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.ArcGIS ||
      typeof REOS.CountyAdapters.ArcGIS.fetch !== 'function'
    ) {
      throw new Error(
        'Page-85 repair ArcGIS adapter is unavailable.'
      );
    }
  }

  function managedTriggerCount_() {
    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger.getHandlerFunction === 'function' &&
          trigger.getHandlerFunction() ===
            'reosCountyProductionSchedulerRun'
        );
      })
      .length;
  }

  function checkpoint_() {
    var props =
      PropertiesService.getScriptProperties();

    var id =
      text_(
        props.getProperty(
          'REOS_COUNTY_SCHEDULER_CYCLE_ID'
        )
      );

    var nextFeedIndexRaw =
      text_(
        props.getProperty(
          'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
        )
      );

    var cursor =
      text_(
        props.getProperty(
          'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
        )
      );

    var resultsRaw =
      text_(
        props.getProperty(
          'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
        )
      );

    var results = [];

    if (resultsRaw) {
      results = JSON.parse(resultsRaw);
    }

    return {
      id: id,
      nextFeedIndex:
        nextFeedIndexRaw === ''
          ? 0
          : Number(nextFeedIndexRaw),
      currentFeedCursor: cursor,
      results: results,
      completedFeeds: results.length
    };
  }

  function requireCheckpointAuthority_() {
    var cp = checkpoint_();

    if (
      cp.id !== EXPECTED_CYCLE ||
      cp.nextFeedIndex !== 0 ||
      cp.currentFeedCursor !== EXPECTED_CURSOR ||
      cp.completedFeeds !== 0
    ) {
      throw new Error(
        'Page-85 repair checkpoint authority mismatch.'
      );
    }

    return cp;
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

    if (endpoint !== CERTIFIED_ENDPOINT) {
      throw new Error(
        'Page-85 repair endpoint authority mismatch.'
      );
    }

    return endpoint;
  }

  function readPhysicalRow_(
    sheet,
    headers,
    rowNumber
  ) {
    var values =
      sheet
        .getRange(
          rowNumber,
          1,
          1,
          headers.length
        )
        .getValues()[0];

    return {
      rowNumber: rowNumber,
      values: values,
      record:
        REOS.Database.rowToObject(
          headers,
          values,
          rowNumber
        )
    };
  }

  function writePhysicalRow_(
    sheet,
    headers,
    rowNumber,
    values
  ) {
    if (
      !Array.isArray(values) ||
      values.length !== headers.length
    ) {
      throw new Error(
        'Page-85 repair physical write width mismatch.'
      );
    }

    sheet
      .getRange(
        rowNumber,
        1,
        1,
        headers.length
      )
      .setValues([
        values
      ]);
  }

  function stableCell_(value) {
    if (value instanceof Date) {
      return {
        type: 'date',
        value: value.toISOString()
      };
    }

    return {
      type: typeof value,
      value:
        value === undefined
          ? null
          : value
    };
  }

  function fingerprint_(values) {
    var payload =
      JSON.stringify(
        values.map(
          stableCell_
        )
      );

    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        payload,
        Utilities.Charset.UTF_8
      );

    return digest
      .map(function (byte) {
        var normalized =
          byte < 0
            ? byte + 256
            : byte;

        return (
          '0' +
          normalized.toString(16)
        ).slice(-2);
      })
      .join('');
  }

  function assertAuthoritativeRow_(entry) {
    var row = entry.record;

    if (
      text_(row['Distress Lead ID']) !==
        AUTHORITATIVE_LEAD ||
      text_(row['Source Record ID']) !==
        String(TARGET_OBJECT_ID) ||
      text_(row['Source Record Key']) !==
        NATURAL_KEY ||
      text_(row['Parcel ID']) !==
        EXPECTED_PARCEL
    ) {
      throw new Error(
        'Page-85 repair authoritative row drift.'
      );
    }

    var identity =
      REOS.CanonicalPropertyIdentity.resolve(
        row
      );

    if (
      identity.sourceObservationKey !==
        NATURAL_KEY ||
      identity.canonicalPropertyKey !==
        EXPECTED_CANONICAL_KEY
    ) {
      throw new Error(
        'Page-85 repair authoritative row identity drift.'
      );
    }

    return identity;
  }

  function assertDuplicateRow_(entry) {
    var row = entry.record;

    if (
      text_(row['Distress Lead ID']) !==
        DUPLICATE_LEAD ||
      text_(row['Source Record ID']) !==
        String(TARGET_OBJECT_ID) ||
      text_(row['Source Record Key']) !==
        NATURAL_KEY ||
      text_(row['Parcel ID']) !== ''
    ) {
      throw new Error(
        'Page-85 repair duplicate row drift.'
      );
    }

    var identity =
      REOS.CanonicalPropertyIdentity.resolve(
        row
      );

    if (
      identity.sourceObservationKey !==
        NATURAL_KEY ||
      identity.canonicalPropertyKey ===
        EXPECTED_CANONICAL_KEY
    ) {
      throw new Error(
        'Page-85 repair duplicate identity drift.'
      );
    }

    return identity;
  }

  function fetchFreshSource_() {
    var endpoint =
      requireCertifiedEndpoint_();

    REOS.CountyRuntimeBridge
      .registerConnectors();

    var connector =
      REOS.CountyConnectorSDK
        .get(
          'PA-PHILADELPHIA'
        );

    if (
      !connector ||
      typeof connector.normalize !== 'function'
    ) {
      throw new Error(
        'Page-85 repair normalize authority is unavailable.'
      );
    }

    var response =
      REOS.CountyAdapters.ArcGIS.fetch({
        endpoint: endpoint,
        context: {
          limit: 1,
          cursor: ''
        },
        maxLimit: 1,
        where:
          '(' +
          BASE_WHERE +
          ') AND objectid = ' +
          String(TARGET_OBJECT_ID),
        outFields: '*',
        returnGeometry: false,
        orderByFields: 'objectid ASC'
      }) || {};

    var records =
      Array.isArray(response.records)
        ? response.records
        : [];

    if (records.length !== 1) {
      throw new Error(
        'Page-85 repair fresh source record is not exactly one row.'
      );
    }

    var normalized =
      connector.normalize(
        records[0],
        {
          connectorId:
            'PA-PHILADELPHIA',
          dataset:
            'code_violations',
          runId:
            'PAGE85-SOURCE-214-REPAIR-PREFLIGHT',
          cursor: '',
          limit: 1,
          since: null,
          dryRun: true,
          config: {},
          now: new Date()
        }
      );

    if (
      !normalized ||
      normalized.__skip
    ) {
      throw new Error(
        'Page-85 repair fresh source record is not actionable.'
      );
    }

    var identity =
      REOS.CanonicalPropertyIdentity
        .resolve(
          normalized
        );

    if (
      text_(normalized['Parcel ID']) !==
        EXPECTED_PARCEL ||
      identity.sourceObservationKey !==
        NATURAL_KEY ||
      identity.canonicalPropertyKey !==
        EXPECTED_CANONICAL_KEY
    ) {
      throw new Error(
        'Page-85 repair fresh source identity drift.'
      );
    }

    return {
      normalized: normalized,
      identity: identity
    };
  }

  function downstreamReferences_(
    distressLeadIds
  ) {
    var ids = {};

    distressLeadIds.forEach(
      function (id) {
        ids[text_(id)] = true;
      }
    );

    var spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    var matches = [];

    spreadsheet
      .getSheets()
      .forEach(function (sheet) {
        var sheetName =
          sheet.getName();

        /*
         * DISTRESS_LEADS contains the authoritative records themselves
         * and is intentionally excluded from downstream-reference
         * authority.
         */
        if (sheetName === TABLE) {
          return;
        }

        var lastRow =
          sheet.getLastRow();

        var lastColumn =
          sheet.getLastColumn();

        if (
          lastRow < 1 ||
          lastColumn < 1
        ) {
          return;
        }

        var values =
          sheet
            .getRange(
              1,
              1,
              lastRow,
              lastColumn
            )
            .getDisplayValues();

        values.forEach(
          function (row, rowIndex) {
            row.forEach(
              function (
                cell,
                columnIndex
              ) {
                var value =
                  text_(cell);

                if (ids[value]) {
                  matches.push({
                    sheet:
                      sheetName,
                    rowNumber:
                      rowIndex + 1,
                    columnNumber:
                      columnIndex + 1,
                    distressLeadId:
                      value
                  });
                }
              }
            );
          }
        );
      });

    return matches;
  }

  function countTargetObservations_(
    rows
  ) {
    return rows.filter(
      function (row) {
        return (
          text_(
            row['Source Observation Key']
          ) === NATURAL_KEY ||
          text_(
            row['Source Record Key']
          ) === NATURAL_KEY
        );
      }
    );
  }

  function execute(options) {
    options = options || {};

    requireAdmin_();
    requireDependencies_();

    if (
      options.confirmRepair !== true
    ) {
      throw new Error(
        'Page-85 repair requires confirmRepair=true.'
      );
    }

    if (
      text_(options.sourceObservationKey) !==
        NATURAL_KEY
    ) {
      throw new Error(
        'Page-85 repair source observation authority mismatch.'
      );
    }

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'Page-85 repair requires zero managed scheduler triggers.'
      );
    }

    var beforeCheckpoint =
      requireCheckpointAuthority_();

    var fresh =
      fetchFreshSource_();

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'Page-85 repair scheduler authority changed after source fetch.'
      );
    }

    requireCheckpointAuthority_();

    return REOS.Database
      .withScriptLockContext(
        function () {
          if (managedTriggerCount_() !== 0) {
            throw new Error(
              'Page-85 repair scheduler authority changed under lock.'
            );
          }

          requireCheckpointAuthority_();

          var sheet =
            REOS.Database.getSheet(
              TABLE
            );

          var headers =
            REOS.Database.getHeaders(
              TABLE
            );

          var authoritative =
            readPhysicalRow_(
              sheet,
              headers,
              AUTHORITATIVE_ROW
            );

          var duplicate =
            readPhysicalRow_(
              sheet,
              headers,
              DUPLICATE_ROW
            );

          var authoritativeFingerprint =
            fingerprint_(
              authoritative.values
            );

          var duplicateFingerprint =
            fingerprint_(
              duplicate.values
            );

          var authoritativeIdentity =
            assertAuthoritativeRow_(
              authoritative
            );

          var duplicateIdentity =
            assertDuplicateRow_(
              duplicate
            );

          var allBefore =
            REOS.Database.getAll(
              TABLE
            );

          var beforeMatches =
            countTargetObservations_(
              allBefore
            );

          if (beforeMatches.length !== 2) {
            throw new Error(
              'Page-85 repair expected exactly two persisted target observations.'
            );
          }

          /*
           * Re-prove the certified zero-reference condition at execution
           * time while the repair owns ScriptLock. A new downstream
           * reference revokes mutation authority rather than attempting
           * broad reference rewriting.
           */
          var downstreamReferences =
            downstreamReferences_([
              AUTHORITATIVE_LEAD,
              DUPLICATE_LEAD
            ]);

          if (
            downstreamReferences.length !== 0
          ) {
            throw new Error(
              'Page-85 repair downstream reference authority changed.'
            );
          }

          var blankRow =
            headers.map(function () {
              return '';
            });

          /*
           * Exactly one bounded physical mutation.
           *
           * Clear row 925 in place rather than deleting it. This removes
           * the conflicting source observation without shifting any
           * subsequent physical spreadsheet row numbers.
           */
          var mutationApplied =
            false;

          var afterMatches =
            null;

          var survivorIdentity =
            null;

          try {
            writePhysicalRow_(
              sheet,
              headers,
              DUPLICATE_ROW,
              blankRow
            );

            mutationApplied =
              true;

            SpreadsheetApp.flush();

            var authoritativeAfter =
              readPhysicalRow_(
                sheet,
                headers,
                AUTHORITATIVE_ROW
              );

            var duplicateAfter =
              readPhysicalRow_(
                sheet,
                headers,
                DUPLICATE_ROW
              );

            if (
              fingerprint_(
                authoritativeAfter.values
              ) !== authoritativeFingerprint
            ) {
              throw new Error(
                'Page-85 repair authoritative row changed unexpectedly.'
              );
            }

            if (
              duplicateAfter.values.some(
                function (cell) {
                  return (
                    cell !== '' &&
                    cell !== null
                  );
                }
              )
            ) {
              throw new Error(
                'Page-85 repair duplicate row was not fully cleared.'
              );
            }

            var allAfter =
              REOS.Database.getAll(
                TABLE
              );

            afterMatches =
              countTargetObservations_(
                allAfter
              );

            if (afterMatches.length !== 1) {
              throw new Error(
                'Page-85 repair post-write target observation count is not one.'
              );
            }

            var survivor =
              afterMatches[0];

            if (
              Number(survivor._rowNumber) !==
                AUTHORITATIVE_ROW ||
              text_(
                survivor['Distress Lead ID']
              ) !== AUTHORITATIVE_LEAD
            ) {
              throw new Error(
                'Page-85 repair surviving observation authority mismatch.'
              );
            }

            survivorIdentity =
              REOS.CanonicalPropertyIdentity
                .resolve(
                  survivor
                );

            if (
              survivorIdentity.sourceObservationKey !==
                NATURAL_KEY ||
              survivorIdentity.canonicalPropertyKey !==
                EXPECTED_CANONICAL_KEY
            ) {
              throw new Error(
                'Page-85 repair post-write identity reconciliation failed.'
              );
            }

            requireCheckpointAuthority_();

            if (managedTriggerCount_() !== 0) {
              throw new Error(
                'Page-85 repair scheduler authority changed during repair.'
              );
            }
          } catch (postWriteError) {
            if (!mutationApplied) {
              throw postWriteError;
            }

            /*
             * Restore the exact lock-bound duplicate prestate if any
             * verification after the mutation fails.
             *
             * A rollback failure is explicitly ambiguous and must never
             * become automatic retry authority.
             */
            try {
              writePhysicalRow_(
                sheet,
                headers,
                DUPLICATE_ROW,
                duplicate.values
              );

              SpreadsheetApp.flush();

              var restoredDuplicate =
                readPhysicalRow_(
                  sheet,
                  headers,
                  DUPLICATE_ROW
                );

              var restoredAuthoritative =
                readPhysicalRow_(
                  sheet,
                  headers,
                  AUTHORITATIVE_ROW
                );

              if (
                fingerprint_(
                  restoredDuplicate.values
                ) !== duplicateFingerprint
              ) {
                throw new Error(
                  'duplicate prestate fingerprint mismatch after rollback'
                );
              }

              if (
                fingerprint_(
                  restoredAuthoritative.values
                ) !== authoritativeFingerprint
              ) {
                throw new Error(
                  'authoritative row fingerprint mismatch after rollback'
                );
              }

              var rollbackMatches =
                countTargetObservations_(
                  REOS.Database.getAll(
                    TABLE
                  )
                );

              if (
                rollbackMatches.length !== 2
              ) {
                throw new Error(
                  'target observation count did not return to two after rollback'
                );
              }

              requireCheckpointAuthority_();

              if (
                managedTriggerCount_() !== 0
              ) {
                throw new Error(
                  'scheduler authority changed during rollback'
                );
              }
            } catch (rollbackError) {
              throw new Error(
                'Page-85 repair entered ambiguous state after post-write failure; ' +
                'automatic retry prohibited. original=' +
                (
                  postWriteError &&
                  postWriteError.message
                    ? postWriteError.message
                    : String(postWriteError)
                ) +
                '; rollback=' +
                (
                  rollbackError &&
                  rollbackError.message
                    ? rollbackError.message
                    : String(rollbackError)
                )
              );
            }

            throw new Error(
              'Page-85 repair post-write verification failed; ' +
              'certified prestate restored. ' +
              (
                postWriteError &&
                postWriteError.message
                  ? postWriteError.message
                  : String(postWriteError)
              )
            );
          }

          return {
            ok: true,
            repaired: true,
            mode:
              'PAGE85_SOURCE_OBSERVATION_214_REPAIR',

            sourceObservationKey:
              NATURAL_KEY,

            freshSourceIdentity:
              fresh.identity,

            preservedRow: {
              rowNumber:
                AUTHORITATIVE_ROW,
              distressLeadId:
                AUTHORITATIVE_LEAD,
              fingerprint:
                authoritativeFingerprint,
              identity:
                authoritativeIdentity
            },

            clearedRow: {
              rowNumber:
                DUPLICATE_ROW,
              distressLeadId:
                DUPLICATE_LEAD,
              preRepairFingerprint:
                duplicateFingerprint,
              identity:
                duplicateIdentity
            },

            beforeMatchCount:
              beforeMatches.length,

            downstreamReferenceCount:
              downstreamReferences.length,

            afterMatchCount:
              afterMatches.length,

            checkpointBefore:
              beforeCheckpoint,

            checkpointAfter:
              requireCheckpointAuthority_(),

            schedulerTriggerCount:
              managedTriggerCount_(),

            rowDeleteAuthorityGranted:
              false,

            broadDedupeAuthorityGranted:
              false,

            connectorExecutionAuthorityGranted:
              false,

            checkpointMutationAuthorityGranted:
              false,

            schedulerAuthorityGranted:
              false,

            feedAdvancementAuthorityGranted:
              false,

            automaticOfferAuthorityGranted:
              false
          };
        }
      );
  }

  return {
    execute:
      execute
  };
})();


function reosCountyPage85SourceObservation214Repair(
  options
) {
  return REOS
    .CountyPage85SourceObservation214Repair
    .execute(
      options || {}
    );
}
