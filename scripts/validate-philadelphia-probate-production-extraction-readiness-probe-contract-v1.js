'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CONTRACT = path.join(
  ROOT,
  'docs',
  'philadelphia-probate-production-extraction-readiness-probe-contract-v1.md'
);

const ORCHESTRATION = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'PhiladelphiaProbateProductionExtractionOrchestration.js'
);

const EXTRACTOR = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'PhiladelphiaProbateBoundedTextExtraction.js'
);

assert(
  fs.existsSync(CONTRACT),
  'Readiness-probe contract missing.'
);

assert(
  fs.existsSync(ORCHESTRATION),
  'Production extraction orchestration missing.'
);

assert(
  fs.existsSync(EXTRACTOR),
  'Bounded text extractor missing.'
);

const text = fs.readFileSync(
  CONTRACT,
  'utf8'
);

const orchestration = fs.readFileSync(
  ORCHESTRATION,
  'utf8'
);

const extractor = fs.readFileSync(
  EXTRACTOR,
  'utf8'
);

const required = [
  'Production Extraction Readiness Probe Contract v1',
  'Design contract only.',
  'This contract does not authorize production execution.',
  'Success means only that the deployed JavaScript surfaces and pinned metadata',
  'Success does not authorize or prove live HTTP transport',
  'runtime-surface diagnostic, not a transport test and not an OCR',
  'production deployment is exactly version `136`',
  'The probe itself MUST NOT inspect Apps Script deployment versions.',
  '`reosPhiladelphiaProbateProductionExtractionReadinessProbe()`',
  'zero-argument RPC',
  '`REOS.PhiladelphiaProbateProductionExtractionOrchestration`',
  'orchestration version equals `1`',
  'publication date equals `2026-09-30`',
  '`tlipn093026.pdf`',
  'expected PDF byte length equals `4220387`',
  'maximum PDF bytes equals `26214400`',
  'maximum extracted-text characters equals `250000`',
  'orchestration `execute` MUST NOT be invoked',
  'global production orchestration RPC MUST NOT be invoked',
  '`REOS.PhiladelphiaProbateBoundedTextExtraction`',
  'extractor `extract` MUST NOT be invoked',
  '`runtimeSurfaceReady: true`',
  '`orchestrationExecuted: false`',
  '`extractionExecuted: false`',
  '`deploymentInspectionExecuted: false`',
  '`externalHttpExecuted: false`',
  '`pdfFetchExecuted: false`',
  '`driveCreateExecuted: false`',
  '`documentOpenExecuted: false`',
  '`driveCleanupExecuted: false`',
  '`temporaryArtifactCreated: false`',
  '`productionDataReadExecuted: false`',
  '`schedulerInspectionExecuted: false`',
  '`countyDataMutationExecuted: false`',
  '`arvAuthorityGranted: false`',
  '`repairScopeAuthorityGranted: false`',
  '`maoAuthorityGranted: false`',
  '`offerAuthorityGranted: false`',
  '`UrlFetchApp`',
  '`Utilities`',
  '`Drive.Files`',
  '`DriveApp`',
  '`DocumentApp`',
  '`PropertiesService`',
  '`ScriptApp`',
  '`SpreadsheetApp`',
  '`LockService`',
  'No automatic MAO or offer authority can arise from readiness-probe success.',
  'A successful readiness probe still does not authorize the production',
  'The production extraction orchestration remains a separate explicit execution',
  'This design contract authorizes zero production HTTP requests and zero OCR',
  'executions.'
];

for (const value of required) {
  assert(
    text.includes(value),
    'Missing readiness-probe contract requirement: ' +
      JSON.stringify(value)
  );
}

const sourceUrl =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const sourceUrlSha =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const pdfSha =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

for (const value of [
  sourceUrl,
  sourceUrlSha,
  pdfSha,
  '4220387',
  '26214400',
  '250000'
]) {
  assert(
    text.includes(value),
    'Certified readiness metadata missing from contract: ' +
      value
  );
}

for (const value of [
  'PhiladelphiaProbateProductionExtractionOrchestration',
  'orchestrationVersion: 1',
  '2026-09-30',
  sourceUrl,
  sourceUrlSha,
  'tlipn093026.pdf',
  '4220387',
  pdfSha,
  '26214400',
  '250000',
  'execute:'
]) {
  assert(
    orchestration.includes(value),
    'Current orchestration metadata surface missing: ' +
      value
  );
}

for (const value of [
  'PhiladelphiaProbateBoundedTextExtraction',
  'extractionVersion: 1',
  '4220387',
  pdfSha,
  '26214400',
  '250000',
  'extract:'
]) {
  assert(
    extractor.includes(value),
    'Current extractor metadata surface missing: ' +
      value
  );
}

console.log(
  'PB1_PRODUCTION_EXTRACTION_READINESS_PROBE_CONTRACT_VALIDATOR_PASSED=true'
);

console.log(
  'PUBLIC_RPC_NAME=reosPhiladelphiaProbateProductionExtractionReadinessProbe'
);

console.log(
  'PUBLIC_RPC_ARGUMENT_COUNT=0'
);

console.log(
  'EXPECTED_PRODUCTION_VERSION_PRECONDITION=136'
);

console.log(
  'ORCHESTRATION_EXECUTION_AUTHORIZED_BY_CONTRACT=false'
);

console.log(
  'EXTRACTION_EXECUTION_AUTHORIZED_BY_CONTRACT=false'
);

console.log(
  'PRODUCTION_HTTP_AUTHORIZED_BY_CONTRACT=false'
);

console.log(
  'PRODUCTION_OCR_AUTHORIZED_BY_CONTRACT=false'
);

console.log(
  'DEPLOYMENT_INSPECTION_AUTHORIZED_BY_PROBE=false'
);

console.log(
  'PRODUCTION_DATA_READ_AUTHORIZED=false'
);

console.log(
  'SCHEDULER_INSPECTION_AUTHORIZED=false'
);

console.log(
  'COUNTY_DATA_MUTATION_AUTHORIZED=false'
);

console.log(
  'ARV_AUTHORITY_GRANTED=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false'
);

console.log(
  'MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'OFFER_AUTHORITY_GRANTED=false'
);
