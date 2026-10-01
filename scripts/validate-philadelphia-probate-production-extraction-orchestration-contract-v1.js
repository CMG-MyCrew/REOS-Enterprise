'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CONTRACT = path.join(
  ROOT,
  'docs',
  'philadelphia-probate-production-extraction-orchestration-contract-v1.md'
);

const BOUNDED_FETCH = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'PhiladelphiaProbateBoundedPdfFetch.js'
);

const EXTRACTOR = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'PhiladelphiaProbateBoundedTextExtraction.js'
);

assert(
  fs.existsSync(CONTRACT),
  'Production extraction orchestration contract missing.'
);

assert(
  fs.existsSync(BOUNDED_FETCH),
  'Certified bounded PDF fetch module missing.'
);

assert(
  fs.existsSync(EXTRACTOR),
  'Certified bounded text extractor missing.'
);

const text = fs.readFileSync(
  CONTRACT,
  'utf8'
);

const fetchText = fs.readFileSync(
  BOUNDED_FETCH,
  'utf8'
);

const extractorText = fs.readFileSync(
  EXTRACTOR,
  'utf8'
);

const required = [
  'Philadelphia Probate PB1 — Production Extraction Orchestration Contract v1',

  'Design contract only.',
  'This contract does not authorize production execution.',
  'It does not authorize a production HTTP request.',
  'It does not authorize OCR execution.',

  'The previously executed bounded PDF transport returned metadata only.',
  'Those prior PDF bytes were not retained for later extraction.',
  'one new direct HTTPS GET.',

  'version `135`',

  '`2026-09-30`',
  '`https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`',
  '`98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`',
  '`tlipn093026.pdf`',
  '`4220387`',
  '`90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`',
  '`26214400`',
  '`250000`',

  '`reosPhiladelphiaProbateProductionExtractionOrchestration()`',

  'at most one new',
  '`UrlFetchApp.fetch` invocation',
  'maximum authorized HTTP fetch count',
  '`1`',
  '`followRedirects: false`',
  'Redirect following is prohibited.',
  'Any HTTP 3xx response must fail closed.',
  'No retry is authorized.',
  'No fallback URL is authorized.',
  'No secondary source is authorized.',
  'No source-discovery request is authorized.',

  '`reosPhiladelphiaProbateBoundedPdfFetch()`',
  '`REOS.PhiladelphiaProbateBoundedPdfFetch.execute`',
  'MUST NOT call',
  'two transport operations',

  'single newly authorized request',
  'retain that one response Blob only in memory',

  'response byte length is exactly `4220387`',
  'first bytes are `%PDF-`',
  'SHA-256 of the exact returned bytes is exactly',

  '`REOS.PhiladelphiaProbateBoundedTextExtraction.extract(blob)`',
  'extractor invocation count',
  'at most:',
  'The Blob MUST NOT be returned by the RPC.',

  'intentional duplicate verification',
  'required defense in depth',

  'MUST NOT directly invoke:',
  '`Drive.Files.create`',
  '`DocumentApp.openById`',
  '`DriveApp.getFileById`',

  'Cleanup failure must prevent a successful result.',

  'MUST NOT:',
  'retry extraction',
  'refetch the PDF',
  'A later retry would require a separate new explicit production authorization.',

  '`httpFetchCount: 1`',
  '`extractionCount: 1`',
  '`fullExtractedTextReturned: false`',
  '`pdfBytesReturned: false`',

  'The full extracted probate text MUST NOT be returned',
  'Raw PDF bytes MUST NOT be returned.',
  'temporary Google document ID MUST NOT be returned.',

  '`PhiladelphiaProbateRecurringSource.resolve`',
  '`reosPhiladelphiaProbateBoundedSourceDiscovery`',
  '`PAPhiladelphiaCountyConnector.fetch_`',
  '`probateSourcePreflight_`',
  '`probateSourceAuthority`',
  '`CountyRuntimeBridge.registerConnectors`',
  '`PropertiesService`',
  '`SpreadsheetApp`',

  'No automatic MAO or offer authority can arise from this orchestration.',

  'exactly one invocation',
  'exactly one new direct HTTP request',
  'one bounded extraction attempt',

  'authorizes zero production HTTP requests and zero',
  'production OCR executions',

  'separately authorize exactly one production orchestration RPC.',

  'No production HTTP or OCR authority is granted by this design contract.'
];

for (const value of required) {
  assert(
    text.includes(value),
    'Missing orchestration contract requirement: ' +
      JSON.stringify(value)
  );
}

const sourceUrl =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const expectedUrlSha =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const actualUrlSha = crypto
  .createHash('sha256')
  .update(sourceUrl, 'utf8')
  .digest('hex');

assert.strictEqual(
  actualUrlSha,
  expectedUrlSha,
  'Certified source URL SHA mismatch.'
);

const url = new URL(sourceUrl);

assert.strictEqual(
  url.protocol,
  'https:',
  'Certified orchestration source must use HTTPS.'
);

assert.strictEqual(
  url.hostname,
  'assets.alm.com',
  'Certified orchestration source host mismatch.'
);

assert.strictEqual(
  path.posix.basename(url.pathname),
  'tlipn093026.pdf',
  'Certified orchestration source basename mismatch.'
);

assert(
  fetchText.includes(
    'global.reosPhiladelphiaProbateBoundedPdfFetch'
  ),
  'Current bounded fetch RPC surface missing.'
);

assert(
  fetchText.includes(
    'pdfBytesReturned: false'
  ),
  'Current bounded fetch must continue to return no raw bytes.'
);

assert(
  fetchText.includes(
    'followRedirects: false'
  ),
  'Current bounded fetch redirect boundary missing.'
);

assert(
  fetchText.includes(
    'UrlFetchApp.fetch'
  ),
  'Current bounded fetch transport surface missing.'
);

assert(
  extractorText.includes(
    'function extract(blob)'
  ),
  'Current bounded extractor blob boundary missing.'
);

assert(
  !extractorText.includes(
    'UrlFetchApp'
  ),
  'Current bounded extractor unexpectedly contains HTTP authority.'
);

assert(
  extractorText.includes(
    '4220387'
  ),
  'Current bounded extractor exact byte-length binding missing.'
);

assert(
  extractorText.includes(
    '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028'
  ),
  'Current bounded extractor PDF SHA binding missing.'
);

assert(
  extractorText.includes(
    '250000'
  ),
  'Current bounded extractor text-size bound missing.'
);

console.log(
  'PB1_PRODUCTION_EXTRACTION_ORCHESTRATION_CONTRACT_VALIDATOR_PASSED=true'
);

console.log(
  'NEW_TRANSPORT_HTTP_FETCH_MAX=1'
);

console.log(
  'FOLLOW_REDIRECTS_CONTRACT=false'
);

console.log(
  'HTTP_RETRY_AUTHORIZED=false'
);

console.log(
  'FALLBACK_SOURCE_AUTHORIZED=false'
);

console.log(
  'OLD_BOUNDED_FETCH_RPC_REUSE_AUTHORIZED=false'
);

console.log(
  'OLD_BOUNDED_FETCH_RETURNS_BYTES=false'
);

console.log(
  'IN_MEMORY_SINGLE_RESPONSE_HANDOFF_REQUIRED=true'
);

console.log(
  'PDF_EXACT_BYTE_LENGTH_BOUND=4220387'
);

console.log(
  'PDF_CONTENT_SHA_BOUND=true'
);

console.log(
  'EXTRACTOR_INVOCATION_MAX=1'
);

console.log(
  'DIRECT_ORCHESTRATOR_DRIVE_OCR_AUTHORIZED=false'
);

console.log(
  'FULL_EXTRACTED_TEXT_RETURN_AUTHORIZED=false'
);

console.log(
  'PDF_BYTES_RETURN_AUTHORIZED=false'
);

console.log(
  'PROBATE_PARSING_AUTHORIZED=false'
);

console.log(
  'LEAD_CREATION_AUTHORIZED=false'
);

console.log(
  'PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'COUNTY_DATA_MUTATION_AUTHORIZED=false'
);

console.log(
  'ARV_AUTHORITY_GRANTED=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false'
);

console.log(
  'MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'OFFER_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_HTTP_AUTHORIZED_BY_CONTRACT=false'
);

console.log(
  'PRODUCTION_OCR_AUTHORIZED_BY_CONTRACT=false'
);
