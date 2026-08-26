/**
 * REOS Enterprise - County Identity Source Reconciliation
 *
 * Phase B read-only reconciliation for Philadelphia code violations.
 *
 * This module:
 * - reads existing DISTRESS_LEADS rows
 * - reads the configured Philadelphia code-violations source
 * - normalizes source records without CountyConnectorSDK.run()
 * - compares source-observation and canonical-property identity
 * - reports source/table completeness and historical corruption
 *
 * It does NOT:
 * - insert/update/upsert/delete rows
 * - migrate schema
 * - write COUNTY_CONNECTOR_RUNS
 * - modify scheduler state
 * - create triggers
 * - grant migration or repair authority
 */
var REOS = REOS || {};

REOS.CountyIdentitySourceReconciliation = (function () {
  var TABLE = 'DISTRESS_LEADS';
  var CONNECTOR_ID = 'PA-PHILADELPHIA';
  var DATASET = 'code_violations';
  var MAX_WINDOW = 2000;

  function text_(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).trim();
  }

  function int_(value, fallback) {
    var number = Number(value);

    return isFinite(number)
      ? Math.floor(number)
      : fallback;
  }

  function normalizeOptions_(options) {
    options = options || {};

    var connectorId =
      text_(
        options.connectorId ||
        CONNECTOR_ID
      );

    var dataset =
      text_(
        options.dataset ||
        DATASET
      );

    var startOffset =
      Math.max(
        int_(options.startOffset, 0),
        0
      );

    var endOffsetExclusive =
      Math.max(
        int_(
          options.endOffsetExclusive,
          1600
        ),
        startOffset
      );

    var windowSize =
      endOffsetExclusive -
      startOffset;

    var sampleLimit =
      Math.min(
        Math.max(
          int_(options.sampleLimit, 25),
          1
        ),
        100
      );

    if (
      connectorId !==
      CONNECTOR_ID
    ) {
      throw new Error(
        'Phase B reconciliation is restricted to ' +
        CONNECTOR_ID +
        '.'
      );
    }

    if (
      dataset !==
      DATASET
    ) {
      throw new Error(
        'Phase B reconciliation is restricted to dataset ' +
        DATASET +
        '.'
      );
    }

    if (
      windowSize < 1 ||
      windowSize > MAX_WINDOW
    ) {
      throw new Error(
        'Phase B source window must contain 1-' +
        MAX_WINDOW +
        ' records.'
      );
    }

    return {
      connectorId: connectorId,
      dataset: dataset,
      startOffset: startOffset,
      endOffsetExclusive:
        endOffsetExclusive,
      windowSize: windowSize,
      sampleLimit: sampleLimit
    };
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
  }

  function uniqueStrings_(values) {
    var seen = {};

    return (values || [])
      .map(text_)
      .filter(function (value) {
        if (
          !value ||
          seen[value]
        ) {
          return false;
        }

        seen[value] = true;
        return true;
      });
  }

  function idPrefix_(id) {
    var value = text_(id);
    var separator =
      value.indexOf('-');

    return (
      separator > 0
        ? value.slice(0, separator)
        : value
    ).toUpperCase();
  }

  function rawSourceRecordId_(raw) {
    raw = raw || {};

    return text_(
      raw.objectid ||
      raw.OBJECTID ||
      raw.id ||
      raw.ID ||
      raw.record_id ||
      raw.RECORD_ID
    );
  }

  function rowSummary_(entry) {
    return {
      rowNumber:
        Number(
          entry.row._rowNumber || 0
        ),

      distressLeadId:
        text_(
          entry.row[
            'Distress Lead ID'
          ]
        ),

      sourceRecordId:
        text_(
          entry.row[
            'Source Record ID'
          ]
        ),

      parcelId:
        text_(
          entry.row[
            'Parcel ID'
          ]
        ),

      sourceObservationKey:
        entry.identity
          ? text_(
              entry.identity
                .sourceObservationKey
            )
          : '',

      canonicalPropertyKey:
        entry.identity
          ? text_(
              entry.identity
                .canonicalPropertyKey
            )
          : '',

      identityError:
        entry.identityError || ''
    };
  }

  function buildPersistedIndex_(
    rows,
    options
  ) {
    var scoped =
      (rows || [])
        .filter(function (row) {
          return (
            text_(row.Source) ===
              options.connectorId &&
            text_(
              row['Source Dataset']
            ) ===
              options.dataset
          );
        });

    var groups = {};
    var errors = [];
    var crossPrefix = [];

    scoped.forEach(function (row) {
      var entry = {
        row: row,
        identity: null,
        identityError: ''
      };

      try {
        entry.identity =
          REOS.CanonicalPropertyIdentity
            .resolve(row);
      } catch (error) {
        entry.identityError =
          error && error.message
            ? error.message
            : String(error);

        errors.push(entry);
      }

      if (
        text_(
          row['Distress Lead ID']
        ) &&
        idPrefix_(
          row['Distress Lead ID']
        ) !== 'DL'
      ) {
        crossPrefix.push(entry);
      }

      if (!entry.identity) {
        return;
      }

      var key =
        text_(
          entry.identity
            .sourceObservationKey
        );

      groups[key] =
        groups[key] || [];

      groups[key].push(entry);
    });

    return {
      scoped: scoped,
      groups: groups,
      errors: errors,
      crossPrefix: crossPrefix
    };
  }

  function classificationBucket_() {
    return {
      count: 0,
      sourceObservationKeys: []
    };
  }

  function reconcile(options) {
    requireDependencies_();

    REOS.Security.requireAdmin();

    options =
      normalizeOptions_(options);

    /*
     * Registration only.
     *
     * CountyRuntimeBridge.registerConnectors()
     * does not execute a source sync or persist
     * county records.
     */
    REOS.CountyRuntimeBridge
      .registerConnectors();

    var connector =
      REOS.CountyConnectorSDK.get(
        options.connectorId
      );

    if (
      !connector ||
      typeof connector.fetch !==
        'function' ||
      typeof connector.normalize !==
        'function'
    ) {
      throw new Error(
        'Registered Philadelphia connector is incomplete.'
      );
    }

    var allRows =
      REOS.Database.getAll(TABLE);

    var persisted =
      buildPersistedIndex_(
        allRows,
        options
      );

    var context = {
      runId:
        'PHASE-B-READ-ONLY',

      connectorId:
        options.connectorId,

      dataset:
        options.dataset,

      cursor:
        String(
          options.startOffset
        ),

      limit:
        options.windowSize,

      since: null,

      dryRun: true,

      config: {},

      now: new Date()
    };

    /*
     * Direct source read only.
     *
     * CountyConnectorSDK.run() is deliberately
     * NOT called because that path writes
     * COUNTY_CONNECTOR_RUNS audit rows.
     */
    var response =
      connector.fetch(context) || {};

    var rawRecords =
      Array.isArray(
        response.records
      )
        ? response.records
        : [];

    if (
      rawRecords.length >
      options.windowSize
    ) {
      throw new Error(
        'Source exceeded requested reconciliation window.'
      );
    }

    var classifications = {
      SOURCE_PRESENT_ONCE:
        classificationBucket_(),

      SOURCE_DUPLICATED_IN_TABLE:
        classificationBucket_(),

      SOURCE_PROPERTY_CONFLICT:
        classificationBucket_(),

      SOURCE_MISSING_FROM_TABLE:
        classificationBucket_()
    };

    var skippedByFilter = [];
    var sourceErrors = [];
    var sourceObservationKeys = [];
    var sourceSeen = {};
    var sourceDuplicateKeys = [];
    var anomalySamples = [];
    var normalizedCount = 0;

    rawRecords.forEach(function (
      raw,
      index
    ) {
      var sourceOffset =
        options.startOffset +
        index;

      var normalized;

      try {
        normalized =
          connector.normalize(
            raw,
            context
          );
      } catch (error) {
        sourceErrors.push({
          sourceOffset:
            sourceOffset,

          sourceRecordId:
            rawSourceRecordId_(raw),

          stage:
            'normalize',

          error:
            error && error.message
              ? error.message
              : String(error)
        });

        return;
      }

      if (
        normalized &&
        normalized.__skip === true
      ) {
        skippedByFilter.push({
          sourceOffset:
            sourceOffset,

          sourceRecordId:
            rawSourceRecordId_(raw),

          reason:
            text_(
              normalized
                .__skipReason
            )
        });

        return;
      }

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
        validation = {
          ok: true,
          errors: []
        };
      }

      if (
        !validation ||
        !validation.ok
      ) {
        sourceErrors.push({
          sourceOffset:
            sourceOffset,

          sourceRecordId:
            text_(
              normalized[
                'Source Record ID'
              ]
            ),

          stage:
            'validate',

          errors:
            validation &&
            validation.errors
              ? validation.errors.slice()
              : [
                  'No validation result.'
                ]
        });

        return;
      }

      var identity;

      try {
        identity =
          REOS.CanonicalPropertyIdentity
            .resolve(normalized);
      } catch (error) {
        sourceErrors.push({
          sourceOffset:
            sourceOffset,

          sourceRecordId:
            text_(
              normalized[
                'Source Record ID'
              ]
            ),

          stage:
            'identity',

          error:
            error && error.message
              ? error.message
              : String(error)
        });

        return;
      }

      normalizedCount++;

      var observationKey =
        text_(
          identity
            .sourceObservationKey
        );

      var sourceCanonicalKey =
        text_(
          identity
            .canonicalPropertyKey
        );

      sourceObservationKeys.push(
        observationKey
      );

      if (
        sourceSeen[
          observationKey
        ]
      ) {
        sourceDuplicateKeys.push(
          observationKey
        );
      }

      sourceSeen[
        observationKey
      ] = true;

      var group =
        persisted.groups[
          observationKey
        ] || [];

      var persistedCanonicalKeys =
        uniqueStrings_(
          group.map(function (
            entry
          ) {
            return entry.identity
              ? entry.identity
                  .canonicalPropertyKey
              : '';
          })
        );

      var canonicalMismatch =
        persistedCanonicalKeys
          .some(function (key) {
            return (
              key !==
              sourceCanonicalKey
            );
          });

      var classification =
        group.length === 0
          ? 'SOURCE_MISSING_FROM_TABLE'

          : (
              persistedCanonicalKeys
                .length > 1 ||
              canonicalMismatch
            )
            ? 'SOURCE_PROPERTY_CONFLICT'

            : group.length > 1
              ? 'SOURCE_DUPLICATED_IN_TABLE'

              : 'SOURCE_PRESENT_ONCE';

      classifications[
        classification
      ].count++;

      classifications[
        classification
      ].sourceObservationKeys
        .push(
          observationKey
        );

      var contaminatedRows =
        group.filter(
          function (entry) {
            var id =
              text_(
                entry.row[
                  'Distress Lead ID'
                ]
              );

            return (
              id &&
              idPrefix_(id) !==
                'DL'
            );
          }
        );

      if (
        (
          classification !==
            'SOURCE_PRESENT_ONCE' ||
          contaminatedRows.length
        ) &&
        anomalySamples.length <
          options.sampleLimit
      ) {
        anomalySamples.push({
          sourceOffset:
            sourceOffset,

          sourceRecordId:
            text_(
              normalized[
                'Source Record ID'
              ]
            ),

          parcelId:
            text_(
              normalized[
                'Parcel ID'
              ]
            ),

          address:
            text_(
              normalized.Address
            ),

          zip:
            text_(
              normalized.Zip
            ),

          sourceObservationKey:
            observationKey,

          sourceCanonicalPropertyKey:
            sourceCanonicalKey,

          classification:
            classification,

          persistedRowCount:
            group.length,

          persistedCanonicalPropertyKeys:
            persistedCanonicalKeys,

          crossPrefixRows:
            contaminatedRows
              .map(
                rowSummary_
              )
        });
      }
    });

    var sourceKeySet = {};

    sourceObservationKeys
      .forEach(function (key) {
        sourceKeySet[key] = true;
      });

    var matchedCrossPrefix =
      persisted.crossPrefix
        .filter(function (
          entry
        ) {
          return (
            entry.identity &&
            sourceKeySet[
              text_(
                entry.identity
                  .sourceObservationKey
              )
            ]
          );
        });

    var tableOnlyKeys =
      Object.keys(
        persisted.groups
      )
        .filter(function (key) {
          return (
            !sourceKeySet[key]
          );
        })
        .sort();

    var tableOnlySamples =
      tableOnlyKeys
        .slice(
          0,
          options.sampleLimit
        )
        .map(function (key) {
          var group =
            persisted.groups[key];

          return {
            sourceObservationKey:
              key,

            rowCount:
              group.length,

            canonicalPropertyKeys:
              uniqueStrings_(
                group.map(
                  function (entry) {
                    return entry.identity
                      ? entry.identity
                          .canonicalPropertyKey
                      : '';
                  }
                )
              ),

            rows:
              group
                .slice(
                  0,
                  options.sampleLimit
                )
                .map(
                  rowSummary_
                )
          };
        });

    var uniqueSourceDuplicateKeys =
      uniqueStrings_(
        sourceDuplicateKeys
      );

    var completeWindow =
      rawRecords.length ===
      options.windowSize;

    return {
      ok: true,

      mode:
        'READ_ONLY',

      phase:
        'source_reconciliation',

      sourceAccess:
        'NETWORK_READ_ONLY',

      /*
       * These are intentionally immutable false
       * values. Phase B is evidence only.
       */
      repairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      table:
        TABLE,

      scope: {
        connectorId:
          options.connectorId,

        dataset:
          options.dataset
      },

      window: {
        startOffset:
          options.startOffset,

        endOffsetExclusive:
          options.endOffsetExclusive,

        requestedRecords:
          options.windowSize,

        fetchedRecords:
          rawRecords.length,

        complete:
          completeWindow,

        nextCursor:
          text_(
            response.nextCursor
          )
      },

      persisted: {
        totalRows:
          allRows.length,

        scopedRows:
          persisted.scoped.length,

        uniqueObservationKeys:
          Object.keys(
            persisted.groups
          ).length,

        identityErrors: {
          count:
            persisted.errors.length,

          samples:
            persisted.errors
              .slice(
                0,
                options.sampleLimit
              )
              .map(
                rowSummary_
              )
        }
      },

      source: {
        fetchedRecords:
          rawRecords.length,

        normalizedRecords:
          normalizedCount,

        skippedByFilter: {
          count:
            skippedByFilter.length,

          rows:
            skippedByFilter
        },

        errors: {
          count:
            sourceErrors.length,

          rows:
            sourceErrors
        },

        duplicateObservationKeys: {
          count:
            uniqueSourceDuplicateKeys
              .length,

          sourceObservationKeys:
            uniqueSourceDuplicateKeys
        },

        /*
         * Ordered source identity list.
         * Preserved so the Phase B execution
         * evidence can be checksummed externally.
         */
        observationKeys:
          sourceObservationKeys
      },

      classifications:
        classifications,

      crossPrefixContamination: {
        count:
          persisted.crossPrefix.length,

        rows:
          persisted.crossPrefix
            .map(
              rowSummary_
            ),

        matchedSourceWindowCount:
          matchedCrossPrefix.length,

        matchedSourceWindowRows:
          matchedCrossPrefix
            .map(
              rowSummary_
            )
      },

      tableOnlyObservations: {
        count:
          tableOnlyKeys.length,

        sourceObservationKeys:
          tableOnlyKeys,

        samples:
          tableOnlySamples
      },

      anomalySamples:
        anomalySamples,

      /*
       * This means only that both evidence sides
       * were read and classified without structural
       * errors. It is NOT migration or repair
       * authority.
       */
      reconciliationComplete:
        completeWindow &&
        sourceErrors.length === 0 &&
        uniqueSourceDuplicateKeys
          .length === 0 &&
        persisted.errors.length === 0
    };
  }

  return {
    reconcile:
      reconcile
  };
})();


/*
 * Controlled admin-only Phase B entry point.
 */
function reosCountyIdentitySourceReconciliation(
  options
) {
  return REOS
    .CountyIdentitySourceReconciliation
    .reconcile(
      options || {}
    );
}
