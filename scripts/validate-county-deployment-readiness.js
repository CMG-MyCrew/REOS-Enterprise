#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

const EXPECTED_GENERATED = 94;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function run(command, args) {
  return spawnSync(
    command,
    args,
    {
      cwd: ROOT,
      encoding: 'utf8'
    }
  );
}

console.log(
  '=== COUNTY DEPLOYMENT READINESS CERTIFICATION ==='
);
console.log('');

/*
 * Repository authority.
 */
const repositoryContext = run(
  'git',
  ['rev-parse', '--is-inside-work-tree']
);

assert.equal(
  repositoryContext.status,
  0,
  'unable to verify Git repository context'
);

assert.equal(
  repositoryContext.stdout.trim(),
  'true',
  'deployment readiness must run inside the REOS Git repository'
);

const branch = run(
  'git',
  ['branch', '--show-current']
);

assert.equal(
  branch.status,
  0,
  'unable to inspect Git branch context'
);

const branchName =
  branch.stdout.trim();

pass(
  branchName
    ? `Git repository context is active on ${branchName}`
    : 'Git repository context is active in detached HEAD mode'
);

const worktree = run(
  'git',
  ['status', '--porcelain']
);

assert.equal(
  worktree.status,
  0,
  'unable to inspect Git worktree'
);

/*
 * This validator itself may be untracked while being developed.
 * No production build files may be dirty.
 */
const dirtyBuildFiles =
  worktree.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(line =>
      line.includes(
        'build/apps-script-brand/'
      )
    );

assert.deepEqual(
  dirtyBuildFiles,
  [],
  'Apps Script build contains uncommitted changes'
);

pass('authoritative Apps Script build is clean');

/*
 * Clasp authority.
 */
const claspPath =
  path.join(ROOT, '.clasp.json');

assert.ok(
  fs.existsSync(claspPath),
  '.clasp.json is missing'
);

const clasp =
  JSON.parse(read(claspPath));

assert.equal(
  clasp.rootDir,
  'build/apps-script-brand',
  'clasp rootDir must be build/apps-script-brand'
);

const CERTIFIED_PRODUCTION_SCRIPT_ID =
  '159EMqc5tB9oQJGhci97j6b41BUvhG5wxUErTZgBFqSCghRcw4msFaKi7';

assert.equal(
  String(clasp.scriptId || '').trim(),
  CERTIFIED_PRODUCTION_SCRIPT_ID,
  'clasp scriptId must match certified REOS production Apps Script authority'
);

pass('clasp authority points to build/apps-script-brand');
pass('clasp scriptId matches certified REOS production authority');

/*
 * Apps Script package structure.
 */
assert.ok(
  fs.existsSync(
    path.join(BUILD, 'appsscript.json')
  ),
  'appsscript.json is missing'
);

const packageFiles =
  fs.readdirSync(BUILD);

const manifestCount =
  packageFiles.filter(
    name => name === 'appsscript.json'
  ).length;

assert.equal(
  manifestCount,
  1,
  'Apps Script package must contain exactly one appsscript.json'
);

pass('exactly one Apps Script manifest is packaged');

const legacyGs =
  packageFiles.filter(
    name => name.endsWith('.gs')
  );

assert.deepEqual(
  legacyGs,
  [],
  'legacy .gs files are not allowed in authoritative build'
);

const doubleExtensions =
  packageFiles.filter(
    name => name.endsWith('.gs.js')
  );

assert.deepEqual(
  doubleExtensions,
  [],
  '.gs.js double extensions are forbidden'
);

pass('package contains no legacy .gs or .gs.js artifacts');

const generated =
  packageFiles
    .filter(name =>
      name.endsWith(
        'CountyConnector.js'
      )
    )
    .sort();

assert.equal(
  generated.length,
  EXPECTED_GENERATED,
  'expected exactly 94 generated county connectors'
);

pass('exactly 94 generated county connectors are packaged');

/*
 * Core runtime package.
 */
[
  'CountyConnectorSDK.js',
  'CountyHttpAdapter.js',
  'CountyAdapterRegistry.js',
  'ArcGISAdapter.js',
  'CSVAdapter.js',
  'HTMLTableAdapter.js',
  'JSONAPIAdapter.js',
  'SocrataAdapter.js',
  'DistressLeadCountySchema.js',
  'CountyRuntimeBridge.js'
].forEach(fileName => {
  assert.ok(
    fs.existsSync(
      path.join(BUILD, fileName)
    ),
    `required runtime artifact missing: ${fileName}`
  );
});

pass('complete native county runtime package is present');

/*
 * Controlled execution surface.
 */
const bridge =
  read(
    path.join(
      BUILD,
      'CountyRuntimeBridge.js'
    )
  );

[
  'REOS_COUNTY_RUNTIME_SETUP',
  'REOS_COUNTY_RUNTIME_LIST',
  'REOS_COUNTY_RUNTIME_DRY_RUN',
  'REOS_COUNTY_RUNTIME_SYNC'
].forEach(symbol => {
  assert.ok(
    bridge.includes(symbol),
    `controlled runtime entry point missing: ${symbol}`
  );
});

[
  'REOS_COUNTY_RUNTIME_SYNC_ALL',
  'REOS_COUNTY_RUNTIME_INSTALL_DAILY_TRIGGER',
  'ScriptApp.newTrigger'
].forEach(symbol => {
  assert.equal(
    bridge.includes(symbol),
    false,
    `forbidden broad runtime surface packaged: ${symbol}`
  );
});

assert.ok(
  bridge.includes(
    'confirmLive !== true'
  ),
  'live confirmation gate is missing'
);

pass('runtime execution surface remains controlled');

/*
 * Philadelphia deployment target.
 */
const philadelphiaPath =
  path.join(
    BUILD,
    'PAPhiladelphiaCountyConnector.js'
  );

assert.ok(
  fs.existsSync(philadelphiaPath),
  'Philadelphia connector is missing'
);

const philadelphia =
  read(philadelphiaPath);

assert.ok(
  philadelphia.includes(
    'id: "PA-PHILADELPHIA"'
  ),
  'Philadelphia connector ID missing'
);

assert.match(
  philadelphia,
  /property_assessment\s*:\s*\{[\s\S]*?adapter:\s*"arcgis"[\s\S]*?endpointProperty:\s*"REOS_COUNTY_PA_PHILADELPHIA_PROPERTY_ASSESSMENT_URL"[\s\S]*?enabled:\s*true/,
  'Philadelphia property_assessment deployment contract changed'
);

pass('Philadelphia property_assessment is enabled');
pass('Philadelphia property_assessment uses arcgis');
pass(
  'Philadelphia endpoint property contract is present'
);

/*
 * Existing integration aggregate certification.
 */
const integration = run(
  process.execPath,
  [
    path.join(
      ROOT,
      'scripts',
      'validate-county-runtime-integration.js'
    )
  ]
);

if (integration.stdout) {
  process.stdout.write(
    integration.stdout
  );
}

if (integration.stderr) {
  process.stderr.write(
    integration.stderr
  );
}

assert.equal(
  integration.status,
  0,
  'county runtime integration certification failed'
);

pass('full county runtime integration remains certified');

console.log('');
console.log(
  'Philadelphia endpoint property required:'
);

console.log(
  'REOS_COUNTY_PA_PHILADELPHIA_PROPERTY_ASSESSMENT_URL'
);

console.log('');
console.log(
  'County deployment readiness certification PASSED.'
);
