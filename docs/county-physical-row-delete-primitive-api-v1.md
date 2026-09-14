# County physical-row delete primitive API v1

Status: DESIGN ONLY.

This specification defines a proposed low-level Database primitive.
It does not implement physical deletion or grant production execution authority.

## Proposed API

`REOS.Database.deletePhysicalRowExact(sheetName, request, options)`

The primitive may delete at most one physical row per invocation.

It must not select winners, merge observations, determine collapse membership,
run connectors, mutate checkpoints, arm scheduling, or grant automatic offers.

`Database.update()`, `Database.softDelete()`, `findRowById()`, `getAll()`,
and ProductionReadiness bulk cleanup are not implementation templates.

## Lock authority

`options` contains exactly one authority-bearing field: `lockContext`.

No internally acquired ScriptLock is permitted.

The primitive must use the existing Database lock-context validator before
spreadsheet I/O and again immediately before physical mutation.

Missing, forged, expired, released, replayed, or reacquired-old contexts fail closed.

Caller booleans or fingerprints do not grant deletion authority.

## Request contract

`request` must contain exactly these fields:

- `spreadsheetId`
- `sheetId`
- `expectedRowNumber`
- `idField`
- `idValue`
- `expectedLastRow`
- `expectedLastColumn`
- `expectedMaxRows`
- `expectedMaxColumns`
- `expectedHeaders`
- `expectedRowValues`
- `expectedRowFormulas`

No omitted field is inferred.

Unknown request fields fail closed.

The primitive accepts no caller-defined collapse-group, winner,
preservation, downstream-reference, scheduler, checkpoint, or
execution-authority field.

## Spreadsheet and sheet identity

All identity checks occur under the active caller-owned lock.

The active spreadsheet ID must exactly equal `request.spreadsheetId`.

`sheetName` must be a nonblank string.

`getSheetByName(sheetName)` must resolve the target sheet.

The resolved `sheet.getSheetId()` must exactly equal `request.sheetId`.

The resolved sheet name must exactly equal `sheetName`.

A matching sheet name alone is insufficient physical identity.

## Geometry contract

All geometry is resolved fresh under lock.

`expectedRowNumber` must be an integer greater than 1.

`expectedLastRow` must be an integer greater than or equal to `expectedRowNumber`.

`expectedLastColumn` must be a positive integer.

`expectedMaxRows` must be greater than or equal to `expectedLastRow`.

`expectedMaxColumns` must be greater than or equal to `expectedLastColumn`.

The lengths of `expectedHeaders`, `expectedRowValues`, and
`expectedRowFormulas` must each exactly equal `expectedLastColumn`.

Fresh sheet geometry must exactly match:

- `sheet.getLastRow() === expectedLastRow`
- `sheet.getLastColumn() === expectedLastColumn`
- `sheet.getMaxRows() === expectedMaxRows`
- `sheet.getMaxColumns() === expectedMaxColumns`

Any geometry drift fails before mutation.

## Header contract

The physical header row is row 1.

The complete header range through `expectedLastColumn` must be read fresh
under the active caller-owned lock.

Fresh header values must exactly equal `expectedHeaders`.

Every header must be nonblank after trimming.

Headers must be unique after trimming and case folding.

For example, these together are ambiguous and must fail closed:

- `Distress Lead ID`
- ` distress lead id `
- `DISTRESS LEAD ID`

`idField` must be a nonblank string.

`idField` must resolve to exactly one physical column.

A first-match header lookup is not sufficient when duplicate or
case-conflicting headers exist.

## Unique physical ID contract

`idValue` must be a nonblank string.

The complete physical `idField` column from row 2 through
`expectedLastRow` must be scanned under the active lock.

Exactly one physical cell must contain the exact string `idValue`.

Zero matches fail closed.

Multiple matches fail closed.

The unique matching physical row must equal `expectedRowNumber`.

`findRowById()` is not deletion authority.

Compacted `getAll()` row positions are not deletion authority.

The candidate row must be resolved from fresh physical sheet evidence.

## Canonical cell-value representation

`expectedRowValues` contains JSON-compatible canonical values rather than
raw Apps Script cell objects.

Allowed canonical forms are:

- `{ type: "blank" }`
- `{ type: "string", value: "exact string" }`
- `{ type: "number", value: "canonical finite number text" }`
- `{ type: "boolean", value: true }`
- `{ type: "boolean", value: false }`
- `{ type: "date", value: "ISO-8601 UTC timestamp" }`

No other canonical type is valid.

Blank means the raw cell value is exactly the empty string.

Strings preserve exact character content.

Numbers must be finite.

Negative zero canonicalizes as `0`.

Locale-formatted display strings are not numeric authority.

Dates canonicalize with `Date.toISOString()`.

Booleans retain boolean type.

Unsupported raw cell types fail closed.

The future canonicalizer must be independently tested before implementation
certification.

## Formula evidence

The complete candidate physical row must be read with both:

- `range.getValues()`
- `range.getFormulas()`

`expectedRowValues` must exactly match the canonicalized `getValues()` result.

`expectedRowFormulas` must exactly match the corresponding formulas array.

Every formula entry must be a string.

A non-formula cell is represented by the empty formula string.

Formula text comparison is exact.

Equal displayed values do not make two formula cells equivalent.

Displayed values alone never grant deletion authority.

## Pre-delete revalidation sequence

The future implementation must perform this sequence:

1. Validate request and options structure without mutation.
2. Validate the caller-owned lock context.
3. Verify spreadsheet identity.
4. Verify sheet identity.
5. Verify fresh physical geometry.
6. Verify the complete physical header row.
7. Prove the ID header is unique and unambiguous.
8. Scan the complete physical ID column.
9. Prove exactly one ID match.
10. Prove that match equals `expectedRowNumber`.
11. Read complete candidate-row values and formulas.
12. Canonicalize and compare every row value.
13. Compare every formula string exactly.
14. Revalidate the same caller-owned lock context immediately before mutation.
15. Invoke exactly one physical-row deletion primitive.

No earlier step may perform physical mutation.

## Physical mutation surface

The future primitive may contain exactly one physical-row deletion call site:

`sheet.deleteRow(request.expectedRowNumber)`

`deleteRows()` is prohibited for this primitive.

`deleteCells()` is prohibited.

`clearContent()` is not equivalent to physical-row deletion.

Blanking a row is not equivalent to physical-row deletion.

Sheet reconstruction is not equivalent to physical-row deletion.

The primitive must not acquire or release ScriptLock itself.

The outer `withScriptLockContext()` owner retains flush and release ownership.

## Post-delete verification

After `deleteRow()` returns and while the caller-owned lock remains active,
the primitive must verify at minimum:

- spreadsheet identity remains unchanged;
- sheet identity remains unchanged;
- `sheet.getMaxRows() === expectedMaxRows - 1`;
- `sheet.getMaxColumns() === expectedMaxColumns`;
- `sheet.getLastRow() === expectedLastRow - 1`;
- `sheet.getLastColumn() === expectedLastColumn`;
- a fresh complete ID-column scan contains zero instances of deleted `idValue`.

The primitive must not assume the row now occupying `expectedRowNumber`
is any particular survivor.

Higher-level execution must re-resolve survivor identity after every
physical-row deletion.

## Success result

Only after every post-delete verification succeeds may the primitive return
a verified-success outcome.

The success classification is:

`DELETED_VERIFIED`

The success result must identify at minimum:

- spreadsheet ID;
- sheet name;
- sheet ID;
- deleted physical row number;
- deleted ID field;
- deleted ID value;
- pre-delete last row;
- post-delete last row;
- pre-delete max rows;
- post-delete max rows.

A verified success grants no authority for another deletion.

It grants no scheduler, checkpoint, connector, offer, repair, migration,
winner-selection, or collapse authority.

## Failure classification

Any failure before the physical `deleteRow()` invocation is a definite
no-mutation precondition failure.

That classification is:

`PHYSICAL_DELETE_PRECONDITION_FAILED`

Once `sheet.deleteRow()` has been invoked, an exception from that call or
any failure of post-delete verification cannot safely be classified as
non-mutating.

That classification is:

`PHYSICAL_DELETE_OUTCOME_UNCERTAIN`

No automatic retry is permitted after an uncertain outcome.

Missing candidate identity after an uncertain outcome is not proof that
the prior deletion succeeded.

The primitive must not automatically recreate a deleted row.

The primitive must not claim transactional rollback.

An uncertain outcome requires read-only reconciliation before another
physical mutation may be considered.

If the primitive returns `DELETED_VERIFIED` but outer lock-owner flush or
release finalization later fails, the higher-level operation must be
classified as uncertain and reconciled before another mutation.

## Execution-authority separation

Passing every primitive physical-evidence check proves only that the
requested physical row still matches its expected preimage.

It does not prove that county collapse execution is authorized.

Before any production executor may call this primitive, a separate
certified execution-authority mechanism must establish at minimum:

- approved collapse cohort membership;
- certified winner identity;
- required observation preservation and readback;
- complete current downstream-reference clearance;
- deterministic row-shift and residual-state authority;
- recoverable operation intent and required preimages;
- scheduler and writer quiescence;
- interruption and uncertain-outcome reconciliation rules.

The Database primitive must not make those county-specific decisions.

Primitive success grants no authority for a subsequent delete call.

## Release boundary

This specification authorizes design validation only.

It does not authorize adding `deleteRow()` to `Database.js`.

It does not authorize a county collapse executor.

It does not authorize an Apps Script RPC.

It does not authorize deployment.

It does not authorize production data mutation.

It does not authorize checkpoint mutation.

It does not authorize scheduler changes.

It does not authorize connector execution.

It does not authorize automatic offers.

PR #137 remains the design-only parent.

Physical deletion remains blocked pending separate primitive
implementation certification and higher-level execution certification.
