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

const SOURCE =
  'build/apps-script-brand/CountyC1InsertRecovery.js';

const SOURCE_OBSERVATION_KEY =
  'pa-philadelphia|code_violations|123';

const CANONICAL_PROPERTY_KEY =
  'pa|philadelphia|123-main-st';

const AUTHORITY_DESCRIPTOR_SOURCE_SHA256 =
  '9d5b728823107083c50f5bb4871e0fce47967e21eadd70a59e13f97e13a2eea9';

const AUTHORITY_CATALOG_SHA256 =
  'b5aeebee8bc5162c9557f2678bf62e1930fa1f6ad5ba369c27b3a1dabb55c091';

const code =
  fs.readFileSync(
    SOURCE,
    'utf8'
  );

function candidate() {
  return {
    planningClass:
      'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE',

    connectorId:
      'PA-PHILADELPHIA',

    dataset:
      'code_violations',

    sourceObservationKey:
      SOURCE_OBSERVATION_KEY,

    immutableSourceRecordId:
      '123',

    expectedCanonicalPropertyKey:
      CANONICAL_PROPERTY_KEY,

    historicalNormalizedSourceRecordSha256:
      'historical-source-sha',

    descriptorSha256:
      'descriptor-sha',

    authorityDescriptorSourceSha256:
      AUTHORITY_DESCRIPTOR_SOURCE_SHA256,

    authorityCatalogSha256:
      AUTHORITY_CATALOG_SHA256
  };
}

function createHarness(options) {
  options =
    options ||
    {};

  const headers = [
    'Distress Lead ID',
    'Source',
    'Source Dataset',
    'Source Record ID',
    'Source Record Key',
    'Source Observation Key',
    'Canonical Property Key',
    'Last Seen At'
  ];

  const normalized = {
    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Source Record ID':
      '123',

    Address:
      '123 Main St',

    City:
      'Philadelphia',

    State:
      'PA'
  };

  const state = {
    adminCalls:
      0,

    registerCalls:
      0,

    fetchCalls:
      0,

    maintenanceCalls:
      0,

    lockCalls:
      0,

    lockHeld:
      false,

    leaseCalls:
      0,

    leaseUnderLock:
      false,

    leaseWriterId:
      null,

    leaseRequestKeys:
      null,

    getAllCalls:
      0,

    insertCalls:
      0,

    insertUnderLock:
      false,

    insertLockContextSame:
      false,

    insertedRecord:
      null
  };

  const lockContext = {
    kind:
      'DATABASE_SCRIPT_LOCK_CONTEXT',

    token:
      'writer5-test-lock'
  };

  const matchingExistingRow = {
    'Distress Lead ID':
      'DL-EXISTING',

    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Source Record ID':
      '123',

    'Source Observation Key':
      SOURCE_OBSERVATION_KEY,

    'Canonical Property Key':
      CANONICAL_PROPERTY_KEY
  };

  const connector = {
    normalize(raw, context) {
      assert.equal(
        raw.objectid,
        '123'
      );

      assert.equal(
        context.dataset,
        'code_violations'
      );

      return Object.assign(
        {},
        normalized
      );
    },

    validate(record) {
      if (
        options.validationFails
      ) {
        return {
          ok: false,
          errors: ['forced']
        };
      }

      return {
        ok: true,
        errors: []
      };
    }
  };

  const sandbox = {
    console,

    Date,

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(name) {
            assert.equal(
              name,
              'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL'
            );

            return (
              'https://example.invalid/arcgis'
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

      Charset: {
        UTF_8:
          'UTF_8'
      },

      computeDigest(
        algorithm,
        value,
        charset
      ) {
        assert.equal(
          algorithm,
          'SHA_256'
        );

        assert.equal(
          charset,
          'UTF_8'
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
    },

    REOS: {
      Database: {
        getHeaders(table) {
          assert.equal(
            table,
            'DISTRESS_LEADS'
          );

          return headers.slice();
        },

        getAll(table) {
          assert.equal(
            table,
            'DISTRESS_LEADS'
          );

          state.getAllCalls += 1;

          if (
            options.existingBefore &&
            !state.insertedRecord
          ) {
            return [
              Object.assign(
                {},
                matchingExistingRow
              )
            ];
          }

          if (
            state.insertedRecord
          ) {
            if (
              options.postInsertMismatch
            ) {
              return [
                Object.assign(
                  {},
                  state.insertedRecord,
                  {
                    'Canonical Property Key':
                      'unexpected-canonical-key'
                  }
                )
              ];
            }

            return [
              Object.assign(
                {},
                state.insertedRecord
              )
            ];
          }

          return [];
        },

        withScriptLockContext(callback) {
          state.lockCalls += 1;

          assert.equal(
            state.lockHeld,
            false
          );

          state.lockHeld =
            true;

          try {
            return callback(
              lockContext
            );
          } finally {
            state.lockHeld =
              false;
          }
        },

        insert(
          table,
          record,
          insertOptions
        ) {
          state.insertCalls += 1;

          state.insertUnderLock =
            state.lockHeld;

          state.insertLockContextSame =
            Boolean(
              insertOptions &&
              insertOptions.lockContext ===
                lockContext
            );

          assert.equal(
            table,
            'DISTRESS_LEADS'
          );

          assert.equal(
            state.lockHeld,
            true,
            'insert must execute while Database ScriptLock is held'
          );

          assert.equal(
            state.leaseCalls,
            1,
            'lease guard must execute before insert'
          );

          assert.equal(
            insertOptions.idField,
            'Distress Lead ID'
          );

          assert.equal(
            insertOptions.idPrefix,
            'DL'
          );

          if (
            options.insertThrows
          ) {
            throw new Error(
              'forced insert failure'
            );
          }

          state.insertedRecord =
            Object.assign(
              {},
              record,
              {
                'Distress Lead ID':
                  'DL-000001'
              }
            );

          return Object.assign(
            {},
            state.insertedRecord
          );
        }
      },

      CountyC1MaintenanceGate: {
        assertRecoveryReady(request) {
          state.maintenanceCalls += 1;

          assert.equal(
            request.sourceObservationKey,
            SOURCE_OBSERVATION_KEY
          );

          if (
            options.maintenanceNotReady &&
            state.maintenanceCalls === 1
          ) {
            return {
              ready: false,
              gateId: ''
            };
          }

          if (
            options.maintenanceChanges &&
            state.maintenanceCalls === 2
          ) {
            return {
              ready: true,
              gateId:
                'GATE-CHANGED'
            };
          }

          return {
            ready: true,
            gateId:
              'GATE-1'
          };
        }
      },

      Security: {
        requireAdmin() {
          state.adminCalls += 1;
          return true;
        }
      },

      DistressLeadCountySchema: {
        requiredHeaders() {
          return headers.slice();
        }
      },

      CountyRuntimeBridge: {
        registerConnectors() {
          state.registerCalls += 1;
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
            ok: true,
            errors: []
          };
        }
      },

      CountyAdapters: {
        Registry: {
          fetch(
            adapter,
            request
          ) {
            state.fetchCalls += 1;

            assert.equal(
              adapter,
              'arcgis'
            );

            assert.equal(
              request.where,
              'objectid IN (123)'
            );

            if (
              options.sourceAbsent
            ) {
              return {
                records: []
              };
            }

            return {
              records: [
                {
                  objectid:
                    '123'
                }
              ]
            };
          }
        }
      },

      CanonicalPropertyIdentity: {
        resolve(record) {
          assert.equal(
            record['Source Record ID'],
            '123'
          );

          return {
            sourceObservationKey:
              SOURCE_OBSERVATION_KEY,

            canonicalPropertyKey:
              CANONICAL_PROPERTY_KEY
          };
        }
      },

      CountyC1CertifiedAuthority: {
        metadata() {
          if (
            options.invalidMetadata
          ) {
            return {
              mode:
                'INVALID'
            };
          }

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
              AUTHORITY_DESCRIPTOR_SOURCE_SHA256,

            catalogSha256:
              AUTHORITY_CATALOG_SHA256,

            descriptorCount:
              664,

            recordCount:
              664,

            mutationAuthorityGranted:
              false,

            insertAuthorityGranted:
              false
          };
        },

        resolve(key) {
          assert.equal(
            key,
            SOURCE_OBSERVATION_KEY
          );

          return candidate();
        }
      },

      CountyMutationExclusionLease: {
        assertWriterAllowed(request) {
          state.leaseCalls += 1;

          state.leaseUnderLock =
            state.lockHeld;

          state.leaseWriterId =
            request &&
            request.writerId;

          state.leaseRequestKeys =
            Object.keys(
              request ||
              {}
            )
              .sort()
              .join(',');

          assert.equal(
            state.lockHeld,
            true,
            'lease assertion must execute under existing Database ScriptLock'
          );

          assert.equal(
            state.leaseRequestKeys,
            'writerId'
          );

          assert.equal(
            state.leaseWriterId,
            'COUNTY_C1_INSERT_RECOVERY'
          );

          if (
            options.leaseDenied
          ) {
            throw new Error(
              'LEASE_DENIED'
            );
          }

          return {
            ok: true,
            allowed: true,
            writerId:
              'COUNTY_C1_INSERT_RECOVERY'
          };
        }
      }
    }
  };

  if (
    options.omitLease
  ) {
    delete sandbox
      .REOS
      .CountyMutationExclusionLease;
  }

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    code,
    sandbox,
    {
      filename:
        SOURCE
    }
  );

  function execute(overrides) {
    return sandbox
      .REOS
      .CountyC1InsertRecovery
      .execute(
        Object.assign(
          {
            confirmInsert:
              true,

            sourceObservationKey:
              SOURCE_OBSERVATION_KEY,

            maintenanceToken:
              'MAINTENANCE-TOKEN'
          },
          overrides ||
          {}
        )
      );
  }

  return {
    state,
    execute
  };
}

let cases =
  0;

function pass(label) {
  cases += 1;
  console.log(
    'PASS: ' + label
  );
}

/*
 * 1. Confirmation remains mandatory before any lock or lease assertion.
 */
{
  const h =
    createHarness();

  assert.throws(
    () => h.execute({
      confirmInsert:
        false
    }),
    /confirmInsert=true/
  );

  assert.equal(
    h.state.lockCalls,
    0
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  pass(
    'missing confirmation fails before lock and lease'
  );
}

/*
 * 2. Multi-candidate authority remains prohibited.
 */
{
  const h =
    createHarness();

  assert.throws(
    () => h.execute({
      candidates:
        []
    }),
    /exactly one sourceObservationKey/
  );

  assert.equal(
    h.state.lockCalls,
    0
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  pass(
    'multi-candidate request remains prohibited'
  );
}

/*
 * 3. Bad certified authority fails before mutation.
 */
{
  const h =
    createHarness({
      invalidMetadata:
        true
    });

  assert.throws(
    () => h.execute(),
    /authority metadata mismatch/
  );

  assert.equal(
    h.state.insertCalls,
    0
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  pass(
    'authority mismatch fails before lease and insert'
  );
}

/*
 * 4. Maintenance readiness remains a pre-network gate.
 */
{
  const h =
    createHarness({
      maintenanceNotReady:
        true
    });

  assert.throws(
    () => h.execute(),
    /maintenance gate is not recovery-ready/
  );

  assert.equal(
    h.state.fetchCalls,
    0
  );

  assert.equal(
    h.state.lockCalls,
    0
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  pass(
    'maintenance readiness remains pre-network'
  );
}

/*
 * 5. Missing source remains a no-lock/no-lease failure.
 */
{
  const h =
    createHarness({
      sourceAbsent:
        true
    });

  assert.throws(
    () => h.execute(),
    /exact source record is absent or non-unique/
  );

  assert.equal(
    h.state.lockCalls,
    0
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  assert.equal(
    h.state.insertCalls,
    0
  );

  pass(
    'source absence remains no-lock and no-write'
  );
}

/*
 * 6. Existing observation remains a lease-free no-write path.
 */
{
  const h =
    createHarness({
      existingBefore:
        true,
      omitLease:
        true
    });

  assert.throws(
    () => h.execute(),
    /already exists/
  );

  assert.equal(
    h.state.lockCalls,
    1
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  assert.equal(
    h.state.insertCalls,
    0
  );

  pass(
    'already-existing observation remains lease-free no-write'
  );
}

/*
 * 7. Missing lease API fails closed immediately before mutation.
 */
{
  const h =
    createHarness({
      omitLease:
        true
    });

  assert.throws(
    () => h.execute(),
    /mutation-exclusion lease assertion is required/
  );

  assert.equal(
    h.state.lockCalls,
    1
  );

  assert.equal(
    h.state.insertCalls,
    0
  );

  pass(
    'missing lease API fails closed before insert'
  );
}

/*
 * 8. Lease denial fails closed before insert.
 */
{
  const h =
    createHarness({
      leaseDenied:
        true
    });

  assert.throws(
    () => h.execute(),
    /LEASE_DENIED/
  );

  assert.equal(
    h.state.leaseCalls,
    1
  );

  assert.equal(
    h.state.insertCalls,
    0
  );

  pass(
    'lease denial prevents insert'
  );
}

/*
 * 9. Changed maintenance gate fails before lease assertion.
 */
{
  const h =
    createHarness({
      maintenanceChanges:
        true
    });

  assert.throws(
    () => h.execute(),
    /maintenance gate changed before insert/
  );

  assert.equal(
    h.state.leaseCalls,
    0
  );

  assert.equal(
    h.state.insertCalls,
    0
  );

  pass(
    'maintenance revalidation remains before lease boundary'
  );
}

/*
 * 10. Successful lease assertion executes under the existing DB lock.
 */
{
  const h =
    createHarness();

  const result =
    h.execute();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    h.state.leaseCalls,
    1
  );

  assert.equal(
    h.state.leaseUnderLock,
    true
  );

  assert.equal(
    h.state.insertCalls,
    1
  );

  assert.equal(
    h.state.insertUnderLock,
    true
  );

  pass(
    'lease assertion and insert share existing Database lock'
  );
}

/*
 * 11. Lease request is exact and Writer #5-specific.
 */
{
  const h =
    createHarness();

  h.execute();

  assert.equal(
    h.state.leaseWriterId,
    'COUNTY_C1_INSERT_RECOVERY'
  );

  assert.equal(
    h.state.leaseRequestKeys,
    'writerId'
  );

  pass(
    'lease request contains exact Writer #5 identity only'
  );
}

/*
 * 12. Existing lockContext handoff to Database.insert is preserved.
 */
{
  const h =
    createHarness();

  h.execute();

  assert.equal(
    h.state.insertLockContextSame,
    true
  );

  assert.equal(
    h.state.insertCalls,
    1
  );

  pass(
    'Database.insert retains same outer lockContext'
  );
}

/*
 * 13. Post-insert uncertainty remains no-retry / ambiguous outcome.
 */
{
  const h =
    createHarness({
      postInsertMismatch:
        true
    });

  assert.throws(
    () => h.execute(),
    /C1_INSERT_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
  );

  assert.equal(
    h.state.insertCalls,
    1
  );

  assert.equal(
    h.state.leaseCalls,
    1
  );

  pass(
    'post-insert uncertainty remains no-retry ambiguous outcome'
  );
}

/*
 * 14. Static mutation topology remains one insert and no alternate CRUD.
 */
{
  assert.equal(
    (
      code.match(
        /REOS\.Database\.insert\(/g
      ) ||
      []
    ).length,
    1
  );

  assert.equal(
    (
      code.match(
        /\.withScriptLockContext\(/g
      ) ||
      []
    ).length,
    1
  );

  /*
   * The writer intentionally contains two direct textual references to
   * CountyMutationExclusionLease.assertWriterAllowed:
   *
   * - one fail-closed capability/type check
   * - one actual assertion invocation
   *
   * Certify those roles separately rather than treating the capability
   * check as a second mutation-boundary invocation.
   */
  assert.equal(
    (
      code.match(
        /typeof\s+REOS\.CountyMutationExclusionLease\s*\.\s*assertWriterAllowed/g
      ) ||
      []
    ).length,
    1
  );

  assert.equal(
    (
      code.match(
        /return\s+REOS\.CountyMutationExclusionLease\s*\.\s*assertWriterAllowed\s*\(/g
      ) ||
      []
    ).length,
    1
  );

  assert.equal(
    /REOS\.Database\.update\(/.test(
      code
    ),
    false
  );

  assert.equal(
    /REOS\.Database\.upsert\(/.test(
      code
    ),
    false
  );

  assert.equal(
    /REOS\.Database\.(?:softDelete|deletePhysicalRowExact|delete)\(/.test(
      code
    ),
    false
  );

  assert.equal(
    /\.assertOwnerReady\(/.test(
      code
    ),
    false
  );

  assert.equal(
    /\.openExclusive\(/.test(
      code
    ),
    false
  );

  pass(
    'single-insert mutation topology remains exact'
  );
}

assert.equal(
  cases,
  14
);

console.log(
  'c1_insert_recovery_cases=' +
  cases
);

console.log(
  'COUNTY_MUTATION_EXCLUSION_WRITER_COUNTY_C1_INSERT_RECOVERY_VALIDATION_PASSED=true'
);
