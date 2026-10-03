# REOS Comparable Evidence + ARV Contract v1

## Status

Design and safety contract only.

This contract grants no production execution authority.

## Purpose

REOS already contains a Comparable Sales engine, DEAL_COMPARABLES
storage, comparable-analysis storage, Estimated ARV, confidence
scoring, Deal Analyzer ARV fields, and acquisition workflow stages.

This contract does not create a second comparable-sales subsystem.

It defines the evidence and authority requirements that must be
satisfied before the existing comparable-sales architecture can be
used for autonomous ARV support.

## Existing Architecture

Implementation must extend or harden the existing REOS surfaces:

- build/apps-script-brand/ComparableSales.js
- build/apps-script-brand/DealAnalyzer.js
- build/apps-script-brand/DealLifecycleWorkflow.js
- build/apps-script-brand/AcquisitionWorkflow.js
- DEAL_COMPARABLES
- existing comparable-analysis persistence

A parallel competing comps engine is prohibited.

## Subject Property Identity

Comparable analysis must begin with resolved subject-property identity.

The request should carry, where available:

- Deal ID
- canonical property identity
- normalized street address
- city
- state
- ZIP
- property type
- living area
- bedrooms
- bathrooms

A comparable candidate must never repair or replace the subject
property's canonical identity.

Ambiguous subject identity routes to research/review.

## Comparable Evidence

Every candidate considered for ARV must preserve sufficient evidence to
determine why it was accepted or rejected.

The normalized evidence model must support:

- comparable ID
- subject Deal ID
- comparable address
- normalized comparable identity
- sale price
- sale date
- sale status
- property type
- living area
- bedrooms
- bathrooms
- distance from subject
- source
- source record identifier where available
- source retrieval timestamp
- evidence freshness
- acceptance status
- rejection reasons
- adjustment metadata where applicable
- provenance metadata

Raw provider evidence and normalized REOS evidence must remain
distinguishable.

## Comparable Acceptance

A candidate must not become an accepted comparable merely because it is
geographically close.

Acceptance must evaluate available evidence for:

1. confirmed sale status;
2. usable sale price;
3. usable sale date;
4. sale recency;
5. property-type compatibility;
6. geographic relevance;
7. living-area similarity where available;
8. bedroom similarity where available;
9. bathroom similarity where available;
10. material property differences where available;
11. provenance sufficiency.

Missing evidence must not silently become matching evidence.

## Recency

Comparable recency must be explicit and configurable.

Search-window expansion must be observable.

Expanding the time window must not silently increase confidence.

## Geographic Expansion

Search-radius expansion must be explicit and observable.

The evidence must distinguish:

- initial search radius;
- expanded search radius;
- accepted comparable distance.

Expanded geographic criteria must not silently receive the same
confidence treatment as a tightly localized comparable set.

## Comparable Set Sufficiency

ARV support requires a sufficient accepted comparable set.

The production minimum is not hard-coded by this design contract.

The implementation must make the minimum explicit,
configuration-controlled, validated, and testable.

A sparse comparable set routes to research/review.

## ARV Evidence

An ARV result must identify the evidence supporting it.

The result must support:

- subject Deal ID;
- accepted comparable IDs;
- rejected candidate count;
- accepted comparable count;
- valuation method;
- average sold price where applicable;
- median sold price where applicable;
- price-per-square-foot evidence where applicable;
- low supported value;
- high supported value;
- estimated ARV;
- confidence score;
- confidence reasons;
- evidence timestamp;
- evidence provenance.

An ARV number without adequate supporting comparable evidence does not
satisfy this contract for automatic acquisition authority.

## Confidence

Confidence must not be based solely on comparable count.

Confidence should consider:

- accepted comparable count;
- sale recency;
- geographic proximity;
- property-type compatibility;
- size similarity;
- bedroom/bath similarity;
- evidence completeness;
- source quality;
- supported-value dispersion;
- expanded search criteria.

Low-confidence ARV routes to research/review.

## Compatibility

DEAL_COMPARABLES and the existing comparable-analysis surfaces remain
compatibility surfaces unless a separately approved migration contract
changes them.

Schema extensions must be additive or separately migrated.

Existing production records must not be destructively rewritten merely
to satisfy this contract.

## Acquisition Safety Gate

Comparable evidence does not independently authorize an offer.

Automatic MAO or offer authority requires BOTH:

1. adequate comp-supported ARV evidence; and
2. adequate repair scope.

Automatic MAO / offer authority must remain blocked when any applicable
condition exists, including:

- missing ARV;
- ARV lacking adequate comparable evidence;
- insufficient accepted comparables;
- stale comparable evidence;
- contradictory comparable evidence;
- low-confidence comparable evidence;
- unresolved subject identity;
- missing repair scope;
- inadequate repair scope.

Blocked records route to research/review.

## Workflow Safety

The presence of rows in DEAL_COMPARABLES is not sufficient authority
to advance a deal to Offer Generation.

Presence-only logic such as:

    comps.length > 0

must not independently grant offer progression.

A future workflow-hardening implementation must consume an explicit
validated readiness decision.

## Authority Separation

The following authorities are separate:

- comparable retrieval authority;
- comparable normalization authority;
- comparable acceptance authority;
- ARV calculation authority;
- ARV persistence authority;
- repair-scope authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority.

Granting one authority does not imply another.

## Provider Boundary

Comparable retrieval must use an isolated provider/adapter boundary.

The ARV engine must not depend directly on one external provider.

Provider-specific records must be normalized into the REOS comparable
evidence contract before influencing ARV.

## External Data

This design grants no:

- external HTTP authority;
- MLS authority;
- scraping authority;
- provider credential authority.

Provider integration requires separate authorization.

## Failure Behavior

The system must fail closed.

Provider failure, incomplete evidence, parse failure, stale evidence,
identity ambiguity, insufficient comps, or low confidence must route
the property to research/review.

These conditions must never synthesize an ARV merely to continue the
acquisition workflow.

## Existing MAO Logic

Existing MAO formulas may remain for compatibility.

This contract does not authorize automatic MAO execution.

A positive ARV value alone does not establish MAO authority.

## Existing Offer Workflow

Existing Offer Generation stages may remain for compatibility.

This contract does not authorize automatic progression into them.

## Non-Authority

This contract grants none of the following:

- production comparable retrieval;
- production comparable persistence;
- production ARV calculation;
- production ARV persistence;
- repair-scope authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority;
- Qualified Deal Queue authority;
- acquisition lifecycle mutation authority;
- scheduler authority;
- trigger authority;
- county-data mutation authority;
- probate mutation authority;
- code-violation mutation authority;
- absentee-owner mutation authority.

## Successor Work

Successor implementation should remain separately reviewable:

1. comparable evidence normalization;
2. offline comparable acceptance engine;
3. offline ARV evidence engine;
4. provider adapter interface;
5. workflow readiness-gate hardening;
6. persistence design;
7. single-record read-only provider certification;
8. bounded single-record evidence persistence;
9. production-readiness certification.

No phase automatically authorizes the next phase.
