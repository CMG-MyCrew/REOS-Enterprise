# Production Comps Readiness Evidence Persistence Implementation Prerequisite Design v1

## 1. Purpose

This design defines the prerequisite production persistence implementation required
before the certified comps-readiness evidence mapper and integration adapter may
be wired into the REOS production acquisition workflow.

The exact-call-site extraction established that production currently implements
none of the six certified evidence APIs and contains no production consumer of
the certified readiness-gate function or its explicit readiness output symbols.

Therefore production readiness-gate wiring is not authorized yet.

This phase is design-only.

It does not authorize production persistence, production RPC execution,
Google Sheets mutation, provider execution, ARV calculation, repair-scope
mutation, readiness persistence, Qualified Deal Queue mutation, acquisition
lifecycle advancement, MAO calculation, offer generation, or offer submission.

## 2. Certified prerequisite finding

At the certified base, the following production APIs are absent:

- `appendDealArvEvidence(record)`
- `appendDealRepairScopeEvidence(record)`
- `appendDealOfferReadinessEvidence(record)`
- `getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)`
- `getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)`
- `getCurrentDealOfferReadinessEvidence(dealId, canonicalPropertyKey, asOf)`

Production evidence API implemented count is zero.

The certified readiness-gate function is not referenced by production.

The certified readiness symbols `compSupportedArvReady` and
`repairScopeReady` are not production integration surfaces at the certified
base.

Consequently the persistence implementation is a prerequisite to production
readiness wiring.

## 3. Existing certified evidence surfaces

The implementation must preserve the three previously certified durable
evidence surfaces:

1. `DEAL_ARV_EVIDENCE`
2. `DEAL_REPAIR_SCOPE_EVIDENCE`
3. `DEAL_OFFER_READINESS_EVIDENCE`

No legacy deal, comparable, workflow, offer, MAO, or repair field may substitute
for one of these evidence surfaces.

## 4. ARV evidence schema

The production implementation must preserve exactly these ARV evidence fields:

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

ARV evidence IDs use the stable prefix `ARVE-`.

## 5. Repair-scope evidence schema

The production implementation must preserve exactly these repair-scope fields:

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

Repair-scope evidence IDs use the stable prefix `RSE-`.

## 6. Offer-readiness evidence schema

The production implementation must preserve exactly these readiness fields:

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

Readiness evidence IDs use the stable prefix `ORE-`.

A persisted readiness row is evidence only. It is not workflow authority.

## 7. Exact production write API

A future separately authorized implementation must provide exactly:

- `appendDealArvEvidence(record)`
- `appendDealRepairScopeEvidence(record)`
- `appendDealOfferReadinessEvidence(record)`

The append APIs must validate before persistence.

They must not calculate ARV, manufacture repair scope, evaluate a provider,
advance a workflow, calculate MAO, generate an offer, or submit an offer.

## 8. Exact production read API

A future separately authorized implementation must provide exactly:

- `getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)`
- `getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)`
- `getCurrentDealOfferReadinessEvidence(dealId, canonicalPropertyKey, asOf)`

Every current-evidence read requires the same explicit:

- Deal ID;
- canonical property key;
- `asOf`.

Implicit wall-clock selection is prohibited.

## 9. Read outcomes

The production implementation must preserve these certified read outcomes:

- `selected`
- `not_found`
- `stale`
- `identity_mismatch`
- `contradictory`
- `unsupported_version`
- `malformed`

Only `selected` may supply evidence to readiness mapping.

Every other outcome fails closed.

## 10. Append outcomes

The production implementation must preserve these certified append outcomes:

- `appended`
- `idempotent_existing`
- `rejected_validation`
- `rejected_identity`
- `rejected_idempotency_conflict`
- `failed_persistence`

A failed or rejected append must not be converted into successful evidence.

## 11. Identity binding

Every evidence record must remain bound to its exact:

- Deal ID;
- canonical property key.

Evidence for one deal must never satisfy another deal.

Evidence for one canonical property identity must never satisfy a different
property identity.

Missing identity must never be repaired by inference.

Identity mismatch fails closed.

## 12. Explicit temporal selection

Current-evidence reads must use the caller-supplied explicit `asOf`.

Records generated or persisted after the permitted temporal boundary must not
be silently selected as current evidence.

The implementation must not use an implicit `new Date()` as the semantic
selection authority for current-evidence reads.

Persistence timestamps may be recorded when a separately authorized write is
executed, but persistence time and semantic selection time remain distinct.

## 13. Supersession

The implementation must honor `Supersedes Evidence ID`.

A superseded record must not remain independently current when a valid
successor governs the same exact evidence identity.

Malformed, contradictory, circular, ambiguous, or identity-incompatible
supersession fails closed.

The implementation must not resolve contradictory current candidates by
choosing whichever candidate produces a readiness-positive result.

## 14. Idempotency

Every append operation must enforce its supplied `Idempotency Key`.

An exact retry may return `idempotent_existing`.

The same idempotency key with materially different evidence must return
`rejected_idempotency_conflict`.

Retries must not manufacture multiple apparently current evidence records.

## 15. Unknown versions

Unknown or unsupported schema versions fail closed.

Unknown or unsupported gate versions fail closed.

No compatibility inference may convert an unknown version into readiness.

## 16. Review-required evidence

Evidence marked for human review is not readiness-positive evidence.

The persistence layer must preserve review status and reason codes without
promoting the evidence.

## 17. Storage implementation boundary

A future implementation may use the existing REOS database abstraction and
Google Sheets-backed persistence only after that implementation phase is
separately authorized.

The implementation must use additive evidence surfaces.

It must not reinterpret or overwrite legacy deal fields as certified evidence.

It must not use legacy scalar ARV, rehab budget, repair estimate, comparable
count, workflow stage, previous offer state, or manually populated numeric
values to manufacture evidence.

## 18. Production implementation placement

The future implementation must first reconcile the existing
`build/apps-script-brand/Database.js` abstraction and repository storage
conventions.

The implementation should introduce one bounded production evidence persistence
module or an equivalently isolated additive surface.

It must not spread evidence-selection semantics independently across
`DealAnalyzer.js`, `DealLifecycleWorkflow.js`, `AcquisitionWorkflow.js`,
`AcquisitionQuality.js`, `AcquisitionTaskEngine.js`,
`DealAnalyzerInputUI.js`, or `Investments.js`.

Those workflow consumers remain outside the persistence implementation phase.

## 19. Persistence module responsibility

The future persistence module is responsible only for:

- evidence-record validation;
- exact schema preservation;
- stable evidence identity;
- idempotent append semantics;
- exact Deal ID and canonical property identity binding;
- supersession handling;
- explicit-asOf current-record selection;
- deterministic read outcomes;
- deterministic append outcomes;
- fail-closed malformed and contradictory evidence handling.

It is not responsible for:

- retrieving live comparable sales;
- accepting comparable evidence;
- calculating ARV;
- creating repair scope;
- evaluating readiness;
- changing lifecycle stage;
- changing Qualified Deal Queue state;
- calculating MAO;
- generating offers;
- submitting offers.

## 20. Certified mapper boundary

The production persistence implementation must not independently reproduce or
replace the certified mapper.

After a future persistence implementation is separately merged and certified,
the later production wiring phase may pass only certified current-read results
into the certified mapper/integration adapter.

Persistence must not convert its own storage state directly into Offer
Generation authority.

## 21. Certified readiness invariant

The production readiness invariant remains exactly:

`compSupportedArvReady === true`

AND

`repairScopeReady === true`

No persistence operation independently establishes either condition.

No evidence row independently grants workflow authority.

Even a future readiness decision of `eligible` remains evidence-layer
eligibility and does not independently authorize MAO, Offer Generation, offer
submission, Qualified Deal Queue advancement, or acquisition lifecycle
advancement.

## 22. Failure behavior

The production persistence implementation must fail closed on:

- missing evidence;
- malformed evidence;
- unsupported schema version;
- unsupported gate version;
- identity mismatch;
- stale evidence;
- contradictory evidence;
- ambiguous current evidence;
- invalid supersession;
- idempotency conflict;
- incomplete repair scope;
- review-required evidence;
- unavailable persistence;
- persistence exceptions.

There is no readiness-positive fallback.

## 23. Implementation sequencing

The safe sequence is:

1. certify this prerequisite design;
2. implement the isolated production persistence module in a separate phase;
3. certify schema, identity, idempotency, supersession, temporal selection, and
   fail-closed behavior offline;
4. separately authorize bounded production persistence verification;
5. certify the six production evidence APIs;
6. only then design the new production readiness-gate consumer wiring;
7. implement that wiring in a separate bounded phase;
8. preserve the existing hardened workflow gate;
9. separately certify any production execution.

Production gate wiring must remain blocked while the six production evidence
APIs are absent.

## 24. Explicit non-authorization

This design does not authorize a production RPC.

This design does not authorize a Google Sheets read or write.

This design does not authorize production persistence.

This design does not authorize provider requests.

This design does not authorize live comparable retrieval.

This design does not authorize production ARV calculation.

This design does not authorize repair-scope mutation.

This design does not authorize readiness persistence.

This design does not authorize Qualified Deal Queue mutation.

This design does not authorize acquisition lifecycle mutation.

This design does not authorize MAO calculation.

This design does not authorize Offer Generation.

This design does not authorize offer submission.

This design does not authorize deployment.

This design does not authorize trigger changes.

## 25. Authority flags

The following remain false:

`productionPersistenceAuthorityGranted = false`

`productionComparableAcceptanceAuthorityGranted = false`

`productionArvAuthorityGranted = false`

`repairScopeAuthorityGranted = false`

`qualifiedDealQueueAuthorityGranted = false`

`acquisitionLifecycleAuthorityGranted = false`

`maoAuthorityGranted = false`

`offerGenerationAuthorityGranted = false`

`offerSubmissionAuthorityGranted = false`

`automaticOfferAuthorityGranted = false`

## 26. Successor authorization boundary

Successful certification of this design authorizes only the next bounded
source-edit phase:

`implement_offline_certifiable_production_comps_readiness_evidence_persistence_module_v1`

That successor may implement the persistence module and its tests, but must
still keep live production persistence, RPC execution, workflow mutation, MAO,
Offer Generation, offer submission, deployment, and trigger changes
unauthorized until separately certified.
