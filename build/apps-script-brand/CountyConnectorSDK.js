/**
 * REOS Enterprise - County Connector SDK
 * Registry, execution, validation, persistence, deduplication, and audit.
 */
var REOS = REOS || {};

REOS.CountyConnectorSDK = (function () {
  var REGISTRY = {};
  var AUDIT_SHEET = 'COUNTY_CONNECTOR_RUNS';
  var TARGET_SHEET = 'DISTRESS_LEADS';

  var RUN_HEADERS = [
    'Run ID', 'Connector ID', 'County', 'State', 'Dataset', 'Mode', 'Status',
    'Records Fetched', 'Records Valid', 'Records Inserted', 'Records Updated',
    'Records Skipped', 'Records Failed', 'Started At', 'Completed At',
    'Duration Ms', 'Cursor', 'Message', 'Executed By'
  ];

  function register(connector) {
    validateConnector_(connector);
    REGISTRY[connector.id] = connector;
    return connector.id;
  }

  function get(connectorId) {
    return REGISTRY[String(connectorId || '').trim()] || null;
  }

  function list() {
    return Object.keys(REGISTRY).sort().map(function (id) {
      var connector = REGISTRY[id];

      return {
        id: connector.id,
        county: connector.county,
        state: connector.state,
        datasets: (connector.datasets || []).slice(),
        enabled: connector.enabled !== false,
        version: connector.version || '1.0.0'
      };
    });
  }

  function ensureInfrastructure() {
    REOS.Database.ensureTable(AUDIT_SHEET, RUN_HEADERS);

    return {
      ok: true,
      auditSheet: AUDIT_SHEET,
      connectors: list().length
    };
  }

  function run(connectorId, options) {
    options = options || {};
    ensureInfrastructure();

    var connector = get(connectorId);

    if (!connector) {
      throw new Error('County connector not registered: ' + connectorId);
    }

    if (connector.enabled === false) {
      throw new Error('County connector is disabled: ' + connectorId);
    }

    var dataset = String(
      options.dataset || connector.datasets[0] || ''
    ).trim();

    if (!dataset) {
      throw new Error('A dataset is required.');
    }

    if (connector.datasets.indexOf(dataset) === -1) {
      throw new Error(
        'Unsupported dataset for ' + connector.id + ': ' + dataset
      );
    }

    var started = new Date();
    var runId = REOS.generateId_('CCR');
    var mode = options.dryRun === false ? 'LIVE' : 'DRY_RUN';
    var cursor = String(options.cursor || '');

    var stats = {
      fetched: 0,
      valid: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0
    };

    var validationErrors = [];
    var recordErrors = [];

    insertRun_(runId, connector, dataset, mode, started, cursor);

    try {
      var context = {
        runId: runId,
        connectorId: connector.id,
        dataset: dataset,
        cursor: cursor,
        limit: Number(options.limit || 500),
        since: options.since || null,
        dryRun: options.dryRun !== false,
        config: options.config || {},
        now: started
      };

      var response = connector.fetch(context) || {};
      var rawRecords = Array.isArray(response.records)
        ? response.records
        : [];

      stats.fetched = rawRecords.length;
      cursor =
        Object.prototype.hasOwnProperty.call(
          response,
          'nextCursor'
        )
          ? String(response.nextCursor || '')
          : String(cursor || '');

      var pagePersistence =
        context.dryRun
          ? null
          : createPagePersistence_();

      rawRecords.forEach(function (raw, index) {
        try {
          var normalized = connector.normalize(raw, context);

          if (normalized && normalized.__skip === true) {
            stats.skipped += 1;
            return;
          }

          normalized = normalizeLead_(
            normalized,
            connector,
            dataset,
            runId
          );

          var validation = connector.validate
            ? connector.validate(normalized, context)
            : validateLead_(normalized);

          if (validation === true) {
            validation = { ok: true, errors: [] };
          }

          validation = validation || {
            ok: false,
            errors: ['Connector returned no validation result.']
          };

          if (!validation.ok) {
            stats.failed += 1;

            if (validationErrors.length < 5) {
              validationErrors.push({
                index: index,
                errors: validation.errors || [],
                address: normalized.Address || '',
                parcelId: normalized['Parcel ID'] || '',
                sourceRecordId:
                  normalized['Source Record ID'] || ''
              });
            }

            return;
          }

          stats.valid += 1;

          var result = persist_(
            normalized,
            context,
            pagePersistence
          );
          stats[result.action] += 1;
        } catch (recordError) {
          stats.failed += 1;

          if (recordErrors.length < 5) {
            recordErrors.push({
              index: index,
              error: String(recordError),
              message:
                recordError && recordError.message
                  ? recordError.message
                  : String(recordError),
              address:
                normalized && normalized.Address
                  ? normalized.Address
                  : '',
              parcelId:
                normalized && normalized['Parcel ID']
                  ? normalized['Parcel ID']
                  : '',
              sourceRecordId:
                normalized && normalized['Source Record ID']
                  ? normalized['Source Record ID']
                  : ''
            });
          }

          if (REOS.Logger && REOS.Logger.error) {
            REOS.Logger.error('County connector record failed', {
              connectorId: connector.id,
              dataset: dataset,
              index: index,
              error: recordError.message || String(recordError)
            });
          }
        }
      });

      var completed = new Date();

      completeRun_(
        runId,
        'Completed',
        stats,
        completed,
        started,
        cursor,
        response.message || ''
      );

      return {
        ok: true,
        runId: runId,
        connectorId: connector.id,
        dataset: dataset,
        mode: mode,
        stats: stats,
        validationErrors: validationErrors,
        recordErrors: recordErrors,
        nextCursor: cursor,
        completedAt: completed.toISOString()
      };
    } catch (error) {
      completeRun_(
        runId,
        'Failed',
        stats,
        new Date(),
        started,
        cursor,
        error.message || String(error)
      );

      throw error;
    }
  }

  function runAll(options) {
    options = options || {};
    var results = [];

    list()
      .filter(function (item) {
        return item.enabled;
      })
      .forEach(function (item) {
        item.datasets.forEach(function (dataset) {
          try {
            results.push(
              run(
                item.id,
                Object.assign({}, options, { dataset: dataset })
              )
            );
          } catch (error) {
            results.push({
              ok: false,
              connectorId: item.id,
              dataset: dataset,
              error: error.message || String(error)
            });
          }
        });
      });

    return results;
  }

  function persist_(
    record,
    context,
    pagePersistence
  ) {
    if (context.dryRun) {
      return {
        action: 'skipped',
        record: record
      };
    }

    var identity = resolveIdentity_(record);
    var naturalKey = buildNaturalKey_(
      record,
      identity
    );

    var existing = findExisting_(
      naturalKey,
      pagePersistence
    );

    if (existing) {
      var existingCanonicalPropertyKey =
        String(
          existing['Canonical Property Key'] || ''
        ).trim();

      var incomingCanonicalPropertyKey =
        String(
          identity.canonicalPropertyKey || ''
        ).trim();

      /*
       * Immutable observation identity guard.
       *
       * An exact source observation may be replayed and refreshed, but
       * it may not silently migrate from one canonical property to
       * another.
       *
       * Legacy rows with no Canonical Property Key are allowed to be
       * backfilled on their first post-migration observation replay.
       */
      if (
        existingCanonicalPropertyKey &&
        incomingCanonicalPropertyKey &&
        existingCanonicalPropertyKey !==
          incomingCanonicalPropertyKey
      ) {
        throw new Error(
          'Canonical property identity conflict for source observation ' +
          naturalKey +
          ': existing=' +
          existingCanonicalPropertyKey +
          ', incoming=' +
          incomingCanonicalPropertyKey
        );
      }

      var updated = REOS.Database.update(
        TARGET_SHEET,
        'Distress Lead ID',
        existing['Distress Lead ID'],
        Object.assign({}, record, {
          'Source Record Key': naturalKey,
          'Source Observation Key': naturalKey,
          'Canonical Property Key':
            identity.canonicalPropertyKey,
          'Last Seen At': new Date(),
          'Updated At': new Date()
        })
      );

      if (pagePersistence) {
        var existingIndex =
          pagePersistence.rows.indexOf(existing);

        if (existingIndex !== -1) {
          pagePersistence.rows[existingIndex] = updated;
        }
      }

      return {
        action: 'updated',
        id: existing['Distress Lead ID']
      };
    }

    var inserted = REOS.Database.insert(
      TARGET_SHEET,
      Object.assign({}, record, {
        'Source Record Key': naturalKey,
        'Source Observation Key': naturalKey,
        'Canonical Property Key':
          identity.canonicalPropertyKey,
        'Last Seen At': new Date()
      }),
      {
        idField: 'Distress Lead ID',
        idPrefix: 'DL'
      }
    );

    if (pagePersistence) {
      pagePersistence.rows.push(inserted);
    }

    return {
      action: 'inserted',
      id: inserted['Distress Lead ID']
    };
  }

  function createPagePersistence_() {
    return {
      rows: REOS.Database.getAll(TARGET_SHEET)
    };
  }

  function findExisting_(
    naturalKey,
    pagePersistence
  ) {
    var rows =
      pagePersistence && pagePersistence.rows
        ? pagePersistence.rows
        : [];

    if (!naturalKey) {
      return null;
    }

    return rows.find(function (row) {
      var observationKey =
        String(
          row['Source Observation Key'] || ''
        );

      var legacyKey =
        String(
          row['Source Record Key'] || ''
        );

      /*
       * Exact source-observation identity only.
       *
       * Source Record Key remains a migration-compatible alias for
       * county observations created before CanonicalPropertyIdentity.
       *
       * Address equality is intentionally NOT an upsert authority.
       */
      return (
        observationKey === naturalKey ||
        legacyKey === naturalKey
      );
    }) || null;
  }

  function normalizeLead_(record, connector, dataset, runId) {
    record = Object.assign({}, record || {});

    return Object.assign(record, {
      Address: titleCase_(record.Address),
      City: titleCase_(record.City),
      State: String(
        record.State || connector.state || ''
      ).toUpperCase(),
      Zip: normalizeZip_(record.Zip),
      County: record.County || connector.county,
      Source: record.Source || connector.id,
      'Source Dataset': record['Source Dataset'] || dataset,
      'Connector Run ID': runId,
      'Owner Name': String(record['Owner Name'] || '').trim(),
      'Parcel ID': String(record['Parcel ID'] || '').trim(),
      'Distress Type': record['Distress Type'] || dataset,
      'Estimated Value': numberOrBlank_(record['Estimated Value']),
      'Estimated Debt': numberOrBlank_(record['Estimated Debt']),
      'Tax Delinquent Amount': numberOrBlank_(
        record['Tax Delinquent Amount']
      ),
      'Violation Amount': numberOrBlank_(record['Violation Amount']),
      'Source Updated At': parseDateOrBlank_(
        record['Source Updated At']
      ),
      'Updated At': new Date()
    });
  }

  function validateLead_(record) {
    var errors = [];

    if (!record.Address) {
      errors.push('Address is required.');
    }

    if (!record.City) {
      errors.push('City is required.');
    }

    if (!/^[A-Z]{2}$/.test(String(record.State || ''))) {
      errors.push('State must be a two-letter code.');
    }

    if (
      record.Zip &&
      !/^\d{5}(-\d{4})?$/.test(String(record.Zip))
    ) {
      errors.push('Zip is invalid.');
    }

    if (!record['Parcel ID'] && !record['Source Record ID']) {
      errors.push('Parcel ID or Source Record ID is required.');
    }

    return {
      ok: errors.length === 0,
      errors: errors
    };
  }

  function validateConnector_(connector) {
    if (!connector || typeof connector !== 'object') {
      throw new Error('Connector definition is required.');
    }

    ['id', 'county', 'state'].forEach(function (field) {
      if (!String(connector[field] || '').trim()) {
        throw new Error(
          'Connector missing required field: ' + field
        );
      }
    });

    if (
      !Array.isArray(connector.datasets) ||
      !connector.datasets.length
    ) {
      throw new Error('Connector datasets are required.');
    }

    if (typeof connector.fetch !== 'function') {
      throw new Error('Connector fetch(context) is required.');
    }

    if (typeof connector.normalize !== 'function') {
      throw new Error(
        'Connector normalize(record, context) is required.'
      );
    }
  }

  function resolveIdentity_(record) {
    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity.resolve !==
        'function'
    ) {
      throw new Error(
        'CanonicalPropertyIdentity is not loaded.'
      );
    }

    var identity =
      REOS.CanonicalPropertyIdentity.resolve(
        record
      );

    if (
      !identity ||
      !identity.sourceObservationKey ||
      !identity.canonicalPropertyKey
    ) {
      throw new Error(
        'Canonical property resolver returned incomplete identity.'
      );
    }

    return identity;
  }

  /*
   * Compatibility wrapper.
   *
   * The county natural key now means immutable source-observation
   * identity. It is deliberately NOT canonical property identity.
   */
  function buildNaturalKey_(
    record,
    identity
  ) {
    identity =
      identity ||
      resolveIdentity_(record);

    return identity.sourceObservationKey;
  }

  function insertRun_(
    runId,
    connector,
    dataset,
    mode,
    started,
    cursor
  ) {
    REOS.Database.insert(AUDIT_SHEET, {
      'Run ID': runId,
      'Connector ID': connector.id,
      County: connector.county,
      State: connector.state,
      Dataset: dataset,
      Mode: mode,
      Status: 'Running',
      'Records Fetched': 0,
      'Records Valid': 0,
      'Records Inserted': 0,
      'Records Updated': 0,
      'Records Skipped': 0,
      'Records Failed': 0,
      'Started At': started,
      Cursor: cursor,
      Message: '',
      'Executed By': getExecutedBy_()
    });
  }

  function completeRun_(
    runId,
    status,
    stats,
    completed,
    started,
    cursor,
    message
  ) {
    REOS.Database.update(
      AUDIT_SHEET,
      'Run ID',
      runId,
      {
        Status: status,
        'Records Fetched': stats.fetched,
        'Records Valid': stats.valid,
        'Records Inserted': stats.inserted,
        'Records Updated': stats.updated,
        'Records Skipped': stats.skipped,
        'Records Failed': stats.failed,
        'Completed At': completed,
        'Duration Ms': completed.getTime() - started.getTime(),
        Cursor: cursor,
        Message: message || ''
      }
    );
  }

  function getExecutedBy_() {
    try {
      return Session.getActiveUser().getEmail() || 'terminal';
    } catch (error) {
      return 'terminal';
    }
  }

  function normalizeText_(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function normalizeZip_(value) {
    var zip = String(value || '').trim();

    if (!zip) {
      return '';
    }

    var match = zip.match(/\d{5}(?:-\d{4})?/);
    return match ? match[0] : zip;
  }

  function titleCase_(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function numberOrBlank_(value) {
    if (
      value === '' ||
      value === null ||
      typeof value === 'undefined'
    ) {
      return '';
    }

    var normalized = String(value)
      .replace(/[$,]/g, '')
      .trim();

    var number = Number(normalized);
    return isNaN(number) ? '' : number;
  }

  function parseDateOrBlank_(value) {
    if (!value) {
      return '';
    }

    var date = value instanceof Date
      ? value
      : new Date(value);

    return isNaN(date.getTime()) ? '' : date;
  }

  function auditRunDiagnostic() {
    var runId = 'CCR-20260822003246-6692';

    var row = REOS.Database
      .getAll(AUDIT_SHEET)
      .filter(function (candidate) {
        return candidate['Run ID'] === runId;
      })[0] || null;

    return JSON.parse(JSON.stringify(row, function (key, value) {
      return value instanceof Date
        ? value.toISOString()
        : value;
    }));
  }

  function recentRuns(limit) {
    var requested = Number(limit || 25);

    if (
      !isFinite(requested) ||
      requested <= 0
    ) {
      requested = 25;
    }

    var boundedLimit = Math.min(
      Math.floor(requested),
      100
    );

    var rows = REOS.Database
      .getAll(AUDIT_SHEET)
      .slice()
      .reverse()
      .slice(0, boundedLimit);

    return JSON.parse(JSON.stringify(rows, function (key, value) {
      return value instanceof Date
        ? value.toISOString()
        : value;
    }));
  }

  return {
    register: register,
    get: get,
    list: list,
    ensureInfrastructure: ensureInfrastructure,
    run: run,
    runAll: runAll,
    recentRuns: recentRuns,
    auditRunDiagnostic: auditRunDiagnostic,
    validateLead: validateLead_
  };
})();

function reosCountyConnectorRecentRuns(limit) {
  return REOS.CountyConnectorSDK.recentRuns(limit);
}

function reosCountyAuditRunDiagnostic() {
  return REOS.CountyConnectorSDK.auditRunDiagnostic();
}
