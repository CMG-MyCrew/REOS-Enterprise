'use strict';

const { evaluateTask } = require('./policy-engine');

const MANIFEST_KEYS = new Set([
  'schemaVersion',
  'mode',
  'productionAuthority',
  'tasks'
]);

const TASK_KEYS = new Set([
  'id',
  'operations',
  'files',
  'dependencies'
]);

function isRecord(value) {
  return value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value, allowed) {
  return Object.keys(value).every(key => allowed.has(key)) &&
    Object.keys(value).length === allowed.size &&
    [...allowed].every(key =>
      Object.prototype.hasOwnProperty.call(value, key)
    );
}

function validateManifest(manifest) {
  const errors = [];

  if (!isRecord(manifest)) {
    return {
      valid: false,
      errors: ['manifest_not_plain_object']
    };
  }

  if (!hasExactKeys(manifest, MANIFEST_KEYS)) {
    errors.push('invalid_manifest_keys');
  }

  if (manifest.schemaVersion !== 1) {
    errors.push('unsupported_schema_version');
  }

  if (manifest.mode !== 'offline-dry-run') {
    errors.push('invalid_execution_mode');
  }

  if (manifest.productionAuthority !== false) {
    errors.push('production_authority_denied');
  }

  if (!Array.isArray(manifest.tasks) ||
      manifest.tasks.length === 0 ||
      manifest.tasks.length > 100) {
    errors.push('invalid_task_collection');
    return { valid: false, errors };
  }

  const ids = new Set();

  for (const task of manifest.tasks) {
    if (!isRecord(task)) {
      errors.push('task_not_plain_object');
      continue;
    }

    if (!hasExactKeys(task, TASK_KEYS)) {
      errors.push('invalid_task_keys');
    }

    if (typeof task.id !== 'string' ||
        !/^[a-z][a-z0-9-]{0,79}$/.test(task.id)) {
      errors.push('invalid_task_id');
      continue;
    }

    if (ids.has(task.id)) {
      errors.push('duplicate_task_id');
    }

    ids.add(task.id);

    const decision = evaluateTask(task);

    if (!decision.allowed) {
      errors.push('task_policy_denied:' + task.id);
    }

    if (!Array.isArray(task.dependencies) ||
        task.dependencies.some(
          dep => typeof dep !== 'string' ||
            !/^[a-z][a-z0-9-]{0,79}$/.test(dep)
        )) {
      errors.push('invalid_dependencies:' + task.id);
    }
  }

  for (const task of manifest.tasks) {
    if (!isRecord(task) ||
        !Array.isArray(task.dependencies)) {
      continue;
    }

    for (const dependency of task.dependencies) {
      if (!ids.has(dependency)) {
        errors.push('unknown_dependency');
      }

      if (dependency === task.id) {
        errors.push('self_dependency');
      }
    }

    if (new Set(task.dependencies).size !==
        task.dependencies.length) {
      errors.push('duplicate_dependency');
    }
  }

  if (errors.length === 0) {
    const graph = new Map(
      manifest.tasks.map(task => [
        task.id,
        task.dependencies
      ])
    );

    const visiting = new Set();
    const visited = new Set();

    function visit(id) {
      if (visiting.has(id)) return false;
      if (visited.has(id)) return true;

      visiting.add(id);

      for (const dependency of graph.get(id)) {
        if (!visit(dependency)) return false;
      }

      visiting.delete(id);
      visited.add(id);
      return true;
    }

    for (const id of graph.keys()) {
      if (!visit(id)) {
        errors.push('dependency_cycle');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)]
  };
}

module.exports = { validateManifest };
