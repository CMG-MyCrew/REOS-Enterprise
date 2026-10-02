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
    'philadelphia-probate-certified-oversize-publication-analysis-readiness-probe-contract-v1.md'
  );

assert.ok(
  fs.existsSync(CONTRACT),
  'readiness-probe contract missing'
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
  'exactly one zero-argument RPC',
  'The readiness probe MUST NOT invoke `analysis.analyze`.',
  'No Apps Script service is required to establish runtime-surface readiness.',
  'The readiness probe MUST NOT inspect:',
  'The readiness probe receives no Blob and has zero transport authority.',
  'The readiness probe MUST NOT parse Estate Notices.',
  'The readiness probe verifies expected metadata values:',
  'Readiness success does not itself authorize oversize analysis execution.',
  'No automatic MAO or offer authority may arise from readiness success.',
  'This design gate does not modify central accounting.',
  'historical reconciled production inventory remains `147`'
].forEach(
  requireNormalized
);

[
  'reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe()',

  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe.js',

  'scripts/validate-philadelphia-probate-certified-oversize-publication-analysis-readiness-probe-v1.js',

  'REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysis',

  'analysisVersion: 1',

  '2026-09-30',

  '4220387',

  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',

  '26214400',

  '250000',

  '600000',

  '566435',

  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3',

  'PHL-PROBATE-PB1-V1',

  '`25`',

  '`500`',

  'analysis.analyze',

  '`analysisExecuted: false`',

  '`deploymentInspectionExecuted`',

  '`externalHttpExecuted`',

  '`probateParsingExecuted`',

  '`opaLookupExecuted`',

  '`persistenceExecuted`',

  '`maoAuthorityGranted`',

  '`offerAuthorityGranted`'
].forEach(
  requireExact
);

for (
  const token
  of [
    '`UrlFetchApp`',
    '`Utilities`',
    '`Drive.Files`',
    '`DriveApp`',
    '`DocumentApp`',
    '`PropertiesService`',
    '`ScriptApp`',
    '`SpreadsheetApp`',
    '`LockService`',
    '`CalendarApp`',
    '`GmailApp`'
  ]
) {
  requireExact(token);
}

requireNormalized(
  'the runtime contains zero Apps Script service references'
);

requireNormalized(
  '`analysis.analyze` is type-checked'
);

requireNormalized(
  '`analysis.analyze` is never invoked'
);

requireNormalized(
  'throwing analysis mocks confirm zero invocation'
);

requireNormalized(
  'no live Apps Script side effect occurs during offline validation'
);

requireNormalized(
  'post-county production files: `61`'
);

requireNormalized(
  'component validators: `90`'
);

requireNormalized(
  'post-county production files: `62`'
);

requireNormalized(
  'component validators: `91`'
);

requireNormalized(
  'historical `147` inventory MUST NOT be increased'
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_ANALYSIS_READINESS_PROBE_CONTRACT_VALIDATOR_PASSED=true'
);

console.log(
  'PUBLIC_RPC_NAME=reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe'
);

console.log(
  'PUBLIC_RPC_ARGUMENT_COUNT=0'
);

console.log(
  'ANALYSIS_VERSION=1'
);

console.log(
  'EXPECTED_PUBLICATION_DATE=2026-09-30'
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
  'ANALYZE_INVOCATION_AUTHORIZED=false'
);

console.log(
  'EXTERNAL_SERVICE_REFERENCE_AUTHORIZED=false'
);

console.log(
  'DEPLOYMENT_INSPECTION_AUTHORIZED=false'
);

console.log(
  'HTTP_AUTHORITY=false'
);

console.log(
  'OCR_AUTHORITY=false'
);

console.log(
  'PROBATE_PARSING_AUTHORITY=false'
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
  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=61'
);

console.log(
  'CURRENT_COMPONENT_VALIDATOR_COUNT=90'
);

console.log(
  'EXPECTED_NEXT_POST_COUNTY_PRODUCTION_FILE_COUNT=62'
);

console.log(
  'EXPECTED_NEXT_COMPONENT_VALIDATOR_COUNT=91'
);

console.log(
  'HISTORICAL_RECONCILED_PRODUCTION_COUNT=147'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);
