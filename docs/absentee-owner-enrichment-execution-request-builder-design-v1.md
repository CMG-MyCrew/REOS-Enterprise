# Absentee-Owner Enrichment Execution Request Builder Design v1

## Status

This document freezes the design of the read-only preparation boundary that
binds a certified Phase 1F absentee-owner persistence plan to the physical
spreadsheet evidence required by the Phase 1G executor.

This design grants no persistence or production execution authority.

## Architectural position

The certified pipeline is:

1. Phase 1D sanitizer;
2. Phase 1F persistence adapter;
3. Phase 1G execution request builder;
4. Phase 1G executor.

The request builder is a read-only evidence-capture boundary.

It is not a mutation executor and is not a source of mutation authority.

## Planned implementation surface

The planned implementation module is:

`build/apps-script-brand/AbsenteeOwnerEnrichmentExecutionRequestBuilder.js`

This design does not require modification of:

`build/apps-script-brand/Database.js`

or:

`build/apps-script-brand/AbsenteeOwnerEnrichmentPersistenceAdapter.js`

## Input authority

The builder accepts only an already-certified Phase 1F persistence plan.

The plan must preserve the Phase 1F fail-closed authority flags:

- `persistenceExecutionAuthorized: false`
- `databaseUpdateAuthorized: false`
- `databaseInsertAuthorized: false`
- `databaseUpsertAuthorized: false`
- `dealCreationAuthorized: false`
- `maoGenerationAuthorized: false`
- `automaticOfferAuthorityGranted: false`

Raw provider records, generic CSV rows, arbitrary database patches, and
caller-manufactured enrichment patches are invalid builder input.

## Target authority

The only target is:

`DISTRESS_LEADS`

The builder may inspect an existing physical acquisition record only.

It must never insert, append, create, upsert, update, delete, or otherwise
mutate a record.

## Spreadsheet resolution

The builder may resolve the bound workbook read-only through:

`SpreadsheetApp.getActiveSpreadsheet()`

The resolved spreadsheet identity must be captured explicitly in the
prepared execution request.

The builder must not depend on or expose the private Database helper:

`getSpreadsheet_()`

## Required identity

The request preserves exactly:

- `Distress Lead ID`
- `Canonical Property Key`

Both values must be non-empty.

The Phase 1F `rowNumber` remains evidence only.

During request preparation, both identity columns must be inspected
completely. Each identity must resolve exactly once, both identities must
resolve to the same existing physical row, and that row must equal the
Phase 1F row-number evidence.

Zero matches, multiple matches, ambiguity, moved identity, or mismatched
identity fail request preparation.

Preparation-time identity proof does not replace the executor's mandatory
same-lock dual-identity revalidation.

## Physical authority snapshot

A successfully prepared execution request freezes at minimum:

- spreadsheet ID;
- sheet name;
- sheet ID;
- expected physical row number;
- expected last row;
- expected last column;
- expected maximum rows;
- expected maximum columns;
- complete ordered header vector;
- complete canonicalized physical row values;
- complete physical row formulas.

The request therefore carries expected physical evidence rather than merely
a logical record.

## Header authority

Headers must be non-empty strings and unique after normalized comparison.

These headers must resolve uniquely:

- `Distress Lead ID`
- `Canonical Property Key`
- `Owner Name`
- `Owner Mailing Address`
- `Updated At`

Missing or ambiguous required headers fail preparation.

## Canonical physical values

Expected physical row values use a deterministic canonical representation
compatible with the repository's exact physical-evidence model.

Supported cell value types are:

- blank;
- string;
- finite number;
- boolean;
- valid Date.

Unsupported values fail preparation.

The builder must not silently stringify unsupported values.

## Formula authority

The complete physical-row formula vector must be captured.

Any cell that would later be physically mutated must have a blank expected
formula.

A non-blank formula in any intended mutation target fails preparation.

Potential mutation targets are:

- `Owner Name`;
- `Owner Mailing Address`;
- `Updated At`.

## Semantic patch authority

The semantic patch is copied from the certified Phase 1F plan.

The builder may not manufacture enrichment-owned data.

The only permitted semantic patch keys are:

- `Owner Name`
- `Owner Mailing Address`

At least one enrichment-owned semantic field must be present.

No other semantic field is permitted.

## Updated At

`Updated At` is not an enrichment semantic field.

The builder freezes its expected preimage but does not manufacture its
replacement value.

The eventual executor owns generation of the controlled `Updated At`
timestamp as the explicit timestamp consequence of a later mutation.

## Prepared request boundary

The prepared request contains only evidence required to bind the certified
Phase 1F plan to expected physical authority.

At minimum it preserves:

- target table;
- certified dual identity;
- certified semantic patch;
- spreadsheet identity;
- sheet identity;
- expected physical row number;
- expected sheet geometry;
- expected ordered headers;
- expected complete canonical physical row values;
- expected complete physical row formulas;
- false execution and acquisition authority flags.

The prepared request is evidence only.

Its existence does not authorize mutation.

## Executor revalidation

The executor treats every prepared physical field as expected evidence, not
current truth.

Inside one valid:

`REOS.Database.withScriptLockContext(...)`

callback, the executor must independently re-read and verify:

- spreadsheet identity;
- sheet identity and name;
- geometry;
- complete ordered headers;
- complete dual-identity columns;
- unique same-row dual identity;
- Phase 1F physical row evidence;
- complete row values;
- complete row formulas;
- target-column identity;
- target preimage values;
- target formulas.

Any drift before physical mutation produces:

`ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED`

with a definite no-write result.

## Mutation separation

The request builder contains no physical write operation.

It must not invoke:

- `setValue()`
- `setValues()`
- `appendRow()`
- row insertion;
- row deletion;
- `REOS.Database.update()`
- `REOS.Database.insert()`
- `REOS.Database.upsert()`
- `REOS.Database.patchPhysicalRowCellsExact()`

It does not call `SpreadsheetApp.flush()` as a mutation step.

## Database boundary

The builder requires no change to `Database.js`.

The existing physical patch primitive remains specialized to its certified
county use and is not generalized, weakened, repurposed, or called.

Generic Database mutation surfaces remain unauthorized.

## Lock boundary

Request preparation is read-only and does not itself grant or retain
Database ScriptLock authority.

A prepared request cannot contain, serialize, replay, or transfer a Database
lock context.

Mutation authority exists only later inside the executor's valid
caller-owned Database ScriptLock callback.

## Failure boundary

Builder failures are preparation failures and mean the builder attempted no
absentee-owner persistence mutation.

The builder cannot classify preparation as verified execution.

Only the executor may produce:

- `ABSENTEE_OWNER_EXECUTION_PRECONDITION_FAILED`
- `ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN`
- `ABSENTEE_OWNER_EXECUTION_VERIFIED`

## Acquisition safety boundary

The builder grants no authority to:

- create a deal;
- advance acquisition lifecycle or status;
- modify ARV evidence;
- modify repair-scope evidence;
- calculate or write MAO;
- calculate or write Suggested Offer;
- grant automatic offer authority.

Automatic MAO/offer authority remains blocked unless separately established
by the acquisition safety gate requiring both comp-supported ARV and adequate
repair scope.

## Scheduler isolation

This design is independent of county scheduler operation.

This increment must not:

- execute or alter county schedulers;
- create, remove, or modify triggers;
- invoke `clasp`;
- invoke production RPCs;
- invoke provider services;
- deploy Apps Script;
- mutate production data.

## Implementation gate

No execution-request builder implementation is authorized by this document.

No executor implementation is authorized by this document.

Before implementation, this design must be independently validated,
committed as an isolated design-only increment, reviewed, and merged.

If implementation evidence later proves that `Database.js` must change,
implementation must stop and reconcile that shared surface with county
authority before any Database edit.

## Frozen markers

`ABSENTEE_OWNER_EXECUTION_REQUEST_BUILDER_DESIGN_VERSION=1`

`TARGET_TABLE=DISTRESS_LEADS`

`INPUT_AUTHORITY=PHASE1F_CERTIFIED_PLAN_ONLY`

`BUILDER_MODE=READ_ONLY_EVIDENCE_CAPTURE`

`SPREADSHEET_RESOLUTION=ACTIVE_SPREADSHEET_READ_ONLY`

`DUAL_IDENTITY=Distress Lead ID+Canonical Property Key`

`PHASE1F_ROW_NUMBER_IS_EVIDENCE_ONLY=true`

`COMPLETE_PREIMAGE_REQUIRED=true`

`COMPLETE_FORMULA_VECTOR_REQUIRED=true`

`UPDATED_AT_REPLACEMENT_OWNED_BY_EXECUTOR=true`

`DATABASE_JS_CHANGE_REQUIRED=false`

`DATABASE_PHYSICAL_PATCH_AUTHORIZED=false`

`DATABASE_GENERIC_MUTATION_AUTHORIZED=false`

`PERSISTENCE_EXECUTION_AUTHORIZED=false`

`DEAL_CREATION_AUTHORIZED=false`

`MAO_GENERATION_AUTHORIZED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`

`SCHEDULER_AUTHORITY=false`

`PRODUCTION_MUTATION_AUTHORITY=false`
