/**
 * REOS Enterprise - County Identity Historical Audit
 *
 * Phase A persisted-table audit.
 *
 * Read-only by construction:
 * - reads existing DISTRESS_LEADS headers
 * - reads existing DISTRESS_LEADS rows
 * - reconstructs current source-observation and canonical-property identity
 * - reports migration readiness, duplication, and conflicts
 *
 * This module does not migrate schema, persist rows, execute connectors,
 * access county sources, modify scheduler state, or create triggers.
 */
var REOS = REOS || {};

REOS.CountyIdentityHistoricalAudit = (function () {
  var TABLE = 'DISTRESS_LEADS';
  var DEFAULT_CONNECTOR = 'PA-PHILADELPHIA';
  var DEFAULT_SAMPLE_LIMIT = 25;
  var MAX_SAMPLE_LIMIT = 100;

  function text_(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).trim();
  }

  function sampleLimit_(value) {
    var number = Number(
      value || DEFAULT_SAMPLE_LIMIT
    );

    if (
      !isFinite(number) ||
      number < 1
    ) {
      number = DEFAULT_SAMPLE_LIMIT;
    }

    return Math.min(
      Math.floor(number),
      MAX_SAMPLE_LIMIT
    );
  }

  function normalizeDatasets_(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    var seen = {};

    return value
      .map(function (dataset) {
        return text_(dataset);
      })
      .filter(function (dataset) {
        if (!dataset || seen[dataset]) {
          return false;
        }

        seen[dataset] = true;
        return true;
      });
  }

  function normalizeOptions_(options) {
    options = options || {};

    return {
      connectorId:
        text_(
          options.connectorId ||
          DEFAULT_CONNECTOR
        ),

      datasets:
        normalizeDatasets_(
          options.datasets
        ),

      sampleLimit:
        sampleLimit_(
          options.sampleLimit
        )
    };
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getHeaders !==
        'function' ||
      typeof REOS.Database.getAll !==
        'function'
    ) {
      throw new Error(
        'County identity historical audit requires read-only Database APIs.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity.resolve !==
        'function'
    ) {
      throw new Error(
        'CanonicalPropertyIdentity resolver is required.'
      );
    }

    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Admin security authority is required.'
      );
    }
  }

  function isScoped_(row, options) {
    if (
      options.connectorId &&
      text_(row.Source) !==
        options.connectorId
    ) {
      return false;
    }

    if (
      options.datasets.length &&
      options.datasets.indexOf(
        text_(row['Source Dataset'])
      ) === -1
    ) {
      return false;
    }

    return true;
  }

  function rowSummary_(entry) {
    var row = entry.row;

    return {
      rowNumber:
        Number(row._rowNumber || 0),

      distressLeadId:
        text_(
          row['Distress Lead ID']
        ),

      source:
        text_(row.Source),

      dataset:
        text_(
          row['Source Dataset']
        ),

      sourceRecordId:
        text_(
          row['Source Record ID']
        ),

      parcelId:
        text_(
          row['Parcel ID']
        ),

      reasons:
        entry.reasons.slice()
    };
  }

  function addReason_(entry, reason) {
    if (
      entry.reasons.indexOf(reason) === -1
    ) {
      entry.reasons.push(reason);
    }
  }

  function sampleEntries_(
    entries,
    limit
  ) {
    return entries
      .slice(0, limit)
      .map(rowSummary_);
  }

  function uniqueStrings_(values) {
    var seen = {};

    return values.filter(function (value) {
      var key = text_(value);

      if (!key || seen[key]) {
        return false;
      }

      seen[key] = true;
      return true;
    });
  }

  function audit(options) {
    requireDependencies_();

    /*
     * Explicit authority boundary. This call may read the USERS table
     * through the existing security subsystem, but the historical audit
     * itself performs no persistence.
     */
    REOS.Security.requireAdmin();

    options =
      normalizeOptions_(options);

    var headers =
      REOS.Database.getHeaders(TABLE);

    var allRows =
      REOS.Database.getAll(TABLE);

    var scopedRows =
      allRows.filter(function (row) {
        return isScoped_(
          row,
          options
        );
      });

    var entries =
      scopedRows.map(function (
        row,
        index
      ) {
        return {
          key:
            text_(row._rowNumber) ||
            'scope-' + String(index + 1),

          row: row,
          identity: null,
          identityError: '',
          legacy: false,
          reasons: []
        };
      });

    var observationGroups = {};
    var canonicalGroups = {};
    var identityErrorEntries = [];

    var rowsWithSourceRecordKey = 0;
    var rowsWithSourceObservationKey = 0;
    var rowsWithCanonicalPropertyKey = 0;

    var reconstructableObservationKeys = 0;
    var reconstructableCanonicalKeys = 0;

    var legacyRows = 0;
    var storedKeyMismatchEntries = [];

    entries.forEach(function (entry) {
      var row = entry.row;

      var legacyKey =
        text_(
          row['Source Record Key']
        );

      var storedObservationKey =
        text_(
          row['Source Observation Key']
        );

      var storedCanonicalKey =
        text_(
          row['Canonical Property Key']
        );

      if (legacyKey) {
        rowsWithSourceRecordKey++;
      }

      if (storedObservationKey) {
        rowsWithSourceObservationKey++;
      }

      if (storedCanonicalKey) {
        rowsWithCanonicalPropertyKey++;
      }

      entry.legacy =
        !storedObservationKey ||
        !storedCanonicalKey;

      if (entry.legacy) {
        legacyRows++;
      }

      try {
        /*
         * Reconstruct using the same identity authority the repaired
         * CountyConnectorSDK uses for future persistence.
         */
        entry.identity =
          REOS.CanonicalPropertyIdentity.resolve(
            row
          );

        reconstructableObservationKeys++;
        reconstructableCanonicalKeys++;
      } catch (error) {
        entry.identityError =
          error && error.message
            ? error.message
            : String(error);

        addReason_(
          entry,
          'identity_reconstruction_failed'
        );

        identityErrorEntries.push(
          entry
        );

        return;
      }

      var observationKey =
        text_(
          entry.identity
            .sourceObservationKey
        );

      var canonicalKey =
        text_(
          entry.identity
            .canonicalPropertyKey
        );

      if (!observationGroups[observationKey]) {
        observationGroups[observationKey] = [];
      }

      observationGroups[
        observationKey
      ].push(entry);

      if (!canonicalGroups[canonicalKey]) {
        canonicalGroups[canonicalKey] = [];
      }

      canonicalGroups[
        canonicalKey
      ].push(entry);

      if (
        legacyKey &&
        legacyKey !== observationKey
      ) {
        addReason_(
          entry,
          'legacy_source_record_key_mismatch'
        );

        storedKeyMismatchEntries.push(
          entry
        );
      }

      if (
        storedObservationKey &&
        storedObservationKey !==
          observationKey
      ) {
        addReason_(
          entry,
          'stored_source_observation_key_mismatch'
        );

        storedKeyMismatchEntries.push(
          entry
        );
      }

      if (
        storedCanonicalKey &&
        storedCanonicalKey !==
          canonicalKey
      ) {
        addReason_(
          entry,
          'stored_canonical_property_key_mismatch'
        );

        storedKeyMismatchEntries.push(
          entry
        );
      }
    });

    var duplicateGroups = [];
    var conflictGroups = [];

    Object.keys(
      observationGroups
    ).forEach(function (
      observationKey
    ) {
      var group =
        observationGroups[
          observationKey
        ];

      if (group.length <= 1) {
        return;
      }

      group.forEach(function (entry) {
        addReason_(
          entry,
          'duplicate_source_observation_key'
        );
      });

      var canonicalKeys =
        uniqueStrings_(
          group.map(function (entry) {
            return entry.identity
              .canonicalPropertyKey;
          })
        );

      duplicateGroups.push({
        sourceObservationKey:
          observationKey,

        rowCount:
          group.length,

        canonicalPropertyCount:
          canonicalKeys.length,

        rows:
          sampleEntries_(
            group,
            options.sampleLimit
          )
      });

      if (canonicalKeys.length > 1) {
        group.forEach(function (entry) {
          addReason_(
            entry,
            'observation_property_conflict'
          );
        });

        conflictGroups.push({
          sourceObservationKey:
            observationKey,

          canonicalPropertyKeys:
            canonicalKeys,

          rowCount:
            group.length,

          rows:
            sampleEntries_(
              group,
              options.sampleLimit
            )
        });
      }
    });

    var multiObservationGroups = [];

    Object.keys(
      canonicalGroups
    ).forEach(function (
      canonicalKey
    ) {
      var group =
        canonicalGroups[
          canonicalKey
        ];

      var observationKeys =
        uniqueStrings_(
          group.map(function (entry) {
            return entry.identity
              .sourceObservationKey;
          })
        );

      if (observationKeys.length > 1) {
        multiObservationGroups.push({
          canonicalPropertyKey:
            canonicalKey,

          observationCount:
            observationKeys.length,

          rowCount:
            group.length,

          rows:
            sampleEntries_(
              group,
              options.sampleLimit
            )
        });
      }
    });

    var migrationReadyEntries =
      entries.filter(function (entry) {
        return (
          entry.legacy &&
          entry.identity &&
          entry.reasons.length === 0
        );
      });

    var reviewEntries =
      entries.filter(function (entry) {
        return (
          entry.reasons.length > 0
        );
      });

    var uniqueMismatchEntries = [];
    var mismatchSeen = {};

    storedKeyMismatchEntries
      .forEach(function (entry) {
        if (!mismatchSeen[entry.key]) {
          mismatchSeen[entry.key] = true;
          uniqueMismatchEntries.push(
            entry
          );
        }
      });

    return {
      ok: true,
      mode: 'READ_ONLY',
      phase: 'persisted_table',

      table: TABLE,

      scope: {
        connectorId:
          options.connectorId,

        datasets:
          options.datasets.slice()
      },

      schema: {
        headers:
          headers.slice(),

        hasSourceObservationKey:
          headers.indexOf(
            'Source Observation Key'
          ) !== -1,

        hasCanonicalPropertyKey:
          headers.indexOf(
            'Canonical Property Key'
          ) !== -1
      },

      totalRows:
        allRows.length,

      scopedRows:
        scopedRows.length,

      legacyRows:
        legacyRows,

      rowsWithSourceRecordKey:
        rowsWithSourceRecordKey,

      rowsWithSourceObservationKey:
        rowsWithSourceObservationKey,

      rowsWithCanonicalPropertyKey:
        rowsWithCanonicalPropertyKey,

      reconstructableObservationKeys:
        reconstructableObservationKeys,

      reconstructableCanonicalKeys:
        reconstructableCanonicalKeys,

      identityErrors: {
        count:
          identityErrorEntries.length,

        samples:
          identityErrorEntries
            .slice(
              0,
              options.sampleLimit
            )
            .map(function (entry) {
              var summary =
                rowSummary_(entry);

              summary.error =
                entry.identityError;

              return summary;
            })
      },

      duplicateObservationKeys: {
        count:
          duplicateGroups.length,

        groups:
          duplicateGroups.slice(
            0,
            options.sampleLimit
          )
      },

      observationPropertyConflicts: {
        count:
          conflictGroups.length,

        groups:
          conflictGroups.slice(
            0,
            options.sampleLimit
          )
      },

      canonicalPropertyGroups: {
        count:
          Object.keys(
            canonicalGroups
          ).length
      },

      multiObservationPropertyGroups: {
        count:
          multiObservationGroups.length,

        groups:
          multiObservationGroups.slice(
            0,
            options.sampleLimit
          )
      },

      storedKeyMismatches: {
        count:
          uniqueMismatchEntries.length,

        samples:
          sampleEntries_(
            uniqueMismatchEntries,
            options.sampleLimit
          )
      },

      migrationReadyRows: {
        count:
          migrationReadyEntries.length,

        samples:
          sampleEntries_(
            migrationReadyEntries,
            options.sampleLimit
          )
      },

      reviewRequiredRows: {
        count:
          reviewEntries.length,

        samples:
          sampleEntries_(
            reviewEntries,
            options.sampleLimit
          )
      },

      /*
       * This flag means only that the persisted rows have no detected
       * Phase A conflicts. It does NOT assert that historical source
       * observations were never overwritten. Source reconciliation is
       * intentionally a separate Phase B gate.
       */
      safeToMigratePersistedRows:
        reviewEntries.length === 0
    };
  }

  return {
    audit: audit
  };
})();


/*
 * Controlled admin-only read entry point.
 */
function reosCountyIdentityHistoricalAudit(
  options
) {
  return REOS.CountyIdentityHistoricalAudit.audit(
    options || {}
  );
}
