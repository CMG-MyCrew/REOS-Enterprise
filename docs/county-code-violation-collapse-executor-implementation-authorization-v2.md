# County code-violation collapse executor implementation authorization v2

Status: DESIGN-ONLY SUCCESSOR IMPLEMENTATION AUTHORIZATION HANDOFF.

This contract reconciles the historical executor implementation handoff with
the separately merged and post-merge-certified post-delete repeatability
successor runtime.

It does not implement the collapse executor.

It does not implement the maintenance operator.

It does not authorize collapse execution, physical deletion, deployment,
Apps Script execution, scheduler restoration, checkpoint mutation, connector
execution, automatic MAO, or automatic offers.

## Certified successor source authority

Successor source authority:

`9b0607b923d6f191d0785e2575abe8c831d29c05`

Successor source tree:

`0eefe2801c996f366a95c18550a5a81dde211710`

Certified successor post-merge county-collapse CI run:

`35465872479`

Certified successor post-merge county-collapse CI job:

`105957977946`

The certified successor main includes the merged post-delete repeatability
runtime and its successor-aware observation-preservation reconciliation.

The historical v1 executor implementation authorization remains preserved as
historical evidence and is not rewritten by this increment.

## Successor prerequisite state

The following successor surfaces are already merged and certified:

- deterministic read-only operation-intent `listOperationIds()`;
- immutable direct-keep execution authority;
- current residual evidence;
- successor execution preflight v2;
- repeatability runtime failure-path harness;
- repeatability implementation lifecycle;
- active certified executor blocker.

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` remains mandatory.

The executor and maintenance operator remain absent in this authorization
increment.

## Authorized future source implementation scope

Only after this v2 authorization increment is merged and its post-merge CI is
separately certified may a new implementation branch, created from that
certified successor main, implement and offline-test:

1. the bounded maintenance operator required to establish writer quiescence;
2. the direct-keep collapse executor.

The direct-keep group set is exactly:

`2,4,5,6,7,8,9,10,11,12,13,14,15,16`

Only winner-plan action:

`KEEP_WINNER_AND_COLLAPSE`

may enter the future direct-keep executor implementation scope.

Group 1 remains conflict-blocked.

Historical Group 3 remains excluded.

Groups 17 through 22 remain outside executor implementation authority and
remain bound to the separately gated observation-preservation path.

## Mandatory successor invariants

The later executor implementation must consume the merged successor surfaces
rather than reconstructing authority from historical physical row positions.

It must preserve:

- immutable original collapse authority;
- immutable original winner-plan fingerprint;
- current residual evidence;
- deterministic read-only operation-intent enumeration;
- strict journal recovery for every discovered operation;
- verified-journal evidence for any missing certified Distress Lead ID;
- fail-closed handling of verified-deleted-ID reappearance;
- fail-closed handling of uncertain delete history;
- row-shift-aware physical identity re-resolution;
- durable operation intent before mutation;
- complete winner and delete-candidate preimages;
- complete downstream-reference clearance;
- writer-quiescence / maintenance authority;
- frozen scheduler and checkpoint state;
- at most one exact physical-delete invocation per executor invocation;
- residual-state verification after deletion;
- no automatic physical-delete retry;
- no synthetic rollback claim;
- no automatic second deletion;
- no Groups 17 through 22 execution authority;
- no county scheduler or checkpoint mutation;
- no connector execution;
- no automatic MAO or offer authority.

## CI lifecycle transition

The historical v1 executor implementation authorization validator remains
byte-exact and syntax-only.

The completed executor-maintenance-handoff validator remains byte-exact and
syntax-only.

The completed repeatability implementation lifecycle remains byte-exact and
transitions to syntax-only CI preservation in this increment.

This v2 successor authorization validator becomes the active implementation-
handoff validator.

Historical executor design, maintenance, and runtime-prerequisite safety
artifacts remain byte-exact.

A later executor implementation lifecycle may transition implementation-
absence validators to syntax-only only when a new active executor lifecycle
validator takes over their safety responsibility atomically.

## Preflight blocker boundary

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` must remain present throughout the
future executor implementation increment.

This v2 authorization does not authorize blocker retirement.

Blocker retirement remains a later separate source increment after executor
implementation and failure-path validation have themselves been merged and
post-merge certified.

## Production boundary

This authorization does not authorize:

- deployment;
- executor RPC invocation;
- maintenance RPC invocation;
- collapse execution;
- physical row deletion;
- county-data mutation;
- scheduler restoration;
- checkpoint mutation;
- connector execution;
- Groups 17 through 22 execution;
- preflight-blocker removal;
- automatic MAO;
- automatic offers.

## Contract markers

`EXECUTOR_SUCCESSOR_IMPLEMENTATION_AUTHORIZATION_VERSION=2`

`SOURCE_AUTHORITY_SHA=9b0607b923d6f191d0785e2575abe8c831d29c05`

`SOURCE_AUTHORITY_TREE=0eefe2801c996f366a95c18550a5a81dde211710`

`SOURCE_POST_MERGE_CI_RUN=35465872479`

`SOURCE_POST_MERGE_CI_JOB=105957977946`

`REPEATABILITY_RUNTIME_IMPLEMENTATION_MERGE_CERTIFIED=true`

`HISTORICAL_AUTHORIZATION_V1_PRESERVED=true`

`AUTHORIZED_EXECUTOR_SCOPE=DIRECT_KEEP_ONLY`

`DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16`

`OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22`

`CONFLICT_BLOCKED_GROUP=1`

`HISTORICAL_GROUP_3_EXCLUDED=true`

`SUCCESSOR_INTENT_ENUMERATION_REQUIRED=true`

`SUCCESSOR_RESIDUAL_EVIDENCE_REQUIRED=true`

`SUCCESSOR_PREFLIGHT_V2_REQUIRED=true`

`POST_MERGE_LOCAL_EXECUTOR_IMPLEMENTATION_HANDOFF=true`

`POST_MERGE_LOCAL_MAINTENANCE_OPERATOR_IMPLEMENTATION_HANDOFF=true`

`HANDOFF_EFFECTIVE_ONLY_AFTER_MERGE_AND_POSTMERGE_CI=true`

`EXECUTOR_IMPLEMENTATION_AUTHORITY=false`

`MAINTENANCE_OPERATOR_IMPLEMENTATION_AUTHORITY=false`

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

## Release boundary

This three-file authorization increment may be locally validated, committed,
pushed, reviewed, merged, and post-merge certified through separate gates.

No executor source or maintenance-operator source may be added in this
increment.
