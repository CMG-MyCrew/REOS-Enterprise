'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const executorPath = path.join(
  root,
  'build/apps-script-brand/CompsReadinessEvidenceStorageProvisioningExecutor.js'
);

const provisioningPath = path.join(
  root,
  'build/apps-script-brand/CompsReadinessEvidenceStorageProvisioning.js'
);

const fixturePath = path.join(
  root,
  'scripts/fixtures/live-administrative-comps-readiness-evidence-storage-provisioning-executor-v1.json'
);

const executorSource =
  fs.readFileSync(executorPath, 'utf8');

const fixture = JSON.parse(
  fs.readFileSync(fixturePath, 'utf8')
);

const executor = require(executorPath);
const provisioning = require(provisioningPath);

function pass(message) {
  process.stdout.write(`PASS: ${message}\n`);
}

function makeSheet(name, headers) {
  let values = headers ? headers.slice() : [];

  return {
    getName() {
      return name;
    },

    getLastColumn() {
      return values.length;
    },

    getLastRow() {
      return values.length ? 1 : 0;
    },

    getRange(row, column, rows, columns) {
      assert.strictEqual(row, 1);
      assert.strictEqual(column, 1);
      assert.strictEqual(rows, 1);

      return {
        getValues() {
          return [values.slice(0, columns)];
        },

        setValues(input) {
          assert.ok(Array.isArray(input));
          assert.strictEqual(input.length, 1);
          assert.strictEqual(
            input[0].length,
            columns
          );

          values = input[0].slice();
          return this;
        }
      };
    },

    snapshot() {
      return values.slice();
    }
  };
}

function makeHarness(config = {}) {
  const expectedIdentity =
    config.expectedIdentity === undefined
      ? fixture.expectedSpreadsheetIdentity
      : config.expectedIdentity;

  const resolvedIdentity =
    config.resolvedIdentity === undefined
      ? fixture.requestedSpreadsheetIdentity
      : config.resolvedIdentity;

  const sheets = new Map();
  const events = [];

  const initialSheets = config.initialSheets || {};

  Object.keys(initialSheets).forEach(name => {
    sheets.set(
      name,
      makeSheet(name, initialSheets[name])
    );
  });

  const spreadsheet = {
    getId() {
      events.push('spreadsheet.getId');
      return resolvedIdentity;
    },

    getSheetByName(name) {
      events.push(`spreadsheet.getSheetByName:${name}`);
      return sheets.get(name) || null;
    },

    insertSheet(name) {
      events.push(`spreadsheet.insertSheet:${name}`);

      if (config.failCreate === name) {
        throw new Error('simulated create failure');
      }

      if (sheets.has(name)) {
        throw new Error('duplicate sheet');
      }

      const sheet = makeSheet(name, []);
      sheets.set(name, sheet);
      return sheet;
    }
  };

  const lock = {
    released: false,

    tryLock(timeout) {
      events.push(`lock.tryLock:${timeout}`);
      return config.lockAvailable !== false;
    },

    releaseLock() {
      events.push('lock.releaseLock');
      this.released = true;
    }
  };

  const runtime = {
    openSpreadsheetById(id) {
      events.push(`openSpreadsheetById:${id}`);

      if (config.openThrows) {
        throw new Error('simulated open failure');
      }

      return spreadsheet;
    },

    getExpectedSpreadsheetIdentity() {
      events.push('getExpectedSpreadsheetIdentity');
      return expectedIdentity;
    },

    getSheetByName(target, name) {
      assert.strictEqual(target, spreadsheet);

      if (config.failRead === name) {
        throw new Error('simulated read failure');
      }

      return target.getSheetByName(name);
    },

    insertSheet(target, name) {
      assert.strictEqual(target, spreadsheet);
      return target.insertSheet(name);
    },

    getScriptLock() {
      events.push('getScriptLock');

      if (config.lockThrows) {
        throw new Error('simulated lock failure');
      }

      return lock;
    },

    flush() {
      events.push('flush');
    }
  };

  return {
    runtime,
    spreadsheet,
    sheets,
    events,
    lock
  };
}

assert.strictEqual(executor.VERSION, 'v1');
assert.strictEqual(
  executor.EXPECTED_SPREADSHEET_PROPERTY,
  'REOS_PRODUCTION_SPREADSHEET_ID'
);
assert.strictEqual(executor.LOCK_TIMEOUT_MS, 30000);

pass('executor exports the certified v1 administrative surface');

[
  'SpreadsheetApp.openById',
  'PropertiesService',
  'LockService.getScriptLock',
  'SpreadsheetApp.flush'
].forEach(marker => {
  assert.ok(
    executorSource.includes(marker),
    `missing live-capable primitive: ${marker}`
  );
});

assert.ok(
  !executorSource.includes('getActiveSpreadsheet'),
  'executor must not use active-spreadsheet fallback'
);

[
  'UrlFetchApp',
  'ScriptApp.newTrigger',
  'appendDealArvEvidence',
  'appendDealRepairScopeEvidence',
  'appendDealOfferReadinessEvidence',
  'MAO',
  'generateOffer',
  'submitOffer'
].forEach(marker => {
  assert.ok(
    !executorSource.includes(marker),
    `forbidden authority marker present: ${marker}`
  );
});

pass('executor is explicit-binding only and contains no provider, persistence, trigger, MAO, or offer path');

{
  const harness = makeHarness();

  const outcome = executor.execute(
    {
      authorized: false,
      spreadsheetIdentity:
        fixture.requestedSpreadsheetIdentity
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(
    outcome.outcome,
    'rejected_authorization'
  );

  assert.deepStrictEqual(harness.events, []);
}

pass('authorization defaults fail closed before any spreadsheet access');

{
  const harness = makeHarness();

  const outcome = executor.execute(
    {
      authorized: true,
      spreadsheetIdentity: ''
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(
    outcome.outcome,
    'rejected_spreadsheet_identity'
  );

  assert.deepStrictEqual(harness.events, []);
}

pass('blank requested spreadsheet identity fails before live access');

{
  const harness = makeHarness({
    expectedIdentity:
      fixture.expectedSpreadsheetIdentity,
    resolvedIdentity:
      fixture.wrongSpreadsheetIdentity
  });

  const outcome = executor.execute(
    {
      authorized: true,
      spreadsheetIdentity:
        fixture.wrongSpreadsheetIdentity
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(
    outcome.outcome,
    'rejected_spreadsheet_identity'
  );

  assert.strictEqual(
    harness.events.some(
      event => event.startsWith('spreadsheet.insertSheet:')
    ),
    false
  );
}

pass('mismatched production identity cannot create storage');

{
  const harness = makeHarness({
    lockAvailable: false
  });

  const outcome = executor.execute(
    {
      authorized: true,
      spreadsheetIdentity:
        fixture.requestedSpreadsheetIdentity
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(outcome.outcome, 'failed_lock');

  assert.strictEqual(
    harness.events.some(
      event => event.startsWith('spreadsheet.insertSheet:')
    ),
    false
  );
}

pass('lock failure prevents provisioning mutation');

{
  const harness = makeHarness();

  const outcome = executor.execute(
    {
      authorized: true,
      spreadsheetIdentity:
        fixture.requestedSpreadsheetIdentity
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(outcome.outcome, 'provisioned');
  assert.strictEqual(outcome.ready, true);

  assert.deepStrictEqual(
    outcome.createdTables,
    [
      'DEAL_ARV_EVIDENCE',
      'DEAL_REPAIR_SCOPE_EVIDENCE',
      'DEAL_OFFER_READINESS_EVIDENCE'
    ]
  );

  assert.strictEqual(
    harness.sheets
      .get('DEAL_ARV_EVIDENCE')
      .snapshot().length,
    23
  );

  assert.strictEqual(
    harness.sheets
      .get('DEAL_REPAIR_SCOPE_EVIDENCE')
      .snapshot().length,
    17
  );

  assert.strictEqual(
    harness.sheets
      .get('DEAL_OFFER_READINESS_EVIDENCE')
      .snapshot().length,
    15
  );

  assert.strictEqual(harness.lock.released, true);
}

pass('authorized offline harness provisions only the three exact evidence schemas');

{
  const harness = makeHarness({
    initialSheets: {
      DEAL_ARV_EVIDENCE:
        provisioning.HEADERS.DEAL_ARV_EVIDENCE,
      DEAL_REPAIR_SCOPE_EVIDENCE:
        provisioning.HEADERS.DEAL_REPAIR_SCOPE_EVIDENCE,
      DEAL_OFFER_READINESS_EVIDENCE:
        provisioning.HEADERS.DEAL_OFFER_READINESS_EVIDENCE
    }
  });

  const outcome = executor.execute(
    {
      authorized: true,
      spreadsheetIdentity:
        fixture.requestedSpreadsheetIdentity
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(
    outcome.outcome,
    'already_provisioned'
  );

  assert.strictEqual(
    harness.events.some(
      event => event.startsWith('spreadsheet.insertSheet:')
    ),
    false
  );

  assert.strictEqual(harness.lock.released, true);
}

pass('exact existing schemas are idempotent and mutation-free');

{
  const badHeaders =
    provisioning.HEADERS.DEAL_ARV_EVIDENCE.slice();

  badHeaders[0] = 'WRONG HEADER';

  const harness = makeHarness({
    initialSheets: {
      DEAL_ARV_EVIDENCE: badHeaders
    }
  });

  const outcome = executor.execute(
    {
      authorized: true,
      spreadsheetIdentity:
        fixture.requestedSpreadsheetIdentity
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(
    outcome.outcome,
    'rejected_existing_schema'
  );

  assert.strictEqual(
    harness.events.some(
      event => event.startsWith('spreadsheet.insertSheet:')
    ),
    false
  );

  assert.strictEqual(harness.lock.released, true);
}

pass('existing schema mismatch fails closed without repair');

{
  const harness = makeHarness();

  const outcome = executor.preflight(
    {
      spreadsheetIdentity:
        fixture.requestedSpreadsheetIdentity
    },
    harness.runtime,
    provisioning
  );

  assert.strictEqual(
    outcome.outcome,
    'failed_verification'
  );

  assert.strictEqual(outcome.ready, false);

  assert.strictEqual(
    harness.events.some(
      event => event.startsWith('spreadsheet.insertSheet:')
    ),
    false
  );
}

pass('preflight never provisions missing tables');

assert.deepStrictEqual(
  fixture.tables,
  {
    DEAL_ARV_EVIDENCE: 23,
    DEAL_REPAIR_SCOPE_EVIDENCE: 17,
    DEAL_OFFER_READINESS_EVIDENCE: 15
  }
);

assert.deepStrictEqual(
  fixture.requiredOutcomes,
  provisioning.OUTCOMES
);

pass('fixture preserves exact tables, header counts, and certified outcomes');

process.stdout.write(
  'Live administrative comps readiness evidence storage provisioning executor v1 certification PASSED.\n'
);
