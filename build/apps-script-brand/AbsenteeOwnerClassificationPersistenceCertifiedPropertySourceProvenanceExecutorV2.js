var REOS = REOS || {};

REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2 = (function () {
  'use strict';

  var PROPERTY_KEY =
    'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID';

  var V1_SHEET_NAME =
    'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE';

  var GENESIS =
    'GENESIS';

  var PRECONDITION =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED';

  var UNCERTAIN =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN';

  var VERIFIED =
    'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED';

  var ALREADY =
    'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED';

  var V1_EQUIVALENT =
    'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION';

  var V1_HEADERS = Object.freeze([
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

  var V1_BASIS =
    'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON';

  var V1_SOURCE_AGENCY =
    'Philadelphia Office of Property Assessment';

  var V1_SOURCE_DATASET =
    'Philadelphia Properties and Assessment History';

  var V1_SOURCE_TABLE =
    'opa_properties_public';

  var V1_SOURCE_ENDPOINT =
    'https://phl.carto.com/api/v2/sql';

  var V1_PERSISTABLE_OUTCOMES = Object.freeze({
    'ABSENTEE_OWNER_INDICATED':
      'MAILING_ADDRESS_DIFFERS',

    'OWNER_MAILING_MATCHED':
      'MAILING_ADDRESS_MATCHES',

    'INSUFFICIENT_CLASSIFICATION_EVIDENCE':
      'INSUFFICIENT_MAILING_EVIDENCE'
  });

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
      ownerOccupancyAuthorityGranted: false,
      vacancyAuthorityGranted: false,
      qualifiedDealQueueAuthorityGranted: false,
      acquisitionLifecycleAuthorityGranted: false,
      arvAuthorityGranted: false,
      repairScopeAuthorityGranted: false,
      maoAuthorityGranted: false,
      offerGenerationAuthorityGranted: false,
      offerSubmissionAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  function attachAuthority_(result) {
    var authority =
      authority_();

    Object.keys(authority)
      .forEach(function (key) {
        result[key] =
          authority[key];
      });

    return result;
  }

  function failure_(
    outcome,
    stage,
    code,
    message
  ) {
    var result =
      attachAuthority_({
        ok: false,
        outcome: outcome,
        stage: stage,
        code: code,
        message: message
      });

    return result;
  }

  function preconditionError_(
    code,
    message,
    cause
  ) {
    var error =
      new Error(
        PRECONDITION +
        ': ' +
        message
      );

    error.persistenceClassification =
      PRECONDITION;

    error.code =
      code;

    if (
      cause !== undefined &&
      cause !== null
    ) {
      error.cause =
        cause;
    }

    return error;
  }

  function own_(object, key) {
    return Object.prototype
      .hasOwnProperty
      .call(
        object,
        key
      );
  }

  function lowercaseSha_(value) {
    return (
      typeof value === 'string' &&
      /^[0-9a-f]{64}$/.test(value)
    );
  }

  function safeIdentityText_(value) {
    return (
      typeof value === 'string' &&
      value !== '' &&
      !/[\u0000-\u001F\u007F]/.test(value) &&
      !/^[=+\-@]/.test(value)
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
      actual.every(function (
        key,
        index
      ) {
        return key === allowed[index];
      })
    );
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
      fields.every(function (field) {
        return typeof value[field] ===
          'string';
      })
    );
  }

  function validIsoTimestamp_(value) {
    if (
      typeof value !== 'string' ||
      value === ''
    ) {
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

  function exactArray_(left, right) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every(function (value, index) {
        return value === right[index];
      })
    );
  }

  function dependenciesAvailable_() {
    return !!(
      REOS &&
      REOS.Database &&
      typeof REOS.Database.withScriptLockContext === 'function' &&
      typeof REOS.Database.assertScriptLockContext === 'function' &&
      REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2 &&
      typeof REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.prepare === 'function' &&
      REOS.AbsenteeOwnerClassificationEvidenceStoreV2 &&
      typeof REOS.AbsenteeOwnerClassificationEvidenceStoreV2.persist === 'function' &&
      REOS.AbsenteeOwnerClassificationEvidenceStore &&
      typeof REOS.AbsenteeOwnerClassificationEvidenceStore.headers === 'function' &&
      REOS.AbsenteeOwnerClassificationPersistencePlanner &&
      typeof REOS.AbsenteeOwnerClassificationPersistencePlanner.evidenceEventIdFor === 'function' &&
      typeof REOS.AbsenteeOwnerClassificationPersistencePlanner.canonicalJson === 'function' &&
      typeof REOS.AbsenteeOwnerClassificationPersistencePlanner.hashCanonicalObject === 'function' &&
      typeof PropertiesService !== 'undefined' &&
      PropertiesService &&
      typeof PropertiesService.getScriptProperties === 'function' &&
      typeof SpreadsheetApp !== 'undefined' &&
      SpreadsheetApp &&
      typeof SpreadsheetApp.getActiveSpreadsheet === 'function' &&
      typeof SpreadsheetApp.openById === 'function'
    );
  }

  function assertLockContext_(lockContext) {
    try {
      REOS.Database
        .assertScriptLockContext(
          lockContext
        );
    } catch (error) {
      throw preconditionError_(
        'INVALID_SCRIPT_LOCK_CONTEXT',
        'Caller-owned ScriptLock context is invalid.',
        error
      );
    }
  }

  function configuredWorkbookId_() {
    var properties =
      PropertiesService
        .getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !== 'function'
    ) {
      throw preconditionError_(
        'SCRIPT_PROPERTIES_READ_UNAVAILABLE',
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
      !safeIdentityText_(
        workbookId
      )
    ) {
      throw preconditionError_(
        'V1_EVIDENCE_WORKBOOK_UNCONFIGURED',
        'Classification evidence workbook ID is missing or unsafe.'
      );
    }

    return workbookId;
  }

  function validateV1Headers_(sheet) {
    var exportedHeaders =
      REOS.AbsenteeOwnerClassificationEvidenceStore
        .headers();

    if (
      !exactArray_(
        exportedHeaders,
        V1_HEADERS
      )
    ) {
      throw preconditionError_(
        'V1_HEADER_CONTRACT_EXPORT_INVALID',
        'Certified V1 evidence-store header contract is invalid.'
      );
    }

    if (
      !sheet ||
      typeof sheet.getLastRow !== 'function' ||
      typeof sheet.getLastColumn !== 'function' ||
      typeof sheet.getRange !== 'function'
    ) {
      throw preconditionError_(
        'V1_SHEET_API_INVALID',
        'V1 evidence sheet APIs are unavailable.'
      );
    }

    if (
      sheet.getLastRow() < 1 ||
      sheet.getLastColumn() !==
        V1_HEADERS.length
    ) {
      throw preconditionError_(
        'V1_SCHEMA_INVALID',
        'V1 evidence sheet geometry or exact 20-column schema is invalid.'
      );
    }

    var headerRange =
      sheet.getRange(
        1,
        1,
        1,
        V1_HEADERS.length
      );

    var values =
      headerRange.getValues();

    var formulas =
      headerRange.getFormulas();

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      !Array.isArray(values[0]) ||
      !exactArray_(
        values[0],
        V1_HEADERS
      ) ||
      !Array.isArray(formulas) ||
      formulas.length !== 1 ||
      !Array.isArray(formulas[0]) ||
      formulas[0].length !==
        V1_HEADERS.length
    ) {
      throw preconditionError_(
        'V1_SCHEMA_INVALID',
        'V1 evidence header readback does not match the exact contract.'
      );
    }

    if (
      formulas[0].some(function (formula) {
        return formula !== '';
      })
    ) {
      throw preconditionError_(
        'V1_HEADER_FORMULA_PRESENT',
        'V1 evidence headers must be formula-free.'
      );
    }
  }

  function openV1Storage_(lockContext) {
    assertLockContext_(
      lockContext
    );

    var workbookId =
      configuredWorkbookId_();

    var active =
      SpreadsheetApp
        .getActiveSpreadsheet();

    if (
      !active ||
      typeof active.getId !== 'function'
    ) {
      throw preconditionError_(
        'ACTIVE_REOS_IDENTITY_UNAVAILABLE',
        'Active REOS spreadsheet identity is unavailable.'
      );
    }

    if (
      String(
        active.getId()
      ) ===
      workbookId
    ) {
      throw preconditionError_(
        'UNSAFE_ACTIVE_REOS_ALIAS',
        'V1 classification evidence workbook must remain separate from active REOS acquisition data.'
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
      throw preconditionError_(
        'V1_EVIDENCE_WORKBOOK_UNOPENABLE',
        'Configured V1 classification evidence workbook cannot be opened.',
        error
      );
    }

    if (
      !workbook ||
      typeof workbook.getSheetByName !== 'function'
    ) {
      throw preconditionError_(
        'V1_EVIDENCE_WORKBOOK_INVALID',
        'Configured V1 classification evidence workbook is invalid.'
      );
    }

    var sheet =
      workbook.getSheetByName(
        V1_SHEET_NAME
      );

    if (!sheet) {
      throw preconditionError_(
        'V1_EVIDENCE_SHEET_MISSING',
        'V1 classification evidence sheet is missing.'
      );
    }

    validateV1Headers_(
      sheet
    );

    return {
      workbookId:
        workbookId,

      sheet:
        sheet
    };
  }

  function eventPayloadFromRow_(row) {
    var payload = {};

    for (
      var index = 0;
      index < V1_HEADERS.length - 1;
      index++
    ) {
      payload[
        V1_HEADERS[index]
      ] =
        row[index];
    }

    return payload;
  }

  function validateRetainedV1Row_(
    row,
    formulas,
    physicalEvidenceRowNumber,
    distressLeadId,
    canonicalPropertyKey
  ) {
    if (
      !Array.isArray(row) ||
      row.length !==
        V1_HEADERS.length ||
      !Array.isArray(formulas) ||
      formulas.length !==
        V1_HEADERS.length
    ) {
      throw preconditionError_(
        'V1_HISTORY_ROW_INVALID',
        'Retained V1 evidence row must contain exactly 20 values and 20 formula readbacks.'
      );
    }

    if (
      formulas.some(function (formula) {
        return formula !== '';
      })
    ) {
      throw preconditionError_(
        'V1_HISTORY_FORMULA_PRESENT',
        'Retained V1 evidence rows must be formula-free.'
      );
    }

    row.forEach(function (
      value,
      index
    ) {
      if (
        typeof value === 'string' &&
        !safeIdentityText_(value)
      ) {
        throw preconditionError_(
          'V1_HISTORY_UNSAFE_TEXT',
          'Retained V1 evidence contains unsafe spreadsheet text at column ' +
          (index + 1) +
          '.'
        );
      }
    });

    if (
      !Number.isInteger(
        physicalEvidenceRowNumber
      ) ||
      physicalEvidenceRowNumber < 2
    ) {
      throw preconditionError_(
        'V1_HISTORY_PHYSICAL_ROW_INVALID',
        'Retained V1 evidence physical row is invalid.'
      );
    }

    if (
      row[2] !== 1 ||
      row[3] !== 1
    ) {
      throw preconditionError_(
        'V1_CONTRACT_VERSION_INVALID',
        'Retained V1 evidence must use persistence/classification contract versions 1/1.'
      );
    }

    if (
      row[4] !== distressLeadId ||
      row[5] !== canonicalPropertyKey ||
      !safeIdentityText_(row[4]) ||
      !safeIdentityText_(row[5])
    ) {
      throw preconditionError_(
        'V1_DUAL_IDENTITY_INVALID',
        'Retained V1 evidence dual identity is invalid.'
      );
    }

    if (
      !Number.isInteger(row[6]) ||
      row[6] < 2
    ) {
      throw preconditionError_(
        'V1_TARGET_PHYSICAL_ROW_INVALID',
        'Retained V1 target physical row number is invalid.'
      );
    }

    if (
      typeof row[0] !== 'string' ||
      !/^AOCE-[0-9a-f]{64}$/.test(
        row[0]
      )
    ) {
      throw preconditionError_(
        'V1_EVENT_ID_INVALID',
        'Retained V1 Evidence Event ID is invalid.'
      );
    }

    if (
      !validIsoTimestamp_(
        row[1]
      )
    ) {
      throw preconditionError_(
        'V1_OBSERVED_AT_INVALID',
        'Retained V1 Observed At UTC is invalid.'
      );
    }

    if (
      !own_(
        V1_PERSISTABLE_OUTCOMES,
        row[7]
      ) ||
      row[8] !== V1_BASIS ||
      row[9] !==
        V1_PERSISTABLE_OUTCOMES[
          row[7]
        ]
    ) {
      throw preconditionError_(
        'V1_CLASSIFICATION_SEMANTICS_INVALID',
        'Retained V1 classification outcome, basis, or upstream comparison outcome is invalid.'
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
        JSON.parse(
          row[10]
        ).length === 0
      ) {
        throw preconditionError_(
          'V1_DIFFERING_COMPONENTS_INVALID',
          'Retained V1 differing-components evidence is invalid.'
        );
      }
    } else if (
      row[7] ===
      'OWNER_MAILING_MATCHED'
    ) {
      if (row[10] !== '[]') {
        throw preconditionError_(
          'V1_DIFFERING_COMPONENTS_INVALID',
          'Retained V1 matched differing-components evidence must be [].'
        );
      }
    } else if (
      row[10] !== 'null'
    ) {
      throw preconditionError_(
        'V1_DIFFERING_COMPONENTS_INVALID',
        'Retained V1 insufficient differing-components evidence must be null.'
      );
    }

    if (
      !validateAddressJson_(
        row[11]
      ) ||
      !validateAddressJson_(
        row[12]
      )
    ) {
      throw preconditionError_(
        'V1_NORMALIZED_ADDRESS_JSON_INVALID',
        'Retained V1 normalized address JSON is invalid.'
      );
    }

    if (
      row[13] !==
        V1_SOURCE_AGENCY ||
      row[14] !==
        V1_SOURCE_DATASET ||
      row[15] !==
        V1_SOURCE_TABLE ||
      row[16] !==
        V1_SOURCE_ENDPOINT
    ) {
      throw preconditionError_(
        'V1_SOURCE_PROVENANCE_INVALID',
        'Retained V1 source provenance is invalid.'
      );
    }

    if (
      !lowercaseSha_(
        row[17]
      )
    ) {
      throw preconditionError_(
        'V1_CLASSIFIER_RESULT_SHA_INVALID',
        'Retained V1 Classifier Result SHA-256 is invalid.'
      );
    }

    if (
      row[18] !== GENESIS &&
      !lowercaseSha_(row[18])
    ) {
      throw preconditionError_(
        'V1_PREVIOUS_EVIDENCE_SHA_INVALID',
        'Retained V1 Previous Evidence SHA-256 is invalid.'
      );
    }

    if (
      !lowercaseSha_(
        row[19]
      )
    ) {
      throw preconditionError_(
        'V1_EVENT_SHA_INVALID',
        'Retained V1 Evidence Event SHA-256 is invalid.'
      );
    }

    var expectedEventId =
      REOS.AbsenteeOwnerClassificationPersistencePlanner
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
      throw preconditionError_(
        'V1_EVENT_ID_NONDETERMINISTIC',
        'Retained V1 Evidence Event ID is not deterministic.'
      );
    }

    var expectedEventSha =
      REOS.AbsenteeOwnerClassificationPersistencePlanner
        .hashCanonicalObject(
          eventPayloadFromRow_(
            row
          )
        );

    if (
      row[19] !==
      expectedEventSha
    ) {
      throw preconditionError_(
        'V1_EVENT_HASH_INVALID',
        'Retained V1 Evidence Event SHA-256 does not match the canonical event payload.'
      );
    }

    return {
      physicalEvidenceRowNumber:
        physicalEvidenceRowNumber,

      evidenceEventId:
        row[0],

      classifierResultSha256:
        row[17],

      previousEvidenceSha256:
        row[18],

      evidenceEventSha256:
        row[19]
    };
  }

  function reconcileV1Equivalent_(
    plan,
    lockContext
  ) {
    assertLockContext_(
      lockContext
    );

    var storage =
      openV1Storage_(
        lockContext
      );

    var sheet =
      storage.sheet;

    var lastRow =
      sheet.getLastRow();

    if (lastRow < 2) {
      return {
        equivalent:
          false
      };
    }

    var distressLeadId =
      plan.target.identity[
        'Distress Lead ID'
      ];

    var canonicalPropertyKey =
      plan.target.identity[
        'Canonical Property Key'
      ];

    var searchRange =
      sheet.getRange(
        2,
        5,
        lastRow - 1,
        1
      );

    if (
      !searchRange ||
      typeof searchRange.createTextFinder !== 'function'
    ) {
      throw preconditionError_(
        'V1_TEXT_FINDER_UNAVAILABLE',
        'Bounded V1 Distress Lead ID TextFinder is unavailable.'
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
      throw preconditionError_(
        'V1_TEXT_FINDER_INVALID',
        'Bounded V1 Distress Lead ID TextFinder is invalid.'
      );
    }

    finder.matchEntireCell(
      true
    );

    var matches =
      finder.findAll();

    if (
      !Array.isArray(matches)
    ) {
      throw preconditionError_(
        'V1_TEXT_FINDER_RESULT_INVALID',
        'Bounded V1 TextFinder result is invalid.'
      );
    }

    var physicalRows = [];
    var seenRows = {};

    matches.forEach(function (match) {
      if (
        !match ||
        typeof match.getRow !== 'function'
      ) {
        throw preconditionError_(
          'V1_TEXT_FINDER_MATCH_INVALID',
          'Bounded V1 TextFinder match is invalid.'
        );
      }

      var rowNumber =
        match.getRow();

      if (
        !Number.isInteger(
          rowNumber
        ) ||
        rowNumber < 2 ||
        rowNumber > lastRow ||
        seenRows[rowNumber]
      ) {
        throw preconditionError_(
          'V1_TEXT_FINDER_ROW_INVALID',
          'Bounded V1 TextFinder row is invalid or duplicated.'
        );
      }

      seenRows[rowNumber] =
        true;

      physicalRows.push(
        rowNumber
      );
    });

    physicalRows.sort(function (
      left,
      right
    ) {
      return left - right;
    });

    var history = [];

    physicalRows.forEach(function (
      rowNumber
    ) {
      var range =
        sheet.getRange(
          rowNumber,
          1,
          1,
          V1_HEADERS.length
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
          V1_HEADERS.length ||
        !Array.isArray(formulas) ||
        formulas.length !== 1 ||
        !Array.isArray(formulas[0]) ||
        formulas[0].length !==
          V1_HEADERS.length
      ) {
        throw preconditionError_(
          'V1_HISTORY_ROW_READBACK_INVALID',
          'Bounded V1 history row readback is invalid.'
        );
      }

      /*
       * Distress Lead ID was selected by an exact-cell TextFinder.
       * Canonical Property Key is the second half of the dual identity.
       * Only exact dual-identity rows become retained V1 history.
       */
      if (
        values[0][5] !==
        canonicalPropertyKey
      ) {
        return;
      }

      history.push(
        validateRetainedV1Row_(
          values[0],
          formulas[0],
          rowNumber,
          distressLeadId,
          canonicalPropertyKey
        )
      );
    });

    var seenEventIds = {};

    history.forEach(function (
      event,
      index
    ) {
      var expectedPrevious =
        index === 0
          ? GENESIS
          : history[
            index - 1
          ].evidenceEventSha256;

      if (
        event.previousEvidenceSha256 !==
        expectedPrevious
      ) {
        throw preconditionError_(
          'V1_HISTORY_HASH_CHAIN_INVALID',
          'Retained V1 evidence hash chain is invalid.'
        );
      }

      if (
        seenEventIds[
          event.evidenceEventId
        ]
      ) {
        throw preconditionError_(
          'V1_HISTORY_DUPLICATE_EVENT_ID',
          'Retained V1 evidence contains a duplicate deterministic event ID.'
        );
      }

      seenEventIds[
        event.evidenceEventId
      ] =
        true;
    });

    for (
      var index = 0;
      index < history.length;
      index++
    ) {
      if (
        history[index]
          .classifierResultSha256 ===
        plan.classifierResultSha256
      ) {
        return {
          equivalent:
            true,

          event:
            history[index]
        };
      }
    }

    return {
      equivalent:
        false
    };
  }

  function execute(
    evidenceBundle
  ) {
    if (
      !dependenciesAvailable_()
    ) {
      return failure_(
        PRECONDITION,
        'dependency_validation',
        'PERSISTENCE_V2_DEPENDENCY_UNAVAILABLE',
        'Required V2 persistence executor dependency is unavailable.'
      );
    }

    var plan;

    try {
      plan =
        REOS
          .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2
          .prepare(
            evidenceBundle
          );
    } catch (error) {
      return failure_(
        PRECONDITION,
        'planner',
        'V2_PLANNER_EXECUTION_FAILED',
        'The certified V2 planner failed before ScriptLock acquisition.'
      );
    }

    if (
      !plan ||
      plan.ok !== true
    ) {
      return failure_(
        PRECONDITION,
        'planner',
        plan &&
        plan.code
          ? String(plan.code)
          : 'INVALID_V2_PERSISTENCE_PLAN',
        'The five-artifact evidence bundle was rejected before ScriptLock acquisition.'
      );
    }

    var writeState = {
      writeAttempted:
        false
    };

    try {
      return REOS.Database
        .withScriptLockContext(
          function (lockContext) {
            var v1 =
              reconcileV1Equivalent_(
                plan,
                lockContext
              );

            if (
              v1.equivalent ===
              true
            ) {
              var reconciliation =
                failure_(
                  PRECONDITION,
                  'v1_equivalence_reconciliation',
                  V1_EQUIVALENT,
                  'Equivalent validated V1 classifier evidence exists; explicit operator reconciliation is required before any V2 persistence.'
                );

              reconciliation
                .classifierResultSha256 =
                plan.classifierResultSha256;

              reconciliation
                .v1EvidenceEventId =
                v1.event.evidenceEventId;

              reconciliation
                .v1EvidencePhysicalRowNumber =
                v1.event
                  .physicalEvidenceRowNumber;

              return reconciliation;
            }

            var result =
              REOS
                .AbsenteeOwnerClassificationEvidenceStoreV2
                .persist(
                  plan,
                  {
                    lockContext:
                      lockContext,

                    writeState:
                      writeState
                  }
                );

            if (
              !result ||
              result.ok !== true ||
              (
                result.outcome !==
                  VERIFIED &&
                result.outcome !==
                  ALREADY
              )
            ) {
              return failure_(
                writeState
                  .writeAttempted
                  ? UNCERTAIN
                  : PRECONDITION,
                'store_result_validation',
                'INVALID_V2_STORE_RESULT',
                writeState.writeAttempted
                  ? 'The V2 evidence-store result is invalid after the physical append boundary; outcome is uncertain.'
                  : 'The V2 evidence-store result is invalid before any physical append.'
              );
            }

            return attachAuthority_(
              result
            );
          }
        );
    } catch (error) {
      var classification =
        writeState.writeAttempted
          ? UNCERTAIN
          : PRECONDITION;

      return failure_(
        classification,
        'persistence_executor',
        error &&
        error.code
          ? String(error.code)
          : 'V2_PERSISTENCE_EXECUTION_FAILED',
        classification ===
          UNCERTAIN
          ? 'V2 classification-evidence persistence outcome is uncertain; operator reconciliation is required and automatic retry is prohibited.'
          : 'V2 classification-evidence persistence failed before a physical append was attempted.'
      );
    }
  }

  return Object.freeze({
    execute:
      execute
  });
})();
