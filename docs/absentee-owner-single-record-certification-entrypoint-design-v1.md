# Absentee-Owner Enrichment Single-Record Certification Entrypoint Design v1

## 1. Purpose

Define the narrow manual/admin-only production certification boundary for
executing absentee-owner enrichment against exactly one existing canonical
DISTRESS_LEADS record.

This entrypoint exists only to certify the already-implemented enrichment
pipeline end-to-end against one explicitly selected production record.

It does not establish scheduled, bulk, connector, acquisition, deal,
MAO, or automatic-offer authority.

## 2. Certified pipeline

The entrypoint MUST compose the existing certified surfaces in this order:

1. REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize(...)
2. REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan(...)
3. REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare(...)
4. REOS.AbsenteeOwnerEnrichmentExecutor.execute(...)

No stage may be skipped.

No caller-manufactured persistence plan, execution request, physical row
number, or mutation request is accepted as authority.

## 3. Proposed production surface

Planned implementation:

    build/apps-script-brand/AbsenteeOwnerEnrichmentCertificationEntrypoint.js

Planned global RPC:

    reosAbsenteeOwnerEnrichmentCertifySingleRecord(options)

The name explicitly communicates certification scope rather than general
production enrichment authority.

## 4. Administrative authority

The RPC MUST call:

    REOS.Security.requireAdmin()

before any record lookup, plan construction, request construction, or
mutation.

Failure to establish admin authority MUST fail before mutation.

## 5. Exact single-record identity

The caller MUST provide exactly one existing canonical identity:

- Distress Lead ID
- Canonical Property Key

Both values MUST be non-empty after normalization.

Neither identity dimension may be inferred, generated, repaired, replaced,
or broadened by the entrypoint.

The two identity dimensions MUST resolve uniquely to the same existing
DISTRESS_LEADS record.

No insert, append, create, duplicate-record creation, or upsert is allowed.

## 6. Enrichment input

The caller MUST provide an enrichment outcome accepted by the certified
Sanitizer.

The entrypoint MUST NOT accept arbitrary DISTRESS_LEADS patches.

For MATCHED outcomes, the sanitizer determines the permitted owner-field
patch.

For non-MATCHED outcomes, owner-field mutation remains prohibited by the
existing sanitizer contract.

## 7. Record acquisition for planning

The entrypoint MAY read DISTRESS_LEADS only as necessary to supply the
certified Persistence Adapter with the records required to resolve the exact
dual identity.

Read activity grants no mutation authority.

The entrypoint MUST NOT use generic Database update, insert, or upsert
operations.

## 8. Persistence plan

Only:

    REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan(...)

may produce the persistence plan consumed by the next stage.

The entrypoint MUST NOT manufacture or modify the returned plan.

The plan remains authority-free.

## 9. Execution request

Only:

    REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare(...)

may produce the execution request consumed by the executor.

The entrypoint MUST NOT manufacture or modify the returned request.

The builder remains responsible for capturing the certified physical
preimage evidence, including spreadsheet identity, sheet identity, geometry,
ordered headers, exact row, complete values/formulas, dual identity, Phase 1F
row evidence, and permitted semantic patch.

## 10. Mutation authority

Only:

    REOS.AbsenteeOwnerEnrichmentExecutor.execute(...)

may perform the physical mutation.

The entrypoint itself MUST NOT call Database.update, Database.insert,
Database.upsert, Database.replacePhysicalRowExact,
Database.patchPhysicalRowCellsExact, setValue, or setValues.

The executor remains the sole physical mutation surface.

## 11. Physical write boundary

Maximum semantic enrichment writes:

- Owner Name
- Owner Mailing Address

Updated At is permitted only as the executor-owned timestamp consequence.

Maximum physical write set:

- Owner Name
- Owner Mailing Address
- Updated At

No unrelated cell or full-row rewrite is authorized.

## 12. Locking

The existing executor-owned REOS.Database.withScriptLockContext(...)
transaction remains the mutation lock authority.

Phase 1K MUST NOT weaken, replace, bypass, or generalize that lock.

Phase 1K does not itself open a CountyMutationExclusionLease.

County scheduler state remains outside Phase 1K authority.

If later production evidence proves an additional writer-exclusion gate is
required, that requirement requires a separately reviewed contract increment.

## 13. Execution cardinality

One RPC invocation may execute against exactly one canonical DISTRESS_LEADS
record.

The entrypoint MUST NOT accept arrays, batches, query predicates, source-wide
execution, run-all semantics, pagination, scheduler context, or trigger
context.

There is no bulk authority.

## 14. Scheduler prohibition

This entrypoint MUST NOT create, delete, modify, install, resume, or invoke
a scheduler or trigger, alter a scheduler cursor, or claim scheduler authority.

County scheduler state remains outside Phase 1K authority.

## 15. Existing absentee CSV connector

The existing reosConnectorHandleAbsenteeOwners(...) belongs to the generic
CSV acquisition connector surface.

Phase 1K MUST NOT invoke, modify, retrofit, or reuse that function as the
certification entrypoint.

## 16. Result

On successful mutation, the entrypoint MUST return the executor's verified
receipt without converting it into broader authority.

A precondition failure remains a definite no-write result according to the
executor contract.

A failure after the executor's first-write boundary remains outcome uncertain
and MUST NOT be reported as rolled back or definitely unchanged.

## 17. Acquisition safety

The entrypoint grants no authority for deal creation, deal qualification,
Qualified Deal Queue creation, lifecycle advancement, ARV generation,
repair-scope generation, MAO generation, offer generation, automatic offer
authority, seller submission, or acquisition approval.

Absentee-owner enrichment is supplemental intelligence only.

No automatic MAO or offer authority exists unless both comp-supported ARV
and adequate repair scope are independently present through their certified
acquisition paths.

Absentee-owner enrichment cannot satisfy, bypass, weaken, or substitute for
either requirement.

## 18. Certification sequence

Phase 1K implementation must be certified offline before any production RPC
execution.

Required progression:

1. design/contract certification
2. implementation
3. static validator
4. behavior validator
5. runtime-integration reconciliation if required
6. lifecycle-validator reconciliation if required
7. CI
8. merge
9. deployment certification
10. explicit authorization of one production record
11. exactly one admin RPC invocation
12. verified postimage/evidence review

No step implies authority for the next step.

## 19. Explicitly excluded future authority

This contract does not authorize scheduled absentee enrichment, recurring
enrichment, bulk enrichment, automatic enrichment on ingestion, automatic
enrichment on code-violation creation, automatic enrichment on county
scheduler execution, provider orchestration, retry queues, automatic provider
selection, or automatic offer authority.

## 20. Phase 1K invariant

The Phase 1K invariant is:

    one explicitly selected existing canonical record
    + admin authority
    + certified sanitizer
    + certified persistence plan
    + certified execution request
    + certified executor
    = at most one bounded, independently verified enrichment mutation

Nothing in Phase 1K grants generalized production enrichment authority.
