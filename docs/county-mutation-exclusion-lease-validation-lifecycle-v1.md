# County mutation-exclusion lease validation lifecycle v1

Status: DESIGN / CI TRANSITION ONLY.

This contract transitions the county mutation-exclusion lease from historical
design-stage validation to stage-aware validation without weakening or rewriting
the previously certified design artifacts.

## Contract markers

Contract-Marker: COUNTY_MUTATION_EXCLUSION_LEASE_VALIDATION_LIFECYCLE_VERSION=1
Contract-Marker: HISTORICAL_DESIGN_VALIDATORS_IMMUTABLE=true
Contract-Marker: HISTORICAL_DESIGN_VALIDATORS_ACTIVE_EXECUTION=false
Contract-Marker: WORKFLOW_USES_STAGE_AWARE_DISPATCH=true
Contract-Marker: DESIGN_STAGE_REQUIRES_RUNTIME_ABSENT=true
Contract-Marker: RUNTIME_STAGE_REQUIRES_MODULE_AND_HARNESS=true
Contract-Marker: PARTIAL_RUNTIME_STAGE_FAILS_CLOSED=true
Contract-Marker: RUNTIME_STAGE_EXECUTES_RUNTIME_HARNESS=true
Contract-Marker: PROTECTED_WRITER_RETROFIT_AUTHORITY=false
Contract-Marker: COLLAPSE_MAINTENANCE_GATE_AUTHORITY=false
Contract-Marker: COLLAPSE_EXECUTOR_AUTHORITY=false
Contract-Marker: GENERIC_RPC_AUTHORITY=false
Contract-Marker: DEPLOYMENT_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: PHYSICAL_DELETE_AUTHORITY=false
Contract-Marker: SCHEDULER_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

## Reason for the lifecycle transition

The two previously merged validators are historical design-stage validators:

- `scripts/validate-county-mutation-exclusion-lease-contract-v1.js`
- `scripts/validate-county-mutation-exclusion-lease-implementation-contract-v1.js`

Both intentionally require the future runtime lease to remain absent.

The implementation-contract validator additionally requires the future runtime
harness to remain absent.

Those assertions were correct for their certified design gates.

Once runtime implementation begins, continuing to execute those validators
would create a stage contradiction: a correct runtime implementation would
necessarily fail a validator whose historical purpose was to prove that runtime
implementation had not yet begun.

The historical validators therefore remain immutable evidence but cease to be
active execution gates after this lifecycle transition.

## Historical evidence preservation

The lifecycle validator must pin and verify the exact SHA-256 values of:

- the mutation-exclusion lease design contract;
- the mutation-exclusion lease design validator;
- the implementation contract;
- the implementation-contract validator.

The historical validators must remain syntax-checked by county-collapse CI.

Their direct execution steps must be removed.

They must not be edited as part of this lifecycle transition.

## Stage-aware dispatcher

Active county-collapse CI must execute:

`scripts/validate-county-mutation-exclusion-lease-validation-lifecycle-v1.js`

The dispatcher recognizes only two valid states.

### DESIGN stage

Both of these files are absent:

- `build/apps-script-brand/CountyMutationExclusionLease.js`
- `scripts/validate-county-mutation-exclusion-lease-v1.js`

The dispatcher must prove:

- all historical evidence remains byte-exact;
- runtime lease and runtime harness are both absent;
- collapse maintenance implementation remains absent;
- collapse executor remains absent;
- protected writer sources remain unchanged;
- no generic lease RPC exists.

### RUNTIME stage

Both runtime artifacts exist:

- `build/apps-script-brand/CountyMutationExclusionLease.js`
- `scripts/validate-county-mutation-exclusion-lease-v1.js`

The dispatcher must:

- prove all historical evidence remains byte-exact;
- syntax-check the runtime module;
- syntax-check the runtime harness;
- execute the runtime harness;
- require successful runtime-harness certification;
- prove protected writer sources remain unchanged;
- prove collapse maintenance implementation remains absent;
- prove collapse executor remains absent.

Exactly one runtime artifact existing is prohibited and fails closed.

## Protected-writer boundary

This lifecycle transition grants no authority to modify any protected writer.

The runtime lease phase remains bounded to the shared lease implementation and
its offline harness.

Protected-writer guard integration is a later separately certified phase.

## Historical validators

The historical validators remain repository artifacts and remain syntax
checked.

They are not rewritten to reinterpret their original design-stage meaning.

The stage-aware lifecycle validator supersedes their direct CI execution only
because runtime presence would intentionally violate their historical
runtime-absence preconditions.

## Release boundary

This lifecycle transition does not create the runtime lease.

It does not create the runtime harness.

It does not modify protected writers.

It does not create the collapse maintenance gate.

It does not create the collapse executor.

It does not create a generic Apps Script RPC.

It does not authorize deployment, scheduler mutation, checkpoint mutation,
county production-data mutation, physical deletion, MAO generation, or
automatic offers.

The county scheduler remains frozen.
