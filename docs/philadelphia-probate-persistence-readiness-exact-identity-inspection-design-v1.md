# Philadelphia Probate PB1 — Persistence Readiness Exact Identity Inspection v1

## Authority class

READ-ONLY DIAGNOSTIC DESIGN.

This contract grants no production execution, persistence, repair, migration,
collapse, insert, update, owner-enrichment, acquisition, MAO, or offer
authority.

## Certified upstream authority

BASE_MAIN=452a3b97ed86a3c90d358a9212d528464d36eba2

BASE_MAIN_TREE=ac5e990571510442dc365bdac81e06d89ded3737

PB1_EXACT_IDENTITY_INSPECTION_DESIGN_CONTRACT_SHA256=69e5ce2db4e6e20f9b985331de5a778cb3e4de113383c22d730a73ace6d9b7dd

PB1_EXACT_IDENTITY_INSPECTION_IMPLEMENTATION_PLAN_SHA256=01ee0ac0d39962d2e4b3d483298c742b103842fe3fa9167872817b3af82763b9

## Fixed target

The runtime target is compile-time fixed.

TABLE=DISTRESS_LEADS

SOURCE=PA-PHILADELPHIA

SOURCE_DATASET=probate

SOURCE_RECORD_ID=TLI-PROBATE-2026-09-30-OC-1170-DE-2026-372346800

SOURCE_OBSERVATION_KEY=pa-philadelphia|probate|tli-probate-2026-09-30-oc-1170-de-2026-372346800

CANONICAL_PROPERTY_KEY=property|parcel|pa|philadelphia|372346800

PARCEL_ID=372346800

No caller-defined target is authorized.

## Public surface

Runtime module:

`REOS.PhiladelphiaProbatePersistenceReadinessExactIdentityInspection`

Method:

`inspect()`

Public RPC:

`reosPhiladelphiaProbatePersistenceReadinessExactIdentityInspection()`

The public RPC accepts zero declared parameters.

## Security boundary

The runtime requires:

`REOS.Security.requireAdmin()`

The current Security implementation may internally read the `USERS` table.

Therefore the certified one-read limit refers specifically to the diagnostic's
direct authoritative `DISTRESS_LEADS` snapshot:

- direct `Database.getHeaders('DISTRESS_LEADS')`: at most one call;
- direct `Database.getAll('DISTRESS_LEADS')`: at most one call.

Security's internal `USERS` read does not constitute a second
`DISTRESS_LEADS` snapshot.

The diagnostic must not directly invoke Security user-list APIs.

## Schema boundary

The runtime requires the current complete 52-column
`DistressLeadCountySchema.requiredHeaders()` schema.

Actual headers must match the required headers exactly in:

- count;
- order;
- casing;
- spelling.

Schema drift fails closed.

No schema repair or migration is authorized.

## Exact observation match authority

Three stored identity columns are independently inspected globally:

1. `Source Record ID`
2. `Source Observation Key`
3. `Source Record Key`

Comparisons use string coercion only.

No trimming, case-folding, whitespace collapsing, fuzzy matching, address
matching, owner matching, or parcel approximation is permitted.

The union of exact matches is deduplicated by physical `_rowNumber`.

## Canonical-property context

Canonical context is restricted to:

- `Source = PA-PHILADELPHIA`
- `Source Dataset = probate`

and either:

- exact stored `Canonical Property Key`, or
- exact stored `Parcel ID`.

Multiple probate observations for the same canonical property are legitimate
and do not alone create conflict authority.

## Classification precedence

Classification order is fixed:

1. `DUPLICATE`
2. `CONFLICT`
3. `IDENTITY_DRIFT`
4. `INCOMPLETE`
5. `EXACT_EXISTING`
6. `ABSENT`

### DUPLICATE

`DUPLICATE` applies when the exact identity union contains more than one
physical row.

No winner selection or collapse authority is granted.

### CONFLICT

For one exact identity row, `CONFLICT` applies when the stored canonical
property key is nonblank and differs from the certified canonical property key.

No rebinding or repair authority is granted.

### IDENTITY_DRIFT

For one exact identity row, `IDENTITY_DRIFT` applies when:

- Source differs;
- Source Dataset differs;
- a nonblank Source Record ID differs;
- a nonblank Source Observation Key differs;
- a nonblank Source Record Key differs; or
- a nonblank Parcel ID differs.

No automatic migration or repair authority is granted.

### INCOMPLETE

For one exact identity row, `INCOMPLETE` applies when any required identity
field is blank:

- Distress Lead ID;
- Source;
- Source Dataset;
- Source Record ID;
- Source Record Key;
- Source Observation Key;
- Canonical Property Key;
- Parcel ID.

It also applies when exact-row canonical/source identity reconstruction fails.

No automatic backfill authority is granted.

### EXACT_EXISTING

`EXACT_EXISTING` requires exactly one exact identity row with:

- nonblank Distress Lead ID;
- exact Source;
- exact Source Dataset;
- exact Source Record ID;
- exact Source Record Key;
- exact Source Observation Key;
- exact Canonical Property Key;
- exact Parcel ID; and
- successful identity reconstruction.

This classification grants no update authority.

### ABSENT

`ABSENT` requires zero rows in the exact identity union.

Other probate observations on the same canonical property are permitted.

This classification grants no insert or Distress Lead ID creation authority.

## Identity reconstruction

Relevant returned rows may be reconstructed through:

`REOS.CanonicalPropertyIdentity.resolve()`

Reconstruction is corroborating evidence only.

Stored identity columns remain independently visible and remain classification
authority.

Reconstructed values may not overwrite stored values.

## Bounded output

Maximum returned exact identity rows: 5.

Maximum returned canonical-property context rows: 10.

Full match counts and truncation flags are required.

Permitted returned row fields are:

- rowNumber
- distressLeadId
- source
- sourceDataset
- sourceRecordId
- parcelId
- sourceRecordKey
- sourceObservationKey
- canonicalPropertyKey
- reconstructedSourceObservationKey
- reconstructedCanonicalPropertyKey
- identityError

Owner names, owner mailing data, notes, valuations, and the full
`DISTRESS_LEADS` table are prohibited from the returned payload.

## Prohibited surfaces

The diagnostic must not invoke:

- Database.insert
- Database.update
- Database.upsert
- Database.delete
- Database.ensureTable
- direct Spreadsheet writes
- UrlFetchApp
- county connector execution
- county source fetch
- OPA
- scheduler execution
- trigger creation/deletion
- checkpoint mutation
- owner-evidence lookup

## Production sequencing

This implementation alone grants no live diagnostic execution authority.

Required later gates remain separate:

1. implementation evidence review;
2. commit preflight;
3. commit;
4. PR/CI review and merge;
5. Apps Script build/deployment planning;
6. read-only production invocation preflight;
7. exactly one separately authorized production diagnostic;
8. offline result reconciliation;
9. only then consider persistence planning.

## Acquisition safety boundary

ARV_AUTHORITY_GRANTED=false

REPAIR_SCOPE_AUTHORITY_GRANTED=false

MAO_AUTHORITY_GRANTED=false

OFFER_AUTHORITY_GRANTED=false
