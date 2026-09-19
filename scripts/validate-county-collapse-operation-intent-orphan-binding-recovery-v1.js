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

const MODULE =
  'build/apps-script-brand/CountyCollapseOperationIntentOrphanBindingRecovery.js';

const SOURCE =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

const ORPHAN_SHA =
  '36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c';

const WINNER =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const PROPERTY =
  'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID';

const WORKBOOK_NAME =
  'REOS County Collapse Operation Intent Journal';

const EVENT =
  'COUNTY_COLLAPSE_OPERATION_INTENTS';

const CHUNK =
  'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS';

const FIXTURE_ID =
  'TEST_CERTIFIED_ORPHAN_WORKBOOK_ID';

const ACTIVE_ID =
  'TEST_ACTIVE_COUNTY_DATA_WORKBOOK_ID';

const OWNER =
  'admin@example.com';

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

const AUTHORITY_FIELDS = [
  'collapseExecutionAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'countyDataMutationAuthorityGranted',
  'physicalDeleteAuthorityGranted',
  'insertAuthorityGranted',
  'updateAuthorityGranted',
  'deleteAuthorityGranted',
  'schedulerMutationAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'maintenanceLeaseOpenAuthorityGranted',
  'maintenanceLeaseCloseAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

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

function hashBytes(hex) {
  return Array.from(
    Buffer.from(
      hex,
      'hex'
    )
  ).map(value =>
    value > 127
      ? value - 256
      : value
  );
}

function containsCertifiedRawOrphanId(source) {
  const tokens =
    String(source).match(
      /[A-Za-z0-9_-]{20,}/g
    ) || [];

  return tokens.some(token =>
    crypto
      .createHash('sha256')
      .update(
        token,
        'utf8'
      )
      .digest('hex') ===
        ORPHAN_SHA
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
  constructor(sheet) {
    this.sheet = sheet;
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
    headers
  ) {
    this.name = name;
    this.headers =
      headers.slice();

    this.formulas =
      new Array(
        headers.length
      ).fill('');

    this.lastRow = 1;
  }

  getName() {
    return this.name;
  }

  getLastColumn() {
    return this.headers.length;
  }

  getLastRow() {
    return this.lastRow;
  }

  getRange() {
    return new FakeRange(
      this
    );
  }
}

class FakeSpreadsheet {
  constructor() {
    this.id = FIXTURE_ID;
    this.name = WORKBOOK_NAME;

    this.owner =
      new FakeUser(
        OWNER
      );

    this.editors = [];
    this.viewers = [];

    this.sheets = [
      new FakeSheet(
        EVENT,
        EVENT_HEADERS
      ),
      new FakeSheet(
        CHUNK,
        CHUNK_HEADERS
      )
    ];
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
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
}

function baseStatus() {
  return {
    ok: true,

    mode:
      'READ_ONLY_RUNTIME_PREREQUISITE_STATUS',

    contractVersion: 1,

    currentWinnerPlanFingerprintSha256:
      WINNER,

    currentCollapseAuthoritySha256:
      AUTHORITY,

    leaseState:
      'ABSENT',

    leaseAuthorityGeneration:
      '',

    leaseTransitionSafe:
      true,

    operationIntentConfigured:
      false,

    operationIntentWorkbookIdSha256:
      '',

    operationIntentSchemaCertified:
      false,

    operationIntentAccessBindingCertified:
      false,

    operationIntentEventDataRowCount:
      0,

    operationIntentChunkDataRowCount:
      0,

    operationIntentInitialEmptyStoreCertified:
      false,

    operationIntentBindingError:
      '',

    prerequisitesReadyForExecutorImplementation:
      false,

    collapseExecutionAuthorityGranted:
      false,

    productionDataMutationAuthorityGranted:
      false,

    countyDataMutationAuthorityGranted:
      false,

    physicalDeleteAuthorityGranted:
      false,

    insertAuthorityGranted:
      false,

    updateAuthorityGranted:
      false,

    deleteAuthorityGranted:
      false,

    schedulerMutationAuthorityGranted:
      false,

    checkpointMutationAuthorityGranted:
      false,

    connectorExecutionAuthorityGranted:
      false,

    maintenanceLeaseOpenAuthorityGranted:
      false,

    maintenanceLeaseCloseAuthorityGranted:
      false,

    automaticOfferAuthorityGranted:
      false
  };
}

function environment() {
  const state = {
    adminAllowed: true,

    status:
      baseStatus(),

    propertyValue:
      '',

    propertyWrites:
      0,

    readbackMismatch:
      false,

    openCalls:
      0,

    postWriteViewer:
      false,

    workbook:
      new FakeSpreadsheet(),

    activeId:
      ACTIVE_ID,

    effectiveEmail:
      OWNER
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
              'Admin denied'
            );
          }
        }
      },

      CountyCollapseRuntimePrerequisiteCertification: {
        status() {
          return Object.assign(
            {},
            state.status
          );
        }
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

        if (
          value === FIXTURE_ID
        ) {
          return hashBytes(
            ORPHAN_SHA
          );
        }

        return Array.from(
          crypto
            .createHash('sha256')
            .update(
              String(value),
              'utf8'
            )
            .digest()
        ).map(byte =>
          byte > 127
            ? byte - 256
            : byte
        );
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return {
          getId() {
            return state.activeId;
          }
        };
      },

      openById(id) {
        state.openCalls += 1;

        assert.equal(
          id,
          FIXTURE_ID
        );

        if (
          state.postWriteViewer &&
          state.openCalls >= 2
        ) {
          state.workbook.viewers = [
            new FakeUser(
              'late-viewer@example.com'
            )
          ];
        }

        return state.workbook;
      }
    },

    Session: {
      getEffectiveUser() {
        return new FakeUser(
          state.effectiveEmail
        );
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            assert.equal(
              key,
              PROPERTY
            );

            if (
              state.readbackMismatch &&
              state.propertyWrites > 0
            ) {
              return 'DIFFERENT_BINDING';
            }

            return state.propertyValue;
          },

          setProperty(
            key,
            value
          ) {
            assert.equal(
              key,
              PROPERTY
            );

            state.propertyWrites += 1;
            state.propertyValue =
              value;

            return this;
          }
        };
      }
    }
  };

  vm.createContext(
    context
  );

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

function request() {
  return {
    confirmRecovery:
      true,

    orphanWorkbookId:
      FIXTURE_ID,

    expectedOrphanWorkbookIdSha256:
      ORPHAN_SHA,

    expectedWinnerPlanFingerprintSha256:
      WINNER,

    expectedAuthoritySha256:
      AUTHORITY
  };
}

function expectFailure(
  mutate,
  pattern,
  expectedWrites
) {
  const env =
    environment();

  mutate(
    env
  );

  assert.throws(
    () =>
      env.context
        .reosCountyCollapseOperationIntentOrphanBindingRecover(
          request()
        ),
    pattern
  );

  assert.equal(
    env.state.propertyWrites,
    expectedWrites
  );

  return env;
}

assert.ok(
  SOURCE.includes(
    'CountyCollapseOperationIntentOrphanBindingRecovery'
  )
);

assert.ok(
  SOURCE.includes(
    'reosCountyCollapseOperationIntentOrphanBindingRecover'
  )
);

assert.equal(
  (
    SOURCE.match(
      /\.setProperty\s*\(/g
    ) || []
  ).length,
  1,
  'recovery module must contain exactly one property-write call site'
);

[
  /SpreadsheetApp\.create\s*\(/,
  /\.insertSheet\s*\(/,
  /\.deleteSheet\s*\(/,
  /\.setValues\s*\(/,
  /\.setValue\s*\(/,
  /\.clear\s*\(/,
  /\.deleteProperty\s*\(/,
  /ScriptApp\./,
  /REOS\.Database\./,
  /CountyProductionScheduler/,
  /openExclusive\s*\(/,
  /maintenanceLeaseOpenAuthorityGranted:\s*true/,
  /maintenanceLeaseCloseAuthorityGranted:\s*true/,
  /automaticOfferAuthorityGranted:\s*true/
].forEach(pattern => {
  assert.equal(
    pattern.test(
      SOURCE
    ),
    false,
    'forbidden recovery surface: ' +
      pattern
  );
});

assert.equal(
  containsCertifiedRawOrphanId(
    SOURCE
  ),
  false,
  'raw production orphan ID must not appear in recovery module source'
);

assert.equal(
  containsCertifiedRawOrphanId(
    fs.readFileSync(
      __filename,
      'utf8'
    )
  ),
  false,
  'raw production orphan ID must not appear in implementation validator source'
);

pass(
  'static recovery surface is exactly one Script Property write with no workbook/data/scheduler mutation'
);

{
  const env =
    environment();

  assert.equal(
    Object.keys(
      env.context.REOS
        .CountyCollapseOperationIntentOrphanBindingRecovery
    ).join(','),
    'recover'
  );

  pass(
    'public module API is exactly recover'
  );
}

expectFailure(
  env => {
    env.state.adminAllowed =
      false;
  },
  /Admin denied/,
  0
);

pass(
  'Admin denial fails before property mutation'
);

{
  const env =
    environment();

  const options =
    request();

  options.confirmRecovery =
    false;

  assert.throws(
    () =>
      env.context
        .reosCountyCollapseOperationIntentOrphanBindingRecover(
          options
        ),
    /Explicit orphan-binding recovery confirmation/
  );

  assert.equal(
    env.state.propertyWrites,
    0
  );

  pass(
    'explicit recovery confirmation is mandatory'
  );
}

{
  const env =
    environment();

  const options =
    request();

  options.extra =
    true;

  assert.throws(
    () =>
      env.context
        .reosCountyCollapseOperationIntentOrphanBindingRecover(
          options
        ),
    /unsupported field/
  );

  assert.equal(
    env.state.propertyWrites,
    0
  );

  pass(
    'unsupported recovery options fail closed'
  );
}

{
  const env =
    environment();

  const options =
    request();

  options.expectedOrphanWorkbookIdSha256 =
    '0'.repeat(64);

  assert.throws(
    () =>
      env.context
        .reosCountyCollapseOperationIntentOrphanBindingRecover(
          options
        ),
    /Expected orphan workbook SHA-256/
  );

  assert.equal(
    env.state.propertyWrites,
    0
  );

  pass(
    'wrong certified orphan hash fails before property mutation'
  );
}

{
  const env =
    environment();

  const options =
    request();

  options.orphanWorkbookId =
    'WRONG_ORPHAN_ID';

  assert.throws(
    () =>
      env.context
        .reosCountyCollapseOperationIntentOrphanBindingRecover(
          options
        ),
    /does not match the certified incident hash/
  );

  assert.equal(
    env.state.propertyWrites,
    0
  );

  pass(
    'raw workbook ID must hash to exact certified orphan authority'
  );
}

{
  const env =
    environment();

  const options =
    request();

  options.expectedWinnerPlanFingerprintSha256 =
    '0'.repeat(64);

  assert.throws(
    () =>
      env.context
        .reosCountyCollapseOperationIntentOrphanBindingRecover(
          options
        ),
    /Winner-plan fingerprint/
  );

  assert.equal(
    env.state.propertyWrites,
    0
  );

  pass(
    'winner-plan authority drift fails before property mutation'
  );
}

{
  const env =
    environment();

  const options =
    request();

  options.expectedAuthoritySha256 =
    '0'.repeat(64);

  assert.throws(
    () =>
      env.context
        .reosCountyCollapseOperationIntentOrphanBindingRecover(
          options
        ),
    /Collapse authority SHA/
  );

  assert.equal(
    env.state.propertyWrites,
    0
  );

  pass(
    'collapse authority drift fails before property mutation'
  );
}

expectFailure(
  env => {
    env.state.status.leaseState =
      'OPEN';

    env.state.status
      .leaseAuthorityGeneration =
      'CURRENT';

    env.state.status
      .leaseTransitionSafe =
      false;
  },
  /lease state/,
  0
);

pass(
  'non-ABSENT lease state fails before workbook/property mutation'
);

expectFailure(
  env => {
    env.state.status
      .operationIntentConfigured =
      true;

    env.state.status
      .operationIntentWorkbookIdSha256 =
      ORPHAN_SHA;
  },
  /prerequisite state/,
  0
);

pass(
  'existing runtime binding state cannot be replaced'
);

expectFailure(
  env => {
    env.state.activeId =
      FIXTURE_ID;
  },
  /collides with the active county-data workbook/,
  0
);

pass(
  'active county-data workbook can never become orphan recovery target'
);

expectFailure(
  env => {
    env.state.workbook.name =
      'Wrong Workbook';
  },
  /workbook name changed/,
  0
);

pass(
  'workbook-name drift fails before property mutation'
);

expectFailure(
  env => {
    env.state.workbook.sheets.push(
      new FakeSheet(
        'EXTRA',
        []
      )
    );
  },
  /exactly two journal sheets/,
  0
);

pass(
  'extra journal sheet fails before property mutation'
);

expectFailure(
  env => {
    env.state.workbook
      .getSheetByName(EVENT)
      .headers[0] =
      'Wrong Header';
  },
  /header mismatch/,
  0
);

pass(
  'event header drift fails before property mutation'
);

expectFailure(
  env => {
    env.state.workbook
      .getSheetByName(CHUNK)
      .formulas[0] =
      '=NOW()';
  },
  /contains a formula/,
  0
);

pass(
  'header formula fails before property mutation'
);

expectFailure(
  env => {
    env.state.workbook.editors = [
      new FakeUser(
        'editor@example.com'
      )
    ];
  },
  /additional editors/,
  0
);

pass(
  'additional editor fails before property mutation'
);

expectFailure(
  env => {
    env.state.workbook.viewers = [
      new FakeUser(
        'viewer@example.com'
      )
    ];
  },
  /additional viewers/,
  0
);

pass(
  'additional viewer fails before property mutation'
);

expectFailure(
  env => {
    env.state.effectiveEmail =
      'different-owner@example.com';
  },
  /not the certified orphan workbook owner/,
  0
);

pass(
  'effective operator must own the orphan workbook'
);

expectFailure(
  env => {
    env.state.workbook
      .getSheetByName(EVENT)
      .lastRow =
      2;
  },
  /journal is no longer empty/,
  0
);

pass(
  'event data row fails before property mutation'
);

expectFailure(
  env => {
    env.state.workbook
      .getSheetByName(CHUNK)
      .lastRow =
      2;
  },
  /journal is no longer empty/,
  0
);

pass(
  'chunk data row fails before property mutation'
);

expectFailure(
  env => {
    env.state.propertyValue =
      'CONCURRENT_EXISTING_BINDING';
  },
  /existing binding cannot be replaced/,
  0
);

pass(
  'binding appearing immediately before write fails closed'
);

{
  const env =
    environment();

  const result =
    env.context
      .reosCountyCollapseOperationIntentOrphanBindingRecover(
        request()
      );

  assert.equal(
    env.state.propertyWrites,
    1
  );

  assert.equal(
    env.state.propertyValue,
    FIXTURE_ID
  );

  assert.equal(
    env.state.openCalls,
    2
  );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.mode,
    'EXACT_ORPHAN_OPERATION_INTENT_BINDING_RECOVERED'
  );

  assert.equal(
    result.contractVersion,
    1
  );

  assert.equal(
    result.orphanWorkbookIdSha256,
    ORPHAN_SHA
  );

  assert.equal(
    result.propertyWriteExecuted,
    true
  );

  assert.equal(
    result.workbookCreated,
    false
  );

  assert.equal(
    result.provisioningExecuted,
    false
  );

  assert.equal(
    result.orphanRecoveryExecuted,
    true
  );

  assert.equal(
    result.schemaCertified,
    true
  );

  assert.equal(
    result.accessBindingCertified,
    true
  );

  assert.equal(
    result.eventDataRowCount,
    0
  );

  assert.equal(
    result.chunkDataRowCount,
    0
  );

  assert.equal(
    result.initialEmptyStoreCertified,
    true
  );

  AUTHORITY_FIELDS.forEach(field => {
    assert.equal(
      result[field],
      false,
      field
    );
  });

  assert.equal(
    JSON.stringify(result).includes(
      FIXTURE_ID
    ),
    false
  );

  pass(
    'successful recovery performs exactly one property binding and exposes only orphan hash'
  );
}

expectFailure(
  env => {
    env.state.readbackMismatch =
      true;
  },
  /property readback is ambiguous/,
  1
);

pass(
  'ambiguous post-write property readback fails closed after exactly one write'
);

expectFailure(
  env => {
    env.state.postWriteViewer =
      true;
  },
  /additional viewers/,
  1
);

pass(
  'post-write workbook drift fails closed after exactly one write with no retry'
);

console.log();
console.log(
  'ORPHAN_BINDING_RECOVERY_BEHAVIOR_CASES=' +
  caseCount
);

console.log(
  'PROPERTY_WRITE_CALL_SITES=1'
);

console.log(
  'WORKBOOK_CREATE_MUTATION_REACHABLE=false'
);

console.log(
  'WORKBOOK_EDIT_MUTATION_REACHABLE=false'
);

console.log(
  'WORKBOOK_DELETE_MUTATION_REACHABLE=false'
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

console.log(
  'OPERATION_INTENT_ORPHAN_BINDING_RECOVERY_IMPLEMENTATION_VALIDATION_PASSED=true'
);
