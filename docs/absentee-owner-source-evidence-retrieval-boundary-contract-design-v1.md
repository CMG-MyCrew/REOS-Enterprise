# Absentee-Owner Source-Evidence Retrieval Boundary Contract Design v1

## Purpose

Define a future narrowly bounded read-only boundary for retrieving the minimum raw Philadelphia code-violation source evidence required by `REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`.

This increment is design only. It creates no retriever and grants no runtime authority.

## Existing evaluator remains pure

The merged evaluator continues to receive immutable `sourceObservations` as caller-supplied input. It MUST NOT gain HTTP, database, spreadsheet, Script Property, trigger, scheduler, county-ingestion, or persistence access.

Source retrieval remains a separate authority boundary.

## Source authority

Version 1 is restricted to connector `PA-PHILADELPHIA`, dataset `code_violations`, and the certified Philadelphia ArcGIS code-violation endpoint:

`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query`

No alternate county, dataset, provider, owner source, OPA property source, or fuzzy source is authorized.

## Identifier-domain separation

Philadelphia code-violation parcel precedence is:

1. `parcel_id_num`
2. `opa_account_num`
3. `parcel_number`
4. `parcel_id`
5. `opa_number`
6. `account_number`

The generic connector stores the first available value as `Parcel ID`, so `parcel_id_num` may mask raw `opa_account_num`.

The source-evidence boundary MUST preserve `parcel_id_num` and `opa_account_num` separately. It MUST NOT infer an OPA account from persisted `Parcel ID`, and MUST NOT use `opa_account_num` to repair `Parcel ID` or `Canonical Property Key`.

## Exact source-record identity

Version 1 permits only exact positive-decimal ArcGIS `objectid` values supplied by previously certified source-observation evidence.

The identity domains are distinct:

- `sourceRecordId` is the exact raw ArcGIS `objectid` used for external retrieval.
- `persistedSourceObservationKey` is the existing REOS `Source Observation Key`, when supplied, and MUST be preserved without mutation.
- `sourceObservationId` is the canonical composite evaluator observation identity derived from `sourceRecordId`.

The boundary MUST NOT substitute raw `objectid` for the composite `sourceObservationId`.

If a nonblank `persistedSourceObservationKey` is supplied and differs from the derived canonical `sourceObservationId`, the request MUST fail closed as:

`SOURCE_OBSERVATION_IDENTITY_MISMATCH`

The boundary MUST NOT repair either identity value.

Canonical source-observation identity is:

`pa-philadelphia|code_violations|<objectid>`

Examples:

`pa-philadelphia|code_violations|383`

`pa-philadelphia|code_violations|384`

The caller MUST NOT bind an arbitrary `sourceObservationId` to a different `objectid`.

## Exact target and certified references

The acquisition target MUST originate from the existing exact-record selector and remain bound to physical row number, `Distress Lead ID`, `Canonical Property Key`, and persisted target address.

The retriever MUST NOT discover another target.

The retriever MUST NOT broadly scan `DISTRESS_LEADS` to discover siblings.

A future request receives a pre-certified immutable source-reference set. Version 1 requires at least `2` and permits at most `5` distinct references. Duplicate identities fail closed.

## Exact lookup contract

Each certified reference is retrieved independently using exact:

`objectid = <certified-objectid>`

Required request limits:

- fixed certified endpoint;
- exact objectid equality;
- `maxLimit = 1`;
- `returnGeometry = false`;
- no cursor;
- no broad county query;
- projection exactly `objectid,address,parcel_id_num,opa_account_num`.

No `outFields=*` is authorized by this contract.

The generic county connector normalization MUST NOT be used for the returned
raw source row because generic normalization collapses identifier domains.

## Cardinality and required fields

Per certified reference:

- zero rows -> `SOURCE_RECORD_NOT_FOUND`
- multiple rows -> `SOURCE_RECORD_AMBIGUOUS`
- mismatched objectid -> `SOURCE_RECORD_ID_MISMATCH`
- missing required field -> `SOURCE_RECORD_INCOMPLETE`
- transport or endpoint-authority failure -> `SOURCE_RETRIEVAL_FAILED`
- all exact/minimal evidence present -> `SOURCE_EVIDENCE_READY`

Required raw fields are `objectid`, `address`, `parcel_id_num`, and `opa_account_num`.

## Minimal evaluator observation

A successful source row may produce only:

`sourceObservationId`
`propertyAddress`
`parcel_id_num`
`opa_account_num`

`sourceObservationId` comes from canonical exact source identity. `propertyAddress` comes from raw `address`. The parcel-domain fields remain unaliased.

## Atomic fail-closed behavior

The requested source-reference set is atomic. Partial evidence MUST NOT be passed to the range evaluator.

A failure MUST NOT automatically try another objectid, dataset, provider, address search, parcel search, violation-number search, fuzzy matching, geocoding, owner-name matching, or mailing-address matching.

Failure preserves deferred state.

## Scheduler and county isolation

`REOS.CountyCodeViolationSourceRecordDiagnostic` is not the runtime contract for this boundary because it requires zero managed scheduler triggers and performs broader forensic work.

The new future source-evidence boundary MUST NOT require the production county scheduler to be absent.

It MUST NOT inspect, create, delete, disable, or execute scheduler triggers. It MUST NOT execute `REOS.CountyProductionScheduler`, county ingestion, checkpoint writes, cursor writes, collapse, repair, or migration.

The restored production scheduler remains independent.

## No mutation, OPA, owner, classification, or persistence authority

The boundary MUST NOT mutate `Distress Lead ID`, `Canonical Property Key`, `Parcel ID`, `Source Record ID`, `Source Observation Key`, or any physical `DISTRESS_LEADS` row.

It MUST NOT retrieve owner or mailing evidence.

It MUST NOT query `opa_properties_public`.

The future OPA-account-row retrieval required for:

`opaAccountRows`

remains a separate authorization boundary.

This design requires:

`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`

`SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`

`CLASSIFICATION_AUTHORITY_GRANTED=false`

`PERSISTENCE_AUTHORITY_GRANTED=false`

`ROLLOUT_AUTHORITY_GRANTED=false`

`IDENTITY_REPAIR_AUTHORITY_GRANTED=false`

## Motivating deferred case

The motivating case remains:

- representative row `1530`
- sibling row `1532`
- canonical key `property|parcel|pa|philadelphia|1473083`
- target address `1624 N BODINE ST`
- source objectids `383` and `384`
- raw `parcel_id_num = 1473083`
- raw `opa_account_num = 183124510`

This design retrieves neither record.

Rows 1530 and 1532 remain deferred.

## Design-only promotion boundary

This increment creates only:

- this source-evidence retrieval boundary design document.

The next separately authorized design artifact may be:

- its offline design validator.

This increment MUST NOT create:

- source retrieval runtime;
- HTTP implementation;
- Apps Script RPC;
- production wiring;
- persistence logic;
- classification logic;
- scheduler logic;
- trigger logic;
- OPA-account-row lookup implementation.

Successful design creation does not authorize implementation.

## Acquisition safety boundary

This contract MUST NOT populate Qualified Deal Queue, advance acquisition lifecycle, establish ARV, establish repair scope, calculate MAO, authorize an offer, generate an offer, or submit an offer.

Automatic MAO or offer authority still requires both adequate comp-supported ARV and an adequate repair scope through independently certified paths.

No step implies authority for the next step.
