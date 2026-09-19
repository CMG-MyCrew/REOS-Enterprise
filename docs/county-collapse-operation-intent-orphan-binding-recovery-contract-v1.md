# County Collapse Operation-Intent Orphan Binding Recovery Contract v1

## Status

Design-only recovery contract.

This contract grants no collapse execution, county-data mutation,
physical-delete, scheduler, checkpoint, connector, lease-open,
lease-close, MAO, or automatic-offer authority.

It does not authorize operation-intent provisioning to be retried.

## Incident Authority

Certified production main:

`65df7eebdf57d67f87e82a8f408351bea7fc686a`

Certified production deployment version:

`107`

Current winner-plan fingerprint:

`9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce`

Current collapse authority SHA-256:

`8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7`

The original one-time provisioning RPC was invoked exactly once.

Its process exit code was zero, but its returned payload was not
successfully captured.

Subsequent read-only prerequisite status proved:

- lease state = ABSENT
- lease transition safe = true
- operation-intent configured = false
- all execution and mutation authority = false

The provisioning RPC MUST NOT be invoked again.

## Certified Orphan Artifact

A read-only Drive forensic inspection identified exactly one spreadsheet
named:

`REOS County Collapse Operation Intent Journal`

Creation timestamp:

`2026-09-19T04:48:04.219Z`

Certified workbook-ID SHA-256:

`36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c`

The raw workbook ID MUST NOT be committed to source control.

The recovery operator may provide the raw workbook ID only as an
explicit runtime input.

The recovery implementation MUST hash that supplied ID and require an
exact match to the certified SHA-256 above before any Script Property
write.

## Certified Workbook State

The orphan workbook is certified to satisfy all of these conditions:

1. It is a native Google spreadsheet.
2. It is not the active county-data workbook.
3. It is owned by the provisioning operator.
4. It is not shared.
5. It has no additional editors.
6. It has no additional viewers.
7. It contains exactly two sheets:
   - COUNTY_COLLAPSE_OPERATION_INTENTS
   - COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS
8. COUNTY_COLLAPSE_OPERATION_INTENTS has exactly the certified
   operation-intent event header.
9. COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS has exactly the certified
   chunk header.
10. Neither journal sheet contains data rows.
11. No operation-intent Script Property binding currently exists.

## Recovery Purpose

The recovery implementation may perform exactly one persistent mutation:

Set:

`REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID`

to the exact raw workbook ID whose SHA-256 is:

`36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c`

No other Script Property may be created, modified, deleted, or cleared.

No spreadsheet cell, sheet, metadata, permission, ownership, parent,
name, or content may be modified by the recovery operation.

The existing orphan workbook MUST be adopted as-is.

## Mandatory Pre-write Conditions

Immediately before the property write, recovery MUST fail closed unless:

- admin authority succeeds;
- deployed/current winner fingerprint equals
  `9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce`;
- deployed/current collapse authority equals
  `8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7`;
- lease status is exactly ABSENT;
- lease authority generation is empty;
- lease transition is safe;
- operation-intent binding property is absent;
- supplied workbook-ID SHA-256 equals
  `36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c`;
- target workbook differs from the active county-data workbook;
- target workbook name is exact;
- target workbook has exactly the two certified sheets;
- both certified headers are exact and formula-free;
- both journal data-row counts are zero;
- workbook owner equals the effective recovery operator;
- there are zero additional editors;
- there are zero viewers.

Any failure MUST occur before the property write whenever the condition
is knowable before the write.

## Property Write Boundary

The recovery operation may call Script Properties setProperty exactly
once.

The key MUST be exactly:

`REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID`

The value MUST be exactly the supplied workbook ID already certified by
SHA-256.

The recovery implementation MUST NOT:

- call SpreadsheetApp.create;
- insert or delete sheets;
- write spreadsheet cells;
- alter sharing;
- delete the orphan workbook;
- create a replacement workbook;
- clear or replace an existing binding;
- call deleteProperty;
- retry automatically;
- call county-data mutation APIs;
- call physical-row mutation APIs;
- call scheduler APIs;
- call connector execution APIs;
- open or close the county mutation-exclusion lease.

## Post-write Verification

After the one allowed property write, recovery MUST:

1. reread the property;
2. require exact equality with the supplied workbook ID;
3. reopen and reverify the target workbook;
4. require exact schema certification;
5. require exact access-binding certification;
6. require zero event rows;
7. require zero chunk rows;
8. require the store to remain initially empty.

If any post-write verification is uncertain or fails, the operation MUST
halt and MUST NOT automatically retry.

A subsequent read-only prerequisite-status RPC is the sole authority for
persisted recovery certification.

## Recovery Response

A successful recovery response may expose:

- ok = true
- mode = EXACT_ORPHAN_OPERATION_INTENT_BINDING_RECOVERED
- contractVersion = 1
- orphanWorkbookIdSha256 = `36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c`
- propertyWriteExecuted = true
- workbookCreated = false
- provisioningExecuted = false
- orphanRecoveryExecuted = true
- schemaCertified = true
- accessBindingCertified = true
- eventDataRowCount = 0
- chunkDataRowCount = 0
- initialEmptyStoreCertified = true

The response MUST NOT expose the raw workbook ID.

All collapse execution and mutation authority fields MUST remain false.

## Idempotency and Replay

This recovery is intentionally NOT a generalized idempotent binding API.

If the binding property already exists, recovery MUST fail closed without
writing.

If an execution outcome is uncertain after the property-write boundary,
the recovery RPC MUST NOT be replayed.

Read-only status reconciliation is required instead.

## Post-recovery Expected Status

A successful subsequent
`reosCountyCollapseRuntimePrerequisiteStatus` call must report:

- ok = true
- leaseState = ABSENT
- leaseTransitionSafe = true
- operationIntentConfigured = true
- operationIntentWorkbookIdSha256 = `36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c`
- operationIntentSchemaCertified = true
- operationIntentAccessBindingCertified = true
- operationIntentEventDataRowCount = 0
- operationIntentChunkDataRowCount = 0
- operationIntentInitialEmptyStoreCertified = true
- operationIntentBindingError = empty
- prerequisitesReadyForExecutorImplementation = true

All execution and mutation authority fields must remain false.

## Explicit Non-authority

Completion of this recovery does NOT authorize:

- collapse execution;
- physical deletion;
- implementation or execution of the collapse executor;
- county scheduler restoration;
- checkpoint mutation;
- connector execution;
- removal of CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE;
- automatic MAO;
- automatic offers.

The county scheduler remains frozen.

The existing collapse execution preflight blockers remain unchanged until
a later separately certified source increment.
