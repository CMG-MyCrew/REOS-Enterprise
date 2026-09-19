# County code-violation collapse executor implementation authorization v1

Status: DESIGN-ONLY IMPLEMENTATION AUTHORIZATION HANDOFF.

This contract does not implement the collapse executor.

This contract does not authorize collapse execution, physical deletion,
deployment, Apps Script execution, scheduler restoration, checkpoint mutation,
connector execution, automatic MAO, or automatic offers.

Its only purpose is to define the source-level handoff under which a later,
separate branch may implement and offline-test the direct-keep collapse
executor.

## Certified source authority

Source authority:

`eb59d8177b3811f3cb40790f363472482d9da4f9`

Source tree:

`e5ed20abdce61ff9bb6f0e03bcc4f1096929496f`

Certified post-merge county-collapse CI run:

`35448266879`

Current winner-plan fingerprint:

`9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce`

Current collapse authority SHA-256:

`8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7`

Current collapse execution blocker:

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

The lease-compatibility blocker has already been retired.

The executor implementation remains absent at this authorization boundary.

## Certified production prerequisite evidence

The existing production deployment version 110 has been independently
certified by read-only status reconciliation.

That certification established:

- `PERSISTED_ORPHAN_BINDING_RECOVERY_CERTIFIED=true`
- `PREREQUISITES_READY_FOR_EXECUTOR_IMPLEMENTATION=true`
- operation-intent workbook SHA-256 =
  `36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c`
- operation-intent schema certified = true
- operation-intent access binding certified = true
- operation-intent event data rows = 0
- operation-intent chunk data rows = 0
- operation-intent initial-empty-store certified = true
- lease state = ABSENT
- lease authority generation = empty
- lease transition safe = true
- all execution and production-mutation authority fields = false

The one-time provisioning RPC must not be replayed.

The orphan-binding recovery RPC must not be replayed.

This production prerequisite evidence is an input to this source-level
authorization handoff. It is not collapse execution authority.

## Authorized future implementation scope

After this authorization contract is merged and its post-merge CI is
separately certified, a new and separate implementation branch may implement
and offline-test the direct-keep executor.

The direct-keep group set is exactly:

`2,4,5,6,7,8,9,10,11,12,13,14,15,16`

The implementation may admit only winner-plan action:

`KEEP_WINNER_AND_COLLAPSE`

Group 1 remains conflict-blocked.

Historical Group 3 remains excluded from collapse execution.

Groups 17 through 22 remain outside this implementation authorization.

Their action is:

`MERGE_LATEST_OBSERVATION_THEN_COLLAPSE`

Those groups require a separately certified observation-preservation
orchestration, complete mapping, mutation sequence, receipt consumption, and
failure-path harness before executor implementation authority may include them.

The existence of the observation-preservation store alone does not authorize
groups 17 through 22.

## Mandatory executor invariants

The later direct-keep implementation must preserve the existing certified
executor contract, including all of the following:

- one group and one delete candidate per invocation;
- at most one call to `REOS.Database.deletePhysicalRowExact(...)`;
- exact current winner-plan fingerprint and collapse authority binding;
- durable operation intent persisted and read back before mutation;
- complete winner and delete-candidate preimages;
- complete downstream-reference clearance;
- writer-quiescence / maintenance authority;
- current scheduler and checkpoint frozen state;
- row-shift-aware physical identity re-resolution;
- fresh under-lock physical geometry;
- exact residual-state verification after deletion;
- terminal uncertain-outcome handling;
- no automatic physical-delete retry;
- no synthetic rollback claim;
- no automatic second deletion;
- no county scheduler or checkpoint mutation;
- no connector execution;
- no automatic MAO or offer authority.

The outcome model remains:

- `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`
- `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`
- `COLLAPSE_DELETE_VERIFIED`

Primitive outcomes remain:

- `DELETED_VERIFIED`
- `PHYSICAL_DELETE_PRECONDITION_FAILED`
- `PHYSICAL_DELETE_OUTCOME_UNCERTAIN`

## Future implementation lifecycle transition

The existing executor design validator, maintenance implementation lifecycle,
and runtime-prerequisite implementation lifecycle currently require the
executor to remain absent.

This authorization increment does not weaken or edit those historical guards.

During the later executor implementation increment, any historical validator
whose purpose is specifically to prove implementation absence must remain
byte-exact and may become syntax-only in CI only as part of an atomic
implementation-lifecycle transition.

A new executor implementation lifecycle validator must then take over the
active CI responsibility for proving:

- the exact direct-keep-only group boundary;
- executor source and RPC source shape;
- failure-path behavior;
- durable-intent sequencing;
- maintenance / writer-quiescence sequencing;
- complete reference clearance;
- row-shift re-resolution;
- one-delete maximum;
- residual verification;
- uncertain-outcome non-replay;
- groups 17 through 22 remain non-executable;
- the preflight blocker remains present;
- production execution authority remains false.

Historical safety contracts and validators must not be deleted or rewritten to
manufacture implementation authority.

## Preflight blocker boundary

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` must remain present throughout the
executor implementation increment.

Adding and locally validating the executor does not authorize removal of that
blocker.

Blocker retirement requires a later separate source increment after the
executor implementation and offline failure-path harness have themselves been
merged and post-merge certified.

## Production boundary

This authorization does not authorize:

- deployment of the executor;
- invocation of the executor RPC;
- collapse execution;
- physical row deletion;
- county-data mutation;
- scheduler restoration;
- checkpoint mutation;
- connector execution;
- Groups 17 through 22;
- removal of `CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`;
- automatic MAO;
- automatic offers.

The county scheduler remains frozen.

## Contract markers

`EXECUTOR_IMPLEMENTATION_AUTHORIZATION_VERSION=1`

`SOURCE_AUTHORITY_SHA=eb59d8177b3811f3cb40790f363472482d9da4f9`

`SOURCE_AUTHORITY_TREE=e5ed20abdce61ff9bb6f0e03bcc4f1096929496f`

`PRODUCTION_PREREQUISITE_DEPLOYMENT_VERSION=110`

`PERSISTED_ORPHAN_BINDING_RECOVERY_CERTIFIED=true`

`PREREQUISITES_READY_FOR_EXECUTOR_IMPLEMENTATION=true`

`AUTHORIZED_EXECUTOR_SCOPE=DIRECT_KEEP_ONLY`

`DIRECT_KEEP_GROUPS=2,4,5,6,7,8,9,10,11,12,13,14,15,16`

`OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22`

`CONFLICT_BLOCKED_GROUP=1`

`HISTORICAL_GROUP_3_EXCLUDED=true`

`POST_MERGE_LOCAL_EXECUTOR_IMPLEMENTATION_HANDOFF=true`

`COLLAPSE_EXECUTION_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`DEPLOYMENT_AUTHORITY=false`

`EXECUTOR_RPC_EXECUTION_AUTHORITY=false`

`PREFLIGHT_BLOCKER_REMOVAL_AUTHORITY=false`

`GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`CHECKPOINT_MUTATION_AUTHORITY=false`

`CONNECTOR_EXECUTION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Release boundary

This three-file authorization increment may be locally validated, committed,
pushed, reviewed, and merged only through later separately certified gates.

Creating this document does not itself authorize the executor implementation
before this increment is merged and its post-merge CI is certified.

No executor source may be added in this increment.

No Apps Script RPC may be invoked.

No production mutation may occur.
