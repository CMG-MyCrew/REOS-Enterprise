# Absentee-Owner Classification Persistence Certified Property-Source Provenance Extension v2

## 1. Purpose

Define an additive version-2 classification-persistence provenance contract for
absentee-owner classifications derived through the certified property-source
identity owner-evidence path.

Version 2 exists because the existing version-1 classification evidence store
can accept the final classifier shape but cannot durably represent the complete
provenance required by the certified `certified_opa_account` fallback path.

This document is design authority only.

It does not authorize implementation, deployment, evidence-store provisioning,
persistence execution, bounded rollout, scheduling, classification execution,
owner-evidence lookup, or production mutation.

## 2. Certified motivating case

The first motivating certified case is row 1530:

- Distress Lead ID:
  `DL-20260825185532-4474`
- Canonical Property Key:
  `property|parcel|pa|philadelphia|1473083`
- normal exact-address owner lookup:
  `NO_MATCH`
- certified OPA account:
  `183124510`
- property-source certification basis:
  `EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT`
- certified owner-evidence lookup mode:
  `certified_opa_account`
- comparison outcome:
  `MAILING_ADDRESS_DIFFERS`
- differing components:
  `street,zip`
- classification outcome:
  `ABSENTEE_OWNER_INDICATED`

This classification is observational evidence only.

It does not establish physical occupancy, vacancy, acquisition qualification,
ARV, repair scope, MAO, or offer authority.

## 3. Existing v1 architecture remains authoritative for v1

The existing v1 persistence architecture remains frozen and unchanged:

- `REOS.AbsenteeOwnerClassificationPersistencePlanner`
- `REOS.AbsenteeOwnerClassificationEvidenceStore`
- `REOS.AbsenteeOwnerClassificationPersistenceExecutor`
- `REOS.AbsenteeOwnerClassificationBoundedRollout`

The existing v1 evidence sheet remains exactly:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`

Its exact 20-column schema MUST NOT be altered by this v2 extension.

The existing Script Property remains:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

Version 2 MUST NOT reinterpret, migrate, rewrite, extend, truncate, or repair
existing v1 evidence rows.

## 4. Why v1 is insufficient for the certified-account path

The v1 classifier result shape remains valid and the existing v1 planner can
accept the row-1530 classifier result.

However, the v1 persisted event does not retain the certified-account path's
required provenance:

- owner-evidence lookup mode;
- certified OPA account;
- property-source identity certification basis;
- property-source identity certification artifact hash;
- normal lookup evidence artifact hash;
- owner-evidence result artifact hash; and
- owner-evidence comparison artifact hash.

The existing v1 bounded rollout also invokes the exact-address owner lookup and
does not compose the certified-account fallback path.

Therefore v1 MUST NOT be treated as complete persistence authority for this
newly certified path.

## 5. Additive v2 architecture

Version 2 MUST be additive.

It MUST use a separate evidence sheet in the same configured classification
evidence workbook:

`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2`

The v2 sheet MUST NOT replace or rename the v1 sheet.

The existing workbook Script Property may be reused:

`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`

Creation or provisioning of the v2 sheet requires a separate administrative
authorization.

The runtime MUST NOT silently create the workbook or the v2 sheet.

## 6. Persistence contract versions

For v2 persisted events:

- Persistence Contract Version:
  `2`
- Classification Contract Version:
  `1`

The existing classifier semantics are not changed by this contract.

## 7. Exact certified upstream chain

A v2 persistence plan for the certified-account path may be formed only from
an internally produced exact evidence bundle containing:

1. `propertySourceIdentityCertification`
2. `normalLookupEvidence`
3. `ownerEvidenceResult`
4. `comparisonResult`
5. `classificationResult`

No public caller may manufacture or directly supply an arbitrary persistence
plan.

A future orchestrator must construct the evidence bundle only from separately
certified runtime surfaces.

This design does not authorize that orchestrator.

## 8. Required property-source certification

`propertySourceIdentityCertification` MUST identify:

- mode:
  `READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION`
- phase:
  `absentee_owner_opa_account_range_property_source_identity_certification`
- outcome:
  `PROPERTY_SOURCE_IDENTITY_CERTIFIED`
- certification basis:
  `EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT`
- `propertySourceIdentityCertified: true`
- `rangeContainmentDiagnosticCandidate: true`
- `rangeContainmentCertifiedMatch: false`
- a canonical nine-digit certified OPA account
- exact target row and dual identity
- all authority fields false.

## 9. Required normal lookup evidence

`normalLookupEvidence` MUST identify:

- mode:
  `READ_ONLY_OWNER_EVIDENCE`
- phase:
  `absentee_owner_philadelphia_owner_evidence_lookup`
- outcome:
  `NO_MATCH`
- bounded source row count:
  `0`
- lookup mode:
  `exact_property_address`
- the exact same target row and dual identity
- all authority fields false.

A certified-account v2 event is prohibited unless the normal lookup first
failed closed as `NO_MATCH`.

## 10. Required certified-account owner evidence

`ownerEvidenceResult` MUST identify:

- mode:
  `READ_ONLY_OWNER_EVIDENCE`
- phase:
  `absentee_owner_certified_property_source_identity_owner_evidence_lookup`
- outcome:
  `MATCHED`
- bounded source row count:
  `1`
- lookup mode:
  `certified_opa_account`
- the same certified nine-digit OPA account
- the same target row and dual identity
- the same property-source certification basis
- `propertySourceIdentityCertified: true`
- `rangeContainmentDiagnosticCandidate: true`
- `rangeContainmentCertifiedMatch: false`
- all authority fields false.

Raw owner-name fields may be present transiently in the certified upstream
artifact but MUST NOT be written to the v2 classification evidence store.

## 11. Required comparison result

`comparisonResult` MUST identify:

- mode:
  `READ_ONLY_OWNER_EVIDENCE_COMPARISON`
- phase:
  `absentee_owner_owner_evidence_comparison`
- an eligible deterministic comparison outcome;
- exact target row and dual identity;
- normalized property address;
- normalized mailing address;
- deterministic differing components when applicable;
- the same certified OPA account for the certified-account path; and
- all authority fields false.

Version 2 MUST NOT recompute comparison semantics using a different algorithm.

## 12. Required classifier result

`classificationResult` MUST satisfy the existing classification contract:

- mode:
  `READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION`
- phase:
  `absentee_owner_classification`
- classification basis:
  `OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON`
- exact target row and dual identity;
- exact upstream comparison outcome;
- exact normalized comparison evidence;
- exact differing components when applicable; and
- all downstream authority fields false.

Persistable outcomes remain exactly:

- `ABSENTEE_OWNER_INDICATED`
- `OWNER_MAILING_MATCHED`
- `INSUFFICIENT_CLASSIFICATION_EVIDENCE`

`INELIGIBLE_COMPARISON_EVIDENCE` MUST NOT be persisted as successful evidence.

## 13. Exact cross-artifact linkage

The future v2 planner MUST fail closed unless all five evidence artifacts agree
on the target row and dual identity.

It MUST additionally require:

- normal lookup outcome is `NO_MATCH`;
- property-source certification account is nine digits;
- certified-account owner-evidence account equals the certification account;
- owner-evidence certification basis equals the property-source certification basis;
- comparison input semantics correspond to the certified owner-evidence result;
- classifier upstream outcome equals the comparison outcome;
- classifier normalized address evidence equals the comparison normalized address evidence; and
- classifier differing components equal the comparison differing components.

No canonical identity repair is permitted.

## 14. Artifact hashes are runtime-derived

The future v2 planner MUST compute deterministic SHA-256 values itself.

Caller-supplied artifact hashes MUST NOT be trusted.

It MUST derive:

- Property Source Identity Certification SHA-256
- Normal Lookup Evidence SHA-256
- Owner Evidence Result SHA-256
- Comparison Result SHA-256
- Classifier Result SHA-256

Each hash MUST be computed from deterministic canonical JSON of the exact
validated artifact.

The Owner Evidence Result SHA-256 is a whole-artifact provenance fingerprint.
It MUST NOT be used for owner-name matching, searching, scoring, or identity
resolution.

No owner-name-specific hash is authorized.

## 15. Exact v2 persisted schema

The v2 evidence sheet MUST contain exactly these 27 columns in this order:

1. `Evidence Event ID`
2. `Observed At UTC`
3. `Persistence Contract Version`
4. `Classification Contract Version`
5. `Distress Lead ID`
6. `Canonical Property Key`
7. `Physical Row Number`
8. `Classification Outcome`
9. `Classification Basis`
10. `Upstream Comparison Outcome`
11. `Differing Components JSON`
12. `Normalized Property Address JSON`
13. `Normalized Mailing Address JSON`
14. `Source Agency`
15. `Source Dataset`
16. `Source Table`
17. `Source Endpoint`
18. `Owner Evidence Lookup Mode`
19. `Certified OPA Account`
20. `Property Source Identity Certification Basis`
21. `Property Source Identity Certification SHA-256`
22. `Normal Lookup Evidence SHA-256`
23. `Owner Evidence Result SHA-256`
24. `Comparison Result SHA-256`
25. `Classifier Result SHA-256`
26. `Previous Evidence SHA-256`
27. `Evidence Event SHA-256`

No additional column is authorized by this design.

## 16. Fixed provider provenance

Version 2 remains fixed to:

- Source Agency:
  `Philadelphia Office of Property Assessment`
- Source Dataset:
  `Philadelphia Properties and Assessment History`
- Source Table:
  `opa_properties_public`
- Source Endpoint:
  `https://phl.carto.com/api/v2/sql`
- Owner Evidence Lookup Mode:
  `certified_opa_account`
- Property Source Identity Certification Basis:
  `EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT`
- Classification Basis:
  `OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON`

A different provider, lookup mode, or certification basis requires another
contract revision.

## 17. No raw owner-name persistence

The v2 store MUST NOT persist:

- `owner_1`
- `owner_2`
- `Owner Name`
- raw OPA owner-name fields
- owner-name comparison results
- owner-name-specific hashes
- owner-name scores.

The whole owner-evidence artifact hash is provenance only and grants no
owner-name authority.

## 18. Address evidence

The v2 store MAY persist only the normalized address objects already emitted
by the certified comparison/classification chain.

It MUST NOT persist:

- the complete raw OPA owner row;
- raw provider payloads;
- unnormalized mailing envelopes;
- source API responses.

## 19. Deterministic v2 evidence event identity

The v2 Evidence Event ID MUST use the prefix:

`AOCE2-`

It MUST be deterministically derived from canonical data including at least:

- Persistence Contract Version;
- Classification Contract Version;
- Distress Lead ID;
- Canonical Property Key;
- Certified OPA Account;
- Property Source Identity Certification SHA-256;
- Normal Lookup Evidence SHA-256;
- Owner Evidence Result SHA-256;
- Comparison Result SHA-256; and
- Classifier Result SHA-256.

Two exact copies of the same complete evidence chain MUST derive the same
Evidence Event ID.

Changed certified provenance MAY derive a new event even when the final
classification outcome remains unchanged.

## 20. V2 idempotency

For the same dual identity and same deterministic v2 Evidence Event ID:

- no new evidence row may be appended;
- the disposition MUST be an exact duplicate/no-write result;
- no timestamp refresh may create a new event;
- no previous evidence row may be modified.

## 21. Changed evidence

For the same dual identity with a different deterministic v2 Evidence Event ID:

- existing events remain immutable;
- a new evidence event MAY be appended after all preconditions pass;
- the new event MUST chain to the immediately preceding valid v2 event.

Changed evidence MUST NOT overwrite history.

## 22. V1/V2 coexistence

V1 and v2 evidence sheets are independent append-only stores.

A future v2 persistence preflight MUST inspect whether the same target and exact
classifier-result evidence has already been persisted under v1.

If potentially equivalent v1 evidence already exists, v2 persistence MUST stop
for explicit reconciliation rather than silently duplicate or migrate it.

This design does not authorize migration of v1 rows.

## 23. V2 append-only hash chain

For the first v2 event for a dual identity:

`Previous Evidence SHA-256 = GENESIS`

Every later v2 event for the same dual identity MUST reference the exact
`Evidence Event SHA-256` of the immediately preceding valid v2 event.

`Evidence Event SHA-256` MUST be computed from the complete canonical v2 event
payload excluding only the final event-hash field.

No historical event may be updated or deleted.

## 24. Observed time

`Observed At UTC` MUST be generated by the trusted persistence runtime at the
persistence boundary.

Caller-supplied observation time is prohibited.

## 25. Spreadsheet safety

All persisted textual fields MUST be safe against spreadsheet formula
interpretation.

The v2 runtime MUST reject unsafe text rather than write formulas or formula
control prefixes.

## 26. Concurrency

A future v2 executor MUST protect:

1. v1-equivalence reconciliation;
2. v2 identity-history discovery;
3. duplicate-event detection;
4. previous-event hash selection;
5. append invocation; and
6. postappend verification

inside one bounded ScriptLock authority.

No OPA HTTP request may occur while the persistence lock is held.

## 27. Persistence outcome classes

Before the first physical v2 append invocation, a failure MUST mean definite
no-write precondition failure.

After the first physical append invocation, any exception or failed postimage
verification MUST be classified as outcome uncertain.

An uncertain persistence attempt MUST NOT be retried automatically.

## 28. No direct DISTRESS_LEADS classification write

Version 2 MUST NOT add, update, clear, or overwrite any absentee-owner
classification field on `DISTRESS_LEADS`.

The v2 evidence store is supplemental append-only evidence.

A future materialized/current-state projection requires a separate contract.

## 29. No v1 runtime retrofit in this design

This design does not authorize modification of:

- `AbsenteeOwnerClassificationPersistencePlanner.js`
- `AbsenteeOwnerClassificationEvidenceStore.js`
- `AbsenteeOwnerClassificationPersistenceExecutor.js`
- `AbsenteeOwnerClassificationBoundedRollout.js`

A future implementation may reuse algorithms or utilities only after a
separate implementation freeze identifies the exact new and modified files.

## 30. No public RPC in this design

Version 2 design does not authorize a production RPC.

It does not authorize caller-supplied arbitrary evidence bundles.

A future production orchestration contract must establish how the exact
five-artifact bundle is produced internally before v2 persistence may execute.

## 31. Bounded rollout remains separate

This design does not retrofit the existing v1 bounded rollout.

A future bounded-rollout extension for the certified-account path requires a
separate contract covering:

- explicit source references;
- exact-record read cardinality;
- normal exact-address owner lookup cardinality;
- source-evidence retrieval cardinality;
- property-source certification;
- certified-account owner lookup cardinality;
- comparison cardinality;
- classification cardinality;
- persistence cardinality; and
- fail-closed uncertainty behavior.

## 32. No evidence-store provisioning authority

This design does not authorize:

- creating `ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2`;
- changing the evidence workbook Script Property;
- creating a workbook;
- modifying v1 headers;
- migrating v1 rows.

Provisioning requires its own administrative surface and certification.

## 33. No execution authority

This design grants no authority for:

- production owner-evidence lookup;
- production source-evidence retrieval;
- comparison;
- classification;
- classification persistence;
- owner-evidence persistence;
- evidence-store append;
- bounded rollout;
- scheduler;
- trigger;
- automatic retry.

## 34. Acquisition isolation

V2 classification evidence MUST NOT:

- create or update Qualified Deal Queue;
- advance acquisition lifecycle;
- establish occupancy;
- establish vacancy;
- establish comp-supported ARV;
- establish repair scope;
- calculate MAO;
- calculate Suggested Offer;
- generate an offer;
- submit an offer;
- grant automatic-offer authority.

Automatic MAO or offer authority remains blocked unless both adequate
comp-supported ARV and adequate repair scope are independently established.

## 35. Required future implementation decomposition

Any future implementation SHOULD remain decomposed into independently
certifiable surfaces such as:

1. v2 certified-evidence-bundle validator;
2. v2 persistence planner/canonicalizer;
3. v2 append-only evidence store;
4. v2 persistence executor;
5. v2 evidence-store provisioning admin surface;
6. static validator;
7. behavioral validator;
8. integration validator.

A future production orchestrator is separate from these persistence mechanics.

## 36. Required implementation-freeze questions

Before implementation is authorized, a separate implementation freeze MUST
resolve:

1. exact runtime filenames;
2. exact modification surface;
3. whether canonical JSON utilities are reused or duplicated safely;
4. exact v1-equivalence reconciliation read boundary;
5. exact ScriptLock ownership;
6. exact postappend verification;
7. exact v2 provisioning surface;
8. exact evidence-bundle construction authority;
9. exact deployment registration impact;
10. exact validator inventory impact.

## 37. Required behavioral cases

Future validators MUST cover at least:

1. valid certified-account `ABSENTEE_OWNER_INDICATED`;
2. valid certified-account `OWNER_MAILING_MATCHED`;
3. valid insufficient-classification evidence;
4. normal lookup not `NO_MATCH`;
5. wrong certified lookup mode;
6. wrong certified OPA account;
7. certification-account mismatch;
8. certification-basis mismatch;
9. target row mismatch across artifacts;
10. Distress Lead ID mismatch across artifacts;
11. Canonical Property Key mismatch across artifacts;
12. comparison/classification outcome mismatch;
13. differing-component mismatch;
14. unexpected true authority flag;
15. unknown field in certified evidence;
16. owner-name fields never enter persisted row;
17. deterministic artifact hashes;
18. deterministic `AOCE2-` event ID;
19. exact duplicate is zero-write;
20. changed upstream provenance creates a distinct eligible event;
21. first event uses `GENESIS`;
22. later event chains to prior v2 event;
23. malformed historical v2 chain fails closed;
24. equivalent v1 evidence causes reconciliation stop;
25. unsafe spreadsheet text fails before write;
26. preappend failure is definite no-write;
27. postappend failure becomes outcome uncertain;
28. no automatic retry;
29. no `DISTRESS_LEADS` write;
30. no QDQ/lifecycle/ARV/repair/MAO/offer authority.

## 38. Promotion sequence

Version 2 MUST proceed incrementally:

1. certify this design candidate;
2. design precommit certification;
3. design commit;
4. push design branch;
5. create one design PR;
6. PR CI;
7. exact-head design merge;
8. post-merge main CI;
9. implementation discovery;
10. implementation freeze;
11. implementation authorization;
12. implementation;
13. offline validation;
14. implementation commit;
15. implementation PR;
16. post-merge CI;
17. deployment preflight;
18. deployment certification;
19. v2 evidence-store provisioning design/certification;
20. production orchestration design/certification;
21. explicit stage-1 persistence authorization;
22. one-target persistence certification;
23. persisted-evidence review.

No stage authorizes the next stage automatically.

## 39. Current authorization state

At completion of this design:

- v1 persistence remains unchanged;
- v1 evidence-store schema remains 20 columns;
- v2 evidence-store schema is design-only;
- v2 runtime does not exist;
- v2 sheet is not provisioned;
- row 1530 is not persisted by this design;
- owner evidence is not persisted;
- classification is not persisted;
- no external HTTP is executed;
- no production data is mutated;
- no scheduler or trigger is created;
- no acquisition authority is granted;
- no MAO or offer authority is granted.
