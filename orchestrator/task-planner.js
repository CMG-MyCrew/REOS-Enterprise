'use strict';

const { evaluateTask } = require('./policy-engine');

function planTasks(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error('INVALID_TASK_COLLECTION');
  }

  const ids = new Set();

  for (const task of tasks) {
    if (!task || typeof task.id !== 'string' ||
        ids.has(task.id)) {
      throw new Error('INVALID_OR_DUPLICATE_TASK_ID');
    }
    ids.add(task.id);
  }

  const completed = new Set();
  const pending = new Map(tasks.map(t => [t.id, t]));
  const waves = [];

  while (pending.size > 0) {
    const ready = [];

    for (const task of pending.values()) {
      if (!Array.isArray(task.dependencies)) {
        throw new Error('INVALID_DEPENDENCIES');
      }

      for (const dep of task.dependencies) {
        if (!ids.has(dep)) {
          throw new Error('UNKNOWN_DEPENDENCY');
        }
      }

      if (task.dependencies.every(dep => completed.has(dep))) {
        ready.push(task);
      }
    }

    if (ready.length === 0) {
      throw new Error('DEPENDENCY_CYCLE');
    }

    ready.sort((a, b) => a.id.localeCompare(b.id));

    const wave = [];

    for (const task of ready) {
      const decision = evaluateTask(task);

      wave.push({
        id: task.id,
        allowed: decision.allowed,
        reasons: decision.reasons
      });

      pending.delete(task.id);

      if (decision.allowed) {
        completed.add(task.id);
      }
    }

    waves.push(wave);

    if (wave.some(task => !task.allowed)) {
      break;
    }
  }

  return {
    waves,
    fullyAuthorized: pending.size === 0 &&
      waves.every(w => w.every(t => t.allowed))
  };
}

module.exports = { planTasks };
