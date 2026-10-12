(function (root) {
  'use strict';

  var VERSION = 'v1';

  var TABLES = Object.freeze({
    ARV: 'DEAL_ARV_EVIDENCE',
    REPAIR: 'DEAL_REPAIR_SCOPE_EVIDENCE',
    READINESS: 'DEAL_OFFER_READINESS_EVIDENCE'
  });

  var HEADERS = Object.freeze({
    DEAL_ARV_EVIDENCE: Object.freeze([
      'ARV Evidence ID',
      'Schema Version',
      'Deal ID',
      'Canonical Property Key',
      'Evidence Status',
      'Confidence Status',
      'Estimated ARV',
      'Accepted Comparable Evidence IDs JSON',
      'Accepted Comparable Count',
      'Minimum Comparable Count',
      'Valuation Method',
      'Valuation Inputs JSON',
      'Supported Low Value',
      'Supported High Value',
      'Review Required',
      'Reason Codes JSON',
      'Evidence Generated At',
      'Persisted At',
      'Source Engine',
      'Source Engine Version',
      'Provenance JSON',
      'Idempotency Key',
      'Supersedes Evidence ID'
    ]),

    DEAL_REPAIR_SCOPE_EVIDENCE: Object.freeze([
      'Repair Scope Evidence ID',
      'Schema Version',
      'Deal ID',
      'Canonical Property Key',
      'Scope Status',
      'Scope Complete',
      'Estimated Repair Cost',
      'Review Required',
      'Reason Codes JSON',
      'Scope Inputs JSON',
      'Evidence Generated At',
      'Persisted At',
      'Source Engine',
      'Source Engine Version',
      'Provenance JSON',
      'Idempotency Key',
      'Supersedes Evidence ID'
    ]),

    DEAL_OFFER_READINESS_EVIDENCE: Object.freeze([
      'Readiness Evidence ID',
      'Schema Version',
      'Deal ID',
      'Canonical Property Key',
      'ARV Evidence ID',
      'Repair Scope Evidence ID',
      'Decision',
      'Comp Supported ARV Ready',
      'Repair Scope Ready',
      'Reason Codes JSON',
      'Evaluated At',
      'Persisted At',
      'Gate Version',
      'Idempotency Key',
      'Supersedes Evidence ID'
    ])
  });

  var OUTCOMES = Object.freeze([
    'provisioned',
    'already_provisioned',
    'rejected_spreadsheet_identity',
    'rejected_existing_schema',
    'rejected_authorization',
    'failed_lock',
    'failed_provisioning',
    'failed_verification'
  ]);

  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value);
    }
    return value;
  }

  function result(outcome, extra) {
    var value = {
      outcome: outcome,
      version: VERSION
    };

    Object.keys(extra || {}).forEach(function (key) {
      value[key] = extra[key];
    });

    return freeze(value);
  }

  function isNonBlankString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  function exactArray(actual, expected) {
    if (!Array.isArray(actual) || actual.length !== expected.length) {
      return false;
    }

    for (var i = 0; i < expected.length; i += 1) {
      if (actual[i] !== expected[i]) {
        return false;
      }
    }

    return true;
  }

  function requireDependencies(deps) {
    if (!deps || typeof deps !== 'object') {
      throw new Error('Provisioning dependencies are required.');
    }

    [
      'resolveSpreadsheetIdentity',
      'getExpectedSpreadsheetIdentity',
      'getSheetHeaders',
      'createSheetWithHeaders',
      'acquireLock',
      'releaseLock'
    ].forEach(function (name) {
      if (typeof deps[name] !== 'function') {
        throw new Error('Missing provisioning dependency: ' + name);
      }
    });

    return deps;
  }

  function verifySpreadsheetIdentity(deps) {
    var expected;
    var resolved;

    try {
      expected = deps.getExpectedSpreadsheetIdentity();
      resolved = deps.resolveSpreadsheetIdentity();
    } catch (error) {
      return result('rejected_spreadsheet_identity', {
        spreadsheetIdentityVerified: false
      });
    }

    if (
      !isNonBlankString(expected) ||
      !isNonBlankString(resolved) ||
      expected !== resolved
    ) {
      return result('rejected_spreadsheet_identity', {
        spreadsheetIdentityVerified: false
      });
    }

    return result('already_provisioned', {
      spreadsheetIdentityVerified: true,
      spreadsheetIdentity: resolved
    });
  }

  function inspectTable(deps, tableName) {
    var expectedHeaders = HEADERS[tableName];
    var actualHeaders;

    try {
      actualHeaders = deps.getSheetHeaders(tableName);
    } catch (error) {
      return result('failed_verification', {
        tableName: tableName,
        verified: false
      });
    }

    if (actualHeaders === null || typeof actualHeaders === 'undefined') {
      return result('failed_verification', {
        tableName: tableName,
        exists: false,
        verified: false
      });
    }

    if (!exactArray(actualHeaders, expectedHeaders)) {
      return result('rejected_existing_schema', {
        tableName: tableName,
        exists: true,
        verified: false
      });
    }

    return result('already_provisioned', {
      tableName: tableName,
      exists: true,
      verified: true,
      headerCount: expectedHeaders.length
    });
  }

  function preflightProductionEvidenceStorage(options, deps) {
    deps = requireDependencies(deps);

    var identity = verifySpreadsheetIdentity(deps);

    if (!identity.spreadsheetIdentityVerified) {
      return result('rejected_spreadsheet_identity', {
        ready: false,
        spreadsheetIdentityVerified: false,
        tables: freeze([])
      });
    }

    var tables = [
      TABLES.ARV,
      TABLES.REPAIR,
      TABLES.READINESS
    ];

    var inspections = [];
    var ready = true;
    var failureOutcome = null;

    tables.forEach(function (tableName) {
      var inspected = inspectTable(deps, tableName);
      inspections.push(inspected);

      if (!inspected.verified) {
        ready = false;

        if (
          !failureOutcome ||
          inspected.outcome === 'rejected_existing_schema'
        ) {
          failureOutcome = inspected.outcome;
        }
      }
    });

    return result(
      ready ? 'already_provisioned' : (failureOutcome || 'failed_verification'),
      {
        ready: ready,
        spreadsheetIdentityVerified: true,
        spreadsheetIdentity: identity.spreadsheetIdentity,
        tables: freeze(inspections.slice())
      }
    );
  }

  function provisionProductionEvidenceStorage(options, deps) {
    deps = requireDependencies(deps);
    options = options || {};

    if (options.authorized !== true) {
      return result('rejected_authorization', {
        provisioned: false,
        ready: false
      });
    }

    var identity = verifySpreadsheetIdentity(deps);

    if (!identity.spreadsheetIdentityVerified) {
      return result('rejected_spreadsheet_identity', {
        provisioned: false,
        ready: false,
        spreadsheetIdentityVerified: false
      });
    }

    var lock;

    try {
      lock = deps.acquireLock();
    } catch (error) {
      return result('failed_lock', {
        provisioned: false,
        ready: false
      });
    }

    if (!lock) {
      return result('failed_lock', {
        provisioned: false,
        ready: false
      });
    }

    var created = [];
    var alreadyPresent = [];

    try {
      var tables = [
        TABLES.ARV,
        TABLES.REPAIR,
        TABLES.READINESS
      ];

      for (var i = 0; i < tables.length; i += 1) {
        var tableName = tables[i];
        var expectedHeaders = HEADERS[tableName];
        var actualHeaders;

        try {
          actualHeaders = deps.getSheetHeaders(tableName);
        } catch (readError) {
          return result('failed_verification', {
            provisioned: false,
            ready: false,
            failedTable: tableName,
            createdTables: freeze(created.slice()),
            alreadyProvisionedTables: freeze(alreadyPresent.slice())
          });
        }

        if (actualHeaders !== null && typeof actualHeaders !== 'undefined') {
          if (!exactArray(actualHeaders, expectedHeaders)) {
            return result('rejected_existing_schema', {
              provisioned: false,
              ready: false,
              failedTable: tableName,
              createdTables: freeze(created.slice()),
              alreadyProvisionedTables: freeze(alreadyPresent.slice())
            });
          }

          alreadyPresent.push(tableName);
          continue;
        }

        try {
          deps.createSheetWithHeaders(
            tableName,
            expectedHeaders.slice()
          );
        } catch (createError) {
          return result('failed_provisioning', {
            provisioned: false,
            ready: false,
            failedTable: tableName,
            createdTables: freeze(created.slice()),
            alreadyProvisionedTables: freeze(alreadyPresent.slice())
          });
        }

        var verificationHeaders;

        try {
          verificationHeaders = deps.getSheetHeaders(tableName);
        } catch (verificationReadError) {
          return result('failed_verification', {
            provisioned: false,
            ready: false,
            failedTable: tableName,
            createdTables: freeze(created.slice()),
            alreadyProvisionedTables: freeze(alreadyPresent.slice())
          });
        }

        if (!exactArray(verificationHeaders, expectedHeaders)) {
          return result('failed_verification', {
            provisioned: false,
            ready: false,
            failedTable: tableName,
            createdTables: freeze(created.slice()),
            alreadyProvisionedTables: freeze(alreadyPresent.slice())
          });
        }

        created.push(tableName);
      }

      var finalPreflight = preflightProductionEvidenceStorage(
        { explicit: true },
        deps
      );

      if (!finalPreflight.ready) {
        return result('failed_verification', {
          provisioned: false,
          ready: false,
          createdTables: freeze(created.slice()),
          alreadyProvisionedTables: freeze(alreadyPresent.slice())
        });
      }

      return result(
        created.length > 0 ? 'provisioned' : 'already_provisioned',
        {
          provisioned: created.length > 0,
          ready: true,
          spreadsheetIdentityVerified: true,
          spreadsheetIdentity: identity.spreadsheetIdentity,
          createdTables: freeze(created.slice()),
          alreadyProvisionedTables: freeze(alreadyPresent.slice())
        }
      );
    } finally {
      try {
        deps.releaseLock(lock);
      } catch (releaseError) {
        // Lock release failure must not create a second mutation path.
      }
    }
  }

  var api = Object.freeze({
    VERSION: VERSION,
    TABLES: TABLES,
    HEADERS: HEADERS,
    OUTCOMES: OUTCOMES,
    preflightProductionEvidenceStorage: preflightProductionEvidenceStorage,
    provisionProductionEvidenceStorage: provisionProductionEvidenceStorage
  });

  root.REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_V1 = api;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
}(
  typeof globalThis !== 'undefined'
    ? globalThis
    : this
));
