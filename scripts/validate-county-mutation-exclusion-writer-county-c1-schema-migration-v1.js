#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const SOURCE =
  'build/apps-script-brand/CountyC1SchemaMigration.js';

const code =
  fs.readFileSync(SOURCE, 'utf8');

const LEGACY_HEADERS = [
  'Distress Lead ID',
  'Source',
  'County'
];

const FINAL_HEADERS =
  LEGACY_HEADERS.concat([
    'Source Observation Key',
    'Canonical Property Key'
  ]);

function makeRuntime(options = {}) {
  let lockHeld = false;
  let lockCalls = 0;
  let tryLockCalls = 0;
  let releaseCalls = 0;
  let leaseCalls = 0;
  let setValuesCalls = 0;
  let getSheetCalls = 0;

  let headers =
    (options.headers || LEGACY_HEADERS).slice();

  const rows = [
    {
      'Distress Lead ID': 'A',
      Source: 'X',
      County: 'Philadelphia'
    }
  ];

  const context = {
    console,

    REOS: {
      Security: {
        requireAdmin() {
          return true;
        }
      },

      DistressLeadCountySchema: {
        requiredHeaders() {
          return FINAL_HEADERS.slice();
        }
      },

      CountyMutationExclusionLease:
        options.omitLease
          ? undefined
          : {
              assertWriterAllowed(request) {
                leaseCalls++;

                assert.strictEqual(
                  lockHeld,
                  true,
                  'lease guard must execute while ScriptLock is held'
                );

                assert.strictEqual(
                  request.writerId,
                  'COUNTY_C1_SCHEMA_MIGRATION'
                );

                if (options.leaseError) {
                  throw options.leaseError;
                }

                return {
                  ok: true,
                  allowed: true
                };
              }
            },

      Database: {
        getHeaders(table) {
          assert.strictEqual(
            table,
            'DISTRESS_LEADS'
          );

          return headers.slice();
        },

        getAll(table) {
          assert.strictEqual(
            table,
            'DISTRESS_LEADS'
          );

          return rows.map(
            row => Object.assign({}, row)
          );
        },

        getSheet(table) {
          getSheetCalls++;

          assert.strictEqual(
            table,
            'DISTRESS_LEADS'
          );

          assert.strictEqual(
            lockHeld,
            true
          );

          return {
            getRange(row, col, height, width) {
              assert.strictEqual(row, 1);
              assert.strictEqual(height, 1);
              assert.strictEqual(width, 2);

              return {
                setValues(values) {
                  setValuesCalls++;

                  assert.strictEqual(
                    lockHeld,
                    true
                  );

                  assert.strictEqual(
                    leaseCalls,
                    1
                  );

                  /*
                   * values originates in the vm realm.
                   * Normalize before host-realm equality.
                   */
                  assert.deepStrictEqual(
                    JSON.parse(
                      JSON.stringify(values)
                    ),
                    [[
                      'Source Observation Key',
                      'Canonical Property Key'
                    ]]
                  );

                  assert.strictEqual(
                    col,
                    LEGACY_HEADERS.length + 1
                  );

                  headers =
                    FINAL_HEADERS.slice();
                }
              };
            }
          };
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

      computeDigest() {
        return new Array(32).fill(0);
      }
    },

    LockService: {
      getScriptLock() {
        lockCalls++;

        return {
          tryLock(ms) {
            tryLockCalls++;

            assert.strictEqual(ms, 1000);

            if (
              options.lockAvailable === false
            ) {
              return false;
            }

            lockHeld = true;
            return true;
          },

          releaseLock() {
            releaseCalls++;

            assert.strictEqual(
              lockHeld,
              true
            );

            lockHeld = false;
          }
        };
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(code, context);

  return {
    module:
      context.REOS.CountyC1SchemaMigration,

    stats() {
      return {
        lockHeld,
        lockCalls,
        tryLockCalls,
        releaseCalls,
        leaseCalls,
        setValuesCalls,
        getSheetCalls,
        headers: headers.slice()
      };
    }
  };
}

let cases = 0;

function test(name, fn) {
  fn();
  cases++;
  console.log(`PASS: ${name}`);
}

test(
  'inspect remains read-only and lease-free',
  () => {
    const rt = makeRuntime();
    const out = rt.module.inspect();
    const s = rt.stats();

    assert.strictEqual(
      out.mode,
      'READ_ONLY'
    );

    assert.strictEqual(s.leaseCalls, 0);
    assert.strictEqual(s.setValuesCalls, 0);
    assert.strictEqual(s.lockCalls, 0);
  }
);

test(
  'missing confirmation fails before locking',
  () => {
    const rt = makeRuntime();

    assert.throws(
      () => rt.module.migrate({}),
      /confirmMigration=true/
    );

    const s = rt.stats();

    assert.strictEqual(s.lockCalls, 0);
    assert.strictEqual(s.leaseCalls, 0);
    assert.strictEqual(s.setValuesCalls, 0);
  }
);

test(
  'lock contention fails before lease guard',
  () => {
    const rt =
      makeRuntime({
        lockAvailable: false
      });

    assert.throws(
      () =>
        rt.module.migrate({
          confirmMigration: true
        }),
      /lock is contended/
    );

    const s = rt.stats();

    assert.strictEqual(s.leaseCalls, 0);
    assert.strictEqual(s.setValuesCalls, 0);
    assert.strictEqual(s.releaseCalls, 0);
  }
);

test(
  'already-ready path remains no-write and lease-free',
  () => {
    const rt =
      makeRuntime({
        headers: FINAL_HEADERS
      });

    const out =
      rt.module.migrate({
        confirmMigration: true
      });

    assert.strictEqual(
      out.outcome,
      'C1_IDENTITY_SCHEMA_ALREADY_READY_NO_WRITE'
    );

    const s = rt.stats();

    assert.strictEqual(s.leaseCalls, 0);
    assert.strictEqual(s.setValuesCalls, 0);
    assert.strictEqual(s.releaseCalls, 1);
  }
);

test(
  'missing lease fails closed before mutation',
  () => {
    const rt =
      makeRuntime({
        omitLease: true
      });

    assert.throws(
      () =>
        rt.module.migrate({
          confirmMigration: true
        }),
      /lease writer guard is required/
    );

    const s = rt.stats();

    assert.strictEqual(s.getSheetCalls, 0);
    assert.strictEqual(s.setValuesCalls, 0);
    assert.strictEqual(s.releaseCalls, 1);
  }
);

test(
  'lease denial fails closed before mutation',
  () => {
    const rt =
      makeRuntime({
        leaseError:
          new Error('LEASE_DENIED')
      });

    assert.throws(
      () =>
        rt.module.migrate({
          confirmMigration: true
        }),
      /LEASE_DENIED/
    );

    const s = rt.stats();

    assert.strictEqual(s.leaseCalls, 1);
    assert.strictEqual(s.getSheetCalls, 0);
    assert.strictEqual(s.setValuesCalls, 0);
    assert.strictEqual(s.releaseCalls, 1);
  }
);

test(
  'guard executes under existing native ScriptLock',
  () => {
    const rt = makeRuntime();

    rt.module.migrate({
      confirmMigration: true
    });

    const s = rt.stats();

    assert.strictEqual(s.lockCalls, 1);
    assert.strictEqual(s.tryLockCalls, 1);
    assert.strictEqual(s.leaseCalls, 1);
    assert.strictEqual(s.releaseCalls, 1);
  }
);

test(
  'successful migration performs one protected write',
  () => {
    const rt = makeRuntime();

    const out =
      rt.module.migrate({
        confirmMigration: true
      });

    assert.strictEqual(
      out.outcome,
      'C1_IDENTITY_SCHEMA_TWO_COLUMNS_APPENDED'
    );

    assert.strictEqual(
      rt.stats().setValuesCalls,
      1
    );
  }
);

test(
  'successful migration appends exact identity headers',
  () => {
    const rt = makeRuntime();

    rt.module.migrate({
      confirmMigration: true
    });

    assert.deepStrictEqual(
      rt.stats().headers,
      FINAL_HEADERS
    );
  }
);

test(
  'successful migration grants no row mutation authority',
  () => {
    const rt = makeRuntime();

    const out =
      rt.module.migrate({
        confirmMigration: true
      });

    assert.strictEqual(
      out.rowMutationExecuted,
      false
    );

    assert.strictEqual(
      out.c1InsertAuthorityGranted,
      false
    );

    assert.strictEqual(
      out.mutationAuthorityGranted,
      false
    );

    assert.strictEqual(
      out.insertAuthorityGranted,
      false
    );
  }
);

test(
  'owner lease authority is not introduced',
  () => {
    assert.strictEqual(
      code.includes('.assertOwnerReady('),
      false
    );

    assert.strictEqual(
      code.includes('.openExclusive('),
      false
    );
  }
);

test(
  'Database lock-context handoff is not introduced',
  () => {
    assert.strictEqual(
      code.includes('withScriptLockContext'),
      false
    );

    assert.strictEqual(
      code.includes('lockContext'),
      false
    );
  }
);

test(
  'exactly one native ScriptLock lifecycle remains',
  () => {
    assert.strictEqual(
      (code.match(/\.getScriptLock\(\)/g) || [])
        .length,
      1
    );

    assert.strictEqual(
      (code.match(/\.tryLock\(/g) || [])
        .length,
      1
    );

    assert.strictEqual(
      (code.match(/\.releaseLock\(\)/g) || [])
        .length,
      1
    );
  }
);

test(
  'exactly one schema mutation primitive remains',
  () => {
    assert.strictEqual(
      (code.match(/\.setValues\(/g) || [])
        .length,
      1
    );
  }
);

console.log(
  `c1_schema_migration_cases=${cases}`
);

assert.strictEqual(cases, 14);

console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_COUNTY_C1_SCHEMA_MIGRATION_VALIDATION_PASSED=true'
);
