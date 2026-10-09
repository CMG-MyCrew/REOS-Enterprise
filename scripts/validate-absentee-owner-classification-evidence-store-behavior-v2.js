#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassificationEvidenceStoreV2.js'
);

const source = fs.readFileSync(FILE, 'utf8');

const HEADERS = [
  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Owner Evidence Lookup Mode',
  'Certified OPA Account',
  'Property Source Identity Certification Basis',
  'Property Source Identity Certification SHA-256',
  'Normal Lookup Evidence SHA-256',
  'Owner Evidence Result SHA-256',
  'Comparison Result SHA-256',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

let testCount = 0;

function test(name, fn) {
  testCount++;
  try {
    fn();
    console.log('PASS: ' + name);
  } catch (error) {
    console.error('FAIL: ' + name);
    throw error;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null ||
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

function canonicalJson(value) {
  const stack = [];

  function encode(current) {
    if (current === null) return 'null';

    const type = typeof current;

    if (type === 'string') return JSON.stringify(current);
    if (type === 'boolean') return current ? 'true' : 'false';

    if (type === 'number') {
      if (!Number.isFinite(current)) throw new Error('non-finite');
      return current === 0 ? '0' : String(current);
    }

    if (
      type === 'undefined' ||
      type === 'function' ||
      type === 'symbol' ||
      type === 'bigint'
    ) {
      throw new Error('unsupported');
    }

    if (stack.includes(current)) throw new Error('cycle');

    stack.push(current);

    try {
      if (Array.isArray(current)) {
        return '[' + current.map(encode).join(',') + ']';
      }

      if (!isPlainObject(current)) throw new Error('non-plain');

      return (
        '{' +
        Object.keys(current)
          .sort()
          .map(key => JSON.stringify(key) + ':' + encode(current[key]))
          .join(',') +
        '}'
      );
    } finally {
      stack.pop();
    }
  }

  return encode(value);
}

function hashCanonicalObject(value) {
  return crypto
    .createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex');
}

function hash(label) {
  return crypto
    .createHash('sha256')
    .update(label, 'utf8')
    .digest('hex');
}

function eventIdFor(plan) {
  return (
    'AOCE2-' +
    hashCanonicalObject({
      persistenceContractVersion:
        plan.persistenceContractVersion,
      classificationContractVersion:
        plan.classificationContractVersion,
      distressLeadId:
        plan.target.identity['Distress Lead ID'],
      canonicalPropertyKey:
        plan.target.identity['Canonical Property Key'],
      certifiedOpaAccount:
        plan.certifiedOpaAccount,
      propertySourceIdentityCertificationSha256:
        plan.propertySourceIdentityCertificationSha256,
      normalLookupEvidenceSha256:
        plan.normalLookupEvidenceSha256,
      ownerEvidenceResultSha256:
        plan.ownerEvidenceResultSha256,
      comparisonResultSha256:
        plan.comparisonResultSha256,
      classifierResultSha256:
        plan.classifierResultSha256
    })
  );
}

function plan(kind = 'indicated', suffix = 'base') {
  const mapping = {
    indicated: {
      classification: 'ABSENTEE_OWNER_INDICATED',
      comparison: 'MAILING_ADDRESS_DIFFERS',
      differences: '["street","zip"]',
      mailing:
        '{"city":"PHILADELPHIA","state":"PA","street":"PO BOX 100","zip":"19103"}'
    },

    matched: {
      classification: 'OWNER_MAILING_MATCHED',
      comparison: 'MAILING_ADDRESS_MATCHES',
      differences: '[]',
      mailing:
        '{"city":"PHILADELPHIA","state":"PA","street":"1624 N BODINE ST","zip":"19122"}'
    },

    insufficient: {
      classification: 'INSUFFICIENT_CLASSIFICATION_EVIDENCE',
      comparison: 'INSUFFICIENT_MAILING_EVIDENCE',
      differences: 'null',
      mailing:
        '{"city":"PHILADELPHIA","state":"PA","street":"","zip":""}'
    }
  };

  const selected = mapping[kind];

  const result = {
    ok: true,
    persistenceContractVersion: 2,
    classificationContractVersion: 1,

    target: {
      rowNumber: 1530,

      identity: {
        'Distress Lead ID':
          'DL-20260825185532-4474',

        'Canonical Property Key':
          'property|parcel|pa|philadelphia|1473083'
      }
    },

    classificationOutcome:
      selected.classification,

    classificationBasis:
      'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',

    upstreamComparisonOutcome:
      selected.comparison,

    differingComponentsJson:
      selected.differences,

    normalizedPropertyAddressJson:
      '{"city":"PHILADELPHIA","state":"PA","street":"1624 N BODINE ST","zip":"19122"}',

    normalizedMailingAddressJson:
      selected.mailing,

    sourceAgency:
      'Philadelphia Office of Property Assessment',

    sourceDataset:
      'Philadelphia Properties and Assessment History',

    sourceTable:
      'opa_properties_public',

    sourceEndpoint:
      'https://phl.carto.com/api/v2/sql',

    ownerEvidenceLookupMode:
      'certified_opa_account',

    certifiedOpaAccount:
      '183124510',

    propertySourceIdentityCertificationBasis:
      'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT',

    propertySourceIdentityCertificationSha256:
      hash('cert-' + suffix),

    normalLookupEvidenceSha256:
      hash('normal-' + suffix),

    ownerEvidenceResultSha256:
      hash('owner-' + suffix),

    comparisonResultSha256:
      hash('comparison-' + suffix),

    classifierResultSha256:
      hash('classifier')
  };

  result.evidenceEventId =
    eventIdFor(result);

  return result;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createHarness(options = {}) {
  const state = {
    rows: [],
    rowFormulas: [],
    appendCalls: 0,
    lockChecks: 0,
    flushCalls: 0,
    headerFormulas: Array(27).fill(''),
    missingSheet: false,
    flushThrows: false,
    corruptAppend: false,
    appendThrows: false,
    ...options
  };

  const LOCK = { token: 'LOCK' };

  function rowRange(rowNumber) {
    const index = rowNumber - 2;

    return {
      getValues() {
        return [clone(state.rows[index])];
      },

      getFormulas() {
        const formulas =
          state.rowFormulas[index] ||
          Array(27).fill('');

        return [clone(formulas)];
      }
    };
  }

  const sheet = {
    getLastRow() {
      return 1 + state.rows.length;
    },

    getLastColumn() {
      return 27;
    },

    getRange(row, column, rows, columns) {
      if (
        row === 1 &&
        column === 1 &&
        rows === 1 &&
        columns === 27
      ) {
        return {
          getValues() {
            return [clone(HEADERS)];
          },

          getFormulas() {
            return [clone(state.headerFormulas)];
          }
        };
      }

      if (
        row === 2 &&
        column === 5 &&
        columns === 1
      ) {
        return {
          createTextFinder(search) {
            return {
              matchEntireCell() {
                return this;
              },

              findAll() {
                return state.rows
                  .map((stored, index) => ({
                    stored,
                    rowNumber: index + 2
                  }))
                  .filter(item => item.stored[4] === search)
                  .map(item => ({
                    getRow() {
                      return item.rowNumber;
                    }
                  }));
              }
            };
          }
        };
      }

      if (
        row >= 2 &&
        column === 1 &&
        rows === 1 &&
        columns === 27
      ) {
        return rowRange(row);
      }

      throw new Error(
        'unexpected getRange(' +
        [row, column, rows, columns].join(',') +
        ')'
      );
    },

    appendRow(row) {
      state.appendCalls++;

      if (state.appendThrows) {
        throw new Error('append failure');
      }

      const stored = clone(row);

      if (state.corruptAppend) {
        stored[13] = 'CORRUPTED SOURCE';
      }

      state.rows.push(stored);
      state.rowFormulas.push(Array(27).fill(''));
    }
  };

  const workbook = {
    getSheetByName(name) {
      assert.strictEqual(
        name,
        'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2'
      );

      return state.missingSheet
        ? null
        : sheet;
    }
  };

  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    Date,
    Error,
    RegExp,
    Infinity,
    NaN,
    isFinite,

    REOS: {
      Database: {
        assertScriptLockContext(lockContext) {
          state.lockChecks++;
          assert.strictEqual(lockContext, LOCK);
        }
      },

      AbsenteeOwnerClassificationPersistencePlanner: {
        canonicalJson,
        hashCanonicalObject
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            assert.strictEqual(
              key,
              'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID'
            );

            return 'EVIDENCE_WORKBOOK';
          }
        };
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return {
          getId() {
            return 'ACTIVE_REOS_WORKBOOK';
          }
        };
      },

      openById(id) {
        assert.strictEqual(
          id,
          'EVIDENCE_WORKBOOK'
        );

        return workbook;
      },

      flush() {
        state.flushCalls++;

        if (state.flushThrows) {
          throw new Error('flush failure');
        }
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    source,
    context,
    { filename: FILE }
  );

  const store =
    context.REOS
      .AbsenteeOwnerClassificationEvidenceStoreV2;

  function persist(value) {
    return store.persist(
      value,
      {
        lockContext: LOCK,

        writeState: {
          writeAttempted: false
        }
      }
    );
  }

  return {
    state,
    store,
    persist
  };
}

function expectClass(fn, fragment) {
  assert.throws(
    fn,
    error => {
      assert.ok(
        String(
          error.persistenceClassification ||
          ''
        ).includes(fragment),
        'unexpected persistence classification: ' +
          String(
            error.persistenceClassification ||
            ''
          )
      );

      return true;
    }
  );
}

function recalcEventHash(row) {
  const payload = {};

  for (let index = 0; index < 26; index++) {
    payload[HEADERS[index]] = row[index];
  }

  row[26] =
    hashCanonicalObject(payload);
}

test('headers are exact 27-column copy', () => {
  const h = createHarness();
  const first = h.store.headers();
  const second = h.store.headers();

  assert.deepStrictEqual(
    Array.from(first),
    HEADERS
  );

  first[0] = 'MUTATED';

  assert.strictEqual(
    second[0],
    'Evidence Event ID'
  );
});

for (const kind of [
  'indicated',
  'matched',
  'insufficient'
]) {
  test('valid ' + kind + ' event appends', () => {
    const h = createHarness();
    const result = h.persist(plan(kind));

    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.disposition, 'PERSISTED');
    assert.strictEqual(h.state.appendCalls, 1);
    assert.strictEqual(h.state.rows.length, 1);
    assert.strictEqual(h.state.rows[0][25], 'GENESIS');
    assert.match(h.state.rows[0][26], /^[0-9a-f]{64}$/);
  });
}

test('exact AOCE2 duplicate is zero-write', () => {
  const h = createHarness();
  const value = plan();

  const first = h.persist(value);
  const before = h.state.rows.length;
  const second = h.persist(value);

  assert.strictEqual(first.disposition, 'PERSISTED');
  assert.strictEqual(second.disposition, 'ALREADY_PERSISTED');
  assert.strictEqual(h.state.rows.length, before);
  assert.strictEqual(h.state.appendCalls, 1);
  assert.strictEqual(second.evidenceEventId, first.evidenceEventId);
});

test('changed provenance creates a distinct chained event', () => {
  const h = createHarness();

  const first = h.persist(plan('indicated', 'a'));
  const changed = plan('indicated', 'b');
  const second = h.persist(changed);

  assert.strictEqual(second.disposition, 'PERSISTED');
  assert.notStrictEqual(
    second.evidenceEventId,
    first.evidenceEventId
  );

  assert.strictEqual(
    h.state.rows[1][25],
    first.evidenceEventSha256
  );
});

test('same classifier hash with changed certified provenance may append', () => {
  const h = createHarness();

  const a = plan('indicated', 'a');
  const b = plan('indicated', 'b');

  assert.strictEqual(
    a.classifierResultSha256,
    b.classifierResultSha256
  );

  assert.notStrictEqual(
    a.evidenceEventId,
    b.evidenceEventId
  );

  h.persist(a);
  h.persist(b);

  assert.strictEqual(h.state.rows.length, 2);
  assert.strictEqual(h.state.appendCalls, 2);
});

test('malformed historical hash chain fails closed', () => {
  const h = createHarness();

  h.persist(plan('indicated', 'a'));

  h.state.rows[0][25] = hash('not-genesis');
  recalcEventHash(h.state.rows[0]);

  expectClass(
    () => h.persist(plan('indicated', 'b')),
    'PRECONDITION'
  );

  assert.strictEqual(h.state.appendCalls, 1);
});

test('duplicate historical AOCE2 event id fails closed', () => {
  const h = createHarness();
  const value = plan('indicated', 'a');

  const first = h.persist(value);

  const duplicate =
    clone(h.state.rows[0]);

  duplicate[1] =
    '2026-10-08T23:59:59.000Z';

  duplicate[25] =
    first.evidenceEventSha256;

  recalcEventHash(duplicate);

  h.state.rows.push(duplicate);
  h.state.rowFormulas.push(Array(27).fill(''));

  expectClass(
    () => h.persist(plan('indicated', 'b')),
    'PRECONDITION'
  );
});

test('wrong AOCE2 event id fails before write', () => {
  const h = createHarness();
  const value = plan();

  value.evidenceEventId =
    'AOCE2-' + '0'.repeat(64);

  expectClass(
    () => h.persist(value),
    'PRECONDITION'
  );

  assert.strictEqual(h.state.appendCalls, 0);
});

test('unknown caller plan field fails closed', () => {
  const h = createHarness();
  const value = plan();

  value.ownerName = 'SHOULD NOT EXIST';

  expectClass(
    () => h.persist(value),
    'PRECONDITION'
  );

  assert.strictEqual(h.state.appendCalls, 0);
});

test('unsafe spreadsheet dual identity fails before write', () => {
  const h = createHarness();
  const value = plan();

  value.target.identity['Distress Lead ID'] =
    '=FORMULA';

  value.evidenceEventId =
    eventIdFor(value);

  expectClass(
    () => h.persist(value),
    'PRECONDITION'
  );

  assert.strictEqual(h.state.appendCalls, 0);
});

test('header formula fails before write', () => {
  const h = createHarness();

  h.state.headerFormulas[0] = '=1';

  expectClass(
    () => h.persist(plan()),
    'PRECONDITION'
  );

  assert.strictEqual(h.state.appendCalls, 0);
});

test('historical formula fails before new write', () => {
  const h = createHarness();

  h.persist(plan('indicated', 'a'));

  h.state.rowFormulas[0][10] = '=1';

  expectClass(
    () => h.persist(plan('indicated', 'b')),
    'PRECONDITION'
  );

  assert.strictEqual(h.state.appendCalls, 1);
});

test('missing v2 sheet fails before write', () => {
  const h = createHarness({
    missingSheet: true
  });

  expectClass(
    () => h.persist(plan()),
    'PRECONDITION'
  );

  assert.strictEqual(h.state.appendCalls, 0);
});

test('postappend row mismatch becomes uncertain', () => {
  const h = createHarness({
    corruptAppend: true
  });

  expectClass(
    () => h.persist(plan()),
    'UNCERTAIN'
  );

  assert.strictEqual(h.state.appendCalls, 1);
});

test('postappend flush exception becomes uncertain', () => {
  const h = createHarness({
    flushThrows: true
  });

  expectClass(
    () => h.persist(plan()),
    'UNCERTAIN'
  );

  assert.strictEqual(h.state.appendCalls, 1);
  assert.strictEqual(h.state.flushCalls, 1);
});

test('append exception enters uncertainty and is not retried', () => {
  const h = createHarness({
    appendThrows: true
  });

  expectClass(
    () => h.persist(plan()),
    'UNCERTAIN'
  );

  assert.strictEqual(h.state.appendCalls, 1);
});

test('raw owner name never enters persisted row', () => {
  const h = createHarness();

  h.persist(plan());

  assert.strictEqual(
    JSON.stringify(h.state.rows).includes('Owner Name'),
    false
  );

  assert.strictEqual(
    JSON.stringify(h.state.rows).includes('owner_1'),
    false
  );
});

test('store does not expose provisioning or history mutation methods', () => {
  const h = createHarness();

  assert.deepStrictEqual(
    Object.keys(h.store).sort(),
    ['headers', 'persist']
  );
});

test('no downstream authority is represented in persisted schema', () => {
  [
    'DISTRESS_LEADS',
    'Qualified Deal Queue',
    'ARV',
    'MAO',
    'Offer'
  ].forEach(marker => {
    assert.strictEqual(
      HEADERS.some(header => header.includes(marker)),
      false
    );
  });
});

console.log('');
console.log('ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_BEHAVIOR_V2_VALID=true');
console.log('BEHAVIOR_CASES=' + testCount);
console.log('VALID_INDICATED_APPEND=true');
console.log('VALID_MATCHED_APPEND=true');
console.log('VALID_INSUFFICIENT_APPEND=true');
console.log('EXACT_DUPLICATE_ZERO_WRITE=true');
console.log('CHANGED_PROVENANCE_DISTINCT_EVENT=true');
console.log('SAME_CLASSIFIER_HASH_CHANGED_PROVENANCE_ALLOWED=true');
console.log('GENESIS_CHAIN=true');
console.log('MALFORMED_HISTORY_FAIL_CLOSED=true');
console.log('DUPLICATE_EVENT_ID_FAIL_CLOSED=true');
console.log('UNSAFE_TEXT_FAIL_CLOSED=true');
console.log('POSTAPPEND_UNCERTAINTY=true');
console.log('AUTOMATIC_RETRY=false');
console.log('RAW_OWNER_NAME_PERSISTENCE=false');
console.log('DOWNSTREAM_AUTHORITY=false');
