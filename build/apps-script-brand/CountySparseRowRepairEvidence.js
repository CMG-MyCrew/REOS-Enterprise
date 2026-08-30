/**
 * REOS Enterprise - County Sparse-Row Repair Evidence
 *
 * Read-only, fail-closed evidence boundary for the certified
 * DISTRESS_LEADS sparse-row corruption corridor.
 *
 * This module:
 * - reads physical rows 2344-2445 directly;
 * - fingerprints all 52 physical cell values per row;
 * - fingerprints the exact county source window 1601-1700;
 * - captures Zillow import-ledger provenance for the two overwritten rows;
 * - captures certified county-run lineage;
 * - grants no mutation, repair, scheduler, insert, delete, MAO, or offer
 *   authority.
 */
var REOS = REOS || {};

REOS.CountySparseRowRepairEvidence = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var IMPORT_TABLE =
    'ZILLOW_GMAIL_IMPORTS';

  var RUN_TABLE =
    'COUNTY_CONNECTOR_RUNS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var PLAN_SHA256 =
    'd815afaf9f5c9384186c6cb30be98b07a3f5c43755f8f96c4f97e3f45fd9695c';

  var ROW_START =
    2344;

  var ROW_END =
    2445;

  var ROW_COUNT =
    ROW_END -
    ROW_START +
    1;

  var SOURCE_START_OFFSET =
    1600;

  var SOURCE_FIRST_ID =
    1601;

  var SOURCE_LAST_ID =
    1700;

  var SOURCE_COUNT =
    SOURCE_LAST_ID -
    SOURCE_FIRST_ID +
    1;

  var FIRST_REPLAY_RUN =
    'CCR-20260829205348-7954';

  var SECOND_PAGE_INSERT_RUN =
    'CCR-20260829211815-0144';

  var SECOND_REPLAY_RUN =
    'CCR-20260829212018-6844';

  var ZILLOW_VICTIMS = [
    {
      physicalRow:
        2344,

      distressLeadId:
        'ZIL-20260829200939-4556',

      gmailMessageId:
        '1a04feeb3ebd0995',

      importId:
        'ZGMI-20260829200941-6943'
    },
    {
      physicalRow:
        2345,

      distressLeadId:
        'ZIL-20260829200946-0228',

      gmailMessageId:
        '1a04feb4ca06afd3',

      importId:
        'ZGMI-20260829200949-1528'
    }
  ];

  var CORRECT_TAIL = [
    {
      physicalRow:
        2444,

      sourceRecordId:
        '1699',

      distressLeadId:
        'DL-20260829211928-1265'
    },
    {
      physicalRow:
        2445,

      sourceRecordId:
        '1700',

      distressLeadId:
        'DL-20260829211929-6862'
    }
  ];

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

  function stableStringify_(value) {
    return JSON.stringify(
      safeValue_(value)
    );
  }

  function sha256_(value) {
    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        stableStringify_(value),
        Utilities.Charset.UTF_8
      );

    return digest
      .map(function (byte) {
        var normalized =
          byte < 0
            ? byte + 256
            : byte;

        return (
          normalized < 16
            ? '0'
            : ''
        ) +
          normalized.toString(16);
      })
      .join('');
  }

  function arraysEqual_(left, right) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== right.length
    ) {
      return false;
    }

    return left.every(
      function (value, index) {
        return (
          value ===
          right[index]
        );
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
        .getAll !==
        'function'
    ) {
      throw new Error(
        'Certified Database read APIs are required.'
      );
    }

    if (
      !REOS.Security ||
      typeof REOS.Security
        .requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Admin authority is required.'
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
        'DISTRESS_LEADS county schema authority is required.'
      );
    }

    if (
      !REOS.CountyRuntimeBridge ||
      typeof REOS.CountyRuntimeBridge
        .registerConnectors !==
        'function'
    ) {
      throw new Error(
        'County connector registration is required.'
      );
    }

    if (
      !REOS.CountyConnectorSDK ||
      typeof REOS.CountyConnectorSDK
        .get !==
        'function' ||
      typeof REOS.CountyConnectorSDK
        .validateLead !==
        'function'
    ) {
      throw new Error(
        'County connector read/validation APIs are required.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS
        .CanonicalPropertyIdentity
        .resolve !==
        'function'
    ) {
      throw new Error(
        'CanonicalPropertyIdentity is required.'
      );
    }

    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities
        .computeDigest !==
        'function'
    ) {
      throw new Error(
        'SHA-256 support is required.'
      );
    }
  }

  function requireInvocation_(options) {
    options =
      options ||
      {};

    if (
      options.confirmReadOnly !==
      true
    ) {
      throw new Error(
        'Sparse-row evidence export requires confirmReadOnly=true.'
      );
    }

    if (
      text_(
        options.planSha256
      ) !==
      PLAN_SHA256
    ) {
      throw new Error(
        'Certified sparse-row repair-plan SHA-256 mismatch.'
      );
    }
  }

  function requireSchema_() {
    var expected =
      REOS.DistressLeadCountySchema
        .requiredHeaders();

    var actual =
      REOS.Database
        .getHeaders(
          TABLE
        );

    if (
      expected.length !==
        52 ||
      !arraysEqual_(
        actual,
        expected
      )
    ) {
      throw new Error(
        'DISTRESS_LEADS schema differs from certified 52-column authority.'
      );
    }

    return actual;
  }

  function objectFromRow_(
    headers,
    values
  ) {
    var record = {};

    headers.forEach(
      function (header, index) {
        record[header] =
          safeValue_(
            values[index]
          );
      }
    );

    return record;
  }

  function expectedCurrentSourceId_(
    physicalRow
  ) {
    if (
      physicalRow >= 2344 &&
      physicalRow <= 2393
    ) {
      return String(
        physicalRow - 743
      );
    }

    if (
      physicalRow >= 2394 &&
      physicalRow <= 2443
    ) {
      return String(
        physicalRow - 743
      );
    }

    if (physicalRow === 2444) {
      return '1699';
    }

    if (physicalRow === 2445) {
      return '1700';
    }

    throw new Error(
      'Physical row is outside certified corridor.'
    );
  }

  function expectedCurrentRunId_(
    physicalRow
  ) {
    if (
      physicalRow >= 2344 &&
      physicalRow <= 2393
    ) {
      return FIRST_REPLAY_RUN;
    }

    if (
      physicalRow >= 2394 &&
      physicalRow <= 2443
    ) {
      return SECOND_REPLAY_RUN;
    }

    if (
      physicalRow === 2444 ||
      physicalRow === 2445
    ) {
      return SECOND_PAGE_INSERT_RUN;
    }

    throw new Error(
      'Physical row is outside certified corridor.'
    );
  }

  function assertLeadIdBoundary_(
    physicalRow,
    record
  ) {
    if (physicalRow === 2344) {
      if (
        text_(
          record[
            'Distress Lead ID'
          ]
        ) !==
        ZILLOW_VICTIMS[0]
          .distressLeadId
      ) {
        throw new Error(
          'Physical row 2344 Zillow identity drifted.'
        );
      }

      return;
    }

    if (physicalRow === 2345) {
      if (
        text_(
          record[
            'Distress Lead ID'
          ]
        ) !==
        ZILLOW_VICTIMS[1]
          .distressLeadId
      ) {
        throw new Error(
          'Physical row 2345 Zillow identity drifted.'
        );
      }

      return;
    }

    if (physicalRow === 2444) {
      if (
        text_(
          record[
            'Distress Lead ID'
          ]
        ) !==
        CORRECT_TAIL[0]
          .distressLeadId
      ) {
        throw new Error(
          'Physical row 2444 identity drifted.'
        );
      }

      return;
    }

    if (physicalRow === 2445) {
      if (
        text_(
          record[
            'Distress Lead ID'
          ]
        ) !==
        CORRECT_TAIL[1]
          .distressLeadId
      ) {
        throw new Error(
          'Physical row 2445 identity drifted.'
        );
      }

      return;
    }

    if (
      text_(
        record[
          'Distress Lead ID'
        ]
      ).indexOf(
        'DL-'
      ) !==
      0
    ) {
      throw new Error(
        'County corridor contains unexpected non-DL identity at physical row ' +
        physicalRow +
        '.'
      );
    }
  }

  function readPhysicalCorridor_(
    headers
  ) {
    var sheet =
      REOS.Database
        .getSheet(
          TABLE
        );

    if (
      !sheet ||
      typeof sheet.getLastRow !==
        'function' ||
      typeof sheet.getRange !==
        'function'
    ) {
      throw new Error(
        'Physical DISTRESS_LEADS sheet access is unavailable.'
      );
    }

    if (
      Number(
        sheet.getLastRow()
      ) <
      ROW_END
    ) {
      throw new Error(
        'DISTRESS_LEADS no longer reaches certified corridor end row.'
      );
    }

    var values =
      sheet
        .getRange(
          ROW_START,
          1,
          ROW_COUNT,
          headers.length
        )
        .getValues();

    if (
      !Array.isArray(values) ||
      values.length !==
        ROW_COUNT
    ) {
      throw new Error(
        'Physical corridor read returned unexpected row count.'
      );
    }

    var rows =
      values.map(
        function (
          rowValues,
          index
        ) {
          if (
            !Array.isArray(
              rowValues
            ) ||
            rowValues.length !==
              headers.length
          ) {
            throw new Error(
              'Physical corridor row width drifted.'
            );
          }

          var physicalRow =
            ROW_START +
            index;

          var record =
            objectFromRow_(
              headers,
              rowValues
            );

          var expectedSourceId =
            expectedCurrentSourceId_(
              physicalRow
            );

          var expectedRunId =
            expectedCurrentRunId_(
              physicalRow
            );

          assertLeadIdBoundary_(
            physicalRow,
            record
          );

          if (
            text_(record.Source) !==
              CONNECTOR_ID ||
            text_(
              record[
                'Source Dataset'
              ]
            ) !==
              DATASET ||
            text_(
              record[
                'Source Record ID'
              ]
            ) !==
              expectedSourceId ||
            text_(
              record[
                'Source Record Key'
              ]
            ) !==
              (
                'pa-philadelphia|code_violations|' +
                expectedSourceId
              ) ||
            text_(
              record[
                'Source Observation Key'
              ]
            ) !==
              (
                'pa-philadelphia|code_violations|' +
                expectedSourceId
              ) ||
            text_(
              record[
                'Connector Run ID'
              ]
            ) !==
              expectedRunId
          ) {
            throw new Error(
              'Certified sparse-row corridor prestate drifted at physical row ' +
              physicalRow +
              '.'
            );
          }

          var safeValues =
            rowValues.map(
              safeValue_
            );

          return {
            physicalRow:
              physicalRow,

            expectedCurrentSourceRecordId:
              expectedSourceId,

            expectedCurrentConnectorRunId:
              expectedRunId,

            distressLeadId:
              text_(
                record[
                  'Distress Lead ID'
                ]
              ),

            createdAt:
              safeValue_(
                record[
                  'Created At'
                ]
              ),

            updatedAt:
              safeValue_(
                record[
                  'Updated At'
                ]
              ),

            lastSeenAt:
              safeValue_(
                record[
                  'Last Seen At'
                ]
              ),

            connectorRunId:
              text_(
                record[
                  'Connector Run ID'
                ]
              ),

            sourceRecordId:
              text_(
                record[
                  'Source Record ID'
                ]
              ),

            sourceObservationKey:
              text_(
                record[
                  'Source Observation Key'
                ]
              ),

            canonicalPropertyKey:
              text_(
                record[
                  'Canonical Property Key'
                ]
              ),

            values:
              safeValues,

            record:
              record,

            rowSha256:
              sha256_({
                physicalRow:
                  physicalRow,

                values:
                  safeValues
              })
          };
        }
      );

    return {
      startRow:
        ROW_START,

      endRow:
        ROW_END,

      rowCount:
        rows.length,

      headerCount:
        headers.length,

      headerSha256:
        sha256_(headers),

      rows:
        rows
    };
  }

  function validationResult_(
    connector,
    normalized,
    context
  ) {
    var result =
      connector.validate
        ? connector.validate(
            normalized,
            context
          )
        : REOS.CountyConnectorSDK
            .validateLead(
              normalized
            );

    if (result === true) {
      return {
        ok:
          true,

        errors:
          []
      };
    }

    return result || {
      ok:
        false,

      errors:
        [
          'No validation result.'
        ]
    };
  }

  function stableSourceRecord_(
    normalized
  ) {
    var copy =
      safeValue_(
        normalized ||
        {}
      );

    [
      '_rowNumber',
      'Connector Run ID',
      'Created At',
      'Updated At',
      'Last Seen At'
    ].forEach(
      function (field) {
        delete copy[field];
      }
    );

    return copy;
  }

  function readSourceWindow_() {
    REOS.CountyRuntimeBridge
      .registerConnectors();

    var connector =
      REOS.CountyConnectorSDK
        .get(
          CONNECTOR_ID
        );

    if (
      !connector ||
      typeof connector.fetch !==
        'function' ||
      typeof connector.normalize !==
        'function'
    ) {
      throw new Error(
        'Registered Philadelphia code-violations connector is incomplete.'
      );
    }

    var context = {
      runId:
        'SPARSE-ROW-REPAIR-EVIDENCE-READ-ONLY',

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      cursor:
        String(
          SOURCE_START_OFFSET
        ),

      limit:
        SOURCE_COUNT,

      since:
        null,

      dryRun:
        true,

      config:
        {},

      now:
        new Date()
    };

    var response =
      connector.fetch(
        context
      ) || {};

    var rawRecords =
      Array.isArray(
        response.records
      )
        ? response.records
        : [];

    if (
      rawRecords.length !==
      SOURCE_COUNT
    ) {
      throw new Error(
        'Certified source window no longer returns exactly 100 records.'
      );
    }

    var records =
      rawRecords.map(
        function (raw, index) {
          var expectedId =
            String(
              SOURCE_FIRST_ID +
              index
            );

          var normalized =
            connector.normalize(
              raw,
              context
            );

          if (
            !normalized ||
            normalized.__skip ===
              true
          ) {
            throw new Error(
              'Certified repair source record ' +
              expectedId +
              ' is filtered or unavailable.'
            );
          }

          var validation =
            validationResult_(
              connector,
              normalized,
              context
            );

          if (
            !validation ||
            validation.ok !==
              true
          ) {
            throw new Error(
              'Certified repair source record ' +
              expectedId +
              ' failed validation.'
            );
          }

          if (
            text_(
              normalized[
                'Source Record ID'
              ]
            ) !==
              expectedId ||
            text_(
              normalized.Source
            ) !==
              CONNECTOR_ID ||
            text_(
              normalized[
                'Source Dataset'
              ]
            ) !==
              DATASET
          ) {
            throw new Error(
              'Certified source ordering or identity drifted at expected record ' +
              expectedId +
              '.'
            );
          }

          var identity =
            REOS.CanonicalPropertyIdentity
              .resolve(
                normalized
              );

          var expectedObservationKey =
            'pa-philadelphia|code_violations|' +
            expectedId;

          if (
            !identity ||
            text_(
              identity
                .sourceObservationKey
            ) !==
              expectedObservationKey ||
            !text_(
              identity
                .canonicalPropertyKey
            )
          ) {
            throw new Error(
              'Canonical source identity drifted for record ' +
              expectedId +
              '.'
            );
          }

          var stable =
            stableSourceRecord_(
              normalized
            );

          return {
            sourceOffset:
              SOURCE_START_OFFSET +
              index,

            sourceRecordId:
              expectedId,

            sourceObservationKey:
              expectedObservationKey,

            canonicalPropertyKey:
              text_(
                identity
                  .canonicalPropertyKey
              ),

            normalizedSourceRecord:
              safeValue_(
                normalized
              ),

            stableSourceRecord:
              stable,

            sourceSha256:
              sha256_(
                stable
              )
          };
        }
      );

    return {
      startOffset:
        SOURCE_START_OFFSET,

      firstSourceRecordId:
        String(
          SOURCE_FIRST_ID
        ),

      lastSourceRecordId:
        String(
          SOURCE_LAST_ID
        ),

      recordCount:
        records.length,

      nextCursor:
        text_(
          response.nextCursor
        ),

      complete:
        response.complete ===
          true,

      records:
        records
    };
  }

  function recordWithoutInternal_(
    row
  ) {
    var copy =
      safeValue_(
        row ||
        {}
      );

    delete copy._rowNumber;

    return copy;
  }

  function buildZillowProjection_(
    importRecord
  ) {
    var externalLeadId =
      text_(
        importRecord[
          'External Lead ID'
        ]
      );

    var naturalKey =
      text_(
        importRecord[
          'Natural Key'
        ]
      );

    var gmailMessageId =
      text_(
        importRecord[
          'Gmail Message ID'
        ]
      );

    var sourceRecordId =
      externalLeadId ||
      naturalKey ||
      gmailMessageId;

    if (!sourceRecordId) {
      throw new Error(
        'Zillow import provenance has no source-record identity.'
      );
    }

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

    var notes = [
      'Imported from Gmail label: ' +
        text_(
          importRecord[
            'Source Label'
          ]
        ),

      externalLeadId
        ? (
            'Zillow lead ID: ' +
            externalLeadId
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
      source:
        'Zillow Gmail',

      sourceDataset:
        'gmail_leads',

      sourceRecordId:
        sourceRecordId,

      sourceRecordKey:
        (
          'zillow gmail|gmail_leads|' +
          sourceRecordId.toLowerCase()
        ),

      sourceObservationKey:
        (
          'zillow gmail|gmail_leads|' +
          sourceRecordId.toLowerCase()
        ),

      canonicalPropertyKey:
        '',

      distressType:
        distressType,

      status:
        'New',

      notes:
        notes
    };
  }

  function readZillowImports_(
    corridor
  ) {
    var rows =
      REOS.Database
        .getAll(
          IMPORT_TABLE
        );

    return ZILLOW_VICTIMS
      .map(function (victim) {
        var matches =
          rows.filter(
            function (row) {
              return (
                text_(
                  row[
                    'Distress Lead ID'
                  ]
                ) ===
                victim.distressLeadId
              );
            }
          );

        if (
          matches.length !==
          1
        ) {
          throw new Error(
            'Zillow victim ' +
            victim.distressLeadId +
            ' does not have exactly one import-ledger record.'
          );
        }

        var row =
          matches[0];

        if (
          text_(
            row[
              'Import ID'
            ]
          ) !==
            victim.importId ||
          text_(
            row[
              'Gmail Message ID'
            ]
          ) !==
            victim.gmailMessageId ||
          text_(
            row[
              'Status'
            ]
          ) !==
            'Imported'
        ) {
          throw new Error(
            'Zillow import provenance drifted for ' +
            victim.distressLeadId +
            '.'
          );
        }

        var physical =
          corridor.rows[
            victim.physicalRow -
            ROW_START
          ];

        if (
          !physical ||
          physical.distressLeadId !==
            victim.distressLeadId
        ) {
          throw new Error(
            'Zillow victim physical-row binding drifted.'
          );
        }

        var record =
          recordWithoutInternal_(
            row
          );

        return {
          physicalRow:
            Number(
              row._rowNumber ||
              0
            ),

          distressLeadId:
            victim.distressLeadId,

          gmailMessageId:
            victim.gmailMessageId,

          importId:
            victim.importId,

          importRecord:
            record,

          importSha256:
            sha256_({
              physicalRow:
                Number(
                  row._rowNumber ||
                  0
                ),

              record:
                record
            }),

          projectedOriginalIdentity:
            buildZillowProjection_(
              row
            ),

          survivingCreatedAt:
            physical.createdAt
        };
      });
  }

  function readRunLineage_() {
    var rows =
      REOS.Database
        .getAll(
          RUN_TABLE
        );

    var expected = [
      {
        runId:
          FIRST_REPLAY_RUN,

        inserted:
          0,

        updated:
          50
      },
      {
        runId:
          SECOND_PAGE_INSERT_RUN,

        inserted:
          50,

        updated:
          0
      },
      {
        runId:
          SECOND_REPLAY_RUN,

        inserted:
          0,

        updated:
          50
      }
    ];

    return expected.map(
      function (authority) {
        var matches =
          rows.filter(
            function (row) {
              return (
                text_(
                  row[
                    'Run ID'
                  ]
                ) ===
                authority.runId
              );
            }
          );

        if (
          matches.length !==
          1
        ) {
          throw new Error(
            'County run-lineage record is absent or non-unique: ' +
            authority.runId
          );
        }

        var row =
          matches[0];

        if (
          text_(
            row[
              'Connector ID'
            ]
          ) !==
            CONNECTOR_ID ||
          text_(
            row.Dataset
          ) !==
            DATASET ||
          Number(
            row[
              'Records Inserted'
            ]
          ) !==
            authority.inserted ||
          Number(
            row[
              'Records Updated'
            ]
          ) !==
            authority.updated
        ) {
          throw new Error(
            'County run-lineage authority drifted: ' +
            authority.runId
          );
        }

        var record =
          recordWithoutInternal_(
            row
          );

        return {
          physicalRow:
            Number(
              row._rowNumber ||
              0
            ),

          runId:
            authority.runId,

          record:
            record,

          runSha256:
            sha256_({
              physicalRow:
                Number(
                  row._rowNumber ||
                  0
                ),

              record:
                record
            })
        };
      }
    );
  }

  function metadata() {
    return {
      ok:
        true,

      mode:
        'READ_ONLY_EVIDENCE_METADATA',

      planSha256:
        PLAN_SHA256,

      table:
        TABLE,

      physicalStartRow:
        ROW_START,

      physicalEndRow:
        ROW_END,

      physicalRowCount:
        ROW_COUNT,

      sourceStartOffset:
        SOURCE_START_OFFSET,

      sourceFirstRecordId:
        String(
          SOURCE_FIRST_ID
        ),

      sourceLastRecordId:
        String(
          SOURCE_LAST_ID
        ),

      sourceRecordCount:
        SOURCE_COUNT,

      mutationAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  function exportEvidence(options) {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    requireInvocation_(
      options
    );

    var headers =
      requireSchema_();

    var corridor =
      readPhysicalCorridor_(
        headers
      );

    var source =
      readSourceWindow_();

    var zillowImports =
      readZillowImports_(
        corridor
      );

    var runLineage =
      readRunLineage_();

    var fingerprintBasis = {
      planSha256:
        PLAN_SHA256,

      headerSha256:
        corridor.headerSha256,

      physicalRows:
        corridor.rows.map(
          function (row) {
            return {
              physicalRow:
                row.physicalRow,

              rowSha256:
                row.rowSha256
            };
          }
        ),

      sourceRecords:
        source.records.map(
          function (record) {
            return {
              sourceRecordId:
                record.sourceRecordId,

              sourceSha256:
                record.sourceSha256
            };
          }
        ),

      zillowImports:
        zillowImports.map(
          function (entry) {
            return {
              distressLeadId:
                entry.distressLeadId,

              importSha256:
                entry.importSha256
            };
          }
        ),

      countyRuns:
        runLineage.map(
          function (entry) {
            return {
              runId:
                entry.runId,

              runSha256:
                entry.runSha256
            };
          }
        )
    };

    return {
      ok:
        true,

      mode:
        'READ_ONLY_SPARSE_ROW_REPAIR_EVIDENCE',

      generatedAt:
        new Date()
          .toISOString(),

      planSha256:
        PLAN_SHA256,

      corridor:
        corridor,

      source:
        source,

      zillowImports:
        zillowImports,

      countyRunLineage:
        runLineage,

      fingerprintBasis:
        fingerprintBasis,

      evidenceSha256:
        sha256_(
          fingerprintBasis
        ),

      mutationAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  return {
    metadata:
      metadata,

    exportEvidence:
      exportEvidence
  };
})();

function reosCountySparseRowRepairEvidence(
  options
) {
  return REOS
    .CountySparseRowRepairEvidence
    .exportEvidence(
      options ||
      {}
    );
}
