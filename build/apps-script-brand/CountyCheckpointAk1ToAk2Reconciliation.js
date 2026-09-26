/**
 * REOS Enterprise
 * County Scheduler AK1 -> AK2 Checkpoint Reconciliation v1
 *
 * Incident-bounded checkpoint-schema reconciliation for the preserved
 * Philadelphia code_violations scheduler cycle.
 *
 * This surface may change exactly one Script Property:
 *
 *   REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR
 *
 * from the certified historical AK1 cursor to the independently proven
 * durable AK2 logical boundary.
 *
 * It does not execute a connector, mutate county lead data, change feed
 * index/results/cycle identity, install/remove triggers, retire a cycle,
 * or grant MAO / automatic-offer authority.
 */
var REOS = REOS || {};

REOS.CountyCheckpointAk1ToAk2Reconciliation =
(function () {
  'use strict';

  const LOCK_WAIT_MS = 5000;

  /*
   * Reuse the already protected checkpoint-recovery writer class.
   * This increment does not widen CountyMutationExclusionLease writer
   * inventory or create a new mutation class.
   */
  const WRITER_ID =
    'COUNTY_CHECKPOINT_RECOVERY';

  const HANDLER =
    'reosCountyProductionSchedulerRun';

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

  const EXPECTED_FEED_INDEX =
    '0';

  const EXPECTED_RESULTS_JSON =
    '[]';

  const EXPECTED_AK1_CURSOR =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

  const RECONCILED_AK2_CURSOR =
    'AK2|PHL-CODE-HIGH-DURABLE-20250901-VIOLATIONNUMBER-V1|1782545296000|VI-2026-047721';


  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation requires admin support.'
      );
    }

    REOS.Security.requireAdmin();
  }


  function assertWriterAllowed_() {
    if (
      !REOS.CountyMutationExclusionLease ||
      typeof REOS.CountyMutationExclusionLease
        .assertWriterAllowed !==
        'function'
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation requires the county mutation-exclusion writer guard.'
      );
    }

    return REOS.CountyMutationExclusionLease
      .assertWriterAllowed({
        writerId: WRITER_ID
      });
  }


  function properties_() {
    if (
      typeof PropertiesService ===
        'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !==
        'function'
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation requires Script Properties.'
      );
    }

    return PropertiesService
      .getScriptProperties();
  }


  function managedTriggerCount_() {
    if (
      typeof ScriptApp ===
        'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !==
        'function'
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation requires trigger inspection.'
      );
    }

    const triggers =
      ScriptApp.getProjectTriggers();

    if (!Array.isArray(triggers)) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation trigger inspection is invalid.'
      );
    }

    return triggers
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger.getHandlerFunction ===
            'function' &&
          trigger.getHandlerFunction() ===
            HANDLER
        );
      })
      .length;
  }


  function rawSnapshot_(props) {
    return {
      id:
        props.getProperty(CYCLE_ID) || '',

      startedAt:
        props.getProperty(
          CYCLE_STARTED_AT
        ) || '',

      nextFeedIndex:
        props.getProperty(
          NEXT_FEED_INDEX
        ),

      currentFeedCursor:
        props.getProperty(
          CURRENT_FEED_CURSOR
        ) || '',

      resultsJson:
        props.getProperty(
          CYCLE_RESULTS_JSON
        ) || ''
    };
  }


  function assertExactLegacyState_(snapshot) {
    if (
      snapshot.id !==
        EXPECTED_CYCLE_ID
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation cycle authority mismatch.'
      );
    }

    if (
      snapshot.startedAt !==
        EXPECTED_STARTED_AT
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation start authority mismatch.'
      );
    }

    if (
      snapshot.nextFeedIndex !==
        EXPECTED_FEED_INDEX
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation feed-index authority mismatch.'
      );
    }

    if (
      snapshot.currentFeedCursor !==
        EXPECTED_AK1_CURSOR
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation cursor authority mismatch.'
      );
    }

    if (
      snapshot.resultsJson !==
        EXPECTED_RESULTS_JSON
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation result authority mismatch.'
      );
    }
  }


  function publicBoundary_() {
    return {
      cycleId:
        EXPECTED_CYCLE_ID,

      startedAt:
        EXPECTED_STARTED_AT,

      nextFeedIndex:
        0,

      completedFeeds:
        0,

      expectedAk1Cursor:
        EXPECTED_AK1_CURSOR,

      reconciledAk2Cursor:
        RECONCILED_AK2_CURSOR,

      durableBoundaryTimestampMs:
        1782545296000,

      durableBoundaryViolationNumber:
        'VI-2026-047721'
    };
  }


  function inspect() {
    requireAdmin_();

    const props =
      properties_();

    const snapshot =
      rawSnapshot_(props);

    const triggerCount =
      managedTriggerCount_();

    let eligible = false;
    let reason = '';

    try {
      assertExactLegacyState_(
        snapshot
      );

      if (triggerCount !== 0) {
        reason =
          'Managed county scheduler must be frozen.';
      } else {
        eligible = true;
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
      eligible: eligible,
      reason: reason,

      triggerCount:
        triggerCount,

      boundary:
        publicBoundary_(),

      reconciliationAuthorityGranted:
        false,

      schedulerMutationAuthorityGranted:
        false,

      connectorExecutionAuthorityGranted:
        false,

      productionDataMutationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }


  function execute(
    confirmReconciliation
  ) {
    requireAdmin_();

    if (
      confirmReconciliation !==
        true
    ) {
      throw new Error(
        'Explicit AK1 to AK2 checkpoint reconciliation confirmation is required.'
      );
    }

    if (
      managedTriggerCount_() !==
        0
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation requires zero managed scheduler triggers.'
      );
    }

    if (
      typeof LockService ===
        'undefined' ||
      !LockService ||
      typeof LockService.getScriptLock !==
        'function'
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation requires ScriptLock support.'
      );
    }

    const lock =
      LockService.getScriptLock();

    if (
      !lock ||
      typeof lock.tryLock !==
        'function' ||
      !lock.tryLock(
        LOCK_WAIT_MS
      )
    ) {
      throw new Error(
        'AK1 to AK2 checkpoint reconciliation lock contention.'
      );
    }

    try {
      /*
       * Reassert scheduler quiescence under the same project ScriptLock
       * used by the county scheduler.
       */
      if (
        managedTriggerCount_() !==
          0
      ) {
        throw new Error(
          'AK1 to AK2 checkpoint reconciliation scheduler authority changed under lock.'
        );
      }

      /*
       * Check the county mutation-exclusion lease after acquiring
       * ScriptLock and before obtaining mutation authority.
       */
      assertWriterAllowed_();

      const props =
        properties_();

      const before =
        rawSnapshot_(props);

      /*
       * Caller input never supplies checkpoint authority.
       * The exact certified incident prestate is revalidated under lock.
       */
      assertExactLegacyState_(
        before
      );

      /*
       * The only authorized persistent change in this module.
       */
      props.setProperty(
        CURRENT_FEED_CURSOR,
        RECONCILED_AK2_CURSOR
      );

      const after =
        rawSnapshot_(props);

      if (
        after.id !==
          EXPECTED_CYCLE_ID ||
        after.startedAt !==
          EXPECTED_STARTED_AT ||
        after.nextFeedIndex !==
          EXPECTED_FEED_INDEX ||
        after.currentFeedCursor !==
          RECONCILED_AK2_CURSOR ||
        after.resultsJson !==
          EXPECTED_RESULTS_JSON
      ) {
        throw new Error(
          'AK1 to AK2 checkpoint reconciliation post-write verification failed.'
        );
      }

      return {
        ok: true,
        reconciled: true,

        cycleId:
          after.id,

        startedAt:
          after.startedAt,

        nextFeedIndex:
          0,

        completedFeeds:
          0,

        previousCursor:
          EXPECTED_AK1_CURSOR,

        currentFeedCursor:
          after.currentFeedCursor,

        results: [],

        checkpointMutationExecuted:
          true,

        checkpointPropertyWriteCount:
          1,

        schedulerMutationAuthorityGranted:
          false,

        connectorExecutionAuthorityGranted:
          false,

        productionDataMutationAuthorityGranted:
          false,

        automaticOfferAuthorityGranted:
          false
      };
    } finally {
      if (
        typeof lock.hasLock !==
          'function' ||
        lock.hasLock()
      ) {
        lock.releaseLock();
      }
    }
  }


  return {
    inspect:
      inspect,

    execute:
      execute
  };
})();


function reosCountyCheckpointAk1ToAk2ReconciliationInspect() {
  return REOS
    .CountyCheckpointAk1ToAk2Reconciliation
    .inspect();
}


function reosCountyCheckpointAk1ToAk2ReconciliationExecute(
  confirmReconciliation
) {
  return REOS
    .CountyCheckpointAk1ToAk2Reconciliation
    .execute(
      confirmReconciliation
    );
}
