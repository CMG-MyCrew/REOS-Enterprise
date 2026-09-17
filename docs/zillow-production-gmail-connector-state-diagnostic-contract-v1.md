# Zillow Production Gmail Connector State Diagnostic Contract v1

## Purpose

Provide a strictly read-only production inspection surface for the Zillow
Gmail connector without using ConnectorRegistry.list(),
AcquisitionConnectorManager.list(), health(), recentRuns(), or any ensure path.

Public entrypoint:

`reosZillowGmailConnectorStateDiagnostic()`

The function accepts no arguments.

## Authorized reads

Exactly two logical table reads are authorized:

1. `ACQUISITION_CONNECTORS`
2. `ACQUISITION_CONNECTOR_RUNS`

Both reads must use `REOS.Database.getAll()`.

`Database.getAll()` resolves an existing sheet through `getSheet()` and may
read values. It must not create a missing sheet.

The diagnostic may also call the existing pure:

`REOS.ZillowGmailConnector.normalizeConfig_()`

to derive the effective configuration that connector execution would use.

## Forbidden surfaces

The diagnostic must not call or reference execution through:

- ConnectorRegistry
- AcquisitionConnectorManager
- ensureTable / ensureSheet / ensureSheets
- GmailApp
- ScriptApp
- PropertiesService
- LockService
- connector sync
- connector run
- trigger install/remove
- Database insert/update/upsert/delete
- spreadsheet value writes

Missing tables or malformed state must fail closed and must never be repaired
by this reader.

## Connector authority

Authorized connector key:

`zillow_gmail_leads`

Expected operational metadata:

- Name: `Zillow Gmail Multi-Folder Leads`
- Type: `GMAIL`
- Source Category: `Zillow Lead`
- Handler Function: `reosConnectorHandleZillowGmail`
- Schedule: `Every 15 minutes`

Exactly one connector row is required.

## Effective configuration

Raw Config JSON must not be returned.

The reader may return only the bounded effective configuration:

- labels
- importedLabel
- errorLabel
- maxThreadsPerLabel
- lookbackDays
- markRead
- archiveAfterImport
- runDownstreamIngestion
- scoreLeads
- autoPromote
- defaultCity
- defaultState
- defaultAssignedToConfigured

The actual `defaultAssignedTo` value must not be returned.

## Recent-run state

Rows from `ACQUISITION_CONNECTOR_RUNS` must be filtered to connector key
`zillow_gmail_leads`.

The diagnostic may report:

- matching run count
- latest Run ID
- latest Status
- latest Started At
- latest Completed At
- latest Duration Ms
- latest Records Found
- latest Records Imported
- latest Records Skipped
- latest Message

`Details JSON` and `Executed By` must not be returned.

The latest matching row is the last matching physical table record returned by
`Database.getAll()`, consistent with the existing connector manager's
reverse-row recent-run semantics.

## Classifications

Possible classifications include:

- `ZILLOW_CONNECTOR_STATE_EXACT`
- `ZILLOW_CONNECTOR_REGISTRY_UNAVAILABLE`
- `ZILLOW_CONNECTOR_RUN_STATE_UNAVAILABLE`
- `ZILLOW_CONNECTOR_ROW_MISSING`
- `ZILLOW_CONNECTOR_ROW_DUPLICATED`
- `ZILLOW_CONNECTOR_CONFIG_INVALID_JSON`
- `ZILLOW_CONNECTOR_METADATA_MISMATCH`

An exact state classification is evidence only. It grants no trigger-install,
Gmail, connector-run, production-mutation, or offer authority.

## Authority denial

Every returned result must explicitly set to false:

- gmailExecutionAuthorityGranted
- connectorExecutionAuthorityGranted
- triggerMutationAuthorityGranted
- productionDataMutationAuthorityGranted
- automaticOfferAuthorityGranted
