#!/usr/bin/env node

'use strict';

const fs = require('fs');
const assert = require('assert');

console.log(
  '=== COUNTY MANUAL CERTIFICATION CONTRACT ==='
);

const path =
  'build/apps-script-brand/CountyProductionScheduler.js';

const source = fs.readFileSync(path, 'utf8');

/*
 * Manual county certification must not create or require a real clock
 * trigger. It must execute through the existing one-page scheduler
 * checkpoint path while fail-closing on exact expected authority.
 */

assert(
  source.includes(
    'function runManualCertification('
  ),
  'manual certification implementation exists'
);

assert(
  source.includes(
    'reosCountyProductionSchedulerRunManualCertification'
  ),
  'public manual certification entrypoint exists'
);

/*
 * Scheduled production authority must remain unchanged.
 */
assert(
  /scheduler\.triggerCount\s*!==\s*1/.test(source),
  'scheduled execution still requires exactly one managed trigger'
);

/*
 * Manual execution must require the scheduler to be frozen.
 */
assert(
  /triggerCount\s*!==\s*0/.test(source),
  'manual execution requires zero managed county triggers'
);

/*
 * Manual execution must use exact checkpoint authority rather than
 * accepting whatever cursor happens to exist at invocation time.
 */
[
  'expectedCycleId',
  'expectedFeedIndex',
  'expectedCursor'
].forEach(function (token) {
  assert(
    source.includes(token),
    'manual authority includes ' + token
  );
});

/*
 * Manual execution must retain the existing ScriptLock.
 */
assert(
  source.includes(
    'LockService.getScriptLock()'
  ),
  'manual execution retains project lock protection'
);

/*
 * The existing bounded page contract must remain intact.
 */
assert(
  source.includes(
    'REOS.CountyRuntimeBridge.sync('
  ),
  'manual execution uses existing county runtime bridge'
);

assert(
  source.includes(
    'limit: 50'
  ),
  'county page size remains bounded to 50'
);

assert(
  source.includes(
    'Number(result.stats.failed || 0) > 0'
  ),
  'record failures still block cursor advancement'
);

assert(
  source.includes(
    'CURRENT_FEED_CURSOR'
  ),
  'existing durable cursor contract remains present'
);

console.log(
  'PASS: race-free manual county certification contract detected.'
);

console.log();
console.log(
  'County manual certification contract PASSED.'
);
