#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const cp =
  require('node:child_process');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const BASE =
  'f3cfe44ed75233213a00c66cd93eec0c0526b8c0';

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const HARNESS =
  'scripts/validate-county-mutation-exclusion-lease-v1.js';

const STATE_KEY =
  'REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON';

const WINNER_FINGERPRINT =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const AUTHORITY_SHA =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const SCHEDULER_HANDLER =
  'reosCountyProductionSchedulerRun';

const CYCLE =
  'COUNTY-20260902222607805';

const CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const SETTLE_MS =
  600000;

const WINDOW_MS =
  3600000;

const PROTECTED_WRITERS = [
  'COUNTY_PRODUCTION_SCHEDULER',
  'COUNTY_CONNECTOR_LIVE_PERSISTENCE',
  'COUNTY_CHECKPOINT_RECOVERY',
  'COUNTY_C1_SCHEMA_MIGRATION',
  'COUNTY_C1_INSERT_RECOVERY',
  'CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL',
  'CODE_VIOLATION_DURABLE_IDENTITY_BATCH1',
  'CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN',
  'CODE_VIOLATION_DURABLE_IDENTITY_ROLLING',
  'CODE_VIOLATION_GATE1_RECOVERY',
  'PAGE85_SOURCE_OBSERVATION_214_REPAIR',
  'PAGE86_DUPLICATE_SOURCE_REPAIR'
];

const OWNER_WRITER =
  'CODE_VIOLATION_COLLAPSE_EXECUTOR';

const PROTECTED_FILES = [
  'build/apps-script-brand/CountyProductionScheduler.js',
  'build/apps-script-brand/CountyConnectorSDK.js',
  'build/apps-script-brand/CountyCheckpointRecovery.js',
  'build/apps-script-brand/CountyC1SchemaMigration.js',
  'build/apps-script-brand/CountyC1InsertRecovery.js',
  'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationBatch1Executor.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js',
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js',
  'build/apps-script-brand/CountyPage85SourceObservation214Repair.js',
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js'
];

const AUTHORITY_FLAGS = [
  'leaseGrantsMutationAuthority',
  'writerMutationAuthority',
  'productionMutationAuthority',
  'physicalDeleteAuthority',
  'schedulerMutationAuthority',
  'checkpointMutationAuthority',
  'connectorExecutionAuthority',
  'automaticOfferAuthority'
];

const source =
  fs.readFileSync(
    LEASE,
    'utf8'
  );

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function frozenCheckpoint() {
  return {
    id:
      CYCLE,

    startedAt:
      '2026-09-02T22:26:07.805Z',

    nextFeedIndex:
      0,

    currentFeedCursor:
      CURSOR,

    completedFeeds:
      0,

    totalFeeds:
      4,

    results:
      []
  };
}

function makeFakeDate(state) {
  const RealDate =
    Date;

  function FakeDate(...args) {
    if (
      !(this instanceof FakeDate)
    ) {
      return new RealDate(
        state.nowMs
      ).toString();
    }

    if (
      args.length === 0
    ) {
      return new RealDate(
        state.nowMs
      );
    }

    return new RealDate(
      ...args
    );
  }

  FakeDate.now =
    () => state.nowMs;

  FakeDate.parse =
    RealDate.parse;

  FakeDate.UTC =
    RealDate.UTC;

  FakeDate.prototype =
    RealDate.prototype;

  return FakeDate;
}

function createHarness(options = {}) {
  const state = {
    nowMs:
      options.nowMs ||
      Date.parse(
        '2026-09-15T12:30:00.000Z'
      ),

    properties:
      new Map(),

    propertyWrites:
      0,

    scriptPropertyReads:
      0,

    adminCalls:
      0,

    managedTriggerCount:
      Object.prototype
        .hasOwnProperty
        .call(
          options,
          'managedTriggerCount'
        )
        ? options.managedTriggerCount
        : 0,

    triggerReads:
      0,

    checkpoint:
      clone(
        options.checkpoint ||
        frozenCheckpoint()
      ),

    checkpointReads:
      0,

    uuidCounter:
      0,

    scriptLockAcquisitions:
      0,

    scriptLockReleases:
      0,

    dbLockAssertions:
      0,

    validLockContext:
      {
        kind:
          'VALID_DATABASE_LOCK_CONTEXT'
      },

    validLockContextActive:
      true
  };

  if (
    Object.prototype
      .hasOwnProperty
      .call(
        options,
        'rawState'
      )
  ) {
    state.properties.set(
      STATE_KEY,
      options.rawState
    );
  }

  const REOS = {};

  if (!options.missingAdminSupport) {
    REOS.Security = {
      requireAdmin() {
        state.adminCalls++;

        if (
          options.adminAllowed ===
          false
        ) {
          throw new Error(
            'ADMIN_DENIED'
          );
        }

        return true;
      }
    };
  }

  if (!options.missingCheckpointSupport) {
    REOS.CountyProductionScheduler = {
      getCheckpoint() {
        state.checkpointReads++;

        return clone(
          state.checkpoint
        );
      }
    };
  }

  REOS.Database = {
    assertScriptLockContext(
      context
    ) {
      state.dbLockAssertions++;

      if (
        context !==
          state.validLockContext ||
        !state.validLockContextActive
      ) {
        throw new Error(
          'INVALID_DATABASE_LOCK_CONTEXT'
        );
      }

      return true;
    }
  };

  const sandbox = {
    REOS:
      REOS,

    console:
      console,

    Date:
      makeFakeDate(
        state
      )
  };

  if (!options.missingPropertiesSupport) {
    sandbox.PropertiesService = {
      getScriptProperties() {
        return {
          getProperty(key) {
            state.scriptPropertyReads++;

            return state.properties
              .has(key)
                ? state.properties
                    .get(key)
                : null;
          },

          setProperty(
            key,
            value
          ) {
            state.propertyWrites++;

            state.properties.set(
              String(key),
              String(value)
            );
          }
        };
      }
    };
  }

  const utilities = {
    DigestAlgorithm: {
      SHA_256:
        'SHA_256'
    }
  };

  if (!options.missingUuidSupport) {
    utilities.getUuid =
      function () {
        state.uuidCounter++;

        return (
          '00000000-0000-4000-8000-' +
          String(
            state.uuidCounter
          ).padStart(
            12,
            '0'
          )
        );
      };
  }

  if (!options.missingShaSupport) {
    utilities.computeDigest =
      function (
        algorithm,
        value
      ) {
        assert.equal(
          algorithm,
          'SHA_256'
        );

        const bytes =
          crypto
            .createHash('sha256')
            .update(
              String(value),
              'utf8'
            )
            .digest();

        return Array.from(
          bytes,
          byte =>
            byte > 127
              ? byte - 256
              : byte
        );
      };
  }

  sandbox.Utilities =
    utilities;

  if (!options.missingTriggerInspection) {
    sandbox.ScriptApp = {
      getProjectTriggers() {
        state.triggerReads++;

        return Array.from(
          {
            length:
              state
                .managedTriggerCount
          },
          () => ({
            getHandlerFunction() {
              return SCHEDULER_HANDLER;
            }
          })
        );
      }
    };
  }

  if (!options.missingScriptLockSupport) {
    sandbox.LockService = {
      getScriptLock() {
        state.scriptLockAcquisitions++;

        let held =
          false;

        return {
          tryLock() {
            if (
              options.lockContended
            ) {
              return false;
            }

            held =
              true;

            return true;
          },

          hasLock() {
            return held;
          },

          releaseLock() {
            if (held) {
              held =
                false;

              state.scriptLockReleases++;
            }
          }
        };
      }
    };
  }

  const context =
    vm.createContext(
      sandbox
    );

  vm.runInContext(
    source,
    context,
    {
      filename:
        LEASE
    }
  );

  return {
    api:
      context.REOS
        .CountyMutationExclusionLease,

    state:
      state,

    context:
      context
  };
}

function openOptions(overrides = {}) {
  return Object.assign(
    {
      confirmExclusiveLease:
        true,

      confirmManualExternalWritersQuiescent:
        true,

      ownerGateId:
        'COLLAPSE-GATE-1',

      expectedWinnerPlanFingerprintSha256:
        WINNER_FINGERPRINT,

      expectedAuthoritySha256:
        AUTHORITY_SHA
    },
    overrides
  );
}

function ownerOptions(
  opened,
  overrides = {}
) {
  return Object.assign(
    {
      leaseToken:
        opened.leaseToken,

      expectedLeaseId:
        opened.leaseId,

      expectedOwnerGateId:
        opened.ownerGateId,

      expectedWinnerPlanFingerprintSha256:
        WINNER_FINGERPRINT,

      expectedAuthoritySha256:
        AUTHORITY_SHA
    },
    overrides
  );
}

function closeOptions(
  opened,
  overrides = {}
) {
  return Object.assign(
    {
      confirmClose:
        true,

      leaseToken:
        opened.leaseToken,

      expectedLeaseId:
        opened.leaseId,

      expectedOwnerGateId:
        opened.ownerGateId
    },
    overrides
  );
}

function persisted(harness) {
  const raw =
    harness.state
      .properties
      .get(
        STATE_KEY
      );

  assert.equal(
    typeof raw,
    'string'
  );

  return JSON.parse(
    raw
  );
}

function replacePersisted(
  harness,
  transform
) {
  const value =
    persisted(
      harness
    );

  transform(
    value
  );

  harness.state
    .properties
    .set(
      STATE_KEY,
      JSON.stringify(value)
    );
}

function settle(harness) {
  harness.state.nowMs +=
    SETTLE_MS;
}

function expire(harness) {
  harness.state.nowMs +=
    WINDOW_MS;
}

function assertAuthorityFree(
  result
) {
  AUTHORITY_FLAGS
    .forEach(flag => {
      assert.equal(
        result[flag],
        false,
        flag +
        ' must remain false'
      );
    });
}

function expectThrow(
  work,
  pattern
) {
  assert.throws(
    work,
    pattern
  );
}

let caseCount =
  0;

function test(
  number,
  name,
  work
) {
  assert.equal(
    number,
    caseCount + 1,
    'Harness case numbering drifted.'
  );

  work();

  caseCount++;

  console.log(
    'PASS ' +
    String(number)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

console.log(
  '=== COUNTY MUTATION-EXCLUSION LEASE RUNTIME V1 ==='
);

test(
  1,
  'missing Admin support blocks open',
  () => {
    const h =
      createHarness({
        missingAdminSupport:
          true
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /Admin support/
    );
  }
);

test(
  2,
  'missing Script Properties blocks open',
  () => {
    const h =
      createHarness({
        missingPropertiesSupport:
          true
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /Script Properties/
    );
  }
);

test(
  3,
  'missing UUID support blocks open',
  () => {
    const h =
      createHarness({
        missingUuidSupport:
          true
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /UUID/
    );
  }
);

test(
  4,
  'missing SHA-256 support blocks open',
  () => {
    const h =
      createHarness({
        missingShaSupport:
          true
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /SHA-256/
    );
  }
);

test(
  5,
  'missing trigger inspection blocks open',
  () => {
    const h =
      createHarness({
        missingTriggerInspection:
          true
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /trigger inspection/
    );
  }
);

test(
  6,
  'missing checkpoint support blocks open',
  () => {
    const h =
      createHarness({
        missingCheckpointSupport:
          true
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /checkpoint support/
    );
  }
);

test(
  7,
  'unknown open option fails closed',
  () => {
    const h =
      createHarness();

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions({
            unauthorizedOption:
              true
          })
        ),
      /unknown field/
    );
  }
);

test(
  8,
  'missing exclusive confirmation fails closed',
  () => {
    const h =
      createHarness();

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions({
            confirmExclusiveLease:
              false
          })
        ),
      /exclusive-lease confirmation/
    );
  }
);

test(
  9,
  'missing manual external writer confirmation fails closed',
  () => {
    const h =
      createHarness();

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions({
            confirmManualExternalWritersQuiescent:
              false
          })
        ),
      /quiescence confirmation/
    );
  }
);

test(
  10,
  'blank owner gate ID fails closed',
  () => {
    const h =
      createHarness();

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions({
            ownerGateId:
              '   '
          })
        ),
      /gate ID/
    );
  }
);

test(
  11,
  'wrong winner-plan fingerprint fails closed',
  () => {
    const h =
      createHarness();

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions({
            expectedWinnerPlanFingerprintSha256:
              '0'.repeat(64)
          })
        ),
      /Winner-plan fingerprint/
    );
  }
);

test(
  12,
  'wrong collapse authority SHA fails closed',
  () => {
    const h =
      createHarness();

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions({
            expectedAuthoritySha256:
              '0'.repeat(64)
          })
        ),
      /Collapse authority SHA/
    );
  }
);

test(
  13,
  'armed scheduler blocks open',
  () => {
    const h =
      createHarness({
        managedTriggerCount:
          1
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /scheduler must remain frozen/
    );
  }
);

test(
  14,
  'checkpoint drift blocks open',
  () => {
    const checkpoint =
      frozenCheckpoint();

    checkpoint.currentFeedCursor =
      'DRIFT';

    const h =
      createHarness({
        checkpoint:
          checkpoint
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /Frozen county checkpoint changed/
    );
  }
);

test(
  15,
  'active unexpired lease cannot be replaced',
  () => {
    const h =
      createHarness();

    h.api.openExclusive(
      openOptions()
    );

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions({
            ownerGateId:
              'COLLAPSE-GATE-2'
          })
        ),
      /cannot be replaced/
    );
  }
);

test(
  16,
  'malformed existing state cannot be replaced',
  () => {
    const h =
      createHarness({
        rawState:
          '{'
      });

    expectThrow(
      () =>
        h.api.openExclusive(
          openOptions()
        ),
      /Malformed lease state cannot be replaced/
    );
  }
);

test(
  17,
  'valid open persists token SHA and exact bindings',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    const state =
      persisted(h);

    assert.equal(
      state.contractVersion,
      1
    );

    assert.equal(
      state.status,
      'OPEN'
    );

    assert.equal(
      state.leaseScope,
      'REOS_COUNTY_PRODUCTION_MUTATION'
    );

    assert.equal(
      state.ownerMode,
      'CODE_VIOLATION_COLLAPSE'
    );

    assert.equal(
      state.ownerWriterId,
      OWNER_WRITER
    );

    assert.equal(
      state.ownerMaintenanceGateId,
      'COLLAPSE-GATE-1'
    );

    assert.equal(
      state.leaseTokenSha256,
      sha256(
        opened.leaseToken
      )
    );

    assert.equal(
      state.winnerPlanFingerprintSha256,
      WINNER_FINGERPRINT
    );

    assert.equal(
      state.collapseAuthoritySha256,
      AUTHORITY_SHA
    );

    assert.equal(
      state.schedulerHandler,
      SCHEDULER_HANDLER
    );

    assert.equal(
      state.protectedWriterInventoryVersion,
      1
    );

    assert.equal(
      state.manualExternalWritersQuiescentCertified,
      true
    );

    assert.deepEqual(
      state.checkpoint,
      {
        cycleId:
          CYCLE,

        nextFeedIndex:
          0,

        currentFeedCursor:
          CURSOR,

        completedFeeds:
          0,

        totalFeeds:
          4,

        results:
          []
      }
    );

    assert.equal(
      state.closedAt,
      ''
    );

    assert.equal(
      JSON.stringify(
        state
      ).includes(
        opened.leaseToken
      ),
      false
    );

    assertAuthorityFree(
      opened
    );
  }
);

test(
  18,
  'settling interval blocks owner readiness',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /settling interval/
    );
  }
);

test(
  19,
  'incorrect lease token fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened,
            {
              leaseToken:
                'WRONG'
            }
          )
        ),
      /Lease token does not match/
    );
  }
);

test(
  20,
  'incorrect lease ID fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened,
            {
              expectedLeaseId:
                'WRONG'
            }
          )
        ),
      /Lease ID does not match/
    );
  }
);

test(
  21,
  'owner gate ID drift fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened,
            {
              expectedOwnerGateId:
                'WRONG'
            }
          )
        ),
      /gate ID does not match/
    );
  }
);

test(
  22,
  'persisted winner fingerprint drift fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    replacePersisted(
      h,
      state => {
        state.winnerPlanFingerprintSha256 =
          '0'.repeat(64);
      }
    );

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /malformed/
    );
  }
);

test(
  23,
  'persisted authority SHA drift fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    replacePersisted(
      h,
      state => {
        state.collapseAuthoritySha256 =
          '0'.repeat(64);
      }
    );

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /malformed/
    );
  }
);

test(
  24,
  'inventory version drift fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    replacePersisted(
      h,
      state => {
        state.protectedWriterInventoryVersion =
          2;
      }
    );

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /malformed/
    );
  }
);

test(
  25,
  'manual external writer certification drift fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    replacePersisted(
      h,
      state => {
        state.manualExternalWritersQuiescentCertified =
          false;
      }
    );

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /malformed/
    );
  }
);

test(
  26,
  'scheduler re-arm invalidates owner readiness',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    h.state.managedTriggerCount =
      1;

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /scheduler must remain frozen/
    );
  }
);

test(
  27,
  'checkpoint drift after open invalidates owner readiness',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    h.state.checkpoint.nextFeedIndex =
      1;

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /Frozen county checkpoint changed/
    );
  }
);

test(
  28,
  'expired lease grants no owner readiness',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    expire(h);

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened
          )
        ),
      /Lease has expired/
    );
  }
);

test(
  29,
  'valid owner readiness is authority-free',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    const ready =
      h.api.assertOwnerReady(
        ownerOptions(
          opened
        )
      );

    assert.equal(
      ready.ok,
      true
    );

    assert.equal(
      ready.ready,
      true
    );

    assert.equal(
      ready.state,
      'SETTLED'
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          ready,
          'leaseToken'
        ),
      false
    );

    assertAuthorityFree(
      ready
    );
  }
);

test(
  30,
  'every protected non-owner writer is blocked by active lease',
  () => {
    const h =
      createHarness();

    h.api.openExclusive(
      openOptions()
    );

    PROTECTED_WRITERS
      .forEach(writerId => {
        expectThrow(
          () =>
            h.api.assertWriterAllowed({
              writerId:
                writerId
            }),
          /Active collapse lease blocks/
        );
      });
  }
);

test(
  31,
  'collapse owner is rejected by writer guard',
  () => {
    const h =
      createHarness();

    expectThrow(
      () =>
        h.api.assertWriterAllowed({
          writerId:
            OWNER_WRITER
        }),
      /must use assertOwnerReady/
    );
  }
);

test(
  32,
  'known writer allowed when lease absent',
  () => {
    const h =
      createHarness();

    const result =
      h.api.assertWriterAllowed({
        writerId:
          PROTECTED_WRITERS[0]
      });

    assert.equal(
      result.allowed,
      true
    );

    assert.equal(
      result.leaseState,
      'ABSENT'
    );

    assertAuthorityFree(
      result
    );
  }
);

test(
  33,
  'known writer allowed after durable close',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    h.api.close(
      closeOptions(
        opened
      )
    );

    const result =
      h.api.assertWriterAllowed({
        writerId:
          PROTECTED_WRITERS[1]
      });

    assert.equal(
      result.allowed,
      true
    );

    assert.equal(
      result.leaseState,
      'CLOSED'
    );

    assertAuthorityFree(
      result
    );
  }
);

test(
  34,
  'known writer allowed after well-formed expiry',
  () => {
    const h =
      createHarness();

    h.api.openExclusive(
      openOptions()
    );

    expire(h);

    const result =
      h.api.assertWriterAllowed({
        writerId:
          PROTECTED_WRITERS[2]
      });

    assert.equal(
      result.allowed,
      true
    );

    assert.equal(
      result.leaseState,
      'EXPIRED'
    );

    assertAuthorityFree(
      result
    );
  }
);

test(
  35,
  'malformed state blocks protected writers',
  () => {
    const h =
      createHarness({
        rawState:
          '{'
      });

    expectThrow(
      () =>
        h.api.assertWriterAllowed({
          writerId:
            PROTECTED_WRITERS[0]
        }),
      /Malformed lease state/
    );
  }
);

test(
  36,
  'unknown writer fails with or without active lease',
  () => {
    const absent =
      createHarness();

    expectThrow(
      () =>
        absent.api
          .assertWriterAllowed({
            writerId:
              'UNKNOWN_WRITER'
          }),
      /Unknown protected writer ID/
    );

    const active =
      createHarness();

    active.api.openExclusive(
      openOptions()
    );

    expectThrow(
      () =>
        active.api
          .assertWriterAllowed({
            writerId:
              'UNKNOWN_WRITER'
          }),
      /Unknown protected writer ID/
    );
  }
);

test(
  37,
  'valid caller-owned Database lock context is accepted',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    const ready =
      h.api.assertOwnerReady(
        ownerOptions(
          opened,
          {
            lockContext:
              h.state
                .validLockContext
          }
        )
      );

    assert.equal(
      ready.ready,
      true
    );

    assert.equal(
      h.state
        .dbLockAssertions,
      1
    );
  }
);

test(
  38,
  'forged Database lock context fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened,
            {
              lockContext:
                {
                  forged:
                    true
                }
            }
          )
        ),
      /INVALID_DATABASE_LOCK_CONTEXT/
    );
  }
);

test(
  39,
  'stale revoked Database lock context fails closed',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    h.state
      .validLockContextActive =
      false;

    expectThrow(
      () =>
        h.api.assertOwnerReady(
          ownerOptions(
            opened,
            {
              lockContext:
                h.state
                  .validLockContext
            }
          )
        ),
      /INVALID_DATABASE_LOCK_CONTEXT/
    );
  }
);

test(
  40,
  'assertion APIs acquire no ScriptLock',
  () => {
    const writer =
      createHarness();

    assert.equal(
      writer.state
        .scriptLockAcquisitions,
      0
    );

    writer.api
      .assertWriterAllowed({
        writerId:
          PROTECTED_WRITERS[0]
      });

    assert.equal(
      writer.state
        .scriptLockAcquisitions,
      0
    );

    const owner =
      createHarness();

    const opened =
      owner.api.openExclusive(
        openOptions()
      );

    settle(owner);

    const afterOpen =
      owner.state
        .scriptLockAcquisitions;

    owner.api.assertOwnerReady(
      ownerOptions(
        opened
      )
    );

    assert.equal(
      owner.state
        .scriptLockAcquisitions,
      afterOpen
    );
  }
);

test(
  41,
  'close requires explicit confirmation',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    expectThrow(
      () =>
        h.api.close(
          closeOptions(
            opened,
            {
              confirmClose:
                false
            }
          )
        ),
      /close confirmation/
    );
  }
);

test(
  42,
  'close rejects wrong token',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    expectThrow(
      () =>
        h.api.close(
          closeOptions(
            opened,
            {
              leaseToken:
                'WRONG'
            }
          )
        ),
      /Lease token does not match/
    );
  }
);

test(
  43,
  'close rejects wrong lease ID',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    expectThrow(
      () =>
        h.api.close(
          closeOptions(
            opened,
            {
              expectedLeaseId:
                'WRONG'
            }
          )
        ),
      /Lease ID does not match/
    );
  }
);

test(
  44,
  'close rejects wrong owner gate ID',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    expectThrow(
      () =>
        h.api.close(
          closeOptions(
            opened,
            {
              expectedOwnerGateId:
                'WRONG'
            }
          )
        ),
      /gate ID does not match/
    );
  }
);

test(
  45,
  'close writes durable CLOSED state',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    const before =
      persisted(h);

    const result =
      h.api.close(
        closeOptions(
          opened
        )
      );

    const after =
      persisted(h);

    assert.equal(
      result.closed,
      true
    );

    assert.equal(
      after.status,
      'CLOSED'
    );

    assert.equal(
      after.leaseId,
      before.leaseId
    );

    assert.equal(
      after.ownerMaintenanceGateId,
      before.ownerMaintenanceGateId
    );

    assert.equal(
      after.leaseTokenSha256,
      before.leaseTokenSha256
    );

    assert.equal(
      after.openedAt,
      before.openedAt
    );

    assert.equal(
      after.notBefore,
      before.notBefore
    );

    assert.equal(
      after.expiresAt,
      before.expiresAt
    );

    assert.ok(
      after.closedAt
    );

    assertAuthorityFree(
      result
    );
  }
);

test(
  46,
  'status is read-only and exposes no raw token',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    const rawBefore =
      h.state.properties
        .get(
          STATE_KEY
        );

    const writesBefore =
      h.state
        .propertyWrites;

    const result =
      h.api.status();

    assert.equal(
      h.state.properties
        .get(
          STATE_KEY
        ),
      rawBefore
    );

    assert.equal(
      h.state
        .propertyWrites,
      writesBefore
    );

    assert.equal(
      JSON.stringify(
        result
      ).includes(
        opened.leaseToken
      ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          result,
          'leaseTokenSha256'
        ),
      false
    );

    assertAuthorityFree(
      result
    );
  }
);

test(
  47,
  'all public authority flags remain false',
  () => {
    const h =
      createHarness();

    const opened =
      h.api.openExclusive(
        openOptions()
      );

    settle(h);

    const status =
      h.api.status();

    const ready =
      h.api.assertOwnerReady(
        ownerOptions(
          opened
        )
      );

    const writerHarness =
      createHarness();

    const writer =
      writerHarness.api
        .assertWriterAllowed({
          writerId:
            PROTECTED_WRITERS[0]
        });

    assertAuthorityFree(
      opened
    );

    assertAuthorityFree(
      status
    );

    assertAuthorityFree(
      ready
    );

    assertAuthorityFree(
      writer
    );
  }
);

test(
  48,
  'public module API is exactly five methods',
  () => {
    const h =
      createHarness();

    assert.deepEqual(
      Object.keys(
        h.api
      ).sort(),
      [
        'assertOwnerReady',
        'assertWriterAllowed',
        'close',
        'openExclusive',
        'status'
      ]
    );

    Object.keys(
      h.api
    ).forEach(name => {
      assert.equal(
        typeof h.api[name],
        'function'
      );
    });
  }
);

test(
  49,
  'generic Apps Script lease RPC remains absent',
  () => {
    assert.equal(
      /function\s+reosCountyMutationExclusionLease/
        .test(
          source
        ),
      false
    );

    const grep =
      cp.spawnSync(
        'git',
        [
          'grep',
          '-n',
          'function reosCountyMutationExclusionLease',
          '--',
          'build/apps-script-brand'
        ],
        {
          encoding:
            'utf8'
        }
      );

    assert.equal(
      grep.status,
      1
    );

    assert.equal(
      grep.stdout.trim(),
      ''
    );

    assert.equal(
      grep.stderr.trim(),
      ''
    );
  }
);

test(
  50,
  'no protected writer source is modified by runtime lease implementation',
  () => {
    PROTECTED_FILES
      .forEach(file => {
        const committed =
          cp.spawnSync(
            'git',
            [
              'diff',
              '--quiet',
              BASE,
              '--',
              file
            ]
          );

        assert.equal(
          committed.status,
          0,
          'Protected writer changed: ' +
          file
        );

        const working =
          cp.execFileSync(
            'git',
            [
              'status',
              '--porcelain',
              '--',
              file
            ],
            {
              encoding:
                'utf8'
            }
          ).trim();

        assert.equal(
          working,
          '',
          'Protected writer has working-tree changes: ' +
          file
        );
      });
  }
);

assert.equal(
  caseCount,
  50
);

console.log(
  'runtime_cases=' +
  caseCount
);

console.log(
  'COUNTY_MUTATION_EXCLUSION_LEASE_RUNTIME_VALIDATION_PASSED=true'
);
