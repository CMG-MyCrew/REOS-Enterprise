'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const CONTRACT_FILE =
  'build/apps-script-brand/' +
  'CountyCodeViolationGroup3ZillowRestorationContract.js';

const source =
  fs.readFileSync(
    CONTRACT_FILE,
    'utf8'
  );

const forbidden = [
  'SpreadsheetApp',
  'LockService',
  'PropertiesService',
  'Database.update',
  'Database.insert',
  'Database.delete',
  'deletePhysicalRowExact',
  'patchPhysicalRowCellsExact',
  'setValue(',
  'setValues(',
  'clearContent(',
  'appendRow(',
  'reosCountyCodeViolationGroup3',
  'function reosCounty'
];

forbidden.forEach(token => {
  assert.strictEqual(
    source.includes(token),
    false,
    'Contract must remain non-production-capable: ' +
      token
  );
});

const sandbox = {
  REOS: {}
};

vm.createContext(sandbox);

vm.runInContext(
  source,
  sandbox,
  {
    filename:
      'CountyCodeViolationGroup3ZillowRestorationContract.js'
  }
);

const api =
  sandbox.REOS
    .CountyCodeViolationGroup3ZillowRestorationContract;

assert(api);
assert.strictEqual(
  typeof api.contract,
  'function'
);

const contract =
  JSON.parse(
    JSON.stringify(
      api.contract()
    )
  );

assert.strictEqual(
  contract.version,
  'COUNTY_CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION_V1'
);

assert.strictEqual(
  contract.groupNumber,
  3
);

assert.strictEqual(
  contract.violationNumber,
  'VI-2026-045359'
);

assert.strictEqual(
  contract.proposedDurableKey,
  'pa-philadelphia|code_violations|vi-2026-045359'
);

assert.deepStrictEqual(
  contract.countySurvivor,
  {
    distressLeadId:
      'DL-20260820181647-4170',
    physicalRow:
      767,
    action:
      'PRESERVE_AS_SOLE_COUNTY_CODE_VIOLATION'
  }
);

assert.strictEqual(
  contract.zillowRestoration.distressLeadId,
  'ZIL-20260820193920-1756'
);

assert.strictEqual(
  contract.zillowRestoration.physicalRow,
  771
);

assert.strictEqual(
  contract.zillowRestoration.sourceImportRow,
  38
);

assert.strictEqual(
  contract.zillowRestoration.action,
  'RESTORE_ZILLOW_PHYSICAL_ROW_FROM_IMPORT_PROVENANCE'
);

assert.strictEqual(
  contract.zillowRestoration
    .preservePhysicalDistressLeadId,
  true
);

assert.strictEqual(
  contract.zillowRestoration
    .preserveCreatedAt,
  true
);

assert.ok(
  contract.zillowRestoration
    .sourceRecordId
);

assert.strictEqual(
  contract.zillowRestoration
    .sourceObservationKey,
  'zillow gmail|gmail_leads|' +
    contract.zillowRestoration
      .sourceRecordId
      .toLowerCase()
);

const projection =
  contract.zillowRestoration
    .projection;

assert.strictEqual(
  projection.Source,
  'Zillow Gmail'
);

assert.strictEqual(
  projection['Source Dataset'],
  'gmail_leads'
);

assert.strictEqual(
  projection['Source Record ID'],
  contract.zillowRestoration
    .sourceRecordId
);

assert.strictEqual(
  projection['Source Record Key'],
  contract.zillowRestoration
    .sourceObservationKey
);

assert.strictEqual(
  projection['Source Observation Key'],
  contract.zillowRestoration
    .sourceObservationKey
);

assert.strictEqual(
  projection.Status,
  'New'
);

assert.deepStrictEqual(
  contract.downstreamReference,
  {
    sheet:
      'ZILLOW_GMAIL_IMPORTS',
    rowNumber:
      38,
    columnNumber:
      13,
    columnName:
      'Distress Lead ID',
    distressLeadId:
      'ZIL-20260820193920-1756',
    action:
      'PRESERVE_UNCHANGED'
  }
);

assert.strictEqual(
  contract.referenceRewriteRequired,
  false
);

assert.strictEqual(
  contract.physicalDeleteRequired,
  false
);

assert.strictEqual(
  contract.countyCollapseResolvedByRestoration,
  true
);

[
  'executionAuthorityGranted',
  'repairAuthorityGranted',
  'referenceRewriteAuthorityGranted',
  'deleteAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.strictEqual(
    contract[field],
    false,
    field + ' must remain false'
  );
});

const requiredClearFields = [
  'Source',
  'Source Dataset',
  'Connector Run ID',
  'Parcel ID',
  'Source Record ID',
  'Source Record Key',
  'Last Seen At',
  'Source Updated At',
  'Tax Principal',
  'Tax Interest',
  'Tax Penalty',
  'Violation Number',
  'Violation Type',
  'Violation Status',
  'Source Observation Key',
  'Canonical Property Key'
];

requiredClearFields.forEach(field => {
  assert(
    contract.zillowRestoration
      .clearCountyFields
      .includes(field),
    'Required county field not cleared: ' +
      field
  );
});

assert.strictEqual(
  contract.zillowRestoration
    .clearCountyFields
    .includes('Distress Lead ID'),
  false
);

assert.strictEqual(
  contract.zillowRestoration
    .clearCountyFields
    .includes('Created At'),
  false
);

console.log(
  'GROUP3_ZILLOW_RESTORATION_CONTRACT_VALIDATOR_PASS=true'
);

console.log(
  'GROUP3_COUNTY_SURVIVOR_ID=' +
  contract.countySurvivor.distressLeadId
);

console.log(
  'GROUP3_ZILLOW_RESTORATION_ID=' +
  contract.zillowRestoration.distressLeadId
);

console.log(
  'GROUP3_ZILLOW_IMPORT_ROW=' +
  contract.downstreamReference.rowNumber
);

console.log(
  'GROUP3_REFERENCE_REWRITE_REQUIRED=false'
);

console.log(
  'GROUP3_PHYSICAL_DELETE_REQUIRED=false'
);

console.log(
  'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
