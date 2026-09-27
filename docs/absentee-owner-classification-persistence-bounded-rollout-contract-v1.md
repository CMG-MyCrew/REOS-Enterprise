# Absentee-Owner Classification Persistence and Bounded Rollout Contract v1

## 1. Purpose

Define a fail-closed persistence and bounded-rollout boundary for already
certified absentee-owner classification evidence.

The classification remains supplemental evidence.

This contract does not make absentee-owner classification acquisition
authority and does not authorize production implementation or execution.

## 2. Existing certified upstream authority

Future classification persistence may originate only from the already
certified pipeline:

1. `REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(...)`
2. `REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup(...)`
3. `REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(...)`
4. `REOS.AbsenteeOwnerClassification.classify(...)`

A bounded-rollout implementation may compose those internal certified
surfaces only after separate implementation authorization.

The historical single-record production certification RPC:

`reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord(...)`

is certification authority only.

It MUST NOT be repurposed as generic batch or persistence authority.

## 3. Persistence architecture decision

Classification persistence v1 MUST use a dedicated append-only evidence
store.

It MUST NOT persist classification by adding generic mutation authority to
`DISTRESS_LEADS`.

The evidence-store workbook authority MUST be supplied through the exact
Script Property:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

The evidence sheet name is exactly:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`

Evidence-store provisioning is a separate future administrative step.

The persistence runtime MUST NOT silently create a workbook or sheet.

## 4. Separation from owner enrichment persistence

The existing absentee-owner enrichment persistence pipeline owns only:

- `Owner Name`
- `Owner Mailing Address`

That pipeline MUST NOT become classification persistence authority.

Classification persistence MUST NOT invoke or repurpose:

- `REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize`
- `REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan`
- `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare`
- `REOS.AbsenteeOwnerEnrichmentExecutor.execute`

Classification persistence MUST NOT write `Owner Name` or
`Owner Mailing Address`.

## 5. No DISTRESS_LEADS classification mutation in v1

Version 1 MUST NOT add, update, or overwrite a classification field on
`DISTRESS_LEADS`.

It MUST NOT modify any existing `DISTRESS_LEADS` business field.

A future materialized/current-classification projection requires a separate
contract.

The evidence store is the durable authority for v1.

## 6. Exact persisted evidence schema

The future evidence store MUST use exactly these semantic columns:

- `Evidence Event ID`
- `Observed At UTC`
- `Persistence Contract Version`
- `Classification Contract Version`
- `Distress Lead ID`
- `Canonical Property Key`
- `Physical Row Number`
- `Classification Outcome`
- `Classification Basis`
- `Upstream Comparison Outcome`
- `Differing Components JSON`
- `Normalized Property Address JSON`
- `Normalized Mailing Address JSON`
- `Source Agency`
- `Source Dataset`
- `Source Table`
- `Source Endpoint`
- `Classifier Result SHA-256`
- `Previous Evidence SHA-256`
- `Evidence Event SHA-256`

Contract version is exactly `1`.

## 7. Fixed provenance authority

Version 1 classification provenance is fixed to:

- Source Agency:
  `Philadelphia Office of Property Assessment`
- Source Dataset:
  `Philadelphia Properties and Assessment History`
- Source Table:
  `opa_properties_public`
- Source Endpoint:
  `https://phl.carto.com/api/v2/sql`
- Classification Basis:
  `OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON`

Caller-supplied provenance is prohibited.

A new provider requires a new contract version.

## 8. Exact identity

Every persisted evidence event requires:

- `Distress Lead ID`
- `Canonical Property Key`
- physical `rowNumber`

Both identity values MUST be nonblank.

The dual identity and physical row MUST come from the certified
classification pipeline.

Classification persistence MUST NOT derive or repair identity.

## 9. Accepted classifier input

Persistence may accept only an exact certified classifier result.

The persistence boundary MUST reject:

- raw OPA rows;
- raw owner evidence;
- caller-manufactured comparison evidence;
- caller-manufactured classification objects;
- arbitrary persistence patches;
- generic CSV rows;
- historical absentee-owner connector output.

## 10. Persistable outcomes

Only classifier results with `ok: true` are persistence eligible.

The v1 persistence-eligible outcomes are exactly:

- `ABSENTEE_OWNER_INDICATED`
- `OWNER_MAILING_MATCHED`
- `INSUFFICIENT_CLASSIFICATION_EVIDENCE`

`INELIGIBLE_COMPARISON_EVIDENCE` MUST NOT be persisted as successful
classification evidence.

It remains a fail-closed per-target result.

## 11. Classification semantics remain unchanged

`ABSENTEE_OWNER_INDICATED` means only that certified official owner mailing
address evidence differs from the certified subject property address.

It does not establish physical occupancy or vacancy.

`OWNER_MAILING_MATCHED` does not establish owner occupancy.

`INSUFFICIENT_CLASSIFICATION_EVIDENCE` is not an affirmative absentee-owner
finding.

## 12. Raw owner-name prohibition

Owner names MUST NOT be persisted in the classification evidence store.

The store MUST NOT contain:

- raw OPA owner names;
- `Owner Name`;
- owner-name comparison results;
- owner-name hashes;
- owner-name scoring.

Owner names do not participate in classification.

## 13. Persisted address evidence

The store MAY persist only the normalized address objects already present in
the exact certified classifier result:

- normalized property address;
- normalized mailing address.

It MUST NOT persist the complete raw OPA row.

It MUST NOT persist raw provider payloads.

## 14. Canonical classifier-result hash

Before persistence, the exact classifier result MUST be serialized through a
deterministic canonical JSON algorithm.

`Classifier Result SHA-256` MUST be SHA-256 of that canonical representation.

The hash MUST include the target identity contained in the classifier result.

No caller-supplied hash is trusted.

## 15. Idempotency

For the same dual identity and exact `Classifier Result SHA-256`:

- zero new evidence rows may be appended;
- the result MUST be `ALREADY_PERSISTED`;
- no timestamp refresh may manufacture a new event;
- no prior evidence row may be modified.

Exact repeated execution against unchanged evidence is therefore idempotent.

## 16. Changed evidence

For the same dual identity with a different certified classifier-result hash,
the existing event MUST remain unchanged.

A new evidence event MAY be appended.

Changed evidence MUST NOT overwrite history.

## 17. Staleness and current-state semantics

A persisted classification is an observation, not perpetual truth.

`Observed At UTC` MUST be generated by the trusted persistence runtime and
MUST NOT be accepted from the caller.

Version 1 MUST NOT mutate an old event to mark it stale.

The newest verified evidence event for a dual identity may be treated as the
latest observation by a future reader.

A separate future contract is required for:

- refresh cadence;
- expiration policy;
- current-classification projection;
- automatic reclassification.

## 18. Append-only history chain

The first event for an identity MUST use:

`GENESIS`

as `Previous Evidence SHA-256`.

Each subsequent event for the same dual identity MUST reference the exact
`Evidence Event SHA-256` of the immediately preceding persisted event.

`Evidence Event SHA-256` MUST be computed deterministically from the complete
canonical event payload excluding only the final event-hash field itself.

No prior evidence hash may be rewritten.

## 19. Spreadsheet text safety

Future persistence MUST reject unsafe spreadsheet text capable of formula
interpretation.

No evidence value beginning with a spreadsheet formula-control prefix may be
accepted without safe serialization.

Persistence MUST NOT write formulas.

## 20. Concurrency and duplicate prevention

The future persistence executor MUST protect:

1. latest-event discovery;
2. duplicate-result detection;
3. previous-event hash selection;
4. append invocation; and
5. postappend verification

inside one bounded lock authority.

The lock does not grant acquisition-record mutation authority.

The classification evidence store MUST NOT alter county mutation-exclusion
lease state.

## 21. Persistence outcome classes

Before the first evidence-store write, a failure MUST be classified as:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED`

and MUST mean no evidence-store write was attempted.

After the first physical evidence-store write invocation, any exception or
failed postimage verification MUST be classified as:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN`

and MUST NOT claim rollback.

A fully verified append MUST return:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED`

An exact duplicate MUST return:

`ABSENTEE_OWNER_CLASSIFICATION_ALREADY_PERSISTED`

with zero physical write.

## 22. Bounded rollout input

A future bounded-rollout RPC may accept exactly one object containing:

`targets`

`targets` MUST be an array containing from `1` through `10` explicit targets.

Hard maximum:

`MAX_TARGETS = 10`

Every target MUST contain exactly:

- `rowNumber`
- `identity`

Every identity MUST contain exactly:

- `Distress Lead ID`
- `Canonical Property Key`

## 23. Explicit-target requirement

Bounded rollout MUST NOT discover targets.

It MUST NOT invoke bounded candidate discovery automatically.

It MUST NOT scan for eligible records.

It MUST NOT accept predicates, searches, filters, counties, or source-wide
selection criteria.

Targets must be explicitly selected before invocation.

## 24. Whole-request validation before production reads

Before the first target is read, the rollout boundary MUST validate:

- admin authority;
- top-level input shape;
- target count;
- exact target shape;
- row-number syntax;
- dual-identity syntax;
- duplicate target detection.

A malformed batch MUST fail before any target is read or any OPA HTTP request
is attempted.

## 25. Duplicate-target prohibition

The same physical row or same dual identity MUST NOT appear twice in one
rollout request.

Duplicate targets MUST fail the whole request before the first production read.

## 26. Per-target pipeline cardinality

For each accepted target, the future rollout implementation may invoke at most:

- one exact-record selector;
- one Philadelphia OPA owner-evidence lookup;
- one owner-evidence comparison;
- one classifier;
- one classification persistence attempt.

Therefore one maximum-size request permits at most:

- `10` exact-record target reads;
- `10` OPA HTTP requests;
- `10` comparisons;
- `10` classifications;
- `10` persistence attempts.

No stage may retry automatically.

## 27. Sequential execution

Targets MUST be processed sequentially.

Version 1 MUST NOT execute target pipelines concurrently.

No asynchronous fan-out is authorized.

## 28. Failure isolation before persistence uncertainty

A target failure occurring before any persistence write MAY be returned as a
per-target failure while later explicitly supplied targets continue.

A failed target MUST NOT corrupt another target.

No failed target may manufacture persisted evidence.

## 29. Persistence uncertainty halts the rollout

If any target enters:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN`

the rollout MUST stop immediately.

No later target may be started.

The uncertain target MUST NOT be retried automatically.

Operator reconciliation is required before additional rollout execution.

## 30. Required design safety boundaries

1. dedicated classification evidence store only
2. no DISTRESS_LEADS classification write
3. append-only evidence history
4. no update or delete of prior classification evidence
5. exact persisted dual identity required
6. physical row evidence required
7. certified classifier-result input only
8. no raw OPA row persistence
9. no owner-name persistence
10. only ok:true classifier outcomes may persist
11. INELIGIBLE_COMPARISON_EVIDENCE is not persisted as success
12. deterministic classifier-result SHA-256 required
13. exact duplicate evidence is a zero-write no-op
14. changed evidence appends a new event
15. Observed At UTC is runtime-generated
16. per-identity previous-event hash chain required
17. deterministic evidence-event SHA-256 required
18. spreadsheet formula-injection safety required
19. admin authority before production reads
20. explicit targets only
21. MAX_TARGETS = 10
22. duplicate targets rejected before first read
23. exact-record selector at most once per target
24. OPA lookup at most once per target
25. comparison at most once per target
26. classifier at most once per target
27. persistence attempt at most once per target
28. no automatic retries
29. persistence uncertainty halts the rollout
30. no candidate discovery inside rollout
31. no pagination, run-all, or automatic continuation
32. no scheduler or trigger authority
33. no county execution or county mutation authority
34. no generic absentee connector or legacy acquisition scoring authority
35. no Qualified Deal Queue or acquisition lifecycle authority
36. no ARV, repair-scope, MAO, offer, or automatic-offer authority

## 31. Bounded rollout production stages

Production rollout MUST progress only through separately authorized stages:

`1 -> 5 -> 10`

Stage 1 permits at most one explicit target.

Stage 2 permits at most five explicit targets.

Stage 3 permits at most ten explicit targets.

Successful completion of one stage does not automatically authorize the next
stage.

No stage authorizes recurring or scheduled execution.

## 32. No scheduler or trigger authority

Version 1 MUST NOT create, install, update, remove, or execute:

- time-driven triggers;
- county scheduler triggers;
- absentee-owner scheduler triggers;
- automatic refresh jobs;
- automatic retry jobs.

Scheduled classification requires a separate future contract.

## 33. County isolation

Classification persistence and bounded rollout MUST NOT execute or alter:

- county connectors;
- county scheduler;
- county checkpoints;
- county cursors;
- county durable-identity migration;
- county collapse;
- county repairs;
- county mutation-exclusion lease state.

A county-originated acquisition record remains only an existing target record.

## 34. Legacy connector and acquisition-scoring isolation

The historical:

`reosConnectorHandleAbsenteeOwners`

is not classification persistence or rollout authority.

Historical `AcquisitionDistressIntelligence` absentee-owner scoring is not
classification persistence or rollout authority.

Neither may be called, retrofitted, or used as a fallback.

## 35. Acquisition safety gate

Classification evidence MUST NOT:

- establish comp-supported ARV;
- establish repair scope;
- calculate MAO;
- write MAO;
- calculate Suggested Offer;
- generate an offer;
- submit an offer;
- grant automatic offer authority.

Automatic MAO or offer authority remains blocked unless both:

1. adequate comp-supported ARV; and
2. adequate repair scope

exist through independently certified acquisition paths.

Absentee-owner classification evidence cannot satisfy, substitute for, bypass,
replace, or weaken either requirement.

## 36. Qualified Deal Queue and lifecycle isolation

Persistence or rollout MUST NOT:

- create a Qualified Deal Queue record;
- change acquisition status;
- advance lifecycle;
- create a deal;
- route directly to offer generation.

Any later use of classification evidence in acquisition decisions requires a
separate contract.

## 37. Future behavior cases

1. admin denial stops before any target read
2. missing options fail before target read
3. empty targets fail before target read
4. more than ten targets fail before target read
5. malformed target fails before target read
6. duplicate row or dual identity fails before target read
7. selector failure causes zero HTTP and zero persistence for that target
8. lookup failure causes zero persistence for that target
9. ineligible comparison evidence is not persisted as successful classification
10. ineligible classifier result is not persisted
11. ABSENTEE_OWNER_INDICATED may produce one verified evidence event
12. OWNER_MAILING_MATCHED may produce one verified evidence event
13. INSUFFICIENT_CLASSIFICATION_EVIDENCE may produce one verified evidence event
14. exact duplicate classifier-result hash produces ALREADY_PERSISTED and zero write
15. changed classifier-result hash appends one new event
16. identity mismatch fails closed
17. owner name is never persisted in classification evidence
18. raw lookup payload is never persistence input
19. DISTRESS_LEADS is never classification-persistence target
20. old classification evidence is never updated or deleted
21. Observed At UTC is generated by trusted runtime
22. classifier-result hash is deterministic
23. first event uses GENESIS previous hash
24. subsequent event links to immediately prior event hash
25. unsafe spreadsheet text fails before persistence
26. definite no-write target failure may allow next explicit target
27. persistence outcome uncertainty halts the complete rollout
28. no failed or uncertain target is retried automatically
29. OPA lookup executes at most once per target and ten times per request
30. scheduler, trigger, county, QDQ, lifecycle, ARV, repair, MAO and offer authority remain absent
31. production rollout stages 1 then 5 then 10 each require separate authorization
32. acquisition safety gate remains independent and preserved

## 38. Future implementation decomposition

A future implementation SHOULD remain decomposed into separately certified
surfaces:

1. classification evidence canonicalizer / persistence planner;
2. append-only classification evidence store;
3. persistence executor with preimage/idempotency/postimage verification;
4. bounded rollout orchestrator;
5. static validator;
6. behavior validator;
7. integration validator.

No single surface should become generic acquisition mutation authority.

## 39. Implementation certification sequence

If implementation is separately authorized:

1. certify this design contract
2. commit design only
3. PR CI
4. exact-head design merge
5. post-merge main CI
6. implement evidence persistence from the newly certified main
7. implement offline static and behavior validators
8. implement evidence-store integration validation
9. implement bounded-rollout orchestration
10. certify hard MAX_TARGETS = 10
11. certify zero automatic retries
12. certify zero DISTRESS_LEADS classification writes
13. certify acquisition safety isolation
14. implementation commit
15. PR CI
16. exact-head implementation merge
17. post-merge main CI
18. deployment preflight
19. exact deployment certification
20. evidence-store provisioning preflight
21. explicit authorization for stage-1 target
22. one-target persistence production certification
23. evidence review
24. separate authorization for stage 5
25. stage-5 certification and review
26. separate authorization for stage 10
27. stage-10 certification and review

No step implies authority for the next step.

## 40. Contract invariant

The v1 invariant is:

explicit bounded target
+ certified exact-record verification
+ at most one certified OPA lookup
+ certified comparison
+ certified deterministic classification
+ deterministic classifier-result hash
+ append-only idempotent evidence persistence
= at most one new durable classification evidence event per changed result

and:

no DISTRESS_LEADS classification mutation
+ no owner-name persistence
+ no retry
+ no scheduler
+ no county execution
+ no occupancy/vacancy inference
+ no acquisition lifecycle authority
+ no ARV/repair/MAO/offer authority.
