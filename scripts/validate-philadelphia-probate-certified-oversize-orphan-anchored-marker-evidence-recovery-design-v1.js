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
    'philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-design-v1.md'
  );

assert.ok(
  fs.existsSync(DESIGN),
  'orphan-anchored marker-evidence design missing'
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
  'This design gate MUST NOT change any of those accounting counts.',
  'This design authorizes no runtime-accounting transition.',
  'The exact OCR pipeline is therefore proven for this publication.',
  'A third v143 RPC is not authorized.',
  'V1_FRONT_MATTER_LOCATOR_STARVATION',
  'This finding does not prove a probate-parser defect.',
  'Parser repair remains unauthorized.',
  '`ORPHAN` is the only label permitted to allocate a candidate evidence window.',
  'The implementation must scan the complete exact recovered OCR text for all fixed `ORPHAN` locator hits before applying the maximum returned-context count.',
  'Every returned context MUST include `ORPHAN` in its `locatorLabels`.',
  'If the exact certified OCR produces zero fixed `ORPHAN` hits, the successor must fail closed with no generic fallback.',
  'There is no fallback to `COURT`.',
  'There is no fallback to `NOTICE`.',
  'There is no fallback to `ESTATE`.',
  'Candidates containing both `COURT` and `DIVISION` are ranked before candidates that do not contain both labels.',
  'Within that partition, candidates containing `NOTICE` are ranked before candidates without `NOTICE`.',
  'Within that partition, candidates containing `ESTATE` are ranked before candidates without `ESTATE`.',
  'Co-presence does not establish marker validity.',
  'Exact duplicate candidate windows must be deduplicated before ranking.',
  'A lower-ranked candidate that overlaps an already-selected higher-ranked candidate must be skipped.',
  'After selection, returned contexts must be ordered by ascending start offset.',
  'The selector must never expand a context in order to merge overlapping candidates.',
  'The complete OCR text must never leave the function.',
  'This design does not authorize a successor production transport.',
  'A third v143 RPC remains prohibited.',
  'Synthetic fixtures certify selection mechanics only.',
  'This document authorizes design only.'
].forEach(
  requireNormalized
);

[
  '866c0ee94c8f6f6bcaa91e743df525383692dcfa',
  '30a94af37323d745ceb02efa18cbf234100c6d5d',

  '`65`',
  '`94`',
  '`147`',

  '`4220387`',
  '`26214400`',
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',

  '`566435`',
  '`250000`',
  '`600000`',
  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3',

  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.js',

  'scripts/validate-philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-v1.js',

  '`ESTATE`',
  '`NOTICE`',
  '`ORPHAN`',
  '`COURT`',
  '`DIVISION`',

  '`Drive.Files.create`',
  '`DocumentApp.openById`',

  '`locatorLabels`',
  '`startOffset`',
  '`endOffset`',
  '`rawOcrContext`',
  '`contextCharacterCount`',
  '`contextSha256`',

  '`parseEstateNotices_`',

  '/ESTATE[\\s]+NOTICES[\\s]+ORPHANS\'?[\\s]+COURT[\\s]+DIVISION/i',

  'Maximum selected contexts: `8`.',
  'Maximum aggregate returned context characters: `6400`.',
  'Maximum contexts: `8`.',
  'Maximum characters per context: `800`.'
].forEach(
  requireExact
);

[
  'The successor MUST NOT contain or invoke the production parser marker grammar',

  'Generic `ESTATE`, `NOTICE`, `COURT`, or `DIVISION` hits MUST NOT independently allocate evidence windows.',

  'No required phrase, adjacency, ordering, punctuation, apostrophe, plural form, or parser grammar may be inferred by the evidence selector.',

  'This ranking does not validate a probate heading.',

  'The existence of an `ORPHAN`-anchored context does not authorize a parser change.',

  'No automatic MAO or offer authority may arise from this design or future diagnostic evidence.'
].forEach(
  requireNormalized
);

assert.strictEqual(
  (
    text.match(
      /Maximum contexts: `8`\./g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    text.match(
      /Maximum characters per context: `800`\./g
    ) ||
    []
  ).length,
  1
);

assert.strictEqual(
  (
    text.match(
      /Maximum aggregate returned context characters: `6400`\./g
    ) ||
    []
  ).length,
  2
);

assert.ok(
  !text.includes(
    'This design authorizes runtime implementation.'
  )
);

assert.ok(
  !text.includes(
    'This design authorizes production transport implementation.'
  )
);

assert.ok(
  !text.includes(
    'This design authorizes parser repair.'
  )
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_ORPHAN_ANCHORED_MARKER_EVIDENCE_RECOVERY_DESIGN_VALIDATOR_PASSED=true'
);

console.log(
  'DESIGN_ONLY=true'
);

console.log(
  'BASE_MAIN=866c0ee94c8f6f6bcaa91e743df525383692dcfa'
);

console.log(
  'BASE_MAIN_TREE=30a94af37323d745ceb02efa18cbf234100c6d5d'
);

console.log(
  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=65'
);

console.log(
  'CURRENT_COMPONENT_VALIDATOR_COUNT=94'
);

console.log(
  'CURRENT_RECONCILED_PRODUCTION_INVENTORY_COUNT=147'
);

console.log(
  'EXPECTED_PDF_BYTES=4220387'
);

console.log(
  'EXPECTED_OCR_CHARACTER_COUNT=566435'
);

console.log(
  'FIXED_LOCATOR_FAMILY_COUNT=5'
);

console.log(
  'PRIMARY_ANCHOR=ORPHAN'
);

console.log(
  'ALL_ORPHAN_HITS_DISCOVERED_BEFORE_CONTEXT_LIMIT=true'
);

console.log(
  'GENERIC_COURT_WINDOW_ALLOCATION_AUTHORIZED=false'
);

console.log(
  'GENERIC_NOTICE_WINDOW_ALLOCATION_AUTHORIZED=false'
);

console.log(
  'GENERIC_ESTATE_WINDOW_ALLOCATION_AUTHORIZED=false'
);

console.log(
  'EVERY_RETURNED_CONTEXT_REQUIRES_ORPHAN=true'
);

console.log(
  'ZERO_ORPHAN_GENERIC_FALLBACK_AUTHORIZED=false'
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
  'FULL_OCR_RETURN_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_TRANSPORT_IMPLEMENTATION_AUTHORIZED=false'
);

console.log(
  'THIRD_V143_RPC_AUTHORIZED=false'
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
