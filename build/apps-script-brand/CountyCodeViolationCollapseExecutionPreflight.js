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
      '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

    var EXPECTED_AUTHORITY_SHA256 =
      '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

    var EXPECTED_ELIGIBLE_GROUPS = 20;
    var EXPECTED_ELIGIBLE_ROWS = 42;
    var EXPECTED_DIRECT_KEEP_GROUPS = 14;
    var EXPECTED_OBSERVATION_MERGE_GROUPS = 6;
    var EXPECTED_DELETE_CANDIDATES = 22;
    var EXPECTED_BLOCKED_GROUPS = 2;

    var CONFLICT_BLOCKED_GROUP = 1;
    var REFERENCE_BLOCKED_GROUP = 3;

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
          REFERENCE_BLOCKED_GROUP
        ) ===
          -1,
        'Blocked collapse group entered eligible winner plan.'
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
        blockedNumbers.length === 2 &&
        blockedNumbers[0] ===
          CONFLICT_BLOCKED_GROUP &&
        blockedNumbers[1] ===
          REFERENCE_BLOCKED_GROUP,
        'Expected blocked collapse groups changed.'
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
        'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
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
          REFERENCE_BLOCKED_GROUP,

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
