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

const DESIGN =
  path.join(
    ROOT,
    'docs',
    'philadelphia-probate-certified-oversize-marker-evidence-recovery-production-transport-design-v1.md'
  );

assert.ok(
  fs.existsSync(DESIGN),
  'marker-evidence production transport design missing'
);

const text =
  fs.readFileSync(
    DESIGN,
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
    'missing exact design requirement: ' +
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
    'missing normalized design requirement: ' +
      JSON.stringify(value)
  );
}

[
  'Design contract only.',
  'The failed v142 invocation MUST NOT be retried.',
  'The future public RPC has exactly zero arguments.',
  'No source discovery is authorized.',
  'No fallback source is authorized.',
  'Maximum HTTP fetch count per invocation: `1`.',
  'HTTP retry count: `0`.',
  'HTTP fallback count: `0`.',
  'Marker-recovery failure MUST NOT cause a marker-recovery retry.',
  'No reconstructed Blob is authorized.',
  'No copied Blob is authorized.',
  'The transport owns only the one pinned HTTP GET and the one Blob handoff.',
  'Metadata mismatch must fail before HTTP.',
  'The diagnostic does not create a new OCR baseline.',
  'Maximum context count remains exactly `8`.',
  'Maximum characters per context remains exactly `800`.',
  'Maximum aggregate context characters remains exactly `6400`.',
  'The transport must not create a second, broader context mechanism.',
  'The diagnostic output exists only to establish exact bounded evidence',
  'Synthetic transport fixtures certify mechanics only.',
  'This document authorizes design only.',
  'This design gate MUST NOT change either current accounting count.',
  'This design does not authorize that transition.'
].forEach(
  requireNormalized
);

[
  'f2bfd33324e9542853eaaa3a147871676b40192c',
  'f452bf7efddfde543f4d191830a08081fc6bbdfa',

  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport.js',

  'scripts/validate-philadelphia-probate-certified-oversize-marker-evidence-recovery-production-transport-v1.js',

  'reosPhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport',

  'REOS.PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.recover(blob)',

  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf',

  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca',

  'assets.alm.com',
  'tlipn093026.pdf',
  '2026-09-30',

  '4220387',

  '26214400',

  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',

  '250000',

  '600000',

  '566435',

  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3',

  '`ESTATE`',
  '`NOTICE`',
  '`ORPHAN`',
  '`COURT`',
  '`DIVISION`',

  '`followRedirects: false`',

  '`muteHttpExceptions: true`',

  '`Accept: application/pdf`',

  '`UrlFetchApp.fetch(...)`',

  '`Drive.Files.create`',

  '`DocumentApp.openById`',

  '`DriveApp.getFileById`',

  '`locatorLabels`',
  '`startOffset`',
  '`endOffset`',
  '`rawOcrContext`',
  '`contextCharacterCount`',
  '`contextSha256`',

  '`64`',

  '`93`',

  '`65 / 94`'
].forEach(
  requireExact
);

[
  'source URL identity, host, basename, publication-date/basename relationship, and marker-component metadata must be validated before the one HTTP attempt is consumed',

  'A transport failure, HTTP failure, PDF-identity failure, marker-component failure, OCR failure, or cleanup failure MUST NOT cause a second HTTP request.',

  'The exact Blob obtained from the one authorized HTTP response and whose bytes were validated MUST be the Blob handed to',

  'The marker-recovery invocation call-site count must be exactly `1`.',

  'The marker-recovery invocation count per transport execution must never exceed `1`.',

  'The future production transport must not directly invoke:',

  'A non-empty Content-Type, when present, must identify `application/pdf`.',

  'An absent Content-Type alone does not defeat the exact byte-length, signature, and SHA-256 identity checks.',

  'A non-empty non-PDF Content-Type must fail closed.',

  'full OCR text',

  'generic OCR preview',

  'complete PDF bytes',

  'temporary Drive document ID',

  'parsed estate notices',

  'decedent candidates',

  'No automatic MAO or offer authority may arise from this diagnostic.'
].forEach(
  requireNormalized
);

assert.strictEqual(
  (
    text.match(
      /Maximum context count remains exactly `8`\./g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    text.match(
      /Maximum characters per context remains exactly `800`\./g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    text.match(
      /Maximum aggregate context characters remains exactly `6400`\./g
    ) ||
    []
  ).length,
  1
);

assert.ok(
  !text.includes(
    'This design authorizes production transport implementation.'
  )
);

assert.ok(
  !text.includes(
    'This design authorizes production RPC execution.'
  )
);

assert.ok(
  !text.includes(
    'This design authorizes parser repair.'
  )
);

assert.ok(
  !text.includes(
    'This design authorizes the 65 / 94 accounting transition.'
  )
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_MARKER_EVIDENCE_RECOVERY_PRODUCTION_TRANSPORT_DESIGN_VALIDATOR_PASSED=true'
);

console.log(
  'DESIGN_ONLY=true'
);

console.log(
  'BASE_MAIN=f2bfd33324e9542853eaaa3a147871676b40192c'
);

console.log(
  'BASE_MAIN_TREE=f452bf7efddfde543f4d191830a08081fc6bbdfa'
);

console.log(
  'FUTURE_RPC_ARGUMENT_COUNT=0'
);

console.log(
  'HTTP_FETCH_MAX_PER_INVOCATION=1'
);

console.log(
  'HTTP_RETRY_COUNT=0'
);

console.log(
  'HTTP_FALLBACK_COUNT=0'
);

console.log(
  'FOLLOW_REDIRECTS=false'
);

console.log(
  'SAME_RESPONSE_BLOB_HANDOFF_REQUIRED=true'
);

console.log(
  'MARKER_RECOVERY_INVOCATION_MAX=1'
);

console.log(
  'EXPECTED_PDF_BYTES=4220387'
);

console.log(
  'MAX_PDF_BYTES=26214400'
);

console.log(
  'EXPECTED_PDF_SHA256=90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028'
);

console.log(
  'EXPECTED_TEXT_CHARACTER_COUNT=566435'
);

console.log(
  'EXPECTED_TEXT_SHA256=31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3'
);

console.log(
  'FIXED_LOCATOR_FAMILY_COUNT=5'
);

console.log(
  'MAX_CONTEXT_COUNT=8'
);

console.log(
  'MAX_CONTEXT_CHARACTERS=800'
);

console.log(
  'MAX_AGGREGATE_CONTEXT_CHARACTERS=6400'
);

console.log(
  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=64'
);

console.log(
  'CURRENT_COMPONENT_VALIDATOR_COUNT=93'
);

console.log(
  'POTENTIAL_LATER_65_94_ACCOUNTING_AUTHORIZED=false'
);

console.log(
  'RUNTIME_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'PUBLIC_RPC_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'LIVE_HTTP_AUTHORIZED=false'
);

console.log(
  'LIVE_OCR_AUTHORIZED=false'
);

console.log(
  'PROBATE_PARSING_AUTHORIZED=false'
);

console.log(
  'PARSER_REPAIR_AUTHORIZED=false'
);

console.log(
  'PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);

console.log(
  'FAILED_V142_RPC_ATTEMPT_COUNT=1'
);

console.log(
  'FAILED_V142_RPC_RETRY_COUNT=0'
);

console.log(
  'FAILED_V142_RPC_RETRY_AUTHORIZED=false'
);
