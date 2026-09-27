# Absentee-Owner Classification Persistence and Bounded Rollout Implementation Freeze v1

## 1. Purpose

Freeze implementation-sensitive decisions left intentionally open by the
certified parent contract before runtime implementation begins.

This freeze is subordinate to:

`docs/absentee-owner-classification-persistence-bounded-rollout-contract-v1.md`

It narrows implementation choices.

It does not grant production execution or persistence authority.

## 2. Exact runtime decomposition

Implementation v1 consists of exactly four new Apps Script runtime surfaces:

1. `build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js`
2. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js`
3. `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js`
4. `build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js`

No implementation surface may become generic acquisition mutation authority.

## 3. Exact new validator decomposition

Implementation v1 adds exactly:

1. `scripts/validate-absentee-owner-classification-persistence-bounded-rollout-v1.js`
2. `scripts/validate-absentee-owner-classification-persistence-bounded-rollout-behavior-v1.js`
3. `scripts/validate-absentee-owner-classification-persistence-bounded-rollout-integration-v1.js`

The existing parent-contract validator remains authoritative and must also be
registered in CI.

## 4. Exact existing files permitted to change

Implementation v1 may modify exactly:

- `.github/workflows/county-collapse-offline.yml`
- `scripts/validate-county-runtime-integration.js`

It must not modify:

- `build/apps-script-brand/Database.js`
- `build/apps-script-brand/DistressLeadCountySchema.js`
- `build/apps-script-brand/appsscript.json`
- `.clasp.json`
- existing owner-enrichment persistence runtimes
- existing classifier/comparison/lookup runtimes
- the certified single-record read-only entrypoint

## 5. Exact bounded-rollout RPC

The only new public RPC is exactly:

`reosAbsenteeOwnerClassificationBoundedRollout(options)`

The runtime implementation surface is:

`AbsenteeOwnerClassificationBoundedRollout.js`

No alias RPC is authorized.

The historical:

`reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord`

remains read-only certification authority and must not be used as the rollout
implementation.

## 6. Contract-version binding

Persisted:

`Persistence Contract Version`

is exactly numeric:

`1`

Persisted:

`Classification Contract Version`

is exactly numeric:

`1`

Classification Contract Version 1 binds to the currently certified
`AbsenteeOwnerClassification.js` v1 semantics.

A semantic classifier contract change requires a new classification contract
version before new evidence may be persisted under that changed meaning.

## 7. Canonical JSON algorithm

Planner and evidence-event hashing use one strict canonical JSON algorithm.

The algorithm must:

- preserve `null`;
- preserve booleans;
- serialize strings with JSON string escaping;
- accept only finite numbers;
- canonicalize negative zero as `0`;
- preserve array order;
- reject sparse arrays;
- sort plain-object string keys lexicographically;
- reject `undefined`;
- reject functions;
- reject symbols;
- reject bigint;
- reject NaN and infinity;
- reject `Date` objects;
- reject cyclic structures;
- reject symbol-keyed objects;
- reject non-plain objects.

No locale-dependent serialization is permitted.

## 8. SHA-256 representation

All SHA-256 values are exactly:

- lowercase hexadecimal;
- 64 characters;
- SHA-256 over UTF-8 canonical text.

No caller-supplied classifier or event hash is trusted.

## 9. Persistence-eligible classifier envelope

Planner accepts only classifier results with:

- `ok: true`
- `mode: READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION`
- `phase: absentee_owner_classification`
- `classificationBasis: OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON`

and one of exactly:

- `ABSENTEE_OWNER_INDICATED`
- `OWNER_MAILING_MATCHED`
- `INSUFFICIENT_CLASSIFICATION_EVIDENCE`

The target must contain exactly:

- `rowNumber`
- `identity`

Identity must contain exactly:

- `Distress Lead ID`
- `Canonical Property Key`

Both normalized address objects must contain exactly:

- `street`
- `city`
- `state`
- `zip`

and all four values must be strings.

All classifier authority fields must exist and remain false.

`INELIGIBLE_COMPARISON_EVIDENCE` is never persistence input.

## 10. Differing Components JSON

Persistence representation is frozen as follows.

For:

`ABSENTEE_OWNER_INDICATED`

the persisted value is canonical JSON of the classifier's non-empty
`differingComponents` array.

For:

`OWNER_MAILING_MATCHED`

the persisted value is exactly:

`[]`

For:

`INSUFFICIENT_CLASSIFICATION_EVIDENCE`

where the classifier intentionally omits `differingComponents`, the persisted
value is exactly:

`null`

The implementation must not convert insufficient evidence into an empty
difference set.

## 11. Normalized-address JSON

`Normalized Property Address JSON` and
`Normalized Mailing Address JSON`

are canonical JSON strings of exactly the four normalized address fields:

- `street`
- `city`
- `state`
- `zip`

Raw OPA rows are not persisted.

Owner names are not persisted.

## 12. Classifier-result hash

`Classifier Result SHA-256`

is SHA-256 of canonical JSON of the complete accepted classifier-result object.

The complete object includes its target identity and all authority flags.

Unknown classifier-result fields fail closed rather than silently entering the
durable hash contract.

## 13. Deterministic Evidence Event ID

`Evidence Event ID` is deterministic.

It is exactly:

`AOCE-` + 64-character lowercase SHA-256

The hash input is canonical JSON of exactly:

- `persistenceContractVersion`
- `classificationContractVersion`
- `distressLeadId`
- `canonicalPropertyKey`
- `classifierResultSha256`

No timestamp, random UUID, row number, or mutable storage position participates
in Evidence Event ID.

Therefore the same dual identity plus the same classifier-result hash always
produces the same Evidence Event ID.

## 14. Duplicate detection precedes observation timestamp creation

Inside the persistence lock, implementation order is:

1. open and validate configured evidence store;
2. discover existing exact-identity history;
3. verify existing history integrity;
4. test whether the classifier-result hash already exists for that exact dual identity;
5. if duplicate, return zero-write `ALREADY_PERSISTED`;
6. only after duplicate rejection, generate `Observed At UTC`;
7. build the new event;
8. append once;
9. flush once;
10. read back and verify once.

A duplicate must not manufacture a new timestamp or evidence row.

## 15. Exact duplicate semantics

Duplicate detection applies across all prior events for the exact dual identity,
not only the newest event.

If the same classifier-result hash was ever persisted previously for that
identity:

- no new row is appended;
- no existing row is changed;
- no timestamp is refreshed;
- no retry occurs.

## 16. Duplicate-result naming freeze

To preserve both literals already present in the parent contract, the
zero-write duplicate result contains:

`outcome: ABSENTEE_OWNER_CLASSIFICATION_ALREADY_PERSISTED`

and:

`disposition: ALREADY_PERSISTED`

This is the single canonical v1 duplicate result envelope.

## 17. Verified-result naming freeze

A newly appended and fully readback-verified event returns:

`outcome: ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED`

and:

`disposition: PERSISTED`

No success may be claimed before exact postappend verification.

## 18. Persistence error classifications

Before the first physical append invocation, persistence-layer failure is:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED`

From immediately before the physical append invocation onward, any exception
or failed postimage verification is:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN`

No rollback claim is permitted.

No persistence retry is permitted.

## 19. Separate evidence workbook

The Script Property remains exactly:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

The evidence sheet remains exactly:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`

The configured evidence workbook must not be the active REOS acquisition-data
spreadsheet.

The runtime:

- must not create the workbook;
- must not create the sheet;
- must not add headers;
- must not repair headers;
- must not resize the sheet.

Missing or malformed storage fails closed.

## 20. Exact evidence headers

The evidence sheet must contain exactly 20 ordered headers:

1. `Evidence Event ID`
2. `Observed At UTC`
3. `Persistence Contract Version`
4. `Classification Contract Version`
5. `Distress Lead ID`
6. `Canonical Property Key`
7. `Physical Row Number`
8. `Classification Outcome`
9. `Classification Basis`
10. `Upstream Comparison Outcome`
11. `Differing Components JSON`
12. `Normalized Property Address JSON`
13. `Normalized Mailing Address JSON`
14. `Source Agency`
15. `Source Dataset`
16. `Source Table`
17. `Source Endpoint`
18. `Classifier Result SHA-256`
19. `Previous Evidence SHA-256`
20. `Evidence Event SHA-256`

No extra semantic column is permitted in v1.

Header cells must contain no formulas.

## 21. Fixed provenance

Every event persists exactly:

Source Agency:

`Philadelphia Office of Property Assessment`

Source Dataset:

`Philadelphia Properties and Assessment History`

Source Table:

`opa_properties_public`

Source Endpoint:

`https://phl.carto.com/api/v2/sql`

Classification Basis:

`OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON`

These values are runtime constants, not caller input.

## 22. Exact history lookup strategy

History discovery must not read the entire evidence sheet.

The store must:

1. resolve the exact `Distress Lead ID` header;
2. use a bounded column range from row 2 through current last row;
3. use `createTextFinder(distressLeadId)`;
4. require `matchEntireCell(true)`;
5. use `findAll()`;
6. inspect only rows returned by that exact Distress Lead ID search;
7. retain only rows whose `Canonical Property Key` exactly matches;
8. sort retained physical row numbers ascending.

`getDataRange()` and whole-sheet data reads are prohibited for history lookup.

## 23. Existing-history integrity

For every prior event retained for the exact dual identity, the store must
validate at minimum:

- exact 20-cell row shape;
- exact dual identity;
- safe/non-formula data cells;
- contract-version values;
- fixed provenance;
- lowercase SHA-256 fields;
- deterministic Evidence Event ID;
- deterministic Evidence Event SHA-256;
- previous-event chain.

The first exact-identity event must contain:

`GENESIS`

as Previous Evidence SHA-256.

Every later exact-identity event must point to the immediately preceding
exact-identity event hash in ascending physical-row order.

Invalid prior history fails closed before any append.

## 24. Previous-event selection

After validated history is sorted by physical row:

- no prior exact-identity event => `GENESIS`;
- otherwise => `Evidence Event SHA-256` from the highest physical row in the validated exact-identity history.

Physical row order is storage chronology because this store is append-only.

## 25. Observed At UTC

`Observed At UTC` is generated only by the trusted persistence runtime after
duplicate detection while the persistence lock is held.

It must equal canonical UTC ISO-8601 from:

`new Date().toISOString()`

Caller timestamps are prohibited.

## 26. Evidence Event SHA-256

The event hash input is canonical JSON of an object whose keys are exactly the
first 19 semantic evidence headers and whose values equal the exact cell values
to be appended.

`Evidence Event SHA-256` itself is excluded from its own hash input.

The resulting hash is stored as the 20th cell.

## 27. Exact physical write primitive

A new event is one 20-cell row.

The store uses exactly one:

`appendRow(...)`

for a new event.

Then exactly one:

`SpreadsheetApp.flush()`

occurs before postappend readback.

No `setValue`, `setValues`, `insertRow`, `deleteRow`, update, upsert, rewrite,
cleanup, rollback, or retry is authorized for event persistence.

## 28. Lock authority

Persistence execution uses:

`REOS.Database.withScriptLockContext(...)`

The store validates the exact active context through:

`REOS.Database.assertScriptLockContext(...)`

No `Database.js` modification is authorized.

The lock covers exactly one classification persistence attempt.

The lock begins only after selector, OPA lookup, comparison, and classification
have completed.

OPA HTTP must never execute while the persistence ScriptLock is held.

## 29. Persistence surface responsibilities

`AbsenteeOwnerClassificationPersistencePlanner.js` owns:

- classifier-result validation;
- canonical JSON;
- classifier-result hash;
- deterministic Evidence Event ID;
- canonical normalized JSON values;
- fixed semantic constants.

It performs no Spreadsheet read or write.

`AbsenteeOwnerClassificationEvidenceStore.js` owns:

- Script Property read;
- evidence-workbook open;
- exact header validation;
- exact-identity history discovery;
- history-chain verification;
- duplicate detection;
- previous-hash resolution;
- append;
- flush;
- postappend readback.

It requires a valid caller-owned lock context.

`AbsenteeOwnerClassificationPersistenceExecutor.js` owns:

- one `REOS.Database.withScriptLockContext(...)`;
- one persistence attempt;
- persistence outcome/error classification.

It performs no OPA HTTP.

`AbsenteeOwnerClassificationBoundedRollout.js` owns:

- public RPC;
- admin gate;
- whole-request validation;
- sequential per-target orchestration;
- certified upstream pipeline invocation;
- per-target result collection;
- halt behavior.

## 30. Whole-request rollout validation

The public RPC must first call:

`REOS.Security.requireAdmin()`

Before the first production target read, it then validates:

- options is a plain object;
- options contains exactly `targets`;
- targets is an array;
- target count is 1 through 10;
- every target contains exactly `rowNumber` and `identity`;
- rowNumber is an integer >= 2;
- identity contains exactly `Distress Lead ID` and `Canonical Property Key`;
- both identity values are nonblank strings;
- no duplicate rowNumber exists;
- no duplicate dual identity exists.

Malformed request failure occurs before selector or OPA execution.

## 31. Exact sequential target pipeline

For each target, in order, rollout invokes at most once:

1. `REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence`
2. `REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup`
3. `REOS.AbsenteeOwnerOwnerEvidenceComparison.compare`
4. `REOS.AbsenteeOwnerClassification.classify`
5. `REOS.AbsenteeOwnerClassificationPersistenceExecutor.execute`

No stage retries.

No target executes concurrently.

## 32. Ineligible classification behavior

If classifier output is:

`INELIGIBLE_COMPARISON_EVIDENCE`

the persistence executor is not called.

That target returns a no-write per-target result and later explicit targets may
continue.

## 33. Pre-persistence upstream failures

Selector, lookup, comparison, or classifier failure before persistence is a
per-target no-write failure.

Later explicit targets may continue.

No failed target retries.

## 34. Persistence-precondition failure policy

If the persistence layer raises:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED`

the rollout halts immediately.

Reason:

storage configuration, history integrity, lock authority, or persistence
preconditions may affect every later target; additional OPA calls must not be
spent after persistence infrastructure has proven unusable.

No later target starts.

No retry occurs.

## 35. Persistence-uncertainty policy

If persistence raises:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN`

the rollout halts immediately.

No later target starts.

No retry occurs.

Operator reconciliation is mandatory.

## 36. Bounded-rollout response boundary

The rollout response may return:

- requested target count;
- processed target count;
- halted boolean;
- halt classification when present;
- per-target rowNumber;
- per-target dual identity;
- classifier outcome;
- upstream comparison outcome;
- persistence outcome/disposition;
- classifier-result SHA-256;
- Evidence Event ID;
- Evidence Event SHA-256 where known.

It must not return:

- raw OPA rows;
- owner names;
- raw owner-evidence payloads;
- complete `DISTRESS_LEADS` rows.

## 37. Bounded-rollout authority flags

Every rollout result preserves false authority for:

- `productionDataMutationAuthorityGranted`
- `ownerEvidencePersistenceAuthorityGranted`
- `canonicalIdentityRepairAuthorityGranted`
- `migrationAuthorityGranted`
- `schedulerAuthorityGranted`
- `triggerAuthorityGranted`
- `connectorExecutionAuthorityGranted`
- `certificationMutationAuthorityGranted`
- `ownerOccupancyAuthorityGranted`
- `vacancyAuthorityGranted`
- `qualifiedDealQueueAuthorityGranted`
- `acquisitionLifecycleAuthorityGranted`
- `arvAuthorityGranted`
- `repairScopeAuthorityGranted`
- `maoAuthorityGranted`
- `automaticOfferAuthorityGranted`

Classification-evidence persistence authority is limited only to the dedicated
evidence store.

## 38. Production rollout stages remain external authorization

The runtime hard maximum is:

`MAX_TARGETS = 10`

The production authorization stages remain:

`1 -> 5 -> 10`

The caller cannot supply or elevate an authorization stage.

Successful stage 1 does not cause stage 5 automatically.

Successful stage 5 does not cause stage 10 automatically.

No stage authorizes scheduling.

## 39. Workflow integration freeze

Implementation must update:

`.github/workflows/county-collapse-offline.yml`

to add JavaScript syntax checks for:

- four new runtime surfaces;
- three new implementation validators;
- the existing parent-contract validator;
- this implementation-freeze validator.

It must add dedicated execution steps for:

- parent persistence/bounded-rollout contract validator;
- implementation-freeze validator;
- implementation static validator;
- implementation behavior validator;
- implementation integration validator.

No unrelated workflow behavior may change.

## 40. Runtime-integration freeze

Implementation must update:

`scripts/validate-county-runtime-integration.js`

only as needed to explicitly register the four new Apps Script production
runtime files in the existing post-county production addition inventory.

The runtime-integration change must not weaken historical file-count,
baseline, or controlled-modification protections.

## 41. Files explicitly not modified by implementation v1

Implementation v1 must leave byte-identical to its implementation base:

- `build/apps-script-brand/Database.js`
- `build/apps-script-brand/DistressLeadCountySchema.js`
- `build/apps-script-brand/appsscript.json`
- `.clasp.json`
- `build/apps-script-brand/AbsenteeOwnerClassification.js`
- `build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js`
- `build/apps-script-brand/AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js`
- `build/apps-script-brand/AbsenteeOwnerEnrichmentExactRecordSelector.js`
- existing owner-enrichment persistence runtimes.

## 42. Provisioning remains out of scope

Implementation v1 does not:

- create the evidence workbook;
- create the evidence sheet;
- write the Script Property;
- deploy Apps Script;
- execute production classification persistence.

Evidence-store provisioning requires a separate certified gate after runtime
implementation, merge, CI, and deployment certification.

## 43. Acquisition safety gate

Classification evidence remains supplemental evidence only.

It cannot:

- establish occupancy;
- establish vacancy;
- establish ARV;
- establish repair scope;
- calculate MAO;
- generate an offer;
- submit an offer;
- grant automatic offer authority.

Automatic MAO or offer authority remains blocked unless both independently
certified comp-supported ARV and adequate repair scope exist.

## 44. Implementation invariant

The implementation invariant is:

explicit target
+ one certified selector
+ at most one certified OPA lookup
+ one certified comparison
+ one certified classifier
+ deterministic planner
+ one lock-bounded append-only persistence attempt
= zero or one new evidence row

and:

same identity + same classifier-result hash
= zero-write `ALREADY_PERSISTED`

and:

persistence precondition failure
or persistence outcome uncertainty
= halt rollout, no retry

and:

no DISTRESS_LEADS classification mutation
+ no owner-name persistence
+ no OPA HTTP under persistence lock
+ no scheduler
+ no county mutation authority
+ no occupancy/vacancy inference
+ no ARV/repair/MAO/offer authority.
