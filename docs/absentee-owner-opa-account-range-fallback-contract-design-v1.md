# Absentee-Owner OPA Account + Range Fallback Contract Design v1

## 1. Purpose

Define a future, narrowly bounded, read-only evidence-resolution contract for
Philadelphia absentee-owner candidates that fail the existing exact-property-
address OPA lookup even though independently certified source evidence contains
a distinct OPA account identifier.

This design exists to resolve a source-representation mismatch only.

It does not create runtime authority.

It does not classify an owner as absentee.

It does not persist owner evidence.

It does not repair or replace canonical property identity.

## 2. Existing v1 lookup remains authoritative and unchanged

The existing production surface:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`

and public RPC:

`reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(options)`

remain unchanged by this design.

Version 1 continues to use:

`lookupQueryMode: exact_property_address`

against:

`opa_properties_public`

using only superficial normalization of:

- case;
- surrounding whitespace;
- repeated internal whitespace.

The fallback contract MUST NOT silently alter the semantics of the existing
v1 lookup.

A future fallback invocation MAY be considered only after the normal v1
owner-evidence lookup has produced:

`NO_MATCH`

for a separately verified exact target.

## 3. Motivation and certified diagnostic case

The motivating diagnostic case is not itself production authority.

The evidence established for the current case is:

- `DISTRESS_LEADS` representative row: `1530`
- deferred sibling row: `1532`
- target address: `1624 N BODINE ST`
- persisted REOS Parcel ID: `1473083`
- source objectids: `383` and `384`
- both source observations contain `parcel_id_num = 1473083`
- both source observations contain `opa_account_num = 183124510`
- both source observations contain property address `1624 N BODINE ST`
- OPA exact `parcel_number = 183124510` returns exactly one source row
- OPA source location: `1616-42 N BODINE ST`
- target house number: `1624`
- parsed OPA numeric range: `1616` through `1642`
- street suffix equality: `N BODINE ST`
- numeric containment: true
- parity compatibility: true

This evidence produced only:

`RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE=true`

and explicitly preserved:

`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`

The case remains deferred.

## 4. Identifier-domain separation

The contract MUST distinguish:

- source `parcel_id_num`;
- source `opa_account_num`;
- OPA `parcel_number`;
- persisted REOS `Parcel ID`;
- persisted REOS `Canonical Property Key`.

These identifiers MUST NOT be treated as interchangeable merely because they
appear on the same source observation.

For Philadelphia code-violation source evidence, the current generic connector
parcel mapping order includes:

1. `parcel_id_num`
2. `opa_account_num`
3. `parcel_number`
4. `parcel_id`
5. `opa_number`
6. `account_number`

A future fallback MUST NOT infer that the persisted REOS `Parcel ID` is an OPA
account number.

The fallback OPA account identifier MUST come from separately certified raw
source evidence.

## 5. No canonical identity repair

This contract does not authorize changing:

- `Distress Lead ID`;
- `Canonical Property Key`;
- `Parcel ID`;
- physical `DISTRESS_LEADS` row;
- source observation identity.

The future fallback MUST NOT replace:

`property|parcel|pa|philadelphia|1473083`

with a key derived from:

`183124510`

as part of owner-evidence retrieval.

OPA account evidence and acquisition canonical identity remain separate
provenance domains unless a future independent identity-migration contract
proves otherwise.

## 6. Exact-target precondition

A future fallback MUST start from one previously verified exact
`DISTRESS_LEADS` target.

The target authority MUST come from the existing exact-record selector.

The fallback MUST NOT discover a different acquisition row.

The fallback MUST NOT select a nearby record.

The fallback MUST NOT manufacture a target from OPA data.

## 7. Required normal-lookup precondition

The existing v1 exact-address owner-evidence lookup MUST execute first.

A future fallback is ineligible unless that lookup returns exactly:

`NO_MATCH`

The fallback MUST NOT run after:

- `MATCHED`;
- `AMBIGUOUS`;
- `FAILED`.

A future fallback MUST NOT convert a v1 failure into weaker matching behavior.

## 8. Required raw-source corroboration

Version 1 of this fallback contract requires at least:

`2`

distinct certified Philadelphia code-violation source observations.

Those observations MUST be distinct by immutable source-observation identity.

For the same verified target, every qualifying corroborating observation MUST
prove the same:

- property address after superficial normalization;
- source `parcel_id_num`;
- source `opa_account_num`.

The corroborating observations MUST NOT be selected merely because their owner
names or mailing addresses resemble one another.

Owner data MUST NOT participate in source-observation selection.

## 9. OPA-account source authority

The candidate OPA identifier MUST come only from raw source field:

`opa_account_num`

for each certified corroborating source observation.

The future fallback MUST require the same nonblank value across all required
corroborating observations.

The candidate MUST match exactly:

`^[0-9]{9}$`

for this Philadelphia fallback contract.

The caller MUST NOT supply an arbitrary OPA account number.

The caller MUST NOT override the value retrieved from certified source
evidence.

## 10. Exact OPA-account lookup

A future fallback OPA request MUST use only:

- fixed endpoint authority;
- fixed `opa_properties_public` table;
- exact equality against `parcel_number`;
- the certified `opa_account_num`;
- a bounded explicit column projection;
- a fixed maximum result count.

No fuzzy parcel matching is permitted.

No prefix matching is permitted.

No partial account matching is permitted.

No owner-name lookup is permitted.

No owner-mailing lookup may be used to decide which property row wins.

Exactly one qualifying OPA account row is required before range evidence can be
evaluated.

Zero rows remain non-affirmative.

Multiple rows remain ambiguous.

## 11. Account lookup is not identity repair

A successful exact OPA account lookup means only:

"the independently certified source OPA account resolves uniquely in the
official OPA property dataset."

It does not mean:

- the persisted canonical key is wrong;
- the persisted Parcel ID must be replaced;
- the target is automatically the OPA property;
- absentee classification is authorized;
- owner evidence persistence is authorized.

## 12. Permitted address normalization

Range review MAY normalize only:

- case;
- surrounding whitespace;
- repeated internal whitespace.

It MUST NOT:

- geocode;
- normalize to a nearby street;
- change directionals;
- guess suffixes;
- remove unit identity;
- substitute another property address;
- use edit distance;
- use phonetic similarity;
- use spatial proximity.

This remains deterministic evidence review, not fuzzy address matching.

## 13. Target-address grammar

For automatic range-candidate evaluation, the verified target address MUST
match the restricted grammar:

`<house-number> <street-suffix>`

The house number MUST be positive decimal digits only.

The target MUST fail closed when the house-number component contains:

- alphabetic suffixes;
- fractions;
- slash notation;
- multiple numbers;
- ranges;
- nonnumeric tokens.

The street suffix is the entire normalized text following the target house
number.

## 14. OPA range-location grammar

A source OPA location is eligible for automatic range-candidate evaluation only
when it matches the restricted grammar:

`<range-start>-<range-end> <street-suffix>`

The start and end components MUST contain decimal digits only.

A shortened range-end form MAY be expanded only by copying the unchanged
leading prefix from the range start.

Example:

`1616-42 N BODINE ST`

MAY expand to:

`1616-1642 N BODINE ST`

This deterministic expansion does not itself create match authority.

Malformed, descending, ambiguous, nonnumeric, unit-bearing, or multi-range
location strings MUST fail closed.

## 15. Exact street-suffix rule

After permitted superficial normalization, the complete target street suffix
MUST equal the complete OPA range street suffix exactly.

For the motivating case:

target suffix:

`N BODINE ST`

OPA range suffix:

`N BODINE ST`

result:

`STREET_SUFFIX_EXACT=true`

The fallback MUST NOT translate street names or abbreviations.

## 16. Numeric containment rule

The target numeric house number MUST be inclusively bounded by the expanded OPA
range:

`rangeStart <= targetNumber <= rangeEnd`

For the motivating case:

- range start: `1616`
- target: `1624`
- range end: `1642`

result:

`TARGET_NUMBER_NUMERICALLY_WITHIN_RANGE=true`

Containment remains candidate evidence only.

## 17. Parity rule

The target house-number parity MUST match both range endpoints.

For the motivating case:

- `1616` is even;
- `1624` is even;
- `1642` is even.

result:

`TARGET_PARITY_COMPATIBLE_WITH_RANGE=true`

A mixed-parity range MUST fail closed for automatic range-candidate status.

## 18. Diagnostic candidate semantics

The conjunction of:

- normal v1 outcome `NO_MATCH`;
- exact target identity;
- at least two corroborating certified source observations;
- identical source target address;
- identical source `parcel_id_num`;
- identical nine-digit source `opa_account_num`;
- exactly one OPA row for that account;
- parseable OPA range location;
- exact street suffix;
- numeric containment;
- parity compatibility;

MAY establish only:

`RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE=true`

This design explicitly requires:

`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`

## 19. No owner-evidence authority in this design increment

No owner-name or owner-mailing evidence is authorized by this design increment.

This design does not authorize retrieval of:

- `owner_1`;
- `owner_2`;
- `mailing_address_1`;
- `mailing_address_2`;
- `mailing_care_of`;
- `mailing_city_state`;
- `mailing_street`;
- `mailing_zip`.

A future implementation increment must separately define the minimum projection
required after property-source identity has been safely established.

## 20. No classification authority

Range evidence MUST NOT directly produce:

- `ABSENTEE_OWNER_INDICATED`;
- `OWNER_MAILING_MATCHED`;
- `INSUFFICIENT_CLASSIFICATION_EVIDENCE`;
- owner occupied;
- vacancy;
- non-owner occupied.

This design requires:

`CLASSIFICATION_AUTHORITY_GRANTED=false`

## 21. No persistence authority

Range evidence MUST NOT authorize:

- classification evidence append;
- owner evidence persistence;
- acquisition record mutation;
- canonical-key mutation;
- Parcel ID mutation.

This design requires:

`PERSISTENCE_AUTHORITY_GRANTED=false`

and:

`ROLLOUT_AUTHORITY_GRANTED=false`

## 22. Failure-closed cases

Automatic range-candidate evaluation MUST fail closed when any of the following
is true:

- fewer than two corroborating source observations;
- source observations disagree on target address;
- source observations disagree on `parcel_id_num`;
- source observations disagree on `opa_account_num`;
- OPA account is not exactly nine digits;
- OPA account query returns zero rows;
- OPA account query returns multiple rows;
- OPA location is not restricted range syntax;
- target house number is not restricted numeric syntax;
- range expansion is ambiguous;
- expanded range is descending;
- street suffix differs;
- target number is outside the range;
- parity differs;
- unit identity would need to be removed;
- fuzzy transformation would be required.

Failure MUST preserve the target as deferred.

## 23. No fallback chain

The range contract MUST NOT create a sequence of progressively weaker matching
rules.

After a range candidate fails, the future implementation MUST NOT automatically
try:

- `LIKE`;
- prefix search;
- substring search;
- nearest address;
- geocoding;
- spatial proximity;
- owner-name matching;
- mailing-address matching;
- arbitrary parcel aliases;
- another provider.

A failed candidate remains deferred.

## 24. Deterministic outcomes

A future pure range-evidence evaluator SHOULD distinguish at least:

- `INELIGIBLE`
- `ACCOUNT_NO_MATCH`
- `ACCOUNT_AMBIGUOUS`
- `RANGE_PARSE_FAILED`
- `STREET_MISMATCH`
- `OUTSIDE_RANGE`
- `PARITY_MISMATCH`
- `RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE`

None of these outcomes grants absentee classification or persistence authority.

## 25. Data minimization

Property-source resolution MUST retrieve only fields required to prove source
identity and address relationship.

Owner and mailing fields MUST remain outside the initial range-resolution
request.

The range evaluator itself SHOULD be a pure function without external HTTP,
database, spreadsheet, trigger, scheduler, or Script Property access.

## 26. County isolation

The future range evaluator MUST NOT execute:

- county ingestion;
- county scheduler;
- county checkpoints;
- county cursor mutation;
- county collapse;
- county repair;
- county migration.

Certified county source evidence may be consumed as immutable input only after a
separately designed source-evidence retrieval boundary proves it.

## 27. Acquisition safety boundary

This fallback contract MUST NOT:

- populate Qualified Deal Queue;
- advance acquisition lifecycle;
- establish ARV;
- establish repair scope;
- calculate MAO;
- authorize an offer;
- generate an offer;
- submit an offer.

Automatic MAO or offer authority still requires both adequate comp-supported
ARV and an adequate repair scope through independently certified paths.

## 28. Design-only increment

This increment creates only:

- this design document;
- its offline design validator.

It MUST NOT create:

- production Apps Script;
- an RPC;
- a source lookup implementation;
- a range matcher implementation;
- a classifier change;
- a persistence change;
- a deployment change.

No runtime authority is granted.

## 29. Future implementation sequence

Any future implementation requires separate authorization and SHOULD proceed
through:

1. pure range-evidence evaluator design reconciliation;
2. pure implementation with no HTTP or database access;
3. deterministic behavior validator;
4. source-evidence retrieval contract;
5. mocked retrieval behavior validation;
6. integration proof that existing v1 lookup remains unchanged;
7. proof of no canonical identity repair;
8. proof of no classification authority;
9. proof of no persistence authority;
10. CI;
11. merge;
12. deployment certification if a runtime surface is introduced;
13. explicit production authorization for one deferred target only;
14. read-only production evidence retrieval;
15. independent evidence review;
16. separate authorization for any owner-evidence classification step.

No step implies authority for the next step.

## 30. Promotion boundary

Successful design validation does not authorize implementation.

Successful implementation would not authorize production execution.

A future:

`RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE=true`

does not establish a certified range match and does not authorize
classification, persistence, identity repair, MAO, or offer generation.
