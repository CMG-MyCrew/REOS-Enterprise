# Absentee-Owner Enrichment Executor Design v1

## Status

This document freezes the implementation design for the first
absentee-owner enrichment persistence executor.

It does not authorize production execution.

## Upstream authorities

The executor accepts only an already-certified Phase 1H execution request
produced by `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder` from an
already-certified Phase 1F persistence plan derived from the Phase 1D
sanitized MATCHED result.

The Phase 1H execution request is evidence input only. Its embedded authority
flags remain false and do not independently authorize persistence or database
mutation.

Raw provider records, generic CSV rows, arbitrary database patches,
caller-manufactured enrichment patches, direct Phase 1F persistence plans,
and caller-manufactured execution requests are not execution authority.

## Target

The only persistence target is:

`DISTRESS_LEADS`

The executor may mutate an existing physical record only.

It must never insert, append, create, or upsert a record.

## Implementation boundary

The v1 executor must be implemented as a separate absentee-owner module.

Planned implementation surface:

`build/apps-script-brand/AbsenteeOwnerEnrichmentExecutor.js`

The v1 executor design does not require modification of:

`build/apps-script-brand/Database.js`

The executor may use the existing public Database lock capabilities:

- `REOS.Database.withScriptLockContext(...)`
- `REOS.Database.assertScriptLockContext(...)`

The existing:

`REOS.Database.patchPhysicalRowCellsExact(...)`

is not an absentee-owner execution primitive and must not be called,
generalized, weakened, or repurposed by this increment.

The generic:

- `REOS.Database.update(...)`
- `REOS.Database.insert(...)`
- `REOS.Database.upsert(...)`

surfaces are not authorized.

## Caller-owned mutation lock

The complete mutation transaction must execute inside one:

`REOS.Database.withScriptLockContext(...)`

callback.

The executor must retain and validate the exact caller-owned lock context
through:

1. physical sheet resolution;
2. geometry verification;
3. complete header verification;
4. dual-identity revalidation;
5. complete preimage capture and comparison;
6. target-range resolution;
7. final definite no-write lock assertion;
8. physical mutation;
9. flush;
10. complete postimage re-read and verification;
11. final lock assertion.

No lock authority may be replayed or transferred.

## Required identity

The executor requires exactly:

- `Distress Lead ID`
- `Canonical Property Key`

Both values must be non-empty.

Under the mutation lock, the executor must scan the complete physical
identity columns and prove:

- exactly one `Distress Lead ID` match;
- exactly one `Canonical Property Key` match;
- both matches resolve to the same physical row;
- that row equals the expected Phase 1F physical row.

The Phase 1F row number is evidence only and cannot substitute for locked
dual-identity proof.

Any zero-match, duplicate, ambiguous, moved, or mismatched identity must
fail before mutation.

## Header and geometry authority

Before mutation the executor must verify:

- spreadsheet identity;
- sheet name;
- sheet ID;
- last row;
- last column;
- maximum rows;
- maximum columns;
- complete ordered header vector;
- unique normalized header names.

The following headers must resolve uniquely:

- `Distress Lead ID`
- `Canonical Property Key`
- `Owner Name`
- `Owner Mailing Address`
- `Updated At`

Header or geometry drift fails closed before mutation.

## Complete preimage

The executor must operate from an expected complete physical-row preimage.

Before the first write it must re-read and compare:

- every physical row value;
- every physical row formula.

Target formulas for any cell being mutated must be blank.

No mutation is allowed if the complete preimage differs.

## Semantic writeset

The only enrichment-owned semantic fields are:

- `Owner Name`
- `Owner Mailing Address`

The executor must construct the mutation set from the certified Phase 1F
patch only.

It must not manufacture a write for an owned field absent from that patch.

No other semantic field may change.

## Updated At

`Updated At` is not an enrichment semantic field.

It may change only as the explicit timestamp consequence of a verified
absentee-owner mutation.

The maximum physical mutation set is therefore:

- `Owner Name`
- `Owner Mailing Address`
- `Updated At`

## Physical mutation strategy

The absentee-owner executor owns its narrow physical mutation logic.

It must resolve only the certified target cells and write only those cells.

No full-row rewrite is permitted.

No generic Database update is permitted.

No existing county-specialized physical patch primitive is permitted.

Immediately before the first physical write, the executor must perform a
final:

`REOS.Database.assertScriptLockContext(lockContext)`

This assertion is the final definite no-write boundary.

## Failure classification

Any failure before the first physical write is:

`ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED`

and represents a definite no-write outcome.

From invocation of the first physical write onward, any exception,
flush failure, lock failure, or postimage mismatch is:

`ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN`

The executor must not claim rollback unless rollback is separately proven.

## Complete postimage

After mutation and flush, while retaining the same lock authority, the
executor must re-read and verify:

- spreadsheet identity;
- sheet identity;
- geometry;
- complete ordered headers;
- unique `Distress Lead ID`;
- unique `Canonical Property Key`;
- same physical row;
- complete physical row values;
- complete physical row formulas;
- exact intended enrichment replacements;
- explicit `Updated At` replacement;
- every untouched value unchanged;
- every untouched formula unchanged.

Only complete postimage equality may return:

`ABSENTEE_OWNER_EXECUTION_VERIFIED`

## Receipt

A successful executor result should contain only bounded verification
evidence such as:

- classification;
- target table;
- spreadsheet ID;
- sheet ID;
- sheet name;
- row number;
- certified identity;
- patched headers;
- patched columns.

The receipt must not grant downstream acquisition authority.

## Acquisition safety gate

The executor must never:

- create a deal;
- advance acquisition lifecycle or status;
- modify ARV evidence;
- modify repair-scope evidence;
- calculate or write MAO;
- calculate or write Suggested Offer;
- grant automatic offer authority.

Automatic MAO/offer authority remains blocked unless separately established
by comp-supported ARV and adequate repair scope.

## Scheduler isolation

Executor development and offline validation are independent of county
scheduler operation.

This increment must not:

- execute county schedulers;
- alter county schedulers;
- create, remove, or modify triggers;
- invoke `clasp`;
- invoke production RPCs;
- deploy Apps Script;
- call an enrichment provider;
- mutate production data.

## Implementation increment

After this design is reviewed, the intended implementation increment is
limited to a new absentee-owner executor plus offline behavioral and
implementation validators.

`Database.js` remains outside this increment unless later evidence proves
that this design cannot be implemented safely without changing shared
Database infrastructure.

If such evidence appears, implementation must stop and a separate Database
contract/reconciliation must occur before modifying `Database.js`.
