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
    'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2.js'
  );

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const NAMESPACE =
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutProductionEntrypointV2';

const ORCHESTRATOR =
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutOrchestratorV2';

const COMPLETED =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_COMPLETED';

const PRECONDITION =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_PRECONDITION_FAILED';

const UNCERTAIN =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_V2_OUTCOME_UNCERTAIN';

const INVOCATION_UNCERTAIN =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_BOUNDED_ROLLOUT_PRODUCTION_INVOCATION_V2_OUTCOME_UNCERTAIN';

const VERIFIED =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED';

const AUTHORITY_FIELDS = [
  'productionDataMutationAuthorityGranted',
  'sourceEvidenceRetrievalAuthorityGranted',
  'ownerEvidenceRetrievalAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'propertySourceIdentityCertificationAuthorityGranted',
  'classificationAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'publicProductionRpcAuthorityGranted',
  'boundedRolloutProductionAuthorityGranted',
  'ownerOccupancyAuthorityGranted',
  'vacancyAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerGenerationAuthorityGranted',
  'offerSubmissionAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

const INPUT_FIELDS = [
  'propertySourceIdentityCertification',
  'normalLookupEvidence',
  'ownerEvidenceResult',
  'comparisonResult',
  'classificationResult'
];

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

function bundle() {
  return {
    propertySourceIdentityCertification: {
      artifact: 'certification'
    },
    normalLookupEvidence: {
      artifact: 'normal'
    },
    ownerEvidenceResult: {
      artifact: 'owner'
    },
    comparisonResult: {
      artifact: 'comparison'
    },
    classificationResult: {
      artifact: 'classification'
    }
  };
}

function options(count) {
  const size =
    count === undefined
      ? 1
      : count;

  return {
    evidenceBundles:
      Array.from(
        {
          length: size
        },
        () => bundle()
      )
  };
}

function withAuthority(result) {
  AUTHORITY_FIELDS
    .forEach(field => {
      result[field] =
        false;
    });

  return result;
}

function bundleResult(index, persistenceOutcome) {
  return {
    index: index,
    targetIdentity: {
      rowNumber:
        index + 2,
      distressLeadId:
        'DL-' + index,
      canonicalPropertyKey:
        'property|' + index
    },
    persistenceOutcome:
      persistenceOutcome || VERIFIED
  };
}

function completed(count) {
  return withAuthority({
    ok: true,
    outcome: COMPLETED,
    requestedBundleCount:
      count,
    preflightedBundleCount:
      count,
    processedBundleCount:
      count,
    verifiedPersistenceCount:
      count,
    alreadyPersistedCount:
      0,
    halted:
      false,
    bundleResults:
      Array.from(
        {
          length: count
        },
        (_, index) =>
          bundleResult(
            index,
            VERIFIED
          )
      )
  });
}

function failure(
  outcome,
  count,
  overrides
) {
  const result =
    withAuthority({
      ok: false,
      outcome: outcome,
      requestedBundleCount:
        count,
      preflightedBundleCount:
        count,
      processedBundleCount:
        0,
      verifiedPersistenceCount:
        0,
      alreadyPersistedCount:
        0,
      halted:
        true,
      bundleResults:
        [],
      code:
        'TEST_HALT',
      message:
        'bounded halt',
      haltCode:
        'TEST_HALT'
    });

  Object.assign(
    result,
    overrides || {}
  );

  return result;
}

function harness(config) {
  const settings =
    config || {};

  let adminCalls = 0;
  let orchestratorCalls = 0;
  let receivedOptions = null;

  const reos = {
    Security: {
      requireAdmin() {
        adminCalls++;

        if (
          settings.adminThrows
        ) {
          throw new Error(
            'ADMIN_REJECTED'
          );
        }
      }
    }
  };

  if (!settings.missingOrchestrator) {
    reos[ORCHESTRATOR] = {
      run(value) {
        orchestratorCalls++;
        receivedOptions =
          value;

        if (
          settings.orchestratorThrows
        ) {
          throw new Error(
            'ORCHESTRATOR_THROW'
          );
        }

        if (
          typeof settings.orchestratorResult ===
            'function'
        ) {
          return settings
            .orchestratorResult(
              value
            );
        }

        if (
          settings.orchestratorResult !==
            undefined
        ) {
          return settings
            .orchestratorResult;
        }

        return completed(
          value.evidenceBundles.length
        );
      }
    };
  }

  if (
    settings.nonFunctionRun
  ) {
    reos[ORCHESTRATOR] = {
      run: null
    };
  }

  const context = {
    REOS: reos
  };

  vm.runInNewContext(
    source,
    context,
    {
      filename: FILE
    }
  );

  return {
    execute:
      context
        .REOS[NAMESPACE]
        .execute,

    rpc:
      context
        .reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceBoundedRolloutV2,

    stats() {
      return {
        adminCalls:
          adminCalls,
        orchestratorCalls:
          orchestratorCalls,
        receivedOptions:
          receivedOptions
      };
    }
  };
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

  AUTHORITY_FIELDS
    .forEach(field => {
      assert.strictEqual(
        value[field],
        false,
        'authority unexpectedly granted: ' +
          field
      );
    });

  return value;
}

function noInventedPersistenceEvidence(
  value
) {
  [
    'evidenceEventId',
    'evidenceEventSha256',
    'previousEventSha256',
    'physicalEvidenceRowNumber',
    'persistedAt',
    'storageRow'
  ].forEach(field => {
    assert.strictEqual(
      Object.prototype
        .hasOwnProperty
        .call(
          value,
          field
        ),
      false,
      'failure invented persistence evidence: ' +
        field
    );
  });
}

let CASES = 0;

function testCase(name, fn) {
  fn();
  CASES++;

  console.log(
    'PASS ' +
    CASES +
    ' - ' +
    name
  );
}

testCase(
  'admin rejection occurs before orchestrator delegation',
  () => {
    const h =
      harness({
        adminThrows: true
      });

    assert.throws(
      () =>
        h.execute(
          options()
        ),
      /ADMIN_REJECTED/
    );

    assert.strictEqual(
      h.stats().adminCalls,
      1
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      0
    );
  }
);

testCase(
  'global RPC preserves admin rejection',
  () => {
    const h =
      harness({
        adminThrows: true
      });

    assert.throws(
      () =>
        h.rpc(
          options()
        ),
      /ADMIN_REJECTED/
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      0
    );
  }
);

[
  undefined,
  null,
  [],
  {},
  {
    evidenceBundles: [],
    extra: true
  },
  {
    evidenceBundles: {}
  }
].forEach(
  (invalid, index) => {
    testCase(
      'reject invalid top-level envelope #' +
      (index + 1),
      () => {
        const h =
          harness();

        expectFailure(
          h.execute(invalid),
          index === 5
            ? 'INVALID_OPTIONS'
            : (
              invalid &&
              Object.prototype
                .hasOwnProperty
                .call(
                  invalid,
                  'evidenceBundles'
                ) &&
              Array.isArray(
                invalid.evidenceBundles
              )
                ? 'INVALID_OPTIONS'
                : 'INVALID_OPTIONS'
            )
        );

        assert.strictEqual(
          h.stats().orchestratorCalls,
          0
        );
      }
    );
  }
);

testCase(
  'reject zero bundles',
  () => {
    const h =
      harness();

    expectFailure(
      h.execute(
        options(0)
      ),
      'INVALID_EVIDENCE_BUNDLE_COUNT'
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      0
    );
  }
);

testCase(
  'reject more than ten bundles',
  () => {
    const h =
      harness();

    expectFailure(
      h.execute(
        options(11)
      ),
      'INVALID_EVIDENCE_BUNDLE_COUNT'
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      0
    );
  }
);

INPUT_FIELDS
  .forEach(field => {
    testCase(
      'reject bundle missing ' +
      field,
      () => {
        const value =
          options();

        delete value
          .evidenceBundles[0][field];

        const h =
          harness();

        expectFailure(
          h.execute(value),
          'INVALID_EVIDENCE_BUNDLE'
        );

        assert.strictEqual(
          h.stats().orchestratorCalls,
          0
        );
      }
    );
  });

testCase(
  'reject sixth bundle field',
  () => {
    const value =
      options();

    value
      .evidenceBundles[0]
      .extra =
        true;

    const h =
      harness();

    expectFailure(
      h.execute(value),
      'INVALID_EVIDENCE_BUNDLE'
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      0
    );
  }
);

INPUT_FIELDS
  .forEach(field => {
    testCase(
      'reject non-object artifact ' +
      field,
      () => {
        const value =
          options();

        value
          .evidenceBundles[0][field] =
            null;

        const h =
          harness();

        expectFailure(
          h.execute(value),
          'INVALID_EVIDENCE_ARTIFACT'
        );

        assert.strictEqual(
          h.stats().orchestratorCalls,
          0
        );
      }
    );
  });

testCase(
  'reject missing orchestrator dependency',
  () => {
    const h =
      harness({
        missingOrchestrator:
          true
      });

    expectFailure(
      h.execute(
        options()
      ),
      'RUNTIME_DEPENDENCY_UNAVAILABLE'
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      0
    );
  }
);

testCase(
  'reject non-function orchestrator dependency',
  () => {
    const h =
      harness({
        nonFunctionRun:
          true
      });

    expectFailure(
      h.execute(
        options()
      ),
      'RUNTIME_DEPENDENCY_UNAVAILABLE'
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      0
    );
  }
);

testCase(
  'valid request delegates exactly once',
  () => {
    const h =
      harness();

    h.execute(
      options(2)
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      1
    );
  }
);

testCase(
  'original options object is delegated',
  () => {
    const value =
      options(2);

    const h =
      harness();

    h.execute(value);

    assert.strictEqual(
      h.stats().receivedOptions,
      value
    );
  }
);

testCase(
  'admin gate executes exactly once on success',
  () => {
    const h =
      harness();

    h.execute(
      options()
    );

    assert.strictEqual(
      h.stats().adminCalls,
      1
    );
  }
);

testCase(
  'global RPC delegates through the entrypoint once',
  () => {
    const h =
      harness();

    const result =
      h.rpc(
        options()
      );

    assert.strictEqual(
      h.stats().adminCalls,
      1
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      1
    );

    assert.strictEqual(
      plain(result).outcome,
      COMPLETED
    );
  }
);

testCase(
  'completed rollout passes through unchanged',
  () => {
    const upstream =
      completed(1);

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    const result =
      h.execute(
        options()
      );

    assert.strictEqual(
      result,
      upstream
    );
  }
);

testCase(
  'precondition halt passes through unchanged',
  () => {
    const upstream =
      failure(
        PRECONDITION,
        1
      );

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    const result =
      h.execute(
        options()
      );

    assert.strictEqual(
      result,
      upstream
    );

    assert.strictEqual(
      plain(result).outcome,
      PRECONDITION
    );
  }
);

testCase(
  'uncertain halt passes through unchanged',
  () => {
    const upstream =
      failure(
        UNCERTAIN,
        1
      );

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    const result =
      h.execute(
        options()
      );

    assert.strictEqual(
      result,
      upstream
    );

    assert.strictEqual(
      plain(result).outcome,
      UNCERTAIN
    );
  }
);

testCase(
  'V1-equivalent reconciliation halt is preserved',
  () => {
    const upstream =
      failure(
        PRECONDITION,
        1,
        {
          processedBundleCount:
            1,
          bundleResults: [
            {
              index: 0,
              targetIdentity: {
                rowNumber: 2,
                distressLeadId:
                  'DL-V1',
                canonicalPropertyKey:
                  'property|v1'
              },
              persistenceOutcome:
                'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED',
              code:
                'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION'
            }
          ],
          code:
            'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION',
          haltCode:
            'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION',
          haltPersistenceOutcome:
            'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED'
        }
      );

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    const result =
      h.execute(
        options()
      );

    assert.strictEqual(
      result,
      upstream
    );

    assert.strictEqual(
      plain(result).code,
      'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION'
    );
  }
);

testCase(
  'escaped orchestrator exception fails uncertain',
  () => {
    const h =
      harness({
        orchestratorThrows:
          true
      });

    const value =
      expectFailure(
        h.execute(
          options()
        ),
        'ORCHESTRATOR_EXECUTION_FAILED'
      );

    assert.strictEqual(
      value.outcome,
      INVOCATION_UNCERTAIN
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      1
    );

    noInventedPersistenceEvidence(
      value
    );
  }
);

testCase(
  'orchestrator exception is not retried',
  () => {
    const h =
      harness({
        orchestratorThrows:
          true
      });

    h.execute(
      options()
    );

    assert.strictEqual(
      h.stats().orchestratorCalls,
      1
    );
  }
);

[
  null,
  [],
  {},
  {
    ok: true
  }
].forEach(
  (badResult, index) => {
    testCase(
      'reject malformed orchestrator result #' +
      (index + 1),
      () => {
        const h =
          harness({
            orchestratorResult:
              badResult
          });

        const value =
          expectFailure(
            h.execute(
              options()
            ),
            'INVALID_ORCHESTRATOR_RESULT'
          );

        assert.strictEqual(
          value.outcome,
          INVOCATION_UNCERTAIN
        );

        assert.strictEqual(
          h.stats().orchestratorCalls,
          1
        );

        noInventedPersistenceEvidence(
          value
        );
      }
    );
  }
);

[
  [
    'bad outcome',
    value => {
      value.outcome =
        'UNKNOWN_OUTCOME';
    }
  ],
  [
    'completed with ok false',
    value => {
      value.ok = false;
    }
  ],
  [
    'completed with halted true',
    value => {
      value.halted = true;
    }
  ],
  [
    'requested count mismatch',
    value => {
      value.requestedBundleCount =
        2;
    }
  ],
  [
    'processed count mismatch',
    value => {
      value.processedBundleCount =
        0;
      value.bundleResults =
        [];
    }
  ],
  [
    'negative preflight count',
    value => {
      value.preflightedBundleCount =
        -1;
    }
  ],
  [
    'fractional processed count',
    value => {
      value.processedBundleCount =
        0.5;
    }
  ],
  [
    'verified plus already exceeds processed',
    value => {
      value.alreadyPersistedCount =
        1;
    }
  ],
  [
    'bundle result count mismatch',
    value => {
      value.bundleResults =
        [];
    }
  ],
  [
    'malformed bundle result',
    value => {
      value.bundleResults[0] = {
        index: 0,
        persistenceOutcome:
          VERIFIED
      };
    }
  ]
].forEach(
  ([name, mutate]) => {
    testCase(
      'reject ' + name,
      () => {
        const upstream =
          completed(1);

        mutate(upstream);

        const h =
          harness({
            orchestratorResult:
              upstream
          });

        expectFailure(
          h.execute(
            options()
          ),
          'INVALID_ORCHESTRATOR_RESULT'
        );

        assert.strictEqual(
          h.stats().orchestratorCalls,
          1
        );
      }
    );
  }
);

testCase(
  'reject failure outcome missing halt code',
  () => {
    const upstream =
      failure(
        PRECONDITION,
        1
      );

    delete upstream.haltCode;

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    expectFailure(
      h.execute(
        options()
      ),
      'INVALID_ORCHESTRATOR_RESULT'
    );
  }
);

testCase(
  'reject failure outcome marked not halted',
  () => {
    const upstream =
      failure(
        PRECONDITION,
        1
      );

    upstream.halted =
      false;

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    expectFailure(
      h.execute(
        options()
      ),
      'INVALID_ORCHESTRATOR_RESULT'
    );
  }
);

AUTHORITY_FIELDS
  .forEach(field => {
    testCase(
      'reject true upstream authority ' +
      field,
      () => {
        const upstream =
          completed(1);

        upstream[field] =
          true;

        const h =
          harness({
            orchestratorResult:
              upstream
          });

        const result =
          expectFailure(
            h.execute(
              options()
            ),
            'INVALID_ORCHESTRATOR_RESULT'
          );

        assert.strictEqual(
          result[field],
          false
        );

        assert.strictEqual(
          h.stats().orchestratorCalls,
          1
        );
      }
    );
  });

testCase(
  'reject missing required upstream authority field',
  () => {
    const upstream =
      completed(1);

    delete upstream
      .productionDataMutationAuthorityGranted;

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    expectFailure(
      h.execute(
        options()
      ),
      'INVALID_ORCHESTRATOR_RESULT'
    );
  }
);

testCase(
  'reject unexpected true additive authority field',
  () => {
    const upstream =
      completed(1);

    upstream
      .futureUnexpectedAuthorityGranted =
        true;

    const h =
      harness({
        orchestratorResult:
          upstream
      });

    expectFailure(
      h.execute(
        options()
      ),
      'INVALID_ORCHESTRATOR_RESULT'
    );
  }
);

assert.ok(
  CASES >= 48,
  'behavior suite must contain at least 48 cases'
);

console.log('');
console.log(
  'ABSENTEE_OWNER_V2_BOUNDED_ROLLOUT_PRODUCTION_ENTRYPOINT_BEHAVIOR_VALID=true'
);

console.log(
  'BEHAVIOR_CASE_COUNT=' +
  CASES
);

console.log(
  'ADMIN_REJECTION_BEFORE_DELEGATION=true'
);

console.log(
  'EXACT_SINGLE_DELEGATION=true'
);

console.log(
  'ORIGINAL_OPTIONS_DELEGATION=true'
);

console.log(
  'PRECONDITION_HALT_PRESERVED=true'
);

console.log(
  'UNCERTAIN_HALT_PRESERVED=true'
);

console.log(
  'V1_RECONCILIATION_HALT_PRESERVED=true'
);

console.log(
  'ESCAPED_EXCEPTION_FAIL_CLOSED=true'
);

console.log(
  'MALFORMED_RESULT_FAIL_CLOSED=true'
);

console.log(
  'UNEXPECTED_TRUE_AUTHORITY_FAIL_CLOSED=true'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORITY=false'
);

console.log(
  'SCHEDULER_AUTHORITY=false'
);

console.log(
  'TRIGGER_AUTHORITY=false'
);

console.log(
  'ACQUISITION_AUTHORITY_VECTOR_FALSE=true'
);
