# Absentee-Owner Enrichment Execution Contract v1

## Purpose

This contract defines the fail-closed execution boundary for applying an
already-certified absentee-owner enrichment persistence plan to an existing
`DISTRESS_LEADS` acquisition record.

This contract does not itself authorize production execution.

## Upstream authority

Execution input must originate from the certified absentee-owner enrichment
pipeline:

1. Phase 1D sanitizer;
2. Phase 1F persistence adapter;
3. Phase 1H execution-request builder;
4. this execution boundary.

The executor accepts only the certified Phase 1H execution request. The
request's prepared spreadsheet, sheet, row, geometry, header, physical-value,
formula, dual-identity, and semantic-patch evidence must be treated as
expected preimage evidence and independently revalidated while holding the
caller-owned mutation lock.

The Phase 1H request does not itself authorize persistence or database
mutation. Its embedded authority flags remain false.

Raw provider rows, generic CSV rows, arbitrary database patches,
untrusted caller-created persistence plans, direct Phase 1F persistence
plans, and caller-manufactured execution requests are not execution
authority.

## Target

The only target table is:

`DISTRESS_LEADS`

The executor may update an existing physical acquisition record only.

It must never insert, append, create, or upsert a record.

## Required identity

Execution requires both:

- `Distress Lead ID`
- `Canonical Property Key`

Both values must be non-empty and must resolve uniquely to the same existing
physical row.

The executor must fail closed if either identity is missing, not found,
duplicated, ambiguous, moved, or resolves to a different physical row.

The Phase 1F row number is evidence, not permanent write authority. Physical
identity must be revalidated while holding the mutation lock immediately
before any write.

## Caller-owned lock

The complete preimage verification, identity revalidation, mutation, flush,
and postimage verification must occur under one valid caller-owned
`REOS.Database.withScriptLockContext(...)` authority.

A missing, invalid, released, replayed, or otherwise stale lock context must
fail closed before mutation.

## Maximum semantic writeset

The complete enrichment-owned semantic writeset is exactly:

- `Owner Name`
- `Owner Mailing Address`

No other business field may be changed by absentee-owner enrichment.

`Updated At` may change only as the explicit timestamp consequence of a
verified enrichment mutation.

Therefore the maximum physical mutation set is:

- `Owner Name`
- `Owner Mailing Address`
- `Updated At`

The executor must not manufacture a write for an enrichment-owned field that
is absent from the certified Phase 1F patch.

## Preimage authority

Before mutation, the executor must verify at minimum:

- spreadsheet identity;
- sheet identity and name;
- sheet geometry;
- complete ordered header vector;
- unique `Distress Lead ID`;
- unique `Canonical Property Key`;
- both identities resolving to the same expected physical row;
- complete physical row values;
- complete physical row formulas;
- target-column identity;
- target preimage values;
- blank target formulas where mutation is permitted.

Any drift before the first write must fail with a definite no-write outcome.

## Postimage authority

After mutation and flush, the executor must re-read and verify:

- spreadsheet identity;
- sheet identity;
- geometry;
- complete ordered headers;
- both required identities;
- physical row number;
- complete row values;
- complete row formulas;
- every intended enrichment replacement;
- every untouched value;
- every untouched formula.

Successful execution requires complete verified postimage equality.

## Outcome classification

Before the first physical write, any failure is:

`ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED`

and guarantees no absentee-owner mutation was attempted.

From the first physical write invocation onward, any exception or failed
postimage verification is:

`ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN`

The executor must never claim rollback unless rollback is separately proven.

Only a completely verified postimage returns:

`ABSENTEE_OWNER_EXECUTION_VERIFIED`

## Existing Database primitive

`REOS.Database.patchPhysicalRowCellsExact()` is not directly authorized for
absentee-owner execution v1.

Its current certified contract is specialized to exactly three fields:

- `Updated At`
- `Last Seen At`
- `Connector Run ID`

and exactly three cell patches.

Phase 1G must not weaken, generalize, or repurpose that existing primitive
without a separately reviewed Database contract.

`REOS.Database.update()`, `insert()`, and `upsert()` are not authorized
execution boundaries for absentee-owner enrichment.

## Acquisition safety boundary

Absentee-owner execution grants no authority to:

- create a deal;
- advance acquisition lifecycle or status;
- modify ARV evidence;
- modify repair-scope evidence;
- calculate or write MAO;
- calculate or write Suggested Offer;
- grant automatic offer authority.

Automatic MAO/offer authority remains blocked unless separately established
by the acquisition safety gate requiring both comp-supported ARV and adequate
repair scope.

## Scheduler isolation

This execution contract is independent of county scheduler operation.

Phase 1G contract work must not:

- execute or alter county schedulers;
- create, remove, or modify triggers;
- invoke `clasp`;
- invoke production RPCs;
- deploy Apps Script;
- mutate production data.

## v1 implementation posture

This contract freezes requirements only.

Persistence execution remains unauthorized until a separately implemented
executor and offline behavioral/implementation validators are certified and
reviewed.
