/**
 * REOS Enterprise - County Runtime Bridge
 *
 * Controlled Enterprise entry points for the native county connector runtime.
 *
 * Guarantees:
 * - adapter registration is deterministic and idempotent
 * - generated connector registration is deterministic and idempotent
 * - dry-run is the default execution mode
 * - live execution requires confirmLive === true
 * - DISTRESS_LEADS county schema is ensured before every live SDK run
 * - legacy AcquisitionConnectorManager county routes are not modified
 */
var REOS = REOS || {};

REOS.CountyRuntimeBridge = (function () {
  var ADAPTERS = [
    {
      name: 'arcgis',
      property: 'ArcGIS'
    },
    {
      name: 'html-table',
      property: 'HTMLTable'
    },
    {
      name: 'json-api',
      property: 'JSONAPI'
    },
    {
      name: 'socrata',
      property: 'Socrata'
    },
    {
      name: 'csv',
      property: 'CSV'
    }
  ];

  function requireRuntime_() {
    if (
      !REOS.CountyAdapters ||
      !REOS.CountyAdapters.Registry
    ) {
      throw new Error(
        'CountyAdapterRegistry is not loaded.'
      );
    }

    if (!REOS.CountyConnectorSDK) {
      throw new Error(
        'CountyConnectorSDK is not loaded.'
      );
    }
  }

  function requireSchema_() {
    if (
      !REOS.DistressLeadCountySchema ||
      typeof REOS.DistressLeadCountySchema.ensure !== 'function'
    ) {
      throw new Error(
        'DISTRESS_LEADS county schema bridge is not loaded.'
      );
    }
  }

  function registerAdapters() {
    requireRuntime_();

    var registry =
      REOS.CountyAdapters.Registry;

    ADAPTERS.forEach(function (definition) {
      var implementation =
        REOS.CountyAdapters[
          definition.property
        ];

      if (!implementation) {
        throw new Error(
          'County adapter implementation is not loaded: ' +
          definition.name
        );
      }

      if (!registry.get(definition.name)) {
        registry.register(
          definition.name,
          implementation
        );
      }
    });

    return registry.list();
  }

  function registerConnectors() {
    registerAdapters();

    var registrars =
      REOS.GeneratedCountyConnectorRegistrars || [];

    registrars.forEach(function (registrar) {
      if (typeof registrar !== 'function') {
        throw new Error(
          'Generated county connector registrar is not executable.'
        );
      }

      registrar();
    });

    return REOS.CountyConnectorSDK.list();
  }

  function normalizeLimit_(value, fallback) {
    var number = Number(
      value || fallback
    );

    if (!isFinite(number)) {
      number = fallback;
    }

    return Math.max(
      1,
      Math.min(
        Math.floor(number),
        5000
      )
    );
  }

  function setup() {
    requireSchema_();

    var connectors =
      registerConnectors();

    /*
     * Explicit setup is allowed to migrate DISTRESS_LEADS because the
     * caller is intentionally preparing the runtime for live operation.
     */
    var schema =
      REOS.DistressLeadCountySchema.ensure();

    var infrastructure =
      REOS.CountyConnectorSDK.ensureInfrastructure();

    return {
      ok: true,
      connectorCount: connectors.length,
      schema: schema,
      infrastructure: infrastructure
    };
  }

  function list() {
    return registerConnectors();
  }

  function run(connectorId, options) {
    options = options || {};

    registerConnectors();

    var id = String(
      connectorId || ''
    ).trim();

    if (!id) {
      throw new Error(
        'connectorId is required.'
      );
    }

    var dataset = String(
      options.dataset || ''
    ).trim();

    if (!dataset) {
      throw new Error(
        'dataset is required.'
      );
    }

    var dryRun =
      options.dryRun !== false;

    /*
     * Live persistence has two independent gates:
     *
     * 1. caller must explicitly request dryRun=false
     * 2. caller must explicitly provide confirmLive=true
     *
     * Schema migration occurs only after both gates pass and before
     * CountyConnectorSDK.run() can reach persistence.
     */
    if (!dryRun) {
      if (options.confirmLive !== true) {
        throw new Error(
          'Live county runtime execution requires confirmLive=true.'
        );
      }

      requireSchema_();
      REOS.DistressLeadCountySchema.ensure();
    }

    return REOS.CountyConnectorSDK.run(
      id,
      {
        dataset: dataset,
        limit: normalizeLimit_(
          options.limit,
          dryRun ? 100 : 500
        ),
        cursor: String(
          options.cursor || ''
        ),
        since: options.since || null,
        dryRun: dryRun,
        config: options.config || {}
      }
    );
  }

  function dryRun(
    connectorId,
    dataset,
    options
  ) {
    options = Object.assign(
      {},
      options || {},
      {
        dataset: dataset,
        dryRun: true
      }
    );

    return run(
      connectorId,
      options
    );
  }

  function sync(
    connectorId,
    dataset,
    options
  ) {
    options = Object.assign(
      {},
      options || {},
      {
        dataset: dataset,
        dryRun: false
      }
    );

    return run(
      connectorId,
      options
    );
  }

  return {
    registerAdapters: registerAdapters,
    registerConnectors: registerConnectors,
    setup: setup,
    list: list,
    run: run,
    dryRun: dryRun,
    sync: sync
  };
})();


/*
 * Controlled Apps Script entry points.
 *
 * No sync-all or scheduled live trigger is intentionally exposed during
 * the initial Enterprise runtime integration increment.
 */

function REOS_COUNTY_RUNTIME_SETUP() {
  return REOS.CountyRuntimeBridge.setup();
}

function REOS_COUNTY_RUNTIME_LIST() {
  return REOS.CountyRuntimeBridge.list();
}

function REOS_COUNTY_RUNTIME_DRY_RUN(
  connectorId,
  dataset,
  limit
) {
  return REOS.CountyRuntimeBridge.dryRun(
    connectorId,
    dataset,
    {
      limit: limit
    }
  );
}

function REOS_COUNTY_RUNTIME_SYNC(
  connectorId,
  dataset,
  limit,
  cursor,
  confirmLive
) {
  return REOS.CountyRuntimeBridge.sync(
    connectorId,
    dataset,
    {
      limit: limit,
      cursor: cursor,
      confirmLive: confirmLive === true
    }
  );
}
