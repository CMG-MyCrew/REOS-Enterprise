# County code-violation collapse post-delete repeatability contract v1

Status: DESIGN ONLY. NO RUNTIME IMPLEMENTATION AUTHORITY.

## Purpose

The certified direct-keep collapse executor topology currently has an
implementation-blocking repeatability defect.

The historical read-only chain is:

1. `CountyCodeViolationCollapseFullRowEvidence`;
2. `CountyCodeViolationCollapseWinnerPlan`;
3. `CountyCodeViolationCollapseExecutionPreflight`.

That chain is valid for the certified pre-delete population, but it is not
reusable after the first verified physical deletion.

The historical full-row reader intentionally:

- rejects any certified row whose current physical row differs from its
  originally certified physical row; and
- requires every certified Distress Lead ID to remain physically present.

The executor contract independently requires every additional physical delete
to occur through a new invocation with:

- a new preflight;
- a new operation intent;
- fresh current physical identity;
- fresh downstream-reference clearance; and
- fresh residual-state certification.

A verified physical deletion necessarily removes one certified Distress Lead ID
and may shift every later physical row.

Therefore the historical pre-delete evidence chain cannot authorize a second
executor invocation after the first verified physical deletion.

## Historical artifacts remain valid

This contract does not weaken or rewrite the historical pre-delete evidence.

The following remain byte-exact in this design increment:

- `build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js`
- `scripts/validate-county-code-violation-collapse-fullrow-evidence-v2.js`
- `build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js`
- `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js`
- `build/apps-script-brand/CountyCollapseOperationIntentStore.js`
- `docs/county-code-violation-collapse-executor-maintenance-handoff-v1.md`
- `scripts/validate-county-code-violation-collapse-executor-maintenance-handoff-v1.js`

Their historical meaning is preserved.

The historical full-row reader, winner plan, and execution preflight are
classified as initial-pre-delete certification evidence.

They must not be weakened merely to make a later delete pass.

## Successor repeatability topology

A later, separately certified implementation increment must provide a bounded
successor path with four responsibilities.

### 1. Enumerable operation-intent evidence

The existing durable operation-intent journal remains the sole durable source
of collapse-operation history.

A later implementation may extend:

`REOS.CountyCollapseOperationIntentStore`

with exactly one new read-only enumeration API:

`listOperationIds()`

The method:

- takes no caller-defined authority filters;
- performs no workbook mutation;
- performs no county-data mutation;
- creates no execution authority;
- returns deterministic unique operation IDs already present in the existing
  operation-intent journal;
- does not classify an operation merely from one event row;
- requires later consumers to use the existing strict `read(operationId)` and
  `recover(operationId)` paths for history/integrity classification.

No second operation-intent store is authorized.

No new caller-provided list of "approved deleted IDs" is authority.

### 2. Immutable direct-keep execution authority

A later implementation may add:

`build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js`

This module is read-only.

It derives the immutable direct-keep execution catalog from the existing
certified collapse-only authority and the already-certified direct-keep group
boundary.

The exact authorized groups remain:

`2,4,5,6,7,8,9,10,11,12,13,14,15,16`

The original certified authority SHA remains:

`8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7`

The original certified winner-plan fingerprint remains:

`9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce`

The immutable execution catalog binds, at minimum:

- group number;
- violation number;
- proposed durable key;
- canonical property key;
- certified winner Distress Lead ID;
- certified delete-candidate Distress Lead IDs.

Original historical physical row numbers may be used only to prove the
historically certified winner relationship.

They are never current physical mutation authority after a delete.

Groups 1, 3, and 17 through 22 receive no implementation authority.

### 3. Current residual evidence

A later implementation may add:

`build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`

The module is read-only.

It must reconcile:

- the immutable certified collapse population;
- current live physical `DISTRESS_LEADS` identities;
- current physical row numbers;
- all operation IDs enumerated from the existing intent journal;
- strict `read(...)` / `recover(...)` classification for those operation IDs.

A certified Distress Lead ID may be absent from the live sheet only when all of
the following are true:

1. it is an authorized direct-keep delete candidate;
2. exactly one strict operation history binds that target ID;
3. the operation history binds the exact certified group and winner identity;
4. the terminal journal state is `COLLAPSE_DELETE_VERIFIED`;
5. the recovery classification is `VERIFIED_SUCCESS_JOURNAL`.

Any missing certified ID without that exact evidence fails closed.

Any verified-deleted ID that is physically present again fails closed.

Any unresolved operation containing a delete barrier or uncertain terminal
outcome blocks further collapse execution until separate read-only
reconciliation.

Any verified delete for groups 1, 3, or 17 through 22 fails closed.

Any duplicate live certified Distress Lead ID fails closed.

Any certified immutable identity drift fails closed.

Physical row movement by itself is not drift in the successor residual model.

Current physical row numbers are fresh evidence only.

### 4. Successor execution preflight

A later implementation may add:

`build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`

The successor preflight must be usable:

- before the first direct-keep delete; and
- after any number of independently verified direct-keep deletes.

It must use the immutable direct-keep execution authority plus current residual
evidence rather than rebuilding mutation authority from original physical row
positions.

It must continue to prove:

- scheduler frozen;
- checkpoint frozen;
- exact original authority SHA;
- exact original winner-plan fingerprint;
- current residual membership;
- no unresolved uncertain delete operation;
- no unauthorized missing certified ID;
- no unauthorized deleted-ID reappearance;
- no Groups 17 through 22 execution authority;
- no automatic offer authority.

The existing blocker:

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

remains present throughout the repeatability implementation.

The successor preflight must remain:

`collapseExecutionReady=false`

until a later, separate blocker-retirement increment.

## Lifecycle ordering

The required ordering is now:

1. merge and post-merge certify this design contract;
2. separately implement and offline-test the repeatability successor surfaces;
3. merge and post-merge certify repeatability implementation;
4. rebase/recreate the executor implementation increment from that certified
   successor main authority;
5. implement the bounded maintenance operator and direct-keep executor;
6. merge and post-merge certify executor implementation;
7. only then consider preflight-blocker retirement;
8. only after blocker retirement and separate deployment certification may any
   runtime execution authority be considered.

The currently parked executor implementation branch must not be used to bypass
steps 1 through 3.

## CI lifecycle transition

The completed executor-maintenance-handoff validator remains byte-exact.

In this successor design increment it transitions from active execution to
syntax-only CI preservation.

The new post-delete repeatability design validator becomes the active successor
design validator.

Historical maintenance and runtime-prerequisite lifecycle validators remain
active in this design increment.

A later repeatability implementation lifecycle may transition historical
validators only where their byte-exact implementation-absence assumptions are
directly superseded by a new active lifecycle validator.

## Explicit non-authority

`EXECUTOR_IMPLEMENTATION_AUTHORITY=false`

`MAINTENANCE_OPERATOR_IMPLEMENTATION_AUTHORITY=false`

`REPEATABILITY_RUNTIME_IMPLEMENTATION_AUTHORITY=false`

`COLLAPSE_EXECUTION_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`DEPLOYMENT_AUTHORITY=false`

`EXECUTOR_RPC_EXECUTION_AUTHORITY=false`

`MAINTENANCE_RPC_EXECUTION_AUTHORITY=false`

`PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false`

`GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`CHECKPOINT_MUTATION_AUTHORITY=false`

`CONNECTOR_EXECUTION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Contract markers

`POSTDELETE_REPEATABILITY_CONTRACT_VERSION=1`

`SOURCE_AUTHORITY_SHA=63375a9ef9e5e4fb96484e3f123e7dc4fda2a39a`

`POST_DELETE_REPEATABILITY_CONFLICT_CERTIFIED=true`

`HISTORICAL_FULLROW_MODE=INITIAL_PREDELETE_ONLY`

`HISTORICAL_WINNER_PLAN_MODE=INITIAL_PREDELETE_ONLY`

`HISTORICAL_EXECUTION_PREFLIGHT_MODE=INITIAL_PREDELETE_ONLY`

`INTENT_OPERATION_ID_ENUMERATION_REQUIRED=true`

`INTENT_OPERATION_ID_ENUMERATION_READ_ONLY=true`

`SECOND_OPERATION_INTENT_STORE_AUTHORIZED=false`

`DIRECT_KEEP_EXECUTION_AUTHORITY_REQUIRED=true`

`RESIDUAL_EVIDENCE_REQUIRED=true`

`SUCCESSOR_EXECUTION_PREFLIGHT_REQUIRED=true`

`ORIGINAL_AUTHORITY_SHA_IMMUTABLE=true`

`ORIGINAL_WINNER_PLAN_FINGERPRINT_IMMUTABLE=true`

`CURRENT_PHYSICAL_ROW_IS_EVIDENCE_NOT_IMMUTABLE_AUTHORITY=true`

`MISSING_CERTIFIED_ID_REQUIRES_VERIFIED_DELETE_JOURNAL=true`

`VERIFIED_DELETED_ID_REAPPEARANCE_FAILS_CLOSED=true`

`UNCERTAIN_DELETE_HISTORY_BLOCKS_FURTHER_COLLAPSE=true`

`CALLER_SUPPLIED_DELETED_ID_AUTHORITY=false`

`DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16`

`GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false`

`HANDOFF_VALIDATOR_CI_MODE=SYNTAX_ONLY`

`COLLAPSE_EXECUTION_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`DEPLOYMENT_AUTHORITY=false`

`PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`
