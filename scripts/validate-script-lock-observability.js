#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');


const source =
  fs.readFileSync(
    'build/apps-script-brand/ScriptLockObservability.js',
    'utf8'
  );

const database =
  fs.readFileSync(
    'build/apps-script-brand/Database.js',
    'utf8'
  );

const zillow =
  fs.readFileSync(
    'build/apps-script-brand/ZillowGmailConnector.js',
    'utf8'
  );

const operations =
  fs.readFileSync(
    'build/apps-script-brand/ProductionOperations.js',
    'utf8'
  );

const county =
  fs.readFileSync(
    'build/apps-script-brand/CountyProductionScheduler.js',
    'utf8'
  );


const CURRENT_KEY =
  'REOS_SCRIPTLOCK_OWNER_CURRENT_JSON';

const EVENT_PREFIX =
  'REOS_SCRIPTLOCK_EVENT_JSON_';


function pass(message) {
  console.log(
    'PASS: ' +
    message
  );
}


function segment(
  text,
  startMarker,
  endMarker
) {
  const start =
    text.indexOf(
      startMarker
    );

  assert.ok(
    start >= 0,
    'segment start missing: ' +
    startMarker
  );

  const end =
    endMarker
      ? text.indexOf(
          endMarker,
          start +
          startMarker.length
        )
      : text.length;

  assert.ok(
    end > start,
    'segment end missing: ' +
    endMarker
  );

  return text.slice(
    start,
    end
  );
}


assert.ok(
  source.includes(
    EVENT_PREFIX
  )
);

assert.equal(
  source.includes(
    'REOS_SCRIPTLOCK_EVENT_HISTORY_JSON'
  ),
  false
);

assert.ok(
  source.includes(
    "storageMode:\n        'UNIQUE_EVENT_PROPERTIES'"
  )
);

assert.ok(
  source.includes(
    'sharedHistoryReadModifyWrite:\n        false'
  )
);

pass(
  'shared event-history JSON RMW is removed in favor of unique event properties'
);


assert.match(
  database,
  /\.tryLock\s*\(\s*1000\s*\)/
);

assert.match(
  database,
  /\.waitLock\s*\(\s*30000\s*\)/
);

pass(
  'Database lock wait topology remains unchanged'
);


{
  const outer =
    segment(
      database,
      'function withScriptLockContext(work)',
      'function insert(sheetName, record, options)'
    );

  const insert =
    segment(
      database,
      'function insert(sheetName, record, options)',
      'function update(sheetName, idField, idValue, changes)'
    );

  const update =
    segment(
      database,
      'function update(sheetName, idField, idValue, changes)',
      'function upsert(sheetName, idField, idValue, record, options)'
    );

  [
    outer,
    insert,
    update
  ].forEach(text => {
    assert.ok(
      text.lastIndexOf(
        'endLockObservation_('
      ) >
      text.lastIndexOf(
        'lock.releaseLock()'
      )
    );
  });
}


[
  zillow,
  operations,
  county
].forEach(text => {
  assert.ok(
    text.lastIndexOf(
      '.end('
    ) >
    text.lastIndexOf(
      'lock.releaseLock()'
    )
  );
});


pass(
  'physical ScriptLock release still precedes observability finalization'
);


const store =
  new Map();

let uuid =
  0;

let adminCalls =
  0;

let failServiceAcquisition =
  false;

let failReads =
  false;

let failWrites =
  false;


const properties = {
  getProperty(key) {
    if (failReads) {
      throw new Error(
        'HARNESS_PROPERTY_READ_FAILURE'
      );
    }

    return store.has(key)
      ? store.get(key)
      : null;
  },

  getProperties() {
    if (failReads) {
      throw new Error(
        'HARNESS_PROPERTIES_READ_FAILURE'
      );
    }

    return Object.fromEntries(
      store.entries()
    );
  },

  setProperty(key, value) {
    if (failWrites) {
      throw new Error(
        'HARNESS_PROPERTY_WRITE_FAILURE'
      );
    }

    store.set(
      key,
      String(value)
    );

    return this;
  },

  deleteProperty(key) {
    if (failWrites) {
      throw new Error(
        'HARNESS_PROPERTY_DELETE_FAILURE'
      );
    }

    store.delete(key);

    return this;
  }
};


const sandbox = {
  console,
  JSON,
  Object,
  Array,
  String,
  Number,
  Boolean,
  Math,
  Date,

  REOS: {},

  PropertiesService: {
    getScriptProperties() {
      if (
        failServiceAcquisition
      ) {
        throw new Error(
          'HARNESS_SCRIPT_PROPERTIES_UNAVAILABLE'
        );
      }

      return properties;
    }
  },

  Utilities: {
    getUuid() {
      uuid += 1;

      return (
        'UUID-' +
        uuid
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


assert.throws(
  () =>
    sandbox
      .reosScriptLockObservabilityStatus(),
  /requires Admin authority/
);


sandbox.REOS.Security = {
  requireAdmin() {
    adminCalls += 1;
    return true;
  }
};


let status =
  sandbox
    .reosScriptLockObservabilityStatus();


assert.equal(
  status.ok,
  true
);

assert.equal(
  adminCalls,
  1
);


pass(
  'status RPC remains fail-closed and Admin protected'
);


const api =
  sandbox.REOS
    .ScriptLockObservability;


const a =
  api.begin(
    'OWNER-A',
    'OP-A',
    {
      invocationId:
        'INV-A'
    }
  );


const b =
  api.begin(
    'OWNER-B',
    'OP-B',
    {
      invocationId:
        'INV-B'
    }
  );


assert.ok(a);
assert.ok(b);


api.end(
  a,
  'SUCCESS',
  {}
);


status =
  api.status();


assert.equal(
  status.currentOwner.owner,
  'OWNER-B'
);

assert.equal(
  status.currentOwner.ownerStale,
  false
);

assert.equal(
  status.currentOwner.ownerAuthoritative,
  true
);


pass(
  'old delayed owner finalization cannot erase newer CURRENT owner'
);


const current =
  JSON.parse(
    store.get(
      CURRENT_KEY
    )
  );


current.acquiredAt =
  new Date(
    Date.now() -
    20 * 60 * 1000
  ).toISOString();


store.set(
  CURRENT_KEY,
  JSON.stringify(
    current
  )
);


status =
  api.status();


assert.equal(
  status.currentOwner.ownerStale,
  true
);

assert.equal(
  status.currentOwner.ownerAuthoritative,
  false
);


pass(
  'stale CURRENT owner remains explicitly non-authoritative'
);


const contention =
  api.contention(
    'CONTENDER',
    'WAIT',
    {
      waitMilliseconds:
        1000
    }
  );


assert.equal(
  contention.observedOwner,
  'OWNER-B'
);

assert.equal(
  contention.observedOwnerStale,
  true
);

assert.equal(
  contention.observedOwnerAuthoritative,
  false
);


pass(
  'contention evidence preserves stale/non-authoritative classification'
);


api.end(
  b,
  'SUCCESS',
  {}
);


for (
  let index = 0;
  index < 20;
  index += 1
) {
  api.contention(
    'CONTENDER-' +
    index,
    'RETENTION',
    {
      index
    }
  );
}


status =
  api.status();


assert.equal(
  status.storageMode,
  'UNIQUE_EVENT_PROPERTIES'
);

assert.equal(
  status.sharedHistoryReadModifyWrite,
  false
);

assert.ok(
  status.history.length <=
    12
);


const eventKeys =
  Array.from(
    store.keys()
  ).filter(
    key =>
      key.startsWith(
        EVENT_PREFIX
      )
  );


assert.ok(
  eventKeys.length <=
    12
);

assert.equal(
  new Set(
    eventKeys
  ).size,
  eventKeys.length
);


pass(
  'event history uses unique properties with best-effort bounded retention'
);


/*
 * Fault isolation: service acquisition failure.
 */
failServiceAcquisition =
  true;


assert.doesNotThrow(
  () =>
    api.begin(
      'FAIL',
      'BEGIN',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.contention(
      'FAIL',
      'CONTENTION',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.end(
      a,
      'FAILURE',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.status()
);


let unavailable =
  api.status();


assert.equal(
  unavailable.ok,
  false
);

assert.equal(
  unavailable.diagnosticAvailable,
  false
);


failServiceAcquisition =
  false;


pass(
  'Script Properties service acquisition failure is fully isolated'
);


/*
 * Fault isolation: property method failures.
 */
failWrites =
  true;


assert.doesNotThrow(
  () =>
    api.begin(
      'FAIL-WRITE',
      'BEGIN',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.contention(
      'FAIL-WRITE',
      'CONTENTION',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.end(
      a,
      'FAILURE',
      {}
    )
);


failWrites =
  false;

failReads =
  true;


assert.doesNotThrow(
  () =>
    api.begin(
      'FAIL-READ',
      'BEGIN',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.contention(
      'FAIL-READ',
      'CONTENTION',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.end(
      a,
      'FAILURE',
      {}
    )
);

assert.doesNotThrow(
  () =>
    api.status()
);


failReads =
  false;


pass(
  'individual Script Properties read/write failures are fully isolated'
);


/*
 * A contained read failure must not be mislabeled as available telemetry.
 */
failReads =
  true;

const readFailureStatus =
  api.status();

assert.equal(
  readFailureStatus.ok,
  false
);

assert.equal(
  readFailureStatus
    .diagnosticAvailable,
  false
);

failReads =
  false;


pass(
  'status reports diagnostic unavailable when Script Properties reads fail'
);


status =
  api.status();


assert.equal(
  status.mutationAuthorityGranted,
  false
);

assert.equal(
  status.insertAuthorityGranted,
  false
);

assert.equal(
  status.schedulerAuthorityGranted,
  false
);

assert.equal(
  status.automaticOfferAuthorityGranted,
  false
);


pass(
  'observability remains diagnostic-only with no mutation authority'
);


console.log(
  '\nScriptLock observability validation PASSED.'
);
