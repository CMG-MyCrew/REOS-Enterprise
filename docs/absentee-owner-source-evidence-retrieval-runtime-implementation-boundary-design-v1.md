# Absentee-Owner Source-Evidence Retrieval Runtime Implementation Boundary Design v1

## Purpose

Define the exact implementation boundary for a future internal read-only Philadelphia code-violation source-evidence retriever used to supply minimal `sourceObservations` to `REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`.

This increment is design only.

It does not create the retriever runtime and does not grant production source-retrieval execution authority.

## Certified predecessor

This boundary is subordinate to:

`Absentee-Owner Source-Evidence Retrieval Boundary Contract Design v1`

The predecessor contract remains authoritative.

This design MUST NOT broaden its source, identity, cardinality, mutation, scheduler, persistence, classification, acquisition, ARV, repair-scope, MAO, or offer boundaries.

## Future internal module

The separately authorized implementation may create exactly one internal runtime module:

`REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever`

Prospective source path:

`build/apps-script-brand/AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js`

The internal callable surface may be:

`retrieve(options)`

No global Apps Script RPC entrypoint is authorized by this design.

No web-app endpoint, menu action, scheduler entrypoint, trigger entrypoint, or autonomous invocation path is authorized.

## Administrative execution boundary

The future runtime MUST require:

`REOS.Security.requireAdmin()`

before external retrieval.

Administrative authority only permits the bounded read-only retrieval operation.

It MUST NOT imply database mutation, scheduler mutation, classification, persistence, rollout, ARV, repair-scope, MAO, or offer authority.

## Allowed runtime dependencies

The future implementation may depend only on the minimum existing runtime surfaces necessary for this boundary, including:

- `REOS.Security.requireAdmin`
- `REOS.CountyAdapters.ArcGIS.fetch`

It MUST NOT depend on or invoke:

- `REOS.Database`
- `REOS.CountyRuntimeBridge.registerConnectors`
- `REOS.CountyConnectorSDK`
- generic connector normalization
- `REOS.CanonicalPropertyIdentity.resolve`
- `PropertiesService`
- `ScriptApp`
- county scheduler functions
- county ingestion
- checkpoint mutation
- cursor mutation
- persistence writers
- owner-evidence lookup
- classification runtime
- Qualified Deal Queue runtime
- acquisition lifecycle runtime

The retriever MUST NOT inspect whether the production county scheduler exists.

## Fixed source authority

Version 1 is restricted to:

`PA-PHILADELPHIA`

dataset:

`code_violations`

and endpoint:

`https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query`

The endpoint MUST be implementation-owned and MUST NOT be caller supplied.

No alternate endpoint, county, dataset, provider, OPA source, owner source, or fallback source is authorized.

## Single-target input contract

One invocation is bound to exactly one already-selected acquisition target.

The future input contains:

`target`

and:

`sourceReferences`

The target MUST contain only the previously certified identity context required to preserve target binding:

- `rowNumber`
- `identity`
- `propertyAddress`

`identity` contains only:

- `Distress Lead ID`
- `Canonical Property Key`

The retriever MUST NOT query `DISTRESS_LEADS` to discover or repair the target.

The retriever MUST NOT discover sibling records.

The retriever MUST NOT change the supplied row number, distress-lead identity, canonical property key, or property address.

## Certified source-reference contract

`sourceReferences` MUST be an immutable caller-supplied array.

Version 1 requires at least:

`2`

and permits at most:

`5`

references.

Each reference MUST contain:

`sourceRecordId`

and may contain:

`persistedSourceObservationKey`

`sourceRecordId` MUST be a canonical positive-decimal ArcGIS `objectid`.

The runtime MUST NOT accept arbitrary SQL, ArcGIS where clauses, URLs, field projections, cursors, offsets, parcel searches, addresses, owner names, or alternate lookup criteria from the caller.

Duplicate `sourceRecordId` values MUST fail closed.

## Canonical observation identity

For each certified `sourceRecordId`, the retriever derives:

`pa-philadelphia|code_violations|<sourceRecordId>`

as:

`sourceObservationId`

If a nonblank `persistedSourceObservationKey` is supplied, it MUST exactly equal the derived `sourceObservationId`.

Mismatch MUST fail closed as:

`SOURCE_OBSERVATION_IDENTITY_MISMATCH`

The retriever MUST NOT repair either value.

## ArcGIS transport contract

Each certified source reference is fetched independently through:

`REOS.CountyAdapters.ArcGIS.fetch`

with the equivalent bounded options:

- fixed certified endpoint;
- `context.limit = 1`;
- empty cursor;
- `maxLimit = 1`;
- exact `where = objectid = <sourceRecordId>`;
- `outFields = objectid,address,parcel_id_num,opa_account_num`;
- `returnGeometry = false`;
- no pagination loop;
- no broad query;
- no alternate lookup.

The adapter-generated `resultRecordCount` therefore remains exactly `1`.

Generic county connector normalization MUST NOT be used.

## Maximum external-call bound

One invocation may perform no more than one exact ArcGIS request per certified source reference.

Because the reference count is bounded from `2` through `5`, one invocation may perform at most:

`5`

source requests.

The retriever MUST NOT expand the reference set during execution.

## Per-reference result handling

For each certified reference:

- zero records -> `SOURCE_RECORD_NOT_FOUND`
- more than one record -> `SOURCE_RECORD_AMBIGUOUS`
- ArcGIS transfer-limit evidence inconsistent with a unique one-record result -> `SOURCE_RECORD_AMBIGUOUS`
- returned objectid mismatch -> `SOURCE_RECORD_ID_MISMATCH`
- missing or unusable required projected field -> `SOURCE_RECORD_INCOMPLETE`
- transport, adapter, JSON, endpoint, or source failure -> `SOURCE_RETRIEVAL_FAILED`
- valid exact record -> eligible for minimal observation construction

The required projected fields are exactly:

- `objectid`
- `address`
- `parcel_id_num`
- `opa_account_num`

`parcel_id_num` and `opa_account_num` remain separate identifier domains.

Neither field may overwrite or repair the other.

Neither field may repair persisted `Parcel ID` or `Canonical Property Key`.

## Minimal source observation

A valid raw source row may be reduced only to:

`sourceObservationId`

`propertyAddress`

`parcel_id_num`

`opa_account_num`

`sourceObservationId` is derived from the certified source record identity.

`propertyAddress` originates only from raw ArcGIS `address`.

`parcel_id_num` originates only from raw ArcGIS `parcel_id_num`.

`opa_account_num` originates only from raw ArcGIS `opa_account_num`.

No owner, mailing, geocoding, fuzzy-address, canonical-identity, or generic-normalization fields may be added.

## Deterministic ordering

Successful `sourceObservations` MUST preserve the exact order of the caller-supplied certified `sourceReferences`.

The retriever MUST NOT sort, rank, discover, or reorder references.

## Atomic fail-closed contract

The entire reference set is atomic.

`SOURCE_EVIDENCE_READY` is permitted only when every certified reference succeeds.

If any reference fails, the result MUST NOT expose a partially usable `sourceObservations` set to downstream evaluation.

Failure MUST preserve the acquisition record in deferred/research state.

A failed reference MUST NOT trigger automatic lookup by another objectid, address, parcel, violation number, owner name, mailing address, geocode, dataset, endpoint, or provider.

## Successful result boundary

A successful future result may report:

- `ok = true`
- mode `READ_ONLY_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVAL`
- phase `absentee_owner_source_evidence_retrieval`
- outcome `SOURCE_EVIDENCE_READY`
- copied target identity
- certified connector and dataset identity
- requested reference count
- retrieved observation count
- complete ordered `sourceObservations`

The retriever MUST NOT invoke `REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator` itself.

Evaluation remains a separate boundary.

## Failure result boundary

A failed future result MUST:

- report `ok = false`;
- report a deterministic failure code;
- identify the bounded failure without mutating source references;
- expose no partially usable evaluator input;
- preserve all downstream authority as false.

## No OPA-account-row authority

This runtime boundary does not retrieve:

`opaAccountRows`

It MUST NOT query:

`opa_properties_public`

OPA-account-row retrieval remains a separate future authorization boundary.

## No owner-evidence authority

The runtime MUST NOT call:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`

It MUST NOT retrieve owner names or mailing evidence.

## Scheduler isolation

The runtime MUST NOT inspect, create, delete, disable, execute, pause, or otherwise interact with the production county scheduler or its triggers.

It MUST NOT require zero scheduler triggers.

It MUST NOT execute county ingestion.

It MUST NOT read or write county checkpoints or cursors.

## Persistence and identity isolation

The runtime MUST NOT read, insert, update, replace, upsert, or delete production acquisition rows.

It MUST NOT mutate:

- `Distress Lead ID`
- `Canonical Property Key`
- `Parcel ID`
- `Source Record ID`
- `Source Record Key`
- `Source Observation Key`

It MUST NOT perform canonical identity repair or migration.

## Offline implementation-validation boundary

A separately authorized implementation may be validated with mocked:

`REOS.CountyAdapters.ArcGIS.fetch`

and mocked:

`REOS.Security.requireAdmin`

Such tests MUST NOT perform external HTTP.

Implementation validation MUST cover at minimum:

- invalid input;
- target binding;
- 1-reference rejection;
- 6-reference rejection;
- duplicate-reference rejection;
- identity mismatch;
- exact request options;
- zero-row handling;
- ambiguous-row handling;
- objectid mismatch;
- incomplete row;
- transport failure;
- atomic failure after an earlier successful reference;
- successful 2-reference retrieval;
- successful 5-reference retrieval;
- deterministic observation ordering;
- absence of database, scheduler, persistence, owner, OPA-account-row, classification, and offer authority.

## Implementation promotion boundary

This design may authorize a later implementation increment to create only:

- `build/apps-script-brand/AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js`
- bounded offline static validator(s)
- bounded offline behavior validator(s)
- bounded offline integration validator(s)

That later implementation increment MUST NOT by itself authorize:

- production source retrieval execution;
- Apps Script RPC;
- deployment;
- scheduler execution;
- trigger execution;
- persistence;
- classification;
- rollout;
- OPA-account-row retrieval;
- owner-evidence retrieval;
- automatic processing of deferred rows.

Implementation existence does not authorize production invocation.

## Motivating deferred case remains deferred

The motivating records remain:

- representative row `1530`
- sibling row `1532`
- target `1624 N BODINE ST`
- source objectids `383` and `384`
- raw `parcel_id_num = 1473083`
- raw `opa_account_num = 183124510`

This design performs no source request for those records.

Rows 1530 and 1532 remain deferred.

## Acquisition safety boundary

This boundary MUST NOT:

- populate Qualified Deal Queue;
- advance acquisition lifecycle;
- establish ARV;
- establish repair scope;
- calculate MAO;
- authorize an offer;
- generate an offer;
- submit an offer.

Automatic MAO or offer authority still requires both adequate comp-supported ARV and an adequate repair scope through independently certified paths.

The following remain false:

`PRODUCTION_SOURCE_RETRIEVAL_EXECUTION_AUTHORITY_GRANTED=false`

`SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`

`OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORITY_GRANTED=false`

`OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`

`CLASSIFICATION_AUTHORITY_GRANTED=false`

`PERSISTENCE_AUTHORITY_GRANTED=false`

`ROLLOUT_AUTHORITY_GRANTED=false`

`IDENTITY_REPAIR_AUTHORITY_GRANTED=false`

`ARV_AUTHORITY_GRANTED=false`

`REPAIR_SCOPE_AUTHORITY_GRANTED=false`

`MAO_AUTHORITY_GRANTED=false`

`OFFER_AUTHORITY_GRANTED=false`

No step implies authority for the next step.
