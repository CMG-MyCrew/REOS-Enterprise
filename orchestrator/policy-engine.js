'use strict';

const FORBIDDEN_OPERATIONS = new Set([
  'clasp_push',
  'version_create',
  'production_deploy',
  'trigger_install',
  'trigger_remove',
  'scheduler_execute',
  'production_rpc',
  'production_data_write',
  'mao_generate',
  'offer_generate',
  'offer_send',
  'git_push',
  'git_merge'
]);

const ALLOWED_OPERATIONS = new Set([
  'plan',
  'offline_test',
  'offline_validate'
]);

const ALLOWED_FILES = new Set([
  'orchestrator/policy-engine.js',
  'orchestrator/task-planner.js',
  'orchestrator/task-schema.json',
  'scripts/validate-orchestrator-safety.js'
]);

function normalizeFile(value) {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim()
  ) {
    throw new Error('INVALID_FILE_PATH');
  }

  if (
    value.includes('\\') ||
    value.includes('\0') ||
    value.startsWith('/') ||
    /^[A-Za-z]:/.test(value) ||
    value.includes('%') ||
    /[\x00-\x1f\x7f]/.test(value)
  ) {
    throw new Error('UNSAFE_FILE_PATH');
  }

  const parts = value.split('/');

  if (parts.some(part =>
    !part || part === '.' || part === '..'
  )) {
    throw new Error('UNSAFE_FILE_PATH');
  }

  return parts.join('/');
}

function isProtectedFile(file) {
  const normalized = normalizeFile(file);
  return !ALLOWED_FILES.has(normalized);
}

function evaluateTask(task) {
  if (
    !task ||
    typeof task !== 'object' ||
    Array.isArray(task)
  ) {
    return {
      allowed: false,
      reasons: ['INVALID_TASK']
    };
  }

  const reasons = [];

  if (
    typeof task.id !== 'string' ||
    !/^[a-z0-9][a-z0-9-]{0,79}$/.test(task.id)
  ) {
    reasons.push('INVALID_TASK_ID');
  }

  if (
    !Array.isArray(task.operations) ||
    task.operations.length === 0 ||
    !Array.isArray(task.files) ||
    task.files.length === 0
  ) {
    reasons.push('INVALID_TASK_STRUCTURE');
  }

  if (Array.isArray(task.operations)) {
    for (const operation of task.operations) {
      if (
        typeof operation !== 'string' ||
        FORBIDDEN_OPERATIONS.has(operation) ||
        !ALLOWED_OPERATIONS.has(operation)
      ) {
        reasons.push('OPERATION_NOT_AUTHORIZED');
      }
    }
  }

  if (Array.isArray(task.files)) {
    for (const file of task.files) {
      try {
        if (isProtectedFile(file)) {
          reasons.push('PROTECTED_FILE');
        }
      } catch (_) {
        reasons.push('UNSAFE_FILE_PATH');
      }
    }
  }

  if (
    !Array.isArray(task.dependencies) ||
    task.dependencies.some(dep =>
      typeof dep !== 'string' ||
      !/^[a-z0-9][a-z0-9-]{0,79}$/.test(dep)
    )
  ) {
    reasons.push('INVALID_DEPENDENCIES');
  }

  return {
    allowed: reasons.length === 0,
    reasons: [...new Set(reasons)]
  };
}

module.exports = {
  evaluateTask,
  isProtectedFile,
  normalizeFile,
  FORBIDDEN_OPERATIONS,
  ALLOWED_OPERATIONS,
  ALLOWED_FILES
};
