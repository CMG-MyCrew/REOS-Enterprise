'use strict';

const assert = require('node:assert/strict');
const { validateManifest } =
  require('../orchestrator/manifest-validator');

const baseline = require('../orchestrator/task-schema.json');

let passed = 0;

function test(name, mutate, expected) {
  const manifest = structuredClone(baseline);
  mutate(manifest);

  const result = validateManifest(manifest);

  assert.equal(
    result.valid,
    expected,
    name + ': ' + JSON.stringify(result)
  );

  passed++;
}

test('baseline', () => {}, true);

test('production authority', m => {
  m.productionAuthority = true;
}, false);

test('execution mode', m => {
  m.mode = 'production';
}, false);

test('schema version', m => {
  m.schemaVersion = 2;
}, false);

test('unknown manifest field', m => {
  m.execute = true;
}, false);

test('unknown task field', m => {
  m.tasks[0].command = 'git push';
}, false);

test('empty tasks', m => {
  m.tasks = [];
}, false);

test('duplicate task id', m => {
  m.tasks[1].id = m.tasks[0].id;
}, false);

test('unknown dependency', m => {
  m.tasks[1].dependencies = ['unknown-task'];
}, false);

test('self dependency', m => {
  m.tasks[0].dependencies = [m.tasks[0].id];
}, false);

test('dependency cycle', m => {
  m.tasks[0].dependencies = [m.tasks[1].id];
}, false);

test('duplicate dependency', m => {
  const id = m.tasks[0].id;
  m.tasks[1].dependencies = [id, id];
}, false);

test('forbidden operation', m => {
  m.tasks[0].operations = ['production_deploy'];
}, false);

test('unsafe path', m => {
  m.tasks[0].files = ['../Code.gs'];
}, false);

test('empty operations', m => {
  m.tasks[0].operations = [];
}, false);

test('empty files', m => {
  m.tasks[0].files = [];
}, false);

test('invalid task id', m => {
  m.tasks[0].id = '../unsafe';
}, false);

test('missing task field', m => {
  delete m.tasks[0].dependencies;
}, false);

test('oversized task collection', m => {
  m.tasks = Array.from({ length: 101 }, (_, i) => ({
    id: 'task-' + i,
    operations: ['plan'],
    files: ['orchestrator/policy-engine.js'],
    dependencies: []
  }));
}, false);

console.log('MANIFEST_SECURITY_CHECKS_PASSED=' + passed);
console.log('STRICT_MANIFEST_CERTIFICATION_PASSED=true');
console.log('PRODUCTION_AUTHORITY=false');
