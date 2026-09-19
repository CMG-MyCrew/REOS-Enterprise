/**
 * REOS Enterprise
 *
 * Immutable direct-keep collapse execution authority.
 *
 * READ ONLY.
 *
 * This module derives the direct-keep catalog exclusively from the certified
 * collapse-only evidence authority and the already-certified historical
 * winner relationship. Historical row numbers are used only to prove the
 * immutable winner relationship; they are never returned as current mutation
 * authority.
 *
 * No collapse, delete, mutation, scheduler, checkpoint, connector, RPC,
 * deployment, MAO, or automatic-offer authority is granted.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseDirectKeepExecutionAuthority =
  (function () {
    'use strict';

    var EXPECTED_AUTHORITY_SHA256 =
      '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

    var EXPECTED_WINNER_PLAN_FINGERPRINT =
      '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

    var EXPECTED_GROUP_COUNT = 21;
    var EXPECTED_ROW_COUNT = 44;

    var DIRECT_KEEP_GROUPS = [
      2, 4, 5, 6, 7, 8, 9,
      10, 11, 12, 13, 14, 15, 16
    ];

    var EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES = 16;

    function text_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      ).trim();
    }

    function fail_(message) {
      throw new Error(message);
    }

    function requireAuthority_() {
      if (
        !REOS.CountyCodeViolationCollapseOnlyEvidenceAuthority ||
        typeof REOS
          .CountyCodeViolationCollapseOnlyEvidenceAuthority
          .records !== 'function' ||
        typeof REOS
          .CountyCodeViolationCollapseOnlyEvidenceAuthority
          .metadata !== 'function'
      ) {
        fail_(
          'Certified collapse-only evidence authority is required.'
        );
      }

      return REOS
        .CountyCodeViolationCollapseOnlyEvidenceAuthority;
    }

    function buildCatalog_() {
      var authority =
        requireAuthority_();

      var metadata =
        authority.metadata();

      var records =
        authority.records();

      if (
        !metadata ||
        metadata.authoritySha256 !==
          EXPECTED_AUTHORITY_SHA256 ||
        Number(metadata.groupCount) !==
          EXPECTED_GROUP_COUNT ||
        Number(metadata.rowCount) !==
          EXPECTED_ROW_COUNT ||
        !Array.isArray(records) ||
        records.length !==
          EXPECTED_ROW_COUNT
      ) {
        fail_(
          'Certified collapse authority drift.'
        );
      }

      var wanted = {};

      DIRECT_KEEP_GROUPS
        .forEach(function (groupNumber) {
          wanted[groupNumber] = true;
        });

      var groups = {};

      records.forEach(function (record) {
        var groupNumber =
          Number(record.groupNumber);

        if (!wanted[groupNumber]) {
          return;
        }

        groups[groupNumber] =
          groups[groupNumber] || [];

        groups[groupNumber]
          .push(record);
      });

      var catalog = [];
      var deleteCount = 0;

      DIRECT_KEEP_GROUPS
        .forEach(function (groupNumber) {
          var members =
            groups[groupNumber];

          if (
            !Array.isArray(members) ||
            members.length < 2
          ) {
            fail_(
              'Direct-keep authority group is incomplete: ' +
              groupNumber
            );
          }

          members =
            members
              .slice()
              .sort(function (a, b) {
                return (
                  Number(a.rowNumber) -
                  Number(b.rowNumber)
                );
              });

          var winner =
            members[0];

          [
            'violationNumber',
            'proposedDurableKey',
            'canonicalPropertyKey'
          ].forEach(function (field) {
            var expected =
              text_(winner[field]);

            if (!expected) {
              fail_(
                'Direct-keep immutable authority is incomplete for group ' +
                groupNumber +
                ': ' +
                field
              );
            }

            members.forEach(function (member) {
              if (
                text_(member[field]) !==
                expected
              ) {
                fail_(
                  'Direct-keep immutable authority drift for group ' +
                  groupNumber +
                  ': ' +
                  field
                );
              }
            });
          });

          var deleteIds =
            members
              .slice(1)
              .map(function (member) {
                return text_(
                  member.distressLeadId
                );
              });

          if (
            !text_(winner.distressLeadId) ||
            deleteIds.some(function (id) {
              return !id;
            })
          ) {
            fail_(
              'Direct-keep Distress Lead identity is incomplete.'
            );
          }

          deleteCount +=
            deleteIds.length;

          catalog.push(
            Object.freeze({
              groupNumber:
                groupNumber,
              violationNumber:
                text_(winner.violationNumber),
              proposedDurableKey:
                text_(winner.proposedDurableKey),
              canonicalPropertyKey:
                text_(winner.canonicalPropertyKey),
              winnerDistressLeadId:
                text_(winner.distressLeadId),
              deleteCandidateDistressLeadIds:
                Object.freeze(
                  deleteIds.slice()
                )
            })
          );
        });

      if (
        catalog.length !==
          DIRECT_KEEP_GROUPS.length ||
        deleteCount !==
          EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES
      ) {
        fail_(
          'Direct-keep catalog population drift.'
        );
      }

      return catalog;
    }

    function catalog() {
      return Object.freeze(
        buildCatalog_()
          .slice()
      );
    }

    function metadata() {
      var entries =
        buildCatalog_();

      var deleteCount =
        entries.reduce(
          function (sum, entry) {
            return (
              sum +
              entry
                .deleteCandidateDistressLeadIds
                .length
            );
          },
          0
        );

      return Object.freeze({
        mode:
          'READ_ONLY_IMMUTABLE_DIRECT_KEEP_EXECUTION_AUTHORITY',
        authoritySha256:
          EXPECTED_AUTHORITY_SHA256,
        winnerPlanFingerprintSha256:
          EXPECTED_WINNER_PLAN_FINGERPRINT,
        directKeepGroupCount:
          entries.length,
        directKeepDeleteCandidateCount:
          deleteCount,
        directKeepGroups:
          Object.freeze(
            DIRECT_KEEP_GROUPS.slice()
          ),

        collapseExecutionAuthorityGranted:
          false,
        winnerSelectionAuthorityGranted:
          false,
        physicalDeleteAuthorityGranted:
          false,
        productionDataMutationAuthorityGranted:
          false,
        schedulerMutationAuthorityGranted:
          false,
        checkpointMutationAuthorityGranted:
          false,
        connectorExecutionAuthorityGranted:
          false,
        automaticOfferAuthorityGranted:
          false
      });
    }

    return Object.freeze({
      catalog:
        catalog,
      metadata:
        metadata
    });
  })();
