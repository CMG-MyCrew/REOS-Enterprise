# Group 2 Post-Terminal Reconciliation Authorization v1

## Purpose

This contract authorizes a future additive, read-only production evidence
surface for the exact Group 2 stranded-operation incident after certified
prepared-operation retirement.

It does not authorize executor retry, physical deletion, journal mutation,
maintenance mutation, scheduler restoration, checkpoint mutation, MAO, or
automatic offer generation.

## Certified incident

Operation ID:

`6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

Group:

`2`

Winner Distress Lead ID:

`DL-20260820181645-7130`

Target Distress Lead ID:

`DL-20260820181652-6183`

Prepared event SHA-256:

`843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`

Prepared payload SHA-256:

`9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`

Terminal event SHA-256:

`2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89`

Terminal payload SHA-256:

`10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2`

## Exact certified journal history

The reader must require exactly two events, in this order:

1. `INTENT_PREPARED`
2. `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`

The first event must have:

- sequence `1`;
- event SHA-256
  `843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`;
- payload SHA-256
  `9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`.

The second event must have:

- sequence `2`;
- event type `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`;
- event SHA-256
  `2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89`;
- payload SHA-256
  `10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2`;
- previous-event SHA-256 equal to the certified prepared-event SHA;
- Group Number `2`;
- winner ID `DL-20260820181645-7130`;
- target ID `DL-20260820181652-6183`.

No third event is permitted.

## Required recovery classification

`CountyCollapseOperationIntentStore.recover()` must return:

`PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`

with:

- `automaticRetryPermitted=false`;
- `rowRecreationPermitted=false`;
- `journalMutationExecuted=false`;
- `eventCount=2`.

Any other recovery classification fails closed.

## Required journal access

The future reader may call only the read-only store methods needed for evidence:

- `CountyCollapseOperationIntentStore.listOperationIds()`;
- `CountyCollapseOperationIntentStore.read(operationId)`;
- `CountyCollapseOperationIntentStore.recover(operationId)`.

The reader must not call:

- `prepare()`;
- `append()`.

The incident operation ID must remain present exactly once in the operation-ID
inventory.

## Fresh live row proof

Historical row numbers 766 and 770 are evidence only and are not identity
authority.

The future reader must prove current live identity by Distress Lead ID.

It must verify exactly one current `DISTRESS_LEADS` row for:

- winner `DL-20260820181645-7130`;
- target `DL-20260820181652-6183`.

Current physical row numbers must:

- be discovered at read time;
- be integers >= 2;
- be different from each other.

The reader must not use a historical physical row number as mutation or
identity authority.

The reader may use the existing read-only residual evidence plus bounded direct
read-only `Database.getSheet('DISTRESS_LEADS')` access to independently prove
the two identities remain physically present.

The future reader must not call a Database insert, update, replace, patch,
delete, repair, migration, or provisioning method.

## Residual evidence

The reader must inspect current
`CountyCodeViolationCollapseResidualEvidence.read({})`.

It must verify the certified collapse authority and winner-plan fingerprint
remain current.

For Group 2 it must prove both winner and target are present in current live
row evidence.

Prepared-operation retirement must not be interpreted as a verified deletion.

The reader must require:

- no verified Group 2 deletion;
- no delete barrier for this incident;
- no uncertain terminal classification for this incident.

## Terminal payload

The terminal event canonical payload must decode successfully.

The decoded retirement payload must remain incident-bound to:

- operation ID;
- group 2;
- exact winner;
- exact target;
- prepared event SHA;
- prepared payload SHA.

It must continue to state:

- original executor failed before durable delete barrier;
- no physical delete claim;
- automatic retry not permitted;
- row recreation not permitted;
- successor execution authority not granted;
- automatic maintenance close not permitted.

## Scheduler and checkpoint

The future reader must be read only.

It must prove the managed county scheduler remains frozen:

`reosCountyProductionSchedulerRun`

with trigger count `0`.

It must prove the frozen checkpoint remains:

- cycle `COUNTY-20260902222607805`;
- next feed index `0`;
- cursor
  `AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281`;
- completed feeds `0`;
- total feeds `4`;
- results count `0`.

No scheduler or checkpoint mutation is authorized.

## Public read-only transport

The future implementation may expose exactly one zero-argument read-only RPC:

`reosCountyCollapseGroup2PostTerminalReconciliationStatus`

The RPC may be repeated because it is evidence-only.

It must grant no caller-defined authority.

## Required output

A successful result must include at least:

- `ok=true`;
- mode
  `READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1`;
- operation ID;
- group number;
- winner ID;
- target ID;
- prepared event SHA;
- prepared payload SHA;
- terminal event SHA;
- terminal payload SHA;
- exact journal event count `2`;
- exact event-type ordering;
- recovery classification
  `PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`;
- `winnerPresent=true`;
- `targetPresent=true`;
- fresh winner current row number;
- fresh target current row number;
- `deleteBarrierPresent=false`;
- `verifiedDeletePresent=false`;
- `postTerminalReconciliationComplete=true`;
- `executorHistoryExceptionEvidenceEligible=true`.

`executorHistoryExceptionEvidenceEligible=true` means only that the evidence is
sufficient for a later separately reviewed history-exception design. It grants
no execution or retry authority.

The result must also explicitly return false for:

- `journalMutationExecuted`;
- `automaticRetryPermitted`;
- `executorRetryAuthorityGranted`;
- `executorHistoryExceptionImplementationAuthorityGranted`;
- `successorExecutionAuthorityGranted`;
- `collapseExecutionAuthorityGranted`;
- `physicalDeleteAuthorityGranted`;
- `productionDataMutationAuthorityGranted`;
- `maintenanceMutationAuthorityGranted`;
- `schedulerMutationAuthorityGranted`;
- `checkpointMutationAuthorityGranted`;
- `connectorExecutionAuthorityGranted`;
- `rowRecreationPermitted`;
- `automaticMaoAuthorityGranted`;
- `automaticOfferAuthorityGranted`.

## Fail-closed behavior

The reader must fail if any of the following occurs:

- operation inventory drift;
- event count is not exactly two;
- event ordering changes;
- either event SHA changes;
- either payload SHA changes;
- terminal `previousEventSha256` changes;
- event identity fields change;
- canonical terminal payload cannot be decoded;
- recovery classification changes;
- a delete barrier appears;
- a verified delete appears;
- winner is absent or duplicated;
- target is absent or duplicated;
- scheduler is not frozen;
- frozen checkpoint changes;
- certified authority changes.

## Future implementation scope

After this authorization contract is merged and certified, the future
implementation increment may modify exactly these four files:

1. `build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js`
2. `scripts/validate-county-collapse-group2-post-terminal-reconciliation-v1.js`
3. `.github/workflows/county-collapse-offline.yml`
4. `scripts/validate-county-runtime-integration.js`

No other production or validation file is authorized by this contract.

## Protected surfaces

The future implementation must not modify:

- `build/apps-script-brand/CountyCollapseOperationIntentStore.js`
- `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`
- `build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`
- `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js`
- `build/apps-script-brand/CountyMutationExclusionLease.js`
- `build/apps-script-brand/CountyCollapseGroup2PreparedOperationRetirement.js`
- `build/apps-script-brand/CountyCollapseGroup2StrandedOperationReconciliation.js`
- `build/apps-script-brand/Database.js`

## Explicitly not authorized

This authorization grants no:

- deployment authority;
- production RPC execution authority;
- retirement RPC retry authority;
- journal mutation authority;
- maintenance open/close authority;
- executor-history exception implementation authority;
- executor retry authority;
- physical-delete authority;
- scheduler restoration authority;
- checkpoint mutation authority;
- MAO authority;
- automatic-offer authority.

A later executor-history exception must be a separate increment and must be
pinned to both certified journal event SHAs and the certified post-terminal
reconciliation evidence.
