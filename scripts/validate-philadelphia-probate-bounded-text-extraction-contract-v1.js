'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CONTRACT = path.join(
  ROOT,
  'docs',
  'philadelphia-probate-bounded-text-extraction-contract-v1.md'
);

assert(
  fs.existsSync(CONTRACT),
  'Bounded text extraction contract missing.'
);

const text = fs.readFileSync(CONTRACT, 'utf8');

const required = [
  'Philadelphia Probate Bounded PDF Text Extraction Contract v1',
  '2026-09-30',
  'tlipn093026.pdf',
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca',
  '4220387',
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',
  '26214400',
  'extractProbateNoticeText_',
  'MUST NOT be invoked',
  'separate transport from extraction',
  'already been obtained by a separately authorized bounded transport',
  'fail closed before temporary Drive artifact creation',
  'zero independent HTTP authority',
  'MUST NOT refetch the certified PDF',
  'exactly one `Drive.Files.create`',
  'exactly one `DocumentApp.openById`',
  'exactly one cleanup attempt',
  'attempt cleanup on every path after temporary document creation',
  'fail closed if cleanup cannot be confirmed',
  'MUST NOT silently swallow cleanup failure',
  'MUST NOT return the entire extracted text',
  'No raw PDF bytes may be returned',
  'maximum accepted extracted-text',
  'one temporary document creation',
  'one read',
  'one cleanup of that exact document',
  'ARV authority',
  'repair-scope authority',
  'MAO authority',
  'offer-generation authority',
  'offer-submission authority',
  'wrong PDF content SHA-256',
  'cleanup failure',
  'cleanup MUST still be attempted',
  'zero `UrlFetchApp` surface',
  'PDF identity verification precedes OCR creation',
  'cleanup failure prevents success',
  'separately authorize exactly one bounded production extraction RPC',
  'No production OCR authority is granted by this design contract.'
];

for (const value of required) {
  assert(
    text.includes(value),
    'Missing contract requirement: ' + value
  );
}

assert(
  text.includes('`UrlFetchApp.fetch`'),
  'Explicit UrlFetchApp.fetch prohibition missing.'
);

assert(
  text.includes('`PhiladelphiaProbateRecurringSource.resolve`'),
  'Resolver prohibition missing.'
);

assert(
  text.includes('`probateSourcePreflight_`'),
  'Broad preflight prohibition missing.'
);

assert(
  text.includes('`probateSourceAuthority`'),
  'Probate authority prohibition missing.'
);

assert(
  text.includes('PropertiesService mutation'),
  'PropertiesService mutation prohibition missing.'
);

assert(
  text.includes('SpreadsheetApp mutation'),
  'SpreadsheetApp mutation prohibition missing.'
);

assert(
  text.includes('county-data mutation'),
  'County-data mutation prohibition missing.'
);

assert(
  text.includes('no probate parsing or lead creation'),
  'Probate parsing/lead-creation prohibition missing.'
);

console.log(
  'PB1_BOUNDED_TEXT_EXTRACTION_CONTRACT_VALIDATOR_PASSED=true'
);
console.log(
  'TRANSPORT_AND_EXTRACTION_SEPARATED=true'
);
console.log(
  'SECOND_PDF_FETCH_AUTHORITY=false'
);
console.log(
  'PDF_CONTENT_SHA_BOUND=true'
);
console.log(
  'TEMP_DRIVE_ARTIFACT_COUNT_MAX=1'
);
console.log(
  'DOCUMENT_OPEN_COUNT_MAX=1'
);
console.log(
  'CLEANUP_REQUIRED_ON_POST_CREATE_PATHS=true'
);
console.log(
  'CLEANUP_FAILURE_FAILS_CLOSED=true'
);
console.log(
  'FULL_EXTRACTED_TEXT_RETURN_AUTHORIZED=false'
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
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);
console.log(
  'PRODUCTION_OCR_AUTHORIZED=false'
);
