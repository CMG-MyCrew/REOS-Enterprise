# Group 2 Post-Success History-Invariant Repair Design v1

Status: DESIGN ONLY. INCIDENT-BOUNDED POST-SUCCESS REPAIR HANDOFF.

This contract defines the required correction for the Group 2 post-success
residual-evidence history invariant.

It authorizes no runtime implementation by itself.

It authorizes no production execution, RPC, deployment, physical deletion,
journal mutation, row recreation, scheduler restoration, checkpoint mutation,
maintenance capability action, automatic MAO, or automatic offer.

## Certified source authority

Source main:

`d79d640d587e8a4d104cc4631b2022609a63fd50`

Source tree:

`90d28afc06ae80006ce32810e3bf523665f191f8`

Production Apps Script version at the completed Group 2 execution boundary:

`119`

Exact incident:

- Group `2`;
- winner `DL-20260820181645-7130`;
- target `DL-20260820181652-6183`.

Exact historical precondition-failed operation:

`6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

Historical prepared event SHA-256:

`843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`

Historical prepared payload SHA-256:

`9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`

Historical terminal event SHA-256:

`2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89`

Historical terminal payload SHA-256:

`10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2`

Historical recovery classification:

`PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`

## Certified completed production outcome

The completed Group 2 production evidence establishes:

- the exact target is physically absent;
- exactly one verified-success delete journal exists for the target;
- the verified-delete terminal exists;
- the verified-delete authority identity is valid;
- multiple target-bound operation histories now exist;
- the first executor attempt is consumed;
- executor retry is not authorized;
- second executor invocation is not authorized;
- row recreation is not authorized;
- the maintenance capability is durably closed;
- a second maintenance close is not authorized.

The post-attempt successor preflight failure is classified as:

`POSTATTEMPT_PREFLIGHT_FAILURE_IS_POST_VERIFICATION_HISTORY_COUNT=true`

The production delete outcome therefore does not require another executor
attempt.

It requires correction of a read-only residual-evidence invariant.

## Current failure surface

The current failing source is:

`build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`

The reader currently:

1. enumerates all strict operation histories;
2. increments `boundOperationCount[targetId]` for every history binding a target;
3. independently recognizes a recovery classified
   `VERIFIED_SUCCESS_JOURNAL`;
4. independently fails if multiple verified-delete histories bind one target;
5. requires every physically missing certified direct-keep target to have
   `boundOperationCount[id] === 1`.

The last rule is no longer valid for the exact completed Group 2 incident.

The exact Group 2 target now legitimately has:

1. the exact certified historical precondition-failed operation; and
2. one verified-success operation that performed and verified the physical
   deletion.

Therefore total target-bound history count is not equivalent to verified-delete
uniqueness.

## Preserved global invariant

Exactly one verified-success history must remain required for every physically
missing certified direct-keep target.

A second verified-success history must fail closed.

The existing:

`Multiple verified delete histories bind target:`

protection must remain effective.

This design does not authorize a generic weakening of verified-delete
uniqueness.

## Incident-bounded Group 2 post-success history set

For the exact incident identity only:

- Group `2`;
- winner `DL-20260820181645-7130`;
- target `DL-20260820181652-6183`;

the residual reader may recognize exactly two strict target-bound operation
histories as the certified post-success set.

Exactly two strict target-bound operations must exist for the incident target.

The two histories must consist of:

1. one exact historical precondition-failed history; and
2. one exact verified-success history.

No generic count-two rule is authorized.

## Exact historical-history predicate

One and only one of the two histories must have operation ID:

`6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

Its identity must remain exactly:

- Group `2`;
- winner `DL-20260820181645-7130`;
- target `DL-20260820181652-6183`.

It must contain exactly two events.

Event 1 must remain:

- sequence `1`;
- type `INTENT_PREPARED`;
- event SHA-256
  `843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153`;
- payload SHA-256
  `9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c`;
- previous-event SHA `GENESIS`.

Event 2 must remain:

- sequence `2`;
- type `COLLAPSE_EXECUTOR_PRECONDITION_FAILED`;
- previous-event SHA equal to the prepared-event SHA;
- event SHA-256
  `2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89`;
- payload SHA-256
  `10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2`.

`CountyCollapseOperationIntentStore.recover()` must classify this operation
exactly as:

`PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`

and must continue to prove:

- automatic retry false;
- row recreation false;
- journal mutation false.

A generic precondition-failed history is not sufficient.

## Exact verified-success-history predicate

The other history must:

- be distinct from the historical operation ID;
- bind Group `2`;
- bind winner `DL-20260820181645-7130`;
- bind target `DL-20260820181652-6183`;
- be readable through the strict operation-intent store;
- recover exactly as `VERIFIED_SUCCESS_JOURNAL`;
- contain a terminal event of type `COLLAPSE_DELETE_VERIFIED`;
- satisfy the existing immutable direct-keep candidate authority;
- satisfy the existing terminal-event SHA consistency check;
- be the exact single entry represented by the existing
  `verifiedByTarget[targetId]` result.

The design does not authorize selecting the verified-success history by caller
input.

The design does not authorize an arbitrary operation-ID allowlist.

## Exact two-history set predicate

For the exact Group 2 target, successful missing-row reconciliation requires
all of the following simultaneously:

1. the target is physically absent;
2. immutable direct-keep candidate authority exists;
3. exactly one `VERIFIED_SUCCESS_JOURNAL` history binds the target;
4. exactly one exact historical precondition-failed history binds the target;
5. total strict target-bound history count is exactly `2`;
6. the verified-success history and historical history are distinct operations;
7. no uncertain target-bound history exists;
8. no third target-bound history exists.

A third target-bound history fails closed.

An unrecognized target-bound history fails closed.

Any uncertain target-bound history fails closed.

A second verified-success history fails closed.

A historical operation with identity, event, hash, sequence, or recovery drift
fails closed.

## Non-Group-2 behavior

The historical exact-one total-history rule remains unchanged for every target
except the exact certified Group 2 post-success target.

For every other physically missing certified target:

`boundOperationCount[id] === 1`

remains required by this repair design.

Non-Group-2 target behavior must remain unchanged.

No generic two-history accommodation is authorized.

No generic terminal-history accommodation is authorized.

No generic precondition-failed-history accommodation is authorized.

## Historical contract relationship

The earlier Group 2 executor-history exception contract described the state
before the successful successor operation existed and correctly required any
second target-bound operation to fail closed at that stage.

That historical contract remains byte-exact historical evidence.

This later post-success contract does not rewrite it.

Instead, this contract defines the new residual-evidence invariant after the
separately certified successor operation completed successfully.

The old executor exception must not be reused as authority for another
executor invocation.

## Required implementation shape

A later separately reviewed implementation may modify:

`build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`

only to distinguish:

- total target-bound history count;
- exact historical Group 2 precondition-failed history count; and
- verified-success history count.

The implementation should remain internal to the read-only residual-evidence
reader.

No new production RPC is required.

No new caller-controlled option is required.

No request schema is changed.

No durable state is added.

No journal event is added, removed, rewritten, or reclassified.

## Protected runtime surfaces

The later implementation must not modify:

- `build/apps-script-brand/CountyCollapseOperationIntentStore.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseExecutor.js`;
- `build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js`;
- `build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js`;
- `build/apps-script-brand/CountyMutationExclusionLease.js`;
- `build/apps-script-brand/Database.js`.

The operation journal remains immutable.

The already-completed executor outcome remains immutable.

The maintenance-close outcome remains immutable.

## Historical validators

Historical contracts and their certified validators remain historical evidence.

This design does not authorize changing:

- `docs/county-code-violation-collapse-postdelete-repeatability-contract-v1.md`;
- `scripts/validate-county-code-violation-collapse-executor-safety-correction-authorization-v1.js`;
- `docs/county-collapse-group2-executor-history-exception-authorization-v1.md`;
- `scripts/validate-county-collapse-group2-executor-history-exception-authorization-v1.js`.

If lifecycle registration must later change because a historical validator
asserts the old source shape, that transition must preserve the historical
validator byte-exact and run it only against its certified revision.

## Minimum future implementation behavior cases

A future implementation validator must prove at minimum:

1. exact Group 2 two-history post-success set is accepted;
2. exact one verified-success history is required;
3. second verified-success history fails;
4. exact historical operation ID is required;
5. historical Group number drift fails;
6. historical winner drift fails;
7. historical target drift fails;
8. historical prepared event SHA drift fails;
9. historical prepared payload SHA drift fails;
10. historical terminal event SHA drift fails;
11. historical terminal payload SHA drift fails;
12. historical event count drift fails;
13. historical event ordering drift fails;
14. historical recovery-classification drift fails;
15. historical automatic-retry authority fails;
16. historical row-recreation authority fails;
17. historical journal-mutation authority fails;
18. verified-success operation must be distinct from historical operation;
19. verified-success classification drift fails;
20. verified-success terminal-type drift fails;
21. a third target-bound operation fails;
22. an unrecognized second target-bound operation fails;
23. an uncertain target-bound operation fails;
24. physically reappearing verified-deleted target fails;
25. missing candidate authority fails;
26. unrelated target with two histories fails;
27. unrelated missing target still requires exactly one strict history;
28. no caller-controlled bypass exists;
29. no journal mutation occurs;
30. no execution authority is granted.

## Future implementation scope

Only after this design increment is merged and post-merge certified may a later
implementation increment modify exactly:

1. `build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js`;
2. `scripts/validate-county-collapse-group2-postsuccess-history-invariant-repair-v1.js`;
3. `.github/workflows/county-collapse-offline.yml`.

No other implementation file is authorized by this contract.

## Explicit non-authority

This contract grants:

`POSTSUCCESS_REPAIR_IMPLEMENTATION_AUTHORIZED=false`

`EXECUTOR_RETRY_AUTHORIZED=false`

`SECOND_EXECUTOR_INVOCATION_AUTHORIZED=false`

`PHYSICAL_DELETE_AUTHORIZED=false`

`ROW_RECREATION_AUTHORIZED=false`

`JOURNAL_MUTATION_AUTHORIZED=false`

`MAINTENANCE_OPEN_AUTHORIZED=false`

`MAINTENANCE_CLOSE_AUTHORIZED=false`

`SCHEDULER_RESTORATION_AUTHORIZED=false`

`CHECKPOINT_MUTATION_AUTHORIZED=false`

`DEPLOYMENT_AUTHORIZED=false`

`RPC_EXECUTION_AUTHORIZED=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Contract markers

`GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_DESIGN_VERSION=1`

`SOURCE_MAIN_SHA=d79d640d587e8a4d104cc4631b2022609a63fd50`

`SOURCE_MAIN_TREE=90d28afc06ae80006ce32810e3bf523665f191f8`

`INCIDENT_GROUP_NUMBER=2`

`INCIDENT_WINNER=DL-20260820181645-7130`

`INCIDENT_TARGET=DL-20260820181652-6183`

`HISTORICAL_OPERATION_ID=6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8`

`HISTORICAL_RECOVERY_CLASSIFICATION=PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION`

`VERIFIED_SUCCESS_RECOVERY_CLASSIFICATION=VERIFIED_SUCCESS_JOURNAL`

`INCIDENT_ALLOWED_BOUND_HISTORY_COUNT=2`

`INCIDENT_HISTORICAL_HISTORY_COUNT=1`

`INCIDENT_VERIFIED_SUCCESS_HISTORY_COUNT=1`

`THIRD_TARGET_BOUND_HISTORY_ALLOWED=false`

`SECOND_VERIFIED_SUCCESS_HISTORY_ALLOWED=false`

`UNCERTAIN_TARGET_BOUND_HISTORY_ALLOWED=false`

`GENERIC_COUNT_TWO_RULE_ALLOWED=false`

`NON_GROUP2_EXACT_ONE_RULE_PRESERVED=true`

`FUTURE_IMPLEMENTATION_SCOPE_FILE_COUNT=3`

`RESIDUAL_EVIDENCE_FUTURE_MODIFICATION_AUTHORITY=true`

`OPERATION_INTENT_STORE_MODIFICATION_AUTHORITY=false`

`SUCCESSOR_PREFLIGHT_MODIFICATION_AUTHORITY=false`

`EXECUTOR_MODIFICATION_AUTHORITY=false`

`POST_TERMINAL_RECONCILIATION_MODIFICATION_AUTHORITY=false`

`JOURNAL_MUTATION_AUTHORITY=false`

`POSTSUCCESS_REPAIR_IMPLEMENTATION_AUTHORIZED=false`

`EXECUTOR_RETRY_AUTHORITY=false`

`PHYSICAL_DELETE_AUTHORITY=false`

`SCHEDULER_RESTORATION_AUTHORITY=false`

`AUTOMATIC_MAO_AUTHORITY=false`

`AUTOMATIC_OFFER_AUTHORITY=false`

## Release boundary

This design increment is exactly three files:

1. this document;
2. its design validator;
3. county-collapse offline workflow registration.

No runtime implementation is included.

No production RPC is authorized.

No executor invocation is authorized.

No physical deletion is authorized.

No journal mutation is authorized.

No scheduler restoration is authorized.
