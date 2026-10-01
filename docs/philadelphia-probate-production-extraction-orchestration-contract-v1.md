# Philadelphia Probate PB1 — Production Extraction Orchestration Contract v1

## Status

Design contract only.

This contract does not authorize production execution.

It does not authorize a production HTTP request.

It does not authorize OCR execution.

## Purpose

Define the narrow future orchestration boundary that may, after all later
implementation, integration, deployment, and explicit execution gates are
satisfied, perform one fresh direct retrieval of the already certified
Philadelphia probate PDF and pass that exact in-memory PDF Blob to the already
deployed bounded text-extraction component.

The previously executed bounded PDF transport returned metadata only.

Its result explicitly reported that raw PDF bytes were not returned.

Those prior PDF bytes were not retained for later extraction.

Therefore the future production extraction cannot reuse the prior transport
result as extraction input.

A future production extraction requires new, explicit transport authority for
one new direct HTTPS GET.

This new transport authority is not granted by this design contract.

## Certified production prerequisite

The design assumes the bounded text-extraction component has already been
source-only deployed to the existing production deployment at version `135`.

The deployed extraction component remains inert until explicitly invoked.

Deployment alone grants no HTTP, OCR, parsing, persistence, county mutation,
or acquisition authority.

## Certified source identity

The orchestration is bound to exactly:

- publication date: `2026-09-30`
- exact source URL:
  `https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`
- source URL SHA-256:
  `98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`
- source host: `assets.alm.com`
- source basename: `tlipn093026.pdf`
- exact certified PDF byte length: `4220387`
- exact certified PDF content SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`
- maximum accepted PDF size: `26214400` bytes
- maximum accepted extracted-text length: `250000` characters

Any deviation is outside this contract and must fail closed.

## Proposed future RPC

Future zero-argument entrypoint:

`reosPhiladelphiaProbateProductionExtractionOrchestration()`

Arguments:

Zero.

No caller-provided URL, publication date, content hash, byte length, or
extraction configuration is authorized.

The exact certified source identity must be pinned in the implementation.

## Explicit new transport authority boundary

The future production RPC may perform at most one new
`UrlFetchApp.fetch` invocation.

The maximum authorized HTTP fetch count for one RPC invocation is:

`1`

The future transport request must target only the exact certified source URL.

The future request must use:

- method `get`;
- `followRedirects: false`;
- `muteHttpExceptions: true`;
- an `Accept: application/pdf` header.

Redirect following is prohibited.

Any HTTP 3xx response must fail closed.

No retry is authorized.

No fallback URL is authorized.

No secondary source is authorized.

No article-page request is authorized.

No source-discovery request is authorized.

No continuation request is authorized.

No recurring-source resolver invocation is authorized.

## Old bounded-fetch RPC reuse prohibition

The orchestration MUST NOT call:

`reosPhiladelphiaProbateBoundedPdfFetch()`

The orchestration MUST NOT call:

`REOS.PhiladelphiaProbateBoundedPdfFetch.execute`

The old bounded-fetch RPC is evidence that the certified URL was previously
transportable.

It does not provide an in-memory PDF Blob to a later RPC.

Calling the old bounded-fetch RPC and then performing another fetch would
create two transport operations and is outside this contract.

The future orchestration must perform its single newly authorized request
directly and retain that one response Blob only in memory for immediate
validation and extraction.

## Transport validation ordering

Before OCR authority is reachable, the future orchestration MUST validate the
single HTTP response.

A successful transport handoff requires all of the following:

1. source URL string SHA-256 is exact;
2. source scheme and host are exact;
3. source basename is exact;
4. publication-date/basename relationship is exact;
5. HTTP status is in the 2xx range;
6. response body is non-empty;
7. response byte length is no greater than `26214400`;
8. response byte length is exactly `4220387`;
9. first bytes are `%PDF-`;
10. Content-Type is PDF-compatible when supplied;
11. SHA-256 of the exact returned bytes is exactly
    `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`;
12. HTTP fetch count is exactly `1`.

Any transport validation failure MUST occur before the bounded extractor is
invoked.

Transport validation failure authorizes no OCR attempt.

## In-memory blob handoff

After and only after all transport validations pass, the future orchestration
may pass the exact response Blob from that single HTTP request directly to:

`REOS.PhiladelphiaProbateBoundedTextExtraction.extract(blob)`

The extractor invocation count for one future orchestration RPC is at most:

`1`

The Blob MUST NOT be written to persistent Drive storage before extraction.

The Blob MUST NOT be placed in PropertiesService.

The Blob MUST NOT be written to a spreadsheet or REOS database.

The Blob MUST NOT be returned by the RPC.

The orchestration MUST NOT reconstruct extraction input from a second HTTP
request.

## Double identity verification

The orchestration transport layer must validate the exact PDF byte length,
signature, and content SHA-256 before invoking extraction.

The deployed bounded extractor must then independently revalidate the same PDF
Blob before it creates any temporary OCR artifact.

This intentional duplicate verification is required defense in depth.

A mismatch in either validation layer must fail closed.

## OCR authority boundary

The future orchestration itself MUST NOT directly invoke:

- `Drive.Files.create`
- `DocumentApp.openById`
- `DriveApp.getFileById`
- temporary Drive cleanup APIs

OCR authority must be delegated only through exactly one invocation of:

`REOS.PhiladelphiaProbateBoundedTextExtraction.extract(blob)`

The already certified extractor owns the temporary artifact lifecycle.

For one successful future RPC, the complete extraction path may create at most
one temporary OCR document, open that exact temporary document at most once,
extract its body text once, and attempt cleanup of that exact temporary
document once.

Cleanup failure must prevent a successful result.

## No retry after extraction failure

If bounded extraction fails after the single HTTP request, the orchestration
MUST NOT:

- retry extraction;
- refetch the PDF;
- call the old bounded-fetch RPC;
- use another URL;
- use another source;
- leave a transport or extraction loop active.

A failed extraction consumes the one permitted transport attempt for that
future RPC invocation.

A later retry would require a separate new explicit production authorization.

## Successful result boundary

The future RPC may return bounded evidence metadata only.

A successful result may include:

- `ok: true`
- `orchestrationVersion: 1`
- `publicationDate`
- `sourceUrl`
- `sourceUrlSha256`
- `sourceBasename`
- `httpFetchExecuted: true`
- `httpFetchCount: 1`
- `httpStatus`
- `contentType`
- `pdfByteLength: 4220387`
- `pdfSignatureValid: true`
- `pdfContentSha256`
- `extractionExecuted: true`
- `extractionCount: 1`
- `extractedTextCharacterCount`
- `maxExtractedTextCharacters: 250000`
- `extractedTextSha256`
- `temporaryArtifactCreated`
- `temporaryArtifactCleanupAttempted`
- `temporaryArtifactCleanupConfirmed`
- `fullExtractedTextReturned: false`
- `pdfBytesReturned: false`
- `sourceDiscoveryExecuted: false`
- `connectorFetchExecuted: false`
- `connectorRegistrationExecuted: false`
- `probateParsingExecuted: false`
- `leadCreationExecuted: false`
- `persistenceExecuted: false`
- `configurationExecuted: false`
- `schedulerMutationExecuted: false`
- `triggerMutationExecuted: false`
- `checkpointMutationExecuted: false`
- `countyDataMutationExecuted: false`
- `arvAuthorityGranted: false`
- `repairScopeAuthorityGranted: false`
- `maoAuthorityGranted: false`
- `offerAuthorityGranted: false`

The full extracted probate text MUST NOT be returned by the first production
orchestration RPC.

Raw PDF bytes MUST NOT be returned.

The temporary Google document ID MUST NOT be returned.

## Fail-closed requirements

The future orchestration MUST fail closed for at least:

1. source URL identity mismatch;
2. source URL SHA mismatch;
3. source host or scheme mismatch;
4. source basename mismatch;
5. publication-date/basename mismatch;
6. HTTP 3xx response;
7. any other non-2xx HTTP response;
8. empty body;
9. body above the maximum size;
10. byte length other than exactly `4220387`;
11. invalid `%PDF-` signature;
12. incompatible Content-Type when supplied;
13. content SHA-256 mismatch;
14. attempted HTTP request count other than exactly one;
15. missing bounded extraction component;
16. attempted extractor invocation count greater than one;
17. any bounded extractor failure;
18. empty extracted text;
19. extracted text above `250000` characters;
20. temporary artifact cleanup failure.

No fail-closed path authorizes retry, fallback, parsing, persistence, or
acquisition activity.

## Prohibited runtime surfaces

The future orchestration MUST NOT invoke:

- `PhiladelphiaProbateRecurringSource.resolve`
- `reosPhiladelphiaProbateBoundedSourceDiscovery`
- `reosPhiladelphiaProbateBoundedPdfFetch`
- `REOS.PhiladelphiaProbateBoundedPdfFetch.execute`
- `PAPhiladelphiaCountyConnector.fetch_`
- `probateSourcePreflight_`
- `probateSourceAuthority`
- `CountyRuntimeBridge.registerConnectors`
- `PropertiesService`
- `SpreadsheetApp`
- scheduler mutation
- trigger mutation
- checkpoint mutation
- county-data mutation

The orchestration must not directly invoke `Drive.Files.create`,
`DocumentApp.openById`, or `DriveApp.getFileById`.

Those temporary-artifact services remain encapsulated inside the already
certified bounded extractor.

## Probate and acquisition safety boundary

This orchestration grants no authority for:

- probate record interpretation;
- probate record normalization;
- decedent or heir matching;
- property matching;
- distress-lead creation;
- Qualified Deal Queue activity;
- acquisition lifecycle advancement;
- ARV calculation;
- repair-scope calculation;
- MAO calculation;
- offer generation;
- offer submission.

Extracted text remains evidence only.

No automatic MAO or offer authority can arise from this orchestration.

## Production execution authorization boundary

Even after future implementation and deployment, production execution remains
separately gated.

The future first production authorization may authorize exactly one invocation
of:

`reosPhiladelphiaProbateProductionExtractionOrchestration()`

That authorization would authorize exactly one new direct HTTP request and,
only after exact PDF identity validation, one bounded extraction attempt.

This design contract itself authorizes zero production HTTP requests and zero
production OCR executions.

## Required gates before first production execution

Before any live production orchestration RPC may run:

1. certify this design contract;
2. implement the orchestration offline;
3. create deterministic transport/extraction behavior tests;
4. prove maximum HTTP fetch count is one;
5. prove `followRedirects: false`;
6. prove no retry or fallback;
7. prove the old bounded-fetch RPC is not called;
8. prove exact PDF byte length and SHA verification precede extraction;
9. prove exactly one extractor invocation maximum;
10. prove no direct Drive/OCR surface exists in the orchestration;
11. prove extraction failures cannot trigger a refetch;
12. prove metadata-only output;
13. reconcile central runtime accounting while preserving historical
    reconciled production inventory semantics;
14. pass CI;
15. merge;
16. certify post-merge main;
17. deploy through a separately authorized source-only deployment gate;
18. certify production deployment state;
19. execute any zero-side-effect readiness checks needed;
20. separately authorize exactly one production orchestration RPC.

No production HTTP or OCR authority is granted by this design contract.
