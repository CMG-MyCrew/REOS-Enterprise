'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const CONTRACT =
  path.join(
    ROOT,
    'docs',
    'philadelphia-probate-oversize-recovery-readiness-probe-contract-v1.md'
  );

assert(
  fs.existsSync(CONTRACT),
  'Oversize recovery readiness contract missing.'
);

const text =
  fs.readFileSync(
    CONTRACT,
    'utf8'
  );

const normalized =
  text
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

function requireNormalized(value) {
  const needle =
    value
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  assert(
    normalized.includes(needle),
    'Missing normalized contract requirement: ' +
      JSON.stringify(value)
  );
}

function requireExact(value) {
  assert(
    text.includes(value),
    'Missing exact contract symbol/value: ' +
      JSON.stringify(value)
  );
}

[
  'Design contract only.',
  'does not authorize production execution',
  'runtime-surface diagnostic only',
  'production deployment is exactly Apps Script version `138`',
  'version `139` does not exist',
  'readiness probe itself MUST NOT inspect deployment versions',
  'No Apps Script service is required to establish runtime-surface readiness.',
  'It may inspect only already-loaded JavaScript objects, primitive metadata, and function identities.',
  'successful readiness probe does not establish',
  'existing normal extraction limit remains exactly',
  'Readiness-probe success MUST NOT change, bypass, increase, reinterpret, or authorize a change to that limit.',
  'No automatic MAO or offer authority can arise from readiness-probe success.',
  'A successful readiness probe still does not authorize the production recovery RPC.',
  'authorizes zero production HTTP requests and zero OCR executions.'
].forEach(
  requireNormalized
);

[
  'reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe()',
  'REOS.PhiladelphiaProbateProductionOversizeTextEvidenceRecovery',
  'reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery',
  'REOS.PhiladelphiaProbateBoundedOversizeTextEvidence',
  '2026-09-30',
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf',
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca',
  'tlipn093026.pdf',
  '4220387',
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',
  '26214400',
  '250000',
  '`execute` MUST NOT be invoked.',
  '`inspect` MUST NOT be invoked.',
  '`recoveryExecuted: false`',
  '`evidenceExecuted: false`',
  '`externalHttpExecuted: false`',
  '`pdfFetchExecuted: false`',
  '`driveCreateExecuted: false`',
  '`documentOpenExecuted: false`',
  '`driveCleanupExecuted: false`',
  '`temporaryArtifactCreated: false`',
  '`productionDataReadExecuted: false`',
  '`probateParsingExecuted: false`',
  '`persistenceExecuted: false`',
  '`countyDataMutationExecuted: false`',
  '`arvAuthorityGranted: false`',
  '`repairScopeAuthorityGranted: false`',
  '`maoAuthorityGranted: false`',
  '`offerAuthorityGranted: false`',
  '`147`'
].forEach(
  requireExact
);

for (
  const service
  of [
    '`UrlFetchApp`',
    '`Utilities`',
    '`Drive`',
    '`Drive.Files`',
    '`DriveApp`',
    '`DocumentApp`',
    '`PropertiesService`',
    '`ScriptApp`',
    '`SpreadsheetApp`',
    '`LockService`',
    '`CalendarApp`',
    '`GmailApp`'
  ]
) {
  requireExact(service);
}

requireNormalized(
  'future readiness-probe implementation MUST NOT reference or invoke'
);

requireNormalized(
  'recovery `execute` is never invoked'
);

requireNormalized(
  'global recovery RPC is never invoked'
);

requireNormalized(
  'evidence `inspect` is never invoked'
);

requireNormalized(
  'separately authorize exactly one zero-side-effect production readiness probe RPC'
);

console.log(
  'PB1_OVERSIZE_RECOVERY_READINESS_PROBE_CONTRACT_VALIDATOR_PASSED=true'
);

console.log(
  'PRODUCTION_PRECONDITION_VERSION=138'
);

console.log(
  'FUTURE_READINESS_RPC=reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe'
);

console.log(
  'FUTURE_READINESS_RPC_ARGUMENT_COUNT=0'
);

console.log(
  'RECOVERY_EXECUTION_AUTHORIZED=false'
);

console.log(
  'EVIDENCE_EXECUTION_AUTHORIZED=false'
);

console.log(
  'APPS_SCRIPT_SERVICE_ACCESS_AUTHORIZED=false'
);

console.log(
  'PRODUCTION_HTTP_AUTHORIZED_BY_DESIGN=false'
);

console.log(
  'PRODUCTION_OCR_AUTHORIZED_BY_DESIGN=false'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT_CHANGE_AUTHORIZED=false'
);

console.log(
  'HISTORICAL_RECONCILED_PRODUCTION_COUNT=147'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);
