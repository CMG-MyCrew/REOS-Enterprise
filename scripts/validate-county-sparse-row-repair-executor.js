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

const EXECUTOR =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountySparseRowRepairExecutor.js'
  );

const SCHEMA =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'DistressLeadCountySchema.js'
  );

const source =
  fs.readFileSync(
    EXECUTOR,
    'utf8'
  );

const schemaSource =
  fs.readFileSync(
    SCHEMA,
    'utf8'
  );

const PLAN_SHA =
  'd815afaf9f5c9384186c6cb30be98b07a3f5c43755f8f96c4f97e3f45fd9695c';

const EVIDENCE_SHA =
  '002b925c3c267581ccfbf9e6876ade266f1b3e7e4605b66bc38713a64d08a15c';

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
  '=== COUNTY SPARSE-ROW REPAIR EXECUTOR CONTRACT ==='
);

/*
 * Static authority / mutation containment.
 */
assert.ok(
  source.includes(
    PLAN_SHA
  ),
  'exact repair-plan SHA missing'
);

assert.ok(
  source.includes(
    EVIDENCE_SHA
  ),
  'exact production evidence SHA missing'
);

assert.equal(
  (
    source.match(
      /\.setValues\s*\(/g
    ) || []
  ).length,
  1,
  'executor must contain exactly one physical setValues primitive'
);

assert.equal(
  (
    source.match(
      /withScriptLockContext\s*\(/g
    ) || []
  ).length,
  1,
  'executor must use exactly one fail-fast Database ScriptLock owner'
);

[
  /REOS\.Database\.insert\s*\(/,
  /REOS\.Database\.update\s*\(/,
  /REOS\.Database\.upsert\s*\(/,
  /REOS\.Database\.softDelete\s*\(/,
  /\.appendRow\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.insertRow\s*\(/,
  /\.insertRows\s*\(/,
  /ScriptApp\.newTrigger\s*\(/,
  /CountyRuntimeBridge\.(?:run|sync)\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(source),
    false,
    `forbidden repair surface: ${pattern}`
  );
});

assert.ok(
  source.includes(
    'options.confirmRepair !=='
  ),
  'explicit repair confirmation missing'
);

assert.ok(
  source.includes(
    'options.confirmInPlace !=='
  ),
  'explicit in-place confirmation missing'
);

assert.ok(
  source.includes(
    'options.confirmNoInsertDelete !=='
  ),
  'explicit no-insert/delete confirmation missing'
);

assert.ok(
  source.includes(
    'SPARSE_ROW_REPAIR_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY'
  ),
  'ambiguous-result no-retry disposition missing'
);

assert.ok(
  source.includes(
    'WRITE_START_ROW,\n        1,\n        WRITE_ROW_COUNT,\n        52'
  ),
  'exact 100 x 52 physical write primitive missing'
);

pass(
  'static mutation surface is one bounded physical setValues primitive'
);

pass(
  'executor contains no insert/delete/upsert/scheduler authority'
);

/*
 * Load schema contract to obtain the actual 52 authoritative headers.
 */
const schemaSandbox = {
  REOS: {}
};

vm.createContext(
  schemaSandbox
);

vm.runInContext(
  schemaSource,
  schemaSandbox
);

const headers =
  Array.from(
    schemaSandbox
      .REOS
      .DistressLeadCountySchema
      .requiredHeaders()
  );

assert.equal(
  headers.length,
  52
);

function signedShaBytes(value) {
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

function safeValue(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return value;
  }

  if (
    Object.prototype
      .toString
      .call(value) ===
    '[object Date]'
  ) {
    return value.toISOString();
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(
      safeValue
    );
  }

  if (typeof value === 'object') {
    const copy = {};

    Object.keys(value)
      .sort()
      .forEach(key => {
        copy[key] =
          safeValue(
            value[key]
          );
      });

    return copy;
  }

  return String(value);
}

function stable(value) {
  return JSON.stringify(
    safeValue(value)
  );
}

function hash(value) {
  return crypto
    .createHash('sha256')
    .update(
      stable(value),
      'utf8'
    )
    .digest('hex');
}

function blankRow() {
  return headers.map(
    () => ''
  );
}

function setField(
  row,
  field,
  value
) {
  const index =
    headers.indexOf(field);

  assert.ok(
    index >= 0,
    `header missing: ${field}`
  );

  row[index] =
    value;
}

function getField(
  row,
  field
) {
  return row[
    headers.indexOf(field)
  ];
}

function buildPhysicalRows() {
  const rows = new Map();

  for (
    let physical = 2344;
    physical <= 2445;
    physical++
  ) {
    const row =
      blankRow();

    let sourceId;

    if (physical <= 2443) {
      sourceId =
        String(
          physical - 743
        );
    } else if (
      physical === 2444
    ) {
      sourceId = '1699';
    } else {
      sourceId = '1700';
    }

    let leadId =
      `DL-${physical}`;

    if (physical === 2344) {
      leadId =
        'ZIL-20260829200939-4556';
    }

    if (physical === 2345) {
      leadId =
        'ZIL-20260829200946-0228';
    }

    if (physical === 2444) {
      leadId =
        'DL-20260829211928-1265';
    }

    if (physical === 2445) {
      leadId =
        'DL-20260829211929-6862';
    }

    setField(
      row,
      'Distress Lead ID',
      leadId
    );

    setField(
      row,
      'Created At',
      `2026-08-29T20:00:${String(physical % 60).padStart(2, '0')}.000Z`
    );

    setField(
      row,
      'Address',
      `Old ${sourceId} Main St`
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
      'Connector Run ID',
      'OLD-RUN'
    );

    setField(
      row,
      'Parcel ID',
      `P-${sourceId}`
    );

    setField(
      row,
      'Source Record ID',
      sourceId
    );

    setField(
      row,
      'Source Record Key',
      `pa-philadelphia|code_violations|${sourceId}`
    );

    setField(
      row,
      'Source Observation Key',
      `pa-philadelphia|code_violations|${sourceId}`
    );

    setField(
      row,
      'Canonical Property Key',
      `property|parcel|pa|philadelphia|${sourceId}`
    );

    rows.set(
      physical,
      row
    );
  }

  return rows;
}

function sourceRecords() {
  const records = [];

  for (
    let id = 1601;
    id <= 1700;
    id++
  ) {
    records.push({
      sourceOffset:
        id - 1,

      sourceRecordId:
        String(id),

      sourceObservationKey:
        `pa-philadelphia|code_violations|${id}`,

      canonicalPropertyKey:
        `property|parcel|pa|philadelphia|${id}`,

      normalizedSourceRecord: {
        Address:
          `${id} TEST STREET`,

        City:
          'PHILADELPHIA',

        State:
          'PA',

        Zip:
          '19100',

        County:
          'Philadelphia',

        'Parcel ID':
          `P-${id}`,

        'Owner Name':
          `Owner ${id}`,

        'Co-Owner Name':
          '',

        'Source Record ID':
          String(id),

        'Estimated Value':
          '',

        'Assessment Value':
          '',

        'Year Built':
          '',

        'Land Acres':
          '',

        'Living Area':
          '',

        'Last Sale Date':
          '',

        'Last Sale Price':
          '',

        Source:
          'PA-PHILADELPHIA',

        'Source Dataset':
          'code_violations',

        'Source Updated At':
          '',

        'Distress Type':
          'Code Violation',

        Notes:
          `Generated source ${id}`,

        'Violation Number':
          `V-${id}`,

        'Violation Type':
          'Test Violation',

        'Violation Status':
          'OPEN'
      }
    });
  }

  return records;
}

function createEvidence(
  physicalRows
) {
  const corridor = [];

  for (
    let physical = 2344;
    physical <= 2445;
    physical++
  ) {
    const values =
      physicalRows.get(
        physical
      );

    corridor.push({
      physicalRow:
        physical,

      rowSha256:
        hash({
          physicalRow:
            physical,

          values:
            values.map(
              safeValue
            )
        })
    });
  }

  return {
    ok:
      true,

    mode:
      'READ_ONLY_SPARSE_ROW_REPAIR_EVIDENCE',

    planSha256:
      PLAN_SHA,

    evidenceSha256:
      EVIDENCE_SHA,

    corridor: {
      startRow:
        2344,

      endRow:
        2445,

      rowCount:
        102,

      headerCount:
        52,

      headerSha256:
        hash(headers),

      rows:
        corridor
    },

    source: {
      startOffset:
        1600,

      firstSourceRecordId:
        '1601',

      lastSourceRecordId:
        '1700',

      recordCount:
        100,

      records:
        sourceRecords()
    },

    zillowImports: [
      {
        physicalRow:
          2344,

        distressLeadId:
          'ZIL-20260829200939-4556',

        gmailMessageId:
          '1a04feeb3ebd0995',

        importId:
          'ZGMI-20260829200941-6943',

        survivingCreatedAt:
          getField(
            physicalRows.get(2344),
            'Created At'
          ),

        importRecord: {
          'Property Address':
            '',

          'Contact Name':
            'Victim One'
        },

        projectedOriginalIdentity: {
          source:
            'Zillow Gmail',

          sourceDataset:
            'gmail_leads',

          sourceRecordId:
            'gmail-one',

          sourceRecordKey:
            'zillow gmail|gmail_leads|gmail-one',

          sourceObservationKey:
            'zillow gmail|gmail_leads|gmail-one',

          canonicalPropertyKey:
            '',

          distressType:
            'Listing Inquiry',

          status:
            'New',

          notes:
            'Imported from Gmail label: Zillow/New Leads'
        }
      },
      {
        physicalRow:
          2345,

        distressLeadId:
          'ZIL-20260829200946-0228',

        gmailMessageId:
          '1a04feb4ca06afd3',

        importId:
          'ZGMI-20260829200949-1528',

        survivingCreatedAt:
          getField(
            physicalRows.get(2345),
            'Created At'
          ),

        importRecord: {
          'Property Address':
            '',

          'Contact Name':
            'Victim Two'
        },

        projectedOriginalIdentity: {
          source:
            'Zillow Gmail',

          sourceDataset:
            'gmail_leads',

          sourceRecordId:
            'gmail-two',

          sourceRecordKey:
            'zillow gmail|gmail_leads|gmail-two',

          sourceObservationKey:
            'zillow gmail|gmail_leads|gmail-two',

          canonicalPropertyKey:
            '',

          distressType:
            'Listing Inquiry',

          status:
            'New',

          notes:
            'Imported from Gmail label: Zillow/New Leads'
        }
      }
    ],

    countyRunLineage: [
      {
        runId:
          'CCR-20260829205348-7954'
      },
      {
        runId:
          'CCR-20260829211815-0144'
      },
      {
        runId:
          'CCR-20260829212018-6844'
      }
    ],

    mutationAuthorityGranted:
      false,

    repairAuthorityGranted:
      false,

    insertAuthorityGranted:
      false,

    deleteAuthorityGranted:
      false,

    schedulerAuthorityGranted:
      false,

    automaticOfferAuthorityGranted:
      false
  };
}

function createHarness(
  options = {}
) {
  const physicalRows =
    buildPhysicalRows();

  const evidence =
    createEvidence(
      physicalRows
    );

  if (
    options.badEvidence
  ) {
    evidence.evidenceSha256 =
      'f'.repeat(64);
  }

  if (
    options.prestateDrift
  ) {
    setField(
      physicalRows.get(2346),
      'Address',
      'DRIFTED ADDRESS'
    );
  }

  const state = {
    adminCalls:
      0,

    evidenceCalls:
      0,

    lockCalls:
      0,

    setValuesCalls:
      0,

    writes:
      [],

    flushCalls:
      0
  };

  const triggerHandlers =
    options.triggerHandlers ||
    [
      'reosProductionOperationsHeartbeat'
    ];

  function blankAtPhysical() {
    return blankRow();
  }

  const sheet = {
    getLastRow() {
      return 2445;
    },

    getRange(
      start,
      column,
      rowCount,
      columnCount
    ) {
      assert.equal(
        column,
        1
      );

      assert.equal(
        columnCount,
        52
      );

      return {
        getValues() {
          const result = [];

          for (
            let i = 0;
            i < rowCount;
            i++
          ) {
            const physical =
              start + i;

            result.push(
              (
                physicalRows.get(
                  physical
                ) ||
                blankAtPhysical()
              ).slice()
            );
          }

          return result;
        },

        setValues(values) {
          state.setValuesCalls +=
            1;

          state.writes.push({
            start,
            rowCount,
            columnCount
          });

          assert.equal(
            start,
            2344
          );

          assert.equal(
            rowCount,
            100
          );

          assert.equal(
            values.length,
            100
          );

          values.forEach(
            (row, index) => {
              assert.equal(
                row.length,
                52
              );

              physicalRows.set(
                start + index,
                row.slice()
              );
            }
          );

          if (
            options.corruptAfterWrite &&
            state.setValuesCalls ===
              1
          ) {
            setField(
              physicalRows.get(2346),
              'Source Record ID',
              '999999'
            );
          }

          return this;
        }
      };
    }
  };

  const sandbox = {
    REOS: {
      Security: {
        requireAdmin() {
          state.adminCalls +=
            1;
        }
      },

      DistressLeadCountySchema: {
        requiredHeaders() {
          return headers.slice();
        }
      },

      Database: {
        getSheet() {
          return sheet;
        },

        getHeaders() {
          return headers.slice();
        },

        withScriptLockContext(work) {
          state.lockCalls +=
            1;

          const result =
            work({
              capability:
                'HARNESS'
            });

          if (
            options.lockFinalizationError
          ) {
            throw new Error(
              'simulated outer lock finalization failure'
            );
          }

          return result;
        }
      },

      CountySparseRowRepairEvidence: {
        exportEvidence() {
          state.evidenceCalls +=
            1;

          return evidence;
        }
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return triggerHandlers
          .map(
            (handler, index) => ({
              getHandlerFunction() {
                return handler;
              },

              getEventType() {
                return 'CLOCK';
              },

              getTriggerSource() {
                return 'CLOCK';
              },

              getUniqueId() {
                return `T-${index}`;
              }
            })
          );
      }
    },

    SpreadsheetApp: {
      flush() {
        state.flushCalls +=
          1;
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

        return signedShaBytes(
          value
        );
      },

      getUuid() {
        return '00000000-0000-0000-0000-000000000001';
      }
    },

    Date,
    JSON,
    Object,
    String,
    Number,
    Array,
    Math,
    isFinite,
    isNaN,
    console
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox
  );

  return {
    sandbox,
    state,
    physicalRows,
    evidence
  };
}

function execute(
  harness,
  overrides = {}
) {
  return harness
    .sandbox
    .reosCountySparseRowRepairExecute(
      Object.assign(
        {
          confirmRepair:
            true,

          confirmInPlace:
            true,

          confirmNoInsertDelete:
            true,

          planSha256:
            PLAN_SHA,

          evidenceSha256:
            EVIDENCE_SHA
        },
        overrides
      )
    );
}

/*
 * Confirmation gates.
 */
{
  const h =
    createHarness();

  expectThrow(
    () =>
      execute(
        h,
        {
          confirmRepair:
            false
        }
      ),
    /confirmRepair=true/
  );

  assert.equal(
    h.state.setValuesCalls,
    0
  );

  pass(
    'missing explicit confirmation fails before mutation'
  );
}

/*
 * Unexpected trigger quiescence.
 */
{
  const h =
    createHarness({
      triggerHandlers: [
        'reosProductionOperationsHeartbeat',
        'reosZillowGmailScheduledSync'
      ]
    });

  expectThrow(
    () =>
      execute(h),
    /mutating installable triggers frozen/
  );

  assert.equal(
    h.state.evidenceCalls,
    0
  );

  assert.equal(
    h.state.lockCalls,
    0
  );

  assert.equal(
    h.state.setValuesCalls,
    0
  );

  pass(
    'unexpected installable trigger fails before evidence/lock/mutation'
  );
}

/*
 * Production evidence drift.
 */
{
  const h =
    createHarness({
      badEvidence:
        true
    });

  expectThrow(
    () =>
      execute(h),
    /production evidence no longer matches authority/
  );

  assert.equal(
    h.state.lockCalls,
    0
  );

  assert.equal(
    h.state.setValuesCalls,
    0
  );

  pass(
    'production evidence SHA drift fails before ScriptLock and mutation'
  );
}

/*
 * Physical prestate race/drift under lock.
 */
{
  const h =
    createHarness({
      prestateDrift:
        true
    });

  expectThrow(
    () =>
      execute(h),
    /prestate drifted at physical row 2346/
  );

  assert.equal(
    h.state.lockCalls,
    1
  );

  assert.equal(
    h.state.setValuesCalls,
    0
  );

  pass(
    'lock-bound physical fingerprint drift fails before write'
  );
}

/*
 * Successful repair.
 */
{
  const h =
    createHarness();

  const result =
    execute(h);

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.mode,
    'CERTIFIED_SPARSE_ROW_REPAIR_EXECUTED'
  );

  assert.equal(
    result.repairedRowCount,
    100
  );

  assert.equal(
    result.zillowRowsRestored,
    2
  );

  assert.equal(
    result.countyRowsRestored,
    98
  );

  assert.equal(
    result.protectedTailRows,
    2
  );

  assert.equal(
    result.sourceObservationCount,
    100
  );

  assert.equal(
    result.productionDataMutationExecuted,
    true
  );

  assert.equal(
    result.repairAuthorityConsumed,
    true
  );

  assert.equal(
    result.repairAuthorityGranted,
    false
  );

  assert.equal(
    result.schedulerAuthorityGranted,
    false
  );

  assert.equal(
    result.automaticOfferAuthorityGranted,
    false
  );

  assert.equal(
    h.state.setValuesCalls,
    1
  );

  assert.deepEqual(
    h.state.writes[0],
    {
      start:
        2344,

      rowCount:
        100,

      columnCount:
        52
    }
  );

  assert.equal(
    getField(
      h.physicalRows.get(2344),
      'Source'
    ),
    'Zillow Gmail'
  );

  assert.equal(
    getField(
      h.physicalRows.get(2345),
      'Source Dataset'
    ),
    'gmail_leads'
  );

  assert.equal(
    getField(
      h.physicalRows.get(2346),
      'Source Record ID'
    ),
    '1601'
  );

  assert.equal(
    getField(
      h.physicalRows.get(2443),
      'Source Record ID'
    ),
    '1698'
  );

  assert.equal(
    getField(
      h.physicalRows.get(2444),
      'Source Record ID'
    ),
    '1699'
  );

  assert.equal(
    getField(
      h.physicalRows.get(2445),
      'Source Record ID'
    ),
    '1700'
  );

  pass(
    'successful repair performs exactly one 100-row in-place write'
  );

  pass(
    'successful repair restores Zillow + county identities and preserves tail'
  );

  pass(
    'successful repair leaves scheduler and automatic offer authority false'
  );
}

/*
 * Post-write reconciliation failure must rollback to certified prestate.
 */
{
  const h =
    createHarness({
      corruptAfterWrite:
        true
    });

  expectThrow(
    () =>
      execute(h),
    /certified prestate was restored/
  );

  assert.equal(
    h.state.setValuesCalls,
    2
  );

  assert.equal(
    getField(
      h.physicalRows.get(2346),
      'Source Record ID'
    ),
    '1603'
  );

  pass(
    'post-write reconciliation failure rolls back exact certified prestate'
  );
}

/*
 * Outer lock finalization after verified write is ambiguous and never retried.
 */
{
  const h =
    createHarness({
      lockFinalizationError:
        true
    });

  expectThrow(
    () =>
      execute(h),
    /AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY/
  );

  assert.equal(
    h.state.setValuesCalls,
    1
  );

  pass(
    'post-verification outer lock failure is fail-closed ambiguous/no-retry'
  );
}

console.log();
console.log(
  'County sparse-row repair executor validation PASSED.'
);
