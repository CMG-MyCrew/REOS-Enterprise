/**
 * REOS Enterprise
 * Gate 2B — Philadelphia Code Violations
 * Bounded blocked-storage backfill executor.
 *
 * Restores ONLY the persisted prerequisites for the certified 814-row
 * plan-blocked cohort:
 *   - Canonical Property Key <- derived canonical identity
 *   - Source Observation Key <- existing legacy ObjectID observation key
 *
 * It NEVER writes Source Record Key, NEVER writes the durable Violation
 * Number observation key, NEVER collapses rows, and NEVER grants scheduler,
 * checkpoint, offer, winner-selection, or collapse authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationBlockedStorageBackfillExecutor =
  (function () {
    'use strict';

    var SOURCE = 'PA-PHILADELPHIA';
    var DATASET = 'code_violations';
    var TABLE = 'DISTRESS_LEADS';

    var SOURCE_RECORD_KEY_EXPECTED_COLUMN = 25;
    var SOURCE_OBSERVATION_KEY_EXPECTED_COLUMN = 51;

    var HARD_BATCH_MAX = 250;
    var MAX_PHYSICAL_SPANS = 70;
    var MAX_FORWARD_WRITE_RANGES = 140;

    var EXPECTED_CYCLE = 'COUNTY-20260902222607805';
    var EXPECTED_FEED_INDEX = 0;
    var EXPECTED_CURSOR =
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

    var ALLOWED_HEARTBEAT_HANDLER =
      'reosProductionOperationsHeartbeat';

    var READ_ONLY_PLAN_MODE =
      'READ_ONLY_CODE_VIOLATION_DURABLE_IDENTITY_MIGRATION_PLAN';

    var BLOCKED_BACKFILL_AUTHORITY_SHA256 =
      'ad4b109d3e4a8980b0d228b3ed5c7d8a346a06a3ba08dfcfeb183eebf77aa814';

    var WINDOW_PLAN_SHA256 =
      'e5065fe442d072b3bf05376d44b209cb592b01c0f30aba871d7bd578da40b470';

    var ROLLBACK_AMBIGUOUS =
      'GATE_2B_BLOCKED_BACKFILL_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY';

    var WINDOWS = {
      1: {
        candidateCount: 250,
        physicalSpanCount: 60,
        physicalWriteRangeCount: 120,
        planBlockedRowsBefore: 814,
        planBlockedRowsAfter: 564,
        migrationRequiredRowsBefore: 0,
        migrationRequiredRowsAfter: 250,
        candidateAuthoritySha256:
          'abda6858ff296f2ddce454c2c02e3b05862c8452576a6e2b1a0e127cdb1e8fee',
        spanGeometrySha256:
          '20685d9cc162624d099494f030e465a688d223c9c5985bff589f828a3a3cef23'
      },
      2: {
        candidateCount: 250,
        physicalSpanCount: 27,
        physicalWriteRangeCount: 54,
        planBlockedRowsBefore: 564,
        planBlockedRowsAfter: 314,
        migrationRequiredRowsBefore: 250,
        migrationRequiredRowsAfter: 500,
        candidateAuthoritySha256:
          '63ca3a9db81a3b0ab7596cbc2c95dc95294679ac8af970868fc8ea3bf7f710be',
        spanGeometrySha256:
          '45b0f7f8a8e71762f76f89b2540823d6735552656702baf969b7d56d6b5d251a'
      },
      3: {
        candidateCount: 215,
        physicalSpanCount: 70,
        physicalWriteRangeCount: 140,
        planBlockedRowsBefore: 314,
        planBlockedRowsAfter: 99,
        migrationRequiredRowsBefore: 500,
        migrationRequiredRowsAfter: 715,
        candidateAuthoritySha256:
          'a89dfc349741a7b42a14955c312166833f1a9f7b700d99cd5a9bcedcf649ad49',
        spanGeometrySha256:
          '8c511f38a1889f3099d7aaad8fca393125db677a2024c80539e03dd11aba515f'
      },
      4: {
        candidateCount: 99,
        physicalSpanCount: 38,
        physicalWriteRangeCount: 76,
        planBlockedRowsBefore: 99,
        planBlockedRowsAfter: 0,
        migrationRequiredRowsBefore: 715,
        migrationRequiredRowsAfter: 814,
        candidateAuthoritySha256:
          '66d44834e0f01fa1d0f4f84f8c1f0f1212ea1d754f6a8be88f339df5c61d594b',
        spanGeometrySha256:
          'ee24c752004c874e97416876aa1cd0c9898c5e81136c381c512e5ffcee642543'
      }
    };

    function text_(value) {
      return value === null || value === undefined
        ? ''
        : String(value).trim();
    }

    function assert_(condition, message) {
      if (!condition) {
        throw new Error(message);
      }
    }

    function positiveInteger_(value, name) {
      var number = Number(value);

      assert_(
        Number.isInteger(number) && number > 0,
        name + ' must be a positive integer.'
      );

      return number;
    }

    function windowAuthority_(value) {
      var windowNumber = positiveInteger_(value, 'windowNumber');
      var authority = WINDOWS[windowNumber];

      assert_(
        authority,
        'windowNumber must identify certified blocked-backfill window 1..4.'
      );

      return {
        windowNumber: windowNumber,
        authority: authority
      };
    }

    function sha256HexText_(value) {
      return Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        String(value),
        Utilities.Charset.UTF_8
      )
        .map(function (byte) {
          var number = byte < 0 ? byte + 256 : byte;
          var hex = number.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('');
    }

    function digestJson_(value) {
      return sha256HexText_(JSON.stringify(value));
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
        'Blocked backfill requires at most one production heartbeat trigger.'
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
          typeof REOS.CountyProductionScheduler.getCheckpoint === 'function',
        'County checkpoint read authority is unavailable.'
      );

      var checkpoint = REOS.CountyProductionScheduler.getCheckpoint();

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

    function schemaColumns_() {
      assert_(
        REOS.Database &&
          typeof REOS.Database.getHeaders === 'function',
        'Database header authority is unavailable.'
      );

      var headers = REOS.Database.getHeaders(TABLE);

      function column_(header) {
        var index = headers.indexOf(header);
        assert_(index !== -1, 'Required header missing: ' + header);
        return index + 1;
      }

      var columns = {
        canonicalPropertyKey: column_('Canonical Property Key'),
        sourceRecordKey: column_('Source Record Key'),
        sourceObservationKey: column_('Source Observation Key')
      };

      assert_(
        columns.sourceRecordKey === SOURCE_RECORD_KEY_EXPECTED_COLUMN,
        'Source Record Key physical column changed.'
      );

      assert_(
        columns.sourceObservationKey === SOURCE_OBSERVATION_KEY_EXPECTED_COLUMN,
        'Source Observation Key physical column changed.'
      );

      assert_(
        columns.canonicalPropertyKey !== columns.sourceRecordKey &&
          columns.canonicalPropertyKey !== columns.sourceObservationKey,
        'Canonical Property Key column overlaps identity key columns.'
      );

      return columns;
    }

    function plan_() {
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
        Number(plan.countySchedulerTriggerCount) === 0,
        'County scheduler trigger count is not zero.'
      );

      assert_(
        Number(plan.alreadyDurableRows) === 4026,
        'Already-durable population changed during blocked backfill.'
      );

      assert_(
        Number(plan.collapseRequiredRows) === 141,
        'Collapse-required population changed during blocked backfill.'
      );

      assert_(
        Number(plan.reviewRequiredRows) === 95,
        'Review-required population changed during blocked backfill.'
      );

      return plan;
    }

    function currentWindowNumber_(plan) {
      var blocked = Number(plan.planBlockedRows);
      var migration = Number(plan.migrationRequiredRows);
      var found = 0;

      Object.keys(WINDOWS).forEach(function (key) {
        var number = Number(key);
        var authority = WINDOWS[number];

        if (
          blocked === Number(authority.planBlockedRowsBefore) &&
          migration === Number(authority.migrationRequiredRowsBefore)
        ) {
          assert_(found === 0, 'Ambiguous blocked-backfill window state.');
          found = number;
        }
      });

      if (found) return found;

      if (blocked === 0 && migration === 814) return 0;

      throw new Error(
        'Blocked-backfill plan state does not match any certified window boundary.'
      );
    }

    function orderedBlocked_(plan) {
      var records = Array.isArray(plan.planBlockedRecords)
        ? plan.planBlockedRecords.slice()
        : [];

      records.sort(function (a, b) {
        var keyA = text_(a.proposedDurableKey);
        var keyB = text_(b.proposedDurableKey);

        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;

        return Number(a.rowNumber) - Number(b.rowNumber);
      });

      return records;
    }

    function selectWindow_(plan, windowNumber) {
      var authority = WINDOWS[windowNumber];

      assert_(authority, 'Unknown blocked-backfill window.');

      assert_(
        Number(plan.planBlockedRows) ===
          Number(authority.planBlockedRowsBefore),
        'planBlockedRows does not match certified window prestate.'
      );

      assert_(
        Number(plan.migrationRequiredRows) ===
          Number(authority.migrationRequiredRowsBefore),
        'migrationRequiredRows does not match certified window prestate.'
      );

      var records = orderedBlocked_(plan);

      assert_(
        records.length === Number(authority.planBlockedRowsBefore),
        'Complete blocked-record population does not match certified prestate.'
      );

      var selected = records.slice(0, Number(authority.candidateCount));

      assert_(
        selected.length === Number(authority.candidateCount),
        'Certified blocked-backfill window selection is incomplete.'
      );

      return selected;
    }

    function legacyObjectIdKey_(value) {
      var parts = text_(value).split('|');

      return (
        parts.length === 3 &&
        parts[0] === 'pa-philadelphia' &&
        parts[1] === 'code_violations' &&
        /^[0-9]+$/.test(parts[2])
      );
    }

    function exactBlockReasons_(record) {
      var reasons = Array.isArray(record.planBlockReasons)
        ? record.planBlockReasons.slice().sort()
        : [];

      return (
        reasons.length === 2 &&
        reasons[0] === 'stored_canonical_identity_missing' &&
        reasons[1] === 'stored_observation_key_incomplete'
      );
    }

    function validateBackfillRecord_(record) {
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
        text_(record.violationNumber),
        'Missing Violation Number at row ' + record.rowNumber
      );

      assert_(
        text_(record.canonicalPropertyKey),
        'Derived canonical identity unavailable at row ' + record.rowNumber
      );

      assert_(
        !text_(record.storedCanonicalPropertyKey),
        'Stored canonical identity is no longer missing at row ' +
          record.rowNumber
      );

      assert_(
        !text_(record.sourceObservationKey),
        'Source Observation Key is no longer missing at row ' +
          record.rowNumber
      );

      assert_(
        legacyObjectIdKey_(record.legacyObservationKey),
        'Legacy ObjectID observation authority invalid at row ' +
          record.rowNumber
      );

      assert_(
        text_(record.sourceRecordKey) === text_(record.legacyObservationKey),
        'Source Record Key no longer matches legacy authority at row ' +
          record.rowNumber
      );

      assert_(
        text_(record.proposedDurableKey) &&
          text_(record.proposedDurableKey) !==
            text_(record.legacyObservationKey),
        'Durable/legacy identity separation unavailable at row ' +
          record.rowNumber
      );

      assert_(
        exactBlockReasons_(record),
        'Blocked-backfill reason set changed at row ' + record.rowNumber
      );

      assert_(
        text_(record.prestateFingerprintSha256),
        'Prestate fingerprint unavailable at row ' + record.rowNumber
      );
    }

    function candidateAuthoritySha_(records) {
      var material = records
        .map(function (record) {
          return [
            Number(record.rowNumber),
            text_(record.distressLeadId),
            text_(record.violationNumber),
            text_(record.canonicalPropertyKey),
            text_(record.legacyObservationKey),
            text_(record.proposedDurableKey),
            text_(record.sourceRecordKey),
            text_(record.sourceObservationKey)
          ].join('|');
        })
        .join('\n');

      return sha256HexText_(material);
    }

    function buildPhysicalSpans_(records) {
      var sorted = records.slice().sort(function (a, b) {
        return Number(a.rowNumber) - Number(b.rowNumber);
      });

      assert_(sorted.length > 0, 'Selected backfill window is empty.');
      assert_(
        sorted.length <= HARD_BATCH_MAX,
        'Selected backfill window exceeds certified batch maximum.'
      );

      var spans = [];
      var current = null;
      var previousRow = null;

      sorted.forEach(function (record) {
        var row = Number(record.rowNumber);

        assert_(
          previousRow === null || row !== previousRow,
          'Duplicate physical row authority detected: ' + row
        );

        if (current === null || row !== Number(current.lastRow) + 1) {
          current = {
            firstRow: row,
            lastRow: row,
            count: 1,
            records: [record]
          };
          spans.push(current);
        } else {
          current.lastRow = row;
          current.count += 1;
          current.records.push(record);
        }

        previousRow = row;
      });

      assert_(
        spans.length <= MAX_PHYSICAL_SPANS,
        'Selected backfill window exceeds certified physical-span maximum.'
      );

      assert_(
        spans.length * 2 <= MAX_FORWARD_WRITE_RANGES,
        'Selected backfill window exceeds certified forward write-range maximum.'
      );

      return spans;
    }

    function spanSummary_(spans) {
      return spans.map(function (span) {
        return {
          firstRow: Number(span.firstRow),
          lastRow: Number(span.lastRow),
          count: Number(span.count)
        };
      });
    }

    function spanGeometrySha_(spans) {
      var material = spanSummary_(spans).map(function (span) {
        return {
          count: Number(span.count),
          firstRow: Number(span.firstRow),
          lastRow: Number(span.lastRow)
        };
      });

      return sha256HexText_(JSON.stringify(material));
    }

    function certifySelection_(windowNumber, selected, spans) {
      var authority = WINDOWS[windowNumber];
      var candidateSha = candidateAuthoritySha_(selected);
      var spanSha = spanGeometrySha_(spans);

      assert_(
        selected.length === Number(authority.candidateCount),
        'Candidate count does not match certified window.'
      );

      assert_(
        spans.length === Number(authority.physicalSpanCount),
        'Physical span count does not match certified window.'
      );

      assert_(
        spans.length * 2 === Number(authority.physicalWriteRangeCount),
        'Physical write-range count does not match certified window.'
      );

      assert_(
        candidateSha === text_(authority.candidateAuthoritySha256),
        'Candidate authority SHA does not match certified window.'
      );

      assert_(
        spanSha === text_(authority.spanGeometrySha256),
        'Span geometry SHA does not match certified window.'
      );

      return {
        candidateAuthoritySha256: candidateSha,
        spanGeometrySha256: spanSha
      };
    }

    function assertSameSelection_(expected, actual) {
      assert_(
        expected.length === actual.length,
        'Deterministic blocked-backfill selection changed under lock.'
      );

      expected.forEach(function (record, index) {
        var candidate = actual[index];

        assert_(
          Number(record.rowNumber) === Number(candidate.rowNumber) &&
            text_(record.distressLeadId) === text_(candidate.distressLeadId) &&
            text_(record.proposedDurableKey) ===
              text_(candidate.proposedDurableKey) &&
            text_(record.prestateFingerprintSha256) ===
              text_(candidate.prestateFingerprintSha256),
          'Deterministic blocked-backfill selection changed under lock.'
        );
      });
    }

    function assertSameSpanGeometry_(expected, actual) {
      assert_(
        JSON.stringify(spanSummary_(expected)) ===
          JSON.stringify(spanSummary_(actual)),
        'Blocked-backfill physical span geometry changed under lock.'
      );
    }

    function physicalFingerprint_(record, storedCanonical, storedObservation, storedRecord) {
      return digestJson_({
        rowNumber: Number(record.rowNumber),
        distressLeadId: text_(record.distressLeadId),
        sourceRecordId: text_(record.sourceRecordId),
        violationNumber: text_(record.violationNumber),
        parcelId: text_(record.parcelId),
        canonicalPropertyKey: text_(record.canonicalPropertyKey),
        storedCanonicalPropertyKey: text_(storedCanonical),
        sourceObservationKey: text_(storedObservation),
        sourceRecordKey: text_(storedRecord),
        legacyObservationKey: text_(record.legacyObservationKey),
        proposedDurableKey: text_(record.proposedDurableKey)
      });
    }

    function verifyPhysicalPrestate_(sheet, columns, spans) {
      var firstColumn = Math.min(
        columns.canonicalPropertyKey,
        columns.sourceRecordKey,
        columns.sourceObservationKey
      );

      var lastColumn = Math.max(
        columns.canonicalPropertyKey,
        columns.sourceRecordKey,
        columns.sourceObservationKey
      );

      spans.forEach(function (span) {
        var values = sheet
          .getRange(
            Number(span.firstRow),
            firstColumn,
            Number(span.count),
            lastColumn - firstColumn + 1
          )
          .getValues();

        span.records.forEach(function (record, index) {
          var row = values[index];

          var storedCanonical =
            text_(row[columns.canonicalPropertyKey - firstColumn]);
          var storedRecord =
            text_(row[columns.sourceRecordKey - firstColumn]);
          var storedObservation =
            text_(row[columns.sourceObservationKey - firstColumn]);

          assert_(
            !storedCanonical,
            'Physical stored canonical identity changed at row ' +
              record.rowNumber
          );

          assert_(
            !storedObservation,
            'Physical Source Observation Key changed at row ' +
              record.rowNumber
          );

          assert_(
            storedRecord === text_(record.legacyObservationKey),
            'Physical Source Record Key changed at row ' + record.rowNumber
          );

          assert_(
            physicalFingerprint_(
              record,
              storedCanonical,
              storedObservation,
              storedRecord
            ) === text_(record.prestateFingerprintSha256),
            'Physical prestate fingerprint changed at row ' + record.rowNumber
          );
        });
      });
    }

    function capturePrestate_(sheet, columns, spans) {
      return spans.map(function (span) {
        return {
          firstRow: Number(span.firstRow),
          lastRow: Number(span.lastRow),
          count: Number(span.count),
          canonicalPropertyKeys: sheet
            .getRange(
              Number(span.firstRow),
              columns.canonicalPropertyKey,
              Number(span.count),
              1
            )
            .getValues(),
          observationKeys: sheet
            .getRange(
              Number(span.firstRow),
              columns.sourceObservationKey,
              Number(span.count),
              1
            )
            .getValues()
        };
      });
    }

    function writeBackfillSpans_(sheet, columns, spans) {
      var writeRangeCount = 0;

      spans.forEach(function (span) {
        var canonicalValues = span.records.map(function (record) {
          return [text_(record.canonicalPropertyKey)];
        });

        var observationValues = span.records.map(function (record) {
          return [text_(record.legacyObservationKey)];
        });

        sheet
          .getRange(
            Number(span.firstRow),
            columns.canonicalPropertyKey,
            Number(span.count),
            1
          )
          .setValues(canonicalValues);

        writeRangeCount += 1;

        sheet
          .getRange(
            Number(span.firstRow),
            columns.sourceObservationKey,
            Number(span.count),
            1
          )
          .setValues(observationValues);

        writeRangeCount += 1;
      });

      assert_(
        writeRangeCount === spans.length * 2,
        'Forward blocked-backfill write-range count mismatch.'
      );

      assert_(
        writeRangeCount <= MAX_FORWARD_WRITE_RANGES,
        'Forward blocked-backfill write-range maximum exceeded.'
      );

      return {
        spanCount: spans.length,
        writeRangeCount: writeRangeCount
      };
    }

    function restoreBackfillSpans_(sheet, columns, prestate) {
      prestate.forEach(function (span) {
        sheet
          .getRange(
            Number(span.firstRow),
            columns.canonicalPropertyKey,
            Number(span.count),
            1
          )
          .setValues(span.canonicalPropertyKeys);

        sheet
          .getRange(
            Number(span.firstRow),
            columns.sourceObservationKey,
            Number(span.count),
            1
          )
          .setValues(span.observationKeys);
      });
    }

    function verifyPostPlan_(prePlan, postPlan, selected, windowNumber) {
      var authority = WINDOWS[windowNumber];
      var blocked = Array.isArray(postPlan.planBlockedRecords)
        ? postPlan.planBlockedRecords
        : [];
      var migration = Array.isArray(postPlan.migrationRequiredRecords)
        ? postPlan.migrationRequiredRecords
        : [];

      selected.forEach(function (record) {
        var rowNumber = Number(record.rowNumber);
        var distressLeadId = text_(record.distressLeadId);
        var durableKey = text_(record.proposedDurableKey);

        var stillBlocked = blocked.some(function (candidate) {
          return (
            Number(candidate.rowNumber) === rowNumber &&
            text_(candidate.distressLeadId) === distressLeadId &&
            text_(candidate.proposedDurableKey) === durableKey
          );
        });

        var migratedMatches = migration.filter(function (candidate) {
          return (
            Number(candidate.rowNumber) === rowNumber &&
            text_(candidate.distressLeadId) === distressLeadId &&
            text_(candidate.proposedDurableKey) === durableKey
          );
        });

        assert_(
          !stillBlocked && migratedMatches.length === 1,
          'Backfilled row did not make the sole expected blocked->migration transition: ' +
            rowNumber
        );

        var migrated = migratedMatches[0];

        assert_(
          text_(migrated.storedCanonicalPropertyKey) ===
            text_(record.canonicalPropertyKey),
          'Backfilled canonical identity mismatch at row ' + rowNumber
        );

        assert_(
          text_(migrated.sourceObservationKey) ===
            text_(record.legacyObservationKey),
          'Backfilled observation identity mismatch at row ' + rowNumber
        );

        assert_(
          text_(migrated.sourceRecordKey) ===
            text_(record.legacyObservationKey),
          'Source Record Key changed unexpectedly at row ' + rowNumber
        );
      });

      assert_(
        Number(postPlan.planBlockedRows) ===
          Number(authority.planBlockedRowsAfter),
        'Unexpected planBlockedRows transition.'
      );

      assert_(
        Number(postPlan.migrationRequiredRows) ===
          Number(authority.migrationRequiredRowsAfter),
        'Unexpected migrationRequiredRows transition.'
      );

      assert_(
        Number(postPlan.alreadyDurableRows) === 4026,
        'Already-durable population changed unexpectedly.'
      );

      assert_(
        Number(postPlan.collapseRequiredRows) === 141,
        'Collapse-required population changed unexpectedly.'
      );

      assert_(
        Number(postPlan.reviewRequiredRows) === 95,
        'Review-required population changed unexpectedly.'
      );

      return {
        migrationPlanSha256: text_(postPlan.migrationPlanSha256),
        completePlanSha256: text_(postPlan.completePlanSha256)
      };
    }

    function requireExecutionAuthority_(options, prePlan, windowNumber, certification) {
      var authority = WINDOWS[windowNumber];

      assert_(
        options &&
          options.confirmBlockedStorageBackfill === true &&
          options.confirmCanonicalPropertyBackfill === true &&
          options.confirmLegacyObservationPreservation === true &&
          options.confirmNoDurableObservationWrite === true &&
          options.confirmNoSourceRecordKeyWrite === true &&
          options.confirmNoInsertDelete === true,
        'All six blocked-storage backfill confirmations are required.'
      );

      assert_(
        text_(options.windowPlanSha256) === WINDOW_PLAN_SHA256,
        'Caller windowPlanSha256 does not match certified authority.'
      );

      assert_(
        text_(options.blockedBackfillAuthoritySha256) ===
          BLOCKED_BACKFILL_AUTHORITY_SHA256,
        'Caller blockedBackfillAuthoritySha256 does not match certified authority.'
      );

      assert_(
        text_(options.candidateAuthoritySha256) ===
          text_(authority.candidateAuthoritySha256) &&
          text_(options.candidateAuthoritySha256) ===
            text_(certification.candidateAuthoritySha256),
        'Caller candidateAuthoritySha256 does not match certified window.'
      );

      assert_(
        text_(options.spanGeometrySha256) ===
          text_(authority.spanGeometrySha256) &&
          text_(options.spanGeometrySha256) ===
            text_(certification.spanGeometrySha256),
        'Caller spanGeometrySha256 does not match certified window.'
      );

      assert_(
        text_(options.migrationPlanSha256) ===
          text_(prePlan.migrationPlanSha256),
        'Caller migrationPlanSha256 does not match current plan.'
      );

      assert_(
        text_(options.completePlanSha256) ===
          text_(prePlan.completePlanSha256),
        'Caller completePlanSha256 does not match current plan.'
      );
    }

    function preview(options) {
      options = options || {};

      var requested = windowAuthority_(options.windowNumber);
      var plan = plan_();
      var currentWindow = currentWindowNumber_(plan);

      assert_(
        currentWindow === requested.windowNumber,
        'Requested blocked-backfill window is not the current certified window.'
      );

      var selected = selectWindow_(plan, requested.windowNumber);
      selected.forEach(validateBackfillRecord_);

      var spans = buildPhysicalSpans_(selected);
      var certification =
        certifySelection_(requested.windowNumber, selected, spans);
      var columns = schemaColumns_();
      var summaries = spanSummary_(spans);

      return {
        mode: 'READ_ONLY_CERTIFIED_BLOCKED_STORAGE_BACKFILL_PREVIEW',
        source: SOURCE,
        dataset: DATASET,
        windowNumber: requested.windowNumber,
        windowPlanSha256: WINDOW_PLAN_SHA256,
        blockedBackfillAuthoritySha256:
          BLOCKED_BACKFILL_AUTHORITY_SHA256,
        candidateCount: selected.length,
        physicalSpanCount: spans.length,
        physicalWriteRangeCount: spans.length * 2,
        physicalSpans: summaries,
        candidateAuthoritySha256:
          certification.candidateAuthoritySha256,
        spanGeometrySha256:
          certification.spanGeometrySha256,
        canonicalPropertyKeyColumn: columns.canonicalPropertyKey,
        sourceRecordKeyColumn: columns.sourceRecordKey,
        sourceObservationKeyColumn: columns.sourceObservationKey,
        migrationPlanSha256: text_(plan.migrationPlanSha256),
        completePlanSha256: text_(plan.completePlanSha256),
        planBlockedRowsBefore:
          Number(requested.authority.planBlockedRowsBefore),
        planBlockedRowsAfter:
          Number(requested.authority.planBlockedRowsAfter),
        migrationRequiredRowsBefore:
          Number(requested.authority.migrationRequiredRowsBefore),
        migrationRequiredRowsAfter:
          Number(requested.authority.migrationRequiredRowsAfter),
        alreadyDurableRows: 4026,
        collapseRequiredRows: 141,
        reviewRequiredRows: 95,
        candidates: selected.map(function (record) {
          return {
            rowNumber: Number(record.rowNumber),
            distressLeadId: text_(record.distressLeadId),
            violationNumber: text_(record.violationNumber),
            canonicalPropertyKey: text_(record.canonicalPropertyKey),
            legacyObservationKey: text_(record.legacyObservationKey),
            proposedDurableKey: text_(record.proposedDurableKey),
            sourceRecordKey: text_(record.sourceRecordKey),
            sourceObservationKey: text_(record.sourceObservationKey),
            prestateFingerprintSha256:
              text_(record.prestateFingerprintSha256)
          };
        }),
        mutationAuthorityGranted: false,
        schedulerMutationAuthorityGranted: false,
        checkpointMutationAuthorityGranted: false,
        collapseAuthorityGranted: false,
        winnerSelectionAuthorityGranted: false,
        offerAuthorityGranted: false
      };
    }

    function status() {
      var plan = plan_();
      var columns = schemaColumns_();
      var currentWindow = currentWindowNumber_(plan);

      return {
        mode: 'READ_ONLY_CERTIFIED_BLOCKED_STORAGE_BACKFILL_STATUS',
        source: SOURCE,
        dataset: DATASET,
        currentWindowNumber: currentWindow,
        backfillComplete: currentWindow === 0,
        windowPlanSha256: WINDOW_PLAN_SHA256,
        blockedBackfillAuthoritySha256:
          BLOCKED_BACKFILL_AUTHORITY_SHA256,
        hardBatchMax: HARD_BATCH_MAX,
        physicalSpanMax: MAX_PHYSICAL_SPANS,
        forwardWriteRangeMax: MAX_FORWARD_WRITE_RANGES,
        canonicalPropertyKeyColumn: columns.canonicalPropertyKey,
        sourceRecordKeyColumn: columns.sourceRecordKey,
        sourceObservationKeyColumn: columns.sourceObservationKey,
        planBlockedRows: Number(plan.planBlockedRows),
        migrationRequiredRows: Number(plan.migrationRequiredRows),
        alreadyDurableRows: Number(plan.alreadyDurableRows),
        collapseRequiredRows: Number(plan.collapseRequiredRows),
        reviewRequiredRows: Number(plan.reviewRequiredRows),
        migrationPlanSha256: text_(plan.migrationPlanSha256),
        completePlanSha256: text_(plan.completePlanSha256),
        mutationAuthorityGranted: false,
        schedulerMutationAuthorityGranted: false,
        checkpointMutationAuthorityGranted: false,
        collapseAuthorityGranted: false,
        winnerSelectionAuthorityGranted: false,
        offerAuthorityGranted: false
      };
    }

    function execute(options) {
      options = options || {};

      assert_(
        REOS.Database &&
          typeof REOS.Database.withScriptLockContext === 'function',
        'Database fail-fast ScriptLock authority is unavailable.'
      );

      assert_(
        REOS.Database && typeof REOS.Database.getSheet === 'function',
        'Database sheet authority is unavailable.'
      );

      var requested = windowAuthority_(options.windowNumber);
      var prePlan = plan_();
      var currentWindow = currentWindowNumber_(prePlan);

      assert_(
        currentWindow === requested.windowNumber,
        'Requested blocked-backfill window is not the current certified window.'
      );

      var selected = selectWindow_(prePlan, requested.windowNumber);
      selected.forEach(validateBackfillRecord_);

      var spans = buildPhysicalSpans_(selected);
      var certification =
        certifySelection_(requested.windowNumber, selected, spans);

      requireExecutionAuthority_(
        options,
        prePlan,
        requested.windowNumber,
        certification
      );

      var checkpointBefore = frozenCheckpoint_();
      var triggersBefore = assertQuiescence_();
      var columns = schemaColumns_();
      var sheet = REOS.Database.getSheet(TABLE);

      assert_(sheet, 'Code violations sheet unavailable.');

      verifyPhysicalPrestate_(sheet, columns, spans);

      var prestate = null;
      var mutationStarted = false;
      var mutationComplete = false;

      try {
        var result =
          REOS.Database.withScriptLockContext(function () {
            assertQuiescence_();
            frozenCheckpoint_();

            var lockedPlan = plan_();

            assert_(
              text_(lockedPlan.migrationPlanSha256) ===
                text_(prePlan.migrationPlanSha256),
              'Migration plan changed before blocked backfill.'
            );

            assert_(
              text_(lockedPlan.completePlanSha256) ===
                text_(prePlan.completePlanSha256),
              'Complete plan changed before blocked backfill.'
            );

            assert_(
              currentWindowNumber_(lockedPlan) === requested.windowNumber,
              'Blocked-backfill window boundary changed under lock.'
            );

            var lockedSelected =
              selectWindow_(lockedPlan, requested.windowNumber);
            lockedSelected.forEach(validateBackfillRecord_);

            assertSameSelection_(selected, lockedSelected);

            var lockedSpans = buildPhysicalSpans_(lockedSelected);
            assertSameSpanGeometry_(spans, lockedSpans);

            var lockedCertification =
              certifySelection_(
                requested.windowNumber,
                lockedSelected,
                lockedSpans
              );

            assert_(
              lockedCertification.candidateAuthoritySha256 ===
                certification.candidateAuthoritySha256 &&
                lockedCertification.spanGeometrySha256 ===
                  certification.spanGeometrySha256,
              'Certified blocked-backfill authority changed under lock.'
            );

            verifyPhysicalPrestate_(sheet, columns, lockedSpans);

            prestate = capturePrestate_(sheet, columns, lockedSpans);
            mutationStarted = true;

            var writeResult =
              writeBackfillSpans_(sheet, columns, lockedSpans);

            SpreadsheetApp.flush();

            var postPlan = plan_();
            var nextHashes =
              verifyPostPlan_(
                lockedPlan,
                postPlan,
                lockedSelected,
                requested.windowNumber
              );

            frozenCheckpoint_();
            assertQuiescence_();

            mutationComplete = true;

            return {
              postPlan: postPlan,
              nextHashes: nextHashes,
              lockedSpans: lockedSpans,
              writeResult: writeResult
            };
          });

        var summaries = spanSummary_(result.lockedSpans);

        return {
          mode: 'CERTIFIED_BLOCKED_STORAGE_BACKFILL_EXECUTED',
          source: SOURCE,
          dataset: DATASET,
          windowNumber: requested.windowNumber,
          windowPlanSha256: WINDOW_PLAN_SHA256,
          blockedBackfillAuthoritySha256:
            BLOCKED_BACKFILL_AUTHORITY_SHA256,
          candidateAuthoritySha256:
            certification.candidateAuthoritySha256,
          spanGeometrySha256:
            certification.spanGeometrySha256,
          candidateCount: selected.length,
          physicalSpanCount: result.writeResult.spanCount,
          physicalWriteRangeCount: result.writeResult.writeRangeCount,
          physicalSpans: summaries,
          canonicalPropertyKeyColumn: columns.canonicalPropertyKey,
          sourceRecordKeyColumn: columns.sourceRecordKey,
          sourceObservationKeyColumn: columns.sourceObservationKey,
          initialMigrationPlanSha256:
            text_(prePlan.migrationPlanSha256),
          initialCompletePlanSha256:
            text_(prePlan.completePlanSha256),
          nextMigrationPlanSha256:
            result.nextHashes.migrationPlanSha256,
          nextCompletePlanSha256:
            result.nextHashes.completePlanSha256,
          planBlockedRowsBefore:
            Number(requested.authority.planBlockedRowsBefore),
          planBlockedRowsAfter:
            Number(result.postPlan.planBlockedRows),
          migrationRequiredRowsBefore:
            Number(requested.authority.migrationRequiredRowsBefore),
          migrationRequiredRowsAfter:
            Number(result.postPlan.migrationRequiredRows),
          alreadyDurableRowsAfter:
            Number(result.postPlan.alreadyDurableRows),
          collapseRequiredRows:
            Number(result.postPlan.collapseRequiredRows),
          reviewRequiredRows:
            Number(result.postPlan.reviewRequiredRows),
          triggerCountBefore: Number(triggersBefore.triggerCount),
          checkpointCycleBefore: text_(checkpointBefore.id),
          productionDataMutationExecuted: mutationComplete,
          backfillExecuted: mutationComplete,
          backfillAuthorityConsumed: mutationComplete,
          sourceRecordKeyMutationExecuted: false,
          durableObservationKeyMutationExecuted: false,
          collapseAuthorityGranted: false,
          winnerSelectionAuthorityGranted: false,
          automaticOfferAuthorityGranted: false,
          schedulerMutationAuthorityGranted: false,
          checkpointMutationAuthorityGranted: false,
          retryPermitted: false
        };
      } catch (error) {
        if (mutationComplete) {
          throw new Error(
            ROLLBACK_AMBIGUOUS +
              ': backfill=' +
              text_(error.message || error) +
              '; rollback=not_attempted_verified_mutation_complete'
          );
        }

        if (!mutationStarted) {
          throw error;
        }

        try {
          assert_(
            Array.isArray(prestate) && prestate.length > 0,
            'Rollback prestate is unavailable.'
          );

          restoreBackfillSpans_(sheet, columns, prestate);
          SpreadsheetApp.flush();

          var rollbackPlan = plan_();

          verifyPhysicalPrestate_(sheet, columns, spans);

          assert_(
            text_(rollbackPlan.migrationPlanSha256) ===
              text_(prePlan.migrationPlanSha256),
            'Rollback migration plan SHA did not return to prestate.'
          );

          assert_(
            text_(rollbackPlan.completePlanSha256) ===
              text_(prePlan.completePlanSha256),
            'Rollback complete plan SHA did not return to prestate.'
          );

          assert_(
            currentWindowNumber_(rollbackPlan) === requested.windowNumber,
            'Rollback blocked-backfill window did not return to prestate.'
          );

          frozenCheckpoint_();
          assertQuiescence_();
        } catch (rollbackError) {
          throw new Error(
            ROLLBACK_AMBIGUOUS +
              ': backfill=' +
              text_(error.message || error) +
              '; rollback=' +
              text_(rollbackError.message || rollbackError)
          );
        }

        throw new Error(
          'Blocked storage backfill failed and certified prestate was restored: ' +
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

function reosCountyCodeViolationBlockedStorageBackfillStatus() {
  return REOS.CountyCodeViolationBlockedStorageBackfillExecutor.status();
}

function reosCountyCodeViolationBlockedStorageBackfillPreview(options) {
  return REOS.CountyCodeViolationBlockedStorageBackfillExecutor.preview(
    options || {}
  );
}

function reosCountyCodeViolationBlockedStorageBackfillExecute(options) {
  return REOS.CountyCodeViolationBlockedStorageBackfillExecutor.execute(
    options || {}
  );
}
