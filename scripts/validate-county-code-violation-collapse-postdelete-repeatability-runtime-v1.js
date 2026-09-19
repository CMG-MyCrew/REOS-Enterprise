#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const INTENT =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const IMMUTABLE =
  'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js';

const DIRECT =
  'build/apps-script-brand/CountyCodeViolationCollapseDirectKeepExecutionAuthority.js';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const intentSource =
  fs.readFileSync(
    INTENT,
    'utf8'
  );

const immutableSource =
  fs.readFileSync(
    IMMUTABLE,
    'utf8'
  );

const directSource =
  fs.readFileSync(
    DIRECT,
    'utf8'
  );

const residualSource =
  fs.readFileSync(
    RESIDUAL,
    'utf8'
  );

const preflightSource =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

function plain(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

let cases = 0;

function test(name, work) {
  work();
  cases += 1;

  console.log(
    'PASS ' +
    String(cases)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

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

function makeSheet(
  name,
  headers,
  rows,
  formulas,
  state
) {
  rows =
    rows || [];

  formulas =
    formulas ||
    rows.map(
      row =>
        row.map(() => '')
    );

  return {
    getName() {
      return name;
    },

    getLastColumn() {
      return headers.length;
    },

    getLastRow() {
      return rows.length + 1;
    },

    appendRow() {
      state.appendCalls += 1;
      throw new Error(
        'READ_ONLY_ENUMERATION_ATTEMPTED_APPEND'
      );
    },

    getRange(
      row,
      column,
      rowCount,
      columnCount
    ) {
      const values = [
        headers.slice(),
        ...rows.map(
          entry =>
            entry.slice()
        )
      ];

      const formulaMatrix = [
        headers.map(() => ''),
        ...formulas.map(
          entry =>
            entry.slice()
        )
      ];

      function slice(matrix) {
        return matrix
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
      }

      return {
        getValues() {
          return slice(values);
        },

        getFormulas() {
          return slice(
            formulaMatrix
          );
        }
      };
    }
  };
}

function intentEnumerationHarness(
  eventRows,
  chunkRows,
  eventFormulas,
  chunkFormulas
) {
  const state = {
    appendCalls: 0,
    flushCalls: 0
  };

  const eventSheet =
    makeSheet(
      'COUNTY_COLLAPSE_OPERATION_INTENTS',
      EVENT_HEADERS,
      eventRows || [],
      eventFormulas,
      state
    );

  const chunkSheet =
    makeSheet(
      'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS',
      CHUNK_HEADERS,
      chunkRows || [],
      chunkFormulas,
      state
    );

  const sheets = [
    eventSheet,
    chunkSheet
  ];

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
        ) || null
      );
    }
  };

  const sandbox = {
    REOS: {},

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            assert.strictEqual(
              key,
              'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID'
            );

            return 'STORE-WORKBOOK-1';
          }
        };
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return {
          getId() {
            return 'COUNTY-DATA-WORKBOOK';
          }
        };
      },

      openById(id) {
        assert.strictEqual(
          id,
          'STORE-WORKBOOK-1'
        );

        return workbook;
      },

      flush() {
        state.flushCalls += 1;
      }
    },

    console
  };

  vm.createContext(sandbox);

  vm.runInContext(
    intentSource,
    sandbox,
    {
      filename: INTENT
    }
  );

  return {
    store:
      sandbox
        .REOS
        .CountyCollapseOperationIntentStore,
    state
  };
}

function row(
  width,
  operationId
) {
  const value =
    new Array(width)
      .fill('');

  value[0] =
    operationId;

  return value;
}

test(
  'intent store public API adds exactly read-only listOperationIds',
  () => {
    const h =
      intentEnumerationHarness(
        [],
        []
      );

    assert.deepStrictEqual(
      plain(
        Object.keys(h.store)
          .sort()
      ),
      [
        'append',
        'listOperationIds',
        'metadata',
        'prepare',
        'read',
        'recover'
      ]
    );
  }
);

test(
  'empty journal enumerates no operation IDs and performs no writes',
  () => {
    const h =
      intentEnumerationHarness(
        [],
        []
      );

    assert.deepStrictEqual(
      plain(
        h.store
          .listOperationIds()
      ),
      []
    );

    assert.strictEqual(
      h.state.appendCalls,
      0
    );

    assert.strictEqual(
      h.state.flushCalls,
      0
    );
  }
);

test(
  'operation enumeration is deterministic unique union of event and chunk IDs',
  () => {
    const h =
      intentEnumerationHarness(
        [
          row(
            EVENT_HEADERS.length,
            'OP-B'
          ),
          row(
            EVENT_HEADERS.length,
            'OP-A'
          ),
          row(
            EVENT_HEADERS.length,
            'OP-B'
          )
        ],
        [
          row(
            CHUNK_HEADERS.length,
            'OP-C'
          ),
          row(
            CHUNK_HEADERS.length,
            'OP-A'
          )
        ]
      );

    assert.deepStrictEqual(
      plain(
        h.store
          .listOperationIds()
      ),
      [
        'OP-A',
        'OP-B',
        'OP-C'
      ]
    );

    assert.strictEqual(
      h.state.appendCalls,
      0
    );

    assert.strictEqual(
      h.state.flushCalls,
      0
    );
  }
);

test(
  'operation enumeration rejects formulas in historical journal rows',
  () => {
    const eventRow =
      row(
        EVENT_HEADERS.length,
        'OP-A'
      );

    const formulaRow =
      eventRow.map(() => '');

    formulaRow[1] =
      '=1+1';

    const h =
      intentEnumerationHarness(
        [eventRow],
        [],
        [formulaRow]
      );

    assert.throws(
      () =>
        h.store
          .listOperationIds(),
      /historical row contains a formula/i
    );
  }
);

const authoritySandbox = {
  console
};

vm.createContext(
  authoritySandbox
);

vm.runInContext(
  immutableSource,
  authoritySandbox,
  {
    filename: IMMUTABLE
  }
);

vm.runInContext(
  directSource,
  authoritySandbox,
  {
    filename: DIRECT
  }
);

const immutable =
  authoritySandbox
    .REOS
    .CountyCodeViolationCollapseOnlyEvidenceAuthority;

const direct =
  authoritySandbox
    .REOS
    .CountyCodeViolationCollapseDirectKeepExecutionAuthority;

test(
  'direct-keep authority has exact immutable group boundary and fingerprint',
  () => {
    const metadata =
      plain(
        direct.metadata()
      );

    assert.strictEqual(
      metadata.authoritySha256,
      '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7'
    );

    assert.strictEqual(
      metadata.winnerPlanFingerprintSha256,
      '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce'
    );

    assert.deepStrictEqual(
      metadata.directKeepGroups,
      [
        2, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16
      ]
    );

    assert.strictEqual(
      metadata.directKeepGroupCount,
      14
    );

    assert.strictEqual(
      metadata.directKeepDeleteCandidateCount,
      16
    );
  }
);

test(
  'direct-keep winners equal lowest historically certified row without exporting row authority',
  () => {
    const records =
      plain(
        immutable.records()
      );

    const catalog =
      plain(
        direct.catalog()
      );

    catalog.forEach(group => {
      const members =
        records
          .filter(
            record =>
              Number(
                record.groupNumber
              ) ===
              group.groupNumber
          )
          .sort(
            (a, b) =>
              Number(a.rowNumber) -
              Number(b.rowNumber)
          );

      assert.strictEqual(
        group.winnerDistressLeadId,
        members[0].distressLeadId
      );

      assert.deepStrictEqual(
        group.deleteCandidateDistressLeadIds,
        members
          .slice(1)
          .map(
            member =>
              member.distressLeadId
          )
      );

      assert.strictEqual(
        Object.prototype
          .hasOwnProperty
          .call(
            group,
            'rowNumber'
          ),
        false
      );
    });
  }
);

vm.runInContext(
  residualSource,
  authoritySandbox,
  {
    filename: RESIDUAL
  }
);

const records =
  plain(
    immutable.records()
  );

const catalog =
  plain(
    direct.catalog()
  );

const requiredHeaders = [
  'Distress Lead ID',
  'Source',
  'Source Dataset',
  'Source Record ID',
  'Violation Number',
  'Canonical Property Key',
  'Source Observation Key',
  'Source Record Key',
  'Parcel ID'
];

function liveRowFromRecord(
  record,
  rowNumber
) {
  return {
    'Distress Lead ID':
      record.distressLeadId,
    'Source':
      'PA-PHILADELPHIA',
    'Source Dataset':
      'code_violations',
    'Source Record ID':
      record.sourceRecordId,
    'Violation Number':
      record.violationNumber,
    'Canonical Property Key':
      record.canonicalPropertyKey,
    'Source Observation Key':
      record.legacyObservationKey,
    'Source Record Key':
      record.legacyObservationKey,
    'Parcel ID':
      record.parcelId,
    _rowNumber:
      rowNumber
  };
}

let liveRows = [];

function resetRows() {
  liveRows =
    records.map(
      (record, index) =>
        liveRowFromRecord(
          record,
          5000 + index
        )
    );
}

let operations = {};

function resetOperations() {
  operations = {};
}

function verifiedOperation(
  operationId,
  groupNumber,
  winnerId,
  targetId
) {
  const terminalHash =
    'a'.repeat(64);

  operations[operationId] = {
    history: {
      found:
        true,
      operationId,
      identity: {
        executorImplementationVersion:
          'future-executor-v1',
        groupNumber,
        winnerDistressLeadId:
          winnerId,
        targetDeleteDistressLeadId:
          targetId
      },
      events: [
        {
          manifest: {
            eventType:
              'INTENT_PREPARED',
            eventSha256:
              '1'.repeat(64)
          }
        },
        {
          manifest: {
            eventType:
              'DELETE_INVOCATION_STARTED',
            eventSha256:
              '2'.repeat(64)
          }
        },
        {
          manifest: {
            eventType:
              'POSTDELETE_VERIFIED',
            eventSha256:
              '3'.repeat(64)
          }
        },
        {
          manifest: {
            eventType:
              'COLLAPSE_DELETE_VERIFIED',
            eventSha256:
              terminalHash
          }
        }
      ]
    },

    recovery: {
      operationId,
      found:
        true,
      classification:
        'VERIFIED_SUCCESS_JOURNAL',
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false,
      journalMutationExecuted:
        false,
      eventCount:
        4,
      terminalEventSha256:
        terminalHash
    }
  };
}

function uncertainOperation(
  operationId,
  groupNumber,
  winnerId,
  targetId
) {
  operations[operationId] = {
    history: {
      found:
        true,
      operationId,
      identity: {
        executorImplementationVersion:
          'future-executor-v1',
        groupNumber,
        winnerDistressLeadId:
          winnerId,
        targetDeleteDistressLeadId:
          targetId
      },
      events: [
        {
          manifest: {
            eventType:
              'INTENT_PREPARED',
            eventSha256:
              '1'.repeat(64)
          }
        },
        {
          manifest: {
            eventType:
              'DELETE_INVOCATION_STARTED',
            eventSha256:
              '2'.repeat(64)
          }
        }
      ]
    },

    recovery: {
      operationId,
      found:
        true,
      classification:
        'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL',
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false,
      journalMutationExecuted:
        false,
      eventCount:
        2
    }
  };
}

authoritySandbox.REOS.Security = {
  requireAdmin() {
    return true;
  }
};

authoritySandbox.REOS.Database = {
  getHeaders() {
    return requiredHeaders.slice();
  },

  getAll() {
    return liveRows.map(
      row =>
        Object.assign(
          {},
          row
        )
    );
  }
};

authoritySandbox.REOS.CanonicalPropertyIdentity = {
  resolve(row) {
    return {
      canonicalPropertyKey:
        row[
          'Canonical Property Key'
        ],
      sourceObservationKey:
        row[
          'Source Observation Key'
        ]
    };
  }
};

authoritySandbox.REOS.CountyCollapseOperationIntentStore = {
  listOperationIds() {
    return Object.keys(
      operations
    ).sort();
  },

  read(operationId) {
    if (!operations[operationId]) {
      return {
        found:
          false,
        operationId,
        events:
          []
      };
    }

    return operations[
      operationId
    ].history;
  },

  recover(operationId) {
    return operations[
      operationId
    ].recovery;
  }
};

const residual =
  authoritySandbox
    .REOS
    .CountyCodeViolationCollapseResidualEvidence;

const firstDirect =
  catalog[0];

const firstCandidate =
  firstDirect
    .deleteCandidateDistressLeadIds[0];

test(
  'baseline residual evidence accepts arbitrary current row shifts',
  () => {
    resetRows();
    resetOperations();

    const result =
      plain(
        residual.read({})
      );

    assert.strictEqual(
      result.currentCertifiedRowCount,
      44
    );

    assert.strictEqual(
      result.verifiedDeletedCount,
      0
    );

    assert.strictEqual(
      result.remainingDirectKeepDeleteCandidateCount,
      16
    );

    assert.strictEqual(
      result.executionBlocked,
      false
    );

    assert.ok(
      result.currentRows.every(
        (entry, index) =>
          entry.currentRowNumber ===
            5000 + index
      )
    );
  }
);

test(
  'missing authorized direct-keep candidate requires exact verified journal',
  () => {
    resetRows();
    resetOperations();

    liveRows =
      liveRows.filter(
        row =>
          row[
            'Distress Lead ID'
          ] !==
          firstCandidate
      );

    verifiedOperation(
      'OP-VERIFIED-1',
      firstDirect.groupNumber,
      firstDirect.winnerDistressLeadId,
      firstCandidate
    );

    const result =
      plain(
        residual.read({})
      );

    assert.strictEqual(
      result.currentCertifiedRowCount,
      43
    );

    assert.strictEqual(
      result.verifiedDeletedCount,
      1
    );

    assert.strictEqual(
      result.remainingDirectKeepDeleteCandidateCount,
      15
    );

    assert.strictEqual(
      result.verifiedDeletes[0]
        .targetDeleteDistressLeadId,
      firstCandidate
    );
  }
);

test(
  'missing certified candidate without verified journal fails closed',
  () => {
    resetRows();
    resetOperations();

    liveRows =
      liveRows.filter(
        row =>
          row[
            'Distress Lead ID'
          ] !==
          firstCandidate
      );

    assert.throws(
      () =>
        residual.read({}),
      /lacks verified direct-keep delete journal/i
    );
  }
);

test(
  'verified-deleted certified ID reappearance fails closed',
  () => {
    resetRows();
    resetOperations();

    verifiedOperation(
      'OP-VERIFIED-1',
      firstDirect.groupNumber,
      firstDirect.winnerDistressLeadId,
      firstCandidate
    );

    assert.throws(
      () =>
        residual.read({}),
      /reappeared physically/i
    );
  }
);

test(
  'uncertain delete barrier blocks successor execution without authorizing retry',
  () => {
    resetRows();
    resetOperations();

    uncertainOperation(
      'OP-UNCERTAIN-1',
      firstDirect.groupNumber,
      firstDirect.winnerDistressLeadId,
      firstCandidate
    );

    const result =
      plain(
        residual.read({})
      );

    assert.strictEqual(
      result.executionBlocked,
      true
    );

    assert.deepStrictEqual(
      result.uncertainOperationIds,
      [
        'OP-UNCERTAIN-1'
      ]
    );

    assert.deepStrictEqual(
      result.executionBlockers,
      [
        'UNRESOLVED_COLLAPSE_OPERATION_HISTORY'
      ]
    );
  }
);

test(
  'verified delete outside direct-keep authority fails closed',
  () => {
    resetRows();
    resetOperations();

    const group17 =
      records.find(
        record =>
          Number(
            record.groupNumber
          ) === 17
      );

    verifiedOperation(
      'OP-UNAUTHORIZED-17',
      17,
      group17.distressLeadId,
      group17.distressLeadId
    );

    assert.throws(
      () =>
        residual.read({}),
      /outside immutable direct-keep authority/i
    );
  }
);

test(
  'certified immutable identity drift fails closed',
  () => {
    resetRows();
    resetOperations();

    liveRows[0][
      'Source Record ID'
    ] =
      'DRIFTED';

    assert.throws(
      () =>
        residual.read({}),
      /Source Record ID mismatch/i
    );
  }
);

test(
  'unexpected current member entering certified violation group fails closed',
  () => {
    resetRows();
    resetOperations();

    liveRows.push({
      'Distress Lead ID':
        'DL-UNAUTHORIZED-EXTRA',
      'Source':
        'PA-PHILADELPHIA',
      'Source Dataset':
        'code_violations',
      'Source Record ID':
        'EXTRA',
      'Violation Number':
        firstDirect.violationNumber,
      'Canonical Property Key':
        firstDirect.canonicalPropertyKey,
      'Source Observation Key':
        'EXTRA',
      'Source Record Key':
        'EXTRA',
      'Parcel ID':
        '',
      _rowNumber:
        9999
    });

    assert.throws(
      () =>
        residual.read({}),
      /Unexpected current member/i
    );
  }
);

test(
  'duplicate live certified Distress Lead ID fails closed',
  () => {
    resetRows();
    resetOperations();

    liveRows.push(
      Object.assign(
        {},
        liveRows[0],
        {
          _rowNumber:
            9998
        }
      )
    );

    assert.throws(
      () =>
        residual.read({}),
      /Duplicate live certified Distress Lead ID/i
    );
  }
);

const preflightSandbox = {
  console
};

vm.createContext(
  preflightSandbox
);

vm.runInContext(
  preflightSource,
  preflightSandbox,
  {
    filename:
      PREFLIGHT
  }
);

let managedTriggers = [];

let residualResult = {
  ok:
    true,
  authoritySha256:
    '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7',
  winnerPlanFingerprintSha256:
    '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce',
  certifiedRowCount:
    44,
  currentCertifiedRowCount:
    44,
  verifiedDeletedCount:
    0,
  remainingDirectKeepDeleteCandidateCount:
    16,
  uncertainOperationIds:
    [],
  executionBlocked:
    false
};

function checkpoint() {
  return {
    id:
      'COUNTY-20260902222607805',
    nextFeedIndex:
      0,
    currentFeedCursor:
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281',
    completedFeeds:
      0,
    totalFeeds:
      4,
    results:
      []
  };
}

preflightSandbox.REOS.Security = {
  requireAdmin() {
    return true;
  }
};

preflightSandbox.REOS.Database = {
  deletePhysicalRowExact() {
    throw new Error(
      'DELETE_PRIMITIVE_MUST_NOT_BE_INVOKED_BY_PREFLIGHT'
    );
  }
};

preflightSandbox.REOS.CountyCodeViolationCollapseDirectKeepExecutionAuthority = {
  metadata() {
    return {
      authoritySha256:
        '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7',
      winnerPlanFingerprintSha256:
        '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce',
      directKeepGroupCount:
        14,
      directKeepDeleteCandidateCount:
        16
    };
  }
};

preflightSandbox.REOS.CountyCodeViolationCollapseResidualEvidence = {
  read() {
    return Object.assign(
      {},
      residualResult,
      {
        uncertainOperationIds:
          residualResult
            .uncertainOperationIds
            .slice()
      }
    );
  }
};

preflightSandbox.REOS.CountyProductionScheduler = {
  getCheckpoint() {
    return checkpoint();
  }
};

preflightSandbox.ScriptApp = {
  getProjectTriggers() {
    return managedTriggers.slice();
  }
};

const preflight =
  preflightSandbox
    .REOS
    .CountyCodeViolationCollapseExecutionPreflightV2;

test(
  'successor preflight remains fail-closed solely on certified executor blocker',
  () => {
    managedTriggers = [];

    residualResult = {
      ...residualResult,
      uncertainOperationIds:
        [],
      executionBlocked:
        false
    };

    const result =
      plain(
        preflight.preflight({})
      );

    assert.deepStrictEqual(
      result.executionBlockers,
      [
        'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
      ]
    );

    assert.strictEqual(
      result.collapseExecutionReady,
      false
    );

    [
      'executionAuthorityGranted',
      'winnerSelectionAuthorityGranted',
      'collapseAuthorityGranted',
      'deleteAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'productionDataMutationAuthorityGranted',
      'repairAuthorityGranted',
      'migrationAuthorityGranted',
      'connectorExecutionAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'schedulerAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(field => {
      assert.strictEqual(
        result[field],
        false,
        field
      );
    });
  }
);

test(
  'successor preflight carries unresolved journal blocker forward',
  () => {
    managedTriggers = [];

    residualResult = {
      ...residualResult,
      uncertainOperationIds:
        [
          'OP-UNCERTAIN-1'
        ],
      executionBlocked:
        true
    };

    const result =
      plain(
        preflight.preflight({})
      );

    assert.deepStrictEqual(
      result.executionBlockers,
      [
        'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
        'UNRESOLVED_COLLAPSE_OPERATION_HISTORY'
      ]
    );

    assert.strictEqual(
      result.collapseExecutionReady,
      false
    );
  }
);

test(
  'successor preflight fails when managed scheduler trigger is present',
  () => {
    residualResult = {
      ...residualResult,
      uncertainOperationIds:
        [],
      executionBlocked:
        false
    };

    managedTriggers = [
      {
        getHandlerFunction() {
          return (
            'reosCountyProductionSchedulerRun'
          );
        },

        getUniqueId() {
          return 'TRIGGER-1';
        }
      }
    ];

    assert.throws(
      () =>
        preflight.preflight({}),
      /scheduler is not frozen/i
    );

    managedTriggers = [];
  }
);

test(
  'successor preflight prohibits caller-defined authority',
  () => {
    assert.throws(
      () =>
        preflight.preflight({
          groupNumber:
            2
        }),
      /Caller-defined collapse execution authority is prohibited/i
    );
  }
);

test(
  'successor runtime sources expose no RPC or direct mutation call',
  () => {
    [
      directSource,
      residualSource,
      preflightSource
    ].forEach(source => {
      assert.strictEqual(
        /function\s+reos/.test(
          source
        ),
        false
      );

      assert.strictEqual(
        source.includes(
          'ScriptApp.newTrigger'
        ),
        false
      );

      assert.strictEqual(
        source.includes(
          '.appendRow('
        ),
        false
      );

      assert.strictEqual(
        source.includes(
          '.setValues('
        ),
        false
      );

      assert.strictEqual(
        source.includes(
          '.deleteRow('
        ),
        false
      );
    });

    assert.strictEqual(
      /deletePhysicalRowExact\s*\(/.test(
        preflightSource
      ),
      false,
      'Successor preflight must never invoke physical delete primitive.'
    );
  }
);

console.log();
console.log(
  'REPEATABILITY_RUNTIME_BEHAVIOR_CASES=' +
  cases
);

console.log(
  'REPEATABILITY_RUNTIME_BEHAVIOR_VALIDATION_PASSED=true'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
