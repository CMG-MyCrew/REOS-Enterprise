# County collapse Group 2 prepared-operation retirement authorization v1

Status: DESIGN-ONLY INCIDENT RETIREMENT IMPLEMENTATION AUTHORIZATION HANDOFF.

This contract authorizes no production mutation by itself.

It does not modify the operation-intent store, executor, residual evidence,
successor preflight, maintenance gate, maintenance operator, Database, or
county scheduler.

It does not authorize an executor retry, physical delete, scheduler restoration,
checkpoint mutation, automatic MAO, or automatic offer.

Its sole purpose is to authorize a later separate implementation that may
terminalize exactly one certified prepared-only Group 2 operation after fresh
pre-mutation evidence is proven.

## Certified source authority

Source main:

`b83fb0529d17dcc35c131838ed8d55c31b3274f9`

Source tree:

`9c8536696555b9d979ba81027e35ff3b085b5ba7`

Post-merge CI run:

`35558214884`

Post-merge CI job:

`106205907386`

Production Apps Script version:

`116`

## Exact incident authority

Operation ID:

`6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

Group:

`2`

Winner:

`DL-20260820181645-7130`

Target:

`DL-20260820181652-6183`

Prepared event SHA-256:

`843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`

Prepared payload SHA-256:

`9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`

Certified live V2 raw-result SHA-256:

`99d049d2364a470c44827ac8aeaa1228e17b521fa5044565a3a71ee1aeccbd8b`

Certified normalized live V2 JSON SHA-256:

`330c2ee6392a4d396213da868765f3c0321982ea17763f4c585a8ee2c61ddeb6`

## Certified live physical state

The single V2 live read-only reconciliation established:

- journal event count = 1;
- journal event type = `INTENT_PREPARED`;
- recovery classification =
  `NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`;
- delete barrier absent;
- verified delete absent;
- winner present;
- target present;
- winner current physical row = 766;
- target current physical row = 770;
- residual execution blocked = false;
- residual blocker count = 0;
- target-bound prepared operation history present = true;
- automatic retry permitted = false;
- executor retry authority = false;
- physical delete authority = false.

The V2 RPC has already been consumed exactly once.

No second V2 RPC is authorized.

## Existing journal semantics

The certified operation-intent store already recognizes
`COLLAPSE_EXECUTOR_PRECONDITION_FAILED` as a terminal event.

That terminal is valid only before any `DELETE_INVOCATION_STARTED` event.

After such a terminal, store recovery classifies the operation as:

`PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`

A `RECONCILIATION_NOTE` is nonterminal and is insufficient to retire the
incident.

The operation-intent store itself must remain byte-exact.

## Future retirement implementation boundary

Only after this authorization increment is merged and post-merge certified may
a later separate implementation add exactly these four source-control surfaces:

1. `build/apps-script-brand/CountyCollapseGroup2PreparedOperationRetirement.js`
2. `scripts/validate-county-collapse-group2-prepared-operation-retirement-v1.js`
3. `.github/workflows/county-collapse-offline.yml`
4. `scripts/validate-county-runtime-integration.js`

The later implementation must not modify:

- `CountyCollapseOperationIntentStore.js`;
- `CountyCodeViolationCollapseExecutor.js`;
- `CountyCodeViolationCollapseResidualEvidence.js`;
- `CountyCodeViolationCollapseExecutionPreflightV2.js`;
- `CountyCodeViolationCollapseMaintenanceGate.js`;
- `CountyCodeViolationCollapseMaintenanceOperator.js`;
- `Database.js`.

## Required retirement transaction

The future retirement implementation must require all of the following before
the append boundary:

1. Admin authority.
2. Explicit incident-retirement confirmation.
3. Exact operation ID.
4. Exact Group 2 winner and target identities.
5. Exact original prepared event and payload hashes.
6. Exactly one existing journal event.
7. Existing event type exactly `INTENT_PREPARED`.
8. Recovery classification exactly
   `NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`.
9. No delete barrier.
10. No verified delete.
11. Winner still present exactly once.
12. Target still present exactly once.
13. Scheduler still frozen.
14. Frozen checkpoint still exact.
15. Fresh CURRENT maintenance readiness.
16. One caller-owned Database ScriptLock context spanning final validation,
    append, flush/readback, and recovery verification.

Only after those predicates succeed may the implementation append exactly one:

`COLLAPSE_EXECUTOR_PRECONDITION_FAILED`

The terminal payload must identify the certified incident and state explicitly
that:

- the original executor attempt failed before a durable delete barrier;
- live V2 reconciliation proved both rows present;
- no physical-delete claim is being made;
- automatic retry remains prohibited;
- row recreation remains prohibited;
- successor execution authority remains false;
- automatic maintenance close remains prohibited.

## Required post-append verification

Before returning success, the implementation must prove:

- exactly two events exist;
- event 1 remains the exact certified `INTENT_PREPARED`;
- event 2 is exactly `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`;
- event 2 is durable/readback verified;
- no delete barrier exists;
- no post-delete event exists;
- no delete-success terminal exists;
- recovery classification is exactly
  `PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`;
- automatic retry remains false;
- row recreation remains false;
- physical delete authority remains false;
- executor retry authority remains false.

The retirement implementation itself must never call the physical-delete
primitive.

## Mandatory second phase

Terminalization does not authorize a successor executor attempt.

After real terminalization, a new read-only post-terminal reconciliation must
capture the actual terminal event SHA-256 and prove both physical rows remain
present.

Only after that evidence exists may a separate authorization increment design
an executor-history exception.

The later exception must be pinned to all of the following:

- exact incident operation ID;
- exact original prepared event SHA-256;
- exact future terminal event SHA-256;
- exact Group 2 winner;
- exact Group 2 target;
- exact two-event history;
- exact precondition-failed recovery classification;
- exact post-terminal live reconciliation evidence.

No generic terminal-history bypass is permitted.

No exception by event type alone is permitted.

No uncertain operation may be bypassed.

No verified-delete operation may be bypassed.

No arbitrary operation ID allowlist is permitted.

No automatic retry is permitted.

## Contract markers

`GROUP2_PREPARED_OPERATION_RETIREMENT_AUTHORIZATION_VERSION=1`

`SOURCE_MAIN_SHA=b83fb0529d17dcc35c131838ed8d55c31b3274f9`

`SOURCE_MAIN_TREE=9c8536696555b9d979ba81027e35ff3b085b5ba7`

`SOURCE_POST_MERGE_CI_RUN=35558214884`

`SOURCE_POST_MERGE_CI_JOB=106205907386`

`PRODUCTION_VERSION=116`

`INCIDENT_OPERATION_ID=6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

`INCIDENT_GROUP_NUMBER=2`

`INCIDENT_WINNER=DL-20260820181645-7130`

`INCIDENT_TARGET=DL-20260820181652-6183`

`PREPARED_EVENT_SHA256=843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`

`PREPARED_PAYLOAD_SHA256=9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`

`LIVE_V2_RAW_SHA256=99d049d2364a470c44827ac8aeaa1228e17b521fa5044565a3a71ee1aeccbd8b`

`LIVE_V2_JSON_SHA256=330c2ee6392a4d396213da868765f3c0321982ea17763f4c585a8ee2c61ddeb6`

`LIVE_V2_RPC_INVOCATION_COUNT=1`

`SECOND_V2_RPC_AUTHORITY=false`

`CERTIFIED_PREBARRIER_OPERATION=true`

`WINNER_CURRENT_ROW_NUMBER=766`

`TARGET_CURRENT_ROW_NUMBER=770`

`FUTURE_RETIREMENT_IMPLEMENTATION_SCOPE_FILE_COUNT=4`

`OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false`

`EXECUTOR_MODIFICATION_AUTHORITY=false`

`RESIDUAL_EVIDENCE_MODIFICATION_AUTHORITY=false`

`SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false`

`DATABASE_MODIFICATION_AUTHORITY=false`

`RETIREMENT_IMPLEMENTATION_AUTHORITY=false`

`RETIREMENT_RPC_EXECUTION_AUTHORITY=false`

`EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_AUTHORITY=false`

`EXECUTOR_RETRY_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`CHECKPOINT_MUTATION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Release boundary

This authorization increment is exactly three files:

1. this document;
2. its validator;
3. county-collapse offline workflow registration.

No runtime source changes are authorized in this increment.

No journal mutation is authorized.

No executor-history exception is authorized.

No production execution is authorized.
