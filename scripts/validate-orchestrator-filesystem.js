'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validateFilesystemPath } =
  require('../orchestrator/filesystem-guard');

const root = fs.mkdtempSync(
  path.join(os.tmpdir(), 'reos-orchestrator-fs-')
);

let passed = 0;

function check(name, relative, expected, targetRoot = root) {
  const result = validateFilesystemPath(
    targetRoot,
    relative
  );

  assert.equal(
    result.allowed,
    expected,
    name + ': ' + JSON.stringify(result)
  );

  passed++;
}

try {
  fs.mkdirSync(path.join(root, 'orchestrator'));

  fs.mkdirSync(path.join(root, 'scripts'));

  fs.writeFileSync(
    path.join(root, 'orchestrator', 'policy-engine.js'),
    'safe'
  );

  fs.writeFileSync(
    path.join(root, 'orchestrator', 'task-planner.js'),
    'safe'
  );

  fs.writeFileSync(
    path.join(root, 'orchestrator', 'task-schema.json'),
    '{}'
  );

  fs.writeFileSync(
    path.join(root, 'scripts', 'validate-orchestrator-safety.js'),
    'safe'
  );

  check(
    'allow existing policy file',
    'orchestrator/policy-engine.js',
    true
  );

  check(
    'allow existing planner file',
    'orchestrator/task-planner.js',
    true
  );

  check(
    'allow existing schema file',
    'orchestrator/task-schema.json',
    true
  );

  check(
    'allow existing validation script',
    'scripts/validate-orchestrator-safety.js',
    true
  );

  for (const unsafe of [
    '../Code.gs',
    '/etc/passwd',
    'C:/Windows/system.ini',
    'orchestrator/../Code.gs',
    'orchestrator//policy-engine.js',
    'orchestrator/%2e%2e/Code.gs',
    'orchestrator\\policy-engine.js',
    '.github/workflows/deploy.yml',
    'Code.gs',
    'orchestrator/unknown.js',
    'scripts/unknown.js',
    '',
    null,
    123,
    {},
    []
  ]) {
    check(
      'reject unsafe path ' + String(unsafe),
      unsafe,
      false
    );
  }

  fs.unlinkSync(
    path.join(root, 'orchestrator', 'policy-engine.js')
  );

  fs.symlinkSync(
    '/etc/passwd',
    path.join(root, 'orchestrator', 'policy-engine.js')
  );

  check(
    'reject symlink target',
    'orchestrator/policy-engine.js',
    false
  );

  fs.unlinkSync(
    path.join(root, 'orchestrator', 'policy-engine.js')
  );

  fs.mkdirSync(
    path.join(root, 'orchestrator', 'policy-engine.js')
  );

  check(
    'reject directory instead of file',
    'orchestrator/policy-engine.js',
    false
  );

  check(
    'reject nonexistent root',
    'orchestrator/task-planner.js',
    false,
    path.join(root, 'missing')
  );

  check(
    'reject relative root',
    'orchestrator/task-planner.js',
    false,
    '.'
  );

  console.log(
    'FILESYSTEM_SECURITY_CHECKS_PASSED=' + passed
  );

  console.log(
    'FILESYSTEM_CONTAINMENT_CERTIFICATION_PASSED=true'
  );

  console.log('FILESYSTEM_WRITE_AUTHORITY=false');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
