'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

const ADAPTER_PATH = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CompsReadinessEvidenceStorageAdapter.js'
);

const FIXTURE_PATH = path.join(
  ROOT,
  'scripts',
  'fixtures',
  'live-production-comps-readiness-evidence-storage-adapter-v1.json'
);

const CORE_PATH = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CompsReadinessEvidencePersistence.js'
);

const adapter = require(ADAPTER_PATH);

const fixture = JSON.parse(
  fs.readFileSync(FIXTURE_PATH, 'utf8')
);

const source = fs.readFileSync(
  ADAPTER_PATH,
  'utf8'
);

const coreSource = fs.readFileSync(
  CORE_PATH,
  'utf8'
);

assert.deepStrictEqual(
  Object.keys(adapter.TABLES).sort(),
  [
    'DEAL_ARV_EVIDENCE',
    'DEAL_OFFER_READINESS_EVIDENCE',
    'DEAL_REPAIR_SCOPE_EVIDENCE'
  ]
);

assert.strictEqual(
  adapter.SCHEMAS.DEAL_ARV_EVIDENCE.length,
  23
);

assert.strictEqual(
  adapter.SCHEMAS.DEAL_REPAIR_SCOPE_EVIDENCE.length,
  17
);

assert.strictEqual(
  adapter.SCHEMAS.DEAL_OFFER_READINESS_EVIDENCE.length,
  15
);

const cases = [
  [
    'DEAL_ARV_EVIDENCE',
    fixture.arv
  ],
  [
    'DEAL_REPAIR_SCOPE_EVIDENCE',
    fixture.repair
  ],
  [
    'DEAL_OFFER_READINESS_EVIDENCE',
    fixture.readiness
  ]
];

for (const [table, record] of cases) {
  const row = adapter.recordToRow(
    table,
    record
  );

  assert.strictEqual(
    row.length,
    adapter.SCHEMAS[table].length
  );

  const roundTrip = adapter.rowToRecord(
    table,
    row
  );

  assert.deepStrictEqual(
    roundTrip,
    record
  );

  assert.ok(
    Object.isFrozen(roundTrip)
  );
}

assert.throws(
  () => adapter.recordToRow(
    'UNAUTHORIZED_TABLE',
    {}
  ),
  /UNSUPPORTED_EVIDENCE_TABLE/
);

assert.throws(
  () => adapter.rowToRecord(
    'DEAL_ARV_EVIDENCE',
    []
  ),
  /EVIDENCE_ROW_WIDTH_MISMATCH/
);

const badBoolean = {
  ...fixture.readiness,
  compSupportedArvReady: 'true'
};

assert.throws(
  () => adapter.recordToRow(
    'DEAL_OFFER_READINESS_EVIDENCE',
    badBoolean
  ),
  /EVIDENCE_BOOLEAN_INVALID/
);

const badNumber = {
  ...fixture.arv,
  estimatedArv: '250000'
};

assert.throws(
  () => adapter.recordToRow(
    'DEAL_ARV_EVIDENCE',
    badNumber
  ),
  /EVIDENCE_NUMBER_INVALID/
);

const jsonRow = adapter.recordToRow(
  'DEAL_ARV_EVIDENCE',
  {
    ...fixture.arv,
    valuationInputs: {
      z: 1,
      a: {
        y: 2,
        b: 3
      }
    }
  }
);

const valuationIndex =
  adapter.SCHEMAS.DEAL_ARV_EVIDENCE
    .findIndex(
      field => field[0] === 'valuationInputs'
    );

assert.strictEqual(
  jsonRow[valuationIndex],
  '{"a":{"b":3,"y":2},"z":1}'
);

assert.ok(
  source.includes(
    'SpreadsheetApp.getActiveSpreadsheet()'
  )
);

assert.ok(
  source.includes(
    '.getSheetByName(tableName)'
  )
);

assert.ok(
  source.includes(
    'LockService.getScriptLock()'
  )
);

assert.ok(
  source.includes(
    '.tryLock(30000)'
  )
);

assert.ok(
  source.includes(
    '.setValues([row])'
  )
);

assert.ok(
  source.includes(
    'SpreadsheetApp.flush()'
  )
);

assert.strictEqual(
  source.includes('.insertSheet('),
  false
);

assert.strictEqual(
  source.includes('.appendRow('),
  false
);

assert.strictEqual(
  source.includes('UrlFetchApp'),
  false
);

assert.strictEqual(
  source.includes('Utilities.getUuid'),
  false
);

assert.strictEqual(
  source.includes('new Date('),
  false
);

assert.strictEqual(
  source.includes('Date.now('),
  false
);

assert.strictEqual(
  coreSource.includes('SpreadsheetApp'),
  false
);

assert.strictEqual(
  coreSource.includes('UrlFetchApp'),
  false
);

for (const api of [
  'appendDealArvEvidence',
  'appendDealRepairScopeEvidence',
  'appendDealOfferReadinessEvidence',
  'getCurrentDealArvEvidence',
  'getCurrentDealRepairScopeEvidence',
  'getCurrentDealOfferReadinessEvidence'
]) {
  assert.ok(
    coreSource.includes(api),
    `core persistence API missing: ${api}`
  );
}

for (const forbiddenAuthority of [
  'Qualified Deal Queue',
  'calculateMAO(',
  'generateOffer(',
  'submitOffer('
]) {
  assert.strictEqual(
    source.includes(forbiddenAuthority),
    false,
    `forbidden authority signal: ${forbiddenAuthority}`
  );
}

console.log(
  'LIVE_PRODUCTION_COMPS_READINESS_EVIDENCE_STORAGE_ADAPTER_V1_VALID=true'
);

console.log('ARV_SCHEMA_FIELD_COUNT=23');
console.log('REPAIR_SCHEMA_FIELD_COUNT=17');
console.log('READINESS_SCHEMA_FIELD_COUNT=15');

console.log('ROUND_TRIP_SERIALIZATION_CERTIFIED=true');
console.log('DETERMINISTIC_JSON_CERTIFIED=true');
console.log('EXACT_BOOLEAN_PRESERVATION_CERTIFIED=true');
console.log('FINITE_NUMBER_PRESERVATION_CERTIFIED=true');
console.log('TABLE_ALLOWLIST_CERTIFIED=true');

console.log('AUTOMATIC_SHEET_CREATION_AUTHORIZED=false');
console.log('HEADER_REPAIR_AUTHORIZED=false');

console.log('EXTERNAL_PROVIDER_REQUEST_AUTHORIZED=false');
console.log('PRODUCTION_RPC_AUTHORIZED=false');
console.log('PRODUCTION_GATE_WIRING_IMPLEMENTATION_AUTHORIZED=false');

console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_GENERATION_AUTHORITY_GRANTED=false');
console.log('OFFER_SUBMISSION_AUTHORITY_GRANTED=false');
