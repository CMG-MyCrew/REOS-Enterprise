# Absentee-Owner Classification Evidence Store Provisioning Admin Surface — Design v1

## 1. Purpose

This design defines the only authorized administrative surface for provisioning the dedicated absentee-owner classification evidence store required by the already-deployed absentee-owner classification persistence bounded-rollout runtime.

This surface exists only because the persistence runtime is intentionally fail-closed and has no workbook-creation, sheet-creation, or Script Property write authority.

Provisioning authority MUST remain separate from:

- absentee-owner classification itself;
- bounded rollout;
- OPA lookup;
- acquisition lifecycle authority;
- Qualified Deal Queue authority;
- ARV authority;
- repair-scope authority;
- MAO authority;
- offer generation;
- offer submission;
- scheduler or trigger authority.

## 2. Current Production Authority

The design is pinned to:

- merged main: `22ff0e5410bde6e8826f4a993e7bce7bb3665866`;
- merged main tree: `8179b53f9d592b944ac7f9d93285deca0e692181`;
- production Apps Script immutable version: `128`;
- existing production deployment ID preserved from v127 to v128;
- deployed persistence store:
  `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js`;
- deployed persistence store SHA-256:
  `e2f7761af4b18137278ba02a1f5f3c1bda41ce7b481ec78111dc49285b0eb5c2`.

No production provisioning has yet occurred.

## 3. Exact Future Runtime Surface

Implementation v1 SHALL add exactly one new Apps Script runtime module:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js`

The module SHALL expose exactly two public top-level RPC entrypoints:

1. `reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(options)`
2. `reosAbsenteeOwnerClassificationEvidenceStoreProvision(options)`

No alias RPC is authorized.

No other existing runtime module SHALL receive provisioning authority.

The existing persistence planner, evidence store, persistence executor, bounded rollout, classifier, comparison, OPA lookup, selector, Database, manifest, and acquisition modules SHALL NOT be modified merely to enable provisioning.

## 4. Administrative Authorization

Both public RPCs SHALL call:

`REOS.Security.requireAdmin()`

before returning any administrative storage identity or performing any mutation.

No weaker permission such as `reports:read`, `finance:write`, or a caller-supplied authorization boolean may substitute for `REOS.Security.requireAdmin()`.

The module SHALL NOT seed an administrator, modify user roles, or alter permissions.

## 5. Fixed Provisioning Constants

The provisioning module SHALL hard-code these exact constants:

### Script Property key

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

### Workbook name

`REOS Absentee Owner Classification Evidence`

### Sheet name

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`

### Exact evidence headers

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

The module SHALL NOT accept caller-supplied property keys, workbook IDs, workbook names, sheet names, header arrays, source names, table names, endpoints, or contract versions.

## 6. Read-Only Inspection RPC

`reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(options)`

SHALL be strictly read-only.

It SHALL:

1. require administrator authority;
2. require `options` to be absent or an exact empty object;
3. read the active REOS spreadsheet using `SpreadsheetApp.getActiveSpreadsheet()`;
4. require an active spreadsheet with a non-empty ID;
5. read only the fixed Script Property key;
6. never call `SpreadsheetApp.create`;
7. never call `insertSheet`;
8. never write a spreadsheet cell;
9. never call `setProperty`, `setProperties`, or `deleteProperty`;
10. never invoke the persistence or bounded-rollout RPC;
11. never perform HTTP.

The inspection result SHALL classify the current state as exactly one of:

- `UNPROVISIONED`
- `ALREADY_PROVISIONED`
- `UNSAFE_ACTIVE_REOS_ALIAS`
- `CONFIGURED_WORKBOOK_UNOPENABLE`
- `CONFIGURED_SHEET_MISSING`
- `CONFIGURED_SCHEMA_INVALID`

### UNPROVISIONED

Returned only when the fixed Script Property is absent or empty.

### ALREADY_PROVISIONED

Returned only when:

- the configured workbook ID differs from the active REOS spreadsheet ID;
- the configured workbook opens successfully;
- the exact evidence sheet exists;
- row 1 contains exactly the 20 required headers;
- the header range contains no formulas;
- the sheet has exactly 20 used columns;
- no provisioning mutation is required.

### Unsafe or invalid classifications

Any non-empty configured property that fails the above requirements SHALL be reported without mutation.

Inspection SHALL NOT silently repair any invalid state.

## 7. Inspection Response Boundary

The inspection response MAY include only administrative provisioning metadata required for operator certification, including:

- `ok`;
- `mode`;
- `classification`;
- `activeReosSpreadsheetId`;
- `propertyKey`;
- `propertyPresent`;
- `configuredWorkbookId`;
- `configuredWorkbookOpenable`;
- `configuredWorkbookDiffersFromActiveReos`;
- `sheetName`;
- `sheetPresent`;
- `schemaFieldCount`;
- `schemaExact`;
- `headerFormulasPresent`;
- `provisioningRequired`;
- `provisioningAuthorized`;
- `persistenceAuthorized`;
- `boundedRolloutAuthorized`;
- `automaticOfferAuthorityGranted`.

It SHALL NOT return:

- owner names;
- owner mailing addresses;
- OPA payloads;
- property lead rows;
- classification results;
- ARV;
- repair scope;
- MAO;
- offer data.

For inspection, `provisioningAuthorized` SHALL always be `false`.

## 8. Provisioning RPC Input

`reosAbsenteeOwnerClassificationEvidenceStoreProvision(options)`

SHALL require an exact plain object with exactly:

- `expectedActiveReosSpreadsheetId`
- `expectedPropertyState`

`expectedPropertyState` SHALL equal:

`ABSENT`

No extra keys are allowed.

`expectedActiveReosSpreadsheetId` SHALL be a non-empty safe text value obtained from the immediately preceding read-only inspection.

The provisioning RPC SHALL NOT accept an existing workbook ID.

The provisioning RPC SHALL NOT accept a caller-selected destination.

## 9. Provisioning Concurrency

The provisioning RPC SHALL acquire a ScriptLock before its final precondition re-read and SHALL hold that lock through:

- active REOS spreadsheet identity verification;
- Script Property prestate verification;
- workbook creation;
- sheet rename;
- header write;
- explicit flush;
- workbook/sheet/schema verification;
- Script Property publication;
- final property readback;
- final workbook/sheet/schema readback.

Only one provisioning attempt is authorized per explicit operator invocation.

There is no automatic retry.

## 10. Final Definite No-Mutation Boundary

Before `SpreadsheetApp.create(...)`, the RPC SHALL verify under lock:

1. administrator authority remains valid;
2. active REOS spreadsheet ID exactly equals `expectedActiveReosSpreadsheetId`;
3. the fixed Script Property remains absent or empty;
4. `expectedPropertyState` equals `ABSENT`;
5. required Spreadsheet and Properties APIs are available.

Any failure before `SpreadsheetApp.create(...)` SHALL be classified:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_PRECONDITION_FAILED`

and SHALL guarantee no provisioning mutation was performed by that invocation.

## 11. Workbook Creation

The first provisioning mutation SHALL be exactly one invocation of:

`SpreadsheetApp.create('REOS Absentee Owner Classification Evidence')`

No second workbook creation is authorized.

Immediately after creation:

- the returned workbook object must be valid;
- the new workbook ID must be non-empty;
- the new workbook ID must differ from the active REOS spreadsheet ID.

The provisioning runtime SHALL NOT create the evidence store inside the active REOS acquisition workbook.

## 12. Sheet Creation Policy

Because `SpreadsheetApp.create(...)` creates a workbook with an initial sheet, implementation v1 SHALL reuse that initial sheet.

The module SHALL:

1. require exactly one initial sheet after workbook creation;
2. rename that initial sheet to:
   `ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`;
3. NOT call `insertSheet(...)`;
4. NOT create additional sheets;
5. NOT delete sheets.

The resulting evidence workbook SHALL contain exactly one sheet at provisioning completion.

## 13. Header Initialization

The module SHALL write exactly one header row:

- row 1;
- columns 1 through 20;
- exact values defined by this contract.

The module SHALL NOT write any evidence data row during provisioning.

After the header write it SHALL perform exactly one explicit:

`SpreadsheetApp.flush()`

for the provisioning mutation sequence.

It SHALL then verify:

- workbook identity;
- workbook separation from active REOS;
- exactly one sheet;
- exact sheet name;
- last row equals 1;
- last column equals 20;
- exact 20 header values;
- all 20 header formulas are empty.

## 14. Script Property Publication

The fixed Script Property SHALL be published only AFTER the newly created workbook and schema have passed all required verification.

Publication SHALL use exactly one:

`PropertiesService.getScriptProperties().setProperty(...)`

for the fixed property key.

No `setProperties(...)` call is authorized.

No unrelated Script Property may be created, changed, or deleted.

The property value SHALL be exactly the newly created evidence workbook ID.

## 15. Post-Publication Verification

After property publication, the module SHALL:

1. re-read the fixed property;
2. require exact equality with the newly created workbook ID;
3. reopen the configured workbook by the published ID;
4. require it still differs from the active REOS spreadsheet;
5. re-verify exact one-sheet geometry;
6. re-verify the exact sheet name;
7. re-verify the exact 20 headers;
8. re-verify no header formulas;
9. require no evidence data rows.

Only then may the operation return:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED`

## 16. Already-Provisioned Boundary

If the fixed Script Property is non-empty at the locked prestate:

- the provisioning RPC SHALL NOT create a workbook;
- SHALL NOT overwrite the property;
- SHALL NOT attempt repair;
- SHALL NOT delete anything.

If the existing configured store is valid, the caller must use the inspection RPC and treat it as `ALREADY_PROVISIONED`.

If the existing configured store is invalid, provisioning SHALL fail closed and require a separately designed remediation process.

Implementation v1 has no remediation or replacement authority.

## 17. Outcome-Uncertain Boundary

From entry into the single `SpreadsheetApp.create(...)` invocation onward, any exception or unverifiable state SHALL be classified:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN`

This includes failures during:

- workbook creation;
- initial sheet verification;
- sheet rename;
- header write;
- flush;
- schema readback;
- Script Property publication;
- property readback;
- final workbook reopen;
- final schema verification.

The response SHALL preserve the created workbook ID whenever it is known so an operator can reconcile a possible orphan workbook.

The runtime SHALL NOT claim rollback.

## 18. No Automatic Cleanup

Implementation v1 SHALL NOT:

- delete a newly created workbook after failure;
- trash a workbook;
- clear the Script Property automatically;
- replace the Script Property automatically;
- delete a sheet;
- retry provisioning;
- create a second workbook.

Any uncertain or orphaned state requires a separate read-only reconciliation and explicit future authority.

## 19. Successful Provisioning Response

A verified success response MAY include only:

- `ok: true`;
- `mode: 'ADMIN_EVIDENCE_STORE_PROVISIONING'`;
- `classification: 'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED'`;
- active REOS spreadsheet ID;
- evidence workbook ID;
- fixed property key;
- fixed sheet name;
- schema field count `20`;
- exact-schema verification;
- property readback verification;
- workbook separation verification;
- evidence row count `0`;
- `persistenceAuthorized: false`;
- `boundedRolloutAuthorized: false`;
- `automaticOfferAuthorityGranted: false`.

Successful provisioning does NOT itself authorize classification persistence or bounded rollout.

## 20. Explicitly Prohibited Authority

The provisioning admin module SHALL NOT:

- call OPA or any external HTTP endpoint;
- read `DISTRESS_LEADS`;
- mutate `DISTRESS_LEADS`;
- read or persist owner names;
- read or persist owner mailing addresses;
- classify absentee ownership;
- invoke the classifier;
- invoke comparison;
- invoke exact-record selection;
- invoke persistence;
- invoke bounded rollout;
- create or alter scheduler triggers;
- alter county scheduler state;
- alter county checkpoints;
- alter county leases;
- repair canonical identity;
- perform acquisition scoring;
- modify Qualified Deal Queue state;
- determine physical occupancy or vacancy;
- determine ARV;
- determine repair scope;
- calculate MAO;
- generate an offer;
- submit an offer;
- weaken any acquisition safety gate.

## 21. Acquisition Safety Gate

Provisioning an evidence workbook grants no acquisition authority.

Automatic MAO or offer authority remains prohibited unless BOTH:

1. comp-supported ARV is present; and
2. adequate repair scope is present.

Absentee-owner classification remains supplemental evidence only.

## 22. Future Implementation Scope

A future implementation increment may add only:

1. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js`
2. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js`
3. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js`
4. `scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js`

plus the minimum existing workflow/runtime-integration registration files required by established REOS deployment validation.

No implementation is authorized by this design artifact alone.

## 23. Production Sequence After Implementation

The required future sequence is:

1. implement and locally certify the provisioning admin surface;
2. PR CI certification;
3. exact-head merge;
4. post-merge main CI certification;
5. deploy a new immutable Apps Script version;
6. certify the production deployment;
7. execute the read-only inspection RPC exactly once;
8. require inspection classification `UNPROVISIONED`;
9. explicitly authorize one provisioning attempt;
10. provision exactly one evidence workbook;
11. execute read-only inspection again;
12. require `ALREADY_PROVISIONED`;
13. only then begin a separate bounded-rollout Stage 1 authorization.

No Stage 1 production classification may occur during provisioning.

## 24. Design Safety Endpoint

This design establishes architecture only.

At design completion:

- production v128 remains unchanged;
- evidence store remains unprovisioned;
- no Script Property is written;
- no workbook is created;
- no RPC is executed;
- no classification is persisted;
- no scheduler or trigger is changed;
- no ARV authority is granted;
- no repair-scope authority is granted;
- no MAO authority is granted;
- no automatic offer authority is granted.
