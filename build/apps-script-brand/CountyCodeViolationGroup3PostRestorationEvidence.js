/**
 * REOS Enterprise
 *
 * Philadelphia Code Violations - Group 3 Post-Restoration Evidence v1
 *
 * READ ONLY.
 *
 * Independently proves the already-restored Group 3 production state:
 *
 * - county row 767 remains the sole county observation;
 * - physical row 771 remains the restored Zillow Gmail lead;
 * - Zillow import row 38 / column 13 remains unchanged;
 * - the county scheduler remains frozen;
 * - the exact frozen checkpoint remains unchanged;
 * - two complete snapshots remain identical.
 *
 * This module performs no repair, replacement, collapse, delete,
 * reference rewrite, scheduler mutation, checkpoint mutation,
 * connector execution, MAO, or offer generation.
 */

var REOS = REOS || {};

REOS.CountyCodeViolationGroup3PostRestorationEvidence =
  (function () {
    'use strict';

    var MODE =
      'READ_ONLY_GROUP3_POST_RESTORATION_EVIDENCE';

    var TABLE =
      'DISTRESS_LEADS';

    var IMPORT_TABLE =
      'ZILLOW_GMAIL_IMPORTS';

    var SCHEDULER_HANDLER =
      'reosCountyProductionSchedulerRun';

    var CHECKPOINT_ID =
      'COUNTY-20260902222607805';

    var CHECKPOINT_CURSOR =
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

    var COUNTY_ID =
      'DL-20260820181647-4170';

    var COUNTY_ROW =
      767;

    var COUNTY_SOURCE_RECORD_ID =
      '28';

    var VIOLATION_NUMBER =
      'VI-2026-045359';

    var COUNTY_CREATED_AT =
      '2026-08-20T18:16:47.000Z';

    var ZILLOW_ID =
      'ZIL-20260820193920-1756';

    var ZILLOW_ROW =
      771;

    var ZILLOW_CREATED_AT =
      '2026-08-20T19:39:20.000Z';

    var ZILLOW_MESSAGE_ID =
      '1a02188c24fd2e2c';

    var ZILLOW_SOURCE_KEY =
      'zillow gmail|gmail_leads|1a02188c24fd2e2c';

    var IMPORT_ROW =
      38;

    var REFERENCE_COLUMN =
      13;

    function fail_(message) {
      throw new Error(
        'Group 3 post-restoration evidence: ' +
        message
      );
    }

    function text_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      ).trim();
    }

    function safeValue_(value) {
      if (
        value === undefined ||
        value === null
      ) {
        return value;
      }

      if (
        Object.prototype
          .toString
          .call(value) ===
        '[object Date]'
      ) {
        return value.toISOString();
      }

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return value;
      }

      if (Array.isArray(value)) {
        return value.map(
          safeValue_
        );
      }

      if (typeof value === 'object') {
        var copy = {};

        Object.keys(value)
          .sort()
          .forEach(function (key) {
            if (
              typeof value[key] !==
              'function'
            ) {
              copy[key] =
                safeValue_(
                  value[key]
                );
            }
          });

        return copy;
      }

      return String(value);
    }

    function exactEqual_(left, right) {
      return (
        JSON.stringify(
          safeValue_(left)
        ) ===
        JSON.stringify(
          safeValue_(right)
        )
      );
    }

    function requireDependencies_() {
      if (
        !REOS.Security ||
        typeof REOS.Security.requireAdmin !==
          'function'
      ) {
        fail_(
          'Admin authority is required.'
        );
      }

      if (
        !REOS.Database ||
        typeof REOS.Database.getAll !==
          'function' ||
        typeof REOS.Database.getHeaders !==
          'function'
      ) {
        fail_(
          'Read-only Database authority is required.'
        );
      }

      if (
        !REOS.CountyProductionScheduler ||
        typeof REOS.CountyProductionScheduler
          .getCheckpoint !==
          'function'
      ) {
        fail_(
          'County checkpoint read authority is required.'
        );
      }

      if (
        !REOS
          .CountyCodeViolationGroup3ZillowRestorationContract ||
        typeof REOS
          .CountyCodeViolationGroup3ZillowRestorationContract
          .contract !==
          'function'
      ) {
        fail_(
          'Certified Group 3 restoration contract is required.'
        );
      }

      if (
        typeof ScriptApp === 'undefined' ||
        !ScriptApp ||
        typeof ScriptApp.getProjectTriggers !==
          'function'
      ) {
        fail_(
          'Installable-trigger read authority is required.'
        );
      }
    }

    function exactOptions_(options) {
      if (
        options === undefined ||
        options === null
      ) {
        return {};
      }

      if (
        typeof options !== 'object' ||
        Array.isArray(options) ||
        Object.prototype
          .toString
          .call(options) !==
          '[object Object]'
      ) {
        fail_(
          'Options must be an object.'
        );
      }

      if (
        Object.keys(options).length !==
          0
      ) {
        fail_(
          'Caller-defined post-restoration evidence authority is prohibited.'
        );
      }

      return options;
    }

    function contract_() {
      var contract =
        REOS
          .CountyCodeViolationGroup3ZillowRestorationContract
          .contract();

      if (
        !contract ||
        !contract.countySurvivor ||
        !contract.zillowRestoration ||
        !contract.downstreamReference
      ) {
        fail_(
          'Group 3 restoration contract is incomplete.'
        );
      }

      if (
        text_(
          contract.countySurvivor
            .distressLeadId
        ) !==
          COUNTY_ID ||
        Number(
          contract.countySurvivor
            .physicalRow
        ) !==
          COUNTY_ROW ||
        text_(
          contract.zillowRestoration
            .distressLeadId
        ) !==
          ZILLOW_ID ||
        Number(
          contract.zillowRestoration
            .physicalRow
        ) !==
          ZILLOW_ROW ||
        Number(
          contract.zillowRestoration
            .sourceImportRow
        ) !==
          IMPORT_ROW ||
        text_(
          contract.zillowRestoration
            .sourceRecordId
        ) !==
          ZILLOW_MESSAGE_ID ||
        Number(
          contract.downstreamReference
            .rowNumber
        ) !==
          IMPORT_ROW ||
        Number(
          contract.downstreamReference
            .columnNumber
        ) !==
          REFERENCE_COLUMN ||
        text_(
          contract.downstreamReference
            .distressLeadId
        ) !==
          ZILLOW_ID
      ) {
        fail_(
          'Group 3 restoration contract identity changed.'
        );
      }

      [
        'executionAuthorityGranted',
        'repairAuthorityGranted',
        'referenceRewriteAuthorityGranted',
        'deleteAuthorityGranted',
        'checkpointMutationAuthorityGranted',
        'schedulerAuthorityGranted',
        'connectorExecutionAuthorityGranted',
        'automaticOfferAuthorityGranted'
      ].forEach(function (field) {
        if (
          contract[field] !==
            false
        ) {
          fail_(
            'Group 3 restoration contract unexpectedly grants authority: ' +
            field
          );
        }
      });

      return contract;
    }

    function managedTriggerCount_() {
      return ScriptApp
        .getProjectTriggers()
        .filter(function (trigger) {
          return (
            trigger.getHandlerFunction() ===
            SCHEDULER_HANDLER
          );
        })
        .length;
    }

    function frozenCheckpoint_() {
      var checkpoint =
        REOS.CountyProductionScheduler
          .getCheckpoint();

      if (
        !checkpoint ||
        text_(checkpoint.id) !==
          CHECKPOINT_ID ||
        Number(
          checkpoint.nextFeedIndex
        ) !==
          0 ||
        text_(
          checkpoint.currentFeedCursor
        ) !==
          CHECKPOINT_CURSOR ||
        Number(
          checkpoint.completedFeeds
        ) !==
          0 ||
        Number(
          checkpoint.totalFeeds
        ) !==
          4 ||
        !Array.isArray(
          checkpoint.results
        ) ||
        checkpoint.results.length !==
          0
      ) {
        fail_(
          'Frozen county checkpoint authority changed.'
        );
      }

      return {
        id:
          CHECKPOINT_ID,

        nextFeedIndex:
          0,

        currentFeedCursor:
          CHECKPOINT_CURSOR,

        completedFeeds:
          0,

        totalFeeds:
          4,

        results:
          []
      };
    }

    function uniqueById_(
      rows,
      id,
      label
    ) {
      var matches =
        rows.filter(function (row) {
          return (
            text_(
              row[
                'Distress Lead ID'
              ]
            ) ===
            id
          );
        });

      if (matches.length !== 1) {
        fail_(
          label +
          ' must resolve to exactly one persisted row.'
        );
      }

      return matches[0];
    }

    function rowByNumber_(
      rows,
      rowNumber,
      label
    ) {
      var matches =
        rows.filter(function (row) {
          return (
            Number(
              row._rowNumber || 0
            ) ===
            rowNumber
          );
        });

      if (matches.length !== 1) {
        fail_(
          label +
          ' must resolve to exactly one physical row.'
        );
      }

      return matches[0];
    }

    function assertBlank_(
      row,
      field,
      label
    ) {
      if (
        text_(row[field]) !==
          ''
      ) {
        fail_(
          label +
          ' must be blank: ' +
          field
        );
      }
    }

    function capture_(
      contract
    ) {
      var triggerCount =
        managedTriggerCount_();

      if (triggerCount !== 0) {
        fail_(
          'County scheduler must remain frozen.'
        );
      }

      var checkpoint =
        frozenCheckpoint_();

      var distressHeaders =
        REOS.Database
          .getHeaders(
            TABLE
          );

      var distressRows =
        REOS.Database
          .getAll(
            TABLE
          );

      var county =
        uniqueById_(
          distressRows,
          COUNTY_ID,
          'County survivor'
        );

      var zillow =
        uniqueById_(
          distressRows,
          ZILLOW_ID,
          'Restored Zillow lead'
        );

      if (
        Number(
          county._rowNumber || 0
        ) !==
          COUNTY_ROW
      ) {
        fail_(
          'County survivor moved from physical row 767.'
        );
      }

      if (
        Number(
          zillow._rowNumber || 0
        ) !==
          ZILLOW_ROW
      ) {
        fail_(
          'Restored Zillow lead moved from physical row 771.'
        );
      }

      if (
        text_(
          county.Source
        ) !==
          'PA-PHILADELPHIA' ||
        text_(
          county[
            'Source Dataset'
          ]
        ) !==
          'code_violations' ||
        text_(
          county[
            'Source Record ID'
          ]
        ) !==
          COUNTY_SOURCE_RECORD_ID ||
        text_(
          county[
            'Violation Number'
          ]
        ) !==
          VIOLATION_NUMBER ||
        !exactEqual_(
          county[
            'Created At'
          ],
          COUNTY_CREATED_AT
        )
      ) {
        fail_(
          'County survivor authority changed.'
        );
      }

      if (
        text_(
          zillow.Source
        ) !==
          'Zillow Gmail' ||
        text_(
          zillow[
            'Source Dataset'
          ]
        ) !==
          'gmail_leads' ||
        text_(
          zillow[
            'Source Record ID'
          ]
        ) !==
          ZILLOW_MESSAGE_ID ||
        text_(
          zillow[
            'Source Record Key'
          ]
        ) !==
          ZILLOW_SOURCE_KEY ||
        text_(
          zillow[
            'Source Observation Key'
          ]
        ) !==
          ZILLOW_SOURCE_KEY ||
        !exactEqual_(
          zillow[
            'Created At'
          ],
          ZILLOW_CREATED_AT
        )
      ) {
        fail_(
          'Restored Zillow identity or immutable lineage changed.'
        );
      }

      var projection =
        contract
          .zillowRestoration
          .projection;

      Object.keys(
        projection
      ).forEach(function (field) {
        if (
          distressHeaders
            .indexOf(field) ===
          -1
        ) {
          return;
        }

        if (
          !exactEqual_(
            zillow[field],
            projection[field]
          )
        ) {
          fail_(
            'Restored Zillow projection changed: ' +
            field
          );
        }
      });

      contract
        .zillowRestoration
        .clearCountyFields
        .forEach(function (field) {
          if (
            distressHeaders
              .indexOf(field) ===
              -1 ||
            Object.prototype
              .hasOwnProperty
              .call(
                projection,
                field
              )
          ) {
            return;
          }

          assertBlank_(
            zillow,
            field,
            'Restored Zillow county field'
          );
        });

      [
        'Violation Number',
        'Violation Type',
        'Violation Status',
        'Violation Amount'
      ].forEach(function (field) {
        if (
          distressHeaders
            .indexOf(field) !==
            -1
        ) {
          assertBlank_(
            zillow,
            field,
            'Restored Zillow violation field'
          );
        }
      });

      var importHeaders =
        REOS.Database
          .getHeaders(
            IMPORT_TABLE
          );

      if (
        importHeaders.length <
          REFERENCE_COLUMN ||
        text_(
          importHeaders[
            REFERENCE_COLUMN - 1
          ]
        ) !==
          'Distress Lead ID'
      ) {
        fail_(
          'Zillow downstream-reference column authority changed.'
        );
      }

      var importRows =
        REOS.Database
          .getAll(
            IMPORT_TABLE
          );

      var importRow =
        rowByNumber_(
          importRows,
          IMPORT_ROW,
          'Zillow import'
        );

      if (
        text_(
          importRow[
            'Gmail Message ID'
          ]
        ) !==
          ZILLOW_MESSAGE_ID ||
        text_(
          importRow[
            'Distress Lead ID'
          ]
        ) !==
          ZILLOW_ID
      ) {
        fail_(
          'Zillow import provenance/reference authority changed.'
        );
      }

      if (
        managedTriggerCount_() !==
          0
      ) {
        fail_(
          'County scheduler changed during evidence capture.'
        );
      }

      var checkpointAfter =
        frozenCheckpoint_();

      if (
        !exactEqual_(
          checkpoint,
          checkpointAfter
        )
      ) {
        fail_(
          'County checkpoint changed during evidence capture.'
        );
      }

      return {
        scheduler: {
          triggerCount:
            0
        },

        checkpoint:
          checkpoint,

        countySurvivor: {
          rowNumber:
            COUNTY_ROW,

          distressLeadId:
            COUNTY_ID,

          createdAt:
            safeValue_(
              county[
                'Created At'
              ]
            ),

          source:
            text_(
              county.Source
            ),

          sourceDataset:
            text_(
              county[
                'Source Dataset'
              ]
            ),

          sourceRecordId:
            text_(
              county[
                'Source Record ID'
              ]
            ),

          violationNumber:
            text_(
              county[
                'Violation Number'
              ]
            )
        },

        zillowRestoration: {
          rowNumber:
            ZILLOW_ROW,

          distressLeadId:
            ZILLOW_ID,

          createdAt:
            safeValue_(
              zillow[
                'Created At'
              ]
            ),

          source:
            text_(
              zillow.Source
            ),

          sourceDataset:
            text_(
              zillow[
                'Source Dataset'
              ]
            ),

          sourceRecordId:
            text_(
              zillow[
                'Source Record ID'
              ]
            ),

          sourceRecordKey:
            text_(
              zillow[
                'Source Record Key'
              ]
            ),

          sourceObservationKey:
            text_(
              zillow[
                'Source Observation Key'
              ]
            )
        },

        zillowImport: {
          rowNumber:
            IMPORT_ROW,

          gmailMessageId:
            text_(
              importRow[
                'Gmail Message ID'
              ]
            ),

          distressLeadId:
            text_(
              importRow[
                'Distress Lead ID'
              ]
            )
        },

        downstreamReference: {
          sheet:
            IMPORT_TABLE,

          rowNumber:
            IMPORT_ROW,

          columnNumber:
            REFERENCE_COLUMN,

          columnName:
            'Distress Lead ID',

          distressLeadId:
            ZILLOW_ID
        }
      };
    }

    function authorityFree_(
      details
    ) {
      return Object.assign(
        {},
        details || {},
        {
          productionDataMutationAuthorityGranted:
            false,

          collapseAuthorityGranted:
            false,

          winnerSelectionAuthorityGranted:
            false,

          deleteAuthorityGranted:
            false,

          physicalDeleteAuthorityGranted:
            false,

          repairAuthorityGranted:
            false,

          migrationAuthorityGranted:
            false,

          referenceRewriteAuthorityGranted:
            false,

          schedulerMutationAuthorityGranted:
            false,

          checkpointMutationAuthorityGranted:
            false,

          connectorExecutionAuthorityGranted:
            false,

          group3ReexecutionAuthorityGranted:
            false,

          automaticOfferAuthorityGranted:
            false
        }
      );
    }

    function read(options) {
      requireDependencies_();

      REOS.Security.requireAdmin();

      exactOptions_(
        options
      );

      var contract =
        contract_();

      var before =
        capture_(
          contract
        );

      var after =
        capture_(
          contract
        );

      if (
        !exactEqual_(
          before,
          after
        )
      ) {
        fail_(
          'Post-restoration production evidence changed between snapshots.'
        );
      }

      return authorityFree_({
        ok:
          true,

        readOnly:
          true,

        mode:
          MODE,

        schedulerFrozen:
          true,

        checkpointFrozen:
          true,

        evidenceStable:
          true,

        group3AlreadyRestored:
          true,

        group3ReexecutionRequired:
          false,

        countySurvivor:
          before.countySurvivor,

        zillowRestoration:
          before.zillowRestoration,

        zillowImport:
          before.zillowImport,

        downstreamReference:
          before.downstreamReference,

        checkpoint:
          before.checkpoint
      });
    }

    return Object.freeze({
      read:
        read
    });
  })();


function reosCountyCodeViolationGroup3PostRestorationEvidence(
  options
) {
  return REOS
    .CountyCodeViolationGroup3PostRestorationEvidence
    .read(
      options
    );
}
