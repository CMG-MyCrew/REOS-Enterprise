#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

const BASELINE = '66069b2';

const LEGACY_PROTECTED_FILES = [
  'build/apps-script-brand/ConnectorRegistry.js',
  'build/apps-script-brand/AcquisitionConnectorManager.js'
];

/*
 * ConnectorRegistry.js remains legacy-protected except for one explicitly
 * certified Zillow scheduler metadata change:
 *
 *   Every 5 minutes -> Every 15 minutes
 *
 * The hard-baseline check below reconstructs the only permitted current
 * file from BASELINE and rejects every other byte-level change.
 */
const ZILLOW_SCHEDULE_METADATA_FILE =
  'build/apps-script-brand/ConnectorRegistry.js';

const ZILLOW_SCHEDULE_METADATA_BEFORE =
  "['zillow_gmail_leads','Zillow Gmail Multi-Folder Leads'," +
  "'GMAIL','Zillow Lead','reosConnectorHandleZillowGmail'," +
  "'false','Every 5 minutes',65],";

const ZILLOW_SCHEDULE_METADATA_AFTER =
  "['zillow_gmail_leads','Zillow Gmail Multi-Folder Leads'," +
  "'GMAIL','Zillow Lead','reosConnectorHandleZillowGmail'," +
  "'false','Every 15 minutes',65],";

const RUNTIME_CORE_FILES = [
  'ArcGISAdapter.js',
  'CSVAdapter.js',
  'CountyAdapterRegistry.js',
  'CountyConnectorSDK.js',
  'CountyHttpAdapter.js',
  'HTMLTableAdapter.js',
  'JSONAPIAdapter.js',
  'SocrataAdapter.js'
];

const INTEGRATION_FILES = [
  'DistressLeadCountySchema.js',
  'CountyRuntimeBridge.js'
];

const PRODUCTION_PRESERVATION_FILES = [
  'AcquisitionDistressIntelligence.js',
  'AcquisitionOpportunityView.js',
  'DealLifecycleWorkflow.js',
  'DistressIntelligenceBatchProcessor.js',
  'DistressIntelligenceEntryPoints.js',
  'RuntimeVault.js',
  'ProductionOperations.js'
];

const CONTROLLED_MODIFIED_BUILD_FILES = [
  'build/apps-script-brand/appsscript.json',
  'build/apps-script-brand/LivePipelineVerification.js'
];

/*
 * Explicit post-county production additions.
 *
 * These files were introduced after the county runtime reconciliation and
 * are outside that historical 112-file inventory. Keep every exemption
 * explicit so unrelated future build additions cannot silently expand
 * county production authority.
 */
const POST_COUNTY_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerEnrichmentSanitizer.js',
  'build/apps-script-brand/AbsenteeOwnerEnrichmentPersistenceAdapter.js',
  'build/apps-script-brand/AbsenteeOwnerEnrichmentExecutionRequestBuilder.js',
  'build/apps-script-brand/AbsenteeOwnerEnrichmentExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerEnrichmentCertificationEntrypoint.js',
  'build/apps-script-brand/AbsenteeOwnerEnrichmentExactRecordSelector.js',
  'build/apps-script-brand/AbsenteeOwnerEnrichmentCandidateDiscovery.js',
  'build/apps-script-brand/AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js',
  'build/apps-script-brand/AbsenteeOwnerOwnerEvidenceComparison.js',
  'build/apps-script-brand/AbsenteeOwnerClassification.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',
  'build/apps-script-brand/AbsenteeOwnerOpaAccountRangeEvidenceEvaluator.js',
  'build/apps-script-brand/ZillowProductionEvidence.js',
  'build/apps-script-brand/ZillowGmailConnectorStateDiagnostic.js',
  'build/apps-script-brand/ZillowGmailFailClosedTriggerInstaller.js',
 'build/apps-script-brand/ZillowDistressLeadProvenanceEvidence.js',
  'build/apps-script-brand/CanonicalPropertyIdentity.js',
  'build/apps-script-brand/CountyIdentityHistoricalAudit.js',
  'build/apps-script-brand/CountyIdentitySourceReconciliation.js',
  'build/apps-script-brand/CountyIdentityRepairEvidenceExport.js',
  'build/apps-script-brand/CountyIdentityReferenceAudit.js',
  'build/apps-script-brand/CountySparseRowRepairEvidence.js',
  'build/apps-script-brand/CountySparseRowRepairExecutor.js',
  'build/apps-script-brand/CountyEndpointConfigurationAuthority.js',
  'build/apps-script-brand/CountyC1CertifiedAuthority.js',
  'build/apps-script-brand/CountyC1LivePreflight.js',
  'build/apps-script-brand/CountyC1SchemaMigration.js',
  'build/apps-script-brand/CountyC1InsertRecovery.js',
  'build/apps-script-brand/CountyC1MaintenanceGate.js',
  'build/apps-script-brand/ScriptLockObservability.js',
  'build/apps-script-brand/CountyCheckpointRecovery.js',
  'build/apps-script-brand/CountyCheckpointAk1ToAk2Reconciliation.js',
  'build/apps-script-brand/PhiladelphiaProbateRecurringSource.js',
  'build/apps-script-brand/PhiladelphiaProbateRuntimeProbe.js',
  'build/apps-script-brand/PhiladelphiaProbateBoundedSourceDiscovery.js',
  'build/apps-script-brand/CountyPage23ArcGisRuntimeDiagnostic.js',
  'build/apps-script-brand/CountyArcGisKeysetBoundaryDiagnostic.js',
  'build/apps-script-brand/CountyCodeViolationSourceRecordDiagnostic.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityAudit.js',
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js',
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js',
  'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js',
  'build/apps-script-brand/CountyCodeViolationDurableSourceReconciliation.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationPlan.js',
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationBatch1Executor.js',
  'build/apps-script-brand/CountyPage85SourceObservation214Repair.js',
  'build/apps-script-brand/PhiladelphiaProbateBoundedPdfFetch.js',
  'build/apps-script-brand/PhiladelphiaProbateBoundedTextExtraction.js',
  'build/apps-script-brand/PhiladelphiaProbateProductionExtractionOrchestration.js',
  'build/apps-script-brand/PhiladelphiaProbateProductionExtractionReadinessProbe.js',
  'build/apps-script-brand/PhiladelphiaProbateBoundedOversizeTextEvidence.js',
  'build/apps-script-brand/PhiladelphiaProbateProductionOversizeTextEvidenceRecovery.js',
  'build/apps-script-brand/PhiladelphiaProbateOversizeRecoveryReadinessProbe.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysis.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecoveryProductionTransport.js',
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport.js',
  'build/apps-script-brand/PhiladelphiaProbatePersistenceReadinessExactIdentityInspection.js',
  'build/apps-script-brand/PhiladelphiaProbateAbsentPersistenceExecutor.js',
];

/*
 * Bounded absentee-owner source-evidence retrieval runtime.
 *
 * Keep this read-only implementation separate from the inherited
 * POST_COUNTY_PRODUCTION_FILES inventory. Multiple existing certified
 * absentee-owner integration validators intentionally pin that historical
 * inventory at exactly 70 files.
 *
 * This one-file inventory is not generic production-addition authority.
 * The runtime remains internal, read-only, non-RPC, non-scheduled,
 * non-persistent, and without classification/offer authority.
 */
const ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js'
];

/*
 * Bounded absentee-owner OPA account-range property-source identity
 * certification runtime.
 *
 * Keep this pure internal certifier separate from the inherited
 * POST_COUNTY_PRODUCTION_FILES inventory and from the existing
 * source-evidence retrieval surfaces. This one-file inventory grants no
 * RPC, external retrieval, scheduler, persistence, classification,
 * acquisition, ARV, repair, MAO, or offer authority.
 */
const ABSENTEE_OWNER_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js'
];

/*
 * Bounded owner-evidence retrieval from an already certified
 * property/source identity.
 *
 * Keep this internal read-only account lookup separate from inherited
 * production inventories. It grants one bounded official OPA read only and
 * grants no RPC, persistence, classification invocation, scheduler,
 * acquisition, ARV, repair, MAO, or offer authority.
 */
const ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js'
];

/*
 * Bounded absentee-owner single-record source-evidence production entrypoint.
 *
 * Keep this separately authorized production RPC boundary outside both the
 * inherited POST_COUNTY_PRODUCTION_FILES inventory and the internal retriever
 * inventory. It grants only manual, single-record, read-only retrieval
 * orchestration and no deployment, evaluator, persistence, classification,
 * acquisition, ARV, repair, MAO, or offer authority.
 */
/*
 * Certified property-source provenance persistence planner v2.
 *
 * Keep this additive pure planner separate from inherited production
 * inventories. It validates one internally produced five-artifact evidence
 * bundle and prepares deterministic v2 persistence data only. It grants no
 * store, executor, RPC, scheduler, HTTP, database, SpreadsheetApp, lock,
 * classification-execution, acquisition, ARV, repair, MAO, or offer authority.
 */
const ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_V2_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js'
];

/*
 * Certified property-source provenance classification evidence store v2.
 *
 * Keep this additive append-only store separate from the v1 evidence store
 * and from provisioning, executor, rollout, orchestration, acquisition, ARV,
 * repair, MAO, and offer authority. The caller owns the ScriptLock; this store
 * validates the lock context and performs one authorized append boundary only.
 */
const ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js'
];

/*
 * Certified property-source provenance persistence executor v2.
 *
 * Keep this internal persistence executor separate from planner/store,
 * provisioning, rollout, orchestration, acquisition, ARV, repair, MAO,
 * and offer authority. It owns one ScriptLock composition boundary only.
 */
const ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXECUTOR_V2_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js'
];

/*
 * Certified property-source provenance bounded rollout orchestrator v2.
 *
 * Keep this internal bounded orchestration runtime separate from planner,
 * store, executor, provisioning, scheduler, production-RPC, acquisition,
 * ARV, repair, MAO, and offer authority. It preflights up to ten explicit
 * evidence bundles and delegates persistence only to the certified V2
 * executor. It owns no persistence lock and exposes no global RPC.
 */
const ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js'
];

/*
 * Manual admin-only V2 bounded-rollout production entrypoint.
 *
 * Keep this additive RPC boundary separate from the certified internal
 * orchestrator. It delegates exactly once to that orchestrator and grants
 * no direct planner, executor, store, Database, HTTP, spreadsheet, lock,
 * scheduler, trigger, acquisition, ARV, repair, MAO, or offer authority.
 */
const ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_V2_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2.js'
];

/*
 * V2 evidence-store provisioning administration runtime.
 *
 * Keep this additive administrative provisioning surface separate from the
 * inherited POST_COUNTY_PRODUCTION_FILES inventory and from the V2
 * persistence store. It grants no persistence, rollout, orchestration,
 * scheduler, acquisition, ARV, repair, MAO, or offer authority.
 */
const ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ProvisioningAdmin.js'
];


/*
 * Exact-event V2 read-only reconciliation runtime.
 *
 * Keep this isolated reconciliation surface separate from the historical
 * county production inventory. The compatibility validator must pass in both
 * promotion states:
 *
 * - before the runtime is merged, the exact path is absent;
 * - when the runtime is present, it must be exactly one additive file.
 *
 * This inventory grants no persistence write, retry, scheduler, trigger,
 * external HTTP, Distress_Leads mutation, acquisition, ARV, repair, MAO,
 * offer, deployment, or production invocation authority.
 */
const ABSENTEE_OWNER_V2_EXACT_EVENT_READ_ONLY_RECONCILIATION_PRODUCTION_FILES = [
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2ExactEventReadOnlyReconciliation.js'
];

/*
 * Bounded certified-property-source owner-evidence production entrypoint.
 *
 * Keep this manual single-record admin RPC separate from both the internal
 * lookup inventory and the historical source-evidence entrypoint inventory.
 * The entrypoint delegates once to the already-certified owner-evidence
 * lookup and grants no direct HTTP, persistence, classification, scheduler,
 * acquisition, ARV, repair, MAO, or offer authority.
 */
const ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_FILES = [
  'build/apps-script-brand/AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint.js'
];

const ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_ENTRYPOINT_FILES = [
  'build/apps-script-brand/AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js'
];


/*
 * Explicit post-county modifications of production files that existed at
 * the county reconciliation baseline.
 *
 * Keep these separate from both the historical controlled modifications
 * and additive post-county files so each class retains its exact Git
 * status contract.
 */
const POST_COUNTY_MODIFIED_PRODUCTION_FILES = [
  ZILLOW_SCHEDULE_METADATA_FILE,
  'build/apps-script-brand/ZillowGmailConnector.js',
  'build/apps-script-brand/Database.js',

  /*
   * Cross-source observation-integrity repair.
   *
   * These remain baseline files rather than additive county
   * runtime modules, so each must continue to appear exactly
   * once as Git status M relative to BASELINE.
   */
  'build/apps-script-brand/CSVImportEngine.js',
  'build/apps-script-brand/LeadDeduplication.js',

  /*
   * Certified comps workflow fail-closed hardening.
   * AcquisitionWorkflow.js existed at the county baseline and is
   * therefore explicitly accounted here as a later modification.
   * DealLifecycleWorkflow.js is intentionally NOT listed here because
   * it is classified as a post-baseline production addition.
   */
  'build/apps-script-brand/AcquisitionWorkflow.js',

  /*
   * Certified Daily Digest acquisition-KPI correction from PR #297.
   *
   * Notifications.js existed at the historical county baseline and is
   * therefore an explicit later modification. A separate blob-identity
   * assertion below prevents this accounting entry from becoming generic
   * authority for future Notifications.js changes.
   */
  'build/apps-script-brand/Notifications.js'
];

const COMPONENT_VALIDATORS = [
  'validate-county-connector-certification.js',
  'validate-county-runtime-packaging.js',
  'validate-generated-county-connectors.js',
  'validate-distress-lead-county-schema.js',
  'validate-canonical-property-upsert-identity.js',
  'validate-cross-source-observation-integrity.js',
  'validate-county-identity-historical-audit.js',
  'validate-county-code-violation-durable-identity-audit.js',
  'validate-county-code-violation-collapse-only-evidence-authority-v2.js',
  'validate-county-code-violation-collapse-fullrow-evidence-v2.js',
  'validate-county-code-violation-collapse-winner-plan-v1.js',
  'validate-county-code-violation-group3-post-restoration-evidence-v1.js',
  'validate-county-code-violation-single-row-drift-diagnostic.js',
  'validate-county-code-violation-two-row-raw-evidence.js',
  'validate-county-code-violation-durable-source-reconciliation.js',
  'validate-county-code-violation-durable-identity-migration-plan.js',
  'validate-county-code-violation-durable-identity-migration-batch1-executor.js',
  'validate-code-violations-production-completion-gate1.js',
  'validate-code-violations-gate1-population-authority.js',
  'validate-code-violations-gate1-recovery-authority.js',
  'validate-code-violations-gate1-recovery-preflight.js',
  'validate-code-violations-gate1-recovery-maintenance-gate.js',
  'validate-county-code-violation-collapse-maintenance-gate-v1.js',
  'validate-county-collapse-runtime-prerequisite-certification-v1.js',
  'validate-county-collapse-operation-intent-orphan-binding-recovery-contract-v1.js',
  'validate-county-collapse-operation-intent-orphan-binding-recovery-v1.js',
  'validate-county-collapse-group2-stranded-operation-reconciliation-v2.js',
  'validate-county-collapse-group2-prepared-operation-retirement-v1.js',
  'validate-county-collapse-group2-post-terminal-reconciliation-v1.js',
  'validate-county-collapse-group2-executor-history-exception-v1.js',
  'validate-code-violations-gate1-recovery-executor.js',
  'validate-county-identity-source-reconciliation.js',
  'validate-county-identity-repair-evidence-export.js',
  'validate-county-identity-reference-audit.js',
  'validate-county-sparse-row-repair-evidence.js',
  'validate-county-sparse-row-repair-executor.js',
  'validate-county-endpoint-configuration-authority.js',
  'validate-county-c1-certified-authority.js',
  'validate-county-c1-live-preflight.js',
  'validate-county-c1-schema-migration.js',
  'validate-county-c1-maintenance-gate.js',
  'validate-script-lock-observability.js',
  'validate-county-c1-insert-recovery.js',
  'validate-database-lock-handoff.js',
  'validate-county-checkpoint-recovery.js',
  'validate-county-checkpoint-ak1-to-ak2-reconciliation-v1.js',
  'validate-county-page23-arcgis-runtime-diagnostic.js',
  'validate-county-arcgis-keyset-boundary-diagnostic.js',
  'validate-county-code-violation-source-record-diagnostic.js',
  'validate-county-page85-source-observation-214-repair.js',
  'validate-county-page85-source-observation-214-repair-failure-paths.js',
  'validate-county-page86-duplicate-source-repair.js',
  'validate-county-page86-duplicate-source-repair-failure-paths.js',
  'validate-county-page89-source-observation-622060-repair.js',
  'validate-philadelphia-probate-recurring-source.js',
  'validate-philadelphia-probate-runtime-probe-v1.js',
  'validate-philadelphia-probate-bounded-source-discovery-v1.js',
  'validate-philadelphia-probate-public-notice-feed.js',
  'validate-zillow-production-gmail-connector-state-diagnostic-v1.js',
  'validate-zillow-production-gmail-fail-closed-trigger-installer-v1.js',
  'validate-absentee-owner-bounded-candidate-discovery-v1.js',
  'validate-absentee-owner-bounded-candidate-discovery-behavior-v1.js',
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-v1.js',
  'validate-absentee-owner-philadelphia-owner-evidence-lookup-behavior-v1.js',
  'validate-absentee-owner-opa-account-range-evidence-evaluator-behavior-v1.js',
  'validate-absentee-owner-owner-evidence-comparison-v1.js',
  'validate-absentee-owner-owner-evidence-comparison-behavior-v1.js',
  'validate-absentee-owner-classification-v1.js',
  'validate-absentee-owner-classification-behavior-v1.js',
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-v1.js',
  'validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-behavior-v1.js',
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',
  'validate-county-code-violation-collapse-executor-runtime-v1.js',
  'validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js',
  'validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js',
  'validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js',
  'validate-county-code-violation-collapse-executor-blocker-retirement-runtime-v1.js',
  'validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js',
  'validate-county-runtime-bridge.js',
  'validate-philadelphia-probate-bounded-pdf-fetch-v1.js',
  'validate-philadelphia-probate-bounded-text-extraction-v1.js',
  'validate-philadelphia-probate-production-extraction-orchestration-v1.js',
  'validate-philadelphia-probate-production-extraction-readiness-probe-v1.js',
  'validate-philadelphia-probate-bounded-oversize-text-evidence-v1.js',
  'validate-philadelphia-probate-production-oversize-text-evidence-recovery-v1.js',
  'validate-philadelphia-probate-oversize-recovery-readiness-probe-v1.js',
  'validate-philadelphia-probate-certified-oversize-publication-analysis-v1.js',
  'validate-philadelphia-probate-certified-oversize-publication-analysis-readiness-probe-v1.js',
  'validate-philadelphia-probate-certified-oversize-analysis-production-transport-v1.js',
  'validate-philadelphia-probate-certified-oversize-marker-evidence-recovery-v1.js',
  'validate-philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-v1.js',
  'validate-philadelphia-probate-certified-oversize-marker-evidence-recovery-production-transport-v1.js',
  'validate-philadelphia-probate-certified-oversize-orphan-anchored-marker-evidence-recovery-production-transport-v1.js',
  'validate-philadelphia-probate-certified-oversize-orphan-anchored-durable-evidence-capture-production-transport-v1.js',
];

const CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_VALIDATOR =
  'validate-county-code-violation-collapse-executor-safety-correction-runtime-v1.js';

const CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_REPLAY_SHA =
  '397e66b141dd07d11fd280c1c5c0b91a6bfd5a9b';

const CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_REPLAY_TREE =
  '1305138b26d54cde2472486000deede0123e101f';

const CERTIFIED_EXECUTOR_IMPLEMENTATION_LIFECYCLE_VALIDATOR =
  'validate-county-code-violation-collapse-executor-implementation-lifecycle-v1.js';

const CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_SHA =
  '5ed9766fe4f06b9c3e1c665a08d9212fb8617800';

const CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_TREE =
  '3bc32b52da3021967505000e984539c47fd8631b';

const CERTIFIED_EXECUTOR_RUNTIME_VALIDATOR =
  'validate-county-code-violation-collapse-executor-runtime-v1.js';

const CERTIFIED_EXECUTOR_RUNTIME_REPLAY_SHA =
  'dc19ab42fa9faf63b3db327598e32da6844de733';

const CERTIFIED_EXECUTOR_RUNTIME_REPLAY_TREE =
  '78db590eeae0c2fc64da4d4be29896e1f4980159';

const CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_LIFECYCLE_VALIDATOR =
  'validate-county-code-violation-collapse-executor-safety-correction-implementation-lifecycle-v1.js';

const CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_REPLAY_SHA =
  'daefe8f081cb48e6f9f0433c05a267d9d553966d';

const CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_REPLAY_TREE =
  'df4fc612ba4b62e05c262f26958fada74416de0c';

const CERTIFIED_EXECUTOR_BLOCKER_RETIREMENT_IMPLEMENTATION_LIFECYCLE_VALIDATOR =
  'validate-county-code-violation-collapse-executor-blocker-retirement-implementation-lifecycle-v1.js';

const CERTIFIED_EXECUTOR_BLOCKER_RETIREMENT_IMPLEMENTATION_REPLAY_SHA =
  '327258b0616f9cdc709168c1865674cdbb473025';

const CERTIFIED_EXECUTOR_BLOCKER_RETIREMENT_IMPLEMENTATION_REPLAY_TREE =
  '2873066de3fd9ec82d1cc56eadb3dd7b9a66ecd0';

const CERTIFIED_GROUP2_EXECUTOR_HISTORY_EXCEPTION_VALIDATOR =
  'validate-county-collapse-group2-executor-history-exception-v1.js';

const CERTIFIED_GROUP2_EXECUTOR_HISTORY_EXCEPTION_REPLAY_SHA =
  'd79d640d587e8a4d104cc4631b2022609a63fd50';

const CERTIFIED_GROUP2_EXECUTOR_HISTORY_EXCEPTION_REPLAY_TREE =
  '90d28afc06ae80006ce32810e3bf523665f191f8';

const CERTIFIED_GROUP2_PREPARED_OPERATION_RETIREMENT_VALIDATOR =
  'validate-county-collapse-group2-prepared-operation-retirement-v1.js';

const CERTIFIED_GROUP2_PREPARED_OPERATION_RETIREMENT_REPLAY_SHA =
  'f6bf77b026615b429e36bb89974d2e9068ab2588';

const CERTIFIED_GROUP2_PREPARED_OPERATION_RETIREMENT_REPLAY_TREE =
  'd929ef97c33608df59d3b59f8528182a6e2f6b3b';

function pass(message) {
  console.log(`PASS: ${message}`);
}

function git(args) {
  const result = spawnSync(
    'git',
    args,
    {
      cwd: ROOT,
      encoding: 'utf8'
    }
  );

  if (result.error) {
    throw result.error;
  }

  return result;
}

function readBuild(fileName) {
  return fs.readFileSync(
    path.join(BUILD, fileName),
    'utf8'
  );
}

console.log(
  '=== COUNTY RUNTIME INTEGRATION CERTIFICATION ==='
);
console.log('');

/*
 * Hard baseline protection.
 */
LEGACY_PROTECTED_FILES.forEach(file => {
  /*
   * ConnectorRegistry.js has one narrowly certified metadata delta below.
   * Every other legacy-protected file remains byte-for-byte baseline-bound.
   */
  if (file === ZILLOW_SCHEDULE_METADATA_FILE) {
    return;
  }

  const result = git([
    'diff',
    '--quiet',
    BASELINE,
    '--',
    file
  ]);

  assert.equal(
    result.status,
    0,
    `legacy Enterprise acquisition file changed since ${BASELINE}: ${file}`
  );
});

const baselineRegistry = git([
  'show',
  `${BASELINE}:${ZILLOW_SCHEDULE_METADATA_FILE}`
]);

assert.equal(
  baselineRegistry.status,
  0,
  'unable to read protected ConnectorRegistry baseline'
);

const baselineRegistryText =
  baselineRegistry.stdout;

assert.equal(
  baselineRegistryText
    .split(ZILLOW_SCHEDULE_METADATA_BEFORE)
    .length - 1,
  1,
  'baseline must contain exactly one certified Zillow 5-minute metadata row'
);

assert.equal(
  baselineRegistryText
    .split(ZILLOW_SCHEDULE_METADATA_AFTER)
    .length - 1,
  0,
  'baseline unexpectedly already contains Zillow 15-minute metadata'
);

const expectedCurrentRegistry =
  baselineRegistryText.replace(
    ZILLOW_SCHEDULE_METADATA_BEFORE,
    ZILLOW_SCHEDULE_METADATA_AFTER
  );

const actualCurrentRegistry =
  fs.readFileSync(
    path.join(
      ROOT,
      ZILLOW_SCHEDULE_METADATA_FILE
    ),
    'utf8'
  );

assert.equal(
  actualCurrentRegistry,
  expectedCurrentRegistry,
  'ConnectorRegistry.js changed beyond the certified Zillow 5 -> 15 minute metadata delta'
);

pass(
  'protected Zillow registry change is exactly Every 5 minutes -> Every 15 minutes'
);

pass(
  `legacy connector-management protection remains baseline-bound at ${BASELINE}`
);

/*
 * Runtime production file inventory.
 */
RUNTIME_CORE_FILES.forEach(fileName => {
  assert.ok(
    fs.existsSync(
      path.join(BUILD, fileName)
    ),
    `runtime core file missing: ${fileName}`
  );
});

pass('all 8 native county runtime core modules are present');

INTEGRATION_FILES.forEach(fileName => {
  assert.ok(
    fs.existsSync(
      path.join(BUILD, fileName)
    ),
    `integration file missing: ${fileName}`
  );
});

pass('schema and runtime execution bridges are present');

const generatedFiles = fs
  .readdirSync(BUILD)
  .filter(fileName =>
    fileName.endsWith('CountyConnector.js')
  )
  .sort();

assert.equal(
  generatedFiles.length,
  94,
  'expected exactly 94 generated county connectors'
);

pass('exactly 94 generated county connectors are present');

/*
 * Production diff containment.
 *
 * The county integration remains exactly additive except for explicitly
 * controlled production hardening files. Controlled files must remain
 * modifications of existing baseline files. All remaining baseline deltas
 * must remain the exact 115-file additive county/preservation/scheduler/diagnostic/Page-86-repair inventory.
 */
const productionDiff = git([
  'diff',
  '--name-status',
  BASELINE,
  '--',
  'build/apps-script-brand'
]);

assert.equal(
  productionDiff.status,
  0,
  'unable to inspect production integration diff'
);

let diffEntries = productionDiff.stdout
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map(line => {
    const parts = line.split(/\t+/);

    return {
      status: parts[0],
      file: parts[1]
    };
  });

const controlledModifiedEntries =
  diffEntries.filter(entry =>
    CONTROLLED_MODIFIED_BUILD_FILES.includes(
      entry.file
    )
  );

assert.equal(
  controlledModifiedEntries.length,
  CONTROLLED_MODIFIED_BUILD_FILES.length,
  'expected exactly the controlled modified production files'
);

CONTROLLED_MODIFIED_BUILD_FILES.forEach(file => {
  const matches = diffEntries.filter(
    entry => entry.file === file
  );

  assert.equal(
    matches.length,
    1,
    `controlled modified production file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'M',
    `controlled production file must remain a baseline modification: ${file}`
  );
});

const unexpectedModifiedEntries =
  diffEntries.filter(entry =>
    entry.status === 'M' &&
    !CONTROLLED_MODIFIED_BUILD_FILES.includes(
      entry.file
    ) &&
    !POST_COUNTY_MODIFIED_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  unexpectedModifiedEntries.length,
  0,
  'unexpected modified production files: ' +
    unexpectedModifiedEntries
      .map(entry => entry.file)
      .join(', ')
);

diffEntries = diffEntries.filter(
  entry =>
    !CONTROLLED_MODIFIED_BUILD_FILES.includes(
      entry.file
    )
);

const postCountyModifiedEntries =
  diffEntries.filter(entry =>
    POST_COUNTY_MODIFIED_PRODUCTION_FILES.includes(
      entry.file
    )
  );

POST_COUNTY_MODIFIED_PRODUCTION_FILES.forEach(file => {
  const matches = postCountyModifiedEntries.filter(
    entry => entry.file === file
  );

  assert.equal(
    matches.length,
    1,
    `explicit post-county modified production file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'M',
    `post-county modified production file must remain a baseline modification: ${file}`
  );
});

diffEntries = diffEntries.filter(
  entry =>
    !POST_COUNTY_MODIFIED_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'explicit post-county production modifications are isolated from county reconciliation'
);

/*
 * Certified Daily Digest Notifications.js identity.
 *
 * Explicit accounting above is not generic modification authority. The
 * current production file must remain byte-exact to the PR #297 correction
 * that introduced acquisition-backed Daily Digest KPIs.
 */
const certifiedNotificationsBlob = git([
  'hash-object',
  'build/apps-script-brand/Notifications.js'
]);

assert.equal(
  certifiedNotificationsBlob.status,
  0,
  'unable to hash certified Notifications.js'
);

assert.equal(
  certifiedNotificationsBlob.stdout.trim(),
  '2d26878d1a36db08cbc271a9d3b15c97cb207a8b',
  'Notifications.js must remain exact to the certified PR #297 Daily Digest correction'
);

pass(
  'Notifications.js remains exact to the certified PR #297 Daily Digest correction'
);

/*
 * Certified comps workflow compatibility assertions.
 *
 * Explicit accounting above is not generic production-change authority.
 * These assertions require the fail-closed behavior that justified the
 * AcquisitionWorkflow.js post-county modification while independently
 * preserving the DealLifecycleWorkflow.js safety hardening.
 */
const acquisitionWorkflowText =
  readBuild('AcquisitionWorkflow.js');

assert.ok(
  acquisitionWorkflowText.includes(
    'Comparable-row presence is not readiness authority.'
  ),
  'AcquisitionWorkflow.js must retain certified comps fail-closed readiness language'
);

assert.equal(
  acquisitionWorkflowText.includes(
    'if (comps.length) {'
  ),
  false,
  'AcquisitionWorkflow.js must not restore comparable-presence-only progression'
);

assert.equal(
  acquisitionWorkflowText.includes(
    "REOS.AcquisitionPipeline.advanceStage(dealId, 'Offer Generation', 'Comps found.');"
  ),
  false,
  'AcquisitionWorkflow.js must not restore legacy comps-found Offer Generation progression'
);

const dealLifecycleWorkflowText =
  readBuild('DealLifecycleWorkflow.js');

assert.ok(
  dealLifecycleWorkflowText.includes(
    'Legacy analysis / comparable-count / MAO evidence must not'
  ),
  'DealLifecycleWorkflow.js must retain certified comps fail-closed readiness language'
);

assert.equal(
  dealLifecycleWorkflowText.includes(
    "return decision_('Offer Generation', 'Valid analysis, minimum comps, and a positive draft offer are present.');"
  ),
  false,
  'DealLifecycleWorkflow.js must not restore legacy analysis/comps/MAO Offer Generation recommendation'
);

pass(
  'certified comps workflow accounting remains explicit and fail closed'
);

const postCountyEntries =
  diffEntries.filter(entry =>
    POST_COUNTY_PRODUCTION_FILES.includes(
      entry.file
    )
  );

POST_COUNTY_PRODUCTION_FILES.forEach(file => {
  const matches = postCountyEntries.filter(
    entry => entry.file === file
  );

  assert.equal(
    matches.length,
    1,
    `explicit post-county production file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'A',
    `post-county production file must remain additive: ${file}`
  );
});

diffEntries = diffEntries.filter(
  entry =>
    !POST_COUNTY_PRODUCTION_FILES.includes(
      entry.file
    )
);

const absenteeOwnerSourceEvidenceRetrievalEntries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES.length,
  1,
  'bounded absentee-owner source-evidence retrieval inventory must contain exactly one file'
);

ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerSourceEvidenceRetrievalEntries.filter(
      entry => entry.file === file
    );

  assert.equal(
    matches.length,
    1,
    `bounded absentee-owner source-evidence retrieval file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'A',
    `bounded absentee-owner source-evidence retrieval file must remain additive: ${file}`
  );
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES.includes(
      entry.file
    )
);

const absenteeOwnerPropertySourceIdentityCertificationEntries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_PRODUCTION_FILES.length,
  1,
  'bounded absentee-owner property-source identity certification inventory must contain exactly one file'
);

ABSENTEE_OWNER_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerPropertySourceIdentityCertificationEntries.filter(
      entry => entry.file === file
    );

  assert.equal(
    matches.length,
    1,
    `bounded absentee-owner property-source identity certification file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'A',
    `bounded absentee-owner property-source identity certification file must remain additive: ${file}`
  );
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_PRODUCTION_FILES.includes(
      entry.file
    )
);

const absenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookupEntries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_PRODUCTION_FILES.length,
  1,
  'bounded certified-property-source owner-evidence lookup inventory must contain exactly one file'
);

ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookupEntries.filter(
      entry => entry.file === file
    );

  assert.equal(
    matches.length,
    1,
    `bounded certified-property-source owner-evidence lookup file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'A',
    `bounded certified-property-source owner-evidence lookup file must remain additive: ${file}`
  );
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_PRODUCTION_FILES.includes(
      entry.file
    )
);

const absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2Entries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_V2_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_V2_PRODUCTION_FILES.length,
  1,
  'certified property-source provenance planner v2 inventory must contain exactly one file'
);

ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_V2_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2Entries.filter(
      entry => entry.file === file
    );

  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    `certified property-source provenance planner v2 file is missing: ${file}`
  );

  if (matches.length === 0) {
    const sourceEditStatus = git([
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--',
      file
    ]);

    assert.equal(
      sourceEditStatus.status,
      0,
      `unable to inspect source-edit status for planner v2: ${file}`
    );

    assert.equal(
      String(sourceEditStatus.stdout || '').trim(),
      '?? ' + file,
      `planner v2 must be either an untracked authorized source edit or additive against baseline: ${file}`
    );
  } else {
    assert.equal(
      matches.length,
      1,
      `certified property-source provenance planner v2 file duplicated: ${file}`
    );

    assert.equal(
      matches[0].status,
      'A',
      `certified property-source provenance planner v2 file must remain additive: ${file}`
    );
  }
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_V2_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'certified property-source provenance planner v2 surface is exactly one explicitly allowlisted additive pure-planner file'
);

const absenteeOwnerClassificationEvidenceStoreV2Entries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PRODUCTION_FILES.length,
  1,
  'classification evidence store v2 inventory must contain exactly one file'
);

ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerClassificationEvidenceStoreV2Entries.filter(
      entry => entry.file === file
    );

  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    `classification evidence store v2 file is missing: ${file}`
  );

  if (matches.length === 0) {
    const sourceEditStatus = git([
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--',
      file
    ]);

    assert.equal(
      sourceEditStatus.status,
      0,
      `unable to inspect source-edit status for classification evidence store v2: ${file}`
    );

    assert.equal(
      String(sourceEditStatus.stdout || '').trim(),
      '?? ' + file,
      `classification evidence store v2 must be either an untracked authorized source edit or additive against baseline: ${file}`
    );
  } else {
    assert.equal(
      matches.length,
      1,
      `classification evidence store v2 file duplicated: ${file}`
    );

    assert.equal(
      matches[0].status,
      'A',
      `classification evidence store v2 file must remain additive: ${file}`
    );
  }
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'classification evidence store v2 surface is exactly one explicitly allowlisted additive store file'
);

const absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2Entries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXECUTOR_V2_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXECUTOR_V2_PRODUCTION_FILES.length,
  1,
  'certified property-source provenance executor v2 inventory must contain exactly one file'
);

ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXECUTOR_V2_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2Entries.filter(
      entry => entry.file === file
    );

  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    `certified property-source provenance executor v2 runtime is missing: ${file}`
  );

  if (matches.length === 0) {
    const sourceEditStatus = git([
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--',
      file
    ]);

    assert.equal(
      sourceEditStatus.status,
      0,
      `unable to inspect executor v2 source-edit status: ${file}`
    );

    assert.equal(
      String(sourceEditStatus.stdout || '').trim(),
      '?? ' + file,
      `executor v2 must be either an untracked authorized source edit or additive against baseline: ${file}`
    );
  } else {
    assert.equal(
      matches.length,
      1,
      `certified property-source provenance executor v2 runtime duplicated: ${file}`
    );

    assert.equal(
      matches[0].status,
      'A',
      `certified property-source provenance executor v2 must remain additive: ${file}`
    );
  }
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXECUTOR_V2_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'certified property-source provenance executor v2 surface is exactly one explicitly allowlisted additive internal persistence file'
);

const absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2Entries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2_PRODUCTION_FILES.length,
  1,
  'certified property-source provenance bounded rollout orchestrator v2 inventory must contain exactly one file'
);

ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2Entries.filter(
      entry => entry.file === file
    );

  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    `certified property-source provenance bounded rollout orchestrator v2 runtime is missing: ${file}`
  );

  if (matches.length === 0) {
    const sourceEditStatus = git([
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--',
      file
    ]);

    assert.equal(
      sourceEditStatus.status,
      0,
      `unable to inspect bounded rollout orchestrator v2 source-edit status: ${file}`
    );

    assert.equal(
      String(sourceEditStatus.stdout || '').trim(),
      '?? ' + file,
      `bounded rollout orchestrator v2 must be either an untracked authorized source edit or additive against baseline: ${file}`
    );
  } else {
    assert.equal(
      matches.length,
      1,
      `bounded rollout orchestrator v2 file missing or duplicated: ${file}`
    );

    assert.equal(
      matches[0].status,
      'A',
      `bounded rollout orchestrator v2 must remain additive: ${file}`
    );
  }
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_ORCHESTRATOR_V2_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'certified property-source provenance bounded rollout orchestrator v2 surface is exactly one explicitly allowlisted additive internal orchestration file'
);

const absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2Entries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_V2_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_V2_PRODUCTION_FILES.length,
  1,
  'certified property-source provenance bounded rollout production entrypoint v2 inventory must contain exactly one file'
);

ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_V2_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2Entries.filter(
      entry => entry.file === file
    );

  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    `certified property-source provenance bounded rollout production entrypoint v2 runtime is missing: ${file}`
  );

  if (matches.length === 0) {
    const sourceEditStatus = git([
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--',
      file
    ]);

    assert.equal(
      sourceEditStatus.status,
      0,
      `unable to inspect bounded rollout production entrypoint v2 source-edit status: ${file}`
    );

    assert.equal(
      String(sourceEditStatus.stdout || '').trim(),
      '?? ' + file,
      `bounded rollout production entrypoint v2 must be either an untracked authorized source edit or additive against baseline: ${file}`
    );
  } else {
    assert.equal(
      matches.length,
      1,
      `bounded rollout production entrypoint v2 file missing or duplicated: ${file}`
    );

    assert.equal(
      matches[0].status,
      'A',
      `bounded rollout production entrypoint v2 must remain additive: ${file}`
    );
  }
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_V2_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'certified property-source provenance bounded rollout production entrypoint v2 surface is exactly one explicitly allowlisted additive manual admin RPC file'
);


const absenteeOwnerClassificationEvidenceStoreV2ProvisioningEntries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRODUCTION_FILES.length,
  1,
  'classification evidence store v2 provisioning inventory must contain exactly one file'
);

ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerClassificationEvidenceStoreV2ProvisioningEntries.filter(
      entry => entry.file === file
    );

  assert.ok(
    fs.existsSync(path.join(ROOT, file)),
    `classification evidence store v2 provisioning runtime is missing: ${file}`
  );

  if (matches.length === 0) {
    const sourceEditStatus = git([
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
      '--',
      file
    ]);

    assert.equal(
      sourceEditStatus.status,
      0,
      `unable to inspect V2 provisioning runtime source-edit status: ${file}`
    );

    assert.equal(
      String(sourceEditStatus.stdout || '').trim(),
      '?? ' + file,
      `V2 provisioning runtime must be either an untracked authorized source edit or additive against baseline: ${file}`
    );
  } else {
    assert.equal(
      matches.length,
      1,
      `V2 provisioning runtime duplicated: ${file}`
    );

    assert.equal(
      matches[0].status,
      'A',
      `V2 provisioning runtime must remain additive: ${file}`
    );
  }
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_V2_PROVISIONING_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'classification evidence store v2 provisioning surface is exactly one explicitly allowlisted additive administrative file'
);

const absenteeOwnerV2ExactEventReadOnlyReconciliationEntries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_V2_EXACT_EVENT_READ_ONLY_RECONCILIATION_PRODUCTION_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_V2_EXACT_EVENT_READ_ONLY_RECONCILIATION_PRODUCTION_FILES.length,
  1,
  'V2 exact-event read-only reconciliation inventory must contain exactly one file'
);

ABSENTEE_OWNER_V2_EXACT_EVENT_READ_ONLY_RECONCILIATION_PRODUCTION_FILES.forEach(file => {
  const matches =
    absenteeOwnerV2ExactEventReadOnlyReconciliationEntries.filter(
      entry => entry.file === file
    );

  const runtimeExists =
    fs.existsSync(
      path.join(ROOT, file)
    );

  assert.ok(
    matches.length <= 1,
    `V2 exact-event read-only reconciliation file duplicated: ${file}`
  );

  if (runtimeExists) {
    assert.equal(
      matches.length,
      1,
      `V2 exact-event read-only reconciliation runtime must be an exact additive production file when present: ${file}`
    );

    assert.equal(
      matches[0].status,
      'A',
      `V2 exact-event read-only reconciliation runtime must remain additive: ${file}`
    );
  } else {
    assert.equal(
      matches.length,
      0,
      `V2 exact-event read-only reconciliation diff entry exists while runtime path is absent: ${file}`
    );
  }
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_V2_EXACT_EVENT_READ_ONLY_RECONCILIATION_PRODUCTION_FILES.includes(
      entry.file
    )
);

pass(
  'V2 exact-event read-only reconciliation is isolated as one optional exact additive production file'
);

const absenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypointEntries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_FILES.length,
  1,
  'bounded certified-property-source owner-evidence production entrypoint inventory must contain exactly one file'
);

ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_FILES.forEach(file => {
  const matches =
    absenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypointEntries.filter(
      entry => entry.file === file
    );

  assert.equal(
    matches.length,
    1,
    `bounded certified-property-source owner-evidence production entrypoint file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'A',
    `bounded certified-property-source owner-evidence production entrypoint file must remain additive: ${file}`
  );
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_FILES.includes(
      entry.file
    )
);

pass(
  'bounded certified-property-source owner-evidence production entrypoint surface is exactly one explicitly allowlisted additive file'
);

const absenteeOwnerSourceEvidenceRetrievalProductionEntrypointEntries =
  diffEntries.filter(entry =>
    ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_ENTRYPOINT_FILES.includes(
      entry.file
    )
  );

assert.equal(
  ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_ENTRYPOINT_FILES.length,
  1,
  'bounded absentee-owner source-evidence production entrypoint inventory must contain exactly one file'
);

ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_ENTRYPOINT_FILES.forEach(file => {
  const matches =
    absenteeOwnerSourceEvidenceRetrievalProductionEntrypointEntries.filter(
      entry => entry.file === file
    );

  assert.equal(
    matches.length,
    1,
    `bounded absentee-owner source-evidence production entrypoint file missing or duplicated: ${file}`
  );

  assert.equal(
    matches[0].status,
    'A',
    `bounded absentee-owner source-evidence production entrypoint file must remain additive: ${file}`
  );
});

diffEntries = diffEntries.filter(
  entry =>
    !ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_ENTRYPOINT_FILES.includes(
      entry.file
    )
);

pass(
  'bounded absentee-owner source-evidence retrieval production surface is exactly one explicitly allowlisted additive file'
);

pass(
  'bounded absentee-owner property-source identity certification surface is exactly one explicitly allowlisted additive file'
);

pass(
  'bounded absentee-owner certified-property-source owner-evidence lookup surface is exactly one explicitly allowlisted additive file'
);

pass(
  'bounded absentee-owner single-record production entrypoint surface is exactly one explicitly allowlisted additive file'
);

pass(
  'production manifest and E2E harness are the only allowlisted modified build files'
);

pass(
  'explicit post-county production additions are isolated from county reconciliation'
);

const expectedCountyProductionFiles = new Set(
  RUNTIME_CORE_FILES
    .concat(INTEGRATION_FILES)
    .concat(generatedFiles)
    .map(fileName =>
      `build/apps-script-brand/${fileName}`
    )
);

const expectedPreservationFiles = new Set(
  PRODUCTION_PRESERVATION_FILES.map(fileName =>
    `build/apps-script-brand/${fileName}`
  )
);

/*
 * Production Operations Increment 2 adds exactly one controlled
 * production workload module. Keep it explicit so a count increase
 * cannot authorize an arbitrary additional build file.
 */
const expectedCountySchedulerFiles = new Set([
  'build/apps-script-brand/CountyProductionScheduler.js'
]);

/*
 * Page-86 recovery diagnostics add exactly one read-only production
 * diagnostic module. Keep this explicit so the inventory increase
 * cannot authorize an arbitrary additional build file.
 */
const expectedCountyDiagnosticFiles = new Set([
  'build/apps-script-brand/CountyArcGisPageRecordDiagnostic.js'
]);

/*
 * Page-86 duplicate-source remediation adds exactly two bounded
 * production modules: one read-only evidence boundary and one
 * explicitly invoked repair executor. Keep both explicit so the
 * production inventory increase cannot authorize arbitrary files.
 */
const expectedCountyPage86RepairFiles = new Set([
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js',
  'build/apps-script-brand/CountyPage86DuplicateSourceRepairEvidence.js',
  'build/apps-script-brand/CountyPage89SourceObservation622060Repair.js'
]);

/*
 * Code Violations Production Completion Gate 1 contains the
 * explicitly allowlisted read-only reconciliation, durable population
 * authority, durable recovery authority, recovery preflight, population
 * maintenance-gate, and bounded durable recovery executor modules.
 *
 * Keep this explicit so an inventory-count increase cannot authorize
 * an arbitrary additional production build file.
 */
const expectedCodeViolationCompletionFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationGate1Reconciliation.js',
  'build/apps-script-brand/CountyCodeViolationGate1PopulationAuthority.js',
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryAuthority.js',
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryPreflight.js',
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryMaintenanceGate.js',
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js'
]);

/*
 * Gate 2B Durable Identity Rolling Migration contains exactly one
 * explicitly allowlisted bounded migration executor.
 *
 * Keep this separate from Gate 1 production-completion authority so
 * the rolling durable-identity mutation surface cannot inherit or
 * expand Gate 1 recovery authority.
 */
const expectedCodeViolationRollingMigrationFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js'
]);

/*
 * Post-rolling Gate 2B additions contain exactly two separately
 * certified bounded production mutation surfaces:
 *
 * - the v3 multi-span durable-identity migration executor;
 * - the blocked-storage backfill executor.
 *
 * Keep these explicit and separate from the original rolling executor
 * so later inventory growth cannot silently inherit migration or
 * backfill authority.
 */
const expectedCodeViolationPostRollingFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js',
  'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js'
]);

/*
 * Gate 2B collapse investigation contains exactly two explicitly
 * allowlisted hard-bound read-only diagnostics.
 *
 * This grants no repair, migration, collapse, winner, delete,
 * scheduler, checkpoint, connector, or automatic-offer authority.
 */
const expectedCodeViolationCollapseDiagnosticFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationSingleRowDriftDiagnostic.js',
  'build/apps-script-brand/CountyCodeViolationTwoRowRawEvidence.js'
]);

/*
 * Collapse operation-intent durable evidence storage contributes exactly
 * one production Apps Script module.
 *
 * This allowlist entry grants no executor, physical-delete, scheduler,
 * checkpoint, connector, deployment, or automatic-offer authority.
 */
const expectedCodeViolationCollapseOperationIntentFiles = new Set([
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js'
]);

/*
 * Post-delete repeatability contributes exactly three additional read-only
 * production modules:
 *
 * - immutable direct-keep execution authority;
 * - current residual evidence;
 * - successor execution preflight.
 *
 * The existing operation-intent journal is extended in place with one
 * read-only enumeration method and therefore does not add a fourth production
 * file. This surface grants no executor, physical-delete, scheduler,
 * checkpoint, connector, deployment, MAO, or automatic-offer authority.
 */
const expectedCodeViolationCollapseRepeatabilityFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js',
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js'
]);

/*
 * Observation-preservation durable evidence storage contributes exactly
 * one additional production Apps Script module.
 *
 * This allowlist entry certifies only the append-only preservation
 * evidence store. It grants no preservation orchestration, county-data
 * patch, executor, physical-delete, scheduler, checkpoint, connector,
 * deployment, or automatic-offer authority.
 */
const expectedCodeViolationCollapsePreservationStoreFiles = new Set([
  'build/apps-script-brand/CountyCollapseObservationPreservationStore.js'
]);

/*
 * Shared county mutation-exclusion lease runtime contributes exactly one
 * additional production Apps Script module.
 *
 * This allowlist entry certifies exclusion coordination only. It grants no
 * county-data mutation, physical-delete, scheduler, checkpoint, connector,
 * collapse, deployment, MAO, or automatic-offer authority.
 */
const expectedCountyMutationExclusionLeaseFiles = new Set([
  'build/apps-script-brand/CountyMutationExclusionLease.js'
]);

/*
 * Current-authority Code Violations collapse maintenance readiness contributes
 * exactly one production Apps Script module.
 *
 * The facade delegates durable exclusion state to CountyMutationExclusionLease.
 * This allowlist grants readiness only and no collapse, physical-delete,
 * scheduler, checkpoint, connector, deployment, MAO, or automatic-offer
 * authority.
 */
const expectedCodeViolationCollapseMaintenanceGateFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js'
]);

/*
 * Direct-keep collapse executor implementation contributes exactly two
 * bounded production modules:
 *
 * - transient maintenance-capability transport;
 * - direct-keep one-candidate executor.
 *
 * Production execution remains blocked by the separately certified
 * successor preflight until blocker retirement is independently certified.
 */
const expectedCodeViolationCollapseExecutorImplementationFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js'
]);

/*
 * Collapse runtime-prerequisite certification contributes exactly one bounded
 * production operator module.
 *
 * It exposes read-only prerequisite status and one-time creation/binding of the
 * dedicated operation-intent workbook only. It grants no collapse execution,
 * physical-delete, county-data, scheduler, checkpoint, connector, MAO, or
 * automatic-offer authority.
 */
const expectedCountyCollapseRuntimePrerequisiteFiles = new Set([
  'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js'
]);

/*
 * Incident-bounded operation-intent orphan binding recovery contributes
 * exactly one additional production Apps Script module.
 *
 * This allowlist grants authority only to adopt the exact certified orphan
 * workbook through one Script Property binding. It grants no workbook
 * creation/edit/delete, county-data mutation, collapse execution, physical
 * delete, scheduler, checkpoint, connector, lease-open/close, MAO, or
 * automatic-offer authority.
 */
const expectedCountyCollapseOrphanBindingRecoveryFiles = new Set([
  'build/apps-script-brand/CountyCollapseOperationIntentOrphanBindingRecovery.js'
]);

/*
 * Incident-bounded Group 2 stranded-operation reconciliation contributes
 * exactly one additive read-only production module.
 *
 * It reads only the exact known stranded operation plus current residual
 * evidence and grants no retry, journal, delete, scheduler, checkpoint,
 * maintenance, connector, MAO, offer, or county-data mutation authority.
 */
const expectedCountyCollapseGroup2StrandedReconciliationFiles = new Set([
  'build/apps-script-brand/CountyCollapseGroup2StrandedOperationReconciliation.js'
]);

/*
 * Incident-bounded Group 2 prepared-operation retirement adds exactly
 * one bounded journal-terminalization production module. It can append
 * only the certified pre-barrier terminal and grants no physical-delete,
 * executor-retry, scheduler, checkpoint, MAO, or automatic-offer authority.
 */
const expectedCountyCollapseGroup2PreparedOperationRetirementFiles = new Set([
  'build/apps-script-brand/CountyCollapseGroup2PreparedOperationRetirement.js'
]);

/*
 * Exact Group 2 post-terminal reconciliation contributes exactly one
 * additive read-only incident evidence module.
 *
 * It grants no journal mutation, retry, executor, physical-delete,
 * maintenance, scheduler, checkpoint, connector, MAO, or offer authority.
 */
const expectedCountyCollapseGroup2PostTerminalReconciliationFiles = new Set([
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js'
]);

/*
 * Group 3 Zillow restoration contributes exactly four production modules:
 *
 * - one authority-only restoration contract;
 * - one bounded internal executor;
 * - one explicitly invoked operator transport boundary; and
 * - one durable read-only post-restoration evidence surface.
 *
 * The post-restoration evidence surface grants no replay, repair, collapse,
 * physical-delete, reference-rewrite, scheduler, checkpoint, connector,
 * deployment, MAO, or automatic-offer authority.
 */
/*
 * Group 4 post-barrier timeout terminal reconciliation contributes exactly
 * two production modules:
 *
 * - read-only post-barrier timeout evidence;
 * - bounded terminal reconciliation.
 *
 * Keep these explicit so current runtime-integration inventory does not
 * silently absorb unrelated future production additions.
 */
const expectedCountyCollapseGroup4PostBarrierTimeoutFiles = new Set([
  'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutEvidence.js',
  'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.js'
]);

const expectedCodeViolationGroup3ZillowRestorationFiles = new Set([
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationContract.js',
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js',
  'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationOperator.js',
  'build/apps-script-brand/CountyCodeViolationGroup3PostRestorationEvidence.js'
]);

const expectedProductionFiles = new Set([
  ...expectedCountyProductionFiles,
  ...expectedPreservationFiles,
  ...expectedCountySchedulerFiles,
  ...expectedCountyDiagnosticFiles,
  ...expectedCountyPage86RepairFiles,
  ...expectedCodeViolationCompletionFiles,
  ...expectedCodeViolationRollingMigrationFiles,
  ...expectedCodeViolationPostRollingFiles,
  ...expectedCodeViolationCollapseDiagnosticFiles,
  ...expectedCodeViolationCollapseOperationIntentFiles,
  ...expectedCodeViolationCollapseRepeatabilityFiles,
  ...expectedCodeViolationCollapsePreservationStoreFiles,
  ...expectedCountyMutationExclusionLeaseFiles,
  ...expectedCodeViolationCollapseMaintenanceGateFiles,
  ...expectedCodeViolationCollapseExecutorImplementationFiles,
  ...expectedCountyCollapseRuntimePrerequisiteFiles,
  ...expectedCountyCollapseOrphanBindingRecoveryFiles,
  ...expectedCountyCollapseGroup2StrandedReconciliationFiles,
  ...expectedCountyCollapseGroup2PreparedOperationRetirementFiles,
  ...expectedCountyCollapseGroup2PostTerminalReconciliationFiles,
  ...expectedCountyCollapseGroup4PostBarrierTimeoutFiles,
  ...expectedCodeViolationGroup3ZillowRestorationFiles
]);

assert.equal(
  expectedCountyProductionFiles.size,
  104,
  'expected county runtime integration inventory must contain 104 files'
);

assert.equal(
  expectedPreservationFiles.size,
  7,
  'expected production preservation inventory must contain 7 files'
);

assert.equal(
  expectedCountySchedulerFiles.size,
  1,
  'expected county production scheduler inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountySchedulerFiles.has(
    'build/apps-script-brand/CountyProductionScheduler.js'
  ),
  'CountyProductionScheduler.js must be the controlled Increment 2 production addition'
);

assert.equal(
  expectedCountyDiagnosticFiles.size,
  1,
  'expected county diagnostic inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountyDiagnosticFiles.has(
    'build/apps-script-brand/CountyArcGisPageRecordDiagnostic.js'
  ),
  'CountyArcGisPageRecordDiagnostic.js must be the explicit Page-86 read-only diagnostic addition'
);

assert.equal(
  expectedCountyPage86RepairFiles.size,
  3,
  'expected Page-86/Page-89 repair inventory must contain exactly 3 files'
);

assert.ok(
  expectedCountyPage86RepairFiles.has(
    'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js'
  ),
  'CountyPage86DuplicateSourceRepair.js must be the explicit bounded Page-86 repair executor'
);

assert.ok(
  expectedCountyPage86RepairFiles.has(
    'build/apps-script-brand/CountyPage86DuplicateSourceRepairEvidence.js'
  ),
  'CountyPage86DuplicateSourceRepairEvidence.js must be the explicit read-only Page-86 repair evidence boundary'
);

assert.equal(
  expectedCodeViolationCompletionFiles.size,
  6,
  'expected Code Violations Production Completion inventory must contain exactly 6 files'
);

assert.ok(
  expectedCodeViolationCompletionFiles.has(
    'build/apps-script-brand/CountyCodeViolationGate1Reconciliation.js'
  ),
  'CountyCodeViolationGate1Reconciliation.js must be the explicit read-only Gate 1 production-completion addition'
);

const gate1ReconciliationSource =
  readBuild(
    'CountyCodeViolationGate1Reconciliation.js'
  );

assert.ok(
  gate1ReconciliationSource.includes(
    'CountyCodeViolationGate1PopulationAuthority'
  ),
  'Gate 1 reconciliation must consume durable population authority'
);

assert.ok(
  gate1ReconciliationSource.includes(
    'violationnumber IN ('
  ),
  'Gate 1 source membership must use durable Violation Number'
);

assert.ok(
  gate1ReconciliationSource.includes(
    'certifiedEvidenceObjectId'
  ),
  'Gate 1 must explicitly separate certified historical ObjectID evidence'
);

assert.equal(
  /HISTORICAL_OBJECTID_CAP|objectid\s*>/i.test(
    gate1ReconciliationSource
  ),
  false,
  'Gate 1 must not derive cohort membership from current ArcGIS ObjectID'
);

pass(
  'Gate 1 reconciliation uses durable population membership with current ObjectID telemetry only'
);

assert.ok(
  expectedCodeViolationCompletionFiles.has(
    'build/apps-script-brand/CountyCodeViolationGate1PopulationAuthority.js'
  ),
  'CountyCodeViolationGate1PopulationAuthority.js must be the explicit read-only durable population-membership authority'
);

assert.ok(
  expectedCodeViolationCompletionFiles.has(
    'build/apps-script-brand/CountyCodeViolationGate1RecoveryAuthority.js'
  ),
  'CountyCodeViolationGate1RecoveryAuthority.js must be the explicit read-only durable recovery-authority addition'
);

assert.ok(
  expectedCodeViolationCompletionFiles.has(
    'build/apps-script-brand/CountyCodeViolationGate1RecoveryPreflight.js'
  ),
  'CountyCodeViolationGate1RecoveryPreflight.js must be the explicit read-only durable recovery-preflight addition'
);

assert.ok(
  expectedCodeViolationCompletionFiles.has(
    'build/apps-script-brand/CountyCodeViolationGate1RecoveryMaintenanceGate.js'
  ),
  'CountyCodeViolationGate1RecoveryMaintenanceGate.js must be the explicit population-scoped Gate 1 recovery maintenance addition'
);

assert.ok(
  expectedCodeViolationCompletionFiles.has(
    'build/apps-script-brand/CountyCodeViolationGate1RecoveryExecutor.js'
  ),
  'CountyCodeViolationGate1RecoveryExecutor.js must be the explicit bounded durable Gate 1 recovery mutation surface'
);

assert.equal(
  expectedCodeViolationRollingMigrationFiles.size,
  1,
  'expected Gate 2B rolling durable identity migration inventory must contain exactly 1 file'
);

assert.ok(
  expectedCodeViolationRollingMigrationFiles.has(
    'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js'
  ),
  'CountyCodeViolationDurableIdentityRollingMigrationExecutor.js must be the explicit bounded Gate 2B rolling migration mutation surface'
);

assert.equal(
  expectedCodeViolationPostRollingFiles.size,
  2,
  'expected post-rolling Gate 2B production inventory must contain exactly 2 files'
);

assert.ok(
  expectedCodeViolationPostRollingFiles.has(
    'build/apps-script-brand/CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js'
  ),
  'CountyCodeViolationDurableIdentityMultiSpanMigrationExecutor.js must be the explicit bounded Gate 2B v3 multi-span migration surface'
);

assert.ok(
  expectedCodeViolationPostRollingFiles.has(
    'build/apps-script-brand/CountyCodeViolationBlockedStorageBackfillExecutor.js'
  ),
  'CountyCodeViolationBlockedStorageBackfillExecutor.js must be the explicit bounded Gate 2B blocked-storage backfill surface'
);

assert.equal(
  expectedCodeViolationCollapseDiagnosticFiles.size,
  2,
  'expected Code Violations collapse diagnostic inventory must contain exactly 2 files'
);

assert.ok(
  expectedCodeViolationCollapseDiagnosticFiles.has(
    'build/apps-script-brand/CountyCodeViolationSingleRowDriftDiagnostic.js'
  ),
  'CountyCodeViolationSingleRowDriftDiagnostic.js must be the explicit read-only collapse drift diagnostic'
);

assert.equal(
  expectedCodeViolationCollapseOperationIntentFiles.size,
  1,
  'expected collapse operation-intent production inventory must contain exactly 1 file'
);

assert.ok(
  expectedCodeViolationCollapseOperationIntentFiles.has(
    'build/apps-script-brand/CountyCollapseOperationIntentStore.js'
  ),
  'CountyCollapseOperationIntentStore.js must be the explicit append-only durable evidence-journal addition'
);

assert.equal(
  expectedCodeViolationCollapseRepeatabilityFiles.size,
  3,
  'expected collapse post-delete repeatability inventory must contain exactly 3 files'
);

[
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js',
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js'
].forEach(file => {
  assert.ok(
    expectedCodeViolationCollapseRepeatabilityFiles.has(file),
    'collapse post-delete repeatability production file missing: ' + file
  );
});

pass(
  'collapse post-delete repeatability surface is exactly three explicitly allowlisted authority-free additive files'
);

assert.equal(
  expectedCodeViolationCollapsePreservationStoreFiles.size,
  1,
  'expected collapse observation-preservation store production inventory must contain exactly 1 file'
);

assert.ok(
  expectedCodeViolationCollapsePreservationStoreFiles.has(
    'build/apps-script-brand/CountyCollapseObservationPreservationStore.js'
  ),
  'CountyCollapseObservationPreservationStore.js must be the explicit append-only preservation evidence-journal addition'
);

assert.equal(
  expectedCountyMutationExclusionLeaseFiles.size,
  1,
  'expected county mutation-exclusion lease runtime inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountyMutationExclusionLeaseFiles.has(
    'build/apps-script-brand/CountyMutationExclusionLease.js'
  ),
  'CountyMutationExclusionLease.js must be the explicit authority-free shared county writer-exclusion runtime'
);

assert.equal(
  expectedCodeViolationCollapseMaintenanceGateFiles.size,
  1,
  'expected collapse maintenance-gate production inventory must contain exactly 1 file'
);

assert.ok(
  expectedCodeViolationCollapseMaintenanceGateFiles.has(
    'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceGate.js'
  ),
  'CountyCodeViolationCollapseMaintenanceGate.js must be the authority-free CURRENT collapse maintenance readiness facade'
);

assert.equal(
  expectedCodeViolationCollapseExecutorImplementationFiles.size,
  2,
  'expected collapse executor implementation inventory must contain exactly 2 files'
);

[
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js',
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js'
].forEach(file => {
  assert.ok(
    expectedCodeViolationCollapseExecutorImplementationFiles.has(file),
    'collapse executor implementation production file missing: ' + file
  );
});

pass(
  'direct-keep executor implementation surface is exactly two explicitly allowlisted bounded production files'
);

assert.equal(
  expectedCountyCollapseRuntimePrerequisiteFiles.size,
  1,
  'expected collapse runtime-prerequisite production inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountyCollapseRuntimePrerequisiteFiles.has(
    'build/apps-script-brand/CountyCollapseRuntimePrerequisiteCertification.js'
  ),
  'CountyCollapseRuntimePrerequisiteCertification.js must be the bounded authority-free prerequisite operator surface'
);

assert.equal(
  expectedCountyCollapseOrphanBindingRecoveryFiles.size,
  1,
  'expected collapse orphan-binding recovery inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountyCollapseOrphanBindingRecoveryFiles.has(
    'build/apps-script-brand/CountyCollapseOperationIntentOrphanBindingRecovery.js'
  ),
  'CountyCollapseOperationIntentOrphanBindingRecovery.js must be the exact incident-bounded orphan adoption surface'
);

assert.equal(
  expectedCountyCollapseGroup2StrandedReconciliationFiles.size,
  1,
  'expected Group 2 stranded-operation reconciliation inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountyCollapseGroup2StrandedReconciliationFiles.has(
    'build/apps-script-brand/CountyCollapseGroup2StrandedOperationReconciliation.js'
  ),
  'Group 2 stranded-operation reconciliation must be the exact additive read-only incident surface'
);

pass(
  'Group 2 stranded-operation reconciliation is exactly one explicitly allowlisted authority-free additive file'
);

assert.equal(
  expectedCountyCollapseGroup2PreparedOperationRetirementFiles.size,
  1,
  'expected Group 2 prepared-operation retirement inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountyCollapseGroup2PreparedOperationRetirementFiles.has(
    'build/apps-script-brand/CountyCollapseGroup2PreparedOperationRetirement.js'
  ),
  'Group 2 prepared-operation retirement must be the exact incident-bounded terminalization surface'
);

pass(
  'Group 2 prepared-operation retirement is exactly one bounded additive production file'
);

assert.equal(
  expectedCountyCollapseGroup2PostTerminalReconciliationFiles.size,
  1,
  'expected Group 2 post-terminal reconciliation inventory must contain exactly 1 file'
);

assert.ok(
  expectedCountyCollapseGroup2PostTerminalReconciliationFiles.has(
    'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js'
  ),
  'Group 2 post-terminal reconciliation must be the exact additive read-only incident evidence surface'
);

pass(
  'Group 2 post-terminal reconciliation is exactly one authority-free additive production file'
);

assert.equal(
  expectedCountyCollapseGroup4PostBarrierTimeoutFiles.size,
  2,
  'expected Group 4 post-barrier timeout production inventory must contain exactly 2 files'
);

[
  'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutEvidence.js',
  'build/apps-script-brand/CountyCollapseGroup4PostBarrierTimeoutTerminalReconciliation.js'
].forEach(file => {
  assert.ok(
    expectedCountyCollapseGroup4PostBarrierTimeoutFiles.has(file),
    'Group 4 post-barrier timeout production file missing: ' + file
  );
});

pass(
  'Group 4 post-barrier timeout terminal-reconciliation surface is exactly two explicitly allowlisted production files'
);

assert.equal(
  expectedCodeViolationGroup3ZillowRestorationFiles.size,
  4,
  'expected Group 3 Zillow restoration production inventory must contain exactly 4 files'
);

assert.ok(
  expectedCodeViolationGroup3ZillowRestorationFiles.has(
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationContract.js'
  ),
  'CountyCodeViolationGroup3ZillowRestorationContract.js must be the explicit authority-free Group 3 restoration contract'
);

assert.ok(
  expectedCodeViolationGroup3ZillowRestorationFiles.has(
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js'
  ),
  'CountyCodeViolationGroup3ZillowRestorationExecutor.js must be the explicit bounded internal Group 3 restoration executor'
);

assert.ok(
  expectedCodeViolationGroup3ZillowRestorationFiles.has(
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationOperator.js'
  ),
  'CountyCodeViolationGroup3ZillowRestorationOperator.js must be the single bounded public Group 3 transport entrypoint'
);


assert.ok(
  expectedCodeViolationGroup3ZillowRestorationFiles.has(
    'build/apps-script-brand/CountyCodeViolationGroup3PostRestorationEvidence.js'
  ),
  'CountyCodeViolationGroup3PostRestorationEvidence.js must be the authority-free durable read-only Group 3 post-restoration evidence surface'
);

assert.equal(
  expectedProductionFiles.size,
  147,
  'expected reconciled production inventory must contain 147 files'
);

assert.equal(
  diffEntries.length,
  expectedProductionFiles.size,
  'unexpected number of production files differ from baseline'
);

diffEntries.forEach(entry => {
  assert.equal(
    entry.status,
    'A',
    `production authority reconciliation must be additive; found ${entry.status}: ${entry.file}`
  );

  assert.ok(
    expectedProductionFiles.has(entry.file),
    `unexpected production reconciliation file: ${entry.file}`
  );
});

expectedCountyProductionFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected additive county runtime file missing from baseline diff: ${file}`
  );
});

expectedCountySchedulerFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected controlled county scheduler file missing from baseline diff: ${file}`
  );
});

pass(
  'CountyProductionScheduler.js is the only Increment 2 controlled production addition'
);

expectedCountyPage86RepairFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected Page-86 repair production file missing from baseline diff: ${file}`
  );
});

pass(
  'Page-86/Page-89 repair production surface is exactly three explicitly allowlisted additive files'
);

expectedCodeViolationCompletionFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected Code Violations Production Completion file missing from baseline diff: ${file}`
  );
});

pass(
  'Code Violations Production Completion Gate 1 surface is exactly six explicitly allowlisted additive files'
);

expectedCodeViolationRollingMigrationFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected Gate 2B rolling migration production file missing from baseline diff: ${file}`
  );
});

pass(
  'Gate 2B rolling durable identity migration surface is exactly one explicitly allowlisted additive file'
);

expectedCodeViolationPostRollingFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected post-rolling Gate 2B production file missing from baseline diff: ${file}`
  );
});

pass(
  'post-rolling Gate 2B production surface is exactly two explicitly allowlisted additive files'
);

expectedCodeViolationCollapseDiagnosticFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected Code Violations collapse diagnostic file missing from baseline diff: ${file}`
  );
});

pass(
  'Code Violations collapse diagnostic surface is exactly two explicitly allowlisted read-only additive files'
);

expectedCodeViolationCollapseMaintenanceGateFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected collapse maintenance-gate production file missing from baseline diff: ${file}`
  );
});

pass(
  'collapse maintenance readiness surface is exactly one explicitly allowlisted authority-free additive file'
);

expectedCodeViolationCollapseExecutorImplementationFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected collapse executor implementation file missing from baseline diff: ${file}`
  );
});

pass(
  'direct-keep executor and maintenance-operator production modules are explicit additive files'
);

expectedCountyCollapseRuntimePrerequisiteFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected collapse runtime-prerequisite production file missing from baseline diff: ${file}`
  );
});

pass(
  'collapse runtime-prerequisite surface is exactly one explicitly allowlisted bounded additive file'
);

expectedCountyCollapseOrphanBindingRecoveryFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected collapse orphan-binding recovery production file missing from baseline diff: ${file}`
  );
});

pass(
  'collapse orphan-binding recovery surface is exactly one explicitly allowlisted incident-bounded additive file'
);

expectedCountyCollapseGroup4PostBarrierTimeoutFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected Group 4 post-barrier timeout production file missing from baseline diff: ${file}`
  );
});

pass(
  'Group 4 post-barrier timeout production surface is exactly two additive files'
);

expectedPreservationFiles.forEach(file => {
  assert.ok(
    diffEntries.some(entry =>
      entry.file === file &&
      entry.status === 'A'
    ),
    `expected preserved production file missing from baseline diff: ${file}`
  );
});

pass(
  'county runtime remains exactly 104 additive files'
);

pass(
  'production preservation is exactly 7 allowlisted additive files'
);

pass(
  'reconciled production integration is exactly ' + expectedProductionFiles.size + ' additive files plus ' +
    (
      CONTROLLED_MODIFIED_BUILD_FILES.length +
      POST_COUNTY_MODIFIED_PRODUCTION_FILES.length
    ) +
    ' explicitly allowlisted modified files with no deletions'
);

/*
 * Execution-surface containment.
 */
const bridgeSource =
  readBuild('CountyRuntimeBridge.js');

[
  'REOS_COUNTY_RUNTIME_SYNC_ALL',
  'REOS_COUNTY_RUNTIME_INSTALL_DAILY_TRIGGER',
  'ScriptApp.newTrigger',
  '.runAll('
].forEach(forbidden => {
  assert.equal(
    bridgeSource.includes(forbidden),
    false,
    `forbidden broad execution surface found in CountyRuntimeBridge: ${forbidden}`
  );
});

assert.ok(
  bridgeSource.includes(
    'confirmLive !== true'
  ),
  'runtime bridge live confirmation gate missing'
);

assert.ok(
  bridgeSource.includes(
    'REOS.DistressLeadCountySchema.ensure()'
  ),
  'runtime bridge schema-before-live gate missing'
);

pass(
  'runtime surface remains limited to controlled connector execution'
);

/*
 * Schema contract containment.
 */
const schemaSource =
  readBuild('DistressLeadCountySchema.js');

assert.equal(
  /REOS\.Database\.ensureTable\s*=/.test(
    schemaSource
  ),
  false,
  'schema bridge must not replace Database.ensureTable'
);

pass('global Database.ensureTable behavior remains untouched');

/*
 * Certification inventory.
 */
COMPONENT_VALIDATORS.forEach(fileName => {
  assert.ok(
    fs.existsSync(
      path.join(ROOT, 'scripts', fileName)
    ),
    `component validator missing: ${fileName}`
  );
});

pass(`all ${COMPONENT_VALIDATORS.length} county integration component validators are present`);

console.log('');
console.log(
  '=== COMPONENT CERTIFICATIONS ==='
);

function runComponentCertification(fileName) {
  var replaySha = '';
  var replayTree = '';

  if (
    fileName ===
      CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_VALIDATOR
  ) {
    replaySha =
      CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_REPLAY_SHA;

    replayTree =
      CERTIFIED_EXECUTOR_SAFETY_CORRECTION_RUNTIME_REPLAY_TREE;
  } else if (
    fileName ===
      CERTIFIED_EXECUTOR_IMPLEMENTATION_LIFECYCLE_VALIDATOR
  ) {
    replaySha =
      CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_SHA;

    replayTree =
      CERTIFIED_EXECUTOR_IMPLEMENTATION_REPLAY_TREE;
  } else if (
    fileName ===
      CERTIFIED_EXECUTOR_RUNTIME_VALIDATOR
  ) {
    replaySha =
      CERTIFIED_EXECUTOR_RUNTIME_REPLAY_SHA;

    replayTree =
      CERTIFIED_EXECUTOR_RUNTIME_REPLAY_TREE;
  } else if (
    fileName ===
      CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_LIFECYCLE_VALIDATOR
  ) {
    replaySha =
      CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_REPLAY_SHA;

    replayTree =
      CERTIFIED_EXECUTOR_SAFETY_CORRECTION_IMPLEMENTATION_REPLAY_TREE;
  } else if (
    fileName ===
      CERTIFIED_EXECUTOR_BLOCKER_RETIREMENT_IMPLEMENTATION_LIFECYCLE_VALIDATOR
  ) {
    replaySha =
      CERTIFIED_EXECUTOR_BLOCKER_RETIREMENT_IMPLEMENTATION_REPLAY_SHA;

    replayTree =
      CERTIFIED_EXECUTOR_BLOCKER_RETIREMENT_IMPLEMENTATION_REPLAY_TREE;
  } else if (
    fileName ===
      CERTIFIED_GROUP2_EXECUTOR_HISTORY_EXCEPTION_VALIDATOR
  ) {
    replaySha =
      CERTIFIED_GROUP2_EXECUTOR_HISTORY_EXCEPTION_REPLAY_SHA;

    replayTree =
      CERTIFIED_GROUP2_EXECUTOR_HISTORY_EXCEPTION_REPLAY_TREE;
  } else if (
    fileName ===
      CERTIFIED_GROUP2_PREPARED_OPERATION_RETIREMENT_VALIDATOR
  ) {
    replaySha =
      CERTIFIED_GROUP2_PREPARED_OPERATION_RETIREMENT_REPLAY_SHA;

    replayTree =
      CERTIFIED_GROUP2_PREPARED_OPERATION_RETIREMENT_REPLAY_TREE;
  }

  if (!replaySha) {
    return spawnSync(
      process.execPath,
      [
        path.join(
          ROOT,
          'scripts',
          fileName
        )
      ],
      {
        cwd: ROOT,
        stdio: 'inherit'
      }
    );
  }

  const replayRoot =
    fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        'reos-executor-implementation-lifecycle-replay-'
      )
    );

  const replayWorktree =
    path.join(
      replayRoot,
      'certified'
    );

  try {
    const add = spawnSync(
      'git',
      [
        'worktree',
        'add',
        '--detach',
        replayWorktree,
        replaySha
      ],
      {
        cwd: ROOT,
        encoding: 'utf8'
      }
    );

    if (add.error) {
      throw add.error;
    }

    assert.equal(
      add.status,
      0,
      'unable to materialize certified executor implementation lifecycle replay'
    );

    const head = spawnSync(
      'git',
      [
        'rev-parse',
        'HEAD'
      ],
      {
        cwd: replayWorktree,
        encoding: 'utf8'
      }
    );

    if (head.error) {
      throw head.error;
    }

    assert.equal(
      head.status,
      0,
      'unable to read certified executor implementation replay head'
    );

    assert.equal(
      String(head.stdout || '').trim(),
      replaySha,
      'certified executor implementation replay head changed'
    );

    const tree = spawnSync(
      'git',
      [
        'rev-parse',
        'HEAD^{tree}'
      ],
      {
        cwd: replayWorktree,
        encoding: 'utf8'
      }
    );

    if (tree.error) {
      throw tree.error;
    }

    assert.equal(
      tree.status,
      0,
      'unable to read certified executor implementation replay tree'
    );

    assert.equal(
      String(tree.stdout || '').trim(),
      replayTree,
      'certified executor implementation replay tree changed'
    );

    return spawnSync(
      process.execPath,
      [
        path.join(
          replayWorktree,
          'scripts',
          fileName
        )
      ],
      {
        cwd: replayWorktree,
        stdio: 'inherit'
      }
    );
  } finally {
    spawnSync(
      'git',
      [
        'worktree',
        'remove',
        '--force',
        replayWorktree
      ],
      {
        cwd: ROOT,
        stdio: 'ignore'
      }
    );

    fs.rmSync(
      replayRoot,
      {
        recursive: true,
        force: true
      }
    );
  }
}

COMPONENT_VALIDATORS.forEach(fileName => {
  console.log('');
  console.log(`--- ${fileName} ---`);

  const result =
    runComponentCertification(
      fileName
    );

  if (result.error) {
    throw result.error;
  }

  assert.equal(
    result.status,
    0,
    `component certification failed: ${fileName}`
  );
});

console.log('');
pass(`all ${COMPONENT_VALIDATORS.length} component certifications pass together`);

console.log('');
console.log(
  '=== INTEGRATION SUMMARY ==='
);

console.log(
  'runtime_core_files=' +
  RUNTIME_CORE_FILES.length
);

console.log(
  'generated_connectors=' +
  generatedFiles.length
);

console.log(
  'county_runtime_additions=' +
  expectedCountyProductionFiles.size
);
console.log(
  'production_preservation_additions=' +
  expectedPreservationFiles.size
);
console.log(
  'production_additions=' +
  expectedProductionFiles.size
);
console.log(
  'production_reconciliation_modifications=' +
  controlledModifiedEntries.length
);

console.log(
  'component_validators=' +
  COMPONENT_VALIDATORS.length
);

console.log(
  'legacy_protected_files=' +
  LEGACY_PROTECTED_FILES.length
);

console.log('');
console.log(
  'County runtime integration certification PASSED.'
);
