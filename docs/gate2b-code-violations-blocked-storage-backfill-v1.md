# Gate 2B — Philadelphia Code Violations Blocked Storage Backfill v1

## Scope

This contract authorizes development and certification of a bounded executor for the 814-row certified blocked cohort only. It does not authorize production execution by itself.

The cohort authority is:

- `blockedBackfillAuthoritySha256=6d064158ced3d2eaede191c2b5e8195fd3701713c271cbbc6b257671be1767f0`
- `windowPlanSha256=742ba533413e6447d9e121f326455381d1e689888647e2d86ad0b6e3bbd50684`
- every row is blocked only by `stored_canonical_identity_missing` and `stored_observation_key_incomplete`;
- every row already has a valid legacy ObjectID `Source Record Key`;
- `Source Record Key is never written` by this backfill;
- the durable Violation Number key is never written by this backfill.

## Certified windows

The 814-row certified blocked cohort is partitioned into four bounded windows in deterministic `proposedDurableKey`, then `rowNumber`, order.

| Window | Rows | Spans | Ranges | Blocked transition | Migration-required transition | Durable rows held constant during backfill |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 250 | 60 | 120 | 814 -> 564 | 0 -> 250 | 4026 |
| 2 | 250 | 27 | 54 | 564 -> 314 | 0 -> 250 | 4276 |
| 3 | 215 | 70 | 140 | 314 -> 99 | 0 -> 215 | 4526 |
| 4 | 99 | 38 | 76 | 99 -> 0 | 0 -> 99 | 4741 |

No window may exceed 250 candidates, 70 physical spans, or 140 forward write ranges.

### Interleaved durable-drain requirement

This v2 authority supersedes the earlier cumulative migration-required sequencing.

After each blocked-storage backfill window, the newly migration-ready cohort must
be fully migrated to durable Violation Number identity before the next
blocked-storage window may become current.

The certified boundaries are therefore:

- Window 1 prestate: `814 blocked / 0 migration-required / 4026 durable`
- Window 1 post-backfill: `564 / 250 / 4026`
- Window 2 prestate after durable drain: `564 / 0 / 4276`
- Window 2 post-backfill: `314 / 250 / 4276`
- Window 3 prestate after durable drain: `314 / 0 / 4526`
- Window 3 post-backfill: `99 / 215 / 4526`
- Window 4 prestate after durable drain: `99 / 0 / 4741`
- Window 4 post-backfill: `0 / 99 / 4741`
- Final state after the last durable drain: `0 blocked / 0 migration-required / 4840 durable`

A blocked-storage window must fail closed when the prior migration-ready cohort
has not been drained or when its durable-row boundary does not match exactly.

## Authorized cell effects

For each selected row only:

1. `Canonical Property Key` is restored from the planner-derived canonical property identity.
2. `Source Observation Key` is restored from the already-certified legacy ObjectID observation authority.

The executor must not write `Source Record Key`, must not write the durable Violation Number observation key, must not insert/delete/collapse rows, and must not select winners.

The expected sole plan transition for a successfully backfilled row is:

`planBlockedRecords -> migrationRequiredRecords`

Already-durable, collapse-required, and review-required populations must remain unchanged.

## Transaction boundary

Each production mutation must:

- require exact caller plan hashes and exact certified window hashes;
- require the frozen county checkpoint and heartbeat-only quiescence;
- verify physical prestate before mutation;
- re-read and re-certify the exact plan, selection, geometry, and physical prestate under `Database.withScriptLockContext`;
- capture rollback prestate for both writable columns;
- perform exactly two narrow forward ranges per physical span;
- flush and verify the exact expected post-plan transition;
- re-check checkpoint and quiescence before returning success.

If mutation starts and rollback cannot be proven exact, the result is ambiguous and requires independent read-only reconciliation. No retry is authorized.

`retryPermitted=false` is mandatory for every execution result.

## Authority exclusions

This contract grants no scheduler mutation, checkpoint mutation, collapse, review repair, winner selection, connector execution, MAO, draft-offer, or automatic-offer authority. The scheduler remains frozen.

After every attempted production window, independent read-only reconciliation is required before any later window can be considered.
