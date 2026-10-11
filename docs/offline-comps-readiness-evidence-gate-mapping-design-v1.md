# Offline Comps Readiness Evidence Gate Mapping Design v1

## Purpose

This design defines the exact offline mapping from persisted ARV evidence and
persisted repair-scope evidence into the existing hardened comps workflow
readiness gate.

This design is offline and design-only.

It does not authorize production persistence, production comparable
acceptance, production ARV calculation, repair-scope mutation, acquisition
workflow progression, MAO calculation, offer generation, or offer submission.

## Existing readiness gate

The existing hardened readiness gate remains authoritative:

    compSupportedArvReady === true
    AND
    repairScopeReady === true

Both conditions must be true.

Every other combination is blocked.

This design does not replace, bypass, weaken, or create a competing readiness
gate.

## Evidence selection

ARV evidence must be selected through:

    getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)

Repair-scope evidence must be selected through:

    getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)

Both selectors must receive the same explicit:

    dealId
    canonicalPropertyKey
    asOf

No implicit wall clock is permitted.

Only the read outcome `selected` may supply evidence to readiness mapping.

These outcomes fail closed:

    not_found
    stale
    identity_mismatch
    contradictory
    unsupported_version
    malformed

A non-selected ARV result forces:

    compSupportedArvReady = false

A non-selected repair-scope result forces:

    repairScopeReady = false

## Exact ARV field mapping

| Persisted field | Gate input |
| --- | --- |
| `Deal ID` | `arvEvidence.dealId` |
| `Evidence Status` | `arvEvidence.evidenceStatus` |
| `Confidence Status` | `arvEvidence.confidenceStatus` |
| `Estimated ARV` | `arvEvidence.estimatedArv` |
| `Accepted Comparable Evidence IDs JSON` | `arvEvidence.acceptedComparableEvidenceIds` |
| `Accepted Comparable Count` | `arvEvidence.acceptedComparableCount` |
| `Minimum Comparable Count` | `arvEvidence.minimumComparableCount` |
| `Review Required` | `arvEvidence.reviewRequired` |

The mapper must independently verify:

    selected ARV Deal ID === requested Deal ID
    selected ARV Canonical Property Key === requested Canonical Property Key

Missing identity never becomes matching identity.

## Comp-supported ARV readiness

`compSupportedArvReady` may be true only when all required conditions hold:

1. ARV read outcome is `selected`.
2. Deal ID matches exactly.
3. Canonical Property Key matches exactly.
4. Evidence Status is the certified supported positive status.
5. Confidence Status is the certified sufficient positive status.
6. Estimated ARV is finite and positive.
7. Accepted comparable evidence IDs are present.
8. Accepted comparable count is finite.
9. Minimum comparable count is finite.
10. Accepted comparable count meets or exceeds minimum comparable count.
11. Review Required is exactly `false`.
12. Persistence, schema, version, and current-selection validation succeeded.

Failure of any required condition forces:

    compSupportedArvReady = false

Comparable presence alone is insufficient.
Comparable count alone is insufficient.
A legacy ARV scalar alone is insufficient.

## Exact repair-scope field mapping

| Persisted field | Gate input |
| --- | --- |
| `Deal ID` | `repairScope.dealId` |
| `Scope Status` | `repairScope.scopeStatus` |
| `Scope Complete` | `repairScope.scopeComplete` |
| `Estimated Repair Cost` | `repairScope.estimatedRepairCost` |
| `Review Required` | `repairScope.reviewRequired` |

The mapper must independently verify:

    selected repair Deal ID === requested Deal ID
    selected repair Canonical Property Key === requested Canonical Property Key

Missing identity never becomes matching identity.

## Repair-scope readiness

`repairScopeReady` may be true only when all required conditions hold:

1. Repair read outcome is `selected`.
2. Deal ID matches exactly.
3. Canonical Property Key matches exactly.
4. Scope Status is the certified adequate positive status.
5. Scope Complete is exactly `true`.
6. Estimated Repair Cost is finite and non-negative.
7. Review Required is exactly `false`.
8. Persistence, schema, version, and current-selection validation succeeded.

Failure of any required condition forces:

    repairScopeReady = false

A rehab budget alone is insufficient.
A repair-cost scalar alone is insufficient.
A placeholder repair value is insufficient.

## Cross-surface identity invariant

ARV evidence and repair-scope evidence used in one readiness evaluation must
refer to the same:

    Deal ID
    Canonical Property Key

Deal ID mismatch fails closed.
Canonical Property Key mismatch fails closed.
Missing identity fails closed.

No canonical-property identity repair is authorized.
No fuzzy address matching is authorized.

## Exact readiness truth table

| compSupportedArvReady | repairScopeReady | decision |
| --- | --- | --- |
| false | false | blocked |
| false | true | blocked |
| true | false | blocked |
| true | true | eligible |

There is no alternative readiness-positive path.

## Meaning of eligible

`eligible` means only that the evidence-layer readiness conjunction is
satisfied.

It does not:

- advance the acquisition lifecycle;
- mutate deal stage;
- enqueue the Qualified Deal Queue;
- calculate MAO;
- generate an offer;
- submit an offer;
- grant automatic offer authority.

## Readiness evidence reference binding

A future separately authorized readiness evidence record must bind the exact
evidence evaluated:

    Deal ID
    Canonical Property Key
    ARV Evidence ID
    Repair Scope Evidence ID
    Decision
    Comp Supported ARV Ready
    Repair Scope Ready
    Reason Codes JSON
    Evaluated At
    Gate Version

The ARV Evidence ID must identify the exact selected ARV evidence record used
in the evaluation.

The Repair Scope Evidence ID must identify the exact selected repair-scope
evidence record used in the evaluation.

Substituted, stale, contradictory, unsupported, malformed, missing, or
unevaluated evidence must not be referenced.

## Fail-closed conditions

Contradictory current evidence fails closed.

Unsupported evidence schema versions fail closed.

Unsupported readiness gate versions fail closed.

Human-review-required evidence must never be silently promoted to readiness.

Selected ARV evidence with Review Required = true forces:

    compSupportedArvReady = false

Selected repair-scope evidence with Review Required = true forces:

    repairScopeReady = false

## Deterministic reason codes

The successor offline mapper must support deterministic reasons including:

    ARV_EVIDENCE_NOT_FOUND
    ARV_EVIDENCE_STALE
    ARV_IDENTITY_MISMATCH
    ARV_EVIDENCE_CONTRADICTORY
    ARV_UNSUPPORTED_VERSION
    ARV_EVIDENCE_MALFORMED
    ARV_STATUS_NOT_SUPPORTED
    ARV_CONFIDENCE_NOT_SUFFICIENT
    ARV_VALUE_INVALID
    ARV_COMPARABLE_EVIDENCE_MISSING
    ARV_COMPARABLE_COUNT_INSUFFICIENT
    ARV_REVIEW_REQUIRED

    REPAIR_EVIDENCE_NOT_FOUND
    REPAIR_EVIDENCE_STALE
    REPAIR_IDENTITY_MISMATCH
    REPAIR_EVIDENCE_CONTRADICTORY
    REPAIR_UNSUPPORTED_VERSION
    REPAIR_EVIDENCE_MALFORMED
    REPAIR_SCOPE_NOT_ADEQUATE
    REPAIR_SCOPE_INCOMPLETE
    REPAIR_COST_INVALID
    REPAIR_REVIEW_REQUIRED

    CROSS_SURFACE_DEAL_ID_MISMATCH
    CROSS_SURFACE_PROPERTY_IDENTITY_MISMATCH

Multiple reasons may coexist.

Reason codes explain failure. They do not manufacture evidence.

## Legacy inference prohibition

Readiness-positive state must not be inferred from:

- `DEAL_COMPARABLES` row presence alone;
- comp count alone;
- legacy Comparable Analysis ARV alone;
- deal-level ARV scalar alone;
- rehab budget alone;
- repair-cost scalar alone;
- workflow stage;
- previous Offer Generation state;
- acquisition score;
- task completion;
- owner evidence;
- absentee-owner evidence;
- probate evidence;
- code-violation evidence.

## Evidence manufacturing prohibition

The mapper must not:

- create missing comparable evidence IDs;
- create a missing ARV;
- create a missing repair estimate;
- invent a repair scope;
- substitute evidence from another deal;
- substitute evidence from another property;
- repair canonical identity;
- convert stale evidence into current evidence;
- resolve contradictions by selecting a readiness-positive candidate;
- convert unsupported versions into supported versions.

## Partial evidence

These remain blocked:

    valid ARV + missing repair = blocked
    missing ARV + valid repair = blocked
    valid ARV + invalid repair = blocked
    invalid ARV + valid repair = blocked

Failure of one evidence surface must not mutate, delete, replace, or
manufacture the other.

## Production authority boundary

This design grants no production authority:

    productionPersistenceAuthorityGranted = false
    productionComparableAcceptanceAuthorityGranted = false
    productionArvAuthorityGranted = false
    repairScopeAuthorityGranted = false
    qualifiedDealQueueAuthorityGranted = false
    acquisitionLifecycleAuthorityGranted = false
    maoAuthorityGranted = false
    offerGenerationAuthorityGranted = false
    offerSubmissionAuthorityGranted = false
    automaticOfferAuthorityGranted = false

## Successor implementation boundary

The next phase may implement only an offline mapper and synthetic fixtures
unless separately authorized.

Before production integration, that offline implementation must prove:

1. exact ARV field mapping;
2. exact repair-scope field mapping;
3. explicit asOf selection;
4. Deal ID verification;
5. canonical-property identity verification;
6. cross-surface identity verification;
7. every non-selected outcome blocks;
8. unsupported versions block;
9. contradictions block;
10. review-required evidence blocks;
11. missing evidence blocks;
12. insufficient comparable evidence blocks;
13. inadequate repair evidence blocks;
14. exact four-case truth table;
15. exact evaluated-evidence ID binding;
16. deterministic reason codes;
17. no legacy scalar inference;
18. no evidence manufacturing;
19. eligible offline results cause no workflow mutation;
20. no MAO or offer authority is granted.

Production persistence, provider execution, workflow progression, deployment,
RPC execution, MAO calculation, offer generation, and offer submission remain
separately gated.
