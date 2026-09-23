# Group 4 Post-Barrier Timeout Terminal-Reconciliation Design v1

Status: DESIGN ONLY. INCIDENT-BOUNDED TERMINAL-RECONCILIATION HANDOFF.

This contract defines the required future recovery architecture for the exact
Group 4 executor timeout incident.

It authorizes no runtime implementation by itself.

It authorizes no production RPC, executor retry, physical delete, row
recreation, journal mutation, maintenance mutation, deployment, scheduler
restoration, checkpoint mutation, automatic MAO, or automatic offer.

## Certified source authority

Source main:

`ec0455b8c52d3a22acad71db6f062c1712418744`

Source tree:

`111663af93a7cae9179c82cb09dae9e8bb0f462d`

Production Apps Script version at the incident boundary:

`120`

Certified design-preflight SHA-256:

`583d1a5022fc144b84049b014a351fde829e9d955e05a0794824c96f41e35a52`

## Exact incident

Group:

`4`

Winner:

`DL-20260820195113-7700`

Target:

`DL-20260820195131-0566`

Violation:

`VI-2026-045398`

Operation ID:

`9c3f6f20-340b-47fb-a2c9-175fcbfbd88d`

Executor implementation:

`DIRECT_KEEP_COLLAPSE_EXECUTOR_V1`

The executor RPC was invoked exactly once.

The client transport completed, but Apps Script returned:

`Exceeded maximum execution time`

The executor invocation is permanently consumed.

Automatic retry is forbidden.

A second executor invocation is forbidden.

Row recreation is forbidden.

## Exact existing journal history

The operation currently contains exactly two durable events.

### Event 1

Sequence:

`1`

Type:

`INTENT_PREPARED`

Timestamp:

`2026-09-23T20:00:32.284Z`

Payload SHA-256:

`c417ee900580a965090f95eddffeb6220e77385188900e740483617d41e7af12`

Payload UTF-8 bytes:

`8990`

Payload chunk count:

`1`

Previous-event SHA:

`GENESIS`

Event SHA-256:

`41869f2955b69423bc02292a126049cacb523df545d4535471a5972c36b6c788`

### Event 2

Sequence:

`2`

Type:

`DELETE_INVOCATION_STARTED`

Timestamp:

`2026-09-23T20:03:06.562Z`

Payload SHA-256:

`ddf06e64cfd987044b048317170b9b23367444993ae7999cbfec4dcb202f8f5d`

Payload UTF-8 bytes:

`3502`

Payload chunk count:

`1`

Previous-event SHA:

`41869f2955b69423bc02292a126049cacb523df545d4535471a5972c36b6c788`

Event SHA-256:

`6f925e2042904e756375b06c2e0b0ba321517dd2e95a909fdc6f75f4df66fd86`

No third event is currently certified.

No `POSTDELETE_VERIFIED` event is currently certified.

No `COLLAPSE_DELETE_VERIFIED` terminal is currently certified.

The operation therefore recovers exactly as:

`UNCERTAIN_DELETE_BARRIER_OR_TERMINAL`

Recovery must continue to prove:

- automatic retry false;
- row recreation false;
- journal mutation false.

## Certified live post-attempt observation

Read-only live inspection after the timeout established:

- winner `DL-20260820195113-7700` remains present;
- the winner was observed exactly once;
- its observed current physical row was `771`;
- target `DL-20260820195131-0566` was absent;
- target match count was `0`;
- the exact operation journal contains the delete barrier;
- the exact operation journal contains no terminal event.

These observations are incident evidence only.

A future terminal-reconciliation implementation must re-prove the live state
at execution time and must not treat these historical row positions as
current authority.

## Current fail-closed state

The read-only successor preflight currently rejects the post-attempt state
with:

`Missing certified ID lacks verified direct-keep delete journal: DL-20260820195131-0566`

This is correct.

The current missing target must not be treated as a verified deletion until an
incident-bounded terminal reconciliation is separately implemented,
authorized, executed, read back, and certified.

The residual reader must not be weakened merely to ignore this condition.

## Why the Group 2 post-success exception cannot be reused

The Group 2 post-success repair addressed a different state.

Group 2 already had one exact `VERIFIED_SUCCESS_JOURNAL` history and required
a read-only residual-history invariant correction.

Group 4 does not have a verified-success terminal.

Group 4 instead has an exact durable delete barrier followed by an executor
timeout.

Therefore:

- the Group 2 post-success history exception is not authority for Group 4;
- no generic uncertain-history exception is authorized;
- no generic missing-row exception is authorized;
- no generic bound-operation-count exception is authorized;
- the current Group 4 uncertain history must remain fail-closed until it is
  terminalized honestly.

## Existing operation-store transition contract

The operation-intent store already requires:

`DELETE_INVOCATION_STARTED -> POSTDELETE_VERIFIED -> COLLAPSE_DELETE_VERIFIED`

A `COLLAPSE_EXECUTOR_PRECONDITION_FAILED` terminal is forbidden after a
delete barrier.

The future repair must preserve these global transition rules.

No new generic terminal state is authorized by this design.

No operation-store transition weakening is authorized.

## Required future recovery architecture

The preferred future implementation is an incident-bounded terminal
reconciliation, not an executor retry.

The future implementation must contain a read-only incident evidence surface
and a separately gated terminal-reconciliation surface.

The read-only evidence surface must prove the exact incident without mutating
anything.

The terminal-reconciliation surface may append only the minimum events needed
to move the exact incident from its certified barrier state to a verified
terminal state.

It must never call:

`REOS.Database.deletePhysicalRowExact`

It must never invoke the collapse executor.

It must never recreate the target.

## Required live evidence before any future journal append

A future repair must fail closed unless all of the following are re-proven:

1. operation ID is exactly
   `9c3f6f20-340b-47fb-a2c9-175fcbfbd88d`;
2. Group is exactly `4`;
3. winner is exactly `DL-20260820195113-7700`;
4. target is exactly `DL-20260820195131-0566`;
5. violation is exactly `VI-2026-045398`;
6. operation history contains the exact certified event 1;
7. operation history contains the exact certified event 2;
8. no unexpected target-bound operation exists;
9. current recovery is the expected uncertain post-barrier classification;
10. winner is present exactly once;
11. target is absent exactly zero times;
12. winner and target still resolve to the same certified canonical property;
13. immutable direct-keep candidate authority remains exact;
14. downstream target references remain clear;
15. scheduler remains frozen;
16. county checkpoint remains frozen and exact;
17. authority generation remains CURRENT;
18. a fresh maintenance lease is settled and unexpired;
19. manual and external county writers are freshly certified quiescent;
20. no second physical-delete authority exists.

Historical physical row numbers are evidence only and must not be treated as
current authority.

## Fresh maintenance requirement

The expired Cycle-2 capability must never be reused.

Any future journal repair requires a fresh maintenance cycle with:

- a new gate ID;
- a new lease ID;
- a new private token;
- fresh manual/external-writer quiescence attestation;
- successful settlement;
- CURRENT authority generation.

The terminal-reconciliation implementation must revalidate maintenance
readiness under its mutation lock immediately before the first journal append.

Maintenance close remains a separate later operation.

Automatic maintenance close is forbidden.

## Locking requirement

Any future journal mutation must execute under certified REOS database
ScriptLock context.

The implementation must re-read the exact incident and live county state
before lock and again under lock.

Any drift must fail before append.

The implementation must revalidate the exact state again immediately before
each append.

## Honest post-delete verification event

If the exact incident still contains only the two certified events, the first
future mutation may be one event:

`POSTDELETE_VERIFIED`

This event must represent a new certified reconciliation observation.

It must not claim possession of the original timed-out executor's primitive
return value.

It must not fabricate:

`primitiveResult`

It must not fabricate:

`physicalDeleteClassification=DELETED_VERIFIED`

Its payload must clearly state that:

- the original executor timed out after the durable barrier;
- the original primitive result is unavailable;
- no second delete was executed;
- current target absence was independently verified;
- current winner presence was independently verified;
- downstream references were independently rechecked;
- automatic retry remains false;
- row recreation remains false;
- automatic maintenance close remains false.

## Honest verified terminal event

Only after a durable and read-back-verified `POSTDELETE_VERIFIED` event may a
future repair append:

`COLLAPSE_DELETE_VERIFIED`

The terminal payload must identify the verification basis as the exact
incident-bounded timeout reconciliation.

It must not state that the future repair itself physically deleted the row.

It must not claim the unavailable original primitive result.

It must state that:

- the delete barrier predates the timeout;
- target absence was independently verified;
- winner presence was independently verified;
- post-delete evidence was durably journaled;
- no second physical delete occurred;
- executor retry remains forbidden;
- row recreation remains forbidden;
- automatic maintenance close remains forbidden.

## Resume-safe requirement

The future repair must tolerate interruption without duplicating journal
events.

Allowed pre-mutation histories are only:

1. exactly the certified two-event incident; or
2. exactly those two events plus one previously certified
   `POSTDELETE_VERIFIED` reconciliation event from this exact repair contract.

For case 1, the repair may append `POSTDELETE_VERIFIED` and then the terminal.

For case 2, the repair must not append another post-delete event and may
continue only after revalidating the exact existing event and all current live
evidence.

If a verified terminal already exists, no additional journal mutation is
allowed.

Any other history shape fails closed.

## Required post-repair state

After a separately authorized successful future terminal reconciliation:

- operation recovery must be exactly `VERIFIED_SUCCESS_JOURNAL`;
- target must remain absent;
- winner must remain present exactly once;
- no second physical delete may have occurred;
- target-bound verified-success history count must be exactly one;
- uncertain operation count for the target must be zero.

The normal residual/preflight surface should then independently certify:

- certified rows `44`;
- current certified rows `42`;
- verified deleted count `2`;
- remaining direct-keep delete candidates `14`;
- uncertain operation count `0`;
- execution blocker count `0`;
- collapse execution ready `true`.

These expected counts are post-repair verification targets only.

They grant no authority to continue to the next delete.

## Future implementation shape

A later separately authorized implementation should introduce:

1. `build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutEvidence.js`;
2. `build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.js`;
3. `scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-v1.js`;
4. `.github/workflows/county-collapse-offline.yml`.

The evidence module must be read only.

The reconciliation module must be incident bounded.

The validator must exercise both the initial two-event path and the safe
three-event resume path.

No modification to the physical-delete primitive is authorized.

## Protected runtime surfaces

The future implementation must not modify the behavior of:

- `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`;
- `build/apps-script-brand/Database.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js`;
- `build/apps-script-brand/CountyMutationExclusionLease.js`.

`CountyCollapseOperationIntentStore.js` should remain unchanged unless a
later design proves an unavoidable store change is necessary.

This design does not authorize such a store change.

## Minimum future implementation behavior cases

A future implementation validator must prove at minimum:

1. exact two-event incident is recognized;
2. wrong operation ID fails;
3. wrong Group fails;
4. wrong winner fails;
5. wrong target fails;
6. prepared-event SHA drift fails;
7. prepared-payload SHA drift fails;
8. barrier-event SHA drift fails;
9. barrier-payload SHA drift fails;
10. previous-event SHA drift fails;
11. unexpected third event fails;
12. unrelated target-bound operation fails;
13. winner missing fails;
14. duplicate winner fails;
15. target present fails;
16. downstream reference drift fails;
17. scheduler thaw fails;
18. checkpoint drift fails;
19. stale authority generation fails;
20. missing maintenance readiness fails;
21. wrong maintenance gate fails;
22. wrong maintenance lease fails;
23. wrong maintenance token fails;
24. no physical-delete primitive is called;
25. executor is never invoked;
26. exact post-delete event may append once;
27. post-delete readback failure fails closed;
28. exact three-event resume state is accepted;
29. duplicate post-delete append is forbidden;
30. terminal append occurs only after post-delete evidence;
31. terminal readback failure fails closed;
32. verified-success recovery is required after terminal;
33. second verified terminal is forbidden;
34. row recreation remains forbidden;
35. automatic retry remains false;
36. automatic maintenance close remains false;
37. no scheduler restoration occurs;
38. no checkpoint mutation occurs;
39. no automatic MAO authority is granted;
40. no automatic offer authority is granted.

## Current design increment scope

This design increment itself changes exactly three files:

1. this design document;
2. `scripts/validate-county-collapse-group4-postbarrier-timeout-terminal-reconciliation-design-v1.js`;
3. `.github/workflows/county-collapse-offline.yml`.

No runtime implementation is included.

## Explicit non-authority

`GROUP4_TERMINAL_RECONCILIATION_IMPLEMENTATION_AUTHORIZED=false`

`EXECUTOR_RETRY_AUTHORIZED=false`

`SECOND_EXECUTOR_INVOCATION_AUTHORIZED=false`

`PHYSICAL_DELETE_AUTHORIZED=false`

`ROW_RECREATION_AUTHORIZED=false`

`JOURNAL_MUTATION_AUTHORIZED=false`

`MAINTENANCE_OPEN_AUTHORIZED=false`

`MAINTENANCE_CLOSE_AUTHORIZED=false`

`SOURCE_RUNTIME_MODIFICATION_AUTHORIZED=false`

`DEPLOYMENT_AUTHORIZED=false`

`RPC_EXECUTION_AUTHORIZED=false`

`SCHEDULER_RESTORATION_AUTHORIZED=false`

`CHECKPOINT_MUTATION_AUTHORIZED=false`

`AUTOMATIC_MAO_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`

## Contract markers

`GROUP4_POSTBARRIER_TIMEOUT_TERMINAL_RECONCILIATION_DESIGN_VERSION=1`

`SOURCE_MAIN_SHA=ec0455b8c52d3a22acad71db6f062c1712418744`

`SOURCE_MAIN_TREE=111663af93a7cae9179c82cb09dae9e8bb0f462d`

`INCIDENT_OPERATION_ID=9c3f6f20-340b-47fb-a2c9-175fcbfbd88d`

`INCIDENT_GROUP_NUMBER=4`

`INCIDENT_WINNER=DL-20260820195113-7700`

`INCIDENT_TARGET=DL-20260820195131-0566`

`INCIDENT_VIOLATION=VI-2026-045398`

`PREPARED_EVENT_SHA256=41869f2955b69423bc02292a126049cacb523df545d4535471a5972c36b6c788`

`PREPARED_PAYLOAD_SHA256=c417ee900580a965090f95eddffeb6220e77385188900e740483617d41e7af12`

`DELETE_BARRIER_EVENT_SHA256=6f925e2042904e756375b06c2e0b0ba321517dd2e95a909fdc6f75f4df66fd86`

`DELETE_BARRIER_PAYLOAD_SHA256=ddf06e64cfd987044b048317170b9b23367444993ae7999cbfec4dcb202f8f5d`

`CURRENT_RECOVERY_CLASSIFICATION=UNCERTAIN_DELETE_BARRIER_OR_TERMINAL`

`EXISTING_EVENT_COUNT=2`

`EXECUTOR_RETRY_AUTHORIZED=false`

`PHYSICAL_DELETE_AUTHORIZED=false`

`ROW_RECREATION_AUTHORIZED=false`

`GROUP2_POSTSUCCESS_EXCEPTION_REUSE_AUTHORIZED=false`

`GENERIC_RESIDUAL_WEAKENING_AUTHORIZED=false`

`FRESH_MAINTENANCE_REQUIRED_FOR_FUTURE_REPAIR=true`

`REPAIR_MUST_NOT_CALL_DELETE_PHYSICAL_ROW_EXACT=true`

`REPAIR_MUST_NOT_FABRICATE_ORIGINAL_PRIMITIVE_RESULT=true`

`REPAIR_MUST_BE_RESUME_SAFE=true`

`FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=4`

`GROUP4_TERMINAL_RECONCILIATION_IMPLEMENTATION_AUTHORIZED=false`

`JOURNAL_MUTATION_AUTHORIZED=false`

`DEPLOYMENT_AUTHORIZED=false`

`RPC_EXECUTION_AUTHORIZED=false`

`AUTOMATIC_MAO_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`

## Release boundary

This increment is design only.

A later implementation requires a separate reviewed authorization.

A later production journal repair requires another separate explicit
production authorization after the implementation is merged, deployed, and
read-only preflight evidence is certified.
