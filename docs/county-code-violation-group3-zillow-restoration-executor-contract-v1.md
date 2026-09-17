# County Code-Violation Group 3 Zillow Restoration Executor Contract v1

## Status

DESIGN ONLY.

This contract grants no production mutation authority, repair execution
authority, deployment authority, scheduler authority, checkpoint mutation
authority, reference-rewrite authority, physical-delete authority, or
automatic-offer authority.

Certified base:

`8430b6807f1c0ce5333e63f2ab8fe0584c61edea`

## Existing certified Group 3 authority

The merged Group 3 restoration contract establishes exactly:

- county survivor physical row 767:
  `DL-20260820181647-4170`;
- Zillow restoration physical row 771:
  `ZIL-20260820193920-1756`;
- Zillow provenance:
  `ZILLOW_GMAIL_IMPORTS` row 38;
- downstream reference:
  `ZILLOW_GMAIL_IMPORTS` row 38, column 13;
- downstream reference remains unchanged;
- no physical row delete is required;
- no downstream reference rewrite is required;
- physical `Distress Lead ID` must remain
  `ZIL-20260820193920-1756`;
- physical `Created At` lineage must remain unchanged.

## Executor isolation

A future executor, if separately implemented and certified, shall be:

`build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js`

The prospective protected writer ID is:

`CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION`

This writer ID does not currently exist in the county mutation-exclusion
lease registry.

The Page-86 writer ID:

`PAGE86_DUPLICATE_SOURCE_REPAIR`

MUST NOT be reused, borrowed, aliased, or treated as authority for Group 3.

Page-86 is implementation precedent only.

## Mutation primitive boundary

`REOS.Database.patchPhysicalRowCellsExact()` is NOT an adequate primitive
for Group 3 restoration.

Its current authority is intentionally limited to exactly:

- `Updated At`;
- `Last Seen At`;
- `Connector Run ID`.

Group 3 restoration requires a bounded full-row transformation from the
certified county-overwritten preimage to the certified Zillow postimage.

The existing exact-cell patch primitive MUST NOT be widened merely to make
Group 3 executable.

Before a Group 3 executor may exist, a separate certified full-row exact
replacement primitive is required.

Proposed future API:

`REOS.Database.replacePhysicalRowExact(sheetName, request, options)`

This contract does not implement that API.

## Required future full-row exact-replacement semantics

Any future full-row exact-replacement primitive must fail closed unless all
of the following are proven under the caller-owned Database ScriptLock
context:

1. exact spreadsheet identity;
2. exact sheet identity;
3. exact expected physical row number;
4. exact identity-field header and identity value;
5. exact header vector;
6. exact last-row and last-column geometry;
7. exact complete preimage values;
8. exact complete preimage formulas;
9. exact complete expected postimage values;
10. exact complete expected postimage formulas;
11. immutable identity-field value;
12. unchanged row geometry;
13. unchanged formulas except where explicitly authorized;
14. lock context is valid immediately before the first write;
15. every postimage cell is reread and exactly verified after the write.

Before the first write, any failure is a definite no-write outcome.

From the first spreadsheet write onward, any error or incomplete postimage
verification is an uncertain outcome and must halt further action.

The primitive may replace exactly one existing physical row. It may not
insert, delete, move, re-key, or rewrite downstream references.

## Future executor prerequisites

A future Group 3 executor may be implemented only after all of the following
have separate certified authority:

- the exact full-row replacement primitive above;
- registration of
  `CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION`
  in `CountyMutationExclusionLease`;
- corresponding writer-retrofit/lifecycle validation;
- Admin authorization;
- zero managed county scheduler triggers;
- a freshly captured exact frozen scheduler checkpoint;
- fresh read-only Group 3 full-row evidence;
- fresh Zillow provenance evidence;
- fresh downstream-reference evidence;
- exact physical-row preimage evidence;
- exact evidence regeneration after acquiring the executor's outer
  Database ScriptLock;
- equality of pre-lock and under-lock evidence authority.

No lease merely grants mutation authority. The lease is exclusion-only.

## Future executor mutation scope

If separately authorized, one invocation may mutate exactly one physical
row:

`DISTRESS_LEADS` physical row 771.

It must:

- preserve physical `Distress Lead ID`;
- preserve physical `Created At`;
- clear county-owned fields identified by the certified Zillow restoration
  projection;
- restore the exact certified Zillow projection from provenance;
- verify the complete postimage before success.

It must not mutate:

- physical row 767;
- `ZILLOW_GMAIL_IMPORTS`;
- downstream reference row 38 / column 13;
- any other `DISTRESS_LEADS` row;
- scheduler triggers;
- scheduler checkpoint;
- connector configuration;
- automatic-offer state.

## Invocation boundary

The executor implementation increment itself shall expose no public RPC.

Any future executable RPC or operator invocation surface requires a separate
contract and separate authority gate after the executor implementation has
been certified offline.

## Explicitly prohibited

This contract prohibits:

- reuse of `PAGE86_DUPLICATE_SOURCE_REPAIR`;
- direct reuse of Page-86 execution authority;
- widening `patchPhysicalRowCellsExact()` for the restoration;
- physical delete;
- downstream reference rewrite;
- insertion of a replacement row;
- changing the Zillow Distress Lead ID;
- changing the preserved Created At lineage;
- changing row 767;
- scheduler mutation;
- checkpoint mutation;
- deployment;
- production execution;
- automatic MAO or offer authority.

## Authority

`GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false`

`GROUP3_FULL_ROW_REPLACEMENT_AUTHORITY_GRANTED=false`

`GROUP3_WRITER_REGISTRATION_AUTHORITY_GRANTED=false`

`GROUP3_PUBLIC_RPC_AUTHORITY_GRANTED=false`

`REFERENCE_REWRITE_AUTHORITY_GRANTED=false`

`PHYSICAL_DELETE_AUTHORITY_GRANTED=false`

`SCHEDULER_MUTATION_AUTHORITY_GRANTED=false`

`CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false`

`DEPLOYMENT_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`
