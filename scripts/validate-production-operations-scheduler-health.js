#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');
const MODULE_PATH = path.join(BUILD, 'ProductionOperations.js');

const HANDLER = 'reosProductionOperationsHeartbeat';
const STALE_HOURS = 48;

function pass(message) {
  console.log('PASS: ' + message);
}

function makeRuntime(source) {
  const properties = Object.create(null);

  const props = {
    getProperty(key) {
      return Object.prototype.hasOwnProperty.call(properties, key)
        ? properties[key]
        : null;
    },

    setProperty(key, value) {
      properties[key] = String(value);
      return props;
    },

    deleteProperty(key) {
      delete properties[key];
      return props;
    },

    getProperties() {
      return Object.assign({}, properties);
    }
  };

  let triggers = [];
  let triggerSequence = 0;
  let failTriggerInventory = false;

  function makeTrigger(handler, everyHours) {
    const id = 'TRIGGER-' + (++triggerSequence);

    return {
      _handler: handler,
      _hours: everyHours || null,

      getHandlerFunction() {
        return this._handler;
      },

      getEventType() {
        return 'CLOCK';
      },

      getTriggerSource() {
        return 'CLOCK';
      },

      getUniqueId() {
        return id;
      }
    };
  }

  const ScriptApp = {
    getProjectTriggers() {
      if (failTriggerInventory) {
        throw new Error('Synthetic trigger inventory failure');
      }

      return triggers.slice();
    },

    deleteTrigger(trigger) {
      triggers = triggers.filter(item => item !== trigger);
    },

    newTrigger(handler) {
      let hours = null;

      return {
        timeBased() {
          return this;
        },

        everyHours(value) {
          hours = Number(value);
          return this;
        },

        create() {
          const trigger = makeTrigger(handler, hours);
          triggers.push(trigger);
          return trigger;
        }
      };
    },

    _seed(handler, everyHours) {
      triggers.push(makeTrigger(handler, everyHours));
    },

    _all() {
      return triggers.slice();
    },

    _failInventory(value) {
      failTriggerInventory = value === true;
    }
  };

  const lock = {
    available: true,
    held: false,

    tryLock() {
      if (!this.available || this.held) return false;
      this.held = true;
      return true;
    },

    hasLock() {
      return this.held;
    },

    releaseLock() {
      this.held = false;
    }
  };

  let adminChecks = 0;

  const context = {
    console,
    Date,
    JSON,
    Math,
    Number,
    Object,
    String,
    Array,
    Error,
    RegExp,

    PropertiesService: {
      getScriptProperties() {
        return props;
      }
    },

    ScriptApp,

    LockService: {
      getScriptLock() {
        return lock;
      }
    },

    REOS: {
      Security: {
        requireAdmin() {
          adminChecks++;
          return true;
        }
      },

      Logger: {
        info() {},
        audit() {}
      },

      nowIso_() {
        return new Date().toISOString();
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: 'ProductionOperations.js'
  });

  return {
    context,
    properties,
    props,
    ScriptApp,
    lock,
    getAdminChecks() {
      return adminChecks;
    }
  };
}

function ownTriggers(runtime) {
  return runtime.ScriptApp
    ._all()
    .filter(trigger =>
      trigger.getHandlerFunction() === HANDLER
    );
}

function main() {
  console.log(
    '=== PRODUCTION OPERATIONS SCHEDULER / RUNTIME HEALTH CERTIFICATION ==='
  );
  console.log('');

  assert.ok(
    fs.existsSync(MODULE_PATH),
    'ProductionOperations.js must exist'
  );

  const source = fs.readFileSync(MODULE_PATH, 'utf8');

  assert.ok(
    source.includes('REOS.ProductionOperations'),
    'ProductionOperations namespace is present'
  );
  pass('ProductionOperations namespace is present');

  assert.ok(
    source.includes(HANDLER),
    'dedicated production operations heartbeat handler is present'
  );
  pass('dedicated heartbeat handler is present');

  assert.match(
    source,
    /STALE_HOURS\s*=\s*48/,
    'runtime health must preserve the 48-hour stale threshold'
  );
  pass('48-hour stale-health contract is explicit');

  assert.match(
    source,
    /LockService\.getScriptLock\s*\(/,
    'heartbeat must use ScriptLock'
  );

  assert.match(
    source,
    /\.tryLock\s*\(/,
    'heartbeat must use non-overlapping lock acquisition'
  );

  assert.match(
    source,
    /\.releaseLock\s*\(/,
    'heartbeat must release its ScriptLock'
  );

  pass('heartbeat has lock / overlap protection');

  assert.match(
    source,
    /PropertiesService\.getScriptProperties\s*\(/,
    'operations telemetry must use Script Properties'
  );

  pass('bounded Script Properties telemetry is present');

  assert.match(
    source,
    /ScriptApp\s*\.\s*newTrigger\s*\(\s*HANDLER\s*\)/,
    'scheduler installer must create only the dedicated handler'
  );

  assert.match(
    source,
    /\.everyHours\s*\(\s*1\s*\)/,
    'heartbeat scheduler must run hourly'
  );

  assert.match(
    source,
    /ScriptApp\s*\.\s*getProjectTriggers\s*\(/,
    'scheduler must inspect installed trigger integrity'
  );

  assert.match(
    source,
    /ScriptApp\.deleteTrigger\s*\(/,
    'scheduler must support bounded removal'
  );

  pass('hourly dedicated scheduler-management surface is present');

  const forbidden = [
    'REOS.Automation.runAll',
    'REOS.Automation.dailyRun',
    'REOS.Automation.scanFollowUps',
    'REOS.Automation.scanOverdueTasks',
    'REOS.Automation.reviewAcquisitionLeads',
    'REOS.Acquisitions.',
    'REOS.CRM.',
    'REOS.Database.',
    'REOS.ProductionMonitoring.runSnapshot',
    'reosConnectorRun',
    'confirmLive',
    'CountyRuntimeBridge',
    'OfferDeliveryTransport',
    'GmailApp',
    'MailApp',
    'UrlFetchApp',
    'SpreadsheetApp'
  ];

  forbidden.forEach(token => {
    assert.equal(
      source.includes(token),
      false,
      'control-plane module must not contain business/live mutation surface: ' +
        token
    );
  });

  pass('control plane contains no connector/business/email/live mutation calls');

  const runtime = makeRuntime(source);
  const api = runtime.context.REOS.ProductionOperations;

  [
    'installScheduler',
    'removeScheduler',
    'getStatus',
    'heartbeat'
  ].forEach(name => {
    assert.equal(
      typeof api[name],
      'function',
      'ProductionOperations.' + name + ' must be public'
    );
  });

  pass('public production-operations API is complete');

  [
    'reosProductionOperationsInstallScheduler',
    'reosProductionOperationsRemoveScheduler',
    'reosProductionOperationsStatus',
    'reosProductionOperationsHeartbeat'
  ].forEach(name => {
    assert.equal(
      typeof runtime.context[name],
      'function',
      'global entry point missing: ' + name
    );
  });

  pass('controlled Apps Script entry points are present');

  /*
   * Install idempotence and trigger isolation.
   */
  runtime.ScriptApp._seed('unrelatedBusinessTrigger', 24);
  runtime.ScriptApp._seed(HANDLER, 1);
  runtime.ScriptApp._seed(HANDLER, 1);

  let result = api.installScheduler();

  assert.equal(result.ok, true);
  assert.equal(
    ownTriggers(runtime).length,
    1,
    'install must collapse duplicate heartbeat triggers to exactly one'
  );

  assert.equal(
    runtime.ScriptApp._all().some(
      trigger =>
        trigger.getHandlerFunction() === 'unrelatedBusinessTrigger'
    ),
    true,
    'install must preserve unrelated triggers'
  );

  assert.equal(
    ownTriggers(runtime)[0]._hours,
    1,
    'managed heartbeat must use one-hour cadence'
  );

  result = api.installScheduler();

  assert.equal(result.ok, true);
  assert.equal(
    ownTriggers(runtime).length,
    1,
    'repeated install must remain idempotent'
  );

  pass('scheduler installation is idempotent and trigger-isolated');

  /*
   * Removal isolation.
   */
  result = api.removeScheduler();

  assert.equal(result.ok, true);
  assert.equal(
    ownTriggers(runtime).length,
    0,
    'remove must remove the managed heartbeat'
  );

  assert.equal(
    runtime.ScriptApp._all().some(
      trigger =>
        trigger.getHandlerFunction() === 'unrelatedBusinessTrigger'
    ),
    true,
    'remove must preserve unrelated triggers'
  );

  result = api.removeScheduler();
  assert.equal(result.ok, true);
  assert.equal(ownTriggers(runtime).length, 0);

  pass('scheduler removal is idempotent and trigger-isolated');

  /*
   * Restore one valid managed trigger for heartbeat tests.
   */
  api.installScheduler();

  /*
   * Lock contention.
   */
  runtime.lock.available = false;

  result = api.heartbeat();

  assert.equal(
    result.skipped,
    true,
    'contended heartbeat must skip rather than overlap'
  );

  assert.equal(
    result.status,
    'Contended',
    'contended heartbeat must expose Contended status'
  );

  assert.ok(
    runtime.props.getProperty(
      'REOS_PRODUCTION_OPERATIONS_LAST_CONTENDED_AT'
    ),
    'contended heartbeat must record telemetry'
  );

  runtime.lock.available = true;

  pass('overlapping heartbeat execution fails closed as Contended');

  /*
   * Successful heartbeat.
   */
  result = api.heartbeat();

  assert.equal(
    result.ok,
    true,
    'normal heartbeat must succeed'
  );

  assert.ok(
    runtime.props.getProperty(
      'REOS_PRODUCTION_OPERATIONS_LAST_ATTEMPT_AT'
    ),
    'heartbeat must record last attempt'
  );

  assert.ok(
    runtime.props.getProperty(
      'REOS_PRODUCTION_OPERATIONS_LAST_SUCCESS_AT'
    ),
    'heartbeat must record last success'
  );

  assert.equal(
    runtime.lock.held,
    false,
    'heartbeat must release the script lock'
  );

  let status = api.getStatus();

  assert.equal(
    status.state,
    'Healthy',
    'one valid trigger plus fresh successful heartbeat must be Healthy'
  );

  pass('successful heartbeat produces Healthy runtime state');

  /*
   * 48-hour stale health.
   */
  const staleAt =
    new Date(
      Date.now() -
      ((STALE_HOURS + 1) * 60 * 60 * 1000)
    ).toISOString();

  runtime.props.setProperty(
    'REOS_PRODUCTION_OPERATIONS_LAST_SUCCESS_AT',
    staleAt
  );

  status = api.getStatus();

  assert.equal(
    status.state,
    'Stale',
    'heartbeat older than 48 hours must report Stale'
  );

  pass('48-hour stale heartbeat reports Stale');

  /*
   * Duplicate scheduler integrity.
   */
  runtime.props.setProperty(
    'REOS_PRODUCTION_OPERATIONS_LAST_SUCCESS_AT',
    new Date().toISOString()
  );

  runtime.ScriptApp._seed(HANDLER, 1);

  status = api.getStatus();

  assert.equal(
    status.state,
    'Unhealthy',
    'duplicate managed triggers must report Unhealthy'
  );

  pass('duplicate managed scheduler authority reports Unhealthy');

  /*
   * Failure telemetry.
   */
  runtime.ScriptApp._failInventory(true);

  result = api.heartbeat();

  assert.equal(
    result.ok,
    false,
    'runtime probe failure must fail closed'
  );

  assert.equal(
    result.status,
    'Unhealthy',
    'runtime probe failure must report Unhealthy'
  );

  assert.ok(
    runtime.props.getProperty(
      'REOS_PRODUCTION_OPERATIONS_LAST_FAILURE_AT'
    ),
    'failure timestamp must be persisted'
  );

  assert.ok(
    runtime.props.getProperty(
      'REOS_PRODUCTION_OPERATIONS_LAST_FAILURE_MESSAGE'
    ),
    'failure message must be persisted'
  );

  runtime.ScriptApp._failInventory(false);

  pass('heartbeat failure telemetry is persisted');

  assert.ok(
    runtime.getAdminChecks() >= 4,
    'scheduler install/remove/status controls must be admin protected'
  );

  pass('scheduler management/status controls require admin authority');

  console.log('');
  console.log(
    'Production operations scheduler/runtime health certification PASSED.'
  );
}

try {
  main();
} catch (error) {
  console.error(
    'FAIL: ' +
    (error && error.stack ? error.stack : error)
  );
  process.exit(1);
}
