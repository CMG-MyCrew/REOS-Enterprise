/**
 * REOS Enterprise
 * Code Violations Gate 1 Recovery Executor
 *
 * Population-level, resumable, idempotent recovery of the checksum-
 * certified 139 missing Philadelphia code-violation observations.
 *
 * Durable observation authority:
 *   Violation Number + canonical property identity.
 *
 * ArcGIS ObjectID:
 *   source evidence only; never durable persistence identity.
 *
 * Per invocation:
 * - one certified Gate-1 population reconciliation
 * - at most one bounded detail fetch for <= 10 still-missing records
 * - one fail-fast outer Database ScriptLock
 * - at most 10 Database.insert operations
 * - no update/upsert/delete/checkpoint/scheduler/migration/dedupe/offer
 *
 * Progress is represented only by safely persisted durable identities.
 * There is no recovery cursor or row-specific repair authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationGate1RecoveryExecutor =
(function () {
  'use strict';

  var TABLE =
    'DISTRESS_LEADS';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var MAX_BATCH =
    10;

  var EXPECTED_OPEN_POPULATION =
    153;

  var EXPECTED_RECOVERY_AUTHORITIES =
    139;

  var EXPECTED_NON_RECOVERY_SAFE =
    14;

  var EXPECTED_MANIFEST_SHA256 =
    '33733cdf3ea8fbfccf66dfe0904fe26999b184c2e367a920318b2d943fe6e8c6';

  var EXPECTED_CATALOG_SHA256 =
    '050857487383e799b0a9dc503dfeeae759e8ddf60e485e4ae94cb551e2b8731d';

  var EXPECTED_SOURCE_EVIDENCE_SHA256 =
    'fc6eaf12a1692882dd7e5fae62ea2985fb336c6c6287b017fbb18a28d672c1ef';

  var EXPECTED_LIVE_PREFLIGHT_SHA256 =
    '4c5f6fd76558708d0e993b81de5b807af437844dcf902db0940dab5fbff80257';

  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var PRIORITY_SQL =
    "'UNSAFE','IMMINENTLY DANGEROUS','UNFIT','HAZARDOUS','UNLAWFUL'";

  var ACTIONABLE_PRIORITIES = {
    'UNSAFE': true,
    'IMMINENTLY DANGEROUS': true,
    'UNFIT': true,
    'HAZARDOUS': true,
    'UNLAWFUL': true
  };

  var CLASSIFICATIONS = {
    ALREADY_SAFE:
      'ALREADY_SAFE',

    MISSING:
      'MISSING',

    DUPLICATE_DURABLE:
      'DUPLICATE_DURABLE',

    PROPERTY_CONFLICT:
      'PROPERTY_CONFLICT',

    LEGACY_OBJECTID_COLLISION:
      'LEGACY_OBJECTID_COLLISION',

    SOURCE_IDENTITY_UNAVAILABLE:
      'SOURCE_IDENTITY_UNAVAILABLE'
  };


  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }


  function upper_(value) {
    return text_(value)
      .toUpperCase();
  }


  function keyPart_(value) {
    return text_(value)
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\|/g, '%7c');
  }


  function normalizeObservationKey_(
    value
  ) {
    var parts =
      text_(value)
        .split('|');

    if (parts.length !== 3) {
      return '';
    }

    return [
      keyPart_(parts[0]),
      keyPart_(parts[1]),
      keyPart_(parts[2])
    ].join('|');
  }


  function durableKey_(
    violationNumber
  ) {
    var value =
      upper_(violationNumber);

    if (!value) {
      return '';
    }

    return [
      keyPart_(CONNECTOR_ID),
      keyPart_(DATASET),
      keyPart_(value)
    ].join('|');
  }


  function legacyObjectIdKey_(
    objectId
  ) {
    var value =
      text_(objectId);

    if (
      !value ||
      !/^[0-9]+$/.test(value)
    ) {
      return '';
    }

    return [
      keyPart_(CONNECTOR_ID),
      keyPart_(DATASET),
      keyPart_(value)
    ].join('|');
  }


  function requireDependencies_() {
    if (
      !REOS.Security ||
      typeof REOS.Security
        .requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires Admin authority.'
      );
    }

    if (
      !REOS.CountyCodeViolationGate1Reconciliation ||
      typeof REOS.CountyCodeViolationGate1Reconciliation
        .run !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires certified Gate 1 reconciliation.'
      );
    }

    if (
      !REOS.CountyCodeViolationGate1RecoveryAuthority ||
      typeof REOS.CountyCodeViolationGate1RecoveryAuthority
        .metadata !==
        'function' ||
      typeof REOS.CountyCodeViolationGate1RecoveryAuthority
        .resolve !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires certified durable recovery authority.'
      );
    }

    if (
      !REOS.CountyCodeViolationGate1RecoveryMaintenanceGate ||
      typeof REOS.CountyCodeViolationGate1RecoveryMaintenanceGate
        .assertRecoveryReady !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires the population maintenance gate.'
      );
    }

    if (
      !REOS.Database ||
      typeof REOS.Database.getAll !==
        'function' ||
      typeof REOS.Database.getHeaders !==
        'function' ||
      typeof REOS.Database.insert !==
        'function' ||
      typeof REOS.Database.withScriptLockContext !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires lock-capable Database access.'
      );
    }

    if (
      !REOS.CanonicalPropertyIdentity ||
      typeof REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity !==
        'function' ||
      typeof REOS.CanonicalPropertyIdentity
        .resolve !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires canonical identity support.'
      );
    }

    if (
      !REOS.DistressLeadCountySchema ||
      typeof REOS.DistressLeadCountySchema
        .requiredHeaders !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires exact DISTRESS_LEADS schema authority.'
      );
    }

    if (
      !REOS.CountyRuntimeBridge ||
      typeof REOS.CountyRuntimeBridge
        .registerConnectors !==
        'function' ||
      !REOS.CountyConnectorSDK ||
      typeof REOS.CountyConnectorSDK
        .get !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires the registered production connector.'
      );
    }

    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.ArcGIS ||
      typeof REOS.CountyAdapters.ArcGIS
        .fetch !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery executor requires the bounded ArcGIS adapter.'
      );
    }
  }


  function requireExplicitConfirmation_(
    options
  ) {
    if (
      !options ||
      options.confirmRecovery !==
        true ||
      options.confirmDurableIdentity !==
        true
    ) {
      throw new Error(
        'Gate 1 recovery executor requires confirmRecovery=true and confirmDurableIdentity=true.'
      );
    }

    var requested =
      options.maxInsertCount ===
        undefined ||
      options.maxInsertCount ===
        null
        ? MAX_BATCH
        : Number(
            options.maxInsertCount
          );

    if (
      !Number.isFinite(requested) ||
      Math.floor(requested) !==
        requested ||
      requested < 1 ||
      requested > MAX_BATCH
    ) {
      throw new Error(
        'Gate 1 recovery maxInsertCount must be an integer from 1 through 10.'
      );
    }

    return requested;
  }


  function managedTriggerCount_() {
    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger
            .getHandlerFunction ===
            'function' &&
          String(
            trigger.getHandlerFunction()
          ) ===
            'reosCountyProductionSchedulerRun'
        );
      })
      .length;
  }


  function requireAuthorityMetadata_() {
    var metadata =
      REOS.CountyCodeViolationGate1RecoveryAuthority
        .metadata();

    if (
      !metadata ||
      metadata.mode !==
        'READ_ONLY_GATE1_MISSING_RECOVERY_AUTHORITY' ||
      metadata.connectorId !==
        CONNECTOR_ID ||
      metadata.dataset !==
        DATASET ||
      metadata.authorityManifestSha256 !==
        EXPECTED_MANIFEST_SHA256 ||
      metadata.authorityCatalogSha256 !==
        EXPECTED_CATALOG_SHA256 ||
      metadata.sourceEvidenceSha256 !==
        EXPECTED_SOURCE_EVIDENCE_SHA256 ||
      Number(metadata.candidateCount) !==
        EXPECTED_RECOVERY_AUTHORITIES ||
      Number(metadata.recordCount) !==
        EXPECTED_RECOVERY_AUTHORITIES ||
      metadata.durableIdentityField !==
        'Violation Number' ||
      metadata.canonicalPropertyRequired !==
        true ||
      metadata.objectIdIsDurableAuthority !==
        false ||
      metadata.mutationAuthorityGranted !==
        false ||
      metadata.insertAuthorityGranted !==
        false ||
      metadata.updateAuthorityGranted !==
        false ||
      metadata.checkpointAuthorityGranted !==
        false ||
      metadata.schedulerAuthorityGranted !==
        false ||
      metadata.migrationAuthorityGranted !==
        false ||
      metadata.automaticOfferAuthorityGranted !==
        false
    ) {
      throw new Error(
        'Gate 1 recovery authority metadata mismatch.'
      );
    }

    return metadata;
  }


  function requireMaintenance_(
    maintenanceToken
  ) {
    var result =
      REOS.CountyCodeViolationGate1RecoveryMaintenanceGate
        .assertRecoveryReady({
          maintenanceToken:
            text_(maintenanceToken)
        });

    var authority =
      result &&
      result.authority
        ? result.authority
        : {};

    if (
      !result ||
      result.ok !== true ||
      result.ready !== true ||
      result.mode !==
        'READ_ONLY_GATE1_RECOVERY_MAINTENANCE_ASSERTION' ||
      !text_(result.gateId) ||
      Number(
        result.managedCountySchedulerTriggerCount
      ) !== 0 ||
      authority.mode !==
        'CODE_VIOLATIONS_GATE1_RECOVERY' ||
      Number(authority.candidateCount) !==
        EXPECTED_RECOVERY_AUTHORITIES ||
      authority.manifestSha256 !==
        EXPECTED_MANIFEST_SHA256 ||
      authority.catalogSha256 !==
        EXPECTED_CATALOG_SHA256 ||
      authority.livePreflightSha256 !==
        EXPECTED_LIVE_PREFLIGHT_SHA256 ||
      result.mutationAuthorityGranted !==
        false ||
      result.insertAuthorityGranted !==
        false ||
      result.schedulerAuthorityGranted !==
        false ||
      result.automaticOfferAuthorityGranted !==
        false
    ) {
      throw new Error(
        'Gate 1 recovery maintenance capability mismatch.'
      );
    }

    return result;
  }


  function requireCertifiedEndpoint_() {
    var endpoint =
      text_(
        PropertiesService
          .getScriptProperties()
          .getProperty(
            ENDPOINT_PROPERTY
          )
      );

    if (
      endpoint !==
      CERTIFIED_ENDPOINT
    ) {
      throw new Error(
        'Gate 1 recovery certified endpoint authority mismatch.'
      );
    }

    return endpoint;
  }


  function requireReconciliationContract_(
    result
  ) {
    if (
      !result ||
      result.ok !== true ||
      result.readOnly !== true ||
      result.mode !==
        'CODE_VIOLATIONS_PRODUCTION_COMPLETION_GATE_1' ||
      result.connectorId !==
        CONNECTOR_ID ||
      result.dataset !==
        DATASET ||
      !Array.isArray(result.records) ||
      result.records.length !==
        EXPECTED_OPEN_POPULATION ||
      Number(
        result.countySchedulerTriggerCount
      ) !== 0 ||
      result.productionDataMutationAuthorityGranted !==
        false ||
      result.connectorExecutionAuthorityGranted !==
        false ||
      result.checkpointMutationAuthorityGranted !==
        false ||
      result.schedulerAuthorityGranted !==
        false ||
      result.repairAuthorityGranted !==
        false ||
      result.migrationAuthorityGranted !==
        false ||
      result.automaticOfferAuthorityGranted !==
        false
    ) {
      throw new Error(
        'Gate 1 recovery reconciliation contract drift.'
      );
    }
  }


  function requireSourceAuthorityMatch_(
    source,
    authority
  ) {
    var violationNumber =
      upper_(
        source.violationNumber
      );

    if (
      violationNumber !==
        upper_(
          authority.violationNumber
        ) ||
      text_(
        source.durableObservationKey
      ).toLowerCase() !==
        text_(
          authority.durableObservationKey
        ).toLowerCase() ||
      text_(
        source.canonicalPropertyKey
      ) !==
        text_(
          authority.expectedCanonicalPropertyKey
        ) ||
      text_(source.parcelId) !==
        text_(
          authority.expectedParcelId
        ) ||
      Number(
        source.violationDate
      ) !==
        Number(
          authority.evidenceViolationDate
        ) ||
      upper_(
        source.violationStatus
      ) !==
        'OPEN' ||
      !ACTIONABLE_PRIORITIES[
        upper_(source.priority)
      ]
    ) {
      throw new Error(
        'Gate 1 recovery durable source authority drift: ' +
        violationNumber
      );
    }
  }


  function buildPopulation_(
    reconciliation
  ) {
    var recovery =
      [];

    var nonRecovery =
      [];

    var seen =
      {};

    var previous =
      null;

    reconciliation.records
      .forEach(function (record) {
        var source =
          record &&
          record.source
            ? record.source
            : {};

        var violationNumber =
          upper_(
            source.violationNumber
          );

        var key =
          text_(
            source.durableObservationKey
          ).toLowerCase();

        if (
          !violationNumber ||
          !key ||
          key !==
            durableKey_(
              violationNumber
            )
        ) {
          throw new Error(
            'Gate 1 recovery source durable identity unavailable.'
          );
        }

        var order = {
          date:
            Number(
              source.violationDate
            ),

          violationNumber:
            violationNumber
        };

        if (
          !Number.isFinite(
            order.date
          )
        ) {
          throw new Error(
            'Gate 1 recovery source date is invalid: ' +
            violationNumber
          );
        }

        if (
          previous &&
          (
            order.date <
              previous.date ||
            (
              order.date ===
                previous.date &&
              order.violationNumber <=
                previous.violationNumber
            )
          )
        ) {
          throw new Error(
            'Gate 1 recovery source ordering is not strictly increasing.'
          );
        }

        previous =
          order;

        if (seen[key]) {
          throw new Error(
            'Gate 1 recovery source durable identity duplicated: ' +
            key
          );
        }

        seen[key] =
          true;

        var authority =
          REOS.CountyCodeViolationGate1RecoveryAuthority
            .resolve(key);

        var entry = {
          key:
            key,

          violationNumber:
            violationNumber,

          source:
            source,

          authority:
            authority,

          reconciliationClassification:
            text_(
              record.classification
            ),

          isRecovery:
            !!authority
        };

        if (!authority) {
          if (
            record.classification !==
              CLASSIFICATIONS
                .ALREADY_SAFE
          ) {
            throw new Error(
              'Gate 1 non-recovery observation is no longer safely persisted: ' +
              violationNumber
            );
          }

          nonRecovery.push(
            entry
          );

          return;
        }

        requireSourceAuthorityMatch_(
          source,
          authority
        );

        if (
          record.classification !==
            CLASSIFICATIONS.MISSING &&
          record.classification !==
            CLASSIFICATIONS
              .ALREADY_SAFE
        ) {
          throw new Error(
            'Gate 1 recovery candidate entered unsafe reconciliation state: ' +
            violationNumber +
            ' / ' +
            text_(
              record.classification
            )
          );
        }

        recovery.push(
          entry
        );
      });

    if (
      recovery.length !==
        EXPECTED_RECOVERY_AUTHORITIES ||
      nonRecovery.length !==
        EXPECTED_NON_RECOVERY_SAFE ||
      recovery.length +
        nonRecovery.length !==
        EXPECTED_OPEN_POPULATION
    ) {
      throw new Error(
        'Gate 1 recovery population accounting drift.'
      );
    }

    return {
      recovery:
        recovery,

      nonRecovery:
        nonRecovery,

      all:
        recovery
          .concat(
            nonRecovery
          )
          .sort(function (
            left,
            right
          ) {
            var leftDate =
              Number(
                left.source
                  .violationDate
              );

            var rightDate =
              Number(
                right.source
                  .violationDate
              );

            if (
              leftDate !==
                rightDate
            ) {
              return (
                leftDate -
                rightDate
              );
            }

            return (
              left.violationNumber <
              right.violationNumber
                ? -1
                : left.violationNumber >
                    right.violationNumber
                  ? 1
                  : 0
            );
          })
    };
  }


  function canonicalKey_(
    record
  ) {
    var result =
      REOS.CanonicalPropertyIdentity
        .tryCanonicalPropertyIdentity(
          record || {}
        );

    return (
      result &&
      result.ok
    )
      ? text_(result.key)
      : '';
  }


  function addToMap_(
    map,
    key,
    row
  ) {
    if (!key) {
      return;
    }

    if (!map[key]) {
      map[key] =
        [];
    }

    map[key].push(
      row
    );
  }


  function buildIndexes_(
    rows
  ) {
    var durable =
      {};

    var legacy =
      {};

    (rows || [])
      .filter(function (row) {
        return (
          text_(row.Source) ===
            CONNECTOR_ID &&
          text_(
            row[
              'Source Dataset'
            ]
          ) ===
            DATASET
        );
      })
      .forEach(function (row) {
        var violationNumber =
          upper_(
            row[
              'Violation Number'
            ]
          );

        if (violationNumber) {
          addToMap_(
            durable,
            violationNumber,
            row
          );
        }

        [
          row[
            'Source Observation Key'
          ],
          row[
            'Source Record Key'
          ]
        ].forEach(function (
          value
        ) {
          var key =
            normalizeObservationKey_(
              value
            );

          if (key) {
            addToMap_(
              legacy,
              key,
              row
            );
          }
        });
      });

    return {
      durable:
        durable,

      legacy:
        legacy
    };
  }


  function uniqueCanonicalKeys_(
    rows
  ) {
    var seen =
      {};

    var keys =
      [];

    (rows || [])
      .forEach(function (row) {
        var key =
          canonicalKey_(row);

        if (
          key &&
          !seen[key]
        ) {
          seen[key] =
            true;

          keys.push(
            key
          );
        }
      });

    return keys;
  }


  function classify_(
    entry,
    indexes
  ) {
    var source =
      entry.source ||
      {};

    var violationNumber =
      entry.violationNumber;

    var sourceCanonical =
      text_(
        source.canonicalPropertyKey
      );

    var legacyKey =
      text_(
        source
          .legacyObjectIdObservationKey
      ).toLowerCase();

    if (
      !violationNumber ||
      !entry.key ||
      !sourceCanonical ||
      !legacyKey
    ) {
      return {
        classification:
          CLASSIFICATIONS
            .SOURCE_IDENTITY_UNAVAILABLE,

        durableRows:
          []
      };
    }

    var durableRows =
      indexes.durable[
        violationNumber
      ] || [];

    var legacyRows =
      indexes.legacy[
        legacyKey
      ] || [];

    var collision =
      legacyRows.some(
        function (row) {
          return (
            upper_(
              row[
                'Violation Number'
              ]
            ) !==
              violationNumber
          );
        }
      );

    if (collision) {
      return {
        classification:
          CLASSIFICATIONS
            .LEGACY_OBJECTID_COLLISION,

        durableRows:
          durableRows
      };
    }

    if (!durableRows.length) {
      return {
        classification:
          CLASSIFICATIONS.MISSING,

        durableRows:
          []
      };
    }

    var canonicalKeys =
      uniqueCanonicalKeys_(
        durableRows
      );

    var unavailable =
      durableRows.some(
        function (row) {
          return (
            !canonicalKey_(row)
          );
        }
      );

    var mismatch =
      canonicalKeys.some(
        function (key) {
          return (
            key !==
              sourceCanonical
          );
        }
      );

    if (
      unavailable ||
      mismatch ||
      canonicalKeys.length !==
        1
    ) {
      return {
        classification:
          CLASSIFICATIONS
            .PROPERTY_CONFLICT,

        durableRows:
          durableRows
      };
    }

    if (
      durableRows.length >
        1
    ) {
      return {
        classification:
          CLASSIFICATIONS
            .DUPLICATE_DURABLE,

        durableRows:
          durableRows
      };
    }

    return {
      classification:
        CLASSIFICATIONS
          .ALREADY_SAFE,

      durableRows:
        durableRows
    };
  }


  function classifyPopulation_(
    population,
    rows
  ) {
    var indexes =
      buildIndexes_(
        rows
      );

    var results =
      population.all
        .map(function (
          entry
        ) {
          var classified =
            classify_(
              entry,
              indexes
            );

          return {
            entry:
              entry,

            classification:
              classified
                .classification,

            durableRows:
              classified
                .durableRows
          };
        });

    var unsafe =
      results.filter(
        function (result) {
          return (
            result.classification !==
              CLASSIFICATIONS.MISSING &&
            result.classification !==
              CLASSIFICATIONS
                .ALREADY_SAFE
          );
        }
      );

    if (unsafe.length) {
      throw new Error(
        'Gate 1 recovery locked population contains unsafe identity state: ' +
        unsafe[0]
          .entry
          .violationNumber +
        ' / ' +
        unsafe[0]
          .classification
      );
    }

    results
      .filter(function (
        result
      ) {
        return (
          !result.entry
            .isRecovery
        );
      })
      .forEach(function (
        result
      ) {
        if (
          result.classification !==
            CLASSIFICATIONS
              .ALREADY_SAFE
        ) {
          throw new Error(
            'Gate 1 non-recovery safe population drifted under lock: ' +
            result.entry
              .violationNumber
          );
        }
      });

    return results;
  }


  function recoveryMissing_(
    results
  ) {
    return results
      .filter(function (
        result
      ) {
        return (
          result.entry
            .isRecovery &&
          result.classification ===
            CLASSIFICATIONS.MISSING
        );
      });
  }


  function sqlViolationList_(
    entries
  ) {
    return entries
      .map(function (entry) {
        var value =
          upper_(
            entry.violationNumber
          );

        if (
          !/^VI-\d{4}-\d{6}$/
            .test(value)
        ) {
          throw new Error(
            'Gate 1 recovery durable violation number is malformed: ' +
            value
          );
        }

        return (
          "'" +
          value +
          "'"
        );
      })
      .join(',');
  }


  function validationResult_(
    connector,
    record,
    context
  ) {
    var validation =
      connector.validate
        ? connector.validate(
            record,
            context
          )
        : REOS.CountyConnectorSDK
            .validateLead(
              record
            );

    if (
      validation ===
      true
    ) {
      return {
        ok:
          true,

        errors:
          []
      };
    }

    return validation || {
      ok:
        false,

      errors:
        [
          'No validation result.'
        ]
    };
  }


  function fetchDetailRecords_(
    entries
  ) {
    if (!entries.length) {
      return {
        recordsByKey:
          {},

        fetched:
          0
      };
    }

    REOS.CountyRuntimeBridge
      .registerConnectors();

    var connector =
      REOS.CountyConnectorSDK
        .get(
          CONNECTOR_ID
        );

    if (
      !connector ||
      typeof connector.normalize !==
        'function'
    ) {
      throw new Error(
        'Gate 1 recovery registered Philadelphia connector is incomplete.'
      );
    }

    var endpoint =
      requireCertifiedEndpoint_();

    var now =
      new Date();

    var context = {
      runId:
        'GATE1-RECOVERY-' +
        now.getTime(),

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      cursor:
        '',

      limit:
        entries.length,

      since:
        null,

      dryRun:
        true,

      config:
        {},

      now:
        now
    };

    /*
     * Detail authority is durable Violation Number only.
     *
     * Do not reapply the historical ObjectID cap or AK1 boundary here.
     * Those define the certified Gate-1 population in reconciliation;
     * they are not durable source-record lookup authority.
     */
    var where =
      'violationnumber IN (' +
      sqlViolationList_(
        entries
      ) +
      ')' +
      " AND violationstatus = 'OPEN'" +
      ' AND caseprioritydesc IN (' +
      PRIORITY_SQL +
      ')';

    var response =
      REOS.CountyAdapters.ArcGIS
        .fetch({
          endpoint:
            endpoint,

          context:
            context,

          maxLimit:
            MAX_BATCH,

          where:
            where,

          outFields:
            '*',

          returnGeometry:
            false,

          orderByFields:
            'violationdate ASC, violationnumber ASC'
        }) || {};

    var records =
      Array.isArray(
        response.records
      )
        ? response.records
        : [];

    if (
      records.length !==
        entries.length
    ) {
      throw new Error(
        'Gate 1 recovery detail source count mismatch.'
      );
    }

    var entryByViolation =
      {};

    entries.forEach(
      function (entry) {
        entryByViolation[
          entry.violationNumber
        ] =
          entry;
      }
    );

    var recordsByKey =
      {};

    records.forEach(
      function (raw) {
        var violationNumber =
          upper_(
            raw.violationnumber ||
            raw.VIOLATIONNUMBER
          );

        var entry =
          entryByViolation[
            violationNumber
          ];

        if (!entry) {
          throw new Error(
            'Gate 1 recovery detail source returned unauthorized violation: ' +
            violationNumber
          );
        }

        if (
          recordsByKey[
            entry.key
          ]
        ) {
          throw new Error(
            'Gate 1 recovery detail source duplicated durable identity: ' +
            violationNumber
          );
        }

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
            'Gate 1 recovery selected source record is filtered: ' +
            violationNumber
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
            'Gate 1 recovery normalized source validation failed: ' +
            violationNumber
          );
        }

        var authority =
          entry.authority;

        var objectId =
          text_(
            raw.objectid ||
            raw.OBJECTID
          );

        var currentCanonical =
          canonicalKey_(
            normalized
          );

        if (
          text_(normalized.Source) !==
            CONNECTOR_ID ||
          text_(
            normalized[
              'Source Dataset'
            ]
          ) !==
            DATASET ||
          upper_(
            normalized[
              'Violation Number'
            ]
          ) !==
            violationNumber ||
          text_(
            normalized[
              'Source Record ID'
            ]
          ) !==
            objectId ||
          Number(
            raw.violationdate
          ) !==
            Number(
              authority
                .evidenceViolationDate
            ) ||
          text_(
            normalized[
              'Parcel ID'
            ]
          ) !==
            text_(
              authority
                .expectedParcelId
            ) ||
          currentCanonical !==
            text_(
              authority
                .expectedCanonicalPropertyKey
            ) ||
          upper_(
            normalized[
              'Violation Status'
            ]
          ) !==
            'OPEN' ||
          !ACTIONABLE_PRIORITIES[
            upper_(
              raw.caseprioritydesc
            )
          ]
        ) {
          throw new Error(
            'Gate 1 recovery selected durable source identity drift: ' +
            violationNumber
          );
        }

        var durableRecord =
          Object.assign(
            {},
            normalized,
            {
              'Source Record ID':
                authority
                  .violationNumber,

              'Violation Number':
                authority
                  .violationNumber,

              'Parcel ID':
                authority
                  .expectedParcelId,

              'Source Record Key':
                authority
                  .durableObservationKey,

              'Source Observation Key':
                authority
                  .durableObservationKey,

              'Canonical Property Key':
                authority
                  .expectedCanonicalPropertyKey,

              'Last Seen At':
                new Date()
            }
          );

        delete durableRecord[
          'Distress Lead ID'
        ];

        delete durableRecord
          ._rowNumber;

        var durableValidation =
          validationResult_(
            connector,
            durableRecord,
            context
          );

        if (
          !durableValidation ||
          durableValidation.ok !==
            true
        ) {
          throw new Error(
            'Gate 1 durable recovery payload failed connector validation: ' +
            violationNumber
          );
        }

        var durableIdentity =
          REOS.CanonicalPropertyIdentity
            .resolve(
              durableRecord
            );

        if (
          !durableIdentity ||
          text_(
            durableIdentity
              .sourceObservationKey
          ).toLowerCase() !==
            entry.key ||
          text_(
            durableIdentity
              .canonicalPropertyKey
          ) !==
            text_(
              authority
                .expectedCanonicalPropertyKey
            ) ||
          text_(
            durableRecord[
              'Source Record ID'
            ]
          ) !==
            authority
              .violationNumber ||
          text_(
            durableRecord[
              'Source Record ID'
            ]
          ) ===
            objectId
        ) {
          throw new Error(
            'Gate 1 durable recovery identity construction failed: ' +
            violationNumber
          );
        }

        recordsByKey[
          entry.key
        ] = {
          entry:
            entry,

          rawObjectId:
            objectId,

          currentLegacyObjectIdKey:
            legacyObjectIdKey_(
              objectId
            ),

          durableRecord:
            durableRecord
        };
      });

    return {
      recordsByKey:
        recordsByKey,

      fetched:
        records.length
    };
  }


  function assertSchemaExact_() {
    var expected =
      REOS.DistressLeadCountySchema
        .requiredHeaders();

    var actual =
      REOS.Database
        .getHeaders(
          TABLE
        );

    if (
      !Array.isArray(expected) ||
      !Array.isArray(actual) ||
      expected.length !==
        actual.length ||
      expected.some(
        function (
          value,
          index
        ) {
          return (
            value !==
              actual[index]
          );
        }
      )
    ) {
      throw new Error(
        'DISTRESS_LEADS schema differs from certified Gate 1 recovery boundary.'
      );
    }

    return {
      headerCount:
        actual.length
    };
  }


  function exactDurableRow_(
    rows,
    entry
  ) {
    var matches =
      (rows || [])
        .filter(function (row) {
          return (
            text_(row.Source) ===
              CONNECTOR_ID &&
            text_(
              row[
                'Source Dataset'
              ]
            ) ===
              DATASET &&
            upper_(
              row[
                'Violation Number'
              ]
            ) ===
              entry.violationNumber
          );
        });

    if (
      matches.length !==
        1
    ) {
      throw new Error(
        'Gate 1 post-insert durable observation count is not exactly one: ' +
        entry.violationNumber
      );
    }

    var row =
      matches[0];

    if (
      text_(
        row[
          'Source Record ID'
        ]
      ) !==
        entry.authority
          .violationNumber ||
      text_(
        row[
          'Source Observation Key'
        ]
      ).toLowerCase() !==
        entry.key ||
      text_(
        row[
          'Source Record Key'
        ]
      ).toLowerCase() !==
        entry.key ||
      text_(
        row[
          'Parcel ID'
        ]
      ) !==
        text_(
          entry.authority
            .expectedParcelId
        ) ||
      canonicalKey_(row) !==
        text_(
          entry.authority
            .expectedCanonicalPropertyKey
        )
    ) {
      throw new Error(
        'Gate 1 post-insert durable identity reconciliation failed: ' +
        entry.violationNumber
      );
    }

    return row;
  }


  function run(options) {
    options =
      options || {};

    requireDependencies_();

    REOS.Security
      .requireAdmin();

    var maxInsertCount =
      requireExplicitConfirmation_(
        options
      );

    requireAuthorityMetadata_();

    if (
      managedTriggerCount_() !==
        0
    ) {
      throw new Error(
        'Gate 1 recovery requires zero managed county scheduler triggers.'
      );
    }

    var maintenance =
      requireMaintenance_(
        options
          .maintenanceToken
      );

    /*
     * The certified Gate-1 reconciliation owns the single complete
     * population source read for this invocation.
     */
    var reconciliation =
      REOS.CountyCodeViolationGate1Reconciliation
        .run();

    requireReconciliationContract_(
      reconciliation
    );

    var population =
      buildPopulation_(
        reconciliation
      );

    /*
     * Choose from the certified reconciliation only. The final decision
     * to mutate is repeated under the database lock.
     */
    var preselected =
      population.recovery
        .filter(function (
          entry
        ) {
          return (
            entry
              .reconciliationClassification ===
            CLASSIFICATIONS.MISSING
          );
        })
        .slice(
          0,
          maxInsertCount
        );

    /*
     * Complete source payloads are fetched only for the bounded durable
     * candidates, by Violation Number rather than ObjectID.
     */
    var details =
      fetchDetailRecords_(
        preselected
      );

    /*
     * For selected records, use the newest observed ObjectID only as a
     * collision diagnostic during the locked reclassification.
     */
    preselected.forEach(
      function (entry) {
        var detail =
          details.recordsByKey[
            entry.key
          ];

        if (
          !detail ||
          !detail
            .currentLegacyObjectIdKey
        ) {
          throw new Error(
            'Gate 1 recovery selected source detail is incomplete: ' +
            entry.violationNumber
          );
        }

        entry.source =
          Object.assign(
            {},
            entry.source,
            {
              objectId:
                detail
                  .rawObjectId,

              legacyObjectIdObservationKey:
                detail
                  .currentLegacyObjectIdKey
            }
          );
      });

    var insertedKeys =
      [];

    var result =
      REOS.Database
        .withScriptLockContext(
          function (
            lockContext
          ) {
            requireAuthorityMetadata_();

            var lockedMaintenance =
              requireMaintenance_(
                options
                  .maintenanceToken
              );

            if (
              text_(
                lockedMaintenance
                  .gateId
              ) !==
                text_(
                  maintenance.gateId
                )
            ) {
              throw new Error(
                'Gate 1 recovery maintenance capability changed before insert.'
              );
            }

            if (
              managedTriggerCount_() !==
                0
            ) {
              throw new Error(
                'Gate 1 recovery county scheduler authority changed before insert.'
              );
            }

            var schema =
              assertSchemaExact_();

            var beforeRows =
              REOS.Database
                .getAll(
                  TABLE
                );

            var before =
              classifyPopulation_(
                population,
                beforeRows
              );

            var beforeMissing =
              recoveryMissing_(
                before
              );

            var selectedKeySet =
              {};

            preselected.forEach(
              function (entry) {
                selectedKeySet[
                  entry.key
                ] =
                  true;
              }
            );

            var lockedCandidates =
              beforeMissing
                .filter(function (
                  classified
                ) {
                  return (
                    selectedKeySet[
                      classified.entry
                        .key
                    ] ===
                      true
                  );
                });

            if (
              lockedCandidates.length >
                maxInsertCount ||
              lockedCandidates.length >
                MAX_BATCH
            ) {
              throw new Error(
                'Gate 1 recovery locked mutation batch exceeded certified bound.'
              );
            }

            var inserted =
              [];

            lockedCandidates
              .forEach(function (
                classified
              ) {
                var entry =
                  classified.entry;

                var detail =
                  details.recordsByKey[
                    entry.key
                  ];

                if (
                  !detail ||
                  !detail.durableRecord
                ) {
                  throw new Error(
                    'Gate 1 recovery durable insert payload missing: ' +
                    entry.violationNumber
                  );
                }

                var insertedRow;

                try {
                  insertedRow =
                    REOS.Database
                      .insert(
                        TABLE,
                        detail
                          .durableRecord,
                        {
                          idField:
                            'Distress Lead ID',

                          idPrefix:
                            'DL',

                          lockContext:
                            lockContext
                        }
                      );
                } catch (error) {
                  throw new Error(
                    'Gate 1 recovery batch insert failed after ' +
                    inserted.length +
                    ' successful durable insert(s); rerun only through this population executor so persisted durable identities are reclassified. Cause: ' +
                    text_(
                      error &&
                      error.message
                        ? error.message
                        : error
                    )
                  );
                }

                var distressLeadId =
                  text_(
                    insertedRow &&
                    insertedRow[
                      'Distress Lead ID'
                    ]
                  );

                if (!distressLeadId) {
                  throw new Error(
                    'Gate 1 recovery insert returned no Distress Lead ID: ' +
                    entry.violationNumber
                  );
                }

                insertedKeys.push(
                  entry.key
                );

                inserted.push({
                  violationNumber:
                    entry
                      .violationNumber,

                  durableObservationKey:
                    entry.key,

                  distressLeadId:
                    distressLeadId,

                  sourceRecordId:
                    entry.authority
                      .violationNumber,

                  currentObjectId:
                    detail
                      .rawObjectId,

                  certifiedEvidenceObjectId:
                    text_(
                      entry.authority
                        .evidenceObjectId
                    )
                });
              });

            var afterRows =
              REOS.Database
                .getAll(
                  TABLE
                );

            var after =
              classifyPopulation_(
                population,
                afterRows
              );

            inserted.forEach(
              function (
                insertedResult
              ) {
                var entry =
                  population.recovery
                    .filter(function (
                      candidate
                    ) {
                      return (
                        candidate.key ===
                          insertedResult
                            .durableObservationKey
                      );
                    })[0];

                exactDurableRow_(
                  afterRows,
                  entry
                );
              });

            var remainingMissing =
              recoveryMissing_(
                after
              );

            if (
              remainingMissing.length !==
                beforeMissing.length -
                inserted.length
            ) {
              throw new Error(
                'Gate 1 recovery post-insert missing-count reconciliation failed.'
              );
            }

            return {
              ok:
                true,

              mode:
                'CODE_VIOLATIONS_GATE1_BOUNDED_DURABLE_RECOVERY',

              connectorId:
                CONNECTOR_ID,

              dataset:
                DATASET,

              maintenanceGateId:
                text_(
                  lockedMaintenance
                    .gateId
                ),

              schemaHeaderCount:
                schema
                  .headerCount,

              certifiedRecoveryAuthorityCount:
                EXPECTED_RECOVERY_AUTHORITIES,

              nonRecoveryAlreadySafeCount:
                EXPECTED_NON_RECOVERY_SAFE,

              batchLimit:
                maxInsertCount,

              detailSourceRecordCount:
                details
                  .fetched,

              lockedMissingCountBefore:
                beforeMissing
                  .length,

              insertedCount:
                inserted
                  .length,

              inserted:
                inserted,

              remainingMissingCount:
                remainingMissing
                  .length,

              complete:
                remainingMissing
                  .length ===
                0,

              countySchedulerTriggerCount:
                0,

              productionDataMutationPerformed:
                inserted
                  .length >
                0,

              persistentMutationAuthorityGranted:
                false,

              insertAuthorityGranted:
                false,

              updateAuthorityGranted:
                false,

              deleteAuthorityGranted:
                false,

              checkpointMutationAuthorityGranted:
                false,

              schedulerAuthorityGranted:
                false,

              migrationAuthorityGranted:
                false,

              deduplicationAuthorityGranted:
                false,

              automaticOfferAuthorityGranted:
                false
            };
          }
        );

    return result;
  }


  return {
    run:
      run
  };
})();


function reosCountyCodeViolationGate1RecoveryExecute(
  options
) {
  return REOS
    .CountyCodeViolationGate1RecoveryExecutor
    .run(options);
}
