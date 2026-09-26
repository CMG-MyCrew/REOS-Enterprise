# Absentee-Owner Classification Single-Record Read-Only Certification Entrypoint Contract v1

## 1. Purpose

Define a narrowly bounded, admin-only, single-record, read-only production
certification entrypoint that may compose the already-certified absentee-owner
evidence and classification layers for exactly one existing canonical
`DISTRESS_LEADS` record.

This entrypoint exists only to permit a separately authorized production
certification observation of the deterministic absentee-owner classification
pipeline.

It grants no persistence, enrichment mutation, scheduler, trigger, acquisition,
Qualified Deal Queue, ARV, repair-scope, MAO, offer-generation, or
offer-submission authority.

This contract is design authority only.

It does not create the runtime entrypoint and does not authorize a production
invocation.

## 2. Existing certified upstream surfaces

The future entrypoint MUST compose only these existing certified runtime
surfaces:

1. `REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(...)`
2. `REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup(...)`
3. `REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(...)`
4. `REOS.AbsenteeOwnerClassification.classify(...)`

No stage may be skipped, substituted, reordered, or replaced by caller-supplied
evidence.

The future entrypoint MUST NOT call the mutation-capable enrichment
certification pipeline.

## 3. Planned implementation surface

A future implementation may create exactly one new Apps Script runtime module:

`build/apps-script-brand/AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js`

The proposed global certification RPC is:

`reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord(options)`

This contract does not create either surface.

The entrypoint is a certification orchestration surface only.

It is not generic absentee-owner classification authority.

## 4. Relationship to existing classifier and comparison contracts

The existing comparison and classification modules remain internal-only.

This contract does not add:

- a standalone owner-evidence comparison RPC;
- a standalone classifier RPC; or
- generic public access to either internal module.

The only future RPC contemplated here is the narrowly bounded orchestration
entrypoint described by this contract.

`REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(...)` remains internal.

`REOS.AbsenteeOwnerClassification.classify(...)` remains internal.

## 5. Administrative authority

The future entrypoint MUST call:

`REOS.Security.requireAdmin()`

before invoking the exact-record selector or any other pipeline stage.

An admin failure MUST occur before:

- spreadsheet access;
- exact-record selection;
- external HTTP;
- OPA lookup;
- comparison;
- classification; or
- any other production read.

The existing exact-record selector and OPA lookup may independently repeat
their own admin checks.

Those existing checks MUST NOT be weakened or removed.

## 6. Exact input contract

One invocation accepts exactly one target object.

The only permitted top-level input keys are:

- `rowNumber`
- `identity`

`rowNumber` MUST be one finite integer physical data-row number greater than
the header row.

`identity` MUST contain exactly:

- `Distress Lead ID`
- `Canonical Property Key`

Both identity values MUST be nonblank.

No other caller-supplied input is permitted.

## 7. Caller-supplied address prohibition

The caller MUST NOT supply:

- `Address`
- `propertyAddress`
- `City`
- `city`
- `State`
- `state`
- `Zip`
- `zip`
- parcel number
- owner name
- mailing address
- OPA endpoint
- source table
- SQL
- query fragments
- provider identity
- classification outcome
- comparison evidence
- owner evidence
- persistence patch

Address authority must originate only from the exact verified
`DISTRESS_LEADS` row.

## 8. Exact-record selector authority

The first pipeline stage MUST be:

`REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(options)`

The future entrypoint MUST NOT independently access `SpreadsheetApp`,
`REOS.Database`, or another record-discovery surface.

The selector remains responsible for:

- bounded header resolution;
- one exact physical row read;
- persisted `Distress Lead ID` verification;
- persisted `Canonical Property Key` verification; and
- returning the verified row record.

Selector failure MUST stop the pipeline before OPA lookup.

## 9. Required exact-record evidence

A successful selector result is eligible only when it preserves:

- `ok: true`;
- `mode: READ_ONLY`;
- phase `absentee_owner_exact_record_evidence`;
- table `DISTRESS_LEADS`;
- the requested physical `rowNumber`;
- exact persisted `Distress Lead ID`;
- exact persisted `Canonical Property Key`; and
- the complete verified row record.

All selector authority flags required by its certified contract MUST remain
false.

Malformed selector output MUST fail closed before HTTP.

## 10. Canonical DISTRESS_LEADS address fields

The future entrypoint may derive the OPA lookup target only from these exact
verified row headers:

- `Address`
- `City`
- `State`
- `Zip`

These names are the current protected `DISTRESS_LEADS` base-schema headers.

The entrypoint MUST NOT parse the Canonical Property Key to manufacture any of
these values.

The entrypoint MUST NOT repair, infer, geocode, fuzzy-match, replace, or
otherwise manufacture a missing address component.

## 11. Lookup request derivation

After exact-record verification, the future entrypoint MUST construct the OPA
lookup request internally from:

- selector `target.rowNumber`;
- selector persisted dual identity;
- `record["Address"]`;
- `record["City"]`;
- `record["State"]`; and
- `record["Zip"]` when nonblank.

No caller-supplied replacement may participate.

A blank required property address, city, or state MUST fail closed before
external HTTP.

A blank ZIP MAY be omitted so that the existing owner-evidence lookup contract
can preserve insufficient-evidence semantics.

## 12. Philadelphia owner-evidence lookup authority

The second pipeline stage MUST be:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup(lookupRequest)`

The entrypoint MUST invoke the lookup at most once.

The entrypoint MUST NOT call `UrlFetchApp` directly.

The existing lookup remains responsible for:

- Philadelphia/PA restriction;
- fixed OPA endpoint;
- fixed `opa_properties_public` table;
- fixed projected source fields;
- exact property-address matching;
- SQL literal escaping;
- `MAX_SOURCE_ROWS = 5`;
- at most one HTTP request; and
- fail-closed source validation.

The entrypoint MUST NOT broaden any of those boundaries.

## 13. Owner-name isolation

OPA owner-name fields may exist inside the lookup evidence because the existing
owner-evidence lookup preserves source evidence.

Owner names MUST NOT participate in:

- target selection;
- address matching;
- owner-evidence comparison;
- classification;
- scoring; or
- downstream authorization.

The future entrypoint MUST NOT inspect, normalize, compare, score, or branch on
owner-name values.

## 14. Comparison authority

The third pipeline stage MUST be:

`REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(ownerEvidence)`

The entrypoint MUST invoke comparison at most once.

It MUST pass the lookup result directly as the comparison input.

The entrypoint MUST NOT manufacture comparison evidence.

It MUST NOT implement a second address-normalization or comparison algorithm.

Lookup outcomes that are not eligible for comparison MUST remain fail-closed
through the existing comparison contract.

## 15. Classification authority

The fourth pipeline stage MUST be:

`REOS.AbsenteeOwnerClassification.classify(comparisonEvidence)`

The entrypoint MUST invoke classification at most once.

It MUST pass only the output returned by the certified comparison layer.

It MUST NOT classify raw owner evidence.

It MUST NOT classify directly from a `DISTRESS_LEADS` row.

It MUST NOT implement its own outcome mapping.

## 16. Classification semantics

The existing exact mapping remains authoritative:

- `MAILING_ADDRESS_DIFFERS` -> `ABSENTEE_OWNER_INDICATED`
- `MAILING_ADDRESS_MATCHES` -> `OWNER_MAILING_MATCHED`
- `INSUFFICIENT_MAILING_EVIDENCE` -> `INSUFFICIENT_CLASSIFICATION_EVIDENCE`
- `INELIGIBLE_OWNER_EVIDENCE` -> `INELIGIBLE_COMPARISON_EVIDENCE`

`ABSENTEE_OWNER_INDICATED` means only that the certified official owner mailing
address differs from the certified subject property address.

It does not establish physical occupancy or vacancy.

`OWNER_MAILING_MATCHED` does not establish owner occupancy.

## 17. Successful return boundary

On a successfully completed four-stage pipeline, the future entrypoint SHOULD
return the exact certified classifier result without converting it into broader
authority.

It MUST NOT append:

- raw `DISTRESS_LEADS` record data;
- raw owner names;
- raw OPA owner-name evidence;
- raw owner-mailing evidence;
- persistence instructions;
- acquisition scoring;
- Qualified Deal Queue state;
- lifecycle state;
- ARV;
- repair scope;
- MAO; or
- offer data.

The certified classifier result is the terminal result of the read-only
entrypoint.

## 18. Exact-record failure result

If exact-record verification fails, the future entrypoint MUST stop before OPA
lookup.

It MAY return a bounded fail-closed orchestration result identifying the
selector failure.

Such a failure result MUST NOT claim a classification outcome that was never
produced.

It MUST preserve all downstream authorities as false.

## 19. No persistence

The future entrypoint MUST NOT call:

- `REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize`
- `REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan`
- `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare`
- `REOS.AbsenteeOwnerEnrichmentExecutor.execute`
- `reosAbsenteeOwnerEnrichmentCertifySingleRecord`

It MUST NOT write:

- `Owner Name`
- `Owner Mailing Address`
- an absentee-owner field
- an occupancy field
- a vacancy field
- `Updated At`
- any other production cell

Classification persistence requires a separate future contract.

## 20. No direct data mutation primitive

The future entrypoint itself MUST NOT call:

- `REOS.Database.insert`
- `REOS.Database.update`
- `REOS.Database.upsert`
- database deletion APIs
- `setValue`
- `setValues`
- `appendRow`
- `deleteRow`
- `SpreadsheetApp.flush`
- property writes
- cache writes
- checkpoint writes
- cursor writes

The entrypoint owns no physical mutation primitive.

## 21. Generic connector isolation

The historical:

`reosConnectorHandleAbsenteeOwners`

is not evidence, comparison, classification, or certification authority.

The future entrypoint MUST NOT call, retrofit, or depend on that connector.

It MUST NOT call generic county connector execution.

## 22. Legacy acquisition-scoring isolation

The future entrypoint MUST NOT invoke or depend on historical
`AcquisitionDistressIntelligence` absentee-owner scoring.

The returned classification MUST NOT automatically enter legacy acquisition
scoring.

No legacy `Absentee Owner`, `Absentee`, or `Owner Occupied` field is
classification authority for this entrypoint.

## 23. Cardinality and automation prohibition

Exactly one record is permitted per invocation.

The entrypoint MUST NOT accept or implement:

- arrays of targets;
- batches;
- source-wide execution;
- pagination;
- retry queues;
- automatic iteration;
- run-all behavior;
- scheduler context;
- trigger context;
- recurring execution; or
- ingestion-time execution.

## 24. County isolation

The entrypoint MUST NOT execute or alter:

- county connectors;
- county scheduler;
- county checkpoints;
- county cursors;
- county durable-identity migration;
- county collapse;
- county repair;
- county blocked-storage backfill;
- county mutation-exclusion lease state.

The target may be a county-originated record only because it already exists as
a canonical `DISTRESS_LEADS` record.

## 25. Required design safety boundaries

1. single-record input only
2. admin authority before every pipeline stage
3. exact persisted dual identity required
4. fixed `DISTRESS_LEADS` target through certified selector only
5. no caller-supplied address override
6. address authority derived only from verified row
7. exact headers `Address`, `City`, `State`, `Zip`
8. no canonical-key address derivation
9. at most one certified Philadelphia OPA lookup
10. no direct entrypoint HTTP
11. no alternate owner-evidence provider
12. no owner-name matching or classification
13. no fuzzy address matching
14. no geocoding
15. certified comparison layer only
16. certified classification layer only
17. no standalone comparison RPC
18. no standalone classifier RPC
19. no raw owner evidence in successful final return
20. no batch classification
21. no scheduler or trigger authority
22. no enrichment or classification persistence
23. no direct database or spreadsheet mutation
24. no generic absentee connector authority
25. no legacy acquisition scoring authority
26. no Qualified Deal Queue authority
27. no acquisition lifecycle authority
28. no ARV authority
29. no repair-scope or MAO authority
30. no offer-generation or offer-submission authority

## 26. Future implementation behavior cases

1. admin denial stops before selector invocation
2. missing options fail closed before selector invocation
3. unexpected top-level option fails closed
4. invalid physical row fails closed
5. missing Distress Lead ID fails closed
6. missing Canonical Property Key fails closed
7. selector failure stops before OPA lookup
8. malformed selector success evidence stops before OPA lookup
9. persisted identity mismatch cannot be repaired by entrypoint
10. blank verified Address stops before OPA lookup
11. blank verified City stops before OPA lookup
12. blank verified State stops before OPA lookup
13. lookup request is derived only from verified row evidence
14. caller cannot override address, city, state, or ZIP
15. owner-evidence lookup executes at most once
16. comparison executes at most once
17. classifier executes at most once
18. mailing-address difference maps through to ABSENTEE_OWNER_INDICATED
19. mailing-address match maps through to OWNER_MAILING_MATCHED
20. insufficient mailing evidence maps through to INSUFFICIENT_CLASSIFICATION_EVIDENCE
21. ineligible owner evidence maps through to INELIGIBLE_COMPARISON_EVIDENCE
22. owner-name changes do not change classification
23. successful return contains classifier result and no raw owner evidence
24. persistence and database mutation surfaces are never called
25. generic connector, scheduler, trigger, and county execution are never called
26. legacy acquisition scoring and Qualified Deal Queue are never called
27. row 377 certified fixture can produce ABSENTEE_OWNER_INDICATED without persistence

## 27. Initial future production certification target

The first future production execution target remains:

- physical row: `377`
- Distress Lead ID: `DL-20260731203649-4601`
- Canonical Property Key:
  `property|address|pa|philadelphia|19141-4008|5146 n 10th st`

Previously certified upstream evidence for that fixture established:

- property address: `5146 N 10TH ST`
- upstream comparison outcome: `MAILING_ADDRESS_DIFFERS`
- differing components: `street`, `zip`
- expected classification: `ABSENTEE_OWNER_INDICATED`

This contract does not authorize execution against row 377.

It defines the first future certification target only.

## 28. Acquisition safety gate

Absentee-owner classification remains supplemental evidence only.

It MUST NOT:

- establish comp-supported ARV;
- establish repair scope;
- calculate MAO;
- authorize an offer;
- generate an offer; or
- submit an offer.

Automatic MAO or offer authority remains blocked unless both:

1. adequate comp-supported ARV; and
2. adequate repair scope

exist through their independently certified acquisition paths.

Absentee-owner evidence cannot satisfy, bypass, replace, weaken, or substitute
for either requirement.

## 29. Implementation certification sequence

If implementation is separately authorized, progression MUST remain:

1. contract/design certification
2. design commit
3. design PR CI
4. design merge
5. post-merge design CI
6. implementation on the newly certified design main authority
7. static implementation validator
8. behavior validator covering all future cases in this contract
9. integration reconciliation
10. county/runtime inventory reconciliation if required
11. implementation commit
12. PR CI
13. exact-head merge
14. post-merge main CI
15. Apps Script deployment preflight
16. exact deployment certification
17. read-only production execution preflight
18. explicit authorization for exactly one target
19. exactly one admin RPC invocation
20. evidence review

No step implies authority for the next step.

## 30. Contract invariant

The invariant is:

one explicitly selected existing canonical `DISTRESS_LEADS` record
+ admin authority
+ certified exact-record verification
+ verified row-derived property address
+ at most one certified Philadelphia OPA lookup
+ certified owner-evidence comparison
+ certified deterministic classification
= at most one read-only classification result

and:

no persistence
+ no occupancy/vacancy inference
+ no acquisition scoring
+ no ARV/repair/MAO/offer authority.
