/**
 * REOS Enterprise
 * Philadelphia Code Violations - Collapse Maintenance Gate
 *
 * Current-authority readiness facade over the certified shared county
 * mutation-exclusion lease.
 *
 * Durable state is owned exclusively by
 * REOS.CountyMutationExclusionLease.
 *
 * This module creates no second maintenance state store and persists no raw
 * capability token.
 *
 * It grants readiness metadata only.
 *
 * It grants NO collapse execution, county-data mutation, physical delete,
 * scheduler mutation, checkpoint mutation, connector execution, repair,
 * migration, MAO, or automatic-offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseMaintenanceGate =
(function () {
  'use strict';

  var MODE =
    'CODE_VIOLATION_COLLAPSE';

  var CURRENT_WINNER_FINGERPRINT =
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

  var CURRENT_AUTHORITY_SHA =
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

  var DURABLE_STATE_OWNER =
    'REOS.CountyMutationExclusionLease';


  function fail_(message) {
    throw new Error(
      'Collapse maintenance gate: ' +
      message
    );
  }


  function exactOptions_(
    options,
    required,
    optional,
    label
  ) {
    if (
      !options ||
      typeof options !== 'object' ||
      Array.isArray(options)
    ) {
      fail_(
        label +
        ' must be an object.'
      );
    }

    var allowed =
      required.concat(optional);

    Object.keys(options)
      .forEach(function (key) {
        if (
          allowed.indexOf(key) === -1
        ) {
          fail_(
            label +
            ' contains unsupported field: ' +
            key
          );
        }
      });

    required.forEach(function (key) {
      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            options,
            key
          )
      ) {
        fail_(
          label +
          ' is missing required field: ' +
          key
        );
      }
    });
  }


  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security
        .requireAdmin !==
        'function'
    ) {
      fail_(
        'Admin authority support is required.'
      );
    }

    REOS.Security
      .requireAdmin();
  }


  function lease_() {
    var lease =
      REOS
        .CountyMutationExclusionLease;

    if (
      !lease ||
      typeof lease.openExclusive !==
        'function' ||
      typeof lease.assertOwnerReady !==
        'function' ||
      typeof lease.assertWriterAllowed !==
        'function' ||
      typeof lease.status !==
        'function' ||
      typeof lease.close !==
        'function'
    ) {
      fail_(
        'Certified county mutation-exclusion lease support is required.'
      );
    }

    return lease;
  }


  function requireUuid_() {
    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities.getUuid !==
        'function'
    ) {
      fail_(
        'UUID support is required.'
      );
    }
  }


  function requireCurrentAuthority_(
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


  function authority_() {
    return {
      mode:
        MODE,

      winnerPlanFingerprintSha256:
        CURRENT_WINNER_FINGERPRINT,

      collapseAuthoritySha256:
        CURRENT_AUTHORITY_SHA
    };
  }


  function authorityFree_(result) {
    result =
      result || {};

    result.collapseExecutionAuthorityGranted =
      false;

    result.mutationAuthorityGranted =
      false;

    result.productionDataMutationAuthorityGranted =
      false;

    result.insertAuthorityGranted =
      false;

    result.updateAuthorityGranted =
      false;

    result.deleteAuthorityGranted =
      false;

    result.physicalDeleteAuthorityGranted =
      false;

    result.schedulerAuthorityGranted =
      false;

    result.checkpointMutationAuthorityGranted =
      false;

    result.connectorExecutionAuthorityGranted =
      false;

    result.migrationAuthorityGranted =
      false;

    result.repairAuthorityGranted =
      false;

    result.automaticOfferAuthorityGranted =
      false;

    return result;
  }


  function open(options) {
    exactOptions_(
      options,
      [
        'confirmMaintenanceWindow',
        'confirmManualExternalWritersQuiescent',
        'expectedWinnerPlanFingerprintSha256',
        'expectedAuthoritySha256'
      ],
      [],
      'open options'
    );

    if (
      options
        .confirmMaintenanceWindow !==
        true
    ) {
      fail_(
        'Explicit collapse-maintenance-window confirmation is required.'
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

    requireCurrentAuthority_(
      options
    );

    requireAdmin_();
    requireUuid_();

    var gateId =
      'COLLAPSE-MAINTENANCE-' +
      Utilities.getUuid();

    var opened =
      lease_()
        .openExclusive({
          confirmExclusiveLease:
            true,

          confirmManualExternalWritersQuiescent:
            true,

          ownerGateId:
            gateId,

          expectedWinnerPlanFingerprintSha256:
            CURRENT_WINNER_FINGERPRINT,

          expectedAuthoritySha256:
            CURRENT_AUTHORITY_SHA
        });

    if (
      !opened ||
      opened.opened !== true ||
      opened.authorityGeneration !==
        'CURRENT' ||
      opened.ownerGateId !==
        gateId ||
      typeof opened.leaseId !==
        'string' ||
      opened.leaseId === '' ||
      typeof opened.leaseToken !==
        'string' ||
      opened.leaseToken === ''
    ) {
      fail_(
        'Lease opening readback did not produce an exact CURRENT maintenance capability.'
      );
    }

    return authorityFree_({
      ok:
        true,

      opened:
        true,

      maintenanceReady:
        false,

      gateMode:
        MODE,

      authorityGeneration:
        'CURRENT',

      durableStateOwner:
        DURABLE_STATE_OWNER,

      gateId:
        gateId,

      leaseId:
        opened.leaseId,

      maintenanceToken:
        opened.leaseToken,

      authority:
        authority_(),

      notBefore:
        opened.notBefore,

      expiresAt:
        opened.expiresAt,

      manualExternalWritersQuiescentCertified:
        true
    });
  }


  function assertReady(options) {
    exactOptions_(
      options,
      [
        'maintenanceToken',
        'expectedLeaseId',
        'expectedGateId'
      ],
      [
        'lockContext'
      ],
      'assertReady options'
    );

    if (
      typeof options.maintenanceToken !==
        'string' ||
      options.maintenanceToken ===
        ''
    ) {
      fail_(
        'Maintenance token is required.'
      );
    }

    if (
      typeof options.expectedLeaseId !==
        'string' ||
      options.expectedLeaseId ===
        ''
    ) {
      fail_(
        'Expected lease ID is required.'
      );
    }

    if (
      typeof options.expectedGateId !==
        'string' ||
      options.expectedGateId ===
        ''
    ) {
      fail_(
        'Expected gate ID is required.'
      );
    }

    requireAdmin_();

    var leaseOptions = {
      leaseToken:
        options.maintenanceToken,

      expectedLeaseId:
        options.expectedLeaseId,

      expectedOwnerGateId:
        options.expectedGateId,

      expectedWinnerPlanFingerprintSha256:
        CURRENT_WINNER_FINGERPRINT,

      expectedAuthoritySha256:
        CURRENT_AUTHORITY_SHA
    };

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          options,
          'lockContext'
        )
    ) {
      leaseOptions.lockContext =
        options.lockContext;
    }

    var ready =
      lease_()
        .assertOwnerReady(
          leaseOptions
        );

    if (
      !ready ||
      ready.ready !==
        true ||
      ready.authorityGeneration !==
        'CURRENT' ||
      ready.ownerGateId !==
        options.expectedGateId ||
      ready.leaseId !==
        options.expectedLeaseId ||
      ready
        .winnerPlanFingerprintSha256 !==
        CURRENT_WINNER_FINGERPRINT ||
      ready
        .collapseAuthoritySha256 !==
        CURRENT_AUTHORITY_SHA ||
      ready
        .manualExternalWritersQuiescentCertified !==
        true
    ) {
      fail_(
        'Lease readiness did not match the exact CURRENT maintenance capability.'
      );
    }

    return authorityFree_({
      ok:
        true,

      ready:
        true,

      maintenanceReady:
        true,

      gateMode:
        MODE,

      authorityGeneration:
        'CURRENT',

      durableStateOwner:
        DURABLE_STATE_OWNER,

      gateId:
        ready.ownerGateId,

      leaseId:
        ready.leaseId,

      authority:
        authority_(),

      checkpoint:
        ready.checkpoint,

      schedulerHandler:
        ready.schedulerHandler,

      manualExternalWritersQuiescentCertified:
        true,

      openedAt:
        ready.openedAt,

      notBefore:
        ready.notBefore,

      expiresAt:
        ready.expiresAt
    });
  }


  function status() {
    requireAdmin_();

    var value =
      lease_()
        .status();

    return authorityFree_({
      ok:
        value.ok === true,

      maintenanceReady:
        false,

      gateMode:
        MODE,

      durableStateOwner:
        DURABLE_STATE_OWNER,

      leaseState:
        value.state || '',

      persistedStatus:
        value.persistedStatus || '',

      authorityGeneration:
        value.authorityGeneration || '',

      gateId:
        value.ownerGateId || '',

      leaseId:
        value.leaseId || '',

      authority:
        authority_(),

      manualExternalWritersQuiescentCertified:
        value
          .manualExternalWritersQuiescentCertified ===
          true,

      openedAt:
        value.openedAt || '',

      notBefore:
        value.notBefore || '',

      expiresAt:
        value.expiresAt || '',

      closedAt:
        value.closedAt || '',

      settled:
        value.settled === true,

      expired:
        value.expired === true,

      error:
        value.error || ''
    });
  }


  function close(options) {
    exactOptions_(
      options,
      [
        'confirmClose',
        'maintenanceToken',
        'expectedLeaseId',
        'expectedGateId'
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

    requireAdmin_();

    var closed =
      lease_()
        .close({
          confirmClose:
            true,

          leaseToken:
            options.maintenanceToken,

          expectedLeaseId:
            options.expectedLeaseId,

          expectedOwnerGateId:
            options.expectedGateId
        });

    if (
      !closed ||
      closed.closed !==
        true ||
      closed.leaseId !==
        options.expectedLeaseId ||
      closed.ownerGateId !==
        options.expectedGateId
    ) {
      fail_(
        'Maintenance capability close verification failed.'
      );
    }

    return authorityFree_({
      ok:
        true,

      closed:
        true,

      maintenanceReady:
        false,

      gateMode:
        MODE,

      authorityGeneration:
        closed.authorityGeneration || '',

      durableStateOwner:
        DURABLE_STATE_OWNER,

      gateId:
        closed.ownerGateId,

      leaseId:
        closed.leaseId,

      authority:
        authority_(),

      closedAt:
        closed.closedAt
    });
  }


  return {
    open:
      open,

    assertReady:
      assertReady,

    status:
      status,

    close:
      close
  };
})();
