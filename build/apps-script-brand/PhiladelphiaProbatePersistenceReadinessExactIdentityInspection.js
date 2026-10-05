/**
 * REOS Enterprise
 * Philadelphia Probate PB1 Persistence Readiness Exact Identity Inspection
 *
 * Fixed-target, admin-only, read-only diagnostic.
 *
 * This runtime reads the authoritative DISTRESS_LEADS table exactly once
 * through Database.getAll after an exact schema check and classifies the
 * certified PB1 source-observation persistence prestate.
 *
 * No persistence, repair, migration, connector execution, external HTTP,
 * scheduler, trigger, owner lookup, MAO, or offer authority is granted.
 */
var REOS = REOS || {};

REOS.PhiladelphiaProbatePersistenceReadinessExactIdentityInspection =
  (function () {
    var TABLE =
      'DISTRESS_LEADS';

    var TARGET_SOURCE =
      'PA-PHILADELPHIA';

    var TARGET_DATASET =
      'probate';

    var TARGET_SOURCE_RECORD_ID =
      'TLI-PROBATE-2026-09-30-OC-1170-DE-2026-372346800';

    var TARGET_SOURCE_OBSERVATION_KEY =
      'pa-philadelphia|probate|tli-probate-2026-09-30-oc-1170-de-2026-372346800';

    var TARGET_CANONICAL_PROPERTY_KEY =
      'property|parcel|pa|philadelphia|372346800';

    var TARGET_PARCEL_ID =
      '372346800';

    var EXPECTED_HEADER_COUNT =
      52;

    var MAX_EXACT_IDENTITY_ROWS =
      5;

    var MAX_CANONICAL_PROPERTY_ROWS =
      10;

    function value_(value) {
      return String(
        value === undefined ||
        value === null
          ? ''
          : value
      );
    }

    function requireDependencies_() {
      if (
        !REOS.Security ||
        typeof REOS.Security
          .requireAdmin !==
          'function'
      ) {
        throw new Error(
          'PB1 exact identity inspection requires admin security authority.'
        );
      }

      if (
        !REOS.Database ||
        typeof REOS.Database
          .getHeaders !==
          'function' ||
        typeof REOS.Database
          .getAll !==
          'function'
      ) {
        throw new Error(
          'PB1 exact identity inspection requires read-only Database APIs.'
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
          'PB1 exact identity inspection requires DISTRESS_LEADS schema authority.'
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
          'PB1 exact identity inspection requires canonical identity resolver.'
        );
      }
    }

    function arraysEqual_(
      left,
      right
    ) {
      if (
        !Array.isArray(left) ||
        !Array.isArray(right) ||
        left.length !== right.length
      ) {
        return false;
      }

      for (
        var index = 0;
        index < left.length;
        index++
      ) {
        if (
          left[index] !==
          right[index]
        ) {
          return false;
        }
      }

      return true;
    }

    function physicalRowNumber_(
      row
    ) {
      var number =
        Number(
          row &&
          row._rowNumber
        );

      if (
        !isFinite(number) ||
        Math.floor(number) !==
          number ||
        number < 2
      ) {
        throw new Error(
          'PB1 exact identity inspection encountered invalid physical row authority.'
        );
      }

      return number;
    }

    function exactStored_(
      row,
      field,
      expected
    ) {
      return (
        value_(
          row &&
          row[field]
        ) ===
        expected
      );
    }

    function sourceExact_(
      row
    ) {
      return (
        value_(row && row.Source) ===
          TARGET_SOURCE
      );
    }

    function datasetExact_(
      row
    ) {
      return (
        value_(
          row &&
          row['Source Dataset']
        ) ===
          TARGET_DATASET
      );
    }

    function canonicalContextMatch_(
      row
    ) {
      if (
        !sourceExact_(row) ||
        !datasetExact_(row)
      ) {
        return false;
      }

      return (
        exactStored_(
          row,
          'Canonical Property Key',
          TARGET_CANONICAL_PROPERTY_KEY
        ) ||
        exactStored_(
          row,
          'Parcel ID',
          TARGET_PARCEL_ID
        )
      );
    }

    function buildUnion_(
      groups
    ) {
      var byPhysicalRow = {};

      groups.forEach(function (
        group
      ) {
        group.forEach(function (
          row
        ) {
          var rowNumber =
            physicalRowNumber_(
              row
            );

          if (
            !Object.prototype
              .hasOwnProperty
              .call(
                byPhysicalRow,
                String(rowNumber)
              )
          ) {
            byPhysicalRow[
              String(rowNumber)
            ] = row;
          }
        });
      });

      return Object.keys(
        byPhysicalRow
      )
        .map(function (
          key
        ) {
          return byPhysicalRow[key];
        })
        .sort(function (
          left,
          right
        ) {
          return (
            physicalRowNumber_(left) -
            physicalRowNumber_(right)
          );
        });
    }

    function makeReconstructor_() {
      var cache = {};

      return function (
        row
      ) {
        var rowNumber =
          physicalRowNumber_(
            row
          );

        var key =
          String(rowNumber);

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              cache,
              key
            )
        ) {
          return cache[key];
        }

        var result = {
          sourceObservationKey:
            '',

          canonicalPropertyKey:
            '',

          identityError:
            ''
        };

        try {
          var identity =
            REOS
              .CanonicalPropertyIdentity
              .resolve(
                row
              );

          result.sourceObservationKey =
            value_(
              identity &&
              identity
                .sourceObservationKey
            );

          result.canonicalPropertyKey =
            value_(
              identity &&
              identity
                .canonicalPropertyKey
            );
        } catch (error) {
          result.identityError =
            error &&
            error.message
              ? String(
                  error.message
                )
              : String(error);
        }

        cache[key] =
          result;

        return result;
      };
    }

    function rowSummary_(
      row,
      reconstruct
    ) {
      var reconstructed =
        reconstruct(
          row
        );

      return {
        rowNumber:
          physicalRowNumber_(
            row
          ),

        distressLeadId:
          value_(
            row[
              'Distress Lead ID'
            ]
          ),

        source:
          value_(
            row.Source
          ),

        sourceDataset:
          value_(
            row[
              'Source Dataset'
            ]
          ),

        sourceRecordId:
          value_(
            row[
              'Source Record ID'
            ]
          ),

        parcelId:
          value_(
            row[
              'Parcel ID'
            ]
          ),

        sourceRecordKey:
          value_(
            row[
              'Source Record Key'
            ]
          ),

        sourceObservationKey:
          value_(
            row[
              'Source Observation Key'
            ]
          ),

        canonicalPropertyKey:
          value_(
            row[
              'Canonical Property Key'
            ]
          ),

        reconstructedSourceObservationKey:
          reconstructed
            .sourceObservationKey,

        reconstructedCanonicalPropertyKey:
          reconstructed
            .canonicalPropertyKey,

        identityError:
          reconstructed
            .identityError
      };
    }

    function nonblankDifferent_(
      row,
      field,
      expected
    ) {
      var actual =
        value_(
          row &&
          row[field]
        );

      return (
        actual !== '' &&
        actual !== expected
      );
    }

    function exactRowIncomplete_(
      row,
      reconstruction
    ) {
      var requiredFields = [
        'Distress Lead ID',
        'Source',
        'Source Dataset',
        'Source Record ID',
        'Source Record Key',
        'Source Observation Key',
        'Canonical Property Key',
        'Parcel ID'
      ];

      for (
        var index = 0;
        index < requiredFields.length;
        index++
      ) {
        if (
          value_(
            row[
              requiredFields[
                index
              ]
            ]
          ) === ''
        ) {
          return true;
        }
      }

      return (
        reconstruction
          .identityError !==
        ''
      );
    }

    function classify_(
      exactRows,
      reconstruct
    ) {
      if (
        exactRows.length > 1
      ) {
        return 'DUPLICATE';
      }

      if (
        exactRows.length === 0
      ) {
        return 'ABSENT';
      }

      var row =
        exactRows[0];

      var storedCanonical =
        value_(
          row[
            'Canonical Property Key'
          ]
        );

      if (
        storedCanonical !== '' &&
        storedCanonical !==
          TARGET_CANONICAL_PROPERTY_KEY
      ) {
        return 'CONFLICT';
      }

      if (
        value_(row.Source) !==
          TARGET_SOURCE ||
        value_(
          row[
            'Source Dataset'
          ]
        ) !==
          TARGET_DATASET ||
        nonblankDifferent_(
          row,
          'Source Record ID',
          TARGET_SOURCE_RECORD_ID
        ) ||
        nonblankDifferent_(
          row,
          'Source Observation Key',
          TARGET_SOURCE_OBSERVATION_KEY
        ) ||
        nonblankDifferent_(
          row,
          'Source Record Key',
          TARGET_SOURCE_OBSERVATION_KEY
        ) ||
        nonblankDifferent_(
          row,
          'Parcel ID',
          TARGET_PARCEL_ID
        )
      ) {
        return 'IDENTITY_DRIFT';
      }

      var reconstruction =
        reconstruct(
          row
        );

      if (
        exactRowIncomplete_(
          row,
          reconstruction
        )
      ) {
        return 'INCOMPLETE';
      }

      if (
        value_(
          row[
            'Distress Lead ID'
          ]
        ) !== '' &&
        exactStored_(
          row,
          'Source Record ID',
          TARGET_SOURCE_RECORD_ID
        ) &&
        exactStored_(
          row,
          'Source Record Key',
          TARGET_SOURCE_OBSERVATION_KEY
        ) &&
        exactStored_(
          row,
          'Source Observation Key',
          TARGET_SOURCE_OBSERVATION_KEY
        ) &&
        exactStored_(
          row,
          'Canonical Property Key',
          TARGET_CANONICAL_PROPERTY_KEY
        ) &&
        exactStored_(
          row,
          'Parcel ID',
          TARGET_PARCEL_ID
        )
      ) {
        return 'EXACT_EXISTING';
      }

      return 'INCOMPLETE';
    }

    function inspect() {
      requireDependencies_();

      REOS.Security
        .requireAdmin();

      var expectedHeaders =
        REOS
          .DistressLeadCountySchema
          .requiredHeaders();

      if (
        expectedHeaders.length !==
          EXPECTED_HEADER_COUNT
      ) {
        throw new Error(
          'PB1 exact identity inspection required-header authority changed.'
        );
      }

      var actualHeaders =
        REOS.Database
          .getHeaders(TABLE);

      if (
        actualHeaders.length !==
          EXPECTED_HEADER_COUNT ||
        !arraysEqual_(
          actualHeaders,
          expectedHeaders
        )
      ) {
        throw new Error(
          'PB1 exact identity inspection DISTRESS_LEADS schema drift detected.'
        );
      }

      var rows =
        REOS.Database
          .getAll(TABLE);

      var scopedProbateRows =
        rows.filter(function (
          row
        ) {
          return (
            sourceExact_(row) &&
            datasetExact_(row)
          );
        });

      var sourceRecordIdMatches =
        rows.filter(function (
          row
        ) {
          return exactStored_(
            row,
            'Source Record ID',
            TARGET_SOURCE_RECORD_ID
          );
        });

      var sourceObservationKeyMatches =
        rows.filter(function (
          row
        ) {
          return exactStored_(
            row,
            'Source Observation Key',
            TARGET_SOURCE_OBSERVATION_KEY
          );
        });

      var sourceRecordKeyMatches =
        rows.filter(function (
          row
        ) {
          return exactStored_(
            row,
            'Source Record Key',
            TARGET_SOURCE_OBSERVATION_KEY
          );
        });

      var exactRows =
        buildUnion_([
          sourceRecordIdMatches,
          sourceObservationKeyMatches,
          sourceRecordKeyMatches
        ]);

      var canonicalRows =
        rows
          .filter(
            canonicalContextMatch_
          )
          .sort(function (
            left,
            right
          ) {
            return (
              physicalRowNumber_(left) -
              physicalRowNumber_(right)
            );
          });

      var exactRowNumbers = {};

      exactRows.forEach(function (
        row
      ) {
        exactRowNumbers[
          String(
            physicalRowNumber_(
              row
            )
          )
        ] = true;
      });

      var canonicalOtherRows =
        canonicalRows.filter(
          function (
            row
          ) {
            return !exactRowNumbers[
              String(
                physicalRowNumber_(
                  row
                )
              )
            ];
          }
        );

      var reconstruct =
        makeReconstructor_();

      var classification =
        classify_(
          exactRows,
          reconstruct
        );

      var exactReturned =
        exactRows.slice(
          0,
          MAX_EXACT_IDENTITY_ROWS
        );

      var canonicalReturned =
        canonicalRows.slice(
          0,
          MAX_CANONICAL_PROPERTY_ROWS
        );

      return {
        ok:
          true,

        mode:
          'READ_ONLY',

        table:
          TABLE,

        target: {
          source:
            TARGET_SOURCE,

          sourceDataset:
            TARGET_DATASET,

          sourceRecordId:
            TARGET_SOURCE_RECORD_ID,

          sourceObservationKey:
            TARGET_SOURCE_OBSERVATION_KEY,

          canonicalPropertyKey:
            TARGET_CANONICAL_PROPERTY_KEY,

          parcelId:
            TARGET_PARCEL_ID
        },

        persistencePrestateClassification:
          classification,

        counts: {
          totalDistressLeadsRowCount:
            rows.length,

          scopedProbateRowCount:
            scopedProbateRows.length,

          sourceRecordIdMatchCount:
            sourceRecordIdMatches.length,

          sourceObservationKeyMatchCount:
            sourceObservationKeyMatches.length,

          sourceRecordKeyMatchCount:
            sourceRecordKeyMatches.length,

          exactIdentityUnionRowCount:
            exactRows.length,

          canonicalPropertyContextRowCount:
            canonicalRows.length,

          canonicalPropertyOtherObservationCount:
            canonicalOtherRows.length
        },

        exactIdentityRows:
          exactReturned.map(
            function (
              row
            ) {
              return rowSummary_(
                row,
                reconstruct
              );
            }
          ),

        exactIdentityRowsTruncated:
          exactRows.length >
            MAX_EXACT_IDENTITY_ROWS,

        canonicalPropertyRows:
          canonicalReturned.map(
            function (
              row
            ) {
              return rowSummary_(
                row,
                reconstruct
              );
            }
          ),

        canonicalPropertyRowsTruncated:
          canonicalRows.length >
            MAX_CANONICAL_PROPERTY_ROWS,

        persistenceAuthorityGranted:
          false,

        databaseMutationAuthorityGranted:
          false,

        insertAuthorityGranted:
          false,

        updateAuthorityGranted:
          false,

        distressLeadCreationAuthorityGranted:
          false,

        repairAuthorityGranted:
          false,

        migrationAuthorityGranted:
          false,

        collapseAuthorityGranted:
          false,

        winnerAuthorityGranted:
          false,

        connectorExecutionAuthorityGranted:
          false,

        externalHttpAuthorityGranted:
          false,

        ownerEvidenceAuthorityGranted:
          false,

        schedulerAuthorityGranted:
          false,

        checkpointMutationAuthorityGranted:
          false,

        automaticOfferAuthorityGranted:
          false
      };
    }

    return Object.freeze({
      inspect:
        inspect
    });
  })();

function reosPhiladelphiaProbatePersistenceReadinessExactIdentityInspection() {
  return REOS
    .PhiladelphiaProbatePersistenceReadinessExactIdentityInspection
    .inspect();
}
