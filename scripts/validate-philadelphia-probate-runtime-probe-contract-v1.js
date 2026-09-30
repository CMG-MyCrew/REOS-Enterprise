'use strict';

const fs = require('fs');

const path =
  'docs/philadelphia-probate-runtime-probe-contract-v1.md';

const text = fs.readFileSync(path, 'utf8');

function requireText(value, label) {
  if (!text.includes(value)) {
    throw new Error(
      'Missing runtime probe contract requirement: ' + label
    );
  }
}

[
  ['reosPhiladelphiaProbateRuntimeProbe()', 'RPC name'],
  ['zero-argument RPC', 'zero argument boundary'],
  ['PB1', 'cursor prefix'],
  ['PHL-PROBATE-PB1-V1', 'cursor domain'],
  ['maximum lookback equals `10`', 'lookback'],
  ['notice page size equals `25`', 'page size'],
  ['resolve` but MUST NOT invoke it', 'resolve prohibition'],
  [
    'probateSourceAuthority` but MUST NOT invoke it',
    'authority prohibition'
  ],
  ['externalHttpExecuted: false', 'HTTP false flag'],
  ['sourceFetchExecuted: false', 'fetch false flag'],
  [
    'connectorRegistrationExecuted: false',
    'registration false flag'
  ],
  [
    'schedulerInspectionExecuted: false',
    'scheduler inspection false flag'
  ],
  [
    'checkpointMutationExecuted: false',
    'checkpoint false flag'
  ],
  [
    'countyDataMutationExecuted: false',
    'county mutation false flag'
  ],
  ['maoAuthorityGranted: false', 'MAO false flag'],
  ['offerAuthorityGranted: false', 'offer false flag'],
  ['No network access is permitted.', 'network prohibition'],
  [
    'No production data read or write is permitted.',
    'production data prohibition'
  ],
  [
    'Every later implementation, deployment, and execution remains a separate gate.',
    'separate gates'
  ]
].forEach(([value, label]) => requireText(value, label));

[
  'UrlFetchApp',
  'PropertiesService',
  'ScriptApp',
  'SpreadsheetApp',
  'DriveApp',
  'LockService',
  'CountyRuntimeBridge.registerConnectors()',
  'probateSourcePreflight_()'
].forEach((value) => requireText(value, value));

console.log(
  'PHILADELPHIA_PROBATE_RUNTIME_PROBE_CONTRACT_V1_VALIDATION_PASSED=true'
);
console.log('PUBLIC_RPC_NAME=reosPhiladelphiaProbateRuntimeProbe');
console.log('PUBLIC_RPC_ARGUMENT_COUNT=0');
console.log('PRODUCTION_RUNTIME_EXECUTION_AUTHORIZED=false');
console.log('PRODUCTION_PROBATE_HTTP_AUTHORIZED=false');
console.log('SCHEDULER_INSPECTION_AUTHORIZED=false');
console.log('SCHEDULER_MUTATION_AUTHORIZED=false');
console.log('CHECKPOINT_MUTATION_AUTHORIZED=false');
console.log('COUNTY_DATA_MUTATION_AUTHORIZED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_AUTHORITY_GRANTED=false');
