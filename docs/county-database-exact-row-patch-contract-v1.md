# County Database Exact Row Patch Contract v1

Status: DESIGN ONLY.

This contract defines the future narrow Database primitive required by
Philadelphia code-violation observation preservation.

It grants no implementation, RPC, deployment, production mutation,
physical-delete, scheduler, checkpoint, connector, or automatic-offer
authority.

DATABASE_EXACT_ROW_PATCH_CONTRACT_VERSION=1
CERTIFIED_MAIN=009407adc1e533af4926611af008120bf7e50a90
IMPLEMENTATION_DISCOVERY_SHA256=8ea65a95d14d147b671e10db6b69ff97e6754641f6c85e7e9b610a619c2112ff
CERTIFIED_DATABASE_SHA256=0cdda4923ada7dcb40d880c65a391e30858e78adbedfd1b010599c80de61f0d4

FUTURE_API=REOS.Database.patchPhysicalRowCellsExact(sheetName, request, options)
PATCH_CARDINALITY=3
MUTATION_PRIMITIVE=THREE_EXACT_1X1_CELL_WRITES
LOCK_MODEL=CALLER_OWNED_DATABASE_SCRIPTLOCK
NESTED_LOCK_AUTHORITY=false

VERIFIED_SUCCESS=PHYSICAL_PATCH_VERIFIED
PRECONDITION_FAILURE=PHYSICAL_PATCH_PRECONDITION_FAILED
UNCERTAIN_OUTCOME=PHYSICAL_PATCH_OUTCOME_UNCERTAIN

IMPLEMENTATION_AUTHORITY=false
RPC_AUTHORITY=false
DEPLOYMENT_AUTHORITY=false
PHYSICAL_DELETE_AUTHORITY=false
PRODUCTION_MUTATION_AUTHORITY=false
SCHEDULER_AUTHORITY=false
CHECKPOINT_MUTATION_AUTHORITY=false
CONNECTOR_EXECUTION_AUTHORITY=false
AUTOMATIC_OFFER_AUTHORITY=false

## Purpose

The future primitive exists only to support an exact physical-row patch
whose authority is fully described by immutable caller-provided
preconditions and by a caller-owned `REOS.Database` ScriptLock context.

It is not a general row update API.

The primitive must not acquire or release ScriptLock. It must validate
the exact caller-owned context through the existing Database lock
capability.

## Request contract

The request must be a plain object with an exact schema. Unknown or
missing fields fail before mutation.

The future request must bind at minimum:

- active spreadsheet ID
- physical sheet ID
- expected physical row number
- exact ID field
- exact ID value
- expected last row
- expected last column
- expected max rows
- expected max columns
- complete ordered header vector
- complete winner-row preimage values
- complete winner-row preimage formulas
- exactly three cell patches
- complete expected postimage values
- complete expected postimage formulas

The options object must contain exactly:

- `lockContext`

Caller-supplied booleans, row-authority flags, trusted-write flags,
confirmation flags, or alternate lock bypasses create no authority.

## Exact three-cell patch

The primitive accepts exactly three distinct target columns.

For observation preservation, the caller contract must bind those
columns to exactly:

1. `Updated At`
2. `Last Seen At`
3. `Connector Run ID`

The Database primitive itself must verify that:

- each target column is represented exactly once;
- no patch targets the header row;
- no two patches target the same physical cell;
- every target cell belongs to the one expected physical row;
- each target header matches the expected ordered header vector;
- the expected winner preimage value is exact;
- the expected winner preimage formula is blank;
- the replacement value has a canonical supported cell type;
- the replacement formula is blank;
- the complete expected postimage differs from the complete preimage
  only at the three target columns;
- every untouched cell value is byte/semantic-equivalent under the
  certified canonical cell representation;
- every untouched formula is exact.

## Required preconditions

Before the first physical cell write, the primitive must validate:

- the caller-owned Database lock context;
- active spreadsheet identity;
- sheet identity;
- current last-row/last-column/max-row/max-column geometry;
- complete ordered headers;
- exact physical row number;
- exact and unique ID-field resolution;
- complete physical row values;
- complete physical row formulas;
- all three patch preimages;
- formula absence for all three target cells;
- complete expected postimage consistency.

Failure before the first write is:

`PHYSICAL_PATCH_PRECONDITION_FAILED`

and must perform zero writes.

## Mutation topology

The only authorized county-data mutation is exactly three 1x1 physical
cell writes on the one certified row.

No full-row rewrite is permitted.

No contiguous range rewrite that touches an unchanged cell is permitted.

No insert, append, deleteRow, deleteRows, clear, clearContent,
sort, row movement, broad Database update, upsert, soft delete,
scheduler mutation, checkpoint mutation, connector execution, or offer
mutation is permitted.

The three target writes must execute in deterministic ascending physical
column order.

The implementation must track whether the first physical write has been
invoked.

## Failure boundary

Before the first physical write:

- failures are precondition failures;
- zero physical mutation must have occurred.

After the first physical write has been invoked:

- any exception,
- second/third write failure,
- flush failure,
- reread failure,
- geometry drift,
- full-row postimage mismatch,
- formula mismatch,
- identity mismatch,
- or lock-finalization uncertainty

must be classified conservatively as:

`PHYSICAL_PATCH_OUTCOME_UNCERTAIN`

The primitive must not automatically retry.

The primitive must not automatically recreate state.

The primitive must not claim rollback success.

Any later repair/reconciliation requires separately authorized,
read-only evidence first.

## Verified success

After all three writes:

1. `SpreadsheetApp.flush()` must complete.
2. The complete physical row values must be reread.
3. The complete physical row formulas must be reread.
4. The row must still resolve uniquely by the bound ID.
5. Sheet and row geometry must still match.
6. The full row must equal the exact expected postimage.
7. Every formula must equal the expected postimage formula vector.

Only then may the primitive return:

`PHYSICAL_PATCH_VERIFIED`

Verified patch success grants no physical-delete authority.
