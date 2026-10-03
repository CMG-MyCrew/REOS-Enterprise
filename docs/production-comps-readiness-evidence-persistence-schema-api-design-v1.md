# Production Comps Readiness Evidence Persistence Schema + API Design v1

## 1. Status and authority

This document defines the exact v1 persistence schema and API contract for
production comps-readiness evidence.

This phase is design-only.

It does not create production tables, sheets, columns, APIs, Apps Script
runtime behavior, evidence records, workflow progression, provider access,
ARV calculation, repair-scope mutation, MAO calculation, offer generation,
offer submission, deployment, RPC, scheduler changes, or triggers.

The design implements the already-certified production comps readiness
evidence persistence bridge contract. It does not enlarge that contract's
authority.

## 2. Safety invariant

Automatic MAO or offer authority remains blocked unless both:

1. adequate comp-supported ARV evidence exists; and
2. adequate repair-scope evidence exists.

Missing, stale, contradictory, malformed, review-required, identity-mismatched,
or otherwise inadequate evidence fails closed.

Legacy scalar values and workflow state are compatibility surfaces only.

The following do not independently establish readiness:

- a legacy ARV number;
- DEAL_COMPARABLES row presence;
- comparable count;
- a legacy Repair Cost or rehab number;
- a MAO value;
- an existing workflow stage;
- a previously persisted readiness conclusion without its underlying evidence.

## 3. Persistence model

The v1 design defines three additive evidence-oriented persistence surfaces:

1. `DEAL_ARV_EVIDENCE`
2. `DEAL_REPAIR_SCOPE_EVIDENCE`
3. `DEAL_OFFER_READINESS_EVIDENCE`

These names are design contracts only in this phase.

No table or sheet is created by this design.

The surfaces are append-only evidence histories. Existing evidence rows are
not silently overwritten to represent newer evidence.

Corrections and superseding evaluations are represented by new evidence rows.

## 4. DEAL_ARV_EVIDENCE exact schema

The exact ordered v1 columns are:

1. `ARV Evidence ID`
2. `Schema Version`
3. `Deal ID`
4. `Canonical Property Key`
5. `Evidence Status`
6. `Confidence Status`
7. `Estimated ARV`
8. `Accepted Comparable Evidence IDs JSON`
9. `Accepted Comparable Count`
10. `Minimum Comparable Count`
11. `Valuation Method`
12. `Valuation Inputs JSON`
13. `Supported Low Value`
14. `Supported High Value`
15. `Review Required`
16. `Reason Codes JSON`
17. `Evidence Generated At`
18. `Persisted At`
19. `Source Engine`
20. `Source Engine Version`
21. `Provenance JSON`
22. `Idempotency Key`
23. `Supersedes Evidence ID`

## 5. DEAL_REPAIR_SCOPE_EVIDENCE exact schema

The exact ordered v1 columns are:

1. `Repair Scope Evidence ID`
2. `Schema Version`
3. `Deal ID`
4. `Canonical Property Key`
5. `Scope Status`
6. `Scope Complete`
7. `Estimated Repair Cost`
8. `Review Required`
9. `Reason Codes JSON`
10. `Scope Inputs JSON`
11. `Evidence Generated At`
12. `Persisted At`
13. `Source Engine`
14. `Source Engine Version`
15. `Provenance JSON`
16. `Idempotency Key`
17. `Supersedes Evidence ID`

## 6. DEAL_OFFER_READINESS_EVIDENCE exact schema

The exact ordered v1 columns are:

1. `Readiness Evidence ID`
2. `Schema Version`
3. `Deal ID`
4. `Canonical Property Key`
5. `ARV Evidence ID`
6. `Repair Scope Evidence ID`
7. `Decision`
8. `Comp Supported ARV Ready`
9. `Repair Scope Ready`
10. `Reason Codes JSON`
11. `Evaluated At`
12. `Persisted At`
13. `Gate Version`
14. `Idempotency Key`
15. `Supersedes Evidence ID`

The readiness surface records the result of applying the certified readiness
gate to specific durable ARV and repair evidence records.

A readiness row does not grant Offer Generation authority.

## 7. Stable evidence identifiers

Required immutable ID prefixes are:

- ARV evidence: `ARVE-`
- repair-scope evidence: `RSE-`
- readiness evidence: `ORE-`

The suffix-generation mechanism must be collision-resistant.

A row number must not be used as evidence identity.

An evidence ID must never be reused for materially different evidence.

## 8. Idempotency

Each evidence surface requires an `Idempotency Key`.

An exact retry of the same logical evidence may safely return the existing
record.

The same idempotency key must not be accepted for materially different
content.

An idempotency collision with different material content fails closed.

Idempotency must not mutate historical evidence.

## 9. Append-only evidence history

Evidence history is append-only.

New evidence must not silently erase or rewrite prior evidence.

A newer record may reference an older record through
`Supersedes Evidence ID`.

Supersession does not delete the older evidence record.

"Latest" is a read-selection concept over durable history.

## 10. Exact future write API contracts

The exact future API contract names are:

- `appendDealArvEvidence(record)`
- `appendDealRepairScopeEvidence(record)`
- `appendDealOfferReadinessEvidence(record)`

These APIs are not implemented by this design.

The future writers must validate schema, identity, evidence IDs,
idempotency, material evidence structure, provenance, and supersession.

They must append immutable evidence or return an exact idempotent existing
record.

They must not manufacture evidence.

`appendDealArvEvidence(record)` must not calculate ARV.

`appendDealRepairScopeEvidence(record)` must not infer adequate scope from a
scalar repair number.

`appendDealOfferReadinessEvidence(record)` must not independently decide
readiness and must not advance a workflow.

## 11. Exact future read API contracts

The exact future API contract names are:

- `getDealArvEvidenceById(evidenceId)`
- `getDealRepairScopeEvidenceById(evidenceId)`
- `getDealOfferReadinessEvidenceById(evidenceId)`
- `getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)`
- `getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)`
- `getCurrentDealOfferReadinessEvidence(dealId, canonicalPropertyKey, asOf)`

These APIs are not implemented by this design.

## 12. Current-evidence selection

A `getCurrent...` operation selects from durable evidence history.

It must not infer current evidence from legacy scalar fields.

Selection must:

1. require matching Deal ID;
2. require compatible canonical property identity when established;
3. exclude malformed records;
4. exclude records generated after the supplied `asOf`;
5. honor explicit supersession;
6. apply a separately certified staleness policy;
7. fail closed on unresolved contradictory current candidates;
8. return no readiness-positive evidence when identity cannot be established.

The supplied `asOf` must be explicit.

The read contract must not depend on an implicit wall clock.

The exact production staleness duration is intentionally not invented here.

## 13. Canonical identity binding

Deal identity and property identity are independent safeguards.

A matching Deal ID does not authorize ignoring a contradictory canonical
property key.

When an established canonical property key exists, ARV evidence, repair
evidence, and readiness evidence must match it.

Identity mismatch fails closed.

Missing identity must never be converted into matching identity.

No canonical identity repair authority is granted.

## 14. Exact readiness-gate bridge mapping

The persisted ARV mapping is:

- `Deal ID` -> `arvEvidence.dealId`
- `Evidence Status` -> `arvEvidence.evidenceStatus`
- `Confidence Status` -> `arvEvidence.confidenceStatus`
- `Estimated ARV` -> `arvEvidence.estimatedArv`
- accepted comparable IDs -> `arvEvidence.acceptedComparableEvidenceIds`
- `Accepted Comparable Count` -> `arvEvidence.acceptedComparableCount`
- `Minimum Comparable Count` -> `arvEvidence.minimumComparableCount`
- `Review Required` -> `arvEvidence.reviewRequired`

The persisted repair mapping is:

- `Deal ID` -> `repairScope.dealId`
- `Scope Status` -> `repairScope.scopeStatus`
- `Scope Complete` -> `repairScope.scopeComplete`
- `Estimated Repair Cost` -> `repairScope.estimatedRepairCost`
- `Review Required` -> `repairScope.reviewRequired`

The bridge must independently verify canonical identity before invoking the
readiness gate.

No missing field may be synthesized merely to make the gate pass.

## 15. Readiness evaluation sequence

The future production sequence is:

1. resolve the target Deal ID;
2. resolve established canonical property identity where available;
3. read current ARV evidence using an explicit `asOf`;
4. read current repair-scope evidence using the same explicit `asOf`;
5. fail closed if either evidence record is absent or invalid;
6. verify Deal ID and canonical identity;
7. map durable evidence into the certified readiness gate;
8. evaluate readiness;
9. optionally persist readiness evidence through the certified writer;
10. return the evaluation result.

An `eligible` result is evidence, not workflow authority.

A separate integration phase must govern any future workflow progression.

## 16. Partial-write safety

ARV evidence, repair evidence, and readiness evidence are independent durable
records.

Failure to persist readiness evidence must not mutate its underlying ARV or
repair evidence.

Failure to persist one evidence type must not manufacture another.

A partially completed multi-record operation remains auditable and fails
closed.

## 17. Contradictory evidence

Different evidence records for the same deal may coexist historically.

If multiple non-superseded candidates are simultaneously current and their
material readiness semantics contradict each other, current-evidence
selection fails closed until a separately certified resolution policy
identifies authoritative evidence.

The implementation must not select the readiness-positive record merely
because it permits progression.

## 18. Versioning

All three surfaces contain `Schema Version`.

Readers must explicitly support the schema version they consume.

Unknown schema versions fail closed.

Readiness evidence additionally stores `Gate Version`.

Schema migration requires separate design and certification.

No migration is authorized here.

## 19. Timestamp semantics

`Evidence Generated At`, `Evaluated At`, and `Persisted At` have distinct
meanings.

Persistence must not rewrite an evidence-generation timestamp merely to equal
persistence time.

Future reads use an explicit `asOf`.

## 20. Provenance and auditability

ARV and repair evidence preserve source engine, source engine version, and
provenance.

Readiness evidence preserves the exact ARV and repair evidence IDs used.

The evidence chain must support reconstruction of the evidence, versions,
generation time, persistence time, gate version, and readiness reasons.

## 21. Legacy compatibility

Existing `DEAL_COMPARABLES`, Comparable Analysis, ARV, Repair Cost, rehab,
MAO, and workflow fields remain compatibility surfaces.

They are not substitutes for certified readiness evidence.

Future migration or backfill from legacy values requires a separate design
and must not manufacture missing evidence.

## 22. Database integration boundary

A future implementation may integrate these evidence surfaces with the
existing REOS database abstraction only in a separately reviewed phase.

That phase must identify exact production files, header registration,
append/read semantics, idempotency handling, error behavior, audit logging,
fixtures, validators, and migration requirements.

This design does not modify `Database.js`.

## 23. Observability

Future persistence outcomes must be equivalent to:

- `appended`
- `idempotent_existing`
- `rejected_validation`
- `rejected_identity`
- `rejected_idempotency_conflict`
- `failed_persistence`

Future current-evidence read outcomes must be equivalent to:

- `selected`
- `not_found`
- `stale`
- `identity_mismatch`
- `contradictory`
- `unsupported_version`
- `malformed`

No readiness-positive fallback is permitted for an error outcome.

## 24. Explicit non-authority

This design does not authorize provider selection, credentials,
authentication, external HTTP, MLS access, scraping, browser automation,
geocoding, live comparable retrieval, production comparable acceptance,
production comparable persistence, production ARV calculation, production
ARV persistence, production repair-scope creation or persistence, production
readiness persistence, MAO calculation, offer generation, offer submission,
Qualified Deal Queue progression, acquisition lifecycle progression,
canonical identity repair, migration, deployment, RPC, scheduler changes,
trigger changes, probate mutation, code-violation mutation, or absentee-owner
mutation.

## 25. Successor implementation boundary

The next implementation phase may build only an offline persistence model and
fixtures unless separately authorized.

Before production persistence, the successor must prove:

1. exact schema validation;
2. immutable evidence IDs;
3. retry-safe idempotency;
4. append-only history;
5. supersession behavior;
6. explicit-asOf reads;
7. identity mismatch failure;
8. contradictory-current-evidence failure;
9. unknown-version failure;
10. exact readiness-gate mapping;
11. no inference from legacy scalar fields;
12. no evidence manufacturing;
13. no workflow progression authority.

## 26. Acquisition safety invariant

Adequate comp-supported ARV evidence plus adequate repair scope may become
eligible for a later separately authorized workflow decision.

Missing or weak comp evidence routes to research/review.

Missing or inadequate repair scope routes to research/review.

Neither an ARV number nor a repair number alone grants MAO or offer authority.

An `eligible` readiness result is evidence, not workflow authority.

No automatic MAO or offer authority is granted by this design.
