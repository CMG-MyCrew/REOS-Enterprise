'use strict';

const assert =
  require('assert');

const fs =
  require('fs');

const vm =
  require('vm');

const DIAGNOSTIC =
  'build/apps-script-brand/ZillowGmailConnectorStateDiagnostic.js';

const ZILLOW =
  'build/apps-script-brand/ZillowGmailConnector.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const CONTRACT =
  'docs/zillow-production-gmail-connector-state-diagnostic-contract-v1.md';

[
  DIAGNOSTIC,
  ZILLOW,
  DATABASE,
  CONTRACT
].forEach((path) => {
  assert.ok(
    fs.existsSync(path),
    `missing required file: ${path}`
  );
});

const diagnostic =
  fs.readFileSync(
    DIAGNOSTIC,
    'utf8'
  );

const zillow =
  fs.readFileSync(
    ZILLOW,
    'utf8'
  );

const database =
  fs.readFileSync(
    DATABASE,
    'utf8'
  );

const contract =
  fs.readFileSync(
    CONTRACT,
    'utf8'
  );

console.log(
  '=== ZILLOW CONNECTOR STATE DIAGNOSTIC V1 ==='
);

/*
 * Contract.
 */

assert.match(
  contract,
  /reosZillowGmailConnectorStateDiagnostic\(\)/
);

assert.match(
  contract,
  /ACQUISITION_CONNECTORS/
);

assert.match(
  contract,
  /ACQUISITION_CONNECTOR_RUNS/
);

assert.match(
  contract,
  /strictly read-only/i
);

console.log(
  'PASS: diagnostic contract present'
);

/*
 * Static diagnostic surface.
 */

assert.match(
  diagnostic,
  /function\s+reosZillowGmailConnectorStateDiagnostic\s*\(\s*\)/
);

assert.match(
  diagnostic,
  /['"]ACQUISITION_CONNECTORS['"]/
);

assert.match(
  diagnostic,
  /['"]ACQUISITION_CONNECTOR_RUNS['"]/
);

assert.match(
  diagnostic,
  /['"]zillow_gmail_leads['"]/
);

assert.match(
  diagnostic,
  /['"]reosConnectorHandleZillowGmail['"]/
);

assert.match(
  diagnostic,
  /['"]Every 15 minutes['"]/
);

const getAllCalls =
  diagnostic.match(
    /REOS\.Database\.getAll\s*\(/g
  ) || [];

assert.strictEqual(
  getAllCalls.length,
  2,
  'diagnostic must have exactly two Database.getAll call sites'
);

assert.match(
  diagnostic,
  /REOS\.ZillowGmailConnector[\s\S]*\.normalizeConfig_\s*\(/
);

[
  /\bGmailApp\b/,
  /\bScriptApp\b/,
  /\bPropertiesService\b/,
  /\bLockService\b/,
  /\bConnectorRegistry\b/,
  /\bAcquisitionConnectorManager\b/,
  /\.ensureTable\s*\(/,
  /\.ensureSheet\s*\(/,
  /\.ensureSheets\s*\(/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.appendRow\s*\(/,
  /\.deleteRow\s*\(/,
  /\.insertRow\s*\(/,
  /\.newTrigger\s*\(/,
  /\.deleteTrigger\s*\(/,
  /\.sync\s*\(/
].forEach((pattern) => {
  assert.ok(
    !pattern.test(diagnostic),
    `forbidden mutation/execution surface: ${pattern}`
  );
});

[
  'gmailExecutionAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'triggerMutationAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach((field) => {
  assert.match(
    diagnostic,
    new RegExp(
      field +
      '[\\s\\S]{0,120}false'
    ),
    `${field} must be false`
  );
});

assert.ok(
  !/defaultAssignedTo\s*:/.test(
    diagnostic
  ),
  'defaultAssignedTo value must not be returned'
);

assert.ok(
  !/['"]Details JSON['"]\s*:/.test(
    diagnostic
  ),
  'run Details JSON must not be returned'
);

assert.ok(
  !/['"]Executed By['"]\s*:/.test(
    diagnostic
  ),
  'Executed By must not be returned'
);

console.log(
  'PASS: diagnostic surface is bounded and mutation-free'
);

/*
 * Database.getAll dependency.
 */

const getAllStart =
  database.indexOf(
    'function getAll(sheetName)'
  );

const findByIdStart =
  database.indexOf(
    'function findById(',
    getAllStart
  );

assert.ok(
  getAllStart >= 0 &&
  findByIdStart > getAllStart,
  'unable to isolate Database.getAll'
);

const getAllBody =
  database.slice(
    getAllStart,
    findByIdStart
  );

assert.match(
  getAllBody,
  /getSheet\(sheetName\)/
);

assert.match(
  getAllBody,
  /\.getValues\(\)/
);

[
  /ensureTable/,
  /insertSheet/,
  /\.setValue/,
  /\.setValues/,
  /\.appendRow/,
  /\.deleteRow/,
  /\.insertRow/,
  /\.clear/
].forEach((pattern) => {
  assert.ok(
    !pattern.test(getAllBody),
    `Database.getAll write surface detected: ${pattern}`
  );
});

console.log(
  'PASS: Database.getAll is strict existing-sheet read'
);

/*
 * Zillow normalizeConfig_ dependency.
 */

const normalizeStart =
  zillow.indexOf(
    'function normalizeConfig_(config)'
  );

const detectStart =
  zillow.indexOf(
    'function detectLeadType_',
    normalizeStart
  );

assert.ok(
  normalizeStart >= 0 &&
  detectStart > normalizeStart,
  'unable to isolate normalizeConfig_'
);

const normalizeBody =
  zillow.slice(
    normalizeStart,
    detectStart
  );

[
  /GmailApp/,
  /ScriptApp/,
  /Database\./,
  /ConnectorRegistry/,
  /AcquisitionConnectorManager/,
  /PropertiesService/,
  /LockService/,
  /\.setValue/,
  /\.setValues/,
  /\.insert/
].forEach((pattern) => {
  assert.ok(
    !pattern.test(normalizeBody),
    `normalizeConfig_ is not pure: ${pattern}`
  );
});

console.log(
  'PASS: normalizeConfig_ dependency is pure'
);

/*
 * Runtime harness.
 */

function connectorRow(
  overrides = {}
) {
  return Object.assign(
    {
      'Connector ID':
        'CONN-ZILLOW',

      'Connector Key':
        'zillow_gmail_leads',

      Name:
        'Zillow Gmail Multi-Folder Leads',

      Type:
        'GMAIL',

      'Source Category':
        'Zillow Lead',

      'Handler Function':
        'reosConnectorHandleZillowGmail',

      Enabled:
        true,

      Schedule:
        'Every 15 minutes',

      Priority:
        65,

      'Config JSON':
        '{}',

      'Last Run At':
        '2026-09-17T16:00:00.000Z',

      'Last Status':
        'Complete',

      'Last Message':
        'Zillow Gmail sync completed.'
    },
    overrides
  );
}

function runRow(
  id,
  status,
  imported
) {
  return {
    'Run ID':
      id,

    'Connector Key':
      'zillow_gmail_leads',

    'Connector Name':
      'Zillow Gmail Multi-Folder Leads',

    Status:
      status,

    'Started At':
      '2026-09-17T15:59:00.000Z',

    'Completed At':
      '2026-09-17T16:00:00.000Z',

    'Duration Ms':
      60000,

    'Records Found':
      3,

    'Records Imported':
      imported,

    'Records Skipped':
      3 - imported,

    Message:
      'runtime message',

    'Details JSON':
      '{"must":"not be returned"}',

    'Executed By':
      'must-not-be-returned@example.com'
  };
}

function execute(
  registryRows,
  runRows
) {
  const reads = [];

  const context = {
    console,

    REOS: {
      Database: {
        getAll(table) {
          reads.push(table);

          if (
            table ===
            'ACQUISITION_CONNECTORS'
          ) {
            if (
              registryRows instanceof Error
            ) {
              throw registryRows;
            }

            return registryRows;
          }

          if (
            table ===
            'ACQUISITION_CONNECTOR_RUNS'
          ) {
            if (
              runRows instanceof Error
            ) {
              throw runRows;
            }

            return runRows;
          }

          throw new Error(
            'unexpected table: ' +
            table
          );
        }
      }
    }
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    zillow,
    context,
    {
      filename:
        'ZillowGmailConnector.js'
    }
  );

  vm.runInContext(
    diagnostic,
    context,
    {
      filename:
        'ZillowGmailConnectorStateDiagnostic.js'
    }
  );

  const raw =
    context
      .reosZillowGmailConnectorStateDiagnostic();

  assert.strictEqual(
    typeof raw,
    'string'
  );

  const result =
    JSON.parse(raw);

  [
    'gmailExecutionAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'triggerMutationAuthorityGranted',
    'productionDataMutationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach((field) => {
    assert.strictEqual(
      result[field],
      false,
      `${field} must remain false`
    );
  });

  return {
    result,
    reads
  };
}

/*
 * Exact enabled state + run history.
 */

{
  const outcome =
    execute(
      [
        connectorRow()
      ],
      [
        runRow(
          'CRUN-1',
          'Complete',
          1
        ),
        runRow(
          'CRUN-2',
          'Complete',
          0
        )
      ]
    );

  const result =
    outcome.result;

  assert.deepStrictEqual(
    Array.from(outcome.reads),
    [
      'ACQUISITION_CONNECTORS',
      'ACQUISITION_CONNECTOR_RUNS'
    ]
  );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.classification,
    'ZILLOW_CONNECTOR_STATE_EXACT'
  );

  assert.strictEqual(
    result.connector.enabled,
    true
  );

  assert.strictEqual(
    result.connector.nameExact,
    true
  );

  assert.strictEqual(
    result.connector.typeExact,
    true
  );

  assert.strictEqual(
    result.connector.sourceCategoryExact,
    true
  );

  assert.strictEqual(
    result.connector.handlerExact,
    true
  );

  assert.strictEqual(
    result.connector.scheduleExact,
    true
  );

  assert.strictEqual(
    result.recentRunCount,
    2
  );

  assert.strictEqual(
    result.latestRun.runId,
    'CRUN-2'
  );

  assert.strictEqual(
    result.latestRun.status,
    'Complete'
  );

  assert.ok(
    !Object.prototype.hasOwnProperty.call(
      result.latestRun,
      'Details JSON'
    )
  );

  assert.ok(
    !Object.prototype.hasOwnProperty.call(
      result.latestRun,
      'Executed By'
    )
  );

  assert.deepStrictEqual(
    Array.from(
      result.effectiveConfig.labels
    ),
    [
      'Zillow/New Leads',
      'Zillow/Buyer Leads',
      'Zillow/Seller Leads',
      'Zillow/Rental Leads'
    ]
  );

  assert.strictEqual(
    result.effectiveConfig.maxThreadsPerLabel,
    50
  );

  assert.strictEqual(
    result.effectiveConfig.lookbackDays,
    30
  );

  assert.strictEqual(
    result.effectiveConfig.runDownstreamIngestion,
    true
  );

  assert.strictEqual(
    result.effectiveConfig.autoPromote,
    false
  );

  assert.strictEqual(
    result.effectiveConfig.defaultAssignedToConfigured,
    false
  );

  console.log(
    'PASS: enabled/config/recent-run state resolved'
  );
}

/*
 * Disabled state.
 */

{
  const outcome =
    execute(
      [
        connectorRow({
          Enabled:
            'false'
        })
      ],
      []
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_STATE_EXACT'
  );

  assert.strictEqual(
    outcome.result.connector.enabled,
    false
  );

  assert.strictEqual(
    outcome.result.recentRunCount,
    0
  );

  assert.strictEqual(
    outcome.result.latestRun,
    null
  );

  console.log(
    'PASS: disabled state resolved without execution'
  );
}

/*
 * Bounded config overrides.
 */

{
  const outcome =
    execute(
      [
        connectorRow({
          'Config JSON':
            JSON.stringify({
              labels: [
                'Zillow/New Leads'
              ],

              maxThreadsPerLabel:
                7,

              lookbackDays:
                14,

              markRead:
                true,

              archiveAfterImport:
                true,

              runDownstreamIngestion:
                false,

              scoreLeads:
                false,

              autoPromote:
                true,

              defaultCity:
                'Philadelphia',

              defaultState:
                'PA',

              defaultAssignedTo:
                'must-not-be-returned'
            })
        })
      ],
      []
    );

  const config =
    outcome.result.effectiveConfig;

  assert.strictEqual(
    config.maxThreadsPerLabel,
    7
  );

  assert.strictEqual(
    config.lookbackDays,
    14
  );

  assert.strictEqual(
    config.markRead,
    true
  );

  assert.strictEqual(
    config.archiveAfterImport,
    true
  );

  assert.strictEqual(
    config.runDownstreamIngestion,
    false
  );

  assert.strictEqual(
    config.scoreLeads,
    false
  );

  assert.strictEqual(
    config.autoPromote,
    true
  );

  assert.strictEqual(
    config.defaultCity,
    'Philadelphia'
  );

  assert.strictEqual(
    config.defaultState,
    'PA'
  );

  assert.strictEqual(
    config.defaultAssignedToConfigured,
    true
  );

  assert.ok(
    !Object.prototype.hasOwnProperty.call(
      config,
      'defaultAssignedTo'
    )
  );

  console.log(
    'PASS: effective config is bounded'
  );
}

/*
 * Registry unavailable.
 */

{
  const outcome =
    execute(
      new Error(
        'Sheet not found'
      ),
      []
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_REGISTRY_UNAVAILABLE'
  );

  assert.deepStrictEqual(
    Array.from(outcome.reads),
    [
      'ACQUISITION_CONNECTORS'
    ]
  );

  console.log(
    'PASS: unavailable registry fails closed'
  );
}

/*
 * Missing row.
 */

{
  const outcome =
    execute(
      [],
      []
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_ROW_MISSING'
  );

  assert.deepStrictEqual(
    Array.from(outcome.reads),
    [
      'ACQUISITION_CONNECTORS'
    ]
  );

  console.log(
    'PASS: missing connector fails closed'
  );
}

/*
 * Duplicate rows.
 */

{
  const outcome =
    execute(
      [
        connectorRow(),
        connectorRow({
          'Connector ID':
            'CONN-ZILLOW-2'
        })
      ],
      []
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_ROW_DUPLICATED'
  );

  assert.strictEqual(
    outcome.result.matchCount,
    2
  );

  console.log(
    'PASS: duplicate connector rows fail closed'
  );
}

/*
 * Invalid Config JSON.
 */

{
  const outcome =
    execute(
      [
        connectorRow({
          'Config JSON':
            '{bad-json'
        })
      ],
      []
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_CONFIG_INVALID_JSON'
  );

  assert.strictEqual(
    outcome.result.effectiveConfig,
    null
  );

  console.log(
    'PASS: malformed Config JSON fails closed'
  );
}

/*
 * Run table unavailable.
 */

{
  const outcome =
    execute(
      [
        connectorRow()
      ],
      new Error(
        'Sheet not found'
      )
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_RUN_STATE_UNAVAILABLE'
  );

  assert.strictEqual(
    outcome.result.recentRunCount,
    null
  );

  console.log(
    'PASS: unavailable run history fails closed'
  );
}

/*
 * Metadata drift.
 */

{
  const outcome =
    execute(
      [
        connectorRow({
          Schedule:
            'Every hour'
        })
      ],
      []
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_METADATA_MISMATCH'
  );

  assert.strictEqual(
    outcome.result.connector.scheduleExact,
    false
  );

  console.log(
    'PASS: schedule drift fails closed'
  );
}

{
  const outcome =
    execute(
      [
        connectorRow({
          'Handler Function':
            'unexpectedHandler'
        })
      ],
      []
    );

  assert.strictEqual(
    outcome.result.classification,
    'ZILLOW_CONNECTOR_METADATA_MISMATCH'
  );

  assert.strictEqual(
    outcome.result.connector.handlerExact,
    false
  );

  console.log(
    'PASS: handler drift fails closed'
  );
}

console.log(
  'ZILLOW_CONNECTOR_STATE_DIAGNOSTIC_VALIDATION_PASSED=true'
);

console.log(
  'CONNECTOR_ENABLED_STATE_CAN_BE_RESOLVED=true'
);

console.log(
  'CONNECTOR_CONFIG_STATE_CAN_BE_RESOLVED=true'
);

console.log(
  'CONNECTOR_RECENT_RUN_STATE_CAN_BE_RESOLVED=true'
);

console.log(
  'STRICT_DATABASE_GETALL_CALL_SITES=2'
);

console.log(
  'GMAIL_EXECUTION_REACHABLE=false'
);

console.log(
  'CONNECTOR_EXECUTION_REACHABLE=false'
);

console.log(
  'TRIGGER_MUTATION_REACHABLE=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_REACHABLE=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
