# County code-violation collapse executor safety-correction authorization v1

Status: DESIGN-ONLY CORRECTIVE SAFETY IMPLEMENTATION AUTHORIZATION HANDOFF.

This contract does not modify the collapse executor.

This contract does not remove the certified executor blocker.

This contract does not authorize collapse execution, physical deletion,
deployment, Apps Script execution, maintenance RPC execution, scheduler
restoration, checkpoint mutation, connector execution, automatic MAO, or
automatic offers.

Its sole purpose is to authorize a later, separate source increment that
corrects three fail-closed executor readiness gaps discovered after PR #210
merged and was post-merge certified.

## Certified source authority

Source main:

`dc19ab42fa9faf63b3db327598e32da6844de733`

Source tree:

`78db590eeae0c2fc64da4d4be29896e1f4980159`

Certified post-merge county-collapse CI run:

`35472367580`

Certified post-merge county-collapse CI job:

`105975528204`

Current blocker:

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

PR #210 blocker-retirement contract merge and post-merge certification are
accepted as source evidence.

The blocker-retirement implementation handoff exists, but blocker retirement
is suspended until the three corrective executor safety gaps below are fixed,
merged, and separately post-merge certified.

## Confirmed runtime-readiness gaps

The read-only post-PR-210 runtime-readiness audit established exactly three
hard gaps:

1. `TARGET_BOUND_OPERATION_HISTORY_REUSE`
2. `FINAL_MAINTENANCE_REASSERTION`
3. `FINAL_SCHEDULER_CHECKPOINT_REVALIDATION`

### Gap 1 — target-bound operation history reuse

The current operation-intent store creates a new UUID for each prepare.

The current residual evidence requires a missing certified target to bind
exactly one operation history.

The current executor does not reject a new operation when a prior durable
operation history already binds the same still-live
`targetDeleteDistressLeadId`.

Therefore a prior prepared/precondition-failed/no-barrier history followed by a
later successful operation could leave multiple durable histories bound to a
now-missing target and make strict residual reconciliation fail.

The corrective executor must fail closed before creating a new operation
intent whenever any existing durable operation history already binds the
requested target.

This is intentionally stricter than retry.

No existing target-bound operation may be automatically retried, replaced,
deleted, rewritten, merged, or ignored.

A target blocked by prior history requires a separately authorized
reconciliation path.

### Gap 2 — final maintenance readiness

The current executor reasserts maintenance readiness after intent persistence,
then performs another residual/physical/reference refresh.

The corrective executor must reassert CURRENT maintenance readiness again
after the final residual/physical/reference evidence has been validated and
before the irreversible delete barrier is persisted.

### Gap 3 — final scheduler/checkpoint readiness

The current executor re-runs successor preflight after intent persistence,
then performs another residual/physical/reference refresh.

The corrective executor must re-run successor preflight again after that final
evidence refresh and before the irreversible delete barrier is persisted.

## Exact final pre-barrier order

After durable intent is persisted/read back and final residual, physical row,
primitive request, and downstream-reference evidence are proven unchanged, the
corrective executor must perform this final sequence:

1. `requirePreflightReady_()`
2. `maintenanceReady_(request, lockContext)`
3. persist/read back `DELETE_INVOCATION_STARTED`
4. invoke the exact physical-delete primitive at most once

No county-data mutation, reference scan, scheduler mutation, checkpoint
mutation, connector execution, maintenance close, or authority reconstruction
may occur between the final maintenance readiness assertion and the delete
barrier.

The existing uncertain-outcome rule remains unchanged after the barrier.

## Authorized future corrective implementation scope

Only after this authorization increment is merged and its post-merge CI is
separately certified may the corrective implementation modify exactly these
five source-control surfaces:

1. `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`
2. `scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js`
3. `scripts/validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js`
4. `.github/workflows/county-collapse-offline.yml`
5. `scripts/validate-county-runtime-integration.js`

No other source file is authorized.

The successor preflight is explicitly outside this corrective implementation.

The blocker must remain present.

The operation-intent store, residual-evidence module, maintenance gate,
maintenance operator, identity-reference audit, Database primitive and
historical preflight remain byte-exact.

## Historical runtime/lifecycle preservation

The existing direct-keep executor runtime validator:

`scripts/validate-county-code-violation-collapse-executor-runtime-v1.js`

must remain byte-exact.

Because it certifies the pre-correction executor behavior, the later corrective
implementation must replay it against exact certified source main:

`dc19ab42fa9faf63b3db327598e32da6844de733`

rather than rewriting it to manufacture successor authority.

The county-collapse workflow and county runtime integration may be changed
only as needed to perform that certified runtime replay and activate the new
corrective runtime/lifecycle.

The already completed executor implementation lifecycle replay remains
preserved.

The completed PR #210 blocker-retirement contract validator remains byte-exact
and is replayed against PR #210 certified main beginning in this authorization
increment.

## Corrective runtime requirements

The future corrective runtime must prove at minimum:

- zero prior target-bound histories permits normal pre-barrier preparation;
- one prepared-only prior history blocks before new intent creation;
- one precondition-failed prior history blocks before new intent creation;
- uncertain prior history blocks;
- verified prior history cannot authorize another delete;
- no history-blocked case invokes the physical-delete primitive;
- no history-blocked case creates another operation ID;
- final successor preflight occurs after final reference refresh;
- final maintenance readiness occurs after final reference refresh;
- final order is successor preflight, maintenance readiness, durable barrier,
  then at most one delete;
- final maintenance failure produces precondition failure with no barrier and
  no delete;
- final scheduler/checkpoint drift produces precondition failure with no
  barrier and no delete;
- barrier persistence failure prevents delete;
- primitive uncertainty after the barrier remains terminal uncertain;
- no automatic retry;
- no automatic maintenance close;
- no second delete path;
- Groups 17 through 22 remain outside authority.

## Blocker-retirement boundary

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` remains mandatory throughout the corrective implementation.

The corrective increment may not edit
`build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`.

Corrective implementation merge and post-merge certification are prerequisites
for returning to blocker-retirement implementation work.

They do not themselves remove the blocker or grant production execution
authority.

## Contract markers

`EXECUTOR_SAFETY_CORRECTION_AUTHORIZATION_VERSION=1`

`SOURCE_MAIN_SHA=dc19ab42fa9faf63b3db327598e32da6844de733`

`SOURCE_MAIN_TREE=78db590eeae0c2fc64da4d4be29896e1f4980159`

`SOURCE_POST_MERGE_CI_RUN=35472367580`

`SOURCE_POST_MERGE_CI_JOB=105975528204`

`PR_210_POST_MERGE_CERTIFIED=true`

`READINESS_AUDIT_HARD_GAP_COUNT=3`

`READINESS_GAP_1=TARGET_BOUND_OPERATION_HISTORY_REUSE`

`READINESS_GAP_2=FINAL_MAINTENANCE_REASSERTION`

`READINESS_GAP_3=FINAL_SCHEDULER_CHECKPOINT_REVALIDATION`

`CORRECTIVE_EXECUTOR_SAFETY_INCREMENT_REQUIRED=true`

`BLOCKER_RETIREMENT_IMPLEMENTATION_SUSPENDED_PENDING_CORRECTION=true`

`CURRENT_BLOCKER=CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

`BLOCKER_RETIREMENT_CONTRACT_REPLAY_REQUIRED=true`

`BLOCKER_RETIREMENT_CONTRACT_REPLAY_SOURCE=dc19ab42fa9faf63b3db327598e32da6844de733`

`FUTURE_CORRECTIVE_IMPLEMENTATION_SCOPE_FILE_COUNT=5`

`HISTORICAL_EXECUTOR_RUNTIME_REPLAY_REQUIRED=true`

`HISTORICAL_EXECUTOR_RUNTIME_REPLAY_SOURCE=dc19ab42fa9faf63b3db327598e32da6844de733`

`COUNTY_RUNTIME_INTEGRATION_CORRECTIVE_ORCHESTRATION_CHANGE_REQUIRED=true`

`SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false`

`OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false`

`RESIDUAL_EVIDENCE_MODIFICATION_AUTHORITY=false`

`MAINTENANCE_GATE_MODIFICATION_AUTHORITY=false`

`MAINTENANCE_OPERATOR_MODIFICATION_AUTHORITY=false`

`REFERENCE_AUDIT_MODIFICATION_AUTHORITY=false`

`DATABASE_MODIFICATION_AUTHORITY=false`

`CORRECTIVE_EXECUTOR_IMPLEMENTATION_AUTHORITY=false`

`PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false`

`COLLAPSE_EXECUTION_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`DEPLOYMENT_AUTHORITY=false`

`EXECUTOR_RPC_EXECUTION_AUTHORITY=false`

`MAINTENANCE_RPC_EXECUTION_AUTHORITY=false`

`GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`CHECKPOINT_MUTATION_AUTHORITY=false`

`CONNECTOR_EXECUTION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Release boundary

This authorization increment is exactly three files:

1. this document;
2. its validator;
3. county-collapse offline workflow orchestration.

No executor source may change.

No blocker may be removed.

No corrective runtime or lifecycle may exist in this authorization increment.

No production mutation or execution is authorized.
