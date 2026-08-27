#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');

const MODULE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CountyC1LivePreflight.js'
);

const source = fs.readFileSync(
  MODULE,
  'utf8'
);

function pass(message) {
  console.log(`PASS: ${message}`);
}

console.log(
  '=== COUNTY C1 LIVE PREFLIGHT CONTRACT ==='
);

/*
 * Structural no-write containment.
 */
[
  /REOS\.Database\.insert\s*\(/,
  /REOS\.Database\.update\s*\(/,
  /REOS\.Database\.upsert\s*\(/,
  /REOS\.Database\.softDelete\s*\(/,
  /REOS\.Database\.ensureTable\s*\(/,
  /CountyConnectorSDK\.run\s*\(/,
  /CountyRuntimeBridge\.(?:run|sync|dryRun)\s*\(/,
  /ScriptApp\.newTrigger\s*\(/,
  /PropertiesService[\s\S]*?\.setProperty\s*\(/,
  /SpreadsheetApp[\s\S]*?\.setValues\s*\(/,
  /SpreadsheetApp[\s\S]*?\.appendRow\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(source),
    false,
    `forbidden mutation/execution surface: ${pattern}`
  );
});

assert.ok(
  source.includes(
    "MAX_CANDIDATES =\n    25"
  ),
  'bounded 25-candidate limit missing'
);

assert.ok(
  source.includes(
    "'objectid IN ('"
  ),
  'exact immutable objectid query missing'
);

assert.ok(
  source.includes(
    'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT'
  ),
  'existing-observation fail-closed disposition missing'
);

assert.ok(
  source.includes(
    'C1_LIVE_PRECHECK_SATISFIED_NO_WRITE_AUTHORITY'
  ),
  'successful no-write disposition missing'
);

pass('module is structurally read-only');
pass('source lookup is immutable-objectid bounded');
pass('successful preflight grants no write authority');

function createHarness(options = {}) {
  const mutationCalls = [];

  const sourceRecords =
    options.sourceRecords || [];

  const persistedRows =
    options.persistedRows || [];

  const capturedFetches = [];

  let adminCalls = 0;
  let registerCalls = 0;
  let databaseReads = 0;

  function identity(record) {
    const sourceName =
      String(record.Source || '').trim().toLowerCase();

    const dataset =
      String(
        record['Source Dataset'] || ''
      ).trim().toLowerCase();

    const sourceRecordId =
      String(
        record['Source Record ID'] || ''
      ).trim().toLowerCase();

    if (
      !sourceName ||
      !dataset ||
      !sourceRecordId
    ) {
      throw new Error(
        'mock identity incomplete'
      );
    }

    return {
      ok: true,
      sourceObservationKey:
        [
          sourceName,
          dataset,
          sourceRecordId
        ].join('|'),
      canonicalPropertyKey:
        String(
          record.__canonicalPropertyKey ||
          record['Canonical Property Key'] ||
          ''
        )
    };
  }

  const connector = {
    normalize(raw) {
      if (raw.__normalizeError) {
        throw new Error(
          raw.__normalizeError
        );
      }

      if (raw.__skip) {
        return {
          __skip: true,
          __skipReason:
            raw.__skipReason || 'skip'
        };
      }

      return {
        Source: 'PA-PHILADELPHIA',
        'Source Dataset': 'code_violations',
        'Source Record ID':
          String(raw.objectid),
        'Parcel ID':
          raw.parcel_id_num || '',
        Address:
          raw.address || '100 TEST ST',
        City:
          raw.city || 'Philadelphia',
        State: 'PA',
        Zip:
          raw.zip || '19101',
        __canonicalPropertyKey:
          raw.__canonicalPropertyKey ||
          `property|parcel|pa|philadelphia|${raw.parcel_id_num || '1'}`
      };
    },

    validate(normalized) {
      if (
        normalized &&
        normalized.__invalid
      ) {
        return {
          ok: false,
          errors: ['invalid']
        };
      }

      return {
        ok: true,
        errors: []
      };
    }
  };

  const context = {
    console,

    Date,

    JSON,

    Object,

    Array,

    Number,

    String,

    Boolean,

    Math,

    RegExp,

    isFinite,

    REOS: {
      Database: {
        getAll(table) {
          assert.equal(
            table,
            'DISTRESS_LEADS'
          );

          databaseReads += 1;

          return persistedRows;
        },

        insert() {
          mutationCalls.push('insert');
        },

        update() {
          mutationCalls.push('update');
        },

        upsert() {
          mutationCalls.push('upsert');
        },

        softDelete() {
          mutationCalls.push('softDelete');
        }
      },

      Security: {
        requireAdmin() {
          adminCalls += 1;
        }
      },

      CountyRuntimeBridge: {
        registerConnectors() {
          registerCalls += 1;
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
        },

        run() {
          mutationCalls.push(
            'CountyConnectorSDK.run'
          );
        }
      },

      CanonicalPropertyIdentity: {
        resolve:
          identity
      },

      CountyAdapters: {
        Registry: {
          fetch(adapter, args) {
            capturedFetches.push({
              adapter,
              args
            });

            return {
              records:
                sourceRecords,
              metadata: {
                adapter: 'arcgis',
                status: 200
              }
            };
          }
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
              'https://example.test/' +
              'FeatureServer/0'
            );
          },

          setProperty() {
            mutationCalls.push(
              'setProperty'
            );
          }
        };
      }
    },

    Utilities: {
      DigestAlgorithm: {
        SHA_256: 'SHA_256'
      },

      Charset: {
        UTF_8: 'UTF_8'
      },

      computeDigest(
        algorithm,
        value
      ) {
        assert.equal(
          algorithm,
          'SHA_256'
        );

        return Array.from(
          crypto
            .createHash('sha256')
            .update(String(value))
            .digest()
        );
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    source,
    context,
    {
      filename:
        'CountyC1LivePreflight.js'
    }
  );

  return {
    context,

    mutationCalls,

    capturedFetches,

    counters() {
      return {
        adminCalls,
        registerCalls,
        databaseReads
      };
    }
  };
}

function candidate(
  id,
  canonicalKey
) {
  return {
    sourceObservationKey:
      `pa-philadelphia|code_violations|${id}`,

    immutableSourceRecordId:
      String(id),

    expectedCanonicalPropertyKey:
      canonicalKey ||
      `property|parcel|pa|philadelphia|${id}`
  };
}

function sourceRecord(
  id,
  canonicalKey
) {
  return {
    objectid: Number(id),
    parcel_id_num:
      String(id),
    address:
      `${id} TEST ST`,
    __canonicalPropertyKey:
      canonicalKey ||
      `property|parcel|pa|philadelphia|${id}`
  };
}

/*
 * Successful exact read-only precheck.
 */
{
  const harness = createHarness({
    sourceRecords: [
      sourceRecord(101)
    ]
  });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        candidates: [
          candidate(101)
        ]
      });

  assert.equal(
    result.mode,
    'READ_ONLY'
  );

  assert.equal(
    result.scope.candidateCount,
    1
  );

  assert.equal(
    result.successfulPrecheckCount,
    1
  );

  assert.equal(
    result.writeReadyCount,
    0
  );

  assert.equal(
    result.results[0].outcome,
    'C1_LIVE_PRECHECK_SATISFIED_NO_WRITE_AUTHORITY'
  );

  [
    'repairAuthorityGranted',
    'migrationAuthorityGranted',
    'repairPlanAuthorityGranted',
    'mutationAuthorityGranted',
    'insertAuthorityGranted',
    'updateAuthorityGranted',
    'deleteAuthorityGranted',
    'deduplicationAuthorityGranted',
    'identifierRewriteAuthorityGranted',
    'canonicalOverwriteAuthorityGranted'
  ].forEach(field => {
    assert.equal(
      result[field],
      false,
      `${field} must remain false`
    );
  });

  assert.deepEqual(
    harness.mutationCalls,
    []
  );

  assert.deepEqual(
    harness.counters(),
    {
      adminCalls: 1,
      registerCalls: 1,
      databaseReads: 1
    }
  );

  pass(
    'fresh exact source + persisted absence returns no-write success'
  );
}

/*
 * Exact batched objectid query, no source-window replay.
 */
{
  const harness = createHarness({
    sourceRecords: [
      sourceRecord(101),
      sourceRecord(202)
    ]
  });

  harness.context
    .reosCountyC1LivePreflight({
      candidates: [
        candidate(202),
        candidate(101)
      ]
    });

  assert.equal(
    harness.capturedFetches.length,
    1
  );

  const fetch =
    harness.capturedFetches[0];

  assert.equal(
    fetch.adapter,
    'arcgis'
  );

  assert.equal(
    fetch.args.where,
    'objectid IN (101,202)'
  );

  assert.equal(
    fetch.args.context.cursor,
    '0'
  );

  assert.equal(
    fetch.args.context.limit,
    2
  );

  assert.equal(
    fetch.args.maxLimit,
    25
  );

  assert.equal(
    fetch.args.orderByFields,
    'objectid ASC'
  );

  pass(
    'batch source lookup uses only exact immutable objectids'
  );
}

/*
 * Existing observation via modern Source Observation Key.
 */
{
  const persisted = {
    _rowNumber: 22,
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Source Record ID': '101',
    'Source Observation Key':
      'pa-philadelphia|code_violations|101',
    'Source Record Key': '',
    'Canonical Property Key':
      'property|parcel|pa|philadelphia|101'
  };

  const harness = createHarness({
    persistedRows: [
      persisted
    ],
    sourceRecords: [
      sourceRecord(101)
    ]
  });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        candidates: [
          candidate(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT'
  );

  assert.equal(
    result.results[0].persistedMatchCount,
    1
  );

  assert.deepEqual(
    harness.mutationCalls,
    []
  );

  pass(
    'modern stored observation identity blocks insert'
  );
}

/*
 * Existing observation via legacy Source Record Key alias.
 */
{
  const persisted = {
    _rowNumber: 23,
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Source Record ID': '',
    'Source Observation Key': '',
    'Source Record Key':
      'pa-philadelphia|code_violations|101',
    'Canonical Property Key':
      'property|parcel|pa|philadelphia|101'
  };

  const harness = createHarness({
    persistedRows: [
      persisted
    ],
    sourceRecords: [
      sourceRecord(101)
    ]
  });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        candidates: [
          candidate(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT'
  );

  pass(
    'legacy Source Record Key alias blocks insert'
  );
}

/*
 * Existing observation via reconstructed legacy source identity.
 */
{
  const persisted = {
    _rowNumber: 24,
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Source Record ID': '101',
    'Source Observation Key': '',
    'Source Record Key': '',
    'Canonical Property Key':
      'property|parcel|pa|philadelphia|101'
  };

  const harness = createHarness({
    persistedRows: [
      persisted
    ],
    sourceRecords: [
      sourceRecord(101)
    ]
  });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        candidates: [
          candidate(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT'
  );

  pass(
    'reconstructed legacy observation identity blocks insert'
  );
}

/*
 * Missing source record.
 */
{
  const harness =
    createHarness();

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        candidates: [
          candidate(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'SOURCE_RECORD_NO_LONGER_PRESENT_STOP_NO_MUTATION'
  );

  pass(
    'missing fresh source record fails closed'
  );
}

/*
 * Canonical identity drift.
 */
{
  const harness = createHarness({
    sourceRecords: [
      sourceRecord(
        101,
        'property|parcel|pa|philadelphia|different'
      )
    ]
  });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        candidates: [
          candidate(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'CANONICAL_IDENTITY_DRIFT_STOP_NO_MUTATION'
  );

  pass(
    'canonical identity drift fails closed'
  );
}

/*
 * Source observation identity drift.
 */
{
  const harness = createHarness({
    sourceRecords: [
      sourceRecord(101)
    ]
  });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        candidates: [
          {
            sourceObservationKey:
              'pa-philadelphia|code_violations|999',

            immutableSourceRecordId:
              '101',

            expectedCanonicalPropertyKey:
              'property|parcel|pa|philadelphia|101'
          }
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'SOURCE_IDENTITY_DRIFT_STOP_NO_MUTATION'
  );

  pass(
    'source observation identity drift fails closed'
  );
}

/*
 * Bounded candidate count.
 */
{
  const harness =
    createHarness();

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          candidates:
            Array.from(
              { length: 26 },
              (_, index) =>
                candidate(
                  index + 1
                )
            )
        }),
    /1-25 explicit candidates/
  );

  pass(
    'candidate batch greater than 25 is rejected'
  );
}

/*
 * Candidate ID must be query-safe positive objectid.
 */
{
  const harness =
    createHarness();

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          candidates: [
            {
              sourceObservationKey:
                'test',
              immutableSourceRecordId:
                '1 OR 1=1',
              expectedCanonicalPropertyKey:
                'property|test'
            }
          ]
        }),
    /positive objectid integer/
  );

  pass(
    'non-numeric immutable source ID is rejected'
  );
}

/*
 * Duplicate explicit authority is rejected.
 */
{
  const harness =
    createHarness();

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          candidates: [
            candidate(101),
            candidate(101)
          ]
        }),
    /Duplicate C1 Source Observation Key/
  );

  pass(
    'duplicate explicit candidate authority is rejected'
  );
}

console.log('');
console.log(
  'County C1 live preflight validation PASSED.'
);
