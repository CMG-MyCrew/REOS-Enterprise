/**
 * REOS Enterprise - County ArcGIS Page Record Diagnostic
 *
 * Admin-only, read-only reconstruction of one certified Philadelphia
 * code-violations ArcGIS keyset page.
 *
 * Grants no authority to:
 * - execute the county connector/runtime bridge;
 * - mutate DISTRESS_LEADS or any production data;
 * - mutate county checkpoints;
 * - install/delete scheduler triggers;
 * - create MAO / draft-offer / offer authority.
 */
var REOS = REOS || {};

REOS.CountyArcGisPageRecordDiagnostic = (function () {
  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var BASE_WHERE =
    "violationdate >= TIMESTAMP '2025-09-01 00:00:00' " +
    "AND caseprioritydesc IN " +
    "('UNSAFE','IMMINENTLY DANGEROUS','UNFIT','HAZARDOUS','UNLAWFUL') " +
    'AND objectid <= 636638';

  var CURSOR_DOMAIN =
    'PHL-CODE-HIGH-SEED-20250901-OID636638-V1';

  var PAGE_SIZE = 50;

  function requireAdmin_() {
    REOS.Security.requireAdmin();
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

  function requireCertifiedEndpoint_() {
    var current =
      String(
        PropertiesService
          .getScriptProperties()
          .getProperty(ENDPOINT_PROPERTY) ||
        ''
      ).trim();

    if (current !== CERTIFIED_ENDPOINT) {
      throw new Error(
        'County ArcGIS page-record diagnostic endpoint authority mismatch.'
      );
    }

    return current;
  }

  function parseCursor_(value) {
    var cursor = String(value || '').trim();
    var parts = cursor.split('|');

    if (
      parts.length !== 4 ||
      parts[0] !== 'AK1' ||
      parts[1] !== CURSOR_DOMAIN
    ) {
      throw new Error(
        'County ArcGIS page-record diagnostic cursor domain mismatch.'
      );
    }

    var dateMs = Number(parts[2]);
    var objectId = Number(parts[3]);

    if (
      !isFinite(dateMs) ||
      Math.floor(dateMs) !== dateMs ||
      dateMs < 0 ||
      dateMs % 1000 !== 0 ||
      !isFinite(objectId) ||
      Math.floor(objectId) !== objectId ||
      objectId < 0
    ) {
      throw new Error(
        'County ArcGIS page-record diagnostic cursor is malformed.'
      );
    }

    return {
      raw: cursor,
      dateMs: dateMs,
      objectId: objectId
    };
  }

  function timestamp_(dateMs) {
    var date = new Date(Number(dateMs));

    if (isNaN(date.getTime())) {
      throw new Error(
        'County ArcGIS page-record diagnostic timestamp is invalid.'
      );
    }

    return date
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  }

  function fetch_(endpoint, where, orderByFields, limit) {
    var response =
      REOS.CountyAdapters.ArcGIS.fetch({
        endpoint: endpoint,

        context: {
          limit: limit,
          cursor: ''
        },

        maxLimit: limit,

        where: where,

        outFields:
          'objectid,violationdate,address,parcel_id,caseprioritydesc,violationstatus,violationnumber,violationcodetitle',

        returnGeometry: false,

        orderByFields:
          orderByFields
      }) || {};

    return Array.isArray(response.records)
      ? response.records
      : [];
  }

  function project_(record, index) {
    record = record || {};

    return {
      index: index,
      objectid:
        record.objectid === undefined ||
        record.objectid === null
          ? null
          : Number(record.objectid),

      violationdate:
        record.violationdate === undefined ||
        record.violationdate === null
          ? null
          : Number(record.violationdate),

      address:
        String(record.address || ''),

      parcelId:
        String(
          record.parcel_id ||
          record.parcelid ||
          ''
        ),

      priority:
        String(record.caseprioritydesc || ''),

      status:
        String(record.violationstatus || ''),

      violationNumber:
        String(record.violationnumber || ''),

      violationType:
        String(record.violationcodetitle || '')
    };
  }

  function run(cursor) {
    requireAdmin_();

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County ArcGIS page-record diagnostic requires zero managed scheduler triggers.'
      );
    }

    var boundary = parseCursor_(cursor);
    var endpoint = requireCertifiedEndpoint_();
    var boundaryTimestamp = timestamp_(boundary.dateMs);

    var sameWhere =
      '(' +
      BASE_WHERE +
      ') AND violationdate = TIMESTAMP \'' +
      boundaryTimestamp +
      '\' AND objectid > ' +
      boundary.objectId;

    var same =
      fetch_(
        endpoint,
        sameWhere,
        'objectid ASC',
        PAGE_SIZE
      );

    var remaining =
      PAGE_SIZE - same.length;

    if (
      remaining < 0 ||
      remaining > PAGE_SIZE
    ) {
      throw new Error(
        'County ArcGIS page-record diagnostic derived invalid remaining capacity.'
      );
    }

    var later = [];

    if (remaining > 0) {
      var laterWhere =
        '(' +
        BASE_WHERE +
        ') AND violationdate > TIMESTAMP \'' +
        boundaryTimestamp +
        '\'';

      later =
        fetch_(
          endpoint,
          laterWhere,
          'violationdate ASC, objectid ASC',
          remaining
        );
    }

    var combined =
      same.concat(later);

    if (combined.length !== PAGE_SIZE) {
      throw new Error(
        'County ArcGIS page-record diagnostic expected exactly ' +
        PAGE_SIZE +
        ' records but observed ' +
        combined.length +
        '.'
      );
    }

    var records =
      combined.map(function (record, index) {
        return project_(record, index);
      });

    var last =
      records[records.length - 1];

    var observedCursor =
      'AK1|' +
      CURSOR_DOMAIN +
      '|' +
      last.violationdate +
      '|' +
      last.objectid;

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County ArcGIS page-record diagnostic scheduler authority changed during fetch.'
      );
    }

    return {
      ok: true,
      readOnly: true,

      mode:
        'ARCGIS_PAGE_RECORD_DIAGNOSTIC',

      cursor:
        boundary.raw,

      pageSize:
        PAGE_SIZE,

      sameTimestampCount:
        same.length,

      laterTimestampCount:
        later.length,

      recordCount:
        records.length,

      observedCursor:
        observedCursor,

      records:
        records,

      connectorExecutionAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      productionDataMutationAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false,

      countySchedulerTriggerCount:
        0
    };
  }

  return {
    run: run
  };
})();

function reosCountyArcGisPageRecordDiagnostic(cursor) {
  return REOS
    .CountyArcGisPageRecordDiagnostic
    .run(cursor);
}
