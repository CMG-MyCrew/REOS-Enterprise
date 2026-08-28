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


const source =
  fs.readFileSync(
    'build/apps-script-brand/CountyC1MaintenanceGate.js',
    'utf8'
  );


const STATE_KEY =
  'REOS_C1_MAINTENANCE_GATE_JSON';

const KEY =
  'pa-philadelphia|code_violations|10';


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
  let caught = null;

  try {
    fn();
  } catch (error) {
    caught = error;
  }

  assert.ok(
    caught,
    'Expected operation to throw'
  );

  assert.match(
    String(
      caught.message ||
      caught
    ),
    pattern
  );
}


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


function trigger(
  handler
) {
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
    .CountyC1MaintenanceGate;


const security =
  sandbox.REOS.Security;


delete sandbox.REOS.Security;


expectThrow(
  () =>
    sandbox
      .reosCountyC1MaintenanceGateStatus(),
  /requires Admin authority/
);


sandbox.REOS.Security =
  security;


const initialStatus =
  sandbox
    .reosCountyC1MaintenanceGateStatus();


assert.equal(
  initialStatus.active,
  false
);


pass(
  'maintenance status RPC fails closed without Security and requires Admin when available'
);


triggers = [
  trigger(
    'reosZillowGmailScheduledSync'
  )
];


expectThrow(
  () =>
    gate.open({
      confirmQuiescence:
        true,

      sourceObservationKey:
        KEY
    }),
  /zero installable project triggers/
);


assert.equal(
  store.has(
    STATE_KEY
  ),
  false
);


pass(
  'gate cannot open while any installable trigger exists'
);


triggers = [];


const opened =
  gate.open({
    confirmQuiescence:
      true,

    sourceObservationKey:
      KEY
  });


assert.equal(
  opened.ok,
  true
);

assert.equal(
  opened.recoveryReady,
  false
);

assert.equal(
  opened.replacedExpiredGate,
  false
);

assert.ok(
  opened.maintenanceToken
);


expectThrow(
  () =>
    gate.open({
      confirmQuiescence:
        true,

      sourceObservationKey:
        KEY
    }),
  /already open/
);


pass(
  'active unexpired maintenance gate cannot be replaced'
);


let state =
  JSON.parse(
    store.get(
      STATE_KEY
    )
  );


assert.notEqual(
  state.tokenSha256,
  opened.maintenanceToken
);


pass(
  'maintenance capability is persisted only as SHA-256 authority'
);


expectThrow(
  () =>
    gate.assertRecoveryReady({
      sourceObservationKey:
        KEY,

      maintenanceToken:
        opened
          .maintenanceToken
    }),
  /settling interval/
);


state.notBeforeAt =
  new Date(
    Date.now() -
    60000
  ).toISOString();

state.expiresAt =
  new Date(
    Date.now() +
    600000
  ).toISOString();


store.set(
  STATE_KEY,
  JSON.stringify(state)
);


expectThrow(
  () =>
    gate.assertRecoveryReady({
      sourceObservationKey:
        KEY,

      maintenanceToken:
        'WRONG-TOKEN'
    }),
  /token is invalid/
);


triggers = [
  trigger(
    'jobQueueProcessBatch'
  )
];


expectThrow(
  () =>
    gate.assertRecoveryReady({
      sourceObservationKey:
        KEY,

      maintenanceToken:
        opened
          .maintenanceToken
    }),
  /lost quiescence/
);


triggers = [];


const ready =
  gate.assertRecoveryReady({
    sourceObservationKey:
      KEY,

    maintenanceToken:
      opened
        .maintenanceToken
  });


assert.equal(
  ready.ready,
  true
);

assert.equal(
  ready.triggerCount,
  0
);

assert.equal(
  ready.mutationAuthorityGranted,
  false
);

assert.equal(
  ready.insertAuthorityGranted,
  false
);

assert.equal(
  ready.schedulerAuthorityGranted,
  false
);

assert.equal(
  ready.automaticOfferAuthorityGranted,
  false
);


pass(
  'settled zero-trigger gate grants readiness only'
);


state =
  JSON.parse(
    store.get(
      STATE_KEY
    )
  );


state.expiresAt =
  new Date(
    Date.now() -
    60000
  ).toISOString();


store.set(
  STATE_KEY,
  JSON.stringify(state)
);


const expiredStatus =
  gate.status();


assert.equal(
  expiredStatus.expired,
  true
);

assert.equal(
  expiredStatus.active,
  false
);


const reopened =
  gate.open({
    confirmQuiescence:
      true,

    sourceObservationKey:
      KEY
  });


assert.equal(
  reopened.ok,
  true
);

assert.equal(
  reopened.replacedExpiredGate,
  true
);

assert.notEqual(
  reopened.gateId,
  opened.gateId
);

assert.notEqual(
  reopened.maintenanceToken,
  opened.maintenanceToken
);

assert.equal(
  reopened.recoveryReady,
  false
);


pass(
  'expired gate can be replaced by a new Admin-confirmed zero-trigger gate without the lost token'
);


const closed =
  gate.close({
    confirmClose:
      true,

    maintenanceToken:
      reopened
        .maintenanceToken
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

assert.ok(
  adminCalls >= 4
);


pass(
  'replacement gate retains explicit token-bound Admin close'
);


console.log(
  '\nCounty C1 maintenance gate validation PASSED.'
);
