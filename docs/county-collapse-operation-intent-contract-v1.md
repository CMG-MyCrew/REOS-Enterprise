# County collapse durable operation-intent contract v1

Status: DESIGN ONLY.

This contract specifies the durable storage, immutable operation identity,
preimage persistence, event ordering, readback, recovery, retention, and
fail-closed outcome semantics required before a future county code-violation
collapse executor may invoke the certified physical-row-delete primitive.

It grants no executor implementation, RPC, deployment, production mutation,
physical-delete, scheduler, checkpoint, connector, or automatic-offer authority.

## Certified baseline

- Main baseline:
  `107eea2c31c2ca1fb5bc1b37fb72affe591090ff`
- Parent executor contract:
  `docs/county-code-violation-collapse-executor-contract-v1.md`
- Physical-delete primitive:
  `REOS.Database.deletePhysicalRowExact(...)`
- One executor invocation:
  one certified group and one certified delete candidate
- Maximum physical-delete calls per invocation:
  one
- Uncertain outcomes:
  terminal for automatic execution and routed to read-only reconciliation

Contract-Marker: OPERATION_INTENT_CONTRACT_VERSION=1
Contract-Marker: OPERATION_INTENT_BASE_SHA=107eea2c31c2ca1fb5bc1b37fb72affe591090ff
Contract-Marker: STORAGE_BACKEND=APPEND_ONLY_GOOGLE_SHEETS_JOURNAL
Contract-Marker: STORAGE_WORKBOOK=DEDICATED_SEPARATE_WORKBOOK
Contract-Marker: EVENT_SHEET=COUNTY_COLLAPSE_OPERATION_INTENTS
Contract-Marker: CHUNK_SHEET=COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS
Contract-Marker: MAX_EVENT_PAYLOAD_UTF8_BYTES=1048576
Contract-Marker: MAX_CHUNK_UTF8_BYTES=16384
Contract-Marker: MAX_CHUNKS_PER_EVENT=64
Contract-Marker: MAX_EVENTS_PER_OPERATION=32
Contract-Marker: IMMUTABLE_OPERATION_ID=true
Contract-Marker: APPEND_ONLY_STORAGE=true
Contract-Marker: PREPARED_READBACK_REQUIRED=true
Contract-Marker: DELETE_BARRIER_EVENT=DELETE_INVOCATION_STARTED
Contract-Marker: RECOVERY_MODE=READ_ONLY
Contract-Marker: AUTOMATIC_RETRY=false
Contract-Marker: RUNTIME_PURGE_AUTHORITY=false
Contract-Marker: EXECUTOR_IMPLEMENTATION_AUTHORITY=false
Contract-Marker: RPC_AUTHORITY=false
Contract-Marker: DEPLOYMENT_AUTHORITY=false
Contract-Marker: PRODUCTION_PHYSICAL_DELETE_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: SCHEDULER_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: CONNECTOR_EXECUTION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

## Responsibility boundary

The operation-intent subsystem is a durable evidence journal.

It does not decide winner identity, group membership, reference clearance,
observation preservation, writer quiescence, scheduler state, checkpoint state,
or physical-delete authority.

It records evidence already derived by the future certified executor and provides
a fail-closed recovery history after interruption or uncertain execution.

The journal must never manufacture authority from the existence of a record.

## Storage backend

The certified backend design is an append-only Google Sheets journal in a
dedicated workbook separate from the county data workbook being mutated.

The exact storage workbook ID is deployment configuration and may not be supplied
by an executor caller.

The exact workbook ID must be separately provisioned, access-controlled, and
certified before implementation authority exists.

The workbook contains exactly two logical storage sheets:

1. `COUNTY_COLLAPSE_OPERATION_INTENTS`
2. `COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS`

The runtime contract contains no update-in-place or delete operation for either
sheet.

Existing journal rows are immutable.

Sorting, rewriting, clearing, truncating, deduplicating, or deleting historical
journal rows is not an executor capability.

## Operation identity

Every attempted executor operation receives one globally unique immutable
operation ID.

The operation ID is created once and is never reused for another candidate,
group, retry, reconciliation, or later deletion.

A verified deletion of one candidate does not authorize reuse of the operation
ID for the next candidate.

Duplicate operation IDs fail closed.

An existing operation ID supplied by a caller is prohibited.

The future executor creates the operation ID internally.

## Append-only event model

Each operation is represented by a hash-chained ordered event stream.

Permitted v1 event types are:

- `INTENT_PREPARED`
- `DELETE_INVOCATION_STARTED`
- `POSTDELETE_VERIFIED`
- `COLLAPSE_DELETE_VERIFIED`
- `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`
- `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`
- `RECONCILIATION_NOTE`

Events are never edited after append.

Each new event must reference the exact SHA-256 of the previous event for the
same operation.

Event sequence begins at 1 and increments by exactly 1.

Missing sequence numbers, duplicate sequence numbers, multiple competing event
hashes, broken hash chains, unknown event types, or malformed events fail closed.

No operation may exceed 32 events under v1.

Exceeding the event bound fails closed before any additional mutation.

## Event manifest schema

Every event manifest row contains at minimum:

- operation ID;
- event sequence;
- event type;
- UTC event timestamp;
- operation-intent contract version;
- executor implementation version when one exists;
- group number;
- winner Distress Lead ID;
- target delete Distress Lead ID;
- payload SHA-256;
- payload UTF-8 byte length;
- payload chunk count;
- previous-event SHA-256 or the exact genesis marker;
- event SHA-256.

Manifest identity fields must agree with the immutable operation identity
established by event sequence 1.

A later event cannot change group number, winner Distress Lead ID, or target
delete Distress Lead ID.

## Chunk storage

Canonical event payloads are stored in the chunk sheet.

Each chunk row contains at minimum:

- operation ID;
- event sequence;
- zero-based chunk index;
- exact UTF-8 byte length;
- chunk SHA-256;
- chunk data.

A single chunk is limited by this contract to 16,384 UTF-8 bytes.

A single event may contain at most 64 chunks and at most 1,048,576 UTF-8 bytes
of canonical payload data.

These are REOS contract limits, not inferred provider maximums.

Payloads that exceed any v1 limit fail closed before physical deletion.

Chunk indices must be continuous from zero through `chunkCount - 1`.

Duplicate, missing, oversized, reordered, or hash-mismatched chunks invalidate
the event.

## Canonical representation

All payload hashing uses deterministic canonical JSON encoded as UTF-8.

Canonical JSON rules for v1 are:

- object keys are emitted in lexicographic order;
- arrays preserve contract-defined semantic order;
- no insignificant whitespace is emitted;
- strings use JSON string escaping;
- booleans and null use standard JSON literals;
- numeric fields must be finite integers when the contract defines an integer;
- timestamps are UTC ISO-8601 strings;
- hashes are lowercase hexadecimal;
- IDs and source strings are preserved exactly;
- unsupported runtime values fail serialization rather than being coerced.

Sheet row values that require type preservation must use explicit canonical cell
typing rather than lossy display-string conversion.

Formula arrays preserve exact column order and exact formula text.

## Required INTENT_PREPARED payload

Before the physical-delete primitive may be invoked, event sequence 1 must be
`INTENT_PREPARED`.

Its canonical payload must contain or cryptographically bind all evidence
required by the certified executor contract, including at minimum:

- operation-intent contract version;
- executor contract version;
- executor implementation version;
- operation ID;
- creation timestamp;
- exact winner-plan fingerprint;
- exact collapse authority SHA-256;
- group number;
- violation number;
- durable key;
- canonical property key;
- winner Distress Lead ID;
- target delete Distress Lead ID;
- current county-data spreadsheet ID;
- current county-data sheet ID;
- complete current headers;
- current last row;
- current last column;
- current max rows;
- current max columns;
- current winner physical row number;
- complete canonical winner values;
- complete winner formulas;
- current delete-candidate physical row number;
- complete canonical delete-candidate values;
- complete delete-candidate formulas;
- complete residual certified-group membership before mutation;
- complete current downstream-reference audit evidence;
- explicit non-truncated reference-audit status;
- scheduler frozen snapshot;
- checkpoint frozen snapshot;
- observation-preservation requirement;
- certified preservation receipt when required;
- exact primitive request derived from fresh under-lock evidence;
- canonical payload SHA-256.

Original winner-plan row numbers may appear only as historical evidence.

They are not current physical-row authority.

## Persistence and readback barrier

`INTENT_PREPARED` must be appended, flushed, fully reread from storage,
reconstructed from its chunks, and rehashed successfully before mutation
authority can continue.

The readback must prove:

- exact operation ID;
- exact manifest;
- exact chunk count;
- exact chunk ordering;
- exact chunk hashes;
- exact canonical payload;
- exact payload SHA-256;
- exact event SHA-256;
- valid genesis state.

In-memory success from an append call is insufficient.

Failure to persist, flush, reread, reconstruct, or hash-verify the prepared
intent is a definite no-delete precondition failure.

## Delete invocation barrier

Immediately before calling the physical-delete primitive, the executor must
append and read back:

`DELETE_INVOCATION_STARTED`

This event is a conservative irreversible-attempt barrier.

It must be durably verified before the primitive call occurs.

If execution stops after this barrier is durable, recovery must assume that the
primitive may have been invoked.

This deliberately permits false-positive uncertainty in the narrow case where
the barrier was stored but the process stopped before calling the primitive.

It never permits a false claim that deletion did not occur.

## Post-delete verification event

After primitive result `DELETED_VERIFIED` and complete under-lock residual
verification, the executor may append:

`POSTDELETE_VERIFIED`

This event records that physical deletion and residual verification appeared
successful while the outer lock context remained valid.

It is not the final verified-success outcome.

If execution ends after `POSTDELETE_VERIFIED` but before complete outer-owner
finalization and the terminal success event, recovery remains fail-closed.

## Final verified-success event

Only after all certified success conditions have completed may the operation
append:

`COLLAPSE_DELETE_VERIFIED`

The event must bind:

- prepared-intent SHA-256;
- delete-barrier event SHA-256;
- post-delete verification evidence;
- exact deleted Distress Lead ID;
- exact surviving winner identity;
- exact residual membership;
- resulting sheet geometry;
- downstream-reference recheck;
- observation-preservation evidence when required;
- proof that scheduler, checkpoint, connector, and offer state did not change;
- final preceding-event SHA-256.

Absence of this terminal event means automatic recovery must not infer verified
success merely because the candidate row is absent.

## Definite precondition failure

A definite failure before the delete barrier may be finalized as:

`COLLAPSE_EXECUTOR_PRECONDITION_FAILED`

Once the delete barrier is durable, this terminal state is no longer permitted
for that operation.

A precondition-failed operation can never be resumed into a delete.

Any later attempt requires a new operation ID and new current preimages.

## Uncertain outcome

The terminal uncertain event is:

`COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN`

It is required whenever the runtime can still persist evidence after an
uncertain condition.

Failure to persist the uncertain event does not convert uncertainty into
success or definite failure.

Any valid history containing `DELETE_INVOCATION_STARTED` without a valid
`COLLAPSE_DELETE_VERIFIED` terminal event is treated as uncertain by automatic
recovery unless a separately certified read-only reconciliation proves an
allowed classification.

No automatic retry is permitted.

No automatic row recreation is permitted.

No transactional rollback may be claimed.

## Recovery read path

Recovery is read-only.

Recovery accepts only an internally selected operation ID.

It reads all manifest rows and all chunk rows for that exact operation ID.

It must:

1. reject duplicate operation identity;
2. reconstruct the complete ordered event sequence;
3. enforce sequence continuity;
4. enforce immutable identity fields;
5. verify every chunk hash;
6. reconstruct every canonical payload;
7. verify every payload hash;
8. verify every event hash;
9. verify the complete previous-event hash chain;
10. classify the state using only certified event history plus separately
    authorized live read-only reconciliation evidence.

The recovery reader may not modify the journal, county data, scheduler,
checkpoint, connector state, or offer state.

## Recovery classification

A valid `INTENT_PREPARED` history with no delete barrier proves only that the
journal contains no evidence that the certified executor crossed its delete
barrier.

Live county state must still be compared before claiming definite no-delete.

If the target row is unexpectedly absent or physical state is inconsistent,
classification becomes uncertain.

Any valid history containing `DELETE_INVOCATION_STARTED` but lacking a valid
terminal `COLLAPSE_DELETE_VERIFIED` is automatically uncertain.

A valid `COLLAPSE_DELETE_VERIFIED` terminal event may be classified as verified
only after the full event chain and terminal payload are validated.

Malformed or contradictory storage is uncertain, not success.

## Read-only reconciliation boundary

Uncertain operations route to a separately certified read-only reconciliation
process.

Reconciliation may inspect durable evidence and current physical state.

Reconciliation does not itself authorize a mutation.

A later physical deletion requires a new executor invocation, new operation ID,
new current preimages, new reference audit, and new authority checks.

## Retention policy

All v1 operation-intent events and chunks are retained indefinitely.

The runtime has no purge authority.

No executor or recovery surface may delete historical journal rows.

Any future archive, retention reduction, or purge process requires a separate
contract and certification.

## Access rules

The storage workbook is an internal REOS evidence store.

The storage workbook ID cannot be caller-selected.

No public Apps Script RPC for arbitrary journal writes is authorized.

No user request may provide raw manifest rows, chunk rows, event hashes, or
payloads as trusted authority.

Future write access must be limited to the certified internal operation-intent
module invoked by the certified executor.

Future read access must be limited to certified internal execution,
certification, audit, and read-only reconciliation surfaces.

Manual edits are outside runtime authority and must cause integrity validation
to fail closed when detected.

## Concurrency

Operation-intent writes for the executor mutation phase occur under the same
outer non-replayable Database ScriptLock context required by the executor
contract.

No nested ScriptLock is introduced by the storage module.

The storage layer does not release the caller-owned lock.

Duplicate event sequences or conflicting operation IDs fail closed.

## Storage failure behavior

Any storage exception before the delete barrier is a definite no-delete
precondition failure only when the runtime can still prove that the delete
barrier was never durably crossed.

Any storage exception after the delete barrier is uncertain.

Any ambiguous flush, readback, duplicate event, missing chunk, malformed hash
chain, or unavailable storage backend fails closed.

Storage failure never authorizes a retry of the physical-delete primitive.

## Explicitly forbidden surfaces

Operation-intent v1 must not:

- implement the collapse executor;
- expose the reserved executor RPC;
- call the physical-delete primitive;
- mutate county data rows;
- modify winners or observations;
- mutate scheduler triggers;
- mutate county checkpoints;
- run county connectors;
- create offers;
- generate automatic offer authority;
- recreate deleted rows;
- purge journal history;
- update existing journal records in place;
- accept caller-defined storage workbook IDs;
- accept caller-defined operation IDs as authority;
- automatically resume an uncertain operation.

## Implementation prerequisites still blocked

This contract does not itself authorize storage implementation.

Before executor implementation authority can exist, the following remain
separately certifiable:

1. operation-intent storage implementation and offline corruption/recovery
   harness;
2. exact provisioned storage workbook and access binding;
3. observation-preservation field mapping, mutation contract, and receipt for
   groups 17 through 22;
4. collapse-maintenance / writer-quiescence authority;
5. executor implementation contract and offline failure-path harness.

## Release boundary

This document authorizes local design validation only.

It does not authorize implementation.

It does not authorize a commit or push.

It does not authorize a pull request.

It does not authorize deployment.

It does not authorize county execution.

It does not authorize production physical deletion.

It does not authorize production mutation.

It does not authorize scheduler or checkpoint mutation.

It does not authorize connector execution.

It does not authorize automatic offers.
