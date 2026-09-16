# Absentee-Owner Enrichment Persistence Contract v1

## Purpose

This contract defines the persistence boundary for absentee-owner enrichment.

Absentee-owner enrichment is subordinate evidence attached to an existing
acquisition record. It does not become acquisition authority.

This contract does not authorize persistence execution. It defines the
conditions a future persistence adapter must satisfy before persistence may
be implemented.

## Required input authority

A future persistence adapter may accept only:

1. an existing acquisition-record identity; and
2. a Phase 1D sanitized absentee-owner enrichment result.

Raw provider rows are not persistence input.

Generic CSV-import payloads are not persistence input.

Caller-supplied arbitrary database patches are not persistence input.

## Target record

The target acquisition table is:

`DISTRESS_LEADS`

The adapter must update an existing record only.

It must never create or upsert a missing acquisition record.

## Required identity

Both identity dimensions are mandatory:

- `Distress Lead ID`
- `Canonical Property Key`

Both supplied values must resolve to the same existing acquisition record.

Identity verification must fail closed when:

- Distress Lead ID is missing;
- Canonical Property Key is missing;
- no existing record is found;
- Distress Lead ID resolves ambiguously;
- Canonical Property Key resolves ambiguously;
- the two identity dimensions resolve to different records; or
- any identity mismatch exists.

No persistence may occur after an identity-verification failure.

## Accepted enrichment outcome

Only:

`MATCHED`

may produce a semantic owner-field write.

The following outcomes may not produce an owner-field write:

- `NO_MATCH`
- `AMBIGUOUS`
- `FAILED`

A future adapter must not convert any non-MATCHED outcome into MATCHED.

## Maximum semantic writeset

The complete v1 enrichment-owned semantic writeset is exactly:

- `Owner Name`
- `Owner Mailing Address`

No other semantic acquisition field is writable through this boundary.

`Updated At`, if maintained by the underlying persistence implementation,
may only be a timestamp consequence of an otherwise-authorized owner
enrichment update. It is not an enrichment-owned semantic field and must
not be accepted from provider evidence or a caller patch.

## Fresh patch construction

A future persistence adapter must construct a fresh patch from the
validated Phase 1D sanitized result.

It must not pass through:

- a raw provider row;
- a generic CSV row;
- a caller-supplied arbitrary patch;
- unknown fields;
- protected fields; or
- provider-controlled field names.

The future persistence patch may contain only:

- `Owner Name`
- `Owner Mailing Address`

## Protected acquisition authority

This persistence boundary has no authority to modify:

- `Distress Lead ID`
- `Canonical Property Key`
- `Address`
- `City`
- `State`
- `Zip`
- `Distress Type`
- `Distress Score`
- `Estimated Value`
- `Estimated Repairs`
- `Suggested Offer`
- `Lead Source`
- `Status`
- `Notes`
- `Imported Deal ID`
- `Created At`
- `ARV`
- `MAO`
- offer-authority fields
- `automaticOfferAuthorityGranted`
- any lifecycle field
- any deal-creation field
- any non-enrichment field

## Acquisition safety gate

Absentee-owner enrichment does not satisfy, bypass, weaken, replace, or
grant the acquisition safety gate.

No automatic MAO or offer authority may exist unless both comp-supported
ARV and an adequate repair scope are independently present.

Missing or weak ARV or repair evidence must continue to route the deal to
research/review rather than manufacture an offer.

## Generic persistence primitives

Existing generic repository primitives such as:

- `REOS.Database.update()`
- `REOS.Database.insert()`
- `REOS.Database.upsert()`
- `setValue()`
- `setValues()`
- `appendRow()`

are not authorized for direct use by provider evidence or arbitrary
absentee-owner caller payloads.

A future implementation may use a narrowly controlled existing-record
update primitive only after a separate implementation increment proves
that this contract is enforced.

This contract itself grants no database-write authority.

## Historical absentee CSV connector

The historical generic absentee-owner CSV connector is not the v1
enrichment persistence boundary.

Phase 1E must not retrofit, invoke, deploy, or grant persistence authority
to that connector.

## Fail-closed behavior

A future persistence adapter must reject or decline persistence for:

- malformed input;
- missing required identity;
- record not found;
- duplicate or ambiguous identity;
- canonical identity mismatch;
- non-MATCHED outcome attempting owner writes;
- protected-field attempts;
- unknown-field attempts;
- malformed sanitized results;
- raw provider rows used as persistence patches; and
- generic CSV rows used as persistence patches.

Failure must not corrupt or replace the underlying acquisition record.

## Phase 1E authorization

Phase 1E is contract-only.

Authorized in this increment:

- this documentation;
- deterministic offline fixtures;
- deterministic offline contract validation.

Not authorized in this increment:

- persistence adapter implementation;
- `REOS.Database.update()` execution;
- `REOS.Database.insert()` execution;
- `REOS.Database.upsert()` execution;
- spreadsheet writes;
- provider/network calls;
- RPC;
- deployment;
- trigger or scheduler changes;
- production mutation;
- deal creation;
- MAO generation;
- offer generation; or
- automatic offer authority.
