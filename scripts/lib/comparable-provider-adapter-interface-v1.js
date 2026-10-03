'use strict';

const RETRIEVAL_STATUSES = Object.freeze([
  'success',
  'partial',
  'unavailable',
  'failed'
]);

function requireNonEmptyString(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(name + ' must be a non-empty string');
  }
}

function validateRequest(request) {
  if (!request || typeof request !== 'object') {
    throw new Error('request is required');
  }

  requireNonEmptyString(request.schemaVersion, 'schemaVersion');
  requireNonEmptyString(request.requestId, 'requestId');
  requireNonEmptyString(request.subjectDealId, 'subjectDealId');
  requireNonEmptyString(request.subjectAddress, 'subjectAddress');
  requireNonEmptyString(request.requestedAt, 'requestedAt');

  if (!request.searchPolicy || typeof request.searchPolicy !== 'object') {
    throw new Error('searchPolicy is required');
  }

  return true;
}

function createAdapterResult(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('adapter result input is required');
  }

  requireNonEmptyString(input.schemaVersion, 'schemaVersion');
  requireNonEmptyString(input.requestId, 'requestId');
  requireNonEmptyString(input.providerId, 'providerId');
  requireNonEmptyString(input.retrievedAt, 'retrievedAt');

  if (!RETRIEVAL_STATUSES.includes(input.retrievalStatus)) {
    throw new Error('invalid retrievalStatus');
  }

  const records = Array.isArray(input.records)
    ? input.records.map(record => Object.assign({}, record))
    : [];

  const warnings = Array.isArray(input.warnings)
    ? input.warnings.slice()
    : [];

  const errors = Array.isArray(input.errors)
    ? input.errors.slice()
    : [];

  return {
    schemaVersion: input.schemaVersion,
    requestId: input.requestId,
    providerId: input.providerId,
    retrievalStatus: input.retrievalStatus,
    retrievedAt: input.retrievedAt,
    records,
    warnings,
    errors
  };
}

function createOfflineMockAdapter(options) {
  if (!options || typeof options !== 'object') {
    throw new Error('mock adapter options are required');
  }

  requireNonEmptyString(options.providerId, 'providerId');

  return {
    retrieveComparables(request, syntheticResponse) {
      validateRequest(request);

      if (!syntheticResponse || typeof syntheticResponse !== 'object') {
        throw new Error('syntheticResponse is required');
      }

      if (syntheticResponse.requestId !== request.requestId) {
        throw new Error('requestId mismatch');
      }

      return createAdapterResult({
        schemaVersion: syntheticResponse.schemaVersion,
        requestId: request.requestId,
        providerId: options.providerId,
        retrievalStatus: syntheticResponse.retrievalStatus,
        retrievedAt: syntheticResponse.retrievedAt,
        records: syntheticResponse.records,
        warnings: syntheticResponse.warnings,
        errors: syntheticResponse.errors
      });
    }
  };
}

module.exports = {
  RETRIEVAL_STATUSES,
  validateRequest,
  createAdapterResult,
  createOfflineMockAdapter
};
