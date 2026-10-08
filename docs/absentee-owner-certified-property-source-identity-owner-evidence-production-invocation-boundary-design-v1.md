# Absentee-Owner Certified Property-Source Identity Owner-Evidence Production Invocation Boundary Design v1

## Status

This increment implements one narrowly bounded production invocation surface.

It does not authorize deployment.
It does not authorize production invocation.
It does not authorize batch execution.
It does not authorize a scheduler or trigger.
It does not authorize persistence.
It does not authorize classification.
It does not authorize acquisition lifecycle progression.
It does not authorize ARV, repair-scope, MAO, or offer generation.

No step implies authority for the next step.

## Certified predecessor

The internal deployed lookup is:

`REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.lookup(options)`

Its mode remains:

`READ_ONLY_OWNER_EVIDENCE`

Its certified source lookup mode remains:

`certified_opa_account`

The internal lookup already requires two separate pieces of prior evidence:

- `propertySourceIdentityCertification`
- `normalLookupEvidence`

The production entrypoint MUST NOT manufacture either evidence object.

## Production entrypoint

Exactly one production runtime is authorized:

`REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint`

Exactly one global Apps Script RPC is authorized:

`reosAbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceRetrieveSingleRecord(options)`

The invocation model is:

`manual_single_record_admin_only`

The entrypoint MUST call:

`REOS.Security.requireAdmin()`

before request validation or delegation.

## Exact input envelope

The public production entrypoint accepts exactly two top-level fields:

- `propertySourceIdentityCertification`
- `normalLookupEvidence`

Both values must be objects.

No other top-level field is permitted.

Direct caller-supplied OPA account input is prohibited.

Caller-supplied raw property-address authority is prohibited.

Row-number-only invocation is prohibited.

Batch or list invocation is prohibited.

The production entrypoint MUST NOT coerce, infer, repair, synthesize, enrich, or discover missing certification evidence.

## Delegation boundary

After the admin gate and top-level envelope validation, the entrypoint may delegate exactly once to:

`REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.lookup(...)`

The entrypoint MUST NOT directly invoke:

- `UrlFetchApp`
- `REOS.Database`
- `SpreadsheetApp`
- `PropertiesService`
- `ScriptApp`
- `LockService`
- `REOS.AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification`
- `REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup`
- `REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever`
- `REOS.AbsenteeOwnerOwnerEvidenceComparison`
- `REOS.AbsenteeOwnerClassification`

The entrypoint has zero retry authority.

The entrypoint has zero pagination authority.

The entrypoint has zero source-reference discovery authority.

## Result boundary

The entrypoint may return only an eligible result from the certified internal lookup.

Eligible lookup outcomes are:

- `MATCHED`
- `NO_MATCH`
- `AMBIGUOUS`
- `FAILED`

A malformed upstream result fails closed.

An upstream result containing any true authority grant fails closed.

A thrown internal lookup fails closed without retry.

The caller's input object must remain unmodified.

## Authority boundary

The entrypoint grants no:

- production data mutation authority
- owner-evidence persistence authority
- source-evidence retrieval authority
- certification execution authority
- normal owner-lookup execution authority
- classification authority
- classification persistence authority
- scheduler authority
- trigger authority
- connector execution authority
- canonical identity repair authority
- migration authority
- owner-occupancy decision authority
- vacancy decision authority
- Qualified Deal Queue authority
- acquisition lifecycle authority
- ARV authority
- repair-scope authority
- MAO authority
- offer authority
- automatic-offer authority

Automatic MAO or offer authority remains blocked unless both adequate comp-supported ARV and an adequate repair scope are present.

## Implementation surface

The implementation increment is limited to exactly eight repository files:

1. this design document
2. one design validator
3. one new Apps Script production-entrypoint runtime
4. one static validator
5. one behavior validator
6. one integration validator
7. `scripts/validate-county-runtime-integration.js`
8. `.github/workflows/county-collapse-offline.yml`

The existing owner-evidence lookup is not modified.

The existing property-source identity certifier is not modified.

The existing exact-address owner lookup is not modified.

The existing owner-evidence comparison runtime is not modified.

The existing source-evidence production entrypoint is not modified.

The historical `POST_COUNTY_PRODUCTION_FILES` count remains 70.

The historical `COMPONENT_VALIDATORS` count remains 97.

The new runtime receives its own explicit one-file county production inventory.

## Lifecycle boundary

This implementation may be committed only after a separate pre-commit certification.

A commit does not authorize push.

A push does not authorize PR creation.

A merged PR does not authorize source push.

Source push does not authorize version creation.

Version creation does not authorize deployment.

Deployment does not authorize production invocation.

Authorization for one manual invocation does not authorize another invocation.
