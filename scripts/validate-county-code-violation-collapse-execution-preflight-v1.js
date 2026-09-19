'use strict';

const assert =
  require('assert');

const fs =
  require('fs');

const vm =
  require('vm');

const crypto =
  require('crypto');

const path =
  require('path');

const FILE =
  path.resolve(
    __dirname,
    '../build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js'
  );

const EXPECTED_SOURCE_SHA =
  'f5c6181b9e5de72cb9ab1c3479940b426576778826d02c474331419b485b9bc8';

const AUTHORITY_SHA =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const WINNER_FINGERPRINT =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const COUNTY_ID =
  'DL-20260820181647-4170';

const ZILLOW_ID =
  'ZIL-20260820193920-1756';

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

assert.strictEqual(
  crypto
    .createHash('sha256')
    .update(source)
    .digest('hex'),
  EXPECTED_SOURCE_SHA
);

for (const pattern of [
  /\.\s*(?:setValues?|setFormulas?|appendRow|deleteRows?|insertRows?\w*|clear\w*)\s*\(/,
  /Database\s*\.\s*(?:insert|update|upsert|softDelete|delete|remove|ensureTable)\s*\(/,
  /\.\s*(?:newTrigger|deleteTrigger|setCheckpoint|saveCheckpoint|resetCheckpoint)\s*\(/,
  /\.\s*(?:setProperty|setProperties|deleteProperty|deleteAllProperties)\s*\(/
]) {
  assert.strictEqual(
    pattern.test(source),
    false,
    'Forbidden preflight surface: ' +
      pattern
  );
}

const PLAN_FLAGS = [
  'winnerSelectionAuthorityGranted',
  'collapseAuthorityGranted',
  'deleteAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

const EVIDENCE_FLAGS = [
  'productionDataMutationAuthorityGranted',
  'collapseAuthorityGranted',
  'winnerSelectionAuthorityGranted',
  'deleteAuthorityGranted',
  'physicalDeleteAuthorityGranted',
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'referenceRewriteAuthorityGranted',
  'schedulerMutationAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'group3ReexecutionAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

const copy =
  value =>
    JSON.parse(
      JSON.stringify(
        value
      )
    );

function fixture() {
  const plan = {
    ok:
      true,

    mode:
      'READ_ONLY_CODE_VIOLATION_COLLAPSE_WINNER_PLAN',

    authoritySha256:
      AUTHORITY_SHA,

    planFingerprintSha256:
      WINNER_FINGERPRINT,

    eligibleGroupCount:
      20,

    eligibleRowCount:
      42,

    directKeepGroupCount:
      14,

    observationMergeGroupCount:
      6,

    deleteCandidateRowCount:
      22,

    blockedGroupCount:
      1,

    plans:
      Array.from(
        {
          length:
            22
        },
        (_, index) => ({
          groupNumber:
            index + 1
        })
      ).filter(
        entry =>
          entry.groupNumber !== 1 &&
          entry.groupNumber !== 3
      ),

    blockedGroups: [
      {
        groupNumber:
          1
      }
    ]
  };

  PLAN_FLAGS.forEach(
    field => {
      plan[field] =
        false;
    }
  );

  const group3 = {
    ok:
      true,

    readOnly:
      true,

    schedulerFrozen:
      true,

    checkpointFrozen:
      true,

    evidenceStable:
      true,

    group3AlreadyRestored:
      true,

    group3ReexecutionRequired:
      false,

    countySurvivor: {
      rowNumber:
        767,

      distressLeadId:
        COUNTY_ID
    },

    zillowRestoration: {
      rowNumber:
        771,

      distressLeadId:
        ZILLOW_ID
    },

    downstreamReference: {
      rowNumber:
        38,

      columnNumber:
        13,

      distressLeadId:
        ZILLOW_ID
    }
  };

  EVIDENCE_FLAGS.forEach(
    field => {
      group3[field] =
        false;
    }
  );

  const checkpoint = {
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

  const calls = [];

  const context = {
    REOS: {
      Security: {
        requireAdmin() {
          calls.push(
            'admin'
          );
        }
      },

      Database: {
        deletePhysicalRowExact() {
          calls.push(
            'physical-delete'
          );

          throw new Error(
            'PREFLIGHT_MUST_NOT_CALL_PHYSICAL_DELETE'
          );
        }
      },

      CountyCodeViolationGroup3PostRestorationEvidence: {
        read(options) {
          calls.push(
            'group3-evidence'
          );

          assert.strictEqual(
            Object.keys(
              options || {}
            ).length,
            0
          );

          return copy(
            group3
          );
        }
      },

      CountyCodeViolationCollapseWinnerPlan: {
        buildPlan(options) {
          calls.push(
            'plan'
          );

          assert.strictEqual(
            Object.keys(
              options || {}
            ).length,
            0
          );

          return copy(
            plan
          );
        }
      },

      CountyProductionScheduler: {
        getCheckpoint() {
          calls.push(
            'checkpoint'
          );

          return copy(
            checkpoint
          );
        }
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        calls.push(
          'triggers'
        );

        return [];
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
      timeout:
        1000
    }
  );

  return {
    context,
    plan,
    group3,
    checkpoint,
    calls
  };
}

function run(
  fixtureValue,
  options = {}
) {
  fixtureValue.context.options =
    options;

  return vm.runInContext(
    'reosCountyCodeViolationCollapseExecutionPreflight(options)',
    fixtureValue.context,
    {
      timeout:
        1000
    }
  );
}

function rejects(
  edit,
  pattern
) {
  const value =
    fixture();

  edit(
    value
  );

  assert.throws(
    () =>
      run(
        value
      ),
    pattern
  );
}

const success =
  fixture();

const before =
  JSON.stringify([
    success.plan,
    success.group3,
    success.checkpoint
  ]);

const result =
  run(
    success
  );

assert.strictEqual(
  result.ok,
  true
);

assert.strictEqual(
  result.mode,
  'READ_ONLY_CODE_VIOLATION_COLLAPSE_EXECUTION_PREFLIGHT'
);

assert.strictEqual(
  result.authoritySha256,
  AUTHORITY_SHA
);

assert.strictEqual(
  result.winnerPlanFingerprintSha256,
  WINNER_FINGERPRINT
);

assert.strictEqual(
  result.blockedGroupCount,
  1
);

assert.strictEqual(
  result.conflictBlockedGroup,
  1
);

assert.strictEqual(
  result.referenceBlockedGroup,
  null
);

assert.strictEqual(
  result.group3PostRestorationEvidenceCertified,
  true
);

assert.strictEqual(
  result.group3CountySurvivorDistressLeadId,
  COUNTY_ID
);

assert.strictEqual(
  result.group3ZillowDistressLeadId,
  ZILLOW_ID
);

assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      result.executionBlockers
    )
  ),
  [
    'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
    'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED'
  ]
);

for (const field of [
  ...PLAN_FLAGS,
  'executionAuthorityGranted',
  'group3ReexecutionAuthorityGranted',
  'collapseExecutionReady'
]) {
  assert.strictEqual(
    result[field],
    false,
    field
  );
}

assert.strictEqual(
  JSON.stringify([
    success.plan,
    success.group3,
    success.checkpoint
  ]),
  before
);

assert.deepStrictEqual(
  success.calls,
  [
    'admin',
    'triggers',
    'checkpoint',
    'group3-evidence',
    'plan',
    'checkpoint',
    'triggers'
  ]
);

const opt =
  fixture();

assert.throws(
  () =>
    run(
      opt,
      {
        execute:
          true
      }
    ),
  /Caller-defined/
);

assert.deepStrictEqual(
  opt.calls,
  [
    'admin'
  ]
);

rejects(
  value => {
    value.plan.authoritySha256 =
      'DRIFT';
  },
  /authority SHA changed/
);

rejects(
  value => {
    value.plan.planFingerprintSha256 =
      'DRIFT';
  },
  /fingerprint changed/
);

rejects(
  value => {
    value.plan.blockedGroupCount =
      2;
  },
  /population changed/
);

rejects(
  value => {
    value.plan.blockedGroups.push({
      groupNumber:
        3
    });
  },
  /blocked-group array changed|Expected blocked/
);

rejects(
  value => {
    value.group3.evidenceStable =
      false;
  },
  /Group 3 post-restoration evidence changed/
);

rejects(
  value => {
    value.group3.zillowRestoration.distressLeadId =
      'DRIFT';
  },
  /Zillow restoration evidence changed/
);

rejects(
  value => {
    value.group3.group3ReexecutionAuthorityGranted =
      true;
  },
  /unexpectedly grants authority/
);

rejects(
  value => {
    value.checkpoint.currentFeedCursor =
      'DRIFT';
  },
  /Frozen county checkpoint/
);

rejects(
  value => {
    value.context.ScriptApp.getProjectTriggers =
      () => [
        {
          getHandlerFunction() {
            return 'reosCountyProductionSchedulerRun';
          }
        }
      ];
  },
  /scheduler is not frozen/
);

{
  const value =
    fixture();

  delete value.context.REOS
    .CountyCodeViolationGroup3PostRestorationEvidence;

  assert.throws(
    () =>
      run(
        value
      ),
    /Group 3 post-restoration evidence is required/
  );
}

{
  const wrapper =
    fixture();

  const args = [];
  const sentinel = {};

  wrapper.context.REOS
    .CountyCodeViolationCollapseExecutionPreflight = {
      preflight(options) {
        args.push(
          options
        );

        return sentinel;
      }
    };

  const supplied = {
    probe:
      true
  };

  assert.strictEqual(
    run(
      wrapper,
      supplied
    ),
    sentinel
  );

  assert.strictEqual(
    args[0],
    supplied
  );
}

console.log(
  'SOURCE_SHA256_VERIFIED=true'
);

console.log(
  'STATIC_READ_ONLY_CHECKS_PASSED=true'
);

console.log(
  'POST_RESTORATION_PREFLIGHT_AUTHORITY_SHA=8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7'
);

console.log(
  'POST_RESTORATION_PREFLIGHT_WINNER_FINGERPRINT=9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce'
);

console.log(
  'POST_RESTORATION_PREFLIGHT_BLOCKED_GROUP_COUNT=1'
);

console.log(
  'GROUP3_POST_RESTORATION_EVIDENCE_REQUIRED=true'
);

console.log(
  'LEASE_COMPATIBILITY_BLOCKER_PRESENT=true'
);

console.log(
  'COLLAPSE_EXECUTION_READY=false'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'GROUP3_REEXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);

console.log(
  'PREFLIGHT_VALIDATOR_PASSED=true'
);
