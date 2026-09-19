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
    preflightCalls:
      0,
    order:
      [],
    priorHistoryType:
      options.priorHistoryType || '',
    finalPreflightFails:
      options.finalPreflightFails === true,
    finalMaintenanceFails:
      options.finalMaintenanceFails === true,
    barrierFails:
      options.barrierFails === true,
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

      state.order.push(
        'MAINTENANCE_' +
        String(
          state.maintenanceAssertions
        )
      );

      if (
        state.maintenanceFails ||
        (
          state.finalMaintenanceFails &&
          state.maintenanceAssertions === 3
        )
      ) {
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
        state.preflightCalls++;

        state.order.push(
          'PREFLIGHT_' +
          String(
            state.preflightCalls
          )
        );

        const ready =
          state.ready &&
          !(
            state.finalPreflightFails &&
            state.preflightCalls === 4
          );

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
            ready
              ? []
              : [
                  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
                ],
          collapseExecutionReady:
            ready
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

        state.order.push(
          'REFERENCE_' +
          String(
            state.auditCalls
          )
        );

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
      listOperationIds() {
        return state.priorHistoryType
          ? [
              'PRIOR-1'
            ]
          : [];
      },

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
        if (
          request.eventType ===
            'DELETE_INVOCATION_STARTED'
        ) {
          if (state.barrierFails) {
            throw new Error(
              'BARRIER_PERSIST_FAILED'
            );
          }

          state.order.push(
            'BARRIER'
          );
        }

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
        if (
          operationId ===
            'PRIOR-1' &&
          state.priorHistoryType
        ) {
          let types;

          switch (
            state.priorHistoryType
          ) {
            case 'PREPARED':
              types = [
                'INTENT_PREPARED'
              ];
              break;

            case 'PRECONDITION_FAILED':
              types = [
                'INTENT_PREPARED',
                'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
              ];
              break;

            case 'UNCERTAIN':
              types = [
                'INTENT_PREPARED',
                'DELETE_INVOCATION_STARTED',
                'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN'
              ];
              break;

            case 'VERIFIED':
              types = [
                'INTENT_PREPARED',
                'DELETE_INVOCATION_STARTED',
                'POSTDELETE_VERIFIED',
                'COLLAPSE_DELETE_VERIFIED'
              ];
              break;

            default:
              throw new Error(
                'UNKNOWN_PRIOR_HISTORY_TYPE'
              );
          }

          return {
            found:
              true,
            operationId:
              'PRIOR-1',
            events:
              types.map(
                eventType => ({
                  manifest: {
                    operationId:
                      'PRIOR-1',
                    eventType,
                    targetDeleteDistressLeadId:
                      'D2'
                  }
                })
              )
          };
        }

        return {
          found:
            true,
          operationId,
          events:
            state.events.map(
              event => ({
                manifest: {
                  eventType:
                    event.eventType,
                  targetDeleteDistressLeadId:
                    'D2'
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

        state.order.push(
          'DELETE'
        );

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
  '=== DIRECT-KEEP COLLAPSE EXECUTOR SAFETY CORRECTION RUNTIME V1 ==='
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


test(
  15,
  'zero prior target-bound histories permits normal preparation',
  () => {
    const h =
      harness();

    const result =
      h.executor.execute(
        request()
      );

    assert.equal(
      result.classification,
      'COLLAPSE_DELETE_VERIFIED'
    );

    assert.equal(
      h.state.prepareCalls,
      1
    );

    assert.equal(
      h.state.deleteCalls,
      1
    );
  }
);

[
  [
    16,
    'PREPARED',
    'prepared-only prior target history blocks before new intent'
  ],
  [
    17,
    'PRECONDITION_FAILED',
    'precondition-failed prior target history blocks before new intent'
  ],
  [
    18,
    'UNCERTAIN',
    'uncertain prior target history blocks before new intent'
  ],
  [
    19,
    'VERIFIED',
    'verified prior target history cannot authorize another delete'
  ]
].forEach(
  entry => {
    test(
      entry[0],
      entry[2],
      () => {
        const h =
          harness({
            priorHistoryType:
              entry[1]
          });

        assert.throws(
          () =>
            h.executor.execute(
              request()
            ),
          /Existing durable operation history already binds requested delete candidate/
        );

        assert.equal(
          h.state.prepareCalls,
          0
        );

        assert.equal(
          h.state.deleteCalls,
          0
        );

        assert.deepEqual(
          h.state.events,
          []
        );
      }
    );
  }
);

test(
  20,
  'final successor preflight occurs after final reference refresh',
  () => {
    const h =
      harness();

    const result =
      h.executor.execute(
        request()
      );

    assert.equal(
      result.classification,
      'COLLAPSE_DELETE_VERIFIED'
    );

    const reference =
      h.state.order.indexOf(
        'REFERENCE_2'
      );

    const preflight =
      h.state.order.indexOf(
        'PREFLIGHT_4'
      );

    assert.ok(
      reference >= 0
    );

    assert.ok(
      preflight >
        reference
    );
  }
);

test(
  21,
  'final maintenance readiness occurs after final reference refresh',
  () => {
    const h =
      harness();

    h.executor.execute(
      request()
    );

    const reference =
      h.state.order.indexOf(
        'REFERENCE_2'
      );

    const maintenance =
      h.state.order.indexOf(
        'MAINTENANCE_3'
      );

    assert.ok(
      reference >= 0
    );

    assert.ok(
      maintenance >
        reference
    );
  }
);

test(
  22,
  'final scheduler checkpoint drift fails before barrier and delete',
  () => {
    const h =
      harness({
        finalPreflightFails:
          true
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
      h.state.prepareCalls,
      1
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );

    assert.equal(
      h.state.order.includes(
        'BARRIER'
      ),
      false
    );

    assert.deepEqual(
      h.state.events.map(
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
  23,
  'final maintenance failure fails before barrier and delete',
  () => {
    const h =
      harness({
        finalMaintenanceFails:
          true
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
      h.state.prepareCalls,
      1
    );

    assert.equal(
      h.state.deleteCalls,
      0
    );

    assert.equal(
      h.state.order.includes(
        'BARRIER'
      ),
      false
    );

    assert.deepEqual(
      h.state.events.map(
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
  24,
  'delete barrier persistence failure prevents physical delete',
  () => {
    const h =
      harness({
        barrierFails:
          true
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

    assert.equal(
      h.state.order.includes(
        'DELETE'
      ),
      false
    );

    assert.deepEqual(
      h.state.events.map(
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
  25,
  'final irreversible order is preflight maintenance barrier delete',
  () => {
    const h =
      harness();

    h.executor.execute(
      request()
    );

    const finalPreflight =
      h.state.order.indexOf(
        'PREFLIGHT_4'
      );

    const finalMaintenance =
      h.state.order.indexOf(
        'MAINTENANCE_3'
      );

    const barrier =
      h.state.order.indexOf(
        'BARRIER'
      );

    const deletion =
      h.state.order.indexOf(
        'DELETE'
      );

    assert.ok(
      finalPreflight >= 0
    );

    assert.ok(
      finalMaintenance >
        finalPreflight
    );

    assert.ok(
      barrier >
        finalMaintenance
    );

    assert.ok(
      deletion >
        barrier
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
      executorSource.includes(
        '.close('
      ),
      false
    );
  }
);


console.log('');
console.log(
  'SAFETY_CORRECTION_RUNTIME_BEHAVIOR_CASES=' +
  count
);

console.log(
  'EXECUTOR_SAFETY_CORRECTION_RUNTIME_VALIDATION_PASSED=true'
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

console.log(
  'TARGET_BOUND_HISTORY_GUARD_VALIDATED=true'
);

console.log(
  'FINAL_PREFLIGHT_REASSERTION_VALIDATED=true'
);

console.log(
  'FINAL_MAINTENANCE_REASSERTION_VALIDATED=true'
);

console.log(
  'FINAL_BARRIER_ORDER_VALIDATED=true'
);

console.log(
  'PREFLIGHT_BLOCKER_REMOVAL_AUTHORIZED=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=false'
);

console.log(
  'DEPLOYMENT_AUTHORIZED=false'
);
