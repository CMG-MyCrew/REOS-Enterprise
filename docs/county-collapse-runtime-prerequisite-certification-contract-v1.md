# County collapse production runtime prerequisite certification contract v1

Status: DESIGN ONLY.

This contract defines the bounded production certification and one-time
operation-intent workbook provisioning boundary required before implementation
of the current-authority Philadelphia Code Violations direct-keep collapse
executor may begin.

It grants no deployment, provisioning execution, collapse execution,
physical-delete, scheduler mutation, checkpoint mutation, connector execution,
county-data mutation, executor implementation, preflight-blocker release, MAO,
or automatic-offer authority.

## Certified source baseline

- Main baseline:
  `9d0fa6fef330f87ad2777a6d8547a4dc5bebff8c`
- Current winner-plan fingerprint:
  `9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce`
- Current collapse authority SHA-256:
  `8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7`
- Certified lease source SHA-256:
  `f4e02ba1c8aef87075a87437673691b02d8a8587be2dd51280c9708b92954fdb`
- Certified lease compatibility runtime harness SHA-256:
  `4a8e18fc495869fd8bd47a66f89c3989720f162d3cbde07ad098ddb2029d938d`
- Certified maintenance gate SHA-256:
  `051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f`
- Certified operation-intent store SHA-256:
  `00c7ee96dfeee3401444374b3d7a03e905e2928143c92de91cff612e5a782abf`

Contract-Marker: RUNTIME_PREREQUISITE_CONTRACT_VERSION=1
Contract-Marker: RUNTIME_PREREQUISITE_BASE_SHA=9d0fa6fef330f87ad2777a6d8547a4dc5bebff8c
Contract-Marker: CURRENT_WINNER_FINGERPRINT_SHA256=9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce
Contract-Marker: CURRENT_COLLAPSE_AUTHORITY_SHA256=8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7
Contract-Marker: CERTIFIED_LEASE_SOURCE_SHA256=f4e02ba1c8aef87075a87437673691b02d8a8587be2dd51280c9708b92954fdb
Contract-Marker: CERTIFIED_MAINTENANCE_GATE_SHA256=051b204aa8e13af617e1dd84a3d964094502915554d2fe38299ca2e25623fb5f
Contract-Marker: CERTIFIED_OPERATION_INTENT_STORE_SHA256=00c7ee96dfeee3401444374b3d7a03e905e2928143c92de91cff612e5a782abf
Contract-Marker: FUTURE_MODULE=REOS.CountyCollapseRuntimePrerequisiteCertification
Contract-Marker: FUTURE_STATUS_RPC=reosCountyCollapseRuntimePrerequisiteStatus
Contract-Marker: FUTURE_PROVISION_RPC=reosCountyCollapseOperationIntentProvision
Contract-Marker: OPERATION_INTENT_PROPERTY=REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID
Contract-Marker: EVENT_SHEET=COUNTY_COLLAPSE_OPERATION_INTENTS
Contract-Marker: CHUNK_SHEET=COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS
Contract-Marker: EXACT_LOGICAL_SHEET_COUNT=2
Contract-Marker: INITIAL_EVENT_DATA_ROWS=0
Contract-Marker: INITIAL_CHUNK_DATA_ROWS=0
Contract-Marker: CALLER_SUPPLIED_WORKBOOK_ID=false
Contract-Marker: CALLER_SUPPLIED_WORKBOOK_NAME=false
Contract-Marker: PROVISIONING_REPLACEMENT_AUTHORITY=false
Contract-Marker: EXISTING_VALID_BINDING_RERUN=READ_ONLY_IDEMPOTENT
Contract-Marker: EXISTING_INVALID_BINDING=FAIL_CLOSED_NO_REPLACEMENT
Contract-Marker: PROPERTY_WRITE_AFTER_SCHEMA_ACCESS_VERIFICATION=true
Contract-Marker: WORKBOOK_MUST_DIFFER_FROM_COUNTY_DATA=true
Contract-Marker: EXTRA_EDITORS_ALLOWED=false
Contract-Marker: EXTRA_VIEWERS_ALLOWED=false
Contract-Marker: STATUS_EXPOSES_RAW_LEASE_TOKEN=false
Contract-Marker: STATUS_EXPOSES_RAW_WORKBOOK_ID=false
Contract-Marker: LEASE_SAFE_TRANSITION_STATES=ABSENT,CLOSED,EXPIRED
Contract-Marker: LEASE_UNSAFE_TRANSITION_STATES=OPEN,SETTLED,MALFORMED
Contract-Marker: DEPLOYED_EXACT_SOURCE_CERTIFICATION_REQUIRED=true
Contract-Marker: OFFLINE_40_CASE_LEASE_CERTIFICATION_REQUIRED=true
Contract-Marker: INTENT_STORE_SCHEMA_READBACK_REQUIRED=true
Contract-Marker: ACCESS_BINDING_CERTIFICATION_REQUIRED=true
Contract-Marker: COMPATIBILITY_BLOCKER_RELEASE_SEPARATE_INCREMENT=true
Contract-Marker: EXECUTOR_BLOCKER_RELEASE_SEPARATE_INCREMENT=true
Contract-Marker: DIRECT_KEEP_EXECUTOR_ONLY_AFTER_PREREQUISITES=true
Contract-Marker: OBSERVATION_MERGE_EXECUTABLE=false
Contract-Marker: EXECUTOR_IMPLEMENTATION_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: PHYSICAL_DELETE_AUTHORITY=false
Contract-Marker: SCHEDULER_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

## Responsibility boundary

The future prerequisite-certification module is an operator boundary only.

It may perform exactly two classes of work:

1. authority-free read-only inspection of deployed prerequisite state; and
2. explicit one-time creation and binding of the dedicated empty
   operation-intent evidence workbook.

It may not create or exercise collapse execution authority.

It may not invoke the physical-row-delete primitive.

It may not patch or otherwise mutate county data.

It may not install, remove, replace, or modify scheduler triggers.

It may not mutate the county checkpoint.

It may not run county connectors.

It may not create offers.

It may not open a collapse maintenance lease.

It may not close a collapse maintenance lease.

It may not accept or expose a raw lease capability token.

## Exact future public surface

The future implementation may expose exactly two bounded Apps Script execution
entrypoints.

### `reosCountyCollapseRuntimePrerequisiteStatus()`

Read-only.

It may report:

- contract version;
- certified prerequisite source hashes;
- current lease status;
- current lease authority generation;
- whether current lease state is safe for later CURRENT maintenance transition;
- whether the intent-workbook property is configured;
- SHA-256 of the configured workbook ID;
- exact journal sheet-set/schema status;
- journal event/chunk data-row counts;
- whether the configured workbook differs from the active county workbook;
- access-binding status;
- whether the initial empty-store certification is still true;
- all authority flags as false.

It must not report:

- raw lease token;
- raw lease-token digest;
- raw configured workbook ID;
- caller-selectable execution authority;
- physical-delete authority.

A malformed or inaccessible lease/store state fails closed.

### `reosCountyCollapseOperationIntentProvision(options)`

One-time provisioning only.

The caller must provide:

- explicit provisioning confirmation;
- exact current winner fingerprint;
- exact current collapse authority SHA.

The caller must not provide:

- workbook ID;
- workbook URL;
- workbook name;
- sheet names;
- headers;
- lease token;
- maintenance capability;
- operation ID;
- journal event data;
- journal chunk data.

If a valid binding already exists, the operation is read-only and idempotent.

If any existing binding is malformed, inaccessible, points at the county-data
workbook, has the wrong schema, or fails access certification, provisioning
fails closed and must not replace it.

No automatic repair or replacement authority exists.

## Production deployment certification

Offline behavior certification alone is insufficient.

Before the lease-compatibility production prerequisite can be marked certified,
the exact source commit containing the certified lease compatibility
implementation must be deployed to the certified REOS production Apps Script
project and immutable deployment version.

Deployment evidence must prove:

- certified production Script ID;
- exact source Git commit;
- successful Apps Script push;
- immutable created version;
- exact production deployment ID updated to that version;
- deployed prerequisite-status entrypoint is reachable;
- reported lease state is structurally valid;
- reported authority generation is known when a persisted lease exists;
- `MALFORMED` state is never certified;
- active `OPEN` or `SETTLED` state is not certified as safe for replacement;
- no raw lease token is returned;
- all mutation/collapse/offer authority flags remain false.

The 40-case compatibility harness remains the behavioral certification of
CURRENT/HISTORICAL/UNKNOWN logic.

Production runtime certification proves that the exact certified source version
is what is deployed and that the actual persisted production lease state is
safe for the next phase.

## Operation-intent workbook provisioning

The future provisioner creates a dedicated Google Sheets workbook separate from
the active county-data workbook.

It creates exactly two logical journal sheets:

1. `COUNTY_COLLAPSE_OPERATION_INTENTS`
2. `COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS`

The event sheet header is exactly:

1. `Operation ID`
2. `Event Sequence`
3. `Event Type`
4. `Event Timestamp UTC`
5. `Operation Intent Contract Version`
6. `Executor Implementation Version`
7. `Group Number`
8. `Winner Distress Lead ID`
9. `Target Delete Distress Lead ID`
10. `Payload SHA-256`
11. `Payload UTF-8 Bytes`
12. `Payload Chunk Count`
13. `Previous Event SHA-256`
14. `Event SHA-256`

The chunk sheet header is exactly:

1. `Operation ID`
2. `Event Sequence`
3. `Chunk Index`
4. `Chunk UTF-8 Bytes`
5. `Chunk SHA-256`
6. `Chunk Data`

Before binding the workbook ID to
`REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID`, the provisioner must prove:

- the workbook differs from the active county-data workbook;
- exactly the two certified logical sheets exist;
- both header rows are exact;
- header formulas are absent;
- event data-row count is zero;
- chunk data-row count is zero;
- no additional editor is present;
- no additional viewer is present;
- the creating production operator retains access;
- the workbook is readable by the production runtime.

Only after all verification succeeds may the property be written.

The property must then be reread and match exactly.

The future runtime status surface must re-open the configured workbook and
revalidate the complete binding.

## Provisioning failure semantics

Any failure before property binding leaves the production binding absent.

A created but unbound orphan workbook is not automatically deleted.

It requires manual review.

Any ambiguous property-write/readback result fails closed.

The provisioner does not automatically retry.

The provisioner never replaces an existing binding.

The provisioner never clears existing evidence.

## Executor sequencing

Successful production certification of this contract's future implementation
does not itself grant collapse execution.

Only after both of these are separately proven may direct-keep executor source
implementation begin:

1. exact lease compatibility source is deployed and independently
   runtime-certified; and
2. operation-intent storage is provisioned, access-bound, empty, and certified
   for production.

The future direct-keep executor remains limited to groups:

`2,4,5,6,7,8,9,10,11,12,13,14,15,16`

Group 1 remains conflict-blocked.

Historical Group 3 remains excluded.

Groups 17 through 22 remain non-executable until a separate preservation
orchestration implementation and failure-path harness are certified.

## Preflight blocker transitions

This contract does not modify either blocker.

`CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED`

may be removed only in a separate source increment after exact production
deployment/runtime certification.

Removing that blocker must not remove:

`CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE`

The executor blocker requires its own later implementation, deployment,
production-store, and read-only runtime certification gates.

## Release boundary

This document grants design authority only.

It does not authorize implementation.

It does not authorize commit, push, PR, merge, deployment, provisioning,
physical deletion, county-data mutation, scheduler mutation, checkpoint
mutation, connector execution, preflight blocker release, MAO, or automatic
offers.
