/**
 * REOS Enterprise - County ArcGIS Keyset Boundary Diagnostic
 *
 * Generic read-only diagnostic for the certified Philadelphia
 * code-violations composite ArcGIS keyset boundary.
 *
 * This module deliberately grants no authority to:
 * - execute the county connector/runtime bridge;
 * - mutate DISTRESS_LEADS or other production data;
 * - mutate county checkpoints;
 * - install/delete scheduler triggers;
 * - create MAO / draft-offer / offer authority.
 */
var REOS = REOS || {};

REOS.CountyArcGisKeysetBoundaryDiagnostic = (function () {
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
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'County ArcGIS keyset diagnostic admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
  }

  function requireDependencies_() {
    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.ArcGIS ||
      typeof REOS.CountyAdapters.ArcGIS.fetch !== 'function'
    ) {
      throw new Error(
        'County ArcGIS keyset diagnostic ArcGIS adapter is unavailable.'
      );
    }

    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService.getScriptProperties !== 'function'
    ) {
      throw new Error(
        'County ArcGIS keyset diagnostic endpoint authority is unavailable.'
      );
    }

    if (
      typeof ScriptApp === 'undefined' ||
      !ScriptApp ||
      typeof ScriptApp.getProjectTriggers !== 'function'
    ) {
      throw new Error(
        'County ArcGIS keyset diagnostic trigger authority is unavailable.'
      );
    }
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
        'County ArcGIS keyset diagnostic endpoint authority mismatch.'
      );
    }

    return current;
  }

  function parseCursor_(value) {
    var cursor =
      String(value || '').trim();

    var parts =
      cursor.split('|');

    if (
      parts.length !== 4 ||
      parts[0] !== 'AK1' ||
      parts[1] !== CURSOR_DOMAIN
    ) {
      throw new Error(
        'County ArcGIS keyset diagnostic cursor domain mismatch.'
      );
    }

    var dateMs =
      Number(parts[2]);

    var objectId =
      Number(parts[3]);

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
        'County ArcGIS keyset diagnostic cursor is malformed.'
      );
    }

    return {
      raw: cursor,
      dateMs: dateMs,
      objectId: objectId
    };
  }

  function timestamp_(dateMs) {
    var date =
      new Date(Number(dateMs));

    if (isNaN(date.getTime())) {
      throw new Error(
        'County ArcGIS keyset diagnostic timestamp is invalid.'
      );
    }

    return date
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
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
    phase,
    where,
    orderByFields,
    limit
  ) {
    try {
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
        ok: true,
        phase: phase,
        requestedLimit: limit,
        count: records.length,

        first:
          records.length
            ? key_(records[0])
            : null,

        last:
          records.length
            ? key_(records[records.length - 1])
            : null,

        metadata:
          response.metadata || {}
      };
    } catch (error) {
      return {
        ok: false,
        phase: phase,
        requestedLimit: limit,
        count: 0,
        first: null,
        last: null,
        metadata: {},
        error:
          error && error.message
            ? String(error.message)
            : String(error)
      };
    }
  }

  function run(cursor) {
    requireAdmin_();
    requireDependencies_();

    var boundary =
      parseCursor_(cursor);

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County ArcGIS keyset diagnostic requires zero managed scheduler triggers.'
      );
    }

    var endpoint =
      requireCertifiedEndpoint_();

    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County ArcGIS keyset diagnostic scheduler authority changed before fetch.'
      );
    }

    var boundaryTimestamp =
      timestamp_(boundary.dateMs);

    var sameWhere =
      '(' +
      BASE_WHERE +
      ') AND violationdate = TIMESTAMP \'' +
      boundaryTimestamp +
      '\' AND objectid > ' +
      boundary.objectId;

    var same =
      fetchPart_(
        endpoint,
        'SAME_TIMESTAMP',
        sameWhere,
        'objectid ASC',
        PAGE_SIZE
      );

    if (!same.ok) {
      return result_(
        boundary,
        boundaryTimestamp,
        same,
        null,
        null,
        ''
      );
    }

    var remainingCapacity =
      PAGE_SIZE -
      same.count;

    if (
      remainingCapacity < 0 ||
      remainingCapacity > PAGE_SIZE
    ) {
      throw new Error(
        'County ArcGIS keyset diagnostic derived invalid remaining page capacity: ' +
        remainingCapacity +
        '.'
      );
    }

    var later = {
      ok: true,
      phase: 'LATER_TIMESTAMP',
      requestedLimit: 0,
      count: 0,
      first: null,
      last: null,
      metadata: {}
    };

    if (remainingCapacity > 0) {
      var laterWhere =
        '(' +
        BASE_WHERE +
        ') AND violationdate > TIMESTAMP \'' +
        boundaryTimestamp +
        '\'';

      later =
        fetchPart_(
          endpoint,
          'LATER_TIMESTAMP',
          laterWhere,
          'violationdate ASC, objectid ASC',
          remainingCapacity
        );
    }

    var observedCursor = '';

    if (later.ok) {
      var terminalKey =
        later.last ||
        same.last;

      if (terminalKey) {
        observedCursor =
          'AK1|' +
          CURSOR_DOMAIN +
          '|' +
          terminalKey.violationdate +
          '|' +
          terminalKey.objectid;
      }
    }

    return result_(
      boundary,
      boundaryTimestamp,
      same,
      later,
      remainingCapacity,
      observedCursor
    );
  }

  function result_(
    boundary,
    boundaryTimestamp,
    same,
    later,
    remainingCapacity,
    observedCursor
  ) {
    if (managedTriggerCount_() !== 0) {
      throw new Error(
        'County ArcGIS keyset diagnostic scheduler authority changed during fetch.'
      );
    }

    var combinedCount =
      same && same.ok
        ? (
            same.count +
            (
              later && later.ok
                ? later.count
                : 0
            )
          )
        : 0;

    var failedPhase =
      !same || !same.ok
        ? 'SAME_TIMESTAMP'
        : (
            later && !later.ok
              ? 'LATER_TIMESTAMP'
              : ''
          );

    return {
      ok: failedPhase === '',
      readOnly: true,

      mode:
        'ARCGIS_KEYSET_BOUNDARY_DIAGNOSTIC',

      cursor:
        boundary.raw,

      cursorDomain:
        CURSOR_DOMAIN,

      boundaryDateMs:
        boundary.dateMs,

      boundaryTimestamp:
        boundaryTimestamp,

      boundaryObjectId:
        boundary.objectId,

      pageSize:
        PAGE_SIZE,

      sameTimestamp:
        same,

      laterTimestamp:
        later,

      remainingCapacity:
        remainingCapacity,

      combinedCount:
        combinedCount,

      fullPage:
        failedPhase === '' &&
        combinedCount === PAGE_SIZE,

      failedPhase:
        failedPhase,

      observedCursor:
        observedCursor,

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
        0
    };
  }

  return {
    run: run
  };
})();

function reosCountyArcGisKeysetBoundaryDiagnostic(cursor) {
  return REOS
    .CountyArcGisKeysetBoundaryDiagnostic
    .run(cursor);
}
