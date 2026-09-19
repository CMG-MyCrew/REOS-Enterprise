#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');

const OPERATOR_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseMaintenanceOperator.js';

const EXECUTOR_FILE =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const CURRENT_FP =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const CURRENT_AUTH =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const CONFIRM =
  'CONFIRM_DIRECT_KEEP_COLLAPSE_EXECUTION_V1';

const operatorSource =
  fs.readFileSync(
    OPERATOR_FILE,
    'utf8'
  );

const executorSource =
  fs.readFileSync(
    EXECUTOR_FILE,
    'utf8'
  );

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function catalog() {
  const groups =
    [
      2, 4, 5, 6, 7, 8, 9,
      10, 11, 12, 13, 14, 15, 16
    ];

  return groups.map(
    (group, index) => {
      const candidates =
        group === 4
          ? [
              `D${group}A`,
              `D${group}B`,
              `D${group}C`
            ]
          : [
              group === 2
                ? 'D2'
                : `D${group}`
            ];

      return {
        groupNumber:
          group,
        violationNumber:
          `V-${group}`,
        proposedDurableKey:
          `DK-${group}`,
        canonicalPropertyKey:
          `CP-${group}`,
        winnerDistressLeadId:
          group === 2
            ? 'W2'
            : `W${group}`,
        deleteCandidateDistressLeadIds:
          candidates
      };
    }
  );
}

function harness(options = {}) {
  const headers = [
    'Distress Lead ID',
    'Violation Number',
    'Payload'
  ];

  const rows = [
    headers.slice()
  ];

  if (options.rowShift) {
    rows.push([
      'OTHER',
      'OTHER-V',
      'unrelated'
    ]);
  }

  rows.push([
    'W2',
    'V-2',
    'winner'
  ]);

  rows.push([
    'D2',
    'V-2',
    'delete'
  ]);

  const formulas =
    rows.map(row =>
      row.map(() => '')
    );

  const state = {
    rows,
    formulas,
    maxRows:
      rows.length + 20,
    maxColumns:
      headers.length,
    lockCalls:
      0,
    deleteCalls:
      0,
    maintenanceAssertions:
      0,
    closeCalls:
      0,
    auditCalls:
      0,
    prepareCalls:
      0,
    events:
      [],
    ready:
      options.ready !== false,
    maintenanceFails:
      options.maintenanceFails === true,
    uncertainResidual:
      options.uncertainResidual === true,
    referenceMatchOnCall:
      options.referenceMatchOnCall || 0,
    deleteFails:
      options.deleteFails === true
  };

  function findRow(id) {
    for (
      let index = 1;
      index < state.rows.length;
      index++
    ) {
      if (
        state.rows[index][0] ===
        id
      ) {
        return index + 1;
      }
    }

    return null;
  }

  const sheet = {
    getName() {
      return 'DISTRESS_LEADS';
    },

    getSheetId() {
      return 777;
    },

    getLastRow() {
      return state.rows.length;
    },

    getLastColumn() {
      return headers.length;
    },

    getMaxRows() {
      return state.maxRows;
    },

    getMaxColumns() {
      return state.maxColumns;
    },

    getRange(
      row,
      column,
      rowCount,
      columnCount
    ) {
      return {
        getValues() {
          return Array.from(
            { length: rowCount },
            (_, r) =>
              Array.from(
                { length: columnCount },
                (_, c) =>
                  state.rows[
                    row - 1 + r
                  ][
                    column - 1 + c
                  ]
              )
          );
        },

        getFormulas() {
          return Array.from(
            { length: rowCount },
            (_, r) =>
              Array.from(
                { length: columnCount },
                (_, c) =>
                  state.formulas[
                    row - 1 + r
                  ][
                    column - 1 + c
                  ]
              )
          );
        }
      };
    }
  };

  const spreadsheet = {
    getId() {
      return 'SPREADSHEET-1';
    },

    getSheetByName(name) {
      return name ===
        'DISTRESS_LEADS'
        ? sheet
        : null;
    }
  };

  const lockContext = {
    kind:
      'LOCK'
  };

  const gate = {
    open(value) {
      return Object.assign(
        {
          opened:
            true,
          maintenanceToken:
            'TOKEN',
          leaseId:
            'LEASE',
          gateId:
            'GATE',
          notBefore:
            '2026-09-19T20:00:00.000Z',
          expiresAt:
            '2026-09-19T22:00:00.000Z'
        },
        value
      );
    },

    status() {
      return {
        ok:
          true,
        maintenanceReady:
          false,
        gateId:
          'GATE',
        leaseId:
          'LEASE'
      };
    },

    close(value) {
      state.closeCalls++;

      return {
        ok:
          true,
        closed:
          true,
        gateId:
          value.expectedGateId,
        leaseId:
          value.expectedLeaseId
      };
    },

    assertReady(value) {
      state.maintenanceAssertions++;

      if (state.maintenanceFails) {
        throw new Error(
          'MAINTENANCE_NOT_READY'
        );
      }

      assert.equal(
        value.maintenanceToken,
        'TOKEN'
      );

      assert.equal(
        value.expectedLeaseId,
        'LEASE'
      );

      assert.equal(
        value.expectedGateId,
        'GATE'
      );

      assert.equal(
        value.lockContext,
        lockContext
      );

      return {
        ready:
          true,
        maintenanceReady:
          true,
        authorityGeneration:
          'CURRENT',
        leaseId:
          'LEASE',
        gateId:
          'GATE',
        manualExternalWritersQuiescentCertified:
          true
      };
    }
  };

  const REOS = {
    Security: {
      requireAdmin() {
        return true;
      }
    },

    CountyCodeViolationCollapseMaintenanceGate:
      gate,

    CountyCodeViolationCollapseDirectKeepExecutionAuthority: {
      metadata() {
        return {
          authoritySha256:
            CURRENT_AUTH,
          winnerPlanFingerprintSha256:
            CURRENT_FP,
          directKeepGroupCount:
            14,
          directKeepDeleteCandidateCount:
            16
        };
      },

      catalog() {
        return clone(
          catalog()
        );
      }
    },

    CountyCodeViolationCollapseExecutionPreflightV2: {
      preflight() {
        return {
          ok:
            true,
          authoritySha256:
            CURRENT_AUTH,
          winnerPlanFingerprintSha256:
            CURRENT_FP,
          schedulerFrozen:
            true,
          checkpointFrozen:
            true,
          physicalDeletePrimitiveAvailable:
            true,
          schedulerAfter:
            {
              triggerCount:
                0
            },
          checkpointAfter:
            {
              id:
                'CHECKPOINT'
            },
          executionBlockers:
            state.ready
              ? []
              : [
                  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
                ],
          collapseExecutionReady:
            state.ready
        };
      }
    },

    CountyCodeViolationCollapseResidualEvidence: {
      read() {
        if (state.uncertainResidual) {
          return {
            ok:
              true,
            authoritySha256:
              CURRENT_AUTH,
            winnerPlanFingerprintSha256:
              CURRENT_FP,
            executionBlocked:
              true,
            uncertainOperationIds:
              [
                'UNCERTAIN-1'
              ],
            currentRows:
              [],
            verifiedDeletes:
              []
          };
        }

        const currentRows = [];

        const winnerRow =
          findRow('W2');

        const targetRow =
          findRow('D2');

        if (winnerRow) {
          currentRows.push({
            groupNumber:
              2,
            distressLeadId:
              'W2',
            currentRowNumber:
              winnerRow
          });
        }

        if (targetRow) {
          currentRows.push({
            groupNumber:
              2,
            distressLeadId:
              'D2',
            currentRowNumber:
              targetRow
          });
        }

        return {
          ok:
            true,
          authoritySha256:
            CURRENT_AUTH,
          winnerPlanFingerprintSha256:
            CURRENT_FP,
          executionBlocked:
            false,
          uncertainOperationIds:
            [],
          currentRows,
          verifiedDeletes:
            []
        };
      }
    },

    CountyIdentityReferenceAudit: {
      audit(value) {
        state.auditCalls++;

        const matched =
          state.referenceMatchOnCall ===
          state.auditCalls;

        return {
          ok:
            true,
          referenceSurface:
            'CELL_VALUES_ONLY',
          scannedSheetCount:
            10,
          scanComplete:
            true,
          matchCount:
            matched
              ? 1
              : 0,
          matchesTruncated:
            false,
          truncated:
            false,
          unmatchedIds:
            matched
              ? []
              : value
                  .distressLeadIds
                  .slice()
        };
      }
    },

    CountyCollapseOperationIntentStore: {
      prepare(request) {
        state.prepareCalls++;

        const operationId =
          'OPERATION-1';

        state.events.push({
          eventType:
            'INTENT_PREPARED',
          request:
            clone(request)
        });

        return {
          operationId,
          readbackVerified:
            true
        };
      },

      append(request) {
        state.events.push({
          eventType:
            request.eventType,
          request:
            clone(request)
        });

        return {
          operationId:
            request.operationId,
          eventType:
            request.eventType,
          readbackVerified:
            true
        };
      },

      read(operationId) {
        return {
          found:
            true,
          operationId,
          events:
            state.events.map(
              event => ({
                manifest: {
                  eventType:
                    event.eventType
                }
              })
            )
        };
      }
    },

    Database: {
      withScriptLockContext(work) {
        state.lockCalls++;

        return work(
          lockContext
        );
      },

      deletePhysicalRowExact(
        name,
        request,
        optionsValue
      ) {
        state.deleteCalls++;

        assert.equal(
          name,
          'DISTRESS_LEADS'
        );

        assert.equal(
          optionsValue.lockContext,
          lockContext
        );

        if (state.deleteFails) {
          const error =
            new Error(
              'PHYSICAL_DELETE_OUTCOME_UNCERTAIN'
            );

          error.classification =
            'PHYSICAL_DELETE_OUTCOME_UNCERTAIN';

          throw error;
        }

        assert.equal(
          request.idValue,
          'D2'
        );

        const physical =
          findRow('D2');

        assert.equal(
          request.expectedRowNumber,
          physical
        );

        state.rows.splice(
          physical - 1,
          1
        );

        state.formulas.splice(
          physical - 1,
          1
        );

        state.maxRows--;

        return {
          classification:
            'DELETED_VERIFIED',
          idValue:
            'D2',
          deletedRowNumber:
            physical
        };
      }
    }
  };

  const sandbox = {
    REOS,
    console,
    Object,
    Array,
    JSON,
    Number,
    String,
    Boolean,
    Date,
    Math,
    Error,

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return spreadsheet;
      }
    }
  };

  const context =
    vm.createContext(
      sandbox
    );

  vm.runInContext(
    operatorSource,
    context,
    {
      filename:
        OPERATOR_FILE
    }
  );

  vm.runInContext(
    executorSource,
    context,
    {
      filename:
        EXECUTOR_FILE
    }
  );

  return {
    context,
    state,
    executor:
      context.REOS
        .CountyCodeViolationCollapseExecutor,
    operator:
      context.REOS
        .CountyCodeViolationCollapseMaintenanceOperator
  };
}

function request(overrides = {}) {
  return Object.assign(
    {
      confirmExecution:
        CONFIRM,
      groupNumber:
        2,
      deleteDistressLeadId:
        'D2',
      expectedWinnerDistressLeadId:
        'W2',
      expectedPlanFingerprintSha256:
        CURRENT_FP,
      expectedAuthoritySha256:
        CURRENT_AUTH,
      maintenanceToken:
        'TOKEN',
      expectedMaintenanceLeaseId:
        'LEASE',
      expectedMaintenanceGateId:
        'GATE'
    },
    overrides
  );
}

let count = 0;

function test(number, name, work) {
  assert.equal(
    number,
    count + 1
  );

  work();

  count++;

  console.log(
    'PASS ' +
    String(number)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

console.log(
  '=== DIRECT-KEEP COLLAPSE EXECUTOR RUNTIME V1 ==='
);

test(
  1,
  'maintenance operator API is exactly open status close',
  () => {
    const h =
      harness();

    assert.deepEqual(
      Object.keys(
        h.operator
      ).sort(),
      [
        'close',
        'open',
        'status'
      ]
    );
  }
);

test(
  2,
  'maintenance open delegates transient capability without persistence',
  () => {
    const h =
      harness();

    const result =
      h.operator.open({
        confirmMaintenanceWindow:
          true,
        confirmManualExternalWritersQuiescent:
          true,
        expectedWinnerPlanFingerprintSha256:
          CURRENT_FP,
        expectedAuthoritySha256:
          CURRENT_AUTH
      });

    assert.equal(
      result.maintenanceToken,
      'TOKEN'
    );
  }
);

test(
  3,
  'maintenance status exposes no raw token',
  () => {
    const h =
      harness();

    const value =
      h.operator.status();

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          value,
          'maintenanceToken'
        ),
      false
    );
  }
);

test(
  4,
  'maintenance close remains explicit operator action',
  () => {
    const h =
      harness();

    h.operator.close({
      confirmClose:
        true,
      maintenanceToken:
        'TOKEN',
      expectedLeaseId:
        'LEASE',
      expectedGateId:
        'GATE'
    });

    assert.equal(
      h.state.closeCalls,
      1
    );
  }
);

test(
  5,
  'current certified executor blocker prevents lock and deletion',
  () => {
    const h =
      harness({
        ready:
          false
      });

    assert.throws(
      () =>
        h.executor.execute(
          request()
        ),
      /has not granted execution readiness/
    );

    assert.equal(
      h.state.lockCalls,
      0
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  6,
  'unknown request fields fail closed',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.executor.execute(
          request({
            unexpectedAuthority:
              true
          })
        ),
      /missing or unknown fields/
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  7,
  'Groups 17 through 22 remain outside executor authority',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.executor.execute(
          request({
            groupNumber:
              17
          })
        ),
      /outside direct-keep authority/
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  8,
  'wrong winner identity fails closed',
  () => {
    const h =
      harness();

    assert.throws(
      () =>
        h.executor.execute(
          request({
            expectedWinnerDistressLeadId:
              'WRONG'
          })
        ),
      /winner does not match/
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  9,
  'uncertain residual operation history blocks executor',
  () => {
    const h =
      harness({
        uncertainResidual:
          true
      });

    assert.throws(
      () =>
        h.executor.execute(
          request()
        ),
      /Residual execution evidence is not clean/
    );

    assert.equal(
      h.state.lockCalls,
      0
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  10,
  'maintenance readiness failure prevents journal and delete',
  () => {
    const h =
      harness({
        maintenanceFails:
          true
      });

    assert.throws(
      () =>
        h.executor.execute(
          request()
        ),
      /MAINTENANCE_NOT_READY/
    );

    assert.equal(
      h.state.prepareCalls,
      0
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );
  }
);

test(
  11,
  'reference drift after intent produces precondition terminal with no delete',
  () => {
    const h =
      harness({
        referenceMatchOnCall:
          2
      });

    const result =
      h.executor.execute(
        request()
      );

    assert.equal(
      result.classification,
      'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );

    assert.deepEqual(
      h.state.events
        .map(
          event =>
            event.eventType
        ),
      [
        'INTENT_PREPARED',
        'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
      ]
    );
  }
);

test(
  12,
  'verified delete uses fresh row-shift-aware physical identity exactly once',
  () => {
    const h =
      harness({
        rowShift:
          true
      });

    const result =
      h.executor.execute(
        request()
      );

    assert.equal(
      result.classification,
      'COLLAPSE_DELETE_VERIFIED'
    );

    assert.equal(
      h.state.deleteCalls,
      1
    );

    assert.equal(
      h.state.closeCalls,
      0
    );

    assert.deepEqual(
      h.state.events
        .map(
          event =>
            event.eventType
        ),
      [
        'INTENT_PREPARED',
        'DELETE_INVOCATION_STARTED',
        'POSTDELETE_VERIFIED',
        'COLLAPSE_DELETE_VERIFIED'
      ]
    );
  }
);

test(
  13,
  'primitive uncertainty after barrier is terminal uncertain with no retry',
  () => {
    const h =
      harness({
        deleteFails:
          true
      });

    const result =
      h.executor.execute(
        request()
      );

    assert.equal(
      result.classification,
      'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN'
    );

    assert.equal(
      h.state.deleteCalls,
      1
    );

    assert.equal(
      result.automaticRetryPermitted,
      false
    );

    assert.equal(
      h.state.closeCalls,
      0
    );

    assert.deepEqual(
      h.state.events
        .map(
          event =>
            event.eventType
        ),
      [
        'INTENT_PREPARED',
        'DELETE_INVOCATION_STARTED',
        'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN'
      ]
    );
  }
);

test(
  14,
  'executor exposes no automatic maintenance closure or second delete path',
  () => {
    assert.equal(
      executorSource.includes(
        '.close('
      ),
      false
    );

    assert.equal(
      executorSource
        .split(
          '.deletePhysicalRowExact('
        )
        .length - 1,
      1
    );

    assert.equal(
      /function\s+reosCountyCodeViolationCollapseExecute/
        .test(
          executorSource
        ),
      false
    );
  }
);

console.log('');
console.log(
  'DIRECT_KEEP_EXECUTOR_RUNTIME_CASES=' +
  count
);

console.log(
  'DIRECT_KEEP_EXECUTOR_RUNTIME_VALIDATION_PASSED=true'
);

console.log(
  'PRODUCTION_PREFLIGHT_BLOCKER_PRESERVED=true'
);

console.log(
  'PHYSICAL_DELETE_CALL_SITES=1'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_MAINTENANCE_CLOSE=false'
);

console.log(
  'GROUPS_17_TO_22_IMPLEMENTATION_AUTHORITY=false'
);
