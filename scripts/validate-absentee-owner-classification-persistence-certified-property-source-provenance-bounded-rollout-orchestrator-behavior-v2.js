#!/usr/bin/env node
'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const path =
  require('node:path');

const vm =
  require('node:vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const RUNTIME =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2.js'
  );

const VERIFIED =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED';

const ALREADY =
  'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED';

const PRECONDITION =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED';

const UNCERTAIN =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN';

const V1_EQUIVALENT =
  'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION';

const MINIMUM_CASES = 46;

const source =
  fs.readFileSync(
    RUNTIME,
    'utf8'
  );

function digest(value) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
}

function bundle(id) {
  return {
    propertySourceIdentityCertification: {
      caseId: id
    },

    normalLookupEvidence: {
      caseId: id
    },

    ownerEvidenceResult: {
      caseId: id
    },

    comparisonResult: {
      caseId: id
    },

    classificationResult: {
      caseId: id
    }
  };
}

function plan(id, override) {
  const value = String(id);

  const result = {
    ok: true,

    target: {
      rowNumber:
        1000 +
        parseInt(
          digest(value)
            .slice(0, 4),
          16
        ),

      identity: {
        'Distress Lead ID':
          'DL-' +
          value,

        'Canonical Property Key':
          'property|test|' +
          value
      }
    },

    evidenceEventId:
      'AOCE2-' +
      digest(
        'event|' +
        value
      )
  };

  if (override) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(
          override,
          'rowNumber'
        )
    ) {
      result.target.rowNumber =
        override.rowNumber;
    }

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          override,
          'distressLeadId'
        )
    ) {
      result.target.identity[
        'Distress Lead ID'
      ] =
        override.distressLeadId;
    }

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          override,
          'canonicalPropertyKey'
        )
    ) {
      result.target.identity[
        'Canonical Property Key'
      ] =
        override.canonicalPropertyKey;
    }

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          override,
          'evidenceEventId'
        )
    ) {
      result.evidenceEventId =
        override.evidenceEventId;
    }
  }

  return result;
}

function idFromBundle(value) {
  return value
    .classificationResult
    .caseId;
}

function environment(config) {
  config =
    config ||
    {};

  const state = {
    plannerCalls: [],
    executorCalls: []
  };

  const REOS = {};

  if (
    config.missingPlanner !==
    true
  ) {
    REOS
      .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2 = {
        prepare(value) {
          state
            .plannerCalls
            .push(value);

          if (
            typeof config.planner ===
            'function'
          ) {
            return config.planner(
              value,
              state
            );
          }

          return plan(
            idFromBundle(
              value
            )
          );
        }
      };
  }

  if (
    config.missingExecutor !==
    true
  ) {
    REOS
      .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2 = {
        execute(value) {
          state
            .executorCalls
            .push(value);

          if (
            typeof config.executor ===
            'function'
          ) {
            return config.executor(
              value,
              state
            );
          }

          const id =
            idFromBundle(
              value
            );

          return {
            ok: true,
            outcome: VERIFIED,
            disposition: 'PERSISTED',
            classifierResultSha256:
              digest(
                'classifier|' +
                id
              ),
            evidenceEventId:
              'AOCE2-' +
              digest(
                'event|' +
                id
              ),
            evidenceEventSha256:
              digest(
                'evidence|' +
                id
              ),
            physicalEvidenceRowNumber:
              2000
          };
        }
      };
  }

  const sandbox = {
    REOS: REOS
  };

  const context =
    vm.createContext(
      sandbox
    );

  vm.runInContext(
    source,
    context,
    {
      filename:
        RUNTIME
    }
  );

  return {
    api:
      sandbox
        .REOS
        .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2,

    state: state
  };
}

function run(
  config,
  evidenceBundles
) {
  const env =
    environment(
      config
    );

  return {
    env: env,

    result:
      env.api.run({
        evidenceBundles:
          evidenceBundles
      })
  };
}

let cases = 0;

function test(name, work) {
  work();

  cases++;

  console.log(
    'PASS ' +
    cases +
    ' - ' +
    name
  );
}

test(
  'rejects null options',
  function () {
    const env =
      environment();

    const result =
      env.api.run(
        null
      );

    assert.equal(
      result.ok,
      false
    );

    assert.equal(
      result.code,
      'INVALID_OPTIONS'
    );

    assert.equal(
      env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'rejects array options',
  function () {
    const env =
      environment();

    const result =
      env.api.run(
        []
      );

    assert.equal(
      result.code,
      'INVALID_OPTIONS'
    );
  }
);

test(
  'rejects missing evidenceBundles',
  function () {
    const env =
      environment();

    const result =
      env.api.run(
        {}
      );

    assert.equal(
      result.code,
      'INVALID_OPTIONS'
    );
  }
);

test(
  'rejects extra outer option',
  function () {
    const env =
      environment();

    const result =
      env.api.run({
        evidenceBundles: [
          bundle('a')
        ],
        extra: true
      });

    assert.equal(
      result.code,
      'INVALID_OPTIONS'
    );
  }
);

test(
  'rejects non-array evidenceBundles',
  function () {
    const env =
      environment();

    const result =
      env.api.run({
        evidenceBundles: {}
      });

    assert.equal(
      result.code,
      'INVALID_OPTIONS'
    );
  }
);

test(
  'rejects zero bundles',
  function () {
    const result =
      run(
        {},
        []
      ).result;

    assert.equal(
      result.code,
      'INVALID_EVIDENCE_BUNDLE_COUNT'
    );
  }
);

test(
  'rejects more than ten bundles',
  function () {
    const bundles =
      Array.from(
        {
          length: 11
        },
        (_, index) =>
          bundle(
            String(index)
          )
      );

    const result =
      run(
        {},
        bundles
      ).result;

    assert.equal(
      result.code,
      'INVALID_EVIDENCE_BUNDLE_COUNT'
    );
  }
);

test(
  'rejects null bundle envelope',
  function () {
    const result =
      run(
        {},
        [
          null
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_EVIDENCE_BUNDLE'
    );
  }
);

test(
  'rejects array bundle envelope',
  function () {
    const result =
      run(
        {},
        [
          []
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_EVIDENCE_BUNDLE'
    );
  }
);

test(
  'rejects missing artifact',
  function () {
    const value =
      bundle('a');

    delete value
      .comparisonResult;

    const result =
      run(
        {},
        [
          value
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_EVIDENCE_BUNDLE'
    );
  }
);

test(
  'rejects extra artifact',
  function () {
    const value =
      bundle('a');

    value.persistencePlan =
      {};

    const result =
      run(
        {},
        [
          value
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_EVIDENCE_BUNDLE'
    );
  }
);

test(
  'accepts exact five-artifact envelope',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.ok,
      true
    );
  }
);

test(
  'fails closed when planner dependency missing',
  function () {
    const result =
      run(
        {
          missingPlanner:
            true
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'ROLLOUT_DEPENDENCY_UNAVAILABLE'
    );
  }
);

test(
  'fails closed when executor dependency missing',
  function () {
    const result =
      run(
        {
          missingExecutor:
            true
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'ROLLOUT_DEPENDENCY_UNAVAILABLE'
    );
  }
);

test(
  'planner exception halts before executor',
  function () {
    const outcome =
      run(
        {
          planner() {
            throw new Error(
              'forced'
            );
          }
        },
        [
          bundle('a')
        ]
      );

    assert.equal(
      outcome.result.code,
      'PLANNER_EXECUTION_FAILED'
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'later planner exception still yields zero executor calls',
  function () {
    const outcome =
      run(
        {
          planner(value) {
            if (
              idFromBundle(
                value
              ) === 'b'
            ) {
              throw new Error(
                'forced'
              );
            }

            return plan(
              idFromBundle(
                value
              )
            );
          }
        },
        [
          bundle('a'),
          bundle('b'),
          bundle('c')
        ]
      );

    assert.equal(
      outcome.env.state
        .plannerCalls
        .length,
      3
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'planner rejection halts before executor',
  function () {
    const outcome =
      run(
        {
          planner() {
            return {
              ok: false,
              code:
                'FORCED_REJECTION'
            };
          }
        },
        [
          bundle('a')
        ]
      );

    assert.equal(
      outcome.result.code,
      'FORCED_REJECTION'
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'later planner rejection still preflights all bundles',
  function () {
    const outcome =
      run(
        {
          planner(value) {
            const id =
              idFromBundle(
                value
              );

            if (
              id === 'b'
            ) {
              return {
                ok: false,
                code:
                  'LATER_REJECTION'
              };
            }

            return plan(id);
          }
        },
        [
          bundle('a'),
          bundle('b'),
          bundle('c')
        ]
      );

    assert.equal(
      outcome.env.state
        .plannerCalls
        .length,
      3
    );

    assert.equal(
      outcome.result.code,
      'LATER_REJECTION'
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'null planner result is rejected',
  function () {
    const result =
      run(
        {
          planner() {
            return null;
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'V2_PLANNER_REJECTED'
    );
  }
);

test(
  'invalid planner target is rejected',
  function () {
    const result =
      run(
        {
          planner() {
            return {
              ok: true,
              evidenceEventId:
                'AOCE2-' +
                digest('x')
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_PLANNER_RESULT'
    );
  }
);

test(
  'planner row below two is rejected',
  function () {
    const result =
      run(
        {
          planner() {
            return plan(
              'a',
              {
                rowNumber: 1
              }
            );
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_PLANNER_RESULT'
    );
  }
);

test(
  'blank distress lead identity is rejected',
  function () {
    const result =
      run(
        {
          planner() {
            return plan(
              'a',
              {
                distressLeadId: ''
              }
            );
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_PLANNER_RESULT'
    );
  }
);

test(
  'blank canonical property identity is rejected',
  function () {
    const result =
      run(
        {
          planner() {
            return plan(
              'a',
              {
                canonicalPropertyKey:
                  ''
              }
            );
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_PLANNER_RESULT'
    );
  }
);

test(
  'non-v2 deterministic event id is rejected',
  function () {
    const result =
      run(
        {
          planner() {
            return plan(
              'a',
              {
                evidenceEventId:
                  'invalid'
              }
            );
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'INVALID_PLANNER_RESULT'
    );
  }
);

test(
  'duplicate physical row rejected before executor',
  function () {
    const outcome =
      run(
        {
          planner(value) {
            return plan(
              idFromBundle(
                value
              ),
              {
                rowNumber: 100
              }
            );
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      );

    assert.equal(
      outcome.result.code,
      'DUPLICATE_PHYSICAL_TARGET_ROW'
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'duplicate dual identity rejected before executor',
  function () {
    const outcome =
      run(
        {
          planner(value) {
            const id =
              idFromBundle(
                value
              );

            return plan(
              id,
              {
                rowNumber:
                  id === 'a'
                    ? 100
                    : 101,

                distressLeadId:
                  'DL-SAME',

                canonicalPropertyKey:
                  'property|same'
              }
            );
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      );

    assert.equal(
      outcome.result.code,
      'DUPLICATE_TARGET_DUAL_IDENTITY'
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'duplicate event id rejected before executor',
  function () {
    const sameEvent =
      'AOCE2-' +
      digest(
        'same-event'
      );

    const outcome =
      run(
        {
          planner(value) {
            const id =
              idFromBundle(
                value
              );

            return plan(
              id,
              {
                rowNumber:
                  id === 'a'
                    ? 100
                    : 101,

                evidenceEventId:
                  sameEvent
              }
            );
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      );

    assert.equal(
      outcome.result.code,
      'DUPLICATE_DETERMINISTIC_V2_EVENT_ID'
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      0
    );
  }
);

test(
  'one verified result completes',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.verifiedPersistenceCount,
      1
    );
  }
);

test(
  'one already-persisted result completes',
  function () {
    const result =
      run(
        {
          executor() {
            return {
              ok: true,
              outcome:
                ALREADY,
              disposition:
                'ALREADY_PERSISTED'
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.alreadyPersistedCount,
      1
    );
  }
);

test(
  'mixed verified and already counts are exact',
  function () {
    const result =
      run(
        {
          executor(value) {
            const id =
              idFromBundle(
                value
              );

            return {
              ok: true,
              outcome:
                id === 'a'
                  ? VERIFIED
                  : ALREADY,
              disposition:
                id === 'a'
                  ? 'PERSISTED'
                  : 'ALREADY_PERSISTED'
            };
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      ).result;

    assert.equal(
      result.verifiedPersistenceCount,
      1
    );

    assert.equal(
      result.alreadyPersistedCount,
      1
    );
  }
);

test(
  'caller order is preserved',
  function () {
    const outcome =
      run(
        {},
        [
          bundle('a'),
          bundle('b'),
          bundle('c')
        ]
      );

    assert.deepEqual(
      outcome.env.state
        .executorCalls
        .map(idFromBundle),
      [
        'a',
        'b',
        'c'
      ]
    );
  }
);

test(
  'executor receives original bundle objects',
  function () {
    const a =
      bundle('a');

    const b =
      bundle('b');

    const outcome =
      run(
        {},
        [
          a,
          b
        ]
      );

    assert.equal(
      outcome.env.state
        .executorCalls[0],
      a
    );

    assert.equal(
      outcome.env.state
        .executorCalls[1],
      b
    );
  }
);

test(
  'exact maximum of ten bundles succeeds',
  function () {
    const values =
      Array.from(
        {
          length: 10
        },
        (_, index) =>
          bundle(
            'max-' +
            index
          )
      );

    const result =
      run(
        {},
        values
      ).result;

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.processedBundleCount,
      10
    );
  }
);

test(
  'precondition outcome halts immediately',
  function () {
    const outcome =
      run(
        {
          executor(value) {
            if (
              idFromBundle(
                value
              ) === 'b'
            ) {
              return {
                ok: false,
                outcome:
                  PRECONDITION,
                code:
                  'FORCED_PRECONDITION'
              };
            }

            return {
              ok: true,
              outcome:
                VERIFIED
            };
          }
        },
        [
          bundle('a'),
          bundle('b'),
          bundle('c')
        ]
      );

    assert.equal(
      outcome.result.halted,
      true
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      2
    );
  }
);

test(
  'precondition halt index is exact',
  function () {
    const result =
      run(
        {
          executor() {
            return {
              ok: false,
              outcome:
                PRECONDITION,
              code:
                'PRE'
            };
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      ).result;

    assert.equal(
      result.haltIndex,
      0
    );
  }
);

test(
  'uncertain outcome halts immediately',
  function () {
    const outcome =
      run(
        {
          executor() {
            return {
              ok: false,
              outcome:
                UNCERTAIN,
              code:
                'UNCERTAIN_FORCED'
            };
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      );

    assert.equal(
      outcome.result.haltPersistenceOutcome,
      UNCERTAIN
    );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      1
    );
  }
);

test(
  'v1 equivalent reconciliation code halts rollout',
  function () {
    const result =
      run(
        {
          executor() {
            return {
              ok: false,
              outcome:
                PRECONDITION,
              code:
                V1_EQUIVALENT
            };
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      ).result;

    assert.equal(
      result.haltCode,
      V1_EQUIVALENT
    );
  }
);

test(
  'escaped executor exception becomes uncertain',
  function () {
    const result =
      run(
        {
          executor() {
            throw new Error(
              'forced'
            );
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'ESCAPED_EXECUTOR_EXCEPTION'
    );

    assert.equal(
      result.haltPersistenceOutcome,
      UNCERTAIN
    );
  }
);

test(
  'escaped executor exception is never retried',
  function () {
    const outcome =
      run(
        {
          executor() {
            throw new Error(
              'forced'
            );
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      );

    assert.equal(
      outcome.env.state
        .executorCalls
        .length,
      1
    );
  }
);

test(
  'null executor result becomes uncertain',
  function () {
    const result =
      run(
        {
          executor() {
            return null;
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'UNEXPECTED_EXECUTOR_RESULT'
    );

    assert.equal(
      result.haltPersistenceOutcome,
      UNCERTAIN
    );
  }
);

test(
  'unrecognized executor result becomes uncertain',
  function () {
    const result =
      run(
        {
          executor() {
            return {
              ok: false,
              outcome:
                'UNKNOWN'
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.code,
      'UNEXPECTED_EXECUTOR_RESULT'
    );
  }
);

test(
  'verified classifier hash passes through',
  function () {
    const sha =
      digest(
        'classifier'
      );

    const result =
      run(
        {
          executor() {
            return {
              ok: true,
              outcome:
                VERIFIED,
              classifierResultSha256:
                sha
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.bundleResults[0]
        .classifierResultSha256,
      sha
    );
  }
);

test(
  'verified event id passes through',
  function () {
    const event =
      'AOCE2-' +
      digest(
        'event'
      );

    const result =
      run(
        {
          executor() {
            return {
              ok: true,
              outcome:
                VERIFIED,
              evidenceEventId:
                event
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.bundleResults[0]
        .evidenceEventId,
      event
    );
  }
);

test(
  'verified event sha passes through',
  function () {
    const sha =
      digest(
        'event-sha'
      );

    const result =
      run(
        {
          executor() {
            return {
              ok: true,
              outcome:
                VERIFIED,
              evidenceEventSha256:
                sha
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.bundleResults[0]
        .evidenceEventSha256,
      sha
    );
  }
);

test(
  'verified physical evidence row passes through',
  function () {
    const result =
      run(
        {
          executor() {
            return {
              ok: true,
              outcome:
                VERIFIED,
              physicalEvidenceRowNumber:
                123
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.bundleResults[0]
        .physicalEvidenceRowNumber,
      123
    );
  }
);

test(
  'disposition passes through only when executor returns it',
  function () {
    const result =
      run(
        {
          executor() {
            return {
              ok: true,
              outcome:
                VERIFIED,
              disposition:
                'PERSISTED'
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.bundleResults[0]
        .disposition,
      'PERSISTED'
    );
  }
);

test(
  'optional persistence evidence is not invented',
  function () {
    const result =
      run(
        {
          executor() {
            return {
              ok: true,
              outcome:
                VERIFIED
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          result.bundleResults[0],
          'evidenceEventSha256'
        ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty
        .call(
          result.bundleResults[0],
          'physicalEvidenceRowNumber'
        ),
      false
    );
  }
);

test(
  'target identity is derived from preflight plan',
  function () {
    const result =
      run(
        {
          planner() {
            return plan(
              'a',
              {
                rowNumber: 222,
                distressLeadId:
                  'DL-222',
                canonicalPropertyKey:
                  'property|222'
              }
            );
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          result.bundleResults[0]
            .targetIdentity
        )
      ),
      {
        rowNumber: 222,
        distressLeadId:
          'DL-222',
        canonicalPropertyKey:
          'property|222'
      }
    );
  }
);

test(
  'requested count is exact',
  function () {
    const result =
      run(
        {},
        [
          bundle('a'),
          bundle('b')
        ]
      ).result;

    assert.equal(
      result.requestedBundleCount,
      2
    );
  }
);

test(
  'preflighted count is exact on success',
  function () {
    const result =
      run(
        {},
        [
          bundle('a'),
          bundle('b')
        ]
      ).result;

    assert.equal(
      result.preflightedBundleCount,
      2
    );
  }
);

test(
  'processed count is exact on success',
  function () {
    const result =
      run(
        {},
        [
          bundle('a'),
          bundle('b')
        ]
      ).result;

    assert.equal(
      result.processedBundleCount,
      2
    );
  }
);

test(
  'planner rejection keeps processed count zero',
  function () {
    const result =
      run(
        {
          planner() {
            return {
              ok: false,
              code:
                'NO'
            };
          }
        },
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.processedBundleCount,
      0
    );
  }
);

test(
  'duplicate rejection keeps processed count zero',
  function () {
    const result =
      run(
        {
          planner(value) {
            return plan(
              idFromBundle(
                value
              ),
              {
                rowNumber: 55
              }
            );
          }
        },
        [
          bundle('a'),
          bundle('b')
        ]
      ).result;

    assert.equal(
      result.processedBundleCount,
      0
    );
  }
);

test(
  'success is not halted',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.halted,
      false
    );
  }
);

test(
  'production data mutation authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.productionDataMutationAuthorityGranted,
      false
    );
  }
);

test(
  'source retrieval authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.sourceEvidenceRetrievalAuthorityGranted,
      false
    );
  }
);

test(
  'classification authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.classificationAuthorityGranted,
      false
    );
  }
);

test(
  'public production rpc authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.publicProductionRpcAuthorityGranted,
      false
    );
  }
);

test(
  'bounded production rollout authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.boundedRolloutProductionAuthorityGranted,
      false
    );
  }
);

test(
  'scheduler authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.schedulerAuthorityGranted,
      false
    );
  }
);

test(
  'trigger authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.triggerAuthorityGranted,
      false
    );
  }
);

test(
  'occupancy authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.ownerOccupancyAuthorityGranted,
      false
    );
  }
);

test(
  'vacancy authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.vacancyAuthorityGranted,
      false
    );
  }
);

test(
  'qualified deal queue authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.qualifiedDealQueueAuthorityGranted,
      false
    );
  }
);

test(
  'acquisition lifecycle authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.acquisitionLifecycleAuthorityGranted,
      false
    );
  }
);

test(
  'arv authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.arvAuthorityGranted,
      false
    );
  }
);

test(
  'repair scope authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.repairScopeAuthorityGranted,
      false
    );
  }
);

test(
  'mao authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.maoAuthorityGranted,
      false
    );
  }
);

test(
  'offer generation authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.offerGenerationAuthorityGranted,
      false
    );
  }
);

test(
  'offer submission authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.offerSubmissionAuthorityGranted,
      false
    );
  }
);

test(
  'automatic offer authority remains false',
  function () {
    const result =
      run(
        {},
        [
          bundle('a')
        ]
      ).result;

    assert.equal(
      result.automaticOfferAuthorityGranted,
      false
    );
  }
);

assert.ok(
  cases >=
    MINIMUM_CASES,
  'behavior suite must contain at least ' +
    MINIMUM_CASES +
    ' cases'
);

console.log(
  'BEHAVIOR_CASE_COUNT=' +
  cases
);

console.log(
  'ABSENTEE_OWNER_V2_BOUNDED_ROLLOUT_ORCHESTRATOR_BEHAVIOR_VALIDATION_PASS=true'
);
