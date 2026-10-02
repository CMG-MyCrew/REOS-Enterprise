# Philadelphia Probate PB1 — Marker-Evidence Recovery Production Transport Design v1

## Status

Design contract only.

This document authorizes no production implementation, source deployment,
Apps Script version creation, deployment update, HTTP execution, OCR execution,
Drive mutation, production RPC execution, parser modification, persistence, or
acquisition automation.

The future transport described here is a distinct bounded diagnostic transport.
It is not a retry of the failed PB1 production analysis invocation.

## Repository authority

This design is based on the post-merge certified REOS main authority:

- main SHA:
  `f2bfd33324e9542853eaaa3a147871676b40192c`;
- main tree:
  `f452bf7efddfde543f4d191830a08081fc6bbdfa`;
- current post-county production file count: `64`;
- current component validator count: `93`.

This design gate MUST NOT change either current accounting count.

A later implementation/accounting gate may separately determine whether the
future runtime and validator require a `65 / 94` accounting transition.

This design does not authorize that transition.

## Failed v142 invocation remains consumed

The original certified PB1 production analysis transport was deployed as
immutable Apps Script version `142`.

Exactly one production RPC attempt was consumed:

- function:
  `reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport`;
- notice offset: numeric `0`;
- scripts.run POST count: exactly `1`;
- retry count: exactly `0`.

The failure was:

`Error: PB1 certified oversize Estate Notices marker was not found.`

The failed v142 invocation MUST NOT be retried.

The future marker-evidence diagnostic RPC is a distinct diagnostic invocation
with distinct transport, version, deployment, RPC-preflight, execution evidence,
and attempt accounting.

It must never be represented as a retry of v142.

## Diagnostic objective

The sole production purpose of the future transport is to:

1. retrieve the already-certified PB1 PDF from one exact pinned URL;
2. validate the exact response PDF identity;
3. hand the exact same response Blob to the already-certified Blob-only
   marker-evidence recovery component exactly once;
4. return only the bounded marker evidence and safety metadata authorized by
   that component.

The future transport grants no probate parsing authority.

It grants no parser-repair authority.

It grants no authority to classify or persist probate leads.

## Future runtime

Future production runtime:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport.js`

Future deterministic behavior validator:

`scripts/validate-philadelphia-probate-certified-oversize-marker-evidence-recovery-production-transport-v1.js`

Potential future public RPC:

`reosPhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport`

The future public RPC has exactly zero arguments.

No caller-controlled URL, search term, regular expression, context size,
offset, pagination token, OCR setting, parser grammar, retry option, or source
selection is authorized.

## Exact pinned publication identity

The future transport is bound to exactly:

- publication date: `2026-09-30`;
- source URL:
  `https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`;
- source URL SHA-256:
  `98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`;
- source host: `assets.alm.com`;
- source basename: `tlipn093026.pdf`;
- exact PDF byte length: `4220387`;
- maximum PDF byte length: `26214400`;
- exact PDF SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

The source URL identity, host, basename, publication-date/basename relationship,
and marker-component metadata must be validated before the one HTTP attempt is
consumed.

No source discovery is authorized.

No alternate URL is authorized.

No fallback source is authorized.

## Exactly one HTTP GET

Each future transport invocation may contain exactly one executable
`UrlFetchApp.fetch(...)` call site.

The request must use:

- HTTP method: `get`;
- `followRedirects: false`;
- `muteHttpExceptions: true`;
- request header `Accept: application/pdf`.

Maximum HTTP fetch count per invocation: `1`.

HTTP retry count: `0`.

HTTP fallback count: `0`.

A transport failure, HTTP failure, PDF-identity failure, marker-component
failure, OCR failure, or cleanup failure MUST NOT cause a second HTTP request.

## HTTP response requirements

The one response must:

- expose `getResponseCode()`;
- expose `getBlob()`;
- return a 2xx status;
- return a non-empty Blob;
- remain within the maximum PDF byte ceiling;
- contain exactly `4220387` bytes;
- begin with `%PDF-`;
- have SHA-256 exactly
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

A non-empty Content-Type, when present, must identify `application/pdf`.

An absent Content-Type alone does not defeat the exact byte-length,
signature, and SHA-256 identity checks.

A non-empty non-PDF Content-Type must fail closed.

## Same-response Blob handoff

The exact Blob obtained from the one authorized HTTP response and whose bytes
were validated MUST be the Blob handed to:

`REOS.PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.recover(blob)`

No reconstructed Blob is authorized.

No copied Blob is authorized.

No second fetch is authorized.

No persisted source Blob is authorized.

The marker-recovery invocation call-site count must be exactly `1`.

The marker-recovery invocation count per transport execution must never exceed
`1`.

Marker-recovery failure MUST NOT cause a marker-recovery retry.

## Required marker-component metadata before HTTP

Before consuming the HTTP attempt, the transport must prove the loaded
Blob-only marker component exposes the certified metadata:

- marker evidence version: `1`;
- expected PDF byte length: `4220387`;
- expected PDF SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`;
- maximum PDF byte length: `26214400`;
- current normal extraction limit: `250000`;
- certified oversize text limit: `600000`;
- expected OCR character count: `566435`;
- expected OCR SHA-256:
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`;
- locator family count: `5`;
- maximum context count: `8`;
- maximum context characters: `800`;
- maximum aggregate context characters: `6400`;
- `recover` is a function.

Metadata mismatch must fail before HTTP.

## Direct OCR authority is forbidden in the transport

The future production transport must not directly invoke:

- `Drive.Files.create`;
- `DocumentApp.openById`;
- `DriveApp.getFileById`;
- any Drive file search or list operation;
- any OCR service other than through the certified Blob-only marker component.

The Blob-only marker component owns the one bounded OCR lifecycle.

The transport owns only the one pinned HTTP GET and the one Blob handoff.

## Exact recovered OCR identity remains fixed

The marker component must continue to fail closed unless recovered OCR identity
is exactly:

- character count: `566435`;
- character count greater than normal extraction limit `250000`;
- character count no greater than certified oversize ceiling `600000`;
- SHA-256:
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

The diagnostic does not create a new OCR baseline.

## Fixed bounded marker evidence

The transport may return only marker evidence produced by the certified
Blob-only component.

The fixed locator family remains:

- `ESTATE`;
- `NOTICE`;
- `ORPHAN`;
- `COURT`;
- `DIVISION`.

Maximum context count remains exactly `8`.

Maximum characters per context remains exactly `800`.

Maximum aggregate context characters remains exactly `6400`.

Each context may contain only:

- `locatorLabels`;
- `startOffset`;
- `endOffset`;
- `rawOcrContext`;
- `contextCharacterCount`;
- `contextSha256`.

The transport must not create a second, broader context mechanism.

It must not accept arbitrary caller-selected slices.

## Required marker-result validation

Before returning success, the transport must require marker-component evidence
consistent with the certified contract, including:

- `ok === true`;
- marker evidence version `1`;
- exact PDF byte length and SHA-256;
- exact recovered OCR count and SHA-256;
- `exactRecoveredTextIdentityConfirmed === true`;
- locator family count `5`;
- context count between `1` and `8`;
- maximum context count `8`;
- maximum context characters `800`;
- maximum aggregate context characters `6400`;
- aggregate returned context length no greater than `6400`;
- every context length no greater than `800`;
- every context has the fixed context fields;
- every context has a valid bounded start/end relationship;
- every context has at least one fixed locator label;
- temporary artifact creation evidence is true;
- temporary artifact cleanup attempt evidence is true;
- temporary artifact cleanup confirmation evidence is true;
- Drive create count `1`;
- document open count `1`;
- text read count `1`.

The transport must also require the component safety evidence to remain false
where applicable, including:

- component HTTP fetch execution;
- source discovery;
- prior Drive artifact search;
- probate parsing;
- parser repair;
- property lookup;
- OPA lookup;
- property reconciliation;
- lead creation;
- persistence;
- scheduler inspection;
- scheduler mutation;
- trigger mutation;
- checkpoint mutation;
- cursor mutation;
- county-data mutation;
- ARV authority;
- repair-scope authority;
- MAO authority;
- offer authority.

## Forbidden output

The future public diagnostic result must not return:

- full OCR text;
- generic OCR preview;
- unbounded OCR prefix or suffix;
- complete PDF bytes;
- Blob;
- temporary Drive document ID;
- Drive URL;
- temporary file metadata;
- parsed estate notices;
- decedent candidates;
- arbitrary caller-selected text.

The result may return the bounded marker contexts plus certified identity,
transport, cleanup, and safety metadata.

## Transport result evidence

A successful future transport result may report bounded evidence such as:

- transport version;
- marker evidence version;
- publication date;
- source URL SHA-256;
- source host;
- source basename;
- HTTP execution count `1`;
- HTTP status;
- observed Content-Type;
- exact PDF byte length;
- exact PDF SHA-256;
- same-response Blob handoff confirmation;
- marker-recovery execution count `1`;
- exact recovered OCR count and SHA-256;
- locator family count and fixed limits;
- bounded marker contexts;
- cleanup evidence;
- negative safety evidence.

The literal source URL does not need to be returned because the pinned source
identity is already represented by source URL SHA-256, host, basename, and
publication date.

## No probate parser authority

The future transport and public RPC must not invoke or authorize:

- `parseEstateNotices_`;
- certified production probate analysis;
- notice parsing;
- representative parsing;
- decedent normalization;
- probate candidate classification;
- parser repair.

The diagnostic output exists only to establish exact bounded evidence showing
how the certified OCR represented relevant marker text.

## No operational side authority

The future transport has no authority for:

- source discovery;
- OPA lookup;
- property lookup;
- property reconciliation;
- DISTRESS_LEADS persistence;
- Qualified Deal Queue mutation;
- acquisition lifecycle advancement;
- scheduler inspection or execution;
- trigger creation or deletion;
- checkpoint mutation;
- cursor mutation;
- county-data mutation;
- ARV calculation;
- repair-scope calculation;
- MAO calculation;
- offer generation;
- offer submission.

## Offline implementation validation requirements

A later implementation validator must deterministically prove at least:

1. the public RPC has exactly zero parameters;
2. source URL identity is fixed in source;
3. source URL identity is validated before HTTP;
4. marker-component metadata is validated before HTTP;
5. exactly one executable `UrlFetchApp.fetch(...)` call site exists;
6. HTTP method is GET;
7. redirects are disabled;
8. `muteHttpExceptions` is enabled;
9. `Accept: application/pdf` is fixed;
10. maximum HTTP fetch count per invocation is `1`;
11. retry count is zero;
12. fallback count is zero;
13. source discovery call-site count is zero;
14. response status must be 2xx;
15. exact response byte length is required;
16. `%PDF-` signature is required;
17. exact PDF SHA-256 is required;
18. non-empty non-PDF Content-Type fails closed;
19. missing Content-Type remains acceptable only because exact PDF identity is
    independently required;
20. the exact validated response Blob is handed to marker recovery;
21. no reconstructed Blob is used;
22. exactly one marker-recovery invocation call site exists;
23. marker recovery is invoked at most once;
24. marker-recovery failure causes zero refetches;
25. marker-recovery failure causes zero recovery retries;
26. transport contains no direct Drive/OCR call site;
27. exact OCR identity metadata remains `566435` and the certified SHA-256;
28. fixed locator family count remains `5`;
29. maximum context count remains `8`;
30. maximum context characters remains `800`;
31. aggregate context maximum remains `6400`;
32. returned contexts remain bounded and structurally validated;
33. full OCR text is not returned;
34. generic OCR preview is not returned;
35. PDF bytes are not returned;
36. temporary document identity is not returned;
37. probate parsing is not invoked;
38. parser repair is not invoked;
39. OPA lookup is not invoked;
40. property reconciliation is not invoked;
41. lead creation is not invoked;
42. persistence is not invoked;
43. scheduler/trigger/checkpoint/cursor mutation is not invoked;
44. county-data mutation is not invoked;
45. ARV, repair-scope, MAO, and offer authority remain false;
46. offline validation executes no live HTTP;
47. offline validation executes no live OCR, Drive, or DocumentApp operation.

Synthetic transport fixtures certify mechanics only.

They do not constitute a live diagnostic execution and do not establish any new
OCR or parser baseline.

## Required staged gates after this design

If this design is later merged and post-merge CI-certified, the intended
sequence is:

1. separately authorize offline transport implementation;
2. implement the zero-argument one-GET transport and deterministic validator;
3. separately reconcile runtime/component accounting if required;
4. register CI surfaces only through an explicit accounting/CI gate;
5. run PR CI;
6. merge and certify post-merge CI;
7. perform a source-only deployment preflight;
8. perform source deployment through a distinct gate;
9. create a new immutable Apps Script version through a distinct gate;
10. update the intended diagnostic deployment through a distinct gate;
11. perform a read-only diagnostic RPC preflight;
12. execute exactly one distinct marker-evidence diagnostic RPC;
13. preserve only the bounded marker contexts and associated evidence;
14. design parser repair from that exact evidence;
15. validate parser repair offline before any later production analysis.

No future step may be represented as a retry of the failed v142 invocation.

## Acquisition safety boundary

No automatic MAO or offer authority may arise from this diagnostic.

Automatic MAO or offer authority remains prohibited unless independent
comp-supported ARV and adequate repair-scope evidence are both present.

## Design authorization

This document authorizes design only.

It does not authorize:

- production transport implementation;
- public RPC implementation;
- runtime accounting modification;
- workflow modification;
- source deployment;
- Apps Script version creation;
- deployment update;
- HTTP execution;
- OCR execution;
- Drive mutation;
- production RPC execution;
- parser repair;
- persistence;
- acquisition automation.
