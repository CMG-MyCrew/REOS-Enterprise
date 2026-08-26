#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

console.log(
  '=== COUNTY IDENTITY REPAIR EVIDENCE EXPORT CONTRACT ==='
);

const modulePath =
  'build/apps-script-brand/CountyIdentityRepairEvidenceExport.js';

assert.ok(
  fs.existsSync(modulePath),
  'CountyIdentityRepairEvidenceExport.js must exist'
);

const source =
  fs.readFileSync(
    modulePath,
    'utf8'
  );

/*
 * Structural containment.
 *
 * Phase B.1 may perform exactly one direct source read and
 * one persisted-table read. It may expose no mutation path.
 */
[
  [
    /\.ensureTable\s*\(/,
    'Database.ensureTable'
  ],
  [
    /\.insert\s*\(/,
    'Database.insert'
  ],
  [
    /\.update\s*\(/,
    'Database.update'
  ],
  [
    /\.upsert\s*\(/,
    'Database.upsert'
  ],
  [
    /\.softDelete\s*\(/,
    'Database.softDelete'
  ],
  [
    /\.set(Value|Values|Property)\s*\(/,
    'write API'
  ],
  [
    /\.deleteProperty\s*\(/,
    'deleteProperty'
  ],
  [
    /ScriptApp\s*\.\s*(newTrigger|deleteTrigger)/,
    'trigger mutation'
  ],
  [
    /REOS\.CountyConnectorSDK\s*\.\s*run\s*\(/,
    'CountyConnectorSDK.run'
  ],
  [
    /REOS\.CountyRuntimeBridge\s*\.\s*(run|sync|dryRun)\s*\(/,
    'county runtime execution'
  ],
  [
    /DistressLeadCountySchema\s*\.\s*ensure\s*\(/,
    'schema migration'
  ]
].forEach(function (item) {
  assert.equal(
    item[0].test(source),
    false,
    'Phase B.1 must not contain ' +
      item[1]
  );
});

[
  /REOS\.Database\s*\.\s*getAll\s*\(/,
  /REOS\.Security\s*\.\s*requireAdmin\s*\(/,
  /CountyRuntimeBridge\s*\.\s*registerConnectors\s*\(/,
  /CountyConnectorSDK\s*\.\s*get\s*\(/,
  /connector\s*\.\s*fetch\s*\(/,
  /connector\s*\.\s*normalize\s*\(/,
  /CanonicalPropertyIdentity\s*\.\s*resolve\s*\(/,
  /function\s+reosCountyIdentityRepairEvidenceExport\s*\(/,
  /repairAuthorityGranted:\s*false/,
  /migrationAuthorityGranted:\s*false/,
  /repairPlanAuthorityGranted:\s*false/
].forEach(function (pattern) {
  assert.match(
    source,
    pattern
  );
});

[
  'repair_evidence_export',
  'NETWORK_READ_ONLY',
  'propertyConflictEvidence',
  'missingObservationEvidence',
  'duplicateHistoryEvidence',
  'crossPrefixEvidence',
  'tableOnlyEvidence',
  'normalizedSourceRecord',
  'persistedRows',
  'evidenceComplete'
].forEach(function (field) {
  assert.ok(
    source.includes(field),
    'Missing Phase B.1 evidence field: ' +
      field
  );
});

console.log(
  'PASS: Phase B.1 module is structurally read-only'
);


function normalize(value) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      ' '
    );
}

function row(
  rowNumber,
  distressLeadId,
  sourceRecordId,
  parcelId,
  address,
  zip
) {
  return {
    _rowNumber:
      rowNumber,

    'Distress Lead ID':
      distressLeadId,

    Address:
      address,

    City:
      'Philadelphia',

    State:
      'PA',

    Zip:
      zip,

    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Parcel ID':
      parcelId,

    'Source Record ID':
      sourceRecordId,

    'Source Observation Key':
      '',

    'Canonical Property Key':
      ''
  };
}

const persistedRows = [
  row(
    2,
    'DL-1',
    '1',
    '111',
    '100 First St',
    '19101'
  ),

  row(
    3,
    'DL-2A',
    '2',
    '222',
    '200 Second St',
    '19102'
  ),

  row(
    4,
    'DL-2B',
    '2',
    '222',
    '200 Second St',
    '19102'
  ),

  /*
   * Persisted address identity while the current source
   * now has parcel identity: property conflict.
   */
  row(
    5,
    'DL-3',
    '3',
    '',
    '300 Third St',
    '19103'
  ),

  /*
   * Cross-prefix contamination with otherwise valid identity.
   */
  row(
    6,
    'ZIL-6',
    '6',
    '',
    '600 Sixth St',
    '19106'
  ),

  /*
   * Persisted observation outside source window.
   */
  row(
    7,
    'DL-99',
    '99',
    '999',
    '990 Table Only St',
    '19199'
  )
];

const rawRecords = [
  {
    objectid: 1,
    address: '100 First St',
    zip: '19101',
    parcel: '111'
  },
  {
    objectid: 2,
    address: '200 Second St',
    zip: '19102',
    parcel: '222'
  },
  {
    objectid: 3,
    address: '300 Third St',
    zip: '19103',
    parcel: '333'
  },
  {
    objectid: 4,
    address: '400 Fourth St',
    zip: '19104',
    parcel: '444'
  },
  {
    objectid: 5,
    address: '',
    zip: '19105',
    parcel: '555'
  },
  {
    objectid: 6,
    address: '600 Sixth St',
    zip: '19106',
    parcel: ''
  }
];

let reads = 0;
let fetches = 0;

const connector = {
  fetch(context) {
    fetches++;

    assert.equal(
      context.cursor,
      '0'
    );

    assert.equal(
      context.limit,
      6
    );

    assert.equal(
      context.dryRun,
      true
    );

    return {
      records:
        rawRecords.map(
          record =>
            Object.assign(
              {},
              record
            )
        ),

      nextCursor:
        '6'
    };
  },

  normalize(raw) {
    if (!raw.address) {
      return {
        __skip:
          true,

        __skipReason:
          'address required'
      };
    }

    return {
      Address:
        raw.address,

      City:
        'Philadelphia',

      State:
        'PA',

      Zip:
        raw.zip,

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Parcel ID':
        raw.parcel,

      'Source Record ID':
        String(
          raw.objectid
        )
    };
  },

  validate(record) {
    return {
      ok:
        Boolean(
          record.Address &&
          record[
            'Source Record ID'
          ]
        ),

      errors:
        []
    };
  }
};

const context = {
  console,
  Date,

  REOS: {
    Database: {
      getAll(table) {
        reads++;

        assert.equal(
          table,
          'DISTRESS_LEADS'
        );

        return persistedRows
          .map(function (record) {
            return Object.assign(
              {},
              record
            );
          });
      }
    },

    Security: {
      requireAdmin() {
        return true;
      }
    },

    CountyRuntimeBridge: {
      registerConnectors() {
        return [];
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
        throw new Error(
          'Unexpected fallback validation.'
        );
      }
    },

    CanonicalPropertyIdentity: {
      resolve(record) {
        const sourceName =
          normalize(
            record.Source
          );

        const dataset =
          normalize(
            record[
              'Source Dataset'
            ]
          );

        const sourceRecordId =
          normalize(
            record[
              'Source Record ID'
            ]
          );

        if (
          !sourceName ||
          !dataset ||
          !sourceRecordId
        ) {
          throw new Error(
            'Missing observation authority.'
          );
        }

        const parcel =
          normalize(
            record[
              'Parcel ID'
            ]
          ).replace(
            /[^a-z0-9]/g,
            ''
          );

        const canonical =
          parcel
            ? (
                'property|parcel|pa|philadelphia|' +
                parcel
              )
            : (
                'property|address|pa|philadelphia|' +
                normalize(
                  record.Zip
                ) +
                '|' +
                normalize(
                  record.Address
                )
              );

        return {
          sourceObservationKey:
            sourceName +
            '|' +
            dataset +
            '|' +
            sourceRecordId,

          canonicalPropertyKey:
            canonical
        };
      }
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
      'CountyIdentityRepairEvidenceExport.js'
  }
);

const result =
  context
    .reosCountyIdentityRepairEvidenceExport(
      {
        connectorId:
          'PA-PHILADELPHIA',

        dataset:
          'code_violations',

        startOffset:
          0,

        endOffsetExclusive:
          6
      }
    );

assert.equal(
  reads,
  1
);

assert.equal(
  fetches,
  1
);

assert.equal(
  result.mode,
  'READ_ONLY'
);

assert.equal(
  result.phase,
  'repair_evidence_export'
);

assert.equal(
  result.sourceAccess,
  'NETWORK_READ_ONLY'
);

assert.equal(
  result.repairAuthorityGranted,
  false
);

assert.equal(
  result.migrationAuthorityGranted,
  false
);

assert.equal(
  result.repairPlanAuthorityGranted,
  false
);

assert.equal(
  result.evidenceComplete,
  true
);

assert.equal(
  result.window.complete,
  true
);

assert.equal(
  result.source
    .normalizedRecords,
  5
);

assert.equal(
  result.source
    .skippedByFilter
    .count,
  1
);

assert.equal(
  result.source
    .errors
    .count,
  0
);

assert.equal(
  result.classifications
    .SOURCE_PRESENT_ONCE
    .count,
  2
);

assert.equal(
  result.classifications
    .SOURCE_DUPLICATED_IN_TABLE
    .count,
  1
);

assert.equal(
  result.classifications
    .SOURCE_PROPERTY_CONFLICT
    .count,
  1
);

assert.equal(
  result.classifications
    .SOURCE_MISSING_FROM_TABLE
    .count,
  1
);

/*
 * Complete property-conflict evidence.
 */
assert.equal(
  result
    .propertyConflictEvidence
    .count,
  1
);

const conflict =
  result
    .propertyConflictEvidence
    .rows[0];

assert.equal(
  conflict
    .sourceObservationKey,
  'pa-philadelphia|code_violations|3'
);

assert.equal(
  conflict
    .sourceRecordId,
  '3'
);

assert.equal(
  conflict
    .sourceParcelId,
  '333'
);

assert.equal(
  conflict
    .persistedRowCount,
  1
);

assert.equal(
  conflict
    .persistedRows
    .length,
  1
);

assert.equal(
  conflict
    .persistedRows[0]
    .rowNumber,
  5
);

assert.equal(
  conflict
    .normalizedSourceRecord[
      'Source Record ID'
    ],
  '3'
);

assert.notEqual(
  conflict
    .sourceCanonicalPropertyKey,
  conflict
    .persistedCanonicalPropertyKeys[0]
);

/*
 * Complete missing-observation evidence.
 */
assert.equal(
  result
    .missingObservationEvidence
    .count,
  1
);

const missing =
  result
    .missingObservationEvidence
    .rows[0];

assert.equal(
  missing
    .sourceObservationKey,
  'pa-philadelphia|code_violations|4'
);

assert.equal(
  missing
    .sourceOffset,
  3
);

assert.equal(
  missing
    .normalizedSourceRecord[
      'Source Record ID'
    ],
  '4'
);

/*
 * Duplicate history is independent of primary
 * classification precedence.
 */
assert.equal(
  result
    .duplicateHistoryEvidence
    .groupCount,
  1
);

assert.equal(
  result
    .duplicateHistoryEvidence
    .surplusRowCount,
  1
);

const duplicate =
  result
    .duplicateHistoryEvidence
    .groups[0];

assert.equal(
  duplicate
    .sourceObservationKey,
  'pa-philadelphia|code_violations|2'
);

assert.equal(
  duplicate
    .persistedRowCount,
  2
);

assert.equal(
  duplicate
    .persistedRows
    .length,
  2
);

assert.equal(
  duplicate
    .sourceClassification,
  'SOURCE_DUPLICATED_IN_TABLE'
);

/*
 * Full cross-prefix evidence.
 */
assert.equal(
  result
    .crossPrefixEvidence
    .count,
  1
);

assert.equal(
  result
    .crossPrefixEvidence
    .matchedSourceWindowCount,
  1
);

const contaminated =
  result
    .crossPrefixEvidence
    .rows[0];

assert.equal(
  contaminated
    .persistedRow
    .distressLeadId,
  'ZIL-6'
);

assert.equal(
  contaminated
    .matchedSourceWindow,
  true
);

assert.equal(
  contaminated
    .sourceObservation
    .sourceRecordId,
  '6'
);

/*
 * Table-only evidence remains independently visible.
 */
assert.equal(
  result
    .tableOnlyEvidence
    .count,
  1
);

assert.equal(
  result
    .tableOnlyEvidence
    .rows[0]
    .sourceObservationKey,
  'pa-philadelphia|code_violations|99'
);

/*
 * Complete classification keys remain available so
 * production evidence can be compared to the already
 * preserved Phase B forensic inventory.
 */
assert.deepEqual(
  Array.from(
    result.classifications
      .SOURCE_PROPERTY_CONFLICT
      .sourceObservationKeys
  ),
  [
    'pa-philadelphia|code_violations|3'
  ]
);

assert.deepEqual(
  Array.from(
    result.classifications
      .SOURCE_MISSING_FROM_TABLE
      .sourceObservationKeys
  ),
  [
    'pa-philadelphia|code_violations|4'
  ]
);

/*
 * Fail-closed scope.
 */
assert.throws(
  function () {
    context
      .reosCountyIdentityRepairEvidenceExport(
        {
          dataset:
            'vacant_properties'
        }
      );
  },
  /restricted to dataset code_violations/
);

assert.throws(
  function () {
    context
      .reosCountyIdentityRepairEvidenceExport(
        {
          endOffsetExclusive:
            2001
        }
      );
  },
  /1-2000 records/
);

console.log(
  'PASS: independent source reclassification'
);

console.log(
  'PASS: complete property-conflict row evidence'
);

console.log(
  'PASS: complete missing-observation row evidence'
);

console.log(
  'PASS: duplicate-history evidence independent of primary classification'
);

console.log(
  'PASS: complete cross-prefix evidence'
);

console.log(
  'PASS: complete table-only evidence'
);

console.log(
  'PASS: Phase B.1 authority remains fail-closed'
);

console.log(
  'County identity repair evidence export validation PASSED.'
);
