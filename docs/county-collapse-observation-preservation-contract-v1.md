# County collapse observation-preservation contract v1

Status: DESIGN ONLY.

No observation-preservation implementation, mutation, RPC, deployment,
physical-delete, county execution, scheduler, checkpoint, connector, or
automatic-offer authority is granted by this contract.

## Certified baseline

- Base main commit: `d60cbea8622c94e8525310038ced2f54fb4f709f`
- Collapse authority SHA-256:
  `87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee`
- Winner-plan fingerprint:
  `848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9`
- Read-only observation-preservation discovery SHA-256:
  `754a9ec4100622207f5ea356045a1d1d3004781d542f73653092f4b4a3572ec3`
- Observation-preservation groups: `17,18,19,20,21,22`
- Winner-plan action:
  `MERGE_LATEST_OBSERVATION_THEN_COLLAPSE`

Contract-Marker: OBSERVATION_PRESERVATION_CONTRACT_VERSION=1
Contract-Marker: BASE_MAIN_SHA=d60cbea8622c94e8525310038ced2f54fb4f709f
Contract-Marker: COLLAPSE_AUTHORITY_SHA=87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee
Contract-Marker: WINNER_PLAN_FINGERPRINT=848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9
Contract-Marker: DISCOVERY_SHA=754a9ec4100622207f5ea356045a1d1d3004781d542f73653092f4b4a3572ec3
Contract-Marker: OBSERVATION_MERGE_GROUPS=17,18,19,20,21,22
Contract-Marker: PRESERVATION_WRITE_FIELDS=Updated At,Last Seen At,Connector Run ID
Contract-Marker: PRESERVATION_MUTATION_AUTHORITY=false
Contract-Marker: RPC_AUTHORITY=false
Contract-Marker: DEPLOYMENT_AUTHORITY=false
Contract-Marker: PHYSICAL_DELETE_AUTHORITY=false
Contract-Marker: PRODUCTION_MUTATION_AUTHORITY=false
Contract-Marker: SCHEDULER_AUTHORITY=false
Contract-Marker: CHECKPOINT_MUTATION_AUTHORITY=false
Contract-Marker: CONNECTOR_EXECUTION_AUTHORITY=false
Contract-Marker: AUTOMATIC_OFFER_AUTHORITY=false

## Purpose

Groups 17 through 22 have an older lineage winner and a different latest
source observation.

The collapse winner must survive because its Distress Lead ID and Created At
carry lineage identity.

Before any non-winner physical row can be deleted, the latest observation
provenance must be preserved on that winner without replacing the winner's
source identity, durable identity, canonical property identity, lineage
identity, business state, or Distress Lead ID.

## Discovery authority

The certified read-only discovery found this union of differences between
winner rows and latest-observation rows:

- `Connector Run ID`
- `Created At`
- `Distress Lead ID`
- `Last Seen At`
- `Source Observation Key`
- `Source Record ID`
- `Source Record Key`
- `Updated At`

The categories were:

### Observation-provenance differences

- `Updated At`
- `Last Seen At`
- `Connector Run ID`

### Source-identity differences

- `Source Record ID`
- `Source Record Key`
- `Source Observation Key`

### Lineage differences

- `Created At`
- `Distress Lead ID`

### Business differences

None.

A future implementation must not infer from this union that only differing
fields need classification. Every current physical header must receive an
explicit mapping classification before mutation authority exists.

## Complete field-mapping model

Every current `DISTRESS_LEADS` header must resolve exactly once into one of
these mapping classes.

### 1. PRESERVE_FROM_LATEST_OBSERVATION

Exact write set:

- `Updated At`
- `Last Seen At`
- `Connector Run ID`

These are the only winner cells that a v1 preservation implementation may
change.

The postimage value for each must equal the exact current value on the
certified latest-observation row immediately before mutation.

No additional field may be added to this write set because it happens to
differ.

### 2. IMMUTABLE_SOURCE_AND_PROPERTY_IDENTITY

At minimum:

- `Source`
- `Source Dataset`
- `Source Record ID`
- `Source Record Key`
- `Source Observation Key`
- `Violation Number`
- `Canonical Property Key`
- `Parcel ID`
- `Address`
- `City`
- `State`
- `Zip`
- `County`

All values in this class remain exactly equal to the winner preimage.

The latest-observation row's `Source Record ID`, `Source Record Key`, and
`Source Observation Key` identify that row's source observation and must never
replace the winner's corresponding identities.

### 3. IMMUTABLE_LINEAGE

Exact lineage identity includes:

- `Distress Lead ID`
- `Created At`

Both remain exactly equal to the winner preimage.

A preservation operation must never transfer the delete candidate's Distress
Lead ID or creation timestamp onto the survivor.

### 4. BUSINESS_EQUIVALENT_KEEP_WINNER

Every header not classified into the three classes above is business or other
non-authorized state for preservation v1.

For each such field:

- current group values must remain business-equivalent under the certified
  winner-plan rules;
- the winner preimage value remains the winner postimage value;
- no write is authorized.

Any newly observed business-value conflict blocks preservation.

## Current-header completeness

The preservation implementation must read the complete current header row from
the authoritative `DISTRESS_LEADS` sheet.

It must reject:

- missing required headers;
- duplicate headers;
- blank/ambiguous headers;
- a header that cannot be classified exactly once;
- a new header not covered by the mapping rules;
- any overlap between mapping classes.

The exact complete header vector and its SHA-256 fingerprint must be captured
in preservation evidence.

## Group and winner binding

Preservation v1 is limited to groups:

`17,18,19,20,21,22`.

The operation must rebuild the certified winner plan.

It must require:

- exact collapse authority SHA;
- exact winner-plan fingerprint;
- exact group membership;
- action exactly `MERGE_LATEST_OBSERVATION_THEN_COLLAPSE`;
- winner Distress Lead ID exactly as selected by the winner plan;
- latest-observation Distress Lead ID exactly as selected by the winner plan;
- winner and latest identities must be different;
- latest-observation identity must still be a certified delete candidate.

Caller-supplied row numbers, field maps, write values, or latest-observation
identity cannot grant authority.

## Fresh physical re-resolution

Original certified row numbers are evidence only.

Before any write, the implementation must re-resolve from fresh physical
sheet state:

- current winner row;
- current latest-observation row;
- every residual certified group member;
- exact sheet ID;
- exact complete headers;
- last/max row geometry;
- last/max column geometry.

Every Distress Lead ID involved must occur exactly once.

## Exact preimages and formulas

Before mutation, the implementation must capture the complete winner row:

- displayed/canonical values for every header;
- formulas for every physical cell;
- row number;
- full-row canonical fingerprint.

It must also capture the complete latest-observation row values and formulas.

The three authorized preservation cells must be literal stored values.

If either the winner or latest-observation cell for any of:

- `Updated At`
- `Last Seen At`
- `Connector Run ID`

contains a formula, preservation v1 fails closed.

No formula may be introduced, removed, moved, or rewritten.

## Observation ordering revalidation

The current latest observation must still be latest according to the same
certified winner-plan ordering:

1. greatest `Last Seen At`;
2. greatest `Updated At`;
3. greatest physical row number as final deterministic tie-breaker.

`Last Seen At` and `Connector Run ID` on the current latest observation must
remain populated.

If current ordering selects a different latest observation than the certified
plan, preservation fails closed and requires a newly certified plan/evidence
path.

## Mutation topology

A future preservation implementation must operate under one caller-owned outer
Database ScriptLock context.

It must use the existing non-replayable
`REOS.Database.withScriptLockContext(...)` ownership model.

It must not acquire or release a nested ScriptLock.

Only the three authorized winner cells may be written.

No row insertion, row deletion, row clearing, row movement, broad update,
upsert, soft-delete, scheduler mutation, checkpoint mutation, connector
execution, or offer mutation is authorized.

Implementation-time mutation topology and failure-path behavior require a
separate certification gate.

## Postimage

After the authorized writes and while the same outer lock remains valid, the
implementation must read back the complete winner row.

The exact winner postimage must satisfy all of the following:

- `Updated At` equals the latest-observation preimage;
- `Last Seen At` equals the latest-observation preimage;
- `Connector Run ID` equals the latest-observation preimage;
- every source/property identity field equals winner preimage;
- every lineage field equals winner preimage;
- every business/other field equals winner preimage;
- complete formulas equal winner preimage formulas;
- winner Distress Lead ID exists exactly once;
- canonical property identity is unchanged;
- durable/source identity remains the winner's identity.

No delete authority exists merely because these checks pass.

## Preservation receipt

A verified preservation result must construct a canonical receipt containing or
cryptographically binding at minimum:

- preservation contract version;
- implementation version;
- collapse authority SHA;
- winner-plan fingerprint;
- discovery SHA;
- group number;
- violation number;
- durable key;
- canonical property key;
- winner Distress Lead ID;
- latest-observation Distress Lead ID;
- complete current group membership;
- spreadsheet ID;
- sheet ID;
- exact header vector and header SHA-256;
- winner physical row;
- latest-observation physical row;
- exact complete winner preimage values;
- exact complete winner preimage formulas;
- exact complete latest-observation values;
- exact complete latest-observation formulas;
- exact three-field authorized write map;
- exact complete verified winner postimage values;
- exact complete verified winner postimage formulas;
- preimage fingerprint;
- postimage fingerprint;
- receipt timestamp UTC;
- receipt SHA-256.

The receipt must be persisted durably and read back successfully before the
collapse executor may use it.

The exact durable receipt storage mechanism and lifecycle require separate
implementation certification.

A caller-provided receipt, bare boolean, group number, or matching fingerprint
alone cannot grant delete authority.

## Interruption and failure model

Preservation is a pre-delete prerequisite and must fail closed.

Before a verified durable receipt exists:

- preservation success must not be assumed;
- delete authority remains false;
- the executor may not invoke the physical-delete primitive.

If an implementation experiences a partial winner write, failed postimage
verification, failed rollback, failed flush, failed receipt persistence, failed
receipt readback, or lock-owner finalization uncertainty, the result must be
classified as preservation-uncertain.

A preservation-uncertain result requires separately authorized read-only
reconciliation.

It must not automatically authorize delete, retry destructive collapse,
recreate a row, or proceed from absence/presence assumptions.

Exact preservation outcome names and rollback mechanics are implementation
contract concerns and are not authorized by this design contract.

## Executor consumption

The future collapse executor must independently revalidate the receipt while
holding its required outer mutation lock.

For groups 17 through 22, it must verify that:

- receipt contract and implementation versions are certified;
- receipt group/winner/latest identities match the current certified plan;
- receipt authority/fingerprint values are exact;
- current winner postimage still equals the receipt postimage;
- current formulas still equal the receipt formulas;
- current canonical/property/lineage/source identity remains unchanged.

Only after all other executor prerequisites also pass may the receipt satisfy
the observation-preservation prerequisite.

The receipt never grants physical-delete authority by itself.

## Explicitly forbidden preservation surfaces

Observation-preservation v1 must not:

- replace `Distress Lead ID`;
- replace `Created At`;
- copy `Source Record ID`;
- copy `Source Record Key`;
- copy `Source Observation Key`;
- change canonical property identity;
- change parcel/address identity;
- change business values;
- write any field outside the exact three-field preservation set;
- delete or insert rows;
- run connectors;
- mutate checkpoints;
- enable or run the county scheduler;
- generate MAO or offer authority.

## Acquisition safety boundary

This contract changes no acquisition safety gate.

Automatic MAO/offer authority remains prohibited unless both:

1. comp-supported ARV is present; and
2. an adequate repair scope is present.

Observation preservation never satisfies either requirement.

## Release boundary

This contract authorizes design validation only.

It does not authorize:

- observation-preservation implementation;
- observation-preservation mutation;
- durable receipt provisioning;
- RPC;
- deployment;
- county execution;
- physical deletion;
- production mutation;
- scheduler mutation;
- checkpoint mutation;
- connector execution;
- automatic offers.
