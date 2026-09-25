var REOS = REOS || {};

REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup = (function () {
  'use strict';

  var SOURCE_AGENCY =
    'Philadelphia Office of Property Assessment';

  var SOURCE_DATASET =
    'Philadelphia Properties and Assessment History';

  var SOURCE_TABLE =
    'opa_properties_public';

  var SOURCE_ENDPOINT =
    'https://phl.carto.com/api/v2/sql';

  var PHASE =
    'absentee_owner_philadelphia_owner_evidence_lookup';

  var MODE =
    'READ_ONLY_OWNER_EVIDENCE';

  var MAX_SOURCE_ROWS = 5;

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

  var DISTRESS_ID = 'Distress Lead ID';
  var CANONICAL_KEY = 'Canonical Property Key';

  function authority_() {
    return {
      productionDataMutationAuthorityGranted: false,
      ownerEvidencePersistenceAuthorityGranted: false,
      canonicalIdentityRepairAuthorityGranted: false,
      migrationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      triggerAuthorityGranted: false,
      connectorExecutionAuthorityGranted: false,
      certificationMutationAuthorityGranted: false,
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

  function escapeSqlLiteral_(value) {
    return String(value)
      .replace(/'/g, "''");
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
    var keys = Object.keys(object).slice().sort();
    var allowed = expected.slice().sort();

    if (keys.length !== allowed.length) {
      return false;
    }

    for (var index = 0; index < keys.length; index++) {
      if (keys[index] !== allowed[index]) {
        return false;
      }
    }

    return true;
  }

  function validateIdentity_(identity) {
    if (
      !isPlainObject_(identity) ||
      !exactKeys_(
        identity,
        [
          DISTRESS_ID,
          CANONICAL_KEY
        ]
      )
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_IDENTITY',
          'identity must contain only persisted Distress Lead ID and Canonical Property Key.'
        )
      };
    }

    var distressLeadId =
      cleanString_(identity[DISTRESS_ID]);

    var canonicalPropertyKey =
      cleanString_(identity[CANONICAL_KEY]);

    if (!distressLeadId) {
      return {
        ok: false,
        result: fail_(
          'MISSING_DISTRESS_LEAD_ID',
          'Persisted Distress Lead ID is required.'
        )
      };
    }

    if (!canonicalPropertyKey) {
      return {
        ok: false,
        result: fail_(
          'MISSING_CANONICAL_PROPERTY_KEY',
          'Persisted Canonical Property Key is required.'
        )
      };
    }

    return {
      ok: true,
      value: {
        'Distress Lead ID': distressLeadId,
        'Canonical Property Key': canonicalPropertyKey
      }
    };
  }

  function validateInput_(options) {
    if (!isPlainObject_(options)) {
      return {
        ok: false,
        result: fail_(
          'INVALID_OPTIONS',
          'options must be an object.'
        )
      };
    }

    var keys = Object.keys(options).slice().sort();

    var withoutZip = [
      'city',
      'identity',
      'propertyAddress',
      'rowNumber',
      'state'
    ].sort();

    var withZip = [
      'city',
      'identity',
      'propertyAddress',
      'rowNumber',
      'state',
      'zip'
    ].sort();

    var allowed =
      keys.length === withoutZip.length
        ? withoutZip
        : withZip;

    if (
      keys.length !== allowed.length ||
      keys.some(function (key, index) {
        return key !== allowed[index];
      })
    ) {
      return {
        ok: false,
        result: fail_(
          'UNEXPECTED_OPTIONS',
          'Only rowNumber, identity, propertyAddress, city, state, and optional zip are permitted.'
        )
      };
    }

    if (
      typeof options.rowNumber !== 'number' ||
      !isFinite(options.rowNumber) ||
      Math.floor(options.rowNumber) !== options.rowNumber ||
      options.rowNumber < 2
    ) {
      return {
        ok: false,
        result: fail_(
          'INVALID_ROW_NUMBER',
          'rowNumber must be a finite integer data-row number.'
        )
      };
    }

    var identity = validateIdentity_(
      options.identity
    );

    if (!identity.ok) {
      return identity;
    }

    var propertyAddress =
      cleanString_(options.propertyAddress);

    if (!propertyAddress) {
      return {
        ok: false,
        result: fail_(
          'MISSING_PROPERTY_ADDRESS',
          'Verified propertyAddress is required.'
        )
      };
    }

    if (/[\u0000-\u001F\u007F]/.test(propertyAddress)) {
      return {
        ok: false,
        result: fail_(
          'INVALID_PROPERTY_ADDRESS',
          'propertyAddress contains prohibited control characters.'
        )
      };
    }

    var city =
      cleanString_(options.city).toUpperCase();

    var state =
      cleanString_(options.state).toUpperCase();

    if (city !== 'PHILADELPHIA') {
      return {
        ok: false,
        result: fail_(
          'UNSUPPORTED_CITY',
          'Version 1 is limited to Philadelphia.'
        )
      };
    }

    if (state !== 'PA') {
      return {
        ok: false,
        result: fail_(
          'UNSUPPORTED_STATE',
          'Version 1 is limited to Pennsylvania.'
        )
      };
    }

    var zip = '';

    if (own_(options, 'zip')) {
      zip = cleanString_(options.zip);

      if (
        !zip ||
        !/^\d{5}(?:-\d{4})?$/.test(zip)
      ) {
        return {
          ok: false,
          result: fail_(
            'INVALID_ZIP',
            'zip must be a five-digit or ZIP+4 value when supplied.'
          )
        };
      }
    }

    return {
      ok: true,
      rowNumber: options.rowNumber,
      identity: identity.value,
      propertyAddress: propertyAddress,
      normalizedAddress:
        normalizeAddress_(propertyAddress),
      city: city,
      state: state,
      zip: zip
    };
  }

  function buildQuery_(normalizedAddress) {
    return (
      'SELECT ' +
      SOURCE_FIELDS.join(',') +
      ' FROM ' +
      SOURCE_TABLE +
      " WHERE upper(regexp_replace(trim(location), '[[:space:]]+', ' ', 'g')) = '" +
      escapeSqlLiteral_(normalizedAddress) +
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

  function sourceBase_() {
    return {
      agency: SOURCE_AGENCY,
      dataset: SOURCE_DATASET,
      table: SOURCE_TABLE,
      endpoint: SOURCE_ENDPOINT,
      lookupQueryMode: 'exact_property_address'
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
        rowNumber: validated.rowNumber,
        identity: {
          'Distress Lead ID':
            validated.identity[DISTRESS_ID],
          'Canonical Property Key':
            validated.identity[CANONICAL_KEY]
        },
        propertyAddress:
          validated.propertyAddress,
        city: validated.city,
        state: validated.state,
        zip: validated.zip
      },
      source: sourceBase_(),
      boundedSourceRowCount: sourceRowCount,
      lookupTimestamp: new Date().toISOString()
    });
  }

  function validatePayload_(payload) {
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

    var fieldKeys =
      Object.keys(payload.fields).slice().sort();

    var expected =
      SOURCE_FIELDS.slice().sort();

    if (
      fieldKeys.length !== expected.length ||
      fieldKeys.some(function (field, index) {
        return field !== expected[index];
      })
    ) {
      return {
        ok: false,
        result: fail_(
          'SOURCE_SCHEMA_DRIFT',
          'OPA source field projection differs from the certified contract.'
        )
      };
    }

    if (payload.rows.length > MAX_SOURCE_ROWS) {
      return {
        ok: false,
        result: fail_(
          'SOURCE_RESULT_BOUND_EXCEEDED',
          'OPA source returned more than five bounded rows.'
        )
      };
    }

    for (
      var rowIndex = 0;
      rowIndex < payload.rows.length;
      rowIndex++
    ) {
      var row = payload.rows[rowIndex];

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
              'OPA source row is missing required projected field.'
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
    }

    return {
      ok: true,
      rows: payload.rows
    };
  }

  function evidenceObject_(row, fields) {
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

    var query =
      buildQuery_(
        validated.normalizedAddress
      );

    var url =
      buildUrl_(query);

    var response;

    try {
      response = UrlFetchApp.fetch(
        url,
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

    var status =
      response.getResponseCode();

    if (status !== 200) {
      return fail_(
        'HTTP_STATUS_NOT_OK',
        'OPA source returned a non-200 HTTP status.'
      );
    }

    var payload;

    try {
      payload = JSON.parse(
        response.getContentText()
      );
    } catch (error) {
      return fail_(
        'INVALID_SOURCE_JSON',
        'OPA source response was not valid JSON.'
      );
    }

    var source =
      validatePayload_(payload);

    if (!source.ok) {
      return source.result;
    }

    var matches =
      source.rows.filter(function (row) {
        return (
          normalizeAddress_(row.location) ===
          validated.normalizedAddress
        );
      });

    if (matches.length === 0) {
      return resultBase_(
        validated,
        'NO_MATCH',
        source.rows.length
      );
    }

    if (matches.length !== 1) {
      return resultBase_(
        validated,
        'AMBIGUOUS',
        source.rows.length
      );
    }

    var row = matches[0];

    var result = resultBase_(
      validated,
      'MATCHED',
      source.rows.length
    );

    result.source = {
      agency: SOURCE_AGENCY,
      dataset: SOURCE_DATASET,
      table: SOURCE_TABLE,
      endpoint: SOURCE_ENDPOINT,
      lookupQueryMode:
        'exact_property_address',
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

function reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(options) {
  return REOS
    .AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup
    .lookup(options);
}
