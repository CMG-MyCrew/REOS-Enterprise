# Group 2 Executor-History Exception Authorization v1

Status: DESIGN-ONLY INCIDENT-SPECIFIC EXECUTOR-HISTORY EXCEPTION HANDOFF.

This contract authorizes no production execution or runtime mutation by itself.

Its sole purpose is to authorize a later separately reviewed implementation
that may recognize one exact certified Group 2 terminal history as non-blocking
at the existing executor target-history guard.

The future exception is not an executor retry authorization.

The future exception is not physical-delete authority.

## Certified source authority

Source main:

`5dcdafe278a57a72685949b357029b5a5020cdef`

Source tree:

`5bf56ee137acdf74d09951a87d4ab45d761841b7`

PR #223 post-merge CI run:

`35665185444`

PR #223 post-merge CI job:

`106549227383`

Production Apps Script version:

`118`

Production deployment:

`AKfycbxTPu2haRrW9Ls0mkRV4uambT5ajC5RlNC5m7IBxPlcmspVjF5DGdNxOG4pCzjQbHeX`

## Exact incident

Operation ID:

`6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

Group:

`2`

Winner:

`DL-20260820181645-7130`

Target:

`DL-20260820181652-6183`

Original executor implementation:

`DIRECT_KEEP_COLLAPSE_EXECUTOR_V1`

Prepared event SHA-256:

`843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`

Prepared payload SHA-256:

`9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`

Terminal event SHA-256:

`2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89`

Terminal payload SHA-256:

`10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2`

Required recovery classification:

`PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`

## Certified post-terminal production evidence

Certified production reconciliation mode:

`READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1`

Certified raw RPC evidence SHA-256:

`0d1d4ec19959bfa5f6a2a77c561fdc8ba7c74011e6ab30d98f8961ee9c6d9622`

Certified normalized RPC JSON SHA-256:

`92addf0817fc0267370abf03d227954363511a1d288262f1373db2fe58d64389`

Certified RPC stderr SHA-256:

`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

Certified live state:

- winner present exactly once;
- target present exactly once;
- winner current row `766`;
- target current row `770`;
- journal event count exactly `2`;
- event order exactly:
  1. `INTENT_PREPARED`;
  2. `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`;
- delete barrier absent;
- verified delete absent;
- scheduler frozen;
- checkpoint frozen;
- post-terminal reconciliation complete;
- executor-history exception evidence eligible;
- executor-history exception implementation authority false;
- executor retry authority false;
- physical-delete authority false;
- production-data mutation authority false;
- journal mutation false;
- automatic retry false.

Historical row numbers 766 and 770 are evidence only.

They are not future row identity or mutation authority.

No further production reconciliation RPC invocation is authorized by this
contract.

## Existing executor blocker

The current executor function:

`assertNoTargetBoundOperationHistory_`

enumerates durable operation history and fails whenever an existing operation's
first manifest binds the requested target.

Its current failure is:

`Existing durable operation history already binds requested delete candidate.`

That fail-closed behavior remains correct for every operation history except
the one exact certified incident defined by this contract.

## Future exception architecture

The later implementation may alter only the target-bound-history guard
semantics needed to recognize the exact certified incident.

It must not add:

- a caller-controlled bypass flag;
- an exception request field;
- a bypass confirmation token;
- an arbitrary operation-ID allowlist;
- an event-type-only bypass;
- a generic terminal-history bypass;
- an automatic retry switch.

For the exact requested identity:

- Group `2`;
- winner `DL-20260820181645-7130`;
- target `DL-20260820181652-6183`;

exactly one prior target-bound operation may be treated as non-blocking, and
only if every predicate in this contract is satisfied.

## Exact durable-history predicates

The target-bound operation must be exactly:

`6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

The history must contain exactly two events.

Event 1 must be exactly:

- sequence `1`;
- type `INTENT_PREPARED`;
- Group `2`;
- winner `DL-20260820181645-7130`;
- target `DL-20260820181652-6183`;
- event SHA
  `843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`;
- payload SHA
  `9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`;
- previous-event SHA `GENESIS`.

Event 2 must be exactly:

- sequence `2`;
- type `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`;
- Group `2`;
- winner `DL-20260820181645-7130`;
- target `DL-20260820181652-6183`;
- previous-event SHA equal to the prepared-event SHA;
- event SHA
  `2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89`;
- payload SHA
  `10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2`.

No third event is permitted.

No `DELETE_INVOCATION_STARTED` event is permitted.

No `POSTDELETE_VERIFIED` event is permitted.

No `COLLAPSE_DELETE_VERIFIED` event is permitted.

No `COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN` event is permitted.

## Recovery predicates

`CountyCollapseOperationIntentStore.recover()` must return exactly:

`PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`

and prove:

- `eventCount=2`;
- `automaticRetryPermitted=false`;
- `rowRecreationPermitted=false`;
- `journalMutationExecuted=false`.

Any recovery-state drift fails closed.

## Fresh post-terminal evidence predicate

During history-guard evaluation, the future implementation must call the
existing read-only:

`REOS.CountyCollapseGroup2PostTerminalReconciliation.status()`

It must require exact successful incident evidence including:

- `ok=true`;
- mode `READ_ONLY_GROUP2_POST_TERMINAL_RECONCILIATION_V1`;
- exact operation ID;
- exact Group `2`;
- exact winner;
- exact target;
- exact prepared event SHA;
- exact prepared payload SHA;
- exact terminal event SHA;
- exact terminal payload SHA;
- journal event count exactly `2`;
- exact event ordering;
- exact recovery classification;
- winner present;
- target present;
- delete barrier absent;
- verified delete absent;
- scheduler frozen;
- checkpoint frozen;
- `postTerminalReconciliationComplete=true`;
- `executorHistoryExceptionEvidenceEligible=true`;
- `executorHistoryExceptionImplementationAuthorityGranted=false`;
- `executorRetryAuthorityGranted=false`;
- `physicalDeleteAuthorityGranted=false`;
- `productionDataMutationAuthorityGranted=false`;
- `journalMutationExecuted=false`;
- `automaticRetryPermitted=false`.

If that reader fails, drifts, or exposes execution or mutation authority, the
history exception must fail closed.

## Exactly one historical exception

Before a new operation can be prepared, exactly one existing durable operation
may bind this target.

That one operation must be the exact certified incident.

Any second target-bound operation must fail closed.

Therefore a later successor attempt that creates new durable history does not
implicitly authorize another attempt.

No automatic repeat execution is permitted.

## Explicitly prohibited generic bypasses

The future implementation must reject:

- a different operation ID;
- a different group;
- a different winner;
- a different target;
- a different prepared event SHA;
- a different prepared payload SHA;
- a different terminal event SHA;
- a different terminal payload SHA;
- a different event count;
- a different event ordering;
- an uncertain operation;
- a delete-barrier operation;
- a post-delete operation;
- a verified-delete operation;
- an arbitrary operation-ID allowlist;
- any terminal event merely because it is terminal;
- any `COLLAPSE_EXECUTOR_PRECONDITION_FAILED` event merely by event type.

## Request surface remains unchanged

The executor request schema must remain unchanged.

No request field may select, enable, disable, or name the history exception.

Eligibility must be derived only from exact durable history and the certified
fresh read-only evidence surface.

## Existing safeguards remain mandatory

The exception changes only the target-bound-history blocker.

It must not weaken or skip:

- admin authority;
- exact confirmation token;
- current collapse authority SHA;
- current winner-plan fingerprint;
- successor execution preflight;
- residual evidence;
- fresh winner/target identity checks;
- physical sheet evidence capture;
- downstream-reference audit;
- maintenance readiness;
- caller-owned Database ScriptLock context;
- pre-delete evidence revalidation;
- durable new-operation prepare/readback;
- `DELETE_INVOCATION_STARTED` barrier;
- exact physical-delete primitive;
- post-delete verification;
- verified terminal journal events;
- fail-closed uncertainty handling.

## Future implementation scope

Only after this authorization increment is merged and post-merge certified may
a later implementation modify exactly these four files:

1. `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`
2. `scripts/validate-county-collapse-group2-executor-history-exception-v1.js`
3. `.github/workflows/county-collapse-offline.yml`
4. `scripts/validate-county-runtime-integration.js`

No other implementation file is authorized.

## Protected runtime surfaces

The later implementation must not modify:

- `build/apps-script-brand/CountyCollapseOperationIntentStore.js`;
- `build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js`;
- `build/apps-script-brand/CountyMutationExclusionLease.js`;
- `build/apps-script-brand/Database.js`.

## Minimum future implementation behavior cases

The implementation validator must prove at least:

1. exact certified incident history is eligible;
2. exact certified fresh post-terminal evidence is required;
3. wrong operation ID fails;
4. wrong group fails;
5. wrong winner fails;
6. wrong target fails;
7. wrong prepared event SHA fails;
8. wrong prepared payload SHA fails;
9. wrong terminal event SHA fails;
10. wrong terminal payload SHA fails;
11. wrong terminal previous-event SHA fails;
12. prepared-only history fails;
13. a third event fails;
14. delete barrier fails;
15. post-delete verified history fails;
16. verified-delete terminal fails;
17. uncertain terminal fails;
18. wrong recovery classification fails;
19. automatic-retry recovery state fails;
20. row-recreation-permitted recovery state fails;
21. journal-mutation recovery state fails;
22. post-terminal reader failure fails;
23. evidence-ineligible post-terminal result fails;
24. post-terminal production-mutation authority fails;
25. post-terminal executor-retry authority fails;
26. post-terminal physical-delete authority fails;
27. second target-bound operation fails;
28. non-Group-2 target history remains blocked;
29. executor request schema remains unchanged;
30. no caller-controlled bypass surface exists.

## Authorization semantics

The certified production evidence establishes only:

`executorHistoryExceptionEvidenceEligible=true`

This contract authorizes a later implementation increment after this design is
merged and post-merge certified.

It does not authorize an executor invocation.

It does not authorize physical deletion.

A later deployment and separate live preflight are still required before any
successor execution could be considered.

## Contract markers

`GROUP2_EXECUTOR_HISTORY_EXCEPTION_AUTHORIZATION_VERSION=1`

`SOURCE_MAIN_SHA=5dcdafe278a57a72685949b357029b5a5020cdef`

`SOURCE_MAIN_TREE=5bf56ee137acdf74d09951a87d4ab45d761841b7`

`SOURCE_POST_MERGE_CI_RUN=35665185444`

`SOURCE_POST_MERGE_CI_JOB=106549227383`

`PRODUCTION_VERSION=118`

`INCIDENT_OPERATION_ID=6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

`INCIDENT_GROUP_NUMBER=2`

`INCIDENT_WINNER=DL-20260820181645-7130`

`INCIDENT_TARGET=DL-20260820181652-6183`

`PREPARED_EVENT_SHA256=843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`

`PREPARED_PAYLOAD_SHA256=9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`

`TERMINAL_EVENT_SHA256=2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89`

`TERMINAL_PAYLOAD_SHA256=10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2`

`POST_TERMINAL_RAW_SHA256=0d1d4ec19959bfa5f6a2a77c561fdc8ba7c74011e6ab30d98f8961ee9c6d9622`

`POST_TERMINAL_JSON_SHA256=92addf0817fc0267370abf03d227954363511a1d288262f1373db2fe58d64389`

`POST_TERMINAL_STDERR_SHA256=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`

`POST_TERMINAL_RECONCILIATION_COMPLETE=true`

`DELETE_BARRIER_PRESENT=false`

`VERIFIED_DELETE_PRESENT=false`

`WINNER_CURRENT_ROW_NUMBER=766`

`TARGET_CURRENT_ROW_NUMBER=770`

`FUTURE_HISTORY_EXCEPTION_IMPLEMENTATION_SCOPE_FILE_COUNT=4`

`OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false`

`POST_TERMINAL_RECONCILIATION_MODIFICATION_AUTHORITY=false`

`RESIDUAL_EVIDENCE_MODIFICATION_AUTHORITY=false`

`SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false`

`MAINTENANCE_GATE_MODIFICATION_AUTHORITY=false`

`COUNTY_MUTATION_EXCLUSION_LEASE_MODIFICATION_AUTHORITY=false`

`DATABASE_MODIFICATION_AUTHORITY=false`

`EXECUTOR_HISTORY_EXCEPTION_IMPLEMENTATION_AUTHORITY=false`

`EXECUTOR_RETRY_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`JOURNAL_MUTATION_AUTHORITY=false`

`PRODUCTION_RECONCILIATION_RPC_REINVOCATION_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`CHECKPOINT_MUTATION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Release boundary

This authorization increment is exactly three files:

1. this document;
2. its validator;
3. county-collapse offline workflow registration.

No runtime source changes are authorized in this increment.

No executor retry is authorized.

No physical delete is authorized.

No production RPC is authorized.
