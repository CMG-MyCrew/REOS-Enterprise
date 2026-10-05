#!/usr/bin/env node
'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const path =
  require('path');

const vm =
  require('vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const RUNTIME =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'PhiladelphiaProbateAbsentPersistenceExecutor.js'
  );

const source =
  fs.readFileSync(
    RUNTIME,
    'utf8'
  );

const TABLE =
  'DISTRESS_LEADS';

const SOURCE =
  'PA-PHILADELPHIA';

const DATASET =
  'probate';

const SOURCE_RECORD_ID =
  'TLI-PROBATE-2026-09-30-OC-1170-DE-2026-372346800';

const SOURCE_OBSERVATION_KEY =
  'pa-philadelphia|probate|tli-probate-2026-09-30-oc-1170-de-2026-372346800';

const CANONICAL_PROPERTY_KEY =
  'property|parcel|pa|philadelphia|372346800';

const PARCEL_ID =
  '372346800';

const WRITER_ID =
  'COUNTY_CONNECTOR_LIVE_PERSISTENCE';

const INSERT_RECORD_SHA256 =
  '6511192926ced92e361ce6052325db6f8bd8647384c4391de8f2a364ca3cd698';

const DERIVED_IDENTITY_SHA256 =
  '648348883ef2457ffae33aac975843e04a97bd838db7a4485b8d3d7ff19b2c16';

const HEADERS = [
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
  'Sale Date',
  'Source Observation Key',
  'Canonical Property Key'
];

assert.strictEqual(
  HEADERS.length,
  52
);

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function sortedJson(value) {
  const ordered =
    {};

  Object.keys(value)
    .sort()
    .forEach(key => {
      ordered[key] =
        value[key];
    });

  return JSON.stringify(
    ordered
  );
}

const BASE_RECORD = {
  Address:
    '1225 W. Somerset Street',

  City:
    'Philadelphia',

  State:
    'PA',

  Zip:
    '19133',

  'Distress Type':
    'probate',

  Status:
    'Research',

  County:
    'Philadelphia',

  Source:
    SOURCE,

  'Source Dataset':
    DATASET,

  'Parcel ID':
    PARCEL_ID,

  'Source Record ID':
    SOURCE_RECORD_ID
};

assert.strictEqual(
  sha256(
    sortedJson(
      BASE_RECORD
    )
  ),
  INSERT_RECORD_SHA256
);

const DERIVED_IDENTITY = {
  'Source Record Key':
    SOURCE_OBSERVATION_KEY,

  'Source Observation Key':
    SOURCE_OBSERVATION_KEY,

  'Canonical Property Key':
    CANONICAL_PROPERTY_KEY
};

assert.strictEqual(
  sha256(
    sortedJson(
      DERIVED_IDENTITY
    )
  ),
  DERIVED_IDENTITY_SHA256
);

[
  SOURCE,
  DATASET,
  SOURCE_RECORD_ID,
  SOURCE_OBSERVATION_KEY,
  CANONICAL_PROPERTY_KEY,
  PARCEL_ID,
  WRITER_ID,
  INSERT_RECORD_SHA256,
  DERIVED_IDENTITY_SHA256,
  'EXPLICIT_SINGLE_PROBATE_ABSENT_INSERT_ONLY',
  'PHILADELPHIA_PROBATE_ABSENT_INSERT_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY'
].forEach(token => {
  assert(
    source.includes(token),
    'missing token: ' +
      token
  );
});

assert.strictEqual(
  (
    source.match(
      /function\s+reosPhiladelphiaProbateAbsentPersistenceExecutor\s*\(\s*\)/g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    source.match(
      /REOS\.Database\s*\.\s*insert\s*\(/g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    source.match(
      /REOS\.Database\s*\.\s*withScriptLockContext\s*\(/g
    ) ||
    []
  ).length,
  1
);

for (
  const prohibited
  of [
    'REOS.Database.update(',
    'REOS.Database.upsert(',
    'REOS.Database.delete(',
    'REOS.Database.ensureTable(',
    'UrlFetchApp',
    'CountyConnectorSDK.run(',
    'CountyConnectorSDK.runAll(',
    'ScriptApp.newTrigger',
    'SpreadsheetApp',
    '.setValue(',
    '.setValues(',
    '.appendRow(',
    '.deleteRow('
  ]
) {
  assert.strictEqual(
    source.includes(
      prohibited
    ),
    false,
    'prohibited surface: ' +
      prohibited
  );
}

for (
  const prohibitedField
  of [
    "'Owner Name':",
    "'Owner Mailing Address':",
    "'Estimated Value':",
    "'Estimated Repairs':",
    "'Suggested Offer':",
    "'Estimated Debt':"
  ]
) {
  assert.strictEqual(
    source.includes(
      prohibitedField
    ),
    false
  );
}

function normalize(value) {
  return String(
    value == null
      ? ''
      : value
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '%7c');
}

function normalizeParcel(value) {
  return String(
    value == null
      ? ''
      : value
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function canonicalResolve(row) {
  const sourceValue =
    normalize(
      row.Source
    );

  const dataset =
    normalize(
      row[
        'Source Dataset'
      ]
    );

  const sourceRecordId =
    normalize(
      row[
        'Source Record ID'
      ]
    );

  const parcelId =
    normalizeParcel(
      row[
        'Parcel ID'
      ]
    );

  const state =
    normalize(
      row.State
    );

  const county =
    normalize(
      row.County
    );

  const city =
    normalize(
      row.City
    );

  return {
    sourceObservationKey: [
      sourceValue,
      dataset,
      sourceRecordId ||
        parcelId
    ].join('|'),

    canonicalPropertyKey: [
      'property',
      'parcel',
      state,
      county ||
        city,
      parcelId
    ].join('|')
  };
}

function exactRow(
  id,
  overrides
) {
  return Object.assign(
    {
      'Distress Lead ID':
        id,

      Address:
        '1225 W. Somerset Street',

      City:
        'Philadelphia',

      State:
        'PA',

      Zip:
        '19133',

      'Distress Type':
        'probate',

      Status:
        'Research',

      County:
        'Philadelphia',

      Source:
        SOURCE,

      'Source Dataset':
        DATASET,

      'Parcel ID':
        PARCEL_ID,

      'Source Record ID':
        SOURCE_RECORD_ID,

      'Source Record Key':
        SOURCE_OBSERVATION_KEY,

      'Source Observation Key':
        SOURCE_OBSERVATION_KEY,

      'Canonical Property Key':
        CANONICAL_PROPERTY_KEY
    },
    overrides ||
      {}
  );
}

function createHarness(options) {
  const config =
    Object.assign(
      {
        rows:
          [],

        headers:
          HEADERS.slice(),

        adminDenied:
          false,

        leaseDenied:
          false,

        identityMismatch:
          false,

        insertThrows:
          false,

        postInsertCorrupt:
          false
      },
      options ||
        {}
    );

  const state = {
    adminCalls:
      0,

    lockCalls:
      0,

    getHeadersCalls:
      0,

    getAllCalls:
      0,

    leaseCalls:
      0,

    insertCalls:
      0
  };

  let rows =
    config.rows.map(
      row =>
        Object.assign(
          {},
          row
        )
    );

  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    Date,
    Error,
    RegExp
  };

  context.REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls++;

        if (
          config.adminDenied
        ) {
          throw new Error(
            'ADMIN_DENIED'
          );
        }

        return true;
      }
    },

    DistressLeadCountySchema: {
      requiredHeaders() {
        return HEADERS.slice();
      }
    },

    CanonicalPropertyIdentity: {
      resolve(record) {
        if (
          config.identityMismatch
        ) {
          return {
            sourceObservationKey:
              'mismatch',

            canonicalPropertyKey:
              'mismatch'
          };
        }

        return canonicalResolve(
          record
        );
      }
    },

    CountyMutationExclusionLease: {
      assertWriterAllowed(optionsArg) {
        state.leaseCalls++;

        assert.strictEqual(
          optionsArg.writerId,
          WRITER_ID
        );

        if (
          config.leaseDenied
        ) {
          throw new Error(
            'LEASE_DENIED'
          );
        }

        return {
          allowed:
            true
        };
      }
    },

    Database: {
      withScriptLockContext(work) {
        state.lockCalls++;

        return work({
          __reosScriptLockContext:
            true,

          depth:
            1
        });
      },

      getHeaders(table) {
        state.getHeadersCalls++;

        assert.strictEqual(
          table,
          TABLE
        );

        return config
          .headers
          .slice();
      },

      getAll(table) {
        state.getAllCalls++;

        assert.strictEqual(
          table,
          TABLE
        );

        return rows.map(
          row =>
            Object.assign(
              {},
              row
            )
        );
      },

      insert(
        table,
        record,
        insertOptions
      ) {
        state.insertCalls++;

        assert.strictEqual(
          table,
          TABLE
        );

        assert.strictEqual(
          insertOptions.idField,
          'Distress Lead ID'
        );

        assert.strictEqual(
          insertOptions.idPrefix,
          'DL'
        );

        assert.strictEqual(
          insertOptions
            .lockContext
            .__reosScriptLockContext,
          true
        );

        assert.strictEqual(
          Object.prototype
            .hasOwnProperty.call(
              record,
              'Distress Lead ID'
            ),
          false
        );

        for (
          const prohibited
          of [
            'Owner Name',
            'Estimated Value',
            'Estimated Repairs',
            'Suggested Offer'
          ]
        ) {
          assert.strictEqual(
            Object.prototype
              .hasOwnProperty.call(
                record,
                prohibited
              ),
            false
          );
        }

        if (
          config.insertThrows
        ) {
          throw new Error(
            'INSERT_THROW'
          );
        }

        const inserted =
          Object.assign(
            {},
            record,
            {
              'Distress Lead ID':
                'DL-TEST-PROBATE-1',

              'Created At':
                new Date(
                  '2026-10-05T12:00:00Z'
                ),

              'Updated At':
                new Date(
                  '2026-10-05T12:00:00Z'
                )
            }
          );

        rows.push(
          inserted
        );

        if (
          config.postInsertCorrupt
        ) {
          rows[
            rows.length - 1
          ][
            'Canonical Property Key'
          ] =
            'property|parcel|pa|philadelphia|999999999';
        }

        return Object.assign(
          {},
          inserted
        );
      }
    }
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    source,
    context,
    {
      filename:
        'PhiladelphiaProbateAbsentPersistenceExecutor.js'
    }
  );

  return {
    state,

    call(arg) {
      if (
        arguments.length === 0
      ) {
        return context
          .reosPhiladelphiaProbateAbsentPersistenceExecutor();
      }

      return context
        .reosPhiladelphiaProbateAbsentPersistenceExecutor(
          arg
        );
    }
  };
}

function expectThrow(
  fn,
  pattern
) {
  let error =
    null;

  try {
    fn();
  } catch (caught) {
    error =
      caught;
  }

  assert.ok(
    error,
    'expected throw'
  );

  if (pattern) {
    assert.match(
      String(
        error.message ||
        error
      ),
      pattern
    );
  }
}

let testCount =
  0;

function test(
  name,
  fn
) {
  fn();

  testCount++;

  console.log(
    'PASS ' +
    testCount +
    ': ' +
    name
  );
}

test(
  'admin denial before lock',
  () => {
    const h =
      createHarness({
        adminDenied:
          true
      });

    expectThrow(
      () => h.call(),
      /ADMIN_DENIED/
    );

    assert.strictEqual(
      h.state.lockCalls,
      0
    );

    assert.strictEqual(
      h.state.insertCalls,
      0
    );
  }
);

test(
  'schema drift fails before snapshot or insert',
  () => {
    const headers =
      HEADERS.slice();

    headers[0] =
      'bad header';

    const h =
      createHarness({
        headers
      });

    expectThrow(
      () => h.call(),
      /schema differs/
    );

    assert.strictEqual(
      h.state.getAllCalls,
      0
    );

    assert.strictEqual(
      h.state.insertCalls,
      0
    );
  }
);

test(
  'source record id match blocks insert',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            'DL-A',
            {
              'Source Record Key':
                '',

              'Source Observation Key':
                ''
            }
          )
        ]
      });

    expectThrow(
      () => h.call(),
      /no longer ABSENT/
    );

    assert.strictEqual(
      h.state.insertCalls,
      0
    );
  }
);

test(
  'source observation key match blocks insert',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            'DL-B',
            {
              'Source Record ID':
                'OTHER',

              'Source Record Key':
                ''
            }
          )
        ]
      });

    expectThrow(
      () => h.call(),
      /no longer ABSENT/
    );

    assert.strictEqual(
      h.state.insertCalls,
      0
    );
  }
);

test(
  'source record key match blocks insert',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            'DL-C',
            {
              'Source Record ID':
                'OTHER',

              'Source Observation Key':
                ''
            }
          )
        ]
      });

    expectThrow(
      () => h.call(),
      /no longer ABSENT/
    );

    assert.strictEqual(
      h.state.insertCalls,
      0
    );
  }
);

test(
  'stored identity comparison remains exact',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            'DL-W',
            {
              'Source Record ID':
                SOURCE_RECORD_ID +
                ' ',

              'Source Record Key':
                SOURCE_OBSERVATION_KEY +
                ' ',

              'Source Observation Key':
                SOURCE_OBSERVATION_KEY +
                ' '
            }
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.ok,
      true
    );

    assert.strictEqual(
      h.state.insertCalls,
      1
    );
  }
);

test(
  'different observation on same property does not block',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            'DL-OTHER',
            {
              'Source Record ID':
                'OTHER-PROBATE',

              'Source Record Key':
                'pa-philadelphia|probate|other-probate',

              'Source Observation Key':
                'pa-philadelphia|probate|other-probate'
            }
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.preInsertExactIdentityCount,
      0
    );

    assert.strictEqual(
      out.postInsertExactIdentityCount,
      1
    );

    assert.strictEqual(
      h.state.insertCalls,
      1
    );
  }
);

test(
  'identity mismatch fails before lease and insert',
  () => {
    const h =
      createHarness({
        identityMismatch:
          true
      });

    expectThrow(
      () => h.call(),
      /canonical identity mismatch/
    );

    assert.strictEqual(
      h.state.leaseCalls,
      0
    );

    assert.strictEqual(
      h.state.insertCalls,
      0
    );
  }
);

test(
  'lease denial fails before insert',
  () => {
    const h =
      createHarness({
        leaseDenied:
          true
      });

    expectThrow(
      () => h.call(),
      /LEASE_DENIED/
    );

    assert.strictEqual(
      h.state.leaseCalls,
      1
    );

    assert.strictEqual(
      h.state.insertCalls,
      0
    );
  }
);

test(
  'happy path executes one generated-id insert',
  () => {
    const h =
      createHarness();

    const out =
      h.call();

    assert.strictEqual(
      out.ok,
      true
    );

    assert.strictEqual(
      out.mode,
      'EXPLICIT_SINGLE_PROBATE_ABSENT_INSERT_ONLY'
    );

    assert.strictEqual(
      out.insertedDistressLeadId,
      'DL-TEST-PROBATE-1'
    );

    assert.strictEqual(
      out.preInsertExactIdentityCount,
      0
    );

    assert.strictEqual(
      out.postInsertExactIdentityCount,
      1
    );

    assert.strictEqual(
      out.postInsertReconciled,
      true
    );

    assert.strictEqual(
      out.certifiedInsertRecordSha256,
      INSERT_RECORD_SHA256
    );

    assert.strictEqual(
      out.certifiedDerivedIdentitySha256,
      DERIVED_IDENTITY_SHA256
    );

    assert.strictEqual(
      out.arvAuthorityGranted,
      false
    );

    assert.strictEqual(
      out.repairScopeAuthorityGranted,
      false
    );

    assert.strictEqual(
      out.maoAuthorityGranted,
      false
    );

    assert.strictEqual(
      out.offerAuthorityGranted,
      false
    );

    assert.strictEqual(
      h.state.lockCalls,
      1
    );

    assert.strictEqual(
      h.state.leaseCalls,
      1
    );

    assert.strictEqual(
      h.state.insertCalls,
      1
    );

    assert.strictEqual(
      h.state.getAllCalls,
      2
    );
  }
);

test(
  'caller argument cannot alter fixed target',
  () => {
    const h =
      createHarness();

    const out =
      h.call({
        sourceRecordId:
          'ATTACKER',

        parcelId:
          '999999999'
      });

    assert.strictEqual(
      out.sourceRecordId,
      SOURCE_RECORD_ID
    );

    assert.strictEqual(
      out.parcelId,
      PARCEL_ID
    );

    assert.strictEqual(
      h.state.insertCalls,
      1
    );
  }
);

test(
  'insert exception is ambiguous and non-retryable',
  () => {
    const h =
      createHarness({
        insertThrows:
          true
      });

    expectThrow(
      () => h.call(),
      /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );

    assert.strictEqual(
      h.state.insertCalls,
      1
    );
  }
);

test(
  'post-insert reconciliation failure is ambiguous and non-retryable',
  () => {
    const h =
      createHarness({
        postInsertCorrupt:
          true
      });

    expectThrow(
      () => h.call(),
      /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
    );

    assert.strictEqual(
      h.state.insertCalls,
      1
    );
  }
);

assert.strictEqual(
  testCount,
  13
);

console.log(
  'PB1_PROBATE_ABSENT_PERSISTENCE_EXECUTOR_STATIC_CERTIFIED=true'
);

console.log(
  'PB1_PROBATE_ABSENT_PERSISTENCE_EXECUTOR_BEHAVIOR_CERTIFIED=true'
);

console.log(
  'PB1_PROBATE_ABSENT_PERSISTENCE_EXECUTOR_TEST_COUNT=' +
  testCount
);

console.log(
  'PB1_PROBATE_ABSENT_PERSISTENCE_EXECUTOR_MAX_INSERT_COUNT=1'
);

console.log(
  'PB1_PROBATE_ABSENT_PERSISTENCE_EXECUTOR_EXTERNAL_HTTP_CALL_COUNT=0'
);

console.log(
  'PB1_PROBATE_ABSENT_PERSISTENCE_EXECUTOR_IMPLEMENTATION_VALIDATED=true'
);
