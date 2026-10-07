#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js'
);

const source = fs.readFileSync(
  FILE,
  'utf8'
);

let count = 0;

function test(name, fn) {
  count++;

  try {
    fn();
    console.log('PASS: ' + name);
  } catch (error) {
    console.error('FAIL: ' + name);
    throw error;
  }
}

function record(id, overrides) {
  return Object.assign({
    objectid: id,
    address: '1624 N BODINE ST',
    parcel_id_num: '1473083',
    opa_account_num: '183124510'
  }, overrides || {});
}

function fetched(records, exceeded) {
  return {
    records: records,
    nextCursor: '',
    message: 'mocked',
    metadata: {
      adapter: 'arcgis',
      status: 200,
      durationMs: 1,
      exceededTransferLimit:
        exceeded === true
    }
  };
}

function validInput(ids) {
  ids = ids || ['383', '384'];

  return {
    target: {
      rowNumber: 1530,

      identity: {
        'Distress Lead ID':
          'DL-TEST-1530',

        'Canonical Property Key':
          'property|address|pa|philadelphia|1624 n bodine st'
      },

      propertyAddress:
        '1624 N BODINE ST'
    },

    sourceReferences:
      ids.map(id => ({
        sourceRecordId: id,
        persistedSourceObservationKey:
          'pa-philadelphia|code_violations|' +
          id
      }))
  };
}

function createHarness(config) {
  config = config || {};

  const state = {
    adminCalls: 0,
    fetchCalls: []
  };

  const plan =
    Array.isArray(config.plan)
      ? config.plan.slice()
      : [];

  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    Date,
    Error,
    RegExp,
    Infinity,
    NaN,
    isFinite
  };

  context.REOS = {
    Security: {
      requireAdmin() {
        state.adminCalls++;

        if (config.adminDenied) {
          throw new Error('ADMIN_DENIED');
        }

        return true;
      }
    },

    CountyAdapters: {
      ArcGIS: {
        fetch(options) {
          state.fetchCalls.push(options);

          const index =
            state.fetchCalls.length - 1;

          const item =
            plan[index];

          if (item instanceof Error) {
            throw item;
          }

          if (typeof item === 'function') {
            return item(options, index);
          }

          if (item === undefined) {
            throw new Error(
              'UNEXPECTED_FETCH_CALL_' +
              index
            );
          }

          return item;
        }
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    source,
    context,
    {
      filename: FILE
    }
  );

  return {
    state,

    call(input) {
      return context
        .REOS
        .AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever
        .retrieve(input);
    }
  };
}

const FALSE_AUTHORITY_FIELDS = [
  'productionSourceRetrievalExecutionAuthorityGranted',
  'sourceEvidenceRetrievalAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'opaAccountRowRetrievalAuthorityGranted',
  'ownerEvidenceRetrievalAuthorityGranted',
  'classificationAuthorityGranted',
  'persistenceAuthorityGranted',
  'rolloutAuthorityGranted',
  'identityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'cursorMutationAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted'
];

function assertAuthorityFalse(result) {
  FALSE_AUTHORITY_FIELDS.forEach(field => {
    assert.strictEqual(
      result[field],
      false,
      field
    );
  });
}

function successfulPlan(ids) {
  return ids.map(id =>
    fetched([
      record(id)
    ])
  );
}

test(
  'admin denial occurs before external retrieval',
  () => {
    const h = createHarness({
      adminDenied: true
    });

    assert.throws(
      () => h.call(validInput()),
      /ADMIN_DENIED/
    );

    assert.strictEqual(
      h.state.adminCalls,
      1
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'invalid top-level input fails without retrieval',
  () => {
    const h = createHarness();

    const out = h.call({});

    assert.strictEqual(out.ok, false);
    assert.strictEqual(
      out.code,
      'INVALID_OPTIONS'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
    assertAuthorityFalse(out);
  }
);

test(
  'target binding rejects extra target fields',
  () => {
    const h = createHarness();

    const input = validInput();

    input.target.extra = 'PROHIBITED';

    const out = h.call(input);

    assert.strictEqual(out.ok, false);
    assert.strictEqual(
      out.code,
      'INVALID_TARGET'
    );
    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'one reference is rejected',
  () => {
    const h = createHarness();

    const out = h.call(
      validInput(['383'])
    );

    assert.strictEqual(
      out.code,
      'SOURCE_REFERENCE_COUNT_OUT_OF_BOUNDS'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'six references are rejected',
  () => {
    const h = createHarness();

    const out = h.call(
      validInput([
        '1', '2', '3',
        '4', '5', '6'
      ])
    );

    assert.strictEqual(
      out.code,
      'SOURCE_REFERENCE_COUNT_OUT_OF_BOUNDS'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'duplicate reference is rejected before retrieval',
  () => {
    const h = createHarness();

    const out = h.call(
      validInput([
        '383',
        '383'
      ])
    );

    assert.strictEqual(
      out.code,
      'DUPLICATE_SOURCE_RECORD_ID'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'persisted observation identity mismatch fails closed',
  () => {
    const h = createHarness();

    const input = validInput();

    input.sourceReferences[1]
      .persistedSourceObservationKey =
        'pa-philadelphia|code_violations|999';

    const out = h.call(input);

    assert.strictEqual(
      out.code,
      'SOURCE_OBSERVATION_IDENTITY_MISMATCH'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      0
    );
  }
);

test(
  'exact ArcGIS request contract is preserved',
  () => {
    const h = createHarness({
      plan: successfulPlan([
        '383',
        '384'
      ])
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.outcome,
      'SOURCE_EVIDENCE_READY'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      2
    );

    h.state.fetchCalls.forEach(
      (request, index) => {
        const id =
          index === 0
            ? '383'
            : '384';

        assert.strictEqual(
          request.endpoint,
          'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query'
        );

        assert.strictEqual(
          request.context.limit,
          1
        );

        assert.strictEqual(
          request.context.cursor,
          ''
        );

        assert.strictEqual(
          request.maxLimit,
          1
        );

        assert.strictEqual(
          request.where,
          'objectid = ' + id
        );

        assert.strictEqual(
          request.outFields,
          'objectid,address,parcel_id_num,opa_account_num'
        );

        assert.strictEqual(
          request.returnGeometry,
          false
        );

        assert.deepStrictEqual(
          Object.keys(request).sort(),
          [
            'context',
            'endpoint',
            'maxLimit',
            'outFields',
            'returnGeometry',
            'where'
          ].sort()
        );
      }
    );
  }
);

test(
  'zero-row source response fails closed',
  () => {
    const h = createHarness({
      plan: [
        fetched([])
      ]
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_RECORD_NOT_FOUND'
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out,
        'sourceObservations'
      ),
      false
    );
  }
);

test(
  'multiple records fail ambiguous',
  () => {
    const h = createHarness({
      plan: [
        fetched([
          record('383'),
          record('383')
        ])
      ]
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_RECORD_AMBIGUOUS'
    );
  }
);

test(
  'transfer-limit evidence fails unique result as ambiguous',
  () => {
    const h = createHarness({
      plan: [
        fetched(
          [
            record('383')
          ],
          true
        )
      ]
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_RECORD_AMBIGUOUS'
    );
  }
);

test(
  'returned objectid mismatch fails closed',
  () => {
    const h = createHarness({
      plan: [
        fetched([
          record('999')
        ])
      ]
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_RECORD_ID_MISMATCH'
    );
  }
);

test(
  'missing projected source value fails incomplete',
  () => {
    const h = createHarness({
      plan: [
        fetched([
          record(
            '383',
            {
              opa_account_num: ''
            }
          )
        ])
      ]
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_RECORD_INCOMPLETE'
    );
  }
);

test(
  'transport failure maps to bounded retrieval failure',
  () => {
    const h = createHarness({
      plan: [
        new Error('MOCK_TRANSPORT_FAILURE')
      ]
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.code,
      'SOURCE_RETRIEVAL_FAILED'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      1
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out,
        'sourceObservations'
      ),
      false
    );
  }
);

test(
  'failure after earlier success exposes no partial observations',
  () => {
    const h = createHarness({
      plan: [
        fetched([
          record('383')
        ]),
        new Error(
          'SECOND_REFERENCE_FAILURE'
        )
      ]
    });

    const out = h.call(validInput());

    assert.strictEqual(
      out.ok,
      false
    );

    assert.strictEqual(
      out.code,
      'SOURCE_RETRIEVAL_FAILED'
    );

    assert.strictEqual(
      h.state.fetchCalls.length,
      2
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        out,
        'sourceObservations'
      ),
      false
    );
  }
);

test(
  'two-reference success creates ordered minimal observations',
  () => {
    const h = createHarness({
      plan: successfulPlan([
        '383',
        '384'
      ])
    });

    const input = validInput();

    const before =
      JSON.stringify(input);

    const out = h.call(input);

    assert.strictEqual(out.ok, true);

    assert.strictEqual(
      out.outcome,
      'SOURCE_EVIDENCE_READY'
    );

    assert.strictEqual(
      out.requestedReferenceCount,
      2
    );

    assert.strictEqual(
      out.retrievedObservationCount,
      2
    );

    assert.strictEqual(
      out.sourceObservations.length,
      2
    );

    assert.strictEqual(
      out.sourceObservations[0]
        .sourceObservationId,
      'pa-philadelphia|code_violations|383'
    );

    assert.strictEqual(
      out.sourceObservations[1]
        .sourceObservationId,
      'pa-philadelphia|code_violations|384'
    );

    assert.deepStrictEqual(
      Object.keys(
        out.sourceObservations[0]
      ).sort(),
      [
        'sourceObservationId',
        'propertyAddress',
        'parcel_id_num',
        'opa_account_num'
      ].sort()
    );

    assert.strictEqual(
      JSON.stringify(input),
      before
    );

    assertAuthorityFalse(out);
  }
);

test(
  'five-reference success remains bounded at five requests',
  () => {
    const ids = [
      '381',
      '382',
      '383',
      '384',
      '385'
    ];

    const h = createHarness({
      plan: successfulPlan(ids)
    });

    const out = h.call(
      validInput(ids)
    );

    assert.strictEqual(out.ok, true);

    assert.strictEqual(
      h.state.fetchCalls.length,
      5
    );

    assert.strictEqual(
      out.sourceObservations.length,
      5
    );

    ids.forEach((id, index) => {
      assert.strictEqual(
        out.sourceObservations[index]
          .sourceObservationId,
        'pa-philadelphia|code_violations|' +
          id
      );
    });
  }
);

test(
  'result grants no downstream authority',
  () => {
    const h = createHarness({
      plan: successfulPlan([
        '383',
        '384'
      ])
    });

    const out = h.call(validInput());

    assertAuthorityFalse(out);

    [
      'opaAccountRows',
      'ownerNameEvidence',
      'ownerMailingEvidence',
      'absenteeOwner',
      'ownerOccupied',
      'vacant',
      'mao',
      'offer'
    ].forEach(field => {
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(
          out,
          field
        ),
        false
      );
    });
  }
);

console.log('');
console.log(
  'ABSENTEE_OWNER_PHILADELPHIA_CODE_VIOLATION_SOURCE_EVIDENCE_RETRIEVER_BEHAVIOR_VALID=true'
);
console.log('BEHAVIOR_CASES=' + count);
console.log('ADMIN_BEFORE_EXTERNAL_RETRIEVAL=true');
console.log('REAL_EXTERNAL_HTTP=false');
console.log('MIN_SOURCE_REFERENCES=2');
console.log('MAX_SOURCE_REFERENCES=5');
console.log('MAX_EXTERNAL_SOURCE_REQUESTS=5');
console.log('SOURCE_REFERENCE_ORDER_PRESERVED=true');
console.log('SOURCE_REFERENCE_INPUT_UNMUTATED=true');
console.log('ATOMIC_FAILURE_VALID=true');
console.log('TRANSFER_LIMIT_AMBIGUITY_VALID=true');
console.log('SOURCE_EVIDENCE_READY_VALID=true');
console.log('DOWNSTREAM_AUTHORITY=false');
