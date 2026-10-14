'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../..');
const policyPath = path.join(__dirname, 'CamdenPaginationPolicy.js');
const identityPath = path.join(__dirname, 'CamdenParcelIdentity.js');
const destination = path.join(root, 'build/apps-script-brand/NJCamdenAssessmentResearch.js');
const endpoint = 'https://maps.nj.gov/arcgis/rest/services/Framework/Cadastral/MapServer/0/query';

function sourceWithoutNodeExports(p, requiredMarker) {
  const s = fs.readFileSync(p, 'utf8');
  if (!s.includes(requiredMarker)) throw Error('SOURCE_CONTRACT_MISSING_' + path.basename(p));
  const marker = '\nmodule.exports = {';
  if (s.split(marker).length !== 2 || !s.trimEnd().endsWith('};')) {
    throw Error('UNEXPECTED_COMMONJS_SOURCE_' + path.basename(p));
  }
  return s.slice(0, s.indexOf(marker));
}
const policy = sourceWithoutNodeExports(policyPath, 'function evaluatePage(');
const identity = sourceWithoutNodeExports(identityPath, 'function reconcileCamdenBatch(');
const digest = s => crypto.createHash('sha256').update(s).digest('hex');

const bridge = String.raw`
  var ENDPOINT = '__ENDPOINT__';
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
`;

const output = [
  '/**',
  ' * GENERATED Camden assessment research facade; do not edit directly.',
  ' * Canonical generator: pilots/nj-camden/generate-camden-assessment-research.js',
  ' * Parcel identity SHA256: ' + digest(fs.readFileSync(identityPath)),
  ' * Pagination policy SHA256: ' + digest(fs.readFileSync(policyPath)),
  ' * No SDK registration, storage, scheduler, MAO or offer methods.',
  ' */',
  'var REOS = REOS || {};',
  'REOS.NJCamdenAssessmentResearch = (function () {',
  "  'use strict';",
  identity,
  policy,
  bridge.replace('__ENDPOINT__', endpoint),
  '})();',
  ''
].join('\n');
if (/\bmodule\.exports\b|\brequire\s*\(/.test(output)) {
  throw Error('NODE_ONLY_CODE_IN_GENERATED_APPS_SCRIPT');
}
if (process.argv[2] === '--check') {
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) {
    throw Error('GENERATED_FILE_DRIFT');
  }
  console.log('CAMDEN_DETERMINISTIC_GENERATION=PASS');
} else if (process.argv.length === 2) {
  if (fs.existsSync(destination)) throw Error('GENERATED_TARGET_ALREADY_EXISTS');
  fs.writeFileSync(destination, output, {flag: 'wx', mode: 0o644});
  console.log('CAMDEN_CANONICAL_GENERATION_CREATED=true');
} else {
  throw Error('USAGE: node generate-camden-assessment-research.js [--check]');
}
