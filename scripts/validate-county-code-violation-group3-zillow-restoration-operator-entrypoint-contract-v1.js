'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(
  __dirname,
  '..'
);

const DOC = path.join(
  ROOT,
  'docs',
  'county-code-violation-group3-zillow-restoration-operator-entrypoint-contract-v1.md'
);

const EXECUTOR = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'CountyCodeViolationGroup3ZillowRestorationExecutor.js'
);

const FUTURE_OPERATOR = path.join(
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
  throw new Error(message);
}

function requireFile(file, label) {
  if (!fs.existsSync(file)) {
    fail(label + ' is missing.');
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
    'Operator-entrypoint contract'
  );

const executor =
  requireFile(
    EXECUTOR,
    'Merged Group 3 executor'
  );

if (fs.existsSync(FUTURE_OPERATOR)) {
  fail(
    'Future operator implementation unexpectedly exists during design-only increment.'
  );
}

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
    'zero managed county scheduler triggers',
    'GROUP3_RESTORATION_PRECONDITION_FAILED',
    'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
    'GROUP3_RESTORATION_VERIFIED',
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
  'Operator-entrypoint contract'
);

requireTokens(
  executor,
  [
    'INTERNAL EXECUTOR ONLY.',
    'function execute(options)',
    "'confirmRestoration'",
    "'checkpointId'",
    "'checkpointCursor'",
    CHECKPOINT_ID,
    CHECKPOINT_CURSOR,
    'REOS.Security.requireAdmin();',
    'assertWriterAllowed_();',
    'REOS.Database.replacePhysicalRowExact(',
    'GROUP3_RESTORATION_PRECONDITION_FAILED',
    'GROUP3_RESTORATION_OUTCOME_UNCERTAIN',
    'GROUP3_RESTORATION_VERIFIED',
    'return Object.freeze({',
    'execute:'
  ],
  'Merged Group 3 executor'
);

const brandDir = path.join(
  ROOT,
  'build',
  'apps-script-brand'
);

const publicRpcPattern =
  /\bfunction\s+(reos[A-Za-z0-9_$]*Group3[A-Za-z0-9_$]*)\s*\(/g;

const publicMatches = [];

fs.readdirSync(brandDir)
  .filter((name) => name.endsWith('.js'))
  .sort()
  .forEach((name) => {
    const text = fs.readFileSync(
      path.join(
        brandDir,
        name
      ),
      'utf8'
    );

    let match;

    while (
      (match = publicRpcPattern.exec(text)) !==
      null
    ) {
      publicMatches.push({
        file: name,
        name: match[1]
      });
    }

    publicRpcPattern.lastIndex = 0;
  });

if (publicMatches.length !== 0) {
  fail(
    'Public Group 3 RPC unexpectedly exists during design-only increment: ' +
    JSON.stringify(publicMatches)
  );
}

const forbiddenTrue = [
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

forbiddenTrue.forEach((token) => {
  if (doc.includes(token)) {
    fail(
      'Design contract unexpectedly grants authority: ' +
      token
    );
  }
});

console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_CONTRACT_VALIDATION_PASSED=true'
);
console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_DESIGN_ONLY=true'
);
console.log(
  'GROUP3_OPERATOR_ENTRYPOINT_IMPLEMENTATION_PRESENT=false'
);
console.log(
  'GROUP3_OPERATOR_PUBLIC_RPC_COUNT=0'
);
console.log(
  'GROUP3_OPERATOR_PUBLIC_RPC_PRESENT=false'
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
