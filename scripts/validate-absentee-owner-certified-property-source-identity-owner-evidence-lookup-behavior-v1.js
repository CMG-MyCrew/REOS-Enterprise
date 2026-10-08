#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT =
  path.resolve(__dirname, '..');

const FILE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup.js'
  );

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

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

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

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
    parcel_number: '183124510',
    location: '1616-42 N BODINE ST',
    owner_1: 'OWNER ONE',
    owner_2: 'OWNER TWO',
    mailing_address_1: '',
    mailing_address_2: '',
    mailing_care_of: '',
    mailing_city_state: 'PHILADELPHIA PA',
    mailing_street: '100 MARKET ST',
    mailing_zip: '19106'
  }, overrides || {});
}

function payload(rows, fields) {
  const value = rows || [];

  return JSON.stringify({
    rows: value,
    fields: fields || schemaFields(),
    total_rows: value.length
  });
}

function certification() {
  return {
    ok: true,
    mode:
      'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
    phase:
      'absentee_owner_opa_account_range_property_source_identity_certification',
    outcome:
      'PROPERTY_SOURCE_IDENTITY_CERTIFIED',
    certificationBasis:
      'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT',

    target: {
      table: 'DISTRESS_LEADS',
      rowNumber: 1530,
      identity: {
        'Distress Lead ID':
          'DL-20260825185532-4474',
        'Canonical Property Key':
          'property|parcel|pa|philadelphia|1473083'
      }
    },

    normalizedVerifiedTargetAddress:
      '1624 N BODINE ST',

    persistedParcelId: '1473083',
    corroboratingSourceObservationCount: 2,
    corroboratingSourceObservationIds: [
      'pa-philadelphia|code_violations|383',
      'pa-philadelphia|code_violations|384'
    ],
    sourceParcelIdNum: '1473083',
    sourceOpaAccountNum: '183124510',
    opaParcelNumber: '183124510',
    opaLocation: '1616-42 N BODINE ST',
    normalizedOpaRangeLocation:
      '1616-42 N BODINE ST',
    targetHouseNumber: 1624,
    rangeStart: 1616,
    rangeEnd: 1642,
    targetStreetSuffix:
      'N BODINE ST',
    opaRangeStreetSuffix:
      'N BODINE ST',
    streetSuffixExact: true,
    targetNumberNumericallyWithinRange:
      true,
    targetParityCompatibleWithRange:
      true,
    propertySourceIdentityCertified:
      true,
    rangeContainmentDiagnosticCandidate:
      true,
    rangeContainmentCertifiedMatch:
      false,

    productionDataMutationAuthorityGranted:
      false,
    sourceEvidenceRetrievalAuthorityGranted:
      false,
    ownerEvidenceRetrievalAuthorityGranted:
      false,
    ownerEvidencePersistenceAuthorityGranted:
      false,
    classificationAuthorityGranted:
      false,
    absenteeClassificationAuthorityGranted:
      false,
    classificationPersistenceAuthorityGranted:
      false,
    rolloutAuthorityGranted:
      false,
    canonicalIdentityRepairAuthorityGranted:
      false,
    migrationAuthorityGranted:
      false,
    schedulerAuthorityGranted:
      false,
    triggerAuthorityGranted:
      false,
    connectorExecutionAuthorityGranted:
      false,
    certificationMutationAuthorityGranted:
      false,
    ownerOccupancyAuthorityGranted:
      false,
    vacancyAuthorityGranted:
      false,
    qualifiedDealQueueAuthorityGranted:
      false,
    acquisitionLifecycleAuthorityGranted:
      false,
    arvAuthorityGranted:
      false,
    repairScopeAuthorityGranted:
      false,
    maoAuthorityGranted:
      false,
    offerAuthorityGranted:
      false,
    automaticOfferAuthorityGranted:
      false
  };
}

function normalLookup() {
  return {
    ok: true,
    mode: 'READ_ONLY_OWNER_EVIDENCE',
    phase:
      'absentee_owner_philadelphia_owner_evidence_lookup',
    outcome: 'NO_MATCH',

    target: {
      rowNumber: 1530,
      identity: {
        'Distress Lead ID':
          'DL-20260825185532-4474',
        'Canonical Property Key':
          'property|parcel|pa|philadelphia|1473083'
      },
      propertyAddress:
        '1624 N Bodine St',
      city: 'PHILADELPHIA',
      state: 'PA',
      zip: '19122'
    },

    source: {
      agency:
        'Philadelphia Office of Property Assessment',
      dataset:
        'Philadelphia Properties and Assessment History',
      table:
        'opa_properties_public',
      endpoint:
        'https://phl.carto.com/api/v2/sql',
      lookupQueryMode:
        'exact_property_address'
    },

    boundedSourceRowCount: 0,
    lookupTimestamp:
      '2026-10-07T00:00:00.000Z',

    productionDataMutationAuthorityGranted:
      false,
    ownerEvidencePersistenceAuthorityGranted:
      false,
    canonicalIdentityRepairAuthorityGranted:
      false,
    migrationAuthorityGranted:
      false,
    schedulerAuthorityGranted:
      false,
    triggerAuthorityGranted:
      false,
    connectorExecutionAuthorityGranted:
      false,
    certificationMutationAuthorityGranted:
      false,
    automaticOfferAuthorityGranted:
      false
  };
}

function validInput() {
  return {
    propertySourceIdentityCertification:
      certification(),
    normalLookupEvidence:
      normalLookup()
  };
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
    fetchCalls: [],
    databaseCalls: 0,
    classificationCalls: 0,
    persistenceCalls: 0
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
          throw new Error(
            'ADMIN_DENIED'
          );
        }
      }
    },

    Database: {
      update() {
        state.databaseCalls++;
        throw new Error(
          'DATABASE_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerClassification: {
      classify() {
        state.classificationCalls++;
        throw new Error(
          'CLASSIFICATION_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentPersistenceAdapter: {
      plan() {
        state.persistenceCalls++;
        throw new Error(
          'PERSISTENCE_CALL_PROHIBITED'
        );
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
        throw new Error(
          'NETWORK_DOWN'
        );
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
  vm.runInContext(
    source,
    context
  );

  return {
    state,

    call(input) {
      return context
        .REOS
        .AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup
        .lookup(input);
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

  assert.ok(
    thrown,
    'expected function to throw'
  );

  if (pattern) {
    assert.match(
      String(
        thrown.message ||
        thrown
      ),
      pattern
    );
  }
}

function queryFromUrl(url) {
  return new URL(url)
    .searchParams
    .get('q');
}

function assertAuthorityFalse(result) {
  [
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'classificationAuthorityGranted',
    'absenteeClassificationAuthorityGranted',
    'classificationPersistenceAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'ownerOccupancyAuthorityGranted',
    'vacancyAuthorityGranted',
    'qualifiedDealQueueAuthorityGranted',
    'acquisitionLifecycleAuthorityGranted',
    'arvAuthorityGranted',
    'repairScopeAuthorityGranted',
    'maoAuthorityGranted',
    'offerAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(field => {
    assert.strictEqual(
      result[field],
      false,
      field + ' must remain false'
    );
  });
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
  'unexpected caller override fails before HTTP',
  () => {
    const h = createHarness();

    const input = validInput();
    input.certifiedOpaAccount =
      '999999999';

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'uncertified property-source input performs zero HTTP calls',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .propertySourceIdentityCertification
      .propertySourceIdentityCertified =
        false;

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'contaminated certification authority performs zero HTTP calls',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .propertySourceIdentityCertification
      .classificationAuthorityGranted =
        true;

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'normal lookup must remain NO_MATCH',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .normalLookupEvidence
      .outcome =
        'MATCHED';

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'physical row mismatch performs zero HTTP calls',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .normalLookupEvidence
      .target
      .rowNumber =
        1532;

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'TARGET_IDENTITY_MISMATCH'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'Distress Lead ID mismatch performs zero HTTP calls',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .normalLookupEvidence
      .target
      .identity['Distress Lead ID'] =
        'DL-WRONG';

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'TARGET_IDENTITY_MISMATCH'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'Canonical Property Key mismatch performs zero HTTP calls',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .normalLookupEvidence
      .target
      .identity['Canonical Property Key'] =
        'property|wrong';

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'TARGET_IDENTITY_MISMATCH'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'target address mismatch performs zero HTTP calls',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .normalLookupEvidence
      .target
      .propertyAddress =
        '9999 OTHER ST';

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'TARGET_ADDRESS_MISMATCH'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'malformed certified OPA account performs zero HTTP calls',
  () => {
    const h = createHarness();

    const input = validInput();

    input
      .propertySourceIdentityCertification
      .sourceOpaAccountNum =
        'ABC';

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'INVALID_CERTIFIED_OPA_ACCOUNT'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'query is exact account only, projected, and bounded to two',
  () => {
    const h = createHarness({
      body: payload([])
    });

    const out =
      h.call(validInput());

    assert.strictEqual(
      out.outcome,
      'NO_MATCH'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    const query =
      queryFromUrl(
        h.state.fetchCalls[0].url
      );

    assert.ok(
      query.startsWith(
        'SELECT parcel_number,location,owner_1,owner_2,mailing_address_1,mailing_address_2,mailing_care_of,mailing_city_state,mailing_street,mailing_zip FROM opa_properties_public '
      )
    );

    assert.ok(
      query.includes(
        "WHERE parcel_number = '183124510'"
      )
    );

    assert.ok(
      query.endsWith(
        'LIMIT 2'
      )
    );

    assert.strictEqual(
      query.includes(
        'regexp_replace'
      ),
      false
    );

    assert.strictEqual(
      query.includes(
        'owner_1 ='
      ),
      false
    );
  }
);

test(
  'zero account rows return NO_MATCH',
  () => {
    const h = createHarness({
      body: payload([])
    });

    const out =
      h.call(validInput());

    assert.strictEqual(out.ok, true);
    assert.strictEqual(
      out.outcome,
      'NO_MATCH'
    );
    assert.strictEqual(
      out.boundedSourceRowCount,
      0
    );
    assert.strictEqual(
      out.propertySourceIdentityCertified,
      true
    );

    assertAuthorityFalse(out);
  }
);

test(
  'two exact account rows return AMBIGUOUS without choosing a winner',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow(),
        sourceRow({
          location:
            'ALT OFFICIAL LOCATION'
        })
      ])
    });

    const out =
      h.call(validInput());

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
        out,
        'ownerNameEvidence'
      ),
      false
    );

    assertAuthorityFalse(out);
  }
);

test(
  'one exact account row returns source-preserved owner and mailing evidence',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow()
      ])
    });

    const out =
      h.call(validInput());

    assert.strictEqual(out.ok, true);

    assert.strictEqual(
      out.outcome,
      'MATCHED'
    );

    assert.strictEqual(
      out.source.lookupQueryMode,
      'certified_opa_account'
    );

    assert.strictEqual(
      out.source.certifiedOpaAccount,
      '183124510'
    );

    assert.strictEqual(
      out.source.parcelNumber,
      '183124510'
    );

    assert.strictEqual(
      out.source.propertyLocation,
      '1616-42 N BODINE ST'
    );

    assert.strictEqual(
      out.target.propertyAddress,
      '1624 N Bodine St'
    );

    assert.strictEqual(
      out.ownerNameEvidence.owner_1,
      'OWNER ONE'
    );

    assert.strictEqual(
      out.ownerNameEvidence.owner_2,
      'OWNER TWO'
    );

    assert.strictEqual(
      out.ownerMailingEvidence.mailing_street,
      '100 MARKET ST'
    );

    assert.strictEqual(
      out.certifiedOpaAccount,
      '183124510'
    );

    assert.strictEqual(
      out.rangeContainmentCertifiedMatch,
      false
    );

    assertAuthorityFalse(out);
  }
);

test(
  'returned account mismatch fails closed',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow({
          parcel_number:
            '999999999'
        })
      ])
    });

    const out =
      h.call(validInput());

    assert.strictEqual(
      out.code,
      'OPA_ACCOUNT_IDENTIFIER_MISMATCH'
    );

    assertAuthorityFalse(out);
  }
);

test(
  'schema drift fails closed',
  () => {
    const fields =
      schemaFields();

    delete fields.mailing_zip;

    const h = createHarness({
      body: payload(
        [],
        fields
      )
    });

    const out =
      h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_SCHEMA_DRIFT'
    );

    assertAuthorityFalse(out);
  }
);

test(
  'non-200 source response fails once without retry',
  () => {
    const h = createHarness({
      status: 503,
      body:
        '{"error":"unavailable"}'
    });

    const out =
      h.call(validInput());

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
  'invalid source JSON fails closed',
  () => {
    const h = createHarness({
      body: '<html>bad</html>'
    });

    const out =
      h.call(validInput());

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
  'matched lookup invokes no database, classification, or persistence surface',
  () => {
    const h = createHarness({
      body: payload([
        sourceRow()
      ])
    });

    const out =
      h.call(validInput());

    assert.strictEqual(
      out.outcome,
      'MATCHED'
    );

    assert.strictEqual(
      h.state.databaseCalls,
      0
    );

    assert.strictEqual(
      h.state.classificationCalls,
      0
    );

    assert.strictEqual(
      h.state.persistenceCalls,
      0
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );
  }
);

assert.strictEqual(
  count,
  20,
  'certified-account owner-evidence behavior validator must execute exactly 20 cases'
);

console.log('');

console.log(
  'ABSENTEE_OWNER_CERTIFIED_PROPERTY_SOURCE_IDENTITY_OWNER_EVIDENCE_LOOKUP_BEHAVIOR_VALID=true'
);

console.log(
  'BEHAVIOR_CASE_COUNT=' + count
);

console.log(
  'MOTIVATING_ROW_1530_OWNER_EVIDENCE_PATH_VALID=true'
);

console.log(
  'ROW_1532_AUTOMATIC_PROCESSING=false'
);

console.log(
  'EXACT_CERTIFIED_ACCOUNT_QUERY_VALID=true'
);

console.log(
  'MAX_SOURCE_ROWS=2'
);

console.log(
  'MAX_EXTERNAL_REQUESTS_PER_INVOCATION=1'
);

console.log(
  'DATABASE_EXECUTED=false'
);

console.log(
  'CLASSIFICATION_EXECUTED=false'
);

console.log(
  'PERSISTENCE_EXECUTED=false'
);

console.log(
  'AUTOMATIC_RETRY_EXECUTED=false'
);

console.log(
  'AUTOMATIC_PAGINATION_EXECUTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
