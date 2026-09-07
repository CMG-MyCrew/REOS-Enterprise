/**
 * REOS Enterprise
 * Code Violations Gate 1 Recovery - Population Maintenance Gate
 *
 * Explicit capability for the checksum-certified Gate 1 recovery
 * population.
 *
 * This gate:
 * - requires Admin authority
 * - binds to the exact 139-record durable recovery authority
 * - binds to the certified live read-only preflight evidence
 * - requires zero managed county scheduler triggers
 * - permits unrelated installable triggers to continue operating
 * - grants readiness only
 *
 * It grants NO insert, update, delete, checkpoint, scheduler,
 * migration, deduplication, MAO, or automatic-offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationGate1RecoveryMaintenanceGate =
(function () {
  'use strict';

  var STATE_KEY =
    'REOS_CODE_VIOLATIONS_GATE1_RECOVERY_MAINTENANCE_GATE_JSON';

  var MODE =
    'CODE_VIOLATIONS_GATE1_RECOVERY';

  var CANDIDATE_COUNT =
    139;

  var AUTHORITY_MANIFEST_SHA256 =
    '33733cdf3ea8fbfccf66dfe0904fe26999b184c2e367a920318b2d943fe6e8c6';

  var AUTHORITY_CATALOG_SHA256 =
    '050857487383e799b0a9dc503dfeeae759e8ddf60e485e4ae94cb551e2b8731d';

  var LIVE_PREFLIGHT_SHA256 =
    '4c5f6fd76558708d0e993b81de5b807af437844dcf902db0940dab5fbff80257';

  var SCHEDULER_HANDLER =
    'reosCountyProductionSchedulerRun';

  var SETTLE_MS =
    10 * 60 * 1000;

  var WINDOW_MS =
    60 * 60 * 1000;


  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }


  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate requires Admin authority.'
      );
    }

    REOS.Security.requireAdmin();
  }


  function props_() {
    if (
      typeof PropertiesService ===
        'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate requires Script Properties.'
      );
    }

    return PropertiesService
      .getScriptProperties();
  }


  function sha256Text_(value) {
    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities.computeDigest !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate requires SHA-256 support.'
      );
    }

    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        text_(value),
        Utilities.Charset.UTF_8
      );

    return digest
      .map(function (byte) {
        var normalized =
          byte < 0
            ? byte + 256
            : byte;

        return (
          normalized < 16
            ? '0'
            : ''
        ) +
          normalized.toString(16);
      })
      .join('');
  }


  function newToken_() {
    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities.getUuid !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate requires UUID support.'
      );
    }

    return Utilities.getUuid();
  }


  function authority_() {
    return {
      mode:
        MODE,

      candidateCount:
        CANDIDATE_COUNT,

      manifestSha256:
        AUTHORITY_MANIFEST_SHA256,

      catalogSha256:
        AUTHORITY_CATALOG_SHA256,

      livePreflightSha256:
        LIVE_PREFLIGHT_SHA256
    };
  }


  function authorityMatches_(value) {
    value =
      value || {};

    return (
      text_(value.mode) ===
        MODE &&
      Number(value.candidateCount) ===
        CANDIDATE_COUNT &&
      text_(value.manifestSha256) ===
        AUTHORITY_MANIFEST_SHA256 &&
      text_(value.catalogSha256) ===
        AUTHORITY_CATALOG_SHA256 &&
      text_(value.livePreflightSha256) ===
        LIVE_PREFLIGHT_SHA256
    );
  }


  function managedCountyTriggers_() {
    if (
      typeof ScriptApp ===
        'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate requires trigger inspection.'
      );
    }

    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger.getHandlerFunction ===
            'function' &&
          String(
            trigger.getHandlerFunction()
          ) ===
            SCHEDULER_HANDLER
        );
      })
      .map(function (trigger) {
        return {
          handler:
            SCHEDULER_HANDLER,

          eventType:
            typeof trigger.getEventType ===
              'function'
              ? String(
                  trigger.getEventType()
                )
              : '',

          source:
            typeof trigger.getTriggerSource ===
              'function'
              ? String(
                  trigger.getTriggerSource()
                )
              : '',

          uniqueId:
            typeof trigger.getUniqueId ===
              'function'
              ? String(
                  trigger.getUniqueId()
                )
              : ''
        };
      });
  }


  function readState_() {
    var raw =
      props_().getProperty(
        STATE_KEY
      );

    if (!raw) {
      return null;
    }

    try {
      var parsed =
        JSON.parse(raw);

      if (
        !parsed ||
        typeof parsed !==
          'object'
      ) {
        throw new Error(
          'invalid state'
        );
      }

      return parsed;
    } catch (error) {
      throw new Error(
        'Gate 1 recovery maintenance gate state is invalid.'
      );
    }
  }


  function publicState_(state) {
    state =
      state || {};

    var now =
      new Date().getTime();

    var notBefore =
      new Date(
        state.notBeforeAt || ''
      ).getTime();

    var expires =
      new Date(
        state.expiresAt || ''
      ).getTime();

    var triggers =
      managedCountyTriggers_();

    return {
      ok:
        true,

      mode:
        'READ_ONLY_STATUS',

      gateMode:
        MODE,

      active:
        state.status ===
          'OPEN' &&
        Number.isFinite(expires) &&
        now <= expires,

      settled:
        Number.isFinite(notBefore) &&
        now >= notBefore,

      expired:
        Number.isFinite(expires) &&
        now > expires,

      gateId:
        text_(state.gateId),

      openedAt:
        text_(state.openedAt),

      notBeforeAt:
        text_(state.notBeforeAt),

      expiresAt:
        text_(state.expiresAt),

      authority:
        authority_(),

      authorityMatches:
        authorityMatches_(
          state.authority
        ),

      managedCountySchedulerTriggerCount:
        triggers.length,

      managedCountySchedulerTriggers:
        triggers,

      recoveryReady:
        false,

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      updateAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      deduplicationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }


  function requireOpeningAuthority_(
    options
  ) {
    if (
      options.confirmQuiescence !==
        true ||
      options.confirmPopulationRecovery !==
        true
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate requires explicit quiescence and population-recovery confirmation.'
      );
    }

    if (
      Number(
        options.candidateCount
      ) !==
        CANDIDATE_COUNT ||
      text_(
        options.manifestSha256
      ) !==
        AUTHORITY_MANIFEST_SHA256 ||
      text_(
        options.catalogSha256
      ) !==
        AUTHORITY_CATALOG_SHA256 ||
      text_(
        options.livePreflightSha256
      ) !==
        LIVE_PREFLIGHT_SHA256
    ) {
      throw new Error(
        'Gate 1 recovery maintenance authority does not match certified evidence.'
      );
    }
  }


  function open(options) {
    requireAdmin_();

    options =
      options || {};

    requireOpeningAuthority_(
      options
    );

    var existing =
      readState_();

    var replacedExpiredGate =
      false;

    if (
      existing &&
      existing.status ===
        'OPEN'
    ) {
      var expires =
        new Date(
          existing.expiresAt || ''
        ).getTime();

      if (
        !Number.isFinite(expires) ||
        new Date().getTime() <=
          expires
      ) {
        throw new Error(
          'Gate 1 recovery maintenance gate is already open.'
        );
      }

      replacedExpiredGate =
        true;
    }

    var triggers =
      managedCountyTriggers_();

    if (triggers.length !== 0) {
      throw new Error(
        'Gate 1 recovery maintenance gate requires zero managed county scheduler triggers.'
      );
    }

    var token =
      newToken_();

    var gateId =
      newToken_();

    var now =
      new Date().getTime();

    var state = {
      status:
        'OPEN',

      gateId:
        gateId,

      tokenSha256:
        sha256Text_(token),

      authority:
        authority_(),

      openedAt:
        new Date(now)
          .toISOString(),

      notBeforeAt:
        new Date(
          now + SETTLE_MS
        ).toISOString(),

      expiresAt:
        new Date(
          now + WINDOW_MS
        ).toISOString(),

      managedCountySchedulerTriggerCountAtOpen:
        0
    };

    props_()
      .setProperty(
        STATE_KEY,
        JSON.stringify(state)
      );

    return {
      ok:
        true,

      mode:
        'EXPLICIT_GATE1_RECOVERY_MAINTENANCE_OPEN',

      gateId:
        gateId,

      maintenanceToken:
        token,

      authority:
        authority_(),

      openedAt:
        state.openedAt,

      notBeforeAt:
        state.notBeforeAt,

      expiresAt:
        state.expiresAt,

      replacedExpiredGate:
        replacedExpiredGate,

      managedCountySchedulerTriggerCount:
        0,

      recoveryReady:
        false,

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      updateAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      deduplicationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }


  function assertRecoveryReady(
    options
  ) {
    requireAdmin_();

    options =
      options || {};

    var state =
      readState_();

    if (
      !state ||
      state.status !==
        'OPEN'
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate is not open.'
      );
    }

    if (
      !authorityMatches_(
        state.authority
      )
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate authority drifted.'
      );
    }

    var token =
      text_(
        options.maintenanceToken
      );

    if (
      !token ||
      sha256Text_(token) !==
        text_(state.tokenSha256)
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate token is invalid.'
      );
    }

    var now =
      new Date().getTime();

    var notBefore =
      new Date(
        state.notBeforeAt || ''
      ).getTime();

    var expires =
      new Date(
        state.expiresAt || ''
      ).getTime();

    if (
      !Number.isFinite(notBefore) ||
      now < notBefore
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate settling interval is not complete.'
      );
    }

    if (
      !Number.isFinite(expires) ||
      now > expires
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate has expired.'
      );
    }

    var triggers =
      managedCountyTriggers_();

    if (triggers.length !== 0) {
      throw new Error(
        'Gate 1 recovery maintenance gate lost county scheduler quiescence.'
      );
    }

    return {
      ok:
        true,

      ready:
        true,

      mode:
        'READ_ONLY_GATE1_RECOVERY_MAINTENANCE_ASSERTION',

      gateId:
        text_(state.gateId),

      authority:
        authority_(),

      openedAt:
        text_(state.openedAt),

      notBeforeAt:
        text_(state.notBeforeAt),

      expiresAt:
        text_(state.expiresAt),

      managedCountySchedulerTriggerCount:
        0,

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      updateAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      deduplicationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }


  function status() {
    requireAdmin_();

    return publicState_(
      readState_()
    );
  }


  function close(options) {
    requireAdmin_();

    options =
      options || {};

    if (
      options.confirmClose !==
        true
    ) {
      throw new Error(
        'Gate 1 recovery maintenance close requires confirmClose=true.'
      );
    }

    var state =
      readState_();

    if (!state) {
      return {
        ok:
          true,

        closed:
          false,

        reason:
          'No Gate 1 recovery maintenance gate exists.'
      };
    }

    var token =
      text_(
        options.maintenanceToken
      );

    if (
      !token ||
      sha256Text_(token) !==
        text_(state.tokenSha256)
    ) {
      throw new Error(
        'Gate 1 recovery maintenance gate close token is invalid.'
      );
    }

    props_()
      .deleteProperty(
        STATE_KEY
      );

    return {
      ok:
        true,

      closed:
        true,

      gateId:
        text_(state.gateId),

      authority:
        authority_(),

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }


  return {
    open:
      open,

    assertRecoveryReady:
      assertRecoveryReady,

    status:
      status,

    close:
      close
  };
})();


function reosCountyCodeViolationGate1RecoveryMaintenanceGateOpen(
  options
) {
  return REOS
    .CountyCodeViolationGate1RecoveryMaintenanceGate
    .open(options);
}


function reosCountyCodeViolationGate1RecoveryMaintenanceGateAssert(
  options
) {
  return REOS
    .CountyCodeViolationGate1RecoveryMaintenanceGate
    .assertRecoveryReady(options);
}


function reosCountyCodeViolationGate1RecoveryMaintenanceGateStatus() {
  return REOS
    .CountyCodeViolationGate1RecoveryMaintenanceGate
    .status();
}


function reosCountyCodeViolationGate1RecoveryMaintenanceGateClose(
  options
) {
  return REOS
    .CountyCodeViolationGate1RecoveryMaintenanceGate
    .close(options);
}
