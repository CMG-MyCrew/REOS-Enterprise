# REOS Comparable Evidence Normalization Contract v1

## Status

Design and safety contract only.

This contract implements no production retrieval, persistence,
acceptance scoring, ARV calculation, MAO calculation, or offer action.

## Parent Contract

This contract is subordinate to:

- docs/comps-evidence-arv-contract-v1.md

The parent safety requirements remain authoritative.

## Purpose

Define a provider-neutral canonical evidence record for comparable-sale
candidates before any candidate can influence comparable acceptance,
confidence, ARV, MAO, or offer progression.

Normalization converts source-specific evidence into a stable REOS
representation.

Normalization does not determine whether a candidate is a valid comp.

## Architecture

The intended future flow is:

    provider raw record
        |
        v
    provider adapter
        |
        v
    comparable evidence normalizer
        |
        v
    canonical comparable evidence
        |
        v
    acceptance engine
        |
        v
    ARV evidence engine

Provider-specific schemas must not leak into the acceptance or ARV
engines.

## Raw Evidence Preservation

Normalization must not destroy source evidence.

The system must preserve enough provenance to distinguish:

- raw provider evidence;
- provider adapter output;
- normalized REOS evidence.

A normalized value must not be represented as if it were directly
supplied by the provider when it was derived or transformed.

## Canonical Record

A normalized comparable candidate must support the following logical
fields.

### Record Identity

- normalization schema version
- comparable evidence ID
- subject Deal ID
- subject canonical property key where available
- provider identifier
- provider record identifier where available
- source retrieval timestamp
- normalization timestamp

### Comparable Property Identity

- raw address
- normalized address
- street
- city
- state
- ZIP
- canonical comparable property key where resolvable

The comparable property identity must remain distinct from the subject
property identity.

Normalization must never repair or overwrite the subject property's
canonical identity.

### Sale Evidence

- sale status
- sale price
- sale date
- sale evidence completeness

Unknown sale status must remain unknown.

Missing sale price must remain missing.

Missing sale date must remain missing.

Normalization must not synthesize sale facts.

### Property Characteristics

Where supplied or safely derivable:

- property type
- living area
- lot area
- bedrooms
- bathrooms
- year built
- unit count

Missing characteristics must remain explicitly missing.

Zero must not be substituted for unknown unless zero is the actual
source value and is valid for that field.

### Geographic Evidence

Where supplied or separately calculated by an authorized future phase:

- latitude
- longitude
- distance from subject
- distance unit
- distance derivation method

This contract does not authorize geocoding.

This contract does not authorize external distance calculation.

### Provenance

The normalized record must support:

- source/provider name
- source record identifier
- source retrieval timestamp
- source evidence reference where permitted
- normalization schema version
- normalization timestamp
- transformed-field metadata where required
- warnings
- normalization errors

## Data Types

Canonical normalization should use deterministic data types.

### Money

Sale price must normalize to a numeric monetary value only when the
source representation can be parsed unambiguously.

Invalid or ambiguous monetary values must not become zero.

### Dates

Sale date and retrieval timestamps must use an unambiguous canonical
representation.

A missing or invalid date must remain missing and produce appropriate
normalization evidence.

### Numeric Characteristics

Living area, lot area, bedrooms, bathrooms, year built, unit count,
coordinates, and distance must reject non-finite numeric values.

Invalid values must not silently coerce to zero.

### Strings

Whitespace normalization may be performed deterministically.

Normalization must not invent missing semantic content.

## Missing Values

The normalization layer must distinguish:

- missing;
- explicitly null;
- invalid;
- unavailable;
- not supplied by provider;
- valid zero where zero is meaningful.

Missing evidence must never become matching evidence.

## Derived Values

A derived field must identify its derivation where that distinction is
material to downstream confidence or auditing.

Derived values must not masquerade as direct provider observations.

## Validation

Normalization validation should identify at minimum:

- missing provider identity;
- malformed provider record identity where required;
- invalid sale price;
- invalid sale date;
- invalid living area;
- invalid bedroom count;
- invalid bathroom count;
- invalid year built;
- invalid unit count;
- invalid coordinates;
- invalid distance;
- malformed timestamps;
- unsupported normalization schema version.

## Normalization Outcome

A normalization result must be able to express:

- normalized;
- normalized_with_warnings;
- rejected_normalization.

Normalization rejection means the candidate cannot enter the
comparable acceptance engine.

Normalization success does not mean the candidate is an accepted comp.

## Determinism

Given identical source evidence, adapter output, normalization schema
version, and configuration, normalization must produce equivalent
canonical evidence.

Provider order or unrelated system state must not alter normalization.

## Idempotency

Repeated normalization of the same evidence must not create conflicting
semantic records.

Future persistence design must define stable idempotency behavior before
production persistence is authorized.

## Schema Version

Canonical comparable evidence must carry an explicit normalization
schema version.

Breaking schema changes require a new version or separately approved
migration.

## Compatibility With DEAL_COMPARABLES

DEAL_COMPARABLES remains an existing compatibility surface.

This contract does not authorize destructive changes to it.

The canonical evidence model may require additive fields or a separate
evidence surface in a future persistence design.

That decision requires separate review.

## Acceptance Boundary

Normalization must not contain final comparable acceptance policy.

The normalizer may identify malformed or unusable evidence, but it must
not independently decide that a normalized candidate is sufficiently
similar to support ARV.

Comparable acceptance belongs to the separately certified acceptance
engine.

## ARV Boundary

Normalization grants no ARV authority.

A normalized record cannot independently establish:

- supported ARV;
- ARV confidence;
- repair scope;
- MAO;
- offer authority.

## Provider Boundary

Provider-specific parsing belongs in provider adapters.

Canonical normalization must consume a provider-neutral adapter
contract.

No provider-specific HTTP request belongs in the normalizer.

## Failure Behavior

Normalization must fail closed.

Malformed, contradictory, ambiguous, unsupported, or unparseable
evidence must produce explicit errors or warnings rather than invented
facts.

A rejected normalization must not continue automatically into
comparable acceptance.

## Auditability

Future implementation must make it possible to determine:

- which provider supplied the source record;
- which source record was used;
- when it was retrieved;
- which normalization schema was applied;
- which fields were transformed;
- which warnings/errors occurred;
- whether normalization succeeded.

## Security

Provider credentials must never be persisted inside comparable evidence
records.

Raw evidence persistence, if later authorized, must avoid unnecessary
credential, token, or secret material.

## Non-Authority

This contract grants no:

- provider credential authority;
- external HTTP authority;
- comparable retrieval authority;
- comparable persistence authority;
- raw provider evidence persistence authority;
- geocoding authority;
- acceptance authority;
- ARV calculation authority;
- ARV persistence authority;
- repair-scope authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority;
- Qualified Deal Queue authority;
- acquisition lifecycle mutation authority;
- scheduler authority;
- trigger authority;
- probate mutation authority;
- code-violation mutation authority;
- absentee-owner mutation authority.

## Successor

After this contract is merged and certified, the next implementation
phase is the offline comparable acceptance engine contract and
implementation.

Live provider integration remains out of scope.

No phase automatically authorizes the next phase.
