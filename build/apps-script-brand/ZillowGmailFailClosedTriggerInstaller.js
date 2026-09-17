/**
 * REOS Enterprise - Zillow Gmail fail-closed trigger installer.
 *
 * Narrow authority:
 *
 * - acquire the Apps Script script lock;
 * - inspect the live project-trigger inventory while holding that lock;
 * - if one matching Zillow scheduled handler exists, return without mutation;
 * - if multiple matching handlers exist, fail closed without mutation;
 * - if none exist, create exactly one 15-minute time-driven trigger;
 * - re-read the trigger inventory under the same lock after creation;
 * - never delete, replace, or modify any existing trigger.
 *
 * This module does not execute the Zillow connector, Gmail operations,
 * acquisition ingestion, county scheduling, production data mutation,
 * MAO generation, or offer generation.
 */
var REOS = REOS || {};

REOS.ZillowGmailFailClosedTriggerInstaller = (function () {
  'use strict';

  var HANDLER = 'reosZillowGmailScheduledSync';
  var CADENCE_MINUTES = 15;
  var LOCK_WAIT_MILLISECONDS = 5000;

  function requireRuntime_() {
    if (
      typeof LockService === 'undefined' ||
      !LockService ||
      typeof LockService.getScriptLock !== 'function'
    ) {
      throw new Error(
        'LockService.getScriptLock is required.'
      );
    }

    if (
      typeof ScriptApp === 'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !== 'function' ||
      typeof ScriptApp.newTrigger !== 'function'
    ) {
      throw new Error(
        'ScriptApp project-trigger APIs are required.'
      );
    }
  }

  function matchingTriggers_() {
    var triggers =
      ScriptApp.getProjectTriggers();

    if (!Array.isArray(triggers)) {
      throw new Error(
        'Project trigger inventory is unavailable.'
      );
    }

    return triggers.filter(function (trigger) {
      if (
        !trigger ||
        typeof trigger.getHandlerFunction !== 'function'
      ) {
        throw new Error(
          'Project trigger inventory contains an unreadable trigger.'
        );
      }

      return String(
        trigger.getHandlerFunction() || ''
      ) === HANDLER;
    });
  }

  function baseResult_(status, existingCount) {
    return {
      ok:
        status !== 'LOCK_BUSY' &&
        status !== 'DUPLICATE_PRESENT',

      status: status,

      handler: HANDLER,
      cadenceMinutes: CADENCE_MINUTES,
      lockWaitMilliseconds:
        LOCK_WAIT_MILLISECONDS,

      existingTriggerCount:
        Number(existingCount || 0),

      createdTriggerCount: 0,

      triggerMutationExecuted: false,
      triggerDeleteExecuted: false,

      connectorExecutionExecuted: false,
      gmailExecutionExecuted: false,
      schedulerMutationExecuted: false,
      productionDataMutationExecuted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function install() {
    requireRuntime_();

    var lock =
      LockService.getScriptLock();

    if (
      !lock ||
      typeof lock.tryLock !== 'function' ||
      typeof lock.releaseLock !== 'function'
    ) {
      throw new Error(
        'A releasable script lock is required.'
      );
    }

    if (
      !lock.tryLock(
        LOCK_WAIT_MILLISECONDS
      )
    ) {
      return baseResult_(
        'LOCK_BUSY',
        0
      );
    }

    try {
      /*
       * JIT inventory read occurs only after the script lock
       * has been acquired.
       */
      var existing =
        matchingTriggers_();

      if (existing.length === 1) {
        return baseResult_(
          'ALREADY_PRESENT',
          1
        );
      }

      /*
       * Multiple copies are anomalous.
       *
       * This installer has no delete/reconciliation authority,
       * so it leaves every trigger untouched and fails closed.
       */
      if (existing.length > 1) {
        return baseResult_(
          'DUPLICATE_PRESENT',
          existing.length
        );
      }

      /*
       * Exactly zero matching handlers exist while we hold the
       * script lock. This is the sole mutation surface.
       */
      var triggerBuilder =
        ScriptApp.newTrigger(
          HANDLER
        );

      if (
        !triggerBuilder ||
        typeof triggerBuilder.timeBased !== 'function'
      ) {
        throw new Error(
          'Time-driven trigger builder is unavailable.'
        );
      }

      var timeBuilder =
        triggerBuilder.timeBased();

      if (
        !timeBuilder ||
        typeof timeBuilder.everyMinutes !== 'function'
      ) {
        throw new Error(
          'Minute-cadence trigger builder is unavailable.'
        );
      }

      var cadenceBuilder =
        timeBuilder.everyMinutes(
          CADENCE_MINUTES
        );

      if (
        !cadenceBuilder ||
        typeof cadenceBuilder.create !== 'function'
      ) {
        throw new Error(
          'Trigger create operation is unavailable.'
        );
      }

      cadenceBuilder.create();

      /*
       * Re-read under the same lock. Never attempt cleanup here.
       * Any invariant failure requires separate live reconciliation
       * before another invocation.
       */
      var verified =
        matchingTriggers_();

      if (verified.length !== 1) {
        throw new Error(
          'Post-create Zillow trigger invariant failed; ' +
          'reconcile live trigger state before any retry. observed=' +
          verified.length
        );
      }

      var result =
        baseResult_(
          'CREATED',
          0
        );

      result.createdTriggerCount = 1;
      result.triggerMutationExecuted = true;

      return result;
    } finally {
      lock.releaseLock();
    }
  }

  return {
    handler: HANDLER,
    cadenceMinutes: CADENCE_MINUTES,
    lockWaitMilliseconds:
      LOCK_WAIT_MILLISECONDS,

    install: install
  };
})();

/**
 * Explicit operator entrypoint.
 *
 * Calling this function is a production trigger mutation authorization
 * boundary and must not be invoked merely because this source is deployed.
 */
function reosZillowGmailInstallTriggerFailClosed() {
  return REOS
    .ZillowGmailFailClosedTriggerInstaller
    .install();
}
