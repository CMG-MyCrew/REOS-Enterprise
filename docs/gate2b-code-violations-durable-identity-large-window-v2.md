# REOS Enterprise — Gate 2B Code-Violations Durable-Identity 250-Window Promotion v2

## Authority class

DESIGN / CERTIFICATION ONLY.

This document grants zero production mutation authority by itself.

It does not authorize:

- Apps Script push;
- Apps Script version creation;
- deployment promotion;
- migration RPC execution;
- scheduler installation or execution;
- checkpoint mutation;
- collapse;
- review repair;
- blocked-record repair;
- automatic MAO or offer authority.

Historical rolling-executor v1 and 100-row large-window v1 contracts remain immutable evidence.

## Purpose

This promotion increases only the bounded hard ceiling for the Philadelphia
`code_violations` durable-identity rolling migration executor.

Previous certified default:

`100` records.

Previous certified hard maximum:

`100` records.

Promoted default:

`100` records.

Promoted hard maximum:

`250` records.

Minimum:

`1` record.

The default MUST remain 100.

A requested batch size greater than `250` MUST fail closed before authoritative
plan reads, lock acquisition, or physical mutation.

## Additional large-window authority

A requested batch size from `101` through `250` inclusive MUST additionally
require:

`confirmLargeWindowMigration=true`

This confirmation is in addition to the five existing rolling confirmations.

Batch sizes `1` through `100` MUST NOT require the new large-window confirmation.

## Scope

Scope remains exactly:

- source: `PA-PHILADELPHIA`
- dataset: `code_violations`
- table: `DISTRESS_LEADS`
- durable identity: `Violation Number`
- Source Record Key column: `25`
- Source Observation Key column: `51`

Only `migrationRequiredRecords` are eligible.

No authority is granted over:

- already-durable records;
- blocked records;
- collapse-required records;
- review-required records.

## Rolling-hash authority

Every execute invocation MUST require caller-supplied current:

- `migrationPlanSha256`
- `completePlanSha256`

Both MUST exactly equal the independently rebuilt current authoritative plan.

The five inherited confirmations remain required:

- `confirmRollingMigration=true`
- `confirmDurableIdentity=true`
- `confirmInPlace=true`
- `confirmNoInsertDelete=true`
- `confirmMigrationReadyOnly=true`

For batch sizes greater than 100, the sixth confirmation is additionally
required:

- `confirmLargeWindowMigration=true`

Any mismatch MUST fail closed.

## Deterministic selection

Selection remains:

1. current `migrationRequiredRecords` only;
2. proposed durable key ascending;
3. physical row number ascending as tie-breaker;
4. first N records only.

Caller-supplied row identities never constitute migration authority.

## Physical mutation boundary

For N selected records, the executor may perform exactly:

1. one contiguous N x 1 write to Source Record Key;
2. one contiguous N x 1 write to Source Observation Key.

Rollback may perform exactly the corresponding two restoration writes.

The 250 promotion MUST NOT add write call sites.

The executor MUST NOT use:

- `Database.update`;
- `Database.insert`;
- `Database.upsert`;
- whole-row rewrites;
- row inserts;
- row deletes;
- checkpoint writes;
- scheduler writes.

## Prestate protection

Before mutation, exact physical prestate and fingerprints MUST be verified.

The executor MUST fail closed on:

- candidate drift;
- fingerprint drift;
- durable-key drift;
- canonical-property drift;
- non-contiguous physical selection;
- plan-hash drift;
- checkpoint drift;
- scheduler/trigger drift;
- lock contention.

## Locking and quiescence

One fail-fast outer REOS Database ScriptLock remains required.

Frozen checkpoint authority remains:

- cycle: `COUNTY-20260902222607805`
- nextFeedIndex: `0`
- cursor: `AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281`
- completedFeeds: `0`
- totalFeeds: `4`
- results: empty

County scheduler trigger count MUST remain zero.

The existing single production heartbeat remains the only permitted installable trigger.

## Poststate

After exactly two forward physical writes and flush, the executor MUST rebuild
the authoritative migration plan.

For a successful N-record window:

- migration-required decreases exactly by N;
- already-durable increases exactly by N;
- blocked count does not change;
- collapse count does not change;
- review count does not change.

The executor MUST return the next rolling migration and complete-plan hashes.

## Failure / rollback

Every provable post-write failure MUST restore exact captured identity prestate.

Rollback restores both identity columns.

If rollback or outer-lock finalization cannot be proven, the result remains:

`GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY`

Automatic retry remains prohibited.

## Required behavioral certification

Before production promotion, certification MUST prove:

- batchSize 1 succeeds without large-window confirmation;
- batchSize 10 succeeds without large-window confirmation;
- batchSize 100 succeeds without large-window confirmation;
- batchSize 101 fails without `confirmLargeWindowMigration=true`;
- batchSize 101 succeeds with `confirmLargeWindowMigration=true`;
- batchSize 250 fails without `confirmLargeWindowMigration=true`;
- batchSize 250 succeeds with `confirmLargeWindowMigration=true`;
- batchSize 251 fails before authoritative plan reads, lock acquisition, or writes;
- successful 250-row execution still uses exactly two forward physical writes;
- rollback and ambiguous/no-retry behavior remains intact;
- non-contiguous selection fails closed;
- checkpoint drift fails closed;
- scheduler drift fails closed;
- blocked/collapse/review drift causes rollback.

## Production sequencing

This contract grants no production mutation authority.

Required sequence:

1. contract certification;
2. static certification;
3. behavioral certification;
4. repository/build certification;
5. commit;
6. PR review and merge;
7. immutable Apps Script version;
8. controlled deployment promotion;
9. read-only production certification;
10. independently certify exact first 250 candidates;
11. execute one first 250-row production window only;
12. independently reconcile before any further window.

No automatic loop over the remaining migration population is authorized.

## Acquisition safety boundary

This promotion grants no ARV, repair-scope, MAO, or offer authority.

Automatic MAO/offer authority remains prohibited unless both comp-supported ARV
and adequate repair scope are present.
