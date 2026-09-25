# Absentee-Owner Philadelphia Owner Evidence Lookup Design v1

## 1. Purpose

Provide a narrowly bounded, admin-only, read-only evidence surface for
retrieving authoritative Philadelphia Office of Property Assessment owner
evidence for exactly one previously verified `DISTRESS_LEADS` property.

This surface exists only after:

1. bounded candidate discovery identifies a physical candidate;
2. the existing exact-record selector separately reverifies that exact
   physical row and persisted dual identity.

Owner-evidence lookup is observational only.

It does not mutate owner fields, determine absentee status, execute enrichment,
repair identity, run county ingestion, or create acquisition authority.

## 2. Exact target authority

The initial production target for this workstream is the exact-record evidence
already certified for:

- table: `DISTRESS_LEADS`
- rowNumber: `377`
- Distress Lead ID: `DL-20260731203649-4601`
- Canonical Property Key:
  `property|address|pa|philadelphia|19141-4008|5146 n 10th st`
- property address: `5146 N 10TH ST`
- city: `PHILADELPHIA`
- state: `PA`
- ZIP: `19141-4008`

This design does not authorize a lookup for that target.

The values above define the first future certification target only.

## 3. Required upstream evidence

A future lookup request MUST be based on successful evidence from:

`reosAbsenteeOwnerEnrichmentExactRecordEvidence(options)`

The owner-evidence surface MUST NOT discover a `DISTRESS_LEADS` row.

It MUST NOT scan for another acquisition record.

It MUST NOT repair, derive, replace, or reinterpret the persisted:

- `Distress Lead ID`
- `Canonical Property Key`

The exact-record selector remains the acquisition-record authority.

## 4. Authoritative external source

The permitted source class is the City of Philadelphia Office of Property
Assessment current public property roll.

The current public dataset is:

`opa_properties_public`

The implementation MUST use only a separately certified official City of
Philadelphia / OPA public API transport for that dataset.

The caller MUST NOT supply:

- an endpoint;
- a hostname;
- a table name;
- SQL;
- a WHERE clause;
- an owner search;
- an arbitrary filter;
- an alternate provider.

The exact transport endpoint MUST be pinned and source-certified during the
implementation increment before any production lookup is authorized.

## 5. Source-field authority

The owner-evidence contract recognizes only the bounded source fields needed to
identify the property and preserve OPA owner/mailing evidence:

- `parcel_number`
- `location`
- `owner_1`
- `owner_2`
- `mailing_address_1`
- `mailing_address_2`
- `mailing_care_of`
- `mailing_city_state`
- `mailing_street`
- `mailing_zip`

Implementation MUST NOT use `SELECT *`.

Unrelated assessment, valuation, sale, building, geometry, exemption, tax, or
property-characteristic fields are outside this lookup contract.

## 6. Planned implementation surface

Planned implementation:

`build/apps-script-brand/AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js`

Planned public RPC:

`reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(options)`

Neither surface is created by this design increment.

## 7. Administrative authority

The future public RPC MUST call:

`REOS.Security.requireAdmin()`

before any external HTTP request.

Authorization failure MUST occur before network access.

## 8. Fixed geography

Version 1 is limited to:

- city: Philadelphia
- state: Pennsylvania
- country: United States

The implementation MUST reject a target outside Philadelphia, Pennsylvania.

The caller cannot select another county, city, state, or source.

## 9. Exact input contract

Exactly one target is permitted.

Required logical input:

- one physical `rowNumber`;
- `identity["Distress Lead ID"]`;
- `identity["Canonical Property Key"]`;
- one exact verified property address;
- city `PHILADELPHIA`;
- state `PA`;
- one ZIP value when present in exact-record evidence.

Arrays, batches, owner names, owner predicates, arbitrary source identifiers,
pagination instructions, scheduler context, trigger context, and run-all
semantics are prohibited.

The caller MUST NOT provide an owner name to search for.

## 10. Property-address authority

The property address supplied to the lookup MUST originate from the previously
verified exact `DISTRESS_LEADS` record.

The canonical property key MAY corroborate the request but MUST NOT be parsed to
manufacture missing target data.

The owner-evidence lookup MUST NOT change the acquisition-record address.

The implementation MAY normalize only superficial comparison differences such
as:

- case;
- surrounding whitespace;
- repeated internal whitespace.

It MUST NOT perform fuzzy address matching.

It MUST NOT:

- remove unit identity;
- guess street suffixes;
- substitute another street;
- geocode to a different address;
- infer ZIP;
- repair a target address;
- select a nearby parcel.

## 11. Bounded source query

One invocation MAY execute at most one external source request.

The source query MUST:

- target only `opa_properties_public`;
- request only the fields listed in this contract;
- search only for the exact verified property address;
- return at most `5` source rows.

Hard source-result maximum:

`MAX_SOURCE_ROWS = 5`

No automatic pagination is permitted.

No retry loop is permitted.

A source response indicating more than the bounded result can safely establish
MUST fail closed rather than expanding the query.

## 12. Query construction safety

Caller input MUST NOT become executable SQL structure.

Any implementation using an SQL-style API MUST construct the query from a fixed
template.

Only the property-address literal may vary.

The implementation MUST apply a dedicated literal-escaping function.

The caller MUST NOT control:

- selected columns;
- operators;
- table;
- ordering;
- limit;
- comments;
- SQL fragments.

## 13. Existing Philadelphia connector separation

The existing generated Philadelphia connector declares a
`property_assessment` dataset and an `ownerName` mapping.

That declaration is not owner-evidence lookup authority.

Version 1 MUST NOT treat the existing generic county connector as proof of:

- exact one-property lookup behavior;
- owner mailing-address evidence;
- source-row uniqueness;
- bounded HTTP behavior;
- absentee-owner classification.

The new lookup MUST NOT invoke:

- `REOS.CountyRuntimeBridge.registerConnectors`
- `REOS.CountyConnectorSDK.get`
- `REOS.PAPhiladelphiaCountyConnector.fetch`
- county scheduler entrypoints.

This prevents an owner-evidence request from becoming county ingestion.

## 14. Exact source-match semantics

Source rows are evidence candidates only.

After bounded retrieval, the implementation MUST conservatively compare the
source `location` against the verified target property address.

A source row qualifies only when its property location matches under the
permitted superficial normalization rules.

Outcomes are:

- `MATCHED`
- `NO_MATCH`
- `AMBIGUOUS`
- `FAILED`

`MATCHED` requires exactly one qualifying OPA source row.

`NO_MATCH` means zero qualifying source rows.

`AMBIGUOUS` means more than one qualifying source row or otherwise
non-unique source evidence.

`FAILED` means the lookup could not safely establish source evidence because of
authorization, network, schema, parsing, boundedness, or source-integrity
failure.

## 15. MATCHED does not mean absentee

`MATCHED` means only:

"one exact OPA property source row was matched to the verified target property."

It does NOT mean:

- the owner is absentee;
- the property is vacant;
- the mailing address differs from the property address;
- the owner occupies the property;
- enrichment mutation is authorized;
- a deal is qualified.

The owner-evidence surface MUST NOT produce an `absenteeOwner` boolean.

## 16. Owner-name evidence

For a `MATCHED` source row, the implementation MAY preserve:

- raw `owner_1`;
- raw `owner_2`.

Blank values MUST remain blank evidence.

The lookup MAY return an ordered array of nonblank owner-name components.

It MUST NOT guess missing names.

It MUST NOT use an owner name from another source row.

It MUST NOT search the source by owner name as a fallback.

## 17. Owner-mailing evidence

For a `MATCHED` source row, the implementation MAY preserve exactly these raw
mailing components:

- `mailing_address_1`
- `mailing_address_2`
- `mailing_care_of`
- `mailing_city_state`
- `mailing_street`
- `mailing_zip`

Blank mailing components remain blank evidence.

The lookup MUST NOT infer a missing mailing city, state, street, or ZIP.

It MUST NOT substitute the property address for a missing owner mailing
address.

A blank or incomplete mailing address is not affirmative absentee evidence.

## 18. No absentee classification

Owner mailing evidence and property-address evidence MUST remain distinct.

Version 1 MUST NOT compare them to declare:

- absentee;
- owner occupied;
- vacant;
- non-owner occupied.

Any future absentee-classification rule requires a separate design,
implementation, validation, and production authorization.

## 19. Returned evidence boundary

A successful `MATCHED` response SHOULD contain only:

- `ok: true`
- `mode: "READ_ONLY_OWNER_EVIDENCE"`
- phase `absentee_owner_philadelphia_owner_evidence_lookup`
- outcome `MATCHED`
- verified target identity
- verified target property address
- source agency identifier
- source dataset identifier
- source parcel number
- source property location
- raw owner-name evidence
- raw owner-mailing evidence
- lookup timestamp
- bounded source-row count
- required false authority flags

The response MUST NOT return the complete OPA property record.

## 20. Provenance

Every successful source match MUST preserve explicit provenance sufficient to
show:

- source agency: Philadelphia Office of Property Assessment;
- source dataset: current Philadelphia properties;
- source table: `opa_properties_public`;
- source parcel number;
- source property location;
- lookup timestamp;
- lookup query mode: exact property address.

The lookup timestamp means retrieval time only.

It MUST NOT be represented as the OPA record's last-modified timestamp unless a
separately certified source field proves that fact.

## 21. Required authority denials

Every result, including success and failure, MUST preserve false authority for:

- `productionDataMutationAuthorityGranted: false`
- `ownerEvidencePersistenceAuthorityGranted: false`
- `canonicalIdentityRepairAuthorityGranted: false`
- `migrationAuthorityGranted: false`
- `schedulerAuthorityGranted: false`
- `triggerAuthorityGranted: false`
- `connectorExecutionAuthorityGranted: false`
- `certificationMutationAuthorityGranted: false`
- `automaticOfferAuthorityGranted: false`

## 22. Production mutation prohibition

The owner-evidence lookup MUST NOT call or reach:

- `REOS.Database.insert`
- `REOS.Database.update`
- `REOS.Database.upsert`
- database deletion APIs
- `setValue`
- `setValues`
- `appendRow`
- `deleteRow`
- `SpreadsheetApp.flush`
- Script Property writes
- checkpoint writes
- cursor writes
- trigger installation
- trigger deletion
- acquisition mutation APIs

No owner field may be written by this lookup.

## 23. Absentee-owner pipeline isolation

The lookup MUST NOT directly invoke:

- `REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize`
- `REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan`
- `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare`
- `REOS.AbsenteeOwnerEnrichmentExecutor.execute`
- `reosAbsenteeOwnerEnrichmentCertifySingleRecord`

External owner evidence does not itself authorize persistence.

## 24. County isolation

The lookup MUST NOT execute or alter:

- county ingestion;
- county connectors;
- county production scheduler;
- county checkpoints;
- county cursors;
- county collapse;
- county durable-identity migration;
- county repair;
- county blocked-storage backfill;
- county mutation-exclusion lease state.

The lookup is a distinct absentee-owner evidence surface.

## 25. Failure semantics

The lookup MUST fail closed for:

- unauthorized caller;
- malformed input;
- missing dual persisted identity;
- unsupported city or state;
- blank verified property address;
- unavailable official source;
- unexpected source hostname or source contract;
- HTTP failure;
- invalid response;
- required source field missing;
- source schema drift;
- result count exceeding the bounded contract;
- zero exact property matches;
- multiple exact property matches;
- unsafe query-construction condition.

Failure MUST NOT trigger:

- owner-name fallback search;
- fuzzy address matching;
- another endpoint;
- another provider;
- pagination;
- retry loops;
- county execution;
- identity repair;
- production mutation.

## 26. NO_MATCH semantics

`NO_MATCH` is non-affirmative evidence.

`NO_MATCH` MUST NOT be converted into:

- `absenteeOwner=false`;
- owner occupied;
- vacant;
- unknown owner replaced by property address;
- enrichment mutation authority.

No owner fields may be cleared because of `NO_MATCH`.

## 27. AMBIGUOUS semantics

`AMBIGUOUS` is non-authoritative.

When multiple source rows qualify, the implementation MUST NOT choose:

- the first row;
- the newest row;
- the row with more owner fields;
- the row with a mailing address;
- the row with the highest assessment;
- any arbitrary winner.

Manual or separately designed disambiguation is required.

## 28. FAILED semantics

`FAILED` means source evidence could not safely be established.

A failed lookup MUST NOT be automatically retried inside the same invocation.

Failure MUST NOT mutate existing owner evidence.

## 29. Idempotence

The lookup is observational.

Repeated invocation against unchanged source state and identical exact target
input SHOULD return equivalent source evidence except for retrieval timestamps
or source updates.

It has no intended mutation side effects.

## 30. Data minimization

The lookup MUST request and return only the evidence required for owner
identification and mailing provenance.

It MUST NOT retrieve complete source rows when a bounded column projection is
available.

It MUST NOT retain unrelated OPA fields.

## 31. Sanitizer handoff

A future separately authorized step MAY transform a `MATCHED` owner-evidence
result into sanitizer input.

That transformation is not part of this lookup.

The lookup itself MUST NOT create an attempted persistence patch.

A later sanitizer input may include only fields already permitted by the
existing absentee-owner sanitizer:

- `Owner Name`
- `Owner Mailing Address`

No other acquisition fields may be written.

## 32. Acquisition safety gate

Owner evidence MUST NOT:

- create or update Qualified Deal Queue authority;
- advance acquisition lifecycle;
- establish ARV;
- establish repair scope;
- calculate MAO;
- authorize an offer;
- generate an offer;
- submit an offer.

Automatic MAO or offer authority requires both adequate comp-supported ARV and
an adequate repair scope through independently certified paths.

Absentee-owner evidence cannot bypass that gate.

## 33. First production target

After implementation, validation, merge, and deployment certification, the
first owner-evidence production lookup MUST be separately authorized for only:

- `DISTRESS_LEADS` row `377`;
- `DL-20260731203649-4601`;
- canonical property key
  `property|address|pa|philadelphia|19141-4008|5146 n 10th st`;
- `5146 N 10TH ST, PHILADELPHIA, PA 19141-4008`.

No batch lookup is authorized.

No second candidate is implicitly authorized.

## 34. Implementation certification sequence

If separately authorized, implementation proceeds through:

1. live official-source schema and endpoint preflight;
2. exact official endpoint/hostname certification;
3. implementation;
4. static validator;
5. behavioral validator with HTTP mocks only;
6. proof of fixed `opa_properties_public` source authority;
7. proof of explicit bounded source projection;
8. proof of `MAX_SOURCE_ROWS = 5`;
9. proof of at most one external request per invocation;
10. proof of no automatic pagination or retries;
11. proof of exact-address conservative matching;
12. proof of `MATCHED / NO_MATCH / AMBIGUOUS / FAILED` behavior;
13. proof that no absentee classification occurs;
14. proof that no production writes occur;
15. runtime integration reconciliation if required;
16. CI;
17. merge;
18. deployment certification;
19. explicit authorization for one production owner-evidence lookup;
20. one lookup for the separately certified exact target;
21. evidence review;
22. separate authorization for any sanitizer/persistence preparation.

No step implies authority for the next step.

## 35. Promotion boundary

Successful owner-evidence retrieval does not authorize:

- owner-field persistence;
- sanitizer execution;
- persistence planning;
- executor execution;
- certification mutation;
- bulk owner lookup;
- scheduled owner lookup;
- automatic retry;
- absentee classification;
- canonical identity repair;
- county execution;
- scheduler changes;
- trigger changes;
- MAO;
- offer generation;
- automatic offer authority.

The surface remains bounded, observational, source-specific, and read-only.
