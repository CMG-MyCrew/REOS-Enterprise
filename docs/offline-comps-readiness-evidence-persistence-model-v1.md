# Offline Comps Readiness Evidence Persistence Model v1

## Purpose

Implement and certify durable evidence persistence behavior entirely offline
using synthetic evidence.

No production database, Google Sheet, Apps Script persistence surface,
provider, deployment, RPC, or acquisition workflow is touched.

## Evidence surfaces

The model contains three independent evidence surfaces:

1. `DEAL_ARV_EVIDENCE`
2. `DEAL_REPAIR_SCOPE_EVIDENCE`
3. `DEAL_OFFER_READINESS_EVIDENCE`

## Exact ARV schema

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

## Exact repair-scope schema

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

## Exact readiness schema

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

## Evidence identity

Evidence IDs are immutable:

- ARV evidence IDs begin `ARVE-`.
- Repair-scope evidence IDs begin `RSE-`.
- Readiness evidence IDs begin `ORE-`.

Row numbers and array indexes are never evidence identity.

## Append-only history

Evidence history is append-only.

Existing records are never modified or deleted.

Supersession appends a new record and references an earlier record through
`Supersedes Evidence ID`.

The superseded record remains historically readable.

## Idempotency

Every evidence record requires an `Idempotency Key`.

The same key and materially identical payload returns:

`idempotent_existing`

The same key with materially different evidence returns:

`rejected_idempotency_conflict`

No conflicting record is appended.

## Identity enforcement

Every record requires both:

- exact `Deal ID`;
- exact `Canonical Property Key`.

Missing identity is not matching identity.

No fuzzy matching, geocoding, normalization, or canonical identity repair is
performed.

## Explicit asOf

Current-evidence selection requires an explicit `asOf`.

The implementation has no implicit wall-clock dependency.

A record is visible only when its evidence/evaluation timestamp and
`Persisted At` are both at or before `asOf`.

A successor persisted after `asOf` cannot supersede its predecessor for an
earlier historical read.

## Contradictory current evidence

If more than one valid, visible, unsuperseded candidate remains current for
the same evidence surface, Deal ID, and canonical property identity, the
selection fails closed as:

`contradictory`

The implementation does not choose a readiness-positive candidate merely
because that candidate permits progression.

## Unsupported versions

Only schema version `1` is supported by this model.

Unsupported versions fail closed as:

`unsupported_version`

No migration occurs.

## No evidence manufacturing

Missing evidence is rejected.

The model does not manufacture or infer missing:

- evidence IDs;
- Deal IDs;
- canonical property keys;
- ARV;
- comparable evidence IDs;
- comparable counts;
- repair cost;
- repair completeness;
- readiness booleans;
- timestamps;
- provenance.

## No legacy inference

The model does not infer durable evidence from legacy:

- ARV scalar fields;
- comparable row presence;
- comparable count alone;
- repair/rehab scalar fields;
- MAO;
- workflow stage;
- acquisition lifecycle state.

## Production boundary

This model is process-memory only.

It does not read or write:

- `Database.js`;
- Apps Script production source;
- Google Sheets;
- production evidence tables;
- provider APIs;
- production workflow state.

It does not execute:

- production comparable acceptance;
- production ARV;
- repair-scope mutation;
- readiness persistence;
- MAO;
- offer generation;
- offer submission;
- workflow progression.

An offline readiness record with `Decision = eligible` remains evidence only.

Automatic MAO or offer authority remains blocked unless a separately
certified production path establishes both adequate comp-supported ARV and
adequate repair scope.
