/**
 * REOS Enterprise v3.0 - County Production Scheduler
 *
 * Controlled scheduled ingestion for explicitly approved actionable
 * county distress datasets only.
 *
 * This scheduler intentionally excludes assessment/parcel enrichment
 * datasets and does not use bulk county execution.
 */

var REOS = REOS || {};

REOS.CountyProductionScheduler = (function () {
  const HANDLER = 'reosCountyProductionSchedulerRun';
  const LOCK_WAIT_MS = 1000;
  const STALE_HOURS = 48;

  /*
   * Production authority is intentionally explicit.
   * Adding another county/dataset requires a reviewed code change.
   */
  const ALLOWLIST = Object.freeze([
    Object.freeze({
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'tax_delinquent'
    }),
    Object.freeze({
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'code_violations'
    }),
    Object.freeze({
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'vacant_properties'
    }),
    Object.freeze({
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'sheriff_tax_sales'
    }),
    Object.freeze({
      connectorId: 'PA-PHILADELPHIA',
      dataset: 'sheriff_mortgage_sales'
    }),
    Object.freeze({
      connectorId: 'PA-BUCKS',
      dataset: 'tax_delinquent'
    })
  ]);

  const LAST_ATTEMPT_AT =
    'REOS_COUNTY_SCHEDULER_LAST_ATTEMPT_AT';
  const LAST_SUCCESS_AT =
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT';
  const LAST_FAILURE_AT =
    'REOS_COUNTY_SCHEDULER_LAST_FAILURE_AT';
  const LAST_FAILURE_MESSAGE =
    'REOS_COUNTY_SCHEDULER_LAST_FAILURE_MESSAGE';
  const LAST_CONTENDED_AT =
    'REOS_COUNTY_SCHEDULER_LAST_CONTENDED_AT';
  const LAST_RESULT_JSON =
    'REOS_COUNTY_SCHEDULER_LAST_RESULT_JSON';
  const INSTALLED_AT =
    'REOS_COUNTY_SCHEDULER_INSTALLED_AT';
  const REMOVED_AT =
    'REOS_COUNTY_SCHEDULER_REMOVED_AT';

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
      allowlist: ALLOWLIST.map(function (item) {
        return {
          connectorId: item.connectorId,
          dataset: item.dataset
        };
      }),
      lastAttemptAt: lastAttemptAt || '',
      lastSuccessAt: lastSuccessAt || '',
      lastFailureAt: lastFailureAt || '',
      lastFailureMessage: lastFailureMessage || '',
      lastContendedAt: lastContendedAt || '',
      lastResult:
        props.getProperty(LAST_RESULT_JSON) || ''
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
        .everyHours(6)
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

  function run() {
    const props = properties_();
    const attemptAt = nowIso_();

    props.setProperty(
      LAST_ATTEMPT_AT,
      attemptAt
    );

    const lock = LockService.getScriptLock();

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
      const scheduler = schedulerSnapshot_();

      if (scheduler.triggerCount !== 1) {
        throw new Error(
          'Managed county scheduler integrity violation: expected 1 trigger, found ' +
          scheduler.triggerCount
        );
      }

      const results = [];
      let failures = 0;

      ALLOWLIST.forEach(function (item) {
        try {
          const result =
            REOS.CountyRuntimeBridge.sync(
              item.connectorId,
              item.dataset,
              {
                confirmLive: true
              }
            );

          results.push({
            connectorId: item.connectorId,
            dataset: item.dataset,
            ok: true,
            result: result
          });
        } catch (error) {
          failures++;

          results.push({
            connectorId: item.connectorId,
            dataset: item.dataset,
            ok: false,
            error: String(
              error && error.message
                ? error.message
                : error
            )
          });
        }
      });

      const completedAt = nowIso_();

      props.setProperty(
        LAST_RESULT_JSON,
        JSON.stringify({
          attemptedAt: attemptAt,
          completedAt: completedAt,
          total: ALLOWLIST.length,
          succeeded: ALLOWLIST.length - failures,
          failed: failures,
          results: results
        })
      );

      if (failures > 0) {
        throw new Error(
          'County production scheduler completed with ' +
          failures +
          ' failed dataset(s) out of ' +
          ALLOWLIST.length +
          '.'
        );
      }

      props.setProperty(
        LAST_SUCCESS_AT,
        completedAt
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
        attemptedAt: attemptAt,
        completedAt: completedAt,
        total: ALLOWLIST.length,
        succeeded: ALLOWLIST.length,
        failed: 0,
        results: results
      };
    } catch (error) {
      const failureAt = nowIso_();
      const message = String(
        error && error.message
          ? error.message
          : error
      );

      props.setProperty(
        LAST_FAILURE_AT,
        failureAt
      );

      props.setProperty(
        LAST_FAILURE_MESSAGE,
        message
      );

      return {
        ok: false,
        skipped: false,
        status: 'Unhealthy',
        failureAt: failureAt,
        error: message,
        lastResult:
          props.getProperty(LAST_RESULT_JSON) || ''
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
    run: run
  };
})();

function reosCountyProductionSchedulerInstall() {
  return REOS.CountyProductionScheduler.installScheduler();
}

function reosCountyProductionSchedulerRemove() {
  return REOS.CountyProductionScheduler.removeScheduler();
}

function reosCountyProductionSchedulerStatus() {
  return REOS.CountyProductionScheduler.getStatus();
}

function reosCountyProductionSchedulerRun() {
  return REOS.CountyProductionScheduler.run();
}
