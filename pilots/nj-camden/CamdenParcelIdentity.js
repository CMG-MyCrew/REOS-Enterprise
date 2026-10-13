'use strict';

/*
 * REOS NJ Camden parcel identity pilot.
 *
 * Offline only. No SDK registration, network access,
 * persistence, scheduler, MAO, or offer authority.
 */

const CONNECTOR_ID = 'NJ-CAMDEN';
const DATASET = 'property_assessment';

function text(value) {
  return value == null ? '' : String(value).trim();
}

function fail(reason) {
  return {
    ok: false,
    reason,
    record: null
  };
}

function normalizeCamdenParcel(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fail('INVALID_SOURCE_RECORD');
  }

  const county = text(raw.COUNTY).toUpperCase();

  if (county !== 'CAMDEN') {
    return fail('COUNTY_NOT_CERTIFIED');
  }

  const pin = text(raw.PAMS_PIN);

  if (!pin) {
    return fail('MISSING_CERTIFIED_PARCEL_ID');
  }

  const objectId = text(raw.OBJECTID);

  if (!objectId) {
    return fail('MISSING_SOURCE_RECORD_ID');
  }

  if (
    !/^[1-9][0-9]*$/.test(objectId) ||
    !Number.isSafeInteger(Number(objectId))
  ) {
    return fail('INVALID_SOURCE_RECORD_ID');
  }

  const address = text(raw.ST_ADDRESS || raw.PROP_LOC);

  if (!address) {
    return fail('MISSING_PROPERTY_ADDRESS');
  }

  const record = {
    connectorId: CONNECTOR_ID,
    dataset: DATASET,
    state: 'NJ',
    county: 'Camden',

    propertyIdentity: 'NJ:CAMDEN:PAMS_PIN:' + pin,
    parcelId: pin,
    sourceRecordId: objectId,

    address,
    municipality: text(raw.MUN_NAME),

    sourceType: 'OFFICIAL_PARCEL_ASSESSMENT',
    classification: 'ASSESSMENT_ONLY',

    distressVerified: false,
    actionableDistress: false,

    arv: null,
    repairScope: null,

    maoAuthorized: false,
    offerGenerationAuthorized: false,
    offerSubmissionAuthorized: false,

    disposition: 'RESEARCH_ONLY'
  };

  return {
    ok: true,
    reason: 'IDENTITY_CERTIFIED',
    record
  };
}

function reconcileCamdenBatch(rawRecords) {
  if (!Array.isArray(rawRecords)) {
    return {
      ok: false,
      reason: 'INVALID_BATCH',
      records: []
    };
  }

  const results = rawRecords.map(normalizeCamdenParcel);
  const groups = new Map();

  results.forEach((result, index) => {
    if (!result.ok) return;

    const record = result.record;
    const key = record.propertyIdentity;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(index);
  });

  for (const indexes of groups.values()) {
    const evidence = new Set();

    for (const index of indexes) {
      const record = results[index].record;

      evidence.add(
        JSON.stringify([
          record.address.trim().toUpperCase()
            .replace(/\s+/g, ' '),
          record.municipality.trim().toUpperCase()
            .replace(/\s+/g, ' ')
        ])
      );
    }

    if (evidence.size > 1) {
      for (const index of indexes) {
        results[index] = {
          ok: false,
          reason: 'PARCEL_IDENTITY_CONFLICT',
          record: null,
          disposition: 'RESEARCH_REVIEW_REQUIRED'
        };
      }
    } else if (indexes.length > 1) {
      for (const index of indexes.slice(1)) {
        results[index] = {
          ...results[index],
          reason: 'DUPLICATE_SOURCE_PARCEL'
        };
      }
    }
  }

  const conflict = results.some(
    result => result.reason === 'PARCEL_IDENTITY_CONFLICT'
  );

  return {
    ok: results.every(result => result.ok),
    reason: conflict
      ? 'RESEARCH_REVIEW_REQUIRED'
      : results.every(result => result.ok)
        ? 'BATCH_RECONCILED'
        : 'BATCH_VALIDATION_FAILED',
    records: results
  };
}

module.exports = {
  CONNECTOR_ID,
  DATASET,
  normalizeCamdenParcel,
  reconcileCamdenBatch
};
