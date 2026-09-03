/**
 * REOS Enterprise - County Page-23 ArcGIS Runtime Diagnostic
 *
 * One-purpose, read-only production diagnostic for the independently
 * certified Philadelphia code-violations page-23 continuation boundary.
 *
 * This module deliberately bypasses:
 * - County connector execution;
 * - county scheduler execution;
 * - database / DISTRESS_LEADS mutation;
 * - checkpoint mutation;
 * - trigger installation/deletion;
 * - deal / MAO / offer authority.
 *
 * It exercises the actual production ArcGIS adapter transport path:
 *
 * ArcGIS.fetch
 *   -> CountyAdapters.Http.appendQuery
 *   -> CountyAdapters.Http.request
 *   -> UrlFetchApp.fetch
 *   -> CountyAdapters.Http.parseJson
 */
var REOS = REOS || {};

REOS.CountyPage23ArcGisRuntimeDiagnostic = (function () {
  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var BASE_WHERE =
    "violationdate >= TIMESTAMP '2025-09-01 00:00:00' " +
    "AND caseprioritydesc IN " +
    "('UNSAFE','IMMINENTLY DANGEROUS','UNFIT','HAZARDOUS','UNLAWFUL') " +
    'AND objectid <= 636638';

  var BOUNDARY_TIMESTAMP =
    "2025-12-03 00:00:00";

  var BOUNDARY_OBJECT_ID =
    586498;

  var SAME_TIMESTAMP_LIMIT =
    50;

  var EXPECTED_SAME_TIMESTAMP_COUNT =
    4;

  var LATER_TIMESTAMP_LIMIT =
    46;

  var CURSOR_DOMAIN =
    'PHL-CODE-HIGH-SEED-20250901-OID636638-V1';

  var EXPECTED_PAGE23_CURSOR =
    'AK1|' +
    CURSOR_DOMAIN +
    '|1764929768000|587896';

  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'County page-23 diagnostic admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
  }

  function requireDependencies_() {
    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.ArcGIS ||
      typeof REOS.CountyAdapters.ArcGIS.fetch !==
        'function'
    ) {
      throw new Error(
        'County page-23 diagnostic ArcGIS adapter is unavailable.'
      );
    }

    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService.getScriptProperties !==
        'function'
    ) {
      throw new Error(
        'County page-23 diagnostic endpoint authority is unavailable.'
      );
    }

    if (
      typeof ScriptApp === 'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !==
        'function'
    ) {
      throw new Error(
        'County page-23 diagnostic trigger authority is unavailable.'
      );
    }
  }

  function managedTriggerCount_() {
    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger.getHandlerFunction ===
            'function' &&
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
          .getProperty(
            ENDPOINT_PROPERTY
          ) ||
        ''
      ).trim();

    if (current !== CERTIFIED_ENDPOINT) {
      throw new Error(
        'County page-23 diagnostic endpoint authority mismatch.'
      );
    }

    return current;
  }

  function key_(record) {
    record = record || {};

    return {
      violationdate:
        record.violationdate === undefined ||
        record.violationdate === null
          ? null
          : Number(record.violationdate),

      objectid:
        record.objectid === undefined ||
        record.objectid === null
          ? null
          : Number(record.objectid)
    };
  }

  function fetchPart_(
    endpoint,
    where,
    orderByFields,
    limit
  ) {
    var response =
      REOS.CountyAdapters.ArcGIS.fetch({
        endpoint: endpoint,

        context: {
          limit: limit,
          cursor: ''
        },

        maxLimit: limit,

        where: where,

        outFields: '*',

        returnGeometry: false,

        orderByFields:
          orderByFields
      }) || {};

    var records =
      Array.isArray(response.records)
        ? response.records
        : [];

    return {
      count:
        records.length,

      first:
        records.length
          ? key_(records[0])
          : null,

      last:
        records.length
          ? key_(
              records[
                records.length - 1
              ]
            )
          : null,

      metadata:
        response.metadata || {}
    };
  }

  function run() {
    requireAdmin_();
    requireDependencies_();

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County page-23 diagnostic requires zero managed scheduler triggers.'
      );
    }

    var endpoint =
      requireCertifiedEndpoint_();

    /*
     * Recheck immediately before network execution.
     */
    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County page-23 diagnostic scheduler authority changed before fetch.'
      );
    }

    var sameWhere =
      '(' +
      BASE_WHERE +
      ') AND violationdate = TIMESTAMP \'' +
      BOUNDARY_TIMESTAMP +
      '\' AND objectid > ' +
      BOUNDARY_OBJECT_ID;

    var same =
      fetchPart_(
        endpoint,
        sameWhere,
        'objectid ASC',
        SAME_TIMESTAMP_LIMIT
      );

    if (
      same.count !==
      EXPECTED_SAME_TIMESTAMP_COUNT
    ) {
      throw new Error(
        'County page-23 diagnostic same-timestamp count mismatch: expected ' +
        EXPECTED_SAME_TIMESTAMP_COUNT +
        ', received ' +
        same.count +
        '.'
      );
    }

    /*
     * Only the remaining page capacity may be requested.
     */
    var laterWhere =
      '(' +
      BASE_WHERE +
      ') AND violationdate > TIMESTAMP \'' +
      BOUNDARY_TIMESTAMP +
      '\'';

    var later =
      fetchPart_(
        endpoint,
        laterWhere,
        'violationdate ASC, objectid ASC',
        LATER_TIMESTAMP_LIMIT
      );

    var combinedCount =
      same.count +
      later.count;

    var terminalKey =
      later.last ||
      same.last;

    var observedCursor =
      terminalKey
        ? (
            'AK1|' +
            CURSOR_DOMAIN +
            '|' +
            terminalKey.violationdate +
            '|' +
            terminalKey.objectid
          )
        : '';

    /*
     * Final quiescence proof after both network reads.
     */
    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County page-23 diagnostic scheduler authority changed during fetch.'
      );
    }

    return {
      ok: true,
      readOnly: true,

      mode:
        'PAGE23_ARCGIS_RUNTIME_DIAGNOSTIC',

      connectorExecutionAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      productionDataMutationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false,

      countySchedulerTriggerCount:
        0,

      sameTimestamp:
        same,

      laterTimestamp:
        later,

      combinedCount:
        combinedCount,

      observedPage23Cursor:
        observedCursor,

      expectedPage23Cursor:
        EXPECTED_PAGE23_CURSOR,

      matchesExpectedPage23Cursor:
        observedCursor ===
        EXPECTED_PAGE23_CURSOR
    };
  }

  return {
    run: run
  };
})();

function reosCountyPage23ArcGisRuntimeDiagnostic() {
  return REOS
    .CountyPage23ArcGisRuntimeDiagnostic
    .run();
}
