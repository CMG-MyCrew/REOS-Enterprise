# Bounded Production Comps Readiness Evidence Storage Provisioning Execution Design v1

## Status

Design-only.

This design does not authorize a production provisioning execution.

This design does not authorize a production RPC.

This design does not authorize production Google Sheets mutation.

This design does not authorize an Apps Script deployment update.

This design does not authorize production evidence persistence.

This design does not authorize production readiness-gate consumer wiring.

## Purpose

Define the exact fail-closed contract for one future explicitly authorized
administrative execution that may provision the three certified comps readiness
evidence storage surfaces in the explicitly bound REOS production spreadsheet.

The execution exists only to establish storage infrastructure.

Storage existence does not create acquisition authority.

## Certified prerequisites

The future execution must be based on the already-certified:

1. comps readiness evidence persistence contract and implementation;
2. live-capable but non-invoked storage adapter;
3. production storage provisioning and binding design;
4. offline-certifiable provisioning and binding module;
5. exact three evidence schemas.

The future execution must not reinterpret or weaken any prerequisite.

## Exact evidence tables

Exactly three evidence tables are in scope:

1. `DEAL_ARV_EVIDENCE`
2. `DEAL_REPAIR_SCOPE_EVIDENCE`
3. `DEAL_OFFER_READINESS_EVIDENCE`

No fourth evidence table is authorized by this design.

## Exact header counts

The required exact header counts remain:

- `DEAL_ARV_EVIDENCE`: 23
- `DEAL_REPAIR_SCOPE_EVIDENCE`: 17
- `DEAL_OFFER_READINESS_EVIDENCE`: 15

The exact ordered headers must come from the already-certified provisioning
module and schema contract.

The future executor must not maintain an independent competing schema.

## Explicit production spreadsheet identity

A future production provisioning execution must require one explicit,
nonblank, certified production spreadsheet identity.

The identity must be supplied through an explicit administrative invocation.

The execution must not infer production identity solely from the active
spreadsheet.

The execution must not use an arbitrary active spreadsheet as a fallback.

The execution must not silently substitute a test, staging, development, or
personal spreadsheet.

Missing, blank, malformed, ambiguous, or mismatched spreadsheet identity must
fail closed.

The certified expected production spreadsheet identity must be independently
resolved and compared with the requested identity before any mutation.

## Binding reconciliation

The current live storage adapter uses an active-spreadsheet access path.

Before live persistence invocation is authorized, that adapter must be
reconciled with the certified explicit production spreadsheet binding.

Provisioning success alone does not authorize the existing adapter to begin
live persistence.

No implicit active-spreadsheet binding is authorized by this design.

## Administrative authorization

The future provisioning operation must require an explicit authorization value
for the single invocation.

Authorization must default to false.

Absence of explicit authorization must produce `rejected_authorization`.

Authorization for one execution must not become durable automatic authority for
later executions.

There is no automatic retry authority.

There is no scheduler or trigger authority.

## Required preflight

Before any sheet creation, the future executor must verify all of the following:

1. requested spreadsheet identity is nonblank and structurally valid;
2. expected production spreadsheet identity is independently available;
3. requested and expected production identities match exactly;
4. the target spreadsheet can be opened explicitly by the certified identity;
5. the provisioning module is present;
6. the storage adapter is present;
7. the persistence module is present;
8. all three certified table definitions are available;
9. each existing evidence sheet is inspected before mutation;
10. existing exact headers are accepted;
11. any existing non-exact header sequence fails closed;
12. no fallback spreadsheet is selected;
13. no evidence rows are generated or altered by provisioning.

Any failed preflight condition must prevent provisioning mutation.

## Existing-sheet behavior

For each exact evidence table:

### Missing sheet

A missing sheet may be created only during the separately authorized bounded
administrative provisioning execution.

The exact certified ordered header row may then be written once.

### Existing exact sheet

An existing sheet with the exact certified ordered header row is
`already_provisioned`.

It must not be recreated.

It must not be rewritten merely to normalize formatting.

### Existing mismatched sheet

Any existing sheet whose header row differs from the exact certified ordered
header sequence must fail closed as `rejected_existing_schema`.

Automatic header repair is prohibited.

Automatic column reordering is prohibited.

Automatic migration is prohibited.

Destructive recreation is prohibited.

Deleting an existing evidence sheet is prohibited.

## Mutation boundary

The future execution may perform only the minimum mutations required to create
a missing certified evidence sheet and write its exact certified header row.

It must not:

- append ARV evidence;
- append repair-scope evidence;
- append readiness evidence;
- alter existing evidence records;
- delete evidence records;
- generate evidence IDs;
- generate property identity;
- repair property identity;
- generate ARV;
- generate repair scope;
- calculate MAO;
- generate an offer;
- submit an offer;
- mutate Qualified Deal Queue;
- advance acquisition lifecycle state.

There is no evidence-generation authority.

There is no property-identity repair authority.

## Locking

The future provisioning execution must acquire a bounded administrative lock
before its first mutation.

Failure to acquire the lock must return `failed_lock`.

The lock must be released in a finally-equivalent path.

The lock must not create automatic retry authority.

## Verification after mutation

After any allowed sheet creation, the executor must immediately re-read and
verify:

1. exact sheet name;
2. exact header count;
3. exact ordered header values.

After all three table checks, a final full preflight must verify the complete
three-table storage surface.

A creation call that does not verify exactly must fail closed.

## Partial provisioning

The executor must not claim success when only part of the three-table surface
has been verified.

If a bounded execution creates one or more missing sheets and then encounters a
later failure, the result must truthfully report `failed_provisioning` or
`failed_verification`.

The executor must not delete correctly created sheets merely to simulate
transactional rollback.

A later separately authorized administrative invocation may re-run the exact
preflight and treat already exact sheets as `already_provisioned`.

There is no automatic retry.

## Outcomes

The administrative execution must use only these bounded outcome classes:

- `provisioned`
- `already_provisioned`
- `rejected_spreadsheet_identity`
- `rejected_existing_schema`
- `rejected_authorization`
- `failed_lock`
- `failed_provisioning`
- `failed_verification`

No successful outcome may imply evidence readiness or acquisition authority.

## Audit evidence

A future bounded execution must produce durable or externally captured
administrative evidence sufficient to certify:

- exact invocation timestamp supplied or captured by the administrative layer;
- exact requested spreadsheet identity;
- exact independently expected production spreadsheet identity;
- exact authorization state;
- exact preflight result;
- exact per-table pre-state;
- exact per-table action;
- exact per-table post-state;
- exact final verification;
- exact bounded outcome;
- whether any mutation occurred.

Audit evidence must not contain fabricated deal evidence.

## Idempotent administrative behavior

When all three exact sheets already exist with exact certified headers, a
separately authorized execution must perform no storage mutation and return
`already_provisioned`.

Repeated administrative execution is not automatic.

Idempotent behavior does not itself authorize repeated execution.

## Production execution boundary

Implementation of a live administrative executor is a separate phase.

A future implementation may provide explicitly injected Apps Script
dependencies needed to:

- open the exact spreadsheet by certified identity;
- inspect exact sheets;
- create a missing sheet;
- write the exact certified header row;
- acquire and release a bounded lock.

That implementation must remain non-invoked until a separate production
execution authorization is issued.

## Deployment boundary

Creating a live-capable administrative executor does not authorize deployment.

Deployment is a separate certified event.

Changing an Apps Script deployment is not authorized by this design.

Changing a trigger is not authorized by this design.

## Provider boundary

Provisioning requires no comparable-sales provider request.

No external provider request is authorized by this design.

## Persistence boundary

Provisioning creates storage structure only.

It does not call:

- `appendDealArvEvidence`
- `appendDealRepairScopeEvidence`
- `appendDealOfferReadinessEvidence`

It does not authorize those calls in production.

## Readiness-gate boundary

Provisioning does not invoke the comps readiness evidence gate.

Provisioning does not wire a production consumer to the gate.

Production readiness-gate consumer wiring remains a separate future design and
implementation phase after production persistence is independently proven.

## Acquisition safety boundary

The acquisition safety gate remains unchanged.

Evidence-layer readiness requires both:

- adequate comp-supported ARV evidence; and
- adequate repair-scope evidence.

Storage provisioning supplies neither.

Storage provisioning cannot set either readiness condition true.

Storage provisioning cannot grant:

- MAO authority;
- offer-generation authority;
- offer-submission authority;
- Qualified Deal Queue authority;
- acquisition lifecycle authority.

## Required future sequence

The required sequence after this design is:

1. merge this design;
2. implement an offline-certifiable live administrative provisioning executor;
3. certify that executor without production mutation;
4. separately certify any required Apps Script deployment change;
5. separately authorize exactly one bounded production provisioning invocation;
6. execute at most that one authorized invocation;
7. verify the exact production spreadsheet identity;
8. verify all three exact evidence sheets and ordered headers;
9. certify production storage binding;
10. separately reconcile the live storage adapter to explicit spreadsheet identity;
11. separately prove production persistence;
12. only then design production readiness-gate consumer wiring.

No later step is implicitly authorized by completion of an earlier step.

## Explicit non-authorizations

This design does not authorize:

- production sheet creation;
- production sheet mutation;
- live Google Sheets reads;
- live Google Sheets writes;
- production evidence persistence;
- production RPC execution;
- Apps Script deployment updates;
- trigger creation or modification;
- provider requests;
- automatic provisioning;
- automatic retry;
- header repair;
- schema migration;
- property-identity repair;
- evidence generation;
- production readiness-gate wiring;
- Qualified Deal Queue mutation;
- acquisition lifecycle mutation;
- MAO calculation or authority;
- offer generation or authority;
- offer submission or authority.
