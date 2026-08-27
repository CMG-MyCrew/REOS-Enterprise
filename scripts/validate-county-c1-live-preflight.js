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
  path.resolve(__dirname, '..');

const MODULE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyC1LivePreflight.js'
  );

const EXPECTED_DESCRIPTOR_SOURCE_SHA =
  '9d5b728823107083c50f5bb4871e0fce47967e21eadd70a59e13f97e13a2eea9';

const EXPECTED_CATALOG_SHA =
  'b5aeebee8bc5162c9557f2678bf62e1930fa1f6ad5ba369c27b3a1dabb55c091';

const EXPECTED_DESCRIPTOR_COUNT =
  664;

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

function pass(message) {
  console.log(
    `PASS: ${message}`
  );
}

console.log(
  '=== COUNTY C1 LIVE PREFLIGHT CERTIFIED-AUTHORITY CONTRACT ==='
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
  'bounded 25-key limit missing'
);

assert.ok(
  source.includes(
    EXPECTED_DESCRIPTOR_SOURCE_SHA
  ),
  'certified descriptor source SHA missing'
);

assert.ok(
  source.includes(
    EXPECTED_CATALOG_SHA
  ),
  'certified catalog SHA missing'
);

assert.ok(
  source.includes(
    'REOS.CountyC1CertifiedAuthority'
  ),
  'certified authority dependency missing'
);

assert.ok(
  source.includes(
    'options.sourceObservationKeys'
  ),
  'Source Observation Key-only input contract missing'
);

assert.equal(
  source.includes(
    'var candidates =\n      options.candidates;'
  ),
  false,
  'legacy caller-supplied candidate descriptor input remains active'
);

assert.ok(
  source.includes(
    'Caller-supplied C1 candidate descriptors are prohibited.'
  ),
  'legacy candidate rejection missing'
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

assert.equal(
  /CanonicalPropertyIdentity\s*\.\s*resolve\s*\(\s*row\s*\)/.test(
    source
  ),
  false,
  'persisted observation reconstruction still depends on canonical resolution'
);

assert.equal(
  (
    source.match(
      /CanonicalPropertyIdentity\s*\.\s*resolve\s*\(\s*normalized\s*\)/g
    ) || []
  ).length,
  1,
  'fresh-source canonical identity resolution must remain exactly one bounded call'
);

assert.ok(
  source.includes(
    'reconstructedSourceRecordId'
  ),
  'direct persisted source-observation reconstruction missing'
);

pass(
  'module remains structurally read-only'
);

pass(
  'caller identity is bound to certified Source Observation Keys'
);

pass(
  'persisted reconstruction is independent of canonical-property resolution'
);

function authorityRecord(
  id,
  canonicalKey
) {
  const stringId =
    String(id);

  return {
    planningClass:
      'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE',

    sourceObservationKey:
      `pa-philadelphia|code_violations|${stringId}`,

    connectorId:
      'PA-PHILADELPHIA',

    dataset:
      'code_violations',

    immutableSourceRecordId:
      stringId,

    expectedCanonicalPropertyKey:
      canonicalKey ||
      `property|parcel|pa|philadelphia|${stringId}`,

    historicalNormalizedSourceRecordSha256:
      'a'.repeat(64),

    descriptorSha256:
      'b'.repeat(64),

    authorityDescriptorSourceSha256:
      EXPECTED_DESCRIPTOR_SOURCE_SHA,

    authorityCatalogSha256:
      EXPECTED_CATALOG_SHA
  };
}

function sourceObservationKey(id) {
  return (
    'pa-philadelphia|' +
    'code_violations|' +
    String(id)
  );
}

function sourceRecord(
  id,
  canonicalKey
) {
  return {
    objectid:
      Number(id),

    parcel_id_num:
      String(id),

    address:
      `${id} TEST ST`,

    __canonicalPropertyKey:
      canonicalKey ||
      `property|parcel|pa|philadelphia|${id}`
  };
}

function createHarness(options = {}) {
  const mutationCalls = [];

  const sourceRecords =
    options.sourceRecords || [];

  const persistedRows =
    options.persistedRows || [];

  const capturedFetches = [];

  const allowedAuthorityIds =
    new Set(
      (
        options.allowedAuthorityIds ||
        ['101', '202']
      ).map(String)
    );

  const authorityCanonicalById =
    options.authorityCanonicalById ||
    {};

  const authorityMetadataOverride =
    options.authorityMetadataOverride ||
    {};

  let adminCalls = 0;
  let registerCalls = 0;
  let databaseReads = 0;
  let propertyReads = 0;
  let authorityMetadataCalls = 0;
  let authorityResolveCalls = 0;

  function identity(record) {
    if (
      record &&
      record.__forceIdentityError
    ) {
      throw new Error(
        'forced identity error'
      );
    }

    const sourceName =
      String(
        record.Source || ''
      )
        .trim()
        .toLowerCase();

    const dataset =
      String(
        record['Source Dataset'] ||
        ''
      )
        .trim()
        .toLowerCase();

    const sourceRecordId =
      String(
        record['Source Record ID'] ||
        ''
      )
        .trim()
        .toLowerCase();

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
      ok:
        true,

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
      if (
        raw.__normalizeError
      ) {
        throw new Error(
          raw.__normalizeError
        );
      }

      if (
        raw.__skip
      ) {
        return {
          __skip:
            true,

          __skipReason:
            raw.__skipReason ||
            'skip'
        };
      }

      return {
        Source:
          'PA-PHILADELPHIA',

        'Source Dataset':
          'code_violations',

        'Source Record ID':
          String(
            raw.__normalizedSourceRecordId ||
            raw.objectid
          ),

        'Parcel ID':
          raw.parcel_id_num ||
          '',

        Address:
          raw.address ||
          '100 TEST ST',

        City:
          raw.city ||
          'Philadelphia',

        State:
          'PA',

        Zip:
          raw.zip ||
          '19101',

        __canonicalPropertyKey:
          raw.__canonicalPropertyKey ||
          (
            'property|parcel|pa|' +
            'philadelphia|' +
            (
              raw.parcel_id_num ||
              '1'
            )
          )
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

    Error,

    REOS: {
      Database: {
        getAll(table) {
          assert.equal(
            table,
            'DISTRESS_LEADS'
          );

          databaseReads +=
            1;

          return persistedRows;
        },

        insert() {
          mutationCalls.push(
            'insert'
          );
        },

        update() {
          mutationCalls.push(
            'update'
          );
        },

        upsert() {
          mutationCalls.push(
            'upsert'
          );
        },

        softDelete() {
          mutationCalls.push(
            'softDelete'
          );
        }
      },

      Security: {
        requireAdmin() {
          adminCalls +=
            1;
        }
      },

      CountyC1CertifiedAuthority: {
        metadata() {
          authorityMetadataCalls +=
            1;

          return Object.assign(
            {
              mode:
                'READ_ONLY_AUTHORITY_CATALOG',

              planningClass:
                'C1_MISSING_OBSERVATION_RECOVERY_CANDIDATE',

              connectorId:
                'PA-PHILADELPHIA',

              dataset:
                'code_violations',

              descriptorSourceSha256:
                EXPECTED_DESCRIPTOR_SOURCE_SHA,

              catalogSha256:
                EXPECTED_CATALOG_SHA,

              descriptorCount:
                EXPECTED_DESCRIPTOR_COUNT,

              recordCount:
                EXPECTED_DESCRIPTOR_COUNT,

              mutationAuthorityGranted:
                false,

              insertAuthorityGranted:
                false
            },
            authorityMetadataOverride
          );
        },

        resolve(key) {
          authorityResolveCalls +=
            1;

          const match =
            /^pa-philadelphia\|code_violations\|([0-9]+)$/
              .exec(
                String(key)
              );

          if (
            !match ||
            !allowedAuthorityIds.has(
              match[1]
            )
          ) {
            return null;
          }

          return authorityRecord(
            match[1],
            authorityCanonicalById[
              match[1]
            ]
          );
        }
      },

      CountyRuntimeBridge: {
        registerConnectors() {
          registerCalls +=
            1;
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
                adapter:
                  'arcgis',

                status:
                  200
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
            propertyReads +=
              1;

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

        return Array.from(
          crypto
            .createHash(
              'sha256'
            )
            .update(
              String(value)
            )
            .digest()
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
        databaseReads,
        propertyReads,
        authorityMetadataCalls,
        authorityResolveCalls
      };
    }
  };
}

/*
 * Exact certified-key read-only success.
 */
{
  const harness =
    createHarness({
      sourceRecords: [
        sourceRecord(101)
      ]
    });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        sourceObservationKeys: [
          sourceObservationKey(101)
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
    result.scope.authorityBound,
    true
  );

  assert.equal(
    result.scope
      .authorityDescriptorSourceSha256,
    EXPECTED_DESCRIPTOR_SOURCE_SHA
  );

  assert.equal(
    result.scope
      .authorityCatalogSha256,
    EXPECTED_CATALOG_SHA
  );

  assert.equal(
    result.scope
      .authorityDescriptorCount,
    EXPECTED_DESCRIPTOR_COUNT
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

  assert.equal(
    result.results[0]
      .immutableSourceRecordId,
    '101'
  );

  assert.equal(
    result.results[0]
      .expectedCanonicalPropertyKey,
    'property|parcel|pa|philadelphia|101'
  );

  assert.equal(
    result.results[0]
      .descriptorSha256,
    'b'.repeat(64)
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

  pass(
    'certified Source Observation Key resolves to no-write preflight'
  );
}

/*
 * Batch source query derives immutable objectids from catalog authority.
 */
{
  const harness =
    createHarness({
      sourceRecords: [
        sourceRecord(101),
        sourceRecord(202)
      ]
    });

  harness.context
    .reosCountyC1LivePreflight({
      sourceObservationKeys: [
        sourceObservationKey(202),
        sourceObservationKey(101)
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
    'batch objectid query derives only from certified catalog authority'
  );
}

/*
 * Unknown/non-C1 authority must stop before connector registration,
 * endpoint lookup, table read, or network fetch.
 */
{
  const harness =
    createHarness();

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          sourceObservationKeys: [
            sourceObservationKey(999)
          ]
        }),
    /outside certified authority catalog/
  );

  const counters =
    harness.counters();

  assert.equal(
    counters.registerCalls,
    0
  );

  assert.equal(
    counters.databaseReads,
    0
  );

  assert.equal(
    counters.propertyReads,
    0
  );

  assert.equal(
    harness.capturedFetches.length,
    0
  );

  assert.deepEqual(
    harness.mutationCalls,
    []
  );

  pass(
    'unknown candidate is rejected before table or network access'
  );
}

/*
 * Case or spelling drift is not normalized into authority.
 */
{
  const harness =
    createHarness();

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          sourceObservationKeys: [
            'PA-PHILADELPHIA|code_violations|101'
          ]
        }),
    /outside certified authority catalog/
  );

  assert.equal(
    harness.counters()
      .databaseReads,
    0
  );

  assert.equal(
    harness.capturedFetches.length,
    0
  );

  pass(
    'noncanonical observation-key spelling fails closed before I/O'
  );
}

/*
 * Legacy caller descriptors are prohibited even when their values appear
 * syntactically valid.
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
                sourceObservationKey(101),

              immutableSourceRecordId:
                '101',

              expectedCanonicalPropertyKey:
                'property|parcel|pa|philadelphia|101'
            }
          ]
        }),
    /caller-supplied C1 candidate descriptors are prohibited/i
  );

  assert.equal(
    harness.counters()
      .authorityResolveCalls,
    0
  );

  assert.equal(
    harness.counters()
      .databaseReads,
    0
  );

  assert.equal(
    harness.capturedFetches.length,
    0
  );

  pass(
    'caller-supplied immutable ID and canonical identity cannot create authority'
  );
}

/*
 * Authority metadata drift stops before production reads.
 */
{
  const harness =
    createHarness({
      authorityMetadataOverride: {
        catalogSha256:
          '0'.repeat(64)
      }
    });

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          sourceObservationKeys: [
            sourceObservationKey(101)
          ]
        }),
    /Certified C1 authority metadata mismatch/
  );

  assert.equal(
    harness.counters()
      .databaseReads,
    0
  );

  assert.equal(
    harness.counters()
      .propertyReads,
    0
  );

  assert.equal(
    harness.capturedFetches.length,
    0
  );

  pass(
    'catalog metadata drift fails closed before production I/O'
  );
}

/*
 * Existing observation via modern Source Observation Key.
 */
{
  const persisted = {
    _rowNumber:
      22,

    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Source Record ID':
      '101',

    'Source Observation Key':
      sourceObservationKey(101),

    'Source Record Key':
      '',

    'Canonical Property Key':
      'property|parcel|pa|philadelphia|101'
  };

  const harness =
    createHarness({
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
        sourceObservationKeys: [
          sourceObservationKey(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT'
  );

  assert.equal(
    result.results[0]
      .persistedMatchCount,
    1
  );

  pass(
    'modern stored observation identity blocks recovery'
  );
}

/*
 * Existing observation via legacy Source Record Key alias.
 */
{
  const persisted = {
    _rowNumber:
      23,

    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Source Record ID':
      '',

    'Source Observation Key':
      '',

    'Source Record Key':
      sourceObservationKey(101),

    'Canonical Property Key':
      'property|parcel|pa|philadelphia|101'
  };

  const harness =
    createHarness({
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
        sourceObservationKeys: [
          sourceObservationKey(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT'
  );

  pass(
    'legacy Source Record Key alias blocks recovery'
  );
}

/*
 * Direct reconstruction must block the observation even if full canonical
 * property resolution of that persisted legacy row would fail.
 */
{
  const persisted = {
    _rowNumber:
      24,

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
      '',

    __forceIdentityError:
      true
  };

  const harness =
    createHarness({
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
        sourceObservationKeys: [
          sourceObservationKey(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'OBSERVATION_ALREADY_PRESENT_STOP_NO_INSERT'
  );

  assert.equal(
    result.results[0]
      .persistedMatches[0]
      .matchType,
    'RECONSTRUCTED_SOURCE_OBSERVATION_KEY'
  );

  pass(
    'legacy observation reconstruction blocks recovery despite canonical-resolution failure'
  );
}

/*
 * Missing fresh source record.
 */
{
  const harness =
    createHarness();

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        sourceObservationKeys: [
          sourceObservationKey(101)
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
 * Fresh canonical identity drift.
 */
{
  const harness =
    createHarness({
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
        sourceObservationKeys: [
          sourceObservationKey(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'CANONICAL_IDENTITY_DRIFT_STOP_NO_MUTATION'
  );

  pass(
    'fresh canonical identity drift fails closed'
  );
}

/*
 * Fresh immutable source ID drift.
 */
{
  const record =
    sourceRecord(101);

  record.__normalizedSourceRecordId =
    '202';

  const harness =
    createHarness({
      sourceRecords: [
        record
      ]
    });

  const result =
    harness.context
      .reosCountyC1LivePreflight({
        sourceObservationKeys: [
          sourceObservationKey(101)
        ]
      });

  assert.equal(
    result.results[0].outcome,
    'SOURCE_IMMUTABLE_ID_DRIFT_STOP_NO_MUTATION'
  );

  pass(
    'fresh immutable source identity drift fails closed'
  );
}

/*
 * Hard 25-key bound is enforced before catalog resolution.
 */
{
  const harness =
    createHarness();

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          sourceObservationKeys:
            Array.from(
              {
                length:
                  26
              },
              (_, index) =>
                sourceObservationKey(
                  index + 1
                )
            )
        }),
    /1-25 certified Source Observation Keys/
  );

  assert.equal(
    harness.counters()
      .authorityResolveCalls,
    0
  );

  assert.equal(
    harness.counters()
      .databaseReads,
    0
  );

  pass(
    'candidate batch greater than 25 is rejected before authority resolution'
  );
}

/*
 * Duplicate certified key authority is rejected.
 */
{
  const harness =
    createHarness();

  assert.throws(
    () =>
      harness.context
        .reosCountyC1LivePreflight({
          sourceObservationKeys: [
            sourceObservationKey(101),
            sourceObservationKey(101)
          ]
        }),
    /Duplicate certified C1 Source Observation Key/
  );

  assert.equal(
    harness.counters()
      .authorityResolveCalls,
    0
  );

  assert.equal(
    harness.counters()
      .databaseReads,
    0
  );

  pass(
    'duplicate certified candidate authority is rejected before I/O'
  );
}

console.log('');
console.log(
  'County C1 live preflight certified-authority validation PASSED.'
);
