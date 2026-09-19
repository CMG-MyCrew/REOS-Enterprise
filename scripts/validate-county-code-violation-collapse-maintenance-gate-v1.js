#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const LEASE_FILE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const GATE_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js';

const STATE_KEY =
  'REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON';

const CURRENT_WINNER =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const CURRENT_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const HISTORICAL_WINNER =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const HISTORICAL_AUTHORITY =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const CYCLE =
  'COUNTY-20260902222607805';

const CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const leaseSource =
  fs.readFileSync(
    LEASE_FILE,
    'utf8'
  );

const gateSource =
  fs.readFileSync(
    GATE_FILE,
    'utf8'
  );

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function checkpoint() {
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

function fakeDate(state) {
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
    () =>
      state.nowMs;

  FakeDate.parse =
    RealDate.parse;

  FakeDate.UTC =
    RealDate.UTC;

  FakeDate.prototype =
    RealDate.prototype;

  return FakeDate;
}

function harness(options = {}) {
  const state = {
    nowMs:
      Date.parse(
        '2026-09-19T02:30:00.000Z'
      ),

    properties:
      new Map(),

    adminCalls:
      0,

    managedTriggerCount:
      options.managedTriggerCount || 0,

    checkpoint:
      clone(
        options.checkpoint ||
        checkpoint()
      ),

    uuidCounter:
      0,

    dbLockAssertions:
      0,

    validLockContext:
      {
        kind:
          'VALID_DATABASE_LOCK_CONTEXT'
      },

    transitionLocks:
      0,

    transitionReleases:
      0
  };

  const REOS = {};

  if (!options.noSecurity) {
    REOS.Security = {
      requireAdmin() {
        state.adminCalls++;
        return true;
      }
    };
  }

  REOS.CountyProductionScheduler = {
    getCheckpoint() {
      return clone(
        state.checkpoint
      );
    }
  };

  REOS.Database = {
    assertScriptLockContext(
      lockContext
    ) {
      state.dbLockAssertions++;

      if (
        lockContext !==
        state.validLockContext
      ) {
        throw new Error(
          'INVALID_DATABASE_LOCK_CONTEXT'
        );
      }

      return true;
    }
  };

  const sandbox = {
    REOS,
    console,

    Date:
      fakeDate(state),

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            return state.properties.has(key)
              ? state.properties.get(key)
              : null;
          },

          setProperty(
            key,
            value
          ) {
            state.properties.set(
              String(key),
              String(value)
            );
          }
        };
      }
    },

    Utilities: {
      DigestAlgorithm: {
        SHA_256:
          'SHA_256'
      },

      getUuid() {
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
      },

      computeDigest(
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
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return Array.from(
          {
            length:
              state.managedTriggerCount
          },
          () => ({
            getHandlerFunction() {
              return 'reosCountyProductionSchedulerRun';
            }
          })
        );
      }
    },

    LockService: {
      getScriptLock() {
        state.transitionLocks++;

        let held =
          false;

        return {
          tryLock() {
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

              state.transitionReleases++;
            }
          }
        };
      }
    }
  };

  const context =
    vm.createContext(
      sandbox
    );

  vm.runInContext(
    leaseSource,
    context,
    {
      filename:
        LEASE_FILE
    }
  );

  vm.runInContext(
    gateSource,
    context,
    {
      filename:
        GATE_FILE
    }
  );

  return {
    gate:
      context.REOS
        .CountyCodeViolationCollapseMaintenanceGate,

    lease:
      context.REOS
        .CountyMutationExclusionLease,

    state
  };
}

function opening(
  overrides = {}
) {
  return Object.assign(
    {
      confirmMaintenanceWindow:
        true,

      confirmManualExternalWritersQuiescent:
        true,

      expectedWinnerPlanFingerprintSha256:
        CURRENT_WINNER,

      expectedAuthoritySha256:
        CURRENT_AUTHORITY
    },
    overrides
  );
}

function readyOptions(
  opened,
  overrides = {}
) {
  return Object.assign(
    {
      maintenanceToken:
        opened.maintenanceToken,

      expectedLeaseId:
        opened.leaseId,

      expectedGateId:
        opened.gateId
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

      maintenanceToken:
        opened.maintenanceToken,

      expectedLeaseId:
        opened.leaseId,

      expectedGateId:
        opened.gateId
    },
    overrides
  );
}

function stored(h) {
  return JSON.parse(
    h.state.properties.get(
      STATE_KEY
    )
  );
}

function settle(h) {
  const value =
    stored(h);

  h.state.nowMs =
    Date.parse(
      value.notBefore
    );
}

const AUTHORITY_FIELDS = [
  'collapseExecutionAuthorityGranted',
  'mutationAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'insertAuthorityGranted',
  'updateAuthorityGranted',
  'deleteAuthorityGranted',
  'physicalDeleteAuthorityGranted',
  'schedulerAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'migrationAuthorityGranted',
  'repairAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

function assertAuthorityFree(result) {
  AUTHORITY_FIELDS
    .forEach(field => {
      assert.equal(
        result[field],
        false,
        field
      );
    });
}

let count =
  0;

function test(
  number,
  name,
  work
) {
  assert.equal(
    number,
    count + 1
  );

  work();

  count++;

  console.log(
    'PASS ' +
    String(number)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

console.log(
  '=== COUNTY CODE VIOLATION COLLAPSE MAINTENANCE GATE V1 ==='
);

test(
  1,
  'API is exactly open assertReady status close',
  () => {
    const h =
      harness();

    assert.deepEqual(
      Object.keys(h.gate)
        .sort(),
      [
        'assertReady',
        'close',
        'open',
        'status'
      ]
    );
  }
);

test(
  2,
  'missing Admin support fails closed',
  () => {
    const h =
      harness({
        noSecurity:
          true
      });

    assert.throws(
      () =>
        h.gate.open(
          opening()
        ),
      /Admin authority support/
    );
  }
);

test(
  3,
  'opening requires explicit maintenance-window confirmation',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.gate.open(
          opening({
            confirmMaintenanceWindow:
              false
          })
        ),
      /maintenance-window confirmation/
    );
  }
);

test(
  4,
  'opening requires explicit manual external-writer quiescence',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.gate.open(
          opening({
            confirmManualExternalWritersQuiescent:
              false
          })
        ),
      /Manual\/external-writer quiescence/
    );
  }
);

test(
  5,
  'wrong current winner fingerprint fails closed',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.gate.open(
          opening({
            expectedWinnerPlanFingerprintSha256:
              HISTORICAL_WINNER
          })
        ),
      /current certified authority/
    );
  }
);

test(
  6,
  'wrong current collapse authority fails closed',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.gate.open(
          opening({
            expectedAuthoritySha256:
              HISTORICAL_AUTHORITY
          })
        ),
      /current certified authority/
    );
  }
);

test(
  7,
  'managed county scheduler trigger blocks opening',
  () => {
    const h =
      harness({
        managedTriggerCount:
          1
      });

    assert.throws(
      () =>
        h.gate.open(
          opening()
        ),
      /scheduler must remain frozen/
    );
  }
);

test(
  8,
  'checkpoint mismatch blocks opening',
  () => {
    const drift =
      checkpoint();

    drift.currentFeedCursor =
      'DRIFT';

    const h =
      harness({
        checkpoint:
          drift
      });

    assert.throws(
      () =>
        h.gate.open(
          opening()
        ),
      /Frozen county checkpoint changed/
    );
  }
);

test(
  9,
  'open binds exact CURRENT authority and persists no raw token',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    const state =
      stored(h);

    assert.equal(
      opened.authorityGeneration,
      'CURRENT'
    );

    assert.equal(
      state.winnerPlanFingerprintSha256,
      CURRENT_WINNER
    );

    assert.equal(
      state.collapseAuthoritySha256,
      CURRENT_AUTHORITY
    );

    assert.equal(
      state.ownerMaintenanceGateId,
      opened.gateId
    );

    const raw =
      h.state.properties.get(
        STATE_KEY
      );

    assert.equal(
      raw.includes(
        opened.maintenanceToken
      ),
      false
    );

    assert.deepEqual(
      Array.from(
        h.state.properties.keys()
      ),
      [
        STATE_KEY
      ]
    );

    assertAuthorityFree(
      opened
    );
  }
);

test(
  10,
  'active current maintenance capability cannot be replaced',
  () => {
    const h =
      harness();

    h.gate.open(
      opening()
    );

    assert.throws(
      () =>
        h.gate.open(
          opening()
        ),
      /cannot be replaced/
    );
  }
);

test(
  11,
  'active maintenance lease blocks protected county writers',
  () => {
    const h =
      harness();

    h.gate.open(
      opening()
    );

    assert.throws(
      () =>
        h.lease
          .assertWriterAllowed({
            writerId:
              'COUNTY_PRODUCTION_SCHEDULER'
          }),
      /Active collapse lease blocks protected writer/
    );
  }
);

test(
  12,
  'settling interval is mandatory',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened
          )
        ),
      /settling interval/
    );
  }
);

test(
  13,
  'wrong maintenance token fails closed',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened,
            {
              maintenanceToken:
                'WRONG'
            }
          )
        ),
      /Lease token does not match/
    );
  }
);

test(
  14,
  'lease identity drift fails closed',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
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
  15,
  'gate identity drift fails closed',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened,
            {
              expectedGateId:
                'WRONG'
            }
          )
        ),
      /maintenance gate ID does not match/
    );
  }
);

test(
  16,
  'scheduler re-arm after open invalidates readiness',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    h.state.managedTriggerCount =
      1;

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened
          )
        ),
      /scheduler must remain frozen/
    );
  }
);

test(
  17,
  'checkpoint drift after open invalidates readiness',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    h.state
      .checkpoint
      .currentFeedCursor =
      'DRIFT';

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened
          )
        ),
      /Frozen county checkpoint changed/
    );
  }
);

test(
  18,
  'same capability revalidates under caller-owned Database lock',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    const ready =
      h.gate.assertReady(
        readyOptions(
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
      h.state.dbLockAssertions,
      1
    );
  }
);

test(
  19,
  'invalid caller-owned Database lock context fails closed',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened,
            {
              lockContext: {}
            }
          )
        ),
      /INVALID_DATABASE_LOCK_CONTEXT/
    );
  }
);

test(
  20,
  'settled readiness remains authority-free',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    settle(h);

    const ready =
      h.gate.assertReady(
        readyOptions(
          opened
        )
      );

    assert.equal(
      ready.maintenanceReady,
      true
    );

    assert.equal(
      ready.manualExternalWritersQuiescentCertified,
      true
    );

    assertAuthorityFree(
      ready
    );
  }
);

test(
  21,
  'expired capability grants no readiness',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    const state =
      stored(h);

    h.state.nowMs =
      Date.parse(
        state.expiresAt
      );

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened
          )
        ),
      /expired/
    );
  }
);

test(
  22,
  'status exposes no raw token and grants no readiness',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    const status =
      h.gate.status();

    assert.equal(
      status.maintenanceReady,
      false
    );

    assert.equal(
      JSON.stringify(status)
        .includes(
          opened.maintenanceToken
        ),
      false
    );

    assertAuthorityFree(
      status
    );
  }
);

test(
  23,
  'historical authority lease can never satisfy maintenance readiness',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    const state =
      stored(h);

    state.winnerPlanFingerprintSha256 =
      HISTORICAL_WINNER;

    state.collapseAuthoritySha256 =
      HISTORICAL_AUTHORITY;

    h.state.properties.set(
      STATE_KEY,
      JSON.stringify(state)
    );

    settle(h);

    assert.throws(
      () =>
        h.gate.assertReady(
          readyOptions(
            opened
          )
        ),
      /Only CURRENT authority lease/
    );
  }
);

test(
  24,
  'close requires explicit confirmation and exact token',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    assert.throws(
      () =>
        h.gate.close(
          closeOptions(
            opened,
            {
              confirmClose:
                false
            }
          )
        ),
      /Explicit close confirmation/
    );

    assert.throws(
      () =>
        h.gate.close(
          closeOptions(
            opened,
            {
              maintenanceToken:
                'WRONG'
            }
          )
        ),
      /Lease token does not match/
    );
  }
);

test(
  25,
  'exact close preserves current authority pair',
  () => {
    const h =
      harness();

    const opened =
      h.gate.open(
        opening()
      );

    const closed =
      h.gate.close(
        closeOptions(
          opened
        )
      );

    const state =
      stored(h);

    assert.equal(
      closed.closed,
      true
    );

    assert.equal(
      state.status,
      'CLOSED'
    );

    assert.equal(
      state.winnerPlanFingerprintSha256,
      CURRENT_WINNER
    );

    assert.equal(
      state.collapseAuthoritySha256,
      CURRENT_AUTHORITY
    );

    assertAuthorityFree(
      closed
    );
  }
);

test(
  26,
  'maintenance gate exposes no public RPC or independent persistence surface',
  () => {
    assert.equal(
      /function\s+reosCountyCodeViolationCollapseMaintenance/
        .test(
          gateSource
        ),
      false
    );

    assert.equal(
      gateSource.includes(
        'PropertiesService'
      ),
      false
    );

    assert.equal(
      gateSource.includes(
        'DURABLE_STATE_OWNER'
      ),
      true
    );
  }
);

assert.equal(
  count,
  26
);

console.log('');
console.log(
  'MAINTENANCE_GATE_BEHAVIOR_CASES=26'
);

console.log(
  'CURRENT_AUTHORITY_ONLY=true'
);

console.log(
  'MUTATION_EXCLUSION_LEASE_IS_DURABLE_STATE_OWNER=true'
);

console.log(
  'SAME_OUTER_DATABASE_LOCK_REVALIDATION_REQUIRED=true'
);

console.log(
  'MAINTENANCE_GATE_GRANTS_MUTATION_AUTHORITY=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);

console.log(
  'COLLAPSE_MAINTENANCE_GATE_BEHAVIOR_VALIDATION_PASSED=true'
);
