/**
 * REOS Enterprise - Philadelphia Code-Violation Durable Source Reconciliation
 *
 * Targeted, admin-only, read-only reconciliation of one persisted durable
 * violation identity against current Philadelphia ArcGIS source truth.
 *
 * No connector persistence, scheduler mutation, checkpoint mutation,
 * repair, migration, or offer authority is granted.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationDurableSourceReconciliation = (function () {
  var TABLE = 'DISTRESS_LEADS';
  var CONNECTOR_ID = 'PA-PHILADELPHIA';
  var DATASET = 'code_violations';

  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var MAX_SOURCE_ROWS = 100;

  function text_(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).trim();
  }

  function keyPart_(value) {
    return text_(value)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');
  }

  function unique_(values) {
    var seen = {};

    return (values || []).filter(function (value) {
      var key = text_(value);

      if (!key || seen[key]) {
        return false;
      }

      seen[key] = true;
      return true;
    });
  }

  function normalizeViolationNumber_(value) {
    var result = text_(value).toUpperCase();

    if (
      !result ||
      result.length > 64 ||
      !/^[A-Z0-9._-]+$/.test(result)
    ) {
      throw new Error(
        'Durable source reconciliation requires one valid Violation Number.'
      );
    }

    return result;
  }

  function sqlString_(value) {
    return "'" +
      text_(value).replace(/'/g, "''") +
      "'";
  }

  function managedTriggerCount_() {
    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger.getHandlerFunction === 'function' &&
          trigger.getHandlerFunction() ===
            'reosCountyProductionSchedulerRun'
        );
      })
      .length;
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getAll !== 'function'
    ) {
      throw new Error('Database.getAll is required.');
    }

    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error('Admin authority is required.');
    }

    if (
      !REOS.CountyRuntimeBridge ||
      typeof REOS.CountyRuntimeBridge.registerConnectors !==
        'function'
    ) {
      throw new Error('County connector registration is required.');
    }

    if (
      !REOS.CountyConnectorSDK ||
      typeof REOS.CountyConnectorSDK.get !== 'function'
    ) {
      throw new Error('County connector registry is required.');
    }

    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.ArcGIS ||
      typeof REOS.CountyAdapters.ArcGIS.fetch !== 'function'
    ) {
      throw new Error('ArcGIS read adapter is required.');
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity !== 'function'
    ) {
      throw new Error('Canonical property identity is required.');
    }
  }

  function requireCertifiedEndpoint_() {
    var endpoint = text_(
      PropertiesService
        .getScriptProperties()
        .getProperty(ENDPOINT_PROPERTY)
    );

    if (endpoint !== CERTIFIED_ENDPOINT) {
      throw new Error(
        'Durable source reconciliation endpoint authority mismatch.'
      );
    }

    return endpoint;
  }

  function canonicalKey_(row) {
    var result =
      REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity(row);

    return result && result.ok
      ? text_(result.key)
      : '';
  }

  function rawViolationNumber_(raw) {
    return text_(
      raw.VIOLATIONNUMBER ||
      raw.violationnumber ||
      raw.violation_number
    ).toUpperCase();
  }

  function rawSourceCandidate_(raw) {
    return {
      Source: CONNECTOR_ID,
      'Source Dataset': DATASET,
      'Source Record ID': text_(
        raw.objectid ||
        raw.OBJECTID
      ),
      'Violation Number': rawViolationNumber_(raw),
      'Parcel ID': text_(
        raw.parcel_id_num ||
        raw.opa_account_num
      ),
      Address: text_(
        raw.address ||
        raw.street_address ||
        raw.property_address ||
        raw.location
      ),
      City: text_(raw.city) || 'Philadelphia',
      State: 'PA',
      County: 'Philadelphia',
      Zip: text_(
        raw.zip ||
        raw.zipcode ||
        raw.zip_code
      )
    };
  }

  function sourceSummary_(raw) {
    var candidate = rawSourceCandidate_(raw);

    return {
      objectId: text_(raw.objectid || raw.OBJECTID),
      violationNumber: rawViolationNumber_(raw),
      caseNumber: text_(raw.casenumber),
      violationDate: raw.violationdate,
      parcelId: text_(raw.parcel_id_num),
      opaAccountNumber: text_(raw.opa_account_num),
      address: text_(raw.address),
      zip: text_(raw.zip),
      violationCode: text_(raw.violationcode),
      violationCodeTitle: text_(raw.violationcodetitle),
      violationStatus: text_(raw.violationstatus),
      caseStatus: text_(raw.casestatus),
      priority: text_(raw.caseprioritydesc),
      canonicalPropertyKey: canonicalKey_(candidate)
    };
  }

  function persistedSummary_(row) {
    return {
      rowNumber: Number(row._rowNumber || 0),
      distressLeadId: text_(row['Distress Lead ID']),
      sourceRecordId: text_(row['Source Record ID']),
      violationNumber: text_(row['Violation Number']),
      parcelId: text_(row['Parcel ID']),
      address: text_(row.Address),
      zip: text_(row.Zip),
      sourceObservationKey: text_(
        row['Source Observation Key'] ||
        row['Source Record Key']
      ),
      canonicalPropertyKey: canonicalKey_(row)
    };
  }

  function run(violationNumber) {
    requireDependencies_();
    REOS.Security.requireAdmin();

    var target =
      normalizeViolationNumber_(violationNumber);

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'Durable source reconciliation requires zero managed scheduler triggers.'
      );
    }

    var endpoint = requireCertifiedEndpoint_();

    REOS.CountyRuntimeBridge.registerConnectors();

    var connector =
      REOS.CountyConnectorSDK.get(CONNECTOR_ID);

    if (
      !connector ||
      typeof connector.normalize !== 'function'
    ) {
      throw new Error(
        'Registered Philadelphia connector is incomplete.'
      );
    }

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'Scheduler authority changed before source read.'
      );
    }

    var where =
      'violationnumber = ' +
      sqlString_(target);

    var response =
      REOS.CountyAdapters.ArcGIS.fetch({
        endpoint: endpoint,
        context: {
          cursor: '',
          limit: MAX_SOURCE_ROWS
        },
        maxLimit: MAX_SOURCE_ROWS,
        where: where,
        outFields: '*',
        returnGeometry: false,
        orderByFields:
          'violationnumber ASC, objectid ASC'
      }) || {};

    var rawRecords =
      Array.isArray(response.records)
        ? response.records
        : [];

    if (rawRecords.length > MAX_SOURCE_ROWS) {
      throw new Error(
        'Durable source reconciliation exceeded bounded source read.'
      );
    }

    var sourceRows =
      rawRecords
        .filter(function (raw) {
          return rawViolationNumber_(raw) === target;
        })
        .map(sourceSummary_);

    var persistedRows =
      REOS.Database
        .getAll(TABLE)
        .filter(function (row) {
          return (
            text_(row.Source) === CONNECTOR_ID &&
            text_(row['Source Dataset']) === DATASET &&
            text_(row['Violation Number']).toUpperCase() === target
          );
        })
        .map(persistedSummary_);

    var sourceCanonicalKeys =
      unique_(
        sourceRows.map(function (row) {
          return row.canonicalPropertyKey;
        })
      );

    var persistedCanonicalKeys =
      unique_(
        persistedRows.map(function (row) {
          return row.canonicalPropertyKey;
        })
      );

    var classification;

    if (sourceRows.length === 0) {
      classification = 'SOURCE_MISSING';
    } else if (sourceCanonicalKeys.length !== 1) {
      classification = 'SOURCE_PROPERTY_AMBIGUOUS';
    } else if (persistedRows.length === 0) {
      classification = 'SOURCE_NOT_PERSISTED';
    } else if (persistedCanonicalKeys.length > 1) {
      classification =
        'PERSISTED_PROPERTY_CONFLICT_SOURCE_AVAILABLE';
    } else if (
      persistedCanonicalKeys.length === 1 &&
      persistedCanonicalKeys[0] === sourceCanonicalKeys[0]
    ) {
      classification =
        sourceRows.length > 1
          ? 'SOURCE_PHYSICAL_DUPLICATE_CANONICAL_MATCH'
          : 'SOURCE_CANONICAL_MATCH';
    } else {
      classification = 'SOURCE_PERSISTED_PROPERTY_MISMATCH';
    }

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'Scheduler authority changed during source reconciliation.'
      );
    }

    return {
      ok: true,
      readOnly: true,
      mode:
        'CODE_VIOLATION_DURABLE_SOURCE_RECONCILIATION',

      connectorId: CONNECTOR_ID,
      dataset: DATASET,
      violationNumber: target,

      proposedDurableKey: [
        keyPart_(CONNECTOR_ID),
        keyPart_(DATASET),
        keyPart_(target)
      ].join('|'),

      sourceWhere: where,
      classification: classification,

      sourceRowCount: sourceRows.length,
      sourceCanonicalPropertyKeys:
        sourceCanonicalKeys,
      sourceRows: sourceRows,

      persistedRowCount: persistedRows.length,
      persistedCanonicalPropertyKeys:
        persistedCanonicalKeys,
      persistedRows: persistedRows,

      sourceConfirmedCanonicalPropertyKey:
        sourceCanonicalKeys.length === 1
          ? sourceCanonicalKeys[0]
          : '',

      arcGisMetadata: response.metadata || {},

      countySchedulerTriggerCount: 0,

      productionDataMutationAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      checkpointMutationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      repairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  return {
    run: run
  };
})();


function reosCountyCodeViolationDurableSourceReconciliation(
  violationNumber
) {
  return REOS
    .CountyCodeViolationDurableSourceReconciliation
    .run(violationNumber);
}
