# REOS Comparable Provider Adapter Interface v1

## Status

Interface and offline contract only.

No real comparable provider is selected, contacted, authenticated,
queried, or authorized by this phase.

## Purpose

Define the boundary between a future comparable-data provider and the
existing REOS comparable evidence normalization pipeline.

The intended flow is:

provider implementation
→ provider adapter result
→ comparable evidence normalization
→ comparable acceptance
→ ARV evidence

Provider-specific schemas must not leak into acceptance or ARV logic.

## Adapter Request

A comparable retrieval request contains:

- schemaVersion;
- requestId;
- subjectDealId;
- subjectCanonicalPropertyKey when available;
- subjectAddress;
- subjectPropertyType when available;
- subjectLivingArea when available;
- searchPolicy;
- requestedAt supplied by the caller.

The adapter interface must not obtain the current clock implicitly.

## Search Policy

Search policy may describe:

- maximum radius;
- maximum sale age;
- maximum result count.

The interface records these parameters.

It does not authorize automatic search expansion.

Radius or recency expansion must be separately explicit and observable.

## Adapter Result

A provider adapter result contains:

- schemaVersion;
- requestId;
- providerId;
- retrievalStatus;
- retrievedAt;
- records;
- warnings;
- errors.

Allowed retrieval statuses are:

- success;
- partial;
- unavailable;
- failed.

## Provider Records

Records at this boundary are provider adapter records.

They may contain provider-specific raw evidence, but each record must
preserve:

- provider ID;
- provider record ID where available;
- retrieval timestamp;
- raw evidence;
- adapter metadata.

The normalization layer remains responsible for creating canonical
comparable evidence.

## Provenance

Raw provider evidence must remain distinguishable from normalized
evidence.

Provider adapter records must preserve provenance rather than silently
rewriting missing or ambiguous fields.

## Missing Evidence

Missing provider evidence remains missing.

The adapter must not manufacture:

- sale price;
- sale date;
- property type;
- living area;
- beds;
- baths;
- distance;
- coordinates;
- provider record IDs.

## Offline Mock

Version 1 includes only a deterministic offline mock adapter.

The mock consumes synthetic records supplied directly by the caller.

It performs no HTTP request, provider authentication, file scraping,
MLS access, browser automation, geocoding, or production REOS read.

## Security

Credentials do not belong in:

- adapter requests;
- adapter results;
- fixtures;
- logs;
- committed source.

A future real provider implementation must obtain credentials through a
separate approved secret boundary.

## Authority Separation

Defining or implementing an adapter does not grant:

- live comparable retrieval authority;
- comparable acceptance authority;
- ARV authority;
- production persistence authority;
- repair-scope authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority;
- Qualified Deal Queue authority;
- acquisition-lifecycle authority.

## Acquisition Safety Gate

Automatic MAO or offer eligibility remains blocked unless both:

1. adequate comp-supported ARV exists; and
2. adequate repair scope exists.

Provider data availability alone satisfies neither condition.

## Failure Behavior

Provider unavailability, partial retrieval, malformed records, or
missing evidence must not be converted into successful comparable
evidence.

Downstream normalization and acceptance remain separate gates.

## Successor

After this interface is merged and certified, the next phase is
workflow readiness-gate hardening.

A real provider selection and single-record read-only provider
certification remain separately authorized future phases.
