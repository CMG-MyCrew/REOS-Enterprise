#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

console.log(
  '=== COUNTY IDENTITY SOURCE RECONCILIATION CONTRACT ==='
);

const modulePath =
  'build/apps-script-brand/CountyIdentitySourceReconciliation.js';

assert.ok(
  fs.existsSync(modulePath),
  'CountyIdentitySourceReconciliation.js must exist'
);

const source =
  fs.readFileSync(
    modulePath,
    'utf8'
  );

/*
 * Structural containment:
 * Phase B may read the network through the registered
 * connector, but must expose no mutation surface.
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
    'Phase B must not contain ' +
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
  /function\s+reosCountyIdentitySourceReconciliation\s*\(/,
  /repairAuthorityGranted:\s*false/,
  /migrationAuthorityGranted:\s*false/
].forEach(function (pattern) {
  assert.match(
    source,
    pattern
  );
});

[
  'SOURCE_PRESENT_ONCE',
  'SOURCE_DUPLICATED_IN_TABLE',
  'SOURCE_PROPERTY_CONFLICT',
  'SOURCE_MISSING_FROM_TABLE',
  'skippedByFilter',
  'crossPrefixContamination',
  'tableOnlyObservations',
  'reconciliationComplete'
].forEach(function (field) {
  assert.ok(
    source.includes(field),
    'Missing Phase B diagnostic field: ' +
      field
  );
});

console.log(
  'PASS: Phase B module is structurally read-only'
);


/*
 * Behavioral classification contract.
 */
function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
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
      sourceRecordId
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
   * Persisted address-only identity while source
   * now has parcel authority -> property conflict.
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
   * Correct identity but contaminated acquisition
   * ID prefix.
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
   * Persisted observation not present in the
   * source reconciliation window.
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
        __skip: true,
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

      errors: []
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
        const source =
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
          !source ||
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
          )
            .replace(
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
            source +
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
      'CountyIdentitySourceReconciliation.js'
  }
);

const result =
  context
    .reosCountyIdentitySourceReconciliation(
      {
        connectorId:
          'PA-PHILADELPHIA',

        dataset:
          'code_violations',

        startOffset:
          0,

        endOffsetExclusive:
          6,

        sampleLimit:
          100
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
  'source_reconciliation'
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
  result.window.complete,
  true
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

assert.equal(
  result.crossPrefixContamination
    .count,
  1
);

assert.equal(
  result.crossPrefixContamination
    .matchedSourceWindowCount,
  1
);

assert.equal(
  result.tableOnlyObservations
    .count,
  1
);

assert.equal(
  result.reconciliationComplete,
  true
);

assert.deepEqual(
  Array.from(
    result.classifications
      .SOURCE_DUPLICATED_IN_TABLE
      .sourceObservationKeys
  ),
  [
    'pa-philadelphia|code_violations|2'
  ]
);

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

assert.deepEqual(
  Array.from(
    result.tableOnlyObservations
      .sourceObservationKeys
  ),
  [
    'pa-philadelphia|code_violations|99'
  ]
);

assert.throws(
  function () {
    context
      .reosCountyIdentitySourceReconciliation(
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
      .reosCountyIdentitySourceReconciliation(
        {
          endOffsetExclusive:
            2001
        }
      );
  },
  /1-2000 records/
);

console.log(
  'PASS: present-once classification'
);

console.log(
  'PASS: same-property duplicate classification'
);

console.log(
  'PASS: property-conflict classification'
);

console.log(
  'PASS: source-missing classification'
);

console.log(
  'PASS: connector-filter skip classification'
);

console.log(
  'PASS: cross-prefix contamination detection'
);

console.log(
  'PASS: table-only observation detection'
);

console.log(
  'PASS: Phase B scope hard limit'
);

console.log(
  'County identity source reconciliation validation PASSED.'
);
