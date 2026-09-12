# Gate 2B — Philadelphia Code Violations Blocked Storage Backfill v1

## Scope

This contract authorizes development and certification of a bounded executor for the 814-row certified blocked cohort only. It does not authorize production execution by itself.

The cohort authority is:

- `blockedBackfillAuthoritySha256=ad4b109d3e4a8980b0d228b3ed5c7d8a346a06a3ba08dfcfeb183eebf77aa814`
- `windowPlanSha256=e5065fe442d072b3bf05376d44b209cb592b01c0f30aba871d7bd578da40b470`
- every row is blocked only by `stored_canonical_identity_missing` and `stored_observation_key_incomplete`;
- every row already has a valid legacy ObjectID `Source Record Key`;
- `Source Record Key is never written` by this backfill;
- the durable Violation Number key is never written by this backfill.

## Certified windows

The 814-row certified blocked cohort is partitioned into four bounded windows in deterministic `proposedDurableKey`, then `rowNumber`, order.

| Window | Rows | Spans | Ranges | Blocked transition | Migration-required transition |
|---|---:|---:|---:|---:|---:|
| 1 | 250 | 60 | 120 | 814 -> 564 | 0 -> 250 |
| 2 | 250 | 27 | 54 | 564 -> 314 | 250 -> 500 |
| 3 | 215 | 70 | 140 | 314 -> 99 | 500 -> 715 |
| 4 | 99 | 38 | 76 | 99 -> 0 | 715 -> 814 |

No window may exceed 250 candidates, 70 physical spans, or 140 forward write ranges.

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
