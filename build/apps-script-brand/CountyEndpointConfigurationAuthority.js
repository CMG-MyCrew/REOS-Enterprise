/**
 * REOS Enterprise - County Endpoint Configuration Authority
 *
 * Narrow authority surface for the Philadelphia code-violations endpoint.
 *
 * Guarantees:
 * - status and preflight are read-only;
 * - configuration is limited to one exact Script Property;
 * - only one certified endpoint value is accepted;
 * - live configuration requires admin authority;
 * - caller must bind to the exact current endpoint SHA-256;
 * - county scheduler must remain quiescent;
 * - no DISTRESS_LEADS, county-run, deal, MAO, or offer mutation occurs.
 */
var REOS = REOS || {};

REOS.CountyEndpointConfigurationAuthority = (function () {
  var ENDPOINT_PROPERTY =
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL';

  var CERTIFIED_ENDPOINT =
    'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

  var CONNECTOR_ID =
    'PA-PHILADELPHIA';

  var DATASET =
    'code_violations';

  var CERTIFIED_CURSOR =
    '1600';

  var CERTIFIED_LIMIT =
    100;

  var FIRST_SOURCE_ID =
    1601;

  var LAST_SOURCE_ID =
    1700;

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function sha256_(value) {
    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        text_(value),
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

  function requireDependencies_() {
    if (
      typeof PropertiesService === 'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !==
        'function'
    ) {
      throw new Error(
        'Script Properties authority is unavailable.'
      );
    }

    if (
      typeof Utilities === 'undefined' ||
      !Utilities ||
      typeof Utilities.computeDigest !==
        'function'
    ) {
      throw new Error(
        'SHA-256 support is unavailable.'
      );
    }

    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Admin authority is unavailable.'
      );
    }

    if (
      !REOS.CountyRuntimeBridge ||
      typeof REOS.CountyRuntimeBridge
        .registerConnectors !==
        'function'
    ) {
      throw new Error(
        'County runtime registration is unavailable.'
      );
    }

    if (
      !REOS.CountyConnectorSDK ||
      typeof REOS.CountyConnectorSDK.get !==
        'function'
    ) {
      throw new Error(
        'County connector lookup is unavailable.'
      );
    }
  }

  function properties_() {
    return PropertiesService
      .getScriptProperties();
  }

  function currentEndpoint_() {
    return text_(
      properties_()
        .getProperty(
          ENDPOINT_PROPERTY
        )
    );
  }

  function authorityFlags_() {
    return {
      productionDataMutationExecuted:
        false,

      distressLeadMutationAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      updateAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  function schedulerTriggerCount_() {
    if (
      typeof ScriptApp === 'undefined' ||
      !ScriptApp ||
      typeof ScriptApp
        .getProjectTriggers !==
        'function'
    ) {
      throw new Error(
        'Trigger authority is unavailable.'
      );
    }

    return ScriptApp
      .getProjectTriggers()
      .filter(function (trigger) {
        return (
          trigger &&
          typeof trigger
            .getHandlerFunction ===
            'function' &&
          trigger.getHandlerFunction() ===
            'reosCountyProductionSchedulerRun'
        );
      })
      .length;
  }

  function status() {
    requireDependencies_();

    var current =
      currentEndpoint_();

    return Object.assign(
      {
        ok:
          true,

        mode:
          'READ_ONLY_ENDPOINT_STATUS',

        endpointProperty:
          ENDPOINT_PROPERTY,

        currentEndpointPresent:
          Boolean(current),

        currentEndpointSha256:
          sha256_(current),

        certifiedEndpoint:
          CERTIFIED_ENDPOINT,

        certifiedEndpointSha256:
          sha256_(
            CERTIFIED_ENDPOINT
          ),

        matchesCertifiedEndpoint:
          current ===
          CERTIFIED_ENDPOINT,

        countySchedulerTriggerCount:
          schedulerTriggerCount_(),

        endpointConfigurationAuthorityGranted:
          false,

        endpointConfigurationExecuted:
          false
      },
      authorityFlags_()
    );
  }

  function preflight() {
    requireDependencies_();

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
        'Philadelphia county connector is unavailable.'
      );
    }

    var context = {
      runId:
        'ENDPOINT-AUTHORITY-PREFLIGHT-READ-ONLY',

      connectorId:
        CONNECTOR_ID,

      dataset:
        DATASET,

      cursor:
        CERTIFIED_CURSOR,

      limit:
        CERTIFIED_LIMIT,

      since:
        null,

      dryRun:
        true,

      config: {
        endpoint:
          CERTIFIED_ENDPOINT
      },

      now:
        new Date()
    };

    var response =
      connector.fetch(
        context
      ) || {};

    var raw =
      Array.isArray(
        response.records
      )
        ? response.records
        : [];

    if (
      raw.length !==
      CERTIFIED_LIMIT
    ) {
      throw new Error(
        'Certified endpoint preflight did not return exactly 100 records.'
      );
    }

    var sourceIds =
      raw.map(
        function (record, index) {
          var normalized =
            connector.normalize(
              record,
              context
            );

          if (
            !normalized ||
            normalized.__skip ===
              true
          ) {
            throw new Error(
              'Certified endpoint preflight source record was filtered at index ' +
              index +
              '.'
            );
          }

          return text_(
            normalized[
              'Source Record ID'
            ]
          );
        }
      );

    var expectedIds = [];

    for (
      var id = FIRST_SOURCE_ID;
      id <= LAST_SOURCE_ID;
      id += 1
    ) {
      expectedIds.push(
        String(id)
      );
    }

    if (
      JSON.stringify(
        sourceIds
      ) !==
      JSON.stringify(
        expectedIds
      )
    ) {
      throw new Error(
        'Certified endpoint preflight identity/order differs from 1601-1700 authority.'
      );
    }

    return Object.assign(
      {
        ok:
          true,

        mode:
          'READ_ONLY_ENDPOINT_PREFLIGHT',

        endpointProperty:
          ENDPOINT_PROPERTY,

        candidateEndpoint:
          CERTIFIED_ENDPOINT,

        candidateEndpointSha256:
          sha256_(
            CERTIFIED_ENDPOINT
          ),

        sourceRecordCount:
          sourceIds.length,

        firstSourceRecordId:
          sourceIds[0],

        lastSourceRecordId:
          sourceIds[
            sourceIds.length -
            1
          ],

        countySchedulerTriggerCount:
          schedulerTriggerCount_(),

        endpointConfigurationAuthorityGranted:
          false,

        endpointConfigurationExecuted:
          false
      },
      authorityFlags_()
    );
  }

  function configure(options) {
    requireDependencies_();

    options =
      options ||
      {};

    REOS.Security
      .requireAdmin();

    if (
      options.confirmEndpointUpdate !==
      true
    ) {
      throw new Error(
        'Endpoint configuration requires confirmEndpointUpdate=true.'
      );
    }

    if (
      text_(
        options.endpoint
      ) !==
      CERTIFIED_ENDPOINT
    ) {
      throw new Error(
        'Only the certified Philadelphia code-violations endpoint may be configured.'
      );
    }

    var expectedCurrentSha =
      text_(
        options.expectedCurrentEndpointSha256
      );

    if (
      !/^[0-9a-f]{64}$/
        .test(
          expectedCurrentSha
        )
    ) {
      throw new Error(
        'expectedCurrentEndpointSha256 must be an exact SHA-256.'
      );
    }

    /*
     * Network proof is performed before any configuration mutation.
     */
    var proof =
      preflight();

    if (
      proof.ok !==
        true ||
      proof.sourceRecordCount !==
        CERTIFIED_LIMIT ||
      proof.firstSourceRecordId !==
        String(
          FIRST_SOURCE_ID
        ) ||
      proof.lastSourceRecordId !==
        String(
          LAST_SOURCE_ID
        )
    ) {
      throw new Error(
        'Certified endpoint preflight did not satisfy configuration authority.'
      );
    }

    if (
      schedulerTriggerCount_() !==
      0
    ) {
      throw new Error(
        'County scheduler must remain frozen before endpoint configuration.'
      );
    }

    if (
      typeof LockService ===
        'undefined' ||
      !LockService ||
      typeof LockService
        .getScriptLock !==
        'function'
    ) {
      throw new Error(
        'ScriptLock authority is unavailable.'
      );
    }

    var lock =
      LockService
        .getScriptLock();

    if (
      !lock.tryLock(
        1000
      )
    ) {
      throw new Error(
        'Unable to acquire endpoint configuration ScriptLock.'
      );
    }

    try {
      var before =
        currentEndpoint_();

      var beforeSha =
        sha256_(
          before
        );

      if (
        beforeSha !==
        expectedCurrentSha
      ) {
        throw new Error(
          'Current endpoint SHA-256 differs from caller-certified prestate.'
        );
      }

      if (
        schedulerTriggerCount_() !==
        0
      ) {
        throw new Error(
          'County scheduler authority changed while acquiring endpoint configuration lock.'
        );
      }

      properties_()
        .setProperty(
          ENDPOINT_PROPERTY,
          CERTIFIED_ENDPOINT
        );

      var after =
        currentEndpoint_();

      if (
        after !==
        CERTIFIED_ENDPOINT
      ) {
        throw new Error(
          'Endpoint Script Property verification failed after write.'
        );
      }

      return Object.assign(
        {
          ok:
            true,

          mode:
            'CONTROLLED_ENDPOINT_CONFIGURATION',

          endpointProperty:
            ENDPOINT_PROPERTY,

          previousEndpointSha256:
            beforeSha,

          configuredEndpoint:
            CERTIFIED_ENDPOINT,

          configuredEndpointSha256:
            sha256_(
              CERTIFIED_ENDPOINT
            ),

          countySchedulerTriggerCount:
            0,

          endpointConfigurationAuthorityGranted:
            true,

          endpointConfigurationExecuted:
            true
        },
        authorityFlags_()
      );
    } finally {
      lock.releaseLock();
    }
  }

  return {
    status:
      status,

    preflight:
      preflight,

    configure:
      configure
  };
})();

function reosCountyEndpointConfigurationStatus() {
  return REOS
    .CountyEndpointConfigurationAuthority
    .status();
}

function reosCountyEndpointConfigurationPreflight() {
  return REOS
    .CountyEndpointConfigurationAuthority
    .preflight();
}

function reosCountyEndpointConfigurationApply(
  options
) {
  return REOS
    .CountyEndpointConfigurationAuthority
    .configure(
      options ||
      {}
    );
}
