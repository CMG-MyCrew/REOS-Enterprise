# County code-violation collapse executor contract v1

Status: DESIGN ONLY. No executor implementation, RPC, deployment, or production execution authority.

## Certified baseline

- Base commit: 6ac59ad157cf495e21539ecc832af8bf5def1107
- Winner-plan mode: READ_ONLY_CODE_VIOLATION_COLLAPSE_WINNER_PLAN
- Winner-plan fingerprint: 848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9
- Collapse authority SHA-256: 87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee
- Eligible groups: 20
- Eligible rows: 42
- Direct-keep groups: 14
- Observation-merge groups: 6
- Delete candidates: 22
- Blocked groups: 1 and 3
- Observation-merge groups: 17, 18, 19, 20, 21, and 22
- Certified physical-delete primitive: REOS.Database.deletePhysicalRowExact
- Primitive verified success: DELETED_VERIFIED
- Primitive precondition failure: PHYSICAL_DELETE_PRECONDITION_FAILED
- Primitive uncertain outcome: PHYSICAL_DELETE_OUTCOME_UNCERTAIN
- Current preflight blocker: CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE

Contract-Marker: EXECUTOR_CONTRACT_VERSION=1
Contract-Marker: EXECUTOR_BASE_SHA=6ac59ad157cf495e21539ecc832af8bf5def1107
Contract-Marker: WINNER_PLAN_FINGERPRINT=848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9
Contract-Marker: COLLAPSE_AUTHORITY_SHA=87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee
Contract-Marker: EXECUTOR_INVOCATION_SCOPE=ONE_GROUP_ONE_DELETE_CANDIDATE
Contract-Marker: PHYSICAL_DELETE_CALLS_PER_INVOCATION=AT_MOST_ONE
Contract-Marker: BLOCKED_GROUPS=1,3
Contract-Marker: OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22
Contract-Marker: RPC_AUTHORITY=false
Contract-Marker: DEPLOYMENT_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: SCHEDULER_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: CONNECTOR_EXECUTION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

## Responsibility boundary

The executor is the county-specific authority layer between the certified
read-only winner plan / execution preflight and the certified one-row physical
delete primitive.

The primitive proves only that one exact physical row still matches one exact
preimage under a valid caller-owned lock context. It does not decide collapse
membership, winner identity, observation preservation, reference clearance,
scheduler state, residual state, or whether another deletion is authorized.

The executor must not infer authority from a caller boolean, a row number, a
matching fingerprint by itself, a primitive success result, or the absence of a
candidate row.

The executor must not broaden the certified cohort. Groups 1 and 3 are always
rejected by v1. Only a group present in the exact certified winner plan may be
considered.

## Invocation scope

One executor invocation may target exactly one certified eligible group and
exactly one certified delete candidate from that group.

One invocation may call
`REOS.Database.deletePhysicalRowExact(...)` at most once.

A group with more than one delete candidate requires a new executor invocation
for every additional physical deletion. Primitive success never grants authority
for a second delete.

A new invocation must perform a new preflight, create a new operation intent,
re-resolve physical identity, recheck references, and certify the new residual
state before another delete can be considered.

The intended future executor API is design-only:

`REOS.CountyCodeViolationCollapseExecutor.execute(request)`

The intended future Apps Script RPC is reserved but not authorized:

`reosCountyCodeViolationCollapseExecute(request)`

No executor module or RPC may be added by this design gate.

## Request is a selector, not authority

A future request may identify only the intended certified operation. It must not
define the population or mutation evidence.

The request contract must contain only:

- `confirmExecution`
- `groupNumber`
- `deleteDistressLeadId`
- `expectedWinnerDistressLeadId`
- `expectedPlanFingerprintSha256`
- `expectedAuthoritySha256`

Unknown fields fail closed.

`confirmExecution` must equal the exact implementation-time confirmation token
defined by the future implementation contract. The token is intent evidence, not
independent authority.

`groupNumber`, `deleteDistressLeadId`, and `expectedWinnerDistressLeadId` must
resolve exactly to one current entry in the certified plan. The executor derives
all physical row numbers, headers, geometry, values, formulas, observation
requirements, and reference evidence itself.

## Required certified preflight

Before acquiring mutation authority, the future executor must invoke the
certified collapse execution preflight and require all of the following:

- `ok === true`;
- `winnerPlanCertified === true`;
- `physicalDeletePrimitiveAvailable === true`;
- `schedulerFrozen === true`;
- `checkpointFrozen === true`;
- winner-plan fingerprint exactly
  `848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9`;
- authority SHA exactly
  `87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee`;
- 20 eligible groups / 42 eligible rows;
- 14 direct-keep groups / 6 observation-merge groups;
- 22 delete candidates / 2 blocked groups;
- all execution and mutation authority flags remain false.

The current blocker `CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE` is expected at the
design baseline. A future implementation must not edit the preflight to remove
that blocker until the executor implementation and its dependencies have been
separately certified.

## Certified winner binding

The executor must rebuild the winner plan from certified evidence rather than
trust caller-supplied plan data.

The selected group must exactly match the certified plan's:

- group number;
- violation number;
- proposed durable key;
- canonical property key;
- winner Distress Lead ID;
- action;
- delete-candidate membership.

The winner Distress Lead ID is immutable operation identity for the survivor.
Original plan row numbers are evidence only and are never reused as current
physical row authority after any prior deletion.

## Observation-preservation sequencing

Direct-keep groups may proceed to deletion only when the certified plan action is
`KEEP_WINNER_AND_COLLAPSE` and no observation preservation is required.

Groups 17 through 22 have plan action
`MERGE_LATEST_OBSERVATION_THEN_COLLAPSE`.

For those groups, physical deletion is prohibited until a separately certified
observation-preservation operation has:

1. bound the exact winner and latest-observation source identities;
2. used a complete field mapping that is broader than the winner-plan summary;
3. captured exact winner preimage values and formulas;
4. written only the authorized preservation fields;
5. read back the full winner row;
6. verified the exact winner postimage;
7. persisted and read back a preservation receipt/fingerprint;
8. left canonical property identity, lineage identity, and Distress Lead ID
   unchanged.

The collapse executor consumes the certified preservation receipt; it does not
treat `latestObservation` summary fields as a complete write payload.

No observation-preservation implementation is authorized by this contract.
Until that separate preservation contract, storage, mapping, implementation,
and receipt are certified, groups 17 through 22 remain non-executable.

## Durable operation intent and preimages

Before the physical-delete primitive can be invoked, a durable operation-intent
record must already exist and must be read back successfully.

The intent must contain or cryptographically bind at minimum:

- contract version and executor implementation version;
- operation ID;
- creation timestamp;
- exact winner-plan fingerprint and collapse authority SHA;
- group number, violation number, durable key, and canonical property key;
- winner Distress Lead ID;
- target delete Distress Lead ID;
- current spreadsheet ID and sheet ID;
- current complete headers;
- current sheet last/max row and column geometry;
- current winner physical row number;
- complete winner canonical values and formulas;
- current delete-candidate physical row number;
- complete delete-candidate canonical values and formulas;
- complete residual certified-group membership before mutation;
- complete current downstream-reference audit evidence;
- scheduler/checkpoint frozen snapshot;
- observation-preservation requirement and, when required, preservation receipt;
- the exact primitive request derived from fresh under-lock evidence;
- an integrity SHA-256 over the canonical intent representation.

The durable intent must be persisted before deletion and read back byte-for-byte
or canonical-form equivalent before mutation authority exists.

The storage backend, retention policy, size limits, access rules, immutable-key
behavior, and recovery read path are separate certification prerequisites. No
executor implementation authority exists until that durable-intent storage
contract is independently specified and validated.

## Writer quiescence

ScriptLock coordinates cooperating code but cannot exclude manual edits or
independent writers.

Production executor authority therefore requires a separately certified
collapse-maintenance / writer-quiescence mechanism that proves, at minimum:

- the managed county scheduler has zero active triggers;
- checkpoint state is the exact frozen certified state;
- no competing REOS county mutation path is authorized;
- the collapse operation owns the required maintenance capability;
- the maintenance capability is revalidated under the same outer lock;
- external/manual writer assumptions for the execution window are explicitly
  certified rather than silently assumed.

No maintenance gate is implemented or authorized by this contract.

## Lock ownership and mutation topology

The future executor must own exactly one outer Database ScriptLock context for
the physical mutation phase.

The executor must use the existing non-replayable
`REOS.Database.withScriptLockContext(...)` ownership model.

The executor must not acquire a nested ScriptLock and must not release the
outer lock from inside the primitive.

Inside the active outer lock, the executor must revalidate:

- maintenance / writer-quiescence authority;
- scheduler frozen state;
- checkpoint frozen state;
- spreadsheet and sheet identity;
- complete header schema;
- exact certified group membership still physically present;
- winner identity and canonical property identity;
- candidate unique Distress Lead ID identity;
- complete downstream-reference clearance;
- required preservation receipt and winner postimage;
- current physical geometry;
- operation-intent readback and integrity hash.

Only after all checks succeed may it construct the primitive request from fresh
physical evidence and call the primitive once.

## Complete downstream-reference clearance

Every invocation requires a complete current downstream reference scan for the
selected delete Distress Lead ID.

The scan must be complete and non-truncated.

Any new downstream reference blocks physical deletion.

An incomplete scan, unavailable sheet, ambiguous cell, or reference-audit error
fails closed.

Reference evidence used in the durable operation intent must match the
immediately pre-delete under-lock revalidation.

## Row-shift-aware re-resolution

The executor must never blindly reuse original certified row numbers after a
physical deletion.

For every invocation it must scan fresh physical identity under lock and derive:

- current winner row;
- current delete-candidate row;
- current residual group member rows;
- current sheet geometry.

The primitive request's `expectedRowNumber` and all geometry fields are built
from those fresh values.

After a verified physical deletion, the executor must re-resolve the winner and
all residual group members before classifying executor success.

A three-row group that requires two physical deletions is intentionally split
across two separately authorized executor invocations.

## Post-delete residual certification

Primitive result `DELETED_VERIFIED` is necessary but not sufficient for
executor success.

While lock ownership remains valid, the executor must verify:

- the target Distress Lead ID is absent;
- the winner Distress Lead ID exists exactly once;
- winner canonical property identity is unchanged;
- required preserved observation evidence remains exact;
- every expected residual certified group member exists exactly once;
- no unexpected certified-group member exists;
- physical row geometry reflects exactly one deletion;
- current downstream references do not point to the deleted ID;
- no checkpoint, scheduler, connector, or offer state changed.

Only then may the executor attempt to finalize the operation-intent record as a
verified deletion.

## Outcome model

A failure before invocation of `deletePhysicalRowExact` is definite no-delete:

`COLLAPSE_EXECUTOR_PRECONDITION_FAILED`

If the primitive returns or throws
`PHYSICAL_DELETE_OUTCOME_UNCERTAIN`, the executor outcome is:

`COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`

If the primitive returns `DELETED_VERIFIED` but any later residual verification,
intent finalization, outer-owner flush, or outer-owner release/finalization
fails, the executor outcome is also:

`COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`

Only a primitive `DELETED_VERIFIED` result followed by complete residual
verification and successful durable-intent finalization may return:

`COLLAPSE_DELETE_VERIFIED`

An uncertain outcome is terminal for automatic execution. It requires a
read-only reconciliation process before any additional mutation is considered.

Missing candidate identity is never treated as proof that a prior uncertain
delete succeeded.

The executor must never automatically retry physical deletion, recreate a row,
or claim transactional rollback after the primitive has been invoked.

## Interruption and resume rules

Before primitive invocation, an interrupted operation with no physical mutation
may be safely classified only after durable-intent and live-state comparison.

After primitive invocation, any interruption is uncertain unless the complete
verified-success sequence is independently proven from durable evidence.

A later invocation must not continue from an uncertain operation. It must route
to read-only reconciliation.

Verified deletion of one candidate does not authorize deletion of the next
candidate. The next candidate requires a new operation ID and new preimages.

## Explicitly forbidden executor surfaces

Executor v1 must not:

- mutate county scheduler triggers;
- mutate county checkpoints;
- run county connectors;
- insert new distress leads;
- recreate deleted rows;
- use `Database.update`, `Database.insert`, `Database.upsert`, or
  `Database.softDelete` as physical-collapse shortcuts;
- call `deleteRow`, `deleteRows`, `deleteCells`, or `clearContent` directly;
- select a different winner;
- admit groups 1 or 3;
- broaden the 20-group certified eligible cohort;
- grant repair or migration authority;
- grant automatic offer authority.

The only future physical-row deletion surface available to the executor is the
certified `REOS.Database.deletePhysicalRowExact(...)` primitive.

## Implementation prerequisites still blocked

Executor implementation authority remains blocked until all of these are
separately specified and certified:

1. durable operation-intent/preimage storage and recovery;
2. observation-preservation field mapping, mutation contract, and receipt for
   groups 17 through 22;
3. collapse-maintenance / writer-quiescence authority;
4. executor implementation contract and offline failure-path harness.

This design contract alone grants none of those implementation authorities.

## Release boundary

This document authorizes local contract/design validation only.

It does not authorize an executor implementation.

It does not authorize an Apps Script RPC.

It does not authorize a commit or push.

It does not authorize a pull request.

It does not authorize deployment.

It does not authorize county execution or physical deletion.

It does not authorize production mutation.

It does not authorize scheduler or checkpoint mutation.

It does not authorize connector execution.

It does not authorize automatic offers.
