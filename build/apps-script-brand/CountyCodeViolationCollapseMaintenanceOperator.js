/**
 * REOS Enterprise
 *
 * Bounded Code Violations collapse maintenance-capability transport.
 *
 * Source implementation only.
 *
 * This module delegates durable capability state exclusively to
 * REOS.CountyCodeViolationCollapseMaintenanceGate.
 *
 * It grants no county-data mutation, collapse execution, physical-delete,
 * scheduler, checkpoint, connector, MAO, offer, deployment, or retry
 * authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseMaintenanceOperator =
(function () {
  'use strict';

  function fail_(message) {
    throw new Error(
      'Collapse maintenance operator: ' +
      message
    );
  }

  function exactObject_(
    value,
    fields,
    label
  ) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
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

  function gate_() {
    var gate =
      REOS
        .CountyCodeViolationCollapseMaintenanceGate;

    if (
      !gate ||
      typeof gate.open !== 'function' ||
      typeof gate.status !== 'function' ||
      typeof gate.close !== 'function'
    ) {
      fail_(
        'Certified maintenance gate is required.'
      );
    }

    return gate;
  }

  function open(options) {
    exactObject_(
      options,
      [
        'confirmMaintenanceWindow',
        'confirmManualExternalWritersQuiescent',
        'expectedWinnerPlanFingerprintSha256',
        'expectedAuthoritySha256'
      ],
      'Open options'
    );

    return gate_()
      .open(options);
  }

  function status() {
    if (arguments.length !== 0) {
      fail_(
        'Status takes no caller authority.'
      );
    }

    return gate_()
      .status();
  }

  function close(options) {
    exactObject_(
      options,
      [
        'confirmClose',
        'maintenanceToken',
        'expectedLeaseId',
        'expectedGateId'
      ],
      'Close options'
    );

    return gate_()
      .close(options);
  }

  return Object.freeze({
    open:
      open,
    status:
      status,
    close:
      close
  });
})();


function reosCountyCodeViolationCollapseMaintenanceOpen(
  options
) {
  return REOS
    .CountyCodeViolationCollapseMaintenanceOperator
    .open(options);
}


function reosCountyCodeViolationCollapseMaintenanceStatus() {
  if (arguments.length !== 0) {
    throw new Error(
      'Collapse maintenance status takes no arguments.'
    );
  }

  return REOS
    .CountyCodeViolationCollapseMaintenanceOperator
    .status();
}


function reosCountyCodeViolationCollapseMaintenanceClose(
  options
) {
  return REOS
    .CountyCodeViolationCollapseMaintenanceOperator
    .close(options);
}
