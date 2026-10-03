#!/usr/bin/env node
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const DESIGN =
  'docs/philadelphia-probate-certified-oversize-orphan-anchored-durable-evidence-capture-production-transport-design-v1.md';

const EXPECTED_DESIGN_SHA256 =
  'fb2f611e8b969afa5d9d700de944ae4dee6b2f175ef9bef9d9caa1c062048a00';

const EXPECTED_DESIGN_BYTES = 6393;

const V144_RUNTIME =
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport.js';

const V144_RUNTIME_SHA256 =
  '19687ee68bb9df810165dc8550f6395c7640206ff0f1705eecc0d7314cf0d4fa';

const ORPHAN_COMPONENT =
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.js';

const ORPHAN_COMPONENT_SHA256 =
  '288ea256ddf9d93af3cce7780700c1f823dbd4ea8649fd307d369923610655a0';

const PLANNED_RUNTIME =
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport.js';

const PLANNED_BEHAVIOR_VALIDATOR =
  'scripts/validate-philadelphia-probate-certified-oversize-orphan-anchored-durable-evidence-capture-production-transport-v1.js';

const PLANNED_RPC =
  'reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport';

function fail(message) {
  console.error('FAIL: ' + message);
  process.exit(1);
}

function requireTrue(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function sha256Buffer(buffer) {
  return crypto
    .createHash('sha256')
    .update(buffer)
    .digest('hex');
}

function sha256File(path) {
  return sha256Buffer(fs.readFileSync(path));
}

requireTrue(
  fs.existsSync(DESIGN),
  'design document missing'
);

const designBuffer = fs.readFileSync(DESIGN);
const design = designBuffer.toString('utf8');

requireTrue(
  designBuffer.length === EXPECTED_DESIGN_BYTES,
  'design byte count changed'
);

requireTrue(
  sha256Buffer(designBuffer) === EXPECTED_DESIGN_SHA256,
  'design SHA-256 changed'
);

requireTrue(
  fs.existsSync(V144_RUNTIME),
  'v144 runtime missing'
);

requireTrue(
  sha256File(V144_RUNTIME) === V144_RUNTIME_SHA256,
  'v144 runtime SHA-256 changed'
);

requireTrue(
  fs.existsSync(ORPHAN_COMPONENT),
  'orphan component missing'
);

requireTrue(
  sha256File(ORPHAN_COMPONENT) === ORPHAN_COMPONENT_SHA256,
  'orphan component SHA-256 changed'
);

requireTrue(
  !fs.existsSync(PLANNED_RUNTIME),
  'planned successor runtime must not exist at design gate'
);

requireTrue(
  !fs.existsSync(PLANNED_BEHAVIOR_VALIDATOR),
  'planned behavior validator must not exist at design gate'
);

const exactMarkers = [
  'PLANNED_RUNTIME=' + PLANNED_RUNTIME,
  'PLANNED_BEHAVIOR_VALIDATOR=' + PLANNED_BEHAVIOR_VALIDATOR,
  'PLANNED_PUBLIC_RPC=' + PLANNED_RPC,
  'PUBLIC_RPC_PARAMETER_COUNT_PLANNED=0',

  'NEW_IMMUTABLE_APPS_SCRIPT_VERSION_REQUIRED=true',
  'SUCCESSOR_VERSION_NUMBER_ASSIGNED=false',
  'SUCCESSOR_LIVE_DIAGNOSTIC_ATTEMPT_AUTHORIZED=false',

  'HTTP_FETCH_MAX_PER_INVOCATION=1',
  'HTTP_RETRY_COUNT=0',
  'HTTP_FALLBACK_COUNT=0',
  'FOLLOW_REDIRECTS=false',
  'SAME_RESPONSE_BLOB_HANDOFF_REQUIRED=true',
  'SUCCESSOR_RECOVERY_INVOCATION_MAX=1',
  'DIRECT_DRIVE_OCR_AUTHORITY=false',

  'PRIMARY_EVIDENCE_ANCHOR=ORPHAN',
  'EVERY_RETURNED_CONTEXT_REQUIRES_ORPHAN=true',
  'GENERIC_LOCATOR_FALLBACK_AUTHORIZED=false',
  'SECOND_EVIDENCE_SELECTOR_AUTHORIZED=false',
  'SECOND_CANDIDATE_RANKING_AUTHORIZED=false',

  'MAX_CONTEXT_COUNT=8',
  'MAX_CONTEXT_CHARACTERS=800',
  'MAX_AGGREGATE_CONTEXT_CHARACTERS=6400',

  'FULL_OCR_TEXT_RETURN_AUTHORIZED=false',
  'GENERIC_OCR_PREVIEW_RETURN_AUTHORIZED=false',
  'PDF_BYTES_RETURN_AUTHORIZED=false',
  'TEMPORARY_DOCUMENT_ID_RETURN_AUTHORIZED=false',

  'DURABLE_LOCAL_RAW_RPC_CAPTURE_REQUIRED=true',
  'RAW_STDOUT_CAPTURE_REQUIRED=true',
  'RAW_STDERR_CAPTURE_REQUIRED=true',

  'CAPTURE_BEFORE_INTERPRETATION_REQUIRED=true',
  'CAPTURE_BEFORE_JSON_NORMALIZATION_REQUIRED=true',
  'CAPTURE_BEFORE_CONTEXT_ANALYSIS_REQUIRED=true',

  'DURABLE_CAPTURE_TEMP_ONLY_STORAGE_PROHIBITED=true',
  'DURABLE_CAPTURE_TEMP_FILE_MUST_SHARE_FINAL_FILESYSTEM=true',
  'DURABLE_CAPTURE_ATOMIC_PROMOTION_REQUIRED=true',

  'DURABLE_CAPTURE_FILE_FSYNC_REQUIRED=true',
  'DURABLE_CAPTURE_DIRECTORY_FSYNC_REQUIRED=true',

  'DURABLE_CAPTURE_STDOUT_BYTE_COUNT_REQUIRED=true',
  'DURABLE_CAPTURE_STDOUT_SHA256_REQUIRED=true',
  'DURABLE_CAPTURE_STDERR_BYTE_COUNT_REQUIRED=true',
  'DURABLE_CAPTURE_STDERR_SHA256_REQUIRED=true',
  'DURABLE_CAPTURE_MANIFEST_REQUIRED=true',

  'DURABLE_CAPTURE_RPC_IDENTITY_REQUIRED=true',
  'DURABLE_CAPTURE_DEPLOYMENT_ID_REQUIRED=true',
  'DURABLE_CAPTURE_DEPLOYMENT_VERSION_REQUIRED=true',
  'DURABLE_CAPTURE_EXIT_CODE_REQUIRED=true',
  'DURABLE_CAPTURE_ATTEMPT_COUNT_REQUIRED=true',
  'DURABLE_CAPTURE_TIMESTAMP_REQUIRED=true',

  'DURABLE_CAPTURE_OVERWRITE_PROHIBITED=true',
  'DURABLE_CAPTURE_DELETE_BEFORE_ANALYSIS_CERTIFICATION_PROHIBITED=true',

  'EMPTY_CAPTURE_FAILS_CLOSED=true',
  'UNPARSEABLE_CAPTURE_FAILS_CLOSED=true',
  'MISSING_ORPHAN_CONTEXT_FAILS_CLOSED=true',
  'CAPTURE_IDENTITY_MISMATCH_FAILS_CLOSED=true',

  'FAILED_CAPTURE_RETRY_AUTHORIZED=false',
  'FAILED_PARSE_RETRY_AUTHORIZED=false',
  'FAILED_CONTEXT_ANALYSIS_RETRY_AUTHORIZED=false',

  'V144_EVIDENCE_LOSS_CERTIFIED=true',
  'V144_RESULT_PAYLOAD_CURRENTLY_RECOVERABLE=false',
  'V144_RPC_RETRY_AUTHORIZED=false',
  'AUTHORIZED_FURTHER_V144_PRODUCTION_RPC_COUNT=0',
  'V144_RPC_MUST_NOT_BE_REEXECUTED=true',

  'TOTAL_V143_PRODUCTION_RPC_ATTEMPTS_REMAIN=2',
  'THIRD_V143_RPC_AUTHORIZED=false',

  'RUNTIME_IMPLEMENTATION_AUTHORIZED=false',
  'PUBLIC_RPC_IMPLEMENTATION_AUTHORIZED=false',
  'RUNTIME_ACCOUNTING_EDIT_AUTHORIZED=false',
  'WORKFLOW_EDIT_AUTHORIZED=false',
  'CI_REGISTRATION_AUTHORIZED=false',
  'CLASP_PUSH_AUTHORIZED=false',
  'APPS_SCRIPT_VERSION_CREATION_AUTHORIZED=false',
  'DEPLOYMENT_UPDATE_AUTHORIZED=false',
  'LIVE_EXECUTION_AUTHORIZED=false',

  'PROBATE_PARSING_AUTHORIZED=false',
  'PARSER_REPAIR_AUTHORIZED=false',
  'PERSISTENCE_AUTHORIZED=false',
  'COUNTY_DATA_MUTATION_AUTHORIZED=false',

  'ARV_AUTHORITY_GRANTED=false',
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false',
  'MAO_AUTHORITY_GRANTED=false',
  'OFFER_AUTHORITY_GRANTED=false'
];

for (const marker of exactMarkers) {
  requireTrue(
    design.includes(marker),
    'required design marker missing: ' + marker
  );
}

requireTrue(
  design.includes('$HOME/.reos/evidence/probate/pb1/'),
  'durable evidence directory policy missing'
);

requireTrue(
  design.includes(
    'PB1_ORPHAN_ANCHORED_DURABLE_EVIDENCE_CAPTURE_SUCCESSOR_DESIGN_VALIDATOR'
  ),
  'next-gate marker missing'
);

console.log(
  'PB1_ORPHAN_ANCHORED_DURABLE_EVIDENCE_CAPTURE_SUCCESSOR_DESIGN_VALIDATOR_PASSED=true'
);

console.log('DESIGN_ONLY=true');
console.log('DESIGN_SHA256_EXACT=true');
console.log('DESIGN_BYTES_EXACT=true');

console.log('V144_RUNTIME_HASH_EXACT=true');
console.log('ORPHAN_COMPONENT_HASH_EXACT=true');

console.log('PLANNED_RUNTIME_PRESENT=false');
console.log('PLANNED_BEHAVIOR_VALIDATOR_PRESENT=false');

console.log('HTTP_FETCH_MAX_PER_INVOCATION=1');
console.log('HTTP_RETRY_COUNT=0');

console.log('PRIMARY_EVIDENCE_ANCHOR=ORPHAN');
console.log('MAX_CONTEXT_COUNT=8');
console.log('MAX_CONTEXT_CHARACTERS=800');
console.log('MAX_AGGREGATE_CONTEXT_CHARACTERS=6400');

console.log('DURABLE_LOCAL_RAW_RPC_CAPTURE_REQUIRED=true');
console.log('CAPTURE_BEFORE_INTERPRETATION_REQUIRED=true');
console.log('CAPTURE_BEFORE_JSON_NORMALIZATION_REQUIRED=true');
console.log('DURABLE_CAPTURE_ATOMIC_PROMOTION_REQUIRED=true');
console.log('DURABLE_CAPTURE_FILE_FSYNC_REQUIRED=true');
console.log('DURABLE_CAPTURE_DIRECTORY_FSYNC_REQUIRED=true');
console.log('DURABLE_CAPTURE_MANIFEST_REQUIRED=true');

console.log('V144_RPC_RETRY_AUTHORIZED=false');
console.log('AUTHORIZED_FURTHER_V144_PRODUCTION_RPC_COUNT=0');

console.log('SUCCESSOR_LIVE_DIAGNOSTIC_ATTEMPT_AUTHORIZED=false');
console.log('PROBATE_PARSING_AUTHORIZED=false');
console.log('PARSER_REPAIR_AUTHORIZED=false');
console.log('PERSISTENCE_AUTHORIZED=false');
console.log('COUNTY_DATA_MUTATION_AUTHORIZED=false');
console.log('ARV_REPAIR_MAO_OFFER_AUTHORITY=false');
