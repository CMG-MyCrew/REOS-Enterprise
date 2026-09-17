/**
 * REOS Zillow Gmail connector-state diagnostic v1.
 *
 * Strictly read-only inspection of existing connector registry and run rows.
 * No ensure path, Gmail access, connector execution, trigger mutation,
 * database mutation, or offer authority.
 */

var REOS = REOS || {};

REOS.ZillowGmailConnectorStateDiagnostic =
  (function () {
    'use strict';

    var REGISTRY_TABLE =
      'ACQUISITION_CONNECTORS';

    var RUNS_TABLE =
      'ACQUISITION_CONNECTOR_RUNS';

    var CONNECTOR_KEY =
      'zillow_gmail_leads';

    var EXPECTED_NAME =
      'Zillow Gmail Multi-Folder Leads';

    var EXPECTED_TYPE =
      'GMAIL';

    var EXPECTED_SOURCE_CATEGORY =
      'Zillow Lead';

    var EXPECTED_HANDLER =
      'reosConnectorHandleZillowGmail';

    var EXPECTED_SCHEDULE =
      'Every 15 minutes';

    function text_(value) {
      if (
        value &&
        typeof value.toISOString ===
          'function'
      ) {
        return value.toISOString();
      }

      if (
        value === null ||
        value === undefined
      ) {
        return '';
      }

      return String(value).trim();
    }

    function number_(value) {
      var number =
        Number(value || 0);

      return Number.isFinite(number)
        ? number
        : 0;
    }

    function enabled_(value) {
      return (
        value === true ||
        String(value || '')
          .toLowerCase() ===
          'true'
      );
    }

    function authorityFree_(result) {
      result.gmailExecutionAuthorityGranted =
        false;

      result.connectorExecutionAuthorityGranted =
        false;

      result.triggerMutationAuthorityGranted =
        false;

      result.productionDataMutationAuthorityGranted =
        false;

      result.automaticOfferAuthorityGranted =
        false;

      return result;
    }

    function parseConfig_(value) {
      if (
        value === null ||
        value === undefined ||
        value === ''
      ) {
        return {};
      }

      if (
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return value;
      }

      var parsed =
        JSON.parse(
          String(value)
        );

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          'Zillow connector Config JSON must decode to an object.'
        );
      }

      return parsed;
    }

    function boundedEffectiveConfig_(
      config
    ) {
      return {
        labels:
          Array.isArray(config.labels)
            ? config.labels.map(
                function (item) {
                  return String(
                    item || ''
                  ).trim();
                }
              )
            : [],

        importedLabel:
          text_(
            config.importedLabel
          ),

        errorLabel:
          text_(
            config.errorLabel
          ),

        maxThreadsPerLabel:
          number_(
            config.maxThreadsPerLabel
          ),

        lookbackDays:
          number_(
            config.lookbackDays
          ),

        markRead:
          !!config.markRead,

        archiveAfterImport:
          !!config.archiveAfterImport,

        runDownstreamIngestion:
          !!config.runDownstreamIngestion,

        scoreLeads:
          !!config.scoreLeads,

        autoPromote:
          !!config.autoPromote,

        defaultCity:
          text_(
            config.defaultCity
          ),

        defaultState:
          text_(
            config.defaultState
          ),

        defaultAssignedToConfigured:
          !!text_(
            config.defaultAssignedTo
          )
      };
    }

    function boundedLatestRun_(row) {
      if (!row) {
        return null;
      }

      return {
        runId:
          text_(
            row['Run ID']
          ),

        status:
          text_(
            row.Status
          ),

        startedAt:
          text_(
            row['Started At']
          ),

        completedAt:
          text_(
            row['Completed At']
          ),

        durationMs:
          number_(
            row['Duration Ms']
          ),

        recordsFound:
          number_(
            row['Records Found']
          ),

        recordsImported:
          number_(
            row['Records Imported']
          ),

        recordsSkipped:
          number_(
            row['Records Skipped']
          ),

        message:
          text_(
            row.Message
          )
      };
    }

    function read() {
      if (
        !REOS.Database ||
        typeof REOS.Database.getAll !==
          'function'
      ) {
        throw new Error(
          'Database.getAll is required.'
        );
      }

      if (
        !REOS.ZillowGmailConnector ||
        typeof REOS.ZillowGmailConnector
          .normalizeConfig_ !==
          'function'
      ) {
        throw new Error(
          'ZillowGmailConnector.normalizeConfig_ is required.'
        );
      }

      var registryRows;

      try {
        registryRows =
          REOS.Database.getAll(
            REGISTRY_TABLE
          );
      } catch (error) {
        return JSON.stringify(
          authorityFree_({
            ok: false,

            classification:
              'ZILLOW_CONNECTOR_REGISTRY_UNAVAILABLE',

            connectorKey:
              CONNECTOR_KEY,

            connector:
              null,

            effectiveConfig:
              null,

            recentRunCount:
              null,

            latestRun:
              null
          })
        );
      }

      var matches =
        registryRows.filter(
          function (row) {
            return (
              text_(
                row['Connector Key']
              ).toLowerCase() ===
              CONNECTOR_KEY
            );
          }
        );

      if (matches.length === 0) {
        return JSON.stringify(
          authorityFree_({
            ok: false,

            classification:
              'ZILLOW_CONNECTOR_ROW_MISSING',

            connectorKey:
              CONNECTOR_KEY,

            matchCount:
              0,

            connector:
              null,

            effectiveConfig:
              null,

            recentRunCount:
              null,

            latestRun:
              null
          })
        );
      }

      if (matches.length !== 1) {
        return JSON.stringify(
          authorityFree_({
            ok: false,

            classification:
              'ZILLOW_CONNECTOR_ROW_DUPLICATED',

            connectorKey:
              CONNECTOR_KEY,

            matchCount:
              matches.length,

            connector:
              null,

            effectiveConfig:
              null,

            recentRunCount:
              null,

            latestRun:
              null
          })
        );
      }

      var row =
        matches[0];

      var connector = {
        connectorId:
          text_(
            row['Connector ID']
          ),

        connectorKey:
          text_(
            row['Connector Key']
          ),

        name:
          text_(
            row.Name
          ),

        nameExact:
          text_(
            row.Name
          ) ===
            EXPECTED_NAME,

        type:
          text_(
            row.Type
          ),

        typeExact:
          text_(
            row.Type
          ) ===
            EXPECTED_TYPE,

        sourceCategory:
          text_(
            row['Source Category']
          ),

        sourceCategoryExact:
          text_(
            row['Source Category']
          ) ===
            EXPECTED_SOURCE_CATEGORY,

        handlerFunction:
          text_(
            row['Handler Function']
          ),

        handlerExact:
          text_(
            row['Handler Function']
          ) ===
            EXPECTED_HANDLER,

        enabled:
          enabled_(
            row.Enabled
          ),

        schedule:
          text_(
            row.Schedule
          ),

        scheduleExact:
          text_(
            row.Schedule
          ) ===
            EXPECTED_SCHEDULE,

        priority:
          number_(
            row.Priority
          ),

        lastRunAt:
          text_(
            row['Last Run At']
          ),

        lastStatus:
          text_(
            row['Last Status']
          ),

        lastMessage:
          text_(
            row['Last Message']
          )
      };

      var rawConfig;

      try {
        rawConfig =
          parseConfig_(
            row['Config JSON']
          );
      } catch (error) {
        return JSON.stringify(
          authorityFree_({
            ok: false,

            classification:
              'ZILLOW_CONNECTOR_CONFIG_INVALID_JSON',

            connectorKey:
              CONNECTOR_KEY,

            matchCount:
              1,

            connector:
              connector,

            effectiveConfig:
              null,

            recentRunCount:
              null,

            latestRun:
              null
          })
        );
      }

      var effectiveConfig =
        REOS.ZillowGmailConnector
          .normalizeConfig_(
            rawConfig
          );

      var runRows;

      try {
        runRows =
          REOS.Database.getAll(
            RUNS_TABLE
          );
      } catch (error) {
        return JSON.stringify(
          authorityFree_({
            ok: false,

            classification:
              'ZILLOW_CONNECTOR_RUN_STATE_UNAVAILABLE',

            connectorKey:
              CONNECTOR_KEY,

            matchCount:
              1,

            connector:
              connector,

            effectiveConfig:
              boundedEffectiveConfig_(
                effectiveConfig
              ),

            recentRunCount:
              null,

            latestRun:
              null
          })
        );
      }

      var matchingRuns =
        runRows.filter(
          function (run) {
            return (
              text_(
                run['Connector Key']
              ).toLowerCase() ===
              CONNECTOR_KEY
            );
          }
        );

      var latestRun =
        matchingRuns.length
          ? matchingRuns[
              matchingRuns.length - 1
            ]
          : null;

      var metadataExact =
        connector.nameExact &&
        connector.typeExact &&
        connector.sourceCategoryExact &&
        connector.handlerExact &&
        connector.scheduleExact;

      var classification =
        metadataExact
          ? 'ZILLOW_CONNECTOR_STATE_EXACT'
          : 'ZILLOW_CONNECTOR_METADATA_MISMATCH';

      return JSON.stringify(
        authorityFree_({
          ok:
            classification ===
              'ZILLOW_CONNECTOR_STATE_EXACT',

          classification:
            classification,

          connectorKey:
            CONNECTOR_KEY,

          matchCount:
            1,

          connector:
            connector,

          effectiveConfig:
            boundedEffectiveConfig_(
              effectiveConfig
            ),

          recentRunCount:
            matchingRuns.length,

          latestRun:
            boundedLatestRun_(
              latestRun
            )
        })
      );
    }

    return {
      read: read
    };
  })();

function reosZillowGmailConnectorStateDiagnostic() {
  return REOS
    .ZillowGmailConnectorStateDiagnostic
    .read();
}
