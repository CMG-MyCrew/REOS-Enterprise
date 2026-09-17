#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const path =
  require('node:path');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const CONTRACT_FILE =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationContract.js'
  );

const EXECUTOR_FILE =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js'
  );

const contractSource =
  fs.readFileSync(
    CONTRACT_FILE,
    'utf8'
  );

const executorSource =
  fs.readFileSync(
    EXECUTOR_FILE,
    'utf8'
  );

const WRITER_ID =
  'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION';

const CHECKPOINT_ID =
  'COUNTY-20260902222607805';

const CHECKPOINT_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const DISTRESS_HEADERS = [
  'Distress Lead ID',
  'Address',
  'City',
  'State',
  'Zip',
  'Owner Name',
  'Owner Mailing Address',
  'Distress Type',
  'Distress Score',
  'Estimated Value',
  'Estimated Repairs',
  'Suggested Offer',
  'Lead Source',
  'Status',
  'Notes',
  'Imported Deal ID',
  'Created At',
  'Updated At',
  'County',
  'Source',
  'Source Dataset',
  'Connector Run ID',
  'Parcel ID',
  'Source Record ID',
  'Source Record Key',
  'Last Seen At',
  'Source Updated At',
  'Co-Owner Name',
  'Estimated Debt',
  'Assessment Value',
  'Year Built',
  'Land Acres',
  'Living Area',
  'Last Sale Date',
  'Last Sale Price',
  'Tax Delinquent Amount',
  'Tax Principal',
  'Tax Interest',
  'Tax Penalty',
  'Violation Amount',
  'Violation Number',
  'Violation Type',
  'Violation Status',
  'Vacancy Status',
  'Vacancy Rank',
  'Sheriff Auction ID',
  'Book/Writ',
  'Sale Type',
  'Sale Status',
  'Sale Date',
  'Source Observation Key',
  'Canonical Property Key'
];

const IMPORT_HEADERS = [
  'Gmail Message ID',
  'Source Label',
  'External Lead ID',
  'Property URL',
  'Property Address',
  'Contact Name',
  'Phone',
  'Email',
  'Lead Type',
  'Imported At',
  'Subject',
  'From',
  'Distress Lead ID'
];

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function blankRow(headers) {
  return headers.map(
    () => ''
  );
}

function setField(
  headers,
  row,
  field,
  value
) {
  const index =
    headers.indexOf(field);

  assert.ok(
    index >= 0,
    'Fixture header missing: ' +
      field
  );

  row[index] =
    value;
}

function getField(
  headers,
  row,
  field
) {
  const index =
    headers.indexOf(field);

  assert.ok(
    index >= 0,
    'Fixture header missing: ' +
      field
  );

  return row[index];
}

function canonicalToRaw(value) {
  if (value.type === 'blank') {
    return '';
  }

  if (value.type === 'string') {
    return value.value;
  }

  if (value.type === 'number') {
    return Number(value.value);
  }

  if (value.type === 'boolean') {
    return value.value;
  }

  if (value.type === 'date') {
    return new Date(value.value);
  }

  throw new Error(
    'Unsupported canonical fixture value.'
  );
}

function makeSheet(
  name,
  id,
  headers,
  rows,
  lastRow,
  maxRows
) {
  const state = {
    name,
    id,
    headers,
    rows,
    formulas: {},
    lastRow,
    lastColumn:
      headers.length,
    maxRows,
    maxColumns:
      headers.length
  };

  function rowValues(
    row,
    column,
    width
  ) {
    if (row === 1) {
      return state.headers
        .slice(
          column - 1,
          column - 1 + width
        );
    }

    const source =
      state.rows[row] ||
      blankRow(state.headers);

    return source.slice(
      column - 1,
      column - 1 + width
    );
  }

  function rowFormulas(
    row,
    column,
    width
  ) {
    const source =
      state.formulas[row] ||
      blankRow(state.headers);

    return source.slice(
      column - 1,
      column - 1 + width
    );
  }

  return {
    state,

    api: {
      getName() {
        return state.name;
      },

      getSheetId() {
        return state.id;
      },

      getLastRow() {
        return state.lastRow;
      },

      getLastColumn() {
        return state.lastColumn;
      },

      getMaxRows() {
        return state.maxRows;
      },

      getMaxColumns() {
        return state.maxColumns;
      },

      getRange(
        row,
        column,
        numRows,
        numColumns
      ) {
        assert.equal(
          numRows,
          1,
          'Fixture supports exact one-row evidence ranges.'
        );

        return {
          getValues() {
            return [
              rowValues(
                row,
                column,
                numColumns
              )
            ];
          },

          getFormulas() {
            return [
              rowFormulas(
                row,
                column,
                numColumns
              )
            ];
          }
        };
      }
    }
  };
}

function createHarness(
  options = {}
) {
  const state = {
    adminCalls:
      0,

    writerCalls:
      0,

    lockAssertions:
      0,

    replacementCalls:
      0,

    lockCallbacks:
      0,

    managedTriggers:
      options.managedTriggers || 0,

    checkpoint:
      {
        id:
          CHECKPOINT_ID,
        nextFeedIndex:
          0,
        currentFeedCursor:
          CHECKPOINT_CURSOR,
        completedFeeds:
          0,
        totalFeeds:
          4,
        results:
          []
      }
  };

  const sandbox = {
    REOS: {},
    console
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    contractSource,
    sandbox,
    {
      filename:
        CONTRACT_FILE
    }
  );

  const contract =
    JSON.parse(
      JSON.stringify(
        sandbox.REOS
          .CountyCodeViolationGroup3ZillowRestorationContract
          .contract()
      )
    );

  const survivor =
    blankRow(
      DISTRESS_HEADERS
    );

  setField(
    DISTRESS_HEADERS,
    survivor,
    'Distress Lead ID',
    contract.countySurvivor
      .distressLeadId
  );

  setField(
    DISTRESS_HEADERS,
    survivor,
    'Created At',
    '2026-08-20T18:16:47.000Z'
  );

  setField(
    DISTRESS_HEADERS,
    survivor,
    'Source',
    'PA-PHILADELPHIA'
  );

  setField(
    DISTRESS_HEADERS,
    survivor,
    'Source Dataset',
    'code_violations'
  );

  setField(
    DISTRESS_HEADERS,
    survivor,
    'Violation Number',
    contract.violationNumber
  );

  const target =
    blankRow(
      DISTRESS_HEADERS
    );

  setField(
    DISTRESS_HEADERS,
    target,
    'Distress Lead ID',
    contract.zillowRestoration
      .distressLeadId
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Created At',
    '2026-08-20T19:39:20.000Z'
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Updated At',
    '2026-09-02T22:26:07.805Z'
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Address',
    'COUNTY OVERWRITE'
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Source',
    'PA-PHILADELPHIA'
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Source Dataset',
    'code_violations'
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Violation Number',
    contract.violationNumber
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Tax Principal',
    795.45
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Tax Interest',
    76.83
  );

  setField(
    DISTRESS_HEADERS,
    target,
    'Tax Penalty',
    51.63
  );

  const importRow =
    blankRow(
      IMPORT_HEADERS
    );

  const projection =
    contract.zillowRestoration
      .projection;

  setField(
    IMPORT_HEADERS,
    importRow,
    'Gmail Message ID',
    contract.zillowRestoration
      .sourceRecordId
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Source Label',
    'Zillow/New Leads'
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'External Lead ID',
    projection[
      'External Lead ID'
    ]
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Property URL',
    projection[
      'Source URL'
    ]
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Property Address',
    projection.Address
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Contact Name',
    projection[
      'Owner Name'
    ]
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Phone',
    projection.Phone
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Email',
    projection.Email
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Lead Type',
    projection[
      'Lead Type'
    ]
  );

  setField(
    IMPORT_HEADERS,
    importRow,
    'Distress Lead ID',
    contract.zillowRestoration
      .distressLeadId
  );

  const distress =
    makeSheet(
      'DISTRESS_LEADS',
      1001,
      DISTRESS_HEADERS,
      {
        767:
          survivor,
        771:
          target
      },
      800,
      1000
    );

  const imports =
    makeSheet(
      'ZILLOW_GMAIL_IMPORTS',
      1002,
      IMPORT_HEADERS,
      {
        38:
          importRow
      },
      38,
      100
    );

  if (options.formulaMutationCase) {
    const formulas =
      blankRow(
        DISTRESS_HEADERS
      );

    setField(
      DISTRESS_HEADERS,
      formulas,
      'Source',
      '=A1'
    );

    distress.state.formulas[771] =
      formulas;
  }

  if (options.projectionDrift) {
    setField(
      IMPORT_HEADERS,
      imports.state.rows[38],
      'Email',
      'drift@example.com'
    );
  }

  sandbox.SpreadsheetApp = {
    getActiveSpreadsheet() {
      return {
        getId() {
          return 'SPREADSHEET-1';
        }
      };
    }
  };

  sandbox.reosCountyProductionSchedulerStatus =
    function () {
      return {
        scheduler: {
          triggerCount:
            state.managedTriggers
        }
      };
    };

  sandbox.reosCountyProductionSchedulerCheckpoint =
    function () {
      return clone(
        state.checkpoint
      );
    };

  if (options.checkpointDrift) {
    state.checkpoint.currentFeedCursor =
      'DRIFT';
  }

  sandbox.REOS.Security = {
    requireAdmin() {
      state.adminCalls++;

      if (options.adminDenied) {
        throw new Error(
          'ADMIN_DENIED'
        );
      }

      return true;
    }
  };

  sandbox.REOS.DistressLeadCountySchema = {
    requiredHeaders() {
      return DISTRESS_HEADERS.slice();
    }
  };

  sandbox.REOS.CountyMutationExclusionLease = {
    assertWriterAllowed(request) {
      state.writerCalls++;

      assert.deepEqual(
        JSON.parse(
          JSON.stringify(request)
        ),
        {
          writerId:
            WRITER_ID
        }
      );

      if (options.writerDenied) {
        throw new Error(
          'WRITER_DENIED'
        );
      }

      return {
        allowed:
          true,
        leaseGrantsMutationAuthority:
          false
      };
    }
  };

  const lockContext = {
    kind:
      'TEST_LOCK_CONTEXT'
  };

  sandbox.REOS.Database = {
    getHeaders(name) {
      assert.equal(
        name,
        'DISTRESS_LEADS'
      );

      return DISTRESS_HEADERS.slice();
    },

    getSheet(name) {
      if (name === 'DISTRESS_LEADS') {
        return distress.api;
      }

      if (name === 'ZILLOW_GMAIL_IMPORTS') {
        return imports.api;
      }

      throw new Error(
        'UNKNOWN_SHEET'
      );
    },

    withScriptLockContext(work) {
      state.lockCallbacks++;

      if (options.lockContended) {
        throw new Error(
          'Database ScriptLock is contended'
        );
      }

      if (options.driftUnderLock) {
        setField(
          IMPORT_HEADERS,
          imports.state.rows[38],
          'Subject',
          'UNDER-LOCK-DRIFT'
        );
      }

      const value =
        work(
          lockContext
        );

      if (
        options.finalFlushFailure
      ) {
        throw new Error(
          'FINAL_FLUSH_FAILURE'
        );
      }

      return value;
    },

    assertScriptLockContext(
      context
    ) {
      state.lockAssertions++;

      assert.equal(
        context,
        lockContext
      );

      return true;
    },

    replacePhysicalRowExact(
      sheetName,
      request,
      replaceOptions
    ) {
      state.replacementCalls++;

      assert.equal(
        sheetName,
        'DISTRESS_LEADS'
      );

      assert.equal(
        replaceOptions.lockContext,
        lockContext
      );

      assert.equal(
        request.spreadsheetId,
        'SPREADSHEET-1'
      );

      assert.equal(
        request.sheetId,
        1001
      );

      assert.equal(
        request.expectedRowNumber,
        771
      );

      assert.equal(
        request.idField,
        'Distress Lead ID'
      );

      assert.equal(
        request.idValue,
        contract.zillowRestoration
          .distressLeadId
      );

      assert.deepEqual(
        request.expectedHeaders,
        DISTRESS_HEADERS
      );

      assert.deepEqual(
        request.expectedRowFormulas,
        request.expectedPostRowFormulas
      );

      if (options.primitivePreconditionFailure) {
        const error =
          new Error(
            'PRECONDITION'
          );

        error.classification =
          'PHYSICAL_REPLACE_PRECONDITION_FAILED';

        throw error;
      }

      if (options.primitiveUncertainFailure) {
        const error =
          new Error(
            'UNCERTAIN'
          );

        error.classification =
          'PHYSICAL_REPLACE_OUTCOME_UNCERTAIN';

        throw error;
      }

      distress.state.rows[771] =
        request.expectedPostRowValues
          .map(
            canonicalToRaw
          );

      return {
        classification:
          options.badPrimitiveResult
            ? 'UNKNOWN'
            : 'PHYSICAL_REPLACE_VERIFIED'
      };
    }
  };

  vm.runInContext(
    executorSource,
    sandbox,
    {
      filename:
        EXECUTOR_FILE
    }
  );

  return {
    api:
      sandbox.REOS
        .CountyCodeViolationGroup3ZillowRestorationExecutor,

    state,
    contract,
    distress,
    imports
  };
}

function invoke(harness) {
  return harness.api.execute({
    confirmRestoration:
      true,

    checkpointId:
      CHECKPOINT_ID,

    checkpointCursor:
      CHECKPOINT_CURSOR
  });
}

function expectClassification(
  options,
  classification
) {
  const harness =
    createHarness(
      options
    );

  assert.throws(
    () => invoke(harness),
    error => {
      assert.equal(
        error.classification,
        classification
      );

      return true;
    }
  );

  return harness;
}

console.log(
  '=== GROUP 3 ZILLOW RESTORATION EXECUTOR V1 ==='
);

/*
 * Static mutation boundary.
 */
assert.equal(
  (
    executorSource.match(
      /REOS\.Database\s*\.replacePhysicalRowExact\s*\(/g
    ) || []
  ).length,
  1,
  'Executor must invoke exact replacement primitive exactly once.'
);

assert.equal(
  (
    executorSource.match(
      /REOS\.CountyMutationExclusionLease\s*\.assertWriterAllowed/g
    ) || []
  ).length,
  1,
  'Executor must assert exact protected writer once.'
);

assert.equal(
  (
    executorSource.match(
      /\.withScriptLockContext\s*\(/g
    ) || []
  ).length,
  1,
  'Executor must own exactly one outer Database ScriptLock context.'
);

[
  '.setValue(',
  '.setValues(',
  '.deleteRow(',
  '.deleteRows(',
  '.appendRow(',
  '.clearContent(',
  'patchPhysicalRowCellsExact(',
  'deletePhysicalRowExact('
].forEach(token => {
  assert.equal(
    executorSource.includes(token),
    false,
    'Executor must not contain direct/broader mutation primitive: ' +
      token
  );
});

assert.equal(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(
    executorSource
  ),
  false,
  'Executor implementation must expose no public reos* RPC.'
);

assert.match(
  executorSource,
  /writerId:\s*['"]CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION['"]/,
  'Executor must provide literal Writer 13 identity to exclusion lease.'
);

let caseCount = 0;

function pass(name) {
  caseCount++;
  console.log(
    'PASS ' +
    String(caseCount)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

/*
 * 1. Success.
 */
{
  const h =
    createHarness();

  const survivorBefore =
    clone(
      h.distress.state.rows[767]
    );

  const importBefore =
    clone(
      h.imports.state.rows[38]
    );

  const createdBefore =
    getField(
      DISTRESS_HEADERS,
      h.distress.state.rows[771],
      'Created At'
    );

  const result =
    invoke(h);

  assert.equal(
    result.classification,
    'GROUP3_RESTORATION_VERIFIED'
  );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.writerId,
    WRITER_ID
  );

  assert.equal(
    result.physicalRow,
    771
  );

  assert.equal(
    result.downstreamReferencePreserved,
    true
  );

  assert.equal(
    result.referenceRewritePerformed,
    false
  );

  assert.equal(
    result.physicalDeletePerformed,
    false
  );

  assert.equal(
    h.state.replacementCalls,
    1
  );

  assert.equal(
    h.state.writerCalls,
    1
  );

  assert.deepEqual(
    h.distress.state.rows[767],
    survivorBefore
  );

  assert.deepEqual(
    h.imports.state.rows[38],
    importBefore
  );

  assert.equal(
    getField(
      DISTRESS_HEADERS,
      h.distress.state.rows[771],
      'Distress Lead ID'
    ),
    h.contract.zillowRestoration
      .distressLeadId
  );

  assert.equal(
    getField(
      DISTRESS_HEADERS,
      h.distress.state.rows[771],
      'Created At'
    ),
    createdBefore
  );

  assert.equal(
    getField(
      DISTRESS_HEADERS,
      h.distress.state.rows[771],
      'Source'
    ),
    'Zillow Gmail'
  );

  assert.equal(
    getField(
      DISTRESS_HEADERS,
      h.distress.state.rows[771],
      'Source Dataset'
    ),
    'gmail_leads'
  );

  assert.equal(
    getField(
      DISTRESS_HEADERS,
      h.distress.state.rows[771],
      'Violation Number'
    ),
    ''
  );

  [
    'executionAuthorityGranted',
    'repairAuthorityGranted',
    'referenceRewriteAuthorityGranted',
    'physicalDeleteAuthorityGranted',
    'schedulerMutationAuthorityGranted',
    'checkpointMutationAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(flag => {
    assert.equal(
      result[flag],
      false
    );
  });

  pass(
    'exact row 771 Zillow restoration succeeds while row 767 and import/reference remain unchanged'
  );
}

/*
 * 2. Admin denied.
 */
{
  const h =
    expectClassification(
      {
        adminDenied:
          true
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    0
  );

  pass(
    'Admin denial is definite no-write'
  );
}

/*
 * 3. Scheduler not frozen.
 */
{
  const h =
    expectClassification(
      {
        managedTriggers:
          1
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    0
  );

  pass(
    'managed scheduler trigger blocks before write'
  );
}

/*
 * 4. Frozen checkpoint drift.
 */
{
  const h =
    expectClassification(
      {
        checkpointDrift:
          true
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    0
  );

  pass(
    'checkpoint drift blocks before write'
  );
}

/*
 * 5. Fresh Zillow provenance no longer matches contract.
 */
{
  const h =
    expectClassification(
      {
        projectionDrift:
          true
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    0
  );

  pass(
    'fresh Zillow provenance drift blocks before write'
  );
}

/*
 * 6. Pre-lock and under-lock evidence mismatch.
 */
{
  const h =
    expectClassification(
      {
        driftUnderLock:
          true
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    0
  );

  pass(
    'pre-lock/under-lock evidence mismatch blocks before write'
  );
}

/*
 * 7. Protected writer exclusion denies.
 */
{
  const h =
    expectClassification(
      {
        writerDenied:
          true
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    0
  );

  assert.equal(
    h.state.writerCalls,
    1
  );

  pass(
    'writer exclusion denial blocks before replacement invocation'
  );
}

/*
 * 8. Formula mutation would be required.
 */
{
  const h =
    expectClassification(
      {
        formulaMutationCase:
          true
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    0
  );

  pass(
    'formula-bearing field that would need mutation blocks before write'
  );
}

/*
 * 9. Primitive definite precondition failure remains no-write.
 */
{
  const h =
    expectClassification(
      {
        primitivePreconditionFailure:
          true
      },
      'GROUP3_RESTORATION_PRECONDITION_FAILED'
    );

  assert.equal(
    h.state.replacementCalls,
    1
  );

  pass(
    'certified primitive precondition failure retains definite no-write classification'
  );
}

/*
 * 10. Primitive uncertain failure remains uncertain.
 */
{
  const h =
    expectClassification(
      {
        primitiveUncertainFailure:
          true
      },
      'GROUP3_RESTORATION_OUTCOME_UNCERTAIN'
    );

  assert.equal(
    h.state.replacementCalls,
    1
  );

  pass(
    'primitive post-first-write uncertainty propagates as Group 3 uncertainty'
  );
}

/*
 * 11. Missing verified primitive result is uncertain.
 */
{
  const h =
    expectClassification(
      {
        badPrimitiveResult:
          true
      },
      'GROUP3_RESTORATION_OUTCOME_UNCERTAIN'
    );

  assert.equal(
    h.state.replacementCalls,
    1
  );

  pass(
    'non-verified primitive result is uncertain'
  );
}

/*
 * 12. Outer lock-finalization failure after verified replacement is uncertain.
 */
{
  const h =
    expectClassification(
      {
        finalFlushFailure:
          true
      },
      'GROUP3_RESTORATION_OUTCOME_UNCERTAIN'
    );

  assert.equal(
    h.state.replacementCalls,
    1
  );

  pass(
    'outer lock finalization failure after verified replacement is uncertain'
  );
}

assert.equal(
  caseCount,
  12
);

console.log(
  'GROUP3_EXECUTOR_BEHAVIOR_CASES=' +
  caseCount
);

console.log(
  'GROUP3_EXECUTOR_EXACT_REPLACE_CALL_COUNT=1'
);

console.log(
  'GROUP3_EXECUTOR_WRITER_ASSERTION_COUNT=1'
);

console.log(
  'GROUP3_EXECUTOR_OUTER_SCRIPTLOCK_COUNT=1'
);

console.log(
  'GROUP3_EXECUTOR_PUBLIC_RPC_PRESENT=false'
);

console.log(
  'GROUP3_REFERENCE_REWRITE_PERFORMED=false'
);

console.log(
  'GROUP3_PHYSICAL_DELETE_PERFORMED=false'
);

console.log(
  'GROUP3_SCHEDULER_MUTATION_PERFORMED=false'
);

console.log(
  'GROUP3_CHECKPOINT_MUTATION_PERFORMED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);

console.log(
  'GROUP3_ZILLOW_RESTORATION_EXECUTOR_VALIDATION_PASSED=true'
);
