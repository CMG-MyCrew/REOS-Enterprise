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
    'philadelphia-probate-safe-oversize-publication-analysis-contract-v1.md'
  );

assert.ok(
  fs.existsSync(CONTRACT),
  'safe oversize publication analysis contract missing'
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
  'does not authorize implementation or production execution',
  'normal bounded extraction limit remains exactly',
  'PB1 is not accepted for normal extraction',
  'separate maximum',
  'A changed OCR result MUST NOT silently establish a new baseline.',
  'The future component is a Blob-only analysis component.',
  'It MUST NOT perform HTTP.',
  'It MUST NOT expose a production RPC.',
  'No temporary artifact may be created before those checks pass.',
  'Cleanup is mandatory and fail-closed.',
  'The complete OCR text may exist only in memory',
  'Probate parsing receives no authority until',
  'No property record is authorized at this stage.',
  'OPA/property reconciliation is a separate later integration gate.',
  'legacy path for the newly certified PB1 production flow',
  'This design contract grants zero production HTTP authority.',
  'does not add probate to the unattended county scheduler allowlist',
  'No automatic MAO or offer authority may arise'
].forEach(
  requireNormalized
);

[
  '566435',
  '600000',
  '250000',
  '33565',
  '4220387',
  '26214400',

  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca',

  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',

  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3',

  'PhiladelphiaProbateCertifiedOversizePublicationAnalysis.js',

  'validate-philadelphia-probate-certified-oversize-publication-analysis-v1.js',

  'ESTATE NOTICES',
  "ORPHANS' COURT DIVISION",
  'U+2013',
  '500',
  'PHL-PROBATE-PB1-V1',
  '`25`'
].forEach(
  requireExact
);

requireNormalized(
  'text character count is exactly `566435`'
);

requireNormalized(
  'text SHA-256 is exactly'
);

requireNormalized(
  'one `Drive.Files.create`'
);

requireNormalized(
  'one `DocumentApp.openById`'
);

requireNormalized(
  'one document body text read'
);

requireNormalized(
  'one cleanup attempt against the exact created document'
);

requireNormalized(
  'MUST NOT search Drive for prior OCR artifacts'
);

requireNormalized(
  'The parser MUST NOT receive text before those checks pass.'
);

requireNormalized(
  'representative text remains bounded to at most `500` characters per notice'
);

requireNormalized(
  'returned notice page may contain no more than `25` notice candidates'
);

requireNormalized(
  'The safe oversize publication analysis component MUST NOT:'
);

requireNormalized(
  '- query Philadelphia OPA;'
);

requireNormalized(
  'MUST NOT call or depend on the legacy direct extraction function'
);

requireNormalized(
  'one exact HTTPS GET'
);

requireNormalized(
  'redirects disabled'
);

requireNormalized(
  'no retry or fallback'
);

requireNormalized(
  'historical reconciliation at `147`'
);

console.log(
  'PB1_SAFE_OVERSIZE_PUBLICATION_ANALYSIS_CONTRACT_VALIDATOR_PASSED=true'
);

console.log(
  'RECOVERED_TEXT_CHARACTER_COUNT=566435'
);

console.log(
  'RECOVERED_TEXT_SHA256=31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'CERTIFIED_OVERSIZE_TEXT_LIMIT=600000'
);

console.log(
  'CERTIFIED_OVERSIZE_HEADROOM=33565'
);

console.log(
  'PB1_NOTICE_PAGE_SIZE=25'
);

console.log(
  'REPRESENTATIVE_TEXT_LIMIT=500'
);

console.log(
  'FUTURE_COMPONENT_HTTP_AUTHORITY=false'
);

console.log(
  'FUTURE_COMPONENT_PRODUCTION_RPC_AUTHORITY=false'
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
  'NORMAL_EXTRACTION_LIMIT_CHANGE_AUTHORIZED=false'
);

console.log(
  'HISTORICAL_RECONCILED_PRODUCTION_COUNT=147'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);
