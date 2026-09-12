#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');

const SRC =
  'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js';

const source = fs.readFileSync(SRC, 'utf8');

function fail(message) {
  console.error('STOP: ' + message);
  process.exit(1);
}

function pass(message) {
  console.log('PASS: ' + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function bytes(hex) {
  return Array.from(Buffer.from(hex, 'hex'));
}

const WINDOW1_CANDIDATE_SHA =
  'abda6858ff296f2ddce454c2c02e3b05862c8452576a6e2b1a0e127cdb1e8fee';
const WINDOW1_SPAN_SHA =
  '20685d9cc162624d099494f030e465a688d223c9c5985bff589f828a3a3cef23';

function firstWindowRows() {
  const rows = [];
  let next = 100;

  for (let group = 0; group < 60; group += 1) {
    const size = group < 10 ? 5 : 4;

    for (let i = 0; i < size; i += 1) {
      rows.push(next + i);
    }

    next += size + 1;
  }

  assert(rows.length === 250, 'synthetic first window must contain 250 rows.');
  return rows;
}

const selectedRows = firstWindowRows();
const blocked = [];

for (let index = 0; index < 814; index += 1) {
  const n = index + 1;
  const suffix = String(n).padStart(4, '0');
  const rowNumber = index < 250
    ? selectedRows[index]
    : 5000 + index;
  const legacy =
    'pa-philadelphia|code_violations|' + String(700000 + n);

  blocked.push({
    rowNumber,
    distressLeadId: 'TEST-' + suffix,
    sourceRecordId: String(700000 + n),
    violationNumber: 'VI-TEST-' + suffix,
    parcelId: 'P-' + suffix,
    canonicalPropertyKey: 'property|parcel|pa|philadelphia|' + suffix,
    storedCanonicalPropertyKey: '',
    sourceObservationKey: '',
    sourceRecordKey: legacy,
    legacyObservationKey: legacy,
    proposedDurableKey:
      'pa-philadelphia|code_violations|vi-test-' + suffix,
    alreadyDurable: false,
    planBlockReasons: [
      'stored_canonical_identity_missing',
      'stored_observation_key_incomplete'
    ],
    prestateFingerprintSha256: 'fingerprint-' + suffix
  });
}

const plan = {
  connectorId: 'PA-PHILADELPHIA',
  dataset: 'code_violations',
  countySchedulerTriggerCount: 0,
  alreadyDurableRows: 4026,
  collapseRequiredRows: 141,
  reviewRequiredRows: 95,
  migrationRequiredRows: 0,
  planBlockedRows: 814,
  planBlockedRecords: blocked,
  migrationRequiredRecords: [],
  alreadyDurableRecords: [],
  migrationPlanSha256:
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  completePlanSha256:
    'synthetic-complete-plan'
};

const headers = Array(51).fill('');
headers[24] = 'Source Record Key';
headers[30] = 'Canonical Property Key';
headers[50] = 'Source Observation Key';

let hashCalls = 0;
let mutationCalls = 0;

const context = {
  console,
  REOS: {
    Database: {
      getHeaders() {
        return headers.slice();
      },
      withScriptLockContext() {
        mutationCalls += 1;
        throw new Error('behavior harness must never enter mutation lock.');
      },
      getSheet() {
        mutationCalls += 1;
        throw new Error('behavior harness must never request mutation sheet.');
      }
    },
    CountyCodeViolationDurableIdentityMigrationPlan: {
      build() {
        return JSON.parse(JSON.stringify(plan));
      }
    }
  },
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    Charset: { UTF_8: 'UTF_8' },
    computeDigest(_algorithm, value) {
      hashCalls += 1;
      const text = String(value);

      if (text.startsWith('[{"count":')) {
        return bytes(WINDOW1_SPAN_SHA);
      }

      return bytes(WINDOW1_CANDIDATE_SHA);
    }
  },
  ScriptApp: {
    getProjectTriggers() {
      return [];
    }
  },
  SpreadsheetApp: {
    flush() {
      mutationCalls += 1;
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context, {
  filename: SRC
});

assert(
  typeof context.reosCountyCodeViolationBlockedStorageBackfillStatus === 'function',
  'status RPC must load.'
);
assert(
  typeof context.reosCountyCodeViolationBlockedStorageBackfillPreview === 'function',
  'preview RPC must load.'
);
assert(
  typeof context.reosCountyCodeViolationBlockedStorageBackfillExecute === 'function',
  'execute RPC must load.'
);
pass('all three backfill RPCs load.');

const status =
  context.reosCountyCodeViolationBlockedStorageBackfillStatus();

assert(status.currentWindowNumber === 1, 'status must identify window 1.');
assert(status.backfillComplete === false, 'status must not claim completion.');
assert(status.planBlockedRows === 814, 'status blocked count must be 814.');
assert(status.migrationRequiredRows === 0, 'status migration count must be 0.');
assert(status.mutationAuthorityGranted === false, 'status mutation authority must be false.');
assert(status.schedulerMutationAuthorityGranted === false, 'status scheduler authority must be false.');
pass('window-1 read-only status is fail-closed.');

const preview =
  context.reosCountyCodeViolationBlockedStorageBackfillPreview({
    windowNumber: 1
  });

assert(preview.windowNumber === 1, 'preview window number must be 1.');
assert(preview.candidateCount === 250, 'preview candidate count must be 250.');
assert(preview.physicalSpanCount === 60, 'preview span count must be 60.');
assert(preview.physicalWriteRangeCount === 120, 'preview range count must be 120.');
assert(preview.planBlockedRowsBefore === 814, 'preview blocked before must be 814.');
assert(preview.planBlockedRowsAfter === 564, 'preview blocked after must be 564.');
assert(preview.migrationRequiredRowsBefore === 0, 'preview migration before must be 0.');
assert(preview.migrationRequiredRowsAfter === 250, 'preview migration after must be 250.');
assert(preview.candidateAuthoritySha256 === WINDOW1_CANDIDATE_SHA, 'preview candidate SHA must bind window authority.');
assert(preview.spanGeometrySha256 === WINDOW1_SPAN_SHA, 'preview span SHA must bind window authority.');
assert(preview.sourceRecordKeyColumn === 25, 'source record column must remain 25.');
assert(preview.sourceObservationKeyColumn === 51, 'source observation column must remain 51.');
assert(preview.canonicalPropertyKeyColumn === 31, 'canonical column must resolve from headers.');
assert(preview.mutationAuthorityGranted === false, 'preview mutation authority must be false.');
assert(preview.collapseAuthorityGranted === false, 'preview collapse authority must be false.');
assert(preview.winnerSelectionAuthorityGranted === false, 'preview winner authority must be false.');
pass('window-1 preview binds exact candidate and physical geometry authority.');

let wrongWindowFailed = false;
try {
  context.reosCountyCodeViolationBlockedStorageBackfillPreview({
    windowNumber: 2
  });
} catch (error) {
  wrongWindowFailed = /not the current certified window/.test(String(error.message || error));
}
assert(wrongWindowFailed, 'preview must fail closed for a non-current window.');
pass('non-current window preview fails closed.');

// Interleaved-drain Window 2 status/preview boundary.
// Window 1 has been backfilled and its 250 migration-ready rows have
// subsequently been drained to durable identity.
const window2Plan = JSON.parse(JSON.stringify(plan));
window2Plan.alreadyDurableRows = 4276;
window2Plan.migrationRequiredRows = 0;
window2Plan.planBlockedRows = 564;
window2Plan.planBlockedRecords = blocked.slice(250);

const originalBuild = context.REOS
  .CountyCodeViolationDurableIdentityMigrationPlan
  .build;

context.REOS.CountyCodeViolationDurableIdentityMigrationPlan.build =
  function () {
    return JSON.parse(JSON.stringify(window2Plan));
  };

const window2Status =
  context.reosCountyCodeViolationBlockedStorageBackfillStatus();

assert(
  window2Status.currentWindowNumber === 2,
  'interleaved-drain status must identify window 2.'
);

assert(
  window2Status.planBlockedRows === 564 &&
    window2Status.migrationRequiredRows === 0 &&
    window2Status.alreadyDurableRows === 4276,
  'window 2 status must bind 564 / 0 / 4276.'
);

pass('interleaved-drain Window 2 boundary is recognized.');

context.REOS.CountyCodeViolationDurableIdentityMigrationPlan.build =
  originalBuild;

let executeFailed = false;
try {
  context.reosCountyCodeViolationBlockedStorageBackfillExecute({
    windowNumber: 1
  });
} catch (error) {
  executeFailed = /All six blocked-storage backfill confirmations are required/.test(
    String(error.message || error)
  );
}
assert(executeFailed, 'execute must reject missing explicit confirmations.');
assert(mutationCalls === 0, 'failed authority check must perform zero mutation calls.');
assert(hashCalls >= 4, 'preview and execute preflight must certify candidate/span hashes.');
pass('execute authority gate fails before any mutation boundary.');

console.log(
  '=== GATE 2B BLOCKED STORAGE BACKFILL V1 BEHAVIOR VALIDATION PASSED ==='
);

// TRANSACTION_PATH_BEHAVIOR_V1
//
// Synthetic success + rollback coverage for the actual mutation boundary.
// This harness never touches Apps Script or production data.
const txCrypto = require('crypto');

const TX_WINDOW_PLAN_SHA =
  '742ba533413e6447d9e121f326455381d1e689888647e2d86ad0b6e3bbd50684';
const TX_BACKFILL_AUTHORITY_SHA =
  '6d064158ced3d2eaede191c2b5e8195fd3701713c271cbbc6b257671be1767f0';

function txSha(value) {
  return txCrypto
    .createHash('sha256')
    .update(String(value), 'utf8')
    .digest('hex');
}

function txDigestBytes(value) {
  return Array.from(
    Buffer.from(
      txSha(value),
      'hex'
    )
  );
}

function buildTxHarness(injectBadPost) {
  const txHeaders = Array(51).fill('');
  txHeaders[24] = 'Source Record Key';
  txHeaders[30] = 'Canonical Property Key';
  txHeaders[50] = 'Source Observation Key';

  const txCells = new Map();
  const txWrites = [];
  let txFlushes = 0;
  let txLocks = 0;

  function cellKey(row, column) {
    return String(row) + ':' + String(column);
  }

  function getCell(row, column) {
    const key = cellKey(row, column);
    return txCells.has(key)
      ? txCells.get(key)
      : '';
  }

  function setCell(row, column, value) {
    txCells.set(
      cellKey(row, column),
      value
    );
  }

  const txRecords = blocked.map(function (record) {
    const clone = JSON.parse(
      JSON.stringify(record)
    );

    setCell(
      Number(clone.rowNumber),
      25,
      clone.legacyObservationKey
    );

    setCell(
      Number(clone.rowNumber),
      31,
      ''
    );

    setCell(
      Number(clone.rowNumber),
      51,
      ''
    );

    clone.prestateFingerprintSha256 =
      txSha(
        JSON.stringify({
          rowNumber:
            Number(clone.rowNumber),
          distressLeadId:
            String(clone.distressLeadId || ''),
          sourceRecordId:
            String(clone.sourceRecordId || ''),
          violationNumber:
            String(clone.violationNumber || ''),
          parcelId:
            String(clone.parcelId || ''),
          canonicalPropertyKey:
            String(clone.canonicalPropertyKey || ''),
          storedCanonicalPropertyKey:
            '',
          sourceObservationKey:
            '',
          sourceRecordKey:
            String(clone.legacyObservationKey || ''),
          legacyObservationKey:
            String(clone.legacyObservationKey || ''),
          proposedDurableKey:
            String(clone.proposedDurableKey || '')
        })
      );

    return clone;
  });

  function dynamicPlan() {
    const blockedRecords = [];
    const migrationRecords = [];

    txRecords.forEach(function (original) {
      const record = JSON.parse(
        JSON.stringify(original)
      );

      record.storedCanonicalPropertyKey =
        String(
          getCell(
            Number(record.rowNumber),
            31
          ) || ''
        );

      record.sourceRecordKey =
        String(
          getCell(
            Number(record.rowNumber),
            25
          ) || ''
        );

      record.sourceObservationKey =
        String(
          getCell(
            Number(record.rowNumber),
            51
          ) || ''
        );

      const stillBlocked =
        !record.storedCanonicalPropertyKey ||
        !record.sourceObservationKey;

      if (stillBlocked) {
        record.planBlockReasons = [
          'stored_canonical_identity_missing',
          'stored_observation_key_incomplete'
        ];
        blockedRecords.push(record);
      } else {
        record.planBlockReasons = [];
        migrationRecords.push(record);
      }
    });

    const post =
      migrationRecords.length > 0;

    return {
      connectorId:
        'PA-PHILADELPHIA',
      dataset:
        'code_violations',
      countySchedulerTriggerCount:
        0,
      alreadyDurableRows:
        4026,
      collapseRequiredRows:
        141,
      reviewRequiredRows:
        95,
      migrationRequiredRows:
        migrationRecords.length,
      planBlockedRows:
        (
          injectBadPost &&
          post
        )
          ? blockedRecords.length - 1
          : blockedRecords.length,
      planBlockedRecords:
        blockedRecords,
      migrationRequiredRecords:
        migrationRecords,
      alreadyDurableRecords:
        [],
      migrationPlanSha256:
        post
          ? 'tx-post-migration-sha'
          : 'tx-pre-migration-sha',
      completePlanSha256:
        post
          ? 'tx-post-complete-sha'
          : 'tx-pre-complete-sha'
    };
  }

  const txSheet = {
    getRange(
      firstRow,
      firstColumn,
      rowCount,
      columnCount
    ) {
      return {
        getValues() {
          const values = [];

          for (
            let rowOffset = 0;
            rowOffset < rowCount;
            rowOffset += 1
          ) {
            const row = [];

            for (
              let columnOffset = 0;
              columnOffset < columnCount;
              columnOffset += 1
            ) {
              row.push(
                getCell(
                  firstRow + rowOffset,
                  firstColumn + columnOffset
                )
              );
            }

            values.push(row);
          }

          return values;
        },

        setValues(values) {
          assert(
            Array.isArray(values) &&
              values.length === rowCount,
            'transaction harness row write count must match range.'
          );

          values.forEach(function (row, rowOffset) {
            assert(
              Array.isArray(row) &&
                row.length === columnCount,
              'transaction harness column write count must match range.'
            );

            row.forEach(function (value, columnOffset) {
              setCell(
                firstRow + rowOffset,
                firstColumn + columnOffset,
                value
              );
            });
          });

          txWrites.push({
            firstRow,
            firstColumn,
            rowCount,
            columnCount
          });

          return this;
        }
      };
    }
  };

  const txContext = {
    console,

    REOS: {
      Database: {
        getHeaders() {
          return txHeaders.slice();
        },

        getSheet() {
          return txSheet;
        },

        withScriptLockContext(callback) {
          txLocks += 1;
          return callback();
        }
      },

      CountyProductionScheduler: {
        getCheckpoint() {
          return {
            id:
              'COUNTY-20260902222607805',
            nextFeedIndex:
              0,
            currentFeedCursor:
              'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281',
            completedFeeds:
              0,
            totalFeeds:
              4,
            results:
              []
          };
        }
      },

      CountyCodeViolationDurableIdentityMigrationPlan: {
        build() {
          return dynamicPlan();
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

      computeDigest(
        _algorithm,
        value
      ) {
        const text = String(value);

        if (
          text.startsWith(
            '[{"count":'
          )
        ) {
          return bytes(
            WINDOW1_SPAN_SHA
          );
        }

        if (
          text.startsWith(
            '100|TEST-0001|'
          )
        ) {
          return bytes(
            WINDOW1_CANDIDATE_SHA
          );
        }

        return txDigestBytes(text);
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return [
          {
            getHandlerFunction() {
              return 'reosProductionOperationsHeartbeat';
            },

            getEventType() {
              return 'CLOCK';
            },

            getTriggerSource() {
              return 'CLOCK';
            },

            getUniqueId() {
              return 'synthetic-heartbeat';
            }
          }
        ];
      }
    },

    SpreadsheetApp: {
      flush() {
        txFlushes += 1;
      }
    }
  };

  vm.createContext(txContext);

  vm.runInContext(
    source,
    txContext,
    {
      filename: SRC
    }
  );

  const options = {
    windowNumber:
      1,

    confirmBlockedStorageBackfill:
      true,

    confirmCanonicalPropertyBackfill:
      true,

    confirmLegacyObservationPreservation:
      true,

    confirmNoDurableObservationWrite:
      true,

    confirmNoSourceRecordKeyWrite:
      true,

    confirmNoInsertDelete:
      true,

    windowPlanSha256:
      TX_WINDOW_PLAN_SHA,

    blockedBackfillAuthoritySha256:
      TX_BACKFILL_AUTHORITY_SHA,

    candidateAuthoritySha256:
      WINDOW1_CANDIDATE_SHA,

    spanGeometrySha256:
      WINDOW1_SPAN_SHA,

    migrationPlanSha256:
      'tx-pre-migration-sha',

    completePlanSha256:
      'tx-pre-complete-sha'
  };

  return {
    context:
      txContext,

    records:
      txRecords,

    options,

    writes:
      txWrites,

    getCell,

    get flushes() {
      return txFlushes;
    },

    get locks() {
      return txLocks;
    },

    plan:
      dynamicPlan
  };
}


// --------------------------------------------------
// Successful forward mutation path
// --------------------------------------------------

const txSuccess =
  buildTxHarness(false);

const txResult =
  txSuccess
    .context
    .reosCountyCodeViolationBlockedStorageBackfillExecute(
      txSuccess.options
    );

assert(
  txResult.mode ===
    'CERTIFIED_BLOCKED_STORAGE_BACKFILL_EXECUTED',
  'success path must return certified execution mode.'
);

assert(
  txResult.windowNumber === 1,
  'success path must execute window 1.'
);

assert(
  txResult.candidateCount === 250,
  'success path must mutate exactly 250 candidates.'
);

assert(
  txResult.physicalSpanCount === 60 &&
    txResult.physicalWriteRangeCount === 120,
  'success path must preserve exact 60-span / 120-range geometry.'
);

assert(
  txResult.planBlockedRowsBefore === 814 &&
    txResult.planBlockedRowsAfter === 564,
  'success path must transition blocked rows 814 -> 564.'
);

assert(
  txResult.migrationRequiredRowsBefore === 0 &&
    txResult.migrationRequiredRowsAfter === 250,
  'success path must transition migration-required rows 0 -> 250.'
);

assert(
  txResult.nextMigrationPlanSha256 ===
    'tx-post-migration-sha' &&
    txResult.nextCompletePlanSha256 ===
      'tx-post-complete-sha',
  'success path must return verified post-plan hashes.'
);

assert(
  txResult.productionDataMutationExecuted === true &&
    txResult.backfillExecuted === true &&
    txResult.backfillAuthorityConsumed === true,
  'success path must report completed production-data mutation semantics.'
);

assert(
  txResult.sourceRecordKeyMutationExecuted === false &&
    txResult.durableObservationKeyMutationExecuted === false &&
    txResult.retryPermitted === false,
  'success path must keep forbidden mutations false and retry prohibited.'
);

assert(
  txSuccess.locks === 1,
  'success path must execute inside exactly one ScriptLock context.'
);

assert(
  txSuccess.flushes === 1,
  'success path must flush exactly once after forward writes.'
);

assert(
  txSuccess.writes.length === 120,
  'success path must perform exactly 120 narrow forward write ranges.'
);

assert(
  txSuccess.writes.every(function (write) {
    return (
      write.columnCount === 1 &&
      (
        write.firstColumn === 31 ||
        write.firstColumn === 51
      )
    );
  }),
  'success path may write only Canonical Property Key and Source Observation Key.'
);

assert(
  txSuccess.writes.every(function (write) {
    return write.firstColumn !== 25;
  }),
  'success path must never write Source Record Key.'
);

txSuccess.records
  .slice(0, 250)
  .forEach(function (record) {
    const row =
      Number(record.rowNumber);

    assert(
      txSuccess.getCell(
        row,
        31
      ) ===
        record.canonicalPropertyKey,
      'success path must restore canonical identity at row ' + row
    );

    assert(
      txSuccess.getCell(
        row,
        51
      ) ===
        record.legacyObservationKey,
      'success path must restore legacy observation identity at row ' + row
    );

    assert(
      txSuccess.getCell(
        row,
        25
      ) ===
        record.legacyObservationKey,
      'success path must preserve Source Record Key at row ' + row
    );
  });

const txFirstUnselected =
  txSuccess.records[250];

assert(
  txSuccess.getCell(
    Number(txFirstUnselected.rowNumber),
    31
  ) === '' &&
    txSuccess.getCell(
      Number(txFirstUnselected.rowNumber),
      51
    ) === '',
  'success path must not mutate the next-window candidate.'
);

const writesAfterSuccess =
  txSuccess.writes.length;

let repeatedWindowRejected =
  false;

try {
  txSuccess
    .context
    .reosCountyCodeViolationBlockedStorageBackfillExecute(
      txSuccess.options
    );
} catch (error) {
  repeatedWindowRejected =
    /does not match any certified window boundary/.test(
      String(
        error.message ||
        error
      )
    );
}

assert(
  repeatedWindowRejected,
  'completed window must not be executable a second time.'
);

assert(
  txSuccess.writes.length ===
    writesAfterSuccess,
  'repeated-window rejection must perform zero additional writes.'
);

pass(
  'synthetic forward path writes exactly the certified columns, verifies 814->564 / 0->250, and prevents window replay.'
);


// --------------------------------------------------
// Verified rollback path
// --------------------------------------------------

const txRollback =
  buildTxHarness(true);

let rollbackFailureCertified =
  false;

try {
  txRollback
    .context
    .reosCountyCodeViolationBlockedStorageBackfillExecute(
      txRollback.options
    );
} catch (error) {
  rollbackFailureCertified =
    /failed and certified prestate was restored/.test(
      String(
        error.message ||
        error
      )
    );
}

assert(
  rollbackFailureCertified,
  'post-plan validation failure must restore certified prestate.'
);

assert(
  txRollback.locks === 1,
  'rollback scenario must remain inside one ScriptLock context.'
);

assert(
  txRollback.flushes === 2,
  'rollback scenario must flush once forward and once after restore.'
);

assert(
  txRollback.writes.length === 240,
  'rollback scenario must perform 120 forward + 120 rollback ranges.'
);

assert(
  txRollback.writes.every(function (write) {
    return write.firstColumn !== 25;
  }),
  'rollback scenario must never write Source Record Key.'
);

txRollback.records
  .slice(0, 250)
  .forEach(function (record) {
    const row =
      Number(record.rowNumber);

    assert(
      txRollback.getCell(
        row,
        31
      ) === '',
      'rollback must restore empty canonical prestate at row ' + row
    );

    assert(
      txRollback.getCell(
        row,
        51
      ) === '',
      'rollback must restore empty observation prestate at row ' + row
    );

    assert(
      txRollback.getCell(
        row,
        25
      ) ===
        record.legacyObservationKey,
      'rollback must preserve Source Record Key at row ' + row
    );
  });

const rollbackPlan =
  txRollback.plan();

assert(
  rollbackPlan.planBlockedRows === 814 &&
    rollbackPlan.migrationRequiredRows === 0,
  'rollback must return the synthetic plan exactly to 814 blocked / 0 migration-required.'
);

const rollbackStatus =
  txRollback
    .context
    .reosCountyCodeViolationBlockedStorageBackfillStatus();

assert(
  rollbackStatus.currentWindowNumber === 1 &&
    rollbackStatus.planBlockedRows === 814 &&
    rollbackStatus.migrationRequiredRows === 0,
  'rollback must return status to certified window-1 prestate.'
);

pass(
  'synthetic rollback path restores physical prestate and certified plan boundary.'
);

console.log(
  '=== GATE 2B BLOCKED STORAGE BACKFILL V1 TRANSACTION PATH VALIDATION PASSED ==='
);
