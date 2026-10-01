# Philadelphia Probate PB1 — Oversize Recovery Readiness Probe Contract v1

## Status

Design contract only.

This contract does not authorize implementation.

This contract does not authorize production execution.

This contract does not authorize HTTP, PDF transport, Drive conversion, OCR,
DocumentApp access, or temporary-artifact creation.

## Purpose

Define a zero-side-effect production diagnostic that proves only that the
already-deployed PB1 bounded oversize-text evidence component and production
oversize-text evidence recovery orchestration JavaScript surfaces are loaded
with the expected pinned metadata and function identities.

Success means only that the deployed JavaScript surfaces are present and
internally consistent with the certified recovery design.

Success does not authorize or prove:

- live HTTP transport;
- remote PDF availability;
- current remote PDF identity;
- Drive conversion;
- OCR;
- DocumentApp access;
- temporary-artifact cleanup;
- extracted-text length;
- extracted-text SHA-256.

The probe is a runtime-surface diagnostic only.

## External production precondition

Before the future readiness probe may be executed in production, an external
deployment certification must independently establish:

- production deployment is exactly Apps Script version `138`;
- version `139` does not exist;
- Apps Script HEAD contains exactly the merged and certified recovery source;
- `PhiladelphiaProbateBoundedOversizeTextEvidence.js` has the certified
  source hash;
- `PhiladelphiaProbateProductionOversizeTextEvidenceRecovery.js` has the
  certified source hash.

The readiness probe itself MUST NOT inspect deployment versions.

The readiness probe MUST NOT use `ScriptApp`.

The readiness probe MUST NOT use Apps Script deployment APIs.

## Future runtime

Future runtime file:

`build/apps-script-brand/PhiladelphiaProbateOversizeRecoveryReadinessProbe.js`

The future implementation may expose exactly one zero-argument RPC:

`reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe()`

No caller-provided URL, PDF identity, text limit, transport option, OCR option,
or execution option is authorized.

## Required recovery-orchestration observations

The future readiness probe may inspect only already-loaded JavaScript state.

It must verify:

1. `REOS` exists.
2. `REOS.PhiladelphiaProbateProductionOversizeTextEvidenceRecovery` exists.
3. `recoveryVersion` equals `1`.
4. `publicationDate` equals `2026-09-30`.
5. `sourceUrl` equals the exact certified PDF URL.
6. `sourceUrlSha256` equals the certified URL SHA-256.
7. `sourceBasename` equals `tlipn093026.pdf`.
8. `expectedPdfBytes` equals `4220387`.
9. `expectedPdfSha256` equals the certified PDF SHA-256.
10. `maxPdfBytes` equals `26214400`.
11. `currentNormalExtractionLimit` equals `250000`.
12. `execute` exists as a function.
13. `execute` MUST NOT be invoked.
14. global
    `reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery`
    exists as a function.
15. the global recovery RPC MUST NOT be invoked.

Certified source URL:

`https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`

Certified source URL SHA-256:

`98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`

Certified PDF SHA-256:

`90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028`

## Required bounded-evidence observations

The future readiness probe must verify:

1. `REOS.PhiladelphiaProbateBoundedOversizeTextEvidence` exists.
2. `evidenceVersion` equals `1`.
3. `expectedPdfBytes` equals `4220387`.
4. `expectedPdfSha256` equals the certified PDF SHA-256.
5. `maxPdfBytes` equals `26214400`.
6. `currentNormalExtractionLimit` equals `250000`.
7. `inspect` exists as a function.
8. `inspect` MUST NOT be invoked.

## Required result

A successful future readiness probe must return deterministic metadata only.

It must explicitly return:

- `ok: true`;
- `probeVersion: 1`;
- `runtimeLoaded: true`;
- `runtimeSurfaceReady: true`;
- `recoveryPresent: true`;
- `recoveryVersion: 1`;
- `publicationDate: "2026-09-30"`;
- exact `sourceUrl`;
- exact `sourceUrlSha256`;
- `sourceBasename: "tlipn093026.pdf"`;
- `expectedPdfBytes: 4220387`;
- exact `expectedPdfSha256`;
- `maxPdfBytes: 26214400`;
- `currentNormalExtractionLimit: 250000`;
- `recoveryExecutePresent: true`;
- `productionRecoveryRpcPresent: true`;
- `recoveryExecuted: false`;
- `evidenceComponentPresent: true`;
- `evidenceVersion: 1`;
- `evidenceInspectPresent: true`;
- `evidenceExecuted: false`;
- `deploymentInspectionExecuted: false`;
- `externalHttpExecuted: false`;
- `pdfFetchExecuted: false`;
- `sourceDiscoveryExecuted: false`;
- `driveCreateExecuted: false`;
- `documentOpenExecuted: false`;
- `driveCleanupExecuted: false`;
- `temporaryArtifactCreated: false`;
- `connectorFetchExecuted: false`;
- `connectorRegistrationExecuted: false`;
- `productionDataReadExecuted: false`;
- `probateParsingExecuted: false`;
- `leadCreationExecuted: false`;
- `persistenceExecuted: false`;
- `configurationExecuted: false`;
- `schedulerInspectionExecuted: false`;
- `schedulerMutationExecuted: false`;
- `triggerMutationExecuted: false`;
- `checkpointMutationExecuted: false`;
- `countyDataMutationExecuted: false`;
- `arvAuthorityGranted: false`;
- `repairScopeAuthorityGranted: false`;
- `maoAuthorityGranted: false`;
- `offerAuthorityGranted: false`.

## Strict non-execution boundary

The future readiness probe MUST NOT invoke:

- `reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery()`;
- `REOS.PhiladelphiaProbateProductionOversizeTextEvidenceRecovery.execute()`;
- `REOS.PhiladelphiaProbateBoundedOversizeTextEvidence.inspect()`;
- `reosPhiladelphiaProbateProductionExtractionOrchestration()`;
- `REOS.PhiladelphiaProbateProductionExtractionOrchestration.execute()`;
- `REOS.PhiladelphiaProbateBoundedTextExtraction.extract()`;
- `reosPhiladelphiaProbateBoundedPdfFetch()`;
- `reosPhiladelphiaProbateBoundedSourceDiscovery()`.

The probe may inspect type/function identity for the two required recovery
surfaces only.

It may not call them.

## Prohibited service surfaces

The future readiness-probe implementation MUST NOT reference or invoke:

- `UrlFetchApp`;
- `Utilities`;
- `Drive`;
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
- configuration stores;
- prior temporary OCR artifacts.

It may inspect only already-loaded JavaScript objects, primitive metadata, and
function identities.

## No transport / OCR inference

A successful readiness probe does not establish that:

- the certified PDF is currently reachable;
- the remote PDF currently has the certified bytes;
- HTTP authorization will succeed;
- the one-response Blob will pass validation;
- Drive conversion will succeed;
- OCR will succeed;
- extracted text will exceed `250000` characters;
- the extracted-text SHA-256 can be computed;
- temporary-artifact cleanup will succeed.

Those properties can be established only by a separately authorized production
recovery invocation.

## Existing normal extraction boundary

The existing normal extraction limit remains exactly:

`250000`

characters.

Readiness-probe success MUST NOT change, bypass, increase, reinterpret, or
authorize a change to that limit.

Readiness success does not accept oversize text for normal extraction.

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

## Required offline behavior validation

Before implementation can be certified, deterministic mocks must prove at
least:

1. exactly one public readiness RPC is exposed;
2. the readiness RPC has zero caller arguments;
3. no prohibited Apps Script service token is present in the implementation;
4. recovery `execute` is never invoked;
5. global recovery RPC is never invoked;
6. evidence `inspect` is never invoked;
7. deliberately throwing mock functions remain uncalled on success;
8. wrong/missing recovery metadata fails closed;
9. wrong/missing evidence metadata fails closed;
10. missing required function identities fail closed;
11. every success result reports all execution/authority flags false;
12. no live runtime side effect is executed by offline validation.

## Required later gates

Before the first readiness probe may be executed in production:

1. certify this design contract;
2. implement the readiness probe offline;
3. create deterministic behavior validation;
4. integrate runtime accounting while preserving historical reconciliation at
   `147`;
5. run CI;
6. merge;
7. certify post-merge main;
8. source-deploy the readiness probe through a separate deployment gate;
9. certify that deployment;
10. separately authorize exactly one zero-side-effect production readiness
    probe RPC.

A successful readiness probe still does not authorize the production recovery
RPC.

The production recovery RPC remains a separate explicit gate that can execute:

- one direct HTTPS GET;
- one bounded evidence/OCR lifecycle;
- one cleanup attempt.

This design contract authorizes zero production HTTP requests and zero OCR
executions.
