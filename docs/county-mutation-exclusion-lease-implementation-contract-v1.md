# County mutation-exclusion lease implementation contract v1

Status: DESIGN ONLY.

This contract defines the required runtime behavior of the future shared county
mutation-exclusion lease.

It does not create that runtime implementation and grants no production
mutation authority.

## Contract markers

Contract-Marker: COUNTY_MUTATION_EXCLUSION_LEASE_IMPLEMENTATION_CONTRACT_VERSION=1
Contract-Marker: RUNTIME_MODULE=REOS.CountyMutationExclusionLease
Contract-Marker: STATE_KEY=REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON
Contract-Marker: LEASE_SCOPE=REOS_COUNTY_PRODUCTION_MUTATION
Contract-Marker: OWNER_MODE=CODE_VIOLATION_COLLAPSE
Contract-Marker: OWNER_WRITER_ID=CODE_VIOLATION_COLLAPSE_EXECUTOR
Contract-Marker: PROTECTED_WRITER_INVENTORY_VERSION=1
Contract-Marker: SCHEDULER_HANDLER=reosCountyProductionSchedulerRun
Contract-Marker: SETTLE_MS=600000
Contract-Marker: WINDOW_MS=3600000
Contract-Marker: OPEN_REQUIRES_ADMIN=true
Contract-Marker: OPEN_REQUIRES_EXPLICIT_CONFIRMATION=true
Contract-Marker: MANUAL_EXTERNAL_WRITER_CERTIFICATION_REQUIRED=true
Contract-Marker: RAW_TOKEN_PERSISTENCE=false
Contract-Marker: ACTIVE_LEASE_REPLACEMENT=false
Contract-Marker: UNKNOWN_WRITER_FAILS_CLOSED=true
Contract-Marker: MALFORMED_STATE_FAILS_CLOSED=true
Contract-Marker: EXPIRED_LEASE_OWNER_READY=false
Contract-Marker: NO_ACTIVE_LEASE_PRESERVES_EXISTING_WRITER_AUTHORITY=true
Contract-Marker: ACTIVE_COLLAPSE_LEASE_DENIES_NONOWNER_WRITERS=true
Contract-Marker: OWNER_REQUIRES_EXACT_LEASE_GATE_AUTHORITY=true
Contract-Marker: CALLER_OWNED_LOCK_REVALIDATION=true
Contract-Marker: ASSERTIONS_ACQUIRE_SCRIPTLOCK=false
Contract-Marker: OPEN_CLOSE_STATE_TRANSITIONS_ACQUIRE_SCRIPTLOCK=true
Contract-Marker: NESTED_SCRIPTLOCK_AUTHORITY=false
Contract-Marker: LEASE_GRANTS_MUTATION_AUTHORITY=false
Contract-Marker: GENERIC_RPC_AUTHORITY=false
Contract-Marker: DEPLOYMENT_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: PHYSICAL_DELETE_AUTHORITY=false
Contract-Marker: SCHEDULER_MUTATION_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: CONNECTOR_EXECUTION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

## Certified collapse binding

The v1 implementation is hard-bound to the currently certified Philadelphia
code-violation collapse authority.

Winner-plan fingerprint:

`848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9`

Collapse authority SHA-256:

`87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee`

Managed scheduler handler:

`reosCountyProductionSchedulerRun`

Frozen checkpoint:

- cycle ID `COUNTY-20260902222607805`;
- next feed index `0`;
- current feed cursor
  `AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281`;
- completed feeds `0`;
- total feeds `4`;
- results length `0`.

Caller-supplied values may only be compared against these constants.

Caller values cannot manufacture or redefine authority.

## Runtime source

Future source:

`build/apps-script-brand/CountyMutationExclusionLease.js`

Future public module:

`REOS.CountyMutationExclusionLease`

The runtime module must export exactly:

- `openExclusive(options)`
- `assertOwnerReady(options)`
- `assertWriterAllowed(options)`
- `status()`
- `close(options)`

The module must expose no Apps Script RPC.

## Canonical lease state

The future runtime module must use Script Properties key:

`REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON`

The persisted object must bind:

- contract version;
- status;
- lease scope;
- lease ID;
- owner mode;
- owner writer ID;
- owner maintenance gate ID;
- SHA-256 digest of the raw lease token;
- certified winner-plan fingerprint;
- certified collapse authority SHA-256;
- frozen checkpoint snapshot;
- scheduler handler;
- protected-writer inventory version;
- explicit manual/external-writer certification;
- opened-at timestamp;
- not-before timestamp;
- expiry timestamp;
- closed-at timestamp when closed.

The raw lease token must never appear in persisted state.

Malformed or unknown-version state fails closed.

## Time bounds

The implementation must use:

- settling interval: 10 minutes;
- maximum lease window: 60 minutes.

An unexpired OPEN lease cannot be replaced.

A well-formed expired lease grants no owner readiness and may be replaced only
by a new fully authorized open operation.

A CLOSED lease grants no owner readiness.

## Protected writer inventory v1

The exact protected writer identifiers are:

1. `COUNTY_PRODUCTION_SCHEDULER`
2. `COUNTY_CONNECTOR_LIVE_PERSISTENCE`
3. `COUNTY_CHECKPOINT_RECOVERY`
4. `COUNTY_C1_SCHEMA_MIGRATION`
5. `COUNTY_C1_INSERT_RECOVERY`
6. `CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL`
7. `CODE_VIOLATION_DURABLE_IDENTITY_BATCH1`
8. `CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN`
9. `CODE_VIOLATION_DURABLE_IDENTITY_ROLLING`
10. `CODE_VIOLATION_GATE1_RECOVERY`
11. `PAGE85_SOURCE_OBSERVATION_214_REPAIR`
12. `PAGE86_DUPLICATE_SOURCE_REPAIR`

The exclusive owner identifier is separately:

`CODE_VIOLATION_COLLAPSE_EXECUTOR`

Unknown writer identifiers fail closed even when no lease is active.

The evidence journals are not protected production-data writers:

- `REOS.CountyCollapseOperationIntentStore`
- `REOS.CountyCollapseObservationPreservationStore`

This exclusion grants those stores no production-data or physical-delete
authority.

## openExclusive(options)

`openExclusive` is the only lease-creation operation.

It must require Admin authority.

It must reject unknown option fields.

Its exact caller options are:

- `confirmExclusiveLease`
- `confirmManualExternalWritersQuiescent`
- `ownerGateId`
- `expectedWinnerPlanFingerprintSha256`
- `expectedAuthoritySha256`

Both confirmation fields must equal boolean `true`.

`ownerGateId` must be nonblank.

The two supplied SHA-256 authorities must exactly equal the hard-bound certified
constants.

Before creating state, the operation must prove:

- Script Properties are available;
- UUID generation is available;
- SHA-256 support is available;
- the managed county scheduler has zero active triggers;
- the exact frozen checkpoint is unchanged;
- no active unexpired exclusive lease already exists.

Lease creation must be serialized by one ScriptLock owned only by
`openExclusive`.

The function must re-read lease state, scheduler state, and checkpoint while
that lock is held before writing the new lease.

The function must generate internally:

- a lease ID;
- a raw lease token.

Only SHA-256 of the raw token may be persisted.

The raw token may be returned once to the caller.

The returned result grants no mutation authority.

## assertOwnerReady(options)

`assertOwnerReady` is the exclusive-owner readiness operation.

It must reject unknown option fields.

Its exact caller options are:

- `leaseToken`
- `expectedLeaseId`
- `expectedOwnerGateId`
- `expectedWinnerPlanFingerprintSha256`
- `expectedAuthoritySha256`
- optional `lockContext`

It must prove:

- persisted lease state is valid;
- status is OPEN;
- lease token SHA-256 matches;
- lease ID matches;
- owner gate ID matches;
- owner mode is exactly `CODE_VIOLATION_COLLAPSE`;
- owner writer ID is exactly `CODE_VIOLATION_COLLAPSE_EXECUTOR`;
- winner-plan fingerprint is exact;
- collapse authority SHA is exact;
- protected-writer inventory version is exact;
- manual/external-writer certification remains true;
- settling interval has completed;
- lease has not expired;
- managed county scheduler still has zero active triggers;
- exact frozen checkpoint remains unchanged.

If `lockContext` is supplied, it must be validated through
`REOS.Database.assertScriptLockContext(lockContext)`.

`assertOwnerReady` must never acquire or release ScriptLock.

A future collapse executor must supply its live outer Database lock context
during the final pre-mutation assertion.

Successful owner readiness still grants no insert, update, delete, collapse,
physical-delete, scheduler, checkpoint, connector, repair, migration, or offer
authority.

## assertWriterAllowed(options)

`assertWriterAllowed` is the future retrofit guard for protected non-owner
writers.

It must reject unknown option fields.

Its exact caller options are:

- `writerId`
- optional `lockContext`

`writerId` must match one exact protected-writer identifier.

`CODE_VIOLATION_COLLAPSE_EXECUTOR` is prohibited from this API and must use
`assertOwnerReady`.

If `lockContext` is supplied, it must be validated through
`REOS.Database.assertScriptLockContext(lockContext)`.

The function must never acquire or release ScriptLock.

If there is no lease state, a known protected writer may proceed under its
existing separately certified authority model.

If state is well-formed and CLOSED, a known protected writer may proceed under
its existing separately certified authority model.

If state is well-formed but expired, a known protected writer may proceed under
its existing separately certified authority model.

If an unexpired OPEN collapse lease exists, every protected non-owner writer
must fail closed.

Malformed state, unknown version, unknown owner mode, unknown writer, or
ambiguous state must fail closed.

A successful writer guard result grants no mutation authority; it only proves
that the shared exclusion lease is not blocking the caller.

## status()

`status()` is read-only.

It must require Admin authority.

It must never create, replace, repair, close, or delete lease state.

It must expose whether state is:

- absent;
- OPEN;
- settled;
- expired;
- CLOSED;
- malformed.

It must expose no raw token.

All mutation-authority fields remain false.

## close(options)

`close` must require Admin authority.

It must reject unknown option fields.

Its exact options are:

- `confirmClose`
- `leaseToken`
- `expectedLeaseId`
- `expectedOwnerGateId`

`confirmClose` must equal boolean `true`.

The lease token, lease ID, and owner gate ID must exactly match persisted state.

Close must be serialized by one ScriptLock owned only by `close`.

It must re-read state under lock.

It must write a durable CLOSED state with `closedAt`.

It must not silently delete or rewrite historical lease identity.

It grants no writer or mutation authority.

## Lock topology

`openExclusive` and `close` may own one ScriptLock solely for atomic lease-state
transition.

`assertOwnerReady`, `assertWriterAllowed`, and `status` must not acquire
ScriptLock.

When called with a Database lock context, assertion APIs validate that context
but do not release it.

No API may treat a boolean, forged object, or stale/revoked lock context as a
valid lock capability.

The future collapse executor remains owner of exactly one outer
`REOS.Database.withScriptLockContext(...)` context during mutation.

## Failure model

All authority ambiguity fails closed.

Before any state-changing operation, missing Security, Script Properties,
Utilities, trigger inspection, scheduler checkpoint support, or ScriptLock
support fails closed.

No operation may:

- auto-repair malformed state;
- silently replace an active lease;
- fabricate checkpoint state;
- create or delete scheduler triggers;
- mutate the county checkpoint;
- execute a connector;
- mutate county production data;
- retry a physical mutation;
- recreate deleted rows;
- generate MAO or automatic offers.

## Offline runtime harness requirements

Before runtime implementation may be certified, a dedicated offline harness
must prove at minimum:

1. missing Admin support blocks open;
2. missing Script Properties blocks open;
3. missing UUID support blocks open;
4. missing SHA-256 support blocks open;
5. missing trigger inspection blocks open;
6. missing checkpoint support blocks open;
7. unknown open option fails closed;
8. missing exclusive confirmation fails closed;
9. missing manual/external-writer confirmation fails closed;
10. blank owner gate ID fails closed;
11. wrong winner-plan fingerprint fails closed;
12. wrong collapse authority SHA fails closed;
13. armed county scheduler blocks open;
14. checkpoint drift blocks open;
15. active unexpired lease cannot be replaced;
16. malformed existing state cannot be replaced;
17. valid open persists only token SHA-256 and exact certified bindings;
18. settling interval blocks owner readiness;
19. incorrect lease token fails closed;
20. incorrect lease ID fails closed;
21. owner gate ID drift fails closed;
22. persisted winner-plan fingerprint drift fails closed;
23. persisted authority SHA drift fails closed;
24. inventory-version drift fails closed;
25. manual/external-writer certification drift fails closed;
26. scheduler re-arm invalidates owner readiness;
27. checkpoint drift after open invalidates owner readiness;
28. expired lease grants no owner readiness;
29. valid owner readiness returns authority-free metadata only;
30. every v1 protected non-owner writer is blocked by active collapse lease;
31. collapse owner is rejected by `assertWriterAllowed`;
32. known protected writer is allowed when lease state is absent;
33. known protected writer is allowed after durable close;
34. known protected writer is allowed after well-formed expiry;
35. malformed state blocks protected writers;
36. unknown writer ID fails closed with or without active lease;
37. valid caller-owned Database lock context is accepted;
38. forged lock context fails closed;
39. stale/revoked lock context fails closed;
40. assertion APIs acquire no ScriptLock;
41. close requires explicit confirmation;
42. close rejects wrong token;
43. close rejects wrong lease ID;
44. close rejects wrong owner gate ID;
45. close writes durable CLOSED state;
46. status is read-only and exposes no raw token;
47. all status/readiness/writer-guard authority flags remain false;
48. public module API is exactly the five certified methods;
49. generic Apps Script lease RPC remains absent;
50. no protected writer source is modified by the lease implementation commit.

## Retrofit boundary

Runtime lease implementation alone does not protect county production writers.

After the runtime module and its offline harness are separately certified and
merged, each protected writer must be integrated with the shared guard under
its own bounded retrofit certification.

No protected writer modification is authorized by this implementation-design
gate.

The collapse maintenance gate remains blocked until the shared lease runtime
and protected-writer retrofit are certified.

The collapse executor remains blocked until the maintenance prerequisite is
certified.

## Release boundary

This document authorizes implementation-contract validation only.

It does not authorize creation of the runtime lease module.

It does not authorize the runtime harness.

It does not authorize protected-writer changes.

It does not authorize the collapse maintenance gate.

It does not authorize the collapse executor.

It does not authorize an RPC.

It does not authorize deployment.

It does not authorize production mutation.

It does not authorize physical deletion.

The county scheduler remains frozen.
