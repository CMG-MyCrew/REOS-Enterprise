# County code-violation collapse executor blocker-retirement successor authorization v2

Status: DESIGN-ONLY SUCCESSOR BLOCKER-RETIREMENT AUTHORIZATION.

This authorization reconciles the original PR #210 blocker-retirement handoff
with the executor safety correction merged and post-merge certified by PR #212.

This increment does not remove any execution blocker.

This increment does not modify either execution preflight.

This increment does not modify the executor, county runtime integration,
operation-intent store, residual-evidence reader, maintenance gate, maintenance
operator, reference audit, or Database mutation primitive.

## Certified source authority

Source main:

`daefe8f081cb48e6f9f0433c05a267d9d553966d`

Source tree:

`df4fc612ba4b62e05c262f26958fada74416de0c`

Certified post-merge county-collapse CI run:

`35476292232`

Certified post-merge county-collapse CI job:

`105985997256`

PR #212 established the corrective executor invariants:

- target-bound durable operation history fails closed before `store.prepare()`;
- final successor preflight is reasserted after the final evidence refresh;
- final maintenance readiness follows that final preflight;
- the durable delete barrier follows final maintenance readiness;
- exactly one physical-delete call site remains;
- automatic maintenance close remains prohibited.

## Why the original PR #210 four-file handoff is superseded

PR #210 authorized a later retirement implementation bounded to four files:

1. successor preflight v2;
2. blocker-retirement runtime;
3. blocker-retirement implementation lifecycle;
4. county-collapse offline workflow.

After PR #212, that four-file handoff is no longer sufficient.

The PR #212 corrective implementation lifecycle protects the successor preflight
and requires `CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` to remain present.

County runtime integration currently executes that corrective lifecycle directly.

The post-delete repeatability runtime also directly validates the current
blocked successor-preflight state.

Therefore safe retirement now requires a successor implementation boundary of
exactly five files.

## Authorized future successor retirement implementation

Only after this authorization is merged and its post-merge CI is separately
certified may a future blocker-retirement implementation modify exactly:

1. `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`;
2. add `scripts/validate-county-code-violation-collapse-executor-blocker-retirement-runtime-v1.js`;
3. add `scripts/validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js`;
4. modify `.github/workflows/county-collapse-offline.yml`;
5. modify `scripts/validate-county-runtime-integration.js`.

`SUCCESSOR_RETIREMENT_FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=5`

No sixth file is authorized.

The future implementation may remove only:

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

from the successor preflight's initial blocker set.

It may replace unconditional:

`collapseExecutionReady=false`

with readiness equivalent to:

`collapseExecutionReady = executionBlockers.length === 0`

No other execution authority field becomes true merely because readiness becomes
derived from the remaining blockers.

## Mandatory retained execution blockers and invariants

`UNRESOLVED_COLLAPSE_OPERATION_HISTORY` remains mandatory and fail-closed.

The future retirement implementation must inherit all PR #212 corrective
invariants, including:

- target-bound history guard before new intent preparation;
- final successor-preflight reassertion;
- final maintenance-readiness reassertion;
- final barrier ordering;
- deterministic operation-intent enumeration;
- frozen scheduler;
- frozen checkpoint;
- exact authority SHA;
- exact winner-plan fingerprint;
- direct-keep groups exactly 2,4,5,6,7,8,9,10,11,12,13,14,15,16;
- Group 1 conflict exclusion;
- historical Group 3 exclusion;
- Groups 17 through 22 exclusion;
- one delete candidate per invocation;
- at most one physical-delete call;
- no automatic retry;
- no synthetic rollback claim;
- no automatic second delete;
- no automatic maintenance close;
- post-delete residual verification;
- no scheduler/checkpoint mutation;
- no connector execution;
- no automatic MAO;
- no automatic offer authority.

## Validator lifecycle transition during this authorization increment

This design-only authorization increment changes exactly three files:

1. this authorization document;
2. its validator;
3. `.github/workflows/county-collapse-offline.yml`.

During this authorization increment only, the workflow must replay the following
against exact PR #212 merged main `daefe8f081cb48e6f9f0433c05a267d9d553966d` and tree `df4fc612ba4b62e05c262f26958fada74416de0c`:

- `scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js`;
- `scripts/validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js`;
- `scripts/validate-county-runtime-integration.js`.

Those replays prevent a later design-only scope from invalidating validators
whose contracts were certified against the PR #212 state.

`scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js` remains directly active.

The original PR #210 blocker-retirement contract remains historical certified
evidence and remains replayed at its existing certified authority.

## Required future implementation lifecycle transitions

The future five-file retirement implementation must:

1. keep post-delete repeatability on certified PR #212 replay;
2. keep the PR #212 correction lifecycle on certified PR #212 replay;
3. modify county runtime integration to replay the PR #212 correction lifecycle
   at exact PR #212 merged main/tree;
4. reactivate current county runtime integration after that replay support is
   added;
5. activate the new blocker-retirement runtime;
6. activate the new blocker-retirement implementation lifecycle;
7. transition this completed successor authorization validator to certified
   replay at the eventual merged successor-authorization main.

## Protected source boundary

The future retirement implementation must not modify:

- `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js`;
- `build/apps-script-brand/CountyCollapseOperationIntentStore.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js`;
- `build/apps-script-brand/CountyIdentityReferenceAudit.js`;
- `build/apps-script-brand/Database.js`;
- `scripts/validate-county-code-violation-collapse-postdelete-repeatability-runtime-v1.js`;
- `scripts/validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js`;
- `scripts/validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js`;
- the original PR #210 blocker-retirement contract or validator.

Historical and completed validators transition by certified replay, not source
mutation.

## Production boundary

Even after future blocker-retirement source implementation is merged and
post-merge certified, all of the following remain separate future gates:

- deployment;
- Apps Script production deployment;
- executor invocation;
- maintenance invocation;
- physical collapse execution;
- physical row deletion;
- scheduler restoration;
- checkpoint mutation;
- Groups 17 through 22 execution;
- automatic MAO;
- automatic offers.

## Contract markers

`EXECUTOR_BLOCKER_RETIREMENT_SUCCESSOR_AUTHORIZATION_VERSION=2`

`SOURCE_MAIN_SHA=daefe8f081cb48e6f9f0433c05a267d9d553966d`

`SOURCE_MAIN_TREE=df4fc612ba4b62e05c262f26958fada74416de0c`

`SOURCE_POST_MERGE_CI_RUN=35476292232`

`SOURCE_POST_MERGE_CI_JOB=105985997256`

`PR_212_CORRECTIVE_EXECUTOR_POST_MERGE_CERTIFIED=true`

`ORIGINAL_FOUR_FILE_BLOCKER_RETIREMENT_HANDOFF_SUFFICIENT=false`

`SUCCESSOR_RETIREMENT_FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=5`

`SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY_AFTER_POSTMERGE=true`

`FUTURE_RETIREMENT_MAY_REMOVE_ONLY_CERTIFIED_EXECUTOR_AVAILABILITY_BLOCKER=true`

`UNRESOLVED_OPERATION_HISTORY_BLOCKER_REQUIRED=true`

`PR_212_CORRECTION_INVARIANTS_INHERITANCE_REQUIRED=true`

`POSTDELETE_REPEATABILITY_CERTIFIED_REPLAY_REQUIRED=true`

`POSTDELETE_REPEATABILITY_REPLAY_SOURCE=daefe8f081cb48e6f9f0433c05a267d9d553966d`

`POSTDELETE_REPEATABILITY_REPLAY_TREE=df4fc612ba4b62e05c262f26958fada74416de0c`

`CORRECTION_LIFECYCLE_CERTIFIED_REPLAY_REQUIRED=true`

`CORRECTION_LIFECYCLE_REPLAY_SOURCE=daefe8f081cb48e6f9f0433c05a267d9d553966d`

`CORRECTION_LIFECYCLE_REPLAY_TREE=df4fc612ba4b62e05c262f26958fada74416de0c`

`COUNTY_RUNTIME_INTEGRATION_AUTH_INCREMENT_REPLAY_REQUIRED=true`

`COUNTY_RUNTIME_INTEGRATION_AUTH_INCREMENT_REPLAY_SOURCE=daefe8f081cb48e6f9f0433c05a267d9d553966d`

`COUNTY_RUNTIME_INTEGRATION_AUTH_INCREMENT_REPLAY_TREE=df4fc612ba4b62e05c262f26958fada74416de0c`

`FUTURE_COUNTY_RUNTIME_INTEGRATION_MODIFICATION_AUTHORITY=true`

`AUTHORIZATION_INCREMENT_SCOPE_FILE_COUNT=3`

`PREFLIGHT_BLOCKER_REMOVAL_AUTHORIZED=false`

`COLLAPSE_EXECUTION_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`DEPLOYMENT_AUTHORITY=false`

`EXECUTOR_RPC_EXECUTION_AUTHORITY=false`

`MAINTENANCE_RPC_EXECUTION_AUTHORITY=false`

`GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`CHECKPOINT_MUTATION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`
