# Philadelphia Probate PB1 — Single Bounded PDF Fetch Contract v1

## Status

Design contract only.

This contract does not authorize production execution.

## Purpose

Define the narrow transport boundary for retrieving the single Philadelphia
probate public-notice PDF previously identified by the certified PB1 bounded
source-discovery operation.

This increment authorizes no live HTTP request.

The future runtime operation may perform exactly one HTTPS GET against the
single pinned certified PDF URL.

It is a transport-validation operation only.

It does not grant OCR, parsing, persistence, configuration, county mutation,
acquisition, ARV, repair-scope, MAO, or offer authority.

## Certified source identity

Publication date:

`2026-09-30`

Exact source URL:

`https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`

SHA-256 of the exact source URL string:

`98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`

Expected basename:

`tlipn093026.pdf`

Approved hosts:

- `assets.alm.com`
- `images.law.com`

The future runtime must fail closed if any source-identity invariant differs.

## Proposed RPC

Future entrypoint:

`reosPhiladelphiaProbateBoundedPdfFetch()`

Arguments:

Zero.

The URL must be pinned in the implementation for this certification
increment. Arbitrary caller-provided URLs are not authorized.

## Network authority

Maximum `UrlFetchApp.fetch` invocation count:

`1`

Exactly one HTTPS GET may be attempted.

No retry is authorized.

No fallback URL is authorized.

No secondary source is authorized.

No article discovery is authorized.

No recurring-source resolver invocation is authorized.

No continuation request is authorized.

## Proposed request

The future implementation may use:

- method `get`;
- `followRedirects: true`;
- `muteHttpExceptions: true`;
- an appropriate PDF Accept header.

The operation must not intentionally initiate another request.

## Response validation

A successful result requires:

1. HTTP status in the 2xx range.
2. A non-empty response body.
3. Response size no greater than a statically pinned maximum.
4. PDF magic bytes beginning with `%PDF-`.
5. A PDF-compatible Content-Type when the server supplies one.
6. SHA-256 computed over the exact returned PDF bytes.

The implementation increment must choose and pin the maximum payload size
before production execution is authorized.

Because `UrlFetchApp.fetch` receives the response before an in-memory byte
length check can be performed, the size limit is a post-response validation
boundary rather than a guaranteed pre-download transport limit.

That limitation must remain explicit in implementation certification.

## Successful result contract

The future RPC may return metadata only:

- `ok: true`
- `fetchVersion: 1`
- `publicationDate`
- `sourceUrl`
- `sourceUrlSha256`
- `sourceHost`
- `sourceBasename`
- `httpFetchExecuted: true`
- `httpFetchCount: 1`
- `httpStatus`
- `contentType`
- `contentLength`
- `pdfSignatureValid: true`
- `pdfContentSha256`
- `pdfBytesReturned: false`
- `driveOcrExecuted: false`
- `documentAppExecuted: false`
- `connectorFetchExecuted: false`
- `connectorRegistrationExecuted: false`
- `sourceDiscoveryExecuted: false`
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

Raw PDF bytes must not be returned by the RPC.

## Fail-closed cases

The future runtime must fail closed for:

1. pinned source URL mismatch;
2. source URL SHA mismatch;
3. non-HTTPS scheme;
4. unapproved source host;
5. source basename mismatch;
6. publication-date/basename mismatch;
7. HTTP non-2xx response;
8. empty response body;
9. response above the pinned maximum byte count;
10. invalid `%PDF-` signature;
11. attempted HTTP fetch count greater than one.

A failure must not trigger a retry or fallback.

## Prohibited runtime services and entrypoints

The future bounded transport implementation must not invoke:

- `DriveApp`
- `Drive.Files`
- `DocumentApp`
- `PropertiesService`
- `SpreadsheetApp`
- `ScriptApp`
- `LockService`
- `CountyRuntimeBridge.registerConnectors`
- `PAPhiladelphiaCountyConnector.fetch_`
- `probateSourceAuthority`
- `probateSourcePreflight_`
- `PhiladelphiaProbateRecurringSource.resolve`

The bounded transport implementation must not perform:

- OCR;
- PDF text extraction;
- probate record parsing;
- source discovery;
- connector registration;
- persistence;
- configuration mutation;
- scheduler mutation;
- trigger mutation;
- checkpoint mutation;
- county-data mutation;
- canonical identity mutation;
- Qualified Deal Queue activity;
- acquisition lifecycle activity;
- ARV calculation;
- repair-scope calculation;
- MAO calculation;
- offer generation;
- offer submission.

## Authority separation

A successful PDF transport result proves only that the exact certified source
can be retrieved and satisfies the bounded transport checks.

It grants no OCR authority.

It grants no parsing authority.

It grants no persistence authority.

It grants no acquisition authority.

OCR must be a later separately designed and certified increment.

Parsing must be a later separately designed and certified increment.

Persistence must be a later separately designed and certified increment.

## Required gates before live execution

Before a production PDF request may be authorized:

1. implement the bounded RPC offline;
2. pin the maximum response size;
3. create an offline behavior validator;
4. prove exactly one fetch invocation on success;
5. prove no retry on failure;
6. prove all prohibited service surfaces remain unreachable;
7. reconcile central integration accounting;
8. pass CI;
9. merge the certified implementation;
10. separately certify production deployment;
11. explicitly authorize exactly one production RPC.

This design contract itself grants no production PDF-fetch authority.
