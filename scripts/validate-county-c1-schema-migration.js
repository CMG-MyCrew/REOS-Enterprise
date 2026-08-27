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

const BUILD =
  path.join(
    ROOT,
    'build',
    'apps-script-brand'
  );

const MODULE_PATH =
  path.join(
    BUILD,
    'CountyC1SchemaMigration.js'
  );

const SCHEMA_PATH =
  path.join(
    BUILD,
    'DistressLeadCountySchema.js'
  );

function pass(message) {
  console.log(
    'PASS: ' + message
  );
}

function read(file) {
  return fs.readFileSync(
    file,
    'utf8'
  );
}

function expectThrow(
  fn,
  fragment
) {
  assert.throws(
    fn,
    error =>
      String(
        error &&
        error.message
          ? error.message
          : error
      ).includes(
        fragment
      )
  );
}

function createHarness(options) {
  options =
    options || {};

  const requiredHeaders = [
    'Distress Lead ID',
    'Address',
    'City',
    'State',
    'Zip',
    'Owner Name',
    'Owner Mailing Address',
    'Distress Type',
    'Distress Score',
    'Estimated Value',
    'Estimated Repairs',
    'Suggested Offer',
    'Lead Source',
    'Status',
    'Notes',
    'Imported Deal ID',
    'Created At',
    'Updated At',
    'County',
    'Source',
    'Source Dataset',
    'Connector Run ID',
    'Parcel ID',
    'Source Record ID',
    'Source Record Key',
    'Source Observation Key',
    'Canonical Property Key',
    'Last Seen At',
    'Source Updated At',
    'Co-Owner Name',
    'Estimated Debt',
    'Assessment Value',
    'Year Built',
    'Land Acres',
    'Living Area',
    'Last Sale Date',
    'Last Sale Price',
    'Tax Delinquent Amount',
    'Tax Principal',
    'Tax Interest',
    'Tax Penalty',
    'Violation Amount',
    'Violation Number',
    'Violation Type',
    'Violation Status',
    'Vacancy Status',
    'Vacancy Rank',
    'Sheriff Auction ID',
    'Book/Writ',
    'Sale Type',
    'Sale Status',
    'Sale Date'
  ];

  const identityHeaders = [
    'Source Observation Key',
    'Canonical Property Key'
  ];

  const legacyHeaders =
    requiredHeaders.filter(
      header =>
        !identityHeaders.includes(
          header
        )
    );

  const state = {
    headers:
      (
        options.headers ||
        legacyHeaders
      ).slice(),

    rows: [
      {
        'Distress Lead ID':
          'DL-ONE',
        Address:
          '100 TEST ST',
        City:
          'Philadelphia',
        State:
          'PA',
        Zip:
          '19101',
        Source:
          'PA-PHILADELPHIA',
        'Source Dataset':
          'code_violations',
        'Source Record ID':
          '10',
        'Source Record Key':
          'pa-philadelphia|code_violations|10'
      },
      {
        'Distress Lead ID':
          'DL-TWO',
        Address:
          '200 TEST ST',
        City:
          'Philadelphia',
        State:
          'PA',
        Zip:
          '19102',
        Source:
          'PA-PHILADELPHIA',
        'Source Dataset':
          'code_violations',
        'Source Record ID':
          '11',
        'Source Record Key':
          'pa-philadelphia|code_violations|11'
      }
    ],

    headerWrites: [],
    headerReads: 0,
    rowReads: 0,
    sheetReads: 0,
    adminCalls: 0,
    lockAttempts: 0,
    lockReleases: 0,
    lockAvailable:
      options.lockAvailable !== false,
    mutateRowOnHeaderWrite:
      Boolean(
        options
          .mutateRowOnHeaderWrite
      )
  };

  function getAll() {
    state.rowReads += 1;

    return state.rows.map(
      (stored, index) => {
        const row = {};

        state.headers.forEach(
          header => {
            row[header] =
              Object.prototype
                .hasOwnProperty
                .call(
                  stored,
                  header
                )
                ? stored[header]
                : '';
          }
        );

        row._rowNumber =
          index + 2;

        return row;
      }
    );
  }

  const sandbox = {
    console,

    REOS: {
      Database: {
        getHeaders() {
          state.headerReads += 1;

          return state
            .headers
            .slice();
        },

        getAll,

        getSheet() {
          state.sheetReads += 1;

          return {
            getRange(
              row,
              column,
              rowCount,
              columnCount
            ) {
              return {
                setValues(values) {
                  state
                    .headerWrites
                    .push({
                      row,
                      column,
                      rowCount,
                      columnCount,
                      values:
                        JSON.parse(
                          JSON.stringify(
                            values
                          )
                        )
                    });

                  assert.equal(
                    row,
                    1
                  );

                  assert.equal(
                    rowCount,
                    1
                  );

                  assert.equal(
                    values.length,
                    1
                  );

                  assert.equal(
                    values[0].length,
                    columnCount
                  );

                  values[0]
                    .forEach(
                      (
                        value,
                        offset
                      ) => {
                        state.headers[
                          column -
                          1 +
                          offset
                        ] = value;
                      }
                    );

                  if (
                    state
                      .mutateRowOnHeaderWrite
                  ) {
                    state.rows[0]
                      .Address =
                      'EXTERNAL MUTATION';
                  }
                }
              };
            }
          };
        }
      },

      Security: {
        requireAdmin() {
          state.adminCalls += 1;
          return true;
        }
      }
    },

    LockService: {
      getScriptLock() {
        return {
          tryLock(timeout) {
            assert.equal(
              timeout,
              1000
            );

            state.lockAttempts += 1;

            return state.lockAvailable;
          },

          releaseLock() {
            state.lockReleases += 1;
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
        text
      ) {
        assert.equal(
          algorithm,
          'SHA_256'
        );

        return Array.from(
          crypto
            .createHash('sha256')
            .update(
              String(text),
              'utf8'
            )
            .digest()
        );
      }
    }
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    read(
      SCHEMA_PATH
    ),
    sandbox,
    {
      filename:
        'DistressLeadCountySchema.js'
    }
  );

  vm.runInContext(
    read(
      MODULE_PATH
    ),
    sandbox,
    {
      filename:
        'CountyC1SchemaMigration.js'
    }
  );

  return {
    sandbox,
    state,
    requiredHeaders,
    identityHeaders,
    legacyHeaders
  };
}

console.log(
  '=== COUNTY C1 IDENTITY SCHEMA MIGRATION CONTRACT ==='
);

const source =
  read(
    MODULE_PATH
  );

assert.equal(
  (
    source.match(
      /\.setValues\s*\(/g
    ) || []
  ).length,
  1,
  'module must contain exactly one setValues mutation primitive'
);

[
  'REOS.Database.insert',
  'REOS.Database.update',
  'REOS.Database.upsert',
  'REOS.Database.softDelete',
  'REOS.Database.ensureTable',
  'REOS.DistressLeadCountySchema.ensure',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK.run',
  'REOS_COUNTY_RUNTIME_SYNC',
  'ScriptApp.newTrigger',
  '.appendRow(',
  '.deleteColumn(',
  '.deleteColumns(',
  '.clearContents('
].forEach(
  forbidden => {
    assert.equal(
      source.includes(
        forbidden
      ),
      false,
      'forbidden mutation/execution surface: ' +
        forbidden
    );
  }
);

pass(
  'module structurally contains only one header-range mutation primitive'
);

assert.ok(
  source.includes(
    "'Source Observation Key'"
  )
);

assert.ok(
  source.includes(
    "'Canonical Property Key'"
  )
);

assert.ok(
  source.includes(
    'confirmMigration !=='
  )
);

assert.ok(
  source.includes(
    '.requireAdmin()'
  )
);

assert.ok(
  source.includes(
    '.getScriptLock()'
  )
);

assert.ok(
  source.includes(
    '.tryLock('
  )
);

assert.equal(
  source.includes(
    '.waitLock('
  ),
  false,
  'blocking waitLock is forbidden in C1 schema migration'
);

assert.ok(
  source.includes(
    'reosCountyC1SchemaMigrationInspect'
  )
);

assert.ok(
  source.includes(
    'reosCountyC1SchemaMigration'
  )
);

pass(
  'migration surface requires explicit confirmation, admin authority and locking'
);

{
  const h =
    createHarness();

  const result =
    h.sandbox
      .REOS
      .CountyC1SchemaMigration
      .inspect();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.mode,
    'READ_ONLY'
  );

  assert.equal(
    result.state,
    'READY_TO_APPEND'
  );

  assert.equal(
    result.currentHeaderCount,
    50
  );

  assert.equal(
    result.requiredFinalHeaderCount,
    52
  );

  assert.deepEqual(
    Array.from(
      result.missingHeaders
    ),
    h.identityHeaders
  );

  assert.equal(
    result.schemaMutationExecuted,
    false
  );

  assert.equal(
    result.insertAuthorityGranted,
    false
  );

  assert.equal(
    h.state.headerWrites.length,
    0
  );
}

pass(
  '50-column predecessor schema is detected read-only as exactly two columns behind'
);


{
  const h =
    createHarness();

  const result =
    h.sandbox
      .reosCountyC1SchemaMigrationInspect();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.mode,
    'READ_ONLY'
  );

  assert.equal(
    result.state,
    'READY_TO_APPEND'
  );

  assert.equal(
    result.currentHeaderCount,
    50
  );

  assert.equal(
    result.requiredFinalHeaderCount,
    52
  );

  assert.deepEqual(
    Array.from(
      result.missingHeaders
    ),
    h.identityHeaders
  );

  assert.equal(
    h.state.adminCalls,
    1
  );

  assert.equal(
    h.state.headerReads,
    1
  );

  assert.equal(
    h.state.rowReads,
    0
  );

  assert.equal(
    h.state.sheetReads,
    0
  );

  assert.equal(
    h.state.lockAttempts,
    0
  );

  assert.equal(
    h.state.lockReleases,
    0
  );

  assert.equal(
    h.state.headerWrites.length,
    0
  );
}

pass(
  'top-level C1 schema inspection remains admin-only, read-only and lock-free'
);

{
  const h =
    createHarness();

  expectThrow(
    () =>
      h.sandbox
        .REOS
        .CountyC1SchemaMigration
        .migrate({}),
    'confirmMigration=true'
  );

  assert.equal(
    h.state.headerWrites.length,
    0
  );

  assert.equal(
    h.state.lockAttempts,
    0
  );
}

pass(
  'missing explicit confirmation fails before locking or mutation'
);


{
  const h =
    createHarness({
      lockAvailable:
        false
    });

  expectThrow(
    () =>
      h.sandbox
        .REOS
        .CountyC1SchemaMigration
        .migrate({
          confirmMigration:
            true
        }),
    'lock is contended'
  );

  assert.equal(
    h.state.adminCalls,
    1
  );

  assert.equal(
    h.state.lockAttempts,
    1
  );

  assert.equal(
    h.state.lockReleases,
    0
  );

  assert.equal(
    h.state.headerReads,
    0
  );

  assert.equal(
    h.state.rowReads,
    0
  );

  assert.equal(
    h.state.sheetReads,
    0
  );

  assert.equal(
    h.state.headerWrites.length,
    0
  );
}

pass(
  'ScriptLock contention fails fast before DISTRESS_LEADS read or mutation'
);

{
  const h =
    createHarness();

  const drifted =
    h.legacyHeaders.slice();

  [
    drifted[0],
    drifted[1]
  ] = [
    drifted[1],
    drifted[0]
  ];

  const d =
    createHarness({
      headers:
        drifted
    });

  expectThrow(
    () =>
      d.sandbox
        .REOS
        .CountyC1SchemaMigration
        .migrate({
          confirmMigration:
            true
        }),
    'schema differs from certified'
  );

  assert.equal(
    d.state.headerWrites.length,
    0
  );
}

pass(
  'schema drift fails closed before header mutation'
);

{
  const h =
    createHarness();

  const result =
    h.sandbox
      .REOS
      .CountyC1SchemaMigration
      .migrate({
        confirmMigration:
          true
      });

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.outcome,
    'C1_IDENTITY_SCHEMA_TWO_COLUMNS_APPENDED'
  );

  assert.equal(
    result.beforeHeaderCount,
    50
  );

  assert.equal(
    result.afterHeaderCount,
    52
  );

  assert.equal(
    result.addedCount,
    2
  );

  assert.deepEqual(
    Array.from(
      result.addedHeaders
    ),
    h.identityHeaders
  );

  assert.equal(
    result.startColumn,
    51
  );

  assert.equal(
    result.beforeRowCount,
    2
  );

  assert.equal(
    result.afterRowCount,
    2
  );

  assert.equal(
    result
      .beforeRowFingerprintSha256,
    result
      .afterRowFingerprintSha256
  );

  assert.equal(
    result
      .preExistingRowDataUnchanged,
    true
  );

  assert.equal(
    result.schemaMutationExecuted,
    true
  );

  assert.equal(
    result.rowMutationExecuted,
    false
  );

  assert.equal(
    result.mutationAuthorityGranted,
    false
  );

  assert.equal(
    result.insertAuthorityGranted,
    false
  );

  assert.equal(
    h.state.headerWrites.length,
    1
  );

  assert.deepEqual(
    h.state.headerWrites[0],
    {
      row:
        1,
      column:
        51,
      rowCount:
        1,
      columnCount:
        2,
      values: [
        h.identityHeaders
      ]
    }
  );

  assert.deepEqual(
    h.state.headers,
    h.legacyHeaders.concat(
      h.identityHeaders
    )
  );

  assert.equal(
    h.state.lockAttempts,
    1
  );

  assert.equal(
    h.state.lockReleases,
    1
  );

  const repeat =
    h.sandbox
      .REOS
      .CountyC1SchemaMigration
      .migrate({
        confirmMigration:
          true
      });

  assert.equal(
    repeat.outcome,
    'C1_IDENTITY_SCHEMA_ALREADY_READY_NO_WRITE'
  );

  assert.equal(
    repeat.schemaMutationExecuted,
    false
  );

  assert.equal(
    repeat.addedCount,
    0
  );

  assert.equal(
    h.state.headerWrites.length,
    1
  );
}

pass(
  'successful migration appends exactly columns 51-52 once and retry is non-mutating'
);

{
  const h =
    createHarness({
      mutateRowOnHeaderWrite:
        true
    });

  expectThrow(
    () =>
      h.sandbox
        .REOS
        .CountyC1SchemaMigration
        .migrate({
          confirmMigration:
            true
        }),
    'row data changed during schema append'
  );

  assert.equal(
    h.state.headerWrites.length,
    1
  );

  assert.equal(
    h.state.lockReleases,
    1
  );
}

pass(
  'post-write fingerprint detects any concurrent pre-existing row mutation'
);

{
  const h =
    createHarness();

  const keys =
    Object.keys(
      h.sandbox
        .REOS
        .CountyC1SchemaMigration
    ).sort();

  assert.deepEqual(
    keys,
    [
      'inspect',
      'migrate'
    ]
  );
}

pass(
  'public module surface is limited to inspect + migrate'
);

console.log('');
console.log(
  'County C1 identity schema migration validation PASSED.'
);
