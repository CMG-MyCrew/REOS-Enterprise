/**
 * One-purpose production repair for Page 89 source observation:
 *
 *   pa-philadelphia|code_violations|622060
 *
 * Certified bad persisted authority:
 *   row:             5422
 *   distressLeadId:  DL-20260903195030-8061
 *   parcel:          518651
 *   address:         5923 Christian St
 *
 * Certified fresh source authority:
 *   parcel:          479933
 *   address:         5518 JEFFERSON ST
 *
 * Mutation authority exists only inside execute(), only when:
 * - confirmRepair=true;
 * - scheduler trigger count remains zero;
 * - controlled county checkpoint remains at committed Page 88;
 * - fresh ArcGIS diagnostic still resolves object 622060 to parcel 479933;
 * - persisted physical row 5422 is still the exact certified bad prestate;
 * - no conflicting duplicate observation exists;
 * - downstream references to the target lead are absent;
 * - ScriptLock is held;
 * - post-write canonical identity verifies exactly;
 * - checkpoint and scheduler authority remain unchanged.
 *
 * Any failed post-write verification attempts exact prestate rollback.
 */
var REOS = REOS || {};

REOS.CountyPage89SourceObservation622060Repair = (function () {
  var TABLE = 'DISTRESS_LEADS';

  var TARGET_OBJECT_ID = 622060;
  var TARGET_ROW = 5422;
  var TARGET_LEAD = 'DL-20260903195030-8061';

  var NATURAL_KEY =
    'pa-philadelphia|code_violations|622060';

  var OLD_PARCEL = '518651';
  var OLD_CANONICAL =
    'property|parcel|pa|philadelphia|518651';

  var EXPECTED_PARCEL = '479933';
  var EXPECTED_CANONICAL =
    'property|parcel|pa|philadelphia|479933';

  var EXPECTED_ADDRESS =
    '5518 JEFFERSON ST';

  var EXPECTED_CYCLE =
    'COUNTY-20260902222607805';

  var EXPECTED_CURSOR =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

  function text_(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();
  }

  function requireAdmin_() {
    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'Page-89 repair admin authority is unavailable.'
      );
    }

    REOS.Security.requireAdmin();
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getSheet !== 'function' ||
      typeof REOS.Database.getHeaders !== 'function' ||
      typeof REOS.Database.getAll !== 'function' ||
      typeof REOS.Database.rowToObject !== 'function' ||
      typeof REOS.Database.withScriptLockContext !== 'function'
    ) {
      throw new Error(
        'Page-89 repair database authority is unavailable.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity.resolve !== 'function'
    ) {
      throw new Error(
        'Page-89 repair canonical identity authority is unavailable.'
      );
    }

    if (
      !REOS.CountyCodeViolationSourceRecordDiagnostic ||
      typeof REOS.CountyCodeViolationSourceRecordDiagnostic.run !== 'function'
    ) {
      throw new Error(
        'Page-89 repair fresh-source diagnostic authority is unavailable.'
      );
    }
  }

  function managedTriggerCount_() {
    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger.getHandlerFunction() ===
          'reosCountyProductionSchedulerRun'
        );
      })
      .length;
  }

  function checkpoint_() {
    if (
      !REOS.CountyProductionScheduler ||
      typeof REOS.CountyProductionScheduler.getCheckpoint !== 'function'
    ) {
      throw new Error(
        'Page-89 repair checkpoint authority is unavailable.'
      );
    }

    return REOS.CountyProductionScheduler.getCheckpoint();
  }

  function requireCheckpointAuthority_() {
    var checkpoint = checkpoint_();

    if (
      !checkpoint ||
      text_(checkpoint.id) !== EXPECTED_CYCLE ||
      Number(checkpoint.nextFeedIndex) !== 0 ||
      text_(checkpoint.currentFeedCursor) !== EXPECTED_CURSOR ||
      Number(checkpoint.completedFeeds) !== 0
    ) {
      throw new Error(
        'Page-89 repair checkpoint authority mismatch.'
      );
    }

    return checkpoint;
  }

  function readPhysicalRow_(
    sheet,
    headers,
    rowNumber
  ) {
    var values =
      sheet
        .getRange(
          rowNumber,
          1,
          1,
          headers.length
        )
        .getValues()[0];

    return {
      rowNumber: rowNumber,
      values: values,
      record:
        REOS.Database.rowToObject(
          headers,
          values,
          rowNumber
        )
    };
  }

  function writePhysicalRow_(
    sheet,
    headers,
    rowNumber,
    values
  ) {
    if (
      !Array.isArray(values) ||
      values.length !== headers.length
    ) {
      throw new Error(
        'Page-89 repair physical write width mismatch.'
      );
    }

    sheet
      .getRange(
        rowNumber,
        1,
        1,
        headers.length
      )
      .setValues([
        values
      ]);
  }

  function stableCell_(value) {
    if (value instanceof Date) {
      return {
        type: 'date',
        value: value.toISOString()
      };
    }

    return {
      type: typeof value,
      value:
        value === undefined
          ? null
          : value
    };
  }

  function fingerprint_(values) {
    var payload =
      JSON.stringify(
        values.map(stableCell_)
      );

    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        payload,
        Utilities.Charset.UTF_8
      );

    return digest
      .map(function (byte) {
        var normalized =
          byte < 0
            ? byte + 256
            : byte;

        return (
          '0' +
          normalized.toString(16)
        ).slice(-2);
      })
      .join('');
  }

  function fetchFreshSource_() {
    var diagnostic =
      REOS.CountyCodeViolationSourceRecordDiagnostic
        .run(TARGET_OBJECT_ID);

    if (
      !diagnostic ||
      diagnostic.ok !== true ||
      diagnostic.readOnly !== true ||
      diagnostic.sourceRecordFound !== true ||
      diagnostic.normalizedRecordSkipped !== false
    ) {
      throw new Error(
        'Page-89 repair fresh source authority unavailable.'
      );
    }

    var normalized =
      diagnostic.normalizedSourceRecord;

    var identity =
      diagnostic.normalizedIdentity;

    if (
      !normalized ||
      !identity ||
      text_(normalized['Source Record ID']) !==
        String(TARGET_OBJECT_ID) ||
      text_(normalized['Parcel ID']) !==
        EXPECTED_PARCEL ||
      text_(normalized['Address']).toUpperCase() !==
        EXPECTED_ADDRESS ||
      text_(identity.sourceObservationKey) !==
        NATURAL_KEY ||
      text_(identity.canonicalPropertyKey) !==
        EXPECTED_CANONICAL
    ) {
      throw new Error(
        'Page-89 repair fresh source identity drift.'
      );
    }

    return {
      diagnostic: diagnostic,
      normalized: normalized,
      identity: identity
    };
  }

  function assertCertifiedBadPrestate_(entry) {
    var row = entry.record;

    if (
      Number(entry.rowNumber) !== TARGET_ROW ||
      text_(row['Distress Lead ID']) !== TARGET_LEAD ||
      text_(row['Source']) !== 'PA-PHILADELPHIA' ||
      text_(row['Source Dataset']) !== 'code_violations' ||
      text_(row['Source Record ID']) !==
        String(TARGET_OBJECT_ID) ||
      text_(row['Parcel ID']) !== OLD_PARCEL
    ) {
      throw new Error(
        'Page-89 repair certified bad row prestate drift.'
      );
    }

    var identity =
      REOS.CanonicalPropertyIdentity.resolve(
        row
      );

    if (
      text_(identity.sourceObservationKey) !==
        NATURAL_KEY ||
      text_(identity.canonicalPropertyKey) !==
        OLD_CANONICAL
    ) {
      throw new Error(
        'Page-89 repair certified bad identity prestate drift.'
      );
    }

    return identity;
  }

  function sourceObservationMatches_() {
    return REOS.Database
      .getAll(TABLE)
      .filter(function (row) {
        var identity;

        try {
          identity =
            REOS.CanonicalPropertyIdentity.resolve(
              row
            );
        } catch (error) {
          return false;
        }

        return (
          identity &&
          text_(identity.sourceObservationKey) ===
            NATURAL_KEY
        );
      });
  }

  function downstreamReferences_() {
    var references = [];

    var spreadsheet =
      SpreadsheetApp.getActiveSpreadsheet();

    spreadsheet
      .getSheets()
      .forEach(function (sheet) {
        if (
          sheet.getName() === TABLE
        ) {
          return;
        }

        var values =
          sheet.getDataRange().getValues();

        values.forEach(function (
          row,
          rowIndex
        ) {
          row.forEach(function (
            value,
            columnIndex
          ) {
            if (
              text_(value) === TARGET_LEAD
            ) {
              references.push({
                sheet:
                  sheet.getName(),
                rowNumber:
                  rowIndex + 1,
                columnNumber:
                  columnIndex + 1
              });
            }
          });
        });
      });

    return references;
  }

  function buildCorrectedValues_(
    headers,
    beforeRecord,
    normalized
  ) {
    var corrected = {};

    headers.forEach(function (header) {
      corrected[header] =
        beforeRecord[header];
    });

    [
      'Source',
      'Source Dataset',
      'Source Record ID',
      'Distress Type',
      'Address',
      'City',
      'State',
      'Zip',
      'County',
      'Parcel ID',
      'Violation Number',
      'Violation Type',
      'Violation Status',
      'Source Updated At',
      'Owner Name',
      'Co-Owner Name',
      'Assessment Value',
      'Estimated Value',
      'Last Sale Date',
      'Last Sale Price',
      'Living Area',
      'Year Built',
      'Land Acres'
    ].forEach(function (field) {
      if (
        Object.prototype.hasOwnProperty.call(
          normalized,
          field
        )
      ) {
        corrected[field] =
          normalized[field];
      }
    });

    /*
     * Preserve REOS identity and workflow fields that are not
     * authoritative county-source fields.
     */
    corrected['Distress Lead ID'] =
      TARGET_LEAD;

    return headers.map(function (header) {
      return corrected[header];
    });
  }

  function verifyPoststate_(
    sheet,
    headers,
    expectedValues
  ) {
    var after =
      readPhysicalRow_(
        sheet,
        headers,
        TARGET_ROW
      );

    if (
      fingerprint_(after.values) !==
        fingerprint_(expectedValues)
    ) {
      throw new Error(
        'Page-89 repair physical poststate fingerprint mismatch.'
      );
    }

    if (
      text_(after.record['Distress Lead ID']) !==
        TARGET_LEAD ||
      text_(after.record['Source Record ID']) !==
        String(TARGET_OBJECT_ID) ||
      text_(after.record['Parcel ID']) !==
        EXPECTED_PARCEL ||
      text_(after.record['Address']).toUpperCase() !==
        EXPECTED_ADDRESS
    ) {
      throw new Error(
        'Page-89 repair corrected row authority mismatch.'
      );
    }

    var identity =
      REOS.CanonicalPropertyIdentity.resolve(
        after.record
      );

    if (
      text_(identity.sourceObservationKey) !==
        NATURAL_KEY ||
      text_(identity.canonicalPropertyKey) !==
        EXPECTED_CANONICAL
    ) {
      throw new Error(
        'Page-89 repair post-write identity reconciliation failed.'
      );
    }

    var matches =
      sourceObservationMatches_();

    if (
      matches.length !== 1 ||
      Number(matches[0]._rowNumber) !==
        TARGET_ROW ||
      text_(
        matches[0]['Distress Lead ID']
      ) !== TARGET_LEAD
    ) {
      throw new Error(
        'Page-89 repair post-write source observation cardinality mismatch.'
      );
    }

    return {
      row: after,
      identity: identity,
      matchCount: matches.length
    };
  }

  function execute(options) {
    options = options || {};

    requireAdmin_();
    requireDependencies_();

    if (
      options.confirmRepair !== true
    ) {
      throw new Error(
        'Page-89 repair requires confirmRepair=true.'
      );
    }

    if (
      text_(options.sourceObservationKey) !==
        NATURAL_KEY
    ) {
      throw new Error(
        'Page-89 repair source observation authority mismatch.'
      );
    }

    if (
      managedTriggerCount_() !== 0
    ) {
      throw new Error(
        'Page-89 repair requires zero managed scheduler triggers.'
      );
    }

    requireCheckpointAuthority_();

    var fresh =
      fetchFreshSource_();

    if (
      managedTriggerCount_() !== 0
    ) {
      throw new Error(
        'Page-89 repair scheduler authority changed after source fetch.'
      );
    }

    requireCheckpointAuthority_();

    return REOS.Database
      .withScriptLockContext(
        function () {
          if (
            managedTriggerCount_() !== 0
          ) {
            throw new Error(
              'Page-89 repair scheduler authority changed under lock.'
            );
          }

          requireCheckpointAuthority_();

          var sheet =
            REOS.Database.getSheet(TABLE);

          var headers =
            REOS.Database.getHeaders(TABLE);

          var before =
            readPhysicalRow_(
              sheet,
              headers,
              TARGET_ROW
            );

          var beforeFingerprint =
            fingerprint_(
              before.values
            );

          var beforeIdentity =
            assertCertifiedBadPrestate_(
              before
            );

          var matchesBefore =
            sourceObservationMatches_();

          if (
            matchesBefore.length !== 1 ||
            Number(
              matchesBefore[0]._rowNumber
            ) !== TARGET_ROW ||
            text_(
              matchesBefore[0]['Distress Lead ID']
            ) !== TARGET_LEAD
          ) {
            throw new Error(
              'Page-89 repair expected exactly one certified persisted source observation.'
            );
          }

          var references =
            downstreamReferences_();

          if (
            references.length !== 0
          ) {
            throw new Error(
              'Page-89 repair downstream reference authority changed.'
            );
          }

          var correctedValues =
            buildCorrectedValues_(
              headers,
              before.record,
              fresh.normalized
            );

          var mutationApplied =
            false;

          try {
            writePhysicalRow_(
              sheet,
              headers,
              TARGET_ROW,
              correctedValues
            );

            mutationApplied = true;

            SpreadsheetApp.flush();

            var verified =
              verifyPoststate_(
                sheet,
                headers,
                correctedValues
              );

            requireCheckpointAuthority_();

            if (
              managedTriggerCount_() !== 0
            ) {
              throw new Error(
                'Page-89 repair scheduler authority changed during repair.'
              );
            }

            return {
              ok: true,
              repaired: true,
              mode:
                'PAGE89_SOURCE_OBSERVATION_622060_REPAIR',

              sourceObservationKey:
                NATURAL_KEY,

              rowNumber:
                TARGET_ROW,

              distressLeadId:
                TARGET_LEAD,

              before: {
                fingerprint:
                  beforeFingerprint,
                identity:
                  beforeIdentity,
                parcelId:
                  OLD_PARCEL,
                address:
                  text_(
                    before.record['Address']
                  )
              },

              after: {
                fingerprint:
                  fingerprint_(
                    verified.row.values
                  ),
                identity:
                  verified.identity,
                parcelId:
                  EXPECTED_PARCEL,
                address:
                  text_(
                    verified.row.record[
                      'Address'
                    ]
                  ),
                sourceObservationMatchCount:
                  verified.matchCount
              },

              freshSourceIdentity:
                fresh.identity,

              schedulerTriggerCount:
                0,

              checkpointMutationAuthorityGranted:
                false,

              schedulerAuthorityGranted:
                false,

              automaticOfferAuthorityGranted:
                false,

              repairAuthorityGranted:
                false
            };
          } catch (postWriteError) {
            if (
              !mutationApplied
            ) {
              throw postWriteError;
            }

            try {
              writePhysicalRow_(
                sheet,
                headers,
                TARGET_ROW,
                before.values
              );

              SpreadsheetApp.flush();

              var restored =
                readPhysicalRow_(
                  sheet,
                  headers,
                  TARGET_ROW
                );

              if (
                fingerprint_(
                  restored.values
                ) !== beforeFingerprint
              ) {
                throw new Error(
                  'certified prestate fingerprint mismatch after rollback'
                );
              }

              var restoredIdentity =
                REOS.CanonicalPropertyIdentity
                  .resolve(
                    restored.record
                  );

              if (
                text_(
                  restoredIdentity
                    .sourceObservationKey
                ) !== NATURAL_KEY ||
                text_(
                  restoredIdentity
                    .canonicalPropertyKey
                ) !== OLD_CANONICAL
              ) {
                throw new Error(
                  'certified prestate identity mismatch after rollback'
                );
              }

              requireCheckpointAuthority_();

              if (
                managedTriggerCount_() !== 0
              ) {
                throw new Error(
                  'scheduler authority changed during rollback'
                );
              }
            } catch (rollbackError) {
              throw new Error(
                'Page-89 repair entered ambiguous state after post-write failure; ' +
                'automatic retry prohibited. original=' +
                (
                  postWriteError &&
                  postWriteError.message
                    ? postWriteError.message
                    : String(postWriteError)
                ) +
                '; rollback=' +
                (
                  rollbackError &&
                  rollbackError.message
                    ? rollbackError.message
                    : String(rollbackError)
                )
              );
            }

            throw new Error(
              'Page-89 repair post-write verification failed; ' +
              'certified prestate restored. ' +
              (
                postWriteError &&
                postWriteError.message
                  ? postWriteError.message
                  : String(postWriteError)
              )
            );
          }
        }
      );
  }

  return {
    execute: execute
  };
})();

function reosCountyPage89SourceObservation622060Repair(
  options
) {
  return REOS
    .CountyPage89SourceObservation622060Repair
    .execute(options);
}
