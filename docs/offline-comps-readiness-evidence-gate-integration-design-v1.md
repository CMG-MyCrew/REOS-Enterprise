# Offline Comps Readiness Evidence Gate Integration Design v1

## Status

Design-only integration contract.

This design does not authorize a production RPC.
This design does not authorize production persistence.
This design does not authorize production source wiring.
This design does not authorize lifecycle advancement.
This design does not authorize Qualified Deal Queue mutation.
This design does not authorize MAO calculation.
This design does not authorize offer generation.
This design does not authorize offer submission.
This design does not authorize automatic offer authority.

## Purpose

Define the smallest fail-closed boundary between the certified offline comps
readiness evidence gate mapper and the existing hardened REOS acquisition
readiness gate.

This phase designs that boundary only.

It does not wire the mapper into production.

## Existing gate invariant

The existing hardened gate remains:

    compSupportedArvReady === true
    AND
    repairScopeReady === true

No other combination is positive.

Evidence-layer eligibility is not lifecycle authority, MAO authority, offer
generation authority, offer submission authority, or automatic offer
authority.

## Integration stages

The future integration must preserve four separate stages:

1. Select persisted ARV and repair evidence.
2. Evaluate the certified readiness mapper.
3. Project the mapper result into the existing readiness boundary.
4. Allow the existing hardened gate to independently evaluate readiness.

No stage may silently perform another stage's responsibility.

## Evidence selection boundary

Only the certified current-evidence reads may supply inputs:

    getCurrentDealArvEvidence(dealId, canonicalPropertyKey, asOf)
    getCurrentDealRepairScopeEvidence(dealId, canonicalPropertyKey, asOf)

Both reads must use the same explicit:

    dealId
    canonicalPropertyKey
    asOf

Implicit wall-clock selection is prohibited.

Only `selected` may supply evidence.

These outcomes fail closed:

    not_found
    stale
    identity_mismatch
    contradictory
    unsupported_version
    malformed

## Mapper boundary

The future integration must use semantics equivalent to:

    evaluateOfflineCompsReadiness({
      dealId,
      canonicalPropertyKey,
      asOf,
      arvReadResult,
      repairReadResult
    })

The mapper remains evidence evaluation only.

The mapper must not mutate production state.

## Readiness projection

Only these evidence-derived mapper fields may cross into the readiness
projection:

    decision
    compSupportedArvReady
    repairScopeReady
    reasonCodes
    arvEvidenceId
    repairScopeEvidenceId
    dealId
    canonicalPropertyKey
    asOf
    evaluatedAt
    gateVersion

Positive readiness requires exact booleans.

Truthy values, strings, numbers, null, undefined, missing values, or inferred
legacy values may not substitute for boolean `true`.

## Identity binding

The integration must preserve exact identity across:

    requested Deal ID
    requested Canonical Property Key
    ARV evidence Deal ID
    ARV evidence Canonical Property Key
    repair evidence Deal ID
    repair evidence Canonical Property Key
    mapper result Deal ID
    mapper result Canonical Property Key
    ARV Evidence ID
    Repair Scope Evidence ID

Any cross-surface mismatch fails closed.

No identity repair authority is granted.

## Temporal binding

The same explicit `asOf` must bind:

    ARV evidence selection
    repair evidence selection
    mapper evaluation
    readiness projection

The integration must not replace `asOf` with current time.

Evidence from incompatible temporal contexts must not be combined.

## Evidence reference binding

The readiness projection must preserve the exact:

    ARV Evidence ID
    Repair Scope Evidence ID

used during evaluation.

Changing either evidence reference requires complete re-selection and
re-evaluation.

## Truth table

    compSupportedArvReady=false, repairScopeReady=false -> blocked
    compSupportedArvReady=false, repairScopeReady=true  -> blocked
    compSupportedArvReady=true,  repairScopeReady=false -> blocked
    compSupportedArvReady=true,  repairScopeReady=true  -> eligible

`eligible` is evidence-layer readiness only.

It does not authorize an offer.

## Fail-closed behavior

The future integration must block when required evidence or mapper output is:

- missing
- unavailable
- malformed
- stale
- contradictory
- unsupported
- identity mismatched
- temporally incompatible
- review-required
- incomplete
- ambiguous

Unexpected mapper output must fail closed.

Mapper exceptions must fail closed.

Unknown gate versions must fail closed.

Unknown reason codes must not grant positive authority.

## Legacy inference prohibition

Positive readiness must not be inferred from:

    DEAL_COMPARABLES row presence
    comparable count alone
    legacy Comparable Analysis ARV
    deal-level ARV scalar
    rehab budget
    repair-cost scalar
    workflow stage
    previous Offer Generation state
    acquisition score
    task completion
    owner evidence
    absentee-owner evidence
    probate evidence
    code-violation evidence

Certified evidence may not be replaced by legacy scalar state.

## Proposed offline adapter

A future pure offline adapter may expose semantics equivalent to:

    integrateOfflineCompsReadinessEvidence({
      dealId,
      canonicalPropertyKey,
      asOf,
      arvReadResult,
      repairReadResult
    })

Its output must preserve all false production authority flags.

This proposed adapter is not production authorization.

## Existing production source boundary

Production wiring is a separate future certification phase.

This design does not authorize editing:

    build/apps-script-brand/DealAnalyzer.js
    build/apps-script-brand/DealLifecycleWorkflow.js
    build/apps-script-brand/AcquisitionWorkflow.js
    build/apps-script-brand/AcquisitionQuality.js
    build/apps-script-brand/AcquisitionTaskEngine.js
    build/apps-script-brand/DealAnalyzerInputUI.js
    build/apps-script-brand/Investments.js
    build/apps-script-brand/Database.js

A future production-wiring phase must first identify the exact existing call
site and prove that the hardened readiness gate remains authoritative.

## Side-effect boundary

The future offline adapter must remain pure.

No spreadsheet operations are authorized.

No HTTP/provider operations are authorized.

No Drive operations are authorized.

No JDBC operations are authorized.

No Gmail operations are authorized.

No trigger operations are authorized.

No clasp operations are authorized.

No deployment operations are authorized.

No RPC operations are authorized.

## Authority matrix

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

## Future implementation certification

A future offline integration implementation must prove:

- exact certified mapper dependency used
- explicit asOf preserved
- exact Deal ID preserved
- exact Canonical Property Key preserved
- exact evidence IDs preserved
- all non-selected outcomes blocked
- all four truth-table cases certified
- unexpected mapper output blocked
- exceptions blocked
- legacy scalar inference absent
- production I/O absent
- workflow mutation absent
- MAO calculation absent
- offer generation absent
- offer submission absent
- all production authority flags false
