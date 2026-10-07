# Absentee-Owner Source-Evidence Retriever Production Execution Boundary Design v1

## 1. Purpose

Define the exact future production-execution boundary for the already merged internal Philadelphia code-violation source-evidence retriever:

`REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever`

This increment is design only.

It does not create a production entrypoint.

It does not create a global Apps Script RPC.

It does not deploy source.

It does not invoke the retriever against production.

It does not process rows 1530 or 1532.

It does not grant production source-retrieval execution authority.

## 2. Certified authority chain

This boundary is subordinate to all of the following existing certified authority:

1. `Absentee-Owner Source-Evidence Retrieval Boundary Contract Design v1`
2. `Absentee-Owner Source-Evidence Retrieval Runtime Implementation Boundary Design v1`
3. merged internal retriever:
   `REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever`
4. PR `#301`
5. merge commit:
   `6fb172858ee3eeb45af1ab9bf78c20a4a08e3ee9`
6. post-merge CI run:
   `37614231830`
7. positive bounded post-merge implementation evidence review

This successor design MUST NOT broaden the certified source, dataset, endpoint, identity, cardinality, mutation, scheduler, persistence, classification, acquisition, ARV, repair-scope, MAO, or offer boundaries.

## 3. Existing internal retriever remains unchanged

The merged internal runtime remains:

`REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.retrieve(options)`

at:

`build/apps-script-brand/AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js`

This design does not modify that runtime.

Its existing fixed source remains:

- connector: `PA-PHILADELPHIA`
- dataset: `code_violations`
- endpoint:
  `https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query`
- projection:
  `objectid,address,parcel_id_num,opa_account_num`

The existing maximum external-source-request count remains:

`5`

## 4. Future production entrypoint

A separately authorized future implementation may create exactly one internal production entrypoint module:

`REOS.AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint`

Prospective source path:

`build/apps-script-brand/AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js`

Its internal callable surface may be exactly:

`execute(options)`

A separately authorized future implementation may expose exactly one global Apps Script RPC:

`reosAbsenteeOwnerSourceEvidenceRetrieveSingleRecord(options)`

No second RPC is authorized.

No web-app endpoint is authorized.

No menu action is authorized.

No scheduler entrypoint is authorized.

No trigger entrypoint is authorized.

No batch entrypoint is authorized.

No run-all entrypoint is authorized.

This design alone does not authorize creation of the module or RPC.

## 5. Manual administrative execution only

Future production execution v1 is manual administrative execution only.

Before any production target read or external source request, the future entrypoint MUST require:

`REOS.Security.requireAdmin()`

The merged retriever also independently requires admin authority.

The resulting nested administrative checks are permitted and MUST NOT be treated as retry behavior.

No non-admin execution is authorized.

## 6. Exact future production input

The future production RPC may accept exactly one object containing only:

- `rowNumber`
- `identity`
- `sourceReferences`

It MUST NOT accept:

- `target`
- caller-supplied `propertyAddress`
- county
- connector
- dataset
- endpoint
- where clause
- field projection
- cursor
- offset
- batch
- targets array
- search criteria
- owner name
- mailing address
- parcel search
- address search
- geocode
- fuzzy-match criteria

## 7. Exact target identity input

`rowNumber` MUST be a finite integer data-row number of at least `2`.

`identity` MUST contain only:

- `Distress Lead ID`
- `Canonical Property Key`

Both values MUST be nonblank.

The future entrypoint MUST NOT accept caller-supplied target address authority.

The future entrypoint MUST NOT repair either identity.

## 8. Exact-record production binding

After complete request validation and before calling the source retriever, the future production entrypoint MUST invoke exactly once:

`REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(...)`

using only:

- `rowNumber`
- `Distress Lead ID`
- `Canonical Property Key`

The exact-record selector is the only authorized production `DISTRESS_LEADS` read authority for this boundary.

The production entrypoint MUST NOT directly invoke:

`REOS.Database`

The selector result MUST match the requested:

- physical row number
- `Distress Lead ID`
- `Canonical Property Key`

A selector failure or mismatch MUST fail closed before any ArcGIS request.

## 9. Trusted property-address derivation

The future production entrypoint MUST derive:

`target.propertyAddress`

only from the verified exact-record selector result:

`record.Address`

The caller MUST NOT supply `target.propertyAddress`.

A missing, blank, or unusable verified `record.Address` MUST fail closed before source retrieval.

The entrypoint MUST NOT repair the verified address through geocoding, normalization lookup, another row, sibling discovery, or another source.

## 10. Production source-reference input

`sourceReferences` MUST be an explicit immutable caller-supplied array.

Version 1 requires at least:

`2`

and permits at most:

`5`

references.

Each reference MUST contain:

`sourceRecordId`

and may contain:

`persistedSourceObservationKey`

No source reference may be discovered automatically.

Duplicate `sourceRecordId` values MUST fail the complete request before production source retrieval.

## 11. Production-facing sourceRecordId representation

The production entrypoint MUST accept `sourceRecordId` only as a canonical positive-decimal string matching:

`^[1-9][0-9]*$`

Examples accepted:

`"383"`

`"384"`

Examples rejected:

`383`

`384`

`"0383"`

`"383 "`

`" 383"`

`"383.0"`

`"3e2"`

`0`

`-1`

The future production wrapper MUST NOT coerce numeric values into strings.

The future production wrapper MUST NOT trim or repair a noncanonical source-record identity.

The merged internal retriever may continue to accept its already-certified bounded equivalent numeric representation internally.

That internal representational tolerance MUST NOT broaden the future production-facing RPC contract.

## 12. Persisted source-observation identity

For each canonical production `sourceRecordId`, the canonical observation identity remains:

`pa-philadelphia|code_violations|<sourceRecordId>`

If a nonblank:

`persistedSourceObservationKey`

is supplied, it MUST exactly equal the derived canonical observation identity.

Mismatch MUST fail closed before external retrieval.

The production entrypoint MUST NOT repair either identity.

## 13. Whole-request validation before production reads

After administrative authorization and before the exact-record selector is invoked, the complete request MUST be validated for:

- exact top-level keys
- row-number syntax
- exact identity keys
- nonblank dual identity
- source-reference array type
- reference count from 2 through 5
- exact reference keys
- canonical positive-decimal string `sourceRecordId`
- duplicate source-record identity
- persisted source-observation identity consistency

A malformed request MUST cause:

- zero exact-record target reads
- zero ArcGIS requests
- zero evaluator calls
- zero persistence
- zero acquisition mutation

## 14. Exact future execution sequence

One valid future production invocation MUST execute only this sequence:

1. require administrative authority
2. validate the complete request
3. invoke exact-record selector exactly once
4. verify exact target identity and physical-row binding
5. derive property address from verified `record.Address`
6. construct the existing retriever `target`
7. forward the unchanged validated `sourceReferences`
8. invoke the merged source-evidence retriever exactly once
9. return bounded read-only result evidence

No additional production stage is authorized.

## 15. Exact retriever request construction

The future wrapper may construct only:

`target`

containing:

- verified `rowNumber`
- verified `identity`
- verified `propertyAddress`

and:

`sourceReferences`

containing the exact validated source references.

The wrapper MUST NOT add alternate lookup fields.

The wrapper MUST NOT change source-reference order.

The wrapper MUST NOT expand the reference set.

## 16. Retriever invocation cardinality

The future production entrypoint may invoke:

`REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.retrieve(...)`

at most once per production RPC invocation.

The retriever itself remains bounded to at most one exact ArcGIS request per source reference.

Therefore one production RPC invocation permits at most:

- `1` exact-record target read
- `1` retriever invocation
- `5` ArcGIS source requests

No automatic retry is authorized at any stage.

## 17. No source-reference discovery

The future production entrypoint MUST NOT derive source references from:

- `DISTRESS_LEADS`
- county ingestion
- county checkpoints
- county cursors
- another source row
- address matching
- parcel matching
- violation number
- owner name
- mailing address
- geocoding
- OPA
- generic connector output

The source-reference set must already be explicitly certified before invocation.

## 18. Failure isolation

Any entrypoint failure before retriever invocation MUST result in zero ArcGIS requests.

Any retriever failure MUST preserve the retriever's existing atomic fail-closed behavior.

No partial `sourceObservations` may be elevated to downstream evaluation.

No failure may trigger another source lookup.

No failed request may retry automatically.

## 19. No evaluator authority

The future production entrypoint MUST NOT invoke:

`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`

Retrieval and evaluation remain separate authorization boundaries.

A successful production source-evidence retrieval does not establish:

`RANGE_CONTAINMENT_CERTIFIED_MATCH=true`

## 20. No OPA-account-row authority

The future production entrypoint MUST NOT retrieve:

`opaAccountRows`

It MUST NOT query:

`opa_properties_public`

OPA-account-row retrieval remains a separate future authorization boundary.

## 21. No owner-evidence authority

The future production entrypoint MUST NOT invoke:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`

It MUST NOT retrieve owner names.

It MUST NOT retrieve owner mailing evidence.

## 22. No persistence authority

The future production entrypoint MUST NOT:

- insert production acquisition rows
- update production acquisition rows
- replace production acquisition rows
- delete production acquisition rows
- append classification evidence
- persist source observations
- persist retrieval results
- mutate `Source Record ID`
- mutate `Source Record Key`
- mutate `Source Observation Key`
- mutate `Parcel ID`
- mutate `Canonical Property Key`

The exact-record selector remains read-only.

The source retriever remains read-only.

## 23. No scheduler or trigger authority

The future production entrypoint MUST NOT:

- inspect scheduler existence
- create a scheduler
- execute a scheduler
- pause a scheduler
- delete a scheduler
- create a trigger
- execute a trigger
- delete a trigger
- install recurring execution
- schedule retries
- schedule continuation

Manual invocation authority does not imply recurring authority.

## 24. County isolation

The future production entrypoint MUST NOT execute or alter:

- county connectors
- county ingestion
- county checkpoints
- county cursors
- county collapse
- county repair
- county mutation-exclusion lease state
- county scheduler state

Existing county operation remains independent.

## 25. No generic absentee-owner connector authority

The historical:

`reosConnectorHandleAbsenteeOwners`

is not production source-evidence retrieval authority.

It MUST NOT be invoked, modified, or used as fallback by this boundary.

## 26. No classification or acquisition authority

Successful source retrieval MUST NOT:

- classify absentee ownership
- infer owner occupancy
- infer vacancy
- populate Qualified Deal Queue
- create a deal
- change acquisition status
- advance acquisition lifecycle
- establish ARV
- establish repair scope
- calculate MAO
- write MAO
- calculate Suggested Offer
- generate an offer
- submit an offer

## 27. Acquisition safety gate

Automatic MAO or offer authority remains blocked unless both:

1. adequate comp-supported ARV; and
2. adequate repair scope

exist through independently certified acquisition paths.

Source-evidence retrieval cannot satisfy, substitute for, bypass, replace, or weaken either requirement.

## 28. Motivating rows remain deferred

The motivating case remains:

- representative row `1530`
- sibling row `1532`
- property address `1624 N BODINE ST`
- source objectids `383` and `384`
- raw `parcel_id_num = 1473083`
- raw `opa_account_num = 183124510`

This design does not invoke the retriever for either row.

This design does not authorize row 1530.

This design does not authorize row 1532.

Rows 1530 and 1532 remain deferred.

## 29. Deployment remains separate

Successful implementation of the future production entrypoint MUST NOT itself authorize deployment.

Deployment requires a separate deployment preflight and explicit deployment authorization.

A deployed RPC MUST remain dormant until a separately certified invocation is authorized.

No deployment step may silently invoke the RPC.

## 30. Per-invocation authorization

Future production execution authority MUST be request-specific.

A later invocation authorization MUST freeze at minimum:

- deployed Apps Script version
- production deployment identity
- exact physical row number
- exact `Distress Lead ID`
- exact `Canonical Property Key`
- exact ordered source-reference set
- expected canonical observation identities
- maximum request count
- expected no-mutation boundary

Authorization for one invocation MUST NOT authorize another target.

Authorization for one invocation MUST NOT authorize batch operation.

Authorization for one invocation MUST NOT authorize recurrence.

## 31. Production execution stages

Production promotion MUST proceed only through separately certified stages:

1. certify this design
2. merge this design
3. post-merge design CI
4. separately authorize production-entrypoint implementation
5. implement entrypoint plus offline validators
6. implementation PR and CI
7. merge implementation
8. post-merge implementation CI
9. implementation evidence review
10. deployment preflight
11. explicit deployment authorization
12. exact deployment certification
13. target-specific invocation preflight
14. explicit one-invocation authorization
15. execute exactly one production invocation
16. verify returned evidence and no mutation
17. separately authorize any downstream evaluator input

No step implies authority for the next step.

## 32. Future behavior validation

A separately authorized implementation MUST validate at minimum:

1. admin denial before production read
2. missing options
3. extra top-level field
4. invalid row number
5. invalid identity shape
6. blank distress-lead identity
7. blank canonical property key
8. one source reference rejected
9. six source references rejected
10. duplicate source references rejected
11. numeric `sourceRecordId` rejected
12. leading-zero sourceRecordId rejected
13. whitespace sourceRecordId rejected
14. decimal sourceRecordId rejected
15. scientific-notation sourceRecordId rejected
16. persisted source-observation identity mismatch rejected
17. malformed request causes zero exact-record reads
18. malformed request causes zero ArcGIS calls
19. selector failure causes zero ArcGIS calls
20. selector row mismatch fails closed
21. selector distress-lead mismatch fails closed
22. selector canonical-key mismatch fails closed
23. missing verified `record.Address` fails closed
24. verified property address is used instead of caller authority
25. source-reference order is preserved
26. retriever called exactly once
27. maximum five ArcGIS source requests
28. retriever failure remains atomic
29. success exposes read-only source evidence only
30. no evaluator invocation
31. no OPA-account-row lookup
32. no owner-evidence lookup
33. no persistence
34. no scheduler or trigger interaction
35. no classification authority
36. no acquisition lifecycle authority
37. no ARV, repair-scope, MAO, or offer authority
38. rows 1530 and 1532 remain unauthorized

## 33. Required future implementation dependencies

The future production entrypoint may depend only on:

- `REOS.Security.requireAdmin`
- `REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence`
- `REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.retrieve`

It MUST NOT directly depend on:

- `REOS.Database`
- `SpreadsheetApp`
- `UrlFetchApp`
- `PropertiesService`
- `ScriptApp`
- `REOS.CountyRuntimeBridge`
- `REOS.CountyConnectorSDK`
- `REOS.CanonicalPropertyIdentity.resolve`
- `REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`
- `REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`
- classification runtime
- persistence runtime
- Qualified Deal Queue runtime
- acquisition lifecycle runtime

## 34. Authority flags remain false

This design requires the following to remain false:

`PRODUCTION_SOURCE_RETRIEVAL_EXECUTION_AUTHORITY_GRANTED=false`

`SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`

`OPA_ACCOUNT_ROW_RETRIEVAL_AUTHORITY_GRANTED=false`

`OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`

`CLASSIFICATION_AUTHORITY_GRANTED=false`

`PERSISTENCE_AUTHORITY_GRANTED=false`

`ROLLOUT_AUTHORITY_GRANTED=false`

`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`

`ARV_AUTHORITY_GRANTED=false`

`REPAIR_SCOPE_AUTHORITY_GRANTED=false`

`MAO_AUTHORITY_GRANTED=false`

`OFFER_AUTHORITY_GRANTED=false`

This design creates no runtime authority.

## 35. Contract invariant

The v1 production-execution invariant is:

manual admin invocation
+ one explicit physical target identity
+ exact-record verification
+ property address derived from verified production row
+ 2 through 5 explicit canonical string objectids
+ exactly one bounded internal retriever invocation
+ at most five exact ArcGIS requests
= read-only source-evidence result only

and:

no target discovery
+ no source-reference discovery
+ no batch
+ no retry
+ no scheduler
+ no persistence
+ no evaluator
+ no OPA-account-row lookup
+ no owner lookup
+ no classification
+ no acquisition lifecycle
+ no ARV/repair/MAO/offer authority.

No step implies authority for the next step.
