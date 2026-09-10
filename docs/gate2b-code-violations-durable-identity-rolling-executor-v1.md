# REOS Enterprise — Gate 2B Generic Rolling Durable-Identity Migration Contract v1

## Authority class

DESIGN ONLY.

This contract grants **zero production migration authority**.

It does not authorize:

- a production Apps Script push;
- a new Apps Script version;
- deployment promotion;
- a migration RPC;
- scheduler execution or installation;
- checkpoint mutation;
- insert;
- delete;
- upsert;
- collapse;
- dedupe;
- winner selection;
- review repair;
- blocked-record repair;
- automatic MAO/offer authority.

The Batch-1 executor remains permanently consumed.

## Certified current rolling seed

The generic executor may become executable only after a separately certified implementation exists.

Its initial production rolling state is:

- migration-plan SHA-256: `b492a0d90e3c0deeab0b159574a455944726c46d3d758e930562b57809a31dc6`
- complete-plan SHA-256: `0d8b1c8518fea1a49a8dd6c054b14b1c2ffa58d68faa7753041f37e64aa0a317`
- migration-required rows: 3877
- already-durable rows: 149
- plan-blocked rows: 814
- collapse-required rows: 141
- review-required rows: 95

This seed is the post-Batch-1 state produced by the independently certified Batch-1 migration.

The first generic production candidate head is observational evidence only:

- row 3588 — DL-20260902182630-1256 — VI-2025-068024
- row 3589 — DL-20260902182631-1390 — VI-2025-068451
- row 3590 — DL-20260902182633-4899 — VI-2025-068454
- row 3591 — DL-20260902182634-4994 — VI-2025-068511
- row 3592 — DL-20260902182636-8268 — VI-2025-068512
- row 3593 — DL-20260902182637-0442 — VI-2025-069591
- row 3594 — DL-20260902182638-3510 — VI-2025-069592
- row 3595 — DL-20260902182640-2386 — VI-2025-069593
- row 3596 — DL-20260902182854-9329 — VI-2025-069617
- row 3597 — DL-20260902182856-5514 — VI-2025-069618

The implementation MUST NOT hard-code these ten records.

## Scope

The executor is limited to:

- source: `PA-PHILADELPHIA`
- dataset: `code_violations`
- durable identity field: `Violation Number`
- table: `DISTRESS_LEADS`

Only records currently classified as `migrationRequiredRecords` are eligible.

The executor MUST exclude:

- `alreadyDurableRecords`;
- `planBlockedRecords`;
- collapse-required records;
- review-required records.

## Rolling-hash caller contract

Every future execute invocation MUST provide both:

1. the caller's expected current `migrationPlanSha256`;
2. the caller's expected current `completePlanSha256`.

The executor MUST rebuild the complete read-only migration plan before mutation and require exact equality with both caller-supplied hashes.

A hash mismatch MUST fail closed before any physical write.

The caller MUST also explicitly confirm all of:

- `confirmRollingMigration=true`
- `confirmDurableIdentity=true`
- `confirmInPlace=true`
- `confirmNoInsertDelete=true`
- `confirmMigrationReadyOnly=true`

The executor MUST reject missing or false confirmation fields.

## Batch sizing

The generic implementation MUST support a bounded requested batch size.

Version 1 maximum:

`10` records.

Minimum:

1 record.

The first production generic batch SHOULD use the maximum bounded size of 10.

A requested size greater than 10 MUST fail closed.

## Deterministic batch selection

The executor MUST NOT receive row numbers or record identities as mutation authority from the caller.

Instead it MUST:

1. rebuild the current complete migration plan;
2. use only `migrationRequiredRecords`;
3. rely on the plan's deterministic ordering;
4. select the first N records, where N is the bounded requested batch size;
5. revalidate those records immediately before physical mutation.

The deterministic ordering is:

1. proposed durable key ascending;
2. physical row number ascending as tie-breaker.

The implementation MUST NOT independently invent an alternative ordering.

## Physical mutation boundary

Only these two identity columns may be changed:

- Source Record Key = column 25
- Source Observation Key = column 51

For a selected batch of N records, the implementation MUST perform exactly:

1. one contiguous N x 1 write to Source Record Key;
2. one contiguous N x 1 write to Source Observation Key.

The implementation MUST NOT use:

- `Database.update`
- `Database.insert`
- `Database.upsert`
- whole-row rewrites;
- insert;
- delete;
- checkpoint writes;
- scheduler writes.

No other DISTRESS_LEADS field may be changed.

## Locking

The executor MUST own one fail-fast outer REOS Database ScriptLock context for the mutation.

Under that lock it MUST revalidate:

- permitted trigger state;
- exact frozen county checkpoint;
- schema;
- current migration-plan hashes;
- selected record prestate;
- canonical identity;
- durable identity eligibility.

The existing production heartbeat is permitted.

Any unexpected installable trigger MUST fail closed.

The county scheduler trigger count MUST remain zero.

## Frozen county checkpoint

The following checkpoint MUST remain exact during every rolling migration batch:

- cycle: `COUNTY-20260902222607805`
- nextFeedIndex: 0
- currentFeedCursor: `AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281`
- completedFeeds: 0
- totalFeeds: 4
- results: empty array

The rolling executor has no checkpoint mutation authority.

## Prestate protection

Before physical mutation, the executor MUST capture the exact selected-row physical identity prestate.

For every selected row it MUST verify:

- Source Record Key equals the plan's certified source record key;
- Source Observation Key equals the plan's certified source observation key;
- canonical property identity remains unchanged;
- durable key remains unchanged from the plan;
- the record remains migration-required.

Any drift MUST fail closed before writing.

## Poststate

After the two physical writes, the executor MUST flush and independently rebuild the complete read-only migration plan.

The only permitted population transition is:

- selected records leave `migrationRequiredRecords`;
- selected records enter `alreadyDurableRecords`;
- all non-selected classifications remain unchanged.

The expected count transition is:

- migration-required: 3887 -> 3877 for a ten-record batch;
- already-durable: 139 -> 149 for a ten-record batch.

For a generic batch of N:

- migration-required decreases by N;
- already-durable increases by N;
- blocked count remains unchanged;
- collapse count remains unchanged;
- review count remains unchanged.

The implementation MUST return the newly computed:

- `migrationPlanSha256`
- `completePlanSha256`

These become the caller's required hashes for the next batch.

## Rolling-chain rule

A successful batch creates the next authoritative hash pair.

The next invocation MUST present exactly that pair.

The executor MUST NOT carry forward the old hash pair after a successful batch.

The caller MUST NOT use a cached or stale plan.

The rolling chain is therefore:

current hashes
-> rebuild
-> bounded deterministic batch
-> physical mutation
-> rebuild
-> exact poststate
-> next hashes.

## Failure semantics

If any migration-stage assertion fails after a write was attempted, the executor MUST restore the exact captured physical identity prestate.

Rollback MUST restore both identity columns.

After rollback, the executor MUST independently verify:

- exact physical prestate;
- exact current migration-plan hashes;
- exact counts;
- exact checkpoint;
- exact scheduler quiescence.

If rollback cannot be proven, return:

`GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY`

No automatic retry is permitted.

If outer-lock finalization becomes uncertain after verified physical mutation, the result MUST be the same ambiguous/no-retry state.

## Independent reconciliation requirement

Every production batch MUST be followed by an independent read-only reconciliation outside the mutation logic.

The reconciliation MUST verify:

- exact selected records are durable;
- selected records are absent from migration-required;
- next migration-plan hash exact;
- next complete-plan hash exact;
- blocked population unchanged;
- collapse population unchanged;
- review population unchanged;
- county scheduler trigger count remains zero;
- production heartbeat remains the sole permitted trigger;
- frozen checkpoint remains exact;
- Git/deployment authority remains unchanged.

## Authority flags

All rolling-plan and executor surfaces MUST report false for:

- productionDataMutationAuthorityGranted, except the transient consumed execution result;
- insertAuthorityGranted;
- deleteAuthorityGranted;
- collapseAuthorityGranted;
- reviewRepairAuthorityGranted;
- winnerSelectionAuthorityGranted;
- checkpointMutationAuthorityGranted;
- schedulerAuthorityGranted;
- automaticOfferAuthorityGranted.

No rolling executor may grant automatic MAO/offer authority.

## Production sequencing

The generic executor MUST NOT be deployed merely because this contract passes.

Required sequence:

1. certify this design contract;
2. implement generic executor;
3. statically certify executor;
4. behaviorally certify validator;
5. run repository/build certification;
6. review and merge implementation;
7. deploy as a new immutable Apps Script version;
8. run read-only production status/preflight;
9. execute one bounded rolling batch;
10. independently reconcile;
11. only then authorize another rolling batch.

## Initial implementation restriction

Version 1 generic executor SHOULD retain the same conservative physical mutation topology proven by Batch 1:

- one outer fail-fast lock;
- one selected bounded batch;
- exactly two narrow N x 1 writes;
- no Database.update/insert/upsert;
- no scheduler;
- no checkpoint mutation;
- rollback on failure;
- ambiguous/no-retry on uncertainty.

The implementation MUST remain specific to Philadelphia `code_violations` until a separate expansion contract is certified.

## Acquisition safety boundary

This durable-identity migration contract does not grant:

- ARV authority;
- repair-scope authority;
- MAO authority;
- offer authority.

The existing acquisition safety gate remains unchanged:

No automatic MAO or offer authority unless both comp-supported ARV and adequate repair scope are present.

## Certification state

Design-contract seed:
`b492a0d90e3c0deeab0b159574a455944726c46d3d758e930562b57809a31dc6`
/
`0d8b1c8518fea1a49a8dd6c054b14b1c2ffa58d68faa7753041f37e64aa0a317`

Batch size maximum:
10

Mutation columns:
25,
51

Current production counts:
3877 migration-required;
149 already-durable;
814 blocked;
141 collapse-required;
95 review-required.

No production authority is granted by this document.
