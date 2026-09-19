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

const LEASE =
  'build/apps-script-brand/CountyMutationExclusionLease.js';

const STATE_KEY =
  'REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON';

const HISTORICAL_WINNER =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const HISTORICAL_AUTHORITY =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const CURRENT_WINNER =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const CURRENT_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const CYCLE =
  'COUNTY-20260902222607805';

const CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const SCHEDULER_HANDLER =
  'reosCountyProductionSchedulerRun';

const SETTLE_MS =
  600000;

const WINDOW_MS =
  3600000;

const WRITER_ID =
  'COUNTY_PRODUCTION_SCHEDULER';

const HISTORICAL_TOKEN =
  'historical-token';

const CURRENT_TOKEN =
  'current-token';

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

function persistedCheckpoint() {
  return {
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
  };
}

function pair(generation) {
  if (generation === 'CURRENT') {
    return {
      winner:
        CURRENT_WINNER,

      authority:
        CURRENT_AUTHORITY,

      token:
        CURRENT_TOKEN
    };
  }

  if (generation === 'HISTORICAL') {
    return {
      winner:
        HISTORICAL_WINNER,

      authority:
        HISTORICAL_AUTHORITY,

      token:
        HISTORICAL_TOKEN
    };
  }

  throw new Error(
    'Unknown test generation.'
  );
}

function makeState(
  generation,
  lifecycle,
  nowMs,
  overrides = {}
) {
  const selected =
    pair(generation);

  let openedMs;

  if (
    lifecycle ===
    'EXPIRED_OPEN'
  ) {
    openedMs =
      nowMs -
      WINDOW_MS -
      1000;
  } else {
    openedMs =
      nowMs -
      SETTLE_MS -
      1000;
  }

  const state = {
    contractVersion:
      1,

    status:
      lifecycle === 'CLOSED'
        ? 'CLOSED'
        : 'OPEN',

    leaseScope:
      'REOS_COUNTY_PRODUCTION_MUTATION',

    leaseId:
      generation +
      '-LEASE-1',

    ownerMode:
      'CODE_VIOLATION_COLLAPSE',

    ownerWriterId:
      'CODE_VIOLATION_COLLAPSE_EXECUTOR',

    ownerMaintenanceGateId:
      generation +
      '-GATE-1',

    leaseTokenSha256:
      sha256(
        selected.token
      ),

    winnerPlanFingerprintSha256:
      selected.winner,

    collapseAuthoritySha256:
      selected.authority,

    checkpoint:
      persistedCheckpoint(),

    schedulerHandler:
      SCHEDULER_HANDLER,

    protectedWriterInventoryVersion:
      1,

    manualExternalWritersQuiescentCertified:
      true,

    openedAt:
      new Date(
        openedMs
      ).toISOString(),

    notBefore:
      new Date(
        openedMs +
        SETTLE_MS
      ).toISOString(),

    expiresAt:
      new Date(
        openedMs +
        WINDOW_MS
      ).toISOString(),

    closedAt:
      lifecycle === 'CLOSED'
        ? new Date(
            openedMs +
            1000
          ).toISOString()
        : ''
  };

  return Object.assign(
    state,
    overrides
  );
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
      options.nowMs ||
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      ),

    properties:
      new Map(),

    propertyWrites:
      0,

    adminCalls:
      0,

    triggerReads:
      0,

    checkpointReads:
      0,

    managedTriggerCount:
      options.managedTriggerCount ||
      0,

    checkpoint:
      clone(
        options.checkpoint ||
        checkpoint()
      ),

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
      }
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

  if (options.seed) {
    state.properties.set(
      STATE_KEY,
      JSON.stringify(
        options.seed
      )
    );
  }

  const REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls++;

        return true;
      }
    },

    CountyProductionScheduler: {
      getCheckpoint() {
        state.checkpointReads++;

        return clone(
          state.checkpoint
        );
      }
    },

    Database: {
      assertScriptLockContext(
        context
      ) {
        state.dbLockAssertions++;

        if (
          context !==
          state.validLockContext
        ) {
          throw new Error(
            'INVALID_DATABASE_LOCK_CONTEXT'
          );
        }

        return true;
      }
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
    },

    LockService: {
      getScriptLock() {
        state.scriptLockAcquisitions++;

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

              state.scriptLockReleases++;
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

    state
  };
}

function currentOpenOptions(
  overrides = {}
) {
  return Object.assign(
    {
      confirmExclusiveLease:
        true,

      confirmManualExternalWritersQuiescent:
        true,

      ownerGateId:
        'CURRENT-GATE-OPEN',

      expectedWinnerPlanFingerprintSha256:
        CURRENT_WINNER,

      expectedAuthoritySha256:
        CURRENT_AUTHORITY
    },
    overrides
  );
}

function ownerOptionsFor(
  state,
  token,
  overrides = {}
) {
  return Object.assign(
    {
      leaseToken:
        token,

      expectedLeaseId:
        state.leaseId,

      expectedOwnerGateId:
        state.ownerMaintenanceGateId,

      expectedWinnerPlanFingerprintSha256:
        CURRENT_WINNER,

      expectedAuthoritySha256:
        CURRENT_AUTHORITY
    },
    overrides
  );
}

function closeOptionsFor(
  state,
  token,
  overrides = {}
) {
  return Object.assign(
    {
      confirmClose:
        true,

      leaseToken:
        token,

      expectedLeaseId:
        state.leaseId,

      expectedOwnerGateId:
        state.ownerMaintenanceGateId
    },
    overrides
  );
}

function stored(h) {
  const raw =
    h.state.properties.get(
      STATE_KEY
    );

  assert.equal(
    typeof raw,
    'string'
  );

  return JSON.parse(raw);
}

function writerAllowed(h) {
  return h.api
    .assertWriterAllowed({
      writerId:
        WRITER_ID
    });
}

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

function assertAuthorityFree(result) {
  AUTHORITY_FLAGS
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
  '=== COUNTY MUTATION-EXCLUSION LEASE AUTHORITY COMPATIBILITY RUNTIME V1 ==='
);

test(
  1,
  'ABSENT permits protected writer',
  () => {
    const h =
      harness();

    const result =
      writerAllowed(h);

    assert.equal(
      result.allowed,
      true
    );

    assert.equal(
      result.leaseState,
      'ABSENT'
    );
  }
);

test(
  2,
  'CURRENT CLOSED permits protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'CURRENT',
            'CLOSED',
            now
          )
      });

    const result =
      writerAllowed(h);

    assert.equal(
      result.authorityGeneration,
      'CURRENT'
    );
  }
);

test(
  3,
  'CURRENT expired OPEN permits protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'CURRENT',
            'EXPIRED_OPEN',
            now
          )
      });

    assert.equal(
      writerAllowed(h)
        .leaseState,
      'EXPIRED'
    );
  }
);

test(
  4,
  'CURRENT active OPEN blocks protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'CURRENT',
            'ACTIVE_OPEN',
            now
          )
      });

    assert.throws(
      () =>
        writerAllowed(h),
      /Active collapse lease blocks/
    );
  }
);

test(
  5,
  'HISTORICAL CLOSED permits protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'HISTORICAL',
            'CLOSED',
            now
          )
      });

    const result =
      writerAllowed(h);

    assert.equal(
      result.authorityGeneration,
      'HISTORICAL'
    );
  }
);

test(
  6,
  'HISTORICAL expired OPEN permits protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'HISTORICAL',
            'EXPIRED_OPEN',
            now
          )
      });

    assert.equal(
      writerAllowed(h)
        .leaseState,
      'EXPIRED'
    );
  }
);

test(
  7,
  'HISTORICAL active OPEN blocks protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'HISTORICAL',
            'ACTIVE_OPEN',
            now
          )
      });

    assert.throws(
      () =>
        writerAllowed(h),
      /Active collapse lease blocks/
    );
  }
);

test(
  8,
  'unknown authority pair blocks protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'CLOSED',
        now,
        {
          winnerPlanFingerprintSha256:
            '1'.repeat(64),

          collapseAuthoritySha256:
            '2'.repeat(64)
        }
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        writerAllowed(h),
      /Malformed lease state blocks/
    );
  }
);

test(
  9,
  'mixed authority generations block protected writer',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'CLOSED',
        now,
        {
          winnerPlanFingerprintSha256:
            HISTORICAL_WINNER,

          collapseAuthoritySha256:
            CURRENT_AUTHORITY
        }
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        writerAllowed(h),
      /Malformed lease state blocks/
    );
  }
);

test(
  10,
  'structurally malformed state blocks protected writer',
  () => {
    const h =
      harness({
        rawState:
          '{"status":"OPEN"}'
      });

    assert.throws(
      () =>
        writerAllowed(h),
      /Malformed lease state blocks/
    );
  }
);

test(
  11,
  'CURRENT active OPEN becomes owner-ready after settle',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    const result =
      h.api
        .assertOwnerReady(
          ownerOptionsFor(
            seed,
            CURRENT_TOKEN
          )
        );

    assert.equal(
      result.ready,
      true
    );

    assert.equal(
      result.authorityGeneration,
      'CURRENT'
    );
  }
);

test(
  12,
  'HISTORICAL active OPEN can never become owner-ready',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'HISTORICAL',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .assertOwnerReady(
            ownerOptionsFor(
              seed,
              HISTORICAL_TOKEN
            )
          ),
      /Only CURRENT authority/
    );
  }
);

test(
  13,
  'expired CURRENT OPEN cannot become owner-ready',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'EXPIRED_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .assertOwnerReady(
            ownerOptionsFor(
              seed,
              CURRENT_TOKEN
            )
          ),
      /expired/
    );
  }
);

test(
  14,
  'expired HISTORICAL OPEN cannot become owner-ready',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'HISTORICAL',
        'EXPIRED_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .assertOwnerReady(
            ownerOptionsFor(
              seed,
              HISTORICAL_TOKEN
            )
          ),
      /Only CURRENT authority/
    );
  }
);

test(
  15,
  'CURRENT CLOSED cannot become owner-ready',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'CLOSED',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .assertOwnerReady(
            ownerOptionsFor(
              seed,
              CURRENT_TOKEN
            )
          ),
      /not OPEN/
    );
  }
);

test(
  16,
  'HISTORICAL CLOSED cannot become owner-ready',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'HISTORICAL',
        'CLOSED',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .assertOwnerReady(
            ownerOptionsFor(
              seed,
              HISTORICAL_TOKEN
            )
          ),
      /Only CURRENT authority/
    );
  }
);

test(
  17,
  'new open persists only CURRENT authority pair',
  () => {
    const h =
      harness();

    const opened =
      h.api
        .openExclusive(
          currentOpenOptions()
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
  }
);

test(
  18,
  'historical expected authority pair cannot open new lease',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.api
          .openExclusive(
            currentOpenOptions({
              expectedWinnerPlanFingerprintSha256:
                HISTORICAL_WINNER,

              expectedAuthoritySha256:
                HISTORICAL_AUTHORITY
            })
          ),
      /current certified authority/
    );
  }
);

test(
  19,
  'CURRENT active OPEN cannot be replaced',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'CURRENT',
            'ACTIVE_OPEN',
            now
          )
      });

    assert.throws(
      () =>
        h.api
          .openExclusive(
            currentOpenOptions()
          ),
      /cannot be replaced/
    );
  }
);

test(
  20,
  'HISTORICAL active OPEN cannot be replaced',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'HISTORICAL',
            'ACTIVE_OPEN',
            now
          )
      });

    assert.throws(
      () =>
        h.api
          .openExclusive(
            currentOpenOptions()
          ),
      /cannot be replaced/
    );
  }
);

[
  ['CURRENT', 'CLOSED'],
  ['CURRENT', 'EXPIRED_OPEN'],
  ['HISTORICAL', 'CLOSED'],
  ['HISTORICAL', 'EXPIRED_OPEN']
].forEach(
  (entry, index) => {
    test(
      21 + index,
      entry[0] +
        ' ' +
        entry[1] +
        ' may be replaced by CURRENT lease',
      () => {
        const now =
          Date.parse(
            '2026-09-19T02:00:00.000Z'
          );

        const h =
          harness({
            nowMs:
              now,

            seed:
              makeState(
                entry[0],
                entry[1],
                now
              )
          });

        const opened =
          h.api
            .openExclusive(
              currentOpenOptions()
            );

        assert.equal(
          opened.authorityGeneration,
          'CURRENT'
        );

        assert.equal(
          stored(h)
            .collapseAuthoritySha256,
          CURRENT_AUTHORITY
        );
      }
    );
  }
);

test(
  25,
  'UNKNOWN authority state cannot be replaced',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'CLOSED',
        now,
        {
          winnerPlanFingerprintSha256:
            '3'.repeat(64),

          collapseAuthoritySha256:
            '4'.repeat(64)
        }
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .openExclusive(
            currentOpenOptions()
          ),
      /Malformed lease state cannot be replaced/
    );
  }
);

test(
  26,
  'mixed-generation authority state cannot be replaced',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'CLOSED',
        now,
        {
          winnerPlanFingerprintSha256:
            CURRENT_WINNER,

          collapseAuthoritySha256:
            HISTORICAL_AUTHORITY
        }
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .openExclusive(
            currentOpenOptions()
          ),
      /Malformed lease state cannot be replaced/
    );
  }
);

test(
  27,
  'exact CURRENT OPEN lease can close',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    const result =
      h.api
        .close(
          closeOptionsFor(
            seed,
            CURRENT_TOKEN
          )
        );

    assert.equal(
      result.closed,
      true
    );

    assert.equal(
      result.authorityGeneration,
      'CURRENT'
    );
  }
);

test(
  28,
  'exact HISTORICAL OPEN lease can close',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'HISTORICAL',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    const result =
      h.api
        .close(
          closeOptionsFor(
            seed,
            HISTORICAL_TOKEN
          )
        );

    assert.equal(
      result.closed,
      true
    );

    assert.equal(
      result.authorityGeneration,
      'HISTORICAL'
    );
  }
);

test(
  29,
  'wrong HISTORICAL token cannot close',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'HISTORICAL',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .close(
            closeOptionsFor(
              seed,
              'WRONG'
            )
          ),
      /Lease token does not match/
    );
  }
);

test(
  30,
  'HISTORICAL close preserves historical authority pair',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'HISTORICAL',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    h.api.close(
      closeOptionsFor(
        seed,
        HISTORICAL_TOKEN
      )
    );

    const closed =
      stored(h);

    assert.equal(
      closed.winnerPlanFingerprintSha256,
      HISTORICAL_WINNER
    );

    assert.equal(
      closed.collapseAuthoritySha256,
      HISTORICAL_AUTHORITY
    );
  }
);

test(
  31,
  'CURRENT close preserves current authority pair',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    h.api.close(
      closeOptionsFor(
        seed,
        CURRENT_TOKEN
      )
    );

    const closed =
      stored(h);

    assert.equal(
      closed.winnerPlanFingerprintSha256,
      CURRENT_WINNER
    );

    assert.equal(
      closed.collapseAuthoritySha256,
      CURRENT_AUTHORITY
    );
  }
);

test(
  32,
  'legacy token cannot authorize CURRENT lease',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    assert.throws(
      () =>
        h.api
          .assertOwnerReady(
            ownerOptionsFor(
              seed,
              HISTORICAL_TOKEN
            )
          ),
      /Lease token does not match/
    );
  }
);

test(
  33,
  'status reports CURRENT classification',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'CURRENT',
            'ACTIVE_OPEN',
            now
          )
      });

    assert.equal(
      h.api.status()
        .authorityGeneration,
      'CURRENT'
    );
  }
);

test(
  34,
  'status reports HISTORICAL classification',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const h =
      harness({
        nowMs:
          now,

        seed:
          makeState(
            'HISTORICAL',
            'CLOSED',
            now
          )
      });

    assert.equal(
      h.api.status()
        .authorityGeneration,
      'HISTORICAL'
    );
  }
);

test(
  35,
  'status fails closed for UNKNOWN authority',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'CLOSED',
        now,
        {
          winnerPlanFingerprintSha256:
            HISTORICAL_WINNER,

          collapseAuthoritySha256:
            CURRENT_AUTHORITY
        }
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    const status =
      h.api.status();

    assert.equal(
      status.ok,
      false
    );

    assert.equal(
      status.state,
      'MALFORMED'
    );

    assert.equal(
      status.authorityGeneration,
      'UNKNOWN'
    );
  }
);

test(
  36,
  'raw token is never persisted or exposed by status',
  () => {
    const h =
      harness();

    const opened =
      h.api
        .openExclusive(
          currentOpenOptions()
        );

    const raw =
      h.state.properties.get(
        STATE_KEY
      );

    assert.equal(
      raw.includes(
        opened.leaseToken
      ),
      false
    );

    const status =
      h.api.status();

    assert.equal(
      JSON.stringify(status)
        .includes(
          opened.leaseToken
        ),
      false
    );
  }
);

test(
  37,
  'scheduler and checkpoint safety remain fail-closed',
  () => {
    const armed =
      harness({
        managedTriggerCount:
          1
      });

    assert.throws(
      () =>
        armed.api
          .openExclusive(
            currentOpenOptions()
          ),
      /scheduler must remain frozen/
    );

    const drift =
      checkpoint();

    drift.currentFeedCursor =
      'DRIFT';

    const checkpointDrift =
      harness({
        checkpoint:
          drift
      });

    assert.throws(
      () =>
        checkpointDrift.api
          .openExclusive(
            currentOpenOptions()
          ),
      /Frozen county checkpoint changed/
    );
  }
);

test(
  38,
  'state transitions remain ScriptLock-owned',
  () => {
    const h =
      harness();

    const opened =
      h.api
        .openExclusive(
          currentOpenOptions()
        );

    assert.equal(
      h.state.scriptLockAcquisitions,
      1
    );

    assert.equal(
      h.state.scriptLockReleases,
      1
    );

    h.api.close({
      confirmClose:
        true,

      leaseToken:
        opened.leaseToken,

      expectedLeaseId:
        opened.leaseId,

      expectedOwnerGateId:
        opened.ownerGateId
    });

    assert.equal(
      h.state.scriptLockAcquisitions,
      2
    );

    assert.equal(
      h.state.scriptLockReleases,
      2
    );
  }
);

test(
  39,
  'assertion paths remain non-locking with caller-owned DB lock revalidation',
  () => {
    const now =
      Date.parse(
        '2026-09-19T02:00:00.000Z'
      );

    const seed =
      makeState(
        'CURRENT',
        'ACTIVE_OPEN',
        now
      );

    const h =
      harness({
        nowMs:
          now,

        seed
      });

    const before =
      h.state
        .scriptLockAcquisitions;

    const result =
      h.api
        .assertOwnerReady(
          ownerOptionsFor(
            seed,
            CURRENT_TOKEN,
            {
              lockContext:
                h.state
                  .validLockContext
            }
          )
        );

    assert.equal(
      result.ready,
      true
    );

    assert.equal(
      h.state.dbLockAssertions,
      1
    );

    h.api.status();

    assert.equal(
      h.state.scriptLockAcquisitions,
      before
    );
  }
);

test(
  40,
  'all compatibility results remain authority-free',
  () => {
    const absent =
      harness();

    assertAuthorityFree(
      writerAllowed(absent)
    );

    const opened =
      absent.api
        .openExclusive(
          currentOpenOptions()
        );

    assertAuthorityFree(
      opened
    );

    assertAuthorityFree(
      absent.api.status()
    );

    const state =
      stored(absent);

    absent.state.nowMs =
      Date.parse(
        state.notBefore
      );

    assertAuthorityFree(
      absent.api
        .assertOwnerReady(
          ownerOptionsFor(
            state,
            opened.leaseToken
          )
        )
    );

    assertAuthorityFree(
      absent.api
        .close({
          confirmClose:
            true,

          leaseToken:
            opened.leaseToken,

          expectedLeaseId:
            opened.leaseId,

          expectedOwnerGateId:
            opened.ownerGateId
        })
    );
  }
);

assert.equal(
  count,
  40
);

[
  HISTORICAL_WINNER,
  HISTORICAL_AUTHORITY,
  CURRENT_WINNER,
  CURRENT_AUTHORITY,
  'HISTORICAL',
  'CURRENT',
  'UNKNOWN'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'Lease source missing compatibility marker: ' +
      marker
  );
});

console.log('');
console.log(
  'COMPATIBILITY_RUNTIME_CASES=40'
);

console.log(
  'HISTORICAL_CLOSED_WRITER_ALLOWED=true'
);

console.log(
  'HISTORICAL_EXPIRED_WRITER_ALLOWED=true'
);

console.log(
  'HISTORICAL_ACTIVE_OPEN_WRITER_BLOCKED=true'
);

console.log(
  'HISTORICAL_OWNER_READY=false'
);

console.log(
  'CURRENT_OWNER_READY_REQUIRES_CURRENT_AUTHORITY=true'
);

console.log(
  'LEGACY_TOKEN_CAN_AUTHORIZE_CURRENT_COLLAPSE=false'
);

console.log(
  'UNKNOWN_AUTHORITY_GENERATION_FAILS_CLOSED=true'
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
  'LEASE_AUTHORITY_COMPATIBILITY_RUNTIME_VALIDATION_PASSED=true'
);
