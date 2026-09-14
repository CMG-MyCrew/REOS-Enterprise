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
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

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
  'Operation Intent Contract Version',
  'Executor Implementation Version',
  'Group Number',
  'Winner Distress Lead ID',
  'Target Delete Distress Lead ID',
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
          'COUNTY_COLLAPSE_OPERATION_INTENTS'
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
      'COUNTY_COLLAPSE_OPERATION_INTENTS',
      eventHeaders,
      state
    );

  const chunkSheet =
    makeSheet(
      'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS',
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
            assert.strictEqual(
              key,
              'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID'
            );

            return state.propertyValue;
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
        .CountyCollapseOperationIntentStore,
    state,
    lockContext,
    workbook,
    eventSheet,
    chunkSheet
  };
}

function prepare(
  harness,
  payload = {
    evidence:
      'prepared'
  }
) {
  return harness.store.prepare(
    {
      executorImplementationVersion:
        'test-executor-v1',

      groupNumber:
        17,

      winnerDistressLeadId:
        'DL-WINNER-001',

      targetDeleteDistressLeadId:
        'DL-DELETE-001',

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
    String(casesPassed).padStart(2, '0') +
    ': ' +
    name
  );
}

console.log(
  '=== COUNTY COLLAPSE OPERATION-INTENT STORE V1 OFFLINE HARNESS ==='
);

/*
 * 01
 */
test(
  'metadata is fail-closed and authority-free',
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
      'physicalDeleteAuthority',
      'countyDataMutationAuthority',
      'schedulerMutationAuthority',
      'checkpointMutationAuthority',
      'connectorExecutionAuthority',
      'automaticOfferAuthority',
      'automaticRetryPermitted',
      'rowRecreationPermitted'
    ].forEach(
      field => {
        assert.strictEqual(
          metadata[field],
          false,
          field
        );
      }
    );
  }
);

/*
 * 02
 */
test(
  'source exposes no forbidden mutation, lock-acquisition, provisioning, or RPC surface',
  () => {
    [
      'LockService',
      '.insertSheet(',
      '.deleteRow(',
      '.setValues(',
      '.setProperty(',
      '.deleteProperty(',
      'reosCountyCodeViolationCollapseExecute',
      'REOS.Database.deletePhysicalRowExact'
    ].forEach(
      token => {
        assert.ok(
          !storeSource.includes(
            token
          ),
          'Forbidden token: ' +
            token
        );
      }
    );

    [
      'MAX_EVENT_PAYLOAD_UTF8_BYTES_ =\n    1048576',
      'MAX_CHUNK_UTF8_BYTES_ =\n    16384',
      'MAX_CHUNKS_PER_EVENT_ =\n    64',
      'MAX_EVENTS_PER_OPERATION_ =\n    32',
      'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID'
    ].forEach(
      token => {
        assert.ok(
          storeSource.includes(
            token
          ),
          'Missing source contract marker: ' +
            token
        );
      }
    );

    assert.ok(
      databaseSource.includes(
        'function assertScriptLockContext('
      )
    );

    assert.ok(
      contractValidatorSource.includes(
        'Store implementation requires the certified store validator/harness.'
      )
    );
  }
);

/*
 * 03
 */
test(
  'missing configured workbook ID fails before journal writes',
  () => {
    const h =
      createHarness({
        propertyValue:
          ''
      });

    assert.throws(
      () =>
        prepare(h),
      /workbook ID is not configured/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      0
    );

    assert.strictEqual(
      h.chunkSheet.rows.length,
      0
    );
  }
);

/*
 * 04
 */
test(
  'caller cannot supply a storage workbook ID',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        h.store.prepare(
          {
            executorImplementationVersion:
              'test-executor-v1',
            groupNumber:
              17,
            winnerDistressLeadId:
              'DL-WINNER-001',
            targetDeleteDistressLeadId:
              'DL-DELETE-001',
            payload:
              {},
            workbookId:
              'CALLER-CONTROLLED'
          },
          {
            lockContext:
              h.lockContext
          }
        ),
      /missing or unknown fields/i
    );

    assert.strictEqual(
      h.state.openByIdCalls.length,
      0
    );
  }
);

/*
 * 05
 */
test(
  'storage workbook must differ from active county-data workbook',
  () => {
    const h =
      createHarness({
        activeSpreadsheetId:
          'STORE-WORKBOOK-1'
      });

    assert.throws(
      () =>
        prepare(h),
      /must be separate/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      0
    );
  }
);

/*
 * 06
 */
test(
  'storage workbook requires exactly the two certified journal sheets',
  () => {
    const missing =
      createHarness({
        omitChunkSheet:
          true
      });

    assert.throws(
      () =>
        prepare(missing),
      /exactly two journal sheets|sheet set/i
    );

    const extra =
      createHarness({
        extraSheet:
          true
      });

    assert.throws(
      () =>
        prepare(extra),
      /exactly two journal sheets/i
    );
  }
);

/*
 * 07
 */
test(
  'event manifest headers are exact',
  () => {
    const headers =
      EVENT_HEADERS.slice();

    headers[3] =
      'Wrong Timestamp Header';

    const h =
      createHarness({
        eventHeaders:
          headers
      });

    assert.throws(
      () =>
        prepare(h),
      /Event header mismatch/i
    );
  }
);

/*
 * 08
 */
test(
  'chunk headers are exact',
  () => {
    const headers =
      CHUNK_HEADERS.slice();

    headers[5] =
      'Wrong Chunk Header';

    const h =
      createHarness({
        chunkHeaders:
          headers
      });

    assert.throws(
      () =>
        prepare(h),
      /Chunk header mismatch/i
    );
  }
);

/*
 * 09
 */
test(
  'invalid caller-owned lock context fails before storage mutation',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        h.store.prepare(
          {
            executorImplementationVersion:
              'test-executor-v1',
            groupNumber:
              17,
            winnerDistressLeadId:
              'DL-WINNER-001',
            targetDeleteDistressLeadId:
              'DL-DELETE-001',
            payload:
              {}
          },
          {
            lockContext:
              {
                invalid:
                  true
              }
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

/*
 * 10
 */
test(
  'prepared intent generates internal UUID and completes flush plus full readback',
  () => {
    const h =
      createHarness();

    const result =
      prepare(h);

    assert.match(
      result.operationId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );

    assert.strictEqual(
      result.operationId,
      h.state.generatedIds[0]
    );

    assert.strictEqual(
      result.readbackVerified,
      true
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      1
    );

    assert.ok(
      h.chunkSheet.rows.length >=
      1
    );

    assert.strictEqual(
      h.state.flushCalls,
      1
    );

    assert.ok(
      h.state.openByIdCalls.length >=
      3
    );

    assert.ok(
      h.state.lockAssertions >=
      3
    );

    assert.strictEqual(
      h.eventSheet.rows[0][12],
      'GENESIS'
    );
  }
);

/*
 * 11
 */
test(
  'caller cannot supply the initial operation ID',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        h.store.prepare(
          {
            executorImplementationVersion:
              'test-executor-v1',
            groupNumber:
              17,
            winnerDistressLeadId:
              'DL-WINNER-001',
            targetDeleteDistressLeadId:
              'DL-DELETE-001',
            payload:
              {},
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

    assert.strictEqual(
      h.state.generatedIds.length,
      0
    );
  }
);

/*
 * 12
 */
test(
  'canonical payload object keys are lexicographic',
  () => {
    const h =
      createHarness();

    const result =
      prepare(
        h,
        {
          z:
            2,
          a:
            1
        }
      );

    const canonical =
      canonicalPayloadFromChunks(
        h,
        result.operationId,
        1
      );

    assert.ok(
      canonical.includes(
        '"data":{"a":1,"z":2}'
      )
    );

    assert.strictEqual(
      JSON.stringify(
        JSON.parse(
          canonical
        ).data
      ),
      '{"a":1,"z":2}'
    );
  }
);

/*
 * 13
 */
test(
  'Unicode payloads split only at UTF-8-safe chunk boundaries',
  () => {
    const h =
      createHarness();

    const text =
      '😀'.repeat(5000);

    const result =
      prepare(
        h,
        {
          text
        }
      );

    const rows =
      h.chunkSheet.rows
        .filter(
          row =>
            row[0] ===
              result.operationId
        );

    assert.ok(
      rows.length > 1
    );

    rows.forEach(
      row => {
        assert.ok(
          row[3] <= 16384
        );

        const decoded =
          Buffer
            .from(
              row[5],
              'base64'
            )
            .toString('utf8');

        assert.strictEqual(
          Buffer.byteLength(
            decoded,
            'utf8'
          ),
          row[3]
        );
      }
    );

    const payload =
      JSON.parse(
        canonicalPayloadFromChunks(
          h,
          result.operationId,
          1
        )
      );

    assert.strictEqual(
      payload.data.text,
      text
    );
  }
);

/*
 * 14
 */
test(
  'oversized event payload fails before any journal row append',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        prepare(
          h,
          {
            blob:
              'x'.repeat(
                1048576
              )
          }
        ),
      /event byte limit/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      0
    );

    assert.strictEqual(
      h.chunkSheet.rows.length,
      0
    );
  }
);

/*
 * 15
 */
test(
  'canonical serializer rejects undefined',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        prepare(
          h,
          {
            bad:
              undefined
          }
        ),
      /unsupported runtime value/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      0
    );
  }
);

/*
 * 16
 */
test(
  'canonical serializer rejects non-finite numbers',
  () => {
    const h =
      createHarness();

    assert.throws(
      () =>
        prepare(
          h,
          {
            bad:
              NaN
          }
        ),
      /non-finite/i
    );
  }
);

/*
 * 17
 */
test(
  'canonical serializer rejects sparse arrays',
  () => {
    const h =
      createHarness();

    const sparse = [];

    sparse.length = 2;
    sparse[1] =
      'present';

    assert.throws(
      () =>
        prepare(
          h,
          {
            sparse
          }
        ),
      /sparse arrays/i
    );
  }
);

/*
 * 18
 */
test(
  'canonical serializer rejects cyclic structures',
  () => {
    const h =
      createHarness();

    const cyclic = {
      value:
        'x'
    };

    cyclic.self =
      cyclic;

    assert.throws(
      () =>
        prepare(
          h,
          {
            cyclic
          }
        ),
      /cyclic structures/i
    );
  }
);

/*
 * 19
 */
test(
  'subsequent event receives exact next sequence and previous-event hash',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    const second =
      append(
        h,
        first.operationId,
        'RECONCILIATION_NOTE'
      );

    assert.strictEqual(
      second.eventSequence,
      2
    );

    assert.strictEqual(
      h.eventSheet.rows[1][12],
      h.eventSheet.rows[0][13]
    );

    const history =
      h.store.read(
        first.operationId
      );

    assert.strictEqual(
      history.events.length,
      2
    );
  }
);

/*
 * 20
 */
test(
  'delete invocation barrier cannot be duplicated',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'DELETE_INVOCATION_STARTED'
    );

    const rowsBefore =
      h.eventSheet.rows.length;

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'DELETE_INVOCATION_STARTED'
        ),
      /barrier is duplicated/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      rowsBefore
    );
  }
);

/*
 * 21
 */
test(
  'POSTDELETE_VERIFIED cannot exist before delete barrier',
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
          'POSTDELETE_VERIFIED'
        ),
      /requires exactly one prior delete barrier/i
    );
  }
);

/*
 * 22
 */
test(
  'precondition-failed terminal is forbidden after delete barrier',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'DELETE_INVOCATION_STARTED'
    );

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
        ),
      /forbidden after delete barrier/i
    );
  }
);

/*
 * 23
 */
test(
  'verified-success terminal requires post-delete verification',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'DELETE_INVOCATION_STARTED'
    );

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'COLLAPSE_DELETE_VERIFIED'
        ),
      /requires barrier and post-delete verification/i
    );
  }
);

/*
 * 24
 */
test(
  'operation event stream is bounded to 32 events',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    for (
      let index = 0;
      index < 31;
      index++
    ) {
      append(
        h,
        first.operationId,
        'RECONCILIATION_NOTE',
        {
          note:
            index
        }
      );
    }

    const history =
      h.store.read(
        first.operationId
      );

    assert.strictEqual(
      history.events.length,
      32
    );

    assert.throws(
      () =>
        append(
          h,
          first.operationId,
          'RECONCILIATION_NOTE',
          {
            note:
              32
          }
        ),
      /reached the v1 event limit/i
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      32
    );
  }
);

/*
 * 25
 */
test(
  'partial append failure is never rolled back, retried, or erased',
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
      h.state.eventAppendAttempts,
      1
    );

    assert.strictEqual(
      h.state.chunkAppendAttempts,
      1
    );

    assert.strictEqual(
      h.state.flushCalls,
      0
    );

    const operationId =
      h.state.generatedIds[0];

    const recovery =
      h.store.recover(
        operationId
      );

    assertUncertain(
      recovery
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      1
    );

    assert.strictEqual(
      h.chunkSheet.rows.length,
      0
    );
  }
);

/*
 * 26
 */
test(
  'complete prepared-barrier-postdelete-success chain recovers as journal-verified success',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'DELETE_INVOCATION_STARTED'
    );

    append(
      h,
      first.operationId,
      'POSTDELETE_VERIFIED'
    );

    append(
      h,
      first.operationId,
      'COLLAPSE_DELETE_VERIFIED'
    );

    const recovery =
      h.store.recover(
        first.operationId
      );

    assert.strictEqual(
      recovery.classification,
      'VERIFIED_SUCCESS_JOURNAL'
    );

    assert.strictEqual(
      recovery.eventCount,
      4
    );

    assert.strictEqual(
      recovery.automaticRetryPermitted,
      false
    );
  }
);

/*
 * 27
 */
test(
  'durable delete barrier without verified terminal is uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'DELETE_INVOCATION_STARTED'
    );

    const recovery =
      h.store.recover(
        first.operationId
      );

    assertUncertain(
      recovery
    );

    assert.strictEqual(
      recovery.classification,
      'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL'
    );
  }
);

/*
 * 28
 */
test(
  'prepared-only history requires separately authorized live read-only reconciliation',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    const beforeEventRows =
      h.eventSheet.rows.length;

    const beforeChunkRows =
      h.chunkSheet.rows.length;

    const recovery =
      h.store.recover(
        first.operationId
      );

    assert.strictEqual(
      recovery.classification,
      'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'
    );

    assert.strictEqual(
      recovery.automaticRetryPermitted,
      false
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      beforeEventRows
    );

    assert.strictEqual(
      h.chunkSheet.rows.length,
      beforeChunkRows
    );
  }
);

/*
 * 29
 */
test(
  'precondition-failed terminal still requires live read-only reconciliation before physical claims',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
    );

    const recovery =
      h.store.recover(
        first.operationId
      );

    assert.strictEqual(
      recovery.classification,
      'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION'
    );

    assert.strictEqual(
      recovery.automaticRetryPermitted,
      false
    );
  }
);

/*
 * 30
 */
test(
  'chunk hash corruption classifies recovery as uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    h.chunkSheet.rows[0][4] =
      '0'.repeat(64);

    const recovery =
      h.store.recover(
        first.operationId
      );

    assertUncertain(
      recovery
    );
  }
);

/*
 * 31
 */
test(
  'missing chunk classifies recovery as uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    h.chunkSheet.rows.pop();
    h.chunkSheet.formulas.pop();

    const recovery =
      h.store.recover(
        first.operationId
      );

    assertUncertain(
      recovery
    );
  }
);

/*
 * 32
 */
test(
  'duplicate event sequence classifies recovery as uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    append(
      h,
      first.operationId,
      'RECONCILIATION_NOTE'
    );

    h.eventSheet.rows.push(
      h.eventSheet.rows[1].slice()
    );

    h.eventSheet.formulas.push(
      h.eventSheet.rows[1].map(
        () => ''
      )
    );

    const recovery =
      h.store.recover(
        first.operationId
      );

    assertUncertain(
      recovery
    );
  }
);

/*
 * 33
 */
test(
  'manual formula edit in historical journal row classifies recovery as uncertain',
  () => {
    const h =
      createHarness();

    const first =
      prepare(h);

    h.eventSheet.formulas[0][0] =
      '=A1';

    const beforeEventRows =
      h.eventSheet.rows.length;

    const beforeChunkRows =
      h.chunkSheet.rows.length;

    const recovery =
      h.store.recover(
        first.operationId
      );

    assertUncertain(
      recovery
    );

    assert.strictEqual(
      h.eventSheet.rows.length,
      beforeEventRows
    );

    assert.strictEqual(
      h.chunkSheet.rows.length,
      beforeChunkRows
    );
  }
);

assert.strictEqual(
  casesPassed,
  33,
  'Offline operation-intent store case count changed.'
);

console.log(
  'OFFLINE_STORE_CASES_PASSED=' +
  casesPassed
);

console.log(
  'OPERATION_INTENT_STORE_VALIDATION_PASSED=true'
);
