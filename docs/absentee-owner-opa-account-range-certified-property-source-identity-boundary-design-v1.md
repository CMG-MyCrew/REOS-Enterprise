# Absentee-Owner OPA Account Range Certified Property-Source Identity Boundary Design v1

## 1. Purpose

Define a future, narrowly bounded, pure read-only certification layer that may
establish one new evidence fact:

`PROPERTY_SOURCE_IDENTITY_CERTIFIED=true`

for exactly one already-verified Philadelphia `DISTRESS_LEADS` target when:

- the normal exact-address OPA owner-evidence lookup returned `NO_MATCH`;
- independently certified Philadelphia code-violation source observations
  agree on the target property representation;
- those observations agree on one exact nine-digit OPA account identifier;
- that OPA account resolves to exactly one official OPA property row; and
- the existing restricted range-evidence evaluator establishes
  `RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE`.

This boundary certifies only that the uniquely resolved official OPA property
row is sufficiently linked to the already-verified REOS target to become a
certified property-source identity for a later, separately designed evidence
step.

It does not certify absentee ownership.

It does not retrieve owner or mailing evidence.

It does not alter canonical acquisition identity.

It does not persist anything.

## 2. Relationship to the existing range evaluator

The existing runtime:

`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`

remains authoritative and unchanged.

Its historical result:

`RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE=true`

continues to mean diagnostic candidate only.

Its field:

`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`

MUST remain false.

This new boundary MUST NOT retrofit, reinterpret, or mutate the historical
meaning of `rangeContainmentCertifiedMatch`.

Instead, a future independent certification layer MAY emit the separate fact:

`propertySourceIdentityCertified: true`

only after all additional certification requirements in this contract pass.

## 3. Certified motivating evidence

The current independently reviewed motivating case is:

- physical `DISTRESS_LEADS` row: `1530`;
- Distress Lead ID:
  `DL-20260825185532-4474`;
- Canonical Property Key:
  `property|parcel|pa|philadelphia|1473083`;
- persisted REOS Parcel ID:
  `1473083`;
- verified target address:
  `1624 N Bodine St`;
- certified source observations:
  `pa-philadelphia|code_violations|383` and
  `pa-philadelphia|code_violations|384`;
- source `parcel_id_num`:
  `1473083`;
- source `opa_account_num`:
  `183124510`;
- exact OPA `parcel_number`:
  `183124510`;
- unique OPA location:
  `1616-42 N BODINE ST`;
- normalized target address:
  `1624 N BODINE ST`;
- target house number:
  `1624`;
- expanded OPA range:
  `1616` through `1642`;
- exact street suffix:
  `N BODINE ST`;
- numeric containment:
  true;
- parity compatibility:
  true;
- normal owner-evidence lookup:
  `NO_MATCH`;
- range evaluator outcome:
  `RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE`.

The independent evidence review is frozen as:

`d0bc37e503df77132b9ef4b98932b947d509c3facdfe8199930ce4e382ccaf6b`

That review established:

`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`

and:

`EXISTING_RANGE_TO_CLASSIFICATION_HANDOFF_PRESENT=false`

The motivating evidence does not itself create runtime authority.

## 4. Deferred sibling isolation

Physical row `1532` remains outside this boundary.

This design does not authorize:

- reading row `1532`;
- retrieving source evidence for row `1532`;
- evaluating row `1532`;
- certifying row `1532`;
- classifying row `1532`; or
- mutating row `1532`.

The first future production authorization, if one is ever granted, MUST remain
single-target and explicitly identify row `1530`.

## 5. New semantic fact

A successful future certification MAY mean only:

"The exact official OPA property row identified by the independently certified
source OPA account is sufficiently linked to the already-verified REOS target
through exact identifier corroboration and restricted deterministic
range-containment evidence."

The successful result MAY expose:

`PROPERTY_SOURCE_IDENTITY_CERTIFIED=true`

This fact is property-source evidence authority only.

It is not:

- canonical property identity replacement;
- owner identity;
- owner mailing evidence;
- absentee-owner classification;
- occupancy evidence;
- vacancy evidence;
- persistence authority;
- acquisition scoring authority.

## 6. Proposed future internal module

A future implementation MAY create:

`REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification`

at:

`build/apps-script-brand/AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js`

with internal method:

`certify(options)`

The module MUST remain internal-only.

No global Apps Script RPC is authorized by this design.

No web app, menu, scheduler, trigger, batch surface, run-all surface, or generic
connector surface is authorized.

## 7. Pure-function boundary

The future certifier SHOULD be a pure function.

It MUST NOT call:

- `UrlFetchApp`;
- `SpreadsheetApp`;
- `REOS.Database`;
- `PropertiesService`;
- `ScriptApp`;
- `LockService`;
- `DriveApp`;
- `GmailApp`;
- county connectors;
- schedulers;
- triggers;
- persistence surfaces;
- classification surfaces.

Its only permitted runtime dependency MAY be:

`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator.evaluate`

for deterministic reuse of the already-certified range algorithm.

## 8. Exact future input envelope

The future certifier MAY accept exactly:

- `exactRecordEvidence`;
- `normalLookupEvidence`;
- `sourceObservations`;
- `opaAccountRows`.

No other caller-supplied top-level input is authorized.

The caller MUST NOT directly supply:

- a certification outcome;
- `propertySourceIdentityCertified`;
- an OPA account override;
- a parcel override;
- a property address override;
- a range start;
- a range end;
- a street suffix;
- a containment flag;
- a parity flag;
- owner evidence;
- mailing evidence;
- classification evidence.

## 9. Exact-record evidence precondition

`exactRecordEvidence` MUST be successful output from:

`REOS.AbsenteeOwnerEnrichmentExactRecordSelector.exactRecordEvidence(...)`

and MUST preserve:

- `ok: true`;
- `mode: READ_ONLY`;
- phase `absentee_owner_exact_record_evidence`;
- table `DISTRESS_LEADS`;
- one exact physical row;
- exact persisted `Distress Lead ID`;
- exact persisted `Canonical Property Key`;
- the verified record;
- all selector authority flags false.

The certifier MUST NOT discover or substitute another target.

## 10. Persisted property identity requirements

For certification, the verified row MUST contain nonblank:

- `Address`;
- `Parcel ID`.

The persisted `Parcel ID` MUST remain in its existing identifier domain.

For the motivating case it is:

`1473083`

The certifier MUST NOT replace it with OPA account:

`183124510`

The certifier MUST NOT rewrite:

`property|parcel|pa|philadelphia|1473083`

into a canonical key derived from the OPA account.

## 11. Required normal-lookup evidence

`normalLookupEvidence` MUST be successful output from:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.lookup(...)`

and MUST preserve:

- `ok: true`;
- mode `READ_ONLY_OWNER_EVIDENCE`;
- phase `absentee_owner_philadelphia_owner_evidence_lookup`;
- outcome exactly `NO_MATCH`;
- the same physical row;
- the same dual identity;
- property address derived from the verified row;
- official OPA source identity;
- `lookupQueryMode: exact_property_address`;
- `boundedSourceRowCount: 0`;
- all upstream authority flags false.

Any outcome other than `NO_MATCH` makes this fallback certification ineligible.

## 12. Cross-envelope target binding

The future certifier MUST require exact agreement between
`exactRecordEvidence` and `normalLookupEvidence` on:

- physical row number;
- `Distress Lead ID`;
- `Canonical Property Key`.

After permitted superficial normalization, the normal lookup target address
MUST equal verified `record["Address"]`.

The certifier MUST NOT parse or manufacture a target address from the Canonical
Property Key.

## 13. Required source corroboration

The future certifier MUST require between:

`2`

and:

`5`

distinct certified source observations.

Each source observation MUST contain exactly the source evidence required by
the existing range evaluator:

- `sourceObservationId`;
- `propertyAddress`;
- `parcel_id_num`;
- `opa_account_num`.

Source observation identities MUST be distinct.

For Philadelphia code violations, the certified identities MUST remain
immutable source identities such as:

`pa-philadelphia|code_violations|383`

and:

`pa-philadelphia|code_violations|384`

## 14. Permitted source-address normalization

Source and verified target addresses MAY be normalized only by:

1. trimming surrounding whitespace;
2. collapsing repeated internal whitespace;
3. converting case to uppercase.

No other address transformation is permitted.

The future certifier MUST NOT:

- remove punctuation;
- expand abbreviations;
- change directionals;
- translate street suffixes;
- reorder tokens;
- remove unit identity;
- geocode;
- use edit distance;
- use phonetic similarity;
- use spatial proximity;
- use fuzzy matching.

## 15. Source parcel binding

Every qualifying source observation MUST contain the same nonblank:

`parcel_id_num`

The common source `parcel_id_num` MUST equal the verified persisted:

`record["Parcel ID"]`

exactly after string conversion and surrounding-whitespace removal.

For the motivating case:

source `parcel_id_num`:

`1473083`

persisted REOS `Parcel ID`:

`1473083`

result:

`SOURCE_PARCEL_EQUALS_PERSISTED_PARCEL=true`

This comparison does not make OPA `parcel_number` interchangeable with the
persisted REOS Parcel ID.

## 16. Source OPA account binding

Every qualifying source observation MUST contain the same:

`opa_account_num`

The value MUST match:

`^[0-9]{9}$`

The future certifier MUST derive the OPA account only from the corroborating
certified source observations.

The caller MUST NOT supply or override the OPA account.

For the motivating case:

`183124510`

## 17. Exact OPA property-row requirement

`opaAccountRows` MUST contain exactly one row.

That row MUST contain only the property-source fields required by this
certification boundary:

- `parcel_number`;
- `location`.

The row `parcel_number` MUST equal the independently derived source
`opa_account_num` exactly.

For the motivating case:

`parcel_number = 183124510`

and:

`location = 1616-42 N BODINE ST`

Zero rows fail closed.

Multiple rows fail closed.

## 18. Owner and mailing fields prohibited

This certification boundary MUST NOT consume, retrieve, inspect, compare,
return, or branch on:

- `owner_1`;
- `owner_2`;
- `mailing_address_1`;
- `mailing_address_2`;
- `mailing_care_of`;
- `mailing_city_state`;
- `mailing_street`;
- `mailing_zip`.

No owner-name or owner-mailing evidence is authorized by this design increment.

## 19. Existing range evaluator must be reused

The future certifier MUST NOT implement a second independent range parser.

It SHOULD invoke:

`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator.evaluate(...)`

exactly once using:

- `normalLookupEvidence`;
- `sourceObservations`;
- `opaAccountRows`.

The existing evaluator remains the single implementation authority for:

- target grammar;
- range grammar;
- shortened range expansion;
- street suffix comparison;
- numeric containment;
- parity compatibility.

## 20. Required range-evaluator result

Certification is ineligible unless the exact evaluator result preserves:

- `ok: true`;
- mode `READ_ONLY_OPA_ACCOUNT_RANGE_EVIDENCE_EVALUATION`;
- phase `absentee_owner_opa_account_range_evidence_evaluation`;
- outcome `RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE`;
- `rangeContainmentDiagnosticCandidate: true`;
- `rangeContainmentCertifiedMatch: false`;
- all evaluator authority flags false.

For the motivating case it MUST also preserve:

- target house number `1624`;
- range start `1616`;
- range end `1642`;
- target street suffix `N BODINE ST`;
- OPA range street suffix `N BODINE ST`;
- `streetSuffixExact: true`;
- `targetNumberNumericallyWithinRange: true`;
- `targetParityCompatibleWithRange: true`.

## 21. New certification rule

Only the conjunction of all requirements in this contract MAY allow the future
certifier to return:

`PROPERTY_SOURCE_IDENTITY_CERTIFIED=true`

The conjunction includes at least:

1. exact-record evidence valid;
2. normal exact-address lookup outcome `NO_MATCH`;
3. identical row and dual identity across exact-record and lookup evidence;
4. normalized target/source addresses equal;
5. two through five distinct source observations;
6. identical source `parcel_id_num`;
7. source `parcel_id_num` exactly equals persisted REOS `Parcel ID`;
8. identical nine-digit source `opa_account_num`;
9. exactly one OPA property row;
10. OPA `parcel_number` exactly equals source `opa_account_num`;
11. existing range evaluator returns
    `RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE`;
12. exact street suffix;
13. numeric containment;
14. parity compatibility;
15. all upstream authority flags false.

No individual condition is independently sufficient.

## 22. Certification output boundary

A future successful result MAY expose only bounded property-source identity
evidence such as:

- `ok: true`;
- mode `READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION`;
- phase `absentee_owner_opa_account_range_property_source_identity_certification`;
- outcome `PROPERTY_SOURCE_IDENTITY_CERTIFIED`;
- target row and dual identity;
- normalized verified target address;
- persisted REOS Parcel ID;
- corroborating source-observation identities;
- source `parcel_id_num`;
- source `opa_account_num`;
- OPA `parcel_number`;
- OPA `location`;
- target house number;
- range start;
- range end;
- exact street suffix evidence;
- numeric-containment evidence;
- parity evidence;
- `propertySourceIdentityCertified: true`;
- `rangeContainmentDiagnosticCandidate: true`;
- `rangeContainmentCertifiedMatch: false`.

It MUST NOT return owner or mailing evidence.

## 23. Certification basis

A successful result SHOULD identify its basis as:

`EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT`

This basis means only that the official OPA property-source row has been
certified for this evidence path.

It MUST NOT be interpreted as canonical identity migration authority.

## 24. Failure-closed outcomes

The future certifier SHOULD distinguish at least:

- `INELIGIBLE_EXACT_RECORD_EVIDENCE`;
- `INELIGIBLE_NORMAL_LOOKUP_EVIDENCE`;
- `TARGET_IDENTITY_MISMATCH`;
- `TARGET_ADDRESS_MISMATCH`;
- `SOURCE_CORROBORATION_INSUFFICIENT`;
- `SOURCE_OBSERVATION_IDENTITY_DUPLICATE`;
- `SOURCE_ADDRESS_DISAGREEMENT`;
- `SOURCE_PARCEL_DISAGREEMENT`;
- `SOURCE_PARCEL_TARGET_MISMATCH`;
- `SOURCE_OPA_ACCOUNT_DISAGREEMENT`;
- `SOURCE_OPA_ACCOUNT_INVALID`;
- `OPA_ACCOUNT_NO_MATCH`;
- `OPA_ACCOUNT_AMBIGUOUS`;
- `OPA_ACCOUNT_IDENTIFIER_MISMATCH`;
- `RANGE_DIAGNOSTIC_INELIGIBLE`.

Every failure MUST preserve:

`PROPERTY_SOURCE_IDENTITY_CERTIFIED=false`

The target remains deferred.

## 25. No canonical identity repair

Successful property-source certification MUST NOT change:

- physical `DISTRESS_LEADS` row;
- `Distress Lead ID`;
- `Canonical Property Key`;
- persisted `Parcel ID`;
- persisted `Address`;
- source-observation identity.

The OPA account remains source provenance, not canonical REOS identity.

This design requires:

`CANONICAL_IDENTITY_REPAIR_AUTHORITY_GRANTED=false`

## 26. No owner-evidence retrieval authority

A successful future property-source certification does not itself authorize a
network request for owner or mailing fields.

A separate future design MUST define the minimum owner-evidence projection,
source query, cardinality, transport, and return contract.

This design requires:

`OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false`

## 27. No owner-evidence comparison handoff

The existing:

`REOS.AbsenteeOwnerOwnerEvidenceComparison`

requires normal OPA evidence with outcome:

`MATCHED`

and certified mailing evidence.

A property-source certification result MUST NOT be passed directly to that
comparison layer.

This design does not modify its input domain.

## 28. No classification authority

The existing:

`REOS.AbsenteeOwnerClassification`

does not consume range diagnostic evidence or property-source certification
evidence directly.

This design MUST NOT add such a handoff.

This design requires:

`CLASSIFICATION_AUTHORITY_GRANTED=false`

## 29. No persistence authority

This boundary MUST NOT call or authorize:

- classification evidence storage;
- owner-evidence persistence;
- enrichment persistence;
- acquisition-record mutation;
- canonical-key mutation;
- Parcel ID mutation;
- Address mutation.

This design requires:

`PERSISTENCE_AUTHORITY_GRANTED=false`

and:

`ROLLOUT_AUTHORITY_GRANTED=false`

## 30. No property-source certification persistence

A future certification result is an observational result unless and until a
separate persistence contract is designed and authorized.

No field named `propertySourceIdentityCertified` may be written to production
by this design increment.

## 31. No scheduler, trigger, or batch authority

The future certification boundary MUST NOT introduce:

- scheduler execution;
- trigger execution;
- batch certification;
- source-wide certification;
- pagination;
- retry queues;
- automatic iteration;
- ingestion-time execution;
- recurring execution.

One explicitly selected target remains the maximum future execution scope.

## 32. County isolation

This boundary MUST NOT execute or alter:

- county ingestion;
- county scheduler;
- county checkpoints;
- county cursors;
- county collapse;
- county migration;
- county repair;
- county leases.

Previously certified county source observations may be consumed only as
immutable evidence.

## 33. Existing exact-address owner lookup unchanged

The existing:

`REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`

MUST remain unchanged.

Its `exact_property_address` semantics remain authoritative.

This boundary MUST NOT weaken that lookup or silently add range behavior to it.

## 34. Existing evaluator unchanged

The existing:

`REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator`

MUST remain unchanged by this design increment.

The historical field:

`rangeContainmentCertifiedMatch`

MUST remain false.

The new certification fact belongs to a separate layer.

## 35. Acquisition safety boundary

Property-source identity certification is supplemental evidence only.

It MUST NOT:

- populate Qualified Deal Queue;
- advance acquisition lifecycle;
- establish ARV;
- establish repair scope;
- calculate MAO;
- authorize an offer;
- generate an offer;
- submit an offer.

Automatic MAO or offer authority still requires both adequate comp-supported
ARV and an adequate repair scope through independently certified acquisition
paths.

This design requires:

`ARV_AUTHORITY_GRANTED=false`

`REPAIR_SCOPE_AUTHORITY_GRANTED=false`

`MAO_AUTHORITY_GRANTED=false`

`OFFER_AUTHORITY_GRANTED=false`

## 36. Required future behavior cases

A future behavior validator SHOULD cover at least:

1. motivating row-1530 evidence certifies property-source identity;
2. exact-record evidence missing fails closed;
3. selector authority flag true fails closed;
4. normal lookup outcome other than `NO_MATCH` fails closed;
5. target row mismatch fails closed;
6. Distress Lead ID mismatch fails closed;
7. Canonical Property Key mismatch fails closed;
8. exact-record/lookup address disagreement fails closed;
9. fewer than two source observations fails closed;
10. more than five source observations fails closed;
11. duplicate source-observation identity fails closed;
12. case-only address variation is accepted;
13. repeated-whitespace address variation is accepted;
14. punctuation transformation is not performed;
15. source address disagreement fails closed;
16. source parcel disagreement fails closed;
17. source parcel differs from persisted Parcel ID fails closed;
18. source OPA account disagreement fails closed;
19. non-nine-digit OPA account fails closed;
20. zero OPA account rows fails closed;
21. multiple OPA account rows fails closed;
22. OPA parcel number differs from source account fails closed;
23. evaluator non-candidate result fails closed;
24. evaluator authority flag true fails closed;
25. certified result preserves `rangeContainmentCertifiedMatch=false`;
26. certified result emits no owner fields;
27. certified result emits no mailing fields;
28. no external HTTP is executed;
29. no database/spreadsheet operation is executed;
30. no classification or persistence surface is executed;
31. input envelopes are not mutated;
32. row `1532` is never automatically processed.

## 37. Future implementation sequence

Any future implementation requires separate authorization and SHOULD proceed:

1. certify this design;
2. commit design only;
3. design PR CI;
4. merge design;
5. post-merge design CI;
6. authorize pure certifier implementation;
7. implement internal pure certification module;
8. static validator;
9. deterministic behavior validator;
10. integration reconciliation;
11. implementation PR CI;
12. exact-head merge;
13. post-merge implementation CI;
14. independent implementation evidence review;
15. separately design any production orchestration surface;
16. separately certify deployment if runtime exposure changes;
17. separately authorize one-target production certification;
18. review the certification result;
19. separately design minimum owner/mailing evidence retrieval;
20. separately design any comparison/classification handoff.

No step implies authority for the next step.

## 38. Design-only increment

This increment creates only:

- this design document;
- its offline design validator.

It MUST NOT create:

- production Apps Script;
- an RPC;
- an OPA lookup implementation;
- an owner-evidence retrieval implementation;
- a classifier change;
- a comparison-layer change;
- a persistence change;
- a deployment change.

Successful design validation does not authorize implementation.

Successful implementation would not authorize production execution.

## 39. Contract invariant

The invariant is:

one exact verified REOS target
+ normal exact-address OPA `NO_MATCH`
+ two through five independently certified source observations
+ source parcel equal to persisted REOS Parcel ID
+ one identical nine-digit source OPA account
+ exactly one official OPA property row for that account
+ the existing restricted deterministic range-evaluator candidate
= at most one certified property-source identity result

and:

`RANGE_CONTAINMENT_CERTIFIED_MATCH=false`

and:

no owner evidence retrieval
+ no classification
+ no persistence
+ no canonical identity repair
+ no ARV
+ no repair scope
+ no MAO
+ no offer authority.
