# County Mutation-Exclusion Lease — Authority Compatibility v1

## Status

DESIGN ONLY.

Contract identifier:

`COUNTY_MUTATION_EXCLUSION_LEASE_AUTHORITY_COMPATIBILITY_V1`

This contract defines compatibility between persisted historical
county mutation-exclusion lease state and the current post-restoration
Code Violations collapse authority.

It grants no production mutation, collapse execution, physical delete,
scheduler, checkpoint, connector, repair, migration, Group 3 replay,
MAO, or offer authority.

## Certified source baseline

The source baseline is:

`44740ff1eaefed31631db2f03e340a944f916bad`

The county scheduler remains frozen.

The existing runtime lease and runtime harness must remain byte-exact
during this design increment.

Certified historical runtime lease SHA-256:

`7bb81a035b8ed643a1eb02582a02cb7d17bcc43bdc4e0c71ab3da963b48473b4`

Certified historical runtime harness SHA-256:

`61d7c1bb6d55b3be147ffe4fd7c99f932d9a9d194e0cfe30d8875addcbd44ebb`

## Authority generations

Two exact authority generations are recognized.

### HISTORICAL

Historical collapse authority SHA:

`87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee`

Historical winner-plan fingerprint:

`848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9`

This pair belongs only to the pre-restoration 22-group / 46-row
collapse authority.

### CURRENT

Current collapse authority SHA:

`8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7`

Current winner-plan fingerprint:

`9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce`

This pair belongs only to the post-restoration 21-group / 44-row
collapse authority.

## Structural validation versus authority classification

Future runtime validation must separate two concerns:

1. structural validity of the persisted lease object;
2. classification of the persisted authority pair.

A structurally valid historical lease must not become `MALFORMED`
solely because the runtime's current authority changed.

The persisted pair:

`winnerPlanFingerprintSha256 + collapseAuthoritySha256`

must be classified exactly as one of:

- `CURRENT`
- `HISTORICAL`
- `UNKNOWN`

`UNKNOWN` includes mixed-generation pairs, unrecognized pairs, and
otherwise unsupported authority combinations.

An `UNKNOWN` pair is fail-closed and must behave as malformed authority.

No caller may manufacture or redefine the recognized authority pairs.

## ABSENT state

No persisted lease remains:

`ABSENT`

Protected non-owner writers retain their existing authority model.

The collapse owner receives no authority from absence.

A new lease may be opened only using the exact `CURRENT` authority pair.

## CURRENT CLOSED state

A structurally valid `CURRENT` + `CLOSED` lease:

- does not block protected non-owner writers;
- is not owner-ready;
- grants no collapse execution authority;
- may be replaced by a newly opened `CURRENT` lease after all ordinary
  open preconditions pass.

## CURRENT expired OPEN state

A structurally valid `CURRENT` + `OPEN` lease whose `expiresAt` has
passed:

- does not block protected non-owner writers;
- is not owner-ready;
- grants no collapse execution authority;
- may be replaced by a newly opened `CURRENT` lease after all ordinary
  open preconditions pass.

Expiration does not convert the persisted state to `CLOSED`.

## CURRENT active OPEN state

A structurally valid `CURRENT` + unexpired `OPEN` lease:

- blocks every protected non-owner writer;
- cannot be replaced;
- may become owner-ready only when:
  - the settle interval has completed;
  - the exact current lease token is supplied;
  - the exact current lease ID is supplied;
  - the exact owner maintenance-gate ID is supplied;
  - the expected winner fingerprint equals the certified `CURRENT`
    fingerprint;
  - the expected collapse authority SHA equals the certified `CURRENT`
    authority SHA;
  - scheduler/checkpoint requirements remain exact;
  - all other owner-readiness requirements remain satisfied.

Only `CURRENT` authority may ever satisfy owner readiness.

## HISTORICAL CLOSED state

A structurally valid `HISTORICAL` + `CLOSED` lease:

- must remain recognizable as historical;
- must not become `MALFORMED` solely because the current authority
  changed;
- does not block protected non-owner writers;
- is never owner-ready;
- grants no current collapse authority;
- may be replaced by a newly opened `CURRENT` lease after ordinary
  current open preconditions pass.

A historical token can never authorize current collapse execution.

## HISTORICAL expired OPEN state

A structurally valid `HISTORICAL` + expired `OPEN` lease:

- must remain recognizable as historical;
- must not become `MALFORMED` solely because the current authority
  changed;
- does not block protected non-owner writers;
- is never owner-ready;
- grants no current collapse authority;
- may be replaced by a newly opened `CURRENT` lease after ordinary
  current open preconditions pass.

A historical expired lease must not silently become current authority.

## HISTORICAL active OPEN state

A structurally valid `HISTORICAL` + unexpired `OPEN` lease:

- blocks every protected non-owner writer;
- blocks opening a new `CURRENT` lease;
- is never current owner-ready;
- grants no current collapse execution authority.

Deployment or production-authority transition must not proceed while
such a lease remains active and unreconciled.

The historical lease may be closed only with all of:

- exact historical persisted lease ID;
- exact historical persisted owner maintenance-gate ID;
- a raw token whose SHA-256 equals the exact persisted historical token
  hash;
- explicit close confirmation;
- Admin authority;
- the existing close transition lock and readback verification.

Closing a historical lease preserves its historical authority pair.

Closing a historical lease does not upgrade or migrate it to `CURRENT`.

## UNKNOWN / malformed authority

A structurally invalid state or `UNKNOWN` authority pair:

- blocks protected non-owner writers;
- cannot be replaced;
- cannot become owner-ready;
- cannot be closed through ordinary compatibility handling unless a
  separately certified reconciliation mechanism exists.

Mixed authority generations must be `UNKNOWN`.

Examples that must fail closed:

- historical fingerprint + current authority SHA;
- current fingerprint + historical authority SHA;
- unknown fingerprint + recognized authority SHA;
- recognized fingerprint + unknown authority SHA.

## openExclusive compatibility

`openExclusive(options)` must accept only exact `CURRENT` expected
authority values.

Historical expected authority values must fail.

Every newly persisted lease after compatibility implementation must
bind only to the exact `CURRENT` pair.

`openExclusive` may replace:

- `ABSENT`;
- `CURRENT CLOSED`;
- `CURRENT expired OPEN`;
- `HISTORICAL CLOSED`;
- `HISTORICAL expired OPEN`.

`openExclusive` must not replace:

- `CURRENT active OPEN`;
- `HISTORICAL active OPEN`;
- `UNKNOWN`;
- structurally malformed state.

## assertOwnerReady compatibility

`assertOwnerReady(options)` must require:

`authorityGeneration=CURRENT`

in addition to every existing owner-readiness requirement.

`HISTORICAL` may never satisfy owner readiness.

No legacy token, lease ID, gate ID, or persisted state may authorize the
post-restoration 21/44 collapse.

## assertWriterAllowed compatibility

Protected non-owner writer behavior must be based on both authority
generation and lease lifecycle state.

Allowed:

- `ABSENT`
- `CURRENT CLOSED`
- `CURRENT expired OPEN`
- `HISTORICAL CLOSED`
- `HISTORICAL expired OPEN`

Blocked:

- `CURRENT active OPEN`
- `HISTORICAL active OPEN`
- `UNKNOWN`
- structurally malformed state

This compatibility transition must not change any protected writer
source file.

## status compatibility

`status()` must remain read-only.

For a valid persisted lease it must expose an explicit authority
classification sufficient to distinguish:

- `CURRENT`
- `HISTORICAL`

Unknown authority must remain fail-closed.

Status metadata must not expose the raw lease token.

Status must grant no mutation authority.

## close compatibility

`close(options)` may close a structurally valid `OPEN` lease of either
recognized authority generation when the exact persisted token hash,
lease ID, owner gate ID, explicit confirmation, Admin requirement, and
transition-lock requirements are satisfied.

Closing a lease must never change:

- `winnerPlanFingerprintSha256`
- `collapseAuthoritySha256`
- `leaseTokenSha256`
- `leaseId`
- `ownerMaintenanceGateId`

Only `status` and `closedAt` may make the lifecycle transition required
by the existing close contract.

## Required future runtime implementation

A future compatibility implementation may modify:

- `build/apps-script-brand/CountyMutationExclusionLease.js`
- `scripts/validate-county-mutation-exclusion-lease-v1.js`

and the minimum CI/lifecycle validators necessary to certify that
runtime transition.

It must not require changes to protected writer source files.

Historical design evidence must remain byte-exact.

## Minimum offline compatibility cases

The future runtime harness must prove at minimum:

1. absent state permits protected writer;
2. current CLOSED permits protected writer;
3. current expired OPEN permits protected writer;
4. current active OPEN blocks protected writer;
5. historical CLOSED permits protected writer;
6. historical expired OPEN permits protected writer;
7. historical active OPEN blocks protected writer;
8. unknown authority pair blocks protected writer;
9. mixed authority pair blocks protected writer;
10. malformed structure blocks protected writer;
11. current active OPEN may become owner-ready after settle;
12. historical active OPEN can never become owner-ready;
13. expired current OPEN cannot become owner-ready;
14. expired historical OPEN cannot become owner-ready;
15. current CLOSED cannot become owner-ready;
16. historical CLOSED cannot become owner-ready;
17. new open persists only the current authority pair;
18. historical expected pair cannot open a new lease;
19. current active OPEN cannot be replaced;
20. historical active OPEN cannot be replaced;
21. current CLOSED may be replaced by current authority;
22. current expired OPEN may be replaced by current authority;
23. historical CLOSED may be replaced by current authority;
24. historical expired OPEN may be replaced by current authority;
25. unknown authority state cannot be replaced;
26. mixed-generation state cannot be replaced;
27. exact current OPEN lease can close;
28. exact historical OPEN lease can close;
29. wrong historical token cannot close;
30. historical close preserves historical authority pair;
31. current close preserves current authority pair;
32. legacy token cannot authorize a current lease;
33. status reports CURRENT classification;
34. status reports HISTORICAL classification;
35. status fails closed for UNKNOWN authority;
36. raw token is never persisted or exposed by status;
37. scheduler/checkpoint safety remains intact;
38. state transitions remain ScriptLock-owned;
39. assertion paths remain non-locking except caller-owned Database lock
    context validation;
40. all lease authority-free result flags remain false.

## Explicit non-authority

`LEASE_AUTHORITY_COMPATIBILITY_DESIGN_ONLY=true`

`LEASE_AUTHORITY_COMPATIBILITY_IMPLEMENTATION_PRESENT=false`

`CURRENT_AUTHORITY_LEASE_OPEN_AUTHORITY_GRANTED=false`

`COLLAPSE_EXECUTION_READY=false`

`COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false`

`PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false`

`PHYSICAL_DELETE_AUTHORITY_GRANTED=false`

`SCHEDULER_MUTATION_AUTHORITY_GRANTED=false`

`CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false`

`CONNECTOR_EXECUTION_AUTHORITY_GRANTED=false`

`GROUP3_REEXECUTION_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`

The county scheduler freeze remains mandatory.
