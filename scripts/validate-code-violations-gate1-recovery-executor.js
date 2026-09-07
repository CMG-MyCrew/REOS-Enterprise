#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

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

const EXECUTOR_PATH =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyCodeViolationGate1RecoveryExecutor.js'
  );

const AUTHORITY_PATH =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyCodeViolationGate1RecoveryAuthority.js'
  );

const SCHEMA_PATH =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'DistressLeadCountySchema.js'
  );

const CANONICAL_PATH =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CanonicalPropertyIdentity.js'
  );

const executorSource =
  fs.readFileSync(
    EXECUTOR_PATH,
    'utf8'
  );

const authoritySource =
  fs.readFileSync(
    AUTHORITY_PATH,
    'utf8'
  );

const schemaSource =
  fs.readFileSync(
    SCHEMA_PATH,
    'utf8'
  );

const canonicalSource =
  fs.readFileSync(
    CANONICAL_PATH,
    'utf8'
  );


const CONNECTOR_ID =
  'PA-PHILADELPHIA';

const DATASET =
  'code_violations';

const CERTIFIED_ENDPOINT =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

const MANIFEST_SHA =
  '33733cdf3ea8fbfccf66dfe0904fe26999b184c2e367a920318b2d943fe6e8c6';

const CATALOG_SHA =
  '050857487383e799b0a9dc503dfeeae759e8ddf60e485e4ae94cb551e2b8731d';

const SOURCE_EVIDENCE_SHA =
  'fc6eaf12a1692882dd7e5fae62ea2985fb336c6c6287b017fbb18a28d672c1ef';

const LIVE_PREFLIGHT_SHA =
  '4c5f6fd76558708d0e993b81de5b807af437844dcf902db0940dab5fbff80257';


function pass(message) {
  console.log(
    'PASS: ' +
    message
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
    'Expected operation to throw.'
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
  '=== CODE VIOLATIONS GATE 1 BOUNDED RECOVERY EXECUTOR CONTRACT ==='
);


/*
 * Static containment.
 */
assert.equal(
  (
    executorSource.match(
      /REOS\.Database\s*\.insert\s*\(/g
    ) || []
  ).length,
  1,
  'executor must contain exactly one Database.insert call site'
);

[
  /REOS\.Database\s*\.update\s*\(/,
  /REOS\.Database\s*\.upsert\s*\(/,
  /REOS\.Database\s*\.softDelete\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /ScriptApp\s*\.newTrigger\s*\(/,
  /CountyRuntimeBridge\s*\.(?:run|sync|dryRun)\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(
      executorSource
    ),
    false,
    `forbidden executor mutation/execution surface: ${pattern}`
  );
});

assert.equal(
  (
    executorSource.match(
      /withScriptLockContext\s*\(/g
    ) || []
  ).length,
  1,
  'executor must own exactly one outer Database ScriptLock'
);

assert.ok(
  executorSource.includes(
    "var MAX_BATCH =\n    10;"
  ),
  '10-record batch bound missing'
);

assert.ok(
  executorSource.includes(
    'confirmDurableIdentity'
  ),
  'durable identity confirmation missing'
);

assert.ok(
  executorSource.includes(
    'violationnumber IN ('
  ),
  'durable Violation Number detail query missing'
);

assert.equal(
  executorSource.includes(
    'HISTORICAL_OBJECTID_CAP'
  ),
  false,
  'historical ObjectID cap must not control detail lookup'
);

assert.equal(
  executorSource.includes(
    'BOUNDARY_TIMESTAMP'
  ),
  false,
  'historical AK1 boundary must not control detail lookup'
);

pass(
  'static surface is bounded to one lock-owned Database.insert call site and no broad mutation authority'
);


/*
 * Utility sandbox used only to obtain exact production authority and
 * schema contracts.
 */
const contractSandbox = {
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
  Math,
  REOS: {}
};

vm.createContext(
  contractSandbox
);

vm.runInContext(
  authoritySource,
  contractSandbox,
  {
    filename:
      AUTHORITY_PATH
  }
);

vm.runInContext(
  schemaSource,
  contractSandbox,
  {
    filename:
      SCHEMA_PATH
  }
);

vm.runInContext(
  canonicalSource,
  contractSandbox,
  {
    filename:
      CANONICAL_PATH
  }
);


const authorityModule =
  contractSandbox.REOS
    .CountyCodeViolationGate1RecoveryAuthority;

const schemaModule =
  contractSandbox.REOS
    .DistressLeadCountySchema;


const authorityKeys =
  Array.from(
    authoritySource.matchAll(
      /"(pa-philadelphia\|code_violations\|vi-\d{4}-\d{6})"\s*:\s*\{/g
    ),
    match =>
      match[1]
  );

const uniqueAuthorityKeys =
  Array.from(
    new Set(
      authorityKeys
    )
  );

assert.equal(
  uniqueAuthorityKeys.length,
  139,
  'expected exact 139-record certified recovery catalog'
);

const recoveryAuthorities =
  uniqueAuthorityKeys
    .map(key => {
      const authority =
        authorityModule.resolve(
          key
        );

      assert.ok(
        authority,
        'certified recovery authority did not resolve: ' +
          key
      );

      return Object.assign(
        {},
        authority
      );
    })
    .sort(
      (left, right) => {
        const leftDate =
          Number(
            left.evidenceViolationDate
          );

        const rightDate =
          Number(
            right.evidenceViolationDate
          );

        if (
          leftDate !==
          rightDate
        ) {
          return (
            leftDate -
            rightDate
          );
        }

        return String(
          left.violationNumber
        ).localeCompare(
          String(
            right.violationNumber
          )
        );
      }
    );

const requiredHeaders =
  schemaModule
    .requiredHeaders();

assert.equal(
  requiredHeaders.length,
  52,
  'expected exact 52-column DISTRESS_LEADS schema'
);

pass(
  'validator is bound to the exact 139-record recovery catalog and 52-column production schema'
);


function durableKey(
  violationNumber
) {
  return (
    'pa-philadelphia|code_violations|' +
    String(
      violationNumber
    )
      .trim()
      .toLowerCase()
  );
}


function canonicalForParcel(
  parcel
) {
  return (
    'property|parcel|pa|philadelphia|' +
    String(parcel)
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        ''
      )
  );
}


function clone(row) {
  return Object.assign(
    {},
    row
  );
}


function recoverySource(
  authority,
  objectIdOverride
) {
  const objectId =
    objectIdOverride ===
      undefined
      ? String(
          authority
            .evidenceObjectId
        )
      : String(
          objectIdOverride
        );

  return {
    objectId:
      objectId,

    violationNumber:
      authority
        .violationNumber,

    violationDate:
      Number(
        authority
          .evidenceViolationDate
      ),

    parcelId:
      authority
        .expectedParcelId,

    address:
      authority
        .evidenceAddress ||
      'CERTIFIED RECOVERY ADDRESS',

    violationStatus:
      'OPEN',

    priority:
      authority.priority ||
      'UNSAFE',

    durableObservationKey:
      authority
        .durableObservationKey,

    legacyObjectIdObservationKey:
      'pa-philadelphia|code_violations|' +
      objectId,

    canonicalPropertyKey:
      authority
        .expectedCanonicalPropertyKey
  };
}


const maxRecoveryDate =
  Math.max(
    ...recoveryAuthorities.map(
      authority =>
        Number(
          authority
            .evidenceViolationDate
        )
    )
  );


const nonRecoverySources =
  Array.from(
    {
      length:
        14
    },
    (_, index) => {
      const sequence =
        900000 +
        index;

      const violationNumber =
        'VI-2026-' +
        String(sequence)
          .padStart(
            6,
            '0'
          );

      const parcel =
        String(
          800000 +
          index
        );

      const objectId =
        String(
          990000 +
          index
        );

      return {
        objectId:
          objectId,

        violationNumber:
          violationNumber,

        violationDate:
          maxRecoveryDate +
          (
            index +
            1
          ) *
          1000,

        parcelId:
          parcel,

        address:
          (
            100 +
            index
          ) +
          ' SAFE TEST ST',

        violationStatus:
          'OPEN',

        priority:
          'UNSAFE',

        durableObservationKey:
          durableKey(
            violationNumber
          ),

        legacyObjectIdObservationKey:
          'pa-philadelphia|code_violations|' +
          objectId,

        canonicalPropertyKey:
          canonicalForParcel(
            parcel
          )
      };
    }
  );


function persistedRowFromSource(
  source,
  id
) {
  return {
    'Distress Lead ID':
      id,

    Address:
      source.address,

    City:
      'PHILADELPHIA',

    State:
      'PA',

    Zip:
      '19100',

    County:
      'Philadelphia',

    Source:
      CONNECTOR_ID,

    'Source Dataset':
      DATASET,

    'Parcel ID':
      source.parcelId,

    'Source Record ID':
      source.violationNumber,

    'Source Record Key':
      source.durableObservationKey,

    'Source Observation Key':
      source.durableObservationKey,

    'Canonical Property Key':
      source.canonicalPropertyKey,

    'Violation Number':
      source.violationNumber,

    'Violation Type':
      'Unsafe condition',

    'Violation Status':
      'OPEN',

    'Distress Type':
      'Code Violation'
  };
}


function safeRows() {
  return nonRecoverySources
    .map(
      (source, index) =>
        persistedRowFromSource(
          source,
          'DL-SAFE-' +
            String(
              index +
              1
            )
        )
    );
}


function authorityRow(
  authority,
  id
) {
  return persistedRowFromSource(
    recoverySource(
      authority
    ),
    id
  );
}


function createHarness(
  options = {}
) {
  const rows =
    safeRows();

  if (
    Array.isArray(
      options.initialRecoveryAuthorities
    )
  ) {
    options
      .initialRecoveryAuthorities
      .forEach(
        (authority, index) => {
          rows.push(
            authorityRow(
              authority,
              'DL-PREEXISTING-' +
                String(
                  index +
                  1
                )
            )
          );
        }
      );
  }

  const state = {
    adminCalls:
      0,

    reconciliationCalls:
      0,

    detailFetchCalls:
      0,

    registerCalls:
      0,

    maintenanceCalls:
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

    successfulInsertReturns:
      0,

    lastWhere:
      '',

    lastDetailViolations:
      [],

    throwAfterAppendEnabled:
      options
        .insertThrowAfterAppendAt
        ? true
        : false,

    insertedDurableKeys:
      [],

    events:
      []
  };


  function currentCanonical(
    row
  ) {
    try {
      return contractSandbox
        .REOS
        .CanonicalPropertyIdentity
        .canonicalPropertyIdentity(
          row
        )
        .key;
    } catch (error) {
      return '';
    }
  }


  function scopedRows() {
    return rows.filter(
      row =>
        String(
          row.Source ||
          ''
        ).trim() ===
          CONNECTOR_ID &&
        String(
          row[
            'Source Dataset'
          ] ||
          ''
        ).trim() ===
          DATASET
    );
  }


  function classifySource(
    source
  ) {
    const durableRows =
      scopedRows()
        .filter(
          row =>
            String(
              row[
                'Violation Number'
              ] ||
              ''
            )
              .trim()
              .toUpperCase() ===
            String(
              source.violationNumber
            )
              .trim()
              .toUpperCase()
        );

    const legacyRows =
      scopedRows()
        .filter(row => {
          const values = [
            row[
              'Source Observation Key'
            ],
            row[
              'Source Record Key'
            ]
          ]
            .map(
              value =>
                String(
                  value ||
                  ''
                )
                  .trim()
                  .toLowerCase()
            );

          return values.includes(
            String(
              source
                .legacyObjectIdObservationKey
            )
              .trim()
              .toLowerCase()
          );
        });

    if (
      legacyRows.some(
        row =>
          String(
            row[
              'Violation Number'
            ] ||
            ''
          )
            .trim()
            .toUpperCase() !==
          String(
            source.violationNumber
          )
            .trim()
            .toUpperCase()
      )
    ) {
      return 'LEGACY_OBJECTID_COLLISION';
    }

    if (
      !durableRows.length
    ) {
      return 'MISSING';
    }

    const canonicalKeys =
      Array.from(
        new Set(
          durableRows
            .map(
              currentCanonical
            )
            .filter(Boolean)
        )
      );

    if (
      canonicalKeys.length !==
        1 ||
      canonicalKeys[0] !==
        source.canonicalPropertyKey ||
      durableRows.some(
        row =>
          !currentCanonical(
            row
          )
      )
    ) {
      return 'PROPERTY_CONFLICT';
    }

    if (
      durableRows.length >
        1
    ) {
      return 'DUPLICATE_DURABLE';
    }

    return 'ALREADY_SAFE';
  }


  function currentRecoverySource(
    authority
  ) {
    let objectId =
      String(
        authority
          .evidenceObjectId
      );

    if (
      options.objectIdDrift ===
        true
    ) {
      objectId =
        String(
          Number(
            authority
              .evidenceObjectId
          ) +
          500000
        );
    }

    return recoverySource(
      authority,
      objectId
    );
  }


  function reconciliationResult() {
    state.reconciliationCalls +=
      1;

    state.events.push(
      'reconciliation'
    );

    const records = [];

    recoveryAuthorities
      .forEach(authority => {
        const source =
          currentRecoverySource(
            authority
          );

        records.push({
          classification:
            classifySource(
              source
            ),

          source:
            source
        });
      });

    nonRecoverySources
      .forEach(source => {
        records.push({
          classification:
            classifySource(
              source
            ),

          source:
            clone(
              source
            )
        });
      });

    records.sort(
      (left, right) => {
        const dateDelta =
          Number(
            left.source
              .violationDate
          ) -
          Number(
            right.source
              .violationDate
          );

        if (
          dateDelta !==
            0
        ) {
          return dateDelta;
        }

        return String(
          left.source
            .violationNumber
        ).localeCompare(
          String(
            right.source
              .violationNumber
          )
        );
      }
    );

    return {
      ok:
        true,

      readOnly:
        true,

      mode:
        'CODE_VIOLATIONS_PRODUCTION_COMPLETION_GATE_1',

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      records:
        records,

      countySchedulerTriggerCount:
        0,

      productionDataMutationAuthorityGranted:
        false,

      connectorExecutionAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }


  const connector = {
    normalize(
      raw,
      context
    ) {
      state.events.push(
        'normalize'
      );

      return {
        Address:
          raw.address,

        City:
          'PHILADELPHIA',

        State:
          'PA',

        Zip:
          raw.zip ||
          '19100',

        County:
          'Philadelphia',

        Source:
          CONNECTOR_ID,

        'Source Dataset':
          DATASET,

        'Connector Run ID':
          context.runId,

        'Parcel ID':
          raw.parcel_id_num,

        'Source Record ID':
          raw.objectid,

        'Source Updated At':
          raw.violationdate,

        'Distress Type':
          'Code Violation',

        'Violation Number':
          raw.violationnumber,

        'Violation Type':
          raw.violationcodetitle ||
          'Unsafe condition',

        'Violation Status':
          raw.violationstatus,

        Notes:
          'Harness normalized code violation'
      };
    },

    validate(record) {
      state.events.push(
        'validate'
      );

      if (
        options.validationFails ===
          true
      ) {
        return {
          ok:
            false,

          errors:
            [
              'HARNESS_VALIDATION_FAILURE'
            ]
        };
      }

      if (
        !record ||
        !String(
          record.Address ||
          ''
        ).trim() ||
        !String(
          record[
            'Parcel ID'
          ] ||
          ''
        ).trim() ||
        !String(
          record[
            'Violation Number'
          ] ||
          ''
        ).trim()
      ) {
        return {
          ok:
            false,

          errors:
            [
              'HARNESS_REQUIRED_FIELD_FAILURE'
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


  const lockContext = {
    capability:
      'GATE1-RECOVERY-HARNESS-LOCK'
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
    Math,

    REOS: {
      Security: {
        requireAdmin() {
          state.adminCalls +=
            1;

          state.events.push(
            'admin'
          );
        }
      },

      CountyCodeViolationGate1Reconciliation: {
        run() {
          return reconciliationResult();
        }
      },

      CountyCodeViolationGate1RecoveryAuthority: {
        metadata() {
          const metadata =
            Object.assign(
              {},
              authorityModule
                .metadata()
            );

          if (
            options.authorityMetadataDrift ===
              true
          ) {
            metadata.candidateCount =
              138;
          }

          return metadata;
        },

        resolve(key) {
          return authorityModule
            .resolve(
              key
            );
        }
      },

      CountyCodeViolationGate1RecoveryMaintenanceGate: {
        assertRecoveryReady(
          gateOptions
        ) {
          state.maintenanceCalls +=
            1;

          state.events.push(
            'maintenance'
          );

          assert.equal(
            gateOptions
              .maintenanceToken,
            'HARNESS-MAINTENANCE-TOKEN'
          );

          if (
            options.maintenanceRejected ===
              true
          ) {
            throw new Error(
              'HARNESS_MAINTENANCE_NOT_READY'
            );
          }

          const gateId =
            options.maintenanceGateDrift ===
              true &&
            state.maintenanceCalls >
              1
              ? 'GATE-DRIFT'
              : 'GATE-HARNESS';

          return {
            ok:
              true,

            ready:
              true,

            mode:
              'READ_ONLY_GATE1_RECOVERY_MAINTENANCE_ASSERTION',

            gateId:
              gateId,

            authority: {
              mode:
                'CODE_VIOLATIONS_GATE1_RECOVERY',

              candidateCount:
                139,

              manifestSha256:
                MANIFEST_SHA,

              catalogSha256:
                CATALOG_SHA,

              livePreflightSha256:
                LIVE_PREFLIGHT_SHA
            },

            managedCountySchedulerTriggerCount:
              0,

            mutationAuthorityGranted:
              false,

            insertAuthorityGranted:
              false,

            updateAuthorityGranted:
              false,

            deleteAuthorityGranted:
              false,

            checkpointMutationAuthorityGranted:
              false,

            schedulerAuthorityGranted:
              false,

            migrationAuthorityGranted:
              false,

            deduplicationAuthorityGranted:
              false,

            automaticOfferAuthorityGranted:
              false
          };
        }
      },

      DistressLeadCountySchema: {
        requiredHeaders() {
          return requiredHeaders.slice();
        }
      },

      CountyRuntimeBridge: {
        registerConnectors() {
          state.registerCalls +=
            1;

          state.events.push(
            'register'
          );

          return [
            CONNECTOR_ID
          ];
        }
      },

      CountyConnectorSDK: {
        get(id) {
          assert.equal(
            id,
            CONNECTOR_ID
          );

          return connector;
        },

        validateLead(record) {
          return connector
            .validate(
              record
            );
        }
      },

      CountyAdapters: {
        ArcGIS: {
          fetch(request) {
            state.detailFetchCalls +=
              1;

            state.events.push(
              'detail-fetch'
            );

            assert.equal(
              request.endpoint,
              CERTIFIED_ENDPOINT
            );

            assert.ok(
              Number(
                request.maxLimit
              ) <=
                10
            );

            assert.equal(
              request.returnGeometry,
              false
            );

            assert.equal(
              request.orderByFields,
              'violationdate ASC, violationnumber ASC'
            );

            state.lastWhere =
              String(
                request.where ||
                ''
              );

            assert.match(
              state.lastWhere,
              /violationnumber IN \(/
            );

            assert.match(
              state.lastWhere,
              /violationstatus = 'OPEN'/
            );

            assert.match(
              state.lastWhere,
              /caseprioritydesc IN \(/
            );

            assert.equal(
              /\bobjectid\b\s*(?:>|<|=|>=|<=|\bIN\b)/i
                .test(
                  state.lastWhere
                ),
              false,
              'detail query must not use ObjectID membership authority'
            );

            const requested =
              Array.from(
                new Set(
                  state.lastWhere
                    .match(
                      /VI-\d{4}-\d{6}/g
                    ) ||
                  []
                )
              );

            state.lastDetailViolations =
              requested.slice();

            if (
              options.detailCountMismatch ===
                true &&
              requested.length
            ) {
              requested.pop();
            }

            return {
              records:
                requested
                  .map(
                    violationNumber => {
                      const authority =
                        recoveryAuthorities
                          .find(
                            candidate =>
                              candidate
                                .violationNumber ===
                              violationNumber
                          );

                      assert.ok(
                        authority,
                        'detail query requested unauthorized violation: ' +
                          violationNumber
                      );

                      const source =
                        currentRecoverySource(
                          authority
                        );

                      let parcel =
                        source.parcelId;

                      if (
                        options.detailCanonicalDrift ===
                          true &&
                        violationNumber ===
                          requested[0]
                      ) {
                        parcel =
                          '999999999';
                      }

                      return {
                        objectid:
                          source.objectId,

                        violationnumber:
                          violationNumber,

                        violationdate:
                          Number(
                            authority
                              .evidenceViolationDate
                          ),

                        parcel_id_num:
                          parcel,

                        address:
                          source.address,

                        zip:
                          '19100',

                        violationstatus:
                          'OPEN',

                        caseprioritydesc:
                          authority.priority ||
                          'UNSAFE',

                        violationcodetitle:
                          'Unsafe condition'
                      };
                    }
                  )
            };
          }
        }
      },

      CanonicalPropertyIdentity:
        contractSandbox
          .REOS
          .CanonicalPropertyIdentity,

      Database: {
        getHeaders(sheetName) {
          state.headerReads +=
            1;

          state.events.push(
            'headers'
          );

          assert.equal(
            sheetName,
            'DISTRESS_LEADS'
          );

          if (
            options.schemaDrift ===
              true
          ) {
            return requiredHeaders
              .slice(
                0,
                -1
              );
          }

          return requiredHeaders
            .slice();
        },

        getAll(sheetName) {
          state.rowReads +=
            1;

          state.events.push(
            'getAll'
          );

          assert.equal(
            sheetName,
            'DISTRESS_LEADS'
          );

          return rows.map(
            clone
          );
        },

        withScriptLockContext(
          callback
        ) {
          state.lockCalls +=
            1;

          state.events.push(
            'lock'
          );

          if (
            options.lockAvailable ===
              false
          ) {
            throw new Error(
              'Database ScriptLock is contended; no operation executed.'
            );
          }

          if (
            typeof options
              .beforeLockMutation ===
              'function'
          ) {
            options
              .beforeLockMutation(
                rows
              );
          }

          state.callbackCalls +=
            1;

          return callback(
            lockContext
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
            'insert'
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

          const violation =
            String(
              record[
                'Violation Number'
              ] ||
              ''
            ).trim();

          assert.match(
            violation,
            /^VI-\d{4}-\d{6}$/
          );

          const expectedKey =
            durableKey(
              violation
            );

          assert.equal(
            String(
              record[
                'Source Record ID'
              ]
            ),
            violation,
            'Source Record ID must be durable Violation Number'
          );

          assert.equal(
            String(
              record[
                'Source Record Key'
              ]
            ).toLowerCase(),
            expectedKey
          );

          assert.equal(
            String(
              record[
                'Source Observation Key'
              ]
            ).toLowerCase(),
            expectedKey
          );

          assert.equal(
            String(
              record[
                'Canonical Property Key'
              ]
            ),
            canonicalForParcel(
              record[
                'Parcel ID'
              ]
            )
          );

          const inserted =
            Object.assign(
              {},
              record,
              {
                'Distress Lead ID':
                  'DL-HARNESS-' +
                  String(
                    state.insertCalls
                  )
              }
            );

          rows.push(
            inserted
          );

          state.insertedDurableKeys.push(
            expectedKey
          );

          if (
            state
              .throwAfterAppendEnabled &&
            state.insertCalls ===
              Number(
                options
                  .insertThrowAfterAppendAt
              )
          ) {
            state
              .throwAfterAppendEnabled =
              false;

            throw new Error(
              'HARNESS_AFTER_APPEND_FAILURE'
            );
          }

          state.successfulInsertReturns +=
            1;

          return clone(
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

            return (
              options.endpointDrift ===
                true
                ? 'https://example.test/drift'
                : CERTIFIED_ENDPOINT
            );
          }
        };
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        if (
          options.schedulerArmed ===
            true
        ) {
          return [
            {
              getHandlerFunction() {
                return 'reosCountyProductionSchedulerRun';
              }
            }
          ];
        }

        return [
          {
            getHandlerFunction() {
              return 'reosZillowGmailScheduledSync';
            }
          }
        ];
      }
    }
  };


  vm.createContext(
    sandbox
  );

  vm.runInContext(
    executorSource,
    sandbox,
    {
      filename:
        EXECUTOR_PATH
    }
  );


  return {
    rows,
    state,
    sandbox,

    execute(runOptions = {}) {
      const merged =
        Object.assign(
          {
            confirmRecovery:
              true,

            confirmDurableIdentity:
              true,

            maintenanceToken:
              'HARNESS-MAINTENANCE-TOKEN',

            maxInsertCount:
              10
          },
          runOptions
        );

      return sandbox
        .REOS
        .CountyCodeViolationGate1RecoveryExecutor
        .run(
          merged
        );
    }
  };
}


function rowsForViolation(
  harness,
  violationNumber
) {
  return harness.rows
    .filter(
      row =>
        String(
          row.Source ||
          ''
        ).trim() ===
          CONNECTOR_ID &&
        String(
          row[
            'Source Dataset'
          ] ||
          ''
        ).trim() ===
          DATASET &&
        String(
          row[
            'Violation Number'
          ] ||
          ''
        )
          .trim()
          .toUpperCase() ===
        String(
          violationNumber
        )
          .trim()
          .toUpperCase()
    );
}


/*
 * Explicit recovery confirmation precedes population/network/lock work.
 */
{
  const harness =
    createHarness();

  expectThrow(
    () =>
      harness.execute({
        confirmRecovery:
          false
      }),
    /confirmRecovery=true/
  );

  assert.equal(
    harness.state
      .reconciliationCalls,
    0
  );

  assert.equal(
    harness.state
      .detailFetchCalls,
    0
  );

  assert.equal(
    harness.state
      .lockCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'explicit recovery confirmation fails before population/network/lock/mutation'
  );
}


/*
 * Batch limit is a hard <= 10 boundary.
 */
{
  const harness =
    createHarness();

  expectThrow(
    () =>
      harness.execute({
        maxInsertCount:
          11
      }),
    /integer from 1 through 10/
  );

  assert.equal(
    harness.state
      .reconciliationCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'batch authority cannot exceed 10 durable inserts'
  );
}


/*
 * Recovery maintenance capability fails before population source work.
 */
{
  const harness =
    createHarness({
      maintenanceRejected:
        true
    });

  expectThrow(
    () =>
      harness.execute(),
    /HARNESS_MAINTENANCE_NOT_READY/
  );

  assert.equal(
    harness.state
      .maintenanceCalls,
    1
  );

  assert.equal(
    harness.state
      .reconciliationCalls,
    0
  );

  assert.equal(
    harness.state
      .detailFetchCalls,
    0
  );

  assert.equal(
    harness.state
      .lockCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'maintenance/quiescence rejection fails before source and mutation work'
  );
}


/*
 * County scheduler authority is independently rejected.
 */
{
  const harness =
    createHarness({
      schedulerArmed:
        true
    });

  expectThrow(
    () =>
      harness.execute(),
    /zero managed county scheduler triggers/
  );

  assert.equal(
    harness.state
      .maintenanceCalls,
    0
  );

  assert.equal(
    harness.state
      .reconciliationCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'armed county production scheduler fails closed before recovery authority'
  );
}


/*
 * Certified authority metadata drift fails before population source work.
 */
{
  const harness =
    createHarness({
      authorityMetadataDrift:
        true
    });

  expectThrow(
    () =>
      harness.execute(),
    /authority metadata mismatch/
  );

  assert.equal(
    harness.state
      .maintenanceCalls,
    0
  );

  assert.equal(
    harness.state
      .reconciliationCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    '139-record catalog metadata drift fails before production reconciliation'
  );
}


/*
 * Detail source canonical drift is detected before ScriptLock.
 */
{
  const harness =
    createHarness({
      detailCanonicalDrift:
        true
    });

  expectThrow(
    () =>
      harness.execute(),
    /selected durable source identity drift/
  );

  assert.equal(
    harness.state
      .reconciliationCalls,
    1
  );

  assert.equal(
    harness.state
      .detailFetchCalls,
    1
  );

  assert.equal(
    harness.state
      .lockCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'fresh canonical-property drift fails before database lock acquisition'
  );
}


/*
 * Lock contention performs no insert.
 */
{
  const harness =
    createHarness({
      lockAvailable:
        false
    });

  expectThrow(
    () =>
      harness.execute(),
    /contended/
  );

  assert.equal(
    harness.state
      .reconciliationCalls,
    1
  );

  assert.equal(
    harness.state
      .detailFetchCalls,
    1
  );

  assert.equal(
    harness.state
      .callbackCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'ScriptLock contention fails after bounded source verification and before mutation'
  );
}


/*
 * Maintenance gate must remain the exact same capability under lock.
 */
{
  const harness =
    createHarness({
      maintenanceGateDrift:
        true
    });

  expectThrow(
    () =>
      harness.execute(),
    /maintenance capability changed before insert/
  );

  assert.equal(
    harness.state
      .maintenanceCalls,
    2
  );

  assert.equal(
    harness.state
      .callbackCalls,
    1
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'maintenance-gate identity drift under lock fails before insert'
  );
}


/*
 * Schema drift under lock fails before insert.
 */
{
  const harness =
    createHarness({
      schemaDrift:
        true
    });

  expectThrow(
    () =>
      harness.execute(),
    /schema differs/
  );

  assert.equal(
    harness.state
      .callbackCalls,
    1
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'exact 52-column schema boundary is rechecked under lock'
  );
}


/*
 * New property conflict appearing after source reconciliation must fail
 * closed under lock.
 */
{
  const target =
    recoveryAuthorities[0];

  const harness =
    createHarness({
      beforeLockMutation(rows) {
        const source =
          recoverySource(
            target
          );

        const conflict =
          persistedRowFromSource(
            source,
            'DL-CONFLICT'
          );

        conflict[
          'Parcel ID'
        ] =
          '999999999';

        conflict[
          'Canonical Property Key'
        ] =
          canonicalForParcel(
            '999999999'
          );

        rows.push(
          conflict
        );
      }
    });

  expectThrow(
    () =>
      harness.execute(),
    /unsafe identity state.*PROPERTY_CONFLICT/
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'new lock-time canonical property conflict fails closed before insert'
  );
}


/*
 * New duplicate durable identity appearing after reconciliation also fails
 * closed under lock.
 */
{
  const target =
    recoveryAuthorities[0];

  const harness =
    createHarness({
      beforeLockMutation(rows) {
        const rowA =
          authorityRow(
            target,
            'DL-DUPLICATE-A'
          );

        const rowB =
          authorityRow(
            target,
            'DL-DUPLICATE-B'
          );

        rows.push(
          rowA,
          rowB
        );
      }
    });

  expectThrow(
    () =>
      harness.execute(),
    /unsafe identity state.*DUPLICATE_DURABLE/
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'new lock-time duplicate durable identity fails closed before insert'
  );
}


/*
 * Successful first bounded invocation inserts exactly 10 durable rows.
 */
{
  const harness =
    createHarness();

  const result =
    harness.execute();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.mode,
    'CODE_VIOLATIONS_GATE1_BOUNDED_DURABLE_RECOVERY'
  );

  assert.equal(
    result.batchLimit,
    10
  );

  assert.equal(
    result.detailSourceRecordCount,
    10
  );

  assert.equal(
    result.lockedMissingCountBefore,
    139
  );

  assert.equal(
    result.insertedCount,
    10
  );

  assert.equal(
    result.remainingMissingCount,
    129
  );

  assert.equal(
    result.complete,
    false
  );

  assert.equal(
    result.productionDataMutationPerformed,
    true
  );

  assert.equal(
    result.countySchedulerTriggerCount,
    0
  );

  [
    'persistentMutationAuthorityGranted',
    'insertAuthorityGranted',
    'updateAuthorityGranted',
    'deleteAuthorityGranted',
    'checkpointMutationAuthorityGranted',
    'schedulerAuthorityGranted',
    'migrationAuthorityGranted',
    'deduplicationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(field => {
    assert.equal(
      result[field],
      false,
      field +
        ' must remain false'
    );
  });

  assert.equal(
    harness.state
      .insertCalls,
    10
  );

  result.inserted
    .forEach(inserted => {
      assert.equal(
        rowsForViolation(
          harness,
          inserted
            .violationNumber
        ).length,
        1
      );

      assert.equal(
        inserted
          .sourceRecordId,
        inserted
          .violationNumber
      );

      assert.ok(
        inserted
          .currentObjectId
      );

      assert.ok(
        inserted
          .certifiedEvidenceObjectId
      );
    });

  pass(
    'successful invocation inserts exactly 10 certified durable observations and preserves all forbidden authorities as false'
  );


  /*
   * The next invocation must treat those 10 persisted identities as
   * progress rather than insert duplicates.
   */
  const firstInsertedKeys =
    new Set(
      result.inserted
        .map(
          inserted =>
            inserted
              .durableObservationKey
        )
    );

  const second =
    harness.execute();

  assert.equal(
    second.lockedMissingCountBefore,
    129
  );

  assert.equal(
    second.insertedCount,
    10
  );

  assert.equal(
    second.remainingMissingCount,
    119
  );

  second.inserted
    .forEach(inserted => {
      assert.equal(
        firstInsertedKeys.has(
          inserted
            .durableObservationKey
        ),
        false,
        'resumable execution reinserted a previously recovered durable identity'
      );
    });

  result.inserted
    .forEach(inserted => {
      assert.equal(
        rowsForViolation(
          harness,
          inserted
            .violationNumber
        ).length,
        1,
        'previously recovered durable identity was duplicated'
      );
    });

  pass(
    'repeated invocation is resumable/idempotent and advances only through persisted durable identities'
  );
}


/*
 * ObjectID drift remains telemetry only and does not redefine recovery
 * identity.
 */
{
  const harness =
    createHarness({
      objectIdDrift:
        true
    });

  const result =
    harness.execute({
      maxInsertCount:
        1
    });

  assert.equal(
    result.insertedCount,
    1
  );

  assert.notEqual(
    result.inserted[0]
      .currentObjectId,
    result.inserted[0]
      .certifiedEvidenceObjectId
  );

  const row =
    rowsForViolation(
      harness,
      result.inserted[0]
        .violationNumber
    )[0];

  assert.equal(
    row[
      'Source Record ID'
    ],
    result.inserted[0]
      .violationNumber
  );

  assert.equal(
    String(
      row[
        'Source Observation Key'
      ]
    ).toLowerCase(),
    result.inserted[0]
      .durableObservationKey
  );

  pass(
    'ArcGIS ObjectID drift is accepted as telemetry while Violation Number remains persisted observation authority'
  );
}


/*
 * A completed recovery population performs no detail source fetch and no
 * insert.
 */
{
  const harness =
    createHarness({
      initialRecoveryAuthorities:
        recoveryAuthorities
    });

  const result =
    harness.execute();

  assert.equal(
    result.lockedMissingCountBefore,
    0
  );

  assert.equal(
    result.insertedCount,
    0
  );

  assert.equal(
    result.remainingMissingCount,
    0
  );

  assert.equal(
    result.complete,
    true
  );

  assert.equal(
    result.productionDataMutationPerformed,
    false
  );

  assert.equal(
    harness.state
      .detailFetchCalls,
    0
  );

  assert.equal(
    harness.state
      .insertCalls,
    0
  );

  pass(
    'fully recovered population is idempotently non-mutating with no unnecessary detail fetch'
  );
}


/*
 * Partial-batch failure after an append leaves durable rows as the only
 * progress authority. A retry must not duplicate them.
 */
{
  const harness =
    createHarness({
      insertThrowAfterAppendAt:
        4
    });

  expectThrow(
    () =>
      harness.execute(),
    /batch insert failed after 3 successful durable insert/
  );

  assert.equal(
    harness.state
      .insertCalls,
    4
  );

  const firstFour =
    recoveryAuthorities
      .slice(
        0,
        4
      );

  firstFour
    .forEach(authority => {
      assert.equal(
        rowsForViolation(
          harness,
          authority
            .violationNumber
        ).length,
        1,
        'append-before-error durable observation was not preserved exactly once'
      );
    });

  const retry =
    harness.execute();

  assert.equal(
    retry.lockedMissingCountBefore,
    135
  );

  assert.equal(
    retry.insertedCount,
    10
  );

  assert.equal(
    retry.remainingMissingCount,
    125
  );

  firstFour
    .forEach(authority => {
      assert.equal(
        rowsForViolation(
          harness,
          authority
            .violationNumber
        ).length,
        1,
        'retry duplicated a durable identity recovered before partial failure'
      );
    });

  pass(
    'partial append failure is safely resumable using persisted durable identity as progress state'
  );
}


console.log();
console.log(
  'Code Violations Gate 1 bounded recovery executor validation PASSED.'
);
