/**
 * REOS Enterprise - County Page-86 Duplicate Source Repair
 *
 * One-time fail-closed repair for the eight certified Page-86
 * duplicate county source observations.
 *
 * Repair effects:
 * - preserve exactly one county observation for each source record;
 * - restore the seven historically overwritten Zillow physical rows
 *   from exact ZILLOW_GMAIL_IMPORTS provenance;
 * - clear the remaining zero-reference duplicate physical rows in place;
 * - never insert/delete/re-key physical rows;
 * - never mutate the county scheduler/checkpoint;
 * - never grant MAO or automatic offer authority.
 *
 * Mutation authority exists only inside execute(), only after:
 * - fresh read-only evidence regeneration;
 * - exact prestate verification;
 * - exact downstream-reference verification;
 * - ScriptLock acquisition;
 * - second evidence regeneration under lock.
 */
var REOS = REOS || {};

REOS.CountyPage86DuplicateSourceRepair = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var EXPECTED_CHECKPOINT_ID =
    'COUNTY-20260902222607805';

  var EXPECTED_CHECKPOINT_CURSOR =
    'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782086400000|214';

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
      return value.map(safeValue_);
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

  function arraysEqual_(left, right) {
    return (
      JSON.stringify(
        safeValue_(left)
      ) ===
      JSON.stringify(
        safeValue_(right)
      )
    );
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getHeaders !== 'function' ||
      typeof REOS.Database.getSheet !== 'function' ||
      typeof REOS.Database.withScriptLockContext !== 'function'
    ) {
      throw new Error(
        'Page-86 repair requires certified Database and ScriptLock authority.'
      );
    }

    if (
      !REOS.CountyPage86DuplicateSourceRepairEvidence ||
      typeof REOS.CountyPage86DuplicateSourceRepairEvidence.exportEvidence !==
        'function'
    ) {
      throw new Error(
        'Page-86 repair evidence dependency unavailable.'
      );
    }

    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !== 'function'
    ) {
      throw new Error(
        'Page-86 repair requires Admin authority.'
      );
    }
  }

  function requireInvocation_(options) {
    options = options || {};

    if (
      options.confirmRepair !== true ||
      text_(options.checkpointId) !==
        EXPECTED_CHECKPOINT_ID ||
      text_(options.checkpointCursor) !==
        EXPECTED_CHECKPOINT_CURSOR
    ) {
      throw new Error(
        'Page-86 repair invocation authority rejected.'
      );
    }
  }

  function assertQuiescence_() {
    if (
      typeof reosCountyProductionSchedulerStatus !==
        'function' ||
      typeof reosCountyProductionSchedulerCheckpoint !==
        'function'
    ) {
      throw new Error(
        'Page-86 repair requires scheduler/checkpoint diagnostics.'
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
      ) !== 0
    ) {
      throw new Error(
        'Page-86 repair requires zero managed county scheduler triggers.'
      );
    }

    if (
      !checkpoint ||
      text_(checkpoint.id) !==
        EXPECTED_CHECKPOINT_ID ||
      Number(
        checkpoint.nextFeedIndex
      ) !== 0 ||
      text_(
        checkpoint.currentFeedCursor
      ) !==
        EXPECTED_CHECKPOINT_CURSOR ||
      Number(
        checkpoint.completedFeeds
      ) !== 0 ||
      !Array.isArray(
        checkpoint.results
      ) ||
      checkpoint.results.length !== 0
    ) {
      throw new Error(
        'Page-86 repair checkpoint authority changed.'
      );
    }

    return {
      triggerCount:
        Number(
          status.scheduler.triggerCount
        ),

      checkpointId:
        text_(checkpoint.id),

      checkpointCursor:
        text_(
          checkpoint.currentFeedCursor
        )
    };
  }

  function evidence_() {
    var result =
      REOS.CountyPage86DuplicateSourceRepairEvidence
        .exportEvidence({
          confirmReadOnly: true
        });

    if (
      !result ||
      result.ok !== true ||
      result.readOnly !== true ||
      result.mode !== 'READ_ONLY' ||
      Number(
        result.targetCount
      ) !== 8 ||
      Number(
        result.physicalRowCount
      ) !== 41 ||
      Number(
        result.zillowImportCount
      ) !== 7 ||
      Number(
        result.downstreamReferenceCount
      ) !== 7 ||
      !result.repairPlan ||
      Number(
        result.repairPlan.preserveCountyCount
      ) !== 8 ||
      Number(
        result.repairPlan.restoreZillowCount
      ) !== 7 ||
      Number(
        result.repairPlan.clearRowCount
      ) !== 26
    ) {
      throw new Error(
        'Page-86 repair evidence authority invalid.'
      );
    }

    [
      'mutationAuthorityGranted',
      'repairAuthorityGranted',
      'repairPlanAuthorityGranted',
      'insertAuthorityGranted',
      'deleteAuthorityGranted',
      'schedulerAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(function (field) {
      if (
        result[field] !== false
      ) {
        throw new Error(
          'Page-86 read-only evidence unexpectedly grants authority: ' +
            field +
            '.'
        );
      }
    });

    return result;
  }

  function evidenceAuthoritySha256_(
    evidence
  ) {
    return sha256_(
      JSON.stringify({
        physicalPrestateSha256:
          evidence.physicalPrestateSha256,

        repairPlanSha256:
          evidence.repairPlanSha256,

        downstreamReferences:
          safeValue_(
            evidence.downstreamReferences
          ),

        zillowImports:
          evidence.zillowImports
            .map(function (entry) {
              return {
                physicalRow:
                  entry.physicalRow,

                distressLeadId:
                  entry.distressLeadId,

                importRow:
                  entry.importRow,

                importId:
                  entry.importId,

                gmailMessageId:
                  entry.gmailMessageId
              };
            })
      })
    );
  }

  function verifyEvidenceStable_(
    before,
    underLock
  ) {
    if (
      evidenceAuthoritySha256_(
        before
      ) !==
      evidenceAuthoritySha256_(
        underLock
      )
    ) {
      throw new Error(
        'Page-86 repair evidence changed before mutation authority.'
      );
    }
  }

  function physicalByRow_(evidence) {
    var map = {};

    evidence.physicalRows
      .forEach(function (entry) {
        var row =
          Number(
            entry.physicalRow
          );

        if (
          !row ||
          map[row]
        ) {
          throw new Error(
            'Page-86 evidence contains duplicate/invalid physical-row authority.'
          );
        }

        map[row] =
          entry;
      });

    return map;
  }

  function targetBySourceId_(
    evidence
  ) {
    var map = {};

    evidence.targets
      .forEach(function (target) {
        var id =
          text_(
            target.sourceRecordId
          );

        if (
          !id ||
          map[id]
        ) {
          throw new Error(
            'Page-86 target authority duplicated.'
          );
        }

        map[id] =
          target;
      });

    return map;
  }

  function zillowByLead_(
    evidence
  ) {
    var map = {};

    evidence.zillowImports
      .forEach(function (entry) {
        var id =
          text_(
            entry.distressLeadId
          );

        if (
          !id ||
          map[id]
        ) {
          throw new Error(
            'Page-86 Zillow evidence duplicated.'
          );
        }

        map[id] =
          entry;
      });

    return map;
  }

  function normalizedCountyRecord_(
    target
  ) {
    var diagnostic =
      target.freshSource;

    var normalized =
      diagnostic &&
      diagnostic.normalizedSourceRecord;

    if (
      !normalized ||
      typeof normalized !==
        'object'
    ) {
      throw new Error(
        'Page-86 normalized fresh source record unavailable for object ' +
          target.sourceRecordId +
          '.'
      );
    }

    return normalized;
  }

  function countyTargetRecord_(
    current,
    target,
    repairRunId,
    now
  ) {
    var source =
      Object.assign(
        {},
        normalizedCountyRecord_(
          target
        )
      );

    var result =
      Object.assign(
        {},
        current,
        source
      );

    result.Source =
      'PA-PHILADELPHIA';

    result[
      'Source Dataset'
    ] =
      'code_violations';

    result[
      'Source Record ID'
    ] =
      target.sourceRecordId;

    result[
      'Source Record Key'
    ] =
      target.sourceObservationKey;

    result[
      'Source Observation Key'
    ] =
      target.sourceObservationKey;

    result[
      'Canonical Property Key'
    ] =
      target.canonicalPropertyKey;

    result[
      'Connector Run ID'
    ] =
      repairRunId;

    result[
      'Last Seen At'
    ] =
      now;

    result[
      'Updated At'
    ] =
      now;

    /*
     * Physical-row identity remains immutable.
     */
    result[
      'Distress Lead ID'
    ] =
      current[
        'Distress Lead ID'
      ];

    result[
      'Created At'
    ] =
      current[
        'Created At'
      ];

    return result;
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
        'Page-86 Zillow restoration requires Gmail Message ID.'
      );
    }

    var sourceObservationKey =
      (
        'zillow gmail|gmail_leads|' +
        sourceRecordId.toLowerCase()
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

  function zillowTargetRecord_(
    current,
    evidenceEntry,
    now
  ) {
    var target =
      Object.assign(
        {},
        current
      );

    ZILLOW_CLEAR_FIELDS
      .forEach(function (field) {
        target[field] =
          '';
      });

    target =
      Object.assign(
        target,
        zillowProjection_(
          evidenceEntry.record
        )
      );

    target[
      'Updated At'
    ] =
      now;

    /*
     * Physical identity and creation authority survive restoration.
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

  function blankRecord_(
    headers
  ) {
    var result = {};

    headers.forEach(function (header) {
      result[header] =
        '';
    });

    return result;
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
    return headers.map(function (header) {
      return (
        record[header] ===
          undefined ||
        record[header] ===
          null
      )
        ? ''
        : record[header];
    });
  }

  function mutableBounds_(
    evidence
  ) {
    var rows =
      evidence.physicalRows
        .map(function (entry) {
          return Number(
            entry.physicalRow
          );
        });

    var start =
      Math.min.apply(
        Math,
        rows
      );

    var end =
      Math.max.apply(
        Math,
        rows
      );

    if (
      start !== 837 ||
      end !== 918
    ) {
      throw new Error(
        'Page-86 repair physical corridor authority changed.'
      );
    }

    return {
      startRow: start,
      endRow: end,
      rowCount:
        end -
        start +
        1
    };
  }

  function verifyPrestate_(
    sheet,
    headers,
    evidence,
    bounds
  ) {
    var values =
      sheet
        .getRange(
          bounds.startRow,
          1,
          bounds.rowCount,
          headers.length
        )
        .getValues();

    var physicalMap =
      physicalByRow_(
        evidence
      );

    Object.keys(
      physicalMap
    ).forEach(function (key) {
      var physicalRow =
        Number(key);

      var entry =
        physicalMap[
          physicalRow
        ];

      var actual =
        values[
          physicalRow -
          bounds.startRow
        ];

      var actualHash =
        sha256_(
          JSON.stringify(
            actual.map(
              safeValue_
            )
          )
        );

      if (
        actualHash !==
        entry.fingerprintSha256
      ) {
        throw new Error(
          'Page-86 lock-bound physical prestate changed at row ' +
            physicalRow +
            '.'
        );
      }
    });

    return values;
  }

  function buildTargetValues_(
    headers,
    beforeValues,
    evidence,
    bounds,
    repairRunId,
    now
  ) {
    var targetValues =
      beforeValues.map(function (row) {
        return row.slice();
      });

    var targetMap =
      targetBySourceId_(
        evidence
      );

    var zillowMap =
      zillowByLead_(
        evidence
      );

    evidence.repairPlan
      .preserveCounty
      .forEach(function (authority) {
        var index =
          Number(
            authority.physicalRow
          ) -
          bounds.startRow;

        var current =
          recordFromValues_(
            headers,
            beforeValues[index]
          );

        var target =
          targetMap[
            text_(
              authority.sourceRecordId
            )
          ];

        if (!target) {
          throw new Error(
            'Page-86 county survivor target authority missing.'
          );
        }

        targetValues[index] =
          valuesFromRecord_(
            headers,
            countyTargetRecord_(
              current,
              target,
              repairRunId,
              now
            )
          );
      });

    evidence.repairPlan
      .restoreZillow
      .forEach(function (authority) {
        var index =
          Number(
            authority.physicalRow
          ) -
          bounds.startRow;

        var current =
          recordFromValues_(
            headers,
            beforeValues[index]
          );

        var zillow =
          zillowMap[
            text_(
              authority.distressLeadId
            )
          ];

        if (!zillow) {
          throw new Error(
            'Page-86 Zillow restoration evidence missing.'
          );
        }

        targetValues[index] =
          valuesFromRecord_(
            headers,
            zillowTargetRecord_(
              current,
              zillow,
              now
            )
          );
      });

    evidence.repairPlan
      .clearRows
      .forEach(function (authority) {
        var index =
          Number(
            authority.physicalRow
          ) -
          bounds.startRow;

        targetValues[index] =
          valuesFromRecord_(
            headers,
            blankRecord_(
              headers
            )
          );
      });

    return targetValues;
  }

  function writeBlock_(
    sheet,
    headers,
    bounds,
    values
  ) {
    if (
      !Array.isArray(values) ||
      values.length !==
        bounds.rowCount
    ) {
      throw new Error(
        'Page-86 repair write cardinality invalid.'
      );
    }

    /*
     * The executor intentionally contains exactly one physical setValues
     * primitive. Both forward mutation and rollback use this same bounded
     * primitive.
     */
    sheet
      .getRange(
        bounds.startRow,
        1,
        bounds.rowCount,
        headers.length
      )
      .setValues(values);
  }

  function verifyPoststate_(
    sheet,
    headers,
    evidence,
    bounds,
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
        'Page-86 repair changed DISTRESS_LEADS row count.'
      );
    }

    var values =
      sheet
        .getRange(
          bounds.startRow,
          1,
          bounds.rowCount,
          headers.length
        )
        .getValues();

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

    var canonicalIndex =
      headers.indexOf(
        'Canonical Property Key'
      );

    var runIndex =
      headers.indexOf(
        'Connector Run ID'
      );

    var createdIndex =
      headers.indexOf(
        'Created At'
      );

    [
      idIndex,
      sourceIndex,
      datasetIndex,
      sourceIdIndex,
      sourceKeyIndex,
      observationIndex,
      canonicalIndex,
      runIndex,
      createdIndex
    ].forEach(function (index) {
      if (index < 0) {
        throw new Error(
          'Page-86 poststate schema authority changed.'
        );
      }
    });

    var physicalMap =
      physicalByRow_(
        evidence
      );

    evidence.repairPlan
      .preserveCounty
      .forEach(function (authority) {
        var row =
          values[
            Number(
              authority.physicalRow
            ) -
            bounds.startRow
          ];

        var before =
          physicalMap[
            Number(
              authority.physicalRow
            )
          ];

        if (
          text_(row[idIndex]) !==
            authority.distressLeadId ||
          text_(row[sourceIndex]) !==
            'PA-PHILADELPHIA' ||
          text_(row[datasetIndex]) !==
            'code_violations' ||
          text_(row[sourceIdIndex]) !==
            text_(
              authority.sourceRecordId
            ) ||
          text_(row[sourceKeyIndex]) !==
            authority.sourceObservationKey ||
          text_(row[observationIndex]) !==
            authority.sourceObservationKey ||
          text_(row[canonicalIndex]) !==
            authority.canonicalPropertyKey ||
          text_(row[runIndex]) !==
            repairRunId ||
          safeValue_(
            row[createdIndex]
          ) !==
            safeValue_(
              before.values[
                createdIndex
              ]
            )
        ) {
          throw new Error(
            'Page-86 county survivor reconciliation failed at row ' +
              authority.physicalRow +
              '.'
          );
        }
      });

    evidence.repairPlan
      .restoreZillow
      .forEach(function (authority) {
        var row =
          values[
            Number(
              authority.physicalRow
            ) -
            bounds.startRow
          ];

        var before =
          physicalMap[
            Number(
              authority.physicalRow
            )
          ];

        if (
          text_(row[idIndex]) !==
            authority.distressLeadId ||
          text_(row[sourceIndex]) !==
            'Zillow Gmail' ||
          text_(row[datasetIndex]) !==
            'gmail_leads' ||
          !text_(
            row[sourceIdIndex]
          ) ||
          text_(row[sourceKeyIndex]) !==
            text_(
              row[observationIndex]
            ) ||
          safeValue_(
            row[createdIndex]
          ) !==
            safeValue_(
              before.values[
                createdIndex
              ]
            )
        ) {
          throw new Error(
            'Page-86 Zillow restoration reconciliation failed at row ' +
              authority.physicalRow +
              '.'
          );
        }
      });

    evidence.repairPlan
      .clearRows
      .forEach(function (authority) {
        var row =
          values[
            Number(
              authority.physicalRow
            ) -
            bounds.startRow
          ];

        if (
          row.some(function (value) {
            return text_(value) !== '';
          })
        ) {
          throw new Error(
            'Page-86 duplicate clear reconciliation failed at row ' +
              authority.physicalRow +
              '.'
          );
        }
      });

    /*
     * Re-prove there is exactly one county row for every repaired
     * source-observation identity.
     */
    evidence.repairPlan
      .preserveCounty
      .forEach(function (authority) {
        var count = 0;

        values.forEach(function (row) {
          if (
            text_(row[sourceIndex]) ===
              'PA-PHILADELPHIA' &&
            text_(row[datasetIndex]) ===
              'code_violations' &&
            text_(row[observationIndex]) ===
              authority.sourceObservationKey
          ) {
            count += 1;
          }
        });

        if (count !== 1) {
          throw new Error(
            'Page-86 source-observation uniqueness reconciliation failed for ' +
              authority.sourceObservationKey +
              '.'
          );
        }
      });

    return {
      repairedSourceObservationCount: 8,
      countySurvivorCount: 8,
      zillowRowsRestored: 7,
      duplicateRowsCleared: 26,
      corridorFingerprintSha256:
        sha256_(
          JSON.stringify(
            values.map(function (row) {
              return row.map(
                safeValue_
              );
            })
          )
        )
    };
  }

  function resultAuthority_(details) {
    details =
      details || {};

    return Object.assign(
      {},
      details,
      {
        mutationAuthorityGranted:
          false,

        repairAuthorityGranted:
          false,

        repairPlanAuthorityGranted:
          false,

        insertAuthorityGranted:
          false,

        deleteAuthorityGranted:
          false,

        schedulerAuthorityGranted:
          false,

        checkpointMutationAuthorityGranted:
          false,

        automaticOfferAuthorityGranted:
          false
      }
    );
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
     * Read-only evidence immediately before ScriptLock acquisition.
     */
    var preEvidence =
      evidence_();

    var repairRunId =
      'P86R-' +
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

              /*
               * Regenerate the complete evidence boundary while lock is
               * held. Any source, physical-row, import-ledger, or
               * downstream-reference drift revokes mutation authority.
               */
              var lockedEvidence =
                evidence_();

              verifyEvidenceStable_(
                preEvidence,
                lockedEvidence
              );

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
                  expectedHeaders.length ||
                !arraysEqual_(
                  headers,
                  expectedHeaders
                )
              ) {
                throw new Error(
                  'Page-86 repair DISTRESS_LEADS schema authority changed.'
                );
              }

              var sheet =
                REOS.Database
                  .getSheet(
                    TABLE
                  );

              var beforeLastRow =
                Number(
                  sheet.getLastRow()
                );

              var bounds =
                mutableBounds_(
                  lockedEvidence
                );

              /*
               * Lock-bound exact prestate verification.
               */
              var beforeValues =
                verifyPrestate_(
                  sheet,
                  headers,
                  lockedEvidence,
                  bounds
                );

              var now =
                new Date();

              var targetValues =
                buildTargetValues_(
                  headers,
                  beforeValues,
                  lockedEvidence,
                  bounds,
                  repairRunId,
                  now
                );

              var rollbackValues =
                beforeValues
                  .map(function (row) {
                    return row.slice();
                  });

              var writeAttempted =
                false;

              try {
                writeAttempted =
                  true;

                writeBlock_(
                  sheet,
                  headers,
                  bounds,
                  targetValues
                );

                SpreadsheetApp.flush();

                var reconciliation =
                  verifyPoststate_(
                    sheet,
                    headers,
                    lockedEvidence,
                    bounds,
                    repairRunId,
                    beforeLastRow
                  );

                var postQuiescence =
                  assertQuiescence_();

                mutationVerified =
                  true;

                return resultAuthority_({
                  ok: true,

                  mode:
                    'CERTIFIED_PAGE_86_DUPLICATE_SOURCE_REPAIR_EXECUTED',

                  repairRunId:
                    repairRunId,

                  repairedAt:
                    now.toISOString(),

                  physicalPrestateSha256:
                    lockedEvidence
                      .physicalPrestateSha256,

                  repairPlanSha256:
                    lockedEvidence
                      .repairPlanSha256,

                  repairedSourceObservationCount:
                    reconciliation
                      .repairedSourceObservationCount,

                  countySurvivorCount:
                    reconciliation
                      .countySurvivorCount,

                  zillowRowsRestored:
                    reconciliation
                      .zillowRowsRestored,

                  duplicateRowsCleared:
                    reconciliation
                      .duplicateRowsCleared,

                  corridorFingerprintSha256:
                    reconciliation
                      .corridorFingerprintSha256,

                  triggerCountBefore:
                    preQuiescence
                      .triggerCount,

                  triggerCountUnderLock:
                    inLockQuiescence
                      .triggerCount,

                  triggerCountAfter:
                    postQuiescence
                      .triggerCount,

                  productionDataMutationExecuted:
                    true,

                  repairExecuted:
                    true,

                  repairAuthorityConsumed:
                    true
                });
              } catch (repairError) {
                if (writeAttempted) {
                  try {
                    /*
                     * Exact fail-safe rollback through the same sole
                     * bounded physical mutation primitive.
                     */
                    writeBlock_(
                      sheet,
                      headers,
                      bounds,
                      rollbackValues
                    );

                    SpreadsheetApp.flush();

                    verifyPrestate_(
                      sheet,
                      headers,
                      lockedEvidence,
                      bounds
                    );

                    assertQuiescence_();
                  } catch (rollbackError) {
                    throw new Error(
                      'PAGE_86_REPAIR_RESULT_AMBIGUOUS_READ_ONLY_RECONCILIATION_REQUIRED_NO_RETRY: repair=' +
                        (
                          repairError.message ||
                          String(
                            repairError
                          )
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
                  'Page-86 repair failed and certified prestate was restored: ' +
                    (
                      repairError.message ||
                      String(
                        repairError
                      )
                    )
                );
              }
            }
          );

      if (
        !mutationVerified ||
        !result ||
        result.ok !== true
      ) {
        throw new Error(
          'Page-86 repair returned without verified mutation result.'
        );
      }

      return result;
    } finally {
      /*
       * No persistent authority survives execute().
       */
    }
  }

  function status() {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    var quiescence =
      assertQuiescence_();

    return resultAuthority_({
      ok: true,

      readOnly: true,

      mode:
        'PAGE_86_DUPLICATE_SOURCE_REPAIR_STATUS',

      triggerCount:
        quiescence
          .triggerCount,

      checkpointId:
        quiescence
          .checkpointId,

      checkpointCursor:
        quiescence
          .checkpointCursor,

      productionDataMutationExecuted:
        false,

      repairExecuted:
        false
    });
  }

  return {
    execute: execute,
    status: status
  };
})();

function reosCountyPage86DuplicateSourceRepair(options) {
  return REOS.CountyPage86DuplicateSourceRepair
    .execute(options);
}

function reosCountyPage86DuplicateSourceRepairStatus() {
  return REOS.CountyPage86DuplicateSourceRepair
    .status();
}
