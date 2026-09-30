# Philadelphia Probate Runtime Probe Contract V1

## Purpose

Provide a zero-side-effect production runtime diagnostic proving that the
Philadelphia probate PB1 source and Philadelphia county connector are loaded
from the deployed Apps Script project.

The probe is diagnostic only. It grants no probate-source execution authority.

## Public RPC

The future implementation may expose exactly one new zero-argument RPC:

`reosPhiladelphiaProbateRuntimeProbe()`

## Required observations

The probe may inspect only already-loaded in-memory JavaScript state.

It must verify:

1. `REOS` exists.
2. `REOS.PhiladelphiaProbateRecurringSource` exists.
3. `REOS.PAPhiladelphiaCountyConnector` exists.
4. PB1 cursor prefix equals `PB1`.
5. PB1 cursor domain equals `PHL-PROBATE-PB1-V1`.
6. PB1 maximum lookback equals `10`.
7. PB1 notice page size equals `25`.
8. PB1 exposes `approvedSourceUrl`.
9. PB1 exposes `parseCursor`.
10. PB1 exposes `encodeCursor`.
11. PB1 exposes `resolve` but MUST NOT invoke it.
12. Philadelphia connector exposes its connector identity.
13. Philadelphia connector exposes `probateSourceAuthority` but MUST NOT invoke it.

## Required result

The future probe must return a deterministic object containing only diagnostic
metadata and authority flags.

The result must explicitly state:

- `ok: true`
- `probeVersion: 1`
- `runtimeLoaded: true`
- `cursorPrefix: "PB1"`
- `cursorDomainId: "PHL-PROBATE-PB1-V1"`
- `maxLookbackDays: 10`
- `noticePageSize: 25`
- `resolvePresent: true`
- `resolveExecuted: false`
- `probateSourceAuthorityPresent: true`
- `probateSourceAuthorityExecuted: false`
- `externalHttpExecuted: false`
- `sourceFetchExecuted: false`
- `connectorRegistrationExecuted: false`
- `schedulerInspectionExecuted: false`
- `schedulerMutationExecuted: false`
- `triggerMutationExecuted: false`
- `checkpointMutationExecuted: false`
- `countyDataMutationExecuted: false`
- `persistenceExecuted: false`
- `configurationExecuted: false`
- `arvAuthorityGranted: false`
- `repairScopeAuthorityGranted: false`
- `maoAuthorityGranted: false`
- `offerAuthorityGranted: false`

## Prohibited calls and capabilities

The probe must not call or reference execution of:

- `resolve()`
- `probateSourceAuthority()`
- `probateSourcePreflight_()`
- connector `fetch_()`
- connector `register()`
- `CountyRuntimeBridge.registerConnectors()`
- `UrlFetchApp`
- `PropertiesService`
- `ScriptApp`
- `SpreadsheetApp`
- `DriveApp`
- `LockService`
- scheduler APIs
- checkpoint APIs
- persistence APIs
- configuration APIs

No network access is permitted.

No source discovery is permitted.

No probate PDF or article access is permitted.

No scheduler or trigger inspection is permitted.

No production data read or write is permitted.

## Deployment authority

This contract does not authorize:

- implementation;
- RPC execution;
- `clasp push`;
- Apps Script version creation;
- deployment update;
- scheduler activation;
- probate HTTP execution;
- county-data mutation;
- ARV authority;
- repair-scope authority;
- MAO authority;
- offer authority.

Every later implementation, deployment, and execution remains a separate gate.
