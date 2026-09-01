/**
 * REOS Enterprise - County Sparse-Row Repair Executor
 *
 * One-time, fail-closed physical-row repair for the certified
 * DISTRESS_LEADS sparse-row incident.
 *
 * Authority:
 * - certified repair plan SHA-256
 * - certified production evidence SHA-256
 * - exact physical corridor 2344-2445
 * - exactly 100 mutable rows: 2344-2443
 * - rows 2444-2445 immutable/no-change
 *
 * This executor grants no scheduler, MAO, offer, insert, delete, or
 * persistent repair authority.
 */
var REOS = REOS || {};

REOS.CountySparseRowRepairExecutor = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var PLAN_SHA256 =
    'd815afaf9f5c9384186c6cb30be98b07a3f5c43755f8f96c4f97e3f45fd9695c';

  var EVIDENCE_SHA256 =
    '002b925c3c267581ccfbf9e6876ade266f1b3e7e4605b66bc38713a64d08a15c';

  var CORRIDOR_START_ROW =
    2344;

  var CORRIDOR_END_ROW =
    2445;

  var CORRIDOR_ROW_COUNT =
    102;

  var WRITE_START_ROW =
    2344;

  var WRITE_END_ROW =
    2443;

  var WRITE_ROW_COUNT =
    100;

  var COUNTY_START_ROW =
    2346;

  var COUNTY_END_ROW =
    2443;

  var COUNTY_ROW_COUNT =
    98;

  var SOURCE_FIRST_ID =
    1601;

  var SOURCE_LAST_ID =
    1700;

  var SOURCE_COUNT =
    100;

  var SOURCE_ROW_DELTA =
    745;

  var HEARTBEAT_HANDLER =
    'reosProductionOperationsHeartbeat';

  var ZILLOW_TARGETS = [
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

  var TAIL_TARGETS = [
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

  var ZILLOW_CLEAR_FIELDS = [
    'Address',
    'City',
    'State',
    'Zip',
    'Owner Name',
    'Distress Type',
    'Estimated Value',
    'Notes',
    'County',
    'Source',
    'Source Dataset',
    'Connector Run ID',
    'Parcel ID',
    'Source Record ID',
    'Source Record Key',
    'Last Seen At',
    'Source Updated At',
    'Co-Owner Name',
    'Estimated Debt',
    'Assessment Value',
    'Year Built',
    'Land Acres',
    'Living Area',
    'Last Sale Date',
    'Last Sale Price',
    'Tax Delinquent Amount',
    'Tax Principal',
    'Tax Interest',
    'Tax Penalty',
    'Violation Amount',
    'Violation Number',
    'Violation Type',
    'Violation Status',
    'Vacancy Status',
    'Vacancy Rank',
    'Sheriff Auction ID',
    'Book/Writ',
    'Sale Type',
    'Sale Status',
    'Sale Date',
    'Source Observation Key',
    'Canonical Property Key'
  ];

  var CODE_VIOLATION_CLEAR_FIELDS = [
    'Tax Principal',
    'Tax Interest',
    'Tax Penalty',
    'Vacancy Status',
    'Vacancy Rank',
    'Sheriff Auction ID',
    'Book/Writ',
    'Sale Type',
    'Sale Status',
    'Sale Date'
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
          normalized
            .toString(16);
      })
      .join('');
  }

  function titleCase_(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(
        /\b\w/g,
        function (letter) {
          return letter
            .toUpperCase();
        }
      );
  }

  function normalizeZip_(value) {
    var zip =
      String(value || '')
        .trim();

    if (!zip) {
      return '';
    }

    var match =
      zip.match(
        /\d{5}(?:-\d{4})?/
      );

    return match
      ? match[0]
      : zip;
  }

  function numberOrBlank_(value) {
    if (
      value === '' ||
      value === null ||
      typeof value ===
        'undefined'
    ) {
      return '';
    }

    var normalized =
      String(value)
        .replace(
          /[$,]/g,
          ''
        )
        .trim();

    var number =
      Number(normalized);

    return isNaN(number)
      ? ''
      : number;
  }

  function parseDateOrBlank_(value) {
    if (!value) {
      return '';
    }

    var date =
      value instanceof Date
        ? value
        : new Date(value);

    return isNaN(
      date.getTime()
    )
      ? ''
      : date;
  }

  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security
        .requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Sparse-row repair requires Admin authority.'
      );
    }

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
        'function'
    ) {
      throw new Error(
        'Sparse-row repair requires certified Database read/lock APIs.'
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
        'Sparse-row repair requires 52-column schema authority.'
      );
    }

    if (
      !REOS.CountySparseRowRepairEvidence ||
      typeof REOS
        .CountySparseRowRepairEvidence
        .exportEvidence !==
        'function'
    ) {
      throw new Error(
        'Sparse-row repair requires certified read-only evidence exporter.'
      );
    }

    if (
      typeof ScriptApp ===
        'undefined' ||
      !ScriptApp ||
      typeof ScriptApp
        .getProjectTriggers !==
        'function'
    ) {
      throw new Error(
        'Sparse-row repair requires installable-trigger inspection.'
      );
    }

    if (
      typeof SpreadsheetApp ===
        'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp
        .flush !==
        'function'
    ) {
      throw new Error(
        'Sparse-row repair requires SpreadsheetApp.flush.'
      );
    }

    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities
        .computeDigest !==
        'function' ||
      typeof Utilities
        .getUuid !==
        'function'
    ) {
      throw new Error(
        'Sparse-row repair requires SHA-256 and UUID support.'
      );
    }
  }

  function requireInvocation_(options) {
    options =
      options ||
      {};

    if (
      options.confirmRepair !==
      true
    ) {
      throw new Error(
        'Sparse-row repair requires confirmRepair=true.'
      );
    }

    if (
      options.confirmInPlace !==
      true
    ) {
      throw new Error(
        'Sparse-row repair requires confirmInPlace=true.'
      );
    }

    if (
      options.confirmNoInsertDelete !==
      true
    ) {
      throw new Error(
        'Sparse-row repair requires confirmNoInsertDelete=true.'
      );
    }

    if (
      text_(
        options.planSha256
      ) !==
      PLAN_SHA256
    ) {
      throw new Error(
        'Sparse-row repair plan SHA-256 mismatch.'
      );
    }

    if (
      text_(
        options.evidenceSha256
      ) !==
      EVIDENCE_SHA256
    ) {
      throw new Error(
        'Sparse-row production evidence SHA-256 mismatch.'
      );
    }
  }

  function triggerSnapshot_() {
    return ScriptApp
      .getProjectTriggers()
      .map(function (trigger) {
        return {
          handler:
            typeof trigger
              .getHandlerFunction ===
              'function'
              ? text_(
                  trigger
                    .getHandlerFunction()
                )
              : '',

          eventType:
            typeof trigger
              .getEventType ===
              'function'
              ? text_(
                  trigger
                    .getEventType()
                )
              : '',

          source:
            typeof trigger
              .getTriggerSource ===
              'function'
              ? text_(
                  trigger
                    .getTriggerSource()
                )
              : '',

          uniqueId:
            typeof trigger
              .getUniqueId ===
              'function'
              ? text_(
                  trigger
                    .getUniqueId()
                )
              : ''
        };
      });
  }

  function assertQuiescence_() {
    var triggers =
      triggerSnapshot_();

    var heartbeat =
      triggers.filter(
        function (trigger) {
          return (
            trigger.handler ===
            HEARTBEAT_HANDLER
          );
        }
      );

    var unexpected =
      triggers.filter(
        function (trigger) {
          return (
            trigger.handler !==
            HEARTBEAT_HANDLER
          );
        }
      );

    if (
      heartbeat.length >
      1
    ) {
      throw new Error(
        'Sparse-row repair requires at most one production heartbeat trigger.'
      );
    }

    if (
      unexpected.length !==
      0
    ) {
      throw new Error(
        'Sparse-row repair requires all mutating installable triggers frozen; unexpected handler: ' +
        unexpected[0].handler
      );
    }

    return {
      triggerCount:
        triggers.length,

      heartbeatTriggerCount:
        heartbeat.length,

      triggers:
        triggers
    };
  }

  function arraysEqual_(left, right) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !==
        right.length
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

  function verifyEvidence_(evidence) {
    if (
      !evidence ||
      evidence.ok !==
        true ||
      evidence.mode !==
        'READ_ONLY_SPARSE_ROW_REPAIR_EVIDENCE' ||
      evidence.planSha256 !==
        PLAN_SHA256 ||
      evidence.evidenceSha256 !==
        EVIDENCE_SHA256
    ) {
      throw new Error(
        'Certified sparse-row production evidence no longer matches authority.'
      );
    }

    if (
      !evidence.corridor ||
      evidence.corridor.startRow !==
        CORRIDOR_START_ROW ||
      evidence.corridor.endRow !==
        CORRIDOR_END_ROW ||
      evidence.corridor.rowCount !==
        CORRIDOR_ROW_COUNT ||
      evidence.corridor.headerCount !==
        52 ||
      !Array.isArray(
        evidence.corridor.rows
      ) ||
      evidence.corridor.rows.length !==
        CORRIDOR_ROW_COUNT
    ) {
      throw new Error(
        'Certified repair corridor evidence drifted.'
      );
    }

    if (
      !evidence.source ||
      evidence.source.recordCount !==
        SOURCE_COUNT ||
      String(
        evidence.source
          .firstSourceRecordId
      ) !==
        String(
          SOURCE_FIRST_ID
        ) ||
      String(
        evidence.source
          .lastSourceRecordId
      ) !==
        String(
          SOURCE_LAST_ID
        ) ||
      !Array.isArray(
        evidence.source.records
      ) ||
      evidence.source.records.length !==
        SOURCE_COUNT
    ) {
      throw new Error(
        'Certified repair source evidence drifted.'
      );
    }

    if (
      !Array.isArray(
        evidence.zillowImports
      ) ||
      evidence.zillowImports.length !==
        2
    ) {
      throw new Error(
        'Certified Zillow repair evidence drifted.'
      );
    }

    if (
      !Array.isArray(
        evidence.countyRunLineage
      ) ||
      evidence.countyRunLineage.length !==
        3
    ) {
      throw new Error(
        'Certified county run-lineage evidence drifted.'
      );
    }

    [
      'mutationAuthorityGranted',
      'repairAuthorityGranted',
      'insertAuthorityGranted',
      'deleteAuthorityGranted',
      'schedulerAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(
      function (key) {
        if (
          evidence[key] !==
          false
        ) {
          throw new Error(
            'Read-only evidence unexpectedly grants authority: ' +
            key
          );
        }
      }
    );

    return true;
  }

  function rowToRecord_(
    headers,
    values
  ) {
    var record = {};

    headers.forEach(
      function (header, index) {
        record[header] =
          values[index];
      }
    );

    return record;
  }

  function recordToRow_(
    headers,
    record
  ) {
    return headers.map(
      function (header) {
        return Object
          .prototype
          .hasOwnProperty
          .call(
            record,
            header
          )
          ? record[header]
          : '';
      }
    );
  }

  function verifyCorridorPrestate_(
    sheet,
    headers,
    evidence
  ) {
    if (
      sha256_(headers) !==
      evidence.corridor
        .headerSha256
    ) {
      throw new Error(
        'DISTRESS_LEADS header fingerprint changed.'
      );
    }

    var values =
      sheet
        .getRange(
          CORRIDOR_START_ROW,
          1,
          CORRIDOR_ROW_COUNT,
          headers.length
        )
        .getValues();

    if (
      !Array.isArray(values) ||
      values.length !==
        CORRIDOR_ROW_COUNT
    ) {
      throw new Error(
        'Certified physical repair corridor could not be read.'
      );
    }

    values.forEach(
      function (
        rowValues,
        index
      ) {
        var physicalRow =
          CORRIDOR_START_ROW +
          index;

        var expected =
          evidence
            .corridor
            .rows[index];

        if (
          !expected ||
          expected.physicalRow !==
            physicalRow
        ) {
          throw new Error(
            'Certified corridor row ordering changed.'
          );
        }

        var actualSha =
          sha256_({
            physicalRow:
              physicalRow,

            values:
              rowValues
                .map(
                  safeValue_
                )
          });

        if (
          actualSha !==
          expected.rowSha256
        ) {
          throw new Error(
            'Certified sparse-row prestate drifted at physical row ' +
            physicalRow +
            '.'
          );
        }
      }
    );

    return values;
  }

  function sourceById_(
    evidence
  ) {
    var map = {};

    evidence.source
      .records
      .forEach(
        function (record) {
          var id =
            text_(
              record
                .sourceRecordId
            );

          if (
            !id ||
            map[id]
          ) {
            throw new Error(
              'Certified source evidence contains duplicate/missing source identity.'
            );
          }

          map[id] =
            record;
        }
      );

    return map;
  }

  function countyTargetRecord_(
    current,
    sourceEntry,
    repairRunId,
    now
  ) {
    var source =
      Object.assign(
        {},
        sourceEntry
          .normalizedSourceRecord ||
        {}
      );

    source.Address =
      titleCase_(
        source.Address
      );

    source.City =
      titleCase_(
        source.City
      );

    source.State =
      String(
        source.State ||
        'PA'
      ).toUpperCase();

    source.Zip =
      normalizeZip_(
        source.Zip
      );

    source.County =
      source.County ||
      'Philadelphia';

    source.Source =
      source.Source ||
      CONNECTOR_ID;

    source[
      'Source Dataset'
    ] =
      source[
        'Source Dataset'
      ] ||
      DATASET;

    source[
      'Connector Run ID'
    ] =
      repairRunId;

    source[
      'Owner Name'
    ] =
      String(
        source[
          'Owner Name'
        ] ||
        ''
      ).trim();

    source[
      'Parcel ID'
    ] =
      String(
        source[
          'Parcel ID'
        ] ||
        ''
      ).trim();

    source[
      'Distress Type'
    ] =
      source[
        'Distress Type'
      ] ||
      DATASET;

    source[
      'Estimated Value'
    ] =
      numberOrBlank_(
        source[
          'Estimated Value'
        ]
      );

    source[
      'Estimated Debt'
    ] =
      numberOrBlank_(
        source[
          'Estimated Debt'
        ]
      );

    source[
      'Tax Delinquent Amount'
    ] =
      numberOrBlank_(
        source[
          'Tax Delinquent Amount'
        ]
      );

    source[
      'Violation Amount'
    ] =
      numberOrBlank_(
        source[
          'Violation Amount'
        ]
      );

    source[
      'Source Updated At'
    ] =
      parseDateOrBlank_(
        source[
          'Source Updated At'
        ]
      );

    source[
      'Source Record Key'
    ] =
      sourceEntry
        .sourceObservationKey;

    source[
      'Source Observation Key'
    ] =
      sourceEntry
        .sourceObservationKey;

    source[
      'Canonical Property Key'
    ] =
      sourceEntry
        .canonicalPropertyKey;

    source[
      'Last Seen At'
    ] =
      now;

    source[
      'Updated At'
    ] =
      now;

    var target =
      Object.assign(
        {},
        current,
        source
      );

    CODE_VIOLATION_CLEAR_FIELDS
      .forEach(
        function (field) {
          target[field] =
            '';
        }
      );

    /*
     * Physical-record identity and creation authority survive the repair.
     */
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

    return target;
  }

  function zillowEvidenceByLead_(
    evidence
  ) {
    var map = {};

    evidence
      .zillowImports
      .forEach(
        function (entry) {
          var id =
            text_(
              entry
                .distressLeadId
            );

          if (
            !id ||
            map[id]
          ) {
            throw new Error(
              'Certified Zillow evidence contains duplicate/missing lead identity.'
            );
          }

          map[id] =
            entry;
        }
      );

    return map;
  }

  function zillowTargetRecord_(
    current,
    targetAuthority,
    evidenceEntry,
    now
  ) {
    if (
      !evidenceEntry ||
      evidenceEntry
        .distressLeadId !==
        targetAuthority
          .distressLeadId ||
      evidenceEntry
        .gmailMessageId !==
        targetAuthority
          .gmailMessageId ||
      evidenceEntry
        .importId !==
        targetAuthority
          .importId
    ) {
      throw new Error(
        'Certified Zillow victim provenance changed.'
      );
    }

    var importRecord =
      evidenceEntry
        .importRecord ||
      {};

    var projected =
      evidenceEntry
        .projectedOriginalIdentity ||
      {};

    var target =
      Object.assign(
        {},
        current
      );

    ZILLOW_CLEAR_FIELDS
      .forEach(
        function (field) {
          target[field] =
            '';
        }
      );

    /*
     * Restore only values directly evidenced by the Zillow import ledger.
     * City/State/Zip are intentionally blanked rather than manufactured
     * because those fields are not independently preserved in the ledger.
     */
    target.Address =
      text_(
        importRecord[
          'Property Address'
        ]
      );

    target.City =
      '';

    target.State =
      '';

    target.Zip =
      '';

    target[
      'Owner Name'
    ] =
      text_(
        importRecord[
          'Contact Name'
        ]
      );

    target[
      'Distress Type'
    ] =
      text_(
        projected
          .distressType
      );

    target.Source =
      text_(
        projected.source
      );

    target[
      'Source Dataset'
    ] =
      text_(
        projected
          .sourceDataset
      );

    target[
      'Source Record ID'
    ] =
      text_(
        projected
          .sourceRecordId
      );

    target[
      'Source Record Key'
    ] =
      text_(
        projected
          .sourceRecordKey
      );

    target[
      'Source Observation Key'
    ] =
      text_(
        projected
          .sourceObservationKey
      );

    target[
      'Canonical Property Key'
    ] =
      text_(
        projected
          .canonicalPropertyKey
      );

    target.Status =
      text_(
        projected.status
      );

    target.Notes =
      text_(
        projected.notes
      );

    target[
      'Updated At'
    ] =
      now;

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

    if (
      text_(
        target[
          'Distress Lead ID'
        ]
      ) !==
        targetAuthority
          .distressLeadId
    ) {
      throw new Error(
        'Certified Zillow physical-row identity changed.'
      );
    }

    return target;
  }

  function buildTargetRows_(
    headers,
    beforeValues,
    evidence,
    repairRunId,
    now
  ) {
    var sourceMap =
      sourceById_(
        evidence
      );

    var zillowMap =
      zillowEvidenceByLead_(
        evidence
      );

    var targets = [];

    ZILLOW_TARGETS
      .forEach(
        function (authority) {
          var index =
            authority.physicalRow -
            CORRIDOR_START_ROW;

          var current =
            rowToRecord_(
              headers,
              beforeValues[index]
            );

          var target =
            zillowTargetRecord_(
              current,
              authority,
              zillowMap[
                authority
                  .distressLeadId
              ],
              now
            );

          targets.push(
            recordToRow_(
              headers,
              target
            )
          );
        }
      );

    for (
      var physicalRow =
        COUNTY_START_ROW;
      physicalRow <=
        COUNTY_END_ROW;
      physicalRow++
    ) {
      var intendedId =
        String(
          physicalRow -
          SOURCE_ROW_DELTA
        );

      var sourceEntry =
        sourceMap[
          intendedId
        ];

      if (
        !sourceEntry ||
        text_(
          sourceEntry
            .sourceRecordId
        ) !==
          intendedId ||
        text_(
          sourceEntry
            .sourceObservationKey
        ) !==
          (
            'pa-philadelphia|code_violations|' +
            intendedId
          ) ||
        !text_(
          sourceEntry
            .canonicalPropertyKey
        )
      ) {
        throw new Error(
          'Certified intended county source authority missing for physical row ' +
          physicalRow +
          '.'
        );
      }

      var currentIndex =
        physicalRow -
        CORRIDOR_START_ROW;

      var currentRecord =
        rowToRecord_(
          headers,
          beforeValues[
            currentIndex
          ]
        );

      var countyTarget =
        countyTargetRecord_(
          currentRecord,
          sourceEntry,
          repairRunId,
          now
        );

      if (
        text_(
          countyTarget[
            'Source Record ID'
          ]
        ) !==
          intendedId
      ) {
        throw new Error(
          'County repair target identity mismatch at physical row ' +
          physicalRow +
          '.'
        );
      }

      targets.push(
        recordToRow_(
          headers,
          countyTarget
        )
      );
    }

    if (
      targets.length !==
      WRITE_ROW_COUNT
    ) {
      throw new Error(
        'Repair target block must contain exactly 100 rows.'
      );
    }

    return targets;
  }

  /*
   * Sole production mutation primitive in this module.
   *
   * This helper can be invoked once for the repair and, only if required
   * by failed post-write reconciliation, once to restore certified prestate.
   */
  function writeBlock_(
    sheet,
    values
  ) {
    sheet
      .getRange(
        WRITE_START_ROW,
        1,
        WRITE_ROW_COUNT,
        52
      )
      .setValues(
        values
      );
  }

  function verifyPoststate_(
    sheet,
    headers,
    beforeValues,
    evidence,
    repairRunId,
    beforeLastRow
  ) {
    if (
      Number(
        sheet.getLastRow()
      ) !==
        Number(
          beforeLastRow
        )
    ) {
      throw new Error(
        'DISTRESS_LEADS row count changed during repair.'
      );
    }

    var values =
      sheet
        .getRange(
          CORRIDOR_START_ROW,
          1,
          CORRIDOR_ROW_COUNT,
          headers.length
        )
        .getValues();

    var idIndex =
      headers.indexOf(
        'Distress Lead ID'
      );

    var createdIndex =
      headers.indexOf(
        'Created At'
      );

    var sourceIndex =
      headers.indexOf(
        'Source'
      );

    var datasetIndex =
      headers.indexOf(
        'Source Dataset'
      );

    var runIndex =
      headers.indexOf(
        'Connector Run ID'
      );

    var sourceIdIndex =
      headers.indexOf(
        'Source Record ID'
      );

    var sourceKeyIndex =
      headers.indexOf(
        'Source Record Key'
      );

    var observationIndex =
      headers.indexOf(
        'Source Observation Key'
      );

    ZILLOW_TARGETS
      .forEach(
        function (authority) {
          var index =
            authority.physicalRow -
            CORRIDOR_START_ROW;

          var row =
            values[index];

          if (
            text_(row[idIndex]) !==
              authority
                .distressLeadId ||
            text_(row[sourceIndex]) !==
              'Zillow Gmail' ||
            text_(row[datasetIndex]) !==
              'gmail_leads' ||
            text_(row[sourceKeyIndex]) !==
              text_(
                row[
                  observationIndex
                ]
              ) ||
            safeValue_(
              row[
                createdIndex
              ]
            ) !==
              safeValue_(
                beforeValues[
                  index
                ][
                  createdIndex
                ]
              )
          ) {
            throw new Error(
              'Zillow post-repair reconciliation failed at physical row ' +
              authority.physicalRow +
              '.'
            );
          }
        }
      );

    for (
      var physicalRow =
        COUNTY_START_ROW;
      physicalRow <=
        COUNTY_END_ROW;
      physicalRow++
    ) {
      var index =
        physicalRow -
        CORRIDOR_START_ROW;

      var intendedId =
        String(
          physicalRow -
          SOURCE_ROW_DELTA
        );

      var row =
        values[index];

      if (
        text_(row[sourceIndex]) !==
          CONNECTOR_ID ||
        text_(row[datasetIndex]) !==
          DATASET ||
        text_(row[runIndex]) !==
          repairRunId ||
        text_(row[sourceIdIndex]) !==
          intendedId ||
        text_(row[sourceKeyIndex]) !==
          (
            'pa-philadelphia|code_violations|' +
            intendedId
          ) ||
        text_(row[observationIndex]) !==
          (
            'pa-philadelphia|code_violations|' +
            intendedId
          ) ||
        text_(row[idIndex]) !==
          text_(
            beforeValues[
              index
            ][
              idIndex
            ]
          ) ||
        safeValue_(
          row[
            createdIndex
          ]
        ) !==
          safeValue_(
            beforeValues[
              index
            ][
              createdIndex
            ]
          )
      ) {
        throw new Error(
          'County post-repair reconciliation failed at physical row ' +
          physicalRow +
          '.'
        );
      }
    }

    TAIL_TARGETS
      .forEach(
        function (authority) {
          var index =
            authority.physicalRow -
            CORRIDOR_START_ROW;

          var actualSha =
            sha256_({
              physicalRow:
                authority
                  .physicalRow,

              values:
                values[index]
                  .map(
                    safeValue_
                  )
            });

          var expected =
            evidence
              .corridor
              .rows[index];

          if (
            actualSha !==
              expected.rowSha256 ||
            text_(
              values[index][
                idIndex
              ]
            ) !==
              authority
                .distressLeadId ||
            text_(
              values[index][
                sourceIdIndex
              ]
            ) !==
              authority
                .sourceRecordId
          ) {
            throw new Error(
              'Protected tail row changed: ' +
              authority.physicalRow +
              '.'
            );
          }
        }
      );

    /*
     * Full-table identity reconciliation.
     */
    var lastRow =
      Number(
        sheet.getLastRow()
      );

    var allRows =
      lastRow >= 2
        ? sheet
            .getRange(
              2,
              1,
              lastRow - 1,
              headers.length
            )
            .getValues()
        : [];

    var countyCounts = {};

    for (
      var id =
        SOURCE_FIRST_ID;
      id <=
        SOURCE_LAST_ID;
      id++
    ) {
      countyCounts[
        String(id)
      ] =
        0;
    }

    var victimCounts = {};

    ZILLOW_TARGETS
      .forEach(
        function (authority) {
          victimCounts[
            authority
              .distressLeadId
          ] =
            0;
        }
      );

    allRows.forEach(
      function (row) {
        var leadId =
          text_(
            row[idIndex]
          );

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              victimCounts,
              leadId
            )
        ) {
          victimCounts[
            leadId
          ] +=
            1;
        }

        if (
          text_(
            row[sourceIndex]
          ) ===
            CONNECTOR_ID &&
          text_(
            row[datasetIndex]
          ) ===
            DATASET
        ) {
          var sourceId =
            text_(
              row[
                sourceIdIndex
              ]
            );

          if (
            Object.prototype
              .hasOwnProperty
              .call(
                countyCounts,
                sourceId
              )
          ) {
            countyCounts[
              sourceId
            ] +=
              1;
          }
        }
      }
    );

    Object.keys(
      countyCounts
    ).forEach(
      function (id) {
        if (
          countyCounts[id] !==
          1
        ) {
          throw new Error(
            'Post-repair source observation ' +
            id +
            ' occurs ' +
            countyCounts[id] +
            ' times.'
          );
        }
      }
    );

    Object.keys(
      victimCounts
    ).forEach(
      function (id) {
        if (
          victimCounts[id] !==
          1
        ) {
          throw new Error(
            'Post-repair Zillow victim ' +
            id +
            ' occurs ' +
            victimCounts[id] +
            ' times.'
          );
        }
      }
    );

    var rowFingerprints =
      values.map(
        function (
          row,
          index
        ) {
          return {
            physicalRow:
              CORRIDOR_START_ROW +
              index,

            rowSha256:
              sha256_({
                physicalRow:
                  CORRIDOR_START_ROW +
                  index,

                values:
                  row.map(
                    safeValue_
                  )
              })
          };
        }
      );

    return {
      repairedRowCount:
        WRITE_ROW_COUNT,

      zillowRowsRestored:
        2,

      countyRowsRestored:
        COUNTY_ROW_COUNT,

      protectedTailRows:
        2,

      sourceObservationCount:
        SOURCE_COUNT,

      corridorFingerprintSha256:
        sha256_(
          rowFingerprints
        )
    };
  }

  function status() {
    requireDependencies_();

    var triggers =
      triggerSnapshot_();

    var unexpected =
      triggers.filter(
        function (trigger) {
          return (
            trigger.handler !==
            HEARTBEAT_HANDLER
          );
        }
      );

    var heartbeat =
      triggers.filter(
        function (trigger) {
          return (
            trigger.handler ===
            HEARTBEAT_HANDLER
          );
        }
      );

    return {
      ok:
        unexpected.length ===
          0 &&
        heartbeat.length <=
          1,

      mode:
        'READ_ONLY_SPARSE_ROW_REPAIR_STATUS',

      planSha256:
        PLAN_SHA256,

      evidenceSha256:
        EVIDENCE_SHA256,

      writeStartRow:
        WRITE_START_ROW,

      writeEndRow:
        WRITE_END_ROW,

      writeRowCount:
        WRITE_ROW_COUNT,

      protectedTailStartRow:
        2444,

      protectedTailEndRow:
        2445,

      triggerCount:
        triggers.length,

      heartbeatTriggerCount:
        heartbeat.length,

      unexpectedTriggerCount:
        unexpected.length,

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

  function execute(options) {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    requireInvocation_(
      options
    );

    var preQuiescence =
      assertQuiescence_();

    /*
     * Recreate the entire read-only evidence boundary immediately before
     * acquiring mutation authority. Any production/source drift changes
     * evidenceSha256 and fails before the ScriptLock or write.
     */
    var evidence =
      REOS
        .CountySparseRowRepairEvidence
        .exportEvidence({
          confirmReadOnly:
            true,

          planSha256:
            PLAN_SHA256
        });

    verifyEvidence_(
      evidence
    );

    var repairRunId =
      'CSR-' +
      Utilities
        .getUuid();

    var mutationVerified =
      false;

    try {
      var result =
        REOS.Database
          .withScriptLockContext(
            function () {
              var inLockQuiescence =
                assertQuiescence_();

              var headers =
                REOS.Database
                  .getHeaders(
                    TABLE
                  );

              var expectedHeaders =
                REOS
                  .DistressLeadCountySchema
                  .requiredHeaders();

              if (
                headers.length !==
                  52 ||
                !arraysEqual_(
                  headers,
                  expectedHeaders
                )
              ) {
                throw new Error(
                  'DISTRESS_LEADS schema is not exact 52-column certified authority.'
                );
              }

              var sheet =
                REOS.Database
                  .getSheet(
                    TABLE
                  );

              var beforeLastRow =
                Number(
                  sheet
                    .getLastRow()
                );

              if (
                beforeLastRow <
                CORRIDOR_END_ROW
              ) {
                throw new Error(
                  'DISTRESS_LEADS no longer reaches certified repair corridor.'
                );
              }

              /*
               * Lock-bound physical prestate fingerprint prevents the
               * evidence-export/read-to-write race.
               */
              var beforeValues =
                verifyCorridorPrestate_(
                  sheet,
                  headers,
                  evidence
                );

              var now =
                new Date();

              var targetValues =
                buildTargetRows_(
                  headers,
                  beforeValues,
                  evidence,
                  repairRunId,
                  now
                );

              var rollbackValues =
                beforeValues
                  .slice(
                    0,
                    WRITE_ROW_COUNT
                  );

              var writeAttempted =
                false;

              try {
                writeAttempted =
                  true;

                writeBlock_(
                  sheet,
                  targetValues
                );

                SpreadsheetApp
                  .flush();

                var reconciliation =
                  verifyPoststate_(
                    sheet,
                    headers,
                    beforeValues,
                    evidence,
                    repairRunId,
                    beforeLastRow
                  );

                mutationVerified =
                  true;

                return {
                  ok:
                    true,

                  mode:
                    'CERTIFIED_SPARSE_ROW_REPAIR_EXECUTED',

                  planSha256:
                    PLAN_SHA256,

                  evidenceSha256:
                    EVIDENCE_SHA256,

                  repairRunId:
                    repairRunId,

                  repairedAt:
                    now
                      .toISOString(),

                  repairedRowCount:
                    reconciliation
                      .repairedRowCount,

                  zillowRowsRestored:
                    reconciliation
                      .zillowRowsRestored,

                  countyRowsRestored:
                    reconciliation
                      .countyRowsRestored,

                  protectedTailRows:
                    reconciliation
                      .protectedTailRows,

                  sourceObservationCount:
                    reconciliation
                      .sourceObservationCount,

                  corridorFingerprintSha256:
                    reconciliation
                      .corridorFingerprintSha256,

                  triggerCountBefore:
                    preQuiescence
                      .triggerCount,

                  triggerCountUnderLock:
                    inLockQuiescence
                      .triggerCount,

                  productionDataMutationExecuted:
                    true,

                  repairExecuted:
                    true,

                  repairAuthorityConsumed:
                    true,

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
              } catch (repairError) {
                if (
                  writeAttempted
                ) {
                  try {
                    /*
                     * Fail-safe rollback to the exact 100-row certified
                     * prestate. The two protected tail rows were never in
                     * the writable block.
                     */
                    writeBlock_(
                      sheet,
                      rollbackValues
                    );

                    SpreadsheetApp
                      .flush();

                    verifyCorridorPrestate_(
                      sheet,
                      headers,
                      evidence
                    );
                  } catch (rollbackError) {
                    throw new Error(
                      'SPARSE_ROW_REPAIR_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY: repair=' +
                      (
                        repairError.message ||
                        String(repairError)
                      ) +
                      '; rollback=' +
                      (
                        rollbackError.message ||
                        String(
                          rollbackError
                        )
                      )
                    );
                  }
                }

                throw new Error(
                  'Sparse-row repair failed and certified prestate was restored: ' +
                  (
                    repairError.message ||
                    String(repairError)
                  )
                );
              }
            }
          );

      return result;
    } catch (error) {
      /*
       * If callback reconciliation succeeded but Database's outer lock
       * finalization/flush fails, the physical result is ambiguous.
       * Never advise automatic retry.
       */
      if (
        mutationVerified
      ) {
        throw new Error(
          'SPARSE_ROW_REPAIR_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY: ' +
          (
            error.message ||
            String(error)
          )
        );
      }

      throw error;
    }
  }

  return {
    status:
      status,

    execute:
      execute
  };
})();


function reosCountySparseRowRepairStatus() {
  if (
    !REOS.Security ||
    typeof REOS.Security
      .requireAdmin !==
      'function'
  ) {
    throw new Error(
      'Sparse-row repair status requires Admin authority.'
    );
  }

  REOS.Security
    .requireAdmin();

  return REOS
    .CountySparseRowRepairExecutor
    .status();
}


function reosCountySparseRowRepairExecute(
  options
) {
  return REOS
    .CountySparseRowRepairExecutor
    .execute(
      options ||
      {}
    );
}
