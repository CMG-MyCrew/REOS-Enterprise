# County physical-row deletion contract v1

Status: DESIGN ONLY. No implementation or production execution authority.

## Original discovery baseline

- Base commit: cff10219fe6c681d72589f5730fa7a28f3eff3dd
- Database.js SHA-256: 6844aa2e8009f2fd01547846206522585bd23093407bc9ee8730806f2974f7a1
- Winner-plan SHA-256: 2080bfa9b4a939cfc15fd10bd4183f179d1392d6004d5ee85c7c23ca0d2a4d8b
- The preflight continues to report physicalDeletePrimitiveAvailable=false
  and collapseExecutionReady=false until separately certified changes.

## Separation of responsibilities

The database primitive must perform at most one physical-row deletion per
call. It must not select a winner, merge observations, run connectors,
advance checkpoints, enable scheduling, or grant offer authority.

The county executor must establish approved cohort membership, winner
identity, observation preservation, complete downstream-reference evidence,
and bounded execution authority before invoking the primitive.

Neither a caller-supplied boolean nor a matching fingerprint alone grants
production deletion authority. The execution-authority mechanism must be
specified and tested before an executor is implemented.

## Lock ownership

- Require a valid caller-owned database lock context before sheet I/O.
- Reject missing, forged, expired, and previously released contexts.
- A context from an earlier callback must remain invalid even if its
  underlying lock object is later reacquired.
- Do not acquire or release a nested lock inside the primitive.
- Recheck ownership immediately before deletion.
- Preserve outer-owner flush and release behavior on every exit.
- ScriptLock coordinates cooperating script executions; it does not
  establish exclusion against manual edits or other script projects.
  Production certification must establish the necessary writer quiescence.

## Physical identity and evidence

- Bind the operation to the intended spreadsheet and sheet identity.
- Reject header rows, invalid row numbers, ambiguous headers, blank IDs,
  duplicate matching IDs, incomplete scans, and changed schema.
- Resolve identity from fresh physical rows under the owned lock.
- Do not use first-match findRowById or compacted getAll positions as proof
  of unique deletion authority.
- Verify the exact candidate ID, expected physical position, and complete
  row evidence using a specified canonical representation.
- Include formulas in the evidence contract; equal displayed values alone
  do not establish equivalent cells.
- Reject identity, content, position, or geometry drift before deletion.
- Do not substitute soft deletion, clearContent, or sheet reconstruction.

## County preservation gates

- The initial certified plan has 20 eligible groups, 42 eligible rows,
  and 22 deletion candidates. These totals are not per-call authority.
- Groups 1 and 3 remain blocked.
- Groups 17 through 22 require preservation of the latest observation
  before any deletion within the corresponding group.
- Verify preserved observations by readback before deleting their source.
- Define the complete observation-field mapping before implementing writes;
  the planner's summary is not a complete mutation payload.
- Do not assume Database.update safely accepts the outer lock context:
  its current implementation acquires and releases its own lock.
- Require complete, current downstream-reference checks for deletion IDs;
  new references, truncated scans, and unresolved conflicts block execution.
- Preserve the winner's lineage and canonical property identity.

## Row shifts and interruption

- Never blindly reuse original plan row numbers after physical deletion.
- Define deterministic deletion order and derive expected remaining
  geometry from verified completed operations.
- Re-resolve candidate and survivor identities before each subsequent call.
- Original full-row cohort evidence may cease to validate after the first
  mutation; define residual-state certification before a multi-call executor.
- Persist a recoverable operation intent and required preimages before
  deletion. Specify storage, integrity, retention, and readback separately.
- A delete call, flush, or evidence-write exception can leave an uncertain
  outcome. Halt and reconcile actual data before another mutation.
- Missing candidate alone is not proof of successful prior deletion.
- Never automatically retry, recreate rows, or claim rollback after an
  uncertain outcome. Preserve the original and cleanup error information.

## Required offline tests before implementation certification

- Valid single deletion affects only the authorized physical row.
- Forged, expired, replayed, and reacquired old contexts fail closed.
- Lock contention and ownership loss cause no deletion.
- Duplicate IDs, sparse rows, header ambiguity, formula drift, wrong sheet,
  stale coordinates, and incomplete evidence fail closed.
- Observation or reference failures cause no deletion.
- Sequential row shifts preserve all intended survivors and unrelated rows.
- Failures before, during, and after deletion produce explicit outcomes;
  uncertain outcomes never trigger a blind retry.
- Existing insert, update, lock-handoff, and sparse-row regressions pass.

## Release boundary

This document does not implement a primitive, executor, or RPC.
PR 134 remains draft. No merge into main, deployment, production mutation,
physical deletion, scheduler change, or automatic offer is authorized.

## Stale lock-context replay blocker (historical)

Physical-row deletion remains blocked until Database lock-context authority is
non-replayable.

Offline certification proved that a context issued by
`REOS.Database.withScriptLockContext()` can become usable again after its
original callback has completed if the underlying ScriptLock is later
reacquired. A stale context must never regain mutation authority merely because
`lock.hasLock()` becomes true again.

Required prerequisite invariant:

- a lock context is valid only inside the originating
  `withScriptLockContext()` callback;
- callback completion permanently revokes that context;
- revocation survives later reacquisition of the same ScriptLock object;
- stale, forged, released, or replayed contexts fail before database I/O;
- physical-row deletion receives no implementation or execution authority
  until this invariant has an independent regression validator.

This blocker was established offline only. No production RPC, production I/O,
or row deletion occurred.

## Lock-context prerequisite resolution (2026-09-14)

Status: RESOLVED OFFLINE ON THE DEVELOPMENT BRANCH.

- Development branch: feat/county-physical-row-delete-contract-v1.
- Merged PR: https://github.com/CMG-MyCrew/REOS-Enterprise/pull/136
- Merge commit: 088c1d7a344c2790c5eacef32573c85c4c3965ec.
- Certified head: 6033e47133da355023275e4b463b19f8bf96993a.
- Database.js SHA-256: ce32381705aedb6c62a0bd4fac9237a51c79209315f92bfcb8277d23c8cee14a.
- Regression validator: scripts/validate-database-lock-context-revocation.js.
- Passing CI run: https://github.com/CMG-MyCrew/REOS-Enterprise/actions/runs/34789632116

The merge tree was verified identical to the certified head. Database now
accepts only exact active context objects and permanently revokes each
context before the outer owner's flush/release cleanup.

The independent offline regression verifies valid in-callback inserts,
rejection of an old context after reacquiring the same ScriptLock, continued
validity of the fresh context, and rejection after callback completion.
The regression is registered in the county collapse offline CI workflow.

This resolves the observed replay prerequisite for this development tree.
Physical-row deletion remains blocked pending a separately specified and
certified primitive/executor and the preservation and recovery gates above.

The original discovery baseline and evidence remain historical records.
The DESIGN ONLY status and all release boundaries above remain in force.
This checkpoint provides no live production certification or execution authority.
