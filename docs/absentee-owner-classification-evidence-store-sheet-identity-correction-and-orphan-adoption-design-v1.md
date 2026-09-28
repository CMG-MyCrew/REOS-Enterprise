# Absentee-Owner Classification Evidence Store Sheet Identity Correction and Certified Orphan Adoption — Design v1

## 1. Purpose

This design defines the corrective and recovery authority required after
the first production provisioning attempt for the absentee-owner
classification evidence store created the intended workbook and schema but
returned an outcome-uncertain result before publishing the fixed Script
Property.

The increment has exactly two goals:

1. correct the provisioning verifier so physical Google Sheet identity is
   established through a stable sheet ID rather than JavaScript wrapper-object
   reference identity; and
2. define a separately authorized, incident-specific recovery surface that may
   adopt the single already-created certified orphan workbook without creating,
   editing, replacing, deleting, renaming, sharing, or otherwise mutating that
   workbook.

This design does NOT authorize a provisioning retry.

This design does NOT authorize creation of a second evidence workbook.

No implementation is authorized by this design artifact alone.

## 2. Current Certified Production Authority

The design is pinned to:

- merged main:
  `83a88c0dc59de1b8c16ccfb51ec385e1bc4347f0`;
- merged main tree:
  `2d0d541a7d5972d66bcf71bfaf428616019a1397`;
- production Apps Script immutable version:
  `129`;
- current provisioning runtime:
  `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js`;
- current provisioning runtime SHA-256:
  `99f080635962dd83f4bafee22228c5c3ec6329ec089ee76966836b9afa135f0e`.

The post-uncertain read-only production inspection is certified as:

- `UNPROVISIONED`;
- fixed Script Property absent;
- configured workbook ID empty;
- provisioning mutation retry not executed;
- uncertain workbook preserved.

The existing production deployment remains immutable v129.

## 3. Incident-Specific Orphan Authority

The preserved orphan workbook SHALL be identified by SHA-256 of its raw
Google spreadsheet ID.

The exact certified orphan workbook-ID SHA-256 is:

`4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce`

The raw orphan workbook ID SHALL NOT be hard-coded in the future recovery
runtime.

The raw orphan workbook ID SHALL NOT be embedded in this design artifact.

The future recovery RPC MAY accept the raw workbook ID only as an explicit
operator-supplied input and SHALL require its SHA-256 to equal the fixed
certified orphan workbook-ID SHA-256 above.

No other workbook is eligible for this incident-specific recovery.

## 4. Certified Orphan Workbook State

The preserved orphan workbook is certified to have these properties:

1. it is a native Google spreadsheet;
2. its name is exactly:
   `REOS Absentee Owner Classification Evidence`;
3. it differs from the active REOS acquisition spreadsheet;
4. it contains exactly one sheet;
5. that sheet is named exactly:
   `ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`;
6. the certified sheet ID is exactly `0`;
7. row 1 contains exactly the 20 evidence headers defined by the existing
   provisioning contract;
8. the 20 header cells contain no formulas;
9. the sheet has no evidence data rows;
10. the workbook is not shared;
11. the provisioning operator is the workbook owner;
12. there are no additional editors;
13. there are no additional viewers;
14. the fixed Script Property remains absent.

The orphan workbook MUST remain preserved until a separately certified adoption
operation succeeds or a future explicitly authorized recovery decision is made.

## 4A. Exact Evidence Schema

The preserved orphan and every future verification governed by this design
SHALL use exactly these 20 evidence headers, in this exact order:

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

The schema SHALL contain exactly 20 used columns.

The header range SHALL contain no formulas.

No evidence data row may exist at orphan-adoption time.

## 5. Root Cause Requiring Correction

The current provisioning verifier resolves the single workbook sheet in two
ways:

- positionally through `workbook.getSheets()[0]`; and
- by name through `workbook.getSheetByName(SHEET_NAME)`.

It then rejects the workbook when:

`sheets[0] !== sheet`

That condition compares JavaScript service-object wrapper reference identity.

Wrapper reference identity SHALL NOT be treated as physical Google Sheet
identity.

The current false-negative check SHALL be removed.

The corrected verifier SHALL use:

`Sheet.getSheetId()`

as the stable physical sheet identity.

## 6. Stable Sheet Identity Contract

The corrected
`verifyProvisionedWorkbook_(workbook, activeId, expectedWorkbookId)`
implementation SHALL continue to require:

- a valid workbook;
- a safe non-empty workbook ID;
- workbook ID different from the active REOS spreadsheet ID;
- exact expected workbook ID when one is supplied;
- exactly one sheet;
- exact required sheet name;
- exact 20-column evidence schema;
- row 1 as the only used row;
- no header formulas.

For stable sheet identity it SHALL additionally require:

1. `workbook.getSheets()` returns exactly one sheet;
2. the positional sheet exposes `getSheetId()`;
3. the name-resolved sheet exposes `getSheetId()`;
4. both returned sheet IDs are finite integer values greater than or equal to
   zero;
5. the positional sheet ID equals the name-resolved sheet ID.

The corrected verifier SHALL NOT compare the two `Sheet` objects by JavaScript
reference equality or inequality.

Specifically, the corrected verifier SHALL NOT use:

`sheets[0] !== sheet`

as a storage-identity check.

## 7. Correction Must Preserve Existing Provisioning Safety

The sheet-identity correction SHALL NOT expand provisioning authority.

The existing provisioning RPC SHALL continue to:

- require `REOS.Security.requireAdmin()`;
- require exactly:
  - `expectedActiveReosSpreadsheetId`;
  - `expectedPropertyState`;
- require `expectedPropertyState` to equal `ABSENT`;
- acquire `LockService.getScriptLock()`;
- use fail-fast `tryLock(1000)`;
- create at most one workbook per explicitly authorized invocation;
- reuse the one initial sheet;
- perform exactly one explicit `SpreadsheetApp.flush()`;
- verify workbook separation;
- verify exact schema before property publication;
- publish the fixed Script Property only after pre-publication verification;
- re-read and reverify after publication;
- never retry automatically;
- never claim rollback.

The correction SHALL NOT authorize another invocation of the already-failed
production provisioning attempt.

## 8. Required Correction Behavior Tests

The later implementation behavior validator SHALL include at least these
identity cases:

1. positional and name-resolved wrappers are different JavaScript objects but
   expose the same `getSheetId()` value — verification MUST pass;
2. positional and name-resolved wrappers expose different `getSheetId()`
   values — verification MUST fail;
3. positional sheet lacks `getSheetId()` — verification MUST fail;
4. name-resolved sheet lacks `getSheetId()` — verification MUST fail;
5. sheet ID is negative, non-finite, non-integer, or otherwise malformed —
   verification MUST fail;
6. workbook contains more than one sheet — verification MUST fail;
7. sheet name differs — verification MUST fail;
8. exact schema differs — verification MUST fail;
9. a header formula exists — verification MUST fail.

No behavior test may restore wrapper reference equality as an identity
requirement.

## 9. Separate Orphan-Adoption Runtime

The orphan recovery authority SHALL be implemented in a separate future runtime
module:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js`

It SHALL expose exactly one public RPC:

`reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan(options)`

No alias RPC is authorized.

The existing provisioning RPC SHALL NOT be repurposed into an orphan-adoption
RPC.

The existing provisioning RPC SHALL NOT gain caller-supplied existing-workbook
authority.

## 10. Administrative Authority

The future orphan-adoption RPC SHALL call:

`REOS.Security.requireAdmin()`

before returning administrative storage identity or performing the one allowed
persistent mutation.

Administrator authority SHALL be required again after ScriptLock acquisition
and immediately before recovery preconditions are accepted.

No weaker authorization may substitute for administrator authority.

## 11. Exact Orphan-Adoption Input

The future orphan-adoption RPC SHALL require an exact plain object containing
exactly:

- `confirmAdoption`
- `orphanWorkbookId`
- `expectedOrphanWorkbookIdSha256`
- `expectedActiveReosSpreadsheetId`
- `expectedPropertyState`

`confirmAdoption` SHALL equal exactly:

`ADOPT_CERTIFIED_ORPHAN`

`expectedOrphanWorkbookIdSha256` SHALL equal exactly:

`4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce`

`expectedPropertyState` SHALL equal exactly:

`ABSENT`

`expectedActiveReosSpreadsheetId` SHALL be a non-empty safe value obtained from
the immediately preceding certified read-only inspection.

No extra keys are allowed.

The RPC SHALL NOT accept caller-supplied:

- property keys;
- workbook names;
- sheet names;
- sheet IDs;
- header arrays;
- source names;
- table names;
- endpoints;
- contract versions;
- replacement workbook IDs.

## 12. Orphan Workbook-ID Binding

The raw `orphanWorkbookId` SHALL:

- be non-empty;
- satisfy the existing REOS safe workbook-ID character boundary;
- be hashed with SHA-256 using UTF-8;
- produce exactly the fixed certified orphan workbook-ID SHA-256;
- differ from the active REOS spreadsheet ID.

A mismatched SHA-256 SHALL fail before any persistent write.

The future runtime SHALL pin the certified SHA-256 constant.

The future runtime SHALL NOT pin the raw orphan workbook ID.

## 13. Orphan-Adoption Concurrency

The orphan-adoption RPC SHALL acquire:

`LockService.getScriptLock()`

and SHALL use:

`tryLock(1000)`

The ScriptLock SHALL be held across:

- final administrator recheck;
- active REOS spreadsheet identity recheck;
- fixed Script Property prestate recheck;
- orphan workbook opening;
- workbook identity and separation verification;
- workbook-name verification;
- exact one-sheet verification;
- stable sheet-ID verification;
- exact schema verification;
- empty-store verification;
- access-binding verification;
- the single fixed Script Property publication;
- property readback;
- workbook reopen;
- complete post-publication verification.

No automatic retry is authorized.

## 14. Final Definite No-Write Boundary

Before the one allowed Script Property publication, the orphan-adoption RPC
SHALL fail closed unless all of these are true:

1. administrator authority succeeds;
2. ScriptLock is acquired;
3. active REOS spreadsheet ID exactly equals
   `expectedActiveReosSpreadsheetId`;
4. `expectedPropertyState` equals `ABSENT`;
5. fixed Script Property is absent or empty;
6. supplied orphan workbook-ID SHA-256 equals the certified SHA-256;
7. orphan workbook ID differs from the active REOS spreadsheet ID;
8. orphan workbook opens successfully;
9. workbook ID readback equals the supplied orphan workbook ID;
10. workbook name is exact;
11. workbook contains exactly one sheet;
12. positional and name-resolved sheet IDs are valid and equal;
13. certified sheet ID equals `0`;
14. sheet name is exact;
15. last row equals `1`;
16. last column equals `20`;
17. all 20 headers are exact;
18. all 20 header formulas are empty;
19. evidence data-row count equals `0`;
20. effective recovery operator owns the workbook;
21. there are zero additional editors;
22. there are zero additional viewers.

Any failure before the property publication SHALL guarantee that the
orphan-adoption invocation performed no persistent mutation.

## 15. Spreadsheet Mutation Is Prohibited

The orphan-adoption runtime SHALL NOT call:

- `SpreadsheetApp.create(...)`;
- `insertSheet(...)`;
- `deleteSheet(...)`;
- `setName(...)`;
- `setValues(...)`;
- `setValue(...)`;
- `clear(...)`;
- `clearContent(...)`;
- `SpreadsheetApp.flush()`;
- Drive trash/delete APIs;
- sharing mutation APIs.

The certified orphan workbook MUST be adopted as-is.

A replacement workbook SHALL NOT be created.

A second evidence store SHALL NOT be created.

## 16. Exact Persistent Mutation Authority

The orphan-adoption RPC may perform exactly one persistent mutation:

publish the fixed Script Property:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

with value equal to the exact certified orphan workbook ID supplied by the
operator and verified by SHA-256.

The publication SHALL use exactly one:

`setProperty(...)`

call site.

No `setProperties(...)` call is authorized.

No `deleteProperty(...)` call is authorized.

No unrelated Script Property may be created, changed, or deleted.

## 17. Property Publication Boundary

Property publication SHALL occur only AFTER all pre-write orphan workbook,
schema, access, separation, stable sheet identity, and empty-store
certifications have succeeded.

The future runtime SHALL NOT publish the property and then attempt to repair the
workbook.

The workbook must already satisfy the complete certified target state before
publication.

## 18. Post-Publication Verification

After the one allowed property write, the orphan-adoption RPC SHALL:

1. re-read the fixed property;
2. require exact equality with the supplied orphan workbook ID;
3. reopen the workbook using the property readback;
4. require workbook ID exactness;
5. require separation from the active REOS spreadsheet;
6. require exact workbook name;
7. require exactly one sheet;
8. require stable positional/name-resolved sheet-ID equality;
9. require certified sheet ID `0`;
10. require exact sheet name;
11. require last row `1`;
12. require last column `20`;
13. require exact 20 headers;
14. require no header formulas;
15. require zero evidence data rows;
16. reverify owner/effective-user equality;
17. reverify zero additional editors;
18. reverify zero additional viewers.

Only then may orphan adoption return verified success.

## 19. Orphan-Adoption Result Classifications

The future orphan-adoption runtime SHALL use these exact result
classifications:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_PRECONDITION_FAILED`

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_OUTCOME_UNCERTAIN`

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_VERIFIED`

The mode SHALL be exactly:

`ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION`

A failure before the Script Property write SHALL be
`...ORPHAN_ADOPTION_PRECONDITION_FAILED`.

Any exception or unverifiable state from entry into the Script Property
publication boundary onward SHALL be
`...ORPHAN_ADOPTION_OUTCOME_UNCERTAIN`.

An uncertain adoption result SHALL NOT be replayed automatically.

Read-only inspection SHALL be required to reconcile any uncertain result.

## 20. Successful Orphan-Adoption Response

A verified orphan-adoption response MAY expose only administrative recovery
metadata required for certification, including:

- `ok: true`;
- mode;
- verified classification;
- contract version;
- certified orphan workbook-ID SHA-256;
- fixed property key;
- fixed sheet name;
- certified sheet ID;
- schema field count `20`;
- schema exactness;
- property readback verification;
- workbook separation verification;
- access-binding verification;
- evidence row count `0`;
- `propertyWriteExecuted: true`;
- `workbookCreated: false`;
- `workbookMutated: false`;
- `provisioningRetryExecuted: false`;
- `persistenceAuthorized: false`;
- `boundedRolloutAuthorized: false`;
- `automaticOfferAuthorityGranted: false`.

The successful orphan-adoption response SHALL NOT expose the raw orphan
workbook ID.

## 21. Existing Inspection RPC Remains Read-Only Authority

The existing RPC:

`reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(options)`

remains the sole general read-only provisioning-state inspection surface.

Before adoption it SHALL report:

`UNPROVISIONED`

with the fixed property absent.

After a verified orphan adoption, a separately invoked inspection SHALL be
required to report:

`ALREADY_PROVISIONED`

and SHALL independently verify:

- configured workbook differs from active REOS;
- configured workbook opens;
- exact evidence sheet exists;
- exact 20-header schema exists;
- no header formulas exist.

The adoption RPC SHALL NOT internally invoke classification persistence or
bounded rollout after property publication.

## 22. No Provisioning Retry

The failed production provisioning invocation SHALL NOT be replayed.

The future corrected provisioning code exists to prevent recurrence in a future
legitimate provisioning event; it is not authority to create a replacement
store for this incident.

For this incident:

- preserved orphan adoption is the only future recovery path authorized by this
  design;
- a second workbook is prohibited;
- deletion or cleanup of the preserved orphan is prohibited;
- replacement provisioning is prohibited.

## 23. Persistence and Rollout Remain Separate

A verified orphan adoption SHALL NOT itself authorize classification
persistence.

A verified orphan adoption SHALL NOT itself authorize bounded rollout.

After adoption, the sequence SHALL remain:

1. separately invoke the read-only inspection;
2. require `ALREADY_PROVISIONED`;
3. separately certify persistence readiness;
4. separately authorize Stage 1 only;
5. Stage 1 remains the previously certified exact single-record target;
6. any later 5-target or 10-target rollout remains separately authorized.

No automatic transition from adoption to persistence is allowed.

## 24. Explicitly Prohibited Authority

Neither the correction nor orphan-adoption implementation may:

- call OPA or external HTTP;
- read or mutate `DISTRESS_LEADS`;
- classify absentee ownership;
- invoke owner evidence lookup;
- invoke comparison;
- invoke exact-record selection;
- invoke classification persistence;
- invoke bounded rollout;
- alter scheduler triggers;
- alter county scheduler state;
- alter county checkpoints;
- alter county leases;
- repair canonical property identity;
- modify acquisition lifecycle state;
- modify Qualified Deal Queue state;
- determine physical occupancy or vacancy;
- determine ARV;
- determine repair scope;
- calculate MAO;
- generate an offer;
- submit an offer.

## 25. Acquisition Safety Gate

This recovery grants no acquisition authority.

Automatic MAO or offer authority remains prohibited unless BOTH:

1. comp-supported ARV is present; and
2. adequate repair scope is present.

Absentee-owner classification remains supplemental evidence only.

`persistenceAuthorized: false`

`boundedRolloutAuthorized: false`

`automaticOfferAuthorityGranted: false`

## 26. Future Implementation Scope

A later separately authorized implementation increment MAY:

1. modify:
   `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js`
   only as required to replace wrapper reference identity with stable
   `getSheetId()` verification;
2. add:
   `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js`;
3. add static, behavior, and integration validators for the orphan-adoption
   runtime;
4. reconcile the existing provisioning behavior validator to prove separate
   wrapper objects with the same sheet ID are valid;
5. register required validators in the current CI workflow and reconcile live
   count-coupled integration validators where required.

The exact implementation file scope and validator-count reconciliation SHALL be
established by a separate implementation discovery/freeze increment.

This design does not authorize those changes.

## 27. Current Design Increment Scope

The current design increment itself SHALL create exactly two files:

1. `docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.md`
2. `scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js`

It SHALL modify zero existing files.

It SHALL create no runtime authority.

It SHALL execute no provisioning RPC.

It SHALL execute no orphan-adoption RPC.

It SHALL write no Script Property.

It SHALL mutate no workbook.

It SHALL persist no classification.

It SHALL grant no bounded-rollout authority.

No implementation is authorized by this design artifact alone.
