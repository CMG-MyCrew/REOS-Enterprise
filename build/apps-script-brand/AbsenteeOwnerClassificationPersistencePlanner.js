var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationPersistencePlanner = (function () {
  'use strict';

  var PERSISTENCE_CONTRACT_VERSION = 1;
  var CLASSIFICATION_CONTRACT_VERSION = 1;

  var MODE = 'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION';
  var PHASE = 'absentee_owner_classification';
  var BASIS = 'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON';

  var SOURCE_AGENCY = 'Philadelphia Office of Property Assessment';
  var SOURCE_DATASET = 'Philadelphia Properties and Assessment History';
  var SOURCE_TABLE = 'opa_properties_public';
  var SOURCE_ENDPOINT = 'https://phl.carto.com/api/v2/sql';

  var DISTRESS_ID = 'Distress Lead ID';
  var CANONICAL_KEY = 'Canonical Property Key';

  var AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
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
    'automaticOfferAuthorityGranted'
  ]);

  var BASE_CLASSIFIER_FIELDS = Object.freeze([
    'ok',
    'mode',
    'phase',
    'outcome',
    'target',
    'upstreamComparisonOutcome',
    'classificationBasis',
    'normalizedPropertyAddress',
    'normalizedMailingAddress'
  ].concat(AUTHORITY_FIELDS));

  var OUTCOME_TO_UPSTREAM = Object.freeze({
    'ABSENTEE_OWNER_INDICATED': 'MAILING_ADDRESS_DIFFERS',
    'OWNER_MAILING_MATCHED': 'MAILING_ADDRESS_MATCHES',
    'INSUFFICIENT_CLASSIFICATION_EVIDENCE': 'INSUFFICIENT_MAILING_EVIDENCE'
  });

  var ADDRESS_FIELDS = Object.freeze([
    'street',
    'city',
    'state',
    'zip'
  ]);

  var DIFFERENCE_FIELDS = Object.freeze([
    'street',
    'city',
    'state',
    'zip'
  ]);

  function fail_(code, message) {
    return {
      ok: false,
      outcome: 'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PLAN_REJECTED',
      code: code,
      message: message
    };
  }

  function own_(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function isPlainObject_(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }

    var prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
  }

  function exactKeys_(object, expected) {
    if (!isPlainObject_(object)) {
      return false;
    }

    var actual = Object.keys(object).slice().sort();
    var allowed = expected.slice().sort();

    if (actual.length !== allowed.length) {
      return false;
    }

    return actual.every(function (key, index) {
      return key === allowed[index];
    });
  }

  function nonblank_(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function safeCellText_(value) {
    return typeof value === 'string' &&
      value !== '' &&
      !/[\u0000-\u001F\u007F]/.test(value) &&
      !/^[=+\-@]/.test(value);
  }

  function validRowNumber_(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 2;
  }

  function addressEligible_(value) {
    return exactKeys_(value, ADDRESS_FIELDS) &&
      ADDRESS_FIELDS.every(function (field) {
        return typeof value[field] === 'string';
      });
  }

  function differencesEligible_(classifierResult) {
    if (classifierResult.outcome === 'ABSENTEE_OWNER_INDICATED') {
      return own_(classifierResult, 'differingComponents') &&
        Array.isArray(classifierResult.differingComponents) &&
        classifierResult.differingComponents.length > 0 &&
        classifierResult.differingComponents.every(function (field) {
          return DIFFERENCE_FIELDS.indexOf(field) >= 0;
        });
    }

    if (classifierResult.outcome === 'OWNER_MAILING_MATCHED') {
      return own_(classifierResult, 'differingComponents') &&
        Array.isArray(classifierResult.differingComponents) &&
        classifierResult.differingComponents.length === 0;
    }

    return classifierResult.outcome === 'INSUFFICIENT_CLASSIFICATION_EVIDENCE' &&
      !own_(classifierResult, 'differingComponents');
  }

  function expectedClassifierFields_(outcome) {
    var fields = BASE_CLASSIFIER_FIELDS.slice();

    if (
      outcome === 'ABSENTEE_OWNER_INDICATED' ||
      outcome === 'OWNER_MAILING_MATCHED'
    ) {
      fields.push('differingComponents');
    }

    return fields;
  }

  function validateClassifierResult_(classifierResult) {
    if (!isPlainObject_(classifierResult)) {
      return fail_(
        'INVALID_CLASSIFIER_RESULT',
        'Classifier result must be a plain object.'
      );
    }

    if (!own_(OUTCOME_TO_UPSTREAM, classifierResult.outcome)) {
      return fail_(
        'UNPERSISTABLE_CLASSIFICATION_OUTCOME',
        'Classifier outcome is not persistence eligible.'
      );
    }

    if (
      !exactKeys_(
        classifierResult,
        expectedClassifierFields_(classifierResult.outcome)
      )
    ) {
      return fail_(
        'CLASSIFIER_RESULT_SHAPE_MISMATCH',
        'Classifier result contains missing or unknown fields.'
      );
    }

    if (
      classifierResult.ok !== true ||
      classifierResult.mode !== MODE ||
      classifierResult.phase !== PHASE ||
      classifierResult.classificationBasis !== BASIS ||
      classifierResult.upstreamComparisonOutcome !==
        OUTCOME_TO_UPSTREAM[classifierResult.outcome]
    ) {
      return fail_(
        'CLASSIFIER_RESULT_AUTHORITY_MISMATCH',
        'Classifier result does not match the certified classification contract.'
      );
    }

    if (
      !exactKeys_(
        classifierResult.target,
        [
          'rowNumber',
          'identity'
        ]
      )
    ) {
      return fail_(
        'INVALID_CLASSIFIER_TARGET',
        'Classifier target must contain exactly rowNumber and identity.'
      );
    }

    if (!validRowNumber_(classifierResult.target.rowNumber)) {
      return fail_(
        'INVALID_CLASSIFIER_ROW_NUMBER',
        'Classifier rowNumber must identify a physical data row.'
      );
    }

    if (
      !exactKeys_(
        classifierResult.target.identity,
        [
          DISTRESS_ID,
          CANONICAL_KEY
        ]
      )
    ) {
      return fail_(
        'INVALID_CLASSIFIER_IDENTITY',
        'Classifier identity must contain exact persisted dual identity.'
      );
    }

    var distressLeadId =
      classifierResult.target.identity[DISTRESS_ID];

    var canonicalPropertyKey =
      classifierResult.target.identity[CANONICAL_KEY];

    if (
      !nonblank_(distressLeadId) ||
      !nonblank_(canonicalPropertyKey) ||
      !safeCellText_(distressLeadId.trim()) ||
      !safeCellText_(canonicalPropertyKey.trim())
    ) {
      return fail_(
        'UNSAFE_CLASSIFIER_IDENTITY',
        'Classifier identity is blank or unsafe for spreadsheet persistence.'
      );
    }

    if (
      !addressEligible_(classifierResult.normalizedPropertyAddress) ||
      !addressEligible_(classifierResult.normalizedMailingAddress)
    ) {
      return fail_(
        'INVALID_NORMALIZED_ADDRESS',
        'Classifier normalized address objects do not match the certified shape.'
      );
    }

    if (!differencesEligible_(classifierResult)) {
      return fail_(
        'INVALID_DIFFERING_COMPONENTS',
        'Classifier differingComponents do not match the classification outcome.'
      );
    }

    for (
      var index = 0;
      index < AUTHORITY_FIELDS.length;
      index++
    ) {
      var field = AUTHORITY_FIELDS[index];

      if (
        !own_(classifierResult, field) ||
        classifierResult[field] !== false
      ) {
        return fail_(
          'CLASSIFIER_AUTHORITY_NOT_FALSE',
          'Classifier authority field must remain false: ' + field
        );
      }
    }

    return {
      ok: true,
      distressLeadId: distressLeadId.trim(),
      canonicalPropertyKey: canonicalPropertyKey.trim()
    };
  }

  function canonicalJson_(value) {
    var stack = [];

    function encode(current) {
      if (current === null) {
        return 'null';
      }

      var type = typeof current;

      if (type === 'string') {
        return JSON.stringify(current);
      }

      if (type === 'boolean') {
        return current
          ? 'true'
          : 'false';
      }

      if (type === 'number') {
        if (!isFinite(current)) {
          throw new Error(
            'Canonical JSON rejects non-finite numbers.'
          );
        }

        return current === 0
          ? '0'
          : String(current);
      }

      if (
        type === 'undefined' ||
        type === 'function' ||
        type === 'symbol' ||
        type === 'bigint'
      ) {
        throw new Error(
          'Canonical JSON rejects unsupported value types.'
        );
      }

      if (current instanceof Date) {
        throw new Error(
          'Canonical JSON rejects Date objects.'
        );
      }

      if (stack.indexOf(current) !== -1) {
        throw new Error(
          'Canonical JSON rejects cyclic structures.'
        );
      }

      stack.push(current);

      try {
        if (Array.isArray(current)) {
          var parts = [];

          for (
            var arrayIndex = 0;
            arrayIndex < current.length;
            arrayIndex++
          ) {
            if (!own_(current, arrayIndex)) {
              throw new Error(
                'Canonical JSON rejects sparse arrays.'
              );
            }

            parts.push(
              encode(current[arrayIndex])
            );
          }

          return '[' + parts.join(',') + ']';
        }

        if (!isPlainObject_(current)) {
          throw new Error(
            'Canonical JSON rejects non-plain objects.'
          );
        }

        if (
          typeof Object.getOwnPropertySymbols === 'function' &&
          Object.getOwnPropertySymbols(current).length !== 0
        ) {
          throw new Error(
            'Canonical JSON rejects symbol-keyed objects.'
          );
        }

        var keys =
          Object.keys(current)
            .slice()
            .sort();

        var pairs =
          keys.map(function (key) {
            return (
              JSON.stringify(key) +
              ':' +
              encode(current[key])
            );
          });

        return '{' + pairs.join(',') + '}';
      } finally {
        stack.pop();
      }
    }

    return encode(value);
  }

  function sha256HexText_(text) {
    if (
      typeof Utilities === 'undefined' ||
      !Utilities ||
      !Utilities.DigestAlgorithm ||
      !Utilities.Charset ||
      typeof Utilities.computeDigest !== 'function'
    ) {
      throw new Error(
        'Utilities SHA-256 support is unavailable.'
      );
    }

    var bytes =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        String(text),
        Utilities.Charset.UTF_8
      );

    return bytes
      .map(function (value) {
        var normalized =
          value < 0
            ? value + 256
            : value;

        return (
          '0' +
          normalized.toString(16)
        ).slice(-2);
      })
      .join('');
  }

  function hashCanonicalObject_(value) {
    return sha256HexText_(
      canonicalJson_(value)
    );
  }

  function evidenceEventIdFor_(details) {
    if (
      !exactKeys_(
        details,
        [
          'persistenceContractVersion',
          'classificationContractVersion',
          'distressLeadId',
          'canonicalPropertyKey',
          'classifierResultSha256'
        ]
      )
    ) {
      throw new Error(
        'Evidence Event ID details are invalid.'
      );
    }

    return (
      'AOCE-' +
      hashCanonicalObject_(details)
    );
  }

  function prepare(classifierResult) {
    var validated =
      validateClassifierResult_(
        classifierResult
      );

    if (!validated.ok) {
      return validated;
    }

    var classifierResultSha256;
    var propertyJson;
    var mailingJson;
    var differingJson;

    try {
      classifierResultSha256 =
        hashCanonicalObject_(
          classifierResult
        );

      propertyJson =
        canonicalJson_(
          classifierResult
            .normalizedPropertyAddress
        );

      mailingJson =
        canonicalJson_(
          classifierResult
            .normalizedMailingAddress
        );

      if (
        classifierResult.outcome ===
        'INSUFFICIENT_CLASSIFICATION_EVIDENCE'
      ) {
        differingJson = 'null';
      } else {
        differingJson =
          canonicalJson_(
            classifierResult
              .differingComponents
          );
      }
    } catch (error) {
      return fail_(
        'CANONICALIZATION_FAILED',
        String(
          error &&
          error.message ||
          error
        )
      );
    }

    var eventId;

    try {
      eventId =
        evidenceEventIdFor_({
          persistenceContractVersion:
            PERSISTENCE_CONTRACT_VERSION,

          classificationContractVersion:
            CLASSIFICATION_CONTRACT_VERSION,

          distressLeadId:
            validated.distressLeadId,

          canonicalPropertyKey:
            validated.canonicalPropertyKey,

          classifierResultSha256:
            classifierResultSha256
        });
    } catch (error) {
      return fail_(
        'EVENT_ID_DERIVATION_FAILED',
        String(
          error &&
          error.message ||
          error
        )
      );
    }

    return {
      ok: true,

      persistenceContractVersion:
        PERSISTENCE_CONTRACT_VERSION,

      classificationContractVersion:
        CLASSIFICATION_CONTRACT_VERSION,

      target: {
        rowNumber:
          classifierResult
            .target
            .rowNumber,

        identity: {
          'Distress Lead ID':
            validated.distressLeadId,

          'Canonical Property Key':
            validated
              .canonicalPropertyKey
        }
      },

      classificationOutcome:
        classifierResult.outcome,

      classificationBasis:
        BASIS,

      upstreamComparisonOutcome:
        classifierResult
          .upstreamComparisonOutcome,

      differingComponentsJson:
        differingJson,

      normalizedPropertyAddressJson:
        propertyJson,

      normalizedMailingAddressJson:
        mailingJson,

      sourceAgency:
        SOURCE_AGENCY,

      sourceDataset:
        SOURCE_DATASET,

      sourceTable:
        SOURCE_TABLE,

      sourceEndpoint:
        SOURCE_ENDPOINT,

      classifierResultSha256:
        classifierResultSha256,

      evidenceEventId:
        eventId
    };
  }

  return Object.freeze({
    prepare: prepare,
    canonicalJson: canonicalJson_,
    hashCanonicalObject:
      hashCanonicalObject_,
    evidenceEventIdFor:
      evidenceEventIdFor_
  });
})();
