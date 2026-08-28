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
    /*
     * tax_delinquent is intentionally quarantined from scheduled
     * production authority because the public parcel-level source
     * currently represents the historical 202206 snapshot.
     * Keep the connector available for explicit controlled research use.
     */
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

  /*
   * A complete production cycle is intentionally split across bounded
   * invocations. Each invocation executes at most one approved feed.
   * LAST_SUCCESS_AT remains complete-workload freshness authority only.
   */
  const CYCLE_ID =
    'REOS_COUNTY_SCHEDULER_CYCLE_ID';
  const CYCLE_STARTED_AT =
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT';
  const NEXT_FEED_INDEX =
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX';
  const CURRENT_FEED_CURSOR =
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR';
  const CYCLE_RESULTS_JSON =
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON';

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

  function preflight() {
    requireAdmin_();

    const props = properties_();

    const datasets = Object.freeze({
      /*
       * Preflight covers scheduled production authority only.
       * tax_delinquent remains quarantined until a current parcel-level
       * production source is established and certified.
       */
      code_violations:
        'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL',
      vacant_properties:
        'REOS_COUNTY_PA_PHILADELPHIA_VACANT_PROPERTIES_URL',
      sheriff_tax_sales:
        'REOS_COUNTY_PA_PHILADELPHIA_SHERIFF_TAX_SALES_URL',
      sheriff_mortgage_sales:
        'REOS_COUNTY_PA_PHILADELPHIA_SHERIFF_MORTGAGE_SALES_URL'
    });

    const result = {};
    let configured = 0;

    Object.keys(datasets).forEach(function (dataset) {
      const value = props.getProperty(
        datasets[dataset]
      );

      const isConfigured =
        typeof value === 'string' &&
        value.trim().length > 0;

      if (isConfigured) {
        configured++;
      }

      result[dataset] = {
        configured: isConfigured
      };
    });

    const required = Object.keys(datasets).length;

    return {
      ok: configured === required,
      connectorId: 'PA-PHILADELPHIA',
      configured: configured,
      required: required,
      ready: configured === required,
      datasets: result
    };
  }

  function readCycleResults_(props) {
    const raw =
      props.getProperty(CYCLE_RESULTS_JSON);

    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);

      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch (error) {
      return [];
    }
  }

  function clearCycle_(props) {
    props.deleteProperty(CYCLE_ID);
    props.deleteProperty(CYCLE_STARTED_AT);
    props.deleteProperty(NEXT_FEED_INDEX);
    props.deleteProperty(CURRENT_FEED_CURSOR);
    props.deleteProperty(CYCLE_RESULTS_JSON);
  }

  function cycleSnapshot_(props) {
    const results = readCycleResults_(props);
    const rawIndex =
      props.getProperty(NEXT_FEED_INDEX);

    let nextFeedIndex =
      rawIndex === null || rawIndex === ''
        ? 0
        : Number(rawIndex);

    if (
      !Number.isInteger(nextFeedIndex) ||
      nextFeedIndex < 0 ||
      nextFeedIndex > ALLOWLIST.length
    ) {
      nextFeedIndex = 0;
    }

    return {
      id: props.getProperty(CYCLE_ID) || '',
      startedAt:
        props.getProperty(CYCLE_STARTED_AT) || '',
      nextFeedIndex: nextFeedIndex,
      currentFeedCursor:
        props.getProperty(CURRENT_FEED_CURSOR) || '',
      completedFeeds: results.length,
      totalFeeds: ALLOWLIST.length,
      results: results
    };
  }

  function runInternal_(execution) {
    execution = execution || {
      mode: 'scheduled'
    };

    const isManual =
      execution.mode === 'manual';

    const props = properties_();
    const attemptAt = nowIso_();

    props.setProperty(
      LAST_ATTEMPT_AT,
      attemptAt
    );

    const lock = LockService.getScriptLock();

    if (!lock.tryLock(LOCK_WAIT_MS)) {
      if (
        REOS.ScriptLockObservability &&
        typeof REOS.ScriptLockObservability
          .contention ===
          'function'
      ) {
        REOS.ScriptLockObservability
          .contention(
            'CountyProductionScheduler',
            isManual
              ? 'manual'
              : 'scheduled',
            {
              waitMilliseconds:
                LOCK_WAIT_MS
            }
          );
      }

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

    var lockObservation =
      REOS.ScriptLockObservability &&
      typeof REOS.ScriptLockObservability
        .begin ===
        'function'
        ? REOS.ScriptLockObservability
            .begin(
              'CountyProductionScheduler',
              isManual
                ? 'manual'
                : 'scheduled',
              {
                waitMilliseconds:
                  LOCK_WAIT_MS
              }
            )
        : null;

    var lockOutcome =
      'SUCCESS';

    try {
      const scheduler = schedulerSnapshot_();

      let cycle = cycleSnapshot_(props);

      if (isManual) {
        const expectedCycleId =
          String(
            execution.expectedCycleId || ''
          ).trim();

        const expectedFeedIndex =
          Number(
            execution.expectedFeedIndex
          );

        const expectedCursor =
          String(
            execution.expectedCursor === undefined ||
            execution.expectedCursor === null
              ? ''
              : execution.expectedCursor
          );

        /*
         * Manual certification is deliberately available only while the
         * managed county scheduler is frozen. This avoids creating a
         * real CLOCK trigger merely to satisfy scheduled-run authority.
         */
        if (scheduler.triggerCount !== 0) {
          throw new Error(
            'Manual county certification requires scheduler frozen: expected 0 trigger, found ' +
            scheduler.triggerCount
          );
        }

        if (!expectedCycleId) {
          throw new Error(
            'Expected county scheduler cycle ID is required.'
          );
        }

        if (
          !Number.isInteger(expectedFeedIndex) ||
          expectedFeedIndex < 0 ||
          expectedFeedIndex >= ALLOWLIST.length
        ) {
          throw new Error(
            'Expected county scheduler feed index is invalid.'
          );
        }

        /*
         * Unlike scheduled execution, manual certification must never
         * manufacture, repair, clear, or reset checkpoint authority.
         * The caller must prove the exact active authority observed
         * immediately before execution.
         */
        if (!cycle.id) {
          throw new Error(
            'Manual county certification requires an active checkpoint.'
          );
        }

        if (
          cycle.completedFeeds !== cycle.nextFeedIndex ||
          cycle.nextFeedIndex >= ALLOWLIST.length
        ) {
          throw new Error(
            'Manual county certification checkpoint is structurally invalid.'
          );
        }

        if (cycle.id !== expectedCycleId) {
          throw new Error(
            'County scheduler checkpoint changed; expected cycle ' +
            expectedCycleId +
            ', found ' +
            cycle.id +
            '.'
          );
        }

        if (
          cycle.nextFeedIndex !==
          expectedFeedIndex
        ) {
          throw new Error(
            'County scheduler feed authority changed; expected index ' +
            expectedFeedIndex +
            ', found ' +
            cycle.nextFeedIndex +
            '.'
          );
        }

        if (
          String(
            cycle.currentFeedCursor || ''
          ) !== expectedCursor
        ) {
          throw new Error(
            'County scheduler cursor authority changed; expected ' +
            expectedCursor +
            ', found ' +
            String(
              cycle.currentFeedCursor || ''
            ) +
            '.'
          );
        }
      } else {
        /*
         * Scheduled production execution retains the existing integrity
         * requirement: exactly one managed CLOCK trigger must exist.
         */
        if (scheduler.triggerCount !== 1) {
          throw new Error(
            'Managed county scheduler integrity violation: expected 1 trigger, found ' +
            scheduler.triggerCount
          );
        }

        /*
         * Invalid/incomplete checkpoint structure fails closed rather than
         * manufacturing workload freshness.
         */
        if (
          cycle.completedFeeds !== cycle.nextFeedIndex ||
          cycle.nextFeedIndex >= ALLOWLIST.length
        ) {
          clearCycle_(props);
          cycle = cycleSnapshot_(props);
        }

        if (!cycle.id) {
          const cycleId =
            'COUNTY-' +
            attemptAt.replace(/[^0-9]/g, '');

          props.setProperty(
            CYCLE_ID,
            cycleId
          );

          props.setProperty(
            CYCLE_STARTED_AT,
            attemptAt
          );

          props.setProperty(
            NEXT_FEED_INDEX,
            '0'
          );

          props.setProperty(
            CYCLE_RESULTS_JSON,
            '[]'
          );

          cycle = cycleSnapshot_(props);
        }
      }

      const feedIndex = cycle.nextFeedIndex;
      const item = ALLOWLIST[feedIndex];
      const currentFeedCursor =
        cycle.currentFeedCursor || '';
      let feedResult;
      let nextCursor = '';

      try {
        const result =
          REOS.CountyRuntimeBridge.sync(
            item.connectorId,
            item.dataset,
            {
              confirmLive: true,
              limit: 50,
              cursor: currentFeedCursor
            }
          );

        /*
         * A page with record-level failures is not checkpoint-safe.
         *
         * Preserve the incoming CURRENT_FEED_CURSOR rather than
         * accepting the adapter's nextCursor. The same source page
         * will therefore remain retry authority.
         */
        if (
          result &&
          result.stats &&
          Number(result.stats.failed || 0) > 0
        ) {
          return {
            ok: false,
            skipped: false,
            status: 'Degraded',
            attemptedAt: attemptAt,
            cycleId: cycle.id,
            feedIndex: feedIndex,
            completedFeeds: cycle.completedFeeds,
            total: ALLOWLIST.length,
            cursor: currentFeedCursor,
            result: result,
            error:
              'County page persistence incomplete: ' +
              Number(result.stats.failed || 0) +
              ' record(s) failed.'
          };
        }

        nextCursor = String(
          result && result.nextCursor
            ? result.nextCursor
            : ''
        );

        /*
         * A non-terminal cursor means only one page completed.
         * Preserve page position without manufacturing completed-feed
         * evidence or advancing complete-workload freshness.
         */
        if (nextCursor) {
          props.setProperty(
            CURRENT_FEED_CURSOR,
            nextCursor
          );

          return {
            ok: true,
            skipped: false,
            status: 'In Progress',
            attemptedAt: attemptAt,
            cycleId: cycle.id,
            feedIndex: feedIndex,
            completedFeeds: cycle.completedFeeds,
            total: ALLOWLIST.length,
            cursor: nextCursor,
            result: result
          };
        }

        feedResult = {
          connectorId: item.connectorId,
          dataset: item.dataset,
          ok: true,
          result: result
        };
      } catch (error) {
        feedResult = {
          connectorId: item.connectorId,
          dataset: item.dataset,
          ok: false,
          error: String(
            error && error.message
              ? error.message
              : error
          )
        };
      }

      /*
       * Terminal success or a failed page ends this feed attempt.
       * Only now may completed-feed evidence and the feed index advance.
       */
      props.deleteProperty(
        CURRENT_FEED_CURSOR
      );

      const results =
        cycle.results.concat([feedResult]);

      const nextFeedIndex = feedIndex + 1;

      props.setProperty(
        CYCLE_RESULTS_JSON,
        JSON.stringify(results)
      );

      props.setProperty(
        NEXT_FEED_INDEX,
        String(nextFeedIndex)
      );

      if (nextFeedIndex < ALLOWLIST.length) {
        return {
          ok: feedResult.ok,
          skipped: false,
          status: feedResult.ok
            ? 'In Progress'
            : 'Degraded',
          attemptedAt: attemptAt,
          cycleId: cycle.id,
          feedIndex: feedIndex,
          completedFeeds: nextFeedIndex,
          total: ALLOWLIST.length,
          result: feedResult
        };
      }

      const completedAt = nowIso_();
      const failures =
        results.filter(function (result) {
          return result.ok !== true;
        }).length;

      const finalResult = {
        cycleId: cycle.id,
        attemptedAt: cycle.startedAt,
        completedAt: completedAt,
        total: ALLOWLIST.length,
        succeeded: ALLOWLIST.length - failures,
        failed: failures,
        results: results
      };

      props.setProperty(
        LAST_RESULT_JSON,
        JSON.stringify(finalResult)
      );

      clearCycle_(props);

      if (failures > 0) {
        const failureAt = completedAt;
        const message =
          'County production scheduler completed with ' +
          failures +
          ' failed dataset(s) out of ' +
          ALLOWLIST.length +
          '.';

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
          lastResult: JSON.stringify(finalResult)
        };
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
        attemptedAt: cycle.startedAt,
        completedAt: completedAt,
        total: ALLOWLIST.length,
        succeeded: ALLOWLIST.length,
        failed: 0,
        results: results
      };
    } catch (error) {
      lockOutcome =
        'ERROR';

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

      if (
        lockObservation &&
        REOS.ScriptLockObservability &&
        typeof REOS.ScriptLockObservability
          .end ===
          'function'
      ) {
        REOS.ScriptLockObservability
          .end(
            lockObservation,
            lockOutcome,
            {
              handler:
                HANDLER,
              mode:
                isManual
                  ? 'manual'
                  : 'scheduled'
            }
          );
      }
    }
  }

  function run() {
    return runInternal_({
      mode: 'scheduled'
    });
  }

  function runManualCertification(
    expectedCycleId,
    expectedFeedIndex,
    expectedCursor
  ) {
    requireAdmin_();

    return runInternal_({
      mode: 'manual',
      expectedCycleId: expectedCycleId,
      expectedFeedIndex: expectedFeedIndex,
      expectedCursor: expectedCursor
    });
  }

  return {
    installScheduler: installScheduler,
    removeScheduler: removeScheduler,
    getStatus: getStatus,
    getCheckpoint: function () {
      return cycleSnapshot_(properties_());
    },
    retireCheckpoint: function (expectedCycleId) {
      requireAdmin_();

      const props = properties_();
      const cycle = cycleSnapshot_(props);
      const expected = String(expectedCycleId || '').trim();

      if (!expected) {
        throw new Error(
          'Expected county scheduler cycle ID is required.'
        );
      }

      if (!cycle.id) {
        return {
          ok: true,
          retired: false,
          reason: 'No active checkpoint.',
          checkpoint: cycle
        };
      }

      if (cycle.id !== expected) {
        throw new Error(
          'County scheduler checkpoint changed; expected ' +
          expected +
          ', found ' +
          cycle.id +
          '.'
        );
      }

      const retired = {
        id: cycle.id,
        startedAt: cycle.startedAt,
        nextFeedIndex: cycle.nextFeedIndex,
        currentFeedCursor: cycle.currentFeedCursor,
        completedFeeds: cycle.completedFeeds,
        totalFeeds: cycle.totalFeeds,
        results: cycle.results
      };

      clearCycle_(props);

      const after = cycleSnapshot_(props);

      if (
        after.id ||
        after.startedAt ||
        after.nextFeedIndex !== 0 ||
        after.currentFeedCursor ||
        after.completedFeeds !== 0 ||
        after.results.length !== 0
      ) {
        throw new Error(
          'County scheduler checkpoint retirement verification failed.'
        );
      }

      return {
        ok: true,
        retired: true,
        retiredCheckpoint: retired,
        checkpoint: after
      };
    },
    getProvenance: function () {
      const props = properties_();

      return {
        installedAt:
          props.getProperty(INSTALLED_AT) || '',
        removedAt:
          props.getProperty(REMOVED_AT) || ''
      };
    },
    getTaxDelinquentEndpoint: function () {
      return properties_().getProperty(
        'REOS_COUNTY_PA_PHILADELPHIA_TAX_DELINQUENT_URL'
      ) || '';
    },
    preflight: preflight,
    runManualCertification:
      runManualCertification,
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

function reosCountyProductionSchedulerCheckpoint() {
  return REOS.CountyProductionScheduler.getCheckpoint();
}

function reosCountyProductionSchedulerRetireCheckpoint(
  expectedCycleId
) {
  return REOS.CountyProductionScheduler.retireCheckpoint(
    expectedCycleId
  );
}

function reosCountyProductionSchedulerProvenance() {
  return REOS.CountyProductionScheduler.getProvenance();
}

function reosCountyTaxDelinquentEndpointDiagnostic() {
  return REOS.CountyProductionScheduler.getTaxDelinquentEndpoint();
}

function reosCountyProductionSchedulerPreflight() {
  return REOS.CountyProductionScheduler.preflight();
}

function reosCountyProductionSchedulerRunManualCertification(
  expectedCycleId,
  expectedFeedIndex,
  expectedCursor
) {
  return REOS.CountyProductionScheduler.runManualCertification(
    expectedCycleId,
    expectedFeedIndex,
    expectedCursor
  );
}

function reosCountyProductionSchedulerRun() {
  return REOS.CountyProductionScheduler.run();
}
