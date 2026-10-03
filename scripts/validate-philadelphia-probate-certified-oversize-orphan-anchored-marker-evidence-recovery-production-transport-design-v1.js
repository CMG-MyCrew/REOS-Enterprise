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
    'philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-production-transport-design-v1.md'
  );

assert.ok(
  fs.existsSync(DESIGN),
  'orphan-anchored production transport design missing'
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

  'It MUST NOT be represented as a retry of v142 or as a third v143 invocation.',

  'This design gate MUST NOT change any current accounting count.',

  'This design does not authorize any accounting transition.',

  'A third v143 RPC is not authorized.',

  'The future successor diagnostic RPC may be attempted at most once under a separate explicit live-execution authorization.',

  'Failure of that future successor RPC does not itself authorize a retry.',

  'The future public RPC has exactly zero arguments.',

  'No source discovery is authorized.',

  'No alternate URL is authorized.',

  'No fallback source is authorized.',

  'Metadata mismatch must fail before HTTP.',

  'Maximum HTTP fetch count per invocation: `1`.',

  'HTTP retry count: `0`.',

  'HTTP fallback count: `0`.',

  'No reconstructed Blob is authorized.',

  'No copied Blob is authorized.',

  'The successor-recovery invocation call-site count must be exactly `1`.',

  'The successor-recovery invocation count per transport execution must never exceed `1`.',

  'Successor-recovery failure MUST NOT cause a recovery retry.',

  'The transport owns no OCR lifecycle.',

  'The successor diagnostic does not create a new OCR baseline.',

  '`ORPHAN` remains the required primary evidence anchor.',

  'Every successful returned context MUST include `ORPHAN` in its `locatorLabels`.',

  'A successful returned context without `ORPHAN` MUST cause the transport to fail closed.',

  'Maximum context count remains exactly `8`.',

  'Maximum characters per context remains exactly `800`.',

  'Maximum aggregate context characters remains exactly `6400`.',

  'Returned contexts must remain in ascending source-offset order.',

  'Returned contexts must remain non-overlapping.',

  'The future transport MUST NOT contain or invoke the production parser marker grammar:',

  'The existence of ORPHAN-anchored evidence does not establish the exact probate marker form and does not authorize parser repair.',

  'The successor transport MUST NOT be executed live from immutable Apps Script version `143`.',

  'A third v143 RPC remains prohibited.',

  'This design itself authorizes zero successor production RPC attempts.',

  'Synthetic transport fixtures certify mechanics only and do not establish a new OCR baseline or parser grammar.',

  'This document authorizes design only.'
].forEach(
  requireNormalized
);

[
  '879f941a4b490baf1be188ebd7bef7baffb70339',
  '156659dd6ed949a37b7c0f1ebc698343f0271acc',

  '`66`',
  '`95`',
  '`147`',
  '`94`',
  '`67 / 96`',

  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport.js',

  'scripts/validate-philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-production-transport-v1.js',

  'reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport',

  'REOS.PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.recover(blob)',

  'REOS.PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.recover(blob)',

  '288ea256ddf9d93af3cce7780700c1f823dbd4ea8649fd307d369923610655a0',

  '7db85b98bedbf7afcead062d4a040c81f6a1eec4a004508c739381e680175527',

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
  '`Drive.Files.list`',
  '`Drive.Files.get`',
  '`DocumentApp.openById`',
  '`DriveApp.getFileById`',

  '`locatorLabels`',
  '`startOffset`',
  '`endOffset`',
  '`rawOcrContext`',
  '`contextCharacterCount`',
  '`contextSha256`',

  "/ESTATE[\\s]+NOTICES[\\s]+ORPHANS'?[\\s]+COURT[\\s]+DIVISION/i",

  '`143`',
  '`2`'
].forEach(
  requireExact
);

[
  'The source URL identity, host, basename, publication-date/basename relationship, and successor-component metadata must be validated before the one HTTP attempt is consumed.',

  'A transport failure, HTTP failure, PDF-identity failure, successor-component failure, OCR failure, cleanup failure, result-validation failure, or output validation failure MUST NOT cause a second HTTP request.',

  'The exact Blob obtained from the one authorized HTTP response and whose bytes were validated MUST be the Blob handed to:',

  'The future production transport must not directly invoke:',

  'A non-empty Content-Type, when present, must identify `application/pdf`.',

  'An absent Content-Type alone does not defeat the exact byte-length, signature, and SHA-256 identity checks.',

  'A non-empty non-PDF Content-Type must fail closed.',

  'The transport MUST NOT implement its own OCR locator search, candidate ranking, window allocation, deduplication, overlap resolution, parser marker grammar, or fallback evidence selection.',

  'The transport MUST NOT create any generic `ESTATE`, `NOTICE`, `COURT`, or `DIVISION` fallback.',

  'The transport MUST NOT perform a second candidate ranking.',

  'The transport may validate source ordering and non-overlap, but must preserve the component contexts exactly.',

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

assert.strictEqual(
  (
    text.match(
      /Every successful returned context MUST include `ORPHAN` in its\s+`locatorLabels`\./g
    ) ||
    []
  ).length,
  1
);

[
  'This design authorizes production transport implementation.',
  'This design authorizes public RPC implementation.',
  'This design authorizes production RPC execution.',
  'This design authorizes parser repair.',
  'This design authorizes the 67 / 96 accounting transition.',
  'A third v143 RPC is authorized.',
  'This design authorizes one successor production RPC attempt.'
].forEach(value => {
  assert.ok(
    !text.includes(value),
    'forbidden positive authority statement: ' +
      value
  );
});

console.log(
  'PB1_CERTIFIED_OVERSIZE_ORPHAN_ANCHORED_MARKER_EVIDENCE_RECOVERY_PRODUCTION_TRANSPORT_DESIGN_VALIDATOR_PASSED=true'
);

console.log('DESIGN_ONLY=true');
console.log('BASE_MAIN=879f941a4b490baf1be188ebd7bef7baffb70339');
console.log('BASE_MAIN_TREE=156659dd6ed949a37b7c0f1ebc698343f0271acc');

console.log('FUTURE_RPC_ARGUMENT_COUNT=0');

console.log('HTTP_FETCH_MAX_PER_INVOCATION=1');
console.log('HTTP_RETRY_COUNT=0');
console.log('HTTP_FALLBACK_COUNT=0');
console.log('FOLLOW_REDIRECTS=false');

console.log('SAME_RESPONSE_BLOB_HANDOFF_REQUIRED=true');
console.log('SUCCESSOR_RECOVERY_INVOCATION_MAX=1');
console.log('DIRECT_DRIVE_OCR_AUTHORITY=false');

console.log('EXPECTED_PDF_BYTES=4220387');
console.log('MAX_PDF_BYTES=26214400');
console.log('EXPECTED_PDF_SHA256=90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028');

console.log('EXPECTED_TEXT_CHARACTER_COUNT=566435');
console.log('EXPECTED_TEXT_SHA256=31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3');

console.log('FIXED_LOCATOR_FAMILY_COUNT=5');
console.log('PRIMARY_EVIDENCE_ANCHOR=ORPHAN');
console.log('EVERY_RETURNED_CONTEXT_REQUIRES_ORPHAN=true');
console.log('GENERIC_LOCATOR_FALLBACK_AUTHORIZED=false');
console.log('SECOND_EVIDENCE_SELECTOR_AUTHORIZED=false');
console.log('SECOND_CANDIDATE_RANKING_AUTHORIZED=false');

console.log('MAX_CONTEXT_COUNT=8');
console.log('MAX_CONTEXT_CHARACTERS=800');
console.log('MAX_AGGREGATE_CONTEXT_CHARACTERS=6400');

console.log('CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=66');
console.log('CURRENT_COMPONENT_VALIDATOR_COUNT=95');
console.log('CURRENT_RECONCILED_PRODUCTION_INVENTORY_COUNT=147');
console.log('CURRENT_GENERATED_COUNTY_CONNECTOR_COUNT=94');

console.log('POTENTIAL_LATER_67_96_ACCOUNTING_AUTHORIZED=false');

console.log('NEW_IMMUTABLE_APPS_SCRIPT_VERSION_REQUIRED=true');

console.log('TOTAL_V143_PRODUCTION_RPC_ATTEMPTS=2');
console.log('THIRD_V143_RPC_AUTHORIZED=false');
console.log('SUCCESSOR_LIVE_DIAGNOSTIC_ATTEMPT_AUTHORIZED=false');

console.log('RUNTIME_IMPLEMENTATION_AUTHORIZED=false');
console.log('PUBLIC_RPC_IMPLEMENTATION_AUTHORIZED=false');
console.log('CI_REGISTRATION_AUTHORIZED=false');

console.log('LIVE_HTTP_AUTHORIZED=false');
console.log('LIVE_OCR_AUTHORIZED=false');

console.log('PROBATE_PARSING_AUTHORIZED=false');
console.log('PARSER_REPAIR_AUTHORIZED=false');
console.log('PERSISTENCE_AUTHORIZED=false');
console.log('COUNTY_DATA_MUTATION_AUTHORIZED=false');

console.log('ARV_REPAIR_MAO_OFFER_AUTHORITY=false');
