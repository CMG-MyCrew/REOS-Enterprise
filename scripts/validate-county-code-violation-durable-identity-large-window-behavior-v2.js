#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');

const executorPath =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js';

const executorSource =
  fs.readFileSync(executorPath, 'utf8');

const EXPECTED_CYCLE =
  'COUNTY-20260902222607805';

const EXPECTED_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const PRE_MIGRATION_SHA = 'a'.repeat(64);
const PRE_COMPLETE_SHA = 'b'.repeat(64);
const POST_MIGRATION_SHA = 'c'.repeat(64);
const POST_COMPLETE_SHA = 'd'.repeat(64);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function digest(value) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(value), 'utf8')
    .digest('hex');
}

function makeRecord(index) {
  const rowNumber = 3588 + index;
  const violationNumber =
    'VI-2025-' + String(68024 + index).padStart(6, '0');

  const legacy =
    'pa-philadelphia|code_violations|' + String(562513 + index);

  const durable =
    'pa-philadelphia|code_violations|' +
    violationNumber.toLowerCase();

  const record = {
    rowNumber,
    distressLeadId:
      'DL-TEST-' + String(index + 1).padStart(4, '0'),
    sourceRecordId:
      String(562513 + index),
    violationNumber,
    parcelId:
      String(177170 + index),
    canonicalPropertyKey:
      'property|parcel|pa|philadelphia|' + String(177170 + index),
    storedCanonicalPropertyKey:
      'property|parcel|pa|philadelphia|' + String(177170 + index),
    sourceObservationKey: legacy,
    sourceRecordKey: legacy,
    legacyObservationKey: legacy,
    proposedDurableKey: durable,
    alreadyDurable: false,
    planBlockReasons: []
  };

  record.prestateFingerprintSha256 =
    digest({
      rowNumber: record.rowNumber,
      distressLeadId: record.distressLeadId,
      sourceRecordId: record.sourceRecordId,
      violationNumber: record.violationNumber,
      parcelId: record.parcelId,
      canonicalPropertyKey: record.canonicalPropertyKey,
      storedCanonicalPropertyKey:
        record.storedCanonicalPropertyKey,
      sourceObservationKey: record.sourceObservationKey,
      sourceRecordKey: record.sourceRecordKey,
      legacyObservationKey: record.legacyObservationKey,
      proposedDurableKey: record.proposedDurableKey
    });

  return record;
}

const targets =
  Array.from({ length: 250 }, (_, index) => makeRecord(index));

function makePlan(overrides) {
  return Object.assign(
    {
      ok: true,
      readOnly: true,
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'code_violations',
      countySchedulerTriggerCount: 0,
      migrationReadyOnlyPlanComplete: false,

      migrationRequiredRows: 3877,
      alreadyDurableRows: 149,
      planBlockedRows: 814,
      collapseRequiredRows: 141,
      reviewRequiredRows: 95,

      migrationPlanSha256: PRE_MIGRATION_SHA,
      completePlanSha256: PRE_COMPLETE_SHA,

      migrationRequiredRecords: clone(targets),
      alreadyDurableRecords: []
    },
    overrides || {}
  );
}

const initialPlan = makePlan();

const expectedPost = makePlan({
  migrationRequiredRows: 3777,
  alreadyDurableRows: 249,
  migrationPlanSha256: POST_MIGRATION_SHA,
  completePlanSha256: POST_COMPLETE_SHA,
  migrationRequiredRecords:
    targets.slice(100).map(clone),
  alreadyDurableRecords:
    targets.slice(0, 100).map(record =>
      Object.assign({}, clone(record), {
        sourceRecordKey: record.proposedDurableKey,
        sourceObservationKey: record.proposedDurableKey,
        legacyObservationKey: record.proposedDurableKey,
        alreadyDurable: true
      })
    )
});

function postPlanForCount(count) {
  assert.ok(
    Number.isInteger(count) &&
    count >= 0 &&
    count <= targets.length
  );

  if (count === 0) {
    return clone(initialPlan);
  }

  if (count === 100) {
    return clone(expectedPost);
  }

  const migrationRequiredRecords =
    targets.slice(count).map(clone);

  const alreadyDurableRecords =
    targets.slice(0, count).map(record =>
      Object.assign({}, clone(record), {
        sourceRecordKey:
          record.proposedDurableKey,
        sourceObservationKey:
          record.proposedDurableKey,
        alreadyDurable:
          true
      })
    );

  return makePlan({
    migrationRequiredRows:
      3877 - count,

    alreadyDurableRows:
      149 + count,

    migrationPlanSha256:
      crypto
        .createHash('sha256')
        .update(
          'GENERIC-POST-MIGRATION-' + count,
          'utf8'
        )
        .digest('hex'),

    completePlanSha256:
      crypto
        .createHash('sha256')
        .update(
          'GENERIC-POST-COMPLETE-' + count,
          'utf8'
        )
        .digest('hex'),

    migrationRequiredRecords,
    alreadyDurableRecords
  });
}

const validInvocation = {
  confirmRollingMigration: true,
  confirmDurableIdentity: true,
  confirmInPlace: true,
  confirmNoInsertDelete: true,
  confirmMigrationReadyOnly: true,
  migrationPlanSha256: PRE_MIGRATION_SHA,
  completePlanSha256: PRE_COMPLETE_SHA,
  batchSize: 100
};

const baseCheckpoint = {
  id: EXPECTED_CYCLE,
  nextFeedIndex: 0,
  currentFeedCursor: EXPECTED_CURSOR,
  completedFeeds: 0,
  totalFeeds: 4,
  results: []
};

function trigger(handler) {
  return {
    getHandlerFunction() {
      return handler;
    },
    getEventType() {
      return 'CLOCK';
    },
    getTriggerSource() {
      return 'CLOCK';
    },
    getUniqueId() {
      return 'TRIGGER-' + handler;
    }
  };
}

function makeHarness(options) {
  options = options || {};

  const rows = {};

  targets.forEach(record => {
    const row = Array(51).fill('');

    row[24] = record.sourceRecordKey;
    row[50] = record.sourceObservationKey;

    rows[record.rowNumber] = row;
  });

  const state = {
    rows,
    writeCalls: 0,
    flushCalls: 0,
    lockCalls: 0,
    planBuildCalls: 0,
    checkpointCalls: 0,
    triggerCalls: 0
  };

  const failWrites =
    new Set(options.failWriteCalls || []);

  function allLegacy() {
    return targets.every(record => {
      const row = state.rows[record.rowNumber];

      return (
        String(row[24]) === String(record.sourceRecordKey) &&
        String(row[50]) === String(record.sourceObservationKey)
      );
    });
  }

  function durablePrefixCount() {
    let count = 0;
    let legacySeen = false;

    for (const record of targets) {
      const row = state.rows[record.rowNumber];

      const legacy =
        String(row[24]) === String(record.sourceRecordKey) &&
        String(row[50]) === String(record.sourceObservationKey);

      const durable =
        String(row[24]) === String(record.proposedDurableKey) &&
        String(row[50]) === String(record.proposedDurableKey);

      if (durable && !legacySeen) {
        count += 1;
        continue;
      }

      if (legacy) {
        legacySeen = true;
        continue;
      }

      return -1;
    }

    return count;
  }

  const sheet = {
    getRange(row, column, rowCount, columnCount) {
      assert.ok(Number.isInteger(row));
      assert.ok(Number.isInteger(column));
      assert.ok(Number.isInteger(rowCount));
      assert.ok(Number.isInteger(columnCount));

      return {
        getValues() {
          const result = [];

          for (let r = 0; r < rowCount; r += 1) {
            const physicalRow = row + r;
            const source =
              state.rows[physicalRow] || Array(51).fill('');

            result.push(
              source.slice(column - 1, column - 1 + columnCount)
            );
          }

          return clone(result);
        },

        setValues(values) {
          state.writeCalls += 1;

          if (failWrites.has(state.writeCalls)) {
            throw new Error(
              'SIMULATED_WRITE_FAILURE_' + state.writeCalls
            );
          }

          assert.strictEqual(values.length, rowCount);

          for (let r = 0; r < rowCount; r += 1) {
            const physicalRow = row + r;

            if (!state.rows[physicalRow]) {
              state.rows[physicalRow] = Array(51).fill('');
            }

            for (let c = 0; c < columnCount; c += 1) {
              state.rows[physicalRow][column - 1 + c] =
                values[r][c];
            }
          }
        }
      };
    }
  };

  const context = {
    console,

    REOS: {
      CountyProductionScheduler: {
        getCheckpoint() {
          state.checkpointCalls += 1;

          if (
            options.checkpointSequence &&
            options.checkpointSequence.length
          ) {
            const index = Math.min(
              state.checkpointCalls - 1,
              options.checkpointSequence.length - 1
            );

            return clone(options.checkpointSequence[index]);
          }

          return clone(options.checkpoint || baseCheckpoint);
        }
      },

      Database: {
        getSheet(name) {
          assert.strictEqual(name, 'DISTRESS_LEADS');
          return sheet;
        },

        withScriptLockContext(work) {
          state.lockCalls += 1;

          if (options.lockFailure) {
            throw new Error(
              'Database ScriptLock is contended; no operation executed.'
            );
          }

          const result = work({});

          if (options.outerFinalizationFailure) {
            throw new Error(
              'SIMULATED_OUTER_LOCK_FINALIZATION_FAILURE'
            );
          }

          return result;
        }
      },

      CountyCodeViolationDurableIdentityMigrationPlan: {
        build() {
          state.planBuildCalls += 1;

          if (options.planSequence) {
            const index = Math.min(
              state.planBuildCalls - 1,
              options.planSequence.length - 1
            );

            return clone(options.planSequence[index]);
          }

          /*
           * Behavioral tests may deliberately drift only the physical
           * spreadsheet state while preserving the independently
           * certified authoritative migration-plan prestate.
           */
          if (options.forceInitialPlan) {
            return clone(initialPlan);
          }

          if (allLegacy()) {
            return clone(initialPlan);
          }

          const durableCount =
            durablePrefixCount();

          if (durableCount > 0) {
            const post =
              postPlanForCount(durableCount);

            if (options.postPlanMismatch) {
              post.migrationRequiredRows += 1;
            }

            if (options.blockedDrift) {
              post.planBlockedRows += 1;
            }

            if (options.collapseDrift) {
              post.collapseRequiredRows += 1;
            }

            if (options.reviewDrift) {
              post.reviewRequiredRows += 1;
            }

            return post;
          }

          return {
            ok: false,
            readOnly: true,
            connectorId: 'PA-PHILADELPHIA',
            dataset: 'code_violations',
            countySchedulerTriggerCount: 0,
            migrationReadyOnlyPlanComplete: false
          };
        }
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        state.triggerCalls += 1;

        if (
          options.triggerSequence &&
          options.triggerSequence.length
        ) {
          const index = Math.min(
            state.triggerCalls - 1,
            options.triggerSequence.length - 1
          );

          return options.triggerSequence[index];
        }

        return options.triggers || [];
      }
    },

    SpreadsheetApp: {
      flush() {
        state.flushCalls += 1;

        if (
          options.failFlushCall === state.flushCalls
        ) {
          throw new Error(
            'SIMULATED_FLUSH_FAILURE_' + state.flushCalls
          );
        }
      }
    },

    Utilities: {
      DigestAlgorithm: {
        SHA_256: 'SHA_256'
      },

      Charset: {
        UTF_8: 'UTF_8'
      },

      computeDigest(algorithm, value) {
        assert.strictEqual(algorithm, 'SHA_256');

        return Array.from(
          crypto
            .createHash('sha256')
            .update(String(value), 'utf8')
            .digest()
        );
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    executorSource,
    context,
    { filename: executorPath }
  );

  return {
    state,

    execute(invocation) {
      return context
        .reosCountyCodeViolationDurableIdentityRollingMigrationExecute(
          invocation
        );
    },

    status() {
      return context
        .reosCountyCodeViolationDurableIdentityRollingMigrationStatus();
    }
  };
}

function expectError(fn, pattern) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert.ok(error, 'expected operation to throw');

  assert.match(
    String(error.message || error),
    pattern
  );

  return error;
}

function expectRestoredError(fn) {
  const error = expectError(
    fn,
    /^Generic rolling migration failed and certified prestate was restored:/
  );

  assert.doesNotMatch(
    String(error.message || error),
    /GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
  );

  return error;
}

function assertLegacy(harness) {
  targets.forEach(record => {
    const row = harness.state.rows[record.rowNumber];

    assert.strictEqual(
      row[24],
      record.sourceRecordKey
    );

    assert.strictEqual(
      row[50],
      record.sourceObservationKey
    );
  });
}

function assertDurable(harness) {
  targets.forEach(record => {
    const row = harness.state.rows[record.rowNumber];

    assert.strictEqual(
      row[24],
      record.proposedDurableKey
    );

    assert.strictEqual(
      row[50],
      record.proposedDurableKey
    );
  });
}

function assertDurablePrefix(harness, count) {
  targets.forEach((record, index) => {
    const row =
      harness.state.rows[record.rowNumber];

    if (index < count) {
      assert.strictEqual(
        row[24],
        record.proposedDurableKey
      );

      assert.strictEqual(
        row[50],
        record.proposedDurableKey
      );
    } else {
      assert.strictEqual(
        row[24],
        record.sourceRecordKey
      );

      assert.strictEqual(
        row[50],
        record.sourceObservationKey
      );
    }
  });
}

let failures = 0;

function test(name, work) {
  try {
    work();
    console.log('PASS:', name);
  } catch (error) {
    failures += 1;
    console.error('FAIL:', name);
    console.error(error.stack || error);
  }
}

test(
  'missing rolling confirmation fails before mutation',
  () => {
    const harness = makeHarness();
    const invocation = clone(validInvocation);

    delete invocation.confirmRollingMigration;

    expectError(
      () => harness.execute(invocation),
      /All five rolling migration confirmations are required/
    );

    assert.strictEqual(harness.state.writeCalls, 0);
    assert.strictEqual(harness.state.lockCalls, 0);
  }
);

test(
  'wrong migration-plan SHA fails before mutation',
  () => {
    const harness = makeHarness();

    expectError(
      () =>
        harness.execute(
          Object.assign({}, validInvocation, {
            migrationPlanSha256: '0'.repeat(64)
          })
        ),
      /migrationPlanSha256 does not match/
    );

    assert.strictEqual(harness.state.writeCalls, 0);
    assert.strictEqual(harness.state.lockCalls, 0);
  }
);

test(
  'wrong complete-plan SHA fails before mutation',
  () => {
    const harness = makeHarness();

    expectError(
      () =>
        harness.execute(
          Object.assign({}, validInvocation, {
            completePlanSha256: '0'.repeat(64)
          })
        ),
      /completePlanSha256 does not match/
    );

    assert.strictEqual(harness.state.writeCalls, 0);
    assert.strictEqual(harness.state.lockCalls, 0);
  }
);

test(
  'active county scheduler trigger fails before lock/write',
  () => {
    const harness =
      makeHarness({
        triggers: [
          trigger('reosCountyProductionSchedulerRun')
        ]
      });

    expectError(
      () => harness.execute(validInvocation),
      /Unexpected installable trigger detected/
    );

    assert.strictEqual(harness.state.writeCalls, 0);
    assert.strictEqual(harness.state.lockCalls, 0);
  }
);

test(
  'checkpoint cycle drift fails before mutation',
  () => {
    const checkpoint = clone(baseCheckpoint);
    checkpoint.id = 'COUNTY-DRIFTED';

    const harness = makeHarness({ checkpoint });

    expectError(
      () => harness.execute(validInvocation),
      /Frozen county checkpoint authority changed/
    );

    assert.strictEqual(harness.state.writeCalls, 0);
    assert.strictEqual(harness.state.lockCalls, 0);
  }
);

test(
  'fail-fast ScriptLock contention performs no write',
  () => {
    const harness =
      makeHarness({
        lockFailure: true
      });

    expectError(
      () => harness.execute(validInvocation),
      /ScriptLock is contended/
    );

    assert.strictEqual(harness.state.writeCalls, 0);
  }
);

test(
  'successful N=100 performs exactly two writes and rolling transition',
  () => {
    const harness = makeHarness();

    const result =
      harness.execute(validInvocation);

    assert.strictEqual(
      result.mode,
      'CERTIFIED_GENERIC_ROLLING_DURABLE_IDENTITY_MIGRATION_EXECUTED'
    );

    assert.strictEqual(result.batchSize, 100);
    assert.strictEqual(result.physicalStartRow, 3588);
    assert.strictEqual(result.physicalEndRow, 3687);
    assert.strictEqual(result.physicalWriteRangeCount, 2);

    assert.strictEqual(harness.state.writeCalls, 2);

    assert.strictEqual(
      result.migrationRequiredRowsBefore,
      3877
    );

    assert.strictEqual(
      result.migrationRequiredRowsAfter,
      3777
    );

    assert.strictEqual(
      result.alreadyDurableRowsBefore,
      149
    );

    assert.strictEqual(
      result.alreadyDurableRowsAfter,
      249
    );

    assert.strictEqual(
      result.nextMigrationPlanSha256,
      POST_MIGRATION_SHA
    );

    assert.strictEqual(
      result.nextCompletePlanSha256,
      POST_COMPLETE_SHA
    );

    assert.strictEqual(result.planBlockedRows, 814);
    assert.strictEqual(result.collapseRequiredRows, 141);
    assert.strictEqual(result.reviewRequiredRows, 95);

    assert.strictEqual(
      result.automaticOfferAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.schedulerMutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.checkpointMutationAuthorityGranted,
      false
    );

    assert.strictEqual(result.retryPermitted, false);

    assertDurablePrefix(harness, 100);
  }
);

test(
  'first physical write failure restores certified prestate',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [1]
      });

    expectRestoredError(
      () => harness.execute(validInvocation)
    );

    assertLegacy(harness);
  }
);

test(
  'second physical write failure restores both identity columns',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [2]
      });

    expectRestoredError(
      () => harness.execute(validInvocation)
    );

    assertLegacy(harness);
  }
);

test(
  'post-plan mismatch rolls back exact certified prestate',
  () => {
    const harness =
      makeHarness({
        postPlanMismatch: true
      });

    expectRestoredError(
      () => harness.execute(validInvocation)
    );

    assertLegacy(harness);
  }
);

test(
  'post-write flush failure rolls back exact certified prestate',
  () => {
    const harness =
      makeHarness({
        failFlushCall: 1
      });

    expectRestoredError(
      () => harness.execute(validInvocation)
    );

    assertLegacy(harness);
  }
);

test(
  'rollback failure produces explicit ambiguous no-retry result',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [2, 3]
      });

    expectError(
      () => harness.execute(validInvocation),
      /GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );
  }
);

test(
  'outer lock finalization failure is explicit ambiguous no-retry',
  () => {
    const harness =
      makeHarness({
        outerFinalizationFailure: true
      });

    expectError(
      () => harness.execute(validInvocation),
      /GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      2,
      'verified mutation must not be rolled back after outer lock finalization failure'
    );

    assertDurablePrefix(harness, 100);
  }
);


for (const n of [101, 250]) {
  test(
    'batchSize=' + n +
      ' requires explicit large-window authority before plan reads or writes',
    () => {
      const harness =
        makeHarness();

      expectError(
        () =>
          harness.execute(
            Object.assign(
              {},
              validInvocation,
              { batchSize: n }
            )
          ),
        /confirmLargeWindowMigration=true is required above the previously certified 100-row boundary/
      );

      assert.strictEqual(
        harness.state.planBuildCalls,
        1
      );

      assert.strictEqual(
        harness.state.lockCalls,
        0
      );

      assert.strictEqual(
        harness.state.writeCalls,
        0
      );
    }
  );
}


test(
  'batchSize=251 fails at the hard ceiling before authority reads or writes',
  () => {
    const harness =
      makeHarness();

    expectError(
      () =>
        harness.execute(
          Object.assign(
            {},
            validInvocation,
            {
              batchSize: 251,
              confirmLargeWindowMigration: true
            }
          )
        ),
      /batchSize exceeds certified maximum of 250/
    );

    assert.strictEqual(
      harness.state.planBuildCalls,
      0
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


for (const n of [1, 10, 11, 100, 101, 250]) {
  test(
    'successful bounded batchSize=' + n +
      ' performs exactly two physical writes',
    () => {
      const harness =
        makeHarness();

      const result =
        harness.execute(
          Object.assign(
            {},
            validInvocation,
            Object.assign(
              { batchSize: n },
              n > 100
                ? { confirmLargeWindowMigration: true }
                : {}
            )
          )
        );

      assert.strictEqual(
        result.batchSize,
        n
      );

      assert.strictEqual(
        result.physicalStartRow,
        3588
      );

      assert.strictEqual(
        result.physicalEndRow,
        3588 + n - 1
      );

      assert.strictEqual(
        result.physicalWriteRangeCount,
        2
      );

      assert.strictEqual(
        harness.state.writeCalls,
        2
      );

      assert.strictEqual(
        result.migrationRequiredRowsBefore,
        3877
      );

      assert.strictEqual(
        result.migrationRequiredRowsAfter,
        3877 - n
      );

      assert.strictEqual(
        result.alreadyDurableRowsBefore,
        149
      );

      assert.strictEqual(
        result.alreadyDurableRowsAfter,
        149 + n
      );

      assert.strictEqual(
        result.planBlockedRows,
        814
      );

      assert.strictEqual(
        result.collapseRequiredRows,
        141
      );

      assert.strictEqual(
        result.reviewRequiredRows,
        95
      );

      assert.strictEqual(
        result.retryPermitted,
        false
      );

      assertDurablePrefix(
        harness,
        n
      );
    }
  );
}


test(
  'physical prestate fingerprint drift fails before mutation',
  () => {
    const harness =
      makeHarness({
        forceInitialPlan: true
      });

    harness
      .state
      .rows[3588][24] =
        'pa-philadelphia|code_violations|DRIFT';

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /Physical prestate fingerprint changed at row 3588/
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'non-contiguous deterministic candidates fail closed with zero writes',
  () => {
    const nonContiguous =
      clone(initialPlan);

    nonContiguous.migrationRequiredRecords =
      [
        clone(targets[0]),
        clone(targets[2]),
        clone(targets[3]),
        clone(targets[4]),
        clone(targets[5]),
        clone(targets[6]),
        clone(targets[7]),
        clone(targets[8]),
        clone(targets[9])
      ];

    const harness =
      makeHarness({
        planSequence: [
          nonContiguous,
          nonContiguous
        ]
      });

    expectError(
      () =>
        harness.execute(
          Object.assign(
            {},
            validInvocation,
            { batchSize: 2 }
          )
        ),
      /Selected migration batch must occupy one contiguous physical span/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'checkpoint drift under lock fails before physical mutation',
  () => {
    const drift =
      clone(baseCheckpoint);

    drift.id =
      'COUNTY-DRIFTED-UNDER-LOCK';

    const harness =
      makeHarness({
        checkpointSequence: [
          baseCheckpoint,
          drift
        ]
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /Frozen county checkpoint authority changed/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'scheduler trigger drift under lock fails before physical mutation',
  () => {
    const harness =
      makeHarness({
        triggerSequence: [
          [],
          [
            trigger(
              'reosCountyProductionSchedulerRun'
            )
          ]
        ]
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /Unexpected installable trigger detected/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'blocked population drift after write rolls back certified prestate',
  () => {
    const harness =
      makeHarness({
        blockedDrift:
          true
      });

    expectRestoredError(
      () =>
        harness.execute(
          validInvocation
        )
    );

    assertLegacy(harness);
  }
);


test(
  'collapse population drift after write rolls back certified prestate',
  () => {
    const harness =
      makeHarness({
        collapseDrift:
          true
      });

    expectRestoredError(
      () =>
        harness.execute(
          validInvocation
        )
    );

    assertLegacy(harness);
  }
);


test(
  'review population drift after write rolls back certified prestate',
  () => {
    const harness =
      makeHarness({
        reviewDrift:
          true
      });

    expectRestoredError(
      () =>
        harness.execute(
          validInvocation
        )
    );

    assertLegacy(harness);
  }
);


test(
  'single allowed production heartbeat remains compatible with migration quiescence',
  () => {
    const harness =
      makeHarness({
        triggers: [
          trigger(
            'reosProductionOperationsHeartbeat'
          )
        ]
      });

    const result =
      harness.execute(
        validInvocation
      );

    assert.strictEqual(
      result.triggerCountBefore,
      1
    );

    assert.strictEqual(
      harness.state.writeCalls,
      2
    );

    assertDurablePrefix(harness, 100);
  }
);


test(
  'multiple heartbeat triggers fail closed before lock/write',
  () => {
    const harness =
      makeHarness({
        triggers: [
          trigger(
            'reosProductionOperationsHeartbeat'
          ),
          trigger(
            'reosProductionOperationsHeartbeat'
          )
        ]
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /at most one production heartbeat trigger/
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


if (failures) {
  console.error();
  console.error(
    failures +
    ' generic rolling executor core behavioral validation(s) FAILED.'
  );

  process.exit(1);
}

console.log();
console.log(
  'Gate 2B 250-window v2 behavioral validation PASSED.'
);
