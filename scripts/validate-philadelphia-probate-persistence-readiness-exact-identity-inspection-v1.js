#!/usr/bin/env node
'use strict';

const assert =
  require('assert');

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
    'PhiladelphiaProbatePersistenceReadinessExactIdentityInspection.js'
  );

const source =
  fs.readFileSync(
    RUNTIME,
    'utf8'
  );

const TABLE =
  'DISTRESS_LEADS';

const TARGET_SOURCE =
  'PA-PHILADELPHIA';

const TARGET_DATASET =
  'probate';

const TARGET_SOURCE_RECORD_ID =
  'TLI-PROBATE-2026-09-30-OC-1170-DE-2026-372346800';

const TARGET_SOURCE_OBSERVATION_KEY =
  'pa-philadelphia|probate|tli-probate-2026-09-30-oc-1170-de-2026-372346800';

const TARGET_CANONICAL_PROPERTY_KEY =
  'property|parcel|pa|philadelphia|372346800';

const TARGET_PARCEL_ID =
  '372346800';

const PUBLIC_RPC =
  'reosPhiladelphiaProbatePersistenceReadinessExactIdentityInspection';

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
  52,
  'validator fixture schema must contain 52 headers'
);

function count(pattern) {
  return (
    source.match(pattern) ||
    []
  ).length;
}

/*
 * Static target / public-surface certification.
 */
[
  TARGET_SOURCE,
  TARGET_DATASET,
  TARGET_SOURCE_RECORD_ID,
  TARGET_SOURCE_OBSERVATION_KEY,
  TARGET_CANONICAL_PROPERTY_KEY,
  TARGET_PARCEL_ID,
  'READ_ONLY',
  'DUPLICATE',
  'CONFLICT',
  'IDENTITY_DRIFT',
  'INCOMPLETE',
  'EXACT_EXISTING',
  'ABSENT'
].forEach(token => {
  assert(
    source.includes(token),
    'required runtime token missing: ' +
      token
  );
});

assert.strictEqual(
  count(
    /function\s+reosPhiladelphiaProbatePersistenceReadinessExactIdentityInspection\s*\(\s*\)/g
  ),
  1,
  'public RPC must exist exactly once with zero declared parameters'
);

assert.strictEqual(
  count(
    /function\s+inspect\s*\(\s*\)/g
  ),
  1,
  'fixed inspect method must have zero parameters'
);

assert.strictEqual(
  count(
    /REOS\.Security\s*\.\s*requireAdmin\s*\(\s*\)/g
  ),
  1,
  'requireAdmin must execute exactly once'
);

assert.strictEqual(
  count(
    /REOS\.Database\s*\.\s*getHeaders\s*\(\s*TABLE\s*\)/g
  ),
  1,
  'runtime must directly read DISTRESS_LEADS headers exactly once'
);

assert.strictEqual(
  count(
    /REOS\.Database\s*\.\s*getAll\s*\(\s*TABLE\s*\)/g
  ),
  1,
  'runtime must directly snapshot DISTRESS_LEADS exactly once'
);

assert(
  source.includes(
    'Object.freeze({'
  ),
  'runtime module surface must be frozen'
);

assert(
  source.includes(
    'physicalRowNumber_'
  ),
  'physical row authority helper missing'
);

assert(
  source.includes(
    'exactIdentityUnionRowCount'
  ),
  'exact identity union count missing'
);

assert(
  source.includes(
    'canonicalPropertyOtherObservationCount'
  ),
  'canonical property other-observation count missing'
);

assert(
  source.includes(
    'exactIdentityRowsTruncated'
  ),
  'exact identity truncation flag missing'
);

assert(
  source.includes(
    'canonicalPropertyRowsTruncated'
  ),
  'canonical context truncation flag missing'
);

for (
  const prohibited
  of [
    'REOS.Database.insert(',
    'REOS.Database.update(',
    'REOS.Database.upsert(',
    'REOS.Database.delete(',
    'REOS.Database.ensureTable(',
    'UrlFetchApp',
    'SpreadsheetApp',
    'appendRow(',
    'setValues(',
    'setValue(',
    'clearContent(',
    'deleteRow(',
    'insertRow(',
    'CountyConnectorSDK.run(',
    'CountyConnectorSDK.runAll(',
    'ScriptApp.newTrigger',
    'getProjectTriggers('
  ]
) {
  assert.strictEqual(
    source.includes(
      prohibited
    ),
    false,
    'prohibited runtime surface present: ' +
      prohibited
  );
}

/*
 * Returned payload must not expose prohibited owner / notes / valuation
 * fields.
 */
for (
  const prohibitedReturnToken
  of [
    "row['Owner Name']",
    "row['Owner Mailing Address']",
    'row.Notes',
    "row['Estimated Value']",
    "row['Assessment Value']"
  ]
) {
  assert.strictEqual(
    source.includes(
      prohibitedReturnToken
    ),
    false,
    'prohibited returned data surface present: ' +
      prohibitedReturnToken
  );
}

function canonicalResolve(row) {
  const sourceValue =
    String(
      row.Source == null
        ? ''
        : row.Source
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');

  const dataset =
    String(
      row['Source Dataset'] == null
        ? ''
        : row['Source Dataset']
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');

  const sourceRecordId =
    String(
      row['Source Record ID'] == null
        ? ''
        : row['Source Record ID']
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');

  const parcel =
    String(
      row['Parcel ID'] == null
        ? ''
        : row['Parcel ID']
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const state =
    String(
      row.State == null
        ? ''
        : row.State
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');

  const county =
    String(
      row.County == null
        ? ''
        : row.County
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');

  const city =
    String(
      row.City == null
        ? ''
        : row.City
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');

  if (!sourceValue) {
    throw new Error(
      'Source is required for source observation identity.'
    );
  }

  if (!dataset) {
    throw new Error(
      'Source Dataset is required for source observation identity.'
    );
  }

  if (!sourceRecordId && !parcel) {
    throw new Error(
      'Source Record ID or Parcel ID is required for source observation identity.'
    );
  }

  if (
    !parcel ||
    !state ||
    !(county || city)
  ) {
    throw new Error(
      'Canonical property identity requires parcel jurisdiction or exact address authority.'
    );
  }

  return {
    ok:
      true,

    sourceObservationKey:
      [
        sourceValue,
        dataset,
        sourceRecordId || parcel
      ].join('|'),

    canonicalPropertyKey:
      [
        'property',
        'parcel',
        state,
        county || city,
        parcel
      ].join('|'),

    authority:
      'parcel',

    observationAuthority:
      sourceRecordId
        ? 'source_record_id'
        : 'parcel'
  };
}

function exactRow(
  rowNumber,
  overrides
) {
  return Object.assign(
    {
      _rowNumber:
        rowNumber,

      'Distress Lead ID':
        'DL-TEST-' +
        String(rowNumber),

      Address:
        '1225 W. Somerset Street',

      City:
        'Philadelphia',

      State:
        'PA',

      Zip:
        '19133',

      County:
        'Philadelphia',

      Source:
        TARGET_SOURCE,

      'Source Dataset':
        TARGET_DATASET,

      'Parcel ID':
        TARGET_PARCEL_ID,

      'Source Record ID':
        TARGET_SOURCE_RECORD_ID,

      'Source Record Key':
        TARGET_SOURCE_OBSERVATION_KEY,

      'Source Observation Key':
        TARGET_SOURCE_OBSERVATION_KEY,

      'Canonical Property Key':
        TARGET_CANONICAL_PROPERTY_KEY
    },
    overrides || {}
  );
}

function otherCanonicalRow(
  rowNumber,
  suffix
) {
  const token =
    String(suffix);

  return exactRow(
    rowNumber,
    {
      'Distress Lead ID':
        'DL-OTHER-' +
        token,

      'Source Record ID':
        'OTHER-PROBATE-' +
        token,

      'Source Record Key':
        'pa-philadelphia|probate|other-probate-' +
        token.toLowerCase(),

      'Source Observation Key':
        'pa-philadelphia|probate|other-probate-' +
        token.toLowerCase()
    }
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

        identityThrowRows:
          []
      },
      options || {}
    );

  const throwRows =
    new Set(
      config.identityThrowRows
    );

  const state = {
    adminCalls:
      0,

    getHeadersCalls:
      0,

    getAllCalls:
      0,

    requiredHeadersCalls:
      0,

    resolveCalls:
      0,

    mutationCalls:
      0
  };

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
    RegExp,
    Infinity,
    NaN,
    isFinite
  };

  context.REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls++;

        if (config.adminDenied) {
          throw new Error(
            'ADMIN_DENIED'
          );
        }

        return true;
      }
    },

    Database: {
      getHeaders(table) {
        state.getHeadersCalls++;

        assert.strictEqual(
          table,
          TABLE
        );

        return config.headers.slice();
      },

      getAll(table) {
        state.getAllCalls++;

        assert.strictEqual(
          table,
          TABLE
        );

        return config.rows.map(
          row => Object.assign(
            {},
            row
          )
        );
      },

      insert() {
        state.mutationCalls++;
        throw new Error(
          'MUTATION_FORBIDDEN'
        );
      },

      update() {
        state.mutationCalls++;
        throw new Error(
          'MUTATION_FORBIDDEN'
        );
      },

      upsert() {
        state.mutationCalls++;
        throw new Error(
          'MUTATION_FORBIDDEN'
        );
      },

      delete() {
        state.mutationCalls++;
        throw new Error(
          'MUTATION_FORBIDDEN'
        );
      },

      ensureTable() {
        state.mutationCalls++;
        throw new Error(
          'MUTATION_FORBIDDEN'
        );
      }
    },

    DistressLeadCountySchema: {
      requiredHeaders() {
        state.requiredHeadersCalls++;
        return HEADERS.slice();
      }
    },

    CanonicalPropertyIdentity: {
      resolve(row) {
        state.resolveCalls++;

        if (
          throwRows.has(
            Number(
              row._rowNumber
            )
          )
        ) {
          throw new Error(
            'IDENTITY_RECONSTRUCTION_FAILED'
          );
        }

        return canonicalResolve(
          row
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
        'PhiladelphiaProbatePersistenceReadinessExactIdentityInspection.js'
    }
  );

  return {
    context,
    state,

    call(argument) {
      if (
        arguments.length === 0
      ) {
        return context[
          PUBLIC_RPC
        ]();
      }

      /*
       * JavaScript accepts extra arguments even when a function declares
       * zero parameters. Passing a caller target here proves it cannot
       * alter the compile-time-fixed diagnostic scope.
       */
      return context[
        PUBLIC_RPC
      ](
        argument
      );
    }
  };
}

function assertNoMutation(state) {
  assert.strictEqual(
    state.mutationCalls,
    0,
    'runtime must never invoke mutation surfaces'
  );
}

function assertReadCounts(
  state
) {
  assert.strictEqual(
    state.adminCalls,
    1,
    'requireAdmin count'
  );

  assert.strictEqual(
    state.getHeadersCalls,
    1,
    'direct target getHeaders count'
  );

  assert.strictEqual(
    state.getAllCalls,
    1,
    'direct target getAll count'
  );

  assert.strictEqual(
    state.requiredHeadersCalls,
    1,
    'requiredHeaders count'
  );

  assertNoMutation(
    state
  );
}

function expectThrow(
  fn,
  pattern
) {
  let thrown =
    null;

  try {
    fn();
  } catch (error) {
    thrown =
      error;
  }

  assert.ok(
    thrown,
    'expected function to throw'
  );

  if (pattern) {
    assert.match(
      String(
        thrown.message ||
        thrown
      ),
      pattern
    );
  }
}

function assertAuthorityFalse(
  result
) {
  [
    'persistenceAuthorityGranted',
    'databaseMutationAuthorityGranted',
    'insertAuthorityGranted',
    'updateAuthorityGranted',
    'distressLeadCreationAuthorityGranted',
    'repairAuthorityGranted',
    'migrationAuthorityGranted',
    'collapseAuthorityGranted',
    'winnerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'externalHttpAuthorityGranted',
    'ownerEvidenceAuthorityGranted',
    'schedulerAuthorityGranted',
    'checkpointMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(key => {
    assert.strictEqual(
      result[key],
      false,
      key + ' must remain false'
    );
  });
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
    String(testCount) +
    ': ' +
    name
  );
}

test(
  'admin denial fails before target table reads',
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
      h.state.adminCalls,
      1
    );

    assert.strictEqual(
      h.state.getHeadersCalls,
      0
    );

    assert.strictEqual(
      h.state.getAllCalls,
      0
    );

    assertNoMutation(
      h.state
    );
  }
);

test(
  'schema drift fails closed before DISTRESS_LEADS snapshot',
  () => {
    const drifted =
      HEADERS.slice();

    drifted[50] =
      'source observation key';

    const h =
      createHarness({
        headers:
          drifted
      });

    expectThrow(
      () => h.call(),
      /schema drift detected/
    );

    assert.strictEqual(
      h.state.adminCalls,
      1
    );

    assert.strictEqual(
      h.state.getHeadersCalls,
      1
    );

    assert.strictEqual(
      h.state.getAllCalls,
      0
    );

    assertNoMutation(
      h.state
    );
  }
);

test(
  'ABSENT classification with no exact or canonical rows',
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
      'READ_ONLY'
    );

    assert.strictEqual(
      out.persistencePrestateClassification,
      'ABSENT'
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      0
    );

    assert.strictEqual(
      out.counts
        .canonicalPropertyContextRowCount,
      0
    );

    assert.strictEqual(
      out.exactIdentityRows.length,
      0
    );

    assert.strictEqual(
      out.canonicalPropertyRows.length,
      0
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'ABSENT permits other probate observations on same canonical property',
  () => {
    const h =
      createHarness({
        rows: [
          otherCanonicalRow(
            20,
            'A'
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'ABSENT'
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      0
    );

    assert.strictEqual(
      out.counts
        .canonicalPropertyContextRowCount,
      1
    );

    assert.strictEqual(
      out.counts
        .canonicalPropertyOtherObservationCount,
      1
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'caller-supplied target cannot alter fixed ABSENT inspection',
  () => {
    const h =
      createHarness();

    const out =
      h.call({
        sourceRecordId:
          'ATTACKER-CONTROLLED',
        parcelId:
          '999999999'
      });

    assert.strictEqual(
      out.persistencePrestateClassification,
      'ABSENT'
    );

    assert.strictEqual(
      out.target.sourceRecordId,
      TARGET_SOURCE_RECORD_ID
    );

    assert.strictEqual(
      out.target.parcelId,
      TARGET_PARCEL_ID
    );

    assertReadCounts(
      h.state
    );
  }
);

test(
  'matching is exact and does not trim stored source record identity',
  () => {
    const h =
      createHarness({
        rows: [
          otherCanonicalRow(
            21,
            'B'
          )
        ]
      });

    h.context.REOS.Database.getAll =
      function (
        table
      ) {
        h.state.getAllCalls++;

        assert.strictEqual(
          table,
          TABLE
        );

        return [
          exactRow(
            21,
            {
              'Source Record ID':
                TARGET_SOURCE_RECORD_ID +
                ' ',

              'Source Record Key':
                TARGET_SOURCE_OBSERVATION_KEY +
                ' ',

              'Source Observation Key':
                TARGET_SOURCE_OBSERVATION_KEY +
                ' '
            }
          )
        ];
      };

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'ABSENT'
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      0
    );

    assertReadCounts(
      h.state
    );
  }
);

test(
  'EXACT_EXISTING classification requires one complete exact row',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            42
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'EXACT_EXISTING'
    );

    assert.strictEqual(
      out.counts
        .sourceRecordIdMatchCount,
      1
    );

    assert.strictEqual(
      out.counts
        .sourceObservationKeyMatchCount,
      1
    );

    assert.strictEqual(
      out.counts
        .sourceRecordKeyMatchCount,
      1
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      1
    );

    assert.strictEqual(
      out.exactIdentityRows.length,
      1
    );

    assert.strictEqual(
      out.exactIdentityRows[0]
        .rowNumber,
      42
    );

    assert.strictEqual(
      out.exactIdentityRows[0]
        .reconstructedSourceObservationKey,
      TARGET_SOURCE_OBSERVATION_KEY
    );

    assert.strictEqual(
      out.exactIdentityRows[0]
        .reconstructedCanonicalPropertyKey,
      TARGET_CANONICAL_PROPERTY_KEY
    );

    assert.strictEqual(
      out.exactIdentityRows[0]
        .identityError,
      ''
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'DUPLICATE precedence wins for multiple physical exact identity rows',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            42
          ),

          exactRow(
            43,
            {
              'Canonical Property Key':
                'property|parcel|pa|philadelphia|999999999'
            }
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'DUPLICATE'
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      2
    );

    assert.deepStrictEqual(
      Array.from(
        out.exactIdentityRows
      ).map(
        row =>
          row.rowNumber
      ),
      [
        42,
        43
      ]
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'CONFLICT precedence wins for one exact identity bound to another canonical property',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            50,
            {
              Source:
                'OTHER-SOURCE',

              'Canonical Property Key':
                'property|parcel|pa|philadelphia|999999999'
            }
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'CONFLICT'
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      1
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'IDENTITY_DRIFT precedence wins over incompleteness for source drift',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            60,
            {
              Source:
                'OTHER-SOURCE',

              'Source Observation Key':
                ''
            }
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'IDENTITY_DRIFT'
    );

    assert.strictEqual(
      out.counts
        .sourceRecordIdMatchCount,
      1
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      1
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'INCOMPLETE classification applies to missing stored identity columns',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            70,
            {
              'Source Record Key':
                '',

              'Source Observation Key':
                ''
            }
          )
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'INCOMPLETE'
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      1
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'INCOMPLETE classification applies when exact-row identity reconstruction fails',
  () => {
    const h =
      createHarness({
        rows: [
          exactRow(
            80
          )
        ],

        identityThrowRows: [
          80
        ]
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'INCOMPLETE'
    );

    assert.strictEqual(
      out.exactIdentityRows[0]
        .identityError,
      'IDENTITY_RECONSTRUCTION_FAILED'
    );

    assertReadCounts(
      h.state
    );

    assertAuthorityFalse(
      out
    );
  }
);

test(
  'exact identity return is bounded to five rows and reports truncation',
  () => {
    const rows =
      [];

    for (
      let index = 0;
      index < 6;
      index++
    ) {
      rows.push(
        exactRow(
          100 +
          index
        )
      );
    }

    const h =
      createHarness({
        rows
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'DUPLICATE'
    );

    assert.strictEqual(
      out.counts
        .exactIdentityUnionRowCount,
      6
    );

    assert.strictEqual(
      out.exactIdentityRows.length,
      5
    );

    assert.strictEqual(
      out.exactIdentityRowsTruncated,
      true
    );

    assertReadCounts(
      h.state
    );
  }
);

test(
  'canonical context return is bounded to ten rows and preserves full counts',
  () => {
    const rows =
      [];

    for (
      let index = 0;
      index < 11;
      index++
    ) {
      rows.push(
        otherCanonicalRow(
          200 +
          index,
          index + 1
        )
      );
    }

    const h =
      createHarness({
        rows
      });

    const out =
      h.call();

    assert.strictEqual(
      out.persistencePrestateClassification,
      'ABSENT'
    );

    assert.strictEqual(
      out.counts
        .canonicalPropertyContextRowCount,
      11
    );

    assert.strictEqual(
      out.counts
        .canonicalPropertyOtherObservationCount,
      11
    );

    assert.strictEqual(
      out.canonicalPropertyRows.length,
      10
    );

    assert.strictEqual(
      out.canonicalPropertyRowsTruncated,
      true
    );

    assertReadCounts(
      h.state
    );
  }
);

console.log(
  'PB1_EXACT_IDENTITY_INSPECTION_RUNTIME_STATIC_CERTIFIED=true'
);

console.log(
  'PB1_EXACT_IDENTITY_INSPECTION_BEHAVIOR_CERTIFIED=true'
);

console.log(
  'PB1_EXACT_IDENTITY_INSPECTION_BEHAVIOR_TEST_COUNT=' +
  String(testCount)
);

console.log(
  'PB1_EXACT_IDENTITY_INSPECTION_DIRECT_TARGET_GET_HEADERS_COUNT=1'
);

console.log(
  'PB1_EXACT_IDENTITY_INSPECTION_DIRECT_TARGET_GET_ALL_COUNT=1'
);

console.log(
  'PB1_EXACT_IDENTITY_INSPECTION_DATABASE_MUTATION_CALL_COUNT=0'
);

console.log(
  'PB1_PROBATE_PERSISTENCE_READINESS_EXACT_IDENTITY_INSPECTION_IMPLEMENTATION_VALIDATED=true'
);
