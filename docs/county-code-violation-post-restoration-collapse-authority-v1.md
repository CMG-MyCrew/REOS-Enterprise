# Philadelphia Code Violations — Post-Restoration Collapse Authority v1

## Status

DESIGN ONLY.

Contract identifier:

`POST_RESTORATION_COLLAPSE_AUTHORITY_V1`

This contract defines the source-authority transition required after the
already-certified Group 3 Zillow restoration.

It does not implement the transition and grants no production mutation,
collapse, winner-selection, delete, scheduler, checkpoint, connector,
repair, migration, Group 3 replay, MAO, or offer authority.

## Certified baseline

The design baseline is Git:

`c6245ff035d8707660ae362fb775638ec4fec35b`

The county production scheduler is required to remain frozen while this
authority transition is designed, implemented, certified, deployed, and
independently revalidated.

The frozen checkpoint remains:

- cycle ID:
  `COUNTY-20260902222607805`
- next feed index: `0`
- current feed cursor:
  `AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281`
- completed feeds: `0`
- total feeds: `4`
- results: empty

## Group 3 post-restoration authority

Historical Group 3 was:

- county survivor:
  - physical row `767`
  - Distress Lead ID `DL-20260820181647-4170`
  - county source record `28`
  - violation `VI-2026-045359`

- Zillow row:
  - physical row `771`
  - Distress Lead ID `ZIL-20260820193920-1756`

The already-certified restoration re-established row 771 as an independent
Zillow lead.

The post-restoration state therefore requires:

- row 767 remains the sole county code-violation observation for the
  historical Group 3 county identity;
- row 771 remains an independent Zillow Gmail lead;
- row 771 must not re-enter the county duplicate cohort;
- row 767 must not be treated as a duplicate merely because it was formerly
  part of historical Group 3;
- `ZILLOW_GMAIL_IMPORTS` row 38 / column 13 continues to reference
  `ZIL-20260820193920-1756`;
- Group 3 restoration must never be replayed merely to satisfy stale
  pre-restoration collapse evidence.

Required future runtime evidence must independently prove the restored state
before post-restoration collapse authority is accepted.

`GROUP3_REEXECUTION_REQUIRED=false`

`GROUP3_REEXECUTION_AUTHORITY_GRANTED=false`

## Post-restoration collapse population

The old collapse-only catalog contains 22 groups / 46 rows.

Historical Group 3 contributes exactly two rows:

- row 767 / `DL-20260820181647-4170`
- row 771 / `ZIL-20260820193920-1756`

Both historical Group 3 records must be removed from the duplicate-collapse
population.

The resulting post-restoration duplicate cohort is therefore:

`POST_RESTORATION_GROUP_COUNT=21`

`POST_RESTORATION_ROW_COUNT=44`

The surviving group numbers remain their historical identifiers:

`1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22`

Group numbers must not be renumbered.

This preserves forensic lineage and prevents unrelated group identities from
changing solely because historical Group 3 is no longer a duplicate group.

## Winner-plan invariants

Removing historical Group 3 does not expand the currently eligible collapse
population because Group 3 was already blocked from execution eligibility.

The required future winner-plan population is:

`POST_RESTORATION_ELIGIBLE_GROUP_COUNT=20`

`POST_RESTORATION_ELIGIBLE_ROW_COUNT=42`

`POST_RESTORATION_DIRECT_KEEP_GROUP_COUNT=14`

`POST_RESTORATION_OBSERVATION_MERGE_GROUP_COUNT=6`

`POST_RESTORATION_DELETE_CANDIDATE_ROW_COUNT=22`

`POST_RESTORATION_BLOCKED_GROUP_COUNT=1`

Historical Group 1 remains the sole blocked group.

`POST_RESTORATION_CONFLICT_BLOCKED_GROUP=1`

There is no post-restoration reference-blocked Group 3.

`POST_RESTORATION_REFERENCE_BLOCKED_GROUP=NONE`

No historical blocked group may silently become eligible merely because the
population contract changed.

## Downstream-reference authority

The post-restoration winner plan must run a complete downstream Distress Lead
ID reference audit over the exact 44-member duplicate cohort.

The future reference audit must prove:

- requested ID count: `44`;
- scan complete: `true`;
- truncated: `false`;
- matches truncated: `false`;
- no caller-defined population substitution;
- zero downstream references for the 44 collapse-cohort IDs.

Any downstream reference discovered for any member of the 44-row cohort must
fail closed and block collapse authority pending explicit reconciliation.

The Zillow reference at `ZILLOW_GMAIL_IMPORTS` row 38 / column 13 is not part
of this 44-ID collapse reference scan because the restored Zillow Distress
Lead ID is no longer a member of the county duplicate cohort.

That Zillow reference must instead remain independently protected by the
Group 3 post-restoration evidence surface.

## Required runtime implementation surfaces

A future implementation must reconcile, at minimum:

1. `CountyCodeViolationCollapseOnlyEvidenceAuthority.js`
2. `CountyCodeViolationCollapseFullRowEvidence.js`
3. `CountyCodeViolationCollapseWinnerPlan.js`
4. `CountyCodeViolationCollapseExecutionPreflight.js`
5. `CountyMutationExclusionLease.js`

A future implementation must also provide a durable read-only
post-restoration Group 3 evidence surface sufficient to prove:

- scheduler frozen;
- exact frozen checkpoint;
- row 767 county survivor identity;
- row 771 Zillow identity and provenance;
- preserved import row 38 / column 13 reference;
- no Group 3 replay requirement;
- stable evidence across the bounded read interval.

The implementation must not rely solely on a historical shell transcript.

## Authority SHA and winner fingerprint

The existing collapse authority SHA:

`87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee`

and existing winner-plan fingerprint:

`848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9`

belong to the pre-restoration 22-group / 46-row authority.

A future implementation must deterministically derive and certify new values
from the exact post-restoration 21-group / 44-row authority and resulting
winner plan.

The new values must not be guessed or hand-authored.

## Mutation-exclusion lease compatibility

The current mutation-exclusion lease validates persisted state against the
pre-restoration authority SHA and winner fingerprint.

A future implementation must not merely replace the two constants.

Doing so could cause a previously persisted CLOSED or expired historical
lease to become `MALFORMED`, which would block protected writers.

The future lease design must explicitly distinguish current authority from
historical lease state.

At minimum:

- an active, unexpired historical-authority lease must block deployment or
  authority transition until reconciled;
- a historical CLOSED lease may not become current collapse authority;
- a historical expired lease may not become current collapse authority;
- safe historical CLOSED/expired state must not become a malformed-state
  blocker solely because the current authority SHA/fingerprint changed;
- a new current-authority lease must bind only to the new certified authority
  SHA and winner fingerprint;
- no legacy lease token may authorize current collapse execution;
- lease migration or compatibility behavior must be separately validated
  before production deployment.

No lease compatibility rule may grant mutation authority.

## Execution preflight

The post-restoration execution preflight must remain read-only.

It must prove:

- zero managed county scheduler triggers;
- exact frozen checkpoint;
- exact post-restoration Group 3 evidence;
- exact 21-group / 44-row duplicate authority;
- exact 20-group / 42-row eligible winner plan;
- Group 1 remains the sole blocked group;
- complete zero-match downstream-reference audit for the 44 collapse IDs;
- current authority SHA;
- current winner-plan fingerprint;
- no authority drift across the bounded read interval.

Primitive availability is not execution authority.

Until a separately certified collapse executor exists and a distinct
production execution gate is granted:

`COLLAPSE_EXECUTION_READY=false`

`COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false`

## Scheduler authority

The county production scheduler must remain frozen during this authority
transition.

This design grants no scheduler reinstall authority.

`SCHEDULER_REINSTALL_AUTHORITY_GRANTED=false`

Scheduler restoration remains a separate production-control gate after the
collapse path and its independent post-execution certification are complete.

## Explicit non-authority

`POST_RESTORATION_COLLAPSE_AUTHORITY_DESIGN_ONLY=true`

`POST_RESTORATION_COLLAPSE_IMPLEMENTATION_PRESENT=false`

`PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false`

`COLLAPSE_AUTHORITY_GRANTED=false`

`WINNER_SELECTION_AUTHORITY_GRANTED=false`

`DELETE_AUTHORITY_GRANTED=false`

`PHYSICAL_DELETE_AUTHORITY_GRANTED=false`

`REFERENCE_REWRITE_AUTHORITY_GRANTED=false`

`SCHEDULER_MUTATION_AUTHORITY_GRANTED=false`

`CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false`

`CONNECTOR_EXECUTION_AUTHORITY_GRANTED=false`

`GROUP3_REEXECUTION_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`
