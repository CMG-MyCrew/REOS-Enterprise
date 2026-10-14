/**
 * GENERATED Camden assessment research facade; do not edit directly.
 * Canonical generator: pilots/nj-camden/generate-camden-assessment-research.js
 * Parcel identity SHA256: c17b3f5da27050249a9635591e0e18b244466cb9dc8019cdfd5ca969a3aa710f
 * Pagination policy SHA256: a16b59cf45c70637f5d79da6601cbd6919458c1a3770e811f80c09ef889e623d
 * No SDK registration, storage, scheduler, MAO or offer methods.
 */
var REOS = REOS || {};
REOS.NJCamdenAssessmentResearch = (function () {
  'use strict';
'use strict';

/*
 * REOS NJ Camden parcel identity pilot.
 *
 * Offline only. No SDK registration, network access,
 * persistence, scheduler, MAO, or offer authority.
 */

const CONNECTOR_ID = 'NJ-CAMDEN';
const DATASET = 'property_assessment';

function text(value) {
  return value == null ? '' : String(value).trim();
}

function fail(reason) {
  return {
    ok: false,
    reason,
    record: null
  };
}

function normalizeCamdenParcel(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fail('INVALID_SOURCE_RECORD');
  }

  const county = text(raw.COUNTY).toUpperCase();

  if (county !== 'CAMDEN') {
    return fail('COUNTY_NOT_CERTIFIED');
  }

  const pin = text(raw.PAMS_PIN);

  if (!pin) {
    return fail('MISSING_CERTIFIED_PARCEL_ID');
  }

  const objectId = text(raw.OBJECTID);

  if (!objectId) {
    return fail('MISSING_SOURCE_RECORD_ID');
  }

  if (
    !/^[1-9][0-9]*$/.test(objectId) ||
    !Number.isSafeInteger(Number(objectId))
  ) {
    return fail('INVALID_SOURCE_RECORD_ID');
  }

  const address = text(raw.ST_ADDRESS || raw.PROP_LOC);

  if (!address) {
    return fail('MISSING_PROPERTY_ADDRESS');
  }

  const record = {
    connectorId: CONNECTOR_ID,
    dataset: DATASET,
    state: 'NJ',
    county: 'Camden',

    propertyIdentity: 'NJ:CAMDEN:PAMS_PIN:' + pin,
    parcelId: pin,
    sourceRecordId: objectId,

    address,
    municipality: text(raw.MUN_NAME),

    sourceType: 'OFFICIAL_PARCEL_ASSESSMENT',
    classification: 'ASSESSMENT_ONLY',

    distressVerified: false,
    actionableDistress: false,

    arv: null,
    repairScope: null,

    maoAuthorized: false,
    offerGenerationAuthorized: false,
    offerSubmissionAuthorized: false,

    disposition: 'RESEARCH_ONLY'
  };

  return {
    ok: true,
    reason: 'IDENTITY_CERTIFIED',
    record
  };
}

function reconcileCamdenBatch(rawRecords) {
  if (!Array.isArray(rawRecords)) {
    return {
      ok: false,
      reason: 'INVALID_BATCH',
      records: []
    };
  }

  const results = rawRecords.map(normalizeCamdenParcel);
  const groups = new Map();

  results.forEach((result, index) => {
    if (!result.ok) return;

    const record = result.record;
    const key = record.propertyIdentity;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(index);
  });

  for (const indexes of groups.values()) {
    const evidence = new Set();

    for (const index of indexes) {
      const record = results[index].record;

      evidence.add(
        JSON.stringify([
          record.address.trim().toUpperCase()
            .replace(/\s+/g, ' '),
          record.municipality.trim().toUpperCase()
            .replace(/\s+/g, ' ')
        ])
      );
    }

    if (evidence.size > 1) {
      for (const index of indexes) {
        results[index] = {
          ok: false,
          reason: 'PARCEL_IDENTITY_CONFLICT',
          record: null,
          disposition: 'RESEARCH_REVIEW_REQUIRED'
        };
      }
    } else if (indexes.length > 1) {
      for (const index of indexes.slice(1)) {
        results[index] = {
          ...results[index],
          reason: 'DUPLICATE_SOURCE_PARCEL'
        };
      }
    }
  }

  const conflict = results.some(
    result => result.reason === 'PARCEL_IDENTITY_CONFLICT'
  );

  return {
    ok: results.every(result => result.ok),
    reason: conflict
      ? 'RESEARCH_REVIEW_REQUIRED'
      : results.every(result => result.ok)
        ? 'BATCH_RECONCILED'
        : 'BATCH_VALIDATION_FAILED',
    records: results
  };
}

'use strict';

const COUNTY = 'CAMDEN';
const MAX_PAGE_SIZE = 500;
const ORDER = 'OBJECTID ASC';

function positiveInteger(value) {
  if (typeof value !== 'number' &&
      typeof value !== 'string') return null;

  const s = String(value).trim();
  if (!/^[1-9][0-9]*$/.test(s)) return null;

  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

function cursorValue(value) {
  if (value === null || value === undefined ||
      value === '') return 0;

  return positiveInteger(value);
}

function planPage(cursor, requestedLimit) {
  const last = cursorValue(cursor);
  const requested = positiveInteger(requestedLimit);

  if (last === null) {
    return {ok: false, reason: 'INVALID_CURSOR'};
  }
  if (requested === null) {
    return {ok: false, reason: 'INVALID_LIMIT'};
  }

  const limit = Math.min(requested, MAX_PAGE_SIZE);

  return {
    ok: true,
    reason: 'PAGE_PLANNED',
    limit,
    lastObjectId: last,
    where: "COUNTY='CAMDEN' AND OBJECTID > " + last,
    orderByFields: ORDER,
    resultRecordCount: limit,
    resultOffset: 0,
    returnGeometry: false
  };
}

function evaluatePage(plan, features, exceededTransferLimit) {
  if (!plan || plan.ok !== true ||
      !Number.isSafeInteger(plan.lastObjectId) ||
      !Number.isSafeInteger(plan.limit) ||
      plan.limit < 1 || plan.limit > MAX_PAGE_SIZE ||
      !Array.isArray(features) ||
      typeof exceededTransferLimit !== 'boolean') {
    return {ok: false, reason: 'INVALID_PAGE_RESPONSE'};
  }

  // Reconstruct the approved query rather than trusting caller fields.
  const canonical = planPage(
    plan.lastObjectId === 0 ? '' : String(plan.lastObjectId),
    plan.limit
  );

  if (
    !canonical.ok ||
    plan.where !== canonical.where ||
    plan.orderByFields !== canonical.orderByFields ||
    plan.resultRecordCount !== canonical.resultRecordCount ||
    plan.resultOffset !== canonical.resultOffset ||
    plan.returnGeometry !== canonical.returnGeometry
  ) {
    return {ok: false, reason: 'PAGE_PLAN_INTEGRITY_FAILED'};
  }

  if (features.length > plan.limit) {
    return {ok: false, reason: 'PAGE_LIMIT_EXCEEDED'};
  }

  let last = plan.lastObjectId;

  for (const feature of features) {
    const raw = feature && feature.attributes
      ? feature.attributes : feature;
    const id = raw && positiveInteger(raw.OBJECTID);

    if (id === null || id <= last ||
        String(raw.COUNTY || '').trim().toUpperCase() !== COUNTY) {
      return {ok: false, reason: 'UNSAFE_PAGE_ORDER_OR_IDENTITY'};
    }
    last = id;
  }

  if (features.length === 0 && exceededTransferLimit) {
    return {ok: false, reason: 'EMPTY_TRUNCATED_PAGE'};
  }

  return {
    ok: true,
    reason: features.length ? 'PAGE_CONTINUATION' :
      'EMPTY_PAGE_OBSERVED',
    nextCursor: String(last),
    recordCount: features.length,
    emptyPageObserved: features.length === 0,
    fullCoverageCertified: false,
    persistenceAuthorized: false
  };
}


  var ENDPOINT = 'https://maps.nj.gov/arcgis/rest/services/Framework/Cadastral/MapServer/0/query';
  var FIELDS = 'OBJECTID,PAMS_PIN,COUNTY,ST_ADDRESS,PROP_LOC,MUN_NAME';
  var CHECKPOINT_SCHEMA = 'NJ-CAMDEN-READONLY-KEYSET-V1';

  function assertKeys_(value, allowed) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('INVALID_RESEARCH_INPUT');
    }
    var keys = Object.keys(value);
    for (var i = 0; i < keys.length; i++) {
      if (allowed.indexOf(keys[i]) < 0) {
        throw new Error('RESEARCH_INPUT_FIELD_NOT_ALLOWED');
      }
    }
  }

  function fetchPage(input) {
    assertKeys_(input, ['county', 'dataset', 'mode', 'limit', 'checkpoint']);
    if (input.county !== 'CAMDEN' || input.dataset !== 'property_assessment' ||
        input.mode !== 'RESEARCH_ONLY') {
      throw new Error('ASSESSMENT_RESEARCH_SCOPE_REQUIRED');
    }
    var requestedLimit = input.limit === undefined ? 500 : input.limit;
    var initial = planPage('', requestedLimit);
    if (!initial.ok) throw new Error(initial.reason);
    var cursor = '';
    var pageNumber = 0;
    var total = 0;
    if (input.checkpoint !== undefined && input.checkpoint !== null) {
      var cp = input.checkpoint;
      assertKeys_(cp, ['schema', 'connectorId', 'dataset', 'mode', 'source',
        'lastObjectId', 'pageNumber', 'recordCount', 'limit']);
      if (Object.keys(cp).length !== 9 || cp.schema !== CHECKPOINT_SCHEMA ||
          cp.connectorId !== 'NJ-CAMDEN' || cp.dataset !== 'property_assessment' ||
          cp.mode !== 'RESEARCH_ONLY' || cp.source !== ENDPOINT ||
          cp.limit !== initial.limit ||
          !Number.isSafeInteger(cp.pageNumber) || cp.pageNumber < 1 ||
          !Number.isSafeInteger(cp.recordCount) || cp.recordCount < cp.pageNumber ||
          !positiveInteger(cp.lastObjectId)) {
        throw new Error('UNVERIFIED_RESEARCH_CHECKPOINT');
      }
      cursor = String(cp.lastObjectId);
      pageNumber = cp.pageNumber;
      total = cp.recordCount;
    }
    var plan = planPage(cursor, requestedLimit);
    if (!plan.ok) throw new Error(plan.reason);
    var http = REOS.CountyAdapters && REOS.CountyAdapters.Http;
    if (!http || typeof http.appendQuery !== 'function' ||
        typeof http.request !== 'function' || typeof http.parseJson !== 'function') {
      throw new Error('READONLY_HTTP_TRANSPORT_REQUIRED');
    }
    var params = {
      where: plan.where, outFields: FIELDS, returnGeometry: 'false',
      orderByFields: plan.orderByFields, resultRecordCount: plan.limit,
      resultOffset: plan.resultOffset, f: 'json'
    };
    var url = http.appendQuery(ENDPOINT, params);
    var response = http.request({url: url, method: 'get',
      headers: {Accept: 'application/json'}, escaping: false});
    if (!response || !Number.isInteger(response.status) ||
        response.status < 200 || response.status >= 300) {
      throw new Error('RESEARCH_HTTP_STATUS_REJECTED');
    }
    var payload = http.parseJson(response);
    if (!payload || payload.error || !Array.isArray(payload.features)) {
      throw new Error('RESEARCH_SOURCE_RESPONSE_INVALID');
    }
    var page = evaluatePage(plan, payload.features,
      payload.exceededTransferLimit === true);
    if (!page.ok) throw new Error(page.reason);
    var raw = payload.features.map(function (feature) {
      return feature && feature.attributes ? feature.attributes : feature;
    });
    var reconciled = reconcileCamdenBatch(raw);
    if (!reconciled.ok || reconciled.records.some(function (r) {
      return r.reason !== 'IDENTITY_CERTIFIED';
    })) {
      throw new Error('RESEARCH_PARCEL_IDENTITY_REVIEW_REQUIRED');
    }
    if (pageNumber >= Number.MAX_SAFE_INTEGER ||
        total > Number.MAX_SAFE_INTEGER - raw.length) {
      throw new Error('CHECKPOINT_COUNTER_OVERFLOW');
    }
    var records = reconciled.records.map(function (r) {return r.record;});
    var next = raw.length ? Object.freeze({
      schema: CHECKPOINT_SCHEMA, connectorId: 'NJ-CAMDEN',
      dataset: 'property_assessment', mode: 'RESEARCH_ONLY', source: ENDPOINT,
      lastObjectId: page.nextCursor, pageNumber: pageNumber + 1,
      recordCount: total + raw.length, limit: plan.limit
    }) : null;
    return Object.freeze({
      ok: true, connectorId: 'NJ-CAMDEN', dataset: 'property_assessment',
      disposition: 'RESEARCH_ONLY', classification: 'ASSESSMENT_ONLY',
      records: Object.freeze(records), nextCheckpoint: next,
      emptyPageObserved: page.emptyPageObserved,
      sourceCountCertified: false, fullCoverageCertified: false,
      checkpointAuthenticated: false, durableCheckpointPersisted: false,
      distressVerified: false, actionableDistress: false,
      persistenceAuthorized: false, maoAuthorized: false,
      offerGenerationAuthorized: false, offerSubmissionAuthorized: false
    });
  }
  return Object.freeze({fetchPage: fetchPage, connectorId: 'NJ-CAMDEN',
    dataset: 'property_assessment', mode: 'RESEARCH_ONLY'});

})();
