# Philadelphia Probate PB1 — Orphan-Anchored Marker-Evidence Recovery Production Transport Design v1

## Status

Design contract only.

This document authorizes no production transport implementation, public RPC
implementation, runtime accounting modification, workflow modification, source
deployment, Apps Script version creation, deployment update, HTTP execution,
OCR execution, Drive mutation, production RPC execution, probate parsing,
parser repair, persistence, county-data mutation, ARV authority, repair-scope
authority, MAO authority, or offer authority.

The successor diagnostic described here is distinct from the previously
executed v143 marker-evidence diagnostic.

It MUST NOT be represented as a retry of v142 or as a third v143 invocation.

## Repository authority

This design is based on the post-merge certified REOS main authority:

- main SHA:
  `879f941a4b490baf1be188ebd7bef7baffb70339`;
- main tree:
  `156659dd6ed949a37b7c0f1ebc698343f0271acc`;
- current post-county production file count: `66`;
- current component validator count: `95`;
- current reconciled production inventory count: `147`;
- current generated county connector count: `94`.

This design gate MUST NOT change any current accounting count.

A later implementation/accounting gate may separately determine whether the
future transport runtime and behavior validator require a `67 / 96`
post-county/component transition.

The reconciled production inventory is expected to remain `147` because
`POST_COUNTY_PRODUCTION_FILES` is outside the separately reconciled county
production inventory.

The generated county connector count is expected to remain `94`.

This design does not authorize any accounting transition.

## Prior production-attempt authority remains consumed

The failed v142 production-analysis invocation remains consumed and MUST NOT be
retried.

The already-certified v143 marker-evidence transport has a total historical
production RPC attempt count of exactly `2`.

A third v143 RPC is not authorized.

No future orphan-anchored live diagnostic may execute from immutable Apps
Script version `143`.

Any future live orphan-anchored diagnostic requires separately implemented,
validated, source-deployed, immutable-versioned, deployment-updated, and
RPC-preflight-certified successor authority.

The future successor diagnostic RPC may be attempted at most once under a
separate explicit live-execution authorization.

Failure of that future successor RPC does not itself authorize a retry.

## Diagnostic objective

The sole purpose of the future transport is to:

1. validate one exact pinned PB1 publication identity;
2. execute at most one HTTP GET for that exact publication;
3. validate the exact returned PDF identity;
4. hand the exact same validated response Blob exactly once to the already
   certified orphan-anchored Blob-only component;
5. validate the component result without creating another evidence selector;
6. return only bounded ORPHAN-anchored evidence and certified safety metadata.

The transport grants no probate parser authority.

The transport grants no parser-repair authority.

It grants no authority to create, classify, reconcile, persist, or advance
probate/property/acquisition records.

## Future production artifacts

Future production runtime:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport.js`

Future deterministic behavior validator:

`scripts/validate-philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-production-transport-v1.js`

Potential future public RPC:

`reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport`

The future public RPC has exactly zero arguments.

No caller-controlled URL, source, search term, locator, regular expression,
context size, offset, range, pagination token, OCR setting, parser grammar,
ranking option, retry option, or fallback option is authorized.

## Certified successor component authority

The future transport may hand the PDF Blob only to:

`REOS.PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.recover(blob)`

The certified successor component runtime SHA-256 is:

`288ea256ddf9d93af3cce7780700c1f823dbd4ea8649fd307d369923610655a0`

The certified successor behavior-validator SHA-256 is:

`7db85b98bedbf7afcead062d4a040c81f6a1eec4a004508c739381e680175527`

The transport MUST NOT invoke the predecessor component:

`REOS.PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.recover(blob)`

The transport MUST NOT implement its own OCR locator search, candidate ranking,
window allocation, deduplication, overlap resolution, parser marker grammar, or
fallback evidence selection.

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
and successor-component metadata must be validated before the one HTTP attempt
is consumed.

No source discovery is authorized.

No alternate URL is authorized.

No fallback source is authorized.

## Required successor-component metadata before HTTP

Before consuming the one HTTP attempt, the future transport must require that
the loaded orphan-anchored component exposes exactly the certified metadata
needed for transport safety:

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
- fixed locator family count: `5`;
- maximum context count: `8`;
- maximum context characters: `800`;
- maximum aggregate context characters: `6400`;
- `recover` is a function with exactly one Blob argument.

Metadata mismatch must fail before HTTP.

The runtime repository/deployment certification must additionally prove that
the loaded component is the separately certified orphan-anchored component,
not the predecessor generic marker-evidence component.

## Exactly one HTTP GET maximum

Each future transport invocation may contain exactly one executable
`UrlFetchApp.fetch(...)` call site.

The fixed request must use:

- HTTP method: `get`;
- `followRedirects: false`;
- `muteHttpExceptions: true`;
- request header `Accept: application/pdf`.

Maximum HTTP fetch count per invocation: `1`.

HTTP retry count: `0`.

HTTP fallback count: `0`.

A transport failure, HTTP failure, PDF-identity failure, successor-component
failure, OCR failure, cleanup failure, result-validation failure, or output
validation failure MUST NOT cause a second HTTP request.

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

An absent Content-Type alone does not defeat the exact byte-length, signature,
and SHA-256 identity checks.

A non-empty non-PDF Content-Type must fail closed.

## Same-response Blob handoff

The exact Blob obtained from the one authorized HTTP response and whose bytes
were validated MUST be the Blob handed to:

`REOS.PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.recover(blob)`

No reconstructed Blob is authorized.

No copied Blob is authorized.

No persisted source Blob is authorized.

The successor-recovery invocation call-site count must be exactly `1`.

The successor-recovery invocation count per transport execution must never
exceed `1`.

Successor-recovery failure MUST NOT cause a second HTTP request.

Successor-recovery failure MUST NOT cause a recovery retry.

The transport owns only the one pinned HTTP GET and the one same-response Blob
handoff.

## Direct OCR and Drive authority are forbidden in the transport

The future production transport must not directly invoke:

- `Drive.Files.create`;
- `Drive.Files.list`;
- `Drive.Files.get`;
- `DocumentApp.openById`;
- `DriveApp.getFileById`;
- any Drive file search or list operation;
- any OCR service.

The certified orphan-anchored Blob-only component owns the bounded OCR
lifecycle.

The transport owns no OCR lifecycle.

## Exact recovered OCR identity remains fixed

The successor component must continue to fail closed unless recovered OCR
identity is exactly:

- character count: `566435`;
- character count greater than normal extraction limit `250000`;
- character count no greater than certified oversize ceiling `600000`;
- SHA-256:
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

The successor diagnostic does not create a new OCR baseline.

## ORPHAN-anchored evidence contract

The fixed locator family remains exactly:

- `ESTATE`;
- `NOTICE`;
- `ORPHAN`;
- `COURT`;
- `DIVISION`.

`ORPHAN` remains the required primary evidence anchor.

Every successful returned context MUST include `ORPHAN` in its
`locatorLabels`.

A successful returned context without `ORPHAN` MUST cause the transport to fail
closed.

The transport MUST NOT create any generic `ESTATE`, `NOTICE`, `COURT`, or
`DIVISION` fallback.

The transport MUST NOT allocate new evidence windows from generic locators.

The transport MUST NOT perform a second candidate ranking.

The transport MUST NOT merge, expand, re-rank, or replace the component's
selected evidence windows.

The transport may validate source ordering and non-overlap, but must preserve
the component contexts exactly.

Maximum context count remains exactly `8`.

Maximum characters per context remains exactly `800`.

Maximum aggregate context characters remains exactly `6400`.

## Exact context schema

Each returned context must contain exactly:

- `locatorLabels`;
- `startOffset`;
- `endOffset`;
- `rawOcrContext`;
- `contextCharacterCount`;
- `contextSha256`.

For every context the transport must require:

- `locatorLabels` is a non-empty array;
- every label belongs to the fixed five-label locator family;
- `ORPHAN` is present in `locatorLabels`;
- `startOffset` is a non-negative integer;
- `endOffset` is an integer greater than `startOffset`;
- `contextCharacterCount` equals `rawOcrContext.length`;
- `contextCharacterCount` is no greater than `800`;
- `contextSha256` is the exact SHA-256 of `rawOcrContext`.

Returned contexts must remain in ascending source-offset order.

Returned contexts must remain non-overlapping.

The aggregate context-character count must equal the sum of the returned
context lengths and must not exceed `6400`.

## Required successor-result validation

Before returning success, the transport must require successor-component
evidence consistent with the certified contract, including:

- `ok === true`;
- marker evidence version `1`;
- exact PDF byte length and SHA-256;
- exact recovered OCR character count and SHA-256;
- `exactRecoveredTextIdentityConfirmed === true`;
- locator family count `5`;
- context count between `1` and `8`;
- maximum context count `8`;
- maximum context characters `800`;
- maximum aggregate context characters `6400`;
- returned contexts conform exactly to the fixed schema;
- every returned context includes `ORPHAN`;
- returned contexts remain source ordered;
- returned contexts remain non-overlapping;
- aggregate context characters are internally exact and bounded;
- temporary artifact creation evidence is true;
- temporary artifact cleanup attempt evidence is true;
- temporary artifact cleanup confirmation evidence is true;
- Drive create count `1`;
- document open count `1`;
- text read count `1`.

The transport must require the component safety evidence to remain false where
applicable, including:

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

## Parser grammar remains forbidden

The future transport MUST NOT contain or invoke the production parser marker
grammar:

`/ESTATE[\s]+NOTICES[\s]+ORPHANS'?[\s]+COURT[\s]+DIVISION/i`

The transport MUST NOT invoke:

- `parseEstateNotices_`;
- certified production probate analysis;
- notice parsing;
- representative parsing;
- decedent normalization;
- probate candidate classification;
- parser repair.

The existence of ORPHAN-anchored evidence does not establish the exact probate
marker form and does not authorize parser repair.

## Forbidden output

The future public diagnostic result must not return:

- full OCR text;
- generic OCR preview;
- arbitrary OCR prefix or suffix;
- complete PDF bytes;
- Blob;
- source response Blob;
- temporary Drive document ID;
- Drive URL;
- temporary file metadata;
- parsed estate notices;
- decedent candidates;
- arbitrary caller-selected text.

The literal pinned source URL need not be returned.

The result may return only bounded ORPHAN-anchored contexts plus certified
source-identity, PDF-identity, OCR-identity, transport, cleanup, and negative
safety metadata.

## Permitted transport result evidence

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
- successor-recovery execution count `1`;
- exact recovered OCR character count and SHA-256;
- fixed locator family count;
- primary evidence anchor `ORPHAN`;
- fixed context ceilings;
- bounded ORPHAN-anchored contexts;
- temporary-artifact cleanup evidence;
- negative safety evidence.

## No operational side authority

The future transport has no authority for:

- source discovery;
- alternate-source lookup;
- OPA lookup;
- property lookup;
- property reconciliation;
- lead creation;
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

## New immutable Apps Script version requirement

The successor transport MUST NOT be executed live from immutable Apps Script
version `143`.

After the future transport implementation is merged and post-merge
CI-certified, source deployment requires a separate explicit gate.

After source deployment, a new immutable Apps Script version must be created
through a separate explicit gate.

The exact new immutable version number must be determined and certified at that
later version-creation gate.

The intended diagnostic deployment may be updated to that new immutable version
only through a separate explicit deployment-update gate.

No live successor RPC may execute until the new immutable version and intended
deployment are both separately certified.

Total historical v143 production RPC attempt count remains exactly `2`.

A third v143 RPC remains prohibited.

## Future successor diagnostic attempt accounting

After all implementation, CI, source-deployment, immutable-version,
deployment-update, caller-binding, and RPC-preflight gates are separately
certified, at most one successor live diagnostic RPC attempt may be explicitly
authorized.

That future authorization applies only to the successor public RPC:

`reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport`

It does not authorize any invocation of the predecessor v143 RPC.

It does not authorize automatic retry.

A failed successor diagnostic requires a new explicit reconciliation before any
later retry could even be considered.

This design itself authorizes zero successor production RPC attempts.

## Offline implementation validation requirements

A later deterministic implementation validator must prove at least:

1. the future public RPC has exactly zero parameters;
2. the exact pinned source URL is fixed in source;
3. source URL SHA-256 is fixed;
4. source host is fixed;
5. source basename is fixed;
6. publication date is fixed;
7. source identity is validated before HTTP;
8. successor-component metadata is validated before HTTP;
9. the successor orphan-anchored component namespace is used;
10. the predecessor generic marker component namespace is not invoked;
11. exactly one executable `UrlFetchApp.fetch(...)` call site exists;
12. HTTP method is GET;
13. redirects are disabled;
14. `muteHttpExceptions` is enabled;
15. `Accept: application/pdf` is fixed;
16. maximum HTTP fetch count per invocation is `1`;
17. HTTP retry count is zero;
18. HTTP fallback count is zero;
19. source-discovery call-site count is zero;
20. response status must be 2xx;
21. exact response byte length is required;
22. maximum PDF byte ceiling is enforced;
23. `%PDF-` signature is required;
24. exact PDF SHA-256 is required;
25. non-empty non-PDF Content-Type fails closed;
26. missing Content-Type remains acceptable only because exact PDF identity is
    independently required;
27. the exact validated response Blob is handed to successor recovery;
28. no reconstructed Blob is used;
29. no copied Blob is used;
30. exactly one successor-recovery invocation call site exists;
31. successor recovery is invoked at most once;
32. successor-recovery failure causes zero HTTP refetches;
33. successor-recovery failure causes zero recovery retries;
34. transport contains no direct Drive/OCR call site;
35. exact OCR identity remains `566435` and the certified SHA-256;
36. fixed locator family count remains `5`;
37. primary evidence anchor remains `ORPHAN`;
38. context count is between `1` and `8`;
39. maximum context count remains `8`;
40. maximum context characters remains `800`;
41. aggregate context maximum remains `6400`;
42. every successful returned context contains `ORPHAN`;
43. generic locator fallback is absent;
44. no second evidence-window selector exists;
45. no second candidate ranking exists;
46. context field set is exact;
47. context lengths are exact and bounded;
48. context SHA-256 values are validated;
49. returned contexts are source ordered;
50. returned contexts are non-overlapping;
51. aggregate returned characters are exact and bounded;
52. full OCR text is not returned;
53. generic OCR preview is not returned;
54. PDF bytes or Blob are not returned;
55. temporary document identity is not returned;
56. production parser marker grammar is absent from transport selection logic;
57. probate parsing is not invoked;
58. parser repair is not invoked;
59. OPA/property lookup is not invoked;
60. property reconciliation is not invoked;
61. lead creation is not invoked;
62. persistence is not invoked;
63. scheduler/trigger/checkpoint/cursor mutation is not invoked;
64. county-data mutation is not invoked;
65. ARV, repair-scope, MAO, and offer authority remain false;
66. offline validation executes no live HTTP;
67. offline validation executes no live OCR, Drive, or DocumentApp operation;
68. implementation does not authorize any v143 RPC;
69. implementation does not itself authorize a successor production RPC;
70. synthetic transport fixtures certify mechanics only and do not establish a
    new OCR baseline or parser grammar.

## Required staged gates after this design

If this design is later merged and post-merge CI-certified, the intended
sequence is:

1. separately authorize offline successor transport implementation;
2. implement the zero-argument one-GET successor transport and deterministic
   behavior validator;
3. separately reconcile runtime/component accounting if required;
4. explicitly register implementation validation in CI;
5. run PR CI;
6. merge and certify post-merge CI;
7. perform a source-only deployment preflight;
8. deploy source only through a separate source-deployment gate;
9. create a new immutable Apps Script version through a distinct gate;
10. certify the exact new immutable version;
11. update the intended diagnostic deployment through a distinct gate;
12. certify the updated deployment;
13. perform corrected-caller / scope / RPC preflight;
14. explicitly authorize at most one successor diagnostic RPC attempt;
15. execute the successor RPC at most once;
16. preserve only bounded ORPHAN-anchored contexts and associated evidence;
17. analyze that exact bounded evidence offline;
18. only then determine whether parser repair is justified;
19. design and validate any parser repair separately.

No future step may be represented as a retry of v142 or as a third v143
invocation.

## Acquisition safety boundary

No automatic MAO or offer authority may arise from this diagnostic.

Automatic MAO or offer authority remains prohibited unless independent
comp-supported ARV and adequate repair-scope evidence are both present.

## Design authorization

This document authorizes design only.

It does not authorize:

- production transport implementation;
- transport behavior-validator implementation;
- public RPC implementation;
- runtime accounting modification;
- workflow modification;
- CI registration;
- source deployment;
- Apps Script version creation;
- deployment update;
- HTTP execution;
- OCR execution;
- Drive mutation;
- production RPC execution;
- probate parsing;
- parser repair;
- persistence;
- county-data mutation;
- acquisition automation.
