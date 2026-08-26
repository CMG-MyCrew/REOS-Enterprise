/**
 * REOS Enterprise - County Identity Repair Evidence Export
 *
 * Phase B.1 lossless read-only forensic export for
 * Philadelphia code violations.
 *
 * Purpose:
 * - independently re-read the certified source window
 * - independently reconstruct source-observation identity
 * - independently reconstruct persisted identity
 * - export COMPLETE row-level evidence for:
 *   - property conflicts
 *   - missing source observations
 *   - persisted duplicate history
 *   - cross-prefix contamination
 *
 * This module DOES NOT:
 * - insert/update/upsert/delete DISTRESS_LEADS
 * - migrate schema
 * - repair identity
 * - create a repair plan with execution authority
 * - call CountyConnectorSDK.run()
 * - run/sync/dryRun the county runtime bridge
 * - write COUNTY_CONNECTOR_RUNS
 * - change scheduler state
 * - create or delete triggers
 *
 * All authority remains fail-closed.
 */
var REOS = REOS || {};

REOS.CountyIdentityRepairEvidenceExport = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var MAX_WINDOW =
    2000;

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function int_(value, fallback) {
    var number =
      Number(value);

    return isFinite(number)
      ? Math.floor(number)
      : fallback;
  }

  function normalizeOptions_(options) {
    options =
      options || {};

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
        int_(
          options.startOffset,
          0
        ),
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

    if (
      connectorId !==
      CONNECTOR_ID
    ) {
      throw new Error(
        'Phase B.1 repair evidence export is restricted to ' +
        CONNECTOR_ID +
        '.'
      );
    }

    if (
      dataset !==
      DATASET
    ) {
      throw new Error(
        'Phase B.1 repair evidence export is restricted to dataset ' +
        DATASET +
        '.'
      );
    }

    if (
      windowSize < 1 ||
      windowSize >
        MAX_WINDOW
    ) {
      throw new Error(
        'Phase B.1 source window must contain 1-' +
        MAX_WINDOW +
        ' records.'
      );
    }

    return {
      connectorId:
        connectorId,

      dataset:
        dataset,

      startOffset:
        startOffset,

      endOffsetExclusive:
        endOffsetExclusive,

      windowSize:
        windowSize
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

        seen[value] =
          true;

        return true;
      });
  }

  function idPrefix_(id) {
    var value =
      text_(id);

    var separator =
      value.indexOf('-');

    return (
      separator > 0
        ? value.slice(
            0,
            separator
          )
        : value
    ).toUpperCase();
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

  function safeValue_(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    if (
      Object.prototype
        .toString
        .call(value) ===
      '[object Date]'
    ) {
      return value.toISOString();
    }

    if (
      typeof value ===
        'string' ||
      typeof value ===
        'number' ||
      typeof value ===
        'boolean'
    ) {
      return value;
    }

    if (
      Array.isArray(value)
    ) {
      return value.map(
        safeValue_
      );
    }

    if (
      typeof value ===
      'object'
    ) {
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

  function copyRecord_(record) {
    return safeValue_(
      record || {}
    );
  }

  function rowSummary_(entry) {
    var row =
      entry.row || {};

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

      parcelId:
        text_(
          row[
            'Parcel ID'
          ]
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
        entry.identityError ||
        ''
    };
  }

  function sourceSummary_(
    normalized,
    identity,
    sourceOffset
  ) {
    return {
      sourceOffset:
        sourceOffset,

      sourceRecordId:
        text_(
          normalized[
            'Source Record ID'
          ]
        ),

      sourceObservationKey:
        text_(
          identity
            .sourceObservationKey
        ),

      sourceCanonicalPropertyKey:
        text_(
          identity
            .canonicalPropertyKey
        ),

      sourceParcelId:
        text_(
          normalized[
            'Parcel ID'
          ]
        ),

      sourceAddress:
        text_(
          normalized.Address
        ),

      sourceCity:
        text_(
          normalized.City
        ),

      sourceState:
        text_(
          normalized.State
        ),

      sourceZip:
        text_(
          normalized.Zip
        ),

      normalizedSourceRecord:
        copyRecord_(
          normalized
        )
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
            text_(
              row.Source
            ) ===
              options.connectorId &&
            text_(
              row[
                'Source Dataset'
              ]
            ) ===
              options.dataset
          );
        });

    var groups = {};
    var errors = [];
    var crossPrefix = [];

    scoped.forEach(function (row) {
      var entry = {
        row:
          row,

        identity:
          null,

        identityError:
          ''
      };

      try {
        entry.identity =
          REOS
            .CanonicalPropertyIdentity
            .resolve(row);
      } catch (error) {
        entry.identityError =
          error &&
          error.message
            ? error.message
            : String(error);

        errors.push(
          entry
        );
      }

      if (
        text_(
          row[
            'Distress Lead ID'
          ]
        ) &&
        idPrefix_(
          row[
            'Distress Lead ID'
          ]
        ) !==
          'DL'
      ) {
        crossPrefix.push(
          entry
        );
      }

      if (
        !entry.identity
      ) {
        return;
      }

      var key =
        text_(
          entry.identity
            .sourceObservationKey
        );

      groups[key] =
        groups[key] || [];

      groups[key]
        .push(entry);
    });

    Object.keys(groups)
      .forEach(function (key) {
        groups[key].sort(
          function (a, b) {
            return (
              Number(
                a.row._rowNumber ||
                0
              ) -
              Number(
                b.row._rowNumber ||
                0
              )
            );
          }
        );
      });

    return {
      scoped:
        scoped,

      groups:
        groups,

      errors:
        errors,

      crossPrefix:
        crossPrefix
    };
  }

  function classificationBucket_() {
    return {
      count:
        0,

      sourceObservationKeys:
        []
    };
  }

  function exportEvidence(options) {
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
      REOS.Database
        .getAll(TABLE);

    var persisted =
      buildPersistedIndex_(
        allRows,
        options
      );

    var context = {
      runId:
        'PHASE-B1-READ-ONLY',

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

      since:
        null,

      dryRun:
        true,

      config:
        {},

      now:
        new Date()
    };

    /*
     * NETWORK READ ONLY.
     *
     * CountyConnectorSDK.run() is intentionally
     * prohibited because that execution path
     * persists county run/audit state.
     */
    var response =
      connector.fetch(
        context
      ) || {};

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
        'Source exceeded requested Phase B.1 window.'
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

    var propertyConflicts =
      [];

    var missingObservations =
      [];

    var skippedByFilter =
      [];

    var sourceErrors =
      [];

    var sourceObservationKeys =
      [];

    var sourceSeen =
      {};

    var sourceDuplicateKeys =
      [];

    var sourceByKey =
      {};

    var classificationByKey =
      {};

    var normalizedCount =
      0;

    rawRecords.forEach(
      function (
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
              rawSourceRecordId_(
                raw
              ),

            stage:
              'normalize',

            error:
              error &&
              error.message
                ? error.message
                : String(error)
          });

          return;
        }

        if (
          normalized &&
          normalized.__skip ===
            true
        ) {
          skippedByFilter.push({
            sourceOffset:
              sourceOffset,

            sourceRecordId:
              rawSourceRecordId_(
                raw
              ),

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
          validation ===
          true
        ) {
          validation = {
            ok:
              true,

            errors:
              []
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
                normalized &&
                normalized[
                  'Source Record ID'
                ]
              ),

            stage:
              'validate',

            errors:
              validation &&
              validation.errors
                ? validation
                    .errors
                    .slice()
                : [
                    'No validation result.'
                  ]
          });

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
              error &&
              error.message
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

        sourceObservationKeys
          .push(
            observationKey
          );

        if (
          sourceSeen[
            observationKey
          ]
        ) {
          sourceDuplicateKeys
            .push(
              observationKey
            );
        }

        sourceSeen[
          observationKey
        ] =
          true;

        var sourceDetail =
          sourceSummary_(
            normalized,
            identity,
            sourceOffset
          );

        sourceByKey[
          observationKey
        ] =
          sourceDetail;

        var group =
          persisted.groups[
            observationKey
          ] || [];

        var persistedCanonicalKeys =
          uniqueStrings_(
            group.map(
              function (entry) {
                return (
                  entry.identity
                    ? entry
                        .identity
                        .canonicalPropertyKey
                    : ''
                );
              }
            )
          );

        var canonicalMismatch =
          persistedCanonicalKeys
            .some(
              function (key) {
                return (
                  key !==
                  sourceCanonicalKey
                );
              }
            );

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

        classificationByKey[
          observationKey
        ] =
          classification;

        classifications[
          classification
        ].count++;

        classifications[
          classification
        ].sourceObservationKeys
          .push(
            observationKey
          );

        if (
          classification ===
          'SOURCE_PROPERTY_CONFLICT'
        ) {
          propertyConflicts.push({
            sourceOffset:
              sourceDetail
                .sourceOffset,

            sourceRecordId:
              sourceDetail
                .sourceRecordId,

            sourceObservationKey:
              sourceDetail
                .sourceObservationKey,

            sourceCanonicalPropertyKey:
              sourceDetail
                .sourceCanonicalPropertyKey,

            sourceParcelId:
              sourceDetail
                .sourceParcelId,

            sourceAddress:
              sourceDetail
                .sourceAddress,

            sourceCity:
              sourceDetail
                .sourceCity,

            sourceState:
              sourceDetail
                .sourceState,

            sourceZip:
              sourceDetail
                .sourceZip,

            normalizedSourceRecord:
              sourceDetail
                .normalizedSourceRecord,

            persistedRowCount:
              group.length,

            persistedCanonicalPropertyKeys:
              persistedCanonicalKeys,

            persistedRows:
              group.map(
                rowSummary_
              )
          });
        }

        if (
          classification ===
          'SOURCE_MISSING_FROM_TABLE'
        ) {
          missingObservations
            .push(
              sourceDetail
            );
        }
      }
    );

    var duplicateHistory =
      [];

    var duplicateSurplusRows =
      0;

    Object.keys(
      persisted.groups
    )
      .sort()
      .forEach(function (key) {
        var group =
          persisted.groups[
            key
          ];

        if (
          group.length <= 1
        ) {
          return;
        }

        var canonicalKeys =
          uniqueStrings_(
            group.map(
              function (entry) {
                return (
                  entry.identity
                    ? entry
                        .identity
                        .canonicalPropertyKey
                    : ''
                );
              }
            )
          );

        duplicateSurplusRows +=
          group.length - 1;

        duplicateHistory.push({
          sourceObservationKey:
            key,

          persistedRowCount:
            group.length,

          surplusRowCount:
            group.length - 1,

          persistedCanonicalPropertyKeys:
            canonicalKeys,

          sourceClassification:
            classificationByKey[
              key
            ] || '',

          matchedSourceWindow:
            Boolean(
              sourceByKey[key]
            ),

          sourceObservation:
            sourceByKey[key] ||
            null,

          persistedRows:
            group.map(
              rowSummary_
            )
        });
      });

    var crossPrefixEvidence =
      persisted.crossPrefix
        .map(function (entry) {
          var key =
            entry.identity
              ? text_(
                  entry.identity
                    .sourceObservationKey
                )
              : '';

          return {
            persistedRow:
              rowSummary_(
                entry
              ),

            matchedSourceWindow:
              Boolean(
                key &&
                sourceByKey[key]
              ),

            sourceClassification:
              key
                ? (
                    classificationByKey[
                      key
                    ] || ''
                  )
                : '',

            sourceObservation:
              key
                ? (
                    sourceByKey[
                      key
                    ] ||
                    null
                  )
                : null
          };
        });

    var tableOnlyObservations =
      [];

    Object.keys(
      persisted.groups
    )
      .sort()
      .forEach(function (key) {
        if (
          sourceSeen[key]
        ) {
          return;
        }

        var group =
          persisted.groups[
            key
          ];

        tableOnlyObservations
          .push({
            sourceObservationKey:
              key,

            persistedRowCount:
              group.length,

            persistedCanonicalPropertyKeys:
              uniqueStrings_(
                group.map(
                  function (entry) {
                    return (
                      entry.identity
                        ? entry
                            .identity
                            .canonicalPropertyKey
                        : ''
                    );
                  }
                )
              ),

            persistedRows:
              group.map(
                rowSummary_
              )
          });
      });

    var classifiedCount =
      classifications
        .SOURCE_PRESENT_ONCE
        .count +

      classifications
        .SOURCE_DUPLICATED_IN_TABLE
        .count +

      classifications
        .SOURCE_PROPERTY_CONFLICT
        .count +

      classifications
        .SOURCE_MISSING_FROM_TABLE
        .count;

    var windowComplete =
      rawRecords.length ===
      options.windowSize;

    var evidenceComplete =
      windowComplete &&
      sourceErrors.length === 0 &&
      sourceDuplicateKeys.length === 0 &&
      persisted.errors.length === 0 &&
      classifiedCount ===
        normalizedCount &&
      propertyConflicts.length ===
        classifications
          .SOURCE_PROPERTY_CONFLICT
          .count &&
      missingObservations.length ===
        classifications
          .SOURCE_MISSING_FROM_TABLE
          .count;

    return {
      ok:
        true,

      mode:
        'READ_ONLY',

      phase:
        'repair_evidence_export',

      sourceAccess:
        'NETWORK_READ_ONLY',

      repairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      repairPlanAuthorityGranted:
        false,

      evidenceComplete:
        evidenceComplete,

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
          windowComplete,

        nextCursor:
          response.nextCursor ===
            undefined ||
          response.nextCursor ===
            null
            ? ''
            : String(
                response.nextCursor
              )
      },

      persisted: {
        totalRows:
          allRows.length,

        scopedRows:
          persisted.scoped
            .length,

        uniqueObservationKeys:
          Object.keys(
            persisted.groups
          ).length,

        identityErrors: {
          count:
            persisted.errors
              .length,

          rows:
            persisted.errors
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

        observationKeys:
          sourceObservationKeys
            .slice(),

        skippedByFilter: {
          count:
            skippedByFilter
              .length,

          rows:
            skippedByFilter
        },

        errors: {
          count:
            sourceErrors
              .length,

          rows:
            sourceErrors
        },

        duplicateObservationKeys: {
          count:
            uniqueStrings_(
              sourceDuplicateKeys
            ).length,

          sourceObservationKeys:
            uniqueStrings_(
              sourceDuplicateKeys
            )
        }
      },

      classifications:
        classifications,

      propertyConflictEvidence: {
        count:
          propertyConflicts
            .length,

        rows:
          propertyConflicts
      },

      missingObservationEvidence: {
        count:
          missingObservations
            .length,

        rows:
          missingObservations
      },

      duplicateHistoryEvidence: {
        groupCount:
          duplicateHistory
            .length,

        surplusRowCount:
          duplicateSurplusRows,

        groups:
          duplicateHistory
      },

      crossPrefixEvidence: {
        count:
          crossPrefixEvidence
            .length,

        matchedSourceWindowCount:
          crossPrefixEvidence
            .filter(
              function (entry) {
                return (
                  entry
                    .matchedSourceWindow
                );
              }
            ).length,

        rows:
          crossPrefixEvidence
      },

      tableOnlyEvidence: {
        count:
          tableOnlyObservations
            .length,

        rows:
          tableOnlyObservations
      }
    };
  }

  return {
    exportEvidence:
      exportEvidence
  };
})();


function reosCountyIdentityRepairEvidenceExport(
  options
) {
  return REOS
    .CountyIdentityRepairEvidenceExport
    .exportEvidence(
      options
    );
}
