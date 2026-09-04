/**
 * REOS Enterprise - County Page-86 Duplicate Source Repair Evidence
 *
 * Read-only, fail-closed evidence boundary for the eight certified
 * Page-86 duplicate county source observations.
 *
 * This module:
 * - binds the exact Page-86 failure set;
 * - binds the exact certified persisted physical-row membership;
 * - binds the seven Zillow-linked identities to their import-ledger
 *   provenance;
 * - requires fresh county source identity before any later repair;
 * - grants no mutation, repair, scheduler, insert, delete, MAO, or
 *   automatic offer authority.
 */
var REOS = REOS || {};

REOS.CountyPage86DuplicateSourceRepairEvidence = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var IMPORT_TABLE =
    'ZILLOW_GMAIL_IMPORTS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var TARGETS = [
    {
      sourceRecordId: '230',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|466864',
      sourceObservationKey: 'pa-philadelphia|code_violations|230',
      sourceTruthRow: 867,
      rows: [
        { physicalRow: 867, distressLeadId: 'DL-20260821000143-8926' },
        { physicalRow: 875, distressLeadId: 'DL-20260821000153-3649' },
        { physicalRow: 883, distressLeadId: 'DL-20260821000201-4414' },
        { physicalRow: 891, distressLeadId: 'DL-20260821000211-6306' },
        { physicalRow: 899, distressLeadId: 'DL-20260821000222-4232' },
        { physicalRow: 907, distressLeadId: 'ZIL-20260821042918-7288' }
      ]
    },
    {
      sourceRecordId: '231',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|466864',
      sourceObservationKey: 'pa-philadelphia|code_violations|231',
      sourceTruthRow: 865,
      rows: [
        { physicalRow: 865, distressLeadId: 'DL-20260821000140-3007' },
        { physicalRow: 873, distressLeadId: 'DL-20260821000150-5147' },
        { physicalRow: 881, distressLeadId: 'DL-20260821000159-6198' },
        { physicalRow: 889, distressLeadId: 'DL-20260821000209-5007' },
        { physicalRow: 897, distressLeadId: 'DL-20260821000219-8515' },
        { physicalRow: 905, distressLeadId: 'DL-20260821000230-6327' },
        { physicalRow: 913, distressLeadId: 'DL-20260821060131-6121' }
      ]
    },
    {
      sourceRecordId: '232',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|466864',
      sourceObservationKey: 'pa-philadelphia|code_violations|232',
      sourceTruthRow: 863,
      rows: [
        { physicalRow: 863, distressLeadId: 'DL-20260821000138-6529' },
        { physicalRow: 871, distressLeadId: 'DL-20260821000148-2860' },
        { physicalRow: 879, distressLeadId: 'DL-20260821000157-8695' },
        { physicalRow: 887, distressLeadId: 'DL-20260821000207-7244' },
        { physicalRow: 895, distressLeadId: 'DL-20260821000216-8199' },
        { physicalRow: 903, distressLeadId: 'DL-20260821000227-0816' },
        { physicalRow: 911, distressLeadId: 'ZIL-20260821053422-1314' }
      ]
    },
    {
      sourceRecordId: '233',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|466864',
      sourceObservationKey: 'pa-philadelphia|code_violations|233',
      sourceTruthRow: 861,
      rows: [
        { physicalRow: 861, distressLeadId: 'DL-20260821000135-3459' },
        { physicalRow: 869, distressLeadId: 'DL-20260821000145-0248' },
        { physicalRow: 877, distressLeadId: 'DL-20260821000154-8400' },
        { physicalRow: 885, distressLeadId: 'DL-20260821000204-9947' },
        { physicalRow: 893, distressLeadId: 'DL-20260821000214-4610' },
        { physicalRow: 901, distressLeadId: 'DL-20260821000225-7482' },
        { physicalRow: 909, distressLeadId: 'ZIL-20260821045916-2245' }
      ]
    },
    {
      sourceRecordId: '236',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|42503',
      sourceObservationKey: 'pa-philadelphia|code_violations|236',
      sourceTruthRow: 839,
      rows: [
        { physicalRow: 839, distressLeadId: 'DL-20260820212500-6770' },
        { physicalRow: 849, distressLeadId: 'DL-20260820212529-0394' },
        { physicalRow: 859, distressLeadId: 'DL-20260820212556-1648' }
      ]
    },
    {
      sourceRecordId: '237',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|42503',
      sourceObservationKey: 'pa-philadelphia|code_violations|237',
      sourceTruthRow: 837,
      rows: [
        { physicalRow: 837, distressLeadId: 'DL-20260820212455-7628' },
        { physicalRow: 847, distressLeadId: 'DL-20260820212526-8363' },
        { physicalRow: 857, distressLeadId: 'DL-20260820212551-4593' }
      ]
    },
    {
      sourceRecordId: '249',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|24906',
      sourceObservationKey: 'pa-philadelphia|code_violations|249',
      sourceTruthRow: 906,
      rows: [
        { physicalRow: 906, distressLeadId: 'ZIL-20260821034917-9232' },
        { physicalRow: 910, distressLeadId: 'ZIL-20260821050923-8742' },
        { physicalRow: 914, distressLeadId: 'DL-20260821060132-1584' },
        { physicalRow: 918, distressLeadId: 'DL-20260821060139-3104' }
      ]
    },
    {
      sourceRecordId: '250',
      canonicalPropertyKey: 'property|parcel|pa|philadelphia|24906',
      sourceObservationKey: 'pa-philadelphia|code_violations|250',
      sourceTruthRow: 904,
      rows: [
        { physicalRow: 904, distressLeadId: 'DL-20260821000229-0951' },
        { physicalRow: 908, distressLeadId: 'ZIL-20260821043420-6416' },
        { physicalRow: 912, distressLeadId: 'ZIL-20260821054916-6026' },
        { physicalRow: 916, distressLeadId: 'DL-20260821060136-0756' }
      ]
    }
  ];

  var EXPECTED_REFERENCES = [
    {
      distressLeadId: 'ZIL-20260821042918-7288',
      sheet: 'ZILLOW_GMAIL_IMPORTS',
      rowNumber: 41,
      columnNumber: 13
    },
    {
      distressLeadId: 'ZIL-20260821053422-1314',
      sheet: 'ZILLOW_GMAIL_IMPORTS',
      rowNumber: 45,
      columnNumber: 13
    },
    {
      distressLeadId: 'ZIL-20260821045916-2245',
      sheet: 'ZILLOW_GMAIL_IMPORTS',
      rowNumber: 43,
      columnNumber: 13
    },
    {
      distressLeadId: 'ZIL-20260821034917-9232',
      sheet: 'ZILLOW_GMAIL_IMPORTS',
      rowNumber: 40,
      columnNumber: 13
    },
    {
      distressLeadId: 'ZIL-20260821050923-8742',
      sheet: 'ZILLOW_GMAIL_IMPORTS',
      rowNumber: 44,
      columnNumber: 13
    },
    {
      distressLeadId: 'ZIL-20260821043420-6416',
      sheet: 'ZILLOW_GMAIL_IMPORTS',
      rowNumber: 42,
      columnNumber: 13
    },
    {
      distressLeadId: 'ZIL-20260821054916-6026',
      sheet: 'ZILLOW_GMAIL_IMPORTS',
      rowNumber: 46,
      columnNumber: 13
    }
  ];

  var ZILLOW_IMPORTS = [
    {
      physicalRow: 907,
      distressLeadId: 'ZIL-20260821042918-7288',
      importRow: 41,
      importId: 'ZGMI-20260821042920-7476',
      gmailMessageId: '1a0236c99758bc51'
    },
    {
      physicalRow: 911,
      distressLeadId: 'ZIL-20260821053422-1314',
      importRow: 45,
      importId: 'ZGMI-20260821053424-6624',
      gmailMessageId: '1a023a73e37d1fb4'
    },
    {
      physicalRow: 909,
      distressLeadId: 'ZIL-20260821045916-2245',
      importRow: 43,
      importId: 'ZGMI-20260821045919-0126',
      gmailMessageId: '1a0238a58474f4aa'
    },
    {
      physicalRow: 906,
      distressLeadId: 'ZIL-20260821034917-9232',
      importRow: 40,
      importId: 'ZGMI-20260821034919-7196',
      gmailMessageId: '1a0234b713dcb797'
    },
    {
      physicalRow: 910,
      distressLeadId: 'ZIL-20260821050923-8742',
      importRow: 44,
      importId: 'ZGMI-20260821050925-9514',
      gmailMessageId: '1a02392f99bf2343'
    },
    {
      physicalRow: 908,
      distressLeadId: 'ZIL-20260821043420-6416',
      importRow: 42,
      importId: 'ZGMI-20260821043425-1244',
      gmailMessageId: '1a02372bd58c1ae6'
    },
    {
      physicalRow: 912,
      distressLeadId: 'ZIL-20260821054916-6026',
      importRow: 46,
      importId: 'ZGMI-20260821054917-8487',
      gmailMessageId: '1a023b5f1686eb60'
    }
  ];

  function text_(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).trim();
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getAll !== 'function' ||
      typeof REOS.Database.getHeaders !== 'function' ||
      typeof REOS.Database.getSheet !== 'function'
    ) {
      throw new Error(
        'Page-86 repair evidence requires certified Database read APIs.'
      );
    }

    if (
      !REOS.CountyCodeViolationSourceRecordDiagnostic ||
      typeof REOS.CountyCodeViolationSourceRecordDiagnostic.inspect !== 'function'
    ) {
      throw new Error(
        'Page-86 repair evidence requires fresh ArcGIS source diagnostic authority.'
      );
    }
  }

  function readImport_(authority) {
    var matches =
      REOS.Database.getAll(IMPORT_TABLE)
        .filter(function (row) {
          return (
            text_(row['Distress Lead ID']) ===
              authority.distressLeadId
          );
        });

    if (matches.length !== 1) {
      throw new Error(
        'Page-86 Zillow import provenance cardinality changed for ' +
          authority.distressLeadId +
          '.'
      );
    }

    var row = matches[0];

    if (
      text_(row['Import ID']) !== authority.importId ||
      text_(row['Gmail Message ID']) !== authority.gmailMessageId ||
      Number(row._rowNumber) !== authority.importRow ||
      text_(row.Status) !== 'Imported'
    ) {
      throw new Error(
        'Page-86 Zillow import provenance drifted for ' +
          authority.distressLeadId +
          '.'
      );
    }

    return {
      physicalRow: authority.physicalRow,
      distressLeadId: authority.distressLeadId,
      importRow: authority.importRow,
      importId: authority.importId,
      gmailMessageId: authority.gmailMessageId,
      record: row
    };
  }

  function freshSource_(target) {
    var diagnostic =
      REOS.CountyCodeViolationSourceRecordDiagnostic
        .inspect(Number(target.sourceRecordId));

    if (
      !diagnostic ||
      diagnostic.ok !== true ||
      diagnostic.readOnly !== true ||
      diagnostic.sourceRecordFound !== true ||
      diagnostic.normalizedRecordSkipped !== false
    ) {
      throw new Error(
        'Page-86 fresh source authority unavailable for object ' +
          target.sourceRecordId +
          '.'
      );
    }

    var identity =
      diagnostic.normalizedIdentity || {};

    if (
      text_(identity.sourceObservationKey) !==
        target.sourceObservationKey ||
      text_(identity.canonicalPropertyKey) !==
        target.canonicalPropertyKey
    ) {
      throw new Error(
        'Page-86 fresh source identity drift for object ' +
          target.sourceRecordId +
          '.'
      );
    }

    return diagnostic;
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
      return value.map(safeValue_);
    }

    if (typeof value === 'object') {
      var result = {};

      Object.keys(value)
        .sort()
        .forEach(function (key) {
          if (
            typeof value[key] !==
            'function'
          ) {
            result[key] =
              safeValue_(value[key]);
          }
        });

      return result;
    }

    return String(value);
  }

  function sha256_(value) {
    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        value,
        Utilities.Charset.UTF_8
      );

    return digest.map(function (byte) {
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
    }).join('');
  }

  function allCertifiedRows_() {
    var rows = [];

    TARGETS.forEach(function (target) {
      target.rows.forEach(function (row) {
        rows.push({
          sourceRecordId:
            target.sourceRecordId,

          sourceObservationKey:
            target.sourceObservationKey,

          canonicalPropertyKey:
            target.canonicalPropertyKey,

          sourceTruthRow:
            target.sourceTruthRow,

          physicalRow:
            row.physicalRow,

          distressLeadId:
            row.distressLeadId
        });
      });
    });

    if (rows.length !== 41) {
      throw new Error(
        'Page-86 repair authority must contain exactly 41 certified physical rows.'
      );
    }

    return rows;
  }

  function readPhysicalPrestate_() {
    var headers =
      REOS.Database
        .getHeaders(TABLE);

    var sheet =
      REOS.Database
        .getSheet(TABLE);

    if (
      !headers ||
      !headers.length
    ) {
      throw new Error(
        'Page-86 repair evidence could not read DISTRESS_LEADS headers.'
      );
    }

    var idIndex =
      headers.indexOf(
        'Distress Lead ID'
      );

    var sourceIndex =
      headers.indexOf(
        'Source'
      );

    var datasetIndex =
      headers.indexOf(
        'Source Dataset'
      );

    var recordIdIndex =
      headers.indexOf(
        'Source Record ID'
      );

    var recordKeyIndex =
      headers.indexOf(
        'Source Record Key'
      );

    [
      idIndex,
      sourceIndex,
      datasetIndex,
      recordIdIndex,
      recordKeyIndex
    ].forEach(function (index) {
      if (index < 0) {
        throw new Error(
          'Page-86 repair evidence schema authority changed.'
        );
      }
    });

    return allCertifiedRows_()
      .map(function (authority) {
        var values =
          sheet
            .getRange(
              authority.physicalRow,
              1,
              1,
              headers.length
            )
            .getValues()[0];

        if (
          text_(values[idIndex]) !==
            authority.distressLeadId ||
          text_(values[sourceIndex]) !==
            CONNECTOR_ID ||
          text_(values[datasetIndex]) !==
            DATASET ||
          text_(values[recordIdIndex]) !==
            authority.sourceRecordId ||
          text_(values[recordKeyIndex]) !==
            authority.sourceObservationKey
        ) {
          throw new Error(
            'Page-86 certified physical-row prestate drift at row ' +
              authority.physicalRow +
              '.'
          );
        }

        return {
          physicalRow:
            authority.physicalRow,

          distressLeadId:
            authority.distressLeadId,

          sourceRecordId:
            authority.sourceRecordId,

          sourceObservationKey:
            authority.sourceObservationKey,

          canonicalPropertyKey:
            authority.canonicalPropertyKey,

          sourceTruthRow:
            authority.sourceTruthRow,

          values:
            values.map(safeValue_),

          fingerprintSha256:
            sha256_(
              JSON.stringify(
                values.map(safeValue_)
              )
            )
        };
      });
  }

  function exactReferenceKey_(reference) {
    return [
      text_(
        reference.distressLeadId
      ),
      text_(
        reference.sheet
      ),
      String(
        Number(
          reference.rowNumber
        )
      ),
      String(
        Number(
          reference.columnNumber
        )
      )
    ].join('|');
  }

  function readDownstreamReferences_() {
    var targetIds = {};

    allCertifiedRows_()
      .forEach(function (row) {
        targetIds[
          row.distressLeadId
        ] = true;
      });

    var matches = [];

    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheets()
      .forEach(function (sheet) {
        var sheetName =
          sheet.getName();

        if (sheetName === TABLE) {
          return;
        }

        var lastRow =
          sheet.getLastRow();

        var lastColumn =
          sheet.getLastColumn();

        if (
          lastRow < 1 ||
          lastColumn < 1
        ) {
          return;
        }

        var values =
          sheet
            .getRange(
              1,
              1,
              lastRow,
              lastColumn
            )
            .getValues();

        values.forEach(function (row, rowIndex) {
          row.forEach(function (value, columnIndex) {
            var id =
              text_(value);

            if (targetIds[id]) {
              matches.push({
                distressLeadId:
                  id,

                sheet:
                  sheetName,

                rowNumber:
                  rowIndex + 1,

                columnNumber:
                  columnIndex + 1
              });
            }
          });
        });
      });

    var expected =
      EXPECTED_REFERENCES
        .map(exactReferenceKey_)
        .sort();

    var actual =
      matches
        .map(exactReferenceKey_)
        .sort();

    if (
      JSON.stringify(actual) !==
      JSON.stringify(expected)
    ) {
      throw new Error(
        'Page-86 downstream reference authority changed.'
      );
    }

    return matches;
  }

  function deriveRepairPlan_(
    physicalRows,
    downstreamReferences
  ) {
    var referencedIds = {};

    downstreamReferences
      .forEach(function (reference) {
        referencedIds[
          reference.distressLeadId
        ] = true;
      });

    var zillowById = {};

    ZILLOW_IMPORTS
      .forEach(function (entry) {
        zillowById[
          entry.distressLeadId
        ] = entry;
      });

    var restoreZillow = [];
    var preserveCounty = [];
    var clearRows = [];

    TARGETS.forEach(function (target) {
      var rows =
        target.rows.slice();

      var countyCandidates =
        rows.filter(function (row) {
          return (
            !zillowById[
              row.distressLeadId
            ] &&
            !referencedIds[
              row.distressLeadId
            ]
          );
        });

      if (!countyCandidates.length) {
        throw new Error(
          'Page-86 object ' +
            target.sourceRecordId +
            ' has no eligible county survivor.'
        );
      }

      var survivor =
        rows.filter(function (row) {
          return (
            row.physicalRow ===
              target.sourceTruthRow &&
            !zillowById[
              row.distressLeadId
            ]
          );
        })[0];

      if (!survivor) {
        countyCandidates.sort(function (a, b) {
          return (
            a.physicalRow -
            b.physicalRow
          );
        });

        survivor =
          countyCandidates[0];
      }

      preserveCounty.push({
        sourceRecordId:
          target.sourceRecordId,

        physicalRow:
          survivor.physicalRow,

        distressLeadId:
          survivor.distressLeadId,

        sourceObservationKey:
          target.sourceObservationKey,

        canonicalPropertyKey:
          target.canonicalPropertyKey
      });

      rows.forEach(function (row) {
        if (
          row.physicalRow ===
          survivor.physicalRow
        ) {
          return;
        }

        if (
          zillowById[
            row.distressLeadId
          ]
        ) {
          restoreZillow.push({
            sourceRecordId:
              target.sourceRecordId,

            physicalRow:
              row.physicalRow,

            distressLeadId:
              row.distressLeadId
          });

          return;
        }

        if (
          referencedIds[
            row.distressLeadId
          ]
        ) {
          throw new Error(
            'Page-86 non-Zillow duplicate gained downstream reference: ' +
              row.distressLeadId +
              '.'
          );
        }

        clearRows.push({
          sourceRecordId:
            target.sourceRecordId,

          physicalRow:
            row.physicalRow,

          distressLeadId:
            row.distressLeadId
        });
      });
    });

    if (
      preserveCounty.length !== 8 ||
      restoreZillow.length !== 7 ||
      clearRows.length !== 26
    ) {
      throw new Error(
        'Page-86 derived repair-plan cardinality changed.'
      );
    }

    return {
      preserveCounty:
        preserveCounty,

      restoreZillow:
        restoreZillow,

      clearRows:
        clearRows,

      preserveCountyCount:
        preserveCounty.length,

      restoreZillowCount:
        restoreZillow.length,

      clearRowCount:
        clearRows.length
    };
  }

  function exportEvidence(options) {
    options = options || {};

    if (options.confirmReadOnly !== true) {
      throw new Error(
        'Page-86 repair evidence requires explicit confirmReadOnly=true.'
      );
    }

    requireDependencies_();

    REOS.Security.requireAdmin();

    var sourceEvidence =
      TARGETS.map(function (target) {
        return {
          sourceRecordId: target.sourceRecordId,
          sourceObservationKey: target.sourceObservationKey,
          canonicalPropertyKey: target.canonicalPropertyKey,
          sourceTruthRow: target.sourceTruthRow,
          rows: target.rows.map(function (row) {
            return Object.assign({}, row);
          }),
          freshSource: freshSource_(target)
        };
      });

    var zillowImports =
      ZILLOW_IMPORTS.map(readImport_);

    var physicalRows =
      readPhysicalPrestate_();

    var downstreamReferences =
      readDownstreamReferences_();

    var repairPlan =
      deriveRepairPlan_(
        physicalRows,
        downstreamReferences
      );

    var physicalPrestateSha256 =
      sha256_(
        JSON.stringify(
          physicalRows.map(function (row) {
            return {
              physicalRow:
                row.physicalRow,

              distressLeadId:
                row.distressLeadId,

              sourceRecordId:
                row.sourceRecordId,

              fingerprintSha256:
                row.fingerprintSha256
            };
          })
        )
      );

    var repairPlanSha256 =
      sha256_(
        JSON.stringify(
          safeValue_(
            repairPlan
          )
        )
      );

    return {
      ok: true,
      readOnly: true,
      mode: 'READ_ONLY',
      phase: 'page_86_duplicate_source_repair_evidence',

      table: TABLE,
      importTable: IMPORT_TABLE,
      connectorId: CONNECTOR_ID,
      dataset: DATASET,

      targetCount: TARGETS.length,
      targets: sourceEvidence,

      zillowImportCount: zillowImports.length,
      zillowImports: zillowImports,

      physicalRowCount: physicalRows.length,
      physicalRows: physicalRows,
      physicalPrestateSha256: physicalPrestateSha256,

      downstreamReferenceCount:
        downstreamReferences.length,

      downstreamReferences:
        downstreamReferences,

      repairPlan:
        repairPlan,

      repairPlanSha256:
        repairPlanSha256,

      sourceMatchesPersistedCanonicalRows: true,

      mutationAuthorityGranted: false,
      repairAuthorityGranted: false,
      repairPlanAuthorityGranted: false,
      insertAuthorityGranted: false,
      deleteAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      checkpointMutationAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    };
  }

  return {
    exportEvidence: exportEvidence
  };
})();

function reosCountyPage86DuplicateSourceRepairEvidence(options) {
  return REOS.CountyPage86DuplicateSourceRepairEvidence
    .exportEvidence(options);
}
