# Absentee-Owner Exact-Record Read-Only Selector Design v1


## 1. Purpose
Provide a narrowly bounded, admin-only, read-only evidence surface for
verifying exactly one existing `DISTRESS_LEADS` physical record before
Phase 1K absentee-owner single-record certification.

Existing deployed selector candidates were inspected first. None
established the required combination of exact one-record selection,
persisted dual-identity verification, bounded physical spreadsheet reads,
read-only behavior, and isolation from county execution.

This selector is observational evidence authority only.

It grants no certification mutation, persistence, acquisition, county,
scheduler, trigger, migration, repair, MAO, or offer authority.

## 2. Planned surfaces
Planned implementation:

`build/apps-script-brand/AbsenteeOwnerEnrichmentExactRecordSelector.js`

Planned public RPC:

`reosAbsenteeOwnerEnrichmentExactRecordEvidence(options)`

Neither surface is created by this design increment.

## 3. Administrative authority
The public RPC MUST call `REOS.Security.requireAdmin()` before any
spreadsheet access.

Authorization failure MUST occur before spreadsheet reads.

## 4. Exact input contract
Exactly one target is permitted.

Required logical input:

- `rowNumber`: one finite integer physical data-row number.
- `identity["Distress Lead ID"]`: one nonempty expected persisted value.
- `identity["Canonical Property Key"]`: one nonempty expected persisted value.

Arrays, batches, predicates, searches, pagination, run-all requests,
scheduler context, and trigger context are prohibited.

`rowNumber` is physical-location evidence only. It is not canonical
identity authority.

## 5. Persisted dual-identity authority
Canonical target authority requires the persisted pair:

- `Distress Lead ID`
- `Canonical Property Key`

Both values MUST be present on the exact physical target row.

Both MUST exactly match the caller-supplied expected persisted values.

The selector MUST NOT derive, repair, backfill, guess, infer, or
manufacture either identity value.

A blank persisted `Canonical Property Key` MUST fail closed.

Address-derived or source-derived identity MUST NOT substitute for a
blank persisted canonical key.

## 6. Fixed table authority
The only permitted target table is `DISTRESS_LEADS`.

The caller cannot select another table or sheet.

The selector MUST resolve the existing `DISTRESS_LEADS` sheet and MUST
NOT create, rename, resize, or modify a sheet.

## 7. Bounded physical read contract
The selector MUST NOT call:

- `REOS.Database.getAll`
- `REOS.Database.query`
- `REOS.Database.findById`

It MUST NOT call another helper that internally expands into a complete
`DISTRESS_LEADS` data read.

The maximum permitted physical evidence reads are:

1. one current header-row read sufficient to resolve column authority;
2. one target data-row read at the caller-specified `rowNumber`.

The target data physical read MUST have height exactly `1`.

No neighboring data rows may be read.

No fallback scan is permitted.

The selector MUST NOT read the complete data region and subsequently
bound the result with `filter()`, `find()`, `slice()`, or an output limit.

A bounded returned result is not proof of a bounded physical read.

## 8. Header authority
The following headers MUST each occur exactly once:

- `Distress Lead ID`
- `Canonical Property Key`

Missing or duplicate required headers MUST fail closed.

Column positions MUST be resolved from the current ordered header row.

Hard-coded identity column numbers are prohibited.

## 9. Physical row validation
Before the target-row values are read, `rowNumber` MUST be verified as:

- finite;
- integer;
- greater than the header row;
- no greater than the current physical sheet row boundary.

An invalid row number fails closed.

It MUST NOT trigger a search for the requested identity elsewhere.

## 10. Exact target verification
Exactly one target data row is read.

The selector then extracts the persisted `Distress Lead ID` and
`Canonical Property Key` using the current header authority.

Both persisted values MUST be nonempty and MUST exactly equal the
expected caller-supplied values.

Any mismatch fails closed without another target-row read.

No identity search, fallback row, or repair path is permitted.

## 11. Returned evidence
After exact physical and persisted dual-identity verification, the
selector may return the complete values of that same physical row when
needed for Phase 1K preparation.

Successful evidence SHOULD identify:

- `ok: true`
- `mode: "READ_ONLY"`
- phase `absentee_owner_exact_record_evidence`
- table `DISTRESS_LEADS`
- verified physical `rowNumber`
- persisted `Distress Lead ID`
- persisted `Canonical Property Key`
- the verified row record

The returned evidence is observational only.

## 12. Required authority denials
Successful evidence MUST preserve false authority for:

- `productionDataMutationAuthorityGranted: false`
- `canonicalIdentityRepairAuthorityGranted: false`
- `migrationAuthorityGranted: false`
- `schedulerAuthorityGranted: false`
- `triggerAuthorityGranted: false`
- `connectorExecutionAuthorityGranted: false`
- `certificationMutationAuthorityGranted: false`
- `automaticOfferAuthorityGranted: false`

## 13. Mutation prohibition
The selector MUST NOT call or reach:

- `REOS.Database.insert`
- `REOS.Database.update`
- `REOS.Database.upsert`
- database deletion APIs
- `setValue`
- `setValues`
- `appendRow`
- `deleteRow`
- `SpreadsheetApp.flush`
- checkpoint writes
- property writes
- trigger installation or deletion
- generic acquisition mutation APIs

The selector MUST NOT mutate production data.

## 14. County isolation
The selector MUST NOT execute or alter:

- county connectors
- county scheduler
- county checkpoints
- county cursors
- county durable-identity migration
- county collapse
- county sparse-row repair
- county blocked-storage backfill
- county mutation-exclusion lease state

A county-originated row may be observed only as an already-existing
canonical `DISTRESS_LEADS` record.

## 15. Separation from certification mutation
The selector MUST NOT call
`reosAbsenteeOwnerEnrichmentCertifySingleRecord`.

It MUST NOT directly invoke:

- `REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize`
- `REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan`
- `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare`
- `REOS.AbsenteeOwnerEnrichmentExecutor.execute`

Successful selector evidence does not authorize the Phase 1K mutation
chain.

A future one-record production certification mutation requires a
separate explicit authorization gate.

## 16. Owner-evidence boundary
Canonical-record evidence is not owner evidence.

The selector MUST NOT manufacture `Owner Name`, `Owner Mailing Address`,
absentee status, or occupancy status.

A future `MATCHED` sanitizer input requires real external evidence
supporting at least one permitted owner semantic field.

`NO_MATCH` is not affirmative evidence and MUST NOT be converted into an
inferred absentee-owner conclusion.

## 17. Failure semantics
The selector fails closed for:

- unauthorized caller
- malformed input
- invalid physical row
- missing required header
- duplicate required header
- blank persisted Distress Lead ID
- blank persisted Canonical Property Key
- Distress Lead ID mismatch
- Canonical Property Key mismatch
- unexpectedly broad physical-read condition

Failure MUST NOT trigger fallback scanning, identity derivation, identity
repair, production mutation, county execution, or certification
execution.

## 18. Idempotence
The selector is observational.

Repeated reads against unchanged physical state and identical input
SHOULD return equivalent evidence.

It has no intended mutation side effects.

## 19. Acquisition safety gate
The selector MUST NOT create Qualified Deal Queue authority, advance the
acquisition lifecycle, establish ARV, establish repair scope, calculate
MAO, authorize an offer, generate an offer, or submit an offer.

Automatic MAO or offer authority requires both adequate comp-supported
ARV and an adequate repair scope.

Absentee-owner enrichment cannot bypass that gate.

## 20. Implementation certification sequence
If separately authorized, implementation proceeds through:

1. selector implementation;
2. static validator;
3. behavioral validator;
4. proof that the target data physical read has height exactly one;
5. proof that no complete `DISTRESS_LEADS` data read occurs;
6. runtime packaging reconciliation if required;
7. lifecycle-validator reconciliation if required;
8. CI;
9. merge;
10. deployment certification;
11. explicit authorization for one selector read;
12. exactly one read-only selector invocation.

No production selector invocation is authorized by this design.

## 21. Candidate-discovery separation
This selector verifies a supplied physical row plus expected persisted
dual identity.

It does not discover the initial candidate row.

Candidate discovery remains a separate evidence problem and MUST NOT be
silently implemented as a full-table scan inside this selector.

## 22. Promotion boundary
Successful exact-record evidence does not authorize:

- certification mutation
- owner-data mutation
- bulk enrichment
- scheduled enrichment
- automatic retries
- provider orchestration
- canonical identity repair
- county execution
- scheduler changes
- trigger changes
- MAO or offer authority
