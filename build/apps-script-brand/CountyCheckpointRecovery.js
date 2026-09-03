/**
 * REOS County Production Checkpoint Recovery
 *
 * One-purpose recovery authority for the certified
 * COUNTY-20260902222607805 page-23 scheduler corruption.
 *
 * This module does not execute connectors, mutate lead data,
 * install triggers, retire cycles, or grant offer authority.
 */
var REOS = REOS || {};

REOS.CountyCheckpointRecovery = (function () {
  'use strict';

  const LOCK_WAIT_MS = 5000;

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

  const EXPECTED_CYCLE_ID =
    'COUNTY-20260902222607805';

  const EXPECTED_STARTED_AT =
    '2026-09-02T22:26:07.805Z';

  const EXPECTED_CORRUPT_INDEX = '1';
  const EXPECTED_CORRUPT_CURSOR = '';

  const EXPECTED_FAILED_CONNECTOR =
    'PA-PHILADELPHIA';

  const EXPECTED_FAILED_DATASET =
    'code_violations';

  const RECOVERY_CURSOR =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1764720000000|586498';

  function requireAdmin_() {
    REOS.Security.requireAdmin();
  }

  function properties_() {
    return PropertiesService.getScriptProperties();
  }

  function managedTriggerCount_() {
    return ScriptApp.getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger.getHandlerFunction() ===
          'reosCountyProductionSchedulerRun'
        );
      })
      .length;
  }

  function rawSnapshot_(props) {
    return {
      id: props.getProperty(CYCLE_ID) || '',
      startedAt:
        props.getProperty(CYCLE_STARTED_AT) || '',
      nextFeedIndex:
        props.getProperty(NEXT_FEED_INDEX),
      currentFeedCursor:
        props.getProperty(CURRENT_FEED_CURSOR) || '',
      resultsJson:
        props.getProperty(CYCLE_RESULTS_JSON) || ''
    };
  }

  function parseResults_(raw) {
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(
        'County checkpoint recovery rejected malformed results JSON.'
      );
    }

    if (!Array.isArray(parsed)) {
      throw new Error(
        'County checkpoint recovery rejected non-array results.'
      );
    }

    return parsed;
  }

  function assertCorruptState_(snapshot) {
    if (snapshot.id !== EXPECTED_CYCLE_ID) {
      throw new Error(
        'County checkpoint recovery cycle authority mismatch.'
      );
    }

    if (snapshot.startedAt !== EXPECTED_STARTED_AT) {
      throw new Error(
        'County checkpoint recovery start authority mismatch.'
      );
    }

    if (
      snapshot.nextFeedIndex !==
      EXPECTED_CORRUPT_INDEX
    ) {
      throw new Error(
        'County checkpoint recovery feed-index authority mismatch.'
      );
    }

    if (
      snapshot.currentFeedCursor !==
      EXPECTED_CORRUPT_CURSOR
    ) {
      throw new Error(
        'County checkpoint recovery cursor authority mismatch.'
      );
    }

    const results =
      parseResults_(snapshot.resultsJson);

    if (results.length !== 1) {
      throw new Error(
        'County checkpoint recovery result-count authority mismatch.'
      );
    }

    const result = results[0] || {};

    if (
      result.connectorId !==
        EXPECTED_FAILED_CONNECTOR ||
      result.dataset !==
        EXPECTED_FAILED_DATASET ||
      result.ok !== false ||
      typeof result.error !== 'string' ||
      result.error.indexOf(
        'ArcGIS API error'
      ) === -1 ||
      result.error.indexOf(
        'Invalid query parameters'
      ) === -1
    ) {
      throw new Error(
        'County checkpoint recovery failed-result authority mismatch.'
      );
    }

    return results;
  }

  function inspect() {
    requireAdmin_();

    const props = properties_();
    const snapshot = rawSnapshot_(props);

    let eligible = false;
    let reason = '';

    try {
      assertCorruptState_(snapshot);

      const triggerCount =
        managedTriggerCount_();

      eligible = triggerCount === 0;

      if (!eligible) {
        reason =
          'Managed county scheduler must be frozen.';
      }
    } catch (error) {
      reason = String(
        error && error.message
          ? error.message
          : error
      );
    }

    return {
      ok: true,
      readOnly: true,
      recoveryAuthorityGranted: false,
      eligible: eligible,
      reason: reason,
      expectedCycleId: EXPECTED_CYCLE_ID,
      recoveryFeedIndex: 0,
      recoveryCursor: RECOVERY_CURSOR
    };
  }

  function execute(confirmRecovery) {
    requireAdmin_();

    if (confirmRecovery !== true) {
      throw new Error(
        'Explicit county checkpoint recovery confirmation is required.'
      );
    }

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County checkpoint recovery requires zero managed scheduler triggers.'
      );
    }

    const lock = LockService.getScriptLock();

    if (!lock.tryLock(LOCK_WAIT_MS)) {
      throw new Error(
        'County checkpoint recovery lock contention.'
      );
    }

    try {
      /*
       * Recheck all recovery authority under the same ScriptLock used by
       * county scheduler execution. No caller-provided checkpoint state
       * can manufacture authority.
       */
      if (managedTriggerCount_() !== 0) {
        throw new Error(
          'County checkpoint recovery scheduler authority changed under lock.'
        );
      }

      const props = properties_();
      const before = rawSnapshot_(props);

      assertCorruptState_(before);

      /*
       * Restore the exact last independently proven page-22 authority.
       *
       * code_violations is not completed, so completed-feed evidence
       * must return to [] and NEXT_FEED_INDEX must return to 0.
       */
      props.setProperty(
        NEXT_FEED_INDEX,
        '0'
      );

      props.setProperty(
        CURRENT_FEED_CURSOR,
        RECOVERY_CURSOR
      );

      props.setProperty(
        CYCLE_RESULTS_JSON,
        '[]'
      );

      const after = rawSnapshot_(props);

      if (
        after.id !== EXPECTED_CYCLE_ID ||
        after.startedAt !== EXPECTED_STARTED_AT ||
        after.nextFeedIndex !== '0' ||
        after.currentFeedCursor !==
          RECOVERY_CURSOR ||
        after.resultsJson !== '[]'
      ) {
        throw new Error(
          'County checkpoint recovery post-write verification failed.'
        );
      }

      return {
        ok: true,
        recovered: true,
        cycleId: after.id,
        nextFeedIndex: 0,
        completedFeeds: 0,
        currentFeedCursor:
          after.currentFeedCursor,
        results: []
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
    inspect: inspect,
    execute: execute
  };
})();

function reosCountyCheckpointRecoveryInspect() {
  return REOS.CountyCheckpointRecovery.inspect();
}

function reosCountyCheckpointRecoveryExecute(
  confirmRecovery
) {
  return REOS.CountyCheckpointRecovery.execute(
    confirmRecovery
  );
}
