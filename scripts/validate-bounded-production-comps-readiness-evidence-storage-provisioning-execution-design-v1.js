'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const designPath = path.join(
  root,
  'docs',
  'bounded-production-comps-readiness-evidence-storage-provisioning-execution-design-v1.md'
);

const design = fs.readFileSync(designPath, 'utf8');

function requireText(text, message) {
  const normalizeWhitespace = value =>
    String(value).replace(/\s+/g, ' ').trim();

  const normalizedDesign = normalizeWhitespace(design);
  const normalizedText = normalizeWhitespace(text);

  assert.ok(
    normalizedDesign.includes(normalizedText),
    `required design marker missing: ${message || text}`
  );
}

[
  'Design-only.',
  'This design does not authorize a production provisioning execution.',
  'This design does not authorize a production RPC.',
  'This design does not authorize production Google Sheets mutation.',
  'This design does not authorize an Apps Script deployment update.',
  'DEAL_ARV_EVIDENCE',
  'DEAL_REPAIR_SCOPE_EVIDENCE',
  'DEAL_OFFER_READINESS_EVIDENCE',
  'DEAL_ARV_EVIDENCE`: 23',
  'DEAL_REPAIR_SCOPE_EVIDENCE`: 17',
  'DEAL_OFFER_READINESS_EVIDENCE`: 15',
  'explicit, nonblank, certified production spreadsheet identity',
  'must not infer production identity solely from the active',
  'must not use an arbitrary active spreadsheet as a fallback',
  'requested and expected production identities match exactly',
  'Automatic header repair is prohibited.',
  'Automatic column reordering is prohibited.',
  'Automatic migration is prohibited.',
  'Destructive recreation is prohibited.',
  'Deleting an existing evidence sheet is prohibited.',
  'There is no evidence-generation authority.',
  'There is no property-identity repair authority.',
  'failed_lock',
  'failed_provisioning',
  'failed_verification',
  'provisioned',
  'already_provisioned',
  'rejected_spreadsheet_identity',
  'rejected_existing_schema',
  'rejected_authorization',
  'There is no automatic retry.',
  'Storage provisioning supplies neither.',
  'MAO authority',
  'offer-generation authority',
  'offer-submission authority',
  'Qualified Deal Queue authority',
  'acquisition lifecycle authority',
  'Production readiness-gate consumer wiring remains a separate future design',
  'implement an offline-certifiable live administrative provisioning executor',
  'separately authorize exactly one bounded production provisioning invocation'
].forEach(marker => requireText(marker));

const exactTables = [
  'DEAL_ARV_EVIDENCE',
  'DEAL_REPAIR_SCOPE_EVIDENCE',
  'DEAL_OFFER_READINESS_EVIDENCE'
];

exactTables.forEach(table => {
  const count = design.split('`' + table + '`').length - 1;
  assert.ok(count >= 1, `required table missing: ${table}`);
});

[
  'production sheet creation',
  'production sheet mutation',
  'live Google Sheets reads',
  'live Google Sheets writes',
  'production evidence persistence',
  'production RPC execution',
  'Apps Script deployment updates',
  'trigger creation or modification',
  'provider requests',
  'automatic provisioning',
  'automatic retry',
  'header repair',
  'schema migration',
  'property-identity repair',
  'evidence generation',
  'production readiness-gate wiring',
  'Qualified Deal Queue mutation',
  'acquisition lifecycle mutation',
  'MAO calculation or authority',
  'offer generation or authority',
  'offer submission or authority'
].forEach(marker => requireText(marker));

console.log(
  'PASS: bounded production comps readiness evidence storage provisioning execution design v1'
);
console.log('DESIGN_ONLY=true');
console.log('EVIDENCE_TABLE_COUNT=3');
console.log('ARV_HEADER_COUNT=23');
console.log('REPAIR_HEADER_COUNT=17');
console.log('READINESS_HEADER_COUNT=15');
console.log('EXPLICIT_PRODUCTION_SPREADSHEET_BINDING_REQUIRED=true');
console.log('SINGLE_BOUNDED_ADMIN_INVOCATION_REQUIRED=true');
console.log('AUTOMATIC_PROVISIONING_AUTHORIZED=false');
console.log('AUTOMATIC_RETRY_AUTHORIZED=false');
console.log('AUTOMATIC_HEADER_REPAIR_AUTHORIZED=false');
console.log('PRODUCTION_PROVISIONING_EXECUTION_AUTHORIZED=false');
console.log('PRODUCTION_RPC_EXECUTION_AUTHORIZED=false');
console.log('APPS_SCRIPT_DEPLOYMENT_UPDATE_AUTHORIZED=false');
console.log('PRODUCTION_PERSISTENCE_AUTHORIZED=false');
console.log('PRODUCTION_GATE_WIRING_AUTHORIZED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_GENERATION_AUTHORITY_GRANTED=false');
console.log('OFFER_SUBMISSION_AUTHORITY_GRANTED=false');
