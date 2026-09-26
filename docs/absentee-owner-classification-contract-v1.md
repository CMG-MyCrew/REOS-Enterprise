# Absentee-Owner Classification Contract v1

## 1. Purpose

This contract defines a deterministic, read-only absentee-owner classification
layer that consumes only previously certified owner-evidence comparison output.

It does not perform owner lookup, property lookup, enrichment persistence,
occupancy determination, vacancy determination, acquisition scoring, MAO
calculation, offer generation, or offer submission.

The classification is a mailing-evidence classification only.

## 2. Runtime boundary

A future implementation may expose only the internal runtime surface:

`REOS.AbsenteeOwnerClassification.classify(comparisonEvidence)`

Version 1 MUST NOT expose a production RPC.

The classifier accepts exactly one comparison-evidence object per invocation.

Batch classification is outside Version 1.

## 3. Required upstream authority

The only admissible upstream authority is output from:

`REOS.AbsenteeOwnerOwnerEvidenceComparison.compare(ownerEvidence)`

The upstream object MUST identify:

- mode `READ_ONLY_OWNER_EVIDENCE_COMPARISON`;
- phase `absentee_owner_owner_evidence_comparison`;
- a recognized comparison outcome; and
- all upstream authority flags required by the comparison contract as false.

The classifier MUST NOT bypass the comparison layer and MUST NOT consume raw OPA
owner-evidence lookup output directly.

## 4. Upstream comparison outcomes

Version 1 recognizes exactly these upstream comparison outcomes:

- `MAILING_ADDRESS_MATCHES`
- `MAILING_ADDRESS_DIFFERS`
- `INSUFFICIENT_MAILING_EVIDENCE`
- `INELIGIBLE_OWNER_EVIDENCE`

No other upstream comparison outcome is admissible.

## 5. Classification outcomes

Version 1 produces exactly four classification outcomes:

- `ABSENTEE_OWNER_INDICATED`
- `OWNER_MAILING_MATCHED`
- `INSUFFICIENT_CLASSIFICATION_EVIDENCE`
- `INELIGIBLE_COMPARISON_EVIDENCE`

No boolean `absenteeOwner` field is produced.

No `ownerOccupied`, `vacant`, `nonOwnerOccupied`, or equivalent occupancy field
is produced.

## 6. Deterministic mapping

The classification mapping is exact:

| Upstream comparison outcome | Classification outcome |
| --- | --- |
| `MAILING_ADDRESS_DIFFERS` | `ABSENTEE_OWNER_INDICATED` |
| `MAILING_ADDRESS_MATCHES` | `OWNER_MAILING_MATCHED` |
| `INSUFFICIENT_MAILING_EVIDENCE` | `INSUFFICIENT_CLASSIFICATION_EVIDENCE` |
| `INELIGIBLE_OWNER_EVIDENCE` | `INELIGIBLE_COMPARISON_EVIDENCE` |

No score, threshold, fuzzy inference, owner-name comparison, or secondary-source
logic participates in this mapping.

## 7. Meaning of ABSENTEE_OWNER_INDICATED

`ABSENTEE_OWNER_INDICATED` means only:

The certified official owner mailing address differs from the certified subject
property address under the deterministic comparison contract.

It does not prove:

- where the owner physically resides;
- that the owner does not occupy the subject property;
- that the property is tenant occupied;
- that the property is vacant;
- that the property is abandoned;
- that the owner is unreachable;
- that acquisition qualification is satisfied; or
- that an offer may be generated.

The word `INDICATED` is mandatory because the classification is evidence-based
and does not establish physical occupancy.

## 8. Meaning of OWNER_MAILING_MATCHED

`OWNER_MAILING_MATCHED` means only:

The certified official owner mailing address matches the certified subject
property address after the upstream normalization contract.

It MUST NOT be renamed or interpreted as:

- `OWNER_OCCUPIED`;
- `OWNER_OCCUPIED_CONFIRMED`;
- resident owner;
- occupied property; or
- non-absentee proof.

Matching mailing evidence does not establish physical occupancy.

## 9. Insufficient evidence

`INSUFFICIENT_CLASSIFICATION_EVIDENCE` is required when the upstream comparison
outcome is `INSUFFICIENT_MAILING_EVIDENCE`.

The classifier MUST NOT convert missing or incomplete evidence into either
`ABSENTEE_OWNER_INDICATED` or `OWNER_MAILING_MATCHED`.

## 10. Ineligible evidence

`INELIGIBLE_COMPARISON_EVIDENCE` is required when:

- the upstream comparison outcome is `INELIGIBLE_OWNER_EVIDENCE`;
- mode is wrong;
- phase is wrong;
- required identity is missing;
- required result structure is malformed;
- an unexpected authority flag is true; or
- the input is not a certified comparison-result shape.

Ineligible evidence MUST fail closed.

## 11. Identity preservation

For eligible comparison results, the classifier MUST preserve without repair or
derivation:

- `rowNumber`;
- `Distress Lead ID`; and
- `Canonical Property Key`.

The classifier MUST NOT:

- derive missing identity;
- repair canonical identity;
- change source identity;
- create a new acquisition record; or
- infer identity from address text.

## 12. Comparison-evidence preservation

For eligible results, the classifier may preserve:

- upstream comparison outcome;
- normalized property address;
- normalized mailing address;
- deterministic differing components; and
- bounded source provenance already present in comparison evidence.

The classifier MUST NOT re-normalize addresses using a different algorithm.

The classifier MUST NOT perform its own address comparison.

## 13. Owner-name isolation

Owner names MUST NOT participate in classification.

The classifier MUST NOT inspect, compare, normalize, score, or infer from owner
names.

Owner-name similarity or difference has no classification authority.

## 14. No secondary evidence

Version 1 MUST NOT call or depend on:

- OPA;
- Carto;
- county connectors;
- external HTTP;
- geocoding;
- USPS;
- MLS;
- skip tracing;
- phone data;
- email data;
- utility data;
- voter data;
- tax-payment behavior;
- vacancy data; or
- any other secondary source.

Classification is derived only from the certified comparison evidence.

## 15. No persistence

Version 1 is observational only.

It MUST NOT:

- call `REOS.AbsenteeOwnerEnrichmentSanitizer`;
- call `REOS.AbsenteeOwnerEnrichmentPersistenceAdapter`;
- call `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder`;
- call `REOS.AbsenteeOwnerEnrichmentExecutor`;
- call `reosAbsenteeOwnerEnrichmentCertifySingleRecord`;
- write `Owner Name`;
- write `Owner Mailing Address`;
- add an `Absentee Owner` field;
- add an `Owner Occupied` field;
- add any classification field;
- update `Updated At`; or
- perform any database mutation.

Any future classification persistence requires a separate schema and persistence
contract.

## 16. Existing persistence boundary remains unchanged

The currently authorized absentee-owner enrichment-owned fields remain exactly:

- `Owner Name`
- `Owner Mailing Address`

This classification contract adds no persistent field.

## 17. Generic absentee connector isolation

The historical generic connector:

`reosConnectorHandleAbsenteeOwners`

is not classification authority.

Version 1 MUST NOT invoke, retrofit, depend on, or use evidence generated only by
that connector.

## 18. Legacy acquisition logic isolation

Historical logic in `AcquisitionDistressIntelligence.js` that interprets fields
such as:

- `Absentee Owner`;
- `Absentee`; or
- `Owner Occupied`

is not authority for this classifier.

The classifier MUST NOT invoke or adopt the historical weighted
`ABSENTEE_OWNER` acquisition-scoring rule.

The new classification result MUST NOT automatically flow into that legacy
scoring path.

## 19. Result envelope

A future eligible classification result must use:

- mode `READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION`;
- phase `absentee_owner_classification`;
- one of the four exact classification outcomes;
- preserved target identity;
- upstream comparison outcome;
- classification basis `OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON`; and
- all downstream authority flags required by this contract as false.

An eligible `ABSENTEE_OWNER_INDICATED` result may preserve
`differingComponents`.

## 20. Authority flags

Every classification result MUST preserve false authority for at least:

- `productionDataMutationAuthorityGranted`;
- `ownerEvidencePersistenceAuthorityGranted`;
- `classificationPersistenceAuthorityGranted`;
- `canonicalIdentityRepairAuthorityGranted`;
- `migrationAuthorityGranted`;
- `schedulerAuthorityGranted`;
- `triggerAuthorityGranted`;
- `connectorExecutionAuthorityGranted`;
- `certificationMutationAuthorityGranted`;
- `ownerOccupancyAuthorityGranted`;
- `vacancyAuthorityGranted`;
- `qualifiedDealQueueAuthorityGranted`;
- `acquisitionLifecycleAuthorityGranted`;
- `automaticOfferAuthorityGranted`.

A read-only classification outcome is evidence only and grants no downstream
mutation or acquisition authority.

## 21. Acquisition safety gate

Classification MUST NOT:

- create Qualified Deal Queue authority;
- advance acquisition lifecycle;
- establish ARV;
- establish repair scope;
- calculate MAO;
- generate an offer;
- authorize an offer; or
- submit an offer.

Automatic MAO or offer authority continues to require both comp-supported ARV
and an adequate repair scope.

An absentee-owner indication cannot substitute for either requirement.

## 22. County and scheduler isolation

Version 1 MUST NOT:

- execute county ingestion;
- call `CountyRuntimeBridge`;
- call `CountyConnectorSDK`;
- call `PAPhiladelphiaCountyConnector`;
- open or close county maintenance;
- alter county checkpoints;
- alter county cursors;
- alter county scheduler state; or
- create, delete, or modify triggers.

## 23. Required safety boundaries

Version 1 preserves exactly these 25 design boundaries:

1. single comparison-evidence input only;
2. no batch classification;
3. no scheduler;
4. no trigger;
5. no external HTTP;
6. no OPA lookup;
7. no secondary source;
8. no raw owner-name matching;
9. no fuzzy address matching;
10. no geocoding;
11. no production REOS read;
12. no production mutation;
13. no owner-evidence persistence;
14. no classification persistence;
15. no canonical identity repair;
16. no migration;
17. no generic absentee connector authority;
18. no legacy acquisition scoring authority;
19. no Qualified Deal Queue authority;
20. no acquisition lifecycle authority;
21. no ARV authority;
22. no repair-scope authority;
23. no MAO authority;
24. no offer-generation authority;
25. no offer-submission authority.

## 24. Row 377 certified fixture

The certified upstream evidence chain is:

- row `377`;
- Distress Lead ID `DL-20260731203649-4601`;
- Canonical Property Key
  `property|address|pa|philadelphia|19141-4008|5146 n 10th st`;
- owner-evidence response SHA-256
  `d5d949e3cd9dfb533b78bafd838947adb4aeb1b1c76d1e287c71ac539fdeb521`;
- comparison-evidence SHA-256
  `7f495bb5973ff9a09b4ec67e5362a4da943a873d4ccdf74bdfbf916612d5f456`;
- upstream comparison outcome `MAILING_ADDRESS_DIFFERS`;
- differing components `street,zip`.

Under this classification contract, the expected future classification result
for this fixture is:

`ABSENTEE_OWNER_INDICATED`

This means only that the official owner mailing address differs from the subject
property address.

It does not establish physical occupancy or vacancy.

No classification is executed or persisted by this design document.

## 25. Required future behavioral validation

A future implementation behavioral validator MUST cover at least:

1. `MAILING_ADDRESS_DIFFERS` maps to `ABSENTEE_OWNER_INDICATED`;
2. `MAILING_ADDRESS_MATCHES` maps to `OWNER_MAILING_MATCHED`;
3. insufficient mailing evidence maps to insufficient classification evidence;
4. ineligible comparison evidence maps to ineligible classification evidence;
5. wrong upstream mode fails closed;
6. wrong upstream phase fails closed;
7. missing target identity fails closed;
8. unexpected true upstream authority fails closed;
9. owner names do not participate;
10. external HTTP is never called;
11. persistence surfaces are never called;
12. database mutation is never called;
13. no owner-occupancy field is produced;
14. no vacancy field is produced;
15. no boolean absentee-owner field is produced;
16. legacy acquisition scoring is never called;
17. generic absentee connector is never called;
18. scheduler and trigger surfaces are never called;
19. row-377 certified fixture returns `ABSENTEE_OWNER_INDICATED`; and
20. all downstream authority flags remain false.

## 26. Promotion sequence

The classification workstream MUST proceed incrementally:

1. classification contract design;
2. design validation;
3. design review and merge;
4. separate implementation authorization;
5. implementation;
6. static validation;
7. behavioral validation;
8. runtime integration reconciliation if required;
9. CI;
10. merge;
11. deployment certification if runtime enters Apps Script;
12. separately authorized read-only classification;
13. review of classification result;
14. separate schema/persistence design if classification persistence is desired.

No step implies authority for the next step.

## 27. Version-1 exclusions

Version 1 excludes:

- batch classification;
- scheduled classification;
- production RPC exposure;
- persistence;
- occupancy determination;
- vacancy determination;
- fuzzy address matching;
- owner-name matching;
- geocoding;
- secondary data sources;
- generic connector execution;
- legacy acquisition scoring;
- lifecycle advancement;
- MAO generation; and
- offer authority.
