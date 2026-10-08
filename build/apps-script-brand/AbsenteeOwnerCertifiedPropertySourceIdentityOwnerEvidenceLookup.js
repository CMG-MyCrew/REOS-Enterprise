var REOS = REOS || {};

REOS.AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup = (function () {
  'use strict';

  var SOURCE_AGENCY =
    'Philadelphia Office of Property Assessment';

  var SOURCE_DATASET =
    'Philadelphia Properties and Assessment History';

  var SOURCE_TABLE =
    'opa_properties_public';

  var SOURCE_ENDPOINT =
    'https://phl.carto.com/api/v2/sql';

  var MODE =
    'READ_ONLY_OWNER_EVIDENCE';

  var PHASE =
    'absentee_owner_certified_property_source_identity_owner_evidence_lookup';

  var LOOKUP_MODE =
    'certified_opa_account';

  var CERTIFICATION_MODE =
    'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION';

  var CERTIFICATION_PHASE =
    'absentee_owner_opa_account_range_property_source_identity_certification';

  var CERTIFICATION_OUTCOME =
    'PROPERTY_SOURCE_IDENTITY_CERTIFIED';

  var CERTIFICATION_BASIS =
    'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT';

  var NORMAL_LOOKUP_MODE =
    'READ_ONLY_OWNER_EVIDENCE';

  var NORMAL_LOOKUP_PHASE =
    'absentee_owner_philadelphia_owner_evidence_lookup';

  var NORMAL_LOOKUP_MODE_NAME =
    'exact_property_address';

  var MAX_SOURCE_ROWS = 2;

  var DISTRESS_ID =
    'Distress Lead ID';

  var CANONICAL_KEY =
    'Canonical Property Key';

  var SOURCE_FIELDS = Object.freeze([
    'parcel_number',
    'location',
    'owner_1',
    'owner_2',
    'mailing_address_1',
    'mailing_address_2',
    'mailing_care_of',
    'mailing_city_state',
    'mailing_street',
    'mailing_zip'
  ]);

  var OWNER_FIELDS = Object.freeze([
    'owner_1',
    'owner_2'
  ]);

  var MAILING_FIELDS = Object.freeze([
    'mailing_address_1',
    'mailing_address_2',
    'mailing_care_of',
    'mailing_city_state',
    'mailing_street',
    'mailing_zip'
  ]);

  var CERTIFICATION_AUTHORITY_FIELDS = Object.freeze([
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

  function authority_() {
    return {
      productionDataMutationAuthorityGranted: false,
      ownerEvidencePersistenceAuthorityGranted: false,
      classificationAuthorityGranted: false,
      absenteeClassificationAuthorityGranted: false,
      classificationPersistenceAuthorityGranted: false,
      canonicalIdentityRepairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      triggerAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      certificationMutationAuthorityGranted: false,
      ownerOccupancyAuthorityGranted: false,
      vacancyAuthorityGranted: false,
      qualifiedDealQueueAuthorityGranted: false,
      acquisitionLifecycleAuthorityGranted: false,
      arvAuthorityGranted: false,
      repairScopeAuthorityGranted: false,
      maoAuthorityGranted: false,
      offerAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function attachAuthority_(result) {
    var authority = authority_();

    Object.keys(authority).forEach(function (key) {
      result[key] = authority[key];
    });

    return result;
  }

  function fail_(code, message) {
    return attachAuthority_({
      ok: false,
      mode: MODE,
      phase: PHASE,
      outcome: 'FAILED',
      code: code,
      message: message
    });
  }

  function isPlainObject_(value) {
    return !!value &&
      typeof value === 'object' &&
      !Array.isArray(value);
  }

  function own_(object, key) {
    return Object.prototype.hasOwnProperty.call(
      object,
      key
    );
  }

  function exactKeys_(object, expected) {
    var actual =
      Object.keys(object).slice().sort();

    var allowed =
      expected.slice().sort();

    if (actual.length !== allowed.length) {
      return false;
    }

    return actual.every(function (key, index) {
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

  function normalizeAddress_(value) {
    return cleanString_(value)
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function validRowNumber_(value) {
    return typeof value === 'number' &&
      isFinite(value) &&
      Math.floor(value) === value &&
      value >= 2;
  }

  function authoritiesFalse_(
    evidence,
    fields
  ) {
    return fields.every(function (field) {
      return own_(evidence, field) &&
        evidence[field] === false;
    });
  }

  function identitySummary_(identity) {
    if (!isPlainObject_(identity)) {
      return null;
    }

    var distressLeadId =
      cleanString_(identity[DISTRESS_ID]);

    var canonicalPropertyKey =
      cleanString_(identity[CANONICAL_KEY]);

    if (
      !distressLeadId ||
      !canonicalPropertyKey
    ) {
      return null;
    }

    return {
      distressLeadId: distressLeadId,
      canonicalPropertyKey:
        canonicalPropertyKey
    };
  }

  function certificationSummary_(evidence) {
    if (
      !isPlainObject_(evidence) ||
      evidence.ok !== true ||
      evidence.mode !== CERTIFICATION_MODE ||
      evidence.phase !== CERTIFICATION_PHASE ||
      evidence.outcome !== CERTIFICATION_OUTCOME ||
      evidence.certificationBasis !==
        CERTIFICATION_BASIS ||
      evidence.propertySourceIdentityCertified !== true ||
      evidence.rangeContainmentDiagnosticCandidate !== true ||
      evidence.rangeContainmentCertifiedMatch !== false ||
      !authoritiesFalse_(
        evidence,
        CERTIFICATION_AUTHORITY_FIELDS
      )
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
          'Property-source identity certification is not eligible.'
        )
      };
    }

    if (
      !isPlainObject_(evidence.target) ||
      evidence.target.table !== 'DISTRESS_LEADS' ||
      !validRowNumber_(
        evidence.target.rowNumber
      )
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
          'Certified target envelope is invalid.'
        )
      };
    }

    var identity =
      identitySummary_(
        evidence.target.identity
      );

    if (!identity) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
          'Certified target dual identity is invalid.'
        )
      };
    }

    var normalizedAddress =
      normalizeAddress_(
        evidence.normalizedVerifiedTargetAddress
      );

    var persistedParcelId =
      cleanString_(
        evidence.persistedParcelId
      );

    var sourceParcelIdNum =
      cleanString_(
        evidence.sourceParcelIdNum
      );

    var account =
      cleanString_(
        evidence.sourceOpaAccountNum
      );

    var opaParcelNumber =
      cleanString_(
        evidence.opaParcelNumber
      );

    var opaLocation =
      cleanString_(
        evidence.opaLocation
      );

    if (!normalizedAddress) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
          'Certified target address is blank.'
        )
      };
    }

    if (
      !persistedParcelId ||
      !sourceParcelIdNum ||
      persistedParcelId !== sourceParcelIdNum
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
          'Certified parcel binding is invalid.'
        )
      };
    }

    if (!/^[0-9]{9}$/.test(account)) {
      return {
        ok: false,
        result: fail_(
          'INVALID_CERTIFIED_OPA_ACCOUNT',
          'Certified OPA account must contain exactly nine digits.'
        )
      };
    }

    if (
      opaParcelNumber !== account ||
      !opaLocation
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
          'Certified OPA row provenance is invalid.'
        )
      };
    }

    return {
      ok: true,
      rowNumber:
        evidence.target.rowNumber,
      distressLeadId:
        identity.distressLeadId,
      canonicalPropertyKey:
        identity.canonicalPropertyKey,
      normalizedAddress:
        normalizedAddress,
      persistedParcelId:
        persistedParcelId,
      account:
        account,
      opaLocation:
        opaLocation
    };
  }

  function normalLookupSummary_(
    evidence,
    certification
  ) {
    if (
      !isPlainObject_(evidence) ||
      evidence.ok !== true ||
      evidence.mode !== NORMAL_LOOKUP_MODE ||
      evidence.phase !== NORMAL_LOOKUP_PHASE ||
      evidence.outcome !== 'NO_MATCH' ||
      evidence.boundedSourceRowCount !== 0 ||
      !authoritiesFalse_(
        evidence,
        NORMAL_LOOKUP_AUTHORITY_FIELDS
      )
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE',
          'Normal exact-address owner lookup evidence is not eligible.'
        )
      };
    }

    if (
      !isPlainObject_(evidence.source) ||
      evidence.source.agency !== SOURCE_AGENCY ||
      evidence.source.dataset !== SOURCE_DATASET ||
      evidence.source.table !== SOURCE_TABLE ||
      evidence.source.endpoint !== SOURCE_ENDPOINT ||
      evidence.source.lookupQueryMode !==
        NORMAL_LOOKUP_MODE_NAME
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE',
          'Normal lookup source provenance is invalid.'
        )
      };
    }

    if (
      !isPlainObject_(evidence.target) ||
      !validRowNumber_(
        evidence.target.rowNumber
      )
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE',
          'Normal lookup target envelope is invalid.'
        )
      };
    }

    var identity =
      identitySummary_(
        evidence.target.identity
      );

    if (!identity) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE',
          'Normal lookup target identity is invalid.'
        )
      };
    }

    if (
      evidence.target.rowNumber !==
        certification.rowNumber ||
      identity.distressLeadId !==
        certification.distressLeadId ||
      identity.canonicalPropertyKey !==
        certification.canonicalPropertyKey
    ) {
      return {
        ok: false,
        result: fail_(
          'TARGET_IDENTITY_MISMATCH',
          'Normal lookup target identity does not match certified target identity.'
        )
      };
    }

    var propertyAddress =
      cleanString_(
        evidence.target.propertyAddress
      );

    var normalizedAddress =
      normalizeAddress_(
        propertyAddress
      );

    if (
      !propertyAddress ||
      normalizedAddress !==
        certification.normalizedAddress
    ) {
      return {
        ok: false,
        result: fail_(
          'TARGET_ADDRESS_MISMATCH',
          'Normal lookup address does not match certified target address.'
        )
      };
    }

    var city =
      cleanString_(
        evidence.target.city
      ).toUpperCase();

    var state =
      cleanString_(
        evidence.target.state
      ).toUpperCase();

    if (
      city !== 'PHILADELPHIA' ||
      state !== 'PA' ||
      !own_(evidence.target, 'zip')
    ) {
      return {
        ok: false,
        result: fail_(
          'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE',
          'Normal lookup target geography is invalid.'
        )
      };
    }

    return {
      ok: true,
      rowNumber:
        evidence.target.rowNumber,
      identity: {
        'Distress Lead ID':
          identity.distressLeadId,
        'Canonical Property Key':
          identity.canonicalPropertyKey
      },
      propertyAddress:
        propertyAddress,
      city: city,
      state: state,
      zip:
        cleanString_(
          evidence.target.zip
        )
    };
  }

  function validateInput_(options) {
    if (
      !isPlainObject_(options) ||
      !exactKeys_(
        options,
        [
          'propertySourceIdentityCertification',
          'normalLookupEvidence'
        ]
      )
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_OPTIONS',
          'Only propertySourceIdentityCertification and normalLookupEvidence are permitted.'
        )
      };
    }

    var certification =
      certificationSummary_(
        options
          .propertySourceIdentityCertification
      );

    if (!certification.ok) {
      return certification;
    }

    var normal =
      normalLookupSummary_(
        options.normalLookupEvidence,
        certification
      );

    if (!normal.ok) {
      return normal;
    }

    return {
      ok: true,
      certification:
        certification,
      target:
        normal
    };
  }

  function escapeSqlLiteral_(value) {
    return String(value)
      .replace(/'/g, "''");
  }

  function buildQuery_(account) {
    return (
      'SELECT ' +
      SOURCE_FIELDS.join(',') +
      ' FROM ' +
      SOURCE_TABLE +
      " WHERE parcel_number = '" +
      escapeSqlLiteral_(account) +
      "' LIMIT " +
      MAX_SOURCE_ROWS
    );
  }

  function buildUrl_(query) {
    return (
      SOURCE_ENDPOINT +
      '?q=' +
      encodeURIComponent(query) +
      '&format=json'
    );
  }

  function sourceBase_(account) {
    return {
      agency: SOURCE_AGENCY,
      dataset: SOURCE_DATASET,
      table: SOURCE_TABLE,
      endpoint: SOURCE_ENDPOINT,
      lookupQueryMode: LOOKUP_MODE,
      certifiedOpaAccount: account
    };
  }

  function resultBase_(
    validated,
    outcome,
    sourceRowCount
  ) {
    return attachAuthority_({
      ok: true,
      mode: MODE,
      phase: PHASE,
      outcome: outcome,
      target: {
        rowNumber:
          validated.target.rowNumber,
        identity: {
          'Distress Lead ID':
            validated
              .target
              .identity[DISTRESS_ID],
          'Canonical Property Key':
            validated
              .target
              .identity[CANONICAL_KEY]
        },
        propertyAddress:
          validated.target.propertyAddress,
        city:
          validated.target.city,
        state:
          validated.target.state,
        zip:
          validated.target.zip
      },
      source:
        sourceBase_(
          validated
            .certification
            .account
        ),
      boundedSourceRowCount:
        sourceRowCount,
      propertySourceIdentityCertified:
        true,
      certificationBasis:
        CERTIFICATION_BASIS,
      certifiedOpaAccount:
        validated
          .certification
          .account,
      rangeContainmentDiagnosticCandidate:
        true,
      rangeContainmentCertifiedMatch:
        false,
      lookupTimestamp:
        new Date().toISOString()
    });
  }

  function validatePayload_(
    payload,
    account
  ) {
    if (!isPlainObject_(payload)) {
      return {
        ok: false,
        result: fail_(
          'INVALID_SOURCE_RESPONSE',
          'OPA source response must be an object.'
        )
      };
    }

    if (own_(payload, 'error')) {
      return {
        ok: false,
        result: fail_(
          'SOURCE_ERROR',
          'OPA source returned an error.'
        )
      };
    }

    if (
      !Array.isArray(payload.rows) ||
      !isPlainObject_(payload.fields)
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_SOURCE_RESPONSE',
          'OPA source rows or fields are invalid.'
        )
      };
    }

    var actualFields =
      Object.keys(
        payload.fields
      ).slice().sort();

    var expectedFields =
      SOURCE_FIELDS
        .slice()
        .sort();

    if (
      actualFields.length !==
        expectedFields.length ||
      actualFields.some(
        function (field, index) {
          return field !==
            expectedFields[index];
        }
      )
    ) {
      return {
        ok: false,
        result: fail_(
          'SOURCE_SCHEMA_DRIFT',
          'OPA source field projection differs from the certified contract.'
        )
      };
    }

    if (
      payload.rows.length >
        MAX_SOURCE_ROWS
    ) {
      return {
        ok: false,
        result: fail_(
          'SOURCE_RESULT_BOUND_EXCEEDED',
          'OPA source returned more than two bounded rows.'
        )
      };
    }

    for (
      var rowIndex = 0;
      rowIndex < payload.rows.length;
      rowIndex++
    ) {
      var row =
        payload.rows[rowIndex];

      if (!isPlainObject_(row)) {
        return {
          ok: false,
          result: fail_(
            'INVALID_SOURCE_ROW',
            'OPA source row must be an object.'
          )
        };
      }

      for (
        var fieldIndex = 0;
        fieldIndex < SOURCE_FIELDS.length;
        fieldIndex++
      ) {
        var field =
          SOURCE_FIELDS[fieldIndex];

        if (!own_(row, field)) {
          return {
            ok: false,
            result: fail_(
              'SOURCE_ROW_FIELD_MISSING',
              'OPA source row is missing a projected field.'
            )
          };
        }

        if (
          row[field] !== null &&
          typeof row[field] !== 'string'
        ) {
          return {
            ok: false,
            result: fail_(
              'SOURCE_ROW_FIELD_TYPE_INVALID',
              'OPA source row contains an invalid projected field type.'
            )
          };
        }
      }

      if (
        cleanString_(
          row.parcel_number
        ) !== account
      ) {
        return {
          ok: false,
          result: fail_(
            'OPA_ACCOUNT_IDENTIFIER_MISMATCH',
            'Returned OPA row does not match the certified OPA account.'
          )
        };
      }
    }

    return {
      ok: true,
      rows: payload.rows
    };
  }

  function evidenceObject_(
    row,
    fields
  ) {
    var result = {};

    fields.forEach(function (field) {
      result[field] = row[field];
    });

    return result;
  }

  function lookup(options) {
    REOS.Security.requireAdmin();

    var validated =
      validateInput_(options);

    if (!validated.ok) {
      return validated.result;
    }

    var account =
      validated
        .certification
        .account;

    var query =
      buildQuery_(account);

    var response;

    try {
      response =
        UrlFetchApp.fetch(
          buildUrl_(query),
          {
            method: 'get',
            headers: {
              Accept: 'application/json'
            },
            muteHttpExceptions: true,
            followRedirects: true
          }
        );
    } catch (error) {
      return fail_(
        'HTTP_REQUEST_FAILED',
        'OPA source request failed.'
      );
    }

    if (
      response.getResponseCode() !== 200
    ) {
      return fail_(
        'HTTP_STATUS_NOT_OK',
        'OPA source returned a non-200 HTTP status.'
      );
    }

    var payload;

    try {
      payload =
        JSON.parse(
          response.getContentText()
        );
    } catch (error) {
      return fail_(
        'INVALID_SOURCE_JSON',
        'OPA source response was not valid JSON.'
      );
    }

    var source =
      validatePayload_(
        payload,
        account
      );

    if (!source.ok) {
      return source.result;
    }

    if (source.rows.length === 0) {
      return resultBase_(
        validated,
        'NO_MATCH',
        0
      );
    }

    if (source.rows.length !== 1) {
      return resultBase_(
        validated,
        'AMBIGUOUS',
        source.rows.length
      );
    }

    var row =
      source.rows[0];

    var result =
      resultBase_(
        validated,
        'MATCHED',
        1
      );

    result.source = {
      agency: SOURCE_AGENCY,
      dataset: SOURCE_DATASET,
      table: SOURCE_TABLE,
      endpoint: SOURCE_ENDPOINT,
      lookupQueryMode: LOOKUP_MODE,
      certifiedOpaAccount:
        account,
      parcelNumber:
        row.parcel_number,
      propertyLocation:
        row.location
    };

    result.ownerNameEvidence =
      evidenceObject_(
        row,
        OWNER_FIELDS
      );

    result.ownerMailingEvidence =
      evidenceObject_(
        row,
        MAILING_FIELDS
      );

    return result;
  }

  return Object.freeze({
    lookup: lookup
  });
})();
