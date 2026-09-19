#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const vm = require('node:vm');

const MODULE =
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js';

const CURRENT_FINGERPRINT =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const CURRENT_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const EVENT =
  'COUNTY_COLLAPSE_OPERATION_INTENTS';

const CHUNK =
  'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS';

const EVENT_HEADERS = [
  'Operation ID',
  'Event Sequence',
  'Event Type',
  'Event Timestamp UTC',
  'Operation Intent Contract Version',
  'Executor Implementation Version',
  'Group Number',
  'Winner Distress Lead ID',
  'Target Delete Distress Lead ID',
  'Payload SHA-256',
  'Payload UTF-8 Bytes',
  'Payload Chunk Count',
  'Previous Event SHA-256',
  'Event SHA-256'
];

const CHUNK_HEADERS = [
  'Operation ID',
  'Event Sequence',
  'Chunk Index',
  'Chunk UTF-8 Bytes',
  'Chunk SHA-256',
  'Chunk Data'
];

const SOURCE =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

let caseCount = 0;

function pass(message) {
  caseCount += 1;

  console.log(
    'PASS ' +
    String(caseCount).padStart(2, '0') +
    ': ' +
    message
  );
}

class FakeUser {
  constructor(email) {
    this.email = email;
  }

  getEmail() {
    return this.email;
  }
}

class FakeRange {
  constructor(sheet, row, column, rows, columns) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.rows = rows;
    this.columns = columns;
  }

  setValues(values) {
    if (
      this.row !== 1 ||
      this.column !== 1 ||
      this.rows !== 1 ||
      !Array.isArray(values) ||
      !Array.isArray(values[0]) ||
      values[0].length !== this.columns
    ) {
      throw new Error(
        'Unexpected fake range write.'
      );
    }

    this.sheet.headers =
      values[0].slice();

    this.sheet.formulas =
      new Array(
        this.columns
      ).fill('');

    this.sheet.lastRow =
      Math.max(
        this.sheet.lastRow,
        1
      );

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
  constructor(name, headers) {
    this.name = name;
    this.headers =
      (headers || []).slice();

    this.formulas =
      new Array(
        this.headers.length
      ).fill('');

    this.lastRow =
      this.headers.length
        ? 1
        : 0;
  }

  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
    return this;
  }

  getLastColumn() {
    return this.headers.length;
  }

  getLastRow() {
    return this.lastRow;
  }

  getRange(row, column, rows, columns) {
    return new FakeRange(
      this,
      row,
      column,
      rows,
      columns
    );
  }
}

class FakeSpreadsheet {
  constructor(id, ownerEmail, sheets) {
    this.id = id;
    this.owner =
      new FakeUser(ownerEmail);

    /*
     * Live Apps Script can return the owner through both hierarchical
     * access-list methods even when Drive has no additional permissions.
     */
    this.editors = [
      this.owner
    ];

    this.viewers = [
      this.owner
    ];

    this.sheets =
      sheets || [
        new FakeSheet(
          'Sheet1',
          []
        )
      ];
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
      ) ||
      null
    );
  }

  insertSheet(name) {
    const sheet =
      new FakeSheet(
        name,
        []
      );

    this.sheets.push(sheet);

    return sheet;
  }

  getOwner() {
    return this.owner;
  }

  getEditors() {
    return this.editors.slice();
  }

  getViewers() {
    return this.viewers.slice();
  }
}

function validJournal(id, ownerEmail) {
  return new FakeSpreadsheet(
    id,
    ownerEmail || 'admin@example.com',
    [
      new FakeSheet(
        EVENT,
        EVENT_HEADERS
      ),
      new FakeSheet(
        CHUNK,
        CHUNK_HEADERS
      )
    ]
  );
}

function environment(options) {
  options =
    options || {};

  const state = {
    adminAllowed:
      options.adminAllowed !== false,

    leaseStatus:
      options.leaseStatus || {
        ok: true,
        state: 'ABSENT',
        settled: false,
        expired: false
      },

    propertyValue:
      options.propertyValue || '',

    propertySetCount: 0,
    createCount: 0,
    flushCount: 0,
    openCount: 0,

    effectiveEmail:
      options.effectiveEmail ||
      'admin@example.com',

    active:
      new FakeSpreadsheet(
        'county-data-1',
        'admin@example.com',
        []
      ),

    workbooks:
      new Map(),

    createdMutator:
      options.createdMutator ||
      null,

    readbackOverride:
      Object.prototype
        .hasOwnProperty
        .call(
          options,
          'readbackOverride'
        )
        ? options.readbackOverride
        : undefined
  };

  if (
    options.existingWorkbook
  ) {
    state.workbooks.set(
      options.existingWorkbook.getId(),
      options.existingWorkbook
    );
  }

  const properties = {
    getProperty(key) {
      assert.equal(
        key,
        'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID'
      );

      if (
        state.readbackOverride !== undefined &&
        state.propertySetCount > 0
      ) {
        return state.readbackOverride;
      }

      return state.propertyValue;
    },

    setProperty(key, value) {
      assert.equal(
        key,
        'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID'
      );

      state.propertySetCount += 1;
      state.propertyValue =
        String(value);
    }
  };

  const context = {
    console,

    REOS: {
      Security: {
        requireAdmin() {
          if (
            !state.adminAllowed
          ) {
            throw new Error(
              'ADMIN_DENIED'
            );
          }
        }
      },

      CountyMutationExclusionLease: {
        status() {
          return JSON.parse(
            JSON.stringify(
              state.leaseStatus
            )
          );
        }
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return properties;
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
        value,
        charset
      ) {
        assert.equal(
          algorithm,
          'SHA_256'
        );

        assert.equal(
          charset,
          'UTF_8'
        );

        return Array.from(
          crypto
            .createHash('sha256')
            .update(
              String(value),
              'utf8'
            )
            .digest()
        );
      }
    },

    Session: {
      getEffectiveUser() {
        return new FakeUser(
          state.effectiveEmail
        );
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return state.active;
      },

      openById(id) {
        state.openCount += 1;

        if (
          !state.workbooks.has(id)
        ) {
          throw new Error(
            'OPEN_BY_ID_NOT_FOUND'
          );
        }

        return state.workbooks.get(id);
      },

      create(name) {
        assert.equal(
          name,
          'REOS County Collapse Operation Intent Journal'
        );

        state.createCount += 1;

        const workbook =
          new FakeSpreadsheet(
            'created-workbook-' +
              state.createCount,
            state.effectiveEmail
          );

        if (
          typeof state.createdMutator ===
          'function'
        ) {
          state.createdMutator(
            workbook
          );
        }

        state.workbooks.set(
          workbook.getId(),
          workbook
        );

        return workbook;
      },

      flush() {
        state.flushCount += 1;
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    SOURCE,
    context,
    {
      filename:
        MODULE
    }
  );

  return {
    state,
    context
  };
}

function provisionOptions() {
  return {
    confirmProvision: true,

    expectedWinnerPlanFingerprintSha256:
      CURRENT_FINGERPRINT,

    expectedAuthoritySha256:
      CURRENT_AUTHORITY
  };
}

function expectThrow(fn, pattern) {
  assert.throws(
    fn,
    pattern
  );
}

console.log(
  '=== COUNTY COLLAPSE RUNTIME PREREQUISITE CERTIFICATION V1 ==='
);

{
  const {
    context
  } = environment();

  assert.deepEqual(
    Object.keys(
      context.REOS
        .CountyCollapseRuntimePrerequisiteCertification
    ).sort(),
    [
      'provision',
      'status'
    ]
  );

  assert.equal(
    typeof context
      .reosCountyCollapseRuntimePrerequisiteStatus,
    'function'
  );

  assert.equal(
    typeof context
      .reosCountyCollapseOperationIntentProvision,
    'function'
  );

  pass(
    'runtime API is exactly status plus provision with two bounded RPCs'
  );
}

{
  const {
    context
  } = environment({
    adminAllowed: false
  });

  expectThrow(
    () =>
      context
        .reosCountyCollapseRuntimePrerequisiteStatus(),
    /ADMIN_DENIED/
  );

  pass(
    'status requires Admin authority'
  );
}

{
  const {
    context
  } = environment({
    adminAllowed: false
  });

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          provisionOptions()
        ),
    /ADMIN_DENIED/
  );

  pass(
    'provision requires Admin authority'
  );
}

{
  const {
    context
  } = environment();

  const result =
    context
      .reosCountyCollapseRuntimePrerequisiteStatus();

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.leaseState,
    'ABSENT'
  );

  assert.equal(
    result.leaseTransitionSafe,
    true
  );

  assert.equal(
    result.operationIntentConfigured,
    false
  );

  assert.equal(
    result.prerequisitesReadyForExecutorImplementation,
    false
  );

  assert.equal(
    result.collapseExecutionAuthorityGranted,
    false
  );

  pass(
    'ABSENT lease plus missing store remains authority-free and not ready'
  );
}

{
  const {
    context
  } = environment({
    leaseStatus: {
      ok: false,
      state: 'MALFORMED',
      authorityGeneration:
        'UNKNOWN'
    }
  });

  const result =
    context
      .reosCountyCollapseRuntimePrerequisiteStatus();

  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.leaseTransitionSafe,
    false
  );

  pass(
    'MALFORMED lease is never prerequisite-ready'
  );
}

for (
  const stateName of [
    'OPEN',
    'SETTLED'
  ]
) {
  const {
    context
  } = environment({
    leaseStatus: {
      ok: true,
      state:
        stateName,
      authorityGeneration:
        'CURRENT'
    }
  });

  const result =
    context
      .reosCountyCollapseRuntimePrerequisiteStatus();

  assert.equal(
    result.leaseTransitionSafe,
    false
  );

  pass(
    stateName +
    ' lease is unsafe for prerequisite transition'
  );
}

{
  const {
    context
  } = environment({
    leaseStatus: {
      ok: true,
      state: 'CLOSED',
      authorityGeneration:
        'CURRENT'
    }
  });

  assert.equal(
    context
      .reosCountyCollapseRuntimePrerequisiteStatus()
      .leaseTransitionSafe,
    true
  );

  pass(
    'CURRENT CLOSED lease is safe for prerequisite transition'
  );
}

{
  const workbook =
    validJournal(
      'journal-1'
    );

  const {
    context
  } = environment({
    propertyValue:
      'journal-1',

    existingWorkbook:
      workbook,

    leaseStatus: {
      ok: true,
      state: 'CLOSED',
      authorityGeneration:
        'CURRENT'
    }
  });

  const result =
    context
      .reosCountyCollapseRuntimePrerequisiteStatus();

  assert.equal(
    result.operationIntentConfigured,
    true
  );

  assert.equal(
    result.operationIntentSchemaCertified,
    true
  );

  assert.equal(
    result.operationIntentAccessBindingCertified,
    true
  );

  assert.equal(
    result.operationIntentInitialEmptyStoreCertified,
    true
  );

  assert.equal(
    result.prerequisitesReadyForExecutorImplementation,
    true
  );

  assert.notEqual(
    result.operationIntentWorkbookIdSha256,
    'journal-1'
  );

  assert.equal(
    JSON.stringify(result)
      .includes('journal-1'),
    false
  );

  pass(
    'valid configured journal is reported only by SHA-256 and can satisfy local prerequisites'
  );
}

{
  const workbook =
    validJournal(
      'county-data-1'
    );

  const {
    context
  } = environment({
    propertyValue:
      'county-data-1',

    existingWorkbook:
      workbook
  });

  const result =
    context
      .reosCountyCollapseRuntimePrerequisiteStatus();

  assert.equal(
    result.ok,
    false
  );

  assert.equal(
    result.operationIntentSchemaCertified,
    false
  );

  pass(
    'binding to active county-data workbook fails closed'
  );
}

{
  const workbook =
    validJournal(
      'bad-sheet-count'
    );

  workbook.sheets.push(
    new FakeSheet(
      'EXTRA',
      []
    )
  );

  const {
    context
  } = environment({
    propertyValue:
      'bad-sheet-count',

    existingWorkbook:
      workbook
  });

  assert.equal(
    context
      .reosCountyCollapseRuntimePrerequisiteStatus()
      .ok,
    false
  );

  pass(
    'extra journal sheet fails closed'
  );
}

{
  const workbook =
    validJournal(
      'bad-header'
    );

  workbook
    .getSheetByName(EVENT)
    .headers[0] =
      'Wrong Header';

  const {
    context
  } = environment({
    propertyValue:
      'bad-header',

    existingWorkbook:
      workbook
  });

  assert.equal(
    context
      .reosCountyCollapseRuntimePrerequisiteStatus()
      .ok,
    false
  );

  pass(
    'header drift fails closed'
  );
}

{
  const workbook =
    validJournal(
      'header-formula'
    );

  workbook
    .getSheetByName(EVENT)
    .formulas[0] =
      '=NOW()';

  const {
    context
  } = environment({
    propertyValue:
      'header-formula',

    existingWorkbook:
      workbook
  });

  assert.equal(
    context
      .reosCountyCollapseRuntimePrerequisiteStatus()
      .ok,
    false
  );

  pass(
    'header formula fails closed'
  );
}

{
  const workbook =
    validJournal(
      'extra-editor'
    );

  workbook.editors.push(
    new FakeUser(
      'other@example.com'
    )
  );

  const {
    context
  } = environment({
    propertyValue:
      'extra-editor',

    existingWorkbook:
      workbook
  });

  assert.equal(
    context
      .reosCountyCollapseRuntimePrerequisiteStatus()
      .ok,
    false
  );

  pass(
    'additional editor fails access binding'
  );
}

{
  const workbook =
    validJournal(
      'extra-viewer'
    );

  workbook.viewers.push(
    new FakeUser(
      'viewer@example.com'
    )
  );

  const {
    context
  } = environment({
    propertyValue:
      'extra-viewer',

    existingWorkbook:
      workbook
  });

  assert.equal(
    context
      .reosCountyCollapseRuntimePrerequisiteStatus()
      .ok,
    false
  );

  pass(
    'additional viewer fails access binding'
  );
}

{
  const {
    context
  } = environment();

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision({
          ...provisionOptions(),
          workbookId:
            'caller-value'
        }),
    /unsupported field/
  );

  pass(
    'caller-supplied workbook ID is prohibited'
  );
}

{
  const {
    context
  } = environment();

  const options =
    provisionOptions();

  options.confirmProvision =
    false;

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          options
        ),
    /Explicit provisioning confirmation/
  );

  pass(
    'explicit provisioning confirmation is mandatory'
  );
}

{
  const {
    context
  } = environment();

  const options =
    provisionOptions();

  options
    .expectedWinnerPlanFingerprintSha256 =
      'wrong';

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          options
        ),
    /Winner-plan fingerprint/
  );

  pass(
    'wrong current winner fingerprint fails before provisioning'
  );
}

{
  const {
    context
  } = environment();

  const options =
    provisionOptions();

  options
    .expectedAuthoritySha256 =
      'wrong';

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          options
        ),
    /Collapse authority SHA/
  );

  pass(
    'wrong current collapse authority fails before provisioning'
  );
}

for (
  const unsafe of [
    {
      ok: true,
      state: 'OPEN',
      authorityGeneration:
        'CURRENT'
    },
    {
      ok: true,
      state: 'SETTLED',
      authorityGeneration:
        'CURRENT'
    },
    {
      ok: false,
      state: 'MALFORMED',
      authorityGeneration:
        'UNKNOWN'
    }
  ]
) {
  const {
    state,
    context
  } = environment({
    leaseStatus:
      unsafe
  });

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          provisionOptions()
        ),
    /not safe/
  );

  assert.equal(
    state.createCount,
    0
  );

  assert.equal(
    state.propertySetCount,
    0
  );

  pass(
    unsafe.state +
    ' lease blocks provisioning before workbook/property mutation'
  );
}

{
  const workbook =
    validJournal(
      'existing-good'
    );

  const {
    state,
    context
  } = environment({
    propertyValue:
      'existing-good',

    existingWorkbook:
      workbook
  });

  const result =
    context
      .reosCountyCollapseOperationIntentProvision(
        provisionOptions()
      );

  assert.equal(
    result.mode,
    'EXISTING_BINDING_READ_ONLY_IDEMPOTENT'
  );

  assert.equal(
    result.workbookCreated,
    false
  );

  assert.equal(
    state.createCount,
    0
  );

  assert.equal(
    state.propertySetCount,
    0
  );

  pass(
    'existing valid binding is read-only and idempotent'
  );
}

{
  const workbook =
    validJournal(
      'existing-bad'
    );

  workbook
    .getSheetByName(EVENT)
    .headers[1] =
      'Drift';

  const {
    state,
    context
  } = environment({
    propertyValue:
      'existing-bad',

    existingWorkbook:
      workbook
  });

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          provisionOptions()
        ),
    /header mismatch/
  );

  assert.equal(
    state.createCount,
    0
  );

  assert.equal(
    state.propertySetCount,
    0
  );

  pass(
    'existing invalid binding fails closed with no replacement'
  );
}

{
  const {
    state,
    context
  } = environment();

  const result =
    context
      .reosCountyCollapseOperationIntentProvision(
        provisionOptions()
      );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.mode,
    'ONE_TIME_OPERATION_INTENT_PROVISIONED'
  );

  assert.equal(
    state.createCount,
    1
  );

  assert.equal(
    state.propertySetCount,
    1
  );

  assert.equal(
    state.flushCount,
    1
  );

  const created =
    state.workbooks.get(
      state.propertyValue
    );

  assert.deepEqual(
    created
      .getSheets()
      .map(sheet =>
        sheet.getName()
      )
      .sort(),
    [
      CHUNK,
      EVENT
    ].sort()
  );

  assert.deepEqual(
    Array.from(
      created
        .getSheetByName(EVENT)
        .headers
    ),
    EVENT_HEADERS
  );

  assert.deepEqual(
    Array.from(
      created
        .getSheetByName(CHUNK)
        .headers
    ),
    CHUNK_HEADERS
  );

  assert.equal(
    result.initialEmptyStoreCertified,
    true
  );

  pass(
    'successful provision creates exactly two empty certified journal sheets and one property binding'
  );
}

{
  const {
    state,
    context
  } = environment({
    createdMutator(workbook) {
      /*
       * Keep owner-inclusive live access-list semantics coherent when
       * this test deliberately replaces the fake workbook owner.
       */
      workbook.owner =
        new FakeUser(
          'different-owner@example.com'
        );

      workbook.editors = [
        workbook.owner
      ];

      workbook.viewers = [
        workbook.owner
      ];
    }
  });

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          provisionOptions()
        ),
    /not the workbook owner/
  );

  assert.equal(
    state.createCount,
    1
  );

  assert.equal(
    state.propertySetCount,
    0
  );

  assert.equal(
    state.workbooks.size,
    1
  );

  pass(
    'owner mismatch leaves an unbound orphan and never writes the property'
  );
}

{
  const {
    state,
    context
  } = environment({
    createdMutator(workbook) {
      workbook.editors.push(
        new FakeUser(
          'extra@example.com'
        )
      );
    }
  });

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          provisionOptions()
        ),
    /additional editors/
  );

  assert.equal(
    state.propertySetCount,
    0
  );

  pass(
    'new workbook with extra editor is never bound'
  );
}

{
  const {
    state,
    context
  } = environment({
    readbackOverride:
      'wrong-id'
  });

  expectThrow(
    () =>
      context
        .reosCountyCollapseOperationIntentProvision(
          provisionOptions()
        ),
    /property readback is ambiguous/
  );

  assert.equal(
    state.propertySetCount,
    1
  );

  pass(
    'ambiguous property readback fails closed with no automatic retry'
  );
}

{
  const {
    state,
    context
  } = environment();

  context
    .reosCountyCollapseOperationIntentProvision(
      provisionOptions()
    );

  const status =
    context
      .reosCountyCollapseRuntimePrerequisiteStatus();

  assert.equal(
    status.operationIntentConfigured,
    true
  );

  assert.equal(
    status.operationIntentInitialEmptyStoreCertified,
    true
  );

  assert.equal(
    status.prerequisitesReadyForExecutorImplementation,
    true
  );

  assert.equal(
    JSON.stringify(status)
      .includes(
        state.propertyValue
      ),
    false
  );

  pass(
    'post-provision status reopens and revalidates the bound store without exposing raw workbook ID'
  );
}

[
  /deletePhysicalRowExact/,
  /patchPhysicalRowCellsExact/,
  /replacePhysicalRowCellsExact/,
  /REOS\.Database\./,
  /ScriptApp\.newTrigger/,
  /CountyProductionScheduler/,
  /CountyConnectorSDK/,
  /\.openExclusive\s*\(/,
  /\.close\s*\(/,
  /deleteProperty\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(SOURCE),
    false,
    'Forbidden runtime surface present: ' +
      pattern
  );
});

assert.equal(
  (
    SOURCE.match(
      /function\s+reosCountyCollapseRuntimePrerequisiteStatus\s*\(/g
    ) || []
  ).length,
  1
);

assert.equal(
  (
    SOURCE.match(
      /function\s+reosCountyCollapseOperationIntentProvision\s*\(/g
    ) || []
  ).length,
  1
);

assert.equal(
  (
    SOURCE.match(
      /\.setProperty\s*\(/g
    ) || []
  ).length,
  1
);

pass(
  'static surface contains one bounded property write and no county/scheduler/delete/maintenance-owner authority'
);

console.log(
  'RUNTIME_PREREQUISITE_BEHAVIOR_CASES=' +
  caseCount
);

console.log(
  'RUNTIME_PREREQUISITE_IMPLEMENTATION_VALIDATION_PASSED=true'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
