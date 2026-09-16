#!/usr/bin/env node

'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const vm =
  require('vm');

const path =
  require('path');


const ROOT =
  path.resolve(
    __dirname,
    '..'
  );


const executorPath =
  process.argv[2] ||
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyCodeViolationDurableIdentityMigrationBatch1Executor.js'
  );


const evidencePath =
  process.argv[3] ||
  '';


const schemaPath =
  process.argv[4] ||
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'DistressLeadCountySchema.js'
  );


const CERTIFIED_INITIAL_MIGRATION_SHA =
  '85ed3193aa1486116e76b7c892e5f4090974c3399479ea49185f88dd265c7adf';


const CERTIFIED_INITIAL_COMPLETE_SHA =
  '73c95b48cfa7b25c09aa3c6cf00fb2ce1dd7aede9188d60630924c902716f8d2';


const CERTIFIED_NEXT_MIGRATION_SHA =
  'b492a0d90e3c0deeab0b159574a455944726c46d3d758e930562b57809a31dc6';


const CERTIFIED_NEXT_COMPLETE_SHA =
  '0d8b1c8518fea1a49a8dd6c054b14b1c2ffa58d68faa7753041f37e64aa0a317';


const executorSource =
  fs.readFileSync(
    executorPath,
    'utf8'
  );


function extractEmbeddedTargets(
  source
) {
  const match =
    source.match(
      /var TARGETS =\s*(\[[\s\S]*?\])\s*;/
    );

  if (!match) {
    throw new Error(
      'Unable to extract hard-bound Batch-1 targets from executor.'
    );
  }

  const targets =
    JSON.parse(
      match[1]
    );

  if (
    !Array.isArray(targets) ||
    targets.length !== 10
  ) {
    throw new Error(
      'Executor must embed exactly 10 Batch-1 targets.'
    );
  }

  return targets;
}


const embeddedTargets =
  extractEmbeddedTargets(
    executorSource
  );


function fixtureHash(
  value
) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
}


function fixtureRecord(
  kind,
  ordinal
) {
  const durableKey =
    (
      kind === 'migration'
        ? 'zz-migration-'
        : kind === 'durable'
          ? 'zz-durable-'
          : 'zz-blocked-'
    ) +
    String(ordinal)
      .padStart(
        5,
        '0'
      );

  const rowNumber =
    10000 +
    ordinal +
    (
      kind === 'durable'
        ? 10000
        : kind === 'blocked'
          ? 20000
          : 0
    );

  const alreadyDurable =
    kind === 'durable';

  const blocked =
    kind === 'blocked';

  const legacyKey =
    alreadyDurable
      ? durableKey
      : (
          'pa-philadelphia|code_violations|' +
          String(
            900000 +
            ordinal
          )
        );

  const record = {
    rowNumber:
      rowNumber,

    distressLeadId:
      'FIXTURE-' +
      kind.toUpperCase() +
      '-' +
      ordinal,

    sourceRecordId:
      String(
        900000 +
        ordinal
      ),

    violationNumber:
      'VI-FIXTURE-' +
      String(ordinal)
        .padStart(
          6,
          '0'
        ),

    parcelId:
      'PARCEL-' +
      ordinal,

    canonicalPropertyKey:
      'parcel|fixture-' +
      ordinal,

    storedCanonicalPropertyKey:
      'parcel|fixture-' +
      ordinal,

    sourceObservationKey:
      alreadyDurable
        ? durableKey
        : legacyKey,

    sourceRecordKey:
      alreadyDurable
        ? durableKey
        : legacyKey,

    legacyObservationKey:
      legacyKey,

    proposedDurableKey:
      durableKey,

    alreadyDurable:
      alreadyDurable,

    planBlockReasons:
      blocked
        ? [
            'stored_canonical_identity_missing',
            'stored_observation_key_incomplete'
          ]
        : []
  };

  record.prestateFingerprintSha256 =
    fixtureHash(
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


function buildRepositoryFixturePlan() {
  const migrationRequiredRecords =
    embeddedTargets
      .map(record =>
        JSON.parse(
          JSON.stringify(
            record
          )
        )
      );


  for (
    let ordinal = 1;
    ordinal <= 3877;
    ordinal += 1
  ) {
    migrationRequiredRecords.push(
      fixtureRecord(
        'migration',
        ordinal
      )
    );
  }


  const alreadyDurableRecords =
    [];

  for (
    let ordinal = 1;
    ordinal <= 139;
    ordinal += 1
  ) {
    alreadyDurableRecords.push(
      fixtureRecord(
        'durable',
        ordinal
      )
    );
  }


  const planBlockedRecords =
    [];

  for (
    let ordinal = 1;
    ordinal <= 814;
    ordinal += 1
  ) {
    planBlockedRecords.push(
      fixtureRecord(
        'blocked',
        ordinal
      )
    );
  }


  return {
    ok:
      true,

    readOnly:
      true,

    mode:
      'READ_ONLY_CODE_VIOLATION_DURABLE_IDENTITY_MIGRATION_PLAN',

    phase:
      'gate_2b_migration_ready_plan',

    table:
      'DISTRESS_LEADS',

    connectorId:
      'PA-PHILADELPHIA',

    dataset:
      'code_violations',

    durableIdentityField:
      'Violation Number',

    countySchedulerTriggerCount:
      0,

    totalRows:
      6282,

    scopedRows:
      4981,

    migrationReadyAuditRows:
      4840,

    collapseRequiredRows:
      141,

    reviewRequiredRows:
      95,

    alreadyDurableRows:
      139,

    migrationRequiredRows:
      3887,

    planBlockedRows:
      814,

    migrationRequiredRecords:
      migrationRequiredRecords,

    alreadyDurableRecords:
      alreadyDurableRecords,

    planBlockedRecords:
      planBlockedRecords,

    migrationPlanSha256:
      CERTIFIED_INITIAL_MIGRATION_SHA,

    completePlanSha256:
      CERTIFIED_INITIAL_COMPLETE_SHA,

    migrationReadyOnlyPlanComplete:
      false,

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


const productionEvidenceMode =
  Boolean(
    evidencePath
  );


let initialPlan;


if (productionEvidenceMode) {
  const envelope =
    JSON.parse(
      fs.readFileSync(
        evidencePath,
        'utf8'
      )
    );

  initialPlan =
    envelope.response ||
    envelope;
} else {
  initialPlan =
    buildRepositoryFixturePlan();
}


assert.strictEqual(
  initialPlan.migrationPlanSha256,
  CERTIFIED_INITIAL_MIGRATION_SHA
);

assert.strictEqual(
  initialPlan.completePlanSha256,
  CERTIFIED_INITIAL_COMPLETE_SHA
);

assert.strictEqual(
  initialPlan.migrationRequiredRows,
  3887
);

assert.strictEqual(
  initialPlan.alreadyDurableRows,
  139
);

assert.strictEqual(
  initialPlan.planBlockedRows,
  814
);


function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}


function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
}


function fingerprint(record) {
  return sha256(
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


const targets =
  initialPlan
    .migrationRequiredRecords
    .slice(
      0,
      10
    );


assert.deepStrictEqual(
  targets.map(
    record =>
      Number(
        record.rowNumber
      )
  ),
  [
    3578,
    3579,
    3580,
    3581,
    3582,
    3583,
    3584,
    3585,
    3586,
    3587
  ]
);


function identity(record) {
  return (
    String(
      record.rowNumber
    ) +
    '|' +
    String(
      record.proposedDurableKey
    )
  );
}


function buildExpectedPost() {
  const targetSet =
    new Set(
      targets.map(
        identity
      )
    );


  const all =
    []
      .concat(
        clone(
          initialPlan
            .migrationRequiredRecords
        ),
        clone(
          initialPlan
            .alreadyDurableRecords
        ),
        clone(
          initialPlan
            .planBlockedRecords
        )
      )
      .map(record => {
        if (
          targetSet.has(
            identity(record)
          )
        ) {
          record.sourceObservationKey =
            record.proposedDurableKey;

          record.sourceRecordKey =
            record.proposedDurableKey;

          record.legacyObservationKey =
            record.proposedDurableKey;

          record.alreadyDurable =
            true;

          record.planBlockReasons =
            [];

          record.prestateFingerprintSha256 =
            fingerprint(record);
        }

        return record;
      });


  all.sort(
    (a, b) => {
      const compared =
        String(
          a.proposedDurableKey
        ).localeCompare(
          String(
            b.proposedDurableKey
          )
        );

      return compared !== 0
        ? compared
        : Number(a.rowNumber) -
            Number(b.rowNumber);
    }
  );


  const migrationRequiredRecords =
    all.filter(record =>
      (
        record.planBlockReasons ||
        []
      ).length === 0 &&
      record.alreadyDurable !== true
    );


  const alreadyDurableRecords =
    all.filter(record =>
      (
        record.planBlockReasons ||
        []
      ).length === 0 &&
      record.alreadyDurable === true
    );


  const planBlockedRecords =
    all.filter(record =>
      (
        record.planBlockReasons ||
        []
      ).length > 0
    );


  const migrationMaterial =
    migrationRequiredRecords
      .map(record =>
        [
          record.proposedDurableKey,
          record.distressLeadId,
          String(
            record.rowNumber
          ),
          record.prestateFingerprintSha256
        ].join('|')
      )
      .join('\n');


  const completeMaterial =
    all
      .map(record =>
        [
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
        ].join('|')
      )
      .join('\n');


  const post =
    clone(
      initialPlan
    );


  post.migrationRequiredRecords =
    migrationRequiredRecords;

  post.alreadyDurableRecords =
    alreadyDurableRecords;

  post.planBlockedRecords =
    planBlockedRecords;

  post.migrationRequiredRows =
    migrationRequiredRecords.length;

  post.alreadyDurableRows =
    alreadyDurableRecords.length;

  post.planBlockedRows =
    planBlockedRecords.length;

  post.migrationPlanSha256 =
    sha256(
      migrationMaterial
    );

  post.completePlanSha256 =
    sha256(
      completeMaterial
    );

  post.migrationReadyOnlyPlanComplete =
    planBlockedRecords.length === 0;


  return post;
}


const expectedPost =
  buildExpectedPost();


assert.strictEqual(
  expectedPost.migrationRequiredRows,
  3877
);

assert.strictEqual(
  expectedPost.alreadyDurableRows,
  149
);

assert.strictEqual(
  expectedPost.planBlockedRows,
  814
);


if (productionEvidenceMode) {
  assert.strictEqual(
    expectedPost.migrationPlanSha256,
    CERTIFIED_NEXT_MIGRATION_SHA,
    'production evidence must derive exact certified next migration-plan SHA'
  );

  assert.strictEqual(
    expectedPost.completePlanSha256,
    CERTIFIED_NEXT_COMPLETE_SHA,
    'production evidence must derive exact certified next complete-plan SHA'
  );
}


const schemaContext = {
  REOS: {}
};


vm.createContext(
  schemaContext
);


vm.runInContext(
  fs.readFileSync(
    schemaPath,
    'utf8'
  ),
  schemaContext,
  {
    filename:
      schemaPath
  }
);


const headers =
  Array.from(
    schemaContext
      .REOS
      .DistressLeadCountySchema
      .requiredHeaders()
  );


assert.strictEqual(
  headers.length,
  52
);

assert.strictEqual(
  headers.indexOf(
    'Source Record Key'
  ) + 1,
  25
);

assert.strictEqual(
  headers.indexOf(
    'Source Observation Key'
  ) + 1,
  51
);


const validInvocation = {
  confirmMigration:
    true,

  confirmDurableIdentity:
    true,

  confirmBatch1:
    true,

  confirmInPlace:
    true,

  confirmNoInsertDelete:
    true,

  confirmMigrationReadyOnly:
    true,

  migrationPlanSha256:
    initialPlan
      .migrationPlanSha256,

  completePlanSha256:
    initialPlan
      .completePlanSha256
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
      return (
        'TRIGGER-' +
        handler
      );
    }
  };
}


const baseCheckpoint = {
  id:
    'COUNTY-20260902222607805',

  startedAt:
    '2026-09-02T22:26:07.805Z',

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


const harnessStates = [];

function makeHarness(options) {
  options =
    options ||
    {};


  const state = {
    recordKeys:
      targets.map(
        record => [
          record.sourceRecordKey
        ]
      ),

    observationKeys:
      targets.map(
        record => [
          record.sourceObservationKey
        ]
      ),

    writeCalls:
      0,

    flushCalls:
      0,

    lockCalls:
      0,

    planBuildCalls:
      0,

    lockHeld: false,
    leaseAllowed: false,
    leaseCalls: 0,
    events: []
  };
  harnessStates.push(state);


  const failWrites =
    new Set(
      options.failWriteCalls ||
      []
    );


  function allLegacy() {
    return targets.every(
      (record, index) =>
        String(
          state.recordKeys[
            index
          ][0]
        ) ===
          String(
            record.sourceRecordKey
          ) &&
        String(
          state.observationKeys[
            index
          ][0]
        ) ===
          String(
            record.sourceObservationKey
          )
    );
  }


  function allDurable() {
    return targets.every(
      (record, index) =>
        String(
          state.recordKeys[
            index
          ][0]
        ) ===
          String(
            record.proposedDurableKey
          ) &&
        String(
          state.observationKeys[
            index
          ][0]
        ) ===
          String(
            record.proposedDurableKey
          )
    );
  }


  const sheet = {
    getLastRow() {
      return 6283;
    },


    getRange(
      row,
      column,
      rowCount,
      columnCount
    ) {
      assert.strictEqual(
        row,
        3578
      );

      assert.strictEqual(
        rowCount,
        10
      );

      assert.strictEqual(
        columnCount,
        1
      );

      assert.ok(
        column === 25 ||
        column === 51
      );


      const source =
        column === 25
          ? state.recordKeys
          : state.observationKeys;


      return {
        getValues() {
          return clone(
            source
          );
        },


        setValues(values) {
          assert.strictEqual(state.lockHeld, true, 'every write must hold the same lock');
          assert.strictEqual(state.leaseAllowed, true, 'lease must allow every write');
          state.events.push('write:' + column);
          state.writeCalls +=
            1;

          if (
            failWrites.has(
              state.writeCalls
            )
          ) {
            throw new Error(
              'SIMULATED_WRITE_FAILURE_' +
              state.writeCalls
            );
          }

          assert.strictEqual(
            values.length,
            10
          );

          const copy =
            clone(
              values
            );

          if (column === 25) {
            state.recordKeys =
              copy;
          } else {
            state.observationKeys =
              copy;
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
          assert.strictEqual(state.lockHeld, true, 'lease assertion must be under lock');
          assert.strictEqual(state.leaseCalls, 1, 'exactly one lease assertion per transaction');
          assert.deepStrictEqual(Object.keys(request), ['writerId']);
          assert.strictEqual(request.writerId, 'CODE_VIOLATION_DURABLE_IDENTITY_BATCH1');
          state.events.push('lease');
          if (options.leaseError) throw options.leaseError;
          state.leaseAllowed = true;
          return {ok: true, allowed: true, writerId: request.writerId};
        }
      },

      Security: {
        requireAdmin() {}
      },


      DistressLeadCountySchema: {
        requiredHeaders() {
          return headers.slice();
        }
      },


      CountyProductionScheduler: {
        getCheckpoint() {
          return clone(
            options.checkpoint ||
            baseCheckpoint
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


        getHeaders(name) {
          assert.strictEqual(
            name,
            'DISTRESS_LEADS'
          );

          return headers.slice();
        },


        withScriptLockContext(work) {
          state.lockCalls +=
            1;

          if (
            options.lockFailure
          ) {
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
          state.planBuildCalls +=
            1;

          if (
            options.forceInitialPlan
          ) {
            return clone(
              initialPlan
            );
          }

          if (
            allLegacy()
          ) {
            return clone(
              initialPlan
            );
          }

          if (
            allDurable()
          ) {
            const post =
              clone(
                expectedPost
              );

            if (
              options.postPlanMismatch
            ) {
              post.migrationRequiredRows +=
                1;
            }

            return post;
          }

          /*
           * No plan read should occur in a half-written state.
           * Returning unmistakably invalid authority makes such a read
           * fail closed if executor topology changes.
           */
          return {
            ok:
              false,

            readOnly:
              true
          };
        }
      }
    },


    ScriptApp: {
      getProjectTriggers() {
        return (
          options.triggers ||
          []
        );
      }
    },


    SpreadsheetApp: {
      flush() {
        assert.strictEqual(state.lockHeld, true, 'forward and rollback flushes must hold lock');
        state.flushCalls +=
          1;

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
        SHA_256:
          'SHA_256'
      },

      Charset: {
        UTF_8:
          'UTF_8'
      },

      computeDigest(
        algorithm,
        value
      ) {
        assert.strictEqual(
          algorithm,
          'SHA_256'
        );

        return Array.from(
          crypto
            .createHash('sha256')
            .update(
              String(value),
              'utf8'
            )
            .digest()
        );
      }
    }
  };


  if (options.missingLeaseModule) delete context.REOS.CountyMutationExclusionLease;
  if (options.missingLeaseGuard) delete context.REOS.CountyMutationExclusionLease.assertWriterAllowed;

  vm.createContext(
    context
  );


  vm.runInContext(
    executorSource,
    context,
    {
      filename:
        executorPath
    }
  );


  return {
    state,

    execute(options) {
      return context
        .reosCountyCodeViolationDurableIdentityMigrationBatch1Execute(
          options
        );
    },

    status() {
      return context
        .reosCountyCodeViolationDurableIdentityMigrationBatch1Status();
    }
  };
}


function expectError(
  fn,
  pattern
) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error =
      caught;
  }

  assert.ok(
    error,
    'expected operation to throw'
  );

  assert.match(
    String(
      error.message ||
      error
    ),
    pattern
  );

  return error;
}


let failures =
  0;


let writer7TestsRun = 0;

function test(
  name,
  work
) {
  writer7TestsRun += 1;
  const firstHarness = harnessStates.length;
  try {
    work();
    harnessStates.slice(firstHarness).forEach(state => {
      assert.strictEqual(state.lockHeld, false, 'lock must be released after every outcome');
      assert.strictEqual(state.leaseAllowed, false, 'lease grant must not outlive the lock');
      if (state.writeCalls > 0) {
        assert.strictEqual(state.lockCalls, 1, 'all forward and rollback writes share one lock');
        assert.strictEqual(state.leaseCalls, 1, 'all writes share one lease assertion');
        assert.deepStrictEqual(state.events.slice(0, 2), ['lock', 'lease']);
        assert.strictEqual(state.events[state.events.length - 1], 'release');
        assert.strictEqual(state.events.filter(event => event === 'release').length, 1);
      }
    });

    console.log(
      'PASS:',
      name
    );
  } catch (error) {
    failures +=
      1;

    console.error(
      'FAIL:',
      name
    );

    console.error(
      error.stack ||
      error
    );
  }
}


console.log(
  '=== GATE 2B BATCH-1 EXECUTOR CONTRACT ==='
);


test(
  'static surface contains exactly two setValues primitives',
  () => {
    assert.strictEqual(
      (
        executorSource.match(
          /\.setValues\(/g
        ) ||
        []
      ).length,
      2
    );

    [
      'REOS.Database.update(',
      'REOS.Database.insert(',
      'REOS.Database.upsert(',
      'appendRow(',
      'deleteRow(',
      'deleteRows(',
      'insertRow(',
      'insertRows(',
      'UrlFetchApp',
      'ScriptApp.newTrigger',
      'reosCountyProductionSchedulerRun('
    ].forEach(token => {
      assert.strictEqual(
        executorSource.includes(
          token
        ),
        false,
        token
      );
    });
  }
);


test(
  'status is read-only and performs no mutation',
  () => {
    const harness =
      makeHarness();

    const result =
      harness.status();

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.readOnly,
      true
    );

    assert.strictEqual(
      result.batch,
      1
    );

    assert.strictEqual(
      result.batchStartRow,
      3578
    );

    assert.strictEqual(
      result.batchEndRow,
      3587
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );

    assert.strictEqual(
      result.productionDataMutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.schedulerAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.automaticOfferAuthorityGranted,
      false
    );
  }
);


test(
  'missing explicit confirmation fails before mutation',
  () => {
    const harness =
      makeHarness();

    const invocation =
      clone(
        validInvocation
      );

    delete invocation.confirmBatch1;

    expectError(
      () =>
        harness.execute(
          invocation
        ),
      /confirmBatch1=true/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'wrong migration-plan SHA fails before mutation',
  () => {
    const harness =
      makeHarness();

    const invocation =
      Object.assign(
        {},
        validInvocation,
        {
          migrationPlanSha256:
            '0'.repeat(64)
        }
      );

    expectError(
      () =>
        harness.execute(
          invocation
        ),
      /migration-plan SHA-256 mismatch/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'wrong complete-plan SHA fails before mutation',
  () => {
    const harness =
      makeHarness();

    const invocation =
      Object.assign(
        {},
        validInvocation,
        {
          completePlanSha256:
            '0'.repeat(64)
        }
      );

    expectError(
      () =>
        harness.execute(
          invocation
        ),
      /complete-plan SHA-256 mismatch/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'active county scheduler trigger fails closed before lock/write',
  () => {
    const harness =
      makeHarness({
        triggers: [
          trigger(
            'reosCountyProductionSchedulerRun'
          )
        ]
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /mutating installable triggers frozen/
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
  'checkpoint drift fails closed before mutation',
  () => {
    const checkpoint =
      clone(
        baseCheckpoint
      );

    checkpoint.id =
      'COUNTY-DRIFTED';

    const harness =
      makeHarness({
        checkpoint
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /checkpoint authority changed/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'fail-fast ScriptLock contention performs no write',
  () => {
    const harness =
      makeHarness({
        lockFailure:
          true
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /ScriptLock is contended/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'physical prestate drift fails before write',
  () => {
    const harness =
      makeHarness({
        forceInitialPlan:
          true
      });

    harness
      .state
      .recordKeys[0][0] =
        'pa-philadelphia|code_violations|DRIFT';

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /physical prestate changed at row 3578/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      0
    );
  }
);


test(
  'successful Batch 1 performs exactly two writes and exact rolling transition',
  () => {
    const harness =
      makeHarness();

    const result =
      harness.execute(
        validInvocation
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.migratedRowCount,
      10
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
      3887
    );

    assert.strictEqual(
      result.migrationRequiredRowsAfter,
      3877
    );

    assert.strictEqual(
      result.alreadyDurableRowsBefore,
      139
    );

    assert.strictEqual(
      result.alreadyDurableRowsAfter,
      149
    );

    assert.strictEqual(
      result.nextMigrationPlanSha256,
      expectedPost
        .migrationPlanSha256
    );

    assert.strictEqual(
      result.nextCompletePlanSha256,
      expectedPost
        .completePlanSha256
    );

    targets.forEach(
      (record, index) => {
        assert.strictEqual(
          harness
            .state
            .recordKeys[index][0],
          record.proposedDurableKey
        );

        assert.strictEqual(
          harness
            .state
            .observationKeys[index][0],
          record.proposedDurableKey
        );
      }
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
      result.planBlockedRows,
      814
    );

    assert.strictEqual(
      result.schedulerAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.checkpointMutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      result.automaticOfferAuthorityGranted,
      false
    );
  }
);


test(
  'first physical write failure restores certified prestate',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [
          1
        ]
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /failed and certified identity prestate was restored/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      3
    );

    targets.forEach(
      (record, index) => {
        assert.strictEqual(
          harness
            .state
            .recordKeys[index][0],
          record.sourceRecordKey
        );

        assert.strictEqual(
          harness
            .state
            .observationKeys[index][0],
          record.sourceObservationKey
        );
      }
    );
  }
);


test(
  'second physical write failure restores both identity columns',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [
          2
        ]
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /failed and certified identity prestate was restored/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      4
    );

    targets.forEach(
      (record, index) => {
        assert.strictEqual(
          harness
            .state
            .recordKeys[index][0],
          record.sourceRecordKey
        );

        assert.strictEqual(
          harness
            .state
            .observationKeys[index][0],
          record.sourceObservationKey
        );
      }
    );
  }
);


test(
  'post-plan mismatch rolls back exact certified prestate',
  () => {
    const harness =
      makeHarness({
        postPlanMismatch:
          true
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /failed and certified identity prestate was restored/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      4
    );

    targets.forEach(
      (record, index) => {
        assert.strictEqual(
          harness
            .state
            .recordKeys[index][0],
          record.sourceRecordKey
        );

        assert.strictEqual(
          harness
            .state
            .observationKeys[index][0],
          record.sourceObservationKey
        );
      }
    );
  }
);


test(
  'post-write flush failure rolls back exact certified prestate',
  () => {
    const harness =
      makeHarness({
        failFlushCall:
          1
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /failed and certified identity prestate was restored/
    );

    targets.forEach(
      (record, index) => {
        assert.strictEqual(
          harness
            .state
            .recordKeys[index][0],
          record.sourceRecordKey
        );

        assert.strictEqual(
          harness
            .state
            .observationKeys[index][0],
          record.sourceObservationKey
        );
      }
    );
  }
);


test(
  'rollback failure produces explicit ambiguous no-retry result',
  () => {
    const harness =
      makeHarness({
        failWriteCalls: [
          2,
          3
        ]
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /GATE_2B_BATCH_1_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      3
    );
  }
);


test(
  'outer lock finalization failure after verified mutation is ambiguous no-retry',
  () => {
    const harness =
      makeHarness({
        outerFinalizationFailure:
          true
      });

    expectError(
      () =>
        harness.execute(
          validInvocation
        ),
      /GATE_2B_BATCH_1_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );

    assert.strictEqual(
      harness.state.writeCalls,
      2
    );

    targets.forEach(
      (record, index) => {
        assert.strictEqual(
          harness
            .state
            .recordKeys[index][0],
          record.proposedDurableKey
        );

        assert.strictEqual(
          harness
            .state
            .observationKeys[index][0],
          record.proposedDurableKey
        );
      }
    );
  }
);


// WRITER_7_LEASE_BOUNDARY_BEHAVIOR_V1
function assertNoWriterMutation(harness, before) {
  assert.strictEqual(harness.state.writeCalls, 0, 'denial must prevent both forward and rollback writes');
  assert.strictEqual(harness.state.flushCalls, 0, 'executor must not flush a denied transaction');
  assert.deepStrictEqual(harness.state.recordKeys, before.recordKeys);
  assert.deepStrictEqual(harness.state.observationKeys, before.observationKeys);
}

test('Writer 7 status remains read-only without a lease module', () => {
  const harness = makeHarness({missingLeaseModule: true});
  const before = clone(harness.state);
  assert.strictEqual(harness.status().readOnly, true);
  assert.strictEqual(harness.state.lockCalls, 0);
  assert.strictEqual(harness.state.leaseCalls, 0);
  assertNoWriterMutation(harness, before);
});

['missingLeaseModule', 'missingLeaseGuard'].forEach(option => {
  test('Writer 7 ' + option + ' fails closed under lock', () => {
    const harness = makeHarness({[option]: true});
    const before = clone(harness.state);
    const error = expectError(() => harness.execute(validInvocation), /lease assertion is required/);
    assert.strictEqual(error.message, 'County mutation-exclusion lease assertion is required.');
    assert.strictEqual(harness.state.lockCalls, 1);
    assert.strictEqual(harness.state.leaseCalls, 0);
    assertNoWriterMutation(harness, before);
  });
});

['active lease', 'malformed lease'].forEach(scenario => {
  test('Writer 7 ' + scenario + ' rejection propagates without mutation', () => {
    const rejection = new Error('TEST_WRITER_7_LEASE_REJECTION: ' + scenario);
    const harness = makeHarness({leaseError: rejection});
    const before = clone(harness.state);
    const error = expectError(() => harness.execute(validInvocation), /TEST_WRITER_7_LEASE_REJECTION/);
    assert.strictEqual(error, rejection, 'lease rejection must propagate unchanged');
    assert.strictEqual(harness.state.lockCalls, 1);
    assert.strictEqual(harness.state.leaseCalls, 1);
    assertNoWriterMutation(harness, before);
  });
});

test('Writer 7 sees lease denial introduced when the lock is acquired', () => {
  const rejection = new Error('TEST_WRITER_7_LATE_LEASE_REJECTION');
  const options = {onLockAcquired() { options.leaseError = rejection; }};
  const harness = makeHarness(options);
  const before = clone(harness.state);
  assert.strictEqual(options.leaseError, undefined);
  const error = expectError(() => harness.execute(validInvocation), /TEST_WRITER_7_LATE_LEASE_REJECTION/);
  assert.strictEqual(error, rejection);
  assert.strictEqual(harness.state.lockCalls, 1);
  assert.strictEqual(harness.state.leaseCalls, 1);
  assertNoWriterMutation(harness, before);
});

test('Writer 7 lock contention performs no lease assertion', () => {
  const harness = makeHarness({lockFailure: true});
  const before = clone(harness.state);
  expectError(() => harness.execute(validInvocation), /ScriptLock is contended/);
  assert.strictEqual(harness.state.leaseCalls, 0);
  assertNoWriterMutation(harness, before);
});

if (failures) {
  console.error();
  console.error(
    failures +
    ' Gate 2B Batch-1 executor validation(s) FAILED.'
  );

  process.exit(1);
}


console.log();
console.log(
  'Gate 2B Batch-1 durable identity migration executor validation PASSED.'
);

console.log();

if (productionEvidenceMode) {
  console.log(
    'productionEvidenceMode=true'
  );

  console.log(
    'nextMigrationPlanSha256=' +
    expectedPost
      .migrationPlanSha256
  );

  console.log(
    'nextCompletePlanSha256=' +
    expectedPost
      .completePlanSha256
  );
} else {
  console.log(
    'productionEvidenceMode=false'
  );

  console.log(
    'repositoryFixtureMode=true'
  );

  console.log(
    'certifiedProductionNextMigrationPlanSha256=' +
    CERTIFIED_NEXT_MIGRATION_SHA
  );

  console.log(
    'certifiedProductionNextCompletePlanSha256=' +
    CERTIFIED_NEXT_COMPLETE_SHA
  );
}

console.log(
  'expectedPostMigrationRequiredRows=' +
  expectedPost
    .migrationRequiredRows
);

console.log(
  'expectedPostAlreadyDurableRows=' +
  expectedPost
    .alreadyDurableRows
);

console.log('writer7_batch1_behavior_cases=' + writer7TestsRun);
console.log('WRITER_7_LEASE_BOUNDARY_BEHAVIOR_PASSED=true');
