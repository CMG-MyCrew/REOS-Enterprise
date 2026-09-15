#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const CONNECTOR =
  'build/apps-script-brand/CountyConnectorSDK.js';

const WRITER_ID =
  'COUNTY_CONNECTOR_LIVE_PERSISTENCE';

const source =
  fs.readFileSync(
    CONNECTOR,
    'utf8'
  );

let caseCount = 0;

function pass(message) {
  caseCount += 1;
  console.log(
    'PASS: ' + message
  );
}

function isolate(
  startMarker,
  endMarker
) {
  const start =
    source.indexOf(
      startMarker
    );

  const end =
    source.indexOf(
      endMarker,
      start
    );

  assert.ok(
    start >= 0 &&
    end > start,
    'Unable to isolate source segment: ' +
      startMarker
  );

  return source.slice(
    start,
    end
  );
}

function record(
  sourceRecordId,
  address
) {
  return {
    Address:
      address || '123 Main St',
    City:
      'Philadelphia',
    State:
      'PA',
    Zip:
      '19101',
    'Parcel ID':
      'PARCEL-' + sourceRecordId,
    'Source Record ID':
      sourceRecordId
  };
}

function canonicalKey(address) {
  return (
    'prop:' +
    String(address || '')
      .trim()
      .toLowerCase()
  );
}

function createHarness(options = {}) {
  const state = {
    events: [],

    auditEnsures: 0,
    auditInserts: 0,
    auditUpdates: 0,

    fetchCalls: 0,

    outerGuardCalls: 0,
    leaseCalls: 0,
    lockContextAssertions: 0,

    targetReads: 0,
    targetInserts: 0,
    targetUpdates: 0,

    lockActive: false,
    currentContext: null,
    lastIssuedContext: null,

    targetWriteContexts: [],

    targetRows:
      (options.targetRows || [])
        .map(row =>
          Object.assign(
            {},
            row
          )
        )
  };

  const database = {
    ensureTable(sheetName) {
      assert.equal(
        state.lockActive,
        false,
        'Audit infrastructure must remain outside live persistence lock'
      );

      assert.equal(
        sheetName,
        'COUNTY_CONNECTOR_RUNS'
      );

      state.auditEnsures += 1;
      state.events.push(
        'audit:ensure'
      );

      return {};
    },

    getAll(sheetName) {
      if (
        sheetName ===
        'DISTRESS_LEADS'
      ) {
        assert.equal(
          state.lockActive,
          true,
          'DISTRESS_LEADS snapshot must occur under outer ScriptLock'
        );

        state.targetReads += 1;
        state.events.push(
          'target:getAll'
        );

        return state.targetRows
          .map(row =>
            Object.assign(
              {},
              row
            )
          );
      }

      if (
        sheetName ===
        'COUNTY_CONNECTOR_RUNS'
      ) {
        return [];
      }

      throw new Error(
        'Unexpected getAll sheet: ' +
        sheetName
      );
    },

    insert(
      sheetName,
      row,
      dbOptions
    ) {
      if (
        sheetName ===
        'COUNTY_CONNECTOR_RUNS'
      ) {
        assert.equal(
          state.lockActive,
          false,
          'Audit insert must remain outside live persistence lock'
        );

        state.auditInserts += 1;
        state.events.push(
          'audit:insert'
        );

        return Object.assign(
          {},
          row
        );
      }

      assert.equal(
        sheetName,
        'DISTRESS_LEADS'
      );

      assert.equal(
        state.lockActive,
        true,
        'Target insert must occur under outer ScriptLock'
      );

      assert.ok(
        dbOptions &&
        dbOptions.lockContext ===
          state.currentContext,
        'Target insert must receive exact outer lock context'
      );

      state.targetInserts += 1;
      state.targetWriteContexts.push(
        dbOptions.lockContext
      );

      state.events.push(
        'target:insert'
      );

      const inserted =
        Object.assign(
          {},
          row,
          {
            'Distress Lead ID':
              row['Distress Lead ID'] ||
              'DL-' +
              state.targetInserts
          }
        );

      state.targetRows.push(
        Object.assign(
          {},
          inserted
        )
      );

      return inserted;
    },

    update(
      sheetName,
      idField,
      idValue,
      changes,
      dbOptions
    ) {
      if (
        sheetName ===
        'COUNTY_CONNECTOR_RUNS'
      ) {
        assert.equal(
          state.lockActive,
          false,
          'Audit completion must remain outside live persistence lock'
        );

        state.auditUpdates += 1;
        state.events.push(
          'audit:update'
        );

        return Object.assign(
          {},
          changes
        );
      }

      assert.equal(
        sheetName,
        'DISTRESS_LEADS'
      );

      assert.equal(
        state.lockActive,
        true,
        'Target update must occur under outer ScriptLock'
      );

      assert.ok(
        dbOptions &&
        dbOptions.lockContext ===
          state.currentContext,
        'Target update must receive exact outer lock context'
      );

      assert.equal(
        idField,
        'Distress Lead ID'
      );

      state.targetUpdates += 1;
      state.targetWriteContexts.push(
        dbOptions.lockContext
      );

      state.events.push(
        'target:update'
      );

      const index =
        state.targetRows.findIndex(
          row =>
            row['Distress Lead ID'] ===
            idValue
        );

      assert.ok(
        index >= 0,
        'Target update row must exist'
      );

      const updated =
        Object.assign(
          {},
          state.targetRows[index],
          changes
        );

      state.targetRows[index] =
        Object.assign(
          {},
          updated
        );

      return updated;
    },

    withScriptLockContext(work) {
      state.outerGuardCalls += 1;

      if (
        options.lockAvailable ===
        false
      ) {
        state.events.push(
          'lock:contended'
        );

        throw new Error(
          'Database ScriptLock is contended; no operation executed.'
        );
      }

      assert.equal(
        state.lockActive,
        false,
        'Nested outer connector ScriptLock is prohibited'
      );

      const context =
        Object.freeze({
          token:
            'LOCK-' +
            state.outerGuardCalls
        });

      state.lockActive = true;
      state.currentContext = context;
      state.lastIssuedContext = context;

      state.events.push(
        'lock:enter'
      );

      try {
        return work(
          context
        );
      } finally {
        state.events.push(
          'lock:exit'
        );

        state.lockActive = false;
        state.currentContext = null;
      }
    },

    assertScriptLockContext(
      lockContext
    ) {
      state.lockContextAssertions += 1;

      assert.equal(
        state.lockActive,
        true,
        'Lock context asserted without active outer ScriptLock'
      );

      assert.equal(
        lockContext,
        state.currentContext,
        'Wrong caller-owned lock context'
      );

      state.events.push(
        'lockContext:assert'
      );

      return true;
    }
  };

  const sandbox = {
    REOS: {
      generateId_() {
        return 'CCR-TEST-RUN';
      },

      Database:
        database,

      CountyMutationExclusionLease: {
        assertWriterAllowed(request) {
          state.leaseCalls += 1;

          assert.equal(
            state.lockActive,
            true,
            'Lease guard must execute while Database ScriptLock is held'
          );

          assert.ok(
            request &&
            request.writerId ===
              WRITER_ID,
            'Wrong protected writer ID'
          );

          assert.equal(
            Object.keys(request)
              .sort()
              .join(','),
            'writerId'
          );

          state.events.push(
            'lease:assert'
          );

          if (
            options.activeLease ===
            true
          ) {
            throw new Error(
              'Active collapse lease blocks protected writer: ' +
              WRITER_ID
            );
          }

          return {
            allowed: true
          };
        }
      },

      CanonicalPropertyIdentity: {
        resolve(row) {
          return {
            sourceObservationKey:
              'obs:' +
              row['Source Record ID'],

            canonicalPropertyKey:
              canonicalKey(
                row.Address
              )
          };
        },

        tryCanonicalPropertyIdentity(row) {
          return {
            ok: true,
            key:
              canonicalKey(
                row.Address
              ),
            authority:
              'test'
          };
        }
      },

      Logger:
        null
    },

    Session: {
      getActiveUser() {
        return {
          getEmail() {
            return 'test@example.com';
          }
        };
      }
    },

    console
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox
  );

  const sdk =
    sandbox.REOS.CountyConnectorSDK;

  const records =
    options.records || [
      record(
        'SRC-1'
      )
    ];

  sdk.register({
    id:
      'TEST-COUNTY',
    county:
      'Test County',
    state:
      'PA',
    datasets: [
      'test_dataset'
    ],
    enabled:
      true,

    fetch() {
      state.fetchCalls += 1;
      state.events.push(
        'fetch'
      );

      return {
        records:
          records.map(row =>
            Object.assign(
              {},
              row
            )
          ),
        nextCursor:
          'NEXT'
      };
    },

    normalize(row) {
      return Object.assign(
        {},
        row
      );
    }
  });

  function run(runOptions) {
    return sdk.run(
      'TEST-COUNTY',
      Object.assign(
        {
          dataset:
            'test_dataset'
        },
        runOptions || {}
      )
    );
  }

  return {
    sandbox,
    sdk,
    state,
    run
  };
}


assert.equal(
  source.split(
    'COUNTY_CONNECTOR_LIVE_PERSISTENCE'
  ).length - 1,
  1
);

assert.equal(
  source.split(
    'REOS.CountyMutationExclusionLease.assertWriterAllowed'
  ).length - 1,
  1
);

assert.ok(
  source.includes(
    'withLivePersistenceWriterGuard_'
  )
);

assert.ok(
  source.includes(
    'REOS.Database.withScriptLockContext'
  )
);

pass(
  'source contains exact writer ID and lease guard'
);


{
  const h =
    createHarness();

  assert.equal(
    Object.keys(
      h.sdk
    )
      .sort()
      .join(','),
    [
      'auditRunDiagnostic',
      'ensureInfrastructure',
      'get',
      'list',
      'recentRuns',
      'register',
      'run',
      'runAll',
      'validateLead'
    ]
      .sort()
      .join(',')
  );
}

pass(
  'public county connector API remains unchanged'
);


{
  const auditBlock =
    isolate(
      '  function insertRun_(',
      '  function getExecutedBy_()'
    );

  assert.equal(
    auditBlock.includes(
      'withLivePersistenceWriterGuard_'
    ),
    false
  );

  assert.equal(
    auditBlock.includes(
      'lockContext'
    ),
    false
  );
}

pass(
  'audit telemetry remains outside protected live-persistence guard'
);


{
  const h =
    createHarness();

  const result =
    h.run({
      dryRun: true
    });

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    h.state.outerGuardCalls,
    0
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  assert.equal(
    h.state.targetReads,
    0
  );

  assert.equal(
    h.state.targetInserts +
      h.state.targetUpdates,
    0
  );

  assert.equal(
    h.state.auditInserts,
    1
  );

  assert.equal(
    h.state.auditUpdates,
    1
  );
}

pass(
  'dry run preserves audit telemetry without lease guard or target mutation'
);


{
  const h =
    createHarness({
      activeLease:
        true
    });

  assert.throws(
    () =>
      h.run({
        dryRun: false
      }),
    /Active collapse lease blocks protected writer: COUNTY_CONNECTOR_LIVE_PERSISTENCE/
  );

  assert.equal(
    h.state.outerGuardCalls,
    1
  );

  assert.equal(
    h.state.leaseCalls,
    1
  );

  assert.equal(
    h.state.targetReads,
    0
  );

  assert.equal(
    h.state.targetInserts +
      h.state.targetUpdates,
    0
  );

  assert.equal(
    h.state.auditInserts,
    1
  );

  assert.equal(
    h.state.auditUpdates,
    1
  );
}

pass(
  'active collapse lease blocks live persistence before target read or mutation'
);


{
  const h =
    createHarness({
      lockAvailable:
        false
    });

  assert.throws(
    () =>
      h.run({
        dryRun: false
      }),
    /Database ScriptLock is contended/
  );

  assert.equal(
    h.state.outerGuardCalls,
    1
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  assert.equal(
    h.state.targetReads,
    0
  );

  assert.equal(
    h.state.targetInserts +
      h.state.targetUpdates,
    0
  );
}

pass(
  'outer ScriptLock contention fails before lease check and target access'
);


{
  const h =
    createHarness();

  const result =
    h.run({
      dryRun: false
    });

  assert.equal(
    result.stats.inserted,
    1
  );

  assert.equal(
    result.stats.updated,
    0
  );

  assert.equal(
    h.state.outerGuardCalls,
    1
  );

  assert.equal(
    h.state.leaseCalls,
    1
  );

  assert.equal(
    h.state.targetReads,
    1
  );

  assert.equal(
    h.state.targetInserts,
    1
  );

  assert.equal(
    h.state.targetUpdates,
    0
  );
}

pass(
  'allowed live insert uses one outer guarded ScriptLock'
);


{
  const h =
    createHarness();

  h.run({
    dryRun: false
  });

  assert.equal(
    h.state.targetWriteContexts.length,
    1
  );

  assert.equal(
    h.state.targetWriteContexts[0],
    h.state.lastIssuedContext
  );
}

pass(
  'live insert receives exact caller-owned Database lock context'
);


{
  const existing =
    record(
      'SRC-1'
    );

  Object.assign(
    existing,
    {
      'Distress Lead ID':
        'DL-EXISTING',
      'Source Observation Key':
        'obs:SRC-1',
      'Source Record Key':
        'obs:SRC-1',
      'Canonical Property Key':
        canonicalKey(
          existing.Address
        )
    }
  );

  const h =
    createHarness({
      targetRows: [
        existing
      ]
    });

  const result =
    h.run({
      dryRun: false
    });

  assert.equal(
    result.stats.inserted,
    0
  );

  assert.equal(
    result.stats.updated,
    1
  );

  assert.equal(
    h.state.outerGuardCalls,
    1
  );

  assert.equal(
    h.state.targetUpdates,
    1
  );
}

pass(
  'allowed live update uses one outer guarded ScriptLock'
);


{
  const existing =
    record(
      'SRC-1'
    );

  Object.assign(
    existing,
    {
      'Distress Lead ID':
        'DL-EXISTING',
      'Source Observation Key':
        'obs:SRC-1',
      'Source Record Key':
        'obs:SRC-1',
      'Canonical Property Key':
        canonicalKey(
          existing.Address
        )
    }
  );

  const h =
    createHarness({
      targetRows: [
        existing
      ]
    });

  h.run({
    dryRun: false
  });

  assert.equal(
    h.state.targetWriteContexts.length,
    1
  );

  assert.equal(
    h.state.targetWriteContexts[0],
    h.state.lastIssuedContext
  );
}

pass(
  'live update receives exact caller-owned Database lock context'
);


{
  const h =
    createHarness();

  h.run({
    dryRun: false
  });

  const enter =
    h.state.events.indexOf(
      'lock:enter'
    );

  const lease =
    h.state.events.indexOf(
      'lease:assert'
    );

  const read =
    h.state.events.indexOf(
      'target:getAll'
    );

  const write =
    h.state.events.indexOf(
      'target:insert'
    );

  const exit =
    h.state.events.indexOf(
      'lock:exit'
    );

  assert.ok(
    enter >= 0 &&
    lease > enter &&
    read > lease &&
    write > read &&
    exit > write
  );
}

pass(
  'lease check, page snapshot, and target mutation share one atomic lock interval'
);


{
  const h =
    createHarness();

  h.run({
    dryRun: false
  });

  const auditBegin =
    h.state.events.indexOf(
      'audit:insert'
    );

  const lockEnter =
    h.state.events.indexOf(
      'lock:enter'
    );

  const lockExit =
    h.state.events.indexOf(
      'lock:exit'
    );

  const auditEnd =
    h.state.events.lastIndexOf(
      'audit:update'
    );

  assert.ok(
    auditBegin >= 0 &&
    lockEnter > auditBegin &&
    auditEnd > lockExit
  );
}

pass(
  'audit start and completion remain outside live target lock interval'
);


{
  const h =
    createHarness({
      records: [
        record(
          'SRC-1',
          '123 Main St'
        ),
        record(
          'SRC-2',
          '125 Main St'
        )
      ]
    });

  const result =
    h.run({
      dryRun: false
    });

  assert.equal(
    result.stats.inserted,
    2
  );

  assert.equal(
    h.state.outerGuardCalls,
    1
  );

  assert.equal(
    h.state.leaseCalls,
    1
  );

  assert.equal(
    h.state.targetReads,
    1
  );

  assert.equal(
    h.state.targetInserts,
    2
  );

  assert.equal(
    h.state.targetWriteContexts[0],
    h.state.lastIssuedContext
  );

  assert.equal(
    h.state.targetWriteContexts[1],
    h.state.lastIssuedContext
  );
}

pass(
  'one live page shares one lease decision and one caller-owned lock context'
);


assert.equal(
  source.includes(
    '.assertOwnerReady('
  ),
  false
);

assert.equal(
  source.includes(
    '.openExclusive('
  ),
  false
);

assert.equal(
  source.includes(
    'function reosCountyMutationExclusionLease'
  ),
  false
);

pass(
  'retrofit introduces no owner authority, lease opening, or generic lease RPC'
);


assert.equal(
  caseCount,
  14
);

console.log(
  'connector_cases=' +
  caseCount
);

console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_COUNTY_CONNECTOR_LIVE_PERSISTENCE_VALIDATION_PASSED=true'
);
