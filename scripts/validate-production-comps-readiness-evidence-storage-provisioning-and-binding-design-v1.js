'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const designPath = path.join(
  ROOT,
  'docs',
  'production-comps-readiness-evidence-storage-provisioning-and-binding-design-v1.md'
);

const adapterPath = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CompsReadinessEvidenceStorageAdapter.js'
);

const persistencePath = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CompsReadinessEvidencePersistence.js'
);

for (const file of [designPath, adapterPath, persistencePath]) {
  assert.ok(fs.existsSync(file), `required file missing: ${file}`);
}

const design = fs.readFileSync(designPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const persistence = fs.readFileSync(persistencePath, 'utf8');

const required = [
  'design-only specification',
  'DEAL_ARV_EVIDENCE',
  'DEAL_REPAIR_SCOPE_EVIDENCE',
  'DEAL_OFFER_READINESS_EVIDENCE',
  'exactly these 23 headers',
  'exactly these 17 headers',
  'exactly these 15 headers',
  'explicitly identified production',
  'No fallback spreadsheet is permitted.',
  'explicit administrative operation',
  'Automatic header repair is prohibited.',
  'Automatic column insertion is prohibited.',
  'Automatic column deletion is prohibited.',
  'Automatic column reordering is prohibited.',
  'Automatic evidence migration is prohibited.',
  'Destructive recreation is prohibited.',
  'Binding preflight',
  'property-identity repair authority',
  'no evidence-generation authority',
  'Storage existence does not create acquisition authority.',
  'Qualified Deal Queue authority',
  'MAO authority',
  'offer-generation authority',
  'offer-submission authority',
  'Concurrent provisioning attempts must not create duplicate evidence sheets.',
  'partial provisioning result must not be reported as complete success',
  '`provisioned`',
  '`already_provisioned`',
  '`rejected_spreadsheet_identity`',
  '`rejected_existing_schema`',
  '`rejected_authorization`',
  '`failed_lock`',
  '`failed_provisioning`',
  '`failed_verification`',
  'no evidence rows were fabricated',
  'implement_offline_certifiable_production_comps_readiness_evidence_storage_provisioning_and_binding_module_v1'
];

for (const marker of required) {
  assert.ok(
    design.includes(marker),
    `required design marker missing: ${marker}`
  );
}

const arvHeaders = [
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
];

const repairHeaders = [
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
];

const readinessHeaders = [
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
];

assert.strictEqual(arvHeaders.length, 23);
assert.strictEqual(repairHeaders.length, 17);
assert.strictEqual(readinessHeaders.length, 15);

for (const header of new Set([
  ...arvHeaders,
  ...repairHeaders,
  ...readinessHeaders
])) {
  assert.ok(
    design.includes('`' + header + '`'),
    `design missing exact header: ${header}`
  );
}

for (const table of [
  'DEAL_ARV_EVIDENCE',
  'DEAL_REPAIR_SCOPE_EVIDENCE',
  'DEAL_OFFER_READINESS_EVIDENCE'
]) {
  assert.ok(adapter.includes(table), `adapter missing ${table}`);
  assert.ok(persistence.includes(table), `persistence missing ${table}`);
}

for (const marker of [
  'getActiveSpreadsheet',
  'getSheetByName',
  'getScriptLock',
  'tryLock',
  'readAll',
  'append'
]) {
  assert.ok(
    adapter.includes(marker),
    `adapter prerequisite missing ${marker}`
  );
}

for (const forbidden of [
  'insertSheet(',
  'deleteSheet('
]) {
  assert.ok(
    !adapter.includes(forbidden),
    `runtime adapter unexpectedly provisions sheets: ${forbidden}`
  );
}

for (const api of [
  'appendDealArvEvidence',
  'appendDealRepairScopeEvidence',
  'appendDealOfferReadinessEvidence',
  'getCurrentDealArvEvidence',
  'getCurrentDealRepairScopeEvidence',
  'getCurrentDealOfferReadinessEvidence'
]) {
  assert.ok(
    persistence.includes(api),
    `persistence prerequisite missing ${api}`
  );
}

console.log(
  'PRODUCTION_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_AND_BINDING_DESIGN_V1_VALID=true'
);
console.log('DESIGN_ONLY=true');
console.log('EVIDENCE_TABLE_COUNT=3');
console.log('ARV_HEADER_COUNT=23');
console.log('REPAIR_HEADER_COUNT=17');
console.log('READINESS_HEADER_COUNT=15');
console.log('EXPLICIT_PRODUCTION_SPREADSHEET_BINDING_REQUIRED=true');
console.log('FALLBACK_SPREADSHEET_AUTHORIZED=false');
console.log('AUTOMATIC_PROVISIONING_AUTHORIZED=false');
console.log('AUTOMATIC_HEADER_REPAIR_AUTHORIZED=false');
console.log('PRODUCTION_SHEET_CREATION_AUTHORIZED=false');
console.log('PRODUCTION_SHEET_MUTATION_AUTHORIZED=false');
console.log('PRODUCTION_EVIDENCE_PERSISTENCE_AUTHORIZED=false');
console.log('PRODUCTION_RPC_AUTHORIZED=false');
console.log('PRODUCTION_GATE_WIRING_IMPLEMENTATION_AUTHORIZED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_GENERATION_AUTHORITY_GRANTED=false');
console.log('OFFER_SUBMISSION_AUTHORITY_GRANTED=false');
