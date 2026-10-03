# REOS Comps Workflow Readiness Gate Hardening v1

## Status

Offline readiness-gate contract and executable reference implementation.

This phase does not modify production acquisition workflows.

## Purpose

Define the exact fail-closed predicate that a later workflow integration
must use before a deal can become eligible to advance toward Offer
Generation.

The historical presence of comparable rows is not sufficient authority.

The existence of an ARV value by itself is not sufficient authority.

The existence of a repair estimate by itself is not sufficient authority.

## Required Offer-Readiness Predicate

Offer-generation readiness requires both independent evidence gates:

1. adequate comp-supported ARV; and
2. adequate repair scope.

Both gates must be affirmatively satisfied.

Unknown, missing, stale, contradictory, review-required, or insufficient
evidence fails closed.

## Comp-Supported ARV Gate

The ARV gate requires:

- ARV evidence status is supported;
- ARV confidence status is sufficient;
- estimated ARV is finite and greater than zero;
- accepted comparable evidence IDs are present;
- accepted comparable count satisfies the declared minimum;
- ARV evidence is traceable to the deal being evaluated;
- no ARV review-required condition remains unresolved.

A raw ARV number does not satisfy this gate.

Comparable row presence does not satisfy this gate.

`comps.length > 0` must never independently authorize Offer Generation.

## Repair-Scope Gate

The repair gate requires:

- repair scope status is adequate;
- repair estimate is finite and non-negative;
- repair evidence is traceable to the deal being evaluated;
- required repair-scope completeness is affirmatively satisfied;
- no repair review-required condition remains unresolved.

A repair number without adequate scope evidence does not satisfy this gate.

## Combined Gate

The combined result is eligible only when:

`compSupportedArvReady === true`
AND
`repairScopeReady === true`

Every other state is blocked.

## Result

The gate returns:

- `eligible`;
- `blocked`.

It also returns stable reason codes.

## Stable Reason Codes

- ARV_EVIDENCE_MISSING
- ARV_EVIDENCE_NOT_SUPPORTED
- ARV_CONFIDENCE_NOT_SUFFICIENT
- ARV_VALUE_MISSING_OR_INVALID
- ARV_COMPARABLE_IDS_MISSING
- ARV_COMPARABLE_COUNT_INSUFFICIENT
- ARV_DEAL_ID_MISMATCH
- ARV_REVIEW_REQUIRED
- REPAIR_SCOPE_MISSING
- REPAIR_SCOPE_NOT_ADEQUATE
- REPAIR_ESTIMATE_MISSING_OR_INVALID
- REPAIR_DEAL_ID_MISMATCH
- REPAIR_SCOPE_INCOMPLETE
- REPAIR_REVIEW_REQUIRED
- OFFER_READINESS_ELIGIBLE

## Authority Separation

An `eligible` result from this offline gate does not itself:

- advance a production deal;
- generate an offer;
- calculate MAO;
- persist ARV;
- persist repair scope;
- grant acquisition lifecycle authority;
- grant Qualified Deal Queue authority.

Production workflow integration remains a separate phase.

## Fail-Closed Rule

Any missing or unrecognized state is blocked.

No inference from comparable count alone is allowed.

No fallback from an unsupported ARV to a manually populated ARV number is
allowed by this gate.

No fallback from an inadequate repair scope to a repair-cost number is
allowed by this gate.

## Workflow Integration Requirement

A successor workflow integration must remove or neutralize every path in
which comparable presence alone can advance a deal to Offer Generation.

In particular, logic equivalent to:

`comps.length > 0`

must not independently authorize offer progression.

The integration must consume an explicit readiness result whose positive
state requires both adequate comp-supported ARV and adequate repair scope.

## Non-Authority

This phase authorizes no:

- provider request;
- external HTTP;
- live comparable retrieval;
- production comparable acceptance;
- production ARV calculation or persistence;
- production repair-scope mutation;
- MAO calculation;
- offer generation;
- offer submission;
- production acquisition-lifecycle mutation;
- Qualified Deal Queue mutation;
- scheduler or trigger mutation;
- deployment or RPC.

## Successor

After this offline readiness gate is merged and certified, the successor
phase is bounded workflow integration hardening.

That phase may modify the exact acquisition workflow surfaces only after
reconfirming their current contents and must preserve the fail-closed
combined ARV-plus-repair requirement.
