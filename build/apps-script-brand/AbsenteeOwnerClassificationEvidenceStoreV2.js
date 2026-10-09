var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationEvidenceStoreV2 = (function () {
  'use strict';

  var PROPERTY_KEY =
    'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

  var SHEET_NAME =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2';

  var GENESIS = 'GENESIS';

  var PRECONDITION =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED';

  var UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN';

  var VERIFIED =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED';

  var ALREADY =
    'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED';

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

  var PLAN_FIELDS = Object.freeze([
    'ok',
    'persistenceContractVersion',
    'classificationContractVersion',
    'target',
    'classificationOutcome',
    'classificationBasis',
    'upstreamComparisonOutcome',
    'differingComponentsJson',
    'normalizedPropertyAddressJson',
    'normalizedMailingAddressJson',
    'sourceAgency',
    'sourceDataset',
    'sourceTable',
    'sourceEndpoint',
    'ownerEvidenceLookupMode',
    'certifiedOpaAccount',
    'propertySourceIdentityCertificationBasis',
    'propertySourceIdentityCertificationSha256',
    'normalLookupEvidenceSha256',
    'ownerEvidenceResultSha256',
    'comparisonResultSha256',
    'classifierResultSha256',
    'evidenceEventId'
  ]);

  var PERSISTABLE_OUTCOMES = Object.freeze({
    ABSENTEE_OWNER_INDICATED:
      'MAILING_ADDRESS_DIFFERS',

    OWNER_MAILING_MATCHED:
      'MAILING_ADDRESS_MATCHES',

    INSUFFICIENT_CLASSIFICATION_EVIDENCE:
      'INSUFFICIENT_MAILING_EVIDENCE'
  });

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

  function classifiedError_(
    classification,
    message,
    cause
  ) {
    var error =
      new Error(
        classification +
        ': ' +
        message
      );

    error.persistenceClassification =
      classification;

    if (
      cause !== undefined &&
      cause !== null
    ) {
      error.cause = cause;
    }

    return error;
  }

  function precondition_(message, cause) {
    return classifiedError_(
      PRECONDITION,
      message,
      cause
    );
  }

  function uncertain_(message, cause) {
    return classifiedError_(
      UNCERTAIN,
      message,
      cause
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

  function canonicalHelpers_() {
    var planner =
      REOS &&
      REOS.AbsenteeOwnerClassificationPersistencePlanner;

    if (
      !planner ||
      typeof planner.canonicalJson !== 'function' ||
      typeof planner.hashCanonicalObject !== 'function'
    ) {
      throw precondition_(
        'Certified canonical JSON/hash helpers are unavailable.'
      );
    }

    return planner;
  }

  function assertDependencies_() {
    if (
      !REOS ||
      !REOS.Database ||
      typeof REOS.Database
        .assertScriptLockContext !== 'function'
    ) {
      throw precondition_(
        'Required persistence dependencies are unavailable.'
      );
    }

    canonicalHelpers_();
  }

  function assertLockContext_(lockContext) {
    try {
      REOS.Database
        .assertScriptLockContext(lockContext);
    } catch (error) {
      throw precondition_(
        'Caller-owned ScriptLock context is invalid.',
        error
      );
    }
  }

  function configuredWorkbookId_() {
    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !== 'function'
    ) {
      throw precondition_(
        'Script Properties are unavailable.'
      );
    }

    var properties =
      PropertiesService.getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !== 'function'
    ) {
      throw precondition_(
        'Script Properties read access is unavailable.'
      );
    }

    var workbookId =
      String(
        properties.getProperty(PROPERTY_KEY) ||
        ''
      ).trim();

    if (
      !workbookId ||
      !safeText_(workbookId)
    ) {
      throw precondition_(
        'Classification evidence workbook ID is missing or unsafe.'
      );
    }

    return workbookId;
  }

  function validateHeaders_(sheet) {
    if (
      !sheet ||
      typeof sheet.getLastRow !== 'function' ||
      typeof sheet.getLastColumn !== 'function' ||
      typeof sheet.getRange !== 'function'
    ) {
      throw precondition_(
        'Evidence sheet APIs are unavailable.'
      );
    }

    if (
      sheet.getLastRow() < 1 ||
      sheet.getLastColumn() !== HEADERS.length
    ) {
      throw precondition_(
        'V2 evidence sheet geometry or exact 27-column schema is invalid.'
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
      typeof range.getFormulas === 'function'
        ? range.getFormulas()
        : null;

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      values[0].length !== HEADERS.length
    ) {
      throw precondition_(
        'V2 evidence header readback is invalid.'
      );
    }

    HEADERS.forEach(function (header, index) {
      if (values[0][index] !== header) {
        throw precondition_(
          'V2 evidence header mismatch at column ' +
          (index + 1) +
          '.'
        );
      }
    });

    if (
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      formulas[0].length !== HEADERS.length ||
      formulas[0].some(function (formula) {
        return formula !== '';
      })
    ) {
      throw precondition_(
        'V2 evidence headers must have exact formula-free readback.'
      );
    }
  }

  function openStorage_() {
    if (
      typeof SpreadsheetApp === 'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp
        .getActiveSpreadsheet !== 'function' ||
      typeof SpreadsheetApp
        .openById !== 'function'
    ) {
      throw precondition_(
        'SpreadsheetApp storage APIs are unavailable.'
      );
    }

    var workbookId =
      configuredWorkbookId_();

    var active =
      SpreadsheetApp.getActiveSpreadsheet();

    if (
      !active ||
      typeof active.getId !== 'function'
    ) {
      throw precondition_(
        'Active REOS spreadsheet identity is unavailable.'
      );
    }

    if (
      String(active.getId()) ===
      workbookId
    ) {
      throw precondition_(
        'Classification evidence workbook must be separate from active REOS acquisition data.'
      );
    }

    var workbook;

    try {
      workbook =
        SpreadsheetApp.openById(workbookId);
    } catch (error) {
      throw precondition_(
        'Configured classification evidence workbook cannot be opened.',
        error
      );
    }

    if (
      !workbook ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      throw precondition_(
        'Configured classification evidence workbook is invalid.'
      );
    }

    var sheet =
      workbook.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw precondition_(
        'V2 classification evidence sheet is not provisioned.'
      );
    }

    validateHeaders_(sheet);

    return {
      workbookId: workbookId,
      workbook: workbook,
      sheet: sheet
    };
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

  function eventIdFromPlan_(helpers, plan) {
    return eventIdFor_(helpers, {
      persistenceContractVersion:
        plan.persistenceContractVersion,

      classificationContractVersion:
        plan.classificationContractVersion,

      distressLeadId:
        plan.target.identity['Distress Lead ID'],

      canonicalPropertyKey:
        plan.target.identity['Canonical Property Key'],

      certifiedOpaAccount:
        plan.certifiedOpaAccount,

      propertySourceIdentityCertificationSha256:
        plan.propertySourceIdentityCertificationSha256,

      normalLookupEvidenceSha256:
        plan.normalLookupEvidenceSha256,

      ownerEvidenceResultSha256:
        plan.ownerEvidenceResultSha256,

      comparisonResultSha256:
        plan.comparisonResultSha256,

      classifierResultSha256:
        plan.classifierResultSha256
    });
  }

  function validatePlan_(helpers, plan) {
    if (
      !exactKeys_(plan, PLAN_FIELDS) ||
      plan.ok !== true
    ) {
      throw precondition_(
        'V2 persistence plan shape is invalid.'
      );
    }

    if (
      !exactKeys_(
        plan.target,
        [
          'rowNumber',
          'identity'
        ]
      ) ||
      !exactKeys_(
        plan.target.identity,
        [
          'Distress Lead ID',
          'Canonical Property Key'
        ]
      )
    ) {
      throw precondition_(
        'V2 persistence plan target is invalid.'
      );
    }

    if (
      plan.persistenceContractVersion !== 2 ||
      plan.classificationContractVersion !== 1 ||
      !safeText_(
        plan.target.identity[
          'Distress Lead ID'
        ]
      ) ||
      !safeText_(
        plan.target.identity[
          'Canonical Property Key'
        ]
      ) ||
      typeof plan.target.rowNumber !== 'number' ||
      !isFinite(plan.target.rowNumber) ||
      Math.floor(plan.target.rowNumber) !==
        plan.target.rowNumber ||
      plan.target.rowNumber < 2 ||
      !own_(
        PERSISTABLE_OUTCOMES,
        plan.classificationOutcome
      ) ||
      plan.classificationBasis !== BASIS ||
      plan.upstreamComparisonOutcome !==
        PERSISTABLE_OUTCOMES[
          plan.classificationOutcome
        ] ||
      plan.sourceAgency !== SOURCE_AGENCY ||
      plan.sourceDataset !== SOURCE_DATASET ||
      plan.sourceTable !== SOURCE_TABLE ||
      plan.sourceEndpoint !== SOURCE_ENDPOINT ||
      plan.ownerEvidenceLookupMode !== LOOKUP_MODE ||
      !/^[0-9]{9}$/.test(
        plan.certifiedOpaAccount
      ) ||
      plan
        .propertySourceIdentityCertificationBasis !==
        CERTIFICATION_BASIS
    ) {
      throw precondition_(
        'V2 persistence plan values are invalid.'
      );
    }

    if (
      !validateDifferingJson_(
        helpers,
        plan.classificationOutcome,
        plan.differingComponentsJson
      ) ||
      !validateAddressJson_(
        helpers,
        plan.normalizedPropertyAddressJson
      ) ||
      !validateAddressJson_(
        helpers,
        plan.normalizedMailingAddressJson
      )
    ) {
      throw precondition_(
        'V2 persistence plan normalized evidence is invalid.'
      );
    }

    [
      plan.propertySourceIdentityCertificationSha256,
      plan.normalLookupEvidenceSha256,
      plan.ownerEvidenceResultSha256,
      plan.comparisonResultSha256,
      plan.classifierResultSha256
    ].forEach(function (value) {
      if (!lowercaseSha_(value)) {
        throw precondition_(
          'V2 persistence plan provenance hash is invalid.'
        );
      }
    });

    if (
      !/^AOCE2-[0-9a-f]{64}$/.test(
        plan.evidenceEventId
      ) ||
      plan.evidenceEventId !==
        eventIdFromPlan_(
          helpers,
          plan
        )
    ) {
      throw precondition_(
        'V2 persistence plan Evidence Event ID is invalid.'
      );
    }
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

  function exactIdentityHistory_(
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
        'V2 evidence history TextFinder support is unavailable.'
      );
    }

    var finder =
      searchRange
        .createTextFinder(
          distressLeadId
        );

    if (
      !finder ||
      typeof finder.matchEntireCell !== 'function' ||
      typeof finder.findAll !== 'function'
    ) {
      throw precondition_(
        'V2 evidence history TextFinder is invalid.'
      );
    }

    finder.matchEntireCell(true);

    var matches =
      finder.findAll();

    if (!Array.isArray(matches)) {
      throw precondition_(
        'V2 evidence history TextFinder result is invalid.'
      );
    }

    var physicalRows = [];
    var seenRows = {};

    matches.forEach(function (match) {
      if (
        !match ||
        typeof match.getRow !== 'function'
      ) {
        throw precondition_(
          'V2 evidence history TextFinder match is invalid.'
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
          'V2 evidence history TextFinder row is invalid or duplicated.'
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
        !Array.isArray(formulas) ||
        formulas.length !== 1
      ) {
        throw precondition_(
          'V2 evidence history row readback is invalid.'
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
          'V2 evidence history identity mismatch.'
        );
      }

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
          'V2 evidence history hash chain is invalid.'
        );
      }

      if (seenEventIds[event.evidenceEventId]) {
        throw precondition_(
          'V2 evidence history contains a duplicate Evidence Event ID.'
        );
      }

      seenEventIds[event.evidenceEventId] = true;
    });

    return history;
  }

  function rowEquals_(left, right) {
    return (
      left.length === right.length &&
      left.every(function (value, index) {
        return value === right[index];
      })
    );
  }

  function persist(plan, options) {
    var writeState =
      options &&
      options.writeState;

    try {
      assertDependencies_();

      if (
        !exactKeys_(
          options,
          [
            'lockContext',
            'writeState'
          ]
        )
      ) {
        throw precondition_(
          'V2 evidence store options are invalid.'
        );
      }

      if (
        !isPlainObject_(writeState) ||
        writeState.writeAttempted !== false
      ) {
        throw precondition_(
          'V2 evidence store write-state token is invalid.'
        );
      }

      assertLockContext_(
        options.lockContext
      );

      var helpers =
        canonicalHelpers_();

      validatePlan_(
        helpers,
        plan
      );

      var storage =
        openStorage_();

      assertLockContext_(
        options.lockContext
      );

      var distressLeadId =
        plan.target.identity[
          'Distress Lead ID'
        ];

      var canonicalPropertyKey =
        plan.target.identity[
          'Canonical Property Key'
        ];

      var history =
        exactIdentityHistory_(
          helpers,
          storage.sheet,
          distressLeadId,
          canonicalPropertyKey
        );

      for (
        var historyIndex = 0;
        historyIndex < history.length;
        historyIndex++
      ) {
        if (
          history[historyIndex]
            .evidenceEventId ===
          plan.evidenceEventId
        ) {
          return {
            ok: true,
            outcome: ALREADY,
            disposition: 'ALREADY_PERSISTED',
            classifierResultSha256:
              history[historyIndex]
                .classifierResultSha256,
            evidenceEventId:
              history[historyIndex]
                .evidenceEventId,
            evidenceEventSha256:
              history[historyIndex]
                .evidenceEventSha256,
            physicalEvidenceRowNumber:
              history[historyIndex]
                .physicalEvidenceRowNumber
          };
        }
      }

      var observedAtUtc =
        new Date().toISOString();

      var previousEvidenceSha256 =
        history.length === 0
          ? GENESIS
          : history[
            history.length - 1
          ].evidenceEventSha256;

      var payload = {
        'Evidence Event ID':
          plan.evidenceEventId,

        'Observed At UTC':
          observedAtUtc,

        'Persistence Contract Version':
          plan.persistenceContractVersion,

        'Classification Contract Version':
          plan.classificationContractVersion,

        'Distress Lead ID':
          distressLeadId,

        'Canonical Property Key':
          canonicalPropertyKey,

        'Physical Row Number':
          plan.target.rowNumber,

        'Classification Outcome':
          plan.classificationOutcome,

        'Classification Basis':
          plan.classificationBasis,

        'Upstream Comparison Outcome':
          plan.upstreamComparisonOutcome,

        'Differing Components JSON':
          plan.differingComponentsJson,

        'Normalized Property Address JSON':
          plan.normalizedPropertyAddressJson,

        'Normalized Mailing Address JSON':
          plan.normalizedMailingAddressJson,

        'Source Agency':
          plan.sourceAgency,

        'Source Dataset':
          plan.sourceDataset,

        'Source Table':
          plan.sourceTable,

        'Source Endpoint':
          plan.sourceEndpoint,

        'Owner Evidence Lookup Mode':
          plan.ownerEvidenceLookupMode,

        'Certified OPA Account':
          plan.certifiedOpaAccount,

        'Property Source Identity Certification Basis':
          plan.propertySourceIdentityCertificationBasis,

        'Property Source Identity Certification SHA-256':
          plan.propertySourceIdentityCertificationSha256,

        'Normal Lookup Evidence SHA-256':
          plan.normalLookupEvidenceSha256,

        'Owner Evidence Result SHA-256':
          plan.ownerEvidenceResultSha256,

        'Comparison Result SHA-256':
          plan.comparisonResultSha256,

        'Classifier Result SHA-256':
          plan.classifierResultSha256,

        'Previous Evidence SHA-256':
          previousEvidenceSha256
      };

      var evidenceEventSha256 =
        helpers.hashCanonicalObject(payload);

      var row =
        HEADERS.map(function (header) {
          return (
            header ===
            'Evidence Event SHA-256'
              ? evidenceEventSha256
              : payload[header]
          );
        });

      row.forEach(function (value, index) {
        if (
          typeof value === 'string' &&
          !safeText_(value)
        ) {
          throw precondition_(
            'New v2 evidence contains unsafe spreadsheet text at column ' +
            (index + 1) +
            '.'
          );
        }
      });

      var preLastRow =
        storage.sheet.getLastRow();

      var expectedPhysicalEvidenceRow =
        preLastRow + 1;

      assertLockContext_(
        options.lockContext
      );

      writeState.writeAttempted = true;

      storage.sheet.appendRow(row);

      if (
        typeof SpreadsheetApp.flush !== 'function'
      ) {
        throw uncertain_(
          'SpreadsheetApp.flush is unavailable after v2 append.'
        );
      }

      SpreadsheetApp.flush();

      assertLockContext_(
        options.lockContext
      );

      var reread =
        openStorage_();

      if (
        reread.sheet.getLastRow() !==
        expectedPhysicalEvidenceRow
      ) {
        throw uncertain_(
          'Postappend v2 evidence sheet row count is uncertain.'
        );
      }

      var postRange =
        reread.sheet.getRange(
          expectedPhysicalEvidenceRow,
          1,
          1,
          HEADERS.length
        );

      var postValues =
        postRange.getValues();

      var postFormulas =
        postRange.getFormulas();

      if (
        !Array.isArray(postValues) ||
        postValues.length !== 1 ||
        !Array.isArray(postFormulas) ||
        postFormulas.length !== 1 ||
        postFormulas[0].some(
          function (formula) {
            return formula !== '';
          }
        ) ||
        !rowEquals_(
          postValues[0],
          row
        )
      ) {
        throw uncertain_(
          'Postappend v2 evidence row readback does not match the exact intended row.'
        );
      }

      var verifiedEvent =
        validateStoredRow_(
          helpers,
          postValues[0],
          postFormulas[0],
          expectedPhysicalEvidenceRow
        );

      if (
        verifiedEvent.evidenceEventId !==
          plan.evidenceEventId ||
        verifiedEvent.evidenceEventSha256 !==
          evidenceEventSha256 ||
        verifiedEvent.classifierResultSha256 !==
          plan.classifierResultSha256
      ) {
        throw uncertain_(
          'Postappend deterministic v2 evidence verification failed.'
        );
      }

      return {
        ok: true,
        outcome: VERIFIED,
        disposition: 'PERSISTED',
        observedAtUtc: observedAtUtc,
        classifierResultSha256:
          plan.classifierResultSha256,
        evidenceEventId:
          plan.evidenceEventId,
        evidenceEventSha256:
          evidenceEventSha256,
        physicalEvidenceRowNumber:
          expectedPhysicalEvidenceRow
      };
    } catch (error) {
      if (
        writeState &&
        writeState.writeAttempted === true
      ) {
        if (
          error &&
          error.persistenceClassification ===
            UNCERTAIN
        ) {
          throw error;
        }

        throw uncertain_(
          'Failure occurred after the v2 evidence append boundary was entered.',
          error
        );
      }

      if (
        error &&
        error.persistenceClassification ===
          PRECONDITION
      ) {
        throw error;
      }

      throw precondition_(
        'V2 evidence persistence precondition failed.',
        error
      );
    }
  }

  return Object.freeze({
    persist: persist,

    headers:
      function () {
        return HEADERS.slice();
      }
  });
})();
