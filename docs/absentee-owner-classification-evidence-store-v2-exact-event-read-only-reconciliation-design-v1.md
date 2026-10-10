# Absentee-Owner Classification Evidence Store V2 Exact-Event Read-Only Reconciliation — Design v1

## 1. Purpose

This design defines a strictly read-only administrative reconciliation surface for one exact persisted Absentee-Owner Classification Evidence Store V2 event after a production persistence attempt has entered an outcome-uncertain state.

The capability exists only to determine whether an exact V2 evidence event is present and valid in the already-configured evidence workbook.

It does not grant persistence, retry, rollout, acquisition, scheduler, trigger, enrichment, classification, or offer authority.

This design does not authorize a production RPC.

This design does not authorize implementation.

## 2. Certified baseline

This design is pinned to:

- merged main: `1cf3c8640fdefe48ace8865e53a405d1352a7180`;
- merged main tree: `3f73b0be7f5b3a35405df6bc0203029769475fe8`;
- production version involved in the reconciliation incident: `158`;
- V2 evidence store:
  `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js`;
- V2 planner:
  `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js`;
- V2 provisioning inspector:
  `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js`.

At this baseline, no public exact-event V2 reconciliation RPC exists.

The V2 evidence store exports only persistence and header access. Its exact stored-row validation and exact-identity history inspection remain internal persistence mechanics.

## 3. Incident reconciliation target

The initial authorized use case is the already-consumed one-shot production persistence attempt for:

- Evidence Event ID:
  `AOCE2-fc5fe8efdb7128c435016e4dbc3a8d02b395995f0454d5bbb205cd9a8305887f`;
- Distress Lead ID:
  `DL-20260825185532-4474`;
- Canonical Property Key:
  `property|parcel|pa|philadelphia|1473083`;
- physical `DISTRESS_LEADS` target row:
  `1530`.

The production write attempt count is already exactly one.

No second production write attempt is authorized.

Automatic retry is prohibited.

## 4. Capability boundary

The future capability name is:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_EXACT_EVENT_READ_ONLY_RECONCILIATION`

The future runtime filename may be:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ExactEventReadOnlyReconciliation.js`

The future public RPC may be:

`reosAbsenteeOwnerClassificationEvidenceStoreV2ExactEventReadOnlyReconciliation(options)`

Those names are reserved by this design only.

This design does not authorize creating the runtime or deploying the RPC.

## 5. Security boundary

The reconciliation surface MUST call:

`REOS.Security.requireAdmin()`

exactly once before reading administrative evidence-store state.

No caller-selected workbook authority is allowed.

The capability MUST use only the configured evidence workbook referenced by:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

The capability MUST fail closed if that property is absent, malformed, unsafe, or resolves to an invalid workbook state.

## 6. Exact input contract

The future RPC MUST require an exact plain object with exactly four fields:

1. `evidenceEventId`
2. `distressLeadId`
3. `canonicalPropertyKey`
4. `physicalTargetRowNumber`

No additional field is permitted.

For the incident-specific first reconciliation, the values MUST be exactly:

- `evidenceEventId` =
  `AOCE2-fc5fe8efdb7128c435016e4dbc3a8d02b395995f0454d5bbb205cd9a8305887f`
- `distressLeadId` =
  `DL-20260825185532-4474`
- `canonicalPropertyKey` =
  `property|parcel|pa|philadelphia|1473083`
- `physicalTargetRowNumber` =
  numeric `1530`

The input MUST NOT contain persistence metadata, workbook IDs, sheet IDs, physical evidence-store row numbers, retry tokens, write state, lock state, previous-event hashes, or caller-supplied event hashes.

## 7. Read-only storage scope

The capability MAY read only:

- the fixed configured evidence-workbook Script Property;
- the configured evidence workbook;
- the V2 sheet:
  `ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2`;
- the minimum V2 rows required to validate the exact dual-identity history and requested exact event.

It MUST NOT read `DISTRESS_LEADS`.

It MUST NOT invoke OPA.

It MUST NOT perform external HTTP.

It MUST NOT invoke any enrichment, retrieval, comparison, classification, persistence, rollout, scheduler, trigger, or acquisition workflow.

## 8. Exact V2 schema

The V2 sheet MUST retain exactly 27 columns in this exact order:

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
18. `Owner Evidence Lookup Mode`
19. `Certified OPA Account`
20. `Property Source Identity Certification Basis`
21. `Property Source Identity Certification SHA-256`
22. `Normal Lookup Evidence SHA-256`
23. `Owner Evidence Result SHA-256`
24. `Comparison Result SHA-256`
25. `Classifier Result SHA-256`
26. `Previous Evidence SHA-256`
27. `Evidence Event SHA-256`

Any schema deviation MUST fail closed.

## 9. Exact identity search

The reconciliation reader MUST search the V2 evidence history using the same semantic identity boundary already enforced by the certified V2 store:

- exact `Distress Lead ID`;
- exact `Canonical Property Key`.

The Distress Lead ID search MUST use an exact-cell match.

Rows returned by that search MUST then be filtered by exact Canonical Property Key equality.

Only rows belonging to the exact dual identity may enter reconciliation.

## 10. Stored-row validation

Every relevant row MUST:

- contain exactly 27 cells;
- contain no formulas;
- contain only safe spreadsheet text where text is expected;
- contain Persistence Contract Version numeric `2`;
- contain Classification Contract Version numeric `1`;
- contain a valid physical target row number;
- contain a valid V2 classification outcome;
- contain the certified classification basis;
- contain the exact certified source provenance constants;
- contain Owner Evidence Lookup Mode:
  `certified_opa_account`;
- contain a valid nine-digit Certified OPA Account;
- contain the certified property-source identity certification basis;
- contain lowercase SHA-256 values for all required provenance hashes;
- contain `GENESIS` or a lowercase SHA-256 in Previous Evidence SHA-256;
- contain a lowercase SHA-256 Evidence Event SHA-256.

Any invalid relevant row MUST fail closed.

## 11. Deterministic V2 Evidence Event ID validation

For every retained relevant event, the capability MUST recompute the deterministic `AOCE2-` Evidence Event ID from canonical data including exactly the V2 identity inputs already certified by the V2 store:

- Persistence Contract Version;
- Classification Contract Version;
- Distress Lead ID;
- Canonical Property Key;
- Certified OPA Account;
- Property Source Identity Certification SHA-256;
- Normal Lookup Evidence SHA-256;
- Owner Evidence Result SHA-256;
- Comparison Result SHA-256;
- Classifier Result SHA-256.

The recomputed event ID MUST exactly equal the persisted Evidence Event ID.

Caller-supplied identity MUST never substitute for deterministic recomputation.

## 12. Evidence event hash validation

For every retained row, the capability MUST reconstruct the canonical evidence event payload from the first 26 V2 persisted fields.

It MUST recompute the event SHA-256 using the same canonical hashing semantics already certified by the V2 persistence chain.

The recomputed SHA-256 MUST exactly equal the persisted:

`Evidence Event SHA-256`

Any mismatch MUST fail closed.

## 13. Hash-chain validation

For the first retained event for the exact dual identity:

`Previous Evidence SHA-256`

MUST equal:

`GENESIS`

For every later retained event, Previous Evidence SHA-256 MUST exactly equal the immediately preceding retained event's Evidence Event SHA-256.

Any chain mismatch MUST fail closed.

## 14. Duplicate deterministic event rejection

Within the exact dual-identity history, no Evidence Event ID may occur more than once.

A duplicate deterministic event ID MUST fail closed.

The reconciliation capability MUST NOT repair, deduplicate, delete, rewrite, or otherwise mutate duplicate evidence.

## 15. Exact requested-event reconciliation

After the complete exact dual-identity history is validated, the requested Evidence Event ID MUST match exactly one retained event.

Required cardinality:

`1`

Zero matches MUST return a definite not-present reconciliation outcome.

More than one match MUST fail closed as invalid persisted history.

For an exact match, the persisted event's `Physical Row Number` MUST equal the caller's authorized `physicalTargetRowNumber`.

For the initial incident-specific reconciliation, this value MUST equal numeric `1530`.

## 16. Response boundary

The RPC MUST return summary metadata only.

It MAY return:

- `ok`
- `mode`
- `outcome`
- `distressLeadId`
- `canonicalPropertyKey`
- `physicalTargetRowNumber`
- `physicalEvidenceRowNumber`
- `evidenceEventId`
- `observedAtUtc`
- `classifierResultSha256`
- `previousEvidenceSha256`
- `evidenceEventSha256`
- `identityHistoryCount`
- `eventMatchCount`
- `eventIdDeterministic`
- `eventHashValid`
- `historyHashChainValid`
- `duplicateEventIdAbsent`

It MUST NOT return:

- the full raw persisted row;
- raw provider payloads;
- raw OPA records;
- owner-name evidence;
- unnormalized source evidence;
- credentials;
- Script Properties unrelated to the configured evidence workbook.

## 17. Exact outcomes

The future capability SHOULD use narrowly defined read-only outcomes including:

- `ABSENTEE_OWNER_V2_EXACT_EVENT_RECONCILIATION_VERIFIED`
- `ABSENTEE_OWNER_V2_EXACT_EVENT_RECONCILIATION_NOT_PRESENT`
- `ABSENTEE_OWNER_V2_EXACT_EVENT_RECONCILIATION_PRECONDITION_FAILED`

Any ambiguous or structurally unsafe state MUST use the precondition-failed boundary.

The reconciliation surface itself has no write boundary and therefore MUST NOT manufacture a persistence-outcome-uncertain classification.

## 18. No persistence authority

The reconciliation capability MUST NOT call:

`REOS.AbsenteeOwnerClassificationEvidenceStoreV2.persist(...)`

It MUST NOT call the certified V2 bounded rollout RPC.

It MUST NOT call any internal or public persistence executor.

It MUST NOT reuse the consumed production write request.

It MUST NOT append a row.

It MUST NOT call `setValue(...)`.

It MUST NOT call `setValues(...)`.

It MUST NOT create, rename, delete, clear, or alter a sheet.

It MUST NOT write or delete a Script Property.

It MUST NOT call `SpreadsheetApp.flush()` as part of a mutation sequence.

## 19. No retry authority

This design grants no retry authority.

The production write attempt for the incident target has already been consumed.

A reconciliation result of not present, invalid, precondition failed, or any other result MUST NOT automatically cause another persistence attempt.

Any future write decision requires separately certified authority.

## 20. Acquisition isolation

This capability grants no authority to:

- determine owner occupancy;
- determine vacancy;
- create or update Qualified Deal Queue;
- advance acquisition lifecycle;
- calculate ARV;
- establish repair scope;
- calculate MAO;
- generate an offer;
- submit an offer.

The acquisition safety gate remains unchanged.

No automatic MAO or offer authority exists unless both comp-supported ARV and an adequate repair scope have separately been established.

## 21. Scheduler and trigger isolation

The capability grants no scheduler authority.

The capability grants no trigger authority.

It MUST NOT be added to a recurring production scheduler or trigger by this design.

Any recurring reconciliation capability would require separate certification.

## 22. Fail-closed requirements

The capability MUST fail closed on at least:

1. missing or invalid admin authority;
2. malformed options;
3. unexpected input field;
4. malformed Evidence Event ID;
5. malformed Distress Lead ID;
6. malformed Canonical Property Key;
7. invalid physical target row;
8. missing configured evidence workbook;
9. unsafe workbook alias;
10. missing V2 sheet;
11. invalid V2 schema;
12. formula-bearing relevant row;
13. unsafe spreadsheet text;
14. invalid contract version;
15. invalid classification semantics;
16. invalid source provenance;
17. invalid provenance hash;
18. nondeterministic Evidence Event ID;
19. invalid Evidence Event SHA-256;
20. invalid history hash chain;
21. duplicate deterministic event ID;
22. exact-event cardinality greater than one;
23. requested event physical-target-row mismatch.

No failure condition authorizes repair or mutation.

## 23. Implementation constraint

A future implementation MAY reuse the semantics of the existing internal:

- `validateStoredRow_(...)`
- `exactIdentityHistory_(...)`

but MUST NOT achieve read-only reconciliation by calling `persist(...)`.

The implementation SHOULD minimize semantic duplication where architecture permits, but any refactor exposing reusable read-only validation must itself preserve all existing persistence behavior and require separate implementation authorization.

## 24. Promotion sequence

This capability MUST proceed incrementally:

1. certify this design source edit;
2. validate the design artifact;
3. authorize design commit;
4. commit the design only;
5. push the design branch;
6. create one design PR;
7. certify PR CI;
8. merge exact-head design PR;
9. certify post-merge main;
10. perform implementation discovery;
11. establish implementation freeze;
12. authorize implementation source edits;
13. implement the read-only capability;
14. certify implementation;
15. separately authorize deployment;
16. separately authorize one read-only production reconciliation invocation.

No step implicitly authorizes a later step.

## 25. Absolute authority boundary

This design authorizes documentation only.

It does not authorize:

- runtime implementation;
- deployment;
- production invocation;
- evidence persistence;
- evidence repair;
- `DISTRESS_LEADS` mutation;
- automatic retry;
- scheduler execution;
- trigger creation;
- ARV authority;
- repair-scope authority;
- MAO authority;
- offer generation;
- offer submission.

This design does not authorize a production RPC.
