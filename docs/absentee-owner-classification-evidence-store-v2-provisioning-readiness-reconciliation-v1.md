# Absentee-Owner Classification Evidence Store V2 Provisioning Readiness Reconciliation — Design v1

## 1. Purpose

This design defines the administrative readiness and provisioning boundary required before the already-merged absentee-owner classification Evidence Store V2 may ever be called by a future persistence executor.

The V2 evidence store is intentionally fail-closed. It requires a pre-existing sheet named `ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2` with an exact 27-column schema.

The existing V1 provisioning surface provisions only `ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE` with its existing 20-column schema.

Therefore V2 storage readiness must be established before V2 persistence execution can be authorized.

This design does not authorize a production RPC.

No implementation is authorized by this design artifact alone.

## 2. Certified Baseline

This design is pinned to:

- merged main: `b0aa485a1f4cecfab4183267445bdcf9c4a0a033`;
- merged main tree: `2f64bc6fedce09ae13792ad5676c19235fb90a29`;
- existing V1 provisioning runtime SHA-256: `73b7f2706689c8829ba0bb056f6c6133b19025fe9c6f96578d0c96cdcdc00304`;
- merged V2 evidence-store runtime SHA-256: `2bdfd0bdf005ea8b16ed9e13777a8c99ba229f8e86fbf5055859867be6cf5048`.

The completed V2 evidence-store capability is already merged and post-merge-CI certified.

Deployment, production invocation, production mutation, V2 executor, V2 rollout, and V2 orchestration authority remain absent.

## 3. Shared Workbook Identity

V1 and V2 SHALL continue to use exactly the same fixed Script Property:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

The future V2 provisioning capability SHALL NOT create or select a second evidence workbook.

It SHALL NOT replace, delete, clear, rewrite, or republish the configured Script Property.

The configured workbook remains the sole destination selected by the fixed Script Property.

A caller-supplied workbook ID SHALL NOT create destination-selection authority.

## 4. Existing V1 Storage Must Be Preserved

The existing V1 evidence sheet is:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`

Its 20-column schema and all persisted V1 evidence SHALL remain unchanged.

The future V2 provisioning capability SHALL NOT:

- rename the V1 sheet;
- delete the V1 sheet;
- clear the V1 sheet;
- insert columns into the V1 sheet;
- append columns to the V1 sheet;
- rewrite V1 headers;
- migrate V1 rows;
- copy V1 rows into V2;
- delete V1 evidence;
- reinterpret V1 evidence as V2 evidence.

V2 storage SHALL be additive.

## 5. V2 Storage Contract

The required V2 sheet name is:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2`

The exact 27 headers are:

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

The V2 schema SHALL remain distinct from the existing V1 20-column schema.

## 6. Future Runtime Surface

A future implementation MAY add exactly one new administrative runtime module:

`build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js`

It MAY expose exactly two public RPC entrypoints:

1. `reosAbsenteeOwnerClassificationEvidenceStoreV2ProvisioningInspect(options)`
2. `reosAbsenteeOwnerClassificationEvidenceStoreV2Provision(options)`

No alias RPC is authorized.

Both RPCs SHALL require:

`REOS.Security.requireAdmin()`

before exposing administrative storage identity or performing mutation.

Neither RPC grants V2 persistence authority.

## 7. Read-Only V2 Provisioning Inspection

`reosAbsenteeOwnerClassificationEvidenceStoreV2ProvisioningInspect(options)`

SHALL be strictly read-only.

It SHALL require `options` to be absent or an exact empty object.

It MAY read only the minimum administrative state required to classify storage readiness:

- active REOS spreadsheet identity;
- the fixed evidence-workbook Script Property;
- configured workbook identity;
- configured workbook sheet identities;
- V1 sheet identity and schema;
- V2 sheet identity and schema.

It SHALL NOT:

- create a workbook;
- create a sheet;
- rename a sheet;
- delete a sheet;
- write a cell;
- write or delete a Script Property;
- invoke V1 persistence;
- invoke V2 persistence;
- invoke any rollout;
- invoke OPA;
- perform external HTTP;
- inspect or mutate `DISTRESS_LEADS`.

## 8. Exact Inspection Classifications

Inspection SHALL return exactly one storage-readiness classification:

- `SHARED_EVIDENCE_WORKBOOK_UNCONFIGURED`
- `UNSAFE_ACTIVE_REOS_ALIAS`
- `CONFIGURED_WORKBOOK_UNOPENABLE`
- `V1_SHEET_MISSING`
- `V1_SCHEMA_INVALID`
- `UNEXPECTED_WORKBOOK_SHEET_SET`
- `V2_PROVISIONING_REQUIRED`
- `V2_SCHEMA_INVALID`
- `V2_ALREADY_PROVISIONED`

### V2_PROVISIONING_REQUIRED

This classification is permitted only when:

- the fixed Script Property is present and non-empty;
- the configured workbook differs from the active REOS workbook;
- the configured workbook opens successfully;
- the workbook contains exactly one sheet;
- that sheet is the existing V1 sheet;
- the V1 sheet has a valid stable sheet ID;
- the V1 header row remains exactly the certified 20-column schema;
- the V1 header row contains no formulas;
- the V2 sheet is absent.

Existing V1 data rows MAY be present and SHALL NOT make the V1 store invalid.

### V2_ALREADY_PROVISIONED

This classification is permitted only when:

- the configured workbook remains separate from active REOS;
- the workbook contains exactly two sheets;
- the V1 sheet is present with its exact 20-column header schema;
- the V2 sheet is present with its exact 27-column header schema;
- both header rows contain no formulas;
- the V1 and V2 stable sheet IDs are valid and distinct;
- no provisioning mutation is required.

### Invalid states

Any other state SHALL fail closed and SHALL NOT be automatically repaired.

## 9. Inspection Response Boundary

The inspection response MAY expose only administrative readiness metadata, including:

- `ok`;
- `mode`;
- `classification`;
- `activeReosSpreadsheetId`;
- `propertyKey`;
- `propertyPresent`;
- `configuredWorkbookId`;
- `configuredWorkbookOpenable`;
- `configuredWorkbookDiffersFromActiveReos`;
- `v1SheetName`;
- `v1SheetId`;
- `v1SheetPresent`;
- `v1SchemaExact`;
- `v1EvidenceRowCount`;
- `v2SheetName`;
- `v2SheetId`;
- `v2SheetPresent`;
- `v2SchemaExact`;
- `v2EvidenceRowCount`;
- `v2ProvisioningRequired`;
- `v2ProvisioningAuthorized`;
- `v2PersistenceAuthorized`;
- `v2BoundedRolloutAuthorized`;
- `automaticOfferAuthorityGranted`.

For read-only inspection:

- `v2ProvisioningAuthorized` SHALL be `false`;
- `v2PersistenceAuthorized` SHALL be `false`;
- `v2BoundedRolloutAuthorized` SHALL be `false`;
- `automaticOfferAuthorityGranted` SHALL be `false`.

## 10. Future V2 Provision RPC Input

`reosAbsenteeOwnerClassificationEvidenceStoreV2Provision(options)`

SHALL require an exact plain object with exactly:

- `confirmProvisioning`;
- `expectedActiveReosSpreadsheetId`;
- `expectedConfiguredWorkbookId`;
- `expectedV1SheetId`;
- `expectedV2State`.

`confirmProvisioning` SHALL equal:

`PROVISION_V2_EVIDENCE_SHEET`

`expectedV2State` SHALL equal:

`ABSENT`

The configured workbook destination SHALL still come only from the fixed Script Property.

`expectedConfiguredWorkbookId` is an anti-race assertion from the preceding inspection and SHALL NOT create caller-selected destination authority.

No extra keys are allowed.

## 11. Concurrency and Final No-Mutation Preconditions

The provisioning RPC SHALL acquire a ScriptLock before final production-state validation.

While holding the lock it SHALL revalidate:

1. administrator authority;
2. active REOS spreadsheet identity equals `expectedActiveReosSpreadsheetId`;
3. the fixed Script Property is present;
4. the property value equals `expectedConfiguredWorkbookId`;
5. the configured workbook opens;
6. the configured workbook differs from active REOS;
7. the workbook contains exactly one sheet;
8. the sole sheet is the existing V1 sheet;
9. the V1 stable sheet ID equals `expectedV1SheetId`;
10. the V1 20-column header schema is exact and formula-free;
11. the V2 sheet is absent;
12. `expectedV2State` equals `ABSENT`.

Any failure before the first `insertSheet(...)` call SHALL guarantee that the invocation performed no spreadsheet mutation.

The pre-mutation failure classification SHALL be:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRECONDITION_FAILED`

## 12. Exact V2 Sheet Mutation

The first authorized mutation SHALL be exactly one creation of the V2 sheet in the already-configured evidence workbook.

No workbook creation is authorized.

No Script Property write is authorized.

No V1 mutation is authorized.

The future runtime SHALL create exactly one sheet named:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2`

It SHALL write exactly one header row containing the 27 exact V2 headers.

It SHALL NOT write an evidence data row.

It SHALL perform exactly one explicit `SpreadsheetApp.flush()` for the V2 provisioning mutation sequence.

## 13. Post-Mutation Verification

Before returning verified success, the runtime SHALL require:

- the configured workbook ID remains unchanged;
- the configured workbook still differs from active REOS;
- the Script Property value remains unchanged;
- the workbook contains exactly two sheets;
- the V1 sheet stable ID remains unchanged;
- the V1 sheet name remains unchanged;
- the V1 exact 20-column header schema remains unchanged;
- the V1 header row remains formula-free;
- the V1 pre-existing row geometry remains unchanged;
- the V2 sheet exists;
- the V2 sheet has a valid stable sheet ID distinct from V1;
- the V2 sheet has exactly one used row;
- the V2 sheet has exactly 27 used columns;
- the V2 header values are exact;
- the V2 header row contains no formulas;
- the V2 evidence row count is zero.

Only then may the operation return:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_VERIFIED`

## 14. Outcome-Uncertain Boundary

From entry into the single V2 `insertSheet(...)` mutation onward, any exception or unverifiable state SHALL be classified:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_OUTCOME_UNCERTAIN`

There is no automatic retry.

The runtime SHALL NOT claim rollback.

The runtime SHALL NOT automatically delete a newly created V2 sheet.

The runtime SHALL NOT automatically recreate or repair the sheet.

Any uncertain state requires a new read-only inspection and separately certified reconciliation authority.

## 15. Already-Provisioned Boundary

If the V2 sheet is already present at locked prestate:

- the provisioning RPC SHALL NOT create another sheet;
- SHALL NOT rewrite V2 headers;
- SHALL NOT clear V2 evidence;
- SHALL NOT rename the existing V2 sheet;
- SHALL NOT delete any sheet.

A valid existing V2 sheet must be treated through inspection as `V2_ALREADY_PROVISIONED`.

An invalid existing V2 sheet requires separately designed remediation.

## 16. Explicitly Prohibited Authority

This capability SHALL NOT:

- create a second evidence workbook;
- change the evidence-workbook Script Property;
- adopt an orphan workbook;
- migrate V1 evidence;
- mutate V1 evidence;
- invoke the V2 persistence store;
- create a V2 persistence executor;
- execute classification persistence;
- execute bounded rollout;
- create a scheduler;
- create a trigger;
- call OPA;
- perform external HTTP;
- read or mutate `DISTRESS_LEADS`;
- repair canonical identity;
- determine occupancy or vacancy;
- modify Qualified Deal Queue state;
- grant acquisition lifecycle authority;
- determine ARV;
- determine repair scope;
- calculate MAO;
- generate an offer;
- submit an offer.

## 17. Successful Provisioning Does Not Grant Persistence Authority

A successful V2 sheet provisioning response SHALL include:

- `v2ProvisioningVerified: true`;
- `v2PersistenceAuthorized: false`;
- `v2BoundedRolloutAuthorized: false`;
- `v2OrchestratorAuthorized: false`;
- `automaticOfferAuthorityGranted: false`.

The existence of a valid V2 sheet is a storage precondition only.

A separate capability must later authorize any executor that calls:

`REOS.AbsenteeOwnerClassificationEvidenceStoreV2.persist(...)`

## 18. Future Implementation Scope

A future implementation increment MAY add:

1. `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js`;
2. `scripts/validate-absentee-owner-classification-evidence-store-v2-provisioning-admin-v1.js`;
3. `scripts/validate-absentee-owner-classification-evidence-store-v2-provisioning-admin-behavior-v1.js`;
4. `scripts/validate-absentee-owner-classification-evidence-store-v2-provisioning-admin-integration-v1.js`;
5. the minimum workflow/runtime-integration registrations and count-coupled validator reconciliations required by existing REOS validation architecture.

The existing V1 provisioner and V1 orphan-adoption runtime SHALL NOT be edited merely to add V2 provisioning.

The merged V2 planner and V2 evidence-store runtime SHALL NOT be edited merely to add V2 provisioning.

## 19. Required Future Operational Sequence

After implementation is separately authorized and certified:

1. merge implementation through normal PR/CI gates;
2. certify post-merge `main` CI;
3. separately authorize deployment of a new immutable Apps Script version;
4. certify the production deployment;
5. invoke only the V2 read-only provisioning inspection;
6. require `V2_PROVISIONING_REQUIRED` before authorizing mutation;
7. separately authorize exactly one V2 sheet provisioning invocation;
8. provision exactly one V2 sheet;
9. perform read-only inspection again;
10. require `V2_ALREADY_PROVISIONED`;
11. only then consider design of a separate V2 persistence executor capability.

No V2 persistence call occurs during this provisioning sequence.

## 20. Acquisition Safety Gate

This capability grants no ARV, repair-scope, MAO, offer-generation, or offer-submission authority.

Automatic MAO or offer authority remains prohibited unless BOTH:

1. comp-supported ARV is present; and
2. adequate repair scope is present.

Absentee-owner classification remains supplemental acquisition evidence only.

## 21. Design Safety Endpoint

At design completion:

- no repository source is modified;
- no branch is created;
- no commit is created;
- no push occurs;
- no PR is created;
- no Apps Script deployment occurs;
- no production RPC is executed;
- no workbook is created;
- no sheet is created;
- no sheet is renamed;
- no sheet is deleted;
- no Script Property is written;
- no V1 evidence is changed;
- no V2 evidence is persisted;
- no scheduler or trigger is changed;
- no V2 executor authority is granted;
- no V2 rollout authority is granted;
- no V2 orchestrator authority is granted;
- no ARV authority is granted;
- no repair-scope authority is granted;
- no MAO authority is granted;
- no offer authority is granted.

No implementation is authorized by this design artifact alone.
