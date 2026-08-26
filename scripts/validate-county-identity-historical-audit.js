#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

console.log(
  '=== COUNTY IDENTITY HISTORICAL AUDIT CONTRACT ==='
);

const auditPath =
  'build/apps-script-brand/CountyIdentityHistoricalAudit.js';

const identityPath =
  'build/apps-script-brand/CanonicalPropertyIdentity.js';

assert.ok(
  fs.existsSync(auditPath),
  'CountyIdentityHistoricalAudit.js must exist'
);

assert.ok(
  fs.existsSync(identityPath),
  'CanonicalPropertyIdentity.js must exist'
);

const source =
  fs.readFileSync(
    auditPath,
    'utf8'
  );

const identitySource =
  fs.readFileSync(
    identityPath,
    'utf8'
  );

/*
 * Structural read-only containment.
 */
const forbiddenPatterns = [
  {
    pattern: /\.ensureTable\s*\(/,
    label: 'Database.ensureTable'
  },
  {
    pattern: /\.insert\s*\(/,
    label: 'Database.insert'
  },
  {
    pattern: /\.update\s*\(/,
    label: 'Database.update'
  },
  {
    pattern: /\.upsert\s*\(/,
    label: 'Database.upsert'
  },
  {
    pattern: /\.softDelete\s*\(/,
    label: 'Database.softDelete'
  },
  {
    pattern: /\.appendRow\s*\(/,
    label: 'appendRow'
  },
  {
    pattern: /\.setValue\s*\(/,
    label: 'setValue'
  },
  {
    pattern: /\.setValues\s*\(/,
    label: 'setValues'
  },
  {
    pattern: /\.insertSheet\s*\(/,
    label: 'insertSheet'
  },
  {
    pattern: /\.setProperty\s*\(/,
    label: 'Script Properties setProperty'
  },
  {
    pattern: /\.deleteProperty\s*\(/,
    label: 'Script Properties deleteProperty'
  },
  {
    pattern: /ScriptApp\s*\.\s*newTrigger/,
    label: 'trigger creation'
  },
  {
    pattern: /ScriptApp\s*\.\s*deleteTrigger/,
    label: 'trigger deletion'
  },
  {
    pattern: /UrlFetchApp/,
    label: 'network access'
  },
  {
    pattern:
      /CountyRuntimeBridge\s*\.\s*(run|sync|dryRun)/,
    label: 'county runtime execution'
  }
];

for (const item of forbiddenPatterns) {
  assert.equal(
    item.pattern.test(source),
    false,
    'Historical audit must not contain mutation/execution surface: ' +
      item.label
  );
}

assert.match(
  source,
  /REOS\.Database\.getHeaders\s*\(/,
  'Audit must inspect existing DISTRESS_LEADS headers'
);

assert.match(
  source,
  /REOS\.Database\.getAll\s*\(/,
  'Audit must inspect existing DISTRESS_LEADS rows'
);

assert.match(
  source,
  /CanonicalPropertyIdentity\.resolve\s*\(/,
  'Audit must reconstruct current canonical identity'
);

assert.match(
  source,
  /REOS\.Security\.requireAdmin\s*\(/,
  'Audit entry point must require admin authority'
);

assert.match(
  source,
  /function\s+reosCountyIdentityHistoricalAudit\s*\(/,
  'Controlled historical-audit Apps Script entry point is required'
);

[
  'totalRows',
  'scopedRows',
  'legacyRows',
  'rowsWithSourceRecordKey',
  'rowsWithSourceObservationKey',
  'rowsWithCanonicalPropertyKey',
  'reconstructableObservationKeys',
  'reconstructableCanonicalKeys',
  'identityErrors',
  'duplicateObservationKeys',
  'observationPropertyConflicts',
  'canonicalPropertyGroups',
  'multiObservationPropertyGroups',
  'migrationReadyRows',
  'reviewRequiredRows'
].forEach(function (field) {
  assert.ok(
    source.includes(field),
    'Audit result must expose diagnostic field: ' +
      field
  );
});

assert.equal(
  /PAPhiladelphiaCountyConnector\s*\.\s*(fetch|run)/.test(
    source
  ),
  false,
  'Phase A must not invoke Philadelphia source fetches'
);

console.log(
  'PASS: audit module is structurally read-only'
);

/*
 * Behavioral read-only certification.
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
  'Canonical Property Key'
];

const rows = [];

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

        return rows.map(row =>
          Object.assign({}, row)
        );
      }
    },

    Security: {
      requireAdmin() {
        adminCalls++;
        return true;
      }
    }
  }
};

vm.createContext(context);

vm.runInContext(
  identitySource,
  context,
  {
    filename:
      'CanonicalPropertyIdentity.js'
  }
);

function baseRow(
  rowNumber,
  id,
  sourceRecordId,
  parcelId,
  address
) {
  return {
    _rowNumber: rowNumber,
    'Distress Lead ID': id,
    Address: address,
    City: 'Philadelphia',
    State: 'PA',
    Zip: '19103',
    County: 'Philadelphia',
    Source: 'PA-PHILADELPHIA',
    'Source Dataset':
      'code_violations',
    'Parcel ID': parcelId,
    'Source Record ID':
      sourceRecordId,
    'Source Record Key': '',
    'Source Observation Key': '',
    'Canonical Property Key': ''
  };
}

/*
 * Two distinct observations for one property.
 * Both are valid legacy migration candidates.
 */
const row1 =
  baseRow(
    2,
    'DL-1',
    '100',
    '88-123-4500',
    '100 Market St'
  );

const row2 =
  baseRow(
    3,
    'DL-2',
    '101',
    '881234500',
    '100 MARKET ST'
  );

/*
 * Same immutable source observation appears twice,
 * but points to incompatible parcels.
 */
const row3 =
  baseRow(
    4,
    'DL-3',
    '200',
    '111111111',
    '200 Market St'
  );

const row4 =
  baseRow(
    5,
    'DL-4',
    '200',
    '222222222',
    '201 Market St'
  );

/*
 * Legacy address-only observation cannot satisfy current
 * source-observation authority.
 */
const row5 =
  baseRow(
    6,
    'DL-5',
    '',
    '',
    '300 Market St'
  );

row5['Source Record Key'] =
  'pa-philadelphia|code_violations|legacy-address';

/*
 * Already-migrated correct row.
 */
const row6 =
  baseRow(
    7,
    'DL-6',
    '300',
    '333333333',
    '400 Market St'
  );

/*
 * Stored new identity fields disagree with reconstructed authority.
 */
const row7 =
  baseRow(
    8,
    'DL-7',
    '400',
    '444444444',
    '500 Market St'
  );

/*
 * Non-Philadelphia row proves connector scoping.
 */
const row8 = {
  _rowNumber: 9,
  'Distress Lead ID': 'DL-8',
  Address: '1 Main St',
  City: 'Doylestown',
  State: 'PA',
  Zip: '18901',
  County: 'Bucks',
  Source: 'PA-BUCKS',
  'Source Dataset':
    'tax_delinquent',
  'Parcel ID': 'BUCKS-1',
  'Source Record ID': '1',
  'Source Record Key': ''
};

[
  row1,
  row2,
  row3,
  row4,
  row6,
  row7
].forEach(row => {
  const identity =
    context.REOS
      .CanonicalPropertyIdentity
      .resolve(row);

  row['Source Record Key'] =
    identity.sourceObservationKey;
});

{
  const identity =
    context.REOS
      .CanonicalPropertyIdentity
      .resolve(row6);

  row6['Source Observation Key'] =
    identity.sourceObservationKey;

  row6['Canonical Property Key'] =
    identity.canonicalPropertyKey;
}

row7['Source Observation Key'] =
  'wrong|observation|authority';

row7['Canonical Property Key'] =
  'wrong|canonical|authority';

rows.push(
  row1,
  row2,
  row3,
  row4,
  row5,
  row6,
  row7,
  row8
);

vm.runInContext(
  source,
  context,
  {
    filename:
      'CountyIdentityHistoricalAudit.js'
  }
);

assert.equal(
  typeof context
    .reosCountyIdentityHistoricalAudit,
  'function',
  'controlled audit entry point must load'
);

const result =
  context
    .reosCountyIdentityHistoricalAudit({
      connectorId:
        'PA-PHILADELPHIA',

      datasets: [
        'code_violations'
      ],

      sampleLimit: 20
    });

assert.equal(
  adminCalls,
  1,
  'audit must require admin exactly once'
);

assert.equal(
  headerReads,
  1,
  'audit must read headers exactly once'
);

assert.equal(
  rowReads,
  1,
  'audit must read rows exactly once'
);

assert.equal(
  result.ok,
  true
);

assert.equal(
  result.mode,
  'READ_ONLY'
);

assert.equal(
  result.phase,
  'persisted_table'
);

assert.equal(
  result.totalRows,
  8
);

assert.equal(
  result.scopedRows,
  7
);

assert.equal(
  result.legacyRows,
  5
);

assert.equal(
  result.rowsWithSourceRecordKey,
  7
);

assert.equal(
  result.rowsWithSourceObservationKey,
  2
);

assert.equal(
  result.rowsWithCanonicalPropertyKey,
  2
);

assert.equal(
  result.reconstructableObservationKeys,
  6
);

assert.equal(
  result.reconstructableCanonicalKeys,
  6
);

assert.equal(
  result.identityErrors.count,
  1,
  'address alone must not become source-observation authority'
);

assert.equal(
  result.duplicateObservationKeys.count,
  1,
  'duplicate immutable source observation must be detected'
);

assert.equal(
  result.observationPropertyConflicts.count,
  1,
  'one immutable observation pointing at two properties must conflict'
);

assert.equal(
  result.canonicalPropertyGroups.count,
  5
);

assert.equal(
  result.multiObservationPropertyGroups.count,
  1,
  'two legitimate observations should link to one property without collapse'
);

assert.equal(
  result.storedKeyMismatches.count,
  1,
  'stored identity disagreement must require review'
);

assert.equal(
  result.migrationReadyRows.count,
  2,
  'only unambiguous legacy rows may be migration-ready'
);

assert.equal(
  result.reviewRequiredRows.count,
  4,
  'duplicate/conflict/error/mismatch rows must require review'
);

assert.equal(
  result.safeToMigratePersistedRows,
  false,
  'detected conflicts must fail migration readiness closed'
);

/*
 * Ensure the legitimate same-property observations
 * remain distinct source observations.
 */
const propertyGroup =
  result
    .multiObservationPropertyGroups
    .groups[0];

assert.equal(
  propertyGroup.observationCount,
  2
);

console.log(
  'PASS: audit uses existing table reads only'
);

console.log(
  'PASS: exact connector/dataset scoping is enforced'
);

console.log(
  'PASS: deterministic identity reconstruction works'
);

console.log(
  'PASS: legitimate many-observations-to-one-property linkage is preserved'
);

console.log(
  'PASS: duplicate source observations are detected'
);

console.log(
  'PASS: observation-to-property conflicts fail closed'
);

console.log(
  'PASS: unreconstructable legacy identity requires review'
);

console.log(
  'PASS: stored identity disagreement requires review'
);

console.log(
  'PASS: migration-ready rows exclude all ambiguous/conflicting rows'
);

console.log(
  'PASS: Phase A contains no source/network reconciliation'
);

console.log();
console.log(
  'County identity historical audit contract PASSED.'
);
