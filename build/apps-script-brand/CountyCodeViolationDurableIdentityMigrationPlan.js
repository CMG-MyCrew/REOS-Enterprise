/*
 * REOS Enterprise
 *
 * Gate 2B - Philadelphia code-violation durable identity
 * migration plan.
 *
 * READ ONLY.
 *
 * This module exposes the COMPLETE deterministic migration-ready
 * population needed for a later bounded migration executor.
 *
 * It grants no mutation, scheduler, checkpoint, collapse,
 * winner-selection, review-repair, dedupe, or offer authority.
 */

REOS.CountyCodeViolationDurableIdentityMigrationPlan =
  (function () {
    var TABLE =
      'DISTRESS_LEADS';

    var CONNECTOR =
      'PA-PHILADELPHIA';

    var DATASET =
      'code_violations';

    var MODE =
      'READ_ONLY_CODE_VIOLATION_DURABLE_IDENTITY_MIGRATION_PLAN';

    var REQUIRED_HEADERS = [
      'Distress Lead ID',
      'Source',
      'Source Dataset',
      'Source Record ID',
      'Violation Number',
      'Source Observation Key',
      'Source Record Key',
      'Canonical Property Key'
    ];


    function text_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      ).trim();
    }


    function upper_(value) {
      return text_(value)
        .toUpperCase();
    }


    function keyPart_(value) {
      return text_(value)
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/\|/g, '%7c');
    }


    function uniqueStrings_(values) {
      var seen = {};

      return (values || [])
        .map(text_)
        .filter(function (value) {
          if (!value || seen[value]) {
            return false;
          }

          seen[value] = true;
          return true;
        });
    }


    function addUnique_(
      values,
      value
    ) {
      if (
        values.indexOf(value) ===
        -1
      ) {
        values.push(value);
      }
    }


    /*
     * This deliberately mirrors the existing durable audit key
     * construction so migration-ready classification remains compatible
     * with the already-certified audit.
     */
    function proposedDurableKey_(row) {
      var violationNumber =
        text_(
          row[
            'Violation Number'
          ]
        );

      if (!violationNumber) {
        return '';
      }

      return [
        keyPart_(row.Source),
        keyPart_(
          row[
            'Source Dataset'
          ]
        ),
        keyPart_(
          violationNumber
        )
      ].join('|');
    }


    function normalizeObservationKey_(value) {
      var parts =
        text_(value)
          .split('|');

      if (parts.length !== 3) {
        return '';
      }

      return [
        keyPart_(parts[0]),
        keyPart_(parts[1]),
        keyPart_(parts[2])
      ].join('|');
    }


    function legacyObservationKey_(row) {
      var stored =
        text_(
          row[
            'Source Observation Key'
          ]
        ) ||
        text_(
          row[
            'Source Record Key'
          ]
        );

      if (stored) {
        return normalizeObservationKey_(
          stored
        );
      }

      var sourceRecordId =
        text_(
          row[
            'Source Record ID'
          ]
        );

      if (!sourceRecordId) {
        return '';
      }

      return [
        keyPart_(row.Source),
        keyPart_(
          row[
            'Source Dataset'
          ]
        ),
        keyPart_(
          sourceRecordId
        )
      ].join('|');
    }


    function isLegacyObjectIdKey_(value) {
      var normalized =
        normalizeObservationKey_(
          value
        );

      var parts =
        normalized.split('|');

      return (
        parts.length === 3 &&
        parts[0] ===
          keyPart_(CONNECTOR) &&
        parts[1] ===
          keyPart_(DATASET) &&
        /^[0-9]+$/.test(
          parts[2]
        )
      );
    }


    /*
     * Gate 2A runtime identity accepts only this Violation Number
     * domain. An audit-ready row outside it is therefore blocked from
     * execution rather than silently normalized.
     */
    function validRuntimeViolationNumber_(
      value
    ) {
      var normalized =
        upper_(value);

      return (
        !!normalized &&
        normalized.length <= 64 &&
        /^[A-Z0-9._-]+$/.test(
          normalized
        )
      );
    }


    function canonicalKey_(row) {
      var result =
        REOS
          .CanonicalPropertyIdentity
          .tryCanonicalPropertyIdentity(
            row
          );

      return (
        result &&
        result.ok
      )
        ? text_(result.key)
        : '';
    }


    function managedTriggerCount_() {
      return ScriptApp
        .getProjectTriggers()
        .filter(function (trigger) {
          return (
            trigger &&
            typeof trigger
              .getHandlerFunction ===
              'function' &&
            trigger.getHandlerFunction() ===
              'reosCountyProductionSchedulerRun'
          );
        })
        .length;
    }


    function sha256Hex_(value) {
      var bytes =
        Utilities.computeDigest(
          Utilities
            .DigestAlgorithm
            .SHA_256,
          String(value),
          Utilities
            .Charset
            .UTF_8
        );

      return bytes
        .map(function (byte) {
          var value =
            Number(byte);

          if (value < 0) {
            value += 256;
          }

          return (
            '0' +
            value.toString(16)
          ).slice(-2);
        })
        .join('');
    }


    function requireDependencies_() {
      if (
        !REOS.Database ||
        typeof REOS.Database
          .getHeaders !==
          'function' ||
        typeof REOS.Database
          .getAll !==
          'function'
      ) {
        throw new Error(
          'Gate 2B migration plan requires read-only Database APIs.'
        );
      }

      if (
        !REOS
          .CanonicalPropertyIdentity ||
        typeof REOS
          .CanonicalPropertyIdentity
          .tryCanonicalPropertyIdentity !==
          'function'
      ) {
        throw new Error(
          'Gate 2B migration plan requires canonical property identity.'
        );
      }

      if (
        !REOS.Security ||
        typeof REOS.Security
          .requireAdmin !==
          'function'
      ) {
        throw new Error(
          'Gate 2B migration plan requires Admin authority.'
        );
      }

      if (
        typeof ScriptApp ===
          'undefined' ||
        !ScriptApp ||
        typeof ScriptApp
          .getProjectTriggers !==
          'function'
      ) {
        throw new Error(
          'Gate 2B migration plan requires read-only trigger inspection.'
        );
      }

      if (
        typeof Utilities ===
          'undefined' ||
        !Utilities ||
        typeof Utilities
          .computeDigest !==
          'function'
      ) {
        throw new Error(
          'Gate 2B migration plan requires SHA-256 digest authority.'
        );
      }
    }


    function requireSchema_(headers) {
      REQUIRED_HEADERS.forEach(
        function (header) {
          if (
            headers.indexOf(header) ===
            -1
          ) {
            throw new Error(
              'Gate 2B migration plan missing required header: ' +
              header
            );
          }
        }
      );
    }


    function classify_(rows) {
      var entries =
        rows.map(function (row) {
          var violationNumber =
            text_(
              row[
                'Violation Number'
              ]
            );

          var entry = {
            row:
              row,

            violationNumber:
              violationNumber,

            proposedDurableKey:
              proposedDurableKey_(
                row
              ),

            legacyObservationKey:
              legacyObservationKey_(
                row
              ),

            canonicalPropertyKey:
              canonicalKey_(row),

            reasons:
              []
          };

          if (!violationNumber) {
            addUnique_(
              entry.reasons,
              'missing_violation_number'
            );
          }

          if (
            !entry
              .canonicalPropertyKey
          ) {
            addUnique_(
              entry.reasons,
              'canonical_identity_unavailable'
            );
          }

          return entry;
        });

      var durableGroups = {};
      var legacyGroups = {};

      entries.forEach(
        function (entry) {
          if (
            entry
              .proposedDurableKey
          ) {
            durableGroups[
              entry
                .proposedDurableKey
            ] =
              durableGroups[
                entry
                  .proposedDurableKey
              ] ||
              [];

            durableGroups[
              entry
                .proposedDurableKey
            ].push(entry);
          }

          if (
            entry
              .legacyObservationKey &&
            entry
              .proposedDurableKey
          ) {
            legacyGroups[
              entry
                .legacyObservationKey
            ] =
              legacyGroups[
                entry
                  .legacyObservationKey
              ] ||
              [];

            legacyGroups[
              entry
                .legacyObservationKey
            ].push(entry);
          }
        }
      );

      Object.keys(
        durableGroups
      ).forEach(
        function (durableKey) {
          var group =
            durableGroups[
              durableKey
            ];

          var canonicalKeys =
            uniqueStrings_(
              group.map(
                function (entry) {
                  return entry
                    .canonicalPropertyKey;
                }
              )
            );

          if (group.length > 1) {
            group.forEach(
              function (entry) {
                addUnique_(
                  entry.reasons,
                  'durable_key_requires_collapse'
                );
              }
            );
          }

          if (
            canonicalKeys.length >
            1
          ) {
            group.forEach(
              function (entry) {
                addUnique_(
                  entry.reasons,
                  'durable_key_property_conflict'
                );
              }
            );
          }
        }
      );

      Object.keys(
        legacyGroups
      ).forEach(
        function (legacyKey) {
          var group =
            legacyGroups[
              legacyKey
            ];

          var durableKeys =
            uniqueStrings_(
              group.map(
                function (entry) {
                  return entry
                    .proposedDurableKey;
                }
              )
            );

          if (
            durableKeys.length <=
            1
          ) {
            return;
          }

          group.forEach(
            function (entry) {
              addUnique_(
                entry.reasons,
                'legacy_observation_maps_to_multiple_durable_keys'
              );
            }
          );
        }
      );

      return entries;
    }


    function reviewRequired_(entry) {
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
    }


    function planRecord_(entry) {
      var row =
        entry.row;

      var rowNumber =
        Number(
          row._rowNumber ||
          0
        );

      var distressLeadId =
        text_(
          row[
            'Distress Lead ID'
          ]
        );

      var sourceObservationKey =
        normalizeObservationKey_(
          row[
            'Source Observation Key'
          ]
        );

      var sourceRecordKey =
        normalizeObservationKey_(
          row[
            'Source Record Key'
          ]
        );

      var storedCanonicalPropertyKey =
        text_(
          row[
            'Canonical Property Key'
          ]
        );

      var blockers =
        [];

      if (
        !rowNumber ||
        rowNumber < 2
      ) {
        addUnique_(
          blockers,
          'physical_row_authority_unavailable'
        );
      }

      if (!distressLeadId) {
        addUnique_(
          blockers,
          'distress_lead_id_unavailable'
        );
      }

      if (
        !validRuntimeViolationNumber_(
          entry.violationNumber
        )
      ) {
        addUnique_(
          blockers,
          'runtime_violation_number_invalid'
        );
      }

      if (
        !sourceObservationKey ||
        !sourceRecordKey
      ) {
        addUnique_(
          blockers,
          'stored_observation_key_incomplete'
        );
      } else if (
        sourceObservationKey !==
        sourceRecordKey
      ) {
        addUnique_(
          blockers,
          'stored_observation_keys_disagree'
        );
      }

      if (
        !storedCanonicalPropertyKey
      ) {
        addUnique_(
          blockers,
          'stored_canonical_identity_missing'
        );
      } else if (
        storedCanonicalPropertyKey !==
          entry
            .canonicalPropertyKey
      ) {
        addUnique_(
          blockers,
          'stored_canonical_identity_mismatch'
        );
      }

      var alreadyDurable =
        (
          sourceObservationKey ===
            entry
              .proposedDurableKey &&
          sourceRecordKey ===
            entry
              .proposedDurableKey
        );

      if (
        !alreadyDurable &&
        !isLegacyObjectIdKey_(
          entry
            .legacyObservationKey
        )
      ) {
        addUnique_(
          blockers,
          'legacy_objectid_identity_unavailable'
        );
      }

      var record = {
        rowNumber:
          rowNumber,

        distressLeadId:
          distressLeadId,

        sourceRecordId:
          text_(
            row[
              'Source Record ID'
            ]
          ),

        violationNumber:
          upper_(
            entry
              .violationNumber
          ),

        parcelId:
          text_(
            row[
              'Parcel ID'
            ]
          ),

        canonicalPropertyKey:
          entry
            .canonicalPropertyKey,

        storedCanonicalPropertyKey:
          storedCanonicalPropertyKey,

        sourceObservationKey:
          sourceObservationKey,

        sourceRecordKey:
          sourceRecordKey,

        legacyObservationKey:
          entry
            .legacyObservationKey,

        proposedDurableKey:
          entry
            .proposedDurableKey,

        alreadyDurable:
          alreadyDurable,

        planBlockReasons:
          blockers
      };

      record.prestateFingerprintSha256 =
        sha256Hex_(
          JSON.stringify({
            rowNumber:
              record.rowNumber,
            distressLeadId:
              record.distressLeadId,
            sourceRecordId:
              record.sourceRecordId,
            violationNumber:
              record.violationNumber,
            parcelId:
              record.parcelId,
            canonicalPropertyKey:
              record.canonicalPropertyKey,
            storedCanonicalPropertyKey:
              record.storedCanonicalPropertyKey,
            sourceObservationKey:
              record.sourceObservationKey,
            sourceRecordKey:
              record.sourceRecordKey,
            legacyObservationKey:
              record.legacyObservationKey,
            proposedDurableKey:
              record.proposedDurableKey
          })
        );

      return record;
    }


    function build(options) {
      options =
        options ||
        {};

      requireDependencies_();

      REOS.Security
        .requireAdmin();

      if (
        managedTriggerCount_() !==
        0
      ) {
        throw new Error(
          'Gate 2B migration plan requires zero managed county scheduler triggers.'
        );
      }

      var headers =
        REOS.Database
          .getHeaders(
            TABLE
          );

      requireSchema_(
        headers
      );

      var allRows =
        REOS.Database
          .getAll(
            TABLE
          );

      var scopedRows =
        allRows.filter(
          function (row) {
            return (
              text_(
                row.Source
              ) ===
                CONNECTOR &&
              text_(
                row[
                  'Source Dataset'
                ]
              ) ===
                DATASET
            );
          }
        );

      var entries =
        classify_(
          scopedRows
        );

      var migrationReadyEntries =
        entries.filter(
          function (entry) {
            return (
              entry.reasons
                .length ===
              0
            );
          }
        );

      var collapseEntries =
        entries.filter(
          function (entry) {
            return (
              entry.reasons
                .indexOf(
                  'durable_key_requires_collapse'
                ) !==
              -1
            );
          }
        );

      var reviewEntries =
        entries.filter(
          reviewRequired_
        );

      var planned =
        migrationReadyEntries
          .map(
            planRecord_
          );

      planned.sort(
        function (a, b) {
          var compared =
            a.proposedDurableKey
              .localeCompare(
                b.proposedDurableKey
              );

          return (
            compared !== 0
              ? compared
              : (
                  a.rowNumber -
                  b.rowNumber
                )
          );
        }
      );

      var blocked =
        planned.filter(
          function (record) {
            return (
              record
                .planBlockReasons
                .length >
              0
            );
          }
        );

      var alreadyDurable =
        planned.filter(
          function (record) {
            return (
              record
                .planBlockReasons
                .length ===
                0 &&
              record
                .alreadyDurable ===
                true
            );
          }
        );

      var migrationRequired =
        planned.filter(
          function (record) {
            return (
              record
                .planBlockReasons
                .length ===
                0 &&
              record
                .alreadyDurable !==
                true
            );
          }
        );

      var migrationMaterial =
        migrationRequired
          .map(
            function (record) {
              return [
                record
                  .proposedDurableKey,
                record
                  .distressLeadId,
                String(
                  record.rowNumber
                ),
                record
                  .prestateFingerprintSha256
              ].join('|');
            }
          )
          .join('\n');

      var completePlanMaterial =
        planned
          .map(
            function (record) {
              return [
                record
                  .proposedDurableKey,
                record
                  .distressLeadId,
                String(
                  record.rowNumber
                ),
                record
                  .alreadyDurable
                    ? 'ALREADY_DURABLE'
                    : 'NOT_DURABLE',
                record
                  .planBlockReasons
                  .join(','),
                record
                  .prestateFingerprintSha256
              ].join('|');
            }
          )
          .join('\n');

      if (
        managedTriggerCount_() !==
        0
      ) {
        throw new Error(
          'Gate 2B migration plan scheduler authority changed during read-only planning.'
        );
      }

      return {
        ok:
          true,

        readOnly:
          true,

        mode:
          MODE,

        phase:
          'gate_2b_migration_ready_plan',

        table:
          TABLE,

        connectorId:
          CONNECTOR,

        dataset:
          DATASET,

        durableIdentityField:
          'Violation Number',

        countySchedulerTriggerCount:
          0,

        totalRows:
          allRows.length,

        scopedRows:
          scopedRows.length,

        migrationReadyAuditRows:
          migrationReadyEntries
            .length,

        collapseRequiredRows:
          collapseEntries
            .length,

        reviewRequiredRows:
          reviewEntries
            .length,

        alreadyDurableRows:
          alreadyDurable
            .length,

        migrationRequiredRows:
          migrationRequired
            .length,

        planBlockedRows:
          blocked.length,

        /*
         * These arrays are intentionally COMPLETE, not sample-limited.
         */
        migrationRequiredRecords:
          migrationRequired,

        alreadyDurableRecords:
          alreadyDurable,

        planBlockedRecords:
          blocked,

        migrationPlanSha256:
          sha256Hex_(
            migrationMaterial
          ),

        completePlanSha256:
          sha256Hex_(
            completePlanMaterial
          ),

        migrationReadyOnlyPlanComplete:
          blocked.length ===
            0,

        collapseAuthorityGranted:
          false,

        reviewRepairAuthorityGranted:
          false,

        winnerSelectionAuthorityGranted:
          false,

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
      build:
        build
    };
  })();


/*
 * Controlled Admin-only READ-ONLY RPC.
 */
function reosCountyCodeViolationDurableIdentityMigrationPlan(
  options
) {
  return REOS
    .CountyCodeViolationDurableIdentityMigrationPlan
    .build(
      options ||
      {}
    );
}
