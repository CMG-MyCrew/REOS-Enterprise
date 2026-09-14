# County Collapse Observation-Preservation Store Contract v1

Status: DESIGN ONLY.

This contract defines the future durable evidence store for
Philadelphia code-violation observation preservation.

It is separate from the certified collapse deletion operation-intent
journal.

OBSERVATION_PRESERVATION_STORE_CONTRACT_VERSION=1
CERTIFIED_MAIN=009407adc1e533af4926611af008120bf7e50a90
IMPLEMENTATION_DISCOVERY_SHA256=8ea65a95d14d147b671e10db6b69ff97e6754641f6c85e7e9b610a619c2112ff
CERTIFIED_OPERATION_INTENT_STORE_SHA256=00c7ee96dfeee3401444374b3d7a03e905e2928143c92de91cff612e5a782abf
CERTIFIED_OBSERVATION_PRESERVATION_CONTRACT_SHA256=ed0142bf040c52eee5ef0c95113791e36667d1fb9965ced8906b71379f134f12

FUTURE_MODULE=REOS.CountyCollapseObservationPreservationStore
WORKBOOK_PROPERTY=REOS_COUNTY_COLLAPSE_OBSERVATION_PRESERVATION_WORKBOOK_ID
EVENT_SHEET=COUNTY_COLLAPSE_PRESERVATION_EVENTS
CHUNK_SHEET=COUNTY_COLLAPSE_PRESERVATION_CHUNKS
BACKEND=DEDICATED_APPEND_ONLY_GOOGLE_SHEETS_WORKBOOK
LOCK_MODEL=CALLER_OWNED_DATABASE_SCRIPTLOCK
NESTED_LOCK_AUTHORITY=false

OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22
PRESERVATION_WRITE_FIELDS=Updated At,Last Seen At,Connector Run ID

MAX_EVENT_PAYLOAD_UTF8_BYTES=1048576
MAX_CHUNK_UTF8_BYTES=16384
MAX_CHUNKS_PER_EVENT=64
MAX_EVENTS_PER_OPERATION=32

IMPLEMENTATION_AUTHORITY=false
PRESERVATION_MUTATION_AUTHORITY=false
DURABLE_RECEIPT_PROVISIONING_AUTHORITY=false
RPC_AUTHORITY=false
DEPLOYMENT_AUTHORITY=false
PHYSICAL_DELETE_AUTHORITY=false
PRODUCTION_MUTATION_AUTHORITY=false
SCHEDULER_AUTHORITY=false
CHECKPOINT_MUTATION_AUTHORITY=false
CONNECTOR_EXECUTION_AUTHORITY=false
AUTOMATIC_OFFER_AUTHORITY=false

## Storage isolation

The future preservation store must use a dedicated workbook configured
only by the deployment property:

`REOS_COUNTY_COLLAPSE_OBSERVATION_PRESERVATION_WORKBOOK_ID`

The caller cannot supply a workbook ID.

The configured workbook must differ from:

- the active county-data workbook; and
- the certified collapse operation-intent workbook.

The existing operation-intent workbook remains exactly the certified
two-sheet deletion journal:

- `COUNTY_COLLAPSE_OPERATION_INTENTS`
- `COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS`

This contract grants no authority to add preservation sheets or event
types to that store.

## Store topology

The preservation workbook must contain exactly the two certified sheets:

1. `COUNTY_COLLAPSE_PRESERVATION_EVENTS`
2. `COUNTY_COLLAPSE_PRESERVATION_CHUNKS`

The future store does not provision the workbook or sheets.

Provisioning remains separately authorized.

The store must not acquire or release ScriptLock.

All preservation-journal writes that participate in a county mutation
must occur under the exact caller-owned outer Database ScriptLock
context.

## Immutable operation identity

Each preservation operation receives an internally generated UUID.

The caller cannot supply the initial preservation operation ID.

One operation binds exactly one observation-merge group from:

`17,18,19,20,21,22`

The operation must bind:

- observation-preservation contract version;
- preservation implementation version;
- exact certified collapse authority SHA;
- exact winner-plan fingerprint;
- exact implementation-discovery SHA;
- group number;
- durable violation identity;
- canonical property identity;
- complete certified group membership;
- winner Distress Lead ID;
- latest-observation Distress Lead ID;
- active spreadsheet ID;
- physical sheet ID;
- ordered header vector and SHA-256;
- physical winner row;
- physical latest-observation row.

## Event model

The future append-only event model must support exactly:

- `PRESERVATION_PREPARED`
- `PATCH_INVOCATION_STARTED`
- `PRESERVATION_RECEIPT_VERIFIED`
- `PRESERVATION_PRECONDITION_FAILED`
- `PRESERVATION_OUTCOME_UNCERTAIN`
- `RECONCILIATION_NOTE`

Event sequence is strictly increasing.

Each event must bind the previous event SHA-256.

Every payload is canonical JSON.

Every payload is SHA-256 fingerprinted.

Large payloads are stored as canonical base64 UTF-8 chunks.

Historical rows are immutable.

No event or chunk row may be updated, deleted, cleared, compacted, or
purged by runtime code.

Retention is indefinite.

## Prepared durable preimage

`PRESERVATION_PREPARED` must be durably appended, flushed, reread,
reconstructed, and rehashed before the first county-data patch write.

Its payload must contain at minimum:

- exact complete winner preimage values;
- exact complete winner preimage formulas;
- exact complete latest-observation values;
- exact complete latest-observation formulas;
- exact three-field write map;
- complete expected winner postimage values;
- complete expected winner postimage formulas;
- all group and identity bindings;
- all sheet/header/geometry bindings;
- preimage fingerprints.

This durable prepared event is mandatory because the later physical
patch can become uncertain before a verified receipt exists.

A memory-only preimage grants no mutation authority.

## Patch barrier

`PATCH_INVOCATION_STARTED` must be durably appended, flushed, reread,
reconstructed, and rehashed immediately before the first physical patch
write.

Its presence means conservatively:

**the physical patch may have run.**

It must never be automatically removed or rewritten.

If this barrier is durable and no verified preservation receipt exists,
recovery is uncertain.

No automatic retry is authorized.

## Verified preservation receipt

After the exact Database patch returns `PHYSICAL_PATCH_VERIFIED`, the
future preservation implementation must construct a canonical receipt.

The receipt must bind at minimum:

- preservation contract version;
- preservation-store contract version;
- exact patch-primitive contract version;
- preservation implementation version;
- certified collapse authority SHA;
- winner-plan fingerprint;
- implementation-discovery SHA;
- preservation operation ID;
- group number;
- durable violation key;
- canonical property key;
- complete group membership;
- winner Distress Lead ID;
- latest-observation Distress Lead ID;
- spreadsheet ID;
- sheet ID;
- ordered header vector and SHA-256;
- original physical winner/latest row numbers;
- complete winner preimage values/formulas;
- complete latest-observation values/formulas;
- exact three-field write map;
- complete verified winner postimage values/formulas;
- winner preimage SHA-256;
- latest-observation preimage SHA-256;
- winner postimage SHA-256;
- canonical UTC receipt timestamp;
- receipt SHA-256.

The verified receipt is persisted as:

`PRESERVATION_RECEIPT_VERIFIED`

and must be appended, flushed, reread, reconstructed, and rehashed
before preservation success can be returned.

A caller-provided receipt object, receipt SHA, boolean, group number, or
operation ID creates no receipt authority.

## Recovery model

Recovery is read-only.

Required classifications:

### VERIFIED_PRESERVATION_RECEIPT

A complete valid event chain ends in one exact verified receipt.

This proves preservation evidence only.

It does not grant physical deletion by itself.

### UNCERTAIN_STORAGE_INVALID

Missing chunks, duplicate sequences, hash-chain mismatch, malformed
canonical JSON, formula edits, header drift in the journal, or other
storage corruption is uncertain.

### UNCERTAIN_PATCH_BARRIER_OR_TERMINAL

A durable `PATCH_INVOCATION_STARTED` exists without an exact verified
receipt.

The patch may have run.

No automatic retry is allowed.

### NO_PATCH_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION

A valid prepared event exists with no patch barrier.

No physical result may be inferred without separately authorized live
read-only reconciliation.

### PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION

A preservation precondition-failed terminal may prove the implementation
reported no intended patch, but live physical claims still require
separately authorized read-only reconciliation.

### NOT_FOUND

No operation exists for the requested internally generated operation ID.

## Failure semantics

Before the durable patch barrier, failures grant no mutation claim.

After the patch barrier:

- physical patch uncertainty;
- postimage verification uncertainty;
- receipt append failure;
- receipt chunk failure;
- flush failure;
- receipt readback failure;
- receipt reconstruction failure;
- receipt hash mismatch;
- or outer-lock finalization uncertainty

must result in preservation uncertainty.

No automatic delete may follow.

No automatic patch retry may follow.

No automatic rollback claim may follow.

No row recreation may follow.

A later action requires separately authorized read-only reconciliation.

## Executor consumption

A future collapse executor may consume only a verified durable receipt.

Under its required mutation lock, it must independently revalidate:

- exact receipt/store/implementation versions;
- exact group;
- exact winner/latest identities;
- collapse authority and winner-plan fingerprints;
- durable and canonical property identity;
- complete group membership;
- current winner full-row values;
- current winner full-row formulas;
- exact verified winner postimage;
- unchanged source identity;
- unchanged lineage identity;
- unchanged canonical property identity.

A valid receipt satisfies only the observation-preservation prerequisite.

It never independently grants physical-delete authority.
