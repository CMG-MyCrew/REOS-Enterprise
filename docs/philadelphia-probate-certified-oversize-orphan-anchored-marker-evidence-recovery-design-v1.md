# Philadelphia Probate PB1 — Orphan-Anchored Marker-Evidence Recovery Design v1

## Status

Design contract only.

This document authorizes no production runtime implementation, source
deployment, Apps Script version creation, deployment update, HTTP execution,
OCR execution, Drive mutation, DocumentApp execution, production RPC execution,
parser modification, parser repair, persistence, county-data mutation, or
acquisition automation.

The successor described here is a new Blob-only diagnostic component.

It MUST NOT modify the already-certified v143 marker-evidence component or its
already-certified production transport.

## Repository authority

This design is based on the certified REOS main authority:

- main SHA:
  `866c0ee94c8f6f6bcaa91e743df525383692dcfa`;
- main tree:
  `30a94af37323d745ceb02efa18cbf234100c6d5d`;
- current post-county production file count: `65`;
- current component validator count: `94`;
- current reconciled production inventory count: `147`.

This design gate MUST NOT change any of those accounting counts.

Any later implementation/accounting transition requires a separate explicit
gate.

This design authorizes no runtime-accounting transition.

## Production evidence authority

The exact certified PB1 publication remains:

- publication date: `2026-09-30`;
- PDF byte length: `4220387`;
- PDF SHA-256:
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`;
- exact recovered OCR character count: `566435`;
- exact recovered OCR SHA-256:
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

The corrected-caller v143 diagnostic established:

- HTTP fetch count: exactly `1`;
- HTTP status: `200`;
- exact PDF identity: confirmed;
- exact same-response Blob handoff: confirmed;
- marker-recovery invocation count: exactly `1`;
- Drive create count: exactly `1`;
- Document open count: exactly `1`;
- text read count: exactly `1`;
- temporary-artifact cleanup: confirmed;
- probate parsing executed: `false`;
- parser repair executed: `false`;
- persistence executed: `false`;
- county-data mutation executed: `false`.

The exact OCR pipeline is therefore proven for this publication.

This design does not create a new OCR baseline.

## Consumed production invocation authority

The failed v142 publication-analysis invocation remains consumed:

- v142 production-analysis RPC attempt count: `1`;
- v142 retry count: `0`.

It MUST NOT be retried.

Version 143 diagnostic history is also fixed:

1. one initial v143 call used the wrong/default clasp OAuth profile and was
   rejected with `NOT_AUTHORIZED` before a script result was returned;
2. one corrected-caller v143 call using `reos-runtime` succeeded.

Total v143 production RPC attempt count is `2`.

A third v143 RPC is not authorized.

Any later live orphan-anchored diagnostic must use separately implemented,
validated, versioned, deployed, preflight-certified successor authority.

It MUST NOT be represented as a retry of v142 or as a third v143 invocation.

## Certified v1 context-analysis finding

The certified v1 marker-evidence result returned exactly:

- context count: `8`;
- characters per context: `800`;
- aggregate context characters: `6400`;
- returned OCR offsets: `0` through `6400` exclusive.

The full exact OCR contains `566435` characters.

The v1 contexts therefore represented only the opening portion of the full OCR.

The certified context labels were:

1. `NOTICE,COURT`;
2. `ESTATE,COURT`;
3. `COURT`;
4. `COURT`;
5. `COURT`;
6. `COURT,DIVISION`;
7. `COURT,DIVISION`;
8. `ESTATE,NOTICE,COURT,DIVISION`.

No returned context contained the `ORPHAN` label.

No returned context contained the complete fixed locator family:

- `ESTATE`;
- `NOTICE`;
- `ORPHAN`;
- `COURT`;
- `DIVISION`.

The certified classification is:

`V1_FRONT_MATTER_LOCATOR_STARVATION`

The v1 component is not classified as an OCR/runtime defect.

The evidence-selection policy is insufficient for the current diagnostic goal
because globally source-ordered generic `COURT` hits exhausted the eight-context
budget before an `ORPHAN`-anchored context was returned.

This finding does not prove a probate-parser defect.

It does not establish the exact probate marker form.

Parser repair remains unauthorized.

## Diagnostic objective

The successor component exists only to recover bounded evidence centered on
`ORPHAN` locator hits from the exact certified OCR text.

The purpose is to determine how text near occurrences of `ORPHAN` is
represented in the certified OCR.

The successor remains evidence recovery only.

It MUST NOT parse probate notices.

It MUST NOT determine that any returned text is a valid probate marker.

It MUST NOT classify an estate notice.

It MUST NOT authorize parser repair.

## Future Blob-only successor component

Future runtime:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.js`

Future deterministic behavior validator:

`scripts/validate-philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-v1.js`

The future component accepts exactly one already-authorized PDF Blob.

It has no public RPC.

It accepts no caller-selected:

- URL;
- search token;
- anchor token;
- regular expression;
- context radius;
- context count;
- text offset;
- text range;
- OCR option;
- parser grammar;
- ranking weight;
- fallback strategy.

The component has no HTTP authority.

## Exact PDF identity before Drive mutation

Before the first Drive mutation the future component must require:

- a PDF Blob exists;
- byte length exactly `4220387`;
- byte length no greater than `26214400`;
- `%PDF-` signature;
- SHA-256 exactly
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`.

No Drive artifact may be created before exact PDF identity is established.

## One OCR lifecycle maximum

The future component may perform at most:

- one `Drive.Files.create`;
- one `DocumentApp.openById`;
- one body `.getText()`;
- one cleanup attempt against the exact created artifact.

No Drive search is authorized.

No Drive listing is authorized.

No reuse of a prior OCR artifact is authorized.

Cleanup is mandatory and fail-closed.

No success result may return unless temporary-artifact cleanup is confirmed.

## Exact recovered OCR identity before evidence selection

Before any locator search or evidence-window selection the component must prove:

- recovered text length exactly `566435`;
- text length greater than normal extraction limit `250000`;
- text length no greater than certified oversize ceiling `600000`;
- complete recovered-text SHA-256 exactly
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

A changed OCR result must fail closed.

The complete OCR text must never leave the function.

## Fixed locator family

The fixed source-defined labels remain exactly:

- `ESTATE`;
- `NOTICE`;
- `ORPHAN`;
- `COURT`;
- `DIVISION`.

Conservative locator-only OCR tolerance may include optional whitespace between
letters.

Locator expressions are evidence locators only.

They are not probate parsing grammar.

The successor MUST NOT contain or invoke the production parser marker grammar:

`/ESTATE[\s]+NOTICES[\s]+ORPHANS'?[\s]+COURT[\s]+DIVISION/i`

## ORPHAN is the required primary anchor

`ORPHAN` is the only label permitted to allocate a candidate evidence window.

The implementation must scan the complete exact recovered OCR text for all
fixed `ORPHAN` locator hits before applying the maximum returned-context count.

Generic `ESTATE`, `NOTICE`, `COURT`, or `DIVISION` hits MUST NOT independently
allocate evidence windows.

Every returned context MUST include `ORPHAN` in its `locatorLabels`.

If the exact certified OCR produces zero fixed `ORPHAN` hits, the successor
must fail closed with no generic fallback.

There is no fallback to `COURT`.

There is no fallback to `NOTICE`.

There is no fallback to `ESTATE`.

There is no caller-selected fallback.

## Fixed bounded candidate windows

For each fixed `ORPHAN` hit, the implementation may create one deterministic
candidate window with a maximum size of `800` characters.

The window must be centered on the midpoint of the matched `ORPHAN` evidence
where possible and clamped only at the start or end of the exact OCR text.

Each candidate window may report which of the five fixed locator labels occur
inside that same bounded window.

Co-presence of labels in a candidate window is evidence metadata only.

Co-presence does not establish marker validity.

No required phrase, adjacency, ordering, punctuation, apostrophe, plural form,
or parser grammar may be inferred by the evidence selector.

## Deterministic orphan-window ranking

The successor must discover all fixed `ORPHAN` hits before selecting the
maximum returned contexts.

Candidate ranking is deterministic and evidence-only.

Candidates containing both `COURT` and `DIVISION` are ranked before candidates
that do not contain both labels.

Within that partition, candidates containing `NOTICE` are ranked before
candidates without `NOTICE`.

Within that partition, candidates containing `ESTATE` are ranked before
candidates without `ESTATE`.

Remaining ties are ranked by:

1. greater number of distinct fixed locator labels in the same bounded window;
2. lower `ORPHAN` anchor source offset.

This ranking does not validate a probate heading.

It only prevents generic front-matter locator hits from consuming the evidence
budget before `ORPHAN`-anchored evidence is examined.

## Deterministic deduplication and selection

Exact duplicate candidate windows must be deduplicated before ranking.

After ranking, candidate windows are selected greedily up to the fixed maximum
context count.

A lower-ranked candidate that overlaps an already-selected higher-ranked
candidate must be skipped.

Maximum selected contexts: `8`.

After selection, returned contexts must be ordered by ascending start offset.

Every selected context remains independently bounded to no more than `800`
characters.

Maximum aggregate returned context characters: `6400`.

The selector must never expand a context in order to merge overlapping
candidates.

## Context schema

Each returned context may contain only:

- `locatorLabels`;
- `startOffset`;
- `endOffset`;
- `rawOcrContext`;
- `contextCharacterCount`;
- `contextSha256`.

Every context must:

- contain at least one fixed `ORPHAN` locator hit;
- include `ORPHAN` in `locatorLabels`;
- have zero-based start offset;
- have zero-based exclusive end offset;
- contain no more than `800` characters;
- have a SHA-256 matching its exact bounded context string.

The complete OCR must not be returned.

## Maximum output authority

Maximum contexts: `8`.

Maximum characters per context: `800`.

Maximum aggregate returned context characters: `6400`.

The result must not return:

- full OCR text;
- generic OCR preview;
- arbitrary OCR prefix;
- arbitrary OCR suffix;
- caller-selected text;
- PDF bytes;
- Blob;
- temporary document ID;
- Drive URL;
- temporary-artifact metadata identifying the created document;
- parsed estate notices;
- decedent candidates.

## No parser authority

The successor component must not invoke:

- `parseEstateNotices_`;
- production probate analysis;
- notice parsing;
- representative parsing;
- decedent normalization;
- parser repair.

It must not return parsed probate records.

The existence of an `ORPHAN`-anchored context does not authorize a parser
change.

Parser repair requires a later human/offline analysis of the exact bounded
evidence.

## No production transport authority

This design does not authorize a successor production transport.

A later separately authorized design may define a one-GET transport around the
new Blob-only orphan-anchored component.

That future transport must use a new separately certified immutable Apps Script
version before any live diagnostic execution.

A third v143 RPC remains prohibited.

## No operational side authority

The successor has no authority for:

- source discovery;
- property lookup;
- OPA lookup;
- property reconciliation;
- lead creation;
- DISTRESS_LEADS mutation;
- Qualified Deal Queue mutation;
- acquisition lifecycle advancement;
- persistence;
- scheduler inspection;
- scheduler execution;
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

1. the component accepts exactly one PDF Blob;
2. the component exposes no public production RPC;
3. HTTP call-site count is zero;
4. exact PDF identity is required before Drive mutation;
5. Drive create count is at most one;
6. document open count is at most one;
7. body text-read count is at most one;
8. cleanup is against the exact created artifact;
9. cleanup failure fails closed;
10. exact recovered OCR identity is required before locator search;
11. OCR character count remains exactly `566435`;
12. OCR SHA-256 remains exactly
    `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`;
13. fixed locator family count remains exactly `5`;
14. `ORPHAN` is the only primary candidate-window anchor;
15. the complete exact OCR is scanned for all fixed `ORPHAN` hits before
    context-count limiting;
16. generic `ESTATE`, `NOTICE`, `COURT`, and `DIVISION` hits cannot directly
    allocate a candidate window;
17. zero `ORPHAN` hits fail closed with no fallback;
18. candidate windows contain at most `800` characters;
19. ranking prefers `COURT` plus `DIVISION` co-presence;
20. ranking next prefers `NOTICE`;
21. ranking next prefers `ESTATE`;
22. ranking tie-breaks by distinct fixed-label count and then source offset;
23. exact duplicate windows are deduplicated;
24. overlapping lower-ranked candidates are skipped rather than expanded;
25. selected context count is at most `8`;
26. selected aggregate context characters are at most `6400`;
27. every returned context contains `ORPHAN`;
28. returned contexts are ordered by ascending source offset;
29. context field set is fixed;
30. context SHA-256 is exact;
31. full OCR text is not returned;
32. generic preview is not returned;
33. arbitrary text slices are not returned;
34. PDF bytes are not returned;
35. temporary document identity is not returned;
36. probate parser invocation count is zero;
37. parser-repair invocation count is zero;
38. property and OPA lookup count is zero;
39. lead creation and persistence count is zero;
40. scheduler/trigger/checkpoint/cursor mutation count is zero;
41. county-data mutation count is zero;
42. ARV, repair-scope, MAO, and offer authority remain false;
43. offline validation performs no live HTTP;
44. offline validation performs no live OCR, Drive, or DocumentApp mutation.

Synthetic fixtures certify selection mechanics only.

Synthetic fixtures MUST NOT be represented as proof of the real probate marker
form.

## Required staged gates

After this design is merged and post-merge CI-certified, the intended sequence
is:

1. separately authorize offline implementation of the new Blob-only
   orphan-anchored component;
2. implement the component and deterministic behavior validator;
3. separately reconcile any required runtime/component accounting transition;
4. explicitly register implementation validation in CI;
5. run PR CI;
6. merge and certify post-merge CI;
7. separately design a successor one-GET production transport;
8. implement and certify that transport offline;
9. deploy source only through a separate deployment gate;
10. create a new immutable Apps Script version;
11. update the intended diagnostic deployment through a separate gate;
12. run a corrected-caller production RPC preflight;
13. execute at most one separately authorized successor diagnostic RPC;
14. preserve only bounded `ORPHAN`-anchored contexts;
15. analyze those exact contexts offline;
16. only then determine whether parser repair is justified;
17. design and validate any parser repair separately.

No third v143 production RPC is authorized.

## Acquisition safety boundary

No automatic MAO or offer authority may arise from this design or future
diagnostic evidence.

Automatic MAO or offer authority remains prohibited unless independent
comp-supported ARV and adequate repair-scope evidence are both present.

## Design authorization

This document authorizes design only.

It does not authorize:

- runtime implementation;
- behavior-validator implementation;
- runtime accounting modification;
- production transport implementation;
- public RPC implementation;
- source deployment;
- Apps Script version creation;
- deployment update;
- HTTP execution;
- OCR execution;
- Drive mutation;
- DocumentApp execution;
- production RPC execution;
- parser repair;
- persistence;
- acquisition automation.
