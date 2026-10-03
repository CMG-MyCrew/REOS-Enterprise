# Philadelphia Probate PB1 — Orphan-Anchored Durable Evidence Capture Production Transport Design v1

## Purpose

This is a design-only successor to the certified v144 orphan-anchored
production diagnostic.

The v144 live diagnostic itself succeeded, but its already-returned bounded
ORPHAN evidence payload was not durably retained for later offline analysis.

Therefore:

- v144 is not classified as a transport failure;
- v144 MUST NOT be retried;
- the two remaining v143 attempts remain reserved;
- a new immutable successor diagnostic is required;
- this document grants no implementation or live-execution authority.

## Source authority

BASE_MAIN=c60e2dc33b75e3c8c4f74962deb0cb58699b4c62
BASE_TREE=902dbe9b55eb52fb3b153e0d1c2dec2157cd10ee

Frozen v144 transport:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport.js`

V144_RUNTIME_SHA256=19687ee68bb9df810165dc8550f6395c7640206ff0f1705eecc0d7314cf0d4fa

Frozen orphan-anchored evidence component:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.js`

ORPHAN_COMPONENT_SHA256=288ea256ddf9d93af3cce7780700c1f823dbd4ea8649fd307d369923610655a0

## Planned successor

PLANNED_RUNTIME=build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport.js
PLANNED_BEHAVIOR_VALIDATOR=scripts/validate-philadelphia-probate-certified-oversize-orphan-anchored-durable-evidence-capture-production-transport-v1.js
PLANNED_PUBLIC_RPC=reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport
PUBLIC_RPC_PARAMETER_COUNT_PLANNED=0

NEW_IMMUTABLE_APPS_SCRIPT_VERSION_REQUIRED=true
SUCCESSOR_VERSION_NUMBER_ASSIGNED=false
SUCCESSOR_LIVE_DIAGNOSTIC_ATTEMPT_AUTHORIZED=false

## Certified source identity

EXPECTED_SOURCE_URL_SHA256=98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca
EXPECTED_PDF_BYTES=4220387
EXPECTED_PDF_SHA256=90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028
EXPECTED_TEXT_CHARACTER_COUNT=566435
EXPECTED_TEXT_SHA256=31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3

## Production transport invariants

HTTP_FETCH_MAX_PER_INVOCATION=1
HTTP_RETRY_COUNT=0
HTTP_FALLBACK_COUNT=0
FOLLOW_REDIRECTS=false
SAME_RESPONSE_BLOB_HANDOFF_REQUIRED=true
SUCCESSOR_RECOVERY_INVOCATION_MAX=1
DIRECT_DRIVE_OCR_AUTHORITY=false

PRIMARY_EVIDENCE_ANCHOR=ORPHAN
EVERY_RETURNED_CONTEXT_REQUIRES_ORPHAN=true
GENERIC_LOCATOR_FALLBACK_AUTHORIZED=false
SECOND_EVIDENCE_SELECTOR_AUTHORIZED=false
SECOND_CANDIDATE_RANKING_AUTHORIZED=false

MAX_CONTEXT_COUNT=8
MAX_CONTEXT_CHARACTERS=800
MAX_AGGREGATE_CONTEXT_CHARACTERS=6400

FULL_OCR_TEXT_RETURN_AUTHORIZED=false
GENERIC_OCR_PREVIEW_RETURN_AUTHORIZED=false
PDF_BYTES_RETURN_AUTHORIZED=false
TEMPORARY_DOCUMENT_ID_RETURN_AUTHORIZED=false

## Durable local RPC-capture requirement

The future authorized live invocation MUST persist the raw RPC transport
result before interpreting it.

DURABLE_LOCAL_RAW_RPC_CAPTURE_REQUIRED=true
RAW_STDOUT_CAPTURE_REQUIRED=true
RAW_STDERR_CAPTURE_REQUIRED=true

CAPTURE_BEFORE_INTERPRETATION_REQUIRED=true
CAPTURE_BEFORE_JSON_NORMALIZATION_REQUIRED=true
CAPTURE_BEFORE_CONTEXT_ANALYSIS_REQUIRED=true

The durable destination MUST NOT be `/tmp` or `/var/tmp`.

A future implementation may use a private path under:

`$HOME/.reos/evidence/probate/pb1/`

DURABLE_CAPTURE_TEMP_ONLY_STORAGE_PROHIBITED=true

The temporary capture and final durable capture MUST reside on the same
filesystem so promotion can be atomic.

DURABLE_CAPTURE_TEMP_FILE_MUST_SHARE_FINAL_FILESYSTEM=true
DURABLE_CAPTURE_ATOMIC_PROMOTION_REQUIRED=true

Before interpretation, the invocation protocol MUST:

1. capture raw stdout;
2. capture raw stderr;
3. capture the process exit code;
4. flush and fsync the capture files;
5. compute byte counts and SHA-256 identities;
6. atomically promote them to non-overwriting durable filenames;
7. create a manifest;
8. fsync the durable evidence directory.

DURABLE_CAPTURE_FILE_FSYNC_REQUIRED=true
DURABLE_CAPTURE_DIRECTORY_FSYNC_REQUIRED=true

DURABLE_CAPTURE_STDOUT_BYTE_COUNT_REQUIRED=true
DURABLE_CAPTURE_STDOUT_SHA256_REQUIRED=true
DURABLE_CAPTURE_STDERR_BYTE_COUNT_REQUIRED=true
DURABLE_CAPTURE_STDERR_SHA256_REQUIRED=true
DURABLE_CAPTURE_MANIFEST_REQUIRED=true

The manifest MUST bind:

DURABLE_CAPTURE_RPC_IDENTITY_REQUIRED=true
DURABLE_CAPTURE_DEPLOYMENT_ID_REQUIRED=true
DURABLE_CAPTURE_DEPLOYMENT_VERSION_REQUIRED=true
DURABLE_CAPTURE_EXIT_CODE_REQUIRED=true
DURABLE_CAPTURE_ATTEMPT_COUNT_REQUIRED=true
DURABLE_CAPTURE_TIMESTAMP_REQUIRED=true

The durable evidence bundle MUST NOT overwrite an existing capture and MUST
remain available until offline evidence-analysis certification completes.

DURABLE_CAPTURE_OVERWRITE_PROHIBITED=true
DURABLE_CAPTURE_DELETE_BEFORE_ANALYSIS_CERTIFICATION_PROHIBITED=true

## Fail-closed semantics

EMPTY_CAPTURE_FAILS_CLOSED=true
UNPARSEABLE_CAPTURE_FAILS_CLOSED=true
MISSING_ORPHAN_CONTEXT_FAILS_CLOSED=true
CAPTURE_IDENTITY_MISMATCH_FAILS_CLOSED=true

A capture failure, response-parse failure, or context-analysis failure does
not itself authorize another production RPC.

FAILED_CAPTURE_RETRY_AUTHORIZED=false
FAILED_PARSE_RETRY_AUTHORIZED=false
FAILED_CONTEXT_ANALYSIS_RETRY_AUTHORIZED=false

## v144 retirement

V144_EVIDENCE_LOSS_CERTIFIED=true
V144_RESULT_PAYLOAD_CURRENTLY_RECOVERABLE=false
V144_RPC_RETRY_AUTHORIZED=false
AUTHORIZED_FURTHER_V144_PRODUCTION_RPC_COUNT=0
V144_RPC_MUST_NOT_BE_REEXECUTED=true

TOTAL_V143_PRODUCTION_RPC_ATTEMPTS_REMAIN=2
THIRD_V143_RPC_AUTHORIZED=false

## Authority exclusions

RUNTIME_IMPLEMENTATION_AUTHORIZED=false
PUBLIC_RPC_IMPLEMENTATION_AUTHORIZED=false
RUNTIME_ACCOUNTING_EDIT_AUTHORIZED=false
WORKFLOW_EDIT_AUTHORIZED=false
CI_REGISTRATION_AUTHORIZED=false
CLASP_PUSH_AUTHORIZED=false
APPS_SCRIPT_VERSION_CREATION_AUTHORIZED=false
DEPLOYMENT_UPDATE_AUTHORIZED=false
LIVE_EXECUTION_AUTHORIZED=false

PROBATE_PARSING_AUTHORIZED=false
PARSER_REPAIR_AUTHORIZED=false
PERSISTENCE_AUTHORIZED=false
COUNTY_DATA_MUTATION_AUTHORIZED=false

ARV_AUTHORITY_GRANTED=false
REPAIR_SCOPE_AUTHORITY_GRANTED=false
MAO_AUTHORITY_GRANTED=false
OFFER_AUTHORITY_GRANTED=false

## Next gate

This design alone does not authorize implementation.

The next gate is:

PB1_ORPHAN_ANCHORED_DURABLE_EVIDENCE_CAPTURE_SUCCESSOR_DESIGN_VALIDATOR
