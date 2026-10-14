#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');

const {
  evaluateTask,
  FORBIDDEN_OPERATIONS,
  ALLOWED_FILES
} = require('../orchestrator/policy-engine');

const {
  planTasks
} = require('../orchestrator/task-planner');

const manifest =
  require('../orchestrator/task-schema.json');

function task(overrides = {}) {
  return {
    id: 'safe-test',
    operations: ['offline_test'],
    files: ['orchestrator/policy-engine.js'],
    dependencies: [],
    ...overrides
  };
}

let checks = 0;

function denied(value, label) {
  const decision = evaluateTask(value);

  assert.equal(
    decision.allowed,
    false,
    label
  );

  checks++;
}

assert.equal(evaluateTask(task()).allowed, true);
checks++;

for (const operation of FORBIDDEN_OPERATIONS) {
  denied(
    task({ operations: [operation] }),
    `Forbidden operation: ${operation}`
  );
}

for (const operation of [
  null,
  {},
  123,
  'unknown_operation'
]) {
  denied(
    task({ operations: [operation] }),
    'Invalid operation'
  );
}

for (const files of [
  [],
  [null],
  [{}],
  ['../production.js'],
  ['/tmp/production.js'],
  ['C:\\production\\script.js'],
  ['orchestrator/../production.js'],
  ['orchestrator/%2e%2e/production.js'],
  ['orchestrator/%252e%252e/production.js'],
  ['orchestrator\\production.js'],
  ['orchestrator//policy-engine.js'],
  ['orchestrator/./policy-engine.js'],
  ['orchestrator/policy-engine.js '],
  ['.github/workflows/deploy.yml'],
  ['scripts/validate-county-runtime-integration.js'],
  ['src/AcquisitionEngine.js'],
  ['.clasp.json']
]) {
  denied(
    task({ files }),
    'Unsafe or unauthorized file'
  );
}

for (const operations of [
  [],
  null,
  'offline_test'
]) {
  denied(
    task({ operations }),
    'Invalid operation structure'
  );
}

for (const dependencies of [
  null,
  'other-task',
  [null],
  ['../task']
]) {
  denied(
    task({ dependencies }),
    'Invalid dependencies'
  );
}

for (const file of ALLOWED_FILES) {
  assert.equal(
    evaluateTask(task({ files: [file] })).allowed,
    true,
    `Approved file rejected: ${file}`
  );
  checks++;
}

assert.equal(
  manifest.mode,
  'offline-dry-run'
);
checks++;

assert.equal(
  manifest.productionAuthority,
  false
);
checks++;

assert.equal(
  planTasks(manifest.tasks).fullyAuthorized,
  true
);
checks++;

const blocked = planTasks([
  task({
    id: 'blocked',
    operations: ['production_deploy']
  }),
  task({
    id: 'dependent',
    dependencies: ['blocked']
  })
]);

assert.equal(blocked.fullyAuthorized, false);
assert.equal(blocked.waves.length, 1);
assert.equal(blocked.waves[0][0].allowed, false);
checks++;

assert.throws(
  () => planTasks([
    task({
      id: 'a',
      dependencies: ['b']
    }),
    task({
      id: 'b',
      dependencies: ['a']
    })
  ]),
  /DEPENDENCY_CYCLE/
);
checks++;

assert.throws(
  () => planTasks([
    task({
      id: 'a',
      dependencies: ['missing']
    })
  ]),
  /UNKNOWN_DEPENDENCY/
);
checks++;

assert.throws(
  () => planTasks([
    task({ id: 'duplicate' }),
    task({ id: 'duplicate' })
  ]),
  /INVALID_OR_DUPLICATE_TASK_ID/
);
checks++;

console.log(
  `ORCHESTRATOR_SAFETY_CHECKS_PASSED=${checks}`
);
console.log(
  'REOS_ORCHESTRATOR_SAFETY_CERTIFICATION_PASSED=true'
);
console.log('PRODUCTION_AUTHORITY=false');
console.log('AUTONOMOUS_DEPLOYMENT_AUTHORIZED=false');
