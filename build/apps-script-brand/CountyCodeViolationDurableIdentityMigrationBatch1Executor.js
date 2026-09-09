/*
 * REOS Enterprise
 *
 * Gate 2B - Philadelphia code-violation durable observation identity.
 *
 * BATCH-1-ONLY MIGRATION EXECUTOR.
 *
 * Authority is deliberately limited to the ten certified migration-ready
 * physical rows 3578-3587 from production Gate 2B plan SHA-256:
 *
 * 85ed3193aa1486116e76b7c892e5f4090974c3399479ea49185f88dd265c7adf
 *
 * This executor:
 * - changes only Source Record Key and Source Observation Key;
 * - performs exactly two narrow 10x1 physical write primitives;
 * - performs no insert/delete/upsert;
 * - does not change Source Record ID, Canonical Property Key, Distress Lead
 *   ID, checkpoint, scheduler, acquisition, MAO, or offer state;
 * - verifies the complete plan under the fail-fast Database ScriptLock;
 * - independently derives the exact permitted post-Batch-1 rolling hashes;
 * - restores exact identity-column prestate if reconciliation fails;
 * - declares an ambiguous/no-retry result if rollback or outer lock
 *   finalization cannot be proven.
 */

var REOS = REOS || {};

REOS.CountyCodeViolationDurableIdentityMigrationBatch1Executor =
  (function () {
    var TABLE =
      'DISTRESS_LEADS';

    var INITIAL_MIGRATION_PLAN_SHA256 =
      '85ed3193aa1486116e76b7c892e5f4090974c3399479ea49185f88dd265c7adf';

    var INITIAL_COMPLETE_PLAN_SHA256 =
      '73c95b48cfa7b25c09aa3c6cf00fb2ce1dd7aede9188d60630924c902716f8d2';

    var BATCH_START_ROW =
      3578;

    var BATCH_SIZE =
      10;

    var SOURCE_RECORD_KEY_COLUMN =
      25;

    var SOURCE_OBSERVATION_KEY_COLUMN =
      51;

    var EXPECTED_TOTAL_ROWS =
      6282;

    var EXPECTED_SCOPED_ROWS =
      4981;

    var EXPECTED_MIGRATION_READY_ROWS =
      4840;

    var EXPECTED_COLLAPSE_ROWS =
      141;

    var EXPECTED_REVIEW_ROWS =
      95;

    var EXPECTED_PRE_MIGRATION_REQUIRED =
      3887;

    var EXPECTED_PRE_ALREADY_DURABLE =
      139;

    var EXPECTED_POST_MIGRATION_REQUIRED =
      3877;

    var EXPECTED_POST_ALREADY_DURABLE =
      149;

    var EXPECTED_BLOCKED_ROWS =
      814;

    var EXPECTED_CYCLE =
      'COUNTY-20260902222607805';

    var EXPECTED_FEED_INDEX =
      0;

    var EXPECTED_CURSOR =
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

    var HEARTBEAT_HANDLER =
      'reosProductionOperationsHeartbeat';

    var TARGETS =
[
  {
    "alreadyDurable": false,
    "violationNumber": "VI-2025-067705",
    "sourceObservationKey": "pa-philadelphia|code_violations|562208",
    "legacyObservationKey": "pa-philadelphia|code_violations|562208",
    "parcelId": "492713",
    "sourceRecordId": "562208",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067705",
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "distressLeadId": "DL-20260902182614-7628",
    "sourceRecordKey": "pa-philadelphia|code_violations|562208",
    "planBlockReasons": [],
    "prestateFingerprintSha256": "7409e4ad71988f40b731322bd134f7c53ff716829cd9a53e5446341e2dbbb84b",
    "rowNumber": 3578
  },
  {
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067706",
    "violationNumber": "VI-2025-067706",
    "planBlockReasons": [],
    "parcelId": "492713",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "alreadyDurable": false,
    "prestateFingerprintSha256": "e70f54c52adb5b6bdaec7b195200036897828bca50506be21537becfa40f09c1",
    "legacyObservationKey": "pa-philadelphia|code_violations|562209",
    "sourceRecordId": "562209",
    "sourceObservationKey": "pa-philadelphia|code_violations|562209",
    "distressLeadId": "DL-20260902182616-3013",
    "rowNumber": 3579,
    "sourceRecordKey": "pa-philadelphia|code_violations|562209"
  },
  {
    "violationNumber": "VI-2025-067707",
    "alreadyDurable": false,
    "parcelId": "492713",
    "rowNumber": 3580,
    "prestateFingerprintSha256": "812be106574c78108fa96dfade2de0ed4a8123a4d7410b1c3810613ae7ad9387",
    "sourceRecordId": "562210",
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "distressLeadId": "DL-20260902182618-5491",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "sourceRecordKey": "pa-philadelphia|code_violations|562210",
    "sourceObservationKey": "pa-philadelphia|code_violations|562210",
    "legacyObservationKey": "pa-philadelphia|code_violations|562210",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067707",
    "planBlockReasons": []
  },
  {
    "planBlockReasons": [],
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "prestateFingerprintSha256": "d8ce606c2725f70484696580f3a9172c67fc3fd122dfdcf532a9f6c34dc1c551",
    "sourceRecordKey": "pa-philadelphia|code_violations|562211",
    "parcelId": "492713",
    "alreadyDurable": false,
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "rowNumber": 3581,
    "violationNumber": "VI-2025-067708",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067708",
    "sourceRecordId": "562211",
    "sourceObservationKey": "pa-philadelphia|code_violations|562211",
    "distressLeadId": "DL-20260902182619-8617",
    "legacyObservationKey": "pa-philadelphia|code_violations|562211"
  },
  {
    "legacyObservationKey": "pa-philadelphia|code_violations|562212",
    "sourceObservationKey": "pa-philadelphia|code_violations|562212",
    "sourceRecordKey": "pa-philadelphia|code_violations|562212",
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "planBlockReasons": [],
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|492713",
    "prestateFingerprintSha256": "4c2818541be54557091b68bb1f25e45d0f48ecc41ee68ae8b4a702052e0c2171",
    "rowNumber": 3582,
    "violationNumber": "VI-2025-067709",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067709",
    "parcelId": "492713",
    "alreadyDurable": false,
    "sourceRecordId": "562212",
    "distressLeadId": "DL-20260902182621-6354"
  },
  {
    "prestateFingerprintSha256": "0ae72fd30147732858a6e7d9e7d95464da7a3629e989568a329946d16fc8d3f2",
    "alreadyDurable": false,
    "legacyObservationKey": "pa-philadelphia|code_violations|562438",
    "sourceObservationKey": "pa-philadelphia|code_violations|562438",
    "violationNumber": "VI-2025-067953",
    "sourceRecordId": "562438",
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|110339",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|110339",
    "distressLeadId": "DL-20260902182622-7150",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067953",
    "parcelId": "110339",
    "planBlockReasons": [],
    "sourceRecordKey": "pa-philadelphia|code_violations|562438",
    "rowNumber": 3583
  },
  {
    "violationNumber": "VI-2025-067954",
    "sourceObservationKey": "pa-philadelphia|code_violations|562439",
    "rowNumber": 3584,
    "legacyObservationKey": "pa-philadelphia|code_violations|562439",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067954",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|110339",
    "planBlockReasons": [],
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|110339",
    "parcelId": "110339",
    "alreadyDurable": false,
    "prestateFingerprintSha256": "7852f5c1d8cd34e1c8c1cefc406d40ba48a39224734d68a74b1ec39f48c20bbf",
    "sourceRecordKey": "pa-philadelphia|code_violations|562439",
    "sourceRecordId": "562439",
    "distressLeadId": "DL-20260902182624-8407"
  },
  {
    "alreadyDurable": false,
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067955",
    "sourceRecordId": "562440",
    "distressLeadId": "DL-20260902182625-8437",
    "sourceRecordKey": "pa-philadelphia|code_violations|562440",
    "prestateFingerprintSha256": "f8a87f6f8e2f7acc03e12383da2e64e23f63c5161242887cad121dd8bec32abc",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|110339",
    "planBlockReasons": [],
    "parcelId": "110339",
    "rowNumber": 3585,
    "violationNumber": "VI-2025-067955",
    "sourceObservationKey": "pa-philadelphia|code_violations|562440",
    "legacyObservationKey": "pa-philadelphia|code_violations|562440",
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|110339"
  },
  {
    "sourceRecordKey": "pa-philadelphia|code_violations|562441",
    "rowNumber": 3586,
    "parcelId": "110339",
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|110339",
    "distressLeadId": "DL-20260902182627-7562",
    "prestateFingerprintSha256": "8df34b0cea8c3063d70d977555a8eca8b5c2030524117591124d6389c2d6df6c",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|110339",
    "sourceRecordId": "562441",
    "planBlockReasons": [],
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-067956",
    "alreadyDurable": false,
    "legacyObservationKey": "pa-philadelphia|code_violations|562441",
    "sourceObservationKey": "pa-philadelphia|code_violations|562441",
    "violationNumber": "VI-2025-067956"
  },
  {
    "legacyObservationKey": "pa-philadelphia|code_violations|562512",
    "parcelId": "177170",
    "sourceObservationKey": "pa-philadelphia|code_violations|562512",
    "prestateFingerprintSha256": "8498593ca50445ef813f5e1c9fea0800d6d8c61b1cefe7e14e33401379c9fefb",
    "violationNumber": "VI-2025-068023",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2025-068023",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|177170",
    "planBlockReasons": [],
    "alreadyDurable": false,
    "storedCanonicalPropertyKey": "property|parcel|pa|philadelphia|177170",
    "rowNumber": 3587,
    "sourceRecordId": "562512",
    "distressLeadId": "DL-20260902182628-1522",
    "sourceRecordKey": "pa-philadelphia|code_violations|562512"
  }
];


    var RECORD_FIELDS = [
      'rowNumber',
      'distressLeadId',
      'sourceRecordId',
      'violationNumber',
      'parcelId',
      'canonicalPropertyKey',
      'storedCanonicalPropertyKey',
      'sourceObservationKey',
      'sourceRecordKey',
      'legacyObservationKey',
      'proposedDurableKey',
      'alreadyDurable',
      'prestateFingerprintSha256'
    ];


    function text_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      ).trim();
    }


    function arraysEqual_(left, right) {
      return (
        Array.isArray(left) &&
        Array.isArray(right) &&
        left.length === right.length &&
        left.every(function (value, index) {
          return value === right[index];
        })
      );
    }


    function sha256Hex_(value) {
      var bytes =
        Utilities.computeDigest(
          Utilities.DigestAlgorithm.SHA_256,
          String(value),
          Utilities.Charset.UTF_8
        );

      return bytes
        .map(function (byte) {
          var normalized =
            Number(byte);

          if (normalized < 0) {
            normalized += 256;
          }

          return (
            '0' +
            normalized.toString(16)
          ).slice(-2);
        })
        .join('');
    }


    function projectRecord_(record) {
      var projected = {};

      RECORD_FIELDS.forEach(function (field) {
        projected[field] =
          record[field];
      });

      projected.planBlockReasons =
        (
          record.planBlockReasons ||
          []
        ).slice();

      return projected;
    }


    function recordsEqual_(left, right) {
      return (
        JSON.stringify(
          projectRecord_(left)
        ) ===
        JSON.stringify(
          projectRecord_(right)
        )
      );
    }


    function recordArraysEqual_(left, right) {
      return (
        Array.isArray(left) &&
        Array.isArray(right) &&
        left.length === right.length &&
        left.every(function (record, index) {
          return recordsEqual_(
            record,
            right[index]
          );
        })
      );
    }


    function cloneRecord_(record) {
      return JSON.parse(
        JSON.stringify(record)
      );
    }


    function sortRecords_(records) {
      records.sort(function (a, b) {
        var compared =
          a.proposedDurableKey
            .localeCompare(
              b.proposedDurableKey
            );

        return compared !== 0
          ? compared
          : Number(a.rowNumber) -
              Number(b.rowNumber);
      });

      return records;
    }


    function recordIdentity_(record) {
      return (
        String(record.rowNumber) +
        '|' +
        text_(
          record.proposedDurableKey
        )
      );
    }


    function fingerprintPlanRecord_(record) {
      return sha256Hex_(
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
    }


    function requireDependencies_() {
      if (
        !REOS.Security ||
        typeof REOS.Security.requireAdmin !==
          'function'
      ) {
        throw new Error(
          'Gate 2B Batch 1 requires Admin authority.'
        );
      }

      if (
        !REOS.Database ||
        typeof REOS.Database.getSheet !==
          'function' ||
        typeof REOS.Database.getHeaders !==
          'function' ||
        typeof REOS.Database.withScriptLockContext !==
          'function'
      ) {
        throw new Error(
          'Gate 2B Batch 1 requires certified Database read/lock APIs.'
        );
      }

      if (
        !REOS.DistressLeadCountySchema ||
        typeof REOS.DistressLeadCountySchema.requiredHeaders !==
          'function'
      ) {
        throw new Error(
          'Gate 2B Batch 1 requires certified DISTRESS_LEADS schema authority.'
        );
      }

      if (
        !REOS.CountyCodeViolationDurableIdentityMigrationPlan ||
        typeof REOS.CountyCodeViolationDurableIdentityMigrationPlan.build !==
          'function'
      ) {
        throw new Error(
          'Gate 2B Batch 1 requires the certified read-only migration plan.'
        );
      }

      if (
        !REOS.CountyProductionScheduler ||
        typeof REOS.CountyProductionScheduler.getCheckpoint !==
          'function'
      ) {
        throw new Error(
          'Gate 2B Batch 1 requires read-only county checkpoint authority.'
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
          'Gate 2B Batch 1 requires installable-trigger inspection.'
        );
      }

      if (
        typeof SpreadsheetApp ===
          'undefined' ||
        !SpreadsheetApp ||
        typeof SpreadsheetApp.flush !==
          'function'
      ) {
        throw new Error(
          'Gate 2B Batch 1 requires SpreadsheetApp.flush.'
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
          'Gate 2B Batch 1 requires SHA-256 support.'
        );
      }
    }


    function requireInvocation_(options) {
      options =
        options ||
        {};

      [
        'confirmMigration',
        'confirmDurableIdentity',
        'confirmBatch1',
        'confirmInPlace',
        'confirmNoInsertDelete',
        'confirmMigrationReadyOnly'
      ].forEach(function (field) {
        if (options[field] !== true) {
          throw new Error(
            'Gate 2B Batch 1 requires ' +
            field +
            '=true.'
          );
        }
      });

      if (
        text_(
          options.migrationPlanSha256
        ) !==
          INITIAL_MIGRATION_PLAN_SHA256
      ) {
        throw new Error(
          'Gate 2B Batch 1 migration-plan SHA-256 mismatch.'
        );
      }

      if (
        text_(
          options.completePlanSha256
        ) !==
          INITIAL_COMPLETE_PLAN_SHA256
      ) {
        throw new Error(
          'Gate 2B Batch 1 complete-plan SHA-256 mismatch.'
        );
      }
    }


    function triggerSnapshot_() {
      return ScriptApp
        .getProjectTriggers()
        .map(function (trigger) {
          return {
            handler:
              typeof trigger.getHandlerFunction ===
                'function'
                ? text_(
                    trigger.getHandlerFunction()
                  )
                : '',

            eventType:
              typeof trigger.getEventType ===
                'function'
                ? text_(
                    trigger.getEventType()
                  )
                : '',

            source:
              typeof trigger.getTriggerSource ===
                'function'
                ? text_(
                    trigger.getTriggerSource()
                  )
                : '',

            uniqueId:
              typeof trigger.getUniqueId ===
                'function'
                ? text_(
                    trigger.getUniqueId()
                  )
                : ''
          };
        });
    }


    function assertQuiescence_() {
      var triggers =
        triggerSnapshot_();

      var heartbeat =
        triggers.filter(function (trigger) {
          return (
            trigger.handler ===
            HEARTBEAT_HANDLER
          );
        });

      var unexpected =
        triggers.filter(function (trigger) {
          return (
            trigger.handler !==
            HEARTBEAT_HANDLER
          );
        });

      if (heartbeat.length > 1) {
        throw new Error(
          'Gate 2B Batch 1 requires at most one production heartbeat trigger.'
        );
      }

      if (unexpected.length !== 0) {
        throw new Error(
          'Gate 2B Batch 1 requires all mutating installable triggers frozen; unexpected handler: ' +
          unexpected[0].handler
        );
      }

      return {
        triggerCount:
          triggers.length,

        heartbeatTriggerCount:
          heartbeat.length,

        unexpectedTriggerCount:
          unexpected.length
      };
    }


    function assertCheckpoint_() {
      var checkpoint =
        REOS.CountyProductionScheduler
          .getCheckpoint();

      if (
        !checkpoint ||
        text_(checkpoint.id) !==
          EXPECTED_CYCLE ||
        Number(
          checkpoint.nextFeedIndex
        ) !==
          EXPECTED_FEED_INDEX ||
        text_(
          checkpoint.currentFeedCursor
        ) !==
          EXPECTED_CURSOR ||
        Number(
          checkpoint.completedFeeds
        ) !==
          0 ||
        Number(
          checkpoint.totalFeeds
        ) !==
          4 ||
        !Array.isArray(
          checkpoint.results
        ) ||
        checkpoint.results.length !==
          0
      ) {
        throw new Error(
          'Gate 2B Batch 1 frozen county checkpoint authority changed.'
        );
      }

      return checkpoint;
    }


    function assertReadOnlyPlan_(plan) {
      if (
        !plan ||
        plan.ok !== true ||
        plan.readOnly !== true ||
        plan.mode !==
          'READ_ONLY_CODE_VIOLATION_DURABLE_IDENTITY_MIGRATION_PLAN' ||
        plan.phase !==
          'gate_2b_migration_ready_plan' ||
        plan.table !==
          TABLE ||
        plan.connectorId !==
          'PA-PHILADELPHIA' ||
        plan.dataset !==
          'code_violations' ||
        plan.durableIdentityField !==
          'Violation Number' ||
        Number(
          plan.countySchedulerTriggerCount
        ) !==
          0
      ) {
        throw new Error(
          'Gate 2B Batch 1 migration-plan read-only authority changed.'
        );
      }

      [
        'collapseAuthorityGranted',
        'reviewRepairAuthorityGranted',
        'winnerSelectionAuthorityGranted',
        'productionDataMutationAuthorityGranted',
        'connectorExecutionAuthorityGranted',
        'checkpointMutationAuthorityGranted',
        'schedulerAuthorityGranted',
        'migrationAuthorityGranted',
        'automaticOfferAuthorityGranted'
      ].forEach(function (field) {
        if (plan[field] !== false) {
          throw new Error(
            'Read-only migration plan unexpectedly grants authority: ' +
            field
          );
        }
      });
    }


    function assertInitialPlan_(plan) {
      assertReadOnlyPlan_(
        plan
      );

      var expected = {
        totalRows:
          EXPECTED_TOTAL_ROWS,

        scopedRows:
          EXPECTED_SCOPED_ROWS,

        migrationReadyAuditRows:
          EXPECTED_MIGRATION_READY_ROWS,

        collapseRequiredRows:
          EXPECTED_COLLAPSE_ROWS,

        reviewRequiredRows:
          EXPECTED_REVIEW_ROWS,

        alreadyDurableRows:
          EXPECTED_PRE_ALREADY_DURABLE,

        migrationRequiredRows:
          EXPECTED_PRE_MIGRATION_REQUIRED,

        planBlockedRows:
          EXPECTED_BLOCKED_ROWS
      };

      Object.keys(expected)
        .forEach(function (field) {
          if (
            Number(
              plan[field]
            ) !==
              expected[field]
          ) {
            throw new Error(
              'Gate 2B Batch 1 initial plan count changed: ' +
              field
            );
          }
        });

      if (
        plan.migrationReadyOnlyPlanComplete !==
          false ||
        plan.migrationPlanSha256 !==
          INITIAL_MIGRATION_PLAN_SHA256 ||
        plan.completePlanSha256 !==
          INITIAL_COMPLETE_PLAN_SHA256
      ) {
        throw new Error(
          'Gate 2B Batch 1 certified initial plan SHA/count authority changed.'
        );
      }

      var firstBatch =
        plan.migrationRequiredRecords
          .slice(
            0,
            BATCH_SIZE
          );

      if (
        !recordArraysEqual_(
          firstBatch,
          TARGETS
        )
      ) {
        throw new Error(
          'Gate 2B Batch 1 deterministic target authority changed.'
        );
      }
    }


    function durablePostRecord_(record) {
      var updated =
        cloneRecord_(
          record
        );

      updated.sourceObservationKey =
        updated.proposedDurableKey;

      updated.sourceRecordKey =
        updated.proposedDurableKey;

      updated.legacyObservationKey =
        updated.proposedDurableKey;

      updated.alreadyDurable =
        true;

      updated.planBlockReasons =
        [];

      updated.prestateFingerprintSha256 =
        fingerprintPlanRecord_(
          updated
        );

      return updated;
    }


    function partition_(records) {
      return {
        migrationRequiredRecords:
          records.filter(function (record) {
            return (
              (
                record.planBlockReasons ||
                []
              ).length ===
                0 &&
              record.alreadyDurable !==
                true
            );
          }),

        alreadyDurableRecords:
          records.filter(function (record) {
            return (
              (
                record.planBlockReasons ||
                []
              ).length ===
                0 &&
              record.alreadyDurable ===
                true
            );
          }),

        planBlockedRecords:
          records.filter(function (record) {
            return (
              (
                record.planBlockReasons ||
                []
              ).length >
              0
            );
          })
      };
    }


    function calculateExpectedPost_(prePlan) {
      var targetMap = {};

      TARGETS.forEach(function (target) {
        targetMap[
          recordIdentity_(
            target
          )
        ] =
          true;
      });

      var all =
        []
          .concat(
            prePlan.migrationRequiredRecords,
            prePlan.alreadyDurableRecords,
            prePlan.planBlockedRecords
          )
          .map(function (record) {
            var copy =
              cloneRecord_(
                record
              );

            if (
              targetMap[
                recordIdentity_(
                  copy
                )
              ]
            ) {
              return durablePostRecord_(
                copy
              );
            }

            return copy;
          });

      sortRecords_(
        all
      );

      var parts =
        partition_(
          all
        );

      var migrationMaterial =
        parts
          .migrationRequiredRecords
          .map(function (record) {
            return [
              record.proposedDurableKey,
              record.distressLeadId,
              String(
                record.rowNumber
              ),
              record.prestateFingerprintSha256
            ].join('|');
          })
          .join('\n');

      var completeMaterial =
        all
          .map(function (record) {
            return [
              record.proposedDurableKey,
              record.distressLeadId,
              String(
                record.rowNumber
              ),
              record.alreadyDurable
                ? 'ALREADY_DURABLE'
                : 'NOT_DURABLE',
              (
                record.planBlockReasons ||
                []
              ).join(','),
              record.prestateFingerprintSha256
            ].join('|');
          })
          .join('\n');

      return {
        migrationRequiredRecords:
          parts.migrationRequiredRecords,

        alreadyDurableRecords:
          parts.alreadyDurableRecords,

        planBlockedRecords:
          parts.planBlockedRecords,

        migrationPlanSha256:
          sha256Hex_(
            migrationMaterial
          ),

        completePlanSha256:
          sha256Hex_(
            completeMaterial
          )
      };
    }


    function assertPostPlan_(
      postPlan,
      expectedPost
    ) {
      assertReadOnlyPlan_(
        postPlan
      );

      var expected = {
        totalRows:
          EXPECTED_TOTAL_ROWS,

        scopedRows:
          EXPECTED_SCOPED_ROWS,

        migrationReadyAuditRows:
          EXPECTED_MIGRATION_READY_ROWS,

        collapseRequiredRows:
          EXPECTED_COLLAPSE_ROWS,

        reviewRequiredRows:
          EXPECTED_REVIEW_ROWS,

        alreadyDurableRows:
          EXPECTED_POST_ALREADY_DURABLE,

        migrationRequiredRows:
          EXPECTED_POST_MIGRATION_REQUIRED,

        planBlockedRows:
          EXPECTED_BLOCKED_ROWS
      };

      Object.keys(expected)
        .forEach(function (field) {
          if (
            Number(
              postPlan[field]
            ) !==
              expected[field]
          ) {
            throw new Error(
              'Gate 2B Batch 1 post-plan count mismatch: ' +
              field
            );
          }
        });

      if (
        postPlan.migrationReadyOnlyPlanComplete !==
          false ||
        postPlan.migrationPlanSha256 !==
          expectedPost.migrationPlanSha256 ||
        postPlan.completePlanSha256 !==
          expectedPost.completePlanSha256
      ) {
        throw new Error(
          'Gate 2B Batch 1 rolling plan SHA transition mismatch.'
        );
      }

      if (
        !recordArraysEqual_(
          postPlan.migrationRequiredRecords,
          expectedPost.migrationRequiredRecords
        ) ||
        !recordArraysEqual_(
          postPlan.alreadyDurableRecords,
          expectedPost.alreadyDurableRecords
        ) ||
        !recordArraysEqual_(
          postPlan.planBlockedRecords,
          expectedPost.planBlockedRecords
        )
      ) {
        throw new Error(
          'Gate 2B Batch 1 complete post-plan population differs from the sole permitted transition.'
        );
      }
    }


    function assertSchema_() {
      var headers =
        REOS.Database
          .getHeaders(
            TABLE
          );

      var expected =
        REOS.DistressLeadCountySchema
          .requiredHeaders();

      if (
        headers.length !==
          52 ||
        !arraysEqual_(
          headers,
          expected
        ) ||
        headers.indexOf(
          'Source Record Key'
        ) +
          1 !==
          SOURCE_RECORD_KEY_COLUMN ||
        headers.indexOf(
          'Source Observation Key'
        ) +
          1 !==
          SOURCE_OBSERVATION_KEY_COLUMN
      ) {
        throw new Error(
          'Gate 2B Batch 1 DISTRESS_LEADS schema/identity-column authority changed.'
        );
      }

      return headers;
    }


    function readIdentityColumns_(
      sheet
    ) {
      return {
        recordKeys:
          sheet
            .getRange(
              BATCH_START_ROW,
              SOURCE_RECORD_KEY_COLUMN,
              BATCH_SIZE,
              1
            )
            .getValues(),

        observationKeys:
          sheet
            .getRange(
              BATCH_START_ROW,
              SOURCE_OBSERVATION_KEY_COLUMN,
              BATCH_SIZE,
              1
            )
            .getValues()
      };
    }


    function assertPhysicalPrestate_(
      values
    ) {
      TARGETS.forEach(function (
        target,
        index
      ) {
        if (
          text_(
            values.recordKeys[
              index
            ][0]
          ) !==
            target.sourceRecordKey ||
          text_(
            values.observationKeys[
              index
            ][0]
          ) !==
            target.sourceObservationKey ||
          target.sourceRecordKey !==
            target.legacyObservationKey ||
          target.sourceObservationKey !==
            target.legacyObservationKey
        ) {
          throw new Error(
            'Gate 2B Batch 1 physical prestate changed at row ' +
            target.rowNumber +
            '.'
          );
        }
      });
    }


    function targetValues_() {
      return TARGETS.map(function (
        target
      ) {
        return [
          target.proposedDurableKey
        ];
      });
    }


    /*
     * Sole Source Record Key mutation primitive.
     * May run once for migration and once for rollback.
     */
    function writeRecordKeyColumn_(
      sheet,
      values
    ) {
      sheet
        .getRange(
          BATCH_START_ROW,
          SOURCE_RECORD_KEY_COLUMN,
          BATCH_SIZE,
          1
        )
        .setValues(
          values
        );
    }


    /*
     * Sole Source Observation Key mutation primitive.
     * May run once for migration and once for rollback.
     */
    function writeObservationKeyColumn_(
      sheet,
      values
    ) {
      sheet
        .getRange(
          BATCH_START_ROW,
          SOURCE_OBSERVATION_KEY_COLUMN,
          BATCH_SIZE,
          1
        )
        .setValues(
          values
        );
    }


    function assertPhysicalPoststate_(
      sheet
    ) {
      var values =
        readIdentityColumns_(
          sheet
        );

      TARGETS.forEach(function (
        target,
        index
      ) {
        if (
          text_(
            values.recordKeys[
              index
            ][0]
          ) !==
            target.proposedDurableKey ||
          text_(
            values.observationKeys[
              index
            ][0]
          ) !==
            target.proposedDurableKey
        ) {
          throw new Error(
            'Gate 2B Batch 1 physical poststate mismatch at row ' +
            target.rowNumber +
            '.'
          );
        }
      });
    }


    function restoreCertifiedPrestate_(
      sheet,
      beforeValues
    ) {
      writeRecordKeyColumn_(
        sheet,
        beforeValues.recordKeys
      );

      writeObservationKeyColumn_(
        sheet,
        beforeValues.observationKeys
      );

      SpreadsheetApp
        .flush();

      var restoredValues =
        readIdentityColumns_(
          sheet
        );

      assertPhysicalPrestate_(
        restoredValues
      );

      assertCheckpoint_();
      assertQuiescence_();

      var restoredPlan =
        REOS
          .CountyCodeViolationDurableIdentityMigrationPlan
          .build({});

      assertInitialPlan_(
        restoredPlan
      );
    }


    function status() {
      requireDependencies_();

      REOS.Security
        .requireAdmin();

      var triggers =
        triggerSnapshot_();

      var checkpoint =
        REOS.CountyProductionScheduler
          .getCheckpoint();

      return {
        ok:
          true,

        readOnly:
          true,

        mode:
          'READ_ONLY_GATE_2B_BATCH_1_MIGRATION_STATUS',

        batch:
          1,

        batchStartRow:
          BATCH_START_ROW,

        batchEndRow:
          BATCH_START_ROW +
          BATCH_SIZE -
          1,

        batchSize:
          BATCH_SIZE,

        sourceRecordKeyColumn:
          SOURCE_RECORD_KEY_COLUMN,

        sourceObservationKeyColumn:
          SOURCE_OBSERVATION_KEY_COLUMN,

        initialMigrationPlanSha256:
          INITIAL_MIGRATION_PLAN_SHA256,

        initialCompletePlanSha256:
          INITIAL_COMPLETE_PLAN_SHA256,

        triggerCount:
          triggers.length,

        checkpoint:
          checkpoint,

        productionDataMutationAuthorityGranted:
          false,

        insertAuthorityGranted:
          false,

        deleteAuthorityGranted:
          false,

        collapseAuthorityGranted:
          false,

        reviewRepairAuthorityGranted:
          false,

        winnerSelectionAuthorityGranted:
          false,

        checkpointMutationAuthorityGranted:
          false,

        schedulerAuthorityGranted:
          false,

        automaticOfferAuthorityGranted:
          false
      };
    }


    function execute(options) {
      requireDependencies_();

      REOS.Security
        .requireAdmin();

      requireInvocation_(
        options
      );

      var preQuiescence =
        assertQuiescence_();

      var preCheckpoint =
        assertCheckpoint_();

      var mutationVerified =
        false;

      try {
        var result =
          REOS.Database
            .withScriptLockContext(
              function () {
                var inLockQuiescence =
                  assertQuiescence_();

                var inLockCheckpoint =
                  assertCheckpoint_();

                assertSchema_();

                var sheet =
                  REOS.Database
                    .getSheet(
                      TABLE
                    );

                var beforeLastRow =
                  Number(
                    sheet.getLastRow()
                  );

                if (
                  beforeLastRow <
                    BATCH_START_ROW +
                    BATCH_SIZE -
                    1
                ) {
                  throw new Error(
                    'Gate 2B Batch 1 physical row authority no longer exists.'
                  );
                }

                var prePlan =
                  REOS
                    .CountyCodeViolationDurableIdentityMigrationPlan
                    .build({});

                assertInitialPlan_(
                  prePlan
                );

                var expectedPost =
                  calculateExpectedPost_(
                    prePlan
                  );

                if (
                  expectedPost.migrationPlanSha256 ===
                    INITIAL_MIGRATION_PLAN_SHA256 ||
                  expectedPost.completePlanSha256 ===
                    INITIAL_COMPLETE_PLAN_SHA256
                ) {
                  throw new Error(
                    'Gate 2B Batch 1 expected rolling SHA transition did not advance.'
                  );
                }

                var beforeValues =
                  readIdentityColumns_(
                    sheet
                  );

                assertPhysicalPrestate_(
                  beforeValues
                );

                var targets =
                  targetValues_();

                var writeAttempted =
                  false;

                try {
                  writeAttempted =
                    true;

                  writeRecordKeyColumn_(
                    sheet,
                    targets
                  );

                  writeObservationKeyColumn_(
                    sheet,
                    targets
                  );

                  SpreadsheetApp
                    .flush();

                  if (
                    Number(
                      sheet.getLastRow()
                    ) !==
                      beforeLastRow
                  ) {
                    throw new Error(
                      'Gate 2B Batch 1 DISTRESS_LEADS row count changed.'
                    );
                  }

                  assertPhysicalPoststate_(
                    sheet
                  );

                  assertCheckpoint_();
                  assertQuiescence_();

                  var postPlan =
                    REOS
                      .CountyCodeViolationDurableIdentityMigrationPlan
                      .build({});

                  assertPostPlan_(
                    postPlan,
                    expectedPost
                  );

                  mutationVerified =
                    true;

                  return {
                    ok:
                      true,

                    mode:
                      'CERTIFIED_GATE_2B_BATCH_1_DURABLE_IDENTITY_MIGRATION_EXECUTED',

                    batch:
                      1,

                    migratedRowCount:
                      BATCH_SIZE,

                    physicalStartRow:
                      BATCH_START_ROW,

                    physicalEndRow:
                      BATCH_START_ROW +
                      BATCH_SIZE -
                      1,

                    sourceRecordKeyColumn:
                      SOURCE_RECORD_KEY_COLUMN,

                    sourceObservationKeyColumn:
                      SOURCE_OBSERVATION_KEY_COLUMN,

                    physicalWriteRangeCount:
                      2,

                    initialMigrationPlanSha256:
                      INITIAL_MIGRATION_PLAN_SHA256,

                    initialCompletePlanSha256:
                      INITIAL_COMPLETE_PLAN_SHA256,

                    nextMigrationPlanSha256:
                      expectedPost
                        .migrationPlanSha256,

                    nextCompletePlanSha256:
                      expectedPost
                        .completePlanSha256,

                    migrationRequiredRowsBefore:
                      EXPECTED_PRE_MIGRATION_REQUIRED,

                    migrationRequiredRowsAfter:
                      EXPECTED_POST_MIGRATION_REQUIRED,

                    alreadyDurableRowsBefore:
                      EXPECTED_PRE_ALREADY_DURABLE,

                    alreadyDurableRowsAfter:
                      EXPECTED_POST_ALREADY_DURABLE,

                    planBlockedRows:
                      EXPECTED_BLOCKED_ROWS,

                    collapseRequiredRows:
                      EXPECTED_COLLAPSE_ROWS,

                    reviewRequiredRows:
                      EXPECTED_REVIEW_ROWS,

                    triggerCountBefore:
                      preQuiescence
                        .triggerCount,

                    triggerCountUnderLock:
                      inLockQuiescence
                        .triggerCount,

                    checkpointCycleBefore:
                      preCheckpoint.id,

                    checkpointCycleUnderLock:
                      inLockCheckpoint.id,

                    productionDataMutationExecuted:
                      true,

                    migrationExecuted:
                      true,

                    migrationAuthorityConsumed:
                      true,

                    productionDataMutationAuthorityGranted:
                      false,

                    migrationAuthorityGranted:
                      false,

                    insertAuthorityGranted:
                      false,

                    deleteAuthorityGranted:
                      false,

                    collapseAuthorityGranted:
                      false,

                    reviewRepairAuthorityGranted:
                      false,

                    winnerSelectionAuthorityGranted:
                      false,

                    checkpointMutationAuthorityGranted:
                      false,

                    schedulerAuthorityGranted:
                      false,

                    automaticOfferAuthorityGranted:
                      false
                  };
                } catch (migrationError) {
                  if (writeAttempted) {
                    try {
                      restoreCertifiedPrestate_(
                        sheet,
                        beforeValues
                      );
                    } catch (rollbackError) {
                      throw new Error(
                        'GATE_2B_BATCH_1_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY: migration=' +
                        (
                          migrationError.message ||
                          String(
                            migrationError
                          )
                        ) +
                        '; rollback=' +
                        (
                          rollbackError.message ||
                          String(
                            rollbackError
                          )
                        )
                      );
                    }
                  }

                  throw new Error(
                    'Gate 2B Batch 1 migration failed and certified identity prestate was restored: ' +
                    (
                      migrationError.message ||
                      String(
                        migrationError
                      )
                    )
                  );
                }
              }
            );

        return result;
      } catch (error) {
        /*
         * The callback proved the poststate, but Database outer
         * flush/release/finalization may still fail afterward.
         * Never automatically retry an uncertain successful mutation.
         */
        if (mutationVerified) {
          throw new Error(
            'GATE_2B_BATCH_1_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY: ' +
            (
              error.message ||
              String(error)
            )
          );
        }

        throw error;
      }
    }


    return {
      status:
        status,

      execute:
        execute
    };
  })();


function reosCountyCodeViolationDurableIdentityMigrationBatch1Status() {
  return REOS
    .CountyCodeViolationDurableIdentityMigrationBatch1Executor
    .status();
}


function reosCountyCodeViolationDurableIdentityMigrationBatch1Execute(
  options
) {
  return REOS
    .CountyCodeViolationDurableIdentityMigrationBatch1Executor
    .execute(
      options ||
      {}
    );
}
