#!/usr/bin/env node
'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const vm =
  require('vm');

const STORE =
  'build/apps-script-brand/CountyCollapseObservationPreservationStore.js';

const DATABASE =
  'build/apps-script-brand/Database.js';

const CONTRACT_VALIDATOR =
  'scripts/validate-county-collapse-operation-intent-contract-v1.js';

const storeSource =
  fs.readFileSync(
    STORE,
    'utf8'
  );

const databaseSource =
  fs.readFileSync(
    DATABASE,
    'utf8'
  );

const contractValidatorSource =
  fs.readFileSync(
    CONTRACT_VALIDATOR,
    'utf8'
  );

const EVENT_HEADERS = [
  'Operation ID',
  'Event Sequence',
  'Event Type',
  'Event Timestamp UTC',
  'Preservation Store Contract Version',
  'Preservation Implementation Version',
  'Group Number',
  'Winner Distress Lead ID',
  'Latest Observation Distress Lead ID',
  'Payload SHA-256',
  'Payload UTF-8 Bytes',
  'Payload Chunk Count',
  'Previous Event SHA-256',
  'Event SHA-256'
];

const CHUNK_HEADERS = [
  'Operation ID',
  'Event Sequence',
  'Chunk Index',
  'Chunk UTF-8 Bytes',
  'Chunk SHA-256',
  'Chunk Data'
];

function cloneRows(rows) {
  return rows.map(
    row => row.slice()
  );
}

function makeSheet(
  name,
  headers,
  state
) {
  return {
    name,
    headers:
      headers.slice(),
    rows: [],
    formulas: [],

    getName() {
      return this.name;
    },

    getLastColumn() {
      return this.headers.length;
    },

    getLastRow() {
      return this.rows.length + 1;
    },

    appendRow(row) {
      if (
        name ===
          'COUNTY_COLLAPSE_PRESERVATION_EVENTS'
      ) {
        state.eventAppendAttempts += 1;
      } else {
        state.chunkAppendAttempts += 1;

        if (
          state.failNextChunkAppend
        ) {
          state.failNextChunkAppend =
            false;

          throw new Error(
            'SIMULATED_CHUNK_APPEND_FAILURE'
          );
        }
      }

      this.rows.push(
        row.slice()
      );

      this.formulas.push(
        row.map(() => '')
      );
    },

    getRange(
      row,
      column,
      rowCount,
      columnCount
    ) {
      const values = [
        this.headers.slice(),
        ...cloneRows(this.rows)
      ];

      const formulas = [
        this.headers.map(() => ''),
        ...cloneRows(this.formulas)
      ];

      const sliceMatrix =
        matrix =>
          matrix
            .slice(
              row - 1,
              row - 1 + rowCount
            )
            .map(
              entry =>
                entry.slice(
                  column - 1,
                  column - 1 + columnCount
                )
            );

      return {
        getValues: () =>
          sliceMatrix(values),

        getFormulas: () =>
          sliceMatrix(formulas)
      };
    }
  };
}

function createHarness(options = {}) {
  const state = {
    propertyValue:
      Object.prototype
        .hasOwnProperty
        .call(
          options,
          'propertyValue'
        )
        ? options.propertyValue
        : 'STORE-WORKBOOK-1',

    activeSpreadsheetId:
      options.activeSpreadsheetId ||
      'COUNTY-DATA-WORKBOOK',

    operationIntentPropertyValue:
      Object.prototype
        .hasOwnProperty
        .call(
          options,
          'operationIntentPropertyValue'
        )
        ? options.operationIntentPropertyValue
        : 'OPERATION-INTENT-WORKBOOK-1',

    lockAssertions: 0,
    flushCalls: 0,
    openByIdCalls: [],
    eventAppendAttempts: 0,
    chunkAppendAttempts: 0,
    failNextChunkAppend: false,
    uuidCounter: 0,
    generatedIds: []
  };

  const eventHeaders =
    options.eventHeaders ||
    EVENT_HEADERS;

  const chunkHeaders =
    options.chunkHeaders ||
    CHUNK_HEADERS;

  const eventSheet =
    makeSheet(
      'COUNTY_COLLAPSE_PRESERVATION_EVENTS',
      eventHeaders,
      state
    );

  const chunkSheet =
    makeSheet(
      'COUNTY_COLLAPSE_PRESERVATION_CHUNKS',
      chunkHeaders,
      state
    );

  const sheets = [];

  if (!options.omitEventSheet) {
    sheets.push(
      eventSheet
    );
  }

  if (!options.omitChunkSheet) {
    sheets.push(
      chunkSheet
    );
  }

  if (options.extraSheet) {
    sheets.push(
      makeSheet(
        'UNAUTHORIZED_EXTRA_SHEET',
        ['X'],
        state
      )
    );
  }

  const workbook = {
    getId() {
      return 'STORE-WORKBOOK-1';
    },

    getSheets() {
      return sheets.slice();
    },

    getSheetByName(name) {
      return (
        sheets.find(
          sheet =>
            sheet.getName() === name
        ) ||
        null
      );
    }
  };

  const activeSpreadsheet = {
    getId() {
      return state.activeSpreadsheetId;
    }
  };

  const lockContext = {
    capability:
      'HARNESS_VALID_LOCK'
  };

  const sandbox = {
    REOS: {
      Database: {
        assertScriptLockContext(value) {
          state.lockAssertions += 1;

          if (
            value !==
            lockContext
          ) {
            throw new Error(
              'INVALID_TEST_LOCK_CONTEXT'
            );
          }

          return true;
        }
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            if (
              key ===
              'REOS_COUNTY_COLLAPSE_OBSERVATION_PRESERVATION_WORKBOOK_ID'
            ) {
              return state.propertyValue;
            }

            if (
              key ===
              'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID'
            ) {
              return state.operationIntentPropertyValue;
            }

            throw new Error(
              'UNEXPECTED_SCRIPT_PROPERTY_KEY:' +
              key
            );
          }
        };
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return activeSpreadsheet;
      },

      openById(id) {
        state.openByIdCalls.push(
          id
        );

        if (
          id !==
          'STORE-WORKBOOK-1'
        ) {
          throw new Error(
            'UNEXPECTED_WORKBOOK_ID'
          );
        }

        return workbook;
      },

      flush() {
        state.flushCalls += 1;
      }
    },

    Utilities: {
      DigestAlgorithm: {
        SHA_256:
          'SHA_256'
      },

      Charset: {
        UTF_8:
          'UTF-8'
      },

      computeDigest(
        algorithm,
        value
      ) {
        assert.strictEqual(
          algorithm,
          'SHA_256'
        );

        return Array.from(
          crypto
            .createHash('sha256')
            .update(
              String(value),
              'utf8'
            )
            .digest()
        );
      },

      base64Encode(value) {
        return Buffer
          .from(
            String(value),
            'utf8'
          )
          .toString('base64');
      },

      base64Decode(value) {
        return Array.from(
          Buffer.from(
            String(value),
            'base64'
          )
        );
      },

      newBlob(bytes) {
        return {
          getDataAsString() {
            return Buffer
              .from(
                bytes.map(
                  byte =>
                    byte < 0
                      ? byte + 256
                      : byte
                )
              )
              .toString('utf8');
          }
        };
      },

      getUuid() {
        state.uuidCounter += 1;

        const tail =
          String(
            state.uuidCounter
          )
            .padStart(
              12,
              '0'
            );

        const id =
          '00000000-0000-4000-8000-' +
          tail;

        state.generatedIds.push(
          id
        );

        return id;
      }
    },

    console
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    storeSource,
    sandbox,
    {
      filename:
        STORE
    }
  );

  return {
    store:
      sandbox
        .REOS
        .CountyCollapseObservationPreservationStore,
    state,
    lockContext,
    workbook,
    eventSheet,
    chunkSheet
  };
}

function canonicalJsonForHarness(value) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value
      ? 'true'
      : 'false';
  }

  if (typeof value === 'number') {
    assert.strictEqual(
      Number.isFinite(value),
      true
    );

    return value === 0
      ? '0'
      : JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return (
      '[' +
      value
        .map(canonicalJsonForHarness)
        .join(',') +
      ']'
    );
  }

  assert.ok(
    value &&
    typeof value === 'object'
  );

  return (
    '{' +
    Object.keys(value)
      .sort()
      .map(
        key =>
          JSON.stringify(key) +
          ':' +
          canonicalJsonForHarness(
            value[key]
          )
      )
      .join(',') +
    '}'
  );
}

function sha256Hex(value) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
}

function preparedPayload() {
  const headers = [
    'Record ID',
    'Updated At',
    'Last Seen At',
    'Connector Run ID',
    'Untouched'
  ];

  const winnerValues = [
    'DL-WINNER-001',
    '2026-09-13T12:00:00.000Z',
    '2026-09-13T12:30:00.000Z',
    'RUN-OLD',
    'UNCHANGED'
  ];

  const latestValues = [
    'DL-LATEST-001',
    '2026-09-14T18:00:00.000Z',
    '2026-09-14T18:30:00.000Z',
    'RUN-LATEST',
    'LATEST'
  ];

  const formulas = [
    '',
    '',
    '',
    '',
    ''
  ];

  const expectedPost = [
    'DL-WINNER-001',
    '2026-09-14T18:00:00.000Z',
    '2026-09-14T18:30:00.000Z',
    'RUN-LATEST',
    'UNCHANGED'
  ];

  return {
    preservationContractVersion:
      1,

    collapseAuthoritySha256:
      '1'.repeat(64),

    winnerPlanFingerprint:
      '2'.repeat(64),

    implementationDiscoverySha256:
      '3'.repeat(64),

    durableViolationKey:
      'VIOLATION-KEY-001',

    canonicalPropertyKey:
      'PROPERTY-KEY-001',

    groupMembership: [
      'DL-WINNER-001',
      'DL-LATEST-001'
    ],

    spreadsheetId:
      'COUNTY-DATA-WORKBOOK',

    sheetId:
      4242,

    headers,

    headerSha256:
      sha256Hex(
        canonicalJsonForHarness(
          headers
        )
      ),

    winnerRowNumber:
      2,

    latestObservationRowNumber:
      3,

    winnerPreimageValues:
      winnerValues,

    winnerPreimageFormulas:
      formulas.slice(),

    latestObservationValues:
      latestValues,

    latestObservationFormulas:
      formulas.slice(),

    writeMap: {
      'Updated At':
        '2026-09-14T18:00:00.000Z',

      'Last Seen At':
        '2026-09-14T18:30:00.000Z',

      'Connector Run ID':
        'RUN-LATEST'
    },

    expectedWinnerPostimageValues:
      expectedPost,

    expectedWinnerPostimageFormulas:
      formulas.slice(),

    winnerPreimageSha256:
      '4'.repeat(64),

    latestObservationPreimageSha256:
      '5'.repeat(64),

    expectedWinnerPostimageSha256:
      '6'.repeat(64)
  };
}

function verifiedReceiptPayload(
  operationId
) {
  const prepared =
    preparedPayload();

  const receipt = {
    preservationContractVersion:
      prepared.preservationContractVersion,

    preservationStoreContractVersion:
      1,

    patchPrimitiveContractVersion:
      1,

    preservationImplementationVersion:
      'test-preservation-v1',

    collapseAuthoritySha256:
      prepared.collapseAuthoritySha256,

    winnerPlanFingerprint:
      prepared.winnerPlanFingerprint,

    implementationDiscoverySha256:
      prepared.implementationDiscoverySha256,

    preservationOperationId:
      operationId,

    groupNumber:
      17,

    durableViolationKey:
      prepared.durableViolationKey,

    canonicalPropertyKey:
      prepared.canonicalPropertyKey,

    groupMembership:
      prepared.groupMembership.slice(),

    winnerDistressLeadId:
      'DL-WINNER-001',

    latestObservationDistressLeadId:
      'DL-LATEST-001',

    spreadsheetId:
      prepared.spreadsheetId,

    sheetId:
      prepared.sheetId,

    headers:
      prepared.headers.slice(),

    headerSha256:
      prepared.headerSha256,

    winnerRowNumber:
      prepared.winnerRowNumber,

    latestObservationRowNumber:
      prepared.latestObservationRowNumber,

    winnerPreimageValues:
      prepared.winnerPreimageValues.slice(),

    winnerPreimageFormulas:
      prepared.winnerPreimageFormulas.slice(),

    latestObservationValues:
      prepared.latestObservationValues.slice(),

    latestObservationFormulas:
      prepared.latestObservationFormulas.slice(),

    writeMap:
      Object.assign(
        {},
        prepared.writeMap
      ),

    verifiedWinnerPostimageValues:
      prepared.expectedWinnerPostimageValues.slice(),

    verifiedWinnerPostimageFormulas:
      prepared.expectedWinnerPostimageFormulas.slice(),

    winnerPreimageSha256:
      prepared.winnerPreimageSha256,

    latestObservationPreimageSha256:
      prepared.latestObservationPreimageSha256,

    winnerPostimageSha256:
      prepared.expectedWinnerPostimageSha256,

    receiptTimestampUtc:
      '2026-09-14T20:00:00.000Z'
  };

  receipt.receiptSha256 =
    sha256Hex(
      canonicalJsonForHarness(
        receipt
      )
    );

  return receipt;
}

function prepare(
  harness,
  payload = preparedPayload()
) {
  return harness.store.prepare(
    {
      preservationImplementationVersion:
        'test-preservation-v1',

      groupNumber:
        17,

      winnerDistressLeadId:
        'DL-WINNER-001',

      latestObservationDistressLeadId:
        'DL-LATEST-001',

      payload
    },
    {
      lockContext:
        harness.lockContext
    }
  );
}

function append(
  harness,
  operationId,
  eventType,
  payload = {
    evidence:
      eventType
  }
) {
  return harness.store.append(
    {
      operationId,
      eventType,
      payload
    },
    {
      lockContext:
        harness.lockContext
    }
  );
}

function canonicalPayloadFromChunks(
  harness,
  operationId,
  sequence
) {
  return harness.chunkSheet.rows
    .filter(
      row =>
        row[0] === operationId &&
        row[1] === sequence
    )
    .map(
      row =>
        Buffer
          .from(
            row[5],
            'base64'
          )
          .toString('utf8')
    )
    .join('');
}

function assertUncertain(result) {
  assert.ok(
    /^UNCERTAIN_/.test(
      result.classification
    ),
    'Expected uncertain recovery classification, got ' +
      result.classification
  );

  assert.strictEqual(
    result.automaticRetryPermitted,
    false
  );

  assert.strictEqual(
    result.rowRecreationPermitted,
    false
  );

  assert.strictEqual(
    result.journalMutationExecuted,
    false
  );
}


let casesPassed = 0;

function test(
  name,
  work
) {
  work();

  casesPassed += 1;

  console.log(
    'PASS CASE ' +
    String(casesPassed)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

console.log(
  '=== COUNTY COLLAPSE OBSERVATION-PRESERVATION STORE V1 OFFLINE HARNESS ==='
);

test(
  'metadata remains authority-free',
  () => {
    const h =
      createHarness();

    const metadata =
      h.store.metadata();

    assert.strictEqual(
      metadata.version,
      1
    );

    [
      'nestedLockAcquisition',
      'lockReleaseAuthority',
      'workbookProvisioningAuthority',
      'historicalUpdateAuthority',
      'historicalDeleteAuthority',
      'purgeAuthority',
      'preservationMutationAuthority',
      'durableReceiptProvisioningAuthority',
      'observationPreservationOrchestrationAuthority',
      'automaticPatchRetryPermitted',
      'verifiedReceiptGrantsPhysicalDeleteAuthority',
      'physicalDeleteAuthority',
      'countyDataMutationAuthority',
      'schedulerMutationAuthority',
      'checkpointMutationAuthority',
      'connectorExecutionAuthority',
      'automaticOfferAuthority',
      'automaticRetryPermitted',
      'rowRecreationPermitted'
    ].forEach(
      field =>
        assert.strictEqual(
          metadata[field],
          false,
          field
        )
    );
  }
);

test(
  'source has no forbidden mutation/provisioning/RPC surface',
  () => {
    [
      'LockService',
      '.insertSheet(',
      '.deleteSheet(',
      '.deleteRow(',
      '.deleteRows(',
      '.setValues(',
      '.clear(',
      '.setProperty(',
      '.deleteProperty(',
      'REOS.Database.patchPhysicalRowCellsExact',
      'REOS.Database.deletePhysicalRowExact',
      'ScriptApp.newTrigger',
      'reosCountyCodeViolationCollapseObservationPreserv'
    ].forEach(
      token =>
        assert.ok(
          !storeSource.includes(
            token
          ),
          token
        )
    );

    assert.strictEqual(
      (
        storeSource.match(
          /\.appendRow\s*\(/g
        ) || []
      ).length,
      2
    );
  }
);

test(
  'missing configured preservation workbook fails before append',
  () => {
    const h =
      createHarness({
        propertyValue:
          ''
      });

    assert.throws(
      () => prepare(h),
      /workbook ID is not configured/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      0
    );
  }
);

test(
  'preservation workbook differs from active county workbook',
  () => {
    const h =
      createHarness({
        activeSpreadsheetId:
          'STORE-WORKBOOK-1'
      });

    assert.throws(
      () => prepare(h),
      /separate from the active/i
    );
  }
);

test(
  'preservation workbook differs from deletion-intent workbook',
  () => {
    const h =
      createHarness({
        operationIntentPropertyValue:
          'STORE-WORKBOOK-1'
      });

    assert.throws(
      () => prepare(h),
      /different from the operation-intent workbook/i
    );
  }
);

test(
  'workbook requires exactly two certified sheets',
  () => {
    assert.throws(
      () =>
        prepare(
          createHarness({
            omitChunkSheet:
              true
          })
        ),
      /exactly two journal sheets|sheet set/i
    );

    assert.throws(
      () =>
        prepare(
          createHarness({
            extraSheet:
              true
          })
        ),
      /exactly two journal sheets/i
    );
  }
);

test(
  'caller-owned lock is mandatory',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        h.store.prepare(
          {
            preservationImplementationVersion:
              'test-preservation-v1',
            groupNumber:
              17,
            winnerDistressLeadId:
              'DL-WINNER-001',
            latestObservationDistressLeadId:
              'DL-LATEST-001',
            payload:
              preparedPayload()
          },
          {
            lockContext: {}
          }
        ),
      /INVALID_TEST_LOCK_CONTEXT/
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      0
    );
  }
);

test(
  'prepared event generates internal UUID and durable readback',
  () => {
    const h =
      createHarness();

    const result =
      prepare(h);

    assert.strictEqual(
      result.operationId,
      h.state.generatedIds[0]
    );

    assert.strictEqual(
      result.eventType,
      'PRESERVATION_PREPARED'
    );

    assert.strictEqual(
      result.readbackVerified,
      true
    );

    assert.strictEqual(
      h.state.flushCalls,
      1
    );

    assert.strictEqual(
      h.eventSheet.rows[0][12],
      'GENESIS'
    );
  }
);

test(
  'caller cannot supply initial operation ID',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        h.store.prepare(
          {
            preservationImplementationVersion:
              'test-preservation-v1',
            groupNumber:
              17,
            winnerDistressLeadId:
              'DL-WINNER-001',
            latestObservationDistressLeadId:
              'DL-LATEST-001',
            payload:
              preparedPayload(),
            operationId:
              'CALLER-ID'
          },
          {
            lockContext:
              h.lockContext
          }
        ),
      /missing or unknown fields/i
    );
  }
);

test(
  'group authority is limited to groups 17 through 22',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        h.store.prepare(
          {
            preservationImplementationVersion:
              'test-preservation-v1',
            groupNumber:
              16,
            winnerDistressLeadId:
              'DL-WINNER-001',
            latestObservationDistressLeadId:
              'DL-LATEST-001',
            payload:
              preparedPayload()
          },
          {
            lockContext:
              h.lockContext
          }
        ),
      /17-22/
    );
  }
);

test(
  'prepared payload requires complete durable bindings',
  () => {
    const h =
      createHarness();

    const payload =
      preparedPayload();

    delete payload
      .durableViolationKey;

    assert.throws(
      () =>
        prepare(
          h,
          payload
        ),
      /missing required field/i
    );
  }
);

test(
  'write map is exactly the three preservation fields',
  () => {
    const h =
      createHarness();

    const payload =
      preparedPayload();

    payload.writeMap.Extra =
      'NO';

    assert.throws(
      () =>
        prepare(
          h,
          payload
        ),
      /missing or unknown fields/i
    );
  }
);

test(
  'canonical JSON representation is deterministic',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    const canonical =
      canonicalPayloadFromChunks(
        h,
        first.operationId,
        1
      );

    assert.strictEqual(
      canonical,
      canonicalJsonForHarness(
        JSON.parse(
          canonical
        )
      )
    );
  }
);

test(
  'UTF-8 chunking does not split Unicode incorrectly',
  () => {
    const h =
      createHarness();

    const payload =
      preparedPayload();

    payload.note =
      '😀'.repeat(5000);

    const first =
      prepare(
        h,
        payload
      );

    const rows =
      h.chunkSheet.rows
        .filter(
          row =>
            row[0] ===
            first.operationId
        );

    assert.ok(
      rows.length > 1
    );

    rows.forEach(
      row => {
        const decoded =
          Buffer
            .from(
              row[5],
              'base64'
            )
            .toString(
              'utf8'
            );

        assert.ok(
          row[3] <=
          16384
        );

        assert.strictEqual(
          Buffer.byteLength(
            decoded,
            'utf8'
          ),
          row[3]
        );
      }
    );
  }
);

test(
  'oversized payload fails before append',
  () => {
    const h =
      createHarness();

    const payload =
      preparedPayload();

    payload.blob =
      'x'.repeat(
        1048576
      );

    assert.throws(
      () =>
        prepare(
          h,
          payload
        ),
      /event byte limit/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      0
    );
  }
);

test(
  'patch barrier gets next sequence and prior-event hash',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    const barrier =
      append(
        h,
        first.operationId,
        'PATCH_INVOCATION_STARTED',
        {
          barrier:
            true
        }
      );

    assert.strictEqual(
      barrier.eventSequence,
      2
    );

    assert.strictEqual(
      h.eventSheet.rows[1][12],
      h.eventSheet.rows[0][13]
    );
  }
);

test(
  'patch barrier cannot be duplicated',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PATCH_INVOCATION_STARTED'
    );

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'PATCH_INVOCATION_STARTED'
        ),
      /barrier is duplicated/i
    );
  }
);

test(
  'verified receipt cannot precede patch barrier',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'PRESERVATION_RECEIPT_VERIFIED',
          verifiedReceiptPayload(
            first.operationId
          )
        ),
      /requires exactly one prior patch barrier/i
    );
  }
);

test(
  'precondition terminal cannot follow patch barrier',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PATCH_INVOCATION_STARTED'
    );

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'PRESERVATION_PRECONDITION_FAILED',
          {
            reason:
              'late'
          }
        ),
      /forbidden after patch barrier/i
    );
  }
);

test(
  'uncertain terminal requires patch barrier',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'PRESERVATION_OUTCOME_UNCERTAIN',
          {
            reason:
              'no barrier'
          }
        ),
      /requires a prior patch barrier/i
    );
  }
);

test(
  'verified receipt chain recovers as verified preservation receipt',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PATCH_INVOCATION_STARTED'
    );

    append(
      h,
      first.operationId,
      'PRESERVATION_RECEIPT_VERIFIED',
      verifiedReceiptPayload(
        first.operationId
      )
    );

    const recovery =
      h.store.recover(
        first.operationId
      );

    assert.strictEqual(
      recovery.classification,
      'VERIFIED_PRESERVATION_RECEIPT'
    );

    assert.strictEqual(
      recovery.automaticDeletePermitted,
      false
    );

    assert.strictEqual(
      recovery.automaticPatchRetryPermitted,
      false
    );
  }
);

test(
  'prepared-only recovery requires live read-only reconciliation',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    const recovery =
      h.store.recover(
        first.operationId
      );

    assert.strictEqual(
      recovery.classification,
      'NO_PATCH_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'
    );
  }
);

test(
  'durable patch barrier without receipt is uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PATCH_INVOCATION_STARTED'
    );

    const recovery =
      h.store.recover(
        first.operationId
      );

    assert.strictEqual(
      recovery.classification,
      'UNCERTAIN_PATCH_BARRIER_OR_TERMINAL'
    );

    assertUncertain(
      recovery
    );
  }
);

test(
  'precondition terminal requires live reconciliation',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PRESERVATION_PRECONDITION_FAILED',
      {
        reason:
          'precondition'
      }
    );

    assert.strictEqual(
      h.store
        .recover(
          first.operationId
        )
        .classification,
      'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'
    );
  }
);

test(
  'outcome-uncertain terminal remains uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PATCH_INVOCATION_STARTED'
    );

    append(
      h,
      first.operationId,
      'PRESERVATION_OUTCOME_UNCERTAIN',
      {
        reason:
          'uncertain'
      }
    );

    assert.strictEqual(
      h.store
        .recover(
          first.operationId
        )
        .classification,
      'UNCERTAIN_PATCH_BARRIER_OR_TERMINAL'
    );
  }
);

test(
  'partial append is never rolled back or retried',
  () => {
    const h =
      createHarness();

    h.state.failNextChunkAppend =
      true;

    assert.throws(
      () =>
        prepare(h),
      /SIMULATED_CHUNK_APPEND_FAILURE/
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      1
    );

    assert.strictEqual(
      h.chunkSheet.rows.length,
      0
    );

    assert.strictEqual(
      h.state.flushCalls,
      0
    );

    assertUncertain(
      h.store.recover(
        h.state.generatedIds[0]
      )
    );
  }
);

test(
  'chunk hash corruption classifies storage uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    h.chunkSheet.rows[0][4] =
      '0'.repeat(64);

    assert.strictEqual(
      h.store
        .recover(
          first.operationId
        )
        .classification,
      'UNCERTAIN_STORAGE_INVALID'
    );
  }
);

test(
  'missing chunk classifies storage uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    h.chunkSheet.rows.pop();
    h.chunkSheet.formulas.pop();

    assert.strictEqual(
      h.store
        .recover(
          first.operationId
        )
        .classification,
      'UNCERTAIN_STORAGE_INVALID'
    );
  }
);

test(
  'historical formula edit is uncertain and read-only',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    h.eventSheet.formulas[0][0] =
      '=A1';

    const eventsBefore =
      h.eventSheet.rows.length;

    const chunksBefore =
      h.chunkSheet.rows.length;

    const recovery =
      h.store.recover(
        first.operationId
      );

    assert.strictEqual(
      recovery.classification,
      'UNCERTAIN_STORAGE_INVALID'
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      eventsBefore
    );

    assert.strictEqual(
      h.chunkSheet.rows.length,
      chunksBefore
    );
  }
);

test(
  'verified receipt cannot drift prepared identity bindings',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PATCH_INVOCATION_STARTED'
    );

    const receipt =
      verifiedReceiptPayload(
        first.operationId
      );

    receipt.canonicalPropertyKey =
      'DIFFERENT-PROPERTY';

    const material =
      Object.fromEntries(
        Object.entries(receipt)
          .filter(
            ([key]) =>
              key !==
              'receiptSha256'
          )
      );

    receipt.receiptSha256 =
      sha256Hex(
        canonicalJsonForHarness(
          material
        )
      );

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'PRESERVATION_RECEIPT_VERIFIED',
          receipt
        ),
      /changed prepared binding/i
    );
  }
);

test(
  'verified receipt SHA must match canonical receipt material',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'PATCH_INVOCATION_STARTED'
    );

    const receipt =
      verifiedReceiptPayload(
        first.operationId
      );

    receipt.receiptSha256 =
      'f'.repeat(64);

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'PRESERVATION_RECEIPT_VERIFIED',
          receipt
        ),
      /receipt SHA-256 mismatch/i
    );
  }
);

assert.strictEqual(
  casesPassed,
  31,
  'Offline preservation-store case count changed.'
);

console.log(
  'PRESERVATION_STORE_OFFLINE_CASES_PASSED=' +
  casesPassed
);

console.log(
  'PRESERVATION_STORE_RECOVERY_READ_ONLY=PASS'
);

console.log(
  'PRESERVATION_STORE_VALIDATION_PASSED=true'
);
