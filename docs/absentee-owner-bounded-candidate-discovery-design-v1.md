# Absentee-Owner Bounded Candidate Discovery Design v1

## 1. Purpose

Provide a narrowly bounded, admin-only, read-only discovery surface for
identifying existing `DISTRESS_LEADS` physical rows that already contain
both persisted identity dimensions required by the absentee-owner exact-record
selector:

- `Distress Lead ID`
- `Canonical Property Key`

This surface discovers candidate evidence only.

It does not establish canonical identity, repair identity, enrich owner data,
mutate a record, execute county work, or create acquisition authority.

## 2. Separation from exact-record verification

The existing:

`reosAbsenteeOwnerEnrichmentExactRecordEvidence(options)`

verifies one caller-supplied physical row plus expected persisted dual identity.

It does not discover the initial row.

Candidate discovery therefore remains a separate read-only evidence surface.

A discovery result MUST be passed through the exact-record selector in a
separate explicitly authorized step before any absentee-owner certification
mutation is considered.

## 3. Planned implementation surface

Planned implementation:

`build/apps-script-brand/AbsenteeOwnerEnrichmentCandidateDiscovery.js`

Planned public RPC:

`reosAbsenteeOwnerEnrichmentCandidateDiscovery(options)`

Neither surface is created by this design increment.

## 4. Administrative authority

The public RPC MUST call:

`REOS.Security.requireAdmin()`

before spreadsheet access.

Authorization failure MUST occur before any production record read.

## 5. Fixed table authority

The only permitted table is:

`DISTRESS_LEADS`

The caller MUST NOT select another table, sheet, workbook, database, connector,
source, county, or acquisition surface.

The discovery implementation MUST NOT create, rename, resize, or modify a
sheet.

## 6. Bounded input contract

The discovery RPC accepts one bounded physical window only.

Required logical input:

- `startRow`: finite integer physical row number, minimum `2`.
- `maxRows`: finite integer from `1` through `50`.

Hard maximum:

`MAX_ROWS = 50`

The caller MUST NOT provide:

- arrays of windows;
- predicates;
- arbitrary filters;
- source-wide searches;
- identity repair options;
- pagination loops;
- run-all semantics;
- scheduler context;
- trigger context.

One invocation examines at most one physical window.

## 7. No full-table abstraction

The discovery implementation MUST NOT call:

- `REOS.Database.getAll`
- `REOS.Database.query`
- `REOS.Database.findById`

It MUST NOT call another helper that internally expands into a complete
`DISTRESS_LEADS` data read.

A bounded output is not proof of a bounded physical read.

## 8. Header authority

The current header row MAY be read exactly once to resolve current physical
column authority.

The following headers MUST each occur exactly once:

- `Distress Lead ID`
- `Canonical Property Key`

Missing or duplicate required headers MUST fail closed.

Hard-coded physical identity column numbers are prohibited.

## 9. Physical candidate-window boundary

After header authority is established, the implementation MAY inspect only the
caller-requested physical candidate window bounded by:

- `startRow`;
- `maxRows`;
- current `sheet.getLastRow()`.

The implementation MUST NOT read before `startRow`.

The implementation MUST NOT read more than `50` candidate rows.

The implementation MUST NOT automatically advance into another window.

## 10. Identity-column-only evidence

Candidate discovery requires only the two persisted identity dimensions.

The implementation SHOULD physically read only the required identity columns
for the bounded window.

It MUST NOT read complete production rows merely to discover candidates.

It MUST NOT read owner fields, acquisition fields, deal fields, ARV fields,
repair fields, MAO fields, or offer fields for candidate discovery.

## 11. Candidate qualification

A row is a candidate only when both persisted values are nonblank after
string normalization:

- `Distress Lead ID`
- `Canonical Property Key`

A blank value in either dimension excludes that row from candidate output.

The discovery implementation MUST NOT derive, calculate, reconstruct, repair,
backfill, infer, guess, or manufacture either identity value.

Address-derived identity MUST NOT substitute for persisted identity.

Source-derived identity MUST NOT substitute for persisted identity.

## 12. Candidate semantics

A discovery candidate means only:

"this physical row currently contains two nonblank persisted identity values."

It does NOT mean:

- globally unique identity;
- canonical identity certification;
- exact-record selector success;
- owner evidence;
- absentee-owner match;
- enrichment eligibility;
- persistence authority;
- mutation authority;
- acquisition qualification.

Global uniqueness MUST NOT be inferred from a bounded window.

## 13. Returned candidate evidence

Each returned candidate SHOULD contain only:

- physical `rowNumber`;
- persisted `Distress Lead ID`;
- persisted `Canonical Property Key`.

The response MAY additionally contain bounded-window metadata:

- `startRow`;
- `rowsInspected`;
- `lastRow`;
- `nextStartRow`;
- `exhausted`;
- `candidateCount`.

`nextStartRow` is informational only.

The implementation MUST NOT automatically invoke another discovery window.

## 14. No complete-record return

Candidate discovery MUST NOT return the complete `DISTRESS_LEADS` record.

Complete row evidence belongs to the existing exact-record selector after a
specific candidate is explicitly selected.

## 15. Read-only authority

Every successful or failed discovery result MUST preserve:

- `mode: "READ_ONLY"`
- `productionDataMutationAuthorityGranted: false`
- `canonicalIdentityRepairAuthorityGranted: false`
- `migrationAuthorityGranted: false`
- `schedulerAuthorityGranted: false`
- `triggerAuthorityGranted: false`
- `connectorExecutionAuthorityGranted: false`
- `certificationMutationAuthorityGranted: false`
- `automaticOfferAuthorityGranted: false`

## 16. Mutation prohibition

Candidate discovery MUST NOT call or reach:

- `REOS.Database.insert`
- `REOS.Database.update`
- `REOS.Database.upsert`
- database delete APIs
- `setValue`
- `setValues`
- `appendRow`
- `deleteRow`
- `SpreadsheetApp.flush`
- property writes
- checkpoint writes
- cursor writes
- trigger installation
- trigger deletion
- acquisition mutation APIs

No production data mutation is authorized.

## 17. County isolation

Candidate discovery MUST NOT execute or alter:

- county connectors;
- county scheduler;
- county checkpoints;
- county cursors;
- county durable-identity migration;
- county collapse;
- county repairs;
- county blocked-storage backfill;
- county mutation-exclusion lease state.

A county-originated record may appear only as an already-existing
`DISTRESS_LEADS` row inside the bounded read window.

## 18. Absentee-owner pipeline isolation

Candidate discovery MUST NOT call:

- `reosAbsenteeOwnerEnrichmentCertifySingleRecord`
- `REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize`
- `REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan`
- `REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare`
- `REOS.AbsenteeOwnerEnrichmentExecutor.execute`

Candidate discovery grants no enrichment mutation authority.

## 19. Owner-evidence boundary

Persisted canonical identity is not owner evidence.

Candidate discovery MUST NOT manufacture, infer, or populate:

- `Owner Name`
- `Owner Mailing Address`
- absentee status
- occupancy status

A later `MATCHED` enrichment still requires real owner evidence through the
certified enrichment path.

`NO_MATCH` remains non-affirmative evidence.

## 20. Exact-selector handoff

A selected candidate MUST be reverified separately through:

`reosAbsenteeOwnerEnrichmentExactRecordEvidence(options)`

using exactly:

- the discovered physical `rowNumber`;
- the discovered persisted `Distress Lead ID`;
- the discovered persisted `Canonical Property Key`.

Candidate discovery MUST NOT silently perform this verification itself.

## 21. Failure semantics

Discovery fails closed for:

- unauthorized caller;
- malformed `startRow`;
- malformed `maxRows`;
- `maxRows > 50`;
- unavailable active spreadsheet;
- missing `DISTRESS_LEADS`;
- invalid sheet geometry;
- missing required identity header;
- duplicate required identity header;
- unexpectedly broad read condition.

Failure MUST NOT trigger:

- fallback full-table scanning;
- identity derivation;
- identity repair;
- another automatic window;
- production mutation;
- county execution;
- certification execution.

## 22. End-of-sheet behavior

If `startRow` is beyond the current last data row, discovery SHOULD return a
read-only exhausted result with:

- zero rows inspected;
- zero candidates;
- `exhausted: true`;
- no candidate data-range read.

This condition MUST NOT trigger a search elsewhere.

## 23. Idempotence

Candidate discovery is observational.

Repeated invocation against unchanged physical state with identical input
SHOULD return equivalent candidate evidence.

It has no intended mutation side effects.

## 24. Acquisition safety gate

Candidate discovery MUST NOT:

- create or update a Qualified Deal Queue record;
- advance an acquisition lifecycle;
- establish ARV;
- establish repair scope;
- calculate MAO;
- authorize an offer;
- generate an offer;
- submit an offer.

Automatic MAO or offer authority requires both adequate comp-supported ARV and
an adequate repair scope through their independently certified paths.

Absentee-owner candidate discovery and enrichment cannot bypass that gate.

## 25. Implementation certification sequence

If separately authorized, implementation proceeds through:

1. candidate-discovery implementation;
2. static validator;
3. behavior validator;
4. proof of hard `MAX_ROWS = 50`;
5. proof that no `Database.getAll/query/findById` path is used;
6. proof that no complete production row is read;
7. proof that no automatic multi-window scan occurs;
8. runtime-integration reconciliation if required;
9. lifecycle-validator reconciliation if required;
10. CI;
11. merge;
12. deployment certification;
13. explicit authorization for one bounded production discovery invocation;
14. one bounded read-only discovery invocation;
15. separate exact-record selector verification of one chosen candidate.

No step implies authority for the next step.

## 26. Promotion boundary

Successful candidate discovery does not authorize:

- canonical identity repair;
- owner enrichment;
- certification mutation;
- bulk enrichment;
- scheduled enrichment;
- provider orchestration;
- automatic retries;
- county execution;
- scheduler changes;
- trigger changes;
- MAO;
- offer generation;
- automatic offer authority.

The discovery surface remains bounded, observational, and read-only.
