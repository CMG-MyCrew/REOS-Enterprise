'use strict';

const fs = require('fs');
const vm = require('vm');

const path =
  'build/apps-script-brand/PhiladelphiaProbateRuntimeProbe.js';

const source = fs.readFileSync(path, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const rpcMatches =
  source.match(
    /function\s+reosPhiladelphiaProbateRuntimeProbe\s*\(\s*\)/g
  ) || [];

assert(
  rpcMatches.length === 1,
  'Exactly one zero-argument runtime probe RPC is required.'
);

const forbidden = [
  'UrlFetchApp',
  'PropertiesService',
  'ScriptApp',
  'SpreadsheetApp',
  'DriveApp',
  'LockService',
  'registerConnectors(',
  '.register(',
  'setProperty(',
  'deleteProperty(',
  'appendRow(',
  'setValue(',
  'setValues(',
  'createTrigger(',
  'deleteTrigger(',
  '.resolve(',
  '.probateSourceAuthority(',
  'reosPhiladelphiaProbateSourceAuthority('
];

for (const token of forbidden) {
  assert(
    !source.includes(token),
    'Forbidden execution surface in runtime probe: ' +
      token
  );
}

const counters = {
  approvedSourceUrl: 0,
  parseCursor: 0,
  encodeCursor: 0,
  resolve: 0,
  probateSourceAuthority: 0
};

function forbiddenCall(name) {
  return function () {
    counters[name] += 1;
    throw new Error(
      'Runtime probe invoked forbidden function: ' +
        name
    );
  };
}

const sandbox = {
  REOS: {
    PhiladelphiaProbateRecurringSource: {
      cursorPrefix: 'PB1',
      cursorDomainId: 'PHL-PROBATE-PB1-V1',
      maxLookbackDays: 10,
      noticePageSize: 25,
      approvedSourceUrl:
        forbiddenCall('approvedSourceUrl'),
      parseCursor:
        forbiddenCall('parseCursor'),
      encodeCursor:
        forbiddenCall('encodeCursor'),
      resolve:
        forbiddenCall('resolve')
    },

    PAPhiladelphiaCountyConnector: {
      connectorId:
        'pa-philadelphia',

      manifest: {
        id:
          'pa-philadelphia'
      },

      probateSourceAuthority:
        forbiddenCall('probateSourceAuthority')
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

assert(
  typeof sandbox.reosPhiladelphiaProbateRuntimeProbe ===
    'function',
  'Runtime probe RPC did not become a top-level function.'
);

assert(
  sandbox.reosPhiladelphiaProbateRuntimeProbe.length ===
    0,
  'Runtime probe RPC must accept zero formal arguments.'
);

const result =
  sandbox.reosPhiladelphiaProbateRuntimeProbe();

assert(result.ok === true, 'ok mismatch');
assert(result.probeVersion === 1, 'probeVersion mismatch');
assert(result.runtimeLoaded === true, 'runtimeLoaded mismatch');

assert(
  result.connectorId === 'pa-philadelphia',
  'connectorId mismatch'
);

assert(result.cursorPrefix === 'PB1', 'cursorPrefix mismatch');

assert(
  result.cursorDomainId === 'PHL-PROBATE-PB1-V1',
  'cursorDomainId mismatch'
);

assert(result.maxLookbackDays === 10, 'maxLookbackDays mismatch');
assert(result.noticePageSize === 25, 'noticePageSize mismatch');

assert(
  result.approvedSourceUrlPresent === true,
  'approvedSourceUrlPresent mismatch'
);

assert(result.parseCursorPresent === true, 'parseCursorPresent mismatch');
assert(result.encodeCursorPresent === true, 'encodeCursorPresent mismatch');
assert(result.resolvePresent === true, 'resolvePresent mismatch');

assert(
  result.probateSourceAuthorityPresent === true,
  'probateSourceAuthorityPresent mismatch'
);

[
  'resolveExecuted',
  'probateSourceAuthorityExecuted',
  'externalHttpExecuted',
  'sourceFetchExecuted',
  'connectorRegistrationExecuted',
  'schedulerInspectionExecuted',
  'schedulerMutationExecuted',
  'triggerMutationExecuted',
  'checkpointMutationExecuted',
  'countyDataMutationExecuted',
  'persistenceExecuted',
  'configurationExecuted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted'
].forEach((key) => {
  assert(
    result[key] === false,
    key + ' must be false'
  );
});

Object.entries(counters).forEach(([name, count]) => {
  assert(
    count === 0,
    'Forbidden function was invoked: ' +
      name
  );
});

function expectFailure(mutator, expected) {
  const local = {
    REOS: {
      PhiladelphiaProbateRecurringSource: {
        ...sandbox.REOS.PhiladelphiaProbateRecurringSource
      },
      PAPhiladelphiaCountyConnector: {
        ...sandbox.REOS.PAPhiladelphiaCountyConnector
      }
    }
  };

  mutator(local.REOS);

  vm.createContext(local);
  vm.runInContext(source, local);

  let error = null;

  try {
    local.reosPhiladelphiaProbateRuntimeProbe();
  } catch (caught) {
    error = caught;
  }

  assert(error, 'Expected probe failure: ' + expected);

  assert(
    String(error.message).includes(expected),
    'Unexpected failure message: ' +
      error.message
  );
}

expectFailure(
  (REOS) => {
    REOS.PhiladelphiaProbateRecurringSource = null;
  },
  'runtime source is not loaded'
);

expectFailure(
  (REOS) => {
    REOS.PAPhiladelphiaCountyConnector = null;
  },
  'county connector is not loaded'
);

expectFailure(
  (REOS) => {
    REOS.PhiladelphiaProbateRecurringSource.cursorPrefix =
      'WRONG';
  },
  'cursor prefix mismatch'
);

expectFailure(
  (REOS) => {
    REOS.PhiladelphiaProbateRecurringSource.cursorDomainId =
      'WRONG';
  },
  'cursor domain mismatch'
);

expectFailure(
  (REOS) => {
    REOS.PhiladelphiaProbateRecurringSource.maxLookbackDays =
      11;
  },
  'lookback mismatch'
);

expectFailure(
  (REOS) => {
    REOS.PhiladelphiaProbateRecurringSource.noticePageSize =
      24;
  },
  'notice page size mismatch'
);

expectFailure(
  (REOS) => {
    REOS.PhiladelphiaProbateRecurringSource.resolve =
      null;
  },
  'resolver is not loaded'
);

expectFailure(
  (REOS) => {
    REOS.PAPhiladelphiaCountyConnector.probateSourceAuthority =
      null;
  },
  'source authority symbol is not loaded'
);

console.log(
  'PHILADELPHIA_PROBATE_RUNTIME_PROBE_V1_VALIDATION_PASSED=true'
);
console.log(
  'PUBLIC_RPC_NAME=reosPhiladelphiaProbateRuntimeProbe'
);
console.log('PUBLIC_RPC_ARGUMENT_COUNT=0');
console.log('FORBIDDEN_FUNCTION_INVOCATION_COUNT=0');
console.log('EXTERNAL_HTTP_EXECUTED=false');
console.log('SOURCE_FETCH_EXECUTED=false');
console.log('CONNECTOR_REGISTRATION_EXECUTED=false');
console.log('SCHEDULER_INSPECTION_EXECUTED=false');
console.log('PERSISTENCE_EXECUTED=false');
console.log('COUNTY_DATA_MUTATION_EXECUTED=false');
console.log('MAO_AUTHORITY_GRANTED=false');
console.log('OFFER_AUTHORITY_GRANTED=false');
