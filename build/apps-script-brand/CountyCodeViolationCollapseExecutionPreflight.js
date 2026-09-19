/**
 * REOS Enterprise
 *
 * Gate 2 - Philadelphia code-violation collapse execution preflight.
 *
 * READ ONLY.
 *
 * This module verifies that the already-certified collapse winner plan
 * still matches its exact production evidence and that the county
 * production scheduler/checkpoint remain frozen.
 *
 * IMPORTANT:
 * A certified one-row physical-delete primitive exists at this authority
 * boundary, but no certified collapse executor exists to bind that
 * primitive to the winner plan, observation preservation, reference
 * clearance, row-shift re-resolution, residual verification, and
 * uncertain-outcome reconciliation requirements.
 *
 * Therefore this preflight MUST NOT grant collapse execution,
 * winner-selection, delete, repair, migration, scheduler, checkpoint,
 * connector, production-mutation, or automatic-offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseExecutionPreflight =
  (function () {
    'use strict';

    var MODE =
      'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT';

    var EXPECTED_WINNER_PLAN_MODE =
      'READ_ONLY_CODE_VIOLATION_COLLAPSE_WINNER_PLAN';

    var EXPECTED_WINNER_PLAN_FINGERPRINT =
      '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

    var EXPECTED_AUTHORITY_SHA256 =
      '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

    var EXPECTED_ELIGIBLE_GROUPS = 20;
    var EXPECTED_ELIGIBLE_ROWS = 42;
    var EXPECTED_DIRECT_KEEP_GROUPS = 14;
    var EXPECTED_OBSERVATION_MERGE_GROUPS = 6;
    var EXPECTED_DELETE_CANDIDATES = 22;
    var EXPECTED_BLOCKED_GROUPS = 1;

    var CONFLICT_BLOCKED_GROUP = 1;

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
        'Collapse execution preflight requires Admin authority.'
      );

      assert_(
        REOS.Database &&
        typeof REOS.Database
          .deletePhysicalRowExact ===
          'function',
        'Certified physical-row delete primitive is required.'
      );

      assert_(
        REOS.CountyCodeViolationCollapseWinnerPlan &&
        typeof REOS
          .CountyCodeViolationCollapseWinnerPlan
          .buildPlan ===
          'function',
        'Certified collapse winner plan is required.'
      );

      assert_(
        REOS.CountyCodeViolationGroup3PostRestorationEvidence &&
        typeof REOS
          .CountyCodeViolationGroup3PostRestorationEvidence
          .read ===
          'function',
        'Certified Group 3 post-restoration evidence is required.'
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
        typeof ScriptApp !== 'undefined' &&
        ScriptApp &&
        typeof ScriptApp.getProjectTriggers ===
          'function',
        'Installable-trigger read authority is required.'
      );
    }


    function managedSchedulerSnapshot_() {
      var triggers =
        ScriptApp.getProjectTriggers();

      var managed =
        triggers.filter(function (trigger) {
          return (
            trigger &&
            typeof trigger.getHandlerFunction ===
              'function' &&
            text_(
              trigger.getHandlerFunction()
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


    function assertNoAuthority_(plan) {
      [
        'winnerSelectionAuthorityGranted',
        'collapseAuthorityGranted',
        'deleteAuthorityGranted',
        'productionDataMutationAuthorityGranted',
        'repairAuthorityGranted',
        'migrationAuthorityGranted',
        'connectorExecutionAuthorityGranted',
        'checkpointMutationAuthorityGranted',
        'schedulerAuthorityGranted',
        'automaticOfferAuthorityGranted'
      ].forEach(function (field) {
        assert_(
          plan[field] === false,
          'Winner plan unexpectedly grants authority: ' +
            field
        );
      });
    }


    function assertGroup3PostRestorationEvidence_() {
      var evidence =
        REOS
          .CountyCodeViolationGroup3PostRestorationEvidence
          .read({});

      assert_(
        evidence &&
        evidence.ok === true &&
        evidence.readOnly === true &&
        evidence.schedulerFrozen === true &&
        evidence.checkpointFrozen === true &&
        evidence.evidenceStable === true &&
        evidence.group3AlreadyRestored === true &&
        evidence.group3ReexecutionRequired === false,
        'Group 3 post-restoration evidence changed.'
      );

      assert_(
        evidence.countySurvivor &&
        Number(
          evidence.countySurvivor.rowNumber
        ) === 767 &&
        text_(
          evidence.countySurvivor.distressLeadId
        ) ===
          'DL-20260820181647-4170',
        'Group 3 county survivor evidence changed.'
      );

      assert_(
        evidence.zillowRestoration &&
        Number(
          evidence.zillowRestoration.rowNumber
        ) === 771 &&
        text_(
          evidence.zillowRestoration.distressLeadId
        ) ===
          'ZIL-20260820193920-1756',
        'Group 3 Zillow restoration evidence changed.'
      );

      assert_(
        evidence.downstreamReference &&
        Number(
          evidence.downstreamReference.rowNumber
        ) === 38 &&
        Number(
          evidence.downstreamReference.columnNumber
        ) === 13 &&
        text_(
          evidence.downstreamReference.distressLeadId
        ) ===
          'ZIL-20260820193920-1756',
        'Group 3 downstream-reference evidence changed.'
      );

      [
        'productionDataMutationAuthorityGranted',
        'collapseAuthorityGranted',
        'winnerSelectionAuthorityGranted',
        'deleteAuthorityGranted',
        'physicalDeleteAuthorityGranted',
        'repairAuthorityGranted',
        'migrationAuthorityGranted',
        'referenceRewriteAuthorityGranted',
        'schedulerMutationAuthorityGranted',
        'checkpointMutationAuthorityGranted',
        'connectorExecutionAuthorityGranted',
        'group3ReexecutionAuthorityGranted',
        'automaticOfferAuthorityGranted'
      ].forEach(function (field) {
        assert_(
          evidence[field] === false,
          'Group 3 evidence unexpectedly grants authority: ' +
            field
        );
      });

      return evidence;
    }


    function assertWinnerPlan_() {
      var plan =
        REOS
          .CountyCodeViolationCollapseWinnerPlan
          .buildPlan({});

      assert_(
        plan &&
        plan.ok === true,
        'Collapse winner plan did not return ok=true.'
      );

      assert_(
        text_(plan.mode) ===
          EXPECTED_WINNER_PLAN_MODE,
        'Collapse winner plan mode changed.'
      );

      assert_(
        text_(
          plan.authoritySha256
        ) ===
          EXPECTED_AUTHORITY_SHA256,
        'Collapse winner-plan authority SHA changed.'
      );

      assert_(
        text_(
          plan.planFingerprintSha256
        ) ===
          EXPECTED_WINNER_PLAN_FINGERPRINT,
        'Collapse winner-plan fingerprint changed.'
      );

      assert_(
        Number(
          plan.eligibleGroupCount
        ) ===
          EXPECTED_ELIGIBLE_GROUPS &&
        Number(
          plan.eligibleRowCount
        ) ===
          EXPECTED_ELIGIBLE_ROWS &&
        Number(
          plan.directKeepGroupCount
        ) ===
          EXPECTED_DIRECT_KEEP_GROUPS &&
        Number(
          plan.observationMergeGroupCount
        ) ===
          EXPECTED_OBSERVATION_MERGE_GROUPS &&
        Number(
          plan.deleteCandidateRowCount
        ) ===
          EXPECTED_DELETE_CANDIDATES &&
        Number(
          plan.blockedGroupCount
        ) ===
          EXPECTED_BLOCKED_GROUPS,
        'Collapse winner-plan population changed.'
      );

      assert_(
        Array.isArray(plan.plans) &&
        plan.plans.length ===
          EXPECTED_ELIGIBLE_GROUPS,
        'Collapse winner-plan eligible-group array changed.'
      );

      assert_(
        Array.isArray(
          plan.blockedGroups
        ) &&
        plan.blockedGroups.length ===
          EXPECTED_BLOCKED_GROUPS,
        'Collapse winner-plan blocked-group array changed.'
      );

      var eligibleNumbers =
        plan.plans.map(function (entry) {
          return Number(
            entry.groupNumber
          );
        });

      assert_(
        eligibleNumbers.indexOf(
          CONFLICT_BLOCKED_GROUP
        ) ===
          -1 &&
        eligibleNumbers.indexOf(
          3
        ) ===
          -1,
        'Blocked or removed historical collapse group entered eligible winner plan.'
      );

      var blockedNumbers =
        plan.blockedGroups
          .map(function (entry) {
            return Number(
              entry.groupNumber
            );
          })
          .sort(function (a, b) {
            return a - b;
          });

      assert_(
        blockedNumbers.length === 1 &&
        blockedNumbers[0] ===
          CONFLICT_BLOCKED_GROUP,
        'Expected blocked collapse group changed.'
      );

      assertNoAuthority_(plan);

      return plan;
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

      options = options || {};

      assert_(
        Object.keys(options).length ===
          0,
        'Caller-defined collapse execution authority is prohibited.'
      );

      var schedulerBefore =
        assertSchedulerFrozen_();

      var checkpointBefore =
        frozenCheckpoint_();

      var group3Evidence =
        assertGroup3PostRestorationEvidence_();

      var winnerPlan =
        assertWinnerPlan_();

      var checkpointAfter =
        frozenCheckpoint_();

      var schedulerAfter =
        assertSchedulerFrozen_();

      assert_(
        sameCheckpoint_(
          checkpointBefore,
          checkpointAfter
        ),
        'County checkpoint changed during read-only preflight.'
      );

      assert_(
        schedulerBefore.triggerCount ===
          schedulerAfter.triggerCount,
        'County scheduler state changed during read-only preflight.'
      );

      /*
       * Explicit Gate 2 execution blocker.
       *
       * Database.js now exposes the certified exact physical-row delete
       * primitive, but the collapse executor itself is not certified.
       * Primitive availability is not execution authority.
       */
      var blockers = [
        'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
        'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED'
      ];

      return Object.freeze({
        ok:
          true,

        mode:
          MODE,

        winnerPlanFingerprintSha256:
          winnerPlan
            .planFingerprintSha256,

        authoritySha256:
          winnerPlan
            .authoritySha256,

        eligibleGroupCount:
          winnerPlan
            .eligibleGroupCount,

        eligibleRowCount:
          winnerPlan
            .eligibleRowCount,

        directKeepGroupCount:
          winnerPlan
            .directKeepGroupCount,

        observationMergeGroupCount:
          winnerPlan
            .observationMergeGroupCount,

        deleteCandidateRowCount:
          winnerPlan
            .deleteCandidateRowCount,

        blockedGroupCount:
          winnerPlan
            .blockedGroupCount,

        conflictBlockedGroup:
          CONFLICT_BLOCKED_GROUP,

        referenceBlockedGroup:
          null,

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

        winnerPlanCertified:
          true,

        group3PostRestorationEvidenceCertified:
          true,

        group3CountySurvivorDistressLeadId:
          group3Evidence
            .countySurvivor
            .distressLeadId,

        group3ZillowDistressLeadId:
          group3Evidence
            .zillowRestoration
            .distressLeadId,

        physicalDeletePrimitiveAvailable:
          true,

        executionBlockers:
          blockers.slice(),

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

        group3ReexecutionAuthorityGranted:
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


function reosCountyCodeViolationCollapseExecutionPreflight(options) {
  return REOS
    .CountyCodeViolationCollapseExecutionPreflight
    .preflight(options || {});
}
