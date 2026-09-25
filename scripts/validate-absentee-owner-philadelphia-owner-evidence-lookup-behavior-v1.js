#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup.js'
);

const source = fs.readFileSync(FILE, 'utf8');

const REQUIRED_FIELDS = [
  'parcel_number',
  'location',
  'owner_1',
  'owner_2',
  'mailing_address_1',
  'mailing_address_2',
  'mailing_care_of',
  'mailing_city_state',
  'mailing_street',
  'mailing_zip'
];

function schemaFields() {
  const fields = {};

  REQUIRED_FIELDS.forEach(field => {
    fields[field] = {
      type: 'string',
      pgtype: 'varchar'
    };
  });

  return fields;
}

function sourceRow(overrides) {
  return Object.assign({
    parcel_number: '123456789',
    location: '5146 N 10TH ST',
    owner_1: 'OWNER ONE',
    owner_2: '',
    mailing_address_1: '',
    mailing_address_2: '',
    mailing_care_of: '',
    mailing_city_state: 'PHILADELPHIA PA',
    mailing_street: '100 MARKET ST',
    mailing_zip: '19106'
  }, overrides || {});
}

function payload(rows, fields) {
  return JSON.stringify({
    rows: rows || [],
    fields: fields || schemaFields(),
    total_rows: (rows || []).length
  });
}

function validInput(overrides) {
  return Object.assign({
    rowNumber: 377,
    identity: {
      'Distress Lead ID':
        'DL-20260731203649-4601',
      'Canonical Property Key':
        'property|address|pa|philadelphia|19141-4008|5146 n 10th st'
    },
    propertyAddress: '5146 N 10TH ST',
    city: 'PHILADELPHIA',
    state: 'PA',
    zip: '19141-4008'
  }, overrides || {});
}

function createHarness(options) {
  const config = Object.assign({
    adminDenied: false,
    fetchThrows: false,
    status: 200,
    body: payload([])
  }, options || {});

  const state = {
    adminCalls: 0,
    fetchCalls: []
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
    encodeURIComponent
  };

  context.REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls++;

        if (config.adminDenied) {
          throw new Error('ADMIN_DENIED');
        }
      }
    }
  };

  context.UrlFetchApp = {
    fetch(url, fetchOptions) {
      state.fetchCalls.push({
        url,
        options: fetchOptions
      });

      if (config.fetchThrows) {
        throw new Error('NETWORK_DOWN');
      }

      return {
        getResponseCode() {
          return config.status;
        },

        getContentText() {
          return config.body;
        }
      };
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  return {
    context,
    state,

    call(input) {
      return context
        .reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(input);
    }
  };
}

function expectThrow(fn, pattern) {
  let thrown = null;

  try {
    fn();
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, 'expected function to throw');

  if (pattern) {
    assert.match(
      String(thrown.message || thrown),
      pattern
    );
  }
}

function assertAuthorityFalse(result) {
  [
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(key => {
    assert.strictEqual(
      result[key],
      false,
      key + ' must remain false'
    );
  });
}

function queryFromUrl(url) {
  const parsed = new URL(url);
  return parsed.searchParams.get('q');
}

let count = 0;

function test(name, fn) {
  fn();
  count++;
  console.log(
    'PASS ' + count + ': ' + name
  );
}

test(
  'admin denial occurs before external HTTP',
  () => {
    const h = createHarness({
      adminDenied: true
    });

    expectThrow(
      () => h.call(validInput()),
      /ADMIN_DENIED/
    );

    assert.strictEqual(
      h.state.adminCalls,
      1
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'missing options fail closed before HTTP',
  () => {
    const h = createHarness();

    const out = h.call();

    assert.strictEqual(out.ok, false);
    assert.strictEqual(
      out.outcome,
      'FAILED'
    );
    assert.strictEqual(
      out.code,
      'INVALID_OPTIONS'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );

    assertAuthorityFalse(out);
  }
);

test(
  'unexpected input key fails closed',
  () => {
    const h = createHarness();

    const input = validInput();
    input.ownerName = 'DO NOT SEARCH';

    const out = h.call(input);

    assert.strictEqual(out.ok, false);
    assert.strictEqual(
      out.code,
      'UNEXPECTED_OPTIONS'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'invalid physical row fails before HTTP',
  () => {
    const h = createHarness();

    const out = h.call(
      validInput({
        rowNumber: 1
      })
    );

    assert.strictEqual(
      out.code,
      'INVALID_ROW_NUMBER'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'missing persisted dual identity fails before HTTP',
  () => {
    const h = createHarness();

    const out = h.call(
      validInput({
        identity: {
          'Distress Lead ID':
            'DL-1',
          'Canonical Property Key':
            ''
        }
      })
    );

    assert.strictEqual(
      out.code,
      'MISSING_CANONICAL_PROPERTY_KEY'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'non-Philadelphia city fails before HTTP',
  () => {
    const h = createHarness();

    const out = h.call(
      validInput({
        city: 'PITTSBURGH'
      })
    );

    assert.strictEqual(
      out.code,
      'UNSUPPORTED_CITY'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'non-PA state fails before HTTP',
  () => {
    const h = createHarness();

    const out = h.call(
      validInput({
        state: 'NJ'
      })
    );

    assert.strictEqual(
      out.code,
      'UNSUPPORTED_STATE'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'query is fixed, bounded, projected, and SQL literal escaped',
  () => {
    const h = createHarness({
      body: payload([])
    });

    const input = validInput({
      propertyAddress: "12 O'NEIL   ST"
    });

    const out = h.call(input);

    assert.strictEqual(
      out.outcome,
      'NO_MATCH'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    const request =
      h.state.fetchCalls[0];

    const parsed =
      new URL(request.url);

    assert.strictEqual(
      parsed.origin,
      'https://phl.carto.com'
    );

    assert.strictEqual(
      parsed.pathname,
      '/api/v2/sql'
    );

    assert.strictEqual(
      parsed.searchParams.get('format'),
      'json'
    );

    const query =
      queryFromUrl(request.url);

    assert.ok(
      query.startsWith(
        'SELECT parcel_number,location,owner_1,owner_2,mailing_address_1,mailing_address_2,mailing_care_of,mailing_city_state,mailing_street,mailing_zip FROM opa_properties_public '
      )
    );

    assert.ok(
      query.includes(
        "regexp_replace(trim(location), '[[:space:]]+', ' ', 'g')"
      )
    );

    assert.ok(
      query.includes(
        "= '12 O''NEIL ST'"
      )
    );

    assert.ok(
      query.endsWith(
        'LIMIT 5'
      )
    );

    assert.strictEqual(
      query.includes('SELECT *'),
      false
    );

    assert.strictEqual(
      request.options.method,
      'get'
    );

    assert.strictEqual(
      request.options.muteHttpExceptions,
      true
    );
  }
);

test(
  'single exact source row returns MATCHED owner evidence',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow()
      ])
    });

    const out = h.call(validInput());

    assert.strictEqual(out.ok, true);
    assert.strictEqual(
      out.mode,
      'READ_ONLY_OWNER_EVIDENCE'
    );
    assert.strictEqual(
      out.outcome,
      'MATCHED'
    );

    assert.strictEqual(
      out.boundedSourceRowCount,
      1
    );

    assert.strictEqual(
      out.source.table,
      'opa_properties_public'
    );

    assert.strictEqual(
      out.source.parcelNumber,
      '123456789'
    );

    assert.strictEqual(
      out.source.propertyLocation,
      '5146 N 10TH ST'
    );

    assert.strictEqual(
      out.ownerNameEvidence.owner_1,
      'OWNER ONE'
    );

    assert.strictEqual(
      out.ownerMailingEvidence.mailing_street,
      '100 MARKET ST'
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out,
        'absenteeOwner'
      ),
      false
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    assertAuthorityFalse(out);
  }
);

test(
  'superficial source address differences still exact-match',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow({
          location:
            '  5146   n 10th st  '
        })
      ])
    });

    const out = h.call(
      validInput({
        propertyAddress:
          '5146 N 10TH ST'
      })
    );

    assert.strictEqual(
      out.outcome,
      'MATCHED'
    );
  }
);

test(
  'zero qualifying source rows returns NO_MATCH without owner evidence',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow({
          location:
            '9999 OTHER ST'
        })
      ])
    });

    const out = h.call(validInput());

    assert.strictEqual(out.ok, true);
    assert.strictEqual(
      out.outcome,
      'NO_MATCH'
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out,
        'ownerNameEvidence'
      ),
      false
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out,
        'ownerMailingEvidence'
      ),
      false
    );

    assertAuthorityFalse(out);
  }
);

test(
  'multiple qualifying rows returns AMBIGUOUS without choosing winner',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow({
          parcel_number: 'A'
        }),
        sourceRow({
          parcel_number: 'B'
        })
      ])
    });

    const out = h.call(validInput());

    assert.strictEqual(out.ok, true);
    assert.strictEqual(
      out.outcome,
      'AMBIGUOUS'
    );

    assert.strictEqual(
      out.boundedSourceRowCount,
      2
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out.source,
        'parcelNumber'
      ),
      false
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out,
        'ownerNameEvidence'
      ),
      false
    );

    assertAuthorityFalse(out);
  }
);

test(
  'HTTP non-200 returns FAILED and does not retry',
  () => {
    const h = createHarness({
      status: 503,
      body: '{"error":"unavailable"}'
    });

    const out = h.call(validInput());

    assert.strictEqual(out.ok, false);
    assert.strictEqual(
      out.outcome,
      'FAILED'
    );
    assert.strictEqual(
      out.code,
      'HTTP_STATUS_NOT_OK'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    assertAuthorityFalse(out);
  }
);

test(
  'thrown HTTP request failure returns FAILED and does not retry',
  () => {
    const h = createHarness({
      fetchThrows: true
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'HTTP_REQUEST_FAILED'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    assertAuthorityFalse(out);
  }
);

test(
  'invalid JSON returns FAILED',
  () => {
    const h = createHarness({
      body: '<html>bad gateway</html>'
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'INVALID_SOURCE_JSON'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    assertAuthorityFalse(out);
  }
);

test(
  'schema drift fails closed',
  () => {
    const fields = schemaFields();
    delete fields.mailing_zip;

    const h = createHarness({
      body: payload([], fields)
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_SCHEMA_DRIFT'
    );

    assertAuthorityFalse(out);
  }
);

test(
  'source row missing projected field fails closed',
  () => {
    const row = sourceRow();
    delete row.owner_2;

    const h = createHarness({
      body: payload([row])
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_ROW_FIELD_MISSING'
    );

    assertAuthorityFalse(out);
  }
);

test(
  'more than five returned rows fails closed',
  () => {
    const rows = [];

    for (let index = 0; index < 6; index++) {
      rows.push(
        sourceRow({
          parcel_number:
            String(index + 1)
        })
      );
    }

    const h = createHarness({
      body: payload(rows)
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_RESULT_BOUND_EXCEEDED'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    assertAuthorityFalse(out);
  }
);

test(
  'NO_MATCH is non-affirmative and never creates absentee classification',
  () => {
    const h = createHarness({
      body: payload([])
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.outcome,
      'NO_MATCH'
    );

    [
      'absenteeOwner',
      'ownerOccupied',
      'vacant'
    ].forEach(key => {
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(
          out,
          key
        ),
        false
      );
    });

    assertAuthorityFalse(out);
  }
);

console.log('');
console.log(
  'ABSENTEE_OWNER_PHILADELPHIA_OWNER_EVIDENCE_LOOKUP_BEHAVIOR_VALID=true'
);
console.log(
  'BEHAVIOR_CASES=' + count
);
console.log('ADMIN_BEFORE_HTTP=true');
console.log('MAX_EXTERNAL_REQUESTS_PER_INVOCATION=1');
console.log('FIXED_SOURCE_ENDPOINT=true');
console.log('FIXED_SOURCE_TABLE=true');
console.log('SOURCE_PROJECTION_EXACT=true');
console.log('MAX_SOURCE_ROWS=5');
console.log('SQL_LITERAL_ESCAPING_VALID=true');
console.log('EXACT_ADDRESS_MATCHING_VALID=true');
console.log('MATCHED_BEHAVIOR_VALID=true');
console.log('NO_MATCH_BEHAVIOR_VALID=true');
console.log('AMBIGUOUS_BEHAVIOR_VALID=true');
console.log('FAILED_BEHAVIOR_VALID=true');
console.log('AUTOMATIC_RETRY_EXECUTED=false');
console.log('AUTOMATIC_PAGINATION_EXECUTED=false');
console.log('ABSENTEE_CLASSIFICATION_AUTHORITY=false');
console.log('OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
