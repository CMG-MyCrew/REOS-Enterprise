/**
 * REOS Enterprise - County C1 Maintenance Gate
 *
 * Explicit maintenance-window capability for any future C1 recovery.
 *
 * Opening the gate requires:
 * - Admin authority
 * - explicit confirmation
 * - exactly one certified Philadelphia code-violations observation key
 * - zero installable project triggers
 *
 * A ten-minute settling interval separates gate creation from recovery
 * eligibility. The recovery executor rechecks the same gate immediately
 * before network work and again while the database lock is held.
 *
 * This module does not grant automatic mutation, scheduler, MAO, or offer
 * authority.
 */
var REOS = REOS || {};

REOS.CountyC1MaintenanceGate = (function () {
  var STATE_KEY =
    'REOS_C1_MAINTENANCE_GATE_JSON';

  var SETTLE_MS =
    10 * 60 * 1000;

  var WINDOW_MS =
    30 * 60 * 1000;

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
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
        'C1 maintenance gate requires Script Properties access.'
      );
    }

    return PropertiesService
      .getScriptProperties();
  }

  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security
        .requireAdmin !==
        'function'
    ) {
      throw new Error(
        'C1 maintenance gate requires Admin authority.'
      );
    }

    REOS.Security
      .requireAdmin();
  }

  function sha256Text_(value) {
    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities
        .computeDigest !==
        'function'
    ) {
      throw new Error(
        'C1 maintenance gate requires SHA-256 support.'
      );
    }

    var digest =
      Utilities.computeDigest(
        Utilities
          .DigestAlgorithm
          .SHA_256,
        text_(value),
        Utilities
          .Charset
          .UTF_8
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
          normalized
            .toString(16);
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
        'C1 maintenance gate requires UUID support.'
      );
    }

    return Utilities
      .getUuid();
  }

  function triggers_() {
    if (
      typeof ScriptApp ===
        'undefined' ||
      !ScriptApp ||
      typeof ScriptApp
        .getProjectTriggers !==
        'function'
    ) {
      throw new Error(
        'C1 maintenance gate requires trigger inspection access.'
      );
    }

    return ScriptApp
      .getProjectTriggers()
      .map(function (trigger) {
        return {
          handler:
            typeof trigger
              .getHandlerFunction ===
              'function'
              ? String(
                  trigger
                    .getHandlerFunction()
                )
              : '',

          eventType:
            typeof trigger
              .getEventType ===
              'function'
              ? String(
                  trigger
                    .getEventType()
                )
              : '',

          source:
            typeof trigger
              .getTriggerSource ===
              'function'
              ? String(
                  trigger
                    .getTriggerSource()
                )
              : '',

          uniqueId:
            typeof trigger
              .getUniqueId ===
              'function'
              ? String(
                  trigger
                    .getUniqueId()
                )
              : ''
        };
      });
  }

  function readState_() {
    var raw =
      props_()
        .getProperty(
          STATE_KEY
        );

    if (!raw) {
      return null;
    }

    try {
      var parsed =
        JSON.parse(raw);

      return parsed &&
        typeof parsed ===
          'object'
        ? parsed
        : null;
    } catch (error) {
      throw new Error(
        'C1 maintenance gate state is invalid.'
      );
    }
  }

  function publicState_(
    state,
    triggerSnapshot
  ) {
    state =
      state ||
      {};

    triggerSnapshot =
      triggerSnapshot ||
      triggers_();

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

    return {
      ok:
        true,

      mode:
        'READ_ONLY_STATUS',

      active:
        state.status ===
          'OPEN' &&
        Number.isFinite(
          expires
        ) &&
        now <= expires,

      gateId:
        text_(
          state.gateId
        ),

      sourceObservationKey:
        text_(
          state
            .sourceObservationKey
        ),

      openedAt:
        text_(
          state.openedAt
        ),

      notBeforeAt:
        text_(
          state.notBeforeAt
        ),

      expiresAt:
        text_(
          state.expiresAt
        ),

      settled:
        Number.isFinite(
          notBefore
        ) &&
        now >= notBefore,

      expired:
        Number.isFinite(
          expires
        ) &&
        now > expires,

      triggerCount:
        triggerSnapshot.length,

      triggers:
        triggerSnapshot,

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

  function open(options) {
    requireAdmin_();

    options =
      options ||
      {};

    if (
      options
        .confirmQuiescence !==
        true
    ) {
      throw new Error(
        'C1 maintenance gate requires confirmQuiescence=true.'
      );
    }

    var sourceObservationKey =
      text_(
        options
          .sourceObservationKey
      );

    if (
      !/^pa-philadelphia\|code_violations\|[0-9]+$/
        .test(
          sourceObservationKey
        )
    ) {
      throw new Error(
        'C1 maintenance gate requires exactly one Philadelphia code-violations Source Observation Key.'
      );
    }

    var existing =
      readState_();

    var replacedExpiredGate =
      false;

    if (
      existing &&
      existing.status ===
        'OPEN'
    ) {
      var existingExpiresMs =
        new Date(
          existing.expiresAt ||
          ''
        ).getTime();

      var existingNowMs =
        new Date().getTime();

      /*
       * An active gate can never be replaced without its capability.
       * An expired gate grants no recovery authority, so an Admin may
       * replace it after again proving zero installable triggers.
       * This prevents a lost token from permanently wedging maintenance.
       */
      if (
        !Number.isFinite(
          existingExpiresMs
        ) ||
        existingNowMs <=
          existingExpiresMs
      ) {
        throw new Error(
          'C1 maintenance gate is already open; close the existing gate before creating another.'
        );
      }

      replacedExpiredGate =
        true;
    }

    var triggerSnapshot =
      triggers_();

    if (
      triggerSnapshot.length !==
        0
    ) {
      throw new Error(
        'C1 maintenance gate requires zero installable project triggers.'
      );
    }

    var token =
      newToken_();

    var gateId =
      newToken_();

    var nowMs =
      new Date().getTime();

    var state = {
      status:
        'OPEN',

      gateId:
        gateId,

      sourceObservationKey:
        sourceObservationKey,

      tokenSha256:
        sha256Text_(
          token
        ),

      openedAt:
        new Date(
          nowMs
        ).toISOString(),

      notBeforeAt:
        new Date(
          nowMs +
          SETTLE_MS
        ).toISOString(),

      expiresAt:
        new Date(
          nowMs +
          WINDOW_MS
        ).toISOString(),

      triggerCountAtOpen:
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
        'EXPLICIT_MAINTENANCE_GATE_OPEN',

      gateId:
        gateId,

      maintenanceToken:
        token,

      sourceObservationKey:
        sourceObservationKey,

      openedAt:
        state.openedAt,

      notBeforeAt:
        state.notBeforeAt,

      expiresAt:
        state.expiresAt,

      triggerCount:
        0,

      replacedExpiredGate:
        replacedExpiredGate,

      recoveryReady:
        false,

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

  function assertRecoveryReady(
    options
  ) {
    options =
      options ||
      {};

    var state =
      readState_();

    if (
      !state ||
      state.status !==
        'OPEN'
    ) {
      throw new Error(
        'C1 maintenance gate is not open.'
      );
    }

    var sourceObservationKey =
      text_(
        options
          .sourceObservationKey
      );

    if (
      sourceObservationKey !==
        text_(
          state
            .sourceObservationKey
        )
    ) {
      throw new Error(
        'C1 maintenance gate candidate does not match recovery request.'
      );
    }

    var maintenanceToken =
      text_(
        options
          .maintenanceToken
      );

    if (
      !maintenanceToken ||
      sha256Text_(
        maintenanceToken
      ) !==
        text_(
          state.tokenSha256
        )
    ) {
      throw new Error(
        'C1 maintenance gate token is invalid.'
      );
    }

    var nowMs =
      new Date().getTime();

    var notBeforeMs =
      new Date(
        state.notBeforeAt || ''
      ).getTime();

    var expiresMs =
      new Date(
        state.expiresAt || ''
      ).getTime();

    if (
      !Number.isFinite(
        notBeforeMs
      ) ||
      nowMs <
        notBeforeMs
    ) {
      throw new Error(
        'C1 maintenance gate settling interval is not complete.'
      );
    }

    if (
      !Number.isFinite(
        expiresMs
      ) ||
      nowMs >
        expiresMs
    ) {
      throw new Error(
        'C1 maintenance gate has expired.'
      );
    }

    var triggerSnapshot =
      triggers_();

    if (
      triggerSnapshot.length !==
        0
    ) {
      throw new Error(
        'C1 maintenance gate lost quiescence: installable project trigger detected.'
      );
    }

    return {
      ok:
        true,

      ready:
        true,

      mode:
        'READ_ONLY_RECOVERY_GATE_ASSERTION',

      gateId:
        text_(
          state.gateId
        ),

      sourceObservationKey:
        sourceObservationKey,

      openedAt:
        text_(
          state.openedAt
        ),

      notBeforeAt:
        text_(
          state.notBeforeAt
        ),

      expiresAt:
        text_(
          state.expiresAt
        ),

      triggerCount:
        0,

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

  function status() {
    return publicState_(
      readState_(),
      triggers_()
    );
  }

  function close(options) {
    requireAdmin_();

    options =
      options ||
      {};

    if (
      options.confirmClose !==
        true
    ) {
      throw new Error(
        'C1 maintenance gate close requires confirmClose=true.'
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
          'No C1 maintenance gate exists.'
      };
    }

    var maintenanceToken =
      text_(
        options
          .maintenanceToken
      );

    if (
      !maintenanceToken ||
      sha256Text_(
        maintenanceToken
      ) !==
        text_(
          state.tokenSha256
        )
    ) {
      throw new Error(
        'C1 maintenance gate close token is invalid.'
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
        text_(
          state.gateId
        ),

      sourceObservationKey:
        text_(
          state
            .sourceObservationKey
        ),

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


function reosCountyC1MaintenanceGateOpen(
  options
) {
  return REOS
    .CountyC1MaintenanceGate
    .open(
      options ||
      {}
    );
}


function reosCountyC1MaintenanceGateStatus() {
  if (
    !REOS.Security ||
    typeof REOS.Security
      .requireAdmin !==
      'function'
  ) {
    throw new Error(
      'C1 maintenance gate status requires Admin authority.'
    );
  }

  REOS.Security
    .requireAdmin();

  return REOS
    .CountyC1MaintenanceGate
    .status();
}


function reosCountyC1MaintenanceGateClose(
  options
) {
  return REOS
    .CountyC1MaintenanceGate
    .close(
      options ||
      {}
    );
}
