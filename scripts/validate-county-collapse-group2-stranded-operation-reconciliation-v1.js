'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const MODULE =
  'build/apps-script-brand/CountyCollapseGroup2StrandedOperationReconciliation.js';

const SOURCE =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

const OPERATION_ID =
  '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

const WINNER =
  'DL-20260820181645-7130';

const TARGET =
  'DL-20260820181652-6183';

const TIMESTAMP =
  '2026-09-20T23:49:45.327Z';

const PAYLOAD_SHA =
  '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

const EVENT_SHA =
  '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

const AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const WINNER_PLAN =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const RECOVERY =
  'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

const BLOCKER =
  'UNRESOLVED_COLLAPSE_OPERATION_HISTORY';

let casesPassed = 0;

function test(label, fn) {
  fn();
  casesPassed++;
  console.log(
    'PASS CASE ' +
    String(casesPassed).padStart(2, '0') +
    ': ' +
    label
  );
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function historyFixture() {
  return {
    found: true,
    operationId: OPERATION_ID,
    operationCreatedTimestampUtc:
      TIMESTAMP,
    identity: {
      executorImplementationVersion:
        'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',
      groupNumber: 2,
      winnerDistressLeadId:
        WINNER,
      targetDeleteDistressLeadId:
        TARGET
    },
    events: [
      {
        manifest: {
          operationId:
            OPERATION_ID,
          eventSequence:
            1,
          eventType:
            'INTENT_PREPARED',
          eventTimestampUtc:
            TIMESTAMP,
          operationIntentContractVersion:
            1,
          executorImplementationVersion:
            'DIRECT_KEEP_COLLAPSE_EXECUTOR_V1',
          groupNumber:
            2,
          winnerDistressLeadId:
            WINNER,
          targetDeleteDistressLeadId:
            TARGET,
          payloadSha256:
            PAYLOAD_SHA,
          payloadUtf8Bytes:
            9239,
          payloadChunkCount:
            1,
          previousEventSha256:
            'GENESIS',
          eventSha256:
            EVENT_SHA
        },
        canonicalPayload:
          '{"data":{"incident":"fixture"}}',
        chunks: [
          {
            operationId:
              OPERATION_ID,
            eventSequence:
              1,
            chunkIndex:
              0,
            chunkUtf8Bytes:
              9239,
            chunkSha256:
              PAYLOAD_SHA,
            chunkData:
              'ZXhhY3QtZml4dHVyZQ=='
          }
        ]
      }
    ]
  };
}

function recoveryFixture() {
  return {
    operationId:
      OPERATION_ID,
    found:
      true,
    classification:
      RECOVERY,
    automaticRetryPermitted:
      false,
    rowRecreationPermitted:
      false,
    journalMutationExecuted:
      false,
    eventCount:
      1
  };
}

function residualFixture() {
  return {
    ok:
      true,
    authoritySha256:
      AUTHORITY,
    winnerPlanFingerprintSha256:
      WINNER_PLAN,

    operationIds:
      [OPERATION_ID],

    uncertainOperationIds:
      [OPERATION_ID],

    executionBlocked:
      true,

    executionBlockers:
      [BLOCKER],

    verifiedDeletes:
      [],

    currentRows: [
      {
        groupNumber:
          2,
        distressLeadId:
          WINNER,
        currentRowNumber:
          766
      },
      {
        groupNumber:
          2,
        distressLeadId:
          TARGET,
        currentRowNumber:
          770
      }
    ],

    collapseExecutionAuthorityGranted:
      false,
    physicalDeleteAuthorityGranted:
      false,
    productionDataMutationAuthorityGranted:
      false,
    schedulerMutationAuthorityGranted:
      false,
    checkpointMutationAuthorityGranted:
      false,
    automaticOfferAuthorityGranted:
      false
  };
}

function load(options) {
  options =
    options || {};

  const calls = {
    admin:
      0,
    list:
      0,
    read:
      0,
    recover:
      0,
    residual:
      0
  };

  const history =
    options.history ||
    historyFixture();

  const recovery =
    options.recovery ||
    recoveryFixture();

  const residual =
    options.residual ||
    residualFixture();

  const context = {
    console:
      console,

    REOS: {
      Security: {
        requireAdmin() {
          calls.admin++;

          if (
            options.adminError
          ) {
            throw new Error(
              options.adminError
            );
          }
        }
      },

      CountyCollapseOperationIntentStore: {
        listOperationIds() {
          calls.list++;

          return (
            options.operationIds ||
            [OPERATION_ID]
          ).slice();
        },

        read(operationId) {
          calls.read++;

          assert.strictEqual(
            operationId,
            OPERATION_ID
          );

          return clone(
            history
          );
        },

        recover(operationId) {
          calls.recover++;

          assert.strictEqual(
            operationId,
            OPERATION_ID
          );

          return clone(
            recovery
          );
        }
      },

      CountyCodeViolationCollapseResidualEvidence: {
        read(request) {
          calls.residual++;

          assert.ok(
            request &&
            typeof request === 'object' &&
            !Array.isArray(request)
          );

          assert.strictEqual(
            Object.keys(request).length,
            0
          );

          return clone(
            residual
          );
        }
      }
    }
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    SOURCE,
    context,
    {
      filename:
        MODULE
    }
  );

  return {
    context:
      context,
    calls:
      calls
  };
}

console.log(
  '=== GROUP 2 STRANDED OPERATION READ-ONLY RECONCILIATION V1 ==='
);

test(
  'static surface is strictly read-only and incident-bound',
  () => {
    [
      /\.prepare\s*\(/,
      /\.append\s*\(/,
      /\.execute\s*\(/,
      /\.setValues\s*\(/,
      /\.setValue\s*\(/,
      /\.deleteRow\s*\(/,
      /\.deleteRows\s*\(/,
      /\.deletePhysicalRowExact\s*\(/,
      /Database\.insert\s*\(/,
      /Database\.update\s*\(/,
      /Database\.upsert\s*\(/,
      /ScriptApp\.newTrigger\s*\(/,
      /PropertiesService/,
      /LockService/,
      /SpreadsheetApp/,
      /DriveApp/
    ].forEach(pattern => {
      assert.ok(
        !pattern.test(
          SOURCE
        ),
        'Forbidden mutation/I/O surface: ' +
        pattern
      );
    });

    [
      OPERATION_ID,
      WINNER,
      TARGET,
      TIMESTAMP,
      PAYLOAD_SHA,
      EVENT_SHA,
      AUTHORITY,
      WINNER_PLAN,
      RECOVERY,
      BLOCKER
    ].forEach(marker => {
      assert.ok(
        SOURCE.includes(
          marker
        ),
        'Missing incident authority: ' +
        marker
      );
    });

    assert.ok(
      SOURCE.includes(
        '.listOperationIds()'
      )
    );

    assert.ok(
      SOURCE.includes(
        '.read('
      )
    );

    assert.ok(
      SOURCE.includes(
        '.recover('
      )
    );
  }
);

test(
  'exact stranded operation reconciles read-only with no authority',
  () => {
    const loaded =
      load();

    const result =
      loaded.context
        .reosCountyCollapseGroup2StrandedOperationReconciliationStatus();

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.operationId,
      OPERATION_ID
    );

    assert.strictEqual(
      result.groupNumber,
      2
    );

    assert.strictEqual(
      result.journalReadbackDecoded,
      true
    );

    assert.strictEqual(
      result.journalEventCount,
      1
    );

    assert.strictEqual(
      result.journalEventType,
      'INTENT_PREPARED'
    );

    assert.strictEqual(
      result.recoveryClassification,
      RECOVERY
    );

    assert.strictEqual(
      result.deleteBarrierPresent,
      false
    );

    assert.strictEqual(
      result.verifiedDeletePresent,
      false
    );

    assert.strictEqual(
      result.winnerPresent,
      true
    );

    assert.strictEqual(
      result.targetPresent,
      true
    );

    [
      'automaticRetryPermitted',
      'rowRecreationPermitted',
      'journalMutationExecuted',
      'collapseExecutionAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'productionDataMutationAuthorityGranted',
      'maintenanceMutationAuthorityGranted',
      'schedulerMutationAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'connectorExecutionAuthorityGranted',
      'automaticMaoAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(field => {
      assert.strictEqual(
        result[field],
        false,
        field
      );
    });

    assert.deepStrictEqual(
      loaded.calls,
      {
        admin:
          1,
        list:
          1,
        read:
          1,
        recover:
          1,
        residual:
          1
      }
    );
  }
);

test(
  'RPC accepts no caller-defined authority',
  () => {
    const loaded =
      load();

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(
            {}
          ),
      /takes no arguments/
    );

    assert.strictEqual(
      loaded.calls.admin,
      0
    );
  }
);

test(
  'Admin denial fails before journal or residual reads',
  () => {
    const loaded =
      load({
        adminError:
          'DENIED'
      });

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(),
      /DENIED/
    );

    assert.strictEqual(
      loaded.calls.list,
      0
    );

    assert.strictEqual(
      loaded.calls.read,
      0
    );

    assert.strictEqual(
      loaded.calls.recover,
      0
    );

    assert.strictEqual(
      loaded.calls.residual,
      0
    );
  }
);

test(
  'unexpected operation-ID population fails closed',
  () => {
    const loaded =
      load({
        operationIds:
          []
      });

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(),
      /Journal operation IDs/
    );

    assert.strictEqual(
      loaded.calls.read,
      0
    );
  }
);

test(
  'prepared-event identity drift fails closed',
  () => {
    const history =
      historyFixture();

    history.events[0]
      .manifest
      .payloadSha256 =
      '0'.repeat(64);

    const loaded =
      load({
        history:
          history
      });

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(),
      /Prepared-event manifest drift/
    );

    assert.strictEqual(
      loaded.calls.recover,
      0
    );
  }
);

test(
  'delete-barrier or recovery-classification drift fails closed',
  () => {
    const recovery =
      recoveryFixture();

    recovery.classification =
      'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL';

    const loaded =
      load({
        recovery:
          recovery
      });

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(),
      /recovery classification drift/
    );

    assert.strictEqual(
      loaded.calls.residual,
      0
    );
  }
);

test(
  'residual operation blocker drift fails closed',
  () => {
    const residual =
      residualFixture();

    residual.executionBlockers =
      [];

    const loaded =
      load({
        residual:
          residual
      });

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(),
      /Residual execution blockers/
    );
  }
);

test(
  'missing target or verified-delete drift fails closed',
  () => {
    const missing =
      residualFixture();

    missing.currentRows =
      [
        missing.currentRows[0]
      ];

    let loaded =
      load({
        residual:
          missing
      });

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(),
      /Current Group 2 population/
    );

    const deleted =
      residualFixture();

    deleted.verifiedDeletes =
      [
        {
          targetDeleteDistressLeadId:
            TARGET
        }
      ];

    loaded =
      load({
        residual:
          deleted
      });

    assert.throws(
      () =>
        loaded.context
          .reosCountyCollapseGroup2StrandedOperationReconciliationStatus(),
      /Verified-delete state changed/
    );
  }
);

assert.strictEqual(
  casesPassed,
  9
);

console.log(
  'GROUP2_STRANDED_RECONCILIATION_BEHAVIOR_CASES=9'
);

console.log(
  'INCIDENT_OPERATION_ID=' +
  OPERATION_ID
);

console.log(
  'EXPECTED_RECOVERY_CLASSIFICATION=' +
  RECOVERY
);

console.log(
  'DELETE_BARRIER_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORITY=false'
);

console.log(
  'JOURNAL_MUTATION_AUTHORITY=false'
);

console.log(
  'PHYSICAL_DELETE_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_MAO_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);

console.log(
  'GROUP2_STRANDED_OPERATION_RECONCILIATION_VALIDATION_PASSED=true'
);
