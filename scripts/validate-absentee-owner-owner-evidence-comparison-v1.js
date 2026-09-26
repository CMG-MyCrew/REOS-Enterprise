#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerOwnerEvidenceComparison.js'
);

assert.ok(
  fs.existsSync(FILE),
  'owner-evidence comparison runtime is missing'
);

const source = fs.readFileSync(
  FILE,
  'utf8'
);

[
  'REOS.AbsenteeOwnerOwnerEvidenceComparison',
  "'READ_ONLY_OWNER_EVIDENCE_COMPARISON'",
  "'absentee_owner_owner_evidence_comparison'",
  "'READ_ONLY_OWNER_EVIDENCE'",
  "'absentee_owner_philadelphia_owner_evidence_lookup'",
  "'Philadelphia Office of Property Assessment'",
  "'opa_properties_public'",
  "'https://phl.carto.com/api/v2/sql'",
  "'exact_property_address'",
  "'MAILING_ADDRESS_MATCHES'",
  "'MAILING_ADDRESS_DIFFERS'",
  "'INSUFFICIENT_MAILING_EVIDENCE'",
  "'INELIGIBLE_OWNER_EVIDENCE'",
  "'mailing_city_state'",
  "'mailing_street'",
  "'mailing_zip'",
  'normalizeText_',
  'normalizeState_',
  'normalizeZip_',
  'parseMailingCityState_',
  'boundedSourceRowCount !== 1',
  'ownerMailingEvidence',
  'normalizedPropertyAddress',
  'normalizedMailingAddress',
  'differingComponents',
  'productionDataMutationAuthorityGranted: false',
  'ownerEvidencePersistenceAuthorityGranted: false',
  'absenteeClassificationAuthorityGranted: false',
  'canonicalIdentityRepairAuthorityGranted: false',
  'migrationAuthorityGranted: false',
  'schedulerAuthorityGranted: false',
  'triggerAuthorityGranted: false',
  'connectorExecutionAuthorityGranted: false',
  'certificationMutationAuthorityGranted: false',
  'automaticOfferAuthorityGranted: false',
  'compare: compare'
].forEach(marker => {
  assert.ok(
    source.includes(marker),
    'missing comparison implementation marker: ' + marker
  );
});

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'REOS.Database',
  'REOS.CountyRuntimeBridge',
  'REOS.CountyConnectorSDK',
  'REOS.PAPhiladelphiaCountyConnector',
  'reosConnectorHandleAbsenteeOwners',
  'REOS.AbsenteeOwnerEnrichmentSanitizer',
  'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter',
  'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder',
  'REOS.AbsenteeOwnerEnrichmentExecutor',
  'reosAbsenteeOwnerEnrichmentCertifySingleRecord',
  'ownerNameEvidence',
  'absenteeOwner',
  'ownerOccupied',
  'nonOwnerOccupied',
  'vacant:',
  'Math.random',
  'new Date('
].forEach(marker => {
  assert.strictEqual(
    source.includes(marker),
    false,
    'prohibited comparison implementation marker: ' + marker
  );
});

assert.strictEqual(
  /\bfunction\s+reos[A-Za-z0-9_]*\s*\(/.test(source),
  false,
  'comparison runtime must not expose a production RPC'
);

assert.strictEqual(
  (source.match(/UrlFetchApp/g) || []).length,
  0,
  'comparison runtime must contain zero external HTTP call sites'
);

assert.strictEqual(
  (source.match(/SpreadsheetApp/g) || []).length,
  0,
  'comparison runtime must contain zero spreadsheet call sites'
);

assert.ok(
  /normalized\.match\(\s*\/\^\(\\d\{5\}\)\(\?:-\\d\{4\}\)\?\$\//m
    .test(source),
  'ZIP5 / ZIP+4 deterministic normalization is missing'
);

assert.ok(
  /normalized\.match\(\s*\/\^\(\.\+\)\\s\+\(\[A-Z\]\{2\}\)\$\//m
    .test(source),
  'deterministic mailing city/state parsing is missing'
);

assert.ok(
  /differences\.push\(field\)/.test(source),
  'explicit differing-component collection is missing'
);

console.log(
  'ABSENTEE_OWNER_EVIDENCE_COMPARISON_STATIC_VALID=true'
);
console.log(
  'INTERNAL_COMPARE_SURFACE_PRESENT=true'
);
console.log(
  'COMPARISON_OUTCOME_COUNT=4'
);
console.log(
  'EXTERNAL_HTTP_CALL_SITE_COUNT=0'
);
console.log(
  'SPREADSHEET_CALL_SITE_COUNT=0'
);
console.log(
  'PRODUCTION_RPC_CREATED=false'
);
console.log(
  'OWNER_NAME_MATCHING_AUTHORITY=false'
);
console.log(
  'FUZZY_ADDRESS_MATCHING_AUTHORITY=false'
);
console.log(
  'OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false'
);
console.log(
  'ABSENTEE_CLASSIFICATION_AUTHORITY=false'
);
console.log(
  'PRODUCTION_MUTATION_AUTHORITY=false'
);
console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
