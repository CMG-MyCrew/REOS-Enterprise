/**
 * REOS Enterprise - County mutation-exclusion lease v1
 *
 * Shared exclusion-only coordination primitive for county production
 * mutation paths.
 *
 * This module grants no insert, update, delete, collapse, physical-delete,
 * scheduler, checkpoint, connector, repair, migration, MAO, or offer
 * authority.
 */

var REOS = REOS || {};

REOS.CountyMutationExclusionLease = (function () {
  'use strict';

  var CONTRACT_VERSION = 1;

  var STATE_KEY =
    'REOS_COUNTY_MUTATION_EXCLUSION_LEASE_JSON';

  var LEASE_SCOPE =
    'REOS_COUNTY_PRODUCTION_MUTATION';

  var OWNER_MODE =
    'CODE_VIOLATION_COLLAPSE';

  var OWNER_WRITER_ID =
    'CODE_VIOLATION_COLLAPSE_EXECUTOR';

  var WRITER_INVENTORY_VERSION = 1;

  var SCHEDULER_HANDLER =
    'reosCountyProductionSchedulerRun';

  var SETTLE_MS =
    600000;

  var WINDOW_MS =
    3600000;

  var LOCK_WAIT_MS =
    1000;

  var HISTORICAL_WINNER_FINGERPRINT =
    '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

  var HISTORICAL_AUTHORITY_SHA =
    '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

  var CURRENT_WINNER_FINGERPRINT =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var CURRENT_AUTHORITY_SHA =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

  var CHECKPOINT_CYCLE =
    'COUNTY-20260902222607805';

  var CHECKPOINT_CURSOR =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

  var PROTECTED_WRITERS = Object.freeze([
    'COUNTY_PRODUCTION_SCHEDULER',
    'COUNTY_CONNECTOR_LIVE_PERSISTENCE',
    'COUNTY_CHECKPOINT_RECOVERY',
    'COUNTY_C1_SCHEMA_MIGRATION',
    'COUNTY_C1_INSERT_RECOVERY',
    'CODE_VIOLATION_BLOCKED_STORAGE_BACKFILL',
    'CODE_VIOLATION_DURABLE_IDENTITY_BATCH1',
    'CODE_VIOLATION_DURABLE_IDENTITY_MULTISPAN',
    'CODE_VIOLATION_DURABLE_IDENTITY_ROLLING',
    'CODE_VIOLATION_GATE1_RECOVERY',
    'PAGE85_SOURCE_OBSERVATION_214_REPAIR',
    'PAGE86_DUPLICATE_SOURCE_REPAIR',
    'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION'
  ]);

  var STATE_FIELDS = [
    'contractVersion',
    'status',
    'leaseScope',
    'leaseId',
    'ownerMode',
    'ownerWriterId',
    'ownerMaintenanceGateId',
    'leaseTokenSha256',
    'winnerPlanFingerprintSha256',
    'collapseAuthoritySha256',
    'checkpoint',
    'schedulerHandler',
    'protectedWriterInventoryVersion',
    'manualExternalWritersQuiescentCertified',
    'openedAt',
    'notBefore',
    'expiresAt',
    'closedAt'
  ];

  var CHECKPOINT_FIELDS = [
    'cycleId',
    'nextFeedIndex',
    'currentFeedCursor',
    'completedFeeds',
    'totalFeeds',
    'results'
  ];

  function fail_(message) {
    throw new Error(
      'County mutation-exclusion lease: ' +
      message
    );
  }

  function plainObject_(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  function exactFields_(
    value,
    fields,
    label
  ) {
    if (!plainObject_(value)) {
      fail_(
        label +
        ' must be an object.'
      );
    }

    var actual =
      Object.keys(value)
        .slice()
        .sort();

    var expected =
      fields
        .slice()
        .sort();

    if (
      actual.length !==
      expected.length
    ) {
      fail_(
        label +
        ' has missing or unknown fields.'
      );
    }

    for (
      var index = 0;
      index < expected.length;
      index++
    ) {
      if (
        actual[index] !==
        expected[index]
      ) {
        fail_(
          label +
          ' has missing or unknown fields.'
        );
      }
    }
  }

  function exactOptions_(
    value,
    required,
    optional,
    label
  ) {
    if (!plainObject_(value)) {
      fail_(
        label +
        ' must be an object.'
      );
    }

    var allowed =
      required.concat(
        optional || []
      );

    Object.keys(value)
      .forEach(function (field) {
        if (
          allowed.indexOf(field) === -1
        ) {
          fail_(
            label +
            ' contains unknown field: ' +
            field
          );
        }
      });

    required.forEach(function (field) {
      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            value,
            field
          )
      ) {
        fail_(
          label +
          ' is missing required field: ' +
          field
        );
      }
    });
  }

  function authorityFree_(result) {
    result =
      result || {};

    result.leaseGrantsMutationAuthority =
      false;

    result.writerMutationAuthority =
      false;

    result.productionMutationAuthority =
      false;

    result.physicalDeleteAuthority =
      false;

    result.schedulerMutationAuthority =
      false;

    result.checkpointMutationAuthority =
      false;

    result.connectorExecutionAuthority =
      false;

    result.automaticOfferAuthority =
      false;

    return result;
  }

  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security
        .requireAdmin !==
        'function'
    ) {
      fail_(
        'Admin support is required.'
      );
    }

    REOS.Security.requireAdmin();
  }

  function properties_(writable) {
    if (
      typeof PropertiesService ===
        'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !==
        'function'
    ) {
      fail_(
        'Script Properties support is required.'
      );
    }

    var props =
      PropertiesService
        .getScriptProperties();

    if (
      !props ||
      typeof props.getProperty !==
        'function'
    ) {
      fail_(
        'Script Properties support is required.'
      );
    }

    if (
      writable &&
      typeof props.setProperty !==
        'function'
    ) {
      fail_(
        'Writable Script Properties support is required.'
      );
    }

    return props;
  }

  function requireUtilities_(
    requireUuid
  ) {
    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities
    ) {
      fail_(
        'Utilities SHA-256 support is required.'
      );
    }

    if (
      !Utilities.DigestAlgorithm ||
      !Utilities.DigestAlgorithm.SHA_256 ||
      typeof Utilities.computeDigest !==
        'function'
    ) {
      fail_(
        'SHA-256 support is required.'
      );
    }

    if (
      requireUuid &&
      typeof Utilities.getUuid !==
        'function'
    ) {
      fail_(
        'UUID generation support is required.'
      );
    }

    return Utilities;
  }

  function sha256Hex_(value) {
    var utilities =
      requireUtilities_(false);

    var digest =
      utilities.computeDigest(
        utilities
          .DigestAlgorithm
          .SHA_256,
        String(value)
      );

    if (
      !Array.isArray(digest)
    ) {
      fail_(
        'SHA-256 digest result is invalid.'
      );
    }

    return digest
      .map(function (byte) {
        var normalized =
          byte < 0
            ? byte + 256
            : byte;

        return normalized
          .toString(16)
          .padStart(2, '0');
      })
      .join('');
  }

  function requireTriggerInspection_() {
    if (
      typeof ScriptApp ===
        'undefined' ||
      !ScriptApp ||
      typeof ScriptApp
        .getProjectTriggers !==
        'function'
    ) {
      fail_(
        'County scheduler trigger inspection support is required.'
      );
    }
  }

  function managedTriggerCount_() {
    requireTriggerInspection_();

    var triggers =
      ScriptApp
        .getProjectTriggers();

    if (!Array.isArray(triggers)) {
      fail_(
        'County scheduler trigger inspection result is invalid.'
      );
    }

    var count = 0;

    triggers.forEach(function (trigger) {
      if (
        !trigger ||
        typeof trigger
          .getHandlerFunction !==
          'function'
      ) {
        fail_(
          'County scheduler trigger is not inspectable.'
        );
      }

      if (
        trigger.getHandlerFunction() ===
        SCHEDULER_HANDLER
      ) {
        count++;
      }
    });

    return count;
  }

  function requireCheckpointSupport_() {
    if (
      !REOS.CountyProductionScheduler ||
      typeof REOS
        .CountyProductionScheduler
        .getCheckpoint !==
        'function'
    ) {
      fail_(
        'County scheduler checkpoint support is required.'
      );
    }
  }

  function readCheckpoint_() {
    requireCheckpointSupport_();

    var checkpoint =
      REOS
        .CountyProductionScheduler
        .getCheckpoint();

    if (!plainObject_(checkpoint)) {
      fail_(
        'County scheduler checkpoint result is invalid.'
      );
    }

    return checkpoint;
  }

  function frozenCheckpoint_() {
    var checkpoint =
      readCheckpoint_();

    if (
      checkpoint.id !==
        CHECKPOINT_CYCLE ||
      checkpoint.nextFeedIndex !==
        0 ||
      checkpoint.currentFeedCursor !==
        CHECKPOINT_CURSOR ||
      checkpoint.completedFeeds !==
        0 ||
      checkpoint.totalFeeds !==
        4 ||
      !Array.isArray(
        checkpoint.results
      ) ||
      checkpoint.results.length !==
        0
    ) {
      fail_(
        'Frozen county checkpoint changed.'
      );
    }

    return {
      cycleId:
        CHECKPOINT_CYCLE,

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

  function assertSchedulerFrozen_() {
    var count =
      managedTriggerCount_();

    if (count !== 0) {
      fail_(
        'Managed county scheduler must remain frozen; found ' +
        count +
        ' trigger(s).'
      );
    }
  }

  function requireLockSupport_() {
    if (
      typeof LockService ===
        'undefined' ||
      !LockService ||
      typeof LockService
        .getScriptLock !==
        'function'
    ) {
      fail_(
        'ScriptLock support is required.'
      );
    }
  }

  function withTransitionLock_(work) {
    requireLockSupport_();

    var lock =
      LockService
        .getScriptLock();

    if (
      !lock ||
      typeof lock.tryLock !==
        'function' ||
      typeof lock.hasLock !==
        'function' ||
      typeof lock.releaseLock !==
        'function'
    ) {
      fail_(
        'ScriptLock support is invalid.'
      );
    }

    if (
      lock.tryLock(
        LOCK_WAIT_MS
      ) !== true
    ) {
      fail_(
        'ScriptLock is contended.'
      );
    }

    try {
      if (
        lock.hasLock() !==
        true
      ) {
        fail_(
          'ScriptLock ownership could not be verified.'
        );
      }

      return work();
    } finally {
      lock.releaseLock();
    }
  }

  function isoMs_(value) {
    if (
      typeof value !==
        'string' ||
      value === ''
    ) {
      return null;
    }

    var date =
      new Date(value);

    var ms =
      date.getTime();

    if (
      !Number.isFinite(ms) ||
      date.toISOString() !==
        value
    ) {
      return null;
    }

    return ms;
  }

  function toIso_(ms) {
    return new Date(ms)
      .toISOString();
  }

  function validatePersistedCheckpoint_(
    checkpoint
  ) {
    exactFields_(
      checkpoint,
      CHECKPOINT_FIELDS,
      'Persisted lease checkpoint'
    );

    if (
      checkpoint.cycleId !==
        CHECKPOINT_CYCLE ||
      checkpoint.nextFeedIndex !==
        0 ||
      checkpoint.currentFeedCursor !==
        CHECKPOINT_CURSOR ||
      checkpoint.completedFeeds !==
        0 ||
      checkpoint.totalFeeds !==
        4 ||
      !Array.isArray(
        checkpoint.results
      ) ||
      checkpoint.results.length !==
        0
    ) {
      fail_(
        'Persisted lease checkpoint binding is invalid.'
      );
    }
  }

  function validateStateObject_(state) {
    exactFields_(
      state,
      STATE_FIELDS,
      'Persisted lease state'
    );

    if (
      state.contractVersion !==
        CONTRACT_VERSION
    ) {
      fail_(
        'Persisted lease contract version is unknown.'
      );
    }

    if (
      state.status !== 'OPEN' &&
      state.status !== 'CLOSED'
    ) {
      fail_(
        'Persisted lease status is ambiguous.'
      );
    }

    if (
      state.leaseScope !==
        LEASE_SCOPE
    ) {
      fail_(
        'Persisted lease scope is invalid.'
      );
    }

    if (
      typeof state.leaseId !==
        'string' ||
      state.leaseId.trim() === '' ||
      state.leaseId.trim() !==
        state.leaseId
    ) {
      fail_(
        'Persisted lease ID is invalid.'
      );
    }

    if (
      state.ownerMode !==
        OWNER_MODE
    ) {
      fail_(
        'Persisted lease owner mode is invalid.'
      );
    }

    if (
      state.ownerWriterId !==
        OWNER_WRITER_ID
    ) {
      fail_(
        'Persisted lease owner writer is invalid.'
      );
    }

    if (
      typeof state
        .ownerMaintenanceGateId !==
        'string' ||
      state
        .ownerMaintenanceGateId
        .trim() === '' ||
      state
        .ownerMaintenanceGateId
        .trim() !==
        state.ownerMaintenanceGateId
    ) {
      fail_(
        'Persisted owner maintenance gate ID is invalid.'
      );
    }

    if (
      typeof state
        .leaseTokenSha256 !==
        'string' ||
      !/^[0-9a-f]{64}$/
        .test(
          state.leaseTokenSha256
        )
    ) {
      fail_(
        'Persisted lease token SHA-256 is invalid.'
      );
    }

    if (
      typeof state
        .winnerPlanFingerprintSha256 !==
        'string' ||
      !/^[0-9a-f]{64}$/
        .test(
          state
            .winnerPlanFingerprintSha256
        )
    ) {
      fail_(
        'Persisted winner-plan fingerprint is invalid.'
      );
    }

    if (
      typeof state
        .collapseAuthoritySha256 !==
        'string' ||
      !/^[0-9a-f]{64}$/
        .test(
          state
            .collapseAuthoritySha256
        )
    ) {
      fail_(
        'Persisted collapse authority SHA is invalid.'
      );
    }

    validatePersistedCheckpoint_(
      state.checkpoint
    );

    if (
      state.schedulerHandler !==
        SCHEDULER_HANDLER
    ) {
      fail_(
        'Persisted scheduler handler is invalid.'
      );
    }

    if (
      state
        .protectedWriterInventoryVersion !==
        WRITER_INVENTORY_VERSION
    ) {
      fail_(
        'Persisted protected-writer inventory version is invalid.'
      );
    }

    if (
      state
        .manualExternalWritersQuiescentCertified !==
        true
    ) {
      fail_(
        'Persisted manual/external-writer certification is invalid.'
      );
    }

    var openedMs =
      isoMs_(
        state.openedAt
      );

    var notBeforeMs =
      isoMs_(
        state.notBefore
      );

    var expiresMs =
      isoMs_(
        state.expiresAt
      );

    if (
      openedMs === null ||
      notBeforeMs === null ||
      expiresMs === null
    ) {
      fail_(
        'Persisted lease timestamps are invalid.'
      );
    }

    if (
      notBeforeMs - openedMs !==
        SETTLE_MS ||
      expiresMs - openedMs !==
        WINDOW_MS
    ) {
      fail_(
        'Persisted lease time bounds are invalid.'
      );
    }

    if (
      state.status ===
        'OPEN'
    ) {
      if (
        state.closedAt !==
        ''
      ) {
        fail_(
          'OPEN lease cannot contain closedAt.'
        );
      }
    } else {
      var closedMs =
        isoMs_(
          state.closedAt
        );

      if (
        closedMs === null ||
        closedMs < openedMs
      ) {
        fail_(
          'CLOSED lease closedAt is invalid.'
        );
      }
    }

    return state;
  }

  function authorityGeneration_(state) {
    if (
      state
        .winnerPlanFingerprintSha256 ===
        CURRENT_WINNER_FINGERPRINT &&
      state
        .collapseAuthoritySha256 ===
        CURRENT_AUTHORITY_SHA
    ) {
      return 'CURRENT';
    }

    if (
      state
        .winnerPlanFingerprintSha256 ===
        HISTORICAL_WINNER_FINGERPRINT &&
      state
        .collapseAuthoritySha256 ===
        HISTORICAL_AUTHORITY_SHA
    ) {
      return 'HISTORICAL';
    }

    return 'UNKNOWN';
  }

  function inspectState_(props) {
    var raw =
      props.getProperty(
        STATE_KEY
      );

    if (raw === null) {
      return {
        kind:
          'ABSENT'
      };
    }

    if (
      typeof raw !==
        'string' ||
      raw === ''
    ) {
      return {
        kind:
          'MALFORMED',

        error:
          'Persisted lease state is malformed.'
      };
    }

    try {
      var state =
        JSON.parse(raw);

      validateStateObject_(
        state
      );

      var authorityGeneration =
        authorityGeneration_(
          state
        );

      if (
        authorityGeneration ===
        'UNKNOWN'
      ) {
        return {
          kind:
            'MALFORMED',

          authorityGeneration:
            'UNKNOWN',

          error:
            'Persisted lease authority pair is unknown.'
        };
      }

      return {
        kind:
          'VALID',

        authorityGeneration:
          authorityGeneration,

        state:
          state
      };
    } catch (error) {
      return {
        kind:
          'MALFORMED',

        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
      };
    }
  }

  function requireValidState_(
    inspected
  ) {
    if (
      inspected.kind ===
        'MALFORMED'
    ) {
      fail_(
        'Persisted lease state is malformed: ' +
        inspected.error
      );
    }

    if (
      inspected.kind !==
        'VALID'
    ) {
      fail_(
        'Persisted lease state is absent.'
      );
    }

    return inspected.state;
  }

  function assertNoActiveLease_(
    inspected,
    nowMs
  ) {
    if (
      inspected.kind ===
        'MALFORMED'
    ) {
      fail_(
        'Malformed lease state cannot be replaced.'
      );
    }

    if (
      inspected.kind ===
        'VALID' &&
      inspected.state.status ===
        'OPEN' &&
      nowMs <
        isoMs_(
          inspected.state.expiresAt
        )
    ) {
      fail_(
        'Active unexpired lease cannot be replaced.'
      );
    }
  }

  function assertExpectedAuthorities_(
    options
  ) {
    if (
      options
        .expectedWinnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT
    ) {
      fail_(
        'Winner-plan fingerprint does not match current certified authority.'
      );
    }

    if (
      options
        .expectedAuthoritySha256 !==
        CURRENT_AUTHORITY_SHA
    ) {
      fail_(
        'Collapse authority SHA does not match current certified authority.'
      );
    }
  }

  function validateOptionalLockContext_(
    options
  ) {
    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          options,
          'lockContext'
        )
    ) {
      return;
    }

    if (
      !REOS.Database ||
      typeof REOS.Database
        .assertScriptLockContext !==
        'function'
    ) {
      fail_(
        'Database lock-context validation support is required.'
      );
    }

    REOS.Database
      .assertScriptLockContext(
        options.lockContext
      );
  }

  function publicStateMetadata_(
    state
  ) {
    return {
      authorityGeneration:
        authorityGeneration_(
          state
        ),

      leaseId:
        state.leaseId,

      ownerMode:
        state.ownerMode,

      ownerWriterId:
        state.ownerWriterId,

      ownerGateId:
        state.ownerMaintenanceGateId,

      winnerPlanFingerprintSha256:
        state.winnerPlanFingerprintSha256,

      collapseAuthoritySha256:
        state.collapseAuthoritySha256,

      checkpoint: {
        cycleId:
          state.checkpoint.cycleId,

        nextFeedIndex:
          state.checkpoint.nextFeedIndex,

        currentFeedCursor:
          state.checkpoint.currentFeedCursor,

        completedFeeds:
          state.checkpoint.completedFeeds,

        totalFeeds:
          state.checkpoint.totalFeeds,

        results:
          state.checkpoint
            .results
            .slice()
      },

      schedulerHandler:
        state.schedulerHandler,

      protectedWriterInventoryVersion:
        state.protectedWriterInventoryVersion,

      manualExternalWritersQuiescentCertified:
        state
          .manualExternalWritersQuiescentCertified,

      openedAt:
        state.openedAt,

      notBefore:
        state.notBefore,

      expiresAt:
        state.expiresAt,

      closedAt:
        state.closedAt
    };
  }

  function openExclusive(options) {
    exactOptions_(
      options,
      [
        'confirmExclusiveLease',
        'confirmManualExternalWritersQuiescent',
        'ownerGateId',
        'expectedWinnerPlanFingerprintSha256',
        'expectedAuthoritySha256'
      ],
      [],
      'openExclusive options'
    );

    if (
      options
        .confirmExclusiveLease !==
        true
    ) {
      fail_(
        'Explicit exclusive-lease confirmation is required.'
      );
    }

    if (
      options
        .confirmManualExternalWritersQuiescent !==
        true
    ) {
      fail_(
        'Manual/external-writer quiescence confirmation is required.'
      );
    }

    if (
      typeof options.ownerGateId !==
        'string' ||
      options.ownerGateId.trim() ===
        ''
    ) {
      fail_(
        'Owner maintenance gate ID is required.'
      );
    }

    var ownerGateId =
      options.ownerGateId.trim();

    assertExpectedAuthorities_(
      options
    );

    requireAdmin_();

    var props =
      properties_(true);

    requireUtilities_(true);
    requireTriggerInspection_();
    requireCheckpointSupport_();
    requireLockSupport_();

    assertSchedulerFrozen_();
    frozenCheckpoint_();

    var before =
      inspectState_(
        props
      );

    assertNoActiveLease_(
      before,
      Date.now()
    );

    return withTransitionLock_(
      function () {
        assertSchedulerFrozen_();

        var checkpoint =
          frozenCheckpoint_();

        var nowMs =
          Date.now();

        var inspected =
          inspectState_(
            props
          );

        assertNoActiveLease_(
          inspected,
          nowMs
        );

        var leaseId =
          'COUNTY-LEASE-' +
          Utilities.getUuid();

        var leaseToken =
          Utilities.getUuid() +
          ':' +
          Utilities.getUuid();

        var state = {
          contractVersion:
            CONTRACT_VERSION,

          status:
            'OPEN',

          leaseScope:
            LEASE_SCOPE,

          leaseId:
            leaseId,

          ownerMode:
            OWNER_MODE,

          ownerWriterId:
            OWNER_WRITER_ID,

          ownerMaintenanceGateId:
            ownerGateId,

          leaseTokenSha256:
            sha256Hex_(
              leaseToken
            ),

          winnerPlanFingerprintSha256:
            CURRENT_WINNER_FINGERPRINT,

          collapseAuthoritySha256:
            CURRENT_AUTHORITY_SHA,

          checkpoint:
            checkpoint,

          schedulerHandler:
            SCHEDULER_HANDLER,

          protectedWriterInventoryVersion:
            WRITER_INVENTORY_VERSION,

          manualExternalWritersQuiescentCertified:
            true,

          openedAt:
            toIso_(
              nowMs
            ),

          notBefore:
            toIso_(
              nowMs +
              SETTLE_MS
            ),

          expiresAt:
            toIso_(
              nowMs +
              WINDOW_MS
            ),

          closedAt:
            ''
        };

        props.setProperty(
          STATE_KEY,
          JSON.stringify(state)
        );

        var verified =
          requireValidState_(
            inspectState_(
              props
            )
          );

        if (
          verified.leaseId !==
            leaseId ||
          verified.leaseTokenSha256 !==
            state.leaseTokenSha256
        ) {
          fail_(
            'Persisted lease readback verification failed.'
          );
        }

        return authorityFree_({
          ok:
            true,

          opened:
            true,

          authorityGeneration:
            'CURRENT',

          leaseId:
            leaseId,

          leaseToken:
            leaseToken,

          ownerGateId:
            ownerGateId,

          notBefore:
            state.notBefore,

          expiresAt:
            state.expiresAt
        });
      }
    );
  }

  function assertOwnerReady(options) {
    exactOptions_(
      options,
      [
        'leaseToken',
        'expectedLeaseId',
        'expectedOwnerGateId',
        'expectedWinnerPlanFingerprintSha256',
        'expectedAuthoritySha256'
      ],
      [
        'lockContext'
      ],
      'assertOwnerReady options'
    );

    assertExpectedAuthorities_(
      options
    );

    if (
      typeof options.leaseToken !==
        'string' ||
      options.leaseToken ===
        ''
    ) {
      fail_(
        'Lease token is required.'
      );
    }

    validateOptionalLockContext_(
      options
    );

    var props =
      properties_(false);

    requireUtilities_(false);
    requireTriggerInspection_();
    requireCheckpointSupport_();

    var state =
      requireValidState_(
        inspectState_(
          props
        )
      );

    if (
      authorityGeneration_(
        state
      ) !==
        'CURRENT'
    ) {
      fail_(
        'Only CURRENT authority lease may satisfy owner readiness.'
      );
    }

    if (
      state.status !==
        'OPEN'
    ) {
      fail_(
        'Lease owner is not OPEN.'
      );
    }

    if (
      sha256Hex_(
        options.leaseToken
      ) !==
        state.leaseTokenSha256
    ) {
      fail_(
        'Lease token does not match.'
      );
    }

    if (
      options.expectedLeaseId !==
        state.leaseId
    ) {
      fail_(
        'Lease ID does not match.'
      );
    }

    if (
      options.expectedOwnerGateId !==
        state.ownerMaintenanceGateId
    ) {
      fail_(
        'Owner maintenance gate ID does not match.'
      );
    }

    var nowMs =
      Date.now();

    if (
      nowMs <
        isoMs_(
          state.notBefore
        )
    ) {
      fail_(
        'Lease settling interval has not completed.'
      );
    }

    if (
      nowMs >=
        isoMs_(
          state.expiresAt
        )
    ) {
      fail_(
        'Lease has expired.'
      );
    }

    assertSchedulerFrozen_();
    frozenCheckpoint_();

    var metadata =
      publicStateMetadata_(
        state
      );

    metadata.ok =
      true;

    metadata.ready =
      true;

    metadata.state =
      'SETTLED';

    return authorityFree_(
      metadata
    );
  }

  function assertWriterAllowed(options) {
    exactOptions_(
      options,
      [
        'writerId'
      ],
      [
        'lockContext'
      ],
      'assertWriterAllowed options'
    );

    if (
      typeof options.writerId !==
        'string'
    ) {
      fail_(
        'Writer ID is invalid.'
      );
    }

    if (
      options.writerId ===
        OWNER_WRITER_ID
    ) {
      fail_(
        'Collapse owner must use assertOwnerReady.'
      );
    }

    if (
      PROTECTED_WRITERS
        .indexOf(
          options.writerId
        ) === -1
    ) {
      fail_(
        'Unknown protected writer ID.'
      );
    }

    validateOptionalLockContext_(
      options
    );

    var props =
      properties_(false);

    var inspected =
      inspectState_(
        props
      );

    if (
      inspected.kind ===
        'MALFORMED'
    ) {
      fail_(
        'Malformed lease state blocks protected writers.'
      );
    }

    if (
      inspected.kind ===
        'ABSENT'
    ) {
      return authorityFree_({
        ok:
          true,

        allowed:
          true,

        writerId:
          options.writerId,

        leaseState:
          'ABSENT',

        blockedByLease:
          false
      });
    }

    var state =
      inspected.state;

    if (
      state.status ===
        'CLOSED'
    ) {
      return authorityFree_({
        ok:
          true,

        allowed:
          true,

        writerId:
          options.writerId,

        leaseState:
          'CLOSED',

        authorityGeneration:
          authorityGeneration_(
            state
          ),

        blockedByLease:
          false
      });
    }

    if (
      Date.now() >=
        isoMs_(
          state.expiresAt
        )
    ) {
      return authorityFree_({
        ok:
          true,

        allowed:
          true,

        writerId:
          options.writerId,

        leaseState:
          'EXPIRED',

        authorityGeneration:
          authorityGeneration_(
            state
          ),

        blockedByLease:
          false
      });
    }

    fail_(
      'Active collapse lease blocks protected writer: ' +
      options.writerId
    );
  }

  function status() {
    requireAdmin_();

    var props =
      properties_(false);

    var inspected =
      inspectState_(
        props
      );

    if (
      inspected.kind ===
        'ABSENT'
    ) {
      return authorityFree_({
        ok:
          true,

        state:
          'ABSENT',

        settled:
          false,

        expired:
          false
      });
    }

    if (
      inspected.kind ===
        'MALFORMED'
    ) {
      return authorityFree_({
        ok:
          false,

        state:
          'MALFORMED',

        authorityGeneration:
          inspected
            .authorityGeneration ||
          '',

        settled:
          false,

        expired:
          false,

        error:
          inspected.error
      });
    }

    var state =
      inspected.state;

    var publicState =
      publicStateMetadata_(
        state
      );

    publicState.ok =
      true;

    publicState.persistedStatus =
      state.status;

    if (
      state.status ===
        'CLOSED'
    ) {
      publicState.state =
        'CLOSED';

      publicState.settled =
        true;

      publicState.expired =
        Date.now() >=
        isoMs_(
          state.expiresAt
        );

      return authorityFree_(
        publicState
      );
    }

    if (
      Date.now() >=
        isoMs_(
          state.expiresAt
        )
    ) {
      publicState.state =
        'EXPIRED';

      publicState.settled =
        true;

      publicState.expired =
        true;

      return authorityFree_(
        publicState
      );
    }

    if (
      Date.now() >=
        isoMs_(
          state.notBefore
        )
    ) {
      publicState.state =
        'SETTLED';

      publicState.settled =
        true;

      publicState.expired =
        false;

      return authorityFree_(
        publicState
      );
    }

    publicState.state =
      'OPEN';

    publicState.settled =
      false;

    publicState.expired =
      false;

    return authorityFree_(
      publicState
    );
  }

  function close(options) {
    exactOptions_(
      options,
      [
        'confirmClose',
        'leaseToken',
        'expectedLeaseId',
        'expectedOwnerGateId'
      ],
      [],
      'close options'
    );

    if (
      options.confirmClose !==
        true
    ) {
      fail_(
        'Explicit close confirmation is required.'
      );
    }

    if (
      typeof options.leaseToken !==
        'string' ||
      options.leaseToken ===
        ''
    ) {
      fail_(
        'Lease token is required.'
      );
    }

    requireAdmin_();

    var props =
      properties_(true);

    requireUtilities_(false);
    requireTriggerInspection_();
    requireCheckpointSupport_();
    requireLockSupport_();

    /*
     * Close must remain possible after scheduler/checkpoint drift, but the
     * state-changing operation still fails closed if those support surfaces
     * are unavailable or unreadable.
     */
    managedTriggerCount_();
    readCheckpoint_();

    return withTransitionLock_(
      function () {
        managedTriggerCount_();
        readCheckpoint_();

        var state =
          requireValidState_(
            inspectState_(
              props
            )
          );

        if (
          state.status !==
            'OPEN'
        ) {
          fail_(
            'Only an OPEN lease may be closed.'
          );
        }

        if (
          sha256Hex_(
            options.leaseToken
          ) !==
            state.leaseTokenSha256
        ) {
          fail_(
            'Lease token does not match.'
          );
        }

        if (
          options.expectedLeaseId !==
            state.leaseId
        ) {
          fail_(
            'Lease ID does not match.'
          );
        }

        if (
          options.expectedOwnerGateId !==
            state.ownerMaintenanceGateId
        ) {
          fail_(
            'Owner maintenance gate ID does not match.'
          );
        }

        var closed =
          JSON.parse(
            JSON.stringify(
              state
            )
          );

        closed.status =
          'CLOSED';

        closed.closedAt =
          toIso_(
            Date.now()
          );

        props.setProperty(
          STATE_KEY,
          JSON.stringify(
            closed
          )
        );

        var verified =
          requireValidState_(
            inspectState_(
              props
            )
          );

        if (
          verified.status !==
            'CLOSED' ||
          verified.leaseId !==
            state.leaseId ||
          verified
            .leaseTokenSha256 !==
            state.leaseTokenSha256 ||
          verified
            .ownerMaintenanceGateId !==
            state.ownerMaintenanceGateId ||
          verified
            .winnerPlanFingerprintSha256 !==
            state.winnerPlanFingerprintSha256 ||
          verified
            .collapseAuthoritySha256 !==
            state.collapseAuthoritySha256
        ) {
          fail_(
            'Durable CLOSED-state verification failed.'
          );
        }

        return authorityFree_({
          ok:
            true,

          closed:
            true,

          authorityGeneration:
            authorityGeneration_(
              verified
            ),

          leaseId:
            verified.leaseId,

          ownerGateId:
            verified
              .ownerMaintenanceGateId,

          closedAt:
            verified.closedAt
        });
      }
    );
  }

  return {
    openExclusive:
      openExclusive,

    assertOwnerReady:
      assertOwnerReady,

    assertWriterAllowed:
      assertWriterAllowed,

    status:
      status,

    close:
      close
  };
})();
