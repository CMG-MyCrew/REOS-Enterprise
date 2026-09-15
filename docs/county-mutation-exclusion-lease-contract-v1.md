# County mutation-exclusion lease contract v1

Status: DESIGN ONLY.

No runtime lease implementation, collapse maintenance-gate implementation,
collapse executor, RPC, deployment, production mutation, scheduler mutation,
checkpoint mutation, or physical-delete authority is granted by this contract.

## Contract markers

Contract-Marker: COUNTY_MUTATION_EXCLUSION_LEASE_CONTRACT_VERSION=1
Contract-Marker: LEASE_SCOPE=REOS_COUNTY_PRODUCTION_MUTATION
Contract-Marker: EXCLUSIVE_OWNER_MODE=CODE_VIOLATION_COLLAPSE
Contract-Marker: RAW_LEASE_TOKEN_PERSISTENCE=false
Contract-Marker: LEASE_GRANTS_MUTATION_AUTHORITY=false
Contract-Marker: INCOMPATIBLE_WRITER_DEFAULT=FAIL_CLOSED
Contract-Marker: COLLAPSE_OWNER_REQUIRES_MAINTENANCE_ASSERTION=true
Contract-Marker: SAME_OUTER_LOCK_REVALIDATION=true
Contract-Marker: NESTED_SCRIPTLOCK_AUTHORITY=false
Contract-Marker: RPC_AUTHORITY=false
Contract-Marker: DEPLOYMENT_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: PHYSICAL_DELETE_AUTHORITY=false
Contract-Marker: SCHEDULER_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: CONNECTOR_EXECUTION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

## Problem being solved

The repository currently contains multiple independently invokable county
production mutation paths.

The existing C1 and Gate 1 maintenance gates are population-specific
capabilities. They do not provide a shared exclusion mechanism for all county
writers.

Zero managed county scheduler triggers therefore does not by itself prove that
another county recovery, repair, migration, connector, backfill, checkpoint, or
direct county mutation path cannot be invoked during a collapse maintenance
window.

The county code-violation collapse contract requires a separately certified
mechanism proving that no competing REOS county mutation path is authorized
during collapse execution.

## Proposed future module

Design-only future module:

`REOS.CountyMutationExclusionLease`

Design-only source:

`build/apps-script-brand/CountyMutationExclusionLease.js`

No implementation is authorized by this design gate.

The module is an exclusion mechanism, not a mutation-authority mechanism.

## Canonical persisted lease

The future mechanism must maintain one canonical project-wide county mutation
lease state.

Proposed state key:

`REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON`

Only one active, unexpired exclusive county mutation lease may exist at a time.

The persisted state must bind at minimum:

- contract version;
- lease ID;
- owner mode;
- owner gate ID;
- SHA-256 of the raw lease token;
- exact collapse winner-plan fingerprint when owner mode is
  `CODE_VIOLATION_COLLAPSE`;
- exact collapse authority SHA-256;
- exact frozen county checkpoint identity and contents;
- managed county scheduler handler;
- opened-at time;
- not-before time;
- expiry time;
- explicit manual/external-writer certification;
- exact protected-writer inventory version.

The raw lease token must never be persisted.

## Lease semantics

The lease does not grant insert, update, delete, repair, migration, connector,
scheduler, checkpoint, collapse, winner-selection, physical-delete, or offer
authority.

Existing writer-specific contracts remain responsible for mutation authority.

When no exclusive county mutation lease is active, existing writer contracts
continue to determine their own authority.

When an active exclusive lease exists, every protected writer must fail closed
unless it is the exact lease owner and possesses the separately required
owner-specific authority.

For `CODE_VIOLATION_COLLAPSE`, lease ownership alone is insufficient.

The future collapse executor must also possess and revalidate the exact
collapse maintenance capability.

## Protected writer inventory v1

The initial protected writer inventory is:

1. `COUNTY_PRODUCTION_SCHEDULER`
   - `build/apps-script-brand/CountyProductionScheduler.js`

2. `COUNTY_CONNECTOR_LIVE_PERSISTENCE`
   - `build/apps-script-brand/CountyConnectorSDK.js`

3. `COUNTY_CHECKPOINT_RECOVERY`
   - `build/apps-script-brand/CountyCheckpointRecovery.js`

4. `COUNTY_C1_SCHEMA_MIGRATION`
   - `build/apps-script-brand/CountyC1SchemaMigration.js`

5. `COUNTY_C1_INSERT_RECOVERY`
   - `build/apps-script-brand/CountyC1InsertRecovery.js`

6. `CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL`
   - `build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js`

7. `CODE_VIOLATION_DURABLE_IDENTITY_BATCH1`
   - `build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationBatch1Executor.js`

8. `CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN`
   - `build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js`

9. `CODE_VIOLATION_DURABLE_IDENTITY_ROLLING`
   - `build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js`

10. `CODE_VIOLATION_GATE1_RECOVERY`
    - `build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js`

11. `PAGE85_SOURCE_OBSERVATION_214_REPAIR`
    - `build/apps-script-brand/CountyPage85SourceObservation214Repair.js`

12. `PAGE86_DUPLICATE_SOURCE_REPAIR`
    - `build/apps-script-brand/CountyPage86DuplicateSourceRepair.js`

13. future owner `CODE_VIOLATION_COLLAPSE_EXECUTOR`
    - `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`

Any newly introduced county production-data writer must be added to the
protected inventory before it may coexist with an active collapse lease.

An unknown county writer must fail closed rather than be silently treated as
compatible.

## Evidence-journal exclusion

The following dedicated evidence stores are not county production-data writers
and must not be blocked merely because a collapse lease is active:

- `REOS.CountyCollapseOperationIntentStore`
- `REOS.CountyCollapseObservationPreservationStore`

They remain governed by their existing caller-owned-lock, authority-free,
append-only evidence contracts.

This exception does not grant either store county-data mutation authority or
physical-delete authority.

## Writer guard contract

Every protected county writer must invoke the future shared exclusion guard
before its first production mutation opportunity.

Writers that already own an outer ScriptLock must reassert the exclusion guard
inside that same lock immediately before mutation.

The production scheduler must assert the guard before connector execution and
before checkpoint advancement.

The connector SDK must assert the guard at its live production persistence
boundary.

Direct repair, migration, recovery, backfill, and schema writers must assert
the guard in their own execution paths.

A protected writer must never treat a failed or unavailable lease check as
permission to mutate.

## Collapse-owner contract

A collapse maintenance window may become exclusive only when all separately
certified collapse requirements succeed, including:

- Admin authority;
- explicit maintenance confirmation;
- exact winner-plan fingerprint;
- exact collapse authority SHA-256;
- zero managed county scheduler triggers;
- exact frozen checkpoint;
- explicit manual/external-writer certification;
- no conflicting active county mutation lease.

The resulting lease must bind to the collapse maintenance gate identity.

Before a future observation-preservation patch or physical delete, the collapse
executor must, under its same outer Database ScriptLock:

1. reassert the collapse maintenance capability;
2. require the same maintenance gate ID;
3. reassert the exact exclusive county mutation lease;
4. require the same lease ID;
5. reverify zero managed scheduler triggers;
6. reverify the exact frozen checkpoint;
7. reverify the protected-writer inventory/version;
8. reverify manual/external-writer certification.

Only after those checks may a separately certified executor consider a
specific mutation.

## Lock topology

The mutation-exclusion lease module must not acquire a nested ScriptLock when
called from a writer that already owns a certified outer lock.

The lease module must not release a caller-owned lock.

A lease assertion is an authority/readiness check only.

The future collapse executor remains the owner of exactly one outer
`REOS.Database.withScriptLockContext(...)` context for its physical mutation
phase.

## Failure semantics

All lease ambiguity fails closed.

Examples include:

- missing state support;
- malformed persisted lease state;
- unknown lease version;
- unknown owner mode;
- token mismatch;
- lease ID drift;
- owner gate ID drift;
- protected-writer inventory drift;
- winner-plan fingerprint drift;
- collapse authority SHA drift;
- checkpoint drift;
- managed scheduler re-arm;
- expiry;
- competing active lease;
- unknown writer ID.

No failed lease check may create mutation authority.

No automatic lease repair, replacement, retry, scheduler mutation, checkpoint
mutation, row repair, or row recreation is authorized.

## Proposed future API

Design-only API:

- `openExclusive(options)`
- `assertOwnerReady(options)`
- `assertWriterAllowed(options)`
- `status()`
- `close(options)`

No public Apps Script RPC is authorized for the generic lease module.

The collapse-specific maintenance gate may later be separately certified as the
Admin/operator-facing capability that delegates to this shared lease.

## Implementation certification requirements

Before runtime implementation may be merged, an offline harness must prove at
minimum:

1. missing Security/Admin dependency fails closed where owner opening requires
   Admin authority;
2. missing Script Properties fails closed;
3. malformed persisted lease fails closed;
4. only SHA-256 of the raw lease token is persisted;
5. active unexpired lease cannot be replaced;
6. expired lease grants no owner readiness;
7. conflicting owner mode fails closed;
8. incorrect lease token fails closed;
9. incorrect lease ID fails closed;
10. owner gate ID drift fails closed;
11. protected-writer inventory drift fails closed;
12. incorrect winner-plan fingerprint fails closed;
13. incorrect collapse authority SHA fails closed;
14. checkpoint drift invalidates collapse-owner readiness;
15. scheduler re-arm invalidates collapse-owner readiness;
16. missing manual/external-writer certification fails closed;
17. every v1 protected writer is denied during an active collapse lease;
18. future collapse writer is denied without exact owner proof;
19. future collapse writer still receives no mutation authority from the lease;
20. evidence journals remain usable under caller-owned lock without receiving
    county-data mutation authority;
21. existing writers retain their own authority model when no lease is active;
22. unknown writer ID fails closed;
23. lease assertion can be repeated under a caller-owned outer Database lock;
24. no nested ScriptLock is acquired;
25. exact token plus explicit confirmation is required to close;
26. no generic lease RPC exists;
27. lease status/readiness grants no insert, update, delete, repair, migration,
    scheduler, checkpoint, connector, collapse, physical-delete, or offer
    authority.

## Retrofit boundary

The shared lease does not protect the repository until every v1 protected
writer guard point has been separately integrated and validated.

Therefore collapse maintenance implementation cannot be certified merely by
creating `CountyMutationExclusionLease.js`.

Certification requires:

- shared lease implementation;
- offline lease harness;
- exact protected-writer guard integration;
- regression validators for every guarded writer;
- collapse maintenance-gate implementation and harness;
- same-lock revalidation proof.

Until all of those are certified, the collapse executor remains unavailable.

## Release boundary

This document grants design authority only.

It does not authorize:

- runtime shared lease implementation;
- protected-writer source modification;
- collapse maintenance-gate implementation;
- collapse executor implementation;
- RPC creation;
- deployment;
- production mutation;
- physical deletion;
- scheduler mutation;
- checkpoint mutation;
- connector execution;
- MAO or automatic-offer generation.

The county scheduler remains frozen.
