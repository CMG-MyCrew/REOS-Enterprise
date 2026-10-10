# Absentee-Owner Certified Property-Source Provenance Bounded-Rollout Production Invocation Boundary Design v1

## 1. Status and authority

This document defines the first production invocation boundary for `ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_INVOCATION_V2`.

This design is non-executable and grants no source-edit, commit, push, merge, deployment, production invocation, bounded-rollout execution, or V2 persistence authority.

Deployment of the eventual entrypoint does not authorize production invocation.

A separately certified invocation event is required before the eventual RPC may be invoked with any evidence bundle.

## 2. Certified dependency

The sole persistence-capable delegation dependency is:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.run(options)`

Certified deployed dependency:

- merged main: `494b2b62a075e06a345f8065a04bc93b8d88a68d`
- production version: `157`
- orchestrator Git blob: `3318bbb73f8acf5b8a4e480fb31cf965461f05ca`
- orchestrator SHA-256: `2356c6e3f657aa138cd4ac69c02a829636b9a633fc4c5946cfa27290e9db4529`

The existing orchestrator is not modified by this capability.

The existing V2 planner is not modified by this capability.

The existing V2 executor is not modified by this capability.

The existing V2 evidence store is not modified by this capability.

The existing Database runtime is not modified by this capability.

## 3. Invocation model

The invocation model is exactly:

`manual_bounded_admin_only`

The eventual production entrypoint namespace is exactly:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2`

The internal method is exactly:

`execute(options)`

The eventual global Apps Script production RPC is exactly:

`reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2(options)`

Exactly one global production RPC is permitted by the eventual implementation.

`REOS.Security.requireAdmin()` must execute exactly once and before input validation, dependency inspection, or orchestrator delegation.

Failure of the admin gate must prevent all downstream work.

## 4. Exact input envelope

The top-level input must contain exactly one field:

`evidenceBundles`

`evidenceBundles` must contain between 1 and 10 bundles inclusive.

Every bundle must contain exactly these five certified artifacts:

1. `propertySourceIdentityCertification`
2. `normalLookupEvidence`
3. `ownerEvidenceResult`
4. `comparisonResult`
5. `classificationResult`

No sixth bundle field is allowed.

The production entrypoint must not create, repair, enrich, retrieve, classify, or replace any of the five artifacts.

The entrypoint performs only structural envelope validation.

Semantic validation and whole-request preflight remain exclusively inside the certified V2 orchestrator and planner chain.

## 5. Caller-supplied persistence metadata is prohibited

The caller may not supply an orchestrator plan.

The caller may not supply or override deterministic V2 persistence metadata outside the five certified artifacts.

The caller may not supply or override:

`evidenceEventId`

`evidenceEventSha256`

`previousEventSha256`

`physicalEvidenceRowNumber`

`persistedAt`

`storageRow`

`lockState`

`writeState`

`retryState`

`resumeToken`

The caller may not select an evidence-store row.

The caller may not select or override a previous-event hash.

The caller may not request a retry.

## 6. Delegation boundary

After the admin gate and exact structural input validation, the entrypoint must verify the certified orchestrator dependency is available.

The entrypoint must delegate exactly once to:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.run(options)`

The original validated `options` object must be passed to the orchestrator.

The entrypoint must not call the V2 planner directly.

The entrypoint must not call the V2 executor directly.

The entrypoint must not call the V2 evidence store directly.

The entrypoint must not call Database directly.

The entrypoint must not acquire a ScriptLock.

The entrypoint must not perform spreadsheet mutation directly.

The entrypoint must not perform HTTP retrieval.

The entrypoint must not perform source-evidence retrieval.

The entrypoint must not perform property-source certification.

The entrypoint must not perform owner-evidence lookup.

The entrypoint must not perform owner comparison.

The entrypoint must not perform classification.

## 7. Retry, scheduling, and continuation authority

Automatic retry authority is zero.

Scheduler authority is zero.

Trigger authority is zero.

Background continuation authority is zero.

Pagination authority is zero.

Resume authority is zero.

The entrypoint must not create a trigger.

The entrypoint must not schedule another invocation.

The entrypoint must not recursively invoke itself.

The entrypoint must not invoke the orchestrator more than once.

## 8. Orchestrator result contract

The entrypoint may pass through a structurally valid orchestrator result.

The certified successful orchestrator outcome is:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_COMPLETED`

The certified bounded failure outcomes include:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_PRECONDITION_FAILED`

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_OUTCOME_UNCERTAIN`

Per-bundle persistence outcomes remain owned by the orchestrator/executor contract.

The entrypoint must not invent persistence evidence.

The entrypoint must not convert an uncertain outcome into success.

The entrypoint must not convert a V1-equivalent reconciliation requirement into success.

The entrypoint must not suppress a halt condition.

The entrypoint must not infer that persistence occurred when the orchestrator does not certify it.

## 9. Escaped orchestrator exception

An escaped orchestrator exception must fail closed.

It must not be retried automatically.

It must not be represented as verified persistence.

It must not invent an evidence event ID, evidence hash, physical row, or persisted timestamp.

The entrypoint may return only a bounded production-invocation uncertainty classification with no invented persistence evidence.

## 10. Malformed upstream result

A malformed orchestrator result fails closed.

An orchestrator result containing any unexpected true authority grant fails closed.

The entrypoint does not expand authority returned to the caller.

No result from this entrypoint grants scheduler, trigger, source-retrieval, classification, identity-repair, migration, ARV, repair-scope, MAO, offer-generation, or offer-submission authority.

## 11. Production execution authority boundary

This capability eventually permits one manual admin-controlled production invocation path to an already-certified bounded persistence orchestrator.

That eventual runtime surface does not itself authorize a particular production execution event.

Every actual bounded rollout requires a separate invocation authorization that pins the exact evidence bundles and production deployment identity before invocation.

A deployment event is not an invocation event.

A successful CI event is not an invocation event.

A successful version creation is not an invocation event.

A successful production deployment update is not an invocation event.

## 12. Prohibited direct surfaces

The eventual entrypoint must not directly reference or invoke:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2`

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2`

`REOS.AbsenteeOwnerClassificationEvidenceStoreV2`

`REOS.Database`

`SpreadsheetApp`

`UrlFetchApp`

`ScriptApp`

`LockService`

`PropertiesService`

It must not call:

`setValue(`

`setValues(`

`appendRow(`

`deleteRow(`

`insertRow(`

It must not expose any second production RPC.

## 13. Acquisition safety boundary

Owner occupancy authority remains false.

Vacancy authority remains false.

Qualified Deal Queue authority remains false.

Acquisition lifecycle authority remains false.

ARV authority remains false.

Repair-scope authority remains false.

MAO authority remains false.

Offer-generation authority remains false.

Offer-submission authority remains false.

Automatic-offer authority remains false.

Automatic MAO or offer authority remains blocked unless both adequate comp-supported ARV and an adequate repair scope are present.

## 14. Eventual implementation surface

The eventual implementation is limited to exactly six changed files:

1. new internal production-entrypoint runtime
2. new static validator
3. new behavior validator
4. new integration validator
5. offline CI workflow registration
6. county-runtime integration registration

The expected runtime path is:

`build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2.js`

The expected static validator path is:

`scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-entrypoint-v2.js`

The expected behavior validator path is:

`scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-entrypoint-behavior-v2.js`

The expected integration validator path is:

`scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-production-entrypoint-integration-v2.js`

The existing orchestrator and all persistence dependencies remain immutable during that implementation.

The eventual behavior suite must contain at least 48 cases.

## 15. Required behavior coverage

The behavior suite must cover admin rejection before delegation.

It must cover invalid top-level fields.

It must cover zero bundles.

It must cover more than ten bundles.

It must cover invalid bundle fields.

It must cover dependency absence.

It must cover exact single delegation.

It must cover original-options delegation.

It must cover successful completed rollout pass-through.

It must cover precondition failure pass-through.

It must cover uncertain outcome pass-through.

It must cover V1-equivalent reconciliation halt preservation.

It must cover escaped orchestrator exceptions.

It must cover malformed orchestrator output.

It must cover unexpected true authority grants.

It must cover zero automatic retry.

It must cover zero scheduler and trigger behavior.

It must cover absence of direct planner, executor, store, Database, spreadsheet, HTTP, or lock access.

It must cover all acquisition-safety authority flags remaining false.

## 16. Lifecycle

This design does not authorize source editing.

This design does not authorize implementation.

This design does not authorize commit creation.

This design does not authorize push.

This design does not authorize PR creation.

This design does not authorize merge.

This design does not authorize Apps Script version 158.

This design does not authorize deployment.

This design does not authorize production invocation.

This design does not authorize bounded-rollout execution.

This design does not authorize V2 persistence execution.

The next lifecycle event after this design is a separately certified design-source-edit authorization.
