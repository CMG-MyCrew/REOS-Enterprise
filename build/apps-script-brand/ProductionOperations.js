/**
 * REOS Enterprise v3.0 - Production Operations Control Plane
 *
 * Owns one bounded runtime-health heartbeat scheduler.
 * This module performs scheduler integrity and health telemetry only.
 */

var REOS = REOS || {};

REOS.ProductionOperations = (function () {
  const HANDLER = 'reosProductionOperationsHeartbeat';
  const STALE_HOURS = 48;
  const LOCK_WAIT_MS = 1000;

  const LAST_ATTEMPT_AT =
    'REOS_PRODUCTION_OPERATIONS_LAST_ATTEMPT_AT';
  const LAST_SUCCESS_AT =
    'REOS_PRODUCTION_OPERATIONS_LAST_SUCCESS_AT';
  const LAST_FAILURE_AT =
    'REOS_PRODUCTION_OPERATIONS_LAST_FAILURE_AT';
  const LAST_FAILURE_MESSAGE =
    'REOS_PRODUCTION_OPERATIONS_LAST_FAILURE_MESSAGE';
  const LAST_CONTENDED_AT =
    'REOS_PRODUCTION_OPERATIONS_LAST_CONTENDED_AT';
  const INSTALLED_AT =
    'REOS_PRODUCTION_OPERATIONS_INSTALLED_AT';
  const REMOVED_AT =
    'REOS_PRODUCTION_OPERATIONS_REMOVED_AT';

  function properties_() {
    return PropertiesService.getScriptProperties();
  }

  function nowIso_() {
    return new Date().toISOString();
  }

  function requireAdmin_() {
    REOS.Security.requireAdmin();
  }

  function managedTriggers_() {
    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return trigger.getHandlerFunction() === HANDLER;
      });
  }

  function schedulerSnapshot_() {
    const triggers = managedTriggers_();

    return {
      handler: HANDLER,
      triggerCount: triggers.length,
      triggers: triggers.map(function (trigger) {
        return {
          handler: trigger.getHandlerFunction(),
          eventType: String(trigger.getEventType()),
          source: String(trigger.getTriggerSource()),
          uniqueId:
            typeof trigger.getUniqueId === 'function'
              ? trigger.getUniqueId()
              : ''
        };
      })
    };
  }

  function timestampMs_(value) {
    if (!value) return null;

    const valueMs = new Date(value).getTime();

    return isNaN(valueMs)
      ? null
      : valueMs;
  }

  function getStatus_() {
    const scheduler = schedulerSnapshot_();
    const props = properties_();

    const lastAttemptAt =
      props.getProperty(LAST_ATTEMPT_AT);
    const lastSuccessAt =
      props.getProperty(LAST_SUCCESS_AT);
    const lastFailureAt =
      props.getProperty(LAST_FAILURE_AT);
    const lastFailureMessage =
      props.getProperty(LAST_FAILURE_MESSAGE);
    const lastContendedAt =
      props.getProperty(LAST_CONTENDED_AT);

    const successMs = timestampMs_(lastSuccessAt);
    const failureMs = timestampMs_(lastFailureAt);

    let state;

    if (scheduler.triggerCount !== 1) {
      state = 'Unhealthy';
    } else if (!lastSuccessAt) {
      state = 'Not Run';
    } else if (successMs === null) {
      state = 'Unhealthy';
    } else if (
      Date.now() - successMs >
      STALE_HOURS * 60 * 60 * 1000
    ) {
      state = 'Stale';
    } else if (
      failureMs !== null &&
      failureMs > successMs
    ) {
      state = 'Unhealthy';
    } else {
      state = 'Healthy';
    }

    return {
      ok: state === 'Healthy',
      state: state,
      staleHours: STALE_HOURS,
      scheduler: scheduler,
      lastAttemptAt: lastAttemptAt || '',
      lastSuccessAt: lastSuccessAt || '',
      lastFailureAt: lastFailureAt || '',
      lastFailureMessage: lastFailureMessage || '',
      lastContendedAt: lastContendedAt || ''
    };
  }

  function installScheduler() {
    requireAdmin_();

    const existing = managedTriggers_();
    let removed = 0;

    if (existing.length !== 1) {
      existing.forEach(function (trigger) {
        ScriptApp.deleteTrigger(trigger);
        removed++;
      });

      ScriptApp
        .newTrigger(HANDLER)
        .timeBased()
        .everyHours(1)
        .create();
    }

    properties_().setProperty(
      INSTALLED_AT,
      nowIso_()
    );

    const status = getStatus_();

    return {
      ok: true,
      installed: status.scheduler.triggerCount,
      removed: removed,
      status: status
    };
  }

  function removeScheduler() {
    requireAdmin_();

    const existing = managedTriggers_();
    let removed = 0;

    existing.forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    });

    properties_().setProperty(
      REMOVED_AT,
      nowIso_()
    );

    return {
      ok: true,
      removed: removed
    };
  }

  function getStatus() {
    requireAdmin_();
    return getStatus_();
  }

  function heartbeat() {
    const props = properties_();
    const attemptAt = nowIso_();

    props.setProperty(
      LAST_ATTEMPT_AT,
      attemptAt
    );

    const lock =
      LockService.getScriptLock();

    if (!lock.tryLock(LOCK_WAIT_MS)) {
      props.setProperty(
        LAST_CONTENDED_AT,
        attemptAt
      );

      return {
        ok: false,
        skipped: true,
        status: 'Contended',
        attemptedAt: attemptAt
      };
    }

    try {
      const scheduler =
        schedulerSnapshot_();

      if (scheduler.triggerCount !== 1) {
        throw new Error(
          'Managed scheduler integrity violation: expected 1 heartbeat trigger, found ' +
          scheduler.triggerCount
        );
      }

      const successAt = nowIso_();

      props.setProperty(
        LAST_SUCCESS_AT,
        successAt
      );

      props.deleteProperty(
        LAST_FAILURE_AT
      );

      props.deleteProperty(
        LAST_FAILURE_MESSAGE
      );

      return {
        ok: true,
        skipped: false,
        status: 'Healthy',
        state: 'Healthy',
        heartbeatAt: successAt,
        triggerCount: scheduler.triggerCount
      };
    } catch (error) {
      const failureAt = nowIso_();

      props.setProperty(
        LAST_FAILURE_AT,
        failureAt
      );

      props.setProperty(
        LAST_FAILURE_MESSAGE,
        String(
          error && error.message
            ? error.message
            : error
        )
      );

      return {
        ok: false,
        skipped: false,
        status: 'Unhealthy',
        failureAt: failureAt,
        error: String(
          error && error.message
            ? error.message
            : error
        )
      };
    } finally {
      if (
        typeof lock.hasLock !== 'function' ||
        lock.hasLock()
      ) {
        lock.releaseLock();
      }
    }
  }

  return {
    installScheduler: installScheduler,
    removeScheduler: removeScheduler,
    getStatus: getStatus,
    heartbeat: heartbeat
  };
})();

function reosProductionOperationsInstallScheduler() {
  return REOS.ProductionOperations.installScheduler();
}

function reosProductionOperationsRemoveScheduler() {
  return REOS.ProductionOperations.removeScheduler();
}

function reosProductionOperationsStatus() {
  return REOS.ProductionOperations.getStatus();
}

function reosProductionOperationsHeartbeat() {
  return REOS.ProductionOperations.heartbeat();
}
