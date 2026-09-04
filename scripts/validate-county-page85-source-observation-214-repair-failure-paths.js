#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const FILE =
  'build/apps-script-brand/CountyPage85SourceObservation214Repair.js';

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const HEADERS = [
  'Distress Lead ID',
  'Created At',
  'Updated At',
  'Address',
  'City',
  'State',
  'Zip',
  'County',
  'Status',
  'Source',
  'Source Dataset',
  'Connector Run ID',
  'Parcel ID',
  'Source Record ID',
  'Source Record Key',
  'Source Observation Key',
  'Canonical Property Key',
  'Owner Name',
  'Co-Owner Name',
  'Estimated Value',
  'Assessment Value',
  'Year Built',
  'Land Acres',
  'Living Area',
  'Last Sale Date',
  'Last Sale Price',
  'Source Updated At',
  'Distress Type',
  'Notes',
  'Violation Number',
  'Violation Type',
  'Violation Status'
];

const AUTHORITATIVE_LEAD =
  'DL-20260821060151-8654';

const DUPLICATE_LEAD =
  'DL-20260821060203-1280';

const NATURAL_KEY =
  'pa-philadelphia|code_violations|214';

const CANONICAL_KEY =
  'property|parcel|pa|philadelphia|466864';

function pass(message) {
  console.log(
    'PASS: ' + message
  );
}

function expectThrow(
  fn,
  pattern
) {
  let error;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert.ok(
    error,
    'Expected operation to throw.'
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

function blankRow() {
  return HEADERS.map(
    () => ''
  );
}

function setField(
  row,
  field,
  value
) {
  const index =
    HEADERS.indexOf(field);

  assert.ok(
    index >= 0,
    'Missing header: ' + field
  );

  row[index] = value;
}

function rowObject(
  row,
  rowNumber
) {
  const record = {};

  HEADERS.forEach(
    (header, index) => {
      record[header] =
        row[index];
    }
  );

  record._rowNumber =
    rowNumber;

  return record;
}

function authoritativeRow() {
  const row =
    blankRow();

  setField(
    row,
    'Distress Lead ID',
    AUTHORITATIVE_LEAD
  );

  setField(
    row,
    'Address',
    '1327 S 4th St'
  );

  setField(
    row,
    'City',
    'Philadelphia'
  );

  setField(
    row,
    'State',
    'PA'
  );

  setField(
    row,
    'Zip',
    '19147-5932'
  );

  setField(
    row,
    'County',
    'Philadelphia'
  );

  setField(
    row,
    'Source',
    'PA-PHILADELPHIA'
  );

  setField(
    row,
    'Source Dataset',
    'code_violations'
  );

  setField(
    row,
    'Parcel ID',
    '466864'
  );

  setField(
    row,
    'Source Record ID',
    '214'
  );

  setField(
    row,
    'Source Record Key',
    NATURAL_KEY
  );

  return row;
}

function duplicateRow() {
  const row =
    blankRow();

  setField(
    row,
    'Distress Lead ID',
    DUPLICATE_LEAD
  );

  setField(
    row,
    'Address',
    '1327 S 4th St'
  );

  setField(
    row,
    'City',
    'Philadelphia'
  );

  setField(
    row,
    'State',
    'PA'
  );

  setField(
    row,
    'Zip',
    '19147-5932'
  );

  setField(
    row,
    'County',
    'Philadelphia'
  );

  setField(
    row,
    'Source',
    'PA-PHILADELPHIA'
  );

  setField(
    row,
    'Source Dataset',
    'code_violations'
  );

  setField(
    row,
    'Source Record ID',
    '214'
  );

  setField(
    row,
    'Source Record Key',
    NATURAL_KEY
  );

  return row;
}

function freshNormalized() {
  return {
    Address:
      '1327 S 4TH ST',

    City:
      'Philadelphia',

    State:
      'PA',

    Zip:
      '19147-5932',

    County:
      'Philadelphia',

    Source:
      'PA-PHILADELPHIA',

    'Source Dataset':
      'code_violations',

    'Source Record ID':
      214,

    'Parcel ID':
      '466864',

    'Violation Number':
      'VI-2026-045600',

    'Violation Status':
      'OPEN',

    'Violation Type':
      'ID STRUCTURE'
  };
}

function signedDigest(value) {
  return Array.from(
    crypto
      .createHash('sha256')
      .update(
        String(value),
        'utf8'
      )
      .digest(),
    byte =>
      byte > 127
        ? byte - 256
        : byte
  );
}

function createHarness(options = {}) {
  const rows =
    new Map([
      [
        923,
        authoritativeRow()
      ],
      [
        925,
        duplicateRow()
      ]
    ]);

  let writeCount = 0;

  let resolveCount = 0;

  const downstreamReference =
    options.downstreamReference === true;

  const postWriteIdentityFailure =
    options.postWriteIdentityFailure === true;

  const rollbackWriteFailure =
    options.rollbackWriteFailure === true;

  function getRow(
    rowNumber
  ) {
    if (!rows.has(rowNumber)) {
      rows.set(
        rowNumber,
        blankRow()
      );
    }

    return rows.get(
      rowNumber
    );
  }

  const distressSheet = {
    getName() {
      return 'DISTRESS_LEADS';
    },

    getLastRow() {
      return 925;
    },

    getLastColumn() {
      return HEADERS.length;
    },

    getRange(
      row,
      column,
      numRows,
      numColumns
    ) {
      assert.equal(
        numRows,
        1
      );

      assert.equal(
        column,
        1
      );

      assert.equal(
        numColumns,
        HEADERS.length
      );

      return {
        getValues() {
          return [
            Array.from(
              getRow(row)
            )
          ];
        },

        setValues(values) {
          writeCount++;

          if (
            rollbackWriteFailure &&
            writeCount === 2
          ) {
            throw new Error(
              'SIMULATED_ROLLBACK_WRITE_FAILURE'
            );
          }

          assert.equal(
            values.length,
            1
          );

          assert.equal(
            values[0].length,
            HEADERS.length
          );

          rows.set(
            row,
            Array.from(
              values[0]
            )
          );
        }
      };
    }
  };

  const downstreamSheet = {
    getName() {
      return 'DEALS';
    },

    getLastRow() {
      return downstreamReference
        ? 2
        : 1;
    },

    getLastColumn() {
      return 2;
    },

    getRange() {
      return {
        getDisplayValues() {
          if (
            downstreamReference
          ) {
            return [
              [
                'Deal ID',
                'Distress Lead ID'
              ],
              [
                'D-1',
                DUPLICATE_LEAD
              ]
            ];
          }

          return [
            [
              'Deal ID',
              'Distress Lead ID'
            ]
          ];
        }
      };
    }
  };

  const spreadsheet = {
    getSheets() {
      return [
        distressSheet,
        downstreamSheet
      ];
    }
  };

  const checkpointProperties = {
    REOS_COUNTY_SCHEDULER_CYCLE_ID:
      'COUNTY-20260902222607805',

    REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX:
      '0',

    REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR:
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|' +
      '1780925895000|635678',

    REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON:
      '[]',

    REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL:
      'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/' +
      'VIOLATIONS/FeatureServer/0/query'
  };

  function getAll() {
    return [
      923,
      925
    ]
      .filter(
        rowNumber =>
          getRow(
            rowNumber
          ).some(
            cell =>
              cell !== '' &&
              cell !== null
          )
      )
      .map(
        rowNumber =>
          rowObject(
            Array.from(
              getRow(rowNumber)
            ),
            rowNumber
          )
      );
  }

  const sandbox = {
    console,

    Date,

    JSON,

    Object,

    Array,

    String,

    Number,

    Boolean,

    Error,

    Math,

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
        payload
      ) {
        assert.equal(
          algorithm,
          'SHA_256'
        );

        return signedDigest(
          payload
        );
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return [];
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            return Object.prototype
              .hasOwnProperty
              .call(
                checkpointProperties,
                key
              )
              ? checkpointProperties[key]
              : null;
          }
        };
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return spreadsheet;
      },

      flush() {}
    },

    REOS: {
      Security: {
        requireAdmin() {}
      },

      Database: {
        getSheet(name) {
          assert.equal(
            name,
            'DISTRESS_LEADS'
          );

          return distressSheet;
        },

        getHeaders(name) {
          assert.equal(
            name,
            'DISTRESS_LEADS'
          );

          return Array.from(
            HEADERS
          );
        },

        rowToObject(
          headers,
          values,
          rowNumber
        ) {
          assert.deepEqual(
            Array.from(headers),
            HEADERS
          );

          return rowObject(
            Array.from(values),
            rowNumber
          );
        },

        getAll(name) {
          assert.equal(
            name,
            'DISTRESS_LEADS'
          );

          return getAll();
        },

        withScriptLockContext(work) {
          return work({
            capability:
              'TEST'
          });
        }
      },

      CountyRuntimeBridge: {
        registerConnectors() {}
      },

      CountyConnectorSDK: {
        get(id) {
          assert.equal(
            id,
            'PA-PHILADELPHIA'
          );

          return {
            normalize() {
              return freshNormalized();
            }
          };
        }
      },

      CountyAdapters: {
        ArcGIS: {
          fetch(options) {
            assert.match(
              options.where,
              /objectid = 214/
            );

            return {
              records: [
                {
                  objectid:
                    214
                }
              ]
            };
          }
        }
      },

      CanonicalPropertyIdentity: {
        resolve(record) {
          resolveCount++;

          const sourceId =
            String(
              record[
                'Source Record ID'
              ] || ''
            );

          assert.equal(
            sourceId,
            '214'
          );

          const parcel =
            String(
              record[
                'Parcel ID'
              ] || ''
            );

          /*
           * Resolve order:
           *
           * 1 fresh source
           * 2 authoritative prestate
           * 3 duplicate prestate
           * 4 surviving authoritative row after mutation
           */
          if (
            postWriteIdentityFailure &&
            resolveCount === 4
          ) {
            return {
              sourceObservationKey:
                NATURAL_KEY,

              canonicalPropertyKey:
                'property|SIMULATED-POST-WRITE-DRIFT'
            };
          }

          if (parcel === '466864') {
            return {
              sourceObservationKey:
                NATURAL_KEY,

              canonicalPropertyKey:
                CANONICAL_KEY
            };
          }

          return {
            sourceObservationKey:
              NATURAL_KEY,

            canonicalPropertyKey:
              'property|address|pa|philadelphia|' +
              '19147-5932|1327 s 4th st'
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
        FILE
    }
  );

  return {
    execute(options) {
      return sandbox
        .REOS
        .CountyPage85SourceObservation214Repair
        .execute(options);
    },

    writeCount() {
      return writeCount;
    },

    row925() {
      return Array.from(
        getRow(925)
      );
    },

    original925:
      duplicateRow()
  };
}

const options = {
  confirmRepair:
    true,

  sourceObservationKey:
    NATURAL_KEY
};

console.log(
  '=== PAGE-85 REPAIR DYNAMIC FAILURE-PATH CONTRACT ==='
);

/*
 * Scenario 1:
 * A downstream reference appears after the certified external audit
 * but before repair execution.
 *
 * Mutation authority must be revoked before any write.
 */
{
  const harness =
    createHarness({
      downstreamReference:
        true
    });

  expectThrow(
    () =>
      harness.execute(
        options
      ),
    /downstream reference authority changed/i
  );

  assert.equal(
    harness.writeCount(),
    0,
    'downstream-reference guard must fail before mutation'
  );

  assert.deepEqual(
    harness.row925(),
    harness.original925,
    'row 925 must remain exact prestate when reference guard blocks'
  );

  pass(
    'new downstream reference fails closed before any write'
  );
}

/*
 * Scenario 2:
 * The repair write succeeds, but post-write canonical reconciliation
 * detects drift.
 *
 * The executor must perform one repair write + one rollback write and
 * restore the exact certified row-925 prestate.
 */
{
  const harness =
    createHarness({
      postWriteIdentityFailure:
        true
    });

  expectThrow(
    () =>
      harness.execute(
        options
      ),
    /certified prestate restored/i
  );

  assert.equal(
    harness.writeCount(),
    2,
    'successful rollback must perform repair write plus rollback write'
  );

  assert.deepEqual(
    harness.row925(),
    harness.original925,
    'successful rollback must restore exact row-925 prestate'
  );

  pass(
    'post-write reconciliation failure restores exact prestate'
  );
}

/*
 * Scenario 3:
 * Post-write reconciliation fails and the rollback write itself fails.
 *
 * The result must be explicitly ambiguous and must prohibit automatic
 * retry.
 */
{
  const harness =
    createHarness({
      postWriteIdentityFailure:
        true,

      rollbackWriteFailure:
        true
    });

  const error =
    expectThrow(
      () =>
        harness.execute(
          options
        ),
      /ambiguous state/i
    );

  assert.match(
    String(
      error.message ||
      error
    ),
    /automatic retry prohibited/i
  );

  assert.equal(
    harness.writeCount(),
    2,
    'rollback failure must expose exactly two attempted writes'
  );

  pass(
    'rollback failure is ambiguous and explicitly non-retriable'
  );
}

console.log();
console.log(
  'PAGE-85 DYNAMIC FAILURE-PATH CERTIFICATION PASSED.'
);
