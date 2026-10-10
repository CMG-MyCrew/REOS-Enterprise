var REOS = REOS || {};

/**
 * Absentee-Owner Classification Evidence Store V2
 * Exact-Event Read-Only Reconciliation v1
 *
 * Additive administrative read surface only.
 *
 * No persistence authority.
 * No retry authority.
 * No DISTRESS_LEADS access.
 * No external HTTP.
 * No scheduler, trigger, ARV, repair-scope, MAO, or offer authority.
 */
REOS.AbsenteeOwnerClassificationEvidenceStoreV2ExactEventReadOnlyReconciliation =
(function () {
  'use strict';

  var MODE =
    'READ_ONLY_EXACT_V2_EVENT_RECONCILIATION';

  var VERIFIED =
    'ABSENTEE_OWNER_V2_EXACT_EVENT_RECONCILIATION_VERIFIED';

  var NOT_PRESENT =
    'ABSENTEE_OWNER_V2_EXACT_EVENT_RECONCILIATION_NOT_PRESENT';

  var PRECONDITION_FAILED =
    'ABSENTEE_OWNER_V2_EXACT_EVENT_RECONCILIATION_PRECONDITION_FAILED';

  var PROPERTY_KEY =
    'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

  var SHEET_NAME =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2';

  var GENESIS =
    'GENESIS';

  var BASIS =
    'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON';

  var LOOKUP_MODE =
    'certified_opa_account';

  var CERTIFICATION_BASIS =
    'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT';

  var SOURCE_AGENCY =
    'Philadelphia Office of Property Assessment';

  var SOURCE_DATASET =
    'Philadelphia Properties and Assessment History';

  var SOURCE_TABLE =
    'opa_properties_public';

  var SOURCE_ENDPOINT =
    'https://phl.carto.com/api/v2/sql';

  var INPUT_FIELDS = Object.freeze([
    'evidenceEventId',
    'distressLeadId',
    'canonicalPropertyKey',
    'physicalTargetRowNumber'
  ]);

  var HEADERS = Object.freeze([
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

  var PERSISTABLE_OUTCOMES = Object.freeze({
    ABSENTEE_OWNER_INDICATED:
      'MAILING_ADDRESS_DIFFERS',

    OWNER_MAILING_MATCHED:
      'MAILING_ADDRESS_MATCHES',

    INSUFFICIENT_CLASSIFICATION_EVIDENCE:
      'INSUFFICIENT_MAILING_EVIDENCE'
  });

  function precondition_(message) {
    var error =
      new Error(
        message ||
        'Read-only V2 reconciliation precondition failed.'
      );

    error.name =
      PRECONDITION_FAILED;

    return error;
  }

function own_(object, key) {
    return Object.prototype
      .hasOwnProperty
      .call(object, key);
  }

function isPlainObject_(value) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return false;
    }

    var prototype = Object.getPrototypeOf(value);

    return (
      prototype === Object.prototype ||
      prototype === null ||
      Object.prototype.toString.call(value) ===
        '[object Object]'
    );
  }

function exactKeys_(object, expected) {
    if (!isPlainObject_(object)) {
      return false;
    }

    var actual =
      Object.keys(object)
        .slice()
        .sort();

    var allowed =
      expected
        .slice()
        .sort();

    return (
      actual.length === allowed.length &&
      actual.every(function (key, index) {
        return key === allowed[index];
      })
    );
  }

function safeText_(value) {
    return (
      typeof value === 'string' &&
      value !== '' &&
      !/[\u0000-\u001F\u007F]/.test(value) &&
      !/^[=+\-@]/.test(value)
    );
  }

function safeOptionalText_(value) {
    return (
      typeof value === 'string' &&
      (
        value === '' ||
        safeText_(value)
      )
    );
  }

function lowercaseSha_(value) {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{64}$/.test(value)
    );
  }

function validObservedAt_(value) {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      return new Date(value).toISOString() === value;
    } catch (error) {
      return false;
    }
  }

function canonicalJsonEquals_(
    helpers,
    text,
    expectedType
  ) {
    if (typeof text !== 'string') {
      return false;
    }

    try {
      var parsed = JSON.parse(text);

      if (
        expectedType === 'array' &&
        !Array.isArray(parsed)
      ) {
        return false;
      }

      if (
        expectedType === 'object' &&
        !isPlainObject_(parsed)
      ) {
        return false;
      }

      if (
        expectedType === 'null' &&
        parsed !== null
      ) {
        return false;
      }

      return (
        helpers.canonicalJson(parsed) ===
        text
      );
    } catch (error) {
      return false;
    }
  }

function validateAddressJson_(helpers, text) {
    if (
      !canonicalJsonEquals_(
        helpers,
        text,
        'object'
      )
    ) {
      return false;
    }

    var value = JSON.parse(text);
    var fields = [
      'street',
      'city',
      'state',
      'zip'
    ];

    return (
      exactKeys_(value, fields) &&
      fields.every(function (field) {
        return safeOptionalText_(
          value[field]
        );
      })
    );
  }

function validateDifferingJson_(
    helpers,
    outcome,
    text
  ) {
    if (
      outcome ===
      'ABSENTEE_OWNER_INDICATED'
    ) {
      if (
        !canonicalJsonEquals_(
          helpers,
          text,
          'array'
        )
      ) {
        return false;
      }

      var differences = JSON.parse(text);

      return (
        differences.length > 0 &&
        differences.every(function (value) {
          return safeText_(value);
        })
      );
    }

    if (
      outcome ===
      'OWNER_MAILING_MATCHED'
    ) {
      return text === '[]';
    }

    return text === 'null';
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
      throw precondition_(
        'AOCE2 event identity details are invalid.'
      );
    }

    return (
      'AOCE2-' +
      helpers.hashCanonicalObject(details)
    );
  }

function eventPayloadFromRow_(row) {
    var payload = {};

    for (
      var index = 0;
      index < HEADERS.length - 1;
      index++
    ) {
      payload[HEADERS[index]] =
        row[index];
    }

    return payload;
  }

function validateStoredRow_(
    helpers,
    row,
    formulas,
    physicalRowNumber
  ) {
    if (
      !Array.isArray(row) ||
      row.length !== HEADERS.length
    ) {
      throw precondition_(
        'Stored v2 evidence row must contain exactly 27 cells.'
      );
    }

    if (
      !Array.isArray(formulas) ||
      formulas.length !== HEADERS.length ||
      formulas.some(function (formula) {
        return formula !== '';
      })
    ) {
      throw precondition_(
        'Stored v2 evidence formula readback is invalid.'
      );
    }

    row.forEach(function (value, index) {
      if (
        typeof value === 'string' &&
        !safeText_(value)
      ) {
        throw precondition_(
          'Stored v2 evidence contains unsafe spreadsheet text at column ' +
          (index + 1) +
          '.'
        );
      }
    });

    if (
      typeof physicalRowNumber !== 'number' ||
      !isFinite(physicalRowNumber) ||
      Math.floor(physicalRowNumber) !==
        physicalRowNumber ||
      physicalRowNumber < 2
    ) {
      throw precondition_(
        'Stored v2 physical evidence row is invalid.'
      );
    }

    if (
      !/^AOCE2-[0-9a-f]{64}$/.test(
        row[0]
      ) ||
      !validObservedAt_(row[1]) ||
      row[2] !== 2 ||
      row[3] !== 1 ||
      !safeText_(row[4]) ||
      !safeText_(row[5]) ||
      typeof row[6] !== 'number' ||
      !isFinite(row[6]) ||
      Math.floor(row[6]) !== row[6] ||
      row[6] < 2
    ) {
      throw precondition_(
        'Stored v2 identity or contract fields are invalid.'
      );
    }

    if (
      !own_(
        PERSISTABLE_OUTCOMES,
        row[7]
      ) ||
      row[8] !== BASIS ||
      row[9] !==
        PERSISTABLE_OUTCOMES[
          row[7]
        ] ||
      !validateDifferingJson_(
        helpers,
        row[7],
        row[10]
      ) ||
      !validateAddressJson_(
        helpers,
        row[11]
      ) ||
      !validateAddressJson_(
        helpers,
        row[12]
      )
    ) {
      throw precondition_(
        'Stored v2 classification evidence is invalid.'
      );
    }

    if (
      row[13] !== SOURCE_AGENCY ||
      row[14] !== SOURCE_DATASET ||
      row[15] !== SOURCE_TABLE ||
      row[16] !== SOURCE_ENDPOINT ||
      row[17] !== LOOKUP_MODE ||
      !/^[0-9]{9}$/.test(row[18]) ||
      row[19] !== CERTIFICATION_BASIS
    ) {
      throw precondition_(
        'Stored v2 source provenance is invalid.'
      );
    }

    [
      row[20],
      row[21],
      row[22],
      row[23],
      row[24]
    ].forEach(function (value) {
      if (!lowercaseSha_(value)) {
        throw precondition_(
          'Stored v2 provenance hash is invalid.'
        );
      }
    });

    if (
      !(
        row[25] === GENESIS ||
        lowercaseSha_(row[25])
      ) ||
      !lowercaseSha_(row[26])
    ) {
      throw precondition_(
        'Stored v2 evidence hash chain fields are invalid.'
      );
    }

    var expectedEventId =
      eventIdFor_(helpers, {
        persistenceContractVersion: row[2],
        classificationContractVersion: row[3],
        distressLeadId: row[4],
        canonicalPropertyKey: row[5],
        certifiedOpaAccount: row[18],
        propertySourceIdentityCertificationSha256:
          row[20],
        normalLookupEvidenceSha256:
          row[21],
        ownerEvidenceResultSha256:
          row[22],
        comparisonResultSha256:
          row[23],
        classifierResultSha256:
          row[24]
      });

    if (row[0] !== expectedEventId) {
      throw precondition_(
        'Stored v2 Evidence Event ID is not deterministic.'
      );
    }

    var expectedEventHash =
      helpers.hashCanonicalObject(
        eventPayloadFromRow_(row)
      );

    if (row[26] !== expectedEventHash) {
      throw precondition_(
        'Stored v2 Evidence Event SHA-256 is invalid.'
      );
    }

    return {
      physicalEvidenceRowNumber:
        physicalRowNumber,

      evidenceEventId:
        row[0],

      observedAtUtc:
        row[1],

      distressLeadId:
        row[4],

      canonicalPropertyKey:
        row[5],

      classifierResultSha256:
        row[24],

      previousEvidenceSha256:
        row[25],

      evidenceEventSha256:
        row[26]
    };
  }

  function assertDependencies_() {
    if (
      typeof REOS !== 'object' ||
      !REOS ||
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function' ||
      !REOS.AbsenteeOwnerClassificationEvidenceStoreV2 ||
      typeof REOS
        .AbsenteeOwnerClassificationEvidenceStoreV2
        .headers !== 'function' ||
      !REOS.AbsenteeOwnerClassificationPersistencePlanner ||
      typeof REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .canonicalJson !== 'function' ||
      typeof REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .hashCanonicalObject !== 'function' ||
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !== 'function' ||
      typeof SpreadsheetApp === 'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp
        .getActiveSpreadsheet !== 'function' ||
      typeof SpreadsheetApp
        .openById !== 'function'
    ) {
      throw precondition_(
        'Required read-only V2 reconciliation dependencies are unavailable.'
      );
    }
  }

  function canonicalHelpers_() {
    return {
      canonicalJson:
        REOS
          .AbsenteeOwnerClassificationPersistencePlanner
          .canonicalJson,

      hashCanonicalObject:
        REOS
          .AbsenteeOwnerClassificationPersistencePlanner
          .hashCanonicalObject
    };
  }

  function validateInput_(options) {
    if (
      !isPlainObject_(options) ||
      !exactKeys_(
        options,
        INPUT_FIELDS
      )
    ) {
      throw precondition_(
        'Read-only V2 reconciliation options are invalid.'
      );
    }

    if (
      !/^AOCE2-[0-9a-f]{64}$/.test(
        options.evidenceEventId
      ) ||
      !safeText_(
        options.distressLeadId
      ) ||
      !/^DL-[0-9]{14}-[0-9]{4}$/.test(
        options.distressLeadId
      ) ||
      !safeText_(
        options.canonicalPropertyKey
      ) ||
      options.canonicalPropertyKey
        .indexOf('property|') !== 0 ||
      typeof options.physicalTargetRowNumber !==
        'number' ||
      !isFinite(
        options.physicalTargetRowNumber
      ) ||
      Math.floor(
        options.physicalTargetRowNumber
      ) !==
        options.physicalTargetRowNumber ||
      options.physicalTargetRowNumber < 2
    ) {
      throw precondition_(
        'Read-only V2 reconciliation identity is invalid.'
      );
    }

    return {
      evidenceEventId:
        options.evidenceEventId,

      distressLeadId:
        options.distressLeadId,

      canonicalPropertyKey:
        options.canonicalPropertyKey,

      physicalTargetRowNumber:
        options.physicalTargetRowNumber
    };
  }

  function validateHeaders_(sheet) {
    if (
      !sheet ||
      typeof sheet.getRange !== 'function' ||
      typeof sheet.getLastColumn !== 'function'
    ) {
      throw precondition_(
        'V2 reconciliation evidence sheet is invalid.'
      );
    }

    var exportedHeaders =
      REOS
        .AbsenteeOwnerClassificationEvidenceStoreV2
        .headers();

    if (
      !Array.isArray(exportedHeaders) ||
      exportedHeaders.length !==
        HEADERS.length ||
      exportedHeaders.some(
        function (value, index) {
          return value !== HEADERS[index];
        }
      )
    ) {
      throw precondition_(
        'Certified V2 store header contract changed.'
      );
    }

    if (
      sheet.getLastColumn() !==
        HEADERS.length
    ) {
      throw precondition_(
        'V2 reconciliation evidence schema width is invalid.'
      );
    }

    var range =
      sheet.getRange(
        1,
        1,
        1,
        HEADERS.length
      );

    var values =
      range.getValues();

    var formulas =
      range.getFormulas();

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      !Array.isArray(values[0]) ||
      values[0].length !==
        HEADERS.length ||
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      !Array.isArray(formulas[0]) ||
      formulas[0].length !==
        HEADERS.length
    ) {
      throw precondition_(
        'V2 reconciliation header readback is invalid.'
      );
    }

    for (
      var index = 0;
      index < HEADERS.length;
      index++
    ) {
      if (
        values[0][index] !==
          HEADERS[index] ||
        formulas[0][index] !== ''
      ) {
        throw precondition_(
          'V2 reconciliation header schema is invalid.'
        );
      }
    }
  }

  function openStorage_() {
    var properties =
      PropertiesService
        .getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !==
        'function'
    ) {
      throw precondition_(
        'Script Property read access is unavailable.'
      );
    }

    var workbookId =
      properties.getProperty(
        PROPERTY_KEY
      );

    if (!safeText_(workbookId)) {
      throw precondition_(
        'Configured evidence workbook is unavailable.'
      );
    }

    var active =
      SpreadsheetApp
        .getActiveSpreadsheet();

    if (
      !active ||
      typeof active.getId !== 'function'
    ) {
      throw precondition_(
        'Active REOS spreadsheet identity is unavailable.'
      );
    }

    if (active.getId() === workbookId) {
      throw precondition_(
        'Configured evidence workbook aliases active REOS.'
      );
    }

    var workbook =
      SpreadsheetApp.openById(
        workbookId
      );

    if (
      !workbook ||
      typeof workbook.getSheetByName !==
        'function'
    ) {
      throw precondition_(
        'Configured evidence workbook is invalid.'
      );
    }

    var sheet =
      workbook.getSheetByName(
        SHEET_NAME
      );

    if (!sheet) {
      throw precondition_(
        'V2 reconciliation evidence sheet is unavailable.'
      );
    }

    validateHeaders_(sheet);

    return {
      workbookId:
        workbookId,

      sheet:
        sheet
    };
  }

  function exactIdentityHistoryReadOnly_(
    helpers,
    sheet,
    distressLeadId,
    canonicalPropertyKey
  ) {
    var lastRow =
      sheet.getLastRow();

    if (lastRow < 2) {
      return [];
    }

    var searchRange =
      sheet.getRange(
        2,
        5,
        lastRow - 1,
        1
      );

    if (
      !searchRange ||
      typeof searchRange
        .createTextFinder !== 'function'
    ) {
      throw precondition_(
        'V2 reconciliation TextFinder support is unavailable.'
      );
    }

    var finder =
      searchRange
        .createTextFinder(
          distressLeadId
        );

    if (
      !finder ||
      typeof finder.matchEntireCell !==
        'function' ||
      typeof finder.findAll !==
        'function'
    ) {
      throw precondition_(
        'V2 reconciliation TextFinder is invalid.'
      );
    }

    finder.matchEntireCell(true);

    var matches =
      finder.findAll();

    if (!Array.isArray(matches)) {
      throw precondition_(
        'V2 reconciliation TextFinder result is invalid.'
      );
    }

    var physicalRows = [];
    var seenRows = {};

    matches.forEach(function (match) {
      if (
        !match ||
        typeof match.getRow !==
          'function'
      ) {
        throw precondition_(
          'V2 reconciliation TextFinder match is invalid.'
        );
      }

      var rowNumber =
        match.getRow();

      if (
        typeof rowNumber !== 'number' ||
        !isFinite(rowNumber) ||
        Math.floor(rowNumber) !==
          rowNumber ||
        rowNumber < 2 ||
        rowNumber > lastRow ||
        seenRows[rowNumber]
      ) {
        throw precondition_(
          'V2 reconciliation evidence row is invalid or duplicated.'
        );
      }

      seenRows[rowNumber] = true;
      physicalRows.push(rowNumber);
    });

    physicalRows.sort(function (left, right) {
      return left - right;
    });

    var history = [];

    physicalRows.forEach(function (rowNumber) {
      var range =
        sheet.getRange(
          rowNumber,
          1,
          1,
          HEADERS.length
        );

      var values =
        range.getValues();

      var formulas =
        range.getFormulas();

      if (
        !Array.isArray(values) ||
        values.length !== 1 ||
        !Array.isArray(values[0]) ||
        !Array.isArray(formulas) ||
        formulas.length !== 1 ||
        !Array.isArray(formulas[0])
      ) {
        throw precondition_(
          'V2 reconciliation row readback is invalid.'
        );
      }

      if (
        values[0][5] !==
          canonicalPropertyKey
      ) {
        return;
      }

      var event =
        validateStoredRow_(
          helpers,
          values[0],
          formulas[0],
          rowNumber
        );

      if (
        event.distressLeadId !==
          distressLeadId ||
        event.canonicalPropertyKey !==
          canonicalPropertyKey
      ) {
        throw precondition_(
          'V2 reconciliation dual identity mismatch.'
        );
      }

      event.physicalTargetRowNumber =
        values[0][6];

      history.push(event);
    });

    var seenEventIds = {};

    history.forEach(function (event, index) {
      var expectedPrevious =
        index === 0
          ? GENESIS
          : history[index - 1]
            .evidenceEventSha256;

      if (
        event.previousEvidenceSha256 !==
          expectedPrevious
      ) {
        throw precondition_(
          'V2 reconciliation history hash chain is invalid.'
        );
      }

      if (
        seenEventIds[
          event.evidenceEventId
        ]
      ) {
        throw precondition_(
          'V2 reconciliation history contains a duplicate Evidence Event ID.'
        );
      }

      seenEventIds[
        event.evidenceEventId
      ] = true;
    });

    return history;
  }

  function result_(
    ok,
    outcome,
    input,
    event,
    historyCount,
    eventMatchCount,
    eventIdDeterministic,
    eventHashValid,
    historyHashChainValid,
    duplicateEventIdAbsent
  ) {
    return {
      ok:
        ok,

      mode:
        MODE,

      outcome:
        outcome,

      distressLeadId:
        input
          ? input.distressLeadId
          : null,

      canonicalPropertyKey:
        input
          ? input.canonicalPropertyKey
          : null,

      physicalTargetRowNumber:
        input
          ? input.physicalTargetRowNumber
          : null,

      physicalEvidenceRowNumber:
        event
          ? event.physicalEvidenceRowNumber
          : null,

      evidenceEventId:
        event
          ? event.evidenceEventId
          : (
              input
                ? input.evidenceEventId
                : null
            ),

      observedAtUtc:
        event
          ? event.observedAtUtc
          : null,

      classifierResultSha256:
        event
          ? event.classifierResultSha256
          : null,

      previousEvidenceSha256:
        event
          ? event.previousEvidenceSha256
          : null,

      evidenceEventSha256:
        event
          ? event.evidenceEventSha256
          : null,

      identityHistoryCount:
        historyCount,

      eventMatchCount:
        eventMatchCount,

      eventIdDeterministic:
        eventIdDeterministic,

      eventHashValid:
        eventHashValid,

      historyHashChainValid:
        historyHashChainValid,

      duplicateEventIdAbsent:
        duplicateEventIdAbsent
    };
  }

  function reconcile(options) {
    var input = null;

    try {
      assertDependencies_();

      REOS.Security.requireAdmin();

      input =
        validateInput_(
          options
        );

      var helpers =
        canonicalHelpers_();

      var storage =
        openStorage_();

      var history =
        exactIdentityHistoryReadOnly_(
          helpers,
          storage.sheet,
          input.distressLeadId,
          input.canonicalPropertyKey
        );

      var requested = history.filter(
        function (event) {
          return (
            event.evidenceEventId ===
            input.evidenceEventId
          );
        }
      );

      if (requested.length === 0) {
        return result_(
          true,
          NOT_PRESENT,
          input,
          null,
          history.length,
          0,
          null,
          null,
          true,
          true
        );
      }

      if (requested.length !== 1) {
        throw precondition_(
          'V2 reconciliation exact-event cardinality is invalid.'
        );
      }

      var event =
        requested[0];

      if (
        event.physicalTargetRowNumber !==
          input.physicalTargetRowNumber
      ) {
        throw precondition_(
          'V2 reconciliation physical target row does not match.'
        );
      }

      return result_(
        true,
        VERIFIED,
        input,
        event,
        history.length,
        1,
        true,
        true,
        true,
        true
      );
    } catch (error) {
      return result_(
        false,
        PRECONDITION_FAILED,
        input,
        null,
        0,
        0,
        false,
        false,
        false,
        false
      );
    }
  }

  return Object.freeze({
    reconcile:
      reconcile
  });
}());

function reosAbsenteeOwnerClassificationEvidenceStoreV2ExactEventReadOnlyReconciliation(
  options
) {
  return REOS
    .AbsenteeOwnerClassificationEvidenceStoreV2ExactEventReadOnlyReconciliation
    .reconcile(
      options
    );
}
