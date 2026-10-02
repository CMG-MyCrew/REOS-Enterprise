'use strict';

const assert =
  require('assert');

const fs =
  require('fs');

const path =
  'docs/philadelphia-probate-certified-oversize-analysis-bounded-marker-evidence-recovery-design-v1.md';

const text =
  fs.readFileSync(
    path,
    'utf8'
  );

function requireText(value) {
  assert(
    text.includes(value),
    'Missing design requirement: ' +
      value
  );
}

for (
  const required
  of [
    'Design contract only.',
    'Error: PB1 certified oversize Estate Notices marker was not found.',
    'scripts.run POST count: exactly `1`',
    'retry count: exactly `0`',
    '`566435`',
    '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3',
    '`4220387`',
    '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',
    '/ESTATE[\\s]+NOTICES[\\s]+ORPHANS\'?[\\s]+COURT[\\s]+DIVISION/i',
    'changing or broadening the production parser marker now would be',
    'guesswork',
    'synthetic OCR',
    'does not prove that the real certified OCR text contains that exact',
    'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.js',
    'scripts/validate-philadelphia-probate-certified-oversize-marker-evidence-recovery-v1.js',
    'one `Drive.Files.create`',
    'one `DocumentApp.openById`',
    'one body `.getText()`',
    'one cleanup attempt against the exact created document',
    'maximum contexts: `8`',
    'maximum characters per context: `800`',
    'maximum aggregate returned context characters: `6400`',
    '`ESTATE`',
    '`NOTICE`',
    '`ORPHAN`',
    '`COURT`',
    '`DIVISION`',
    'optional whitespace between letters',
    'Locator expressions are not probate parsing grammar.',
    'No arbitrary caller-selected slice is authorized.',
    'The complete OCR text must never leave the function.',
    '`parseEstateNotices_`',
    'must not return parsed notices',
    'must not return decedent candidate records',
    'reosPhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport',
    'redirects disabled',
    'no retry',
    'no fallback',
    'diagnostic RPC with distinct evidence',
    'must never be represented as a retry',
    'offline synthetic fixture tests are explicitly described as mechanical',
    'no live HTTP, OCR, Drive, or DocumentApp side effect occurs during offline',
    'OPA lookup',
    'property reconciliation',
    'lead creation',
    'persistence',
    'ARV',
    'repair-scope',
    'MAO',
    'offer',
    'This document authorizes design only.'
  ]
) {
  requireText(
    required
  );
}

assert.strictEqual(
  (
    text.match(
      /maximum contexts: `8`/g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    text.match(
      /maximum characters per context: `800`/g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    text.match(
      /maximum aggregate returned context characters: `6400`/g
    ) ||
    []
  ).length,
  1
);

assert(
  !text.includes(
    'This design authorizes production execution.'
  )
);

assert(
  !text.includes(
    'This design authorizes parser repair.'
  )
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_ANALYSIS_BOUNDED_MARKER_EVIDENCE_RECOVERY_DESIGN_VALIDATOR_PASSED=true'
);

console.log(
  'DESIGN_ONLY=true'
);

console.log(
  'FAILED_V142_RPC_ATTEMPT_COUNT=1'
);

console.log(
  'FAILED_V142_RPC_RETRY_COUNT=0'
);

console.log(
  'EXACT_PDF_BYTES=4220387'
);

console.log(
  'EXACT_OCR_CHARACTER_COUNT=566435'
);

console.log(
  'FIXED_LOCATOR_FAMILY_COUNT=5'
);

console.log(
  'MAX_MARKER_CONTEXT_COUNT=8'
);

console.log(
  'MAX_MARKER_CONTEXT_CHARACTERS=800'
);

console.log(
  'MAX_AGGREGATE_MARKER_CONTEXT_CHARACTERS=6400'
);

console.log(
  'FULL_OCR_TEXT_RETURN_AUTHORIZED=false'
);

console.log(
  'ARBITRARY_CALLER_SLICE_AUTHORIZED=false'
);

console.log(
  'PROBATE_PARSING_AUTHORIZED=false'
);

console.log(
  'PARSER_REPAIR_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_RPC_AUTHORIZED=false'
);

console.log(
  'LIVE_HTTP_AUTHORIZED=false'
);

console.log(
  'LIVE_OCR_AUTHORIZED=false'
);

console.log(
  'OPA_LOOKUP_AUTHORIZED=false'
);

console.log(
  'PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);
