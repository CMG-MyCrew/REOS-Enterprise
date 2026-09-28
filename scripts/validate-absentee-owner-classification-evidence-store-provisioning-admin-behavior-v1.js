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
  'AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js'
);

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

class FakeRange {
  constructor(sheet) {
    this.sheet = sheet;
  }

  setValues(values) {
    this.sheet.state.timeline.push('setValues');
    this.sheet.state.setValuesCount += 1;

    if (this.sheet.config.failSetValues) {
      throw new Error('forced setValues failure');
    }

    assert.ok(Array.isArray(values));
    assert.strictEqual(values.length, 1);

    this.sheet.headers = values[0].slice();
    this.sheet.formulas = this.sheet.headers.map(() => '');

    if (this.sheet.config.corruptHeaderAfterWrite) {
      this.sheet.headers[0] = 'Wrong Header';
    }

    if (this.sheet.config.formulaAfterWrite) {
      this.sheet.formulas[0] = '=NOW()';
    }

    this.sheet.headerWritten = true;
    return this;
  }

  getValues() {
    this.sheet.state.timeline.push('getValues');
    return [this.sheet.headers.slice()];
  }

  getFormulas() {
    this.sheet.state.timeline.push('getFormulas');
    return [this.sheet.formulas.slice()];
  }
}

class FakeSheet {
  constructor(name, state, config) {
    this.name = name;
    this.state = state;
    this.config = config || {};
    this.headers = (this.config.headers || []).slice();
    this.formulas = (
      this.config.formulas ||
      this.headers.map(() => '')
    ).slice();
    this.headerWritten = this.headers.length > 0;
    this.dataRows = Number(this.config.dataRows || 0);
    this.sheetId =
      this.config.sheetId === undefined
        ? 0
        : this.config.sheetId;

    if (this.config.omitGetSheetId) {
      this.getSheetId = undefined;
    }
  }

  setName(name) {
    this.state.timeline.push('setName');
    this.state.setNameCount += 1;

    if (this.config.failSetName) {
      throw new Error('forced setName failure');
    }

    this.name =
      this.config.forcedNameAfterSet ||
      name;

    return this;
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

  getRange(row, column, numRows, numColumns) {
    assert.strictEqual(row, 1);
    assert.strictEqual(column, 1);
    assert.strictEqual(numRows, 1);
    assert.strictEqual(numColumns, 20);
    return new FakeRange(this);
  }
}

class FakeWorkbook {
  constructor(id, state, sheets, config = {}) {
    this.id = id;
    this.state = state;
    this.sheets = sheets || [];
    this.config = config;
  }

  getId() {
    return this.id;
  }

  getSheets() {
    return this.sheets.slice();
  }

  getSheetByName(name) {
    const found =
      this.sheets.find(
        sheet =>
          sheet.getName() === name
      ) || null;

    if (!found) {
      return null;
    }

    if (!this.config.distinctNamedWrapper) {
      return found;
    }

    this.state.namedWrapperCount += 1;

    const wrapper =
      Object.create(found);

    if (this.config.namedSheetMissingGetSheetId) {
      wrapper.getSheetId = undefined;
    } else if (
      this.config.namedSheetIdOverride !== undefined
    ) {
      wrapper.getSheetId = () =>
        this.config.namedSheetIdOverride;
    }

    return wrapper;
  }
}

function makeEnvironment(overrides = {}) {
  const config = Object.assign({
    activeId: 'active-reos-book',
    propertyValue: '',
    denyAdmin: false,
    lockAvailable: true,
    createThrows: false,
    createdId: 'new-evidence-book',
    initialSheetCount: 1,
    failSetName: false,
    failSetValues: false,
    flushThrows: false,
    setPropertyThrows: false,
    propertyReadbackMismatch: false,
    postOpenThrows: false,
    releaseThrows: false,
    existingOpenThrows: false,
    existingSheetPresent: true,
    existingHeaders: HEADERS,
    existingFormulas: HEADERS.map(() => ''),
    existingDataRows: 2,
    createdSheetId: 0,
    createdNamedSheetId: undefined,
    createdPositionalMissingGetSheetId: false,
    createdNamedMissingGetSheetId: false,
    forcedNameAfterSet: '',
    corruptHeaderAfterWrite: false,
    formulaAfterWrite: false
  }, overrides);

  const state = {
    adminCalls: 0,
    createCount: 0,
    flushCount: 0,
    setPropertyCount: 0,
    propertyGetCount: 0,
    openByIdCount: 0,
    tryLockCount: 0,
    releaseLockCount: 0,
    setNameCount: 0,
    setValuesCount: 0,
    namedWrapperCount: 0,
    timeline: [],
    propertyValue: config.propertyValue,
    createdBook: null
  };

  const activeBook = new FakeWorkbook(
    config.activeId,
    state,
    []
  );

  const existingSheets = [];

  if (config.existingSheetPresent) {
    existingSheets.push(
      new FakeSheet(
        'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',
        state,
        {
          headers: config.existingHeaders,
          formulas: config.existingFormulas,
          dataRows: config.existingDataRows
        }
      )
    );
  }

  const existingBook = new FakeWorkbook(
    config.propertyValue || 'configured-evidence-book',
    state,
    existingSheets
  );

  const lock = {
    active: false,

    tryLock(milliseconds) {
      state.timeline.push('tryLock');
      state.tryLockCount += 1;
      assert.strictEqual(milliseconds, 1000);

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
        throw new Error('forced release failure');
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
            throw new Error('Admin permission required.');
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
            assert.strictEqual(
              key,
              'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID'
            );

            state.timeline.push('getProperty');
            state.propertyGetCount += 1;

            if (
              config.propertyReadbackMismatch &&
              state.setPropertyCount > 0
            ) {
              return 'wrong-readback-id';
            }

            return state.propertyValue;
          },

          setProperty(key, value) {
            assert.strictEqual(
              key,
              'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID'
            );

            state.timeline.push('setProperty');
            state.setPropertyCount += 1;

            if (config.setPropertyThrows) {
              throw new Error('forced setProperty failure');
            }

            state.propertyValue = value;
            return this;
          }
        };
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        state.timeline.push('getActiveSpreadsheet');
        return activeBook;
      },

      create(name) {
        state.timeline.push('create');
        state.createCount += 1;
        assert.strictEqual(
          name,
          'REOS Absentee Owner Classification Evidence'
        );

        if (config.createThrows) {
          throw new Error('forced create failure');
        }

        const sheets = [];

        for (let i = 0; i < config.initialSheetCount; i += 1) {
          sheets.push(
            new FakeSheet(
              'Sheet' + (i + 1),
              state,
              {
                failSetName: config.failSetName,
                failSetValues: config.failSetValues,
                sheetId: config.createdSheetId,
                omitGetSheetId:
                  config.createdPositionalMissingGetSheetId,
                forcedNameAfterSet:
                  config.forcedNameAfterSet,
                corruptHeaderAfterWrite:
                  config.corruptHeaderAfterWrite,
                formulaAfterWrite:
                  config.formulaAfterWrite
              }
            )
          );
        }

        state.createdBook = new FakeWorkbook(
          config.createdId,
          state,
          sheets,
          {
            distinctNamedWrapper: true,
            namedSheetMissingGetSheetId:
              config.createdNamedMissingGetSheetId,
            namedSheetIdOverride:
              config.createdNamedSheetId
          }
        );

        return state.createdBook;
      },

      openById(id) {
        state.timeline.push('openById');
        state.openByIdCount += 1;

        if (
          state.createdBook &&
          id === state.createdBook.getId()
        ) {
          if (config.postOpenThrows) {
            throw new Error('forced post-open failure');
          }

          return state.createdBook;
        }

        if (
          state.propertyValue &&
          id === state.propertyValue
        ) {
          if (config.existingOpenThrows) {
            throw new Error('forced existing-open failure');
          }

          return existingBook;
        }

        throw new Error('unexpected workbook id: ' + id);
      },

      flush() {
        state.timeline.push('flush');
        state.flushCount += 1;

        if (config.flushThrows) {
          throw new Error('forced flush failure');
        }
      }
    }
  };

  const context = vm.createContext(sandbox);

  vm.runInContext(
    fs.readFileSync(RUNTIME, 'utf8'),
    context,
    {
      filename: path.basename(RUNTIME)
    }
  );

  function evaluate(source) {
    return vm.runInContext(source, context);
  }

  return {
    config,
    state,
    context,
    evaluate
  };
}

function inspect(env, expression = '{}') {
  return env.evaluate(
    'reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(' +
    expression +
    ')'
  );
}

function provision(env, activeId = 'active-reos-book') {
  return env.evaluate(
    'reosAbsenteeOwnerClassificationEvidenceStoreProvision({' +
      'expectedActiveReosSpreadsheetId:' + JSON.stringify(activeId) + ',' +
      'expectedPropertyState:"ABSENT"' +
    '})'
  );
}

let cases = 0;

{
  const env = makeEnvironment();
  const result = inspect(env);
  assert.strictEqual(result.classification, 'UNPROVISIONED');
  assert.strictEqual(result.propertyPresent, false);
  assert.strictEqual(result.provisioningRequired, true);
  assert.strictEqual(result.persistenceAuthorized, false);
  assert.strictEqual(env.state.createCount, 0);
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    propertyValue: 'configured-evidence-book'
  });
  const result = inspect(env);
  assert.strictEqual(result.classification, 'ALREADY_PROVISIONED');
  assert.strictEqual(result.schemaExact, true);
  assert.strictEqual(result.headerFormulasPresent, false);
  assert.strictEqual(result.provisioningRequired, false);
  assert.strictEqual(env.state.createCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    propertyValue: 'active-reos-book'
  });
  const result = inspect(env);
  assert.strictEqual(result.classification, 'UNSAFE_ACTIVE_REOS_ALIAS');
  assert.strictEqual(result.configuredWorkbookDiffersFromActiveReos, false);
  assert.strictEqual(env.state.openByIdCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    propertyValue: 'configured-evidence-book',
    existingOpenThrows: true
  });
  const result = inspect(env);
  assert.strictEqual(result.classification, 'CONFIGURED_WORKBOOK_UNOPENABLE');
  cases += 1;
}

{
  const env = makeEnvironment({
    propertyValue: 'configured-evidence-book',
    existingSheetPresent: false
  });
  const result = inspect(env);
  assert.strictEqual(result.classification, 'CONFIGURED_SHEET_MISSING');
  cases += 1;
}

{
  const badHeaders = HEADERS.slice();
  badHeaders[4] = 'Wrong Header';
  const env = makeEnvironment({
    propertyValue: 'configured-evidence-book',
    existingHeaders: badHeaders
  });
  const result = inspect(env);
  assert.strictEqual(result.classification, 'CONFIGURED_SCHEMA_INVALID');
  cases += 1;
}

{
  const formulas = HEADERS.map(() => '');
  formulas[0] = '=NOW()';
  const env = makeEnvironment({
    propertyValue: 'configured-evidence-book',
    existingFormulas: formulas
  });
  const result = inspect(env);
  assert.strictEqual(result.classification, 'CONFIGURED_SCHEMA_INVALID');
  assert.strictEqual(result.headerFormulasPresent, true);
  cases += 1;
}

{
  const env = makeEnvironment();
  assert.throws(
    () => inspect(env, '{unexpected:true}'),
    /Inspection options must be absent or an exact empty object/
  );
  assert.strictEqual(env.state.createCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment();
  const result = provision(env);

  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED'
  );
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.evidenceWorkbookId, 'new-evidence-book');
  assert.strictEqual(result.schemaExact, true);
  assert.strictEqual(result.evidenceRowCount, 0);
  assert.strictEqual(result.persistenceAuthorized, false);
  assert.strictEqual(result.boundedRolloutAuthorized, false);
  assert.strictEqual(result.automaticOfferAuthorityGranted, false);

  assert.strictEqual(env.state.adminCalls, 2);
  assert.strictEqual(env.state.tryLockCount, 1);
  assert.strictEqual(env.state.createCount, 1);
  assert.strictEqual(env.state.setNameCount, 1);
  assert.strictEqual(env.state.setValuesCount, 1);
  assert.strictEqual(env.state.flushCount, 1);
  assert.strictEqual(env.state.setPropertyCount, 1);
  assert.strictEqual(env.state.releaseLockCount, 1);
  assert.strictEqual(env.state.propertyValue, 'new-evidence-book');
  assert.ok(
    env.state.namedWrapperCount >= 2,
    'success must tolerate different JavaScript wrappers with the same stable sheet ID'
  );

  const timeline = env.state.timeline;
  assert.ok(timeline.indexOf('create') < timeline.indexOf('setName'));
  assert.ok(timeline.indexOf('setName') < timeline.indexOf('setValues'));
  assert.ok(timeline.indexOf('setValues') < timeline.indexOf('flush'));
  assert.ok(timeline.indexOf('flush') < timeline.indexOf('setProperty'));
  assert.ok(timeline.indexOf('setProperty') < timeline.lastIndexOf('openById'));
  assert.ok(timeline.lastIndexOf('openById') < timeline.indexOf('releaseLock'));
  cases += 1;
}

{
  const env = makeEnvironment();
  const result = provision(env, 'different-active-id');
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_PRECONDITION_FAILED'
  );
  assert.strictEqual(env.state.createCount, 0);
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    propertyValue: 'already-configured'
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_PRECONDITION_FAILED'
  );
  assert.strictEqual(env.state.createCount, 0);
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    lockAvailable: false
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_PRECONDITION_FAILED'
  );
  assert.strictEqual(env.state.createCount, 0);
  assert.strictEqual(env.state.releaseLockCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    createThrows: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(result.evidenceWorkbookId, '');
  assert.strictEqual(env.state.createCount, 1);
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    initialSheetCount: 2
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(result.evidenceWorkbookId, 'new-evidence-book');
  assert.strictEqual(env.state.createCount, 1);
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    failSetValues: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(result.evidenceWorkbookId, 'new-evidence-book');
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    flushThrows: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.flushCount, 1);
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    setPropertyThrows: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(result.evidenceWorkbookId, 'new-evidence-book');
  assert.strictEqual(env.state.setPropertyCount, 1);
  assert.strictEqual(env.state.createCount, 1);
  cases += 1;
}

{
  const env = makeEnvironment({
    propertyReadbackMismatch: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(result.evidenceWorkbookId, 'new-evidence-book');
  assert.strictEqual(env.state.createCount, 1);
  assert.strictEqual(env.state.setPropertyCount, 1);
  cases += 1;
}

{
  const env = makeEnvironment({
    postOpenThrows: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(result.evidenceWorkbookId, 'new-evidence-book');
  assert.strictEqual(env.state.createCount, 1);
  cases += 1;
}


{
  const env = makeEnvironment({
    releaseThrows: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(result.evidenceWorkbookId, 'new-evidence-book');
  assert.strictEqual(env.state.createCount, 1);
  assert.strictEqual(env.state.setPropertyCount, 1);
  assert.strictEqual(env.state.releaseLockCount, 1);
  cases += 1;
}

{
  const env = makeEnvironment({
    denyAdmin: true
  });
  assert.throws(
    () => provision(env),
    /Admin permission required/
  );
  assert.strictEqual(env.state.tryLockCount, 0);
  assert.strictEqual(env.state.createCount, 0);
  cases += 1;
}


{
  const env = makeEnvironment({
    createdNamedSheetId: 1
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    createdPositionalMissingGetSheetId: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    createdNamedMissingGetSheetId: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    createdSheetId: -1
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    createdSheetId: Infinity
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    createdSheetId: 1.5
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    forcedNameAfterSet: 'WRONG_SHEET'
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    corruptHeaderAfterWrite: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

{
  const env = makeEnvironment({
    formulaAfterWrite: true
  });
  const result = provision(env);
  assert.strictEqual(
    result.classification,
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN'
  );
  assert.strictEqual(env.state.setPropertyCount, 0);
  cases += 1;
}

assert.strictEqual(cases, 30);


console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_ADMIN_BEHAVIOR_VALID=true'
);
console.log('BEHAVIOR_CASE_COUNT=' + cases);
console.log('STABLE_SHEET_IDENTITY=Sheet.getSheetId');
console.log('WRAPPER_REFERENCE_IDENTITY_AUTHORIZED=false');
console.log('DISTINCT_WRAPPER_SAME_SHEET_ID_SUCCESS=true');
console.log('MISMATCHED_SHEET_ID_FAILS=true');
console.log('MALFORMED_SHEET_ID_FAILS=true');
console.log('INSPECTION_MUTATION_AUTHORIZED=false');
console.log('PROVISIONING_WORKBOOK_CREATE_MAX_PER_INVOCATION=1');
console.log('PROVISIONING_EXPLICIT_FLUSH_MAX_PER_INVOCATION=1');
console.log('PROVISIONING_SCRIPT_PROPERTY_PUBLICATION_MAX_PER_INVOCATION=1');
console.log('PRECREATE_FAILURE_DEFINITE_NO_MUTATION=true');
console.log('POSTCREATE_FAILURE_OUTCOME_UNCERTAIN=true');
console.log('UNCERTAIN_RESPONSE_PRESERVES_CREATED_WORKBOOK_ID=true');
console.log('AUTOMATIC_RETRY_AUTHORIZED=false');
console.log('PERSISTENCE_AUTHORITY_GRANTED=false');
console.log('BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
