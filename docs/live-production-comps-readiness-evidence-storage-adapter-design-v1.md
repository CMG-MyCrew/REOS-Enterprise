# Live Production Comps Readiness Evidence Storage Adapter Design v1

## Status

Design-only contract.

This increment does not implement a live production storage adapter, does not
perform Google Sheets writes, does not execute a production RPC, does not alter
a deployment, and does not wire evidence readiness into acquisition workflow
authority.

## Purpose

Define the bounded production storage-adapter boundary required by
`CompsReadinessEvidencePersistence.js`.

The already-certified persistence module owns evidence validation,
idempotency semantics, supersession semantics, current-record selection, and
fail-closed evidence outcomes.

The future storage adapter must provide only the storage operations required
by that module. It must not duplicate or replace evidence-domain logic.

## Certified evidence surfaces

The adapter will persist three additive evidence tables:

1. `DEAL_ARV_EVIDENCE`
2. `DEAL_REPAIR_SCOPE_EVIDENCE`
3. `DEAL_OFFER_READINESS_EVIDENCE`

These are evidence surfaces, not workflow-authority surfaces.

## Schema ownership

The persistence module remains the semantic owner of the v1 evidence
contracts.

The storage adapter must map the module's canonical record properties to the
exact persisted column headers defined for each evidence table.

The adapter must not:

- rename semantic fields;
- infer missing identity;
- synthesize evidence;
- repair canonical property identity;
- convert malformed records into valid records;
- infer readiness from legacy scalar fields;
- calculate ARV;
- calculate repair scope;
- calculate MAO;
- generate or submit offers.

## Required adapter interface

The future live adapter must satisfy the storage contract consumed by the
persistence module.

At minimum the adapter boundary must support:

- `readAll(tableName)`
- `append(tableName, record)`

The implementation must return deterministic values compatible with the
certified persistence module.

The persistence module remains responsible for deciding whether an append is
valid, idempotent, conflicting, or otherwise rejected.

## Table-name allowlist

The adapter must fail closed unless `tableName` is exactly one of:

- `DEAL_ARV_EVIDENCE`
- `DEAL_REPAIR_SCOPE_EVIDENCE`
- `DEAL_OFFER_READINESS_EVIDENCE`

Arbitrary sheet access is not authorized.

## Exact header contracts

### DEAL_ARV_EVIDENCE

1. ARV Evidence ID
2. Schema Version
3. Deal ID
4. Canonical Property Key
5. Evidence Status
6. Confidence Status
7. Estimated ARV
8. Accepted Comparable Evidence IDs JSON
9. Accepted Comparable Count
10. Minimum Comparable Count
11. Valuation Method
12. Valuation Inputs JSON
13. Supported Low Value
14. Supported High Value
15. Review Required
16. Reason Codes JSON
17. Evidence Generated At
18. Persisted At
19. Source Engine
20. Source Engine Version
21. Provenance JSON
22. Idempotency Key
23. Supersedes Evidence ID

### DEAL_REPAIR_SCOPE_EVIDENCE

1. Repair Scope Evidence ID
2. Schema Version
3. Deal ID
4. Canonical Property Key
5. Scope Status
6. Scope Complete
7. Estimated Repair Cost
8. Review Required
9. Reason Codes JSON
10. Scope Inputs JSON
11. Evidence Generated At
12. Persisted At
13. Source Engine
14. Source Engine Version
15. Provenance JSON
16. Idempotency Key
17. Supersedes Evidence ID

### DEAL_OFFER_READINESS_EVIDENCE

1. Readiness Evidence ID
2. Schema Version
3. Deal ID
4. Canonical Property Key
5. ARV Evidence ID
6. Repair Scope Evidence ID
7. Decision
8. Comp Supported ARV Ready
9. Repair Scope Ready
10. Reason Codes JSON
11. Evaluated At
12. Persisted At
13. Gate Version
14. Idempotency Key
15. Supersedes Evidence ID

## Record-property mapping

The live adapter must use an explicit mapping between persisted headers and
the persistence module's canonical lower-camel-case record properties.

No positional inference from object enumeration order is allowed.

JSON-bearing fields must be serialized deterministically before persistence
and parsed deterministically on read.

Boolean fields must preserve exact booleans. Truthy/falsy coercion is not
authorized.

Numeric fields must preserve finite numeric values and must not silently
coerce malformed strings into valid evidence.

Timestamp fields must preserve the persistence module's explicit timestamp
values. The adapter must not substitute the wall clock for missing evidence
timestamps.

## Spreadsheet selection

The implementation phase must reconcile and reuse the repository's certified
production spreadsheet/database access convention.

The adapter must not introduce an independent spreadsheet identity,
standalone datastore, or competing persistence subsystem.

## Sheet discovery

The adapter may resolve only the three allowlisted evidence sheet names.

Missing sheets must fail closed unless a later, separately certified
implementation contract explicitly authorizes deterministic initialization.

This design does not authorize automatic sheet creation.

## Header verification

Before any append or read, the implementation must verify that the target
sheet has the exact expected header contract.

The adapter must fail closed for:

- missing required headers;
- duplicate required headers;
- reordered headers when exact order is required by the implementation;
- unexpected schema shape;
- incompatible evidence schema.

It must not silently rewrite production headers.

## Read behavior

`readAll(tableName)` must:

1. validate the allowlisted table name;
2. resolve the existing production sheet using certified database
   conventions;
3. verify the exact expected headers;
4. read persisted evidence rows;
5. map rows into canonical record objects;
6. return records without changing evidence semantics.

The storage adapter must not choose the current record.

Current-record selection remains the responsibility of the certified
persistence module.

## Append behavior

`append(tableName, record)` must:

1. validate the allowlisted table name;
2. resolve the existing production sheet;
3. verify the exact header contract;
4. map the already-validated canonical record into exact column order;
5. append exactly one evidence row;
6. report success or fail closed.

The adapter must not independently reinterpret idempotency or supersession
rules.

## Concurrency

The implementation must use the repository's appropriate Apps Script locking
convention around the smallest safe append critical section.

Lock acquisition failure must fail closed.

The implementation must not hold a lock while performing unrelated network
or provider operations.

## Atomicity boundary

A single evidence append is the storage atomicity boundary.

This design does not authorize a multi-table transaction abstraction.

Readiness evidence must reference already-persisted ARV and repair evidence
IDs according to the certified persistence-layer contract.

## Failure behavior

Storage failures must remain failures.

The adapter must not:

- manufacture a successful append result;
- fall back to another spreadsheet;
- silently create a replacement table;
- discard identity fields;
- retry indefinitely;
- mutate acquisition workflow state.

## Logging

Any future logging must avoid exposing unnecessary sensitive property or
owner information.

Logging must not become an alternate persistence mechanism.

## Production integration boundary

A future implementation may expose a constructor/factory such as a bounded
production storage-adapter function, but the exact production symbol must be
selected only after implementation reconciliation with repository
conventions.

The six certified persistence APIs remain:

- `appendDealArvEvidence`
- `appendDealRepairScopeEvidence`
- `appendDealOfferReadinessEvidence`
- `getCurrentDealArvEvidence`
- `getCurrentDealRepairScopeEvidence`
- `getCurrentDealOfferReadinessEvidence`

The storage adapter does not itself invoke those APIs automatically.

## No workflow authority

Successful storage does not grant:

- comp acceptance authority;
- ARV calculation authority;
- repair-scope authority;
- Qualified Deal Queue authority;
- acquisition lifecycle authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority.

The existing acquisition safety gate remains mandatory.

Both adequate comp-supported ARV evidence and adequate repair-scope evidence
are required before any later separately certified workflow may even consider
offer eligibility.

## No live execution authorization

This design does not authorize:

- production Google Sheets writes;
- production evidence appends;
- production RPC invocation;
- Apps Script deployment changes;
- trigger changes;
- provider requests;
- readiness-gate production wiring.

## Implementation prerequisite

Before a live adapter implementation is authorized, the implementation phase
must certify:

1. the exact existing production spreadsheet access convention;
2. the exact sheet/header initialization convention;
3. the exact locking convention;
4. the exact record-to-column mapping;
5. the exact read row-to-record mapping;
6. deterministic JSON serialization/parsing;
7. fail-closed missing-sheet behavior;
8. fail-closed header mismatch behavior;
9. no competing datastore;
10. no workflow/MAO/offer authority.

## Next phase after this design

If this design is independently validated, reviewed, merged, and post-merge
certified, the next phase is:

`implement_live_production_comps_readiness_evidence_storage_adapter_v1`

That future implementation must remain bounded to the storage adapter and
must not include production readiness-gate wiring.
