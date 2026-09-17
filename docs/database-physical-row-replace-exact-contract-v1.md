# Database Physical Row Exact Replacement Contract v1

## Status

DESIGN ONLY.

This contract defines the future safety boundary for:

`REOS.Database.replacePhysicalRowExact(sheetName, request, options)`

It does not implement that API and grants no Database mutation authority,
Group 3 restoration authority, writer-registration authority, deployment
authority, production-data mutation authority, scheduler authority,
checkpoint mutation authority, or automatic-offer authority.

Certified design base:

`45e07a11b27131fb59d89846aa06989f0e039283`

## Purpose

The existing:

`REOS.Database.patchPhysicalRowCellsExact()`

is intentionally restricted to exactly:

- `Updated At`;
- `Last Seen At`;
- `Connector Run ID`.

It MUST remain narrow.

Group 3 Zillow restoration requires a separate primitive capable of replacing
the complete contents of exactly one already-existing physical row while
preserving exact spreadsheet, sheet, physical-row, schema, identity, geometry,
value, formula, and caller-owned ScriptLock authority.

This v1 contract therefore defines a separate primitive:

`REOS.Database.replacePhysicalRowExact(sheetName, request, options)`

## Existing infrastructure to reuse

The future implementation should reuse, without weakening, the current
Database safety model for:

- exact caller-owned non-replayable Database ScriptLock contexts;
- exact spreadsheet identity;
- exact sheet identity;
- exact physical row number;
- exact physical ID uniqueness;
- exact complete header vectors;
- exact sheet geometry;
- canonical row values;
- exact formula vectors;
- definite pre-write failure classification;
- uncertain post-write failure classification;
- exact postimage verification.

The implementation MUST NOT widen
`patchPhysicalRowCellsExact()`.

## Exact request surface

The future request object shall contain exactly:

- `spreadsheetId`;
- `sheetId`;
- `expectedRowNumber`;
- `idField`;
- `idValue`;
- `expectedLastRow`;
- `expectedLastColumn`;
- `expectedMaxRows`;
- `expectedMaxColumns`;
- `expectedHeaders`;
- `expectedRowValues`;
- `expectedRowFormulas`;
- `expectedPostRowValues`;
- `expectedPostRowFormulas`.

Unknown fields and missing fields fail before any write.

The future options object shall contain exactly:

- `lockContext`.

The primitive acquires no lock itself.

## Schema and geometry authority

Before any write, the primitive must prove under the supplied active Database
lock context:

1. `sheetName` is a nonblank string;
2. the active spreadsheet ID equals `spreadsheetId`;
3. the resolved sheet name equals `sheetName`;
4. the resolved sheet ID equals `sheetId`;
5. `expectedRowNumber` addresses an existing data row and not the header;
6. `getLastRow()` equals `expectedLastRow`;
7. `getLastColumn()` equals `expectedLastColumn`;
8. `getMaxRows()` equals `expectedMaxRows`;
9. `getMaxColumns()` equals `expectedMaxColumns`;
10. all complete row/header arrays have length `expectedLastColumn`;
11. every expected header is a nonblank string;
12. normalized headers are unique;
13. `idField` resolves exactly once in the header vector.

Any disagreement is a definite no-write precondition failure.

## Identity authority

Before any write, the complete physical ID column from row 2 through
`expectedLastRow` must be scanned.

`idValue` must occur exactly once and that occurrence must be exactly
`expectedRowNumber`.

The ID cell in both the complete expected preimage and expected postimage must
be the same string value as `idValue`.

The primitive must not re-key, move, duplicate, clear, or otherwise change the
identity field.

The same exact ID uniqueness and physical-row position must be re-proven after
the write.

## Complete preimage authority

Immediately before mutation, the primitive must read exactly one complete
physical row:

`expectedRowNumber`, columns `1..expectedLastColumn`.

It must read both:

- `getValues()`;
- `getFormulas()`.

Every actual value must canonicalize exactly to `expectedRowValues`.

Every actual formula string must equal `expectedRowFormulas`.

Incomplete row evidence, unsupported raw values, or any disagreement fails
before the first write.

## Complete expected postimage authority

`expectedPostRowValues` and `expectedPostRowFormulas` must each contain exactly
`expectedLastColumn` entries.

Every expected postimage value must use the same canonical value model already
used by the exact physical-row Database primitives.

Every expected postimage formula must be a string.

The expected postimage is complete authority for all columns; omission is not
permitted.

## Formula policy v1

Version 1 grants no formula-mutation authority.

For every column:

`expectedPostRowFormulas[index]`

must exactly equal:

`expectedRowFormulas[index]`.

Existing formulas may therefore be preserved, but their formula text may not
be added, removed, or changed by this v1 primitive.

When a preserved formula is nonblank, the replacement write row must use the
formula string for that cell so that the formula itself is preserved.

When the expected postimage formula is blank, the replacement write row must
use the canonical expected postimage value converted back to its raw value.

A canonical string whose expected postimage formula is blank MUST NOT begin
with `=`. Such a value is rejected before mutation because a full-row
`setValues()` write could reinterpret it as a formula.

Any future authority to add, remove, or alter formulas requires a new contract
version.

## One-write mutation boundary

After every precondition, preimage, formula-policy, identity, schema, geometry,
and replacement-row construction check has passed, the exact caller-owned
Database lock context must be revalidated immediately before mutation.

This is the final definite no-write boundary.

The future primitive shall contain exactly one spreadsheet mutation call for
the row replacement:

`candidateRange.setValues([replacementRow])`

The range must be exactly:

- row: `expectedRowNumber`;
- starting column: `1`;
- row count: `1`;
- column count: `expectedLastColumn`.

The primitive shall not call:

- `setValue()`;
- `setFormulas()`;
- `appendRow()`;
- `insertRow*()`;
- `deleteRow*()`;
- `clear*()`.

The primitive shall not perform an automatic rollback.

A failed or uncertain first write must never trigger a second write in this
primitive.

## Outcome classifications

All failures before the one `setValues()` invocation are definite no-write
failures and shall be classified:

`PHYSICAL_REPLACE_PRECONDITION_FAILED`

From entry into the one `setValues()` invocation onward, any thrown error,
flush failure, lock-context failure, readback failure, or incomplete/mismatched
postimage verification is conservatively classified:

`PHYSICAL_REPLACE_OUTCOME_UNCERTAIN`

No automatic retry is permitted.

No automatic rollback is permitted.

Success is permitted only after complete postimage verification and is
classified:

`PHYSICAL_REPLACE_VERIFIED`

## Exact postimage verification

After the write begins, the primitive must:

1. invoke `SpreadsheetApp.flush()`;
2. revalidate the exact caller-owned Database lock context;
3. re-resolve the spreadsheet and prove its ID unchanged;
4. re-resolve the sheet and prove its name and ID unchanged;
5. prove last-row, last-column, max-row, and max-column geometry unchanged;
6. reread and exactly verify the complete header vector;
7. rescan the complete physical ID column;
8. prove `idValue` still occurs exactly once at `expectedRowNumber`;
9. reread the complete target row values;
10. reread the complete target row formulas;
11. canonicalize and compare every postimage value against
    `expectedPostRowValues`;
12. compare every formula against `expectedPostRowFormulas`;
13. revalidate the exact caller-owned Database lock context before returning
    success.

Any failure in this phase is an uncertain outcome.

## Explicit non-authority

This primitive is a Database capability only.

Its existence does not authorize any caller to use it.

The primitive itself shall not:

- call `REOS.Security.requireAdmin()`;
- assert a county mutation-exclusion writer;
- acquire or release ScriptLock;
- create a public RPC;
- mutate scheduler triggers;
- mutate scheduler checkpoints;
- mutate connector configuration;
- insert rows;
- delete rows;
- move rows;
- rewrite downstream references;
- grant automatic MAO or offer authority.

Caller-specific Admin checks, mutation-exclusion writer checks, quiescence,
evidence regeneration, and business authority belong to separately certified
callers.

## Group 3 boundary

This contract is required by, but does not implement, the future Group 3
Zillow restoration executor.

The future Group 3 executor remains separately blocked on:

- implementation and certification of this primitive;
- registration and lifecycle validation of
  `CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION`;
- fresh production evidence;
- scheduler quiescence;
- exact frozen checkpoint authority;
- a separate executor implementation contract and certification;
- a separate executable invocation authority.

The Page-86 writer:

`PAGE86_DUPLICATE_SOURCE_REPAIR`

must not be reused or treated as Group 3 authority.

## Required future implementation validation

A future implementation validator must prove at minimum:

- malformed request rejection with zero writes;
- unknown request field rejection with zero writes;
- invalid/stale/replayed lock-context rejection with zero writes;
- spreadsheet identity mismatch with zero writes;
- sheet identity mismatch with zero writes;
- geometry mismatch with zero writes;
- header drift and ambiguous headers with zero writes;
- missing, duplicate, or moved ID with zero writes;
- value-preimage drift with zero writes;
- formula-preimage drift with zero writes;
- attempted ID mutation with zero writes;
- attempted formula mutation with zero writes;
- unsafe literal leading-`=` non-formula string rejection with zero writes;
- exact one-row / full-width write geometry;
- exactly one `setValues()` mutation call on success;
- zero `setValue()` calls;
- zero `setFormulas()` calls;
- zero insert/delete/clear calls;
- exact preservation of permitted existing formulas;
- complete postimage value verification;
- complete postimage formula verification;
- exact post-write geometry;
- exact post-write ID uniqueness and row position;
- pre-write failures classified
  `PHYSICAL_REPLACE_PRECONDITION_FAILED`;
- every failure from the first write onward classified
  `PHYSICAL_REPLACE_OUTCOME_UNCERTAIN`;
- no retry after an uncertain write;
- no rollback after an uncertain write;
- success classified `PHYSICAL_REPLACE_VERIFIED`;
- existing physical delete behavior remains unchanged;
- existing physical patch behavior remains unchanged and limited to its exact
  current three headers;
- Database lock-context revocation and lock-handoff validators continue to
  pass.

## Authority

`FULL_ROW_REPLACEMENT_IMPLEMENTATION_AUTHORITY_GRANTED=false`

`DATABASE_MUTATION_AUTHORITY_GRANTED=false`

`GROUP3_FULL_ROW_REPLACEMENT_AUTHORITY_GRANTED=false`

`GROUP3_EXECUTOR_IMPLEMENTATION_AUTHORITY_GRANTED=false`

`GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false`

`GROUP3_WRITER_REGISTRATION_AUTHORITY_GRANTED=false`

`GROUP3_PUBLIC_RPC_AUTHORITY_GRANTED=false`

`SCHEDULER_MUTATION_AUTHORITY_GRANTED=false`

`CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false`

`DEPLOYMENT_AUTHORITY_GRANTED=false`

`PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`
