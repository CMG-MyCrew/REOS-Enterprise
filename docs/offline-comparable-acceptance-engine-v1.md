# REOS Offline Comparable Acceptance Engine v1

## Status

Offline implementation only.

No live provider, production persistence, ARV calculation, MAO, offer,
scheduler, or acquisition-lifecycle authority is granted.

## Purpose

Determine whether already-normalized comparable-sale evidence is
eligible to enter a future ARV evidence calculation.

Acceptance is distinct from normalization.

Acceptance is distinct from ARV calculation.

## Input

The engine consumes:

1. normalized subject evidence;
2. normalized comparable candidate evidence;
3. explicit acceptance policy;
4. an explicit evaluation date.

No provider-specific schema is permitted.

## Determinism

The engine must not read the current clock.

The evaluation date must be supplied explicitly.

Identical inputs and policy must produce equivalent decisions.

## Outcomes

Every candidate returns exactly one decision:

- accepted;
- rejected;
- review_required.

The engine must also return deterministic reason codes.

## Fail-Closed Rules

A candidate must not be accepted when required evidence is missing,
invalid, contradictory, or unsupported.

Unknown evidence is not matching evidence.

Normalization success alone does not establish acceptance.

## Hard Rejection Rules

The v1 engine rejects when any applicable condition is true:

- normalization outcome is rejected_normalization;
- sale status is not closed;
- sale price is missing, non-finite, or not positive;
- sale date is missing or invalid;
- sale date is in the future relative to evaluation date;
- sale exceeds maximum permitted age;
- property type is missing;
- property type differs from the subject;
- living area is missing or non-positive;
- subject living area is missing or non-positive;
- living-area variance exceeds policy;
- distance is missing or invalid;
- distance exceeds policy;
- bedroom evidence is required and missing;
- bedroom difference exceeds policy;
- bathroom evidence is required and missing;
- bathroom difference exceeds policy.

## Review Rules

The v1 engine returns review_required rather than accepted when:

- normalization outcome is normalized_with_warnings;
- provenance warning exists;
- an optional material characteristic needed by policy is ambiguous.

Review-required evidence cannot automatically support ARV.

## Accepted

A candidate is accepted only when:

- no hard rejection exists;
- no review condition exists;
- every required policy test passes.

## Reason Codes

Reason codes are machine-readable and stable.

Initial reason codes include:

- NORMALIZATION_REJECTED
- NORMALIZATION_WARNING
- SALE_STATUS_NOT_CLOSED
- SALE_PRICE_MISSING_OR_INVALID
- SALE_DATE_MISSING_OR_INVALID
- SALE_DATE_IN_FUTURE
- SALE_TOO_OLD
- PROPERTY_TYPE_MISSING
- PROPERTY_TYPE_MISMATCH
- SUBJECT_LIVING_AREA_MISSING_OR_INVALID
- COMP_LIVING_AREA_MISSING_OR_INVALID
- LIVING_AREA_VARIANCE_EXCEEDED
- DISTANCE_MISSING_OR_INVALID
- DISTANCE_EXCEEDED
- BEDROOMS_MISSING
- BEDROOM_DIFFERENCE_EXCEEDED
- BATHROOMS_MISSING
- BATHROOM_DIFFERENCE_EXCEEDED
- PROVENANCE_WARNING
- ACCEPTED

## Expansion

Radius or recency expansion is not performed implicitly.

A future caller may supply a separately approved expanded policy.

The applied policy must remain observable in the result.

## No Ranking

This engine does not rank accepted comps.

This engine does not weight accepted comps.

This engine does not select an ARV.

## No ARV Authority

An accepted candidate means only that it passed the configured
acceptance policy.

It does not establish:

- sufficient comp count;
- sufficient evidence diversity;
- ARV confidence;
- supported ARV;
- repair scope;
- MAO;
- offer authority.

## Offline Fixtures

All v1 validation uses synthetic fixtures.

Fixtures must not contain production property data or provider
credentials.

## Successor

After this offline acceptance engine is merged and certified, the next
phase is an offline ARV evidence engine.

Live provider integration remains separately gated.
