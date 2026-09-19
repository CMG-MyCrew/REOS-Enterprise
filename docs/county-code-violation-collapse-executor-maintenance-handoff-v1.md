# County code-violation collapse executor maintenance-capability handoff v1

Status: DESIGN ONLY. TWO-STAGE EXECUTION TOPOLOGY.

This contract resolves the implementation topology between the already-certified
direct-keep executor implementation handoff and the already-certified collapse
maintenance gate.

It does not implement the executor.

It does not implement a maintenance operator.

It does not authorize deployment, RPC execution, collapse execution, physical
deletion, county-data mutation, scheduler restoration, checkpoint mutation,
connector execution, automatic MAO, or automatic offers.

## Certified source authority

Source authority:

`b6930db5a59a62c53d055aee5574b3ca3339f07d`

Direct-keep executor implementation authorization is active only for:

`2,4,5,6,7,8,9,10,11,12,13,14,15,16`

Groups 17 through 22 remain outside implementation authority.

The current production preflight blocker remains:

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

## Reconciled topology problem

The historical executor contract defines exactly six caller selector /
confirmation fields:

1. `confirmExecution`
2. `groupNumber`
3. `deleteDistressLeadId`
4. `expectedWinnerDistressLeadId`
5. `expectedPlanFingerprintSha256`
6. `expectedAuthoritySha256`

The certified maintenance gate requires the exact active capability:

- `maintenanceToken`
- `expectedLeaseId`
- `expectedGateId`

The shared county mutation-exclusion lease requires a mandatory settling period
of exactly 600000 milliseconds between open and owner readiness.

The raw maintenance token exists only at capability-open time and is not exposed
by read-only maintenance status.

Therefore a bounded later executor implementation must not:

- invent a token;
- persist a raw maintenance token in a new durable store;
- infer readiness from lease status alone;
- bypass the settling interval;
- broaden the historical six-field selector object silently;
- keep one Apps Script mutation invocation artificially open solely to bridge
  the settling interval;
- replay maintenance capability creation automatically.

A separately certified two-stage operator handoff is required.

## Future maintenance operator source shape

A later implementation increment may add exactly one bounded transport module:

`build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js`

The operator may expose exactly these top-level RPCs:

`reosCountyCodeViolationCollapseMaintenanceOpen(options)`

`reosCountyCodeViolationCollapseMaintenanceStatus()`

`reosCountyCodeViolationCollapseMaintenanceClose(options)`

The operator must delegate all durable state ownership to:

`REOS.CountyCodeViolationCollapseMaintenanceGate`

It must not use `PropertiesService` directly.

It must not implement a second lease store.

It must not mutate county data.

It must not invoke the collapse executor.

### Open request

Open options are exactly:

- `confirmMaintenanceWindow`
- `confirmManualExternalWritersQuiescent`
- `expectedWinnerPlanFingerprintSha256`
- `expectedAuthoritySha256`

The operator delegates them unchanged to:

`REOS.CountyCodeViolationCollapseMaintenanceGate.open(...)`

The returned capability may contain the existing gate result including the raw
`maintenanceToken`, `leaseId`, `gateId`, `notBefore`, and `expiresAt`.

The token is transient operator-held capability material.

The token must not be logged, committed, returned by status, hashed into source,
or copied into any new durable store.

### Status request

Status is read-only and takes no caller-defined authority fields.

It delegates to:

`REOS.CountyCodeViolationCollapseMaintenanceGate.status()`

Status must not expose the raw maintenance token.

### Close request

Close options are exactly:

- `confirmClose`
- `maintenanceToken`
- `expectedLeaseId`
- `expectedGateId`

The operator delegates them to:

`REOS.CountyCodeViolationCollapseMaintenanceGate.close(...)`

Close is an explicit operator action.

The future executor must not automatically close a maintenance capability after
an uncertain delete outcome.

## Future executor request v2

The historical six selector fields remain semantically unchanged.

The future direct-keep executor request v2 may additionally carry exactly the
three transient maintenance-capability fields:

- `maintenanceToken`
- `expectedMaintenanceLeaseId`
- `expectedMaintenanceGateId`

The complete future executor request is therefore exactly nine fields:

1. `confirmExecution`
2. `groupNumber`
3. `deleteDistressLeadId`
4. `expectedWinnerDistressLeadId`
5. `expectedPlanFingerprintSha256`
6. `expectedAuthoritySha256`
7. `maintenanceToken`
8. `expectedMaintenanceLeaseId`
9. `expectedMaintenanceGateId`

These three additional fields are capability transport, not independent
collapse authority.

Unknown request fields fail closed.

## Required execution sequence

A future operator-driven direct-keep execution sequence is:

1. run the read-only collapse preflight;
2. require the separately retired executor blocker and future
   `collapseExecutionReady=true`;
3. rebuild the exact certified winner plan;
4. select exactly one direct-keep group and one delete candidate;
5. explicitly open the certified maintenance capability;
6. return the transient capability to the operator;
7. perform no county-data mutation before `notBefore`;
8. after `notBefore`, invoke the executor with the exact nine-field request;
9. acquire exactly one outer `REOS.Database.withScriptLockContext(...)`;
10. revalidate the same maintenance capability under that exact lock through
    `REOS.CountyCodeViolationCollapseMaintenanceGate.assertReady(...)`;
11. persist and read back the durable operation intent;
12. perform complete current downstream-reference clearance;
13. re-resolve exact physical winner/delete/group evidence;
14. persist `DELETE_INVOCATION_STARTED` immediately before the primitive;
15. invoke `REOS.Database.deletePhysicalRowExact(...)` at most once;
16. perform complete residual and downstream-reference verification;
17. persist `POSTDELETE_VERIFIED`;
18. persist the exact terminal outcome;
19. release the outer Database lock;
20. keep maintenance closure a separate explicit operator decision.

## Uncertain-outcome boundary

Once `DELETE_INVOCATION_STARTED` has been durably persisted:

- no automatic physical-delete retry is permitted;
- no row recreation is permitted;
- no second delete is permitted;
- any primitive uncertainty is
  `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`;
- any post-delete verification failure is
  `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`;
- any intent-finalization uncertainty is
  `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`.

An uncertain result does not authorize automatic maintenance close.

It routes to read-only reconciliation.

## Current implementation boundary

This contract authorizes only the topology needed by a later local source
implementation increment.

It does not authorize adding the maintenance operator or executor in this
three-file design increment.

The future implementation increment must atomically add:

- the bounded maintenance operator;
- the direct-keep executor;
- offline maintenance-operator tests;
- offline executor failure-path tests;
- an implementation lifecycle validator;
- county runtime integration inventory changes;
- CI lifecycle transition.

Historical implementation-absent validators remain byte-exact.

The completed executor implementation-authorization validator is also
historical evidence at this successor handoff boundary. Its source remains
byte-exact and syntax-checked, but it must no longer execute as an active CI
lifecycle validator because its certified purpose includes proving the exact
three-file authorization increment scope.

Accordingly, this maintenance-handoff increment transitions:

`scripts/validate-county-code-violation-collapse-executor-implementation-authorization-v1.js`

from active execution to syntax-only CI preservation.

This transition does not weaken its historical evidence and does not authorize
executor source, deployment, collapse execution, or physical deletion.

When implementation source is later added, the remaining historical validators
that require executor absence may become syntax-only in CI only under the new
executor implementation lifecycle validator.

## Explicit non-authority

`COLLAPSE_EXECUTION_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`DEPLOYMENT_AUTHORITY=false`

`MAINTENANCE_RPC_EXECUTION_AUTHORITY=false`

`EXECUTOR_RPC_EXECUTION_AUTHORITY=false`

`PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false`

`GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`CHECKPOINT_MUTATION_AUTHORITY=false`

`CONNECTOR_EXECUTION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Contract markers

`EXECUTOR_MAINTENANCE_HANDOFF_VERSION=1`

`SOURCE_AUTHORITY_SHA=b6930db5a59a62c53d055aee5574b3ca3339f07d`

`MAINTENANCE_SETTLE_MS=600000`

`EXECUTOR_SELECTOR_FIELD_COUNT=6`

`MAINTENANCE_CAPABILITY_FIELD_COUNT=3`

`EXECUTOR_V2_REQUEST_FIELD_COUNT=9`

`MAINTENANCE_OPERATOR_REQUIRED=true`

`TWO_STAGE_OPERATOR_HANDOFF_REQUIRED=true`

`AUTHORIZATION_VALIDATOR_CI_MODE=SYNTAX_ONLY`

`AUTHORIZATION_VALIDATOR_BYTE_EXACT=true`

`RAW_MAINTENANCE_TOKEN_DURABLE_PERSISTENCE=false`

`AUTOMATIC_MAINTENANCE_CLOSE_AFTER_UNCERTAIN=false`

`AUTHORIZED_EXECUTOR_SCOPE=DIRECT_KEEP_ONLY`

`DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16`

`OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22`

`GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false`

`COLLAPSE_EXECUTION_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`DEPLOYMENT_AUTHORITY=false`

`PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`
