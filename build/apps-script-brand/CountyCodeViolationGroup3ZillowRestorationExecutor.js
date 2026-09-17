/**
 * REOS Enterprise
 *
 * Philadelphia code-violation Group 3 Zillow restoration executor v1.
 *
 * INTERNAL EXECUTOR ONLY.
 *
 * This module exposes no public reos* RPC and grants no standalone
 * production-execution, scheduler, checkpoint, reference-rewrite,
 * physical-delete, connector, MAO, or automatic-offer authority.
 *
 * The only mutation primitive used by this module is the separately
 * certified REOS.Database.replacePhysicalRowExact primitive.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationGroup3ZillowRestorationExecutor =
  (function () {
    'use strict';

    var TABLE =
      'DISTRESS_LEADS';

    var IMPORT_TABLE =
      'ZILLOW_GMAIL_IMPORTS';

    var WRITER_ID =
      'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION';

    var EXPECTED_CHECKPOINT_ID =
      'COUNTY-20260902222607805';

    var EXPECTED_CHECKPOINT_CURSOR =
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

    var INVOCATION_FIELDS = [
      'confirmRestoration',
      'checkpointId',
      'checkpointCursor'
    ];

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

      error.classification =
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

    function plainObject_(value) {
      return (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      );
    }

    function exactFields_(
      value,
      fields,
      label
    ) {
      if (!plainObject_(value)) {
        throw new Error(
          label +
          ' must be an object.'
        );
      }

      var actual =
        Object.keys(value)
          .slice()
          .sort();

      var expected =
        fields
          .slice()
          .sort();

      if (
        actual.length !==
        expected.length
      ) {
        throw new Error(
          label +
          ' has missing or unknown fields.'
        );
      }

      for (
        var index = 0;
        index < expected.length;
        index++
      ) {
        if (
          actual[index] !==
          expected[index]
        ) {
          throw new Error(
            label +
            ' has missing or unknown fields.'
          );
        }
      }
    }

    function text_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      ).trim();
    }

    function safeValue_(value) {
      if (
        value === undefined ||
        value === null
      ) {
        return value;
      }

      if (
        Object.prototype
          .toString
          .call(value) ===
        '[object Date]'
      ) {
        return value.toISOString();
      }

      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        return value;
      }

      if (Array.isArray(value)) {
        return value.map(
          safeValue_
        );
      }

      if (typeof value === 'object') {
        var copy = {};

        Object.keys(value)
          .sort()
          .forEach(function (key) {
            if (
              typeof value[key] !==
              'function'
            ) {
              copy[key] =
                safeValue_(
                  value[key]
                );
            }
          });

        return copy;
      }

      return String(value);
    }

    function exactEqual_(
      left,
      right
    ) {
      return (
        JSON.stringify(
          safeValue_(left)
        ) ===
        JSON.stringify(
          safeValue_(right)
        )
      );
    }

    function canonicalValue_(value) {
      if (value === '') {
        return {
          type:
            'blank'
        };
      }

      if (
        typeof value ===
        'string'
      ) {
        return {
          type:
            'string',
          value:
            value
        };
      }

      if (
        typeof value ===
        'number'
      ) {
        if (!Number.isFinite(value)) {
          throw new Error(
            'Group 3 evidence contains a non-finite number.'
          );
        }

        return {
          type:
            'number',
          value:
            Object.is(
              value,
              -0
            )
              ? '0'
              : String(value)
        };
      }

      if (
        typeof value ===
        'boolean'
      ) {
        return {
          type:
            'boolean',
          value:
            value
        };
      }

      if (
        Object.prototype
          .toString
          .call(value) ===
          '[object Date]' &&
        Number.isFinite(
          value.getTime()
        )
      ) {
        return {
          type:
            'date',
          value:
            value.toISOString()
        };
      }

      throw new Error(
        'Group 3 evidence contains unsupported raw cell value.'
      );
    }

    function canonicalRow_(values) {
      return values.map(
        canonicalValue_
      );
    }

    function recordFromValues_(
      headers,
      values
    ) {
      var result = {};

      headers.forEach(function (
        header,
        index
      ) {
        result[header] =
          values[index];
      });

      return result;
    }

    function valuesFromRecord_(
      headers,
      record
    ) {
      return headers.map(
        function (header) {
          return (
            record[header] ===
              undefined ||
            record[header] ===
              null
          )
            ? ''
            : record[header];
        }
      );
    }

    function requireDependencies_() {
      if (
        !REOS.Database ||
        typeof REOS.Database
          .getSheet !==
          'function' ||
        typeof REOS.Database
          .getHeaders !==
          'function' ||
        typeof REOS.Database
          .withScriptLockContext !==
          'function' ||
        typeof REOS.Database
          .assertScriptLockContext !==
          'function' ||
        typeof REOS.Database
          .replacePhysicalRowExact !==
          'function'
      ) {
        throw new Error(
          'Group 3 executor requires certified Database exact-replacement support.'
        );
      }

      if (
        !REOS
          .CountyCodeViolationGroup3ZillowRestorationContract ||
        typeof REOS
          .CountyCodeViolationGroup3ZillowRestorationContract
          .contract !==
          'function'
      ) {
        throw new Error(
          'Group 3 restoration contract is unavailable.'
        );
      }

      if (
        !REOS.DistressLeadCountySchema ||
        typeof REOS
          .DistressLeadCountySchema
          .requiredHeaders !==
          'function'
      ) {
        throw new Error(
          'Group 3 executor requires certified DISTRESS_LEADS schema authority.'
        );
      }

      if (
        !REOS.Security ||
        typeof REOS.Security
          .requireAdmin !==
          'function'
      ) {
        throw new Error(
          'Group 3 executor requires Admin authority.'
        );
      }

      if (
        !REOS.CountyMutationExclusionLease ||
        typeof REOS
          .CountyMutationExclusionLease
          .assertWriterAllowed !==
          'function'
      ) {
        throw new Error(
          'Group 3 executor requires county writer exclusion.'
        );
      }

      if (
        typeof SpreadsheetApp ===
          'undefined' ||
        !SpreadsheetApp ||
        typeof SpreadsheetApp
          .getActiveSpreadsheet !==
          'function'
      ) {
        throw new Error(
          'Group 3 executor requires active spreadsheet identity support.'
        );
      }
    }

    function requireInvocation_(options) {
      exactFields_(
        options,
        INVOCATION_FIELDS,
        'Group 3 executor options'
      );

      if (
        options.confirmRestoration !==
          true ||
        text_(
          options.checkpointId
        ) !==
          EXPECTED_CHECKPOINT_ID ||
        text_(
          options.checkpointCursor
        ) !==
          EXPECTED_CHECKPOINT_CURSOR
      ) {
        throw new Error(
          'Group 3 executor invocation authority rejected.'
        );
      }
    }

    function contract_() {
      var contract =
        REOS
          .CountyCodeViolationGroup3ZillowRestorationContract
          .contract();

      if (
        !contract ||
        contract.version !==
          'COUNTY_CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION_V1' ||
        Number(
          contract.groupNumber
        ) !==
          3 ||
        contract.violationNumber !==
          'VI-2026-045359' ||
        !contract.countySurvivor ||
        contract.countySurvivor
          .distressLeadId !==
          'DL-20260820181647-4170' ||
        Number(
          contract.countySurvivor
            .physicalRow
        ) !==
          767 ||
        !contract.zillowRestoration ||
        contract.zillowRestoration
          .distressLeadId !==
          'ZIL-20260820193920-1756' ||
        Number(
          contract.zillowRestoration
            .physicalRow
        ) !==
          771 ||
        Number(
          contract.zillowRestoration
            .sourceImportRow
        ) !==
          38 ||
        !contract.downstreamReference ||
        contract.downstreamReference
          .sheet !==
          IMPORT_TABLE ||
        Number(
          contract.downstreamReference
            .rowNumber
        ) !==
          38 ||
        Number(
          contract.downstreamReference
            .columnNumber
        ) !==
          13 ||
        contract.downstreamReference
          .columnName !==
          'Distress Lead ID' ||
        contract.downstreamReference
          .distressLeadId !==
          'ZIL-20260820193920-1756' ||
        contract.referenceRewriteRequired !==
          false ||
        contract.physicalDeleteRequired !==
          false ||
        contract.executionAuthorityGranted !==
          false ||
        contract.repairAuthorityGranted !==
          false ||
        contract.referenceRewriteAuthorityGranted !==
          false ||
        contract.deleteAuthorityGranted !==
          false ||
        contract.checkpointMutationAuthorityGranted !==
          false ||
        contract.schedulerAuthorityGranted !==
          false ||
        contract.connectorExecutionAuthorityGranted !==
          false ||
        contract.automaticOfferAuthorityGranted !==
          false
      ) {
        throw new Error(
          'Group 3 restoration contract authority changed.'
        );
      }

      return contract;
    }

    function assertQuiescence_() {
      if (
        typeof reosCountyProductionSchedulerStatus !==
          'function' ||
        typeof reosCountyProductionSchedulerCheckpoint !==
          'function'
      ) {
        throw new Error(
          'Group 3 executor requires scheduler/checkpoint diagnostics.'
        );
      }

      var status =
        reosCountyProductionSchedulerStatus();

      var checkpoint =
        reosCountyProductionSchedulerCheckpoint();

      if (
        !status ||
        !status.scheduler ||
        Number(
          status.scheduler.triggerCount
        ) !==
          0
      ) {
        throw new Error(
          'Group 3 restoration requires zero managed county scheduler triggers.'
        );
      }

      if (
        !checkpoint ||
        text_(checkpoint.id) !==
          EXPECTED_CHECKPOINT_ID ||
        Number(
          checkpoint.nextFeedIndex
        ) !==
          0 ||
        text_(
          checkpoint.currentFeedCursor
        ) !==
          EXPECTED_CHECKPOINT_CURSOR ||
        Number(
          checkpoint.completedFeeds
        ) !==
          0 ||
        Number(
          checkpoint.totalFeeds
        ) !==
          4 ||
        !Array.isArray(
          checkpoint.results
        ) ||
        checkpoint.results.length !==
          0
      ) {
        throw new Error(
          'Group 3 restoration frozen checkpoint authority changed.'
        );
      }

      return {
        triggerCount:
          0,

        checkpointId:
          EXPECTED_CHECKPOINT_ID,

        checkpointCursor:
          EXPECTED_CHECKPOINT_CURSOR,

        nextFeedIndex:
          0,

        completedFeeds:
          0,

        totalFeeds:
          4,

        results:
          []
      };
    }

    function zillowProjection_(
      importRecord
    ) {
      var leadType =
        text_(
          importRecord[
            'Lead Type'
          ]
        );

      var distressType =
        leadType === 'Seller'
          ? 'Seller Lead'
          : leadType === 'Rental'
            ? 'Rental Inquiry'
            : leadType === 'Buyer'
              ? 'Buyer Inquiry'
              : 'Listing Inquiry';

      var sourceRecordId =
        text_(
          importRecord[
            'Gmail Message ID'
          ]
        );

      if (!sourceRecordId) {
        throw new Error(
          'Group 3 Zillow provenance requires Gmail Message ID.'
        );
      }

      var sourceObservationKey =
        (
          'zillow gmail|gmail_leads|' +
          sourceRecordId
            .toLowerCase()
        );

      var notes = [
        'Imported from Gmail label: ' +
          text_(
            importRecord[
              'Source Label'
            ]
          ),

        text_(
          importRecord[
            'External Lead ID'
          ]
        )
          ? (
              'Zillow lead ID: ' +
              text_(
                importRecord[
                  'External Lead ID'
                ]
              )
            )
          : '',

        text_(
          importRecord[
            'Property URL'
          ]
        )
          ? (
              'Property URL: ' +
              text_(
                importRecord[
                  'Property URL'
                ]
              )
            )
          : ''
      ]
        .filter(function (value) {
          return Boolean(value);
        })
        .join('\n');

      return {
        Address:
          text_(
            importRecord[
              'Property Address'
            ]
          ),

        'Owner Name':
          text_(
            importRecord[
              'Contact Name'
            ]
          ),

        Phone:
          importRecord.Phone || '',

        Email:
          text_(
            importRecord.Email
          ),

        'Distress Type':
          distressType,

        Source:
          'Zillow Gmail',

        'Source Dataset':
          'gmail_leads',

        'Source Record ID':
          sourceRecordId,

        'Source Record Key':
          sourceObservationKey,

        'Source Observation Key':
          sourceObservationKey,

        'Canonical Property Key':
          '',

        'Source URL':
          text_(
            importRecord[
              'Property URL'
            ]
          ),

        'External Lead ID':
          text_(
            importRecord[
              'External Lead ID'
            ]
          ),

        'Lead Type':
          leadType,

        Status:
          'New',

        Notes:
          notes
      };
    }

    function exactHeaders_(
      actual,
      expected,
      label
    ) {
      if (
        !Array.isArray(actual) ||
        !Array.isArray(expected) ||
        actual.length !==
          expected.length
      ) {
        throw new Error(
          label +
          ' header cardinality changed.'
        );
      }

      var normalized = {};

      for (
        var index = 0;
        index < actual.length;
        index++
      ) {
        if (
          typeof actual[index] !==
            'string' ||
          actual[index].trim() ===
            '' ||
          actual[index] !==
            expected[index]
        ) {
          throw new Error(
            label +
            ' header vector changed.'
          );
        }

        var key =
          actual[index]
            .trim()
            .toLowerCase();

        if (
          Object.prototype
            .hasOwnProperty.call(
              normalized,
              key
            )
        ) {
          throw new Error(
            label +
            ' header vector is ambiguous.'
          );
        }

        normalized[key] =
          true;
      }
    }

    function captureEvidence_(contract) {
      var quiescence =
        assertQuiescence_();

      var spreadsheet =
        SpreadsheetApp
          .getActiveSpreadsheet();

      if (
        !spreadsheet ||
        typeof spreadsheet.getId !==
          'function'
      ) {
        throw new Error(
          'Group 3 spreadsheet identity is unavailable.'
        );
      }

      var spreadsheetId =
        spreadsheet.getId();

      if (
        typeof spreadsheetId !==
          'string' ||
        spreadsheetId.trim() ===
          ''
      ) {
        throw new Error(
          'Group 3 spreadsheet identity is invalid.'
        );
      }

      var headers =
        REOS.Database
          .getHeaders(
            TABLE
          );

      var schemaHeaders =
        REOS
          .DistressLeadCountySchema
          .requiredHeaders();

      exactHeaders_(
        headers,
        schemaHeaders,
        'DISTRESS_LEADS'
      );

      var sheet =
        REOS.Database
          .getSheet(
            TABLE
          );

      if (
        !sheet ||
        typeof sheet.getSheetId !==
          'function' ||
        typeof sheet.getLastRow !==
          'function' ||
        typeof sheet.getLastColumn !==
          'function' ||
        typeof sheet.getMaxRows !==
          'function' ||
        typeof sheet.getMaxColumns !==
          'function'
      ) {
        throw new Error(
          'Group 3 DISTRESS_LEADS physical sheet support is invalid.'
        );
      }

      var lastRow =
        Number(
          sheet.getLastRow()
        );

      var lastColumn =
        Number(
          sheet.getLastColumn()
        );

      var maxRows =
        Number(
          sheet.getMaxRows()
        );

      var maxColumns =
        Number(
          sheet.getMaxColumns()
        );

      if (
        lastRow <
          contract.zillowRestoration
            .physicalRow ||
        lastColumn !==
          headers.length ||
        maxRows <
          lastRow ||
        maxColumns <
          lastColumn
      ) {
        throw new Error(
          'Group 3 DISTRESS_LEADS geometry authority changed.'
        );
      }

      var rawHeaders =
        sheet
          .getRange(
            1,
            1,
            1,
            lastColumn
          )
          .getValues()[0];

      exactHeaders_(
        rawHeaders,
        headers,
        'DISTRESS_LEADS physical'
      );

      var survivorRange =
        sheet.getRange(
          contract.countySurvivor
            .physicalRow,
          1,
          1,
          lastColumn
        );

      var targetRange =
        sheet.getRange(
          contract.zillowRestoration
            .physicalRow,
          1,
          1,
          lastColumn
        );

      var survivorValues =
        survivorRange
          .getValues()[0];

      var survivorFormulas =
        survivorRange
          .getFormulas()[0];

      var targetValues =
        targetRange
          .getValues()[0];

      var targetFormulas =
        targetRange
          .getFormulas()[0];

      if (
        survivorValues.length !==
          lastColumn ||
        survivorFormulas.length !==
          lastColumn ||
        targetValues.length !==
          lastColumn ||
        targetFormulas.length !==
          lastColumn
      ) {
        throw new Error(
          'Group 3 physical-row evidence is incomplete.'
        );
      }

      var survivor =
        recordFromValues_(
          headers,
          survivorValues
        );

      var target =
        recordFromValues_(
          headers,
          targetValues
        );

      if (
        text_(
          survivor[
            'Distress Lead ID'
          ]
        ) !==
          contract.countySurvivor
            .distressLeadId ||
        text_(
          survivor[
            'Source'
          ]
        ) !==
          'PA-PHILADELPHIA' ||
        text_(
          survivor[
            'Source Dataset'
          ]
        ) !==
          'code_violations' ||
        text_(
          survivor[
            'Violation Number'
          ]
        ) !==
          contract.violationNumber
      ) {
        throw new Error(
          'Group 3 county survivor authority changed.'
        );
      }

      if (
        text_(
          target[
            'Distress Lead ID'
          ]
        ) !==
          contract.zillowRestoration
            .distressLeadId ||
        text_(
          target[
            'Source'
          ]
        ) !==
          'PA-PHILADELPHIA' ||
        text_(
          target[
            'Source Dataset'
          ]
        ) !==
          'code_violations' ||
        text_(
          target[
            'Violation Number'
          ]
        ) !==
          contract.violationNumber
      ) {
        throw new Error(
          'Group 3 Zillow physical-row preimage authority changed.'
        );
      }

      var importSheet =
        REOS.Database
          .getSheet(
            IMPORT_TABLE
          );

      if (
        !importSheet ||
        typeof importSheet.getSheetId !==
          'function' ||
        typeof importSheet.getLastRow !==
          'function' ||
        typeof importSheet.getLastColumn !==
          'function' ||
        typeof importSheet.getMaxRows !==
          'function' ||
        typeof importSheet.getMaxColumns !==
          'function'
      ) {
        throw new Error(
          'Group 3 Zillow import sheet support is invalid.'
        );
      }

      var importLastRow =
        Number(
          importSheet.getLastRow()
        );

      var importLastColumn =
        Number(
          importSheet.getLastColumn()
        );

      if (
        importLastRow <
          contract.zillowRestoration
            .sourceImportRow ||
        importLastColumn <
          contract.downstreamReference
            .columnNumber
      ) {
        throw new Error(
          'Group 3 Zillow import geometry authority changed.'
        );
      }

      var importHeaders =
        importSheet
          .getRange(
            1,
            1,
            1,
            importLastColumn
          )
          .getValues()[0]
          .map(function (header) {
            return String(
              header || ''
            ).trim();
          });

      if (
        importHeaders[
          contract.downstreamReference
            .columnNumber - 1
        ] !==
          contract.downstreamReference
            .columnName
      ) {
        throw new Error(
          'Group 3 downstream-reference column authority changed.'
        );
      }

      var importRange =
        importSheet
          .getRange(
            contract.zillowRestoration
              .sourceImportRow,
            1,
            1,
            importLastColumn
          );

      var importValues =
        importRange
          .getValues()[0];

      var importFormulas =
        importRange
          .getFormulas()[0];

      if (
        importValues.length !==
          importLastColumn ||
        importFormulas.length !==
          importLastColumn
      ) {
        throw new Error(
          'Group 3 Zillow import evidence is incomplete.'
        );
      }

      if (
        text_(
          importValues[
            contract.downstreamReference
              .columnNumber - 1
          ]
        ) !==
          contract.downstreamReference
            .distressLeadId
      ) {
        throw new Error(
          'Group 3 downstream reference changed.'
        );
      }

      var importRecord =
        recordFromValues_(
          importHeaders,
          importValues
        );

      var projection =
        zillowProjection_(
          importRecord
        );

      if (
        !exactEqual_(
          projection,
          contract.zillowRestoration
            .projection
        )
      ) {
        throw new Error(
          'Group 3 fresh Zillow provenance no longer reproduces certified projection.'
        );
      }

      if (
        text_(
          projection[
            'Source Record ID'
          ]
        ) !==
          contract.zillowRestoration
            .sourceRecordId ||
        text_(
          projection[
            'Source Observation Key'
          ]
        ) !==
          contract.zillowRestoration
            .sourceObservationKey
      ) {
        throw new Error(
          'Group 3 Zillow provenance identity changed.'
        );
      }

      return {
        quiescence:
          quiescence,

        spreadsheetId:
          spreadsheetId,

        distress: {
          sheetId:
            sheet.getSheetId(),

          lastRow:
            lastRow,

          lastColumn:
            lastColumn,

          maxRows:
            Number(
              sheet.getMaxRows()
            ),

          maxColumns:
            Number(
              sheet.getMaxColumns()
            ),

          headers:
            headers.slice(),

          survivorValues:
            survivorValues.slice(),

          survivorFormulas:
            survivorFormulas.slice(),

          targetValues:
            targetValues.slice(),

          targetFormulas:
            targetFormulas.slice()
        },

        zillowImport: {
          sheetId:
            importSheet.getSheetId(),

          lastRow:
            importLastRow,

          lastColumn:
            importLastColumn,

          maxRows:
            Number(
              importSheet.getMaxRows()
            ),

          maxColumns:
            Number(
              importSheet.getMaxColumns()
            ),

          headers:
            importHeaders.slice(),

          rowValues:
            importValues.slice(),

          rowFormulas:
            importFormulas.slice()
        },

        projection:
          projection
      };
    }

    function evidenceAuthority_(
      evidence
    ) {
      return JSON.stringify(
        safeValue_(
          evidence
        )
      );
    }

    function buildPostValues_(
      contract,
      evidence
    ) {
      var headers =
        evidence.distress
          .headers;

      var current =
        recordFromValues_(
          headers,
          evidence.distress
            .targetValues
        );

      var target =
        Object.assign(
          {},
          current
        );

      contract.zillowRestoration
        .clearCountyFields
        .forEach(function (field) {
          if (
            headers.indexOf(
              field
            ) ===
            -1
          ) {
            throw new Error(
              'Group 3 clear-field authority is missing from schema: ' +
              field
            );
          }

          target[field] =
            '';
        });

      /*
       * The certified projection contains provenance attributes that are
       * not all represented as physical DISTRESS_LEADS columns.
       * Materialize the exact intersection represented by the physical
       * header vector, matching the established Zillow restoration model.
       */
      Object.keys(
        evidence.projection
      ).forEach(function (field) {
        target[field] =
          evidence.projection[
            field
          ];
      });

      target[
        'Distress Lead ID'
      ] =
        current[
          'Distress Lead ID'
        ];

      target[
        'Created At'
      ] =
        current[
          'Created At'
        ];

      var values =
        valuesFromRecord_(
          headers,
          target
        );

      var idIndex =
        headers.indexOf(
          'Distress Lead ID'
        );

      var createdIndex =
        headers.indexOf(
          'Created At'
        );

      if (
        idIndex < 0 ||
        createdIndex < 0
      ) {
        throw new Error(
          'Group 3 immutable identity headers are missing.'
        );
      }

      if (
        text_(
          values[idIndex]
        ) !==
          contract.zillowRestoration
            .distressLeadId ||
        !exactEqual_(
          values[createdIndex],
          evidence.distress
            .targetValues[
              createdIndex
            ]
        )
      ) {
        throw new Error(
          'Group 3 immutable physical identity would change.'
        );
      }

      for (
        var index = 0;
        index < values.length;
        index++
      ) {
        if (
          evidence.distress
            .targetFormulas[
              index
            ] !== '' &&
          !exactEqual_(
            values[index],
            evidence.distress
              .targetValues[
                index
              ]
          )
        ) {
          throw new Error(
            'Group 3 restoration would require formula mutation.'
          );
        }
      }

      return values;
    }

    function replacementRequest_(
      contract,
      evidence,
      postValues
    ) {
      return {
        spreadsheetId:
          evidence.spreadsheetId,

        sheetId:
          evidence.distress
            .sheetId,

        expectedRowNumber:
          contract.zillowRestoration
            .physicalRow,

        idField:
          'Distress Lead ID',

        idValue:
          contract.zillowRestoration
            .distressLeadId,

        expectedLastRow:
          evidence.distress
            .lastRow,

        expectedLastColumn:
          evidence.distress
            .lastColumn,

        expectedMaxRows:
          evidence.distress
            .maxRows,

        expectedMaxColumns:
          evidence.distress
            .maxColumns,

        expectedHeaders:
          evidence.distress
            .headers
            .slice(),

        expectedRowValues:
          canonicalRow_(
            evidence.distress
              .targetValues
          ),

        expectedRowFormulas:
          evidence.distress
            .targetFormulas
            .slice(),

        expectedPostRowValues:
          canonicalRow_(
            postValues
          ),

        expectedPostRowFormulas:
          evidence.distress
            .targetFormulas
            .slice()
      };
    }

    function assertWriterAllowed_() {
      return REOS.CountyMutationExclusionLease.assertWriterAllowed({
        writerId:
          'CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION'
      });
    }

    function verifyProtectedSurfaces_(
      contract,
      evidence
    ) {
      assertQuiescence_();

      var sheet =
        REOS.Database
          .getSheet(
            TABLE
          );

      if (
        Number(
          sheet.getLastRow()
        ) !==
          evidence.distress
            .lastRow ||
        Number(
          sheet.getLastColumn()
        ) !==
          evidence.distress
            .lastColumn ||
        Number(
          sheet.getMaxRows()
        ) !==
          evidence.distress
            .maxRows ||
        Number(
          sheet.getMaxColumns()
        ) !==
          evidence.distress
            .maxColumns
      ) {
        throw new Error(
          'Group 3 DISTRESS_LEADS geometry changed after restoration.'
        );
      }

      var survivorRange =
        sheet.getRange(
          contract.countySurvivor
            .physicalRow,
          1,
          1,
          evidence.distress
            .lastColumn
        );

      if (
        !exactEqual_(
          survivorRange
            .getValues()[0],
          evidence.distress
            .survivorValues
        ) ||
        !exactEqual_(
          survivorRange
            .getFormulas()[0],
          evidence.distress
            .survivorFormulas
        )
      ) {
        throw new Error(
          'Group 3 county survivor changed during restoration.'
        );
      }

      var importSheet =
        REOS.Database
          .getSheet(
            IMPORT_TABLE
          );

      if (
        Number(
          importSheet.getLastRow()
        ) !==
          evidence.zillowImport
            .lastRow ||
        Number(
          importSheet.getLastColumn()
        ) !==
          evidence.zillowImport
            .lastColumn ||
        Number(
          importSheet.getMaxRows()
        ) !==
          evidence.zillowImport
            .maxRows ||
        Number(
          importSheet.getMaxColumns()
        ) !==
          evidence.zillowImport
            .maxColumns
      ) {
        throw new Error(
          'Group 3 Zillow import geometry changed during restoration.'
        );
      }

      var importRange =
        importSheet.getRange(
          contract.zillowRestoration
            .sourceImportRow,
          1,
          1,
          evidence.zillowImport
            .lastColumn
        );

      var importValues =
        importRange
          .getValues()[0];

      var importFormulas =
        importRange
          .getFormulas()[0];

      if (
        !exactEqual_(
          importValues,
          evidence.zillowImport
            .rowValues
        ) ||
        !exactEqual_(
          importFormulas,
          evidence.zillowImport
            .rowFormulas
        )
      ) {
        throw new Error(
          'Group 3 Zillow provenance/reference row changed during restoration.'
        );
      }

      if (
        text_(
          importValues[
            contract.downstreamReference
              .columnNumber - 1
          ]
        ) !==
          contract.downstreamReference
            .distressLeadId
      ) {
        throw new Error(
          'Group 3 downstream reference changed during restoration.'
        );
      }
    }

    function authorityFreeResult_(
      details
    ) {
      return Object.assign(
        {},
        details || {},
        {
          executionAuthorityGranted:
            false,

          repairAuthorityGranted:
            false,

          referenceRewriteAuthorityGranted:
            false,

          physicalDeleteAuthorityGranted:
            false,

          schedulerMutationAuthorityGranted:
            false,

          checkpointMutationAuthorityGranted:
            false,

          connectorExecutionAuthorityGranted:
            false,

          automaticOfferAuthorityGranted:
            false
        }
      );
    }

    function execute(options) {
      var primitiveInvoked =
        false;

      var primitiveVerified =
        false;

      try {
        requireDependencies_();

        REOS.Security.requireAdmin();

        requireInvocation_(
          options
        );

        var contract =
          contract_();

        /*
         * Fresh read-only authority immediately before the outer
         * Database ScriptLock.
         */
        var preEvidence =
          captureEvidence_(
            contract
          );

        var preAuthority =
          evidenceAuthority_(
            preEvidence
          );

        var result =
          REOS.Database.withScriptLockContext(
              function (lockContext) {
                REOS.Database.assertScriptLockContext(
                    lockContext
                  );

                /*
                 * Regenerate the complete Group 3 physical/import/
                 * reference/quiescence authority while the caller-owned
                 * Database ScriptLock is held.
                 */
                var lockedEvidence =
                  captureEvidence_(
                    contract
                  );

                if (
                  evidenceAuthority_(
                    lockedEvidence
                  ) !==
                    preAuthority
                ) {
                  throw new Error(
                    'Group 3 evidence changed between pre-lock and under-lock authority.'
                  );
                }

                var postValues =
                  buildPostValues_(
                    contract,
                    lockedEvidence
                  );

                var request =
                  replacementRequest_(
                    contract,
                    lockedEvidence,
                    postValues
                  );

                /*
                 * Exclusion-only writer assertion.
                 * It grants no mutation authority by itself.
                 */
                assertWriterAllowed_();

                REOS.Database.assertScriptLockContext(
                    lockContext
                  );

                var replacement;

                try {
                  primitiveInvoked =
                    true;

                  replacement =
                    REOS.Database.replacePhysicalRowExact(
                        TABLE,
                        request,
                        {
                          lockContext:
                            lockContext
                        }
                      );
                } catch (error) {
                  if (
                    error &&
                    error.classification ===
                      'PHYSICAL_REPLACE_PRECONDITION_FAILED'
                  ) {
                    throw classifiedError_(
                      'GROUP3_RESTORATION_PRECONDITION_FAILED',
                      'Exact physical replacement rejected before its first write.',
                      error
                    );
                  }

                  throw classifiedError_(
                    'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
                    'Exact physical replacement invocation may have crossed its first-write boundary.',
                    error
                  );
                }

                if (
                  !replacement ||
                  replacement.classification !==
                    'PHYSICAL_REPLACE_VERIFIED'
                ) {
                  throw classifiedError_(
                    'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
                    'Exact physical replacement did not return verified success.'
                  );
                }

                primitiveVerified =
                  true;

                try {
                  verifyProtectedSurfaces_(
                    contract,
                    lockedEvidence
                  );
                } catch (error) {
                  throw classifiedError_(
                    'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
                    'Protected Group 3 surfaces could not be proven unchanged after replacement.',
                    error
                  );
                }

                return authorityFreeResult_({
                  ok:
                    true,

                  classification:
                    'GROUP3_RESTORATION_VERIFIED',

                  writerId:
                    WRITER_ID,

                  physicalRow:
                    contract.zillowRestoration
                      .physicalRow,

                  distressLeadId:
                    contract.zillowRestoration
                      .distressLeadId,

                  countySurvivorPhysicalRow:
                    contract.countySurvivor
                      .physicalRow,

                  downstreamReferencePreserved:
                    true,

                  physicalDeletePerformed:
                    false,

                  referenceRewritePerformed:
                    false,

                  replacementClassification:
                    replacement.classification
                });
              }
            );

        return result;
      } catch (error) {
        if (
          error &&
          (
            error.classification ===
              'GROUP3_RESTORATION_PRECONDITION_FAILED' ||
            error.classification ===
              'GROUP3_RESTORATION_OUTCOME_UNCERTAIN'
          )
        ) {
          throw error;
        }

        if (
          primitiveInvoked ||
          primitiveVerified
        ) {
          throw classifiedError_(
            'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
            'Group 3 restoration failed after exact replacement invocation.',
            error
          );
        }

        throw classifiedError_(
          'GROUP3_RESTORATION_PRECONDITION_FAILED',
          'Group 3 restoration precondition verification failed.',
          error
        );
      }
    }

    return Object.freeze({
      execute:
        execute
    });
  })();
