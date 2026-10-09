# Absentee-Owner Classification Persistence Certified Property-Source Provenance Executor v2 — Implementation Freeze v1

## 1. Purpose

This document freezes the implementation boundary for:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXECUTOR_V2`

The certified implementation base is:

`9d52a78af5ecb6910e459034c108b69ded6643c4`

with tree:

`1bf5f64f6dd82bc5df3f1362bc291035137e7ff8`

This document is architecture and implementation-freeze authority only.

It does not authorize executor implementation, deployment, production execution,
classification persistence, evidence append, bounded rollout, orchestration,
scheduling, trigger creation, MAO calculation, offer generation, or offer
submission.

## 2. Parent authority

This freeze is subordinate to:

`docs/absentee-owner-classification-persistence-certified-property-source-provenance-extension-design-v2.md`

The parent design remains authoritative wherever this freeze does not further
narrow an implementation choice.

## 3. Existing certified V2 surfaces

The following existing runtime surfaces remain unchanged:

1. `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js`
2. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js`

The V2 evidence sheet is already separately provisioned as:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2`

No provisioning authority is part of this executor capability.

## 4. Exact future executor runtime

The future executor runtime filename is exactly:

`build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js`

The namespace is exactly:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2`

The internal method is exactly:

`execute`

This implementation freeze does not create that runtime.

## 5. No public RPC

The executor is an internal persistence mechanic.

No top-level Apps Script RPC is authorized by this capability.

No alias RPC is authorized.

Production orchestration remains a separate future capability.

## 6. Exact executor input

The executor accepts exactly one internally produced five-artifact evidence
bundle compatible with the certified V2 planner.

The bundle consists of:

1. `propertySourceIdentityCertification`
2. `normalLookupEvidence`
3. `ownerEvidenceResult`
4. `comparisonResult`
5. `classificationResult`

Caller-supplied arbitrary persistence plans are prohibited.

The executor must never accept a caller-supplied precomputed V2 plan as a
substitute for planner validation.

## 7. Planner ordering

The executor must call:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.prepare(...)`

before acquiring ScriptLock authority.

Planner rejection is a definite prewrite failure.

No ScriptLock is acquired when planner validation fails.

No spreadsheet write is attempted when planner validation fails.

## 8. Exact ScriptLock owner

The executor owns exactly one persistence lock through:

`REOS.Database.withScriptLockContext(...)`

`Database.js` is reused unchanged.

The V1-equivalence reconciliation and the subsequent V2 evidence-store
persistence attempt must occur inside the same lock authority.

No second ScriptLock may be acquired for the same persistence attempt.

The executor passes the exact active `lockContext` object into the V2 store.

## 9. Shared write-state token

Before lock acquisition the executor creates exactly one mutable write-state
token equivalent to:

`{ writeAttempted: false }`

The exact same token is passed into:

`REOS.AbsenteeOwnerClassificationEvidenceStoreV2.persist(...)`

The executor must not copy, replace, reset, or recreate the token after the
persistence lock begins.

## 10. No OPA or upstream retrieval under persistence lock

No OPA HTTP request may occur while the persistence ScriptLock is held.

The executor must not invoke:

- property-source retrieval;
- normal owner-evidence lookup;
- certified-account owner-evidence lookup;
- comparison;
- classification;
- candidate discovery;
- source enrichment.

Those upstream stages belong to a separately authorized future orchestrator.

## 11. V1-equivalence reconciliation purpose

Before permitting a V2 append, the executor must determine whether the exact
target and exact classifier-result evidence already exists in the V1 evidence
store.

If potentially equivalent V1 evidence exists, V2 persistence must stop for
explicit reconciliation.

No automatic V1-to-V2 migration is authorized.

No V1 event may be altered.

## 12. V1 evidence source

The configured evidence workbook remains identified only by Script Property:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

The V1 sheet remains:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`

V1 reconciliation is read-only.

The executor must not create the workbook, create the V1 sheet, repair headers,
resize the sheet, modify V1 rows, or change the Script Property.

## 13. V1 exact header contract

The V1 reconciliation must require the exact 20-column V1 header contract.

The certified:

`REOS.AbsenteeOwnerClassificationEvidenceStore.headers()`

surface may be used to obtain the expected ordered V1 header list.

Header cells must be formula-free.

Missing, malformed, duplicated, or reordered V1 headers fail closed before any
V2 store invocation.

## 14. Bounded V1 history discovery

V1 reconciliation must not perform a whole-sheet evidence read.

Inside the same ScriptLock, it must:

1. identify the exact V1 `Distress Lead ID` column;
2. bound the search from physical row 2 through current V1 last row;
3. call `createTextFinder(distressLeadId)`;
4. require `matchEntireCell(true)`;
5. call `findAll()`;
6. inspect only returned physical rows;
7. retain only rows whose `Canonical Property Key` exactly equals the V2 target;
8. sort retained physical rows ascending.

`getDataRange()` is prohibited for V1-equivalence history discovery.

## 15. Exact retained V1 row validation

Every retained V1 row must be read as exactly:

- 20 cell values; and
- 20 formula readbacks.

Every retained row must be formula-free.

The exact dual identity must match the requested V2 target.

Persistence Contract Version must be numeric `1`.

Classification Contract Version must be numeric `1`.

Classifier Result SHA-256 must be lowercase 64-character hexadecimal SHA-256.

Unsafe or structurally invalid relevant V1 evidence fails closed.

## 16. V1 deterministic event identity validation

For each retained V1 event, the executor must reconstruct the deterministic
V1 Evidence Event ID using the certified:

`REOS.AbsenteeOwnerClassificationPersistencePlanner.evidenceEventIdFor(...)`

surface.

The reconstructed ID must exactly equal the persisted V1 Evidence Event ID.

No caller-supplied event identity is trusted.

## 17. V1 event hash validation

For each retained V1 event, the executor must reconstruct the event hash using:

`REOS.AbsenteeOwnerClassificationPersistencePlanner.hashCanonicalObject(...)`

over the canonical object represented by the first 19 semantic V1 evidence
headers.

The reconstructed hash must exactly equal the persisted:

`Evidence Event SHA-256`

value.

## 18. V1 hash-chain validation

For the first retained event for the exact dual identity:

`Previous Evidence SHA-256`

must equal:

`GENESIS`

Every later retained event must reference the exact Event SHA-256 of the
immediately preceding retained physical row.

Malformed relevant history is a definite no-write precondition failure.

## 19. Exact V1-equivalence predicate

Potentially equivalent V1 evidence is established only when a fully validated
retained V1 event has:

`Classifier Result SHA-256`

exactly equal to the V2 plan:

`classifierResultSha256`

The stop code is exactly:

`V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION`

The stop is a definite zero-write V2 precondition result.

## 20. No silent duplication or migration

When exact V1-equivalent classifier evidence exists:

- the V2 store must not be called;
- no V2 row may be appended;
- no V1 row may be modified;
- no migration may execute;
- no retry may execute.

Explicit operator reconciliation is required before any later persistence
authority can be considered.

## 21. V2 store invocation

Only after the complete V1-equivalence reconciliation proves that no equivalent
V1 event exists may the executor call:

`REOS.AbsenteeOwnerClassificationEvidenceStoreV2.persist(...)`

The call receives:

- the exact V2 plan;
- the exact active `lockContext`;
- the exact shared `writeState`.

The V2 store remains responsible for:

- V2 storage validation;
- V2 exact-identity history discovery;
- V2 history-chain validation;
- V2 duplicate-event detection;
- previous-event hash selection;
- append;
- flush;
- exact postappend readback verification.

## 22. V2 duplicate semantics

A valid V2 duplicate result remains:

`ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED`

with zero new V2 evidence write.

A valid duplicate is success and is not an uncertain outcome.

## 23. V2 verified append semantics

A newly appended and fully verified V2 event remains:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED`

No executor layer may claim verified persistence unless the V2 store has
returned the certified verified result.

## 24. Prewrite failure classification

Before `writeState.writeAttempted` becomes true, failure is:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED`

This includes:

- invalid executor dependencies;
- rejected V2 plan;
- lock acquisition failure;
- V1 workbook or sheet precondition failure;
- malformed relevant V1 history;
- V1-equivalent evidence requiring reconciliation;
- V2 store precondition failure before physical append.

A prewrite failure is definite no-write.

## 25. Postwrite uncertainty classification

After `writeState.writeAttempted` becomes true, any exception or invalid
persistence result must be classified as:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN`

This includes uncertainty from:

- physical append;
- flush;
- postappend row-count verification;
- postappend exact-row verification;
- deterministic event verification;
- lock-scope finalization after the write boundary.

No rollback claim is permitted.

No automatic retry is permitted.

## 26. Executor authority envelope

Every executor result must preserve false authority for:

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
- `offerGenerationAuthorityGranted`
- `offerSubmissionAuthorityGranted`
- `automaticOfferAuthorityGranted`

Classification-evidence persistence is isolated to the separately authorized V2
evidence-store append path.

## 27. Acquisition isolation

The executor must not:

- write `DISTRESS_LEADS`;
- create or update Qualified Deal Queue;
- advance acquisition lifecycle;
- establish physical occupancy;
- establish vacancy;
- establish ARV;
- establish repair scope;
- calculate MAO;
- calculate Suggested Offer;
- generate an offer;
- submit an offer.

Automatic MAO or offer authority remains blocked unless adequate comp-supported
ARV and adequate repair scope are independently established.

## 28. Existing V1 runtimes remain unchanged

Implementation of the future V2 executor must not modify:

- `AbsenteeOwnerClassificationPersistencePlanner.js`
- `AbsenteeOwnerClassificationEvidenceStore.js`
- `AbsenteeOwnerClassificationPersistenceExecutor.js`
- `AbsenteeOwnerClassificationBoundedRollout.js`

The V1 bounded rollout continues to use the V1 executor.

## 29. Existing V2 planner and store remain unchanged

Implementation of the future executor must not modify:

- `AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js`
- `AbsenteeOwnerClassificationEvidenceStoreV2.js`
- `AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js`

The executor composes the existing certified surfaces.

## 30. Database remains unchanged

`build/apps-script-brand/Database.js`

must remain byte-identical to the executor implementation base.

Its existing non-replayable ScriptLock context is sufficient.

## 31. Exact later implementation decomposition

A later separately authorized executor implementation consists of exactly one
new Apps Script runtime:

`build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js`

and exactly three new validators:

1. `scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-v2.js`
2. `scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-behavior-v2.js`
3. `scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-integration-v2.js`

It may modify exactly:

- `.github/workflows/county-collapse-offline.yml`
- `scripts/validate-county-runtime-integration.js`

Total later implementation scope is therefore exactly six files.

This freeze does not authorize those later edits.

## 32. Workflow integration freeze

The later implementation workflow change must register only the executor's:

- syntax validation;
- static validator;
- behavior validator;
- integration validator;
- successor immutability boundary as required.

Historical validator protections must not be weakened.

Unrelated workflow behavior must not change.

## 33. County runtime integration freeze

The later executor implementation may update:

`scripts/validate-county-runtime-integration.js`

only as needed to register exactly one new production runtime:

`AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js`

Historical file-count, baseline, and controlled-modification protections must
not be weakened.

## 34. Required future behavioral coverage

Future executor validators must cover at least:

1. valid five-artifact bundle;
2. invalid bundle before lock;
3. arbitrary caller persistence plan rejection;
4. exactly one ScriptLock acquisition;
5. read-only V1 evidence-workbook property access;
6. exact V1 20-column headers;
7. formula-free V1 headers;
8. bounded Distress Lead ID TextFinder search;
9. exact Canonical Property Key filtering;
10. exact retained-row dual identity;
11. V1 contract versions 1/1;
12. V1 classifier-result hash validation;
13. V1 deterministic Evidence Event ID verification;
14. V1 deterministic event hash verification;
15. V1 `GENESIS` chain;
16. later V1 previous-event chaining;
17. malformed relevant V1 history fail-closed;
18. V1-equivalent classifier hash reconciliation stop;
19. zero V2 writes on V1 equivalence;
20. no V1-to-V2 migration;
21. no-equivalent-V1 path permits V2 store invocation;
22. same `lockContext` reaches V2 store;
23. same `writeState` reaches V2 store;
24. V2 exact duplicate zero-write success;
25. V2 verified append success;
26. V2 precondition failure before write;
27. postwrite failure becomes uncertain;
28. invalid postwrite store result becomes uncertain;
29. no automatic retry;
30. no rollback;
31. no OPA HTTP;
32. no public RPC;
33. no `DISTRESS_LEADS` mutation;
34. no V1 store mutation;
35. no Script Property mutation;
36. no QDQ authority;
37. no acquisition lifecycle authority;
38. no occupancy/vacancy authority;
39. no ARV authority;
40. no repair-scope authority;
41. no MAO authority;
42. no offer-generation/submission authority.

## 35. Separate future capabilities

This executor does not implement or authorize:

- production orchestration;
- bounded rollout for the certified-account path;
- scheduling;
- triggers;
- automatic persistence retries;
- materialized/current-state projection.

Each requires a separate capability and certification.

## 36. Current authorization state

At certification of this implementation freeze:

- V2 planner exists;
- V2 append-only store exists;
- V2 storage is provisioned;
- V2 executor runtime does not yet exist;
- no executor implementation authority is granted;
- no production persistence authority is granted;
- no V2 evidence append is authorized;
- no bounded rollout authority is granted;
- no orchestrator authority is granted;
- no MAO or offer authority is granted.
