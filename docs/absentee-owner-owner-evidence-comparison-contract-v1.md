# Absentee-Owner Owner-Evidence Comparison Contract v1

## 1. Purpose

This contract defines a deterministic, read-only comparison layer between:

1. a previously verified acquisition-property target; and
2. a previously returned `MATCHED` owner-evidence result.

The comparison layer may establish whether sufficiently complete owner-mailing
components match or differ from the verified property-address components.

This contract does not itself determine absentee ownership.

It does not persist owner evidence, mutate acquisition data, execute an external
provider lookup, advance acquisition lifecycle, calculate MAO, or authorize an
offer.

## 2. Upstream authority

Version 1 depends on the separately certified Philadelphia owner-evidence
surface:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`

A comparison input is eligible only when the upstream evidence object represents:

- `mode: READ_ONLY_OWNER_EVIDENCE`;
- phase `absentee_owner_philadelphia_owner_evidence_lookup`;
- outcome `MATCHED`;
- exactly one bounded qualifying source row;
- the fixed Philadelphia OPA source;
- a verified target row and persisted dual identity;
- raw owner-mailing evidence; and
- all upstream authority flags remaining false.

`MATCHED` continues to mean only that one exact OPA property source row matched
the verified target property.

`MATCHED` does not mean absentee.

## 3. Future implementation surface

A future implementation may create:

`build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js`

with internal surface:

`REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(ownerEvidence)`

Version 1 MUST NOT expose a new production RPC.

The comparison must remain a pure deterministic transformation of supplied,
already-retrieved evidence.

It MUST NOT call:

- `UrlFetchApp`;
- `SpreadsheetApp`;
- `PropertiesService`;
- `ScriptApp`;
- `LockService`;
- `REOS.Database`;
- `REOS.CountyRuntimeBridge`;
- `REOS.CountyConnectorSDK`;
- `REOS.PAPhiladelphiaCountyConnector`;
- `reosConnectorHandleAbsenteeOwners`;
- `REOS.AbsenteeOwnerEnrichmentSanitizer`;
- `REOS.AbsenteeOwnerEnrichmentPersistenceAdapter`;
- `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder`;
- `REOS.AbsenteeOwnerEnrichmentExecutor`; or
- `reosAbsenteeOwnerEnrichmentCertifySingleRecord`.

## 4. Input boundary

Version 1 accepts exactly one owner-evidence object.

Arrays, batches, arbitrary property overrides, arbitrary mailing overrides,
provider-selection parameters, source URLs, SQL, owner-name search predicates,
or persistence patches are prohibited.

The property evidence used for comparison MUST come from the embedded verified
`target` of the owner-evidence result.

The mailing evidence used for comparison MUST come from the embedded
`ownerMailingEvidence`.

A caller MUST NOT separately supply a replacement property address or mailing
address.

## 5. Required target identity

Eligible evidence MUST preserve nonblank:

- `target.rowNumber`;
- `target.identity["Distress Lead ID"]`;
- `target.identity["Canonical Property Key"]`;
- `target.propertyAddress`;
- `target.city`;
- `target.state`; and
- `target.zip`.

The comparison layer has no authority to derive, repair, replace, migrate, or
reinterpret canonical acquisition identity.

## 6. Fixed source provenance

Eligible evidence MUST preserve the certified source authority:

- agency: `Philadelphia Office of Property Assessment`;
- table: `opa_properties_public`;
- endpoint: `https://phl.carto.com/api/v2/sql`;
- lookup mode: `exact_property_address`; and
- exactly one bounded source row for the `MATCHED` result.

Evidence from another provider or source is ineligible for version 1.

## 7. Mailing evidence boundary

Only these upstream raw mailing fields may participate:

- `mailing_address_1`;
- `mailing_address_2`;
- `mailing_care_of`;
- `mailing_city_state`;
- `mailing_street`;
- `mailing_zip`.

For the address comparison itself, version 1 may compare only:

- `mailing_street`;
- parsed city from `mailing_city_state`;
- parsed state from `mailing_city_state`; and
- `mailing_zip`.

`mailing_address_1`, `mailing_address_2`, and `mailing_care_of` remain preserved
evidence but MUST NOT override or substitute for a missing `mailing_street`.

Owner names MUST NOT participate in address comparison.

## 8. Property comparison components

Version 1 compares these verified target components:

- property street from `target.propertyAddress`;
- property city from `target.city`;
- property state from `target.state`; and
- property ZIP from `target.zip`.

No geocoding, fuzzy search, parcel substitution, owner-name search, or address
repair is authorized.

## 9. Superficial normalization only

Comparison normalization is intentionally narrow.

For street, city, and state text it MAY only:

1. convert null-like values to blank;
2. trim leading and trailing whitespace;
3. collapse repeated internal whitespace to one space; and
4. convert text to uppercase.

It MUST NOT:

- expand or contract street suffixes;
- convert `STREET` to `ST`;
- convert directional words;
- reorder tokens;
- remove apartment or unit semantics;
- use phonetic matching;
- use edit distance;
- geocode;
- query another source; or
- infer missing address components.

## 10. ZIP normalization

A valid comparison ZIP may be:

- five digits; or
- ZIP+4.

For comparison only, ZIP+4 MAY be reduced to its first five digits.

This prevents the presence or absence of a ZIP+4 suffix by itself from creating
a different-address result.

Invalid or blank ZIP evidence is insufficient evidence.

## 11. Mailing city/state parsing

`mailing_city_state` must contain a nonblank city followed by a two-letter state
token.

Only superficial whitespace normalization and uppercase conversion are allowed
before parsing.

If a city and two-letter state cannot be deterministically separated, mailing
evidence is insufficient.

The comparison MUST NOT infer a missing city or state from the property address,
ZIP, parcel, owner name, or any external service.

## 12. Sufficiency gate

A mailing-address comparison may occur only when all of the following are
nonblank and structurally valid:

Property:

- property street;
- property city;
- property state;
- property ZIP.

Mailing:

- mailing street;
- mailing city;
- mailing state;
- mailing ZIP.

If any required comparison component is missing or invalid, the result MUST be:

`INSUFFICIENT_MAILING_EVIDENCE`

Incomplete evidence MUST NOT be treated as a match or difference.

## 13. Comparison outcomes

Version 1 may produce exactly these comparison outcomes:

- `MAILING_ADDRESS_MATCHES`
- `MAILING_ADDRESS_DIFFERS`
- `INSUFFICIENT_MAILING_EVIDENCE`
- `INELIGIBLE_OWNER_EVIDENCE`

No other semantic conclusion is authorized.

## 14. MAILING_ADDRESS_MATCHES

`MAILING_ADDRESS_MATCHES` requires sufficient evidence and exact equality after
the permitted superficial normalization for all four comparable components:

- street;
- city;
- state; and
- five-digit ZIP.

This outcome means only that the normalized mailing-address components match the
normalized property-address components.

It does not prove owner occupancy.

## 15. MAILING_ADDRESS_DIFFERS

`MAILING_ADDRESS_DIFFERS` requires sufficient evidence and at least one
comparable component that is unequal after the permitted superficial
normalization.

The result SHOULD identify the differing component names, such as:

- `street`;
- `city`;
- `state`;
- `zip`.

This outcome means only that the normalized address evidence differs.

It does not itself prove:

- absentee ownership;
- non-owner occupancy;
- vacancy;
- mailing validity;
- current residency; or
- acquisition qualification.

## 16. INSUFFICIENT_MAILING_EVIDENCE

`INSUFFICIENT_MAILING_EVIDENCE` is non-affirmative.

It MUST NOT be converted into:

- an address match;
- an address difference;
- owner occupied;
- absentee;
- vacancy; or
- persistence authority.

## 17. INELIGIBLE_OWNER_EVIDENCE

The comparison result MUST be `INELIGIBLE_OWNER_EVIDENCE` when the upstream
object is not a valid version-1 comparison input.

Examples include:

- upstream outcome other than `MATCHED`;
- wrong upstream mode or phase;
- missing target dual identity;
- source other than certified Philadelphia OPA;
- wrong table or endpoint;
- bounded source row count other than one;
- missing required evidence envelope; or
- any upstream authority flag unexpectedly true.

`NO_MATCH`, `AMBIGUOUS`, and `FAILED` lookup results MUST NOT be promoted into
address-comparison evidence.

## 18. Returned evidence boundary

A future successful comparison result SHOULD contain only bounded evidence such
as:

- `ok`;
- mode `READ_ONLY_OWNER_EVIDENCE_COMPARISON`;
- phase `absentee_owner_owner_evidence_comparison`;
- comparison outcome;
- target row number;
- persisted dual identity;
- source provenance;
- normalized property comparison components;
- normalized mailing comparison components;
- differing component names when applicable; and
- all authority flags false.

Raw owner names may be omitted because they are not required for comparison.

## 19. No absentee classification

The comparison layer MUST NOT produce or infer fields representing:

- absentee-owner status;
- owner-occupied status;
- vacancy status;
- non-owner-occupied status; or
- acquisition qualification.

A different mailing address is evidence relevant to a possible later absentee
classification, but it is not itself that classification.

Any conversion of comparison evidence into an absentee-owner status requires a
separate design, implementation, validation, and explicit production
authorization.

## 20. No persistence authority

Version 1 is observational only.

It MUST NOT:

- invoke the existing sanitizer;
- construct a persistence patch;
- write `Owner Name`;
- write `Owner Mailing Address`;
- write a comparison outcome into `DISTRESS_LEADS`;
- update `Updated At`;
- clear existing fields; or
- execute any database mutation.

The existing enrichment persistence boundary remains unchanged.

## 21. Existing owner-field persistence boundary

The currently authorized enrichment-owned data fields remain:

- `Owner Name`;
- `Owner Mailing Address`.

The comparison contract does not add a new persistent field.

A future decision to persist comparison or classification state requires a
separate schema and persistence contract.

## 22. Generic absentee connector isolation

The historical generic connector:

`reosConnectorHandleAbsenteeOwners`

is not comparison authority.

The comparison implementation MUST NOT call, retrofit, or depend on that
connector.

Existing generic acquisition logic that interprets historical fields such as
`Absentee Owner` or `Owner Occupied` is also outside this contract.

## 23. Acquisition safety gate

Comparison evidence MUST NOT:

- create Qualified Deal Queue authority;
- advance acquisition lifecycle;
- establish ARV;
- establish repair scope;
- calculate MAO;
- generate an offer;
- authorize an offer; or
- submit an offer.

Automatic MAO or offer authority continues to require both adequate
comp-supported ARV and an adequate repair scope through independently certified
paths.

Owner comparison evidence cannot bypass that gate.

## 24. Row-377 certified fixture

The first certified evidence fixture is:

Target:

- row: `377`;
- Distress Lead ID: `DL-20260731203649-4601`;
- Canonical Property Key:
  `property|address|pa|philadelphia|19141-4008|5146 n 10th st`;
- property street: `5146 N 10th St`;
- property city: `PHILADELPHIA`;
- property state: `PA`;
- property ZIP: `19141-4008`.

OPA evidence:

- parcel: `776330000`;
- property location: `5146 N 10TH ST`;
- mailing street: `6623 N 8TH ST`;
- mailing city/state: `PHILADELPHIA PA`;
- mailing ZIP: `19126`.

Certified owner-evidence response SHA-256:

`d5d949e3cd9dfb533b78bafd838947adb4aeb1b1c76d1e287c71ac539fdeb521`

Under this comparison contract:

- property street normalizes to `5146 N 10TH ST`;
- mailing street normalizes to `6623 N 8TH ST`;
- property ZIP comparison value is `19141`;
- mailing ZIP comparison value is `19126`;
- city matches;
- state matches;
- street differs;
- ZIP differs.

Therefore the expected comparison outcome for this fixture is:

`MAILING_ADDRESS_DIFFERS`

This fixture still does not authorize an absentee-owner classification.

## 25. Behavioral validation requirements

A future implementation behavioral validator MUST cover at least:

1. exact complete address match;
2. superficial case-only match;
3. repeated-whitespace match;
4. ZIP versus equivalent ZIP+4 handling;
5. street difference;
6. city difference;
7. state difference;
8. ZIP difference;
9. multiple differing components;
10. blank mailing street;
11. blank mailing city/state;
12. invalid mailing city/state;
13. blank mailing ZIP;
14. invalid mailing ZIP;
15. blank property component;
16. upstream `NO_MATCH`;
17. upstream `AMBIGUOUS`;
18. upstream `FAILED`;
19. wrong source endpoint;
20. wrong source table;
21. source row count other than one;
22. missing persisted identity;
23. unexpected true authority flag;
24. proof that owner names do not affect comparison;
25. proof that no persistence surface is called;
26. proof that no external HTTP surface is called;
27. proof that no absentee classification field is produced; and
28. row-377 fixture returns `MAILING_ADDRESS_DIFFERS`.

## 26. Promotion sequence

The comparison workstream MUST proceed incrementally:

1. comparison contract design;
2. design validation;
3. implementation;
4. static validation;
5. behavioral validation;
6. runtime integration reconciliation if required;
7. CI;
8. merge;
9. deployment certification if the implementation enters Apps Script runtime;
10. separately authorized evidence comparison;
11. review of the comparison result;
12. separate design for any absentee classification;
13. separate design for any new persistence field or mutation.

No step implies authority for the next step.

## 27. Authority flags

Every comparison result MUST preserve false authority for at least:

- `productionDataMutationAuthorityGranted`;
- `ownerEvidencePersistenceAuthorityGranted`;
- `absenteeClassificationAuthorityGranted`;
- `canonicalIdentityRepairAuthorityGranted`;
- `migrationAuthorityGranted`;
- `schedulerAuthorityGranted`;
- `triggerAuthorityGranted`;
- `connectorExecutionAuthorityGranted`;
- `certificationMutationAuthorityGranted`;
- `automaticOfferAuthorityGranted`.

## 28. Version-1 exclusions

Version 1 excludes:

- batch comparison;
- scheduled comparison;
- persistence;
- classification;
- owner-occupancy determination;
- vacancy determination;
- fuzzy address matching;
- geocoding;
- secondary data sources;
- owner-name matching;
- external HTTP;
- automatic retry;
- automatic pagination;
- county execution;
- canonical identity repair;
- ARV;
- repair scope;
- MAO;
- offer generation; and
- automatic offer authority.

The surface remains deterministic, source-bound, observational, and read-only.
