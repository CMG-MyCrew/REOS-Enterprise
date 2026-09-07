#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const vm =
  require('node:vm');


const SOURCE =
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryMaintenanceGate.js';

const STATE_KEY =
  'REOS_CODE_VIOLATIONS_GATE1_RECOVERY_MAINTENANCE_GATE_JSON';

const MANIFEST =
  '33733cdf3ea8fbfccf66dfe0904fe26999b184c2e367a920318b2d943fe6e8c6';

const CATALOG =
  '050857487383e799b0a9dc503dfeeae759e8ddf60e485e4ae94cb551e2b8731d';

const LIVE_PREFLIGHT =
  '4c5f6fd76558708d0e993b81de5b807af437844dcf902db0940dab5fbff80257';


const source =
  fs.readFileSync(
    SOURCE,
    'utf8'
  );


function pass(message) {
  console.log(
    'PASS: ' +
    message
  );
}


function expectThrow(
  fn,
  pattern
) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert.ok(
    error,
    'Expected operation to throw.'
  );

  assert.match(
    String(
      error.message ||
      error
    ),
    pattern
  );
}


[
  'REOS.Database',
  'SpreadsheetApp',
  'UrlFetchApp',
  'CountyConnectorSDK',
  'CountyRuntimeBridge',
  'CountyAdapters'
].forEach(token => {
  assert.equal(
    source.includes(token),
    false,
    'Maintenance gate must not contain runtime mutation/network dependency: ' +
      token
  );
});


const store =
  new Map();

let triggers =
  [];

let uuid =
  0;

let adminCalls =
  0;


const props = {
  getProperty(key) {
    return store.has(key)
      ? store.get(key)
      : null;
  },

  setProperty(key, value) {
    store.set(
      key,
      String(value)
    );

    return this;
  },

  deleteProperty(key) {
    store.delete(key);

    return this;
  }
};


function signedSha256Bytes(
  value
) {
  const digest =
    crypto
      .createHash('sha256')
      .update(
        String(value),
        'utf8'
      )
      .digest();

  return Array.from(
    digest,
    byte =>
      byte > 127
        ? byte - 256
        : byte
  );
}


function trigger(handler) {
  return {
    getHandlerFunction() {
      return handler;
    },

    getEventType() {
      return 'CLOCK';
    },

    getTriggerSource() {
      return 'CLOCK';
    },

    getUniqueId() {
      return (
        'TRIGGER-' +
        handler
      );
    }
  };
}


const sandbox = {
  console,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  RegExp,
  Error,
  Date,

  REOS: {
    Security: {
      requireAdmin() {
        adminCalls += 1;
        return true;
      }
    }
  },

  PropertiesService: {
    getScriptProperties() {
      return props;
    }
  },

  ScriptApp: {
    getProjectTriggers() {
      return triggers.slice();
    }
  },

  Utilities: {
    DigestAlgorithm: {
      SHA_256:
        'SHA_256'
    },

    Charset: {
      UTF_8:
        'UTF_8'
    },

    getUuid() {
      uuid += 1;

      return (
        'UUID-' +
        uuid
      );
    },

    computeDigest(
      algorithm,
      value
    ) {
      assert.equal(
        algorithm,
        'SHA_256'
      );

      return signedSha256Bytes(
        value
      );
    }
  }
};


vm.createContext(
  sandbox
);

vm.runInContext(
  source,
  sandbox
);


const gate =
  sandbox.REOS
    .CountyCodeViolationGate1RecoveryMaintenanceGate;


const openingAuthority = {
  confirmQuiescence:
    true,

  confirmPopulationRecovery:
    true,

  candidateCount:
    139,

  manifestSha256:
    MANIFEST,

  catalogSha256:
    CATALOG,

  livePreflightSha256:
    LIVE_PREFLIGHT
};


const security =
  sandbox.REOS.Security;

delete sandbox.REOS.Security;

expectThrow(
  () =>
    sandbox
      .reosCountyCodeViolationGate1RecoveryMaintenanceGateStatus(),
  /requires Admin authority/
);

sandbox.REOS.Security =
  security;

pass(
  'status fails closed without Admin authority'
);


triggers = [
  trigger(
    'reosZillowGmailScheduledSync'
  )
];

const opened =
  gate.open(
    openingAuthority
  );

assert.equal(
  opened.ok,
  true
);

assert.equal(
  opened.authority.candidateCount,
  139
);

assert.equal(
  opened.authority.manifestSha256,
  MANIFEST
);

assert.equal(
  opened.authority.catalogSha256,
  CATALOG
);

assert.equal(
  opened.authority.livePreflightSha256,
  LIVE_PREFLIGHT
);

assert.equal(
  opened.managedCountySchedulerTriggerCount,
  0
);

assert.equal(
  opened.recoveryReady,
  false
);

assert.ok(
  opened.maintenanceToken
);

pass(
  'unrelated installable triggers do not block the county recovery gate'
);


const persisted =
  JSON.parse(
    store.get(
      STATE_KEY
    )
  );

assert.notEqual(
  persisted.tokenSha256,
  opened.maintenanceToken
);

assert.equal(
  persisted.authority.candidateCount,
  139
);

pass(
  'gate persists only SHA-256 capability and exact population authority'
);


expectThrow(
  () =>
    gate.open(
      openingAuthority
    ),
  /already open/
);

pass(
  'active maintenance capability cannot be replaced'
);


expectThrow(
  () =>
    gate.assertRecoveryReady({
      maintenanceToken:
        opened.maintenanceToken
    }),
  /settling interval/
);


let state =
  JSON.parse(
    store.get(
      STATE_KEY
    )
  );

state.notBeforeAt =
  new Date(
    Date.now() -
    60000
  ).toISOString();

state.expiresAt =
  new Date(
    Date.now() +
    30 * 60 * 1000
  ).toISOString();

store.set(
  STATE_KEY,
  JSON.stringify(state)
);


expectThrow(
  () =>
    gate.assertRecoveryReady({
      maintenanceToken:
        'WRONG'
    }),
  /token is invalid/
);


triggers = [
  trigger(
    'reosCountyProductionSchedulerRun'
  )
];

expectThrow(
  () =>
    gate.assertRecoveryReady({
      maintenanceToken:
        opened.maintenanceToken
    }),
  /lost county scheduler quiescence/
);

pass(
  'managed county scheduler trigger invalidates recovery readiness'
);


triggers = [
  trigger(
    'reosZillowGmailScheduledSync'
  )
];

const ready =
  gate.assertRecoveryReady({
    maintenanceToken:
      opened.maintenanceToken
  });

assert.equal(
  ready.ready,
  true
);

assert.equal(
  ready.managedCountySchedulerTriggerCount,
  0
);

[
  'mutationAuthorityGranted',
  'insertAuthorityGranted',
  'updateAuthorityGranted',
  'deleteAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'migrationAuthorityGranted',
  'deduplicationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.equal(
    ready[field],
    false,
    field + ' must remain false'
  );
});

pass(
  'settled population gate grants readiness only and no mutation authority'
);


state =
  JSON.parse(
    store.get(
      STATE_KEY
    )
  );

state.authority.candidateCount =
  138;

store.set(
  STATE_KEY,
  JSON.stringify(state)
);

expectThrow(
  () =>
    gate.assertRecoveryReady({
      maintenanceToken:
        opened.maintenanceToken
    }),
  /authority drifted/
);

pass(
  'persisted population-authority drift fails closed'
);


state.authority.candidateCount =
  139;

state.expiresAt =
  new Date(
    Date.now() -
    1000
  ).toISOString();

store.set(
  STATE_KEY,
  JSON.stringify(state)
);

expectThrow(
  () =>
    gate.assertRecoveryReady({
      maintenanceToken:
        opened.maintenanceToken
    }),
  /expired/
);

pass(
  'expired population capability grants no recovery readiness'
);


expectThrow(
  () =>
    gate.close({
      confirmClose:
        true,

      maintenanceToken:
        'WRONG'
    }),
  /close token is invalid/
);


const closed =
  gate.close({
    confirmClose:
      true,

    maintenanceToken:
      opened.maintenanceToken
  });

assert.equal(
  closed.closed,
  true
);

assert.equal(
  store.has(
    STATE_KEY
  ),
  false
);

pass(
  'maintenance capability closes only with its exact token'
);


triggers = [
  trigger(
    'reosCountyProductionSchedulerRun'
  )
];

expectThrow(
  () =>
    gate.open(
      openingAuthority
    ),
  /zero managed county scheduler triggers/
);

pass(
  'gate cannot open while county production scheduler is armed'
);


triggers = [];

expectThrow(
  () =>
    gate.open({
      ...openingAuthority,
      candidateCount:
        138
    }),
  /does not match certified evidence/
);

expectThrow(
  () =>
    gate.open({
      ...openingAuthority,
      livePreflightSha256:
        'bad'
    }),
  /does not match certified evidence/
);

pass(
  'opening authority is pinned to candidate count and certified evidence hashes'
);


assert.ok(
  adminCalls > 0
);

console.log();
console.log(
  'Code Violations Gate 1 recovery maintenance gate validation PASSED.'
);
