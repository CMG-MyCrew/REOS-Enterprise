'use strict';

const assert = require('assert');
const path = require('path');

const adapter = require(
  path.resolve(
    __dirname,
    '../build/apps-script-brand/AbsenteeOwnerEnrichmentPersistenceAdapter.js'
  )
);

let checks = 0;

function check(fn) {
  fn();
  checks += 1;
}

function sanitized(overrides) {
  const base = {
    ok: true,
    outcome: 'MATCHED',
    identity: {
      'Distress Lead ID': 'DL-100',
      'Canonical Property Key': 'CPK-100'
    },
    patch: {
      'Owner Name': ' Jane Owner ',
      'Owner Mailing Address': ' 10 Main St '
    },
    persistenceAuthorized: false,
    dealCreationAuthorized: false,
    automaticOfferAuthorityGranted: false
  };

  return Object.assign({}, base, overrides || {});
}

function record(id, key, row) {
  return {
    'Distress Lead ID': id,
    'Canonical Property Key': key,
    'Owner Name': '',
    'Owner Mailing Address': '',
    _rowNumber: row
  };
}

function expectError(fn, message) {
  assert.throws(
    fn,
    err => err &&
      err.message === message,
    message
  );
}

check(() => {
  assert.deepStrictEqual(
    adapter.OWNED_FIELDS,
    ['Owner Name', 'Owner Mailing Address']
  );
});

check(() => {
  assert.deepStrictEqual(
    adapter.REQUIRED_IDENTITY,
    ['Distress Lead ID', 'Canonical Property Key']
  );
});

check(() => {
  assert.strictEqual(
    adapter.TARGET_TABLE,
    'DISTRESS_LEADS'
  );
});

check(() => {
  const result = adapter.plan({
    sanitizedResult: sanitized(),
    records: [
      record('DL-100', 'CPK-100', 7)
    ]
  });

  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.rowNumber, 7);

  assert.deepStrictEqual(
    result.patch,
    {
      'Owner Name': 'Jane Owner',
      'Owner Mailing Address': '10 Main St'
    }
  );

  assert.strictEqual(
    result.persistenceExecutionAuthorized,
    false
  );

  assert.strictEqual(
    result.databaseUpdateAuthorized,
    false
  );

  assert.strictEqual(
    result.databaseInsertAuthorized,
    false
  );

  assert.strictEqual(
    result.databaseUpsertAuthorized,
    false
  );

  assert.strictEqual(
    result.dealCreationAuthorized,
    false
  );

  assert.strictEqual(
    result.maoGenerationAuthorized,
    false
  );

  assert.strictEqual(
    result.automaticOfferAuthorityGranted,
    false
  );
});

[
  'NO_MATCH',
  'AMBIGUOUS',
  'FAILED'
].forEach(outcome => {
  check(() => {
    expectError(
      () => adapter.plan({
        sanitizedResult:
          sanitized({ outcome }),
        records: [
          record('DL-100', 'CPK-100', 7)
        ]
      }),
      'OUTCOME_NOT_PERSISTENCE_ELIGIBLE:' +
        outcome
    );
  });
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized({
        identity: {
          'Distress Lead ID': '',
          'Canonical Property Key': 'CPK-100'
        }
      }),
      records: []
    }),
    'IDENTITY_INVALID:Distress Lead ID'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized({
        identity: {
          'Distress Lead ID': 'DL-100',
          'Canonical Property Key': ''
        }
      }),
      records: []
    }),
    'IDENTITY_INVALID:Canonical Property Key'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized(),
      records: []
    }),
    'DISTRESS_LEAD_ID_NOT_FOUND'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized(),
      records: [
        record('DL-100', 'CPK-X', 7),
        record('DL-100', 'CPK-Y', 8)
      ]
    }),
    'DISTRESS_LEAD_ID_AMBIGUOUS'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized(),
      records: [
        record('DL-100', 'CPK-X', 7)
      ]
    }),
    'CANONICAL_PROPERTY_KEY_NOT_FOUND'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized(),
      records: [
        record('DL-100', 'CPK-100', 7),
        record('DL-X', 'CPK-100', 8)
      ]
    }),
    'CANONICAL_PROPERTY_KEY_AMBIGUOUS'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized(),
      records: [
        record('DL-100', 'CPK-X', 7),
        record('DL-X', 'CPK-100', 8)
      ]
    }),
    'IDENTITY_DIMENSIONS_RESOLVE_TO_DIFFERENT_RECORDS'
  );
});

[
  ['Status', 'Qualified'],
  ['Lead Source', 'provider'],
  ['Imported Deal ID', 'DEAL-1'],
  ['ARV', 500000],
  ['Estimated Repairs', 1],
  ['Suggested Offer', 1],
  ['MAO', 1],
  ['automaticOfferAuthorityGranted', true],
  ['Unknown Field', 'attack'],
  ['Distress Lead ID', 'ATTACK'],
  ['Canonical Property Key', 'ATTACK']
].forEach(([field, value]) => {
  check(() => {
    expectError(
      () => adapter.plan({
        sanitizedResult: sanitized({
          patch: {
            'Owner Name': 'Jane',
            [field]: value
          }
        }),
        records: [
          record('DL-100', 'CPK-100', 7)
        ]
      }),
      'WRITE_KEY_NOT_ALLOWED:' + field
    );
  });
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized({
        patch: {}
      }),
      records: [
        record('DL-100', 'CPK-100', 7)
      ]
    }),
    'EMPTY_OWNER_PATCH'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized({
        patch: {
          'Owner Name': 123
        }
      }),
      records: [
        record('DL-100', 'CPK-100', 7)
      ]
    }),
    'OWNER_VALUE_INVALID_TYPE:Owner Name'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized({
        persistenceAuthorized: true
      }),
      records: [
        record('DL-100', 'CPK-100', 7)
      ]
    }),
    'SANITIZER_PERSISTENCE_AUTHORITY_INVALID'
  );
});

check(() => {
  expectError(
    () => adapter.plan({
      sanitizedResult: sanitized({
        automaticOfferAuthorityGranted: true
      }),
      records: [
        record('DL-100', 'CPK-100', 7)
      ]
    }),
    'SANITIZER_OFFER_AUTHORITY_INVALID'
  );
});

check(() => {
  const source = sanitized();
  const before = JSON.stringify(source);

  adapter.plan({
    sanitizedResult: source,
    records: [
      record('DL-100', 'CPK-100', 7)
    ]
  });

  assert.strictEqual(
    JSON.stringify(source),
    before
  );
});

check(() => {
  const first = adapter.plan({
    sanitizedResult: sanitized(),
    records: [
      record('DL-100', 'CPK-100', 7)
    ]
  });

  const second = adapter.plan({
    sanitizedResult: sanitized({
      identity: {
        'Distress Lead ID': 'DL-200',
        'Canonical Property Key': 'CPK-200'
      },
      patch: {
        'Owner Name': 'Second Owner'
      }
    }),
    records: [
      record('DL-200', 'CPK-200', 20)
    ]
  });

  assert.strictEqual(first.rowNumber, 7);
  assert.strictEqual(second.rowNumber, 20);
  assert.deepStrictEqual(
    second.patch,
    {'Owner Name': 'Second Owner'}
  );
});

console.log(
  'ABSENTEE_OWNER_ENRICHMENT_PERSISTENCE_V1_BEHAVIOR_VALID=true'
);
console.log('CHECKS=' + checks);
console.log('PERSISTENCE_EXECUTION_AUTHORIZED=false');
console.log('DATABASE_UPDATE_AUTHORIZED=false');
console.log('DATABASE_INSERT_AUTHORIZED=false');
console.log('DATABASE_UPSERT_AUTHORIZED=false');
console.log('AUTOMATIC_OFFER_AUTHORITY_GRANTED=false');
