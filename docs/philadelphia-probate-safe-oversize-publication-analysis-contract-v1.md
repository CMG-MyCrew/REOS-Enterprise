# Philadelphia Probate PB1 — Safe Oversize Publication Analysis Contract v1

## Status

Design contract only.

This contract does not authorize implementation or production execution.

It establishes the next safe extraction architecture after the certified PB1
oversize-text evidence recovery.

## Recovered evidence authority

The exact certified PB1 source is:

- publication date: `2026-09-30`;
- source URL:
  `https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`;
- source URL SHA-256:
  `98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`;
- PDF byte length: `4220387`;
- PDF SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

The single certified recovery invocation established:

- observed OCR text character count: `566435`;
- observed OCR text SHA-256:
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`;
- temporary artifact created exactly once;
- temporary artifact cleanup attempted;
- temporary artifact cleanup confirmed;
- no full extracted text returned;
- no text preview returned;
- no PDF bytes returned.

The recovery invocation did not execute probate parsing, lead creation,
persistence, county-data mutation, ARV, repair-scope, MAO, or offer activity.

## Normal extraction boundary remains unchanged

The existing normal bounded extraction limit remains exactly:

`250000`

characters.

The recovered PB1 text contains:

`566435`

characters.

Therefore PB1 is not accepted for normal extraction.

This contract MUST NOT change, increase, reinterpret, or bypass the normal
`250000`-character extraction ceiling.

## Dedicated exact-PB1 oversize ceiling

The safe PB1-specific oversize analysis path has a separate maximum:

`600000`

characters.

This is not a replacement for the normal extraction limit.

It is a dedicated fail-closed ceiling for this exact certified PB1 source.

The recovered text has `33565` characters of headroom beneath that ceiling.

The future component MUST require all of the following before parsing:

1. text character count is greater than `250000`;
2. text character count is no greater than `600000`;
3. text character count is exactly `566435`;
4. text SHA-256 is exactly
   `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

If fresh OCR output differs in count or SHA-256, processing MUST fail closed.

A changed OCR result MUST NOT silently establish a new baseline.

A new baseline requires separate evidence review and authorization.

## Future component

Future runtime:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysis.js`

Future behavior validator:

`scripts/validate-philadelphia-probate-certified-oversize-publication-analysis-v1.js`

The future component is a Blob-only analysis component.

It MUST NOT perform HTTP.

It MUST NOT expose a production RPC.

It may accept only:

- the already-authorized PDF Blob;
- a bounded PB1 notice offset.

The notice offset must be a non-negative integer.

The notice page size is fixed at exactly `25`.

No caller-selected text limit, parser grammar, source identity, page size, OCR
option, source URL, or safety threshold is authorized.

## Exact PDF identity before mutation

Before any Drive mutation, the future component MUST validate:

- Blob existence;
- PDF byte length exactly `4220387`;
- PDF byte length no greater than `26214400`;
- `%PDF-` signature;
- PDF SHA-256 exactly
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

No temporary artifact may be created before those checks pass.

## One OCR lifecycle maximum

The future component may perform at most:

- one `Drive.Files.create`;
- one `DocumentApp.openById`;
- one document body text read;
- one cleanup attempt against the exact created document.

It MUST NOT search Drive for prior OCR artifacts.

It MUST NOT reuse or recover a prior temporary document.

Cleanup is mandatory and fail-closed.

A cleanup failure makes the whole analysis unsuccessful.

## In-memory text authority

The complete OCR text may exist only in memory inside the authorized analysis
invocation.

The complete OCR text MUST NOT be:

- returned by a public function result;
- written to Sheets;
- written to Drive;
- written to Script Properties;
- written to a database;
- written to logs;
- included in exception messages;
- included in evidence files.

No full-text preview is authorized.

Only deterministic metadata and bounded parsed probate candidates may leave the
analysis component.

## Evidence validation before probate parsing

The future component MUST compute:

- observed text character count;
- complete text SHA-256.

Probate parsing receives no authority until the component proves:

- observed character count exactly `566435`;
- observed text SHA-256 exactly
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`;
- observed character count is above `250000`;
- observed character count is at or below `600000`.

The parser MUST NOT receive text before those checks pass.

## Existing Estate Notices grammar to preserve

The existing certified Philadelphia probate parser establishes the PB1 section
identity as adjacent:

`ESTATE NOTICES`

and:

`ORPHANS' COURT DIVISION`

The new analysis path must preserve that marker authority.

The parser must preserve the existing bounded entry grammar:

- numbered entries using one or two digits;
- surname-first comma-form decedent identity;
- U+2013 en-dash entry delimiter;
- at most one OCR-wrapped candidate-name continuation;
- representative-role evidence;
- rejection of generic non-estate public-notice captions.

Representative text remains bounded to at most `500` characters per notice.

The safe path MUST NOT broaden the estate grammar merely because the complete
publication text is larger than the normal extraction ceiling.

## PB1 cursor and page boundary

The existing recurring-source cursor domain remains:

`PHL-PROBATE-PB1-V1`

The existing PB1 notice page size remains exactly:

`25`

notices.

The future analysis component may parse the complete certified publication
in memory but may return at most one bounded notice page.

The returned notice page may contain no more than `25` notice candidates.

No partial notice-page persistence authority is created by this contract.

## Bounded notice candidate output

Each returned candidate may contain only the bounded parsing fields needed for
later review/integration:

- decedent display value;
- normalized decedent identity;
- representative text capped at `500` characters;
- publication date.

The component may additionally return deterministic page/evidence metadata:

- publication date;
- PDF SHA-256;
- PDF byte length;
- observed text character count;
- observed text SHA-256;
- parsed notice count;
- notice offset;
- selected notice count;
- next notice offset;
- whether another page exists;
- PB1 cursor metadata;
- temporary-artifact cleanup confirmation.

No property record is authorized at this stage.

## No OPA/property reconciliation yet

The safe oversize publication analysis component MUST NOT:

- query Philadelphia OPA;
- call `CountyAdapters.Registry.fetch`;
- match owner names to parcels;
- create property observations;
- create `PROBATE_SOURCE_RECORD_ID`;
- normalize county leads;
- persist records.

OPA/property reconciliation is a separate later integration gate.

## Legacy direct connector OCR path is not new authority

`PAPhiladelphiaCountyConnector.js` currently contains an older direct probate
OCR path.

That legacy path:

- follows redirects;
- performs direct PDF fetch/OCR;
- treats temporary-document cleanup as best effort.

This contract does not authorize that legacy path for the newly certified PB1
production flow.

The new safe path must not call or depend on the legacy direct extraction
function as extraction authority.

No connector modification is authorized by this design gate.

## Future production transport remains separate

The future Blob-only analysis component has zero HTTP authority.

A later production orchestration contract must separately authorize any live
transport.

That future orchestration must remain bounded to:

- one exact HTTPS GET;
- redirects disabled;
- exact source URL;
- exact PDF byte length;
- exact PDF SHA-256;
- one invocation of the certified Blob-only analysis component;
- no retry or fallback.

This design contract grants zero production HTTP authority.

## No source discovery

The future analysis component MUST NOT invoke:

- `PhiladelphiaProbateRecurringSource.resolve`;
- `PhiladelphiaProbateBoundedSourceDiscovery`;
- article discovery;
- alternate publication lookup;
- fallback URL discovery.

The exact source is already established for PB1.

Recurring publication discovery remains a separate upstream authority.

## No unattended probate scheduler authority

This design does not add probate to the unattended county scheduler allowlist.

No scheduler, trigger, lease, checkpoint, or cursor persistence mutation is
authorized.

Any later recurring automation requires a separate integration and rollout
gate.

## Acquisition safety boundary

This analysis path grants no authority for:

- DISTRESS_LEADS persistence;
- Qualified Deal Queue entry;
- acquisition lifecycle advancement;
- ARV calculation;
- repair-scope calculation;
- MAO calculation;
- offer generation;
- offer submission.

No automatic MAO or offer authority may arise from extracted probate evidence.

## Required offline implementation validation

Before implementation can be certified, deterministic validation must prove at
least:

1. the component has zero HTTP call sites;
2. the normal extraction limit remains `250000`;
3. the dedicated oversize ceiling is exactly `600000`;
4. exact PDF identity is checked before Drive mutation;
5. one Drive create maximum;
6. one document open maximum;
7. one body text read maximum;
8. one cleanup site against the exact created document;
9. no prior temporary-artifact search;
10. cleanup failure fails closed;
11. observed text count must equal `566435`;
12. observed text SHA-256 must equal the certified recovered SHA-256;
13. parser execution occurs only after exact text evidence validation;
14. Estate Notices / Orphans' Court marker authority is preserved;
15. numbered U+2013 en-dash estate-entry grammar is preserved;
16. surname-first comma identity is required;
17. representative text is capped at `500`;
18. notice page size is exactly `25`;
19. no returned full OCR text or text preview;
20. no OPA/property lookup;
21. no persistence;
22. no county-data mutation;
23. no ARV, repair-scope, MAO, or offer authority;
24. no live OCR or other production side effect occurs during offline validation.

## Required later gates

After this design is certified:

1. implement the Blob-only certified oversize publication analysis offline;
2. create deterministic behavior validation;
3. integrate runtime accounting while preserving historical reconciliation at
   `147`;
4. run PR CI;
5. merge and certify post-merge CI;
6. deploy the analysis source through a separate source-only gate;
7. design and implement a separate zero-side-effect readiness probe if needed;
8. design a separate exact one-GET production orchestration;
9. execute a bounded analysis rollout before any OPA/property reconciliation;
10. separately design OPA/property reconciliation;
11. separately authorize persistence;
12. keep probate outside unattended scheduler authority until its own rollout
    is certified.

This contract authorizes design only.
