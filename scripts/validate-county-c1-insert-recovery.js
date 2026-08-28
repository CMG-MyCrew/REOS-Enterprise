#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const path =
  require('node:path');

const vm =
  require('node:vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const MODULE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyC1InsertRecovery.js'
  );

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

const SCHEMA_MODULE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'DistressLeadCountySchema.js'
  );

const schemaSource =
  fs.readFileSync(
    SCHEMA_MODULE,
    'utf8'
  );

const KEY =
  'pa-philadelphia|code_violations|101';

const CANONICAL =
  'property|parcel|pa|philadelphia|101';

const DESCRIPTOR_SOURCE_SHA =
  '9d5b728823107083c50f5bb4871e0fce47967e21eadd70a59e13f97e13a2eea9';

const CATALOG_SHA =
  'b5aeebee8bc5162c9557f2678bf62e1930fa1f6ad5ba369c27b3a1dabb55c091';

function pass(message) {
  console.log(
    'PASS: ' + message
  );
}

function expectThrow(
  fn,
  pattern
) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert.ok(
    error,
    'Expected operation to throw'
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

console.log(
  '=== COUNTY C1 INSERT-ONLY RECOVERY CONTRACT ==='
);

/*
 * Cross-module schema authority regression.
 *
 * C1 identity fields were introduced through an additive migration and
 * therefore must remain the final two DISTRESS_LEADS headers.
 */
{
  const saleDateOffset =
    schemaSource.indexOf(
      "'Sale Date'"
    );

  const observationOffset =
    schemaSource.indexOf(
      "'Source Observation Key'"
    );

  const canonicalOffset =
    schemaSource.indexOf(
      "'Canonical Property Key'"
    );

  assert.ok(
    saleDateOffset >= 0,
    'Sale Date schema anchor missing'
  );

  assert.ok(
    observationOffset >
      saleDateOffset,
    'Source Observation Key must follow Sale Date in append-only C1 layout'
  );

  assert.ok(
    canonicalOffset >
      observationOffset,
    'Canonical Property Key must follow Source Observation Key'
  );

  assert.equal(
    observationOffset,
    schemaSource.lastIndexOf(
      "'Source Observation Key'"
    ),
    'Source Observation Key schema literal must be unique'
  );

  assert.equal(
    canonicalOffset,
    schemaSource.lastIndexOf(
      "'Canonical Property Key'"
    ),
    'Canonical Property Key schema literal must be unique'
  );

  assert.ok(
    schemaSource.includes(
      "'Sale Date',\n" +
      "    'Source Observation Key',\n" +
      "    'Canonical Property Key'\n" +
      "  ];"
    ),
    'C1 identity fields must be the final two COUNTY_HEADERS'
  );

  pass(
    'county schema authority preserves append-only C1 identity-column order'
  );
}

/*
 * Static mutation containment.
 */
assert.equal(
  (
    source.match(
      /REOS\.Database\.insert\s*\(/g
    ) || []
  ).length,
  1,
  'executor must contain exactly one Database.insert call'
);

[
  /REOS\.Database\.update\s*\(/,
  /REOS\.Database\.upsert\s*\(/,
  /REOS\.Database\.softDelete\s*\(/,
  /REOS\.Database\.ensureTable\s*\(/,
  /\.appendRow\s*\(/,
  /\.setValues\s*\(/,
  /CountyRuntimeBridge\.(?:run|sync|dryRun)\s*\(/,
  /ScriptApp\.newTrigger\s*\(/,
  /CountyC1SchemaMigration\s*\./,
  /REOS\s*\.\s*CountyC1LivePreflight\s*\./,
  /reosCountyC1LivePreflight\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(source),
    false,
    `forbidden executor surface: ${pattern}`
  );
});

assert.equal(
  (
    source.match(
      /REOS\.Database\s*\.withScriptLockContext\s*\(/g
    ) || []
  ).length,
  1,
  'executor must use exactly one capability-bound lock owner'
);

assert.ok(
  source.includes(
    'options.confirmInsert !=='
  ),
  'explicit insert confirmation gate missing'
);

assert.ok(
  source.includes(
    'maintenanceToken'
  ),
  'maintenance gate token input missing'
);

assert.equal(
  (
    source.match(
      /CountyC1MaintenanceGate\s*\.assertRecoveryReady\s*\(/g
    ) || []
  ).length,
  2,
  'executor must assert the maintenance gate exactly twice'
);

assert.ok(
  source.includes(
    'sourceObservationKey'
  ),
  'single Source Observation Key input missing'
);

assert.ok(
  source.includes(
    'C1_INSERT_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY'
  ),
  'ambiguous-write no-retry disposition missing'
);

assert.ok(
  source.includes(
    "lockContext:"
  ),
  'Database.insert lockContext handoff missing'
);

pass(
  'static mutation surface is bounded to one Database.insert'
);

function authorityRecord() {
  return {
    planningClass:
      'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE',

    sourceObservationKey:
      KEY,

    connectorId:
      'PA-PHILADELPHIA',

    dataset:
      'code_violations',

    immutableSourceRecordId:
      '101',

    expectedCanonicalPropertyKey:
      CANONICAL,

    historicalNormalizedSourceRecordSha256:
      'a'.repeat(64),

    descriptorSha256:
      'b'.repeat(64),

    authorityDescriptorSourceSha256:
      DESCRIPTOR_SOURCE_SHA,

    authorityCatalogSha256:
      CATALOG_SHA
  };
}

function authorityMetadata() {
  return {
    mode:
      'READ_ONLY_AUTHORITY_CATALOG',

    planningClass:
      'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE',

    connectorId:
      'PA-PHILADELPHIA',

    dataset:
      'code_violations',

    descriptorSourceSha256:
      DESCRIPTOR_SOURCE_SHA,

    catalogSha256:
      CATALOG_SHA,

    descriptorCount:
      664,

    recordCount:
      664,

    mutationAuthorityGranted:
      false,

    insertAuthorityGranted:
      false
  };
}

function signedSha256Bytes(value) {
  const digest =
    crypto
      .createHash('sha256')
      .update(
        String(value),
        'utf8'
      )
      .digest();

  return Array.from(
    digest,
    byte =>
      byte > 127
        ? byte - 256
        : byte
  );
}

function createHarness(
  options = {}
) {
  const headers =
    options.headers || [
      'Distress Lead ID',
      'Address',
      'Source',
      'Source Dataset',
      'Connector Run ID',
      'Source Record ID',
      'Source Record Key',
      'Source Observation Key',
      'Canonical Property Key',
      'Last Seen At',
      'Created At',
      'Updated At'
    ];

  const rows =
    (
      options.rows ||
      []
    ).map(
      row =>
        Object.assign(
          {},
          row
        )
    );

  const state = {
    adminCalls:
      0,

    registerCalls:
      0,

    fetchCalls:
      0,

    lockCalls:
      0,

    callbackCalls:
      0,

    headerReads:
      0,

    rowReads:
      0,

    insertCalls:
      0,

    maintenanceGateCalls:
      0,

    events:
      []
  };

  const lockContext = {
    capability:
      'HARNESS-CAPABILITY'
  };

  const normalized = {
    Address:
      '101 TEST ST',

    City:
      'PHILADELPHIA',

    State:
      'PA',

    Zip:
      '19100',

    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Source Record ID':
      '101',

    'Connector Run ID':
      'HARNESS'
  };

  const connector = {
    normalize(raw, context) {
      state.events.push(
        'source:normalize'
      );

      const row =
        Object.assign(
          {},
          normalized,
          options.normalizedOverrides ||
          {}
        );

      row[
        'Connector Run ID'
      ] =
        context.runId;

      return row;
    },

    validate() {
      state.events.push(
        'source:validate'
      );

      if (
        options.validationFails
      ) {
        return {
          ok:
            false,

          errors:
            [
              'HARNESS_INVALID'
            ]
        };
      }

      return {
        ok:
          true,

        errors:
          []
      };
    }
  };

  const sandbox = {
    console,

    Date,

    JSON,

    Object,

    Array,

    String,

    Number,

    Boolean,

    RegExp,

    Error,

    REOS: {
      Security: {
        requireAdmin() {
          state.adminCalls +=
            1;

          state.events.push(
            'security:admin'
          );
        }
      },

      DistressLeadCountySchema: {
        requiredHeaders() {
          return headers.slice();
        }
      },

      CountyC1CertifiedAuthority: {
        metadata() {
          return Object.assign(
            {},
            options.authorityMetadata ||
            authorityMetadata()
          );
        },

        resolve(key) {
          if (
            key !== KEY ||
            options.authorityMissing
          ) {
            return null;
          }

          return Object.assign(
            {},
            authorityRecord(),
            options.authorityOverrides ||
            {}
          );
        }
      },

      CountyRuntimeBridge: {
        registerConnectors() {
          state.registerCalls +=
            1;

          state.events.push(
            'source:register'
          );
        }
      },

      CountyConnectorSDK: {
        get(id) {
          assert.equal(
            id,
            'PA-PHILADELPHIA'
          );

          return connector;
        },

        validateLead() {
          return {
            ok:
              true,

            errors:
              []
          };
        }
      },

      CountyAdapters: {
        Registry: {
          fetch(
            adapter,
            request
          ) {
            state.fetchCalls +=
              1;

            state.events.push(
              'source:fetch'
            );

            assert.equal(
              adapter,
              'arcgis'
            );

            assert.equal(
              request.maxLimit,
              1
            );

            assert.equal(
              request.where,
              'objectid IN (101)'
            );

            if (
              options.sourceMissing
            ) {
              return {
                records:
                  []
              };
            }

            return {
              records: [
                {
                  objectid:
                    101
                }
              ],

              metadata: {}
            };
          }
        }
      },

      CanonicalPropertyIdentity: {
        resolve(record) {
          state.events.push(
            'identity:resolve'
          );

          return {
            sourceObservationKey:
              options.observationDrift
                ? 'pa-philadelphia|code_violations|999'
                : KEY,

            canonicalPropertyKey:
              options.canonicalDrift
                ? 'property|drift'
                : CANONICAL
          };
        }
      },

      CountyC1MaintenanceGate: {
        assertRecoveryReady(
          gateOptions
        ) {
          state.maintenanceGateCalls +=
            1;

          state.events.push(
            'maintenance:assert'
          );

          assert.equal(
            gateOptions
              .sourceObservationKey,
            KEY
          );

          assert.equal(
            gateOptions
              .maintenanceToken,
            'HARNESS-GATE-TOKEN'
          );

          if (
            options
              .maintenanceRejected
          ) {
            throw new Error(
              'HARNESS_MAINTENANCE_GATE_NOT_READY'
            );
          }

          return {
            ok:
              true,

            ready:
              true,

            gateId:
              options
                .maintenanceGateDrift &&
              state
                .maintenanceGateCalls >
                1
                ? 'GATE-DRIFT'
                : 'GATE-HARNESS',

            triggerCount:
              0,

            mutationAuthorityGranted:
              false,

            insertAuthorityGranted:
              false,

            schedulerAuthorityGranted:
              false,

            automaticOfferAuthorityGranted:
              false
          };
        }
      },

      Database: {
        withScriptLockContext(
          callback
        ) {
          state.lockCalls +=
            1;

          state.events.push(
            'lock:try'
          );

          if (
            options.lockAvailable ===
              false
          ) {
            throw new Error(
              'Database ScriptLock is contended; no operation executed.'
            );
          }

          state.callbackCalls +=
            1;

          state.events.push(
            'lock:callback'
          );

          const result =
            callback(
              lockContext
            );

          if (
            options.ownerAfterCallbackError
          ) {
            throw new Error(
              'HARNESS_OWNER_FINALIZATION_FAILED'
            );
          }

          state.events.push(
            'lock:complete'
          );

          return result;
        },

        getHeaders(sheetName) {
          state.headerReads +=
            1;

          state.events.push(
            'db:headers'
          );

          assert.equal(
            sheetName,
            'DISTRESS_LEADS'
          );

          if (
            options.schemaDrift
          ) {
            return headers
              .slice(0, -1);
          }

          return headers.slice();
        },

        getAll(sheetName) {
          state.rowReads +=
            1;

          state.events.push(
            'db:getAll'
          );

          assert.equal(
            sheetName,
            'DISTRESS_LEADS'
          );

          if (
            options.dropPostInsert &&
            state.insertCalls > 0
          ) {
            return [];
          }

          return rows.map(
            row =>
              Object.assign(
                {},
                row
              )
          );
        },

        insert(
          sheetName,
          record,
          insertOptions
        ) {
          state.insertCalls +=
            1;

          state.events.push(
            'db:insert'
          );

          assert.equal(
            sheetName,
            'DISTRESS_LEADS'
          );

          assert.equal(
            insertOptions.idField,
            'Distress Lead ID'
          );

          assert.equal(
            insertOptions.idPrefix,
            'DL'
          );

          assert.equal(
            insertOptions.lockContext,
            lockContext
          );

          const inserted =
            Object.assign(
              {},
              record,
              {
                'Distress Lead ID':
                  'DL-HARNESS-1'
              }
            );

          if (
            options.insertThrowsAfterAppend
          ) {
            rows.push(
              inserted
            );

            throw new Error(
              'HARNESS_AFTER_APPEND_FAILURE'
            );
          }

          rows.push(
            inserted
          );

          return Object.assign(
            {},
            inserted
          );
        }
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(name) {
            assert.equal(
              name,
              'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL'
            );

            return 'https://example.test/arcgis';
          }
        };
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
        assert.equal(
          algorithm,
          'SHA_256'
        );

        return signedSha256Bytes(
          value
        );
      }
    }
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        MODULE
    }
  );

  return {
    state,
    rows,
    sandbox,
    execute(options) {
      options =
        Object.assign(
          {},
          options ||
          {}
        );

      if (
        !Object.prototype
          .hasOwnProperty.call(
            options,
            'maintenanceToken'
          )
      ) {
        options.maintenanceToken =
          'HARNESS-GATE-TOKEN';
      }

      return sandbox.REOS
        .CountyC1InsertRecovery
        .execute(
          options
        );
    }
  };
}

/*
 * Explicit confirmation must fail before any source/network or lock work.
 */
{
  const harness =
    createHarness();

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY
      }),
    /confirmInsert=true/
  );

  assert.equal(
    harness.state.fetchCalls,
    0
  );

  assert.equal(
    harness.state.lockCalls,
    0
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  pass(
    'explicit confirmation fails before network/lock/mutation'
  );
}

/*
 * Caller-supplied candidate arrays remain prohibited.
 */
{
  const harness =
    createHarness();

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        sourceObservationKeys: [
          KEY
        ],

        confirmInsert:
          true
      }),
    /exactly one sourceObservationKey/
  );

  assert.equal(
    harness.state.fetchCalls,
    0
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  pass(
    'executor accepts exactly one certified Source Observation Key'
  );
}

/*
 * Maintenance/quiescence gate must fail before source/network or lock work.
 */
{
  const harness =
    createHarness({
      maintenanceRejected:
        true
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /MAINTENANCE_GATE_NOT_READY/
  );

  assert.equal(
    harness.state
      .maintenanceGateCalls,
    1
  );

  assert.equal(
    harness.state.fetchCalls,
    0
  );

  assert.equal(
    harness.state.lockCalls,
    0
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  pass(
    'maintenance gate fails before network, lock, or mutation'
  );
}


/*
 * The identical maintenance gate must remain valid while ScriptLock is held.
 */
{
  const harness =
    createHarness({
      maintenanceGateDrift:
        true
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /maintenance gate changed/
  );

  assert.equal(
    harness.state
      .maintenanceGateCalls,
    2
  );

  assert.equal(
    harness.state.fetchCalls,
    1
  );

  assert.equal(
    harness.state.callbackCalls,
    1
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  pass(
    'maintenance gate drift under lock fails before insert'
  );
}


/*
 * Source identity drift fails before lock acquisition.
 */
{
  const harness =
    createHarness({
      canonicalDrift:
        true
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /canonical identity drifted/
  );

  assert.equal(
    harness.state.fetchCalls,
    1
  );

  assert.equal(
    harness.state.lockCalls,
    0
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  pass(
    'fresh-source identity drift fails before database lock acquisition'
  );
}

/*
 * Lock contention fails before callback or mutation.
 */
{
  const harness =
    createHarness({
      lockAvailable:
        false
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /contended/
  );

  assert.equal(
    harness.state.callbackCalls,
    0
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  pass(
    'lock contention executes no callback and no insert'
  );
}

/*
 * Schema drift is checked under exclusive lock before insert.
 */
{
  const harness =
    createHarness({
      schemaDrift:
        true
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /schema differs/
  );

  assert.equal(
    harness.state.callbackCalls,
    1
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  assert.ok(
    harness.state.events.indexOf(
      'lock:callback'
    ) <
      harness.state.events.indexOf(
        'db:headers'
      )
  );

  pass(
    'schema boundary is rechecked under lock before mutation'
  );
}

/*
 * Exact modern/legacy/reconstructed observation identity blocks replay.
 */
{
  const harness =
    createHarness({
      rows: [
        {
          'Distress Lead ID':
            'DL-EXISTING',

          Source:
            'PA-PHILADELPHIA',

          'Source Dataset':
            'code_violations',

          'Source Record ID':
            '101',

          'Source Observation Key':
            '',

          'Source Record Key':
            '',

          'Canonical Property Key':
            CANONICAL
        }
      ]
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /already exists/
  );

  assert.equal(
    harness.state.insertCalls,
    0
  );

  pass(
    'reconstructed exact observation identity blocks duplicate insert'
  );
}

/*
 * Successful invocation performs one source fetch then one insert under lock,
 * followed by exact post-insert reconciliation.
 */
{
  const harness =
    createHarness();

  const result =
    harness.execute({
      sourceObservationKey:
        KEY,

      confirmInsert:
        true
    });

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.insertExecuted,
    true
  );

  assert.equal(
    result.maintenanceGateId,
    'GATE-HARNESS'
  );

  assert.equal(
    harness.state
      .maintenanceGateCalls,
    2
  );

  assert.equal(
    result.updateExecuted,
    false
  );

  assert.equal(
    result.upsertExecuted,
    false
  );

  assert.equal(
    result.deleteExecuted,
    false
  );

  assert.equal(
    result.dedupeExecuted,
    false
  );

  assert.equal(
    result.postInsertObservationCount,
    1
  );

  assert.equal(
    result.postInsertReconciled,
    true
  );

  assert.equal(
    result.automaticMutationAuthorityGranted,
    false
  );

  assert.equal(
    result.automaticInsertAuthorityGranted,
    false
  );

  assert.equal(
    harness.state.fetchCalls,
    1
  );

  assert.equal(
    harness.state.lockCalls,
    1
  );

  assert.equal(
    harness.state.insertCalls,
    1
  );

  const sourceFetch =
    harness.state.events.indexOf(
      'source:fetch'
    );

  const lockCallback =
    harness.state.events.indexOf(
      'lock:callback'
    );

  const headers =
    harness.state.events.indexOf(
      'db:headers'
    );

  const insert =
    harness.state.events.indexOf(
      'db:insert'
    );

  assert.ok(
    sourceFetch >= 0 &&
    lockCallback > sourceFetch &&
    headers > lockCallback &&
    insert > headers
  );

  pass(
    'successful recovery is one source fetch plus one lock-bound Database.insert'
  );
}

/*
 * Failure after insert attempt is always treated as ambiguous/no-retry.
 */
{
  const harness =
    createHarness({
      dropPostInsert:
        true
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /C1_INSERT_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
  );

  assert.equal(
    harness.state.insertCalls,
    1
  );

  pass(
    'post-write reconciliation failure requires read-only reconciliation before retry'
  );
}

/*
 * Lock-owner finalization failure after callback success is also ambiguous,
 * because the append may already be durable.
 */
{
  const harness =
    createHarness({
      ownerAfterCallbackError:
        true
    });

  expectThrow(
    () =>
      harness.execute({
        sourceObservationKey:
          KEY,

        confirmInsert:
          true
      }),
    /C1_INSERT_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
  );

  assert.equal(
    harness.state.insertCalls,
    1
  );

  pass(
    'post-insert lock-owner finalization error fails closed as ambiguous'
  );
}

console.log();
console.log(
  'PASS: COUNTY C1 INSERT-ONLY RECOVERY VALIDATION COMPLETE.'
);
