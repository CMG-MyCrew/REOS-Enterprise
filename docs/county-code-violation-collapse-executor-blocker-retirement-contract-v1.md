# County code-violation collapse executor blocker-retirement contract v1

Status: DESIGN-ONLY BLOCKER-RETIREMENT AUTHORIZATION HANDOFF.

This contract authorizes a later source implementation increment to retire only
the successor executor-availability blocker after the direct-keep executor and
its failure-path validation have been merged and post-merge certified.

This contract does not remove the blocker.

This contract does not modify either execution preflight.

This contract does not modify the executor or maintenance operator.

This contract does not authorize deployment, Apps Script execution, RPC
execution, physical deletion, county-data mutation, scheduler restoration,
checkpoint mutation, Groups 17 through 22 execution, automatic MAO, or
automatic offers.

## Certified source authority

Source main:

`5ed9766fe4f06b9c3e1c665a08d9212fb8617800`

Source tree:

`3bc32b52da3021967505000e984539c47fd8631b`

Certified post-merge county-collapse CI run:

`35469351737`

Certified post-merge county-collapse CI job:

`105967356971`

The source authority contains the merged direct-keep executor implementation,
bounded maintenance operator, executor failure-path runtime, successor
implementation lifecycle, operation-intent safety inheritance, and protected
county-writer exclusion safety inheritance.

## Current blocker state

The successor preflight currently initializes its execution-blocker set with:

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

The successor preflight currently reports:

`collapseExecutionReady=false`

even when no unresolved operation history exists.

The historical v1 execution preflight also contains
`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` and remains historical evidence.

The historical preflight must remain byte-exact during the future blocker
retirement implementation.

## Certified blocker inventory

The certified source main contains exactly 43 textual references to
`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` across build, validator, documentation, workflow, and historical
contract surfaces.

Six currently active workflow validators contain that text at the source
authority:

1. `scripts/validate-county-code-violation-post-restoration-collapse-authority-contract-v1.js`
2. `scripts/validate-county-code-violation-collapse-execution-preflight-v1.js`
3. `scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js`
4. `scripts/validate-county-code-violation-collapse-executor-runtime-v1.js`
5. `scripts/validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js`
6. `scripts/validate-county-collapse-operation-intent-orphan-binding-recovery-contract-v1.js`

Blocker text alone does not imply that every one of these validators becomes
obsolete.

The historical post-restoration authority validator, historical execution
preflight validator, and orphan-binding recovery contract may continue to
validate historical evidence containing the blocker.

The executor runtime remains valuable after retirement because it verifies
that the executor fails closed whenever any successor preflight reports an
execution blocker.

## Authorized future blocker-retirement implementation

Only after this contract increment is merged and its post-merge CI is
separately certified may a new blocker-retirement implementation branch alter
the current successor execution-readiness boundary.

That later implementation is bounded to exactly four source-control surfaces:

1. modify
   `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`;
2. add
   `scripts/validate-county-code-violation-collapse-executor-blocker-retirement-runtime-v1.js`;
3. add
   `scripts/validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js`;
4. modify
   `.github/workflows/county-collapse-offline.yml`.

The later implementation may remove only
`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` from the successor preflight's initial blocker set.

It may replace the successor preflight's unconditional
`collapseExecutionReady=false` with readiness derived exclusively from the
remaining blocker set.

The resulting readiness rule must be equivalent to:

`collapseExecutionReady = executionBlockers.length === 0`

This readiness is a preflight state only. It does not itself grant deployment,
RPC, production invocation, or automatic execution authority.

## Mandatory retained blockers and safety rules

`UNRESOLVED_COLLAPSE_OPERATION_HISTORY` must remain fail-closed.

Any unresolved or uncertain operation-intent history must continue to force:

`collapseExecutionReady=false`

The following must remain required and fail-closed:

- exact immutable collapse authority SHA;
- exact winner-plan fingerprint;
- direct-keep groups exactly 2,4,5,6,7,8,9,10,11,12,13,14,15,16;
- Group 1 conflict exclusion;
- historical Group 3 exclusion;
- Groups 17 through 22 exclusion;
- deterministic operation-intent enumeration;
- current residual evidence;
- verified-deleted-ID reconciliation;
- uncertain operation history rejection;
- frozen scheduler;
- frozen checkpoint;
- writer quiescence / maintenance readiness;
- exact under-lock identity re-resolution;
- complete preimages;
- complete downstream-reference clearance;
- durable intent before mutation;
- one delete candidate per invocation;
- at most one physical-delete call per invocation;
- post-delete residual verification;
- no automatic retry;
- no synthetic rollback claim;
- no automatic second delete;
- no automatic maintenance close;
- no scheduler/checkpoint mutation;
- no connector execution;
- no automatic MAO or offer authority.

## Executor and maintenance source boundary

The future blocker-retirement implementation must not modify:

- `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js`;
- `build/apps-script-brand/CountyCollapseOperationIntentStore.js`;
- `build/apps-script-brand/Database.js`.

No executor RPC may be introduced.

No maintenance RPC may invoke the executor.

The existing maintenance open/status/close transport remains separate from
executor invocation authority.

## Validator lifecycle transition

The current direct-keep executor runtime remains active.

The current operation-intent store runtime remains active.

The current protected-writer lease/runtime coverage remains active through the
successor safety lifecycle.

During this contract increment, the completed direct-keep executor
implementation lifecycle remains actively replayed against the exact certified
PR #209 merged source main:

`5ed9766fe4f06b9c3e1c665a08d9212fb8617800`

The replay preserves that lifecycle's original six-file implementation-scope
proof and its inherited operation-intent and protected-writer safety coverage
without modifying the historical lifecycle source.

The county runtime integration validator must apply the same replay rule when
its component-certification inventory reaches the completed executor
implementation lifecycle. It must execute that historical lifecycle against
the exact certified PR #209 merged source:

`5ed9766fe4f06b9c3e1c665a08d9212fb8617800`

with exact certified tree:

`3bc32b52da3021967505000e984539c47fd8631b`

It must not execute the historical lifecycle against the cumulative
blocker-retirement contract tree.

This county runtime integration change is validator orchestration only. It
must not alter any production Apps Script allowlist, production file inventory,
county mutation authority, collapse authority, deployment authority, scheduler
authority, checkpoint authority, connector authority, MAO authority, or offer
authority.

The post-delete repeatability runtime and current executor implementation
lifecycle may transition to syntax-only only when the new blocker-retirement
implementation lifecycle takes over every still-relevant safety responsibility
atomically.

Historical validators and contracts remain byte-exact unless the later
blocker-retirement implementation contract explicitly identifies them as an
authorized source change.

## Production boundary

Even after the later blocker-retirement source implementation is merged and
post-merge certified, the following remain separate future gates:

- deployment certification;
- Apps Script production deployment;
- executor invocation authority;
- maintenance invocation authority;
- physical collapse execution;
- physical row deletion;
- scheduler restoration;
- checkpoint mutation;
- Groups 17 through 22 execution;
- automatic MAO;
- automatic offers.

## Contract markers

`EXECUTOR_BLOCKER_RETIREMENT_CONTRACT_VERSION=1`

`SOURCE_MAIN_SHA=5ed9766fe4f06b9c3e1c665a08d9212fb8617800`

`SOURCE_MAIN_TREE=3bc32b52da3021967505000e984539c47fd8631b`

`SOURCE_POST_MERGE_CI_RUN=35469351737`

`SOURCE_POST_MERGE_CI_JOB=105967356971`

`EXECUTOR_IMPLEMENTATION_POST_MERGE_CERTIFIED=true`

`EXECUTOR_FAILURE_PATH_VALIDATION_POST_MERGE_CERTIFIED=true`

`SOURCE_BLOCKER_REFERENCE_COUNT=43`

`SOURCE_ACTIVE_BLOCKER_VALIDATOR_COUNT=6`

`CURRENT_BLOCKER=CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

`AUTHORIZED_RETIREMENT_TARGET=SUCCESSOR_PREFLIGHT_V2_ONLY`

`HISTORICAL_PREFLIGHT_RETENTION_REQUIRED=true`

`UNRESOLVED_OPERATION_HISTORY_BLOCKER_REQUIRED=true`

`FUTURE_RETIREMENT_IMPLEMENTATION_SCOPE_FILE_COUNT=4`

`POST_MERGE_BLOCKER_RETIREMENT_IMPLEMENTATION_HANDOFF=true`

`HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true`

`EXECUTOR_IMPLEMENTATION_LIFECYCLE_REPLAY_REQUIRED=true`

`EXECUTOR_IMPLEMENTATION_LIFECYCLE_REPLAY_SOURCE=5ed9766fe4f06b9c3e1c665a08d9212fb8617800`

`COUNTY_RUNTIME_INTEGRATION_LIFECYCLE_REPLAY_REQUIRED=true`

`COUNTY_RUNTIME_INTEGRATION_LIFECYCLE_REPLAY_SOURCE=5ed9766fe4f06b9c3e1c665a08d9212fb8617800`

`COUNTY_RUNTIME_INTEGRATION_LIFECYCLE_REPLAY_TREE=3bc32b52da3021967505000e984539c47fd8631b`

`COUNTY_RUNTIME_INTEGRATION_REPLAY_SHA256=02756b3f8f646ce0f4280f16f68afbdd44887da0078b92fa6c54e9daf9fe51c5`

`CONTRACT_INCREMENT_SCOPE_FILE_COUNT=4`

`COUNTY_RUNTIME_INTEGRATION_PRODUCTION_AUTHORITY_CHANGE=false`

`EXECUTOR_SOURCE_MODIFICATION_AUTHORITY=false`

`MAINTENANCE_OPERATOR_SOURCE_MODIFICATION_AUTHORITY=false`

`HISTORICAL_PREFLIGHT_MODIFICATION_AUTHORITY=false`

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

This contract increment may contain exactly four files:

1. this contract;
2. its validator;
3. county-collapse offline workflow registration;
4. county runtime integration validator orchestration.

The county runtime integration change is restricted to certified historical
executor-lifecycle replay orchestration and may not change production runtime
inventory or production authority.

No blocker may be removed in this increment.
