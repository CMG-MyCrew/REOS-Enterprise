#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const CONTRACT =
  path.join(
    ROOT,
    'docs',
    'philadelphia-probate-certified-oversize-analysis-production-transport-contract-v1.md'
  );

assert.ok(
  fs.existsSync(CONTRACT),
  'production-transport contract missing'
);

const text =
  fs.readFileSync(
    CONTRACT,
    'utf8'
  );

const normalized =
  text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

function requireExact(value) {
  assert.ok(
    text.includes(value),
    'missing exact contract value: ' +
      JSON.stringify(value)
  );
}

function requireNormalized(value) {
  const needle =
    String(value)
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  assert.ok(
    normalized.includes(needle),
    'missing normalized contract requirement: ' +
      JSON.stringify(value)
  );
}

[
  'Design contract only.',
  'The public RPC has exactly one caller-controlled argument.',
  '`0` is the initial authorized page offset.',
  'Each future transport invocation may contain exactly one executable:',
  'There is no retry.',
  'There is no fallback.',
  'There is no second HTTP attempt.',
  'The exact Blob whose bytes were validated MUST be the Blob handed to the certified analysis runtime.',
  'No reconstructed Blob is authorized.',
  'exactly once.',
  'Analysis failure MUST NOT cause an HTTP retry.',
  'Analysis failure MUST NOT cause an analysis retry.',
  'The readiness RPC MUST NOT be called by the future transport.',
  'The normal extraction limit remains exactly `250000`.',
  'PB1 remains outside unattended scheduler authority.',
  'No automatic MAO or offer authority may arise from this transport.',
  'This design gate does not modify central accounting.',
  'historical reconciled production inventory remains `147`'
].forEach(
  requireNormalized
);

[
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport.js',

  'scripts/validate-philadelphia-probate-certified-oversize-analysis-production-transport-v1.js',

  'reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport(noticeOffset)',

  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf',

  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca',

  'assets.alm.com',

  'tlipn093026.pdf',

  '2026-09-30',

  '4220387',

  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',

  '26214400',

  '250000',

  '600000',

  '566435',

  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3',

  'PHL-PROBATE-PB1-V1',

  'UrlFetchApp.fetch(...)',

  '`followRedirects: false`',

  '`muteHttpExceptions: true`',

  '`Accept: application/pdf`',

  'REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysis',

  'REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysis.analyze(blob, noticeOffset)',

  'reosPhiladelphiaProbateProductionExtractionOrchestration',

  'REOS.PhiladelphiaProbateProductionExtractionOrchestration',

  'REOS.PhiladelphiaProbateBoundedTextExtraction',

  'reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery',

  'REOS.PhiladelphiaProbateProductionOversizeTextEvidenceRecovery',

  'REOS.PhiladelphiaProbateBoundedOversizeTextEvidence',

  'PhiladelphiaProbateRecurringSource.resolve',

  'PAPhiladelphiaCountyConnector',

  'Drive.Files.create',

  'DocumentApp.openById',

  'DriveApp.getFileById',

  'CountyAdapters.Registry.fetch',

  '`25`',

  '`500`',

  'post-county production files: `62`',

  'component validators: `91`',

  'post-county production files: `63`',

  'component validators: `92`'
].forEach(
  requireExact
);

requireNormalized(
  'invalid notice offsets fail before HTTP'
);

requireNormalized(
  'source URL identity is validated before HTTP'
);

requireNormalized(
  'certified analysis metadata is validated before HTTP'
);

requireNormalized(
  'exactly one executable `UrlFetchApp.fetch` call site exists'
);

requireNormalized(
  'HTTP retry count is zero'
);

requireNormalized(
  'source discovery call-site count is zero'
);

requireNormalized(
  'the exact response Blob is handed to analysis'
);

requireNormalized(
  'exactly one `analysis.analyze` call site exists'
);

requireNormalized(
  'analysis receives the validated notice offset'
);

requireNormalized(
  'direct Drive-create call-site count is zero'
);

requireNormalized(
  'readiness-RPC invocation count is zero'
);

requireNormalized(
  'returned notice page is bounded to 25'
);

requireNormalized(
  'representative text is bounded to 500'
);

requireNormalized(
  'the offline validator performs no live HTTP'
);

requireNormalized(
  'the offline validator performs no live OCR'
);

requireNormalized(
  'historical `147` inventory MUST NOT increase'
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_ANALYSIS_PRODUCTION_TRANSPORT_CONTRACT_VALIDATOR_PASSED=true'
);

console.log(
  'FUTURE_RUNTIME=PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport.js'
);

console.log(
  'FUTURE_RPC=reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport'
);

console.log(
  'FUTURE_RPC_ARGUMENT_COUNT=1'
);

console.log(
  'INITIAL_NOTICE_OFFSET=0'
);

console.log(
  'SOURCE_URL_SHA256=98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca'
);

console.log(
  'EXPECTED_PDF_BYTES=4220387'
);

console.log(
  'EXPECTED_PDF_SHA256=90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028'
);

console.log(
  'MAX_PDF_BYTES=26214400'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'CERTIFIED_OVERSIZE_TEXT_LIMIT=600000'
);

console.log(
  'EXPECTED_TEXT_CHARACTER_COUNT=566435'
);

console.log(
  'EXPECTED_TEXT_SHA256=31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3'
);

console.log(
  'PB1_NOTICE_PAGE_SIZE=25'
);

console.log(
  'REPRESENTATIVE_TEXT_LIMIT=500'
);

console.log(
  'PB1_CURSOR_DOMAIN=PHL-PROBATE-PB1-V1'
);

console.log(
  'HTTP_FETCH_MAX_PER_INVOCATION=1'
);

console.log(
  'FOLLOW_REDIRECTS=false'
);

console.log(
  'HTTP_RETRY_AUTHORIZED=false'
);

console.log(
  'SOURCE_DISCOVERY_AUTHORIZED=false'
);

console.log(
  'ANALYSIS_INVOCATION_MAX_PER_TRANSPORT=1'
);

console.log(
  'SAME_RESPONSE_BLOB_HANDOFF_REQUIRED=true'
);

console.log(
  'LEGACY_NORMAL_EXTRACTION_AUTHORIZED=false'
);

console.log(
  'OLD_OVERSIZE_RECOVERY_AUTHORIZED=false'
);

console.log(
  'READINESS_RPC_INVOCATION_AUTHORIZED=false'
);

console.log(
  'DIRECT_DRIVE_OCR_AUTHORITY=false'
);

console.log(
  'OPA_LOOKUP_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'UNATTENDED_SCHEDULER_AUTHORITY=false'
);

console.log(
  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=62'
);

console.log(
  'CURRENT_COMPONENT_VALIDATOR_COUNT=91'
);

console.log(
  'EXPECTED_NEXT_POST_COUNTY_PRODUCTION_FILE_COUNT=63'
);

console.log(
  'EXPECTED_NEXT_COMPONENT_VALIDATOR_COUNT=92'
);

console.log(
  'HISTORICAL_RECONCILED_PRODUCTION_COUNT=147'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);
