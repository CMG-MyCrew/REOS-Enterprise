# Production Comps Readiness Evidence Persistence Bridge Contract v1

## 1. Purpose

This contract defines the production persistence boundary required to carry
certified comparable-supported ARV evidence and adequate repair-scope evidence
into the existing comps workflow readiness gate.

This contract is design-only.

It does not create a production table, schema, adapter, provider connection,
workflow mutation, persistence operation, ARV calculation, repair-scope
calculation, MAO calculation, offer, deployment, RPC, or production authority.

## 2. Architectural position

The certified evidence flow is:

provider evidence
→ provider adapter
→ normalized comparable evidence
→ comparable acceptance
→ ARV evidence
→ durable readiness evidence
→ readiness-gate input
→ workflow eligibility evaluation

Repair evidence enters independently:

repair-scope evidence
→ durable readiness evidence
→ readiness-gate input
→ workflow eligibility evaluation

The two evidence branches remain independent until the readiness gate.

The persistence bridge must not become a second comparable acceptance engine,
ARV engine, repair estimator, MAO engine, or offer engine.

## 3. Existing compatibility surfaces

Existing production surfaces such as DEAL_COMPARABLES, legacy comparable
analysis, ARV, Repair Cost, rehab values, MAO, and existing deal fields remain
compatibility surfaces.

They are not, by themselves, certified readiness evidence.

No destructive migration of those existing surfaces is authorized by this
contract.

## 4. Fundamental non-inference rule

The bridge must never manufacture evidence.

In particular:

- a legacy ARV number does not establish supported ARV evidence;
- DEAL_COMPARABLES row presence does not establish accepted comparable evidence;
- comparable count alone does not establish ARV confidence;
- a legacy Repair Cost or rehab number does not establish an adequate repair scope;
- a positive MAO does not establish either evidence branch;
- an existing workflow stage does not establish readiness;
- missing evidence does not become matching or sufficient evidence.

Unknown remains unknown.

Insufficient remains insufficient.

Review-required remains review-required.

## 5. Durable ARV evidence record

A durable ARV readiness-evidence record must preserve, at minimum:

- schema version;
- evidence record ID;
- Deal ID;
- subject canonical property key when available;
- ARV evidence status;
- ARV confidence status;
- estimated ARV only when supported by the evidence contract;
- accepted comparable evidence IDs;
- accepted comparable count;
- declared minimum comparable count;
- valuation method;
- valuation inputs required for auditability;
- low supported value when available;
- high supported value when available;
- review-required state;
- reason codes;
- evidence-generation timestamp;
- persistence timestamp;
- source engine/version;
- provenance sufficient to trace the record back to its evidence inputs.

The durable representation must preserve the distinction among:

- supported;
- review_required;
- insufficient.

Persistence must not coerce review_required or insufficient into supported.

## 6. Accepted comparable traceability

Every accepted comparable used to support ARV must remain traceable by a stable
comparable evidence identifier.

A persisted ARV value without traceable accepted comparable evidence IDs is not
sufficient readiness evidence.

DEAL_COMPARABLES row count is not a substitute for accepted comparable evidence
identity.

## 7. Durable repair-scope evidence record

A durable repair readiness-evidence record must preserve, at minimum:

- schema version;
- evidence record ID;
- Deal ID;
- subject canonical property key when available;
- repair scope status;
- scope completeness;
- estimated repair cost;
- review-required state;
- reason codes;
- evidence-generation timestamp;
- persistence timestamp;
- source engine/version or source process;
- provenance sufficient to trace the estimate to the underlying scope evidence.

The durable representation must preserve the distinction among at least:

- adequate;
- review_required;
- insufficient or incomplete.

A repair estimate without adequate scope evidence is not readiness authority.

## 8. Deal identity binding

Every persisted readiness-evidence record must be bound to the Deal ID for which
it was produced.

Where a canonical property key is available, it should also be retained as
supporting identity evidence.

Evidence for one deal must never satisfy another deal's readiness gate.

Identity mismatch fails closed.

## 9. Versioning

Persisted evidence must identify its schema version.

Evidence-producing engines or processes must expose enough version information
to determine which contract produced a persisted record.

Future schema evolution must not silently reinterpret old evidence.

## 10. Timestamps and staleness

Evidence-generation time and persistence time are separate concepts and should
remain distinguishable.

The persistence bridge must retain timestamps needed for future staleness
policy.

This contract does not define a production staleness threshold.

Absence of a defined staleness threshold does not authorize treating stale
evidence as current.

## 11. Persistence model

The preferred production design is an additive, evidence-oriented persistence
surface rather than overloading legacy scalar fields.

The implementation phase must determine whether the safest concrete form is:

- dedicated ARV and repair evidence tables; or
- one versioned readiness-evidence table with explicitly separated ARV and
  repair evidence branches.

Whichever representation is selected must preserve the full evidence semantics
required by this contract.

The implementation must not store only a final boolean such as ready=true.

## 12. Append-only evidence history

New evidence should not silently erase prior evidence.

The persistence design should preserve an auditable history or immutable
evidence identity so that a later evaluation can identify exactly which
evidence version it consumed.

A latest-evidence lookup may exist, but latest is a selection rule over durable
history rather than permission to destroy historical evidence.

## 13. Idempotency

Repeated persistence of the same logical evidence must be safely detectable.

The implementation design must define a deterministic or otherwise stable
evidence identity/idempotency mechanism.

Retries must not manufacture multiple conflicting readiness records that appear
to be independent evidence.

## 14. Readiness bridge output

The bridge may transform persisted evidence into the provider-neutral input
shape expected by the certified readiness gate.

The ARV branch must provide the semantics required for:

- evidenceStatus;
- confidenceStatus;
- estimatedArv;
- acceptedComparableEvidenceIds;
- acceptedComparableCount;
- minimumComparableCount;
- Deal ID;
- reviewRequired.

The repair branch must provide the semantics required for:

- scopeStatus;
- estimatedRepairCost;
- Deal ID;
- scopeComplete;
- reviewRequired.

Field naming in the durable schema may differ only if the bridge performs an
explicit deterministic mapping.

## 15. Combined readiness rule

The production readiness predicate remains:

comp-supported ARV ready
AND
adequate repair scope ready.

Neither branch may substitute for the other.

A persisted readiness record does not itself authorize Offer Generation.

The certified readiness-gate result remains an eligibility evaluation, not an
execution authority.

## 16. Fail-closed behavior

The bridge must return blocked or unavailable evidence when required data is:

- missing;
- malformed;
- unknown;
- unsupported;
- insufficient;
- review-required;
- contradictory;
- identity-mismatched;
- version-incompatible;
- otherwise untrusted.

The bridge must not fall back to legacy ARV, comparable count, Repair Cost,
rehab budget, MAO, or workflow stage to convert failure into readiness.

## 17. Transaction and partial-write safety

The implementation design must explicitly address partial persistence.

An ARV evidence write must not imply repair evidence exists.

A repair evidence write must not imply ARV evidence exists.

Failure while persisting one evidence branch must not manufacture a combined
ready state.

The readiness gate must evaluate the evidence actually persisted and available,
not an assumed transaction outcome.

## 18. Read/write authority separation

The implementation must distinguish:

- authority to persist normalized/accepted comparable evidence;
- authority to persist ARV evidence;
- authority to persist repair-scope evidence;
- authority to read readiness evidence;
- authority to evaluate readiness;
- authority to mutate workflow stage;
- authority to calculate MAO;
- authority to generate an offer;
- authority to submit an offer.

No authority above implies another.

## 19. Production workflow integration boundary

AcquisitionWorkflow.js and DealLifecycleWorkflow.js currently fail closed
against legacy evidence-only progression.

That behavior must remain in place until a separately certified implementation
can supply valid persisted evidence to the readiness gate.

The persistence bridge implementation must not restore:

- comparable-presence-only progression;
- raw ARV-only progression;
- comparable-count-only progression;
- MAO-only progression;
- repair-number-only progression.

## 20. Provider neutrality

The persistence representation must remain provider-neutral.

Provider-specific field names, authentication data, request metadata, and raw
provider control flow must not become readiness-gate dependencies.

Provider provenance may be retained as evidence metadata without leaking
provider-specific schema into the readiness predicate.

## 21. Security and sensitive data

Credentials, tokens, authentication headers, provider secrets, and unrelated
personal data must not be stored in readiness evidence.

Evidence records should retain only information necessary for provenance,
auditability, identity, valuation support, repair support, and readiness
evaluation.

## 22. Observability

A production implementation must make blocked readiness explainable.

It must be possible to determine:

- which ARV evidence record was selected;
- which repair evidence record was selected;
- which accepted comparable evidence IDs supported ARV;
- which status/confidence/completeness values were evaluated;
- which reason codes caused blocking;
- which schema/engine versions produced the evidence.

## 23. Compatibility requirements

The implementation must preserve existing certified county-runtime integration.

It must not silently alter probate, code-violation, absentee-owner, scheduler,
trigger, Qualified Deal Queue, or unrelated acquisition behavior.

Any production-file modification must be explicitly accounted for by applicable
repository integration validators.

## 24. Implementation-phase requirements

Before production implementation is authorized, the successor phase must define:

1. exact persistence table/surface names;
2. exact headers/schema;
3. exact evidence IDs and idempotency rules;
4. exact write API;
5. exact read/latest-selection API;
6. exact ARV evidence mapping;
7. exact repair evidence mapping;
8. exact readiness-gate bridge mapping;
9. exact stale/version/identity failure behavior;
10. exact migration/compatibility behavior;
11. exact validator fixtures;
12. exact production files allowed to change.

The implementation phase must remain offline until separately authorized.

## 25. Explicit non-authority

This contract does not authorize:

- provider selection;
- provider credentials;
- external HTTP;
- scraping;
- MLS access;
- geocoding;
- live comparable retrieval;
- production comparable acceptance;
- comparable persistence;
- production ARV calculation;
- ARV persistence;
- repair-scope mutation or persistence;
- MAO calculation;
- offer generation;
- offer submission;
- production workflow progression;
- Qualified Deal Queue mutation;
- acquisition lifecycle mutation;
- Apps Script push/version/deployment;
- RPC;
- scheduler mutation;
- trigger mutation;
- probate mutation;
- code-violation mutation;
- absentee-owner mutation.

## 26. Acquisition safety invariant

Automatic MAO or offer authority remains blocked unless both:

1. adequate comp-supported ARV evidence exists; and
2. adequate repair-scope evidence exists.

Missing or weak evidence must route the deal to research/review rather than
automatic offer generation.

## 27. Successor sequence

After this design contract is merged, the expected sequence is:

1. exact production persistence schema/API design;
2. offline persistence model implementation;
3. offline readiness bridge implementation;
4. workflow integration design;
5. bounded production persistence design;
6. single-record production-read certification;
7. bounded single-record evidence persistence;
8. production-readiness certification.

No phase automatically authorizes the next.
