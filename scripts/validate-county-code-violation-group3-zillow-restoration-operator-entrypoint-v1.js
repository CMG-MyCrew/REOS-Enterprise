#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const OPERATOR =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyCodeViolationGroup3ZillowRestorationOperator.js'
  );

const RPC =
  'reosCountyCodeViolationGroup3ZillowRestorationExecute';

const CHECKPOINT_ID =
  'COUNTY-20260902222607805';

const CHECKPOINT_CURSOR =
  'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281';

const source =
  fs.readFileSync(
    OPERATOR,
    'utf8'
  );

function countMatches(regex) {
  return (
    source.match(regex) ||
    []
  ).length;
}

function validRequest() {
  return {
    confirmRestoration: true,
    checkpointId: CHECKPOINT_ID,
    checkpointCursor: CHECKPOINT_CURSOR
  };
}

function load(reos) {
  const sandbox = {
    REOS: reos
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'CountyCodeViolationGroup3ZillowRestorationOperator.js'
    }
  );

  const fn =
    sandbox[RPC];

  assert.equal(
    typeof fn,
    'function',
    'operator RPC must be a function'
  );

  assert.equal(
    fn.length,
    1,
    'operator RPC must accept exactly one formal argument'
  );

  return fn;
}

function captureThrow(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }

  assert.fail(
    'expected call to throw'
  );
}

assert.equal(
  countMatches(
    /\bfunction\s+reosCountyCodeViolationGroup3ZillowRestorationExecute\s*\(\s*options\s*\)/g
  ),
  1,
  'exact public RPC declaration count must be one'
);

assert.equal(
  countMatches(
    /REOS\.Security\.requireAdmin\s*\(\s*\)\s*;/g
  ),
  1,
  'operator must require Admin exactly once'
);

assert.equal(
  countMatches(
    /CountyCodeViolationGroup3ZillowRestorationExecutor\s*\.\s*execute\s*\(\s*options\s*\)/g
  ),
  1,
  'operator must delegate to executor exactly once'
);

[
  /REOS\.Database/,
  /CountyMutationExclusionLease/,
  /\bLockService\b/,
  /\bScriptApp\b/,
  /\bPropertiesService\b/,
  /\bSpreadsheetApp\b/,
  /\bUrlFetchApp\b/,
  /\bGmailApp\b/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /\.appendRow\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /\.clearContent\s*\(/,
  /reosCountyProductionScheduler/,
  /patchPhysicalRowCellsExact/,
  /deletePhysicalRowExact/
].forEach((pattern) => {
  assert.equal(
    pattern.test(source),
    false,
    'operator contains prohibited direct surface: ' +
      pattern
  );
});

assert.equal(
  /\btry\s*\{/.test(source),
  false,
  'operator must not catch/retry executor execution'
);

assert.equal(
  /\bcatch\s*\(/.test(source),
  false,
  'operator must not catch/retry executor execution'
);

let behaviorCases = 0;

/*
 * Case 1: exact valid request delegates once, after Admin, preserving
 * request and result object identity.
 */
{
  let adminCalls = 0;
  let executeCalls = 0;
  let delegated = null;

  const result = {
    ok: true,
    classification:
      'GROUP3_RESTORATION_VERIFIED',
    executionAuthorityGranted: false
  };

  const fn = load({
    Security: {
      requireAdmin() {
        adminCalls += 1;
      }
    },

    CountyCodeViolationGroup3ZillowRestorationExecutor: {
      execute(options) {
        executeCalls += 1;
        delegated = options;
        return result;
      }
    }
  });

  const request =
    validRequest();

  const returned =
    fn(request);

  assert.equal(
    adminCalls,
    1
  );

  assert.equal(
    executeCalls,
    1
  );

  assert.equal(
    delegated,
    request,
    'operator must delegate exact caller-owned request object'
  );

  assert.equal(
    returned,
    result,
    'operator must return executor result unchanged'
  );

  behaviorCases += 1;
}

/*
 * Cases 2-11: malformed or unauthorized requests fail before Admin
 * and before executor delegation.
 */
const invalidRequests = [
  undefined,
  null,
  [],
  {},
  {
    confirmRestoration: true,
    checkpointId: CHECKPOINT_ID
  },
  {
    confirmRestoration: true,
    checkpointId: CHECKPOINT_ID,
    checkpointCursor: CHECKPOINT_CURSOR,
    extra: true
  },
  {
    confirmRestoration: false,
    checkpointId: CHECKPOINT_ID,
    checkpointCursor: CHECKPOINT_CURSOR
  },
  {
    confirmRestoration: 'true',
    checkpointId: CHECKPOINT_ID,
    checkpointCursor: CHECKPOINT_CURSOR
  },
  {
    confirmRestoration: true,
    checkpointId: CHECKPOINT_ID + '-WRONG',
    checkpointCursor: CHECKPOINT_CURSOR
  },
  {
    confirmRestoration: true,
    checkpointId: CHECKPOINT_ID,
    checkpointCursor: CHECKPOINT_CURSOR + '-WRONG'
  }
];

invalidRequests.forEach((request) => {
  let adminCalls = 0;
  let executeCalls = 0;

  const fn = load({
    Security: {
      requireAdmin() {
        adminCalls += 1;
      }
    },

    CountyCodeViolationGroup3ZillowRestorationExecutor: {
      execute() {
        executeCalls += 1;
        return {};
      }
    }
  });

  captureThrow(
    () => fn(request)
  );

  assert.equal(
    adminCalls,
    0,
    'invalid request must fail before Admin invocation'
  );

  assert.equal(
    executeCalls,
    0,
    'invalid request must fail before executor delegation'
  );

  behaviorCases += 1;
});

/*
 * Case 12: missing Security dependency fails closed.
 */
{
  let executeCalls = 0;

  const fn = load({
    CountyCodeViolationGroup3ZillowRestorationExecutor: {
      execute() {
        executeCalls += 1;
      }
    }
  });

  captureThrow(
    () => fn(
      validRequest()
    )
  );

  assert.equal(
    executeCalls,
    0
  );

  behaviorCases += 1;
}

/*
 * Case 13: missing executor dependency fails closed before Admin.
 */
{
  let adminCalls = 0;

  const fn = load({
    Security: {
      requireAdmin() {
        adminCalls += 1;
      }
    }
  });

  captureThrow(
    () => fn(
      validRequest()
    )
  );

  assert.equal(
    adminCalls,
    0,
    'dependency validation must fail before partial delegation'
  );

  behaviorCases += 1;
}

/*
 * Case 14: Admin failure propagates unchanged and executor is not called.
 */
{
  let executeCalls = 0;

  const adminError =
    new Error(
      'ADMIN_DENIED'
    );

  const fn = load({
    Security: {
      requireAdmin() {
        throw adminError;
      }
    },

    CountyCodeViolationGroup3ZillowRestorationExecutor: {
      execute() {
        executeCalls += 1;
      }
    }
  });

  const thrown =
    captureThrow(
      () => fn(
        validRequest()
      )
    );

  assert.equal(
    thrown,
    adminError,
    'Admin failure must propagate unchanged'
  );

  assert.equal(
    executeCalls,
    0
  );

  behaviorCases += 1;
}

/*
 * Cases 15-17: executor failures propagate unchanged with no retry.
 */
[
  'GROUP3_RESTORATION_PRECONDITION_FAILED',
  'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
  'GENERIC_EXECUTOR_FAILURE'
].forEach((classification) => {
  let adminCalls = 0;
  let executeCalls = 0;

  const executorError =
    new Error(
      classification
    );

  executorError.classification =
    classification;

  const fn = load({
    Security: {
      requireAdmin() {
        adminCalls += 1;
      }
    },

    CountyCodeViolationGroup3ZillowRestorationExecutor: {
      execute() {
        executeCalls += 1;
        throw executorError;
      }
    }
  });

  const thrown =
    captureThrow(
      () => fn(
        validRequest()
      )
    );

  assert.equal(
    thrown,
    executorError,
    'executor failure object must propagate unchanged'
  );

  assert.equal(
    adminCalls,
    1
  );

  assert.equal(
    executeCalls,
    1,
    'executor failure must never be retried'
  );

  behaviorCases += 1;
});

assert.equal(
  behaviorCases,
  17,
  'expected exactly 17 operator behavior cases'
);

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_IMPLEMENTATION_BEHAVIOR_CERTIFIED=true'
);

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_BEHAVIOR_CASES=' +
    behaviorCases
);

console.log(
  'GROUP3_OPERATOR_PUBLIC_RPC_COUNT=1'
);

console.log(
  'GROUP3_OPERATOR_PUBLIC_RPC_PRESENT=true'
);

console.log(
  'GROUP3_OPERATOR_ADMIN_REQUIRED=true'
);

console.log(
  'GROUP3_OPERATOR_EXECUTOR_DELEGATION_COUNT=1'
);

console.log(
  'GROUP3_OPERATOR_RETRY_PRESENT=false'
);

console.log(
  'GROUP3_OPERATOR_DIRECT_PRODUCTION_WRITE_PRESENT=false'
);

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_DEPLOYMENT_AUTHORITY_GRANTED=false'
);

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false'
);
