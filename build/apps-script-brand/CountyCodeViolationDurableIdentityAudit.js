/**
 * REOS Enterprise - Philadelphia Code-Violation Durable Identity Audit
 *
 * Read-only persisted-table audit for replacing unstable ArcGIS objectid
 * observation authority with durable violation-number authority.
 *
 * This module:
 * - reads DISTRESS_LEADS only
 * - scopes only PA-PHILADELPHIA / code_violations
 * - derives a proposed durable observation key from Violation Number
 * - detects proposed-key duplicates and property conflicts
 * - detects legacy ObjectID keys reused across durable observations
 * - identifies rows requiring collapse or manual review
 *
 * It does NOT mutate rows, execute connectors, alter checkpoints,
 * create scheduler authority, migrate identity, or grant offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationDurableIdentityAudit = (function () {
  var TABLE = 'DISTRESS_LEADS';
  var CONNECTOR = 'PA-PHILADELPHIA';
  var DATASET = 'code_violations';
  var DEFAULT_SAMPLE_LIMIT = 50;
  var MAX_SAMPLE_LIMIT = 250;

  function text_(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).trim();
  }

  function keyPart_(value) {
    return text_(value)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');
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

  function proposedDurableKey_(row) {
    var violationNumber =
      text_(row['Violation Number']);

    if (!violationNumber) {
      return '';
    }

    return [
      keyPart_(row.Source),
      keyPart_(row['Source Dataset']),
      keyPart_(violationNumber)
    ].join('|');
  }

  function legacyObservationKey_(row) {
    var stored =
      text_(row['Source Observation Key']) ||
      text_(row['Source Record Key']);

    if (stored) {
      return stored;
    }

    var sourceRecordId =
      text_(row['Source Record ID']);

    if (!sourceRecordId) {
      return '';
    }

    return [
      keyPart_(row.Source),
      keyPart_(row['Source Dataset']),
      keyPart_(sourceRecordId)
    ].join('|');
  }

  function canonicalKey_(row) {
    var result =
      REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity(row);

    return result && result.ok
      ? text_(result.key)
      : '';
  }

  function addReason_(entry, reason) {
    if (
      entry.reasons.indexOf(reason) === -1
    ) {
      entry.reasons.push(reason);
    }
  }

  function rowSummary_(entry) {
    return {
      rowNumber:
        Number(entry.row._rowNumber || 0),

      distressLeadId:
        text_(entry.row['Distress Lead ID']),

      sourceRecordId:
        text_(entry.row['Source Record ID']),

      violationNumber:
        entry.violationNumber,

      parcelId:
        text_(entry.row['Parcel ID']),

      canonicalPropertyKey:
        entry.canonicalPropertyKey,

      legacyObservationKey:
        entry.legacyObservationKey,

      proposedDurableKey:
        entry.proposedDurableKey,

      reasons:
        entry.reasons.slice()
    };
  }

  function sampleEntries_(entries, limit) {
    return entries
      .slice(0, limit)
      .map(rowSummary_);
  }

  function audit(options) {
    options = options || {};

    if (
      !REOS.Database ||
      typeof REOS.Database.getHeaders !==
        'function' ||
      typeof REOS.Database.getAll !==
        'function'
    ) {
      throw new Error(
        'Durable identity audit requires read-only Database APIs.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity !==
        'function'
    ) {
      throw new Error(
        'Canonical property identity authority is required.'
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

    REOS.Security.requireAdmin();

    var limit =
      sampleLimit_(options.sampleLimit);

    var headers =
      REOS.Database.getHeaders(TABLE);

    var allRows =
      REOS.Database.getAll(TABLE);

    var scopedRows =
      allRows.filter(function (row) {
        return (
          text_(row.Source) === CONNECTOR &&
          text_(row['Source Dataset']) ===
            DATASET
        );
      });

    var entries =
      scopedRows.map(function (row) {
        var violationNumber =
          text_(row['Violation Number']);

        var canonicalPropertyKey =
          canonicalKey_(row);

        var entry = {
          row: row,
          violationNumber:
            violationNumber,
          proposedDurableKey:
            proposedDurableKey_(row),
          legacyObservationKey:
            legacyObservationKey_(row),
          canonicalPropertyKey:
            canonicalPropertyKey,
          reasons: []
        };

        if (!violationNumber) {
          addReason_(
            entry,
            'missing_violation_number'
          );
        }

        if (!canonicalPropertyKey) {
          addReason_(
            entry,
            'canonical_identity_unavailable'
          );
        }

        return entry;
      });

    var durableGroups = {};
    var legacyGroups = {};

    entries.forEach(function (entry) {
      if (entry.proposedDurableKey) {
        if (
          !durableGroups[
            entry.proposedDurableKey
          ]
        ) {
          durableGroups[
            entry.proposedDurableKey
          ] = [];
        }

        durableGroups[
          entry.proposedDurableKey
        ].push(entry);
      }

      if (
        entry.legacyObservationKey &&
        entry.proposedDurableKey
      ) {
        if (
          !legacyGroups[
            entry.legacyObservationKey
          ]
        ) {
          legacyGroups[
            entry.legacyObservationKey
          ] = [];
        }

        legacyGroups[
          entry.legacyObservationKey
        ].push(entry);
      }
    });

    var duplicateDurableGroups = [];
    var durablePropertyConflicts = [];
    var durableMultiLegacyGroups = [];

    Object.keys(durableGroups)
      .forEach(function (durableKey) {
        var group =
          durableGroups[durableKey];

        var canonicalKeys =
          uniqueStrings_(
            group.map(function (entry) {
              return entry
                .canonicalPropertyKey;
            })
          );

        var legacyKeys =
          uniqueStrings_(
            group.map(function (entry) {
              return entry
                .legacyObservationKey;
            })
          );

        if (group.length > 1) {
          group.forEach(function (entry) {
            addReason_(
              entry,
              'durable_key_requires_collapse'
            );
          });

          duplicateDurableGroups.push({
            proposedDurableKey:
              durableKey,
            rowCount:
              group.length,
            canonicalPropertyCount:
              canonicalKeys.length,
            legacyObservationKeyCount:
              legacyKeys.length,
            rows:
              sampleEntries_(
                group,
                limit
              )
          });
        }

        if (canonicalKeys.length > 1) {
          group.forEach(function (entry) {
            addReason_(
              entry,
              'durable_key_property_conflict'
            );
          });

          durablePropertyConflicts.push({
            proposedDurableKey:
              durableKey,
            canonicalPropertyKeys:
              canonicalKeys,
            rowCount:
              group.length,
            rows:
              sampleEntries_(
                group,
                limit
              )
          });
        }

        if (legacyKeys.length > 1) {
          durableMultiLegacyGroups.push({
            proposedDurableKey:
              durableKey,
            legacyObservationKeys:
              legacyKeys,
            rowCount:
              group.length,
            rows:
              sampleEntries_(
                group,
                limit
              )
          });
        }
      });

    var legacyToDurableConflicts = [];

    Object.keys(legacyGroups)
      .forEach(function (legacyKey) {
        var group =
          legacyGroups[legacyKey];

        var durableKeys =
          uniqueStrings_(
            group.map(function (entry) {
              return entry
                .proposedDurableKey;
            })
          );

        if (durableKeys.length <= 1) {
          return;
        }

        group.forEach(function (entry) {
          addReason_(
            entry,
            'legacy_observation_maps_to_multiple_durable_keys'
          );
        });

        legacyToDurableConflicts.push({
          legacyObservationKey:
            legacyKey,
          proposedDurableKeys:
            durableKeys,
          rowCount:
            group.length,
          rows:
            sampleEntries_(
              group,
              limit
            )
        });
      });

    var missingViolationEntries =
      entries.filter(function (entry) {
        return !entry.violationNumber;
      });

    var collapseEntries =
      entries.filter(function (entry) {
        return (
          entry.reasons.indexOf(
            'durable_key_requires_collapse'
          ) !== -1
        );
      });

    var reviewEntries =
      entries.filter(function (entry) {
        return (
          entry.reasons.indexOf(
            'missing_violation_number'
          ) !== -1 ||
          entry.reasons.indexOf(
            'canonical_identity_unavailable'
          ) !== -1 ||
          entry.reasons.indexOf(
            'durable_key_property_conflict'
          ) !== -1 ||
          entry.reasons.indexOf(
            'legacy_observation_maps_to_multiple_durable_keys'
          ) !== -1
        );
      });

    var migrationReadyEntries =
      entries.filter(function (entry) {
        return entry.reasons.length === 0;
      });

    return {
      ok: true,
      mode: 'READ_ONLY',
      phase:
        'code_violation_durable_identity',

      scope: {
        connectorId: CONNECTOR,
        dataset: DATASET
      },

      schema: {
        hasViolationNumber:
          headers.indexOf(
            'Violation Number'
          ) !== -1,

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

      rowsWithViolationNumber:
        entries.length -
        missingViolationEntries.length,

      rowsMissingViolationNumber: {
        count:
          missingViolationEntries.length,
        samples:
          sampleEntries_(
            missingViolationEntries,
            limit
          )
      },

      proposedDurableKeys: {
        count:
          Object.keys(
            durableGroups
          ).length
      },

      duplicateProposedDurableKeys: {
        count:
          duplicateDurableGroups.length,
        groups:
          duplicateDurableGroups.slice(
            0,
            limit
          )
      },

      proposedDurableKeyPropertyConflicts: {
        count:
          durablePropertyConflicts.length,
        groups:
          durablePropertyConflicts.slice(
            0,
            limit
          )
      },

      legacyObservationKeyToDurableKeyConflicts: {
        count:
          legacyToDurableConflicts.length,
        groups:
          legacyToDurableConflicts.slice(
            0,
            limit
          )
      },

      durableKeysWithMultipleLegacyObservationKeys: {
        count:
          durableMultiLegacyGroups.length,
        groups:
          durableMultiLegacyGroups.slice(
            0,
            limit
          )
      },

      migrationReadyRows: {
        count:
          migrationReadyEntries.length,
        samples:
          sampleEntries_(
            migrationReadyEntries,
            limit
          )
      },

      collapseRequiredRows: {
        count:
          collapseEntries.length,
        samples:
          sampleEntries_(
            collapseEntries,
            limit
          )
      },

      reviewRequiredRows: {
        count:
          reviewEntries.length,
        samples:
          sampleEntries_(
            reviewEntries,
            limit
          )
      },

      safeToMigrateDurableIdentity:
        reviewEntries.length === 0 &&
        collapseEntries.length === 0,

      productionDataMutationAuthorityGranted:
        false,

      connectorExecutionAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  return {
    audit: audit
  };
})();


/*
 * Controlled admin-only read entry point.
 */
function reosCountyCodeViolationDurableIdentityAudit(
  options
) {
  return REOS
    .CountyCodeViolationDurableIdentityAudit
    .audit(options || {});
}
