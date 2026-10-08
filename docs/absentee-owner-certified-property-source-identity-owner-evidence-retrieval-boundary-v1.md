# Certified Property-Source Identity Owner-Evidence Retrieval Boundary v1

## 1. Purpose

Define one bounded read-only owner-evidence retrieval capability for a
Philadelphia property that already has:

`PROPERTY_SOURCE_IDENTITY_CERTIFIED=true`

from:

`REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification`

This boundary permits retrieval of official OPA owner and mailing evidence by
the exact certified nine-digit OPA account.

It does not certify absentee ownership.

It does not classify the property.

It does not persist evidence.

It does not create acquisition, ARV, repair, MAO, or offer authority.

## 2. Capability packaging

This design, its future implementation, tests, owner-evidence comparison
integration, runtime inventory registration, and CI registration belong to one
capability workstream and one eventual pull request.

`ONE_CAPABILITY_ONE_EVENTUAL_PR=true`

A separate design-only PR is not required.

## 3. Existing primary lookup remains authoritative and unchanged

The existing runtime:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`

remains the primary owner-evidence lookup for exact property-address matches.

Its existing source mode:

`exact_property_address`

MUST retain its present meaning.

This new boundary MUST NOT weaken, reinterpret, or silently change that path.

The certified-account path is eligible only after the exact-address path
returned:

`NO_MATCH`

and the independent property-source identity certifier subsequently returned:

`PROPERTY_SOURCE_IDENTITY_CERTIFIED`.

## 4. Required upstream certification

The new owner-evidence lookup is ineligible unless its upstream certification
has:

- `ok: true`;
- mode `READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION`;
- phase
  `absentee_owner_opa_account_range_property_source_identity_certification`;
- outcome `PROPERTY_SOURCE_IDENTITY_CERTIFIED`;
- certification basis
  `EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT`;
- `propertySourceIdentityCertified: true`;
- `rangeContainmentDiagnosticCandidate: true`;
- `rangeContainmentCertifiedMatch: false`;
- one exact `DISTRESS_LEADS` row;
- exact `Distress Lead ID`;
- exact `Canonical Property Key`;
- exact persisted REOS parcel identifier;
- exact certified nine-digit `sourceOpaAccountNum`;
- all upstream authority flags false.

The new lookup MUST NOT create or infer the certification itself.

## 5. Required normal-lookup evidence

The same capability MUST also receive the normal exact-address lookup evidence
that participated in the certification path.

It MUST be eligible only when that evidence has:

- `ok: true`;
- mode `READ_ONLY_OWNER_EVIDENCE`;
- phase `absentee_owner_philadelphia_owner_evidence_lookup`;
- outcome `NO_MATCH`;
- source lookup mode `exact_property_address`;
- `boundedSourceRowCount: 0`;
- the same physical row;
- the same `Distress Lead ID`;
- the same `Canonical Property Key`;
- Philadelphia city;
- Pennsylvania state;
- the verified target property address;
- all upstream authority flags false.

The normalized normal-lookup property address MUST equal the certification's
`normalizedVerifiedTargetAddress`.

## 6. Exact future input envelope

The future lookup MAY accept exactly:

- `propertySourceIdentityCertification`;
- `normalLookupEvidence`.

No caller-supplied OPA account override is permitted.

No caller-supplied parcel override is permitted.

No caller-supplied property address override is permitted.

No owner or mailing evidence may be supplied by the caller.

## 7. Proposed future module

A future implementation MAY create:

`REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup`

at:

`build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js`

with method:

`lookup(options)`.

Its successful/eligible result mode SHOULD remain:

`READ_ONLY_OWNER_EVIDENCE`

with a distinct phase:

`absentee_owner_certified_property_source_identity_owner_evidence_lookup`

and distinct source lookup mode:

`certified_opa_account`.

## 8. No public RPC in this capability

The new lookup MUST remain internal.

No new global Apps Script RPC is authorized.

No menu, web app, trigger, scheduler, batch runner, run-all surface, or generic
connector surface is authorized.

A later orchestration boundary must be separately reviewed before production
invocation is possible.

## 9. Administrative boundary

The future lookup MUST require:

`REOS.Security.requireAdmin()`

before external retrieval.

No external request may occur before:

- input validation;
- certification validation;
- exact target binding;
- certified account validation.

## 10. Certified account derivation

The OPA account MUST be taken only from:

`propertySourceIdentityCertification.sourceOpaAccountNum`

and MUST match:

`^[0-9]{9}$`

The caller MUST NOT provide an alternate OPA account.

For the motivating row 1530 case the certified account is:

`183124510`

## 11. Official OPA source

The only authorized source is:

agency:

`Philadelphia Office of Property Assessment`

dataset:

`Philadelphia Properties and Assessment History`

table:

`opa_properties_public`

endpoint:

`https://phl.carto.com/api/v2/sql`

No secondary owner source is authorized.

## 12. Exact account query

The future lookup MUST perform one bounded exact-account query against:

`parcel_number`

using only the certified nine-digit OPA account.

Conceptually:

`WHERE parcel_number = '<certified nine-digit account>'`

The query MUST NOT search by:

- owner name;
- mailing address;
- target address;
- fuzzy address;
- range address;
- parcel proximity;
- geocoding;
- phonetic similarity;
- wildcard account prefix.

The query MUST be bounded to at most:

`2`

rows so zero, unique, and ambiguous resolution can be distinguished.

No pagination is authorized.

## 13. Exact projected source fields

The account query MAY retrieve only:

- `parcel_number`;
- `location`;
- `owner_1`;
- `owner_2`;
- `mailing_address_1`;
- `mailing_address_2`;
- `mailing_care_of`;
- `mailing_city_state`;
- `mailing_street`;
- `mailing_zip`.

Schema drift MUST fail closed.

## 14. Unique account resolution

Zero rows MUST return a bounded:

`NO_MATCH`

result.

Two rows MUST return a bounded:

`AMBIGUOUS`

result.

A successful:

`MATCHED`

result requires exactly one returned row.

The returned:

`parcel_number`

MUST equal the certified:

`sourceOpaAccountNum`

exactly.

No first-row-wins behavior is authorized.

## 15. Property location semantics

The unique OPA row's:

`location`

MAY be the previously certified range representation.

For row 1530 the official OPA location is:

`1616-42 N BODINE ST`

while the verified target is:

`1624 N BODINE ST`.

The new lookup MUST NOT require exact-address equality between these two values.

That relationship was already bounded by the independent property-source
identity certification.

The lookup MUST NOT re-run or reinterpret the range algorithm.

## 16. Owner and mailing evidence result

For exactly one eligible row, the lookup MAY expose:

`ownerNameEvidence`

containing only:

- `owner_1`;
- `owner_2`.

It MAY expose:

`ownerMailingEvidence`

containing only:

- `mailing_address_1`;
- `mailing_address_2`;
- `mailing_care_of`;
- `mailing_city_state`;
- `mailing_street`;
- `mailing_zip`.

Values MUST be returned as source evidence, not rewritten owner identity.

## 17. Result provenance

Every eligible result SHOULD preserve:

- mode `READ_ONLY_OWNER_EVIDENCE`;
- phase
  `absentee_owner_certified_property_source_identity_owner_evidence_lookup`;
- outcome;
- exact target row;
- exact target dual identity;
- verified property address/city/state/zip from the normal lookup evidence;
- official OPA source identity;
- source lookup mode `certified_opa_account`;
- certified OPA account;
- bounded source row count;
- `propertySourceIdentityCertified: true`;
- certification basis;
- all downstream authority flags false.

A matched result SHOULD additionally preserve:

- returned OPA `parcel_number`;
- returned OPA `location`.

## 18. Existing comparison algorithm must be reused

The existing:

`REOS.AbsenteeOwnerOwnerEvidenceComparison`

MUST remain the single owner-mailing comparison algorithm.

A second mailing-address comparison implementation is not authorized.

The future implementation MAY extend its eligibility boundary to accept the new
account-based owner-evidence phase.

## 19. Comparison eligibility for certified-account evidence

The comparison MAY accept the new owner-evidence envelope only when:

- mode remains `READ_ONLY_OWNER_EVIDENCE`;
- phase is exactly
  `absentee_owner_certified_property_source_identity_owner_evidence_lookup`;
- outcome is `MATCHED`;
- bounded source row count is exactly `1`;
- lookup mode is `certified_opa_account`;
- `propertySourceIdentityCertified` is exactly true;
- certification basis is exact;
- certified OPA account is exactly nine digits;
- returned `parcelNumber` equals that certified account;
- owner-mailing evidence contains the required fields;
- all upstream authority flags remain false.

The historical exact-address comparison path MUST remain unchanged.

## 20. Comparison output semantics remain unchanged

For either eligible upstream path the comparison algorithm may continue to
produce only:

- `MAILING_ADDRESS_MATCHES`;
- `MAILING_ADDRESS_DIFFERS`;
- `INSUFFICIENT_MAILING_EVIDENCE`;
- or its existing ineligible result.

This capability does not authorize changing the downstream classification
algorithm.

## 21. No classification invocation

The new lookup MUST NOT call:

`REOS.AbsenteeOwnerClassification`

or any equivalent classification surface.

The comparison integration MUST NOT invoke classification.

Classification remains a later, separately authorized consumer.

## 22. No persistence

The capability MUST NOT call:

- `REOS.Database`;
- `SpreadsheetApp`;
- owner-evidence persistence;
- classification persistence;
- canonical identity persistence;
- migration surfaces.

Retrieved owner evidence remains read-only evidence.

## 23. External HTTP boundary

The new account lookup MAY use:

`UrlFetchApp.fetch`

only for the single bounded official OPA query defined by this contract.

It MUST NOT perform secondary HTTP requests.

It MUST NOT query code-violation sources.

It MUST NOT retrieve new property-source identity evidence.

## 24. No canonical identity repair

The certified OPA account:

`183124510`

for the motivating case MUST NOT replace persisted REOS Parcel ID:

`1473083`.

It MUST NOT rewrite:

`property|parcel|pa|philadelphia|1473083`.

The OPA account remains source identity/provenance, not canonical acquisition
identity.

## 25. Failure behavior

The future implementation MUST fail closed for at least:

- invalid input envelope;
- ineligible property-source certification;
- certification authority contamination;
- ineligible normal lookup evidence;
- target row mismatch;
- Distress Lead ID mismatch;
- Canonical Property Key mismatch;
- normalized target-address mismatch;
- invalid certified OPA account;
- HTTP failure;
- non-200 response;
- invalid JSON;
- OPA source error;
- schema drift;
- result bound exceeded;
- zero rows;
- multiple rows;
- returned OPA account mismatch.

No failure may trigger classification or persistence.

## 26. Motivating target

The currently authorized motivating evidence target remains:

physical row:

`1530`

Distress Lead ID:

`DL-20260825185532-4474`

Canonical Property Key:

`property|parcel|pa|philadelphia|1473083`

persisted Parcel ID:

`1473083`

certified OPA account:

`183124510`

verified target:

`1624 N BODINE ST`

official OPA range location:

`1616-42 N BODINE ST`

## 27. Deferred sibling isolation

Row:

`1532`

remains outside automatic processing.

This design does not authorize automatically reading, retrieving owner evidence
for, comparing, classifying, or mutating row 1532.

`ROW_1532_PROCESSING_AUTHORIZED=false`

## 28. Acquisition safety boundary

This capability grants no:

- Qualified Deal Queue authority;
- acquisition-lifecycle authority;
- ARV authority;
- repair-scope authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority.

Automatic MAO or offer authority continues to require independently supported
ARV and adequate repair scope.

## 29. Behavioral validation requirements

The future implementation behavior suite MUST prove at minimum:

1. row 1530 certified-account owner lookup can resolve one mocked OPA row;
2. uncertified property-source input performs zero HTTP calls;
3. contaminated upstream authority performs zero HTTP calls;
4. target row mismatch performs zero HTTP calls;
5. dual-identity mismatch performs zero HTTP calls;
6. target-address mismatch performs zero HTTP calls;
7. malformed certified account performs zero HTTP calls;
8. the query is exact-account-only;
9. the account query is bounded to at most two rows;
10. zero rows produce `NO_MATCH`;
11. two rows produce `AMBIGUOUS`;
12. account mismatch fails closed;
13. schema drift fails closed;
14. range-form OPA `location` does not require exact-address equality;
15. owner fields are source-preserved;
16. mailing fields are source-preserved;
17. no database/spreadsheet operation occurs;
18. no classification call occurs;
19. no persistence call occurs;
20. comparison accepts a valid account-based matched envelope;
21. comparison still accepts the historical exact-address matched envelope;
22. historical exact-address behavior remains unchanged;
23. comparison rejects uncertified account-mode evidence;
24. row 1532 is not automatically processed.

## 30. Implementation integration boundary

The eventual capability PR MAY include, as required:

- this design;
- this design validator;
- one new account-based owner-evidence lookup runtime;
- static validation for that runtime;
- behavior validation for that runtime;
- integration validation for that runtime;
- the minimal existing owner-evidence comparison eligibility extension;
- corresponding comparison behavior/integration validation updates;
- bounded runtime inventory registration;
- offline CI registration.

The exact future implementation file ceiling MUST be established by a separate
implementation preflight before source implementation edits.

No additional production surface is implicitly authorized.

## 31. PR packaging decision

The owner-evidence retrieval capability SHALL remain on:

`feat/absentee-owner-certified-property-source-identity-owner-evidence-retrieval-v1`

through design, implementation, validation, and CI preparation.

No PR SHALL be opened for the design artifacts alone.

`DESIGN_ONLY_PR_AUTHORIZED=false`

`OWNER_EVIDENCE_CAPABILITY_SINGLE_PR=true`

## 32. Current authority after this design

This document alone grants no runtime authority.

`OWNER_EVIDENCE_RETRIEVAL_IMPLEMENTATION_AUTHORIZED=false`

`OWNER_EVIDENCE_RETRIEVAL_PRODUCTION_INVOCATION_AUTHORIZED=false`

`CLASSIFICATION_IMPLEMENTATION_AUTHORIZED=false`

`CLASSIFICATION_EXECUTION_AUTHORIZED=false`

`PERSISTENCE_AUTHORIZED=false`

`DEPLOYMENT_AUTHORIZED=false`

`ARV_AUTHORITY_GRANTED=false`

`REPAIR_SCOPE_AUTHORITY_GRANTED=false`

`MAO_AUTHORITY_GRANTED=false`

`OFFER_AUTHORITY_GRANTED=false`
