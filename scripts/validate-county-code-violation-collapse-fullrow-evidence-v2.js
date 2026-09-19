#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const AUTH_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js';

const READER_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js';

const EXPECTED_AUTHORITY_SHA =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const EXCLUDED_IDS = new Set([
  'DL-20260820181647-4170',
  'ZIL-20260820193920-1756'
]);

const authoritySource =
  fs.readFileSync(
    AUTH_FILE,
    'utf8'
  );

const readerSource =
  fs.readFileSync(
    READER_FILE,
    'utf8'
  );

const headers = [
  'Distress Lead ID',
  'Source',
  'Source Dataset',
  'Source Record ID',
  'Violation Number',
  'Canonical Property Key',
  'Source Observation Key',
  'Notes',
  'Source Record Key',
  'Parcel ID',
  'Address',
  'City',
  'State',
  'Zip',
  'County'
];

function loadAuthority() {
  const sandbox = {
    REOS: {},
    Object,
    console
  };

  vm.createContext(sandbox);

  vm.runInContext(
    authoritySource,
    sandbox
  );

  const api =
    sandbox.REOS
      .CountyCodeViolationCollapseOnlyEvidenceAuthority;

  return {
    metadata:
      JSON.parse(
        JSON.stringify(
          api.metadata()
        )
      ),

    records:
      JSON.parse(
        JSON.stringify(
          api.records()
        )
      )
  };
}

const loaded =
  loadAuthority();

const authorityRecords =
  loaded.records;

assert.strictEqual(
  loaded.metadata.authoritySha256,
  EXPECTED_AUTHORITY_SHA
);

assert.strictEqual(
  loaded.metadata.groupCount,
  21
);

assert.strictEqual(
  loaded.metadata.rowCount,
  44
);

assert.strictEqual(
  authorityRecords.length,
  44
);

authorityRecords.forEach(record => {
  assert.strictEqual(
    EXCLUDED_IDS.has(
      record.distressLeadId
    ),
    false
  );

  assert.notStrictEqual(
    Number(record.groupNumber),
    3
  );
});

function identityInputs(record) {
  const parts =
    record
      .canonicalPropertyKey
      .split('|');

  assert.strictEqual(
    parts[0],
    'property'
  );

  if (
    parts[1] ===
    'address'
  ) {
    assert.strictEqual(
      parts.length,
      6
    );

    return {
      State:
        parts[2],

      City:
        parts[3],

      County:
        parts[3],

      Zip:
        parts[4],

      Address:
        parts[5],

      'Parcel ID':
        ''
    };
  }

  assert.strictEqual(
    parts[1],
    'parcel'
  );

  assert.strictEqual(
    parts.length,
    5
  );

  return {
    State:
      parts[2],

    County:
      parts[3],

    City:
      '',

    Zip:
      '',

    Address:
      '',

    'Parcel ID':
      parts[4]
  };
}

function persistedRows() {
  return authorityRecords.map(
    record => ({
      ...identityInputs(record),

      'Source Record Key':
        record.legacyObservationKey,

      _rowNumber:
        record.rowNumber,

      'Distress Lead ID':
        record.distressLeadId,

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Source Record ID':
        record.sourceRecordId,

      'Violation Number':
        record.violationNumber,

      'Canonical Property Key':
        record.canonicalPropertyKey,

      'Source Observation Key':
        record.legacyObservationKey,

      Notes:
        'full-row-' +
        record.rowNumber
    })
  );
}

function execute(
  rows,
  options
) {
  const sandbox = {
    REOS: {
      Database: {
        getHeaders(table) {
          assert.strictEqual(
            table,
            'DISTRESS_LEADS'
          );

          return headers.slice();
        },

        getAll(table) {
          assert.strictEqual(
            table,
            'DISTRESS_LEADS'
          );

          return rows.map(
            row => ({
              ...row
            })
          );
        }
      },

      Security: {
        requireAdmin() {
          return true;
        }
      }
    },

    Object,
    console
  };

  vm.createContext(sandbox);

  vm.runInContext(
    authoritySource,
    sandbox
  );

  vm.runInContext(
    fs.readFileSync(
      'build/apps-script-brand/CanonicalPropertyIdentity.js',
      'utf8'
    ),
    sandbox
  );

  vm.runInContext(
    readerSource,
    sandbox
  );

  return sandbox.REOS
    .CountyCodeViolationCollapseFullRowEvidence
    .exportEvidence(
      options || {}
    );
}

const result =
  execute(
    persistedRows(),
    {}
  );

assert.strictEqual(
  result.ok,
  true
);

assert.strictEqual(
  result.authoritySha256,
  EXPECTED_AUTHORITY_SHA
);

assert.strictEqual(
  result.certifiedGroupCount,
  21
);

assert.strictEqual(
  result.certifiedRowCount,
  44
);

assert.strictEqual(
  result.returnedRowCount,
  44
);

assert.strictEqual(
  result.rows.length,
  44
);

assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      result.rows.map(
        row =>
          row.rowNumber
      )
    )
  ),
  authorityRecords
    .map(
      record =>
        record.rowNumber
    )
    .sort(
      (a, b) =>
        a - b
    )
);

result.rows.forEach(entry => {
  assert.strictEqual(
    EXCLUDED_IDS.has(
      entry.distressLeadId
    ),
    false
  );

  assert.notStrictEqual(
    Number(entry.groupNumber),
    3
  );

  const expected =
    authorityRecords.find(
      record =>
        record.distressLeadId ===
        entry.distressLeadId
    );

  assert(expected);

  assert.strictEqual(
    entry.groupNumber,
    expected.groupNumber
  );

  assert.strictEqual(
    entry.rowNumber,
    expected.rowNumber
  );

  assert.strictEqual(
    entry.proposedDurableKey,
    expected.proposedDurableKey
  );

  assert.strictEqual(
    entry.canonicalPropertyKey,
    expected.canonicalPropertyKey
  );

  headers.forEach(header => {
    assert.ok(
      Object.prototype
        .hasOwnProperty
        .call(
          entry.values,
          header
        )
    );
  });
});

assert.throws(
  () =>
    execute(
      persistedRows(),
      {
        distressLeadIds: [
          authorityRecords[0]
            .distressLeadId
        ]
      }
    ),
  /Caller-defined Distress Lead ID authority is prohibited/
);

function expectDrift(
  mutator,
  pattern
) {
  const rows =
    persistedRows();

  mutator(
    rows[0]
  );

  assert.throws(
    () =>
      execute(
        rows,
        {}
      ),
    pattern
  );
}

expectDrift(
  row => {
    row._rowNumber += 1;
  },
  /physical row mismatch/
);

expectDrift(
  row => {
    row.Source =
      'OTHER';
  },
  /Source mismatch/
);

expectDrift(
  row => {
    row['Source Dataset'] =
      'other';
  },
  /Source Dataset mismatch/
);

expectDrift(
  row => {
    row['Source Record ID'] =
      'DRIFT';
  },
  /Source Record ID mismatch/
);

expectDrift(
  row => {
    row['Violation Number'] =
      'VI-DRIFT';
  },
  /Violation Number mismatch/
);

{
  const rows =
    persistedRows();

  rows.pop();

  assert.throws(
    () =>
      execute(
        rows,
        {}
      ),
    /Certified collapse cohort is incomplete/
  );
}

{
  const rows =
    persistedRows();

  rows.push({
    ...rows[0]
  });

  assert.throws(
    () =>
      execute(
        rows,
        {}
      ),
    /duplicate persisted Distress Lead ID/
  );
}

[
  'productionDataMutationAuthorityGranted',
  'collapseAuthorityGranted',
  'winnerSelectionAuthorityGranted',
  'deleteAuthorityGranted',
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.strictEqual(
    result[field],
    false,
    field
  );
});

[
  /setValues\s*\(/,
  /setValue\s*\(/,
  /appendRow\s*\(/,
  /deleteRow\s*\(/,
  /deleteRows\s*\(/,
  /insertRow\s*\(/,
  /insertRows\s*\(/,
  /Database\.update\s*\(/,
  /Database\.insert\s*\(/,
  /Database\.upsert\s*\(/,
  /ScriptApp\.newTrigger\s*\(/
].forEach(pattern => {
  assert.strictEqual(
    pattern.test(
      readerSource
    ),
    false,
    'Forbidden reader surface: ' +
      pattern
  );
});

console.log(
  'POST_RESTORATION_FULLROW_VALIDATOR_PASS=true'
);

console.log(
  'POST_RESTORATION_FULLROW_GROUP_COUNT=21'
);

console.log(
  'POST_RESTORATION_FULLROW_ROW_COUNT=44'
);

console.log(
  'POST_RESTORATION_FULLROW_GROUP3_EXCLUDED=true'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
