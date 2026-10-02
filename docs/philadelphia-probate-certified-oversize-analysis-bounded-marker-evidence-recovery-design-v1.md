# Philadelphia Probate PB1 — Bounded Marker Evidence Recovery Design v1

## Status

Design contract only.

This contract does not authorize implementation, deployment, OCR execution,
HTTP execution, production RPC execution, parser modification, or retry of the
failed PB1 production transport invocation.

## Incident authority

The certified PB1 production transport was deployed as immutable Apps Script
version `142`.

Exactly one initial production RPC was attempted with:

- function:
  `reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport`;
- notice offset: numeric `0`;
- `devMode=false`;
- scripts.run POST count: exactly `1`;
- retry count: exactly `0`.

The execution API returned HTTP `200` with a completed operation containing a
`USER_ERROR`.

The exact script error was:

`Error: PB1 certified oversize Estate Notices marker was not found.`

The certified stack was:

1. `parseEstateNotices_`;
2. `analyze`;
3. `execute_`;
4. `reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport`.

No second production RPC is authorized by this design.

## Certified source identity

The exact PB1 publication remains:

- publication date: `2026-09-30`;
- PDF byte length: `4220387`;
- PDF SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`;
- recovered OCR character count: `566435`;
- recovered OCR SHA-256:
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

The failed live analysis reached `parseEstateNotices_` only after
`assertRecoveredTextIdentity_(text)` completed.

Therefore the parser failure occurred against the exact certified recovered OCR
text identity.

A different OCR count or SHA-256 must fail closed.

## Root cause boundary

The current parser requires the marker pattern:

`/ESTATE[\s]+NOTICES[\s]+ORPHANS'?[\s]+COURT[\s]+DIVISION/i`

The live exact OCR text did not satisfy that pattern.

No exact full-text copy of the certified OCR result is currently preserved in
the REOS certification evidence searched during diagnosis.

Therefore changing or broadening the production parser marker now would be
guesswork and is not authorized.

## Offline validator coverage gap

The existing certified analysis behavior validator constructs synthetic OCR
text containing the idealized lines:

`ESTATE NOTICES`

and:

`ORPHANS' COURT DIVISION`

Its mocked text-digest surface can return the certified OCR SHA-256 for that
synthetic fixture.

Accordingly the validator certifies parser mechanics against the synthetic
fixture, but does not prove that the real certified OCR text contains that exact
heading representation.

Future validation must not claim real-OCR marker compatibility merely because a
synthetic fixture is paired with the certified digest constant.

## Diagnostic objective

The next implementation may recover only enough bounded evidence from a fresh
OCR of the exact certified PDF to determine how the Estate Notices heading is
represented in the exact recovered text.

It is evidence recovery only.

It grants no probate parsing authority.

It grants no parser-repair authority.

It grants no lead, persistence, county, acquisition, ARV, repair-scope, MAO, or
offer authority.

## Future Blob-only diagnostic component

Future runtime:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.js`

Future behavior validator:

`scripts/validate-philadelphia-probate-certified-oversize-marker-evidence-recovery-v1.js`

The component accepts exactly one already-authorized PDF Blob.

It accepts no caller-selected:

- search token;
- regular expression;
- context radius;
- context count;
- text limit;
- OCR option;
- source URL;
- parser grammar.

The component exposes no public production RPC.

## Exact PDF identity before Drive mutation

Before the first Drive mutation the future component must require:

- Blob exists;
- byte length exactly `4220387`;
- byte length no greater than `26214400`;
- `%PDF-` signature;
- SHA-256 exactly
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

No Drive artifact may be created before these checks pass.

## One OCR lifecycle maximum

The future diagnostic may perform at most:

- one `Drive.Files.create`;
- one `DocumentApp.openById`;
- one body `.getText()`;
- one cleanup attempt against the exact created document.

It must not search Drive for prior OCR artifacts.

It must not reuse the v142 failed-attempt artifact.

It must not list Drive files.

Cleanup is mandatory and fail-closed.

No evidence result may return unless cleanup is confirmed.

## Exact recovered-text identity before marker evidence

After OCR and before extracting marker evidence, the component must prove:

- text length is exactly `566435`;
- text length is greater than the normal `250000` limit;
- text length is no greater than the dedicated `600000` oversize ceiling;
- complete text SHA-256 is exactly
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

A changed OCR result must fail closed.

This diagnostic does not create a new OCR baseline.

## Fixed marker locator family

The diagnostic may search only a fixed, source-defined locator family intended
to find heading evidence.

The initial fixed labels are:

- `ESTATE`;
- `NOTICE`;
- `ORPHAN`;
- `COURT`;
- `DIVISION`.

The implementation may use conservative OCR-tolerant locator expressions for
these labels, including optional whitespace between letters, solely to locate a
bounded evidence window.

Locator expressions are not probate parsing grammar.

They must not classify an estate notice.

They must not establish that a marker is valid.

They only select bounded context for human/offline repair analysis.

## Bounded context authority

Maximum evidence output:

- maximum contexts: `8`;
- maximum characters per context: `800`;
- maximum aggregate returned context characters: `6400`.

Contexts must be selected deterministically.

Overlapping windows should be merged or deduplicated before return.

Each context may contain only:

- locator label or labels that caused selection;
- zero-based start character offset;
- zero-based end character offset;
- bounded raw OCR context string;
- context character count;
- SHA-256 of that bounded context.

The complete OCR text must never leave the function.

No arbitrary caller-selected slice is authorized.

No unbounded prefix, suffix, page, or publication dump is authorized.

## No full-text or document identity output

The result must not return:

- complete OCR text;
- generic text preview;
- PDF bytes;
- Blob;
- Drive document ID;
- temporary document ID;
- Drive URL;
- file metadata that identifies the temporary artifact.

The result may return the exact certified text count and SHA-256 as evidence
metadata.

## No probate parsing

The bounded marker evidence component must not invoke:

- `parseEstateNotices_`;
- production probate parsing;
- notice anchor parsing;
- representative-role parsing;
- name normalization for estate candidates.

It must not return parsed notices.

It must not return decedent candidate records.

The diagnostic output exists only to establish what exact heading characters
the certified OCR produced.

## Future bounded production transport

A later separately authorized transport may be implemented as:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport.js`

Potential future RPC:

`reosPhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport`

That future transport must have zero parameters.

It may perform exactly:

1. one GET to the already-certified pinned PB1 PDF URL;
2. redirects disabled;
3. no retry;
4. no fallback;
5. exact PDF byte-length/signature/SHA validation;
6. one invocation of the Blob-only marker-evidence component.

That future transport is not authorized by this design gate.

## Failed v142 production invocation remains consumed

The original v142 initial transport invocation remains:

- attempt count: `1`;
- scripts.run POST count: `1`;
- retry count: `0`.

The future marker-evidence diagnostic, if eventually authorized, is a distinct
diagnostic RPC with distinct evidence and must never be represented as a retry
of the failed v142 transport invocation.

## Offline validation requirements

Before implementation may proceed toward deployment, deterministic validation
must prove at least:

1. zero HTTP call sites in the Blob-only diagnostic component;
2. exact PDF identity before Drive mutation;
3. one Drive create maximum;
4. one document open maximum;
5. one body text read maximum;
6. one exact-artifact cleanup site;
7. cleanup failure fails closed;
8. no prior Drive artifact search;
9. exact OCR count requirement `566435`;
10. exact OCR SHA-256 requirement;
11. normal extraction limit remains `250000`;
12. diagnostic oversize ceiling remains `600000`;
13. marker evidence occurs only after exact OCR identity validation;
14. locator family is fixed in source;
15. caller cannot supply tokens or regular expressions;
16. maximum context count is exactly `8`;
17. maximum context length is exactly `800`;
18. aggregate context ceiling is exactly `6400`;
19. contexts are deterministic and bounded;
20. no returned full OCR text;
21. no generic text preview;
22. no PDF bytes;
23. no temporary document ID;
24. no probate parser invocation;
25. no notice parsing;
26. no OPA lookup;
27. no property reconciliation;
28. no lead creation;
29. no persistence;
30. no scheduler, trigger, checkpoint, cursor, or county-data mutation;
31. no ARV, repair-scope, MAO, or offer authority;
32. offline synthetic fixture tests are explicitly described as mechanical
    tests and do not claim compatibility with the real certified OCR marker;
33. no live HTTP, OCR, Drive, or DocumentApp side effect occurs during offline
    validation.

## Required staged gates

After this design is merged, the intended sequence is:

1. implement the Blob-only bounded marker-evidence component offline;
2. add deterministic behavior validation;
3. register the component in current runtime accounting if required;
4. run PR CI;
5. merge and certify post-merge CI;
6. separately design and certify one-GET diagnostic production transport;
7. deploy source through a source-only gate;
8. create an immutable version through a separate gate;
9. update the intended diagnostic deployment through a separate gate;
10. run a read-only diagnostic RPC preflight;
11. execute exactly one bounded marker-evidence diagnostic RPC;
12. preserve the bounded marker contexts as certification evidence;
13. design the parser repair from that exact evidence;
14. validate the parser repair offline;
15. deploy a new immutable production analysis/transport version;
16. only then authorize a new bounded production analysis execution.

The failed v142 production RPC must never be retried as part of these gates.

## Acquisition safety boundary

This diagnostic grants no authority for:

- OPA lookup;
- property reconciliation;
- DISTRESS_LEADS persistence;
- Qualified Deal Queue entry;
- acquisition lifecycle advancement;
- ARV calculation;
- repair-scope calculation;
- MAO calculation;
- offer generation;
- offer submission.

Automatic MAO or offer authority remains prohibited without independent
comp-supported ARV and adequate repair-scope evidence.

## Design authorization

This document authorizes design only.

It does not authorize:

- implementation;
- source deployment;
- version creation;
- deployment update;
- HTTP execution;
- OCR execution;
- production RPC execution;
- parser repair;
- persistence;
- acquisition automation.
