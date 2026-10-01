# Philadelphia Probate PB1 — Production Extraction Readiness Probe Contract v1

## Status

Design contract only.

This contract does not authorize implementation.

This contract does not authorize production execution.

This contract does not authorize HTTP, PDF transport, Drive conversion, OCR,
or temporary-artifact creation.

## Purpose

Define a zero-side-effect production diagnostic that proves only that the
already-deployed Philadelphia probate production-extraction orchestration and
bounded text-extraction JavaScript surfaces are loaded with the expected pinned
metadata.

Success means only that the deployed JavaScript surfaces and pinned metadata
are loaded.

Success does not authorize or prove live HTTP transport, PDF availability,
Drive conversion, OCR, or cleanup.

The probe is a runtime-surface diagnostic, not a transport test and not an OCR
test.

## Production precondition

Before the future readiness probe may be executed in production, external
deployment certification must independently establish that the existing
production deployment is exactly version `136`.

The probe itself MUST NOT inspect Apps Script deployment versions.

The probe MUST NOT use `ScriptApp`.

The probe MUST NOT use deployment APIs.

## Future public RPC

The future implementation may expose exactly one zero-argument RPC:

`reosPhiladelphiaProbateProductionExtractionReadinessProbe()`

No caller-provided URL, source identity, PDF identity, extraction parameter, or
execution option is authorized.

## Required orchestration observations

The probe may inspect only already-loaded in-memory JavaScript state.

It must verify:

1. `REOS` exists.
2. `REOS.PhiladelphiaProbateProductionExtractionOrchestration` exists.
3. orchestration version equals `1`.
4. publication date equals `2026-09-30`.
5. source URL equals the exact certified URL.
6. source URL SHA-256 metadata equals the certified URL SHA-256.
7. source basename equals `tlipn093026.pdf`.
8. expected PDF byte length equals `4220387`.
9. expected PDF SHA-256 metadata equals the certified PDF SHA-256.
10. maximum PDF bytes equals `26214400`.
11. maximum extracted-text characters equals `250000`.
12. orchestration `execute` exists as a function.
13. orchestration `execute` MUST NOT be invoked.
14. global `reosPhiladelphiaProbateProductionExtractionOrchestration` exists
    as a function.
15. the global production orchestration RPC MUST NOT be invoked.

Certified source URL:

`https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`

Certified source URL SHA-256:

`98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`

Certified PDF SHA-256:

`90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`

## Required bounded-extractor observations

The probe must verify:

1. `REOS.PhiladelphiaProbateBoundedTextExtraction` exists.
2. extraction version equals `1`.
3. expected PDF byte length equals `4220387`.
4. expected PDF SHA-256 equals the certified PDF SHA-256.
5. maximum PDF bytes equals `26214400`.
6. maximum extracted-text characters equals `250000`.
7. extractor `extract` exists as a function.
8. extractor `extract` MUST NOT be invoked.

## Required result

The future readiness probe must return deterministic diagnostic metadata.

A successful result must explicitly contain:

- `ok: true`
- `probeVersion: 1`
- `runtimeLoaded: true`
- `runtimeSurfaceReady: true`
- `orchestrationPresent: true`
- `orchestrationVersion: 1`
- `publicationDate: "2026-09-30"`
- the exact source URL
- the exact source URL SHA-256
- `sourceBasename: "tlipn093026.pdf"`
- `expectedPdfBytes: 4220387`
- the exact expected PDF SHA-256
- `maxPdfBytes: 26214400`
- `maxExtractedTextCharacters: 250000`
- `orchestrationExecutePresent: true`
- `productionOrchestrationRpcPresent: true`
- `orchestrationExecuted: false`
- `extractionComponentPresent: true`
- `extractionVersion: 1`
- `extractPresent: true`
- `extractionExecuted: false`
- `deploymentInspectionExecuted: false`
- `externalHttpExecuted: false`
- `pdfFetchExecuted: false`
- `sourceDiscoveryExecuted: false`
- `driveCreateExecuted: false`
- `documentOpenExecuted: false`
- `driveCleanupExecuted: false`
- `temporaryArtifactCreated: false`
- `connectorFetchExecuted: false`
- `connectorRegistrationExecuted: false`
- `productionDataReadExecuted: false`
- `probateParsingExecuted: false`
- `leadCreationExecuted: false`
- `persistenceExecuted: false`
- `configurationExecuted: false`
- `schedulerInspectionExecuted: false`
- `schedulerMutationExecuted: false`
- `triggerMutationExecuted: false`
- `checkpointMutationExecuted: false`
- `countyDataMutationExecuted: false`
- `arvAuthorityGranted: false`
- `repairScopeAuthorityGranted: false`
- `maoAuthorityGranted: false`
- `offerAuthorityGranted: false`

## Strict non-execution boundary

The future readiness probe MUST NOT invoke:

- `reosPhiladelphiaProbateProductionExtractionOrchestration()`
- `REOS.PhiladelphiaProbateProductionExtractionOrchestration.execute()`
- `REOS.PhiladelphiaProbateBoundedTextExtraction.extract()`
- `reosPhiladelphiaProbateBoundedPdfFetch()`
- `reosPhiladelphiaProbateBoundedSourceDiscovery()`
- `PhiladelphiaProbateRecurringSource.resolve()`
- `PAPhiladelphiaCountyConnector.fetch_()`
- `probateSourceAuthority()`
- `probateSourcePreflight_()`
- `CountyRuntimeBridge.registerConnectors()`

The probe may inspect the type or identity of these approved readiness symbols
only where explicitly required.

It may not call them.

## Prohibited service surfaces

The future readiness-probe implementation MUST NOT reference or invoke:

- `UrlFetchApp`
- `Utilities`
- `Drive`
- `Drive.Files`
- `DriveApp`
- `DocumentApp`
- `PropertiesService`
- `ScriptApp`
- `SpreadsheetApp`
- `LockService`
- `CalendarApp`
- `GmailApp`

No external service call is required to establish runtime-surface readiness.

## No production-data authority

The readiness probe MUST NOT inspect:

- spreadsheets;
- Drive files;
- Gmail;
- county-data stores;
- acquisition records;
- probate records;
- schedulers;
- triggers;
- checkpoints;
- configuration stores.

It may inspect only already-loaded JavaScript objects, primitive metadata, and
function identities.

## No transport or OCR inference

A successful readiness probe does not establish that:

- the remote PDF is currently reachable;
- the remote PDF currently has the expected bytes;
- HTTP authorization will succeed;
- Drive conversion will succeed;
- OCR will produce text;
- cleanup will succeed.

Those behaviors can only be established by a separately authorized production
orchestration invocation.

## Acquisition safety boundary

The readiness probe grants no authority for:

- probate interpretation;
- probate normalization;
- lead creation;
- persistence;
- Qualified Deal Queue activity;
- acquisition lifecycle advancement;
- ARV calculation;
- repair-scope calculation;
- MAO calculation;
- offer generation;
- offer submission.

No automatic MAO or offer authority can arise from readiness-probe success.

## Required later gates

Before the first readiness probe may be executed in production:

1. certify this design contract;
2. implement the readiness probe offline;
3. prove through deterministic mocks that no inspected function is invoked;
4. prove the readiness implementation has no service API references;
5. integrate runtime accounting while preserving historical reconciliation;
6. run CI;
7. merge;
8. certify post-merge main;
9. deploy the readiness probe through a separately authorized source-only
   deployment gate;
10. certify that deployment;
11. separately authorize exactly one zero-side-effect readiness-probe RPC.

A successful readiness probe still does not authorize the production
extraction orchestration.

The production extraction orchestration remains a separate explicit execution
gate.

This design contract authorizes zero production HTTP requests and zero OCR
executions.
