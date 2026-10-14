'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const generated = path.resolve(__dirname, '../../build/apps-script-brand/NJCamdenAssessmentResearch.js');
const source = fs.readFileSync(generated, 'utf8');
const endpoint = 'https://maps.nj.gov/arcgis/rest/services/Framework/Cadastral/MapServer/0/query';
let passed = 0;
const row = (id, pin = '040101', county = 'CAMDEN', addr = '123 TEST ST') =>
  ({attributes: {OBJECTID: id, PAMS_PIN: pin, COUNTY: county, ST_ADDRESS: addr, MUN_NAME: 'Camden'}});

function harness(pages) {
  const requests = [];
  const script = {CountyAdapters: {Http: {
    appendQuery(url, params) {requests.push({url, params}); return url + '?synthetic=1';},
    request(options) {
      assert.equal(options.method, 'get');
      assert.equal(options.escaping, false);
      const payload = pages.shift();
      assert.ok(payload, 'UNEXPECTED_ADDITIONAL_REQUEST');
      return {status: 200, payload};
    },
    parseJson(result) {return result.payload;}
  }}};
  const context = vm.createContext({REOS: script});
  vm.runInContext(source, context, {filename: 'NJCamdenAssessmentResearch.js'});
  return {api: context.REOS.NJCamdenAssessmentResearch, requests};
}
function test(name, fn) {fn(); passed++; console.log('PASS=' + name);}
const input = cp => ({county: 'CAMDEN', dataset: 'property_assessment',
  mode: 'RESEARCH_ONLY', limit: 500, checkpoint: cp});

// No mutable global SDK, persistence service, scheduler, or property store is provided.
test('CANONICAL_GENERATED_APPS_SCRIPT', () => {
  assert.match(source, /Canonical generator:/);
  assert.doesNotMatch(source, /\bmodule\.exports\b|\brequire\s*\(/);
  assert.doesNotMatch(source, /CountyConnectorSDK\.register|Database\.|SpreadsheetApp|PropertiesService|UrlFetchApp|\.setValues\(/);
});
test('FIRST_PAGE_READONLY_AND_WHITELIST', () => {
  const h = harness([{features: [row(1)], exceededTransferLimit: true}]);
  const r = h.api.fetchPage(input(null));
  assert.equal(r.ok, true);
  assert.equal(r.records.length, 1);
  assert.equal(r.records[0].propertyIdentity, 'NJ:CAMDEN:PAMS_PIN:040101');
  assert.equal(r.records[0].classification, 'ASSESSMENT_ONLY');
  assert.equal(r.records[0].maoAuthorized, false);
  assert.equal(r.records[0].offerGenerationAuthorized, false);
  assert.equal(r.persistenceAuthorized, false);
  assert.equal(r.checkpointAuthenticated, false);
  assert.equal(r.fullCoverageCertified, false);
  assert.equal(r.nextCheckpoint.lastObjectId, '1');
  assert.equal(h.requests[0].url, endpoint);
  assert.equal(h.requests[0].params.where, "COUNTY='CAMDEN' AND OBJECTID > 0");
  assert.equal(h.requests[0].params.orderByFields, 'OBJECTID ASC');
  assert.equal(h.requests[0].params.resultOffset, 0);
  assert.equal(h.requests[0].params.resultRecordCount, 500);
  assert.equal(h.requests[0].params.outFields, 'OBJECTID,PAMS_PIN,COUNTY,ST_ADDRESS,PROP_LOC,MUN_NAME');
});
test('MULTIPAGE_CHECKPOINT_CHAIN', () => {
  const h = harness([
    {features: [row(10, 'A'), row(20, 'B')], exceededTransferLimit: true},
    {features: [row(25, 'C')], exceededTransferLimit: false},
    {features: [], exceededTransferLimit: false}
  ]);
  const a = h.api.fetchPage(input(null));
  const b = h.api.fetchPage(input(a.nextCheckpoint));
  const c = h.api.fetchPage(input(b.nextCheckpoint));
  assert.equal(a.nextCheckpoint.pageNumber, 1);
  assert.equal(b.nextCheckpoint.pageNumber, 2);
  assert.equal(b.nextCheckpoint.recordCount, 3);
  assert.equal(b.nextCheckpoint.lastObjectId, '25');
  assert.equal(h.requests[1].params.where, "COUNTY='CAMDEN' AND OBJECTID > 20");
  assert.equal(h.requests[2].params.where, "COUNTY='CAMDEN' AND OBJECTID > 25");
  assert.equal(c.emptyPageObserved, true);
  assert.equal(c.nextCheckpoint, null);
  assert.equal(c.fullCoverageCertified, false);
});
test('WRONG_DATASET_BLOCKED_BEFORE_HTTP', () => {
  const h = harness([]);
  assert.throws(() => h.api.fetchPage({...input(null), dataset: 'code_violations'}), /SCOPE_REQUIRED/);
  assert.equal(h.requests.length, 0);
});
test('MUTATION_INTENT_BLOCKED_BEFORE_HTTP', () => {
  const h = harness([]);
  for (const change of [{mode: 'INGEST'}, {persist: true}, {maoAuthorized: true}, {endpoint: 'https://evil.invalid'}]) {
    assert.throws(() => h.api.fetchPage({...input(null), ...change}));
  }
  assert.equal(h.requests.length, 0);
});
test('FORGED_CHECKPOINT_SCOPE_BLOCKED', () => {
  const h = harness([{features: [row(1)], exceededTransferLimit: false}]);
  const cp = h.api.fetchPage(input(null)).nextCheckpoint;
  for (const change of [{source: 'OTHER'}, {lastObjectId: '0'}, {pageNumber: -1}, {limit: 1}, {mode: 'WRITE'}, {unexpected: true}]) {
    assert.throws(() => h.api.fetchPage(input({...cp, ...change})));
  }
  assert.equal(h.requests.length, 1);
});
test('SOURCE_INVALID_COUNTY_FAILS_CLOSED', () => {
  const h = harness([{features: [row(1, 'A', 'BURLINGTON')]}]);
  assert.throws(() => h.api.fetchPage(input(null)), /UNSAFE_PAGE_ORDER_OR_IDENTITY/);
});
test('SOURCE_MISSING_PARCEL_ID_FAILS_CLOSED', () => {
  const h = harness([{features: [row(1, '')]}]);
  assert.throws(() => h.api.fetchPage(input(null)), /IDENTITY_REVIEW_REQUIRED/);
});
test('DUPLICATE_PARCEL_ID_FAILS_CLOSED', () => {
  const h = harness([{features: [row(1, 'A'), row(2, 'A')]}]);
  assert.throws(() => h.api.fetchPage(input(null)), /IDENTITY_REVIEW_REQUIRED/);
});
test('OUT_OF_ORDER_RESPONSE_FAILS_CLOSED', () => {
  const h = harness([{features: [row(2, 'A'), row(1, 'B')]}]);
  assert.throws(() => h.api.fetchPage(input(null)), /UNSAFE_PAGE_ORDER_OR_IDENTITY/);
});
test('INVALID_SOURCE_RESPONSE_FAILS_CLOSED', () => {
  const h = harness([{error: {code: 500}}]);
  assert.throws(() => h.api.fetchPage(input(null)), /SOURCE_RESPONSE_INVALID/);
});
test('SHORT_PAGE_NO_COVERAGE_CLAIM', () => {
  const h = harness([{features: [row(7)], exceededTransferLimit: false}]);
  const r = h.api.fetchPage(input(null));
  assert.equal(r.records.length, 1);
  assert.equal(r.fullCoverageCertified, false);
  assert.equal(r.nextCheckpoint.lastObjectId, '7');
});
test('READONLY_NEGATIVE_FLAGS', () => {
  const h = harness([{features: [row(1)], exceededTransferLimit: false}]);
  const r = h.api.fetchPage(input(null));
  for (const field of ['distressVerified', 'actionableDistress', 'persistenceAuthorized',
    'maoAuthorized', 'offerGenerationAuthorized', 'offerSubmissionAuthorized',
    'durableCheckpointPersisted', 'fullCoverageCertified', 'checkpointAuthenticated']) {
    assert.equal(r[field], false, field);
  }
});
console.log('CAMDEN_RESEARCH_BRIDGE_TESTS_PASSED=' + passed);
console.log('CAMDEN_READONLY_RESEARCH_INTEGRATION=PASS');
