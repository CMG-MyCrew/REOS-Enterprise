'use strict';

const assert =
  require('assert');

const fs =
  require('fs');

const path =
  require('path');

const vm =
  require('vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const MODULE =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGroup3PostRestorationEvidence.js'
  );

const CONTRACT =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationContract.js'
  );

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

const contractSource =
  fs.readFileSync(
    CONTRACT,
    'utf8'
  );

/*
 * Supplemental lexical containment checks.
 * Behavioral harnesses below remain authoritative.
 */
[
  /\.\s*(?:setValue|setValues|setFormula|setFormulas|appendRow|deleteRow|deleteRows|insertRow|insertRows|clear|clearContent|clearContents)\s*\(/,
  /Database\s*\.\s*(?:insert|update|upsert|softDelete|delete|remove|ensureTable|replacePhysicalRowExact|patchPhysicalRowCellsExact)\s*\(/,
  /ScriptApp\s*\.\s*(?:newTrigger|deleteTrigger)\s*\(/,
  /\.\s*(?:setProperty|setProperties|deleteProperty|deleteAllProperties)\s*\(/
].forEach(pattern => {
  assert.strictEqual(
    pattern.test(source),
    false,
    'Forbidden mutation surface: ' +
      pattern
  );
});

assert.strictEqual(
  (
    source.match(
      /function\s+reosCountyCodeViolationGroup3PostRestorationEvidence\s*\(/g
    ) || []
  ).length,
  1,
  'Exactly one public evidence RPC is required.'
);

const COUNTY_ID =
  'DL-20260820181647-4170';

const ZILLOW_ID =
  'ZIL-20260820193920-1756';

const MESSAGE_ID =
  '1a02188c24fd2e2c';

const CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

function copy(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function buildFixture() {
  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Date,
    Math
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    contractSource,
    context,
    {
      filename:
        'CountyCodeViolationGroup3ZillowRestorationContract.js'
    }
  );

  const contract =
    copy(
      context.REOS
        .CountyCodeViolationGroup3ZillowRestorationContract
        .contract()
    );

  const headerSet =
    new Set([
      'Distress Lead ID',
      'Created At',
      'Source',
      'Source Dataset',
      'Source Record ID',
      'Source Record Key',
      'Source Observation Key',
      'Violation Number',
      'Violation Type',
      'Violation Status',
      'Violation Amount',
      'Canonical Property Key',
      'Status'
    ]);

  Object.keys(
    contract
      .zillowRestoration
      .projection
  ).forEach(
    field =>
      headerSet.add(field)
  );

  contract
    .zillowRestoration
    .clearCountyFields
    .forEach(
      field =>
        headerSet.add(field)
    );

  const distressHeaders =
    Array.from(headerSet);

  function blankRow() {
    const row = {};

    distressHeaders
      .forEach(header => {
        row[header] = '';
      });

    return row;
  }

  const county =
    blankRow();

  county._rowNumber =
    767;

  county['Distress Lead ID'] =
    COUNTY_ID;

  county['Created At'] =
    '2026-08-20T18:16:47.000Z';

  county.Source =
    'PA-PHILADELPHIA';

  county['Source Dataset'] =
    'code_violations';

  county['Source Record ID'] =
    '28';

  county['Violation Number'] =
    'VI-2026-045359';

  const zillow =
    blankRow();

  zillow._rowNumber =
    771;

  zillow['Distress Lead ID'] =
    ZILLOW_ID;

  zillow['Created At'] =
    '2026-08-20T19:39:20.000Z';

  Object.keys(
    contract
      .zillowRestoration
      .projection
  ).forEach(field => {
    if (
      distressHeaders.includes(
        field
      )
    ) {
      zillow[field] =
        contract
          .zillowRestoration
          .projection[field];
    }
  });

  const importHeaders = [
    'Import ID',
    'Gmail Message ID',
    'Gmail Thread ID',
    'Source Label',
    'External Lead ID',
    'Natural Key',
    'Contact Name',
    'Email',
    'Phone',
    'Property Address',
    'Property URL',
    'Lead Type',
    'Distress Lead ID'
  ];

  const importRow = {
    _rowNumber:
      38,

    'Gmail Message ID':
      MESSAGE_ID,

    'Distress Lead ID':
      ZILLOW_ID
  };

  const checkpoint = {
    id:
      'COUNTY-20260902222607805',

    nextFeedIndex:
      0,

    currentFeedCursor:
      CURSOR,

    completedFeeds:
      0,

    totalFeeds:
      4,

    results:
      []
  };

  let triggers = [];

  let distressRows = [
    county,
    zillow
  ];

  let importRows = [
    importRow
  ];

  let adminCalls = 0;
  let distressReads = 0;
  let importReads = 0;

  context.REOS.Security = {
    requireAdmin() {
      adminCalls++;
      return true;
    }
  };

  context.REOS.Database = {
    getHeaders(table) {
      if (
        table ===
        'DISTRESS_LEADS'
      ) {
        return distressHeaders.slice();
      }

      if (
        table ===
        'ZILLOW_GMAIL_IMPORTS'
      ) {
        return importHeaders.slice();
      }

      throw new Error(
        'Unexpected table: ' +
        table
      );
    },

    getAll(table) {
      if (
        table ===
        'DISTRESS_LEADS'
      ) {
        distressReads++;
        return copy(
          distressRows
        );
      }

      if (
        table ===
        'ZILLOW_GMAIL_IMPORTS'
      ) {
        importReads++;
        return copy(
          importRows
        );
      }

      throw new Error(
        'Unexpected table: ' +
        table
      );
    }
  };

  context.REOS.CountyProductionScheduler = {
    getCheckpoint() {
      return copy(
        checkpoint
      );
    }
  };

  context.ScriptApp = {
    getProjectTriggers() {
      return triggers.slice();
    }
  };

  vm.runInContext(
    source,
    context,
    {
      filename:
        'CountyCodeViolationGroup3PostRestorationEvidence.js'
    }
  );

  return {
    context,
    contract,
    distressHeaders,
    importHeaders,
    county,
    zillow,
    importRow,
    checkpoint,

    get adminCalls() {
      return adminCalls;
    },

    get distressReads() {
      return distressReads;
    },

    get importReads() {
      return importReads;
    },

    setTriggers(value) {
      triggers =
        value.slice();
    },

    setDistressRows(value) {
      distressRows =
        value;
    },

    setImportRows(value) {
      importRows =
        value;
    }
  };
}

function execute(h, options) {
  h.context.__options =
    options;

  return vm.runInContext(
    'reosCountyCodeViolationGroup3PostRestorationEvidence(__options)',
    h.context,
    {
      timeout:
        1000
    }
  );
}

let tests = 0;

function passes(
  name,
  work
) {
  work();
  tests++;
  console.log(
    'PASS ' +
    String(tests).padStart(2, '0') +
    ': ' +
    name
  );
}

function rejects(
  name,
  edit,
  pattern
) {
  passes(
    name,
    () => {
      const h =
        buildFixture();

      edit(h);

      assert.throws(
        () =>
          execute(
            h,
            {}
          ),
        pattern
      );
    }
  );
}

passes(
  'exact restored production fixture succeeds',
  () => {
    const h =
      buildFixture();

    const result =
      execute(
        h,
        {}
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.readOnly,
      true
    );

    assert.strictEqual(
      result.mode,
      'READ_ONLY_GROUP3_POST_RESTORATION_EVIDENCE'
    );

    assert.strictEqual(
      result.schedulerFrozen,
      true
    );

    assert.strictEqual(
      result.checkpointFrozen,
      true
    );

    assert.strictEqual(
      result.evidenceStable,
      true
    );

    assert.strictEqual(
      result.group3AlreadyRestored,
      true
    );

    assert.strictEqual(
      result.group3ReexecutionRequired,
      false
    );

    assert.strictEqual(
      result.countySurvivor.rowNumber,
      767
    );

    assert.strictEqual(
      result.countySurvivor.distressLeadId,
      COUNTY_ID
    );

    assert.strictEqual(
      result.zillowRestoration.rowNumber,
      771
    );

    assert.strictEqual(
      result.zillowRestoration.distressLeadId,
      ZILLOW_ID
    );

    assert.strictEqual(
      result.zillowRestoration.source,
      'Zillow Gmail'
    );

    assert.strictEqual(
      result.zillowImport.rowNumber,
      38
    );

    assert.strictEqual(
      result.zillowImport.gmailMessageId,
      MESSAGE_ID
    );

    assert.strictEqual(
      result.downstreamReference.columnNumber,
      13
    );

    assert.strictEqual(
      h.adminCalls,
      1
    );

    assert.strictEqual(
      h.distressReads,
      2
    );

    assert.strictEqual(
      h.importReads,
      2
    );

    [
      'productionDataMutationAuthorityGranted',
      'collapseAuthorityGranted',
      'winnerSelectionAuthorityGranted',
      'deleteAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'repairAuthorityGranted',
      'migrationAuthorityGranted',
      'referenceRewriteAuthorityGranted',
      'schedulerMutationAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'connectorExecutionAuthorityGranted',
      'group3ReexecutionAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(field => {
      assert.strictEqual(
        result[field],
        false,
        field
      );
    });
  }
);

passes(
  'null options normalize to the exact empty request',
  () => {
    const h =
      buildFixture();

    const result =
      execute(
        h,
        null
      );

    assert.strictEqual(
      result.ok,
      true
    );
  }
);

passes(
  'caller-defined options fail closed',
  () => {
    const h =
      buildFixture();

    assert.throws(
      () =>
        execute(
          h,
          {
            execute:
              true
          }
        ),
      /Caller-defined/
    );
  }
);

rejects(
  'managed county scheduler trigger blocks evidence',
  h => {
    h.setTriggers([
      {
        getHandlerFunction() {
          return 'reosCountyProductionSchedulerRun';
        }
      }
    ]);
  },
  /scheduler must remain frozen/i
);

rejects(
  'checkpoint cursor drift fails closed',
  h => {
    h.checkpoint.currentFeedCursor =
      'DRIFT';
  },
  /checkpoint authority changed/i
);

rejects(
  'county survivor source drift fails closed',
  h => {
    const rows = [
      copy(h.county),
      copy(h.zillow)
    ];

    rows[0].Source =
      'DRIFT';

    h.setDistressRows(
      rows
    );
  },
  /county survivor authority changed/i
);

rejects(
  'restored Zillow source drift fails closed',
  h => {
    const rows = [
      copy(h.county),
      copy(h.zillow)
    ];

    rows[1].Source =
      'PA-PHILADELPHIA';

    h.setDistressRows(
      rows
    );
  },
  /restored zillow identity/i
);

rejects(
  'restored Zillow Created At drift fails closed',
  h => {
    const rows = [
      copy(h.county),
      copy(h.zillow)
    ];

    rows[1]['Created At'] =
      '2026-08-20T19:39:21.000Z';

    h.setDistressRows(
      rows
    );
  },
  /immutable lineage/i
);

rejects(
  'restored Zillow projection drift fails closed',
  h => {
    const rows = [
      copy(h.county),
      copy(h.zillow)
    ];

    rows[1].Email =
      'drift@example.invalid';

    h.setDistressRows(
      rows
    );
  },
  /projection changed/i
);

rejects(
  'county violation residue on restored Zillow row fails closed',
  h => {
    const rows = [
      copy(h.county),
      copy(h.zillow)
    ];

    rows[1]['Violation Number'] =
      'VI-2026-045359';

    h.setDistressRows(
      rows
    );
  },
  /must be blank/i
);

rejects(
  'Zillow import downstream reference drift fails closed',
  h => {
    const rows = [
      copy(h.importRow)
    ];

    rows[0]['Distress Lead ID'] =
      'DRIFT';

    h.setImportRows(
      rows
    );
  },
  /provenance\/reference authority changed/i
);

rejects(
  'Zillow import message identity drift fails closed',
  h => {
    const rows = [
      copy(h.importRow)
    ];

    rows[0]['Gmail Message ID'] =
      'DRIFT';

    h.setImportRows(
      rows
    );
  },
  /provenance\/reference authority changed/i
);

passes(
  'non-county triggers do not impersonate county scheduler state',
  () => {
    const h =
      buildFixture();

    h.setTriggers([
      {
        getHandlerFunction() {
          return 'someOtherTrigger';
        }
      }
    ]);

    const result =
      execute(
        h,
        {}
      );

    assert.strictEqual(
      result.ok,
      true
    );
  }
);

console.log('');
console.log(
  'GROUP3_POST_RESTORATION_EVIDENCE_BEHAVIOR_CASES=' +
  tests
);

console.log(
  'GROUP3_POST_RESTORATION_PUBLIC_RPC_COUNT=1'
);

console.log(
  'GROUP3_POST_RESTORATION_READ_ONLY=true'
);

console.log(
  'GROUP3_REEXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);

console.log(
  'GROUP3_POST_RESTORATION_EVIDENCE_VALIDATION_PASSED=true'
);
