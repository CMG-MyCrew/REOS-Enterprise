# Philadelphia Probate PB1 — ABSENT Persistence Executor v1

## Authority class

FIXED-TARGET SINGLE-INSERT IMPLEMENTATION.

This artifact does not itself grant production persistence authority.

## Certified upstream prestate

Production exact-identity classification:

`ABSENT`

Direct diagnostic result SHA256:

`649a3b09c2ef322d84c30b906c9f3c384092222d4d84936ae0371fb3a930c672`

Direct invocation execution evidence SHA256:

`d0f7d0a6039aead92afe2dc1fc7420eb41e803f2712835a8bf54a38c3efaface`

Execution evidence review SHA256:

`595de7ce0504f22ce0c16523b9ad5574979f8a439c2fb10c97756ac1e37dc0cb`

## Fixed target

TABLE=`DISTRESS_LEADS`

SOURCE=`PA-PHILADELPHIA`

SOURCE_DATASET=`probate`

SOURCE_RECORD_ID=`TLI-PROBATE-2026-09-30-OC-1170-DE-2026-372346800`

SOURCE_OBSERVATION_KEY=`pa-philadelphia|probate|tli-probate-2026-09-30-oc-1170-de-2026-372346800`

CANONICAL_PROPERTY_KEY=`property|parcel|pa|philadelphia|372346800`

PARCEL_ID=`372346800`

The public RPC accepts zero parameters and the target cannot be caller-selected.

## Certified fixed insert record

The pre-identity record contains only:

- Address: `1225 W. Somerset Street`
- City: `Philadelphia`
- State: `PA`
- Zip: `19133`
- Distress Type: `probate`
- Status: `Research`
- County: `Philadelphia`
- Source: `PA-PHILADELPHIA`
- Source Dataset: `probate`
- Parcel ID: `372346800`
- Source Record ID: `TLI-PROBATE-2026-09-30-OC-1170-DE-2026-372346800`

Certified fixed-record SHA256:

`6511192926ced92e361ce6052325db6f8bd8647384c4391de8f2a364ca3cd698`

Derived identity fields are:

- Source Record Key = certified Source Observation Key
- Source Observation Key = certified Source Observation Key
- Canonical Property Key = certified Canonical Property Key

Certified derived-identity SHA256:

`648348883ef2457ffae33aac975843e04a97bd838db7a4485b8d3d7ff19b2c16`

Unsupported owner, title-recipient, outcome, valuation, repair, MAO and offer
fields are not persisted.

## Mutation boundary

Execution must:

1. require admin authority;
2. enter `REOS.Database.withScriptLockContext`;
3. require the exact 52-column `DISTRESS_LEADS` schema;
4. perform the exact-identity ABSENT recheck while the ScriptLock is owned;
5. fail closed if Source Record ID, Source Record Key, or Source Observation Key already matches;
6. reconstruct and certify identity through `REOS.CanonicalPropertyIdentity.resolve`;
7. assert the existing `COUNTY_CONNECTOR_LIVE_PERSISTENCE` mutation-exclusion writer immediately before mutation;
8. call `REOS.Database.insert` no more than once;
9. use `idField: 'Distress Lead ID'`, `idPrefix: 'DL'`, and the owned lock context;
10. never preassign the Distress Lead ID;
11. perform post-insert exact-identity reconciliation while the same ScriptLock remains owned;
12. treat every exception after the insert attempt begins as outcome-ambiguous and prohibit retry.

## Prohibited surfaces

No update.

No upsert.

No delete.

No dedupe or merge.

No schema mutation.

No external HTTP.

No generic county connector execution.

No scheduler or trigger execution.

No checkpoint mutation.

No owner enrichment.

No ARV authority.

No repair-scope authority.

No MAO authority.

No offer-generation or offer-submission authority.

## Follow-on verification

A successful mutation response does not complete the workstream by itself.

A separately authorized read-only post-insert production verification must
confirm exactly one persisted exact-identity row and its generated Distress Lead
ID.

## Acquisition safety

ARV_AUTHORITY_GRANTED=false

REPAIR_SCOPE_AUTHORITY_GRANTED=false

MAO_AUTHORITY_GRANTED=false

OFFER_AUTHORITY_GRANTED=false
