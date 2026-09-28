# Absentee-Owner Classification Evidence Store Sheet Identity Correction and Certified Orphan Adoption — Implementation Freeze v1

## 1. Purpose

This artifact freezes the exact implementation boundary for the already
certified absentee-owner classification evidence-store sheet-identity correction
and preserved-orphan adoption workstream.

It converts the completed implementation-scope discovery into a fixed file,
validator, CI-registration, safety, and production-authority boundary.

This artifact does NOT implement the correction.

This artifact does NOT implement orphan adoption.

This artifact does NOT authorize a provisioning retry.

No implementation is authorized by this freeze artifact alone.

## 2. Frozen Source Authority

Implementation v1 SHALL be based exactly on merged main:

`503562df82ec5565c19d3c579657aa490b06d863`

with tree:

`3d0f3af0473bbd6ae861b044d98c690bff0c9e8f`

The governing design is:

`docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.md`

with SHA-256:

`7df2d03a307a029840f06e192973b82a33fe9d8c8e2f883fd73ad0c7fb24a6c8`

The governing design validator is:

`scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js`

with SHA-256:

`eb3eebe8b7c7f218676555521d631ad223685b0548048178978805d3745006d3`

The current provisioning runtime is:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js`

with SHA-256:

`99f080635962dd83f4bafee22228c5c3ec6329ec089ee76966836b9afa135f0e`

## 3. Certified Incident Authority

The preserved orphan workbook SHALL remain bound only through its certified raw
workbook-ID SHA-256:

`4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce`

The raw orphan workbook ID SHALL NOT be hard-coded into the implementation
runtime, static validator, behavior validator, integration validator, workflow,
county runtime integration validator, or this freeze artifact.

The certified orphan sheet ID is exactly:

`0`

The first production provisioning invocation SHALL NOT be replayed.

`PROVISIONING_RETRY_AUTHORIZED=false`

## 4. Exact Future Implementation File Scope

The implementation increment SHALL contain exactly 14 changed files.

Exactly four files SHALL be new.

Exactly ten files SHALL modify existing files.

No fifteenth file is authorized without a new scope-discovery and freeze
increment.

## 5. Four New Files

The following four files SHALL be added and no other new implementation file is
authorized:

1. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js`
2. `scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js`
3. `scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js`
4. `scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js`

`IMPLEMENTATION_NEW_FILE_COUNT=4`

## 6. Ten Existing Files That May Be Modified

Only these ten existing files may be modified:

1. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js`
2. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js`
3. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js`
4. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js`
5. `.github/workflows/county-collapse-offline.yml`
6. `scripts/validate-county-runtime-integration.js`
7. `scripts/validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js`
8. `scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js`
9. `scripts/validate-absentee-owner-classification-integration-v1.js`
10. `scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js`

`IMPLEMENTATION_MODIFIED_FILE_COUNT=10`

`IMPLEMENTATION_TOTAL_FILE_COUNT=14`

## 7. Provisioning Runtime Correction Boundary

The existing provisioning runtime correction is strictly limited to replacing
the unstable JavaScript `Sheet` wrapper-reference identity check with stable
physical sheet-ID verification.

The existing check:

`sheets[0] !== sheet`

SHALL be removed as a physical-storage identity authority.

The corrected verifier SHALL use:

`Sheet.getSheetId()`

The corrected verifier SHALL require the positional sheet ID and the
name-resolved sheet ID to be valid finite non-negative integer values and equal.

Different JavaScript `Sheet` wrapper objects exposing the same valid sheet ID
SHALL be treated as the same physical sheet.

Different sheet IDs SHALL fail verification.

The provisioning runtime SHALL continue to expose exactly two provisioning
RPCs.

The correction SHALL NOT add an orphan-adoption RPC to the provisioning module.

The provisioning runtime SHALL continue to contain exactly one
`SpreadsheetApp.create(...)` call site.

The provisioning runtime SHALL continue to contain exactly one explicit
`SpreadsheetApp.flush()` call site.

The provisioning runtime SHALL continue to contain exactly one fixed Script
Property publication `setProperty(...)` call site.

The correction SHALL NOT authorize another invocation of the failed production
provisioning attempt.

## 8. Provisioning Static Validator Reconciliation

`scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js`

SHALL be modified only as required to certify the stable-sheet-ID correction
while preserving all existing provisioning safety requirements.

It SHALL require stable `getSheetId()` verification.

It SHALL reject the old wrapper-reference physical-identity authority.

It SHALL preserve:

- exactly two provisioning RPCs;
- exactly one workbook-create call site;
- exactly one explicit flush call site;
- exactly one Script Property publication call site;
- pre-publication verification before property publication;
- post-publication reopen verification;
- no persistence authority;
- no bounded-rollout authority;
- no automatic offer authority.

## 9. Provisioning Behavior Validator Reconciliation

`scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js`

SHALL be modified to add stable-sheet-ID behavior.

At minimum it SHALL prove:

1. different JavaScript sheet wrappers with the same valid sheet ID pass;
2. different sheet IDs fail;
3. missing `getSheetId()` fails;
4. negative sheet ID fails;
5. non-finite sheet ID fails;
6. non-integer sheet ID fails;
7. more than one sheet still fails;
8. wrong sheet name still fails;
9. schema mismatch still fails;
10. formula-bearing headers still fail.

The pre-existing provisioning success, precondition-failure, uncertain-outcome,
locking, publication, post-readback, and administrator cases SHALL remain
covered.

The corrected behavior validator SHALL NOT weaken the one-create, one-flush, or
one-property-publication requirements.

## 10. Separate Orphan-Adoption Runtime

The new runtime SHALL be:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js`

It SHALL expose exactly one public RPC:

`reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan(options)`

No alias RPC is authorized.

The runtime SHALL be incident-specific.

The runtime SHALL pin only the certified orphan workbook-ID SHA-256, never the
raw orphan workbook ID.

The runtime SHALL require:

`REOS.Security.requireAdmin()`

and:

`LockService.getScriptLock()`

with:

`tryLock(1000)`

The administrator check SHALL occur before administrative recovery authority is
returned and again after lock acquisition before recovery preconditions are
accepted.

## 11. Exact Orphan-Adoption Input

The adoption RPC SHALL accept an exact plain object containing exactly:

- `confirmAdoption`
- `orphanWorkbookId`
- `expectedOrphanWorkbookIdSha256`
- `expectedActiveReosSpreadsheetId`
- `expectedPropertyState`

`confirmAdoption` SHALL equal:

`ADOPT_CERTIFIED_ORPHAN`

`expectedPropertyState` SHALL equal:

`ABSENT`

`expectedOrphanWorkbookIdSha256` SHALL equal:

`4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce`

No extra keys are authorized.

## 12. Orphan Adoption Is Zero-Spreadsheet-Mutation Recovery

The orphan-adoption runtime SHALL NOT call:

`SpreadsheetApp.create(...)`

`insertSheet(...)`

`deleteSheet(...)`

`setName(...)`

`setValues(...)`

`setValue(...)`

`clear(...)`

`clearContent(...)`

`SpreadsheetApp.flush()`

Drive delete or trash APIs

sharing mutation APIs

The existing orphan workbook SHALL be adopted as-is.

`ORPHAN_ADOPTION_WORKBOOK_MUTATION_AUTHORIZED=false`

`REPLACEMENT_WORKBOOK_AUTHORIZED=false`

## 13. Exact Adoption Verification

Before the one authorized persistent write, the orphan-adoption runtime SHALL
verify all design-required preconditions, including:

- administrator authority;
- ScriptLock;
- exact active REOS spreadsheet identity;
- fixed property prestate absent;
- certified orphan workbook-ID SHA-256;
- separation from active REOS;
- exact workbook ID readback;
- exact workbook name;
- exactly one sheet;
- stable positional/name-resolved sheet-ID equality;
- certified sheet ID `0`;
- exact sheet name;
- exact 20-field schema;
- no header formulas;
- zero evidence data rows;
- effective recovery operator owns the workbook;
- zero additional editors;
- zero additional viewers.

Any failure before property publication SHALL perform zero persistent mutation.

## 14. Exact Persistent Mutation Authority

The orphan-adoption runtime may perform exactly one kind of persistent mutation:

publication of:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

with the certified orphan workbook ID supplied by the operator and verified by
SHA-256.

The orphan-adoption runtime SHALL contain exactly one `setProperty(...)` call
site.

It SHALL contain no `setProperties(...)` call.

It SHALL contain no `deleteProperty(...)` call.

`ORPHAN_ADOPTION_PROPERTY_PUBLICATION_MAX_CALLS=1`

## 15. Adoption Result Classification

The runtime SHALL use exactly:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_PRECONDITION_FAILED`

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_OUTCOME_UNCERTAIN`

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_VERIFIED`

with mode:

`ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION`

Failure before the Script Property publication boundary SHALL be definite
precondition failure.

Any exception or unverifiable state from entry into the property-publication
boundary onward SHALL be outcome uncertain.

No automatic retry is authorized.

## 16. New Orphan Static Validator

`scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js`

SHALL be a component validator.

It SHALL statically certify at least:

- exactly one public adoption RPC;
- fixed certified orphan SHA-256;
- no raw orphan ID hard-coded;
- administrator requirement;
- ScriptLock requirement;
- exact input contract;
- exactly one `setProperty(...)` call site;
- no spreadsheet creation;
- no spreadsheet mutation;
- no property deletion;
- no batch property write;
- no OPA / HTTP / classification / persistence / bounded-rollout authority;
- no ARV / repair-scope / MAO / offer authority.

## 17. New Orphan Behavior Validator

`scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js`

SHALL be a component validator.

It SHALL use mocked Apps Script services and prove both definite-no-write and
post-publication-uncertain boundaries.

It SHALL cover at least:

- administrator denial;
- invalid input;
- wrong confirmation token;
- wrong expected SHA;
- wrong computed orphan SHA;
- active spreadsheet mismatch;
- property already present;
- lock unavailable;
- orphan workbook open failure;
- workbook-ID mismatch;
- active-REOS alias;
- wrong workbook name;
- multiple sheets;
- wrong sheet name;
- mismatched stable sheet IDs;
- malformed sheet IDs;
- wrong schema;
- formula-bearing headers;
- non-empty evidence store;
- ownership mismatch;
- additional editors;
- additional viewers;
- `setProperty(...)` failure;
- property readback mismatch;
- post-publication reopen failure;
- post-publication verification failure;
- successful verified adoption;
- lock release behavior.

No behavior case may create or mutate a spreadsheet.

## 18. New Orphan Integration Validator

`scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js`

SHALL remain workflow-only and SHALL NOT become a `COMPONENT_VALIDATORS`
entry.

It SHALL certify:

- the exact new runtime;
- the exact new static validator;
- the exact new behavior validator;
- workflow registration;
- county runtime production allowlisting;
- component-validator registration of static + behavior only;
- component count reconciliation;
- post-county production count reconciliation;
- existing absentee-owner integration count reconciliation;
- no unauthorized production authority.

## 19. CI Registration Model

The workflow:

`.github/workflows/county-collapse-offline.yml`

SHALL register syntax checks and execution steps for:

1. `scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.js`
2. `scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js`
3. `scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js`
4. `scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js`

The workflow SHALL syntax-check:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js`

The design validator and integration validator remain workflow-only.

The orphan static validator and orphan behavior validator SHALL also be
registered in `COMPONENT_VALIDATORS`.

## 20. Component Validator Count Reconciliation

Current `COMPONENT_VALIDATORS` count is exactly:

`76`

The orphan static validator contributes one component validator.

The orphan behavior validator contributes one component validator.

The future exact component validator count SHALL be:

`78`

`CURRENT_COMPONENT_VALIDATOR_COUNT=76`

`FUTURE_COMPONENT_VALIDATOR_COUNT=78`

Exactly five existing absentee-owner integration validators are count-coupled to
the current component count and SHALL be reconciled from 76 to 78:

1. `scripts/validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js`
2. `scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js`
3. `scripts/validate-absentee-owner-classification-integration-v1.js`
4. `scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js`
5. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js`

Historical count assertions unrelated to the live component count SHALL remain
unchanged.

## 21. Post-County Production Runtime Count Reconciliation

Current post-county production runtime count is exactly:

`48`

The new orphan-adoption runtime contributes exactly one additive production
runtime.

The future exact post-county production runtime count SHALL be:

`49`

`CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=48`

`FUTURE_POST_COUNTY_PRODUCTION_FILE_COUNT=49`

Exactly three existing absentee-owner integration validators are count-coupled
to the current post-county count and SHALL be reconciled from 48 to 49:

1. `scripts/validate-absentee-owner-classification-integration-v1.js`
2. `scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js`
3. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js`

Historical county runtime inventories remain unchanged.

## 22. County Runtime Integration Reconciliation

`scripts/validate-county-runtime-integration.js`

SHALL add exactly one post-county production file:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js`

It SHALL add exactly two component validators:

`scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js`

`scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js`

The post-county production count SHALL move only from 48 to 49.

The component-validator count SHALL move only from 76 to 78.

The historical county runtime inventory of 104 files SHALL remain unchanged.

The historical reconciled production inventory of 147 files SHALL remain
unchanged wherever those values represent the historical baseline contract.

## 23. Existing Provisioning Integration Reconciliation

`scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js`

SHALL remain an existing modified file.

It SHALL reconcile:

- component validator count 76 to 78;
- post-county production count 48 to 49;
- workflow registration for the newly required design/orphan validators;
- production allowlisting of the orphan-adoption runtime.

It SHALL continue to require the provisioning design validator and provisioning
integration validator to remain workflow-only.

It SHALL NOT grant adoption authority to the existing provisioning module.

## 24. Exact Implementation Scope Invariant

The implementation diff relative to frozen main SHALL contain exactly:

`IMPLEMENTATION_NEW_FILE_COUNT=4`

`IMPLEMENTATION_MODIFIED_FILE_COUNT=10`

`IMPLEMENTATION_TOTAL_FILE_COUNT=14`

Every new file must be one of the four files in Section 5.

Every modified file must be one of the ten files in Section 6.

No other source, workflow, documentation, validator, deployment, or runtime file
may change in the implementation increment.

## 25. Implementation Validation Order

The later implementation candidate SHALL be validated in this order:

1. JavaScript syntax checks;
2. governing design validator;
3. implementation-freeze validator;
4. corrected provisioning static validator;
5. corrected provisioning behavior validator;
6. new orphan-adoption static validator;
7. new orphan-adoption behavior validator;
8. new orphan-adoption integration validator;
9. corrected provisioning integration validator;
10. affected absentee-owner count-coupled integration validators;
11. county runtime integration validator;
12. full registered offline CI workflow.

No production deployment or RPC execution is part of implementation validation.

## 26. No Production Mutation During Implementation

Implementation development, local validation, PR validation, merge validation,
and postmerge validation SHALL NOT:

- invoke the provisioning RPC;
- retry the failed provisioning operation;
- invoke the orphan-adoption RPC;
- publish the evidence workbook Script Property;
- create another evidence workbook;
- modify the preserved orphan workbook;
- delete the preserved orphan workbook;
- persist an absentee-owner classification;
- invoke bounded rollout;
- mutate scheduler or triggers.

## 27. Deployment Remains Separate

Completion and merge of the implementation increment SHALL NOT itself authorize
deployment.

Deployment of the corrected runtime and orphan-adoption runtime requires a
separate exact-source deployment certification.

Execution of orphan adoption requires a still-later separately authorized
production mutation gate after deployment and read-only preflight.

No implementation step may collapse implementation, deployment, and adoption
into one operation.

## 28. Acquisition Safety Boundary

The implementation grants no ARV authority.

The implementation grants no repair-scope authority.

The implementation grants no MAO authority.

The implementation grants no automatic offer authority.

Automatic MAO or offer authority remains prohibited unless BOTH:

1. comp-supported ARV is present; and
2. adequate repair scope is present.

Absentee-owner classification remains supplemental evidence only.

`PERSISTENCE_AUTHORITY_GRANTED=false`

`BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false`

`ARV_AUTHORITY_GRANTED=false`

`REPAIR_SCOPE_AUTHORITY_GRANTED=false`

`MAO_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`

## 29. Current Freeze Increment Scope

The current freeze increment SHALL create exactly two files:

1. `docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.md`
2. `scripts/validate-absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.js`

It SHALL modify zero existing files.

It SHALL create no implementation runtime.

It SHALL execute no production RPC.

It SHALL mutate no production state.

No implementation is authorized by this freeze artifact alone.
