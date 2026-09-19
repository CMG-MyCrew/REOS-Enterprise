/**
 * REOS Enterprise
 *
 * Gate 2 - Philadelphia code-violation collapse winner plan.
 *
 * READ ONLY.
 *
 * This module derives a deterministic candidate winner plan from:
 *   1. the certified post-restoration 21-group / 44-row collapse-only authority,
 *   2. independently verified current full-row evidence, and
 *   3. a complete downstream Distress Lead ID reference scan.
 *
 * It grants NO winner-selection, collapse, delete, repair, migration,
 * scheduler, checkpoint, connector, production mutation, or offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseWinnerPlan =
  (function () {
    var EXPECTED_AUTHORITY_SHA256 =
      '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

    var EXPECTED_GROUP_COUNT = 21;
    var EXPECTED_ROW_COUNT = 44;

    var EXPECTED_ELIGIBLE_GROUPS = 20;
    var EXPECTED_ELIGIBLE_ROWS = 42;
    var EXPECTED_DIRECT_KEEP_GROUPS = 14;
    var EXPECTED_OBSERVATION_MERGE_GROUPS = 6;
    var EXPECTED_DELETE_CANDIDATES = 22;

    var CONFLICT_BLOCKED_GROUP = 1;

    var IDENTITY_FIELDS = {
      'Source': true,
      'Source Dataset': true,
      'Source Record ID': true,
      'Source Record Key': true,
      'Source Observation Key': true,
      'Violation Number': true,
      'Canonical Property Key': true,
      'Parcel ID': true,
      'Address': true,
      'City': true,
      'State': true,
      'Zip': true,
      'County': true
    };

    var PROVENANCE_FIELDS = {
      'Distress Lead ID': true,
      'Created At': true,
      'Updated At': true,
      'Last Seen At': true,
      'Connector Run ID': true
    };

    function text_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      ).trim();
    }

    function blank_(value) {
      return (
        value === undefined ||
        value === null ||
        (
          typeof value === 'string' &&
          value.trim() === ''
        )
      );
    }

    function valueKey_(value) {
      return JSON.stringify(value);
    }

    function time_(value) {
      if (
        value &&
        typeof value.getTime === 'function'
      ) {
        var direct =
          value.getTime();

        if (!isNaN(direct)) {
          return direct;
        }
      }

      var source =
        text_(value);

      if (!source) {
        return null;
      }

      var parsed =
        Date.parse(source);

      if (!isFinite(parsed)) {
        throw new Error(
          'Collapse winner plan encountered invalid timestamp: ' +
          source
        );
      }

      return parsed;
    }

    function iso_(value) {
      var timestamp =
        time_(value);

      return timestamp === null
        ? ''
        : new Date(timestamp).toISOString();
    }

    function requireDependencies_() {
      if (
        !REOS.Security ||
        typeof REOS.Security.requireAdmin !==
          'function'
      ) {
        throw new Error(
          'Collapse winner plan requires Admin authority.'
        );
      }

      if (
        !REOS
          .CountyCodeViolationCollapseOnlyEvidenceAuthority ||
        typeof REOS
          .CountyCodeViolationCollapseOnlyEvidenceAuthority
          .records !== 'function' ||
        typeof REOS
          .CountyCodeViolationCollapseOnlyEvidenceAuthority
          .metadata !== 'function'
      ) {
        throw new Error(
          'Certified collapse-only authority is required.'
        );
      }

      if (
        !REOS
          .CountyCodeViolationCollapseFullRowEvidence ||
        typeof REOS
          .CountyCodeViolationCollapseFullRowEvidence
          .exportEvidence !== 'function'
      ) {
        throw new Error(
          'Certified full-row collapse evidence is required.'
        );
      }

      if (
        !REOS.CountyIdentityReferenceAudit ||
        typeof REOS.CountyIdentityReferenceAudit.audit !==
          'function'
      ) {
        throw new Error(
          'Downstream reference audit is required.'
        );
      }

      if (
        typeof Utilities === 'undefined' ||
        !Utilities ||
        typeof Utilities.computeDigest !==
          'function'
      ) {
        throw new Error(
          'SHA-256 digest authority is required.'
        );
      }
    }

    function sha256Hex_(value) {
      var bytes =
        Utilities.computeDigest(
          Utilities.DigestAlgorithm.SHA_256,
          String(value),
          Utilities.Charset.UTF_8
        );

      return bytes.map(function (byte) {
        var n =
          Number(byte);

        if (n < 0) {
          n += 256;
        }

        return (
          '0' +
          n.toString(16)
        ).slice(-2);
      }).join('');
    }

    function analyzeBusiness_(members) {
      var fields = {};

      members.forEach(function (member) {
        Object.keys(
          member.values || {}
        ).forEach(function (field) {
          if (
            !IDENTITY_FIELDS[field] &&
            !PROVENANCE_FIELDS[field]
          ) {
            fields[field] = true;
          }
        });
      });

      var conflicts = [];
      var oneSided = [];

      Object.keys(fields)
        .sort()
        .forEach(function (field) {
          var populated =
            members
              .map(function (member) {
                return {
                  distressLeadId:
                    member.distressLeadId,
                  value:
                    member.values[field]
                };
              })
              .filter(function (entry) {
                return !blank_(entry.value);
              });

          var distinct = {};

          populated.forEach(function (entry) {
            distinct[
              valueKey_(entry.value)
            ] = entry.value;
          });

          var distinctKeys =
            Object.keys(distinct);

          if (distinctKeys.length > 1) {
            conflicts.push({
              field:
                field,
              values:
                distinctKeys.map(
                  function (key) {
                    return distinct[key];
                  }
                )
            });

            return;
          }

          if (
            distinctKeys.length === 1 &&
            populated.length < members.length
          ) {
            oneSided.push({
              field:
                field,
              value:
                distinct[
                  distinctKeys[0]
                ],
              presentOn:
                populated.map(
                  function (entry) {
                    return entry
                      .distressLeadId;
                  }
                )
            });
          }
        });

      return {
        conflicts:
          conflicts,
        oneSided:
          oneSided
      };
    }

    function sortLineage_(a, b) {
      var ac =
        time_(
          a.values['Created At']
        );

      var bc =
        time_(
          b.values['Created At']
        );

      if (
        ac === null &&
        bc === null
      ) {
        return (
          a.rowNumber -
          b.rowNumber
        );
      }

      if (ac === null) {
        return 1;
      }

      if (bc === null) {
        return -1;
      }

      return (
        ac - bc ||
        a.rowNumber -
          b.rowNumber
      );
    }

    function sortObservation_(a, b) {
      var al =
        time_(
          a.values['Last Seen At']
        );

      var bl =
        time_(
          b.values['Last Seen At']
        );

      var au =
        time_(
          a.values['Updated At']
        );

      var bu =
        time_(
          b.values['Updated At']
        );

      return (
        (
          bl === null
            ? -Infinity
            : bl
        ) -
        (
          al === null
            ? -Infinity
            : al
        ) ||
        (
          bu === null
            ? -Infinity
            : bu
        ) -
        (
          au === null
            ? -Infinity
            : au
        ) ||
        b.rowNumber -
          a.rowNumber
      );
    }

    function exactFields_(entries) {
      return entries
        .map(function (entry) {
          return entry.field;
        })
        .sort();
    }

    function buildPlan(options) {
      requireDependencies_();
      REOS.Security.requireAdmin();

      options = options || {};

      if (Object.keys(options).length) {
        throw new Error(
          'Caller-defined collapse winner-plan authority is prohibited.'
        );
      }

      var authority =
        REOS
          .CountyCodeViolationCollapseOnlyEvidenceAuthority;

      var metadata =
        authority.metadata();

      var records =
        authority.records();

      if (
        metadata.authoritySha256 !==
          EXPECTED_AUTHORITY_SHA256 ||
        metadata.groupCount !==
          EXPECTED_GROUP_COUNT ||
        metadata.rowCount !==
          EXPECTED_ROW_COUNT ||
        records.length !==
          EXPECTED_ROW_COUNT
      ) {
        throw new Error(
          'Certified collapse authority drift.'
        );
      }

      var evidence =
        REOS
          .CountyCodeViolationCollapseFullRowEvidence
          .exportEvidence({});

      if (
        !evidence ||
        evidence.ok !== true ||
        evidence.authoritySha256 !==
          EXPECTED_AUTHORITY_SHA256 ||
        evidence.certifiedGroupCount !==
          EXPECTED_GROUP_COUNT ||
        evidence.certifiedRowCount !==
          EXPECTED_ROW_COUNT ||
        evidence.returnedRowCount !==
          EXPECTED_ROW_COUNT ||
        !Array.isArray(evidence.rows) ||
        evidence.rows.length !==
          EXPECTED_ROW_COUNT
      ) {
        throw new Error(
          'Certified full-row evidence drift.'
        );
      }

      var requestedIds =
        records.map(function (record) {
          return text_(
            record.distressLeadId
          );
        });

      var referenceAudit =
        REOS.CountyIdentityReferenceAudit.audit({
          distressLeadIds:
            requestedIds,
          maxMatches:
            1000,
          readBatchSize:
            250
        });

      if (
        !referenceAudit ||
        referenceAudit.ok !== true ||
        referenceAudit.scanComplete !== true ||
        referenceAudit.truncated !== false ||
        Number(
          referenceAudit.requestedIdCount
        ) !== EXPECTED_ROW_COUNT
      ) {
        throw new Error(
          'Downstream reference audit is incomplete.'
        );
      }

      if (
        referenceAudit.matchesTruncated !== false ||
        Number(
          referenceAudit.matchedIdCount
        ) !== 0 ||
        Number(
          referenceAudit.matchCount
        ) !== 0 ||
        Number(
          referenceAudit.retainedMatchCount
        ) !== 0 ||
        !Array.isArray(
          referenceAudit.matches
        ) ||
        referenceAudit.matches.length !== 0 ||
        !Array.isArray(
          referenceAudit.unmatchedIds
        ) ||
        referenceAudit.unmatchedIds.length !==
          EXPECTED_ROW_COUNT ||
        !Array.isArray(
          referenceAudit.requestedIds
        ) ||
        JSON.stringify(
          referenceAudit.requestedIds
        ) !==
          JSON.stringify(
            requestedIds
          ) ||
        JSON.stringify(
          referenceAudit.unmatchedIds
        ) !==
          JSON.stringify(
            requestedIds
          )
      ) {
        throw new Error(
          'Post-restoration collapse cohort downstream reference drift.'
        );
      }

      var authorityById = {};
      var groups = {};

      records.forEach(function (record) {
        var id =
          text_(
            record.distressLeadId
          );

        var groupNumber =
          Number(
            record.groupNumber
          );

        if (
          !id ||
          authorityById[id]
        ) {
          throw new Error(
            'Certified collapse authority membership drift.'
          );
        }

        authorityById[id] =
          record;

        groups[groupNumber] =
          groups[groupNumber] || [];

        groups[groupNumber]
          .push(record);
      });

      if (
        Object.keys(groups).length !==
        EXPECTED_GROUP_COUNT
      ) {
        throw new Error(
          'Certified collapse group-count drift.'
        );
      }

      var fullById = {};

      evidence.rows.forEach(
        function (row) {
          var id =
            text_(
              row.distressLeadId
            );

          if (
            !id ||
            fullById[id]
          ) {
            throw new Error(
              'Full-row evidence membership drift.'
            );
          }

          fullById[id] = row;
        }
      );

      var plans = [];
      var blocked = [];

      var eligibleRows = 0;
      var directKeepGroups = 0;
      var observationMergeGroups = 0;
      var deleteCandidateRows = 0;

      Object.keys(groups)
        .map(Number)
        .sort(function (a, b) {
          return a - b;
        })
        .forEach(function (groupNumber) {
          var authorityMembers =
            groups[groupNumber];

          var members =
            authorityMembers.map(
              function (record) {
                var full =
                  fullById[
                    record.distressLeadId
                  ];

                if (!full) {
                  throw new Error(
                    'Missing certified full-row member: ' +
                    record.distressLeadId
                  );
                }

                return {
                  groupNumber:
                    groupNumber,
                  rowNumber:
                    Number(
                      record.rowNumber
                    ),
                  distressLeadId:
                    record.distressLeadId,
                  violationNumber:
                    record.violationNumber,
                  proposedDurableKey:
                    record.proposedDurableKey,
                  canonicalPropertyKey:
                    record.canonicalPropertyKey,
                  values:
                    full.values || {}
                };
              }
            );

          var business =
            analyzeBusiness_(
              members
            );

          if (
            groupNumber ===
            CONFLICT_BLOCKED_GROUP
          ) {
            var conflictFields =
              exactFields_(
                business.conflicts
              );

            var expectedConflicts = [
              'Tax Interest',
              'Tax Penalty',
              'Tax Principal'
            ];

            if (
              JSON.stringify(
                conflictFields
              ) !==
              JSON.stringify(
                expectedConflicts
              ) ||
              business.oneSided.length !== 0
            ) {
              throw new Error(
                'Group 1 review-blocked condition drift.'
              );
            }

            blocked.push({
              groupNumber:
                groupNumber,
              violationNumber:
                members[0]
                  .violationNumber,
              reason:
                'BUSINESS_VALUE_CONFLICT',
              conflictFields:
                conflictFields,
              referenceConstrained:
                false
            });

            return;
          }

          if (
            business.conflicts.length ||
            business.oneSided.length
          ) {
            throw new Error(
              'Eligible collapse group business equivalence drift: ' +
              groupNumber
            );
          }

          eligibleRows +=
            members.length;

          var lineage =
            members
              .slice()
              .sort(
                sortLineage_
              );

          var observation =
            members
              .slice()
              .sort(
                sortObservation_
              );

          var winner =
            lineage[0];

          var latest =
            observation[0];

          var lowestPhysical =
            members
              .slice()
              .sort(
                function (a, b) {
                  return (
                    a.rowNumber -
                    b.rowNumber
                  );
                }
              )[0];

          if (
            winner.distressLeadId !==
            lowestPhysical.distressLeadId
          ) {
            throw new Error(
              'Lineage winner no longer equals lowest certified physical row for group ' +
              groupNumber
            );
          }

          if (
            !text_(
              latest.values[
                'Last Seen At'
              ]
            ) ||
            !text_(
              latest.values[
                'Connector Run ID'
              ]
            )
          ) {
            throw new Error(
              'Latest observation provenance is incomplete for group ' +
              groupNumber
            );
          }

          var needsMerge =
            winner.distressLeadId !==
              latest.distressLeadId;

          if (needsMerge) {
            observationMergeGroups += 1;
          } else {
            directKeepGroups += 1;
          }

          var deleteCandidates =
            members
              .filter(
                function (member) {
                  return (
                    member
                      .distressLeadId !==
                    winner
                      .distressLeadId
                  );
                }
              )
              .map(
                function (member) {
                  return {
                    distressLeadId:
                      member
                        .distressLeadId,
                    rowNumber:
                      member
                        .rowNumber
                  };
                }
              );

          deleteCandidateRows +=
            deleteCandidates.length;

          plans.push({
            groupNumber:
              groupNumber,

            violationNumber:
              winner
                .violationNumber,

            proposedDurableKey:
              winner
                .proposedDurableKey,

            canonicalPropertyKey:
              winner
                .canonicalPropertyKey,

            winner: {
              distressLeadId:
                winner
                  .distressLeadId,
              rowNumber:
                winner
                  .rowNumber,
              createdAt:
                iso_(
                  winner.values[
                    'Created At'
                  ]
                )
            },

            latestObservation: {
              distressLeadId:
                latest
                  .distressLeadId,
              lastSeenAt:
                iso_(
                  latest.values[
                    'Last Seen At'
                  ]
                ),
              connectorRunId:
                text_(
                  latest.values[
                    'Connector Run ID'
                  ]
                )
            },

            action:
              needsMerge
                ? 'MERGE_LATEST_OBSERVATION_THEN_COLLAPSE'
                : 'KEEP_WINNER_AND_COLLAPSE',

            deleteCandidates:
              deleteCandidates
          });
        });

      if (
        plans.length !==
          EXPECTED_ELIGIBLE_GROUPS ||
        eligibleRows !==
          EXPECTED_ELIGIBLE_ROWS ||
        directKeepGroups !==
          EXPECTED_DIRECT_KEEP_GROUPS ||
        observationMergeGroups !==
          EXPECTED_OBSERVATION_MERGE_GROUPS ||
        deleteCandidateRows !==
          EXPECTED_DELETE_CANDIDATES
      ) {
        throw new Error(
          'Deterministic collapse winner-plan population drift.'
        );
      }

      var mergeGroups =
        plans
          .filter(function (plan) {
            return (
              plan.action ===
              'MERGE_LATEST_OBSERVATION_THEN_COLLAPSE'
            );
          })
          .map(function (plan) {
            return plan.groupNumber;
          });

      if (
        JSON.stringify(
          mergeGroups
        ) !==
        JSON.stringify(
          [17, 18, 19, 20, 21, 22]
        )
      ) {
        throw new Error(
          'Observation-merge group membership drift.'
        );
      }

      if (
        blocked.length !== 1 ||
        blocked[0].groupNumber !== 1
      ) {
        throw new Error(
          'Blocked collapse group membership drift.'
        );
      }

      var planFingerprint =
        sha256Hex_(
          JSON.stringify({
            authoritySha256:
              metadata
                .authoritySha256,
            referenceAudit: {
              requestedIdCount:
                EXPECTED_ROW_COUNT,
              matchedIdCount:
                0,
              matchCount:
                0,
              retainedMatchCount:
                0,
              scanComplete:
                true,
              truncated:
                false,
              matchesTruncated:
                false
            },
            plans:
              plans,
            blocked:
              blocked
          })
        );

      return {
        ok:
          true,

        mode:
          'READ_ONLY_CODE_VIOLATION_COLLAPSE_WINNER_PLAN',

        authoritySha256:
          metadata
            .authoritySha256,

        sourceEvidenceSha256:
          metadata
            .sourceEvidenceSha256,

        planFingerprintSha256:
          planFingerprint,

        certifiedGroupCount:
          EXPECTED_GROUP_COUNT,

        certifiedRowCount:
          EXPECTED_ROW_COUNT,

        eligibleGroupCount:
          plans.length,

        eligibleRowCount:
          eligibleRows,

        directKeepGroupCount:
          directKeepGroups,

        observationMergeGroupCount:
          observationMergeGroups,

        deleteCandidateRowCount:
          deleteCandidateRows,

        blockedGroupCount:
          blocked.length,

        plans:
          plans,

        blockedGroups:
          blocked,

        referenceAudit: {
          requestedIdCount:
            EXPECTED_ROW_COUNT,
          scanComplete:
            true,
          truncated:
            false,
          matchesTruncated:
            false,
          matchedIdCount:
            0,
          matchCount:
            0,
          retainedMatchCount:
            0
        },

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
      };
    }

    return Object.freeze({
      buildPlan:
        buildPlan
    });
  })();


function reosCountyCodeViolationCollapseWinnerPlan(options) {
  return REOS
    .CountyCodeViolationCollapseWinnerPlan
    .buildPlan(options || {});
}
