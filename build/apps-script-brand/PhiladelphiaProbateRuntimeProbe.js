/**
 * REOS Enterprise v3.0
 * Philadelphia Probate PB1 Runtime Probe V1
 *
 * Zero-side-effect diagnostic only.
 *
 * This probe reads already-loaded JavaScript metadata and function
 * identities only. It performs no function invocation on either the
 * recurring-source module or Philadelphia county connector.
 *
 * No HTTP, connector registration, source authority invocation,
 * scheduler inspection, persistence, configuration, production-data
 * access, ARV, repair-scope, MAO, or offer authority.
 */

function reosPhiladelphiaProbateRuntimeProbe() {
  var source =
    typeof REOS !== 'undefined' &&
    REOS
      ? REOS.PhiladelphiaProbateRecurringSource
      : null;

  var connector =
    typeof REOS !== 'undefined' &&
    REOS
      ? REOS.PAPhiladelphiaCountyConnector
      : null;

  if (!source) {
    throw new Error(
      'Philadelphia probate PB1 runtime source is not loaded.'
    );
  }

  if (!connector) {
    throw new Error(
      'Philadelphia county connector is not loaded.'
    );
  }

  if (source.cursorPrefix !== 'PB1') {
    throw new Error(
      'Philadelphia probate PB1 cursor prefix mismatch.'
    );
  }

  if (
    source.cursorDomainId !==
    'PHL-PROBATE-PB1-V1'
  ) {
    throw new Error(
      'Philadelphia probate PB1 cursor domain mismatch.'
    );
  }

  if (source.maxLookbackDays !== 10) {
    throw new Error(
      'Philadelphia probate PB1 lookback mismatch.'
    );
  }

  if (source.noticePageSize !== 25) {
    throw new Error(
      'Philadelphia probate PB1 notice page size mismatch.'
    );
  }

  if (
    typeof source.approvedSourceUrl !==
    'function'
  ) {
    throw new Error(
      'Philadelphia probate approved-source helper is not loaded.'
    );
  }

  if (typeof source.parseCursor !== 'function') {
    throw new Error(
      'Philadelphia probate cursor parser is not loaded.'
    );
  }

  if (typeof source.encodeCursor !== 'function') {
    throw new Error(
      'Philadelphia probate cursor encoder is not loaded.'
    );
  }

  if (typeof source.resolve !== 'function') {
    throw new Error(
      'Philadelphia probate resolver is not loaded.'
    );
  }

  if (
    typeof connector.connectorId !==
      'string' ||
    !connector.connectorId
  ) {
    throw new Error(
      'Philadelphia county connector identity is not loaded.'
    );
  }

  if (!connector.manifest) {
    throw new Error(
      'Philadelphia county connector manifest is not loaded.'
    );
  }

  if (
    typeof connector.probateSourceAuthority !==
    'function'
  ) {
    throw new Error(
      'Philadelphia probate source authority symbol is not loaded.'
    );
  }

  return {
    ok: true,
    probeVersion: 1,
    runtimeLoaded: true,

    connectorId:
      connector.connectorId,

    cursorPrefix:
      source.cursorPrefix,

    cursorDomainId:
      source.cursorDomainId,

    maxLookbackDays:
      source.maxLookbackDays,

    noticePageSize:
      source.noticePageSize,

    approvedSourceUrlPresent:
      typeof source.approvedSourceUrl ===
      'function',

    parseCursorPresent:
      typeof source.parseCursor ===
      'function',

    encodeCursorPresent:
      typeof source.encodeCursor ===
      'function',

    resolvePresent:
      typeof source.resolve ===
      'function',

    resolveExecuted: false,

    probateSourceAuthorityPresent:
      typeof connector.probateSourceAuthority ===
      'function',

    probateSourceAuthorityExecuted: false,

    externalHttpExecuted: false,
    sourceFetchExecuted: false,
    connectorRegistrationExecuted: false,
    schedulerInspectionExecuted: false,
    schedulerMutationExecuted: false,
    triggerMutationExecuted: false,
    checkpointMutationExecuted: false,
    countyDataMutationExecuted: false,
    persistenceExecuted: false,
    configurationExecuted: false,
    arvAuthorityGranted: false,
    repairScopeAuthorityGranted: false,
    maoAuthorityGranted: false,
    offerAuthorityGranted: false
  };
}
