/**
 * REOS Enterprise
 *
 * Post-delete-repeatable Code Violations collapse execution preflight v2.
 *
 * READ ONLY.
 *
 * This successor preflight uses immutable direct-keep authority plus current
 * residual evidence instead of reusing original physical row positions.
 *
 * The certified executor blocker remains mandatory. This module never returns
 * collapseExecutionReady=true and grants no mutation authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseExecutionPreflightV2 =
  (function () {
    'use strict';

    var MODE =
      'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT_V2';

    var EXPECTED_AUTHORITY_SHA256 =
      '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

    var EXPECTED_WINNER_PLAN_FINGERPRINT =
      '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

    var EXPECTED_CERTIFIED_ROWS = 44;
    var EXPECTED_DIRECT_KEEP_GROUPS = 14;
    var EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES = 16;

    var COUNTY_SCHEDULER_HANDLER =
      'reosCountyProductionSchedulerRun';

    var EXPECTED_CYCLE =
      'COUNTY-20260902222607805';

    var EXPECTED_FEED_INDEX = 0;

    var EXPECTED_CURSOR =
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

    function text_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      ).trim();
    }

    function assert_(condition, message) {
      if (!condition) {
        throw new Error(message);
      }
    }

    function requireDependencies_() {
      assert_(
        REOS.Security &&
        typeof REOS.Security.requireAdmin ===
          'function',
        'Successor collapse preflight requires Admin authority.'
      );

      assert_(
        REOS.Database &&
        typeof REOS.Database.deletePhysicalRowExact ===
          'function',
        'Certified physical-row delete primitive is required.'
      );

      assert_(
        REOS.CountyCodeViolationCollapseDirectKeepExecutionAuthority &&
        typeof REOS
          .CountyCodeViolationCollapseDirectKeepExecutionAuthority
          .metadata ===
          'function',
        'Immutable direct-keep execution authority is required.'
      );

      assert_(
        REOS.CountyCodeViolationCollapseResidualEvidence &&
        typeof REOS
          .CountyCodeViolationCollapseResidualEvidence
          .read ===
          'function',
        'Current residual evidence is required.'
      );

      assert_(
        REOS.CountyProductionScheduler &&
        typeof REOS
          .CountyProductionScheduler
          .getCheckpoint ===
          'function',
        'County scheduler checkpoint read authority is required.'
      );

      assert_(
        typeof ScriptApp !==
          'undefined' &&
        ScriptApp &&
        typeof ScriptApp.getProjectTriggers ===
          'function',
        'Installable-trigger read authority is required.'
      );
    }

    function managedSchedulerSnapshot_() {
      var triggers =
        ScriptApp
          .getProjectTriggers();

      var managed =
        triggers
          .filter(function (trigger) {
            return (
              trigger &&
              typeof trigger.getHandlerFunction ===
                'function' &&
              text_(
                trigger
                  .getHandlerFunction()
              ) ===
                COUNTY_SCHEDULER_HANDLER
            );
          });

      return {
        handler:
          COUNTY_SCHEDULER_HANDLER,
        triggerCount:
          managed.length,
        triggerIds:
          managed.map(function (trigger) {
            return (
              typeof trigger.getUniqueId ===
                'function'
            )
              ? text_(
                trigger.getUniqueId()
              )
              : '';
          })
      };
    }

    function assertSchedulerFrozen_() {
      var snapshot =
        managedSchedulerSnapshot_();

      assert_(
        snapshot.triggerCount === 0,
        'County production scheduler is not frozen.'
      );

      return snapshot;
    }

    function frozenCheckpoint_() {
      var checkpoint =
        REOS.CountyProductionScheduler
          .getCheckpoint();

      assert_(
        checkpoint &&
        text_(checkpoint.id) ===
          EXPECTED_CYCLE &&
        Number(
          checkpoint.nextFeedIndex
        ) ===
          EXPECTED_FEED_INDEX &&
        text_(
          checkpoint.currentFeedCursor
        ) ===
          EXPECTED_CURSOR &&
        Number(
          checkpoint.completedFeeds
        ) ===
          0 &&
        Number(
          checkpoint.totalFeeds
        ) ===
          4 &&
        Array.isArray(
          checkpoint.results
        ) &&
        checkpoint.results.length ===
          0,
        'Frozen county checkpoint authority changed.'
      );

      return {
        id:
          text_(checkpoint.id),
        nextFeedIndex:
          Number(
            checkpoint.nextFeedIndex
          ),
        currentFeedCursor:
          text_(
            checkpoint.currentFeedCursor
          ),
        completedFeeds:
          Number(
            checkpoint.completedFeeds
          ),
        totalFeeds:
          Number(
            checkpoint.totalFeeds
          ),
        resultCount:
          checkpoint.results.length
      };
    }

    function sameCheckpoint_(
      before,
      after
    ) {
      return (
        before.id === after.id &&
        before.nextFeedIndex ===
          after.nextFeedIndex &&
        before.currentFeedCursor ===
          after.currentFeedCursor &&
        before.completedFeeds ===
          after.completedFeeds &&
        before.totalFeeds ===
          after.totalFeeds &&
        before.resultCount ===
          after.resultCount
      );
    }

    function preflight(options) {
      requireDependencies_();
      REOS.Security.requireAdmin();

      options =
        options || {};

      assert_(
        Object.keys(options).length ===
          0,
        'Caller-defined collapse execution authority is prohibited.'
      );

      var schedulerBefore =
        assertSchedulerFrozen_();

      var checkpointBefore =
        frozenCheckpoint_();

      var authority =
        REOS
          .CountyCodeViolationCollapseDirectKeepExecutionAuthority
          .metadata();

      assert_(
        authority &&
        authority.authoritySha256 ===
          EXPECTED_AUTHORITY_SHA256 &&
        authority.winnerPlanFingerprintSha256 ===
          EXPECTED_WINNER_PLAN_FINGERPRINT &&
        Number(
          authority.directKeepGroupCount
        ) ===
          EXPECTED_DIRECT_KEEP_GROUPS &&
        Number(
          authority.directKeepDeleteCandidateCount
        ) ===
          EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES,
        'Immutable direct-keep authority changed.'
      );

      var residual =
        REOS
          .CountyCodeViolationCollapseResidualEvidence
          .read({});

      assert_(
        residual &&
        residual.ok === true &&
        residual.authoritySha256 ===
          EXPECTED_AUTHORITY_SHA256 &&
        residual.winnerPlanFingerprintSha256 ===
          EXPECTED_WINNER_PLAN_FINGERPRINT &&
        Number(
          residual.certifiedRowCount
        ) ===
          EXPECTED_CERTIFIED_ROWS &&
        Number(
          residual.currentCertifiedRowCount
        ) +
        Number(
          residual.verifiedDeletedCount
        ) ===
          EXPECTED_CERTIFIED_ROWS &&
        Number(
          residual.remainingDirectKeepDeleteCandidateCount
        ) +
        Number(
          residual.verifiedDeletedCount
        ) ===
          EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES,
        'Current residual evidence changed.'
      );

      var checkpointAfter =
        frozenCheckpoint_();

      var schedulerAfter =
        assertSchedulerFrozen_();

      assert_(
        sameCheckpoint_(
          checkpointBefore,
          checkpointAfter
        ),
        'County checkpoint changed during successor preflight.'
      );

      assert_(
        schedulerBefore.triggerCount ===
          schedulerAfter.triggerCount,
        'County scheduler state changed during successor preflight.'
      );

      var blockers = [
        'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
      ];

      if (
        residual.executionBlocked ===
          true
      ) {
        blockers.push(
          'UNRESOLVED_COLLAPSE_OPERATION_HISTORY'
        );
      }

      return Object.freeze({
        ok:
          true,
        mode:
          MODE,

        authoritySha256:
          EXPECTED_AUTHORITY_SHA256,
        winnerPlanFingerprintSha256:
          EXPECTED_WINNER_PLAN_FINGERPRINT,

        schedulerBefore:
          schedulerBefore,
        schedulerAfter:
          schedulerAfter,
        checkpointBefore:
          checkpointBefore,
        checkpointAfter:
          checkpointAfter,

        schedulerFrozen:
          true,
        checkpointFrozen:
          true,

        certifiedRowCount:
          residual.certifiedRowCount,
        currentCertifiedRowCount:
          residual.currentCertifiedRowCount,
        verifiedDeletedCount:
          residual.verifiedDeletedCount,
        remainingDirectKeepDeleteCandidateCount:
          residual
            .remainingDirectKeepDeleteCandidateCount,

        uncertainOperationIds:
          residual
            .uncertainOperationIds
            .slice(),

        physicalDeletePrimitiveAvailable:
          true,

        executionBlockers:
          blockers,

        collapseExecutionReady:
          false,

        executionAuthorityGranted:
          false,
        winnerSelectionAuthorityGranted:
          false,
        collapseAuthorityGranted:
          false,
        deleteAuthorityGranted:
          false,
        physicalDeleteAuthorityGranted:
          false,
        productionDataMutationAuthorityGranted:
          false,
        repairAuthorityGranted:
          false,
        migrationAuthorityGranted:
          false,
        connectorExecutionAuthorityGranted:
          false,
        checkpointMutationAuthorityGranted:
          false,
        schedulerAuthorityGranted:
          false,
        automaticOfferAuthorityGranted:
          false
      });
    }

    return Object.freeze({
      preflight:
        preflight
    });
  })();
