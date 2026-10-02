# Philadelphia Probate PB1 — Certified Oversize Analysis Production Transport Contract v1

## Status

Design contract only.

This contract does not authorize implementation, deployment, production HTTP,
analysis execution, OCR, parsing, OPA/property reconciliation, persistence,
scheduler authority, MAO, or offers.

## Certified prerequisite

The certified PB1 oversize publication-analysis runtime is deployed as Apps
Script production version `141`.

Exactly one zero-side-effect readiness RPC has already succeeded and proved:

- the certified analysis runtime is loaded;
- `analysisVersion` is exactly `1`;
- `analysis.analyze` exists as a function;
- `analysis.analyze` was not invoked by readiness;
- the certified metadata is loaded exactly.

The readiness RPC MUST NOT be called by the future transport.

## Future transport runtime

Future runtime:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport.js`

Future behavior validator:

`scripts/validate-philadelphia-probate-certified-oversize-analysis-production-transport-v1.js`

Future public production RPC:

`reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport(noticeOffset)`

The public RPC has exactly one caller-controlled argument.

## Notice-offset boundary

`noticeOffset` MUST be converted to a Number and rejected unless it is a
nonnegative integer.

The notice offset must be validated before the HTTP request.

`0` is the initial authorized page offset.

The transport itself MUST NOT create, decode, persist, or advance a PB1 cursor.

The certified analysis runtime remains responsible only for applying the
validated numeric offset to its bounded parsed-notice page.

## Exact pinned source

The only authorized source URL is:

`https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`

Exact source URL SHA-256:

`98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`

Exact source host:

`assets.alm.com`

Exact source basename:

`tlipn093026.pdf`

Exact publication date:

`2026-09-30`

The source URL, host, basename, publication date, and source-URL SHA must be
validated before HTTP.

## Exactly one transport attempt

Each future transport invocation may contain exactly one executable:

`UrlFetchApp.fetch(...)`

The request MUST use:

- method `get`;
- `followRedirects: false`;
- `muteHttpExceptions: true`;
- `Accept: application/pdf`.

There is no retry.

There is no fallback.

There is no second HTTP attempt.

A thrown HTTP error consumes the single transport attempt and fails closed.

A redirect response fails closed.

Any non-2xx response fails closed.

## No source discovery

The future transport MUST NOT call or reference any source-discovery path,
including:

- `PhiladelphiaProbateRecurringSource.resolve`;
- `reosPhiladelphiaProbateBoundedSourceDiscovery`;
- `PhiladelphiaProbateBoundedPdfFetch`;
- `probateSourcePreflight_`;
- legacy `PAPhiladelphiaCountyConnector` probate fetch logic.

The future transport uses only the one pinned PB1 PDF.

## Certified analysis dependency before HTTP

Before consuming the single HTTP attempt, the future transport MUST verify that:

`REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysis`

is loaded.

It must validate the loaded analysis metadata exactly:

- `analysisVersion: 1`;
- `expectedPublicationDate: "2026-09-30"`;
- `expectedPdfBytes: 4220387`;
- `expectedPdfSha256` equals the certified PDF SHA;
- `maxPdfBytes: 26214400`;
- `currentNormalExtractionLimit: 250000`;
- `certifiedOversizeTextLimit: 600000`;
- `expectedTextCharacterCount: 566435`;
- `expectedTextSha256: "31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3"`;
- `noticePageSize: 25`;
- `representativeTextLimit: 500`;
- `cursorDomain: "PHL-PROBATE-PB1-V1"`;
- `analysis.analyze` is a function.

A mismatch must fail before HTTP.

The transport MUST NOT call the readiness RPC.

## Response PDF identity before analysis

The exact Blob returned by the single HTTP response must be read and validated
before the analysis invocation.

The transport must fail closed unless all of the following hold:

- Blob exists;
- byte array exists;
- byte array is non-empty;
- byte length is no greater than `26214400`;
- byte length is exactly `4220387`;
- first five bytes are `%PDF-`;
- Content-Type, when present, is `application/pdf`;
- SHA-256 is exactly
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

The exact Blob whose bytes were validated MUST be the Blob handed to the
certified analysis runtime.

No reconstructed Blob is authorized.

No second Blob source is authorized.

## Exactly one certified analysis invocation

After exact PDF identity is established, the transport may invoke exactly:

`REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysis.analyze(blob, noticeOffset)`

exactly once.

No other analysis invocation is authorized.

Analysis failure MUST NOT cause an HTTP retry.

Analysis failure MUST NOT cause an analysis retry.

## No legacy normal-extraction path

The production transport MUST NOT call or reference:

- `reosPhiladelphiaProbateProductionExtractionOrchestration`;
- `REOS.PhiladelphiaProbateProductionExtractionOrchestration`;
- `REOS.PhiladelphiaProbateBoundedTextExtraction`;
- the old normal extraction RPC;
- the old bounded extractor.

The normal extraction limit remains exactly `250000`.

The new transport MUST NOT reinterpret the certified oversize PB1 document as a
normal-extraction document.

## No old oversize recovery path

The production transport MUST NOT call or reference:

- `reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery`;
- `REOS.PhiladelphiaProbateProductionOversizeTextEvidenceRecovery`;
- `REOS.PhiladelphiaProbateBoundedOversizeTextEvidence`.

The historical recovery evidence remains evidence only.

## No direct OCR authority in transport

The transport itself MUST contain zero call sites for:

- `Drive.Files.create`;
- `DocumentApp.openById`;
- `DriveApp.getFileById`.

Drive conversion, OCR, document read, and cleanup remain encapsulated only
inside the already-certified analysis runtime.

The transport MUST NOT search for or reuse any prior temporary artifact.

## Certified analysis evidence required

The transport must fail closed unless the returned analysis result confirms:

- `ok: true`;
- `analysisVersion: 1`;
- publication date `2026-09-30`;
- PDF byte length `4220387`;
- PDF SHA equals the certified PDF SHA;
- maximum PDF bytes `26214400`;
- normal extraction limit `250000`;
- certified oversize text limit `600000`;
- observed OCR character count `566435`;
- observed OCR SHA is exactly `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`;
- `exceedsCurrentNormalExtractionLimit: true`;
- `acceptedForNormalExtraction: false`;
- `exactRecoveredTextIdentityConfirmed: true`;
- `probateParsingExecuted: true`;
- `noticeOffset` equals the caller's validated offset;
- `noticePageSize: 25`;
- selected notice count is between `1` and `25`;
- next notice offset equals notice offset plus selected notice count;
- `hasMore` is boolean;
- cursor domain is `PHL-PROBATE-PB1-V1`;
- representative text limit is `500`;
- notices is an array with exactly selected notice count entries;
- every notice publication date is `2026-09-30`;
- every representative text value is no longer than `500` characters;
- temporary artifact was created;
- cleanup was attempted;
- cleanup was confirmed;
- Drive create count is exactly `1`;
- document open count is exactly `1`;
- text read count is exactly `1`;
- full extracted text was not returned;
- text preview was not returned;
- PDF bytes were not returned;
- source discovery was not executed;
- HTTP fetch inside analysis was not executed;
- OPA lookup was not executed;
- property reconciliation was not executed;
- lead creation was not executed;
- persistence was not executed;
- scheduler inspection/mutation was not executed;
- trigger/checkpoint mutation was not executed;
- county-data mutation was not executed;
- ARV authority was not granted;
- repair-scope authority was not granted;
- MAO authority was not granted;
- offer authority was not granted.

Any contradictory evidence fails closed.

## Bounded returned notices

The future transport may return the bounded notice page produced by the
certified analysis runtime.

It MUST NOT return:

- full OCR text;
- OCR text preview;
- raw PDF bytes;
- Blob objects;
- temporary Drive IDs;
- temporary document IDs;
- any unbounded parsed-publication representation.

The maximum returned notice count is `25`.

The maximum representative-text length per returned notice is `500`.

## Transport result metadata

A successful transport result may contain deterministic transport and bounded
analysis evidence including:

- `ok: true`;
- `transportVersion: 1`;
- publication date;
- source URL;
- source URL SHA;
- source host;
- source basename;
- `noticeOffset`;
- HTTP fetch count `1`;
- HTTP status;
- Content-Type;
- PDF byte length;
- maximum PDF bytes;
- PDF signature-valid flag;
- PDF SHA;
- analysis execution count `1`;
- certified analysis result fields;
- bounded notice page.

It must explicitly report that source discovery, legacy extraction,
readiness-RPC invocation, OPA lookup, property reconciliation, persistence,
scheduler mutation, county mutation, ARV, repair scope, MAO, and offer authority
were not executed or granted.

## No OPA/property reconciliation

The future transport MUST NOT query Philadelphia OPA.

It MUST NOT call:

`CountyAdapters.Registry.fetch`

It MUST NOT reconcile decedent names to properties.

It MUST NOT create property observations.

## No persistence

The future transport MUST NOT write:

- Sheets;
- Drive files except temporary OCR work performed inside the certified
  analysis runtime;
- PropertiesService;
- database records;
- probate-source records;
- probate notices;
- cursors;
- checkpoints;
- leads.

## No scheduler authority

The future transport MUST NOT:

- inspect scheduler state;
- create/delete triggers;
- install/remove a scheduler;
- update checkpoints;
- acquire county mutation authority;
- enter unattended execution.

PB1 remains outside unattended scheduler authority.

## Acquisition safety boundary

Transport or analysis success grants no authority for:

- property reconciliation;
- Qualified Deal Queue entry;
- acquisition lifecycle advancement;
- ARV;
- repair scope;
- MAO;
- offer generation;
- offer submission.

No automatic MAO or offer authority may arise from this transport.

## Required offline implementation validation

Before implementation can be certified, deterministic offline validation must
prove at least:

1. exactly one public transport RPC exists;
2. it has exactly one formal argument;
3. invalid notice offsets fail before HTTP;
4. source URL identity is validated before HTTP;
5. certified analysis metadata is validated before HTTP;
6. exactly one executable `UrlFetchApp.fetch` call site exists;
7. request method is GET;
8. redirects are disabled;
9. HTTP retry count is zero;
10. source discovery call-site count is zero;
11. the exact response Blob is handed to analysis;
12. PDF byte length is validated before analysis;
13. PDF signature is validated before analysis;
14. PDF SHA is validated before analysis;
15. exactly one `analysis.analyze` call site exists;
16. analysis receives the validated notice offset;
17. analysis failure produces zero HTTP retry;
18. analysis failure produces zero analysis retry;
19. no legacy normal extraction surface exists;
20. no old oversize recovery surface exists;
21. direct Drive-create call-site count is zero;
22. direct DocumentApp-open call-site count is zero;
23. direct Drive-cleanup call-site count is zero;
24. readiness-RPC invocation count is zero;
25. analysis evidence is validated fail-closed;
26. returned notice page is bounded to 25;
27. representative text is bounded to 500;
28. no full text/preview/PDF bytes are returned;
29. no OPA/property authority exists;
30. no persistence authority exists;
31. no scheduler authority exists;
32. no ARV/repair/MAO/offer authority exists;
33. the offline validator performs no live HTTP;
34. the offline validator performs no live OCR.

## Accounting boundary

This design gate does not modify central accounting.

Current certified accounting remains:

- post-county production files: `62`;
- component validators: `91`;
- historical reconciled production inventory: `147`.

A later implementation/accounting gate may add exactly:

- one production-transport runtime;
- one production-transport behavior validator.

The expected moving inventories would then become:

- post-county production files: `63`;
- component validators: `92`;
- historical reconciled production inventory remains `147`.

The historical `147` inventory MUST NOT increase.

## Required later gates

After this design contract is certified:

1. implement the production transport offline;
2. implement deterministic transport behavior validation;
3. integrate accounting to `63 / 92 / 147`;
4. run PR CI;
5. merge and certify post-merge CI;
6. deploy the transport through a separate source-only version gate;
7. deploy a separate readiness probe for the new transport if required by the
   execution gate;
8. authorize exactly one initial transport invocation with `noticeOffset=0`;
9. inspect only bounded notice-page evidence;
10. design OPA/property reconciliation separately;
11. design persistence separately;
12. preserve the acquisition safety gate throughout.

This contract authorizes design only.
