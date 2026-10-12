'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const modulePath = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CompsReadinessEvidenceStorageProvisioning.js'
);

const fixturePath = path.join(
  ROOT,
  'scripts',
  'fixtures',
  'production-comps-readiness-evidence-storage-provisioning-and-binding-module-v1.json'
);

const designPath = path.join(
  ROOT,
  'docs',
  'production-comps-readiness-evidence-storage-provisioning-and-binding-design-v1.md'
);

for (const file of [modulePath, fixturePath, designPath]) {
  assert.ok(fs.existsSync(file), `required file missing: ${file}`);
}

const source = fs.readFileSync(modulePath, 'utf8');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const design = fs.readFileSync(designPath, 'utf8');

const api = require(modulePath);

assert.strictEqual(api.VERSION, 'v1');

assert.deepStrictEqual(
  Object.values(api.TABLES),
  [
    'DEAL_ARV_EVIDENCE',
    'DEAL_REPAIR_SCOPE_EVIDENCE',
    'DEAL_OFFER_READINESS_EVIDENCE'
  ]
);

assert.strictEqual(api.HEADERS.DEAL_ARV_EVIDENCE.length, 23);
assert.strictEqual(api.HEADERS.DEAL_REPAIR_SCOPE_EVIDENCE.length, 17);
assert.strictEqual(api.HEADERS.DEAL_OFFER_READINESS_EVIDENCE.length, 15);

assert.deepStrictEqual(
  api.HEADERS.DEAL_ARV_EVIDENCE,
  fixture.tables.DEAL_ARV_EVIDENCE
);

assert.deepStrictEqual(
  api.HEADERS.DEAL_REPAIR_SCOPE_EVIDENCE,
  fixture.tables.DEAL_REPAIR_SCOPE_EVIDENCE
);

assert.deepStrictEqual(
  api.HEADERS.DEAL_OFFER_READINESS_EVIDENCE,
  fixture.tables.DEAL_OFFER_READINESS_EVIDENCE
);

assert.deepStrictEqual(
  api.OUTCOMES,
  [
    'provisioned',
    'already_provisioned',
    'rejected_spreadsheet_identity',
    'rejected_existing_schema',
    'rejected_authorization',
    'failed_lock',
    'failed_provisioning',
    'failed_verification'
  ]
);

for (const marker of [
  'explicitly identified production',
  'No fallback spreadsheet is permitted.',
  'Automatic header repair is prohibited.',
  'property-identity repair authority',
  'no evidence-generation authority',
  'Storage existence does not create acquisition authority.'
]) {
  assert.ok(design.includes(marker), `design prerequisite missing: ${marker}`);
}

for (const forbidden of [
  'SpreadsheetApp.',
  'DriveApp.',
  'UrlFetchApp.',
  'ScriptApp.',
  'PropertiesService.',
  'LockService.',
  'Utilities.sleep(',
  'insertSheet(',
  'deleteSheet(',
  'setValues(',
  'appendRow('
]) {
  assert.ok(
    !source.includes(forbidden),
    `offline module contains live production primitive: ${forbidden}`
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeHarness(options = {}) {
  const expectedIdentity =
    options.expectedIdentity || fixture.spreadsheetIdentity;

  const resolvedIdentity =
    Object.prototype.hasOwnProperty.call(options, 'resolvedIdentity')
      ? options.resolvedIdentity
      : expectedIdentity;

  const sheets = {};

  if (options.initialSheets) {
    for (const [name, headers] of Object.entries(options.initialSheets)) {
      sheets[name] = clone(headers);
    }
  }

  let lockHeld = false;
  let createCount = 0;
  let releaseCount = 0;

  const deps = {
    getExpectedSpreadsheetIdentity() {
      return expectedIdentity;
    },

    resolveSpreadsheetIdentity() {
      if (options.identityThrows) {
        throw new Error('synthetic identity failure');
      }
      return resolvedIdentity;
    },

    getSheetHeaders(tableName) {
      if (
        options.readFailureTable &&
        options.readFailureTable === tableName
      ) {
        throw new Error('synthetic read failure');
      }

      if (!Object.prototype.hasOwnProperty.call(sheets, tableName)) {
        return null;
      }

      return clone(sheets[tableName]);
    },

    createSheetWithHeaders(tableName, headers) {
      if (
        options.createFailureTable &&
        options.createFailureTable === tableName
      ) {
        throw new Error('synthetic create failure');
      }

      if (Object.prototype.hasOwnProperty.call(sheets, tableName)) {
        throw new Error('duplicate sheet');
      }

      createCount += 1;

      sheets[tableName] = clone(headers);

      if (
        options.corruptCreatedTable &&
        options.corruptCreatedTable === tableName
      ) {
        sheets[tableName][0] = 'CORRUPTED HEADER';
      }
    },

    acquireLock() {
      if (options.lockThrows) {
        throw new Error('synthetic lock failure');
      }

      if (options.lockUnavailable) {
        return null;
      }

      lockHeld = true;
      return { id: 'synthetic-lock' };
    },

    releaseLock() {
      if (lockHeld) {
        lockHeld = false;
        releaseCount += 1;
      }
    }
  };

  return {
    deps,
    sheets,
    getCreateCount: () => createCount,
    getReleaseCount: () => releaseCount,
    isLockHeld: () => lockHeld
  };
}

const exactSheets = {
  DEAL_ARV_EVIDENCE: fixture.tables.DEAL_ARV_EVIDENCE,
  DEAL_REPAIR_SCOPE_EVIDENCE: fixture.tables.DEAL_REPAIR_SCOPE_EVIDENCE,
  DEAL_OFFER_READINESS_EVIDENCE:
    fixture.tables.DEAL_OFFER_READINESS_EVIDENCE
};

/* Preflight succeeds only with exact identity and exact schemas. */
{
  const h = makeHarness({ initialSheets: exactSheets });

  const result = api.preflightProductionEvidenceStorage(
    { explicit: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'already_provisioned');
  assert.strictEqual(result.ready, true);
  assert.strictEqual(result.spreadsheetIdentityVerified, true);
  assert.strictEqual(result.tables.length, 3);
}

/* Identity mismatch fails closed before readiness. */
{
  const h = makeHarness({
    resolvedIdentity: 'WRONG-SPREADSHEET',
    initialSheets: exactSheets
  });

  const result = api.preflightProductionEvidenceStorage(
    { explicit: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'rejected_spreadsheet_identity');
  assert.strictEqual(result.ready, false);
}

/* Missing sheet fails preflight. */
{
  const h = makeHarness({
    initialSheets: {
      DEAL_ARV_EVIDENCE: fixture.tables.DEAL_ARV_EVIDENCE,
      DEAL_REPAIR_SCOPE_EVIDENCE:
        fixture.tables.DEAL_REPAIR_SCOPE_EVIDENCE
    }
  });

  const result = api.preflightProductionEvidenceStorage(
    { explicit: true },
    h.deps
  );

  assert.strictEqual(result.ready, false);
  assert.strictEqual(result.outcome, 'failed_verification');
}

/* Existing schema mismatch fails closed. */
{
  const bad = clone(exactSheets);
  bad.DEAL_ARV_EVIDENCE =
    clone(fixture.tables.DEAL_ARV_EVIDENCE);
  bad.DEAL_ARV_EVIDENCE[0] = 'WRONG HEADER';

  const h = makeHarness({ initialSheets: bad });

  const result = api.preflightProductionEvidenceStorage(
    { explicit: true },
    h.deps
  );

  assert.strictEqual(result.ready, false);
  assert.strictEqual(result.outcome, 'rejected_existing_schema');
}

/* Provisioning requires exact explicit authorization. */
{
  const h = makeHarness();

  const result = api.provisionProductionEvidenceStorage(
    { authorized: false },
    h.deps
  );

  assert.strictEqual(result.outcome, 'rejected_authorization');
  assert.strictEqual(result.ready, false);
  assert.strictEqual(h.getCreateCount(), 0);
}

/* Wrong identity cannot provision. */
{
  const h = makeHarness({
    resolvedIdentity: 'WRONG-SPREADSHEET'
  });

  const result = api.provisionProductionEvidenceStorage(
    { authorized: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'rejected_spreadsheet_identity');
  assert.strictEqual(result.ready, false);
  assert.strictEqual(h.getCreateCount(), 0);
}

/* Lock failure cannot provision. */
{
  const h = makeHarness({
    lockUnavailable: true
  });

  const result = api.provisionProductionEvidenceStorage(
    { authorized: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'failed_lock');
  assert.strictEqual(result.ready, false);
  assert.strictEqual(h.getCreateCount(), 0);
}

/* Clean empty synthetic store provisions exactly three sheets. */
{
  const h = makeHarness();

  const result = api.provisionProductionEvidenceStorage(
    { authorized: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'provisioned');
  assert.strictEqual(result.provisioned, true);
  assert.strictEqual(result.ready, true);
  assert.strictEqual(result.createdTables.length, 3);
  assert.strictEqual(h.getCreateCount(), 3);
  assert.strictEqual(h.getReleaseCount(), 1);
  assert.strictEqual(h.isLockHeld(), false);

  assert.deepStrictEqual(
    h.sheets.DEAL_ARV_EVIDENCE,
    fixture.tables.DEAL_ARV_EVIDENCE
  );

  assert.deepStrictEqual(
    h.sheets.DEAL_REPAIR_SCOPE_EVIDENCE,
    fixture.tables.DEAL_REPAIR_SCOPE_EVIDENCE
  );

  assert.deepStrictEqual(
    h.sheets.DEAL_OFFER_READINESS_EVIDENCE,
    fixture.tables.DEAL_OFFER_READINESS_EVIDENCE
  );
}

/* Exact existing store is idempotently already provisioned. */
{
  const h = makeHarness({
    initialSheets: exactSheets
  });

  const result = api.provisionProductionEvidenceStorage(
    { authorized: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'already_provisioned');
  assert.strictEqual(result.provisioned, false);
  assert.strictEqual(result.ready, true);
  assert.strictEqual(h.getCreateCount(), 0);
  assert.strictEqual(h.getReleaseCount(), 1);
}

/* Existing malformed schema is never repaired. */
{
  const malformed = clone(exactSheets);
  malformed.DEAL_REPAIR_SCOPE_EVIDENCE =
    clone(fixture.tables.DEAL_REPAIR_SCOPE_EVIDENCE);
  malformed.DEAL_REPAIR_SCOPE_EVIDENCE[1] = 'WRONG SCHEMA HEADER';

  const h = makeHarness({
    initialSheets: malformed
  });

  const result = api.provisionProductionEvidenceStorage(
    { authorized: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'rejected_existing_schema');
  assert.strictEqual(result.ready, false);
  assert.strictEqual(h.getCreateCount(), 0);
  assert.strictEqual(h.getReleaseCount(), 1);
}

/* Creation failure reports bounded partial failure, never success. */
{
  const h = makeHarness({
    createFailureTable: 'DEAL_REPAIR_SCOPE_EVIDENCE'
  });

  const result = api.provisionProductionEvidenceStorage(
    { authorized: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'failed_provisioning');
  assert.strictEqual(result.ready, false);
  assert.deepStrictEqual(
    result.createdTables,
    ['DEAL_ARV_EVIDENCE']
  );
  assert.strictEqual(h.getReleaseCount(), 1);
}

/* Verification failure after creation never reports success. */
{
  const h = makeHarness({
    corruptCreatedTable: 'DEAL_OFFER_READINESS_EVIDENCE'
  });

  const result = api.provisionProductionEvidenceStorage(
    { authorized: true },
    h.deps
  );

  assert.strictEqual(result.outcome, 'failed_verification');
  assert.strictEqual(result.ready, false);
  assert.strictEqual(h.getReleaseCount(), 1);
}

/* No evidence-generation or acquisition authority is present. */
for (const forbidden of [
  'calculateMAO',
  'calculateMao',
  'generateOffer',
  'submitOffer',
  'Qualified Deal Queue',
  'acceptedComparableEvidenceIds',
  'estimatedArv',
  'estimatedRepairCost',
  'compSupportedArvReady',
  'repairScopeReady'
]) {
  assert.ok(
    !source.includes(forbidden),
    `provisioning module contains forbidden acquisition/evidence behavior: ${forbidden}`
  );
}

console.log(
  'OFFLINE_CERTIFIABLE_PRODUCTION_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_AND_BINDING_MODULE_V1_VALID=true'
);

console.log('OFFLINE_ONLY=true');
console.log('MODULE_AUTOMATICALLY_INVOKED=false');

console.log('EVIDENCE_TABLE_COUNT=3');
console.log('ARV_HEADER_COUNT=23');
console.log('REPAIR_HEADER_COUNT=17');
console.log('READINESS_HEADER_COUNT=15');

console.log('EXPLICIT_SPREADSHEET_IDENTITY_REQUIRED=true');
console.log('EXPLICIT_PROVISIONING_AUTHORIZATION_REQUIRED=true');

console.log('SYNTHETIC_PROVISIONING_SUCCESS_CERTIFIED=true');
console.log('SYNTHETIC_ALREADY_PROVISIONED_CERTIFIED=true');
console.log('IDENTITY_MISMATCH_FAIL_CLOSED_CERTIFIED=true');
console.log('SCHEMA_MISMATCH_FAIL_CLOSED_CERTIFIED=true');
console.log('LOCK_FAILURE_FAIL_CLOSED_CERTIFIED=true');
console.log('PARTIAL_PROVISIONING_FAIL_CLOSED_CERTIFIED=true');
console.log('POST_CREATE_VERIFICATION_FAIL_CLOSED_CERTIFIED=true');

console.log('LIVE_GOOGLE_SHEETS_ACCESS_PRESENT=false');
console.log('PRODUCTION_RPC_PRESENT=false');
console.log('PRODUCTION_GATE_WIRING_PRESENT=false');

console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_GENERATION_AUTHORITY_GRANTED=false');
console.log('OFFER_SUBMISSION_AUTHORITY_GRANTED=false');
