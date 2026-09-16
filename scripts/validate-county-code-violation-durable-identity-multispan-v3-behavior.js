#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');

const executorPath =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js';

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

function makeRecord(index, rowNumber) {
  const violationNumber =
    'VI-2026-' + String(500000 + index).padStart(6, '0');

  const legacy =
    'pa-philadelphia|code_violations|legacy-' +
    String(index + 1).padStart(6, '0');

  const durable =
    'pa-philadelphia|code_violations|' +
    violationNumber.toLowerCase();

  const record = {
    rowNumber,
    distressLeadId:
      'DL-V3-' + String(index + 1).padStart(4, '0'),
    sourceRecordId:
      String(800000 + index),
    violationNumber,
    parcelId:
      String(900000 + index),
    canonicalPropertyKey:
      'property|parcel|pa|philadelphia|' +
      String(900000 + index),
    storedCanonicalPropertyKey:
      'property|parcel|pa|philadelphia|' +
      String(900000 + index),
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

function contiguousRows(count, start) {
  return Array.from(
    { length: count },
    (_, index) => start + index
  );
}

function isolatedRows(count, start) {
  return Array.from(
    { length: count },
    (_, index) => start + index * 2
  );
}

const MULTI_ROWS = [
  100,
  101,
  104,
  106,
  107,
  108,
  112,
  115
];

function makeTargets(rows) {
  return rows.map(
    (row, index) => makeRecord(index, row)
  );
}

function makePlan(targets, overrides) {
  return Object.assign(
    {
      ok: true,
      readOnly: true,
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'code_violations',
      countySchedulerTriggerCount: 0,
      migrationReadyOnlyPlanComplete: false,

      migrationRequiredRows: 1368,
      alreadyDurableRows: 2658,
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

function makePostPlan(targets, overrides) {
  return makePlan(
    targets,
    Object.assign(
      {
        migrationRequiredRows:
          1368 - targets.length,
        alreadyDurableRows:
          2658 + targets.length,
        migrationPlanSha256:
          POST_MIGRATION_SHA,
        completePlanSha256:
          POST_COMPLETE_SHA,
        migrationRequiredRecords: [],
        alreadyDurableRecords:
          targets.map(record =>
            Object.assign({}, clone(record), {
              sourceRecordKey:
                record.proposedDurableKey,
              sourceObservationKey:
                record.proposedDurableKey,
              legacyObservationKey:
                record.proposedDurableKey,
              alreadyDurable: true
            })
          )
      },
      overrides || {}
    )
  );
}

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

function makeInvocation(extra) {
  return Object.assign(
    {
      confirmRollingMigration: true,
      confirmDurableIdentity: true,
      confirmInPlace: true,
      confirmNoInsertDelete: true,
      confirmMigrationReadyOnly: true,
      confirmMultiSpanMigration: true,
      migrationPlanSha256: PRE_MIGRATION_SHA,
      completePlanSha256: PRE_COMPLETE_SHA
    },
    extra || {}
  );
}

const harnessStates = [];

function makeHarness(options) {
  options = options || {};

  const targets =
    clone(options.targets || makeTargets(MULTI_ROWS));

  const initialPlan =
    makePlan(targets, options.initialPlanOverrides);

  const expectedPost =
    makePostPlan(targets, options.postPlanOverrides);

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
    triggerCalls: 0,
    lockHeld: false,
    leaseAllowed: false,
    leaseCalls: 0,
    events: []
  };
  harnessStates.push(state);

  const failWrites =
    new Set(options.failWriteCalls || []);

  function allLegacy() {
    return targets.every(record => {
      const row = state.rows[record.rowNumber];

      return (
        String(row[24]) === String(record.sourceRecordKey) &&
        String(row[50]) ===
          String(record.sourceObservationKey)
      );
    });
  }

  function allDurable() {
    return targets.every(record => {
      const row = state.rows[record.rowNumber];

      return (
        String(row[24]) ===
          String(record.proposedDurableKey) &&
        String(row[50]) ===
          String(record.proposedDurableKey)
      );
    });
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
              state.rows[physicalRow] ||
              Array(51).fill('');

            result.push(
              source.slice(
                column - 1,
                column - 1 + columnCount
              )
            );
          }

          return clone(result);
        },

        setValues(values) {
          assert.strictEqual(state.lockHeld, true, 'every forward and rollback write must hold the lock');
          assert.strictEqual(state.leaseAllowed, true, 'the lease must allow every write');
          assert.strictEqual(columnCount, 1, 'only narrow identity-column writes are permitted');
          assert.ok(column === 25 || column === 51, 'only identity columns may be written');
          for (let offset = 0; offset < rowCount; offset += 1) {
            assert.ok(Object.prototype.hasOwnProperty.call(state.rows, row + offset),
              'no unselected or new physical row may be written');
          }
          state.events.push('write:' + column);
          state.writeCalls += 1;

          if (failWrites.has(state.writeCalls)) {
            throw new Error(
              'SIMULATED_WRITE_FAILURE_' +
              state.writeCalls
            );
          }

          assert.strictEqual(
            values.length,
            rowCount
          );

          for (let r = 0; r < rowCount; r += 1) {
            const physicalRow = row + r;

            if (!state.rows[physicalRow]) {
              state.rows[physicalRow] =
                Array(51).fill('');
            }

            for (
              let c = 0;
              c < columnCount;
              c += 1
            ) {
              state.rows[physicalRow][
                column - 1 + c
              ] = values[r][c];
            }
          }
        }
      };
    }
  };

  const context = {
    console,

    REOS: {
      CountyMutationExclusionLease: {
        assertWriterAllowed(request) {
          state.leaseCalls += 1;
          assert.strictEqual(state.lockHeld, true, 'lease assertion must run under lock');
          assert.strictEqual(state.leaseCalls, 1, 'exactly one lease assertion per transaction');
          assert.deepStrictEqual(Object.keys(request), ['writerId']);
          assert.strictEqual(request.writerId, 'CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN');
          state.events.push('lease');
          if (options.leaseError) throw options.leaseError;
          state.leaseAllowed = true;
          return {ok: true, allowed: true, writerId: request.writerId};
        }
      },

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

            return clone(
              options.checkpointSequence[index]
            );
          }

          return clone(
            options.checkpoint || baseCheckpoint
          );
        }
      },

      Database: {
        getSheet(name) {
          assert.strictEqual(
            name,
            'DISTRESS_LEADS'
          );

          return sheet;
        },

        withScriptLockContext(work) {
          state.lockCalls += 1;

          if (options.lockFailure) {
            throw new Error(
              'Database ScriptLock is contended; no operation executed.'
            );
          }

          assert.strictEqual(state.lockHeld, false, 'nested locks are prohibited');
          state.lockHeld = true;
          state.events.push('lock');
          try {
            if (options.onLockAcquired) options.onLockAcquired();
            const result = work({});
            if (options.outerFinalizationFailure) {
              throw new Error('SIMULATED_OUTER_LOCK_FINALIZATION_FAILURE');
            }
            return result;
          } finally {
            state.leaseAllowed = false;
            state.lockHeld = false;
            state.events.push('release');
          }
        }
      },

      CountyCodeViolationDurableIdentityMigrationPlan: {
        build() {
          state.planBuildCalls += 1;

          if (
            options.planSequence &&
            options.planSequence.length
          ) {
            const index = Math.min(
              state.planBuildCalls - 1,
              options.planSequence.length - 1
            );

            return clone(
              options.planSequence[index]
            );
          }

          if (options.forceInitialPlan) {
            return clone(initialPlan);
          }

          if (allLegacy()) {
            return clone(initialPlan);
          }

          if (allDurable()) {
            const post = clone(expectedPost);

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
        assert.strictEqual(state.lockHeld, true, 'forward and rollback flushes must hold the lock');
        state.flushCalls += 1;

        if (
          options.failFlushCall ===
          state.flushCalls
        ) {
          throw new Error(
            'SIMULATED_FLUSH_FAILURE_' +
            state.flushCalls
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
        assert.strictEqual(
          algorithm,
          'SHA_256'
        );

        return Array.from(
          crypto
            .createHash('sha256')
            .update(String(value), 'utf8')
            .digest()
        );
      }
    }
  };

  if (options.missingLeaseModule) delete context.REOS.CountyMutationExclusionLease;
  if (options.missingLeaseGuard) delete context.REOS.CountyMutationExclusionLease.assertWriterAllowed;

  vm.createContext(context);

  vm.runInContext(
    executorSource,
    context,
    { filename: executorPath }
  );

  return {
    state,
    targets,
    initialPlan,
    expectedPost,

    execute(invocation) {
      return context
        .reosCountyCodeViolationDurableIdentityMultiSpanMigrationExecute(
          invocation
        );
    },

    preview(options) {
      return context
        .reosCountyCodeViolationDurableIdentityMultiSpanMigrationPreview(
          options || {}
        );
    },

    status() {
      return context
        .reosCountyCodeViolationDurableIdentityMultiSpanMigrationStatus();
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
    /^Generic multi-span migration failed and certified prestate was restored:/
  );

  assert.doesNotMatch(
    String(error.message || error),
    /GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
  );

  return error;
}

function assertLegacy(harness) {
  harness.targets.forEach(record => {
    const row =
      harness.state.rows[record.rowNumber];

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
  harness.targets.forEach(record => {
    const row =
      harness.state.rows[record.rowNumber];

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

let failures = 0;

let writer8TestsRun = 0;

function test(name, work) {
  writer8TestsRun += 1;
  const firstHarness = harnessStates.length;
  try {
    work();
    harnessStates.slice(firstHarness).forEach(state => {
      assert.strictEqual(state.lockHeld, false, 'lock must be released after every outcome');
      assert.strictEqual(state.leaseAllowed, false, 'lease grant must not outlive the lock');
      if (state.writeCalls > 0) {
        assert.strictEqual(state.lockCalls, 1, 'forward and rollback share exactly one lock');
        assert.strictEqual(state.leaseCalls, 1, 'all writes share one lease assertion');
        assert.deepStrictEqual(state.events.slice(0, 2), ['lock', 'lease']);
        assert.strictEqual(state.events[state.events.length - 1], 'release');
        assert.strictEqual(state.events.filter(event => event === 'release').length, 1);
      }
    });
    console.log('PASS:', name);
  } catch (error) {
    failures += 1;
    console.error('FAIL:', name);
    console.error(error.stack || error);
  }
}

test(
  'preview exposes deterministic five-span geometry with zero authority',
  () => {
    const harness = makeHarness();

    const preview =
      harness.preview({ batchSize: 8 });

    assert.strictEqual(
      preview.returnedCandidateCount,
      8
    );

    assert.strictEqual(
      preview.physicalSpanCount,
      5
    );

    assert.strictEqual(
      preview.physicalWriteRangeCount,
      10
    );

    assert.deepStrictEqual(
      JSON.parse(JSON.stringify(preview.physicalSpans)),
      [
        { firstRow: 100, lastRow: 101, count: 2 },
        { firstRow: 104, lastRow: 104, count: 1 },
        { firstRow: 106, lastRow: 108, count: 3 },
        { firstRow: 112, lastRow: 112, count: 1 },
        { firstRow: 115, lastRow: 115, count: 1 }
      ]
    );

    assert.strictEqual(
      preview.mutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      preview.schedulerMutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      preview.checkpointMutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      preview.offerAuthorityGranted,
      false
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);

test(
  'multi-span execute requires explicit multi-span confirmation before lock/write',
  () => {
    const harness = makeHarness();

    const invocation =
      makeInvocation({ batchSize: 8 });

    delete invocation.confirmMultiSpanMigration;

    expectError(
      () => harness.execute(invocation),
      /confirmMultiSpanMigration=true/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );
  }
);

test(
  'successful five-span migration performs ten forward physical writes',
  () => {
    const harness = makeHarness();

    const result =
      harness.execute(
        makeInvocation({ batchSize: 8 })
      );

    assert.strictEqual(
      result.mode,
      'CERTIFIED_GENERIC_MULTI_SPAN_DURABLE_IDENTITY_MIGRATION_EXECUTED'
    );

    assert.strictEqual(result.batchSize, 8);
    assert.strictEqual(
      result.physicalSpanCount,
      5
    );
    assert.strictEqual(
      result.physicalWriteRangeCount,
      10
    );

    assert.strictEqual(
      harness.state.writeCalls,
      10
    );

    assert.strictEqual(
      result.migrationRequiredRowsBefore,
      1368
    );

    assert.strictEqual(
      result.migrationRequiredRowsAfter,
      1360
    );

    assert.strictEqual(
      result.alreadyDurableRowsBefore,
      2658
    );

    assert.strictEqual(
      result.alreadyDurableRowsAfter,
      2666
    );

    assert.strictEqual(
      result.nextMigrationPlanSha256,
      POST_MIGRATION_SHA
    );

    assert.strictEqual(
      result.nextCompletePlanSha256,
      POST_COMPLETE_SHA
    );

    assert.strictEqual(
      result.retryPermitted,
      false
    );

    assertDurable(harness);
  }
);

test(
  'mid-forward multi-span write failure restores every selected span',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [3]
      });

    expectRestoredError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
        )
    );

    assertLegacy(harness);
  }
);

test(
  'rollback write failure produces explicit ambiguous no-retry result',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [3, 4]
      });

    expectError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
        ),
      /GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );
  }
);

test(
  'outer lock finalization failure after certified mutation is ambiguous and does not compensate',
  () => {
    const harness =
      makeHarness({
        outerFinalizationFailure: true
      });

    expectError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
        ),
      /GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );

    assertDurable(harness);

    assert.strictEqual(
      harness.state.writeCalls,
      10
    );
  }
);

test(
  'wrong migration-plan SHA fails before lock/write',
  () => {
    const harness = makeHarness();

    expectError(
      () =>
        harness.execute(
          makeInvocation({
            batchSize: 8,
            migrationPlanSha256:
              '0'.repeat(64)
          })
        ),
      /migrationPlanSha256 does not match/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );
  }
);

test(
  'batchSize=101 requires explicit large-window authority',
  () => {
    const targets =
      makeTargets(
        contiguousRows(101, 500)
      );

    const harness =
      makeHarness({ targets });

    const invocation =
      makeInvocation({
        batchSize: 101
      });

    invocation.confirmMultiSpanMigration = false;
    delete invocation.confirmLargeWindowMigration;

    expectError(
      () => harness.execute(invocation),
      /confirmLargeWindowMigration=true/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );
  }
);

test(
  'batchSize=101 succeeds as one span with large-window confirmation',
  () => {
    const targets =
      makeTargets(
        contiguousRows(101, 700)
      );

    const harness =
      makeHarness({ targets });

    const result =
      harness.execute(
        makeInvocation({
          batchSize: 101,
          confirmLargeWindowMigration: true,
          confirmMultiSpanMigration: false
        })
      );

    assert.strictEqual(
      result.physicalSpanCount,
      1
    );

    assert.strictEqual(
      result.physicalWriteRangeCount,
      2
    );

    assert.strictEqual(
      harness.state.writeCalls,
      2
    );

    assertDurable(harness);
  }
);

test(
  'exactly 70 isolated spans are accepted with 140 forward writes',
  () => {
    const targets =
      makeTargets(
        isolatedRows(70, 1000)
      );

    const harness =
      makeHarness({ targets });

    const result =
      harness.execute(
        makeInvocation({
          batchSize: 70
        })
      );

    assert.strictEqual(
      result.physicalSpanCount,
      70
    );

    assert.strictEqual(
      result.physicalWriteRangeCount,
      140
    );

    assert.strictEqual(
      harness.state.writeCalls,
      140
    );

    assertDurable(harness);
  }
);

test(
  '71 isolated spans fail closed before checkpoint/lock/write',
  () => {
    const targets =
      makeTargets(
        isolatedRows(71, 2000)
      );

    const harness =
      makeHarness({ targets });

    expectError(
      () =>
        harness.execute(
          makeInvocation({
            batchSize: 71
          })
        ),
      /exceeds certified physical span maximum of 70/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );

    assert.strictEqual(
      harness.state.checkpointCalls,
      0
    );
  }
);

test(
  'batchSize=251 fails at hard ceiling before authority reads',
  () => {
    const harness = makeHarness();

    expectError(
      () =>
        harness.execute(
          makeInvocation({
            batchSize: 251
          })
        ),
      /batchSize exceeds certified maximum of 250/
    );

    assert.strictEqual(
      harness.state.planBuildCalls,
      0
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);

test(
  'under-lock deterministic selection drift fails with zero writes',
  () => {
    const harness = makeHarness();

    const drifted =
      clone(harness.initialPlan);

    drifted.migrationRequiredRecords[0].distressLeadId =
      'DL-DRIFTED';

    const harness2 =
      makeHarness({
        targets: harness.targets,
        planSequence: [
          harness.initialPlan,
          drifted
        ]
      });

    expectError(
      () =>
        harness2.execute(
          makeInvocation({ batchSize: 8 })
        ),
      /Deterministic selection changed under lock/
    );

    assert.strictEqual(
      harness2.state.writeCalls,
      0
    );
  }
);

test(
  'under-lock checkpoint drift fails before physical mutation',
  () => {
    const drifted =
      clone(baseCheckpoint);

    drifted.currentFeedCursor =
      'DRIFTED-CURSOR';

    const harness =
      makeHarness({
        checkpointSequence: [
          baseCheckpoint,
          drifted
        ]
      });

    expectError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
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
  'under-lock scheduler drift fails before physical mutation',
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
          makeInvocation({ batchSize: 8 })
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
  'physical prestate fingerprint drift fails before lock/write',
  () => {
    const harness =
      makeHarness({
        forceInitialPlan: true
      });

    harness.state.rows[
      harness.targets[0].rowNumber
    ][24] = 'DRIFTED';

    expectError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
        ),
      /Physical prestate fingerprint changed/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );
  }
);

test(
  'blocked population drift after write rolls back all spans',
  () => {
    const harness =
      makeHarness({
        blockedDrift: true
      });

    expectRestoredError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
        )
    );

    assertLegacy(harness);
  }
);

test(
  'collapse population drift after write rolls back all spans',
  () => {
    const harness =
      makeHarness({
        collapseDrift: true
      });

    expectRestoredError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
        )
    );

    assertLegacy(harness);
  }
);

test(
  'review population drift after write rolls back all spans',
  () => {
    const harness =
      makeHarness({
        reviewDrift: true
      });

    expectRestoredError(
      () =>
        harness.execute(
          makeInvocation({ batchSize: 8 })
        )
    );

    assertLegacy(harness);
  }
);

test(
  'single production heartbeat remains compatible',
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
        makeInvocation({ batchSize: 8 })
      );

    assert.strictEqual(
      result.triggerCountBefore,
      1
    );

    assertDurable(harness);
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
          makeInvocation({ batchSize: 8 })
        ),
      /at most one production heartbeat trigger/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );

    assert.strictEqual(
      harness.state.lockCalls,
      0
    );
  }
);

test(
  'status publishes certified v3 ceilings with zero mutation authority',
  () => {
    const harness = makeHarness();

    const status = harness.status();

    assert.strictEqual(
      status.batchDefault,
      100
    );

    assert.strictEqual(
      status.batchMax,
      250
    );

    assert.strictEqual(
      status.physicalSpanMax,
      70
    );

    assert.strictEqual(
      status.forwardWriteRangeMax,
      140
    );

    assert.strictEqual(
      status.mutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);

// WRITER_8_LEASE_BOUNDARY_BEHAVIOR_V1
function assertNoWriterMutation(harness, beforeRows) {
  assert.strictEqual(harness.state.writeCalls, 0, 'denial prevents forward and rollback writes');
  assert.strictEqual(harness.state.flushCalls, 0, 'executor does not flush a denied transaction');
  assert.deepStrictEqual(harness.state.rows, beforeRows, 'every physical cell is preserved');
}

['status', 'preview'].forEach(method => {
  test('Writer 8 ' + method + ' remains lease-free and read-only', () => {
    const harness = makeHarness({missingLeaseModule: true});
    const beforeRows = clone(harness.state.rows);
    const result = harness[method]({batchSize: 8});
    assert.strictEqual(result.mutationAuthorityGranted, false);
    assert.strictEqual(harness.state.lockCalls, 0);
    assert.strictEqual(harness.state.leaseCalls, 0);
    assertNoWriterMutation(harness, beforeRows);
  });
});

['missingLeaseModule', 'missingLeaseGuard'].forEach(option => {
  test('Writer 8 ' + option + ' fails closed under lock', () => {
    const harness = makeHarness({[option]: true});
    const beforeRows = clone(harness.state.rows);
    const error = expectError(() => harness.execute(makeInvocation({batchSize: 8})), /lease assertion is required/);
    assert.strictEqual(error.message, 'County mutation-exclusion lease assertion is required.');
    assert.strictEqual(harness.state.lockCalls, 1);
    assert.strictEqual(harness.state.leaseCalls, 0);
    assertNoWriterMutation(harness, beforeRows);
  });
});

['active lease', 'malformed lease'].forEach(scenario => {
  test('Writer 8 ' + scenario + ' rejection propagates without mutation', () => {
    const rejection = new Error('TEST_WRITER_8_LEASE_REJECTION: ' + scenario);
    const harness = makeHarness({leaseError: rejection});
    const beforeRows = clone(harness.state.rows);
    const error = expectError(() => harness.execute(makeInvocation({batchSize: 8})), /TEST_WRITER_8_LEASE_REJECTION/);
    assert.strictEqual(error, rejection, 'the exact rejection must propagate unchanged');
    assert.strictEqual(harness.state.lockCalls, 1);
    assert.strictEqual(harness.state.leaseCalls, 1);
    assertNoWriterMutation(harness, beforeRows);
  });
});

test('Writer 8 sees lease denial introduced when the lock is acquired', () => {
  const rejection = new Error('TEST_WRITER_8_LATE_LEASE_REJECTION');
  const options = {onLockAcquired() { options.leaseError = rejection; }};
  const harness = makeHarness(options);
  const beforeRows = clone(harness.state.rows);
  assert.strictEqual(options.leaseError, undefined);
  const error = expectError(() => harness.execute(makeInvocation({batchSize: 8})), /TEST_WRITER_8_LATE_LEASE_REJECTION/);
  assert.strictEqual(error, rejection);
  assert.strictEqual(harness.state.leaseCalls, 1);
  assertNoWriterMutation(harness, beforeRows);
});

test('Writer 8 lock contention performs no lease assertion', () => {
  const harness = makeHarness({lockFailure: true});
  const beforeRows = clone(harness.state.rows);
  expectError(() => harness.execute(makeInvocation({batchSize: 8})), /ScriptLock is contended/);
  assert.strictEqual(harness.state.leaseCalls, 0);
  assertNoWriterMutation(harness, beforeRows);
});

test('Writer 8 first-write failure restores all five spans under the same lock', () => {
  const harness = makeHarness({failWriteCalls: [1]});
  const beforeRows = clone(harness.state.rows);
  expectRestoredError(() => harness.execute(makeInvocation({batchSize: 8})));
  assert.strictEqual(harness.state.writeCalls, 11, 'one failed forward attempt plus ten rollback ranges');
  assert.strictEqual(harness.state.flushCalls, 1, 'one rollback flush');
  assert.deepStrictEqual(harness.state.rows, beforeRows);
});

test('Writer 8 forward flush failure restores all spans under the same lock', () => {
  const harness = makeHarness({failFlushCall: 1});
  const beforeRows = clone(harness.state.rows);
  expectRestoredError(() => harness.execute(makeInvocation({batchSize: 8})));
  assert.strictEqual(harness.state.writeCalls, 20, 'ten forward and ten rollback ranges');
  assert.strictEqual(harness.state.flushCalls, 2);
  assert.deepStrictEqual(harness.state.rows, beforeRows);
});

test('Writer 8 rollback flush failure remains ambiguous with no second compensation', () => {
  const harness = makeHarness({postPlanMismatch: true, failFlushCall: 2});
  const error = expectError(() => harness.execute(makeInvocation({batchSize: 8})),
    /GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/);
  assert.match(error.message, /SIMULATED_FLUSH_FAILURE_2/);
  assert.strictEqual(harness.state.writeCalls, 20);
  assert.strictEqual(harness.state.flushCalls, 2);
});

if (failures) {
  console.error();
  console.error(
    'STOP: Gate 2B v3 multi-span behavioral validation failed:',
    failures,
    'test(s).'
  );
  process.exit(1);
}

console.log();
console.log(
  'Gate 2B v3 multi-span behavioral validation PASSED.'
);

console.log('writer8_multispan_behavior_cases=' + writer8TestsRun);
console.log('WRITER_8_LEASE_BOUNDARY_BEHAVIOR_PASSED=true');
