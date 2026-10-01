# Philadelphia Probate PB1 — Bounded Oversize Text Evidence Recovery Contract v1

## Status

Design contract only.

This contract does not authorize implementation.

This contract does not authorize production execution.

This contract does not raise the current normal extraction acceptance limit.

## Incident basis

One production invocation of:

`reosPhiladelphiaProbateProductionExtractionOrchestration()`

was executed against production version `137`.

That invocation failed closed with:

`Bounded probate text extraction exceeded maximum text length.`

The current normal extraction acceptance limit is exactly:

`250000`

characters.

The prior attempt established that:

- the exact production PDF transport path was reached;
- PDF byte-length validation passed;
- PDF signature validation passed;
- PDF Content-Type validation passed;
- PDF SHA-256 validation passed;
- the normal bounded extractor was invoked;
- one temporary OCR document was created;
- that document was opened;
- body text was read;
- failure occurred at the extracted-text maximum-length gate;
- cleanup was attempted through the extractor finally path;
- no cleanup failure was reported;
- no second production extraction RPC was executed;
- the exact extracted-text character count remains unknown.

The previous production orchestration MUST NOT be rerun merely to discover the
text length.

## Local incident-evidence hashes

The design preflight that created this contract verified local normalized
incident evidence with these SHA-256 values:

- normalized failure JSON SHA-256:
  `054db5168b22ec940de4300b34c69db10a7e6288e447761ac81a5c8756edf1d2`
- normalized failure certification SHA-256:
  `fa467a5b6e54d79ec194e23a5a0eb4f8257695895ac70fdead96523dcb1dea88`

These hashes identify the local evidence used to establish the incident basis.
They do not grant production execution authority.

## Purpose

Define a separate evidence-only recovery path capable of reporting the actual
OCR text character count and SHA-256 for the exact certified PDF while:

- returning no OCR text;
- returning no PDF bytes;
- granting no normal extraction acceptance;
- granting no probate parsing authority;
- granting no persistence authority;
- granting no acquisition authority.

The recovery exists only to measure the oversize OCR result.

## Certified PDF identity

The recovery is bound to exactly:

- publication date: `2026-09-30`
- source basename: `tlipn093026.pdf`
- source URL:
  `https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`
- source URL SHA-256:
  `98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`
- PDF byte length: `4220387`
- PDF content SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`
- maximum accepted PDF size: `26214400` bytes.

Any different URL, PDF byte length, PDF content hash, or source identity is
outside this recovery contract.

## Architecture

The future implementation must use two distinct components.

### 1. Blob-only oversize evidence component

Future file:

`build/apps-script-brand/PhiladelphiaProbateBoundedOversizeTextEvidence.js`

Future namespace:

`REOS.PhiladelphiaProbateBoundedOversizeTextEvidence`

Future method:

`inspect(blob)`

This component has zero independent HTTP authority.

It accepts only an already-obtained PDF Blob.

Before any Drive/OCR operation it MUST independently verify:

1. Blob exists.
2. byte length does not exceed `26214400`;
3. byte length is exactly `4220387`;
4. first bytes identify `%PDF-`;
5. exact PDF SHA-256 equals
   `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

### 2. Production oversize-evidence recovery orchestration

Future file:

`build/apps-script-brand/PhiladelphiaProbateProductionOversizeTextEvidenceRecovery.js`

Future zero-argument RPC:

`reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery()`

The future orchestration may later be separately authorized for at most:

- one direct HTTPS GET;
- one response Blob;
- one call to
  `REOS.PhiladelphiaProbateBoundedOversizeTextEvidence.inspect(blob)`.

The exact response Blob validated by the orchestration MUST be the same Blob
passed to the evidence component.

## Transport boundary

A future production recovery execution may use exactly one new direct GET to
the certified source URL.

Required transport behavior:

- method `get`;
- `followRedirects: false`;
- `muteHttpExceptions: true`;
- `Accept: application/pdf`;
- exactly one `UrlFetchApp.fetch` call site;
- zero retries;
- zero fallback URLs;
- zero source discovery;
- zero article-page fetch;
- zero continuation;
- zero secondary source.

Before calling the evidence component, the future orchestration MUST verify:

1. source identity is pinned;
2. HTTP response is 2xx;
3. response Blob exists;
4. body is non-empty;
5. byte length does not exceed `26214400`;
6. byte length is exactly `4220387`;
7. PDF signature is valid;
8. Content-Type, when present, is PDF;
9. exact PDF SHA-256 matches the certified hash;
10. HTTP fetch count is exactly `1`.

## Previous runtime prohibition

The recovery orchestration MUST NOT call:

- `reosPhiladelphiaProbateProductionExtractionOrchestration()`;
- `REOS.PhiladelphiaProbateProductionExtractionOrchestration.execute()`;
- `REOS.PhiladelphiaProbateBoundedTextExtraction.extract()`;
- `reosPhiladelphiaProbateBoundedPdfFetch()`;
- `REOS.PhiladelphiaProbateBoundedPdfFetch.execute`;
- `reosPhiladelphiaProbateBoundedSourceDiscovery()`.

The recovery is intentionally independent of the normal extractor's
`250000`-character acceptance gate.

## Prior temporary-artifact prohibition

The recovery MUST NOT:

- search Drive for the temporary artifact created by the failed attempt;
- restore a trashed temporary artifact;
- reopen a prior temporary artifact;
- infer a prior temporary artifact ID;
- depend on the continued existence of a prior temporary artifact.

Any future evidence execution uses one new ephemeral OCR artifact only after
separate explicit authorization.

## OCR evidence authority

For the exact verified PDF Blob only, the future blob-only evidence component
may perform exactly:

1. one `Drive.Files.create` OCR conversion;
2. one `DocumentApp.openById`;
3. one body-text read;
4. one SHA-256 computation over the complete returned text;
5. one cleanup attempt for the exact created temporary document.

The OCR language must remain `en`.

The exact temporary document ID returned by `Drive.Files.create` must be the
only document ID opened and the only artifact targeted for cleanup.

## Oversize observation semantics

This recovery MUST NOT increase the normal extraction acceptance limit.

The normal extraction limit remains:

`250000`

characters.

The evidence component MUST obtain the complete text string returned by the one
authorized DocumentApp body-text read and compute:

- actual `text.length`;
- SHA-256 of the complete extracted text.

It MUST then require:

`observedTextCharacterCount > 250000`

for an oversize-recovery success.

If the observed count is less than or equal to `250000`, the recovery MUST fail
closed because that would contradict the certified incident basis.

The evidence path does not "accept" oversize text for normal extraction.

It observes the text only long enough to compute bounded metadata.

No new normal extraction text limit is established by this recovery contract.

## Why this evidence path does not define a larger text limit

The purpose is to discover the actual oversize count.

Choosing a larger acceptance limit before measuring the real count would be
unsupported.

The recovery therefore separates:

- observation of the actual text length/hash;
from
- any later decision about an appropriate normal parsing or extraction
  architecture.

Any later increase to a normal extraction limit requires a separate design,
validation, deployment, and production authorization.

## Required evidence result

A successful blob-only evidence result must contain metadata only, including:

- `ok: true`;
- evidence version;
- exact PDF SHA-256;
- exact PDF byte length;
- `currentNormalExtractionLimit: 250000`;
- actual `observedTextCharacterCount`;
- complete extracted-text SHA-256;
- `exceedsCurrentNormalExtractionLimit: true`;
- `acceptedForNormalExtraction: false`;
- temporary artifact created;
- cleanup attempted;
- cleanup confirmed;
- Drive create count `1`;
- DocumentApp open count `1`;
- `fullExtractedTextReturned: false`;
- `pdfBytesReturned: false`.

The production recovery orchestration may additionally return transport
metadata such as:

- source URL identity;
- HTTP status;
- HTTP fetch count `1`;
- content type;
- extraction-evidence invocation count `1`.

## Prohibited result surfaces

Neither future component may return:

- full extracted text;
- partial extracted text;
- text preview;
- PDF bytes;
- Blob;
- temporary document ID;
- Drive file ID;
- parsed probate records;
- normalized records;
- property matches;
- lead payloads.

The output must remain bounded metadata regardless of the observed text length.

## Cleanup boundary

After a temporary document ID exists, cleanup MUST be attempted on every path.

A success result is prohibited unless cleanup is confirmed.

Cleanup failure MUST fail closed.

The implementation MUST NOT silently swallow cleanup failure.

## No parsing authority

The evidence component and recovery orchestration MUST NOT:

- interpret extracted text as probate notices;
- split the text into notices;
- identify estates;
- identify decedents;
- identify executors;
- identify addresses;
- normalize names;
- match properties;
- create probate records;
- create distress leads.

## No persistence authority

The recovery MUST NOT persist:

- OCR text;
- character counts;
- SHA values;
- PDF bytes;
- probate evidence;
- records;
- leads;

to:

- Sheets;
- PropertiesService;
- Drive files;
- databases;
- county-data stores;
- acquisition records.

The only Drive mutation authority is the lifecycle of one ephemeral OCR
document.

## No scheduler or connector authority

The recovery grants no authority for:

- connector registration;
- connector fetch;
- scheduler inspection;
- scheduler mutation;
- trigger mutation;
- checkpoint mutation;
- county-data mutation.

## Acquisition safety boundary

This recovery grants no:

- Qualified Deal Queue authority;
- acquisition lifecycle authority;
- ARV authority;
- repair-scope authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority.

The observed text metadata is evidence only.

Automatic MAO or offer authority remains prohibited unless separately supported
by comp-based ARV and adequate repair scope under the existing acquisition
safety gate.

## Offline validation requirements

Before implementation can be certified, deterministic tests MUST prove at
least:

### Blob-only evidence component

- zero `UrlFetchApp` surface;
- exact PDF identity verification before Drive creation;
- exactly one `Drive.Files.create` call site;
- exactly one `DocumentApp.openById` call site;
- exactly one body-text read path;
- full-text SHA computed from complete observed text;
- success requires observed count greater than `250000`;
- success still reports `acceptedForNormalExtraction: false`;
- no full text returned;
- no preview returned;
- no PDF bytes returned;
- cleanup exact-ID targeting;
- cleanup on all post-create failures;
- cleanup failure fails closed;
- no persistence;
- no parsing;
- no acquisition authority.

### Production recovery orchestration

- exactly one `UrlFetchApp.fetch` call site;
- redirects false;
- no retry;
- no fallback;
- no source discovery;
- exact PDF transport validation;
- exact same response Blob passed to the evidence component;
- exactly one evidence-component invocation;
- no normal extraction orchestrator call;
- no normal extractor call;
- no direct Drive/OCR surface in the orchestration;
- metadata-only return.

## Required later gates

Before any second OCR operation may occur:

1. certify this design contract;
2. implement both recovery components offline;
3. create deterministic behavior validators;
4. prove the normal `250000` extraction limit remains unchanged;
5. integrate runtime accounting while preserving historical reconciliation at
   `147`;
6. run CI;
7. merge;
8. certify post-merge main;
9. source-deploy through a separately authorized deployment gate;
10. certify the resulting production version;
11. deploy and execute any zero-side-effect readiness probe required for the
    new recovery runtime;
12. separately authorize exactly one production oversize-evidence recovery RPC.

A successful oversize-evidence recovery still does not authorize parsing.

Its only purpose is to establish the actual observed text character count and
complete-text SHA-256.

This design contract authorizes zero production HTTP requests and zero OCR
operations.
