# County Mutation-Exclusion Lease Retrofit Validation Lifecycle V1

Status: VALIDATION-LIFECYCLE TRANSITION ONLY.

COUNTY_MUTATION_EXCLUSION_LEASE_RETROFIT_VALIDATION_LIFECYCLE_VERSION=1
CERTIFIED_RUNTIME_MAIN=33b9feb19ce4feafd352a90fb108206a41e0d630
HISTORICAL_RUNTIME_LIFECYCLE_SHA256=a33f351e25cbdbd7512c77e7ddcc511e38a4a9a93fcb40723c67eca5646d64a7
PRE_TRANSITION_WORKFLOW_SHA256=d8aa7bc42e04e71a4aaa7aade20afc0f4b3ecde9efc3047da721c52da162dde3

HISTORICAL_RUNTIME_LIFECYCLE_IMMUTABLE=true
HISTORICAL_RUNTIME_LIFECYCLE_ACTIVE_EXECUTION=false
RUNTIME_LEASE_REQUIRED=true
RUNTIME_HARNESS_REQUIRED=true
RUNTIME_HARNESS_IMMUTABLE=true
RUNTIME_HARNESS_SYNTAX_CHECK_REQUIRED_DURING_RETROFIT=true
RUNTIME_HARNESS_ACTIVE_EXECUTION_DURING_RETROFIT=false
RUNTIME_HARNESS_HISTORICAL_50_CASE_CERTIFICATION_PRESERVED=true
PROTECTED_WRITER_INVENTORY_VERSION=1
PROTECTED_WRITER_COUNT=12
PROTECTED_WRITER_RETROFIT_VALIDATION_ENABLED=true
CHANGED_WRITER_REQUIRES_EXACT_WRITER_ID=true
CHANGED_WRITER_REQUIRES_LEASE_GUARD_REFERENCE=true
CHANGED_WRITER_REQUIRES_PER_WRITER_HARNESS=true
PER_WRITER_HARNESS_EXECUTION_REQUIRED=true
HARNESS_WITHOUT_WRITER_CHANGE_FAILS_CLOSED=true
UNKNOWN_WRITER_HARNESS_FAILS_CLOSED=true
PARTIAL_WRITER_RETROFIT_FAILS_CLOSED=true
COLLAPSE_MAINTENANCE_GATE_AUTHORITY=false
COLLAPSE_EXECUTOR_AUTHORITY=false
GENERIC_RPC_AUTHORITY=false
DEPLOYMENT_AUTHORITY=false
LEASE_GRANTS_MUTATION_AUTHORITY=false
PRODUCTION_MUTATION_AUTHORITY=false
PHYSICAL_DELETE_AUTHORITY=false
SCHEDULER_AUTHORITY=false
CHECKPOINT_MUTATION_AUTHORITY=false
CONNECTOR_EXECUTION_AUTHORITY=false
AUTOMATIC_OFFER_AUTHORITY=false

## Purpose

This transition preserves the completed runtime-lease certification while
opening a fail-closed validation stage for incremental retrofit of the exact
twelve protected non-owner county writers.

The historical runtime lifecycle validator remains byte-exact evidence and is
reduced to syntax-only CI registration. This new lifecycle validator becomes
the active dispatcher.

The runtime lease 50-case harness also remains byte-exact historical
runtime-stage evidence. During RETROFIT it remains required, SHA-pinned,
present, and syntax-checked, but is not re-executed after protected-writer
changes begin because its certified test 50 intentionally requires zero
protected-writer source changes. Per-writer retrofit harnesses are the active
execution evidence for changed writers.

A protected writer may differ from the certified runtime main only when:

1. it is one of the exact protected writer inventory entries;
2. its source references
   `REOS.CountyMutationExclusionLease.assertWriterAllowed`;
3. its exact certified writer ID is present;
4. its exact mapped per-writer retrofit harness exists;
5. that harness passes syntax validation and execution.

A harness without its corresponding writer change fails closed. Unknown
retrofit harnesses fail closed.

This validation transition grants no writer mutation authority by itself.
Existing independent writer authority remains subject to each writer's existing
controls and future certified retrofit harness.

The collapse maintenance gate and collapse executor remain prohibited.
