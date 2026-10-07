#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT =
  path.resolve(__dirname, '..');

const FILE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js'
  );

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

function plain(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

function clone(value) {
  return plain(value);
}

function input(referenceCount) {
  const count =
    referenceCount === undefined
      ? 2
      : referenceCount;

  const references = [];

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    references.push({
      sourceRecordId:
        String(383 + index)
    });
  }

  return {
    rowNumber: 1530,

    identity: {
      'Distress Lead ID':
        'DL-TEST-1530',

      'Canonical Property Key':
        'property|test|1624-n-bodine-st'
    },

    sourceReferences:
      references
  };
}

function selectorEvidence() {
  return {
    ok: true,
    mode: 'READ_ONLY',
    phase:
      'absentee_owner_exact_record_evidence',

    target: {
      table:
        'DISTRESS_LEADS',
      rowNumber:
        1530
    },

    identity: {
      'Distress Lead ID':
        'DL-TEST-1530',

      'Canonical Property Key':
        'property|test|1624-n-bodine-st'
    },

    record: {
      'Distress Lead ID':
        'DL-TEST-1530',

      'Canonical Property Key':
        'property|test|1624-n-bodine-st',

      Address:
        '1624 N BODINE ST'
    },

    productionDataMutationAuthorityGranted:
      false,

    canonicalIdentityRepairAuthorityGranted:
      false,

    migrationAuthorityGranted:
      false,

    schedulerAuthorityGranted:
      false,

    triggerAuthorityGranted:
      false,

    connectorExecutionAuthorityGranted:
      false,

    certificationMutationAuthorityGranted:
      false,

    automaticOfferAuthorityGranted:
      false
  };
}

function retrievalSuccess(request) {
  return {
    ok: true,

    mode:
      'READ_ONLY_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVAL',

    phase:
      'absentee_owner_source_evidence_retrieval',

    outcome:
      'SOURCE_EVIDENCE_READY',

    target:
      clone(request.target),

    requestedReferenceCount:
      request.sourceReferences.length,

    retrievedObservationCount:
      request.sourceReferences.length,

    sourceObservations:
      request.sourceReferences.map(
        reference => ({
          sourceObservationId:
            'pa-philadelphia|code_violations|' +
            reference.sourceRecordId,

          propertyAddress:
            '1624 N BODINE ST',

          parcel_id_num:
            '1473083',

          opa_account_num:
            '183124510'
        })
      ),

    productionSourceRetrievalExecutionAuthorityGranted:
      false,

    sourceEvidenceRetrievalAuthorityGranted:
      false,

    productionDataMutationAuthorityGranted:
      false,

    opaAccountRowRetrievalAuthorityGranted:
      false,

    ownerEvidenceRetrievalAuthorityGranted:
      false,

    classificationAuthorityGranted:
      false,

    persistenceAuthorityGranted:
      false,

    rolloutAuthorityGranted:
      false,

    arvAuthorityGranted:
      false,

    repairScopeAuthorityGranted:
      false,

    maoAuthorityGranted:
      false,

    offerAuthorityGranted:
      false
  };
}

function harness(options) {
  const config =
    options || {};

  const state = {
    adminCalls: 0,
    selectorCalls: 0,
    retrieverCalls: 0,
    simulatedArcGisRequests: 0,
    selectorInput: null,
    retrieverInput: null
  };

  const context = {
    REOS: {
      Security: {
        requireAdmin:
          function () {
            state.adminCalls += 1;

            if (config.adminThrows) {
              throw new Error(
                'ADMIN_DENIED'
              );
            }
          }
      },

      AbsenteeOwnerEnrichmentExactRecordSelector: {
        exactRecordEvidence:
          function (request) {
            state.selectorCalls += 1;
            state.selectorInput =
              clone(request);

            if (
              typeof config.selector ===
              'function'
            ) {
              return config.selector(
                request
              );
            }

            return selectorEvidence();
          }
      },

      AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever: {
        retrieve:
          function (request) {
            state.retrieverCalls += 1;
            state.retrieverInput =
              clone(request);

            state.simulatedArcGisRequests +=
              request.sourceReferences.length;

            if (
              typeof config.retriever ===
              'function'
            ) {
              return config.retriever(
                request
              );
            }

            return retrievalSuccess(
              request
            );
          }
      }
    }
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    source,
    context,
    {
      filename:
        'AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js'
    }
  );

  return {
    context: context,
    state: state,

    execute:
      context
        .REOS
        .AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint
        .execute,

    rpc:
      context
        .reosAbsenteeOwnerSourceEvidenceRetrieveSingleRecord
  };
}

function expectNoProductionReadOrRetrieval(h) {
  assert.strictEqual(
    h.state.selectorCalls,
    0
  );

  assert.strictEqual(
    h.state.retrieverCalls,
    0
  );

  assert.strictEqual(
    h.state.simulatedArcGisRequests,
    0
  );
}

function expectFailure(
  result,
  code
) {
  const value =
    plain(result);

  assert.strictEqual(
    value.ok,
    false
  );

  assert.strictEqual(
    value.code,
    code
  );

  assert.strictEqual(
    value.productionSourceRetrievalExecutionAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.sourceEvidenceRetrievalAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.persistenceAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.classificationAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.maoAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.offerAuthorityGranted,
    false
  );
}

let cases = 0;

function case_(name, fn) {
  fn();
  cases += 1;

  console.log(
    'PASS=' + name
  );
}

case_(
  'admin denial before production read',
  () => {
    const h =
      harness({
        adminThrows: true
      });

    assert.throws(
      () => h.execute(
        input()
      ),
      /ADMIN_DENIED/
    );

    expectNoProductionReadOrRetrieval(
      h
    );
  }
);

case_(
  'missing options rejected',
  () => {
    const h = harness();
    expectFailure(
      h.execute(),
      'INVALID_OPTIONS'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'null options rejected',
  () => {
    const h = harness();
    expectFailure(
      h.execute(null),
      'INVALID_OPTIONS'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'extra top-level field rejected',
  () => {
    const h = harness();
    const value = input();
    value.extra = true;

    expectFailure(
      h.execute(value),
      'INVALID_OPTIONS'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'string row rejected',
  () => {
    const h = harness();
    const value = input();
    value.rowNumber = '1530';

    expectFailure(
      h.execute(value),
      'INVALID_ROW_NUMBER'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'header row rejected',
  () => {
    const h = harness();
    const value = input();
    value.rowNumber = 1;

    expectFailure(
      h.execute(value),
      'INVALID_ROW_NUMBER'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'fractional row rejected',
  () => {
    const h = harness();
    const value = input();
    value.rowNumber = 1530.5;

    expectFailure(
      h.execute(value),
      'INVALID_ROW_NUMBER'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'identity array rejected',
  () => {
    const h = harness();
    const value = input();
    value.identity = [];

    expectFailure(
      h.execute(value),
      'INVALID_IDENTITY'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'identity extra key rejected',
  () => {
    const h = harness();
    const value = input();
    value.identity.extra = true;

    expectFailure(
      h.execute(value),
      'INVALID_IDENTITY'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'blank distress lead id rejected',
  () => {
    const h = harness();
    const value = input();
    value.identity[
      'Distress Lead ID'
    ] = '   ';

    expectFailure(
      h.execute(value),
      'MISSING_DISTRESS_LEAD_ID'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'blank canonical key rejected',
  () => {
    const h = harness();
    const value = input();
    value.identity[
      'Canonical Property Key'
    ] = '';

    expectFailure(
      h.execute(value),
      'MISSING_CANONICAL_PROPERTY_KEY'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'non-array references rejected',
  () => {
    const h = harness();
    const value = input();
    value.sourceReferences = {};

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_REFERENCES'
    );
    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'one reference rejected',
  () => {
    const h = harness();

    expectFailure(
      h.execute(
        input(1)
      ),
      'SOURCE_REFERENCE_COUNT_OUT_OF_BOUNDS'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'six references rejected',
  () => {
    const h = harness();

    expectFailure(
      h.execute(
        input(6)
      ),
      'SOURCE_REFERENCE_COUNT_OUT_OF_BOUNDS'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'duplicate references rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[1]
      .sourceRecordId =
        value.sourceReferences[0]
          .sourceRecordId;

    expectFailure(
      h.execute(value),
      'DUPLICATE_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'numeric sourceRecordId rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .sourceRecordId = 383;

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'leading-zero sourceRecordId rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .sourceRecordId = '0383';

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'trailing-whitespace sourceRecordId rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .sourceRecordId = '383 ';

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'leading-whitespace sourceRecordId rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .sourceRecordId = ' 383';

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'decimal sourceRecordId rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .sourceRecordId = '383.0';

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'scientific sourceRecordId rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .sourceRecordId = '3e2';

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'zero sourceRecordId rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .sourceRecordId = '0';

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_RECORD_ID'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'extra source-reference field rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .extra = true;

    expectFailure(
      h.execute(value),
      'INVALID_SOURCE_REFERENCE'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'non-string persisted observation key rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .persistedSourceObservationKey =
        383;

    expectFailure(
      h.execute(value),
      'INVALID_PERSISTED_SOURCE_OBSERVATION_KEY'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'persisted observation mismatch rejected',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .persistedSourceObservationKey =
        'pa-philadelphia|code_violations|999';

    expectFailure(
      h.execute(value),
      'SOURCE_OBSERVATION_IDENTITY_MISMATCH'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'selector failure causes zero retrieval calls',
  () => {
    const h =
      harness({
        selector:
          () => ({
            ok: false,
            code:
              'ROW_NUMBER_OUT_OF_RANGE'
          })
      });

    expectFailure(
      h.execute(input()),
      'EXACT_RECORD_SELECTION_FAILED'
    );

    assert.strictEqual(
      h.state.selectorCalls,
      1
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'malformed selector evidence rejected',
  () => {
    const h =
      harness({
        selector:
          () => null
      });

    expectFailure(
      h.execute(input()),
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'selector row mismatch rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value.target.rowNumber =
              1532;

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'selector distress identity mismatch rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value.identity[
              'Distress Lead ID'
            ] = 'OTHER';

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'selector canonical identity mismatch rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value.identity[
              'Canonical Property Key'
            ] = 'OTHER';

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'selector table mismatch rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value.target.table =
              'OTHER';

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'selector authority escalation rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value
              .productionDataMutationAuthorityGranted =
                true;

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'missing verified address rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            delete value.record.Address;

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'MISSING_VERIFIED_PROPERTY_ADDRESS'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'blank verified address rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value.record.Address = '';

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'MISSING_VERIFIED_PROPERTY_ADDRESS'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'address requiring trim is rejected rather than repaired',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value.record.Address =
              ' 1624 N BODINE ST';

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'MISSING_VERIFIED_PROPERTY_ADDRESS'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'control-character verified address rejected',
  () => {
    const h =
      harness({
        selector:
          () => {
            const value =
              selectorEvidence();

            value.record.Address =
              '1624 N BODINE ST\u0000';

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'MISSING_VERIFIED_PROPERTY_ADDRESS'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      0
    );
  }
);

case_(
  'missing retriever dependency fails before selector read',
  () => {
    const h = harness();

    h.context
      .REOS
      .AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever =
        null;

    expectFailure(
      h.execute(input()),
      'RUNTIME_DEPENDENCY_UNAVAILABLE'
    );

    expectNoProductionReadOrRetrieval(h);
  }
);

case_(
  'two-reference success',
  () => {
    const h = harness();

    const result =
      plain(
        h.execute(
          input(2)
        )
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      h.state.selectorCalls,
      1
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      1
    );

    assert.strictEqual(
      h.state.simulatedArcGisRequests,
      2
    );
  }
);

case_(
  'five-reference maximum success',
  () => {
    const h = harness();

    const result =
      plain(
        h.execute(
          input(5)
        )
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      h.state.selectorCalls,
      1
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      1
    );

    assert.strictEqual(
      h.state.simulatedArcGisRequests,
      5
    );
  }
);

case_(
  'verified property address is authoritative',
  () => {
    const h = harness();

    h.execute(
      input()
    );

    assert.strictEqual(
      h.state
        .retrieverInput
        .target
        .propertyAddress,
      '1624 N BODINE ST'
    );

    assert.deepStrictEqual(
      h.state
        .selectorInput,
      {
        rowNumber: 1530,
        identity: {
          'Distress Lead ID':
            'DL-TEST-1530',
          'Canonical Property Key':
            'property|test|1624-n-bodine-st'
        }
      }
    );
  }
);

case_(
  'source-reference order preserved',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences = [
      {
        sourceRecordId: '384'
      },
      {
        sourceRecordId: '383'
      }
    ];

    h.execute(value);

    assert.deepStrictEqual(
      h.state
        .retrieverInput
        .sourceReferences
        .map(
          reference =>
            reference.sourceRecordId
        ),
      [
        '384',
        '383'
      ]
    );
  }
);

case_(
  'exact persisted observation identity preserved',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .persistedSourceObservationKey =
        'pa-philadelphia|code_violations|383';

    h.execute(value);

    assert.strictEqual(
      h.state
        .retrieverInput
        .sourceReferences[0]
        .persistedSourceObservationKey,
      'pa-philadelphia|code_violations|383'
    );
  }
);

case_(
  'blank persisted observation identity remains blank',
  () => {
    const h = harness();
    const value = input();

    value.sourceReferences[0]
      .persistedSourceObservationKey =
        '';

    h.execute(value);

    assert.strictEqual(
      h.state
        .retrieverInput
        .sourceReferences[0]
        .persistedSourceObservationKey,
      ''
    );
  }
);

case_(
  'retriever invoked exactly once',
  () => {
    const h = harness();

    h.execute(
      input()
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      1
    );
  }
);

case_(
  'retriever atomic failure returned without retry',
  () => {
    const failure = {
      ok: false,
      code:
        'SOURCE_RECORD_NOT_FOUND',
      sourceEvidenceRetrievalAuthorityGranted:
        false
    };

    const h =
      harness({
        retriever:
          () => failure
      });

    const result =
      plain(
        h.execute(
          input()
        )
      );

    assert.deepStrictEqual(
      result,
      failure
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      1
    );
  }
);

case_(
  'retriever throw is fail closed without retry',
  () => {
    const h =
      harness({
        retriever:
          () => {
            throw new Error(
              'RETRIEVER_THROW'
            );
          }
      });

    expectFailure(
      h.execute(input()),
      'SOURCE_RETRIEVAL_FAILED'
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      1
    );
  }
);

case_(
  'failed retrieval cannot elevate partial observations',
  () => {
    const h =
      harness({
        retriever:
          () => ({
            ok: false,
            code:
              'SOURCE_RETRIEVAL_FAILED',
            sourceObservations: [
              {
                sourceObservationId:
                  'forbidden-partial'
              }
            ]
          })
      });

    const result =
      plain(
        h.execute(
          input()
        )
      );

    expectFailure(
      result,
      'INVALID_SOURCE_RETRIEVAL_FAILURE_EVIDENCE'
    );

    assert.strictEqual(
      Object.prototype
        .hasOwnProperty
        .call(
          result,
          'sourceObservations'
        ),
      false
    );
  }
);

case_(
  'caller input remains unmodified',
  () => {
    const h = harness();
    const value = input();

    const before =
      clone(value);

    h.execute(value);

    assert.deepStrictEqual(
      value,
      before
    );
  }
);

case_(
  'global RPC delegates to one bounded invocation',
  () => {
    const h = harness();

    const result =
      plain(
        h.rpc(
          input()
        )
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      h.state.adminCalls,
      1
    );

    assert.strictEqual(
      h.state.selectorCalls,
      1
    );

    assert.strictEqual(
      h.state.retrieverCalls,
      1
    );
  }
);

assert.ok(
  cases >= 38,
  'behavior coverage must include at least 38 cases'
);

console.log(
  'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_SINGLE_RECORD_PRODUCTION_ENTRYPOINT_BEHAVIOR_VALID=true'
);

console.log(
  'BEHAVIOR_CASE_COUNT=' +
    cases
);

console.log(
  'ADMIN_DENIAL_BEFORE_PRODUCTION_READ=true'
);

console.log(
  'MALFORMED_REQUEST_ZERO_SELECTOR_READS=true'
);

console.log(
  'MALFORMED_REQUEST_ZERO_RETRIEVER_CALLS=true'
);

console.log(
  'PRODUCTION_SOURCE_RECORD_ID_STRING_ONLY=true'
);

console.log(
  'NUMERIC_SOURCE_RECORD_ID_REJECTED=true'
);

console.log(
  'SELECTOR_INVOCATION_MAX=1'
);

console.log(
  'RETRIEVER_INVOCATION_MAX=1'
);

console.log(
  'MAX_SIMULATED_EXTERNAL_SOURCE_REQUESTS=5'
);

console.log(
  'SOURCE_REFERENCE_ORDER_PRESERVED=true'
);

console.log(
  'VERIFIED_ROW_ADDRESS_AUTHORITY=true'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'PARTIAL_FAILURE_EVIDENCE_ELEVATED=false'
);

console.log(
  'ROWS_1530_1532_EXECUTION_AUTHORIZED=false'
);
