# Absentee Owner V2 Persistence Bounded Rollout Orchestrator — Implementation Freeze v1

Capability:

`ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2`

Certified base:

- main: `540120bc71803dcc9b0375020704e6d1fe61fd75`
- tree: `fcdd49ab99db4fe99044311774dbc2c225ce866f`
- deployed executor production version: `156`

## Purpose

Provide a separately bounded orchestration layer for the already-certified V2 classification-evidence persistence executor.

This capability does not create, weaken, replace, or bypass the V2 planner, V2 executor, V2 evidence store, V1 reconciliation rules, or ScriptLock/write-state boundary.

## Runtime

Proposed additive runtime:

`build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js`

Namespace:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2`

Method:

`run(options)`

No global Apps Script production RPC is authorized in this capability.

## Input contract

`options` must contain exactly:

`evidenceBundles`

`evidenceBundles` must contain between 1 and 10 explicit bundles.

Every bundle must contain exactly these five artifacts:

1. `propertySourceIdentityCertification`
2. `normalLookupEvidence`
3. `ownerEvidenceResult`
4. `comparisonResult`
5. `classificationResult`

Caller-supplied persistence plans are prohibited.

Caller-supplied event IDs, event hashes, previous hashes, timestamps, storage row numbers, lock contexts, or write-state tokens are prohibited.

## Whole-request preflight

Before the first V2 executor invocation, the orchestrator must preflight every submitted bundle through:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.prepare(bundle)`

This planner preflight is validation-only.

No prepared plan may be passed to the executor.

After preflight, the original five-artifact bundle must be passed to the certified executor so the executor independently rebuilds and validates its plan.

If any bundle fails planner preflight, the entire rollout request must stop before any V2 persistence executor call.

## Bounded duplicate protection

Using the validated preflight plans, the orchestrator must reject the entire request before persistence if any two bundles share:

- the same physical target row number;
- the same Distress Lead ID + Canonical Property Key dual identity; or
- the same deterministic V2 Evidence Event ID.

Duplicate rejection occurs before any V2 executor call.

## Execution model

After all bundles pass whole-request preflight:

- process sequentially;
- preserve caller order;
- maximum 10 bundles;
- no concurrency;
- no parallel executor calls;
- no automatic retry;
- no scheduler;
- no trigger;
- no background continuation;
- no batch resumption token.

For each bundle, call only:

`REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.execute(originalBundle)`

The orchestrator must never call the V2 evidence store directly.

The orchestrator must never acquire its own persistence ScriptLock.

The certified executor remains sole owner of planner-to-lock-to-V1-reconciliation-to-V2-store composition.

## Accepted executor success outcomes

Only these executor outcomes permit progression to the next bundle:

- `ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED`
- `ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED`

## Mandatory halt outcomes

The rollout must halt immediately and process no later bundle if the executor returns:

- `ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED`
- `ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN`

The rollout must also halt when the executor result code is:

- `V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION`

No later bundle may execute after any of these states.

## Escaped exception classification

The certified executor is expected to return classified results rather than throw.

If an unexpected exception escapes the executor boundary, the orchestrator must classify the rollout as uncertain and halt immediately.

It must not retry that bundle automatically because the orchestrator cannot independently prove whether a physical append boundary was crossed.

## Result contract

The bounded rollout result must report:

- requested bundle count;
- preflighted bundle count;
- processed bundle count;
- verified persistence count;
- already-persisted count;
- halted boolean;
- halt index when applicable;
- halt persistence outcome when applicable;
- halt code when applicable;
- per-bundle target identity;
- per-bundle persistence outcome;
- per-bundle disposition when present;
- classifier result SHA-256 when present;
- evidence event ID when present;
- evidence event SHA-256 when present;
- physical evidence row number when present.

The response must not manufacture persistence evidence absent from the certified executor result.

## Authority boundary

This capability grants no authority for:

- source-evidence retrieval;
- property-source identity certification;
- owner-evidence retrieval;
- classification;
- canonical identity repair;
- V1-to-V2 migration;
- scheduler creation;
- trigger creation;
- connector execution;
- direct V2 evidence-store calls;
- DISTRESS_LEADS mutation;
- Qualified Deal Queue mutation;
- acquisition lifecycle mutation;
- occupancy determination;
- vacancy determination;
- ARV;
- repair scope;
- MAO;
- offer generation;
- offer submission.

The only mutation path this capability may eventually orchestrate is the already-certified V2 classification-evidence executor.

## Public production boundary

This capability itself introduces no global production RPC.

Any callable production entrypoint, production invocation boundary, scheduler, or autonomous orchestration must be a separately designed and certified capability.

## Immutable dependencies

The following files are immutable dependencies during implementation:

- `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js`
- `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js`
- `build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js`
- `build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js`
- `build/apps-script-brand/Database.js`

The V1 bounded rollout is reference-only and must not be modified.

## Implementation decomposition

After this implementation freeze is separately committed/merged, the implementation capability may modify exactly six files:

1. NEW `build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js`
2. NEW `scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2.js`
3. NEW `scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-behavior-v2.js`
4. NEW `scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-integration-v2.js`
5. MODIFY `.github/workflows/county-collapse-offline.yml`
6. MODIFY `scripts/validate-county-runtime-integration.js`

No other source file is in implementation scope.

## Implementation-freeze artifact scope

The immediate design-freeze source edit, when separately authorized, may contain exactly three files:

1. MODIFY `.github/workflows/county-collapse-offline.yml`
2. NEW `docs/absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.md`
3. NEW `scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-bounded-rollout-orchestrator-v2-implementation-freeze-v1.js`

The freeze PR must contain no runtime implementation.

## Behavioral validation floor

The eventual implementation behavioral suite must contain at least 46 cases.

Required coverage includes:

- invalid outer options;
- zero bundles;
- more than 10 bundles;
- malformed bundle envelope;
- planner rejection before any executor invocation;
- later-bundle planner rejection still causing zero executor invocations;
- duplicate row rejection before execution;
- duplicate dual-identity rejection before execution;
- duplicate deterministic V2 event-ID rejection before execution;
- exact preservation of caller order;
- one-bundle VERIFIED success;
- one-bundle ALREADY_PERSISTED success;
- mixed VERIFIED / ALREADY_PERSISTED success;
- halt on V2 PRECONDITION;
- halt on V2 UNCERTAIN;
- halt on V1 equivalent reconciliation requirement;
- no later bundle execution after halt;
- escaped executor exception classified uncertain;
- no automatic retry after uncertainty;
- no direct V2 store call;
- no orchestrator-owned ScriptLock;
- original bundle, not prepared plan, passed to executor;
- planner used for whole-request preflight;
- exact maximum bundle bound;
- downstream authority fields remain false;
- no public RPC;
- no scheduler;
- no trigger;
- no ARV authority;
- no repair-scope authority;
- no MAO authority;
- no offer authority.

## Acquisition safety

Automatic MAO or offer authority remains prohibited unless separately certified comp-supported ARV and adequate repair scope both exist.

This design grants neither.
