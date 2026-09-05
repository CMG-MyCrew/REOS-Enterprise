#!/usr/bin/env node
'use strict';

const fs = require('fs');

const FILE =
  'build/apps-script-brand/CountyCodeViolationDurableSourceReconciliation.js';

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

function requireText(source, text, message) {
  if (!source.includes(text)) {
    fail(message || ('Missing required contract text: ' + text));
  }
}

function forbidText(source, text, message) {
  if (source.includes(text)) {
    fail(message || ('Forbidden contract text present: ' + text));
  }
}

if (!fs.existsSync(FILE)) {
  fail('Durable source reconciliation module is missing.');
}

const source = fs.readFileSync(FILE, 'utf8');

requireText(
  source,
  'CountyCodeViolationDurableSourceReconciliation',
  'Expected durable source reconciliation namespace.'
);

requireText(
  source,
  "var TABLE = 'DISTRESS_LEADS';",
  'Expected DISTRESS_LEADS read scope.'
);

requireText(
  source,
  "var CONNECTOR_ID = 'PA-PHILADELPHIA';",
  'Expected exact Philadelphia connector scope.'
);

requireText(
  source,
  "var DATASET = 'code_violations';",
  'Expected exact code_violations dataset scope.'
);

requireText(
  source,
  'REOS.Security.requireAdmin()',
  'Expected admin authority gate.'
);

requireText(
  source,
  'managedTriggerCount_()',
  'Expected scheduler quiescence gate.'
);

requireText(
  source,
  'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL',
  'Expected certified endpoint Script Property authority.'
);

requireText(
  source,
  'VIOLATIONNUMBER',
  'Expected source lookup by durable violation number.'
);

requireText(
  source,
  'violationnumber',
  'Expected lower-case ArcGIS violation-number field handling.'
);

requireText(
  source,
  'readOnly: true',
  'Expected explicit read-only result contract.'
);

requireText(
  source,
  'productionDataMutationAuthorityGranted: false',
  'Production mutation authority must remain denied.'
);

requireText(
  source,
  'connectorExecutionAuthorityGranted: false',
  'Connector execution authority must remain denied.'
);

requireText(
  source,
  'checkpointMutationAuthorityGranted: false',
  'Checkpoint mutation authority must remain denied.'
);

requireText(
  source,
  'schedulerAuthorityGranted: false',
  'Scheduler authority must remain denied.'
);

requireText(
  source,
  'repairAuthorityGranted: false',
  'Repair authority must remain denied.'
);

requireText(
  source,
  'migrationAuthorityGranted: false',
  'Migration authority must remain denied.'
);

requireText(
  source,
  'automaticOfferAuthorityGranted: false',
  'Automatic-offer authority must remain denied.'
);

forbidText(
  source,
  'CountyConnectorSDK.run(',
  'Reconciliation must not execute CountyConnectorSDK.run().'
);

forbidText(
  source,
  'Database.insert(',
  'Reconciliation must not insert production rows.'
);

forbidText(
  source,
  'Database.update(',
  'Reconciliation must not update production rows.'
);

forbidText(
  source,
  'Database.upsert(',
  'Reconciliation must not upsert production rows.'
);

forbidText(
  source,
  'Database.delete(',
  'Reconciliation must not delete production rows.'
);

forbidText(
  source,
  'newTrigger(',
  'Reconciliation must not create scheduler triggers.'
);

console.log(
  'County code-violation durable source reconciliation contract PASSED.'
);

/* Synthetic behavioral certification. */
const vm = require('vm');

const CERTIFIED_ENDPOINT =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonical(row) {
  const parcel =
    String(row['Parcel ID'] || '').trim();

  if (parcel) {
    return {
      ok: true,
      key:
        'property|parcel|pa|philadelphia|' +
        parcel.toLowerCase()
    };
  }

  const address =
    String(row.Address || '')
      .trim()
      .toLowerCase();

  const zip =
    String(row.Zip || '')
      .trim()
      .toLowerCase();

  if (!address) {
    return {
      ok: false,
      key: ''
    };
  }

  return {
    ok: true,
    key:
      'property|address|pa|philadelphia|' +
      zip +
      '|' +
      address
  };
}

function sourceRow(
  violationNumber,
  objectId,
  parcelId
) {
  return {
    violationnumber: violationNumber,
    objectid: objectId,
    parcel_id_num: parcelId,
    address: '100 TEST ST',
    zip: '19101',
    casenumber: 'CF-TEST',
    violationdate: 1780000000000,
    violationcode: 'TEST',
    violationcodetitle: 'TEST VIOLATION',
    violationstatus: 'OPEN',
    casestatus: 'IN VIOLATION',
    caseprioritydesc: 'UNSAFE'
  };
}

function persistedRow(
  violationNumber,
  parcelId,
  rowNumber
) {
  return {
    _rowNumber: rowNumber || 10,
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Distress Lead ID':
      'DL-TEST-' + String(rowNumber || 10),
    'Source Record ID':
      String(rowNumber || 10),
    'Violation Number': violationNumber,
    'Parcel ID': parcelId,
    Address: '100 TEST ST',
    Zip: '19101',
    'Source Observation Key':
      'pa-philadelphia|code_violations|' +
      String(rowNumber || 10)
  };
}

function harness(options) {
  options = options || {};

  const fetchCalls = [];

  const triggers =
    Array.from(
      {
        length: Number(
          options.triggerCount || 0
        )
      },
      function () {
        return {
          getHandlerFunction() {
            return 'reosCountyProductionSchedulerRun';
          }
        };
      }
    );

  const context = {
    console: console,

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return (
              options.endpoint ||
              CERTIFIED_ENDPOINT
            );
          }
        };
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return triggers;
      }
    },

    REOS: {
      Security: {
        requireAdmin() {
          return true;
        }
      },

      Database: {
        getAll() {
          return clone(
            options.persistedRows || []
          );
        },

        insert() {
          throw new Error(
            'Unexpected production insert.'
          );
        },

        update() {
          throw new Error(
            'Unexpected production update.'
          );
        },

        upsert() {
          throw new Error(
            'Unexpected production upsert.'
          );
        },

        delete() {
          throw new Error(
            'Unexpected production delete.'
          );
        }
      },

      CountyRuntimeBridge: {
        registerConnectors() {
          return true;
        }
      },

      CountyConnectorSDK: {
        get() {
          return {
            normalize() {
              return {};
            }
          };
        }
      },

      CountyAdapters: {
        ArcGIS: {
          fetch(request) {
            fetchCalls.push(
              clone(request)
            );

            return {
              records: clone(
                options.sourceRows || []
              ),
              metadata: {
                synthetic: true
              }
            };
          }
        }
      },

      CanonicalPropertyIdentity: {
        tryCanonicalPropertyIdentity:
          canonical
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    source,
    context,
    {
      filename: FILE
    }
  );

  return {
    run:
      context
        .reosCountyCodeViolationDurableSourceReconciliation,

    fetchCalls: fetchCalls
  };
}

function expectClassification(
  name,
  options,
  violationNumber,
  expected
) {
  const test = harness(options);

  const result =
    test.run(violationNumber);

  assert(
    result.classification === expected,
    name +
      ': expected ' +
      expected +
      ', received ' +
      result.classification
  );

  assert(
    result.readOnly === true,
    name + ': readOnly must be true.'
  );

  [
    'productionDataMutationAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'checkpointMutationAuthorityGranted',
    'schedulerAuthorityGranted',
    'repairAuthorityGranted',
    'migrationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(function (field) {
    assert(
      result[field] === false,
      name +
        ': ' +
        field +
        ' must remain false.'
    );
  });

  assert(
    test.fetchCalls.length === 1,
    name +
      ': expected exactly one bounded source read.'
  );

  assert(
    test.fetchCalls[0].where ===
      "violationnumber = '" +
        violationNumber +
        "'",
    name +
      ': source query must use Violation Number.'
  );

  console.log(
    'PASS:',
    name
  );
}

expectClassification(
  'single source canonical match',
  {
    sourceRows: [
      sourceRow(
        'VI-TEST-001',
        101,
        '100001'
      )
    ],
    persistedRows: [
      persistedRow(
        'VI-TEST-001',
        '100001',
        11
      )
    ]
  },
  'VI-TEST-001',
  'SOURCE_CANONICAL_MATCH'
);

expectClassification(
  'physical ArcGIS duplicate canonical match',
  {
    sourceRows: [
      sourceRow(
        'VI-TEST-002',
        201,
        '200001'
      ),
      sourceRow(
        'VI-TEST-002',
        202,
        '200001'
      )
    ],
    persistedRows: [
      persistedRow(
        'VI-TEST-002',
        '200001',
        21
      )
    ]
  },
  'VI-TEST-002',
  'SOURCE_PHYSICAL_DUPLICATE_CANONICAL_MATCH'
);

expectClassification(
  'persisted property conflict with source available',
  {
    sourceRows: [
      sourceRow(
        'VI-TEST-003',
        301,
        '300001'
      )
    ],
    persistedRows: [
      persistedRow(
        'VI-TEST-003',
        '300001',
        31
      ),
      persistedRow(
        'VI-TEST-003',
        '300002',
        32
      )
    ]
  },
  'VI-TEST-003',
  'PERSISTED_PROPERTY_CONFLICT_SOURCE_AVAILABLE'
);

expectClassification(
  'source missing',
  {
    sourceRows: [],
    persistedRows: [
      persistedRow(
        'VI-TEST-004',
        '400001',
        41
      )
    ]
  },
  'VI-TEST-004',
  'SOURCE_MISSING'
);

expectClassification(
  'source persisted property mismatch',
  {
    sourceRows: [
      sourceRow(
        'VI-TEST-005',
        501,
        '500001'
      )
    ],
    persistedRows: [
      persistedRow(
        'VI-TEST-005',
        '500002',
        51
      )
    ]
  },
  'VI-TEST-005',
  'SOURCE_PERSISTED_PROPERTY_MISMATCH'
);

expectClassification(
  'source property ambiguity',
  {
    sourceRows: [
      sourceRow(
        'VI-TEST-006',
        601,
        '600001'
      ),
      sourceRow(
        'VI-TEST-006',
        602,
        '600002'
      )
    ],
    persistedRows: [
      persistedRow(
        'VI-TEST-006',
        '600001',
        61
      )
    ]
  },
  'VI-TEST-006',
  'SOURCE_PROPERTY_AMBIGUOUS'
);

expectClassification(
  'source not persisted',
  {
    sourceRows: [
      sourceRow(
        'VI-TEST-007',
        701,
        '700001'
      )
    ],
    persistedRows: []
  },
  'VI-TEST-007',
  'SOURCE_NOT_PERSISTED'
);

(function testSchedulerGate() {
  const test =
    harness({
      triggerCount: 1
    });

  let blocked = false;

  try {
    test.run('VI-TEST-008');
  } catch (error) {
    blocked =
      String(error.message || error)
        .includes(
          'requires zero managed scheduler triggers'
        );
  }

  assert(
    blocked,
    'scheduler quiescence gate must fail closed.'
  );

  assert(
    test.fetchCalls.length === 0,
    'scheduler gate must block before source read.'
  );

  console.log(
    'PASS: scheduler quiescence fail-closed'
  );
})();

(function testEndpointGate() {
  const test =
    harness({
      endpoint: 'https://invalid.example/query'
    });

  let blocked = false;

  try {
    test.run('VI-TEST-009');
  } catch (error) {
    blocked =
      String(error.message || error)
        .includes(
          'endpoint authority mismatch'
        );
  }

  assert(
    blocked,
    'certified endpoint gate must fail closed.'
  );

  assert(
    test.fetchCalls.length === 0,
    'endpoint gate must block before source read.'
  );

  console.log(
    'PASS: certified endpoint fail-closed'
  );
})();

(function testViolationNumberValidation() {
  const test = harness({});

  let blocked = false;

  try {
    test.run("VI-'INJECT");
  } catch (error) {
    blocked =
      String(error.message || error)
        .includes(
          'requires one valid Violation Number'
        );
  }

  assert(
    blocked,
    'invalid Violation Number must fail closed.'
  );

  assert(
    test.fetchCalls.length === 0,
    'invalid durable identity must block before source read.'
  );

  console.log(
    'PASS: violation-number validation fail-closed'
  );
})();

console.log(
  'County code-violation durable source reconciliation behavioral certification PASSED.'
);
