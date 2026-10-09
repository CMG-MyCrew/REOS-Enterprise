#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const RUNTIME = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js'
);

const V1_HEADERS = [
  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

const V2_HEADERS = [
  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Owner Evidence Lookup Mode',
  'Certified OPA Account',
  'Property Source Identity Certification Basis',
  'Property Source Identity Certification SHA-256',
  'Normal Lookup Evidence SHA-256',
  'Owner Evidence Result SHA-256',
  'Comparison Result SHA-256',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

class FakeRange {
  constructor(sheet) {
    this.sheet = sheet;
  }

  setValues(values) {
    const state = this.sheet.state;
    const config = this.sheet.config;

    state.timeline.push('setValues');
    state.setValuesCount += 1;

    if (config.setValuesThrows) {
      throw new Error(
        'forced V2 header write failure'
      );
    }

    assert.ok(Array.isArray(values));
    assert.strictEqual(values.length, 1);

    this.sheet.headers =
      values[0].slice();

    this.sheet.formulas =
      this.sheet.headers.map(() => '');

    this.sheet.headerWritten = true;

    if (config.corruptAfterWrite) {
      this.sheet.headers[0] =
        'CORRUPTED_HEADER';
    }

    if (config.formulaAfterWrite) {
      this.sheet.formulas[0] =
        '=NOW()';
    }

    return this;
  }

  getValues() {
    return [
      this.sheet.headers.slice()
    ];
  }

  getFormulas() {
    return [
      this.sheet.formulas.slice()
    ];
  }
}

class FakeSheet {
  constructor(
    name,
    sheetId,
    state,
    config = {}
  ) {
    this.name = name;
    this.sheetId = sheetId;
    this.state = state;
    this.config = config;

    this.headers =
      (config.headers || []).slice();

    this.formulas =
      (
        config.formulas ||
        this.headers.map(() => '')
      ).slice();

    this.dataRows =
      Number(config.dataRows || 0);

    this.headerWritten =
      this.headers.length > 0;
  }

  getName() {
    return this.name;
  }

  getSheetId() {
    return this.sheetId;
  }

  getLastRow() {
    return this.headerWritten
      ? 1 + this.dataRows
      : 0;
  }

  getLastColumn() {
    return this.headers.length;
  }

  getRange(
    row,
    column,
    numRows,
    numColumns
  ) {
    assert.strictEqual(row, 1);
    assert.strictEqual(column, 1);
    assert.strictEqual(numRows, 1);

    assert.strictEqual(
      numColumns,
      this.headers.length ||
        (
          this.name ===
          'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2'
            ? 27
            : 20
        )
    );

    return new FakeRange(this);
  }
}

class FakeWorkbook {
  constructor(
    id,
    state,
    config,
    sheets
  ) {
    this.id = id;
    this.state = state;
    this.config = config;
    this.sheets = sheets;
  }

  getId() {
    return this.id;
  }

  getSheets() {
    return this.sheets.slice();
  }

  getSheetByName(name) {
    return (
      this.sheets.find(
        sheet =>
          sheet.getName() === name
      ) || null
    );
  }

  insertSheet(name) {
    this.state.timeline.push('insertSheet');
    this.state.insertSheetCount += 1;

    if (this.config.insertThrows) {
      throw new Error(
        'forced insertSheet failure'
      );
    }

    assert.strictEqual(
      name,
      'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2'
    );

    const sheet =
      new FakeSheet(
        name,
        this.config.newV2SheetId,
        this.state,
        {
          setValuesThrows:
            this.config.setValuesThrows,
          corruptAfterWrite:
            this.config.corruptAfterWrite,
          formulaAfterWrite:
            this.config.formulaAfterWrite
        }
      );

    this.sheets.push(sheet);

    return sheet;
  }
}

function makeEnvironment(overrides = {}) {
  const config = Object.assign({
    activeId: 'active-reos-book',
    propertyValue: 'evidence-book',
    denyAdmin: false,
    openThrows: false,
    lockAvailable: true,
    releaseThrows: false,

    v1Present: true,
    v1SheetId: 7,
    v1Headers: V1_HEADERS,
    v1Formulas: V1_HEADERS.map(() => ''),
    v1Rows: 3,

    v2Present: false,
    v2SheetId: 8,
    v2Headers: V2_HEADERS,
    v2Formulas: V2_HEADERS.map(() => ''),
    v2Rows: 0,

    extraSheet: false,

    newV2SheetId: 9,
    insertThrows: false,
    setValuesThrows: false,
    flushThrows: false,
    corruptAfterWrite: false,
    formulaAfterWrite: false
  }, overrides);

  const state = {
    adminCalls: 0,
    getPropertyCount: 0,
    openByIdCount: 0,
    tryLockCount: 0,
    releaseLockCount: 0,
    insertSheetCount: 0,
    setValuesCount: 0,
    flushCount: 0,
    timeline: []
  };

  const activeBook = {
    getId() {
      return config.activeId;
    }
  };

  const sheets = [];

  if (config.v1Present) {
    sheets.push(
      new FakeSheet(
        'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',
        config.v1SheetId,
        state,
        {
          headers: config.v1Headers,
          formulas: config.v1Formulas,
          dataRows: config.v1Rows
        }
      )
    );
  }

  if (config.v2Present) {
    sheets.push(
      new FakeSheet(
        'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2',
        config.v2SheetId,
        state,
        {
          headers: config.v2Headers,
          formulas: config.v2Formulas,
          dataRows: config.v2Rows
        }
      )
    );
  }

  if (config.extraSheet) {
    sheets.push(
      new FakeSheet(
        'UNEXPECTED_SHEET',
        88,
        state,
        {
          headers: ['x'],
          formulas: [''],
          dataRows: 0
        }
      )
    );
  }

  const evidenceBook =
    new FakeWorkbook(
      config.propertyValue ||
        'evidence-book',
      state,
      config,
      sheets
    );

  const lock = {
    active: false,

    tryLock(milliseconds) {
      state.timeline.push('tryLock');
      state.tryLockCount += 1;

      assert.strictEqual(
        milliseconds,
        1000
      );

      if (!config.lockAvailable) {
        return false;
      }

      this.active = true;
      return true;
    },

    hasLock() {
      return this.active;
    },

    releaseLock() {
      state.timeline.push('releaseLock');
      state.releaseLockCount += 1;

      if (config.releaseThrows) {
        throw new Error(
          'forced lock release failure'
        );
      }

      this.active = false;
    }
  };

  const sandbox = {
    console,

    REOS: {
      Security: {
        requireAdmin() {
          state.timeline.push('requireAdmin');
          state.adminCalls += 1;

          if (config.denyAdmin) {
            throw new Error(
              'Admin permission required.'
            );
          }

          return true;
        }
      }
    },

    LockService: {
      getScriptLock() {
        return lock;
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            state.timeline.push('getProperty');
            state.getPropertyCount += 1;

            assert.strictEqual(
              key,
              'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID'
            );

            return config.propertyValue;
          }
        };
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        state.timeline.push(
          'getActiveSpreadsheet'
        );

        return activeBook;
      },

      openById(id) {
        state.timeline.push('openById');
        state.openByIdCount += 1;

        if (config.openThrows) {
          throw new Error(
            'forced openById failure'
          );
        }

        if (
          id !==
          config.propertyValue
        ) {
          throw new Error(
            'unexpected workbook id: ' +
            id
          );
        }

        return evidenceBook;
      },

      flush() {
        state.timeline.push('flush');
        state.flushCount += 1;

        if (config.flushThrows) {
          throw new Error(
            'forced flush failure'
          );
        }
      }
    }
  };

  const context =
    vm.createContext(
      sandbox
    );

  vm.runInContext(
    fs.readFileSync(
      RUNTIME,
      'utf8'
    ),
    context,
    {
      filename:
        path.basename(RUNTIME)
    }
  );

  function evaluate(source) {
    return vm.runInContext(
      source,
      context
    );
  }

  return {
    config,
    state,
    evidenceBook,
    evaluate
  };
}

function inspect(env, expression = '{}') {
  return env.evaluate(
    'reosAbsenteeOwnerClassificationEvidenceStoreV2ProvisioningInspect(' +
      expression +
    ')'
  );
}

function provision(
  env,
  overrides = {}
) {
  const options = Object.assign({
    confirmProvisioning:
      'PROVISION_V2_EVIDENCE_SHEET',

    expectedActiveReosSpreadsheetId:
      'active-reos-book',

    expectedConfiguredWorkbookId:
      'evidence-book',

    expectedV1SheetId:
      7,

    expectedV2State:
      'ABSENT'
  }, overrides);

  return env.evaluate(
    'reosAbsenteeOwnerClassificationEvidenceStoreV2Provision(' +
      JSON.stringify(options) +
    ')'
  );
}

let cases = 0;

{
  const env =
    makeEnvironment({
      propertyValue: ''
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'SHARED_EVIDENCE_WORKBOOK_UNCONFIGURED'
  );

  assert.strictEqual(
    result.v2ProvisioningAuthorized,
    false
  );

  assert.strictEqual(
    env.state.insertSheetCount,
    0
  );

  cases += 1;
}

{
  const env =
    makeEnvironment({
      propertyValue:
        'active-reos-book'
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'UNSAFE_ACTIVE_REOS_ALIAS'
  );

  assert.strictEqual(
    env.state.openByIdCount,
    0
  );

  cases += 1;
}

{
  const env =
    makeEnvironment({
      openThrows: true
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'CONFIGURED_WORKBOOK_UNOPENABLE'
  );

  cases += 1;
}

{
  const env =
    makeEnvironment({
      v1Present: false
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'V1_SHEET_MISSING'
  );

  cases += 1;
}

{
  const bad =
    V1_HEADERS.slice();

  bad[3] =
    'WRONG_HEADER';

  const env =
    makeEnvironment({
      v1Headers: bad
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'V1_SCHEMA_INVALID'
  );

  cases += 1;
}

{
  const env =
    makeEnvironment({
      extraSheet: true
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'UNEXPECTED_WORKBOOK_SHEET_SET'
  );

  cases += 1;
}

{
  const env =
    makeEnvironment();

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'V2_PROVISIONING_REQUIRED'
  );

  assert.strictEqual(
    result.v1EvidenceRowCount,
    3
  );

  assert.strictEqual(
    result.v2ProvisioningRequired,
    true
  );

  assert.strictEqual(
    result.v2PersistenceAuthorized,
    false
  );

  cases += 1;
}

{
  const bad =
    V2_HEADERS.slice();

  bad[20] =
    'WRONG_PROVENANCE_HEADER';

  const env =
    makeEnvironment({
      v2Present: true,
      v2Headers: bad
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'V2_SCHEMA_INVALID'
  );

  cases += 1;
}

{
  const env =
    makeEnvironment({
      v2Present: true,
      v2Rows: 4
    });

  const result =
    inspect(env);

  assert.strictEqual(
    result.classification,
    'V2_ALREADY_PROVISIONED'
  );

  assert.strictEqual(
    result.v2EvidenceRowCount,
    4
  );

  assert.strictEqual(
    result.v2ProvisioningRequired,
    false
  );

  cases += 1;
}

{
  const env =
    makeEnvironment();

  assert.throws(
    () =>
      inspect(
        env,
        '{unexpected:true}'
      ),
    /exact empty object/
  );

  assert.strictEqual(
    env.state.insertSheetCount,
    0
  );

  cases += 1;
}

{
  const env =
    makeEnvironment();

  const result =
    provision(env);

  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_VERIFIED'
  );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.v2ProvisioningVerified,
    true
  );

  assert.strictEqual(
    result.v2EvidenceRowCount,
    0
  );

  assert.strictEqual(
    result.v1EvidenceRowCount,
    3
  );

  assert.strictEqual(
    result.v2PersistenceAuthorized,
    false
  );

  assert.strictEqual(
    result.v2BoundedRolloutAuthorized,
    false
  );

  assert.strictEqual(
    result.v2OrchestratorAuthorized,
    false
  );

  assert.strictEqual(
    env.state.insertSheetCount,
    1
  );

  assert.strictEqual(
    env.state.setValuesCount,
    1
  );

  assert.strictEqual(
    env.state.flushCount,
    1
  );

  assert.strictEqual(
    env.state.releaseLockCount,
    1
  );

  assert.strictEqual(
    env.evidenceBook.getSheets().length,
    2
  );

  const v1 =
    env.evidenceBook
      .getSheetByName(
        'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE'
      );

  assert.strictEqual(
    v1.getLastRow(),
    4
  );

  assert.strictEqual(
    v1.getLastColumn(),
    20
  );

  const timeline =
    env.state.timeline;

  assert.ok(
    timeline.indexOf('tryLock') <
    timeline.indexOf('insertSheet')
  );

  assert.ok(
    timeline.indexOf('insertSheet') <
    timeline.indexOf('setValues')
  );

  assert.ok(
    timeline.indexOf('setValues') <
    timeline.indexOf('flush')
  );

  assert.ok(
    timeline.indexOf('flush') <
    timeline.indexOf('releaseLock')
  );

  cases += 1;
}

[
  [
    'wrong active identity',
    {},
    {
      expectedActiveReosSpreadsheetId:
        'different-active'
    }
  ],

  [
    'missing property',
    {
      propertyValue: ''
    },
    {}
  ],

  [
    'wrong configured workbook expectation',
    {},
    {
      expectedConfiguredWorkbookId:
        'different-workbook'
    }
  ],

  [
    'wrong V1 stable sheet identity',
    {},
    {
      expectedV1SheetId: 999
    }
  ],

  [
    'V2 already exists',
    {
      v2Present: true
    },
    {}
  ],

  [
    'lock unavailable',
    {
      lockAvailable: false
    },
    {}
  ]
].forEach(
  ([
    label,
    environment,
    options
  ]) => {
    const env =
      makeEnvironment(
        environment
      );

    const result =
      provision(
        env,
        options
      );

    assert.strictEqual(
      result.classification,
      'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRECONDITION_FAILED',
      label
    );

    assert.strictEqual(
      env.state.insertSheetCount,
      0,
      label
    );

    cases += 1;
  }
);

[
  [
    'insert failure',
    {
      insertThrows: true
    }
  ],

  [
    'header write failure',
    {
      setValuesThrows: true
    }
  ],

  [
    'flush failure',
    {
      flushThrows: true
    }
  ],

  [
    'post-write corrupted schema',
    {
      corruptAfterWrite: true
    }
  ],

  [
    'post-write formula',
    {
      formulaAfterWrite: true
    }
  ],

  [
    'lock release failure',
    {
      releaseThrows: true
    }
  ]
].forEach(
  ([
    label,
    environment
  ]) => {
    const env =
      makeEnvironment(
        environment
      );

    const result =
      provision(env);

    assert.strictEqual(
      result.classification,
      'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_OUTCOME_UNCERTAIN',
      label
    );

    assert.strictEqual(
      result.v2SheetMutationAttempted,
      true,
      label
    );

    assert.strictEqual(
      env.state.insertSheetCount,
      1,
      label
    );

    cases += 1;
  }
);

{
  const env =
    makeEnvironment({
      denyAdmin: true
    });

  assert.throws(
    () =>
      inspect(env),
    /Admin permission required/
  );

  assert.strictEqual(
    env.state.insertSheetCount,
    0
  );

  cases += 1;
}

{
  const env =
    makeEnvironment({
      denyAdmin: true
    });

  assert.throws(
    () =>
      provision(env),
    /Admin permission required/
  );

  assert.strictEqual(
    env.state.tryLockCount,
    0
  );

  assert.strictEqual(
    env.state.insertSheetCount,
    0
  );

  cases += 1;
}

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_ADMIN_BEHAVIOR_VALID=true'
);

console.log(
  'BEHAVIOR_CASE_COUNT=' +
  cases
);

console.log(
  'READ_ONLY_INSPECTION_CERTIFIED=true'
);

console.log(
  'V2_EXACT_ONE_SHEET_MUTATION_BOUNDARY_CERTIFIED=true'
);

console.log(
  'V1_PRESERVATION_CERTIFIED=true'
);

console.log(
  'NO_SCRIPT_PROPERTY_WRITE_CERTIFIED=true'
);

console.log(
  'POST_MUTATION_UNCERTAINTY_CERTIFIED=true'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'V2_PERSISTENCE_AUTHORITY_GRANTED=false'
);

console.log(
  'V2_BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false'
);

console.log(
  'V2_ORCHESTRATOR_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
