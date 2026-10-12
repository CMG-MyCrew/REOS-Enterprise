'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

const DESIGN = path.join(
  ROOT,
  'docs',
  'live-production-comps-readiness-evidence-storage-adapter-design-v1.md'
);

const MODULE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CompsReadinessEvidencePersistence.js'
);

const DATABASE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'Database.js'
);

function normalizeWhitespace(value) {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
}

assert.ok(
  fs.existsSync(DESIGN),
  'design document must exist'
);

assert.ok(
  fs.existsSync(MODULE),
  'certified persistence module must exist'
);

assert.ok(
  fs.existsSync(DATABASE),
  'production Database.js must exist'
);

const design = fs.readFileSync(DESIGN, 'utf8');
const moduleText = fs.readFileSync(MODULE, 'utf8');

const normalizedDesign = normalizeWhitespace(design);

const requiredDesignMarkers = [
  'Design-only contract.',
  'DEAL_ARV_EVIDENCE',
  'DEAL_REPAIR_SCOPE_EVIDENCE',
  'DEAL_OFFER_READINESS_EVIDENCE',
  'readAll(tableName)',
  'append(tableName, record)',
  'This design does not authorize automatic sheet creation.',
  'The storage adapter must not choose the current record.',
  'Current-record selection remains the responsibility of the certified persistence module.',
  'A single evidence append is the storage atomicity boundary.',
  'production Google Sheets writes',
  'production evidence appends',
  'production RPC invocation',
  'Apps Script deployment changes',
  'trigger changes',
  'readiness-gate production wiring',
  'Qualified Deal Queue authority',
  'MAO authority',
  'offer-generation authority',
  'offer-submission authority',
  'implement_live_production_comps_readiness_evidence_storage_adapter_v1'
];

for (const marker of requiredDesignMarkers) {
  assert.ok(
    normalizedDesign.includes(
      normalizeWhitespace(marker)
    ),
    `required design marker missing: ${marker}`
  );
}

const requiredApis = [
  'appendDealArvEvidence',
  'appendDealRepairScopeEvidence',
  'appendDealOfferReadinessEvidence',
  'getCurrentDealArvEvidence',
  'getCurrentDealRepairScopeEvidence',
  'getCurrentDealOfferReadinessEvidence'
];

for (const api of requiredApis) {
  assert.ok(
    moduleText.includes(api),
    `certified persistence API missing: ${api}`
  );

  assert.ok(
    normalizedDesign.includes(api),
    `design must preserve persistence API: ${api}`
  );
}

const exactHeaders = {
  DEAL_ARV_EVIDENCE: [
    'ARV Evidence ID',
    'Schema Version',
    'Deal ID',
    'Canonical Property Key',
    'Evidence Status',
    'Confidence Status',
    'Estimated ARV',
    'Accepted Comparable Evidence IDs JSON',
    'Accepted Comparable Count',
    'Minimum Comparable Count',
    'Valuation Method',
    'Valuation Inputs JSON',
    'Supported Low Value',
    'Supported High Value',
    'Review Required',
    'Reason Codes JSON',
    'Evidence Generated At',
    'Persisted At',
    'Source Engine',
    'Source Engine Version',
    'Provenance JSON',
    'Idempotency Key',
    'Supersedes Evidence ID'
  ],

  DEAL_REPAIR_SCOPE_EVIDENCE: [
    'Repair Scope Evidence ID',
    'Schema Version',
    'Deal ID',
    'Canonical Property Key',
    'Scope Status',
    'Scope Complete',
    'Estimated Repair Cost',
    'Review Required',
    'Reason Codes JSON',
    'Scope Inputs JSON',
    'Evidence Generated At',
    'Persisted At',
    'Source Engine',
    'Source Engine Version',
    'Provenance JSON',
    'Idempotency Key',
    'Supersedes Evidence ID'
  ],

  DEAL_OFFER_READINESS_EVIDENCE: [
    'Readiness Evidence ID',
    'Schema Version',
    'Deal ID',
    'Canonical Property Key',
    'ARV Evidence ID',
    'Repair Scope Evidence ID',
    'Decision',
    'Comp Supported ARV Ready',
    'Repair Scope Ready',
    'Reason Codes JSON',
    'Evaluated At',
    'Persisted At',
    'Gate Version',
    'Idempotency Key',
    'Supersedes Evidence ID'
  ]
};

assert.strictEqual(
  exactHeaders.DEAL_ARV_EVIDENCE.length,
  23
);

assert.strictEqual(
  exactHeaders.DEAL_REPAIR_SCOPE_EVIDENCE.length,
  17
);

assert.strictEqual(
  exactHeaders.DEAL_OFFER_READINESS_EVIDENCE.length,
  15
);

for (const [table, headers] of Object.entries(exactHeaders)) {
  assert.ok(
    normalizedDesign.includes(table),
    `table missing from design: ${table}`
  );

  for (const header of headers) {
    assert.ok(
      normalizedDesign.includes(
        normalizeWhitespace(header)
      ),
      `header missing from design: ${table} / ${header}`
    );
  }
}

const safetyMarkers = [
  'does not implement a live production storage adapter',
  'does not perform Google Sheets writes',
  'does not execute a production RPC',
  'does not alter a deployment',
  'does not wire evidence readiness into acquisition workflow authority',
  'No workflow authority',
  'No live execution authorization'
];

for (const marker of safetyMarkers) {
  assert.ok(
    normalizedDesign.includes(
      normalizeWhitespace(marker)
    ),
    `fail-closed safety marker missing: ${marker}`
  );
}

/*
 * Design-only validation: the certified persistence module must remain
 * storage/provider independent. Database.js may contain production storage
 * primitives; this design increment must not modify it.
 */
assert.strictEqual(
  moduleText.includes('SpreadsheetApp'),
  false,
  'certified persistence module must remain storage-independent'
);

assert.strictEqual(
  moduleText.includes('UrlFetchApp'),
  false,
  'certified persistence module must remain provider-independent'
);

/*
 * The design may discuss Apps Script primitives conceptually, but must not
 * contain implementation call expressions that would constitute executable
 * adapter code.
 */
const forbiddenImplementationSignals = [
  'SpreadsheetApp.openById(',
  'SpreadsheetApp.getActive(',
  'SpreadsheetApp.getActiveSpreadsheet(',
  '.appendRow(',
  '.setValues(',
  'LockService.getScriptLock(',
  'LockService.getDocumentLock('
];

for (const signal of forbiddenImplementationSignals) {
  assert.strictEqual(
    design.includes(signal),
    false,
    `design must not contain executable implementation signal: ${signal}`
  );
}

console.log(
  'LIVE_PRODUCTION_COMPS_READINESS_EVIDENCE_STORAGE_ADAPTER_DESIGN_V1_VALID=true'
);

console.log('ARV_HEADER_COUNT=23');
console.log('REPAIR_HEADER_COUNT=17');
console.log('READINESS_HEADER_COUNT=15');

console.log(
  'SIX_PERSISTENCE_APIS_PRESERVED=true'
);

console.log(
  'CURRENT_RECORD_SELECTION_REMAINS_IN_PERSISTENCE_MODULE=true'
);

console.log(
  'AUTOMATIC_SHEET_CREATION_AUTHORIZED=false'
);

console.log(
  'LIVE_PRODUCTION_STORAGE_ADAPTER_IMPLEMENTED=false'
);

console.log(
  'GOOGLE_SHEETS_WRITE_EXECUTED=false'
);

console.log(
  'PRODUCTION_PERSISTENCE_EXECUTED=false'
);

console.log(
  'PRODUCTION_RPC_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_GATE_WIRING_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'OFFER_GENERATION_AUTHORITY_GRANTED=false'
);

console.log(
  'OFFER_SUBMISSION_AUTHORITY_GRANTED=false'
);
