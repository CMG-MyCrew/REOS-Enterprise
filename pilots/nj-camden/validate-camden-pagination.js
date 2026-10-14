'use strict';

const assert = require('node:assert/strict');
const P = require('./CamdenPaginationPolicy');

let passed = 0;

function test(name, fn) {
  fn();
  passed++;
  console.log('PASS=' + name);
}

function row(id, county = 'CAMDEN') {
  return {attributes: {OBJECTID: id, COUNTY: county}};
}

function rejected(result, reason) {
  assert.equal(result.ok, false);
  assert.equal(result.reason, reason);
}

test('INITIAL_CURSOR', () => {
  const p = P.planPage('', 500);
  assert.equal(p.ok, true);
  assert.equal(p.lastObjectId, 0);
  assert.equal(p.resultOffset, 0);
  assert.equal(p.resultRecordCount, 500);
  assert.equal(p.orderByFields, 'OBJECTID ASC');
  assert.equal(p.where, "COUNTY='CAMDEN' AND OBJECTID > 0");
});

test('LIMIT_CAP', () => {
  assert.equal(P.planPage('100', 2000).limit, 500);
  assert.equal(P.planPage('100', 25).limit, 25);
});

test('BAD_LIMITS', () => {
  for (const v of [0, -1, 1.5, 'ABC', null, 9007199254740992]) {
    rejected(P.planPage('100', v), 'INVALID_LIMIT');
  }
});

test('BAD_CURSORS', () => {
  for (const v of [-1, 1.5, 'ABC', '01', 9007199254740992]) {
    rejected(P.planPage(v, 500), 'INVALID_CURSOR');
  }
});

test('FIRST_PAGE_ACCEPTED', () => {
  const p = P.planPage('', 500);
  const r = P.evaluatePage(p, [row(1), row(3)], false);
  assert.equal(r.ok, true);
  assert.equal(r.nextCursor, '3');
  assert.equal(r.fullCoverageCertified, false);
  assert.equal(r.persistenceAuthorized, false);
});

test('MULTIPAGE_CONTINUITY', () => {
  let cursor = '';
  for (const ids of [[1, 4], [7, 20], [25]]) {
    const p = P.planPage(cursor, 500);
    const r = P.evaluatePage(p, ids.map(id => row(id)), true);
    assert.equal(r.ok, true);
    cursor = r.nextCursor;
  }
  assert.equal(cursor, '25');
});

test('DUPLICATE_IDS', () => {
  rejected(
    P.evaluatePage(P.planPage('', 10), [row(2), row(2)], false),
    'UNSAFE_PAGE_ORDER_OR_IDENTITY'
  );
});

test('OUT_OF_ORDER_IDS', () => {
  rejected(
    P.evaluatePage(P.planPage('', 10), [row(9), row(4)], false),
    'UNSAFE_PAGE_ORDER_OR_IDENTITY'
  );
});

test('NONADVANCING_CURSOR', () => {
  rejected(
    P.evaluatePage(P.planPage('100', 10), [row(100)], false),
    'UNSAFE_PAGE_ORDER_OR_IDENTITY'
  );
});

test('WRONG_COUNTY', () => {
  rejected(
    P.evaluatePage(P.planPage('', 10), [row(1, 'BURLINGTON')], false),
    'UNSAFE_PAGE_ORDER_OR_IDENTITY'
  );
});

test('OVERSIZED_RESPONSE', () => {
  rejected(
    P.evaluatePage(P.planPage('', 1), [row(1), row(2)], false),
    'PAGE_LIMIT_EXCEEDED'
  );
});

test('INVALID_RESPONSE', () => {
  const p = P.planPage('', 10);
  rejected(P.evaluatePage(p, null, false), 'INVALID_PAGE_RESPONSE');
  rejected(P.evaluatePage(p, [], null), 'INVALID_PAGE_RESPONSE');
});

test('EMPTY_TRUNCATED_RESPONSE', () => {
  rejected(
    P.evaluatePage(P.planPage('10', 10), [], true),
    'EMPTY_TRUNCATED_PAGE'
  );
});

test('EMPTY_NOT_COVERAGE', () => {
  const r = P.evaluatePage(P.planPage('10', 10), [], false);
  assert.equal(r.ok, true);
  assert.equal(r.emptyPageObserved, true);
  assert.equal(r.fullCoverageCertified, false);
  assert.equal(r.persistenceAuthorized, false);
});

test('SHORT_PAGE_NOT_COVERAGE', () => {
  const r = P.evaluatePage(P.planPage('10', 500), [row(11)], false);
  assert.equal(r.ok, true);
  assert.equal(r.fullCoverageCertified, false);
  assert.equal(r.nextCursor, '11');
});

test('TRUNCATED_PAGE_CONTINUITY', () => {
  const r = P.evaluatePage(P.planPage('10', 500), [row(11)], true);
  assert.equal(r.ok, true);
  assert.equal(r.nextCursor, '11');
});

test('FORGED_QUERY_FIELDS_REJECTED', () => {
  const p = P.planPage('100', 500);

  const changes = [
    {where: '1=1'},
    {orderByFields: 'OBJECTID DESC'},
    {resultOffset: 500},
    {resultRecordCount: 2000},
    {returnGeometry: true},
    {lastObjectId: 0},
    {limit: 1}
  ];

  for (const change of changes) {
    rejected(
      P.evaluatePage({...p, ...change}, [row(101)], false),
      'PAGE_PLAN_INTEGRITY_FAILED'
    );
  }

  rejected(
    P.evaluatePage({...p, limit: 2000}, [row(101)], false),
    'INVALID_PAGE_RESPONSE'
  );
});

console.log('NJ43B_TESTS_PASSED=' + passed);
console.log('NJ43B_PERMANENT_REGRESSION=PASS');
console.log('FULL_COVERAGE_CERTIFIED=false');
console.log('PRODUCTION_INTEGRATION_CERTIFIED=false');
