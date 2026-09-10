#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const executorPath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationDurableIdentityRollingMigrationExecutor.js'
);

const plannerPath = path.join(
  root,
  'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationPlan.js'
);

const executor = fs.readFileSync(executorPath, 'utf8');
const planner = fs.readFileSync(plannerPath, 'utf8');

function requireMatch(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exit(1);
  }
  console.log('PASS: ' + message);
}

requireMatch(
  /var\s+SOURCE\s*=\s*['"]PA-PHILADELPHIA['"]\s*;/.test(executor),
  'rolling executor source scope remains PA-PHILADELPHIA'
);

requireMatch(
  /var\s+DATASET\s*=\s*['"]code_violations['"]\s*;/.test(executor),
  'rolling executor logical dataset remains code_violations'
);

requireMatch(
  /var\s+TABLE\s*=\s*['"]DISTRESS_LEADS['"]\s*;/.test(executor),
  'rolling executor physical table is DISTRESS_LEADS'
);

requireMatch(
  /REOS\.Database\.getSheet\(\s*TABLE\s*\)/.test(executor),
  'rolling executor resolves physical sheet through TABLE'
);

requireMatch(
  !/REOS\.Database\.getSheet\(\s*DATASET\s*\)/.test(executor),
  'logical DATASET is not used as physical sheet authority'
);

requireMatch(
  /var\s+TABLE\s*=\s*['"]DISTRESS_LEADS['"]\s*;/.test(planner),
  'migration planner physical table remains DISTRESS_LEADS'
);

requireMatch(
  /\.getHeaders\(\s*TABLE\s*\)/.test(planner),
  'migration planner reads headers from TABLE'
);

requireMatch(
  /\.getAll\(\s*TABLE\s*\)/.test(planner),
  'migration planner reads records from TABLE'
);

console.log(
  '\nRolling durable identity physical sheet binding validation PASSED.'
);
