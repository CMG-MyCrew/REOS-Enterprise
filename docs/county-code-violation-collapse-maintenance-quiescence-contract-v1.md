# County code-violation collapse maintenance / writer-quiescence contract v1

Status: DESIGN ONLY. No maintenance-gate implementation, executor implementation,
RPC, deployment, production mutation, or physical-delete authority.

## Certified baseline

Contract-Marker: COLLAPSE_MAINTENANCE_CONTRACT_VERSION=1
Contract-Marker: MAINTENANCE_MODE=CODE_VIOLATION_COLLAPSE
Contract-Marker: SCHEDULER_HANDLER=reosCountyProductionSchedulerRun
Contract-Marker: REQUIRED_MANAGED_SCHEDULER_TRIGGER_COUNT=0
Contract-Marker: CAPABILITY_STORAGE=SHA256_ONLY
Contract-Marker: CAPABILITY_REVALIDATION=UNDER_SAME_OUTER_DATABASE_SCRIPTLOCK
Contract-Marker: NESTED_LOCK_AUTHORITY=false
Contract-Marker: MAINTENANCE_GATE_GRANTS_MUTATION_AUTHORITY=false
Contract-Marker: RPC_AUTHORITY=false
Contract-Marker: DEPLOYMENT_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: PHYSICAL_DELETE_AUTHORITY=false
Contract-Marker: SCHEDULER_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: CONNECTOR_EXECUTION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

The future collapse maintenance gate is a bounded capability proving that the
county code-violation collapse executor is operating inside a separately
authorized maintenance window.

The maintenance capability is necessary for collapse execution but is not
itself mutation authority.

## Required authority binding

A future maintenance gate must bind immutably to:

- maintenance mode `CODE_VIOLATION_COLLAPSE`;
- the exact certified collapse winner-plan fingerprint;
- the exact certified collapse authority SHA-256;
- the exact frozen county checkpoint identity and contents;
- the managed county scheduler handler
  `reosCountyProductionSchedulerRun`;
- the explicit external/manual-writer certification for the window.

Caller-supplied values are selectors and confirmation evidence only. They do
not independently create authority.

## Capability lifecycle

The intended future lifecycle is:

1. `open`
2. settling interval
3. `assertReady`
4. executor revalidation under the same outer Database ScriptLock
5. explicit `close`

An active, unexpired capability must not be silently replaced.

An expired capability grants no execution authority.

The raw maintenance token must never be persisted. Persistent state stores only
its SHA-256 digest.

Closing the gate requires the exact capability token and explicit close
confirmation.

## Scheduler quiescence

Opening and every readiness assertion must prove that the managed county
production scheduler has zero active triggers.

A newly appearing managed scheduler trigger invalidates readiness immediately.

The maintenance gate does not gain trigger creation or deletion authority.

## Exact checkpoint authority

Opening must bind to the exact certified frozen checkpoint.

Every readiness assertion must re-read and verify that exact checkpoint.

The executor must repeat checkpoint verification while its outer Database
ScriptLock is held.

Any checkpoint drift fails closed before mutation.

The maintenance gate has no checkpoint mutation, repair, retirement, reset, or
manufacturing authority.

## Competing REOS county mutation paths

Scheduler quiescence alone is insufficient.

The future maintenance mechanism must explicitly certify that no competing REOS
county mutation path is authorized for the collapse execution window.

This requirement includes county connectors, recovery executors, repair
executors, migrations, backfills, checkpoint recovery, direct county data
mutation entrypoints, and any other independently authorized county writer.

The contract does not assume that absence of the production scheduler trigger
disables those surfaces.

The implementation contract must define the exact mechanism by which competing
mutation authority is denied or proven absent.

## External and manual writers

ScriptLock coordinates cooperating Apps Script code but cannot exclude manual
spreadsheet edits or independent external writers.

A future maintenance opening therefore requires explicit operator
certification that manual and external county-data writers are quiescent for the
bounded maintenance window.

This certification is evidence, not technical exclusion.

The implementation must expose this assumption explicitly in durable gate
state and readiness results rather than silently treating it as true.

## Same-lock revalidation

The future collapse executor owns exactly one outer
`REOS.Database.withScriptLockContext(...)` context for its physical mutation
phase.

Inside that same lock context and before any observation patch or physical
delete, the executor must:

- re-assert the exact maintenance capability;
- require the same gate identity observed before lock acquisition;
- reverify zero managed scheduler triggers;
- reverify the exact frozen checkpoint;
- reverify the competing-writer authority condition;
- reverify the explicit external/manual-writer certification.

The maintenance gate must not acquire a nested ScriptLock.

The maintenance gate must not release the executor's outer lock.

## Readiness-only authority

Successful maintenance assertion may return readiness metadata only.

It must always retain:

- mutation authority false;
- insert authority false;
- update authority false;
- delete authority false;
- physical-delete authority false;
- scheduler authority false;
- checkpoint mutation authority false;
- connector execution authority false;
- migration authority false;
- repair authority false;
- automatic-offer authority false.

The collapse executor's separately certified contract remains responsible for
deciding whether a specific mutation is authorized.

## Proposed future module

Design-only future module:

`REOS.CountyCodeViolationCollapseMaintenanceGate`

Design-only future lifecycle API:

- `open(options)`
- `assertReady(options)`
- `status()`
- `close(options)`

No implementation is authorized by this design gate.

## Explicitly forbidden surfaces

This contract does not authorize:

- creation of the runtime maintenance-gate module;
- a maintenance RPC;
- collapse-executor implementation;
- trigger creation or deletion;
- scheduler mutation;
- checkpoint mutation;
- county connector execution;
- county-data mutation;
- observation patching;
- physical-row deletion;
- row recreation;
- automatic retry;
- MAO or automatic-offer generation;
- deployment;
- production execution.

## Implementation prerequisites

Before implementation authority may be granted, a dedicated offline harness
must prove at minimum:

1. missing Admin/security support fails closed;
2. opening requires explicit collapse-maintenance confirmation;
3. incorrect winner-plan fingerprint fails closed;
4. incorrect collapse authority SHA fails closed;
5. checkpoint mismatch fails closed;
6. any managed county scheduler trigger blocks opening;
7. raw token is never persisted;
8. active capability cannot be replaced;
9. settling interval is enforced;
10. incorrect token fails closed;
11. checkpoint drift after open invalidates readiness;
12. scheduler re-arm after open invalidates readiness;
13. competing county mutation authority invalidates readiness;
14. missing manual/external-writer certification invalidates readiness;
15. readiness grants no mutation authority;
16. same capability can be revalidated under caller-owned outer lock;
17. gate identity drift between pre-lock and under-lock assertions fails closed;
18. expired capability grants no readiness;
19. close requires exact token and explicit confirmation;
20. maintenance state exposes no executor, scheduler, checkpoint, connector,
    repair, offer, or physical-delete authority.

## Release boundary

This document authorizes local design validation only.

It does not authorize maintenance-gate implementation.

It does not authorize an executor implementation.

It does not authorize an Apps Script RPC.

It does not authorize deployment.

It does not authorize production mutation.

It does not authorize collapse execution.

It does not authorize physical deletion.

The county scheduler remains frozen.
