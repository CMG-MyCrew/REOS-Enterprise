# Philadelphia Code Violations — Collapse Execution Boundary v2

## Status

DESIGN ONLY.

Contract identifier:

`CODE_VIOLATION_COLLAPSE_EXECUTION_BOUNDARY_V2`

This contract reconciles the historical collapse-executor design with the
certified post-restoration collapse authority.

It grants no executor implementation, maintenance-gate implementation, RPC,
deployment, production mutation, physical delete, scheduler mutation,
checkpoint mutation, connector execution, Group 3 replay, or automatic-offer
authority.

## Certified source baseline

Current source baseline:

`82cac550317faafce2a76fabb954497b069dcc2e`

The county scheduler remains frozen.

The historical v1 executor and maintenance contracts remain immutable evidence
and are not rewritten by this v2 design.

## Historical v1 authority

Historical executor v1 was designed against:

Collapse authority SHA-256:

`87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee`

Winner-plan fingerprint:

`848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9`

Historical v1 treated Groups 1 and 3 as blocked.

That authority is historical only.

It must not authorize post-restoration collapse execution.

## Current post-restoration authority

Current collapse authority SHA-256:

`8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7`

Current winner-plan fingerprint:

`9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce`

Current certified population:

- 21 duplicate groups;
- 44 duplicate rows;
- 20 eligible groups;
- 42 eligible rows;
- 14 direct-keep groups;
- 6 observation-merge groups;
- 22 delete candidates;
- Group 1 is the sole blocked group;
- historical Group 3 is excluded from collapse authority;
- downstream reference match count is zero.

Group 3 restoration must never be replayed merely to satisfy historical
collapse evidence.

## Current eligible paths

### Direct-keep path

The current direct-keep groups are:

`2,4,5,6,7,8,9,10,11,12,13,14,15,16`

Their certified plan action is:

`KEEP_WINNER_AND_COLLAPSE`

These groups do not require observation-preservation mutation before deletion.

This does not make them executable today.

### Observation-merge path

The current observation-merge groups are:

`17,18,19,20,21,22`

Their certified plan action is:

`MERGE_LATEST_OBSERVATION_THEN_COLLAPSE`

These groups remain additionally blocked until an independently certified
observation-preservation orchestration implementation:

1. derives the exact current winner/latest-observation pair;
2. writes only `Updated At`, `Last Seen At`, and `Connector Run ID`;
3. uses the certified exact-row patch primitive;
4. preserves all identity, lineage, business, formula, and immutable fields;
5. persists a durable preservation receipt;
6. flushes, rereads, and verifies the receipt;
7. is revalidated under the executor-owned outer Database lock.

The existing preservation store is evidence infrastructure only.

Its existence does not grant preservation mutation authority.

## Current implemented prerequisites

The following source prerequisites exist:

- post-restoration winner-plan authority;
- post-restoration execution preflight;
- exact physical-row delete primitive;
- exact physical-cell patch primitive;
- caller-owned Database ScriptLock context;
- durable operation-intent store;
- durable observation-preservation store;
- mutation-exclusion lease runtime recognizing:
  - `CURRENT`
  - `HISTORICAL`
  - `UNKNOWN`

These are prerequisites, not collapse authority.

## Missing runtime prerequisites

The following runtime surfaces remain absent:

- `REOS.CountyCodeViolationCollapseMaintenanceGate`
- `REOS.CountyCodeViolationCollapseExecutor`

No generic collapse execution RPC is authorized.

No implementation may be inferred from the existence of contracts, stores, or
Database primitives.

## Lease compatibility boundary

Source-level lease compatibility is merged.

That does not by itself satisfy the current preflight blocker:

`CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED`

That blocker must remain until a separate deployment/runtime certification
proves that the deployed production runtime contains the certified
CURRENT/HISTORICAL/UNKNOWN compatibility behavior and that current persisted
lease state is safe for transition.

Source merge alone is insufficient.

No generic lease RPC may be introduced merely to remove this blocker.

## Maintenance gate is the next implementation prerequisite

The next executable prerequisite after this design is a bounded collapse
maintenance / writer-quiescence gate.

Its implementation must preserve the historical v1 maintenance safety model and
bind to the current authority pair.

It must prove at minimum:

- Admin authority;
- explicit maintenance-window confirmation;
- current winner fingerprint;
- current collapse authority SHA;
- zero managed county scheduler triggers;
- exact frozen county checkpoint;
- no competing REOS county writer authority;
- explicit manual/external-writer quiescence certification;
- SHA-256-only capability persistence;
- settling interval;
- exact token-bound close;
- same-capability revalidation under the executor-owned outer Database lock;
- no nested ScriptLock;
- no mutation authority of its own.

The maintenance gate must not create, delete, or reinstall scheduler triggers.

## Direct-keep executor boundary

Only after all of the following are separately certified may a future executor
implementation consider the direct-keep path:

1. current lease compatibility is deployed and independently runtime-certified;
2. a current-authority collapse maintenance gate is implemented and certified;
3. operation-intent storage is provisioned and certified for production;
4. the exact current winner plan and complete downstream-reference audit pass;
5. scheduler and checkpoint remain frozen;
6. one exact current maintenance capability is ready before lock acquisition
   and revalidated under the same outer Database lock;
7. the executor creates and rereads a durable operation intent;
8. the target delete candidate is freshly re-resolved under lock;
9. the executor invokes `REOS.Database.deletePhysicalRowExact(...)` at most once;
10. complete residual verification succeeds;
11. operation-intent finalization succeeds;
12. outer lock ownership/finalization completes without uncertainty.

One invocation may delete at most one certified candidate.

A second candidate always requires a new operation ID, new preimages, new
reference audit, new physical re-resolution, and a new executor invocation.

## Observation-merge executor boundary

Groups 17 through 22 require every direct-keep prerequisite plus a verified
durable observation-preservation receipt.

A preservation receipt is necessary but never sufficient by itself.

The executor must independently revalidate the receipt and current winner
postimage under the same outer Database lock before physical deletion.

Until a dedicated preservation orchestration implementation and failure-path
harness are certified, Groups 17 through 22 remain non-executable.

## Current preflight blockers

Both blockers remain mandatory after this design:

`CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED`

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

This design must not edit
`CountyCodeViolationCollapseExecutionPreflight.js`.

### Compatibility blocker release

The compatibility blocker may be changed only in a separate increment after
successful deployment/runtime certification of the lease compatibility
implementation.

Removing it must not remove the executor blocker.

### Executor blocker release

The executor blocker may be changed only in a separate increment after:

- maintenance gate implementation certification;
- executor implementation certification;
- required production store provisioning certification;
- direct-keep failure-path certification;
- deployment certification;
- independent production read-only revalidation.

Observation-merge groups may require a narrower additional blocker until
preservation orchestration is separately certified.

No blocker is removed by this design.

## Historical contract preservation

The following remain historical evidence and must stay byte-unchanged:

- `docs/county-code-violation-collapse-executor-contract-v1.md`
- `scripts/validate-county-code-violation-collapse-executor-contract-v1.js`
- `docs/county-code-violation-collapse-maintenance-quiescence-contract-v1.md`
- `scripts/validate-county-code-violation-collapse-maintenance-quiescence-contract-v1.js`

Historical authority values in those files must not be rewritten to appear
current.

The v2 boundary supersedes their authority selection only for future
post-restoration implementation planning.

## Outcome model

Future executor behavior remains conservative:

- failure before physical-delete invocation:
  `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`
- any uncertain primitive outcome:
  `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`
- any failure after primitive verified deletion but before complete residual
  verification / durable finalization / lock-owner finalization:
  `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`
- only complete verified success:
  `COLLAPSE_DELETE_VERIFIED`

Automatic physical-delete retry is prohibited.

Row recreation is prohibited.

Absence of a candidate after uncertainty is not success evidence.

Read-only reconciliation is required after uncertainty.

## Acquisition safety boundary

Nothing in this contract changes acquisition offer authority.

Automatic MAO/offer authority remains prohibited unless both:

1. comp-supported ARV exists; and
2. an adequate repair scope exists.

Collapse execution never satisfies either requirement.

## Explicit non-authority

`COLLAPSE_EXECUTION_BOUNDARY_V2_DESIGN_ONLY=true`

`COLLAPSE_MAINTENANCE_IMPLEMENTATION_PRESENT=false`

`COLLAPSE_EXECUTOR_IMPLEMENTATION_PRESENT=false`

`LEASE_COMPATIBILITY_PREFLIGHT_BLOCKER_REMOVED=false`

`COLLAPSE_EXECUTOR_PREFLIGHT_BLOCKER_REMOVED=false`

`COLLAPSE_EXECUTION_READY=false`

`COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false`

`PHYSICAL_DELETE_AUTHORITY_GRANTED=false`

`PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false`

`SCHEDULER_MUTATION_AUTHORITY_GRANTED=false`

`CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false`

`CONNECTOR_EXECUTION_AUTHORITY_GRANTED=false`

`GROUP3_REEXECUTION_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`

The county scheduler freeze remains mandatory.

## Next implementation order

After this design is separately certified and merged:

1. implement and certify the current-authority collapse maintenance gate;
2. deploy/revalidate lease compatibility without granting collapse authority;
3. design/implement the direct-keep executor path;
4. separately implement observation-preservation orchestration for Groups
   17–22;
5. only then consider controlled preflight-blocker transitions.

No later step is authorized merely by completion of an earlier step.
