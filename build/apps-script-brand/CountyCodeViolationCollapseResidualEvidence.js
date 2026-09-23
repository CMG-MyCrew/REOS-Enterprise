/**
 * REOS Enterprise
 *
 * Post-delete Code Violations collapse residual evidence.
 *
 * READ ONLY.
 *
 * Missing certified IDs require exactly one verified-success delete history.
 *
 * Every non-incident missing target also retains the exact-one total-history
 * invariant. The exact certified Group 2 post-success incident is separately
 * recognized only when its exact historical precondition-failed history and
 * exactly one verified-success history form the exact two-history set.
 *
 * Current physical row numbers are evidence only.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseResidualEvidence =
  (function () {
    'use strict';

    var TABLE =
      'DISTRESS_LEADS';

    var CONNECTOR =
      'PA-PHILADELPHIA';

    var DATASET =
      'code_violations';

    var EXPECTED_AUTHORITY_SHA256 =
      '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

    var EXPECTED_WINNER_PLAN_FINGERPRINT =
      '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

    var EXPECTED_CERTIFIED_ROWS = 44;
    var EXPECTED_CERTIFIED_GROUPS = 21;
    var EXPECTED_DIRECT_KEEP_GROUPS = 14;
    var EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES = 16;

    var GROUP2_POSTSUCCESS_GROUP_ = 2;

    var GROUP2_POSTSUCCESS_WINNER_ =
      'DL-20260820181645-7130';

    var GROUP2_POSTSUCCESS_TARGET_ =
      'DL-20260820181652-6183';

    var GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_ =
      '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

    var GROUP2_POSTSUCCESS_PREPARED_EVENT_SHA256_ =
      '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

    var GROUP2_POSTSUCCESS_PREPARED_PAYLOAD_SHA256_ =
      '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

    var GROUP2_POSTSUCCESS_TERMINAL_EVENT_SHA256_ =
      '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89';

    var GROUP2_POSTSUCCESS_TERMINAL_PAYLOAD_SHA256_ =
      '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2';

    var GROUP2_POSTSUCCESS_HISTORICAL_RECOVERY_ =
      'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

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

    function assertEqual_(
      actual,
      expected,
      label,
      id
    ) {
      if (
        text_(actual) !==
        text_(expected)
      ) {
        fail_(
          'Residual certified identity drift: ' +
          label +
          ' mismatch for ' +
          id
        );
      }
    }

    function assertExactGroup2HistoricalEvent_(
      event,
      sequence,
      eventType,
      eventSha256,
      payloadSha256,
      previousEventSha256
    ) {
      var manifest =
        event &&
        event.manifest;

      if (
        !manifest ||
        text_(manifest.operationId) !==
          GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_ ||
        Number(manifest.eventSequence) !==
          sequence ||
        text_(manifest.eventType) !==
          eventType ||
        Number(manifest.groupNumber) !==
          GROUP2_POSTSUCCESS_GROUP_ ||
        text_(manifest.winnerDistressLeadId) !==
          GROUP2_POSTSUCCESS_WINNER_ ||
        text_(manifest.targetDeleteDistressLeadId) !==
          GROUP2_POSTSUCCESS_TARGET_ ||
        text_(manifest.eventSha256) !==
          eventSha256 ||
        text_(manifest.payloadSha256) !==
          payloadSha256 ||
        text_(manifest.previousEventSha256) !==
          previousEventSha256
      ) {
        fail_(
          'Certified Group 2 historical operation event drift.'
        );
      }
    }

    function assertExactGroup2HistoricalHistory_(
      operationId,
      history,
      recovery
    ) {
      if (
        text_(operationId) !==
          GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_ ||
        text_(history.operationId) !==
          GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_ ||
        Number(history.identity.groupNumber) !==
          GROUP2_POSTSUCCESS_GROUP_ ||
        text_(
          history
            .identity
            .winnerDistressLeadId
        ) !==
          GROUP2_POSTSUCCESS_WINNER_ ||
        text_(
          history
            .identity
            .targetDeleteDistressLeadId
        ) !==
          GROUP2_POSTSUCCESS_TARGET_ ||
        history.events.length !==
          2
      ) {
        fail_(
          'Certified Group 2 historical operation identity drift.'
        );
      }

      assertExactGroup2HistoricalEvent_(
        history.events[0],
        1,
        'INTENT_PREPARED',
        GROUP2_POSTSUCCESS_PREPARED_EVENT_SHA256_,
        GROUP2_POSTSUCCESS_PREPARED_PAYLOAD_SHA256_,
        'GENESIS'
      );

      assertExactGroup2HistoricalEvent_(
        history.events[1],
        2,
        'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
        GROUP2_POSTSUCCESS_TERMINAL_EVENT_SHA256_,
        GROUP2_POSTSUCCESS_TERMINAL_PAYLOAD_SHA256_,
        GROUP2_POSTSUCCESS_PREPARED_EVENT_SHA256_
      );

      if (
        !recovery ||
        recovery.found !== true ||
        text_(recovery.operationId) !==
          GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_ ||
        recovery.classification !==
          GROUP2_POSTSUCCESS_HISTORICAL_RECOVERY_ ||
        Number(recovery.eventCount) !==
          2 ||
        recovery.automaticRetryPermitted !==
          false ||
        recovery.rowRecreationPermitted !==
          false ||
        recovery.journalMutationExecuted !==
          false
      ) {
        fail_(
          'Certified Group 2 historical operation recovery drift.'
        );
      }

      return {
        operationId:
          GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_,
        targetDeleteDistressLeadId:
          GROUP2_POSTSUCCESS_TARGET_
      };
    }

    function isExactGroup2PostSuccessCandidate_(
      id,
      candidate
    ) {
      return (
        text_(id) ===
          GROUP2_POSTSUCCESS_TARGET_ &&
        !!candidate &&
        Number(candidate.groupNumber) ===
          GROUP2_POSTSUCCESS_GROUP_ &&
        text_(candidate.winnerDistressLeadId) ===
          GROUP2_POSTSUCCESS_WINNER_
      );
    }

    function assertExactGroup2PostSuccessHistorySet_(
      id,
      candidate,
      verified,
      historical,
      boundCount,
      uncertainCount
    ) {
      if (
        !isExactGroup2PostSuccessCandidate_(
          id,
          candidate
        )
      ) {
        fail_(
          'Certified Group 2 post-success candidate authority drift.'
        );
      }

      if (
        Number(uncertainCount) !==
          0
      ) {
        fail_(
          'Certified Group 2 post-success target has uncertain operation history.'
        );
      }

      if (
        Number(boundCount) !==
          2
      ) {
        fail_(
          'Certified Group 2 post-success target does not bind exactly two strict operation histories.'
        );
      }

      if (
        !historical ||
        historical.operationId !==
          GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_
      ) {
        fail_(
          'Certified Group 2 post-success target lacks exact historical operation.'
        );
      }

      if (
        !verified ||
        !verified.operationId ||
        verified.operationId ===
          historical.operationId
      ) {
        fail_(
          'Certified Group 2 verified-success operation must be distinct from historical operation.'
        );
      }

      return true;
    }

    function requireDependencies_() {
      if (
        !REOS.Security ||
        typeof REOS.Security.requireAdmin !==
          'function'
      ) {
        fail_(
          'Residual evidence requires Admin authority.'
        );
      }

      if (
        !REOS.Database ||
        typeof REOS.Database.getHeaders !==
          'function' ||
        typeof REOS.Database.getAll !==
          'function'
      ) {
        fail_(
          'Residual evidence requires read-only Database APIs.'
        );
      }

      if (
        !REOS.CanonicalPropertyIdentity ||
        typeof REOS
          .CanonicalPropertyIdentity
          .resolve !== 'function'
      ) {
        fail_(
          'Canonical identity resolver is required.'
        );
      }

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

      if (
        !REOS.CountyCodeViolationCollapseDirectKeepExecutionAuthority ||
        typeof REOS
          .CountyCodeViolationCollapseDirectKeepExecutionAuthority
          .catalog !== 'function' ||
        typeof REOS
          .CountyCodeViolationCollapseDirectKeepExecutionAuthority
          .metadata !== 'function'
      ) {
        fail_(
          'Immutable direct-keep execution authority is required.'
        );
      }

      if (
        !REOS.CountyCollapseOperationIntentStore ||
        typeof REOS
          .CountyCollapseOperationIntentStore
          .listOperationIds !== 'function' ||
        typeof REOS
          .CountyCollapseOperationIntentStore
          .read !== 'function' ||
        typeof REOS
          .CountyCollapseOperationIntentStore
          .recover !== 'function'
      ) {
        fail_(
          'Enumerable strict operation-intent evidence is required.'
        );
      }
    }

    function assertHeaders_(headers) {
      [
        'Distress Lead ID',
        'Source',
        'Source Dataset',
        'Source Record ID',
        'Violation Number',
        'Canonical Property Key',
        'Source Observation Key',
        'Source Record Key',
        'Parcel ID'
      ].forEach(function (required) {
        if (
          headers.filter(function (header) {
            return (
              text_(header) ===
              required
            );
          }).length !== 1
        ) {
          fail_(
            'Required residual header must occur exactly once: ' +
            required
          );
        }
      });
    }

    function assertCurrentIdentity_(
      row,
      expected
    ) {
      var id =
        text_(
          expected.distressLeadId
        );

      var rowNumber =
        Number(
          row._rowNumber || 0
        );

      if (
        !Number.isFinite(rowNumber) ||
        Math.floor(rowNumber) !==
          rowNumber ||
        rowNumber < 2
      ) {
        fail_(
          'Current physical row evidence is invalid for ' +
          id
        );
      }

      assertEqual_(
        row.Source,
        CONNECTOR,
        'Source',
        id
      );

      assertEqual_(
        row['Source Dataset'],
        DATASET,
        'Source Dataset',
        id
      );

      assertEqual_(
        row['Source Record ID'],
        expected.sourceRecordId,
        'Source Record ID',
        id
      );

      assertEqual_(
        row['Violation Number'],
        expected.violationNumber,
        'Violation Number',
        id
      );

      assertEqual_(
        row['Parcel ID'],
        expected.parcelId,
        'Parcel ID',
        id
      );

      [
        [
          'Canonical Property Key',
          expected.canonicalPropertyKey
        ],
        [
          'Source Observation Key',
          expected.legacyObservationKey
        ],
        [
          'Source Record Key',
          expected.legacyObservationKey
        ]
      ].forEach(function (pair) {
        if (
          text_(row[pair[0]]) !== ''
        ) {
          assertEqual_(
            row[pair[0]],
            pair[1],
            pair[0],
            id
          );
        }
      });

      var derived =
        REOS.CanonicalPropertyIdentity
          .resolve(
            Object.assign(
              {},
              row
            )
          );

      if (!derived) {
        fail_(
          'Current canonical identity could not be derived for ' +
          id
        );
      }

      assertEqual_(
        derived.canonicalPropertyKey,
        expected.canonicalPropertyKey,
        'Derived Canonical Property Key',
        id
      );

      assertEqual_(
        derived.sourceObservationKey,
        expected.legacyObservationKey,
        'Derived Source Observation Key',
        id
      );

      return rowNumber;
    }

    function read(options) {
      requireDependencies_();
      REOS.Security.requireAdmin();

      options =
        options || {};

      if (
        Object.keys(options).length !==
        0
      ) {
        fail_(
          'Caller-defined residual population authority is prohibited.'
        );
      }

      var immutableAuthority =
        REOS
          .CountyCodeViolationCollapseOnlyEvidenceAuthority;

      var immutableMetadata =
        immutableAuthority.metadata();

      var certified =
        immutableAuthority.records();

      if (
        !immutableMetadata ||
        immutableMetadata.authoritySha256 !==
          EXPECTED_AUTHORITY_SHA256 ||
        Number(
          immutableMetadata.groupCount
        ) !==
          EXPECTED_CERTIFIED_GROUPS ||
        Number(
          immutableMetadata.rowCount
        ) !==
          EXPECTED_CERTIFIED_ROWS ||
        !Array.isArray(certified) ||
        certified.length !==
          EXPECTED_CERTIFIED_ROWS
      ) {
        fail_(
          'Immutable collapse authority drift.'
        );
      }

      var directAuthority =
        REOS
          .CountyCodeViolationCollapseDirectKeepExecutionAuthority;

      var directMetadata =
        directAuthority.metadata();

      var directCatalog =
        directAuthority.catalog();

      if (
        !directMetadata ||
        directMetadata.authoritySha256 !==
          EXPECTED_AUTHORITY_SHA256 ||
        directMetadata.winnerPlanFingerprintSha256 !==
          EXPECTED_WINNER_PLAN_FINGERPRINT ||
        Number(
          directMetadata.directKeepGroupCount
        ) !==
          EXPECTED_DIRECT_KEEP_GROUPS ||
        Number(
          directMetadata.directKeepDeleteCandidateCount
        ) !==
          EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES ||
        !Array.isArray(directCatalog) ||
        directCatalog.length !==
          EXPECTED_DIRECT_KEEP_GROUPS
      ) {
        fail_(
          'Immutable direct-keep authority drift.'
        );
      }

      var certifiedById = {};
      var certifiedViolationNumbers = {};

      certified.forEach(function (record) {
        var id =
          text_(
            record.distressLeadId
          );

        if (
          !id ||
          certifiedById[id]
        ) {
          fail_(
            'Immutable certified population is not unique.'
          );
        }

        certifiedById[id] =
          record;

        certifiedViolationNumbers[
          text_(record.violationNumber)
        ] = true;
      });

      var candidateAuthority = {};
      var winnerByGroup = {};

      directCatalog.forEach(function (group) {
        var groupNumber =
          Number(group.groupNumber);

        winnerByGroup[groupNumber] =
          text_(
            group.winnerDistressLeadId
          );

        group.deleteCandidateDistressLeadIds
          .forEach(function (id) {
            id =
              text_(id);

            if (
              !id ||
              candidateAuthority[id]
            ) {
              fail_(
                'Direct-keep delete-candidate authority is not unique.'
              );
            }

            candidateAuthority[id] = {
              groupNumber:
                groupNumber,
              winnerDistressLeadId:
                winnerByGroup[groupNumber]
            };
          });
      });

      if (
        Object.keys(
          candidateAuthority
        ).length !==
          EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES
      ) {
        fail_(
          'Direct-keep delete-candidate population drift.'
        );
      }

      var headers =
        REOS.Database
          .getHeaders(TABLE);

      assertHeaders_(headers);

      var rows =
        REOS.Database
          .getAll(TABLE);

      var liveById = {};
      var currentRows = [];

      rows.forEach(function (row) {
        var id =
          text_(
            row['Distress Lead ID']
          );

        var expected =
          certifiedById[id];

        if (expected) {
          if (liveById[id]) {
            fail_(
              'Duplicate live certified Distress Lead ID: ' +
              id
            );
          }

          var currentRowNumber =
            assertCurrentIdentity_(
              row,
              expected
            );

          liveById[id] =
            row;

          currentRows.push({
            groupNumber:
              Number(
                expected.groupNumber
              ),
            distressLeadId:
              id,
            currentRowNumber:
              currentRowNumber,
            violationNumber:
              text_(
                expected.violationNumber
              ),
            proposedDurableKey:
              text_(
                expected.proposedDurableKey
              ),
            canonicalPropertyKey:
              text_(
                expected.canonicalPropertyKey
              )
          });

          return;
        }

        if (
          text_(row.Source) ===
            CONNECTOR &&
          text_(
            row['Source Dataset']
          ) ===
            DATASET &&
          certifiedViolationNumbers[
            text_(
              row['Violation Number']
            )
          ]
        ) {
          fail_(
            'Unexpected current member entered a certified collapse group: ' +
            id
          );
        }
      });

      var store =
        REOS
          .CountyCollapseOperationIntentStore;

      var operationIds =
        store.listOperationIds();

      if (
        !Array.isArray(operationIds)
      ) {
        fail_(
          'Operation-intent enumeration is malformed.'
        );
      }

      var sortedOperationIds =
        operationIds
          .slice()
          .sort();

      if (
        JSON.stringify(operationIds) !==
        JSON.stringify(sortedOperationIds)
      ) {
        fail_(
          'Operation-intent enumeration is not deterministic.'
        );
      }

      var verifiedByTarget = {};
      var boundOperationCount = {};
      var historicalByTarget = {};
      var uncertainOperationCountByTarget = {};
      var verifiedDeletes = [];
      var uncertainOperationIds = [];

      operationIds
        .forEach(function (operationId) {
          var history =
            store.read(operationId);

          if (
            !history ||
            history.found !== true ||
            !history.identity ||
            !Array.isArray(history.events) ||
            history.events.length < 1
          ) {
            fail_(
              'Enumerated operation history is incomplete: ' +
              operationId
            );
          }

          var recovery =
            store.recover(operationId);

          if (
            !recovery ||
            recovery.found !== true
          ) {
            fail_(
              'Enumerated operation recovery is incomplete: ' +
              operationId
            );
          }

          var identity =
            history.identity;

          var targetId =
            text_(
              identity
                .targetDeleteDistressLeadId
            );

          if (targetId) {
            boundOperationCount[targetId] =
              (
                boundOperationCount[
                  targetId
                ] || 0
              ) + 1;
          }

          if (
            operationId ===
              GROUP2_POSTSUCCESS_HISTORICAL_OPERATION_ID_
          ) {
            if (
              historicalByTarget[
                GROUP2_POSTSUCCESS_TARGET_
              ]
            ) {
              fail_(
                'Certified Group 2 historical operation is not unique.'
              );
            }

            historicalByTarget[
              GROUP2_POSTSUCCESS_TARGET_
            ] =
              assertExactGroup2HistoricalHistory_(
                operationId,
                history,
                recovery
              );
          }

          if (
            recovery.classification ===
              'VERIFIED_SUCCESS_JOURNAL'
          ) {
            var groupNumber =
              Number(
                identity.groupNumber
              );

            var candidate =
              candidateAuthority[
                targetId
              ];

            if (
              !candidate ||
              candidate.groupNumber !==
                groupNumber ||
              candidate
                .winnerDistressLeadId !==
                text_(
                  identity
                    .winnerDistressLeadId
                )
            ) {
              fail_(
                'Verified delete journal is outside immutable direct-keep authority: ' +
                operationId
              );
            }

            var terminal =
              history.events[
                history.events.length - 1
              ];

            if (
              !terminal ||
              !terminal.manifest ||
              terminal.manifest.eventType !==
                'COLLAPSE_DELETE_VERIFIED'
            ) {
              fail_(
                'Verified recovery lacks exact verified terminal event: ' +
                operationId
              );
            }

            if (
              recovery.terminalEventSha256 &&
              recovery.terminalEventSha256 !==
                terminal.manifest.eventSha256
            ) {
              fail_(
                'Verified recovery terminal hash drift: ' +
                operationId
              );
            }

            if (
              verifiedByTarget[targetId]
            ) {
              fail_(
                'Multiple verified delete histories bind target: ' +
                targetId
              );
            }

            verifiedByTarget[targetId] = {
              operationId:
                operationId,
              groupNumber:
                groupNumber,
              winnerDistressLeadId:
                candidate
                  .winnerDistressLeadId,
              targetDeleteDistressLeadId:
                targetId,
              terminalEventSha256:
                text_(
                  terminal
                    .manifest
                    .eventSha256
                )
            };

            verifiedDeletes.push(
              verifiedByTarget[targetId]
            );

            return;
          }

          if (
            recovery.classification ===
              'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL' ||
            recovery.classification ===
              'UNCERTAIN_STORAGE_INVALID'
          ) {
            if (targetId) {
              uncertainOperationCountByTarget[
                targetId
              ] =
                (
                  uncertainOperationCountByTarget[
                    targetId
                  ] || 0
                ) + 1;
            }

            uncertainOperationIds
              .push(operationId);

            return;
          }

          if (
            recovery.classification ===
              'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION' ||
            recovery.classification ===
              'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'
          ) {
            return;
          }

          fail_(
            'Unknown operation recovery classification: ' +
            recovery.classification
          );
        });

      certified.forEach(function (record) {
        var id =
          text_(
            record.distressLeadId
          );

        var live =
          !!liveById[id];

        var verified =
          verifiedByTarget[id];

        if (
          live &&
          verified
        ) {
          fail_(
            'Verified-deleted certified ID has reappeared physically: ' +
            id
          );
        }

        if (!live) {
          if (
            !candidateAuthority[id] ||
            !verified
          ) {
            fail_(
              'Missing certified ID lacks verified direct-keep delete journal: ' +
              id
            );
          }

          if (
            isExactGroup2PostSuccessCandidate_(
              id,
              candidateAuthority[id]
            )
          ) {
            assertExactGroup2PostSuccessHistorySet_(
              id,
              candidateAuthority[id],
              verified,
              historicalByTarget[id],
              boundOperationCount[id] || 0,
              uncertainOperationCountByTarget[id] || 0
            );
          } else if (
            boundOperationCount[id] !==
              1
          ) {
            fail_(
              'Missing certified ID does not bind exactly one strict operation history: ' +
              id
            );
          }
        }
      });

      currentRows.sort(function (a, b) {
        return (
          a.currentRowNumber -
          b.currentRowNumber
        );
      });

      verifiedDeletes.sort(function (a, b) {
        return (
          a.targetDeleteDistressLeadId <
          b.targetDeleteDistressLeadId
            ? -1
            : (
              a.targetDeleteDistressLeadId >
              b.targetDeleteDistressLeadId
                ? 1
                : 0
            )
        );
      });

      uncertainOperationIds.sort();

      var verifiedDeletedCount =
        verifiedDeletes.length;

      var currentCertifiedRowCount =
        currentRows.length;

      if (
        currentCertifiedRowCount +
        verifiedDeletedCount !==
          EXPECTED_CERTIFIED_ROWS
      ) {
        fail_(
          'Residual certified population does not reconcile.'
        );
      }

      var remainingDeleteCandidates =
        EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES -
        verifiedDeletedCount;

      if (
        remainingDeleteCandidates < 0
      ) {
        fail_(
          'Residual delete-candidate count is invalid.'
        );
      }

      return Object.freeze({
        ok:
          true,
        mode:
          'READ_ONLY_CODE_VIOLATION_COLLAPSE_RESIDUAL_EVIDENCE',

        authoritySha256:
          EXPECTED_AUTHORITY_SHA256,
        winnerPlanFingerprintSha256:
          EXPECTED_WINNER_PLAN_FINGERPRINT,

        certifiedGroupCount:
          EXPECTED_CERTIFIED_GROUPS,
        certifiedRowCount:
          EXPECTED_CERTIFIED_ROWS,
        directKeepGroupCount:
          EXPECTED_DIRECT_KEEP_GROUPS,
        directKeepDeleteCandidateCount:
          EXPECTED_DIRECT_KEEP_DELETE_CANDIDATES,

        currentCertifiedRowCount:
          currentCertifiedRowCount,
        verifiedDeletedCount:
          verifiedDeletedCount,
        remainingDirectKeepDeleteCandidateCount:
          remainingDeleteCandidates,

        currentRows:
          currentRows,
        verifiedDeletes:
          verifiedDeletes,
        operationIds:
          operationIds.slice(),
        uncertainOperationIds:
          uncertainOperationIds.slice(),

        executionBlocked:
          uncertainOperationIds.length > 0,
        executionBlockers:
          uncertainOperationIds.length
            ? [
              'UNRESOLVED_COLLAPSE_OPERATION_HISTORY'
            ]
            : [],

        currentPhysicalRowIsEvidenceOnly:
          true,
        callerSuppliedDeletedIdAuthority:
          false,

        winnerSelectionAuthorityGranted:
          false,
        collapseExecutionAuthorityGranted:
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
      read:
        read
    });
  })();
