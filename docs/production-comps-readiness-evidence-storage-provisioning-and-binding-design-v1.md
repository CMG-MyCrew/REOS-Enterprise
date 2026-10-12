# Production Comps Readiness Evidence Storage Provisioning and Binding Design v1

## Status

This is a design-only specification.

It does not authorize or execute production sheet creation, production sheet
mutation, evidence persistence, live Google Sheets reads or writes, production
RPC invocation, Apps Script deployment, trigger changes, provider requests,
production readiness-gate wiring, lifecycle advancement, Qualified Deal Queue
mutation, MAO calculation, offer generation, or offer submission.

The merged live-capable storage adapter remains non-invoked.

## Purpose

Define the exact production provisioning and binding contract required before
the merged comps-readiness evidence persistence module may use its merged
storage adapter against live production evidence surfaces.

Production implementation and production execution remain separate phases.

## Existing certified prerequisites

The following merged modules already exist:

- `build/apps-script-brand/CompsReadinessEvidencePersistence.js`
- `build/apps-script-brand/CompsReadinessEvidenceStorageAdapter.js`

The persistence module owns validation, evidence identity, idempotency,
supersession, current-record selection, explicit `asOf` behavior, and certified
append/read outcomes.

The storage adapter owns table allowlisting, exact header validation,
serialization, deserialization, sheet lookup, `readAll`, single-row append,
and append locking.

Provisioning must not duplicate or weaken those responsibilities.

## Exact evidence tables

Exactly three evidence tables are permitted:

1. `DEAL_ARV_EVIDENCE`
2. `DEAL_REPAIR_SCOPE_EVIDENCE`
3. `DEAL_OFFER_READINESS_EVIDENCE`

No aliases, fallback tables, legacy substitutes, or alternate logging stores
are permitted.

## DEAL_ARV_EVIDENCE

The sheet must contain exactly these 23 headers in this order:

1. `ARV Evidence ID`
2. `Schema Version`
3. `Deal ID`
4. `Canonical Property Key`
5. `Evidence Status`
6. `Confidence Status`
7. `Estimated ARV`
8. `Accepted Comparable Evidence IDs JSON`
9. `Accepted Comparable Count`
10. `Minimum Comparable Count`
11. `Valuation Method`
12. `Valuation Inputs JSON`
13. `Supported Low Value`
14. `Supported High Value`
15. `Review Required`
16. `Reason Codes JSON`
17. `Evidence Generated At`
18. `Persisted At`
19. `Source Engine`
20. `Source Engine Version`
21. `Provenance JSON`
22. `Idempotency Key`
23. `Supersedes Evidence ID`

## DEAL_REPAIR_SCOPE_EVIDENCE

The sheet must contain exactly these 17 headers in this order:

1. `Repair Scope Evidence ID`
2. `Schema Version`
3. `Deal ID`
4. `Canonical Property Key`
5. `Scope Status`
6. `Scope Complete`
7. `Estimated Repair Cost`
8. `Review Required`
9. `Reason Codes JSON`
10. `Scope Inputs JSON`
11. `Evidence Generated At`
12. `Persisted At`
13. `Source Engine`
14. `Source Engine Version`
15. `Provenance JSON`
16. `Idempotency Key`
17. `Supersedes Evidence ID`

## DEAL_OFFER_READINESS_EVIDENCE

The sheet must contain exactly these 15 headers in this order:

1. `Readiness Evidence ID`
2. `Schema Version`
3. `Deal ID`
4. `Canonical Property Key`
5. `ARV Evidence ID`
6. `Repair Scope Evidence ID`
7. `Decision`
8. `Comp Supported ARV Ready`
9. `Repair Scope Ready`
10. `Reason Codes JSON`
11. `Evaluated At`
12. `Persisted At`
13. `Gate Version`
14. `Idempotency Key`
15. `Supersedes Evidence ID`

## Explicit production spreadsheet binding

Production evidence storage must bind to one explicitly identified production
spreadsheet.

A live persistence operation must not depend solely on whichever spreadsheet
happens to be active in an unrelated execution context.

Before live evidence persistence is authorized, the implementation must prove
that the spreadsheet resolved for the invocation is the intended production
database.

No fallback spreadsheet is permitted.

No test spreadsheet may silently become the production evidence store.

Missing, blank, malformed, ambiguous, or mismatched spreadsheet identity must
fail closed.

The implementation must reconcile this requirement with the merged adapter's
current `SpreadsheetApp.getActiveSpreadsheet()` convention before any live
invocation is authorized.

## Provisioning authority

Provisioning is an explicit administrative operation.

Normal evidence append/read paths must never create sheets.

Deal analysis must never create sheets.

Comp ingestion must never create sheets.

ARV calculation must never create sheets.

Repair-scope evaluation must never create sheets.

Readiness evaluation must never create sheets.

Schedulers and triggers must never implicitly provision evidence storage.

## Provisioning behavior

A future explicitly authorized administrative implementation may:

1. resolve and certify the exact production spreadsheet;
2. inspect the three exact evidence sheets;
3. create a missing evidence sheet only under explicit provisioning authority;
4. write its exact certified header row;
5. verify the exact written header row;
6. return a bounded administrative result.

It must not fabricate evidence rows.

It must not seed positive readiness evidence.

It must not generate ARV evidence.

It must not generate repair-scope evidence.

## Existing-sheet behavior

An existing evidence sheet with exact headers may be reported as already
provisioned.

An existing evidence sheet with any header mismatch must fail closed.

Automatic header repair is prohibited.

Automatic column insertion is prohibited.

Automatic column deletion is prohibited.

Automatic column reordering is prohibited.

Automatic evidence migration is prohibited.

Destructive recreation is prohibited.

## Binding preflight

Before any future live persistence invocation, a bounded preflight must prove:

- exact production spreadsheet identity;
- `DEAL_ARV_EVIDENCE` exists;
- `DEAL_REPAIR_SCOPE_EVIDENCE` exists;
- `DEAL_OFFER_READINESS_EVIDENCE` exists;
- exact 23-column ARV schema;
- exact 17-column repair schema;
- exact 15-column readiness schema;
- merged persistence module is present;
- merged storage adapter is present;
- no fallback storage target is active;
- no automatic provisioning path is active;
- no automatic header-repair path is active.

Any failure blocks live persistence.

## Persistence ownership

Provisioning does not change persistence semantics.

The persistence module remains responsible for:

- validation;
- identity;
- idempotency;
- supersession;
- current-record selection;
- explicit `asOf`;
- append outcomes;
- read outcomes.

Provisioning must not reinterpret or override persistence outcomes.

## Identity boundary

Provisioning has no property-identity repair authority.

It may not repair or infer:

- Deal ID;
- Canonical Property Key;
- evidence IDs;
- supersession IDs;
- cross-surface evidence references.

Missing identity remains missing.

Mismatched identity remains mismatched.

Ambiguous identity fails closed.

## Evidence boundary

Provisioning grants no evidence-generation authority.

It may not infer or manufacture:

- comparable evidence;
- accepted comparable IDs;
- ARV;
- ARV confidence;
- repair scope;
- repair cost;
- readiness booleans;
- readiness decisions.

## Acquisition safety boundary

Storage existence does not create acquisition authority.

Successful provisioning does not mean a deal is ready.

Successful persistence does not mean a deal is ready.

ARV evidence alone does not authorize MAO or an offer.

Repair-scope evidence alone does not authorize MAO or an offer.

An evidence-layer readiness decision of `eligible` is not itself production
offer authority.

The evidence prerequisite remains:

`comp-supported ARV ready === true`

AND

`repair scope ready === true`

but this design grants no:

- Qualified Deal Queue authority;
- lifecycle advancement authority;
- MAO authority;
- offer-generation authority;
- offer-submission authority.

## Concurrency

Administrative provisioning must use bounded locking.

Concurrent provisioning attempts must not create duplicate evidence sheets.

Normal evidence append locking remains owned by the merged storage adapter.

## Atomicity

Each sheet's creation and exact header initialization must be verified before
that sheet is considered provisioned.

A partial provisioning result must not be reported as complete success.

Failure for any required evidence sheet causes the overall production storage
readiness result to fail closed.

## Administrative outcomes

A future implementation should use bounded administrative outcomes:

- `provisioned`
- `already_provisioned`
- `rejected_spreadsheet_identity`
- `rejected_existing_schema`
- `rejected_authorization`
- `failed_lock`
- `failed_provisioning`
- `failed_verification`

These are administrative outcomes only.

They are not persistence outcomes or acquisition decisions.

## Audit requirements

A bounded production provisioning execution must certify:

- exact spreadsheet identity;
- exact sheet names;
- exact header counts and order;
- which sheets were created;
- which sheets were already present;
- no evidence rows were fabricated;
- no unrelated sheets were modified;
- no trigger was changed;
- no deployment was changed;
- no acquisition authority was granted.

## Safe implementation sequence

1. merge this design;
2. implement an offline-certifiable provisioning/binding module;
3. certify it without production mutation;
4. separately authorize one bounded production provisioning execution;
5. verify all three evidence sheets and exact headers;
6. certify production spreadsheet binding;
7. separately implement/certify live persistence invocation;
8. only afterward separately design/certify readiness-gate consumer wiring.

These phases must not be collapsed.

## Explicit non-authorizations

This design does not authorize:

- production sheet creation;
- production sheet mutation;
- production evidence append;
- production evidence read;
- production RPC;
- Apps Script deployment;
- trigger installation;
- trigger removal;
- provider requests;
- production readiness-gate wiring;
- lifecycle mutation;
- Qualified Deal Queue mutation;
- MAO calculation;
- MAO authority;
- offer generation;
- offer authority;
- offer submission.

## Next implementation boundary

After merge certification, the next capability is:

`implement_offline_certifiable_production_comps_readiness_evidence_storage_provisioning_and_binding_module_v1`

That module must remain non-invoked until a separate production provisioning
execution is explicitly authorized.
