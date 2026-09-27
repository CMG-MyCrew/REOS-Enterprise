var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationEvidenceStore = (function () {
  'use strict';

  var PROPERTY_KEY =
    'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

  var SHEET_NAME =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE';

  var GENESIS =
    'GENESIS';

  var PRECONDITION =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED';

  var UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN';

  var VERIFIED =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED';

  var ALREADY =
    'ABSENTEE_OWNER_CLASSIFICATION_ALREADY_PERSISTED';

  var BASIS =
    'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON';

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
    'Classifier Result SHA-256',
    'Previous Evidence SHA-256',
    'Evidence Event SHA-256'
  ]);

  var PERSISTABLE_OUTCOMES = Object.freeze({
    'ABSENTEE_OWNER_INDICATED':
      'MAILING_ADDRESS_DIFFERS',

    'OWNER_MAILING_MATCHED':
      'MAILING_ADDRESS_MATCHES',

    'INSUFFICIENT_CLASSIFICATION_EVIDENCE':
      'INSUFFICIENT_MAILING_EVIDENCE'
  });

  function own_(object, key) {
    return Object.prototype
      .hasOwnProperty
      .call(
        object,
        key
      );
  }

  function isPlainObject_(value) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return false;
    }

    var prototype =
      Object.getPrototypeOf(value);

    return (
      prototype === Object.prototype ||
      prototype === null
    );
  }

  function exactKeys_(
    object,
    expected
  ) {
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
      actual.every(
        function (key, index) {
          return key === allowed[index];
        }
      )
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
      error.cause =
        cause;
    }

    return error;
  }

  function precondition_(
    message,
    cause
  ) {
    return classifiedError_(
      PRECONDITION,
      message,
      cause
    );
  }

  function uncertain_(
    message,
    cause
  ) {
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
      !/[\u0000-\u001F\u007F]/.test(
        value
      ) &&
      !/^[=+\-@]/.test(
        value
      )
    );
  }

  function lowercaseSha_(value) {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{64}$/.test(
        value
      )
    );
  }

  function validObservedAt_(value) {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      return (
        new Date(value).toISOString() ===
        value
      );
    } catch (error) {
      return false;
    }
  }

  function assertDependencies_() {
    if (
      !REOS ||
      !REOS.Database ||
      typeof REOS.Database
        .assertScriptLockContext !==
        'function' ||
      !REOS
        .AbsenteeOwnerClassificationPersistencePlanner ||
      typeof REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .canonicalJson !==
        'function' ||
      typeof REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .hashCanonicalObject !==
        'function' ||
      typeof REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .evidenceEventIdFor !==
        'function'
    ) {
      throw precondition_(
        'Required persistence dependencies are unavailable.'
      );
    }
  }

  function assertLockContext_(
    lockContext
  ) {
    try {
      REOS.Database
        .assertScriptLockContext(
          lockContext
        );
    } catch (error) {
      throw precondition_(
        'Caller-owned ScriptLock context is invalid.',
        error
      );
    }
  }

  function configuredWorkbookId_() {
    if (
      typeof PropertiesService ===
        'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !==
        'function'
    ) {
      throw precondition_(
        'Script Properties are unavailable.'
      );
    }

    var properties =
      PropertiesService
        .getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !==
        'function'
    ) {
      throw precondition_(
        'Script Properties read access is unavailable.'
      );
    }

    var workbookId =
      String(
        properties.getProperty(
          PROPERTY_KEY
        ) ||
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
      typeof sheet.getLastRow !==
        'function' ||
      typeof sheet.getLastColumn !==
        'function' ||
      typeof sheet.getRange !==
        'function'
    ) {
      throw precondition_(
        'Evidence sheet APIs are unavailable.'
      );
    }

    if (
      sheet.getLastRow() < 1 ||
      sheet.getLastColumn() !==
        HEADERS.length
    ) {
      throw precondition_(
        'Evidence sheet geometry or exact 20-column schema is invalid.'
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
      typeof range.getFormulas ===
        'function'
        ? range.getFormulas()
        : null;

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      values[0].length !==
        HEADERS.length
    ) {
      throw precondition_(
        'Evidence header readback is invalid.'
      );
    }

    for (
      var index = 0;
      index < HEADERS.length;
      index++
    ) {
      if (
        values[0][index] !==
        HEADERS[index]
      ) {
        throw precondition_(
          'Evidence header mismatch at column ' +
          (index + 1) +
          '.'
        );
      }
    }

    if (
      !formulas ||
      formulas.length !== 1 ||
      formulas[0].length !==
        HEADERS.length
    ) {
      throw precondition_(
        'Evidence header formula readback is unavailable.'
      );
    }

    if (
      formulas[0].some(
        function (formula) {
          return formula !== '';
        }
      )
    ) {
      throw precondition_(
        'Evidence headers must not contain formulas.'
      );
    }
  }

  function openStorage_() {
    if (
      typeof SpreadsheetApp ===
        'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp
        .getActiveSpreadsheet !==
        'function' ||
      typeof SpreadsheetApp
        .openById !==
        'function'
    ) {
      throw precondition_(
        'SpreadsheetApp storage APIs are unavailable.'
      );
    }

    var workbookId =
      configuredWorkbookId_();

    var active =
      SpreadsheetApp
        .getActiveSpreadsheet();

    if (
      !active ||
      typeof active.getId !==
        'function'
    ) {
      throw precondition_(
        'Active REOS spreadsheet identity is unavailable.'
      );
    }

    if (
      String(
        active.getId()
      ) ===
      workbookId
    ) {
      throw precondition_(
        'Classification evidence workbook must be separate from active REOS acquisition data.'
      );
    }

    var workbook;

    try {
      workbook =
        SpreadsheetApp
          .openById(
            workbookId
          );
    } catch (error) {
      throw precondition_(
        'Configured classification evidence workbook cannot be opened.',
        error
      );
    }

    if (
      !workbook ||
      typeof workbook.getSheetByName !==
        'function'
    ) {
      throw precondition_(
        'Configured classification evidence workbook is invalid.'
      );
    }

    var sheet =
      workbook.getSheetByName(
        SHEET_NAME
      );

    if (!sheet) {
      throw precondition_(
        'Classification evidence sheet is not provisioned.'
      );
    }

    validateHeaders_(sheet);

    return {
      workbookId:
        workbookId,

      workbook:
        workbook,

      sheet:
        sheet
    };
  }

  function canonicalJsonEquals_(
    text,
    expectedType
  ) {
    if (typeof text !== 'string') {
      return false;
    }

    try {
      var parsed =
        JSON.parse(text);

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
        REOS
          .AbsenteeOwnerClassificationPersistencePlanner
          .canonicalJson(parsed) ===
        text
      );
    } catch (error) {
      return false;
    }
  }

  function validateAddressJson_(text) {
    if (
      !canonicalJsonEquals_(
        text,
        'object'
      )
    ) {
      return false;
    }

    var value =
      JSON.parse(text);

    var fields = [
      'street',
      'city',
      'state',
      'zip'
    ];

    return (
      exactKeys_(
        value,
        fields
      ) &&
      fields.every(
        function (field) {
          return typeof value[field] ===
            'string';
        }
      )
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
    row,
    formulas,
    physicalRowNumber
  ) {
    if (
      !Array.isArray(row) ||
      row.length !== HEADERS.length
    ) {
      throw precondition_(
        'Stored evidence row must contain exactly 20 cells.'
      );
    }

    if (
      !Array.isArray(formulas) ||
      formulas.length !==
        HEADERS.length
    ) {
      throw precondition_(
        'Stored evidence formula readback is invalid.'
      );
    }

    if (
      formulas.some(
        function (formula) {
          return formula !== '';
        }
      )
    ) {
      throw precondition_(
        'Stored evidence rows must not contain formulas.'
      );
    }

    row.forEach(
      function (value, index) {
        if (
          typeof value === 'string' &&
          !safeText_(value)
        ) {
          throw precondition_(
            'Stored evidence contains unsafe spreadsheet text at column ' +
            (index + 1) +
            '.'
          );
        }
      }
    );

    if (
      typeof physicalRowNumber !==
        'number' ||
      !isFinite(physicalRowNumber) ||
      physicalRowNumber < 2
    ) {
      throw precondition_(
        'Stored evidence physical row is invalid.'
      );
    }

    if (
      typeof row[0] !== 'string' ||
      !/^AOCE-[0-9a-f]{64}$/.test(
        row[0]
      )
    ) {
      throw precondition_(
        'Stored Evidence Event ID is invalid.'
      );
    }

    if (!validObservedAt_(row[1])) {
      throw precondition_(
        'Stored Observed At UTC is invalid.'
      );
    }

    if (
      row[2] !== 1 ||
      row[3] !== 1
    ) {
      throw precondition_(
        'Stored contract versions are invalid.'
      );
    }

    if (
      !safeText_(row[4]) ||
      !safeText_(row[5])
    ) {
      throw precondition_(
        'Stored dual identity is invalid or unsafe.'
      );
    }

    if (
      typeof row[6] !== 'number' ||
      !isFinite(row[6]) ||
      Math.floor(row[6]) !==
        row[6] ||
      row[6] < 2
    ) {
      throw precondition_(
        'Stored target physical row number is invalid.'
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
        ]
    ) {
      throw precondition_(
        'Stored classification semantics are invalid.'
      );
    }

    if (
      row[7] ===
      'ABSENTEE_OWNER_INDICATED'
    ) {
      if (
        !canonicalJsonEquals_(
          row[10],
          'array'
        ) ||
        JSON.parse(row[10])
          .length === 0
      ) {
        throw precondition_(
          'Stored differing-components evidence is invalid.'
        );
      }
    } else if (
      row[7] ===
      'OWNER_MAILING_MATCHED'
    ) {
      if (row[10] !== '[]') {
        throw precondition_(
          'Stored matched differing-components evidence must be [].'
        );
      }
    } else if (
      row[10] !== 'null'
    ) {
      throw precondition_(
        'Stored insufficient differing-components evidence must be null.'
      );
    }

    if (
      !validateAddressJson_(row[11]) ||
      !validateAddressJson_(row[12])
    ) {
      throw precondition_(
        'Stored normalized address JSON is invalid.'
      );
    }

    if (
      row[13] !==
        SOURCE_AGENCY ||
      row[14] !==
        SOURCE_DATASET ||
      row[15] !==
        SOURCE_TABLE ||
      row[16] !==
        SOURCE_ENDPOINT
    ) {
      throw precondition_(
        'Stored source provenance is invalid.'
      );
    }

    if (!lowercaseSha_(row[17])) {
      throw precondition_(
        'Stored Classifier Result SHA-256 is invalid.'
      );
    }

    if (
      !(
        row[18] === GENESIS ||
        lowercaseSha_(row[18])
      )
    ) {
      throw precondition_(
        'Stored Previous Evidence SHA-256 is invalid.'
      );
    }

    if (!lowercaseSha_(row[19])) {
      throw precondition_(
        'Stored Evidence Event SHA-256 is invalid.'
      );
    }

    var expectedEventId =
      REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .evidenceEventIdFor({
          persistenceContractVersion:
            row[2],

          classificationContractVersion:
            row[3],

          distressLeadId:
            row[4],

          canonicalPropertyKey:
            row[5],

          classifierResultSha256:
            row[17]
        });

    if (
      row[0] !==
      expectedEventId
    ) {
      throw precondition_(
        'Stored Evidence Event ID is not deterministic.'
      );
    }

    var expectedEventSha =
      REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .hashCanonicalObject(
          eventPayloadFromRow_(row)
        );

    if (
      row[19] !==
      expectedEventSha
    ) {
      throw precondition_(
        'Stored Evidence Event SHA-256 is invalid.'
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
        row[17],

      previousEvidenceSha256:
        row[18],

      evidenceEventSha256:
        row[19]
    };
  }

  function exactIdentityHistory_(
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
        .createTextFinder !==
        'function'
    ) {
      throw precondition_(
        'Evidence history TextFinder support is unavailable.'
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
        'Evidence history TextFinder is invalid.'
      );
    }

    finder.matchEntireCell(true);

    var matches =
      finder.findAll();

    if (!Array.isArray(matches)) {
      throw precondition_(
        'Evidence history TextFinder result is invalid.'
      );
    }

    var physicalRows = [];
    var seenRows = {};

    matches.forEach(
      function (match) {
        if (
          !match ||
          typeof match.getRow !==
            'function'
        ) {
          throw precondition_(
            'Evidence history TextFinder match is invalid.'
          );
        }

        var rowNumber =
          match.getRow();

        if (
          typeof rowNumber !==
            'number' ||
          !isFinite(rowNumber) ||
          Math.floor(rowNumber) !==
            rowNumber ||
          rowNumber < 2 ||
          rowNumber > lastRow ||
          seenRows[rowNumber]
        ) {
          throw precondition_(
            'Evidence history TextFinder row is invalid or duplicated.'
          );
        }

        seenRows[rowNumber] =
          true;

        physicalRows.push(
          rowNumber
        );
      }
    );

    physicalRows.sort(
      function (left, right) {
        return left - right;
      }
    );

    var history = [];

    physicalRows.forEach(
      function (rowNumber) {
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
          !values ||
          values.length !== 1 ||
          !formulas ||
          formulas.length !== 1
        ) {
          throw precondition_(
            'Evidence history row readback is invalid.'
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
            'Evidence history identity mismatch.'
          );
        }

        history.push(event);
      }
    );

    var seenClassifierHashes = {};

    history.forEach(
      function (event, index) {
        var expectedPrevious =
          index === 0
            ? GENESIS
            : history[index - 1]
              .evidenceEventSha256;

        if (
          event
            .previousEvidenceSha256 !==
          expectedPrevious
        ) {
          throw precondition_(
            'Evidence history hash chain is invalid.'
          );
        }

        if (
          seenClassifierHashes[
            event.classifierResultSha256
          ]
        ) {
          throw precondition_(
            'Evidence history contains a duplicate classifier-result hash.'
          );
        }

        seenClassifierHashes[
          event.classifierResultSha256
        ] = true;
      }
    );

    return history;
  }

  function validatePlan_(plan) {
    var fields = [
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
      'classifierResultSha256',
      'evidenceEventId'
    ];

    if (
      !exactKeys_(
        plan,
        fields
      ) ||
      plan.ok !== true
    ) {
      throw precondition_(
        'Persistence plan shape is invalid.'
      );
    }

    if (
      !exactKeys_(
        plan.target,
        [
          'rowNumber',
          'identity'
        ]
      )
    ) {
      throw precondition_(
        'Persistence plan target is invalid.'
      );
    }

    if (
      !exactKeys_(
        plan.target.identity,
        [
          'Distress Lead ID',
          'Canonical Property Key'
        ]
      )
    ) {
      throw precondition_(
        'Persistence plan identity is invalid.'
      );
    }

    if (
      plan.persistenceContractVersion !==
        1 ||
      plan.classificationContractVersion !==
        1 ||
      !safeText_(
        plan.target
          .identity['Distress Lead ID']
      ) ||
      !safeText_(
        plan.target
          .identity['Canonical Property Key']
      ) ||
      typeof plan.target.rowNumber !==
        'number' ||
      !isFinite(
        plan.target.rowNumber
      ) ||
      Math.floor(
        plan.target.rowNumber
      ) !==
        plan.target.rowNumber ||
      plan.target.rowNumber < 2 ||
      !own_(
        PERSISTABLE_OUTCOMES,
        plan.classificationOutcome
      ) ||
      plan.classificationBasis !==
        BASIS ||
      plan.upstreamComparisonOutcome !==
        PERSISTABLE_OUTCOMES[
          plan.classificationOutcome
        ] ||
      plan.sourceAgency !==
        SOURCE_AGENCY ||
      plan.sourceDataset !==
        SOURCE_DATASET ||
      plan.sourceTable !==
        SOURCE_TABLE ||
      plan.sourceEndpoint !==
        SOURCE_ENDPOINT ||
      !lowercaseSha_(
        plan.classifierResultSha256
      ) ||
      !/^AOCE-[0-9a-f]{64}$/.test(
        plan.evidenceEventId
      )
    ) {
      throw precondition_(
        'Persistence plan values are invalid.'
      );
    }

    if (
      plan.classificationOutcome ===
      'ABSENTEE_OWNER_INDICATED'
    ) {
      if (
        !canonicalJsonEquals_(
          plan.differingComponentsJson,
          'array'
        ) ||
        JSON.parse(
          plan.differingComponentsJson
        ).length === 0
      ) {
        throw precondition_(
          'Persistence plan differing-components JSON is invalid.'
        );
      }
    } else if (
      plan.classificationOutcome ===
      'OWNER_MAILING_MATCHED'
    ) {
      if (
        plan.differingComponentsJson !==
        '[]'
      ) {
        throw precondition_(
          'Matched persistence plan must use [] differing-components JSON.'
        );
      }
    } else if (
      plan.differingComponentsJson !==
      'null'
    ) {
      throw precondition_(
        'Insufficient persistence plan must use null differing-components JSON.'
      );
    }

    if (
      !validateAddressJson_(
        plan.normalizedPropertyAddressJson
      ) ||
      !validateAddressJson_(
        plan.normalizedMailingAddressJson
      )
    ) {
      throw precondition_(
        'Persistence plan normalized-address JSON is invalid.'
      );
    }

    var expectedId =
      REOS
        .AbsenteeOwnerClassificationPersistencePlanner
        .evidenceEventIdFor({
          persistenceContractVersion:
            1,

          classificationContractVersion:
            1,

          distressLeadId:
            plan.target
              .identity['Distress Lead ID'],

          canonicalPropertyKey:
            plan.target
              .identity['Canonical Property Key'],

          classifierResultSha256:
            plan.classifierResultSha256
        });

    if (
      plan.evidenceEventId !==
      expectedId
    ) {
      throw precondition_(
        'Persistence plan Evidence Event ID is invalid.'
      );
    }
  }

  function rowEquals_(
    left,
    right
  ) {
    return (
      left.length === right.length &&
      left.every(
        function (value, index) {
          return value === right[index];
        }
      )
    );
  }

  function persist(
    plan,
    options
  ) {
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
          'Evidence store options are invalid.'
        );
      }

      if (
        !isPlainObject_(
          writeState
        ) ||
        writeState
          .writeAttempted !==
          false
      ) {
        throw precondition_(
          'Evidence store write-state token is invalid.'
        );
      }

      assertLockContext_(
        options.lockContext
      );

      validatePlan_(plan);

      var storage =
        openStorage_();

      assertLockContext_(
        options.lockContext
      );

      var distressLeadId =
        plan.target
          .identity[
            'Distress Lead ID'
          ];

      var canonicalPropertyKey =
        plan.target
          .identity[
            'Canonical Property Key'
          ];

      var history =
        exactIdentityHistory_(
          storage.sheet,
          distressLeadId,
          canonicalPropertyKey
        );

      for (
        var historyIndex = 0;
        historyIndex <
          history.length;
        historyIndex++
      ) {
        if (
          history[
            historyIndex
          ].classifierResultSha256 ===
          plan.classifierResultSha256
        ) {
          return {
            ok: true,

            outcome:
              ALREADY,

            disposition:
              'ALREADY_PERSISTED',

            classifierResultSha256:
              plan.classifierResultSha256,

            evidenceEventId:
              history[
                historyIndex
              ].evidenceEventId,

            evidenceEventSha256:
              history[
                historyIndex
              ].evidenceEventSha256,

            physicalEvidenceRowNumber:
              history[
                historyIndex
              ].physicalEvidenceRowNumber
          };
        }
      }

      var observedAtUtc =
        new Date()
          .toISOString();

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

        'Classifier Result SHA-256':
          plan.classifierResultSha256,

        'Previous Evidence SHA-256':
          previousEvidenceSha256
      };

      var evidenceEventSha256 =
        REOS
          .AbsenteeOwnerClassificationPersistencePlanner
          .hashCanonicalObject(
            payload
          );

      var row =
        HEADERS
          .slice(
            0,
            19
          )
          .map(
            function (header) {
              return payload[header];
            }
          );

      row.push(
        evidenceEventSha256
      );

      row.forEach(
        function (value, index) {
          if (
            typeof value ===
              'string' &&
            !safeText_(value)
          ) {
            throw precondition_(
              'New evidence contains unsafe spreadsheet text at column ' +
              (index + 1) +
              '.'
            );
          }
        }
      );

      var preLastRow =
        storage.sheet
          .getLastRow();

      var expectedPhysicalEvidenceRow =
        preLastRow + 1;

      assertLockContext_(
        options.lockContext
      );

      writeState.writeAttempted =
        true;

      storage.sheet
        .appendRow(row);

      if (
        typeof SpreadsheetApp.flush !==
        'function'
      ) {
        throw uncertain_(
          'SpreadsheetApp.flush is unavailable after append.'
        );
      }

      SpreadsheetApp.flush();

      assertLockContext_(
        options.lockContext
      );

      var reread =
        openStorage_();

      if (
        reread.sheet
          .getLastRow() !==
        expectedPhysicalEvidenceRow
      ) {
        throw uncertain_(
          'Postappend evidence sheet row count is uncertain.'
        );
      }

      var postRange =
        reread.sheet
          .getRange(
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
        !postValues ||
        postValues.length !== 1 ||
        !postFormulas ||
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
          'Postappend evidence row readback does not match the exact intended row.'
        );
      }

      var verifiedEvent =
        validateStoredRow_(
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
          'Postappend deterministic evidence verification failed.'
        );
      }

      return {
        ok: true,

        outcome:
          VERIFIED,

        disposition:
          'PERSISTED',

        observedAtUtc:
          observedAtUtc,

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
        writeState.writeAttempted ===
          true
      ) {
        if (
          error &&
          error.persistenceClassification ===
            UNCERTAIN
        ) {
          throw error;
        }

        throw uncertain_(
          'Failure occurred after the evidence append boundary was entered.',
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
        'Evidence persistence precondition failed.',
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
