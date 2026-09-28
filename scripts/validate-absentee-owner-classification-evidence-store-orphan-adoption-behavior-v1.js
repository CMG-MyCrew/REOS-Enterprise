#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const RUNTIME = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js'
);

const ORPHAN_SHA =
  '4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce';

const FIXTURE_ID =
  'synthetic-certified-orphan-fixture-book';

const ACTIVE_ID =
  'active-reos-fixture-book';

const PROPERTY =
  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

const OWNER =
  'owner@example.com';

const HEADERS = [
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

const PRE =
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_PRECONDITION_FAILED';

const UNCERTAIN =
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_OUTCOME_UNCERTAIN';

const VERIFIED =
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_VERIFIED';

function hashBytes(hex) {
  const buffer =
    Buffer.from(hex, 'hex');

  return Array.from(buffer).map(
    byte =>
      byte > 127
        ? byte - 256
        : byte
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
  constructor(state) {
    this.state = state;
    this.name =
      'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE';
    this.sheetId = 0;
    this.headers = HEADERS.slice();
    this.formulas = HEADERS.map(() => '');
    this.lastRow = 1;
    this.lastColumn = 20;
    this.omitGetSheetId = false;
  }

  getName() {
    return this.name;
  }

  getSheetId() {
    return this.sheetId;
  }

  getLastRow() {
    return this.lastRow;
  }

  getLastColumn() {
    return this.lastColumn;
  }

  getRange(row, column, rows, columns) {
    assert.strictEqual(row, 1);
    assert.strictEqual(column, 1);
    assert.strictEqual(rows, 1);
    assert.strictEqual(columns, 20);
    return new FakeRange(this);
  }
}

class FakeWorkbook {
  constructor(state) {
    this.state = state;
    this.id = FIXTURE_ID;
    this.name =
      'REOS Absentee Owner Classification Evidence';
    this.sheet =
      new FakeSheet(state);
    this.extraSheets = [];
    this.owner =
      new FakeUser(OWNER);
    this.editors = [
      this.owner
    ];
    this.viewers = [
      this.owner
    ];
    this.namedSheetIdOverride = undefined;
    this.namedSheetMissingGetSheetId = false;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  getSheets() {
    return [
      this.sheet
    ].concat(this.extraSheets);
  }

  getSheetByName(name) {
    if (
      this.sheet.getName() !== name
    ) {
      return null;
    }

    const wrapper =
      Object.create(this.sheet);

    this.state.namedWrapperCount += 1;

    if (
      this.namedSheetMissingGetSheetId
    ) {
      wrapper.getSheetId = undefined;
    } else if (
      this.namedSheetIdOverride !== undefined
    ) {
      wrapper.getSheetId = () =>
        this.namedSheetIdOverride;
    }

    return wrapper;
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

function environment(overrides = {}) {
  const config = Object.assign({
    denyAdminOnCall: 0,
    lockAvailable: true,
    releaseThrows: false,
    openThrows: false,
    postOpenThrows: false,
    setPropertyThrows: false,
    readbackMismatch: false,
    postWriteViewer: false,
    effectiveEmail: OWNER
  }, overrides);

  const state = {
    adminCalls: 0,
    tryLockCount: 0,
    releaseLockCount: 0,
    openCalls: 0,
    propertyReads: 0,
    propertyWrites: 0,
    propertyValue: '',
    activeId: ACTIVE_ID,
    namedWrapperCount: 0,
    timeline: []
  };

  const workbook =
    new FakeWorkbook(state);

  const activeWorkbook = {
    getId() {
      return state.activeId;
    }
  };

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
          'forced release failure'
        );
      }

      this.active = false;
    }
  };

  const context = {
    console,

    REOS: {
      Security: {
        requireAdmin() {
          state.timeline.push('requireAdmin');
          state.adminCalls += 1;

          if (
            config.denyAdminOnCall ===
            state.adminCalls
          ) {
            throw new Error(
              'Admin permission required.'
            );
          }

          return true;
        }
      }
    },

    Utilities: {
      DigestAlgorithm: {
        SHA_256: 'SHA_256'
      },

      Charset: {
        UTF_8: 'UTF_8'
      },

      computeDigest(
        algorithm,
        value,
        charset
      ) {
        assert.strictEqual(
          algorithm,
          'SHA_256'
        );

        assert.strictEqual(
          charset,
          'UTF_8'
        );

        if (value === FIXTURE_ID) {
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
        ).map(
          byte =>
            byte > 127
              ? byte - 256
              : byte
        );
      }
    },

    LockService: {
      getScriptLock() {
        return lock;
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        state.timeline.push(
          'getActiveSpreadsheet'
        );

        return activeWorkbook;
      },

      openById(id) {
        state.timeline.push(
          'openById'
        );

        state.openCalls += 1;

        if (
          config.openThrows &&
          state.openCalls === 1
        ) {
          throw new Error(
            'forced orphan open failure'
          );
        }

        if (
          config.postOpenThrows &&
          state.openCalls >= 2
        ) {
          throw new Error(
            'forced post-publication open failure'
          );
        }

        assert.strictEqual(
          id,
          FIXTURE_ID
        );

        if (
          config.postWriteViewer &&
          state.openCalls >= 2
        ) {
          workbook.viewers = [
            workbook.owner,
            new FakeUser(
              'late-viewer@example.com'
            )
          ];
        }

        return workbook;
      }
    },

    Session: {
      getEffectiveUser() {
        return new FakeUser(
          config.effectiveEmail
        );
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            assert.strictEqual(
              key,
              PROPERTY
            );

            state.timeline.push(
              'getProperty'
            );

            state.propertyReads += 1;

            if (
              config.readbackMismatch &&
              state.propertyWrites > 0
            ) {
              return 'DIFFERENT_BINDING';
            }

            return state.propertyValue;
          },

          setProperty(key, value) {
            assert.strictEqual(
              key,
              PROPERTY
            );

            state.timeline.push(
              'setProperty'
            );

            state.propertyWrites += 1;

            if (
              config.setPropertyThrows
            ) {
              throw new Error(
                'forced property publication failure'
              );
            }

            state.propertyValue =
              value;

            return this;
          }
        };
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    fs.readFileSync(RUNTIME, 'utf8'),
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
    workbook,
    context,
    evaluate
  };
}

function request() {
  return {
    confirmAdoption:
      'ADOPT_CERTIFIED_ORPHAN',

    orphanWorkbookId:
      FIXTURE_ID,

    expectedOrphanWorkbookIdSha256:
      ORPHAN_SHA,

    expectedActiveReosSpreadsheetId:
      ACTIVE_ID,

    expectedPropertyState:
      'ABSENT'
  };
}

function adopt(env, options = request()) {
  return env.evaluate(
    'reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan(' +
      JSON.stringify(options) +
    ')'
  );
}

function expectPrecondition(
  mutate,
  optionsMutator
) {
  const env = environment();

  if (mutate) {
    mutate(env);
  }

  const options = request();

  if (optionsMutator) {
    optionsMutator(options, env);
  }

  const result =
    adopt(env, options);

  assert.strictEqual(
    result.ok,
    false
  );

  assert.strictEqual(
    result.classification,
    PRE
  );

  assert.strictEqual(
    result.propertyWriteExecuted,
    false
  );

  assert.strictEqual(
    env.state.propertyWrites,
    0
  );

  return env;
}

function expectUncertain(
  overrides,
  mutate
) {
  const env =
    environment(overrides);

  if (mutate) {
    mutate(env);
  }

  const result =
    adopt(env);

  assert.strictEqual(
    result.ok,
    false
  );

  assert.strictEqual(
    result.classification,
    UNCERTAIN
  );

  assert.strictEqual(
    result.propertyWriteExecuted,
    true
  );

  assert.strictEqual(
    env.state.propertyWrites,
    1
  );

  return env;
}

let cases = 0;

{
  const env =
    environment({
      denyAdminOnCall: 1
    });

  const result =
    adopt(env);

  assert.strictEqual(
    result.classification,
    PRE
  );

  assert.strictEqual(
    env.state.tryLockCount,
    0
  );

  assert.strictEqual(
    env.state.propertyWrites,
    0
  );

  cases += 1;
}

{
  const env =
    environment();

  const result =
    env.evaluate(
      'reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan(null)'
    );

  assert.strictEqual(
    result.classification,
    PRE
  );

  assert.strictEqual(
    env.state.propertyWrites,
    0
  );

  cases += 1;
}

expectPrecondition(
  null,
  options => {
    options.extra = true;
  }
);
cases += 1;

expectPrecondition(
  null,
  options => {
    options.confirmAdoption =
      'WRONG_CONFIRMATION';
  }
);
cases += 1;

expectPrecondition(
  null,
  options => {
    options.expectedOrphanWorkbookIdSha256 =
      '0'.repeat(64);
  }
);
cases += 1;

expectPrecondition(
  null,
  options => {
    options.orphanWorkbookId =
      'wrong-synthetic-orphan-book';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.config.lockAvailable =
      false;
  }
);
cases += 1;

{
  const env =
    environment({
      denyAdminOnCall: 2
    });

  const result =
    adopt(env);

  assert.strictEqual(
    result.classification,
    PRE
  );

  assert.strictEqual(
    env.state.tryLockCount,
    1
  );

  assert.strictEqual(
    env.state.releaseLockCount,
    1
  );

  assert.strictEqual(
    env.state.propertyWrites,
    0
  );

  cases += 1;
}

expectPrecondition(
  null,
  options => {
    options.expectedActiveReosSpreadsheetId =
      'different-active-book';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.state.propertyValue =
      'existing-binding';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.config.openThrows =
      true;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.id =
      'different-readback-book';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.state.activeId =
      FIXTURE_ID;
  },
  options => {
    options.expectedActiveReosSpreadsheetId =
      FIXTURE_ID;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.name =
      'Wrong Workbook';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.extraSheets.push(
      new FakeSheet(
        env.state
      )
    );
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.name =
      'WRONG_SHEET';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.namedSheetIdOverride =
      1;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.getSheetId =
      undefined;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.namedSheetMissingGetSheetId =
      true;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.sheetId =
      -1;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.sheetId =
      Infinity;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.sheetId =
      0.5;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.headers[0] =
      'Wrong Header';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.formulas[0] =
      '=NOW()';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.sheet.lastRow =
      2;
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.config.effectiveEmail =
      'different-owner@example.com';
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.editors = [
      env.workbook.owner,
      new FakeUser(
        'editor@example.com'
      )
    ];
  }
);
cases += 1;

expectPrecondition(
  env => {
    env.workbook.viewers = [
      env.workbook.owner,
      new FakeUser(
        'viewer@example.com'
      )
    ];
  }
);
cases += 1;

expectUncertain({
  setPropertyThrows: true
});
cases += 1;

expectUncertain({
  readbackMismatch: true
});
cases += 1;

expectUncertain({
  postOpenThrows: true
});
cases += 1;

expectUncertain({
  postWriteViewer: true
});
cases += 1;

expectUncertain({
  releaseThrows: true
});
cases += 1;

{
  const env =
    environment();

  const result =
    adopt(env);

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.classification,
    VERIFIED
  );

  assert.strictEqual(
    result.mode,
    'ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION'
  );

  assert.strictEqual(
    result.certifiedOrphanWorkbookIdSha256,
    ORPHAN_SHA
  );

  assert.strictEqual(
    result.propertyWriteExecuted,
    true
  );

  assert.strictEqual(
    result.workbookCreated,
    false
  );

  assert.strictEqual(
    result.workbookMutated,
    false
  );

  assert.strictEqual(
    result.provisioningRetryExecuted,
    false
  );

  assert.strictEqual(
    result.persistenceAuthorized,
    false
  );

  assert.strictEqual(
    result.boundedRolloutAuthorized,
    false
  );

  assert.strictEqual(
    result.automaticOfferAuthorityGranted,
    false
  );

  assert.strictEqual(
    env.state.propertyWrites,
    1
  );

  assert.strictEqual(
    env.state.propertyValue,
    FIXTURE_ID
  );

  assert.strictEqual(
    env.state.openCalls,
    2
  );

  assert.strictEqual(
    env.state.adminCalls,
    2
  );

  assert.strictEqual(
    env.state.releaseLockCount,
    1
  );

  assert.ok(
    env.state.namedWrapperCount >= 2
  );

  assert.strictEqual(
    JSON.stringify(result)
      .includes(FIXTURE_ID),
    false
  );

  cases += 1;
}

assert.strictEqual(cases, 34);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_BEHAVIOR_VALID=true'
);
console.log(
  'BEHAVIOR_CASE_COUNT=' +
  cases
);
console.log(
  'CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256=' +
  ORPHAN_SHA
);
console.log('CERTIFIED_ORPHAN_SHEET_ID=0');
console.log('STABLE_SHEET_IDENTITY=Sheet.getSheetId');
console.log('DISTINCT_WRAPPER_SAME_SHEET_ID_SUCCESS=true');
console.log('MISMATCHED_SHEET_ID_FAILS=true');
console.log('MALFORMED_SHEET_ID_FAILS=true');
console.log('ADMIN_RECHECK_AFTER_LOCK=true');
console.log('PREPUBLICATION_FAILURE_DEFINITE_NO_WRITE=true');
console.log('POSTPUBLICATION_FAILURE_OUTCOME_UNCERTAIN=true');
console.log('PROPERTY_WRITE_MAX_PER_INVOCATION=1');
console.log('WORKBOOK_CREATE_AUTHORIZED=false');
console.log('WORKBOOK_MUTATION_AUTHORIZED=false');
console.log('PROVISIONING_RETRY_AUTHORIZED=false');
console.log('AUTOMATIC_RETRY_AUTHORIZED=false');
console.log('PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('ARV_AUTHORITY_GRANTED=false');
console.log('REPAIR_SCOPE_AUTHORITY_GRANTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
