'use strict';

const assert = require('node:assert/strict');

const {
  normalizeCamdenParcel,
  reconcileCamdenBatch
} = require('./CamdenParcelIdentity');

const valid = normalizeCamdenParcel({
  COUNTY: 'CAMDEN',
  PAMS_PIN: 'TEST-PIN-1001',
  OBJECTID: 1001,
  ST_ADDRESS: '100 TEST STREET',
  MUN_NAME: 'CAMDEN'
});

assert.equal(valid.ok, true);
assert.equal(
  valid.record.propertyIdentity,
  'NJ:CAMDEN:PAMS_PIN:TEST-PIN-1001'
);

assert.equal(valid.record.distressVerified, false);
assert.equal(valid.record.actionableDistress, false);
assert.equal(valid.record.maoAuthorized, false);
assert.equal(valid.record.offerGenerationAuthorized, false);
assert.equal(valid.record.offerSubmissionAuthorized, false);
assert.equal(valid.record.disposition, 'RESEARCH_ONLY');

const wrongCounty = normalizeCamdenParcel({
  COUNTY: 'BURLINGTON',
  PAMS_PIN: 'TEST-PIN-1001',
  OBJECTID: 1001,
  ST_ADDRESS: '100 TEST STREET'
});

assert.equal(wrongCounty.ok, false);
assert.equal(
  wrongCounty.reason,
  'COUNTY_NOT_CERTIFIED'
);

const missingPin = normalizeCamdenParcel({
  COUNTY: 'CAMDEN',
  OBJECTID: 1001,
  ST_ADDRESS: '100 TEST STREET'
});

assert.equal(missingPin.ok, false);
assert.equal(
  missingPin.reason,
  'MISSING_CERTIFIED_PARCEL_ID'
);

const missingObjectId = normalizeCamdenParcel({
  COUNTY: 'CAMDEN',
  PAMS_PIN: 'TEST-PIN-1001',
  ST_ADDRESS: '100 TEST STREET'
});

assert.equal(missingObjectId.ok, false);
assert.equal(
  missingObjectId.reason,
  'MISSING_SOURCE_RECORD_ID'
);

const missingAddress = normalizeCamdenParcel({
  COUNTY: 'CAMDEN',
  PAMS_PIN: 'TEST-PIN-1001',
  OBJECTID: 1001
});

assert.equal(missingAddress.ok, false);
assert.equal(
  missingAddress.reason,
  'MISSING_PROPERTY_ADDRESS'
);

console.log('NJ_CAMDEN_VALID_RECORD_PASS=true');
console.log('NJ_CAMDEN_WRONG_COUNTY_REJECTED=true');
console.log('NJ_CAMDEN_MISSING_PIN_REJECTED=true');
console.log('NJ_CAMDEN_MISSING_OBJECTID_REJECTED=true');
console.log('NJ_CAMDEN_MISSING_ADDRESS_REJECTED=true');
console.log('NJ_CAMDEN_MAO_AUTHORITY=false');
console.log('NJ_CAMDEN_OFFER_AUTHORITY=false');
console.log('NJ_CAMDEN_OFFLINE_CERTIFICATION=PASS');

// NJ-19B strict OBJECTID validation
for (const value of [0, -1, 1.5, 'ABC', '9007199254740992']) {
  const result = normalizeCamdenParcel({
    COUNTY: 'CAMDEN',
    PAMS_PIN: 'TEST-200',
    OBJECTID: value,
    ST_ADDRESS: '100 TEST STREET'
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'INVALID_SOURCE_RECORD_ID');
}

console.log('INVALID_OBJECTIDS_REJECTED=true');

function sourceRecord(objectId, address, pin = 'TEST-300') {
  return {
    COUNTY: 'CAMDEN',
    PAMS_PIN: pin,
    OBJECTID: objectId,
    ST_ADDRESS: address,
    MUN_NAME: 'CAMDEN'
  };
}

const conflictingBatch = reconcileCamdenBatch([
  sourceRecord(101, '100 TEST STREET'),
  sourceRecord(102, '200 DIFFERENT STREET'),
  sourceRecord(103, '100 TEST STREET')
]);

assert.equal(conflictingBatch.ok, false);
assert.equal(
  conflictingBatch.reason,
  'RESEARCH_REVIEW_REQUIRED'
);

assert.equal(conflictingBatch.records.length, 3);

for (const result of conflictingBatch.records) {
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'PARCEL_IDENTITY_CONFLICT');
  assert.equal(result.record, null);
}

const reverseBatch = reconcileCamdenBatch([
  sourceRecord(103, '100 TEST STREET'),
  sourceRecord(102, '200 DIFFERENT STREET'),
  sourceRecord(101, '100 TEST STREET')
]);

assert.equal(reverseBatch.ok, false);

for (const result of reverseBatch.records) {
  assert.equal(result.reason, 'PARCEL_IDENTITY_CONFLICT');
}

console.log('ORDER_INDEPENDENT_CONFLICT_REJECTION=true');

const duplicateBatch = reconcileCamdenBatch([
  sourceRecord(101, '100 TEST STREET'),
  sourceRecord(102, '100 TEST STREET')
]);

assert.equal(duplicateBatch.ok, true);
assert.equal(
  duplicateBatch.records[1].reason,
  'DUPLICATE_SOURCE_PARCEL'
);

for (const result of duplicateBatch.records) {
  assert.equal(result.record.maoAuthorized, false);
  assert.equal(result.record.offerGenerationAuthorized, false);
  assert.equal(result.record.offerSubmissionAuthorized, false);
}

console.log('IDENTICAL_DUPLICATES_CLASSIFIED=true');

const emptyBatch = reconcileCamdenBatch([]);
assert.equal(emptyBatch.ok, true);
assert.equal(emptyBatch.records.length, 0);

const invalidBatch = reconcileCamdenBatch(null);
assert.equal(invalidBatch.ok, false);
assert.equal(invalidBatch.reason, 'INVALID_BATCH');

const mixedBatch = reconcileCamdenBatch([
  sourceRecord(101, '100 TEST STREET'),
  sourceRecord(0, '100 TEST STREET')
]);
assert.equal(mixedBatch.ok, false);
assert.equal(mixedBatch.reason, 'BATCH_VALIDATION_FAILED');

console.log('BATCH_VALIDATION_FAIL_CLOSED=true');
console.log('NJ_CAMDEN_NJ19B_CERTIFICATION=PASS');
