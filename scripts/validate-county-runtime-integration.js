#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

const BASELINE = '66069b2';

const LEGACY_PROTECTED_FILES = [
  'build/apps-script-brand/ConnectorRegistry.js',
  'build/apps-script-brand/AcquisitionConnectorManager.js',
  'build/apps-script-brand/CSVImportEngine.js'
];

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
  'RuntimeVault.js'
];

const CONTROLLED_MODIFIED_BUILD_FILES = [
  'build/apps-script-brand/appsscript.json',
  'build/apps-script-brand/LivePipelineVerification.js'
];

const COMPONENT_VALIDATORS = [
  'validate-county-connector-certification.js',
  'validate-county-runtime-packaging.js',
  'validate-generated-county-connectors.js',
  'validate-distress-lead-county-schema.js',
  'validate-county-runtime-bridge.js'
];

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

pass(
  `legacy acquisition files remain unchanged from ${BASELINE}`
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
 * must remain the exact 110-file additive county/preservation inventory.
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

pass(
  'production manifest and E2E harness are the only allowlisted modified build files'
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

const expectedProductionFiles = new Set([
  ...expectedCountyProductionFiles,
  ...expectedPreservationFiles
]);

assert.equal(
  expectedCountyProductionFiles.size,
  104,
  'expected county runtime integration inventory must contain 104 files'
);

assert.equal(
  expectedPreservationFiles.size,
  6,
  'expected production preservation inventory must contain 6 files'
);

assert.equal(
  expectedProductionFiles.size,
  110,
  'expected reconciled production inventory must contain 110 files'
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
  'production preservation is exactly 6 allowlisted additive files'
);

pass(
  'reconciled production integration is exactly 110 additive files plus 2 controlled modified files with no deletions'
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

pass('all five county integration component validators are present');

console.log('');
console.log(
  '=== COMPONENT CERTIFICATIONS ==='
);

COMPONENT_VALIDATORS.forEach(fileName => {
  console.log('');
  console.log(`--- ${fileName} ---`);

  const result = spawnSync(
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
pass('all five component certifications pass together');

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
