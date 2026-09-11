# Gate 2B v3 — Philadelphia Code Violations Multi-Span Durable Identity Migration

## Status

Development contract only.

This contract grants no production mutation authority.

The existing Gate 2B v2 rolling migration executor and its production
deployment remain authoritative until the complete v3 certification,
merge, immutable Apps Script version, controlled deployment promotion,
read-only production certification, exact candidate certification, and
explicit one-time execution chain are completed.

## Purpose

Gate 2B v2 safely migrated deterministic durable-identity batches when
the selected logical records occupied one contiguous physical span.

The remaining production population is physically fragmented.

An exhaustive read-only production-topology discovery of all possible
deterministic logical slices of size 1 through 250 in the remaining
1,368-record population measured:

- maximum logical batch size: 250
- maximum physical span count: 70
- maximum two-column forward write-range count: 140
- natural 250-row future schedule maximum span count: 70
- current first-250 span count: 70

Gate 2B v3 permits bounded multi-span migration while preserving the
existing durable-identity safety contract.

## Scope

Source:

PA-PHILADELPHIA

Dataset:

code_violations

Physical table:

DISTRESS_LEADS

Source Record Key:

column 25

Source Observation Key:

column 51

Durable identity authority:

Violation Number-derived proposedDurableKey

## Explicitly excluded authority

This migration does not grant:

- county scheduler mutation authority
- checkpoint mutation authority
- collapse authority
- review authority
- canonical-property repair authority
- Database insert authority
- Database update authority
- Database upsert authority
- row insertion authority
- row deletion authority
- offer authority
- MAO authority
- automatic retry authority

## Logical batch authority

DEFAULT_BATCH_MAX remains 100.

HARD_BATCH_MAX remains 250.

A requested batch must be a positive integer at or below 250.

For requested batches above 100:

confirmLargeWindowMigration=true

is additionally required.

## Multi-span authority

MAX_PHYSICAL_SPANS = 70.

MAX_FORWARD_WRITE_RANGES = 140.

A selection occupying more than one physical span additionally requires:

confirmMultiSpanMigration=true

A selection requiring more than 70 physical spans must fail closed
before any physical write.

A selection requiring more than 140 forward physical write ranges must
fail closed before any physical write.

The measured span ceiling is an authority ceiling, not permission to
silently truncate or alter the deterministic logical candidate set.

## Required confirmations

Execution requires all existing confirmations:

confirmRollingMigration=true

confirmDurableIdentity=true

confirmInPlace=true

confirmNoInsertDelete=true

confirmMigrationReadyOnly=true

For batchSize > 100:

confirmLargeWindowMigration=true

For physicalSpanCount > 1:

confirmMultiSpanMigration=true

## Rolling hash authority

The caller must provide:

migrationPlanSha256

completePlanSha256

Both must exactly match the authoritative read-only migration plan
before mutation.

They must be revalidated under the ScriptLock before mutation.

## Deterministic selection

Only migrationRequiredRecords are eligible.

Records are sorted by:

1. proposedDurableKey lexically ascending
2. numeric rowNumber ascending as tie breaker

The first requestedBatchSize records are the complete logical
selection.

v3 must not reorder, substitute, skip, truncate, expand, or optimize
the logical candidate set based on physical geometry.

## Physical span construction

After deterministic logical selection, records are sorted by physical
rowNumber solely for physical execution.

The selected rows are partitioned into maximal physically contiguous spans.

Every selected row must belong to exactly one span.

No unselected row may belong to any span.

The union of all spans must equal the deterministic selected set.

Spans must be sorted by first physical row.

Each span records:

- firstRow
- lastRow
- count

The sum of all span counts must equal the logical batch size.

## Read-only preview

The v3 preview must perform zero physical writes.

It must return at least:

- mode
- source
- dataset
- requestedBatchSize
- returnedCandidateCount
- physicalSpanCount
- physicalWriteRangeCount
- physicalSpans
- migrationPlanSha256
- completePlanSha256
- migrationRequiredRows
- alreadyDurableRows
- planBlockedRows
- collapseRequiredRows
- reviewRequiredRows
- candidates

All mutation-authority flags returned by preview must be false.

physicalWriteRangeCount must equal:

physicalSpanCount * 2

## Pre-mutation physical authority

Before any physical mutation, v3 must verify every selected record's
certified physical prestate fingerprint against the live spreadsheet.

All rollback prestate required for both identity columns across every
selected span must be captured before the first physical write.

No mutation may begin until all selected records and all spans have
passed prestate validation.

## Lock authority

Execution must use the existing fail-fast outer Database ScriptLock
boundary.

Before acquiring mutation authority, execution must verify:

- caller rolling hashes
- deterministic logical selection
- span construction
- span ceiling
- write-range ceiling
- frozen checkpoint
- trigger quiescence
- physical prestate fingerprints

Under the lock and immediately before the first write it must reverify:

- trigger quiescence
- frozen checkpoint
- current migrationPlanSha256
- current completePlanSha256
- physical prestate fingerprints
- identical deterministic selection
- identical span geometry
- span ceiling
- write-range ceiling

Any drift must fail closed with zero physical writes.

## Forward physical mutation

For each certified physical span, v3 may write only:

1. Source Record Key column 25
2. Source Observation Key column 51

Each written value must equal that selected record's proposedDurableKey.

For S physical spans:

forward physical write-range count = S * 2

No other column may be physically mutated.

No Database update, insert, upsert, append, row insert, or row delete
API may be used.

SpreadsheetApp.flush() must occur after all forward identity writes and
before authoritative post-plan verification.

## Post-mutation verification

The independently rebuilt authoritative plan must prove:

migrationRequiredRowsAfter =
migrationRequiredRowsBefore - selected.length

alreadyDurableRowsAfter =
alreadyDurableRowsBefore + selected.length

For every selected proposedDurableKey:

- it is absent from migrationRequiredRecords
- it is present in alreadyDurableRecords

The following populations must remain exactly unchanged:

- planBlockedRows
- collapseRequiredRows
- reviewRequiredRows

The frozen checkpoint must remain unchanged.

Trigger quiescence must remain valid.

## Rollback

Once the first physical write is attempted, any provable failure before
certified completion requires restoration of the complete captured
prestate for both identity columns across every selected physical span.

Rollback must be followed by SpreadsheetApp.flush().

Rollback verification must independently prove:

- all selected physical prestates restored
- migrationPlanSha256 restored to prestate
- completePlanSha256 restored to prestate
- frozen checkpoint unchanged
- trigger quiescence valid

A completely verified rollback is a certified restored failure and is
not an ambiguous result.

## Ambiguous result

If rollback cannot be independently certified, execution must return
the existing ambiguous/no-retry authority:

GATE_2B_ROLLING_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY

If mutation was already completely verified and only outer lock
finalization subsequently fails, no compensating write is permitted.

That result is also ambiguous/no-retry.

Any RPC or transport uncertainty after the execute RPC is reached must
be treated as no-retry and resolved only through independent read-only
reconciliation.

## Success result

A certified v3 success must include at least:

- certified execution mode
- source
- dataset
- batchSize
- physicalSpanCount
- physicalWriteRangeCount
- physicalSpans
- physicalStartRow
- physicalEndRow
- sourceRecordKeyColumn
- sourceObservationKeyColumn
- initialMigrationPlanSha256
- initialCompletePlanSha256
- nextMigrationPlanSha256
- nextCompletePlanSha256
- migrationRequiredRowsBefore
- migrationRequiredRowsAfter
- alreadyDurableRowsBefore
- alreadyDurableRowsAfter
- planBlockedRows
- collapseRequiredRows
- reviewRequiredRows
- triggerCountBefore
- checkpointCycleBefore
- productionDataMutationExecuted
- migrationExecuted
- migrationAuthorityConsumed
- automaticOfferAuthorityGranted=false
- schedulerMutationAuthorityGranted=false
- checkpointMutationAuthorityGranted=false
- retryPermitted=false

## Window sequencing

Every successful production window must be independently reconciled
before another production mutation is authorized.

No completed window may ever be rerun.

The next window must use the previous window's independently reconciled
rolling hashes and counts as fresh authority.

## v3 release chain

Production use requires, in order:

1. contract certification
2. static validator certification
3. behavior validator certification
4. exact changed-file review
5. clean committed branch
6. pull request
7. merged exact Git main authority
8. immutable Apps Script version
9. controlled deployment promotion
10. independent deployment readback
11. read-only production certification
12. exact candidate and span certification
13. one-time execution
14. independent read-only reconciliation

No step grants authority to skip a later step.

## Current production boundary

Gate 2B v2 Window #15 is executed and independently reconciled.

Current authoritative population:

migrationRequiredRows = 1368

alreadyDurableRows = 2658

planBlockedRows = 814

collapseRequiredRows = 141

reviewRequiredRows = 95

Current rolling authority:

migrationPlanSha256 =
20d90fa259d57cd0465f75eaa0eaa9c7f88ca90073e3e2544678c90913fd5117

completePlanSha256 =
9f38c5e536abad14e61d21eb1effb79825be04ccfeae5a46271e2bcd5e03fb13

Window #16 has not been executed.

Window #16 execution remains unauthorized until the complete v3
release and production-certification chain passes.
