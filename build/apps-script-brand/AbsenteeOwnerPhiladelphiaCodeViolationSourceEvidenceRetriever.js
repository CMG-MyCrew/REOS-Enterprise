var REOS = REOS || {};

REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever =
(function () {
  'use strict';

  var MODE =
    'READ_ONLY_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVAL';

  var PHASE =
    'absentee_owner_source_evidence_retrieval';

  var SOURCE_CONNECTOR =
    'PA-PHILADELPHIA';

  var SOURCE_DATASET =
    'code_violations';

  var SOURCE_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var SOURCE_OUT_FIELDS =
    'objectid,address,parcel_id_num,opa_account_num';

  var DISTRESS_ID =
    'Distress Lead ID';

  var CANONICAL_KEY =
    'Canonical Property Key';

  var MIN_REFERENCES = 2;
  var MAX_REFERENCES = 5;

  function own_(object, key) {
    return Object.prototype.hasOwnProperty.call(
      object,
      key
    );
  }

  function isPlainObject_(value) {
    return !!value &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function exactKeys_(object, expected) {
    if (!isPlainObject_(object)) {
      return false;
    }

    var keys = Object.keys(object);

    if (keys.length !== expected.length) {
      return false;
    }

    return expected.every(function (key) {
      return own_(object, key);
    });
  }

  function cleanString_(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();
  }

  function authority_() {
    return {
      productionSourceRetrievalExecutionAuthorityGranted:
        false,

      sourceEvidenceRetrievalAuthorityGranted:
        false,

      productionDataMutationAuthorityGranted:
        false,

      opaAccountRowRetrievalAuthorityGranted:
        false,

      ownerEvidenceRetrievalAuthorityGranted:
        false,

      classificationAuthorityGranted:
        false,

      persistenceAuthorityGranted:
        false,

      rolloutAuthorityGranted:
        false,

      identityRepairAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      triggerAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      cursorMutationAuthorityGranted:
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
        false
    };
  }

  function attachAuthority_(result) {
    var authority = authority_();

    Object.keys(authority).forEach(
      function (key) {
        result[key] = authority[key];
      }
    );

    return result;
  }

  function sourceBase_() {
    return {
      connector: SOURCE_CONNECTOR,
      dataset: SOURCE_DATASET,
      endpoint: SOURCE_ENDPOINT,
      lookupMode: 'exact_objectid'
    };
  }

  function copyTarget_(target) {
    return {
      rowNumber: target.rowNumber,

      identity: {
        'Distress Lead ID':
          target.identity[DISTRESS_ID],

        'Canonical Property Key':
          target.identity[CANONICAL_KEY]
      },

      propertyAddress:
        target.propertyAddress
    };
  }

  function fail_(
    code,
    message,
    target,
    requestedReferenceCount,
    failedReference,
    failedReferenceIndex
  ) {
    var result = attachAuthority_({
      ok: false,
      mode: MODE,
      phase: PHASE,
      outcome: 'FAILED',
      code: code,
      message: message,
      source: sourceBase_()
    });

    if (target) {
      result.target =
        copyTarget_(target);
    }

    if (
      typeof requestedReferenceCount ===
      'number'
    ) {
      result.requestedReferenceCount =
        requestedReferenceCount;
    }

    if (failedReference) {
      result.failure = {
        referenceIndex:
          failedReferenceIndex,

        sourceRecordId:
          failedReference.sourceRecordId
      };
    }

    return result;
  }

  function canonicalSourceRecordId_(value) {
    if (typeof value === 'number') {
      if (
        !isFinite(value) ||
        Math.floor(value) !== value ||
        value <= 0 ||
        value > 9007199254740991
      ) {
        return '';
      }

      return String(value);
    }

    if (typeof value !== 'string') {
      return '';
    }

    if (value !== value.trim()) {
      return '';
    }

    if (!/^[1-9]\d*$/.test(value)) {
      return '';
    }

    return value;
  }

  function validTarget_(target) {
    if (
      !exactKeys_(
        target,
        [
          'rowNumber',
          'identity',
          'propertyAddress'
        ]
      )
    ) {
      return {
        ok: false,
        code: 'INVALID_TARGET',
        message:
          'target must contain only rowNumber, identity, and propertyAddress.'
      };
    }

    if (
      typeof target.rowNumber !== 'number' ||
      !isFinite(target.rowNumber) ||
      Math.floor(target.rowNumber) !==
        target.rowNumber ||
      target.rowNumber < 2
    ) {
      return {
        ok: false,
        code: 'INVALID_ROW_NUMBER',
        message:
          'target.rowNumber must be a finite integer data-row number.'
      };
    }

    if (
      !exactKeys_(
        target.identity,
        [
          DISTRESS_ID,
          CANONICAL_KEY
        ]
      )
    ) {
      return {
        ok: false,
        code: 'INVALID_IDENTITY',
        message:
          'target.identity must contain only persisted Distress Lead ID and Canonical Property Key.'
      };
    }

    var distressLeadId =
      cleanString_(
        target.identity[DISTRESS_ID]
      );

    var canonicalPropertyKey =
      cleanString_(
        target.identity[CANONICAL_KEY]
      );

    var propertyAddress =
      cleanString_(
        target.propertyAddress
      );

    if (!distressLeadId) {
      return {
        ok: false,
        code: 'MISSING_DISTRESS_LEAD_ID',
        message:
          'Persisted Distress Lead ID is required.'
      };
    }

    if (!canonicalPropertyKey) {
      return {
        ok: false,
        code: 'MISSING_CANONICAL_PROPERTY_KEY',
        message:
          'Persisted Canonical Property Key is required.'
      };
    }

    if (
      !propertyAddress ||
      /[\u0000-\u001F\u007F]/
        .test(propertyAddress)
    ) {
      return {
        ok: false,
        code: 'INVALID_PROPERTY_ADDRESS',
        message:
          'A usable persisted propertyAddress is required.'
      };
    }

    return {
      ok: true,

      value: {
        rowNumber:
          target.rowNumber,

        identity: {
          'Distress Lead ID':
            distressLeadId,

          'Canonical Property Key':
            canonicalPropertyKey
        },

        propertyAddress:
          propertyAddress
      }
    };
  }

  function validateInput_(options) {
    if (
      !exactKeys_(
        options,
        [
          'target',
          'sourceReferences'
        ]
      )
    ) {
      return {
        ok: false,
        code: 'INVALID_OPTIONS',
        message:
          'options must contain only target and sourceReferences.'
      };
    }

    var target =
      validTarget_(
        options.target
      );

    if (!target.ok) {
      return target;
    }

    if (
      !Array.isArray(
        options.sourceReferences
      )
    ) {
      return {
        ok: false,
        code: 'INVALID_SOURCE_REFERENCES',
        message:
          'sourceReferences must be an array.'
      };
    }

    if (
      options.sourceReferences.length <
        MIN_REFERENCES ||
      options.sourceReferences.length >
        MAX_REFERENCES
    ) {
      return {
        ok: false,
        code:
          'SOURCE_REFERENCE_COUNT_OUT_OF_BOUNDS',
        message:
          'sourceReferences must contain between two and five certified references.'
      };
    }

    var seen = {};
    var references = [];

    for (
      var index = 0;
      index <
        options.sourceReferences.length;
      index++
    ) {
      var reference =
        options.sourceReferences[index];

      if (!isPlainObject_(reference)) {
        return {
          ok: false,
          code: 'INVALID_SOURCE_REFERENCE',
          message:
            'Each source reference must be an object.'
        };
      }

      var hasPersisted =
        own_(
          reference,
          'persistedSourceObservationKey'
        );

      var expectedKeys =
        hasPersisted
          ? [
              'sourceRecordId',
              'persistedSourceObservationKey'
            ]
          : [
              'sourceRecordId'
            ];

      if (
        !exactKeys_(
          reference,
          expectedKeys
        )
      ) {
        return {
          ok: false,
          code: 'INVALID_SOURCE_REFERENCE',
          message:
            'A source reference may contain only sourceRecordId and optional persistedSourceObservationKey.'
        };
      }

      var sourceRecordId =
        canonicalSourceRecordId_(
          reference.sourceRecordId
        );

      if (!sourceRecordId) {
        return {
          ok: false,
          code: 'INVALID_SOURCE_RECORD_ID',
          message:
            'sourceRecordId must be a canonical positive-decimal ArcGIS objectid.'
        };
      }

      if (seen[sourceRecordId]) {
        return {
          ok: false,
          code: 'DUPLICATE_SOURCE_RECORD_ID',
          message:
            'Duplicate sourceRecordId values are prohibited.'
        };
      }

      seen[sourceRecordId] = true;

      var sourceObservationId =
        SOURCE_CONNECTOR
          .toLowerCase() +
        '|' +
        SOURCE_DATASET +
        '|' +
        sourceRecordId;

      var persistedKey =
        hasPersisted
          ? cleanString_(
              reference
                .persistedSourceObservationKey
            )
          : '';

      if (
        persistedKey &&
        persistedKey !==
          sourceObservationId
      ) {
        return {
          ok: false,
          code:
            'SOURCE_OBSERVATION_IDENTITY_MISMATCH',
          message:
            'persistedSourceObservationKey does not match the derived sourceObservationId.'
        };
      }

      references.push({
        sourceRecordId:
          sourceRecordId,

        sourceObservationId:
          sourceObservationId
      });
    }

    return {
      ok: true,
      target: target.value,
      references: references
    };
  }

  function usableIdentifier_(value) {
    if (typeof value === 'string') {
      var text = value.trim();

      return text ? text : null;
    }

    if (
      typeof value === 'number' &&
      isFinite(value)
    ) {
      return String(value);
    }

    return null;
  }

  function usableAddress_(value) {
    if (typeof value !== 'string') {
      return null;
    }

    var text = value.trim();

    if (
      !text ||
      /[\u0000-\u001F\u007F]/
        .test(text)
    ) {
      return null;
    }

    return text;
  }

  function retrieve(options) {
    REOS.Security.requireAdmin();

    var validated =
      validateInput_(
        options
      );

    if (!validated.ok) {
      return fail_(
        validated.code,
        validated.message
      );
    }

    var observations = [];

    for (
      var index = 0;
      index < validated.references.length;
      index++
    ) {
      var reference =
        validated.references[index];

      var fetched;

      try {
        fetched =
          REOS.CountyAdapters.ArcGIS.fetch({
            endpoint:
              SOURCE_ENDPOINT,

            context: {
              limit: 1,
              cursor: ''
            },

            maxLimit: 1,

            where:
              'objectid = ' +
              reference.sourceRecordId,

            outFields:
              SOURCE_OUT_FIELDS,

            returnGeometry:
              false
          });
      } catch (error) {
        return fail_(
          'SOURCE_RETRIEVAL_FAILED',
          'The certified ArcGIS source request failed.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      if (
        !isPlainObject_(fetched) ||
        !Array.isArray(
          fetched.records
        )
      ) {
        return fail_(
          'SOURCE_RETRIEVAL_FAILED',
          'The certified ArcGIS adapter returned an invalid response.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      if (
        fetched.records.length === 0
      ) {
        return fail_(
          'SOURCE_RECORD_NOT_FOUND',
          'The certified sourceRecordId returned no ArcGIS record.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      if (
        fetched.records.length !== 1 ||
        (
          fetched.metadata &&
          fetched.metadata
            .exceededTransferLimit ===
              true
        )
      ) {
        return fail_(
          'SOURCE_RECORD_AMBIGUOUS',
          'The certified sourceRecordId did not produce a unique bounded ArcGIS record.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      var record =
        fetched.records[0];

      if (!isPlainObject_(record)) {
        return fail_(
          'SOURCE_RECORD_INCOMPLETE',
          'The ArcGIS source record is not a usable object.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      var returnedObjectId =
        canonicalSourceRecordId_(
          record.objectid
        );

      if (!returnedObjectId) {
        return fail_(
          'SOURCE_RECORD_INCOMPLETE',
          'The ArcGIS source record has an unusable objectid.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      if (
        returnedObjectId !==
        reference.sourceRecordId
      ) {
        return fail_(
          'SOURCE_RECORD_ID_MISMATCH',
          'The ArcGIS source record objectid does not match the certified sourceRecordId.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      var propertyAddress =
        usableAddress_(
          record.address
        );

      var parcelIdNum =
        usableIdentifier_(
          record.parcel_id_num
        );

      var opaAccountNum =
        usableIdentifier_(
          record.opa_account_num
        );

      if (
        !propertyAddress ||
        !parcelIdNum ||
        !opaAccountNum
      ) {
        return fail_(
          'SOURCE_RECORD_INCOMPLETE',
          'The ArcGIS source record is missing a required projected field.',
          validated.target,
          validated.references.length,
          reference,
          index
        );
      }

      observations.push({
        sourceObservationId:
          reference.sourceObservationId,

        propertyAddress:
          propertyAddress,

        parcel_id_num:
          parcelIdNum,

        opa_account_num:
          opaAccountNum
      });
    }

    return attachAuthority_({
      ok: true,
      mode: MODE,
      phase: PHASE,
      outcome:
        'SOURCE_EVIDENCE_READY',

      target:
        copyTarget_(
          validated.target
        ),

      source:
        sourceBase_(),

      requestedReferenceCount:
        validated.references.length,

      retrievedObservationCount:
        observations.length,

      sourceObservations:
        observations
    });
  }

  return Object.freeze({
    retrieve: retrieve
  });
})();
