#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

console.log(
  '=== COUNTY CODE-VIOLATION DURABLE IDENTITY AUDIT CONTRACT ==='
);

const auditPath =
  'build/apps-script-brand/CountyCodeViolationDurableIdentityAudit.js';

assert.ok(
  fs.existsSync(auditPath),
  'Durable identity audit module must exist'
);

const source =
  fs.readFileSync(
    auditPath,
    'utf8'
  );

/*
 * Structural read-only containment.
 */
[
  /\.ensureTable\s*\(/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.softDelete\s*\(/,
  /\.appendRow\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.insertSheet\s*\(/,
  /\.setProperty\s*\(/,
  /\.deleteProperty\s*\(/,
  /ScriptApp\s*\.\s*newTrigger/,
  /ScriptApp\s*\.\s*deleteTrigger/,
  /UrlFetchApp/,
  /CountyRuntimeBridge\s*\.\s*(run|sync|dryRun)/
].forEach(function (pattern) {
  assert.equal(
    pattern.test(source),
    false,
    'Audit must remain structurally read-only: ' +
      String(pattern)
  );
});

[
  'rowsWithViolationNumber',
  'rowsMissingViolationNumber',
  'proposedDurableKeys',
  'duplicateProposedDurableKeys',
  'proposedDurableKeyPropertyConflicts',
  'legacyObservationKeyToDurableKeyConflicts',
  'durableKeysWithMultipleLegacyObservationKeys',
  'migrationReadyRows',
  'collapseRequiredRows',
  'reviewRequiredRows',
  'safeToMigrateDurableIdentity',
  'productionDataMutationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'migrationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(function (field) {
  assert.ok(
    source.includes(field),
    'Audit must expose diagnostic field: ' +
      field
  );
});

assert.match(
  source,
  /REOS\.Database\.getHeaders\s*\(/,
  'Audit must read existing headers'
);

assert.match(
  source,
  /REOS\.Database\.getAll\s*\(/,
  'Audit must read existing rows'
);

assert.match(
  source,
  /REOS\.Security\.requireAdmin\s*\(/,
  'Audit must require admin authority'
);

assert.match(
  source,
  /function\s+reosCountyCodeViolationDurableIdentityAudit\s*\(/,
  'Controlled Apps Script RPC must exist'
);

console.log(
  'PASS: audit module is structurally read-only'
);

/*
 * Behavioral certification.
 */
let headerReads = 0;
let rowReads = 0;
let adminCalls = 0;

const headers = [
  'Distress Lead ID',
  'Address',
  'City',
  'State',
  'Zip',
  'County',
  'Source',
  'Source Dataset',
  'Parcel ID',
  'Source Record ID',
  'Source Record Key',
  'Source Observation Key',
  'Canonical Property Key',
  'Violation Number'
];

function row(
  rowNumber,
  distressLeadId,
  sourceRecordId,
  violationNumber,
  parcelId
) {
  return {
    _rowNumber: rowNumber,
    'Distress Lead ID':
      distressLeadId,
    Address:
      rowNumber + ' Market St',
    City: 'Philadelphia',
    State: 'PA',
    Zip: '19103',
    County: 'Philadelphia',
    Source: 'PA-PHILADELPHIA',
    'Source Dataset':
      'code_violations',
    'Parcel ID':
      parcelId,
    'Source Record ID':
      sourceRecordId,
    'Source Record Key':
      '',
    'Source Observation Key':
      '',
    'Canonical Property Key':
      '',
    'Violation Number':
      violationNumber
  };
}

const rows = [
  /*
   * Unique durable observation.
   */
  row(
    2,
    'DL-READY',
    '100',
    'VI-A',
    '111'
  ),

  /*
   * Same logical violation/property appears under
   * two old ObjectIDs: collapse, not property conflict.
   */
  row(
    3,
    'DL-COLLAPSE-1',
    '200',
    'VI-B',
    '222'
  ),
  row(
    4,
    'DL-COLLAPSE-2',
    '201',
    'VI-B',
    '222'
  ),

  /*
   * Same durable violation points to incompatible
   * properties: fail closed.
   */
  row(
    5,
    'DL-PROPERTY-CONFLICT-1',
    '300',
    'VI-C',
    '333'
  ),
  row(
    6,
    'DL-PROPERTY-CONFLICT-2',
    '301',
    'VI-C',
    '444'
  ),

  /*
   * One old ObjectID maps to two durable violations:
   * direct evidence of recycled physical identity.
   */
  row(
    7,
    'DL-LEGACY-CONFLICT-1',
    '400',
    'VI-D',
    '555'
  ),
  row(
    8,
    'DL-LEGACY-CONFLICT-2',
    '400',
    'VI-E',
    '555'
  ),

  /*
   * Missing durable identity authority.
   */
  row(
    9,
    'DL-MISSING-VIOLATION',
    '500',
    '',
    '666'
  ),

  /*
   * Out-of-scope row proves exact dataset scoping.
   */
  {
    _rowNumber: 10,
    'Distress Lead ID':
      'DL-OTHER',
    Source: 'PA-PHILADELPHIA',
    'Source Dataset':
      'vacant_properties',
    'Parcel ID': '777',
    'Source Record ID': '600',
    'Violation Number': 'VI-X'
  }
];

const context = {
  console,

  REOS: {
    Database: {
      getHeaders(sheetName) {
        assert.equal(
          sheetName,
          'DISTRESS_LEADS'
        );

        headerReads++;
        return headers.slice();
      },

      getAll(sheetName) {
        assert.equal(
          sheetName,
          'DISTRESS_LEADS'
        );

        rowReads++;

        return rows.map(function (item) {
          return Object.assign(
            {},
            item
          );
        });
      }
    },

    Security: {
      requireAdmin() {
        adminCalls++;
        return true;
      }
    },

    CanonicalPropertyIdentity: {
      tryCanonicalPropertyIdentity(
        record
      ) {
        const parcel =
          String(
            record['Parcel ID'] || ''
          ).trim();

        if (!parcel) {
          return {
            ok: false,
            key: ''
          };
        }

        return {
          ok: true,
          key:
            'property|parcel|pa|philadelphia|' +
            parcel
        };
      }
    }
  }
};

vm.createContext(context);

vm.runInContext(
  source,
  context,
  {
    filename:
      'CountyCodeViolationDurableIdentityAudit.js'
  }
);

assert.equal(
  typeof context
    .reosCountyCodeViolationDurableIdentityAudit,
  'function'
);

const result =
  context
    .reosCountyCodeViolationDurableIdentityAudit({
      sampleLimit: 100
    });

assert.equal(adminCalls, 1);
assert.equal(headerReads, 1);
assert.equal(rowReads, 1);

assert.equal(result.ok, true);
assert.equal(
  result.mode,
  'READ_ONLY'
);
assert.equal(
  result.phase,
  'code_violation_durable_identity'
);

assert.equal(
  result.scope.connectorId,
  'PA-PHILADELPHIA'
);

assert.equal(
  result.scope.dataset,
  'code_violations'
);

assert.equal(
  result.scopedRows,
  8
);

assert.equal(
  result.rowsWithViolationNumber,
  7
);

assert.equal(
  result.rowsMissingViolationNumber.count,
  1
);

assert.equal(
  result.proposedDurableKeys.count,
  5
);

assert.equal(
  result.duplicateProposedDurableKeys.count,
  2
);

assert.equal(
  result.proposedDurableKeyPropertyConflicts.count,
  1
);

assert.equal(
  result.legacyObservationKeyToDurableKeyConflicts.count,
  1
);

assert.equal(
  result.durableKeysWithMultipleLegacyObservationKeys.count,
  2
);

assert.equal(
  result.migrationReadyRows.count,
  1
);

assert.equal(
  result.collapseRequiredRows.count,
  4
);

assert.equal(
  result.reviewRequiredRows.count,
  5
);

assert.equal(
  result.safeToMigrateDurableIdentity,
  false
);

[
  'productionDataMutationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'migrationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(function (field) {
  assert.equal(
    result[field],
    false,
    field + ' must remain false'
  );
});

console.log(
  'PASS: exact Philadelphia code-violation scoping works'
);

console.log(
  'PASS: unique durable observations remain migration-ready'
);

console.log(
  'PASS: multiple old ObjectIDs for one durable observation require collapse'
);

console.log(
  'PASS: durable observation-to-property conflicts fail closed'
);

console.log(
  'PASS: recycled old ObjectID mapping to multiple violations fails closed'
);

console.log(
  'PASS: missing violation number requires review'
);

console.log(
  'PASS: audit grants no mutation, scheduler, checkpoint, migration, or offer authority'
);

console.log();

console.log(
  'County code-violation durable identity audit contract PASSED.'
);
