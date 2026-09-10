/**
 * REOS Enterprise
 * Gate 2B — Philadelphia Code Violations
 * Generic Rolling Durable Identity Migration Executor
 *
 * Production authority:
 * - bounded migration-ready records only
 * - caller-supplied current rolling hashes required
 * - exactly five explicit confirmations required
 * - fail-fast outer ScriptLock
 * - exactly two narrow Nx1 physical writes
 * - Source Record Key column 25
 * - Source Observation Key column 51
 * - no insert/delete/upsert/update APIs
 * - no scheduler/checkpoint mutation
 * - rollback on every provable failure
 * - ambiguous/no-retry when rollback or lock finalization is uncertain
 *
 * This implementation deliberately does NOT grant:
 * - county scheduler authority
 * - checkpoint authority
 * - collapse/review authority
 * - canonical-property repair authority
 * - offer/MAO authority
 */

var REOS = REOS || {};

REOS.CountyCodeViolationDurableIdentityRollingMigrationExecutor =
  (function () {
    'use strict';

    var SOURCE = 'PA-PHILADELPHIA';
    var DATASET = 'code_violations';

    /*
     * Physical storage authority.
     *
     * code_violations is a logical Source Dataset value inside the
     * shared DISTRESS_LEADS table. It is not a physical sheet name.
     *
     * This must remain aligned with
     * CountyCodeViolationDurableIdentityMigrationPlan.
     */
    var TABLE = 'DISTRESS_LEADS';

    var SOURCE_RECORD_KEY_COLUMN = 25;
    var SOURCE_OBSERVATION_KEY_COLUMN = 51;

    var DEFAULT_BATCH_MAX = 100;
    var HARD_BATCH_MAX = 100;

    var EXPECTED_CYCLE = 'COUNTY-20260902222607805';
    var EXPECTED_FEED_INDEX = 0;
    var EXPECTED_CURSOR =
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

    var ALLOWED_HEARTBEAT_HANDLER =
      'reosProductionOperationsHeartbeat';

    var READ_ONLY_PLAN_MODE =
      'READ_ONLY_CODE_VIOLATION_DURABLE_IDENTITY_MIGRATION_PLAN';

    var ROLLBACK_AMBIGUOUS =
      'GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY';

    function text_(value) {
      return value === null || value === undefined
        ? ''
        : String(value);
    }

    function assert_(condition, message) {
      if (!condition) {
        throw new Error(message);
      }
    }

    function positiveInteger_(value, name) {
      var n = Number(value);
      assert_(
        Number.isInteger(n) && n > 0,
        name + ' must be a positive integer.'
      );
      return n;
    }

    function batchSize_(value) {
      var n =
        value === undefined || value === null || value === ''
          ? DEFAULT_BATCH_MAX
          : positiveInteger_(value, 'batchSize');

      assert_(
        n <= HARD_BATCH_MAX,
        'batchSize exceeds certified maximum of ' + HARD_BATCH_MAX + '.'
      );

      return n;
    }

    function triggerSnapshot_() {
      return ScriptApp.getProjectTriggers().map(function (trigger) {
        return {
          handler:
            typeof trigger.getHandlerFunction === 'function'
              ? text_(trigger.getHandlerFunction())
              : '',
          eventType:
            typeof trigger.getEventType === 'function'
              ? text_(trigger.getEventType())
              : '',
          source:
            typeof trigger.getTriggerSource === 'function'
              ? text_(trigger.getTriggerSource())
              : '',
          id:
            typeof trigger.getUniqueId === 'function'
              ? text_(trigger.getUniqueId())
              : ''
        };
      });
    }

    function assertQuiescence_() {
      var triggers = triggerSnapshot_();

      var heartbeatCount = triggers.filter(function (trigger) {
        return trigger.handler === ALLOWED_HEARTBEAT_HANDLER;
      }).length;

      var unexpected = triggers.filter(function (trigger) {
        return trigger.handler !== ALLOWED_HEARTBEAT_HANDLER;
      });

      assert_(
        heartbeatCount <= 1,
        'Generic rolling migration requires at most one production heartbeat trigger.'
      );

      assert_(
        unexpected.length === 0,
        'Unexpected installable trigger detected: ' +
          text_(unexpected[0] && unexpected[0].handler)
      );

      return {
        triggerCount: triggers.length,
        heartbeatTriggerCount: heartbeatCount,
        unexpectedTriggerCount: unexpected.length
      };
    }

    function frozenCheckpoint_() {
      assert_(
        REOS.CountyProductionScheduler &&
          typeof REOS.CountyProductionScheduler.getCheckpoint ===
            'function',
        'County checkpoint read authority is unavailable.'
      );

      var checkpoint =
        REOS.CountyProductionScheduler.getCheckpoint();

      assert_(
        checkpoint &&
          text_(checkpoint.id) === EXPECTED_CYCLE &&
          Number(checkpoint.nextFeedIndex) === EXPECTED_FEED_INDEX &&
          text_(checkpoint.currentFeedCursor) === EXPECTED_CURSOR &&
          Number(checkpoint.completedFeeds) === 0 &&
          Number(checkpoint.totalFeeds) === 4 &&
          Array.isArray(checkpoint.results) &&
          checkpoint.results.length === 0,
        'Frozen county checkpoint authority changed.'
      );

      return checkpoint;
    }

    function plan_(options) {
      assert_(
        REOS.CountyCodeViolationDurableIdentityMigrationPlan &&
          typeof REOS.CountyCodeViolationDurableIdentityMigrationPlan.build ===
            'function',
        'Certified read-only migration plan is unavailable.'
      );

      var plan =
        REOS.CountyCodeViolationDurableIdentityMigrationPlan.build({
          mode: READ_ONLY_PLAN_MODE,
          adminAuthorized: true
        });

      assert_(
        plan &&
          plan.connectorId === SOURCE &&
          plan.dataset === DATASET,
        'Migration plan scope mismatch.'
      );

      assert_(
        plan.countySchedulerTriggerCount === 0,
        'County scheduler trigger count is not zero.'
      );

      assert_(
        plan.migrationReadyOnlyPlanComplete === true ||
          plan.migrationReadyOnlyPlanComplete === false,
        'Migration plan completeness flag unavailable.'
      );

      return plan;
    }

    function requireRollingAuthority_(options, currentPlan) {
      assert_(
        options &&
          options.confirmRollingMigration === true &&
          options.confirmDurableIdentity === true &&
          options.confirmInPlace === true &&
          options.confirmNoInsertDelete === true &&
          options.confirmMigrationReadyOnly === true,
        'All five rolling migration confirmations are required.'
      );

      assert_(
        text_(options.migrationPlanSha256) ===
          text_(currentPlan.migrationPlanSha256),
        'Caller migrationPlanSha256 does not match current authoritative plan.'
      );

      assert_(
        text_(options.completePlanSha256) ===
          text_(currentPlan.completePlanSha256),
        'Caller completePlanSha256 does not match current authoritative plan.'
      );
    }

    function selectBatch_(plan, requestedBatchSize) {
      var records = Array.isArray(plan.migrationRequiredRecords)
        ? plan.migrationRequiredRecords.slice()
        : [];

      records.sort(function (a, b) {
        var keyA = text_(a.proposedDurableKey);
        var keyB = text_(b.proposedDurableKey);

        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;

        return Number(a.rowNumber) - Number(b.rowNumber);
      });

      var selected = records.slice(0, requestedBatchSize);

      assert_(
        selected.length > 0,
        'No migration-required records remain.'
      );

      return selected;
    }

    function validateRecord_(record) {
      assert_(
        Number.isInteger(Number(record.rowNumber)) &&
          Number(record.rowNumber) > 1,
        'Invalid physical row authority.'
      );

      assert_(
        text_(record.distressLeadId),
        'Missing distressLeadId at row ' + record.rowNumber
      );

      assert_(
        text_(record.proposedDurableKey),
        'Missing proposed durable key at row ' + record.rowNumber
      );

      assert_(
        text_(record.prestateFingerprintSha256),
        'Missing prestate fingerprint at row ' + record.rowNumber
      );

      assert_(
        text_(record.sourceRecordKey) ||
          text_(record.legacyObservationKey) ||
          text_(record.sourceObservationKey),
        'Stored identity state unavailable at row ' + record.rowNumber
      );
    }

    function verifyPhysicalPrestate_(sheet, records) {
      var rows = records.map(function (record) {
        return Number(record.rowNumber);
      });

      var minRow = Math.min.apply(Math, rows);
      var maxRow = Math.max.apply(Math, rows);

      var values = sheet
        .getRange(
          minRow,
          1,
          maxRow - minRow + 1,
          SOURCE_OBSERVATION_KEY_COLUMN
        )
        .getValues();

      records.forEach(function (record) {
        var offset = Number(record.rowNumber) - minRow;
        var row = values[offset];

        assert_(row, 'Physical row unavailable: ' + record.rowNumber);

        var storedRecordKey =
          text_(row[SOURCE_RECORD_KEY_COLUMN - 1]);

        var storedObservationKey =
          text_(row[SOURCE_OBSERVATION_KEY_COLUMN - 1]);

        var fingerprintInput = {
          rowNumber: Number(record.rowNumber),
          distressLeadId: text_(record.distressLeadId),
          sourceRecordId: text_(record.sourceRecordId),
          violationNumber: text_(record.violationNumber),
          parcelId: text_(record.parcelId),
          canonicalPropertyKey: text_(record.canonicalPropertyKey),
          storedCanonicalPropertyKey:
            text_(record.storedCanonicalPropertyKey),
          sourceObservationKey: storedObservationKey,
          sourceRecordKey: storedRecordKey,
          legacyObservationKey: text_(record.legacyObservationKey),
          proposedDurableKey: text_(record.proposedDurableKey)
        };

        var actualFingerprint = digest_(fingerprintInput);

        assert_(
          actualFingerprint ===
            text_(record.prestateFingerprintSha256),
          'Physical prestate fingerprint changed at row ' +
            record.rowNumber
        );

        assert_(
          !storedObservationKey ||
            storedObservationKey === text_(record.legacyObservationKey),
          'Stored observation identity drift detected at row ' +
            record.rowNumber
        );
      });
    }

    function digest_(value) {
      var json = JSON.stringify(value);

      return Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        json,
        Utilities.Charset.UTF_8
      )
        .map(function (byte) {
          var hex = (byte < 0 ? byte + 256 : byte).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('');
    }

    function assertContiguousSelection_(records) {
      var sorted = records.slice().sort(function (a, b) {
        return Number(a.rowNumber) - Number(b.rowNumber);
      });

      assert_(
        sorted.length > 0,
        'Selected migration batch is empty.'
      );

      var firstRow = Number(sorted[0].rowNumber);

      var contiguous = sorted.every(function (record, index) {
        return Number(record.rowNumber) === firstRow + index;
      });

      assert_(
        contiguous,
        'Selected migration batch must occupy one contiguous physical span.'
      );

      return sorted;
    }

    function writeIdentityColumns_(sheet, records) {
      var sorted = assertContiguousSelection_(records);

      var firstRow = Number(sorted[0].rowNumber);

      var sourceRecordValues = sorted.map(function (record) {
        return [text_(record.proposedDurableKey)];
      });

      var sourceObservationValues = sorted.map(function (record) {
        return [text_(record.proposedDurableKey)];
      });

      sheet
        .getRange(
          firstRow,
          SOURCE_RECORD_KEY_COLUMN,
          sorted.length,
          1
        )
        .setValues(sourceRecordValues);

      sheet
        .getRange(
          firstRow,
          SOURCE_OBSERVATION_KEY_COLUMN,
          sorted.length,
          1
        )
        .setValues(sourceObservationValues);

      return {
        firstRow: firstRow,
        lastRow: firstRow + sorted.length - 1,
        count: sorted.length
      };
    }

    function restoreIdentityColumns_(sheet, records, prestate) {
      var sorted = records.slice().sort(function (a, b) {
        return Number(a.rowNumber) - Number(b.rowNumber);
      });

      var firstRow = Number(sorted[0].rowNumber);

      sheet
        .getRange(
          firstRow,
          SOURCE_RECORD_KEY_COLUMN,
          sorted.length,
          1
        )
        .setValues(prestate.recordKeys);

      sheet
        .getRange(
          firstRow,
          SOURCE_OBSERVATION_KEY_COLUMN,
          sorted.length,
          1
        )
        .setValues(prestate.observationKeys);
    }

    function capturePrestate_(sheet, records) {
      var sorted = records.slice().sort(function (a, b) {
        return Number(a.rowNumber) - Number(b.rowNumber);
      });

      var firstRow = Number(sorted[0].rowNumber);

      var recordKeys = sheet
        .getRange(
          firstRow,
          SOURCE_RECORD_KEY_COLUMN,
          sorted.length,
          1
        )
        .getValues();

      var observationKeys = sheet
        .getRange(
          firstRow,
          SOURCE_OBSERVATION_KEY_COLUMN,
          sorted.length,
          1
        )
        .getValues();

      return {
        recordKeys: recordKeys,
        observationKeys: observationKeys
      };
    }

    function verifyPostPlan_(prePlan, postPlan, selected) {
      var selectedKeys = {};

      selected.forEach(function (record) {
        selectedKeys[text_(record.proposedDurableKey)] = true;
      });

      var postMigration = Array.isArray(postPlan.migrationRequiredRecords)
        ? postPlan.migrationRequiredRecords
        : [];

      var postDurable = Array.isArray(postPlan.alreadyDurableRecords)
        ? postPlan.alreadyDurableRecords
        : [];

      selected.forEach(function (record) {
        var stillRequired = postMigration.some(function (candidate) {
          return (
            text_(candidate.proposedDurableKey) ===
            text_(record.proposedDurableKey)
          );
        });

        var durable = postDurable.some(function (candidate) {
          return (
            text_(candidate.proposedDurableKey) ===
            text_(record.proposedDurableKey)
          );
        });

        assert_(
          !stillRequired && durable,
          'Selected row did not make the sole expected transition: ' +
            record.rowNumber
        );
      });

      assert_(
        Number(postPlan.migrationRequiredRows) ===
          Number(prePlan.migrationRequiredRows) - selected.length,
        'Unexpected migration-required count transition.'
      );

      assert_(
        Number(postPlan.alreadyDurableRows) ===
          Number(prePlan.alreadyDurableRows) + selected.length,
        'Unexpected already-durable count transition.'
      );

      assert_(
        Number(postPlan.planBlockedRows) ===
          Number(prePlan.planBlockedRows),
        'Blocked population changed unexpectedly.'
      );

      assert_(
        Number(postPlan.collapseRequiredRows) ===
          Number(prePlan.collapseRequiredRows),
        'Collapse population changed unexpectedly.'
      );

      assert_(
        Number(postPlan.reviewRequiredRows) ===
          Number(prePlan.reviewRequiredRows),
        'Review population changed unexpectedly.'
      );

      return {
        migrationPlanSha256: text_(postPlan.migrationPlanSha256),
        completePlanSha256: text_(postPlan.completePlanSha256)
      };
    }

    function preview(options) {
      options = options || {};

      var requestedBatchSize =
        batchSize_(options.batchSize || HARD_BATCH_MAX);

      var plan =
        plan_({});

      var selected =
        selectBatch_(plan, requestedBatchSize);

      selected.forEach(validateRecord_);

      assertContiguousSelection_(selected);

      return {
        mode:
          'READ_ONLY_GENERIC_ROLLING_DURABLE_IDENTITY_CANDIDATE_PREVIEW',
        source: SOURCE,
        dataset: DATASET,
        requestedBatchSize: requestedBatchSize,
        returnedCandidateCount: selected.length,
        migrationPlanSha256:
          text_(plan.migrationPlanSha256),
        completePlanSha256:
          text_(plan.completePlanSha256),
        migrationRequiredRows:
          Number(plan.migrationRequiredRows),
        alreadyDurableRows:
          Number(plan.alreadyDurableRows),
        planBlockedRows:
          Number(plan.planBlockedRows),
        collapseRequiredRows:
          Number(plan.collapseRequiredRows),
        reviewRequiredRows:
          Number(plan.reviewRequiredRows),
        candidates:
          selected.map(function (record) {
            return {
              rowNumber:
                Number(record.rowNumber),
              distressLeadId:
                text_(record.distressLeadId),
              proposedDurableKey:
                text_(record.proposedDurableKey),
              prestateFingerprintSha256:
                text_(record.prestateFingerprintSha256)
            };
          }),
        mutationAuthorityGranted: false,
        schedulerMutationAuthorityGranted: false,
        checkpointMutationAuthorityGranted: false,
        offerAuthorityGranted: false
      };
    }

    function status() {
      var plan = plan_({});

      return {
        mode:
          'READ_ONLY_GENERIC_ROLLING_DURABLE_IDENTITY_MIGRATION_STATUS',
        source: SOURCE,
        dataset: DATASET,
        batchMax: HARD_BATCH_MAX,
        sourceRecordKeyColumn: SOURCE_RECORD_KEY_COLUMN,
        sourceObservationKeyColumn: SOURCE_OBSERVATION_KEY_COLUMN,
        migrationRequiredRows: Number(plan.migrationRequiredRows),
        alreadyDurableRows: Number(plan.alreadyDurableRows),
        planBlockedRows: Number(plan.planBlockedRows),
        collapseRequiredRows: Number(plan.collapseRequiredRows),
        reviewRequiredRows: Number(plan.reviewRequiredRows),
        migrationPlanSha256: text_(plan.migrationPlanSha256),
        completePlanSha256: text_(plan.completePlanSha256),
        mutationAuthorityGranted: false,
        schedulerMutationAuthorityGranted: false,
        checkpointMutationAuthorityGranted: false,
        offerAuthorityGranted: false
      };
    }

    function execute(options) {
      options = options || {};

      var requestedBatchSize = batchSize_(options.batchSize);

      assert_(
        REOS.Database &&
          typeof REOS.Database.withScriptLockContext === 'function',
        'Database fail-fast ScriptLock authority is unavailable.'
      );

      assert_(
        REOS.Database &&
          typeof REOS.Database.getSheet === 'function',
        'Database sheet authority is unavailable.'
      );

      var prePlan = plan_(options);

      requireRollingAuthority_(options, prePlan);

      var selected =
        selectBatch_(prePlan, requestedBatchSize);

      selected.forEach(validateRecord_);

      var checkpointBefore = frozenCheckpoint_();
      var triggersBefore = assertQuiescence_();

      var sheet =
        REOS.Database.getSheet(TABLE);

      assert_(sheet, 'Code violations sheet unavailable.');

      verifyPhysicalPrestate_(sheet, selected);

      var prestate = capturePrestate_(sheet, selected);

      var mutationStarted = false;
      var mutationComplete = false;

      try {
        var result =
          REOS.Database.withScriptLockContext(function () {
            assertQuiescence_();
            frozenCheckpoint_();

            var lockedPlan = plan_(options);

            assert_(
              text_(lockedPlan.migrationPlanSha256) ===
                text_(prePlan.migrationPlanSha256),
              'Migration plan changed before mutation.'
            );

            assert_(
              text_(lockedPlan.completePlanSha256) ===
                text_(prePlan.completePlanSha256),
              'Complete plan changed before mutation.'
            );

            verifyPhysicalPrestate_(sheet, selected);

            /*
             * Physical geometry is a pre-mutation authority condition.
             * A non-contiguous deterministic batch must fail closed
             * with zero spreadsheet writes.
             */
            assertContiguousSelection_(selected);

            /*
             * From this point forward, a physical mutation may have
             * occurred even if setValues() throws. Any failure must
             * therefore attempt exact certified rollback.
             */
            mutationStarted = true;

            writeIdentityColumns_(sheet, selected);

            SpreadsheetApp.flush();

            var postPlan = plan_(options);

            var nextHashes =
              verifyPostPlan_(
                lockedPlan,
                postPlan,
                selected
              );

            frozenCheckpoint_();
            assertQuiescence_();

            mutationComplete = true;

            return {
              postPlan: postPlan,
              nextHashes: nextHashes
            };
          });

        return {
          mode:
            'CERTIFIED_GENERIC_ROLLING_DURABLE_IDENTITY_MIGRATION_EXECUTED',
          source: SOURCE,
          dataset: DATASET,
          batchSize: selected.length,
          physicalStartRow: Math.min.apply(
            null,
            selected.map(function (record) {
              return Number(record.rowNumber);
            })
          ),
          physicalEndRow: Math.max.apply(
            null,
            selected.map(function (record) {
              return Number(record.rowNumber);
            })
          ),
          sourceRecordKeyColumn: SOURCE_RECORD_KEY_COLUMN,
          sourceObservationKeyColumn: SOURCE_OBSERVATION_KEY_COLUMN,
          physicalWriteRangeCount: 2,
          initialMigrationPlanSha256:
            text_(prePlan.migrationPlanSha256),
          initialCompletePlanSha256:
            text_(prePlan.completePlanSha256),
          nextMigrationPlanSha256:
            result.nextHashes.migrationPlanSha256,
          nextCompletePlanSha256:
            result.nextHashes.completePlanSha256,
          migrationRequiredRowsBefore:
            Number(prePlan.migrationRequiredRows),
          migrationRequiredRowsAfter:
            Number(result.postPlan.migrationRequiredRows),
          alreadyDurableRowsBefore:
            Number(prePlan.alreadyDurableRows),
          alreadyDurableRowsAfter:
            Number(result.postPlan.alreadyDurableRows),
          planBlockedRows:
            Number(result.postPlan.planBlockedRows),
          collapseRequiredRows:
            Number(result.postPlan.collapseRequiredRows),
          reviewRequiredRows:
            Number(result.postPlan.reviewRequiredRows),
          triggerCountBefore:
            triggersBefore.triggerCount,
          checkpointCycleBefore:
            text_(checkpointBefore.id),
          productionDataMutationExecuted: mutationComplete,
          migrationExecuted: mutationComplete,
          migrationAuthorityConsumed: mutationComplete,
          automaticOfferAuthorityGranted: false,
          schedulerMutationAuthorityGranted: false,
          checkpointMutationAuthorityGranted: false,
          retryPermitted: false
        };
      } catch (error) {
        /*
         * If the mutation was fully verified under the lock and only
         * lock finalization failed afterward, physical durable state is
         * authoritative but the overall result is ambiguous. Never
         * perform a compensating write in that state.
         */
        if (mutationComplete) {
          throw new Error(
            ROLLBACK_AMBIGUOUS +
              ': migration=' +
              text_(error.message || error) +
              '; rollback=not_attempted_verified_mutation_complete'
          );
        }

        /*
         * Failures before the first physical write attempt—including
         * ScriptLock contention, under-lock checkpoint drift, trigger
         * drift, plan drift, and physical-prestate drift—must perform
         * zero spreadsheet writes.
         */
        if (!mutationStarted) {
          throw error;
        }

        /*
         * Once a physical write has been attempted, restore both
         * certified identity columns and independently verify the exact
         * original plan/checkpoint/quiescent state.
         */
        try {
          restoreIdentityColumns_(
            sheet,
            selected,
            prestate
          );

          SpreadsheetApp.flush();

          var rollbackPlan = plan_(options);

          verifyPhysicalPrestate_(
            sheet,
            selected
          );

          assert_(
            text_(rollbackPlan.migrationPlanSha256) ===
              text_(prePlan.migrationPlanSha256),
            'Rollback plan SHA did not return to prestate.'
          );

          assert_(
            text_(rollbackPlan.completePlanSha256) ===
              text_(prePlan.completePlanSha256),
            'Rollback complete SHA did not return to prestate.'
          );

          frozenCheckpoint_();
          assertQuiescence_();
        } catch (rollbackError) {
          throw new Error(
            ROLLBACK_AMBIGUOUS +
              ': migration=' +
              text_(error.message || error) +
              '; rollback=' +
              text_(rollbackError.message || rollbackError)
          );
        }

        /*
         * This throw is deliberately outside the rollback try/catch.
         * A successfully certified rollback is NOT an ambiguous result.
         */
        throw new Error(
          'Generic rolling migration failed and certified prestate was restored: ' +
            text_(error.message || error)
        );
      }
    }

    return {
      status: status,
      preview: preview,
      execute: execute
    };
  })();

function reosCountyCodeViolationDurableIdentityRollingMigrationStatus() {
  return REOS.CountyCodeViolationDurableIdentityRollingMigrationExecutor.status();
}

function reosCountyCodeViolationDurableIdentityRollingMigrationPreview(options) {
  return REOS.CountyCodeViolationDurableIdentityRollingMigrationExecutor.preview(
    options ||
    {}
  );
}


function reosCountyCodeViolationDurableIdentityRollingMigrationExecute(options) {
  return REOS.CountyCodeViolationDurableIdentityRollingMigrationExecutor.execute(
    options
  );
}
