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
  path.resolve(__dirname, '..');

const CONNECTOR_PATH =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'PAPhiladelphiaCountyConnector.js'
  );

const source =
  fs.readFileSync(
    CONNECTOR_PATH,
    'utf8'
  );

const DOMAIN_ID =
  'PHL-CODE-HIGH-SEED-20250901-OID636638-V1';

let registered = null;
let adapterCalls = [];
let fetchImpl = null;

const sandbox =
  vm.createContext({
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Error,
    RegExp,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return '';
          }
        };
      }
    },

    REOS: {
      CountyConnectorSDK: {
        register(definition) {
          registered =
            definition;

          return definition;
        },

        get() {
          return null;
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
          fetch(adapter, options) {
            adapterCalls.push({
              adapter,
              options
            });

            if (!fetchImpl) {
              throw new Error(
                'Unexpected adapter fetch.'
              );
            }

            return fetchImpl(
              adapter,
              options
            );
          }
        }
      }
    }
  });

vm.runInContext(
  source,
  sandbox,
  {
    filename:
      CONNECTOR_PATH
  }
);

const moduleUnderTest =
  sandbox
    .REOS
    .PAPhiladelphiaCountyConnector;

assert.ok(
  moduleUnderTest,
  'Philadelphia connector module missing'
);

moduleUnderTest.register();

assert.ok(
  registered,
  'Philadelphia connector did not register'
);

const definition =
  moduleUnderTest
    .manifest
    .datasets
    .code_violations;

assert.equal(
  definition.orderByFields,
  'violationdate ASC, objectid ASC',
  'keyset ordering changed'
);

assert.equal(
  definition.cursorDomain.type,
  'arcgis-date-objectid-v1',
  'keyset cursor type changed'
);

assert.equal(
  definition.cursorDomain.id,
  DOMAIN_ID,
  'keyset cursor domain ID changed'
);

assert.equal(
  definition.cursorDomain.dateField,
  'violationdate',
  'keyset date field changed'
);

assert.equal(
  definition.cursorDomain.objectIdField,
  'objectid',
  'keyset object-ID field changed'
);

assert.equal(
  definition.sourceQuery.where,
  "violationdate >= TIMESTAMP '2025-09-01 00:00:00' AND caseprioritydesc IN ('UNSAFE','IMMINENTLY DANGEROUS','UNFIT','HAZARDOUS','UNLAWFUL') AND objectid <= 636638",
  'certified frozen seed predicate changed'
);

console.log(
  'PASS: exact frozen HIGH-distress seed domain declared.'
);

const equalsRules =
  definition
    .recordFilter
    .requireEquals || [];

assert.equal(
  equalsRules.length,
  1,
  'expected one OPEN actionability rule'
);

assert.equal(
  equalsRules[0].value,
  'OPEN',
  'OPEN actionability value changed'
);

console.log(
  'PASS: OPEN actionability remains record-level eligibility.'
);

function record(
  dateMs,
  objectId,
  status = 'OPEN',
  address = '123 TEST ST'
) {
  return {
    violationdate:
      dateMs,
    objectid:
      objectId,
    caseprioritydesc:
      'UNSAFE',
    violationstatus:
      status,
    address:
      address,
    parcel_id_num:
      String(objectId)
  };
}

function fetchContext(
  cursor
) {
  return {
    dataset:
      'code_violations',

    cursor:
      cursor || '',

    limit:
      50,

    config: {
      endpoint:
        'https://example.test/query'
    }
  };
}

const baseDate =
  Date.UTC(
    2025,
    8,
    10,
    0,
    0,
    0
  );

adapterCalls = [];

fetchImpl =
  function (
    adapter,
    options
  ) {
    assert.equal(
      adapter,
      'arcgis'
    );

    return {
      records:
        Array.from(
          { length: 50 },
          (_, index) =>
            record(
              baseDate +
                index * 1000,
              1000 + index
            )
        ),

      nextCursor:
        'OFFSET-CURSOR-MUST-BE-IGNORED',

      metadata: {
        synthetic:
          'initial'
      }
    };
  };

const first =
  registered.fetch(
    fetchContext('')
  );

assert.equal(
  adapterCalls.length,
  1,
  'initial keyset page must use one adapter request'
);

assert.equal(
  adapterCalls[0]
    .options
    .where,
  definition
    .sourceQuery
    .where,
  'initial page predicate changed'
);

assert.equal(
  adapterCalls[0]
    .options
    .orderByFields,
  'violationdate ASC, objectid ASC',
  'initial ordering changed'
);

assert.equal(
  adapterCalls[0]
    .options
    .context
    .cursor,
  '',
  'keyset component request must never use offset cursor'
);

const expectedFirstCursor =
  [
    'AK1',
    DOMAIN_ID,
    String(
      baseDate +
      49 * 1000
    ),
    '1049'
  ].join('|');

assert.equal(
  first.nextCursor,
  expectedFirstCursor,
  'initial composite cursor is not exact'
);

console.log(
  'PASS: empty cursor produces exact AK1 composite cursor.'
);

adapterCalls = [];

fetchImpl =
  function (
    adapter,
    options
  ) {
    const where =
      String(
        options.where || ''
      );

    if (
      where.includes(
        'violationdate = TIMESTAMP'
      )
    ) {
      return {
        records: [
          record(
            baseDate +
              49 * 1000,
            1050
          ),
          record(
            baseDate +
              49 * 1000,
            1051
          )
        ],
        metadata: {
          synthetic:
            'same-timestamp'
        }
      };
    }

    if (
      where.includes(
        'violationdate > TIMESTAMP'
      )
    ) {
      return {
        records:
          Array.from(
            { length: 48 },
            (_, index) =>
              record(
                baseDate +
                  (50 + index) *
                    1000,
                2000 + index
              )
          ),
        metadata: {
          synthetic:
            'later-timestamp'
        }
      };
    }

    throw new Error(
      'Unexpected continuation predicate: ' +
      where
    );
  };

const second =
  registered.fetch(
    fetchContext(
      expectedFirstCursor
    )
  );

assert.equal(
  adapterCalls.length,
  2,
  'continuation page must use exact two-query keyset when tie rows exist'
);

assert.match(
  adapterCalls[0]
    .options
    .where,
  /violationdate = TIMESTAMP/
);

assert.match(
  adapterCalls[0]
    .options
    .where,
  /objectid > 1049/
);

assert.match(
  adapterCalls[1]
    .options
    .where,
  /violationdate > TIMESTAMP/
);

assert.equal(
  second.records.length,
  50,
  'continuation page must remain bounded at 50'
);

assert.equal(
  second.records[0]
    .objectid,
  1050,
  'same-timestamp continuation row lost'
);

assert.equal(
  second.records[1]
    .objectid,
  1051,
  'second same-timestamp continuation row lost'
);

assert.equal(
  second.records[2]
    .objectid,
  2000,
  'later-timestamp continuation did not follow tie rows'
);

assert.ok(
  second.nextCursor.startsWith(
    'AK1|' +
    DOMAIN_ID +
    '|'
  ),
  'continuation cursor left certified domain'
);

console.log(
  'PASS: two-query continuation preserves timestamp ties without OR query.'
);

adapterCalls = [];

fetchImpl =
  function () {
    return {
      records:
        Array.from(
          { length: 35 },
          (_, index) =>
            record(
              baseDate +
                index * 1000,
              3000 + index
            )
        )
    };
  };

const terminal =
  registered.fetch(
    fetchContext('')
  );

assert.equal(
  terminal.records.length,
  35
);

assert.equal(
  terminal.nextCursor,
  '',
  'partial keyset page must be terminal'
);

console.log(
  'PASS: partial page terminates keyset seed domain.'
);

adapterCalls = [];

fetchImpl =
  function () {
    throw new Error(
      'network must not be reached'
    );
  };

assert.throws(
  () =>
    registered.fetch(
      fetchContext('2850')
    ),
  /cursor domain mismatch/,
  'legacy numeric cursor must fail closed'
);

assert.equal(
  adapterCalls.length,
  0,
  'legacy cursor reached adapter/network boundary'
);

console.log(
  'PASS: legacy numeric cursor 2850 fails before adapter/network.'
);

adapterCalls = [];

assert.throws(
  () =>
    registered.fetch(
      fetchContext(
        'AK1|WRONG-DOMAIN|' +
        String(baseDate) +
        '|1'
      )
    ),
  /cursor domain mismatch/,
  'foreign composite cursor must fail closed'
);

assert.equal(
  adapterCalls.length,
  0,
  'foreign domain cursor reached adapter/network'
);

console.log(
  'PASS: foreign cursor domain fails before adapter/network.'
);

const openRecord =
  registered.normalize(
    record(
      baseDate,
      4001,
      'open',
      '4001 TEST ST'
    ),
    {
      dataset:
        'code_violations',
      config: {}
    }
  );

assert.notEqual(
  openRecord.__skip,
  true,
  'OPEN record must remain actionable'
);

assert.equal(
  openRecord.Address,
  '4001 TEST ST'
);

assert.equal(
  String(
    openRecord[
      'Source Record ID'
    ]
  ),
  '4001'
);

assert.equal(
  Number(
    openRecord[
      'Source Updated At'
    ]
  ),
  baseDate,
  'violationdate must be source timestamp'
);

const complied =
  registered.normalize(
    record(
      baseDate,
      4002,
      'COMPLIED',
      '4002 TEST ST'
    ),
    {
      dataset:
        'code_violations',
      config: {}
    }
  );

assert.equal(
  complied.__skip,
  true,
  'non-OPEN HIGH record must be intentional skip'
);

const addressless =
  registered.normalize(
    record(
      baseDate,
      4003,
      'OPEN',
      ''
    ),
    {
      dataset:
        'code_violations',
      config: {}
    }
  );

assert.equal(
  addressless.__skip,
  true,
  'addressless OPEN violation must remain skipped'
);

console.log(
  'PASS: OPEN + property-level actionability filter is exact.'
);

adapterCalls = [];

fetchImpl =
  function (
    adapter,
    options
  ) {
    return {
      records: [],
      nextCursor: '150',
      message: 'synthetic'
    };
  };

const legacyDataset =
  registered.fetch({
    dataset:
      'vacant_properties',
    cursor:
      '100',
    limit:
      50,
    config: {
      endpoint:
        'https://example.test/vacant'
    }
  });

assert.equal(
  adapterCalls.length,
  1
);

assert.equal(
  adapterCalls[0]
    .options
    .context
    .cursor,
  '100',
  'non-keyset Philadelphia dataset cursor behavior changed'
);

assert.equal(
  legacyDataset.nextCursor,
  '150',
  'non-keyset adapter result changed'
);

console.log(
  'PASS: other Philadelphia datasets retain legacy cursor behavior.'
);

console.log('');
console.log(
  'PASS: PHILADELPHIA CODE-VIOLATION KEYSET SEED V1 CONTRACT CERTIFIED.'
);
