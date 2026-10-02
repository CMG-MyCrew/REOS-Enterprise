# Philadelphia Probate PB1 — Certified Oversize Publication Analysis Readiness Probe Contract v1

## Status

Design contract only.

This contract does not authorize readiness-probe implementation, production
execution, PB1 analysis, transport, OCR, parsing, persistence, or acquisition
authority.

## Certified production prerequisite

The certified PB1 oversize publication-analysis runtime is already deployed in
production as Apps Script version `140`.

The readiness probe MUST NOT inspect Apps Script deployment or version state.

Deployment/version certification is an external gate prerequisite.

## Runtime under inspection

The readiness target is:

`REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysis`

The target runtime version is exactly:

`analysisVersion: 1`

The readiness probe may inspect only already-loaded JavaScript state.

## Future readiness runtime

Future runtime:

`build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe.js`

Future behavior validator:

`scripts/validate-philadelphia-probate-certified-oversize-publication-analysis-readiness-probe-v1.js`

The future implementation may expose exactly one zero-argument RPC:

`reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe()`

No other production RPC is authorized by this contract.

## Exact metadata that readiness must verify

The readiness probe must verify all of the following loaded analysis metadata:

- `analysisVersion` is exactly `1`;
- `expectedPublicationDate` is exactly `2026-09-30`;
- `expectedPdfBytes` is exactly `4220387`;
- `expectedPdfSha256` is exactly
  `90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`;
- `maxPdfBytes` is exactly `26214400`;
- `currentNormalExtractionLimit` is exactly `250000`;
- `certifiedOversizeTextLimit` is exactly `600000`;
- `expectedTextCharacterCount` is exactly `566435`;
- `expectedTextSha256` is exactly
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`;
- `noticePageSize` is exactly `25`;
- `representativeTextLimit` is exactly `500`;
- `cursorDomain` is exactly `PHL-PROBATE-PB1-V1`;
- `analyze` exists and is a function.

Any missing or mismatched metadata must fail closed.

## Analyze identity inspection only

The readiness probe may type-check:

`analysis.analyze`

The readiness probe MUST NOT invoke `analysis.analyze`.

The readiness probe MUST NOT pass a Blob, notice offset, or any other input to
the analysis function.

A successful readiness probe proves only that the expected runtime surface is
loaded with the expected metadata and function identity.

A successful readiness probe does not prove that PDF validation, Drive
conversion, OCR, text hashing, Estate Notices parsing, cleanup, or notice
pagination will succeed in a live analysis invocation.

## Zero Apps Script service references

The readiness-probe implementation MUST NOT reference or invoke any of:

- `UrlFetchApp`;
- `Utilities`;
- `Drive.Files`;
- `DriveApp`;
- `DocumentApp`;
- `PropertiesService`;
- `ScriptApp`;
- `SpreadsheetApp`;
- `LockService`;
- `CalendarApp`;
- `GmailApp`.

No Apps Script service is required to establish runtime-surface readiness.

## No deployment inspection

The readiness probe MUST NOT inspect:

- Apps Script deployment IDs;
- Apps Script versions;
- Apps Script project metadata;
- Script process/execution history;
- trigger inventory.

The external rollout gate must establish production version authority before
the readiness RPC is authorized.

## No transport authority

The readiness probe MUST NOT perform:

- HTTP;
- PDF fetch;
- redirect handling;
- source discovery;
- recurring-source discovery;
- alternate-source lookup;
- fallback-source lookup.

The readiness probe receives no Blob and has zero transport authority.

## No OCR or temporary artifact authority

The readiness probe MUST NOT perform:

- Drive document creation;
- OCR;
- document open;
- document body text read;
- temporary artifact creation;
- temporary artifact cleanup.

The readiness probe must not call any component that performs those actions.

## No probate parsing

The readiness probe MUST NOT parse Estate Notices.

It MUST NOT:

- search for `ESTATE NOTICES`;
- search for `ORPHANS' COURT DIVISION`;
- parse numbered entries;
- normalize decedent identities;
- build representative text;
- select a 25-notice page.

The readiness probe may inspect only the primitive metadata that declares the
expected parser/runtime boundaries.

## No OPA/property authority

The readiness probe MUST NOT:

- query Philadelphia OPA;
- call `CountyAdapters.Registry.fetch`;
- reconcile probate names to properties;
- create property observations;
- create or normalize county leads.

## No persistence

The readiness probe MUST NOT:

- write Sheets;
- write Drive;
- write PropertiesService;
- write a database;
- mutate source records;
- persist notices;
- persist cursors;
- persist checkpoints.

## No scheduler authority

The readiness probe MUST NOT inspect or mutate:

- scheduler state;
- trigger state;
- checkpoint state;
- county mutation leases.

A readiness success does not add probate to unattended scheduler authority.

## Deterministic success result

A successful readiness RPC must return deterministic metadata only.

The success result must include:

- `ok: true`;
- `probeVersion: 1`;
- `runtimeLoaded: true`;
- `runtimeSurfaceReady: true`;
- `analysisPresent: true`;
- `analysisVersion: 1`;
- `expectedPublicationDate: "2026-09-30"`;
- `expectedPdfBytes: 4220387`;
- `expectedPdfSha256` equal to the certified PDF SHA-256;
- `maxPdfBytes: 26214400`;
- `currentNormalExtractionLimit: 250000`;
- `certifiedOversizeTextLimit: 600000`;
- `expectedTextCharacterCount: 566435`;
- `expectedTextSha256` equal to the certified OCR-text SHA-256;
- `noticePageSize: 25`;
- `representativeTextLimit: 500`;
- `cursorDomain: "PHL-PROBATE-PB1-V1"`;
- `analyzePresent: true`;
- `analysisExecuted: false`.

The result must also explicitly report the following as false:

- `deploymentInspectionExecuted`;
- `externalHttpExecuted`;
- `pdfFetchExecuted`;
- `sourceDiscoveryExecuted`;
- `driveCreateExecuted`;
- `documentOpenExecuted`;
- `driveCleanupExecuted`;
- `temporaryArtifactCreated`;
- `probateParsingExecuted`;
- `opaLookupExecuted`;
- `propertyReconciliationExecuted`;
- `leadCreationExecuted`;
- `persistenceExecuted`;
- `configurationExecuted`;
- `schedulerInspectionExecuted`;
- `schedulerMutationExecuted`;
- `triggerMutationExecuted`;
- `checkpointMutationExecuted`;
- `countyDataMutationExecuted`;
- `arvAuthorityGranted`;
- `repairScopeAuthorityGranted`;
- `maoAuthorityGranted`;
- `offerAuthorityGranted`.

The success result MUST NOT contain:

- Blob data;
- PDF bytes;
- OCR text;
- text preview;
- notice candidates;
- a Drive document ID;
- a temporary document ID;
- deployment metadata.

## Normal extraction boundary remains unchanged

The readiness probe MUST preserve:

`currentNormalExtractionLimit: 250000`

Readiness success does not change, bypass, reinterpret, or raise that limit.

The PB1-specific oversize limit remains exactly:

`600000`

Readiness success does not itself authorize oversize analysis execution.

## Exact recovered text identity remains evidence only

The readiness probe verifies expected metadata values:

- expected text character count `566435`;
- expected text SHA-256
  `31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3`.

It does not re-create or independently verify OCR text.

Only a separately authorized analysis execution can establish live OCR output.

## Acquisition safety boundary

Readiness success grants no authority for:

- OPA/property reconciliation;
- lead persistence;
- Qualified Deal Queue entry;
- acquisition lifecycle advancement;
- ARV calculation;
- repair-scope calculation;
- MAO calculation;
- offer generation;
- offer submission.

No automatic MAO or offer authority may arise from readiness success.

## Required offline implementation validation

Before readiness implementation can be certified, deterministic validation must
prove at least:

1. exactly one public readiness RPC exists;
2. the public readiness RPC accepts zero arguments;
3. the runtime contains zero Apps Script service references;
4. the runtime performs zero deployment/version inspection;
5. the runtime locates the analysis object only from already-loaded JavaScript;
6. all exact metadata fields are validated;
7. `analysis.analyze` is type-checked;
8. `analysis.analyze` is never invoked;
9. throwing analysis mocks confirm zero invocation;
10. missing runtime fails closed;
11. each wrong metadata value fails closed;
12. wrong/missing analyze identity fails closed;
13. success returns deterministic metadata only;
14. no Blob/PDF/OCR text/notice candidate is returned;
15. all side-effect flags remain false;
16. no live Apps Script side effect occurs during offline validation;
17. no OPA/property authority exists;
18. no persistence authority exists;
19. no scheduler authority exists;
20. no ARV, repair-scope, MAO, or offer authority exists.

## Future accounting boundary

This design gate does not modify central accounting.

Current certified accounting remains:

- post-county production files: `61`;
- component validators: `90`;
- historical reconciled production inventory: `147`.

A later implementation/accounting gate may add exactly:

- one readiness runtime;
- one readiness behavior validator.

If that later accounting gate is authorized, the expected moving inventories
become:

- post-county production files: `62`;
- component validators: `91`;
- historical reconciled production inventory remains `147`.

The historical `147` inventory MUST NOT be increased by this post-county
readiness addition.

## Required later gates

After this design contract is certified:

1. implement the readiness probe offline;
2. implement deterministic zero-side-effect behavior validation;
3. integrate accounting to `62 / 91 / 147`;
4. run PR CI;
5. merge and certify post-merge CI;
6. source-deploy the readiness probe through a separate version/deployment gate;
7. separately authorize exactly one zero-side-effect production readiness RPC;
8. only after readiness success, design the production transport/orchestration
   required to supply a certified PDF Blob to the analysis runtime;
9. keep OPA/property reconciliation, persistence, scheduler authority, ARV,
   repair scope, MAO, and offers behind separate gates.

This contract authorizes design only.
