'use strict';

const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const DOC =
  path.join(
    ROOT,
    'docs',
    'county-code-violation-group3-zillow-restoration-operator-entrypoint-contract-v1.md'
  );

const EXECUTOR =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyCodeViolationGroup3ZillowRestorationExecutor.js'
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

function fail(message) {
  throw new Error(
    message
  );
}

function requireFile(
  file,
  label
) {
  if (!fs.existsSync(file)) {
    fail(
      label +
      ' is missing.'
    );
  }

  return fs.readFileSync(
    file,
    'utf8'
  );
}

function requireTokens(
  text,
  tokens,
  label
) {
  tokens.forEach((token) => {
    if (!text.includes(token)) {
      fail(
        label +
        ' missing required token: ' +
        token
      );
    }
  });
}

const doc =
  requireFile(
    DOC,
    'Operator-entrypoint design contract'
  );

const executor =
  requireFile(
    EXECUTOR,
    'Merged Group 3 executor'
  );

const operator =
  requireFile(
    OPERATOR,
    'Group 3 operator implementation'
  );

requireTokens(
  doc,
  [
    '# County Code-Violation Group 3 Zillow Restoration Operator Entrypoint Contract v1',
    'source-design contract only',
    'build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationOperator.js',
    'function ' + RPC + '(options)',
    'REOS.CountyCodeViolationGroup3ZillowRestorationExecutor.execute(options)',
    'REOS.Security.requireAdmin();',
    '`confirmRestoration`',
    '`checkpointId`',
    '`checkpointCursor`',
    CHECKPOINT_ID,
    CHECKPOINT_CURSOR,
    'No automatic retry is permitted.',
    'Deployment must be a separate certified production gate.',
    'Deployment does not authorize restoration execution.',
    'Scheduler restoration is a separate mutation gate.',
    'GROUP3_OPERATOR_ENTRYPOINT_DESIGN_ONLY=true',
    'GROUP3_OPERATOR_ENTRYPOINT_IMPLEMENTATION_PRESENT=false',
    'GROUP3_OPERATOR_PUBLIC_RPC_PRESENT=false',
    'GROUP3_OPERATOR_ENTRYPOINT_DEPLOYMENT_AUTHORITY_GRANTED=false',
    'GROUP3_OPERATOR_ENTRYPOINT_EXECUTION_AUTHORITY_GRANTED=false',
    'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false',
    'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false',
    'SCHEDULER_MUTATION_AUTHORITY_GRANTED=false',
    'CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false',
    'REFERENCE_REWRITE_AUTHORITY_GRANTED=false',
    'PHYSICAL_DELETE_AUTHORITY_GRANTED=false',
    'CONNECTOR_EXECUTION_AUTHORITY_GRANTED=false',
    'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
  ],
  'Operator-entrypoint design contract'
);

requireTokens(
  executor,
  [
    'INTERNAL EXECUTOR ONLY.',
    'function execute(options)',
    'REOS.Security.requireAdmin();',
    'assertWriterAllowed_();',
    'REOS.Database.replacePhysicalRowExact(',
    'GROUP3_RESTORATION_PRECONDITION_FAILED',
    'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
    'GROUP3_RESTORATION_VERIFIED'
  ],
  'Merged Group 3 executor'
);

requireTokens(
  operator,
  [
    'function ' + RPC + '(options)',
    "'checkpointCursor'",
    "'checkpointId'",
    "'confirmRestoration'",
    CHECKPOINT_ID,
    CHECKPOINT_CURSOR,
    'REOS.Security.requireAdmin();',
    '.CountyCodeViolationGroup3ZillowRestorationExecutor',
    '.execute(options)'
  ],
  'Group 3 operator implementation'
);

[
  'REOS.Database',
  'CountyMutationExclusionLease',
  'LockService',
  'ScriptApp',
  'PropertiesService',
  'SpreadsheetApp',
  '.setValue(',
  '.setValues(',
  '.appendRow(',
  '.deleteRow(',
  '.deleteRows(',
  'patchPhysicalRowCellsExact',
  'deletePhysicalRowExact'
].forEach((token) => {
  if (operator.includes(token)) {
    fail(
      'Operator contains prohibited direct surface: ' +
      token
    );
  }
});

if (
  /\btry\s*\{/.test(operator) ||
  /\bcatch\s*\(/.test(operator)
) {
  fail(
    'Operator must not catch/retry executor execution.'
  );
}

const brandDir =
  path.join(
    ROOT,
    'build',
    'apps-script-brand'
  );

const publicRpcPattern =
  /\bfunction\s+(reos[A-Za-z0-9_$]*Group3[A-Za-z0-9_$]*)\s*\(/g;

const publicMatches = [];

fs.readdirSync(
  brandDir
)
  .filter(
    (name) =>
      name.endsWith('.js')
  )
  .sort()
  .forEach((name) => {
    const text =
      fs.readFileSync(
        path.join(
          brandDir,
          name
        ),
        'utf8'
      );

    let match;

    while (
      (
        match =
          publicRpcPattern.exec(
            text
          )
      ) !==
        null
    ) {
      publicMatches.push({
        file: name,
        name: match[1]
      });
    }

    publicRpcPattern.lastIndex =
      0;
  });

if (
  publicMatches.length !==
    1 ||
  publicMatches[0].file !==
    'CountyCodeViolationGroup3ZillowRestorationOperator.js' ||
  publicMatches[0].name !==
    RPC
) {
  fail(
    'Exactly one contract-bound Group 3 public RPC must exist: ' +
    JSON.stringify(
      publicMatches
    )
  );
}

const forbiddenTrueInContract = [
  'GROUP3_OPERATOR_ENTRYPOINT_IMPLEMENTATION_PRESENT=true',
  'GROUP3_OPERATOR_PUBLIC_RPC_PRESENT=true',
  'GROUP3_OPERATOR_ENTRYPOINT_DEPLOYMENT_AUTHORITY_GRANTED=true',
  'GROUP3_OPERATOR_ENTRYPOINT_EXECUTION_AUTHORITY_GRANTED=true',
  'GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=true',
  'PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=true',
  'SCHEDULER_MUTATION_AUTHORITY_GRANTED=true',
  'CHECKPOINT_MUTATION_AUTHORITY_GRANTED=true',
  'REFERENCE_REWRITE_AUTHORITY_GRANTED=true',
  'PHYSICAL_DELETE_AUTHORITY_GRANTED=true',
  'CONNECTOR_EXECUTION_AUTHORITY_GRANTED=true',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=true'
];

forbiddenTrueInContract.forEach(
  (token) => {
    if (doc.includes(token)) {
      fail(
        'Design contract unexpectedly grants authority: ' +
        token
      );
    }
  }
);

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_CONTRACT_VALIDATION_PASSED=true'
);

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_CONTRACT_DESIGN_MARKERS_PRESERVED=true'
);

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_IMPLEMENTATION_PRESENT=true'
);

console.log(
  'GROUP3_OPERATOR_PUBLIC_RPC_COUNT=1'
);

console.log(
  'GROUP3_OPERATOR_PUBLIC_RPC_PRESENT=true'
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
