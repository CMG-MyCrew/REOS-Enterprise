var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2 = (function () {
  'use strict';

  var PERSISTENCE_CONTRACT_VERSION = 2;
  var CLASSIFICATION_CONTRACT_VERSION = 1;

  var MODE = 'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION';
  var PHASE = 'absentee_owner_classification';
  var BASIS = 'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON';

  var SOURCE_AGENCY = 'Philadelphia Office of Property Assessment';
  var SOURCE_DATASET = 'Philadelphia Properties and Assessment History';
  var SOURCE_TABLE = 'opa_properties_public';
  var SOURCE_ENDPOINT = 'https://phl.carto.com/api/v2/sql';
  var LOOKUP_MODE = 'certified_opa_account';
  var CERTIFICATION_BASIS =
    'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT';

  var DISTRESS_ID = 'Distress Lead ID';
  var CANONICAL_KEY = 'Canonical Property Key';

  var INPUT_FIELDS = Object.freeze([
    'propertySourceIdentityCertification',
    'normalLookupEvidence',
    'ownerEvidenceResult',
    'comparisonResult',
    'classificationResult'
  ]);

  var V2_EVIDENCE_HEADERS = Object.freeze([
    'Evidence Event ID',
    'Observed At UTC',
    'Persistence Contract Version',
    'Classification Contract Version',
    'Distress Lead ID',
    'Canonical Property Key',
    'Physical Row Number',
    'Classification Outcome',
    'Classification Basis',
    'Upstream Comparison Outcome',
    'Differing Components JSON',
    'Normalized Property Address JSON',
    'Normalized Mailing Address JSON',
    'Source Agency',
    'Source Dataset',
    'Source Table',
    'Source Endpoint',
    'Owner Evidence Lookup Mode',
    'Certified OPA Account',
    'Property Source Identity Certification Basis',
    'Property Source Identity Certification SHA-256',
    'Normal Lookup Evidence SHA-256',
    'Owner Evidence Result SHA-256',
    'Comparison Result SHA-256',
    'Classifier Result SHA-256',
    'Previous Evidence SHA-256',
    'Evidence Event SHA-256'
  ]);

  var STORE_CONTROLLED_HEADERS = Object.freeze([
    'Observed At UTC',
    'Previous Evidence SHA-256',
    'Evidence Event SHA-256'
  ]);

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

  var OUTCOME_TO_UPSTREAM = Object.freeze({
    ABSENTEE_OWNER_INDICATED: 'MAILING_ADDRESS_DIFFERS',
    OWNER_MAILING_MATCHED: 'MAILING_ADDRESS_MATCHES',
    INSUFFICIENT_CLASSIFICATION_EVIDENCE: 'INSUFFICIENT_MAILING_EVIDENCE'
  });

  var PROPERTY_CERT_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'sourceEvidenceRetrievalAuthorityGranted',
    'ownerEvidenceRetrievalAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'classificationAuthorityGranted',
    'absenteeClassificationAuthorityGranted',
    'classificationPersistenceAuthorityGranted',
    'rolloutAuthorityGranted',
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
    'arvAuthorityGranted',
    'repairScopeAuthorityGranted',
    'maoAuthorityGranted',
    'offerAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ]);

  var NORMAL_LOOKUP_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ]);

  var OWNER_EVIDENCE_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'classificationAuthorityGranted',
    'absenteeClassificationAuthorityGranted',
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
    'arvAuthorityGranted',
    'repairScopeAuthorityGranted',
    'maoAuthorityGranted',
    'offerAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ]);

  var COMPARISON_AUTHORITY_FIELDS = Object.freeze([
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
    'absenteeClassificationAuthorityGranted',
    'canonicalIdentityRepairAuthorityGranted',
    'migrationAuthorityGranted',
    'schedulerAuthorityGranted',
    'triggerAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'certificationMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ]);

  var CLASSIFIER_AUTHORITY_FIELDS = Object.freeze([
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

  var PROPERTY_CERT_FIELDS = Object.freeze([
    'ok',
    'mode',
    'phase',
    'outcome',
    'certificationBasis',
    'target',
    'normalizedVerifiedTargetAddress',
    'persistedParcelId',
    'corroboratingSourceObservationCount',
    'corroboratingSourceObservationIds',
    'sourceParcelIdNum',
    'sourceOpaAccountNum',
    'opaParcelNumber',
    'opaLocation',
    'normalizedOpaRangeLocation',
    'targetHouseNumber',
    'rangeStart',
    'rangeEnd',
    'targetStreetSuffix',
    'opaRangeStreetSuffix',
    'streetSuffixExact',
    'targetNumberNumericallyWithinRange',
    'targetParityCompatibleWithRange',
    'propertySourceIdentityCertified',
    'rangeContainmentDiagnosticCandidate',
    'rangeContainmentCertifiedMatch'
  ].concat(PROPERTY_CERT_AUTHORITY_FIELDS));

  var NORMAL_LOOKUP_FIELDS = Object.freeze([
    'ok',
    'mode',
    'phase',
    'outcome',
    'target',
    'source',
    'boundedSourceRowCount',
    'lookupTimestamp'
  ].concat(NORMAL_LOOKUP_AUTHORITY_FIELDS));

  var OWNER_EVIDENCE_FIELDS = Object.freeze([
    'ok',
    'mode',
    'phase',
    'outcome',
    'target',
    'source',
    'boundedSourceRowCount',
    'propertySourceIdentityCertified',
    'certificationBasis',
    'certifiedOpaAccount',
    'rangeContainmentDiagnosticCandidate',
    'rangeContainmentCertifiedMatch',
    'lookupTimestamp',
    'ownerNameEvidence',
    'ownerMailingEvidence'
  ].concat(OWNER_EVIDENCE_AUTHORITY_FIELDS));

  var COMPARISON_BASE_FIELDS = Object.freeze([
    'ok',
    'mode',
    'phase',
    'outcome',
    'target',
    'source',
    'normalizedPropertyAddress',
    'normalizedMailingAddress',
    'propertySourceIdentityCertified',
    'certificationBasis',
    'certifiedOpaAccount',
    'rangeContainmentDiagnosticCandidate',
    'rangeContainmentCertifiedMatch'
  ].concat(COMPARISON_AUTHORITY_FIELDS));

  var CLASSIFIER_BASE_FIELDS = Object.freeze([
    'ok',
    'mode',
    'phase',
    'outcome',
    'target',
    'upstreamComparisonOutcome',
    'classificationBasis',
    'normalizedPropertyAddress',
    'normalizedMailingAddress'
  ].concat(CLASSIFIER_AUTHORITY_FIELDS));

  function fail_(code, message) {
    return {
      ok: false,
      outcome:
        'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLAN_REJECTED',
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
    return prototype === Object.prototype ||
      prototype === null ||
      Object.prototype.toString.call(value) === '[object Object]';
  }

  function exactKeys_(object, expected) {
    if (!isPlainObject_(object)) {
      return false;
    }

    var actual = Object.keys(object).slice().sort();
    var allowed = expected.slice().sort();

    return actual.length === allowed.length &&
      actual.every(function (key, index) {
        return key === allowed[index];
      });
  }

  function cleanString_(value) {
    return String(
      value === null || value === undefined
        ? ''
        : value
    ).trim();
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

  function validIsoTimestamp_(value) {
    if (typeof value !== 'string' || value === '') {
      return false;
    }

    try {
      return new Date(value).toISOString() === value;
    } catch (error) {
      return false;
    }
  }

  function authoritiesFalse_(object, fields) {
    if (!isPlainObject_(object)) {
      return false;
    }

    return fields.every(function (field) {
      return own_(object, field) && object[field] === false;
    });
  }

  function noTrueAuthority_(object) {
    return isPlainObject_(object) &&
      Object.keys(object).every(function (key) {
        return !/AuthorityGranted$/.test(key) || object[key] === false;
      });
  }

  function identitySummary_(identity) {
    if (!exactKeys_(identity, [DISTRESS_ID, CANONICAL_KEY])) {
      return null;
    }

    var distressLeadId = cleanString_(identity[DISTRESS_ID]);
    var canonicalPropertyKey = cleanString_(identity[CANONICAL_KEY]);

    if (
      !distressLeadId ||
      !canonicalPropertyKey ||
      !safeCellText_(distressLeadId) ||
      !safeCellText_(canonicalPropertyKey)
    ) {
      return null;
    }

    return {
      distressLeadId: distressLeadId,
      canonicalPropertyKey: canonicalPropertyKey
    };
  }

  function targetSummary_(target, withTable) {
    var expected = withTable
      ? ['table', 'rowNumber', 'identity']
      : ['rowNumber', 'identity'];

    if (!exactKeys_(target, expected) || !validRowNumber_(target.rowNumber)) {
      return null;
    }

    if (withTable && target.table !== 'DISTRESS_LEADS') {
      return null;
    }

    var identity = identitySummary_(target.identity);
    if (!identity) {
      return null;
    }

    return {
      rowNumber: target.rowNumber,
      distressLeadId: identity.distressLeadId,
      canonicalPropertyKey: identity.canonicalPropertyKey
    };
  }

  function lookupTargetSummary_(target) {
    if (
      !exactKeys_(
        target,
        [
          'rowNumber',
          'identity',
          'propertyAddress',
          'city',
          'state',
          'zip'
        ]
      ) ||
      !validRowNumber_(target.rowNumber)
    ) {
      return null;
    }

    var identity = identitySummary_(target.identity);
    if (!identity) {
      return null;
    }

    if (
      !nonblank_(target.propertyAddress) ||
      typeof target.city !== 'string' ||
      typeof target.state !== 'string' ||
      typeof target.zip !== 'string'
    ) {
      return null;
    }

    return {
      rowNumber: target.rowNumber,
      distressLeadId: identity.distressLeadId,
      canonicalPropertyKey: identity.canonicalPropertyKey,
      propertyAddress: target.propertyAddress,
      city: target.city,
      state: target.state,
      zip: target.zip
    };
  }

  function sameTarget_(left, right) {
    return left && right &&
      left.rowNumber === right.rowNumber &&
      left.distressLeadId === right.distressLeadId &&
      left.canonicalPropertyKey === right.canonicalPropertyKey;
  }

  function sourceEligible_(source, lookupMode, requireMatchedFields) {
    var fields = [
      'agency',
      'dataset',
      'table',
      'endpoint',
      'lookupQueryMode'
    ];

    if (requireMatchedFields) {
      fields = fields.concat([
        'certifiedOpaAccount',
        'parcelNumber',
        'propertyLocation'
      ]);
    }

    if (!exactKeys_(source, fields)) {
      return false;
    }

    if (
      source.agency !== SOURCE_AGENCY ||
      source.dataset !== SOURCE_DATASET ||
      source.table !== SOURCE_TABLE ||
      source.endpoint !== SOURCE_ENDPOINT ||
      source.lookupQueryMode !== lookupMode
    ) {
      return false;
    }

    if (requireMatchedFields) {
      return /^[0-9]{9}$/.test(cleanString_(source.certifiedOpaAccount)) &&
        cleanString_(source.parcelNumber) === cleanString_(source.certifiedOpaAccount) &&
        nonblank_(source.propertyLocation);
    }

    return true;
  }

  function addressEligible_(value) {
    return exactKeys_(value, ADDRESS_FIELDS) &&
      ADDRESS_FIELDS.every(function (field) {
        return typeof value[field] === 'string';
      });
  }

  function canonicalHelpers_() {
    var planner =
      REOS &&
      REOS.AbsenteeOwnerClassificationPersistencePlanner;

    if (
      !planner ||
      typeof planner.canonicalJson !== 'function' ||
      typeof planner.hashCanonicalObject !== 'function'
    ) {
      return null;
    }

    return planner;
  }

  function canonicalEqual_(helpers, left, right) {
    return helpers.canonicalJson(left) === helpers.canonicalJson(right);
  }

  function validatePropertyCertification_(artifact) {
    if (
      !exactKeys_(artifact, PROPERTY_CERT_FIELDS) ||
      !authoritiesFalse_(artifact, PROPERTY_CERT_AUTHORITY_FIELDS) ||
      !noTrueAuthority_(artifact) ||
      artifact.ok !== true ||
      artifact.mode !== 'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION' ||
      artifact.phase !==
        'absentee_owner_opa_account_range_property_source_identity_certification' ||
      artifact.outcome !== 'PROPERTY_SOURCE_IDENTITY_CERTIFIED' ||
      artifact.certificationBasis !== CERTIFICATION_BASIS ||
      artifact.propertySourceIdentityCertified !== true ||
      artifact.rangeContainmentDiagnosticCandidate !== true ||
      artifact.rangeContainmentCertifiedMatch !== false ||
      artifact.streetSuffixExact !== true ||
      artifact.targetNumberNumericallyWithinRange !== true ||
      artifact.targetParityCompatibleWithRange !== true
    ) {
      return fail_(
        'INVALID_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
        'Property-source identity certification does not match the certified contract.'
      );
    }

    var target = targetSummary_(artifact.target, true);
    if (!target) {
      return fail_(
        'INVALID_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_TARGET',
        'Property-source identity certification target is invalid.'
      );
    }

    var account = cleanString_(artifact.sourceOpaAccountNum);
    if (
      !/^[0-9]{9}$/.test(account) ||
      cleanString_(artifact.opaParcelNumber) !== account ||
      !nonblank_(artifact.opaLocation) ||
      !nonblank_(artifact.persistedParcelId) ||
      cleanString_(artifact.sourceParcelIdNum) !== cleanString_(artifact.persistedParcelId)
    ) {
      return fail_(
        'INVALID_CERTIFIED_OPA_ACCOUNT',
        'Property-source certification account or parcel binding is invalid.'
      );
    }

    if (
      typeof artifact.corroboratingSourceObservationCount !== 'number' ||
      !isFinite(artifact.corroboratingSourceObservationCount) ||
      Math.floor(artifact.corroboratingSourceObservationCount) !==
        artifact.corroboratingSourceObservationCount ||
      artifact.corroboratingSourceObservationCount < 2 ||
      artifact.corroboratingSourceObservationCount > 5 ||
      !Array.isArray(artifact.corroboratingSourceObservationIds) ||
      artifact.corroboratingSourceObservationIds.length !==
        artifact.corroboratingSourceObservationCount
    ) {
      return fail_(
        'INVALID_PROPERTY_SOURCE_CORROBORATION',
        'Property-source certification corroboration is invalid.'
      );
    }

    var seen = {};
    for (
      var index = 0;
      index < artifact.corroboratingSourceObservationIds.length;
      index++
    ) {
      var observationId =
        cleanString_(artifact.corroboratingSourceObservationIds[index]);

      if (!observationId || own_(seen, observationId)) {
        return fail_(
          'INVALID_PROPERTY_SOURCE_CORROBORATION',
          'Property-source observation identities are blank or duplicated.'
        );
      }

      seen[observationId] = true;
    }

    return {
      ok: true,
      target: target,
      account: account
    };
  }

  function validateNormalLookup_(artifact) {
    if (
      !exactKeys_(artifact, NORMAL_LOOKUP_FIELDS) ||
      !authoritiesFalse_(artifact, NORMAL_LOOKUP_AUTHORITY_FIELDS) ||
      !noTrueAuthority_(artifact) ||
      artifact.ok !== true ||
      artifact.mode !== 'READ_ONLY_OWNER_EVIDENCE' ||
      artifact.phase !== 'absentee_owner_philadelphia_owner_evidence_lookup' ||
      artifact.outcome !== 'NO_MATCH' ||
      artifact.boundedSourceRowCount !== 0 ||
      !validIsoTimestamp_(artifact.lookupTimestamp) ||
      !sourceEligible_(artifact.source, 'exact_property_address', false)
    ) {
      return fail_(
        'INVALID_NORMAL_LOOKUP_EVIDENCE',
        'Normal exact-address owner lookup evidence is not eligible.'
      );
    }

    var target = lookupTargetSummary_(artifact.target);
    if (!target) {
      return fail_(
        'INVALID_NORMAL_LOOKUP_TARGET',
        'Normal lookup target is invalid.'
      );
    }

    return {
      ok: true,
      target: target
    };
  }

  function validateOwnerEvidence_(artifact) {
    if (
      !exactKeys_(artifact, OWNER_EVIDENCE_FIELDS) ||
      !authoritiesFalse_(artifact, OWNER_EVIDENCE_AUTHORITY_FIELDS) ||
      !noTrueAuthority_(artifact) ||
      artifact.ok !== true ||
      artifact.mode !== 'READ_ONLY_OWNER_EVIDENCE' ||
      artifact.phase !==
        'absentee_owner_certified_property_source_identity_owner_evidence_lookup' ||
      artifact.outcome !== 'MATCHED' ||
      artifact.boundedSourceRowCount !== 1 ||
      artifact.propertySourceIdentityCertified !== true ||
      artifact.certificationBasis !== CERTIFICATION_BASIS ||
      artifact.rangeContainmentDiagnosticCandidate !== true ||
      artifact.rangeContainmentCertifiedMatch !== false ||
      !validIsoTimestamp_(artifact.lookupTimestamp) ||
      !sourceEligible_(artifact.source, LOOKUP_MODE, true)
    ) {
      return fail_(
        'INVALID_CERTIFIED_OWNER_EVIDENCE',
        'Certified-account owner evidence is not eligible.'
      );
    }

    var target = lookupTargetSummary_(artifact.target);
    if (!target) {
      return fail_(
        'INVALID_CERTIFIED_OWNER_EVIDENCE_TARGET',
        'Certified-account owner-evidence target is invalid.'
      );
    }

    var account = cleanString_(artifact.certifiedOpaAccount);
    if (
      !/^[0-9]{9}$/.test(account) ||
      cleanString_(artifact.source.certifiedOpaAccount) !== account ||
      cleanString_(artifact.source.parcelNumber) !== account
    ) {
      return fail_(
        'CERTIFIED_OPA_ACCOUNT_MISMATCH',
        'Certified-account owner evidence does not preserve the certified OPA account.'
      );
    }

    if (
      !exactKeys_(artifact.ownerNameEvidence, ['owner_1', 'owner_2']) ||
      !exactKeys_(
        artifact.ownerMailingEvidence,
        [
          'mailing_address_1',
          'mailing_address_2',
          'mailing_care_of',
          'mailing_city_state',
          'mailing_street',
          'mailing_zip'
        ]
      )
    ) {
      return fail_(
        'INVALID_CERTIFIED_OWNER_EVIDENCE_SHAPE',
        'Certified-account owner evidence contains unexpected nested evidence fields.'
      );
    }

    return {
      ok: true,
      target: target,
      account: account
    };
  }

  function comparisonFieldsFor_(outcome) {
    var fields = COMPARISON_BASE_FIELDS.slice();

    if (
      outcome === 'MAILING_ADDRESS_DIFFERS' ||
      outcome === 'MAILING_ADDRESS_MATCHES'
    ) {
      fields.push('differingComponents');
    }

    return fields;
  }

  function validateDifferences_(outcome, artifact) {
    if (outcome === 'MAILING_ADDRESS_DIFFERS') {
      return Array.isArray(artifact.differingComponents) &&
        artifact.differingComponents.length > 0 &&
        artifact.differingComponents.every(function (field, index, values) {
          return DIFFERENCE_FIELDS.indexOf(field) >= 0 &&
            values.indexOf(field) === index;
        });
    }

    if (outcome === 'MAILING_ADDRESS_MATCHES') {
      return Array.isArray(artifact.differingComponents) &&
        artifact.differingComponents.length === 0;
    }

    return outcome === 'INSUFFICIENT_MAILING_EVIDENCE' &&
      !own_(artifact, 'differingComponents');
  }

  function validateComparison_(artifact) {
    if (
      !isPlainObject_(artifact) ||
      [
        'MAILING_ADDRESS_DIFFERS',
        'MAILING_ADDRESS_MATCHES',
        'INSUFFICIENT_MAILING_EVIDENCE'
      ].indexOf(artifact.outcome) < 0 ||
      !exactKeys_(artifact, comparisonFieldsFor_(artifact.outcome)) ||
      !authoritiesFalse_(artifact, COMPARISON_AUTHORITY_FIELDS) ||
      !noTrueAuthority_(artifact) ||
      artifact.ok !== true ||
      artifact.mode !== 'READ_ONLY_OWNER_EVIDENCE_COMPARISON' ||
      artifact.phase !== 'absentee_owner_owner_evidence_comparison' ||
      artifact.propertySourceIdentityCertified !== true ||
      artifact.certificationBasis !== CERTIFICATION_BASIS ||
      artifact.rangeContainmentDiagnosticCandidate !== true ||
      artifact.rangeContainmentCertifiedMatch !== false ||
      !sourceEligible_(artifact.source, LOOKUP_MODE, true) ||
      !addressEligible_(artifact.normalizedPropertyAddress) ||
      !addressEligible_(artifact.normalizedMailingAddress) ||
      !validateDifferences_(artifact.outcome, artifact)
    ) {
      return fail_(
        'INVALID_COMPARISON_RESULT',
        'Owner-evidence comparison result does not match the certified contract.'
      );
    }

    var target = targetSummary_(artifact.target, false);
    var account = cleanString_(artifact.certifiedOpaAccount);

    if (
      !target ||
      !/^[0-9]{9}$/.test(account) ||
      cleanString_(artifact.source.certifiedOpaAccount) !== account ||
      cleanString_(artifact.source.parcelNumber) !== account
    ) {
      return fail_(
        'INVALID_COMPARISON_LINKAGE',
        'Comparison target or certified account is invalid.'
      );
    }

    return {
      ok: true,
      target: target,
      account: account
    };
  }

  function classifierFieldsFor_(outcome) {
    var fields = CLASSIFIER_BASE_FIELDS.slice();

    if (
      outcome === 'ABSENTEE_OWNER_INDICATED' ||
      outcome === 'OWNER_MAILING_MATCHED'
    ) {
      fields.push('differingComponents');
    }

    return fields;
  }

  function validateClassifier_(artifact) {
    if (
      !isPlainObject_(artifact) ||
      !own_(OUTCOME_TO_UPSTREAM, artifact.outcome) ||
      !exactKeys_(artifact, classifierFieldsFor_(artifact.outcome)) ||
      !authoritiesFalse_(artifact, CLASSIFIER_AUTHORITY_FIELDS) ||
      !noTrueAuthority_(artifact) ||
      artifact.ok !== true ||
      artifact.mode !== MODE ||
      artifact.phase !== PHASE ||
      artifact.classificationBasis !== BASIS ||
      artifact.upstreamComparisonOutcome !== OUTCOME_TO_UPSTREAM[artifact.outcome] ||
      !addressEligible_(artifact.normalizedPropertyAddress) ||
      !addressEligible_(artifact.normalizedMailingAddress)
    ) {
      return fail_(
        'INVALID_CLASSIFICATION_RESULT',
        'Classification result does not match the certified classification contract.'
      );
    }

    var target = targetSummary_(artifact.target, false);
    if (!target) {
      return fail_(
        'INVALID_CLASSIFICATION_TARGET',
        'Classification target is invalid.'
      );
    }

    if (artifact.outcome === 'ABSENTEE_OWNER_INDICATED') {
      if (
        !Array.isArray(artifact.differingComponents) ||
        artifact.differingComponents.length === 0 ||
        artifact.differingComponents.some(function (field, index, values) {
          return DIFFERENCE_FIELDS.indexOf(field) < 0 ||
            values.indexOf(field) !== index;
        })
      ) {
        return fail_(
          'INVALID_CLASSIFICATION_DIFFERENCES',
          'Classification differing components are invalid.'
        );
      }
    } else if (artifact.outcome === 'OWNER_MAILING_MATCHED') {
      if (
        !Array.isArray(artifact.differingComponents) ||
        artifact.differingComponents.length !== 0
      ) {
        return fail_(
          'INVALID_CLASSIFICATION_DIFFERENCES',
          'Matched classification must contain an empty differing-components array.'
        );
      }
    } else if (own_(artifact, 'differingComponents')) {
      return fail_(
        'INVALID_CLASSIFICATION_DIFFERENCES',
        'Insufficient classification must omit differingComponents.'
      );
    }

    return {
      ok: true,
      target: target
    };
  }

  function eventIdFor_(helpers, details) {
    if (
      !exactKeys_(
        details,
        [
          'persistenceContractVersion',
          'classificationContractVersion',
          'distressLeadId',
          'canonicalPropertyKey',
          'certifiedOpaAccount',
          'propertySourceIdentityCertificationSha256',
          'normalLookupEvidenceSha256',
          'ownerEvidenceResultSha256',
          'comparisonResultSha256',
          'classifierResultSha256'
        ]
      )
    ) {
      throw new Error('Evidence Event ID details are invalid.');
    }

    return 'AOCE2-' + helpers.hashCanonicalObject(details);
  }

  function prepare(bundle) {
    var helpers = canonicalHelpers_();

    if (!helpers) {
      return fail_(
        'CANONICAL_HELPERS_UNAVAILABLE',
        'Certified v1 canonical JSON helpers are unavailable.'
      );
    }

    if (!exactKeys_(bundle, INPUT_FIELDS)) {
      return fail_(
        'INVALID_EVIDENCE_BUNDLE',
        'Evidence bundle must contain exactly the five certified input artifacts.'
      );
    }

    var certification =
      validatePropertyCertification_(bundle.propertySourceIdentityCertification);
    if (!certification.ok) {
      return certification;
    }

    var normal = validateNormalLookup_(bundle.normalLookupEvidence);
    if (!normal.ok) {
      return normal;
    }

    var owner = validateOwnerEvidence_(bundle.ownerEvidenceResult);
    if (!owner.ok) {
      return owner;
    }

    var comparison = validateComparison_(bundle.comparisonResult);
    if (!comparison.ok) {
      return comparison;
    }

    var classifier = validateClassifier_(bundle.classificationResult);
    if (!classifier.ok) {
      return classifier;
    }

    if (
      !sameTarget_(certification.target, normal.target) ||
      !sameTarget_(certification.target, owner.target) ||
      !sameTarget_(certification.target, comparison.target) ||
      !sameTarget_(certification.target, classifier.target)
    ) {
      return fail_(
        'TARGET_IDENTITY_MISMATCH',
        'All five certified artifacts must agree on target row and dual identity.'
      );
    }

    if (
      certification.account !== owner.account ||
      certification.account !== comparison.account
    ) {
      return fail_(
        'CERTIFIED_OPA_ACCOUNT_MISMATCH',
        'Certified OPA account must agree across certification, owner evidence, and comparison.'
      );
    }

    if (
      !canonicalEqual_(helpers, bundle.ownerEvidenceResult.target, bundle.normalLookupEvidence.target) ||
      !canonicalEqual_(helpers, bundle.ownerEvidenceResult.source, bundle.comparisonResult.source) ||
      bundle.ownerEvidenceResult.certificationBasis !==
        bundle.comparisonResult.certificationBasis ||
      bundle.ownerEvidenceResult.certificationBasis !== CERTIFICATION_BASIS
    ) {
      return fail_(
        'UPSTREAM_EVIDENCE_LINKAGE_MISMATCH',
        'Certified owner evidence and comparison provenance do not agree.'
      );
    }

    if (
      bundle.classificationResult.upstreamComparisonOutcome !==
        bundle.comparisonResult.outcome ||
      !canonicalEqual_(
        helpers,
        bundle.classificationResult.normalizedPropertyAddress,
        bundle.comparisonResult.normalizedPropertyAddress
      ) ||
      !canonicalEqual_(
        helpers,
        bundle.classificationResult.normalizedMailingAddress,
        bundle.comparisonResult.normalizedMailingAddress
      )
    ) {
      return fail_(
        'COMPARISON_CLASSIFICATION_LINKAGE_MISMATCH',
        'Comparison and classification normalized evidence do not agree.'
      );
    }

    var comparisonHasDifferences =
      own_(bundle.comparisonResult, 'differingComponents');
    var classifierHasDifferences =
      own_(bundle.classificationResult, 'differingComponents');

    if (
      comparisonHasDifferences !== classifierHasDifferences ||
      (
        comparisonHasDifferences &&
        !canonicalEqual_(
          helpers,
          bundle.comparisonResult.differingComponents,
          bundle.classificationResult.differingComponents
        )
      )
    ) {
      return fail_(
        'DIFFERING_COMPONENTS_MISMATCH',
        'Comparison and classification differing components do not agree.'
      );
    }

    var propertySourceIdentityCertificationSha256;
    var normalLookupEvidenceSha256;
    var ownerEvidenceResultSha256;
    var comparisonResultSha256;
    var classifierResultSha256;
    var propertyJson;
    var mailingJson;
    var differingJson;

    try {
      propertySourceIdentityCertificationSha256 =
        helpers.hashCanonicalObject(bundle.propertySourceIdentityCertification);
      normalLookupEvidenceSha256 =
        helpers.hashCanonicalObject(bundle.normalLookupEvidence);
      ownerEvidenceResultSha256 =
        helpers.hashCanonicalObject(bundle.ownerEvidenceResult);
      comparisonResultSha256 =
        helpers.hashCanonicalObject(bundle.comparisonResult);
      classifierResultSha256 =
        helpers.hashCanonicalObject(bundle.classificationResult);

      propertyJson =
        helpers.canonicalJson(bundle.classificationResult.normalizedPropertyAddress);
      mailingJson =
        helpers.canonicalJson(bundle.classificationResult.normalizedMailingAddress);

      differingJson = classifierHasDifferences
        ? helpers.canonicalJson(bundle.classificationResult.differingComponents)
        : 'null';
    } catch (error) {
      return fail_(
        'CANONICALIZATION_FAILED',
        String(error && error.message || error)
      );
    }

    var eventId;

    try {
      eventId = eventIdFor_(helpers, {
        persistenceContractVersion: PERSISTENCE_CONTRACT_VERSION,
        classificationContractVersion: CLASSIFICATION_CONTRACT_VERSION,
        distressLeadId: certification.target.distressLeadId,
        canonicalPropertyKey: certification.target.canonicalPropertyKey,
        certifiedOpaAccount: certification.account,
        propertySourceIdentityCertificationSha256:
          propertySourceIdentityCertificationSha256,
        normalLookupEvidenceSha256: normalLookupEvidenceSha256,
        ownerEvidenceResultSha256: ownerEvidenceResultSha256,
        comparisonResultSha256: comparisonResultSha256,
        classifierResultSha256: classifierResultSha256
      });
    } catch (error) {
      return fail_(
        'EVENT_ID_DERIVATION_FAILED',
        String(error && error.message || error)
      );
    }

    return {
      ok: true,
      persistenceContractVersion: PERSISTENCE_CONTRACT_VERSION,
      classificationContractVersion: CLASSIFICATION_CONTRACT_VERSION,
      target: {
        rowNumber: certification.target.rowNumber,
        identity: {
          'Distress Lead ID': certification.target.distressLeadId,
          'Canonical Property Key': certification.target.canonicalPropertyKey
        }
      },
      classificationOutcome: bundle.classificationResult.outcome,
      classificationBasis: BASIS,
      upstreamComparisonOutcome: bundle.comparisonResult.outcome,
      differingComponentsJson: differingJson,
      normalizedPropertyAddressJson: propertyJson,
      normalizedMailingAddressJson: mailingJson,
      sourceAgency: SOURCE_AGENCY,
      sourceDataset: SOURCE_DATASET,
      sourceTable: SOURCE_TABLE,
      sourceEndpoint: SOURCE_ENDPOINT,
      ownerEvidenceLookupMode: LOOKUP_MODE,
      certifiedOpaAccount: certification.account,
      propertySourceIdentityCertificationBasis: CERTIFICATION_BASIS,
      propertySourceIdentityCertificationSha256:
        propertySourceIdentityCertificationSha256,
      normalLookupEvidenceSha256: normalLookupEvidenceSha256,
      ownerEvidenceResultSha256: ownerEvidenceResultSha256,
      comparisonResultSha256: comparisonResultSha256,
      classifierResultSha256: classifierResultSha256,
      evidenceEventId: eventId
    };
  }

  return Object.freeze({
    prepare: prepare
  });
})();
