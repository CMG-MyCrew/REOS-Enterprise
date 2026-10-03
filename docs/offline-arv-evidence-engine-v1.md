# REOS Offline ARV Evidence Engine v1

## Status

Offline implementation only.

This phase calculates ARV evidence against synthetic fixtures only.

It grants no production ARV, repair-scope, MAO, offer, deployment,
provider, persistence, or acquisition-lifecycle authority.

## Purpose

Convert a set of already-accepted comparable-sale evidence into an
auditable ARV evidence result.

The engine does not retrieve comparable evidence.

The engine does not decide whether an individual comparable is accepted.

The engine does not persist ARV.

## Required Input Boundary

Every comparable supplied to the ARV engine must already carry an
acceptance decision of `accepted`.

Rejected or review-required comparable evidence must never be silently
included in valuation.

## Subject Evidence

The subject must provide a positive finite living area when the
price-per-square-foot valuation method is used.

Missing subject valuation evidence fails closed.

## Minimum Evidence

ARV must not be produced unless the configured minimum accepted
comparable count is satisfied.

Comp count alone does not establish confidence.

## Valuation Method

Version 1 uses accepted comparable sale price per square foot.

For each accepted comparable:

    pricePerSqFt = salePrice / livingArea

The engine calculates:

- accepted comparable count;
- average sold price;
- median sold price;
- average price per square foot;
- median price per square foot;
- low observed price per square foot;
- high observed price per square foot;
- low supported value;
- high supported value;
- estimated ARV.

The v1 estimated ARV is:

    medianPricePerSqFt * subjectLivingArea

The supported low/high values are:

    lowPricePerSqFt * subjectLivingArea
    highPricePerSqFt * subjectLivingArea

## Evidence Traceability

The result must identify the comparable evidence IDs used.

No comparable may enter the calculation without a stable evidence ID.

## Confidence

Version 1 emits a bounded evidence confidence classification:

- sufficient;
- review_required;
- insufficient.

Confidence must not be derived solely from comparable count.

The engine considers:

- minimum comparable count;
- completeness of accepted evidence;
- price-per-square-foot dispersion.

## Dispersion

The policy supplies a maximum price-per-square-foot spread ratio.

The spread ratio is:

    (highPpsf - lowPpsf) / medianPpsf

If the evidence exceeds the configured spread threshold, the engine
returns review_required and does not grant production authority.

## Outcomes

The engine returns exactly one evidence status:

- supported;
- review_required;
- insufficient.

Only `supported` contains an estimated ARV.

`review_required` and `insufficient` must return a null estimated ARV.

## Fail-Closed Conditions

ARV is not produced when:

- subject living area is missing or invalid;
- minimum accepted comparable count is not met;
- any supplied comparable is not accepted;
- comparable evidence ID is missing;
- sale price is missing or invalid;
- comparable living area is missing or invalid;
- duplicate comparable evidence IDs are supplied;
- price-per-square-foot dispersion exceeds policy.

## No Production Authority

A supported offline ARV result does not authorize:

- production ARV persistence;
- repair-scope authority;
- MAO calculation;
- offer generation;
- offer submission;
- Qualified Deal Queue advancement;
- acquisition lifecycle advancement.

## Acquisition Safety Gate

Future automatic MAO or offer eligibility requires both:

1. adequate comp-supported ARV; and
2. adequate repair scope.

Neither condition may substitute for the other.

## Determinism

The engine must not read the current clock.

Identical evidence and policy must produce equivalent output.

## Fixtures

All v1 evidence is synthetic.

No production property data, provider credentials, live provider
records, or production REOS records are used.

## Successor

After this offline engine is merged and certified, the next phase is
the provider adapter interface.

Workflow readiness-gate hardening remains separately required before
production offer progression can ever consume comparable/ARV evidence.
