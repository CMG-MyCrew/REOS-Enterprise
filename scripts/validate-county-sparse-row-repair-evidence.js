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
    'CountySparseRowRepairEvidence.js'
  );

const SCHEMA_MODULE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'DistressLeadCountySchema.js'
  );

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

const schemaSource =
  fs.readFileSync(
    SCHEMA_MODULE,
    'utf8'
  );

const PLAN_SHA =
  'd815afaf9f5c9384186c6cb30be98b07a3f5c43755f8f96c4f97e3f45fd9695c';

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
  '=== COUNTY SPARSE-ROW REPAIR EVIDENCE CONTRACT ==='
);

/*
 * Static mutation containment.
 */
[
  /REOS\.Database\.(?:insert|update|upsert|softDelete|ensureTable)\s*\(/,
  /\.setValues\s*\(/,
  /\.appendRow\s*\(/,
  /\.deleteRow\s*\(/,
  /\.insertRow(?:Before|After)?\s*\(/,
  /ScriptApp\s*\./,
  /PropertiesService\s*\./,
  /CountyConnectorSDK\s*\.\s*run\s*\(/,
  /CountyRuntimeBridge\s*\.\s*(?:run|sync|dryRun)\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(source),
    false,
    `forbidden read-only evidence surface: ${pattern}`
  );
});

assert.match(
  source,
  /getRange\s*\(/
);

assert.match(
  source,
  /\.getValues\s*\(/
);

assert.match(
  source,
  /connector\.fetch\s*\(/
);

assert.match(
  source,
  /PLAN_SHA256/
);

assert.match(
  source,
  /ROW_START\s*=\s*\n\s*2344/
);

assert.match(
  source,
  /ROW_END\s*=\s*\n\s*2445/
);

assert.match(
  source,
  /SOURCE_START_OFFSET\s*=\s*\n\s*1600/
);

assert.match(
  source,
  /mutationAuthorityGranted:\s*\n\s*false/
);

assert.match(
  source,
  /repairAuthorityGranted:\s*\n\s*false/
);

assert.match(
  source,
  /insertAuthorityGranted:\s*\n\s*false/
);

assert.match(
  source,
  /deleteAuthorityGranted:\s*\n\s*false/
);

assert.match(
  source,
  /automaticOfferAuthorityGranted:\s*\n\s*false/
);

pass(
  'static evidence surface is read-only and fail-closed'
);

/*
 * Load canonical schema authority to avoid duplicating the
 * protected 52-column layout in this validator.
 */
const schemaSandbox = {
  REOS: {}
};

vm.createContext(
  schemaSandbox
);

vm.runInContext(
  schemaSource,
  schemaSandbox,
  {
    filename:
      SCHEMA_MODULE
  }
);

const HEADERS =
  schemaSandbox
    .REOS
    .DistressLeadCountySchema
    .requiredHeaders();

assert.equal(
  HEADERS.length,
  52
);

const indexByHeader =
  Object.fromEntries(
    HEADERS.map(
      (header, index) => [
        header,
        index
      ]
    )
  );

function makeRow(
  physicalRow
) {
  const row =
    new Array(
      HEADERS.length
    ).fill('');

  let id;
  let sourceId;
  let runId;

  if (
    physicalRow ===
    2344
  ) {
    id =
      'ZIL-20260829200939-4556';
  } else if (
    physicalRow ===
    2345
  ) {
    id =
      'ZIL-20260829200946-0228';
  } else if (
    physicalRow ===
    2444
  ) {
    id =
      'DL-20260829211928-1265';
  } else if (
    physicalRow ===
    2445
  ) {
    id =
      'DL-20260829211929-6862';
  } else {
    id =
      'DL-MOCK-' +
      physicalRow;
  }

  if (
    physicalRow <=
    2443
  ) {
    sourceId =
      String(
        physicalRow -
        743
      );
  } else if (
    physicalRow ===
    2444
  ) {
    sourceId =
      '1699';
  } else {
    sourceId =
      '1700';
  }

  if (
    physicalRow <=
    2393
  ) {
    runId =
      'CCR-20260829205348-7954';
  } else if (
    physicalRow <=
    2443
  ) {
    runId =
      'CCR-20260829212018-6844';
  } else {
    runId =
      'CCR-20260829211815-0144';
  }

  const observationKey =
    'pa-philadelphia|code_violations|' +
    sourceId;

  row[
    indexByHeader[
      'Distress Lead ID'
    ]
  ] = id;

  row[
    indexByHeader.Address
  ] =
    'Mock Address ' +
    sourceId;

  row[
    indexByHeader.City
  ] =
    'Philadelphia';

  row[
    indexByHeader.State
  ] =
    'PA';

  row[
    indexByHeader.Zip
  ] =
    '19124';

  row[
    indexByHeader[
      'Distress Type'
    ]
  ] =
    'Code Violation';

  row[
    indexByHeader[
      'Created At'
    ]
  ] =
    new Date(
      '2026-08-29T20:00:00Z'
    );

  row[
    indexByHeader[
      'Updated At'
    ]
  ] =
    new Date(
      '2026-08-29T21:22:00Z'
    );

  row[
    indexByHeader.County
  ] =
    'Philadelphia';

  row[
    indexByHeader.Source
  ] =
    'PA-PHILADELPHIA';

  row[
    indexByHeader[
      'Source Dataset'
    ]
  ] =
    'code_violations';

  row[
    indexByHeader[
      'Connector Run ID'
    ]
  ] =
    runId;

  row[
    indexByHeader[
      'Parcel ID'
    ]
  ] =
    sourceId;

  row[
    indexByHeader[
      'Source Record ID'
    ]
  ] =
    sourceId;

  row[
    indexByHeader[
      'Source Record Key'
    ]
  ] =
    observationKey;

  row[
    indexByHeader[
      'Last Seen At'
    ]
  ] =
    new Date(
      '2026-08-29T21:22:00Z'
    );

  row[
    indexByHeader[
      'Source Observation Key'
    ]
  ] =
    observationKey;

  row[
    indexByHeader[
      'Canonical Property Key'
    ]
  ] =
    (
      'property|parcel|pa|philadelphia|' +
      sourceId
    );

  return row;
}

let corridor =
  Array.from(
    {
      length:
        2445 -
        2344 +
        1
    },
    (_, index) =>
      makeRow(
        2344 +
        index
      )
  );

function importRow(
  rowNumber,
  importId,
  gmailMessageId,
  distressLeadId,
  naturalKey
) {
  return {
    _rowNumber:
      rowNumber,

    'Import ID':
      importId,

    'Gmail Message ID':
      gmailMessageId,

    'Gmail Thread ID':
      gmailMessageId,

    'Source Label':
      'Zillow/New Leads',

    'External Lead ID':
      '',

    'Natural Key':
      naturalKey,

    'Contact Name':
      '',

    Email:
      'instant-updates@mail.zillow.com',

    Phone:
      '',

    'Property Address':
      '',

    'Property URL':
      'https://example.invalid/zillow/' +
      gmailMessageId,

    'Lead Type':
      'Property Inquiry',

    'Distress Lead ID':
      distressLeadId,

    Status:
      'Imported',

    'Imported At':
      new Date(
        '2026-08-29T20:09:50Z'
      ),

    'Details JSON':
      '{}'
  };
}

let imports = [
  importRow(
    90,
    'ZGMI-20260829200941-6943',
    '1a04feeb3ebd0995',
    'ZIL-20260829200939-4556',
    'a'.repeat(64)
  ),

  importRow(
    91,
    'ZGMI-20260829200949-1528',
    '1a04feb4ca06afd3',
    'ZIL-20260829200946-0228',
    'b'.repeat(64)
  )
];

function runRow(
  rowNumber,
  runId,
  inserted,
  updated
) {
  return {
    _rowNumber:
      rowNumber,

    'Run ID':
      runId,

    'Connector ID':
      'PA-PHILADELPHIA',

    County:
      'Philadelphia',

    State:
      'PA',

    Dataset:
      'code_violations',

    Mode:
      'LIVE',

    Status:
      'Complete',

    'Records Fetched':
      50,

    'Records Valid':
      50,

    'Records Inserted':
      inserted,

    'Records Updated':
      updated,

    'Records Skipped':
      0,

    'Records Failed':
      0,

    'Started At':
      new Date(
        '2026-08-29T21:00:00Z'
      ),

    'Completed At':
      new Date(
        '2026-08-29T21:01:00Z'
      ),

    'Duration Ms':
      60000,

    Cursor:
      '1700',

    Message:
      '',

    'Executed By':
      'test@example.com'
  };
}

const runs = [
  runRow(
    101,
    'CCR-20260829205348-7954',
    0,
    50
  ),

  runRow(
    102,
    'CCR-20260829211815-0144',
    50,
    0
  ),

  runRow(
    103,
    'CCR-20260829212018-6844',
    0,
    50
  )
];

let sourceRecordCount =
  100;

function makeRawRecords() {
  return Array.from(
    {
      length:
        sourceRecordCount
    },
    (_, index) => ({
      objectid:
        1601 +
        index
    })
  );
}

function signedDigest(buffer) {
  return Array.from(
    buffer,
    value =>
      value > 127
        ? value - 256
        : value
  );
}

const connector = {
  fetch(context) {
    assert.equal(
      context.cursor,
      '1600'
    );

    assert.equal(
      context.limit,
      100
    );

    assert.equal(
      context.dryRun,
      true
    );

    return {
      records:
        makeRawRecords(),

      nextCursor:
        '1700',

      complete:
        true
    };
  },

  normalize(raw, context) {
    const id =
      String(
        raw.objectid
      );

    return {
      Address:
        'Source Address ' +
        id,

      City:
        'Philadelphia',

      State:
        'PA',

      Zip:
        '19124',

      County:
        'Philadelphia',

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Connector Run ID':
        context.runId,

      'Parcel ID':
        id,

      'Source Record ID':
        id,

      'Distress Type':
        'Code Violation',

      'Violation Number':
        'VI-' +
        id,

      'Updated At':
        context.now
    };
  },

  validate() {
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
  Math,
  Number,
  Object,
  String,
  Array,
  Boolean,
  RegExp,
  Error,
  isFinite,

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

      return signedDigest(
        crypto
          .createHash(
            'sha256'
          )
          .update(
            String(value),
            'utf8'
          )
          .digest()
      );
    }
  },

  REOS: {
    Security: {
      requireAdmin() {
        return true;
      }
    },

    DistressLeadCountySchema: {
      requiredHeaders() {
        return HEADERS.slice();
      }
    },

    Database: {
      getHeaders(sheetName) {
        assert.equal(
          sheetName,
          'DISTRESS_LEADS'
        );

        return HEADERS.slice();
      },

      getSheet(sheetName) {
        assert.equal(
          sheetName,
          'DISTRESS_LEADS'
        );

        return {
          getLastRow() {
            return 2445;
          },

          getRange(
            startRow,
            startColumn,
            rowCount,
            columnCount
          ) {
            assert.equal(
              startRow,
              2344
            );

            assert.equal(
              startColumn,
              1
            );

            assert.equal(
              rowCount,
              102
            );

            assert.equal(
              columnCount,
              52
            );

            return {
              getValues() {
                return corridor.map(
                  row =>
                    row.slice()
                );
              }
            };
          }
        };
      },

      getAll(sheetName) {
        if (
          sheetName ===
          'ZILLOW_GMAIL_IMPORTS'
        ) {
          return imports.map(
            row => ({
              ...row
            })
          );
        }

        if (
          sheetName ===
          'COUNTY_CONNECTOR_RUNS'
        ) {
          return runs.map(
            row => ({
              ...row
            })
          );
        }

        throw new Error(
          'Unexpected table read: ' +
          sheetName
        );
      }
    },

    CountyRuntimeBridge: {
      registerConnectors() {
        return true;
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

    CanonicalPropertyIdentity: {
      resolve(record) {
        const id =
          String(
            record[
              'Source Record ID'
            ]
          );

        return {
          sourceObservationKey:
            (
              'pa-philadelphia|' +
              'code_violations|' +
              id
            ),

          canonicalPropertyKey:
            (
              'property|parcel|' +
              'pa|philadelphia|' +
              id
            )
        };
      }
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

const api =
  sandbox
    .REOS
    .CountySparseRowRepairEvidence;

assert.ok(api);

const metadata =
  api.metadata();

assert.equal(
  metadata.planSha256,
  PLAN_SHA
);

assert.equal(
  metadata.physicalStartRow,
  2344
);

assert.equal(
  metadata.physicalEndRow,
  2445
);

assert.equal(
  metadata.physicalRowCount,
  102
);

assert.equal(
  metadata.sourceRecordCount,
  100
);

[
  'mutationAuthorityGranted',
  'repairAuthorityGranted',
  'insertAuthorityGranted',
  'deleteAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.equal(
    metadata[field],
    false,
    `${field} must be false`
  );
});

pass(
  'metadata binds the exact certified corridor and grants no authority'
);

expectThrow(
  () => api.exportEvidence({
    confirmReadOnly:
      false,

    planSha256:
      PLAN_SHA
  }),
  /confirmReadOnly=true/
);

expectThrow(
  () => api.exportEvidence({
    confirmReadOnly:
      true,

    planSha256:
      '0'.repeat(64)
  }),
  /repair-plan SHA-256 mismatch/
);

pass(
  'explicit read-only invocation and plan hash are mandatory'
);

const evidence =
  api.exportEvidence({
    confirmReadOnly:
      true,

    planSha256:
      PLAN_SHA
  });

assert.equal(
  evidence.ok,
  true
);

assert.equal(
  evidence.mode,
  'READ_ONLY_SPARSE_ROW_REPAIR_EVIDENCE'
);

assert.equal(
  evidence.corridor.rowCount,
  102
);

assert.equal(
  evidence.corridor.headerCount,
  52
);

assert.equal(
  evidence.corridor.rows[0]
    .physicalRow,
  2344
);

assert.equal(
  evidence.corridor.rows[101]
    .physicalRow,
  2445
);

assert.equal(
  evidence.source.recordCount,
  100
);

assert.equal(
  evidence.source.records[0]
    .sourceRecordId,
  '1601'
);

assert.equal(
  evidence.source.records[99]
    .sourceRecordId,
  '1700'
);

assert.equal(
  evidence.zillowImports.length,
  2
);

assert.equal(
  evidence.countyRunLineage.length,
  3
);

assert.match(
  evidence.evidenceSha256,
  /^[a-f0-9]{64}$/
);

evidence.corridor.rows.forEach(
  row => {
    assert.equal(
      row.values.length,
      52
    );

    assert.match(
      row.rowSha256,
      /^[a-f0-9]{64}$/
    );
  }
);

evidence.source.records.forEach(
  row => {
    assert.match(
      row.sourceSha256,
      /^[a-f0-9]{64}$/
    );
  }
);

[
  'mutationAuthorityGranted',
  'repairAuthorityGranted',
  'insertAuthorityGranted',
  'deleteAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.equal(
    evidence[field],
    false,
    `${field} must be false`
  );
});

pass(
  'complete 102-row physical, 100-record source, Zillow, and run evidence is fingerprinted'
);

/*
 * Physical-prestate drift must fail before evidence authority exists.
 */
const savedSourceId =
  corridor[0][
    indexByHeader[
      'Source Record ID'
    ]
  ];

corridor[0][
  indexByHeader[
    'Source Record ID'
  ]
] =
  '999999';

expectThrow(
  () => api.exportEvidence({
    confirmReadOnly:
      true,

    planSha256:
      PLAN_SHA
  }),
  /corridor prestate drifted/
);

corridor[0][
  indexByHeader[
    'Source Record ID'
  ]
] =
  savedSourceId;

pass(
  'physical corridor drift fails closed'
);

/*
 * Import-ledger ambiguity must fail closed.
 */
imports.push({
  ...imports[0],
  _rowNumber:
    92
});

expectThrow(
  () => api.exportEvidence({
    confirmReadOnly:
      true,

    planSha256:
      PLAN_SHA
  }),
  /does not have exactly one import-ledger record/
);

imports.pop();

pass(
  'Zillow import-ledger ambiguity fails closed'
);

/*
 * Source-window drift must fail closed.
 */
sourceRecordCount =
  99;

expectThrow(
  () => api.exportEvidence({
    confirmReadOnly:
      true,

    planSha256:
      PLAN_SHA
  }),
  /no longer returns exactly 100 records/
);

sourceRecordCount =
  100;

pass(
  'source-window count drift fails closed'
);

console.log();
console.log(
  'County sparse-row repair evidence validation PASSED.'
);
