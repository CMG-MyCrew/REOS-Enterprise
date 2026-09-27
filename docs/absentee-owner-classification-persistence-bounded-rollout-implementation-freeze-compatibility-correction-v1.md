# Absentee-Owner Classification Persistence and Bounded Rollout Implementation Freeze Compatibility Correction v1

## 1. Purpose

Resolve one implementation-time compatibility conflict discovered after the
Implementation Freeze v1 was merged.

The freeze requires four new absentee-owner classification persistence
runtime surfaces to be explicitly registered in the current
`POST_COUNTY_PRODUCTION_FILES` inventory.

The certified preimplementation inventory contains exactly `43` files.

Adding the four frozen runtime surfaces changes that current inventory to
exactly:

`47`

Two existing absentee-owner integration validators explicitly pin the current
post-county production inventory to `43`.

Those validators must therefore be reconciled before the implementation may
be certified.

This correction extends only the implementation-file modification boundary.
It does not change the persistence contract, implementation mechanics, runtime
authority, or production authorization.

## 2. Discovery authority

Read-only implementation discovery established:

- current post-county production inventory after the four frozen runtime
  registrations: `47`;
- frozen new runtime registration count: `4`;
- component validator inventory remains: `74`;
- historical county runtime inventory remains: `104`;
- historical reconciled production inventory remains: `147`.

Exactly two historical validators are coupled to the old current post-county
count of `43`:

1. `scripts/validate-absentee-owner-classification-integration-v1.js`
2. `scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js`

No other count-coupled validator was discovered.

## 3. Exact four runtime additions

The post-county count increase from `43` to `47` is caused only by these four
frozen runtime surfaces:

1. `build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js`
2. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js`
3. `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js`
4. `build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js`

No fifth runtime addition is authorized.

## 4. Corrected implementation modification boundary

Implementation Freeze v1 originally authorizes modification of exactly:

1. `.github/workflows/county-collapse-offline.yml`
2. `scripts/validate-county-runtime-integration.js`

This compatibility correction additionally authorizes modification of exactly:

3. `scripts/validate-absentee-owner-classification-integration-v1.js`
4. `scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js`

Therefore the complete implementation v1 candidate scope is frozen to:

- `7` new files;
- `4` modified existing files;
- `11` total files.

No other existing source or validator file is authorized to change.

## 5. Classification integration validator correction

Within:

`scripts/validate-absentee-owner-classification-integration-v1.js`

the future implementation may change only the current post-county inventory
authority from `43` to `47`, including:

- the exact `postCountyEntries.length` assertion;
- its associated diagnostic text;
- the emitted summary marker from
  `POST_COUNTY_PRODUCTION_FILE_COUNT=43`
  to
  `POST_COUNTY_PRODUCTION_FILE_COUNT=47`.

The validator must continue to require:

- component validator count `74`;
- historical county runtime inventory `104`;
- historical reconciled production inventory `147`;
- existing classification runtime registration;
- existing workflow registrations;
- no persistence authority in the read-only classifier itself.

## 6. Single-record certification integration validator correction

Within:

`scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js`

the future implementation may change only count-coupled post-county
expectations from `43` to `47`, including:

- its direct current post-county inventory assertion;
- its assertion that the classification integration validator expects `47`;
- its assertion that the classification integration summary emits
  `POST_COUNTY_PRODUCTION_FILE_COUNT=47`;
- associated diagnostic text.

The validator must continue to prove that the historical single-record
certification entrypoint is read-only and has no classification-persistence
or bounded-rollout authority.

## 7. Historical authority remains frozen

This correction MUST NOT change the certified historical county-runtime
inventory:

`104`

This correction MUST NOT change the certified historical reconciled
production inventory:

`147`

Those historical baselines describe earlier certified authority and are not
the current post-county additive inventory count.

## 8. Component validator inventory remains frozen

The component validator inventory remains exactly:

`74`

The new persistence implementation validators are registered directly in the
offline workflow and MUST NOT be inserted into the historical
`COMPONENT_VALIDATORS` inventory unless separately designed and certified.

## 9. No count-obfuscation workaround

The implementation MUST NOT evade historical validators by:

- string concatenation designed to hide runtime entries from regex checks;
- alternate quoting intended to defeat inventory matching;
- comments that claim `43` while the actual array contains `47`;
- duplicate or shadow inventories;
- dynamically generated runtime paths.

The current post-county inventory must truthfully contain exactly `47`
explicit runtime entries.

## 10. Existing freeze mechanics remain unchanged

All Implementation Freeze v1 mechanics remain authoritative, including:

- deterministic canonical JSON;
- deterministic classifier-result SHA-256;
- deterministic `AOCE-` Evidence Event ID;
- exact 20-column evidence schema;
- TextFinder-based exact-identity history;
- append-only evidence history;
- one `appendRow(...)` write;
- one explicit store `SpreadsheetApp.flush()` before readback;
- `REOS.Database.withScriptLockContext(...)`;
- no OPA HTTP under the persistence lock;
- sequential explicit targets;
- `MAX_TARGETS = 10`;
- no automatic retry;
- persistence-precondition failure halts rollout;
- persistence uncertainty halts rollout;
- production stages `1 -> 5 -> 10`.

This correction does not reopen those mechanics.

## 11. Implementation resume gate

Implementation may resume only after this compatibility correction completes:

1. local design-candidate certification;
2. design commit;
3. PR CI;
4. exact-head merge;
5. post-merge main CI.

The preserved implementation candidate must then be reconciled onto the newly
certified main before implementation certification continues.

The implementation may not simply commit the currently preserved candidate
against the pre-correction main.

## 12. Production remains blocked

This correction does not authorize:

- evidence workbook creation;
- evidence sheet creation;
- Script Property writes;
- Apps Script deployment;
- production RPC execution;
- production OPA HTTP;
- classification persistence;
- scheduler or trigger execution;
- automatic retries.

## 13. Acquisition safety remains unchanged

Absentee-owner classification remains supplemental evidence only.

It does not establish physical occupancy or vacancy.

It does not establish:

- comp-supported ARV;
- repair scope;
- MAO;
- Suggested Offer;
- offer-generation authority;
- offer-submission authority;
- automatic-offer authority.

Automatic MAO or offer authority remains blocked unless both independently
certified comp-supported ARV and adequate repair scope are present.

## 14. Corrected implementation scope summary

Future implementation v1 scope after this correction is exactly:

### Seven new files

1. `build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js`
2. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js`
3. `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js`
4. `build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js`
5. `scripts/validate-absentee-owner-classification-persistence-bounded-rollout-v1.js`
6. `scripts/validate-absentee-owner-classification-persistence-bounded-rollout-behavior-v1.js`
7. `scripts/validate-absentee-owner-classification-persistence-bounded-rollout-integration-v1.js`

### Four modified existing files

1. `.github/workflows/county-collapse-offline.yml`
2. `scripts/validate-county-runtime-integration.js`
3. `scripts/validate-absentee-owner-classification-integration-v1.js`
4. `scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js`

Total implementation scope:

`11`

No other file is authorized.

## 15. Correction safety boundaries

1. post-county current count changes only `43 -> 47`
2. increment is exactly four
3. increment corresponds exactly to four named runtime files
4. exactly two historical count-coupled validators may be reconciled
5. historical county runtime count `104` remains unchanged
6. historical reconciled production count `147` remains unchanged
7. component validator count `74` remains unchanged
8. no inventory-obfuscation workaround
9. implementation scope is exactly 11 files
10. seven new implementation files only
11. four modified existing files only
12. no Database modification
13. no DISTRESS_LEADS schema modification
14. no manifest modification
15. no clasp configuration modification
16. no existing classifier semantic modification
17. no existing comparison modification
18. no existing OPA lookup modification
19. no exact-record selector modification
20. no owner-enrichment persistence modification
21. no evidence-store provisioning
22. no production execution
23. no scheduler or trigger authority
24. no ARV authority
25. no repair-scope authority
26. no MAO authority
27. no automatic-offer authority
