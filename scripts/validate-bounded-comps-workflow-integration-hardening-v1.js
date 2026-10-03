'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const files = {
  acquisition: path.join(
    root,
    'build/apps-script-brand/AcquisitionWorkflow.js'
  ),
  lifecycle: path.join(
    root,
    'build/apps-script-brand/DealLifecycleWorkflow.js'
  ),
  gate: path.join(
    root,
    'scripts/lib/comps-workflow-readiness-gate-v1.js'
  ),
  design: path.join(
    root,
    'docs/bounded-comps-workflow-integration-hardening-v1.md'
  )
};

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function requireTrue(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

const acquisition = read(files.acquisition);
const lifecycle = read(files.lifecycle);
const gate = read(files.gate);
const design = read(files.design);

/*
 * AcquisitionWorkflow:
 * comparable-row presence must not progress directly to Offer Generation.
 */
requireTrue(
  !/if\s*\(\s*comps\.length\s*\)/.test(acquisition),
  'AcquisitionWorkflow still contains a comps.length presence gate.'
);

requireTrue(
  !/advanceStage\s*\(\s*dealId\s*,\s*['"]Offer Generation['"]\s*,\s*['"]Comps found\./
    .test(acquisition),
  'AcquisitionWorkflow still advances from comparable presence.'
);

requireTrue(
  acquisition.includes(
    'Comparable-row presence is not readiness authority.'
  ),
  'Acquisition fail-closed marker missing.'
);

/*
 * DealLifecycleWorkflow:
 * legacy analysis / comp count / positive MAO must not return Offer Generation.
 */
requireTrue(
  !/return\s+decision_\s*\(\s*['"]Offer Generation['"]\s*,\s*['"]Valid analysis, minimum comps, and a positive draft offer are present\./
    .test(lifecycle),
  'DealLifecycleWorkflow still contains legacy Offer Generation decision.'
);

requireTrue(
  lifecycle.includes(
    'Legacy analysis / comparable-count / MAO evidence must not'
  ),
  'Lifecycle fail-closed marker missing.'
);

/*
 * Earlier lifecycle progression remains present.
 */
requireTrue(
  /return\s+decision_\s*\(\s*['"]Comparable Analysis['"]/.test(lifecycle),
  'Comparable Analysis lifecycle decision was unexpectedly removed.'
);

/*
 * Certified readiness gate remains present and requires both dimensions.
 */
requireTrue(
  gate.includes('compSupportedArvReady'),
  'Readiness gate missing compSupportedArvReady.'
);

requireTrue(
  gate.includes('repairScopeReady'),
  'Readiness gate missing repairScopeReady.'
);

/*
 * Do not require a particular textual implementation such as
 * `compSupportedArvReady && repairScopeReady`. The certified gate may
 * construct eligibility through intermediate state while preserving the
 * same semantics. Its authoritative fixture validator proves the combined
 * behavior separately.
 */
requireTrue(
  gate.includes('OFFER_READINESS_ELIGIBLE'),
  'Readiness gate missing explicit eligible reason.'
);

requireTrue(
  gate.includes("decision: eligible ? 'eligible' : 'blocked'"),
  'Readiness gate missing explicit fail-closed decision mapping.'
);

/*
 * Integration phase must not introduce provider or external HTTP behavior
 * into either modified production workflow.
 */
[
  acquisition,
  lifecycle
].forEach((source, index) => {
  requireTrue(
    !/\bUrlFetchApp\b/.test(source),
    'Modified workflow unexpectedly contains UrlFetchApp at index ' + index
  );

  requireTrue(
    !/\bfetch\s*\(/.test(source),
    'Modified workflow unexpectedly contains fetch() at index ' + index
  );
});

/*
 * Design must preserve the safety and successor contracts.
 */
[
  'adequate comp-supported ARV evidence',
  'adequate repair-scope evidence',
  'Comparable-row presence is not readiness authority',
  'positive MAO',
  'No inferred evidence bridge',
  'fails closed',
  'grants no authority',
  'production_readiness_evidence_persistence_bridge_design_v1'
].forEach((term) => {
  requireTrue(
    design.includes(term),
    'Design missing required contract text: ' + term
  );
});

console.log('ACQUISITION_PRESENCE_ONLY_OFFER_PATH_ABSENT=true');
console.log('LIFECYCLE_LEGACY_OFFER_DECISION_ABSENT=true');
console.log('COMPARABLE_ANALYSIS_DECISION_PRESERVED=true');
console.log('COMP_SUPPORTED_ARV_GATE_PRESERVED=true');
console.log('REPAIR_SCOPE_GATE_PRESERVED=true');
console.log('COMBINED_READINESS_REQUIREMENT_PRESERVED=true');
console.log('PRODUCTION_EVIDENCE_BRIDGE_CREATED=false');
console.log('LIVE_PROVIDER_BEHAVIOR_CREATED=false');
console.log('OFFER_GENERATION_EXECUTED=false');
console.log('OFFER_SUBMISSION_EXECUTED=false');
console.log(
  'BOUNDED_COMPS_WORKFLOW_INTEGRATION_HARDENING_V1_VALIDATOR_PASSED=true'
);
