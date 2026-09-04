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
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js';

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const CHECKPOINT_ID =
  'COUNTY-20260902222607805';

const CHECKPOINT_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|' +
  '1782086400000|214';

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
  'Distress Type',
  'Notes',
  'Phone',
  'Email',
  'Source URL',
  'External Lead ID',
  'Lead Type',
  'Last Seen At'
];

const TARGETS = [
  {
    id: '230',
    key: 'pa-philadelphia|code_violations|230',
    canonical: 'property|parcel|pa|philadelphia|466864',
    survivor: 867,
    rows: [
      [867, 'DL-230-A'],
      [875, 'DL-230-B'],
      [883, 'DL-230-C'],
      [891, 'DL-230-D'],
      [899, 'DL-230-E'],
      [907, 'ZIL-230']
    ]
  },
  {
    id: '231',
    key: 'pa-philadelphia|code_violations|231',
    canonical: 'property|parcel|pa|philadelphia|466864',
    survivor: 865,
    rows: [
      [865, 'DL-231-A'],
      [873, 'DL-231-B'],
      [881, 'DL-231-C'],
      [889, 'DL-231-D'],
      [897, 'DL-231-E'],
      [905, 'DL-231-F'],
      [913, 'DL-231-G']
    ]
  },
  {
    id: '232',
    key: 'pa-philadelphia|code_violations|232',
    canonical: 'property|parcel|pa|philadelphia|466864',
    survivor: 863,
    rows: [
      [863, 'DL-232-A'],
      [871, 'DL-232-B'],
      [879, 'DL-232-C'],
      [887, 'DL-232-D'],
      [895, 'DL-232-E'],
      [903, 'DL-232-F'],
      [911, 'ZIL-232']
    ]
  },
  {
    id: '233',
    key: 'pa-philadelphia|code_violations|233',
    canonical: 'property|parcel|pa|philadelphia|466864',
    survivor: 861,
    rows: [
      [861, 'DL-233-A'],
      [869, 'DL-233-B'],
      [877, 'DL-233-C'],
      [885, 'DL-233-D'],
      [893, 'DL-233-E'],
      [901, 'DL-233-F'],
      [909, 'ZIL-233']
    ]
  },
  {
    id: '236',
    key: 'pa-philadelphia|code_violations|236',
    canonical: 'property|parcel|pa|philadelphia|42503',
    survivor: 839,
    rows: [
      [839, 'DL-236-A'],
      [849, 'DL-236-B'],
      [859, 'DL-236-C']
    ]
  },
  {
    id: '237',
    key: 'pa-philadelphia|code_violations|237',
    canonical: 'property|parcel|pa|philadelphia|42503',
    survivor: 837,
    rows: [
      [837, 'DL-237-A'],
      [847, 'DL-237-B'],
      [857, 'DL-237-C']
    ]
  },
  {
    id: '249',
    key: 'pa-philadelphia|code_violations|249',
    canonical: 'property|parcel|pa|philadelphia|24906',
    survivor: 914,
    rows: [
      [906, 'ZIL-249-A'],
      [910, 'ZIL-249-B'],
      [914, 'DL-249-A'],
      [918, 'DL-249-B']
    ]
  },
  {
    id: '250',
    key: 'pa-philadelphia|code_violations|250',
    canonical: 'property|parcel|pa|philadelphia|24906',
    survivor: 904,
    rows: [
      [904, 'DL-250-A'],
      [908, 'ZIL-250-A'],
      [912, 'ZIL-250-B'],
      [916, 'DL-250-B']
    ]
  }
];

const ZILLOW_ROWS = [
  [907, 'ZIL-230'],
  [911, 'ZIL-232'],
  [909, 'ZIL-233'],
  [906, 'ZIL-249-A'],
  [910, 'ZIL-249-B'],
  [908, 'ZIL-250-A'],
  [912, 'ZIL-250-B']
];

const CLEAR_ROWS = [
  875, 883, 891, 899,
  873, 881, 889, 897, 905, 913,
  871, 879, 887, 895, 903,
  869, 877, 885, 893, 901,
  849, 859,
  847, 857,
  918,
  916
];

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

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
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

function contaminatedRow(
  target,
  distressLeadId
) {
  const row =
    blankRow();

  setField(
    row,
    'Distress Lead ID',
    distressLeadId
  );

  setField(
    row,
    'Created At',
    '2026-08-21T00:00:00.000Z'
  );

  setField(
    row,
    'Updated At',
    '2026-09-04T00:00:00.000Z'
  );

  setField(
    row,
    'Address',
    'CERTIFIED ADDRESS ' +
      target.id
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
    'County',
    'Philadelphia'
  );

  setField(
    row,
    'Status',
    'New'
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
    target.canonical
      .split('|')
      .pop()
  );

  setField(
    row,
    'Source Record ID',
    target.id
  );

  setField(
    row,
    'Source Record Key',
    target.key
  );

  setField(
    row,
    'Source Observation Key',
    target.key
  );

  setField(
    row,
    'Canonical Property Key',
    target.canonical
  );

  return row;
}

function valuesToObject(row) {
  const record = {};

  HEADERS.forEach(
    (header, index) => {
      record[header] =
        row[index];
    }
  );

  return record;
}

function makeEvidence(rows) {
  const physicalRows = [];

  const targets =
    TARGETS.map(target => {
      const targetRows =
        target.rows.map(
          ([physicalRow, distressLeadId]) => {
            const values =
              Array.from(
                rows.get(physicalRow)
              );

            physicalRows.push({
              physicalRow,
              distressLeadId,
              sourceRecordId:
                target.id,
              sourceObservationKey:
                target.key,
              canonicalPropertyKey:
                target.canonical,
              sourceTruthRow:
                target.survivor,
              values,
              fingerprintSha256:
                sha256(
                  JSON.stringify(values)
                )
            });

            return {
              physicalRow,
              distressLeadId
            };
          }
        );

      return {
        sourceRecordId:
          target.id,

        sourceObservationKey:
          target.key,

        canonicalPropertyKey:
          target.canonical,

        sourceTruthRow:
          target.survivor,

        rows:
          targetRows,

        freshSource: {
          ok: true,
          readOnly: true,
          sourceRecordFound: true,
          normalizedRecordSkipped: false,

          normalizedSourceRecord: {
            Address:
              'FRESH ADDRESS ' +
              target.id,

            City:
              'Philadelphia',

            State:
              'PA',

            County:
              'Philadelphia',

            Status:
              'New',

            Source:
              'PA-PHILADELPHIA',

            'Source Dataset':
              'code_violations',

            'Source Record ID':
              target.id,

            'Source Record Key':
              target.key,

            'Source Observation Key':
              target.key,

            'Canonical Property Key':
              target.canonical,

            'Distress Type':
              'Code Violation'
          }
        }
      };
    });

  const zillowImports =
    ZILLOW_ROWS.map(
      ([physicalRow, distressLeadId], index) => {
        const gmailMessageId =
          'gmail-message-' +
          (index + 1);

        return {
          physicalRow,
          distressLeadId,
          importRow:
            40 + index,
          importId:
            'IMPORT-' +
            (index + 1),
          gmailMessageId,

          record: {
            'Import ID':
              'IMPORT-' +
              (index + 1),

            'Gmail Message ID':
              gmailMessageId,

            'Source Label':
              'Zillow/New Leads',

            'External Lead ID':
              'EXT-' +
              (index + 1),

            'Property Address':
              'ZILLOW ADDRESS ' +
              (index + 1),

            'Property URL':
              'https://example.invalid/' +
              (index + 1),

            'Lead Type':
              index % 2 === 0
                ? 'Seller'
                : 'Property Inquiry',

            Status:
              'Imported',

            'Contact Name':
              'Zillow Contact',

            Phone:
              '',

            Email:
              'notifications@example.invalid'
          }
        };
      }
    );

  const preserveCounty =
    TARGETS.map(target => {
      const row =
        target.rows.find(
          ([physicalRow]) =>
            physicalRow ===
            target.survivor
        );

      assert.ok(row);

      return {
        sourceRecordId:
          target.id,

        physicalRow:
          target.survivor,

        distressLeadId:
          row[1],

        sourceObservationKey:
          target.key,

        canonicalPropertyKey:
          target.canonical
      };
    });

  const restoreZillow =
    ZILLOW_ROWS.map(
      ([physicalRow, distressLeadId]) => {
        const target =
          TARGETS.find(candidate =>
            candidate.rows.some(
              ([row]) =>
                row === physicalRow
            )
          );

        return {
          sourceRecordId:
            target.id,

          physicalRow,
          distressLeadId
        };
      }
    );

  const clearRows =
    CLEAR_ROWS.map(physicalRow => {
      const target =
        TARGETS.find(candidate =>
          candidate.rows.some(
            ([row]) =>
              row === physicalRow
          )
        );

      const row =
        target.rows.find(
          ([rowNumber]) =>
            rowNumber ===
            physicalRow
        );

      return {
        sourceRecordId:
          target.id,

        physicalRow,

        distressLeadId:
          row[1]
      };
    });

  assert.equal(
    physicalRows.length,
    41
  );

  assert.equal(
    preserveCounty.length,
    8
  );

  assert.equal(
    restoreZillow.length,
    7
  );

  assert.equal(
    clearRows.length,
    26
  );

  return {
    ok: true,
    readOnly: true,
    mode: 'READ_ONLY',

    targetCount: 8,
    targets,

    physicalRowCount: 41,
    physicalRows,

    zillowImportCount: 7,
    zillowImports,

    downstreamReferenceCount: 7,

    downstreamReferences:
      zillowImports.map(
        (entry, index) => ({
          distressLeadId:
            entry.distressLeadId,

          sheet:
            'ZILLOW_GMAIL_IMPORTS',

          rowNumber:
            40 + index,

          columnNumber:
            13
        })
      ),

    physicalPrestateSha256:
      'physical-prestate-authority',

    repairPlanSha256:
      'repair-plan-authority',

    repairPlan: {
      preserveCounty,
      restoreZillow,
      clearRows,

      preserveCountyCount: 8,
      restoreZillowCount: 7,
      clearRowCount: 26
    },

    mutationAuthorityGranted: false,
    repairAuthorityGranted: false,
    repairPlanAuthorityGranted: false,
    insertAuthorityGranted: false,
    deleteAuthorityGranted: false,
    schedulerAuthorityGranted: false,
    checkpointMutationAuthorityGranted: false,
    automaticOfferAuthorityGranted: false
  };
}

function createHarness(options = {}) {
  const rows =
    new Map();

  for (
    let row = 837;
    row <= 918;
    row++
  ) {
    rows.set(
      row,
      blankRow()
    );
  }

  TARGETS.forEach(target => {
    target.rows.forEach(
      ([physicalRow, distressLeadId]) => {
        rows.set(
          physicalRow,
          contaminatedRow(
            target,
            distressLeadId
          )
        );
      }
    );
  });

  const originalCorridor =
    Array.from(
      {
        length:
          918 - 837 + 1
      },
      (_, index) =>
        Array.from(
          rows.get(
            837 + index
          )
        )
    );

  const baselineEvidence =
    makeEvidence(rows);

  let evidenceCallCount = 0;
  let writeCount = 0;

  const distressSheet = {
    getLastRow() {
      return 918;
    },

    getRange(
      row,
      column,
      numRows,
      numColumns
    ) {
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
          return Array.from(
            {
              length:
                numRows
            },
            (_, index) =>
              Array.from(
                rows.get(
                  row + index
                ) ||
                blankRow()
              )
          );
        },

        setValues(values) {
          writeCount++;

          if (
            options.rollbackWriteFailure ===
              true &&
            writeCount === 2
          ) {
            throw new Error(
              'SIMULATED_ROLLBACK_WRITE_FAILURE'
            );
          }

          assert.equal(
            values.length,
            numRows
          );

          values.forEach(
            (valuesRow, index) => {
              assert.equal(
                valuesRow.length,
                HEADERS.length
              );

              rows.set(
                row + index,
                Array.from(
                  valuesRow
                )
              );
            }
          );

          if (
            options.postWriteCorruption ===
              true &&
            writeCount === 1
          ) {
            const corrupted =
              Array.from(
                rows.get(867)
              );

            setField(
              corrupted,
              'Source Observation Key',
              'SIMULATED-POST-WRITE-DRIFT'
            );

            rows.set(
              867,
              corrupted
            );
          }
        }
      };
    }
  };

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
      },

      getUuid() {
        return 'TEST-UUID';
      }
    },

    SpreadsheetApp: {
      flush() {}
    },

    reosCountyProductionSchedulerStatus() {
      return {
        scheduler: {
          triggerCount: 0
        }
      };
    },

    reosCountyProductionSchedulerCheckpoint() {
      return {
        id:
          CHECKPOINT_ID,

        nextFeedIndex: 0,

        currentFeedCursor:
          CHECKPOINT_CURSOR,

        completedFeeds: 0,

        results: []
      };
    },

    REOS: {
      Security: {
        requireAdmin() {}
      },

      DistressLeadCountySchema: {
        requiredHeaders() {
          return Array.from(
            HEADERS
          );
        }
      },

      Database: {
        getHeaders(name) {
          assert.equal(
            name,
            'DISTRESS_LEADS'
          );

          return Array.from(
            HEADERS
          );
        },

        getSheet(name) {
          assert.equal(
            name,
            'DISTRESS_LEADS'
          );

          return distressSheet;
        },

        withScriptLockContext(work) {
          return work({
            capability:
              'TEST'
          });
        }
      },

      CountyPage86DuplicateSourceRepairEvidence: {
        exportEvidence(optionsArg) {
          assert.equal(
            optionsArg.confirmReadOnly,
            true
          );

          evidenceCallCount++;

          const copy =
            structuredClone(
              baselineEvidence
            );

          /*
           * Scenario 1:
           * The independently certified reference/evidence topology changes
           * after pre-lock evidence but before mutation authority.
           */
          if (
            options.referenceDrift ===
              true &&
            evidenceCallCount === 2
          ) {
            copy.downstreamReferences[0]
              .rowNumber = 999;
          }

          return copy;
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

  function corridor() {
    return Array.from(
      {
        length:
          918 - 837 + 1
      },
      (_, index) =>
        Array.from(
          rows.get(
            837 + index
          )
        )
    );
  }

  return {
    execute() {
      return sandbox
        .REOS
        .CountyPage86DuplicateSourceRepair
        .execute({
          confirmRepair: true,
          checkpointId:
            CHECKPOINT_ID,
          checkpointCursor:
            CHECKPOINT_CURSOR
        });
    },

    writeCount() {
      return writeCount;
    },

    corridor,

    originalCorridor
  };
}

console.log(
  '=== PAGE-86 DUPLICATE SOURCE REPAIR DYNAMIC FAILURE-PATH CONTRACT ==='
);

/*
 * Scenario 1:
 * Certified downstream/evidence topology changes between the
 * pre-lock evidence read and the lock-bound evidence read.
 *
 * Mutation authority must be revoked before any write.
 */
{
  const harness =
    createHarness({
      referenceDrift: true
    });

  expectThrow(
    () =>
      harness.execute(),
    /evidence changed before mutation authority/i
  );

  assert.equal(
    harness.writeCount(),
    0,
    'evidence/reference drift must fail before mutation'
  );

  assert.deepEqual(
    harness.corridor(),
    harness.originalCorridor,
    'evidence/reference drift must preserve exact physical prestate'
  );

  pass(
    'evidence/reference drift fails closed before any write'
  );
}

/*
 * Scenario 2:
 * The bounded repair write succeeds but the resulting county
 * source-observation identity is corrupted before reconciliation.
 *
 * The executor must perform one repair write plus one rollback write
 * and restore the exact entire 837-918 prestate.
 */
{
  const harness =
    createHarness({
      postWriteCorruption: true
    });

  expectThrow(
    () =>
      harness.execute(),
    /certified prestate was restored/i
  );

  assert.equal(
    harness.writeCount(),
    2,
    'successful rollback must perform repair write plus rollback write'
  );

  assert.deepEqual(
    harness.corridor(),
    harness.originalCorridor,
    'successful rollback must restore exact 837-918 prestate'
  );

  pass(
    'post-write reconciliation failure restores exact certified prestate'
  );
}

/*
 * Scenario 3:
 * Post-write reconciliation fails and the rollback write itself fails.
 *
 * The result must be explicitly ambiguous and non-retriable.
 */
{
  const harness =
    createHarness({
      postWriteCorruption: true,
      rollbackWriteFailure: true
    });

  const error =
    expectThrow(
      () =>
        harness.execute(),
      /PAGE_86_REPAIR_RESULT_AMBIGUOUS/i
    );

  assert.match(
    String(
      error.message ||
      error
    ),
    /NO_RETRY/i
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
  'PAGE-86 DYNAMIC FAILURE-PATH CERTIFICATION PASSED.'
);
